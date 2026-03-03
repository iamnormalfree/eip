# MAF Self-Diagnostic Skill Design

**Version:** 1.0.0
**Author:** MAF HQ
**Created:** 2026-01-16
**Purpose:** Comprehensive troubleshooting and diagnostics for MAF agents and humans

---

## Overview

This document describes the design for two complementary skills that work together:

1. **MAF Self-Diagnostic Skill** - For agents working in tmux to self-diagnose and recover from stuck states
2. **MAF Operations Skill** - For humans (LLMs) to discover MAF patterns, troubleshoot issues, and prevent wrong MAF usage

---

## Skill 1: MAF Self-Diagnostic Skill (For Agents)

### Purpose

**Agent-centric troubleshooting skill that helps agents:**
- Self-diagnose when stuck, confused, or encountering errors
- Receive troubleshooting guidance from supervisor via Agent Mail
- Suggest specific fixes for common MAF issues
- Log issues for MAF HQ improvements

**Triggered by:**
- Agent self-trigger when stuck/confused
- Supervisor call via Agent Mail: "Check on agent in pane X"

**Output:** Diagnostic results + fix suggestions + issue logs

---

## Installation

**Skill file:** `maf/maf-diagnose` (symlink to appropriate script)

**Usage:**
```bash
# Agent self-diagnose
/maf/maf-diagnose

# Supervisor checks on agent via Agent Mail
curl -X POST http://127.0.0.1:8765/mcp/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"maf-diagnose","arguments":{"pane":2}}}'
```

---

## Section 1: Understanding Agent State

The skill should capture agent state in this order:

1. **Current task context**
   - Ask: "What bead are you currently working on?"
   - Capture: Bead ID, goal, current step

2. **Agent pane output** (last 20 lines)
   - Capture output from agent's tmux pane
   - Look for error messages
   - Look for stuck prompts
   - Check for confusion patterns

3. **Bead state verification**
   - Check: `bd list --status in_progress`
   - Verify: Bead is assigned to agent
   - Check: Bead is actually ready for work

4. **Common stuck patterns**
   - Agent waiting for input (has prompt with text)
   - Agent in error state
   - Agent has no access to required tools
   - Agent confused about which script/skill to use

---

### Section 2: Determining the Problem

After state capture, categorize the issue:

**Issue Types:**
- **Startup issues:** Can't start agents, can't find MAF scripts
- **Workflow issues:** Bead state errors, skill routing confusion
- **Environment issues:** Paths, config, connectivity problems
- **Knowledge gaps:** Doesn't know which script/skill to use

### Diagnostic Scope

**Quick Checks** (30-60 seconds)
- Verify PROJECT_ROOT is set correctly
- Check if relevant MAF scripts exist
- Check Agent Mail connectivity
- Verify agent has access to tools (`bd`, `jq`, etc.)

**Standard Diagnostics** (1-3 minutes)
- Run `doctor.sh` if available
- Check agent-topology.json is valid
- Review git log for recent errors
- Check environment variables

**Deep Diagnostics** (5-10 minutes)
- Analyze agent output thoroughly
- Compare with MAF patterns (anti-patterns)
- Verify bead state consistency
- Check for knowledge gaps

---

### Section 3: Fix Suggestions

Based on problem categorization, suggest specific fixes:

**Startup Issues:**
- Add missing environment variables
- Fix paths to use PROJECT_ROOT auto-detection
- Fix agent-topology.json structure

**Workflow Issues:**
- Use MAF's `coordinate-agents.sh` instead of custom workflow
- Use `verify-plan-to-beads.sh` after conversions
- Use `/maf/maf-diagnose` for troubleshooting

**Environment Issues:**
- Fix Agent Mail configuration
- Set up `.maf/context.sh` with proper variables
- Fix hardcoded project paths

**Knowledge Gaps:**
- Guide to `maf/README.md` for available scripts
- Guide to `maf/LLM_README.md` for AI agents
- Guide to `maf/agents.md` for agent configuration

---

## Skill 2: MAF Operations Skill (For LLMs)

### Purpose

**Discovery layer + troubleshooting for LLMs (including humans)**
- Discover what MAF provides before building custom
- Troubleshoot MAF issues systematically
- Prevents wrong MAF usage (NextNest anti-patterns)
- Guides to correct MAF patterns

**Triggered by:**
- `/maf` - Discovery entry point (what is MAF? What does MAF provide?)
- `/maf diagnose` - Troubleshooting entry point (why is MAF broken?)

---

## Section 1: Discovery Layer - `/maf` Entry Point

### Auto-analyze state first:

```bash
# Check git state
git status 2>/dev/null

# Check MAF directory structure
ls -la maf/ 2>/dev/null || echo "No MAF found in this project"

# Check .maf/ directory
ls -la .maf/ 2>/dev/null || echo "No .maf/ found in this project"

# Check what MAF scripts are available
ls maf/scripts/maf/*.sh 2>/dev/null || echo "No MAF scripts found"
```

---

## Section 2: Show What MAF Provides

Display a menu of available MAF operations:

**Common Operations:**
```bash
# Agent coordination
maf/scripts/maf/coordinate-agents.sh

# Rebuild agents
maf/scripts/maf/rebuild-maf-cli-agents.sh --force

# Bead verification
maf/scripts/maf/maf-diagnose

# Verification
maf/scripts/maf/verify-ac.sh <bead-id>
```

**Quick Reference:**
- `maf/README.md` - Complete MAF documentation
- `maf/LLM_README.md` - AI agent instructions
- `maf/agents.md` - Agent configuration guide

---

## Section 3: Ask User What They're Trying to Do

Ask clarifying questions to understand user's goal:

1. **"What are you trying to accomplish with MAF?"**
   - Start with user's goal, then guide to solution

2. **Have you used MAF before?"**
   - Determine if they need basic or advanced guidance

3. **Are you setting up MAF for a new project?**
   - Fresh setup → Use setup wizard
   - Existing project → Use discovery layer

4. **Are you troubleshooting an issue?**
   - Run diagnostics if yes
   - Show common issues and fixes

---

## Section 4: Troubleshooting Diagnostics (via `/maf diagnose`)

### Context-Aware Complexity Routing

```bash
# Quick checks for common issues
check_quick_issues() {
    # Check for common NextNest anti-patterns
    # Check for hardcoded paths
    # Check for coordinate-agents.sh usage vs custom workflow
    # Check for plan-to-beads validation
}

# Standard diagnostics
run_diagnostics() {
    # Run MAF doctor if available
    # Check git log for errors
    # Check MAF installation state
    # Verify agent-topology configuration
}

# Deep diagnostics
run_deep_diagnostics() {
    # Analyze git commit patterns
    # Check for workflow violations
    # Check for missing documentation
    # Check for agent communication issues
}
```

---

## Section 5: Preventing Wrong MAF Usage

**Anti-patterns to detect:**
- Building custom workflows without checking MAF first
- Using hardcoded project paths
- Not validating bead state after plan-to-beads
- Running MAF scripts with wrong configuration

**Detection methods:**
1. Check if custom workflow script exists
2. Check for hardcoded `/root/projects/roundtable` paths
3. Check for false closures (beads closed without work done)
4. Check for missing documentation for custom scripts

**Prevention:**
1. Add guard: `source scripts/maf/templates/custom-workflow-guard.sh` at top of custom scripts
2. Add validation to plan-to-beads conversion
3. Use `maf/scripts/maf/maf-diagnose` to detect issues early
4. Document why custom approach is necessary (see `scripts/maf/templates/why-custom.md`)

---

## Section 6: Issue Logging and MAF HQ Improvements

### Issue Categories

**P0 - Critical:** Blocks work
- Scripts fail to run
- Agents won't start
- Workflow violations

**P1 - Important:** Affects quality
- Wrong patterns in use
- Documentation gaps
- Config errors

**P2 - Enhancement:** Nice to have
- Better diagnostics
- Improved documentation
- New features

### Issue Log Format

```json
{
  "timestamp": "2026-01-16T12:00:00Z",
  "issue_type": "P0",
  "component": "coordinate-agents.sh",
  "issue": "Script not found in maf/scripts/maf/",
  "description": "NextNest built custom workflow when MAF already had coordinate-agents.sh",
  "suggested_fix": "Use MAF's coordinate-agents.sh or document why custom workflow is necessary"
}
```

### Audit Log

**Auto-audit behavior:**
- Run automatically at end of `/maf diagnose` call
- Log issues to `.maf/logs/maf-improvements.log`
- Generate summary for human review
- Human reviews and decides what to send to MAF HQ

---

## Section 7: Example Usage

### Example 1: Agent Self-Diagnosis

```
[Agent working on bead, gets stuck]

Claude: /maf/maf-diagnose

MAF Diagnose Skill: Analyzing agent state...

MAF Diagnose Skill: I see you're stuck on nextnest-j5w
MAF Diagnose Skill: Checking agent pane output...
MAF Diagnose Skill: Checking bead state...

MAF Diagnose Skill: Found issue - you're trying to use custom workflow
MAF Diagnose Skill: Fix: Use MAF's coordinate-agents.sh or document why custom workflow is necessary

Agent: Got it, let me try coordinate-agents.sh

MAF Diagnose Skill: I'll monitor your progress...
```

### Example 2: Human Uses `/maf`

```
Human: /maf

MAF Operations Skill: Checking MAF installation...

MAF Operations Skill: It looks like you're setting up MAF in this project.

MAF Operations Skill: Here's what MAF provides:
• coordinate-agents.sh - Agent coordination, Agent Mail, review loops
• rebuild-maf-cli-agents.sh - Rebuild tmux session
• verify-plan-to-beads.sh - Validate bead state after conversion

MAF Operations Skill: What are you trying to do?

Human: I want to set up autonomous workflow for beads

MAF Operations Skill: MAF doesn't provide a general autonomous workflow script. However, NextNest has `autonomous-workflow-nextnest.sh` that's been tested in production.

MAF Operations Skill: Would you like to learn from NextNest's custom workflow?

Human: Yes

MAF Operations Skill: I'll analyze NextNest's approach and extract reusable patterns...

MAF Operations Skill: Here's what NextNest does:
• Two-tier skill routing (SDD for complex, /response-awareness for simple)
• Skill routing based on bead complexity
• Agent Mail communication for coordination

MAF Operations Skill: Should I document these patterns to MAF HQ?

Human: Yes, document these patterns for MAF HQ

MAF Operations Skill: Creating .maf/logs/maf-improvements-summary.md...

MAF Operations Skill: Issues to report:
• "General autonomous workflow script" - Should be added to MAF core (coordinate-agents.sh)
• "Two-tier skill routing" - Should be configurable (env var: MAF_SKILL_ROUTING_MODE)

MAF Operations Skill: Should I submit these improvements to MAF HQ?

Human: Yes

MAF Operations Skill: I'll create a summary document and add it to the MAF improvements log.

MAF Operations Skill: Summary created at `.maf/logs/maf-improvements-summary.md`

MAF Operations Skill: Should I submit to MAF HQ?

Human: Yes

MAF Operations Skill: [Opens PR to MAF HQ repository]

MAF Operations Skill: PR created and submitted. Closing.
```

---

## Testing Strategy

1. **Unit Tests**
   - Test skill behavior with mock agent state
   - Test diagnostic accuracy
   - Validate fix suggestions

2. **Integration Tests**
   - Test with real agent scenarios
   - Verify no errors when agent runs skill
   - Verify Agent Mail integration

3. - Acceptance Tests
   - Verify skill solves NextNest-era issues
   - Verify skill prevents wrong MAF usage

---

## Dependencies

**Required:**
- Agent Mail for agent communication
- `bd` command for bead management
- `jq` for JSON processing
- tmux for agent pane capture

**Optional:**
- `doctor.sh` for health checks
- `rebuild-maf-cli-agents.sh` for session rebuild
- `maf/scripts/maf/maf-diagnose` for advanced diagnostics

---

## Open Questions

1. **File naming:** Should the skill be called `maf-diagnose` or `/maf/diagnose`?
2. **Agent Mail protocol:** How to integrate with existing agent communication?
3. **Logging frequency:** How often should audit log be reviewed?
4. **Fix suggestions:** How do we prioritize which improvements go to MAF HQ?

---

**Status:** Brainstorming complete, ready for design validation
