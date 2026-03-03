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

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed. Please install jq."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
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

# Validate vendor directory exists
if [[ ! -d "$PROJECT_ROOT/$VENDOR_DIR" ]]; then
    log_error "Vendor directory not found: $VENDOR_DIR"
    exit 1
fi

cd "$PROJECT_ROOT/$VENDOR_DIR"

applied=0
failed=0
skipped=0

while read -r patch_file; do
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

    # Try to apply patch (and detect already-applied patches)
    if patch -p1 --dry-run -s < "$patch_path" > /dev/null 2>&1; then
        if patch -p1 < "$patch_path"; then
            log_success "Applied: $patch_file"
            applied=$((applied + 1))
        else
            log_error "Failed to apply: $patch_file"
            failed=$((failed + 1))
        fi
    elif patch -p1 --dry-run -R -s < "$patch_path" > /dev/null 2>&1; then
        log_info "Already applied: $patch_file"
        skipped=$((skipped + 1))
    else
        if [[ "$FORCE" == "--force" ]]; then
            log_warning "Force-applying with rejects..."
            patch -p1 < "$patch_path" || true
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
done < <(echo "$patches")

echo
log_info "Patches applied: $applied, Failed: $failed, Skipped: $skipped"

if [[ $failed -gt 0 ]]; then
    exit 1
fi
