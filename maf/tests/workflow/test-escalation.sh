#!/bin/bash
# Test escalation functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: Escalation module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py"
echo "Escalation module exists"

# Test: Escalation guidance template exists
test -f "$PROJECT_ROOT/maf/templates/prompts/escalation-guidance.md"
echo "Escalation guidance template exists"

# Test: Can record failure
python3 "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py" record "TEST-BEAD" "Test failure" --stage "stage1" >/dev/null
echo "Can record escalation failure"

# Test: Can get context
python3 "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py" context "TEST-BEAD" >/dev/null
echo "Can get escalation context"

# Test: Can reset
python3 "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py" reset "TEST-BEAD" >/dev/null
echo "Can reset escalation"

# Cleanup
rm -f /tmp/maf-escalation-state.json

echo "All escalation tests passed"
