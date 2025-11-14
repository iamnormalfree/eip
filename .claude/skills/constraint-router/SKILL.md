---
name: constraint-router
description: Automatically provides constraint status overview when user asks about progress, blockers, or priorities. Reports active constraint, exit criteria progress, blocking CAN tasks, and active plans. Auto-activates on keywords like "what's blocking me", "constraint status", "current progress". Backs up /constraint-status slash command.
---

# Constraint Router

Provides comprehensive constraint status overview when user needs orientation or progress check. This skill backs up the `/constraint-status` slash command with auto-activation based on context.

## When to Use This Skill

**Auto-activates when user asks:**
- "What's blocking me?"
- "What should I focus on?"
- "What's the current constraint?"
- "Constraint status"
- "Where are we?"
- "What's the priority?"
- "What am I working on?"
- "Show me the status"
- "Progress report"
- "Current bottleneck"

**Explicit invocation:**
```
Use the constraint-router skill for status overview
```

**Slash command alternative:**
```
/constraint-status
```

**Do NOT activate for:**
- Specific task questions ("how do I implement X")
- Code-related questions
- Documentation searches
- Bug investigations (use systematic-debugging instead)

---

## Core Functionality

### Step 1: Identify Active Constraint

**Detection logic:**

```bash
# Read strategy-alignment-matrix.md
grep -A 1 "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md

# Extract:
# - Constraint letter (A/B/C/D or C1/C2 for sub-constraints)
# - Constraint name
# - Status emoji (🟡 = in progress)
```

**Expected pattern:**

```markdown
From strategy-alignment-matrix.md:

| Constraint | Name | Status | Days Active |
|------------|------|--------|-------------|
| A | Public Surface Readiness | 🟡 | 12 days |
| B | Data In, Data Approved | ⬜ | Not started |
| C | Credit Decisioning Excellence | ⬜ | Not started |
| D | Revenue Engine Live | ⬜ | Not started |
```

**Validation:**

```markdown
✅ Exactly ONE constraint with 🟡 → System balanced
⚠️ ZERO constraints with 🟡 → All complete or none started
🚨 MULTIPLE constraints with 🟡 → DRIFT (violates single bottleneck rule)
```

**Output:**

```markdown
🎯 **Active Constraint:** Constraint A – Public Surface Readiness
**Status:** 🟡 In Progress
**Days Active:** 12 days (started 2025-10-23)
```

---

### Step 2: Check Exit Criteria Progress

**For Constraint A (Stage 0 work):**

```bash
# Read Stage 0 launch gate
cat docs/plans/re-strategy/stage0-launch-gate.md

# Extract exit criteria checkpoints
# Count: ✅ complete vs ⬜ pending

# Example checkpoints:
# - ✅ Voice guide complete (CAN-036)
# - 🟡 Accessibility audit complete (CAN-037)
# - ⬜ Lighthouse 90+ score
# - ⬜ WCAG AA compliance
```

**For other constraints:**

```bash
# Read ROADMAP.md
cat docs/plans/ROADMAP.md

# Find active constraint section
# Extract exit criteria list
# Check for evidence links
```

**Progress calculation:**

```markdown
Count checkpoints:
Total: 10
Complete (✅): 3
In Progress (🟡): 2
Pending (⬜): 5

Progress: 3/10 = 30% complete
```

**Output:**

```markdown
📊 **Exit Criteria Progress**

[For Constraint A, reference Stage 0 gate:]
- ✅ Voice guide complete - Evidence: docs/brand/voice-guide-v2.md
- ✅ Copywriting guide - Evidence: docs/runbooks/brand/copywriting-guide.md
- ✅ Visual identity - Evidence: tailwind.config.ts (Bloomberg tokens merged)
- 🟡 Accessibility audit - In Progress (CAN-037)
- 🟡 Lighthouse performance - In Progress (baseline needed)
- ⬜ WCAG AA compliance - Not Started (Blocked by: CAN-037)
- ⬜ Mobile responsiveness - Not Started
- ⬜ Cross-browser testing - Not Started
- ⬜ SEO optimization - Not Started
- ⬜ Analytics tracking - Not Started

**Overall:** 3/10 complete (30%)
```

---

### Step 3: Identify Blocking CAN Tasks

**Search backlog for active constraint:**

```bash
# If master-task-list.csv exists:
grep "Constraint A" docs/plans/backlog/master-task-list.csv

# Filter by status:
# - "Planned" (scheduled but not started)
# - "In Progress" (actively working)

# Identify prerequisites:
# Tasks marked as "blocking" or "prerequisite"
```

**If no CSV, search active plans:**

```bash
# Search active plans for CAN tasks
grep -r "CAN-" docs/plans/active/*.md

# Extract:
# - CAN task number
# - Task description
# - Status (from plan)
# - Constraint reference
```

**Categorize by priority:**

```markdown
High Priority (Blocking Stage 0):
- Tasks that block exit criteria
- Tasks marked as prerequisites
- Tasks with dependencies

Medium Priority:
- Nice-to-have improvements
- Technical debt
- Future enhancements
```

**Output:**

```markdown
🚧 **Blocking Issues**

**High Priority (Blocking Stage 0):**
- CAN-036: Voice guide (✅ Complete, Brent, completed 2025-10-30)
- CAN-037: Accessibility checklist (🟡 In Progress, Claude, started 2025-11-01)
- CAN-051: Mobile chat UI (🟡 In Progress, Claude, started 2025-11-03)

**Medium Priority:**
- CAN-016: Purple token cleanup (⬜ Planned, unassigned)
- CAN-052: AI broker SLA measurement (⬜ Planned, unassigned)

**Total Blocking:** 2 tasks (CAN-037, CAN-051)
```

---

### Step 4: Count Active Plans

**Scan active plans directory:**

```bash
# Count all plans
ls docs/plans/active/*.md | wc -l

# For each plan:
# 1. Count lines (check against 200 line limit)
# 2. Extract constraint reference
# 3. Extract CAN task
# 4. Check alignment with active constraint
```

**Detect misalignment:**

```markdown
Plan: 2025-10-22-ai-broker-sla-measurement.md
Constraint: B – Data In, Data Approved

Active Constraint: A – Public Surface Readiness

⚠️ MISALIGNMENT: Plan references Constraint B, but Constraint A is active
```

**Plan size warnings:**

```markdown
Plan: 2025-11-03-unified-chat-hook-phase3-testing.md
Lines: 187

Status: ⚠️ Approaching limit (180 line soft limit, 200 hard limit)
Action: Consider extracting to runbook or splitting into phases
```

**Output:**

```markdown
📋 **Active Plans**

**Total:** 8 plans
**Alignment:** 5/8 reference Constraint A ✅
**Misaligned:** 3 plans reference future constraints ⚠️

**Critical Plans (Constraint A):**
1. 2025-11-03-unified-chat-hook-phase3-testing.md (187 lines, 66% complete)
2. 2025-10-31-brand-kit-refresh-plan.md (145 lines, 90% complete)
3. 2025-11-02-accessibility-audit-plan.md (123 lines, 40% complete)

**Deferred Plans (Future Constraints):**
- 2025-10-22-ai-broker-sla-measurement.md → Constraint B (defer)
- 2025-10-22-ai-broker-realtime-upgrade.md → Constraint B (defer)
- 2025-10-23-parser-crm-integration-plan.md → Constraint B (defer)

**Recommendation:** Archive future-constraint plans until Constraint A complete
```

---

### Step 5: Check Last Weekly Review

**Search work-log for weekly reviews:**

```bash
# Search work-log.md
grep -n "Weekly Constraint Review" docs/work-log.md

# Extract most recent:
# - Date of review
# - Days since review
# - Key decisions/findings
```

**Calculate staleness:**

```markdown
Today: 2025-11-04
Last Review: 2025-10-28
Days Since: 7 days

Status: ⚠️ Due today (weekly cadence)
```

**Output:**

```markdown
📅 **Weekly Review**

**Last Review:** 2025-10-28 (7 days ago)
**Status:** ⚠️ Due today (weekly cadence recommended)

**Last Review Findings:**
- Constraint A progress: 20% → 30% (+10%)
- Blocker removed: CAN-036 voice guide completed
- New blocker: CAN-037 accessibility audit started
- Plan proliferation detected: 11 plans → 8 plans (archived 3)

**Next Review:** Today (Monday recommended)
**Use:** docs/runbooks/strategy/weekly-constraint-review.md
```

---

## Integration with NextNest Frameworks

### Reads from Constraint System

```markdown
Primary sources:
✅ docs/plans/re-strategy/strategy-alignment-matrix.md (active constraint)
✅ docs/plans/re-strategy/stage0-launch-gate.md (Constraint A exit criteria)
✅ docs/plans/ROADMAP.md (all constraint exit criteria)
✅ docs/plans/active/*.md (active plans)
✅ docs/work-log.md (weekly review history)

Optional sources:
- docs/plans/backlog/master-task-list.csv (CAN tasks)
- docs/plans/re-strategy/ACTIVE_PLANS_PRIORITY_ANALYSIS.md (plan prioritization)
```

### Integrates with Slash Commands

```markdown
This skill backs up: /constraint-status

Sequential workflow:
1. constraint-router → Get orientation (auto or explicit)
2. /check-alignment [work] → Before starting task
3. [Do work]
4. evidence-collector → Document completion
5. /alignment-gaps → Weekly drift check
6. constraint-router → Check updated status
```

### Follows CLAUDE.md Constraint Rules

```markdown
Enforces:
✅ Single bottleneck rule (one constraint 🟡 at a time)
✅ Exit criteria validation (evidence required)
✅ Plan alignment (all plans reference active constraint)
✅ Weekly review cadence (7 day maximum)

Detects:
🚨 Multiple constraints in progress (drift)
⚠️ Misaligned plans (future-constraint work)
⚠️ Stale reviews (>7 days)
⚠️ Oversized plans (>180 lines)
```

### Syncs with Weekly Review Workflow

```markdown
Provides input for: docs/runbooks/strategy/weekly-constraint-review.md

Key metrics:
- Days in constraint
- Exit criteria progress (%)
- Blocking CAN tasks
- Plan count and alignment
- Days since last review

Enables: Data-driven weekly review process
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "what's blocking"
- "constraint status"
- "current constraint"
- "where are we"
- "what should I focus"
- "priority"
- "progress report"

**Moderate confidence triggers:**
- "status"
- "bottleneck"
- "what's next"
- "overview"
- "current work"

**Anti-triggers (DO NOT activate):**
- "how do I" (asking for implementation help)
- "what is constraint" (asking for concept explanation)
- Specific code questions
- Bug reports

---

## Output Examples

### Example 1: Healthy Constraint Progress

```markdown
🎯 **Constraint Status Report**

**Active Constraint:** Constraint A – Public Surface Readiness
**Status:** 🟡 In Progress
**Days Active:** 12 days (started 2025-10-23)

---

📊 **Exit Criteria Progress**

[Stage 0 Launch Gate:]
- ✅ Voice guide complete - Evidence: docs/brand/voice-guide-v2.md
- ✅ Copywriting guide - Evidence: docs/runbooks/brand/copywriting-guide.md
- ✅ Visual identity - Evidence: tailwind.config.ts
- 🟡 Accessibility audit - In Progress (CAN-037)
- 🟡 Lighthouse performance - In Progress (baseline: 78, target: 90+)
- ⬜ WCAG AA compliance - Not Started (Blocked by: CAN-037)
- ⬜ Mobile responsiveness - Not Started
- ⬜ Cross-browser testing - Not Started
- ⬜ SEO optimization - Not Started
- ⬜ Analytics tracking - Not Started

**Overall:** 3/10 complete (30%)

---

🚧 **Blocking Issues**

**High Priority (Blocking Stage 0):**
- CAN-037: Accessibility checklist (🟡 In Progress, Claude, started 2025-11-01)
- CAN-051: Mobile chat UI (🟡 In Progress, Claude, started 2025-11-03)

**Medium Priority:**
- CAN-016: Purple token cleanup (⬜ Planned, unassigned)

**Total Blocking:** 2 tasks

---

📋 **Active Plans**

**Total:** 5 plans
**Alignment:** 5/5 reference Constraint A ✅

**Key Plans:**
1. 2025-11-03-unified-chat-hook-phase3-testing.md (187 lines, 66% complete)
2. 2025-10-31-brand-kit-refresh-plan.md (145 lines, 90% complete)
3. 2025-11-02-accessibility-audit-plan.md (123 lines, 40% complete)

---

📅 **Weekly Review**

**Last Review:** 2025-11-01 (3 days ago)
**Status:** ✅ On track (next review: Monday 2025-11-04)

**Last Review Findings:**
- Progress: 20% → 30% (+10%)
- CAN-036 completed (voice guide)
- CAN-037 started (accessibility)
- 3 future-constraint plans archived

---

🎯 **This Week Priority**

Based on blocking CAN tasks and exit criteria:

1. **Complete CAN-037** (accessibility checklist) - Unblocks WCAG compliance
2. **Complete CAN-051** (mobile chat UI) - Unblocks mobile responsiveness
3. **Run Lighthouse audit** - Establish performance baseline

**Estimated effort:** 12 hours
**Owner assignments needed:** 1 task (CAN-016)

---

💡 **Quick Actions**

Run these commands:
- `/check-alignment [work]` - Before starting any task
- `/alignment-gaps` - Check for drift if things feel off
- Review: `docs/runbooks/strategy/weekly-constraint-review.md` on Monday
```

### Example 2: Drift Detected (Multiple Constraints Active)

```markdown
🚨 **DRIFT DETECTED: Multiple Constraints In Progress**

**Active Constraints:**
- Constraint A: 🟡 Public Surface Readiness (12 days)
- Constraint B: 🟡 Data In, Data Approved (5 days)
- Constraint C: 🟡 Credit Decisioning Excellence (2 days)

---

⚠️ **Violates Theory of Constraints (Single Bottleneck Rule)**

**Problem:**
- Work spread across 3 constraints simultaneously
- Reduces focus and velocity
- Increases context switching cost
- Makes progress measurement unclear

**Impact:**
- Constraint A: 30% complete (slowed from 10%/week to 5%/week)
- Constraint B: 10% complete (started prematurely)
- Constraint C: 5% complete (started prematurely)

---

📋 **Active Plans by Constraint**

**Constraint A:** 5 plans
**Constraint B:** 3 plans ⚠️
**Constraint C:** 3 plans ⚠️

**Total:** 11 plans (recommended max: 3-5)

---

🎯 **Action Required**

**Immediate:**
1. Run weekly constraint review NOW
2. Determine true bottleneck (likely Constraint A)
3. Pause work on Constraints B and C
4. Archive future-constraint plans (6 plans)

**This Week:**
1. Complete Constraint A to 50%
2. Review exit criteria for Constraint A
3. Update strategy-alignment-matrix.md (mark B/C as ⬜)

**Use Runbook:**
docs/runbooks/strategy/weekly-constraint-review.md

---

💡 **Drift Remediation Steps**

```bash
# 1. Archive future-constraint plans
mv docs/plans/active/*constraint-b*.md docs/plans/archive/2025/11/
mv docs/plans/active/*constraint-c*.md docs/plans/archive/2025/11/

# 2. Update matrix
# Edit: docs/plans/re-strategy/strategy-alignment-matrix.md
# Change: Constraint B 🟡 → ⬜
# Change: Constraint C 🟡 → ⬜

# 3. Focus on Constraint A only
/check-alignment [Constraint A work]
```
```

### Example 3: Constraint Complete, Ready for Next

```markdown
🎉 **Constraint A Complete!**

**Constraint A:** Public Surface Readiness
**Status:** ✅ Complete (completed 2025-11-04)
**Duration:** 12 days
**Final Progress:** 10/10 exit criteria (100%)

---

📊 **Exit Criteria - All Complete**

- ✅ Voice guide - docs/brand/voice-guide-v2.md
- ✅ Copywriting guide - docs/runbooks/brand/copywriting-guide.md
- ✅ Visual identity - tailwind.config.ts
- ✅ Accessibility audit - validation-reports/accessibility/wcag-aa-compliance.md
- ✅ Lighthouse 90+ - validation-reports/lighthouse/homepage-score-93.pdf
- ✅ WCAG AA compliance - All critical pages verified
- ✅ Mobile responsiveness - Tested on 5 devices
- ✅ Cross-browser testing - Chrome, Firefox, Safari, Edge
- ✅ SEO optimization - Sitemap, meta tags, structured data
- ✅ Analytics tracking - Google Analytics + custom events

**Evidence:** All linked in stage0-launch-gate.md

---

🚀 **Next Constraint**

**Ready to Start:** Constraint B – Data In, Data Approved

**Exit Criteria Preview:**
1. External parser integration (CAN-043)
2. CRM data flow (CAN-045)
3. Data validation rules (CAN-046)
4. PDPA compliance (CAN-047)
5. Data quality metrics (CAN-048)

**Estimated Duration:** 15-20 days
**Blocking Tasks:** None (Constraint A unblocked all prerequisites)

---

📋 **Cleanup Actions**

**Before starting Constraint B:**

1. **Archive Constraint A plans:**
   ```bash
   mv docs/plans/active/2025-11-*-brand*.md docs/plans/archive/2025/11/
   mv docs/plans/active/2025-11-*-accessibility*.md docs/plans/archive/2025/11/
   ```

2. **Update strategy-alignment-matrix.md:**
   - Constraint A: 🟡 → ✅
   - Constraint B: ⬜ → 🟡

3. **Update ROADMAP.md:**
   - Mark Constraint A complete
   - Link evidence
   - Update timeline

4. **Log completion in work-log.md:**
   - Constraint A completion report
   - Duration: 12 days
   - Key achievements
   - Lessons learned

---

💡 **Start Constraint B**

Run:
```bash
/constraint-status  # Verify Constraint B now active
/check-alignment "start parser integration CAN-043"
```

**Next Priority:** CAN-043 (external parser integration)
```

### Example 4: Concise Status (Quick Mode)

```markdown
🎯 **Constraint A:** 🟡 In Progress (3/10 exit criteria, 30%)

🚧 **Blockers:** CAN-037 (accessibility), CAN-051 (mobile chat)
📋 **Plans:** 5 active, all aligned ✅
📅 **Last review:** 3 days ago ✅

**Priority:** Complete CAN-037/051 this week (12h estimated)
```

---

## Special Cases

### Case 1: No Active Constraint

```markdown
⚠️ **No Active Constraint Detected**

**Matrix Status:**
- Constraint A: ⬜ Not Started
- Constraint B: ⬜ Not Started
- Constraint C: ⬜ Not Started
- Constraint D: ⬜ Not Started

**Problem:** No bottleneck identified

**Possible Reasons:**
1. Just starting project (need to activate Constraint A)
2. All constraints complete (ready for launch)
3. Matrix needs update (manual correction)

---

**Action Required:**

If starting project:
```bash
# Edit strategy-alignment-matrix.md
# Change: Constraint A ⬜ → 🟡
# Start work on Constraint A exit criteria
```

If project complete:
```bash
# Verify all constraints show ✅
# Check Stage 0 launch gate
# Prepare for production launch
```

If matrix incorrect:
```bash
# Review recent work-log.md entries
# Determine which constraint is actually active
# Update matrix to match reality
```
```

### Case 2: Plan Proliferation Warning

```markdown
⚠️ **PLAN PROLIFERATION DETECTED**

**Active Plans:** 11
**Recommended Max:** 3-5
**Over limit by:** 6 plans

---

📋 **Plan Breakdown**

**Constraint A:** 5 plans ✅
**Constraint B:** 3 plans ⚠️ (future work)
**Constraint C:** 2 plans ⚠️ (future work)
**No constraint:** 1 plan ⚠️ (orphaned)

---

**Problem:**
- Too many plans increases cognitive load
- Splits focus across multiple features
- Makes prioritization unclear
- Violates constraint focus

**Impact:**
- Velocity reduced (context switching)
- Plans go stale (>200 line limit risk)
- Work fragmentation

---

🎯 **Remediation Actions**

**Archive future-constraint plans:**
```bash
# Move 6 plans to archive
mv docs/plans/active/*constraint-b*.md docs/plans/archive/2025/11/
mv docs/plans/active/*constraint-c*.md docs/plans/archive/2025/11/
```

**Consolidate Constraint A plans:**
- Review 5 plans
- Merge if overlapping
- Complete and archive finished plans

**Target:** Reduce to 3-5 active plans

**See:** docs/runbooks/strategy/plan-hygiene-guide.md
```

### Case 3: Stale Weekly Review

```markdown
⚠️ **STALE WEEKLY REVIEW**

**Last Review:** 2025-10-21 (14 days ago)
**Recommended:** 7 days maximum
**Overdue by:** 7 days

---

**Risk:**
- Drift undetected for 2 weeks
- Constraint progress unknown
- Blocker buildup
- Plan alignment unchecked

**Impact:**
- May be working on wrong priorities
- Exit criteria may have shifted
- Plans may reference old constraints
- CAN tasks may be obsolete

---

🎯 **Action Required**

**Run weekly review NOW:**

1. Use runbook: docs/runbooks/strategy/weekly-constraint-review.md

2. Check for drift:
   - Multiple constraints active?
   - Plans aligned with active constraint?
   - Exit criteria progress tracked?
   - CAN tasks still relevant?

3. Update work-log.md:
   - Log review date
   - Document findings
   - Note corrective actions

4. Resume weekly cadence (every Monday)

---

**After review, run:**
```bash
/constraint-status  # Verify updates reflected
/alignment-gaps  # Check for remaining drift
```
```

---

## Error Handling

### Error 1: Matrix File Not Found

```markdown
❌ **Cannot determine constraint status**

**Error:** Matrix file not found

**Expected:** docs/plans/re-strategy/strategy-alignment-matrix.md

**Possible causes:**
- File moved or renamed
- Wrong repository directory
- Git checkout issue

**Action:**

Restore from git:
```bash
git status docs/plans/re-strategy/
git checkout docs/plans/re-strategy/strategy-alignment-matrix.md
```

Or check path:
```bash
find . -name "strategy-alignment-matrix.md"
```
```

### Error 2: Cannot Parse Matrix

```markdown
❌ **Cannot parse constraint status**

**Error:** No emoji indicators found in matrix

**Problem:** Matrix may be corrupted or format changed

**Expected format:**
```markdown
| Constraint | Status |
|------------|--------|
| A | 🟡 |
| B | ⬜ |
```

**Found:** [show actual content]

**Action:** Manually review and fix matrix file
```

### Error 3: Conflicting Data

```markdown
⚠️ **CONFLICTING DATA DETECTED**

**Matrix says:** Constraint A (🟡 In Progress)
**Active plans reference:** Constraint B (3 plans), Constraint C (2 plans)

**Problem:** Plans don't match active constraint

**Possible reasons:**
1. Matrix needs update (Constraint B actually active)
2. Plans need archiving (future-constraint work)
3. Drift occurred (weekly review missed)

**Action:**

Run drift analysis:
```bash
/alignment-gaps
```

Then:
- If matrix correct → Archive misaligned plans
- If plans correct → Update matrix
- If drift → Run weekly review
```

---

## Best Practices

### When to Run This Skill

**✅ Good times:**
- Start of workday (orientation)
- After completing major task (check progress)
- Before starting new work (prioritization)
- Feeling lost or unclear on priorities
- Monday morning (weekly review trigger)

**❌ Bad times:**
- Middle of implementation (breaks flow)
- When you know exactly what to do next
- Just ran it <1 hour ago
- During debugging session

### Integration Workflow

**Daily:**
```markdown
Morning:
1. constraint-router → Get orientation
2. plan-to-chunks → Extract today's work
3. /check-alignment [work] → Validate alignment
4. [Implement]

Evening:
5. evidence-collector → Document completion
6. constraint-router → Check updated status
```

**Weekly (Monday):**
```markdown
1. constraint-router → Status overview
2. Weekly review runbook → Structured analysis
3. Update work-log.md → Document review
4. /alignment-gaps → Drift check
5. constraint-router → Verify corrections
```

---

## Performance

**Execution time:** ~10-15 seconds
- Matrix parsing: 2-3s
- Plan scanning: 3-5s
- CAN task search: 2-3s
- Report generation: 2-3s

**Context usage:** ~1000-1500 tokens
- Matrix content
- Plan summaries
- CAN task list
- Work-log excerpt

**Optimization:** Caches matrix and plan data for 1 hour to avoid repeated reads

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** strategy-alignment-matrix, ROADMAP, stage0-launch-gate, active plans, work-log, /check-alignment, /alignment-gaps
**Backs Up:** /constraint-status slash command
**Auto-Activation:** Keywords like "what's blocking", "constraint status", "current progress"
**Output:** Comprehensive constraint status report matching /constraint-status format
