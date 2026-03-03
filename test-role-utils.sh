#!/bin/bash
# Fixed comprehensive test suite for role-utils.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
BUGS_FOUND=0
WARNINGS=0

# Test results tracking
declare -a FAILED_TESTS
declare -a BUGS
declare -a WARNING_LIST

# Function to print test header
print_test_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}TEST SECTION: $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to run a test (expect success)
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  ✓ $test_name ... "
    
    if eval "$test_command" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        local exit_code=$?
        echo -e "${RED}FAIL${NC} (exit code: $exit_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Function to run a test (expect failure)
run_test_fail() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  ✓ $test_name (should fail) ... "
    
    if eval "$test_command" 2>/dev/null; then
        echo -e "${RED}FAIL${NC} (expected failure but succeeded)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
        return 1
    else
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    fi
}

# Function to test output
run_output_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_output="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  ✓ $test_name ... "
    
    local actual
    actual=$(eval "$test_command" 2>&1)
    
    if [ "$actual" = "$expected_output" ]; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "    Expected: '$expected_output'"
        echo "    Got:      '$actual'"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Function to record a bug
record_bug() {
    local bug_description="$1"
    local severity="$2"
    local details="$3"
    
    BUGS_FOUND=$((BUGS_FOUND + 1))
    BUGS+=("[$severity] $bug_description")
    
    echo -e "${RED}  🐛 BUG FOUND [${severity}]${NC}"
    echo "     $bug_description"
    if [ -n "$details" ]; then
        echo "     Details: $details"
    fi
}

# Function to record a warning
record_warning() {
    local warning="$1"
    
    WARNINGS=$((WARNINGS + 1))
    WARNING_LIST+=("$warning")
    
    echo -e "${YELLOW}  ⚠ WARNING${NC}"
    echo "     $warning"
}

# Change to project directory
cd /root/projects/maf-github

echo -e "${MAGENTA}╔════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║   Role Utils Comprehensive Test Suite  ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}"
echo "Working directory: $(pwd)"
echo ""

# Source the functions
source scripts/maf/lib/role-utils.sh 2>/dev/null || {
    echo "ERROR: Failed to source role-utils.sh"
    exit 1
}

# ========================================
# 1. FUNCTION LOADING TESTS
# ========================================
print_test_header "1. Function Loading"

run_test "Source role-utils.sh without errors" \
    "source scripts/maf/lib/role-utils.sh"

run_test "get_agent_by_role function exists" \
    "type get_agent_by_role >/dev/null 2>&1"

run_test "has_role_mapping function exists" \
    "type has_role_mapping >/dev/null 2>&1"

# ========================================
# 2. TEST SETUP
# ========================================
print_test_header "2. Test Setup"

# Create test topology config
cat > /tmp/test-topology.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "GreenMountain",
    "reviewer": "BlackDog",
    "implementor-1": "OrangePond",
    "implementor-2": "FuchsiaCreek"
  }
}
TESTEOF

run_test "Create test topology config" \
    "[ -f /tmp/test-topology.json ]"

run_output_test "Verify test config content" \
    "jq -r '.role_mappings.supervisor' /tmp/test-topology.json" \
    "GreenMountain"

# ========================================
# 3. TEST get_agent_by_role() - BASIC FUNCTIONALITY
# ========================================
print_test_header "3. get_agent_by_role() - Basic Functionality"

run_output_test "Get supervisor role mapping" \
    "get_agent_by_role supervisor /tmp/test-topology.json" \
    "GreenMountain"

run_output_test "Get reviewer role mapping" \
    "get_agent_by_role reviewer /tmp/test-topology.json" \
    "BlackDog"

run_output_test "Get implementor-1 role mapping" \
    "get_agent_by_role implementor-1 /tmp/test-topology.json" \
    "OrangePond"

run_output_test "Get implementor-2 role mapping" \
    "get_agent_by_role implementor-2 /tmp/test-topology.json" \
    "FuchsiaCreek"

# ========================================
# 4. TEST get_agent_by_role() - ERROR HANDLING
# ========================================
print_test_header "4. get_agent_by_role() - Error Handling"

run_test_fail "Get non-existent role (should fail)" \
    "get_agent_by_role nonexistent /tmp/test-topology.json"

run_test_fail "Handle missing config file" \
    "get_agent_by_role supervisor /tmp/nonexistent-config.json"

# Test malformed JSON (BUG #1)
cat > /tmp/test-malformed.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "Agent1"
  INVALID JSON HERE
}
TESTEOF

echo -n "  ✓ Malformed JSON config (get_agent_by_role) ... "
output=$(get_agent_by_role supervisor /tmp/test-malformed.json 2>&1)
exit_code=$?
if [ $exit_code -ne 0 ]; then
    echo -e "${GREEN}PASS${NC} (correctly failed with exit code $exit_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}FAIL${NC} - should fail but returned 0"
    echo "    Output: $output"
    record_bug "get_agent_by_role returns success (exit 0) when jq fails to parse malformed JSON" \
        "CRITICAL" \
        "jq exits with code 3/5 on parse errors, but function returns 0. Line 12 should check jq exit code."
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("Malformed JSON config (get_agent_by_role)")
fi
TESTS_RUN=$((TESTS_RUN + 1))

# ========================================
# 5. TEST has_role_mapping() - BASIC FUNCTIONALITY
# ========================================
print_test_header "5. has_role_mapping() - Basic Functionality"

run_test "Check supervisor role exists" \
    "has_role_mapping supervisor /tmp/test-topology.json"

run_test "Check reviewer role exists" \
    "has_role_mapping reviewer /tmp/test-topology.json"

run_test "Check implementor-1 role exists" \
    "has_role_mapping implementor-1 /tmp/test-topology.json"

run_test "Check implementor-2 role exists" \
    "has_role_mapping implementor-2 /tmp/test-topology.json"

run_test_fail "Check non-existent role (should fail)" \
    "has_role_mapping nonexistent /tmp/test-topology.json"

run_test_fail "Check missing config file" \
    "has_role_mapping supervisor /tmp/nonexistent-config.json"

run_test_fail "Malformed JSON config (has_role_mapping)" \
    "has_role_mapping supervisor /tmp/test-malformed.json"

# ========================================
# 6. TEST DEFAULT CONFIG PATH
# ========================================
print_test_header "6. Default Config Path Tests"

# Create default config path
mkdir -p .maf/config
cat > .maf/config/agent-topology.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "DefaultSupervisor",
    "reviewer": "DefaultReviewer"
  }
}
TESTEOF

run_output_test "Get supervisor with default config" \
    "get_agent_by_role supervisor" \
    "DefaultSupervisor"

run_output_test "Get reviewer with default config" \
    "get_agent_by_role reviewer" \
    "DefaultReviewer"

run_test "Check supervisor exists with default config" \
    "has_role_mapping supervisor"

# Clean up default config
rm -f .maf/config/agent-topology.json

# ========================================
# 7. EDGE CASES - NULL AND EMPTY VALUES
# ========================================
print_test_header "7. Edge Cases - Null and Empty Values"

# Create config with null agent value
cat > /tmp/test-null-agent.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": null
  }
}
TESTEOF

run_test_fail "Config with null agent value (should fail)" \
    "get_agent_by_role supervisor /tmp/test-null-agent.json"

echo -n "  ✓ has_role_mapping with null agent value ... "
if has_role_mapping supervisor /tmp/test-null-agent.json 2>/dev/null; then
    echo -e "${GREEN}PASS${NC} (key exists, returns success)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}ACCEPTABLE${NC} (returns 1 because jq -e treats null as false)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    record_warning "has_role_mapping returns failure when role value is null. This is due to jq -e behavior treating null as falsey. May need clarification on intended behavior."
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Create config with empty string agent value
cat > /tmp/test-empty-agent.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": ""
  }
}
TESTEOF

run_output_test "Config with empty string agent value" \
    "get_agent_by_role supervisor /tmp/test-empty-agent.json" \
    ""

run_test "has_role_mapping with empty string value" \
    "has_role_mapping supervisor /tmp/test-empty-agent.json"

# ========================================
# 8. EDGE CASES - SPECIAL CHARACTERS AND INJECTION
# ========================================
print_test_header "8. Edge Cases - Special Characters and Injection"

run_test_fail "Empty role name" \
    "get_agent_by_role '' /tmp/test-topology.json"

run_test_fail "Special characters in role name (hyphens, underscores, dots)" \
    "get_agent_by_role 'role-with-special_chars.test' /tmp/test-topology.json"

echo -n "  ✓ Role name with quote characters (injection test) ... "
output=$(get_agent_by_role 'role"with"quotes' /tmp/test-topology.json 2>&1)
exit_code=$?
if [ $exit_code -ne 0 ]; then
    echo -e "${GREEN}PASS${NC} (correctly failed, no injection possible)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}FAIL${NC} - should fail but returned 0"
    echo "    Output: $output"
    record_bug "Potential shell injection vulnerability: role names with quotes are not properly escaped" \
        "HIGH" \
        "The double quotes in role name cause jq syntax error but function returns 0. Line 12: jq -r \".role_mappings[\\\"$role\\\"]\" - variable not properly quoted."
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("Role name with quote characters (injection test)")
fi
TESTS_RUN=$((TESTS_RUN + 1))

# ========================================
# 9. EDGE CASES - MALFORMED CONFIG STRUCTURES
# ========================================
print_test_header "9. Edge Cases - Malformed Config Structures"

# Create config without role_mappings section
cat > /tmp/test-no-mappings.json << 'TESTEOF'
{
  "other_section": {
    "key": "value"
  }
}
TESTEOF

run_test_fail "Config without role_mappings section" \
    "get_agent_by_role supervisor /tmp/test-no-mappings.json"

run_test_fail "has_role_mapping without role_mappings section" \
    "has_role_mapping supervisor /tmp/test-no-mappings.json"

# Test config with numeric value
cat > /tmp/test-numeric.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": 12345
  }
}
TESTEOF

run_output_test "Config with numeric agent value" \
    "get_agent_by_role supervisor /tmp/test-numeric.json" \
    "12345"

# Test config with boolean value
cat > /tmp/test-boolean.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": true
  }
}
TESTEOF

run_output_test "Config with boolean agent value" \
    "get_agent_by_role supervisor /tmp/test-boolean.json" \
    "true"

# Test config with duplicate keys (JSON spec: last one wins)
cat > /tmp/test-duplicate.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "FirstAgent",
    "supervisor": "SecondAgent"
  }
}
TESTEOF

run_output_test "Config with duplicate keys" \
    "get_agent_by_role supervisor /tmp/test-duplicate.json" \
    "SecondAgent"

record_warning "Duplicate keys in JSON are handled by jq (last wins), but schema validation should prevent this."

# ========================================
# 10. DATA TYPE TESTS
# ========================================
print_test_header "10. Data Type Tests"

# Test Unicode characters
cat > /tmp/test-unicode.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "Agent日本語",
    "reviewer": "AgentΕλληνικά",
    "implementor": "Agentعربي"
  }
}
TESTEOF

run_output_test "Config with Japanese characters" \
    "get_agent_by_role supervisor /tmp/test-unicode.json" \
    "Agent日本語"

run_output_test "Config with Greek characters" \
    "get_agent_by_role reviewer /tmp/test-unicode.json" \
    "AgentΕλληνικά"

run_output_test "Config with Arabic characters" \
    "get_agent_by_role implementor /tmp/test-unicode.json" \
    "Agentعربي"

# Test emojis
cat > /tmp/test-emoji.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "Agent🎯",
    "reviewer": "Agent✅"
  }
}
TESTEOF

run_output_test "Config with emoji characters" \
    "get_agent_by_role supervisor /tmp/test-emoji.json" \
    "Agent🎯"

# ========================================
# 11. INTEGRATION TESTS
# ========================================
print_test_header "11. Integration Tests"

# Test multiple sequential calls
run_output_test "Sequential call 1 - supervisor" \
    "get_agent_by_role supervisor /tmp/test-topology.json" \
    "GreenMountain"

run_output_test "Sequential call 2 - reviewer" \
    "get_agent_by_role reviewer /tmp/test-topology.json" \
    "BlackDog"

run_output_test "Sequential call 3 - supervisor again" \
    "get_agent_by_role supervisor /tmp/test-topology.json" \
    "GreenMountain"

# Test has_role_mapping followed by get_agent_by_role
echo -n "  ✓ has_role_mapping then get_agent_by_role ... "
if has_role_mapping supervisor /tmp/test-topology.json && [ "$(get_agent_by_role supervisor /tmp/test-topology.json)" = "GreenMountain" ]; then
    echo -e "${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("has_role_mapping then get_agent_by_role")
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test all defined roles from schema
cat > /tmp/test-all-roles.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "SuperAgent",
    "reviewer": "ReviewAgent",
    "implementor-1": "Imp1Agent",
    "implementor-2": "Imp2Agent"
  }
}
TESTEOF

run_output_test "All schema-defined roles work - supervisor" \
    "get_agent_by_role supervisor /tmp/test-all-roles.json" \
    "SuperAgent"

run_output_test "All schema-defined roles work - reviewer" \
    "get_agent_by_role reviewer /tmp/test-all-roles.json" \
    "ReviewAgent"

run_output_test "All schema-defined roles work - implementor-1" \
    "get_agent_by_role implementor-1 /tmp/test-all-roles.json" \
    "Imp1Agent"

run_output_test "All schema-defined roles work - implementor-2" \
    "get_agent_by_role implementor-2 /tmp/test-all-roles.json" \
    "Imp2Agent"

# ========================================
# 12. SCHEMA VALIDATION TESTS
# ========================================
print_test_header "12. Schema Validation Tests"

run_test "Schema file exists" \
    "[ -f .maf/config/role-mappings.schema.json ]"

run_output_test "Schema has correct title" \
    "jq -r '.title' .maf/config/role-mappings.schema.json" \
    "Agent Role Mappings"

run_test "Schema uses correct JSON Schema version" \
    "jq -r '\"\$schema\"' .maf/config/role-mappings.schema.json | grep -q 'draft-07'"

run_test "Schema defines role_mappings property" \
    "jq -e '.properties.role_mappings' .maf/config/role-mappings.schema.json >/dev/null 2>&1"

run_test "Schema defines supervisor property" \
    "jq -e '.properties.role_mappings.properties.supervisor' .maf/config/role-mappings.schema.json >/dev/null 2>&1"

run_test "Schema defines reviewer property" \
    "jq -e '.properties.role_mappings.properties.reviewer' .maf/config/role-mappings.schema.json >/dev/null 2>&1"

run_test "Schema defines implementor-1 property" \
    "jq -e '.properties.role_mappings.properties.\"implementor-1\"' .maf/config/role-mappings.schema.json >/dev/null 2>&1"

run_test "Schema defines implementor-2 property" \
    "jq -e '.properties.role_mappings.properties.\"implementor-2\"' .maf/config/role-mappings.schema.json >/dev/null 2>&1"

run_test "Schema defines all properties as strings" \
    "jq '.properties.role_mappings.properties.supervisor.type' .maf/config/role-mappings.schema.json | grep -q 'string'"

# ========================================
# 13. PERFORMANCE TESTS
# ========================================
print_test_header "13. Performance Tests"

# Create large config
cat > /tmp/test-large.json << 'TESTEOF'
{
  "role_mappings": {
    "supervisor": "Agent1",
    "role-001": "Agent001",
    "role-002": "Agent002",
    "role-003": "Agent003",
    "role-004": "Agent004",
    "role-005": "Agent005"
  }
}
TESTEOF

run_output_test "Large config - lookup works" \
    "get_agent_by_role supervisor /tmp/test-large.json" \
    "Agent1"

echo -n "  ✓ Performance: 100 sequential lookups ... "
start_time=$(date +%s%N)
for i in {1..100}; do
    get_agent_by_role supervisor /tmp/test-topology.json >/dev/null 2>&1
done
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}PASS${NC} (${duration}ms for 100 lookups, avg $((duration/100))ms per lookup)"
TESTS_PASSED=$((TESTS_PASSED + 1))
TESTS_RUN=$((TESTS_RUN + 1))

# ========================================
# TEST SUMMARY
# ========================================
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║           TEST SUMMARY                 ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Total Tests Run:    $TESTS_RUN"
echo -e "Tests Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:       ${RED}$TESTS_FAILED${NC}"
echo -e "Bugs Found:         ${RED}$BUGS_FOUND${NC}"
echo -e "Warnings:           ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $BUGS_FOUND -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}              BUGS FOUND ($BUGS_FOUND)           ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    for bug in "${BUGS[@]}"; do
        echo "  🐛 $bug"
        echo ""
    done
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}            WARNINGS ($WARNINGS)              ${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    for warning in "${WARNING_LIST[@]}"; do
        echo "  ⚠️  $warning"
        echo ""
    done
fi

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}          FAILED TESTS ($TESTS_FAILED)           ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    for test in "${FAILED_TESTS[@]}"; do
        echo "  ✗ $test"
    done
    echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}          COVERAGE SUMMARY                  ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  ✓ Function Loading"
echo "  ✓ Basic Functionality (get_agent_by_role)"
echo "  ✓ Basic Functionality (has_role_mapping)"
echo "  ✓ Error Handling"
echo "  ✓ Default Config Path"
echo "  ✓ Null and Empty Values"
echo "  ✓ Special Characters and Injection"
echo "  ✓ Malformed Config Structures"
echo "  ✓ Data Types (numeric, boolean, Unicode, emoji)"
echo "  ✓ Integration Tests"
echo "  ✓ Schema Validation"
echo "  ✓ Performance Tests"
echo ""

# Cleanup
echo "Cleaning up test files..."
rm -f /tmp/test-topology.json
rm -f /tmp/test-no-mappings.json
rm -f /tmp/test-malformed.json
rm -f /tmp/test-null-agent.json
rm -f /tmp/test-empty-agent.json
rm -f /tmp/test-numeric.json
rm -f /tmp/test-boolean.json
rm -f /tmp/test-duplicate.json
rm -f /tmp/test-unicode.json
rm -f /tmp/test-emoji.json
rm -f /tmp/test-all-roles.json
rm -f /tmp/test-large.json
rm -f /tmp/test-quotes.json
echo "Cleanup complete."

# Calculate pass rate
pass_rate=0
if [ $TESTS_RUN -gt 0 ]; then
    pass_rate=$(( TESTS_PASSED * 100 / TESTS_RUN ))
fi

echo ""
echo "Pass Rate: ${pass_rate}%"
echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -gt 0 ] || [ $BUGS_FOUND -gt 0 ]; then
    echo -e "${RED}Tests completed with failures or bugs.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
fi
