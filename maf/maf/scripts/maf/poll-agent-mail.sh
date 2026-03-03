#!/bin/bash
# poll-agent-mail.sh - Start mail polling for an agent
# USAGE: bash maf/scripts/maf/poll-agent-mail.sh <role>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Source preflight for topology helpers (in same directory)
source "${SCRIPT_DIR}/preflight-gatekeeper.sh"

ROLE="${1:-}"
if [[ -z "$ROLE" ]]; then
  echo "Usage: $0 <role>"
  echo ""
  echo "Roles: supervisor, reviewer, implementor"
  exit 1
fi

# Get topology file
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "ERROR: Topology file not found: $TOPOLOGY_FILE"
  exit 2
fi

# Get mail name for role
MAIL_NAME=$(get_mail_name_by_role "$ROLE")
if [[ -z "$MAIL_NAME" ]]; then
  echo "ERROR: No mail name found for role: $ROLE"
  exit 2
fi

# Get polling interval from BDD config
POLLING_INTERVAL=$(jq -r '.bdd_config.mail_polling_interval_seconds // 10' "$TOPOLOGY_FILE")

echo "🔄 Starting mail polling for $ROLE ($MAIL_NAME)"
echo "   Polling interval: ${POLLING_INTERVAL}s"
echo "   Topology: $TOPOLOGY_FILE"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run Python poller
cd "$PROJECT_ROOT"
python3 "${SCRIPT_DIR}/lib/mail_poller.py" \
  --agent-name "$MAIL_NAME" \
  --topology-file "$TOPOLOGY_FILE" \
  --interval "$POLLING_INTERVAL"
