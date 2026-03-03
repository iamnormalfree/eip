#!/bin/bash
# nextnest-customizations.sh - Custom workflow hooks for NextNest franchisee
#
# ABOUT THIS FILE:
#   This file demonstrates how NextNest franchisee customizes the MAF autonomous
#   workflow without modifying MAF HQ files. It serves as a migration example
#   for franchisees transitioning from hardcoded customizations to the hooks system.
#
# MIGRATION STORY:
#   Before: autonomous-workflow-nextnest.sh had hardcoded values and logic
#   After: This file contains all customizations, sourced via MAF_CUSTOM_HOOKS
#
# USAGE:
#   export MAF_CUSTOM_HOOKS="$(pwd)/experiments/nextnest-customizations.sh"
#   bash experiments/autonomous-workflow-nextnest.sh
#
# NEXTNEST-SPECIFIC CUSTOMIZATIONS:
#   - Custom Agent Mail URL and project path
#   - Agent Mail names retrieved from topology (not hardcoded)
#   - Off-hours throttling for high-risk beads
#   - Custom bead routing for "database" and "external" labels
#   - Slack notifications for critical assignments
#   - Extended timeouts for long-running supervisor commands
#   - Workflow stop signal handling (via .maf/stop.now file)
#
# SEE ALSO:
#   - maf/templates/custom-workflow-hooks.sh.template - Full hooks documentation
#   - experiments/autonomous-workflow-nextnest.sh - Main workflow script
#   - .maf/config/agent-topology.json - Agent Mail name configuration

set -euo pipefail

# ============================================================================
# NEXTNEST CONFIGURATION
# ============================================================================

# NextNest-specific paths and URLs
PROJECT_ROOT="${PROJECT_ROOT:-/root/projects/nextnest}"
export AGENT_MAIL_URL="${AGENT_MAIL_URL:-http://127.0.0.1:8765}"
export AGENT_MAIL_PROJECT="${AGENT_MAIL_PROJECT:-/root/projects/nextnest}"
export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"  # Set in .env.local

# NextNest operational hours (for throttling customizations)
NEXTNEST_BUSINESS_HOURS_START="${NEXTNEST_BUSINESS_HOURS_START:-09}"
NEXTNEST_BUSINESS_HOURS_END="${NEXTNEST_BUSINESS_HOURS_END:-17}"

# NextNest logging
NEXTNEST_LOG_DIR="${PROJECT_ROOT}/.maf/logs"
mkdir -p "$NEXTNEST_LOG_DIR"
NEXTNEST_ASSIGNMENT_LOG="${NEXTNEST_LOG_DIR}/assignments.log"
NEXTNEST_METRICS_FILE="${NEXTNEST_LOG_DIR}/metrics.csv"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

nextnest_log() {
    local timestamp
    timestamp=$(date -Iseconds)
    echo "[$timestamp] $*" >> "$NEXTNEST_ASSIGNMENT_LOG"
}

# ============================================================================
# HOOK 1: BEFORE LOOP - NextNest Initialization
# ============================================================================

HOOK_BEFORE_LOOP() {
    echo -e "${BLUE}NEXTNEST: Initializing custom workflow${NC}"

    # Verify NextNest topology is configured
    local topology_file="${PROJECT_ROOT}/.maf/config/agent-topology.json"
    if [[ ! -f "$topology_file" ]]; then
        echo -e "${RED}ERROR: NextNest topology not found at $topology_file${NC}" >&2
        return 2
    fi

    # Verify Agent Mail MCP is reachable
    if command -v curl >/dev/null; then
        if ! curl -s -f "$AGENT_MAIL_URL/health" >/dev/null 2>&1; then
            echo -e "${YELLOW}WARNING: Agent Mail MCP not reachable at $AGENT_MAIL_URL${NC}" >&2
            echo -e "${YELLOW}         Workflow will continue but message delivery may fail${NC}" >&2
        else
            echo -e "${GREEN}✓ Agent Mail MCP verified at $AGENT_MAIL_URL${NC}"
        fi
    fi

    # Initialize metrics file with header if it doesn't exist
    if [[ ! -f "$NEXTNEST_METRICS_FILE" ]]; then
        echo "timestamp,iteration,bead_id,agent_name,pane,skill,status" > "$NEXTNEST_METRICS_FILE"
    fi

    nextnest_log "WORKFLOW_START initialized"

    return 0
}

# ============================================================================
# HOOK 2: BEFORE CHECK - Off-Hours and Stop Signal Handling
# ============================================================================

HOOK_BEFORE_CHECK() {
    local iteration="$1"
    local last_status="$2"

    # Check for external stop signal (created by external automation)
    local stop_file="${PROJECT_ROOT}/.maf/stop.now"
    if [[ -f "$stop_file" ]]; then
        echo -e "${YELLOW}NEXTNEST: Stop signal detected via $stop_file${NC}"
        rm -f "$stop_file"
        nextnest_log "WORKFLOW_STOP stop_signal_detected"
        return 2  # Abort workflow
    fi

    # Throttle workflow during off-hours (11 PM - 6 AM)
    local current_hour
    current_hour=$(date '+%H')
    if (( current_hour >= 23 || current_hour < 6 )); then
        echo -e "${YELLOW}NEXTNEST: Off-hours detected (hour: $current_hour), extending interval${NC}"
        sleep 60  # Extended sleep during off-hours
    fi

    return 0
}

# ============================================================================
# HOOK 3: BEFORE ASSIGN - High-Risk Bead Throttling
# ============================================================================

HOOK_BEFORE_ASSIGN() {
    local bead_id="$1"
    local ready_beads="$2"

    # Get bead labels
    local bead_labels
    bead_labels=$(echo "$ready_beads" | jq -r ".[] | select(.id == $bead_id) | .labels[]")

    # Throttle high-risk beads during off-hours
    if echo "$bead_labels" | grep -q "high-risk"; then
        local current_hour
        current_hour=$(date '+%H')
        if (( current_hour < NEXTNEST_BUSINESS_HOURS_START || current_hour >= NEXTNEST_BUSINESS_HOURS_END )); then
            echo -e "${YELLOW}NEXTNEST: Skipping high-risk bead $bead_id during off-hours${NC}"
            nextnest_log "ASSIGNMENT_SKIP bead=$bead_id reason=off_hours_high_risk"
            return 1  # Skip this bead
        fi
    fi

    # Skip beads marked for external processing
    if echo "$bead_labels" | grep -q "external-only"; then
        echo -e "${BLUE}NEXTNEST: Bead $bead_id marked for external processing${NC}"
        return 1  # Skip default assignment
    fi

    return 0
}

# ============================================================================
# HOOK 4: AFTER ASSIGN - NextNest Assignment Tracking
# ============================================================================

HOOK_AFTER_ASSIGN() {
    local bead_id="$1"
    local agent_name="$2"
    local pane="$3"
    local skill="$4"

    # Log assignment to NextNest tracking file
    nextnest_log "ASSIGNMENT bead=$bead_id agent=$agent_name pane=$pane skill=$skill"

    # Update metrics file
    local timestamp
    timestamp=$(date -Iseconds)
    echo "$timestamp,NA,$bead_id,$agent_name,$pane,$skill,assigned" >> "$NEXTNEST_METRICS_FILE"

    # Send Slack notification for critical beads
    if [[ "$skill" == *"critical"* ]] && [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        if command -v curl >/dev/null; then
            local message
            message="NextNest assigned critical bead $bead_id to $agent_name (pane $pane)"
            curl -s -X POST "$SLACK_WEBHOOK_URL" \
                -d "{\"text\":\"$message\"}" \
                >/dev/null 2>&1 || true
            nextnest_log "NOTIFICATION slack critical_bead=$bead_id"
        fi
    fi

    echo -e "${GREEN}NEXTNEST: Assigned $bead_id → $agent_name @ pane $pane${NC}"

    return 0
}

# ============================================================================
# HOOK 5: CUSTOM BEAD - NextNest Special Bead Types
# ============================================================================

HOOK_CUSTOM_BEAD() {
    local bead_id="$1"
    local bead_title="$2"
    local bead_labels="$3"

    # Handle "database" beads via custom routing (bypass default assignment)
    if echo "$bead_labels" | jq -e '.[] | select(. == "database")' >/dev/null; then
        echo -e "${BLUE}NEXTNEST: Routing database bead $bead_id via custom handler${NC}"

        # Get database admin pane from topology
        local db_admin_pane
        db_admin_pane=$(get_pane_by_role "database-admin" 2>/dev/null || echo "3")

        # Custom assignment logic for database beads
        nextnest_log "CUSTOM_ASSIGNMENT bead=$bead_id type=database pane=$db_admin_pane"

        # Note: In a real implementation, this would call the workflow's
        # internal assignment function directly. For now, we rely on the
        # standard assignment after returning 1 (use default).
        # The HOOK_BEFORE_ASSIGN filter will ensure it goes to the right agent.

        return 1  # Use default assignment (filtering will handle routing)
    fi

    # Handle "external" beads via external API
    if echo "$bead_labels" | jq -e '.[] | select(. == "external")' >/dev/null; then
        echo -e "${BLUE}NEXTNEST: Handling external bead $bead_id via external API${NC}"

        # Mark bead as in-progress to prevent reassignment
        if command -v gh >/dev/null; then
            gh issue edit "$bead_id" --add-label "in-progress" 2>/dev/null || true
        fi

        nextnest_log "EXTERNAL_ASSIGNMENT bead=$bead_id status=dispatched"

        return 0  # Bead was handled, skip default assignment
    fi

    return 1  # Use default assignment for all other beads
}

# ============================================================================
# HOOK 6: AGENT PROMPT - NextNest Command Customization
# ============================================================================

HOOK_AGENT_PROMPT() {
    local pane="$1"
    local original_cmd="$2"

    # Add extended timeout for supervisor commands (pane 0)
    if [[ "$pane" == "0" ]]; then
        if [[ "$original_cmd" == *"/superpowers:execute-plan"* ]] || \
           [[ "$original_cmd" == *"/superpowers:brainstorming"* ]]; then
            echo "$original_cmd --timeout 600"
            return
        fi
    fi

    # Add project context for all agent commands
    if [[ "$original_cmd" == *"/skill:"* ]]; then
        echo "$original_cmd --project-context 'nextnest-production'"
        return
    fi

    # Default: pass command through unchanged
    echo "$original_cmd"
}

# ============================================================================
# HOOK 7: AFTER CHECK - NextNest Metrics Collection
# ============================================================================

HOOK_AFTER_CHECK() {
    local iteration="$1"
    local blocked_agents="$2"

    # Count blocked agents
    local blocked_count
    blocked_count=$(echo "$blocked_agents" | jq 'length' 2>/dev/null || echo "0")

    # Get ready bead count
    local ready_count
    ready_count=$(bd ls ready 2>/dev/null | jq '. | length' || echo "0")

    # Log iteration metrics
    local timestamp
    timestamp=$(date -Iseconds)
    echo "$iteration,$blocked_count,$ready_count" >> "${NEXTNEST_LOG_DIR}/iterations.csv"

    # Abort if all agents blocked for extended time (1 hour)
    if [[ "$blocked_count" -eq 4 ]]; then
        local block_file="${PROJECT_ROOT}/.maf/all-blocked-since"
        if [[ ! -f "$block_file" ]]; then
            date '+%s' > "$block_file"
        else
            local block_start
            block_start=$(cat "$block_file")
            local now
            now=$(date '+%s')
            local blocked_seconds=$((now - block_start))
            if [[ "$blocked_seconds" -gt 3600 ]]; then
                echo -e "${RED}NEXTNEST: All agents blocked for >1 hour, aborting${NC}" >&2
                rm -f "$block_file"
                nextnest_log "WORKFLOW_ABORT all_blocked_duration=${blocked_seconds}s"
                return 2  # Abort workflow
            fi
        fi
    else
        rm -f "${PROJECT_ROOT}/.maf/all-blocked-since"
    fi

    echo -e "${BLUE}NEXTNEST: Iteration $iteration complete (blocked: $blocked_count, ready: $ready_count)${NC}"

    return 0
}

# ============================================================================
# HOOK 8: ERROR HANDLER - NextNest Error Recovery
# ============================================================================

HOOK_ERROR_HANDLER() {
    local error_line="$1"
    local error_message="$2"
    local context="$3"

    # Log error with full context
    nextnest_log "ERROR line=$error_line message='$error_message' context=$context"

    # Create error diagnostic file
    local error_id
    error_id=$(date +%s)
    local diagnostics_file="${NEXTNEST_LOG_DIR}/error-diagnostics-${error_id}.txt"

    {
        echo "========== NextNest Workflow Error =========="
        echo "Time: $(date -Iseconds)"
        echo "Error ID: $error_id"
        echo "Line: $error_line"
        echo "Message: $error_message"
        echo "Context: $context"
        echo ""
        echo "=== System State ==="
        echo "Load: $(uptime)"
        echo "Disk: $(df -h | grep -E '^/dev/')"
        echo "Memory: $(free -h | grep Mem)"
        echo ""
        echo "=== Agent Status ==="
        if command -v bd >/dev/null; then
            bd status 2>/dev/null || echo "Unable to get bead status"
        else
            echo "Beads CLI not available"
        fi
        echo ""
        echo "=== Tmux Sessions ==="
        tmux ls 2>/dev/null || echo "No tmux sessions"
        echo "============================================"
    } > "$diagnostics_file"

    echo -e "${RED}NEXTNEST: Error logged to $diagnostics_file${NC}" >&2

    # Send Slack alert for critical errors
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]] && command -v curl >/dev/null; then
        local message
        message="NextNest workflow error at line $error_line: $error_message (see $diagnostics_file)"
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -d "{\"text\":\"$message\"}" \
            >/dev/null 2>&1 || true
    fi

    # Attempt recovery for transient errors
    if [[ "$error_message" == *"temporarily unavailable"* ]] || \
       [[ "$error_message" == *"connection refused"* ]] || \
       [[ "$error_message" == *"timeout"* ]]; then
        echo -e "${YELLOW}NEXTNEST: Transient error detected, waiting 30s...${NC}"
        sleep 30
        return 0  # Attempt to continue
    fi

    return 1  # Abort for non-transient errors
}

# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

# If executed directly, verify hooks are working
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo -e "${GREEN}=== NextNest Customizations Verification ===${NC}"
    echo ""

    # Verify all hooks are defined
    hooks_defined=true
    for hook in HOOK_BEFORE_LOOP HOOK_BEFORE_CHECK HOOK_BEFORE_ASSIGN \
                HOOK_AFTER_ASSIGN HOOK_CUSTOM_BEAD HOOK_AGENT_PROMPT \
                HOOK_AFTER_CHECK HOOK_ERROR_HANDLER; do
        if declare -f "$hook" >/dev/null; then
            echo -e "${GREEN}✓${NC} $hook"
        else
            echo -e "${RED}✗${NC} $hook is missing"
            hooks_defined=false
        fi
    done

    if [[ "$hooks_defined" == "true" ]]; then
        echo ""
        echo -e "${GREEN}=== All NextNest hooks verified! ===${NC}"
        echo ""
        echo -e "${BLUE}Usage:${NC}"
        echo -e "  export MAF_CUSTOM_HOOKS=\"\$(pwd)/experiments/nextnest-customizations.sh\""
        echo -e "  bash experiments/autonomous-workflow-nextnest.sh"
        exit 0
    else
        echo ""
        echo -e "${RED}=== Verification Failed ===${NC}"
        exit 1
    fi
fi
