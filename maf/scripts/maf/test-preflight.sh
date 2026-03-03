#!/bin/bash
# ABOUTME: Comprehensive test script for MAF preflight validation system.
# ABOUTME: Tests all check types including missing topology, malformed JSON, missing jq, invalid pane queries, and MAF_SKIP_PREFLIGHT.

set -euo pipefail

# Script directory and project root detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

# Source the preflight gatekeeper library
PREFLIGHT_GATEKEEPER="$SCRIPT_DIR/preflight-gatekeeper.sh"

# Test configuration
TEST_DIR="${PROJECT_ROOT}/.tmp_preflight_test"
TEST_TOPOLOGY_DIR="${TEST_DIR}/topologies"
TEST_MANIFEST_DIR="${TEST_DIR}/manifest"

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

    # Save original environment
    local original_maf_skip="${MAF_SKIP_PREFLIGHT:-}"
    local original_topology="${MAF_TOPOLOGY_FILE:-}"

    # Temporarily disable set -e to allow test failures to be captured
    set +e
    # Run test in subshell to prevent exit from sourced scripts
    local exit_code=0
    local output
    output=$(bash -c "$test_command" 2>&1) || { exit_code=$?; true; }
    set -e

    # Restore environment
    export MAF_SKIP_PREFLIGHT="${original_maf_skip:-}"
    export MAF_TOPOLOGY_FILE="${original_topology:-}"

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

    echo "Creating test directory: $TEST_DIR"
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_TOPOLOGY_DIR"
    mkdir -p "$TEST_MANIFEST_DIR"

    # Create test topology files
    echo "Creating test topology files..."

    # Valid topology
    cat > "${TEST_TOPOLOGY_DIR}/valid-topology.json" <<'EOF'
{
  "topology_name": "Test Topology",
  "description": "Valid topology for testing",
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "supervisor-agent",
      "mail_name": "SupervisorMail",
      "agent_id": 1,
      "aliases": ["sup", "0"],
      "domains": ["coordination"],
      "description": "Supervisor agent"
    },
    {
      "index": 1,
      "role": "implementor-1",
      "agent_name": "implementor-agent",
      "mail_name": "ImplementorMail",
      "agent_id": 2,
      "aliases": ["imp1", "1"],
      "domains": ["implementation"],
      "description": "Implementor agent"
    }
  ],
  "role_to_pane": {
    "supervisor": 0,
    "implementor-1": 1
  }
}
EOF

    # Malformed JSON topology
    cat > "${TEST_TOPOLOGY_DIR}/malformed-json.json" <<'EOF'
{
  "topology_name": "Malformed JSON",
  "description": "This JSON is malformed
  "panes": [
    {
      "index": 0,
      "role": "supervisor"
    }
  ]
}
EOF

    # Missing required fields
    cat > "${TEST_TOPOLOGY_DIR}/missing-fields.json" <<'EOF'
{
  "topology_name": "Missing Fields",
  "description": "Missing panes field"
}
EOF

    # Invalid panes type (not an array)
    cat > "${TEST_TOPOLOGY_DIR}/invalid-panes-type.json" <<'EOF'
{
  "topology_name": "Invalid Panes Type",
  "description": "Panes should be an array",
  "panes": "not-an-array"
}
EOF

    # Missing mail_name in one pane
    cat > "${TEST_TOPOLOGY_DIR}/missing-mail-name.json" <<'EOF'
{
  "topology_name": "Missing Mail Name",
  "description": "One pane missing mail_name",
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "supervisor-agent",
      "mail_name": "SupervisorMail",
      "agent_id": 1,
      "aliases": ["sup", "0"],
      "domains": ["coordination"],
      "description": "Supervisor agent"
    },
    {
      "index": 1,
      "role": "implementor-1",
      "agent_name": "implementor-agent",
      "agent_id": 2,
      "aliases": ["imp1", "1"],
      "domains": ["implementation"],
      "description": "Implementor agent - no mail_name"
    }
  ],
  "role_to_pane": {
    "supervisor": 0,
    "implementor-1": 1
  }
}
EOF

    # Valid manifest with HQ-owned files
    cat > "${TEST_MANIFEST_DIR}/valid-manifest.json" <<'EOF'
{
  "hq_owned_files": [
    "maf/scripts/maf/preflight-gatekeeper.sh",
    "lib/maf/preflight-coordinator.ts"
  ]
}
EOF

    # Empty manifest
    cat > "${TEST_MANIFEST_DIR}/empty-manifest.json" <<'EOF'
{
  "hq_owned_files": []
}
EOF

    echo -e "${GREEN}Test environment setup complete${NC}\n"
}

# Cleanup test environment
cleanup_test_env() {
    print_header "Cleaning Up Test Environment"
    echo "Removing test directory: $TEST_DIR"
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}Cleanup complete${NC}\n"
}

# Set trap for cleanup
trap cleanup_test_env EXIT INT TERM

# ============================================================================
# TEST SCENARIOS
# ============================================================================

print_header "MAF Preflight Validation Test Suite"
echo "This script tests all preflight validation scenarios"
echo "Test directory: $TEST_DIR"
echo "Preflight library: $PREFLIGHT_GATEKEEPER"

# Setup test environment
setup_test_env

# ============================================================================
# CATEGORY 1: TOPOLOGY FILE VALIDATION (Task 2)
# ============================================================================

print_header "Category 1: Topology File Validation"

# Test 1.1: Valid topology file
run_test "Valid topology file should pass" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "success"

# Test 1.2: Missing topology file
run_test "Missing topology file should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/nonexistent.json' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "failure"

# Test 1.3: Malformed JSON topology
run_test "Malformed JSON topology should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/malformed-json.json' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "failure"

# Test 1.4: Missing required fields
run_test "Topology missing required fields should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/missing-fields.json' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "failure"

# Test 1.5: Invalid panes type (not an array)
run_test "Topology with invalid panes type should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/invalid-panes-type.json' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "failure"

# ============================================================================
# CATEGORY 2: AGENT MAIL NAME COVERAGE (Task 8 - ADVISORY)
# ============================================================================

print_header "Category 2: Agent Mail Name Coverage (Advisory)"

# Test 2.1: All panes have mail_name
run_test "All panes with mail_name should pass with success" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && check_agent_mail_names" \
    "success"

# Test 2.2: One pane missing mail_name (advisory - should not fail)
run_test "Missing mail_name should warn but not fail (advisory check)" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/missing-mail-name.json' && source '$PREFLIGHT_GATEKEEPER' && check_agent_mail_names" \
    "success"

# ============================================================================
# CATEGORY 3: TOPOLOGY HELPER FUNCTIONS (Tasks 3, 11, 12, 14)
# ============================================================================

print_header "Category 3: Topology Helper Functions"

# Test 3.1: get_mail_name_by_pane with valid index
run_test "get_mail_name_by_pane with valid index should return mail_name" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && [[ \$(get_mail_name_by_pane 0) == 'SupervisorMail' ]]" \
    "success"

# Test 3.2: get_mail_name_by_pane with invalid index
run_test "get_mail_name_by_pane with invalid index should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && get_mail_name_by_pane 99" \
    "failure"

# Test 3.3: get_mail_name_by_pane with missing mail_name
run_test "get_mail_name_by_pane with pane missing mail_name should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/missing-mail-name.json' && source '$PREFLIGHT_GATEKEEPER' && get_mail_name_by_pane 1" \
    "failure"

# Test 3.4: get_agent_name_by_pane with valid index
run_test "get_agent_name_by_pane with valid index should return agent_name" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && [[ \$(get_agent_name_by_pane 1) == 'implementor-agent' ]]" \
    "success"

# Test 3.5: get_agent_name_by_pane with invalid index
run_test "get_agent_name_by_pane with invalid index should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && get_agent_name_by_pane 99" \
    "failure"

# Test 3.6: get_mail_name_by_role with valid role
run_test "get_mail_name_by_role with valid role should return mail_name" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && [[ \$(get_mail_name_by_role 'supervisor') == 'SupervisorMail' ]]" \
    "success"

# Test 3.7: get_mail_name_by_role with invalid role
run_test "get_mail_name_by_role with invalid role should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && get_mail_name_by_role 'nonexistent-role'" \
    "failure"

# Test 3.8: get_pane_by_role with valid role
run_test "get_pane_by_role with valid role should return pane index" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && [[ \$(get_pane_by_role 'supervisor') == '0' ]]" \
    "success"

# Test 3.9: get_pane_by_role with invalid role
run_test "get_pane_by_role with invalid role should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && get_pane_by_role 'nonexistent-role'" \
    "failure"

# ============================================================================
# CATEGORY 4: MAF_SKIP_PREFLIGHT ENVIRONMENT VARIABLE
# ============================================================================

print_header "Category 4: MAF_SKIP_PREFLIGHT Environment Variable"

# Test 4.1: MAF_SKIP_PREFLIGHT should skip topology validation
run_test "MAF_SKIP_PREFLIGHT=true should skip topology validation" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/nonexistent.json' && export MAF_SKIP_PREFLIGHT='true' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "success"

# Test 4.2: MAF_SKIP_PREFLIGHT should skip dependency checks
run_test "MAF_SKIP_PREFLIGHT=true should skip dependency checks" \
    "export MAF_SKIP_PREFLIGHT='true' && source '$PREFLIGHT_GATEKEEPER' && check_required_dependencies" \
    "success"

# Test 4.3: MAF_SKIP_PREFLIGHT should skip Agent Mail name checks
run_test "MAF_SKIP_PREFLIGHT=true should skip Agent Mail name checks" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/missing-mail-name.json' && export MAF_SKIP_PREFLIGHT='true' && source '$PREFLIGHT_GATEKEEPER' && check_agent_mail_names" \
    "success"

# ============================================================================
# CATEGORY 5: CUSTOM TOPOLOGY PATH (MAF_TOPOLOGY_FILE)
# ============================================================================

print_header "Category 5: Custom Topology Path (MAF_TOPOLOGY_FILE)"

# Test 5.1: Custom topology path via MAF_TOPOLOGY_FILE
run_test "MAF_TOPOLOGY_FILE should override default topology path" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && check_topology_file" \
    "success"

# ============================================================================
# CATEGORY 6: MAF SUBTREE INTEGRITY (Task 9 - ADVISORY)
# ============================================================================

print_header "Category 6: MAF Subtree Integrity (Advisory)"

# Test 6.1: MAF subtree integrity check (advisory - should not fail)
run_test "MAF subtree integrity check should pass (advisory check)" \
    "source '$PREFLIGHT_GATEKEEPER' && check_maf_subtree" \
    "success"

# ============================================================================
# CATEGORY 7: OPTIONAL TOOLS CHECK (Task 18 - ADVISORY)
# ============================================================================

print_header "Category 7: Optional Tools Check (Advisory)"

# Test 7.1: Optional tools check (advisory - should not fail)
run_test "Optional tools check should pass even if tools missing (advisory)" \
    "source '$PREFLIGHT_GATEKEEPER' && check_optional_tools" \
    "success"

# ============================================================================
# CATEGORY 8: HQ FILES VALIDATION (Task 15 - CRITICAL)
# ============================================================================

print_header "Category 8: HQ Files Validation (Critical)"

# Test 8.1: Missing manifest file should skip gracefully
run_test "Missing manifest file should skip HQ files validation" \
    "export PROJECT_ROOT='$TEST_DIR' && source '$PREFLIGHT_GATEKEEPER' && check_hq_files_unmodified" \
    "success"

# Test 8.2: Empty hq_owned_files list should pass
run_test "Empty hq_owned_files list should pass" \
    "export PROJECT_ROOT='$TEST_DIR' && mkdir -p '$TEST_DIR/.claude' && ln -sf '${TEST_MANIFEST_DIR}/empty-manifest.json' '$TEST_DIR/.claude/.maf-manifest.json' && source '$PREFLIGHT_GATEKEEPER' && check_hq_files_unmodified" \
    "success"

# ============================================================================
# CATEGORY 9: ERROR HANDLING FUNCTIONS (Task 1.2)
# ============================================================================

print_header "Category 9: Error Handling Functions"

# Test 9.1: return_error should exit with code 1
run_test "return_error should exit with code 1" \
    "bash -c \"source '$PREFLIGHT_GATEKEEPER' 2>/dev/null; return_error 'Test error' 'Test hint'\" 2>/dev/null; exit_code=\$?; [[ \$exit_code -eq 1 ]]" \
    "success"

# Test 9.2: return_warn should exit with code 0
run_test "return_warn should exit with code 0 (advisory)" \
    "source '$PREFLIGHT_GATEKEEPER' && return_warn 'Test warning' 'Test hint' >/dev/null" \
    "success"

# Test 9.3: return_skip should exit with code 0
run_test "return_skip should exit with code 0" \
    "source '$PREFLIGHT_GATEKEEPER' && return_skip 'Test skip message' >/dev/null" \
    "success"

# ============================================================================
# CATEGORY 10: PREFLIGHT_INIT ORCHESTRATION (Task 1.6)
# ============================================================================

print_header "Category 10: Preflight Init Orchestration"

# Test 10.1: Full preflight_init with valid topology
run_test "preflight_init with valid topology should pass all checks" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/valid-topology.json' && source '$PREFLIGHT_GATEKEEPER' && preflight_init" \
    "success"

# Test 10.2: preflight_init with missing topology should fail
run_test "preflight_init with missing topology should fail" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/nonexistent.json' && source '$PREFLIGHT_GATEKEEPER' && preflight_init" \
    "failure"

# Test 10.3: preflight_init with MAF_SKIP_PREFLIGHT should pass
run_test "preflight_init with MAF_SKIP_PREFLIGHT should skip all checks" \
    "export MAF_TOPOLOGY_FILE='${TEST_TOPOLOGY_DIR}/nonexistent.json' && export MAF_SKIP_PREFLIGHT='true' && source '$PREFLIGHT_GATEKEEPER' && preflight_init" \
    "success"

# ============================================================================
# CATEGORY 11: jq DEPENDENCY CHECK (Task 7)
# ============================================================================

print_header "Category 11: jq Dependency Check"

# Test 11.1: jq installed should pass
if command -v jq &>/dev/null; then
    run_test "jq installed should pass dependency check" \
        "source '$PREFLIGHT_GATEKEEPER' && check_required_dependencies" \
        "success"
else
    echo -e "${YELLOW}WARNING: jq not installed, skipping jq dependency test${NC}\n"
fi

# ============================================================================
# TEST SUMMARY
# ============================================================================

print_header "Test Summary"

echo -e "${BOLD}Total Tests Run:${NC} $TESTS_RUN"
echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ ALL TESTS PASSED${NC}\n"
    exit 0
else
    echo -e "${RED}${BOLD}✗ SOME TESTS FAILED${NC}\n"
    exit 1
fi
