#!/usr/bin/env bats
# Test 5: Tracking File Management
# Tests that tracking file prevents duplicate alerts and manages state

setup() {
    export TEST_TRACKING_FILE="/tmp/maf-test-tracking.txt"
    rm -f "$TEST_TRACKING_FILE" 2>/dev/null || true

    # Override tracking file path for testing
    MAF_TRACKING_FILE="$TEST_TRACKING_FILE"
    export MAF_TRACKING_FILE

    source maf/scripts/maf/supervisor-coordination.sh
}

teardown() {
    rm -f "$TEST_TRACKING_FILE" 2>/dev/null || true
}

@test "mark_agent_awaiting creates tracking entry" {
    # Mark an agent as awaiting
    mark_agent_awaiting "2" "BEAD-001"

    # Should create entry in tracking file
    [[ -f "$TEST_TRACKING_FILE" ]]
}

@test "mark_agent_awaiting stores agent and bead info" {
    # Mark an agent as awaiting
    mark_agent_awaiting "2" "BEAD-001"

    # Should contain the data
    run cat "$TEST_TRACKING_FILE"
    [[ "$output" =~ "2" ]]
    [[ "$output" =~ "BEAD-001" ]]
}

@test "is_agent_awaiting detects awaiting agents" {
    # Mark an agent as awaiting
    mark_agent_awaiting "3" "BEAD-002"

    # Check if agent is awaiting
    run is_agent_awaiting "3"
    [[ "$status" -eq 0 ]]
}

@test "is_agent_awaiting returns 1 for non-awaiting agents" {
    # Don't mark anything as awaiting

    # Check if agent is awaiting
    run is_agent_awaiting "2"
    [[ "$status" -eq 1 ]]
}

@test "clear_agent_awaiting removes agent from tracking" {
    # Mark then clear
    mark_agent_awaiting "2" "BEAD-001"
    clear_agent_awaiting "2"

    # Should no longer be awaiting
    run is_agent_awaiting "2"
    [[ "$status" -eq 1 ]]
}

@test "duplicate alert prevention works" {
    # Mark as awaiting once
    mark_agent_awaiting "2" "BEAD-001"

    # Try to mark again
    run mark_agent_awaiting "2" "BEAD-001"

    # Should indicate already awaiting
    [[ "$status" -ne 0 ]]
}
