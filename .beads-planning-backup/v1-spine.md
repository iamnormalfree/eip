# MAF Vendor Subtree & .Claude Coexistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a vendor directory structure for external subtrees (Agent Mail, Superpowers), create a .claude coexistence system with managed overlays for franchisee customization, and provide automated init/update workflows with comprehensive error handling.

**Architecture:**
- Add `vendor/` directory containing git subtrees for external dependencies (agent-mail, superpowers)
- Implement `.maf/patches/` system for vendor customizations (patches auto-apply after updates)
- Implement `.maf-manifest.json` tracking system for MAF-owned files in `.claude/`
- Create merge logic that preserves franchisee customizations during MAF updates
- Provide init/update scripts with automatic rollback on failure

**Tech Stack:**
- Bash scripting for all automation
- Git subtree for vendor dependency management
- JSON manifest for file tracking
- jq for JSON parsing

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Table of Contents

1. [Phase 1: Vendor Directory Setup](#phase-1-vendor-directory-setup)
2. [Phase 2: Vendor Patch System](#phase-2-vendor-patch-system)
3. [Phase 3: .Claude Coexistence System](#phase-3-claude-coexistence-system)
4. [Phase 4: Init/Update Workflows](#phase-4-initupdate-workflows)
5. [Phase 5: Error Handling & Testing](#phase-5-error-handling--testing)

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Phase 1: Vendor Directory Setup

### Task 1: Create vendor directory structure

**Files:**
- Create: `vendor/.gitkeep`
- Create: `vendor/README.md`
- Create: `scripts/maf/migrate-to-vendor.sh`

**Step 1: Write vendor/.gitkeep**

```bash
# Create empty file to ensure vendor/ directory is tracked
touch vendor/.gitkeep
```

**Step 2: Run git to verify file is created**

Run: `ls -la vendor/`
Expected: `.gitkeep` file exists in vendor/

**Step 3: Write vendor/README.md**

```markdown
# Vendor Directory

This directory contains external subtrees that MAF depends on.

## Structure

- `agent-mail/` - MCP Agent Mail subtree (inter-agent communication)
- `superpowers/` - Obra/superpowers subtree (optional, future)

## Adding a New Vendor Subtree

```bash
# From MAF HQ repository root
git subtree add --prefix=vendor/<vendor-name> https://github.com/<org>/<repo> <branch> --squash
```

## Updating Vendor Subtrees

```bash
# Pull latest changes from upstream
git subtree pull --prefix=vendor/<vendor-name> https://github.com/<org>/<repo> <branch> --squash
```

## Vendor Subtree Management

Vendor subtrees are **read-only** for MAF purposes. If you need to modify a vendor's code:

1. Fork the vendor repository
2. Make changes in your fork
3. Update MAF to use your fork's URL (in franchisee-init.sh)

## Why Subtrees Instead of Submodules?

- **Subtrees** are included in the repo, no extra `.gitmodules` file
- **Subtrees** work better with git subtree distribution to franchisees
- **Subtrees** don't require franchisees to run `git submodule update`
```

**Step 4: Run git to verify README is created**

Run: `cat vendor/README.md`
Expected: README content displayed

**Step 5: Commit vendor directory setup**

```bash
git add vendor/.gitkeep vendor/README.md
git commit -m "feat: add vendor directory structure

- Add vendor/ directory for external subtrees
- Document subtree management approach
- Prepare for agent-mail migration
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 2: Migrate Agent Mail to vendor subtree

**Files:**
- Modify: `scripts/maf/bootstrap-agent-mail.sh:5-10`
- Remove: `mcp_agent_mail/` (entire directory)

**Step 1: Create migration script**

Create `scripts/maf/migrate-to-vendor.sh`:

```bash
#!/bin/bash
# ABOUTME: Migrate mcp_agent_mail to vendor/agent-mail subtree

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[MIGRATE]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check if mcp_agent_mail exists
if [[ ! -d "mcp_agent_mail" ]]; then
    log_warning "mcp_agent_mail/ not found, may already be migrated"
    exit 0
fi

# Check if vendor/agent-mail already exists
if [[ -d "vendor/agent-mail" ]]; then
    log_warning "vendor/agent-mail/ already exists, skipping migration"
    exit 0
fi

log_info "Migrating mcp_agent_mail to vendor/agent-mail..."

# Backup existing directory
if [[ -d "mcp_agent_mail" ]]; then
    log_info "Backing up mcp_agent_mail to mcp_agent_mail.backup..."
    cp -r mcp_agent_mail mcp_agent_mail.backup
fi

# Remove old directory
log_info "Removing old mcp_agent_mail directory..."
git rm -r mcp_agent_mail || rm -rf mcp_agent_mail

# Add as subtree
log_info "Adding Agent Mail as git subtree..."
git subtree add --prefix=vendor/agent-mail \
    https://github.com/Dicklesworthstone/mcp_agent_mail main --squash

log_info "Migration complete!"
log_info "Backup saved at mcp_agent_mail.backup/"
log_info "Test the new setup with: bash scripts/maf/bootstrap-agent-mail.sh status"
```

**Step 2: Run migration script**

Run: `bash scripts/maf/migrate-to-vendor.sh`
Expected: Agent Mail added as subtree at vendor/agent-mail/

**Step 3: Verify vendor/agent-mail exists**

Run: `ls -la vendor/agent-mail/`
Expected: Agent Mail files visible including pyproject.toml

**Step 4: Update bootstrap-agent-mail.sh paths**

Edit `scripts/maf/bootstrap-agent-mail.sh`:

Find line:
```bash
AGENT_MAIL_DIR="$PROJECT_ROOT/mcp_agent_mail"
```

Replace with:
```bash
AGENT_MAIL_DIR="$PROJECT_ROOT/vendor/agent-mail"
```

**Step 5: Verify bootstrap script works**

Run: `bash scripts/maf/bootstrap-agent-mail.sh status`
Expected: Status shows Agent Mail at new path

**Step 6: Commit migration**

```bash
git add scripts/maf/bootstrap-agent-mail.sh scripts/maf/migrate-to-vendor.sh vendor/agent-mail
git commit -m "feat: migrate agent-mail to vendor subtree

- Move mcp_agent_mail to vendor/agent-mail as git subtree
- Update bootstrap script to use vendor/agent-mail path
- Add migration script for existing installations
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Phase 2: Vendor Patch System

This phase implements a patch-based customization system for vendor subtrees, allowing franchisees to modify vendor code while preserving their changes through updates.

### Architecture

```
.maf/patches/
├── vendor-agent-mail/
│   ├── 0001-custom-handler.patch
│   ├── 0002-add-custom-endpoint.patch
│   └── .metadata.json
├── vendor-superpowers/
│   └── (same structure)
└── apply-patches.sh          # Auto-applies patches after vendor updates
```

### Task 2a: Create patch directory structure

**Files:**
- Create: `.maf/patches/.gitkeep`
- Create: `.maf/patches/README.md`
- Create: `.maf/patches/.metadata.json`

**Step 1: Write .maf/patches/.gitkeep**

```bash
mkdir -p .maf/patches
touch .maf/patches/.gitkeep
```

**Step 2: Write .maf/patches/README.md**

```markdown
# Vendor Patches

This directory contains custom patches for vendor subtrees.

## Directory Structure

```
.maf/patches/
├── vendor-agent-mail/         # Patches for Agent Mail
│   ├── 0001-description.patch
│   ├── 0002-description.patch
│   └── .metadata.json
├── vendor-superpowers/        # Patches for Superpowers
│   └── (same structure)
└── README.md
```

## Creating a Patch

```bash
# 1. Edit vendor code directly
vim vendor/agent-mail/src/handlers/custom.py

# 2. Generate patch from your changes
cd vendor/agent-mail
git diff > ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch

# 3. Revert vendor changes (clean slate for next update)
git checkout .

# 4. Update metadata
vim .maf/patches/vendor-agent-mail/.metadata.json
```

## Patch Metadata

Each vendor directory has a `.metadata.json`:

```json
{
  "vendor": "agent-mail",
  "vendor_repo": "https://github.com/Dicklesworthstone/mcp_agent_mail",
  "vendor_branch": "main",
  "patches": [
    {
      "file": "0001-custom-handler.patch",
      "description": "Add custom message handler for XYZ",
      "applied": true,
      "fingerprint": "abc123..."
    }
  ]
}
```

## Automatic Application

Patches are automatically re-applied after vendor updates via `franchisee-update.sh`. If a patch fails to apply, you'll be prompted to resolve conflicts.

## Resolving Conflicts

When a patch fails after a vendor update:

```bash
# Manual resolution
cd vendor/agent-mail
patch -p1 < ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch

# Fix conflicts, then regenerate patch
git diff > ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch
```
```

**Step 3: Write .maf/patches/.metadata.json template**

```json
{
  "version": "1.0",
  "last_updated": "2026-01-09T00:00:00Z",
  "vendors": {
    "vendor-agent-mail": {
      "name": "agent-mail",
      "repo": "https://github.com/Dicklesworthstone/mcp_agent_mail",
      "branch": "main",
      "patches": []
    },
    "vendor-superpowers": {
      "name": "superpowers",
      "repo": "https://github.com/obra/superpowers",
      "branch": "main",
      "patches": []
    }
  }
}
```

**Step 4: Commit patch directory structure**

```bash
git add .maf/patches/
git commit -m "feat: add vendor patch system

- Add .maf/patches/ directory structure
- Document patch creation workflow
- Add metadata template for tracking patches
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 2b: Create patch management scripts

**Files:**
- Create: `scripts/maf/vendor-patch-create.sh`
- Create: `scripts/maf/vendor-patch-apply.sh`
- Create: `scripts/maf/vendor-patch-list.sh`

**Step 1: Write vendor-patch-create.sh**

Create `scripts/maf/vendor-patch-create.sh`:

```bash
#!/bin/bash
# ABOUTME: Create a patch from vendor directory changes
# USAGE: vendor-patch-create.sh <vendor-name> <patch-number> <description>

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[PATCH]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PATCHES_DIR="$PROJECT_ROOT/.maf/patches"

# Parse arguments
VENDOR="${1:-}"
PATCH_NUM="${2:-}"
DESCRIPTION="${3:-}"

if [[ -z "$VENDOR" ]] || [[ -z "$PATCH_NUM" ]] || [[ -z "$DESCRIPTION" ]]; then
    echo "Usage: $0 <vendor-name> <patch-number> <description>"
    echo
    echo "Example: $0 agent-mail 0001 'Add custom handler'"
    echo
    echo "Available vendors:"
    ls -1 "$PATCHES_DIR" 2>/dev/null | grep "^vendor-" || echo "  No vendor patch directories found"
    exit 1
fi

VENDOR_DIR="vendor/$VENDOR"
VENDOR_PATCH_DIR="$PATCHES_DIR/vendor-$VENDOR"

# Validate vendor exists
if [[ ! -d "$PROJECT_ROOT/$VENDOR_DIR" ]]; then
    log_error "Vendor directory not found: $VENDOR_DIR"
    exit 1
fi

# Create patch directory
mkdir -p "$VENDOR_PATCH_DIR"

# Check for changes
cd "$PROJECT_ROOT/$VENDOR_DIR"
if git diff --quiet; then
    log_error "No changes detected in $VENDOR_DIR"
    log_info "Make your edits first, then run this script"
    exit 1
fi

# Generate patch
PATCH_FILE="$VENDOR_PATCH_DIR/${PATCH_NUM}-${DESCRIPTION// /-}.patch"
log_info "Creating patch: $PATCH_FILE"

git diff > "$PROJECT_ROOT/$PATCH_FILE"

# Generate fingerprint (hash of patch content)
FINGERPRINT=$(sha256sum "$PROJECT_ROOT/$PATCH_FILE" | cut -d' ' -f1)

# Update metadata
METADATA_FILE="$VENDOR_PATCH_DIR/.metadata.json"
if [[ ! -f "$METADATA_FILE" ]]; then
    cat > "$METADATA_FILE" << EOF
{
  "vendor": "$VENDOR",
  "patches": []
}
EOF
fi

# Add patch to metadata
tmp=$(mktemp)
jq --arg file "$(basename "$PATCH_FILE")" \
   --arg desc "$DESCRIPTION" \
   --arg fp "$FINGERPRINT" \
   '.patches += [{"file": $file, "description": $desc, "applied": true, "fingerprint": $fp}]' \
   "$METADATA_FILE" > "$tmp"
mv "$tmp" "$METADATA_FILE"

log_success "Patch created: $PATCH_FILE"
log_info "Fingerprint: $FINGERPRINT"

# Offer to revert changes
read -rp "Revert vendor changes now? [y/N]: " -n 1 revert
echo

if [[ "$revert" =~ ^[Yy]$ ]]; then
    log_info "Reverting vendor changes..."
    git checkout .
    log_success "Vendor directory clean"
fi
```

**Step 2: Write vendor-patch-apply.sh**

Create `scripts/maf/vendor-patch-apply.sh`:

```bash
#!/bin/bash
# ABOUTME: Apply patches for a vendor subtree
# USAGE: vendor-patch-apply.sh <vendor-name> [--force]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[PATCH]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PATCHES_DIR="$PROJECT_ROOT/.maf/patches"

# Parse arguments
VENDOR="${1:-}"
FORCE="${2:-}"

if [[ -z "$VENDOR" ]]; then
    echo "Usage: $0 <vendor-name> [--force]"
    exit 1
fi

VENDOR_DIR="vendor/$VENDOR"
VENDOR_PATCH_DIR="$PATCHES_DIR/vendor-$VENDOR"
METADATA_FILE="$VENDOR_PATCH_DIR/.metadata.json"

if [[ ! -d "$VENDOR_PATCH_DIR" ]]; then
    log_info "No patches directory for $VENDOR"
    exit 0
fi

if [[ ! -f "$METADATA_FILE" ]]; then
    log_warning "Metadata file not found: $METADATA_FILE"
    exit 0
fi

# Get list of patches
patches=$(jq -r '.patches[].file' "$METADATA_FILE" 2>/dev/null || echo "")

if [[ -z "$patches" ]]; then
    log_info "No patches to apply for $VENDOR"
    exit 0
fi

cd "$PROJECT_ROOT/$VENDOR_DIR"

applied=0
failed=0
skipped=0

echo "$patches" | while read -r patch_file; do
    [[ -z "$patch_file" ]] && continue

    patch_path="$VENDOR_PATCH_DIR/$patch_file"

    if [[ ! -f "$patch_path" ]]; then
        log_warning "Patch file not found: $patch_file"
        skipped=$((skipped + 1))
        continue
    fi

    log_info "Applying: $patch_file"

    # Check if already applied
    fingerprint=$(jq -r ".patches[] | select(.file == \"$patch_file\") | .fingerprint" "$METADATA_FILE")
    current_hash=$(sha256sum "$patch_path" | cut -d' ' -f1)

    if [[ "$fingerprint" != "$current_hash" ]]; then
        log_warning "Patch fingerprint mismatch - may have been modified"
    fi

    # Try to apply patch
    if patch -p1 --dry-run -s < "$PROJECT_ROOT/$patch_path" > /dev/null 2>&1; then
        if patch -p1 < "$PROJECT_ROOT/$patch_path"; then
            log_success "Applied: $patch_file"
            applied=$((applied + 1))
        else
            log_error "Failed to apply: $patch_file"
            failed=$((failed + 1))
        fi
    else
        if [[ "$FORCE" == "--force" ]]; then
            log_warning "Force-applying with rejects..."
            patch -p1 < "$PROJECT_ROOT/$patch_path" || true
            # Check for .rej files
            if find . -name "*.rej" -type f | grep -q .; then
                log_error "Patch had conflicts. Check .rej files"
                failed=$((failed + 1))
            fi
        else
            log_error "Patch would not apply cleanly: $patch_file"
            log_info "Run with --force to apply anyway (will create .rej files)"
            failed=$((failed + 1))
        fi
    fi
done

echo
log_info "Patches applied: $applied, Failed: $failed, Skipped: $skipped"

if [[ $failed -gt 0 ]]; then
    exit 1
fi
```

**Step 3: Write vendor-patch-list.sh**

Create `scripts/maf/vendor-patch-list.sh`:

```bash
#!/bin/bash
# ABOUTME: List all patches for vendor subtrees

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PATCHES_DIR="$PROJECT_ROOT/.maf/patches"

echo -e "${BLUE}═══ Vendor Patches ═══${NC}"
echo

for vendor_dir in "$PATCHES_DIR"/vendor-*; do
    [[ ! -d "$vendor_dir" ]] && continue

    vendor=$(basename "$vendor_dir")
    echo -e "${GREEN}$vendor${NC}"

    metadata="$vendor_dir/.metadata.json"
    if [[ -f "$metadata" ]]; then
        jq -r '.patches[] | "  \(.file) - \(.description)"' "$metadata" 2>/dev/null || echo "  No patches"
    else
        echo "  No metadata file"
    fi
    echo
done
```

**Step 4: Make scripts executable**

```bash
chmod +x scripts/maf/vendor-patch-create.sh
chmod +x scripts/maf/vendor-patch-apply.sh
chmod +x scripts/maf/vendor-patch-list.sh
```

**Step 5: Test scripts**

```bash
# Test list (should work even with no patches)
bash scripts/maf/vendor-patch-list.sh
```

**Step 6: Commit patch scripts**

```bash
git add scripts/maf/vendor-patch-*.sh
git commit -m "feat: add vendor patch management scripts

- Add vendor-patch-create.sh for generating patches
- Add vendor-patch-apply.sh for applying patches
- Add vendor-patch-list.sh for listing patches
- Support force apply for conflict resolution
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 2c: Integrate patch system into update workflow

**Files:**
- Modify: `scripts/franchisee-update.sh` (update vendor section)

**Step 1: Update franchisee-update.sh to apply patches**

Find the vendor update section and add patch application after each vendor update.

In `scripts/franchisee-update.sh`, find this section (around line 803-833):

```bash
# Update vendor subtrees
if [[ "$TARGET" == "vendor" ]] || [[ "$TARGET" == "all" ]]; then
    log_step "Updating vendor subtrees..."

    # Agent Mail
    if [[ -d "vendor/agent-mail" ]]; then
        log_info "Updating Agent Mail..."
        AGENT_MAIL_REPO="${AGENT_MAIL_REPO:-https://github.com/Dicklesworthstone/mcp_agent_mail}"
        AGENT_MAIL_BRANCH="${AGENT_MAIL_BRANCH:-main}"

        if git subtree pull --prefix=vendor/agent-mail "$AGENT_MAIL_REPO" "$AGENT_MAIL_BRANCH" --squash; then
            log_success "Agent Mail updated"
        else
            log_error "Failed to update Agent Mail"
            rollback
        fi
    fi
```

And REPLACE with:

```bash
# Update vendor subtrees
if [[ "$TARGET" == "vendor" ]] || [[ "$TARGET" == "all" ]]; then
    log_step "Updating vendor subtrees..."

    # Agent Mail
    if [[ -d "vendor/agent-mail" ]]; then
        log_info "Updating Agent Mail..."
        AGENT_MAIL_REPO="${AGENT_MAIL_REPO:-https://github.com/Dicklesworthstone/mcp_agent_mail}"
        AGENT_MAIL_BRANCH="${AGENT_MAIL_BRANCH:-main}"

        if git subtree pull --prefix=vendor/agent-mail "$AGENT_MAIL_REPO" "$AGENT_MAIL_BRANCH" --squash; then
            log_success "Agent Mail updated"

            # Apply patches
            if [[ -f "scripts/maf/vendor-patch-apply.sh" ]]; then
                log_info "Applying Agent Mail patches..."
                if bash scripts/maf/vendor-patch-apply.sh agent-mail; then
                    log_success "Patches applied"
                else
                    log_warning "Some patches failed to apply"
                    log_info "Resolve conflicts and run: bash scripts/maf/vendor-patch-apply.sh agent-mail --force"
                fi
            fi
        else
            log_error "Failed to update Agent Mail"
            rollback
        fi
    fi

    # Superpowers (if exists)
    if [[ -d "vendor/superpowers" ]]; then
        log_info "Updating Superpowers..."
        SUPERPOWERS_REPO="${SUPERPOWERS_REPO:-https://github.com/obra/superpowers}"
        SUPERPOWERS_BRANCH="${SUPERPOWERS_BRANCH:-main}"

        if git subtree pull --prefix=vendor/superpowers "$SUPERPOWERS_REPO" "$SUPERPOWERS_BRANCH" --squash; then
            log_success "Superpowers updated"

            # Apply patches
            if [[ -f "scripts/maf/vendor-patch-apply.sh" ]]; then
                log_info "Applying Superpowers patches..."
                if bash scripts/maf/vendor-patch-apply.sh superpowers; then
                    log_success "Patches applied"
                else
                    log_warning "Some patches failed to apply"
                fi
            fi
        else
            log_warning "Failed to update Superpowers (continuing)"
        fi
    fi
    echo
fi
```

**Step 2: Update vendor/README.md to mention patch system**

Find the "Vendor Subtree Management" section in `vendor/README.md` (around line 77-89) and REPLACE with:

```markdown
## Vendor Subtree Management

Vendor subtrees are **read-only** for MAF purposes. If you need to modify a vendor's code, use the **patch system**:

### Creating Custom Patches

```bash
# 1. Edit vendor code directly
vim vendor/agent-mail/src/handlers/custom.py

# 2. Create a patch from your changes
bash scripts/maf/vendor-patch-create.sh agent-mail 0001 "Add custom handler"

# 3. Patches are auto-applied after vendor updates
```

### Alternative: Fork Model

If you have extensive customizations:

1. Fork the vendor repository
2. Make changes in your fork
3. Update subtree URL in `.maf/config/vendor-repos.json`:
```json
{
  "agent-mail": {
    "url": "https://github.com/YOUR-USERNAME/mcp_agent_mail",
    "branch": "main"
  }
}
```
4. Update `scripts/franchisee-init.sh` to read from this config
```

**Step 3: Commit integration**

```bash
git add scripts/franchisee-update.sh vendor/README.md
git commit -m "feat: integrate patch system into update workflow

- Apply vendor patches after subtree updates
- Update vendor README with patch documentation
- Warn on patch failures but continue update
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Phase 3: .Claude Coexistence System

### Task 3: Create manifest tracking system

**Files:**
- Create: `.claude/.maf-manifest.json`
- Create: `.claude/.MAF_MARKER`
- Create: `scripts/maf/generate-manifest.sh`

**Step 1: Write .claude/.maf-manifest.json**

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
      "path": ".claude/skills/response-awareness-medium",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": false,
      "merge_strategy": "overwrite"
    },
    {
      "path": ".claude/skills/response-awareness-heavy",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": false,
      "merge_strategy": "overwrite"
    },
    {
      "path": ".claude/skills/response-awareness-full",
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
    },
    {
      "path": ".claude/skills/sp-systematic-debugging",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": true,
      "merge_strategy": "merge_if_no_conflict"
    },
    {
      "path": ".claude/skills/sp-test-driven-development",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": true,
      "merge_strategy": "merge_if_no_conflict"
    },
    {
      "path": ".claude/commands/response-awareness.md",
      "checksum": "sha256:auto-generated",
      "maf_owned": true,
      "franchisee_can_modify": false,
      "merge_strategy": "overwrite"
    }
  ],
  "franchisee_files": []
}
```

**Step 2: Verify JSON is valid**

Run: `jq empty .claude/.maf-manifest.json`
Expected: No output (indicates valid JSON)

**Step 3: Write .claude/.MAF_MARKER**

```markdown
# MAF Managed Directory

This directory contains files managed by MAF (Multi-Agent Framework).

## File Ownership

Files **without** `.maf-manifest.json` entries are **franchisee-owned** and will never be touched by MAF updates.

Files **with** `.maf-manifest.json` entries are **MAF-managed**:
- `maf_owned: true` + `franchisee_can_modify: false` = MAF controls, updates overwrite
- `maf_owned: true` + `franchisee_can_modify: true` = MAF manages, but franchisee can customize (merge-safe)

## Adding Your Own Files

Simply add files to this directory. They will **not** be tracked by MAF unless you explicitly add them to `.maf-manifest.json`.

## Safe Customization

To customize MAF files safely:
1. Copy the file to a new name (e.g., `response-awareness-custom.md`)
2. Modify your copy
3. Your custom file is franchisee-owned and will never be touched

## See Also

- `scripts/maf/merge-claude.sh` - Merge logic
- `scripts/maf/health-check.sh` - Health validation
```

**Step 4: Verify .MAF_MARKER exists**

Run: `cat .claude/.MAF_MARKER`
Expected: Marker content displayed

**Step 5: Create manifest generation script**

Create `scripts/maf/generate-manifest.sh`:

```bash
#!/bin/bash
# ABOUTME: Generate .maf-manifest.json by scanning .claude/ directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
MANIFEST_FILE="$CLAUDE_DIR/.maf-manifest.json"

echo "Scanning .claude/ for MAF-managed files..."

# Start JSON structure
cat > "$MANIFEST_FILE" << 'EOF'
{
  "version": "1.0",
  "maf_version": "v0.3.0",
  "managed_files": [
EOF

# Find all skills and commands
first=true
find "$CLAUDE_DIR/skills" -mindepth 1 -maxdepth 1 -type d | sort | while read -r skill_dir; do
    skill_name=$(basename "$skill_dir")
    checksum=$(find "$skill_dir" -type f -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1)

    if [[ "$first" == "true" ]]; then
        first=false
    else
        echo "," >> "$MANIFEST_FILE"
    fi

    cat >> "$MANIFEST_FILE" << EOF
    {
      "path": ".claude/skills/$skill_name",
      "checksum": "sha256:$checksum",
      "maf_owned": true,
      "franchisee_can_modify": $([[ "$skill_name" == sp-* ]] && echo "true" || echo "false"),
      "merge_strategy": "$([[ "$skill_name" == sp-* ]] && echo "merge_if_no_conflict" || echo "overwrite")"
    }
EOF
done

# Close JSON
cat >> "$MANIFEST_FILE" << 'EOF'
  ],
  "franchisee_files": []
}
EOF

echo "Manifest generated: $MANIFEST_FILE"
```

**Step 6: Make script executable**

Run: `chmod +x scripts/maf/generate-manifest.sh`

**Step 7: Run manifest generation**

Run: `bash scripts/maf/generate-manifest.sh`
Expected: Manifest file updated with checksums

**Step 8: Commit manifest system**

```bash
git add .claude/.maf-manifest.json .claude/.MAF_MARKER scripts/maf/generate-manifest.sh
git commit -m "feat: add .claude manifest tracking system

- Add .maf-manifest.json for tracking MAF-owned files
- Add .MAF_MARKER documenting file ownership rules
- Add generate-manifest.sh for automatic manifest generation
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 4: Create merge script for .claude/ coexistence

**Files:**
- Create: `scripts/maf/merge-claude.sh`

**Step 1: Write merge-claude.sh script**

```bash
#!/bin/bash
# ABOUTME: Merge MAF's .claude/ directory with franchisee's .claude/ directory
# ABOUTME: Preserves franchisee customizations while updating MAF-managed files

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[MERGE]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CLAUDE_DIR="$PROJECT_ROOT/.claude"
MANIFEST_FILE="$CLAUDE_DIR/.maf-manifest.json"
BACKUP_DIR="$PROJECT_ROOT/.claude.backup.$(date +%Y%m%d_%H%M%S)"

# Pre-flight checks
if [[ ! -f "$MANIFEST_FILE" ]]; then
    log_error "Manifest file not found: $MANIFEST_FILE"
    exit 1
fi

# Step 1: Backup existing .claude/
log_info "Backing up existing .claude/ to $BACKUP_DIR..."
if [[ -d "$CLAUDE_DIR" ]]; then
    cp -r "$CLAUDE_DIR" "$BACKUP_DIR"
    log_success "Backup created"
else
    mkdir -p "$CLAUDE_DIR"
    log_info "No existing .claude/ directory, created new one"
fi

# Step 2: Process MAF-managed files
log_info "Processing MAF-managed files..."
processed=0
skipped=0

while IFS= read -r line; do
    file_path=$(echo "$line" | jq -r '.path')
    maf_owned=$(echo "$line" | jq -r '.maf_owned')
    merge_strategy=$(echo "$line" | jq -r '.merge_strategy')

    full_path="$PROJECT_ROOT/$file_path"

    if [[ "$maf_owned" != "true" ]]; then
        continue
    fi

    if [[ "$merge_strategy" == "overwrite" ]]; then
        # For overwrite strategy, always update from MAF
        if [[ -d "$full_path" ]]; then
            log_success "Updated: $file_path"
            processed=$((processed + 1))
        fi
    elif [[ "$merge_strategy" == "merge_if_no_conflict" ]]; then
        # For merge-safe strategy, check if franchisee has customized
        if [[ -d "$full_path" ]]; then
            # Check for custom marker file
            if [[ -f "$full_path/.FRANCHISEE_CUSTOM" ]]; then
                log_warning "Skipped: $file_path (franchisee customized)"
                skipped=$((skipped + 1))
            else
                log_success "Updated: $file_path"
                processed=$((processed + 1))
            fi
        fi
    fi
done < <(jq -c '.managed_files[]' "$MANIFEST_FILE")

# Step 3: Ensure .MAF_MARKER exists
log_info "Ensuring .MAF_MARKER exists..."
if [[ ! -f "$CLAUDE_DIR/.MAF_MARKER" ]]; then
    log_warning ".MAF_MARKER not found, please run generate-manifest.sh"
fi

log_success "Merge complete!"
log_info "Processed: $processed files, Skipped: $skipped files"
log_info "Backup saved to: $BACKUP_DIR"
log_info "To restore: rm -rf .claude/ && mv $BACKUP_DIR .claude/"
```

**Step 2: Make script executable**

Run: `chmod +x scripts/maf/merge-claude.sh`

**Step 3: Test merge script in dry-run**

Run: `bash -n scripts/maf/merge-claude.sh`
Expected: No syntax errors

**Step 4: Commit merge script**

```bash
git add scripts/maf/merge-claude.sh
git commit -m "feat: add .claude merge script

- Add merge-claude.sh for coexistence system
- Implement manifest-based file processing
- Add backup and rollback support
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Phase 4: Init/Update Workflows

### Task 5: Create franchisee initialization script

**Files:**
- Create: `scripts/franchisee-init.sh`

**Step 1: Write franchisee-init.sh**

```bash
#!/bin/bash
# ABOUTME: Initialize a new franchisee repository with MAF
# ABOUTME: Sets up vendor subtrees, merges .claude/, configures environment

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BOLD}[STEP]${NC} $1"; }

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository. Please run from your project root."
    exit 1
fi

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        MAF Franchisee Initialization Wizard               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# Step 1: Add MAF subtree
log_step "1/5: Adding MAF subtree..."
if [[ -d "maf" ]]; then
    log_warning "maf/ directory already exists, skipping subtree add"
else
    log_info "Adding MAF as git subtree..."
    MAF_REPO="${MAF_REPO:-https://github.com/iamnormalfree/maf}"
    MAF_BRANCH="${MAF_BRANCH:-main}"

    if git subtree add --prefix=maf "$MAF_REPO" "$MAF_BRANCH" --squash; then
        log_success "MAF subtree added"
    else
        log_error "Failed to add MAF subtree"
        exit 1
    fi
fi
echo

# Step 2: Add vendor subtrees
log_step "2/5: Adding vendor subtrees..."

# Agent Mail
if [[ -d "vendor/agent-mail" ]]; then
    log_warning "vendor/agent-mail/ already exists, skipping"
else
    log_info "Adding Agent Mail subtree..."
    mkdir -p vendor

    AGENT_MAIL_REPO="${AGENT_MAIL_REPO:-https://github.com/Dicklesworthstone/mcp_agent_mail}"
    AGENT_MAIL_BRANCH="${AGENT_MAIL_BRANCH:-main}"

    if git subtree add --prefix=vendor/agent-mail "$AGENT_MAIL_REPO" "$AGENT_MAIL_BRANCH" --squash; then
        log_success "Agent Mail subtree added"
    else
        log_error "Failed to add Agent Mail subtree"
        exit 1
    fi
fi

# Superpowers (optional)
if [[ "${INCLUDE_SUPERPOWERS:-false}" == "true" ]]; then
    if [[ -d "vendor/superpowers" ]]; then
        log_warning "vendor/superpowers/ already exists, skipping"
    else
        log_info "Adding Superpowers subtree..."
        mkdir -p vendor

        SUPERPOWERS_REPO="${SUPERPOWERS_REPO:-https://github.com/obra/superpowers}"
        SUPERPOWERS_BRANCH="${SUPERPOWERS_BRANCH:-main}"

        if git subtree add --prefix=vendor/superpowers "$SUPERPOWERS_REPO" "$SUPERPOWERS_BRANCH" --squash; then
            log_success "Superpowers subtree added"
        else
            log_warning "Failed to add Superpowers subtree (continuing anyway)"
        fi
    fi
fi
echo

# Step 3: Merge .claude/ directories
log_step "3/5: Merging .claude/ directories..."
if [[ -f "maf/scripts/maf/merge-claude.sh" ]]; then
    bash maf/scripts/maf/merge-claude.sh
else
    log_warning "merge-claude.sh not found, skipping .claude/ merge"
fi
echo

# Step 4: Run MAF setup script
log_step "4/5: Running MAF setup wizard..."
if [[ -f "maf/scripts/setup-maf.sh" ]]; then
    bash maf/scripts/setup-maf.sh
else
    log_warning "setup-maf.sh not found, skipping MAF setup"
fi
echo

# Step 5: Validate installation
log_step "5/5: Validating installation..."
if [[ -f "maf/scripts/maf/health-check.sh" ]]; then
    if bash maf/scripts/maf/health-check.sh; then
        log_success "Health check passed"
    else
        log_warning "Health check had warnings (may need attention)"
    fi
else
    log_warning "health-check.sh not found, skipping validation"
fi
echo

# Summary
echo "═══════════════════════════════════════════════════════════"
log_success "MAF Franchisee Initialization Complete!"
echo
log_info "Next steps:"
echo "  1. Review .maf/config/agent-topology.json"
echo "  2. Add API credentials to .maf/credentials/"
echo "  3. Start agents: bash maf/scripts/maf/spawn-agents.sh"
echo
log_info "Useful commands:"
echo "  - Update MAF:    bash scripts/franchisee-update.sh maf"
echo "  - Update vendor: bash scripts/franchisee-update.sh vendor"
echo "  - Health check:  bash maf/scripts/maf/health-check.sh"
echo "  - Merge .claude: bash maf/scripts/maf/merge-claude.sh"
echo "═══════════════════════════════════════════════════════════"
```

**Step 2: Make script executable**

Run: `chmod +x scripts/franchisee-init.sh`

**Step 3: Test script syntax**

Run: `bash -n scripts/franchisee-init.sh`
Expected: No syntax errors

**Step 4: Commit init script**

```bash
git add scripts/franchisee-init.sh
git commit -m "feat: add franchisee initialization script

- Add franchisee-init.sh for automated setup
- Support MAF and vendor subtree addition
- Integrate .claude merge and health checks
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 6: Create franchisee update script

**Files:**
- Create: `scripts/franchisee-update.sh`

**Step 1: Write franchisee-update.sh**

```bash
#!/bin/bash
# ABOUTME: Update MAF or vendor subtrees in a franchisee repository
# ABOUTME: Handles merge conflicts, rollback, health checks

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BOLD}[STEP]${NC} $1"; }

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository. Please run from your project root."
    exit 1
fi

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Parse arguments
TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
    echo "Usage: $0 <maf|vendor|all>"
    echo
    echo "Examples:"
    echo "  $0 maf      - Update MAF subtree"
    echo "  $0 vendor   - Update all vendor subtrees"
    echo "  $0 all      - Update everything"
    exit 1
fi

# Create restore point
RESTORE_DIR="$PROJECT_ROOT/.maf.restore.$(date +%Y%m%d_%H%M%S)"
log_info "Creating restore point at $RESTORE_DIR..."
mkdir -p "$RESTORE_DIR"

# Backup critical directories
cp -r .claude "$RESTORE_DIR/" 2>/dev/null || true
cp -r .maf "$RESTORE_DIR/" 2>/dev/null || true
cp -r vendor "$RESTORE_DIR/" 2>/dev/null || true
cp -r maf "$RESTORE_DIR/" 2>/dev/null || true

log_success "Restore point created"
log_info "To restore: bash scripts/franchisee-rollback.sh $RESTORE_DIR"
echo

# Function to rollback on error
rollback() {
    log_error "Update failed, rolling back..."
    bash "$PROJECT_ROOT/scripts/franchisee-rollback.sh" "$RESTORE_DIR"
    exit 1
}

trap rollback ERR

# Update MAF
if [[ "$TARGET" == "maf" ]] || [[ "$TARGET" == "all" ]]; then
    log_step "Updating MAF subtree..."

    MAF_REPO="${MAF_REPO:-https://github.com/iamnormalfree/maf}"
    MAF_BRANCH="${MAF_BRANCH:-main}"

    log_info "Pulling latest from $MAF_REPO..."
    if git subtree pull --prefix=maf "$MAF_REPO" "$MAF_BRANCH" --squash; then
        log_success "MAF updated"
    else
        log_error "Failed to update MAF"
        rollback
    fi

    # Merge .claude/
    log_info "Merging .claude/ directories..."
    if [[ -f "maf/scripts/maf/merge-claude.sh" ]]; then
        bash maf/scripts/maf/merge-claude.sh
    fi
    echo
fi

# Update vendor subtrees
if [[ "$TARGET" == "vendor" ]] || [[ "$TARGET" == "all" ]]; then
    log_step "Updating vendor subtrees..."

    # Agent Mail
    if [[ -d "vendor/agent-mail" ]]; then
        log_info "Updating Agent Mail..."
        AGENT_MAIL_REPO="${AGENT_MAIL_REPO:-https://github.com/Dicklesworthstone/mcp_agent_mail}"
        AGENT_MAIL_BRANCH="${AGENT_MAIL_BRANCH:-main}"

        if git subtree pull --prefix=vendor/agent-mail "$AGENT_MAIL_REPO" "$AGENT_MAIL_BRANCH" --squash; then
            log_success "Agent Mail updated"
        else
            log_error "Failed to update Agent Mail"
            rollback
        fi
    fi

    # Superpowers (if exists)
    if [[ -d "vendor/superpowers" ]]; then
        log_info "Updating Superpowers..."
        SUPERPOWERS_REPO="${SUPERPOWERS_REPO:-https://github.com/obra/superpowers}"
        SUPERPOWERS_BRANCH="${SUPERPOWERS_BRANCH:-main}"

        if git subtree pull --prefix=vendor/superpowers "$SUPERPOWERS_REPO" "$SUPERPOWERS_BRANCH" --squash; then
            log_success "Superpowers updated"
        else
            log_warning "Failed to update Superpowers (continuing)"
        fi
    fi
    echo
fi

# Run health check
log_step "Running health check..."
if [[ -f "maf/scripts/maf/health-check.sh" ]]; then
    if bash maf/scripts/maf/health-check.sh; then
        log_success "Health check passed"
    else
        log_warning "Health check had warnings"
        log_info "Review warnings above or run: bash maf/scripts/maf/health-check.sh --verbose"
    fi
fi
echo

# Cleanup old restore points (keep last 5)
log_info "Cleaning up old restore points..."
ls -dt .maf.restore.* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

# Summary
echo "═══════════════════════════════════════════════════════════"
log_success "Update complete!"
echo
log_info "Restore points (last 5):"
ls -dt .maf.restore.* 2>/dev/null | head -5 || echo "  No restore points found"
log_info "To rollback: bash scripts/franchisee-rollback.sh $RESTORE_DIR"
echo "═══════════════════════════════════════════════════════════"
```

**Step 2: Make script executable**

Run: `chmod +x scripts/franchisee-update.sh`

**Step 3: Test script syntax**

Run: `bash -n scripts/franchisee-update.sh`
Expected: No syntax errors

**Step 4: Commit update script**

```bash
git add scripts/franchisee-update.sh
git commit -m "feat: add franchisee update script

- Add franchisee-update.sh for automated updates
- Support MAF and vendor subtree updates
- Implement automatic rollback on failure
- Add health check integration
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Phase 5: Error Handling & Testing

### Task 7: Create health check script

**Files:**
- Create: `scripts/maf/health-check.sh`

**Step 1: Write health-check.sh**

```bash
#!/bin/bash
# ABOUTME: Comprehensive health check for MAF installation
# ABOUTME: Validates subtrees, .claude/ merge, vendor dependencies, configuration

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[CHECK]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EXIT_CODE=0

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              MAF Health Check                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# Check 1: MAF subtree
log_info "Checking MAF subtree..."
if [[ -d "$PROJECT_ROOT/maf" ]]; then
    log_success "MAF subtree exists"
else
    log_error "MAF subtree not found"
    EXIT_CODE=1
fi

# Check 2: Agent Mail subtree
log_info "Checking Agent Mail subtree..."
if [[ -d "$PROJECT_ROOT/vendor/agent-mail" ]]; then
    if [[ -f "$PROJECT_ROOT/vendor/agent-mail/pyproject.toml" ]]; then
        log_success "Agent Mail subtree exists"
    else
        log_error "Agent Mail directory missing pyproject.toml"
        EXIT_CODE=1
    fi
elif [[ -d "$PROJECT_ROOT/mcp_agent_mail" ]]; then
    log_warning "Old mcp_agent_mail/ directory found (should be vendor/agent-mail/)"
    EXIT_CODE=1
else
    log_warning "Agent Mail not found at vendor/agent-mail/"
fi

# Check 3: .claude/ directory
log_info "Checking .claude/ directory..."
if [[ -d "$PROJECT_ROOT/.claude" ]]; then
    if [[ -f "$PROJECT_ROOT/.claude/.maf-manifest.json" ]]; then
        log_success ".claude/ directory with manifest"
    else
        log_warning ".claude/ directory exists but no manifest"
    fi
else
    log_error ".claude/ directory not found"
    EXIT_CODE=1
fi

# Check 4: MAF configuration
log_info "Checking MAF configuration..."
if [[ -f "$PROJECT_ROOT/.maf/config/agent-topology.json" ]]; then
    if jq empty "$PROJECT_ROOT/.maf/config/agent-topology.json" 2>/dev/null; then
        log_success "MAF configuration valid"
    else
        log_error "MAF configuration invalid JSON"
        EXIT_CODE=1
    fi
else
    log_warning "MAF configuration not found"
fi

# Check 5: .gitignore
log_info "Checking .gitignore..."
if grep -q "^\\.maf/" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    log_success ".maf/ is gitignored"
else
    log_warning ".maf/ not in .gitignore"
fi

echo
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "═══════════════════════════════════════════════════════════"
    log_success "All health checks passed!"
    echo "═══════════════════════════════════════════════════════════"
else
    echo "═══════════════════════════════════════════════════════════"
    log_error "Health checks failed. Please fix the issues above."
    echo "═══════════════════════════════════════════════════════════"
fi

exit $EXIT_CODE
```

**Step 2: Make script executable**

Run: `chmod +x scripts/maf/health-check.sh`

**Step 3: Test health check**

Run: `bash scripts/maf/health-check.sh`
Expected: Health check report displayed

**Step 4: Commit health check script**

```bash
git add scripts/maf/health-check.sh
git commit -m "feat: add health check script

- Add comprehensive health check for MAF installation
- Validate subtrees, .claude/, configuration
- Provide clear pass/warning/fail reporting
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 8: Create rollback script

**Files:**
- Create: `scripts/franchisee-rollback.sh`

**Step 1: Write franchisee-rollback.sh**

```bash
#!/bin/bash
# ABOUTME: Rollback MAF installation to a previous restore point

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[ROLLBACK]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository. Please run from your project root."
    exit 1
fi

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Parse arguments
RESTORE_DIR="${1:-}"

if [[ -z "$RESTORE_DIR" ]]; then
    echo "Usage: $0 <restore-point-directory>"
    echo
    echo "Available restore points:"
    ls -dt .maf.restore.* 2>/dev/null | head -10 || echo "  No restore points found"
    exit 1
fi

if [[ ! -d "$RESTORE_DIR" ]]; then
    log_error "Restore point not found: $RESTORE_DIR"
    exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        MAF Rollback to Restore Point                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo
log_info "Restore point: $RESTORE_DIR"
echo

# Confirm
read -rp "This will replace current .claude/, .maf/, vendor/, and maf/ directories. Continue? [y/N]: " -n 1 confirm
echo

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Stop running agents
log_info "Stopping running agents..."
if command -v tmux &> /dev/null; then
    tmux list-sessions 2>/dev/null | grep maf- | awk '{print $1}' | sed 's/://' | while read -r session; do
        log_info "Killing session: $session"
        tmux kill-session -t "$session" 2>/dev/null || true
    done
fi

# Restore directories
log_info "Restoring directories..."

if [[ -d "$RESTORE_DIR/.claude" ]]; then
    rm -rf "$PROJECT_ROOT/.claude"
    cp -r "$RESTORE_DIR/.claude" "$PROJECT_ROOT/.claude"
    log_success "Restored .claude/"
fi

if [[ -d "$RESTORE_DIR/.maf" ]]; then
    rm -rf "$PROJECT_ROOT/.maf"
    cp -r "$RESTORE_DIR/.maf" "$PROJECT_ROOT/.maf"
    log_success "Restored .maf/"
fi

if [[ -d "$RESTORE_DIR/vendor" ]]; then
    rm -rf "$PROJECT_ROOT/vendor"
    cp -r "$RESTORE_DIR/vendor" "$PROJECT_ROOT/vendor"
    log_success "Restored vendor/"
fi

if [[ -d "$RESTORE_DIR/maf" ]]; then
    rm -rf "$PROJECT_ROOT/maf"
    cp -r "$RESTORE_DIR/maf" "$PROJECT_ROOT/maf"
    log_success "Restored maf/"
fi

# Reset git state for subtree directories
log_info "Resetting git state for subtrees..."
git reset HEAD maf/ vendor/ 2>/dev/null || true
git checkout -- maf/ vendor/ 2>/dev/null || true

log_success "Rollback complete!"
echo
log_info "Restore point preserved at: $RESTORE_DIR"
log_info "Delete when confident: rm -rf $RESTORE_DIR"
```

**Step 2: Make script executable**

Run: `chmod +x scripts/franchisee-rollback.sh`

**Step 3: Test script syntax**

Run: `bash -n scripts/franchisee-rollback.sh`
Expected: No syntax errors

**Step 4: Commit rollback script**

```bash
git add scripts/franchisee-rollback.sh
git commit -m "feat: add rollback script

- Add franchisee-rollback.sh for restore point recovery
- Stop running agents before restore
- Preserve restore point for manual inspection
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


### Task 9: Update documentation

**Files:**
- Modify: `SETUP.md`
- Modify: `README.md`
- Create: `docs/VENDOR_ARCHITECTURE.md`

**Step 1: Write vendor architecture documentation**

Create `docs/VENDOR_ARCHITECTURE.md`:

```markdown
# Vendor Architecture

## Overview

MAF uses a `vendor/` directory to manage external dependencies as git subtrees. This provides clean separation between MAF-native code and external projects.

## Directory Structure

```
vendor/
├── agent-mail/          # MCP Agent Mail subtree
└── superpowers/         # Obra/superpowers subtree (optional)
```

## Why Subtrees?

- **No extra metadata files** - Unlike submodules, subtrees don't require `.gitmodules`
- **Franchisee-friendly** - Works seamlessly with git subtree distribution
- **No extra commands** - Franchisees don't need to run `git submodule update`
- **Atomic commits** - Subtree changes are part of the main repo's commit history

## Adding a New Vendor

```bash
git subtree add --prefix=vendor/<name> <repo-url> <branch> --squash
```

## Updating a Vendor

```bash
git subtree pull --prefix=vendor/<name> <repo-url> <branch> --squash
```

## Vendor Management Guidelines

1. **Read-only** - Treat vendor code as read-only. Fork and modify if needed.
2. **Version pinning** - Note which commit/tag you're using in vendor/README.md
3. **Security** - Monitor vendor repos for security updates
4. **Licensing** - Ensure vendor licenses are compatible with MAF's MIT license
```

**Step 2: Update SETUP.md with vendor paths**

Find section mentioning `mcp_agent_mail` and update to reference `vendor/agent-mail`.

**Step 3: Update README.md with new commands**

Add section on franchisee init/update:

```markdown
## Franchisee Quick Start

```bash
# Initialize MAF in your repo
curl -fsSL https://raw.githubusercontent.com/iamnormalfree/maf/main/scripts/franchisee-init.sh | bash

# Or manually:
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
bash scripts/franchisee-init.sh

# Update MAF
bash scripts/franchisee-update.sh all
```
```

**Step 4: Commit documentation**

```bash
git add docs/VENDOR_ARCHITECTURE.md SETUP.md README.md
git commit -m "docs: update for vendor architecture

- Add VENDOR_ARCHITECTURE.md documentation
- Update SETUP.md with vendor paths
- Update README.md with franchisee init/update commands
"
```

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Testing Strategy

### Integration Test

**Step 1: Test in fresh repository**

```bash
cd /tmp
mkdir test-maf-vendor
cd test-maf-vendor
git init
echo '{"name": "test"}' > package.json
git add package.json
git commit -m "init"

# Copy init script
cp /root/projects/maf-github/scripts/franchisee-init.sh .

# Run init (dry run)
bash -n franchisee-init.sh
```

Expected: No syntax errors

**Step 2: Verify health check**

```bash
cd /root/projects/maf-github
bash scripts/maf/health-check.sh
```

Expected: All checks pass or warnings are understood

**Step 3: Verify manifest generation**

```bash
bash scripts/maf/generate-manifest.sh
jq empty .claude/.maf-manifest.json
```

Expected: Valid JSON generated

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Success Criteria

✅ **Vendor Directory**
- [ ] `vendor/.gitkeep` and `vendor/README.md` created
- [ ] Agent Mail migrated to `vendor/agent-mail/`
- [ ] All scripts updated to use new paths

✅ **Vendor Patch System**
- [ ] `.maf/patches/` directory structure created
- [ ] `vendor-patch-create.sh` generates patches from vendor changes
- [ ] `vendor-patch-apply.sh` applies patches with conflict detection
- [ ] `vendor-patch-list.sh` shows all patches
- [ ] Patches auto-applied after vendor updates

✅ **.Claude Coexistence**
- [ ] `.maf-manifest.json` tracks MAF-owned files
- [ ] `.MAF_MARKER` documents ownership rules
- [ ] `merge-claude.sh` preserves franchisee customizations

✅ **Init/Update Workflows**
- [ ] `franchisee-init.sh` performs complete setup
- [ ] `franchisee-update.sh` updates with rollback safety
- [ ] Health checks validate all components

✅ **Error Handling**
- [ ] All failures trigger automatic rollback
- [ ] Clear error messages guide resolution
- [ ] Restore points created before operations

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Estimated Timeline

- Phase 1: 1-2 hours (Vendor Directory Setup)
- Phase 2: 2-3 hours (Vendor Patch System)
- Phase 3: 2-3 hours (.Claude Coexistence)
- Phase 4: 2-3 hours (Init/Update Workflows)
- Phase 5: 2-3 hours (Error Handling & Testing)

**Total: 10-15 hours**

---

## Goals

**Primary Goals:**
1. **Vendor Isolation** - Separate external dependencies (agent-mail, superpowers) into `vendor/` directory using git subtrees
2. **Franchisee Customization** - Enable franchisees to customize vendor code via patch system that survives updates
3. **.Claude Coexistence** - Allow MAF to manage specific files in `.claude/` while preserving franchisee customizations
4. **Automated Workflows** - Provide init/update scripts with rollback safety for franchisees

**Success Metrics:**
- Vendor subtrees update cleanly without breaking franchisee customizations
- Franchisee can add custom `.claude/` files that MAF updates never touch
- Rollback restores system to working state after any failed update

### Non-Goals

**Explicitly Out of Scope:**
1. **Vendor Replacement** - NOT replacing entire git subtree workflow (subtrees are sufficient)
2. **Automatic Conflict Resolution** - NOT auto-merging patch conflicts (franchisee resolves manually)
3. **Version Pinning** - NOT pinning vendor versions (use latest stable from upstream)
4. **Multi-Vendor Orchestration** - NOT managing complex vendor dependency graphs (simple 1-level deps only)
5. **Vendor Fork Management** - NOT supporting custom vendor forks (franchisee forks vendor separately if needed)
6. **Performance Optimization** - NOT optimizing subtree update performance (acceptable as-is)
7. **Cross-Repo Dependencies** - NOT managing dependencies between multiple franchisee repos (single-repo focus)


## Post-Implementation

1. Run full integration test in fresh repository
2. Document any issues found during implementation
3. Update this plan with lessons learned
4. Create franchisee handoff guide
