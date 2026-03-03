#!/usr/bin/env bats
# Test 4: Advice Delivery
# Tests that deliver_advice_to_agent() delivers supervisor advice to implementor

setup() {
    # Define wrapper before sourcing script
    _tmux_send_keys() {
        local pane="$1"
        local message="$2"
        echo "SENT_TO_PANE: $pane MESSAGE: $message"
    }
    export -f _tmux_send_keys

    source maf/scripts/maf/supervisor-coordination.sh
}

@test "deliver_advice_to_agent sends advice to implementor pane" {
    # Run the function
    run deliver_advice_to_agent "2" "Use Postgres for production."

    # Should target implementor pane 2
    [[ "$output" =~ "pane 2" ]]
}

@test "deliver_advice_to_agent includes the advice text" {
    # Run the function
    run deliver_advice_to_agent "2" "Use Postgres for production."

    # Should include the advice
    [[ "$output" =~ "Postgres" ]]
}

@test "deliver_advice_to_agent presses Enter after advice" {
    # Track if Enter was pressed
    local calls=()

    _tmux_send_keys() {
        local pane="$1"
        local message="$2"
        calls+=("$message")
        echo "CALLED: pane=$pane message=$message"
    }
    export -f _tmux_send_keys

    # Run the function
    deliver_advice_to_agent "2" "Use Postgres for production."

    # Should have called with Enter
    for call in "${calls[@]}"; do
        if [[ "$call" == "Enter" ]]; then
            return 0
        fi
    done

    return 1
}
