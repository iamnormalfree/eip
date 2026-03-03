# Franchisee Preflight Validation System

**Status:** Design Approved
**Created:** 2026-01-26
**Author:** Claude (brainstorming session)
**Issue:** Prevents Agent Mail name mismatches and ensures franchisee setup compliance

## Overview

The franchisee preflight validation system is a **validation gateway** that sits between MAF HQ scripts and execution. It ensures the franchisee environment is properly configured before any MAF operations run, preventing issues like the Agent Mail name mismatch that caused task pickup failures.

## Problem Statement

**Root Cause Analysis:**
- `autonomous-workflow-nextnest.sh` had hardcoded Agent Mail names (OrangeDog, PurpleBear, etc.)
- Franchisee `agent-topology.json` had different names (PinkCastle, LilacStone, etc.)
- MAF workflow sent messages to non-existent mailboxes
- No validation prevented this mismatch

**Broader Issue:**
- No systematic validation of franchisee setup
- MAF HQ files can be modified directly (bypassing patch system)
- No guidance on proper customization channels
- Hardcoded values instead of reading from topology

## Solution Architecture

### Core Components

1. **Preflight Gatekeeper Library** (`maf/scripts/maf/preflight-gatekeeper.sh`)
   - Single source of truth for all validation logic
   - Sourced by every MAF entry point script
   - Runs critical and advisory checks
   - Returns structured exit codes

2. **Topology Validator** (embedded in gatekeeper)
   - Reads `.maf/config/agent-topology.json`
   - Validates structure and required fields
   - Dynamically provides Agent Mail names to scripts (eliminates hardcoding)

3. **MAF HQ File Protector** (embedded in gatekeeper)
   - Uses `.maf-manifest.json` to track MAF-owned files
   - Detects unauthorized modifications
   - Provides clear guidance on proper customization channels

4. **Franchisee Extension Point** (`.maf/config/custom-preflight-checks.sh`)
   - Optional franchisee-specific validations
   - Doesn't conflict with MAF HQ updates

### Execution Flow

```
MAF script starts
    ↓
Sources preflight-gatekeeper.sh
    ↓
Runs validation checks
    ↓
    ├─ Critical fail → Exit with error + fix hint
    ├─ Advisory fail → Warn + continue
    └─ All pass → Script executes normally
```

## Validation Rules

### Critical Checks (BLOCK execution)

| Check | Description | Error Code |
|-------|-------------|------------|
| Topology exists | `.maf/config/agent-topology.json` found | `TOPOLOGY_MISSING` |
| Topology valid | File is valid JSON | `TOPOLOGY_MALFORMED` |
| Required fields | `panes`, `role_to_pane`, `alias_to_pane` present | `TOPOLOGY_INCOMPLETE` |
| Agent Mail coverage | Each pane has `mail_name` defined | `MAIL_NAME_MISSING` |
| Subtree integrity | MAF subtree not diverged (if applicable) | `SUBTREE_DIVERGED` |

### Advisory Checks (WARN only)

| Check | Description | Warning Code |
|-------|-------------|--------------|
| HQ files modified | MAF-owned files have uncommitted changes | `HQ_FILES_MODIFIED` |
| Optional tools | Beads CLI or other nice-to-have tools missing | `BEADS_CLI_MISSING` |
| Custom checks | Franchisee-specific warnings | Various |

## Topology Helper Functions

Scripts should read Agent Mail names from topology rather than hardcoding:

```bash
# Get Agent Mail name by pane index
get_mail_name_by_pane 0  # Returns supervisor's mail_name

# Get Agent Mail name by role
get_mail_name_by_role "supervisor"

# Get agent name by pane
get_agent_name_by_pane 2  # Returns "LedgerLeap"

# Get pane index by role
get_pane_by_role "implementor-1"  # Returns 2
```

### Before (Hardcoded - WRONG)
```bash
get_agent_mail_name() {
  case "$1" in
    0) echo "OrangeDog" ;;      # Wrong!
    1) echo "PurpleBear" ;;
    2) echo "RedPond" ;;
    3) echo "PinkStone" ;;
  esac
}
```

### After (Topology-driven - CORRECT)
```bash
get_agent_mail_name() {
  get_mail_name_by_pane "$1"
}
# Returns correct names from topology automatically
```

## MAF Manifest Structure

The `.maf-manifest.json` file tracks file ownership:

```json
{
  "$schema": "./maf-manifest-schema.json",
  "version": "1.0.0",
  "maf_updated": "2025-01-26T00:00:00Z",
  "maf_owned": [
    "maf/docs/maf-constitution.md",
    "maf/scripts/maf/preflight-coordinator.ts",
    "maf/scripts/maf/autonomous-agents.sh"
  ],
  "franchisee_owned": [
    ".maf/config/agent-topology.json",
    ".maf/config/custom-preflight-checks.sh"
  ],
  "vendor_owned": [
    "vendor/agent-mail/",
    "vendor/superpowers/"
  ],
  "protected_patterns": [
    "maf/lib/**/*.sh",
    "maf/docs/**/*.md"
  ]
}
```

## Script Integration Pattern

Every MAF entry point integrates preflight validation:

```bash
#!/bin/bash
# ABOUTME: Script description

# Preflight validation - MUST be first
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/preflight-gatekeeper.sh" || {
  echo "ERROR: Failed to load preflight gatekeeper" >&2
  exit 2
}

# Run preflight checks
preflight_init || exit $?

# Rest of script continues...
```

## Error Reporting Format

```
❌ CRITICAL: agent-topology.json not found
   Fix: Create .maf/config/agent-topology.json or set MAF_TOPOLOGY_FILE
   Run: bash scripts/franchisee-init.sh

⚠️  WARNING: MAF HQ files modified: maf/docs/maf-constitution.md
   See: docs/VENDOR_ARCHITECTURE.md for proper customization channels
   Use: bash maf/scripts/maf/vendor-patch-create.sh

✅ Preflight checks passed (2 warnings)
```

## Proper Customization Channels

When franchisees need to modify MAF HQ behavior:

| Need | Channel |
|------|---------|
| Small code changes | Patch system (`vendor-patch-create.sh`) |
| Workflow customization | Create `scripts/maf/custom-workflow-*.sh` |
| Configuration | Edit `.maf/config/agent-topology.json` |
| Additional checks | Edit `.maf/config/custom-preflight-checks.sh` |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Critical check failed |
| 2 | Preflight system error |
| 3 | Invalid arguments |

## Files to Create/Modify

### New Files
1. `maf/scripts/maf/preflight-gatekeeper.sh` - Main validation library
2. `.maf-manifest.json` - File ownership tracking
3. `.maf-manifest-schema.json` - Manifest JSON schema
4. `docs/VENDOR_ARCHITECTURE.md` - Update with preflight info

### Files to Modify
1. `experiments/autonomous-workflow-nextnest.sh` - Refactor to use topology
2. `maf/scripts/maf/autonomous-agents.sh` - Add preflight integration
3. `scripts/franchisee-init.sh` - Generate initial `.maf-manifest.json`
4. All MAF entry point scripts - Add preflight gatekeeper sourcing

## Testing Strategy

1. **Unit Tests**: Test individual check functions
2. **Integration Tests**: Test full preflight flow
3. **Franchisee Tests**: Test in actual franchisee environment
4. **Negative Tests**: Verify errors are caught and reported clearly

## Success Criteria

- ✅ Agent Mail name mismatches are prevented
- ✅ Topology validation runs before MAF operations
- ✅ Clear error messages guide franchisees to fixes
- ✅ MAF HQ file modifications are detected and warned
- ✅ Franchisees can extend with custom checks
- ✅ No breaking changes to existing franchisees

## Future Enhancements

1. Auto-fix capability for common issues
2. Interactive mode for resolving failures
3. Pre-commit hook integration
4. npm script wrapper for easier usage
5. Web UI for preflight status dashboard
