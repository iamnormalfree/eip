"""
Integration tests for coordinator execution flow.

Tests the complete execution loop with mocked external dependencies.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock, call
import json

from coordinator import MAFBDDCoordinator
from state import CoordinatorState


class TestCoordinatorExecutionFlow:
    """Integration tests for complete execution flow."""

    @patch('subprocess.run')
    @patch.object(MAFBDDCoordinator, '_execute_bead')
    @patch.object(MAFBDDCoordinator, '_show_progress')
    @patch('bv.BVIntegration.robot_triage')
    @patch('bv.BVIntegration.blocker_analysis')
    def test_full_execution_loop_with_one_group(
        self,
        mock_blocker,
        mock_triage,
        mock_progress,
        mock_execute,
        mock_run
    ):
        """Test full execution loop: ready beads -> execute group -> retriage -> exit."""
        # Mock BD ready command to return beads first time, empty second time
        call_count = [0]

        def mock_run_side_effect(*args, **kwargs):
            if 'bd' in args[0] and 'ready' in args[0]:
                call_count[0] += 1
                result = Mock()
                if call_count[0] == 1:
                    result.stdout = json.dumps([{
                        "id": "bead-1",
                        "title": "Test Bead 1",
                        "description": "Description 1",
                        "priority": "high"
                    }])
                else:
                    result.stdout = "[]"
                result.returncode = 0
                return result
            result = Mock()
            result.stdout = ""
            result.returncode = 0
            return result

        mock_run.side_effect = mock_run_side_effect

        # Mock BV triage
        mock_triage.return_value = {
            "triage": {"quick_ref": {"top_picks": []}}
        }

        # Mock BV blocker analysis
        mock_blocker.return_value = []

        # Mock bead execution success
        mock_execute.return_value = {"status": "success"}

        # Create and execute coordinator
        coordinator = MAFBDDCoordinator()
        coordinator.execute()

        # Verify execution happened
        assert mock_execute.call_count == 1

class TestCoordinatorStateManagement:
    """Tests for coordinator state management throughout execution."""

    def test_state_persistence_across_session(self):
        """Test that coordinator state is maintained throughout the session."""
        coordinator = MAFBDDCoordinator()

        # Record initial state
        initial_session_id = coordinator.state.session_id
        initial_started_at = coordinator.state.started_at

        # Increment some progress
        coordinator.state.increment_progress('completed')
        coordinator.state.increment_progress('completed')
        coordinator.state.increment_progress('failed')

        # Verify state is maintained
        assert coordinator.state.session_id == initial_session_id
        assert coordinator.state.started_at == initial_started_at
        assert coordinator.state.progress['completed'] == 2
        assert coordinator.state.progress['failed'] == 1

    def test_state_serialization(self):
        """Test that coordinator state can be serialized and deserialized."""
        coordinator = MAFBDDCoordinator()

        # Add some state
        coordinator.state.increment_progress('completed')
        coordinator.state.record_attempt('bead-1', {'status': 'success'})

        # Serialize
        state_dict = coordinator.state.to_dict()

        # Verify serialization
        assert 'session_id' in state_dict
        assert 'started_at' in state_dict
        assert 'progress' in state_dict
        assert 'beads_processed' in state_dict
        assert state_dict['progress']['completed'] == 1

        # Deserialize
        restored_state = CoordinatorState.from_dict(state_dict)

        # Verify deserialization
        assert restored_state.session_id == coordinator.state.session_id
        assert restored_state.progress['completed'] == 1
        assert 'bead-1' in restored_state.beads_processed
