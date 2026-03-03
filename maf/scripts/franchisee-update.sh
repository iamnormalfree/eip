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
        if [[ -f "maf/scripts/maf/generate-manifest.sh" ]]; then
            log_info "Generating .claude manifest..."
            bash maf/scripts/maf/generate-manifest.sh
        fi
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

            # Apply patches
            if [[ -x "maf/scripts/maf/vendor-patch-apply.sh" ]]; then
                log_info "Applying Agent Mail patches..."
                if bash maf/scripts/maf/vendor-patch-apply.sh agent-mail; then
                    log_success "Patches applied"
                else
                    log_warning "Some patches failed to apply"
                    log_info "Resolve conflicts and run: bash maf/scripts/maf/vendor-patch-apply.sh agent-mail --force"
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
            if [[ -x "maf/scripts/maf/vendor-patch-apply.sh" ]]; then
                log_info "Applying Superpowers patches..."
                if bash maf/scripts/maf/vendor-patch-apply.sh superpowers; then
                    log_success "Patches applied"
                else
                    log_warning "Some patches failed to apply"
                fi
            fi
        else
            log_warning "Failed to update Superpowers (continuing)"
        fi
    fi

    # Response-Awareness (if exists)
    if [[ -d "vendor/response-awareness" ]]; then
        log_info "Updating Response-Awareness..."
        RESPONSE_AWARENESS_REPO="${RESPONSE_AWARENESS_REPO:-https://github.com/Typhren42/Response-Awareness}"
        RESPONSE_AWARENESS_BRANCH="${RESPONSE_AWARENESS_BRANCH:-main}"

        if git subtree pull --prefix=vendor/response-awareness "$RESPONSE_AWARENESS_REPO" "$RESPONSE_AWARENESS_BRANCH" --squash; then
            log_success "Response-Awareness updated"

            # Apply patches
            if [[ -x "maf/scripts/maf/vendor-patch-apply.sh" ]]; then
                log_info "Applying Response-Awareness patches..."
                if bash maf/scripts/maf/vendor-patch-apply.sh response-awareness; then
                    log_success "Patches applied"
                else
                    log_warning "Some patches failed to apply"
                fi
            fi
        else
            log_warning "Failed to update Response-Awareness (continuing)"
        fi
    fi
    echo
fi

# Sync skills
log_step "Syncing skills..."
if [[ -x "maf/bin/maf-hq" ]]; then
    bash maf/bin/maf-hq update
    bash maf/bin/maf-hq doctor || true
else
    log_warning "maf-hq not found at maf/bin/maf-hq, skipping skill sync"
fi
echo

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
