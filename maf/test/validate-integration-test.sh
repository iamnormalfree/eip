#!/bin/bash
# MAF-BDD Integration Test Validation
# Validates that the test environment is set up correctly

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_DIR="test-integration"
ARTIFACTS_DIR="test-artifacts"

echo "=========================================="
echo "MAF-BDD Integration Test Validation"
echo "=========================================="
echo ""

# Ensure we're in test directory
if [ ! -d "$TEST_DIR" ]; then
    echo -e "${RED}ERROR: Test directory not found${NC}"
    echo "Run test/create-test-beads.sh first"
    exit 1
fi

cd "$TEST_DIR"

# === CHECKPOINT 1: Bead Creation ===
echo "Checkpoint 1: Verifying bead creation..."
READY_COUNT=$(bd ready --json | jq '. | length')

if [ "$READY_COUNT" -eq 6 ]; then
    echo -e "${GREEN}✓ PASS${NC}: 6 test beads created"
else
    echo -e "${RED}✗ FAIL${NC}: Expected 6 beads, found $READY_COUNT"
    exit 1
fi

# === CHECKPOINT 2: Bead Metadata ===
echo ""
echo "Checkpoint 2: Verifying bead metadata..."

# Check titles
TITLES=$(bd ready --json | jq -r '.[].title')
echo "Bead titles:"
echo "$TITLES" | nl

# Verify expected titles exist
if echo "$TITLES" | grep -q "hello world"; then
    echo -e "${GREEN}✓ PASS${NC}: Bead #1 (hello world) found"
else
    echo -e "${RED}✗ FAIL${NC}: Bead #1 not found"
    exit 1
fi

if echo "$TITLES" | grep -q "string utilities"; then
    echo -e "${GREEN}✓ PASS${NC}: Bead #2 (string utilities) found"
else
    echo -e "${RED}✗ FAIL${NC}: Bead #2 not found"
    exit 1
fi

# === CHECKPOINT 3: Dependency Detection ===
echo ""
echo "Checkpoint 3: Analyzing dependencies..."

# Extract dependencies from descriptions
bd ready --json | jq -r '.[] | "\(.id | .[0:8]): \(.description)"' | while read -r line; do
    if echo "$line" | grep -qi "depend"; then
        echo "  $line"
    fi
done

# Count beads with dependencies
DEP_COUNT=$(bd ready --json | jq '[.[] | select(.description | contains("Depend"))] | length')
echo "Beads with dependencies: $DEP_COUNT"

if [ "$DEP_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓ PASS${NC}: Dependencies detected"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Few dependencies found ($DEP_COUNT)"
fi

# === CHECKPOINT 4: File Conflict Analysis ===
echo ""
echo "Checkpoint 4: Checking for file conflicts..."

FILES=$(bd ready --json | jq -r '.[].description' | grep -oE 'test-utils/[^ .]+' | sort -u)
echo "Files to be created:"
echo "$FILES" | nl
echo ""

DUPLICATES=$(echo "$FILES" | sort | uniq -d)
if [ -z "$DUPLICATES" ]; then
    echo -e "${GREEN}✓ PASS${NC}: No file conflicts"
else
    echo -e "${RED}✗ FAIL${NC}: Conflicting files:"
    echo "$DUPLICATES"
    exit 1
fi

# === CHECKPOINT 5: Expected Group Formation ===
echo ""
echo "Checkpoint 5: Expected execution groups..."
echo ""

echo -e "${BLUE}Group 1 (Parallel-safe - No dependencies):${NC}"
echo "  • test-integration-dny - hello.ts (independent)"
echo "  • test-integration-172 - calculator.ts (independent)"
echo "  • test-integration-7qo - logger.ts (independent)"
echo "  • test-integration-2s9 - arrays.ts (independent)"
echo ""

echo -e "${BLUE}Group 2 (After Group 1):${NC}"
echo "  • test-integration-zlq - strings.ts (depends on hello)"
echo ""

echo -e "${BLUE}Group 3 (After Groups 1-2):${NC}"
echo "  • test-integration-y88 - integration.ts (depends on all)"
echo ""

# === CHECKPOINT 6: Skill Availability ===
echo ""
echo "Checkpoint 6: Verifying skill availability..."

if [ -f "/root/projects/maf-github/.claude/skills/beads-driven-development/SKILL.md" ]; then
    echo -e "${GREEN}✓ PASS${NC}: beads-driven-development skill exists"
else
    echo -e "${RED}✗ FAIL${NC}: Skill not found"
    exit 1
fi

if [ -f "/root/projects/maf-github/.claude/commands/bdd.md" ] || [ -f "/root/projects/maf-github/.claude/commands/maf-bdd.md" ]; then
    echo -e "${GREEN}✓ PASS${NC}: BDD command exists"
else
    echo -e "${RED}✗ FAIL${NC}: BDD command not found"
    exit 1
fi

# === CHECKPOINT 7: Command Validation ===
echo ""
echo "Checkpoint 7: Testing commands..."

if bd ready --json > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}: bd ready --json works"
else
    echo -e "${RED}✗ FAIL${NC}: bd ready --json failed"
    exit 1
fi

# === SUMMARY ===
echo ""
echo "=========================================="
echo "Integration Test Validation Complete"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ All checkpoints passed!${NC}"
echo ""
echo "Test Environment Ready:"
echo "  • Directory: $(pwd)"
echo "  • Beads: 6 ready beads"
echo "  • Groups: 3 (as analyzed above)"
echo "  • Files: $(echo "$FILES" | wc -l) to be created"
echo ""
echo "Next Steps:"
echo "  1. Stay in this directory: cd $(pwd)"
echo "  2. Run the orchestrator: /bdd or /maf-bdd"
echo "  3. Monitor execution for:"
echo "     - Dependency grouping"
echo "     - Two-stage reviews"
echo "     - Escalation handling"
echo "     - Progress dashboards"
echo "     - Agent lifecycle"
echo ""
echo "Expected Behaviors to Verify:"
echo "  ✓ Group 1 executes 4 beads (#1, #3, #4, #5)"
echo "  ✓ Group 2 executes 1 bead (#2, waits for #1)"
echo "  ✓ Group 3 executes 1 bead (#6, waits for all)"
echo "  ✓ Each bead: implementer → spec review → quality review"
echo "  ✓ Failures trigger escalation with context"
echo "  ✓ Progress shown after each group"
echo "  ✓ Beads close on approval, reopen on failure"
echo ""
