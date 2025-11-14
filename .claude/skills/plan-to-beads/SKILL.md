---
name: plan-to-beads
description: Automatically detects when a user has a complete implementation plan ready for conversion to Beads tasks. Suggests /plan-to-beads command when plan meets readiness criteria. Integrates with NextNest constraint-driven workflow and ensures proper task traceability.
---

# Plan to Beads

Detects when an implementation plan is ready for conversion into executable Beads tasks and suggests the appropriate slash command. This skill prevents the common bottleneck where completed plans sit idle without being converted into actionable work items.

## When to Use This Skill

**Auto-activates when user says:**
- "This plan is ready to implement"
- "Time to start working on this plan"
- "How can I convert this plan into tasks?"
- "What should I do with this completed plan?"
- "Ready to execute this plan"
- References a specific plan file and mentions implementation/execution
- "Convert this plan with these supporting docs"

**Explicit invocation:**
```
Use the plan-to-beads skill to check if [plan file] is ready for conversion
```

**Do NOT activate for:**
- Planning or brainstorming (that's brainstorming skill)
- Creating new plans (that's implementation-planner skill)
- Getting tasks from existing plans (that's plan-to-chunks skill)
- General questions about Beads (use /help or documentation)

---

## Core Functionality

### Step 1: Detect Plan Readiness Context

**Context analysis triggers:**
```bash
# User mentions completion + plan file
"docs/plans/active/2025-11-04-admin-api-middleware-protection.md is ready"

# User asks about next steps after plan creation
"What do I do with this plan now that it's complete?"

# User wants to execute a specific plan
"Time to start working on the chat resume flow plan"
```

**Intent detection:**
- Look for keywords: "ready", "implement", "execute", "start work", "convert", "tasks"
- Check for plan file references (`docs/plans/active/`)
- Look for supporting file mentions (runbooks, docs, configs)
- Verify plan exists and is readable
- Exclude planning/brainstorming conversations

**Supporting file detection:**
```bash
# Detect if user mentions supporting files
if echo "$user_message" | grep -qE "runbook|supporting|docs?|reference"; then
  supporting_files_mentioned=true
  echo "ℹ️  User mentioned supporting documentation"
fi

# Extract mentioned files from context
mentioned_files=$(echo "$user_message" | grep -oE '[^`]*\.md[^`]*' | sed 's/^`//;s/`$//')
```

---

### Step 2: Validate Plan Readiness

Read the specified plan file and check readiness criteria:

**Frontmatter completeness:**
```yaml
constraint: "Constraint A – Public Surfaces Ready"  # Required
can_tasks: [CAN-053, CAN-055]                       # Required (or TBD)
status: "ready" | "active" | "draft"                # Any status acceptable
branch: feature/constraint-a-public-surfaces        # Required for branching workflow
```

**Task structure validation:**
```markdown
# Must have concrete tasks like:
## Phase 1 – Backend Setup (2h)
1. **Task title** (Est: Xh)
   - Specific implementation details
   - File paths mentioned: `lib/queue/broker-queue.ts`

# NOT just high-level descriptions like:
## Goals
- Improve the system
- Add features
```

**File path coverage:**
```bash
# Extract file paths from plan
files_mentioned=$(grep -o '`[^`]*\.\(ts\|tsx\|js\|jsx\|md\)`' "$PLAN_FILE" | wc -l)

# Minimum threshold: at least 50% of tasks should mention files
if [ "$files_mentioned" -lt "$(($tasks_count / 2))" ]; then
  echo "⚠️ Plan may need more file path details"
fi

# Note: The Beads CLI only supports --description for custom metadata.
# Make sure the plan includes the file paths so the slash command can embed them in the description body (no --files flag available).

# Detect manual-intervention language (API keys, account provisioning, credentials)
if grep -qiE 'API key|create account|request access|credential|login setup|share token' "$PLAN_FILE"; then
  echo "⚠️ Plan includes manual-intervention tasks. Remember to label them and ping the Telegram bot after conversion."
fi
```

**Constraint alignment check:**
```bash
# Verify plan serves active constraint
active_constraint=$(grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md)
plan_constraint=$(grep "^constraint:" "$PLAN_FILE" | cut -d':' -f2 | tr -d ' ')

if [[ ! "$plan_constraint" == *"$active_constraint"* ]]; then
  echo "⚠️ Plan constraint ($plan_constraint) doesn't match active constraint ($active_constraint)"
fi

# Branch field present?
if ! grep -q "^branch:" "$PLAN_FILE"; then
  echo "⚠️ Plan is missing 'branch:' frontmatter. Add it so agents know which branch to use."
fi
```

---

### Step 3: Generate Readiness Report

**If plan is ready:**
```markdown
🎯 **Plan Ready for Conversion**

**Plan:** docs/plans/active/2025-11-05-chat-resume-flow-plan.md
**Constraint:** Constraint A – Public Surfaces Ready ✅
**CAN Tasks:** CAN-053, CAN-055, CAN-056 ✅
**Tasks Found:** 8 concrete tasks with file paths ✅
**Phases:** 4 implementation phases ✅

**Estimated total effort:** ~10.5 hours

**Next step:** Run `/plan-to-beads docs/plans/active/2025-11-05-chat-resume-flow-plan.md`

This will create 8 Beads with proper constraint labels and dependencies.
```

**If plan needs work:**
```markdown
🔧 **Plan Almost Ready**

**Plan:** docs/plans/active/2025-11-05-chat-resume-flow-plan.md
**Status:** Draft (consider changing to "active" or "ready")

**Issues to fix:**
- ❌ CAN tasks marked as "TBD" (should specify actual CAN numbers)
- ⚠️ 3 of 8 tasks don't specify file paths
- ⚠️ No constraint alignment verified

**Actions:**
1. Update frontmatter: `can_tasks: [CAN-053, CAN-055]`
2. Add file paths to task descriptions
3. Run `/check-alignment chat resume flow` to verify constraint alignment

**After fixing:** Run this skill again to re-validate.
```

---

### Step 4: Suggest Slash Command

**When plan is ready:**
```bash
# Provide the exact command to run
echo "Run this command to convert your plan:"
echo ""
echo "/plan-to-beads $PLAN_FILE"
echo ""
echo "This will:"
echo "- Extract 8 concrete tasks"
echo "- Create Beads with constraint-a labels"
echo "- Set up phase dependencies"
echo "- Add Codex review blocks"
echo "- Commit the Beads state"
```

**Show expected outcome:**
```markdown
**Expected Beads to create:**
- Phase 1: 2 backend tasks (API routes, queue helpers)
- Phase 2: 3 frontend tasks (EventSource, UI components)
- Phase 3: 2 testing tasks (integration, E2E)
- Phase 4: 1 deployment task (docs, production push)

**Documentation Integration:**
- 2 supporting runbooks will be referenced in bead notes
- 4 docs referenced from plan will be linked for context
- Documentation bead created to block first implementation task

**Labels applied:** `constraint-a`, `backend`/`frontend`, `claude-pair-1`
**Dependencies:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**Codex reviews:** One per implementation task (8 total)
**Agent context:** Each bead includes all relevant documentation links
```

---

### Step 5: Integration with NextNest Workflow

**Before conversion:**
- Use `/check-alignment` to verify plan serves active constraint
- Use this skill to validate plan completeness
- Confirm CAN tasks exist and are properly aligned

**After conversion:**
- Use `/constraint-status` to see new work items in queue
- Use `plan-to-chunks` to get daily tasks from bead assignments
- Use `evidence-collector` after completing beads
- Use `can-task-linker` for commits when implementing beads

**Workflow integration:**
```markdown
1. **Plan Creation** → implementation-planner skill
2. **Plan Validation** → plan-to-beads skill (this skill)
3. **Plan Conversion** → /plan-to-beads slash command
4. **Task Extraction** → plan-to-chunks skill
5. **Implementation** → daily coding with TDD
6. **Completion** → evidence-collector skill
7. **Commit** → can-task-linker skill
```

---

### Step 6: Edge Cases and Troubleshooting

**Multiple plans mentioned:**
```bash
# If user says "my plans are ready" without specifying
echo "Found multiple active plans:"
ls docs/plans/active/*.md | head -5
echo ""
echo "Which plan would you like to validate for conversion?"
```

**Plan not found:**
```bash
if [ ! -f "$PLAN_FILE" ]; then
  echo "❌ Plan file not found: $PLAN_FILE"
  echo ""
  echo "Available plans:"
  ls docs/plans/active/*.md | sed 's/^/- /'
fi
```

**Beads not initialized:**
```bash
if [ ! -d ".beads" ]; then
  echo "⚠️ Beads not initialized in this repository"
  echo ""
  echo "Run these commands first:"
  echo "1. npx bd init"
  echo "2. Configure .beads/config.yaml if needed"
  echo "3. Then run /plan-to-beads on your plan"
fi
```

**Plan already converted:**
```bash
# Check if beads already exist for this plan
existing_beads=$(bd list --json | jq -r '.issues[] | select(.note | contains("'"$(basename "$PLAN_FILE")"'")) | .id')

if [ -n "$existing_beads" ]; then
  echo "⚠️ Found existing Beads for this plan:"
  echo "$existing_beads"
  echo ""
  echo "Options:"
  echo "- Use existing beads: bd ready --label constraint-a"
  echo "- Delete existing beads first (bd delete <id>)"
  echo "- Create new beads with different title"
fi
```

---

## Auto-Activation Patterns

**Primary triggers:**
- "ready to implement" + plan file reference
- "convert this plan" + plan context
- "time to start work on" + specific plan
- "what should I do with this completed plan"

**Secondary triggers:**
- "execute this plan"
- "turn plan into tasks"
- "plan implementation ready"

**Anti-triggers:**
- "create a plan for" (planning, not execution)
- "help me plan" (brainstorming)
- "what's in this plan" (information gathering)
- "how to write plans" (learning)

---

## Example Interactions

### Perfect Readiness
```
User: "The admin API middleware protection plan is ready to implement"

→ plan-to-beads skill activates
→ Reads docs/plans/active/2025-11-04-admin-api-middleware-protection.md
→ Validates: Constraint A, 7 tasks with files, phases defined
→ Output: Ready report + /plan-to-beads command suggestion
```

### Needs Work
```
User: "This new plan looks complete, time to start working on it"

→ plan-to-beads skill activates
→ Finds plan: docs/plans/active/2025-11-05-chat-resume-flow-plan.md
→ Detects: CAN tasks = TBD, some tasks missing files
→ Output: "Almost ready" report + specific fixes needed
```

### Multiple Plans
```
User: "All my plans are ready to go"

→ plan-to-beads skill activates
→ Detects multiple plans in docs/plans/active/
→ Asks: "Which plan would you like to validate for conversion?"
→ Lists available plans with status summary
```

---

## Integration Points

### Works With These Skills:
- **implementation-planner** (creates the plans this converts)
- **plan-to-chunks** (extracts daily work from converted beads)
- **check-alignment** (validates before conversion)
- **constraint-router** (shows work after conversion)
- **evidence-collector** (documents completion)
- **can-task-linker** (commits during implementation)

### Coordinates With These Commands:
- `/plan-to-beads` (the actual conversion command)
- `/constraint-status` (view work queue after conversion)
- `/check-alignment` (validate before conversion)
- `/alignment-gaps` (ensure system health)

### Reads These Files:
- `docs/plans/active/*.md` (the plans to validate)
- `docs/plans/re-strategy/strategy-alignment-matrix.md` (constraint alignment)
- `docs/plans/re-strategy/backlog/master-task-list.csv` (CAN task validation)
- `.beads/config.yaml` (check if beads initialized)

### Updates These Files:
- No direct file updates (read-only validation skill)
- Suggests running commands that update `.beads/` and git state

---

## Configuration

**Readiness thresholds (configurable via .claude/config/response-awareness-config.json):**
```json
{
  "plan_to_beads": {
    "min_tasks": 3,
    "file_path_threshold": 0.5,
    "require_can_tasks": true,
    "require_constraint_alignment": true,
    "max_phases": 6
  }
}
```

**Default thresholds:**
- Minimum 3 concrete tasks required
- At least 50% of tasks must mention file paths
- CAN tasks should be specified (TBD allowed with warning)
- Constraint alignment should match active constraint
- Maximum 6 phases (prevents overly complex plans)

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-11
**Dependencies:** /plan-to-beads slash command
**Integration:** Full NextNest workflow compatibility
**Status:** Ready for production use

---

**Last Updated:** 2025-11-11
**Total Active Skills:** 25 (including this skill)
**Workflow Coverage:** Complete plan lifecycle (creation → validation → conversion → execution → completion)
**Next Action:** Test with real plan files to validate readiness detection

---

## Supporting Files Integration Examples

### Basic Plan Conversion
```
User: "The admin API middleware protection plan is ready to implement"

→ Suggests: /plan-to-beads docs/plans/active/2025-11-04-admin-api-middleware-protection.md

Process:
1. Parses plan tasks and file paths
2. Extracts referenced runbooks from plan
3. Creates beads with plan-only references
```

### Plan with Supporting Documentation
```
User: "The chat resume flow plan is ready, and I want to include the SSE runbook and transition guide"

→ Detects supporting files mentioned
→ Suggests: /plan-to-beads docs/plans/active/2025-11-05-chat-resume-flow-plan.md docs/runbooks/chat/sse-waitlist-streaming.md docs/runbooks/chat/chat-transition-sse-integration.md

Process:
1. Parses plan tasks and file paths
2. Adds provided supporting files to all bead notes
3. Extracts additional references from plan
4. Creates documentation bead to organize context
5. Each bead gets complete documentation links
```

### Auto-Detection of References
```
User: "This plan references several runbooks and is ready for execution"

→ Scans plan for `docs/runbooks/*.md` references
→ Counts 4 runbook references in plan
→ Suggests conversion with runbook integration
→ Creates separate documentation bead for the 4 runbooks
```

### Resulting Agent Experience
When agents pick up beads, they get:
```markdown
Bead: nextnest-42 - CAN-053: Implement queue stream API

Description: Files: app/api/brokers/queue-stream/[conversationId]/route.ts, lib/queue/broker-queue.ts
Tests: tests/integration/api/brokers/queue-stream.test.ts
Required Documentation:
- Refer to: docs/runbooks/chat/sse-waitlist-streaming.md (provided)
- Refer to: docs/runbooks/chat/chat-transition-sse-integration.md (provided)
- Reference: docs/runbooks/chat/sse-waitlist-pitfalls.md (from plan)
- Reference: docs/plans/active/2025-11-03-real-time-foundations.md (from plan)
Source: docs/plans/active/2025-11-05-chat-resume-flow-plan.md#Phase1.Task1

Labels: constraint-a, backend, claude-pair-1, runbook
```

**Note:** The Beads CLI doesn't support `--files` or `--note` flags. All file paths, documentation references, and source information go into the description body using the `--description` flag.

This ensures agents have complete context without needing to search for referenced documentation.
