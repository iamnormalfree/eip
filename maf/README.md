# MAF (Multi-Agent Framework)

A sophisticated autonomous agent orchestration system for software development.

## Quick Overview

MAF enables AI agents to work collaboratively on your codebase through:

- **Autonomous Coordination**: Agents communicate via MCP Agent Mail
- **Metacognitive Workflows**: Response Awareness for complex tasks
- **Task Tracking**: Integration with Beads for work management
- **Production Operations**: Monitoring, health checks, automation
- **Vendor Architecture**: Git subtrees for external dependencies (Agent Mail, obra/superpowers, Typhren42/Response-Awareness)

## Installation

Add MAF to any repository:

```bash
# Create maf directory and add subtree (correct method)
mkdir -p maf
cd maf
git subtree add --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
```

**IMPORTANT:** Run subtree commands from **inside the `maf/` directory** to avoid creating a nested `maf/maf/` structure.

Then run the automated setup script:

```bash
bash maf/scripts/setup-maf.sh
```

The script will configure everything automatically, with support for environment variables like `OPENAI_API_KEY`.

See [SETUP.md](SETUP.md) for complete configuration guide.

## Updating MAF

**Recommended:** Use the helper script

```bash
bash maf/scripts/maf/update-maf-subtree.sh
```

**Manual update:**

```bash
cd maf
git subtree pull --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
```

**See:** [docs/runbooks/MANAGE_SUBTREE.md](docs/runbooks/MANAGE_SUBTREE.md) for complete subtree management guide.

## Franchisee Quick Start

For franchisees (repositories using MAF):

```bash
# Initialize MAF in your repo
curl -fsSL https://raw.githubusercontent.com/iamnormalfree/maf/main/scripts/franchisee-init.sh | bash

# Or manually:
mkdir -p maf
cd maf
git subtree add --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
bash scripts/franchisee-init.sh

# Update MAF (recommended: use helper script)
bash maf/scripts/maf/update-maf-subtree.sh
```

See [docs/VENDOR_ARCHITECTURE.md](docs/VENDOR_ARCHITECTURE.md) for vendor management guide.

## Superpowers Integration

MAF includes [obra/superpowers](https://github.com/obra/superpowers) as a git subtree, providing 14 upstream AI development workflow skills (brainstorming, TDD, debugging, code review, and more).

**For MAF HQ - Update Superpowers from upstream:**
```bash
# Pull latest from obra/superpowers
git subtree pull --prefix=vendor/superpowers https://github.com/obra/superpowers main --squash

# Sync skills to .claude/ and verify health
maf-hq update
maf-hq doctor
```

**For Franchisees - Get MAF updates (including Superpowers):**
```bash
# Update MAF + vendors and sync skills
bash scripts/franchisee-update.sh all
```

**Skill Sources:**
- **Upstream Superpowers** (14 skills): From `vendor/superpowers/skills/`
- **Upstream Response-Awareness** (4 skills): From `vendor/response-awareness/.claude/skills/`
- **MAF Custom Skills** (7 skills): From `.maf/skills/` (override vendors)
- **Franchisee Skills** (optional): From `.maf/overrides/skills/` (override everything)

See [docs/superpowers-upstream-sync.md](docs/superpowers-upstream-sync.md) for complete guide.

## Response-Awareness Integration

MAF includes [Typhren42/Response-Awareness](https://github.com/Typhren42/Response-Awareness) as a git subtree, providing 4 upstream metacognitive tier skills (light, medium, heavy, full) for complexity-aware task orchestration.

**For MAF HQ - Update Response-Awareness from upstream:**
```bash
# Pull latest from Typhren42/Response-Awareness
git subtree pull --prefix=vendor/response-awareness https://github.com/Typhren42/Response-Awareness main --squash

# Sync skills to .claude/ and verify health
maf-hq update
maf-hq doctor
```

**For Franchisees - Get MAF updates (including Response-Awareness):**
```bash
# Update MAF + vendors and sync skills
bash scripts/franchisee-update.sh all
```

**Multi-Vendor Skill Sync:**
- Both Superpowers and Response-Awareness sync via `maf-hq update`
- MAF's 7 custom skills override both vendors
- See [docs/response-awareness-upstream-sync.md](docs/response-awareness-upstream-sync.md) for complete guide



## What's Included

- **lib/maf/**: Core TypeScript library (orchestration, scheduling, decisions)
- **.claude/**: Response Awareness framework (25 skills: 14 Superpowers + 4 Response-Awareness + 7 MAF custom)
- **scripts/maf/**: 170+ operational scripts (spawn, monitor, coordinate)
- **bin/maf-hq**: CLI wrapper for skill management (sync, doctor)
- **vendor/superpowers/**: obra/superpowers subtree (AI workflow skills)
- **vendor/response-awareness/**: Typhren42/Response-Awareness subtree (metacognitive tier skills)
- **vendor/agent-mail/**: MCP Agent Mail subtree (inter-agent communication)
- **Telegram Bot**: Remote agent coordination and monitoring
- **.maf/skills/**: MAF custom skills (override both vendors)
- **.maf/config/**: Configuration templates
- **docs/**: Comprehensive documentation

## 3-Agent BDD Workflow

MAF includes a sophisticated 3-agent BDD (Behavior-Driven Development) workflow with autonomous quality enforcement:

### Features

- **TDD Enforcement**: RED-GREEN-REFACTOR workflow with automated verification
- **Two-Stage Review**: Spec compliance → Code quality
- **Escalation System**: Progressive guidance after failures (3 attempts before reopening)
- **Active Mail Polling**: Autonomous stage transitions every 10 seconds
- **BV Integration**: Intelligent bead prioritization (high/medium/low)
- **Memory Efficient**: 25% less memory than 4-agent workflow

### Quick Start

```bash
# Setup (first time)
cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json
bash maf/scripts/maf/start-3agent-bdd.sh --setup

# Start workflow
bash maf/scripts/maf/start-3agent-bdd.sh

# Monitor progress
tmux attach -t maf-bdd
bash maf/scripts/maf/bdd-status.sh
```

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
│  └───────────┘  └───────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Documentation

- **User Guide**: [docs/3-agent-bdd-user-guide.md](docs/3-agent-bdd-user-guide.md)
- **Architecture**: [docs/3-agent-bdd-architecture.md](docs/3-agent-bdd-architecture.md)
- **Implementation Plan**: [docs/plans/2026-01-27-3-agent-bdd-tmux-workflow.md](docs/plans/2026-01-27-3-agent-bdd-tmux-workflow.md)

### Workflow Comparison

| Factor | 4-Agent | 3-Agent BDD |
|--------|---------|-------------|
| Memory Usage | Higher | Lower |
| Parallel Implementation | Yes | No |
| TDD Enforced | No | Yes |
| Two-Stage Review | No | Yes |
| Escalation System | No | Yes |
| Autonomy | Medium | High |
| Use Case | High-volume production | Quality-focused autonomous |

### Active Mail Polling

- Agent Mail MCP server must be running on `http://127.0.0.1:8765`
- All agents poll mail every 10 seconds for autonomous transitions
- DO NOT manually check mail - the poller handles everything

## Documentation

- [SETUP.md](SETUP.md) - Complete setup guide (includes Telegram bot setup)
- [docs/VENDOR_ARCHITECTURE.md](docs/VENDOR_ARCHITECTURE.md) - Vendor subtree architecture
- [docs/superpowers-upstream-sync.md](docs/superpowers-upstream-sync.md) - Superpowers sync guide
- [docs/response-awareness-upstream-sync.md](docs/response-awareness-upstream-sync.md) - Response-Awareness sync guide
- [agents.md](agents.md) - Agent operations guide (guardrails, workflows, spawning)
- [claude.md](claude.md) - Claude/Response Awareness framework (tiers, skills, commands)
- [docs/telegram-maf-setup.md](docs/telegram-maf-setup.md) - Telegram bot configuration
- [docs/runbooks/](docs/runbooks/) - Operational runbooks (upgrade, troubleshooting)
  - **[docs/runbooks/MANAGE_SUBTREE.md](docs/runbooks/MANAGE_SUBTREE.md)** - MAF subtree management guide
- [docs/plans/](docs/plans/) - Architecture design and migration plans
- **[docs/3-agent-bdd-user-guide.md](docs/3-agent-bdd-user-guide.md)** - 3-Agent BDD workflow user guide
- **[docs/3-agent-bdd-architecture.md](docs/3-agent-bdd-architecture.md)** - 3-Agent BDD architecture documentation

## Versioning

- **v0.3.1**: Add Typhren42/Response-Awareness subtree integration with multi-vendor sync (25 skills: 14 Superpowers + 4 Response-Awareness + 7 MAF custom)
- **v0.3.0**: Add obra/superpowers subtree integration with maf-hq CLI (21 skills, sync workflows)
- **v0.2.9**: Default all agents to Claude (no more Codex)
- **v0.2.8**: Correct PROJECT_ROOT detection for direct layout
- **v0.2.7**: Add agent specialization framework
- **v0.2.6**: Make prompt-agent.sh project-aware
- **v0.2.5**: Make rebuild-maf-cli-agents.sh project-aware
- **v0.2.4**: Fix jq commands for set -e compatibility
- **v0.2.2**: Add telegram bot auto-start integration
- **v0.2.1**: Make setup script project-aware for multi-repo support
- **v0.2.0**: Auto-install external dependencies in setup script
- **v0.1.9**: Add bv TUI viewer to beads documentation
- **v0.1.8**: Document beads viewer and memlayer installation
- **v0.1.7**: Add interactive setup script and component checklist
- **v0.1.6**: Fix Python version requirement (3.14 -> 3.12)
- **v0.1.5**: Fix Agent Mail bootstrap command
- **v0.1.4**: Fix variable expansion bug in setup script
- **v0.1.3**: Added automated setup script with environment variable support
- **v0.1.2**: Fixed subtree layout detection for git subtree compatibility
- **v0.1.1**: Added Telegram bot integration
- **v0.1.0**: Initial distribution from roundtable
- See [Releases](https://github.com/iamnormalfree/maf/releases) for changelog

## License

MIT

## Support

- Issues: https://github.com/iamnormalfree/maf/issues
- Discussions: https://github.com/iamnormalfree/maf/discussions
