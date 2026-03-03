#!/bin/bash
# Role-based Agent Spawning Library
#
# Provides role-based agent lookup with fallback support for backward compatibility.
#
# USAGE:
#   source scripts/maf/lib/role-based-spawn.sh
#   AGENT_NAME=$(spawn_agent_by_role "supervisor")
#   AGENT_NAME=$(spawn_agent_by_role "reviewer" "/path/to/config.json")
#
# ENVIRONMENT VARIABLES (fallback):
#   AGENT_SUPERVISOR    - Override supervisor agent name
#   AGENT_REVIEWER      - Override reviewer agent name
#   AGENT_IMPLEMENTOR_1 - Override implementor-1 agent name
#   AGENT_IMPLEMENTOR_2 - Override implementor-2 agent name

set -euo pipefail

# Source the role utilities for get_agent_by_role() and has_role_mapping()
ROLE_BASED_SPAWN_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Try to source role-utils.sh
if [[ -f "$ROLE_BASED_SPAWN_LIB_DIR/role-utils.sh" ]]; then
    source "$ROLE_BASED_SPAWN_LIB_DIR/role-utils.sh"
else
    # Fallback: define basic functions if role-utils.sh not available
    echo "WARNING: role-utils.sh not found, using basic fallback" >&2
fi

# Default agent names (used when no role_mappings and no environment override)
DEFAULT_AGENT_SUPERVISOR="GreenMountain"
DEFAULT_AGENT_REVIEWER="BlackDog"
DEFAULT_AGENT_IMPLEMENTOR_1="OrangePond"
DEFAULT_AGENT_IMPLEMENTOR_2="FuchsiaCreek"

# Role to environment variable mapping
declare -A ROLE_ENV_MAP=(
    ["supervisor"]="AGENT_SUPERVISOR"
    ["reviewer"]="AGENT_REVIEWER"
    ["implementor-1"]="AGENT_IMPLEMENTOR_1"
    ["implementor-2"]="AGENT_IMPLEMENTOR_2"
    ["imp1"]="AGENT_IMPLEMENTOR_1"
    ["imp2"]="AGENT_IMPLEMENTOR_2"
)

# Role to default agent name mapping
declare -A ROLE_DEFAULT_MAP=(
    ["supervisor"]="$DEFAULT_AGENT_SUPERVISOR"
    ["reviewer"]="$DEFAULT_AGENT_REVIEWER"
    ["implementor-1"]="$DEFAULT_AGENT_IMPLEMENTOR_1"
    ["implementor-2"]="$DEFAULT_AGENT_IMPLEMENTOR_2"
    ["imp1"]="$DEFAULT_AGENT_IMPLEMENTOR_1"
    ["imp2"]="$DEFAULT_AGENT_IMPLEMENTOR_2"
)

# Normalize role names (handle aliases)
normalize_role() {
    local role="$1"
    case "$role" in
        supervisor|sup|0)
            echo "supervisor"
            ;;
        reviewer|rev|1)
            echo "reviewer"
            ;;
        implementor-1|imp-1|imp1|2)
            echo "implementor-1"
            ;;
        implementor-2|imp-2|imp2|3)
            echo "implementor-2"
            ;;
        *)
            echo "$role"
            ;;
    esac
}

# Main function: Get agent name by role with fallback support
# Arguments:
#   $1 - Role name (supervisor, reviewer, implementor-1, implementor-2, or aliases)
#   $2 - Optional config file path (default: .maf/config/agent-topology.json)
# Returns:
#   Agent name (e.g., "GreenMountain", "BlackDog")
# Exit code:
#   0 - Success
#   1 - Role not found
spawn_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    # Normalize role name
    role=$(normalize_role "$role")

    # Method 1: Try role_mappings from config (preferred)
    if [[ -f "$config" ]] && declare -f has_role_mapping >/dev/null && has_role_mapping "$role" "$config"; then
        local agent_name
        agent_name=$(get_agent_by_role "$role" "$config" 2>/dev/null)
        if [[ -n "$agent_name" ]] && [[ "$agent_name" != "null" ]]; then
            echo "$agent_name"
            return 0
        fi
    fi

    # Method 2: Try environment variable override
    local env_var="${ROLE_ENV_MAP[$role]:-}"
    if [[ -n "$env_var" ]] && [[ -n "${!env_var:-}" ]]; then
        echo "${!env_var}"
        return 0
    fi

    # Method 3: Use default agent name (backward compatibility)
    local default="${ROLE_DEFAULT_MAP[$role]:-}"
    if [[ -n "$default" ]]; then
        echo "$default"
        return 0
    fi

    # Role not found
    echo "ERROR: Unknown role '$role'" >&2
    return 1
}

# Get agent name for a pane index (useful for tmux-based spawning)
# Arguments:
#   $1 - Pane index (0, 1, 2, 3)
#   $2 - Optional config file path (default: .maf/config/agent-topology.json)
# Returns:
#   Agent name for that pane
spawn_agent_by_pane() {
    local pane_index="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    # Map pane index to role, then use spawn_agent_by_role
    local role
    case "$pane_index" in
        0) role="supervisor" ;;
        1) role="reviewer" ;;
        2) role="implementor-1" ;;
        3) role="implementor-2" ;;
        *)
            echo "ERROR: Invalid pane index: $pane_index" >&2
            return 1
            ;;
    esac

    # spawn_agent_by_role handles missing config gracefully
    spawn_agent_by_role "$role" "$config"
}

# List all available roles
list_roles() {
    echo "Available roles:"
    echo "  supervisor (aliases: sup, 0)"
    echo "  reviewer (aliases: rev, 1)"
    echo "  implementor-1 (aliases: imp-1, imp1, 2)"
    echo "  implementor-2 (aliases: imp-2, imp2, 3)"
}

# Show role mappings from config (diagnostic function)
# Arguments:
#   $1 - Optional config file path
show_role_mappings() {
    local config="${1:-.maf/config/agent-topology.json}"

    echo "Role mappings from: $config"
    echo ""

    if [[ ! -f "$config" ]]; then
        echo "Config file not found"
        echo ""
        echo "Fallback defaults:"
        echo "  supervisor → $DEFAULT_AGENT_SUPERVISOR"
        echo "  reviewer → $DEFAULT_AGENT_REVIEWER"
        echo "  implementor-1 → $DEFAULT_AGENT_IMPLEMENTOR_1"
        echo "  implementor-2 → $DEFAULT_AGENT_IMPLEMENTOR_2"
        return 0
    fi

    # Check if role_mappings field exists
    if jq -e '.role_mappings' "$config" >/dev/null 2>&1; then
        echo "Config has role_mappings:"
        jq -r '.role_mappings | to_entries[] | "  \(.key) → \(.value)"' "$config"
    else
        echo "Config does not have role_mappings field"
        echo ""
        echo "Using fallback defaults:"
        for role in supervisor reviewer implementor-1 implementor-2; do
            echo "  $role → $(spawn_agent_by_role "$role" "$config")"
        done
    fi
}

# Self-test function (run with: bash role-based-spawn.sh test)
if [[ "${1:-}" == "test" ]]; then
    echo "=== Role-Based Spawn Self-Test ==="
    echo ""

    echo "Test 1: Basic role lookup (without config)"
    for role in supervisor reviewer implementor-1 implementor-2; do
        agent=$(spawn_agent_by_role "$role" "/nonexistent/config.json")
        echo "  $role → $agent"
    done
    echo ""

    echo "Test 2: Role aliases"
    for alias in sup rev imp1 imp2 0 1 2 3; do
        agent=$(spawn_agent_by_role "$alias" "/nonexistent/config.json")
        echo "  $alias → $agent"
    done
    echo ""

    echo "Test 3: Pane index lookup"
    for pane in 0 1 2 3; do
        agent=$(spawn_agent_by_pane "$pane" "/nonexistent/config.json")
        echo "  Pane $pane → $agent"
    done
    echo ""

    if [[ -f ".maf/config/agent-topology.json" ]]; then
        echo "Test 4: With actual config file"
        show_role_mappings
    fi

    echo ""
    echo "=== Self-Test Complete ==="
fi
