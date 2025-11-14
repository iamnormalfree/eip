# EIP Steel Thread - Technical Specifications

## System Architecture Overview

### Core Components
```
┌─────────────────────────────────────────────────────────────────┐
│                        EIP Steel Thread Architecture           │
├─────────────────────────────────────────────────────────────────┤
│  Input Layer                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Brief     │  │  Persona    │  │   Funnel    │              │
│  │  Input      │  │  Targeting  │  │  Context    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Orchestration Layer                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ IP Router   │  │ Retrieval   │  │ Budget      │              │
│  │ (Persona+   │  │ (BM25/      │  │ Controller  │              │
│  │ Funnel→IP)  │  │ Vectors)    │  │ (Tokens/    │              │
│  └─────────────┘  └─────────────┘  │ Time)       │              │
│                                   └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Content Generation Layer                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Generator   │  │ Micro-      │  │ Repairer    │              │
│  │ (AI SDK)    │  │ Auditor     │  │ (Diff-      │              │
│  │             │  │ (Tags)      │  │ bounded)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Publication Layer                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Publisher   │  │ JSON-LD     │  │ Ledger      │              │
│  │ (Template   │  │ Renderer    │  │ (Audit Trail)│             │
│  │ Engine)     │  │             │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Storage & Review Layer                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Supabase    │  │ Review UI   │  │ Human       │              │
│  │ (eip_ tables)│  │ (Approve/   │  │ Review      │              │
│  │             │  │ Reject)     │  │ Workflow)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Technical Specification

### Table Definitions

#### eip_artifacts
```sql
CREATE TABLE eip_artifacts (
    -- Primary Identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    
    -- Content Management
    status TEXT CHECK (status IN ('seed','draft','published','rejected')) DEFAULT 'draft',
    mdx TEXT NOT NULL,
    frontmatter JSONB NOT NULL DEFAULT '{}',
    ledger JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints and Indexes
    CONSTRAINT eip_artifacts_slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT eip_artifacts_content_not_empty CHECK (length(trim(mdx)) > 0)
);

-- Performance Indexes
CREATE INDEX idx_eip_artifacts_status ON eip_artifacts(status);
CREATE INDEX idx_eip_artifacts_persona ON eip_artifacts USING GIN ((frontmatter->>'persona'));
CREATE INDEX idx_eip_artifacts_funnel ON eip_artifacts USING GIN ((frontmatter->>'funnel'));
CREATE INDEX idx_eip_artifacts_created_at ON eip_artifacts(created_at DESC);
CREATE INDEX idx_eip_artifacts_fulltext ON eip_artifacts USING GIN (to_tsvector('english', mdx));
```

#### eip_jobs
```sql
CREATE TABLE eip_jobs (
    -- Primary Identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id TEXT,
    
    -- Job Management
    stage TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    inputs JSONB,
    outputs JSONB,
    fail_reason TEXT,
    
    -- Performance Metrics
    tokens INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    
    -- Constraints and Indexes
    CONSTRAINT eip_jobs_stage_valid CHECK (stage IN (
        'started', 'ip_selected', 'retrieval', 'generated', 
        'audited', 'repaired', 'completed', 'failed'
    )),
    CONSTRAINT eip_jobs_tokens_positive CHECK (tokens >= 0),
    CONSTRAINT eip_jobs_cost_positive CHECK (cost_cents >= 0)
);

-- Performance Indexes
CREATE INDEX idx_eip_jobs_correlation_id ON eip_jobs(correlation_id);
CREATE INDEX idx_eip_jobs_stage ON eip_jobs(stage);
CREATE INDEX idx_eip_jobs_started_at ON eip_jobs(started_at DESC);
CREATE INDEX idx_eip_jobs_duration ON eip_jobs(duration_ms);
```

#### eip_entities
```sql
CREATE TABLE eip_entities (
    -- Primary Identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity Classification
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    attrs JSONB NOT NULL DEFAULT '{}',
    source_url TEXT,
    
    -- Temporal Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    
    -- Constraints and Indexes
    CONSTRAINT eip_entities_type_valid CHECK (type IN (
        'concept', 'persona', 'offer', 'rate_snapshot', 'product', 
        'regulation', 'compliance_rule', 'template', 'example'
    )),
    CONSTRAINT eip_entities_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT eip_entities_valid_dates CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT eip_entities_unique_current_name UNIQUE (type, name) DEFERRABLE
);

-- Performance Indexes
CREATE INDEX idx_eip_entities_type ON eip_entities(type);
CREATE INDEX idx_eip_entities_name ON eip_entities(name);
CREATE INDEX idx_eip_entities_attrs ON eip_entities USING GIN (attrs);
CREATE INDEX idx_eip_entities_validity ON eip_entities(valid_from, valid_to);
CREATE INDEX idx_eip_entities_fulltext ON eip_entities USING GIN (to_tsvector('english', name || ' ' || attrs::text));
```

### Bridge Functions Technical Specification

#### get_eip_artifacts_for_broker_conversation
```sql
CREATE OR REPLACE FUNCTION get_eip_artifacts_for_broker_conversation(
    p_conversation_id INTEGER,
    p_persona TEXT DEFAULT NULL,
    p_funnel TEXT DEFAULT NULL
)
RETURNS TABLE (
    artifact_id UUID,
    artifact_slug TEXT,
    artifact_status TEXT,
    artifact_title TEXT,
    artifact_persona TEXT,
    artifact_funnel TEXT,
    artifact_created_at TIMESTAMPTZ,
    match_score NUMERIC
) AS $$
DECLARE
    v_conversation_persona TEXT;
    v_conversation_funnel TEXT;
BEGIN
    -- Extract conversation context (optimized query)
    SELECT 
        COALESCE(bc.customer_segment, 'default'),
        COALESCE(bc.funnel_stage, 'MOFU')
    INTO v_conversation_persona, v_conversation_funnel
    FROM broker_conversations bc
    WHERE bc.conversation_id = p_conversation_id
    LIMIT 1;
    
    -- Use provided filters or conversation context
    v_conversation_persona := COALESCE(p_persona, v_conversation_persona, 'default');
    v_conversation_funnel := COALESCE(p_funnel, v_conversation_funnel, 'MOFU');
    
    -- Return artifacts with relevance scoring
    RETURN QUERY
    SELECT 
        a.id,
        a.slug,
        a.status,
        a.frontmatter->>'title' as title,
        a.frontmatter->>'persona' as persona,
        a.frontmatter->>'funnel' as funnel,
        a.created_at,
        -- Calculate relevance score based on persona/funnel match and recency
        CASE 
            WHEN a.frontmatter->>'persona' = v_conversation_persona 
             AND a.frontmatter->>'funnel' = v_conversation_funnel THEN 1.0
            WHEN a.frontmatter->>'persona' = v_conversation_persona THEN 0.8
            WHEN a.frontmatter->>'funnel' = v_conversation_funnel THEN 0.7
            ELSE 0.5
        END * (1 - EXTRACT(EPOCH FROM (NOW() - a.created_at)) / (30 * 24 * 3600)) as score
    FROM eip_artifacts a
    WHERE a.status = 'published'
    AND (p_persona IS NULL OR a.frontmatter->>'persona' = v_conversation_persona)
    AND (p_funnel IS NULL OR a.frontmatter->>'funnel' = v_conversation_funnel)
    AND a.created_at >= NOW() - INTERVAL '30 days'
    ORDER BY score DESC, a.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## API Specifications

### Input Data Contracts

#### Brief Input Structure
```typescript
interface Brief {
  // Required fields
  brief: string;                    // Content generation request (max 1000 chars)
  
  // Optional targeting fields
  persona?: string;                 // Target audience (homeowner, investor, broker)
  funnel?: string;                  // Marketing funnel stage (TOFU, MOFU, BOFU)
  
  // Performance configuration
  tier?: 'LIGHT' | 'MEDIUM' | 'HEAVY';  // Budget tier (default: MEDIUM)
  
  // Tracking and debugging
  correlation_id?: string;          // Request tracking identifier
  
  // Validation constraints
  constraints?: {
    max_tokens?: number;            // Override tier token limits
    include_sources?: boolean;      // Force source inclusion
    compliance_level?: 'strict' | 'standard';  // Compliance strictness
  };
}
```

#### IP Pattern Definition
```typescript
interface IPPattern {
  id: string;                       // Unique IP identifier
  version: string;                  // Semantic version
  purpose: string;                  // Educational purpose description
  
  operators: Array<{
    name: string;                   // Operator name (REDUCE_TO_MECHANISM)
    spec: string;                   // Implementation specification
  }>;
  
  invariants: string[];             // Required structure elements
  sections: string[];               // Required sections in order
  
  validation: {
    required_sections: string[];    // Must-have sections
    forbidden_patterns?: string[];  // Patterns that must not appear
    min_word_count?: number;        // Minimum content length
    max_word_count?: number;        // Maximum content length
  };
}
```

### Output Data Contracts

#### Generated Artifact Structure
```typescript
interface GeneratedArtifact {
  // Metadata
  id: string;                       // UUID identifier
  slug: string;                     // URL-friendly identifier
  status: 'draft' | 'published' | 'rejected';
  correlation_id?: string;          // Original request tracking
  
  // Content
  mdx: string;                      // MDX content with frontmatter
  frontmatter: {                    // Structured metadata
    title: string;
    description: string;
    persona: string;
    funnel: string;
    ip_used: string;
    tags: string[];
    
    // Performance metrics
    budget_tier: string;
    tokens_used: number;
    duration_ms: number;
    cost_cents: number;
    
    // Content classification
    content_type: string;
    reading_level: string;
    estimated_read_time: number;
    
    // Quality indicators
    quality_score: number;
    compliance_score: number;
    human_review_completed: boolean;
  };
  
  // Audit and provenance
  ledger: {
    // Input tracking
    inputs: {
      brief: string;
      persona: string;
      funnel: string;
      timestamp: string;
    };
    
    // Processing stages
    stages: {
      ip_selection: {
        selected_ip: string;
        confidence: number;
        alternatives: string[];
      };
      
      retrieval: {
        candidates: number;
        sources_used: string[];
        graph_connectivity: 'sparse' | 'dense';
        retrieval_score: number;
      };
      
      generation: {
        tokens_generated: number;
        generation_time: number;
        model_used: string;
        prompt_hash: string;
      };
      
      audit: {
        quality_tags: QualityTags;
        compliance_flags: string[];
        suggestions: string[];
      };
      
      repair: {
        repairs_applied: number;
        final_tokens: number;
        repair_effectiveness: number;
      };
    };
    
    // Compliance and evidence
    compliance: {
      domains_allowed: string[];
      claims_verified: string[];
      disclaimers_added: string[];
      regulatory_checks_passed: string[];
    };
    
    // Performance tracking
    performance: {
      total_tokens: number;
      wallclock_time: number;
      cost_breakdown: {
        generation: number;
        audit: number;
        repair: number;
        total: number;
      };
      budget_utilization: number;
    };
  };
  
  // Structured data
  jsonld: {
    '@context': string;
    '@type': string;
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified: string;
    mainEntityOfPage: string;
    about: string[];
    educationalLevel: string;
    teaches: string[];
    learningResourceType: string;
  };
}
```

#### Quality Tags Structure
```typescript
interface QualityTags {
  // Structural compliance (IP invariants)
  structure_compliant: boolean;     // All required sections present
  section_order_correct: boolean;   // Sections follow IP specification
  invariants_satisfied: string[];   // List of satisfied invariants
  invariants_violated: string[];    // List of violated invariants
  
  // Content quality
  claims_sourced: boolean;          // Factual claims have sources
  examples_present: boolean;        // Practical examples included
  explanations_clear: boolean;      // Complex concepts explained well
  
  // Compliance and safety
  compliance_checked: boolean;      // Regulatory compliance verified
  financial_disclaimers: boolean;   // Required disclaimers present
  safe_language: boolean;           // No harmful or misleading content
  
  // Performance and efficiency
  performance_within_budget: boolean; // Token/time budgets respected
  
  // Auditing and improvement
  provenance_complete: boolean;     // Full generation trail documented
  human_review_completed: boolean;   // Human approval obtained
  learning_data_collected: boolean;  // Feedback captured for improvement
  
  // Framework IP specific
  mechanisms_identified: boolean;   // Mechanism section has clear parts
  counterexamples_present: boolean;  // Counterexample section valid
  transfer_examples_valid: boolean;  // Transfer section applicable
}
```

## Performance Budget Technical Specification

### Budget Tiers Configuration
```yaml
budgets:
  LIGHT:
    # Token limits per stage
    planner: 200        # IP routing and selection
    generator: 1400     # Content generation
    auditor: 300        # Quality assessment
    repairer: 200       # Content fixes
    
    # Time limits
    wallclock_s: 20     # Total processing time
    stage_timeout: 10   # Individual stage timeout
    
    # Cost limits (USD cents)
    cost_limit: 14      # Maximum cost per job
    
    # Performance targets
    success_threshold: 0.95    # Minimum success rate
    quality_threshold: 0.80    # Minimum quality score

  MEDIUM:
    # Token limits per stage
    planner: 1000       # Enhanced IP routing
    generator: 2400     # Comprehensive generation
    auditor: 700        # Detailed quality analysis
    repairer: 600       # Extensive content fixes
    
    # Time limits
    wallclock_s: 45     # Total processing time
    stage_timeout: 25   # Individual stage timeout
    
    # Cost limits (USD cents)
    cost_limit: 36      # Maximum cost per job
    
    # Performance targets
    success_threshold: 0.98    # Higher success rate
    quality_threshold: 0.85    # Better quality score

  HEAVY:
    # Token limits per stage
    planner: 1400       # Advanced planning
    generator: 4000     # Premium generation
    auditor: 1100       # Comprehensive audit
    repairer: 1000      # Thorough repairs
    
    # Time limits
    wallclock_s: 90     # Extended processing time
    stage_timeout: 45   # Individual stage timeout
    
    # Cost limits (USD cents)
    cost_limit: 75      # Maximum cost per job
    
    # Performance targets
    success_threshold: 0.99    # Very high success rate
    quality_threshold: 0.90    # Premium quality score
```

### Budget Enforcement Algorithm
```typescript
interface BudgetEnforcer {
  // Budget tracking state
  private budget: BudgetConfig;
  private tracker: {
    start_time: number;
    stages_completed: string[];
    tokens_used: number;
    cost_cents: number;
    breaches: BudgetBreach[];
  };
  
  // Stage management
  startStage(stage: string): void;
  endStage(stage: string): void;
  addTokens(stage: string, tokens: number): void;
  
  // Budget validation
  checkStageBudget(stage: string): BudgetCheck;
  checkOverallBudget(): BudgetCheck;
  shouldFailToDLQ(): boolean;
  
  // DLQ management
  createDLQRecord(): DLQRecord;
  
  // Performance monitoring
  getTracker(): BudgetTracker;
  getUtilization(): number;  // 0.0 to 1.0
  hasBreaches(): boolean;
  getBreaches(): BudgetBreach[];
}

interface BudgetCheck {
  ok: boolean;
  reason?: string;
  utilization?: number;  // Percentage of budget used
  remaining?: {
    tokens: number;
    time: number;
    cost: number;
  };
}

interface BudgetBreach {
  stage: string;
  type: 'tokens' | 'time' | 'cost';
  limit: number;
  actual: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}
```

### Dead Letter Queue (DLQ) Specification
```typescript
interface DLQRecord {
  id: string;                       // DLQ entry ID
  correlation_id?: string;          // Original request ID
  original_input: Brief;            // Original brief data
  
  // Failure information
  fail_reason: string;              // Human-readable failure reason
  fail_stage: string;               // Pipeline stage where failure occurred
  fail_timestamp: number;           // Failure timestamp
  
  // Budget breach details
  breach_type?: 'tokens' | 'time' | 'cost';
  breach_limit: number;             // Limit that was exceeded
  breach_actual: number;            // Actual value that exceeded limit
  
  // Retry information
  retry_count: number;              // Number of retry attempts
  max_retries: number;              // Maximum allowed retries
  next_retry_at?: number;           // Timestamp for next retry
  
  // Processing context
  partial_results?: {               // Any partial completed work
    ip_selected?: string;
    retrieval_results?: any;
    draft_content?: string;
    audit_tags?: QualityTags;
  };
  
  // Metadata
  created_at: number;               // DLQ entry creation
  updated_at: number;               // Last update timestamp
}
```

## Template System Technical Specification

### Jinja2 Template Architecture
```typescript
interface TemplateEngine {
  // Template management
  loadTemplate(templateName: string): Promise<Template>;
  validateTemplate(template: string): ValidationResult;
  
  // Rendering operations
  render(templateName: string, context: RenderContext): Promise<string>;
  renderJSONLD(artifact: GeneratedArtifact): Promise<Record<string, any>>;
  renderMDX(artifact: GeneratedArtifact): Promise<string>;
  
  // Template validation
  validateRenderedContent(content: string): ValidationResult;
  validateJSONLD(jsonld: Record<string, any>): ValidationResult;
}

interface RenderContext {
  artifact: GeneratedArtifact;
  ip_pattern: IPPattern;
  metadata: {
    generation_date: string;
    version: string;
    environment: string;
  };
  custom_vars?: Record<string, any>;
}
```

### JSON-LD Template Specification
```jinja2
{# templates/article.jsonld.j2 #}
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ artifact.frontmatter.title }}",
  "description": "{{ artifact.frontmatter.description }}",
  "author": {
    "@type": "Organization",
    "name": "EIP Content System"
  },
  "datePublished": "{{ artifact.frontmatter.created_at }}",
  "dateModified": "{{ artifact.frontmatter.updated_at }}",
  "mainEntityOfPage": "{{ artifact.frontmatter.canonical_url }}",
  "about": [
    {% for tag in artifact.frontmatter.tags %}
    "{{ tag }}"{% if not loop.last %},{% endif %}
    {% endfor %}
  ],
  "educationalLevel": "{{ artifact.frontmatter.reading_level }}",
  "teaches": [
    {% for section in ip_pattern.sections %}
    "{{ section }}"{% if not loop.last %},{% endif %}
    {% endfor %}
  ],
  "learningResourceType": "Educational Content",
  "audience": {
    "@type": "EducationalAudience",
    "educationalRole": "{{ artifact.frontmatter.persona }}"
  },
  "mentions": [
    {% for source in artifact.ledger.stages.retrieval.sources_used %}
    {
      "@type": "WebPage",
      "name": "{{ source.title }}",
      "url": "{{ source.url }}"
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  ]
}
```

### MDX Template Specification
```jinja2
{# templates/article.mdx.j2 #}
---
title: "{{ artifact.frontmatter.title }}"
description: "{{ artifact.frontmatter.description }}"
persona: "{{ artifact.frontmatter.persona }}"
funnel: "{{ artifact.frontmatter.funnel }}"
ip_used: "{{ artifact.frontmatter.ip_used }}"
tags: [{{ artifact.frontmatter.tags | map('tojson') | join(', ') }}]
budget_tier: "{{ artifact.frontmatter.budget_tier }}"
tokens_used: {{ artifact.frontmatter.tokens_used }}
duration_ms: {{ artifact.frontmatter.duration_ms }}
quality_score: {{ artifact.frontmatter.quality_score }}
compliance_score: {{ artifact.frontmatter.compliance_score }}
created_at: "{{ artifact.frontmatter.created_at }}"
updated_at: "{{ artifact.frontmatter.updated_at }}"
---

{{ artifact.mdx }}

---

## Content Verification

**IP Structure Compliance:** ✅ All required sections present
**Quality Score:** {{ artifact.frontmatter.quality_score }}/1.0
**Compliance Score:** {{ artifact.frontmatter.compliance_score }}/1.0

## Source Attribution

{% for source in artifact.ledger.stages.retrieval.sources_used %}
- [{{ source.title }}]({{ source.url }}) - {{ source.relevance }}% relevance
{% endfor %}

## Regulatory Information

This content is for informational purposes only. Please consult with relevant regulatory authorities such as MAS (Monetary Authority of Singapore) for specific guidance.

---

*Generated by EIP Content System*  
*{{ artifact.ledger.performance.total_tokens }} tokens used*  
*{{ artifact.ledger.performance.wallclock_time }}s processing time*
```

## Quality Assurance Technical Specification

### IP Invariant Validation Algorithm
```typescript
interface IPInvariantValidator {
  // Core validation logic
  validateInvariants(content: string, ip_pattern: IPPattern): InvariantResult;
  
  // Section detection and validation
  detectSections(content: string): DetectedSection[];
  validateSections(sections: DetectedSection[], required: string[]): SectionValidation;
  
  // Content quality checks
  validateMechanismSection(section: string): MechanismValidation;
  validateCounterexampleSection(section: string): CounterexampleValidation;
  validateTransferSection(section: string): TransferValidation;
  
  // Overall compliance scoring
  calculateComplianceScore(validations: Validation[]): number;
}

interface InvariantResult {
  compliant: boolean;
  score: number;                    // 0.0 to 1.0 compliance score
  violations: InvariantViolation[];
  suggestions: string[];
  metadata: {
    sections_detected: string[];
    word_count: number;
    reading_level: string;
  };
}

interface InvariantViolation {
  type: 'missing_section' | 'invalid_content' | 'structure_error';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  location?: {
    line: number;
    section: string;
  };
  suggestion?: string;
}
```

### Compliance Checking Algorithm
```typescript
interface ComplianceChecker {
  // Domain validation
  validateDomains(content: string, sources: Source[]): DomainValidation;
  
  // Financial content compliance
  validateFinancialClaims(content: string): FinancialValidation;
  
  // Regulatory compliance
  validateRegulatoryRequirements(content: string, jurisdiction: string): RegulatoryValidation;
  
  // Disclaimer generation
  generateDisclaimers(content: string, jurisdiction: string): string[];
  
  // Overall compliance assessment
  assessCompliance(content: string, context: ComplianceContext): ComplianceResult;
}

interface ComplianceResult {
  compliant: boolean;
  score: number;                    // 0.0 to 1.0 compliance score
  violations: ComplianceViolation[];
  required_disclaimers: string[];
  suggestions: string[];
  metadata: {
    jurisdictions_checked: string[];
    domains_validated: number;
    claims_verified: number;
  };
}

interface ComplianceViolation {
  type: 'unapproved_domain' | 'financial_claim_unsourced' | 'missing_disclaimer';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  location?: {
    line: number;
    excerpt: string;
  };
  remediation: string;
}
```

### Performance Monitoring Specification
```typescript
interface PerformanceMonitor {
  // Real-time monitoring
  trackStagePerformance(stage: string, metrics: StageMetrics): void;
  trackTokenUsage(tokens: number, stage: string): void;
  trackTiming(duration: number, stage: string): void;
  
  // Performance analysis
  getPerformanceReport(correlation_id?: string): PerformanceReport;
  analyzeTrends(timeframe: TimeFrame): TrendAnalysis;
  
  // Alerting
  checkThresholds(): Alert[];
  generatePerformanceAlerts(): Alert[];
}

interface StageMetrics {
  tokens_input: number;
  tokens_output: number;
  duration_ms: number;
  success: boolean;
  error_type?: string;
  memory_usage?: number;
  cpu_usage?: number;
}

interface PerformanceReport {
  summary: {
    total_jobs: number;
    success_rate: number;
    average_tokens: number;
    average_duration: number;
    total_cost: number;
  };
  by_stage: Record<string, StagePerformance>;
  by_tier: Record<string, TierPerformance>;
  trends: {
    token_usage_trend: TrendDirection;
    duration_trend: TrendDirection;
    cost_trend: TrendDirection;
    quality_trend: TrendDirection;
  };
  alerts: Alert[];
}
```

## Security and Compliance Technical Specification

### Input Validation and Sanitization
```typescript
interface InputValidator {
  // Brief validation
  validateBrief(brief: string): ValidationResult;
  sanitizeBrief(brief: string): string;
  
  // Parameter validation
  validatePersona(persona: string): ValidationResult;
  validateFunnel(funnel: string): ValidationResult;
  validateTier(tier: string): ValidationResult;
  
  // Content security
  sanitizeContent(content: string): string;
  detectMaliciousPatterns(content: string): SecurityThreat[];
  checkInjectionAttempts(input: string): InjectionRisk;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitized_value?: string;
}

interface SecurityThreat {
  type: 'xss' | 'sql_injection' | 'prompt_injection' | 'malicious_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    line: number;
    excerpt: string;
  };
  remediation: string;
}
```

### Audit Trail Specification
```typescript
interface AuditLogger {
  // Event logging
  logJobStart(correlation_id: string, input: Brief): void;
  logStageComplete(correlation_id: string, stage: string, result: any): void;
  logJobComplete(correlation_id: string, artifact: GeneratedArtifact): void;
  logJobFailure(correlation_id: string, error: Error): void;
  
  // Security events
  logSecurityEvent(event: SecurityEvent): void;
  logComplianceCheck(result: ComplianceResult): void;
  
  // Query and analysis
  getAuditTrail(correlation_id: string): AuditEntry[];
  generateComplianceReport(timeframe: TimeFrame): ComplianceReport;
}

interface AuditEntry {
  id: string;
  correlation_id: string;
  timestamp: number;
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'security_violation';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  user_id?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure';
  metadata: Record<string, any>;
}
```

### Regulatory Compliance Framework
```typescript
interface RegulatoryCompliance {
  // Jurisdiction-specific rules
  getJurisdictionRules(jurisdiction: string): JurisdictionRules;
  validateContentForJurisdiction(content: string, jurisdiction: string): ComplianceResult;
  
  // Financial content compliance
  validateFinancialContent(content: string, context: FinancialContext): FinancialCompliance;
  generateRequiredDisclaimers(content: string, jurisdiction: string): Disclaimer[];
  
  // Data protection
  validateDataHandling(data: PersonalData): DataCompliance;
  ensureGDPRCompliance(request: GDPRRequest): GDPRCompliance;
}

interface JurisdictionRules {
  jurisdiction: string;
  regulations: Regulation[];
  required_disclaimers: DisclaimerTemplate[];
  content_restrictions: ContentRestriction[];
  data_protection_rules: DataProtectionRule[];
}

interface FinancialCompliance {
  compliant: boolean;
  violations: FinancialViolation[];
  required_disclosures: string[];
  risk_warnings: string[];
  approved_sources: string[];
}
```

---

## File Structure and Dependencies

### Complete File Structure
```
eip/
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment variables template
├── README.md                       # Project overview
│
├── db/                             # Database layer
│   ├── schema.sql                  # EIP database schema
│   ├── seed_registries.sql         # Evidence registry seeds
│   ├── seed_test_artifacts.sql     # Test data seeds
│   ├── migrations/                 # Database migrations
│   └── setup.ts                    # Database initialization
│
├── orchestrator/                   # Core pipeline orchestration
│   ├── controller.ts               # Main orchestrator controller
│   ├── router.ts                   # IP routing logic
│   ├── retrieval.ts                # Content retrieval (BM25/vectors)
│   ├── auditor.ts                  # Micro-auditor for quality tags
│   ├── repairer.ts                 # Diff-bounded content repair
│   ├── publisher.ts                # JSON-LD and MDX publishing
│   ├── budget.ts                   # Budget enforcement and tracking
│   ├── database.ts                 # Database integration layer
│   └── template-renderer.ts        # Jinja2 template processing
│
├── ip_library/                     # Educational IP definitions
│   ├── framework@1.0.0.yaml        # Framework IP specification
│   ├── process@1.0.0.yaml          # Process IP specification (future)
│   └── comparative@1.0.0.yaml      # Comparative IP specification (future)
│
├── templates/                      # Jinja2 templates
│   ├── article.jsonld.j2           # Article JSON-LD template
│   ├── faq.jsonld.j2               # FAQ JSON-LD template
│   ├── article.mdx.j2              # Article MDX template
│   └── faq.mdx.j2                  # FAQ MDX template
│
├── src/app/review/                 # Review UI components
│   ├── page.tsx                    # Review page server component
│   └── loading.tsx                 # Loading state component
│
├── components/review/              # Review UI components
│   ├── ReviewHeader.tsx            # Review queue header
│   ├── ReviewArtifactList.tsx      # Artifact list component
│   ├── ReviewArtifactCard.tsx      # Individual artifact card
│   └── ReviewActions.tsx           # Approve/reject actions
│
├── scripts/                        # Utility and testing scripts
│   ├── validate-ips.ts             # IP validation script
│   ├── test-retrieval.ts           # Retrieval system testing
│   ├── test-auditor.ts             # Auditor system testing
│   ├── compliance-check.ts         # Compliance rule validation
│   └── eip-smoke-test.js           # End-to-end smoke testing
│
├── tests/                          # Test suites
│   ├── orchestrator/               # Orchestrator tests
│   ├── ip/                         # IP library tests
│   ├── db/                         # Database tests
│   ├── ui/                         # UI component tests
│   └── integration/                # End-to-end integration tests
│
├── docs/                           # Documentation
│   ├── EIP_STEEL_THREAD_DOCUMENTATION.md  # Complete documentation
│   ├── EIP_OPERATIONAL_GUIDE.md           # Operations manual
│   ├── EIP_TECHNICAL_SPECIFICATIONS.md   # Technical specifications
│   ├── EIP_IMPLEMENTATION_WORKFLOW.md    # Development workflow
│   └── EIP_FRACTAL_ALIGNMENT.md          # Quality framework
│
└── compliance/                     # Compliance framework
    ├── domains.json                # Allow-list domains
    ├── disclaimers.json            # Disclaimer templates
    ├── financial-rules.json        # Financial content rules
    └── jurisdiction-rules/         # Regional compliance rules
```

### Dependencies Specification
```json
{
  "dependencies": {
    "production": [
      {
        "name": "@supabase/supabase-js",
        "version": "^2.38.0",
        "purpose": "Database client and authentication"
      },
      {
        "name": "bullmq",
        "version": "^4.0.0", 
        "purpose": "Job queue and worker management"
      },
      {
        "name": "redis",
        "version": "^4.6.0",
        "purpose": "Queue backend and caching"
      },
      {
        "name": "nunjucks",
        "version": "^3.2.0",
        "purpose": "Template rendering engine"
      },
      {
        "name": "yaml",
        "version": "^2.3.0",
        "purpose": "IP configuration file parsing"
      },
      {
        "name": "zod",
        "version": "^3.22.0",
        "purpose": "Schema validation and type safety"
      },
      {
        "name": "winston",
        "version": "^3.11.0",
        "purpose": "Structured logging"
      }
    ],
    "development": [
      {
        "name": "typescript",
        "version": "^5.2.0",
        "purpose": "TypeScript compiler and type checking"
      },
      {
        "name": "jest",
        "version": "^29.7.0",
        "purpose": "Unit and integration testing framework"
      },
      {
        "name": "tsx",
        "version": "^4.6.0",
        "purpose": "TypeScript execution environment"
      },
      {
        "name": "eslint",
        "version": "^8.54.0",
        "purpose": "Code quality and style checking"
      },
      {
        "name": "prettier",
        "version": "^3.1.0",
        "purpose": "Code formatting"
      }
    ]
  }
}
```

### Environment Variables Specification
```typescript
interface EnvironmentConfig {
  // Database configuration
  SUPABASE_URL: string;             // Supabase project URL
  SUPABASE_SERVICE_KEY: string;     // Service key for admin operations
  SUPABASE_ANON_KEY: string;        // Anonymous key for client operations
  
  // Queue configuration
  REDIS_URL: string;                // Redis connection URL
  REDIS_PASSWORD?: string;          // Redis password (if required)
  
  // AI service configuration
  OPENAI_API_KEY?: string;          // OpenAI API key (for generation)
  ANTHROPIC_API_KEY?: string;       // Anthropic API key (alternative)
  AI_MODEL?: string;                // AI model selection
  
  // Application configuration
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT?: number;                    // Server port (default: 3000)
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // EIP-specific configuration
  EIP_LEGACY_COMPAT?: string;       // Legacy compatibility mode
  DEFAULT_IP_TIER?: string;         // Default budget tier
  MAX_CONCURRENT_JOBS?: number;     // Concurrent job limit
  
  // Security configuration
  CORS_ORIGINS?: string;            // Allowed CORS origins
  RATE_LIMIT_WINDOW?: number;       // Rate limiting window (ms)
  RATE_LIMIT_MAX?: number;          // Max requests per window
  
  // Monitoring and alerting
  SENTRY_DSN?: string;              // Error tracking DSN
  PROMETHEUS_PORT?: number;         // Metrics port
  
  // Feature flags
  ENABLE_NEO4J?: string;            // Neo4j integration flag
  ENABLE_VECTOR_SEARCH?: string;    // Vector search flag
  ENABLE_ADVANCED_MONITORING?: string; // Enhanced monitoring
}
```

---

*Last Updated: 2025-11-14*
*Version: 1.0*
*Technical Specification Version: 1.0*
