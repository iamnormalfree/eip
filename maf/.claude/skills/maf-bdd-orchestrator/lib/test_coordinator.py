"""
Tests for the MAF-BDD Coordinator module.

Tests coordinator initialization, main execution loop, and helper methods.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import json

from coordinator import MAFBDDCoordinator
from state import CoordinatorState
from bv import BVIntegration
from deps import DependencyParser
from escalation import EscalationManager
from preflight import PreFlightChecker
from spawner import AgentSpawner


class TestMAFBDDCoordinatorInit:
    """Tests for MAFBDDCoordinator initialization."""

    def test_init_creates_state(self):
        """Test that __init__ creates a CoordinatorState instance."""
        coordinator = MAFBDDCoordinator()
        assert coordinator.state is not None
        assert isinstance(coordinator.state, CoordinatorState)
        assert coordinator.state.session_id is not None

    def test_init_creates_bv_integration(self):
        """Test that __init__ creates a BVIntegration instance."""
        coordinator = MAFBDDCoordinator()
        assert coordinator.bv is not None
        assert isinstance(coordinator.bv, BVIntegration)

    def test_init_creates_dependency_parser(self):
        """Test that __init__ creates a DependencyParser instance."""
        coordinator = MAFBDDCoordinator()
        assert coordinator.deps is not None
        assert isinstance(coordinator.deps, DependencyParser)

    def test_init_creates_escalation_manager(self):
        """Test that __init__ creates an EscalationManager instance."""
        coordinator = MAFBDDCoordinator()
        assert coordinator.escalation is not None
        assert isinstance(coordinator.escalation, EscalationManager)

    def test_init_creates_preflight_checker(self):
        """Test that __init__ creates a PreFlightChecker instance."""
        coordinator = MAFBDDCoordinator()
        assert coordinator.preflight is not None
        assert isinstance(coordinator.preflight, PreFlightChecker)

    def test_init_creates_agent_spawner(self):
        """Test that __init__ creates an AgentSpawner instance."""
        coordinator = MAFBDDCoordinator()
        assert coordinator.spawner is not None
        assert isinstance(coordinator.spawner, AgentSpawner)


class TestGetReadyBeads:
    """Tests for _get_ready_beads method."""

    @patch('subprocess.run')
    def test_get_ready_beads_calls_bd_command(self, mock_run):
        """Test that _get_ready_beads calls bd ready command."""
        # Mock successful bd command output
        mock_result = Mock()
        mock_result.stdout = json.dumps([
            {"id": "bead-1", "title": "Test Bead 1", "description": "Description 1"},
            {"id": "bead-2", "title": "Test Bead 2", "description": "Description 2"}
        ])
        mock_result.returncode = 0
        mock_run.return_value = mock_result

        coordinator = MAFBDDCoordinator()
        beads = coordinator._get_ready_beads()

        assert len(beads) == 2
        assert beads[0]["id"] == "bead-1"
        assert beads[1]["id"] == "bead-2"

    @patch('subprocess.run')
    def test_get_ready_beads_returns_empty_list_when_no_beads(self, mock_run):
        """Test that _get_ready_beads returns empty list when no beads ready."""
        mock_result = Mock()
        mock_result.stdout = "[]"
        mock_result.returncode = 0
        mock_run.return_value = mock_result

        coordinator = MAFBDDCoordinator()
        beads = coordinator._get_ready_beads()

        assert beads == []

    @patch('subprocess.run')
    def test_get_ready_beads_handles_json_decode_error(self, mock_run):
        """Test that _get_ready_beads handles invalid JSON gracefully."""
        mock_result = Mock()
        mock_result.stdout = "invalid json"
        mock_result.returncode = 0
        mock_run.return_value = mock_result

        coordinator = MAFBDDCoordinator()
        beads = coordinator._get_ready_beads()

        # Should return empty list on error
        assert beads == []


class TestSortGroupsByPriority:
    """Tests for _sort_groups_by_priority method."""

    def test_sort_groups_by_priority(self):
        """Test that groups are sorted by priority (high -> medium -> low)."""
        coordinator = MAFBDDCoordinator()

        # Create mock groups with beads of different priorities
        groups = [
            [
                {"id": "bead-3", "priority": "low"},
                {"id": "bead-1", "priority": "high"},
            ],
            [
                {"id": "bead-2", "priority": "medium"},
                {"id": "bead-4", "priority": "high"},
            ],
        ]

        # Mock triage result
        triage_result = {"triage": {"quick_ref": {"top_picks": []}}}

        sorted_groups = coordinator._sort_groups_by_priority(groups, triage_result)

        # Verify group 0 order: high, low
        assert sorted_groups[0][0]["id"] == "bead-1"
        assert sorted_groups[0][1]["id"] == "bead-3"

        # Verify group 1 order: high, medium
        assert sorted_groups[1][0]["id"] == "bead-4"
        assert sorted_groups[1][1]["id"] == "bead-2"


class TestExecuteGroup:
    """Tests for _execute_group method."""

    @patch.object(MAFBDDCoordinator, '_execute_bead')
    def test_execute_group_processes_all_beads(self, mock_execute_bead):
        """Test that _execute_group processes all beads in the group."""
        mock_execute_bead.return_value = {"status": "success"}

        coordinator = MAFBDDCoordinator()
        group = [
            {"id": "bead-1", "title": "Bead 1"},
            {"id": "bead-2", "title": "Bead 2"},
        ]

        results = coordinator._execute_group(group)

        assert len(results) == 2
        assert mock_execute_bead.call_count == 2


class TestExecuteBead:
    """Tests for _execute_bead method."""

    @patch.object(AgentSpawner, 'spawn_implementer')
    @patch.object(AgentSpawner, 'kill_agent')
    def test_execute_bead_skips_on_preflight_failure(self, mock_kill, mock_spawn):
        """Test that _execute_bead skips implementation if pre-flight fails."""
        coordinator = MAFBDDCoordinator()

        # Mock pre-flight failure
        with patch.object(coordinator.preflight, 'check_all', return_value=(False, ["git_clean"])):
            bead = {"id": "bead-1", "title": "Test Bead", "description": "Description"}

            result = coordinator._execute_bead(bead)

            # Should skip implementation
            assert mock_spawn.call_count == 0
            assert result["status"] == "skipped"
            assert "pre-flight" in result["reason"].lower() or "preflight" in result["reason"].lower()


class TestMainLoop:
    """Tests for main execution loop."""

    @patch('subprocess.run')
    @patch.object(MAFBDDCoordinator, '_get_ready_beads')
    @patch.object(MAFBDDCoordinator, '_execute_group')
    @patch.object(BVIntegration, 'robot_triage')
    @patch.object(BVIntegration, 'blocker_analysis')
    def test_execute_loop_exits_when_no_ready_beads(
        self, mock_blocker, mock_triage, mock_execute, mock_get_beads, mock_run
    ):
        """Test that execute() exits when no ready beads remain."""
        # Mock no ready beads
        mock_get_beads.return_value = []

        coordinator = MAFBDDCoordinator()
        coordinator.execute()

        # Should not execute any groups
        assert mock_execute.call_count == 0


class TestShutdown:
    """Tests for shutdown method."""

    def test_shutdown_saves_state_to_file(self, tmp_path):
        """Test that shutdown saves state to a file."""
        import os

        coordinator = MAFBDDCoordinator()

        # Set some state
        coordinator.state.progress['completed'] = 5
        coordinator.state.progress['failed'] = 2
        coordinator.state.progress['unblocked'] = 3
        coordinator.state.groups_executed = 4

        # Set state file path
        state_file = tmp_path / "state.json"

        # Call shutdown
        coordinator.shutdown(state_file=str(state_file))

        # Verify state file was created
        assert os.path.exists(state_file)

        # Verify state file contents
        with open(state_file, 'r') as f:
            saved_state = json.load(f)

        assert saved_state['progress']['completed'] == 5
        assert saved_state['progress']['failed'] == 2
        assert saved_state['progress']['unblocked'] == 3
        assert saved_state['groups_executed'] == 4
        assert saved_state['session_id'] == coordinator.state.session_id

    def test_shutdown_kills_running_agents(self):
        """Test that shutdown kills any running agent processes."""
        coordinator = MAFBDDCoordinator()

        # Create mock running processes
        mock_proc1 = Mock()
        mock_proc1.poll.return_value = None  # Still running
        mock_proc1.pid = 12345

        mock_proc2 = Mock()
        mock_proc2.poll.return_value = None  # Still running
        mock_proc2.pid = 67890

        # Add to coordinator's running agents
        coordinator._running_agents = [mock_proc1, mock_proc2]

        # Call shutdown
        with patch.object(coordinator.spawner, 'kill_agent') as mock_kill:
            coordinator.shutdown()

            # Verify kill_agent was called for each agent
            assert mock_kill.call_count == 2
            mock_kill.assert_any_call(mock_proc1)
            mock_kill.assert_any_call(mock_proc2)

    def test_shutdown_handles_no_running_agents(self):
        """Test that shutdown handles case when no agents are running."""
        coordinator = MAFBDDCoordinator()

        # No running agents
        coordinator._running_agents = []

        # Should not raise any errors
        coordinator.shutdown()

    def test_shutdown_prints_session_summary(self, capsys):
        """Test that shutdown prints session summary."""
        coordinator = MAFBDDCoordinator()

        # Set some progress
        coordinator.state.progress['completed'] = 10
        coordinator.state.progress['failed'] = 3
        coordinator.state.progress['unblocked'] = 5
        coordinator.state.groups_executed = 7

        # Call shutdown
        coordinator.shutdown()

        # Capture output
        captured = capsys.readouterr()

        # Verify summary is printed
        assert "Session Summary" in captured.out or "Session" in captured.out
        assert "10" in captured.out  # completed count
        assert "3" in captured.out   # failed count
        assert "5" in captured.out   # unblocked count
        assert "7" in captured.out   # groups executed

    def test_shutdown_saves_state_without_file_arg(self, tmp_path):
        """Test that shutdown uses default state file path if none provided."""
        import os

        coordinator = MAFBDDCoordinator()

        # Change to temp directory
        original_dir = os.getcwd()
        try:
            os.chdir(tmp_path)
            coordinator.shutdown()

            # Verify default state file was created
            default_file = tmp_path / f"maf_bdd_state_{coordinator.state.session_id}.json"
            assert os.path.exists(default_file)
        finally:
            os.chdir(original_dir)

    def test_shutdown_handles_file_write_errors_gracefully(self):
        """Test that shutdown handles file write errors without crashing."""
        coordinator = MAFBDDCoordinator()

        # Try to write to invalid path
        invalid_path = "/invalid/path/that/cannot/be/created/state.json"

        # Should not raise exception
        try:
            coordinator.shutdown(state_file=invalid_path)
        except Exception as e:
            pytest.fail(f"shutdown raised exception: {e}")


class TestIntegration:
    """Integration tests for coordinator execution."""

    def test_coordinator_end_to_end_initialization(self):
        """Test that coordinator initializes all components correctly."""
        coordinator = MAFBDDCoordinator()

        # Verify all components are initialized
        assert coordinator.state is not None
        assert coordinator.bv is not None
        assert coordinator.deps is not None
        assert coordinator.escalation is not None
        assert coordinator.preflight is not None
        assert coordinator.spawner is not None

        # Verify state has session ID
        assert len(coordinator.state.session_id) > 0
