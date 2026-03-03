# Agent Configuration Guide

**Guide for configuring MAF agents in your project.**

---

## 📋 Overview

MAF uses a role-based agent system where:
- **Roles** are abstract (supervisor, reviewer, implementor)
- **Agents** are concrete implementations (RateRidge, AuditBay, LedgerLeap)
- **Mappings** connect roles to agents via configuration

This allows projects to use any agent names while maintaining consistent behavior.

---

## 🎯 Core Concepts

### Role vs Agent

| Role | Purpose | Example Agent Name |
|------|---------|-------------------|
| **supervisor** | Coordinates work, assigns beads | RateRidge, OrangeDog, GreenMountain |
| **reviewer** | Reviews code, validates AC | AuditBay, PurpleBear, BlackDog |
| **implementor-1** | Implements tasks (fluid) | LedgerLeap, RedPond, OrangePond |
| **implementor-2** | Implements tasks (fluid) | PrimePortal, PinkStone, FuchsiaCreek |

**Key insight:** MAF scripts reference **roles**, not agent names. This makes scripts portable across projects.

---

## 📁 Configuration Files

### 1. Agent Topology (Required)

**File:** `.maf/config/agent-topology.json`

**Purpose:** Maps roles to agents with names and pane assignments.

**Schema:**
```json
{
  "version": "2.0.0",
  "schema": "role-based-mapping",
  "agents": [
    {
      "role": "supervisor",
      "name": "RateRidge",
      "pane": 0,
      "type": "claude",
      "description": "Coordinates autonomous work"
    },
    {
      "role": "reviewer",
      "name": "AuditBay",
      "pane": 1,
      "type": "claude",
      "description": "Reviews code and validates AC"
    },
    {
      "role": "implementor-1",
      "name": "LedgerLeap",
      "pane": 2,
      "type": "claude",
      "description": "Implementation work (fluid assignment)"
    },
    {
      "role": "implementor-2",
      "name": "PrimePortal",
      "pane": 3,
      "type": "claude",
      "description": "Implementation work (fluid assignment)"
    }
  ]
}
```

**Key fields:**
- `role`: Abstract role (supervisor, reviewer, implementor-1, implementor-2)
- `name`: Agent name (your choice, project-specific)
- `pane`: tmux pane number (0-3 for 4-pane layout)
- `type`: Agent type (claude, codex, etc.)
- `description`: What this agent does

---

### 2. Agent Prompts (Optional but Recommended)

**Directory:** `.maf/agents/`

**Files:** `{agent-name}-prompt.md`

**Example:** `.maf/agents/RateRidge-prompt.md`

```markdown
# RateRidge - Supervisor Agent

You are RateRidge, the supervisor agent for this project.

## Your Role
- Coordinate autonomous agent work
- Assign beads to implementers
- Review completion notifications
- Close beads when properly completed

## Context
- Project: [Project name]
- Agent Mail: http://127.0.0.1:8765
- Beads directory: .beads/

## Commands
- `bd ready` - List ready beads
- `bd start <id>` - Start a bead
- `bd close <id>` - Close a bead
```

---

## 🔧 Configuration Patterns

### Pattern 1: Subtree-Aware Paths

**Don't hardcode project paths:**

```bash
# ❌ Wrong
PROJECT_ROOT="/root/projects/roundtable"

# ✅ Right
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

### Pattern 2: Role-Based References

**Reference roles, not agent names:**

```bash
# ❌ Wrong (hardcodes agent names)
tmux send-keys -t "$SESSION_NAME:agents.0" "RateRidge command"

# ✅ Right (uses role)
SUPERVISOR_PANE=$(jq -r '.agents[] | select(.role=="supervisor") | .pane' "$TOPOLOGY_FILE")
tmux send-keys -t "$SESSION_NAME:agents.$SUPERVISOR_PANE" "command"
```

### Pattern 3: Environment Variable Overrides

**Allow environment variable overrides:**

```bash
# Allow override via environment
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
SESSION_NAME="${MAF_TMUX_SESSION:-maf-cli}"
WINDOW_NAME="${MAF_AGENT_WINDOW:-agents}"
```

---

## 🚀 Quick Setup

### Step 1: Create Agent Topology

```bash
mkdir -p .maf/config
cat > .maf/config/agent-topology.json << 'EOF'
{
  "version": "2.0.0",
  "schema": "role-based-mapping",
  "agents": [
    {
      "role": "supervisor",
      "name": "SupervisorBot",
      "pane": 0,
      "type": "claude",
      "description": "Coordinates work"
    },
    {
      "role": "reviewer",
      "name": "ReviewerBot",
      "pane": 1,
      "type": "claude",
      "description": "Reviews code"
    },
    {
      "role": "implementor-1",
      "name": "BackendBot",
      "pane": 2,
      "type": "claude",
      "description": "Backend tasks"
    },
    {
      "role": "implementor-2",
      "name": "FrontendBot",
      "pane": 3,
      "type": "claude",
      "description": "Frontend tasks"
    }
  ]
}
EOF
```

### Step 2: Verify Configuration

```bash
# Verify topology file is valid
jq empty .maf/config/agent-topology.json

# Check agent assignments
jq '.agents[] | "\(.role) → \(.name) (pane \(.pane))"' .maf/config/agent-topology.json
```

### Step 3: Rebuild Agent Session

```bash
bash scripts/maf/rebuild-maf-cli-agents.sh --force
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Hardcoded Project Paths

**Problem:** Scripts only work in `/root/projects/roundtable`

**Solution:** Use subtree auto-detection pattern

**See:** `scripts/maf/rebuild-maf-cli-agents.sh` (lines 19-27)

---

### Pitfall 2: Hardcoded Agent Names

**Problem:** Scripts reference "RateRidge" directly

**Solution:** Reference roles, lookup agent name from topology

**Example:**
```bash
# Get supervisor agent name
SUPERVISOR_NAME=$(jq -r '.agents[] | select(.role=="supervisor") | .name' "$TOPOLOGY_FILE")
```

---

### Pitfall 3: Pane Number Assumptions

**Problem:** Assumes supervisor is always pane 0

**Solution:** Look up pane from topology

**Example:**
```bash
# Get supervisor pane
SUPERVISOR_PANE=$(jq -r '.agents[] | select(.role=="supervisor") | .pane' "$TOPOLOGY_FILE")
```

---

### Pitfall 4: Missing Topology File

**Problem:** Scripts fail when `.maf/config/agent-topology.json` doesn't exist

**Solution:** Add validation

```bash
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
    echo "❌ ERROR: Agent topology file not found: $TOPOLOGY_FILE"
    echo "Create it with: bash scripts/maf/init-agent-topology.sh"
    exit 1
fi
```

---

## 📚 Additional Documentation

- **Extension Patterns:** `EXTENSION_PATTERNS.md` - How to customize MAF correctly (call vs copy)
- **Agent Spawning:** `AGENT_SPAWNING.md` - How agent spawning works
- **Setup Wizard:** `bash scripts/setup/setup-maf.sh` - Interactive setup
- **Scripts Catalog:** `scripts/maf/README.md` - Available MAF scripts

---

## 🔍 Troubleshooting

### Issue: Agents not starting

**Check:**
```bash
# Verify topology file exists
ls -la .maf/config/agent-topology.json

# Verify it's valid JSON
jq empty .maf/config/agent-topology.json

# Check pane assignments
jq '.agents' .maf/config/agent-topology.json
```

### Issue: Wrong agent in pane

**Check:** Pane numbers in topology match tmux layout

**Fix:** Update pane numbers in `.maf/config/agent-topology.json`

### Issue: Scripts can't find agents

**Check:** Scripts reference roles, not hardcoded agent names

**Fix:** Update script to use role-based lookups

### Issue: Agent stuck or workflow not working

**Check:**
```bash
# Run MAF diagnostics
/maf diagnose

# Discover what MAF provides
/maf
```

**Docs:**
- `maf/skills/maf-diagnose.md` - Self-diagnostic troubleshooting
- `maf/skills/maf-operations.md` - Discovery and troubleshooting guidance
- `maf/EXTENSION_PATTERNS.md` - Extension patterns and customization guide

### Issue: Want to customize MAF behavior

**Check:** `maf/EXTENSION_PATTERNS.md` for correct customization patterns

---

## 💡 Best Practices

1. **Always use role-based references** in custom scripts
2. **Never hardcode project paths** - use subtree auto-detection
3. **Allow environment variable overrides** for all paths
4. **Validate topology file** before using it
5. **Document agent roles** in project README
6. **Keep agent names descriptive** of their function
7. **Test in different project locations** to verify portability
