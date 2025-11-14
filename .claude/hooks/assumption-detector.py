#!/usr/bin/env python3
"""
Assumption Detector Hook - Metacognitive Error Prevention

Purpose: Detects when AI makes assumptions without verification (catches #COMPLETION_DRIVE and #FALSE_COMPLETION patterns)

Detects two types of assumptions:
1. Explicit assumptions - "I assume X", "probably Y", unverified method calls
2. Implicit assumptions - Completion declarations without specification validation

Behavior:
- Orchestrator: BLOCK until verified or user asked
- Deployed Agent: WARN to tag with #COMPLETION_DRIVE

Part of the Response-Awareness Framework metacognitive hook suite.
"""

import sys
import re
import os
import glob
from typing import List, Tuple, Optional
from hook_logger import log_hook_decision

# ANSI color codes
class Colors:
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    BOLD = '\033[1m'
    END = '\033[0m'

class AssumptionDetector:
    """Detects unverified assumptions in conversation."""

    def __init__(self, conversation: str, tool_name: str):
        self.conversation = conversation
        self.tool_name = tool_name
        self.tier = self._detect_tier()
        self.is_orchestrator = self._detect_orchestrator()

    def _detect_tier(self) -> str:
        """Detect current response-awareness tier from conversation."""
        tier_patterns = [
            (r'/response-awareness-full', 'FULL'),
            (r'/response-awareness-heavy', 'HEAVY'),
            (r'/response-awareness-medium', 'MEDIUM'),
            (r'/response-awareness-light', 'LIGHT'),
            (r'/response-awareness\s+', 'AUTO'),
        ]
        for pattern, tier in tier_patterns:
            if re.search(pattern, self.conversation):
                return tier
        return 'NONE'

    def _detect_orchestrator(self) -> bool:
        """Orchestrator = NO agent deployment marker in recent context."""
        # Check last 10000 chars for agent marker
        recent = self.conversation[-10000:]
        return "<!-- RA_AGENT_CONTEXT: deployed_as=implementer" not in recent

    def _detect_completion_declarations(self) -> List[Tuple[str, str, int]]:
        """
        Detect completion declarations (implicit assumptions about completeness).

        Returns:
            List of (pattern_type, declaration_text, position)
        """
        completions = []

        completion_patterns = [
            r'implementation\s+complete',
            r'all\s+done',
            r'task\s+finished',
            r'ready\s+for\s+(review|user)',
            r'deliverable\s+ready',
            r'Phase\s+\d+.*complete',
            r'that\s+should\s+handle\s+it',
            r'all\s+requirements\s+met',
            r'everything\s+is\s+(implemented|done|ready)',
            # Enhanced patterns for false completion detection
            r'tests?\s+(are\s+)?passing',
            r'all\s+tests?\s+pass',
            r'verification\s+complete',
            r'validation\s+successful',
            r'build\s+passed',
            r'task\s+\d+:\s+complete',
            r'task\s+\d+:\s+done',
            r'marking\s+as\s+complete',
            r'status.*complete',
            r'✅.*complete',
            r'❌.*wrong.*failed',
            r'deployment\s+successful'
        ]

        # Only check last 1000 chars (recent declarations)
        recent = self.conversation[-1000:]

        for pattern in completion_patterns:
            matches = re.finditer(pattern, recent, re.IGNORECASE)
            for match in matches:
                declaration = match.group(0)
                completions.append(("completion_declaration", declaration, match.start()))

        return completions

    def _detect_assumptions(self) -> List[Tuple[str, str, int]]:
        """
        Detect assumption patterns in conversation.

        Returns:
            List of (pattern_type, assumption_text, line_context)
        """
        assumptions = []

        # Pattern 1: Explicit "I assume" statements
        assume_patterns = [
            r"I assume ([^.\n]+)",
            r"I'm assuming ([^.\n]+)",
            r"Assuming ([^.\n]+)",
            r"I'll assume ([^.\n]+)",
        ]

        for pattern in assume_patterns:
            matches = re.finditer(pattern, self.conversation, re.IGNORECASE)
            for match in matches:
                assumption_text = match.group(1)
                assumptions.append(("explicit_assume", assumption_text, match.start()))

        # Pattern 2: "Likely" or "probably" without verification
        likelihood_patterns = [
            r"This (likely|probably) ([^.\n]+)",
            r"([^.\n]+) (is likely|is probably|likely|probably) ([^.\n]+)",
        ]

        for pattern in likelihood_patterns:
            matches = re.finditer(pattern, self.conversation, re.IGNORECASE)
            for match in matches:
                assumption_text = match.group(0)
                assumptions.append(("likelihood", assumption_text, match.start()))

        # Pattern 3: Method/function existence without verification
        existence_patterns = [
            r"(the method|the function|method|function) ([a-zA-Z_][a-zA-Z0-9_]*)\(",
            r"([a-zA-Z_][a-zA-Z0-9_]*)\(\) (exists|should exist|must exist)",
        ]

        # Only flag if no grep/read verification found
        has_grep = bool(re.search(r'(grep|Grep|search|find)\s+["\']([a-zA-Z_][a-zA-Z0-9_]*)', self.conversation))

        if not has_grep:
            for pattern in existence_patterns:
                matches = re.finditer(pattern, self.conversation, re.IGNORECASE)
                for match in matches:
                    if "def " not in self.conversation[max(0, match.start()-200):match.start()]:
                        # Not in a code definition context
                        assumption_text = match.group(0)
                        assumptions.append(("unverified_existence", assumption_text, match.start()))

        # Pattern 4: "Should be" or "must be" statements (declarative without verification)
        should_patterns = [
            r"([^.\n]+) (should be|must be|has to be) ([^.\n]+)",
        ]

        for pattern in should_patterns:
            matches = re.finditer(pattern, self.conversation, re.IGNORECASE)
            for match in matches:
                assumption_text = match.group(0)
                # Check if it's a recommendation vs assumption
                if not any(word in assumption_text.lower() for word in ["recommend", "suggest", "could", "might"]):
                    assumptions.append(("declarative_assumption", assumption_text, match.start()))

        return assumptions

    def _detect_test_assumptions(self) -> List[Tuple[str, str, int]]:
        """
        Detect assumptions about test results that should be verified.

        Returns:
            List of (pattern_type, assumption_text, position)
        """
        test_assumptions = []
        recent = self.conversation[-2000:]  # Check last 2k chars for test claims

        # Pattern 1: Test result claims without actual test execution
        test_result_patterns = [
            r'all tests?\s+(are\s+)?passing',
            r'tests?\s+passed',
            r'npm test.*passed',
            r'pytest.*passed',
            r'build.*successful',
            r'verification.*complete',
            r'validation.*successful',
            r'(✅|❌).*test',
            r'(\d+/)?\d+\s+tests?\s+passing'
        ]

        # Check if actual test commands were executed
        has_test_command = bool(re.search(
            r'(npm test|pytest|yarn test|node.*test)',
            recent,
            re.IGNORECASE
        ))

        for pattern in test_result_patterns:
            matches = re.finditer(pattern, recent, re.IGNORECASE)
            for match in matches:
                if not has_test_command:
                    # Claiming tests pass without actually running them
                    assumption_text = match.group(0)
                    test_assumptions.append(("false_test_results", assumption_text, match.start()))

        # Pattern 2: Task completion without verification
        task_completion_patterns = [
            r'Task\s+\d+:\s+Complete',
            r'Task\s+\d+:\s+Done',
            r'Marking.*as.*complete',
            r'Status.*complete',
            r'All.*tasks.*complete'
        ]

        # Check if verification steps were mentioned
        has_verification = bool(re.search(
            r'(verify|check|test|validate|run.*test)',
            recent,
            re.IGNORECASE
        ))

        for pattern in task_completion_patterns:
            matches = re.finditer(pattern, recent, re.IGNORECASE)
            for match in matches:
                if not has_verification:
                    # Claiming task complete without verification
                    assumption_text = match.group(0)
                    test_assumptions.append(("false_completion", assumption_text, match.start()))

        return test_assumptions

    def _find_specification_files(self) -> List[str]:
        """
        Find potential specification documents in the project.

        Returns:
            List of spec file paths
        """
        spec_paths = []

        # Common specification locations
        spec_patterns = [
            'docs/completion_drive_plans/**/FINAL_BLUEPRINT*.md',
            'docs/completion_drive_plans/**/plan*.md',
            '**/README.md',
            '**/BLUEPRINT*.md',
            '**/specification*.md',
            '**/SPEC*.md',
            '.framework-observatory/**/README.md'
        ]

        for pattern in spec_patterns:
            matches = glob.glob(pattern, recursive=True)
            spec_paths.extend(matches)

        # Deduplicate and sort by modification time (most recent first)
        spec_paths = list(set(spec_paths))
        spec_paths.sort(key=lambda x: os.path.getmtime(x) if os.path.exists(x) else 0, reverse=True)

        return spec_paths[:5]  # Return top 5 most recent

    def _extract_deliverables(self, spec_file: str) -> List[str]:
        """
        Extract promised deliverables from specification file.

        Returns:
            List of file paths mentioned in spec
        """
        try:
            with open(spec_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return []

        deliverables = []

        # Pattern 1: Explicit file paths (.md, .py, .js, etc.)
        file_patterns = [
            r'([a-zA-Z0-9_/-]+\.(md|py|js|ts|tsx|jsx|json|yaml|yml|toml))',
            r'`([a-zA-Z0-9_/-]+\.[a-zA-Z]+)`',
        ]

        for pattern in file_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                filepath = match.group(1)
                # Filter out common false positives
                if not any(x in filepath for x in ['http', 'www', 'example', '@']):
                    deliverables.append(filepath)

        # Pattern 2: Deliverable checklists (e.g., "- [ ] file.md")
        checklist_pattern = r'-\s*\[[ x]\]\s*([a-zA-Z0-9_/-]+\.[a-zA-Z]+)'
        matches = re.finditer(checklist_pattern, content)
        for match in matches:
            deliverables.append(match.group(1))

        # Pattern 3: "will create X" statements
        will_create_pattern = r'will\s+create\s+([a-zA-Z0-9_/-]+\.[a-zA-Z]+)'
        matches = re.finditer(will_create_pattern, content, re.IGNORECASE)
        for match in matches:
            deliverables.append(match.group(1))

        # Deduplicate
        return list(set(deliverables))

    def _verify_completeness(self) -> Tuple[bool, str]:
        """
        Verify completion claim against specification.

        Returns:
            (is_complete, message)
        """
        # Find specifications
        specs = self._find_specification_files()

        if not specs:
            # No spec = can't verify (allow with note)
            return (True, "No specification found")

        # Extract all deliverables
        all_promised = []
        spec_sources = []
        for spec in specs:
            deliverables = self._extract_deliverables(spec)
            if deliverables:
                all_promised.extend(deliverables)
                spec_sources.append((spec, len(deliverables)))

        if not all_promised:
            # Spec exists but no deliverable list
            return (True, "Specification has no deliverable checklist")

        # Deduplicate
        all_promised = list(set(all_promised))

        # Check existence
        exists = []
        missing = []
        for filepath in all_promised:
            if os.path.exists(filepath):
                exists.append(filepath)
            else:
                missing.append(filepath)

        if missing:
            # Gaps detected - build message
            completion_rate = int(len(exists) / len(all_promised) * 100) if all_promised else 0

            message = f"""
Specification: {spec_sources[0][0]}

Promised Deliverables ({len(all_promised)} files):
"""
            # Show first 5 existing
            for f in exists[:5]:
                message += f"✅ {f}\n"

            if len(exists) > 5:
                message += f"... and {len(exists) - 5} more created\n"

            message += f"\n❌ MISSING ({len(missing)} files):\n"
            for f in missing[:10]:
                message += f"- {f}\n"

            if len(missing) > 10:
                message += f"... and {len(missing) - 10} more missing\n"

            message += f"\nCompletion Rate: {completion_rate}% ({len(exists)}/{len(all_promised)})\n"

            return (False, message)

        # All deliverables present
        return (True, f"✅ All {len(exists)} deliverables verified")

    def _check_verification(self, assumption: Tuple[str, str, int]) -> bool:
        """
        Check if assumption has been verified with tool usage.

        Returns:
            True if verified, False if not
        """
        pattern_type, text, position = assumption

        # Look for verification attempts after the assumption
        verification_context = self.conversation[position:position+2000]

        verification_indicators = [
            r'grep\s+["\']',
            r'Grep\(',
            r'Read\(',
            r'Glob\(',
            r'#COMPLETION_DRIVE',  # Tagged assumption (acceptable)
        ]

        for indicator in verification_indicators:
            if re.search(indicator, verification_context):
                return True

        return False

    def should_block(self) -> Tuple[bool, str, str]:
        """
        Determine if tool usage should be blocked.

        Returns:
            (should_block, severity, message)
        """
        # Check for completion declarations (FALSE_COMPLETION pattern)
        completions = self._detect_completion_declarations()

        if completions:
            # Verify completeness against specification
            is_complete, completeness_msg = self._verify_completeness()

            if not is_complete:
                # Gaps detected - this is FALSE_COMPLETION
                if self.is_orchestrator:
                    return self._false_completion_orchestrator(completeness_msg)
                else:
                    return self._false_completion_agent(completeness_msg)

        # Check test result assumptions (enhanced false completion detection)
        test_assumptions = self._detect_test_assumptions()

        if test_assumptions:
            if self.is_orchestrator:
                return self._false_test_results_orchestrator(test_assumptions)
            else:
                return self._false_test_results_agent(test_assumptions)

        # Check explicit assumptions
        assumptions = self._detect_assumptions()

        if not assumptions:
            return (False, 'ALLOW', '')

        # Filter to unverified assumptions
        unverified = [a for a in assumptions if not self._check_verification(a)]

        if not unverified:
            return (False, 'ALLOW', '')

        # Behavior depends on context
        if self.is_orchestrator:
            return self._orchestrator_behavior(unverified)
        else:
            return self._agent_behavior(unverified)

    def _orchestrator_behavior(self, assumptions: List[Tuple[str, str, int]]) -> Tuple[bool, str, str]:
        """Strict enforcement for orchestrators."""
        message = f"""
{Colors.RED}🛑 ASSUMPTION DETECTOR - ORCHESTRATOR MODE{Colors.END}

{Colors.BOLD}Unverified assumptions detected:{Colors.END}

"""
        for i, (pattern_type, text, _) in enumerate(assumptions[:5], 1):  # Show first 5
            message += f"{i}. {Colors.YELLOW}{text}{Colors.END}\n   Type: {pattern_type}\n\n"

        if len(assumptions) > 5:
            message += f"{Colors.CYAN}... and {len(assumptions) - 5} more assumptions{Colors.END}\n\n"

        message += f"""
{Colors.RED}❌ Violation:{Colors.END}
Orchestrators must verify assumptions BEFORE deploying agents.

{Colors.YELLOW}Required Actions (choose one):{Colors.END}

1. {Colors.BOLD}Verify with tools:{Colors.END}
   - Use Grep() to verify method existence
   - Use Read() to check actual implementation
   - Use Glob() to find relevant files

2. {Colors.BOLD}Ask user for clarification:{Colors.END}
   - Convert assumption to question
   - Get explicit confirmation before proceeding

3. {Colors.BOLD}Tag assumption (if acceptable):{Colors.END}
   - Document with #COMPLETION_DRIVE: [assumption + reasoning]
   - Only for low-risk assumptions

{Colors.CYAN}Why this matters:{Colors.END}
Agents deployed with unverified assumptions will make incorrect implementations.
Catch assumptions in planning, not during agent execution.

{Colors.RED}Tool execution BLOCKED until assumptions resolved.{Colors.END}
"""
        return (True, 'BLOCK', message)

    def _agent_behavior(self, assumptions: List[Tuple[str, str, int]]) -> Tuple[bool, str, str]:
        """Permissive guidance for deployed agents."""
        message = f"""
{Colors.YELLOW}ℹ️  ASSUMPTION DETECTOR - AGENT MODE{Colors.END}

{Colors.BOLD}Assumptions detected during implementation:{Colors.END}

"""
        for i, (pattern_type, text, _) in enumerate(assumptions[:3], 1):  # Show first 3
            message += f"{i}. {text}\n"

        message += f"""
{Colors.GREEN}✅ Autonomous work allowed{Colors.END} - Agents make best-judgment decisions

{Colors.YELLOW}Action Required:{Colors.END}
Tag assumptions in your final output:

{Colors.CYAN}Example:{Colors.END}
### Assumptions Made
- #COMPLETION_DRIVE: Assumed JWT expiry = 1 hour (industry standard)
- #COMPLETION_DRIVE: Assumed bcrypt for passwords (saw pattern in adjacent code)

{Colors.CYAN}Why tag assumptions:{Colors.END}
Orchestrator will verify during Phase 4 validation.
This prevents stopping mid-execution (preserves context).

{Colors.GREEN}Proceeding with implementation...{Colors.END}
"""
        return (False, 'WARN', message)

    def _false_completion_orchestrator(self, completeness_msg: str) -> Tuple[bool, str, str]:
        """Handle FALSE_COMPLETION for orchestrators (strict blocking)."""
        message = f"""
{Colors.RED}🛑 ASSUMPTION DETECTOR - FALSE_COMPLETION DETECTED{Colors.END}

{Colors.BOLD}Implicit Assumption:{Colors.END} "Implementation complete" / "All done"

{Colors.RED}❌ Verification FAILED:{Colors.END}
Specification validation found deliverable gaps.

{completeness_msg}

{Colors.YELLOW}This is #FALSE_COMPLETION pattern:{Colors.END}
You assumed all requirements met without checking against specification.

{Colors.BOLD}Required Actions:{Colors.END}

1. {Colors.CYAN}Complete missing deliverables{Colors.END}, OR
2. {Colors.CYAN}Update specification to reflect actual scope{Colors.END}, OR
3. {Colors.CYAN}Tag as #FALSE_COMPLETION with justification{Colors.END}

{Colors.CYAN}Why this matters:{Colors.END}
Declaring completion with gaps undermines systematic work.
The spec-to-delivery gap indicates incomplete requirements fulfillment.

{Colors.RED}Cannot proceed until deliverable gaps resolved.{Colors.END}
"""
        return (True, 'BLOCK', message)

    def _false_completion_agent(self, completeness_msg: str) -> Tuple[bool, str, str]:
        """Handle FALSE_COMPLETION for agents (warning with tagging)."""
        message = f"""
{Colors.YELLOW}ℹ️  ASSUMPTION DETECTOR - FALSE_COMPLETION IN AGENT MODE{Colors.END}

{Colors.BOLD}Completion declaration detected but gaps found:{Colors.END}

{completeness_msg}

{Colors.GREEN}✅ Autonomous work continues{Colors.END} - Agents report incomplete status

{Colors.YELLOW}Action Required:{Colors.END}
Tag in your final output:

{Colors.CYAN}Example:{Colors.END}
### Status: PARTIAL COMPLETION

#### What Was Done ✅
- [List completed deliverables]

#### Missing Items ❌
- #FALSE_COMPLETION: [List missing deliverables with reasoning]

{Colors.CYAN}Why tag this:{Colors.END}
Orchestrator will review gaps and decide next steps (complete missing items, revise spec, or accept partial).

{Colors.GREEN}Proceeding with status report...{Colors.END}
"""
        return (False, 'WARN', message)

    def _false_test_results_orchestrator(self, test_assumptions: List[Tuple[str, str, int]]) -> Tuple[bool, str, str]:
        """Handle false test results for orchestrator (block until verified)."""

        # Extract specific assumption types for targeted messages
        false_test_results = [a for a in test_assumptions if a[0] == "false_test_results"]
        false_completions = [a for a in test_assumptions if a[0] == "false_completion"]

        message = f"""
{Colors.RED}🚨 ASSUMPTION DETECTOR - FALSE_TEST_RESULTS BLOCK{Colors.END}

{Colors.BOLD}CRITICAL: Unverified test results or completion claims detected{Colors.END}

{Colors.CYAN}False Test Results Found:{Colors.END}
"""

        if false_test_results:
            message += f"{Colors.RED}❌ Test success claims without test execution:{Colors.END}\n"
            for _, claim, _ in false_test_results[:3]:
                message += f"   - \"{claim}\"\n"
            message += f"\n{Colors.YELLOW}Issue: You're claiming tests pass but haven't actually run them{Colors.END}\n"
            message += f"{Colors.GREEN}Fix: Run actual tests before claiming success{Colors.END}\n\n"

        if false_completions:
            message += f"{Colors.RED}❌ Task completion claims without verification:{Colors.END}\n"
            for _, claim, _ in false_completions[:3]:
                message += f"   - \"{claim}\"\n"
            message += f"\n{Colors.YELLOW}Issue: Marking tasks complete without verifying they work{Colors.END}\n"
            message += f"{Colors.GREEN}Fix: Verify deliverables before marking complete{Colors.END}\n\n"

        message += f"""
{Colors.BOLD}Required Action:{Colors.END}
1. {Colors.GREEN}RUN ACTUAL TESTS{Colors.END} - Execute test commands to verify functionality
2. {Colors.GREEN}VERIFY DELIVERABLES{Colors.END} - Check that implemented features actually work
3. {Colors.GREEN}REPORT REALITY{Colors.END} - Only mark complete after verification succeeds

{Colors.YELLOW}Example verification commands:{Colors.END}
- npm test -- tests/specific.test.ts
- pytest tests/
- npm run build && npm run test

{Colors.RED}This tool usage is BLOCKED until you verify your claims{Colors.END}

{Colors.BOLD}Remember:{Colors.END} #FALSE_COMPLETION patterns destroy trust and waste time fixing broken work.
"""
        return (True, 'BLOCK', message)

    def _false_test_results_agent(self, test_assumptions: List[Tuple[str, str, int]]) -> Tuple[bool, str, str]:
        """Handle false test results for agents (warning with tagging)."""

        false_test_results = [a for a in test_assumptions if a[0] == "false_test_results"]
        false_completions = [a for a in test_assumptions if a[0] == "false_completion"]

        message = f"""
{Colors.YELLOW}ℹ️  ASSUMPTION DETECTOR - FALSE_TEST_RESULTS IN AGENT MODE{Colors.END}

{Colors.BOLD}Test result claims detected without verification:{Colors.END}

"""

        if false_test_results:
            message += f"{Colors.CYAN}False Test Results:{Colors.END}\n"
            for _, claim, _ in false_test_results[:2]:
                message += f"  - \"{claim}\"\n"
            message += f"\n{Colors.YELLOW}Issue: Claiming test success without execution{Colors.END}\n"

        if false_completions:
            message += f"{Colors.CYAN}False Completions:{Colors.END}\n"
            for _, claim, _ in false_completions[:2]:
                message += f"  - \"{claim}\"\n"
            message += f"\n{Colors.YELLOW}Issue: Marking complete without verification{Colors.END}\n"

        message += f"""
{Colors.GREEN}✅ Autonomous work continues{Colors.END} - Agent reports verification status

{Colors.YELLOW}Action Required:{Colors.END}
Tag in your final output:

{Colors.CYAN}Example:{Colors.END}
### Status: REQUIRES VERIFICATION

#### Implemented ✅
- [List what was implemented]

#### #FALSE_TEST_RESULTS: Unverified Claims ❌
- Test success claimed without actual test execution
- Task completion marked without verification

#### Next Steps 🔄
- Run: npm test -- tests/affected.test.ts
- Verify: [Specific verification steps]
- Update: Status after verification

{Colors.CYAN}Why tag this:{Colors.END}
Orchestrator will ensure proper verification before accepting completion.

{Colors.GREEN}Proceeding with status report...{Colors.END}
"""
        return (False, 'WARN', message)


def main():
    """Main hook entry point."""
    tool_name = os.environ.get('TOOL_NAME', 'Unknown')
    conversation = sys.stdin.read()

    detector = AssumptionDetector(conversation, tool_name)

    # Skip hook if not in response-awareness mode
    if detector.tier == 'NONE':
        log_hook_decision("assumption-detector", "NONE", "SKIPPED", tool_name, "Not in response-awareness mode")
        sys.exit(0)

    # Debug mode
    if os.environ.get('DEBUG_ASSUMPTION_DETECTOR') == '1':
        print(f"\n{Colors.CYAN}=== Assumption Detector Debug ==={Colors.END}")
        print(f"Tool: {tool_name}")
        print(f"Tier: {detector.tier}")
        print(f"Is Orchestrator: {detector.is_orchestrator}")
        assumptions = detector._detect_assumptions()
        print(f"Assumptions found: {len(assumptions)}")
        for pattern_type, text, _ in assumptions[:3]:
            print(f"  - [{pattern_type}] {text[:80]}")
        print(f"{Colors.CYAN}==================================={Colors.END}\n")

    should_block, severity, message = detector.should_block()

    if severity == 'ALLOW':
        log_hook_decision("assumption-detector", detector.tier, "ALLOW", tool_name, "No unverified assumptions detected")
        sys.exit(0)
    elif severity == 'WARN':
        log_hook_decision("assumption-detector", detector.tier, "WARN", tool_name, "Assumptions detected in agent mode")
        print(message)
        sys.exit(0)
    elif severity == 'BLOCK':
        assumptions = detector._detect_assumptions()
        reason = f"Orchestrator has {len(assumptions)} unverified assumptions"
        log_hook_decision("assumption-detector", detector.tier, "BLOCK", tool_name, reason)
        print(message)
        sys.exit(1)

    log_hook_decision("assumption-detector", detector.tier, "ALLOW", tool_name, "Default allow")
    sys.exit(0)


if __name__ == '__main__':
    main()
