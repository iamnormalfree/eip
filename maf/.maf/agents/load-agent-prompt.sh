#!/bin/bash
# Load Agent-Specific Prompt
# Usage: load-agent-prompt.sh <agent-name> <claude-settings-path>
#
# This script loads an agent's specialized prompt and outputs
# a command to start Claude with that prompt injected

set -euo pipefail

AGENT_NAME="${1:-}"
CLAUDE_SETTINGS="${2:-.claude}"
PROJECT_ROOT="${3:-/root/projects/nextnest}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

if [[ -z "$AGENT_NAME" ]]; then
    echo "Usage: $0 <agent-name> [claude-settings] [project-root]" >&2
    exit 1
fi

# Map agent names to their prompt files
case "$AGENT_NAME" in
    RateRidge|rateridge|supervisor|sup|0)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/rateridge-prompt.md"
        AGENT_DISPLAY="RateRidge"
        ;;
    AuditBay|auditbay|reviewer|rev|1)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/auditbay-prompt.md"
        AGENT_DISPLAY="AuditBay"
        ;;
    LedgerLeap|ledgerleap|implementor-1|imp1|2)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/ledgerleap-prompt.md"
        AGENT_DISPLAY="LedgerLeap"
        ;;
    PrimePortal|primeportal|implementor-2|imp2|3)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/primeportal-prompt.md"
        AGENT_DISPLAY="PrimePortal"
        ;;
    *)
        echo "Unknown agent: $AGENT_NAME" >&2
        exit 1
        ;;
esac

# Check if prompt file exists
if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "Agent prompt not found: $PROMPT_FILE" >&2
    exit 1
fi

# Create temp directory for agent-specific settings
TEMP_SETTINGS_DIR="${PROJECT_ROOT}/.maf/agents/temp"
mkdir -p "$TEMP_SETTINGS_DIR"

# Create agent-specific Claude settings with system prompt
AGENT_SETTINGS="${TEMP_SETTINGS_DIR}/${AGENT_NAME}-settings.json"

# Build the claude command with system prompt
cat > "$AGENT_SETTINGS" << EOF
{
  "name": "${AGENT_DISPLAY}",
  "description": "Specialized agent for Nextnest mortgage system",
  "systemPrompt": $(jq -Rs . "$PROMPT_FILE")
}
EOF

# Output the command to start Claude with agent prompt
echo "claude --settings \"$AGENT_SETTINGS\" --project \"$PROJECT_ROOT\""
