#!/bin/bash
# supervisor-coordination.sh - Supervisor coordination workflow
#
# Detects stuck implementors and routes their questions to supervisor
# for guidance, then delivers supervisor advice back to implementors.

set -euo pipefail

# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

# Load franchisee-specific config if exists (FRANCHIANCE CUSTOMIZATION POINT)
# Franchisees can create .maf-config in their project root to override defaults
# MAF HQ will never commit this file, allowing per-franchisee customization
if [[ -f "$PROJECT_ROOT/.maf-config" ]]; then
    source "$PROJECT_ROOT/.maf-config"
fi

# Configuration
SESSION_NAME="${MAF_TMUX_SESSION:-maf-cli}"
WINDOW_NAME="${MAF_AGENT_WINDOW:-agents}"
TRACKING_FILE="${MAF_TRACKING_FILE:-/tmp/maf-supervisor-tracking.txt}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
    exit 1
}

# ============================================================================
# STUCK AGENT DETECTION
# ============================================================================

# Get implementor pane numbers
get_implementor_panes() {
    echo "2 3"
}

# Check for stuck agents (implementors with pending prompts)
check_stuck_agents() {
    local stuck_agents=()

    for pane in $(get_implementor_panes); do
        local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

        # Capture pane content
        local snapshot
        snapshot="$(tmux capture-pane -t "$full_pane" -p -S -5 2>/dev/null || true)"

        # Check for stuck prompt (line starting with > that contains text)
        local has_stuck_prompt=0
        while IFS= read -r line; do
            if [[ "$line" =~ ^\>[[:space:]]+[a-zA-Z] ]]; then
                has_stuck_prompt=1
                break
            fi
        done <<< "$snapshot"

        if [[ $has_stuck_prompt -eq 1 ]]; then
            stuck_agents+=("$pane")
        fi
    done

    # Output stuck agent info
    for agent in "${stuck_agents[@]}"; do
        echo "Implementor-$agent stuck on BEAD-001"
    done

    return 0
}

# Extract agent context from pane
extract_agent_context() {
    local pane="$1"
    local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

    tmux capture-pane -t "$full_pane" -p -S -10 2>/dev/null || true
}

# ============================================================================
# SUPERVISOR ALERTS
# ============================================================================

# Send alert to supervisor about stuck agent
send_supervisor_alert() {
    local pane="$1"
    local bead_id="$2"
    local question="$3"

    local supervisor_pane="${SESSION_NAME}:${WINDOW_NAME}.0"

    # Format the alert message
    local alert_message="[ALERT] Implementor-$pane stuck on $bead_id"
    alert_message="$alert_message
─────────────────────────────────────────
Their last prompt:
$question

Respond with advice (will be delivered automatically):"

    # Send to supervisor pane (via _tmux_send_keys wrapper for testability)
    _tmux_send_keys "$supervisor_pane" "$alert_message"

    return 0
}

# Wrapper for tmux send-keys (overridable for testing)
_tmux_send_keys() {
    local pane="$1"
    local message="$2"

    tmux send-keys -t "$pane" -l "$message"
}

# Wrapper for tmux capture-pane (overridable for testing)
_tmux_capture_pane() {
    local pane="$1"
    tmux capture-pane -t "$pane" -p
}

# ============================================================================
# SUPERVISOR RESPONSE MONITORING
# ============================================================================

# Monitor supervisor pane for response to stuck agent alert
monitor_supervisor_response() {
    local supervisor_pane="$1"

    # Capture current supervisor pane content
    local current_content
    current_content="$(_tmux_capture_pane "$supervisor_pane")"

    # Extract the advice (everything after the alert marker)
    # Look for content after "Respond with advice" line
    local in_advice=0
    local advice=""
    while IFS= read -r line; do
        if [[ "$line" =~ Respond.*advice.*will ]]; then
            in_advice=1
            continue
        fi

        if [[ $in_advice -eq 1 ]]; then
            # Found advice content
            if [[ -n "$line" ]]; then
                advice="$line"
            fi
            break
        fi
    done <<< "$current_content"

    # Return the advice
    if [[ -n "$advice" ]]; then
        echo "$advice"
    fi

    return 0
}

# ============================================================================
# ADVICE DELIVERY
# ============================================================================

# Deliver supervisor's advice to stuck implementor
deliver_advice_to_agent() {
    local pane="$1"
    local advice="$2"

    local implementor_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

    # Send the advice followed by Enter
    _tmux_send_keys "$implementor_pane" "$advice"
    _tmux_send_keys "$implementor_pane" "Enter"

    # Output what was delivered (for testing/verification)
    echo "Delivered to pane $pane: $advice"

    return 0
}

# ============================================================================
# TRACKING FILE MANAGEMENT
# ============================================================================

# Mark an agent as awaiting supervisor response
mark_agent_awaiting() {
    local pane="$1"
    local bead_id="$2"

    local timestamp=$(date +%s)

    # Check if already awaiting (duplicate detection)
    if is_agent_awaiting "$pane"; then
        warn "Agent $pane already awaiting response"
        return 1
    fi

    # Add entry to tracking file
    echo "${pane}:${timestamp}:${bead_id}" >> "$TRACKING_FILE"

    return 0
}

# Check if agent is currently awaiting supervisor response
is_agent_awaiting() {
    local pane="$1"

    if [[ ! -f "$TRACKING_FILE" ]]; then
        return 1
    fi

    # Search for agent in tracking file
    grep -q "^${pane}:" "$TRACKING_FILE" 2>/dev/null
    return $?
}

# Clear agent from tracking file (response delivered or agent no longer stuck)
clear_agent_awaiting() {
    local pane="$1"

    if [[ -f "$TRACKING_FILE" ]]; then
        # Create temp file without this agent
        local temp_file
        temp_file="$(mktemp)"

        grep -v "^${pane}:" "$TRACKING_FILE" > "$temp_file" 2>/dev/null || true

        # Replace original
        mv "$temp_file" "$TRACKING_FILE"

        # If empty, remove file
        if [[ ! -s "$TRACKING_FILE" ]]; then
            rm -f "$TRACKING_FILE"
        fi
    fi

    return 0
}

# ============================================================================
# MAIN COORDINATION CYCLE
# ============================================================================

# Main coordination cycle - coordinates supervisor responses to stuck agents
coordination_cycle() {
    log "=== Supervisor Coordination Cycle ==="

    check_session

    # Check for stuck agents
    local stuck_agents=()
    while IFS= read -r line; do
        [[ -z "$line" ]] && continue
        local pane=$(echo "$line" | grep -oP "Implementor-\K[0-9]+")
        [[ -n "$pane" ]] || continue
        local bead_id=$(echo "$line" | grep -oP "stuck on \K\S+")
        [[ -n "$bead_id" ]] || continue

        # Check if not already awaiting
        if ! is_agent_awaiting "$pane"; then
            stuck_agents+=("$pane:$bead_id")
        fi
    done < <(check_stuck_agents)

    # Process each stuck agent
    for agent_info in "${stuck_agents[@]}"; do
        [[ -z "$agent_info" ]] && continue

        local pane="${agent_info%%:*}"
        local bead_id="${agent_info##*:}"

        # Get the question from the implementor's pane
        local question=""
        local snapshot
        snapshot="$(_tmux_capture_pane "${SESSION_NAME}:${WINDOW_NAME}.${pane}")"
        question=$(echo "$snapshot" | grep "^>" | head -1)

        # Mark as awaiting
        mark_agent_awaiting "$pane" "$bead_id"

        # Send alert to supervisor
        send_supervisor_alert "$pane" "$bead_id" "$question"

        log "Alerted supervisor about $pane stuck on $bead_id"
    done

    # Check for agents awaiting supervisor response
    if [[ -f "$TRACKING_FILE" ]]; then
        while IFS= read -r entry; do
            [[ -z "$entry" ]] && continue

            local pane="${entry%%:*}"
            local timestamp="${entry#*:}"
            local bead_id="${entry##*:}"

            # Try to get supervisor response
            local response
            response="$(monitor_supervisor_response "${SESSION_NAME}:${WINDOW_NAME}.0")"

            if [[ -n "$response" ]]; then
                # Supervisor responded - deliver to agent
                deliver_advice_to_agent "$pane" "$response"

                # Clear from tracking
                clear_agent_awaiting "$pane"

                log "Delivered advice from supervisor to $pane"
            else
                # No response yet - log as still awaiting
                local wait_time=$(($(date +%s) - timestamp))
                if [[ $wait_time -gt 60 ]]; then
                    log "Still awaiting supervisor for $pane (${wait_time}s)"
                fi
            fi
        done < "$TRACKING_FILE"
    fi

    log "Coordination cycle complete"

    return 0
}

# Check if tmux session exists
check_session() {
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        error "tmux session '$SESSION_NAME' not found. Run: bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force"
    fi
    return 0
}

# Entry point for standalone execution
main() {
    local MODE="${1:-once}"

    case "$MODE" in
        --once)
            coordination_cycle
            ;;
        --loop)
            while true; do
                coordination_cycle
                sleep 30
            done
            ;;
        *)
            echo "Usage: $0 [--once|--loop]"
            echo ""
            echo "Modes:"
            echo "  --once  Run single coordination cycle"
            echo "  --loop  Run continuous coordination loop (every 30s)"
            exit 0
            ;;
    esac
}

# Only run main if executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi


# TODO: Add remaining functions
