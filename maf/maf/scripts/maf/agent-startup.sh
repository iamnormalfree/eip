#!/bin/bash
# agent-startup.sh - Agent identity loader - injects agent persona into Claude session
#
# USAGE:
#   maf/scripts/maf/agent-startup.sh <agent_name> <prompt_file> <claude_command...>
#
# WHAT IT DOES:
#   - Loads agent identity from prompt file before starting Claude
#   - Injects agent persona into Claude session
#   - Called by rebuild-maf-cli-agents.sh to start Claude with agent identity
#
# ENVIRONMENT VARIABLES:
#   PROJECT_ROOT - Project root directory (auto-detected if not set)
#
# CUSTOMIZATION:
#   For project-specific behavior, create a wrapper script in scripts/maf/
#   that calls this script with your project's settings.

set -euo pipefail

# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

# Agent identity passed from rebuild script
AGENT_NAME="${1:-}"
AGENT_PROMPT_FILE="${2:-}"
shift 2 || true
# Remaining arguments are the Claude command

# Colors for output
CYAN='\033[1;36m'
NC='\033[0m'

# Show usage
show_usage() {
    cat << 'EOF'
MAF Agent Startup - Agent Identity Loader

USAGE:
    maf/scripts/maf/agent-startup.sh <agent_name> <prompt_file> <claude_command...>

ARGUMENTS:
    agent_name       Name of the agent (e.g., RateRidge, AuditBay)
    prompt_file      Path to agent prompt file (e.g., .maf/agents/RateRidge-prompt.md)
    claude_command   Command to start Claude with all its arguments

WHAT IT DOES:
    - Loads agent identity from prompt file
    - Displays agent identity header
    - Stores identity for Claude to access
    - Starts Claude with the agent's original command

EXAMPLES:
    # Start Claude with agent identity
    bash maf/scripts/maf/agent-startup.sh RateRidge .maf/agents/RateRidge-prompt.md claude

    # With custom project root
    PROJECT_ROOT=/custom/path bash maf/scripts/maf/agent-startup.sh RateRidge .maf/agents/RateRidge-prompt.md claude
EOF
    exit 0
}

# Validate arguments
if [[ -z "$AGENT_NAME" ]]; then
    echo "Error: Missing agent_name argument"
    show_usage
fi

# Load agent identity if prompt file exists
if [[ -n "$AGENT_PROMPT_FILE" && -f "$AGENT_PROMPT_FILE" ]]; then
    # Display agent identity header
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Agent: ${AGENT_NAME}${NC}"
    echo -e "${CYAN}  Identity loaded from: $(basename "$AGENT_PROMPT_FILE")${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "Type '/identity' at any time to reload your agent prompt."
    echo ""

    # Export for Claude to access
    export AGENT_NAME="$AGENT_NAME"
    export AGENT_PROMPT_FILE="$AGENT_PROMPT_FILE"

    # Store in a file Claude can read
    mkdir -p "$PROJECT_ROOT/.maf/agents"
    cat > "$PROJECT_ROOT/.maf/agents/current-identity.txt" << EOF
Agent Identity: ${AGENT_NAME}
Prompt File: ${AGENT_PROMPT_FILE}

$(cat "$AGENT_PROMPT_FILE")
EOF
fi

# Start Claude with the agent's original command
if [[ $# -eq 0 ]]; then
    # No command provided - just exit (identity loaded)
    :
else
    exec "$@"
fi
