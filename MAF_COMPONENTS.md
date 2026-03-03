# MAF Components Checklist

Complete checklist of all MAF components and how to verify they're set up.

## ✅ Core Components

### 1. Response Awareness Framework
**Location**: `.claude/skills/`

**Included Skills**:
- ✅ `response-awareness` - Universal smart router
- ✅ `response-awareness-light` - Lightweight implementation
- ✅ `response-awareness-medium` - Multi-file features
- ✅ `response-awareness-heavy` - Complex single-domain features
- ✅ `response-awareness-full` - Multi-domain architecture changes
- ✅ `response-awareness-plan` - Planning-only blueprint
- ✅ `response-awareness-implement` - Execute approved plan

**Superpowers Skills**:
- ✅ `sp-brainstorming` - Design refinement before work
- ✅ `sp-writing-plans` - Create implementation plans
- ✅ `sp-test-driven-development` - TDD workflow
- ✅ `sp-systematic-debugging` - Bug fixing workflow
- ✅ `sp-verification-before-completion` - Pre-commit verification
- ✅ `sp-requesting-code-review` - Request reviews
- ✅ `sp-receiving-code-review` - Handle review feedback
- ✅ `sp-finishing-a-development-branch` - Branch completion
- ✅ `sp-using-git-worktrees` - Git worktree isolation
- ✅ `sp-using-superpowers` - Superpowers guide
- ✅ `sp-subagent-driven-development` - Agent coordination
- ✅ `sp-dispatching-parallel-agents` - Parallel execution
- ✅ `sp-executing-plans` - Execute written plans
- ✅ `sp-execute-plan` - Superpowers version
- ✅ `sp-debug` - Debugging workflow
- ✅ `sp-verify` - Verification workflow
- ✅ `sp-tdd` - TDD workflow
- ✅ `sp-brainstorm` - Brainstorming
- ✅ `sp-write-plan` - Write plan

**Slash Commands** (.claude/commands/):
- ✅ `/plan-to-beads` - Convert markdown plans to beads
- ✅ `/response-awareness` - Main Response Awareness entry point
- ✅ `/propose-autonomous-work` - Strategic work proposal workflow

**Verification**:
```bash
ls .claude/skills/
ls .claude/commands/
```

---

### 2. MCP Agent Mail
**Location**: `mcp_agent_mail/`

**Components**:
- ✅ Python MCP server for agent communication
- ✅ SQLite database for message persistence
- ✅ Agent registration system
- ✅ Message routing and delivery
- ✅ File reservation system for coordination

**Verification**:
```bash
ls mcp_agent_mail/
ls .agent-mail/  # Should exist after bootstrap
```

**Setup**:
```bash
bash maf/scripts/maf/bootstrap-agent-mail.sh install
```

---

### 3. Beads System
**Location**: `.beads-example/` (template) + **TWO tools**:

**External Dependencies**:

**A. Beads CLI (`bd`)** - Command-line interface (npm: `@beads/bd`)
```bash
# Install globally
npm install -g @beads/bd

# Initialize in your project
bd init

# Verify installation
bd --version
```

**B. Beads TUI Viewer (`bv`)** - Interactive terminal interface (Go binary)
```bash
# Install via install script
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_viewer/main/install.sh?$(date +%s)" | bash

# Verify installation
bv --version

# Launch TUI (auto-watches .beads/beads.jsonl)
bv
```

**Components**:
- ✅ `@beads/bd` - Beads CLI tool (npm package)
- ✅ `bv` - Beads TUI viewer (Go binary from beads_viewer repo)
- ✅ `beads.jsonl` - Task database (created by `bd init`)
- ✅ `beads.db` - SQLite database (created by `bd init`)
- ✅ Beads CLI and TUI integration

**Scripts** (scripts/maf/):
- ✅ `bead-assigner.py` - Assign tasks to agents via Agent Mail
- ✅ `detect-agent-beads.sh` - Detect which agent is working on which bead
- ✅ `start-bead-agents.sh` - Start bead workflow agents
- ✅ `quick-start-beads.sh` - Quick beads setup
- ✅ `teach-bead-workflow.sh` - Train agents on bead workflow
- ✅ `test-beads-flow.sh` - Test bead assignment and completion
- ✅ `check-beads-integrity.mjs` - Validate bead database integrity

**Common Commands:**

**CLI (`bd`)**:
```bash
bd ready                    # Show ready-to-work tasks (no blockers)
bd triage                   # Get AI-powered task recommendations
bd plan                     # Show parallel execution tracks
bd close <id>               # Close a completed task
bd --robot-next             # Get single top recommendation
bd --robot-insights         # Full graph metrics (PageRank, critical path)
```

**TUI (`bv`)** - Interactive viewer with:
- Vim-style navigation (j/k keys)
- Multiple views (list, Kanban, graph)
- Live file watching (auto-refreshes)
- PageRank and dependency metrics
```bash
bv                          # Launch interactive TUI
bv --robot-triage           # Show triage in JSON format
bv --robot-insights         # Show graph metrics
bv --robot-plan             # Show parallel execution tracks
```

**Verification**:
```bash
which bd                    # Should show: /usr/bin/bd or symlink
which bv                    # Should show: /usr/local/bin/bv
bd --version                # Should show: bd version 0.x.x
bv --version                # Should show: bv v0.x.x
ls scripts/maf/ | grep bead  # Should show 7+ bead-related scripts
ls .beads-example/          # Should show template files
```

---

### 3.5. Memlayer (Optional - Enhanced Agent Memory)
**Location**: Python virtual environment (`venv_memlayer/`)

**External Dependency**:
```bash
# Create Python virtual environment
python3 -m venv venv_memlayer

# Activate and install
source venv_memlayer/bin/activate
pip install memlayer

# Apply MAF compatibility patches
bash maf/scripts/maf/memlayer-patch.sh

# Deactivate when done
deactivate
```

**Components**:
- ✅ `memlayer` Python package - Long-term memory for agents
- ✅ Persistent context across agent sessions
- ✅ Integration with MCP Agent Mail

**Scripts** (scripts/maf/):
- ✅ `memlayer-patch.sh` - Apply compatibility patches
- ✅ `test-memlayer-integration.sh` - Test memlayer integration
- ✅ `test-memlayer-in-tmux.sh` - Test memlayer in tmux sessions
- ✅ `memlayer-config.json` - Memlayer configuration template
- ✅ `memory-service.py` - Memory service for agents
- ✅ `memory-service-fallback.py` - Fallback memory service
- ✅ `memory-service-unified.py` - Unified memory service

**What It Does**:
- Enables agents to recall previous work and decisions
- Provides persistent memory across sessions
- Integrates with MCP Agent Mail for seamless access
- Optional but recommended for production agent teams

**Verification**:
```bash
ls -la venv_memlayer/lib/python*/site-packages/ | grep memlayer
bash maf/scripts/maf/test-memlayer-integration.sh
```

---

### 4. Agent Orchestration Scripts
**Location**: `scripts/maf/`

**Core Scripts**:
- ✅ `spawn-agents.sh` - Spawn agent team
- ✅ `prompt-agent.sh` - Send messages to agents
- ✅ `context-manager-v2.sh` - Monitor agent health
- ✅ `bootstrap-agent-mail.sh` - Initialize Agent Mail
- ✅ `setup-maf.sh` - Automated setup (non-interactive)
- ✅ `setup-maf-interactive.sh` - Interactive setup with prompts

**Helper Libraries** (scripts/maf/lib/):
- ✅ `tmux-utils.sh` - Tmux operations
- ✅ `agent-utils.sh` - Agent management
- ✅ `error-handling.sh` - Error handling
- ✅ `profile-loader.sh` - Profile management
- ✅ `credential-manager.sh` - Credential management

**Verification**:
```bash
ls scripts/maf/*.sh | wc -l  # Should show 170+ scripts
```

---

### 5. Specialized Agents
**Location**: `.claude/agents/`

**Available Agent Types**:
- ✅ `code-reviewer` - Code review specialist
- ✅ `test-automation-expert` - Test automation specialist
- ✅ `performance-analyst` - Performance optimization
- ✅ `documentation-specialist` - Documentation creation
- ✅ `implementation-planner` - Implementation planning
- ✅ `contract-validator` - Integration contract validation
- ✅ `metacognitive-tag-verifier` - Tag verification

---

### 6. Configuration Templates
**Location**: `.maf/config/`

**Templates**:
- ✅ `agent-topology.json.example` - Agent team structure
- ✅ `default-agent-config.json` - Default agent configuration

**Verification**:
```bash
ls .maf/config/
```

---

### 7. Telegram Bot Integration
**Location**: `mcp_agent_mail/telegram-bot.js`

**Features**:
- ✅ Remote agent coordination
- ✅ Health monitoring via Telegram
- ✅ `/activity` - Check agent activity
- ✅ `/snapshot` - System snapshot
- ✅ `/broadcast` - Broadcast prompts to agents
- ✅ `/broadcast-targeted` - Target specific roles

**Setup Scripts**:
- ✅ `scripts/setup-telegram-bot.sh` - Install as systemd service
- ✅ `scripts/manage-telegram-bot.sh` - Manage bot (start/stop/restart)

**Verification**:
```bash
ls mcp_agent_mail/telegram-bot.js
ls scripts/*telegram*.sh
```

---

### 8. Governance and Proposal System
**Location**: `scripts/maf/governance/`

**Components**:
- ✅ Proposal workflow scripts
- ✅ Autonomous work proposal
- ✅ Voting and approval system

**Verification**:
```bash
ls scripts/maf/governance/ 2>/dev/null || echo "Governance in lib/maf/governance/"
```

---

## 🔧 Setup Verification Commands

Run these to verify everything is set up:

```bash
# 1. Check MAF directory structure
ls -la maf/

# 2. Verify Response Awareness skills
ls .claude/skills/ | wc -l  # Should show 20+ skills

# 3. Verify slash commands
ls .claude/commands/

# 4. Check MCP Agent Mail
ls mcp_agent_mail/telegram-bot.js

# 5. Verify beads integration
which bd                    # Should show bd path
which bv                    # Should show bv path
bd --version                # Should show version
bv --version                # Should show version
ls scripts/maf/ | grep bead  # Should show 7+ scripts

# 6. Verify memlayer (optional)
ls -la venv_memlayer/lib/python*/site-packages/ | grep memlayer

# 7. Check agent topology
cat .maf/config/agent-topology.json | jq .

# 8. Verify credentials
ls .maf/credentials/

# 9. Test spawn script
bash maf/scripts/maf/spawn-agents.sh --help
```

---

## 📝 Quick Setup for New Repos

### Option 1: Interactive Setup (Recommended)

```bash
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
bash maf/scripts/setup-maf-interactive.sh
```

This will:
- ✅ Prompt for project name and description
- ✅ Let you choose agent theme (mortgage, operations, geography, custom)
- ✅ Generate unique agent IDs
- ✅ Create proper agent-topology.json
- ✅ Set up credentials with env var support

### Option 2: Automated Setup

```bash
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
export OPENAI_API_KEY=sk-your-key-here
bash maf/scripts/setup-maf.sh
```

---

## 🎯 After Setup: Spawn Agents

```bash
# Kill any old sessions
tmux kill-server

# Initialize Agent Mail (first time only)
bash maf/scripts/maf/bootstrap-agent-mail.sh install

# Install dependencies
pnpm install

# Spawn 4-pane team
bash maf/scripts/maf/spawn-agents.sh --layout default_4_pane --workers 4 --background

# Attach to your agents
tmux attach -t <your-project-name>:agents
```

---

## 📊 What's Included in MAF v0.1.8+

| Component | Count | Status |
|-----------|-------|--------|
| Core Library (lib/maf/) | 27 subdirs | ✅ |
| Response Awareness Skills | 20+ | ✅ |
| Superpowers Skills | 17 | ✅ |
| Slash Commands | 9 | ✅ |
| Operational Scripts | 170+ | ✅ |
| Specialized Agents | 23 | ✅ |
| Configuration Templates | Complete | ✅ |
| MCP Agent Mail | Complete | ✅ |
| Telegram Bot | Complete | ✅ |
| Beads Integration | 7 scripts | ✅ |
| Memlayer Support | 7 scripts | ✅ |
| Documentation | Comprehensive | ✅ |

---

## 🔍 External Dependencies (Install Separately)

These are **not included** in MAF but are highly recommended:

| Dependency | Purpose | Installation |
|------------|---------|--------------|
| **@beads/bd** | Beads CLI tool (npm) | `npm install -g @beads/bd` |
| **bv** | Beads TUI viewer (Go binary) | `curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_viewer/main/install.sh?$(date +%s)" | bash` |
| **memlayer** | Enhanced agent memory (optional) | `pip install memlayer` (see SETUP.md) |

**Note**: You can use just `bd` (CLI), or both `bd` + `bv` (CLI + TUI) for the best experience.

---

## 🔍 Missing Components (None!)

All MAF components are included in the distribution. The only things you need to add are:
- Your project-specific code
- Your API credentials (OPENAI_API_KEY, etc.)
- Your custom configuration (agent-topology.json)
- External dependencies:
  - `@beads/bd` (recommended) - CLI tool for task tracking
  - `bv` (recommended) - TUI viewer for beads
  - `memlayer` (optional) - Enhanced agent memory

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SETUP.md` | Complete setup guide |
| `README.md` | Overview |
| `agents.md` | Agent operations guide (guardrails, workflows, spawning) |
| `claude.md` | Claude/Response Awareness framework (tiers, skills, commands) |
| `.claude/README.md` | Response Awareness docs |
| `docs/telegram-maf-setup.md` | Telegram bot setup |
| `docs/runbooks/` | Operational runbooks (upgrade, troubleshooting) |
| `docs/plans/` | Architecture design and migration plans |
