ABOUTME: Fractal double-entry alignment system - meta-pattern for preventing drift at all scales.
ABOUTME: Every change is recorded in two places, verified bidirectionally, creating unbreakable audit trail.

# Fractal Alignment System: Double-Entry Software Development

**Concept:** Just as double-entry accounting prevents financial drift by recording every transaction twice, fractal alignment prevents strategic drift by recording every change at multiple tier levels.

**Core Principle:** No change exists in only one place. Every modification propagates up and down the tier hierarchy, creating bidirectional verification.

---

## The Accounting Analogy

### Traditional Double-Entry Bookkeeping

```
Transaction: $100 sale
Debit:  Cash Account         +$100
Credit: Revenue Account      +$100
                             ------
Balance:                      $0   (books balance)
```

**Properties:**
- Every transaction recorded twice
- Debits must equal credits
- Audit trail preserved
- Fraud/errors detectable (books don't balance)
- Periodic reconciliation (trial balance, financial statements)

---

### Software Alignment Double-Entry

```
Change: Add homepage hero copy
Tier 0:  Tests (e2e/homepage.spec.ts)    → Copy verified in browser
Tier 1:  Code (app/page.tsx)             → Hero component updated
Tier 2:  Runbook (voice-and-tone.md)     → Copy follows voice guide
Tier 3:  Plan (homepage-copy-plan.md)    → Task marked complete
Tier 4:  Roadmap (Constraint A)          → Exit criterion verified
Tier 5:  Re-Strategy (Part 04)           → Brand canon satisfied
Tier 6:  CLAUDE.md                       → Fractal Alignment enforced
                                          -------------------------
Balance: All tiers reference each other   → System aligned
```

**Properties:**
- Every change recorded at multiple tiers (7 tiers: 0-6)
- Lower tiers must reference higher tiers (upward propagation)
- Higher tiers must have evidence from lower tiers (downward verification)
- Meta-tier (6) ensures system applies to itself ("eating our own dog food")
- Audit trail preserved (work log, git history, evidence files)
- Drift detectable (weekly review finds unbalanced tiers)
- Periodic reconciliation (weekly constraint review, audit checklist)

---

## The Fractal Nature

The same double-entry pattern repeats at **every scale**:

### Scale 1: File Level (Tier 0 → Tier 1)
```
Code Change:
  Entry 1: Production code (lib/calculations/instant-profile.ts)
  Entry 2: Test file (tests/calculations/instant-profile.test.ts)

Verification: Tests must pass (TDD)
Reconciliation: npm test
```

### Scale 2: Feature Level (Tier 1 → Tier 2)
```
Feature Implementation:
  Entry 1: Code files (components/forms/ProgressiveFormWithController.tsx)
  Entry 2: Runbook (docs/runbooks/forms/mobile-optimization-guide.md)

Verification: Code follows runbook patterns
Reconciliation: Code review checks runbook adherence
```

### Scale 3: Work Package Level (Tier 2 → Tier 3)
```
Work Package:
  Entry 1: Implementation (code + runbook)
  Entry 2: Plan (docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md)

Verification: Plan success criteria met
Reconciliation: Plan completion checklist
```

### Scale 4: Constraint Level (Tier 3 → Tier 4)
```
Constraint Work:
  Entry 1: Completed plans (archived with evidence)
  Entry 2: Roadmap exit criteria (docs/plans/ROADMAP.md Constraint A)

Verification: All exit criteria have evidence
Reconciliation: Constraint A audit checklist
```

### Scale 5: Strategy Level (Tier 4 → Tier 5)
```
Strategic Alignment:
  Entry 1: Roadmap constraint status (Constraint A: ✅)
  Entry 2: Re-strategy parts (Part 02 Stage 0 checklist satisfied)

Verification: Stage 0 launch gate complete
Reconciliation: Weekly constraint review
```

### Scale 6: Meta-Level (Tier 5 → Tier 6)
```
System Governance:
  Entry 1: Re-strategy parts satisfy constraints
  Entry 2: CLAUDE.md enforces fractal alignment

Verification: Runbooks exist for all processes mentioned in CLAUDE.md
Reconciliation: Meta-audit checks that docs self-reference correctly
```

**Example:**
- CLAUDE.md says: "Follow constraint implementation workflow"
- Verification: Does `docs/runbooks/strategy/constraint-implementation-workflow.md` exist? ✅
- Verification: Does it implement what CLAUDE.md describes? ✅
- Verification: Is it referenced in re-strategy? ✅

**Fractal property:** The pattern is **self-similar** at all scales. Zoom in or out, the structure is the same. **The system even applies to itself** (meta-tier).

---

## The Bidirectional Verification Cycle

Every change creates **two verification directions**:

### Upward Propagation (Implementation → Strategy)

```
1. Write code                       → Tier 1 (canonical files)
2. Code follows runbook             → Tier 2 (implementation guide)
3. Runbook fulfills plan            → Tier 3 (decisions/tasks)
4. Plan serves constraint           → Tier 4 (exit criteria)
5. Constraint advances strategy     → Tier 5 (re-strategy parts)
6. Strategy enforced by governance  → Tier 6 (CLAUDE.md, skills, commands)
```

**Verification:** Each step asks: "Does this tier reference the tier above?"

### Downward Verification (Strategy → Evidence)

```
1. CLAUDE.md enforces alignment     → Tier 6 (system governance)
2. Re-strategy defines constraints  → Tier 5 (strategic intent)
3. Roadmap defines exit criteria    → Tier 4 (measurable outcomes)
4. Plans define success criteria    → Tier 3 (specific tasks)
5. Runbooks define patterns         → Tier 2 (how to implement)
6. Code implements patterns         → Tier 1 (actual execution)
7. Tests prove correctness          → Tier 0 (evidence)
```

**Verification:** Each step asks: "Is there evidence from the tier below?"

---

## The Reconciliation Cycle (Weekly Review)

Like an accountant running a trial balance, we periodically verify tiers balance:

### Reconciliation Questions

**For each constraint in the matrix:**

1. **Meta → Strategy:**
   - Question: "Does CLAUDE.md enforce fractal alignment?"
   - Check: Skills/commands exist to verify tiers ✅

2. **Strategy → Roadmap:**
   - Question: "Does roadmap constraint match re-strategy part?"
   - Check: Constraint A references Part 02 + Part 04 ✅

3. **Roadmap → Plans:**
   - Question: "Do active plans reference correct constraint?"
   - Check: All 11 active plans say "Constraint A" ✅

4. **Plans → Runbooks:**
   - Question: "Do plans reference existing runbooks?"
   - Check: Plans link to runbooks, or CAN tasks exist to create them ✅

5. **Runbooks → Code:**
   - Question: "Does code follow runbook patterns?"
   - Check: Code review verifies adherence (manual or automated)

6. **Code → Tests:**
   - Question: "Do tests verify code correctness?"
   - Check: `npm test` passes, coverage >70% ✅

7. **Tests → Evidence:**
   - Question: "Is evidence collected and linked?"
   - Check: Stage 0 gate has evidence links ✅

**If ANY check fails:** Books don't balance → Drift detected → Remediate before proceeding.

---

## The Audit Trail

Every change leaves a traceable path across all tiers:

### Example: "Add accessibility checklist" (CAN-037)

**Tier 6 (Meta):**
```
CLAUDE.md → "Follow fractal alignment workflow"
.claude/skills/fractal-alignment.md → Enforces CHECK/IMPLEMENT/VERIFY cycle
```

**Tier 5 (Re-Strategy):**
```
Part 04 Brand & UX Canon → "WCAG AA minimum for all public surfaces"
```

**Tier 4 (Roadmap):**
```
Constraint A Exit Criteria → "WCAG AA verified"
CAN-037 in master-task-list.csv → "Create accessibility checklist runbook"
```

**Tier 3 (Plan):**
```
docs/plans/active/2025-10-XX-accessibility-implementation-plan.md
Success Criteria: "All form inputs have ARIA labels"
References: CAN-037, Constraint A
```

**Tier 2 (Runbook):**
```
docs/runbooks/design/accessibility-checklist.md
Pattern: "Use <label> or aria-label for all inputs"
References: WCAG 2.1 Level AA guidelines
```

**Tier 1 (Code):**
```
components/forms/ProgressiveFormWithController.tsx
<input aria-label="Property price" ... />
References: docs/runbooks/design/accessibility-checklist.md
```

**Tier 0 (Test):**
```
tests/a11y/form-accessibility.test.ts
expect(input).toHaveAttribute('aria-label')
```

**Evidence:**
```
validation-reports/accessibility-scan-2025-10-31.pdf
axe DevTools: 0 critical issues ✅
```

**Work Log:**
```
docs/work-log.md
## Accessibility Implementation (CAN-037)
- Tier: 2 (Runbook)
- Created runbook
- Updated form components
- Tests pass, axe scan clean
- Evidence: validation-reports/accessibility-scan-2025-10-31.pdf
```

**Audit trail:** You can trace from **any tier** up to meta-tier or down to evidence. No orphaned work.

---

## The Meta-Skill: Fractal Alignment Enforcement

### Core Operations

The meta-skill enforces this system through **4 primitive operations**:

#### 1. **CHECK** (Pre-Implementation)
```
Input: Intent to change X
Process:
  - Identify tier of change (0-5)
  - Verify reference to tier above exists
  - Verify runbook/plan/constraint exists
  - Verify no conflicting changes in progress
Output: GO/NO-GO decision
```

#### 2. **IMPLEMENT** (During)
```
Input: Change approved by CHECK
Process:
  - Make change at target tier
  - Create/update reference to tier above
  - Update TodoWrite with progress
  - Log in work-log.md
Output: Changed files + log entries
```

#### 3. **VERIFY** (Post-Implementation)
```
Input: Completed change
Process:
  - Collect evidence (tests, screenshots, metrics)
  - Verify success criteria met (from tier above)
  - Update status in tier above (plan/roadmap/matrix)
  - Link evidence in tracking docs
Output: Evidence files + status updates
```

#### 4. **RECONCILE** (Periodic)
```
Input: Time-based trigger (weekly)
Process:
  - For each constraint, verify tiers balance
  - Detect drift (missing references, orphaned work)
  - Update status emojis
  - Assign remediation tasks
Output: Updated matrix + CAN task assignments
```

---

## The Skill Implementation

### Skill Prompt Structure

```markdown
# Fractal Alignment Skill

You are enforcing the fractal double-entry alignment system.

## Context Loaded:
- Re-strategy parts (Tier 5)
- Roadmap constraints (Tier 4)
- Active plans (Tier 3)
- Runbooks (Tier 2)
- CANONICAL_REFERENCES.md (Tier 1)
- Recent work log entries

## User Request: [USER_INPUT]

## Step 1: Identify Tier
What tier is this change targeting?
- [ ] Tier 6 (meta - CLAUDE.md, skills, commands)
- [ ] Tier 5 (re-strategy)
- [ ] Tier 4 (roadmap/constraints)
- [ ] Tier 3 (plans)
- [ ] Tier 2 (runbooks)
- [ ] Tier 1 (code)
- [ ] Tier 0 (tests)

## Step 2: CHECK Operation
Run pre-implementation alignment check:
1. Active constraint: [extract from matrix]
2. CAN task: [search backlog]
3. Runbook: [check existence]
4. Tier 1 rules: [check CANONICAL_REFERENCES.md]
5. Conflicts: [check work log, active plans]

If ANY check fails → STOP and report blocker.

## Step 3: IMPLEMENT Operation
If checks pass:
1. Make change at target tier
2. Create reference to tier above
3. Update TodoWrite
4. Log in work-log.md

## Step 4: VERIFY Operation
After implementation:
1. Collect evidence (run tests, take screenshots)
2. Verify success criteria from tier above
3. Update status in tier above
4. Link evidence

## Step 5: Report
Provide audit trail showing:
- Tier of change
- References up (to strategy)
- References down (to evidence)
- Status updates made

## Red Flags:
🚩 Change has no tier above (orphaned work)
🚩 Tier above has no CAN task (untracked work)
🚩 Runbook missing and no CAN task to create it
🚩 Evidence not collected after completion
🚩 Multiple constraints in progress
```

---

## Integration with Existing Tools

### TodoWrite Integration
```javascript
// Every IMPLEMENT operation creates todos in pairs:
[
  // Entry 1: The work itself
  {content: "Update hero component", status: "in_progress", activeForm: "Updating"},
  // Entry 2: The verification
  {content: "Verify hero follows voice guide (CAN-036)", status: "pending", activeForm: "Verifying"}
]
```

### Work Log Integration
```markdown
Every completed work creates paired entries:

## [Feature Name] - Implementation
Entry 1: What was built (Tier 1-2)

## [Feature Name] - Verification
Entry 2: Evidence collected (Tier 0, references to Tier 3-5)
```

### Matrix Integration
```markdown
Status updates are bidirectional:

Constraint A: 🟡
  ↓ (references down)
Active plans: 11 plans → Constraint A
  ↓ (references down)
Runbooks: 3 created (CAN-033, CAN-051)
  ↓ (references down)
Code: Changes in 15 files
  ↓ (references down)
Tests: 97/97 passing
  ↓ (references down)
Evidence: validation-reports/

  ↑ (propagates up)
When all evidence collected → Update Constraint A: ✅
```

---

## Preventing Common Drift Patterns

### Drift Type 1: Orphaned Code
```
Symptom: Code exists but no runbook/plan references it
Detection: Reconciliation finds code with no tier-2 reference
Prevention: CHECK operation blocks code without runbook
Remediation: Create missing runbook or delete orphaned code
```

### Drift Type 2: Zombie Plans
```
Symptom: Plan exists but work already complete/abandoned
Detection: Plan in active/ but no recent work log entries
Prevention: Weekly review archives completed plans
Remediation: Archive or delete stale plans
```

### Drift Type 3: Evidence Gap
```
Symptom: Status marked ✅ but no evidence linked
Detection: Audit checklist finds missing evidence files
Prevention: VERIFY operation requires evidence before status update
Remediation: Collect evidence retroactively or revert status
```

### Drift Type 4: Multi-Constraint Violations
```
Symptom: Work on Constraint B while Constraint A incomplete
Detection: Weekly review finds multiple constraints 🟡
Prevention: CHECK operation blocks work on non-active constraint
Remediation: Pause future work, focus on active constraint
```

### Drift Type 5: Tier Skipping
```
Symptom: Code implemented without runbook (Tier 1 → Tier 3)
Detection: Plan references code directly, no runbook exists
Prevention: CHECK operation requires runbook before implementation
Remediation: Extract runbook from code, update references
```

---

## The Fractal Balance Equation

At any moment, the system is **balanced** when:

```
∀ tiers t ∈ {0,1,2,3,4,5,6}:
  references_up(t) ≠ ∅        // Every tier references tier above
  ∧
  evidence_down(t) ≠ ∅        // Every tier has evidence below
  ∧
  active_constraint_only(t)   // All work serves active constraint
  ∧
  audit_trail_exists(t)       // Work log documents change
  ∧
  (t = 6 → self_consistent(t)) // Meta-tier verifies itself
```

**Imbalance indicators:**
- `references_up(t) = ∅` → Orphaned work
- `evidence_down(t) = ∅` → Unverified claim
- `¬active_constraint_only(t)` → Premature future work
- `¬audit_trail_exists(t)` → Undocumented change
- `(t = 6 ∧ ¬self_consistent(t))` → Meta-tier hypocrisy ("do as I say, not as I do")

**Weekly review:** Run balance equation, remediate imbalances.

---

## Visualizing the Fractal

```
            CLAUDE.md + AGENTS.md (Tier 6)
            System Governance
                      ║
                      ║ (enforces alignment)
                      ▼
                Re-Strategy (Tier 5)
                Part 01, 02, 03, 04...
                      ║
                      ║ (defines constraints)
                      ▼
                Roadmap (Tier 4)
                Constraint A/B/C/D
                      ║
    ╔═════════════════╬═════════════════╗
    ║                 ║                 ║
    ▼                 ▼                 ▼
Plan 1            Plan 2            Plan N  (Tier 3)
CAN-001           CAN-036           CAN-051
    ║                 ║                 ║
    ║ (references)    ║                 ║
    ▼                 ▼                 ▼
Runbook 1        Runbook 2         Runbook N (Tier 2)
brand/           design/           forms/
messaging.md     accessibility.md   mobile-opt.md
    ║                 ║                 ║
    ║ (implements)    ║                 ║
    ▼                 ▼                 ▼
Code 1           Code 2            Code N    (Tier 1)
app/page.tsx     components/       components/
                 forms/*.tsx       forms/*.tsx
    ║                 ║                 ║
    ║ (proves)        ║                 ║
    ▼                 ▼                 ▼
Test 1           Test 2            Test N    (Tier 0)
e2e/*.spec.ts    a11y/*.test.ts    hooks/*.test.tsx
    ║                 ║                 ║
    ╚═════════════════╬═════════════════╝
                      ║
                      ▼
                Evidence Archive
                validation-reports/
                test-results/
                screenshots/
```

**Notice:** At every level, the branching pattern repeats (fractal). **The system even applies to itself** (Tier 6 governs all tiers including itself).

---

## Meta-Verification: The System Checks Itself

**True fractal property:** The alignment system must apply to itself.

### Meta-Tier Checklist

**Every runbook/skill/governance doc must:**
1. ✅ Reference tier above (CLAUDE.md → re-strategy → constraints)
2. ✅ Have evidence below (tests, usage logs, work log entries)
3. ✅ Serve active constraint (even meta-docs align with strategy)
4. ✅ Create audit trail (changes to CLAUDE.md logged in work log)

### Example: This File (`fractal-alignment-system.md`)

**Tier 6 (Meta):** Itself - describes the system
**Tier 5:** References re-strategy (Part 02 constraint chain)
**Tier 4:** Serves Constraint A (prevents drift during public surface work)
**Tier 3:** Referenced by plans (plans say "per fractal alignment")
**Tier 2:** Implemented by other runbooks (workflow, review, audit)
**Tier 1:** Code follows patterns (tier references in comments)
**Tier 0:** Tests verify (skills work, processes followed)
**Evidence:** Work log shows system being used

**Self-check:** Does this file follow its own rules? YES

### Self-Consistency Requirements

**When modifying Tier 6 files:**

1. **CLAUDE.md changes:**
   - Must be logged in work log
   - Must reference re-strategy principles
   - Must serve active constraint (even meta changes align with strategy)
   - Must follow own documented workflow (eat your own dog food)

2. **Skill changes:**
   - Must be referenced in CLAUDE.md (discoverable)
   - Must implement what CLAUDE.md describes
   - Must enforce the fractal alignment rules
   - Must not violate rules they enforce

3. **Slash command changes:**
   - Must be documented in CLAUDE.md
   - Must work as documented
   - Must support documented workflows
   - Must be tested before commitment

**Red flag:** Meta-tier doc that violates its own principles = Hypocrisy = System drift

---

## Success Criteria

The system is working when:

✅ **No orphaned work** - Every file references higher tier
✅ **No unverified claims** - Every status has evidence
✅ **Single bottleneck** - All work serves active constraint
✅ **Audit trail complete** - Every change logged
✅ **Weekly balance** - Reconciliation finds no drift
✅ **Fast detection** - Drift caught within 1 week (not months)
✅ **Self-documenting** - New team members can trace any feature

---

## When to Use This System

**Use for:**
- Any change affecting public surfaces (Constraint A critical path)
- New features or major refactors
- Work spanning multiple tiers (code + runbook + plan)
- Production releases

**Can skip for:**
- Trivial fixes (typos, comments) affecting single file
- Local development experiments (not committed)
- Work explicitly marked as "exploratory" in work log

**But still log experiments:** Even explorations should note intent and outcome.

---

*Last updated: 2025-10-31*
