#!/bin/bash
# Start Agent with Specialized Prompt
# This script is sourced by rebuild-maf-cli-agents.sh to start each agent

set -euo pipefail

PANE_INDEX="${1:-}"
AGENT_NAME="${2:-}"
AGENT_CMD="${3:-claude}"
PROJECT_ROOT="${4:-/root/projects/nextnest}"

# Map pane index to agent name from topology
get_agent_from_topology() {
    local pane="$1"
    local topology="${PROJECT_ROOT}/.maf/config/agent-topology.json"

    if [[ -f "$topology" ]]; then
        jq -r ".panes[] | select(.index == $pane) | .agent_name // empty" "$topology"
    fi
}

# Get the actual agent name from topology
ACTUAL_AGENT_NAME=$(get_agent_from_topology "$PANE_INDEX")
if [[ -n "$ACTUAL_AGENT_NAME" ]]; then
    AGENT_NAME="$ACTUAL_AGENT_NAME"
fi

# Map agent name to prompt file
case "$AGENT_NAME" in
    RateRidge|rateridge|supervisor|sup|0)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/rateridge-prompt.md"
        ;;
    AuditBay|auditbay|reviewer|rev|1)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/auditbay-prompt.md"
        ;;
    LedgerLeap|ledgerleap|implementor-1|imp1|2)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/ledgerleap-prompt.md"
        ;;
    PrimePortal|primeportal|implementor-2|imp2|3)
        PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/primeportal-prompt.md"
        ;;
    *)
        # No specialized prompt for this agent
        PROMPT_FILE=""
        ;;
esac

# If we have a specialized prompt, inject it
if [[ -n "$PROMPT_FILE" ]] && [[ -f "$PROMPT_FILE" ]]; then
    # Create a temporary file with the prompt
    # This will be sourced by the agent on startup
    AGENT_PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/.active-prompt.md"
    cp "$PROMPT_FILE" "$AGENT_PROMPT_FILE"

    # Set environment variable so agent knows it has specialized prompt
    export AGENT_SPECIALIZED_PROMPT="$PROMPT_FILE"
    export AGENT_NAME="$AGENT_NAME"

    # Print info about what's being loaded
    echo -e "\033[0;32m→ Loading specialized prompt: ${AGENT_NAME}\033[0m" >&2
    echo "  Prompt: $PROMPT_FILE" >&2
fi

# Execute the agent command
if [[ "$AGENT_CMD" == "claude"* ]]; then
    # Claude command - pass through as-is
    # The prompt will be available to the agent context
    exec $AGENT_CMD
else
    # Other commands (codex, etc)
    exec $AGENT_CMD
fi
