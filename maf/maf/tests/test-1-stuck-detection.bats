#!/usr/bin/env bats
# Test 1: Stuck Agent Detection
# Tests that check_stuck_agents() detects implementors with pending prompts

setup() {
    # Load the script functions
    source maf/scripts/maf/supervisor-coordination.sh
}

@test "check_stuck_agents detects implementor with pending prompt" {
    # Mock tmux capture-pane to return a stuck prompt
    tmux() {
        if [[ "$1" == "capture-pane" ]]; then
            echo "> Should I use Postgres or SQLite?"
        fi
    }
    export -f tmux

    # Run the function
    run check_stuck_agents

    # Should detect stuck agent
    [[ "$status" -eq 0 ]]
    [[ "$output" =~ "Implementor-2" ]]
    [[ "$output" =~ "BEAD-001" ]]
}

@test "check_stuck_agents ignores empty prompts" {
    # Mock tmux capture-pane to return empty prompt
    tmux() {
        if [[ "$1" == "capture-pane" ]]; then
            echo "> "
        fi
    }
    export -f tmux

    # Run the function
    run check_stuck_agents

    # Should NOT detect as stuck (empty prompt)
    [[ "$status" -eq 0 ]]
    [[ ! "$output" =~ "stuck" ]]
}

@test "check_stuck_agents ignores agents without prompts" {
    # Mock tmux capture-pane to return normal working state
    tmux() {
        if [[ "$1" == "capture-pane" ]]; then
            echo "Working on implementation..."
        fi
    }
    export -f tmux

    # Run the function
    run check_stuck_agents

    # Should NOT detect as stuck (no prompt)
    [[ "$status" -eq 0 ]]
    [[ ! "$output" =~ "stuck" ]]
}
