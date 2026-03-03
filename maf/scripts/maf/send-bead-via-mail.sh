#!/bin/bash
# send-bead-via-mail.sh - Send bead assignment via Agent Mail MCP
#
# USAGE:
#   maf/scripts/maf/send-bead-via-mail.sh <from_agent> <to_agent> <bead_id> <instruction>
#
# WHAT IT DOES:
#   - Sends bead assignment to agent via Agent Mail MCP
#   - Replaces tmux send-keys for agent communication
#   - Uses Agent Mail names mapped from MAF topology
#
# ENVIRONMENT VARIABLES:
#   AGENT_MAIL_URL - Agent Mail MCP server (default: http://127.0.0.1:8765)
#   AGENT_MAIL_PROJECT - Project key (default: $PROJECT_ROOT)
#
# CUSTOMIZATION:
#   For project-specific behavior, create a wrapper script in scripts/maf/
#   that calls this script with your project's agent name mappings.

set -euo pipefail

# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

# Configuration
AGENT_MAIL_URL="${AGENT_MAIL_URL:-http://127.0.0.1:8765}"
AGENT_MAIL_PROJECT="${AGENT_MAIL_PROJECT:-$PROJECT_ROOT}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
    exit 1
}

# Show usage
show_usage() {
    cat << 'EOF'
MAF Send Bead via Agent Mail

USAGE:
    maf/scripts/maf/send-bead-via-mail.sh <from_agent> <to_agent> <bead_id> <instruction>

ARGUMENTS:
    from_agent    Agent mail name sending the assignment (use get_mail_name_by_role helper)
    to_agent      Target agent mail name to receive assignment (use get_mail_name_by_role helper)
    bead_id       Bead ID to assign (e.g., BEAD-001)
    instruction   Implementation instruction for the agent

ENVIRONMENT VARIABLES:
    AGENT_MAIL_URL       Agent Mail MCP server (default: http://127.0.0.1:8765)
    AGENT_MAIL_PROJECT   Project key for Agent Mail (default: $PROJECT_ROOT)

EXAMPLES:
    # Source preflight-gatekeeper for topology helpers
    source maf/scripts/maf/preflight-gatekeeper.sh

    # Send bead assignment from supervisor to implementor (dynamic names)
    supervisor=$(get_mail_name_by_role "supervisor")
    implementor=$(get_mail_name_by_role "implementor-1")
    bash maf/scripts/maf/send-bead-via-mail.sh "$supervisor" "$implementor" BEAD-001 "Implement user authentication"

    # With custom Agent Mail URL
    AGENT_MAIL_URL=http://localhost:8765 bash maf/scripts/maf/send-bead-via-mail.sh "$supervisor" "$implementor" BEAD-001 "Implement feature"

NOTE: Use get_mail_name_by_role() from preflight-gatekeeper.sh to get agent mail names dynamically from topology.
EOF
    exit 0
}

# Parse arguments
MA_SEND_FROM="${1:-}"
MA_SEND_TO="${2:-}"
MA_BEAD_ID="${3:-}"
MA_INSTRUCTION="${4:-}"

# Validate arguments
if [[ -z "$MA_BEAD_ID" || -z "$MA_INSTRUCTION" ]]; then
    error "Missing required arguments. Use --help for usage."
fi

# Log the send operation
log "Sending bead assignment via Agent Mail..."
log "  From: $MA_SEND_FROM"
log "  To: $MA_SEND_TO"
log "  Bead: $MA_BEAD_ID"

# Send via Agent Mail MCP
RESPONSE=$(curl -s -X POST "$AGENT_MAIL_URL/mcp/" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": \"send\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"send_message\",
      \"arguments\": {
        \"project_key\": \"$AGENT_MAIL_PROJECT\",
        \"sender_name\": \"$MA_SEND_FROM\",
        \"to\": [\"$MA_SEND_TO\"],
        \"subject\": \"Bead Assignment: $MA_BEAD_ID\",
        \"body_md\": \"$MA_INSTRUCTION\",
        \"importance\": \"high\"
      }
    }
  }" 2>&1)

# Check for success (deliveries array present = success)
# Response format: {"result":{"structuredContent":{"deliveries":[...]}}}
if echo "$RESPONSE" | jq -e '.result.structuredContent.deliveries' >/dev/null 2>&1; then
    log "✅ Sent: $MA_BEAD_ID → $MA_SEND_TO via Agent Mail"
    exit 0
else
    error "Failed: $MA_BEAD_ID → $MA_SEND_TO

Response:
$(echo "$RESPONSE" | jq -r '.error.message // .result.content[0].text // $RESPONSE' 2>/dev/null)"
fi
