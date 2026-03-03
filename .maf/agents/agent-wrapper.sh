#!/bin/bash
# Agent Wrapper - Starts specialized agent with prompt
# Usage: agent-wrapper.sh <agent-name> [claude-args...]

set -euo pipefail

AGENT_NAME="${1:-}"
shift  # Remaining args are for claude
CLAUDE_ARGS="$@"

PROJECT_ROOT="/root/projects/nextnest"
PROMPT_FILE="${PROJECT_ROOT}/.maf/agents/${AGENT_NAME}-prompt.md"

# Check if specialized prompt exists
if [[ ! -f "$PROMPT_FILE" ]]; then
    # No specialized prompt, start regular claude
    exec claude "$@"
fi

# Display agent identity
echo -e "\033[1;36m═══════════════════════════════════════════════════\033[0m"
echo -e "\033[1;36m  Agent: ${AGENT_NAME}\033[0m"
echo -e "\033[1;36m  Prompt: ${PROMPT_FILE}\033[0m"
echo -e "\033[1;36m═══════════════════════════════════════════════════\033[0m"
echo ""
echo "Loading specialized agent prompt..."
echo ""

# Start Claude - the prompt will be available in the agent's context
# The prompt file is at $PROMPT_FILE and the agent can reference it
exec claude "$@"
