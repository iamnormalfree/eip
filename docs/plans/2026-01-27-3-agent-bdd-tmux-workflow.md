# 3-Agent BDD TMUX Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build a 3-agent tmux workflow with full BDD discipline, active Agent Mail polling, and autonomous stage-gate transitions.

**Architecture:**
- 3 persistent agents in tmux (supervisor + reviewer + implementor)
- Agent Mail as workflow bus (all coordination via mail)
- Active mail polling (every 10s) for autonomous stage transitions
- TDD enforcement (write test → watch fail → implement → watch pass)
- Two-stage review (spec compliance → code quality)
- Escalation system (3 attempts with progressive guidance)
- BV integration (intelligent bead prioritization)
- Memory efficient (25% less than 4-agent model)

**Tech Stack:** Bash, tmux, jq, bd, Agent Mail MCP, preflight-gatekeeper.sh, Python (for mail polling logic)

**Key Difference from Simple 3-Agent:**
- Simple: Agents notify via mail, manual checking
- BDD: Agents poll mail autonomously, stage-gate workflow, quality enforcement

---

## Phase 1: Foundation - 3-Agent Topology (5 tasks)

### Task 1: Create 3-agent topology file

**Files:**
- Create: `maf/templates/agent-topology-3agent-bdd.json`

**Step 1: Write BDD-optimized topology**

```json
{
  "_comment": "3-Agent BDD topology: supervisor + reviewer + implementor with active mail polling",
  "$schema": "./agent-config-schema.json",
  "topology_name": "MAF 3-Agent BDD Workflow",
  "description": "3-agent topology with autonomous BDD discipline and active mail polling",
  "session_name": "maf-bdd",
  "version": "1.0.0",
  "pod": {
    "session": "maf-bdd",
    "window": "agents",
    "full_target": "maf-bdd:agents"
  },
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "SupervisorAgent",
      "mail_name": "OrangeDog",
      "agent_id": 4,
      "aliases": ["sup", "0"],
      "domains": ["coordination", "escalation", "audit", "bv-prioritization"],
      "description": "Coordinates workflow, handles escalations, runs BV triage, audits compliance"
    },
    {
      "index": 1,
      "role": "reviewer",
      "agent_name": "ReviewerAgent",
      "mail_name": "PurpleBear",
      "agent_id": 7,
      "aliases": ["rev", "1"],
      "domains": ["review", "validation", "qa", "stage-gate"],
      "description": "Two-stage review: spec compliance then code quality, polls for completion mail"
    },
    {
      "index": 2,
      "role": "implementor",
      "agent_name": "ImplementorAgent",
      "mail_name": "RedPond",
      "agent_id": 5,
      "aliases": ["imp", "2"],
      "domains": ["implementation", "tdd", "testing"],
      "description": "Implements beads following strict TDD: test → fail → code → pass, polls for review feedback"
    }
  ],
  "role_to_pane": {
    "supervisor": 0,
    "reviewer": 1,
    "implementor": 2
  },
  "alias_to_pane": {
    "sup": 0,
    "0": 0,
    "rev": 1,
    "1": 1,
    "imp": 2,
    "2": 2
  },
  "bdd_config": {
    "tdd_enforced": true,
    "two_stage_review": true,
    "escalation_max_attempts": 3,
    "mail_polling_interval_seconds": 10,
    "stage_timeout_minutes": 30
  },
  "worktrees": {
    "_schema": {
      "description": "Git worktree for implementor isolation",
      "properties": {
        "agent_name": "Implementor agent name",
        "path": "Absolute path to worktree",
        "branch": "Worktree branch name",
        "created_at": "ISO timestamp"
      }
    }
  }
}
```

**Step 2: Validate JSON**

Run: `jq empty maf/templates/agent-topology-3agent-bdd.json`
Expected: No errors

**Step 3: Commit**

```bash
git add maf/templates/agent-topology-3agent-bdd.json
git commit -m "feat: add 3-agent BDD topology template with mail polling config"
```

---

### Task 2: Create base workflow script

**Files:**
- Create: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh`

**Step 1: Copy from existing workflow**

```bash
cp maf/scripts/maf/autonomous-workflow.sh maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
```

**Step 2: Update ABOUTME comments**

Edit lines 1-4:
```bash
# ABOUTME: 3-agent BDD autonomous workflow with active mail polling.
# ABOUTME: Enforces TDD, two-stage review, escalation, and autonomous stage transitions.
# ABOUTME: Supervisor + Reviewer + Implementor in tmux with Agent Mail workflow bus.
```

**Step 3: Update help text**

Edit lines 44-53:
```bash
echo "Usage: $0 [--once|--loop|--audit|--setup-polling]"
echo ""
echo "3-Agent BDD Workflow: supervisor + reviewer + implementor"
echo "with active mail polling and autonomous stage transitions"
echo ""
echo "Modes:"
echo "  --once           Run a single assignment cycle"
echo "  --loop           Run continuously (default)"
echo "  --audit          Run closed bead audit only"
echo "  --setup-polling  Start mail polling in all agent panes"
```

**Step 4: Add BDD config loading**

Add after line 32:
```bash
# Load BDD configuration from topology
BDD_CONFIG="$(jq '.bdd_config // {}' "$TOPOLOGY_FILE" 2>/dev/null || echo '{}')"
MAIL_POLLING_INTERVAL="$(echo "$BDD_CONFIG" | jq -r '.mail_polling_interval_seconds // 10')"
STAGE_TIMEOUT_MINUTES="$(echo "$BDD_CONFIG" | jq -r '.stage_timeout_minutes // 30')"
```

**Step 5: Commit**

```bash
git add maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
git commit -m "feat: create 3-agent BDD workflow script base"
```

---

### Task 3: Create Python mail polling library

**Files:**
- Create: `maf/scripts/maf/lib/mail_poller.py`

**Step 1: Write mail polling module**

```python
#!/usr/bin/env python3
"""
Agent Mail Polling Library for BDD Workflow

Polls Agent Mail for new messages and triggers actions based on stage transitions.
Used by all agents in 3-agent BDD workflow.
"""

import json
import subprocess
import time
import sys
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Any

class AgentMailPoller:
    """Polls Agent Mail for new messages and triggers BDD workflow actions."""

    def __init__(self, agent_name: str, topology_file: str, polling_interval: int = 10):
        """
        Initialize mail poller.

        Args:
            agent_name: Agent's mail name (e.g., "RedPond")
            topology_file: Path to agent-topology.json
            polling_interval: Seconds between polls (default: 10)
        """
        self.agent_name = agent_name
        self.topology_file = Path(topology_file)
        self.polling_interval = polling_interval
        self.last_check = datetime.now()
        self.processed_messages = set()
        self.topology = self._load_topology()

    def _load_topology(self) -> Dict:
        """Load agent topology file."""
        try:
            with open(self.topology_file) as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"ERROR: Topology file not found: {self.topology_file}")
            sys.exit(2)

    def _get_mail_name_by_role(self, role: str) -> Optional[str]:
        """Get mail name by role from topology."""
        for pane in self.topology.get("panes", []):
            if pane.get("role") == role:
                return pane.get("mail_name")
        return None

    def _run_command(self, cmd: List[str]) -> str:
        """Run shell command and return output."""
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout

    def fetch_new_mail(self) -> List[Dict]:
        """
        Fetch new mail messages since last check.

        Returns:
            List of new mail message dictionaries
        """
        # Run agent-mail-fetch script
        cmd = ["bash", "maf/scripts/maf/agent-mail-fetch.sh", self.agent_name]
        output = self._run_command(cmd)

        if not output.strip():
            return []

        # Parse mail output (assume JSON or structured text format)
        messages = self._parse_mail_output(output)

        # Filter out already processed messages
        new_messages = [
            msg for msg in messages
            if msg.get("id") not in self.processed_messages
        ]

        # Mark as processed
        for msg in new_messages:
            self.processed_messages.add(msg.get("id", ""))

        self.last_check = datetime.now()
        return new_messages

    def _parse_mail_output(self, output: str) -> List[Dict]:
        """
        Parse agent-mail-fetch output into structured messages.

        Expected format (simplified):
        From: RedPond
        To: PurpleBear
        Subject: [BEAD-123] TDD Stage Complete
        Body: Tests written and verified to fail correctly
        """
        messages = []
        current_msg = {}

        for line in output.split('\n'):
            if line.startswith('From:'):
                if current_msg:
                    messages.append(current_msg)
                current_msg = {'from': line.split(':', 1)[1].strip()}
            elif line.startswith('To:'):
                current_msg['to'] = line.split(':', 1)[1].strip()
            elif line.startswith('Subject:'):
                current_msg['subject'] = line.split(':', 1)[1].strip()
            elif line.startswith('Body:'):
                current_msg['body'] = line.split(':', 1)[1].strip()
            elif line.startswith('Message-ID:'):
                current_msg['id'] = line.split(':', 1)[1].strip()

        if current_msg:
            messages.append(current_msg)

        return messages

    def extract_bead_id(self, subject: str) -> Optional[str]:
        """Extract bead ID from subject line."""
        match = re.search(r'\[([A-Z]+-\d+)\]', subject)
        return match.group(1) if match else None

    def parse_stage_transition(self, message: Dict) -> Optional[Dict]:
        """
        Parse stage transition information from mail message.

        Returns:
            Dict with 'stage', 'action', 'bead_id', 'notes' or None
        """
        subject = message.get('subject', '')
        body = message.get('body', '')

        bead_id = self.extract_bead_id(subject)
        if not bead_id:
            return None

        # Parse stage transitions
        if 'TDD Stage Complete' in subject or 'TDD verification' in body:
            return {
                'stage': 'tdd',
                'action': 'complete',
                'bead_id': bead_id,
                'notes': body
            }

        if 'Stage 1' in subject or 'spec compliance' in body.lower():
            if 'PASSED' in body or 'approved' in body.lower():
                return {
                    'stage': 'stage1',
                    'action': 'approved',
                    'bead_id': bead_id,
                    'notes': body
                }
            elif 'FAILED' in body or 'rejected' in body.lower():
                return {
                    'stage': 'stage1',
                    'action': 'rejected',
                    'bead_id': bead_id,
                    'notes': body
                }

        if 'Stage 2' in subject or 'code quality' in body.lower():
            if 'PASSED' in body or 'approved' in body.lower():
                return {
                    'stage': 'stage2',
                    'action': 'approved',
                    'bead_id': bead_id,
                    'notes': body
                }
            elif 'FAILED' in body or 'rejected' in body.lower():
                return {
                    'stage': 'stage2',
                    'action': 'rejected',
                    'bead_id': bead_id,
                    'notes': body
                }

        if 'Ready for review' in subject:
            return {
                'stage': 'review',
                'action': 'ready',
                'bead_id': bead_id,
                'notes': body
            }

        if 'Escalation' in subject:
            return {
                'stage': 'escalation',
                'action': 'guidance',
                'bead_id': bead_id,
                'notes': body
            }

        return None

    def poll(self, callback=None) -> int:
        """
        Poll for new mail and trigger callbacks.

        Args:
            callback: Function to call for each new message. Receives (message, transition).

        Returns:
            Number of new messages processed
        """
        new_messages = self.fetch_new_mail()

        for msg in new_messages:
            transition = self.parse_stage_transition(msg)

            if callback:
                callback(msg, transition)
            else:
                # Default: print the transition
                if transition:
                    print(f"📬 Stage Transition: {transition['stage']} = {transition['action']}")
                    print(f"   Bead: {transition['bead_id']}")
                    print(f"   Notes: {transition['notes'][:100]}...")

        return len(new_messages)

    def poll_forever(self, callback=None):
        """Poll continuously forever."""
        print(f"🔄 Starting mail poller for {self.agent_name}")
        print(f"   Polling interval: {self.polling_interval}s")
        print(f"   Press Ctrl+C to stop")
        print()

        try:
            while True:
                count = self.poll(callback)
                if count > 0:
                    print(f"✅ Processed {count} new message(s)")

                time.sleep(self.polling_interval)

        except KeyboardInterrupt:
            print("\n🛑 Polling stopped by user")
            sys.exit(0)


def main():
    """CLI entry point for mail poller."""
    import argparse

    parser = argparse.ArgumentParser(description="Poll Agent Mail for BDD workflow")
    parser.add_argument("--agent-name", required=True, help="Agent's mail name")
    parser.add_argument("--topology-file", default=".maf/config/agent-topology.json",
                        help="Path to topology file")
    parser.add_argument("--interval", type=int, default=10,
                        help="Polling interval in seconds")

    args = parser.parse_args()

    poller = AgentMailPoller(
        agent_name=args.agent_name,
        topology_file=args.topology_file,
        polling_interval=args.interval
    )

    poller.poll_forever()


if __name__ == "__main__":
    main()
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/mail_poller.py
```

**Step 3: Test import**

Run: `python3 -c "import maf.scripts.maf.lib.mail_poller"`
Expected: No errors (may need PYTHONPATH setup)

**Step 4: Commit**

```bash
git add maf/scripts/maf/lib/mail_poller.py
git commit -m "feat: add Agent Mail polling library for BDD workflow"
```

---

### Task 4: Create mail polling shell wrapper

**Files:**
- Create: `maf/scripts/maf/poll-agent-mail.sh`

**Step 1: Write polling wrapper script**

```bash
#!/bin/bash
# poll-agent-mail.sh - Start mail polling for an agent
# USAGE: bash maf/scripts/maf/poll-agent-mail.sh <role>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source preflight for topology helpers
source "${PROJECT_ROOT}/maf/scripts/maf/preflight-gatekeeper.sh"

ROLE="${1:-}"
if [[ -z "$ROLE" ]]; then
  echo "Usage: $0 <role>"
  echo ""
  echo "Roles: supervisor, reviewer, implementor"
  exit 1
fi

# Get topology file
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "ERROR: Topology file not found: $TOPOLOGY_FILE"
  exit 2
fi

# Get mail name for role
MAIL_NAME=$(get_mail_name_by_role "$ROLE")
if [[ -z "$MAIL_NAME" ]]; then
  echo "ERROR: No mail name found for role: $ROLE"
  exit 2
fi

# Get polling interval from BDD config
POLLING_INTERVAL=$(jq -r '.bdd_config.mail_polling_interval_seconds // 10' "$TOPOLOGY_FILE")

echo "🔄 Starting mail polling for $ROLE ($MAIL_NAME)"
echo "   Polling interval: ${POLLING_INTERVAL}s"
echo "   Topology: $TOPOLOGY_FILE"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run Python poller
cd "$PROJECT_ROOT"
python3 "${SCRIPT_DIR}/lib/mail_poller.py" \
  --agent-name "$MAIL_NAME" \
  --topology-file "$TOPOLOGY_FILE" \
  --interval "$POLLING_INTERVAL"
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/poll-agent-mail.sh
```

**Step 3: Test basic execution**

Run: `bash maf/scripts/maf/poll-agent-mail.sh supervisor`
Expected: Starts polling (will error without topology but shows script works)

**Step 4: Commit**

```bash
git add maf/scripts/maf/poll-agent-mail.sh
git commit -m "feat: add mail polling shell wrapper"
```

---

### Task 5: Remove dual-implementor logic from workflow

**Files:**
- Modify: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh:300-334`

**Step 1: Simplify assign_beads() for single implementor**

Replace lines 300-334:
```bash
  # Check if single implementor is available
  local impl_pane
  impl_pane="$(get_pane_by_role "implementor" 2>/dev/null || echo "2")"

  if is_agent_busy "$impl_pane"; then
    log "Implementor is busy working. Waiting..."
    return 1
  fi

  local target_mail
  local target_agent
  local target_pane="$impl_pane"

  target_mail="$(get_mail_name_by_pane "$impl_pane")"
  target_agent="$(get_agent_name_by_pane "$impl_pane")"

  log "Selected $target_agent (Pane $target_pane) - appears idle"
```

**Step 2: Update autonomous_loop() agent initialization**

Replace lines 620-630:
```bash
  log "Starting 3-agent BDD autonomous workflow loop..."
  local supervisor_name
  local reviewer_name
  local impl_name
  supervisor_name="$(get_agent_name_by_pane "$(get_pane_by_role "supervisor")")"
  reviewer_name="$(get_agent_name_by_pane "$(get_pane_by_role "reviewer")")"
  impl_name="$(get_agent_name_by_pane "$(get_pane_by_role "implementor")")"
  log "Agents: $supervisor_name (Supervisor), $reviewer_name (Reviewer), $impl_name (Implementor)"
  log "BDD: TDD enforced, two-stage review, active mail polling"
  log "Press Ctrl+C to stop"
```

**Step 3: Update check_agents() for 3 panes**

Replace line 398:
```bash
  for pane in 0 1 2; do
```

**Step 4: Commit**

```bash
git add maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
git commit -m "refactor: remove dual-implementor logic, update for 3-agent model"
```

---

## Phase 2: TDD Enforcement System (4 tasks)

### Task 6: Create TDD stage verification module

**Files:**
- Create: `maf/scripts/maf/lib/tdd_enforcer.py`

**Step 1: Write TDD verification module**

```python
#!/usr/bin/env python3
"""
TDD Enforcement Module

Verifies that Test-Driven Development workflow is followed:
1. Write test
2. Watch test fail correctly
3. Implement feature
4. Watch test pass
5. Repeat for next behavior
"""

import subprocess
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple


class TDDEnforcer:
    """Verifies TDD workflow compliance."""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)

    def check_test_exists(self, bead_id: str) -> Tuple[bool, str]:
        """
        Check if test file exists for bead.

        Returns:
            (exists, message)
        """
        # Look for test file patterns
        test_patterns = [
            f"test*{bead_id}*.py",
            f"test*{bead_id}*.ts",
            f"test*{bead_id}*.js",
            f"*{bead_id}*.test.ts",
            f"*{bead_id}*.test.js",
        ]

        found_tests = []
        for pattern in test_patterns:
            tests = list(self.project_root.rglob(pattern))
            found_tests.extend(tests)

        if found_tests:
            return True, f"✅ Found {len(found_tests)} test file(s) for {bead_id}"
        else:
            return False, f"❌ No test files found for {bead_id}. Write test first."

    def check_test_fails(self, bead_id: str) -> Tuple[bool, str]:
        """
        Verify that test fails correctly (not syntax error, not passing).

        Returns:
            (fails_correctly, message)
        """
        # Run tests and check output
        result = self._run_tests()

        if result.returncode == 0:
            return False, "❌ Tests are passing. They must FAIL first to verify they test the right thing."

        # Check if failure is expected (assertion) vs error (syntax/import)
        stderr = result.stderr.lower()
        stdout = result.stdout.lower()

        # Good failure patterns (assertions)
        good_patterns = [
            "assert",
            "expect",
            "should",
            "failed",
            "not equal",
            "expected.*actual",
        ]

        # Bad failure patterns (errors)
        bad_patterns = [
            "syntaxerror",
            "importerror",
            "module not found",
            "unexpected token",
            "indentationerror",
        ]

        has_good = any(re.search(p, stdout + stderr) for p in good_patterns)
        has_bad = any(re.search(p, stdout + stderr) for p in bad_patterns)

        if has_bad:
            return False, f"❌ Test has syntax/import errors:\n{stderr[:200]}"

        if has_good:
            return True, f"✅ Test fails correctly with assertion:\n{stdout[:200]}"

        return False, f"❌ Test failed for unclear reason:\n{stdout[:200]}"

    def check_test_passes(self, bead_id: str) -> Tuple[bool, str]:
        """
        Verify that all tests pass after implementation.

        Returns:
            (all_pass, message)
        """
        result = self._run_tests()

        if result.returncode == 0:
            # Check that tests actually ran
            if "passed" in result.stdout.lower() or "✓" in result.stdout or "." in result.stdout:
                return True, f"✅ All tests passing:\n{result.stdout[:200]}"
            else:
                return False, "⚠️  Tests passed but no test output detected. Did tests run?"
        else:
            return False, f"❌ Tests failing:\n{result.stdout[:200]}\n{result.stderr[:200]}"

    def _run_tests(self) -> subprocess.CompletedProcess:
        """Run project tests and return result."""
        # Detect test framework and run appropriate command
        if (self.project_root / "package.json").exists():
            # Node.js project
            return subprocess.run(
                ["npm", "test"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
        elif (self.project_root / "pom.xml").exists():
            # Maven project
            return subprocess.run(
                ["mvn", "test"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
        elif (self.project_root / "requirements.txt").exists() or (self.project_root / "pyproject.toml").exists():
            # Python project
            return subprocess.run(
                ["python", "-m", "pytest", "-v"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
        else:
            # Generic: try bd test
            return subprocess.run(
                ["bd", "test"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )

    def verify_tdd_workflow(self, bead_id: str) -> Tuple[bool, List[str]]:
        """
        Verify complete TDD workflow for bead.

        Returns:
            (compliant, messages)
        """
        messages = []

        # Stage 1: Test exists
        exists, msg = self.check_test_exists(bead_id)
        messages.append(msg)
        if not exists:
            return False, messages

        # Stage 2: Test fails correctly
        fails, msg = self.check_test_fails(bead_id)
        messages.append(msg)
        if not fails:
            return False, messages

        # Stage 3: Test passes after implementation
        passes, msg = self.check_test_passes(bead_id)
        messages.append(msg)
        if not passes:
            return False, messages

        return True, messages


def main():
    """CLI for TDD verification."""
    import argparse

    parser = argparse.ArgumentParser(description="Verify TDD workflow compliance")
    parser.add_argument("bead_id", help="Bead ID to verify")
    parser.add_argument("--project-root", default=".", help="Project root directory")

    args = parser.parse_args()

    enforcer = TDDEnforcer(args.project_root)
    compliant, messages = enforcer.verify_tdd_workflow(args.bead_id)

    print(f"\nTDD Verification for {args.bead_id}:")
    print("=" * 60)
    for msg in messages:
        print(msg)

    if compliant:
        print("\n✅ TDD workflow followed correctly")
        exit(0)
    else:
        print("\n❌ TDD workflow violations detected")
        exit(1)


if __name__ == "__main__":
    main()
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/tdd_enforcer.py
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/lib/tdd_enforcer.py
git commit -m "feat: add TDD enforcement verification module"
```

---

### Task 7: Create TDD prompt template

**Files:**
- Create: `maf/templates/prompts/implementor-tdd.md`

**Step 1: Write TDD-focused implementor prompt**

```markdown
# Bead Implementation Task - TDD Workflow Required

You are implementing **{{bead_id}}** following strict Test-Driven Development.

## Bead Details
- **ID:** {{bead_id}}
- **Title:** {{bead_title}}
- **Description:** {{bead_description}}
- **Labels:** {{bead_labels}}

## TDD Workflow - MANDATORY STEPS

You MUST follow TDD. No shortcuts. No exceptions.

### Step 1: RED - Write Failing Test

**Write a test that demonstrates the desired behavior.**

Example:
```python
# test/example.py
def test_specific_behavior():
    result = function(input)
    assert result == expected  # What we want
```

**Then RUN the test to verify it FAILS:**

Run: `npm test` (or `pytest`, `mvn test`)

**Expected:** Test fails with assertion error (not syntax error)
- ✅ Good: `AssertionError: assert 5 == 10`
- ❌ Bad: `SyntaxError: invalid syntax`

**If test passes:** Your test is wrong. It must fail first to prove it tests something real.
**If syntax error:** Fix test, not implementation.

### Step 2: GREEN - Write Minimal Code

**Write ONLY enough code to make the test pass.**

Don't add features. Don't refactor. Don't improve.
Just make the failing test pass.

```python
def function(input):
    return expected  # Minimum to pass
```

**Then RUN the test to verify it PASSES:**

Run: `npm test` (or `pytest`, `mvn test`)

**Expected:** Test passes

### Step 3: REFACTOR - Clean Up

**ONLY after test passes:** Clean up the code.
- Remove duplication
- Improve names
- Extract helpers

**Keep test green.** Don't add behavior.

**Then RUN tests again:**

Run: `npm test` (or `pytest`, `mvn test`)

**Expected:** Test still passes

### Step 4: Repeat for Next Behavior

If the bead has multiple behaviors, repeat RED-GREEN-REFACTOR for each.

**One test per behavior.** Don't test multiple things in one test.

## TDD Verification

Before notifying reviewer, verify:

1. ✅ Test file exists and is named appropriately
2. ✅ Test fails BEFORE implementation (you watched it fail)
3. ✅ Test passes AFTER implementation
4. ✅ All tests in suite pass (no new failures)
5. ✅ Test is clear and specific (not vague)
6. ✅ Test covers edge cases

Run TDD verification:
```bash
python3 maf/scripts/maf/lib/tdd_enforcer.py {{bead_id}}
```

## Common TDD Violations

❌ **Writing code before test** - Delete code, start over
❌ **Test passes immediately** - Test doesn't work, rewrite it
❌ **Testing implementation not behavior** - Test the WHAT, not HOW
❌ **Multiple behaviors in one test** - Split into separate tests
❌ **Skipping RED stage** "I'll write test later" - Write test NOW

## After TDD Complete

Once TDD workflow verified:

1. Commit changes:
   ```bash
   git add .
   git commit -m "feat({{bead_id}}): implement [feature] with TDD

   - Test: [describe test]
   - Implementation: [describe code]
   - All tests passing
   "
   ```

2. Send completion mail to Reviewer:
   ```
   From: {{implementor_mail_name}}
   To: {{reviewer_mail_name}}
   Subject: [{{bead_id}}] TDD Complete - Ready for Review

   TDD workflow followed:
   - Test written: {{test_file}}
   - Test failed correctly: Verified
   - Implementation complete
   - All tests passing

   Commit: {{commit_hash}}

   Ready for two-stage review.
   ```

3. Wait for review feedback (mail poller will notify you)

## If Review Rejected

You'll receive mail with:
- Stage 1 rejection: Spec compliance issue
- Stage 2 rejection: Code quality issue

**Fix the specific issue** and resend.

Don't argue with the review. Fix and resubmit.

## IMPORTANT REMINDERS

- **NO PRODUCTION CODE WITHOUT FAILING TEST FIRST**
- **WATCH THE TEST FAIL** - If you didn't see it fail, it doesn't count
- **ONE BEHAVIOR PER TEST** - Split complex features into multiple tests
- **ALL TESTS MUST PASS** - No new test failures allowed

TDD is not optional. It's how we ensure quality.
```

**Step 2: Commit**

```bash
git add maf/templates/prompts/implementor-tdd.md
git commit -m "feat: add TDD-focused implementor prompt template"
```

---

### Task 8: Integrate TDD check into workflow

**Files:**
- Modify: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh`

**Step 1: Add TDD verification function**

Add after line 165:
```bash
# Verify TDD workflow was followed
verify_tdd_workflow() {
  local bead_id="$1"

  log "Verifying TDD workflow for $bead_id..."

  # Run TDD enforcer
  local tdd_result
  tdd_result=$(python3 maf/scripts/maf/lib/tdd_enforcer.py "$bead_id" 2>&1)
  local tdd_exit=$?

  if [[ $tdd_exit -eq 0 ]]; then
    log "✅ TDD workflow verified for $bead_id"
    return 0
  else
    warn "❌ TDD workflow violations for $bead_id:"
    echo "$tdd_result" | head -20 >&2
    return 1
  fi
}
```

**Step 2: Update assign_beads to include TDD prompt**

Modify the direct command sent to implementor (around line 365):
```bash
  # Load TDD prompt template
  local tdd_prompt
  tdd_prompt=$(envsubst < maf/templates/prompts/implementor-tdd.md)

  # Send with TDD instructions
  local direct_cmd="cat <<'TDD_PROMPT_END'
$tdd_prompt
TDD_PROMPT_END
"
  prompt_agent "$target_pane" "echo '=== TDD WORKFLOW INSTRUCTIONS ===' && echo '$tdd_prompt' && echo '=====================================' && echo 'Starting TDD workflow now...'"
```

**Step 3: Add TDD verification before review notification**

Add after line 375 (before notify_bead_complete):
```bash
  # Verify TDD workflow before notifying reviewer
  if ! verify_tdd_workflow "$assigned_bead"; then
    warn "TDD verification failed for $assigned_bead, not notifying reviewer"

    # Send escalation mail to implementor
    send_agent_mail \
      "$(get_mail_name_by_role "supervisor")" \
      "$target_mail" \
      "[$assigned_bead] TDD Violation Detected" \
      "TDD workflow not followed correctly.\n\nFix violations and retry.\n\n$tdd_result" \
      "high"

    return 1
  fi
```

**Step 4: Commit**

```bash
git add maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
git commit -m "feat: integrate TDD verification into workflow"
```

---

### Task 9: Create TDD self-check command

**Files:**
- Create: `maf/scripts/maf/tdd-check.sh`

**Step 1: Write TDD self-check script**

```bash
#!/bin/bash
# tdd-check.sh - Verify TDD workflow for current bead
# Usage: Run from implementor pane after implementing bead

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

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
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/tdd-check.sh
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/tdd-check.sh
git commit -m "feat: add TDD self-check command for implementors"
```

---

## Phase 3: Two-Stage Review System (5 tasks)

### Task 10: Create two-stage review module

**Files:**
- Create: `maf/scripts/maf/lib/reviewer.py`

**Step 1: Write two-stage review module**

```python
#!/usr/bin/env python3
"""
Two-Stage Review Module

Stage 1: Spec Compliance - Did we build EXACTLY what was requested?
Stage 2: Code Quality - Is the implementation well-built?

Each stage must pass before proceeding to next.
Rejections include specific feedback for fixes.
"""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple


class TwoStageReviewer:
    """Performs two-stage review of bead implementations."""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)

    def review_stage1_spec_compliance(self, bead_id: str, bead_spec: Dict, commit_info: Dict) -> Tuple[bool, str, List[str]]:
        """
        Stage 1: Verify implementation matches bead specification.

        Returns:
            (passed, summary, issues)
        """
        issues = []

        # Get commit diff
        diff = self._get_commit_diff(commit_info.get('hash', ''))

        # Check 1: All requirements implemented
        requirements = bead_spec.get('description', '').split('\n')
        for req in requirements:
            if not self._is_requirement_met(req, diff):
                issues.append(f"Missing requirement: {req}")

        # Check 2: No extra features (YAGNI)
        extra = self._detect_extra_features(bead_spec, diff)
        if extra:
            issues.append(f"Extra features found (YAGNI): {', '.join(extra)}")

        # Check 3: Edge cases covered
        if not self._edge_cases_covered(bead_id, diff):
            issues.append("Edge cases not covered in tests")

        # Check 4: Dependencies handled
        if 'depends on' in str(requirements).lower():
            if not self._dependencies_resolved(requirements, diff):
                issues.append("Dependencies not properly handled")

        # Check 5: Receipt generated
        if not self._receipt_exists(bead_id):
            issues.append("No receipt file generated")

        passed = len(issues) == 0
        summary = "✅ Spec compliance: All requirements met" if passed else f"❌ Spec compliance: {len(issues)} issue(s)"

        return passed, summary, issues

    def review_stage2_code_quality(self, bead_id: str, commit_info: Dict) -> Tuple[bool, str, List[str]]:
        """
        Stage 2: Verify implementation is well-built.

        Returns:
            (passed, summary, issues)
        """
        issues = []

        # Get commit diff and files
        diff = self._get_commit_diff(commit_info.get('hash', ''))
        files_changed = commit_info.get('files', [])

        # Check 1: Tests exist and pass
        if not self._tests_exist(files_changed):
            issues.append("No tests written")
        elif not self._tests_pass():
            issues.append("Tests are failing")

        # Check 2: Code follows project patterns
        if not self._follows_patterns(diff):
            issues.append("Code doesn't follow project patterns")

        # Check 3: No security issues
        security_issues = self._check_security(diff)
        issues.extend(security_issues)

        # Check 4: Error handling appropriate
        if not self._has_error_handling(diff):
            issues.append("Missing error handling")

        # Check 5: No hardcoded values
        hardcoded = self._find_hardcoded_values(diff)
        if hardcoded:
            issues.append(f"Hardcoded values found: {', '.join(hardcoded)}")

        # Check 6: Performance considerations
        if not self._performance_ok(diff):
            issues.append("Potential performance issue")

        # Check 7: Clean code (no duplication, good names)
        if self._has_duplication(diff):
            issues.append("Code has duplication that should be extracted")
        if self._has_poor_names(diff):
            issues.append("Poor variable/function names")

        passed = len(issues) == 0
        summary = "✅ Code quality: Well-built" if passed else f"❌ Code quality: {len(issues)} issue(s)"

        return passed, summary, issues

    def _get_commit_diff(self, commit_hash: str) -> str:
        """Get commit diff."""
        result = subprocess.run(
            ["git", "show", commit_hash],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        return result.stdout

    def _is_requirement_met(self, requirement: str, diff: str) -> bool:
        """Check if requirement is met in diff."""
        # Simplified: check if requirement keywords appear in implementation
        keywords = requirement.split()[:5]  # First 5 words as keywords
        return any(kw.lower() in diff.lower() for kw in keywords if len(kw) > 3)

    def _detect_extra_features(self, bead_spec: Dict, diff: str) -> List[str]:
        """Detect features not in spec."""
        # Simplified: look for functions/classes not mentioned in spec
        spec_text = json.dumps(bead_spec).lower()
        extras = []

        # Find function definitions
        import re
        functions = re.findall(r'(def|function|class)\s+(\w+)', diff)

        for func_type, func_name in functions:
            if func_name.lower() not in spec_text:
                extras.append(f"{func_type} {func_name}")

        return extras

    def _edge_cases_covered(self, bead_id: str, diff: str) -> bool:
        """Check if edge cases are covered in tests."""
        # Look for edge case patterns in tests
        edge_patterns = ['empty', 'null', 'zero', 'negative', 'error', 'invalid', 'boundary']
        return any(pattern in diff.lower() for pattern in edge_patterns)

    def _dependencies_resolved(self, requirements: List[str], diff: str) -> bool:
        """Check if dependencies are properly handled."""
        return 'import' in diff.lower() or 'require' in diff.lower() or 'from' in diff.lower()

    def _receipt_exists(self, bead_id: str) -> bool:
        """Check if receipt file exists."""
        receipt_path = self.project_root / "receipts" / f"{bead_id}.md"
        return receipt_path.exists()

    def _tests_exist(self, files_changed: List[str]) -> bool:
        """Check if test files were added/modified."""
        return any('test' in f.lower() or f.endswith('.spec.ts') or f.endswith('.test.js') for f in files_changed)

    def _tests_pass(self) -> bool:
        """Check if tests pass."""
        result = subprocess.run(
            ["npm", "test"],
            capture_output=True,
            cwd=self.project_root
        )
        return result.returncode == 0

    def _follows_patterns(self, diff: str) -> bool:
        """Check if code follows project patterns."""
        # Simplified: check for proper structure
        return True  # Would check against project style guide

    def _check_security(self, diff: str) -> List[str]:
        """Check for security issues."""
        issues = []

        dangerous_patterns = [
            ('eval(', 'Use of eval() is dangerous'),
            ('innerHTML', 'innerHTML allows XSS'),
            ('sql.execute', 'SQL injection risk - use parameterized queries'),
            ('subprocess.', 'Command injection risk - sanitize input'),
        ]

        for pattern, msg in dangerous_patterns:
            if pattern in diff:
                issues.append(f"Security: {msg}")

        return issues

    def _has_error_handling(self, diff: str) -> bool:
        """Check if error handling exists."""
        error_patterns = ['try', 'catch', 'except', 'error', 'throw']
        return any(pattern in diff.lower() for pattern in error_patterns)

    def _find_hardcoded_values(self, diff: str) -> List[str]:
        """Find hardcoded values that should be constants."""
        import re
        # Look for magic numbers and strings
        magic_numbers = re.findall(r'(?<![\w.])(\d{2,})(?![\w.])', diff)
        return [f"Number {num}" for num in set(magic_numbers)]

    def _performance_ok(self, diff: str) -> bool:
        """Check for performance issues."""
        # Look for nested loops, large data copies, etc.
        return 'for.*for' not in diff.lower()  # Simplified check

    def _has_duplication(self, diff: str) -> bool:
        """Check for code duplication."""
        # Simplified: look for repeated patterns
        lines = diff.split('\n')
        unique_lines = set(lines)
        return len(lines) > len(unique_lines) * 1.5  # Arbitrary threshold

    def _has_poor_names(self, diff: str) -> bool:
        """Check for poor variable/function names."""
        import re
        poor_patterns = [r'\b[a-z]\b', r'\b[data]{2}\b', r'\b[temp]{1,4}\b']
        return any(re.search(pattern, diff) for pattern in poor_patterns)


def main():
    """CLI for two-stage review."""
    import argparse

    parser = argparse.ArgumentParser(description="Two-stage review of bead implementation")
    parser.add_argument("bead_id", help="Bead ID to review")
    parser.add_argument("--commit", help="Commit hash to review")
    parser.add_argument("--stage", choices=["1", "2", "both"], default="both",
                        help="Review stage 1, 2, or both")

    args = parser.parse_args()

    reviewer = TwoStageReviewer(".")
    bead_spec = {"description": f"Bead {args.bead_id}"}  # Would load from bd
    commit_info = {"hash": args.commit or "HEAD", "files": []}

    if args.stage in ["1", "both"]:
        print("\n" + "="*60)
        print("STAGE 1: Spec Compliance")
        print("="*60)
        passed, summary, issues = reviewer.review_stage1_spec_compliance(
            args.bead_id, bead_spec, commit_info
        )
        print(summary)
        for issue in issues:
            print(f"  - {issue}")

        if not passed and args.stage == "1":
            print("\n❌ Stage 1 FAILED - Fix spec issues before Stage 2")
            exit(1)

    if args.stage in ["2", "both"]:
        print("\n" + "="*60)
        print("STAGE 2: Code Quality")
        print("="*60)
        passed, summary, issues = reviewer.review_stage2_code_quality(
            args.bead_id, commit_info
        )
        print(summary)
        for issue in issues:
            print(f"  - {issue}")

        if not passed:
            print("\n❌ Stage 2 FAILED - Fix quality issues")
            exit(1)

    print("\n✅ Review complete - All stages passed")


if __name__ == "__main__":
    main()
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/reviewer.py
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/lib/reviewer.py
git commit -m "feat: add two-stage review module"
```

---

### Task 11: Create reviewer prompt template

**Files:**
- Create: `maf/templates/prompts/reviewer-two-stage.md`

**Step 1: Write two-stage review prompt**

```markdown
# Bead Review Task - Two-Stage Review Process

You are reviewing **{{bead_id}}** implementation. Perform two-stage review.

## Bead Details
- **ID:** {{bead_id}}
- **Title:** {{bead_title}}
- **Description:** {{bead_description}}

## Implementation
- **Commit:** {{commit_hash}}
- **Files changed:** {{files_changed}}
- **Diff:** See commit output

## STAGE 1: Spec Compliance

**Question:** Did the implementation build EXACTLY what the bead describes?

### Check清单

- [ ] All requirements from bead description implemented?
- [ ] No extra features added (YAGNI - You Aren't Gonna Need It)?
- [ ] Edge cases covered in tests?
- [ ] Dependencies handled properly?
- [ ] Receipt file generated (≥50 lines, not template)?

### Decision: PASSED or FAILED

**If PASSED:** Proceed to Stage 2

**If FAILED:** Reject with specific missing requirements

**Response Template (if FAILED):**
```
From: {{reviewer_mail_name}}
To: {{implementor_mail_name}}
Subject: [{{bead_id}}] Stage 1 FAILED - Spec Compliance

❌ Spec compliance check FAILED

Missing requirements:
- [List specific missing requirements from bead description]

Extra features (remove these):
- [List any features not in spec]

Other issues:
- [Any other spec compliance issues]

Please fix and resubmit for Stage 1 review again.
```

---

## STAGE 2: Code Quality

**ONLY proceed if Stage 1 PASSED**

**Question:** Is the implementation well-built?

### Check清单

- [ ] Tests exist and pass?
- [ ] Code follows project patterns?
- [ ] No security issues (no eval, no innerHTML, parameterized queries)?
- [ ] Error handling appropriate?
- [ ] No hardcoded values (magic numbers, strings)?
- [ ] Performance acceptable (no nested loops, no large copies)?
- [ ] Clean code (no duplication, good names)?

### Decision: PASSED or FAILED

**If PASSED:** Approve bead

**If FAILED:** Reject with specific code quality issues

**Response Template (if FAILED):**
```
From: {{reviewer_mail_name}}
To: {{implementor_mail_name}}
Subject: [{{bead_id}}] Stage 2 FAILED - Code Quality

❌ Code quality check FAILED

Issues found:
- [List specific code quality issues with file:line references]

Security issues:
- [List any security vulnerabilities]

Performance issues:
- [List any performance concerns]

Please fix and resubmit for Stage 2 review again.
```

---

## If Both Stages PASSED

**Response Template:**
```
From: {{reviewer_mail_name}}
To: {{implementor_mail_name}}
Cc: {{supervisor_mail_name}}
Subject: [{{bead_id}}] APPROVED - Both Stages Passed

✅ Stage 1 (Spec Compliance): PASSED
✅ Stage 2 (Code Quality): PASSED

Bead approved. Closing.

Great work following TDD and maintaining code quality!
```

Then run: `bd close {{bead_id}}`

---

## Running Review Tools

### Automated Stage Checks

**Stage 1: Spec compliance**
```bash
python3 maf/scripts/maf/lib/reviewer.py {{bead_id}} --commit {{commit_hash}} --stage 1
```

**Stage 2: Code quality**
```bash
python3 maf/scripts/maf/lib/reviewer.py {{bead_id}} --commit {{commit_hash}} --stage 2
```

**Both stages**
```bash
python3 maf/scripts/maf/lib/reviewer.py {{bead_id}} --commit {{commit_hash}}
```

### Manual Review Steps

1. View commit:
   ```bash
   git show {{commit_hash}}
   ```

2. Check tests:
   ```bash
   npm test  # or pytest, mvn test
   ```

3. Check receipt:
   ```bash
   wc -l receipts/{{bead_id}}.md
   # Should be ≥50 lines
   ```

4. Verify TDD workflow:
   ```bash
   python3 maf/scripts/maf/lib/tdd_enforcer.py {{bead_id}}
   ```

---

## Review Philosophy

### Stage 1: Spec Compliance (The WHAT)

**Focus:** Did we build the right thing?

- Check against bead description line-by-line
- Every requirement in spec must be in code
- Nothing in code that's not in spec
- Edge cases explicitly tested

**Common Stage 1 Failures:**
- Missing requirement from spec
- Added "helpful" feature not in spec
- Forgot error cases
- Dependencies not handled

### Stage 2: Code Quality (The HOW)

**Focus:** Did we build it the right way?

- Code is maintainable and readable
- Tests cover functionality
- No security vulnerabilities
- Performance is acceptable
- Follows project patterns

**Common Stage 2 Failures:**
- Missing tests or tests failing
- Security issues (eval, innerHTML, SQL injection)
- Hardcoded values
- Poor error handling
- Code duplication

---

## Important Reminders

- **Stage 1 MUST pass before Stage 2** - Don't check code quality if spec is wrong
- **Be specific in rejections** - Tell implementor exactly what to fix
- **Don't fix it yourself** - Reject and let implementor fix
- **Approve when both stages pass** - Don't approve with "minor issues"
- **Close bead after approval** - Run `bd close {{bead_id}}`

Two-stage review ensures both correctness AND quality.
```

**Step 2: Commit**

```bash
git add maf/templates/prompts/reviewer-two-stage.md
git commit -m "feat: add two-stage review prompt template"
```

---

### Task 12: Integrate two-stage review into workflow

**Files:**
- Modify: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh`

**Step 1: Add review stage functions**

Add after TDD verification function:
```bash
# Run Stage 1 review: Spec compliance
run_stage1_review() {
  local bead_id="$1"
  local commit_hash="$2"

  log "Running Stage 1 review (spec compliance) for $bead_id..."

  local stage1_result
  stage1_result=$(python3 maf/scripts/maf/lib/reviewer.py "$bead_id" --commit "$commit_hash" --stage 1 2>&1)
  local stage1_exit=$?

  if [[ $stage1_exit -eq 0 ]]; then
    log "✅ Stage 1 (spec compliance): PASSED"
    return 0
  else
    warn "❌ Stage 1 (spec compliance): FAILED"
    echo "$stage1_result" | grep "❌" >&2
    return 1
  fi
}

# Run Stage 2 review: Code quality
run_stage2_review() {
  local bead_id="$1"
  local commit_hash="$2"

  log "Running Stage 2 review (code quality) for $bead_id..."

  local stage2_result
  stage2_result=$(python3 maf/scripts/maf/lib/reviewer.py "$bead_id" --commit "$commit_hash" --stage 2 2>&1)
  local stage2_exit=$?

  if [[ $stage2_exit -eq 0 ]]; then
    log "✅ Stage 2 (code quality): PASSED"
    return 0
  else
    warn "❌ Stage 2 (code quality): FAILED"
    echo "$stage2_result" | grep "❌" >&2
    return 1
  fi
}

# Send review rejection mail
send_review_rejection() {
  local bead_id="$1"
  local stage="$2"  # "stage1" or "stage2"
  local issues="$3"
  local from_agent="$4"
  local to_agent="$5"

  local stage_name
  if [[ "$stage" == "stage1" ]]; then
    stage_name="Spec Compliance"
  else
    stage_name="Code Quality"
  fi

  send_agent_mail \
    "$from_agent" \
    "$to_agent" \
    "[$bead_id] Stage Rejected - $stage_name" \
    "❌ Review stage FAILED\n\n**Issues:**\n$issues\n\nPlease fix and resubmit."
}
```

**Step 2: Update workflow to run two-stage review**

Add new function for handling review requests via mail:
```bash
# Handle review request from implementor
handle_review_request() {
  local bead_id="$1"
  local from_agent="$2"

  log "Review request received for $bead_id from $from_agent"

  # Get latest commit for bead
  local commit_hash
  commit_hash=$(git log --all --oneline --grep="$bead_id" | head -1 | awk '{print $1}')

  if [[ -z "$commit_hash" ]]; then
    warn "No commit found for $bead_id"
    return 1
  fi

  # Run Stage 1
  if ! run_stage1_review "$bead_id" "$commit_hash"; then
    send_review_rejection "$bead_id" "stage1" "Spec compliance issues" \
      "$(get_mail_name_by_role "reviewer")" "$from_agent"
    return 1
  fi

  # Run Stage 2
  if ! run_stage2_review "$bead_id" "$commit_hash"; then
    send_review_rejection "$bead_id" "stage2" "Code quality issues" \
      "$(get_mail_name_by_role "reviewer")" "$from_agent"
    return 1
  fi

  # Both stages passed - approve
  log "✅ Both review stages passed for $bead_id"

  send_agent_mail \
    "$(get_mail_name_by_role "reviewer")" \
    "$from_agent" \
    "[$bead_id] APPROVED" \
    "✅ Stage 1 (Spec Compliance): PASSED\n✅ Stage 2 (Code Quality): PASSED\n\nBead approved. Closing."

  # Close bead
  bd close "$bead_id"
  log "Closed $bead_id after successful two-stage review"

  return 0
}
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
git commit -m "feat: integrate two-stage review into workflow"
```

---

### Task 13: Create review command for reviewer

**Files:**
- Create: `maf/scripts/maf/review-bead.sh`

**Step 1: Write review command**

```bash
#!/bin/bash
# review-bead.sh - Run two-stage review on bead
# Usage: bash maf/scripts/maf/review-bead.sh <bead-id> [--commit <hash>]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

BEAD_ID="${1:-}"
COMMIT_HASH="${2:-}"

if [[ -z "$BEAD_ID" ]]; then
  echo "Usage: $0 <bead-id> [--commit <hash>]"
  exit 1
fi

if [[ -z "$COMMIT_HASH" ]]; then
  # Find latest commit for bead
  COMMIT_HASH=$(git log --all --oneline --grep="$BEAD_ID" | head -1 | awk '{print $1}')
  if [[ -z "$COMMIT_HASH" ]]; then
    echo "❌ No commit found for $BEAD_ID"
    exit 1
  fi
  echo "Found commit: $COMMIT_HASH"
fi

echo ""
echo "🔍 Two-Stage Review for $BEAD_ID"
echo "=================================="
echo ""

# Load reviewer prompt template
REVIEWER_MAIL=$(get_mail_name_by_role "reviewer")
IMPLEMENTOR_MAIL=$(get_mail_name_by_role "implementor")
export reviewer_mail_name="$REVIEWER_MAIL"
export implementor_mail_name="$IMPLEMENTOR_MAIL"
export bead_id="$BEAD_ID"
export commit_hash="$COMMIT_HASH"
export bead_title="Bead $BEAD_ID"
export bead_description="Bead description"
export files_changed="See git show $COMMIT_HASH"

cat <<'REVIEW_INSTRUCTIONS'
$(envsubst < maf/templates/prompts/reviewer-two-stage.md)
REVIEW_INSTRUCTIONS

echo ""
echo "Running automated review checks..."
echo ""

# Run Stage 1
if ! python3 "${SCRIPT_DIR}/lib/reviewer.py" "$BEAD_ID" --commit "$COMMIT_HASH" --stage 1; then
  echo ""
  echo "❌ Stage 1 FAILED"
  echo ""
  echo "Send rejection mail to implementor?"
  read -p "Send rejection? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash "${SCRIPT_DIR}/send-review-rejection.sh" "$BEAD_ID" "stage1" "$IMPLEMENTOR_MAIL"
  fi
  exit 1
fi

# Run Stage 2
if ! python3 "${SCRIPT_DIR}/lib/reviewer.py" "$BEAD_ID" --commit "$COMMIT_HASH" --stage 2; then
  echo ""
  echo "❌ Stage 2 FAILED"
  echo ""
  echo "Send rejection mail to implementor?"
  read -p "Send rejection? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash "${SCRIPT_DIR}/send-review-rejection.sh" "$BEAD_ID" "stage2" "$IMPLEMENTOR_MAIL"
  fi
  exit 1
fi

echo ""
echo "✅ Both stages passed!"
echo ""
echo "Send approval and close bead?"
read -p "Approve and close? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  # Send approval mail
  bash "${SCRIPT_DIR}/agent-mail-send.sh" \
    "$REVIEWER_MAIL" "$IMPLEMENTOR_MAIL" \
    "[$BEAD_ID] APPROVED" \
    "✅ Stage 1 (Spec Compliance): PASSED\n✅ Stage 2 (Code Quality): PASSED\n\nBead approved."

  # Close bead
  bd close "$BEAD_ID"
  echo "✅ Closed $BEAD_ID"
fi
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/review-bead.sh
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/review-bead.sh
git commit -m "feat: add two-stage review command for reviewers"
```

---

### Task 14: Create mail polling callback for reviewer

**Files:**
- Create: `maf/scripts/maf/lib/reviewer_poller_callback.py`

**Step 1: Write reviewer mail callback**

```python
#!/usr/bin/env python3
"""
Reviewer Mail Polling Callback

Triggers review when implementor sends completion mail.
"""

import subprocess
import sys
from pathlib import Path


def on_review_request(message, transition):
    """Callback when review request mail received."""
    if not transition or transition.get('stage') != 'review':
        return

    bead_id = transition.get('bead_id')
    from_agent = message.get('from')

    print(f"\n📬 Review request received for {bead_id}")
    print(f"   From: {from_agent}")
    print()

    # Trigger review
    review_script = Path(__file__).parent.parent / "review-bead.sh"
    result = subprocess.run(
        ["bash", str(review_script), bead_id],
        cwd=Path(__file__).parent.parent.parent.parent
    )

    if result.returncode == 0:
        print(f"✅ Review complete for {bead_id}")
    else:
        print(f"❌ Review failed for {bead_id}")


if __name__ == "__main__":
    # This would be called by mail_poller.py
    from mail_poller import AgentMailPoller

    REVIEWER_MAIL = sys.argv[1]  # "PurpleBear"
    TOPOLOGY_FILE = sys.argv[2]  # ".maf/config/agent-topology.json"

    poller = AgentMailPoller(
        agent_name=REVIEWER_MAIL,
        topology_file=TOPOLOGY_FILE
    )

    print("🔄 Reviewer mail poller starting...")
    print("   Will automatically review beads when implementor completes them")
    print()

    poller.poll_forever(callback=on_review_request)
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/reviewer_poller_callback.py
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/lib/reviewer_poller_callback.py
git commit -m "feat: add reviewer mail polling callback"
```

---

## Summary of Plan So Far

**Completed:**
- Phase 1: Foundation (5 tasks) - 3-agent topology, mail polling library
- Phase 2: TDD Enforcement (4 tasks) - TDD verification, prompts
- Phase 3: Two-Stage Review (5 tasks) - Review module, prompts, callbacks

**Remaining Phases:**
- Phase 4: Escalation System (3 tasks)
- Phase 5: BV Integration (2 tasks)
- Phase 6: Implementor Mail Callbacks (2 tasks)
- Phase 7: Setup & Startup Scripts (3 tasks)
- Phase 8: Testing (5 tasks)
- Phase 9: Documentation (3 tasks)

**Total: ~28 tasks**

Due to length, I'll continue with remaining phases in the plan file. Let me complete it.
---

## Phase 4: Escalation System (3 tasks)

### Task 15: Create escalation tracking module

**Files:**
- Create: `maf/scripts/maf/lib/escalation.py`

**Step 1: Write escalation tracking module**

```python
#!/usr/bin/env python3
"""
Escalation System

Tracks failed bead attempts and provides progressive guidance.
After 3 failed attempts, bead is reopened for revision.
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


class EscalationManager:
    """Manages escalation for failed bead implementations."""

    def __init__(self, state_file: str = "/tmp/maf-escalation-state.json"):
        self.state_file = Path(state_file)
        self.state = self._load_state()

    def _load_state(self) -> Dict:
        """Load escalation state from file."""
        if self.state_file.exists():
            with open(self.state_file) as f:
                return json.load(f)
        return {}

    def _save_state(self):
        """Save escalation state to file."""
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)

    def record_failure(self, bead_id: str, failure_reason: str, stage: str = "unknown"):
        """
        Record a failed bead attempt.

        Args:
            bead_id: Bead identifier
            failure_reason: Description of what failed
            stage: Stage where failure occurred (stage1, stage2, tdd)
        """
        if bead_id not in self.state:
            self.state[bead_id] = {
                "attempts": 0,
                "failures": [],
                "current_guidance": None,
                "created_at": datetime.now().isoformat()
            }

        bead_state = self.state[bead_id]
        bead_state["attempts"] += 1
        bead_state["failures"].append({
            "attempt": bead_state["attempts"],
            "stage": stage,
            "reason": failure_reason,
            "timestamp": datetime.now().isoformat()
        })

        # Generate guidance based on attempt number
        bead_state["current_guidance"] = self._generate_guidance(bead_state)

        self._save_state()
        return bead_state

    def _generate_guidance(self, bead_state: Dict) -> str:
        """Generate guidance based on attempt number and failures."""
        attempt = bead_state["attempts"]
        failures = bead_state["failures"]

        if attempt == 1:
            return self._first_attempt_guidance(failures[-1])
        elif attempt == 2:
            return self._second_attempt_guidance(bead_state)
        else:
            return self._third_attempt_guidance(bead_state)

    def _first_attempt_guidance(self, failure: Dict) -> str:
        """Generate guidance for first failure."""
        stage = failure.get("stage", "")
        reason = failure.get("reason", "")

        if stage == "stage1":
            return (
                "First attempt failed at spec compliance.\n"
                f"Issue: {reason}\n\n"
                "Review the bead description carefully. Ensure you implemented "
                "EVERY requirement listed. Don't add features not in the spec."
            )
        elif stage == "stage2":
            return (
                "First attempt failed at code quality.\n"
                f"Issue: {reason}\n\n"
                "Review the feedback. Fix the specific issues mentioned. "
                "Run tests again before resubmitting."
            )
        else:
            return f"First attempt failed: {reason}\n\nReview the error and try again."

    def _second_attempt_guidance(self, bead_state: Dict) -> str:
        """Generate guidance for second failure."""
        failures = bead_state["failures"]
        
        # Check if same issue recurring
        if len(failures) >= 2:
            last_stage = failures[-1].get("stage", "")
            first_stage = failures[-2].get("stage", "")
            
            if last_stage == first_stage:
                return (
                    "Second attempt failed at SAME stage.\n"
                    f"Previous issue: {failures[-2]['reason']}\n"
                    f"Current issue: {failures[-1]['reason']}\n\n"
                    "The same issue is recurring. Try a completely different approach. "
                    "Consider:\n"
                    "- Reading the bead description again\n"
                    "- Looking at similar working beads\n"
                    "- Asking for clarification on the requirement"
                )
        
        return (
            "Second attempt failed at different stage.\n"
            "Progress made, but new issue emerged.\n\n"
            "Address the current issue and maintain the fixes from the previous attempt."
        )

    def _third_attempt_guidance(self, bead_state: Dict) -> str:
        """Generate guidance for third failure."""
        return (
            "Third attempt failed.\n\n"
            "This bead may need revision. After this attempt, if it fails again, "
            "the bead will be reopened with notes for the product owner.\n\n"
            "Try:\n"
            "- Alternative architecture or pattern\n"
            "- Breaking the bead into smaller sub-tasks\n"
            "- Seeking help on the specific blocking issue\n"
            "- Documenting what you've tried for context"
        )

    def get_context(self, bead_id: str) -> Optional[Dict]:
        """Get escalation context for a bead."""
        return self.state.get(bead_id)

    def should_give_up(self, bead_id: str) -> bool:
        """Check if bead should be given up on (after 3 attempts)."""
        bead_state = self.state.get(bead_id)
        if not bead_state:
            return False
        return bead_state.get("attempts", 0) >= 3

    def reset(self, bead_id: str):
        """Reset escalation tracking for a bead (after success)."""
        if bead_id in self.state:
            del self.state[bead_id]
            self._save_state()

    def get_failure_summary(self, bead_id: str) -> str:
        """Get summary of failures for a bead."""
        bead_state = self.state.get(bead_id)
        if not bead_state:
            return "No failures recorded"

        summary = f"Bead {bead_id} - {bead_state['attempts']} attempt(s)\n"
        
        for i, failure in enumerate(bead_state["failures"], 1):
            summary += f"\nAttempt {i}:\n"
            summary += f"  Stage: {failure['stage']}\n"
            summary += f"  Reason: {failure['reason']}\n"
            summary += f"  Time: {failure['timestamp']}\n"

        if bead_state.get("current_guidance"):
            summary += f"\nCurrent Guidance:\n{bead_state['current_guidance']}"

        return summary


def main():
    """CLI for escalation management."""
    import argparse

    parser = argparse.ArgumentParser(description="Manage bead escalation")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Record failure
    record_parser = subparsers.add_parser("record", help="Record a failure")
    record_parser.add_argument("bead_id", help="Bead ID")
    record_parser.add_argument("reason", help="Failure reason")
    record_parser.add_argument("--stage", default="unknown", help="Stage where failed")

    # Get context
    context_parser = subparsers.add_parser("context", help="Get escalation context")
    context_parser.add_argument("bead_id", help="Bead ID")

    # Reset
    reset_parser = subparsers.add_parser("reset", help="Reset escalation tracking")
    reset_parser.add_argument("bead_id", help="Bead ID")

    # Summary
    summary_parser = subparsers.add_parser("summary", help="Get failure summary")
    summary_parser.add_argument("bead_id", help="Bead ID")

    args = parser.parse_args()
    manager = EscalationManager()

    if args.command == "record":
        manager.record_failure(args.bead_id, args.reason, args.stage)
        print(f"Recorded failure for {args.bead_id}")
        print(manager.get_failure_summary(args.bead_id))

    elif args.command == "context":
        context = manager.get_context(args.bead_id)
        if context:
            print(json.dumps(context, indent=2))
        else:
            print(f"No escalation context for {args.bead_id}")

    elif args.command == "reset":
        manager.reset(args.bead_id)
        print(f"Reset escalation tracking for {args.bead_id}")

    elif args.command == "summary":
        print(manager.get_failure_summary(args.bead_id))


if __name__ == "__main__":
    main()
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/escalation.py
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/lib/escalation.py
git commit -m "feat: add escalation tracking module"
```

---

### Task 16: Integrate escalation into workflow

**Files:**
- Modify: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh`

**Step 1: Add escalation tracking to review rejection**

Update `send_review_rejection()` function to track failures:
```bash
# Send review rejection mail with escalation tracking
send_review_rejection() {
  local bead_id="$1"
  local stage="$2"
  local issues="$3"
  local from_agent="$4"
  local to_agent="$5"

  local stage_name
  if [[ "$stage" == "stage1" ]]; then
    stage_name="Spec Compliance"
  else
    stage_name="Code Quality"
  fi

  # Record failure for escalation tracking
  python3 maf/scripts/maf/lib/escalation.py record "$bead_id" "$issues" --stage "$stage"

  # Check if should give up
  if python3 maf/scripts/maf/lib/escalation.py context "$bead_id" | jq -e '.attempts >= 3' >/dev/null; then
    warn "Bead $bead_id has failed 3 times, reopening for revision"

    # Reopen bead with notes
    local failure_summary
    failure_summary=$(python3 maf/scripts/maf/lib/escalation.py summary "$bead_id")

    bd update "$bead_id" --status=reopen --notes="Escalated after 3 attempts:

$failure_summary

This bead needs revision or additional clarification."

    send_agent_mail \
      "$from_agent" \
      "$(get_mail_name_by_role "supervisor")" \
      "[$bead_id] Escalated - Reopening" \
      "Bead $bead_id has failed 3 times and has been reopened for revision.\n\n$failure_summary" \
      "high"

    return 2  # Special return code for escalation
  fi

  # Get guidance for this attempt
  local guidance
  guidance=$(python3 maf/scripts/maf/lib/escalation.py context "$bead_id" | jq -r '.current_guidance // ""')

  # Send rejection with guidance
  send_agent_mail \
    "$from_agent" \
    "$to_agent" \
    "[$bead_id] Stage Rejected - $stage_name (Attempt $(python3 maf/scripts/maf/lib/escalation.py context "$bead_id" | jq -r '.attempts'))" \
    "❌ Review stage FAILED\n\n**Issues:**\n$issues\n\n**Guidance:**\n$guidance"
}
```

**Step 2: Reset escalation on success**

After bead approved:
```bash
  # Reset escalation tracking on successful completion
  python3 maf/scripts/maf/lib/escalation.py reset "$bead_id"
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
git commit -m "feat: integrate escalation tracking into workflow"
```

---

### Task 17: Create escalation guidance prompt

**Files:**
- Create: `maf/templates/prompts/escalation-guidance.md`

**Step 1: Write escalation guidance template**

```markdown
# Escalation Guidance - Bead {{bead_id}}

You have received guidance for your {{attempt_number}} attempt.

## Failure Summary

{{failure_summary}}

## Guidance for This Attempt

{{guidance}}

## What to Do Next

1. Carefully review the feedback from your previous attempt(s)
2. Follow the guidance above
3. Make targeted fixes (don't rewrite everything)
4. Run tests to verify fixes
5. Run TDD check: `bash maf/scripts/maf/tdd-check.sh`
6. Resubmit for review

## Resources

- Bead description: `bd show {{bead_id}}`
- TDD verification: `python3 maf/scripts/maf/lib/tdd_enforcer.py {{bead_id}}`
- Review guidance: `maf/templates/prompts/reviewer-two-stage.md`

## Important

- Address ALL issues mentioned in the feedback
- Don't ignore the guidance - it's based on your previous failures
- If you're truly stuck, the bead may need revision after 3 attempts
- Focus on the specific issues, not a complete rewrite

Learn from each attempt. Each failure is information about what doesn't work.
```

**Step 2: Commit**

```bash
git add maf/templates/prompts/escalation-guidance.md
git commit -m "feat: add escalation guidance template"
```

---

## Phase 5: BV Integration (2 tasks)

### Task 18: Create BV integration module

**Files:**
- Create: `maf/scripts/maf/lib/bv_integration.py`

**Step 1: Write BV integration module**

```python
#!/usr/bin/env python3
"""
BV (Bead Vision) Integration

Integrates BV intelligent prioritization into BDD workflow.
"""

import subprocess
import json
from typing import List, Dict, Optional


class BVIntegration:
    """Integrates BV commands for intelligent bead prioritization."""

    def __init__(self, project_root: str = "."):
        self.project_root = project_root

    def robot_triage(self) -> List[Dict]:
        """
        Run BV robot triage to get prioritized beads.

        Returns:
            List of prioritized beads
        """
        result = subprocess.run(
            ["bv", "--robot-triage", "--json"],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            print(f"BV triage failed: {result.stderr}")
            return []

        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            print("Failed to parse BV output")
            return []

    def get_blocked_beads(self) -> List[Dict]:
        """
        Get beads that are blocked by dependencies.

        Returns:
            List of blocked beads with blockers
        """
        result = subprocess.run(
            ["bv", "--blocked", "--json"],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            return []

        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return []

    def get_progress(self) -> Dict:
        """
        Get current progress dashboard.

        Returns:
            Progress statistics
        """
        result = subprocess.run(
            ["bv", "--progress", "--json"],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            return {}

        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {}

    def prioritize_ready_beads(self, ready_beads: List[str]) -> List[str]:
        """
        Sort ready beads by BV priority.

        Args:
            ready_beads: List of ready bead IDs

        Returns:
            Sorted list of bead IDs by priority
        """
        triage_result = self.robot_triage()

        # Create priority map
        priority_map = {b['id']: b.get('priority', 'medium') for b in triage_result}

        # Sort ready beads by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2, 'unknown': 3}

        sorted_beads = sorted(
            ready_beads,
            key=lambda bead_id: priority_order.get(priority_map.get(bead_id, 'unknown'), 99)
        )

        return sorted_beads

    def show_progress_dashboard(self):
        """Display progress dashboard."""
        progress = self.get_progress()

        if not progress:
            print("No progress data available")
            return

        print("\n" + "="*60)
        print("📊 BEAD VISION PROGRESS DASHBOARD")
        print("="*60)

        total = progress.get('total', 0)
        completed = progress.get('completed', 0)
        in_progress = progress.get('in_progress', 0)
        pending = progress.get('pending', 0)

        print(f"Total:     {total}")
        print(f"✅ Completed:  {completed}")
        print(f"🔄 In Progress: {in_progress}")
        print(f"⏳ Pending:  {pending}")

        if total > 0:
            completion_pct = (completed / total) * 100
            print(f"\nCompletion: {completion_pct:.1f}%")

        print("="*60 + "\n")


def main():
    """CLI for BV integration."""
    import argparse

    parser = argparse.ArgumentParser(description="BV integration for BDD workflow")
    parser.add_argument("--triage", action="store_true", help="Run robot triage")
    parser.add_argument("--blocked", action="store_true", help="Get blocked beads")
    parser.add_argument("--progress", action="store_true", help="Show progress")
    parser.add_argument("--prioritize", nargs="+", metavar="BEAD_ID",
                        help="Prioritize list of bead IDs")

    args = parser.parse_args()
    bv = BVIntegration()

    if args.triage:
        beads = bv.robot_triage()
        print(json.dumps(beads, indent=2))

    elif args.blocked:
        beads = bv.get_blocked_beads()
        print(json.dumps(beads, indent=2))

    elif args.progress:
        bv.show_progress_dashboard()

    elif args.prioritize:
        sorted_beads = bv.prioritize_ready_beads(args.prioritize)
        print("Prioritized order:")
        for i, bead_id in enumerate(sorted_beads, 1):
            print(f"  {i}. {bead_id}")


if __name__ == "__main__":
    main()
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/bv_integration.py
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/lib/bv_integration.py
git commit -m "feat: add BV integration module"
```

---

### Task 19: Integrate BV into workflow

**Files:**
- Modify: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh`

**Step 1: Add BV triage to autonomous_loop**

Add in autonomous_loop after initial audit:
```bash
  # Run BV triage for intelligent prioritization
  log "Running BV robot triage for prioritization..."
  python3 maf/scripts/maf/lib/bv_integration.py --triage > /tmp/bv-triage.json
```

**Step 2: Update get_ready_ids to use BV prioritization**

Modify `get_ready_ids()` function:
```bash
get_ready_ids() {
  cd "$PROJECT_ROOT" || return 1
  
  # Get ready beads
  local ready_beads
  ready_beads=$(bd ready --json 2>/dev/null | jq -r '.[].id' 2>/dev/null || true)
  
  if [[ -z "$ready_beads" ]]; then
    return
  fi
  
  # Prioritize using BV
  local prioritized
  prioritized=$(python3 maf/scripts/maf/lib/bv_integration.py --prioritize $ready_beads)
  
  echo "$prioritized"
}
```

**Step 3: Add BV progress display**

Display progress after each group completion:
```bash
    # Show progress dashboard
    python3 maf/scripts/maf/lib/bv_integration.py --progress
```

**Step 4: Commit**

```bash
git add maf/scripts/maf/autonomous-workflow-3agent-bdd.sh
git commit -m "feat: integrate BV prioritization into workflow"
```

---

## Phase 6: Implementor Mail Callbacks (2 tasks)

### Task 20: Create implementor mail polling callback

**Files:**
- Create: `maf/scripts/maf/lib/implementor_poller_callback.py`

**Step 1: Write implementor mail callback**

```python
#!/usr/bin/env python3
"""
Implementor Mail Polling Callback

Handles review feedback and stage transitions.
"""

import subprocess
import sys
from pathlib import Path


def on_review_feedback(message, transition):
    """Callback when review feedback received."""
    if not transition:
        return

    bead_id = transition.get('bead_id')
    stage = transition.get('stage')
    action = transition.get('action')
    notes = transition.get('notes', '')

    if action == 'approved':
        print(f"\n✅ {bead_id} APPROVED!")
        print(notes)
        print("Starting next bead...")
        # Next bead will be assigned by workflow loop
        return

    if action == 'rejected':
        print(f"\n❌ {bead_id} REJECTED at {stage}")
        print(notes)
        print()
        print("Please:")
        print("1. Review the feedback")
        print("2. Fix the specific issues")
        print("3. Run tests: npm test (or pytest, mvn test)")
        print("4. Verify TDD: bash maf/scripts/maf/tdd-check.sh")
        print("5. Commit fixes: git commit -m 'fix: address review feedback'")
        print("6. Wait for next review cycle")
        return

    if stage == 'tdd' and action == 'complete':
        print(f"\n✅ TDD stage complete for {bead_id}")
        print("Proceeding to implementation...")
        return


def on_escalation_guidance(message, transition):
    """Callback when escalation guidance received."""
    if not transition or transition.get('stage') != 'escalation':
        return

    bead_id = transition.get('bead_id')
    notes = transition.get('notes', '')

    print(f"\n⚠️  ESCALATION GUIDANCE for {bead_id}")
    print(notes)
    print()
    print("This is your attempt feedback. Learn from it.")


if __name__ == "__main__":
    # This would be called by mail_poller.py
    from mail_poller import AgentMailPoller

    IMPLEMENTOR_MAIL = sys.argv[1]  # "RedPond"
    TOPOLOGY_FILE = sys.argv[2]  # ".maf/config/agent-topology.json"

    poller = AgentMailPoller(
        agent_name=IMPLEMENTOR_MAIL,
        topology_file=TOPOLOGY_FILE
    )

    print("🔄 Implementor mail poller starting...")
    print("   Will automatically handle review feedback")
    print()

    # Combined callback
    def handle_mail(message, transition):
        on_review_feedback(message, transition)
        on_escalation_guidance(message, transition)

    poller.poll_forever(callback=handle_mail)
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/lib/implementor_poller_callback.py
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/lib/implementor_poller_callback.py
git commit -m "feat: add implementor mail polling callback"
```

---

### Task 21: Update implementor TDD prompt to wait for mail

**Files:**
- Modify: `maf/templates/prompts/implementor-tdd.md`

**Step 1: Add mail waiting instruction**

Add to "After TDD Complete" section:
```markdown
## After TDD Complete

Once TDD workflow verified:

1. Commit changes:
   ```bash
   git add .
   git commit -m "feat({{bead_id}}): implement [feature] with TDD
   ```

2. Send completion mail to Reviewer:
   ```
   From: {{implementor_mail_name}}
   To: {{reviewer_mail_name}}
   Subject: [{{bead_id}}] TDD Complete - Ready for Review
   ```

3. **WAIT for review feedback**
   - Mail poller will notify you when review complete
   - If approved: Proceed to next bead
   - If rejected: Fix issues and resubmit

**DO NOT manually check mail.** The poller will notify you automatically.
```

**Step 2: Commit**

```bash
git add maf/templates/prompts/implementor-tdd.md
git commit -m "feat: update TDD prompt to wait for mail poller notification"
```

---

## Phase 7: Setup & Startup Scripts (3 tasks)

### Task 22: Create 3-agent BDD tmux setup script

**Files:**
- Create: `maf/scripts/setup/setup-3agent-bdd.sh`

**Step 1: Write setup script**

```bash
#!/bin/bash
# setup-3agent-bdd.sh - Create 3-agent BDD tmux session
# USAGE: bash maf/scripts/setup/setup-3agent-bdd.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source preflight for topology helpers
source "${PROJECT_ROOT}/maf/scripts/maf/preflight-gatekeeper.sh"

# Check topology
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "ERROR: Topology file not found: $TOPOLOGY_FILE"
  echo "Create one with:"
  echo "  cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json"
  exit 1
fi

# Get session info
SESSION_NAME=$(jq -r '.pod.session // "maf-bdd"' "$TOPOLOGY_FILE")
WINDOW_NAME=$(jq -r '.pod.window // "agents"' "$TOPOLOGY_FILE")

echo "🚀 Setting up 3-agent BDD tmux session..."
echo ""

# Kill existing session if exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Killing existing session..."
  tmux kill-session -t "$SESSION_NAME"
fi

# Create new session with 3 panes
echo "Creating tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -n "$WINDOW_NAME"
tmux split-window -t "$SESSION_NAME:$WINDOW_NAME"
tmux split-window -t "$SESSION_NAME:$WINDOW_NAME"
tmux select-layout -t "$SESSION_NAME:$WINDOW_NAME" even-horizontal

# Get agent names
SUPERVISOR_MAIL=$(get_mail_name_by_role "supervisor")
REVIEWER_MAIL=$(get_mail_name_by_role "reviewer")
IMPLEMENTOR_MAIL=$(get_mail_name_by_role "implementor")

echo "Session created with 3 panes:"
echo "  Pane 0: Supervisor ($SUPERVISOR_MAIL)"
echo "  Pane 1: Reviewer ($REVIEWER_MAIL)"
echo "  Pane 2: Implementor ($IMPLEMENTOR_MAIL)"
echo ""

# Start mail pollers in each pane
echo "Starting mail pollers..."

# Reviewer poller
echo "  Reviewer mail poller..."
tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.1" \
  "bash maf/scripts/maf/poll-agent-mail.sh reviewer" Enter

# Implementor poller
echo "  Implementor mail poller..."
tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.2" \
  "bash maf/scripts/maf/poll-agent-mail.sh implementor" Enter

echo ""
echo "✅ Setup complete!"
echo ""
echo "Session: $SESSION_NAME"
echo "Attach with: tmux attach -t $SESSION_NAME"
echo ""
echo "Panes:"
echo "  0: Supervisor (runs workflow loop)"
echo "  1: Reviewer (polls for completion, reviews automatically)"
echo "  2: Implementor (polls for feedback, implements beads)"
echo ""
echo "To start workflow:"
echo "  tmux send-keys -t $SESSION_NAME:$WINDOW_NAME.0 'bash maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --loop' Enter"
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/setup/setup-3agent-bdd.sh
```

**Step 3: Commit**

```bash
git add maf/scripts/setup/setup-3agent-bdd.sh
git commit -m "feat: add 3-agent BDD tmux setup script"
```

---

### Task 23: Create quick start script

**Files:**
- Create: `maf/scripts/maf/start-3agent-bdd.sh`

**Step 1: Write quick start script**

```bash
#!/bin/bash
# start-3agent-bdd.sh - Quick start for 3-agent BDD workflow
# USAGE: bash maf/scripts/maf/start-3agent-bdd.sh [--setup]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Handle --setup flag
if [[ "${1:-}" == "--setup" ]]; then
  echo "Setting up 3-agent BDD environment..."
  bash "$SCRIPT_DIR/setup/setup-3agent-bdd.sh"
  echo ""
  echo "Setup complete. Starting workflow..."
  echo ""
fi

# Check topology
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
if [[ ! -f "$TOPOLOGY_FILE" ]]; then
  echo "❌ Topology file not found: $TOPOLOGY_FILE"
  echo ""
  echo "Setup first:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
  exit 1
fi

# Get session info
SESSION_NAME=$(jq -r '.pod.session // "maf-bdd"' "$TOPOLOGY_FILE")
WINDOW_NAME=$(jq -r '.pod.window // "agents"' "$TOPOLOGY_FILE")

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "❌ TMUX session '$SESSION_NAME' not found"
  echo ""
  echo "Setup first:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
  exit 1
fi

# Check Agent Mail
if ! curl -s http://127.0.0.1:8765/health >/dev/null 2>&1; then
  echo "⚠️  Agent Mail MCP server not detected"
  echo "   Agents will work but mail notifications will fail"
  echo ""
fi

echo "🚀 Starting 3-agent BDD workflow..."
echo ""

# Start workflow loop in supervisor pane
tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.0" \
  "bash ${PROJECT_ROOT}/maf/scripts/maf/autonomous-workflow-3agent-bdd.sh --loop" Enter

echo "✅ Workflow started"
echo ""
echo "Monitor in tmux:"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo "Or watch individual panes:"
echo "  Supervisor: tmux attach -t $SESSION_NAME:$WINDOW_NAME.0"
echo "  Reviewer:   tmux attach -t $SESSION_NAME:$WINDOW_NAME.1"
echo "  Implementor: tmux attach -t $SESSION_NAME:$WINDOW_NAME.2"
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/start-3agent-bdd.sh
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/start-3agent-bdd.sh
git commit -m "feat: add 3-agent BDD quick start script"
```

---

### Task 24: Create status command

**Files:**
- Create: `maf/scripts/maf/bdd-status.sh`

**Step 1: Write status command**

```bash
#!/bin/bash
# bdd-status.sh - Check status of 3-agent BDD workflow
# USAGE: bash maf/scripts/maf/bdd-status.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

source "${PROJECT_ROOT}/maf/scripts/maf/preflight-gatekeeper.sh"

TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"
SESSION_NAME=$(jq -r '.pod.session // "maf-bdd"' "$TOPOLOGY_FILE")
WINDOW_NAME=$(jq -r '.pod.window // "agents"' "$TOPOLOGY_FILE")

echo "📊 3-Agent BDD Workflow Status"
echo "=========================="
echo ""

# Check tmux session
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "✅ TMUX Session: $SESSION_NAME (running)"
  
  # Check each pane
  for pane in 0 1 2; do
    role=$(jq -r ".panes[$pane].role // \"unknown\"" "$TOPOLOGY_FILE")
    mail_name=$(jq -r ".panes[$pane].mail_name // \"unknown\"" "$TOPOLOGY_FILE")
    
    # Get pane status
    snapshot=$(tmux capture-pane -t "$SESSION_NAME:$WINDOW_NAME.$pane" -p -S -2 2>/dev/null || true)
    
    if echo "$snapshot" | grep -q "polling"; then
      status="🔄 Polling mail"
    elif echo "$snapshot" | grep -q "Implementing"; then
      status="⚙️  Implementing"
    elif echo "$snapshot" | grep -q "Reviewing"; then
      status="🔍 Reviewing"
    else
      status="💤 Idle"
    fi
    
    echo "  Pane $pane ($role/$mail_name): $status"
  done
else
  echo "❌ TMUX Session: Not running"
  echo ""
  echo "Start with:"
  echo "  bash maf/scripts/maf/start-3agent-bdd.sh --setup"
fi

echo ""

# Check Agent Mail
if curl -s http://127.0.0.1:8765/health >/dev/null 2>&1; then
  echo "✅ Agent Mail: Running"
else
  echo "❌ Agent Mail: Not running"
fi

echo ""

# Check ready beads
READY_COUNT=$(bd ready --json 2>/dev/null | jq 'length' || echo "0")
echo "📝 Ready Beads: $READY_COUNT"

# Check progress
echo ""
python3 "${SCRIPT_DIR}/lib/bv_integration.py" --progress 2>/dev/null || true
```

**Step 2: Make executable**

```bash
chmod +x maf/scripts/maf/bdd-status.sh
```

**Step 3: Commit**

```bash
git add maf/scripts/maf/bdd-status.sh
git commit -m "feat: add BDD workflow status command"
```

---

## Phase 8: Testing (5 tasks)

### Task 25: Create test for mail polling

**Files:**
- Create: `tests/workflow/test-mail-polling.sh`

**Step 1: Write mail polling test**

```bash
#!/bin/bash
# Test mail polling functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: Python poller module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/mail_poller.py"
echo "✅ Mail poller module exists"

# Test: Poller module is importable
python3 -c "import sys; sys.path.append('$PROJECT_ROOT'); import maf.scripts.maf.lib.mail_poller" 2>/dev/null
echo "✅ Mail poller module imports"

# Test: Poller script is executable
test -x "$PROJECT_ROOT/maf/scripts/maf/poll-agent-mail.sh"
echo "✅ Poller script executable"

# Test: Can create poller instance
python3 <<'PYTHON'
import sys
sys.path.append('/root/projects/maf-github')
from maf.scripts.maf.lib.mail_poller import AgentMailPoller

poller = AgentMailPoller("TestAgent", "/root/projects/maf-github/.maf/config/agent-topology.json")
assert poller.agent_name == "TestAgent"
assert poller.polling_interval == 10
print("✅ Poller instantiable")
PYTHON

echo "✅ All mail polling tests passed"
```

**Step 2: Commit**

```bash
git add tests/workflow/test-mail-polling.sh
git commit -m "test: add mail polling tests"
```

---

### Task 26: Create test for TDD enforcement

**Files:**
- Create: `tests/workflow/test-tdd-enforcement.sh`

**Step 1: Write TDD enforcement test**

```bash
#!/bin/bash
# Test TDD enforcement functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: TDD enforcer module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/tdd_enforcer.py"
echo "✅ TDD enforcer module exists"

# Test: TDD prompt template exists
test -f "$PROJECT_ROOT/maf/templates/prompts/implementor-tdd.md"
echo "✅ TDD prompt template exists"

# Test: TDD check command exists
test -x "$PROJECT_ROOT/maf/scripts/maf/tdd-check.sh"
echo "✅ TDD check command exists"

# Test: TDD enforcer is importable
python3 <<'PYTHON'
import sys
sys.path.append('/root/projects/maf-github')
from maf.scripts.maf.lib.tdd_enforcer import TDDEnforcer

enforcer = TDDEnforcer("/root/projects/maf-github")
assert enforcer.project_root is not None
print("✅ TDD enforcer instantiable")
PYTHON

echo "✅ All TDD enforcement tests passed"
```

**Step 2: Commit**

```bash
git add tests/workflow/test-tdd-enforcement.sh
git commit -m "test: add TDD enforcement tests"
```

---

### Task 27: Create test for two-stage review

**Files:**
- Create: `tests/workflow/test-two-stage-review.sh`

**Step 1: Write two-stage review test**

```bash
#!/bin/bash
# Test two-stage review functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: Reviewer module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/reviewer.py"
echo "✅ Reviewer module exists"

# Test: Reviewer prompt template exists
test -f "$PROJECT_ROOT/maf/templates/prompts/reviewer-two-stage.md"
echo "✅ Reviewer prompt template exists"

# Test: Review command exists
test -x "$PROJECT_ROOT/maf/scripts/maf/review-bead.sh"
echo "✅ Review command exists"

# Test: Reviewer is importable
python3 <<'PYTHON'
import sys
sys.path.append('/root/projects/maf-github')
from maf.scripts.maf.lib.reviewer import TwoStageReviewer

reviewer = TwoStageReviewer("/root/projects/maf-github")
assert reviewer.project_root is not None
print("✅ Reviewer instantiable")
PYTHON

echo "✅ All two-stage review tests passed"
```

**Step 2: Commit**

```bash
git add tests/workflow/test-two-stage-review.sh
git commit -m "test: add two-stage review tests"
```

---

### Task 28: Create test for escalation

**Files:**
- Create: `tests/workflow/test-escalation.sh`

**Step 1: Write escalation test**

```bash
#!/bin/bash
# Test escalation functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test: Escalation module exists
test -f "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py"
echo "✅ Escalation module exists"

# Test: Escalation guidance template exists
test -f "$PROJECT_ROOT/maf/templates/prompts/escalation-guidance.md"
echo "✅ Escalation guidance template exists"

# Test: Can record failure
TEMP_STATE="/tmp/test-escalation-$$.json"
python3 "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py" record "TEST-BEAD" "Test failure" --stage "stage1"
echo "✅ Can record escalation failure"

# Test: Can get context
python3 "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py" context "TEST-BEAD" >/dev/null
echo "✅ Can get escalation context"

# Test: Can reset
python3 "$PROJECT_ROOT/maf/scripts/maf/lib/escalation.py" reset "TEST-BEAD"
echo "✅ Can reset escalation"

# Cleanup
rm -f /tmp/maf-escalation-state.json

echo "✅ All escalation tests passed"
```

**Step 2: Commit**

```bash
git add tests/workflow/test-escalation.sh
git commit -m "test: add escalation tests"
```

---

### Task 29: Create integration test

**Files:**
- Create: `tests/workflow/test-3agent-bdd-integration.sh`

**Step 1: Write integration test**

```bash
#!/bin/bash
# Integration test for 3-agent BDD workflow

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🧪 Running 3-Agent BDD Integration Tests"
echo "========================================"
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
  echo "✅ Module exists: $module"
done

# Test: All templates exist
TEMPLATES=(
  "maf/templates/prompts/implementor-tdd.md"
  "maf/templates/prompts/reviewer-two-stage.md"
  "maf/templates/prompts/escalation-guidance.md"
)

for template in "${TEMPLATES[@]}"; do
  test -f "$PROJECT_ROOT/$template"
  echo "✅ Template exists: $template"
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
  echo "✅ Script executable: $script"
done

# Test: Workflow script exists and has BDD features
WORKFLOW_SCRIPT="$PROJECT_ROOT/maf/scripts/maf/autonomous-workflow-3agent-bdd.sh"
test -f "$WORKFLOW_SCRIPT"
echo "✅ Workflow script exists"

grep -q "TDD" "$WORKFLOW_SCRIPT"
echo "✅ Workflow mentions TDD"

grep -q "two-stage" "$WORKFLOW_SCRIPT"
echo "✅ Workflow mentions two-stage review"

grep -q "escalation" "$WORKFLOW_SCRIPT"
echo "✅ Workflow mentions escalation"

grep -q "poll.*mail" "$WORKFLOW_SCRIPT"
echo "✅ Workflow mentions mail polling"

# Test: Topology has BDD config
TOPOLOGY_FILE="$PROJECT_ROOT/.maf/config/agent-topology.json"
if [[ -f "$TOPOLOGY_FILE" ]]; then
  jq -e '.bdd_config' "$TOPOLOGY_FILE" >/dev/null
  echo "✅ Topology has BDD config"
fi

echo ""
echo "✅ All integration tests passed!"
```

**Step 2: Commit**

```bash
git add tests/workflow/test-3agent-bdd-integration.sh
git commit -m "test: add 3-agent BDD integration test"
```

---

## Phase 9: Documentation (3 tasks)

### Task 30: Create user guide

**Files:**
- Create: `docs/3-agent-bdd-user-guide.md`

**Step 1: Write comprehensive user guide**

```markdown
# 3-Agent BDD Workflow User Guide

## Overview

The 3-Agent BDD Workflow provides autonomous bead execution with:
- **TDD Enforcement**: Tests written first, watched fail, then implementation
- **Two-Stage Review**: Spec compliance → Code quality
- **Escalation**: Progressive guidance after failures
- **Active Mail Polling**: Autonomous stage transitions
- **BV Integration**: Intelligent bead prioritization

## Quick Start

### 1. Setup

```bash
# Create topology from template
cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json

# Edit topology with your agent names
vim .maf/config/agent-topology.json
```

### 2. Start

```bash
# Setup and start in one command
bash maf/scripts/maf/start-3agent-bdd.sh --setup
```

### 3. Monitor

```bash
# Check status
bash maf/scripts/maf/bdd-status.sh

# Attach to tmux session
tmux attach -t maf-bdd
```

## Architecture

### Agents

| Pane | Role | Mail Name | Responsibility |
|------|------|-----------|----------------|
| 0 | Supervisor | OrangeDog | Coordinates workflow, handles escalations |
| 1 | Reviewer | PurpleBear | Two-stage review, polls for completion |
| 2 | Implementor | RedPond | Implements beads with TDD, polls for feedback |

### Workflow

```
1. Supervisor assigns ready bead (prioritized by BV)
   ↓
2. Implementor receives via tmux + Agent Mail
   ↓
3. Implementor follows TDD:
   - Write test
   - Watch it fail (RED)
   - Write code (GREEN)
   - Refactor (REFACTOR)
   ↓
4. Implementor sends "Ready for review" mail
   ↓
5. Reviewer poller detects mail, runs two-stage review:
   - Stage 1: Spec compliance (all requirements met?)
   - Stage 2: Code quality (well-built?)
   ↓
6a. If passed: Approve and close bead
6b. If failed: Send rejection with feedback
   ↓
7. Implementor poller detects feedback, fixes issues
   ↓
8. If 3 failures: Escalate, reopen for revision
```

## Mail Polling

Each agent polls Agent Mail every 10 seconds for new messages:

**Implementor polls for:**
- Review rejections (Stage 1 or Stage 2)
- Escalation guidance

**Reviewer polls for:**
- "Ready for review" messages
- Automatically runs two-stage review

**Supervisor polls for:**
- Escalation requests
- Audit alerts

## TDD Workflow

Implementors MUST follow TDD:

1. **Write test first** - No code before test
2. **Watch test fail** - Verify it fails correctly (assertion, not syntax error)
3. **Write minimal code** - Just enough to pass
4. **Watch test pass** - All tests passing
5. **Refactor** - Clean up
6. **Repeat** for next behavior

Verify TDD:
```bash
bash maf/scripts/maf/tdd-check.sh
```

## Two-Stage Review

### Stage 1: Spec Compliance

**Question:** Did we build EXACTLY what was requested?

- All requirements from spec implemented?
- No extra features (YAGNI)?
- Edge cases covered?
- Dependencies handled?
- Receipt generated?

### Stage 2: Code Quality

**Question:** Is the implementation well-built?

- Tests exist and pass?
- Code follows patterns?
- No security issues?
- Error handling?
- No hardcoded values?
- Performance acceptable?
- Clean code?

## Escalation System

After each failure:

**Attempt 1:** "Review the error and try again"

**Attempt 2:** "Try different approach. Issue recurring at same stage."

**Attempt 3:** "Consider alternative architecture or bead revision"

After 3 failures: Bead reopened with notes.

## BV Integration

Bead Vision (BV) provides intelligent prioritization:

- **High priority:** Blockers, critical path
- **Medium priority:** Standard features
- **Low priority:** Nice-to-have

Workflow uses BV to:
- Prioritize ready beads
- Show progress dashboard
- Identify blocked beads

## Commands

| Command | Purpose |
|---------|---------|
| `start-3agent-bdd.sh --setup` | Setup and start workflow |
| `bdd-status.sh` | Check workflow status |
| `tdd-check.sh` | Verify TDD workflow |
| `review-bead.sh <bead-id>` | Manual review |
| `poll-agent-mail.sh <role>` | Start mail poller |

## Troubleshooting

### Workflow not assigning beads

- Check: `bash maf/scripts/maf/bdd-status.sh`
- Verify ready beads: `bd ready`
- Check implementor not stuck: Attach to pane 2

### Mail not being sent/received

- Verify Agent Mail running: `curl http://127.0.0.1:8765/health`
- Check mail names in topology match Agent Mail
- Restart mail pollers in each pane

### Review not happening automatically

- Check reviewer pane (1) is running poller
- Look for "🔄 Reviewer mail poller starting" message
- Verify implementor sent completion mail

### Escalation not working

- Check escalation state: `/tmp/maf-escalation-state.json`
- Reset: `python3 maf/scripts/maf/lib/escalation.py reset <bead-id>`

## Advanced

### Customizing BDD Config

Edit `bdd_config` in topology:

```json
{
  "bdd_config": {
    "tdd_enforced": true,
    "two_stage_review": true,
    "escalation_max_attempts": 3,
    "mail_polling_interval_seconds": 10,
    "stage_timeout_minutes": 30
  }
}
```

### Adding Custom Hooks

Use existing hook system (`.maf/config/custom-workflow-hooks.sh`):

```bash
CUSTOM_HOOK_BEFORE_ASSIGN() {
  local bead_id="$1"
  # Custom logic
}
```

### Manual Review

If automatic review fails:

```bash
# Attach to reviewer pane
tmux attach -t maf-bdd:agents.1

# Run manual review
bash maf/scripts/maf/review-bead.sh BEAD-123
```

## Best Practices

1. **Always follow TDD** - No shortcuts, no exceptions
2. **Write clear tests** - One behavior per test
3. **Don't argue with review** - Fix and resubmit
4. **Watch poller output** - Stay informed of stage transitions
5. **Check status regularly** - `bash maf/scripts/maf/bdd-status.sh`

## Comparison to Other Workflows

| Feature | 4-Agent | 3-Agent Simple | 3-Agent BDD |
|---------|---------|----------------|--------------|
| Agents | 4 | 3 | 3 |
| Memory | High | Medium | Medium |
| TDD Enforced | No | No | Yes |
| Two-Stage Review | No | No | Yes |
| Escalation | No | No | Yes |
| Mail Polling | Passive | Passive | Active |
| BV Integration | No | No | Yes |

Choose 3-Agent BDD for:
- Memory efficiency
- Quality enforcement
- Autonomous operation
- Minimal supervision
```

**Step 2: Commit**

```bash
git add docs/3-agent-bdd-user-guide.md
git commit -m "docs: add 3-agent BDD workflow user guide"
```

---

### Task 31: Update README

**Files:**
- Modify: `README.md` or `maf/README.md`

**Step 1: Add 3-agent BDD section**

Add to README:
```markdown
## Workflows

MAF supports multiple autonomous workflow configurations:

### 4-Agent Workflow (Default)
- Supervisor + Reviewer + 2 Implementors
- Parallel implementation capacity
- See: `maf/scripts/maf/autonomous-workflow.sh`

### 3-Agent BDD Workflow
- Supervisor + Reviewer + 1 Implementor
- TDD enforced, two-stage review, escalation
- Active mail polling, BV integration
- Memory efficient, autonomous quality
- See: `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh`
- Guide: `docs/3-agent-bdd-user-guide.md`
- Quick Start: `bash maf/scripts/maf/start-3agent-bdd.sh --setup`

### Choosing a Workflow

| Factor | 4-Agent | 3-Agent BDD |
|--------|---------|-------------|
| Memory Usage | Higher | Lower |
| Parallel Implementation | Yes | No |
| TDD Enforced | No | Yes |
| Two-Stage Review | No | Yes |
| Escalation System | No | Yes |
| Autonomy | Medium | High |
| Use Case | High-volume production | Quality-focused autonomous |
```

**Step 2: Commit**

```bash
git add README.md maf/README.md
git commit -m "docs: add 3-agent BDD workflow to README"
```

---

### Task 32: Create architecture diagram

**Files:**
- Create: `docs/3-agent-bdd-architecture.md`

**Step 1: Write architecture documentation**

```markdown
# 3-Agent BDD Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      TMUX Session (maf-bdd)                  │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────┐ │
│  │ Supervisor│  │ Reviewer  │  │    Implementor          │ │
│  │  Pane 0   │  │  Pane 1   │  │      Pane 2            │ │
│  │ OrangeDog │  │ PurpleBear│  │      RedPond            │ │
│  │           │  │           │  │                         │ │
│  │ - Workflow│  │ - Polls   │  │ - Polls for feedback    │ │
│  │ - Loop    │  │   mail    │  │ - Implements with TDD   │ │
│  │ - BV      │  │ - Reviews │  │ - Sends completion mail │ │
│  │ - Handle  │  │ - Stages  │  │ - Waits for review     │ │
│  │   escal.  │  │   1 & 2   │  │ - Fixes issues          │ │
│  └─────┬─────┘  └─────┬─────┘  └──────────┬──────────────┘ │
│        │              │                    │                │
└────────┼──────────────┼────────────────────┼────────────────┘
         │              │                    │
         └──────────────┴────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │   Agent Mail MCP Server     │
         │   (Workflow Bus)             │
         │   http://127.0.0.1:8765     │
         └──────────────┬──────────────┘
                        │
         ┌──────────────┴──────────────┐
         │    Mail Polling Library     │
         │   (mail_poller.py)          │
         │   - Polls every 10s         │
         │   - Parses stage transitions│
         │   - Triggers callbacks      │
         └─────────────────────────────┘
```

## Data Flow

### Bead Assignment Flow

```
[Supervisor]
    │
    ├─ BV Triage → Prioritized beads
    │
    ├─ Get ready beads
    │
    ├─ Check implementor availability
    │
    └─ Send via tmux: "bd start BEAD-123"
        + Send mail: "BEAD-123 assigned"
            │
            ▼
[Implementor] (receives tmux command + mail notification)
    │
    ├─ Follow TDD workflow
    │   ├─ Write test
    │   ├─ Verify fails (RED)
    │   ├─ Write code (GREEN)
    │   └─ Verify passes
    │
    ├─ Run: bash maf/scripts/maf/tdd-check.sh
    │
    ├─ Commit changes
    │
    └─ Send mail: "BEAD-123 ready for review"
        │
        ▼ (Reviewer poller detects)
[Reviewer]
    │
    ├─ Run Stage 1: Spec compliance
    │   ├─ All requirements met?
    │   └─ No extra features?
    │
    ├─ If Stage 1 failed → Send rejection mail
    │                         │
    │                         └────► (Implementor poller detects, fixes)
    │
    ├─ Run Stage 2: Code quality
    │   ├─ Tests pass?
    │   └─ No security issues?
    │
    ├─ If Stage 2 failed → Send rejection mail
    │                         │
    │                         └────► (Implementor poller detects, fixes)
    │
    └─ If both passed → Send approval + close bead
```

### Escalation Flow

```
[Reviewer] rejects bead
    │
    ▼
[Escalation Module] records failure
    │
    ├─ Attempt 1 → Guidance: "Review error and try again"
    ├─ Attempt 2 → Guidance: "Try different approach"
    └─ Attempt 3 → Guidance: "Consider alternative architecture"
                    │
                    ▼
[Supervisor] reopens bead with notes
```

## Component Interactions

### Mail Polling Callbacks

**Reviewer Callback:**
```python
def on_review_request(message, transition):
    bead_id = transition['bead_id']
    # Run two-stage review
    bash review-bead.sh $bead_id
    # Send result mail automatically
```

**Implementor Callback:**
```python
def on_review_feedback(message, transition):
    if transition['action'] == 'approved':
        # Start next bead
    elif transition['action'] == 'rejected':
        # Fix issues and resubmit
```

**Supervisor Callback:**
```python
def on_escalation_request(message, transition):
    # Handle escalation
    # May reopen bead or provide guidance
```

### Stage Transitions

```
Stage transitions flow through Agent Mail:

[Implementor] ──TDD complete──> [Reviewer Mailbox]
                                      │
                          (poll every 10s)
                                      ▼
                               [Reviewer detects]
                                      │
                        ┌─Stage 1 pass──┤──Stage 1 fail──┐
                        ▼               ▼                ▼
                   [Stage 2]    [Implementor]    [Implementor]
                        │          fixes           fixes
                ┌─Stage 2 pass──┤──Stage 2 fail──┐
                ▼               ▼                ▼
            [Approved]    [Implementor]    [Implementor]
                │          fixes           fixes
                ▼
          [Close bead]
```

## Key Files

### Core Workflow
- `maf/scripts/maf/autonomous-workflow-3agent-bdd.sh` - Main loop
- `maf/scripts/maf/start-3agent-bdd.sh` - Quick start
- `maf/scripts/maf/bdd-status.sh` - Status check

### Python Libraries
- `maf/scripts/maf/lib/mail_poller.py` - Mail polling
- `maf/scripts/maf/lib/tdd_enforcer.py` - TDD verification
- `maf/scripts/maf/lib/reviewer.py` - Two-stage review
- `maf/scripts/maf/lib/escalation.py` - Escalation tracking
- `maf/scripts/maf/lib/bv_integration.py` - BV integration

### Templates
- `maf/templates/prompts/implementor-tdd.md` - TDD instructions
- `maf/templates/prompts/reviewer-two-stage.md` - Review instructions
- `maf/templates/prompts/escalation-guidance.md` - Escalation help

### Configuration
- `.maf/config/agent-topology.json` - Agent topology
- `.maf/config/custom-workflow-hooks.sh` - Custom hooks

## Communication Protocol

### Mail Subjects

| Subject | Meaning | Action |
|---------|---------|--------|
| `[BEAD-123] assigned` | Bead assigned to implementor | Start TDD |
| `[BEAD-123] ready for review` | TDD complete, awaiting review | Run two-stage review |
| `[BEAD-123] Stage 1 FAILED` | Spec compliance issue | Fix and resubmit |
| `[BEAD-123] Stage 2 FAILED` | Code quality issue | Fix and resubmit |
| `[BEAD-123] APPROVED` | Both stages passed | Close bead |
| `[BEAD-123] Escalation` | Failure guidance | Follow guidance |

### Mail Body Format

Structured for programmatic parsing:

```
From: {agent_mail_name}
To: {recipient_mail_name}
Subject: [{bead_id}] {action} - {stage}

{structured_content}

Details:
- Bead: {bead_id}
- Stage: {stage_name}
- Status: {passed/failed}
- Notes: {specific_feedback}
```

## Technology Stack

- **Bash**: Workflow orchestration
- **Python 3**: Mail polling, verification modules
- **tmux**: Persistent agent sessions
- **jq**: JSON processing
- **bd**: Bead management
- **Agent Mail MCP**: Inter-agent communication
- **BV (Bead Vision)**: Intelligent prioritization
```

**Step 2: Commit**

```bash
git add docs/3-agent-bdd-architecture.md
git commit -m "docs: add 3-agent BDD architecture documentation"
```

---

## Summary

**Total tasks:** 32
**Estimated time:** ~10-12 hours of focused work

**Files Created:** 25+
- 5 Python modules (polling, TDD, review, escalation, BV)
- 3 Prompt templates (TDD, review, escalation)
- 5 Shell scripts (setup, start, status, commands)
- 5 Test files
- 4 Documentation files

**Key Features:**
1. ✅ 3-agent topology (supervisor + reviewer + implementor)
2. ✅ Active mail polling (every 10s)
3. ✅ TDD enforcement (test → fail → code → pass)
4. ✅ Two-stage review (spec → quality)
5. ✅ Escalation system (3 attempts with progressive guidance)
6. ✅ BV integration (intelligent prioritization)
7. ✅ Autonomous stage transitions
8. ✅ All 8 customization hooks preserved

**Execution Order:**
1. Phase 1: Foundation (Tasks 1-5) - MUST START HERE
2. Phase 2: TDD (Tasks 6-9)
3. Phase 3: Two-Stage Review (Tasks 10-14)
4. Phase 4: Escalation (Tasks 15-17)
5. Phase 5: BV (Tasks 18-19)
6. Phase 6: Implementor Callbacks (Tasks 20-21)
7. Phase 7: Setup (Tasks 22-24)
8. Phase 8: Testing (Tasks 25-29)
9. Phase 9: Documentation (Tasks 30-32)

**Next action:** Start with Task 1 (Create 3-agent BDD topology file)

