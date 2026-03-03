"""
Integration tests for error handling in MAFBDDCoordinator.
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


class TestErrorHandlingIntegration(unittest.TestCase):
    """Integration tests for error handling."""

    def setUp(self):
        """Set up test fixtures."""
        self.coordinator = MAFBDDCoordinator(beads_dir="/tmp/beads")

    def test_execute_bead_safe_handles_all_exception_types(self):
        """Test that _execute_bead_safe handles all exception types correctly."""
        bead = {'id': 'test-bead-integration'}

        # Test 1: subprocess.CalledProcessError
        with patch.object(self.coordinator, '_execute_bead',
                         side_effect=subprocess.CalledProcessError(1, 'cmd', stderr='Subprocess error')):
            result = self.coordinator._execute_bead_safe(bead)
            self.assertEqual(result['status'], 'failed')
            self.assertIn('Command failed', result['reason'])
            self.assertIn('Subprocess error', result['reason'])

        # Test 2: json.JSONDecodeError
        with patch.object(self.coordinator, '_execute_bead',
                         side_effect=json.JSONDecodeError('Invalid JSON', 'doc', 0)):
            result = self.coordinator._execute_bead_safe(bead)
            self.assertEqual(result['status'], 'failed')
            self.assertIn('Invalid output', result['reason'])

        # Test 3: Generic Exception
        with patch.object(self.coordinator, '_execute_bead',
                         side_effect=Exception('Generic error')):
            result = self.coordinator._execute_bead_safe(bead)
            self.assertEqual(result['status'], 'failed')
            self.assertEqual(result['reason'], 'Generic error')

        # Test 4: Success case
        with patch.object(self.coordinator, '_execute_bead',
                         return_value={'status': 'success', 'data': 'test'}):
            result = self.coordinator._execute_bead_safe(bead)
            self.assertEqual(result['status'], 'success')

    def test_execute_group_uses_safe_execution(self):
        """Test that _execute_group uses _execute_bead_safe."""
        group = [
            {'id': 'bead-1'},
            {'id': 'bead-2'},
            {'id': 'bead-3'}
        ]

        # Mock _execute_bead_safe to return different results
        with patch.object(self.coordinator, '_execute_bead_safe',
                         side_effect=[
                             {'status': 'success'},
                             {'status': 'failed', 'reason': 'Test error'},
                             {'status': 'skipped', 'reason': 'Pre-flight failed'}
                         ]):
            results = self.coordinator._execute_group(group)

        # Verify all results are returned
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['status'], 'success')
        self.assertEqual(results[1]['status'], 'failed')
        self.assertEqual(results[2]['status'], 'skipped')

    def test_error_messages_are_descriptive(self):
        """Test that error messages provide useful information."""
        bead = {'id': 'test-bead'}

        # Test subprocess error with stderr
        with patch.object(self.coordinator, '_execute_bead',
                         side_effect=subprocess.CalledProcessError(
                             returncode=2,
                             cmd=['git', 'commit'],
                             stderr='git: nothing to commit'
                         )):
            result = self.coordinator._execute_bead_safe(bead)
            self.assertIn('nothing to commit', result['reason'])

        # Test subprocess error without stderr
        with patch.object(self.coordinator, '_execute_bead',
                         side_effect=subprocess.CalledProcessError(
                             returncode=1,
                             cmd=['test', 'cmd']
                         )):
            result = self.coordinator._execute_bead_safe(bead)
            self.assertIn('Command failed', result['reason'])

    def test_escalation_manager_receives_all_failures(self):
        """Test that escalation manager records all types of failures."""
        bead = {'id': 'test-bead'}

        with patch.object(self.coordinator.escalation, 'record_failure') as mock_record:
            # Test subprocess error
            with patch.object(self.coordinator, '_execute_bead',
                             side_effect=subprocess.CalledProcessError(1, 'cmd', stderr='Error')):
                self.coordinator._execute_bead_safe(bead)

            # Test JSON error
            with patch.object(self.coordinator, '_execute_bead',
                             side_effect=json.JSONDecodeError('Invalid', 'doc', 0)):
                self.coordinator._execute_bead_safe(bead)

            # Test generic error
            with patch.object(self.coordinator, '_execute_bead',
                             side_effect=Exception('Generic')):
                self.coordinator._execute_bead_safe(bead)

            # Verify all failures were recorded
        self.assertEqual(mock_record.call_count, 3)


if __name__ == '__main__':
    unittest.main()
