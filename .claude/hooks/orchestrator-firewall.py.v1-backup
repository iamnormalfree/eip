#!/usr/bin/env python3
"""
Orchestrator Firewall Hook - Response-Awareness Framework Enforcement

Purpose: Prevents orchestrators from implementing directly, enforcing the
         "Once you use Task() → you are orchestrator → NEVER implement" rule

Triggers: Before Edit/Write/NotebookEdit tool usage
Detects: Current tier, phase, and orchestrator status
Actions: Warns or blocks based on tier and context

Part of the Response-Awareness Framework tier system.
"""

import sys
import re
import os
from typing import Dict, Optional, Tuple
from hook_logger import log_hook_decision

# ANSI color codes for terminal output
class Colors:
    RED = '\033[91m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

class OrchestratorFirewall:
    """Detects and prevents orchestrator implementation violations."""

    def __init__(self, conversation: str, tool_name: str):
        self.conversation = conversation
        self.tool_name = tool_name

        # State detection
        self.tier = self._detect_tier()
        self.phase = self._detect_phase()
        self.used_task = self._detect_task_usage()
        self.is_orchestrator = self.used_task

    def _detect_tier(self) -> str:
        """Detect current response-awareness tier from conversation."""
        # Priority order: Most recent tier command wins
        tier_patterns = [
            (r'/response-awareness-full', 'FULL'),
            (r'/response-awareness-heavy', 'HEAVY'),
            (r'/response-awareness-medium', 'MEDIUM'),
            (r'/response-awareness-light', 'LIGHT'),
            (r'/response-awareness\s+', 'AUTO'),  # Router tier
        ]

        for pattern, tier in tier_patterns:
            if re.search(pattern, self.conversation):
                return tier

        return 'NONE'  # No framework in use

    def _detect_phase(self) -> Optional[int]:
        """Detect current phase number from conversation markers."""
        # Look for phase markers like "## Phase 3: Implementation"
        phase_matches = re.findall(r'##\s*Phase\s+(\d+)[:\s]', self.conversation)
        if phase_matches:
            return int(phase_matches[-1])  # Return most recent phase
        return None

    def _detect_task_usage(self) -> bool:
        """Detect if Task() tool has been used (orchestrator indicator)."""
        # Look for Task() invocations
        task_patterns = [
            r'Task\(subagent_type=',
            r'<invoke name="Task">',
            r'invoke name="Task"',
        ]

        for pattern in task_patterns:
            if re.search(pattern, self.conversation, re.IGNORECASE):
                return True
        return False

    def _is_deployed_agent(self) -> bool:
        """Check if current context is a deployed agent (not orchestrator)."""
        # Deployed agents will have prompts like "You are implementing..."
        agent_indicators = [
            r'You are implementing',
            r'You have been deployed to',
            r'subagent_type.*prompt.*Implement',
        ]

        for pattern in agent_indicators:
            if re.search(pattern, self.conversation[-5000:], re.IGNORECASE):  # Check recent context
                return True
        return False

    def should_block(self) -> Tuple[bool, str, str]:
        """
        Determine if tool usage should be blocked.

        Returns:
            (should_block, severity, message)
            - should_block: True to block execution, False to warn only
            - severity: 'BLOCK', 'WARN', or 'ALLOW'
            - message: User-facing explanation
        """
        # If no framework in use, allow
        if self.tier == 'NONE':
            return (False, 'ALLOW', '')

        # If deployed agent, allow (agents implement, orchestrators don't)
        if self._is_deployed_agent():
            return (False, 'ALLOW', '')

        # LIGHT tier: Direct implementation OK unless Task() was used
        if self.tier == 'LIGHT':
            if self.used_task:
                return (True, 'WARN', self._generate_message('LIGHT_WITH_TASK'))
            return (False, 'ALLOW', '')

        # MEDIUM tier: Block if used Task() (orchestrator mode)
        if self.tier == 'MEDIUM':
            if self.used_task:
                return (True, 'BLOCK', self._generate_message('MEDIUM_ORCHESTRATOR'))
            return (False, 'WARN', self._generate_message('MEDIUM_NO_TASK'))

        # HEAVY/FULL tier: ALWAYS block direct implementation (orchestrator-only tiers)
        if self.tier in ['HEAVY', 'FULL']:
            if self.used_task:
                return (True, 'BLOCK', self._generate_message('HEAVY_FULL_ORCHESTRATOR'))
            # Even without Task(), HEAVY/FULL should delegate
            return (True, 'BLOCK', self._generate_message('HEAVY_FULL_NO_TASK'))

        # AUTO tier (router): Check if Task() used
        if self.tier == 'AUTO':
            if self.used_task:
                return (True, 'BLOCK', self._generate_message('AUTO_ORCHESTRATOR'))
            return (False, 'ALLOW', '')

        # Default: Allow with warning
        return (False, 'WARN', 'Orchestrator firewall: Unknown state')

    def _generate_message(self, scenario: str) -> str:
        """Generate tier and context-specific warning/block message."""

        messages = {
            'LIGHT_WITH_TASK': f"""
{Colors.YELLOW}⚠️  ORCHESTRATOR FIREWALL - LIGHT TIER WARNING{Colors.END}

You used {Colors.BOLD}Task(){Colors.END} in this conversation, which makes you an {Colors.BOLD}ORCHESTRATOR{Colors.END}.

{Colors.CYAN}LIGHT tier guideline:{Colors.END}
- Direct implementation is OK if NO Task() was used
- {Colors.RED}But you HAVE used Task(){Colors.END} → Consider delegating instead

{Colors.YELLOW}Recommendation:{Colors.END} Deploy an implementation agent to maintain orchestrator role.

{Colors.GREEN}Press Enter to proceed anyway (deviation from framework){Colors.END}
""",

            'MEDIUM_NO_TASK': f"""
{Colors.YELLOW}⚠️  ORCHESTRATOR FIREWALL - MEDIUM TIER NOTICE{Colors.END}

{Colors.CYAN}MEDIUM tier detected{Colors.END} - You haven't used Task() yet.

{Colors.GREEN}Direct implementation is OK{Colors.END} for MEDIUM tier if:
- Single straightforward change
- No Task() usage (you haven't used it)

{Colors.YELLOW}Consider delegating if:{Colors.END}
- Multi-file implementation
- Architectural changes needed

{Colors.GREEN}Proceeding is allowed{Colors.END}
""",

            'MEDIUM_ORCHESTRATOR': f"""
{Colors.RED}🛑 ORCHESTRATOR FIREWALL - BLOCKED{Colors.END}

{Colors.BOLD}MEDIUM TIER - ORCHESTRATOR MODE DETECTED{Colors.END}

{Colors.CYAN}State Detected:{Colors.END}
- Tier: {Colors.BOLD}MEDIUM{Colors.END}
- Task() usage: {Colors.RED}YES{Colors.END}
- Role: {Colors.BOLD}ORCHESTRATOR{Colors.END}

{Colors.RED}❌ Violation:{Colors.END}
You used Task() for planning/analysis → You are now an {Colors.BOLD}ORCHESTRATOR{Colors.END}
Orchestrators {Colors.BOLD}NEVER{Colors.END} implement directly.

{Colors.YELLOW}Required Action:{Colors.END}
{Colors.BOLD}Deploy implementation agent(s) instead:{Colors.END}

    Task(
        subagent_type="general-purpose",
        description="Implement [feature]",
        prompt="<implementation details>"
    )

{Colors.CYAN}Why this matters:{Colors.END}
Direct implementation DESTROYS your coordination capacity.
You lose ability to handle escalations and maintain architecture map.

{Colors.RED}This tool usage will be BLOCKED.{Colors.END}
""",

            'HEAVY_FULL_ORCHESTRATOR': f"""
{Colors.RED}🛑 ORCHESTRATOR FIREWALL - CRITICAL VIOLATION{Colors.END}

{Colors.BOLD}HEAVY/FULL TIER - ORCHESTRATOR MODE{Colors.END}

{Colors.CYAN}State Detected:{Colors.END}
- Tier: {Colors.BOLD}{self.tier}{Colors.END}
- Phase: {Colors.BOLD}{self.phase if self.phase else 'Unknown'}{Colors.END}
- Task() usage: {Colors.RED}YES{Colors.END}
- Role: {Colors.BOLD}ORCHESTRATOR{Colors.END}

{Colors.RED}❌ CRITICAL RULE VIOLATION:{Colors.END}
{Colors.BOLD}HEAVY/FULL tier orchestrators NEVER implement directly{Colors.END}

This is a {Colors.RED}cognitive necessity{Colors.END}, not just a guideline:
- Holding coordination map {Colors.RED}excludes{Colors.END} holding implementation details
- Direct implementation {Colors.RED}destroys{Colors.END} orchestration capacity
- You will {Colors.RED}lose{Colors.END} ability to handle escalations

{Colors.YELLOW}Phase Checkpoint:{Colors.END}
""" + (f"""
{Colors.CYAN}Phase {self.phase} - {"Implementation" if self.phase == 3 else "Phase " + str(self.phase)}{Colors.END}

{Colors.BOLD}Before implementing, answer:{Colors.END}
1. Do I have a clear plan? (Phase 2 complete?)
2. Am I orchestrator or implementer? → {Colors.RED}ORCHESTRATOR{Colors.END}
3. How many files need changes? → {Colors.YELLOW}Deploy N agents{Colors.END}
""" if self.phase else "") + f"""

{Colors.YELLOW}Required Action:{Colors.END}
{Colors.BOLD}Deploy implementation agents:{Colors.END}

    # For single file:
    Task(subagent_type="general-purpose",
         description="Implement X in file.py",
         prompt="...")

    # For multiple files (deploy in parallel):
    Task(...)  # Agent 1: file1.py
    Task(...)  # Agent 2: file2.py
    Task(...)  # Agent 3: file3.py

{Colors.RED}This tool usage is BLOCKED to protect orchestration integrity.{Colors.END}
""",

            'HEAVY_FULL_NO_TASK': f"""
{Colors.RED}🛑 ORCHESTRATOR FIREWALL - HEAVY/FULL TIER BLOCK{Colors.END}

{Colors.BOLD}HEAVY/FULL TIER DETECTED{Colors.END}

{Colors.CYAN}State:{Colors.END}
- Tier: {Colors.BOLD}{self.tier}{Colors.END}
- Task() usage: {Colors.YELLOW}No (yet){Colors.END}

{Colors.YELLOW}⚠️  HEAVY/FULL Tier Requirement:{Colors.END}
These tiers are {Colors.BOLD}orchestrator-only{Colors.END}. All implementation must be delegated.

{Colors.CYAN}Workflow:{Colors.END}
1. Planning Phase → Deploy planning agents
2. Synthesis Phase → Deploy synthesis agent
3. {Colors.RED}Implementation Phase → Deploy implementation agents{Colors.END}
4. Verification Phase → Deploy verification agent

{Colors.RED}Direct implementation is not allowed in HEAVY/FULL tiers.{Colors.END}

{Colors.YELLOW}Action Required:{Colors.END}
Deploy implementation agent(s) to maintain framework integrity.
""",

            'AUTO_ORCHESTRATOR': f"""
{Colors.RED}🛑 ORCHESTRATOR FIREWALL - AUTO ROUTER BLOCK{Colors.END}

{Colors.BOLD}AUTO ROUTER MODE - ORCHESTRATOR DETECTED{Colors.END}

{Colors.CYAN}State:{Colors.END}
- Mode: {Colors.BOLD}AUTO ROUTER{Colors.END}
- Task() usage: {Colors.RED}YES{Colors.END}

You used the /response-awareness router, which routed to a tier.
Since you used Task(), you are now an {Colors.BOLD}ORCHESTRATOR{Colors.END}.

{Colors.YELLOW}Action Required:{Colors.END}
Deploy implementation agents instead of implementing directly.

{Colors.RED}Tool usage BLOCKED.{Colors.END}
""",
        }

        return messages.get(scenario, f"Unknown scenario: {scenario}")

    def print_diagnostic_info(self):
        """Print diagnostic information (for debugging)."""
        print(f"\n{Colors.CYAN}=== Orchestrator Firewall Diagnostic ==={Colors.END}")
        print(f"Tool: {Colors.BOLD}{self.tool_name}{Colors.END}")
        print(f"Tier: {Colors.BOLD}{self.tier}{Colors.END}")
        print(f"Phase: {Colors.BOLD}{self.phase if self.phase else 'None'}{Colors.END}")
        print(f"Task() used: {Colors.BOLD}{self.used_task}{Colors.END}")
        print(f"Is Orchestrator: {Colors.BOLD}{self.is_orchestrator}{Colors.END}")
        print(f"Is Deployed Agent: {Colors.BOLD}{self._is_deployed_agent()}{Colors.END}")
        print(f"{Colors.CYAN}========================================={Colors.END}\n")


def main():
    """Main hook entry point."""

    # Get tool name from environment (Claude Code provides this)
    tool_name = os.environ.get('TOOL_NAME', 'Unknown')

    # Read conversation from stdin (Claude Code provides this)
    conversation = sys.stdin.read()

    # Create firewall instance
    firewall = OrchestratorFirewall(conversation, tool_name)

    # Debug mode (set DEBUG_FIREWALL=1 environment variable)
    if os.environ.get('DEBUG_FIREWALL') == '1':
        firewall.print_diagnostic_info()

    # Skip hook if not in response-awareness mode
    if firewall.tier == 'NONE':
        log_hook_decision("orchestrator-firewall", "NONE", "SKIPPED", tool_name, "Not in response-awareness mode")
        sys.exit(0)

    # Check if should block
    should_block, severity, message = firewall.should_block()

    if severity == 'ALLOW':
        log_hook_decision("orchestrator-firewall", firewall.tier, "ALLOW", tool_name, "Agent implementation or direct work allowed")
        sys.exit(0)

    elif severity == 'WARN':
        # Print warning but allow execution
        log_hook_decision("orchestrator-firewall", firewall.tier, "WARN", tool_name, "Warning issued but allowed")
        print(message)
        print(f"{Colors.GREEN}Proceeding with tool execution...{Colors.END}\n")
        sys.exit(0)

    elif severity == 'BLOCK':
        # Print block message and prevent execution
        reason = f"Orchestrator attempted direct implementation (Phase {firewall.phase})" if firewall.phase else "Orchestrator attempted direct implementation"
        log_hook_decision("orchestrator-firewall", firewall.tier, "BLOCK", tool_name, reason)
        print(message, file=sys.stderr)
        print(f"\n{Colors.RED}❌ Tool execution BLOCKED by orchestrator firewall{Colors.END}", file=sys.stderr)
        print(f"{Colors.CYAN}Recovery:{Colors.END}", file=sys.stderr)
        print(f"1. Deploy implementation agent(s) with Task()", file=sys.stderr)
        print(f"2. Or switch to appropriate tier for direct implementation", file=sys.stderr)
        print(f"3. Or acknowledge deviation and override (edit hook settings)\n", file=sys.stderr)
        sys.exit(2)  # Exit code 2 BLOCKS tool execution per Claude Code spec

    # Default: Allow with diagnostic
    log_hook_decision("orchestrator-firewall", firewall.tier, "ALLOW", tool_name, "Default allow")
    sys.exit(0)


if __name__ == '__main__':
    main()
