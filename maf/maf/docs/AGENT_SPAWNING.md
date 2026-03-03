# Agent Spawning in MAF

## Standard Way (Recommended)

**Use:** `maf/scripts/maf/rebuild-maf-cli-agents.sh`

This is the enhanced spawning script with:
- Role-based agent mapping
- Agent startup wrapper for identity injection
- 4-pane tmux layout (Supervisor, Reviewer, Imp-1, Imp-2)
- Memory preservation via Memlayer
- Worktree support for parallel development

## Usage

```bash
# Rebuild agent session
bash maf/scripts/maf/rebuild-maf-cli-agents.sh

# Force rebuild (kill existing session)
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force

# Test mode (dry run)
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --test-only
```

## Legacy Way (Deprecated)

**Use:** `scripts/maf/spawn-agents.sh`

This is the original basic spawning script. It still works but lacks the enhancements available in rebuild-maf-cli-agents.sh.

## Migration Notes

This script was upstreamed from NextNest (Roundtable's mortgage domain project) where it has been running successfully in production.

Origin: /root/projects/nextnest/maf/scripts/maf/rebuild-maf-cli-agents.sh
Upstreamed: 2026-01-08 (Wave 1, Day 1-2)
