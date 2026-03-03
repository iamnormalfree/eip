# 3-Agent BDD Workflow User Guide

## Overview

The 3-Agent BDD (Behavior-Driven Development) workflow is an autonomous multi-agent system that enforces Test-Driven Development, two-stage code review, and intelligent escalation while coordinating via Agent Mail.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TMUX Session (maf-bdd)                  │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────┐ │
│  │ Supervisor│  │ Reviewer  │  │    Implementor          │ │
│  │  Pane 0   │  │  Pane 1   │  │      Pane 2            │ │
│  │ OrangeDog │  │ PurpleBear│  │      RedPond            │ │
│  │           │  │           │  │                         │ │
│  │ - Workflow│  │ - Polls   │  │ - Polls for feedback    │ │
│  │ - Loop    │  │   mail    │  │ - Implements with TDD   │ │
│  │ - BV      │  │ - Reviews │  │ - Sends completion mail │ │
│  │           │  │ - Stage 1 │  │                         │ │
│  │           │  │ - Stage 2 │  │                         │ │
│  └───────────┘  └───────────┘  └─────────────────────────┘ │
│         │              │                    │               │
│         └──────────────┴────────────────────┘               │
│                        │                                     │
│                 ┌──────┴──────┐                             │
│                 │ Agent Mail  │                             │
│                 │    MCP      │                             │
│                 └─────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **TDD Enforcement**: RED-GREEN-REFACTOR workflow with automated verification
- **Two-Stage Review**: Spec compliance → Code quality
- **Escalation System**: Progressive guidance after failures, bead reopening after 3 attempts
- **Active Mail Polling**: Autonomous stage transitions every 10 seconds
- **BV Integration**: Intelligent bead prioritization (high/medium/low)
- **Memory Efficient**: 25% less than 4-agent model

## Prerequisites

### Required Tools

- **tmux** (v2.0+): Terminal multiplexer for persistent sessions
- **jq** (v1.5+): JSON processor for configuration parsing
- **bd** (beads): Bead management CLI
- **Python 3.8+**: For mail polling and verification modules
- **git**: Version control
- **curl**: For Agent Mail MCP communication

### Optional Tools

- **BV** (Bead Vision): Intelligent prioritization (recommended)

### Agent Mail MCP Server

The Agent Mail MCP server must be running for mail-based coordination:

```bash
# Start Agent Mail MCP server (if not running)
# The server typically runs on http://127.0.0.1:8765
```

## Quick Start

### 1. Setup (First Time)

```bash
# Copy topology template
cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json

# Edit if needed (custom mail names, polling interval, etc.)
vim .maf/config/agent-topology.json

# Run setup script
bash maf/scripts/maf/start-3agent-bdd.sh --setup
```

### 2. Start Workflow

```bash
# Start autonomous workflow
bash maf/scripts/maf/start-3agent-bdd.sh
```

### 3. Monitor Progress

```bash
# Attach to tmux session
tmux attach -t maf-bdd

# Or check status
bash maf/scripts/maf/bdd-status.sh
```

### 4. Stop Workflow

```bash
# Detach from tmux (keeps running): Press Ctrl+B, then D
# Stop entirely: tmux kill-session -t maf-bdd
```

## Configuration

### Topology File

Located at `.maf/config/agent-topology.json`:

```json
{
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "mail_name": "OrangeDog",
      "agent_id": 4
    },
    {
      "index": 1,
      "role": "reviewer",
      "mail_name": "PurpleBear",
      "agent_id": 7
    },
    {
      "index": 2,
      "role": "implementor",
      "mail_name": "RedPond",
      "agent_id": 5
    }
  ],
  "bdd_config": {
    "tdd_enforced": true,
    "two_stage_review": true,
    "escalation_max_attempts": 3,
    "mail_polling_interval_seconds": 10,
    "stage_timeout_minutes": 30
  }
}
```

### BDD Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `tdd_enforced` | `true` | Require TDD workflow verification |
| `two_stage_review` | `true` | Enable two-stage review (spec + quality) |
| `escalation_max_attempts` | `3` | Max attempts before bead reopening |
| `mail_polling_interval_seconds` | `10` | How often to poll for mail |
| `stage_timeout_minutes` | `30` | Timeout for stage completion |

## Workflow Explanation

### 1. Bead Assignment

The Supervisor assigns beads to the Implementor based on BV prioritization:

1. BV triage prioritizes beads (high → medium → low)
2. First available bead assigned to Implementor
3. Implementor receives TDD instructions

### 2. TDD Workflow (Implementor)

The Implementor follows strict TDD:

```
RED → Write failing test
GREEN → Write minimal code to pass
REFACTOR → Clean up while tests pass
```

**Verification Required:**
```bash
# Before requesting review, verify TDD
bash maf/scripts/maf/tdd-check.sh
```

**Common Violations:**
- Writing code before test
- Test passes immediately (test doesn't work)
- Testing implementation not behavior
- Multiple behaviors in one test

### 3. Two-Stage Review (Reviewer)

**Stage 1: Spec Compliance**
- Did we build the right thing?
- Requirements met?
- YAGNI violations?
- Edge cases handled?
- Receipt generated?

**Stage 2: Code Quality**
- Did we build it the right way?
- Tests adequate?
- Design patterns followed?
- Security issues?
- Error handling?
- Performance concerns?
- Clean code?

### 4. Escalation Process

If review fails:

1. **Attempt 1**: "Review error" - Fix the specific issue
2. **Attempt 2**: "Try different approach" - Consider alternative solutions
3. **Attempt 3**: "Consider alternative architecture" - Fundamental rethink
4. **After 3 failures**: Bead reopened for revision

### 5. Mail Polling

All agents poll Agent Mail every 10 seconds:

- **Implementor**: Waits for review feedback
- **Reviewer**: Polls for completion notifications
- **Supervisor**: Monitors workflow and handles escalations

**DO NOT manually check mail** - the poller handles everything.

## Commands Reference

### Workflow Commands

```bash
# Setup 3-agent BDD tmux session
bash maf/scripts/maf/start-3agent-bdd.sh --setup

# Start autonomous workflow
bash maf/scripts/maf/start-3agent-bdd.sh

# Check workflow status
bash maf/scripts/maf/bdd-status.sh

# Run single assignment cycle
bash maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --once

# Run audit only
bash maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --audit
```

### Verification Commands

```bash
# Verify TDD workflow
python3 maf/scripts/maf/lib/tdd_enforcer.py <bead_id>

# Run TDD self-check
bash maf/scripts/maf/tdd-check.sh

# Manual review
bash maf/scripts/maf/review-bead.sh <bead_id>
```

### Polling Commands

```bash
# Start mail polling (usually automatic)
bash maf/scripts/maf/poll-agent-mail.sh <role>

# Implementor poller callback
python3 maf/scripts/maf/lib/implementor_poller_callback.py <mail_name> <topology_file>

# Reviewer poller callback
python3 maf/scripts/maf/lib/reviewer_poller_callback.py <mail_name> <topology_file>
```

### BV Commands

```bash
# Run BV triage
python3 maf/scripts/maf/lib/bv_integration.py --triage

# Show progress
python3 maf/scripts/maf/lib/bv_integration.py --progress

# Prioritize beads
python3 maf/scripts/maf/lib/bv_integration.py --prioritize <bead_id1> <bead_id2>
```

### Escalation Commands

```bash
# Record failure (automatic)
python3 maf/scripts/maf/lib/escalation.py record <bead_id> "<failure>" --stage <stage>

# Get context
python3 maf/scripts/maf/lib/escalation.py context <bead_id>

# Get summary
python3 maf/scripts/maf/lib/escalation.py summary <bead_id>

# Reset (after fixing)
python3 maf/scripts/maf/lib/escalation.py reset <bead_id>
```

## Troubleshooting

### tmux Session Not Found

**Problem**: `tmux session 'maf-bdd' not found`

**Solution**:
```bash
# Run setup first
bash maf/scripts/maf/start-3agent-bdd.sh --setup
```

### Agent Mail Server Not Running

**Problem**: `Agent Mail: Not running (mail notifications unavailable)`

**Solution**: Start the Agent Mail MCP server:
```bash
# Check if server is running
curl http://127.0.0.1:8765/health

# If not running, start it (method varies by setup)
```

### TDD Verification Failed

**Problem**: `TDD workflow violations for bead-123`

**Solution**:
1. Review the specific violations
2. Fix the issues (don't skip TDD steps)
3. Re-verify: `bash maf/scripts/maf/tdd-check.sh`

### Review Rejected

**Problem**: Bead rejected at Stage 1 or Stage 2

**Solution**:
1. Read the specific feedback in the rejection mail
2. Fix the specific issues (not a complete rewrite)
3. Re-run tests
4. Commit fixes
5. Wait for next review cycle

### Escalation Triggered

**Problem**: Bead escalated after 3 failures

**Solution**:
1. The bead has been reopened for revision
2. Requirements may need clarification
3. Contact supervisor for guidance

### No Ready Beads

**Problem**: `No ready beads`

**Solution**:
- All beads may be closed (work complete!)
- Or no beads are ready (dependencies not met)
- Check: `bd list --status ready`

## FAQ

### Q: Can I run multiple workflows simultaneously?

A: Yes, but you must use different tmux sessions. Edit `session_name` in the topology file.

### Q: How do I customize the workflow?

A: Create `.maf/config/custom-workflow-hooks.sh` and implement the custom hooks:
- `CUSTOM_HOOK_BEFORE_ASSIGN`
- `CUSTOM_HOOK_AFTER_ASSIGN`
- `CUSTOM_HOOK_SELECT_SKILL`
- `CUSTOM_HOOK_ERROR_HANDLER`

### Q: Can I disable TDD enforcement?

A: Not recommended, but you can set `tdd_enforced: false` in the BDD config.

### Q: What happens if an agent gets stuck?

A: The workflow will detect pending input and alert the supervisor via Agent Mail.

### Q: How do I check mail manually?

A: You shouldn't - the poller handles everything. But if needed:
```bash
bash maf/scripts/maf/agent-mail-fetch.sh <mail_name>
```

### Q: Can I use this with the 4-agent workflow?

A: No, the 3-agent BDD workflow is a separate topology. Use one or the other.

## Best Practices

1. **Always follow TDD**: Never skip RED-GREEN-REFACTOR
2. **Read feedback carefully**: Each review contains specific guidance
3. **Commit frequently**: After each successful stage
4. **Don't bypass mail polling**: Let the autonomous workflow handle transitions
5. **Check status first**: Before starting work, check `bdd-status.sh`
6. **Monitor tmux**: Keep an eye on agent panes for issues

## Getting Help

- **Status**: `bash maf/scripts/maf/bdd-status.sh`
- **Logs**: Check individual agent panes in tmux
- **Audit**: `bash maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --audit`
- **Tests**: Run integration tests in `tests/workflow/`

## Architecture Details

See `docs/3-agent-bdd-architecture.md` for detailed architecture documentation.
