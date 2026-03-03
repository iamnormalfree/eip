#!/bin/bash
# ABOUTME: Migrate mcp_agent_mail to vendor/agent-mail subtree

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[MIGRATE]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check if mcp_agent_mail exists
if [[ ! -d "mcp_agent_mail" ]]; then
    log_warning "mcp_agent_mail/ not found, may already be migrated"
    exit 0
fi

# Check if vendor/agent-mail already exists
if [[ -d "vendor/agent-mail" ]]; then
    log_warning "vendor/agent-mail/ already exists, skipping migration"
    exit 0
fi

log_info "Migrating mcp_agent_mail to vendor/agent-mail..."

# Backup existing directory
if [[ -d "mcp_agent_mail" ]]; then
    log_info "Backing up mcp_agent_mail to mcp_agent_mail.backup..."
    cp -r mcp_agent_mail mcp_agent_mail.backup
fi

# Remove old directory
log_info "Removing old mcp_agent_mail directory..."
git rm -r mcp_agent_mail || rm -rf mcp_agent_mail

# Add as subtree
log_info "Adding Agent Mail as git subtree..."
git subtree add --prefix=vendor/agent-mail \
    https://github.com/Dicklesworthstone/mcp_agent_mail main --squash

log_info "Migration complete!"
log_info "Backup saved at mcp_agent_mail.backup/"
log_info "Test the new setup with: bash scripts/maf/bootstrap-agent-mail.sh status"
