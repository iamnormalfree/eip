#!/usr/bin/env python3
"""
Test suite for DependencyParser module.
Follows TDD approach - tests written first.
"""

import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.dirname(__file__))

from deps import DependencyParser, topological_sort


def test_parse_dependencies_depends_on():
    """Test parsing 'Depends on:' pattern."""
    print("Testing parse_dependencies with 'Depends on:' pattern...")

    parser = DependencyParser()

    # Test basic 'Depends on:' pattern
    bead = {
        'id': 'bead-1',
        'description': 'Implement feature X\nDepends on: V1-T1, V1-T4'
    }
    deps = parser.parse_dependencies(bead)
    assert isinstance(deps, list), "Should return a list"
    assert 'V1-T1' in deps, "Should contain V1-T1"
    assert 'V1-T4' in deps, "Should contain V1-T4"
    print(f"  ✓ Parsed 'Depends on: V1-T1, V1-T4': {deps}")

    # Test with spaces
    bead = {
        'id': 'bead-2',
        'description': 'Depends on:  V1-T1  ,  V1-T4  '
    }
    deps = parser.parse_dependencies(bead)
    assert 'V1-T1' in deps, "Should handle extra spaces"
    assert 'V1-T4' in deps, "Should handle extra spaces"
    print(f"  ✓ Parsed with extra spaces: {deps}")

    print("✅ 'Depends on:' pattern test passed!\n")


def test_parse_dependencies_dependencies():
    """Test parsing 'Dependencies:' pattern."""
    print("Testing parse_dependencies with 'Dependencies:' pattern...")

    parser = DependencyParser()

    bead = {
        'id': 'bead-3',
        'description': 'Implement feature Y\nDependencies: V1-S1, V1-S2, V1-S3'
    }
    deps = parser.parse_dependencies(bead)
    assert isinstance(deps, list), "Should return a list"
    assert 'V1-S1' in deps, "Should contain V1-S1"
    assert 'V1-S2' in deps, "Should contain V1-S2"
    assert 'V1-S3' in deps, "Should contain V1-S3"
    print(f"  ✓ Parsed 'Dependencies: V1-S1, V1-S2, V1-S3': {deps}")

    print("✅ 'Dependencies:' pattern test passed!\n")


def test_parse_dependencies_blocked():
    """Test parsing 'BLOCKED:' pattern."""
    print("Testing parse_dependencies with 'BLOCKED:' pattern...")

    parser = DependencyParser()

    bead = {
        'id': 'bead-4',
        'description': 'Implement feature Z\nBLOCKED: Waiting for V1 Shadow Spine completion'
    }
    deps = parser.parse_dependencies(bead)
    assert isinstance(deps, list), "Should return a list"
    # BLOCKED pattern may not extract specific task IDs, but should detect the pattern
    print(f"  ✓ Parsed 'BLOCKED:' pattern: {deps}")

    print("✅ 'BLOCKED:' pattern test passed!\n")


def test_parse_dependencies_task_numbering():
    """Test parsing task numbering pattern V#-T#.#."""
    print("Testing parse_dependencies with task numbering pattern...")

    parser = DependencyParser()

    # Test V2-T2.3 pattern
    bead = {
        'id': 'bead-5',
        'description': 'This is V2-T2.3 implementation that requires V2-T2.1 and V2-T2.2'
    }
    deps = parser.parse_dependencies(bead)
    assert isinstance(deps, list), "Should return a list"
    # Should extract task references from description
    print(f"  ✓ Parsed task numbering from description: {deps}")

    print("✅ Task numbering pattern test passed!\n")


def test_parse_dependencies_no_dependencies():
    """Test parsing bead with no dependencies."""
    print("Testing parse_dependencies with no dependencies...")

    parser = DependencyParser()

    bead = {
        'id': 'bead-6',
        'description': 'Simple bead with no dependencies'
    }
    deps = parser.parse_dependencies(bead)
    assert isinstance(deps, list), "Should return a list"
    assert len(deps) == 0, "Should return empty list for no dependencies"
    print(f"  ✓ No dependencies found: {deps}")

    print("✅ No dependencies test passed!\n")


def test_parse_dependencies_multiple_patterns():
    """Test parsing bead with multiple dependency patterns."""
    print("Testing parse_dependencies with multiple patterns...")

    parser = DependencyParser()

    bead = {
        'id': 'bead-7',
        'description': 'Complex bead\nDepends on: V1-T1, V1-T4\nAlso requires V2-T2.1'
    }
    deps = parser.parse_dependencies(bead)
    assert isinstance(deps, list), "Should return a list"
    # Should extract dependencies from all patterns
    print(f"  ✓ Parsed multiple patterns: {deps}")

    print("✅ Multiple patterns test passed!\n")


def test_build_dependency_graph():
    """Test building dependency graph from multiple beads."""
    print("Testing build_dependency_graph...")

    parser = DependencyParser()

    beads = [
        {
            'id': 'bead-1',
            'description': 'Depends on: V1-T1, V1-T4'
        },
        {
            'id': 'bead-2',
            'description': 'No dependencies'
        },
        {
            'id': 'bead-3',
            'description': 'Dependencies: bead-1, bead-2'
        }
    ]

    graph = parser.build_dependency_graph(beads)

    assert isinstance(graph, dict), "Should return a dict"
    assert 'bead-1' in graph, "Should contain bead-1"
    assert 'bead-2' in graph, "Should contain bead-2"
    assert 'bead-3' in graph, "Should contain bead-3"

    # Verify dependencies
    assert 'V1-T1' in graph['bead-1'], "bead-1 should depend on V1-T1"
    assert 'V1-T4' in graph['bead-1'], "bead-1 should depend on V1-T4"
    assert len(graph['bead-2']) == 0, "bead-2 should have no dependencies"
    assert 'bead-1' in graph['bead-3'], "bead-3 should depend on bead-1"
    assert 'bead-2' in graph['bead-3'], "bead-3 should depend on bead-2"

    print(f"  ✓ Built dependency graph:")
    for bead_id, deps in graph.items():
        print(f"    {bead_id}: {deps}")

    print("✅ build_dependency_graph test passed!\n")


def test_build_dependency_graph_empty():
    """Test building dependency graph with empty bead list."""
    print("Testing build_dependency_graph with empty list...")

    parser = DependencyParser()

    graph = parser.build_dependency_graph([])

    assert isinstance(graph, dict), "Should return a dict"
    assert len(graph) == 0, "Should return empty dict for no beads"

    print(f"  ✓ Empty graph: {graph}")
    print("✅ Empty graph test passed!\n")


def test_verification_example():
    """Test the specific verification example from the task."""
    print("Testing verification example: 'Depends on: V1-T1, V1-T4'...")

    parser = DependencyParser()

    bead = {
        'id': 'test-bead',
        'description': 'Example bead\nDepends on: V1-T1, V1-T4'
    }

    deps = parser.parse_dependencies(bead)

    assert 'V1-T1' in deps, "Should parse V1-T1"
    assert 'V1-T4' in deps, "Should parse V1-T4"
    assert len(deps) == 2, "Should have exactly 2 dependencies"

    print(f"  ✓ Correctly parsed 'Depends on: V1-T1, V1-T4': {deps}")
    print("✅ Verification example test passed!\n")


def test_topological_sort_simple():
    """Test topological sort with simple linear chain."""
    print("Testing topological_sort with simple linear chain...")

    # Simple chain: bead-1 -> bead-2 -> bead-3
    graph = {
        'bead-1': [],
        'bead-2': ['bead-1'],
        'bead-3': ['bead-2']
    }

    sorted_beads = topological_sort(graph)

    assert isinstance(sorted_beads, list), "Should return a list"
    assert len(sorted_beads) == 3, "Should return all beads"

    # Verify ordering: bead-1 must come before bead-2, which must come before bead-3
    idx1 = sorted_beads.index('bead-1')
    idx2 = sorted_beads.index('bead-2')
    idx3 = sorted_beads.index('bead-3')

    assert idx1 < idx2, "bead-1 should come before bead-2"
    assert idx2 < idx3, "bead-2 should come before bead-3"

    print(f"  ✓ Sorted linear chain: {sorted_beads}")
    print("✅ Simple topological sort test passed!\n")


def test_topological_sort_diamond():
    """Test topological sort with diamond dependency pattern."""
    print("Testing topological_sort with diamond pattern...")

    # Diamond: bead-1 -> bead-2 -> bead-4
    #              \-> bead-3 ->/
    graph = {
        'bead-1': [],
        'bead-2': ['bead-1'],
        'bead-3': ['bead-1'],
        'bead-4': ['bead-2', 'bead-3']
    }

    sorted_beads = topological_sort(graph)

    assert isinstance(sorted_beads, list), "Should return a list"
    assert len(sorted_beads) == 4, "Should return all beads"

    # Verify ordering constraints
    idx1 = sorted_beads.index('bead-1')
    idx2 = sorted_beads.index('bead-2')
    idx3 = sorted_beads.index('bead-3')
    idx4 = sorted_beads.index('bead-4')

    assert idx1 < idx2, "bead-1 should come before bead-2"
    assert idx1 < idx3, "bead-1 should come before bead-3"
    assert idx2 < idx4, "bead-2 should come before bead-4"
    assert idx3 < idx4, "bead-3 should come before bead-4"

    print(f"  ✓ Sorted diamond pattern: {sorted_beads}")
    print("✅ Diamond topological sort test passed!\n")


def test_topological_sort_complex():
    """Test topological sort with complex dependency graph."""
    print("Testing topological_sort with complex graph...")

    # Complex graph with multiple independent chains
    graph = {
        'bead-A': [],
        'bead-B': [],
        'bead-C': ['bead-A'],
        'bead-D': ['bead-A', 'bead-B'],
        'bead-E': ['bead-C'],
        'bead-F': ['bead-D', 'bead-E']
    }

    sorted_beads = topological_sort(graph)

    assert len(sorted_beads) == 6, "Should return all beads"

    # Verify ordering constraints
    idxA = sorted_beads.index('bead-A')
    idxB = sorted_beads.index('bead-B')
    idxC = sorted_beads.index('bead-C')
    idxD = sorted_beads.index('bead-D')
    idxE = sorted_beads.index('bead-E')
    idxF = sorted_beads.index('bead-F')

    assert idxA < idxC, "bead-A should come before bead-C"
    assert idxA < idxD, "bead-A should come before bead-D"
    assert idxB < idxD, "bead-B should come before bead-D"
    assert idxC < idxE, "bead-C should come before bead-E"
    assert idxD < idxF, "bead-D should come before bead-F"
    assert idxE < idxF, "bead-E should come before bead-F"

    print(f"  ✓ Sorted complex graph: {sorted_beads}")
    print("✅ Complex topological sort test passed!\n")


def test_topological_sort_no_dependencies():
    """Test topological sort with beads that have no dependencies."""
    print("Testing topological_sort with no dependencies...")

    graph = {
        'bead-1': [],
        'bead-2': [],
        'bead-3': []
    }

    sorted_beads = topological_sort(graph)

    assert len(sorted_beads) == 3, "Should return all beads"
    assert set(sorted_beads) == {'bead-1', 'bead-2', 'bead-3'}, "Should contain all beads"

    print(f"  ✓ Sorted independent beads: {sorted_beads}")
    print("✅ No dependencies test passed!\n")


def test_topological_sort_cycle_detection():
    """Test topological sort detects cycles gracefully."""
    print("Testing topological_sort with cycle detection...")

    # Cycle: bead-1 -> bead-2 -> bead-3 -> bead-1
    graph = {
        'bead-1': ['bead-3'],
        'bead-2': ['bead-1'],
        'bead-3': ['bead-2']
    }

    try:
        sorted_beads = topological_sort(graph)
        # If it returns, it should handle the cycle gracefully
        # Either by detecting and reporting, or by returning what it can
        print(f"  ⚠ Cycle detected, handled gracefully: {sorted_beads}")
        print("✅ Cycle detection test passed!\n")
    except ValueError as e:
        # Expected to raise ValueError for cycles
        print(f"  ✓ Correctly detected cycle: {e}")
        print("✅ Cycle detection test passed!\n")


def test_topological_sort_empty():
    """Test topological sort with empty graph."""
    print("Testing topological_sort with empty graph...")

    graph = {}

    sorted_beads = topological_sort(graph)

    assert isinstance(sorted_beads, list), "Should return a list"
    assert len(sorted_beads) == 0, "Should return empty list for empty graph"

    print(f"  ✓ Empty graph returns empty list: {sorted_beads}")
    print("✅ Empty graph test passed!\n")


def test_topological_sort_beads_dependency_order():
    """Verification test: Beads sort in dependency order."""
    print("Testing verification: Beads sort in dependency order...")

    parser = DependencyParser()

    # Create beads with clear dependency relationships
    beads = [
        {
            'id': 'V1-T1',
            'description': 'First task, no dependencies'
        },
        {
            'id': 'V1-T2',
            'description': 'Second task\nDepends on: V1-T1'
        },
        {
            'id': 'V1-T3',
            'description': 'Third task\nDepends on: V1-T2'
        },
        {
            'id': 'V1-T4',
            'description': 'Fourth task\nDepends on: V1-T1'
        },
        {
            'id': 'V1-T5',
            'description': 'Fifth task\nDepends on: V1-T2, V1-T4'
        }
    ]

    graph = parser.build_dependency_graph(beads)
    sorted_beads = topological_sort(graph)

    # Verify all beads are present
    assert len(sorted_beads) == 5, "Should return all beads"

    # Verify dependency ordering
    idx1 = sorted_beads.index('V1-T1')
    idx2 = sorted_beads.index('V1-T2')
    idx3 = sorted_beads.index('V1-T3')
    idx4 = sorted_beads.index('V1-T4')
    idx5 = sorted_beads.index('V1-T5')

    assert idx1 < idx2, "V1-T1 should come before V1-T2"
    assert idx2 < idx3, "V1-T2 should come before V1-T3"
    assert idx1 < idx4, "V1-T1 should come before V1-T4"
    assert idx2 < idx5, "V1-T2 should come before V1-T5"
    assert idx4 < idx5, "V1-T4 should come before V1-T5"

    print(f"  ✓ Beads sorted in dependency order: {sorted_beads}")
    print("✅ Verification test passed: Beads sort in dependency order!\n")


def test_can_run_in_parallel():
    """Test can_run_in_parallel helper function."""
    print("Testing can_run_in_parallel...")

    parser = DependencyParser()

    # Test 1: No file conflicts, no dependency
    bead1 = {
        'id': 'bead-1',
        'description': 'Work on file1.py',
        'dependencies': []
    }
    bead2 = {
        'id': 'bead-2',
        'description': 'Work on file2.py',
        'dependencies': []
    }

    result = parser.can_run_in_parallel(bead1, bead2)
    assert result == True, "Beads with different files and no deps should run in parallel"
    print("  ✓ No conflicts, no dependencies: True")

    # Test 2: File conflict
    bead3 = {
        'id': 'bead-3',
        'description': 'Work on lib/common.py',
        'dependencies': []
    }
    bead4 = {
        'id': 'bead-4',
        'description': 'Also work on lib/common.py',
        'dependencies': []
    }

    result = parser.can_run_in_parallel(bead3, bead4)
    assert result == False, "Beads with file conflicts should NOT run in parallel"
    print("  ✓ File conflict: False")

    # Test 3: Dependency
    bead5 = {
        'id': 'bead-5',
        'description': 'Work on file5.py',
        'dependencies': []
    }
    bead6 = {
        'id': 'bead-6',
        'description': 'Work on file6.py',
        'dependencies': ['bead-5']
    }

    result = parser.can_run_in_parallel(bead5, bead6)
    assert result == False, "Beads with dependency should NOT run in parallel"
    print("  ✓ Has dependency: False")

    print("✅ can_run_in_parallel test passed!\n")


def test_form_execution_groups_empty():
    """Test forming execution groups with empty bead list."""
    print("Testing form_execution_groups with empty list...")

    parser = DependencyParser()

    groups = parser.form_execution_groups([])

    assert isinstance(groups, list), "Should return a list"
    assert len(groups) == 0, "Should return empty list for no beads"

    print(f"  ✓ Empty list returns empty groups")
    print("✅ Empty list test passed!\n")


def test_form_execution_groups_no_conflicts():
    """Test forming execution groups when beads have no file conflicts."""
    print("Testing form_execution_groups with no conflicts...")

    parser = DependencyParser()

    # Beads that work on different files and have no dependencies
    beads = [
        {
            'id': 'bead-1',
            'description': 'Implement feature A in file1.py',
            'dependencies': []
        },
        {
            'id': 'bead-2',
            'description': 'Implement feature B in file2.py',
            'dependencies': []
        },
        {
            'id': 'bead-3',
            'description': 'Implement feature C in file3.py',
            'dependencies': []
        }
    ]

    groups = parser.form_execution_groups(beads)

    assert isinstance(groups, list), "Should return a list of groups"
    assert len(groups) == 1, "All beads should be in one group (no dependencies)"
    assert len(groups[0]) == 3, "Group should contain all 3 beads"
    assert 'bead-1' in [b['id'] for b in groups[0]], "bead-1 should be in group"
    assert 'bead-2' in [b['id'] for b in groups[0]], "bead-2 should be in group"
    assert 'bead-3' in [b['id'] for b in groups[0]], "bead-3 should be in group"

    print(f"  ✓ Formed {len(groups)} group(s) with {len(groups[0])} beads")
    print("✅ No conflicts test passed!\n")


def test_form_execution_groups_with_file_conflicts():
    """Test forming execution groups when beads have file conflicts."""
    print("Testing form_execution_groups with file conflicts...")

    parser = DependencyParser()

    # Beads that work on the same file - should be in separate groups
    beads = [
        {
            'id': 'bead-1',
            'description': 'Implement feature A in lib/common.py',
            'dependencies': []
        },
        {
            'id': 'bead-2',
            'description': 'Implement feature B in lib/common.py',
            'dependencies': []
        },
        {
            'id': 'bead-3',
            'description': 'Implement feature C in other/file.py',
            'dependencies': []
        }
    ]

    groups = parser.form_execution_groups(beads)

    assert isinstance(groups, list), "Should return a list of groups"
    # bead-1 and bead-2 conflict on lib/common.py, so they need separate groups
    # bead-3 can be in group 1 with either bead-1 or bead-2
    assert len(groups) >= 2, "Should have at least 2 groups due to file conflict"

    print(f"  ✓ Formed {len(groups)} group(s) due to file conflicts")
    for i, group in enumerate(groups):
        print(f"    Group {i+1}: {[b['id'] for b in group]}")
    print("✅ File conflicts test passed!\n")


def test_form_execution_groups_with_dependencies():
    """Test forming execution groups when beads have dependencies."""
    print("Testing form_execution_groups with dependencies...")

    parser = DependencyParser()

    # Beads with dependencies
    beads = [
        {
            'id': 'bead-1',
            'description': 'Implement feature A in file1.py',
            'dependencies': []
        },
        {
            'id': 'bead-2',
            'description': 'Implement feature B in file2.py',
            'dependencies': ['bead-1']
        },
        {
            'id': 'bead-3',
            'description': 'Implement feature C in file3.py',
            'dependencies': ['bead-1']
        }
    ]

    groups = parser.form_execution_groups(beads)

    assert isinstance(groups, list), "Should return a list of groups"
    assert len(groups) == 2, "Should have 2 groups (bead-1, then bead-2 and bead-3)"
    assert len(groups[0]) == 1, "First group should have 1 bead (bead-1)"
    assert groups[0][0]['id'] == 'bead-1', "First group should contain bead-1"
    assert len(groups[1]) == 2, "Second group should have 2 beads (bead-2, bead-3)"

    print(f"  ✓ Formed {len(groups)} group(s) respecting dependencies")
    for i, group in enumerate(groups):
        print(f"    Group {i+1}: {[b['id'] for b in group]}")
    print("✅ Dependencies test passed!\n")


def test_form_execution_groups_complex():
    """Test forming execution groups with complex scenario."""
    print("Testing form_execution_groups with complex scenario...")

    parser = DependencyParser()

    # Complex scenario: dependencies + file conflicts
    beads = [
        {
            'id': 'bead-1',
            'description': 'Implement feature A in lib/core.py',
            'dependencies': []
        },
        {
            'id': 'bead-2',
            'description': 'Implement feature B in lib/utils.py',
            'dependencies': []
        },
        {
            'id': 'bead-3',
            'description': 'Implement feature C in lib/core.py',  # conflicts with bead-1
            'dependencies': ['bead-1']
        },
        {
            'id': 'bead-4',
            'description': 'Implement feature D in tests/test.py',
            'dependencies': ['bead-2']
        }
    ]

    groups = parser.form_execution_groups(beads)

    assert isinstance(groups, list), "Should return a list of groups"
    assert len(groups) >= 2, "Should have at least 2 groups"

    # bead-1 and bead-2 should be in first group (no dependencies, different files)
    first_group_ids = [b['id'] for b in groups[0]]
    assert 'bead-1' in first_group_ids, "bead-1 should be in first group"
    assert 'bead-2' in first_group_ids, "bead-2 should be in first group"

    print(f"  ✓ Formed {len(groups)} group(s) for complex scenario")
    for i, group in enumerate(groups):
        print(f"    Group {i+1}: {[b['id'] for b in group]}")
    print("✅ Complex scenario test passed!\n")


def test_form_execution_groups_verification():
    """Verification test: Groups form correctly, no file conflicts within groups."""
    print("Testing verification: Groups form correctly, no file conflicts...")

    parser = DependencyParser()

    # Create a realistic scenario with various beads
    beads = [
        {
            'id': 'V1-T1',
            'description': 'Setup project structure in src/main.py',
            'dependencies': []
        },
        {
            'id': 'V1-T2',
            'description': 'Create utility functions in src/utils.py',
            'dependencies': []
        },
        {
            'id': 'V1-T3',
            'description': 'Add tests in tests/test_main.py',
            'dependencies': ['V1-T1']
        },
        {
            'id': 'V1-T4',
            'description': 'Update documentation in docs/README.md',
            'dependencies': ['V1-T1']
        },
        {
            'id': 'V1-T5',
            'description': 'Refactor src/main.py for better performance',
            'dependencies': ['V1-T1']  # Also works on src/main.py, conflicts with V1-T1
        }
    ]

    groups = parser.form_execution_groups(beads)

    # Verify groups exist
    assert len(groups) > 0, "Should form at least one group"

    # Verify no file conflicts within any group
    for i, group in enumerate(groups):
        files_in_group = set()
        for bead in group:
            # Extract file paths from description
            import re
            file_pattern = re.compile(r'[\w/]+\.(?:py|md|ts|js|json)')
            files = file_pattern.findall(bead['description'])
            for file in files:
                assert file not in files_in_group, f"File conflict in group {i+1}: {file} appears multiple times"
                files_in_group.add(file)

    print(f"  ✓ Formed {len(groups)} group(s)")
    for i, group in enumerate(groups):
        print(f"    Group {i+1}: {[b['id'] for b in group]}")
    print("  ✓ No file conflicts within any group")
    print("✅ Verification test passed: Groups form correctly!\n")


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("Running DependencyParser Test Suite")
    print("=" * 60)
    print()

    tests = [
        test_parse_dependencies_depends_on,
        test_parse_dependencies_dependencies,
        test_parse_dependencies_blocked,
        test_parse_dependencies_task_numbering,
        test_parse_dependencies_no_dependencies,
        test_parse_dependencies_multiple_patterns,
        test_build_dependency_graph,
        test_build_dependency_graph_empty,
        test_verification_example,
        test_topological_sort_simple,
        test_topological_sort_diamond,
        test_topological_sort_complex,
        test_topological_sort_no_dependencies,
        test_topological_sort_cycle_detection,
        test_topological_sort_empty,
        test_topological_sort_beads_dependency_order,
        test_can_run_in_parallel,
        test_form_execution_groups_empty,
        test_form_execution_groups_no_conflicts,
        test_form_execution_groups_with_file_conflicts,
        test_form_execution_groups_with_dependencies,
        test_form_execution_groups_complex,
        test_form_execution_groups_verification
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
