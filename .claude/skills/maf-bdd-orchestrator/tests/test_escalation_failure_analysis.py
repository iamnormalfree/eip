"""
Tests for failure analysis functionality in escalation.py.

This module tests the analyze_failure() function which analyzes failure
reasons and provides specific suggestions based on recognized patterns.
"""

import pytest
from lib.escalation import EscalationManager, analyze_failure


class TestAnalyzeFailure:
    """Test suite for the analyze_failure function."""

    def test_api_incompatibility_pattern(self):
        """Test that API incompatibility suggests compatibility layer."""
        result = analyze_failure("API incompatibility: method not found")
        assert "compatibility layer" in result.lower()
        assert "api" in result.lower()

    def test_type_mismatch_pattern(self):
        """Test that type mismatch suggests reviewing type definitions."""
        result = analyze_failure("Type mismatch: expected str, got int")
        assert "type" in result.lower()
        assert "definition" in result.lower()

    def test_test_failure_pattern(self):
        """Test that test failure suggests fixing tests."""
        result = analyze_failure("Test failure: assertion failed in test suite")
        assert "test" in result.lower()
        assert "fix" in result.lower()

    def test_unknown_failure_pattern(self):
        """Test that unknown failure suggests review and adjust."""
        result = analyze_failure("Unknown error occurred")
        assert "review" in result.lower()
        assert "adjust" in result.lower()

    def test_case_insensitive_pattern_matching(self):
        """Test that pattern matching is case-insensitive."""
        result = analyze_failure("API INCOMPATIBILITY detected")
        assert "compatibility" in result.lower()

    def test_partial_pattern_matching(self):
        """Test that patterns match substrings."""
        result = analyze_failure("There was a type mismatch in the code")
        assert "type" in result.lower()

    def test_empty_failure_reason(self):
        """Test handling of empty failure reason."""
        result = analyze_failure("")
        assert len(result) > 0
        assert "review" in result.lower()

    def test_multiple_patterns_in_reason(self):
        """Test handling of multiple patterns in one reason."""
        # Should match the first recognized pattern
        result = analyze_failure("API incompatibility causing type mismatch")
        # Should prioritize API incompatibility
        assert "compatibility" in result.lower() or "type" in result.lower()

    def test_returns_string(self):
        """Test that analyze_failure always returns a string."""
        result = analyze_failure("Any failure reason")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_provides_actionable_suggestions(self):
        """Test that suggestions are actionable."""
        test_cases = [
            "API incompatibility: version conflict",
            "Type mismatch: invalid conversion",
            "Test failure: mock not working",
            "Generic error"
        ]

        for reason in test_cases:
            result = analyze_failure(reason)
            # Result should contain actionable verbs
            actionable_words = ['try', 'review', 'fix', 'check', 'use', 'implement']
            has_actionable = any(word in result.lower() for word in actionable_words)
            assert has_actionable, f"No actionable suggestion in: {result}"
