-- ABOUTME: Fix schema alignment for created_at column in eip_schema_registry
-- ABOUTME: Ensures migration applies correctly and handles cache refresh

-- Step 1: Force add created_at column if it doesn't exist (handles cache issues)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'eip_schema_registry'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE eip_schema_registry
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to eip_schema_registry';
    ELSE
        RAISE NOTICE 'created_at column already exists in eip_schema_registry';
    END IF;
END $$;

-- Step 2: Update existing rows that don't have created_at set
UPDATE eip_schema_registry
SET created_at = COALESCE(created_at, updated_at, NOW())
WHERE created_at IS NULL;

-- Step 3: Refresh materialized view cache if any
REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS pg_stat_user_tables;

-- Step 4: Verify schema is correct
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'eip_schema_registry'
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;