#!/bin/bash
# review-bead.sh - Run two-stage review on bead
#
# USAGE:
#   maf/scripts/maf/review-bead.sh <bead-id> [--commit <hash>]
#
# WHAT IT DOES:
#   - Loads reviewer prompt template with bead details
#   - Runs automated Stage 1 (Spec Compliance) check
#   - Runs automated Stage 2 (Code Quality) check
#   - Provides interactive prompts for sending approval/rejection mail
#   - Closes bead on approval
#
# EXIT CODES:
#   0 - Review passed and bead approved
#   1 - Review failed or user cancelled
#
# CUSTOMIZATION:
#   For project-specific behavior, create a wrapper script in scripts/maf/
#   that calls this script with your project's bead workflow.

set -euo pipefail

# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
    SCRIPT_DIR="$DETECTED_SCRIPT_DIR"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
    SCRIPT_DIR="$DETECTED_SCRIPT_DIR"
fi

# Source preflight for topology helpers
source "${SCRIPT_DIR}/preflight-gatekeeper.sh"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

# Show usage
show_usage() {
    cat << 'USAGEEOF'
MAF Review Bead - Two-Stage Review

USAGE:
    maf/scripts/maf/review-bead.sh <bead-id> [--commit <hash>]

ARGUMENTS:
    bead_id       Bead ID to review (e.g., BEAD-001)
    --commit      Optional commit hash to review (default: finds latest commit for bead)

DESCRIPTION:
    Runs two-stage review process on a bead implementation:
    - Stage 1: Spec Compliance - Did we build EXACTLY what was requested?
    - Stage 2: Code Quality - Is the implementation well-built?

    Each stage must pass before proceeding. Interactive prompts allow sending
    approval/rejection mail to implementor.

EXAMPLES:
    # Review bead with auto-detected commit
    bash maf/scripts/maf/review-bead.sh BEAD-001

    # Review specific commit
    bash maf/scripts/maf/review-bead.sh BEAD-001 --commit abc123

EXIT CODES:
    0 - Review passed and bead approved
    1 - Review failed or user cancelled
USAGEEOF
    exit 0
}

# Parse arguments
BEAD_ID="${1:-}"
COMMIT_HASH=""

if [[ -z "$BEAD_ID" ]]; then
    log_error "Missing bead-id argument"
    echo ""
    show_usage
fi

# Check for --commit flag
if [[ "${2:-}" == "--commit" && -n "${3:-}" ]]; then
    COMMIT_HASH="${3}"
elif [[ -n "${2:-}" && "${2:-}" != "--commit" ]]; then
    # Support old positional argument style
    COMMIT_HASH="${2}"
fi

if [[ -z "$COMMIT_HASH" ]]; then
    # Find latest commit for bead
    log_info "Finding latest commit for $BEAD_ID..."
    COMMIT_HASH=$(git log --all --oneline --grep="$BEAD_ID" 2>/dev/null | head -1 | awk '{print $1}') || COMMIT_HASH=""
    if [[ -z "$COMMIT_HASH" ]]; then
        log_error "No commit found for $BEAD_ID"
        log_info "Tip: Use --commit <hash> to specify commit explicitly"
        exit 1
    fi
    log_success "Found commit: $COMMIT_HASH"
fi

echo ""
echo "=================================="
log_info "Two-Stage Review for $BEAD_ID"
echo "=================================="
echo ""

# Load reviewer and implementor mail names from topology
REVIEWER_MAIL=$(get_mail_name_by_role "reviewer")
IMPLEMENTOR_MAIL=$(get_mail_name_by_role "implementor")

# Set environment variables for template substitution
export reviewer_mail_name="$REVIEWER_MAIL"
export implementor_mail_name="$IMPLEMENTOR_MAIL"
export bead_id="$BEAD_ID"
export commit_hash="$COMMIT_HASH"
export bead_title="Bead $BEAD_ID"
export bead_description="Bead description"
export files_changed="See git show $COMMIT_HASH"

# Show reviewer template
log_info "Review Instructions:"
echo ""
TEMPLATE_FILE="${PROJECT_ROOT}/maf/templates/prompts/reviewer-two-stage.md"
if [[ -f "$TEMPLATE_FILE" ]]; then
    envsubst < "$TEMPLATE_FILE"
else
    log_warning "Template file not found: $TEMPLATE_FILE"
    log_info "Continuing with automated review checks..."
fi

echo ""
log_info "Running automated review checks..."
echo ""

# Run Stage 1: Spec Compliance
echo "----------------------------------------"
log_info "Stage 1: Spec Compliance"
echo "----------------------------------------"
STAGE1_OUTPUT=$(python3 "${SCRIPT_DIR}/lib/reviewer.py" "$BEAD_ID" --commit "$COMMIT_HASH" --stage 1 2>&1) || STAGE1_EXIT=$?
STAGE1_EXIT=${STAGE1_EXIT:-0}

echo "$STAGE1_OUTPUT"

if [[ $STAGE1_EXIT -ne 0 ]]; then
    echo ""
    log_error "Stage 1 FAILED"
    echo ""
    echo "Send rejection mail to implementor?"
    read -p "Send rejection? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -f "${SCRIPT_DIR}/send-review-rejection.sh" ]]; then
            bash "${SCRIPT_DIR}/send-review-rejection.sh" "$BEAD_ID" "stage1" "$IMPLEMENTOR_MAIL"
        else
            log_warning "send-review-rejection.sh not found - skipping mail send"
            log_info "Please manually notify $IMPLEMENTOR_MAIL about Stage 1 failures"
        fi
    fi
    exit 1
fi

echo ""
log_success "Stage 1 PASSED"
echo ""

# Run Stage 2: Code Quality
echo "----------------------------------------"
log_info "Stage 2: Code Quality"
echo "----------------------------------------"
STAGE2_OUTPUT=$(python3 "${SCRIPT_DIR}/lib/reviewer.py" "$BEAD_ID" --commit "$COMMIT_HASH" --stage 2 2>&1) || STAGE2_EXIT=$?
STAGE2_EXIT=${STAGE2_EXIT:-0}

echo "$STAGE2_OUTPUT"

if [[ $STAGE2_EXIT -ne 0 ]]; then
    echo ""
    log_error "Stage 2 FAILED"
    echo ""
    echo "Send rejection mail to implementor?"
    read -p "Send rejection? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -f "${SCRIPT_DIR}/send-review-rejection.sh" ]]; then
            bash "${SCRIPT_DIR}/send-review-rejection.sh" "$BEAD_ID" "stage2" "$IMPLEMENTOR_MAIL"
        else
            log_warning "send-review-rejection.sh not found - skipping mail send"
            log_info "Please manually notify $IMPLEMENTOR_MAIL about Stage 2 failures"
        fi
    fi
    exit 1
fi

echo ""
log_success "Stage 2 PASSED"
echo ""

echo "=================================="
log_success "Both stages passed!"
echo "=================================="
echo ""
echo "Send approval and close bead?"
read -p "Approve and close? [Y/n] " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Send approval mail
    if [[ -f "${SCRIPT_DIR}/agent-mail-send.sh" ]]; then
        log_info "Sending approval mail to $IMPLEMENTOR_MAIL..."
        bash "${SCRIPT_DIR}/agent-mail-send.sh" \
            "$REVIEWER_MAIL" "$IMPLEMENTOR_MAIL" \
            "[$BEAD_ID] APPROVED" \
            "Stage 1 (Spec Compliance): PASSED\nStage 2 (Code Quality): PASSED\n\nBead approved."
    else
        log_warning "agent-mail-send.sh not found - skipping mail send"
        log_info "Please manually notify $IMPLEMENTOR_MAIL about approval"
    fi

    # Close bead
    if command -v bd &>/dev/null; then
        log_info "Closing bead $BEAD_ID..."
        bd close "$BEAD_ID"
        log_success "Closed $BEAD_ID"
    else
        log_warning "bd command not found - please close bead manually"
        log_info "Run: bd close $BEAD_ID"
    fi

    # Reset escalation tracking on successful completion
    if [[ -f "${SCRIPT_DIR}/lib/escalation.py" ]]; then
        log_info "Resetting escalation tracking for $BEAD_ID..."
        python3 "${SCRIPT_DIR}/lib/escalation.py" reset "$BEAD_ID"
    fi

    exit 0
else
    log_info "Approval cancelled - bead not closed"
    exit 1
fi
