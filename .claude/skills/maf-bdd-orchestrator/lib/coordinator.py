"""
MAF-BDD Coordinator - Main orchestration logic for autonomous bead execution.

This module provides the MAFBDDCoordinator class which integrates all modules
and manages the main execution loop for autonomous BDD bead execution.
"""

import subprocess
import json
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

from state import CoordinatorState
from bv import BVIntegration
from deps import DependencyParser, topological_sort
from escalation import EscalationManager
from preflight import PreFlightChecker
from spawner import AgentSpawner, parse_implementer_result, parse_reviewer_result

logger = logging.getLogger(__name__)


class MAFBDDCoordinator:
    """
    Main coordinator for autonomous bead execution using 3-agent model.

    Integrates:
    - State management (CoordinatorState)
    - BV integration for intelligent prioritization
    - Dependency parsing for BDD patterns
    - Escalation management for retries
    - Pre-flight validation
    - Agent spawner for implementer/reviewer lifecycle
    """

    def __init__(self, beads_dir: Optional[str] = None):
        """
        Initialize the coordinator with all required modules.

        Args:
            beads_dir: Optional path to beads directory
        """
        # Initialize state management
        self.state = CoordinatorState()

        # Initialize BV integration
        self.bv = BVIntegration(beads_dir=beads_dir)

        # Initialize dependency parser
        self.deps = DependencyParser()

        # Initialize escalation manager
        self.escalation = EscalationManager()

        # Initialize pre-flight checker
        self.preflight = PreFlightChecker()

        # Initialize agent spawner
        self.spawner = AgentSpawner()

        # Store beads directory
        self.beads_dir = beads_dir

        # Track running agents for shutdown
        self._running_agents: List[subprocess.Popen] = []

        logger.info(f"Coordinator initialized with session ID: {self.state.session_id}")

    def execute(self) -> None:
        """
        Main execution loop - run until no ready beads remain.

        Process:
        1. Print start message
        2. Run initial BV triage and blocker analysis
        3. Enter main loop:
           - Get ready beads via 'bd ready --json --limit 50'
           - Break if none
           - Parse dependencies and form execution groups
           - Sort groups by BV priority
           - Execute groups sequentially
           - Re-triage after each group
           - Show progress
        """
        # Print start message
        self._print_start_message()

        # Run initial BV triage and blocker analysis
        logger.info("Running initial BV triage...")
        triage_result = self.bv.robot_triage(beads_dir=self.beads_dir)

        logger.info("Running BV blocker analysis...")
        blockers = self.bv.blocker_analysis(beads_dir=self.beads_dir)

        if blockers:
            logger.info(f"Found {len(blockers)} blockers to clear")

        # Main execution loop
        while True:
            # Get ready beads
            ready_beads = self._get_ready_beads()

            # Exit loop if no ready beads
            if not ready_beads:
                logger.info("No ready beads remaining. Exiting execution loop.")
                break

            logger.info(f"Found {len(ready_beads)} ready beads")

            # Parse dependencies from bead descriptions
            dependency_graph = self._build_dependency_graph(ready_beads)

            # Topological sort to get execution order
            try:
                sorted_beads = self._topological_sort_beads(ready_beads, dependency_graph)
            except ValueError as e:
                logger.error(f"Dependency cycle detected: {e}")
                # Fall back to original order if cycle detected
                sorted_beads = ready_beads

            # Form execution groups (parallel-safe)
            groups = self.deps.form_execution_groups(sorted_beads)

            logger.info(f"Formed {len(groups)} execution groups")

            # Sort each group by BV priority
            sorted_groups = self._sort_groups_by_priority(groups, triage_result)

            # Execute groups sequentially
            for i, group in enumerate(sorted_groups, 1):
                logger.info(f"Executing group {i}/{len(sorted_groups)} with {len(group)} beads")

                # Execute the group
                group_results = self._execute_group(group)

                # Track group execution
                self.state.groups_executed += 1

                # Log group results
                successful = sum(1 for r in group_results if r.get("status") == "success")
                logger.info(f"Group {i} completed: {successful}/{len(group)} successful")

            # Re-triage after completing all groups
            logger.info("Re-triaging after group completion...")
            triage_result = self.bv.retriage(beads_dir=self.beads_dir)

            # Show progress
            self._show_progress()

        # Print completion message
        self._print_completion_message()

    def shutdown(self, state_file: Optional[str] = None) -> None:
        """
        Perform graceful shutdown of the coordinator.

        Process:
        1. Kill any running agent processes
        2. Save state to file for potential recovery
        3. Print session summary

        Args:
            state_file: Optional path to state file. If not provided, uses
                       default path: maf_bdd_state_{session_id}.json
        """
        logger.info("Starting graceful shutdown...")

        # Step 1: Kill any running agents
        self._kill_all_agents()

        # Step 2: Save state to file
        self._save_state(state_file)

        # Step 3: Print session summary
        self._print_shutdown_summary()

        logger.info("Graceful shutdown complete")

    def _kill_all_agents(self) -> None:
        """
        Kill all running agent processes.

        Iterates through _running_agents list and kills each process.
        Handles errors gracefully to ensure all agents are cleaned up.
        """
        if not self._running_agents:
            logger.info("No running agents to kill")
            return

        logger.info(f"Killing {len(self._running_agents)} running agent(s)")

        for agent in self._running_agents:
            try:
                self.spawner.kill_agent(agent)
                logger.info(f"Killed agent process {agent.pid}")
            except Exception as e:
                logger.warning(f"Error killing agent process {agent.pid}: {e}")

        # Clear the list
        self._running_agents.clear()

    def _save_state(self, state_file: Optional[str] = None) -> None:
        """
        Save coordinator state to file for recovery.

        Args:
            state_file: Optional path to state file. If not provided, uses
                       default path: maf_bdd_state_{session_id}.json in cwd
        """
        # Determine state file path
        if state_file is None:
            state_file = f"maf_bdd_state_{self.state.session_id}.json"

        logger.info(f"Saving state to {state_file}")

        try:
            # Convert state to dictionary
            state_dict = self.state.to_dict()

            # Ensure directory exists
            state_path = Path(state_file)
            state_path.parent.mkdir(parents=True, exist_ok=True)

            # Write to file
            with open(state_file, 'w') as f:
                json.dump(state_dict, f, indent=2)

            logger.info(f"State saved successfully to {state_file}")

        except Exception as e:
            logger.error(f"Failed to save state to {state_file}: {e}")
            # Don't raise - shutdown should continue even if state save fails

    def _print_shutdown_summary(self) -> None:
        """Print session summary during shutdown."""
        print()
        print("=" * 60)
        print("MAF-BDD Orchestrator - Shutdown Summary")
        print("=" * 60)
        print(f"Session ID: {self.state.session_id}")
        print(f"Duration: {datetime.now() - self.state.started_at}")
        print()
        print("Session Statistics:")
        print(f"  Completed: {self.state.progress['completed']}")
        print(f"  Failed: {self.state.progress['failed']}")
        print(f"  Unblocked: {self.state.progress['unblocked']}")
        print(f"  Groups Executed: {self.state.groups_executed}")
        print()

        # Print beads processed count if any
        if self.state.beads_processed:
            print(f"Total Beads Processed: {len(self.state.beads_processed)}")
            print()

    def _execute_bead_safe(self, bead: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a single bead with comprehensive error handling.

        Wraps _execute_bead() with try-catch blocks for:
        - subprocess.CalledProcessError: Records failure with error message
        - json.JSONDecodeError: Records 'Invalid output'
        - Generic Exception: Records str(e)

        All exceptions are logged and recorded in escalation context.

        Args:
            bead: Dictionary containing bead information

        Returns:
            Dictionary with execution result containing:
            - status: 'success', 'failed', or 'skipped'
            - reason: Reason for failure/skip (if applicable)
        """
        bead_id = bead.get('id', 'unknown')
        logger.info(f"Executing bead safely: {bead_id}")

        try:
            # Call the original _execute_bead method
            return self._execute_bead(bead)

        except subprocess.CalledProcessError as e:
            # Handle subprocess errors
            error_msg = f"Command failed: {e.stderr if e.stderr else str(e)}"
            logger.error(f"subprocess.CalledProcessError for bead {bead_id}: {error_msg}")

            # Record failure in escalation context
            self.escalation.record_failure(bead_id, error_msg)

            # Return failure result
            return {
                'status': 'failed',
                'reason': error_msg
            }

        except json.JSONDecodeError as e:
            # Handle JSON parsing errors
            error_msg = "Invalid output: Failed to parse JSON response"
            logger.error(f"json.JSONDecodeError for bead {bead_id}: {e}")

            # Record failure in escalation context
            self.escalation.record_failure(bead_id, error_msg)

            # Return failure result
            return {
                'status': 'failed',
                'reason': error_msg
            }

        except Exception as e:
            # Handle generic exceptions
            error_msg = str(e)
            logger.error(f"Unexpected error for bead {bead_id}: {error_msg}")

            # Record failure in escalation context
            self.escalation.record_failure(bead_id, error_msg)

            # Return failure result
            return {
                'status': 'failed',
                'reason': error_msg
            }

    def _execute_bead(self, bead: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a single bead with pre-flight, implementer, and reviewer.

        Process:
        1. Run pre-flight validation
        2. If pre-flight passes:
           - Spawn implementer
           - Wait for completion
           - Kill implementer
           - Check implementation success
           - If successful:
             - Spawn reviewer
             - Wait for review
             - Kill reviewer
             - Handle review decision (close or reopen)
        3. Return result

        Args:
            bead: Dictionary containing bead information

        Returns:
            Dictionary with execution result containing:
            - status: 'success', 'failed', or 'skipped'
            - reason: Reason for failure/skip (if applicable)
        """
        bead_id = bead.get('id', 'unknown')
        logger.info(f"Executing bead: {bead_id}")

        # Get escalation context for this bead
        escalation_context = self.state.get_escalation_context(bead_id)

        # Run pre-flight validation
        preflight_passed, failed_checks = self.preflight.check_all()
        preflight_result = {
            'status': 'passed' if preflight_passed else 'failed',
            'checks': failed_checks
        }

        # Skip if pre-flight fails
        if not preflight_passed:
            logger.warning(f"Pre-flight validation failed for bead {bead_id}: {failed_checks}")
            return {
                'status': 'skipped',
                'reason': f'Pre-flight validation failed: {", ".join(failed_checks)}'
            }

        # Spawn implementer
        try:
            logger.info(f"Spawning implementer for bead {bead_id}")
            implementer_proc = self.spawner.spawn_implementer(
                bead=bead,
                escalation_context=escalation_context,
                preflight_result=preflight_result
            )

            # Wait for implementer to complete
            stdout, stderr = implementer_proc.communicate()

            # Kill implementer
            self.spawner.kill_agent(implementer_proc)

            # Parse implementer result
            try:
                impl_result = parse_implementer_result(stdout)
            except ValueError as e:
                logger.error(f"Failed to parse implementer result: {e}")
                self._handle_implementation_failure(bead_id, f"Failed to parse result: {e}")
                return {'status': 'failed', 'reason': 'Failed to parse implementer output'}

            # Check if implementation succeeded
            if impl_result.get('status') != 'ready_for_review':
                logger.warning(f"Implementation failed for bead {bead_id}")
                self._handle_implementation_failure(
                    bead_id,
                    impl_result.get('error', 'Implementation failed')
                )
                return {'status': 'failed', 'reason': 'Implementation failed'}

            # Spawn reviewer
            commit_info = {
                'hash': impl_result.get('commit_hash'),
                'message': f"Implement bead {bead_id}",
                'files_changed': impl_result.get('files_changed', []),
                'diff': self._get_commit_diff(impl_result.get('commit_hash')),
                'implementer_note': impl_result.get('self_review', '')
            }

            logger.info(f"Spawning reviewer for bead {bead_id}")
            reviewer_proc = self.spawner.spawn_reviewer(
                bead=bead,
                commit_info=commit_info
            )

            # Wait for reviewer to complete
            stdout, stderr = reviewer_proc.communicate()

            # Kill reviewer
            self.spawner.kill_agent(reviewer_proc)

            # Parse reviewer result
            try:
                review_result = parse_reviewer_result(stdout)
            except ValueError as e:
                logger.error(f"Failed to parse reviewer result: {e}")
                return {'status': 'failed', 'reason': 'Failed to parse reviewer output'}

            # Handle review decision
            if review_result.get('status') == 'approved':
                logger.info(f"Review approved for bead {bead_id}")
                self._handle_approval(bead_id, impl_result)
                return {'status': 'success'}
            else:
                logger.warning(f"Review rejected for bead {bead_id}")
                self._handle_rejection(bead_id, review_result)
                return {'status': 'failed', 'reason': 'Review rejected'}

        except Exception as e:
            logger.error(f"Error executing bead {bead_id}: {e}")
            self._handle_implementation_failure(bead_id, str(e))
            return {'status': 'failed', 'reason': str(e)}

    def _get_ready_beads(self) -> List[Dict[str, Any]]:
        """
        Get ready beads using 'bd ready --json --limit 50'.

        Returns:
            List of bead dictionaries, or empty list if none ready or error occurs
        """
        try:
            result = subprocess.run(
                ['bd', 'ready', '--json', '--limit', '50'],
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode != 0:
                logger.warning(f"bd ready command failed: {result.stderr}")
                return []

            # Parse JSON output
            beads = json.loads(result.stdout)
            return beads if isinstance(beads, list) else []

        except (json.JSONDecodeError, FileNotFoundError, OSError) as e:
            logger.error(f"Error getting ready beads: {e}")
            return []

    def _build_dependency_graph(self, beads: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Build dependency graph from a list of beads.

        Args:
            beads: List of bead dictionaries

        Returns:
            Dictionary mapping bead_id to list of dependencies
        """
        return self.deps.build_dependency_graph(beads)

    def _topological_sort_beads(
        self,
        beads: List[Dict[str, Any]],
        dependency_graph: Dict[str, List[str]]
    ) -> List[Dict[str, Any]]:
        """
        Sort beads by dependency order using topological sort.

        Args:
            beads: List of bead dictionaries
            dependency_graph: Dependency graph from build_dependency_graph

        Returns:
            List of beads sorted in dependency order
        """
        try:
            # Get sorted bead IDs
            sorted_ids = topological_sort(dependency_graph)

            # Create a map of bead_id to bead
            bead_map = {b.get('id'): b for b in beads}

            # Sort beads according to topological order
            sorted_beads = []
            for bead_id in sorted_ids:
                if bead_id in bead_map:
                    sorted_beads.append(bead_map[bead_id])

            return sorted_beads

        except ValueError as e:
            logger.error(f"Topological sort failed: {e}")
            # Return original order if sort fails
            return beads

    def _sort_groups_by_priority(
        self,
        groups: List[List[Dict[str, Any]]],
        triage_result: Dict[str, Any]
    ) -> List[List[Dict[str, Any]]]:
        """
        Sort beads within each group by BV triage priority.

        Args:
            groups: List of execution groups
            triage_result: Triage result from BV robot_triage

        Returns:
            List of groups with beads sorted by priority within each group
        """
        sorted_groups = []

        for group in groups:
            # Sort beads in this group by priority
            sorted_group = self.bv.sort_beads_by_priority(group, triage_result)
            sorted_groups.append(sorted_group)

        return sorted_groups

    def _execute_group(self, group: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute a group of beads sequentially using safe execution.

        Args:
            group: List of bead dictionaries to execute

        Returns:
            List of execution results for each bead
        """
        results = []

        for bead in group:
            result = self._execute_bead_safe(bead)
            results.append(result)

        return results

    def _get_commit_diff(self, commit_hash: str) -> str:
        """
        Get git diff for a commit.

        Args:
            commit_hash: Git commit hash

        Returns:
            String containing commit diff, or empty string if error
        """
        try:
            result = subprocess.run(
                ['git', 'show', commit_hash],
                capture_output=True,
                text=True,
                check=False
            )
            return result.stdout
        except (FileNotFoundError, OSError):
            return ""

    def _handle_implementation_failure(self, bead_id: str, reason: str) -> None:
        """
        Handle implementation failure by recording in escalation context.

        Args:
            bead_id: ID of the bead that failed
            reason: Reason for failure
        """
        # Record failure in escalation manager
        self.escalation.record_failure(bead_id, reason)

        # Check if should give up
        if self.escalation.should_give_up(bead_id):
            logger.warning(f"Bead {bead_id} exceeded max attempts, giving up")
            self.state.increment_progress('failed')
        else:
            # Reopen bead with feedback
            self._reopen_bead(bead_id, f"Implementation failed: {reason}")

    def _handle_approval(self, bead_id: str, impl_result: Dict[str, Any]) -> None:
        """
        Handle review approval by closing the bead.

        Args:
            bead_id: ID of the approved bead
            impl_result: Implementer result dictionary
        """
        # Close the bead
        try:
            subprocess.run(
                ['bd', 'close', bead_id],
                capture_output=True,
                check=False
            )
            logger.info(f"Closed bead {bead_id}")
        except (FileNotFoundError, OSError) as e:
            logger.error(f"Failed to close bead {bead_id}: {e}")

        # Record success
        self.state.record_attempt(bead_id, {
            'status': 'success',
            'commit_hash': impl_result.get('commit_hash'),
            'files_changed': impl_result.get('files_changed')
        })

        # Increment progress
        self.state.increment_progress('completed')

    def _handle_rejection(self, bead_id: str, review_result: Dict[str, Any]) -> None:
        """
        Handle review rejection by reopening bead with feedback.

        Args:
            bead_id: ID of the rejected bead
            review_result: Reviewer result dictionary
        """
        # Record failure
        reason = review_result.get('feedback', 'Review rejected')
        self.escalation.record_failure(bead_id, f"Review rejected: {reason}")

        # Reopen bead with feedback
        self._reopen_bead(bead_id, f"Review rejected: {reason}")

    def _reopen_bead(self, bead_id: str, notes: str) -> None:
        """
        Reopen a bead with feedback notes.

        Args:
            bead_id: ID of the bead to reopen
            notes: Feedback notes to add
        """
        try:
            subprocess.run(
                ['bd', 'update', bead_id, '--status=reopen', f'--notes={notes}'],
                capture_output=True,
                check=False
            )
            logger.info(f"Reopened bead {bead_id} with notes")
        except (FileNotFoundError, OSError) as e:
            logger.error(f"Failed to reopen bead {bead_id}: {e}")

    def _print_start_message(self) -> None:
        """Print start message for execution session."""
        print()
        print("=" * 60)
        print("MAF-BDD Orchestrator - Autonomous Bead Execution")
        print("=" * 60)
        print(f"Session ID: {self.state.session_id}")
        print(f"Started at: {self.state.started_at.isoformat()}")
        print()
        print("Initializing execution loop...")
        print()

    def _print_completion_message(self) -> None:
        """Print completion message for execution session."""
        print()
        print("=" * 60)
        print("Execution Session Complete")
        print("=" * 60)
        print(f"Session ID: {self.state.session_id}")
        print(f"Duration: {datetime.now() - self.state.started_at}")
        print()
        print("Final Summary:")
        print(f"  Completed: {self.state.progress['completed']}")
        print(f"  Failed: {self.state.progress['failed']}")
        print(f"  Unblocked: {self.state.progress['unblocked']}")
        print(f"  Groups Executed: {self.state.groups_executed}")
        print()

    def _show_progress(self) -> None:
        """Show current progress using BV integration."""
        self.bv.show_progress(self.state.to_dict())
