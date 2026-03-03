#!/bin/bash
# ABOUTME: Validate bead state after plan-to-beads conversion
# ABOUTME: Prevents false closures by detecting beads created in closed state
# COMPLETION_DRIVE: Prevents workflow violations from plan-to-beads bugs
# LCL: validation::plan_to_beads
# LCL: integrity_check::false_closure_prevention
#
# Exit codes:
#   0 - All beads in proper state (open or ready)
#   1 - Beads found in closed state (potential bug)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $*"
}

log_error() {
    echo -e "${RED}[✗]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $*"
}

# Detect PROJECT_ROOT (subtree-aware)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

cd "$PROJECT_ROOT" || exit 1

# Beads file location
BEADS_FILE="${BEADS_FILE:-.beads/beads.jsonl}"

# Check if beads file exists
if [[ ! -f "$BEADS_FILE" ]]; then
    log_error "Beads file not found: $BEADS_FILE"
    exit 1
fi

# Count beads by state
log_info "Analyzing bead state..."

total_beads=$(jq -s 'length' "$BEADS_FILE" 2>/dev/null || echo "0")
closed_beads=$(jq -r 'select(.status == "closed") | .id' "$BEADS_FILE" 2>/dev/null | wc -l)
open_beads=$(jq -r 'select(.status == "open") | .id' "$BEADS_FILE" 2>/dev/null | wc -l)
ready_beads=$(jq -r 'select(.status == "ready") | .id' "$BEADS_FILE" 2>/dev/null | wc -l)
in_progress_beads=$(jq -r 'select(.status == "in_progress") | .id' "$BEADS_FILE" 2>/dev/null | wc -l)

echo ""
echo "Bead State Summary:"
echo "  Total beads:    $total_beads"
echo "  Open:           $open_beads"
echo "  Ready:          $ready_beads"
echo "  In Progress:    $in_progress_beads"
echo "  Closed:         $closed_beads"
echo ""

# Check for improperly closed beads
if [[ $closed_beads -gt 0 ]]; then
    log_error "Found $closed_beads beads in 'closed' state"

    # Show recently closed beads (likely from plan-to-beads)
    echo ""
    log_warn "Recently closed beads (may indicate plan-to-beads bug):"

    jq -r 'select(.status == "closed") | "\(.id) | Created: \(.created_at // "unknown") | Closed: \(.closed_at // "unknown")"' "$BEADS_FILE" 2>/dev/null | head -10 | while IFS='|' read -r bead_id created closed; do
        echo "  ❌ $bead_id"
        echo "     Created: $created"
        echo "     Closed:  $closed"
    done

    echo ""
    log_warn "This may indicate:"
    echo "  1. Plan-to-beads script bug (marking beads closed by default)"
    echo "  2. Manual closure during testing/development"
    echo "  3. Automation/scheduled task closing beads"
    echo ""
    log_warn "Beads should be created in 'open' or 'ready' state, not 'closed'"
    echo ""
    log_info "To reopen improperly closed beads:"
    echo "  bd list --status closed --json | jq -r '.[].id' | xargs -I {} bd reopen {}"
    echo ""
    log_info "Or selectively reopen:"
    echo "  bd reopen <bead-id>"
    echo ""

    # Check if closed beads have receipts or commits
    closed_with_receipt=0
    closed_with_commit=0

    while IFS= read -r bead_id; do
        [[ -z "$bead_id" ]] && continue

        # Check for receipt
        if [[ -f "receipts/${bead_id}.md" ]]; then
            lines=$(wc -l < "receipts/${bead_id}.md" 2>/dev/null || echo "0")
            if [[ $lines -ge 50 ]]; then
                closed_with_receipt=$((closed_with_receipt + 1))
            fi
        fi

        # Check for git commit
        if git log --all --oneline --grep="$bead_id" 2>/dev/null | grep -q .; then
            closed_with_commit=$((closed_with_commit + 1))
        fi
    done < <(jq -r 'select(.status == "closed") | .id' "$BEADS_FILE" 2>/dev/null)

    echo "Evidence of proper completion:"
    echo "  With receipts (50+ lines): $closed_with_receipt"
    echo "  With git commits:          $closed_with_commit"
    echo ""

    if [[ $closed_with_receipt -eq 0 ]] && [[ $closed_with_commit -eq 0 ]]; then
        log_error "No evidence of proper completion - these are likely false closures"
    else
        log_warn "Some closures may be legitimate (have receipts/commits)"
    fi

    exit 1
else
    log_success "No beads in 'closed' state - bead state looks good"
    exit 0
fi
