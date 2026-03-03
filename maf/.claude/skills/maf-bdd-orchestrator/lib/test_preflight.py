"""
Test suite for PreFlightChecker module.

Tests the pre-flight validation system that ensures the workspace
is ready for autonomous BDD execution.
"""

import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

from lib.preflight import PreFlightChecker


class TestPreFlightChecker(unittest.TestCase):
    """Test cases for PreFlightChecker class."""

    def setUp(self):
        """Set up test fixtures."""
        self.checker = PreFlightChecker()

    def test_check_all_returns_tuple(self):
        """Test that check_all returns a tuple of (bool, list)."""
        result = self.checker.check_all()
        self.assertIsInstance(result, tuple)
        self.assertEqual(len(result), 2)
        self.assertIsInstance(result[0], bool)
        self.assertIsInstance(result[1], list)

    def test_check_all_includes_failed_checks(self):
        """Test that failed checks are reported in the failed list."""
        with patch.object(self.checker, '_check_git_clean', return_value=False), \
             patch.object(self.checker, '_check_branch', return_value=True), \
             patch.object(self.checker, '_check_uncommitted', return_value=True), \
             patch.object(self.checker, '_check_deps', return_value=True):
            passed, failed = self.checker.check_all()
            self.assertFalse(passed)
            self.assertIn('git_clean', failed)

    def test_check_all_all_checks_pass(self):
        """Test that check_all returns True when all checks pass."""
        with patch.object(self.checker, '_check_git_clean', return_value=True), \
             patch.object(self.checker, '_check_branch', return_value=True), \
             patch.object(self.checker, '_check_uncommitted', return_value=True), \
             patch.object(self.checker, '_check_deps', return_value=True):
            passed, failed = self.checker.check_all()
            self.assertTrue(passed)
            self.assertEqual(len(failed), 0)

    def test_check_git_clean_with_no_output(self):
        """Test _check_git_clean returns True when git status is clean."""
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.stdout = ''
            mock_result.returncode = 0
            mock_run.return_value = mock_result

            result = self.checker._check_git_clean()
            self.assertTrue(result)
            mock_run.assert_called_once_with(
                ['git', 'status', '--porcelain'],
                capture_output=True,
                text=True,
                check=False
            )

    def test_check_git_clean_with_output(self):
        """Test _check_git_clean returns False when git status shows changes."""
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.stdout = 'M file.py\n?? new_file.py\n'
            mock_result.returncode = 0
            mock_run.return_value = mock_result

            result = self.checker._check_git_clean()
            self.assertFalse(result)

    def test_check_git_clean_command_failure(self):
        """Test _check_git_clean returns False when git command fails."""
        with patch('subprocess.run') as mock_run:
            # Simulate a file not found error
            mock_run.side_effect = FileNotFoundError("git not found")

            result = self.checker._check_git_clean()
            self.assertFalse(result)

    def test_check_branch_on_main(self):
        """Test _check_branch returns True when on main branch."""
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.stdout.strip.return_value = 'main'
            mock_result.returncode = 0
            mock_run.return_value = mock_result

            result = self.checker._check_branch()
            self.assertTrue(result)
            mock_run.assert_called_once_with(
                ['git', 'branch', '--show-current'],
                capture_output=True,
                text=True,
                check=False
            )

    def test_check_branch_on_feature_branch(self):
        """Test _check_branch returns False when on feature branch."""
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.stdout.strip.return_value = 'feature/test-branch'
            mock_result.returncode = 0
            mock_run.return_value = mock_result

            result = self.checker._check_branch()
            self.assertFalse(result)

    def test_check_branch_command_failure(self):
        """Test _check_branch returns False when git command fails."""
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.returncode = 1
            mock_run.return_value = mock_result

            result = self.checker._check_branch()
            self.assertFalse(result)

    def test_check_uncommitted_no_uncommitted_changes(self):
        """Test _check_uncommitted returns True when no uncommitted changes."""
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.stdout = ''
            mock_result.returncode = 0
            mock_run.return_value = mock_result

            result = self.checker._check_uncommitted()
            self.assertTrue(result)

    def test_check_uncommitted_with_uncommitted_changes(self):
        """Test _check_uncommitted returns False when there are uncommitted changes."""
        with patch('subprocess.run') as mock_run:
            # git diff returns output for staged but not committed changes
            mock_result = Mock()
            mock_result.stdout = 'some changes'
            mock_result.returncode = 0
            mock_run.return_value = mock_result

            result = self.checker._check_uncommitted()
            self.assertFalse(result)

    def test_check_deps_node_modules_exists(self):
        """Test _check_deps returns True when node_modules exists."""
        with patch('os.path.exists', return_value=True):
            result = self.checker._check_deps()
            self.assertTrue(result)

    def test_check_deps_node_modules_missing(self):
        """Test _check_deps returns False when node_modules missing."""
        with patch('os.path.exists', return_value=False):
            result = self.checker._check_deps()
            self.assertFalse(result)

    def test_integration_clean_environment(self):
        """
        Integration test: Verify all checks pass in clean environment.

        This test runs actual git commands to verify the checker works
        in the current repository state.
        """
        checker = PreFlightChecker()
        passed, failed = checker.check_all()

        # Result should be a valid tuple
        self.assertIsInstance(passed, bool)
        self.assertIsInstance(failed, list)

        # If checks failed, they should be identifiable
        if not passed:
            for check_name in failed:
                self.assertIn(check_name, ['git_clean', 'branch', 'uncommitted', 'deps'])

    def test_report_all_passed(self):
        """Test report returns success message with checkmark when all checks pass."""
        result = PreFlightChecker.report(True, [])
        self.assertEqual(result, 'All pre-flight checks passed ✓')

    def test_report_single_failure(self):
        """Test report returns failure message with single failed check."""
        result = PreFlightChecker.report(False, ['git_clean'])
        self.assertEqual(result, 'Pre-flight failed: [git_clean] ✗')

    def test_report_multiple_failures(self):
        """Test report returns failure message with multiple failed checks."""
        result = PreFlightChecker.report(False, ['git_clean', 'branch', 'deps'])
        self.assertEqual(result, 'Pre-flight failed: [git_clean, branch, deps] ✗')

    def test_report_preserves_failed_check_order(self):
        """Test report maintains order of failed checks in list."""
        failed_checks = ['branch', 'deps', 'git_clean', 'uncommitted']
        result = PreFlightChecker.report(False, failed_checks)
        self.assertIn('branch, deps, git_clean, uncommitted', result)


if __name__ == '__main__':
    unittest.main()
