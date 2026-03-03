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
