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
