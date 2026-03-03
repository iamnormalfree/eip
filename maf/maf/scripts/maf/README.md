# MAF Scripts Catalog

**Complete catalog of all MAF scripts with descriptions and usage.**

---

## 📋 Quick Reference by Category

| Category | Scripts | Purpose |
|----------|---------|---------|
| **Coordination** | orchestrator.sh, coordinate-agents.sh | Agent coordination & orchestration |
| **Session Management** | rebuild-maf-cli-agents.sh, spawn-agents.sh | tmux session management |
| **Communication** | agent-communication-real.sh, agent-mail-fetch.sh | Inter-agent communication |
| **Context** | context-manager-v2.sh, context-manager-v3.sh | Claude context management |
| **Memory** | agent-memory.sh | Agent memory via Memlayer |
| **Verification** | verify-ac.sh | Acceptance criteria verification |
| **Health** | doctor.sh, health-check.sh, agent-monitor.sh | System health checks |

---

## 🔧 Coordination & Workflow

### `orchestrator.sh`
**Purpose:** Central orchestration for autonomous agents - combines all coordination tools

**What it does:**
- Smart bead assignment with agent availability checking
- Stuck agent detection and auto-recovery
- Health monitoring
- Integrates with context-manager-v2.sh for agent lifecycle

**When to use:**
- Running autonomous agents continuously
- Need complete workflow orchestration

**Usage:**
```bash
bash maf/scripts/maf/orchestrator.sh --loop
```

**Key features:**
- Smart routing (only assigns to available agents)
- Cooldown tracking (prevents reassigning same bead)
- Component-based (enable/disable specific features)
- Environment variable configuration

---

### `coordinate-agents.sh`
**Purpose:** Smart bead assignment with availability checking (enhanced with NextNest patterns)

**What it does:**
- Checks agent availability before assigning (is_agent_busy function)
- Tracks cooldown to prevent reassigning same bead too quickly
- Configurable modes: "smart" (default) or "all" (original spray-and-pray)
- Supports skill routing (SKILL_ROUTING_MODE env var)

**When to use:**
- Single-shot bead assignment
- Integration into custom workflows

**Usage:**
```bash
# Smart routing (default)
bash maf/scripts/maf/coordinate-agents.sh

# Assign to all agents (original mode)
MAF_ASSIGN_MODE=all bash maf/scripts/maf/coordinate-agents.sh

# With skill routing
SKILL_ROUTING_MODE=sdd-only bash maf/scripts/maf/coordinate-agents.sh --loop
```

**Key features:**
- Smart routing based on actual agent activity
- Cooldown tracking (default: 5 minutes)
- Configurable session/window names
- Subtree auto-detection for PROJECT_ROOT

---

### `nudge-agents.sh`
**Purpose:** Send commands to idle agents

**When to use:**
- Agents are stuck or idle
- Need to prompt agents to continue work

**Usage:**
```bash
bash scripts/maf/nudge-agents.sh
```

---

## 🖥️ Session Management

### `rebuild-maf-cli-agents.sh`
**Purpose:** Rebuild tmux session with correct 4-pane layout

**What it does:**
- Kills existing session (with --force)
- Creates new session with proper pane layout
- Starts agents with correct roles

**When to use:**
- Session corrupted or missing
- Need to restart agents

**Usage:**
```bash
bash scripts/maf/rebuild-maf-cli-agents.sh --force
```

**Layout:**
```
┌────────┬────────┬────────┐
│ 0.top  │   2    │   3    │  Supervisor | Imp-1 | Imp-2
│        │        │        │
│0.bottom│        │        │  Reviewer
└────────┴────────┴────────┘
```

---

### `spawn-agents.sh`
**Purpose:** Spawn agents based on topology configuration

**When to use:**
- Starting agents with custom configuration
- Need role-based agent spawning

**Usage:**
```bash
bash scripts/maf/spawn-agents.sh
```

---

## 💬 Communication

### `agent-communication-real.sh`
**Purpose:** Cross-agent communication via Agent Mail

**What it does:**
- Send messages between agents
- Thread-based conversations
- Importance levels

**When to use:**
- Agents need to coordinate
- Cross-agent notifications

**Usage:**
```bash
bash scripts/maf/agent-communication-real.sh
```

---

### `agent-mail-fetch.sh`
**Purpose:** Fetch Agent Mail messages for an agent

**When to use:**
- Checking for inter-agent messages
- Reviewing communication history

**Usage:**
```bash
bash scripts/maf/agent-mail-fetch.sh <agent-name>
```

---

## 🧠 Context & Memory

### `context-manager-v3.sh`
**Purpose:** Manage Claude context for agents

**What it does:**
- Inject context into agent sessions
- Manage context size
- File reservations

**When to use:**
- Agents need context management
- Large codebases require context injection

**Usage:**
```bash
bash scripts/maf/context-manager-v3.sh
```

---

### `agent-memory.sh`
**Purpose:** Agent memory via Memlayer

**What it does:**
- Store and retrieve agent memories
- Persistent memory across sessions

**When to use:**
- Agents need to remember information
- Long-running autonomous sessions

**Usage:**
```bash
bash scripts/maf/agent-memory.sh store
bash scripts/maf/agent-memory.sh restore
```

---

## ✅ Verification

### `verify-ac.sh`
**Purpose:** Verify acceptance criteria for a bead

**What it does:**
- Checks if acceptance criteria are met
- Validates bead completion
- Returns exit code for pass/fail

**When to use:**
- Before closing a bead
- Validating work is complete

**Usage:**
```bash
bash scripts/maf/verify-ac.sh <bead-id>
```

**Exit codes:**
- 0: All criteria met
- 1: One or more criteria failed
- 2: Bead not found or no AC

---

## 🏥 Health & Diagnostics

### `doctor.sh`
**Purpose:** Diagnose and fix common MAF issues

**What it does:**
- Checks MAF installation
- Validates configuration
- Fixes common problems

**When to use:**
- Troubleshooting MAF issues
- After subtree updates

**Usage:**
```bash
bash scripts/maf/doctor.sh
```

---

### `health-check.sh`
**Purpose:** Check health of MAF components

**When to use:**
- Verifying MAF is working
- Checking agent status

**Usage:**
```bash
bash scripts/maf/health-check.sh
```

---

## 🔍 Utilities

### `prompt-agent.sh`
**Purpose:** Send command to specific agent pane

**When to use:**
- Need to command specific agent
- Manual agent interaction

**Usage:**
```bash
bash scripts/maf/prompt-agent.sh <pane-number> "<command>"
```

---

### `clear-stuck-prompts.sh`
**Purpose:** Clear stuck prompts from agent panes

**When to use:**
- Agent has pending input
- Agent is waiting for response

**Usage:**
```bash
bash scripts/maf/clear-stuck-prompts.sh
```

---

## 📁 Directory Patterns

All scripts follow the **subtree auto-detection pattern**:

```bash
# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    # Subtree layout
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    # Direct layout
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

**Use this pattern** in any custom scripts to ensure project-agnostic behavior.

---

## 🎯 Choosing the Right Script

| Goal | Use This Script |
|------|----------------|
| Start autonomous agents | `coordinate-agents.sh` |
| Fix broken session | `rebuild-maf-cli-agents.sh --force` |
| Check agent messages | `agent-mail-fetch.sh <agent>` |
| Verify bead completion | `verify-ac.sh <bead-id>` |
| Troubleshoot issues | `doctor.sh` |
| Send command to agent | `prompt-agent.sh <pane> "<cmd>"` |

---

## 📖 Additional Documentation

- **Quick Start:** `../README.md` (start here before customizing)
- **Decision Guide:** `../START_HERE.md` (what to use vs build)
- **For AI Agents:** `../LLM_README.md` (explicit LLM guidance)
- **Agent Config:** `../docs/agents.md` (agent configuration guide)
