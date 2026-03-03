#!/bin/bash

# MAF Orchestrator - Central Coordination for Autonomous Agents
#
# This is the CENTER SCRIPT that ties all MAF coordination tools together:
#   - Uses coordinate-agents.sh for smart bead assignment
#   - Uses supervisor-coordination.sh for stuck agent guidance
#   - Uses agent-monitor.sh for stuck agent detection
#   - Uses clear-stuck-prompts.sh for recovery
#   - Uses audit-closed-beads.sh for bead closure governance
#   - Integrates with context-manager-v2.sh for health monitoring
#
# USAGE:
#   bash maf/scripts/maf/orchestrator.sh [--loop|--once]
#
# ENVIRONMENT VARIABLES:
#   MAF_TMUX_SESSION - Tmux session name (default: maf-cli)
#   MAF_ORCHESTRATOR_INTERVAL - Seconds between cycles (default: 30)
#   MAF_ENABLE_AUTO_CLEAR - Auto-clear stuck prompts (default: true)
#   MAF_ENABLE_COORDINATION - Enable bead coordination (default: true)
#   MAF_ENABLE_MONITORING - Enable stuck detection (default: true)
#   MAF_ENABLE_SUPERVISOR_COORDINATION - Enable supervisor guidance routing (default: true)
#   MAF_ENABLE_AUDIT - Enable bead closure audit (default: true)
#   MAF_AUDIT_INTERVAL - Audit every N cycles (default: 10)
#
# CUSTOMIZATION:
#   For project-specific behavior, create a wrapper in scripts/maf/
#   that calls this script with your project's settings.

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-detect project directory
if [[ "$SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

# Resolve symlinks to get physical project root (handles franchisee symlinks like /root/nextnest -> /root/projects/nextnest)
if [[ -L "$PROJECT_ROOT" ]] || [[ -h "$PROJECT_ROOT" ]]; then
    PHYSICAL_PROJECT_ROOT="$(readlink -f "$PROJECT_ROOT")"
else
    PHYSICAL_PROJECT_ROOT="$PROJECT_ROOT"
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
CYCLE_INTERVAL="${MAF_ORCHESTRATOR_INTERVAL:-30}"
ENABLE_AUTO_CLEAR="${MAF_ENABLE_AUTO_CLEAR:-true}"
ENABLE_COORDINATION="${MAF_ENABLE_COORDINATION:-true}"
ENABLE_MONITORING="${MAF_ENABLE_MONITORING:-true}"
ENABLE_SUPERVISOR_COORDINATION="${MAF_ENABLE_SUPERVISOR_COORDINATION:-true}"
ENABLE_AUDIT="${MAF_ENABLE_AUDIT:-true}"
AUDIT_INTERVAL="${MAF_AUDIT_INTERVAL:-10}"

# Global cycle counter for periodic audit (initialized once, used in component_audit)
ORCHESTRATOR_CYCLE_COUNT=0

# Helper function to find scripts with fallback for franchisee layouts
# Franchisees may have scripts at PHYSICAL_PROJECT_ROOT/scripts/maf/ (HQ) or
# PHYSICAL_PROJECT_ROOT/maf/scripts/maf/ (subtree)
find_script() {
    local script_name="$1"
    local subtree_path="$PHYSICAL_PROJECT_ROOT/maf/scripts/maf/$script_name"
    local hq_path="$PHYSICAL_PROJECT_ROOT/scripts/maf/$script_name"

    # Check subtree location first (franchisee layout)
    if [[ -f "$subtree_path" ]]; then
        echo "$subtree_path"
    # Fallback to HQ location
    elif [[ -f "$hq_path" ]]; then
        echo "$hq_path"
    else
        # Return empty if not found - caller will handle
        echo ""
    fi
}

# Script paths with franchisee fallback support
COORDINATE_SCRIPT="$(find_script "coordinate-agents.sh")"
MONITOR_SCRIPT="$(find_script "agent-monitor.sh")"
CLEAR_SCRIPT="$(find_script "clear-stuck-prompts.sh")"
SUPERVISOR_COORDINATION_SCRIPT="$(find_script "supervisor-coordination.sh")"
AUDIT_SCRIPT="$(find_script "audit-closed-beads.sh")"
CONTEXT_MANAGER_SCRIPT="$(find_script "context-manager-v2.sh")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"
}

debug() {
    # Only show debug if DEBUG env var is set
    if [[ "${DEBUG:-}" == "true" ]]; then
        echo -e "${BLUE}[$(date '+%H:%M:%S')] DEBUG:${NC} $1"
    fi
}

die() {
    error "$1"
    exit 1
}

# ============================================================================
# COMPONENT CHECKING
# ============================================================================

check_required_commands() {
    local missing=()

    for cmd in tmux jq bd; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing+=("$cmd")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        die "Missing required commands: ${missing[*]}"
    fi
}

check_context_manager() {
    # Check if context-manager-v2.sh daemon is running
    if [[ -f "/tmp/context-manager-v2.pid" ]]; then
        local pid=$(cat "/tmp/context-manager-v2.pid")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Running
        fi
    fi

    # Check via pgrep as fallback
    if pgrep -f "context-manager-v2.sh monitor" >/dev/null 2>&1; then
        return 0  # Running
    fi

    # Not running - warn user
    warn "context-manager-v2.sh daemon is NOT running"
    info "Recommended: Start with 'bash maf/scripts/maf/context-manager-v2.sh start'"
    info "This provides agent health monitoring and auto-restart on context overflow"
    return 1
}

check_session() {
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        die "tmux session '$SESSION_NAME' not found. Run: bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force"
    fi
}

check_maf_scripts() {
    local missing=()

    if [[ "$ENABLE_COORDINATION" == "true" ]] && [[ ! -f "$COORDINATE_SCRIPT" ]]; then
        missing+=("coordinate-agents.sh")
    fi

    if [[ "$ENABLE_SUPERVISOR_COORDINATION" == "true" ]] && [[ ! -f "$SUPERVISOR_COORDINATION_SCRIPT" ]]; then
        missing+=("supervisor-coordination.sh")
    fi

    if [[ "$ENABLE_MONITORING" == "true" ]] && [[ ! -f "$MONITOR_SCRIPT" ]]; then
        missing+=("agent-monitor.sh")
    fi

    if [[ "$ENABLE_AUTO_CLEAR" == "true" ]] && [[ ! -f "$CLEAR_SCRIPT" ]]; then
        missing+=("clear-stuck-prompts.sh")
    fi

    if [[ "$ENABLE_AUDIT" == "true" ]] && [[ ! -f "$AUDIT_SCRIPT" ]]; then
        missing+=("audit-closed-beads.sh")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        warn "Some MAF scripts not found: ${missing[*]}"
        warn "Orchestration will continue with available components"
    fi
}

# ============================================================================
# ORCHESTRATION COMPONENTS
# ============================================================================

# Component 1: Bead Coordination
# Uses coordinate-agents.sh to assign beads to available agents
component_coordinate() {
    if [[ "$ENABLE_COORDINATION" != "true" ]]; then
        return 0
    fi

    if [[ ! -f "$COORDINATE_SCRIPT" ]]; then
        warn "coordinate-agents.sh not found, skipping coordination"
        return 1
    fi

    info "📋 Running bead coordination..."

    # Run a single coordination cycle
    if bash "$COORDINATE_SCRIPT" --once 2>&1; then
        log "✓ Coordination complete"
        return 0
    else
        log "No beads available or all agents busy"
        return 1
    fi
}

# Component 2: Stuck Agent Detection
# Checks all agent panes for stuck prompts or idle agents
component_monitor() {
    if [[ "$ENABLE_MONITORING" != "true" ]]; then
        return 0
    fi

    info "🔍 Checking agent status..."

    local stuck_agents=()
    local all_clear=true

    for pane in 0 1 2 3; do
        local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

        # Check if pane exists
        if ! tmux display-message -p -t "$full_pane" '#{pane_dead}' 2>/dev/null | grep -q "0"; then
            continue
        fi

        # Capture pane content
        local snapshot
        snapshot="$(tmux capture-pane -t "$full_pane" -p -S -5 2>/dev/null || true)"

        # Check for pending prompt (stuck)
        if echo "$snapshot" | grep -qE '^[[:space:]]*>[^[:space:]]'; then
            local prompt_line
            prompt_line="$(echo "$snapshot" | grep -E '^[[:space:]]*>' | head -1 | sed 's/^[[:space:]]*>[[:space:]]*//;s/[[:space:]]*$//')"

            if [[ -n "$prompt_line" ]]; then
                stuck_agents+=("$pane:$prompt_line")
                all_clear=false
            fi
        fi
    done

    if [[ "$all_clear" == "true" ]]; then
        log "✓ All agents clear"
        return 0
    fi

    # Report stuck agents
    warn "Found ${#stuck_agents[@]} stuck agent(s)"
    for agent_info in "${stuck_agents[@]}"; do
        local pane="${agent_info%%:*}"
        warn "  Pane $pane has pending input"
    done

    return 1
}

# Component 3: Auto-Recovery
# Automatically clears stuck prompts if enabled
component_autorecover() {
    if [[ "$ENABLE_AUTO_CLEAR" != "true" ]]; then
        return 0
    fi

    info "🔧 Running auto-recovery..."

    if [[ -f "$CLEAR_SCRIPT" ]]; then
        bash "$CLEAR_SCRIPT" 2>&1
        log "✓ Auto-recovery complete"
        return 0
    else
        warn "clear-stuck-prompts.sh not found, skipping auto-recovery"
        return 1
    fi
}

# Component 5: Supervisor Coordination
# Routes stuck implementor questions to supervisor for guidance
component_supervisor_coordination() {
    if [[ "$ENABLE_SUPERVISOR_COORDINATION" != "true" ]]; then
        return 0
    fi

    if [[ ! -f "$SUPERVISOR_COORDINATION_SCRIPT" ]]; then
        warn "supervisor-coordination.sh not found, skipping supervisor coordination"
        return 1
    fi

    info "👥 Running supervisor coordination..."

    # Run supervisor coordination cycle
    if bash "$SUPERVISOR_COORDINATION_SCRIPT" --once 2>&1; then
        log "✓ Supervisor coordination complete"
        return 0
    else
        log "No stuck agents requiring supervisor attention"
        return 1
    fi
}

# Component 6: Health Check
# Basic health check for all agents
component_health_check() {
    info "💓 Running health check..."

    local healthy=0
    local total=0

    for pane in 0 1 2 3; do
        local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

        # Check if pane exists
        if ! tmux display-message -p -t "$full_pane" '#{pane_dead}' 2>/dev/null | grep -q "0"; then
            continue
        fi

        total=$((total + 1))

        # Check if pane has a prompt (agent is responsive)
        local snapshot
        snapshot="$(tmux capture-pane -t "$full_pane" -p -S -2 2>/dev/null || true)"

        if echo "$snapshot" | grep -qE '^[[:space:]]*[>›]'; then
            healthy=$((healthy + 1))
        fi
    done

    if [[ $total -gt 0 ]]; then
        local health_percent=$((healthy * 100 / total))
        log "Agent health: $healthy/$total ($health_percent%)"

        if [[ $health_percent -lt 50 ]]; then
            warn "Low agent health detected ($health_percent%)"
        fi
    fi
}

# Component 7: Bead Closure Audit
# Periodically audits closed beads for proper closure compliance
component_audit() {
    if [[ "$ENABLE_AUDIT" != "true" ]]; then
        return 0
    fi

    if [[ ! -f "$AUDIT_SCRIPT" ]]; then
        warn "audit-closed-beads.sh not found, skipping audit"
        return 1
    fi

    # Track cycle count for periodic audit (global counter)
    ORCHESTRATOR_CYCLE_COUNT=$((ORCHESTRATOR_CYCLE_COUNT + 1))

    # Run audit every AUDIT_INTERVAL cycles
    if [[ $ORCHESTRATOR_CYCLE_COUNT -ge $AUDIT_INTERVAL ]]; then
        info "🔍 Running bead closure audit..."

        if bash "$AUDIT_SCRIPT" --audit-only 2>&1; then
            log "✓ Audit complete"
        else
            warn "Audit found violations - check logs"
        fi

        # Reset counter
        ORCHESTRATOR_CYCLE_COUNT=0
    else
        local remaining=$((AUDIT_INTERVAL - ORCHESTRATOR_CYCLE_COUNT))
        debug "Audit in $remaining cycle(s)"
    fi

    return 0
}

# ============================================================================
# MAIN ORCHESTRATION LOOP
# ============================================================================

orchestrate_once() {
    log "========================================="
    log "🤖 MAF Orchestrator - Single Cycle"
    log "========================================="

    check_session

    # Check if context manager is running (warns if not)
    check_context_manager || true

    # Run health check
    component_health_check

    # Run coordination (assign beads)
    component_coordinate || true

    # Run monitoring (check for stuck agents)
    if component_monitor; then
        # All clear
        :
    else
        # Found stuck agents - run supervisor coordination FIRST
        # (supervisor provides guidance before auto-clear)
        if [[ "$ENABLE_SUPERVISOR_COORDINATION" == "true" ]]; then
            component_supervisor_coordination || true
        fi

        # Then try auto-recovery if still stuck
        if [[ "$ENABLE_AUTO_CLEAR" == "true" ]]; then
            component_autorecover
        fi
    fi

    # Run audit (periodic bead closure compliance check)
    component_audit || true

    log "========================================="
    log "Cycle complete. Next check in ${CYCLE_INTERVAL}s"
    log "========================================="
}

orchestrate_loop() {
    log "========================================="
    log "🤖 MAF Orchestrator - Starting Loop"
    log "========================================="
    log "Session: $SESSION_NAME"
    log "Window: $WINDOW_NAME"
    log "Interval: ${CYCLE_INTERVAL}s"
    log "Auto-clear: $ENABLE_AUTO_CLEAR"
    log "Coordination: $ENABLE_COORDINATION"
    log "Monitoring: $ENABLE_MONITORING"
    log "Supervisor Coordination: $ENABLE_SUPERVISOR_COORDINATION"
    log "Audit: $ENABLE_AUDIT"
    log "========================================="
    log "Press Ctrl+C to stop"
    log ""

    while true; do
        orchestrate_once
        sleep "$CYCLE_INTERVAL"
    done
}

# ============================================================================
# ENTRY POINT
# ============================================================================

# Parse arguments
MODE="once"
for arg in "$@"; do
    case "$arg" in
        --once) MODE="once" ;;
        --loop) MODE="loop" ;;
        --session)
            SESSION_NAME="${2:-}"
            shift 2
            ;;
        --interval)
            CYCLE_INTERVAL="${2:-30}"
            shift 2
            ;;
        -h|--help)
            cat << 'EOF'
MAF Orchestrator - Central Coordination for Autonomous Agents

USAGE:
  bash maf/scripts/maf/orchestrator.sh [--once|--loop] [--session NAME] [--interval SECS]

MODES:
  --once     Run single orchestration cycle (default)
  --loop     Run continuous orchestration loop
  --session  Specify tmux session name
  --interval Seconds between cycles (default: 30)

ENVIRONMENT VARIABLES:
  MAF_TMUX_SESSION           Tmux session name (default: maf-cli)
  MAF_AGENT_WINDOW            Window name (default: agents)
  MAF_ORCHESTRATOR_INTERVAL  Seconds between cycles (default: 30)
  MAF_ENABLE_AUTO_CLEAR       Auto-clear stuck prompts (default: true)
  MAF_ENABLE_COORDINATION     Enable bead coordination (default: true)
  MAF_ENABLE_MONITORING       Enable stuck detection (default: true)
  MAF_ENABLE_AUDIT            Enable bead closure audit (default: true)
  MAF_AUDIT_INTERVAL          Audit every N cycles (default: 10)
  MAF_COORDINATION_COOLDOWN   Bead cooldown seconds (default: 300)
  MAF_ASSIGN_MODE             'smart' or 'all' (default: smart)
  SKILL_ROUTING_MODE          Skill routing for implementors

COMPONENTS:
  The orchestrator combines these MAF scripts:
  • coordinate-agents.sh     - Smart bead assignment
  • agent-monitor.sh          - Stuck agent detection
  • clear-stuck-prompts.sh    - Auto-recovery
  • audit-closed-beads.sh     - Bead closure governance (periodic)

  COMPLEMENTARY (runs separately):
  • context-manager-v2.sh     - Agent health monitoring daemon
    (auto-restarts agents when context is full, preserves state)

RECOMMENDED SETUP:
  # Terminal 1: Start agents
  bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force

  # Terminal 2: Start context manager (background daemon)
  bash maf/scripts/maf/context-manager-v2.sh start

  # Terminal 3: Start orchestrator
  bash maf/scripts/maf/orchestrator.sh --loop

CUSTOMIZATION:
  For project-specific behavior, create a wrapper in scripts/maf/
  that calls this script with your project's settings.

EXAMPLES:
  # Single cycle
  bash maf/scripts/maf/orchestrator.sh --once

  # Continuous loop with 60s intervals
  bash maf/scripts/maf/orchestrator.sh --loop --interval 60

  # Use with skill routing
  SKILL_ROUTING_MODE=sdd-only bash maf/scripts/maf/orchestrator.sh --loop

  # Custom session name
  MAF_TMUX_SESSION=maf-nn bash maf/scripts/maf/orchestrator.sh --loop
EOF
            exit 0
            ;;
        *) ;;
    esac
done

# Prerequisites
check_required_commands
check_session
check_maf_scripts

# Run based on mode
if [[ "$MODE" == "loop" ]]; then
    orchestrate_loop
else
    orchestrate_once
fi
