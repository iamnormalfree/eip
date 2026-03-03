"""
Test result parsing functions for spawner module.

Tests the parse_implementer_result and parse_reviewer_result functions.
"""

import pytest
import json
from lib.spawner import parse_implementer_result, parse_reviewer_result


class TestParseImplementerResult:
    """Tests for parse_implementer_result function."""

    def test_parse_valid_json_result(self):
        """Test parsing a valid JSON result from implementer."""
        result_dict = {
            "status": "completed",
            "commit_hash": "abc123",
            "files_changed": ["lib/spawner.py", "tests/test_spawner.py"],
            "tests_run": 5,
            "tests_passed": 5,
            "self_review": "All tests passed, implementation complete."
        }
        stdout = json.dumps(result_dict)

        result = parse_implementer_result(stdout)

        assert result["status"] == "completed"
        assert result["commit_hash"] == "abc123"
        assert result["files_changed"] == ["lib/spawner.py", "tests/test_spawner.py"]
        assert result["tests_run"] == 5
        assert result["tests_passed"] == 5
        assert result["self_review"] == "All tests passed, implementation complete."

    def test_parse_json_with_surrounding_text(self):
        """Test parsing JSON when stdout contains additional text."""
        result_dict = {
            "status": "completed",
            "commit_hash": "def456",
            "files_changed": ["lib/parser.py"],
            "tests_run": 3,
            "tests_passed": 3,
            "self_review": "Good"
        }
        stdout = f"Some text before\n{json.dumps(result_dict)}\nSome text after"

        result = parse_implementer_result(stdout)

        assert result["status"] == "completed"
        assert result["commit_hash"] == "def456"

    def test_parse_json_with_multiline_format(self):
        """Test parsing formatted JSON output."""
        result_dict = {
            "status": "completed",
            "commit_hash": "ghi789",
            "files_changed": ["lib/test.py"],
            "tests_run": 10,
            "tests_passed": 10,
            "self_review": "Excellent"
        }
        stdout = json.dumps(result_dict, indent=2)

        result = parse_implementer_result(stdout)

        assert result["status"] == "completed"
        assert result["commit_hash"] == "ghi789"

    def test_parse_missing_required_field_raises_error(self):
        """Test that missing required fields raise ValueError."""
        # Missing 'commit_hash'
        incomplete_result = {
            "status": "completed",
            "files_changed": ["lib/test.py"],
            "tests_run": 10,
            "tests_passed": 10,
            "self_review": "Good"
        }
        stdout = json.dumps(incomplete_result)

        with pytest.raises(ValueError, match="Missing required field"):
            parse_implementer_result(stdout)

    def test_parse_invalid_json_raises_error(self):
        """Test that invalid JSON raises ValueError."""
        stdout = "This is not valid JSON at all"

        with pytest.raises(ValueError, match="No valid JSON found"):
            parse_implementer_result(stdout)

    def test_parse_empty_json_object_raises_error(self):
        """Test that empty JSON object raises ValueError."""
        stdout = "{}"

        with pytest.raises(ValueError, match="Missing required field"):
            parse_implementer_result(stdout)


class TestParseReviewerResult:
    """Tests for parse_reviewer_result function."""

    def test_parse_valid_json_result(self):
        """Test parsing a valid JSON result from reviewer."""
        result_dict = {
            "status": "approved",
            "stage1_spec_compliance": True,
            "stage1_notes": "Implementation matches spec",
            "stage2_code_quality": 9,
            "stage2_notes": "Clean, well-structured code",
            "feedback": "Great work!"
        }
        stdout = json.dumps(result_dict)

        result = parse_reviewer_result(stdout)

        assert result["status"] == "approved"
        assert result["stage1_spec_compliance"] is True
        assert result["stage1_notes"] == "Implementation matches spec"
        assert result["stage2_code_quality"] == 9
        assert result["stage2_notes"] == "Clean, well-structured code"
        assert result["feedback"] == "Great work!"

    def test_parse_json_with_surrounding_text(self):
        """Test parsing JSON when stdout contains additional text."""
        result_dict = {
            "status": "changes_requested",
            "stage1_spec_compliance": False,
            "stage1_notes": "Missing some features",
            "stage2_code_quality": 7,
            "stage2_notes": "Needs improvement",
            "feedback": "Please address the issues"
        }
        stdout = f"Review output:\n\n{json.dumps(result_dict)}\n\nEnd of review"

        result = parse_reviewer_result(stdout)

        assert result["status"] == "changes_requested"
        assert result["stage1_spec_compliance"] is False

    def test_parse_missing_required_field_raises_error(self):
        """Test that missing required fields raise ValueError."""
        # Missing 'stage1_notes'
        incomplete_result = {
            "status": "approved",
            "stage1_spec_compliance": True,
            "stage2_code_quality": 8,
            "stage2_notes": "Good",
            "feedback": "Looks good"
        }
        stdout = json.dumps(incomplete_result)

        with pytest.raises(ValueError, match="Missing required field"):
            parse_reviewer_result(stdout)

    def test_parse_invalid_json_raises_error(self):
        """Test that invalid JSON raises ValueError."""
        stdout = "Not valid JSON"

        with pytest.raises(ValueError, match="No valid JSON found"):
            parse_reviewer_result(stdout)

    def test_parse_empty_json_object_raises_error(self):
        """Test that empty JSON object raises ValueError."""
        stdout = "{}"

        with pytest.raises(ValueError, match="Missing required field"):
            parse_reviewer_result(stdout)

    def test_parse_rejected_status(self):
        """Test parsing a rejected review status."""
        result_dict = {
            "status": "rejected",
            "stage1_spec_compliance": False,
            "stage1_notes": "Does not meet requirements",
            "stage2_code_quality": 4,
            "stage2_notes": "Major quality issues",
            "feedback": "Significant rework required"
        }
        stdout = json.dumps(result_dict)

        result = parse_reviewer_result(stdout)

        assert result["status"] == "rejected"
        assert result["stage1_spec_compliance"] is False
        assert result["stage2_code_quality"] == 4
