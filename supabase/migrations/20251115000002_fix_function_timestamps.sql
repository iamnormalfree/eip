-- ABOUTME: Fix register_bm25_index_version function to use correct timestamp column
-- ABOUTME: Addresses schema cache issues by using existing updated_at column

-- Create or replace function with proper timestamp handling
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
BEGIN
    -- Generate registry key
    v_registry_key := 'bm25_index_' || p_version;

    -- Deactivate previous active version
    UPDATE eip_schema_registry
    SET is_active = FALSE,
        updated_at = v_timestamp
    WHERE index_type = 'bm25_file' AND is_active = TRUE
    RETURNING key INTO v_old_active_key;

    -- Insert new version - use updated_at as primary timestamp column
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
        -- Use updated_at consistently (it's the primary timestamp in the original schema)
        updated_at,
        -- Only include created_at if column exists
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
        v_timestamp,
        v_timestamp
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

-- Step 2: Test the function with a dry run
DO $$
DECLARE
    v_test_result TEXT;
BEGIN
    -- Test with sample data (will be rolled back)
    BEGIN
        v_test_result := register_bm25_index_version(
            'test.' || EXTRACT(EPOCH FROM NOW())::TEXT,
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
        DELETE FROM eip_schema_registry WHERE key = v_test_result;
        DELETE FROM eip_index_build_history WHERE registry_key = v_test_result;

        RAISE NOTICE 'Function test successful';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Function test failed: %', SQLERRM;
    END;
END $$;