"""
Tests for MAFBDDCoordinator error handling in _execute_bead_safe method.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import subprocess
import json
import logging

# Add parent directory to path for imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from coordinator import MAFBDDCoordinator


class TestExecuteBeadSafeErrorHandling(unittest.TestCase):
    """Test comprehensive error handling in _execute_bead_safe method."""

    def setUp(self):
        """Set up test fixtures."""
        self.coordinator = MAFBDDCoordinator(beads_dir="/tmp/beads")

    @patch('coordinator.logger')
    def test_handles_subprocess_called_process_error(self, mock_logger):
        """Test that subprocess.CalledProcessError is caught and handled gracefully."""
        bead = {'id': 'test-bead-1'}

        # Mock _execute_bead to raise subprocess.CalledProcessError
        with patch.object(self.coordinator, '_execute_bead', side_effect=subprocess.CalledProcessError(
            returncode=1,
            cmd=['test', 'command'],
            stderr='Command failed'
        )):
            result = self.coordinator._execute_bead_safe(bead)

        # Verify error was handled gracefully
        self.assertEqual(result['status'], 'failed')
        self.assertIn('Command failed', result['reason'])
        mock_logger.error.assert_called()

    @patch('coordinator.logger')
    def test_handles_json_decode_error(self, mock_logger):
        """Test that json.JSONDecodeError is caught and handled gracefully."""
        bead = {'id': 'test-bead-2'}

        # Mock _execute_bead to raise json.JSONDecodeError
        with patch.object(self.coordinator, '_execute_bead', side_effect=json.JSONDecodeError(
            "Invalid JSON",
            "doc",
            0
        )):
            result = self.coordinator._execute_bead_safe(bead)

        # Verify error was handled gracefully
        self.assertEqual(result['status'], 'failed')
        self.assertIn('Invalid output', result['reason'])
        mock_logger.error.assert_called()

    @patch('coordinator.logger')
    def test_handles_generic_exception(self, mock_logger):
        """Test that generic Exception is caught and handled gracefully."""
        bead = {'id': 'test-bead-3'}

        # Mock _execute_bead to raise generic Exception
        with patch.object(self.coordinator, '_execute_bead', side_effect=Exception("Unexpected error")):
            result = self.coordinator._execute_bead_safe(bead)

        # Verify error was handled gracefully
        self.assertEqual(result['status'], 'failed')
        self.assertIn('Unexpected error', result['reason'])
        mock_logger.error.assert_called()

    @patch('coordinator.logger')
    def test_records_failure_in_escalation_context(self, mock_logger):
        """Test that failures are recorded in escalation manager."""
        bead = {'id': 'test-bead-4'}

        # Mock the escalation manager's record_failure method
        with patch.object(self.coordinator.escalation, 'record_failure') as mock_record:
            # Mock _execute_bead to raise exception
            with patch.object(self.coordinator, '_execute_bead', side_effect=Exception("Test error")):
                result = self.coordinator._execute_bead_safe(bead)

            # Verify failure was recorded in escalation manager
            mock_record.assert_called_once()
            call_args = mock_record.call_args
            self.assertEqual(call_args[0][0], 'test-bead-4')
            self.assertIsNotNone(call_args[0][1])

    @patch('coordinator.logger')
    def test_logs_all_exceptions(self, mock_logger):
        """Test that all exceptions are logged."""
        bead = {'id': 'test-bead-5'}

        # Mock _execute_bead to raise exception
        with patch.object(self.coordinator, '_execute_bead', side_effect=Exception("Test error")):
            result = self.coordinator._execute_bead_safe(bead)

        # Verify error was logged
        mock_logger.error.assert_called()

    @patch('coordinator.logger')
    def test_returns_success_on_successful_execution(self, mock_logger):
        """Test that successful execution returns success status."""
        bead = {'id': 'test-bead-6'}

        # Mock _execute_bead to return success
        with patch.object(self.coordinator, '_execute_bead', return_value={'status': 'success'}):
            result = self.coordinator._execute_bead_safe(bead)

        # Verify success was returned
        self.assertEqual(result['status'], 'success')

    @patch('coordinator.logger')
    def test_escalates_all_exceptions(self, mock_logger):
        """Test that all exceptions are escalated (not swallowed)."""
        bead = {'id': 'test-bead-7'}

        # Mock _execute_bead to raise exception
        with patch.object(self.coordinator, '_execute_bead', side_effect=Exception("Test error")):
            result = self.coordinator._execute_bead_safe(bead)

        # Verify exception was handled (escalated to failure result)
        self.assertEqual(result['status'], 'failed')
        self.assertIsNotNone(result.get('reason'))


if __name__ == '__main__':
    unittest.main()
