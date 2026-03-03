#!/usr/bin/env python3
"""
Implementor Mail Polling Callback

Handles review feedback and stage transitions for implementor agents.
Integrates with mail_poller.py to automatically respond to Agent Mail messages.
"""

import subprocess
import sys
import re
import json
from pathlib import Path
from typing import Optional, Dict, Any


# Stage transition patterns for parsing
STAGE_PATTERNS = {
    'approved': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+APPROVED', re.IGNORECASE),
    'rejected': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+Stage\s+Rejected', re.IGNORECASE),
    'tdd_violation': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+TDD\s+Violation', re.IGNORECASE),
    'escalation': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+Escalation', re.IGNORECASE),
}


def parse_stage_transition(message: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """
    Parse Agent Mail message to extract stage transition info.

    Args:
        message: Agent Mail message dict with subject and body_md

    Returns:
        Dict with bead_id, stage, action, notes or None if not a transition
    """
    subject = message.get('subject', '')
    body = message.get('body_md', '')

    # Check for approval
    match = STAGE_PATTERNS['approved'].search(subject)
    if match:
        bead_id = match.group('bead_id')
        return {
            'bead_id': bead_id,
            'stage': 'review',
            'action': 'approved',
            'notes': body
        }

    # Check for rejection
    match = STAGE_PATTERNS['rejected'].search(subject)
    if match:
        bead_id = match.group('bead_id')
        return {
            'bead_id': bead_id,
            'stage': 'review',
            'action': 'rejected',
            'notes': body
        }

    # Check for TDD violation
    match = STAGE_PATTERNS['tdd_violation'].search(subject)
    if match:
        bead_id = match.group('bead_id')
        return {
            'bead_id': bead_id,
            'stage': 'tdd',
            'action': 'rejected',
            'notes': body
        }

    # Check for escalation
    match = STAGE_PATTERNS['escalation'].search(subject)
    if match:
        bead_id = match.group('bead_id')
        return {
            'bead_id': bead_id,
            'stage': 'escalation',
            'action': 'guidance',
            'notes': body
        }

    return None


def on_review_feedback(message: Dict[str, Any], transition: Dict[str, str]) -> None:
    """
    Callback when review feedback received.

    Handles:
    - Approval: Notify implementor and prepare for next bead
    - Rejection: Show feedback and guide fixes

    Args:
        message: Original Agent Mail message
        transition: Parsed transition info from parse_stage_transition()
    """
    if not transition:
        return

    bead_id = transition.get('bead_id')
    stage = transition.get('stage')
    action = transition.get('action')
    notes = transition.get('notes', '')

    if action == 'approved':
        print(f"\n{'='*60}")
        print(f"✅ {bead_id} APPROVED!")
        print(f"{'='*60}")
        if notes:
            print(f"\n{notes}")
        print("\n✓ Bead completed successfully")
        print("✓ Ready for next assignment")
        print("  (Next bead will be assigned by workflow loop)")
        return

    if action == 'rejected':
        print(f"\n{'='*60}")
        print(f"❌ {bead_id} REJECTED - {stage.upper()}")
        print(f"{'='*60}")
        if notes:
            print(f"\n{notes}")

        print("\n📋 Action Required:")
        print("   1. Carefully review the feedback above")
        print("   2. Fix the specific issues mentioned")
        print("   3. Run tests: npm test (or pytest, mvn test, bd test)")
        print("   4. Verify TDD: bash maf/scripts/maf/tdd-check.sh")
        print("   5. Commit fixes: git commit -m 'fix: address review feedback'")
        print("   6. Wait for next review cycle")
        print("\n💡 Tip: Focus on specific issues, not a complete rewrite")
        return


def on_tdd_violation(message: Dict[str, Any], transition: Dict[str, str]) -> None:
    """
    Callback when TDD violation detected.

    Args:
        message: Original Agent Mail message
        transition: Parsed transition info
    """
    bead_id = transition.get('bead_id')
    notes = transition.get('notes', '')

    print(f"\n{'='*60}")
    print(f"⚠️  TDD VIOLATION - {bead_id}")
    print(f"{'='*60}")

    if notes:
        print(f"\n{notes}")

    print("\n📋 Required Actions:")
    print("   1. Review TDD violations above")
    print("   2. Follow proper TDD workflow:")
    print("      - RED: Write failing test")
    print("      - GREEN: Write minimal passing code")
    print("      - REFACTOR: Clean up while tests pass")
    print("   3. Verify TDD: bash maf/scripts/maf/tdd-check.sh")
    print("   4. Resubmit for review")
    print("\n📚 Reference: maf/templates/prompts/implementor-tdd.md")


def on_escalation_guidance(message: Dict[str, Any], transition: Dict[str, str]) -> None:
    """
    Callback when escalation guidance received.

    Args:
        message: Original Agent Mail message
        transition: Parsed transition info
    """
    if not transition or transition.get('stage') != 'escalation':
        return

    bead_id = transition.get('bead_id')
    notes = transition.get('notes', '')

    print(f"\n{'='*60}")
    print(f"⚠️  ESCALATION GUIDANCE - {bead_id}")
    print(f"{'='*60}")

    if notes:
        print(f"\n{notes}")

    print("\n💡 This guidance is based on previous attempt failures.")
    print("   Follow the guidance to fix issues and pass review.")


def handle_mail_message(message: Dict[str, Any]) -> None:
    """
    Main handler for incoming Agent Mail messages.

    Routes messages to appropriate handlers based on content.

    Args:
        message: Agent Mail message dict
    """
    transition = parse_stage_transition(message)

    if not transition:
        # Not a stage transition message, ignore
        return

    action = transition.get('action')
    stage = transition.get('stage')

    if stage == 'escalation':
        on_escalation_guidance(message, transition)
    elif stage == 'tdd' and action == 'rejected':
        on_tdd_violation(message, transition)
    else:
        on_review_feedback(message, transition)


if __name__ == "__main__":
    """
    Run the implementor mail poller.

    Usage:
        python3 implementor_poller_callback.py <mail_name> <topology_file>

    Example:
        python3 implementor_poller_callback.py RedPond .maf/config/agent-topology.json
    """
    if len(sys.argv) < 3:
        print("Usage: python3 implementor_poller_callback.py <mail_name> <topology_file>")
        print("Example: python3 implementor_poller_callback.py RedPond .maf/config/agent-topology.json")
        sys.exit(1)

    IMPLEMENTOR_MAIL = sys.argv[1]
    TOPOLOGY_FILE = sys.argv[2]

    # Import mail poller (must be in same directory)
    try:
        from mail_poller import AgentMailPoller
    except ImportError:
        print("ERROR: Cannot import mail_poller.py")
        print("       Ensure mail_poller.py is in the same directory")
        sys.exit(1)

    poller = AgentMailPoller(
        agent_name=IMPLEMENTOR_MAIL,
        topology_file=Path(TOPOLOGY_FILE)
    )

    print("🔄 Implementor Mail Poller Starting")
    print(f"   Agent: {IMPLEMENTOR_MAIL}")
    print(f"   Topology: {TOPOLOGY_FILE}")
    print()
    print("   Will automatically handle:")
    print("   - Review approvals ✅")
    print("   - Review rejections ❌")
    print("   - TDD violations ⚠️")
    print("   - Escalation guidance 💡")
    print()
    print("   Press Ctrl+C to stop")
    print(f"{'='*60}")
    print()

    try:
        poller.poll_forever(callback=handle_mail_message)
    except KeyboardInterrupt:
        print("\n\n🛑 Implementor mail poller stopped")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        sys.exit(1)
