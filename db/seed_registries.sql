-- ABOUTME: EIP Registry Seeds (Schema Coexistence Approach)
-- ABOUTME: Initial registry data for EIP evidence and schema tracking with BM25 index support

-- Seed EIP Schema Registry with initial version tracking
INSERT INTO eip_schema_registry (key, version, checksum) VALUES
('eip_core', '1.0.0', 'sha256:abc123def456'),
('eip_entities', '1.0.0', 'sha256:def789ghi012'),
('eip_artifacts', '1.0.0', 'sha256:ghi345jkl678'),
('eip_compliance', '1.0.0', 'sha256:jkl901mno234')
ON CONFLICT (key) DO NOTHING;

-- Seed EIP Evidence Registry with compliance allow-list domains
INSERT INTO eip_evidence_registry (evidence_key, allow_web, allow_domains) VALUES
('mas_gov_sg', TRUE, ARRAY['mas.gov.sg', 'monetaryauthority.gov.sg']),
('iras_gov_sg', TRUE, ARRAY['iras.gov.sg', 'gov.sg']),
('gov_sg', TRUE, ARRAY['gov.sg', 'data.gov.sg']),
('edu_sg', TRUE, ARRAY['edu.sg', 'nus.edu.sg', 'ntu.edu.sg', 'smu.edu.sg']),
('hdb_gov_sg', TRUE, ARRAY['hdb.gov.sg']),
('gov_x_annotations', FALSE, ARRAY[]::TEXT[]), -- Manual source only
('internal_calculations', FALSE, ARRAY[]::TEXT[]), -- Computed, not sourced
('market_data', TRUE, ARRAY['reuters.com', 'bloomberg.com', 'sgx.com'])
ON CONFLICT (evidence_key) DO NOTHING;

-- Seed sample EIP Entities (for testing and demonstration)
INSERT INTO eip_entities (type, name, attrs, valid_from, source_url) VALUES
('concept', 'Fixed Rate Mortgage', 
 '{"category": "loan_type", "risk_level": "low", "tenure_options": [15, 20, 25, 30]}',
 NOW(),
 'https://www.hdb.gov.sg/residential/buying-a-flat/financing-your-flat'),
('concept', 'Floating Rate Mortgage', 
 '{"category": "loan_type", "risk_level": "medium", "basis": "SORA"}',
 NOW(),
 'https://www.mas.gov.sg/banking-and-insurance/loans-and-credit/mortgages'),
('concept', 'HDB BTO Flat', 
 '{"category": "property_type", "eligibility": "first_timer", "max_price": 600000}',
 NOW(),
 'https://www.hdb.gov.sg/residential/buying-a-flat/buying-new/bto-flats'),
('concept', 'Private Condominium', 
 '{"category": "property_type", "eligibility": "all_buyers", "min_price": 800000}',
 NOW(),
 'https://www.ura.gov.sg/property-market-information'),
('persona', 'First-Time Home Buyer', 
 '{"age_range": [25, 35], "income_level": "middle", "experience": "beginner"}',
 NOW(),
 NULL),
('persona', 'Property Investor', 
 '{"age_range": [30, 50], "income_level": "high", "experience": "advanced"}',
 NOW(),
 NULL),
('offer', 'Mortgage Consultation', 
 '{"service_type": "advisory", "duration": "30min", "cost": "free"}',
 NOW(),
 NULL),
('offer', 'Loan Pre-Approval', 
 '{"service_type": "service", "processing_time": "3days", "validity": "30days"}',
 NOW(),
 NULL)
ON CONFLICT DO NOTHING;

-- Seed sample EIP Evidence Snapshots
INSERT INTO eip_evidence_snapshots (evidence_key, version, data, last_checked) VALUES
('mas_gov_sg', '1.0.0', 
 '{"updated": "2024-01-15", "mortgage_rates": {"fixed_15y": 3.2, "fixed_30y": 3.8}}',
 CURRENT_DATE),
('iras_gov_sg', '1.0.0',
 '{"tax_year": "2024", "property_tax_rates": {"owner_occupied": [0, 4, 6, 8]}}',
 CURRENT_DATE),
('hdb_gov_sg', '1.0.0',
 '{"bto_waiting_time": {"average": "4-5 years", "mature_estates": "7-8 years"}}',
 CURRENT_DATE)
ON CONFLICT (evidence_key, version) DO NOTHING;

-- Seed sample EIP Brand Profile (for testing)
INSERT INTO eip_brand_profiles (brand, version, profile_json) VALUES
('eip_default', '1.0.0',
 '{"voice_profile": {"tone": "professional", "expertise": "financial_planning"}, 
   "compliance_level": "strict",
   "risk_appetite": "conservative",
   "target_audience": ["first_time_buyers", "upgraders"],
   "approved_ctas": ["schedule_consultation", "download_guide"],
   "disclaimers": ["interest_rates_fluctuate", "subject_to_approval"]}')
ON CONFLICT (brand) DO NOTHING;

-- BM25 Index Registry Seeds (Phase 1 Implementation)
-- Seed initial BM25 index versions for testing and development

-- Version 1.0.0 - Initial BM25 index with basic entity and artifact data
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
    created_at
) VALUES (
    'bm25_index_1.0.0',
    '1.0.0',
    'sha256:abc123def4567890123456789abcdef1234567890123456789abcdef1234567890',
    'bm25_file',
    ARRAY['entity_fixed_rate_mortgage', 'entity_floating_rate_mortgage', 'entity_hdb_bto_flat', 
           'entity_private_condominium', 'entity_first_time_home_buyer', 'entity_property_investor',
           'entity_mortgage_consultation', 'entity_loan_pre_approval'],
    '{"concept_abstract": 2.0, "artifact_summary": 1.0, "entity_name": 1.5, "content": 1.0}',
    '{"build_type": "full", "builder_version": "1.0.0", "tokenization": "simple", "k1": 1.2, "b": 0.75}',
    2048576, -- 2MB index size
    8,
    1500, -- 1.5 seconds build time
    FALSE, -- Not active, newer version exists
    '2024-01-15 10:00:00+00'
) ON CONFLICT (key) DO NOTHING;

-- Version 1.1.0 - Enhanced BM25 index with additional artifacts and improved weighting
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
    'bm25_index_1.1.0',
    '1.1.0',
    'sha256:def7890123456789abcdef1234567890123456789abcdef1234567890123456789',
    'bm25_file',
    ARRAY['entity_fixed_rate_mortgage', 'entity_floating_rate_mortgage', 'entity_hdb_bto_flat', 
           'entity_private_condominium', 'entity_first_time_home_buyer', 'entity_property_investor',
           'entity_mortgage_consultation', 'entity_loan_pre_approval', 'artifact_mortgage_guide',
           'artifact_property_investment_tips'],
    '{"concept_abstract": 2.5, "artifact_summary": 1.2, "entity_name": 1.8, "content": 1.0}',
    '{"build_type": "incremental", "builder_version": "1.1.0", "tokenization": "enhanced", "k1": 1.2, "b": 0.75}',
    3145728, -- 3MB index size
    10,
    2200, -- 2.2 seconds build time
    FALSE, -- Not active, latest version is 1.2.0
    '1.0.0',
    '2024-01-20 14:30:00+00'
) ON CONFLICT (key) DO NOTHING;

-- Version 1.2.0 - Current active BM25 index with latest data and optimizations
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
    'bm25_index_1.2.0',
    '1.2.0',
    'sha256:0123456789abcdef1234567890123456789abcdef1234567890123456789abcdef',
    'bm25_file',
    ARRAY['entity_fixed_rate_mortgage', 'entity_floating_rate_mortgage', 'entity_hdb_bto_flat', 
           'entity_private_condominium', 'entity_first_time_home_buyer', 'entity_property_investor',
           'entity_mortgage_consultation', 'entity_loan_pre_approval', 'artifact_mortgage_guide',
           'artifact_property_investment_tips', 'artifact_regulatory_updates'],
    '{"concept_abstract": 3.0, "artifact_summary": 1.5, "entity_name": 2.0, "content": 1.0}',
    '{"build_type": "incremental", "builder_version": "1.2.0", "tokenization": "optimized", "k1": 1.3, "b": 0.8}',
    4194304, -- 4MB index size
    12,
    2800, -- 2.8 seconds build time
    TRUE, -- Currently active version
    '1.1.0',
    '2024-02-01 09:15:00+00'
) ON CONFLICT (key) DO NOTHING;

-- Seed BM25 index build history for audit trail
INSERT INTO eip_index_build_history (
    registry_key,
    build_type,
    build_status,
    started_at,
    completed_at,
    build_duration_ms,
    sources_processed,
    documents_added,
    build_metadata,
    checksum_after
) VALUES 
-- History for version 1.0.0
('bm25_index_1.0.0', 'full', 'completed', '2024-01-15 09:58:00+00', '2024-01-15 10:00:00+00', 1500, 8, 8,
 '{"builder_version": "1.0.0", "environment": "development", "test_run": false}',
 'sha256:abc123def4567890123456789abcdef1234567890123456789abcdef1234567890'),

-- History for version 1.1.0
('bm25_index_1.1.0', 'incremental', 'completed', '2024-01-20 14:29:00+00', '2024-01-20 14:30:00+00', 2200, 10, 2,
 '{"builder_version": "1.1.0", "environment": "development", "parent_version": "1.0.0"}',
 'sha256:def7890123456789abcdef1234567890123456789abcdef1234567890123456789'),

-- History for version 1.2.0
('bm25_index_1.2.0', 'incremental', 'completed', '2024-02-01 09:14:00+00', '2024-02-01 09:15:00+00', 2800, 12, 2,
 '{"builder_version": "1.2.0", "environment": "production", "parent_version": "1.1.0"}',
 'sha256:0123456789abcdef1234567890123456789abcdef1234567890123456789abcdef'),

-- Example of a failed build (for testing error handling)
('bm25_index_1.1.1', 'incremental', 'failed', '2024-01-25 11:00:00+00', '2024-01-25 11:02:00+00', 1200, 0, 0,
 '{"builder_version": "1.1.1", "environment": "development", "error_source": "data_validation"}',
 NULL) -- No checksum for failed build
ON CONFLICT DO NOTHING;

-- Seed example rollback entry (for testing rollback functionality)
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
    rollback_version,
    created_at
) VALUES (
    'bm25_rollback_1.1.0_1706132400',
    '1.1.0_rollback_1706132400',
    'sha256:def7890123456789abcdef1234567890123456789abcdef1234567890123456789',
    'bm25_file',
    ARRAY['entity_fixed_rate_mortgage', 'entity_floating_rate_mortgage', 'entity_hdb_bto_flat', 
           'entity_private_condominium', 'entity_first_time_home_buyer', 'entity_property_investor',
           'entity_mortgage_consultation', 'entity_loan_pre_approval', 'artifact_mortgage_guide',
           'artifact_property_investment_tips'],
    '{"concept_abstract": 2.5, "artifact_summary": 1.2, "entity_name": 1.8, "content": 1.0}',
    '{"build_type": "rollback", "builder_version": "1.1.0", "rollback_reason": "Performance testing", "original_build": "2024-01-20"}',
    FALSE,
    '1.1.0',
    '1.0.0',
    '2024-01-25 16:00:00+00'
) ON CONFLICT (key) DO NOTHING;

-- Example rollback build history entry
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
    'bm25_index_1.1.0',
    'rollback',
    'completed',
    '2024-01-25 15:58:00+00',
    '2024-01-25 16:00:00+00',
    '{"reason": "Performance testing", "target_version": "1.0.0", "initiated_by": "system"}',
    'sha256:def7890123456789abcdef1234567890123456789abcdef1234567890123456789',
    'sha256:abc123def4567890123456789abcdef1234567890123456789abcdef1234567890'
) ON CONFLICT DO NOTHING;
