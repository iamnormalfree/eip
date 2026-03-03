#!/bin/bash
# ABOUTME: Rollback MAF installation to a previous restore point
# ABOUTME: Supports --list flag, interactive restore point selection, health checks

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[ROLLBACK]${NC} $1"; }
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
RESTORE_DIR="${1:-}"
LIST_FLAG=""

if [[ "$RESTORE_DIR" == "--list" ]]; then
    LIST_FLAG="--list"
    RESTORE_DIR=""
elif [[ "$RESTORE_DIR" == "-l" ]]; then
    LIST_FLAG="--list"
    RESTORE_DIR=""
fi

# Handle --list flag
if [[ -n "$LIST_FLAG" ]]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           Available MAF Restore Points                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo

    mapfile -t restore_points < <(ls -dt .maf.restore.* 2>/dev/null || true)

    if [[ ${#restore_points[@]} -eq 0 ]]; then
        log_warning "No restore points found"
        log_info "Restore points are created automatically before updates"
        exit 0
    fi

    log_info "Found ${#restore_points[@]} restore point(s):"
    echo

    for i in "${!restore_points[@]}"; do
        rp="${restore_points[$i]}"
        index=$((i + 1))
        timestamp="${rp#.maf.restore.}"

        # Check if restore point is valid
        if [[ -d "$rp" ]]; then
            # Get size info
            size=$(du -sh "$rp" 2>/dev/null | cut -f1)

            # Check contents
            has_claude="  "
            has_maf="  "
            has_vendor="  "
            has_maf_subtree="  "

            [[ -d "$rp/.claude" ]] && has_claude="${GREEN}✓${NC}"
            [[ -d "$rp/.maf" ]] && has_maf="${GREEN}✓${NC}"
            [[ -d "$rp/vendor" ]] && has_vendor="${GREEN}✓${NC}"
            [[ -d "$rp/maf" ]] && has_maf_subtree="${GREEN}✓${NC}"

            echo -e "${BOLD}[$index]${NC} $rp"
            echo -e "    Timestamp: $timestamp"
            echo -e "    Size: $size"
            echo -e "    Contents: [$has_maf_subtree maf] [$has_claude .claude] [$has_maf .maf] [$has_vendor vendor]"
            echo
        fi
    done

    log_info "Usage: $0 <restore-point-directory>"
    log_info "Example: $0 ${restore_points[0]}"
    exit 0
fi

# If no restore point specified, show usage and list available
if [[ -z "$RESTORE_DIR" ]]; then
    echo "Usage: $0 <restore-point-directory|--list>"
    echo
    echo "Examples:"
    echo "  $0 --list           - Show available restore points"
    echo "  $0 .maf.restore.20260109_123456 - Rollback to specific restore point"
    echo

    # Try to show available restore points
    mapfile -t restore_points < <(ls -dt .maf.restore.* 2>/dev/null | head -5 || true)

    if [[ ${#restore_points[@]} -gt 0 ]]; then
        log_info "Recent restore points:"
        for rp in "${restore_points[@]}"; do
            echo "  - $rp"
        done
    else
        log_warning "No restore points found"
        log_info "Restore points are created automatically before updates"
    fi
    exit 1
fi

# Expand partial path (e.g., .maf.restore.20260109 -> .maf.restore.20260109_123456)
if [[ ! -d "$RESTORE_DIR" ]]; then
    # Try to find a matching restore point
    mapfile -t matching_points < <(ls -d "$RESTORE_DIR"* 2>/dev/null || true)

    if [[ ${#matching_points[@]} -eq 0 ]]; then
        log_error "Restore point not found: $RESTORE_DIR"
        exit 1
    elif [[ ${#matching_points[@]} -eq 1 ]]; then
        RESTORE_DIR="${matching_points[0]}"
        log_info "Expanded to: $RESTORE_DIR"
    else
        log_warning "Multiple restore points match '$RESTORE_DIR':"
        for rp in "${matching_points[@]}"; do
            echo "  - $rp"
        done
        log_error "Please specify the full restore point directory"
        exit 1
    fi
fi

# Validate restore point
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

# Show restore point contents
log_info "Restore point contents:"
[[ -d "$RESTORE_DIR/.claude" ]] && echo "  ✓ .claude/" || echo "  ✗ .claude/ (not backed up)"
[[ -d "$RESTORE_DIR/.maf" ]] && echo "  ✓ .maf/" || echo "  ✗ .maf/ (not backed up)"
[[ -d "$RESTORE_DIR/vendor" ]] && echo "  ✓ vendor/" || echo "  ✗ vendor/ (not backed up)"
[[ -d "$RESTORE_DIR/maf" ]] && echo "  ✓ maf/" || echo "  ✗ maf/ (not backed up)"
echo

# Confirm
read -rp "This will replace current directories with backup. Continue? [y/N]: " -n 1 confirm
echo

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Stop running agents
log_step "Stopping running agents..."
agents_stopped=0

if command -v tmux &> /dev/null; then
    while IFS= read -r session; do
        log_info "Killing tmux session: $session"
        tmux kill-session -t "$session" 2>/dev/null || true
        agents_stopped=$((agents_stopped + 1))
    done < <(tmux list-sessions 2>/dev/null | grep maf- | awk '{print $1}' | sed 's/://')
fi

if [[ $agents_stopped -eq 0 ]]; then
    log_info "No running MAF agents found"
else
    log_success "Stopped $agents_stopped agent session(s)"
fi
echo

# Restore directories
log_step "Restoring directories..."
restored=0
skipped=0

# Restore .claude/
if [[ -d "$RESTORE_DIR/.claude" ]]; then
    log_info "Restoring .claude/..."
    rm -rf "$PROJECT_ROOT/.claude"
    cp -r "$RESTORE_DIR/.claude" "$PROJECT_ROOT/.claude"
    log_success "Restored .claude/"
    restored=$((restored + 1))
else
    log_warning "No .claude/ backup found, skipping"
    skipped=$((skipped + 1))
fi

# Restore .maf/
if [[ -d "$RESTORE_DIR/.maf" ]]; then
    log_info "Restoring .maf/..."
    rm -rf "$PROJECT_ROOT/.maf"
    cp -r "$RESTORE_DIR/.maf" "$PROJECT_ROOT/.maf"
    log_success "Restored .maf/"
    restored=$((restored + 1))
else
    log_warning "No .maf/ backup found, skipping"
    skipped=$((skipped + 1))
fi

# Restore vendor/
if [[ -d "$RESTORE_DIR/vendor" ]]; then
    log_info "Restoring vendor/..."
    rm -rf "$PROJECT_ROOT/vendor"
    cp -r "$RESTORE_DIR/vendor" "$PROJECT_ROOT/vendor"
    log_success "Restored vendor/"
    restored=$((restored + 1))
else
    log_warning "No vendor/ backup found, skipping"
    skipped=$((skipped + 1))
fi

# Restore maf/ subtree
if [[ -d "$RESTORE_DIR/maf" ]]; then
    log_info "Restoring maf/ subtree..."
    rm -rf "$PROJECT_ROOT/maf"
    cp -r "$RESTORE_DIR/maf" "$PROJECT_ROOT/maf"
    log_success "Restored maf/"
    restored=$((restored + 1))
else
    log_warning "No maf/ backup found, skipping"
    skipped=$((skipped + 1))
fi

echo
log_success "Restored $restored director(y/ies), Skipped $skipped"
echo

# Reset git state for subtree directories
log_step "Resetting git state for subtrees..."
git reset HEAD maf/ vendor/ 2>/dev/null || true
git checkout -- maf/ vendor/ 2>/dev/null || true
log_success "Git state reset"
echo

# Run health check
log_step "Running health check..."
HEALTH_CHECK_SCRIPT="$PROJECT_ROOT/maf/scripts/maf/health-check.sh"

if [[ -f "$HEALTH_CHECK_SCRIPT" ]]; then
    if bash "$HEALTH_CHECK_SCRIPT"; then
        log_success "Health check passed"
        HEALTH_STATUS="✓ PASSED"
    else
        log_warning "Health check had warnings"
        log_info "Run manually for details: bash $HEALTH_CHECK_SCRIPT"
        HEALTH_STATUS="⚠ WARNINGS"
    fi
else
    log_warning "Health check script not found at $HEALTH_CHECK_SCRIPT"
    log_info "Skipping health check validation"
    HEALTH_STATUS="⊘ SKIPPED"
fi
echo

# Summary
echo "═══════════════════════════════════════════════════════════"
log_success "Rollback complete!"
echo
log_info "Summary:"
echo "  - Restore point: $RESTORE_DIR"
echo "  - Directories restored: $restored"
echo "  - Health check: $HEALTH_STATUS"
echo
log_info "Restore point preserved at: $RESTORE_DIR"
log_info "Delete when confident: rm -rf $RESTORE_DIR"
echo
log_info "Next steps:"
echo "  1. Verify your setup is working correctly"
echo "  2. Run health check: bash maf/scripts/maf/health-check.sh"
echo "  3. Review what caused the rollback"
echo "  4. Delete restore point when confident: rm -rf $RESTORE_DIR"
echo "═══════════════════════════════════════════════════════════"
