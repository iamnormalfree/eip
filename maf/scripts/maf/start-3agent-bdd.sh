#!/bin/bash
# start-3agent-bdd.sh - Quick start for 3-agent BDD workflow
# USAGE: bash maf/scripts/maf/start-3agent-bdd.sh [--setup]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Handle --setup flag
if [[ "${1:-}" == "--setup" ]]; then
  echo "Setting up 3-agent BDD environment..."
  bash "$SCRIPT_DIR/setup/setup-3agent-bdd.sh"
  echo ""
  echo "Setup complete. Starting workflow..."
  echo ""
fi

# Check topology
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "Topology file not found: $TOPOLOGY_FILE"
  echo ""
  echo "Setup first:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
  exit 1
fi

# Get session info
SESSION_NAME=$(jq -r '.pod.session // "maf-bdd"' "$TOPOLOGY_FILE")
WINDOW_NAME=$(jq -r '.pod.window // "agents"' "$TOPOLOGY_FILE")

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "TMUX session '$SESSION_NAME' not found"
  echo ""
  echo "Setup first:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
  exit 1
fi

# Check Agent Mail
if ! curl -s http://127.0.0.1:8765/health >/dev/null 2>&1; then
  echo "WARNING: Agent Mail MCP server not detected"
  echo "   Agents will work but mail notifications will fail"
  echo ""
fi

echo "Starting 3-agent BDD workflow..."
echo ""

# Start workflow loop in supervisor pane
tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.0" \
  "bash ${PROJECT_ROOT}/maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --loop" Enter

echo "Workflow started"
echo ""
echo "Monitor in tmux:"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo "Or watch individual panes:"
echo "  Supervisor: tmux attach -t $SESSION_NAME:$WINDOW_NAME.0"
echo "  Reviewer:   tmux attach -t $SESSION_NAME:$WINDOW_NAME.1"
echo "  Implementor: tmux attach -t $SESSION_NAME:$WINDOW_NAME.2"
