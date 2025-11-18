-- Quick fix for schema registry created_at column issue
-- Apply this directly in Supabase SQL editor

-- Step 1: Add created_at column if it doesn't exist
ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Update any existing records without created_at
UPDATE eip_schema_registry
SET created_at = COALESCE(created_at, updated_at, NOW())
WHERE created_at IS NULL;

-- Step 3: Recreate the function to handle both cases
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
    v_timestamp TIMESTAMPTZ := NOW();
    v_has_created_at BOOLEAN;
BEGIN
    -- Check if created_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'eip_schema_registry'
        AND column_name = 'created_at'
    ) INTO v_has_created_at;

    -- Generate registry key
    v_registry_key := 'bm25_index_' || p_version;

    -- Deactivate previous active version
    UPDATE eip_schema_registry
    SET is_active = FALSE,
        updated_at = v_timestamp
    WHERE index_type = 'bm25_file' AND is_active = TRUE
    RETURNING key INTO v_old_active_key;

    -- Insert new version with conditional created_at usage
    IF v_has_created_at THEN
        INSERT INTO eip_schema_registry (
            key, version, checksum, index_type, document_sources,
            field_weights, build_metadata, index_size_bytes, document_count,
            build_duration_ms, is_active, parent_version, created_at, updated_at
        ) VALUES (
            v_registry_key, p_version, p_checksum, 'bm25_file', p_document_sources,
            p_field_weights, p_build_metadata, p_index_size_bytes, p_document_count,
            p_build_duration_ms, TRUE, p_parent_version, v_timestamp, v_timestamp
        );
    ELSE
        INSERT INTO eip_schema_registry (
            key, version, checksum, index_type, document_sources,
            field_weights, build_metadata, index_size_bytes, document_count,
            build_duration_ms, is_active, parent_version, updated_at
        ) VALUES (
            v_registry_key, p_version, p_checksum, 'bm25_file', p_document_sources,
            p_field_weights, p_build_metadata, p_index_size_bytes, p_document_count,
            p_build_duration_ms, TRUE, p_parent_version, v_timestamp
        );
    END IF;

    -- Record build history
    INSERT INTO eip_index_build_history (
        registry_key, build_type, build_status, started_at, completed_at,
        build_duration_ms, documents_added, checksum_after, build_metadata
    ) VALUES (
        v_registry_key,
        CASE WHEN p_parent_version IS NULL THEN 'full' ELSE 'incremental' END,
        'completed',
        v_timestamp,
        v_timestamp,
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

-- Test the function
SELECT register_bm25_index_version(
    'test.1.0.0',
    'sha256:test1234567890123456789012345678901234567890123456789012345678901234',
    ARRAY['test_source'],
    '{"test": "metadata"}'::jsonb,
    '{"test": "build"}'::jsonb,
    1024,
    1,
    1000,
    NULL
);

-- Clean up test data
DELETE FROM eip_index_build_history WHERE registry_key = 'bm25_index_test.1.0.0';
DELETE FROM eip_schema_registry WHERE key = 'bm25_index_test.1.0.0';

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'eip_schema_registry'
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;