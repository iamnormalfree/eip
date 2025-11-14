-- ABOUTME: EIP Registry Seeds (Schema Coexistence Approach)
-- ABOUTME: Initial registry data for EIP evidence and schema tracking

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
