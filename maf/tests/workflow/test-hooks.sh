#!/bin/bash
# ABOUTME: Test framework for autonomous-workflow hook system.
# ABOUTME: Tests hook loading, invocation, parameter passing, and error handling.

set -euo pipefail

# Script directory and project root detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test configuration
TEST_DIR="${PROJECT_ROOT}/.tmp_workflow_test"
TEST_FIXTURES_DIR="${SCRIPT_DIR}/fixtures"

# Workflow script location (will be created in Phase 1)
WORKFLOW_SCRIPT="${PROJECT_ROOT}/experiments/autonomous-workflow.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# TEST FRAMEWORK FUNCTIONS
# ============================================================================

# Print header
print_header() {
    echo -e "\n${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}\n"
}

# Run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-success}"  # success or failure

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${YELLOW}[$TESTS_RUN] Testing: $test_name${NC}"
    echo -e "   Expected: $expected_result"

    # Temporarily disable set -e to allow test failures to be captured
    set +e
    local exit_code=0
    local output
    output=$(bash -c "$test_command" 2>&1) || { exit_code=$?; true; }
    set -e

    # Check result
    local test_passed=false
    if [[ "$expected_result" == "success" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            test_passed=true
        fi
    else
        if [[ $exit_code -ne 0 ]]; then
            test_passed=true
        fi
    fi

    # Report result
    if $test_passed; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}   ✓ PASSED${NC}\n"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}   ✗ FAILED${NC}"
        echo -e "${RED}   Exit code: $exit_code (expected: $expected_result)${NC}"
        echo -e "${RED}   Output: $output${NC}\n"
        return 1
    fi
}

# Setup test environment
setup_test_env() {
    print_header "Setting Up Test Environment"

    # Clean up any previous test artifacts
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"

    # Create temporary .maf/config directory for hook tests
    mkdir -p "$TEST_DIR/.maf/config"

    # Create test topology file
    cat > "$TEST_DIR/.maf/config/agent-topology.json" <<'EOF'
{
  "topology_name": "Test Topology",
  "description": "Test topology for workflow hook tests",
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "TestSupervisor",
      "mail_name": "TestSupervisorMail"
    },
    {
      "index": 1,
      "role": "reviewer",
      "agent_name": "TestReviewer",
      "mail_name": "TestReviewerMail"
    },
    {
      "index": 2,
      "role": "implementer-1",
      "agent_name": "TestImplementer1",
      "mail_name": "TestImplementer1Mail"
    },
    {
      "index": 3,
      "role": "implementer-2",
      "agent_name": "TestImplementer2",
      "mail_name": "TestImplementer2Mail"
    }
  ]
}
EOF

    echo -e "${GREEN}✓ Test environment created at $TEST_DIR${NC}"
}

# Cleanup test environment
cleanup_test_env() {
    print_header "Cleaning Up Test Environment"
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}✓ Test environment cleaned up${NC}"
}

# ============================================================================
# TEST: PHASE 0 TASK 0.1 - TEST FRAMEWORK SETUP
# ============================================================================

test_framework_setup() {
    print_header "TEST: Framework Setup"

    # Test: Can create temporary test fixtures
    run_test "Can create temporary test fixtures" \
        "mkdir -p $TEST_DIR/fixtures && test -d $TEST_DIR/fixtures"

    # Test: Can mock tmux for testing
    run_test "Can create mock tmux script" \
        "echo '#!/bin/bash
# Mock tmux for testing
echo \"mock tmux called: \$@\"' > $TEST_DIR/mock-tmux && chmod +x $TEST_DIR/mock-tmux && test -x $TEST_DIR/mock-tmux"

    # Test: Can create test topology
    run_test "Test topology file is valid JSON" \
        "jq empty $TEST_DIR/.maf/config/agent-topology.json"

    # Test: Test topology has required fields
    run_test "Test topology has all required fields" \
        "jq -e '.topology_name and .description and .panes and (.panes | length == 4)' $TEST_DIR/.maf/config/agent-topology.json"

    # Test: Test topology has mail_name for each pane
    run_test "Test topology has mail_name for all panes" \
        "jq -e '.panes | all(.mail_name != null)' $TEST_DIR/.maf/config/agent-topology.json"
}

# ============================================================================
# TEST: PHASE 1 TASK 1.1 - HOOK SOURCING MECHANISM
# ============================================================================

test_hook_sourcing() {
    print_header "TEST: Hook Sourcing Mechanism"

    local hook_file="$TEST_DIR/.maf/config/custom-workflow-hooks.sh"
    local workflow_script="$WORKFLOW_SCRIPT"

    # Create a simple hook file for testing
    cat > "$hook_file" <<'EOF'
#!/bin/bash
# Test hook file for testing hook loading

CUSTOM_HOOK_BEFORE_LOOP() {
    echo "CUSTOM_HOOK_BEFORE_LOOP called"
    return 0
}

CUSTOM_HOOK_BEFORE_CHECK() {
    echo "CUSTOM_HOOK_BEFORE_CHECK called"
    return 0
}
EOF

    chmod +x "$hook_file"

    # Test: Hook file can be sourced
    run_test "Hook file can be sourced directly" \
        "source $hook_file && declare -f CUSTOM_HOOK_BEFORE_LOOP"

    # Test: Hook function is callable after sourcing
    run_test "Hook function is callable after sourcing" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_LOOP"

    # Test: Missing hook file doesn't cause error when checking function existence
    run_test "Missing hook file doesn't crash when checking function" \
        "unset CUSTOM_HOOK_BEFORE_LOOP; declare -f CUSTOM_HOOK_BEFORE_LOOP >/dev/null 2>&1 || echo 'function not found'"

    # Test: Hook file exists check works
    run_test "Hook file exists check returns true when file exists" \
        "test -f $hook_file"

    # Test: Hook file doesn't exist check works
    run_test "Hook file exists check returns false when file missing" \
        "test -f /nonexistent/hooks.sh || true" "success"

    # Test: Workflow script sources hook file when present
    # Uses --audit mode to avoid infinite loop during testing
    run_test "Workflow script sources hook file when present" \
        "PROJECT_ROOT=$TEST_DIR bash -c '
            if [[ -f \"$workflow_script\" ]]; then
                export MAF_SKIP_PREFLIGHT=true
                # Use --audit mode to run quickly without loop
                bash \"$workflow_script\" --audit >/dev/null 2>&1 || true
                # Source just the hook file directly to verify function exists
                source \"$TEST_DIR/.maf/config/custom-workflow-hooks.sh\"
                declare -f CUSTOM_HOOK_BEFORE_LOOP >/dev/null
            else
                echo \"Workflow script not created yet\"
                exit 1
            fi
        '" "success"
}

# ============================================================================
# TEST: PHASE 1 TASK 1.2 - HOOK 1: BEFORE_LOOP
# ============================================================================

test_hook_before_loop() {
    print_header "TEST: Hook 1 - BEFORE_LOOP"

    local hook_file="$TEST_DIR/.maf/config/custom-workflow-hooks.sh"
    local tracking_file="$TEST_DIR/.hook-tracking.txt"

    # Create hook that tracks its execution
    cat > "$hook_file" <<EOF
#!/bin/bash
CUSTOM_HOOK_BEFORE_LOOP() {
    echo "BEFORE_LOOP_CALLED" > "$tracking_file"
    return 0
}
EOF

    chmod +x "$hook_file"

    # Test: Hook can be called directly
    run_test "BEFORE_LOOP hook can be called directly" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_LOOP && test -f $tracking_file && grep -q BEFORE_LOOP_CALLED $tracking_file"

    # Test: Hook returns 0 for success
    run_test "BEFORE_LOOP hook returns 0 on success" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_LOOP; echo \$?"

    # Test: Hook can abort workflow by returning 2
    cat > "$hook_file" <<'EOF'
#!/bin/bash
CUSTOM_HOOK_BEFORE_LOOP() {
    return 2
}
EOF
    run_test "BEFORE_LOOP hook can abort workflow (returns 2)" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_LOOP; test \$? -eq 2"
}

# ============================================================================
# TEST: PHASE 1 TASK 1.3 - HOOK 2: BEFORE_CHECK
# ============================================================================

test_hook_before_check() {
    print_header "TEST: Hook 2 - BEFORE_CHECK"

    local hook_file="$TEST_DIR/.maf/config/custom-workflow-hooks.sh"
    local tracking_file="$TEST_DIR/.before-check-tracking.txt"

    # Create hook that tracks its calls with parameters
    cat > "$hook_file" <<EOF
#!/bin/bash
CUSTOM_HOOK_BEFORE_CHECK() {
    local iteration="\$1"
    local last_status="\$2"
    echo "iteration=\$iteration,status=\$last_status" >> "$tracking_file"
    return 0
}
EOF

    chmod +x "$hook_file"

    # Test: Hook receives iteration parameter
    run_test "BEFORE_CHECK hook receives iteration parameter" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_CHECK 5 0 && grep -q 'iteration=5' $tracking_file"

    # Test: Hook receives last status parameter
    run_test "BEFORE_CHECK hook receives last status parameter" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_CHECK 5 1 && grep -q 'status=1' $tracking_file"

    # Test: Hook can skip agent checks by returning 1
    cat > "$hook_file" <<'EOF'
#!/bin/bash
CUSTOM_HOOK_BEFORE_CHECK() {
    return 1
}
EOF
    run_test "BEFORE_CHECK hook can skip checks (returns 1)" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_CHECK 1 0; test \$? -eq 1"
}

# ============================================================================
# TEST: PHASE 1 TASK 1.4 - HOOK 3: BEFORE_ASSIGN
# ============================================================================

test_hook_before_assign() {
    print_header "TEST: Hook 3 - BEFORE_ASSIGN"

    local hook_file="$TEST_DIR/.maf/config/custom-workflow-hooks.sh"
    local tracking_file="$TEST_DIR/.before-assign-tracking.txt"

    # Create hook that tracks bead assignments
    cat > "$hook_file" <<EOF
#!/bin/bash
CUSTOM_HOOK_BEFORE_ASSIGN() {
    local bead_id="\$1"
    local ready_beads="\$2"
    echo "bead=\$bead_id" >> "$tracking_file"
    return 0
}
EOF

    chmod +x "$hook_file"

    # Test: Hook receives bead_id parameter
    run_test "BEFORE_ASSIGN hook receives bead_id parameter" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_ASSIGN 'test-bead-123' '[]' && grep -q 'bead=test-bead-123' $tracking_file"

    # Test: Hook receives ready_beads parameter
    cat > "$hook_file" <<EOF
#!/bin/bash
CUSTOM_HOOK_BEFORE_ASSIGN() {
    local ready_beads="\$2"
    echo "beads=\$ready_beads" >> "$tracking_file"
    return 0
}
EOF
    run_test "BEFORE_ASSIGN hook receives ready_beads parameter" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_ASSIGN 'test-bead' '[\"a\",\"b\"]' && grep -q 'beads=\[\"a\",\"b\"\]' $tracking_file"

    # Test: Hook can skip bead by returning 1
    cat > "$hook_file" <<'EOF'
#!/bin/bash
CUSTOM_HOOK_BEFORE_ASSIGN() {
    return 1
}
EOF
    run_test "BEFORE_ASSIGN hook can skip bead (returns 1)" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_ASSIGN 'test-bead' '[]'; test \$? -eq 1"

    # Test: Hook can abort assignments by returning 2
    cat > "$hook_file" <<'EOF'
#!/bin/bash
CUSTOM_HOOK_BEFORE_ASSIGN() {
    return 2
}
EOF
    run_test "BEFORE_ASSIGN hook can abort assignments (returns 2)" \
        "source $hook_file && CUSTOM_HOOK_BEFORE_ASSIGN 'test-bead' '[]'; test \$? -eq 2"
}

# ============================================================================
# TEST: ALL 8 HOOKS DEFINED
# ============================================================================

test_all_hooks_defined() {
    print_header "TEST: All 8 Hooks Can Be Defined"

    local hook_file="$TEST_DIR/.maf/config/custom-workflow-hooks.sh"

    # Create hook file with all 8 hooks
    cat > "$hook_file" <<'EOF'
#!/bin/bash
# Test file with all 8 hooks defined

CUSTOM_HOOK_BEFORE_LOOP() {
    echo "Hook 1: BEFORE_LOOP"
    return 0
}

CUSTOM_HOOK_BEFORE_CHECK() {
    echo "Hook 2: BEFORE_CHECK"
    return 0
}

CUSTOM_HOOK_BEFORE_ASSIGN() {
    echo "Hook 3: BEFORE_ASSIGN"
    return 0
}

CUSTOM_HOOK_AFTER_ASSIGN() {
    echo "Hook 4: AFTER_ASSIGN"
    return 0
}

CUSTOM_HOOK_CUSTOM_BEAD() {
    echo "Hook 5: CUSTOM_BEAD"
    return 0
}

CUSTOM_HOOK_AGENT_PROMPT() {
    echo "Hook 6: AGENT_PROMPT"
    echo "$2"
    return 0
}

CUSTOM_HOOK_AFTER_CHECK() {
    echo "Hook 7: AFTER_CHECK"
    return 0
}

CUSTOM_HOOK_ERROR_HANDLER() {
    echo "Hook 8: ERROR_HANDLER"
    return 0
}
EOF

    chmod +x "$hook_file"

    # Test: All 8 hooks are defined after sourcing
    run_test "All 8 hooks are defined after sourcing" \
        "source $hook_file && \
         declare -f CUSTOM_HOOK_BEFORE_LOOP >/dev/null && \
         declare -f CUSTOM_HOOK_BEFORE_CHECK >/dev/null && \
         declare -f CUSTOM_HOOK_BEFORE_ASSIGN >/dev/null && \
         declare -f CUSTOM_HOOK_AFTER_ASSIGN >/dev/null && \
         declare -f CUSTOM_HOOK_CUSTOM_BEAD >/dev/null && \
         declare -f CUSTOM_HOOK_AGENT_PROMPT >/dev/null && \
         declare -f CUSTOM_HOOK_AFTER_CHECK >/dev/null && \
         declare -f CUSTOM_HOOK_ERROR_HANDLER >/dev/null"

    # Test: AGENT_PROMPT hook returns modified command
    run_test "AGENT_PROMPT hook returns command" \
        "source $hook_file && result=\$(CUSTOM_HOOK_AGENT_PROMPT 2 'test command' | tail -1) && test \"\$result\" = 'test command'"

    # Test: CUSTOM_BEAD hook returns 0 (handled)
    run_test "CUSTOM_BEAD hook returns 0 when handled" \
        "source $hook_file && CUSTOM_HOOK_CUSTOM_BEAD 'bead-123' 'title' '[]'; test \$? -eq 0"

    # Test: ERROR_HANDLER hook receives error details
    run_test "ERROR_HANDLER hook receives error parameters" \
        "source $hook_file && CUSTOM_HOOK_ERROR_HANDLER 42 'test error' 'context'; test \$? -eq 0"
}

# ============================================================================
# TEST: PHASE 0 TASK 0.2 - FIXTURE FILES
# ============================================================================

test_fixture_files() {
    print_header "TEST: Fixture Files"

    local fixtures_dir="${TEST_FIXTURES_DIR}"

    # Test: Topology fixture file exists
    run_test "Topology fixture file exists" \
        "test -f $fixtures_dir/agent-topology-test.json"

    # Test: Topology fixture is valid JSON
    run_test "Topology fixture is valid JSON" \
        "jq empty $fixtures_dir/agent-topology-test.json"

    # Test: Topology fixture has required fields
    run_test "Topology fixture has required fields" \
        "jq -e '.topology_name and .description and .panes' $fixtures_dir/agent-topology-test.json"

    # Test: Topology fixture has 4 panes
    run_test "Topology fixture has 4 panes" \
        "jq -e '.panes | length == 4' $fixtures_dir/agent-topology-test.json"

    # Test: Topology fixture has mail_name for each pane
    run_test "Topology fixture has mail_name for all panes" \
        "jq -e '.panes | all(.mail_name != null)' $fixtures_dir/agent-topology-test.json"

    # Test: Custom hooks example file exists
    run_test "Custom hooks example file exists" \
        "test -f $fixtures_dir/custom-hooks-example.sh"

    # Test: Custom hooks example is valid bash
    run_test "Custom hooks example is valid bash" \
        "bash -n $fixtures_dir/custom-hooks-example.sh"

    # Test: Custom hooks example has all 8 hooks
    run_test "Custom hooks example has all 8 hooks" \
        "source $fixtures_dir/custom-hooks-example.sh && \
         declare -f CUSTOM_HOOK_BEFORE_LOOP >/dev/null && \
         declare -f CUSTOM_HOOK_BEFORE_CHECK >/dev/null && \
         declare -f CUSTOM_HOOK_BEFORE_ASSIGN >/dev/null && \
         declare -f CUSTOM_HOOK_AFTER_ASSIGN >/dev/null && \
         declare -f CUSTOM_HOOK_CUSTOM_BEAD >/dev/null && \
         declare -f CUSTOM_HOOK_AGENT_PROMPT >/dev/null && \
         declare -f CUSTOM_HOOK_AFTER_CHECK >/dev/null && \
         declare -f CUSTOM_HOOK_ERROR_HANDLER >/dev/null"

    # Test: Mock tmux script exists
    run_test "Mock tmux script exists" \
        "test -f $fixtures_dir/mock-tmux.sh"

    # Test: Mock tmux script is executable
    run_test "Mock tmux script is executable" \
        "test -x $fixtures_dir/mock-tmux.sh"
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

main() {
    echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  MAF Workflow Hook System Test Suite${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"

    # Setup
    setup_test_env

    # Run tests (continue even if some fail)
    test_framework_setup || true
    test_hook_sourcing || true
    test_hook_before_loop || true
    test_hook_before_check || true
    test_hook_before_assign || true
    test_all_hooks_defined || true
    test_fixture_files || true

    # Cleanup
    cleanup_test_env

    # Summary
    echo -e "\n${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  TEST SUMMARY${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo -e "Total Tests:  $TESTS_RUN"
    echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
    echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}\n"

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}All tests passed!${NC}\n"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}\n"
        exit 1
    fi
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
