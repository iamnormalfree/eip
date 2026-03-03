# MAF Agent Spawner
#
# NOTE: For enhanced spawning with role-based agents, worktree support,
# and memory preservation, use rebuild-maf-cli-agents.sh instead:
#
#   bash maf/scripts/maf/rebuild-maf-cli-agents.sh
#
# This script (spawn-agents.sh) provides basic spawning functionality.
#!/bin/bash
# ABOUTME: Main orchestrator script for MAF tmux-based agent spawning and management.
# ABOUTME: Integrates tmux-utils.sh, agent-utils.sh, error-handling.sh, and profile utilities for multi-Codex support.

set -euo pipefail

# Script directory and project root detection
# Auto-detect project directory (supports subtree installations)
# 
# MAF can be installed in two layouts:
# 1. Direct layout: /project/scripts/maf/*.sh
#    - PROJECT_ROOT is 2 levels up: /project
# 2. Subtree layout: /project/maf/scripts/maf/*.sh
#    - PROJECT_ROOT is 3 levels up: /project
#
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect which layout we are in by checking the directory pattern
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    # Subtree layout detected
    # Path: /project/maf/scripts/maf
    # Go up 3 levels: ../.. = /project
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
elif [[ "$DETECTED_SCRIPT_DIR" == *"/scripts/maf" ]]; then
    # Direct layout detected
    # Path: /project/scripts/maf
    # Go up 2 levels: ../.. = /project
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
else
    # Unknown layout - try to find package.json
    PROJECT_ROOT="$(pwd)"
    while [[ "$PROJECT_ROOT" != "/" && ! -f "$PROJECT_ROOT/package.json" ]]; do
        PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
    done
    if [[ "$PROJECT_ROOT" == "/" ]]; then
        echo "ERROR: Could not detect project root" >&2
        exit 1
    fi
fi

# Export PROJECT_ROOT so sourced scripts do not override it
export PROJECT_ROOT

# Set LIB_DIR - lib is in the same directory as the script (scripts/maf/lib)
LIB_DIR="$DETECTED_SCRIPT_DIR/lib"

# Source core libraries
source "$LIB_DIR/error-handling.sh"
source "$LIB_DIR/tmux-utils.sh"
source "$LIB_DIR/agent-utils.sh"

# Source profile utilities for multi-Codex support
source "$LIB_DIR/profile-loader.sh"
source "$LIB_DIR/credential-manager.sh"

# Configuration defaults
DEFAULT_CONFIG_FILE="$PROJECT_ROOT/.maf/config/default-agent-config.json"
DEFAULT_SESSION_NAME="maf-session"
DEFAULT_LAYOUT="glm_review_3_pane"
DEFAULT_AGENT_COUNT=3
DEFAULT_BACKGROUND_MODE=false

# Global variables for session management
SESSION_NAME=""
CONFIG_FILE=""
LAYOUT=""
AGENT_COUNT=""
BACKGROUND_MODE=""
VERBOSITY=""
CLEANUP_ON_EXIT=""

# Profile-related global variables

# Session name is typically set after parsing arguments and reading config
# Add session conflict validation after SESSION_NAME is populated
# This should be called after reading SESSION_NAME from config but before creating tmux session
validate_session_conflict() {
    if [[ -n "$SESSION_NAME" ]] && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "❌ ERROR: tmux session '$SESSION_NAME' already exists!"
        echo ""
        echo "You have a session name conflict. Choose a unique name:"
        echo "  - Use -s|--session flag: $0 -s maf-your-project"
        echo "  - Or set in config: \"session_name\": \"maf-your-project\""
        echo ""
        echo "Current running sessions:"
        tmux list-sessions 2>/dev/null | sed 's/^/  /'
        echo ""
        echo "To attach to existing session: tmux attach -t '$SESSION_NAME'"
        echo "To kill existing session: tmux kill-session -t '$SESSION_NAME'"
        exit 1
    fi
}
