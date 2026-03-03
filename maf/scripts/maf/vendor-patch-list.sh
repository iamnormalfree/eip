#!/bin/bash
# ABOUTME: List all patches for vendor subtrees

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed. Please install jq."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
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
