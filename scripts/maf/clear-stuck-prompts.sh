#!/bin/bash
# Clear stuck prompts from all maf-cli agent panes
# Usage: ./scripts/maf/clear-stuck-prompts.sh [--pane <0|1|2|3>]

set -e

SESSION_NAME="${MAF_TMUX_SESSION:-maf-cli}"
WINDOW_NAME="${MAF_AGENT_WINDOW:-agents}"

# Parse arguments
CLEAR_PANE=""
if [[ "$1" == "--pane" ]]; then
    CLEAR_PANE="$2"
fi

# Function to detect if pane has pending input
has_pending_input() {
    local pane=$1
    local prompt_line
    prompt_line=$(tmux capture-pane -t "$pane" -p -S -30 | awk '/^[[:space:]]*[>›]/ {line=$0} END {print line}')
    prompt_line=$(echo "$prompt_line" | sed -E $'s/\x1B\\[[0-9;?]*[ -/]*[@-~]//g; s/\xC2\xA0/ /g')
    if [[ -z "$prompt_line" ]]; then
        echo "false"
        return
    fi

    # Strip trailing "send" helper text if present.
    local stripped
    stripped=$(echo "$prompt_line" | sed -E 's/[[:space:]]+↵[[:space:]]*send[[:space:]]*$//; s/[[:space:]]+send[[:space:]]*$//')

    # Extract text after prompt symbol.
    local prompt_text
    prompt_text=$(echo "$stripped" | sed -E 's/^[[:space:]]*[>›][[:space:]]+//')

    if [[ -n "$prompt_text" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

# Function to clear a single pane
clear_pane() {
    local pane=$1
    local pane_target="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

    if [[ ! "$(tmux display-message -p -t "$pane_target" '#{pane_dead}')" == "0" ]]; then
        echo "⚠️  Pane $pane does not exist"
        return 1
    fi

    if [[ "$(has_pending_input "$pane_target")" == "true" ]]; then
        echo "→ Clearing pane $pane..."
        # First attempt: C-c C-u
        tmux send-keys -t "$pane_target" C-c C-u
        sleep 0.2
        # Verify cleared
        if [[ "$(has_pending_input "$pane_target")" == "true" ]]; then
            # Still stuck, more aggressive clear with space
            tmux send-keys -t "$pane_target" " "
            sleep 0.1
            tmux send-keys -t "$pane_target" C-u C-u
            sleep 0.1
        fi
        echo "✓ Cleared pane $pane"
    else
        echo "○ Pane $pane already clear"
    fi
}

# Clear specified pane or all panes
if [[ -n "$CLEAR_PANE" ]]; then
    clear_pane "$CLEAR_PANE"
else
    echo "Clearing stuck prompts from all panes..."
    echo ""
    for pane in 0 1 2 3; do
        clear_pane "$pane"
        echo ""
    done
    echo "Done! Verify with: tmux attach -t ${SESSION_NAME}:${WINDOW_NAME}"
fi
