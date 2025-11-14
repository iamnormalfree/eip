# EIP Documentation Structure

This document outlines the complete documentation organization for the EIP (Educational-IP Content Runtime) system.

## Directory Structure

```
docs/
├── eip/                           # EIP-specific documentation
│   ├── big-picture.md            # System vision and overview
│   ├── prd.md                    # Product Requirements Document
│   ├── PHASE_TRACKER.md          # Current phase status and objectives
│   └── COMPLIANCE_REQUIREMENTS.md # Regulatory and compliance needs
├── plans/
│   ├── active/                   # Current implementation plans
│   │   ├── YYYY-MM-DD-{feature}.md
│   │   └── {date}-{completion}.md
│   └── archive/
│       ├── 2025/
│       │   ├── 11/              # Monthly archive
│       │   └── 12/
├── runbooks/
│   ├── ip-creation/             # Educational IP development guides
│   ├── compliance/              # Compliance rule implementation
│   ├── performance/             # Performance optimization guides
│   └── quality-assurance/       # Quality gate procedures
├── quality_checkpoints/         # Pre-implementation quality checks
│   └── YYYY-MM-DD-{feature}.md
├── quality_log.md              # EIP-specific progress and quality metrics
├── evidence/                    # Quality evidence and test results
│   ├── integration/
│   ├── performance/
│   ├── compliance/
│   └── generated/
├── test-results/               # Automated test outputs
│   ├── ip/
│   ├── compliance/
│   └── performance/
├── PLANNING_TEMPLATES.md       # EIP-specific planning templates
├── EIP_FRACTAL_ALIGNMENT.md    # Quality assurance meta-framework
├── EIP_IMPLEMENTATION_WORKFLOW.md # Quality-focused development workflow
└── EIP_DOCUMENTATION_STRUCTURE.md # This file
```

## Documentation Tiers

### Tier 1: Code (Canonical Truth)
**Location:** Production code files
**Purpose:** Actual implementation of EIP system
**Key Files:**
- `orchestrator/` - Content generation orchestration
- `ip_library/` - Educational IP definitions
- `compliance/` - Compliance rules and validation
- `tests/` - Quality gate and functionality tests

### Tier 2: Runbooks (Implementation Guides)
**Location:** `docs/runbooks/`
**Purpose:** HOW to implement EIP features and quality procedures
**Key Directories:**
- `ip-creation/` - Educational IP development patterns
- `compliance/` - Compliance rule implementation guides
- `performance/` - Performance optimization procedures
- `quality-assurance/` - Quality gate workflows

### Tier 3: Plans (Decision Documents)
**Location:** `docs/plans/active/` → `docs/plans/archive/`
**Purpose:** WHAT to build and WHY, with quality requirements
**Naming:** `{date}-{feature-slug}.md`
**Lifecycle:** Active → Completed → Archived

## File Naming Conventions

### Plans
- Active: `2025-11-13-framework-ip-implementation.md`
- Completion: `2025-11-13-framework-ip-implementation-COMPLETION.md`
- Archive: Move to `docs/plans/archive/2025/11/`

### Quality Checkpoints
- Format: `YYYY-MM-DD-{feature-slug}.md`
- Location: `docs/quality_checkpoints/`
- Purpose: Pre-implementation quality verification

### Evidence Files
- Integration: `evidence/integration/{feature}-{date}.png`
- Performance: `evidence/performance/{feature}-{date}.json`
- Compliance: `evidence/compliance/{feature}-{date}.yaml`
- Generated Content: `evidence/generated/{content-type}-{date}.mdx`

### Test Results
- IP Tests: `test-results/ip/{ip-type}-{date}.xml`
- Compliance: `test-results/compliance/{domain}-{date}.json`
- Performance: `test-results/performance/{tier}-{date}.json`

## Quality Documentation Requirements

### Every Implementation Plan Must Include
- Phase alignment (which phase objective this serves)
- IP requirements (which Educational IPs are used/created)
- Compliance requirements (which rules must be implemented)
- Performance targets (budget limits and success criteria)
- Quality gates (specific verification requirements)
- Evidence collection (what metrics and artifacts to collect)

### Every Runbook Must Include
- Quality procedures (how to maintain standards)
- IP patterns (how to work with Educational IPs)
- Compliance integration (how to ensure regulatory safety)
- Performance considerations (how to stay within budgets)
- Testing requirements (how to verify quality)
- Troubleshooting (common quality issues and solutions)

### Every Quality Checkpoint Must Include
- Phase verification (correct phase and objectives)
- IP validation (required IPs exist and are valid)
- Compliance confirmation (rules exist for content domain)
- Budget review (performance budgets appropriate)
- Plan alignment (active plan references correct requirements)
- Quality gate specification (what will be verified)

## Documentation Workflow

### Before Implementation
1. Create quality checkpoint in `docs/quality_checkpoints/`
2. Verify phase alignment and objectives
3. Confirm IP library and compliance rule coverage
4. Check performance budgets and targets
5. Reference appropriate runbooks for patterns

### During Implementation
1. Update quality log (`docs/quality_log.md`) with progress
2. Collect evidence for quality metrics
3. Document any quality issues or discoveries
4. Update checkpoint with completed items

### After Implementation
1. Verify all quality gates pass
2. Collect comprehensive evidence
3. Create completion report if plan fully complete
4. Archive plan and update phase tracker
5. Feed learning back into IP library and compliance rules

## Quality Metrics to Document

### IP Quality Metrics
- Invariant satisfaction rate (target: >99%)
- IP structure compliance (target: 100%)
- Content pattern adherence (target: >95%)

### Compliance Quality Metrics
- Rule accuracy rate (target: >98%)
- False positive rate (target: <5%)
- Regulatory violation rate (target: 0%)

### Performance Quality Metrics
- Budget adherence rate (target: 95% within budget)
- Generation latency (p95 targets by tier)
- Cost per piece (within defined limits)

### Integration Quality Metrics
- End-to-end success rate (target: >99%)
- Dead-letter queue rate (target: <1%)
- Human review approval rate (target: >85%)

## Documentation Maintenance

### Monthly Reviews
- Archive completed plans older than 30 days
- Review and update runbooks based on implementation experience
- Analyze quality metrics and update targets if needed
- Clean up old evidence and test result files

### Phase Transitions
- Update phase tracker with completion evidence
- Archive phase-specific plans and documentation
- Create phase completion reports
- Update runbooks for next phase requirements

### Continuous Improvement
- Update IP library based on validation results
- Refine compliance rules based on accuracy metrics
- Adjust performance budgets based on actual usage
- Improve quality gates based on failure analysis

## Integration with Frameworks

This documentation structure integrates with:
- **EIP Fractal Alignment System** - Quality assurance across all tiers
- **EIP Implementation Workflow** - Quality-focused development process
- **EIP Planning Templates** - Standardized plan and documentation formats
- **Claude.md Guidance** - AI assistant instructions for EIP development

## Quick Reference

| What You Need | Where to Find It |
|----------------|------------------|
| System Vision | `docs/eip/big-picture.md` |
| Current Phase | `docs/eip/PHASE_TRACKER.md` |
| IP Definitions | `ip_library/` directory |
| Compliance Rules | `compliance/` directory |
| Performance Budgets | `orchestrator/budgets.yaml` |
| Implementation Patterns | `docs/runbooks/` |
| Active Plans | `docs/plans/active/` |
| Quality Evidence | `docs/evidence/` |
| Test Results | `docs/test-results/` |
| Quality Progress | `docs/quality_log.md` |

---

*Last Updated: 2025-11-13*