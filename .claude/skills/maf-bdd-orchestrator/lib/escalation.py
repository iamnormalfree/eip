"""
Escalation management for MAF-BDD Orchestrator.

This module provides the EscalationManager class which tracks failed bead
implementation attempts and provides context and suggestions for retries.
"""

from typing import Dict, Any, List
import re


class EscalationManager:
    """
    Manages escalation context for failed bead implementations.

    Tracks failure attempts, reasons, and provides progressive suggestions
    for implementers based on the number of failed attempts.

    The escalation approach evolves:
    - Attempt 1: Review and adjust based on feedback
    - Attempt 2: Try alternative implementation approach
    - Attempt 3+: May need bead revision (requirements/design adjustment)
    """

    def __init__(self):
        """
        Initialize the EscalationManager with an empty escalation context.

        The escalation_context dictionary maps bead_id to escalation
        information including attempts, failure reasons, and suggestions.
        """
        self.escalation_context: Dict[str, Dict[str, Any]] = {}

    def record_failure(self, bead_id: str, failure_reason: str) -> None:
        """
        Record a failure for a bead implementation attempt.

        Creates or updates the escalation context for the specified bead,
        incrementing the attempt counter and appending the failure reason.
        Also generates a suggested approach based on the attempt number.

        Args:
            bead_id: The ID of the bead that failed
            failure_reason: Description of why the implementation failed
        """
        # Initialize context for new bead
        if bead_id not in self.escalation_context:
            self.escalation_context[bead_id] = {
                'attempts': 0,
                'failure_reasons': []
            }

        # Increment attempts
        self.escalation_context[bead_id]['attempts'] += 1

        # Append failure reason
        self.escalation_context[bead_id]['failure_reasons'].append(failure_reason)

        # Generate suggested approach based on attempt count
        context = self.escalation_context[bead_id]
        suggested_approach = self._suggest_approach(context)
        self.escalation_context[bead_id]['suggested_approach'] = suggested_approach

    def get_context(self, bead_id: str) -> Dict[str, Any]:
        """
        Get the escalation context for a specific bead.

        Returns the complete escalation context for use by implementers
        when retrying a failed bead implementation.

        Args:
            bead_id: The ID of the bead to get context for

        Returns:
            Dictionary containing escalation context with keys:
            - attempts: Number of failed attempts
            - failure_reasons: List of failure descriptions
            - suggested_approach: Suggested strategy for next attempt
            Returns empty dict if bead has no escalation context.
        """
        return self.escalation_context.get(bead_id, {})

    def should_give_up(self, bead_id: str) -> bool:
        """
        Check if a bead has exceeded maximum retry attempts.

        Determines if further retries should be abandoned by checking if
        the bead has failed 3 or more times.

        Args:
            bead_id: The ID of the bead to check

        Returns:
            True if the bead has exceeded max attempts (>= 3), False otherwise
        """
        context = self.escalation_context.get(bead_id, {})
        attempts = context.get('attempts', 0)
        return attempts >= 3

    def _suggest_approach(self, context: Dict[str, Any]) -> str:
        """
        Suggest an implementation approach based on attempt count.

        Provides progressively more significant suggestions as attempts increase:
        - Attempt 1: Review and adjust based on failure feedback
        - Attempt 2: Try a different implementation approach
        - Attempt 3+: Consider if the bead itself needs revision

        Args:
            context: The escalation context dictionary (must contain 'attempts')

        Returns:
            String containing suggested approach for next attempt
        """
        attempts = context.get('attempts', 0)

        if attempts == 1:
            return 'Review and adjust implementation based on failure feedback'
        elif attempts == 2:
            return 'Try alternative implementation approach'
        else:  # attempts >= 3
            return 'May need bead revision - consider if requirements or design need adjustment'


def analyze_failure(failure_reason: str) -> str:
    """
    Analyze a failure reason and suggest specific approaches based on patterns.

    Recognizes common failure patterns and provides targeted suggestions:
    - 'API incompatibility': Suggests using a compatibility layer
    - 'type mismatch': Suggests reviewing type definitions
    - 'test failure': Suggests fixing failing tests
    - Other patterns: Suggests reviewing error and adjusting

    Pattern matching is case-insensitive and matches substrings.

    Args:
        failure_reason: Description of why implementation failed

    Returns:
        String containing specific suggestion for addressing the failure
    """
    if not failure_reason:
        return "Review error details and adjust implementation accordingly"

    # Convert to lowercase for case-insensitive matching
    reason_lower = failure_reason.lower()

    # Define patterns and corresponding suggestions
    patterns = [
        (r'api incompatibility', 'API incompatibility detected. Try implementing a compatibility layer or adapter to bridge the API differences.'),
        (r'type mismatch', 'Type mismatch detected. Review type definitions and ensure proper type conversions or annotations.'),
        (r'test failure', 'Test failure detected. Review and fix the failing tests - check assertions, mocks, and test setup.'),
    ]

    # Check each pattern in order
    for pattern, suggestion in patterns:
        if re.search(pattern, reason_lower):
            return suggestion

    # Default suggestion for unrecognized patterns
    return "Review the error details and adjust implementation approach accordingly"

