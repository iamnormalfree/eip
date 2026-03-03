"""
Pre-flight validation module for MAF-BDD Orchestrator.

This module provides the PreFlightChecker class which validates that the
workspace is ready for autonomous BDD execution. Checks include git status,
branch verification, uncommitted changes detection, and dependency validation.
"""

import os
import subprocess
from typing import Tuple, List


class PreFlightChecker:
    """
    Validates workspace readiness before autonomous execution.

    Performs essential pre-flight checks to ensure the workspace is in a
    clean state before running autonomous BDD operations. Prevents execution
    in problematic states that could lead to data loss or unpredictable behavior.

    Checks performed:
    - git_clean: Verifies working directory is clean (no modified/untracked files)
    - branch: Verifies current branch is 'main'
    - uncommitted: Additional check for staged but uncommitted changes
    - deps: Verifies dependencies are installed (node_modules, venv, etc.)
    """

    @staticmethod
    def report(passed: bool, failed: List[str]) -> str:
        """
        Generate formatted pre-flight check report.

        Creates a human-readable report with emoji indicators showing the
        status of pre-flight validation.

        Args:
            passed: True if all checks passed, False otherwise
            failed: List of check names that failed (empty if all passed)

        Returns:
            Formatted report string with appropriate emoji indicator:
            - If passed: 'All pre-flight checks passed ✓'
            - If failed: 'Pre-flight failed: [failed_list] ✗'

        Example:
            >>> PreFlightChecker.report(True, [])
            'All pre-flight checks passed ✓'
            >>> PreFlightChecker.report(False, ['git_clean', 'branch'])
            'Pre-flight failed: [git_clean, branch] ✗'
        """
        if passed:
            return 'All pre-flight checks passed ✓'
        else:
            failed_list = ', '.join(failed)
            return f'Pre-flight failed: [{failed_list}] ✗'

    def check_all(self) -> Tuple[bool, List[str]]:
        """
        Run all pre-flight checks.

        Executes all validation checks and reports results. This is the main
        entry point for pre-flight validation.

        Returns:
            Tuple containing:
            - bool: True if all checks passed, False otherwise
            - list: Names of failed checks (empty if all passed)

        Example:
            >>> checker = PreFlightChecker()
            >>> passed, failed = checker.check_all()
            >>> if not passed:
            ...     print(f"Failed checks: {', '.join(failed)}")
        """
        checks = {
            'git_clean': self._check_git_clean(),
            'branch': self._check_branch(),
            'uncommitted': self._check_uncommitted(),
            'deps': self._check_deps()
        }

        failed = [name for name, passed in checks.items() if not passed]
        all_passed = len(failed) == 0

        return all_passed, failed

    def _check_git_clean(self) -> bool:
        """
        Check if git working directory is clean.

        Runs 'git status --porcelain' to detect any modified, added, or
        untracked files. A clean workspace has no output from this command.

        Returns:
            True if working directory is clean (no changes), False otherwise

        Note:
            Returns False if git command fails (e.g., not in a git repo).
        """
        try:
            result = subprocess.run(
                ['git', 'status', '--porcelain'],
                capture_output=True,
                text=True,
                check=False
            )

            # Clean if no output (no modified/untracked files)
            return len(result.stdout.strip()) == 0

        except (FileNotFoundError, OSError):
            return False

    def _check_branch(self) -> bool:
        """
        Check if currently on main branch.

        Runs 'git branch --show-current' to verify the branch name.
        Autonomous execution should only occur on main branch to prevent
        accidental work on feature branches.

        Returns:
            True if current branch is 'main', False otherwise

        Note:
            Returns False if git command fails or branch is not main.
        """
        try:
            result = subprocess.run(
                ['git', 'branch', '--show-current'],
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode != 0:
                return False

            current_branch = result.stdout.strip()
            return current_branch == 'main'

        except (FileNotFoundError, OSError):
            return False

    def _check_uncommitted(self) -> bool:
        """
        Check for uncommitted changes beyond basic git clean check.

        This provides an additional safety check by running 'git diff' to
        detect any changes that might be staged but not yet committed.
        Complements _check_git_clean() for thorough validation.

        Returns:
            True if no uncommitted changes, False if changes detected

        Note:
            Returns False if git command fails.
        """
        try:
            # Check for unstaged changes
            result = subprocess.run(
                ['git', 'diff', '--name-only'],
                capture_output=True,
                text=True,
                check=False
            )

            if result.stdout.strip():
                return False

            # Check for staged but uncommitted changes
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only'],
                capture_output=True,
                text=True,
                check=False
            )

            # No uncommitted changes if no output
            return len(result.stdout.strip()) == 0

        except (FileNotFoundError, OSError):
            return False

    def _check_deps(self) -> bool:
        """
        Check if project dependencies are installed.

        Verifies existence of common dependency directories:
        - node_modules (for Node.js/npm projects)
        - venv (Python virtual environment)
        - .venv (alternative Python venv naming)

        This is a basic check - in production you might want to verify
        specific dependencies or run package manager commands.

        Returns:
            True if at least one dependency directory exists, False otherwise

        Note:
            This is a heuristic check. Projects without dependencies or
            with different dependency structures may need customization.
        """
        # Check for Node.js dependencies
        if os.path.exists('node_modules'):
            return True

        # Check for Python virtual environments
        if os.path.exists('venv') or os.path.exists('.venv'):
            return True

        # No dependency directories found
        return False
