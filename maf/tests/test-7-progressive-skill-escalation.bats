#!/usr/bin/env bats
# Test 7: Progressive Skill Escalation
# Tests bead attempt tracking and progressive skill escalation logic

setup() {
    export TEST_ATTEMPT_FILE="/tmp/maf-test-attempts.txt"
    export TEST_PREFS_FILE="/tmp/maf-test-prefs.txt"
    rm -f "$TEST_ATTEMPT_FILE" "$TEST_PREFS_FILE" 2>/dev/null || true

    # Override tracking file paths for testing
    ATTEMPT_TRACKING_FILE="$TEST_ATTEMPT_FILE"
    SECOND_ATTEMPT_PREFS_FILE="$TEST_PREFS_FILE"
    export ATTEMPT_TRACKING_FILE
    export SECOND_ATTEMPT_PREFS_FILE

    # Mock log function to avoid date command issues (output to stderr)
    log() {
        echo "[LOG] $1" >&2
    }
    export -f log

    # Source the coordinate-agents script functions only
    # We need to source just the functions we're testing
    source maf/scripts/maf/coordinate-agents.sh
}

teardown() {
    rm -f "$TEST_ATTEMPT_FILE" "$TEST_PREFS_FILE" 2>/dev/null || true
}

# ============================================================================
# GET BEAD ATTEMPT INFO TESTS
# ============================================================================

@test "get_bead_attempt_info returns 0:none for new bead" {
    # Get info for bead with no history
    run get_bead_attempt_info "BEAD-001"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "0:none" ]]
}

@test "get_bead_attempt_info returns correct info after one attempt" {
    # Record an attempt
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"

    # Get info
    run get_bead_attempt_info "BEAD-001"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "1:response-awareness" ]]
}

@test "get_bead_attempt_info returns latest attempt for multiple attempts" {
    # Record multiple attempts
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:2:tdd:1705480100" >> "$TEST_ATTEMPT_FILE"

    # Get info
    run get_bead_attempt_info "BEAD-001"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "2:tdd" ]]
}

# ============================================================================
# RECORD BEAD ATTEMPT TESTS
# ============================================================================

@test "record_bead_attempt creates entry for new bead" {
    # Record first attempt
    run record_bead_attempt "BEAD-001" "response-awareness"

    [[ "$status" -eq 0 ]]
    [[ -f "$TEST_ATTEMPT_FILE" ]]

    # Check entry was created
    run grep "^BEAD-001:" "$TEST_ATTEMPT_FILE"
    [[ "$output" =~ "BEAD-001:1:response-awareness" ]]
}

@test "record_bead_attempt increments attempt count" {
    # Create initial entry
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"

    # Record second attempt
    run record_bead_attempt "BEAD-001" "tdd"

    [[ "$status" -eq 0 ]]

    # Check attempt count incremented
    local entries
    entries="$(grep "^BEAD-001:" "$TEST_ATTEMPT_FILE" | wc -l)"
    [[ "$entries" -eq 2 ]]

    # Check latest entry has count 2 and skill tdd
    local latest_entry
    latest_entry="$(grep "^BEAD-001:" "$TEST_ATTEMPT_FILE" | tail -1)"

    # Check components separately (bats compatibility)
    [[ "$latest_entry" =~ "BEAD-001:2:" ]]
    [[ "$latest_entry" =~ "tdd:" ]]
}

# ============================================================================
# CLEAR BEAD ATTEMPTS TESTS
# ============================================================================

@test "clear_bead_attempts removes all entries for bead" {
    # Create multiple entries
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:2:tdd:1705480100" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-002:1:response-awareness:1705480200" >> "$TEST_ATTEMPT_FILE"

    # Clear attempts for BEAD-001
    run clear_bead_attempts "BEAD-001"

    [[ "$status" -eq 0 ]]

    # BEAD-001 entries should be gone
    run grep "^BEAD-001:" "$TEST_ATTEMPT_FILE"
    [[ "$status" -ne 0 ]]

    # BEAD-002 entry should remain
    run grep "^BEAD-002:" "$TEST_ATTEMPT_FILE"
    [[ "$status" -eq 0 ]]
}

@test "clear_bead_attempts removes empty tracking file" {
    # Create single entry
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"

    # Clear attempts
    run clear_bead_attempts "BEAD-001"

    [[ "$status" -eq 0 ]]
    [[ ! -f "$TEST_ATTEMPT_FILE" ]]
}

# ============================================================================
# SET SECOND ATTEMPT SKILL TESTS
# ============================================================================

@test "set_second_attempt_skill creates preference file" {
    # Set preference
    run set_second_attempt_skill "BEAD-001" "/tdd"

    [[ "$status" -eq 0 ]]
    [[ -f "$TEST_PREFS_FILE" ]]
}

@test "set_second_attempt_skill stores skill preference" {
    # Set preference
    set_second_attempt_skill "BEAD-001" "/tdd"

    # Check preference was stored
    run grep "^BEAD-001:" "$TEST_PREFS_FILE"
    [[ "$output" == "BEAD-001:/tdd" ]]
}

@test "set_second_attempt_skill updates existing preference" {
    # Set initial preference
    set_second_attempt_skill "BEAD-001" "/tdd"

    # Update preference
    run set_second_attempt_skill "BEAD-001" "/superpowers:subagent-driven-development"

    [[ "$status" -eq 0 ]]

    # Check only one entry exists with new value
    local entries
    entries="$(grep "^BEAD-001:" "$TEST_PREFS_FILE" | wc -l)"
    [[ "$entries" -eq 1 ]]

    run grep "^BEAD-001:" "$TEST_PREFS_FILE"
    [[ "$output" == "BEAD-001:/superpowers:subagent-driven-development" ]]
}

# ============================================================================
# GET SECOND ATTEMPT SKILL TESTS
# ============================================================================

@test "get_second_attempt_skill returns empty when no preference" {
    # No preference set
    run get_second_attempt_skill "BEAD-001"

    [[ "$status" -eq 0 ]]
    [[ -z "$output" ]]
}

@test "get_second_attempt_skill returns stored preference" {
    # Set preference
    echo "BEAD-001:/tdd" >> "$TEST_PREFS_FILE"

    # Get preference
    run get_second_attempt_skill "BEAD-001"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "/tdd" ]]
}

# ============================================================================
# ROUTE SKILL FOR BEAD TESTS
# ============================================================================

@test "route_skill_for_bead returns response-awareness for first attempt" {
    # First attempt - no history
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/response-awareness" ]]
}

@test "route_skill_for_bead returns tdd for second attempt (default)" {
    # First attempt recorded
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"

    # Second attempt
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/tdd" ]]
}

@test "route_skill_for_bead respects second attempt preference" {
    # First attempt recorded
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"

    # Set second attempt preference
    echo "BEAD-001:/superpowers:subagent-driven-development" >> "$TEST_PREFS_FILE"

    # Second attempt should use preference
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/superpowers:subagent-driven-development" ]]
}

@test "route_skill_for_bead toggles from tdd to sdd on third attempt" {
    # First and second attempts recorded
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:2:tdd:1705480100" >> "$TEST_ATTEMPT_FILE"

    # Third attempt should toggle to sdd
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/superpowers:subagent-driven-development" ]]
}

@test "route_skill_for_bead toggles from sdd to tdd on third attempt" {
    # First and second attempts recorded
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:2:sdd:1705480100" >> "$TEST_ATTEMPT_FILE"

    # Third attempt should toggle to tdd
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/tdd" ]]
}

@test "route_skill_for_bead toggles from response-awareness to tdd on third attempt" {
    # Two attempts with response-awareness (edge case)
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:2:response-awareness:1705480100" >> "$TEST_ATTEMPT_FILE"

    # Third attempt should default to tdd
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/tdd" ]]
}

@test "route_skill_for_bead continues toggling on fourth attempt" {
    # Three attempts recorded
    echo "BEAD-001:1:response-awareness:1705480000" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:2:tdd:1705480100" >> "$TEST_ATTEMPT_FILE"
    echo "BEAD-001:3:sdd:1705480200" >> "$TEST_ATTEMPT_FILE"

    # Fourth attempt should toggle back to tdd
    run route_skill_for_bead "BEAD-001"

    [[ "$status" -eq 0 ]]
    # Get last line which should be the actual return value
    local actual_output
    actual_output="$(echo "$output" | tail -1)"
    [[ "$actual_output" == "/tdd" ]]
}

# ============================================================================
# EXTRACT SKILL NAME TESTS
# ============================================================================

@test "extract_skill_name returns tdd for /tdd command" {
    run extract_skill_name "/tdd"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "tdd" ]]
}

@test "extract_skill_name returns sdd for SDD command" {
    run extract_skill_name "/superpowers:subagent-driven-development"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "sdd" ]]
}

@test "extract_skill_name returns response-awareness for other commands" {
    run extract_skill_name "/response-awareness"

    [[ "$status" -eq 0 ]]
    [[ "$output" == "response-awareness" ]]
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

@test "full workflow: first attempt to third attempt" {
    local bead_id="BEAD-TEST-001"

    # First attempt
    local skill1
    skill1="$(route_skill_for_bead "$bead_id" | tail -1)"
    [[ "$skill1" == "/response-awareness" ]]

    local skill_name1
    skill_name1="$(extract_skill_name "$skill1")"
    record_bead_attempt "$bead_id" "$skill_name1" 2>&1 >/dev/null

    # Second attempt
    local skill2
    skill2="$(route_skill_for_bead "$bead_id" | tail -1)"
    [[ "$skill2" == "/tdd" ]]

    local skill_name2
    skill_name2="$(extract_skill_name "$skill2")"
    record_bead_attempt "$bead_id" "$skill_name2" 2>&1 >/dev/null

    # Third attempt
    local skill3
    skill3="$(route_skill_for_bead "$bead_id" | tail -1)"
    [[ "$skill3" == "/superpowers:subagent-driven-development" ]]
}

@test "full workflow: with second attempt preference set" {
    local bead_id="BEAD-TEST-002"

    # First attempt
    local skill1
    skill1="$(route_skill_for_bead "$bead_id" | tail -1)"
    [[ "$skill1" == "/response-awareness" ]]

    local skill_name1
    skill_name1="$(extract_skill_name "$skill1")"
    record_bead_attempt "$bead_id" "$skill_name1" 2>&1 >/dev/null

    # Set second attempt preference
    set_second_attempt_skill "$bead_id" "/superpowers:subagent-driven-development" 2>&1 >/dev/null

    # Second attempt should use preference
    local skill2
    skill2="$(route_skill_for_bead "$bead_id" | tail -1)"
    [[ "$skill2" == "/superpowers:subagent-driven-development" ]]

    local skill_name2
    skill_name2="$(extract_skill_name "$skill2")"
    record_bead_attempt "$bead_id" "$skill_name2" 2>&1 >/dev/null

    # Third attempt should toggle to tdd
    local skill3
    skill3="$(route_skill_for_bead "$bead_id" | tail -1)"
    [[ "$skill3" == "/tdd" ]]
}

@test "clear_bead_attempts also clears preferences" {
    local bead_id="BEAD-TEST-003"

    # Set preference
    set_second_attempt_skill "$bead_id" "/tdd"

    # Verify preference exists
    run grep "^${bead_id}:" "$TEST_PREFS_FILE"
    [[ "$status" -eq 0 ]]

    # Clear attempts
    clear_bead_attempts "$bead_id"

    # Verify preference also cleared
    run grep "^${bead_id}:" "$TEST_PREFS_FILE"
    [[ "$status" -ne 0 ]]
}
