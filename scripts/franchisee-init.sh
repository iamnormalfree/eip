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

# Dry-run mode
DRY_RUN=false

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BOLD}[STEP]${NC} $1"; }
log_dryrun() { echo -e "${YELLOW}[DRY-RUN]${NC} $1"; }

# Cleanup trap for partial failures
cleanup_on_error() {
    log_warning "Cleaning up after failure..."
    if [[ -d "maf" ]] && $DRY_RUN; then
        log_info "Would remove maf/ directory"
    elif [[ -d "maf" ]]; then
        log_info "Removing maf/ directory"
        rm -rf maf
    fi
}

trap cleanup_on_error ERR

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Initialize a new franchisee repository with MAF."
            echo
            echo "Options:"
            echo "  --dry-run    Preview changes without executing"
            echo "  -h, --help   Show this help message"
            echo
            echo "Environment Variables:"
            echo "  MAF_REPO              MAF repository URL (default: https://github.com/iamnormalfree/maf)"
            echo "  MAF_BRANCH            MAF branch (default: main)"
            echo "  AGENT_MAIL_REPO       Agent Mail repository URL"
            echo "  AGENT_MAIL_BRANCH     Agent Mail branch (default: main)"
            echo "  INCLUDE_SUPERPOWERS   Set to 'true' to include Superpowers subtree"
            echo "  SUPERPOWERS_REPO      Superpowers repository URL"
            echo "  SUPERPOWERS_BRANCH    Superpowers branch (default: main)"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository. Please run from your project root."
    exit 1
fi

# Check if git subtree is available
if ! command -v git subtree > /dev/null 2>&1; then
    log_error "git subtree command not found. Please install git subtree."
    log_info "On most systems: apt install git-subtree (Debian/Ubuntu) or brew install git-subtree (macOS)"
    exit 1
fi

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

if $DRY_RUN; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     MAF Franchisee Initialization Wizard (DRY-RUN)       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
else
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║        MAF Franchisee Initialization Wizard               ║"
    echo "╚════════════════════════════════════════════════════════════╝"
fi
echo

# Step 1: Add MAF subtree
log_step "1/6: Adding MAF subtree..."
if [[ -d "maf" ]]; then
    log_warning "maf/ directory already exists, skipping subtree add"
else
    log_info "Adding MAF as git subtree..."
    MAF_REPO="${MAF_REPO:-https://github.com/iamnormalfree/maf}"
    MAF_BRANCH="${MAF_BRANCH:-main}"

    if $DRY_RUN; then
        log_dryrun "Would execute: git subtree add --prefix=maf $MAF_REPO $MAF_BRANCH --squash"
    else
        if git subtree add --prefix=maf "$MAF_REPO" "$MAF_BRANCH" --squash; then
            log_success "MAF subtree added"
        else
            log_error "Failed to add MAF subtree"
            exit 1
        fi
    fi
fi
echo

# Step 2: Add vendor subtrees
log_step "2/6: Adding vendor subtrees..."

# Agent Mail
if [[ -d "vendor/agent-mail" ]]; then
    log_warning "vendor/agent-mail/ already exists, skipping"
else
    log_info "Adding Agent Mail subtree..."
    AGENT_MAIL_REPO="${AGENT_MAIL_REPO:-https://github.com/Dicklesworthstone/mcp_agent_mail}"
    AGENT_MAIL_BRANCH="${AGENT_MAIL_BRANCH:-main}"

    if $DRY_RUN; then
        log_dryrun "Would execute: mkdir -p vendor"
        log_dryrun "Would execute: git subtree add --prefix=vendor/agent-mail $AGENT_MAIL_REPO $AGENT_MAIL_BRANCH --squash"
    else
        mkdir -p vendor
        if git subtree add --prefix=vendor/agent-mail "$AGENT_MAIL_REPO" "$AGENT_MAIL_BRANCH" --squash; then
            log_success "Agent Mail subtree added"
        else
            log_error "Failed to add Agent Mail subtree"
            exit 1
        fi
    fi
fi

# Response-Awareness
if [[ -d "vendor/response-awareness" ]]; then
    log_warning "vendor/response-awareness/ already exists, skipping"
else
    log_info "Adding Response-Awareness subtree..."
    RESPONSE_AWARENESS_REPO="${RESPONSE_AWARENESS_REPO:-https://github.com/Typhren42/Response-Awareness}"
    RESPONSE_AWARENESS_BRANCH="${RESPONSE_AWARENESS_BRANCH:-main}"

    if $DRY_RUN; then
        log_dryrun "Would execute: mkdir -p vendor"
        log_dryrun "Would execute: git subtree add --prefix=vendor/response-awareness $RESPONSE_AWARENESS_REPO $RESPONSE_AWARENESS_BRANCH --squash"
    else
        mkdir -p vendor
        if git subtree add --prefix=vendor/response-awareness "$RESPONSE_AWARENESS_REPO" "$RESPONSE_AWARENESS_BRANCH" --squash; then
            log_success "Response-Awareness subtree added"
        else
            log_error "Failed to add Response-Awareness subtree"
            exit 1
        fi
    fi
fi

# Superpowers (optional)
if [[ "${INCLUDE_SUPERPOWERS:-false}" == "true" ]]; then
    if [[ -d "vendor/superpowers" ]]; then
        log_warning "vendor/superpowers/ already exists, skipping"
    else
        log_info "Adding Superpowers subtree..."
        SUPERPOWERS_REPO="${SUPERPOWERS_REPO:-https://github.com/obra/superpowers}"
        SUPERPOWERS_BRANCH="${SUPERPOWERS_BRANCH:-main}"

        if $DRY_RUN; then
            log_dryrun "Would execute: mkdir -p vendor"
            log_dryrun "Would execute: git subtree add --prefix=vendor/superpowers $SUPERPOWERS_REPO $SUPERPOWERS_BRANCH --squash"
        else
            mkdir -p vendor
            if git subtree add --prefix=vendor/superpowers "$SUPERPOWERS_REPO" "$SUPERPOWERS_BRANCH" --squash; then
                log_success "Superpowers subtree added"
            else
                log_warning "Failed to add Superpowers subtree (continuing anyway)"
            fi
        fi
    fi
fi
echo

# Step 3: Merge .claude/ directories
log_step "3/6: Merging .claude/ directories..."
log_info "Ensuring .claude manifest exists..."
if [[ -f "maf/scripts/maf/generate-manifest.sh" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: bash maf/scripts/maf/generate-manifest.sh"
    else
        bash maf/scripts/maf/generate-manifest.sh
    fi
fi
if [[ -f "maf/scripts/maf/merge-claude.sh" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: bash maf/scripts/maf/merge-claude.sh"
    else
        bash maf/scripts/maf/merge-claude.sh
    fi
else
    log_warning "merge-claude.sh not found at maf/scripts/maf/merge-claude.sh, skipping .claude/ merge"
fi
echo

# Step 3.5: Initialize agent topology configuration
log_step "3.5/6: Initializing agent topology configuration..."
MAF_CONFIG_DIR=".maf/config"
TOPOLOGY_EXAMPLE="templates/agent-topology.json.example"
TOPOLOGY_TARGET="$MAF_CONFIG_DIR/agent-topology.json"

# Create .maf/config directory if it doesn't exist
if [[ ! -d "$MAF_CONFIG_DIR" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: mkdir -p $MAF_CONFIG_DIR"
    else
        mkdir -p "$MAF_CONFIG_DIR"
        log_success "Created .maf/config directory"
    fi
fi

# Copy agent topology example if target doesn't exist
if [[ -f "$TOPOLOGY_TARGET" ]]; then
    log_warning "Agent topology already exists at $TOPOLOGY_TARGET, skipping copy"
elif [[ -f "$TOPOLOGY_EXAMPLE" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: cp $TOPOLOGY_EXAMPLE $TOPOLOGY_TARGET"
    else
        cp "$TOPOLOGY_EXAMPLE" "$TOPOLOGY_TARGET"
        log_success "Agent topology initialized from example"
        log_info "Review and customize: $TOPOLOGY_TARGET"
    fi
else
    log_warning "Agent topology example not found at $TOPOLOGY_EXAMPLE, skipping initialization"
fi
echo

# Step 3.6: Syncing skills
log_step "3.6/6: Syncing skills..."
if [[ -x "maf/bin/maf-hq" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: bash maf/bin/maf-hq update"
        log_dryrun "Would execute: bash maf/bin/maf-hq doctor"
    else
        bash maf/bin/maf-hq update
        bash maf/bin/maf-hq doctor || true
    fi
else
    log_warning "maf-hq not found at maf/bin/maf-hq, skipping skill sync"
fi
echo

# Step 4: Run MAF setup script
log_step "4/6: Running MAF setup wizard..."
if [[ -f "maf/scripts/setup-maf.sh" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: bash maf/scripts/setup-maf.sh"
    else
        bash maf/scripts/setup-maf.sh
    fi
else
    log_warning "setup-maf.sh not found at maf/scripts/setup-maf.sh, skipping MAF setup"
fi
echo

# Step 5: Validate installation
log_step "5/6: Validating installation..."
# Check for Node.js-based health check script
if [[ -f "maf/scripts/maf/health-check.mjs" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: node maf/scripts/maf/health-check.mjs"
    else
        if command -v node > /dev/null 2>&1; then
            if node maf/scripts/maf/health-check.mjs; then
                log_success "Health check passed"
            else
                log_warning "Health check had warnings (may need attention)"
            fi
        else
            log_warning "Node.js not found, skipping health check"
            log_info "Install Node.js to run health checks: https://nodejs.org/"
        fi
    fi
# Fallback to bash-based health check script if it exists
elif [[ -f "maf/scripts/maf/health-check.sh" ]]; then
    if $DRY_RUN; then
        log_dryrun "Would execute: bash maf/scripts/maf/health-check.sh"
    else
        if bash maf/scripts/maf/health-check.sh; then
            log_success "Health check passed"
        else
            log_warning "Health check had warnings (may need attention)"
        fi
    fi
else
    log_warning "health-check.mjs or health-check.sh not found in maf/scripts/maf/, skipping validation"
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
echo "  - Health check:  node maf/scripts/maf/health-check.mjs"
echo "  - Merge .claude: bash maf/scripts/maf/merge-claude.sh"
echo "═══════════════════════════════════════════════════════════"
