"""
Unit tests for agent spawner module.

Tests AgentSpawner class functionality including spawning implementers,
reviewers, and killing agents properly.
"""

import pytest
import subprocess
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

from spawner import AgentSpawner


class TestAgentSpawner:
    """Test suite for AgentSpawner class."""

    def test_initialization(self):
        """Test that AgentSpawner initializes correctly."""
        spawner = AgentSpawner()
        assert spawner is not None

    @patch('spawner.subprocess.Popen')
    @patch('spawner.tempfile.NamedTemporaryFile')
    def test_spawn_implementer_basic(self, mock_temp_file, mock_popen):
        """Test spawning an implementer agent."""
        # Setup mocks
        mock_file = MagicMock()
        mock_file.name = '/tmp/test_prompt.txt'
        mock_temp_file.return_value.__enter__.return_value = mock_file

        mock_proc = MagicMock()
        mock_proc.pid = 12345
        mock_popen.return_value = mock_proc

        # Create spawner and spawn implementer
        spawner = AgentSpawner()
        bead = {"id": "test-1", "title": "Test Bead"}
        escalation_context = {}
        preflight_result = {"status": "passed"}

        proc = spawner.spawn_implementer(bead, escalation_context, preflight_result)

        # Verify
        assert proc is not None
        assert proc.pid == 12345
        mock_popen.assert_called_once()
        mock_temp_file.assert_called_once()

    @patch('spawner.subprocess.Popen')
    def test_spawn_reviewer_basic(self, mock_popen):
        """Test spawning a reviewer agent."""
        # Setup mock
        mock_proc = MagicMock()
        mock_proc.pid = 67890
        mock_popen.return_value = mock_proc

        # Create spawner and spawn reviewer
        spawner = AgentSpawner()
        bead = {"id": "test-1", "title": "Test Bead"}
        commit_info = {"hash": "abc123", "message": "Test commit"}

        proc = spawner.spawn_reviewer(bead, commit_info)

        # Verify
        assert proc is not None
        assert proc.pid == 67890
        mock_popen.assert_called_once()

    def test_kill_agent_basic(self):
        """Test killing an agent process."""
        # Create mock process
        mock_proc = MagicMock()
        mock_proc.poll.return_value = None
        mock_proc.kill.return_value = None
        mock_proc.wait.return_value = None

        # Kill the agent
        spawner = AgentSpawner()
        result = spawner.kill_agent(mock_proc)

        # Verify
        assert result is True
        mock_proc.kill.assert_called_once()
        mock_proc.wait.assert_called_once()

    def test_kill_agent_already_terminated(self):
        """Test killing an agent that is already terminated."""
        # Create mock process that's already dead
        mock_proc = MagicMock()
        mock_proc.poll.return_value = 0  # Already exited

        # Kill the agent
        spawner = AgentSpawner()
        result = spawner.kill_agent(mock_proc)

        # Verify
        assert result is True
        mock_proc.kill.assert_not_called()

    def test_kill_agent_exception_handling(self):
        """Test that kill_agent handles exceptions gracefully."""
        # Create mock process that raises exception
        mock_proc = MagicMock()
        mock_proc.poll.return_value = None
        mock_proc.kill.side_effect = ProcessLookupError("No such process")

        # Kill the agent
        spawner = AgentSpawner()
        result = spawner.kill_agent(mock_proc)

        # Verify - should still return True even with exception
        assert result is True

    def test_read_template_success(self):
        """Test reading a template file successfully."""
        spawner = AgentSpawner()

        # Use the actual implementer template (prompts is sibling to lib directory)
        template_path = Path(__file__).parent.parent / "prompts" / "implementer.md"
        content = spawner._read_template(template_path)

        # Verify
        assert content is not None
        assert len(content) > 0
        assert "{{bead_id}}" in content
        assert "{{bead_title}}" in content

    def test_read_template_not_found(self):
        """Test reading a non-existent template file."""
        spawner = AgentSpawner()

        # Try to read a non-existent file
        non_existent_path = Path("/tmp/non_existent_template.md")
        content = spawner._read_template(non_existent_path)

        # Verify - should return empty string or raise exception
        # Based on implementation choice, we'll test for graceful handling
        assert content == ""

    def test_load_implementer_prompt_basic(self):
        """Test loading implementer prompt with basic bead info."""
        spawner = AgentSpawner()

        bead = {
            "id": "test-1",
            "title": "Test Bead",
            "description": "A test bead for verification"
        }
        escalation_context = {}
        preflight_result = {"status": "passed"}

        prompt = spawner._load_implementer_prompt(bead, escalation_context, preflight_result)

        # Verify template variables are replaced
        assert "test-1" in prompt
        assert "Test Bead" in prompt
        assert "A test bead for verification" in prompt
        assert "{{bead_id}}" not in prompt
        assert "{{bead_title}}" not in prompt
        assert "{{bead_description}}" not in prompt

    def test_load_implementer_prompt_with_escalation(self):
        """Test loading implementer prompt with escalation context."""
        spawner = AgentSpawner()

        bead = {
            "id": "retry-1",
            "title": "Retry Bead",
            "description": "A bead that needs retry"
        }
        escalation_context = {
            "last_result": "failed",
            "attempts": 2
        }
        preflight_result = {"status": "passed"}

        prompt = spawner._load_implementer_prompt(bead, escalation_context, preflight_result)

        # Verify escalation context is included
        assert "retry-1" in prompt
        assert "{{escalation_context}}" not in prompt
        # The formatted escalation context should be present
        assert "failed" in prompt or "2" in prompt or "attempts" in prompt.lower()

    def test_load_implementer_prompt_with_preflight_failed(self):
        """Test loading implementer prompt with failed preflight."""
        spawner = AgentSpawner()

        bead = {
            "id": "test-2",
            "title": "Test Bead 2",
            "description": "Another test bead"
        }
        escalation_context = {}
        preflight_result = {
            "status": "failed",
            "checks": [
                {"name": "test-check", "status": "failed", "message": "Test failed"}
            ]
        }

        prompt = spawner._load_implementer_prompt(bead, escalation_context, preflight_result)

        # Verify preflight status is included
        assert "test-2" in prompt
        assert "{{preflight_status}}" not in prompt
        # The preflight result should indicate failure
        assert "failed" in prompt.lower()

    def test_load_reviewer_prompt_basic(self):
        """Test loading reviewer prompt with basic commit info."""
        spawner = AgentSpawner()

        bead = {
            "id": "review-1",
            "title": "Review Bead",
            "description": "A bead to review"
        }
        commit_info = {
            "hash": "abc123def",
            "message": "Implement feature X",
            "author": "Test Author",
            "files_changed": ["file1.py", "file2.py"]
        }

        prompt = spawner._load_reviewer_prompt(bead, commit_info)

        # Verify template variables are replaced
        assert "review-1" in prompt
        assert "Review Bead" in prompt
        assert "A bead to review" in prompt
        assert "abc123def" in prompt
        assert "{{bead_id}}" not in prompt
        assert "{{bead_title}}" not in prompt
        assert "{{bead_description}}" not in prompt
        assert "{{commit_hash}}" not in prompt
        assert "{{commit_diff}}" not in prompt
        assert "{{files_changed}}" not in prompt

    def test_load_reviewer_prompt_with_diff(self):
        """Test loading reviewer prompt with commit diff."""
        spawner = AgentSpawner()

        bead = {
            "id": "diff-review",
            "title": "Diff Review",
            "description": "Review with diff"
        }
        commit_info = {
            "hash": "xyz789",
            "diff": "+ added line\n- removed line",
            "files_changed": ["modified.py"]
        }

        prompt = spawner._load_reviewer_prompt(bead, commit_info)

        # Verify diff is included
        assert "diff-review" in prompt
        assert "{{commit_diff}}" not in prompt
        # The diff content should be present
        assert "added line" in prompt or "removed line" in prompt or "+ added" in prompt
