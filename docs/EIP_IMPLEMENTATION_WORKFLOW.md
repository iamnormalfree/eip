ABOUTME: EIP-specific implementation workflow ensuring AI content generation quality through systematic checks.
ABOUTME: Prevents quality drift by enforcing IP, compliance, and performance gates throughout development.

# EIP Implementation Workflow

**Purpose:** Ensure all EIP development work maintains content generation quality, IP compliance, and system reliability through systematic verification.

**When to use:** Before starting ANY new feature, IP creation, compliance rule, or system enhancement.

---

## Phase 0: Pre-Implementation Quality Check (MANDATORY)

**Rule:** Never start coding without completing this phase.

### Step 1: Identify Active Phase

```bash
# Open these files in order:
1. docs/eip/prd.md (check which phase we're in)
2. docs/eip/PHASE_TRACKER.md (current phase status)
3. docs/eip/COMPLIANCE_REQUIREMENTS.md
```

**Questions to answer:**
- Which phase are we in? (Phase 0, 1, 2, or 3)
- What are the phase success criteria?
- Which IP types are being developed in this phase?
- What are the compliance requirements for this phase?

**Action:** Write down: "Working in Phase [X]: [phase name] - Objective: [objective]"

---

### Step 2: Verify IP Library Prerequisites

```bash
# Check IP library status:
ls ip_library/
```

**Questions to answer:**
- Does the Educational IP exist for this content type?
- If yes: What version? Is it validated?
- If no: Should this work create a new IP type?
- Are IP invariants defined for this IP type?

**Action:** Write down: "IP: [type]@[version] or CREATE_NEW: [IP type]"

---

### Step 3: Check Compliance Rule Coverage

```bash
# Check compliance rules:
ls compliance/rules/
```

**Questions to answer:**
- Do compliance rules exist for this content domain?
- Are MAS/financial rules defined if needed?
- Are web policy allow-lists configured?
- Are rule templates available for this content type?

**Action:** Write down: "Compliance: [rules_exist] or CREATE_NEW: [rule type]"

---

### Step 4: Verify Performance Budgets

```bash
# Check budget definitions:
cat orchestrator/budgets.yaml
```

**Questions to answer:**
- What tier budget applies to this work? (LIGHT/MEDIUM/HEAVY)
- Are token limits appropriate for this IP type?
- Are time budgets realistic for this content complexity?
- Are cost budgets within acceptable range?

**Action:** Write down: "Budget: [tier] - tokens: [limit], time: [limit], cost: [limit]"

---

### Step 5: Check Active Implementation Plans

```bash
# Search for related active plans:
ls docs/plans/active/
grep -i "your feature keywords" docs/plans/active/*.md
```

**Questions to answer:**
- Is there an active plan for this work?
- Does the plan reference the correct phase?
- Does the plan specify IP and compliance requirements?
- What are the quality gates defined in the plan?

**Action:** Note the plan file path, or determine if new plan is needed

---

### Step 6: Create Phase 0 Quality Checkpoint

Create a quality checkpoint document:

```markdown
## Quality Checkpoint - [Feature Name]

**Date:** YYYY-MM-DD
**Implementer:** [Your name]
**Phase:** Phase [X]
**Target Tier:** [Code/IP/Compliance/Performance]

### EIP Quality Verification
- [ ] Active phase: Phase [X] - [objective]
- [ ] Educational IP: [type]@[version] or CREATE_NEW
- [ ] Compliance rules: [exists] or CREATE_NEW
- [ ] Performance budget: [tier] with limits
- [ ] Active plan: [path] or new plan needed
- [ ] Quality gates: [list from plan]

### Phase Success Criteria
- [ ] IP invariants enforced
- [ ] Compliance rules triggered correctly
- [ ] Performance within budgets
- [ ] Integration tests pass
- [ ] Human review process works

### Approval
- [ ] Architecture reviewed (if new major component)
- [ ] Compliance reviewed (if new rules)
- [ ] Performance reviewed (if budget changes)
- [ ] Ready to implement
```

**Save to:** `docs/quality_checkpoints/YYYY-MM-DD-[feature-slug].md`

---

## Phase 1: Implementation with Quality Gates

### Step 7: Follow EIP-TDD (Test-Driven Development)

**Mandatory order:**
1. Write IP invariant tests (per IP type requirements)
2. Write compliance rule tests (per compliance requirements)
3. Write performance tests (per budget limits)
4. Implement feature ONLY to pass tests
5. Verify all quality gates still satisfied
6. Refactor while keeping all tests green

**Quality prevention:**
- Re-read IP invariants before each major change
- Check compliance rules after each test passes
- Monitor performance budgets during implementation
- Update checkpoint document with quality metrics

---

### Step 8: Track Progress with Quality Metrics

```javascript
// Use TodoWrite for all implementation tasks:
[
  {content: "Write IP invariant tests for [IP type]", status: "in_progress", activeForm: "Writing tests"},
  {content: "Write compliance tests for [domain]", status: "pending", activeForm: "Writing tests"},
  {content: "Implement [feature] with quality gates", status: "pending", activeForm: "Implementing"},
  {content: "Verify performance budgets met", status: "pending", activeForm: "Verifying"},
  {content: "Run full quality gate suite", status: "pending", activeForm: "Testing"}
]
```

**Mark completed immediately** - don't batch completions

---

### Step 9: Update Quality Log During Implementation

Add entry to `docs/quality-log.md` when:
- IP invariant tests pass
- Compliance rules trigger correctly
- Performance budgets are met/exceeded
- Quality gate failures discovered and fixed
- Integration issues found and resolved

**Format:**
```markdown
## [Feature Name] - [Quality Milestone]

**Date:** YYYY-MM-DD
**Phase:** Phase [X]
**IP Type:** [type]@[version]

### Quality Metrics
- IP Invariants: [PASS/FAIL] - [details]
- Compliance: [rules_triggered] - [details]
- Performance: [metrics] - [within_budget?]
- Integration: [status] - [details]

### Issues Found
- Issue: [description] - fixed in [commit]
- Quality gate: [which gate] - resolution
```

---

## Phase 2: Post-Implementation Quality Verification

### Step 10: Verify All Quality Gates

**Go back to your checkpoint document and verify:**

1. **IP Invariant Quality Gate:**
   - Are all IP invariants enforced?
   - Do IP tests pass with edge cases?
   - Is content structure correct?

2. **Compliance Quality Gate:**
   - Do compliance rules trigger appropriately?
   - Are false positives within acceptable range?
   - Are MAS/financial rules working correctly?

3. **Performance Quality Gate:**
   - Are token budgets respected?
   - Are time budgets met (p95 < target)?
   - Are cost budgets within limits?

4. **Integration Quality Gate:**
   - Does end-to-end content generation work?
   - Is dead-letter queue handling working?
   - Are error recovery mechanisms functional?

---

### Step 11: Run Full Quality Suite

```bash
# Execute complete quality verification:
npm run test                    # All unit tests
npm run ip:validate            # IP invariants
npm run compliance:check       # Compliance rules
npm run test:performance       # Performance budgets
npm run test:integration       # End-to-end flow
npm run auditor:test           # Auditor functionality
```

**Expected results:**
- All tests passing (0 failures)
- IP validation complete (0 violations)
- Compliance check successful (rules fire appropriately)
- Performance within budgets (all targets met)
- Integration tests complete (full workflow works)

---

### Step 13: Collect Quality Evidence

**For every implementation, collect evidence:**
- IP invariant test results (save to `test-results/ip/`)
- Compliance rule test outputs (save to `test-results/compliance/`)
- Performance benchmark results (save to `test-results/performance/`)
- Integration test screenshots (save to `evidence/integration/`)
- Sample generated content (save to `evidence/generated/`)

**Link evidence in:**
- Quality checkpoint document
- Quality log completion entry
- Plan completion report
- Phase tracker updates

---

## Phase 3: Continuous Quality Improvement

### Step 14: Analyze Quality Metrics

**Review and analyze:**
- IP invariant failure rates (target: <1%)
- Compliance rule false positive rate (target: <5%)
- Performance budget adherence (target: 95% within budget)
- Integration success rate (target: >99%)
- Human review approval rate (target: >85%)

**Create improvement plan:**
- Adjust IP invariants if too strict/lenient
- Tune compliance rules if false positives high
- Optimize performance if budgets frequently exceeded
- Improve error handling if integration failures

---

### Step 15: Update Learning Data

**Feed quality data back into system:**
- Update IP rule patterns based on validation failures
- Refine compliance rule thresholds based on false positives
- Adjust performance budgets based on actual usage
- Improve brand DNA based on human review feedback

---

## Quick Reference Quality Checklist

Before starting ANY EIP work:

```bash
# 1. Check current phase
cat docs/eip/prd.md | grep "Phase [X]"

# 2. Verify IP exists
ls ip_library/[type]*.yaml

# 3. Check compliance rules
ls compliance/rules/[domain]*.yaml

# 4. Verify performance budgets
cat orchestrator/budgets.yaml | grep "[tier]"

# 5. Check active plans
ls docs/plans/active/ | grep "your-feature"

# 6. Review quality gates
grep "quality_gate" docs/plans/active/your-plan.md
```

If ANY of these fail, STOP and resolve before coding.

---

## Common Quality Mistakes to Avoid

❌ **Don't implement without IP invariants**
- Result: Generated content lacks structure, quality varies wildly

❌ **Don't skip compliance rule testing**
- Result: Compliance violations slip through, regulatory risk

❌ **Don't ignore performance budgets**
- Result: System becomes slow, costs unpredictable

❌ **Don't skip integration testing**
- Result: Components work in isolation but fail together

✅ **Do test IP invariants first**
✅ **Do validate compliance rules thoroughly**
✅ **Do monitor performance continuously**
✅ **Do run full integration suites**

---

## Integration with EIP Framework

This workflow **enforces** EIP quality principles:

- **EIP PRD:** Defines phases and success criteria
- **Fractal Alignment:** Provides systematic verification
- **IP Library:** Defines content structure requirements
- **Compliance System:** Ensures regulatory safety
- **Performance Budgets:** Guarantees cost predictability

Use all together:
1. Phase 0: Quality checks (this workflow)
2. Implementation: EIP-TDD with quality gates
3. Phase 2-3: Quality verification and improvement

---

*Last Updated: 2025-11-13*
*Adapted for EIP Quality System*
