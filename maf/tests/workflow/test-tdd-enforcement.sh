#!/bin/bash
# Test TDD enforcement functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: TDD enforcer module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/tdd_enforcer.py"
echo "TDD enforcer module exists"

# Test: TDD prompt template exists
test -f "$PROJECT_ROOT/maf/templates/prompts/implementor-tdd.md"
echo "TDD prompt template exists"

# Test: TDD check command exists
test -x "$PROJECT_ROOT/maf/scripts/maf/tdd-check.sh"
echo "TDD check command exists"

# Test: TDD enforcer is importable
python3 <<'PYTHON'
import sys
sys.path.append('/root/projects/maf-github')
from maf.scripts.maf.lib.tdd_enforcer import TDDEnforcer

enforcer = TDDEnforcer("/root/projects/maf-github")
assert enforcer.project_root is not None
print("TDD enforcer instantiable")
PYTHON

echo "All TDD enforcement tests passed"
