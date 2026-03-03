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

git diff > "$PATCH_FILE"

# Generate fingerprint (hash of patch content)
FINGERPRINT=$(sha256sum "$PATCH_FILE" | cut -d' ' -f1)

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
