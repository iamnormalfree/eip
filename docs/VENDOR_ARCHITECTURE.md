# Vendor Architecture

## Overview

MAF uses a `vendor/` directory to manage external dependencies as git subtrees. This provides clean separation between MAF-native code and external projects while enabling franchisees to customize vendor code through a patch system.

**Path note:**
- **Franchisee repo**: run scripts via `maf/scripts/maf/...`
- **MAF HQ repo**: run the same scripts via `scripts/maf/...`

## Architecture Diagram

```
maf-github/
├── vendor/                          # External dependencies (git subtrees)
│   ├── agent-mail/                  # MCP Agent Mail subtree
│   │   ├── src/                     # Vendor code (read-only)
│   │   ├── pyproject.toml           # Vendor config
│   │   └── .git/                    # Subtree git history
│   └── superpowers/                 # Obra/superpowers subtree (optional)
│
├── .maf/patches/                    # Vendor customizations
│   ├── vendor-agent-mail/           # Agent Mail patches
│   │   ├── 0001-custom-handler.patch
│   │   ├── 0002-add-endpoint.patch
│   │   └── .metadata.json           # Patch tracking
│   └── vendor-superpowers/          # Superpowers patches
│
├── .claude/                         # MAF + franchisee code
│   ├── .maf-manifest.json           # MAF file ownership tracking
│   ├── .MAF_MARKER                  # Coexistence documentation
│   ├── skills/                      # MAF-managed skills
│   └── my-custom-skill/             # Franchisee-owned (never touched)
│
└── maf/                             # MAF core library (subtree)
```

## Why Git Subtrees?

### Advantages Over Submodules

| Feature | Git Subtrees | Git Submodules |
|---------|--------------|----------------|
| Extra metadata files | None (clean) | `.gitmodules` required |
| Franchisee setup | Automatic | Requires `git submodule update` |
| Commit atomicity | Part of main repo history | Separate commits |
| Distribution | Works with subtree push/pull | Requires separate sync |
| Friction for franchisees | Low | Medium/High |

### Key Benefits

1. **No Extra Metadata Files** - Unlike submodules, subtrees don't require `.gitmodules`
2. **Franchisee-Friendly** - Works seamlessly with git subtree distribution to franchisees
3. **No Extra Commands** - Franchisees don't need to run `git submodule update`
4. **Atomic Commits** - Subtree changes are part of the main repo's commit history
5. **Transparent** - Subtree files appear as regular files in the repository

## Directory Structure

### Vendor Directory

```
vendor/
├── .gitkeep              # Ensures directory is tracked by git
├── README.md             # Vendor management documentation
├── agent-mail/           # MCP Agent Mail subtree
│   ├── mcp_agent_mail/   # Agent Mail source code
│   ├── pyproject.toml    # Python project config
│   └── README.md         # Agent Mail documentation
└── superpowers/          # Future: Obra/superpowers subtree
```

### Patch Directory

```
.maf/patches/
├── README.md                    # Patch system documentation
├── vendor-agent-mail/           # Agent Mail patches
│   ├── 0001-description.patch   # Unified diff format
│   ├── 0002-description.patch   # Numbered sequentially
│   └── .metadata.json           # Patch tracking metadata
└── vendor-superpowers/          # Superpowers patches
    └── (same structure)
```

## Vendor Management Guidelines

### 1. Read-Only Policy

Treat vendor code as **read-only** for MAF purposes. If you need to modify vendor code:

**Option A: Use Patch System (Recommended for small changes)**
```bash
# 1. Edit vendor code directly
vim vendor/agent-mail/src/handlers/custom.py

# 2. Create a patch from your changes
bash maf/scripts/maf/vendor-patch-create.sh agent-mail 0001 "Add custom handler"

# 3. Patches are auto-applied after vendor updates
```

**Option B: Fork Model (Recommended for extensive changes)**
```bash
# 1. Fork the vendor repository
# 2. Make changes in your fork
# 3. Update subtree URL in scripts/franchisee-init.sh
# 4. Franchisees using your fork will get your customizations
```

### 2. Version Tracking

Track which commit/tag you're using in `vendor/README.md`:

```markdown
## Vendor Versions

- **agent-mail**: commit abc123 (2026-01-09)
- **superpowers**: tag v1.2.3 (not yet integrated)
```

### 3. Security Monitoring

- Monitor vendor repos for security updates
- Review vendor changelogs regularly
- Update subtrees when critical security fixes are released
- Validate vendor integrity before updates (see health-check.sh)

### 4. Licensing

Ensure vendor licenses are compatible with MAF's MIT license:

- **agent-mail**: MIT License (compatible)
- **superpowers**: TBD (verify before integration)

## Adding a New Vendor

### Step 1: Add Subtree

```bash
# From MAF HQ repository root
git subtree add --prefix=vendor/<vendor-name> \
    https://github.com/<org>/<repo> <branch> --squash
```

Example:
```bash
git subtree add --prefix=vendor/superpowers \
    https://github.com/obra/superpowers main --squash
```

### Step 2: Create Patch Directory

```bash
mkdir -p .maf/patches/vendor-<vendor-name>
```

### Step 3: Update Documentation

Add vendor to `vendor/README.md` and `docs/VENDOR_ARCHITECTURE.md`.

### Step 4: Update Scripts

Add vendor update logic to `scripts/franchisee-update.sh`.

## Updating Vendor Subtrees

### Manual Update

```bash
# Pull latest changes from upstream
git subtree pull --prefix=vendor/<vendor-name> \
    https://github.com/<org>/<repo> <branch> --squash
```

Example:
```bash
git subtree pull --prefix=vendor/agent-mail \
    https://github.com/Dicklesworthstone/mcp_agent_mail main --squash
```

### Automated Update (For Franchisees)

```bash
# Update all vendors
bash scripts/franchisee-update.sh vendor

# Update MAF + vendors
bash scripts/franchisee-update.sh all
```

The automated workflow:
1. Creates restore point (backup)
2. Pulls latest vendor code
3. Re-applies franchisee's patches
4. Runs health checks
5. Rolls back on failure

## Patch System

### Creating Patches

```bash
# 1. Edit vendor code directly
vim vendor/agent-mail/src/handlers/custom.py

# 2. Generate patch from your changes
bash maf/scripts/maf/vendor-patch-create.sh agent-mail 0001 "Add custom handler"

# 3. Review generated patch
cat .maf/patches/vendor-agent-mail/0001-add-custom-handler.patch

# 4. Revert vendor changes (clean slate for next update)
git checkout -- vendor/agent-mail
```

### Applying Patches

Patches are **automatically applied** after vendor updates. Manual application:

```bash
# Apply all patches for a vendor
bash maf/scripts/maf/vendor-patch-apply.sh agent-mail

# Force apply (creates .rej files on conflicts)
bash maf/scripts/maf/vendor-patch-apply.sh agent-mail --force
```

### Listing Patches

```bash
# List all patches across all vendors
bash maf/scripts/maf/vendor-patch-list.sh
```

### Patch Metadata

Each vendor has a `.metadata.json` file:

```json
{
  "vendor": "agent-mail",
  "vendor_repo": "https://github.com/Dicklesworthstone/mcp_agent_mail",
  "vendor_branch": "main",
  "patches": [
    {
      "file": "0001-add-custom-handler.patch",
      "description": "Add custom message handler for XYZ",
      "applied": true,
      "fingerprint": "abc123..."
    }
  ]
}
```

### Resolving Conflicts

When a patch fails after a vendor update:

```bash
# 1. Manual resolution
cd vendor/agent-mail
patch -p1 < ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch

# 2. Fix conflicts in editor
vim src/handlers/custom.py

# 3. Regenerate patch with fixes
git diff > ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch

# 4. Update metadata
bash maf/scripts/maf/vendor-patch-create.sh agent-mail 0001 "Add custom handler"
```

## Merge System (.Claude Coexistence)

### Manifest Tracking

The `.claude/.maf-manifest.json` file tracks MAF-owned files:

```json
{
  "version": "1.0",
  "maf_version": "v0.3.0",
  "managed_files": [
    {
      "path": ".claude/skills/response-awareness-light",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": false,
      "merge_strategy": "overwrite"
    },
    {
      "path": ".claude/skills/sp-brainstorming",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": true,
      "merge_strategy": "merge_if_no_conflict"
    }
  ],
  "franchisee_files": []
}
```

### File Ownership Rules

1. **MAF-Owned, Overwrite**: MAF controls, updates overwrite franchisee changes
   - Example: Core Response Awareness skills
   - `franchisee_can_modify: false`

2. **MAF-Owned, Merge-Safe**: MAF manages, but franchisee can customize
   - Example: Superpowers skills (sp-*)
   - `franchisee_can_modify: true`

3. **Franchisee-Owned**: MAF never touches these files
   - Example: Custom skills added by franchisee
   - Not in manifest (implicitly franchisee-owned)

### Merge Workflow

```bash
# 1. MAF updates .claude/ via subtree pull
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# 2. Merge preserves franchisee customizations
bash maf/scripts/maf/merge-claude.sh

# 3. Backup created automatically at .claude.backup.TIMESTAMP
```

### Safe Customization

To customize MAF files safely:

```bash
# 1. Copy the file to a new name
cp .claude/skills/response-awareness-light .claude/skills/response-awareness-custom

# 2. Modify your copy
vim .claude/skills/response-awareness-custom

# 3. Your custom file is franchisee-owned and will never be touched
```

## Init/Update Workflows

### Franchisee Initialization

```bash
# Automated initialization (recommended)
curl -fsSL https://raw.githubusercontent.com/iamnormalfree/maf/main/scripts/franchisee-init.sh | bash

# Or manually:
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
bash scripts/franchisee-init.sh
```

The init script:
1. Adds MAF subtree
2. Adds vendor subtrees (agent-mail)
3. Merges .claude/ directories
4. Runs MAF setup wizard
5. Validates installation

### Franchisee Update

```bash
# Update MAF only
bash scripts/franchisee-update.sh maf

# Update vendors only
bash scripts/franchisee-update.sh vendor

# Update everything
bash scripts/franchisee-update.sh all
```

The update script:
1. Creates restore point
2. Pulls latest code
3. Re-applies patches
4. Merges .claude/
5. Runs health checks
6. Rolls back on failure

### Rollback

```bash
# List available restore points
ls -dt .maf.restore.*

# Rollback to specific restore point
bash scripts/franchisee-rollback.sh .maf.restore.20260109_123456
```

## Health Checks

```bash
# Run comprehensive health check
bash maf/scripts/maf/health-check.sh
```

Checks performed:
1. MAF subtree exists
2. Agent Mail subtree exists (at vendor/agent-mail)
3. .claude/ directory exists with manifest
4. MAF configuration valid JSON
5. .maf/ is gitignored

## Preflight Validation System

The preflight validation system protects franchisee setup and agent execution by validating the environment before critical operations. This prevents failures, data corruption, and configuration issues.

### Overview

```bash
# Source the preflight library
source maf/scripts/maf/preflight-gatekeeper.sh

# Run all preflight checks
run_preflight_checks
```

The preflight system is automatically invoked during:
- Franchisee initialization (`scripts/franchisee-init.sh`)
- MAF updates (`scripts/franchisee-update.sh`)
- Agent orchestration startup
- Before running critical MAF operations

### Validation Checks

The preflight system performs two types of checks:

#### Critical Checks (Block Execution)

1. **Required Dependencies** - Ensures necessary tools are installed
   - Validates `jq` is available (required for JSON processing)
   - Exit code: 2 (system error)
   - Fix: Install missing dependencies

2. **Topology File Validation** - Ensures agent topology is properly configured
   - Checks `.maf/config/agent-topology.json` exists
   - Validates JSON syntax and format
   - Verifies required fields: `topology_name`, `description`, `panes` (array)
   - Exit code: 1 (critical failure)
   - Fix: Create or fix topology file

3. **HQ Files Unmodified** - Prevents modification of MAF HQ-managed files
   - Reads `.claude/.maf-manifest.json` for `hq_owned_files` list
   - Verifies no uncommitted changes to HQ-owned files
   - Checks both working directory and staged changes
   - Exit code: 1 (critical failure)
   - Fix: Revert changes to HQ-owned files

#### Advisory Checks (Warning Only)

4. **Agent Mail Name Coverage** - Ensures Agent Mail integration is properly configured
   - Checks each pane has a `mail_name` field
   - Exit code: 0 (continues execution)
   - Fix: Add `mail_name` field to topology panes

5. **MAF Subtree Integrity** - Detects uncommitted changes in MAF code
   - Checks for uncommitted, staged, or untracked files in `maf/` directory
   - Exit code: 0 (continues execution - local patches may be present)
   - Fix: Commit or stash changes in MAF directory

6. **Optional Tools** - Suggests enhancements for better user experience
   - Checks for: `bd`, `fzf`, `ripgrep`, `fd`
   - Exit code: 0 (continues execution)
   - Fix: Install optional tools for enhanced UX

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All checks passed (or warnings only) | Continue execution |
| 1 | Critical check failed | Block execution with error message |
| 2 | System error (missing dependency) | Block execution with install instructions |
| 3 | Invalid arguments | Show usage and exit |

### Environment Variables

```bash
# Skip all preflight checks (not recommended)
export MAF_SKIP_PREFLIGHT=true

# Use custom topology file
export MAF_TOPOLOGY_FILE=/path/to/custom-topology.json

# Set project root (auto-detected if not set)
export PROJECT_ROOT=/path/to/project
```

### Manifest Integration

The preflight system integrates with `.claude/.maf-manifest.json` to protect MAF-owned files:

```json
{
  "version": "1.0",
  "maf_version": "v0.3.0",
  "managed_files": [
    {
      "path": ".claude/skills/response-awareness-light",
      "checksum": "sha256:...",
      "maf_owned": true,
      "franchisee_can_modify": false,
      "merge_strategy": "overwrite"
    }
  ],
  "hq_owned_files": [
    ".claude/skills/response-awareness-light",
    ".claude/skills/response-awareness-medium"
  ]
}
```

The `hq_owned_files` array lists files that MAF HQ manages exclusively. The preflight check ensures these files remain unmodified to prevent merge conflicts and maintain system integrity.

### Helper Functions

The preflight library provides utility functions for querying topology data:

```bash
# Get mail_name by pane index
mail_name=$(get_mail_name_by_pane 0)

# Get mail_name by role name
mail_name=$(get_mail_name_by_role "supervisor")

# Get agent_name by pane index
agent_name=$(get_agent_name_by_pane 2)

# Get pane index by role name
pane_index=$(get_pane_by_role "reviewer")
```

### Error Messages and Fix Hints

All preflight checks provide clear error messages with actionable fix hints:

```
ERROR: Topology file not found: .maf/config/agent-topology.json
FIX: Create the file with required fields (topology_name, description, panes) or set MAF_TOPOLOGY_FILE

WARNING: Pane 'Implementor-1' missing mail_name field
HINT: Add mail_name field to enable Agent Mail integration for this pane
```

### Benefits

1. **Early Failure Detection** - Catches configuration issues before they cause problems
2. **Clear Error Messages** - Provides actionable fix hints for each failure
3. **Graceful Degradation** - Advisory checks warn without blocking execution
4. **Manifest Protection** - Prevents accidental modification of MAF HQ files
5. **Environment Validation** - Ensures dependencies and tools are available
6. **Developer-Friendly** - Skip checks via environment variable when needed

## Workflow Hooks System

The workflow hooks system allows franchisees to customize autonomous agent behavior without modifying MAF core code. Hooks provide extension points at critical workflow stages while maintaining forward compatibility.

### Overview

```bash
# Custom hooks file location
.maf/config/custom-workflow-hooks.sh

# Automatically sourced by autonomous-workflow.sh
# 8 hook points available for customization
```

The hooks system is automatically invoked by `maf/scripts/maf/autonomous-workflow.sh` during autonomous bead routing. If the custom hooks file exists, it's sourced before the main workflow loop begins.

### Hook File Location

**Path:** `.maf/config/custom-workflow-hooks.sh`

The hook file must be:
- Executable (`chmod +x`)
- Valid bash script
- Located in the franchisee's project root
- Sourced automatically by autonomous-workflow.sh

**Example creation:**
```bash
mkdir -p .maf/config
cat > .maf/config/custom-workflow-hooks.sh <<'EOF'
#!/bin/bash
# Custom workflow hooks for my franchisee setup

CUSTOM_HOOK_BEFORE_LOOP() {
    echo "Starting autonomous workflow..."
    return 0
}
EOF

chmod +x .maf/config/custom-workflow-hooks.sh
```

### Available Hooks

#### Hook 1: `CUSTOM_HOOK_BEFORE_LOOP`

**Called:** Before autonomous loop starts

**Parameters:** None

**Return codes:**
- `0` - Continue workflow
- `2` - Abort workflow

**Use case:** Initialization, setup checks, environment validation

**Example:**
```bash
CUSTOM_HOOK_BEFORE_LOOP() {
    # Verify external dependencies are available
    if ! command -v my-custom-tool >/dev/null; then
        echo "ERROR: my-custom-tool not found"
        return 2  # Abort workflow
    fi

    # Initialize custom state
    export MY_CUSTOM_STATE="ready"
    return 0
}
```

#### Hook 2: `CUSTOM_HOOK_BEFORE_CHECK`

**Called:** Before agent status check (each iteration)

**Parameters:**
1. `iteration` - Current iteration number (integer)
2. `last_assign_status` - Status of last assignment (0=success, 1=no beads)

**Return codes:**
- `0` - Continue to agent checks
- `1` - Skip agent checks this iteration

**Use case:** Conditional checks, iteration-specific logic

**Example:**
```bash
CUSTOM_HOOK_BEFORE_CHECK() {
    local iteration="$1"
    local last_status="$2"

    # Skip checks every 10 iterations
    if [[ $((iteration % 10)) -eq 0 ]]; then
        echo "Skipping checks on iteration $iteration"
        return 1
    fi

    return 0
}
```

#### Hook 3: `CUSTOM_HOOK_BEFORE_ASSIGN`

**Called:** Before assigning a bead to an agent

**Parameters:**
1. `bead_id` - ID of bead being assigned
2. `ready_beads` - JSON array of all ready bead IDs

**Return codes:**
- `0` - Allow assignment
- `1` - Skip this bead (try next bead)
- `2` - Abort all assignments (exit assignment cycle)

**Use case:** Bead filtering, priority assignment, custom routing logic

**Example:**
```bash
CUSTOM_HOOK_BEFORE_ASSIGN() {
    local bead_id="$1"
    local ready_beads="$2"

    # Skip beads marked as "experimental"
    if bd show "$bead_id" 2>/dev/null | grep -q "tag:experimental"; then
        echo "Skipping experimental bead: $bead_id"
        return 1  # Skip this bead
    fi

    # Stop if system load is too high
    local load_avg=$(uptime | awk '{print $10}' | cut -d, -f1)
    if (( $(echo "$load_avg > 8.0" | bc -l) )); then
        echo "System load too high, stopping assignments"
        return 2  # Abort all assignments
    fi

    return 0
}
```

#### Hook 4: `CUSTOM_HOOK_AFTER_ASSIGN`

**Called:** After successful bead assignment

**Parameters:**
1. `bead_id` - ID of assigned bead
2. `agent_name` - Name of agent receiving bead
3. `pane` - Pane index where agent is running
4. `skill_instruction` - Skill/command sent to agent

**Return codes:**
- `0` - Assignment confirmed
- `non-zero` - Assignment failed, rollback (remove from cooldown)

**Use case:** Assignment tracking, notifications, rollback on failure

**Example:**
```bash
CUSTOM_HOOK_AFTER_ASSIGN() {
    local bead_id="$1"
    local agent_name="$2"
    local pane="$3"
    local skill="$4"

    # Log assignment to external system
    log_assignment "$bead_id" "$agent_name" "$skill" || {
        echo "Failed to log assignment, rolling back"
        return 1
    }

    # Send notification
    notify_slack "Assigned $bead_id to $agent_name"
    return 0
}
```

#### Hook 5: `CUSTOM_HOOK_CUSTOM_BEAD`

**Called:** When a bead is about to be assigned (can intercept)

**Parameters:**
1. `bead_id` - ID of bead being assigned
2. `bead_title` - Title of the bead
3. `bead_labels` - JSON array of bead labels

**Return codes:**
- `0` - Hook handled the bead (skip default assignment)
- `1` - Hook didn't handle it (use default assignment)

**Use case:** Custom bead handling, special routing, external processing

**Example:**
```bash
CUSTOM_HOOK_CUSTOM_BEAD() {
    local bead_id="$1"
    local bead_title="$2"
    local bead_labels="$3"

    # Handle "deployment" beads specially
    if echo "$bead_title" | grep -qi "deploy"; then
        echo "Custom handling for deployment bead: $bead_id"

        # Send to special deployment agent
        send_to_deployment_agent "$bead_id"
        mark_bead_assigned "$bead_id"

        return 0  # Handled by hook
    fi

    return 1  # Use default assignment
}
```

#### Hook 6: `CUSTOM_HOOK_AGENT_PROMPT`

**Called:** Before sending command to agent pane

**Parameters:**
1. `pane` - Pane index
2. `command` - Command to be sent

**Return codes:** None

**Output:** Echoes modified command (or original)

**Use case:** Command transformation, logging, command interception

**Example:**
```bash
CUSTOM_HOOK_AGENT_PROMPT() {
    local pane="$1"
    local command="$2"

    # Log all commands sent to agents
    echo "[$(date)] Sending to pane $pane: $command" >> /tmp/agent-commands.log

    # Modify command for specific panes
    if [[ "$pane" == "2" ]]; then
        command="time $command"  # Add timing
    fi

    echo "$command"  # Return (possibly modified) command
}
```

#### Hook 7: `CUSTOM_HOOK_AFTER_CHECK`

**Called:** After agent status check completes

**Parameters:**
1. `iteration` - Current iteration number
2. `blocked_agents` - JSON array of blocked agent info

**Return codes:**
- `0` - Continue workflow
- `2` - Abort workflow loop

**Use case:** Post-check processing, aggregation, abort on conditions

**Example:**
```bash
CUSTOM_HOOK_AFTER_CHECK() {
    local iteration="$1"
    local blocked_agents="$2"

    # Count blocked agents
    local blocked_count=$(echo "$blocked_agents" | jq 'length')

    if [[ $blocked_count -gt 2 ]]; then
        echo "Too many blocked agents ($blocked_count), aborting"
        return 2  # Abort workflow
    fi

    return 0
}
```

#### Hook 8: `CUSTOM_HOOK_ERROR_HANDLER`

**Called:** When error occurs in autonomous_loop

**Parameters:**
1. `line_number` - Line where error occurred
2. `error_message` - Error message
3. `context` - Function where error occurred

**Return codes:** None (always continues)

**Use case:** Error logging, alerting, cleanup

**Example:**
```bash
CUSTOM_HOOK_ERROR_HANDLER() {
    local line_number="$1"
    local error_message="$2"
    local context="$3"

    # Log error details
    echo "ERROR in $context at line $line_number: $error_message" >> /tmp/workflow-errors.log

    # Send alert
    send_alert "Workflow error: $error_message"

    # Cleanup if needed
    cleanup_temp_files

    return 0
}
```

### Hook Execution Order

```
1. CUSTOM_HOOK_BEFORE_LOOP     (once, at start)
   |
2. CUSTOM_HOOK_BEFORE_ASSIGN   (for each bead)
   |
3. CUSTOM_HOOK_AGENT_PROMPT    (for each command sent)
   |
4. CUSTOM_HOOK_AFTER_ASSIGN    (after successful assignment)
   |
5. CUSTOM_HOOK_BEFORE_CHECK    (each iteration)
   |
6. (Agent checks performed)
   |
7. CUSTOM_HOOK_AFTER_CHECK     (each iteration)
   |
8. CUSTOM_HOOK_ERROR_HANDLER   (on error, any time)
```

### Integration with autonomous-workflow.sh

The hooks system is integrated into `maf/scripts/maf/autonomous-workflow.sh`:

```bash
# Hook file is sourced here (lines 26-31)
CUSTOM_HOOKS_FILE="${PROJECT_ROOT}/.maf/config/custom-workflow-hooks.sh"
if [[ -f "$CUSTOM_HOOKS_FILE" ]]; then
  source "$CUSTOM_HOOKS_FILE"
  echo "Loaded custom workflow hooks from $CUSTOM_HOOKS_FILE" >&2
fi
```

Each hook is called conditionally:

```bash
# Example: BEFORE_ASSIGN hook (lines 277-289)
if declare -f CUSTOM_HOOK_BEFORE_ASSIGN >/dev/null; then
  CUSTOM_HOOK_BEFORE_ASSIGN "$assigned_bead" "$beads"
  local hook_result=$?
  if [[ $hook_result -eq 1 ]]; then
    log "CUSTOM_HOOK_BEFORE_ASSIGN skipped $assigned_bead"
    assigned_bead=""
    continue  # Skip to next bead
  elif [[ $hook_result -eq 2 ]]; then
    log "CUSTOM_HOOK_BEFORE_ASSIGN aborted all assignments"
    return 1
  fi
fi
```

### Best Practices

1. **Always check function existence before calling**
   ```bash
   if declare -f CUSTOM_HOOK_MY_HOOK >/dev/null; then
       CUSTOM_HOOK_MY_HOOK "$arg1" "$arg2"
   fi
   ```

2. **Use descriptive hook names that match MAF conventions**
   - Prefix with `CUSTOM_HOOK_`
   - Use uppercase names
   - Separate words with underscores

3. **Document custom hooks thoroughly**
   ```bash
   #!/bin/bash
   # Custom workflow hooks for [franchisee name]
   # Created: 2026-01-27
   # Purpose: [description]
   ```

4. **Test hooks in isolation before deployment**
   ```bash
   # Source and test individual hook
   source .maf/config/custom-workflow-hooks.sh
   CUSTOM_HOOK_BEFORE_LOOP
   echo "Exit code: $?"
   ```

5. **Handle errors gracefully**
   ```bash
   CUSTOM_HOOK_MY_FUNCTION() {
       # Use || true to prevent hook from crashing workflow
       risky_operation || true
       return 0  # Always return 0 unless intentionally aborting
   }
   ```

6. **Log hook activity for debugging**
   ```bash
   CUSTOM_HOOK_MY_FUNCTION() {
       echo "[$(date)] CUSTOM_HOOK_MY_FUNCTION called with args: $@" >&2
       # ... hook logic ...
   }
   ```

### Testing Hooks

Use the provided test suite to verify hook functionality:

```bash
# Run workflow hook tests
bash tests/workflow/test-hooks.sh

# Test with custom hooks file
export MAF_SKIP_PREFLIGHT=true
bash maf/scripts/maf/autonomous-workflow.sh --once
```

### Migration from Custom Scripts

If you have a custom autonomous workflow script, migration is straightforward:

1. **Extract custom logic** into hook functions
2. **Create `.maf/config/custom-workflow-hooks.sh`**
3. **Remove custom script** (use MAF's autonomous-workflow.sh instead)

**Before (custom script):**
```bash
# experiments/my-autonomous-workflow.sh
# ... custom logic mixed with MAF logic ...
```

**After (hooks-based):**
```bash
# .maf/config/custom-workflow-hooks.sh
CUSTOM_HOOK_BEFORE_ASSIGN() {
    # Your custom logic here
    if should_skip_bead "$1"; then
        return 1  # Skip
    fi
    return 0
}

# Use MAF's standard workflow
bash maf/scripts/maf/autonomous-workflow.sh --loop
```

### Troubleshooting

**Hook not being called:**
- Verify hook file is executable: `chmod +x .maf/config/custom-workflow-hooks.sh`
- Check function name matches exactly (case-sensitive)
- Ensure hook file has no syntax errors: `bash -n .maf/config/custom-workflow-hooks.sh`

**Workflow aborting unexpectedly:**
- Check hook return codes (return 2 aborts workflow)
- Add logging to hooks to trace execution
- Test hooks in isolation: `source .maf/config/custom-workflow-hooks.sh`

**Hook function not found:**
- Verify function is defined: `declare -f CUSTOM_HOOK_MY_HOOK`
- Check hook file was sourced: look for "Loaded custom workflow hooks" message
- Ensure hook file has proper shebang: `#!/bin/bash`

### Benefits

1. **Forward Compatibility** - Hooks survive MAF updates
2. **Isolation** - Custom logic separate from MAF core
3. **Testability** - Hooks can be tested independently
4. **Upgrade Safety** - MAF updates never overwrite custom hooks
5. **Standard Interface** - Consistent hook API across franchisees
6. **Optional** - No hooks required for basic operation

### See Also

- [maf/scripts/maf/autonomous-workflow.sh](../maf/scripts/maf/autonomous-workflow.sh) - Main workflow script
- [tests/workflow/test-hooks.sh](../tests/workflow/test-hooks.sh) - Hook test suite
- [Preflight Validation System](#preflight-validation-system) - Environment validation

## Security Considerations

### Threat Model

**Assumptions:**
- Vendor repositories (agent-mail, superpowers) are trusted sources
- Franchisees may have malicious intent when applying custom patches
- Git subtree updates could introduce compromised code
- Patch system could be exploited to modify MAF-controlled files

**Attack Vectors:**
1. **Compromised Vendor Update** - Upstream repository hacked, malicious code pulled via `git subtree pull`
2. **Patch Injection** - Franchisee patch modifies MAF security controls
3. **Manifest Tampering** - `.maf-manifest.json` modified to expand MAF control over franchisee files
4. **Script Injection** - Init/update scripts execute arbitrary code during setup
5. **Credential Leakage** - Restore points contain sensitive credentials

### Security Invariants

**MUST NEVER:**
- Vendor code MUST NEVER execute during patch application (patches are text-only)
- MAF updates MUST NEVER modify franchisee-owned files in `.claude/`
- Update scripts MUST NEVER execute without user confirmation
- Restore points MUST NEVER contain plaintext credentials (sanitize before backup)
- Vendor subtrees MUST NEVER have write access to `.maf/` configuration

**MUST ALWAYS:**
- Patch application MUST ALWAYS run in dry-run mode first (`patch --dry-run`)
- Manifest merge MUST ALWAYS preserve franchisee customizations
- Rollback MUST ALWAYS stop running agents before restore
- Subtree updates MUST ALWAYS create restore points before pulling
- Health checks MUST ALWAYS validate subtree integrity after update

## Performance Considerations

### Performance Budgets

**Subtree Operations:**
- `git subtree add`: ≤30 seconds for typical vendor (agent-mail)
- `git subtree pull`: ≤60 seconds for typical update
- Patch application: ≤10 seconds per patch

**Script Execution:**
- `franchisee-init.sh`: ≤5 minutes for full initialization
- `franchisee-update.sh`: ≤3 minutes for MAF+vendor update
- `health-check.sh`: ≤30 seconds

### Intentionally NOT Optimized

- Subtree update performance: Acceptable as-is (git subtree is inherently slow)
- Patch application speed: Linear with patch count (acceptable for <20 patches)
- Manifest scanning: O(n) file traversal (acceptable for typical .claude/ size)

**Rationale:** Vendor operations are infrequent (weekly/monthly), so optimization effort not justified. Focus on reliability and correctness over speed.

## Troubleshooting

### Issue: Subtree Update Fails

**Symptom:** `git subtree pull` fails with merge conflicts

**Solution:**
```bash
# 1. Roll back to restore point
bash scripts/franchisee-rollback.sh .maf.restore.LATEST

# 2. Try update again with clean state
git subtree pull --prefix=vendor/agent-mail <url> main --squash
```

### Issue: Patch Won't Apply

**Symptom:** Patch fails with "patch does not apply"

**Solution:**
```bash
# 1. Check what changed in vendor
cd vendor/agent-mail
git log --oneline -10

# 2. Manually resolve conflicts
patch -p1 < ../../.maf/patches/vendor-agent-mail/0001-custom.patch

# 3. Fix conflicts, regenerate patch
git diff > ../../.maf/patches/vendor-agent-mail/0001-custom.patch
```

### Issue: .Claude Merge Deletes Custom Files

**Symptom:** Franchisee's custom files disappear after MAF update

**Solution:**
```bash
# 1. Restore from backup
cp -r .claude.backup.TIMESTAMP/* .claude/

# 2. Add custom files to franchisee_files array in manifest
vim .claude/.maf-manifest.json

# 3. Re-run merge
bash maf/scripts/maf/merge-claude.sh
```

## See Also

- [FRANCHISEE_GUIDE.md](FRANCHISEE_GUIDE.md) - Non-technical guide for franchisees
- [SETUP.md](../SETUP.md) - Complete setup guide
- [README.md](../README.md) - MAF overview
- [scripts/franchisee-init.sh](../scripts/franchisee-init.sh) - Init script
- [scripts/franchisee-update.sh](../scripts/franchisee-update.sh) - Update script
- [scripts/maf/contrib.sh](../scripts/maf/contrib.sh) - Contribute changes to MAF HQ
- [scripts/maf/vendor-patch-create.sh](../scripts/maf/vendor-patch-create.sh) - Patch creation
- [scripts/maf/merge-claude.sh](../scripts/maf/merge-claude.sh) - Claude merge logic
