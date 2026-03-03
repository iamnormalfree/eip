#!/bin/bash
# Integration test for 3-agent BDD workflow

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Running 3-Agent BDD Integration Tests"
echo "======================================"
echo ""

# Test: All modules exist
MODULES=(
  "maf/scripts/maf/lib/mail_poller.py"
  "maf/scripts/maf/lib/tdd_enforcer.py"
  "maf/scripts/maf/lib/reviewer.py"
  "maf/scripts/maf/lib/escalation.py"
  "maf/scripts/maf/lib/bv_integration.py"
)

for module in "${MODULES[@]}"; do
  test -f "$PROJECT_ROOT/$module"
  echo "Module exists: $module"
done

# Test: All templates exist
TEMPLATES=(
  "maf/templates/prompts/implementor-tdd.md"
  "maf/templates/prompts/reviewer-two-stage.md"
  "maf/templates/prompts/escalation-guidance.md"
)

for template in "${TEMPLATES[@]}"; do
  test -f "$PROJECT_ROOT/$template"
  echo "Template exists: $template"
done

# Test: All scripts executable
SCRIPTS=(
  "maf/scripts/maf/poll-agent-mail.sh"
  "maf/scripts/maf/tdd-check.sh"
  "maf/scripts/maf/review-bead.sh"
  "maf/scripts/maf/start-3agent-bdd.sh"
  "maf/scripts/maf/bdd-status.sh"
)

for script in "${SCRIPTS[@]}"; do
  test -x "$PROJECT_ROOT/$script"
  echo "Script executable: $script"
done

# Test: Workflow script exists and has BDD features
WORKFLOW_SCRIPT="$PROJECT_ROOT/maf/scripts/maf/autonomous-workflow-3agent-bdd.sh"
test -f "$WORKFLOW_SCRIPT"
echo "Workflow script exists"

grep -q "TDD" "$WORKFLOW_SCRIPT"
echo "Workflow mentions TDD"

grep -q "two-stage" "$WORKFLOW_SCRIPT"
echo "Workflow mentions two-stage review"

grep -q "escalation" "$WORKFLOW_SCRIPT"
echo "Workflow mentions escalation"

grep -q "poll.*mail" "$WORKFLOW_SCRIPT"
echo "Workflow mentions mail polling"

echo ""
echo "All integration tests passed!"
