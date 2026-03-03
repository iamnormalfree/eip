#!/usr/bin/env bats
# Test 2: Supervisor Alert Formatting
# Tests that send_supervisor_alert() formats alerts correctly

setup() {
    # Define override BEFORE sourcing the script
    _tmux_send_keys() {
        local pane="$1"
        echo "PANE: $pane"
    }
    export -f _tmux_send_keys

    source maf/scripts/maf/supervisor-coordination.sh
}

@test "send_supervisor_alert formats alert with required fields" {
    # Mock tmux send-keys to capture what would be sent
    tmux() {
        if [[ "$1" == "send-keys" ]]; then
            # Capture the alert message
            shift
            while [[ $# -gt 0 ]]; do
                echo "$1"
                shift
            done
        fi
    }
    export -f tmux

    # Run the function with test data
    run send_supervisor_alert "2" "BEAD-001" "> Should I use Postgres?"

    # Should contain ALERT marker
    [[ "$output" =~ "[ALERT]" ]]
    # Should contain implementor ID
    [[ "$output" =~ "Implementor-2" ]]
    # Should contain bead ID
    [[ "$output" =~ "BEAD-001" ]]
    # Should contain the question
    [[ "$output" =~ "Should I use Postgres" ]]
}

@test "send_supervisor_alert sends to supervisor pane (pane 0)" {
    # Override _tmux_send_keys to capture what would be sent
    _tmux_send_keys() {
        local pane="$1"
        echo "PANE: $pane"
    }
    export -f _tmux_send_keys

    # Run the function
    run send_supervisor_alert "2" "BEAD-001" "> Question?"

    # Should target pane 0 (supervisor)
    [[ "$output" =~ "PANE:" ]]
    [[ "$output" =~ "agents.0" ]]
}

@test "send_supervisor_alert includes response instruction" {
    tmux() {
        if [[ "$1" == "send-keys" ]]; then
            shift
            echo "$@"
        fi
    }
    export -f tmux

    # Run the function
    run send_supervisor_alert "2" "BEAD-001" "> Question?"

    # Should include instruction that advice will be delivered
    [[ "$output" =~ "advice" ]] || [[ "$output" =~ "delivered" ]]
}
