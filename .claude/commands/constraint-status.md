# Constraint Status

**Purpose:** Quick overview of current constraint progress, blockers, and next priorities.

**Usage:** `/constraint-status`

---

## Instructions for Claude

Provide a comprehensive but concise status report:

### Step 1: Identify Active Constraint

```bash
# Read matrix
grep -A 1 "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md
```

**Extract:**
- Constraint letter (A/B/C/D)
- Constraint name
- Status emoji

---

### Step 2: Check Exit Criteria Progress

```bash
# Read roadmap for active constraint section
# Extract exit criteria list
```

**For each exit criterion:**
- Is it mentioned in Stage 0 gate (if Constraint A)?
- Is there evidence linked?
- What's the status?

---

### Step 3: Identify Blocking CAN Tasks

```bash
# From master-task-list.csv, filter for active constraint
# Show tasks with status "Planned" or "In Progress"
# Highlight tasks marked as prerequisite/blocking
```

---

### Step 4: Count Active Plans

```bash
# Count plans in docs/plans/active/
# Check each plan's Constraint Alignment section
# Flag any that reference wrong constraint
```

---

### Step 5: Check Last Weekly Review

```bash
# Search work-log.md for "Weekly Constraint Review"
# Extract date of last review
# Calculate days since last review
```

---

## Output Format

```markdown
🎯 **Constraint Status Report**

**Active Constraint:** Constraint [X] - [Name]
**Status:** 🟡 In Progress
**Days in Progress:** [X days]

---

📊 **Exit Criteria Progress**

[For Constraint A, reference Stage 0 gate:]
- ✅ [Criterion 1] - Complete (Evidence: [link])
- 🟡 [Criterion 2] - In Progress
- ❌ [Criterion 3] - Not Started (Blocked by: CAN-###)
- ⬜ [Criterion 4] - Not Started

**Overall:** [X]/[Y] complete ([%])

[For other constraints, reference roadmap exit criteria]

---

🚧 **Blocking Issues**

**High Priority (Blocking Stage 0):**
- CAN-036: Voice guide (In Progress, Brent, started 2025-10-24)
- CAN-037: Accessibility checklist (Planned, unassigned)

**Medium Priority:**
- CAN-016: Purple token cleanup (Planned, unassigned)

**No Blockers:** [if none exist]

---

📋 **Active Plans**

**Total:** [X] plans
**Alignment:** [X]/[X] reference Constraint [X] ✅ or ⚠️ [Y] reference wrong constraint

**Key Plans:**
1. [Plan name] ([line count] lines, [status])
2. [Plan name] ([line count] lines, [status])
3. [Plan name] ([line count] lines, [status])

[Show top 3 most active/recent plans]

---

📅 **Weekly Review**

**Last Review:** [Date] ([X] days ago)
**Status:** ✅ On track or ⚠️ Overdue (>7 days)

**Next Review:** Monday (recommended)

---

🎯 **This Week Priority**

Based on blocking CAN tasks and exit criteria:

1. **Complete CAN-036** (voice guide) - Unblocks homepage copy
2. **Complete CAN-037** (accessibility checklist) - Unblocks WCAG compliance
3. **Run Lighthouse audit** - Measure current performance baseline

**Estimated effort:** [X] hours
**Owner assignments needed:** [Y] tasks unassigned

---

💡 **Quick Actions**

Run these commands:
- `/check-alignment [work]` - Before starting any task
- `/alignment-gaps` - Check for drift if things feel off
- Review: `docs/runbooks/strategy/weekly-constraint-review.md` on Monday
```

---

## Concise Mode (Optional)

If user wants ultra-brief status:

```
🎯 Constraint A: 🟡 In Progress (3/10 exit criteria complete)

🚧 Blockers: CAN-036 (voice guide), CAN-037 (accessibility)
📋 Plans: 11 active, all aligned ✅
📅 Last review: 7 days ago ⚠️

Priority: Complete CAN-036/037 this week
```

---

## Error Handling

If cannot determine status:

```
❌ Cannot determine constraint status

Possible issues:
- No constraint marked 🟡 in matrix (none active?)
- Multiple constraints marked 🟡 (drift - should be single bottleneck)
- Matrix file not found

Check: docs/plans/re-strategy/strategy-alignment-matrix.md
```

---

## Special Cases

### All Constraints Complete (✅)

```
🎉 All Constraints Complete!

Constraint A: ✅ Complete
Constraint B: ✅ Complete
Constraint C: ✅ Complete
Constraint D: ✅ Complete

🚀 Ready for production launch!

Next steps:
1. Review Stage 0 launch gate final checklist
2. Schedule stakeholder demo
3. Plan post-launch monitoring
```

---

### Multiple Constraints In Progress (⚠️ Drift)

```
🚨 DRIFT DETECTED: Multiple Constraints In Progress

Constraint A: 🟡
Constraint B: 🟡
Constraint C: 🟡

⚠️  Violates Theory of Constraints (single bottleneck rule)

Action required:
1. Run weekly constraint review immediately
2. Determine true bottleneck
3. Pause work on non-active constraints
4. Focus all effort on single constraint

See: docs/runbooks/strategy/weekly-constraint-review.md
```

---

*Command created: 2025-10-31*
