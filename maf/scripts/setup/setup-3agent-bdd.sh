#!/bin/bash
# setup-3agent-bdd.sh - Create 3-agent BDD tmux session
# USAGE: bash maf/scripts/setup/setup-3agent-bdd.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source preflight for topology helpers
source "${PROJECT_ROOT}/maf/scripts/maf/preflight-gatekeeper.sh"

# Check topology
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "ERROR: Topology file not found: $TOPOLOGY_FILE"
  echo "Create one with:"
  echo "  cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json"
  exit 1
fi

# Get session info
SESSION_NAME=$(jq -r '.pod.session // "maf-bdd"' "$TOPOLOGY_FILE")
WINDOW_NAME=$(jq -r '.pod.window // "agents"' "$TOPOLOGY_FILE")

echo "🚀 Setting up 3-agent BDD tmux session..."
echo ""

# Kill existing session if exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Killing existing session..."
  tmux kill-session -t "$SESSION_NAME"
fi

# Create new session with 3 panes
echo "Creating tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -n "$WINDOW_NAME"
tmux split-window -t "$SESSION_NAME:$WINDOW_NAME"
tmux split-window -t "$SESSION_NAME:$WINDOW_NAME"
tmux select-layout -t "$SESSION_NAME:$WINDOW_NAME" even-horizontal

# Get agent mail names
SUPERVISOR_MAIL=$(get_mail_name_by_role "supervisor")
REVIEWER_MAIL=$(get_mail_name_by_role "reviewer")
IMPLEMENTOR_MAIL=$(get_mail_name_by_role "implementor")

echo "Session created with 3 panes:"
echo "  Pane 0: Supervisor ($SUPERVISOR_MAIL)"
echo "  Pane 1: Reviewer ($REVIEWER_MAIL)"
echo "  Pane 2: Implementor ($IMPLEMENTOR_MAIL)"
echo ""

# Start mail pollers in each pane
echo "Starting mail pollers..."

# Reviewer poller
echo "  Reviewer mail poller..."
tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.1" \
  "bash maf/scripts/maf/poll-agent-mail.sh reviewer" Enter

# Implementor poller
echo "  Implementor mail poller..."
tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.2" \
  "bash maf/scripts/maf/poll-agent-mail.sh implementor" Enter

echo ""
echo "✅ Setup complete!"
echo ""
echo "Session: $SESSION_NAME"
echo "Attach with: tmux attach -t $SESSION_NAME"
echo ""
echo "Panes:"
echo "  0: Supervisor (runs workflow loop)"
echo "  1: Reviewer (polls for completion, reviews automatically)"
echo "  2: Implementor (polls for feedback, implements beads)"
echo ""
echo "To start workflow:"
echo "  tmux send-keys -t $SESSION_NAME:$WINDOW_NAME.0 'bash maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --loop' Enter"
