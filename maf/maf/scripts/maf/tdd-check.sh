#!/bin/bash
# tdd-check.sh - Verify TDD workflow for current bead
# Usage: Run from implementor pane after implementing bead

set -euo pipefail

# Source preflight-gatekeeper.sh to get get_mail_name_by_role() function
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/preflight-gatekeeper.sh"

# Auto-detect project root (supports subtree installations)
if [[ "$SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

# Get current bead from bd
CURRENT_BEAD=$(bd current --id 2>/dev/null || echo "")

if [[ -z "$CURRENT_BEAD" ]]; then
  echo "❌ No active bead found. Start a bead with: bd start <bead-id>"
  exit 1
fi

echo "🔍 Checking TDD workflow for $CURRENT_BEAD..."
echo ""

# Run TDD enforcer
python3 "${SCRIPT_DIR}/lib/tdd_enforcer.py" "$CURRENT_BEAD" --project-root "$PROJECT_ROOT"
TDD_EXIT=$?

if [[ $TDD_EXIT -eq 0 ]]; then
  echo ""
  echo "✅ TDD workflow verified!"
  echo ""
  echo "You may now notify reviewer:"
  echo "  From: $(get_mail_name_by_role 'implementor')"
  echo "  To: $(get_mail_name_by_role 'reviewer')"
  echo "  Subject: [$CURRENT_BEAD] TDD Complete - Ready for Review"
  exit 0
else
  echo ""
  echo "❌ TDD workflow violations detected"
  echo ""
  echo "Fix the violations and run this check again."
  exit 1
fi
