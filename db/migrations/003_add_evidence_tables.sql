-- ABOUTME: Evidence Tables Migration for EIP Compliance System
-- ABOUTME: Adds evidence snapshots and registry tables for link checking and freshness tracking
-- ABOUTME: Supports versioned content tracking and accessibility monitoring

-- Evidence snapshots table - stores versioned content snapshots
CREATE TABLE IF NOT EXISTS evidence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_url TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content_hash TEXT,
  title TEXT,
  last_checked TIMESTAMP WITH TIME ZONE,
  freshness_category TEXT NOT NULL DEFAULT 'default',
  url_accessible BOOLEAN DEFAULT false,
  http_status_code INTEGER,
  response_time_ms INTEGER,
  content_length_bytes INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(canonical_url, version)
);

-- Evidence registry table - tracks URLs across all versions
CREATE TABLE IF NOT EXISTS evidence_registry (
  canonical_url TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified TIMESTAMP WITH TIME ZONE,
  verification_status TEXT DEFAULT 'unknown' CHECK (verification_status IN ('unknown', 'accessible', 'inaccessible', 'redirected', 'error')),
  total_versions INTEGER DEFAULT 1,
  latest_version INTEGER DEFAULT 1,
  latest_successful_check TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  domain_authority_level TEXT DEFAULT 'low' CHECK (domain_authority_level IN ('high', 'medium', 'low')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_canonical_url ON evidence_snapshots(canonical_url);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_last_checked ON evidence_snapshots(last_checked);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_freshness_category ON evidence_snapshots(freshness_category);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_url_accessible ON evidence_snapshots(url_accessible);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_content_hash ON evidence_snapshots(content_hash);

CREATE INDEX IF NOT EXISTS idx_evidence_registry_domain ON evidence_registry(domain);
CREATE INDEX IF NOT EXISTS idx_evidence_registry_last_verified ON evidence_registry(last_verified);
CREATE INDEX IF NOT EXISTS idx_evidence_registry_verification_status ON evidence_registry(verification_status);
CREATE INDEX IF NOT EXISTS idx_evidence_registry_domain_authority_level ON evidence_registry(domain_authority_level);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evidence_snapshots_updated_at 
    BEFORE UPDATE ON evidence_snapshots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_registry_updated_at 
    BEFORE UPDATE ON evidence_registry 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to canonicalize URLs
CREATE OR REPLACE FUNCTION canonicalize_url(input_url TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized_url TEXT;
BEGIN
    -- Remove fragments (#) and trailing slashes
    normalized_url := regexp_replace(input_url, '/#.*$', '');
    normalized_url := regexp_replace(normalized_url, '/$', '');
    
    -- Convert to lowercase
    normalized_url := lower(normalized_url);
    
    RETURN normalized_url;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create or update evidence snapshot
CREATE OR REPLACE FUNCTION upsert_evidence_snapshot(
    p_canonical_url TEXT,
    p_content_hash TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_freshness_category TEXT DEFAULT 'default',
    p_url_accessible BOOLEAN DEFAULT false,
    p_http_status_code INTEGER DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_content_length_bytes INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
    new_version INTEGER;
    existing_snapshot RECORD;
BEGIN
    -- Get the latest version for this URL
    SELECT COALESCE(MAX(version), 0) + 1 INTO new_version
    FROM evidence_snapshots 
    WHERE canonical_url = p_canonical_url;
    
    -- Insert new snapshot
    INSERT INTO evidence_snapshots (
        canonical_url,
        version,
        content_hash,
        title,
        last_checked,
        freshness_category,
        url_accessible,
        http_status_code,
        response_time_ms,
        content_length_bytes,
        error_message,
        metadata
    ) VALUES (
        p_canonical_url,
        new_version,
        p_content_hash,
        p_title,
        NOW(),
        p_freshness_category,
        p_url_accessible,
        p_http_status_code,
        p_response_time_ms,
        p_content_length_bytes,
        p_error_message,
        p_metadata
    ) RETURNING id INTO snapshot_id;
    
    -- Update or create registry entry
    INSERT INTO evidence_registry (
        canonical_url,
        domain,
        last_verified,
        verification_status,
        total_versions,
        latest_version,
        latest_successful_check,
        consecutive_failures
    ) VALUES (
        p_canonical_url,
        split_part(p_canonical_url, '/', 3),
        NOW(),
        CASE WHEN p_url_accessible THEN 'accessible' ELSE 'inaccessible' END,
        new_version,
        new_version,
        CASE WHEN p_url_accessible THEN NOW() ELSE latest_successful_check END,
        CASE WHEN p_url_accessible THEN 0 ELSE consecutive_failures + 1 END
    )
    ON CONFLICT (canonical_url) DO UPDATE SET
        last_verified = NOW(),
        verification_status = CASE WHEN EXCLUDED.verification_status = 'accessible' THEN 'accessible' ELSE evidence_registry.verification_status END,
        total_versions = evidence_registry.total_versions + 1,
        latest_version = new_version,
        latest_successful_check = CASE WHEN p_url_accessible THEN NOW() ELSE evidence_registry.latest_successful_check END,
        consecutive_failures = CASE WHEN p_url_accessible THEN 0 ELSE evidence_registry.consecutive_failures + 1 END;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get freshness statistics
CREATE OR REPLACE FUNCTION get_freshness_statistics(p_category TEXT DEFAULT NULL)
RETURNS TABLE(
    total_urls BIGINT,
    accessible_urls BIGINT,
    inaccessible_urls BIGINT,
    avg_response_time DECIMAL,
    avg_consecutive_failures DECIMAL,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_urls,
        COUNT(*) FILTER (WHERE verification_status = 'accessible') as accessible_urls,
        COUNT(*) FILTER (WHERE verification_status = 'inaccessible') as inaccessible_urls,
        AVG(s.response_time_ms) as avg_response_time,
        AVG(r.consecutive_failures) as avg_consecutive_failures,
        p_category as category
    FROM evidence_registry r
    LEFT JOIN LATERAL (
        SELECT response_time_ms
        FROM evidence_snapshots s
        WHERE s.canonical_url = r.canonical_url
        ORDER BY s.created_at DESC
        LIMIT 1
    ) s ON true
    WHERE (p_category IS NULL OR r.latest_version IN (
        SELECT version FROM evidence_snapshots 
        WHERE canonical_url = r.canonical_url AND freshness_category = p_category
        ORDER BY created_at DESC
        LIMIT 1
    ));
END;
$$ LANGUAGE plpgsql;

-- View for evidence summary (latest snapshot per URL)
CREATE OR REPLACE VIEW evidence_latest_summary AS
SELECT DISTINCT ON (es.canonical_url)
    es.canonical_url,
    es.version,
    es.content_hash,
    es.title,
    es.last_checked,
    es.freshness_category,
    es.url_accessible,
    es.http_status_code,
    es.response_time_ms,
    es.content_length_bytes,
    es.error_message,
    r.domain,
    r.verification_status,
    r.domain_authority_level,
    r.consecutive_failures,
    CASE 
        WHEN es.last_checked > NOW() - INTERVAL '7 days' THEN 'fresh'
        WHEN es.last_checked > NOW() - INTERVAL '30 days' THEN 'stale'
        ELSE 'very_stale'
    END as freshness_status
FROM evidence_snapshots es
JOIN evidence_registry r ON es.canonical_url = r.canonical_url
ORDER BY es.canonical_url, es.version DESC;

-- CRITICAL FIX: Validate auth system compatibility before enabling RLS
-- First, check if authentication functions exist
DO $$
DECLARE
    auth_functions_exist BOOLEAN;
BEGIN
    -- Check if Supabase auth functions are available
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'role'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) INTO auth_functions_exist;

    IF auth_functions_exist THEN
        -- Enable Row Level Security (RLS) only if auth functions exist
        ALTER TABLE evidence_snapshots ENABLE ROW LEVEL SECURITY;
        ALTER TABLE evidence_registry ENABLE ROW LEVEL SECURITY;

        -- Policy to allow read access to authenticated users
        CREATE POLICY "Allow read access to evidence snapshots" ON evidence_snapshots
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow read access to evidence registry" ON evidence_registry
            FOR SELECT USING (auth.role() = 'authenticated');

        -- Policy to allow write access to service users
        CREATE POLICY "Allow write access to evidence snapshots" ON evidence_snapshots
            FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service');

        CREATE POLICY "Allow update access to evidence snapshots" ON evidence_snapshots
            FOR UPDATE USING (auth.jwt() ->> 'role' = 'service');

        CREATE POLICY "Allow write access to evidence registry" ON evidence_registry
            FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service');

        CREATE POLICY "Allow update access to evidence registry" ON evidence_registry
            FOR UPDATE USING (auth.jwt() ->> 'role' = 'service');

        RAISE NOTICE 'Row Level Security enabled with Supabase auth policies';
    ELSE
        -- Create fallback policies for systems without Supabase auth
        ALTER TABLE evidence_snapshots DISABLE ROW LEVEL SECURITY;
        ALTER TABLE evidence_registry DISABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Row Level Security disabled - auth system not detected. Manual configuration required.';
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON evidence_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON evidence_registry TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON evidence_latest_summary TO authenticated;
