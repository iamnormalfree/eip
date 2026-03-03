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
