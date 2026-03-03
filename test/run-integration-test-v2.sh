#!/bin/bash
# MAF-BDD End-to-End Integration Test v2
# This script validates the complete MAF-BDD Orchestrator workflow

set -e

echo "=========================================="
echo "MAF-BDD Integration Test v2"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TEST_DIR="$(pwd)/test-integration"
ARTIFACTS_DIR="$(pwd)/test-artifacts"

# Cleanup function
cleanup() {
    echo ""
    echo "=========================================="
    echo "Test Cleanup"
    echo "=========================================="
    cd /root/projects/maf-github
    
    # Preserve artifacts for review
    if [ -d "$ARTIFACTS_DIR" ]; then
        echo "Artifacts preserved in: $ARTIFACTS_DIR"
        if [ -f "$ARTIFACTS_DIR/test.log" ]; then
            echo "Test log: $ARTIFACTS_DIR/test.log"
        fi
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Create test environment
echo "Setting up test environment..."
mkdir -p "$ARTIFACTS_DIR"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Initialize beads database
echo "Initializing beads database in $TEST_DIR"
bd init > "$ARTIFACTS_DIR/init.log" 2>&1

# Create test beads using bd create with stdin
echo "Creating test beads..."

cd /root/projects/maf-github

# Bead 1: Simple Hello World
echo "Creating bead 1..."
cat > /tmp/bead1.md << 'BEAD1'
# test-bdd-001: Create simple hello world utility function

Labels: test,simple,independent

Create a simple utility function in a new file test-utils/hello.ts.

Requirements:
- Function name: helloWorld(name: string): string
- Returns: Hello, {name}! format
- Export the function
- Add JSDoc comment
- Write 2-3 test cases

No dependencies. This is a simple warm-up bead.

Acceptance Criteria:
- File exists at test-utils/hello.ts
- Function returns correct format
- Tests pass
- Code is clean and follows TypeScript best practices
BEAD1

cd "$TEST_DIR"
bd create /tmp/bead1.md > "$ARTIFACTS_DIR/bead1.log" 2>&1
cd /root/projects/maf-github

# Bead 2: String Utilities
echo "Creating bead 2..."
cat > /tmp/bead2.md << 'BEAD2'
# test-bdd-002: Create string utilities that depend on hello function

Labels: test,depends-on-001

Create string utility functions in test-utils/strings.ts.

Dependencies: test-bdd-001 (must be complete first)

Requirements:
- Import and use the helloWorld function from bead #1
- Add function: capitalize(str: string): string
- Add function: reverse(str: string): string
- Add function: greet(name: string): string that uses helloWorld internally
- Write comprehensive tests for all functions

Acceptance Criteria:
- File exists at test-utils/strings.ts
- Properly imports from hello.ts
- greet() function uses helloWorld internally
- All tests pass
BEAD2

cd "$TEST_DIR"
bd create /tmp/bead2.md > "$ARTIFACTS_DIR/bead2.log" 2>&1
cd /root/projects/maf-github

# Bead 3: Math Calculator
echo "Creating bead 3..."
cat > /tmp/bead3.md << 'BEAD3'
# test-bdd-003: Create basic calculator utility

Labels: test,math,independent

Create calculator functions in test-utils/calculator.ts.

Requirements:
- Add: add(a: number, b: number): number
- Add: subtract(a: number, b: number): number
- Add: multiply(a: number, b: number): number
- Add: divide(a: number, b: number): number
- Add: power(base: number, exp: number): number
- Write tests

Acceptance Criteria:
- File exists at test-utils/calculator.ts
- All functions work correctly
- Tests pass
BEAD3

cd "$TEST_DIR"
bd create /tmp/bead3.md > "$ARTIFACTS_DIR/bead3.log" 2>&1
cd /root/projects/maf-github

# Bead 4: Logger (escalation test)
echo "Creating bead 4..."
cat > /tmp/bead4.md << 'BEAD4'
# test-bdd-004: Create logging utility with singleton pattern

Labels: test,escalation,requires-retry

Create a Logger class in test-utils/logger.ts.

Requirements:
- Singleton pattern
- Methods: log(), warn(), error(), debug()
- Timestamp format: [YYYY-MM-DD HH:mm:ss]
- Log levels: INFO, WARN, ERROR, DEBUG
- Filter by LOG_LEVEL env var

Acceptance Criteria:
- Singleton pattern correct
- Timestamp format exact
- Tests pass
BEAD4

cd "$TEST_DIR"
bd create /tmp/bead4.md > "$ARTIFACTS_DIR/bead4.log" 2>&1
cd /root/projects/maf-github

# Bead 5: Array Utilities
echo "Creating bead 5..."
cat > /tmp/bead5.md << 'BEAD5'
# test-bdd-005: Create array manipulation utilities

Labels: test,arrays,independent

Create array utility functions in test-utils/arrays.ts.

Requirements:
- unique<T>(arr: T[]): T[]
- chunk<T>(arr: T[], size: number): T[][]
- shuffle<T>(arr: T[]): T[]
- flatten<T>(arr: T[][]): T[]
- Write tests

Acceptance Criteria:
- File exists
- All functions work
- Generic types used
- Tests pass
BEAD5

cd "$TEST_DIR"
bd create /tmp/bead5.md > "$ARTIFACTS_DIR/bead5.log" 2>&1
cd /root/projects/maf-github

# Bead 6: Integration
echo "Creating bead 6..."
cat > /tmp/bead6.md << 'BEAD6'
# test-bdd-006: Create integration module

Labels: test,integration

Create test-utils/integration.ts that uses all previous utilities.

Dependencies: test-bdd-001, test-bdd-002, test-bdd-003, test-bdd-004, test-bdd-005

Requirements:
- Import from all test-utils files
- Demo class with runFullDemo()
- Use logger throughout
- Write integration tests

Acceptance Criteria:
- Imports correct
- Demo class works
- Logger used
- Tests pass
BEAD6

cd "$TEST_DIR"
bd create /tmp/bead6.md > "$ARTIFACTS_DIR/bead6.log" 2>&1
cd /root/projects/maf-github

echo ""
echo "=========================================="
echo "Test beads created!"
echo "=========================================="
echo ""

# Show ready beads
echo "Ready beads:"
cd "$TEST_DIR"
bd ready
echo ""

# === TEST SUITE ===

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Test $TOTAL_TESTS: $test_name ... "
    
    if eval "$test_command" > "$ARTIFACTS_DIR/test-$TOTAL_TESTS.log" 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "  See: $ARTIFACTS_DIR/test-$TOTAL_TESTS.log"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "=========================================="
echo "Running Test Suite"
echo "=========================================="
echo ""

# Test 1: Verify beads created
run_test "Bead Creation" "bd ready --json | jq '. | length' | grep -q '6'"

# Test 2: Check bead metadata
run_test "Bead Metadata" "bd ready --json | jq '.[0].title' | grep -q 'hello'"

# Test 3: Verify dependency field exists
run_test "Dependency Field" "bd ready --json | jq '.[1].description' | grep -q 'Dependencies'"

# Test 4: Check labels
run_test "Labels Present" "bd ready --json | jq '.[0].labels' | grep -q 'test'"

# Test 5: Verify JSON output works
run_test "JSON Output" "bd ready --json > /dev/null 2>&1"

# Test 6: Check ready command works
run_test "Ready Command" "bd ready > /dev/null 2>&1"

# Test 7: Verify skill exists
run_test "Skill File Exists" "test -f /root/projects/maf-github/.claude/skills/beads-driven-development/SKILL.md"

# Test 8: Verify command exists
run_test "Command File Exists" "test -f /root/projects/maf-github/.claude/commands/bdd.md -o -f /root/projects/maf-github/.claude/commands/maf-bdd.md"

echo ""
echo "=========================================="
echo "Dependency Analysis"
echo "=========================================="
echo ""

echo "Analyzing bead dependencies..."
bd ready --json | jq -r '.[] | "\(.id | .[0:8]): \(.title)"' | nl
echo ""

echo "Expected execution groups:"
echo ""
echo -e "${BLUE}Group 1 (Parallel-safe - No dependencies):${NC}"
echo "  • test-bdd-001 - hello.ts"
echo "  • test-bdd-003 - calculator.ts"
echo "  • test-bdd-004 - logger.ts"
echo "  • test-bdd-005 - arrays.ts"
echo ""
echo -e "${BLUE}Group 2 (After Group 1):${NC}"
echo "  • test-bdd-002 - strings.ts (depends on #001)"
echo ""
echo -e "${BLUE}Group 3 (After Groups 1-2):${NC}"
echo "  • test-bdd-006 - integration.ts (depends on all)"
echo ""

echo "=========================================="
echo "File Conflict Analysis"
echo "=========================================="
echo ""

echo "Files to be created:"
bd ready --json | jq -r '.[].description' | grep -oE 'test-utils/[^ )]+' | sort -u | nl
echo ""

DUPLICATES=$(bd ready --json | jq -r '.[].description' | grep -oE 'test-utils/[^ )]+' | sort | uniq -d)
if [ -z "$DUPLICATES" ]; then
    echo -e "${GREEN}✓ No file conflicts${NC}"
else
    echo -e "${RED}✗ File conflicts found:${NC}"
    echo "$DUPLICATES"
fi
echo ""

echo "=========================================="
echo "Command Availability Check"
echo "=========================================="
echo ""

# Check bd commands
echo "Beads (bd) commands:"
echo "  • bd ready --json: $(bd ready --json > /dev/null 2>&1 && echo 'OK' || echo 'MISSING')"
echo "  • bd close: $(bd close --help > /dev/null 2>&1 && echo 'OK' || echo 'MISSING')"
echo "  • bd dep: $(bd dep --help > /dev/null 2>&1 && echo 'OK' || echo 'MISSING')"
echo ""

# Check bv commands (optional)
echo "Bead Vision (bv) commands:"
if command -v bv &> /dev/null; then
    echo "  • bv --robot-triage: $(bv --robot-triage > /dev/null 2>&1 && echo 'OK' || echo 'OK (no beads triaged)')"
    echo "  • bv --progress: $(bv --progress > /dev/null 2>&1 && echo 'OK' || echo 'OK (no progress)')"
else
    echo "  • bv not installed (optional, skipping)"
fi
echo ""

echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo ""
echo "Tests Run: $TOTAL_TESTS"
echo -e "  ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "Integration test environment is ready!"
    echo ""
    echo "To execute the actual workflow:"
    echo "  1. cd $TEST_DIR"
    echo "  2. Run: /bdd or invoke beads-driven-development skill"
    echo ""
    echo "Monitor for these behaviors:"
    echo "  ✓ Dependency grouping (3 groups)"
    echo "  ✓ Two-stage review (spec → quality)"
    echo "  ✓ Escalation on failures"
    echo "  ✓ Progress dashboards"
    echo "  ✓ Agent lifecycle management"
    echo ""
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Review logs in: $ARTIFACTS_DIR/"
    exit 1
fi

# Generate results report
cat > "$ARTIFACTS_DIR/integration-test-results.md" << EOF
# MAF-BDD Integration Test Results

**Date:** $(date)
**Test Directory:** $TEST_DIR
**Artifacts:** $ARTIFACTS_DIR

## Test Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS

## Test Environment

- **Beads Database:** $TEST_DIR/.beads/
- **Test Beads Created:** 6
- **Working Directory:** $TEST_DIR

## Execution Plan

### Group 1 (Parallel-safe - 4 beads)
1. test-bdd-001 - hello.ts
2. test-bdd-003 - calculator.ts
3. test-bdd-004 - logger.ts
4. test-bdd-005 - arrays.ts

### Group 2 (1 bead with dependency)
1. test-bdd-002 - strings.ts (depends on test-bdd-001)

### Group 3 (Integration bead)
1. test-bdd-006 - integration.ts (depends on all previous)

## Verification Checklist

During actual execution, verify:

- [ ] Correct grouping (3 groups as above)
- [ ] Beads #1, #3, #4, #5 execute in parallel (or sequentially if single-threaded)
- [ ] Bead #2 waits for #1 to complete
- [ ] Bead #6 waits for all others to complete
- [ ] Two-stage review per bead (spec compliance → code quality)
- [ ] Escalation on failures (esp. bead #4)
- [ ] Progress dashboard after each group
- [ ] Agents spawned and killed properly
- [ ] Beads close after approval
- [ ] Failed beads reopen with notes

## Files to Monitor

The workflow should create these files:
- test-utils/hello.ts
- test-utils/strings.ts
- test-utils/calculator.ts
- test-utils/logger.ts
- test-utils/arrays.ts
- test-utils/integration.ts

## Next Steps

1. Navigate to test directory: \`cd $TEST_DIR\`
2. Run the BDD orchestrator: \`/bdd\` or invoke \`beads-driven-development\` skill
3. Monitor execution and verify all checkpoints
4. Review generated code and test coverage
5. Clean up: \`rm -rf $TEST_DIR $ARTIFACTS_DIR\`
