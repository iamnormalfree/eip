# Session Name Design Pattern

## Purpose

Session names must be **unique across all running tmux sessions** on a system. When multiple MAF-based projects run concurrently, they cannot share the same session name.

## Standard Convention

**Pattern:** `maf-{project}`

| Repo | Session Name | Purpose |
|------|--------------|---------|
| **MAF HQ** | `maf-hq` | Framework |
| **Template default** | `maf-hq` | Starting point for new projects |
| **Roundtable** | `maf-cli` | Consumer (their choice) |
| **NextNest** | `maf-nn` | Consumer (their choice) |

## How to Configure

### 1. In Agent Topology Config

Add `session_name` field to `.maf/config/agent-topology.json`:

```json
{
  "session_name": "maf-PROJECT",  // REQUIRED: Replace with your unique project name
  "version": "1.0.0",
  "agents": {...}
}
```

**Template default is `maf-hq` - customize for your project.**

### 2. In Spawn Scripts

Spawn scripts should read session name from config:

```bash
# Get session name from config
SESSION_NAME=$(jq -r '.session_name // "maf-hq"' .maf/config/agent-topology.json)

# Use when creating tmux session
tmux new-session -d -s "$SESSION_NAME"
```

### 3. In Context Managers

Context managers should respect the configured session name:

```bash
MAF_TMUX_SESSION=${SESSION_NAME:-$(jq -r '.session_name // "maf-hq"' .maf/config/agent-topology.json)}
```

## Design Checklist

When creating a new MAF-based project:

- [ ] Choose unique session name following `maf-{project}` pattern
- [ ] Add `session_name` field to agent-topology.json
- [ ] Update spawn scripts to read from config
- [ ] Update context managers to use configured name
- [ ] Test concurrent operation with other MAF projects

## Session Conflict Protection

**Problem:** If multiple projects use the same session name, tmux will fail with unclear errors.

**Solution:** Spawn scripts automatically detect and prevent session conflicts.

### What Happens on Conflict

If you try to spawn agents with a session name that already exists:

```
ERROR: tmux session 'maf-hq' already exists!

You have a session name conflict. Choose a unique name in .maf/config/agent-topology.json:
  "session_name": "maf-your-project"

Current running sessions:
  maf-hq
  maf-cli

To attach to existing session: tmux attach -t 'maf-hq'
To kill existing session: tmux kill-session -t 'maf-hq'
```

### Before Spawning Agents

1. Check existing sessions: `tmux list-sessions`
2. Verify your config uses unique name: `jq .session_name .maf/config/agent-topology.json`
3. If conflict exists, either:
   - Attach to existing: `tmux attach -t maf-hq`
   - Kill existing: `tmux kill-session -t maf-hq`
   - Use different name in config

### Template Placeholder

The template uses `"maf-PROJECT"` as a placeholder to remind you to customize:
- Replace "maf-PROJECT" with your unique project name
- Follow pattern: `maf-{your-project}`
- This prevents accidental conflicts

## Migration Notes

- **MAF HQ**: Uses "maf-hq" (framework)
- **Template default**: "maf-hq" (new projects start here, customize as needed)
- **Roundtable**: Uses "maf-cli" (their choice)
- **NextNest**: Uses "maf-nn" (their choice)

## Implementation Pattern

**Don't hardcode session names** - read from config:

```bash
# ❌ WRONG - hardcoded
SESSION_NAME="maf-hq"

# ✅ RIGHT - from config (with fallback to template default)
SESSION_NAME=$(jq -r '.session_name // "maf-hq"' .maf/config/agent-topology.json)
```

This ensures session names are configurable by design, not hardcoded.

---

## For MAF HQ Wave 2: Session Name Migration

**Note:** MAF HQ is the framework repo and doesn't run agents itself. This section applies if someone creates agents in MAF HQ for testing.

**Files to Update:**

1. **Create `.maf/config/agent-topology.json`** (doesn't exist yet - HQ is framework only)
   ```json
   {
     "session_name": "maf-hq",
     "version": "1.0.0",
     ...
   }
   ```

2. **`scripts/maf/spawn-agents.sh`** - Update default session name
   ```bash
   # OLD: DEFAULT_SESSION_NAME="maf-cli"
   # NEW:
   DEFAULT_SESSION_NAME="maf-hq"
   ```

3. **`maf/scripts/maf/rebuild-maf-cli-agents.sh`** - Update default session name
   ```bash
   # OLD: MAF_SESSION="maf-cli"
   # NEW:
   MAF_SESSION="maf-hq"
   ```

**Priority:** LOW - MAF HQ is primarily a framework repo. Session name standardization mainly matters for consumer repos.

---

## For NextNest Wave 2: Keep Current Session

**Files to Keep Unchanged:**

1. **`.maf/config/agent-topology.json`** (outside subtree) - KEEP "maf-nn"
2. **`maf/scripts/maf/context-manager-nextnest.sh`** - KEEP `MAF_TMUX_SESSION="maf-nn"`

**No Subtree Config Issue:**

MAF HQ doesn't provide an agent-topology.json file. Each consumer repo creates their own:
- MAF HQ = Framework (scripts, templates, schemas)
- Roundtable = Creates `.maf/config/agent-topology.json` with "maf-cli"
- NextNest = Creates `.maf/config/agent-topology.json` with "maf-nn"

The `maf/.maf/` directory inside the subtree contains HQ-provided schemas and defaults, not the consumer's agent-topology.json.

**Note:** NextNest already has a working session name ("maf-nn"). No changes needed.
