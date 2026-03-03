#!/bin/bash
# mock-tmux.sh - Mock tmux for testing workflow hooks
#
# This script mocks the tmux commands used by autonomous-workflow.sh
# for testing purposes without requiring an actual tmux session.

# Mock tmux command handler
case "${1:-}" in
    has-session)
        # Mock session existence check
        if [[ "${MAF_TMUX_SESSION_EXISTS:-true}" == "true" ]]; then
            exit 0
        else
            exit 1
        fi
        ;;
    capture-pane)
        # Mock pane capture - return sample output
        echo ">"
        echo ""
        echo "[$(date '+%H:%M:%S')] Agent ready"
        ;;
    send-keys)
        # Mock sending keys to pane
        # In tests, we just capture what would be sent
        echo "[MOCK] tmux send-keys: ${@:2}" >&2
        exit 0
        ;;
    new-session|new-window|select-pane|split-window)
        # Mock session/window management
        echo "[MOCK] tmux $@" >&2
        exit 0
        ;;
    *)
        # Unknown tmux command
        echo "[MOCK] tmux $@" >&2
        exit 0
        ;;
esac
