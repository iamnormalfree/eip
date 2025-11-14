---
name: constraint-aware-context
description: Automatically runs alignment checks when user starts describing work without explicit validation. Validates active constraint, CAN task existence, runbook availability, Tier 1 rules, and conflict detection. Auto-activates when user mentions starting work. Backs up /check-alignment slash command.
---

# Constraint-Aware Context

Automatically catches missing pre-work validation when user starts describing implementation without running alignment checks. This skill backs up the `/check-alignment` slash command with auto-activation based on work-starting keywords.

## When to Use This Skill

**Auto-activates when user says:**
- "Let's implement [feature]"
- "I want to add [feature]"
- "Can you help me build [feature]"
- "Start working on [feature]"
- "I need to fix [bug]"
- "Let's create [component]"
- "Add [functionality]"
- "Build [feature]"

**Context triggers (moderate confidence):**
- User describes work without mentioning /check-alignment
- User mentions file paths to modify
- User starts giving technical requirements
- User asks to generate code without pre-checks

**Explicit invocation:**
```
Use the constraint-aware-context skill to check alignment for [work]
```

**Slash command alternative:**
```
/check-alignment [work description]
```

**Do NOT activate for:**
- User explicitly ran /check-alignment already
- User asking questions (not starting work)
- User exploring/investigating (not implementing)
- Conversations about how to do things

---

## Core Functionality

### Step 1: Identify Active Constraint

**Detection logic:**

```bash
# Read strategy-alignment-matrix.md
grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md

# Extract:
# - Constraint letter (A/B/C/D)
# - Constraint name
```

**Output:**

```markdown
Active constraint: Constraint A – Public Surface Readiness
```

**If no constraint active:**
```markdown
⚠️ No active constraint found

Check: docs/plans/re-strategy/strategy-alignment-matrix.md
```

---

### Step 2: Search for CAN Task

**Search logic:**

```bash
# Extract keywords from user's work description
# Example: "add accessibility checklist"
# Keywords: accessibility, checklist

# Search backlog
grep -i "accessibility\|checklist" docs/plans/re-strategy/backlog/master-task-list.csv

# If no CSV, search active plans
grep -r "CAN-" docs/plans/active/*.md | grep -i "accessibility\|checklist"
```

**If CAN task found:**

```markdown
✅ CAN task: CAN-037 - Create accessibility checklist runbook
Status: Planned
Owner: Unassigned
Constraint: A
```

**If no CAN task found:**

```markdown
⚠️ No CAN task found for this work

Options:
1. Minor work (typo, comment) → Proceed with caution, no CAN task needed
2. Substantial work → Should create CAN task first
3. Exploratory → Log intent in work-log.md

Decision:
- If <20 lines of new code → Minor (proceed)
- If >20 lines → Create CAN task first
```

---

### Step 3: Check Runbook Exists

**Search logic:**

```bash
# Search runbooks for keywords
find docs/runbooks -name "*.md" -type f | xargs grep -l "accessibility\|checklist" 2>/dev/null | head -5

# Example results:
docs/runbooks/design/accessibility-audit-guide.md
docs/runbooks/design/wcag-compliance-patterns.md
```

**If runbook found:**

```markdown
✅ Runbook: docs/runbooks/design/accessibility-checklist.md

Reference this runbook during implementation.
```

**If no runbook:**

```markdown
⚠️ No runbook found

Check if CAN task exists to create runbook:
[search for "runbook" in CAN task description]

If CAN-037 creates runbook:
→ This IS the work (creating the missing runbook)

If no CAN task for runbook:
→ Implementation guide missing - create runbook first per CLAUDE.md
```

---

### Step 4: Check Tier 1 Rules (Code Modifications Only)

**Detection:**

```bash
# If work involves files in:
# - lib/calculations/*
# - lib/contracts/*
# - components/forms/*
# - etc.

# Check CANONICAL_REFERENCES.md
grep -i "[filename or path]" CANONICAL_REFERENCES.md
```

**If Tier 1 file:**

```markdown
⚠️ Tier 1 file: lib/calculations/instant-profile.ts

Rules from CANONICAL_REFERENCES.md:
- ✅ Write tests first (instant-profile.test.ts + dr-elena-v2-regulation.test.ts)
- ✅ Rounding: loans DOWN, payments UP, funds UP
- ✅ Use constants from dr-elena-constants.ts
- ❌ Do NOT change interfaces without updating form-contracts.ts

Required tests:
- tests/calculations/instant-profile.test.ts
- tests/dr-elena-v2-regulation.test.ts
- tests/fixtures/dr-elena-v2-scenarios.ts
```

**If not Tier 1:**

```markdown
✅ Not a Tier 1 file - proceed normally

Standard TDD workflow applies:
1. Write failing test
2. Implement feature
3. Verify test passes
```

---

### Step 5: Check for Conflicts

**Search recent work:**

```bash
# Check work-log.md for recent related work
tail -100 docs/work-log.md | grep -i "accessibility\|checklist"

# Check active plans
grep -l "accessibility\|checklist" docs/plans/active/*.md
```

**If related work found:**

```markdown
⚠️ Related work found:

Work log:
- 2025-11-01 - Accessibility audit started (CAN-037)

Active plans:
- 2025-11-02-accessibility-audit-plan.md

Review before proceeding to:
- Avoid duplicating effort
- Understand context
- Coordinate with existing work
```

**If no conflicts:**

```markdown
✅ No conflicts detected

No recent related work in:
- work-log.md (last 100 lines)
- Active plans (8 files searched)
```

---

### Step 6: Alignment Decision

**Decision logic:**

```markdown
PROCEED (✅):
- Active constraint identified
- CAN task exists OR work is minor
- Runbook exists OR CAN task creates it
- Tier 1 rules checked (if applicable)
- No conflicts (or conflicts understood)

PROCEED WITH CAUTION (⚠️):
- Missing CAN task (but work is exploratory)
- Missing runbook (but work creates it)
- Tier 1 file (requires extra care)
- Related work exists (review first)

BLOCKED (❌):
- No active constraint
- Substantial work without CAN task
- Missing runbook (not being created by this work)
- Tier 1 file without test plan
- Conflicts with wrong constraint
```

**Output format:**

```markdown
## Alignment Check - [Work Description]

### Results
- ✅/❌ Active constraint: Constraint [X]
- ✅/⚠️/❌ CAN task: CAN-[###] or [explain]
- ✅/⚠️/❌ Runbook: [path] or [status]
- ✅/⚠️/N/A Tier 1 rules: [rules or N/A]
- ✅/⚠️ Conflicts: [none or describe]

### Decision

[✅ PROCEED / ⚠️ PROCEED WITH CAUTION / ❌ BLOCKED]

[Detailed explanation and next steps]
```

---

## Integration with NextNest Frameworks

### Works with Constraint System

```markdown
Validates:
✅ Active constraint alignment (only one 🟡)
✅ CAN task traceability (backlog or active plans)
✅ Constraint-task linkage (work serves active constraint)

Prevents:
❌ Working on wrong constraint (future-constraint work)
❌ Starting work without CAN task (traceability gap)
❌ Skipping runbook creation (tier skipping)
```

### Follows CLAUDE.md Standards

```markdown
Enforces:
✅ TDD mandate (write tests first for code changes)
✅ CANONICAL_REFERENCES checks (Tier 1 file rules)
✅ 3-tier documentation (Code → Runbooks → Plans)
✅ Constraint alignment (work serves active constraint)

Prevents:
❌ Direct implementation without tests
❌ Tier 1 changes without following rules
❌ Missing runbooks (tier 2 documentation)
❌ Untracked work (no CAN task)
```

### Syncs with CANONICAL_REFERENCES

```markdown
Checks if files are Tier 1:
- lib/calculations/instant-profile.ts
- lib/contracts/form-contracts.ts
- components/forms/ProgressiveFormWithController.tsx
- etc.

If Tier 1:
→ Extract specific rules
→ List required tests
→ Note forbidden changes
→ Provide change process
```

### Integrates with Slash Commands

```markdown
This skill backs up: /check-alignment

Sequential workflow:
1. constraint-aware-context → Auto-catches missing validation
2. [Or explicit] /check-alignment [work] → Manual validation
3. [Implement + test]
4. can-task-linker → Generate commit message
5. evidence-collector → Document completion
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "let's implement"
- "I want to add"
- "can you help me build"
- "start working on"
- "create [component]"
- "add [feature]"

**Moderate confidence triggers:**
- "I need to fix"
- "update [file]"
- "modify [component]"
- "change [functionality]"

**Context triggers:**
- User mentions file paths
- User gives technical requirements
- User starts describing implementation

**Anti-triggers (DO NOT activate):**
- User asks "how do I" (not starting work)
- User asks "what is" (exploring concepts)
- User already ran /check-alignment
- User investigating bug (use systematic-debugging)

---

## Output Examples

### Example 1: All Checks Pass (Fast Mode)

```markdown
🔍 Alignment Check - Add accessibility labels to form inputs

✅ Active constraint: Constraint A – Public Surface Readiness
✅ CAN task: CAN-037 - Create accessibility checklist
✅ Runbook: docs/runbooks/design/accessibility-checklist.md
✅ Tier 1 rules: N/A (regular component update)
✅ Conflicts: None

✅ **PROCEED**

Next steps:
1. Follow TDD: Write failing test first
2. Reference runbook: docs/runbooks/design/accessibility-checklist.md
3. Add aria-label attributes per WCAG 2.1 Level AA
4. Update work-log.md when complete
```

### Example 2: Missing Runbook (Being Created)

```markdown
🔍 Alignment Check - Create accessibility checklist runbook

✅ Active constraint: Constraint A – Public Surface Readiness
✅ CAN task: CAN-037 - Create accessibility checklist runbook
⚠️ Runbook: Not found (this work CREATES it per CAN-037)
✅ Tier 1 rules: N/A (creating runbook, not code)
✅ Conflicts: None

✅ **PROCEED**

This work creates the missing runbook per CAN-037.

Next steps:
1. Create docs/runbooks/design/accessibility-checklist.md
2. Reference WCAG 2.1 Level AA guidelines
3. Include patterns for: forms, navigation, content, images
4. Update work-log.md when complete
5. Mark CAN-037 complete in strategy-alignment-matrix.md
```

### Example 3: Tier 1 File (Extra Validation)

```markdown
🔍 Alignment Check - Update TDSR calculation rounding

✅ Active constraint: Constraint A – Public Surface Readiness
✅ CAN task: CAN-037 - Fix form calculation rounding
✅ Runbook: docs/runbooks/forms/calculation-integration.md
⚠️ **Tier 1 file:** lib/calculations/instant-profile.ts

**Tier 1 Rules (from CANONICAL_REFERENCES.md):**

✅ Required tests:
- tests/calculations/instant-profile.test.ts
- tests/dr-elena-v2-regulation.test.ts
- tests/fixtures/dr-elena-v2-scenarios.ts

✅ Rounding rules:
- Loan amounts: Math.floor() (DOWN)
- Payment amounts: Math.ceil() (UP)
- Fund amounts: Math.ceil() (UP)

❌ Forbidden:
- Do NOT change interfaces without updating form-contracts.ts
- Do NOT modify constants without updating dr-elena-constants.ts
- Do NOT change stress test rates without MAS Notice 632 verification

✅ Conflicts: None

⚠️ **PROCEED WITH CAUTION**

**Extra validation required:**
1. Run dr-elena-compliance-checker after implementation
2. Update all 3 required test files
3. Verify rounding follows client-protective rules
4. Check if form-contracts.ts needs update

**TDD workflow:**
1. Write failing test in instant-profile.test.ts
2. Implement rounding change
3. Run all 3 test suites
4. Run dr-elena-compliance-checker
5. Commit only if all checks pass
```

### Example 4: No CAN Task (Substantial Work)

```markdown
🔍 Alignment Check - Build new mortgage calculator widget

✅ Active constraint: Constraint A – Public Surface Readiness
❌ **CAN task:** None found

**Problem:** Substantial work without CAN task

**Analysis:**
- Estimated scope: New component (~200 lines)
- Domain: Calculator feature
- Impact: New functionality

**This requires:**
1. CAN task creation (traceability)
2. Plan in docs/plans/active/
3. Runbook reference or creation

❌ **BLOCKED**

**Actions required:**

1. **Create CAN task in backlog:**
   - Title: "Build mortgage calculator widget"
   - Constraint: A
   - Estimate: 8-12 hours
   - Owner: [assign]

2. **Create plan (optional but recommended):**
   - File: docs/plans/active/2025-11-04-calculator-widget-plan.md
   - Reference CAN task
   - List implementation steps

3. **Check for runbook:**
   - Search: docs/runbooks/calculators/
   - If missing: Add "Create calculator runbook" to CAN task

**After resolving:**
Re-run alignment check: /check-alignment "build mortgage calculator widget"
```

### Example 5: Wrong Constraint (Drift)

```markdown
🔍 Alignment Check - Integrate external rate parser

⚠️ **Active constraint:** Constraint A – Public Surface Readiness
✅ CAN task: CAN-043 - External parser integration
✅ Runbook: docs/runbooks/integration/parser-integration-guide.md
⚠️ **Constraint mismatch:** CAN-043 references Constraint B

**Problem:** Working on Constraint B while Constraint A is active

**Analysis:**
- Active: Constraint A (Public Surface Readiness)
- This work: Constraint B (Data In, Data Approved)
- Plan: 2025-10-31-parser-crm-integration-plan.md (Constraint B)

**Impact:**
- Violates single bottleneck rule
- Diverts focus from active constraint
- May cause drift

❌ **BLOCKED**

**Options:**

1. **Defer this work:**
   - Archive plan to docs/plans/archive/2025/11/
   - Focus on Constraint A tasks
   - Resume when Constraint A complete

2. **Authorized exception:**
   - Confirm with Brent this is intentional
   - Note exception in work-log.md
   - Proceed with work

3. **Constraint A actually complete:**
   - Update strategy-alignment-matrix.md (A: ✅)
   - Activate Constraint B (B: 🟡)
   - Then proceed with work

**Recommendation:** Run /constraint-status to verify active constraint

**If approved, re-run:**
/check-alignment "integrate external rate parser" --force
```

### Example 6: Ultra-Concise (Fast Mode)

```markdown
✅ **PROCEED** - Constraint A, CAN-037, Tier 1: N/A

Follow: docs/runbooks/design/accessibility-checklist.md

TDD: Write test → Implement → Verify
```

---

## Special Cases

### Case 1: Exploratory Work (No CAN Task Needed)

```markdown
🔍 Alignment Check - Investigate why form validation is slow

✅ Active constraint: Constraint A – Public Surface Readiness
⚠️ CAN task: None (exploratory work)
✅ Runbook: docs/runbooks/forms/form-validation-guide.md
✅ Tier 1 rules: N/A (investigation only)
✅ Conflicts: None

⚠️ **PROCEED WITH CAUTION**

**Exploratory work:**
- No CAN task needed for investigation
- Log findings in work-log.md
- If fix required → Create CAN task first

**Workflow:**
1. Investigate using systematic-debugging skill
2. Document findings in work-log.md
3. If bug found → Create CAN task for fix
4. Then run /check-alignment [fix description]

**This is:** Investigation (no CAN task)
**Not:** Implementation (needs CAN task)
```

### Case 2: Multiple CAN Tasks Match

```markdown
🔍 Alignment Check - Update chat widget UI

✅ Active constraint: Constraint A – Public Surface Readiness
⚠️ **Multiple CAN tasks found:**
- CAN-051: Mobile chat UI updates
- CAN-053: AI broker chat integration
- CAN-017: Brand refresh (includes chat styling)

**Problem:** Ambiguous task reference

**Action:** Clarify which CAN task this work serves

**Ask user:**
"This work could relate to multiple CAN tasks:
- CAN-051 (mobile chat)
- CAN-053 (broker integration)
- CAN-017 (brand refresh)

Which CAN task does this work primarily serve?"

**After clarification:**
Re-run with specific CAN task: /check-alignment "update chat widget UI for CAN-051"
```

### Case 3: User Already Ran Check (Skip)

```markdown
✅ **Alignment already verified**

You ran /check-alignment 5 minutes ago for this work.

**Previous result:**
- Constraint: A
- CAN task: CAN-037
- Status: PROCEED

**No need to re-check. Proceeding with implementation.**

**TDD reminder:**
1. Write failing test
2. Implement feature
3. Verify test passes
4. Run dr-elena-compliance-checker (if Tier 1 calculation)
5. Commit with traceability
```

---

## Error Handling

### Error 1: Cannot Determine Work Description

```markdown
⚠️ **Cannot perform alignment check**

**Problem:** Work description unclear or missing

**Examples of clear descriptions:**
- "add accessibility labels to form inputs"
- "fix TDSR calculation rounding"
- "create mobile chat component"

**Please provide:**
Brief description of what you want to implement (1-2 sentences)

**Then I'll run alignment check automatically.**
```

### Error 2: Matrix File Missing

```markdown
❌ **Cannot perform alignment check**

**Error:** Matrix file not found

**Expected:** docs/plans/re-strategy/strategy-alignment-matrix.md

**Action:**

Restore from git:
```bash
git checkout docs/plans/re-strategy/strategy-alignment-matrix.md
```

Or verify repository structure:
```bash
ls docs/plans/re-strategy/
```
```

### Error 3: No Active Constraint

```markdown
❌ **Cannot perform alignment check**

**Error:** No active constraint found

**Problem:** No constraint marked 🟡 in strategy-alignment-matrix.md

**Possible reasons:**
1. Project just starting (activate Constraint A)
2. All constraints complete (ready for launch)
3. Matrix needs manual update

**Action:**

Check matrix:
```bash
cat docs/plans/re-strategy/strategy-alignment-matrix.md
```

If project starting:
→ Update matrix: Constraint A ⬜ → 🟡

If all complete:
→ Ready for production launch

If unclear:
→ Run /constraint-status to diagnose
```

---

## Best Practices

### When This Skill Activates

**✅ Auto-activates when:**
- User describes implementation work
- User mentions starting to code
- User asks to build/create/add features
- User hasn't run /check-alignment recently

**❌ Does NOT activate when:**
- User asking "how do I" questions
- User investigating bugs (use systematic-debugging)
- User exploring concepts
- User already ran /check-alignment

### Prevention vs Cure

**This skill prevents:**
- 🚫 Starting work on wrong constraint
- 🚫 Implementing without CAN task traceability
- 🚫 Skipping runbook creation (tier skipping)
- 🚫 Violating Tier 1 file rules
- 🚫 Duplicating existing work

**Better than:**
- ❌ Implementing first, discovering misalignment later
- ❌ Committing code, then finding it conflicts
- ❌ Finishing work, then realizing no CAN task
- ❌ Breaking Tier 1 rules, causing rework

### Integration Workflow

**Automatic prevention:**

```markdown
User: "Let's add a new calculator component"

constraint-aware-context (auto-activates):
→ Checks active constraint
→ Searches for CAN task
→ Checks for runbook
→ Validates Tier 1 rules
→ Detects conflicts
→ Provides PROCEED/CAUTION/BLOCKED decision

User proceeds with confidence ✅
```

**Manual backup:**

```markdown
User: "Let's add a new calculator component"

User: /check-alignment add calculator component

Same validation as auto-activation
```

---

## Performance

**Execution time:** ~8-12 seconds
- Matrix parsing: 2-3s
- CAN task search: 2-3s
- Runbook search: 2-3s
- Conflict detection: 2-3s

**Context usage:** ~700-1000 tokens
- Matrix content
- CAN task descriptions
- Runbook paths
- Tier 1 rules

**Optimization:** Caches matrix and runbook list for 1 hour

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** strategy-alignment-matrix, CANONICAL_REFERENCES, CLAUDE.md, active plans, backlog, runbooks
**Backs Up:** /check-alignment slash command
**Auto-Activation:** Keywords like "let's implement", "I want to add", "start working on"
**Output:** Concise PROCEED/CAUTION/BLOCKED decision with next steps
