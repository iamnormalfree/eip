---
name: evidence-collector
description: Automatically generates formatted work-log entries after completing work, with full evidence trail including git changes, test results, constraint alignment, and CAN task linkage. Auto-activates when user completes milestones, fixes bugs, or implements features.
---

# Evidence Collector

Automates the tedious work of formatting work-log entries with complete evidence trails. This skill activates when you finish work and need to document what was accomplished.

## When to Use This Skill

**Auto-activates when user says:**
- "Done with [feature/bug/task]"
- "Fixed [problem]"
- "Implemented [feature]"
- "Completed [task/milestone]"
- "Finished [work description]"
- "Just committed [changes]"
- References completing a TodoWrite item
- Mentions updating work-log

**Explicit invocation:**
```
Use the evidence-collector skill to document [work completed]
```

**Do NOT activate for:**
- Work still in progress (unless user explicitly asks for in-progress entry)
- Exploratory/investigation work without concrete changes
- Simple questions about how to update work-log

---

## Core Functionality

### Step 1: Gather Context Automatically

```bash
# Git context
git branch --show-current
git status --short
git diff --stat HEAD

# Active constraint
grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md | head -1

# Changed files analysis
git diff --name-only HEAD
```

### Step 2: Intelligent CAN Task Detection

**Logic chain:**
1. Identify changed files from git
2. Search active plans (`docs/plans/active/*.md`) for file mentions
3. Extract CAN task from plan frontmatter or body
4. If multiple CAN tasks found, list all
5. If none found:
   - Check if changes are minor (config, comments, typos)
   - Mark as "None (minor fix)" or "None (investigation)"
   - Otherwise warn: "⚠️  No CAN task - should this have one?"

**Example search:**
```bash
# Changed file: hooks/useChatwootConversation.ts
# Search: grep -l "useChatwootConversation" docs/plans/active/*.md
# Find: 2025-11-03-unified-chat-hook-phase3-testing.md
# Extract: CAN-053 from plan
```

### Step 3: Auto-Run Related Tests

**Test detection patterns:**

| Changed File | Test Command | Test File |
|--------------|--------------|-----------|
| `components/**/*.tsx` | `npm test -- [ComponentName]` | `tests/**/__tests__/[ComponentName].test.tsx` |
| `lib/**/*.ts` | `npm test -- [moduleName]` | `tests/**/[moduleName].test.ts` |
| `hooks/**/*.ts` | `npm test -- [hookName]` | `tests/hooks/[hookName].test.tsx` |
| `app/api/**/route.ts` | `npm test -- [apiName]` | `tests/api/[apiName].test.ts` |

**If tests exist:** Run and capture results (X/Y passing)
**If no tests:** Note "Tests: None (consider adding coverage)"

### Step 4: Format Work-Log Entry

**Template follows existing `docs/work-log.md` pattern:**

```markdown
## YYYY-MM-DD - [Concise Title from User Input]

**Constraint:** [X] – [Constraint Name]
**CAN Task:** CAN-[###] | "None (minor fix)" | "None (investigation)"
**Status:** Complete | In Progress | Blocked

**What was implemented:**
- [Key change 1]
- [Key change 2]
- [Key change 3]

**Files changed:**
- [path] (+X, -Y)
- [path] (+X, -Y)

**Tests:**
- `[test command]` ([X]/[Y] passing)

**Evidence:** [Brief verification statement]

---
```

### Step 5: Suggest Evidence Links (When Applicable)

**Stage 0 / Accessibility work:**
- Screenshots: `validation-reports/screenshots/`
- Lighthouse: `validation-reports/lighthouse/`
- Axe DevTools: `validation-reports/accessibility/`

**Performance work:**
- Metrics: `validation-reports/performance/`

**Integration work:**
- Link to test files
- Link to E2E reports

**Suggest creating files if missing**

---

## Integration with NextNest Frameworks

### Integrates with Existing Slash Commands

**Sequential workflow:**
```
1. /check-alignment [work]  → Before starting
2. [Do the work]
3. evidence-collector       → After completing (auto-activates)
4. /alignment-gaps          → Weekly drift check
```

### Reads from Constraint System

- `docs/plans/re-strategy/strategy-alignment-matrix.md` → Active constraint
- `docs/plans/active/*.md` → CAN task lookup
- `docs/plans/ROADMAP.md` → Constraint details

### Follows CLAUDE.md Standards

- ✅ Git workflow compliance (uses git commands per standards)
- ✅ Evidence-based completion (tests + metrics)
- ✅ TDD verification (checks test results)
- ✅ Constraint traceability (links to CAN tasks)

### Respects CANONICAL_REFERENCES.md

- Checks if changed files are Tier 1
- Notes when Tier 1 files modified
- Suggests runbook updates if Tier 1 changed

---

## Activation Triggers (Keywords)

**Primary triggers (high confidence):**
- "done", "fixed", "implemented", "completed", "finished"
- "just committed", "all tests passing", "ready to log"

**Context triggers (moderate confidence):**
- User mentions specific work completed
- References completing a TodoWrite item
- Mentions milestone reached

**Anti-triggers (DO NOT activate):**
- "how do I update work-log" (they're asking, not completing)
- "still working on" (not done yet)
- "planning to" (future work)

---

## Output Format

### Standard Complete Work

```markdown
📝 **Work-Log Entry Generated**

---

## 2025-11-04 - Chat Persistence Race Condition Fix

**Constraint:** A – Public Surface Readiness
**CAN Task:** CAN-053
**Status:** Complete

**What was implemented:**
- Updated useChatwootConversation hook to await initial message load
- Added integration test for polling behavior
- Prevents hydration race condition

**Files changed:**
- hooks/useChatwootConversation.ts (+12, -5)
- tests/hooks/useChatwootConversation.test.ts (+22, -0)

**Tests:**
- `npm test -- useChatwootConversation` (10/10 passing)

**Evidence:** Hook waits for initial API response before polling. All tests passing. Race condition eliminated.

---

✅ **Ready to paste into `docs/work-log.md`**

📋 **Optional next steps:**
1. Paste entry at top of docs/work-log.md (after "# Work Log")
2. Update strategy-alignment-matrix.md if CAN-053 complete
3. Run `/alignment-gaps` to verify system balance
```

### In-Progress Work

```markdown
## 2025-11-04 - AI Broker Chat UI Rebuild

**Constraint:** A – Public Surface Readiness
**CAN Task:** CAN-053
**Status:** In Progress

**What was implemented:**
- Phase 1: Unified chat hook (✅ complete)
- Phase 2: Mobile component integration (🟡 in progress)

**Files changed:**
- hooks/useChatwootConversation.ts (+156, -0)
- components/ai-broker/MobileAIAssistantCompact.tsx (+38, -87)

**Tests:**
- `npm test -- useChatwootConversation` (10/10 passing)
- `npm test -- MobileAIAssistantCompact` (pending)

**Next steps:**
- [ ] Complete mobile component tests
- [ ] E2E sync validation
- [ ] Manual QA checklist

**Evidence:** Phase 1 complete with all unit tests passing. Phase 2 implementation ongoing.
```

---

## Special Cases

### Investigation-Only Work (No Code Changes)

```markdown
## 2025-11-04 - Desktop Chat Layout Investigation

**Constraint:** C1 – Public Surface Readiness
**CAN Task:** CAN-051 (context)
**Status:** Complete

**What was investigated:**
- Traced bottom whitespace to container height inheritance
- Confirmed right rail capped at 1280px by Tailwind container
- Identified CustomChatInterface percentage height issue

**Files reviewed:**
- components/ai-broker/SophisticatedLayout.tsx (no changes)

**Findings documented in:** docs/work-log.md (this entry)

**Next action:** Propose layout adjustments in active plan
```

### Tests Failing (Blocked Status)

```markdown
## 2025-11-04 - Form Validation Refactor

**Constraint:** A – Public Surface Readiness
**CAN Task:** CAN-037
**Status:** Blocked

**What was implemented:**
- Refactored validation to use Zod schemas
- Updated form components to new validation API

**Files changed:**
- lib/validation/form-schemas.ts (+89, -0)
- components/forms/ProgressiveFormWithController.tsx (+45, -67)

**Tests:**
- `npm test -- form-schemas` (5/5 passing)
- `npm test -- ProgressiveFormWithController` (8/12 passing, 4 failing)

**Failures:**
- "validates email format" - Zod message format changed
- "handles empty required fields" - New error structure
- "shows inline errors" - Error prop type mismatch
- "submits valid form" - Integration broken by validation changes

**Next action:** Fix failing tests before marking complete. Likely need to update error message assertions and prop types.

**Evidence:** Partial implementation with unit tests passing but integration tests failing.
```

---

## Error Handling

### No Changes Detected

```
⚠️ **No git changes detected**

Either:
1. Commit your changes first, then describe work
2. Specify this is investigation-only work
3. Describe in-progress work with partial completion

Usage examples:
- "Done investigating chat layout issue" (investigation)
- "In progress: implementing form validation" (partial)
```

### Cannot Determine Constraint

```
❌ **Cannot determine active constraint**

Check: docs/plans/re-strategy/strategy-alignment-matrix.md
Expected: Exactly one constraint marked 🟡
Found: [none | multiple]

Action: Run `/constraint-status` to diagnose
```

### No CAN Task Found

```
⚠️ **No CAN task found for this work**

Changed files:
- [list of files]

Active plans searched: [count]

Options:
1. This is minor work (typo/comment/config) → Will mark as "None (minor fix)"
2. Work is exploratory → Will mark as "None (investigation)"
3. Missing CAN task → Should create one via backlog

Proceeding with: "None (minor fix)"

💡 If this work is substantial, consider creating a CAN task for traceability.
```

---

## Best Practices

### When to Run This Skill

**✅ Good times:**
- After completing a TodoWrite item
- When all tests passing
- Before switching to new task
- At end of work session
- After achieving a milestone

**❌ Bad times:**
- Middle of implementation
- Before testing changes
- During exploration
- When unclear what was accomplished

### Accuracy Tips

**For best results:**
1. Commit changes before running (captures accurate file diffs)
2. Run tests before running (captures test status)
3. Provide clear, concise work description (becomes entry title)
4. Specify status if not "Complete" (e.g., "in progress: implementing X")

### Integration Flow

```
Normal workflow:
1. /check-alignment [work] → Validates before starting
2. [Implement + test] → Following TDD
3. git add + git commit → Stage changes
4. [Skill auto-activates or explicit] → evidence-collector
5. Copy entry to docs/work-log.md → Document
6. /alignment-gaps (weekly) → Verify balance
```

---

## Performance

**Execution time:** ~10-15 seconds
- Git commands: 2-3s
- File searching: 2-3s
- Test execution: 5-10s (if tests run)
- Formatting: <1s

**Context usage:** ~500-1000 tokens
- Git output parsing
- Plan searching
- Template generation

**Optimization:** Skill caches constraint/plan lookups to avoid repeated reads

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** constraint-status, check-alignment, alignment-gaps, CANONICAL_REFERENCES, strategy-alignment-matrix
**Evidence Format:** Matches `docs/work-log.md` existing patterns per 2025-10-31+ entries
