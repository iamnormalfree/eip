---
name: plan-to-chunks
description: Automatically breaks down 200-line active plans into daily executable chunks with time estimates and TodoWrite tracking. Auto-activates when user references a plan file, asks "what should I do today", or starts work without clear next steps. Prevents plan proliferation by focusing on one chunk at a time.
---

# Plan to Chunks

Transforms large active plans (<200 lines per CLAUDE.md rules) into manageable daily work chunks. This skill prevents overwhelm from 8+ active plans by extracting TODAY's actionable tasks.

## When to Use This Skill

**Auto-activates when user says:**
- "What should I work on today?"
- "What's next for [plan name]?"
- References specific plan file (e.g., "unified-chat-hook plan")
- "Break down [plan] into tasks"
- "What's left in [plan]?"
- Starts session without clear direction
- Mentions feeling overwhelmed by active plans

**Explicit invocation:**
```
Use the plan-to-chunks skill to break down [plan file name]
```

**Do NOT activate for:**
- Creating new plans (that's brainstorming or planning work)
- Asking about plan status without wanting tasks
- General questions about planning process

---

## Core Functionality

### Step 1: Identify Target Plan

**Auto-detection logic:**

```bash
# If user mentions specific plan file
# Extract: "unified-chat-hook" from user message
# Find: docs/plans/active/*unified-chat-hook*.md

# If user says "what should I work on today"
# Strategy:
# 1. Check /constraint-status for active constraint
# 2. Find plans referencing active constraint
# 3. Check work-log.md for most recently mentioned plan
# 4. Suggest that plan

# If multiple plans match active constraint
# Prioritize by:
# 1. Most recent work-log mention
# 2. Shortest plan (likely closer to completion)
# 3. Critical path (check ACTIVE_PLANS_PRIORITY_ANALYSIS.md if exists)
```

**Example:**
```
User: "What should I work on today?"

Skill logic:
→ Active constraint: A (from /constraint-status)
→ Plans for Constraint A:
  - 2025-11-03-unified-chat-hook-phase3-testing.md (last worked 2025-11-04)
  - 2025-10-31-brand-kit-refresh-plan.md (last worked 2025-10-28)
→ Select: unified-chat-hook (most recent)
```

---

### Step 2: Parse Plan Structure

**Extract from plan:**

```markdown
# Plan structure to parse:

## Phases (if present)
- Phase 1: [title]
- Phase 2: [title]
- Phase 3: [title]

## Tasks (numbered list)
1. Task title
   - Subtask A
   - Subtask B
2. Next task
   ...

## Implementation Steps (alternative format)
- [ ] Step 1
- [ ] Step 2
```

**Smart parsing rules:**
1. Detect completion markers:
   - ✅ in task title = complete
   - [x] checkbox = complete
   - "(DONE)" or "(COMPLETE)" in text
2. Find current phase:
   - If phases present, identify first incomplete phase
   - If no phases, work sequentially through tasks
3. Estimate complexity:
   - File count mentioned
   - Keywords: "simple", "complex", "refactor", "new feature"
   - Default estimates by type

---

### Step 3: Extract TODAY's Chunk

**Chunking strategy:**

| Work Type | Chunk Size | Estimated Hours |
|-----------|------------|-----------------|
| Single file edit | 1-2 tasks | 1-2 hours |
| Multi-file feature | 1 task with subtasks | 2-4 hours |
| Complex refactor | 1 task only | 4-6 hours |
| Testing/documentation | 2-3 tasks | 1-3 hours |

**Rules:**
- Never chunk more than 6 hours of work for one day
- Respect task dependencies (can't do task 3 before task 2)
- Keep related subtasks together (don't split mid-task)
- If task is huge (>6h), break into sub-chunks

**Example extraction:**
```
Plan: 2025-11-03-unified-chat-hook-phase3-testing.md

Parsed structure:
✅ Phase 1: Hook implementation (complete)
✅ Phase 2: Component integration (complete)
🟡 Phase 3: Testing & documentation (in progress)
  - Task 13: E2E Tests (2h) ← Start here
    - Create test file
    - Add test IDs to components
    - Run tests
    - Update work-log
  - Task 14: Manual QA (1h)
  - Task 15: Completion report (30m)

Today's chunk: Task 13 only (2h estimated)
Reason: Clean boundary, achievable in one session
```

---

### Step 4: Create TodoWrite List

**Auto-generate TodoWrite from chunk:**

```javascript
// Transform chunk into TodoWrite format

Chunk: Task 13 - E2E Tests (4 subtasks)

TodoWrite output:
[
  {
    content: "Create E2E test file (tests/e2e/chat-cross-shell-sync.spec.ts)",
    status: "pending",
    activeForm: "Creating E2E test file"
  },
  {
    content: "Add data-testid attributes to message components",
    status: "pending",
    activeForm: "Adding test ID attributes"
  },
  {
    content: "Run Playwright tests and verify sync behavior",
    status: "pending",
    activeForm: "Running Playwright tests"
  },
  {
    content: "Update work-log with test results",
    status: "pending",
    activeForm: "Updating work-log"
  }
]
```

**TodoWrite integration:**
- Creates pending items for all subtasks
- Uses imperative form (content) + present continuous (activeForm)
- Includes file paths when relevant
- Adds verification/testing steps explicitly

---

### Step 5: Estimate Time & Set Expectations

**Provide user with:**
1. Total estimated time for chunk
2. What gets accomplished today
3. What's left for tomorrow/later
4. Dependencies or blockers to watch for

**Output format:**
```markdown
📋 **Today's Work Chunk**

**Plan:** 2025-11-03-unified-chat-hook-phase3-testing.md
**Active Constraint:** A – Public Surface Readiness
**CAN Task:** CAN-053

---

**Today: Task 13 - E2E Tests** (Estimated: 2 hours)

✅ TodoWrite initialized with 4 subtasks:
1. Create E2E test file
2. Add test ID attributes
3. Run Playwright tests
4. Update work-log

**Expected outcome:** E2E tests validating cross-shell message sync

---

**Tomorrow:** Task 14 - Manual QA checklist (1 hour)
**Remaining:** Task 15 - Completion report (30m)

**Total plan progress:** 66% complete (2/3 phases done)

---

**Blockers to watch:**
- Playwright dev server must be running for E2E tests
- May need to update component props if test IDs conflict

💡 **Tip:** Run `/check-alignment "create E2E tests"` before starting
```

---

## Integration with NextNest Frameworks

### Works with Constraint System

```bash
# Reads active constraint
grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md

# Filters plans by constraint
# Only suggests plans aligned with active constraint

# Prevents premature work on future constraints
```

### Respects Plan Limits

**CLAUDE.md compliance:**
- Plans must be <200 lines
- If plan approaching limit, suggests extraction to runbook
- Warns if plan has grown beyond soft limit (180 lines)

**Pre-commit hook integration:**
```bash
# Skill aware of: scripts/validate-plan-length.sh
# Will warn if plan modifications would trigger hook failure
```

### Follows TDD Mandate

**Task ordering:**
- Always includes "write test" before "implement feature"
- Includes "run tests" after implementation
- Adds "update work-log" as final step

**Example:**
```
TodoWrite for new feature:
1. Write failing test for [feature]
2. Implement [feature] logic
3. Run tests and verify passing
4. Update work-log with evidence
```

### Syncs with CANONICAL_REFERENCES

**Tier 1 awareness:**
```bash
# If chunk touches Tier 1 files
# Add reminder: "Check CANONICAL_REFERENCES.md rules for [file]"

# If chunk modifies lib/calculations/instant-profile.ts
# Add task: "Verify Dr Elena v2 compliance"
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "what should I work on"
- "what's next"
- "today's tasks"
- "break down [plan]"
- Plan file name (e.g., "unified-chat-hook")

**Moderate confidence triggers:**
- "what's left"
- "current work"
- "active plan"
- Starting session with "/constraint-status" (follow-up)

**Anti-triggers (DO NOT activate):**
- "create new plan" (that's planning, not chunking)
- "update plan" (editing, not chunking)
- "archive plan" (completion, not chunking)

---

## Output Examples

### Example 1: Clear Single-Phase Plan

```markdown
📋 **Today's Work Chunk**

**Plan:** 2025-10-22-ai-broker-sla-measurement.md
**Constraint:** A – Public Surface Readiness
**CAN Task:** CAN-052

---

**Today: Tasks 1-2** (Estimated: 3 hours)

✅ TodoWrite initialized with 5 subtasks:
1. Install performance monitoring library
2. Add timing instrumentation to broker API
3. Create metrics collection endpoint
4. Write unit tests for metrics
5. Update work-log

**Expected outcome:** SLA measurement infrastructure in place

---

**Tomorrow:** Tasks 3-4 - Dashboard visualization (4 hours)

**Total plan progress:** 40% complete (2/5 tasks)

---

💡 **Tip:** This plan is on hold per ACTIVE_PLANS_PRIORITY_ANALYSIS.md (Stage 1 work)
Consider deferring until Constraint A complete. Proceed anyway? (y/n)
```

### Example 2: Multi-Phase Plan (Mid-Execution)

```markdown
📋 **Today's Work Chunk**

**Plan:** 2025-10-31-parser-crm-integration-plan.md
**Constraint:** B – Data In, Data Approved (ON HOLD - Constraint A active)
**CAN Task:** CAN-043, CAN-045

---

⚠️ **Warning: Working on non-active constraint**

This plan references Constraint B, but Constraint A is currently active.

**Recommendation:**
- Complete Constraint A work first (see /constraint-status)
- Or confirm with Brent this is authorized exception

**If proceeding anyway:**

**Today: Stage A Task 3** (Estimated: 4 hours)

✅ TodoWrite initialized with 6 subtasks:
1. Audit external parser codebase
2. Document parser input/output contracts
3. Identify MAS regulation dependencies
4. Create parser test fixtures
5. Run contract validation tests
6. Update work-log

---

🚨 **Alignment Check Required**

Run `/check-alignment "audit rate parser"` before proceeding.
This ensures work is properly authorized despite constraint mismatch.
```

### Example 3: Near-Complete Plan

```markdown
📋 **Today's Work Chunk**

**Plan:** 2025-10-31-brand-kit-refresh-plan.md
**Constraint:** A – Public Surface Readiness
**CAN Task:** CAN-017

---

**Today: Final Task** (Estimated: 1 hour)

✅ TodoWrite initialized with 3 subtasks:
1. Export final brand kit assets to design-system/
2. Update tailwind.config.ts with verified tokens
3. Create completion report

**Expected outcome:** Brand kit refresh complete ✅

---

**This completes the plan!**

After completion:
1. Run evidence-collector to generate work-log entry
2. Archive plan to docs/plans/archive/2025/11/
3. Update strategy-alignment-matrix.md (mark CAN-017 complete)
4. Run `/alignment-gaps` to verify

🎉 **Plan completion workflow will auto-trigger after final TodoWrite item**
```

---

## Plan Proliferation Detection

**If user has 8+ active plans:**

```
⚠️ **Plan Proliferation Detected**

Active plans: 8
Recommended max: 3-5

**Critical plans (Constraint A):**
1. 2025-11-03-unified-chat-hook-phase3-testing.md (66% complete)

**Stage 1+ plans (should defer):**
- 2025-10-22-ai-broker-sla-measurement.md → Defer to Stage 1
- 2025-10-22-ai-broker-realtime-upgrade.md → Defer to Stage 1+
- 2025-10-23-ai-broker-sla-latency-remediation.md → Defer to Stage 1

**Recommendation:**
1. Focus on unified-chat-hook (today's chunk above)
2. Archive Stage 1+ plans until Constraint A complete
3. See ACTIVE_PLANS_PRIORITY_ANALYSIS.md for full analysis

Would you like me to suggest which plans to archive? (y/n)
```

---

## Special Cases

### Plan with No Clear Tasks

```
⚠️ **Plan structure unclear**

Plan: [filename]

Found:
- No numbered task list
- No checkboxes
- No clear phases

This plan may need restructuring.

Options:
1. Extract tasks manually from plan prose
2. Suggest plan restructure to user
3. Use /response-awareness to analyze plan and extract structure

Recommendation: Let me analyze this plan with /response-awareness to identify actionable tasks.
```

### All Tasks Complete (Plan Ready to Archive)

```
✅ **Plan Complete!**

Plan: [filename]
All tasks: ✅ Done

**Next steps:**
1. Create completion report (if not exists)
2. Archive to docs/plans/archive/YYYY/MM/
3. Update strategy-alignment-matrix.md
4. Run `/alignment-gaps`

Would you like me to start the completion workflow? (y/n)
```

### Dependencies Block Current Task

```
🚨 **Dependency Blocker Detected**

Today's chunk: Task 5 - Integration tests

**Blocked by:** Task 4 not complete (API implementation)

**Options:**
1. Complete Task 4 first (estimated 3h)
2. Work on different plan today
3. Split Task 4 into smaller chunks

Recommendation: Complete Task 4, then Task 5 (total 5h estimated)

Adjust chunk to include both tasks? (y/n)
```

---

## Performance

**Execution time:** ~5-10 seconds
- Plan file reading: 1-2s
- Structure parsing: 2-3s
- TodoWrite generation: 1-2s
- Estimate calculation: <1s

**Context usage:** ~300-500 tokens
- Plan content
- Task parsing
- TodoWrite formatting

---

## Best Practices

### When to Chunk

**✅ Good times:**
- Start of workday (fresh focus)
- After completing previous chunk
- When switching context from different work
- Weekly planning sessions

**❌ Bad times:**
- Middle of execution (breaks flow)
- During debugging (keep focus)
- When chunk is already clear

### Chunk Sizing Rules

**Goldilocks principle:**
- Too small: 30min chunks feel trivial, constant context switching
- Too big: 8h chunks feel overwhelming, hard to complete
- Just right: 2-4h chunks feel achievable, clear progress

**Adjust based on:**
- Time of day (smaller chunks in afternoon)
- Energy level (complex chunks when fresh)
- Interruption risk (smaller chunks if meetings)

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** constraint-status, TodoWrite, ACTIVE_PLANS_PRIORITY_ANALYSIS, strategy-alignment-matrix, CLAUDE.md plan limits
**Chunking Strategy:** Optimized for 2-4 hour focused work sessions per NextNest workflow patterns
