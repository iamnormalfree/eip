# SDD for Beads: Continuous Flow Execution with Beads

**Date:** 2026-01-09
**Purpose:** Adapt Subagent-Driven Development (SDD) to work with beads instead of implementation plans

---

## Overview

**Problem:** You love SDD's continuous flow, but your workflow uses beads (created via `/plan-to-beads`).

**Solution:** Adapt SDD to read from beads instead of plan files, giving you:
- SDD's continuous execution flow
- Beads' dependency tracking
- Beads' assignment workflow
- Issue tracking history

---

## Current SDD vs Proposed Beads-SDD

### Current SDD (Plan-Based)

```
1. Read plan file once (docs/plans/feature.md)
2. Extract all tasks with full text
3. Create TodoWrite tracker
4. For each task:
   - Dispatch implementer subagent
   - Spec review
   - Code review
   - Mark TodoWrite complete
5. Final reviewer for entire implementation
```

### Proposed Beads-SDD

```
1. Read beads list (.beads/beads.jsonl)
2. Filter actionable beads (open, dependencies met)
3. Extract bead details (title, description, acceptance criteria)
4. For each bead:
   - Dispatch implementer subagent
   - Spec review
   - Code review
   - Update bead status (open → closed)
5. Close epic bead when all tasks complete
```

---

## Key Differences

| Aspect | Plan-Based SDD | Beads-Based SDD |
|--------|---------------|-----------------|
| **Source** | Single plan file | .beads/beads.jsonl (JSONL) |
| **Tasks** | Extracted from markdown | Filtered from beads |
| **Tracking** | TodoWrite (in-memory) | Bead status (persistent) |
| **Dependencies** | Manual (phase order) | Automatic (bead deps) |
| **Reference** | "Plan file:line" | Bead ID |
| **Completion** | TodoWrite complete | Bead closed |
| **History** | None (session only) | Full audit trail |

---

## Implementation Plan

### Step 1: Read and Filter Beads

```bash
# Get actionable beads
actionable_beads=$(jq -r 'select(.status == "open") | select(.dependencies | length == 0) | .id' .beads/beads.jsonl)

# Or use bd CLI if available
bd list --status open | jq -r '.[].id'
```

**Bead filter criteria:**
- Status is `open` (not closed)
- Dependencies are met (no blocking beads)
- Assigned to current agent (optional)
- Priority ordered (P1 first, then P2, etc.)

### Step 2: Extract Bead Context

For each bead, extract:

```json
{
  "id": "roundtable-abc",
  "title": "Create auth service",
  "description": "Implement JWT authentication with...",
  "acceptance_criteria": "- Tests pass\n- API documented",
  "files": ["lib/auth/service.ts"],
  "labels": ["backend", "auth"],
  "source": "plan:docs/plans/feature.md#phase1"
}
```

### Step 3: SDD Execution Loop (Beads Version)

```markdown
## Beads-Based SDD Execution

**Setup:**
1. Read all actionable beads from .beads/beads.jsonl
2. Sort by priority (P1 → P2 → P3)
3. Create in-memory tracker (optional, beads are persistent)

**Per-Bead Execution:**

For bead in actionable_beads:
  1. **Mark bead in-progress** (optional: add "in-progress" status)
     ```
     bd update $bead_id --status in-progress
     ```

  2. **Dispatch implementer subagent** with bead context:
     ```
     Task("Implement bead: $bead_id")

     Prompt:
     You are implementing: $bead_title

     Description: $bead_description
     Acceptance Criteria: $bead_acceptance_criteria
     Files to modify: $bead_files

     Follow TDD, test locally, commit when complete.
     Provide receipt of changes.
     ```

  3. **Implementer completes** → Receipt provided:
     ```
     ✅ Implemented: $bead_title
     Files changed:
       - lib/auth/service.ts (added JWT signing)
       - tests/auth.test.ts (added 5 tests)
     Tests: 5/5 passing
     Commit: abc123def
     ```

  4. **Dispatch spec compliance reviewer**:
     ```
     Task("Spec review bead: $bead_id")

     Verify:
     - All acceptance criteria met?
     - No over-building (extra features)?
     - Bead description fully satisfied?
     ```

  5. **Spec reviewer approves** → ✅ Spec compliant

  6. **Dispatch code quality reviewer**:
     ```
     Task("Code review bead: $bead_id")

     Review git commit abc123def for:
     - Clean code
     - Test coverage
     - Documentation
     ```

  7. **Code reviewer approves** → ✅ Code quality good

  8. **Close bead**:
     ```
     bd close $bead_id --receipt "Implemented, tests pass, commit abc123def"
     ```

  9. **Next bead** (loop continues)

**After all beads:**
- Check if epic bead exists
- Close epic with summary
- Run final reviewer across all commits
```

---

## Integration with Existing Commands

### New Command: `/sdd-beads`

```bash
# Usage
/sdd-beads [epic-label]

# Examples
/sdd-beads epic:feature-auth
/sdd-beads backend  # All beads with 'backend' label
/sdd-beads          # All actionable beads
```

**What it does:**
1. Reads beads from .beads/beads.jsonl
2. Filters by label (if specified)
3. Runs SDD execution loop on each bead
4. Closes beads as they complete
5. Provides continuous flow execution

---

## Example Session

```
You: /sdd-beads epic:feature-auth

Claude: Reading beads from .beads/beads.jsonl...
Found 11 actionable beads for epic:feature-auth

Bead 1: roundtable-001 - Create auth service
  [Dispatch implementer subagent]
  Implementer: Implemented JWT signing service, 5/5 tests pass, commit abc123
  [Dispatch spec reviewer]
  Spec reviewer: ✅ All acceptance criteria met
  [Dispatch code reviewer]
  Code reviewer: ✅ Clean code, good tests
  [Close bead]
  ✅ Closed roundtable-001

Bead 2: roundtable-002 - Add auth middleware
  [Dispatch implementer subagent]
  Implementer: Added middleware to Express, 4/4 tests pass, commit def456
  [Dispatch spec reviewer]
  Spec reviewer: ❌ Missing: Request validation not implemented
  [Implementer fixes]
  Implementer: Added request validation, 6/6 tests pass, commit ghi789
  [Spec reviewer re-checks]
  Spec reviewer: ✅ Spec compliant now
  [Dispatch code reviewer]
  Code reviewer: ✅ Approved
  [Close bead]
  ✅ Closed roundtable-002

... (continuous flow, no interruptions)

Bead 11: roundtable-011 - Update documentation
  ✅ Closed roundtable-011

[Final reviewer]
Final reviewer: All 11 beads complete, ready for epic closure

✅ Epic complete: 11/11 beads closed
```

---

## Advantages Over Current Workflow

### vs Manual Bead Execution

| Current MAF Workflow | Beads-SDD |
|---------------------|-----------|
| Supervisor assigns beads via Agent Mail | Automatic bead selection |
| Implementor picks up bead, implements | Continuous SDD flow |
| Implementor submits for review | Inline two-stage review |
| Reviewer validates via `bd close` | Auto-close after approval |
| Manual handoffs | No handoffs, continuous |

### vs Plan-Based SDD

| Plan-Based SDD | Beads-Based SDD |
|---------------|-----------------|
| Plan file only | Full issue tracking |
| TodoWrite (session) | Persistent bead history |
| Manual dependencies | Automatic dependency resolution |
| No assignment workflow | Built-in assignment system |
| Single session only | Resumable (beads persist) |

---

## Implementation Options

### Option 1: New Skill (`beads-driven-development`)

Create a new skill analogous to `subagent-driven-development`:

```
.claude/skills/beads-driven-development/
├── SKILL.md
├── implementer-prompt.md
├── spec-reviewer-prompt.md
├── code-quality-reviewer-prompt.md
└── IMPLEMENTATION.md
```

**Pros:**
- Clean separation
- Can evolve independently
- Follows Superpowers pattern

**Cons:**
- Duplicate code with SDD
- Two skills to maintain

### Option 2: Extend SDD (`subagent-driven-development`)

Modify SDD to accept both plan files and beads:

```markdown
## When to Use

**With plan file:**
Have implementation plan? → Use SDD

**With beads:**
Have beads created? → Use SDD with --beads flag
```

**Pros:**
- Single skill for both workflows
- Unified execution model
- Less maintenance

**Cons:**
- More complex skill
- Risk of breaking existing functionality

### Option 3: Wrapper Script (`sdd-beads`)

Create a wrapper that extracts beads, creates temporary plan, calls SDD:

```bash
#!/bin/bash
# Extract beads to temporary plan
bd list --status open --format plan > /tmp/sdd-plan.md

# Call SDD with temporary plan
/sp-subagent-driven-development /tmp/sdd-plan.md

# Update bead statuses based on results
bd close --batch /tmp/sdd-results.txt
```

**Pros:**
- No SDD modifications needed
- Can iterate quickly
- Easy to test

**Cons:**
- Temporary files
- Synchronization complexity
- Not as clean as native integration

---

## Recommendation

**Start with Option 3 (wrapper script)** for fast iteration:
1. Extract beads to temporary plan format
2. Use existing SDD unchanged
3. Parse SDD output and update bead statuses
4. Validate workflow works

**Then move to Option 2 (extend SDD)** for production:
1. Add `--beads` flag to SDD
2. Detect beads vs plan input
3. Unify execution logic
4. Single skill for both workflows

**Avoid Option 1** unless there's strong reason for separate skill (maintainability concern).

---

## Success Criteria

When this works, you should have:

1. ✅ **Continuous flow:** No interruptions between beads
2. ✅ **Two-stage review:** Spec compliance → Code quality per bead
3. ✅ **Automatic closure:** Beads close after approval
4. ✅ **Dependency awareness:** Only actionable beads executed
5. ✅ **Receipt tracking:** Each bead has implementation receipt
6. ✅ **Epic closure:** Epic closes when all beads complete
7. ✅ **Resumable:** Can stop and resume (beads persist state)

---

## Open Questions

1. **Bead status values:** Should we add "in-progress" status?
   - Current: open, closed
   - Proposed: open, in-progress, closed

2. **Assignee filtering:** Should SDD only work on assigned beads?
   - Pro: Prevents multiple agents working on same bead
   - Con: Requires assignment step before execution

3. **Failure handling:** What happens when implementer fails?
   - Re-open bead with feedback?
   - Keep open for manual retry?
   - Create new "failed" status?

4. **Epic management:** Should SDD close epic automatically?
   - Pro: Complete workflow
   - Con: Epic might need manual review

5. **Integration with MAF:** How does this interact with MAF tmux agents?
   - Could MAF agents use beads-based SDD?
   - Would this replace or complement MAF workflow?

---

## Next Steps

1. **Prototype wrapper script** (Option 3)
   - Extract beads to plan format
   - Test with existing SDD
   - Update bead statuses

2. **Validate workflow**
   - Test with small epic (3-5 beads)
   - Verify continuous flow
   - Check bead status updates

3. **Extend SDD** (Option 2)
   - Add beads detection
   - Unify execution logic
   - Add `--beads` flag

4. **Integrate with MAF**
   - Test with tmux agents
   - Validate Agent Mail coordination
   - Document best practices

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Status:** Proposal
