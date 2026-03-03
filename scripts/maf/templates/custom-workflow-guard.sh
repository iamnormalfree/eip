#!/bin/bash
# ABOUTME: Guard template for custom autonomous workflow scripts
# ABOUTME: Warns when MAF already provides equivalent functionality
# COMPLETION_DRIVE: Prevents rebuilding MAF functionality from scratch
# LCL: validation::maf_existing_check
# LCL: integrity_check::prevent_reinvention
#
# Usage: Source this at the top of your custom workflow script
#   source scripts/maf/templates/custom-workflow-guard.sh

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

# Guard: Check if MAF already provides autonomous workflow
check_maf_alternatives() {
    local maf_coordinate=""
    local maf_rebuild=""
    local custom_workflow=""

    # Detect PROJECT_ROOT (subtree-aware)
    local DETECTED_SCRIPT_DIR
    DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"

    local PROJECT_ROOT
    if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
        PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
    else
        PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
    fi

    # Check for MAF scripts
    if [[ -f "$PROJECT_ROOT/maf/scripts/maf/coordinate-agents.sh" ]]; then
        maf_coordinate="$PROJECT_ROOT/maf/scripts/maf/coordinate-agents.sh"
    fi

    if [[ -f "$PROJECT_ROOT/maf/scripts/maf/rebuild-maf-cli-agents.sh" ]]; then
        maf_rebuild="$PROJECT_ROOT/maf/scripts/maf/rebuild-maf-cli-agents.sh"
    fi

    # Check for custom workflow scripts
    if [[ -f "$PROJECT_ROOT/scripts/maf/autonomous-workflow"*.sh ]]; then
        custom_workflow=$(ls "$PROJECT_ROOT/scripts/maf/autonomous-workflow"*.sh 2>/dev/null | head -1)
    fi

    # If MAF provides workflow and custom exists, warn
    if [[ -n "$maf_coordinate" ]] && [[ -n "$custom_workflow" ]]; then
        echo ""
        warn "=========================================="
        warn "MAF Alternative Detected"
        warn "=========================================="
        echo ""
        info "MAF provides: $maf_coordinate"
        info "Your script:  $custom_workflow"
        echo ""
        warn "Did you evaluate MAF's coordinate-agents.sh before building custom?"
        echo ""
        info "MAF's coordinate-agents.sh provides:"
        echo "  • Agent Mail integration"
        echo "  • Thread-based messaging per bead"
        echo "  • Cross-agent coordination"
        echo "  • Review loops"
        echo "  • Progress announcements"
        echo ""
        warn "If you haven't already:"
        echo "  1. Read: cat $maf_coordinate"
        echo "  2. Decide: Use as-is, customize, or build fresh"
        echo "  3. Document: Why custom approach is necessary"
        echo ""

        # Only prompt if not in automated context
        if [[ -z "${MAF_AUTO_CONFIRM:-}" ]] && [[ -t 0 ]]; then
            read -p "Continue anyway? (y/N): " confirm
            if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
                info "Exiting. Please evaluate MAF's script first."
                exit 1
            fi
        else
            warn "MAF_AUTO_CONFIRM set - skipping prompt"
        fi
    fi

    # If MAF provides rebuild, mention it
    if [[ -n "$maf_rebuild" ]]; then
        info "Note: MAF also provides session rebuild: $maf_rebuild"
    fi
}

# Run the check
check_maf_alternatives
