"""
BV integration module for MAF-BDD Orchestrator.

This module provides the BVIntegration class which wraps the bv command-line tool
to provide intelligent bead prioritization and analysis for the MAF-BDD system.
"""

import json
import subprocess
from typing import Dict, Any, List, Optional


class BVIntegration:
    """
    Integration wrapper for the bv (beads viewer) command-line tool.

    Provides methods for:
    - Getting prioritized bead lists via robot triage
    - Analyzing blockers to find unblocking tasks
    - Displaying progress dashboard
    - Refreshing triage after group completion

    The bv tool must be installed and available in the PATH.
    """

    def __init__(self, beads_dir: Optional[str] = None, bv_cmd: str = "bv"):
        """
        Initialize BVIntegration.

        Args:
            beads_dir: Optional path to beads directory. If None, uses current directory.
            bv_cmd: Command to invoke bv (default: "bv")
        """
        self.beads_dir = beads_dir
        self.bv_cmd = bv_cmd

    def _run_bv_command(
        self,
        args: List[str],
        beads_dir: Optional[str] = None,
        capture_output: bool = True
    ) -> str:
        """
        Run a bv command and return the output.

        Args:
            args: List of command-line arguments to pass to bv
            beads_dir: Directory to run command in (overrides instance beads_dir)
            capture_output: Whether to capture stdout/stderr

        Returns:
            Command output as string

        Raises:
            subprocess.CalledProcessError: If command fails
            FileNotFoundError: If bv command not found
        """
        cmd = [self.bv_cmd] + args
        cwd = beads_dir or self.beads_dir or "."

        try:
            result = subprocess.run(
                cmd,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                check=False  # We'll handle exit codes manually
            )
            return result.stdout
        except FileNotFoundError as e:
            raise FileNotFoundError(
                f"bv command not found. Please ensure bv is installed and in PATH. Error: {e}"
            )

    def _parse_json_output(self, output: str) -> Dict[str, Any]:
        """
        Parse JSON output from bv command.

        Args:
            output: Raw JSON string output from bv

        Returns:
            Parsed JSON as dictionary

        Raises:
            json.JSONDecodeError: If output is not valid JSON
        """
        # Find the main JSON object (from first { to matching })
        # bv outputs may have trailing content or usage hints
        first_brace = output.find('{')
        if first_brace == -1:
            raise json.JSONDecodeError("No JSON found in output", output, 0)

        # Count braces to find the matching closing brace
        brace_count = 0
        in_string = False
        escape_next = False
        end_pos = first_brace

        for i, char in enumerate(output[first_brace:], start=first_brace):
            if escape_next:
                escape_next = False
                continue

            if char == '\\':
                escape_next = True
                continue

            if char == '"' and not escape_next:
                in_string = not in_string
                continue

            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = i + 1
                        break

        json_str = output[first_brace:end_pos]
        return json.loads(json_str)

    def robot_triage(self, beads_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Run bv --robot-triage and parse output to return prioritized bead list.

        This is the main intelligence command that provides:
        - Top picks for immediate work
        - Full recommendations list
        - Blockers that should be cleared
        - Project health metrics

        Args:
            beads_dir: Directory to run triage in (overrides instance beads_dir)

        Returns:
            Dictionary containing triage data with keys:
            - triage.quick_ref.top_picks: List of top priority beads
            - triage.recommendations: Full prioritized list
            - triage.blockers_to_clear: Beads blocking others
            - triage.project_health: Health metrics
            - generated_at: Timestamp of triage generation

        Example:
            >>> bv = BVIntegration()
            >>> triage = bv.robot_triage()
            >>> top_picks = triage['triage']['quick_ref']['top_picks']
            >>> for pick in top_picks:
            ...     print(f"{pick['id']}: {pick['title']}")
        """
        output = self._run_bv_command(['--robot-triage'], beads_dir=beads_dir)
        return self._parse_json_output(output)

    def blocker_analysis(self, beads_dir: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Analyze blocked beads and return unblocking tasks.

        Extracts blocker information from triage data to identify
        which beads, if completed, would unblock the most work.

        Args:
            beads_dir: Directory to analyze (overrides instance beads_dir)

        Returns:
            List of blocker dictionaries containing:
            - id: Bead ID
            - title: Bead title
            - unblocks_count: Number of beads this would unblock
            - blocking: List of bead IDs being blocked

        Example:
            >>> bv = BVIntegration()
            >>> blockers = bv.blocker_analysis()
            >>> for blocker in sorted(blockers, key=lambda x: x['unblocks_count'], reverse=True):
            ...     print(f"{blocker['id']}: unblocks {blocker['unblocks_count']} beads")
        """
        triage_data = self.robot_triage(beads_dir=beads_dir)
        blockers_to_clear = triage_data.get('triage', {}).get('blockers_to_clear', [])

        # Normalize to list of dicts
        blockers = []
        for item in blockers_to_clear:
            if isinstance(item, dict):
                blockers.append(item)
            elif isinstance(item, str):
                blockers.append({'id': item, 'title': item})

        return blockers

    def progress_dashboard(self, beads_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Display current progress using bv triage data.

        Provides a comprehensive view of project health including:
        - Total beads and completion status
        - Velocity metrics (closing rate)
        - Graph analysis (dependencies, cycles)
        - Open/blocked/in-progress counts

        Args:
            beads_dir: Directory to analyze (overrides instance beads_dir)

        Returns:
            Dictionary containing progress data with keys:
            - triage.project_health.counts: Bead counts by status
            - triage.project_health.velocity: Closing velocity
            - triage.project_health.graph: Dependency graph stats
            - triage.quick_ref: Quick reference counts

        Example:
            >>> bv = BVIntegration()
            >>> progress = bv.progress_dashboard()
            >>> counts = progress['triage']['project_health']['counts']
            >>> print(f"Total: {counts['total']}, Open: {counts['open']}")
        """
        triage_data = self.robot_triage(beads_dir=beads_dir)

        # Return data formatted for progress display
        return {
            'project_health': triage_data.get('triage', {}).get('project_health', {}),
            'quick_ref': triage_data.get('triage', {}).get('quick_ref', {}),
            'generated_at': triage_data.get('generated_at')
        }

    def retriage(
        self,
        beads_dir: Optional[str] = None,
        completed_beads: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Refresh triage after group completion to check for newly unblocked beads.

        Should be called after completing a group of beads to see if any
        previously blocked beads have become actionable.

        Args:
            beads_dir: Directory to analyze (overrides instance beads_dir)
            completed_beads: Optional list of bead IDs that were just completed
                (for logging/context, not used in triage computation)

        Returns:
            Fresh triage data with same structure as robot_triage()

        Example:
            >>> bv = BVIntegration()
            >>> # After completing some beads
            >>> fresh_triage = bv.retriage(completed_beads=['bead-1', 'bead-2'])
            >>> new_picks = fresh_triage['triage']['quick_ref']['top_picks']
            >>> print(f"Newly available beads: {len(new_picks)}")
        """
        # Simply run fresh triage - bv automatically picks up current state
        return self.robot_triage(beads_dir=beads_dir)

    def get_top_pick(self, beads_dir: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get the single top-priority bead for immediate work.

        Convenience method that extracts the first top pick from triage.

        Args:
            beads_dir: Directory to analyze (overrides instance beads_dir)

        Returns:
            Dictionary with top pick info, or None if no picks available

        Example:
            >>> bv = BVIntegration()
            >>> pick = bv.get_top_pick()
            >>> if pick:
            ...     print(f"Next up: {pick['id']} - {pick['title']}")
        """
        triage_data = self.robot_triage(beads_dir=beads_dir)
        top_picks = triage_data.get('triage', {}).get('quick_ref', {}).get('top_picks', [])

        return top_picks[0] if top_picks else None

    def get_actionable_count(self, beads_dir: Optional[str] = None) -> int:
        """
        Get count of currently actionable (unblocked) beads.

        Args:
            beads_dir: Directory to analyze (overrides instance beads_dir)

        Returns:
            Number of beads ready to be worked on

        Example:
            >>> bv = BVIntegration()
            >>> count = bv.get_actionable_count()
            >>> print(f"{count} beads ready to work on")
        """
        triage_data = self.robot_triage(beads_dir=beads_dir)
        return triage_data.get('triage', {}).get('quick_ref', {}).get('actionable_count', 0)

    def sort_beads_by_priority(
        self,
        beads: List[Dict[str, Any]],
        triage_result: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Sort beads by BV triage priority.

        Uses a priority map to sort beads: high=0, medium=1, low=2.
        Beads with higher priority (lower numeric value) appear first.

        Args:
            beads: List of bead dictionaries to sort
            triage_result: Triage result from robot_triage() (may contain
                priority metadata for enhanced sorting)

        Returns:
            Sorted list of beads by priority (high -> medium -> low)

        Example:
            >>> bv = BVIntegration()
            >>> beads = [
            ...     {'id': 'bead-1', 'priority': 'low'},
            ...     {'id': 'bead-2', 'priority': 'high'},
            ...     {'id': 'bead-3', 'priority': 'medium'}
            ... ]
            >>> triage = bv.robot_triage()
            >>> sorted_beads = bv.sort_beads_by_priority(beads, triage)
            >>> assert sorted_beads[0]['priority'] == 'high'
        """
        # Define priority mapping: lower number = higher priority
        priority_map = {
            'high': 0,
            'medium': 1,
            'low': 2
        }

        def get_priority_value(bead: Dict[str, Any]) -> int:
            """
            Extract numeric priority value from bead.

            Args:
                bead: Bead dictionary

            Returns:
                Numeric priority value (lower = higher priority)
            """
            priority = bead.get('priority', 'low').lower()
            return priority_map.get(priority, 2)  # Default to low (2) if unknown

        # Sort beads by priority value (ascending)
        sorted_beads = sorted(beads, key=get_priority_value)

        return sorted_beads

    def show_progress(self, coordinator_state: Dict[str, Any]) -> None:
        """
        Display formatted progress dashboard with emoji formatting.

        Shows session progress including completed beads, failed beads,
        unblocked beads, and groups executed.

        Args:
            coordinator_state: Dictionary containing coordinator state with keys:
                - progress: Dict with 'completed', 'failed', 'unblocked' counts
                - groups_executed: Number of groups executed so far

        Example:
            >>> bv = BVIntegration()
            >>> state = {
            ...     'groups_executed': 5,
            ...     'progress': {'completed': 12, 'failed': 2, 'unblocked': 8}
            ... }
            >>> bv.show_progress(state)
            📊 Session Progress
            ✓ Completed: 12
            ✗ Failed: 2
            → Unblocked: 8
            🔄 Groups Executed: 5
        """
        progress = coordinator_state.get('progress', {})
        groups_executed = coordinator_state.get('groups_executed', 0)

        completed = progress.get('completed', 0)
        failed = progress.get('failed', 0)
        unblocked = progress.get('unblocked', 0)

        # Display formatted progress dashboard with emoji
        print()
        print("📊 Session Progress")
        print(f"  ✓ Completed: {completed}")
        print(f"  ✗ Failed: {failed}")
        print(f"  → Unblocked: {unblocked}")
        print(f"  🔄 Groups Executed: {groups_executed}")
        print()
