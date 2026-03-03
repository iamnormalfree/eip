# MAF (Multi-Agent Framework)

---

## 🚨 START HERE: Before Writing Custom Code

**Check what MAF provides before building anything:**

| You Need | Use This | File Path |
|----------|----------|-----------|
| **Full orchestration** | `orchestrator.sh` | `maf/scripts/maf/orchestrator.sh` |
| **Smart coordination** | `coordinate-agents.sh` | `maf/scripts/maf/coordinate-agents.sh` |
| **Session rebuild** | `rebuild-maf-cli-agents.sh` | `maf/scripts/maf/rebuild-maf-cli-agents.sh` |
| **Stuck detection** | `agent-monitor.sh` | `maf/scripts/maf/agent-monitor.sh` |
| **Clear stuck prompts** | `clear-stuck-prompts.sh` | `maf/scripts/maf/clear-stuck-prompts.sh` |
| **Agent communication** | `agent-communication-real.sh` | `maf/scripts/maf/agent-communication-real.sh` |
| **Agent memory** | `agent-memory.sh` | `maf/scripts/maf/agent-memory.sh` |
| **Bead verification** | `verify-ac.sh` | `maf/scripts/maf/verify-ac.sh` |

**Quick start with orchestrator:** `bash maf/scripts/maf/orchestrator.sh --loop`

**Custom workflow:** Create custom workflow in `scripts/maf/` that calls `orchestrator.sh` with your project-specific logic. |

**Quick check:**
```bash
ls maf/scripts/maf/*.sh
grep -r "YOUR_KEYWORD" maf/scripts/maf/
```

**See:** `START_HERE.md` for detailed decision guide, `LLM_README.md` for AI agents

---

## 3-Agent BDD Workflow

MAF includes a sophisticated 3-agent BDD (Behavior-Driven Development) workflow with autonomous quality enforcement:

**Features:**
- TDD Enforcement (RED-GREEN-REFACTOR)
- Two-Stage Review (Spec Compliance → Code Quality)
- Escalation System (progressive guidance, 3 attempts before reopening)
- Active Mail Polling (autonomous stage transitions)
- BV Integration (intelligent bead prioritization)
- Memory Efficient (25% less than 4-agent model)

**Quick Start:**
```bash
# Setup (first time)
cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json
bash maf/scripts/maf/start-3agent-bdd.sh --setup

# Start workflow
bash maf/scripts/maf/start-3agent-bdd.sh

# Monitor progress
tmux attach -t maf-bdd
```

**Documentation:**
- User Guide: [docs/3-agent-bdd-user-guide.md](../docs/3-agent-bdd-user-guide.md)
- Architecture: [docs/3-agent-bdd-architecture.md](../docs/3-agent-bdd-architecture.md)
- Comparison: [README.md](../README.md#3-agent-bdd-workflow)

---

## Quick Start

### For New Projects

1. Add MAF as a subtree (**important**: use the correct method):
   ```bash
   # Create maf directory and add subtree from inside it
   mkdir -p maf
   cd maf
   git subtree add --prefix=. https://github.com/iamnormalfree/maf main --squash
   cd ..
   ```

   **Why this way?** The MAF repo has files in a `maf/` directory. Adding from inside `maf/` creates the correct flat structure instead of nested `maf/maf/`.

2. Run the setup wizard:
   ```bash
   bash maf/scripts/setup/setup-maf.sh
   ```

3. Start your agents:
   ```bash
   bash maf/scripts/maf/rebuild-maf-cli-agents.sh
   ```

   **Note:** The setup wizard (step 2) handles agent configuration. Step 3 launches the agent session with a 4-pane tmux layout (Supervisor, Reviewer, Imp-1, Imp-2).

### Updating MAF

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

**See:** [docs/runbooks/MANAGE_SUBTREE.md](docs/runbooks/MANAGE_SUBTREE.md) for complete guide.

### Governance

MAF is governed by a constitution that defines autonomous agent behavior:
- [MAF Constitution](docs/maf-constitution.md) - Autonomy contract
- [MAF Assumptions](docs/governance/MAF_ASSUMPTIONS.md) - Cognitive assumptions
- [Core Override Policy](docs/governance/CORE_OVERRIDE_POLICY.md) - Override rules
- [Versioning Guide](docs/governance/VERSIONING_GUIDE.md) - Semantic versioning

### Agent Behavior

All agents follow the contract defined in AGENTS.md (generated during setup).
See [AGENTS.md.template](templates/AGENTS.md.template) for the full contract.

## Setup Wizard

The MAF Control Console (`maf/scripts/setup/setup-maf.sh`) is the single entry point for all MAF operations:

- **Mode 1: Install** - Set up MAF in a new repo
- **Mode 2: Update** - Update MAF config after subtree pull
- **Mode 3: Doctor** - Diagnose and fix common drift issues
- **Mode 4: Reset** - Nuke and rebuild config safely

## Environment Detection

MAF automatically detects your environment:
- **HQ**: MAF is the repository itself (no `maf/` prefix)
- **Franchisee**: MAF is a git subtree (has `maf/` prefix)
- **Legacy**: Older directory structures

The setup wizard generates `.maf/context.sh` with environment variables for all MAF operations.

## See Also

- [AGENT_SPAWNING.md](docs/AGENT_SPAWNING.md) - How agent spawning works
- [AUTONOMY_GUIDE.md](docs/AUTONOMY_GUIDE.md) - How autonomous operation works (coming soon)
- [CONSUMER_UPGRADE.md](docs/runbooks/CONSUMER_UPGRADE.md) - Upgrade instructions (coming soon)
- [TROUBLESHOOTING.md](docs/runbooks/TROUBLESHOOTING.md) - Common issues and fixes (coming soon)
