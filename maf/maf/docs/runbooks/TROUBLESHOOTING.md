# MAF Troubleshooting Guide

## Setup Wizard Issues

### Symptom: "Setup wizard fails"

**Diagnosis:**
```bash
# Check wizard exists
ls maf/scripts/setup/setup-maf.sh

# Check MAF subtree exists
ls maf/

# Check for package.json or equivalent
ls package.json  # or Cargo.toml or pyproject.toml
```

**Solutions:**

**1. MAF subtree missing**
```bash
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

**2. Not in a project directory**
```bash
# Wizard requires package.json, Cargo.toml, or pyproject.toml
# Run from your project root
```

**3. Permission denied**
```bash
chmod +x maf/scripts/setup/setup-maf.sh
```

### Symptom: "Configuration validation fails"

**Diagnosis:**
```bash
bash maf/scripts/setup/validate-config.sh
```

**Solutions:**

**1. Invalid JSON**
```bash
# Fix JSON syntax errors
jq . .maf/config/agent-topology.json
```

**2. Missing required fields**
```bash
# Re-run setup wizard
bash maf/scripts/setup/setup-maf.sh
# Choose: Reset and reconfigure
```

**3. Session name conflict**
```bash
# Choose a unique session name
# Don't use "maf-cli" unless you are Roundtable
```

## Context-Awareness Issues

### Symptom: "Scripts not found at detected path"

**Diagnosis:**
```bash
source .maf/context.sh
echo "Layout: $MAF_LAYOUT"
echo "Prefix: $MAF_SUBTREE_PREFIX"
ls "$PROJECT_ROOT/$MAF_SUBTREE_PREFIX/scripts/maf/"
```

**Solutions:**

**1. Context file missing or outdated**
```bash
# Re-run setup wizard to regenerate
bash maf/scripts/setup/setup-maf.sh
# Choose: Update existing config
```

**2. Layout detection incorrect**
```bash
# Check directory structure
ls -la maf/ 2>/dev/null || echo "No maf/ directory"
ls -la scripts/maf/ 2>/dev/null || echo "No scripts/maf/ directory"

# Force layout regeneration
rm .maf/context.sh
bash maf/scripts/setup/setup-maf.sh
```

### Symptom: "Symlink causing path confusion (franchisee)"

**Diagnosis:**
```bash
# Check if project root is a symlink
git rev-parse --show-toplevel
readlink -f "$(git rev-parse --show-toplevel)"

# Example: /root/nextnest -> /root/projects/nextnest
```

**Solutions:**

**1. Orchestrator automatically handles symlinks (v0.2.4+)**
The orchestrator now resolves symlinks and searches both locations:
- `PROJECT_ROOT/maf/scripts/maf/` (franchisee subtree)
- `PROJECT_ROOT/scripts/maf/` (HQ location)

**2. Verify orchestrator is up to date**
```bash
# Update MAF to get the symlink-aware orchestrator
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

**3. Manual symlink setup (if needed)**
```bash
# If scripts exist only at HQ location and orchestrator is outdated
# Create symlinks from subtree to HQ scripts
cd maf/scripts/maf/
ln -s ../../../../../scripts/maf/agent-monitor.sh ./agent-monitor.sh
ln -s ../../../../../scripts/maf/clear-stuck-prompts.sh ./clear-stuck-prompts.sh
```

## Agent Issues

### Symptom: "Agents won't start"

**Diagnosis:**
```bash
# Check if tmux session exists
tmux list-sessions

# Check agent configuration
cat .maf/config/agent-topology.json | jq .
```

**Solutions:**

**1. Session already exists**
```bash
# Kill existing session
tmux kill-session -t <session-name>

# Restart agents
bash maf/scripts/maf/rebuild-maf-cli-agents.sh
```

**2. Invalid configuration**
```bash
# Re-run setup wizard
bash maf/scripts/setup/setup-maf.sh
```

## Getting Help

If issues persist:
1. Run setup wizard in Doctor mode for diagnosis
2. Check [MAF Constitution](../maf-constitution.md) for escalation rules
3. Check [AGENT_SPAWNING.md](../AGENT_SPAWNING.md) for agent details
