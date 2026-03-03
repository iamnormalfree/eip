"""
Tests for max attempts check in EscalationManager.
"""

import pytest
import sys
from pathlib import Path

# Add lib directory to path
lib_path = Path(__file__).parent.parent / 'lib'
sys.path.insert(0, str(lib_path))

from escalation import EscalationManager


class TestMaxAttemptsCheck:
    """Test suite for should_give_up method."""

    def test_should_give_up_returns_true_after_3_attempts(self):
        """Test that should_give_up returns True after 3 failed attempts."""
        manager = EscalationManager()
        bead_id = "test-bead-1"

        # Record 3 failures
        for i in range(3):
            manager.record_failure(bead_id, f"Failure attempt {i+1}")

        # Should give up after 3 attempts
        context = manager.get_context(bead_id)
        assert context.get('attempts', 0) == 3
        assert manager.should_give_up(bead_id) is True

    def test_should_give_up_returns_false_before_3_attempts(self):
        """Test that should_give_up returns False with less than 3 attempts."""
        manager = EscalationManager()
        bead_id = "test-bead-2"

        # Record only 2 failures
        for i in range(2):
            manager.record_failure(bead_id, f"Failure attempt {i+1}")

        # Should not give up after 2 attempts
        context = manager.get_context(bead_id)
        assert context.get('attempts', 0) == 2
        assert manager.should_give_up(bead_id) is False

    def test_should_give_up_returns_false_for_zero_attempts(self):
        """Test that should_give_up returns False for beads with no attempts."""
        manager = EscalationManager()
        bead_id = "test-bead-3"

        # No failures recorded
        context = manager.get_context(bead_id)
        assert context.get('attempts', 0) == 0
        assert manager.should_give_up(bead_id) is False

    def test_should_give_up_returns_true_for_exactly_3_attempts(self):
        """Test that should_give_up returns True exactly at 3 attempts."""
        manager = EscalationManager()
        bead_id = "test-bead-4"

        # Record exactly 3 failures
        manager.record_failure(bead_id, "First failure")
        manager.record_failure(bead_id, "Second failure")
        manager.record_failure(bead_id, "Third failure")

        # Should give up at exactly 3 attempts
        assert manager.should_give_up(bead_id) is True

    def test_should_give_up_returns_true_for_more_than_3_attempts(self):
        """Test that should_give_up returns True for more than 3 attempts."""
        manager = EscalationManager()
        bead_id = "test-bead-5"

        # Record 5 failures
        for i in range(5):
            manager.record_failure(bead_id, f"Failure attempt {i+1}")

        # Should give up after more than 3 attempts
        assert manager.should_give_up(bead_id) is True
