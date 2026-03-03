#!/bin/bash
# Test mail polling functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: Python poller module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/mail_poller.py"
echo "Mail poller module exists"

# Test: Poller module is importable
python3 -c "import sys; sys.path.append('$PROJECT_ROOT'); import maf.scripts.maf.lib.mail_poller" 2>/dev/null
echo "Mail poller module imports"

# Test: Poller script is executable
test -x "$PROJECT_ROOT/maf/scripts/maf/poll-agent-mail.sh"
echo "Poller script executable"

# Test: Can create poller instance
python3 <<'PYTHON'
import sys
sys.path.append('/root/projects/maf-github')
from maf.scripts.maf.lib.mail_poller import AgentMailPoller

poller = AgentMailPoller("TestAgent", "/root/projects/maf-github/.maf/config/agent-topology.json")
assert poller.agent_name == "TestAgent"
assert poller.polling_interval == 10
print("Poller instantiable")
PYTHON

echo "All mail polling tests passed"
