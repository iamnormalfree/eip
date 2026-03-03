# MAF Troubleshooting Guide

**Version:** 1.0
**Last Updated:** 2026-01-08
**Purpose:** Common issues and solutions for MAF (Multi-Agent Framework)

---

## Table of Contents

1. [Agent Spawn Failures](#agent-spawn-failures)
2. [Subtree Issues](#subtree-issues)
3. [Health Check Failures](#health-check-failures)
4. [Configuration Problems](#configuration-problems)
5. [Session Name Conflicts](#session-name-conflicts)
6. [Role Mapping Issues](#role-mapping-issues)
7. [Performance Issues](#performance-issues)
8. [Network Problems](#network-problems)

---

## Agent Spawn Failures

### Symptom: "tmux session already exists"

**Error Message:**
```
❌ ERROR: tmux session 'maf-session' already exists!
```

**Cause:** Session name conflict - previous session wasn't properly closed

**Solutions:**

**Option 1: Kill existing session**
```bash
tmux kill-session -t maf-session
# Then retry spawning
```

**Option 2: Attach to existing session**
```bash
tmux attach -t maf-session
```

**Option 3: Use unique session name**
```bash
export SESSION_NAME="maf-$(whoami)-$(date +%s)"
bash maf/scripts/maf/spawn-agents.sh
```

**Prevention:**
- Always use `--cleanup` flag when available
- Set unique session names per project
- Use `check-subtree-health.sh` before spawning

---

### Symptom: "Agent not found in topology"

**Error Message:**
```
ERROR: Agent 'SomeAgent' not found in agent-topology.json
```

**Cause:** Agent name doesn't exist in configuration

**Solutions:**

**1. Check available agents:**
```bash
jq '.panes[].agent_name' .maf/config/agent-topology.json
```

**2. Verify pane index:**
```bash
jq '.panes[] | select(.index == 0)' .maf/config/agent-topology.json
```

**3. Use role-based spawning:**
```bash
source maf/scripts/maf/lib/role-based-spawn.sh
AGENT_NAME=$(spawn_agent_by_role "supervisor")
```

**4. Add missing agent to topology:**
```json
{
  "index": 4,
  "role": "implementor-3",
  "agent_name": "NewAgent",
  "agent_id": 8,
  "aliases": ["imp3", "4"]
}
```

---

### Symptom: "Agent startup dependency chain broken"

**Error Message:**
```
ERROR: Failed to start agent: dependency not ready
```

**Cause:** Agent depends on another agent that hasn't started

**Solutions:**

**1. Check dependency order in topology:**
```bash
jq '.panes | sort_by(.index)' .maf/config/agent-topology.json
```

**2. Verify agent-startup.sh exists:**
```bash
ls -la .maf/agents/agent-startup.sh
# If missing, check scripts/maf/agent-startup.sh
```

**3. Manual sequential startup:**
```bash
# Start supervisor first
bash maf/scripts/maf/spawn-agents.sh --pane 0
# Then others
bash maf/scripts/maf/spawn-agents.sh --pane 1
```

---

### Symptom: "Prompt file not found"

**Error Message:**
```
ERROR: Prompt file not found: .maf/agents/agent-prompt.md
```

**Cause:** Agent prompt file missing or misconfigured

**Solutions:**

**1. Check available prompts:**
```bash
ls -la .maf/agents/*.md
```

**2. Use template prompt:**
```bash
cp templates/prompts/supervisor-prompt.md.example .maf/agents/supervisor-prompt.md
```

**3. Verify agent name mapping:**
```bash
# In .maf/agents/start-agent.sh
grep -A 5 "case.*agent_name"
```

---

## Subtree Issues

### Symptom: "Dirty subtree state"

**Error Message:**
```
❌ Subtree: Dirty
Uncommitted changes in maf/
```

**Cause:** Files in `maf/` directory have been modified locally

**Diagnosis:**
```bash
# Check what changed
git diff --name-only | grep "^maf/"

# Show diff
git diff maf/
```

**Solutions:**

**Option 1: If changes are accidental**
```bash
# Discard changes
git checkout maf/
```

**Option 2: If changes need to be upstreamed**
```bash
# DON'T commit directly to maf/
# Instead:
# 1. Copy changes to a temporary location
git diff maf/ > /tmp/maf-changes.patch

# 2. Contribute to HQ repo
#    https://github.com/iamnormalfree/maf

# 3. Pull from HQ after merge
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

**Option 3: If intentional project-specific customization**
```bash
# Move customization out of maf/ subtree
mv maf/scripts/maf/custom-script.sh scripts/maf/

# Then update imports/references accordingly
```

**Prevention:**
- Never modify files in `maf/` directory directly
- Use `.maf/config/` for project-specific configuration
- Contribute enhancements upstream to HQ

---

### Symptom: "Subtree pull fails with conflict"

**Error Message:**
```
CONFLICT (content): Merge conflict in maf/some-file.sh
```

**Cause:** Local changes conflict with HQ changes

**Solutions:**

**1. Abort and clean up**
```bash
git merge --abort
git clean -fd
```

**2. Stash local maf/ changes**
```bash
# Stash ONLY maf/ changes
git stash push -m "maf local changes" -- maf/

# Retry pull
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Apply manually if needed
```

**3. Force reset (last resort)**
```bash
git reset --hard origin/main
# WARNING: Loses all local changes
```

---

### Symptom: "CI guard blocks subtree PR"

**Error Message:**
```
❌ CI ERROR: Direct edits to maf/ subtree detected
Use 'maf-upgrade' label to allow
```

**Cause:** Pull request modifies `maf/` subtree without proper label

**Solutions:**

**Option 1: Add the label (if this is an intentional upgrade)**
```bash
gh pr edit <PR-number> --add-label "maf-upgrade"
```

**Option 2: Revert subtree changes (if accidental)**
```bash
git checkout origin/main -- maf/
git commit --amend --no-edit
```

**Option 3: Split changes (if both subtree and project changes)**
```bash
# Create separate PRs
git checkout -b maf/upgrade
git checkout -b project/changes
```

---

## Health Check Failures

### Symptom: "Health check shows errors"

**Error Message:**
```
❌ Health check failed
```

**Diagnosis:**
```bash
# Run health check with verbose output
bash maf/scripts/maf/status/check-subtree-health.sh --verbose

# Check each component
bash maf/scripts/maf/status/check-subtree-health.sh --check=subtree
bash maf/scripts/maf/status/check-subtree-health.sh --check=agents
bash maf/scripts/maf/status/check-subtree-health.sh --check=config
```

**Common Issues:**

**1. Subtree dirty** → See [Subtree Issues](#subtree-issues)

**2. Config missing**
```bash
# Verify config exists
ls -la .maf/config/agent-topology.json

# Recreate from template if needed
cp templates/agent-topology.json.example .maf/config/agent-topology.json
```

**3. Agents not running**
```bash
# Check tmux sessions
tmux list-sessions

# Restart agents
bash maf/scripts/maf/rebuild-maf-cli-agents.sh
```

---

### Symptom: "check-subtree-health.sh not found"

**Cause:** Health check script missing from subtree

**Solutions:**

**1. Check subtree structure**
```bash
ls -la maf/scripts/maf/status/
```

**2. Pull latest from HQ**
```bash
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

**3. Use alternative check**
```bash
# Verify subtree is clean
git diff --name-only | grep "^maf/" || echo "✅ Subtree clean"
```

---

## Configuration Problems

### Symptom: "role_mappings not found"

**Error Message:**
```
WARNING: Role 'supervisor' not found in config
```

**Cause:** Config lacks `role_mappings` field

**Solutions:**

**1. Check existing config**
```bash
jq '.role_mappings' .maf/config/agent-topology.json
```

**2. Add role_mappings to config**
```json
{
  "role_mappings": {
    "supervisor": "GreenMountain",
    "reviewer": "BlackDog",
    "implementor-1": "OrangePond",
    "implementor-2": "FuchsiaCreek"
  }
}
```

**3. Use fallback (will use defaults)**
```bash
source maf/scripts/maf/lib/role-based-spawn.sh
AGENT_NAME=$(spawn_agent_by_role "supervisor")
# Falls back to "GreenMountain"
```

---

### Symptom: "PROJECT_ROOT not detected correctly"

**Error Message:**
```
ERROR: Could not detect project root
```

**Cause:** Script can't determine if using subtree or direct layout

**Diagnosis:**
```bash
# Check current directory structure
pwd
ls -la

# Check for subtree markers
ls -d maf/ 2>/dev/null && echo "Subtree layout" || echo "Direct layout"
```

**Solutions:**

**1. Set PROJECT_ROOT explicitly**
```bash
export PROJECT_ROOT="/path/to/your/project"
```

**2. Check directory structure**
```bash
# Should be one of:
# /project/scripts/maf/     (direct layout)
# /project/maf/scripts/maf/ (subtree layout)
```

**3. Verify package.json exists**
```bash
ls package.json
# PROJECT_ROOT detection requires package.json at root
```

---

### Symptom: "Schema validation failed"

**Error Message:**
```
ERROR: Config schema validation failed
```

**Cause:** agent-topology.json doesn't match expected schema

**Diagnosis:**
```bash
# Validate against schema
jq -f .maf/config/agent-config-schema.json .maf/config/agent-topology.json
```

**Solutions:**

**1. Check required fields**
```bash
jq '.version, .session_name, .panes' .maf/config/agent-topology.json
```

**2. Fix JSON syntax**
```bash
# Validate JSON
jq '.' .maf/config/agent-topology.json > /dev/null
```

**3. Use example template**
```bash
cp templates/agent-topology.json.example .maf/config/agent-topology.json
# Then customize
```

---

## Session Name Conflicts

### Symptom: Multiple projects using same session name

**Error:** Agents from different projects interfering with each other

**Diagnosis:**
```bash
# Check all MAF sessions
tmux list-sessions | grep maf
```

**Solutions:**

**1. Use project-specific session names**
```json
// In .maf/config/agent-topology.json
{
  "session_name": "maf-$(basename $(pwd))"
}
```

**2. Set via environment**
```bash
export SESSION_NAME="maf-$(whoami)-$(basename $(pwd))"
```

**3. Validate before spawning**
```bash
# The spawn script will check automatically
# Or manually:
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "ERROR: Session exists"
    exit 1
fi
```

---

## Role Mapping Issues

### Symptom: "Agent not spawning for role"

**Diagnosis:**
```bash
# Test role lookup
source maf/scripts/maf/lib/role-based-spawn.sh
spawn_agent_by_role "supervisor"

# Show current mappings
show_role_mappings
```

**Solutions:**

**1. Check role_mappings in config**
```bash
jq '.role_mappings' .maf/config/agent-topology.json
```

**2. Verify role name is correct**
```bash
# Must be one of: supervisor, reviewer, implementor-1, implementor-2
# Aliases: sup, rev, imp1, imp2, 0, 1, 2, 3
```

**3. Check pane mapping**
```bash
jq '.panes[] | select(.role == "supervisor")' .maf/config/agent-topology.json
```

---

### Symptom: "Wrong agent spawned for role"

**Cause:** role_mappings points to wrong agent

**Solutions:**

**1. Check current mapping**
```bash
jq '.role_mappings.supervisor' .maf/config/agent-topology.json
```

**2. Update mapping**
```bash
jq '.role_mappings.supervisor = "CorrectAgent"' .maf/config/agent-topology.json > /tmp/config.json
mv /tmp/config.json .maf/config/agent-topology.json
```

**3. Use environment override**
```bash
export AGENT_SUPERVISOR="CorrectAgent"
```

---

## Performance Issues

### Symptom: "Agents spawning slowly"

**Diagnosis:**
```bash
# Time the spawn process
time bash maf/scripts/maf/rebuild-maf-cli-agents.sh
```

**Solutions:**

**1. Check system resources**
```bash
# CPU and memory
htop

# Disk I/O
iostat -x 1
```

**2. Reduce agent count**
```json
// In agent-topology.json
{
  "panes": [
    // Use fewer agents during development
  ]
}
```

**3. Use background spawning**
```bash
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --background &
```

---

### Symptom: "High memory usage"

**Diagnosis:**
```bash
# Check MAF process memory
ps aux | grep -i claude | awk '{print $6, $11}'
```

**Solutions:**

**1. Restart agents periodically**
```bash
# Daily restart script
bash maf/scripts/maf/rebuild-maf-cli-agents.sh
```

**2. Use memory limits**
```bash
# In agent configuration
export AGENT_MEMORY_LIMIT=512  # MB
```

**3. Clear agent state**
```bash
# Clear Memlayer state
rm -rf .maf/state/
```

---

## Network Problems

### Symptom: "Can't pull from HQ"

**Error Message:**
```
fatal: 'https://github.com/iamnormalfree/maf' does not appear to be a git repository
```

**Solutions:**

**1. Check network connectivity**
```bash
ping github.com
curl -I https://github.com/iamnormalfree/maf
```

**2. Check git remote**
```bash
git remote -v
# Should show maf subtree
```

**3. Verify subtree is added**
```bash
git config --file=.gittrees -l
```

---

### Symptom: "Subtree pull timeout"

**Diagnosis:**
```bash
# Test connection
timeout 10 git ls-remote https://github.com/iamnormalfree/maf main
```

**Solutions:**

**1. Increase git timeout**
```bash
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
```

**2. Use shallow pull**
```bash
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash --depth=1
```

**3. Retry during off-peak hours
```bash
# Network may be congested
```

---

## Getting Additional Help

### Collect Diagnostic Information

Before requesting help, gather this information:

```bash
# Create diagnostic bundle
DIAG_DIR="maf-diag-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DIAG_DIR"

# System info
uname -a > "$DIAG_DIR/system.txt"
df -h > "$DIAG_DIR/disk.txt"
free -h > "$DIAG_DIR/memory.txt"

# Git info
git status > "$DIAG_DIR/git-status.txt"
git log --oneline -5 > "$DIAG_DIR/git-log.txt"
git diff --stat > "$DIAG_DIR/git-diff.txt"

# MAF info
bash maf/scripts/maf/status/check-subtree-health.sh > "$DIAG_DIR/health-check.txt" 2>&1
jq '.' .maf/config/agent-topology.json > "$DIAG_DIR/topology.json"
tmux list-sessions > "$DIAG_DIR/tmux-sessions.txt" 2>&1

# Logs
tail -1000 .maf/logs/*.log > "$DIAG_DIR/logs.txt" 2>&1

# Create archive
tar czf "$DIAG_DIR.tar.gz" "$DIAG_DIR"
echo "Diagnostic bundle: $DIAG_DIR.tar.gz"
```

### Report Issue

1. **Search existing issues**
   - GitHub: https://github.com/iamnormalfree/maf/issues
   - Check if your problem is already reported

2. **Create new issue**
   - Use template if available
   - Attach diagnostic bundle
   - Include error messages and steps to reproduce

3. **Contact maintainers**
   - Slack: #maf-support channel
   - Email: maf-support@example.com

---

## Appendix: Quick Reference Commands

### Subtree Operations
```bash
# Check subtree status
git diff --name-only | grep "^maf/"

# Pull latest from HQ
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Add subtree (first time only)
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

### Health Checks
```bash
# Full health check
bash maf/scripts/maf/status/check-subtree-health.sh

# Quick subtree check
git diff --quiet maf/ && echo "✅ Clean" || echo "❌ Dirty"
```

### Agent Management
```bash
# Rebuild all agents
bash maf/scripts/maf/rebuild-maf-cli-agents.sh

# Kill all MAF sessions
tmux kill-server  # WARNING: kills all tmux sessions

# List running agents
tmux list-sessions | grep maf
```

### Config Debugging
```bash
# Validate config JSON
jq '.' .maf/config/agent-topology.json

# Show role mappings
jq '.role_mappings' .maf/config/agent-topology.json

# Show pane configuration
jq '.panes[]' .maf/config/agent-topology.json
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-08
**Maintained By:** MAF Team
