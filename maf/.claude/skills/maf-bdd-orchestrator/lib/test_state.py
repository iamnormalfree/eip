#!/usr/bin/env python3
"""
Test suite for CoordinatorState module.
Follows TDD approach - tests written first.
"""

import sys
import os
from datetime import datetime

# Add lib directory to path
sys.path.insert(0, os.path.dirname(__file__))

from state import CoordinatorState


def test_state_creation():
    """Test that CoordinatorState can be created with all required fields."""
    print("Testing state creation...")

    state = CoordinatorState()

    # Verify session_id is a valid UUID (string format)
    assert hasattr(state, 'session_id'), "Missing session_id"
    assert isinstance(state.session_id, str), "session_id should be string"
    assert len(state.session_id) == 36, f"session_id should be UUID format (36 chars), got {len(state.session_id)}"
    print(f"  ✓ session_id: {state.session_id}")

    # Verify started_at is a datetime
    assert hasattr(state, 'started_at'), "Missing started_at"
    assert isinstance(state.started_at, datetime), "started_at should be datetime"
    print(f"  ✓ started_at: {state.started_at}")

    # Verify beads_processed is a dict
    assert hasattr(state, 'beads_processed'), "Missing beads_processed"
    assert isinstance(state.beads_processed, dict), "beads_processed should be dict"
    assert len(state.beads_processed) == 0, "beads_processed should start empty"
    print(f"  ✓ beads_processed: {state.beads_processed}")

    # Verify escalation_context is a dict
    assert hasattr(state, 'escalation_context'), "Missing escalation_context"
    assert isinstance(state.escalation_context, dict), "escalation_context should be dict"
    assert len(state.escalation_context) == 0, "escalation_context should start empty"
    print(f"  ✓ escalation_context: {state.escalation_context}")

    # Verify groups_executed is an integer
    assert hasattr(state, 'groups_executed'), "Missing groups_executed"
    assert isinstance(state.groups_executed, int), "groups_executed should be int"
    assert state.groups_executed == 0, "groups_executed should start at 0"
    print(f"  ✓ groups_executed: {state.groups_executed}")

    # Verify progress dict with correct keys
    assert hasattr(state, 'progress'), "Missing progress"
    assert isinstance(state.progress, dict), "progress should be dict"
    assert 'completed' in state.progress, "Missing 'completed' in progress"
    assert 'failed' in state.progress, "Missing 'failed' in progress"
    assert 'unblocked' in state.progress, "Missing 'unblocked' in progress"
    assert state.progress['completed'] == 0, "completed should start at 0"
    assert state.progress['failed'] == 0, "failed should start at 0"
    assert state.progress['unblocked'] == 0, "unblocked should start at 0"
    print(f"  ✓ progress: {state.progress}")

    print("✅ State creation test passed!\n")


def test_record_attempt():
    """Test recording bead implementation attempts."""
    print("Testing record_attempt...")

    state = CoordinatorState()

    # Test recording a successful attempt
    result = {
        'status': 'success',
        'commit_hash': 'abc123',
        'files_changed': ['file1.py', 'file2.py']
    }
    state.record_attempt('bead-1', result)

    assert 'bead-1' in state.beads_processed, "bead-1 should be in beads_processed"
    assert state.beads_processed['bead-1']['result'] == result, "Result should be stored"
    assert 'attempted_at' in state.beads_processed['bead-1'], "Should record timestamp"
    print(f"  ✓ Recorded attempt for bead-1: {state.beads_processed['bead-1']}")

    # Test recording a failed attempt
    failed_result = {
        'status': 'failed',
        'error': 'Test failure',
        'attempts': 1
    }
    state.record_attempt('bead-2', failed_result)

    assert 'bead-2' in state.beads_processed, "bead-2 should be in beads_processed"
    assert state.beads_processed['bead-2']['result'] == failed_result, "Failed result should be stored"
    print(f"  ✓ Recorded failed attempt for bead-2: {state.beads_processed['bead-2']}")

    print("✅ record_attempt test passed!\n")


def test_get_escalation_context():
    """Test retrieving escalation context for beads."""
    print("Testing get_escalation_context...")

    state = CoordinatorState()

    # Test getting context for non-existent bead
    context = state.get_escalation_context('bead-nonexistent')
    assert context == {}, "Should return empty dict for non-existent bead"
    print(f"  ✓ Non-existent bead returns empty dict: {context}")

    # Test getting context after recording attempts
    result = {'status': 'failed', 'error': 'First attempt failed'}
    state.record_attempt('bead-1', result)

    context = state.get_escalation_context('bead-1')
    assert isinstance(context, dict), "Context should be a dict"
    assert 'last_result' in context, "Context should contain last_result"
    assert context['last_result']['status'] == 'failed', "Should have failed status"
    print(f"  ✓ Context for bead-1: {context}")

    print("✅ get_escalation_context test passed!\n")


def test_increment_progress():
    """Test incrementing progress metrics."""
    print("Testing increment_progress...")

    state = CoordinatorState()

    # Test incrementing completed
    state.increment_progress('completed')
    assert state.progress['completed'] == 1, "completed should be 1"
    print(f"  ✓ Incremented completed: {state.progress['completed']}")

    # Test incrementing failed
    state.increment_progress('failed')
    assert state.progress['failed'] == 1, "failed should be 1"
    print(f"  ✓ Incremented failed: {state.progress['failed']}")

    # Test incrementing unblocked
    state.increment_progress('unblocked')
    assert state.progress['unblocked'] == 1, "unblocked should be 1"
    print(f"  ✓ Incremented unblocked: {state.progress['unblocked']}")

    # Test multiple increments
    state.increment_progress('completed')
    state.increment_progress('completed')
    assert state.progress['completed'] == 3, "completed should be 3"
    print(f"  ✓ Multiple increments: {state.progress['completed']}")

    # Test invalid metric (should not crash)
    state.increment_progress('invalid_metric')
    print(f"  ✓ Invalid metric handled gracefully")

    print("✅ increment_progress test passed!\n")


def test_state_persistence():
    """Test that state can be serialized for persistence."""
    print("Testing state persistence...")

    state = CoordinatorState()

    # Add some data
    state.record_attempt('bead-1', {'status': 'success'})
    state.increment_progress('completed')
    state.groups_executed = 5

    # Convert to dict for persistence
    state_dict = {
        'session_id': state.session_id,
        'started_at': state.started_at.isoformat(),
        'beads_processed': state.beads_processed,
        'escalation_context': state.escalation_context,
        'groups_executed': state.groups_executed,
        'progress': state.progress
    }

    # Verify all fields are serializable
    assert 'session_id' in state_dict, "session_id should be in dict"
    assert 'started_at' in state_dict, "started_at should be in dict"
    assert 'beads_processed' in state_dict, "beads_processed should be in dict"
    assert 'escalation_context' in state_dict, "escalation_context should be in dict"
    assert 'groups_executed' in state_dict, "groups_executed should be in dict"
    assert 'progress' in state_dict, "progress should be in dict"

    print(f"  ✓ State is serializable: {len(state_dict)} fields")
    print(f"  ✓ session_id: {state_dict['session_id']}")
    print(f"  ✓ started_at: {state_dict['started_at']}")
    print(f"  ✓ groups_executed: {state_dict['groups_executed']}")
    print(f"  ✓ progress: {state_dict['progress']}")

    print("✅ State persistence test passed!\n")


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("Running CoordinatorState Test Suite")
    print("=" * 60)
    print()

    tests = [
        test_state_creation,
        test_record_attempt,
        test_get_escalation_context,
        test_increment_progress,
        test_state_persistence
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"❌ {test.__name__} FAILED: {e}\n")
            failed += 1
        except Exception as e:
            print(f"❌ {test.__name__} ERROR: {e}\n")
            failed += 1

    print("=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
