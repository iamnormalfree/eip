# MAF-BDD Orchestrator - User Guide

> Execute ready beads autonomously using a 3-agent model with MAF coordination, BDD discipline, and BV intelligence.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Common Workflows](#common-workflows)
3. [Troubleshooting](#troubleshooting)
4. [Best Practices](#best-practices)
5. [Advanced Usage](#advanced-usage)
6. [Reference](#reference)

---

## Quick Start

### What is MAF-BDD?

MAF-BDD Orchestrator is an autonomous bead execution system that uses three specialized agents working together:

- **Coordinator**: Orchestrates the workflow, manages priorities, and tracks progress
- **Implementer**: Executes individual beads following TDD workflow (fresh agent per bead)
- **Reviewer**: Performs two-stage code review after each bead (fresh agent per bead)

**Key Benefits:**
- Autonomous execution - runs until no ready beads remain
- Quality gates - two-stage review (spec compliance + code quality)
- Smart prioritization - uses BV robot triage for optimal ordering
- Dependency awareness - respects bead dependencies and forms parallel-safe groups
- Memory efficient - spawn-and-kill lifecycle keeps memory usage low

### Prerequisites

Before using MAF-BDD, ensure you have:

1. **MAF installed and configured**
   ```bash
   # Verify MAF is working
   bash scripts/maf/health-check.sh
   ```

2. **Beads database with ready beads**
   ```bash
   # Check for ready beads
   bd ready

   # Or use JSON output for parsing
   bd ready --json
   ```

3. **BV (Bead Vision) available**
   ```bash
   # Verify BV commands work
   bv --robot-triage
   bv --blocked
   bv --progress
   ```

4. **Clean git state**
   ```bash
   # Ensure no uncommitted changes
   git status

   # Be on correct branch (usually main or feature branch)
   git branch --show-current
   ```

### Invoking MAF-BDD

The simplest way to start MAF-BDD:

```bash
# In Claude Code, use the slash command
/maf-bdd
```

This will:
1. Run BV robot triage for initial priorities
2. Check for blockers
3. Get all ready beads
4. Analyze dependencies and form execution groups
5. Execute beads group by group with full review gates
6. Loop until no ready beads remain
7. Display final progress summary

### What Happens During Execution

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 MAF-BDD Orchestrator Starting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 BV Robot Triage
  High priority: 3 beads
  Medium priority: 5 beads
  Low priority: 2 beads

📋 Ready Beads: 10
🔗 Dependency Groups: 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📎 Group 1 (4 beads) - No dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Bead 1/4: nextnest-df9 - V2-T2.6-Publish-Gate
   ✅ Pre-flight checks passed
   🔄 Implementer: Creating publish gate...
   ✅ Tests: 6/6 passing
   ✅ Self-review: Passed
   ✅ Spec compliance: Approved
   ✅ Code quality: Approved
   ✅ Bead closed

[... continues for all beads in all groups ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Execution Complete!

📊 Session Summary:
  Completed: 9/10 beads (90%)
  Failed: 1 bead (escalation triggered)
  Groups executed: 4
  Duration: 45 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Common Workflows

### Running Ready Beads

**Scenario**: You have a backlog of ready beads and want autonomous execution.

```bash
# Simply invoke the orchestrator
/maf-bdd
```

**What happens:**
1. Coordinator gets all ready beads
2. Analyzes dependencies and forms groups
3. Sorts by BV priority
4. Executes each bead with full review gates
5. Closes approved beads, reopens rejected ones with feedback
6. Continues until no ready beads remain

**Tips:**
- First run may take longer as dependencies are analyzed
- Watch the progress dashboard after each group
- Check reopened beads for reviewer feedback

### Handling Failures

**Scenario**: A bead fails implementation or review.

MAF-BDD automatically handles failures through escalation:

**First Failure:**
```json
{
  "bead_id": "nextnest-1pg",
  "attempts": 1,
  "failure_reason": "V1 API incompatibility - direct bridge failed",
  "suggested_approach": "Review failure reason and adjust approach"
}
```

**Second Failure:**
```json
{
  "bead_id": "nextnest-1pg",
  "attempts": 2,
  "failure_reasons": [
    "V1 API incompatibility - direct bridge failed",
    "Type mismatch in V2 event format"
  ],
  "suggested_approach": "Try alternative architecture or pattern"
}
```

**Third Failure:**
```json
{
  "bead_id": "nextnest-1pg",
  "attempts": 3,
  "suggested_approach": "May need bead revision - consider reopening with notes"
}
```

**Your Options:**
1. **Let it retry**: MAF-BDD will automatically retry with new context
2. **Update the bead**: If approach needs fundamental change:
   ```bash
   bd update [bead-id] --notes="Try parsing V1 response to intermediate format first"
   ```
3. **Skip for now**: Move to next bead, come back later

### Reviewing Progress

**During Execution:**

Progress dashboard displays after each group:

```
📊 Session Progress:
  Completed: 6/10 beads (60%)
  Failed: 0 beads
  In Progress: 1 bead
  Remaining: 3 beads
  Groups executed: 3/4

✅ Unblocked by this session:
  • nextnest-ztv - V2-T2.4 (was blocked by nextnest-bad)
  • nextnest-9co - V2-T2.5a (was blocked by nextnest-ztv)
```

**After Execution:**

```bash
# Check final status
bv --progress

# See which beads completed
bd list --status=closed

# See which beads reopened (needs work)
bd list --status=reopen
```

### Working with Dependencies

**Scenario**: Beads have complex dependencies.

MAF-BDD automatically:
1. Parses dependencies from bead descriptions
2. Builds dependency graph
3. Performs topological sort
4. Forms parallel-safe groups

**Example dependency patterns recognized:**
```
Depends on: V1-T1, V1-T4
Dependencies: V1-S1, V1-S2, V1-S3
BLOCKED: Waiting for V1 Shadow Spine completion
V2-T2.3 (depends on V2-T2.1, V2-T2.2 by numbering)
```

**Group formation example:**
```
Group 1 (4 beads) - No dependencies:
  1. nextnest-df9 - V2-T2.6-Publish-Gate
  2. nextnest-1pg - V2-T2.7-V1-Bridge
  3. nextnest-p93 - V2-T2.8-Table-Rendering
  4. nextnest-6e1 - V2-T2.9-Diff-Utils

Group 2 (1 bead) - After Group 1:
  1. nextnest-bad - V2-T2.3-DB-Migrations
     Depends on: V1 completion

Group 3 (2 beads) - After Group 2:
  1. nextnest-ztv - V2-T2.4-Supabase-Store
     Depends on: V2-T2.3
  2. nextnest-9co - V2-T2.5a-Pure-Rebuild
     Depends on: V2-T2.4
```

---

## Troubleshooting

### No Ready Beads

**Symptom**: MAF-BDD starts but immediately says "No ready beads"

**Causes:**
1. All beads are already completed
2. Remaining beads have unmet dependencies
3. No beads in database

**Solutions:**

```bash
# Check bead status
bd list

# Check for blocked beads
bv --blocked

# Check for beads with pending status
bd list --status=pending

# If beads are pending but blocked, you may need to:
# 1. Complete blocking beads first
# 2. Update bead descriptions to remove invalid dependencies
# 3. Create new beads for unblocking work
```

**Example:**
```bash
# See what's blocking other beads
bv --blocked

# Output:
# Blocked beads:
#   nextnest-bad (V2-T2.3) blocked by: V1 completion
#   nextnest-ztv (V2-T2.4) blocked by: nextnest-bad

# Solution: Create or complete V1 spine first, then nextnest-bad
```

### Agent Crashes

**Symptom**: Implementer or reviewer agent crashes during execution

**Causes:**
1. Out of memory (too many agents)
2. Timeout on complex bead
3. Invalid bead description
4. External dependency failure

**Solutions:**

**Check system resources:**
```bash
# Monitor memory during execution
watch -n 5 'ps aux | grep claude'

# Should only see 3 agents max:
# - Coordinator (persistent)
# - Implementer (per bead)
# - Reviewer (per bead)
```

**Check bead description:**
```bash
# Ensure bead has valid description
bd show [bead-id]

# Look for:
# - Clear description
# - No circular dependencies
# - Achievable scope
```

**Retry with escalation:**
```bash
# MAF-BDD automatically retries up to 3 times
# Check escalation context
bd update [bead-id] --notes="Manual review needed"
```

**If persistent:**
```bash
# Pause MAF-BDD
# Fix the issue manually
# Reopen bead when ready
bd update [bead-id] --status=reopen
```

### Dependency Conflicts

**Symptom**: Beads in same group conflict on files

**Example:**
```
Group 1:
  Bead A: modifies lib/auth.ts
  Bead B: modifies lib/auth.ts
  Conflict! Cannot execute in parallel
```

**Solutions:**

**MAF-BDD automatically detects this and splits groups:**
```
Original Group 1 (4 beads)
Detected file conflict: lib/auth.ts

Split into:
  Group 1a (2 beads): Bead A, Bead C
  Group 1b (2 beads): Bead B, Bead D
```

**Manual resolution if needed:**
```bash
# Check which beads conflict
bd show [bead-id-1]
bd show [bead-id-2]

# Update one bead to different file
bd update [bead-id] --notes="Move to lib/auth-v2.ts instead"
```

### Pre-flight Validation Failures

**Symptom**: Pre-flight checks fail before bead execution

```
❌ Pre-flight failed: git_clean, branch_correct
```

**Solutions:**

```bash
# Fix git state
git status
git stash  # or commit changes

# Switch to correct branch
git checkout main

# Verify dependencies
npm install  # or python -m venv venv, etc.

# Retry MAF-BDD
/maf-bdd
```

**Pre-flight checks:**
- `git_clean`: No uncommitted changes
- `branch_correct`: On expected branch
- `no_uncommitted`: No staged but uncommitted changes
- `deps_installed`: Dependencies are installed

### Reviewer Rejects Implementation

**Symptom**: Bead passes implementation but reviewer rejects

```
✅ Implementation complete
❌ Spec compliance: Missing feature
❌ Code quality: Poor error handling
🔄 Bead reopened with feedback
```

**Solutions:**

**Let MAF-BDD handle it:**
- Same implementer (with fresh context) fixes issues
- Reviewer reviews again
- Continues until approved

**Manual intervention if needed:**
```bash
# Check reviewer feedback
bd show [bead-id]

# Add clarification if bead description is unclear
bd update [bead-id] --notes="Clarification: Error handling should log and continue, not fail"

# MAF-BDD will pick up on next run
```

### Memory Issues

**Symptom**: System slows down or OOM during execution

**Causes:**
- Agent memory not being freed
- Too many concurrent operations
- Large codebase in context

**Solutions:**

```bash
# Check memory usage
ps aux | grep claude | awk '{print $6}' | awk '{sum+=$1} END {print sum/1024 " MB"}'

# Should see:
# - Coordinator: ~50MB (persistent)
# - Implementer: ~500MB (during execution)
# - Reviewer: ~500MB (during execution)
# - Total peak: ~1GB
```

**If memory is high:**
```bash
# Kill stuck agents
pkill -9 -f "claude.*implementer"
pkill -9 -f "claude.*reviewer"

# Coordinator should auto-recover
# If not, restart MAF-BDD
```

**Prevention:**
- MAF-BDD uses spawn-and-kill lifecycle
- Agents are killed after each bead
- Memory should free automatically
- If issues persist, report as bug

---

## Best Practices

### Writing Clear Bead Descriptions

**Good bead description:**
```
Implement publish gate for V2 ratebook.

Requirements:
- Validate snapshot before publish (compare with V1)
- Add publish() method to lib/ratebook-v2/publish.ts
- Return success/failure status
- Log all validation steps

Edge cases:
- Handle V1 unavailability gracefully
- Detect and report data inconsistencies

Dependencies: V2-T2.5 (pure rebuild complete)
Testing: Unit tests for validation logic
```

**Bad bead description:**
```
Do publish stuff for V2.
```

**Tips:**
- Be specific about requirements
- List edge cases to handle
- Specify dependencies explicitly
- Mention testing requirements
- Keep scope small and focused

### Testing Before Running MAF-BDD

**Before autonomous execution:**

1. **Verify pre-flight checks:**
   ```bash
   # Ensure clean state
   git status
   git branch --show-current

   # Check dependencies
   npm test  # or equivalent
   ```

2. **Validate bead descriptions:**
   ```bash
   # Check a few beads manually
   bd show [bead-id]

   # Verify:
   # - Clear description
   # - Achievable scope
   # - Explicit dependencies
   ```

3. **Test with small batch:**
   ```bash
   # If worried, test with 1-2 beads first
   bd ready --limit 2

   # If that works, run full MAF-BDD
   /maf-bdd
   ```

### Monitoring Progress

**During execution:**

```bash
# In another terminal, monitor progress
watch -n 10 'bd list --status=closed | wc -l'

# Check for reopened beads (issues)
watch -n 10 'bd list --status=reopen'

# Monitor system resources
watch -n 5 'ps aux | grep claude'
```

**After each group:**
- Review progress dashboard
- Check for reopened beads
- Verify escalation context (if failures)

**After completion:**
```bash
# Summary of completed work
bv --progress

# Check for any issues
bd list --status=reopen

# Review commits
git log --oneline -10
```

### Managing Escalation

**When beads fail repeatedly:**

**After 1st failure:**
- MAF-BDD provides failure reason
- Suggests approach adjustment
- Automatic retry with new context

**After 2nd failure:**
- Escalation suggests alternative architecture
- Consider if bead needs revision

**After 3rd failure:**
- Bead marked for manual review
- Options:
  1. Update bead description with clarifications
  2. Break into smaller beads
  3. Implement manually

**Example:**
```bash
# Bead failed 3 times
bd update nextnest-1pg \
  --notes="Breaking into 2 beads: 1) Parse V1 response, 2) Convert to V2 events"

# Create new beads
bd create "Parse V1 ratebook response to intermediate format" \
  --parent=nextnest-1pg

bd create "Convert intermediate format to V2 events" \
  --parent=nextnest-1pg \
  --depends-on="[new-intermediate-parse-bead-id]"

# Close original bead
bd close nextnest-1pg --notes="Split into smaller beads for better focus"
```

### Working with Large Bead Backlogs

**Scenario**: 50+ ready beads

**Best practices:**

1. **Let MAF-BDD handle prioritization:**
   - BV robot triage optimizes order
   - Dependency analysis prevents conflicts
   - No manual sorting needed

2. **Monitor in batches:**
   - Check progress after each group
   - Don't micromanage individual beads
   - Focus on reopened beads (issues)

3. **Handle blockers first:**
   ```bash
   # Check for unblocking tasks
   bv --blocked

   # Prioritize beads that unlock others
   # MAF-BDD does this automatically
   ```

4. **Parallelize when possible:**
   - MAF-BDD forms parallel-safe groups
   - Independent beads in same group
   - Dependent beads across groups

### Quality Assurance

**Even with autonomous execution, maintain quality:**

1. **Review reopened beads:**
   ```bash
   # Check why beads reopened
   bd list --status=reopen

   # Review feedback
   bd show [bead-id]

   # Add clarifications if needed
   ```

2. **Sample review commits:**
   ```bash
   # Spot check some completed beads
   git log --oneline | head -10

   # Show diff for a bead
   git show [commit-hash]
   ```

3. **Run test suite:**
   ```bash
   # After MAF-BDD completes
   npm test

   # Or run continuously in another terminal
   npm run test:watch
   ```

4. **Validate integration:**
   ```bash
   # Ensure system still works
   npm run build
   npm run start
   ```

---

## Advanced Usage

### Custom Priority Sorting

**Default behavior**: BV robot triage prioritizes automatically

**Manual override if needed:**
```bash
# Update bead with priority
bd update [bead-id] --labels="priority:high"

# Or use BV commands directly
bv --robot-triage --custom-sort
```

### Dependency Management

**Complex dependency scenarios:**

**Multiple dependencies:**
```
Depends on: V1-T1, V1-T4, V2-S1
```

**Transitive dependencies:**
```
# Bead C depends on B, B depends on A
# MAF-BDD handles automatically: A -> B -> C
```

**Circular dependencies (avoid these):**
```
# Bad: Bead A depends on B, B depends on A
# Solution: Extract common dependency to Bead C
# A -> C, B -> C
```

### Working with Escalation Context

**View escalation context:**
```bash
# MAF-BDD tracks this internally
# Bead updates include escalation notes
bd show [bead-id]
```

**Manual escalation:**
```bash
# If you want to manually escalate
bd update [bead-id] \
  --notes="Escalating: Previous approaches failed. Try X instead."

# MAF-BDD picks this up on next run
```

### Integration with Other Tools

**Combine with BV commands:**
```bash
# Before MAF-BDD: Check priorities
bv --robot-triage

# After MAF-BDD: Check progress
bv --progress

# Find blockers
bv --blocked
```

**Combine with git workflow:**
```bash
# MAF-BDD commits each bead
# After completion, create PR
git log --oneline | head -20

# Or push to remote
git push origin feature-branch
gh pr create --title "Implement V2 ratebook"
```

### Session Management

**Long-running sessions:**

```bash
# Start MAF-BDD
/maf-bdd

# If interrupted, it can resume:
# - Completed beads stay closed
# - In-progress beads may need review
# - Just run /maf-bdd again

# To start fresh:
bd list --status=in-progress | xargs -I {} bd update {} --status=pending
```

---

## Reference

### Commands Used by MAF-BDD

**Bead commands:**
```bash
bd ready --json --limit 50          # Get ready beads
bd close [bead-id]                  # Close completed bead
bd update [bead-id] --status=reopen # Reopen for more work
bd show [bead-id]                   # Show bead details
bd list --status=closed             # List completed beads
bd list --status=reopen             # List reopened beads
```

**BV commands:**
```bash
bv --robot-triage     # Priority ranking
bv --blocked          # Find blockers
bv --progress         # Progress dashboard
bv --refresh          # Adaptive re-planning
```

**Git commands:**
```bash
git status --porcelain              # Check clean state
git branch --show-current           # Check current branch
git log --oneline -10               # Recent commits
```

### File Structure

```
.claude/
├── commands/
│   └── maf-bdd.md                  # Slash command to invoke
├── skills/
│   └── maf-bdd-orchestrator/
│       ├── SKILL.md                # Main skill definition
│       ├── prompts/
│       │   ├── implementer.md      # Implementer prompt template
│       │   ├── reviewer.md         # Reviewer prompt template
│       │   └── coordinator.md      # Coordinator prompt template
│       └── lib/
│           ├── bv.py              # BV integration
│           ├── deps.py            # Dependency analysis
│           ├── escalation.py      # Escalation context
│           ├── state.py           # State management
│           ├── preflight.py       # Pre-flight checks
│           ├── spawner.py         # Agent lifecycle
│           └── coordinator.py     # Main coordinator
```

### Environment Variables

```bash
# Optional: Override defaults
MAF_BDD_MAX_AGENTS=3               # Max concurrent agents (default: 3)
MAF_BDD_MAX_ATTEMPTS=3             # Max retry attempts (default: 3)
MAF_BDD_TIMEOUT=300                # Bead timeout in seconds (default: 300)
MAF_BDD_VERBOSE=true               # Enable verbose logging (default: false)
```

### Exit Codes

```bash
0  # Success: All ready beads executed
1  # Failure: Some beads failed (check escalated beads)
2  # Error: System error (check logs)
```

### Related Documentation

- [MAF Franchisee Guide](/root/projects/maf-github/docs/FRANCHISEE_GUIDE.md) - MAF setup and architecture
- [BDD Skill Documentation](/root/projects/maf-github/.claude/skills/beads-driven-development/SKILL.md) - BDD workflow details
- [MAF Preflight System](/root/projects/maf-github/lib/maf/PREFLIGHT_SYSTEM_GUIDE.md) - Pre-flight validation
- [Vendor Architecture](/root/projects/maf-github/docs/VENDOR_ARCHITECTURE.md) - MAF architecture overview

---

## Getting Help

**Common issues:**
- Check [Troubleshooting](#troubleshooting) section first
- Review [Best Practices](#best-practices) for tips
- See [Reference](#reference) for command details

**Still stuck?**
1. Check bead descriptions are clear
2. Verify dependencies are correct
3. Ensure pre-flight checks pass
4. Review escalation context for failed beads
5. Consider breaking complex beads into smaller ones

**Feature requests or bugs:**
Document the issue and context for improvement.

---

**Version:** 1.0
**Last Updated:** 2026-01-26
**Based on:** MAF-BDD Lightweight Orchestrator Design
