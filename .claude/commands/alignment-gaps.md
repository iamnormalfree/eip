# Alignment Gaps

**Purpose:** Quick drift detection - check if tiers are balanced and identify misalignments.

**Usage:** `/alignment-gaps`

**When to use:**
- Things feel "off" but can't pinpoint why
- Between weekly reviews (quick health check)
- After major work completed (verify alignment maintained)
- Before claiming constraint complete

---

## Instructions for Claude

Run the **fractal balance equation** and report gaps:

### Step 1: Check Tier Balance (Bidirectional References)

For the **active constraint only**, verify:

```bash
# 1. Constraint → Re-Strategy (Tier 4 → Tier 5)
#    Does constraint reference correct re-strategy parts?

# 2. Plans → Constraint (Tier 3 → Tier 4)
#    Do active plans reference active constraint?

# 3. Runbooks → Plans (Tier 2 → Tier 3)
#    Do plans reference existing runbooks (or CAN tasks to create them)?

# 4. Code → Runbooks (Tier 1 → Tier 2)
#    Does code follow runbook patterns? (sample check)

# 5. Tests → Code (Tier 0 → Tier 1)
#    Do tests verify code? (run npm test)

# 6. Evidence → Status (Tier 0 → all)
#    Are status claims backed by evidence?
```

---

### Step 2: Detect Drift Patterns

Check for these 6 red flags:

#### 🚩 Red Flag 1: Multiple Constraints In Progress
```bash
# Count constraints with 🟡 status
grep -c "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md
```

**Should be:** 1
**If >1:** Violates Theory of Constraints (single bottleneck)

---

#### 🚩 Red Flag 2: Future-Constraint Work
```bash
# Check if active plans reference non-active constraint
# Extract constraint from each plan's "Constraint Alignment" section
# Flag mismatches
```

**Should be:** All plans reference active constraint
**If mismatched:** Premature work on future constraints

---

#### 🚩 Red Flag 3: Missing Runbooks
```bash
# From active plans, extract runbook references
# Check if runbooks exist
# Check if CAN task exists to create missing runbooks
```

**Should be:** Runbooks exist OR CAN task scheduled
**If neither:** Tier skipping (code without implementation guide)

---

#### 🚩 Red Flag 4: Unverified Status Claims
```bash
# From Stage 0 gate (if Constraint A), check items marked ✅
# Verify evidence links present and files exist
```

**Should be:** Every ✅ has evidence link
**If missing:** Unverified claims (books don't balance)

---

#### 🚩 Red Flag 5: Stale CAN Tasks
```bash
# From master-task-list.csv, find tasks "In Progress" for active constraint
# Check work-log.md for recent updates on these tasks
# Flag tasks with no updates in >14 days
```

**Should be:** Progress logged within 2 weeks
**If stale:** Likely blocked or forgotten

---

#### 🚩 Red Flag 6: Silent Work Log
```bash
# Check docs/work-log.md for entries in last 7 days
# Count entries
```

**Should be:** At least 1 entry per week
**If silent:** Team not documenting or not working

---

### Step 3: Check Test Health
```bash
# Run test suite
npm test 2>&1 | tail -20

# Extract pass/fail counts
# Check for skipped tests (.skip, .todo)
```

---

### Step 4: Check Plan Length Drift
```bash
# Run plan validation
bash scripts/validate-plan-length.sh 2>&1 | grep -E "ERROR|WARNING"
```

---

## Output Format

```markdown
🔍 **Alignment Gap Analysis**

**Active Constraint:** Constraint [X] - [Name]

---

### ✅ Tier Balance Check

Checking bidirectional references...

1. **Constraint → Re-Strategy:** ✅ References Part 02 + Part 04
2. **Plans → Constraint:** ✅ 11/11 plans reference Constraint A
3. **Runbooks → Plans:** ⚠️  2 runbooks missing (CAN-036, CAN-037 scheduled)
4. **Code → Runbooks:** ✅ Sampled 5 files, all reference runbooks
5. **Tests → Code:** ✅ 97/97 passing
6. **Evidence → Status:** ⚠️  3 items marked ✅ without evidence links

**Tier Balance:** 4/6 ✅, 2 ⚠️

---

### 🚩 Drift Patterns Detected

**Red Flags Found:** 2

1. ⚠️  **Missing Evidence (Red Flag 4)**
   - Stage 0 gate items marked ✅ without evidence:
     - Homepage copy approved (no evidence link)
     - Lighthouse audit complete (no report file)
     - WCAG scan passed (no axe DevTools results)

   **Action:** Collect and link evidence or revert status to 🟡

2. ⚠️  **Stale CAN Task (Red Flag 5)**
   - CAN-036 (voice guide): "In Progress" for 14 days, no work log updates

   **Action:** Check with Brent on blocker or reassign

**No Other Drift Detected:** ✅
- Single constraint active ✅
- No future-constraint work ✅
- Runbooks scheduled via CAN tasks ✅
- Work log active (3 entries this week) ✅
- Plan lengths compliant ✅

---

### 🧪 Test Health

**Status:** ✅ Healthy

```
Test Suites: 27 passed, 27 total
Tests:       97 passed, 97 total
```

**Issues:** None
**Coverage:** Not measured (run `npm test -- --coverage` for details)

---

### 📏 Plan Length Status

**Status:** ✅ Compliant

```
7/11 plans under 200 lines
4/11 plans with soft warnings (180-236 lines)
0/11 plans blocking (>250 lines)
```

**Action:** No immediate action needed (commits allowed)

---

### 📊 Summary

**Overall Health:** 🟡 Mostly Aligned (2 gaps)

**Critical Issues:** 0
**Warnings:** 2 (missing evidence, stale CAN task)
**Good Signals:** 5 (tier balance, tests, single constraint, active work log, plan compliance)

---

### 🎯 Remediation Steps

**This Week:**

1. **Collect missing evidence** (1 hour):
   - Take homepage screenshot → validation-reports/
   - Run Lighthouse → save JSON report
   - Run axe DevTools → save PDF scan
   - Link all in Stage 0 gate

2. **Check CAN-036 blocker** (30 min):
   - Ask Brent about voice guide progress
   - If blocked, reassign or rescope
   - Update work log with status

**Next Weekly Review:**
- Verify evidence collected
- Confirm CAN-036 unblocked or reassigned
- Re-run alignment gaps (should be 0/6 red flags)

---

### 💡 Quick Actions

- Fix evidence gap: Create `validation-reports/` and collect evidence
- Unblock CAN-036: Chat with Brent
- Re-check: Run `/alignment-gaps` after fixes
- Schedule: Weekly review Monday using `weekly-constraint-review.md`
```

---

## Healthy System Output

If no gaps detected:

```
🔍 Alignment Gap Analysis

**Active Constraint:** Constraint A - Public Surface Readiness

---

✅ **System Balanced** - No Drift Detected

**Tier Balance:** 6/6 ✅
- Constraint → Re-Strategy ✅
- Plans → Constraint ✅
- Runbooks → Plans ✅
- Code → Runbooks ✅
- Tests → Code (97/97 passing) ✅
- Evidence → Status ✅

**Drift Patterns:** 0/6 red flags

**Test Health:** ✅ 97/97 passing
**Plan Compliance:** ✅ 7/11 compliant, 4 warnings

**Last Weekly Review:** 3 days ago ✅

---

🎉 **System is healthy!**

Keep it that way:
- Run `/check-alignment` before each code change
- Update work log when milestones reached
- Run weekly review on Monday
- Collect evidence as you complete work
```

---

## Critical Drift Output

If major issues detected:

```
🚨 **CRITICAL DRIFT DETECTED**

**Red Flags:** 4/6

1. 🚩 Multiple constraints in progress (A, B both 🟡)
2. 🚩 5 plans working on Constraint B (A is supposed to be active)
3. 🚩 Code committed without runbooks (3 files reference missing guides)
4. 🚩 Work log silent for 14 days

---

⚠️  **IMMEDIATE ACTION REQUIRED**

The system has drifted significantly. Do not continue normal work.

**Stop and run:**
1. Emergency weekly review: `docs/runbooks/strategy/weekly-constraint-review.md`
2. Identify true bottleneck (Theory of Constraints)
3. Pause all work on non-active constraint
4. Create missing runbooks before more coding
5. Update work log with current status

**Escalate to Brent** if unclear how to proceed.

System integrity at risk - remediate within 24 hours.
```

---

## Error Handling

If cannot run checks:

```
❌ Cannot perform alignment gap analysis

Errors:
- File not found: docs/plans/re-strategy/strategy-alignment-matrix.md
- File not found: docs/plans/re-strategy/backlog/master-task-list.csv

Ensure Phase 7 handoff complete and files committed.
```

---

*Command created: 2025-10-31*
