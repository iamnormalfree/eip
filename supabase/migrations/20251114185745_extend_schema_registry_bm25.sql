-- ABOUTME: Extend EIP Schema Registry for BM25 Index Version Tracking
-- ABOUTME: Phase 1 implementation of unified blueprint for retrieval stack enhancement

-- Step 1: Add new columns to eip_schema_registry for BM25 index support
-- These columns are nullable to maintain backward compatibility
ALTER TABLE eip_schema_registry 
ADD COLUMN IF NOT EXISTS index_type TEXT,
ADD COLUMN IF NOT EXISTS document_sources TEXT[],
ADD COLUMN IF NOT EXISTS field_weights JSONB,
ADD COLUMN IF NOT EXISTS build_metadata JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS index_size_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS build_duration_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_version TEXT,
ADD COLUMN IF NOT EXISTS rollback_version TEXT;

-- Step 2: Add constraints for data integrity
ALTER TABLE eip_schema_registry 
ADD CONSTRAINT IF NOT EXISTS check_index_type 
  CHECK (index_type IN ('bm25_file', 'vector_db', 'hybrid', 'legacy')),
ADD CONSTRAINT IF NOT EXISTS check_version_format 
  CHECK (version ~ '^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$'),
ADD CONSTRAINT IF NOT EXISTS check_checksum_format 
  CHECK (checksum ~ '^sha256:[a-f0-9]{64}$'),
ADD CONSTRAINT IF NOT EXISTS check_document_count_positive 
  CHECK (document_count >= 0),
ADD CONSTRAINT IF NOT EXISTS check_build_duration_positive 
  CHECK (build_duration_ms >= 0),
ADD CONSTRAINT IF NOT EXISTS check_index_size_positive 
  CHECK (index_size_bytes >= 0);

-- Step 3: Create supporting table for index build history
CREATE TABLE IF NOT EXISTS eip_index_build_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_key TEXT NOT NULL REFERENCES eip_schema_registry(key),
    build_type TEXT NOT NULL CHECK (build_type IN ('full', 'incremental', 'rollback')),
    build_status TEXT NOT NULL CHECK (build_status IN ('started', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    build_duration_ms INTEGER,
    sources_processed INTEGER DEFAULT 0,
    documents_added INTEGER DEFAULT 0,
    documents_updated INTEGER DEFAULT 0,
    documents_removed INTEGER DEFAULT 0,
    build_error TEXT,
    build_metadata JSONB DEFAULT '{}',
    checksum_before TEXT,
    checksum_after TEXT
);

-- Step 4: Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_eip_schema_registry_index_type ON eip_schema_registry(index_type);
CREATE INDEX IF NOT EXISTS idx_eip_schema_registry_version ON eip_schema_registry(version);
CREATE INDEX IF NOT EXISTS idx_eip_schema_registry_created_at ON eip_schema_registry(created_at);
CREATE INDEX IF NOT EXISTS idx_eip_schema_registry_is_active ON eip_schema_registry(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_eip_schema_registry_document_sources ON eip_schema_registry USING GIN(document_sources);
CREATE INDEX IF NOT EXISTS idx_eip_schema_registry_field_weights ON eip_schema_registry USING GIN(field_weights);

-- Indexes for build history table
CREATE INDEX IF NOT EXISTS idx_eip_index_build_history_registry_key ON eip_index_build_history(registry_key);
CREATE INDEX IF NOT EXISTS idx_eip_index_build_history_started_at ON eip_index_build_history(started_at);
CREATE INDEX IF NOT EXISTS idx_eip_index_build_history_build_status ON eip_index_build_history(build_status);

-- Step 5: Create function to register new BM25 index version
CREATE OR REPLACE FUNCTION register_bm25_index_version(
    p_version TEXT,
    p_checksum TEXT,
    p_document_sources TEXT[],
    p_field_weights JSONB DEFAULT '{}',
    p_build_metadata JSONB DEFAULT '{}',
    p_index_size_bytes BIGINT DEFAULT 0,
    p_document_count INTEGER DEFAULT 0,
    p_build_duration_ms INTEGER DEFAULT 0,
    p_parent_version TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_registry_key TEXT;
    v_old_active_key TEXT;
BEGIN
    -- Generate registry key
    v_registry_key := 'bm25_index_' || p_version;
    
    -- Deactivate previous active version
    UPDATE eip_schema_registry 
    SET is_active = FALSE 
    WHERE index_type = 'bm25_file' AND is_active = TRUE
    RETURNING key INTO v_old_active_key;
    
    -- Insert new version
    INSERT INTO eip_schema_registry (
        key, 
        version, 
        checksum, 
        index_type, 
        document_sources, 
        field_weights, 
        build_metadata,
        index_size_bytes,
        document_count,
        build_duration_ms,
        is_active,
        parent_version,
        created_at
    ) VALUES (
        v_registry_key,
        p_version,
        p_checksum,
        'bm25_file',
        p_document_sources,
        p_field_weights,
        p_build_metadata,
        p_index_size_bytes,
        p_document_count,
        p_build_duration_ms,
        TRUE,
        p_parent_version,
        NOW()
    );
    
    -- Record build history
    INSERT INTO eip_index_build_history (
        registry_key,
        build_type,
        build_status,
        started_at,
        completed_at,
        build_duration_ms,
        documents_added,
        checksum_after,
        build_metadata
    ) VALUES (
        v_registry_key,
        CASE WHEN p_parent_version IS NULL THEN 'full' ELSE 'incremental' END,
        'completed',
        NOW(),
        NOW(),
        p_build_duration_ms,
        p_document_count,
        p_checksum,
        p_build_metadata
    );
    
    RETURN v_registry_key;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback activation on error
        IF v_old_active_key IS NOT NULL THEN
            UPDATE eip_schema_registry 
            SET is_active = TRUE 
            WHERE key = v_old_active_key;
        END IF;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to validate index checksum
CREATE OR REPLACE FUNCTION validate_index_checksum(
    p_registry_key TEXT,
    p_expected_checksum TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stored_checksum TEXT;
BEGIN
    SELECT checksum INTO v_stored_checksum
    FROM eip_schema_registry
    WHERE key = p_registry_key;
    
    IF v_stored_checksum IS NULL THEN
        RAISE EXCEPTION 'Index version not found: %', p_registry_key;
    END IF;
    
    RETURN v_stored_checksum = p_expected_checksum;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to rollback to previous index version
CREATE OR REPLACE FUNCTION rollback_bm25_index(
    p_target_version TEXT,
    p_reason TEXT DEFAULT 'Manual rollback'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_target_key TEXT;
    v_current_active_key TEXT;
    v_rollback_key TEXT;
BEGIN
    -- Find target version
    SELECT key INTO v_target_key
    FROM eip_schema_registry
    WHERE version = p_target_version AND index_type = 'bm25_file';
    
    IF v_target_key IS NULL THEN
        RAISE EXCEPTION 'Target version not found: %', p_target_version;
    END IF;
    
    -- Find current active version
    SELECT key INTO v_current_active_key
    FROM eip_schema_registry
    WHERE index_type = 'bm25_file' AND is_active = TRUE;
    
    -- Deactivate current version
    IF v_current_active_key IS NOT NULL THEN
        UPDATE eip_schema_registry
        SET is_active = FALSE,
            rollback_version = p_target_version,
            updated_at = NOW()
        WHERE key = v_current_active_key;
    END IF;
    
    -- Activate target version
    UPDATE eip_schema_registry
    SET is_active = TRUE,
        updated_at = NOW()
    WHERE key = v_target_key;
    
    -- Create rollback registry entry
    v_rollback_key := 'bm25_rollback_' || p_target_version || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    INSERT INTO eip_schema_registry (
        key,
        version,
        checksum,
        index_type,
        document_sources,
        field_weights,
        build_metadata,
        is_active,
        parent_version,
        created_at
    ) SELECT 
        v_rollback_key,
        version || '_rollback_' || EXTRACT(EPOCH FROM NOW())::TEXT,
        checksum,
        'bm25_file',
        document_sources,
        field_weights,
        jsonb_set(build_metadata, '{rollback_reason}', to_jsonb(p_reason)),
        FALSE,
        version,
        NOW()
    FROM eip_schema_registry
    WHERE key = v_target_key;
    
    -- Record rollback in build history
    INSERT INTO eip_index_build_history (
        registry_key,
        build_type,
        build_status,
        started_at,
        completed_at,
        build_metadata,
        checksum_before,
        checksum_after
    ) VALUES (
        v_current_active_key,
        'rollback',
        'completed',
        NOW(),
        NOW(),
        jsonb_build_object('reason', p_reason, 'target_version', p_target_version),
        (SELECT checksum FROM eip_schema_registry WHERE key = v_current_active_key),
        (SELECT checksum FROM eip_schema_registry WHERE key = v_target_key)
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to get active BM25 index version
CREATE OR REPLACE FUNCTION get_active_bm25_index()
RETURNS TABLE (
    registry_key TEXT,
    version TEXT,
    checksum TEXT,
    document_sources TEXT[],
    field_weights JSONB,
    document_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.key,
        sr.version,
        sr.checksum,
        sr.document_sources,
        sr.field_weights,
        sr.document_count,
        sr.created_at
    FROM eip_schema_registry sr
    WHERE sr.index_type = 'bm25_file' AND sr.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create view for index version overview
CREATE OR REPLACE VIEW v_bm25_index_versions AS
SELECT 
    sr.key,
    sr.version,
    sr.checksum,
    sr.document_sources,
    sr.field_weights,
    sr.document_count,
    sr.index_size_bytes,
    sr.build_duration_ms,
    sr.created_at,
    sr.updated_at,
    sr.is_active,
    sr.parent_version,
    sr.rollback_version,
    -- Count builds for this version
    (SELECT COUNT(*) FROM eip_index_build_history bh WHERE bh.registry_key = sr.key) as build_count,
    -- Get latest build status
    (SELECT bh.build_status FROM eip_index_build_history bh 
     WHERE bh.registry_key = sr.key 
     ORDER BY bh.started_at DESC LIMIT 1) as latest_build_status
FROM eip_schema_registry sr
WHERE sr.index_type = 'bm25_file'
ORDER BY sr.created_at DESC;

-- Grant necessary permissions (adjust based on your auth setup)
-- GRANT ALL ON eip_index_build_history TO authenticated;
-- GRANT ALL ON eip_index_build_history TO service_role;
-- GRANT EXECUTE ON ALL FUNCTIONS TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS TO service_role;

COMMENT ON TABLE eip_index_build_history IS 'Audit trail for BM25 index build operations';
COMMENT ON FUNCTION register_bm25_index_version IS 'Register a new BM25 index version with metadata';
COMMENT ON FUNCTION validate_index_checksum IS 'Validate index checksum against stored value';
COMMENT ON FUNCTION rollback_bm25_index IS 'Rollback to a previous BM25 index version';
COMMENT ON FUNCTION get_active_bm25_index IS 'Get currently active BM25 index version';
COMMENT ON VIEW v_bm25_index_versions IS 'Overview of all BM25 index versions with build history';
