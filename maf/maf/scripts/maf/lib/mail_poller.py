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
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentMailPoller:
    """Polls Agent Mail for new messages and triggers BDD workflow actions."""

    # Stage pattern constants
    STAGE_TDD_PATTERNS = ['TDD Stage Complete', 'TDD verification']
    STAGE_1_PATTERNS = ['Stage 1', 'spec compliance']
    STAGE_2_PATTERNS = ['Stage 2', 'code quality']
    STAGE_REVIEW_PATTERNS = ['Ready for review']
    STAGE_ESCALATION_PATTERNS = ['Escalation']
    ACTION_APPROVED_PATTERNS = ['PASSED', 'approved']
    ACTION_REJECTED_PATTERNS = ['FAILED', 'rejected']

    # Configuration constants
    DEFAULT_MAX_PROCESSED_MESSAGES = 10000
    DEFAULT_COMMAND_TIMEOUT = 30  # seconds

    def __init__(self, agent_name: str, topology_file: str, polling_interval: int = 10,
                 max_processed_messages: int = DEFAULT_MAX_PROCESSED_MESSAGES):
        """
        Initialize mail poller.

        Args:
            agent_name: Agent's mail name (e.g., "RedPond")
            topology_file: Path to agent-topology.json
            polling_interval: Seconds between polls (default: 10, min: 1)
            max_processed_messages: Maximum messages to track (default: 10000)

        Raises:
            ValueError: If validation fails
        """
        # Validate agent_name format (alphanumeric, hyphen, underscore only)
        if not re.match(r'^[A-Za-z0-9_-]+$', agent_name):
            raise ValueError(
                f"Invalid agent_name '{agent_name}'. "
                "Only alphanumeric, hyphen, and underscore allowed."
            )

        # Validate polling_interval
        if polling_interval < 1:
            raise ValueError(
                f"Invalid polling_interval {polling_interval}. "
                "Must be >= 1 second."
            )

        # Validate max_processed_messages
        if max_processed_messages < 1:
            raise ValueError(
                f"Invalid max_processed_messages {max_processed_messages}. "
                "Must be >= 1."
            )

        self.agent_name = agent_name
        self.topology_file = Path(topology_file).resolve()  # Convert to absolute path
        self.polling_interval = polling_interval
        self.max_processed_messages = max_processed_messages
        self.last_check = datetime.now()
        self.processed_messages = set()
        self.topology = self._load_topology()
        self._validate_topology()

    def _load_topology(self) -> Dict:
        """Load agent topology file."""
        try:
            with open(self.topology_file) as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Topology file not found: {self.topology_file}")
            print(f"ERROR: Topology file not found: {self.topology_file}")
            sys.exit(2)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in topology file {self.topology_file}: {e}")
            print(f"ERROR: Invalid JSON in topology file: {e}")
            sys.exit(2)

    def _validate_topology(self):
        """Validate topology structure after loading."""
        if not isinstance(self.topology, dict):
            raise ValueError("Topology must be a dictionary")

        if "panes" not in self.topology:
            raise ValueError("Topology must contain 'panes' key")

        if not isinstance(self.topology["panes"], list):
            raise ValueError("Topology 'panes' must be a list")

        # Validate each pane has required fields
        for i, pane in enumerate(self.topology["panes"]):
            if not isinstance(pane, dict):
                raise ValueError(f"Pane {i} must be a dictionary")
            if "role" not in pane:
                logger.warning(f"Pane {i} missing 'role' field")
            if "mail_name" not in pane:
                logger.warning(f"Pane {i} missing 'mail_name' field")

    def _get_mail_name_by_role(self, role: str) -> Optional[str]:
        """Get mail name by role from topology."""
        for pane in self.topology.get("panes", []):
            if pane.get("role") == role:
                return pane.get("mail_name")
        return None

    def _run_command(self, cmd: List[str]) -> str:
        """
        Run shell command and return output.

        Raises:
            subprocess.TimeoutExpired: If command times out
            subprocess.CalledProcessError: If command returns non-zero exit code
        """
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.DEFAULT_COMMAND_TIMEOUT,
                check=True
            )
            return result.stdout
        except subprocess.TimeoutExpired as e:
            logger.error(f"Command timed out after {self.DEFAULT_COMMAND_TIMEOUT}s: {' '.join(cmd)}")
            if e.stderr:
                logger.error(f"stderr: {e.stderr}")
            raise
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed with exit code {e.returncode}: {' '.join(cmd)}")
            if e.stderr:
                logger.error(f"stderr: {e.stderr}")
            if e.stdout:
                logger.error(f"stdout: {e.stdout}")
            raise

    def fetch_new_mail(self) -> List[Dict]:
        """
        Fetch new mail messages since last check.

        Returns:
            List of new mail message dictionaries
        """
        # Run agent-mail-fetch script with absolute path
        script_dir = Path(__file__).parent.parent.parent.parent  # Go up to maf/scripts/
        script_path = script_dir / "maf" / "agent-mail-fetch.sh"

        if not script_path.exists():
            # Fallback to relative path from script location
            script_path = Path(__file__).parent.parent.parent / "maf" / "agent-mail-fetch.sh"

        cmd = ["bash", str(script_path.resolve()), self.agent_name]

        try:
            output = self._run_command(cmd)
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            logger.error(f"Failed to fetch mail: {e}")
            return []

        if not output.strip():
            return []

        # Parse mail output (assume JSON or structured text format)
        messages = self._parse_mail_output(output)

        # Filter out already processed messages
        new_messages = [
            msg for msg in messages
            if msg.get("id") not in self.processed_messages
        ]

        # Mark as processed and manage memory
        for msg in new_messages:
            msg_id = msg.get("id", "")
            if msg_id:
                self.processed_messages.add(msg_id)

        # Prune old messages if limit exceeded
        self._prune_processed_messages()

        self.last_check = datetime.now()
        return new_messages

    def _prune_processed_messages(self):
        """Prune old processed messages when limit is exceeded."""
        if len(self.processed_messages) > self.max_processed_messages:
            # Convert to list, remove oldest entries
            messages_list = list(self.processed_messages)
            removed_count = len(messages_list) - self.max_processed_messages
            self.processed_messages = set(messages_list[removed_count:])
            logger.info(
                f"Pruned {removed_count} old processed messages "
                f"(limit: {self.max_processed_messages})"
            )

    def _parse_mail_output(self, output: str) -> List[Dict]:
        """
        Parse agent-mail-fetch output into structured messages.

        The script outputs JSON when called, with messages in this format:
        [{"id": "...", "from": "...", "subject": "...", ...}, ...]

        Also handles fallback text format:
        From: RedPond
        To: PurpleBear
        Subject: [BEAD-123] TDD Stage Complete
        Body: Tests written and verified to fail correctly
        """
        messages = []

        # Try to parse as JSON first (primary format)
        try:
            data = json.loads(output)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and 'result' in data:
                # Handle MCP JSON-RPC response format
                result = data.get('result', {})
                if isinstance(result, dict):
                    structured = result.get('structuredContent', result)
                    messages = structured.get('result', structured.get('messages', []))
                    if isinstance(messages, list):
                        return messages
            elif isinstance(data, dict) and 'messages' in data:
                return data['messages']
        except (json.JSONDecodeError, KeyError, TypeError):
            # Fall back to text parsing
            pass

        # Fallback: parse as text format
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

        body_lower = body.lower()

        # Parse stage transitions using constants
        # Check TDD stage
        if any(pattern in subject or pattern in body for pattern in self.STAGE_TDD_PATTERNS):
            return {
                'stage': 'tdd',
                'action': 'complete',
                'bead_id': bead_id,
                'notes': body
            }

        # Check Stage 1
        if any(pattern in subject or pattern in body_lower for pattern in self.STAGE_1_PATTERNS):
            if any(pattern in body or pattern in body_lower for pattern in self.ACTION_APPROVED_PATTERNS):
                return {
                    'stage': 'stage1',
                    'action': 'approved',
                    'bead_id': bead_id,
                    'notes': body
                }
            elif any(pattern in body or pattern in body_lower for pattern in self.ACTION_REJECTED_PATTERNS):
                return {
                    'stage': 'stage1',
                    'action': 'rejected',
                    'bead_id': bead_id,
                    'notes': body
                }

        # Check Stage 2
        if any(pattern in subject or pattern in body_lower for pattern in self.STAGE_2_PATTERNS):
            if any(pattern in body or pattern in body_lower for pattern in self.ACTION_APPROVED_PATTERNS):
                return {
                    'stage': 'stage2',
                    'action': 'approved',
                    'bead_id': bead_id,
                    'notes': body
                }
            elif any(pattern in body or pattern in body_lower for pattern in self.ACTION_REJECTED_PATTERNS):
                return {
                    'stage': 'stage2',
                    'action': 'rejected',
                    'bead_id': bead_id,
                    'notes': body
                }

        # Check Review stage
        if any(pattern in subject for pattern in self.STAGE_REVIEW_PATTERNS):
            return {
                'stage': 'review',
                'action': 'ready',
                'bead_id': bead_id,
                'notes': body
            }

        # Check Escalation stage
        if any(pattern in subject for pattern in self.STAGE_ESCALATION_PATTERNS):
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
                    print(f"Stage Transition: {transition['stage']} = {transition['action']}")
                    print(f"   Bead: {transition['bead_id']}")
                    print(f"   Notes: {transition['notes'][:100]}...")

        return len(new_messages)

    def poll_forever(self, callback=None):
        """Poll continuously forever."""
        logger.info(f"Starting mail poller for {self.agent_name}")
        logger.info(f"Polling interval: {self.polling_interval}s")
        logger.info(f"Max processed messages: {self.max_processed_messages}")
        print(f"Starting mail poller for {self.agent_name}")
        print(f"   Polling interval: {self.polling_interval}s")
        print(f"   Press Ctrl+C to stop")
        print()

        try:
            while True:
                try:
                    count = self.poll(callback)
                    if count > 0:
                        msg = f"Processed {count} new message(s)"
                        logger.info(msg)
                        print(msg)
                except Exception as e:
                    logger.error(f"Error during polling: {e}", exc_info=True)
                    print(f"ERROR: {e}")

                time.sleep(self.polling_interval)

        except KeyboardInterrupt:
            logger.info("Polling stopped by user")
            print("\nPolling stopped by user")
            sys.exit(0)


def main():
    """CLI entry point for mail poller."""
    import argparse

    parser = argparse.ArgumentParser(description="Poll Agent Mail for BDD workflow")
    parser.add_argument("--agent-name", required=True,
                        help="Agent's mail name (alphanumeric, hyphen, underscore only)")
    parser.add_argument("--topology-file", default=".maf/config/agent-topology.json",
                        help="Path to topology file")
    parser.add_argument("--interval", type=int, default=10,
                        help="Polling interval in seconds (minimum: 1)")
    parser.add_argument("--max-messages", type=int,
                        default=AgentMailPoller.DEFAULT_MAX_PROCESSED_MESSAGES,
                        help=f"Maximum processed messages to track (default: {AgentMailPoller.DEFAULT_MAX_PROCESSED_MESSAGES})")

    args = parser.parse_args()

    try:
        poller = AgentMailPoller(
            agent_name=args.agent_name,
            topology_file=args.topology_file,
            polling_interval=args.interval,
            max_processed_messages=args.max_messages
        )
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        print(f"ERROR: {e}")
        sys.exit(1)

    poller.poll_forever()


if __name__ == "__main__":
    main()
