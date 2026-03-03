#!/bin/bash

# MAF Autonomous Agent Coordination (Enhanced)
# Smart bead assignment with agent availability checking and cooldown tracking
#
# USAGE:
#   bash maf/scripts/maf/coordinate-agents.sh [--once|--loop] [--session NAME]
#
# ENVIRONMENT VARIABLES:
#   MAF_TMUX_SESSION - Tmux session name (default: maf-cli)
#   MAF_AGENT_WINDOW - Window name (default: agents)
#   MAF_COORDINATION_COOLDOWN - Cooldown seconds (default: 300)
#   MAF_ASSIGN_MODE - "smart" or "all" (default: smart)
#   SKILL_ROUTING_MODE - Skill routing for implementors
#
# MODES:
#   --once  Run single assignment cycle
#   --loop  Run continuous coordination loop
#
# WHAT IT DOES:
#   - Checks agent availability before assigning
#   - Tracks cooldown to prevent reassigning same bead
#   - Routes beads to available agents only
#   - Supports skill routing for implementors
#
# CUSTOMIZATION:
#   For project-specific customization, create a wrapper script
#   in scripts/maf/ that calls this with your settings.

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SESSION_NAME="${MAF_TMUX_SESSION:-maf-cli}"
WINDOW_NAME="${MAF_AGENT_WINDOW:-agents}"
MODE="${1:-once}"
COOLDOWN_SECONDS="${MAF_COORDINATION_COOLDOWN:-300}"
ASSIGN_MODE="${MAF_ASSIGN_MODE:-smart}"  # "smart" or "all"
TRACKING_FILE="/tmp/maf-coordination-tracking.txt"
ATTEMPT_TRACKING_FILE="${ATTEMPT_TRACKING_FILE:-/tmp/maf-bead-attempts.txt}"
SECOND_ATTEMPT_PREFS_FILE="${SECOND_ATTEMPT_PREFS_FILE:-/tmp/maf-second-attempt-prefs.txt}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Auto-detect project directory
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

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

die() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

# Check required commands
require_cmd tmux
require_cmd jq
require_cmd bd

# ============================================================================
# AGENT MAIL INTEGRATION
# ============================================================================

# Check if Agent Mail (mcp-agent-mail) is available
has_agent_mail() {
    command -v mcp-agent-mail >/dev/null 2>&1
}

# Send Agent Mail notification for bead assignment
send_agent_mail_notification() {
    local bead_id="$1"
    local pane="$2"
    local skill_cmd="$3"

    # Skip if Agent Mail not available
    if ! has_agent_mail; then
        debug "Agent Mail not available, skipping notification"
        return 0
    fi

    # Determine agent name based on pane
    local agent_name
    case "$pane" in
        0) agent_name="${MAF_SUPERVISOR_NAME:-Supervisor}" ;;
        1) agent_name="${MAF_REVIEWER_NAME:-Reviewer}" ;;
        2) agent_name="${MAF_IMPLEMENTOR_1_NAME:-Implementor-1}" ;;
        3) agent_name="${MAF_IMPLEMENTOR_2_NAME:-Implementor-2}" ;;
        *) agent_name="Agent-$pane" ;;
    esac

    # Get attempt info for context
    local attempt_info
    attempt_info="$(get_bead_attempt_info "$bead_id")"
    local attempt_count
    attempt_count="$(echo "$attempt_info" | cut -d: -f1)"

    # Send assignment notification
    local message
    message="[ASSIGNMENT] Bead ${bead_id} assigned to ${agent_name}

Bead ID: ${bead_id}
Skill: ${skill_cmd}
Attempt: ${attempt_count}
Assigned via: bd start + tmux

Please check your terminal for the bead context and begin work."

    # Send via Agent Mail (non-blocking, log errors)
    if mcp-agent-mail send "$agent_name" "Bead Assignment: ${bead_id}" "$message" >/dev/null 2>&1; then
        log "Agent Mail notification sent to ${agent_name} for ${bead_id}"
    else
        debug "Agent Mail notification failed (non-critical)"
    fi

    return 0
}

# ============================================================================
# BEAD ATTEMPT TRACKING
# ============================================================================

# Get attempt count and last skill for a bead
get_bead_attempt_info() {
    local bead_id="$1"

    if [[ ! -f "$ATTEMPT_TRACKING_FILE" ]]; then
        echo "0:none"
        return
    fi

    local entry
    entry="$(grep "^${bead_id}:" "$ATTEMPT_TRACKING_FILE" 2>/dev/null | tail -1 || true)"

    if [[ -z "$entry" ]]; then
        echo "0:none"
        return
    fi

    local attempt_count
    local last_skill
    attempt_count="$(echo "$entry" | cut -d: -f2)"
    last_skill="$(echo "$entry" | cut -d: -f3)"

    echo "${attempt_count}:${last_skill}"
}

# Record bead attempt with skill used
record_bead_attempt() {
    local bead_id="$1"
    local skill="$2"

    # Get current attempt count
    local info
    info="$(get_bead_attempt_info "$bead_id")"
    local current_attempt
    current_attempt="$(echo "$info" | cut -d: -f1)"

    # Increment attempt count
    local new_attempt=$((current_attempt + 1))
    local timestamp="$(date +%s)"

    # Append to tracking file
    echo "${bead_id}:${new_attempt}:${skill}:${timestamp}" >> "$ATTEMPT_TRACKING_FILE"

    log "Recorded attempt ${new_attempt} for ${bead_id} using ${skill}"

    return 0
}

# Clear bead attempts when completed
clear_bead_attempts() {
    local bead_id="$1"

    if [[ -f "$ATTEMPT_TRACKING_FILE" ]]; then
        # Remove all entries for this bead
        local temp_file
        temp_file="$(mktemp)"
        grep -v "^${bead_id}:" "$ATTEMPT_TRACKING_FILE" > "$temp_file" 2>/dev/null || true
        mv "$temp_file" "$ATTEMPT_TRACKING_FILE"

        # If empty, remove file
        if [[ ! -s "$ATTEMPT_TRACKING_FILE" ]]; then
            rm -f "$ATTEMPT_TRACKING_FILE"
        fi
    fi

    # Also clear second attempt preference
    if [[ -f "$SECOND_ATTEMPT_PREFS_FILE" ]]; then
        local temp_file
        temp_file="$(mktemp)"
        grep -v "^${bead_id}:" "$SECOND_ATTEMPT_PREFS_FILE" > "$temp_file" 2>/dev/null || true
        mv "$temp_file" "$SECOND_ATTEMPT_PREFS_FILE"

        if [[ ! -s "$SECOND_ATTEMPT_PREFS_FILE" ]]; then
            rm -f "$SECOND_ATTEMPT_PREFS_FILE"
        fi
    fi

    log "Cleared attempts for ${bead_id}"

    return 0
}

# Set second attempt skill preference (called by supervisor)
set_second_attempt_skill() {
    local bead_id="$1"
    local skill="$2"

    # Create file if doesn't exist
    touch "$SECOND_ATTEMPT_PREFS_FILE"

    # Remove existing entry
    local temp_file
    temp_file="$(mktemp)"
    grep -v "^${bead_id}:" "$SECOND_ATTEMPT_PREFS_FILE" > "$temp_file" 2>/dev/null || true
    mv "$temp_file" "$SECOND_ATTEMPT_PREFS_FILE"

    # Add new entry
    echo "${bead_id}:${skill}" >> "$SECOND_ATTEMPT_PREFS_FILE"

    log "Set second attempt skill for ${bead_id} to ${skill}"

    return 0
}

# Get second attempt skill preference
get_second_attempt_skill() {
    local bead_id="$1"

    if [[ -f "$SECOND_ATTEMPT_PREFS_FILE" ]]; then
        grep "^${bead_id}:" "$SECOND_ATTEMPT_PREFS_FILE" 2>/dev/null | cut -d: -f2- || true
    fi
}

# Route bead to appropriate skill based on attempt history
route_skill_for_bead() {
    local bead_id="$1"

    # Get attempt info
    local info
    info="$(get_bead_attempt_info "$bead_id")"
    local attempt_count
    local last_skill
    attempt_count="$(echo "$info" | cut -d: -f1)"
    last_skill="$(echo "$info" | cut -d: -f2)"

    log "Bead ${bead_id}: attempt ${attempt_count}, last skill: ${last_skill}"

    case "$attempt_count" in
        0)
            # First attempt - always response-awareness
            echo "/response-awareness"
            ;;
        1)
            # Second attempt - check for preference or default to TDD
            local second_attempt_skill
            second_attempt_skill="$(get_second_attempt_skill "$bead_id")"

            if [[ -n "$second_attempt_skill" ]]; then
                echo "$second_attempt_skill"
            else
                # Default to TDD for second attempt
                echo "/tdd"
            fi
            ;;
        2)
            # Third attempt - toggle from second attempt
            if [[ "$last_skill" == "tdd" ]]; then
                echo "/superpowers:subagent-driven-development"
            elif [[ "$last_skill" == "sdd" ]]; then
                echo "/tdd"
            elif [[ "$last_skill" == "response-awareness" ]]; then
                # If first attempt was RA, default to TDD
                echo "/tdd"
            else
                # Fallback to TDD
                echo "/tdd"
            fi
            ;;
        *)
            # Fourth+ attempts - alternate between TDD and SDD
            if [[ "$last_skill" == "tdd" ]]; then
                echo "/superpowers:subagent-driven-development"
            else
                echo "/tdd"
            fi
            ;;
    esac
}

# Extract skill name from command for recording
extract_skill_name() {
    local skill_cmd="$1"

    if [[ "$skill_cmd" == "/tdd" ]]; then
        echo "tdd"
    elif [[ "$skill_cmd" == *"/superpowers:subagent-driven-development" ]]; then
        echo "sdd"
    else
        echo "response-awareness"
    fi
}

# ============================================================================
# AGENT STATUS CHECKING
# ============================================================================

# Check if agent pane is actively working (not idle)
# This prevents assigning work to already-busy agents
is_agent_busy() {
    local pane="$1"
    local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

    # Check ONLY the last 2 lines for current activity state
    local snapshot
    snapshot="$(tmux capture-pane -t "$full_pane" -p -S -2 2>/dev/null || true)"

    # Check for CURRENT activity indicators
    if echo "$snapshot" | grep -qiE "Effecting…|Thinking…|Waiting…|Running…|Whirring…|Drizzling…|Doing…|Lollygagging…|Manifesting…|Routing…|Checking…"; then
        return 0  # Agent is busy (actively working)
    fi

    # Check for Bash command currently running (has ● but no prompt yet)
    if echo "$snapshot" | grep -q "^● .*⎿"; then
        return 0  # Agent is busy (command running)
    fi

    # Check if there's a prompt with text (agent asked a question)
    local last_line
    last_line="$(echo "$snapshot" | tail -1)"
    if echo "$last_line" | grep -qE "^>.*[a-zA-Z]" && echo "$last_line" | grep -qv "send$"; then
        # Agent has a pending question - clear it and treat as available
        log "Clearing pending prompt from pane $pane..."
        tmux send-keys -t "$full_pane" C-c C-u 2>/dev/null || true
        sleep 0.3
        return 1  # Now available for work
    fi

    return 1  # Agent is idle (ready for new work)
}

# Get list of implementor panes (can be overridden by franchisee)
get_implementor_panes() {
    # Default: panes 2 and 3 are implementors
    echo "2 3"
}

# Get list of all agent panes
get_all_panes() {
    echo "0 1 2 3"
}

# ============================================================================
# BEAD COOLDOWN TRACKING
# ============================================================================

# Initialize tracking file
init_tracking() {
    mkdir -p "$(dirname "$TRACKING_FILE")"
    touch "$TRACKING_FILE"

    # Clean up old entries
    local current_time
    current_time="$(date +%s)"
    local temp_file
    temp_file="$(mktemp)"

    while IFS= read -r line; do
        local bead_time
        bead_time="$(echo "$line" | awk '{print $2}')"
        if [[ -n "$bead_time" ]] && [[ $((current_time - bead_time)) -lt $COOLDOWN_SECONDS ]]; then
            echo "$line" >> "$temp_file"
        fi
    done < "$TRACKING_FILE"

    mv "$temp_file" "$TRACKING_FILE" 2>/dev/null || true
}

# Check if bead is in cooldown
is_bead_in_cooldown() {
    local bead_id="$1"
    grep -q "^${bead_id} " "$TRACKING_FILE" 2>/dev/null
}

# Mark bead as assigned (start cooldown)
mark_bead_assigned() {
    local bead_id="$1"
    local current_time="$(date +%s)"
    echo "${bead_id} ${current_time}" >> "$TRACKING_FILE"
}

# ============================================================================
# BEAD ASSIGNMENT
# ============================================================================

# Get ready bead IDs
get_ready_beads() {
    cd "$PROJECT_ROOT" || return 1
    bd ready --json 2>/dev/null | jq -r '.[].id' 2>/dev/null || true
}

# Find first available bead not in cooldown
find_available_bead() {
    local beads
    beads="$(get_ready_beads)"

    while IFS= read -r bead_id; do
        [[ -z "$bead_id" ]] && continue
        if ! is_bead_in_cooldown "$bead_id"; then
            echo "$bead_id"
            return 0
        fi
    done <<< "$beads"

    return 1  # No available beads
}

# Assign bead to first available implementor
assign_bead_smart() {
    local bead_id="$1"

    # Find first available implementor
    for pane in $(get_implementor_panes); do
        if ! is_agent_busy "$pane"; then
            log "Assigning $bead_id to pane $pane (agent appears idle)"
            send_bead_to_agent "$bead_id" "$pane"
            mark_bead_assigned "$bead_id"
            return 0
        fi
    done

    warn "No available implementors for $bead_id (all busy)"
    return 1
}

# Assign bead to ALL implementors (spray and pray - original behavior)
assign_bead_all() {
    local bead_id="$1"

    for pane in $(get_implementor_panes); do
        log "Assigning $bead_id to pane $pane (all mode)"
        send_bead_to_agent "$bead_id" "$pane"
    done

    mark_bead_assigned "$bead_id"
    return 0
}

# Send bead assignment command to agent pane
send_bead_to_agent() {
    local bead_id="$1"
    local pane="$2"
    local pane_full="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

    # Get appropriate skill based on attempt history (progressive escalation)
    local skill_cmd
    skill_cmd="$(route_skill_for_bead "$bead_id")"

    # Extract skill name for recording
    local skill_name
    skill_name="$(extract_skill_name "$skill_cmd")"

    # Record this attempt
    record_bead_attempt "$bead_id" "$skill_name"

    # Clear any pending input
    tmux send-keys -t "$pane_full" C-c C-u 2>/dev/null || true
    sleep 0.1

    # Send assignment command with skill invocation (existing tmux injection)
    local assign_cmd="bd start $bead_id && $skill_cmd"
    tmux send-keys -t "$pane_full" -l "$assign_cmd"
    tmux send-keys -t "$pane_full" Enter
    sleep 0.5

    # NEW: Also send Agent Mail notification for agents that check Agent Mail
    # This provides dual-channel communication for compatibility
    send_agent_mail_notification "$bead_id" "$pane" "$skill_cmd"

    log "Sent: $bead_id → pane $pane (attempt: $(get_bead_attempt_info "$bead_id" | cut -d: -f1), skill: $skill_cmd)"
}

# ============================================================================
# SESSION CHECKING
# ============================================================================

check_session() {
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        die "tmux session '$SESSION_NAME' not found. Run: bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force"
    fi
    return 0
}

# ============================================================================
# MAIN FUNCTIONS
# ============================================================================

# Single coordination cycle
coordinate_cycle() {
    log "=== Coordination Cycle ==="

    check_session
    init_tracking

    local bead_id
    bead_id="$(find_available_bead)"

    if [[ -z "$bead_id" ]]; then
        log "No available beads (all in cooldown or no ready beads)"
        return 1
    fi

    if [[ "$ASSIGN_MODE" == "all" ]]; then
        assign_bead_all "$bead_id"
    else
        assign_bead_smart "$bead_id"
    fi
}

# Continuous coordination loop
coordinate_loop() {
    log "Starting MAF coordination loop..."
    log "Session: $SESSION_NAME"
    log "Mode: $ASSIGN_MODE"
    log "Cooldown: ${COOLDOWN_SECONDS}s"
    log "Press Ctrl+C to stop"

    while true; do
        if ! coordinate_cycle; then
            log "Waiting 30 seconds before next check..."
            sleep 30
        fi
    done
}

# ============================================================================
# ENTRY POINT
# ============================================================================

# Parse arguments
for arg in "$@"; do
    case "$arg" in
        --once) MODE="once" ;;
        --loop) MODE="loop" ;;
        --session)
            SESSION_NAME="${2:-}"
            shift 2
            ;;
        --clear-attempts)
            # Clear attempt tracking for a completed bead
            clear_bead_attempts "$2"
            exit 0
            ;;
        --set-skill)
            # Set second attempt skill preference
            local bead_id="$2"
            local skill="$3"
            case "$skill" in
                tdd|/tdd)
                    set_second_attempt_skill "$bead_id" "/tdd"
                    ;;
                sdd|/superpowers:subagent-driven-development)
                    set_second_attempt_skill "$bead_id" "/superpowers:subagent-driven-development"
                    ;;
                *)
                    die "Invalid skill: $skill. Use 'tdd' or 'sdd'"
                    ;;
            esac
            exit 0
            ;;
        --show-attempts)
            # Show attempt history for a bead
            local bead_id="$2"
            if [[ -f "$ATTEMPT_TRACKING_FILE" ]]; then
                echo "Attempt history for ${bead_id}:"
                grep "^${bead_id}:" "$ATTEMPT_TRACKING_FILE" 2>/dev/null || echo "No attempts found"
            else
                echo "No attempt tracking file found"
            fi
            exit 0
            ;;
        -h|--help)
            echo "Usage: $0 [--once|--loop] [--session NAME] [OPTIONS]"
            echo ""
            echo "Coordination Modes:"
            echo "  --once     Run single assignment cycle (default)"
            echo "  --loop     Run continuous coordination loop"
            echo "  --session  Specify tmux session name"
            echo ""
            echo "Progressive Skill Escalation Options:"
            echo "  --clear-attempts BEAD_ID     Clear attempts when bead is completed"
            echo "  --set-skill BEAD_ID SKILL    Set second attempt skill (tdd|sdd)"
            echo "  --show-attempts BEAD_ID      Show attempt history for bead"
            echo ""
            echo "Environment (can also be set in .maf-config):"
            echo "  MAF_TMUX_SESSION         Tmux session name (default: maf-cli)"
            echo "  MAF_AGENT_WINDOW          Window name (default: agents)"
            echo "  MAF_COORDINATION_COOLDOWN Cooldown in seconds (default: 300)"
            echo "  MAF_ASSIGN_MODE           'smart' or 'all' (default: smart)"
            echo ""
            echo "Franchisee Configuration:"
            echo "  Create .maf-config in project root to set defaults."
            echo "  Copy maf/scripts/maf/.maf-config.example as a template."
            echo "  This file is never committed to MAF HQ."
            echo ""
            echo "Progressive Skill Escalation:"
            echo "  Attempt 1: /response-awareness (default)"
            echo "  Attempt 2: /tdd or /sdd (set via --set-skill, defaults to /tdd)"
            echo "  Attempt 3: Auto-toggle to other skill"
            echo ""
            echo "Examples:"
            echo "  $0 --once"
            echo "  $0 --loop --session my-session"
            echo "  $0 --clear-attempts BEAD-001"
            echo "  $0 --set-skill BEAD-002 tdd"
            echo "  $0 --show-attempts BEAD-003"
            exit 0
            ;;
        *) ;;
    esac
done

# Run based on mode (only if executed directly, not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ "$MODE" == "loop" ]]; then
        coordinate_loop
    else
        coordinate_cycle
        if [[ "$?" -ne 0 ]]; then
            exit 1
        fi
    fi
fi
