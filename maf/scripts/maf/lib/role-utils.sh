# Role-based agent lookup (ADDITIVE, not enforced)

get_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        echo "ERROR: Config not found: $config" >&2
        return 1
    fi

    # Use --arg to safely pass role parameter, preventing shell injection
    # Check jq exit code to detect JSON parsing errors
    local agent_id
    agent_id=$(jq -r --arg role "$role" '.role_mappings[$role]' "$config" 2>/dev/null)
    local jq_exit_code=$?
    
    if [ $jq_exit_code -ne 0 ]; then
        echo "ERROR: Failed to parse config file: $config" >&2
        return 1
    fi

    if [ "$agent_id" = "null" ]; then
        echo "WARNING: Role '$role' not found in config" >&2
        return 1
    fi

    echo "$agent_id"
}

has_role_mapping() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        return 1
    fi

    # Use --arg to safely pass role parameter, preventing shell injection
    jq -e --arg role "$role" '.role_mappings[$role]' "$config" >/dev/null 2>&1
}
