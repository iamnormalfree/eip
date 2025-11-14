-- ABOUTME: Test Data for Review UI - Sample draft artifacts for testing
-- ABOUTME: Creates sample artifacts with MDX content, frontmatter, and ledger for review testing

-- Insert sample draft artifacts for review UI testing
INSERT INTO eip_artifacts (id, slug, status, mdx, frontmatter, ledger, created_at, updated_at) VALUES
(
    gen_random_uuid(),
    'mortgage-basics-guide',
    'draft',
    '---
title: "Mortgage Basics: A Complete Guide for First-Time Home Buyers"
persona: "first_time_buyer"
funnel: "awareness"
ip_type: "framework"
---

# Mortgage Basics: A Complete Guide for First-Time Home Buyers

## Understanding Mortgage Fundamentals

When embarking on your home buying journey, understanding mortgages is crucial. A mortgage is essentially a loan specifically designed for real estate purchases, with the property itself serving as collateral.

### Key Mortgage Components

1. **Principal**: The actual amount borrowed
2. **Interest**: The cost of borrowing money
3. **Tenure**: The loan repayment period
4. **Interest Rate**: Can be fixed or floating

## Types of Mortgages in Singapore

### Fixed Rate Mortgages
- Interest rate remains constant throughout the loan period
- Predictable monthly payments
- Protection against interest rate hikes

### Floating Rate Mortgages
- Interest rates fluctuate based on market conditions
- Typically pegged to SORA (Singapore Overnight Rate Average)
- Potential for lower rates during favorable market conditions

## Pre-Approval Process

Getting pre-approved for a mortgage is a crucial first step that:

1. **Sets your budget**: Know exactly how much you can afford
2. **Strengthens your offer**: Sellers prefer pre-approved buyers
3. **Speeds up closing**: Less paperwork during the actual purchase process

## Documentation Requirements

To apply for a mortgage in Singapore, you''ll typically need:

- NRIC/Passport
- Proof of income (payslips, CPF statements)
- Employment letter
- Bank statements
- Option to Purchase (OTP) agreement

*This content is for informational purposes only. Interest rates are subject to change and approval is based on individual circumstances.*',
    '{"title": "Mortgage Basics: A Complete Guide for First-Time Home Buyers", "persona": "first_time_buyer", "funnel": "awareness", "ip_type": "framework", "word_count": 185, "reading_time": "2 min", "target_audience": ["first_time_buyers"], "compliance_tags": ["financial_advice", "educational_content"]}',
    '{"ip_version": "1.0.0", "generation_method": "orchestrator", "compliance_checks": ["domain_validation", "evidence_verification"], "audit_tags": ["ip_invariant_pass", "compliance_pass", "performance_budget_pass"], "provenance": {"orchestrator_job_id": "job_1234567890_abc123", "generation_timestamp": "2024-01-15T10:30:00Z", "evidence_sources": ["mas.gov.sg", "hdb.gov.sg"], "cost_breakdown": {"tokens": 1250, "cost_cents": 85}}}',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),
(
    gen_random_uuid(),
    'hdb-bto-application-steps',
    'draft',
    '---
title: "HDB BTO Application: Step-by-Step Guide 2024"
persona: "first_time_buyer" 
funnel: "consideration"
ip_type: "process"
---

# HDB BTO Application: Step-by-Step Guide 2024

## Pre-Application Preparation

Before diving into your HDB Build-To-Order (BTO) application, ensure you have:

1. **CPF OA Savings**: At least 5% of the flat price
2. **HLE Letter**: HDB Loan Eligibility letter
3. **Income Documents**: Latest payslips and CPF statements

## The Application Process

### Step 1: Research and Planning
- Study the available BTO projects
- Compare locations, flat types, and prices
- Consider future MRT lines and amenities

### Step 2: Check Eligibility
- Citizenship requirements
- Income ceiling limits
- Ownership of other properties

### Step 3: Financial Planning
- Calculate your maximum loan amount
- Plan for down payment and other costs
- Consider mortgage insurance

## Balloting System Explained

HDB uses a computerized balloting system when applications exceed available units:

- **First-Timer Priority**: 95% of units in non-mature estates
- **Second-Timer Quota**: 5% for previous owners
- **Ethnic Integration Policy**: Maintains racial harmony

## After Successful Ballot

1. **Receive Booking Appointment**: Typically 2-3 weeks after results
2. **Choose Your Unit**: Visit the showflat if available
3. **Pay Option Fee**: S$500 for 4-room, S$1,000 for 5-room
4. **Sign Agreement for Lease**: Legal agreement for your flat

## Timeline Expectations

- **Application to Results**: 3-4 weeks
- **Booking to Completion**: 3-5 years for most projects
- **Keys Collection**: After full payment completion

*Waiting times may vary depending on project complexity and construction progress.*',
    '{"title": "HDB BTO Application: Step-by-Step Guide 2024", "persona": "first_time_buyer", "funnel": "consideration", "ip_type": "process", "word_count": 220, "reading_time": "3 min", "target_audience": ["first_time_buyers", "bto_applicants"], "compliance_tags": ["hdb_information", "government_policy"]}',
    '{"ip_version": "1.0.0", "generation_method": "orchestrator", "compliance_checks": ["domain_validation", "evidence_verification"], "audit_tags": ["ip_invariant_pass", "compliance_pass", "performance_budget_pass"], "provenance": {"orchestrator_job_id": "job_1234567891_def456", "generation_timestamp": "2024-01-15T11:45:00Z", "evidence_sources": ["hdb.gov.sg", "gov.sg"], "cost_breakdown": {"tokens": 1450, "cost_cents": 95}}}',
    NOW() - INTERVAL '4 hours', 
    NOW() - INTERVAL '4 hours'
),
(
    gen_random_uuid(),
    'property-tax-calculation-singapore',
    'draft',
    '---
title: "Singapore Property Tax Calculation: Complete Guide"
persona: "property_investor"
funnel: "evaluation"
ip_type: "framework"
---

# Singapore Property Tax Calculation: Complete Guide

## Understanding Property Tax Basics

Property tax in Singapore is an annual tax based on the **Annual Value (AV)** of your property. The AV is the estimated annual rental income your property could fetch.

## Property Tax Rates by Property Type

### Owner-Occupied Residential Properties

| Annual Value ($) | Property Tax Rate (%) |
|------------------|----------------------|
| First $8,000 | 0 |
| Next $22,000 | 4 |
| Next $10,000 | 6 |
| Next $10,000 | 8 |
| Next $10,000 | 10 |
| Next $1,440,000 | 12 |
| Above $1,500,000 | 15 |

### Non-Owner-Occupied Residential Properties

| Annual Value ($) | Property Tax Rate (%) |
|------------------|----------------------|
| First $30,000 | 10 |
| Next $15,000 | 12 |
| Above $45,000 | 15 |

## Calculation Examples

### Example 1: Owner-Occupied HDB Flat
- Annual Value: $9,600
- Tax Calculation: ($9,600 - $8,000) × 4% = $64
- **Annual Property Tax: $64**

### Example 2: Investment Condominium  
- Annual Value: $36,000
- Tax Calculation: 
  - First $30,000 × 10% = $3,000
  - Remaining $6,000 × 12% = $720
- **Annual Property Tax: $3,720**

## Factors Affecting Annual Value

1. **Location**: Prime areas command higher AV
2. **Property Type**: Condominiums vs HDB vs landed
3. **Size**: Floor area and land area
4. **Market Conditions**: Rental market trends
5. **Age and Condition**: Property maintenance and facilities

## Payment and Deadlines

- **Payment Schedule**: Annually in January
- **Payment Methods**: GIRO, AXS, online banking
- **Late Payment**: 5% penalty on unpaid amount

## Tax Relief Schemes

### Property Tax Rebates
- Owner-occupier rebate up to 100% for lower AV properties
- Temporary relief during economic downturns

### Special Considerations
- Vacant properties may qualify for tax reduction
- Progressive tax rates encourage property ownership

*Tax rates are subject to changes by IRAS. Always verify current rates on the official IRAS website.*',
    '{"title": "Singapore Property Tax Calculation: Complete Guide", "persona": "property_investor", "funnel": "evaluation", "ip_type": "framework", "word_count": 195, "reading_time": "2.5 min", "target_audience": ["property_investors", "homeowners"], "compliance_tags": ["tax_information", "iras_compliant"]}',
    '{"ip_version": "1.0.0", "generation_method": "orchestrator", "compliance_checks": ["domain_validation", "evidence_verification"], "audit_tags": ["ip_invariant_pass", "compliance_pass", "performance_budget_pass"], "provenance": {"orchestrator_job_id": "job_1234567892_ghi789", "generation_timestamp": "2024-01-15T14:20:00Z", "evidence_sources": ["iras.gov.sg", "gov.sg"], "cost_breakdown": {"tokens": 1680, "cost_cents": 110}}}',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
);