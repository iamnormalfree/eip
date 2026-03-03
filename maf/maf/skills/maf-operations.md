# MAF Operations Skill

**Version:** 1.0.0
**Author:** MAF HQ
**Created:** 2026-01-16
**Purpose:** Discovery layer + troubleshooting for LLMs using MAF correctly

---

## Overview

This skill provides LLMs (including humans) with:
- Discovery of what MAF provides before building custom solutions
- Troubleshooting diagnostics for MAF issues
- Prevention of common MAF anti-patterns
- Guidance to correct MAF patterns

---

## Entry Points

### Discovery Mode: `/maf`

When called as `/maf` (or equivalently `Skill(maf/diagnose)`), the skill:

1. **Auto-analyze project state**
   - Check git state
   - Check MAF installation
   - Check current project context

2. **Show what MAF provides**
   - Display available MAF operations
   - Show discovery layer documentation
   - Help user navigate MAF patterns

3. **Ask user's goal**
   - What are you trying to do?
   - What problem are you trying to solve?
   - What is your experience with MAF?

4. **Guide to correct MAF usage**
   - Guide to appropriate MAF scripts
   - Suggest using MAF patterns
   - Prevent NextNest-style anti-patterns

---

### Troubleshooting Mode: `/maf diagnose`

When called as `/maf diagnose` (or `Skill(maf/diagnose)` with diagnose context), the skill:

1. **Context-aware complexity routing**
   - Analyze available signals (user input, error messages, state)
   - Determine appropriate diagnostic scope
   - Run targeted diagnostics

2. **Quick Checks** (30 seconds)
   - Verify PROJECT_ROOT is set correctly
   - Check if MAF scripts exist
   - Check Agent Mail connectivity

3. **Standard Diagnostics** (1-3 minutes)
   - Run `doctor.sh` if available
   - Check agent-topology.json is valid
   - Review git log for errors
   - Check environment variables

4. **Deep Diagnostics** (5-10 minutes)
   - Analyze git commit patterns
   - Check for workflow violations
   - Check for missing documentation
   - Check for agent communication issues

5. **Suggest Fixes**
   - Provide actionable fix steps
   - Show exact commands to run
   - Explain why the fix works
   - Test the fix if safe

---

## Core Functions

### Discovery Mode: `/maf`

### auto_analyze_state()

```bash
auto_analyze_state() {
    # Check git state
    git status 2>/dev/null

    # Check MAF directory structure
    ls -la maf/ 2>/dev/null || echo "No MAF directory found"

    # Check .maf/ directory
    ls -la .maf/ 2>/dev/null || echo "No .maf/ directory found"

    # Check what MAF scripts are available
    ls maf/scripts/maf/*.sh 2>/dev/null || echo "No MAF scripts found"
}
```

### show_maf_provides()

```bash
show_maf_provides() {
    echo "MAF Operations: Here's what MAF provides:"
    echo ""
    echo "Core MAF Operations:"
    echo "  • coordinate-agents.sh - Agent coordination, Agent Mail, review loops"
    echo "  • rebuild-maf-cli-agents.sh - Rebuild tmux session"
    echo "  • verify-plan-to-beads.sh - Validate bead state after conversion"
    echo ""
    echo "Documentation:"
    echo "  • maf/README.md - Complete MAF documentation"
    echo "  • maf/EXTENSION_PATTERNS.md - How to customize MAF correctly"
    echo "  • maf/LLM_README.md - AI agent instructions"
    echo "  • maf/agents.md - Agent configuration guide"
    echo ""
    echo "What would you like to do?"
}
```

### ask_user_goal()

```bash
ask_user_goal() {
    echo "MAF Operations: What are you trying to do?"
    echo ""
    echo "1. Set up MAF in a new project"
    echo "2. Troubleshoot an MAF issue"
    echo "3. Learn MAF patterns"
    echo "4. Check MAF installation"
    echo ""
    read -p "Choose option: " goal_choice

    case "$goal_choice" in
        1) set up)
            guide_maf_setup
            ;;
        2) troubleshoot)
            start_diagnostics
            ;;
        3) learn)
            teach_maf_patterns
            ;;
        4) check_install)
            verify_installation
            ;;
        *)
            echo "Invalid option"
            return 1
            ;;
    esac
}
```

### Troubleshooting Functions

```bash
start_diagnostics() {
    echo "MAF Operations: Running diagnostics..."
    run_quick_checks
    run_standard_diagnostics
    analyze_results
}

run_quick_checks() {
    echo "Quick Checks (30-60 seconds):"
    echo "  Checking PROJECT_ROOT..."
    # Implementation details...
}

run_standard_diagnostics() {
    echo "Standard Diagnostics (1-3 minutes):"
    echo "  Checking MAF installation..."
    # Implementation details...
}

analyze_results() {
    echo "Diagnostic Results:"
    echo "  Issues found: "
    # Implementation details...
}
```

---

## Section 3: Troubleshooting Patterns

### Pattern: Hardcoded Paths

**Detection:**
```bash
# Check for hardcoded project paths
grep -r "/root/projects/roundtable" /root/projects/maf-github --exclude-dir=.git
```

**Fix:**
```bash
# Add subtree auto-detection pattern
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

### Pattern: Custom Workflow Without Documentation

**Detection:**
```bash
# Check for custom workflow scripts
find scripts/maf -name "*autonomous-workflow*" -o -name "*workflow*" 2>/dev/null
```

**Fix:**
- Use MAF's `coordinate-agents.sh`
- Or document why custom workflow is necessary (use `scripts/maf/templates/why-custom.md`)
- Check if MAF provides equivalent functionality first

### Pattern: Plan-to-Beads Without Validation

**Detection:**
```bash
# Check for false closures
bd list --status closed --json | jq -r '.[] | \
  select(.closed_at != null and .receipt == null) | \
  select(.git_commit == null) | \
  | wc -l
```

**Fix:**
- Run `scripts/maf/verify-plan-to-beads.sh` after conversions
- Validate bead state (all beads should be "open" initially)
- Require git commits or receipts for closures

---

## Section 7: Discovery Layer Pattern

### Discovery Principles

The `/maf` entry point should:

1. **Check current project state** first
2. **Show what MAF provides** (scripts, docs, patterns)
3. **Ask user's goal** - understand what they're trying to do
4. **Guide to appropriate solution** - match to correct MAF pattern
5. **Validate understanding** - ensure user knows which commands to run

### Example Conversation Flow

```
User: /maf

MAF Operations: Checking MAF installation...

MAF Operations: MAF is installed in this project.

MAF Operations: Here's what MAF provides:
• coordinate-agents.sh - Agent coordination
• rebuild-maf-cli-agents.sh - Rebuild agents
• verify-plan-to-beads.sh - Validate bead state

MAF Operations: What are you trying to do?

User: I want to set up autonomous workflow for beads

MAF Operations: MAF doesn't provide a general autonomous workflow script.
MAF Operations: NextNest has `autonomous-workflow-nextnest.sh` with production-ready patterns.

MAF Operations: Would you like to learn from NextNest's approach?

User: Yes

MAF Operations: I'll analyze NextNest's workflow...
MAF Operations: I'll extract reusable patterns...

MAF Operations: Here's what NextNest does:
• Two-tier skill routing (SDD for complex, /response-awareness for simple)
• Skill routing based on bead complexity
• Agent Mail communication for coordination

MAF Operations: Should I add these patterns to MAF HQ?

User: Yes

MAF Operations: I'll document these as MAF improvements.
```

---

## Section 8: Example Usage Scenarios

### Scenario 1: LLM Discovers MAF Patterns

**Input:** LLM wants to set up autonomous workflow

**MAF Operations Skill:**
1. Checks if MAF provides autonomous workflow
2. Discovers MAF doesn't have one
3. Suggests using NextNest's patterns as reference
4. Guides LLM to appropriate MAF patterns

**Result:** LLM learns correct MAF patterns, doesn't build from scratch

---

### Scenario 2: LLM Encounters Error

**Input:** LLM gets MAF error

**MAF Operations Skill:**
1. Analyzes error (hardcoded paths, missing script)
2. Shows which part of MAF is failing
3. Provides specific fix (add subtree auto-detection)
4. Verifies fix works

**Result:** LLM learns correct patterns, fixes issue

---

## Section 9: Issue Logging and MAF HQ Improvements

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

---

## Section 10: Implementation Notes

The skill uses context-aware routing:

```bash
# Context-aware complexity routing
analyze_state() {
    local user_input="$1"
    local error_output="$2"

    # Determine appropriate diagnostic scope
    if [[ -n "$error_output" ]]; then
        # Error occurred - escalate to deep diagnostics
        run_deep_diagnostics "$user_input" "$error_output"
    else
        # No error - quick checks
        run_quick_checks "$user_input"
    fi
}
```

---

## Dependencies

**Required:**
- `bd` command (bead management)
- `jq` (JSON processing)
- `curl` (Agent Mail communication)

**Optional:**
- `doctor.sh` (MAF health check)
- `rebuild-maf-cli-agents.sh` (session rebuild)
- `maf/scripts/maf/maf-diagnose` (advanced diagnostics)

---

## Testing

### Test Case 1: Discovery Layer
1. LLM calls `/maf`
2. Skill shows what MAF provides
3. LLM chooses to use MAF patterns
4. LLM doesn't build custom workflow from scratch

### Test Case 2: Troubleshooting
1. LLM encounters MAF error
2. Skill runs context-aware diagnostics
3. Skill provides targeted fix
4. LLM applies fix, issue resolved

### Test Case 3: Anti-pattern Detection
1. LLM tries to use custom workflow
2. Skill detects NextNest-style anti-pattern
3. Skill shows correct MAF pattern
4. LLM learns to use MAF patterns

---

## Notes

This skill works with LLM-UX improvements:
- `maf/README.md` - Discovery layer
- `maf/EXTENSION_PATTERNS.md` - Customization patterns (call vs copy)
- `maf/LLM_README.md` - AI agent instructions
- `maf/agents.md` - Agent configuration guide

The skill should always reference these documents when guiding LLMs to MAF solutions.
