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
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

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
