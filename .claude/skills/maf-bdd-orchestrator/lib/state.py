"""
Coordinator state management for MAF-BDD Orchestrator.

This module provides the CoordinatorState class which tracks all state
throughout a bead execution session, including beads processed, escalation
context, and progress metrics.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional


class CoordinatorState:
    """
    Manages coordinator state throughout the bead execution session.

    Tracks:
    - Session identification (session_id, started_at)
    - Bead processing history (beads_processed)
    - Escalation context for retries (escalation_context)
    - Group execution counter (groups_executed)
    - Progress metrics (completed, failed, unblocked)
    """

    def __init__(self):
        """Initialize a new coordinator state with generated session ID."""
        self.session_id: str = str(uuid.uuid4())
        self.started_at: datetime = datetime.now()
        self.beads_processed: Dict[str, Dict[str, Any]] = {}
        self.escalation_context: Dict[str, Dict[str, Any]] = {}
        self.groups_executed: int = 0
        self.progress: Dict[str, int] = {
            "completed": 0,
            "failed": 0,
            "unblocked": 0
        }

    def record_attempt(self, bead_id: str, result: Dict[str, Any]) -> None:
        """
        Record an implementation attempt for a bead.

        Args:
            bead_id: The ID of the bead being processed
            result: Dictionary containing attempt results including:
                - status: 'success' or 'failed'
                - commit_hash: (optional) Git commit hash
                - files_changed: (optional) List of modified files
                - error: (optional) Error message if failed
                - attempts: (optional) Number of attempts made
        """
        self.beads_processed[bead_id] = {
            "result": result,
            "attempted_at": datetime.now().isoformat()
        }

        # Store result in escalation context for potential retries
        if bead_id not in self.escalation_context:
            self.escalation_context[bead_id] = {}

        self.escalation_context[bead_id]["last_result"] = result
        self.escalation_context[bead_id]["last_attempted_at"] = datetime.now().isoformat()

    def get_escalation_context(self, bead_id: str) -> Dict[str, Any]:
        """
        Get escalation context for a bead, used for retries.

        Args:
            bead_id: The ID of the bead to get context for

        Returns:
            Dictionary containing escalation context with keys:
            - last_result: The most recent attempt result
            - last_attempted_at: When the last attempt was made
            - attempts: Number of attempts (if tracked)
            Returns empty dict if bead has no escalation context.
        """
        return self.escalation_context.get(bead_id, {})

    def increment_progress(self, metric: str) -> None:
        """
        Increment a progress metric counter.

        Args:
            metric: The metric to increment ('completed', 'failed', or 'unblocked')

        Note:
            Silently ignores invalid metrics for robustness.
        """
        if metric in self.progress:
            self.progress[metric] += 1

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert state to dictionary for serialization/persistence.

        Returns:
            Dictionary containing all state fields with serializable values
        """
        return {
            'session_id': self.session_id,
            'started_at': self.started_at.isoformat(),
            'beads_processed': self.beads_processed,
            'escalation_context': self.escalation_context,
            'groups_executed': self.groups_executed,
            'progress': self.progress
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CoordinatorState':
        """
        Restore state from dictionary (deserialization).

        Args:
            data: Dictionary containing serialized state

        Returns:
            CoordinatorState instance with restored data
        """
        state = cls.__new__(cls)
        state.session_id = data['session_id']
        state.started_at = datetime.fromisoformat(data['started_at'])
        state.beads_processed = data['beads_processed']
        state.escalation_context = data['escalation_context']
        state.groups_executed = data['groups_executed']
        state.progress = data['progress']
        return state
