-- Simple fix for schema registry - works with original schema
-- Apply this directly in Supabase SQL editor

-- Step 1: Check current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'eip_schema_registry'
ORDER BY column_name;

-- Step 2: Add missing columns that the BM25 extension needs
ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS index_type TEXT DEFAULT 'bm25_file';

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS document_sources TEXT[];

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS field_weights JSONB DEFAULT '{}';

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS build_metadata JSONB DEFAULT '{}';

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS index_size_bytes BIGINT DEFAULT 0;

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0;

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS build_duration_ms INTEGER DEFAULT 0;

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

ALTER TABLE eip_schema_registry
ADD COLUMN IF NOT EXISTS parent_version TEXT;

-- Step 3: Update existing records to have proper values
UPDATE eip_schema_registry
SET
    created_at = COALESCE(created_at, updated_at, NOW()),
    index_type = COALESCE(index_type, 'legacy'),
    is_active = CASE WHEN is_active IS NULL THEN FALSE ELSE is_active END
WHERE index_type IS NULL OR created_at IS NULL;

-- Step 4: Create a simple version of the function that works
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
    v_timestamp TIMESTAMPTZ := NOW();
BEGIN
    -- Generate registry key
    v_registry_key := 'bm25_index_' || p_version;

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
        created_at,
        updated_at
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

    RETURN v_registry_key;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to register BM25 index version %: %', p_version, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Test the function
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

-- Step 6: Verify the test record was created
SELECT key, version, index_type, created_at, is_active
FROM eip_schema_registry
WHERE key = 'bm25_index_test.1.0.0';

-- Step 7: Clean up test data
DELETE FROM eip_schema_registry WHERE key = 'bm25_index_test.1.0.0';

-- Step 8: Show final schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'eip_schema_registry'
ORDER BY column_name;