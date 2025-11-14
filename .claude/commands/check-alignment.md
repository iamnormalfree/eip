# Check Alignment

**Purpose:** Quick pre-implementation CHECK phase before starting any code change.

**Usage:** `/check-alignment [brief description of work]`

**Example:** `/check-alignment add accessibility checklist`

---

## Instructions for Claude

When user runs this command, perform these checks in order:

### Step 1: Identify Active Constraint

```bash
# Read and extract active constraint
grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md
```

**Output:**
```
Active constraint: Constraint [A/B/C/D] - [Name]
```

---

### Step 2: Search for CAN Task

```bash
# Search backlog for relevant CAN task
grep -i "[keywords from user work]" docs/plans/re-strategy/backlog/master-task-list.csv
```

**If found:**
```
CAN task: CAN-[###] - [Description]
Status: [Planned/In Progress/Completed]
Owner: [Name]
```

**If not found:**
```
⚠️  No CAN task found for this work

Options:
1. This is minor work (typo, comment) - proceed with caution
2. Should create CAN task - discuss with Brent
3. May be exploratory - log intent in work-log.md
```

---

### Step 3: Check Runbook Exists

```bash
# Search for relevant runbook
find docs/runbooks -name "*.md" -type f | xargs grep -l "[keywords]" 2>/dev/null | head -5
```

**If found:**
```
Runbook: [path to runbook]
```

**If not found:**
```
⚠️  No runbook found

Check if CAN task exists to create runbook:
[search master-task-list.csv for runbook creation task]

If no CAN task: Implementation guide missing - create runbook first
```

---

### Step 4: Check Tier 1 Rules (if code modification)

```bash
# If work involves files in lib/, components/, app/
grep -i "[filename or path]" CANONICAL_REFERENCES.md
```

**If found:**
```
Tier 1 rules for [filename]:
[extract change rules]
```

**If not found:**
```
✅ Not a Tier 1 file - proceed normally
```

---

### Step 5: Check for Conflicts

```bash
# Check recent work log
tail -100 docs/work-log.md | grep -i "[keywords]"

# Check active plans
grep -l "[keywords]" docs/plans/active/*.md
```

**If found:**
```
⚠️  Related work found:
- Work log entry: [date] - [title]
- Active plan: [plan file]

Review before proceeding to avoid duplicating effort.
```

**If not found:**
```
✅ No conflicts detected
```

---

### Step 6: Alignment Decision

**Present summary:**

```markdown
## Alignment Check - [Work Description]

### Results
- ✅/❌ Active constraint: Constraint [X]
- ✅/⚠️/❌ CAN task: CAN-[###] or [explain]
- ✅/⚠️/❌ Runbook: [path] or [missing]
- ✅/⚠️/N/A Tier 1 rules: [rules or N/A]
- ✅/⚠️ Conflicts: [none or describe]

### Decision

[Choose one:]

✅ **PROCEED**
All checks passed. You can start implementation.

Next steps:
1. Follow TDD: Write failing test first
2. Reference runbook: [path]
3. Create tier references in code comments
4. Mark TodoWrite item as in_progress
5. Update work-log.md when milestone reached

---

⚠️ **PROCEED WITH CAUTION**
Some checks have warnings. Review warnings above.

Consider:
- Is this truly needed for active constraint?
- Should runbook be created first?
- Is CAN task needed?

You can proceed if work is minor or exploratory, but log intent.

---

❌ **BLOCKED**
Critical issues detected. Do not proceed until resolved:

[List blocking issues]

Actions required:
1. [Fix issue 1]
2. [Fix issue 2]

Discuss with Brent if unclear how to resolve.
```

---

## Output Format

Keep output **concise** (under 30 lines). Use emojis for quick scanning.

**Example output:**

```
🔍 Alignment Check - Add accessibility checklist

✅ Active constraint: Constraint A - Public Surface Readiness
✅ CAN task: CAN-037 - Create accessibility checklist runbook
⚠️  Runbook: Not found (CAN-037 creates it - this IS the work)
✅ Tier 1 rules: N/A (creating runbook, not code)
✅ Conflicts: None

✅ PROCEED

This work creates the missing runbook per CAN-037.

Next steps:
1. Create docs/runbooks/design/accessibility-checklist.md
2. Reference WCAG 2.1 Level AA guidelines
3. Include patterns for forms, navigation, content
4. Update work-log.md when complete
5. Update strategy-alignment-inventory.md (mark CAN-037 complete)
```

---

## Fast Mode

If checks are simple (all ✅, no warnings), use **ultra-concise** format:

```
✅ PROCEED - Constraint A, CAN-037, Tier 1: N/A

Follow: docs/runbooks/design/accessibility-checklist.md (create per CAN-037)
```

---

## Error Handling

If files are missing or can't be read:

```
❌ ERROR: Cannot perform alignment check

Missing files:
- docs/plans/re-strategy/strategy-alignment-matrix.md
- docs/plans/re-strategy/backlog/master-task-list.csv

Run Phase 7 handoff first or check repository structure.
```

---

*Command created: 2025-10-31*
