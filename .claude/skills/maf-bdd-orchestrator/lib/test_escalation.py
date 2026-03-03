#!/usr/bin/env python3
"""
Test suite for EscalationManager module.
Follows TDD approach - tests written first.
"""

import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.dirname(__file__))

from escalation import EscalationManager


def test_escalation_manager_creation():
    """Test that EscalationManager can be created with escalation_context initialized."""
    print("Testing EscalationManager creation...")

    manager = EscalationManager()

    # Verify escalation_context is initialized
    assert hasattr(manager, 'escalation_context'), "Missing escalation_context"
    assert isinstance(manager.escalation_context, dict), "escalation_context should be dict"
    assert len(manager.escalation_context) == 0, "escalation_context should start empty"
    print(f"  ✓ escalation_context initialized: {manager.escalation_context}")

    print("✅ EscalationManager creation test passed!\n")


def test_record_failure_first_attempt():
    """Test recording first failure for a bead."""
    print("Testing record_failure (first attempt)...")

    manager = EscalationManager()

    # Record first failure
    manager.record_failure('bead-1', 'Implementation failed: missing dependency')

    # Verify escalation context was created
    assert 'bead-1' in manager.escalation_context, "bead-1 should be in escalation_context"
    context = manager.escalation_context['bead-1']

    # Verify attempts counter
    assert 'attempts' in context, "Context should have attempts counter"
    assert context['attempts'] == 1, f"attempts should be 1, got {context['attempts']}"
    print(f"  ✓ Attempts incremented to: {context['attempts']}")

    # Verify failure_reasons
    assert 'failure_reasons' in context, "Context should have failure_reasons list"
    assert isinstance(context['failure_reasons'], list), "failure_reasons should be list"
    assert len(context['failure_reasons']) == 1, "Should have 1 failure reason"
    assert context['failure_reasons'][0] == 'Implementation failed: missing dependency', "Failure reason should match"
    print(f"  ✓ Failure reason recorded: {context['failure_reasons']}")

    # Verify suggested approach
    assert 'suggested_approach' in context, "Context should have suggested_approach"
    assert context['suggested_approach'] == 'Review and adjust implementation based on failure feedback', "Should suggest review for attempt 1"
    print(f"  ✓ Suggested approach: {context['suggested_approach']}")

    print("✅ record_failure (first attempt) test passed!\n")


def test_record_failure_multiple_attempts():
    """Test recording multiple failures for the same bead."""
    print("Testing record_failure (multiple attempts)...")

    manager = EscalationManager()

    # Record first failure
    manager.record_failure('bead-1', 'First failure: syntax error')

    # Record second failure
    manager.record_failure('bead-1', 'Second failure: runtime error')

    # Record third failure
    manager.record_failure('bead-1', 'Third failure: logic error')

    context = manager.escalation_context['bead-1']

    # Verify attempts counter
    assert context['attempts'] == 3, f"attempts should be 3, got {context['attempts']}"
    print(f"  ✓ Attempts incremented to: {context['attempts']}")

    # Verify all failure reasons are recorded
    assert len(context['failure_reasons']) == 3, "Should have 3 failure reasons"
    assert context['failure_reasons'][0] == 'First failure: syntax error', "First reason should match"
    assert context['failure_reasons'][1] == 'Second failure: runtime error', "Second reason should match"
    assert context['failure_reasons'][2] == 'Third failure: logic error', "Third reason should match"
    print(f"  ✓ All failure reasons recorded: {context['failure_reasons']}")

    # Verify suggested approach changes for attempt 3+
    assert context['suggested_approach'] == 'May need bead revision - consider if requirements or design need adjustment', "Should suggest revision for attempt 3+"
    print(f"  ✓ Suggested approach: {context['suggested_approach']}")

    print("✅ record_failure (multiple attempts) test passed!\n")


def test_record_failure_second_attempt():
    """Test that second failure suggests alternative approach."""
    print("Testing record_failure (second attempt)...")

    manager = EscalationManager()

    # Record two failures
    manager.record_failure('bead-2', 'First failure')
    manager.record_failure('bead-2', 'Second failure')

    context = manager.escalation_context['bead-2']

    # Verify suggested approach for attempt 2
    assert context['suggested_approach'] == 'Try alternative implementation approach', "Should suggest alternative for attempt 2"
    print(f"  ✓ Suggested approach for attempt 2: {context['suggested_approach']}")

    print("✅ record_failure (second attempt) test passed!\n")


def test_get_context():
    """Test retrieving escalation context for implementer."""
    print("Testing get_context...")

    manager = EscalationManager()

    # Test getting context for non-existent bead
    context = manager.get_context('bead-nonexistent')
    assert context == {}, "Should return empty dict for non-existent bead"
    print(f"  ✓ Non-existent bead returns empty dict: {context}")

    # Record some failures
    manager.record_failure('bead-1', 'First failure')
    manager.record_failure('bead-1', 'Second failure')

    # Get context for existing bead
    context = manager.get_context('bead-1')

    # Verify all expected fields are present
    assert 'attempts' in context, "Context should contain attempts"
    assert context['attempts'] == 2, "Should have 2 attempts"
    print(f"  ✓ Attempts: {context['attempts']}")

    assert 'failure_reasons' in context, "Context should contain failure_reasons"
    assert len(context['failure_reasons']) == 2, "Should have 2 failure reasons"
    print(f"  ✓ Failure reasons: {context['failure_reasons']}")

    assert 'suggested_approach' in context, "Context should contain suggested_approach"
    print(f"  ✓ Suggested approach: {context['suggested_approach']}")

    print("✅ get_context test passed!\n")


def test_multiple_beads():
    """Test tracking failures for multiple different beads."""
    print("Testing multiple beads...")

    manager = EscalationManager()

    # Record failures for different beads
    manager.record_failure('bead-1', 'Bead 1 failure')
    manager.record_failure('bead-2', 'Bead 2 first failure')
    manager.record_failure('bead-2', 'Bead 2 second failure')
    manager.record_failure('bead-3', 'Bead 3 failure')

    # Verify each bead has its own context
    assert len(manager.escalation_context) == 3, "Should have 3 beads in context"

    # Verify bead-1
    context1 = manager.get_context('bead-1')
    assert context1['attempts'] == 1, "bead-1 should have 1 attempt"
    print(f"  ✓ bead-1: {context1['attempts']} attempt(s)")

    # Verify bead-2
    context2 = manager.get_context('bead-2')
    assert context2['attempts'] == 2, "bead-2 should have 2 attempts"
    print(f"  ✓ bead-2: {context2['attempts']} attempt(s)")

    # Verify bead-3
    context3 = manager.get_context('bead-3')
    assert context3['attempts'] == 1, "bead-3 should have 1 attempt"
    print(f"  ✓ bead-3: {context3['attempts']} attempt(s)")

    print("✅ Multiple beads test passed!\n")


def test_suggest_approach_evolution():
    """Test that suggested approach evolves with attempt count."""
    print("Testing suggested approach evolution...")

    manager = EscalationManager()

    # Test attempt 1
    manager.record_failure('bead-1', 'Failure 1')
    context = manager.get_context('bead-1')
    assert 'review' in context['suggested_approach'].lower(), "Attempt 1 should suggest review"
    print(f"  ✓ Attempt 1: {context['suggested_approach']}")

    # Test attempt 2
    manager.record_failure('bead-1', 'Failure 2')
    context = manager.get_context('bead-1')
    assert 'alternative' in context['suggested_approach'].lower(), "Attempt 2 should suggest alternative"
    print(f"  ✓ Attempt 2: {context['suggested_approach']}")

    # Test attempt 3
    manager.record_failure('bead-1', 'Failure 3')
    context = manager.get_context('bead-1')
    assert 'revision' in context['suggested_approach'].lower(), "Attempt 3 should suggest revision"
    print(f"  ✓ Attempt 3: {context['suggested_approach']}")

    # Test attempt 4 (should still suggest revision)
    manager.record_failure('bead-1', 'Failure 4')
    context = manager.get_context('bead-1')
    assert 'revision' in context['suggested_approach'].lower(), "Attempt 4 should suggest revision"
    print(f"  ✓ Attempt 4: {context['suggested_approach']}")

    print("✅ Suggested approach evolution test passed!\n")


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("Running EscalationManager Test Suite")
    print("=" * 60)
    print()

    tests = [
        test_escalation_manager_creation,
        test_record_failure_first_attempt,
        test_record_failure_multiple_attempts,
        test_record_failure_second_attempt,
        test_get_context,
        test_multiple_beads,
        test_suggest_approach_evolution
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
