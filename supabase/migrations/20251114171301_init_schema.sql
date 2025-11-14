-- ABOUTME: EIP Unified Schema (Schema Rewrite with Comprehensive Fields)
-- ABOUTME: Implements production-ready EIP schema with queue support and job lifecycle

-- EIP Schema Registry (version tracking for EIP components)
CREATE TABLE IF NOT EXISTS eip_schema_registry (
    key TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    checksum TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EIP Evidence Registry (compliance allow-list domains)
CREATE TABLE IF NOT EXISTS eip_evidence_registry (
    evidence_key TEXT PRIMARY KEY,
    allow_web BOOLEAN DEFAULT FALSE,
    allow_domains TEXT[]
);

-- EIP Entities (generic entities with eip_ prefix)
CREATE TABLE IF NOT EXISTS eip_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,              -- e.g., 'concept','persona','offer','odoo_module','rate_snapshot'
    name TEXT NOT NULL,
    attrs JSONB NOT NULL DEFAULT '{}',
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    source_url TEXT
);

-- Indexes for eip_entities
CREATE INDEX IF NOT EXISTS idx_eip_entities_type_name ON eip_entities (type, name);
CREATE INDEX IF NOT EXISTS idx_eip_entities_attrs ON eip_entities USING GIN (attrs);

-- EIP Evidence Snapshots (versioned evidence with eip_ prefix)
CREATE TABLE IF NOT EXISTS eip_evidence_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_key TEXT NOT NULL REFERENCES eip_evidence_registry(evidence_key),
    version TEXT NOT NULL,              -- semver
    data JSONB NOT NULL,
    last_checked DATE NOT NULL
);

-- Unique index for eip_evidence_snapshots
CREATE UNIQUE INDEX IF NOT EXISTS idx_eip_evidence_snapshots_key_version 
    ON eip_evidence_snapshots (evidence_key, version);

-- Drop dependent tables explicitly to avoid cascading deletes
DROP TABLE IF EXISTS eip_artifacts;
DROP TABLE IF EXISTS eip_jobs;

CREATE TABLE eip_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief TEXT NOT NULL,
    persona VARCHAR(100),
    funnel VARCHAR(100),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('LIGHT', 'MEDIUM', 'HEAVY')),
    correlation_id VARCHAR(100),
    queue_job_id VARCHAR(100),             -- BullMQ job reference
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','dlq')),
    stage VARCHAR(50),                     -- Current processing stage
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    inputs JSONB,                          -- Job inputs and parameters
    outputs JSONB,                         -- Job outputs and results
    budget_tracker JSONB,                  -- Real-time budget state
    error_details JSONB,                   -- Error context for DLQ
    retry_count INTEGER DEFAULT 0,
    tokens INTEGER,
    cost_cents INTEGER,
    duration_ms INTEGER,
    fail_reason TEXT
);

CREATE TABLE eip_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES eip_jobs(id),
    brief TEXT NOT NULL,
    ip_used VARCHAR(100) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('LIGHT', 'MEDIUM', 'HEAVY')),
    jsonld JSONB,
    persona VARCHAR(100),
    funnel VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('seed','draft','published','rejected')),
    content TEXT,
    ledger JSONB NOT NULL DEFAULT '{}',
    invariants JSONB,
    sources JSONB,
    reviewer_score INTEGER CHECK (reviewer_score >= 1 AND reviewer_score <= 5),
    slug TEXT UNIQUE,
    frontmatter JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced indexes for eip_jobs / eip_artifacts
CREATE INDEX idx_eip_jobs_correlation_id ON eip_jobs (correlation_id);
CREATE INDEX idx_eip_jobs_queue_job_id ON eip_jobs (queue_job_id);
CREATE INDEX idx_eip_jobs_status ON eip_jobs (status);
CREATE INDEX idx_eip_jobs_stage ON eip_jobs (stage);
CREATE INDEX idx_eip_jobs_tier ON eip_jobs (tier);
CREATE INDEX idx_eip_jobs_started_at ON eip_jobs (started_at);
CREATE INDEX idx_eip_artifacts_job_id ON eip_artifacts (job_id);
CREATE INDEX idx_eip_artifacts_status ON eip_artifacts (status);
CREATE INDEX idx_eip_artifacts_tier ON eip_artifacts (tier);
CREATE INDEX idx_eip_artifacts_persona ON eip_artifacts (persona);
CREATE INDEX idx_eip_artifacts_funnel ON eip_artifacts (funnel);
CREATE INDEX idx_eip_artifacts_ip_used ON eip_artifacts (ip_used);
CREATE INDEX idx_eip_artifacts_ledger ON eip_artifacts USING GIN (ledger);
CREATE INDEX idx_eip_artifacts_sources ON eip_artifacts USING GIN (sources);

CREATE TABLE IF NOT EXISTS eip_brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT UNIQUE,
    version TEXT NOT NULL,
    profile_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMOVED: Broker bridge functions - broker era baggage cleaned up

-- NEW: Queue management functions for production EIP workflows

-- Function to get next job from queue (for workers)
CREATE OR REPLACE FUNCTION get_next_eip_job(
    p_worker_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    job_id UUID,
    brief TEXT,
    persona TEXT,
    funnel TEXT,
    tier TEXT,
    queue_job_id TEXT,
    correlation_id TEXT
) AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Get the next queued job and mark it as processing
    UPDATE eip_jobs 
    SET status = 'processing', 
        stage = 'assigned_to_worker'
    WHERE id = (
        SELECT id FROM eip_jobs 
        WHERE status = 'queued' 
        ORDER BY created_at ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT 1
    )
    RETURNING id, brief, persona, funnel, tier, queue_job_id, correlation_id
    INTO v_job_id, get_next_eip_job.brief, get_next_eip_job.persona, get_next_eip_job.funnel, 
         get_next_eip_job.tier, get_next_eip_job.queue_job_id, get_next_eip_job.correlation_id;
    
    RETURN QUERY SELECT v_job_id, get_next_eip_job.brief, get_next_eip_job.persona, 
                        get_next_eip_job.funnel, get_next_eip_job.tier, get_next_eip_job.queue_job_id,
                        get_next_eip_job.correlation_id
    WHERE v_job_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to complete job successfully
CREATE OR REPLACE FUNCTION complete_eip_job(
    p_job_id UUID,
    p_outputs JSONB DEFAULT NULL,
    p_tokens INTEGER DEFAULT NULL,
    p_cost_cents INTEGER DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE eip_jobs 
    SET status = 'completed',
        stage = 'completed',
        completed_at = NOW(),
        outputs = p_outputs,
        tokens = p_tokens,
        cost_cents = p_cost_cents,
        duration_ms = p_duration_ms
    WHERE id = p_job_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to fail job to DLQ
CREATE OR REPLACE FUNCTION fail_eip_job_to_dlq(
    p_job_id UUID,
    p_error_details JSONB,
    p_fail_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE eip_jobs 
    SET status = 'dlq',
        stage = 'dead_letter_queue',
        completed_at = NOW(),
        error_details = p_error_details,
        fail_reason = COALESCE(p_fail_reason, 'Unknown error'),
        retry_count = retry_count + 1
    WHERE id = p_job_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get job statistics (for monitoring)
CREATE OR REPLACE FUNCTION get_eip_job_stats(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    status TEXT,
    job_count BIGINT,
    avg_duration_ms NUMERIC,
    avg_cost_cents NUMERIC,
    total_tokens BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        status,
        COUNT(*) as job_count,
        ROUND(AVG(duration_ms)) as avg_duration_ms,
        ROUND(AVG(cost_cents)) as avg_cost_cents,
        SUM(tokens) as total_tokens
    FROM eip_jobs
    WHERE started_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
    GROUP BY status
    ORDER BY status;
END;
$$ LANGUAGE plpgsql;
