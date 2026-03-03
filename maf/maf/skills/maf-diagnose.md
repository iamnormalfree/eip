# MAF Diagnostics Skill

**Version:** 1.0.0
**Author:** MAF HQ
**Created:** 2026-01-16
**Purpose:** Self-diagnostic troubleshooting for MAF agents and help for LLMs using MAF correctly

---

## Overview

This skill provides:
- Self-diagnostic capabilities for agents stuck on beads
- Troubleshooting guidance for LLMs using MAF correctly
- Discovery layer for finding correct MAF scripts
- Prevention of common MAF anti-patterns
- Issue logging for MAF HQ improvements

---

## Installation

**Location:** `maf/skills/maf-diagnose.md`

**Usage (from agent):**
```bash
claude --skill maf/skills/maf-diagnose
```

**Usage (for LLMs):**
```bash
# For agents
Skill(maf/diagnose)

# As a command
/maf/diagnose
```

---

## Core Functions

### 1. State Capture

The first function is always state capture - understanding current state before troubleshooting:

```bash
capture_agent_state() {
    local target="${1:-self}"
    local mode="${2:-auto}"

    if [[ "$mode" == "manual" ]]; then
        # Manual mode - human asking for diagnosis
        echo "MAF Diagnostics: What are you trying to do?"
        read -r
    else
        # Auto mode - agent asking for diagnosis
        echo "MAF Diagnostics: What are you currently working on?"
    fi

    # Check what agent is trying to do
    echo "MAF Diagnostics: Checking current bead state..."

    # Get bead ID if available
    local current_bead=$(bd list --status in_progress --json | jq -r '.[0].id // empty')
    if [[ -n "$current_bead" ]]; then
        echo "M

MAF Diagnostics: Working on bead: $current_bead"
    fi
}
```

### 2. State Analysis

After state capture, analyze all available signals:

```bash
analyze_state() {
    # Check agent pane output
    echo "MAF Diagnostics: Checking agent pane output..."
    # Check for errors, stuck prompts, confusion
    # Look for anti-patterns in recent output

    # Check bead state
    echo "   MAF Diagnostics: Checking bead state..."
    # Check if bead is in correct state
    # Verify bead is assigned to agent
    # Check bead dependencies

    # Check environment and configuration
    echo "   MAF Diagnostics: Checking MAF environment..."
    # Check PROJECT_ROOT
    # Check MAF scripts exist
    # Check Agent Mail connectivity

    # Check for common issues
    echo "   MAF Diagnostics: Checking for common issues..."
    # Check for hardcoded paths
    # Check for workflow violations
    # Check for knowledge gaps
}
```

### 3. Fix Suggestions

Based on analysis, suggest specific fixes:

```bash
suggest_fixes() {
    local problem_type="$1"
    local issue_severity="${2:-unknown}"

    echo "MAF Diagnostics: Problem detected ($problem_type)"
    echo ""
    echo "Suggested fixes:"
    echo ""

    # Provide specific, actionable fixes
    case "$problem_type" in
        "no-coordinate-agents")
            echo "1. Use MAF's coordinate-agents.sh or:"
            echo "   bash maf/scripts/maf/coordinate-agents.sh"
            echo ""
            echo "2. Or document why custom workflow is necessary:"
            echo "   See: maf/scripts/maf/templates/why-custom.md"
            ;;
        "hardcoded-paths")
            echo "1. Add subtree auto-detection pattern:"
            echo "   DETECTED_SCRIPT_DIR=\"\$(cd \"\$(dirname \"\${BASH_SOURCE[0]}\")\" && pwd)\""
            echo "   if [[ \"\$DETECTED_SCRIPT_DIR\" == *\"/maf/scripts/\" ]]; then"
            echo "     PROJECT_ROOT=\"\$(cd \"\$DETECTED_SCRIPT_DIR/../../../..\" && pwd)\""
            echo "   else"
            echo "     PROJECT_ROOT=\"\$(cd \"\$DETECTED_SCRIPT_DIR/../..\" && pwd)\""
            echo "   fi"
            ;;
        "no-beads-found")
            echo "1. Check if beads are initialized:"
            echo "   bd list --status ready"
            echo ""
            echo "2. If no beads, create some:"
            echo "   /plan-to-beads docs/plans/active/2025-01-11-*.md"
            echo ""
            echo "3. Verify beads are in correct state:"
            echo "   bd list --status open"
            ;;
        "skill-confusion")
            echo "1. Check skill routing options:"
            echo "   SKILL_ROUTING_MODE=sdd-only bash scripts/maf/autonomous-workflow-nextnest.sh --loop"
            echo ""
            echo "2. Or use direct work:"
            echo "   SKILL_ROUTING_MODE=direct-only bash scripts/maf/autonomous-workflow-nextnest.sh --loop"
            ;;
        "agent-stuck")
            echo "1. Check agent pane output for errors"
            echo "2. Check if agent has a prompt waiting for input"
            echo "3. Try: bd close <bead_id> to reset task"
            echo "4. Check Agent Mail for supervisor instructions"
            ;;
        *)
            echo "Checking for other issues..."
            ;;
    esac

    echo ""
    echo "Run suggested fixes? (y/N): "
    read -r answer
    if [[ "$answer" =~ ^[Yy] ]]; then
        apply_fixes "$problem_type"
    fi
}
```

---

## Workflow

### For Agents (Self-Diagnostic):

```bash
# Agent gets stuck on bead
Skill(maf/diagnose)

MAF Diagnostics: What bead are you working on?
Agent: nextnest-j5w

MAF Diagnostics: Checking agent pane output...
MAF Diagnostics: Checking bead state...

MAF Diagnostics: I see the issue - you're trying to use custom workflow
MAF Diagnostics: Fix: Use coordinate-agents.sh or document why custom workflow is necessary

Agent: Got it, let me try coordinate-agents.sh

MAF D

iagnostics: I'll monitor your progress...
```

### For LLMs (Discovery + Troubleshooting):

```bash
# LLM exploring MAF
/maf

MAF Operations: What are you trying to do?
LLM: I want to set up autonomous workflow

MAF Operations: Checking MAF installation...

MAF Operations: MAF is installed but not configured
MAF Operations: Would you like to run setup wizard?

LLM: Yes

MAF Operations: Running MAF setup wizard...
```

---

## Configuration

**Environment Variables:**
- `MAF_LOG_LEVEL` - Logging verbosity (default: info)
- `MAF_LOG_FILE` - Log file location (default: stdout/stderr)
- `SKILL_ROUTING_MODE` - Skill routing mode (optional)

---

## Dependencies

**Required:**
- `bd` command (bead management)
- `jq` (JSON processing)
- `tmux` (agent pane capture - for agents in tmux)
- `curl` (Agent Mail communication)

**Optional:**
- `doctor.sh` (MAF health check)
- `rebuild-maf-cli-agents.sh` (session rebuild)

---

## Exit Codes

- `0` - Diagnostics complete, no issues found
- `1` - Issue found, fix suggested
- `2` - Invalid state (can't diagnose in current state)

---

## Usage Examples

### Example 1: Agent Self-Diagnosis

```bash
# Agent is stuck on bead
claude --skill maf/skills/maf-diagnose

MAF Diagnostics: What bead are you working on?
Agent: nextnest-j5w

MAF Diagnostics: Checking agent pane output...
MAF Diagnostics: Checking bead state...

MAF Diagnostics: I see the issue - you're trying to use custom workflow
MAF Diagnostics: Fix: Use coordinate-agents.sh or document why custom workflow is necessary

Agent: Got it, let me try coordinate-agents.sh

MAF Diagnostics: I'll monitor your progress...
```

### Example 2: LLM Discovery

```bash
# LLM exploring MAF
/maf

MAF Operations: Checking git state...
MAF Operations: You're in a NextNest project

MAF Operations: Would you like to see available MAF operations?

LLM: Yes

MAF Operations: Here's what MAF provides:
• coordinate-agents.sh - Agent coordination
• rebuild-maf-cli-agents.sh - Rebuild agents
• verify-plan-to-beads.sh - Validate bead state

LLM: I want to use coordinate-agents.sh

MAF Operations: Starting coordinate-agents.sh...
```

### Example 3: Troubleshooting

```bash
# Something isn't working
/maf diagnose

MAF Operations: Checking MAF diagnostics...

MAF Operations: Found issue: hardcoded paths in custom scripts
MAF Operations: Fix: Add subtree auto-detection pattern

User: Show me how

MAF Operations: Add this at top of your script:
```bash
# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

MAF Operations: Would you like to apply this fix now?

User: Yes

MAF Operations: Applying fix...
MAF Operations: Fix applied successfully

MAF Operations: Issue resolved.
```

---

## Logging

All issues found during diagnostics are logged to:
- `.maf/logs/maf-improvements.log` (JSON format)
- `.maf/logs/maf-diagnostics.log` (text format)

---

## Testing

### Test Case 1: Agent stuck on bead
1. Start an agent on a bead
2. Simulate stuck state (agent waiting for input)
3. Run skill: `Skill(maf/diagnose)`
4. Verify agent identifies stuck state
5. Verify fix suggestions work

### Test Case 2: LLM discovers MAF patterns
1. LLM calls `/maf`
2. Verify skill shows discovery layer
3. Verify skill guides to correct MAF usage
4. Verify LLM understands what MAF provides

### Test Case 3: Troubleshooting error
1. Simulate MAF error (hardcoded paths)
2. Run skill: `/maf diagnose`
3. Verify issue is identified correctly
4. Verify fix works

---

## Notes

This skill complements the LLM-UX improvements recently added to MAF:
- `maf/README.md` - Discovery layer
- `maf/LLM_README.md` - AI agent instructions
- `maf/agents.md` - Agent configuration guide

The skill should always reference these documents when guiding users or agents to MAF solutions.
