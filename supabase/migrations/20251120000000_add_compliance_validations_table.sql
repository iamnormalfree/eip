-- ABOUTME: Compliance Validations Table Migration for EIP System
-- ABOUTME: Creates comprehensive compliance validation storage with audit trail
-- ABOUTME: Supports Redis → Supabase migration with backward compatibility

-- Create compliance validations table
CREATE TABLE IF NOT EXISTS eip_compliance_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES eip_jobs(id) ON DELETE CASCADE,
    artifact_id UUID REFERENCES eip_artifacts(id) ON DELETE SET NULL,
    compliance_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending', 'error')),
    compliance_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    violations_count INTEGER NOT NULL DEFAULT 0 CHECK (violations_count >= 0),
    authority_level VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (authority_level IN ('high', 'medium', 'low')),
    processing_tier VARCHAR(10) NOT NULL DEFAULT 'LIGHT' CHECK (processing_tier IN ('LIGHT', 'MEDIUM', 'HEAVY')),
    processing_time_ms INTEGER NOT NULL DEFAULT 0 CHECK (processing_time_ms >= 0),
    evidence_summary JSONB NOT NULL DEFAULT '{}',
    validation_level VARCHAR(15) NOT NULL DEFAULT 'standard' CHECK (validation_level IN ('standard', 'enhanced', 'comprehensive')),
    content_length INTEGER NOT NULL DEFAULT 0 CHECK (content_length >= 0),
    sources_count INTEGER NOT NULL DEFAULT 0 CHECK (sources_count >= 0),
    correlation_id VARCHAR(100),
    validation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    compliance_report JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance indexes for efficient API queries
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_job_id ON eip_compliance_validations(job_id);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_artifact_id ON eip_compliance_validations(artifact_id);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_status ON eip_compliance_validations(compliance_status);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_score ON eip_compliance_validations(compliance_score);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_authority_level ON eip_compliance_validations(authority_level);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_processing_tier ON eip_compliance_validations(processing_tier);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_validation_level ON eip_compliance_validations(validation_level);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_validation_timestamp ON eip_compliance_validations(validation_timestamp);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_correlation_id ON eip_compliance_validations(correlation_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_artifact_status_timestamp 
    ON eip_compliance_validations(artifact_id, compliance_status, validation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_job_timestamp 
    ON eip_compliance_validations(job_id, validation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_status_score 
    ON eip_compliance_validations(compliance_status, compliance_score DESC);

-- Create JSONB indexes for evidence summary queries
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_evidence_summary 
    ON eip_compliance_validations USING GIN (evidence_summary);
CREATE INDEX IF NOT EXISTS idx_eip_compliance_validations_compliance_report 
    ON eip_compliance_validations USING GIN (compliance_report);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_eip_compliance_validations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_eip_compliance_validations_updated_at 
    BEFORE UPDATE ON eip_compliance_validations 
    FOR EACH ROW EXECUTE FUNCTION update_eip_compliance_validations_updated_at();

-- Function to get compliance validation statistics
CREATE OR REPLACE FUNCTION get_compliance_validation_statistics(
    p_hours_back INTEGER DEFAULT 24,
    p_processing_tier VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    total_validations BIGINT,
    compliant_count BIGINT,
    non_compliant_count BIGINT,
    pending_count BIGINT,
    error_count BIGINT,
    average_score DECIMAL(5,2),
    average_processing_time_ms DECIMAL(10,2),
    high_authority_count BIGINT,
    medium_authority_count BIGINT,
    low_authority_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_validations,
        COUNT(*) FILTER (WHERE compliance_status = 'compliant') as compliant_count,
        COUNT(*) FILTER (WHERE compliance_status = 'non_compliant') as non_compliant_count,
        COUNT(*) FILTER (WHERE compliance_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE compliance_status = 'error') as error_count,
        ROUND(AVG(compliance_score), 2) as average_score,
        ROUND(AVG(processing_time_ms), 2) as average_processing_time_ms,
        COUNT(*) FILTER (WHERE authority_level = 'high') as high_authority_count,
        COUNT(*) FILTER (WHERE authority_level = 'medium') as medium_authority_count,
        COUNT(*) FILTER (WHERE authority_level = 'low') as low_authority_count
    FROM eip_compliance_validations
    WHERE 
        validation_timestamp >= NOW() - (p_hours_back || ' hours')::INTERVAL
        AND (p_processing_tier IS NULL OR processing_tier = p_processing_tier);
END;
$$ LANGUAGE plpgsql;

-- Function to get compliance trend data
CREATE OR REPLACE FUNCTION get_compliance_trend_data(
    p_days_back INTEGER DEFAULT 7,
    p_group_by_hour BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    time_bucket TIMESTAMPTZ,
    total_validations BIGINT,
    compliant_count BIGINT,
    non_compliant_count BIGINT,
    average_score DECIMAL(5,2),
    average_processing_time_ms DECIMAL(10,2)
) AS $$
DECLARE
    v_interval TEXT;
BEGIN
    IF p_group_by_hour THEN
        v_interval := '1 hour';
    ELSE
        v_interval := '1 day';
    END IF;
    
    RETURN QUERY
    SELECT 
        date_trunc(v_interval, validation_timestamp) as time_bucket,
        COUNT(*) as total_validations,
        COUNT(*) FILTER (WHERE compliance_status = 'compliant') as compliant_count,
        COUNT(*) FILTER (WHERE compliance_status = 'non_compliant') as non_compliant_count,
        ROUND(AVG(compliance_score), 2) as average_score,
        ROUND(AVG(processing_time_ms), 2) as average_processing_time_ms
    FROM eip_compliance_validations
    WHERE validation_timestamp >= NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY date_trunc(v_interval, validation_timestamp)
    ORDER BY time_bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get artifact compliance history
CREATE OR REPLACE FUNCTION get_artifact_compliance_history(
    p_artifact_id UUID,
    p_max_records INTEGER DEFAULT 10
)
RETURNS TABLE (
    validation_id UUID,
    job_id UUID,
    compliance_status VARCHAR(20),
    compliance_score INTEGER,
    violations_count INTEGER,
    authority_level VARCHAR(10),
    validation_level VARCHAR(15),
    validation_timestamp TIMESTAMPTZ,
    processing_time_ms INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.id as validation_id,
        cv.job_id,
        cv.compliance_status,
        cv.compliance_score,
        cv.violations_count,
        cv.authority_level,
        cv.validation_level,
        cv.validation_timestamp,
        cv.processing_time_ms
    FROM eip_compliance_validations cv
    WHERE cv.artifact_id = p_artifact_id
    ORDER BY cv.validation_timestamp DESC
    LIMIT p_max_records;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old compliance validations (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_compliance_validations(
    p_days_to_keep INTEGER DEFAULT 90
)
RETURNS TABLE (
    deleted_count BIGINT,
    retention_days INTEGER
) AS $$
DECLARE
    v_deleted_count BIGINT;
BEGIN
    DELETE FROM eip_compliance_validations 
    WHERE validation_timestamp < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_count, p_days_to_keep;
END;
$$ LANGUAGE plpgsql;

-- View for compliance validation summary
CREATE OR REPLACE VIEW compliance_validation_summary AS
SELECT 
    cv.id,
    cv.job_id,
    cv.artifact_id,
    cv.compliance_status,
    cv.compliance_score,
    cv.violations_count,
    cv.authority_level,
    cv.processing_tier,
    cv.validation_level,
    cv.validation_timestamp,
    cv.processing_time_ms,
    ej.brief as job_brief,
    ea.brief as artifact_brief,
    ea.status as artifact_status,
    CASE 
        WHEN cv.compliance_score >= 80 THEN 'high'
        WHEN cv.compliance_score >= 60 THEN 'medium'
        ELSE 'low'
    END as quality_tier,
    CASE 
        WHEN cv.validation_timestamp > NOW() - INTERVAL '7 days' THEN 'recent'
        WHEN cv.validation_timestamp > NOW() - INTERVAL '30 days' THEN 'moderate'
        ELSE 'old'
    END as freshness_category
FROM eip_compliance_validations cv
LEFT JOIN eip_jobs ej ON cv.job_id = ej.id
LEFT JOIN eip_artifacts ea ON cv.artifact_id = ea.id;

-- Enable Row Level Security (RLS) for compliance data
ALTER TABLE eip_compliance_validations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read compliance validations
CREATE POLICY "Allow read access to compliance validations for authenticated users" 
    ON eip_compliance_validations 
    FOR SELECT 
    USING (
        -- Check if auth functions exist, otherwise allow all authenticated users
        (EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'role' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ) AND auth.role() = 'authenticated') 
        OR 
        -- Fallback for systems without Supabase auth
        (NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'role' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ))
    );

-- Policy for service users to write compliance validations
CREATE POLICY "Allow write access to compliance validations for service users" 
    ON eip_compliance_validations 
    FOR INSERT WITH CHECK (
        -- Check if auth functions exist and role is service
        (EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'role' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ) AND auth.jwt() ->> 'role' = 'service')
        OR
        -- Fallback for systems without Supabase auth
        (NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'role' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ))
    );

-- Policy for service users to update compliance validations
CREATE POLICY "Allow update access to compliance validations for service users" 
    ON eip_compliance_validations 
    FOR UPDATE 
    USING (
        -- Check if auth functions exist and role is service
        (EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'role' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ) AND auth.jwt() ->> 'role' = 'service')
        OR
        -- Fallback for systems without Supabase auth
        (NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'role' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        ))
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON eip_compliance_validations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON compliance_validation_summary TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE eip_compliance_validations IS 'EIP Compliance validation results with comprehensive audit trail and Redis migration support';
COMMENT ON COLUMN eip_compliance_validations.evidence_summary IS 'Structured summary of evidence sources and their authority levels';
COMMENT ON COLUMN eip_compliance_validations.compliance_report IS 'Full detailed compliance report with violations and recommendations';
