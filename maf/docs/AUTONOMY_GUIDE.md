# MAF Autonomy Guide

## Overview

MAF supports autonomous agent operation within clear governance boundaries.
This guide explains how autonomous operation works and how to monitor it.

## Autonomy Levels

See [MAF Constitution](maf-constitution.md) for complete autonomy level definitions.

- **Level 1**: Full Autopilot - Safe, single-file changes
- **Level 2**: Autopilot with Validation - Multi-file changes with validation
- **Level 3**: Human Approval Required - Architecture changes, breaking changes

## Monitoring Autonomous Agents

### Check Agent Status

```bash
# List all agents
mcp-agent-mail list-agents

# Check recent activity
mcp-agent-mail fetch --last 10
```

### Check Bead Progress

```bash
# See all beads
bead list

# See what agents are working on
bead list --status=in-progress

# See completed beads
bead list --status=complete --last 10
```

### Check Escalations

```bash
# Look for escalations in agent mail
mcp-agent-mail fetch | grep "ESCALATION"

# Check for critical escalations
mcp-agent-mail fetch | grep "CRITICAL"
```

## When to Intervene

### Immediate Intervention Required

- Critical escalations older than 15 minutes
- Agents stuck on same bead for > 1 hour
- Test failure rate > 20%
- Build completely broken

### Intervention Recommended

- Warning escalations older than 1 hour
- No progress for > 2 hours
- Agent asking for guidance
- Complex architectural decision needed

### Normal Operation

- Info-level escalations (document and continue)
- Agents making progress
- Tests passing
- Beads completing

## Emergency Procedures

### Stop All Autonomous Agents

```bash
# Kill tmux session
tmux kill-session -t <session-name>

# Or stop agent mail
mcp-agent-mail stop
```

### Emergency Reset

```bash
# Reset MAF configuration
bash maf/scripts/setup/setup-maf.sh --reset

# This stops agents, backs up config, and restarts wizard
```

## Best Practices

1. **Start Small**: Let agents work on Level 1 tasks first
2. **Monitor Escalations**: Check agent mail regularly
3. **Trust the Process**: Agents will escalate when uncertain
4. **Provide Feedback**: Update AGENTS.md based on lessons learned
5. **Review Regularly**: Check bead progress and agent activity weekly

## Troubleshooting

See [TROUBLESHOOTING.md](runbooks/TROUBLESHOOTING.md) for common issues.
