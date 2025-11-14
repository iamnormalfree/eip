---
name: tier-sync-validator
description: Automatically runs drift detection when system feels misaligned. Checks fractal balance equation, validates tier synchronization, detects 6 red flag patterns. Auto-activates on keywords like "things feel off", "check for drift", "system health". Backs up /alignment-gaps slash command.
---

# Tier Sync Validator

Automatically detects system drift when user senses misalignment. Runs the fractal balance equation to verify bidirectional references across all tiers and identifies 6 common drift patterns. This skill backs up the `/alignment-gaps` slash command.

## When to Use This Skill

**Auto-activates when user says:**
- "Things feel off"
- "Check for drift"
- "System health check"
- "Something feels wrong"
- "Are we aligned?"
- "Verify balance"
- "Check gaps"
- "Feels like we're drifting"

**Context triggers (moderate confidence):**
- After major work completed
- Before claiming constraint complete
- Between weekly reviews
- User expresses uncertainty about priorities

**Explicit invocation:**
```
Use the tier-sync-validator skill for drift detection
```

**Slash command alternative:**
```
/alignment-gaps
```

**Do NOT activate for:**
- Specific bugs (use systematic-debugging)
- Code questions
- Implementation help
- Just ran /alignment-gaps <1 hour ago

---

## Core Functionality

### Step 1: Check Tier Balance (Bidirectional References)

**For active constraint only, verify:**

```markdown
Tier 5 ↔ Tier 4: Re-Strategy ↔ Constraint
- Does constraint reference correct re-strategy parts?
- Example: Constraint A → Part 02 (Brand/UX), Part 04 (Public Surface)

Tier 4 ↔ Tier 3: Constraint ↔ Plans
- Do active plans reference active constraint?
- Example: All 11 plans should have "Constraint: A" in frontmatter

Tier 3 ↔ Tier 2: Plans ↔ Runbooks
- Do plans reference existing runbooks?
- Or: Do CAN tasks exist to create missing runbooks?
- Example: Plan references docs/runbooks/forms/validation-guide.md

Tier 2 ↔ Tier 1: Runbooks ↔ Code
- Does code follow runbook patterns?
- Sample check: Read 5 random code files, verify runbook references
- Example: Code comments reference runbook sections

Tier 1 ↔ Tier 0: Code ↔ Tests
- Do tests verify code?
- Run: npm test
- Example: 97/97 tests passing

Tier 0 ↔ All: Evidence ↔ Status
- Are status claims backed by evidence?
- Example: Stage 0 gate ✅ items have evidence links
```

**Validation:**

```bash
# 1. Check plans reference active constraint
grep -h "Constraint:" docs/plans/active/*.md | sort | uniq -c

# 2. Check runbook references in plans
grep -h "docs/runbooks/" docs/plans/active/*.md | wc -l

# 3. Sample code for runbook references
find lib components -name "*.ts" -o -name "*.tsx" | head -5 | xargs grep -l "docs/runbooks/"

# 4. Run tests
npm test 2>&1 | tail -20

# 5. Check evidence links in Stage 0 gate
grep "✅" docs/plans/re-strategy/stage0-launch-gate.md | grep -c "Evidence:"
```

**Output:**

```markdown
### ✅ Tier Balance Check

Checking bidirectional references...

1. **Constraint → Re-Strategy:** ✅ References Part 02 + Part 04
2. **Plans → Constraint:** ✅ 8/8 plans reference Constraint A
3. **Runbooks → Plans:** ⚠️ 2 runbooks missing (CAN-036, CAN-037 scheduled)
4. **Code → Runbooks:** ✅ Sampled 5 files, 3 reference runbooks
5. **Tests → Code:** ✅ 97/97 passing
6. **Evidence → Status:** ⚠️ 3 items marked ✅ without evidence links

**Tier Balance:** 4/6 ✅, 2 ⚠️
```

---

### Step 2: Detect Drift Patterns (6 Red Flags)

**Red Flag 1: Multiple Constraints In Progress**

```bash
# Count constraints with 🟡 status
grep -c "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md

# Should be: 1 (single bottleneck)
# If >1: Violates Theory of Constraints
```

**Detection:**

```markdown
🚩 Red Flag 1: Multiple Constraints In Progress

Matrix shows:
- Constraint A: 🟡 (12 days active)
- Constraint B: 🟡 (5 days active)

**Problem:** Violates single bottleneck rule

**Impact:**
- Splits focus across 2 constraints
- Reduces velocity on both
- Increases context switching

**Action:** Run weekly review, identify true bottleneck, pause other
```

---

**Red Flag 2: Future-Constraint Work**

```bash
# Extract constraint from each plan
for plan in docs/plans/active/*.md; do
    echo "$plan: $(grep 'Constraint:' $plan | head -1)"
done

# Compare with active constraint
# Flag mismatches
```

**Detection:**

```markdown
🚩 Red Flag 2: Future-Constraint Work

**Active Constraint:** A

**Plans by constraint:**
- Constraint A: 5 plans ✅
- Constraint B: 3 plans ⚠️
- Constraint C: 2 plans ⚠️

**Problem:** 5 plans working on future constraints

**Impact:**
- Premature work on Constraints B, C
- Active Constraint A only 5/10 plans focused
- Plan proliferation (10 total)

**Action:** Archive future-constraint plans (5 plans)
```

---

**Red Flag 3: Missing Runbooks**

```bash
# Extract runbook references from plans
grep -h "docs/runbooks/" docs/plans/active/*.md | sort -u

# Check if files exist
while read path; do
    [ -f "$path" ] || echo "MISSING: $path"
done

# Check if CAN task exists to create missing runbooks
grep -l "Create.*runbook" docs/plans/backlog/master-task-list.csv
```

**Detection:**

```markdown
🚩 Red Flag 3: Missing Runbooks

**Plans reference these runbooks:**
- docs/runbooks/forms/validation-guide.md ✅ (exists)
- docs/runbooks/design/accessibility-checklist.md ❌ (missing)
- docs/runbooks/mobile/responsive-patterns.md ❌ (missing)

**CAN tasks to create:**
- CAN-037: Create accessibility-checklist.md ✅ (scheduled)
- CAN-051: Create responsive-patterns.md ❌ (not scheduled)

**Problem:** 1 runbook missing without CAN task

**Impact:**
- Tier skipping (Plan → Code without Runbook)
- Implementation guidance missing
- Pattern inconsistency risk

**Action:** Create CAN task for responsive-patterns.md runbook
```

---

**Red Flag 4: Unverified Status Claims**

```bash
# From Stage 0 gate, check ✅ items have evidence
grep "✅" docs/plans/re-strategy/stage0-launch-gate.md

# For each ✅, verify evidence link present
grep -A 2 "✅" docs/plans/re-strategy/stage0-launch-gate.md | grep "Evidence:"

# Check if evidence files exist
```

**Detection:**

```markdown
🚩 Red Flag 4: Unverified Status Claims

**Stage 0 items marked ✅ without evidence:**
1. Homepage copy approved
   - No evidence link
   - No validation-reports/brand/homepage-copy-v2.md

2. Lighthouse audit complete
   - No evidence link
   - No validation-reports/lighthouse/homepage-score.json

3. WCAG scan passed
   - No evidence link
   - No validation-reports/accessibility/axe-scan.pdf

**Problem:** Claims without evidence (books don't balance)

**Impact:**
- Cannot verify completion
- May be incomplete work marked done
- Audit trail broken

**Action:** Collect and link evidence, or revert status to 🟡
```

---

**Red Flag 5: Stale CAN Tasks**

```bash
# Find tasks "In Progress" for active constraint
grep "In Progress.*Constraint A" docs/plans/backlog/master-task-list.csv

# For each task, check work-log for recent updates
for task in CAN-036 CAN-037; do
    last_update=$(grep -n "$task" docs/work-log.md | tail -1)
    # Calculate days since update
done

# Flag tasks with no updates >14 days
```

**Detection:**

```markdown
🚩 Red Flag 5: Stale CAN Tasks

**Tasks "In Progress" >14 days without updates:**
- CAN-036: Voice guide (In Progress for 21 days)
  - Last work-log mention: 2025-10-15 (20 days ago)
  - Owner: Brent

**Problem:** Task likely blocked or forgotten

**Impact:**
- Blocks dependent work
- Progress unclear
- May need reassignment

**Action:** Check with Brent on blocker or reassign
```

---

**Red Flag 6: Silent Work Log**

```bash
# Check work-log.md for entries in last 7 days
today=$(date +%Y-%m-%d)
seven_days_ago=$(date -d '7 days ago' +%Y-%m-%d)

# Count entries between dates
grep -E "^## 2025-" docs/work-log.md | awk -F' - ' '{print $1}' | grep -c "^##.*2025-1[01]-[0-2][0-9]"
```

**Detection:**

```markdown
🚩 Red Flag 6: Silent Work Log

**Last 7 days:** 0 entries
**Last entry:** 2025-10-21 (14 days ago)

**Problem:** No documented work in 2 weeks

**Impact:**
- Team not documenting progress
- Or team not working (concerning)
- Audit trail gap
- Evidence collection delayed

**Action:** Update work-log.md with recent work, or investigate blockers
```

---

### Step 3: Check Test Health

**Run test suite:**

```bash
# Run npm test
npm test 2>&1 | tail -20

# Extract:
# - Test suites passing/failing
# - Tests passing/failing
# - Skipped tests (.skip, .todo)
# - Errors or warnings
```

**Output:**

```markdown
### 🧪 Test Health

**Status:** ✅ Healthy

```
Test Suites: 27 passed, 27 total
Tests:       97 passed, 97 total
Snapshots:   0 total
Time:        12.456s
```

**Issues:** None
**Skipped Tests:** 0
**Coverage:** Not measured (run `npm test -- --coverage`)
```

**If tests failing:**

```markdown
### 🧪 Test Health

**Status:** ❌ FAILING

```
Test Suites: 2 failed, 25 passed, 27 total
Tests:       3 failed, 94 passed, 97 total
```

**Failing Tests:**
1. instant-profile.test.ts: "calculates TDSR correctly"
   - Error: Expected 0.42, received 0.43
2. form-validation.test.ts: "validates email format"
   - Error: Invalid email passed validation

**Action:** Fix failing tests before proceeding (CLAUDE.md mandate)
```

---

### Step 4: Check Plan Length Drift

**Run validation script:**

```bash
# Run plan length validator
bash scripts/validate-plan-length.sh 2>&1 | grep -E "ERROR|WARNING|lines"

# Extract:
# - Plans over soft limit (180 lines)
# - Plans over hard limit (250 lines)
# - Compliant plans
```

**Output:**

```markdown
### 📏 Plan Length Status

**Status:** ✅ Compliant

```
Checking active plans...
✓ 2025-11-03-unified-chat-hook.md (187 lines - WARNING: approaching limit)
✓ 2025-10-31-brand-kit-refresh.md (145 lines)
✓ 2025-11-02-accessibility-audit.md (123 lines)
```

**Summary:**
- 7/8 plans under 180 lines
- 1/8 plans soft warning (180-199 lines)
- 0/8 plans blocking (>250 lines)

**Action:** No immediate action (commits allowed)
```

**If over limit:**

```markdown
### 📏 Plan Length Status

**Status:** ⚠️ WARNING

```
ERROR: 2025-10-22-ai-broker-sla.md (267 lines) - OVER LIMIT (250)
WARNING: 2025-11-03-unified-chat-hook.md (236 lines) - approaching limit
```

**Problem:** 1 plan over hard limit, blocks commits

**Action:**
1. Extract implementation details to runbook
2. Split into multiple phase plans
3. Archive completed sections

**Until fixed:** Pre-commit hook will block commits
```

---

## Integration with NextNest Frameworks

### Runs Fractal Balance Equation

```markdown
From CLAUDE.md fractal alignment system:

System is aligned when:
✅ Every tier references tier above (↑ upward alignment)
✅ Every tier has evidence below (↓ downward verification)
✅ All work serves active constraint (single bottleneck)
✅ Audit trail exists in work log

This skill verifies all 4 conditions:
1. Bidirectional tier references (Step 1)
2. Evidence backing claims (Red Flag 4)
3. Single constraint focus (Red Flag 1, 2)
4. Work log active (Red Flag 6)
```

### Follows CLAUDE.md Standards

```markdown
Enforces:
✅ Plan length limits (<200 lines soft, <250 hard)
✅ Test health (all tests passing)
✅ Evidence-based completion (claims need evidence)
✅ Work log documentation (weekly updates)

Detects:
🚩 Plan proliferation (>5 active plans)
🚩 Future-constraint work (wrong bottleneck)
🚩 Missing runbooks (tier skipping)
🚩 Stale CAN tasks (>14 days silent)
```

### Integrates with Weekly Review

```markdown
Provides input for: docs/runbooks/strategy/weekly-constraint-review.md

Key metrics:
- Tier balance score (X/6 ✅)
- Drift pattern count (X/6 red flags)
- Test health (passing/failing)
- Plan compliance (X/Y compliant)
- Days since last review

Enables: Data-driven weekly constraint review
```

### Syncs with Slash Commands

```markdown
This skill backs up: /alignment-gaps

Sequential workflow:
1. constraint-router → Get status overview
2. constraint-aware-context → Validate before work
3. [Implement]
4. evidence-collector → Document completion
5. tier-sync-validator → Check drift (auto or explicit)
6. Weekly review → Comprehensive analysis
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "things feel off"
- "check for drift"
- "alignment gaps"
- "system health"
- "verify balance"
- "check gaps"

**Moderate confidence triggers:**
- "feels wrong"
- "something off"
- "are we aligned"
- "drifting"
- "balance check"

**Context triggers:**
- After completing major milestone
- Before claiming constraint complete
- Between weekly reviews
- User expresses uncertainty

**Anti-triggers (DO NOT activate):**
- Specific bugs (use systematic-debugging)
- Implementation questions
- Just ran /alignment-gaps recently

---

## Output Examples

### Example 1: Healthy System (No Drift)

```markdown
🔍 **Alignment Gap Analysis**

**Active Constraint:** Constraint A – Public Surface Readiness

---

✅ **System Balanced** - No Drift Detected

**Tier Balance:** 6/6 ✅
- Constraint → Re-Strategy ✅
- Plans → Constraint (8/8) ✅
- Runbooks → Plans ✅
- Code → Runbooks ✅
- Tests → Code (97/97 passing) ✅
- Evidence → Status ✅

**Drift Patterns:** 0/6 red flags
- ✅ Single constraint active (Constraint A)
- ✅ No future-constraint work (8/8 plans aligned)
- ✅ Runbooks exist or scheduled
- ✅ All status claims have evidence
- ✅ No stale CAN tasks
- ✅ Work log active (3 entries this week)

**Test Health:** ✅ 97/97 passing
**Plan Compliance:** ✅ 7/8 compliant, 1 soft warning

**Last Weekly Review:** 3 days ago ✅

---

🎉 **System is healthy!**

Keep it that way:
- Run `/check-alignment` before each code change
- Update work log when milestones reached
- Run weekly review on Monday
- Collect evidence as you complete work
```

### Example 2: Minor Drift (2 Warnings)

```markdown
🔍 **Alignment Gap Analysis**

**Active Constraint:** Constraint A – Public Surface Readiness

---

### ✅ Tier Balance Check

1. **Constraint → Re-Strategy:** ✅ References Part 02 + Part 04
2. **Plans → Constraint:** ✅ 5/5 plans reference Constraint A
3. **Runbooks → Plans:** ⚠️ 2 runbooks missing (CAN-036, CAN-037 scheduled)
4. **Code → Runbooks:** ✅ Sampled 5 files, 3 reference runbooks
5. **Tests → Code:** ✅ 97/97 passing
6. **Evidence → Status:** ⚠️ 3 items marked ✅ without evidence links

**Tier Balance:** 4/6 ✅, 2 ⚠️

---

### 🚩 Drift Patterns Detected

**Red Flags Found:** 2

1. ⚠️ **Missing Evidence (Red Flag 4)**
   - Stage 0 gate items marked ✅ without evidence:
     - Homepage copy approved (no link)
     - Lighthouse audit complete (no report)
     - WCAG scan passed (no results)

   **Action:** Collect and link evidence or revert status to 🟡

2. ⚠️ **Stale CAN Task (Red Flag 5)**
   - CAN-036 (voice guide): "In Progress" 14 days, no work log updates

   **Action:** Check with Brent on blocker or reassign

**No Other Drift:** ✅
- Single constraint active ✅
- No future-constraint work ✅
- Runbooks scheduled via CAN tasks ✅
- Work log active (3 entries this week) ✅
- Plan lengths compliant ✅

---

### 🧪 Test Health

**Status:** ✅ Healthy
- Test Suites: 27/27 passing
- Tests: 97/97 passing

---

### 📏 Plan Length Status

**Status:** ✅ Compliant
- 7/8 plans under 200 lines
- 1/8 soft warning (187 lines)
- 0/8 blocking

---

### 📊 Summary

**Overall Health:** 🟡 Mostly Aligned (2 gaps)

**Critical Issues:** 0
**Warnings:** 2 (missing evidence, stale CAN task)
**Good Signals:** 5

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
- Confirm CAN-036 unblocked
- Re-run `/alignment-gaps` (should be 0/6 red flags)
```

### Example 3: Critical Drift (4+ Red Flags)

```markdown
🚨 **CRITICAL DRIFT DETECTED**

**Active Constraint:** Should be A, but system shows A + B both 🟡

---

### 🚩 **Red Flags:** 4/6

1. 🚩 **Multiple Constraints In Progress (Red Flag 1)**
   - Constraint A: 🟡 (12 days)
   - Constraint B: 🟡 (5 days)
   - **Violates:** Theory of Constraints (single bottleneck)

2. 🚩 **Future-Constraint Work (Red Flag 2)**
   - Constraint A: 5 plans
   - Constraint B: 3 plans ⚠️
   - Constraint C: 2 plans ⚠️
   - **Problem:** 5 plans on future constraints

3. 🚩 **Missing Runbooks (Red Flag 3)**
   - 3 files reference missing runbooks
   - No CAN tasks to create them
   - **Problem:** Code without implementation guides

4. 🚩 **Silent Work Log (Red Flag 6)**
   - Last entry: 14 days ago
   - **Problem:** No documented work in 2 weeks

---

⚠️ **IMMEDIATE ACTION REQUIRED**

The system has drifted significantly. Do not continue normal work.

**Stop and run:**
1. Emergency weekly review: `docs/runbooks/strategy/weekly-constraint-review.md`
2. Identify true bottleneck (Theory of Constraints)
3. Pause all work on non-active constraint
4. Create missing runbooks before more coding
5. Update work log with current status

**Escalate to Brent** if unclear how to proceed.

System integrity at risk - remediate within 24 hours.

---

### 🎯 Emergency Remediation

**Today (Critical):**

1. **Run weekly review** (1 hour):
   - Use runbook: weekly-constraint-review.md
   - Determine: Is Constraint A or B the bottleneck?
   - Decision: Mark one 🟡, other ⬜

2. **Archive future plans** (30 min):
   ```bash
   mv docs/plans/active/*constraint-b*.md docs/plans/archive/2025/11/
   mv docs/plans/active/*constraint-c*.md docs/plans/archive/2025/11/
   ```

3. **Create missing runbooks** (2 hours):
   - Identify 3 files referencing missing runbooks
   - Create CAN tasks for runbook creation
   - Or: Create basic runbooks now

4. **Update work log** (30 min):
   - Document last 2 weeks of work
   - Explain gap
   - Resume weekly updates

**This Week:**
- Re-run `/alignment-gaps` daily until 0/6 red flags
- Update strategy-alignment-matrix.md
- Restore single-constraint focus
- Resume weekly reviews (Monday)
```

---

## Special Cases

### Case 1: All Constraints Complete

```markdown
🎉 **All Constraints Complete!**

**Matrix Status:**
- Constraint A: ✅ Complete
- Constraint B: ✅ Complete
- Constraint C: ✅ Complete
- Constraint D: ✅ Complete

---

### ✅ Final Alignment Check

**Tier Balance:** 6/6 ✅
**Drift Patterns:** 0/6 red flags
**Test Health:** ✅ 97/97 passing
**Evidence:** ✅ All claims linked

---

🚀 **Ready for Production Launch!**

**Next steps:**
1. Review Stage 0 launch gate final checklist
2. Schedule stakeholder demo
3. Plan post-launch monitoring
4. Create production deployment runbook
5. Archive all active plans

**Congratulations!** All constraints cleared.
```

### Case 2: Between Weekly Reviews (Quick Check)

```markdown
🔍 **Quick Health Check**

**Active Constraint:** A (30% complete)

**Quick Scan:**
- ✅ Single constraint active
- ✅ Plans aligned (5/5)
- ✅ Tests passing (97/97)
- ⚠️ 1 stale CAN task (CAN-036, 10 days)

**Status:** 🟢 Healthy (1 minor warning)

**Next:** Full weekly review in 4 days

**Action:** Follow up on CAN-036 blocker
```

### Case 3: Right After Weekly Review

```markdown
✅ **System Recently Reviewed**

**Last Weekly Review:** Today (just completed)

**Review addressed:**
- Updated strategy-alignment-matrix.md
- Archived 3 future-constraint plans
- Collected missing evidence
- Unblocked CAN-036

**Current Status:** 🟢 All aligned

**Next alignment check:** Not needed until next Monday

**Recommendation:** Focus on execution, check again in 7 days
```

---

## Error Handling

### Error 1: Matrix File Missing

```markdown
❌ Cannot perform alignment gap analysis

**Error:** Matrix file not found

**Expected:** docs/plans/re-strategy/strategy-alignment-matrix.md

**Action:**

Restore from git:
```bash
git checkout docs/plans/re-strategy/strategy-alignment-matrix.md
```

Or verify structure:
```bash
ls docs/plans/re-strategy/
```
```

### Error 2: Test Suite Fails to Run

```markdown
❌ Cannot check test health

**Error:** npm test command failed

**Output:**
```
npm ERR! Test script missing
```

**Problem:** No test script in package.json

**Action:** Check package.json for test configuration
```

### Error 3: Cannot Determine Active Constraint

```markdown
⚠️ Cannot determine active constraint

**Problem:** No constraint marked 🟡 in matrix

**Possible reasons:**
1. All constraints complete (show ✅)
2. No constraint activated yet (all ⬜)
3. Matrix needs update

**Action:** Run `/constraint-status` to diagnose
```

---

## Best Practices

### When to Run This Skill

**✅ Good times:**
- Things feel misaligned (intuition)
- After completing major milestone
- Before claiming constraint complete
- Between weekly reviews (mid-week check)
- After team reports concerns

**❌ Bad times:**
- Just ran weekly review today
- Just ran /alignment-gaps <1 hour ago
- System known to be healthy
- During active debugging

### Drift Prevention vs Detection

**This skill detects drift after it happens.**

**To prevent drift:**
- Use constraint-aware-context before starting work
- Use evidence-collector when completing work
- Run weekly reviews on schedule
- Update work log regularly

**Detection catches:**
- Accumulated drift over time
- Multi-day misalignments
- Systemic issues

**Prevention stops:**
- Individual misaligned commits
- Single-task wrong constraint
- Missing evidence at source

### Integration Workflow

**Weekly cadence:**

```markdown
Monday (Weekly Review):
1. Run weekly-constraint-review.md runbook
2. tier-sync-validator → Verify balance
3. Address any red flags
4. Plan week priorities

Wednesday (Mid-week check):
1. tier-sync-validator → Quick drift check
2. Address minor warnings
3. Confirm on track

Friday (Week-end check):
1. tier-sync-validator → Final health
2. Collect evidence for week's work
3. Update work-log.md
```

**Emergency use:**

```markdown
When things feel off:
1. tier-sync-validator → Identify drift
2. If critical → Emergency weekly review
3. If minor → Note for next Monday review
4. Continue work if safe
```

---

## Performance

**Execution time:** ~20-30 seconds
- Tier balance checks: 5-8s
- Drift pattern detection: 5-8s
- Test suite run: 10-15s
- Plan validation: 2-3s

**Context usage:** ~1500-2000 tokens
- Matrix parsing
- Plan scanning
- Test output
- Runbook references

**Optimization:** Caches plan and runbook data for 1 hour

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** strategy-alignment-matrix, ROADMAP, stage0-launch-gate, active plans, work-log, CLAUDE.md, weekly-constraint-review
**Backs Up:** /alignment-gaps slash command
**Auto-Activation:** Keywords like "things feel off", "check for drift", "system health"
**Output:** Comprehensive drift analysis with tier balance scoring and remediation steps
