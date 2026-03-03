#!/usr/bin/env python3
"""
DependencyParser module for MAF-BDD Orchestrator.
Parses dependencies from bead descriptions and builds dependency graphs.
"""

import re
from typing import List, Dict, Any
from collections import deque


class DependencyParser:
    """
    Parses dependencies from bead descriptions and builds dependency graphs.

    Supports multiple dependency patterns:
    - 'Depends on: V1-T1, V1-T4'
    - 'Dependencies: V1-S1, V1-S2, V1-S3'
    - 'BLOCKED: Waiting for V1 Shadow Spine completion'
    - Task numbering: 'V2-T2.3' references to 'V2-T2.1', 'V2-T2.2'
    """

    def __init__(self):
        """Initialize the DependencyParser with regex patterns."""
        # Pattern for 'Depends on: <deps>'
        self.depends_on_pattern = re.compile(
            r'Depends\s+on:\s*([^\n]+)',
            re.IGNORECASE
        )

        # Pattern for 'Dependencies: <deps>'
        self.dependencies_pattern = re.compile(
            r'Dependencies:\s*([^\n]+)',
            re.IGNORECASE
        )

        # Pattern for 'BLOCKED: <info>'
        self.blocked_pattern = re.compile(
            r'BLOCKED:\s*([^\n]+)',
            re.IGNORECASE
        )

        # Pattern for task numbering V#-T#.# (e.g., V2-T2.3, V1-T1.5)
        # This captures both explicit dependencies and task references in text
        self.task_pattern = re.compile(
            r'V\d+-T[\d.]+',
            re.IGNORECASE
        )

        # Pattern for file paths in descriptions (e.g., "lib/file.py", "src/main.ts")
        # Matches common programming file extensions
        self.file_pattern = re.compile(
            r'[\w/]+\.(?:py|js|ts|jsx|tsx|java|go|rs|c|cpp|h|cs|rb|php|swift|kt|scala|md|json|yaml|yml|xml|html|css|scss|sass)',
            re.IGNORECASE
        )

    def parse_dependencies(self, bead: Dict[str, Any]) -> List[str]:
        """
        Parse dependencies from a bead description.

        Args:
            bead: A bead dictionary with at least 'id' and 'description' keys

        Returns:
            A list of dependency identifiers (e.g., ['V1-T1', 'V1-T4'])
        """
        if not isinstance(bead, dict):
            return []

        description = bead.get('description', '')
        if not description:
            return []

        dependencies = set()

        # Try 'Depends on:' pattern
        match = self.depends_on_pattern.search(description)
        if match:
            deps = self._extract_dependencies_from_text(match.group(1))
            dependencies.update(deps)

        # Try 'Dependencies:' pattern
        match = self.dependencies_pattern.search(description)
        if match:
            deps = self._extract_dependencies_from_text(match.group(1))
            dependencies.update(deps)

        # Try 'BLOCKED:' pattern
        match = self.blocked_pattern.search(description)
        if match:
            # Extract task references from BLOCKED text
            blocked_text = match.group(1)
            tasks = self.task_pattern.findall(blocked_text)
            dependencies.update(tasks)

        # Also scan entire description for task numbering references
        # This catches cases like "requires V2-T2.1 and V2-T2.2"
        all_tasks = self.task_pattern.findall(description)
        # Add tasks that aren't already in dependencies from explicit patterns
        for task in all_tasks:
            # Don't add the bead's own task ID if mentioned in description
            if task != bead.get('id'):
                dependencies.add(task)

        return sorted(list(dependencies))

    def _extract_dependencies_from_text(self, text: str) -> List[str]:
        """
        Extract dependency identifiers from comma-separated text.

        Args:
            text: Comma-separated dependency text (e.g., "V1-T1, V1-T4")

        Returns:
            A list of cleaned dependency identifiers
        """
        if not text:
            return []

        # Split by comma and clean each item
        deps = []
        for item in text.split(','):
            cleaned = item.strip()
            if cleaned:
                deps.append(cleaned)

        return deps

    def build_dependency_graph(self, beads: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Build a dependency graph from a list of beads.

        Args:
            beads: A list of bead dictionaries

        Returns:
            A dictionary mapping bead_id to list of dependencies
            e.g., {'bead-1': ['V1-T1', 'V1-T4'], 'bead-2': []}
        """
        graph = {}

        for bead in beads:
            bead_id = bead.get('id')
            if not bead_id:
                continue

            dependencies = self.parse_dependencies(bead)
            graph[bead_id] = dependencies

        return graph

    def _extract_file_paths(self, bead: Dict[str, Any]) -> set:
        """
        Extract file paths from a bead description.

        Args:
            bead: A bead dictionary with at least 'description' key

        Returns:
            A set of file paths mentioned in the description
        """
        description = bead.get('description', '')
        if not description:
            return set()

        files = self.file_pattern.findall(description)
        return set(files)

    def can_run_in_parallel(self, bead1: Dict[str, Any], bead2: Dict[str, Any]) -> bool:
        """
        Check if two beads can run in parallel without conflicts.

        Two beads can run in parallel if:
        1. They have no file conflicts (don't work on the same files)
        2. They have no dependency relationship

        Args:
            bead1: First bead dictionary
            bead2: Second bead dictionary

        Returns:
            True if beads can run in parallel, False otherwise
        """
        # Check for file conflicts
        files1 = self._extract_file_paths(bead1)
        files2 = self._extract_file_paths(bead2)

        if files1 & files2:  # Intersection is non-empty = conflict
            return False

        # Check for dependency relationship
        bead1_id = bead1.get('id')
        bead2_id = bead2.get('id')
        bead1_deps = bead1.get('dependencies', [])
        bead2_deps = bead2.get('dependencies', [])

        # If bead1 depends on bead2 or vice versa, they can't run in parallel
        if bead2_id in bead1_deps or bead1_id in bead2_deps:
            return False

        # No conflicts, no dependencies - safe to run in parallel
        return True

    def form_execution_groups(self, sorted_beads: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Form execution groups from a list of topologically sorted beads.

        Groups beads into levels where each group can execute in parallel:
        - Iterates through sorted beads
        - Checks if each bead can run in parallel with beads in current group
        - Starts a new group if conflicts are found
        - Returns list of groups

        Args:
            sorted_beads: A list of bead dictionaries sorted in dependency order.
                         Each bead should have 'id', 'description', and 'dependencies' keys.

        Returns:
            A list of groups, where each group is a list of beads that can execute in parallel.
            e.g., [[bead1, bead2], [bead3, bead4], [bead5]]

        Verification:
            Groups form correctly respecting dependencies, and no file conflicts within groups.
        """
        if not sorted_beads:
            return []

        groups = []
        current_group = []
        completed_beads = set()

        for bead in sorted_beads:
            bead_id = bead.get('id')
            bead_deps = bead.get('dependencies', [])

            # Check if all dependencies are completed
            pending_deps = [dep for dep in bead_deps if dep not in completed_beads]
            if pending_deps:
                # Cannot add to current group - dependencies not satisfied
                # Start a new group (this should not happen with properly sorted beads)
                if current_group:
                    groups.append(current_group)
                    current_group = []
                    # Mark all beads in previous groups as completed
                    for group in groups:
                        for b in group:
                            completed_beads.add(b.get('id'))

            # Check if bead can run in parallel with all beads in current group
            can_add_to_current = True
            for group_bead in current_group:
                if not self.can_run_in_parallel(bead, group_bead):
                    can_add_to_current = False
                    break

            if can_add_to_current:
                # Add to current group
                current_group.append(bead)
            else:
                # Start new group
                if current_group:
                    groups.append(current_group)
                    # Mark beads in completed group as done
                    for b in current_group:
                        completed_beads.add(b.get('id'))
                current_group = [bead]

        # Don't forget the last group
        if current_group:
            groups.append(current_group)

        return groups


def topological_sort(graph: Dict[str, List[str]]) -> List[str]:
    """
    Sort beads by dependency order using Kahn's algorithm.

    Args:
        graph: A dictionary mapping bead_id to list of dependencies
               e.g., {'bead-1': [], 'bead-2': ['bead-1'], 'bead-3': ['bead-2']}

    Returns:
        A list of bead IDs in dependency order (dependencies before dependents)

    Raises:
        ValueError: If a cycle is detected in the dependency graph
    """
    if not graph:
        return []

    # Create a copy of the graph and include all nodes (including external dependencies)
    all_nodes = set(graph.keys())
    for deps in graph.values():
        all_nodes.update(deps)

    # Build adjacency list: for each node, which nodes depend on it
    # and calculate in-degree for each node
    adj_list = {node: [] for node in all_nodes}
    in_degree = {node: 0 for node in all_nodes}

    # For each node and its dependencies
    for node, dependencies in graph.items():
        for dep in dependencies:
            # node depends on dep, so dep -> node edge
            if dep in adj_list:
                adj_list[dep].append(node)
                in_degree[node] += 1
            # Note: if dep is not in all_nodes, it's already added via set update

    # Initialize queue with all nodes that have no dependencies (in-degree == 0)
    queue = deque([node for node in all_nodes if in_degree[node] == 0])
    result = []

    # Process nodes in topological order
    while queue:
        # Remove a node with no dependencies
        node = queue.popleft()
        result.append(node)

        # For each node that depends on the current node
        # Reduce its in-degree by 1
        for dependent in adj_list[node]:
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)

    # Check if all nodes were processed (cycle detection)
    if len(result) != len(all_nodes):
        # There's a cycle - some nodes couldn't be processed
        unprocessed = all_nodes - set(result)
        raise ValueError(f"Cycle detected in dependency graph. Unreachable nodes: {unprocessed}")

    return result
