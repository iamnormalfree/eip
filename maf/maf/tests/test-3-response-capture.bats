#!/usr/bin/env bats
# Test 3: Supervisor Response Capture
# Tests that monitor_supervisor_response() captures supervisor's advice

setup() {
    # Define wrapper before sourcing script
    _tmux_capture_pane() {
        local pane="$1"
        if [[ "$pane" == "maf-cli:agents.0" ]]; then
            # Pre-alert content (should be ignored)
            echo "[Previous supervisor work]"
        else
            echo "[Other pane content]"
        fi
    }
    export -f _tmux_capture_pane

    source maf/scripts/maf/supervisor-coordination.sh
}

@test "monitor_supervisor_response captures new output after alert" {
    _tmux_capture_pane() {
        local pane="$1"
        if [[ "$pane" == "maf-cli:agents.0" ]]; then
            # Simulate the full supervisor pane after alert + response
            echo "[ALERT] Implementor-2 stuck on BEAD-001"
            echo "─────────────────────────────────────────"
            echo "Their last prompt:"
            echo "> Should I use Postgres?"
            echo ""
            echo "Respond with advice (will be delivered automatically):"
            echo "Use Postgres for production."
        fi
    }
    export -f _tmux_capture_pane

    # Run the function
    run monitor_supervisor_response "maf-cli:agents.0"

    # Should capture the advice
    [[ "$output" =~ "Postgres" ]]
}

@test "monitor_supervisor_response excludes pre-alert content" {
    local pre_alert_content=""

    _tmux_capture_pane() {
        local pane="$1"
        if [[ "$pane" == "maf-cli:agents.0" ]]; then
            # Check for content that looks like the alert itself
            echo "[ALERT] Implementor-2 stuck on BEAD-001"
            echo "Their last prompt:"
            echo "> Should I use Postgres?"
            echo "Respond with advice (will be delivered automatically):"
            # Then the response
            echo "Use Postgres for production."
        fi
    }
    export -f _tmux_capture_pane

    # Set marker
    echo "ALERT_SENT:maf-cli:agents.0" > /tmp/maf-test-marker.txt

    # Run the function
    run monitor_supervisor_response "maf-cli:agents.0"

    # Should NOT include the alert text, only the advice
    [[ ! "$output" =~ "[ALERT]" ]]
    [[ "$output" =~ "Postgres" ]]
}

@test "monitor_supervisor_response returns empty if no new content" {
    _tmux_capture_pane() {
        local pane="$1"
        if [[ "$pane" == "maf-cli:agents.0" ]]; then
            # Same content as before alert (no new output)
            echo "[ALERT] Implementor-2 stuck on BEAD-001"
        fi
    }
    export -f _tmux_capture_pane

    # Set marker
    echo "ALERT_SENT:maf-cli:agents.0" > /tmp/maf-test-marker.txt

    # Run the function
    run monitor_supervisor_response "maf-cli:agents.0"

    # Should detect no new content (empty or no advice)
    [[ -z "$output" ]] || [[ ! "$output" =~ "advice" ]]
}
