#!/bin/bash
# Test two-stage review functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: Reviewer module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/reviewer.py"
echo "Reviewer module exists"

# Test: Reviewer prompt template exists
test -f "$PROJECT_ROOT/maf/templates/prompts/reviewer-two-stage.md"
echo "Reviewer prompt template exists"

# Test: Review command exists
test -x "$PROJECT_ROOT/maf/scripts/maf/review-bead.sh"
echo "Review command exists"

# Test: Reviewer is importable
python3 <<'PYTHON'
import sys
sys.path.append('/root/projects/maf-github')
from maf.scripts.maf.lib.reviewer import TwoStageReviewer

reviewer = TwoStageReviewer("/root/projects/maf-github")
assert reviewer.project_root is not None
print("Reviewer instantiable")
PYTHON

echo "All two-stage review tests passed"
