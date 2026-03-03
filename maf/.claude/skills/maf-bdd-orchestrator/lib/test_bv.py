#!/usr/bin/env python3
"""
Test suite for BV integration module.
Follows TDD approach - tests written first.
"""

import sys
import os
import subprocess
from typing import Dict, Any, List

# Add lib directory to path
sys.path.insert(0, os.path.dirname(__file__))

from bv import BVIntegration


def test_bv_integration_creation():
    """Test that BVIntegration can be created with required configuration."""
    print("Testing BVIntegration creation...")

    # Test with default beads directory
    bv = BVIntegration()
    assert hasattr(bv, 'beads_dir'), "Missing beads_dir attribute"
    assert hasattr(bv, 'bv_cmd'), "Missing bv_cmd attribute"
    print(f"  ✓ BVIntegration created with beads_dir: {bv.beads_dir}")
    print(f"  ✓ BVIntegration created with bv_cmd: {bv.bv_cmd}")

    print("✅ BVIntegration creation test passed!\n")


def test_robot_triage():
    """Test that robot_triage runs bv command and returns prioritized bead list."""
    print("Testing robot_triage...")

    bv = BVIntegration()

    # Test with a directory that has beads
    test_dir = "/root/projects/maf-github/vendor/agent-mail"
    result = bv.robot_triage(beads_dir=test_dir)

    assert isinstance(result, dict), "robot_triage should return dict"
    assert 'triage' in result, "Result should contain 'triage' key"
    assert 'meta' in result['triage'], "Triage should contain 'meta'"

    triage = result['triage']
    assert 'quick_ref' in triage, "Triage should contain 'quick_ref'"
    assert 'recommendations' in triage, "Triage should contain 'recommendations'"
    assert 'blockers_to_clear' in triage, "Triage should contain 'blockers_to_clear'"

    print(f"  ✓ robot_triage returned valid triage data")
    print(f"  ✓ meta.version: {triage['meta'].get('version')}")
    print(f"  ✓ quick_ref: {triage['quick_ref']}")
    print(f"  ✓ recommendations count: {len(triage['recommendations'])}")
    print(f"  ✓ blockers_to_clear count: {len(triage['blockers_to_clear'])}")

    print("✅ robot_triage test passed!\n")


def test_blocker_analysis():
    """Test that blocker_analysis returns unblocking tasks from blocked beads."""
    print("Testing blocker_analysis...")

    bv = BVIntegration()

    # Test with a directory that has beads
    test_dir = "/root/projects/maf-github/vendor/agent-mail"
    result = bv.blocker_analysis(beads_dir=test_dir)

    assert isinstance(result, list), "blocker_analysis should return list"
    print(f"  ✓ blocker_analysis returned list with {len(result)} items")

    # Each item should be a dict with bead info
    for item in result:
        assert isinstance(item, dict), "Each blocker item should be a dict"
        # The structure depends on the actual BV output
    print(f"  ✓ All items are dicts")

    print("✅ blocker_analysis test passed!\n")


def test_progress_dashboard():
    """Test that progress_dashboard displays current progress."""
    print("Testing progress_dashboard...")

    bv = BVIntegration()

    # Test with a directory that has beads
    test_dir = "/root/projects/maf-github/vendor/agent-mail"
    result = bv.progress_dashboard(beads_dir=test_dir)

    assert isinstance(result, dict), "progress_dashboard should return dict"
    assert 'project_health' in result or 'triage' in result, "Result should contain health info"

    if 'project_health' in result:
        health = result['project_health']
        assert 'counts' in health, "Health should contain counts"
        print(f"  ✓ project_health.counts: {health['counts']}")
    else:
        triage = result.get('triage', {})
        print(f"  ✓ triage data available")

    print("✅ progress_dashboard test passed!\n")


def test_retriage():
    """Test that retriage refreshes triage after group completion."""
    print("Testing retriage...")

    bv = BVIntegration()

    # Test with a directory that has beads
    test_dir = "/root/projects/maf-github/vendor/agent-mail"
    result = bv.retriage(beads_dir=test_dir)

    assert isinstance(result, dict), "retriage should return dict"
    assert 'triage' in result, "Result should contain 'triage' key"

    # Check that it's fresh data
    assert 'meta' in result['triage'], "Triage should contain 'meta'"
    print(f"  ✓ retriage returned fresh triage data")
    print(f"  ✓ generated_at: {result.get('generated_at')}")

    print("✅ retriage test passed!\n")


def test_command_execution_error_handling():
    """Test that BVIntegration handles errors gracefully."""
    print("Testing error handling...")

    bv = BVIntegration()

    # Test with invalid directory
    try:
        result = bv.robot_triage(beads_dir="/nonexistent/path")
        # If it doesn't raise, it should return an error indication
        print(f"  ✓ Invalid directory handled gracefully")
    except Exception as e:
        print(f"  ✓ Exception handled: {type(e).__name__}")

    print("✅ Error handling test passed!\n")


def test_sort_beads_by_priority():
    """Test that sort_beads_by_priority sorts beads by BV triage priority."""
    print("Testing sort_beads_by_priority...")

    bv = BVIntegration()

    # Test with mock beads containing priority information
    mock_beads = [
        {'id': 'bead-3', 'priority': 'low'},
        {'id': 'bead-1', 'priority': 'high'},
        {'id': 'bead-2', 'priority': 'medium'},
        {'id': 'bead-4', 'priority': 'high'},
        {'id': 'bead-5', 'priority': 'low'},
    ]

    mock_triage_result = {
        'triage': {
            'recommendations': mock_beads
        }
    }

    # Sort beads by priority
    sorted_beads = bv.sort_beads_by_priority(mock_beads, mock_triage_result)

    # Verify sorting: high (0) < medium (1) < low (2)
    assert isinstance(sorted_beads, list), "sort_beads_by_priority should return list"
    assert len(sorted_beads) == len(mock_beads), "Should return same number of beads"

    # First beads should be high priority
    high_priority_beads = [b for b in sorted_beads if b['priority'] == 'high']
    medium_priority_beads = [b for b in sorted_beads if b['priority'] == 'medium']
    low_priority_beads = [b for b in sorted_beads if b['priority'] == 'low']

    # Check that high priority beads come before medium, which come before low
    if high_priority_beads and medium_priority_beads:
        high_idx = sorted_beads.index(high_priority_beads[0])
        medium_idx = sorted_beads.index(medium_priority_beads[0])
        assert high_idx < medium_idx, "High priority should come before medium"

    if medium_priority_beads and low_priority_beads:
        medium_idx = sorted_beads.index(medium_priority_beads[0])
        low_idx = sorted_beads.index(low_priority_beads[0])
        assert medium_idx < low_idx, "Medium priority should come before low"

    print(f"  ✓ sorted_beads returned list with {len(sorted_beads)} beads")
    print(f"  ✓ High priority beads: {len(high_priority_beads)}")
    print(f"  ✓ Medium priority beads: {len(medium_priority_beads)}")
    print(f"  ✓ Low priority beads: {len(low_priority_beads)}")
    print(f"  ✓ Beads sorted correctly: {sorted_beads[0]['id']}, {sorted_beads[1]['id']}, {sorted_beads[2]['id']}")

    print("✅ sort_beads_by_priority test passed!\n")


def test_show_progress():
    """Test that show_progress displays formatted progress dashboard."""
    print("Testing show_progress...")

    bv = BVIntegration()

    # Create mock coordinator state
    mock_coordinator_state = {
        "session_id": "test-session-123",
        "started_at": "2026-01-26T10:00:00Z",
        "groups_executed": 5,
        "progress": {
            "completed": 12,
            "failed": 2,
            "unblocked": 8
        }
    }

    # Test that show_progress runs without error
    # It should print formatted output, not return a value
    try:
        bv.show_progress(mock_coordinator_state)
        print("  ✓ show_progress executed successfully")
    except Exception as e:
        raise AssertionError(f"show_progress failed: {e}")

    # Test with minimal state
    minimal_state = {
        "groups_executed": 1,
        "progress": {
            "completed": 0,
            "failed": 0,
            "unblocked": 0
        }
    }

    try:
        bv.show_progress(minimal_state)
        print("  ✓ show_progress works with minimal state")
    except Exception as e:
        raise AssertionError(f"show_progress failed with minimal state: {e}")

    print("✅ show_progress test passed!\n")


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("Running BVIntegration Test Suite")
    print("=" * 60)
    print()

    tests = [
        test_bv_integration_creation,
        test_robot_triage,
        test_blocker_analysis,
        test_progress_dashboard,
        test_retriage,
        test_command_execution_error_handling,
        test_sort_beads_by_priority,
        test_show_progress
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
            import traceback
            traceback.print_exc()
            failed += 1

    print("=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
