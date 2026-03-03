#!/bin/bash
# bdd-status.sh - Check status of 3-agent BDD workflow
# USAGE: bash maf/scripts/maf/bdd-status.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source preflight for topology helpers
source "${PROJECT_ROOT}/maf/scripts/maf/preflight-gatekeeper.sh" 2>/dev/null || true

TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"

# Check if topology exists
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "Topology file not found: $TOPOLOGY_FILE"
  echo ""
  echo "Setup first:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
  exit 1
fi

SESSION_NAME=$(jq -r '.pod.session // "maf-bdd"' "$TOPOLOGY_FILE")
WINDOW_NAME=$(jq -r '.pod.window // "agents"' "$TOPOLOGY_FILE")

echo "3-Agent BDD Workflow Status"
echo "==========================="
echo ""

# Check tmux session
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "TMUX Session: $SESSION_NAME (running)"
  echo ""

  # Check each pane
  for pane in 0 1 2; do
    role=$(jq -r ".panes[$pane].role // \"unknown\"" "$TOPOLOGY_FILE" 2>/dev/null || echo "unknown")
    mail_name=$(jq -r ".panes[$pane].mail_name // \"unknown\"" "$TOPOLOGY_FILE" 2>/dev/null || echo "unknown")

    # Get pane status
    snapshot=$(tmux capture-pane -t "$SESSION_NAME:$WINDOW_NAME.$pane" -p -S -2 2>/dev/null || true)

    if echo "$snapshot" | grep -qi "polling"; then
      status="[Polling mail]"
    elif echo "$snapshot" | grep -qi "implementing"; then
      status="[Implementing]"
    elif echo "$snapshot" | grep -qi "reviewing"; then
      status="[Reviewing]"
    elif echo "$snapshot" | grep -qi "workflow"; then
      status="[Running workflow]"
    else
      status="[Idle]"
    fi

    echo "  Pane $pane ($role/$mail_name): $status"
  done
else
  echo "TMUX Session: Not running"
  echo ""
  echo "Start with:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
fi

echo ""

# Check Agent Mail
if curl -s http://127.0.0.1:8765/health >/dev/null 2>&1; then
  echo "Agent Mail: Running"
else
  echo "Agent Mail: Not running (mail notifications unavailable)"
fi

echo ""

# Check ready beads
READY_COUNT=$(bd ready --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
echo "Ready Beads: $READY_COUNT"

# Check progress
echo ""
python3 "${SCRIPT_DIR}/lib/bv_integration.py" --progress 2>/dev/null || echo "BV Progress: Unavailable"
