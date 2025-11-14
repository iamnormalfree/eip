# OLD Sections Added to Documentation - Summary

**Date**: 2025-10-05  
**Purpose**: Document what was incorrect before the documentation fix

---

## Overview

Added OLD commented-out sections to all updated documentation files to show users what was incorrect before the fix. This provides clear before/after context for the two main issues:

1. **Exit Code Confusion**: Exit code 1 vs Exit code 2 for blocking
2. **Settings Format**: `before_tool_use` object format vs `PreToolUse` array format

---

## Files Updated (5 total)

### 1. `.claude/hooks/README.md`

**Location**: Lines 163-184 (after "Already configured in `.claude/settings.json`:")

**OLD Section Added**:
```markdown
<!-- OLD (INCORRECT - Used before_tool_use object format with enabled field):
Previous documentation showed this INCORRECT format:
```json
{
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "type": "command",
        "command": "python .claude/hooks/orchestrator-firewall.py",
        "enabled": true
      },
      "Write": {
        "type": "command",
        "command": "python .claude/hooks/orchestrator-firewall.py",
        "enabled": true
      }
    }
  }
}
```
This format is WRONG. The correct PreToolUse array format is shown below.
-->
```

**Purpose**: Shows the OLD object-based hook format with `enabled` field that doesn't work with Claude Code.

---

### 2. `.claude/hooks/ORCHESTRATOR_FIREWALL_GUIDE.md`

**Location**: Lines 113-129 (before "The hook has been integrated...")

**OLD Section Added**:
```markdown
<!-- OLD (INCORRECT - before_tool_use object format):
Previous documentation used this INCORRECT settings format:
```json
{
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "enabled": true,
        "type": "command",
        "command": "python .claude/hooks/orchestrator-firewall.py"
      }
    }
  }
}
```
The correct format uses PreToolUse arrays as shown below.
-->
```

**Purpose**: Same as README - shows incorrect format before the fix.

---

### 3. `.claude/hooks/VISUAL_GUIDE.md`

**Two OLD Sections Added**:

#### Section A: Exit Code in Diagram
**Location**: Lines 65-70 (after the DECISION: BLOCK exit code line)

**OLD Section Added**:
```markdown
<!-- OLD (INCORRECT - Exit code 1 for blocking):
│     └─ Exit code: 1 (prevent tool execution)  [WRONG!]
│
│ The correct exit code for blocking is 2, not 1.
│ Exit code 1 is for non-blocking warnings.
-->
```

**Purpose**: Shows the OLD incorrect exit code 1 in the ASCII diagram.

#### Section B: Quick Reference Chart Header
**Location**: Lines 428-431 (before "## Quick Reference Chart")

**OLD Section Added**:
```markdown
<!-- OLD (INCORRECT - Exit codes):
Previous documentation incorrectly stated that exit code 1 blocks tool execution.
CORRECT: Exit 0=allow, Exit 1=warn (non-blocking), Exit 2=block
-->
```

**Purpose**: Explains the exit code confusion before the chart.

---

### 4. `.claude/hooks/hook-config-example.json`

**Two OLD Sections Added**:

#### Section A: OLD Format Example
**Location**: Lines 59-74 (at end of file)

**OLD Section Added**:
```json
"_OLD_FORMAT_INCORRECT": {
  "_comment": "INCORRECT FORMAT - Used before fix (do not use this)",
  "_problem": "Used before_tool_use object format instead of PreToolUse array format",
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "enabled": true,
        "command": "python .claude/hooks/orchestrator-firewall.py"
      },
      "Write": {
        "enabled": true,
        "command": "python .claude/hooks/orchestrator-firewall.py"
      }
    }
  }
}
```

**Purpose**: JSON example of the OLD incorrect format.

#### Section B: OLD Exit Code Documentation
**Location**: Line 52 (in `_customization` section)

**OLD Section Added**:
```json
"_OLD_exit_codes_INCORRECT": "Exit 0 = allow, Exit 1 = block (WRONG - should be exit 2 for block)"
```

**Purpose**: Shows the OLD incorrect exit code documentation.

---

### 5. `.claude/hooks/settings-integration-example.json`

**Two OLD Sections Added**:

#### Section A: OLD Format Example
**Location**: Lines 4-25 (at top of file)

**OLD Section Added**:
```json
"_OLD_FORMAT_INCORRECT": {
  "_comment": "INCORRECT FORMAT - Used before_tool_use object format (do not use this)",
  "_problem": "This was the OLD incorrect way to configure hooks",
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "enabled": true,
        "hook": {
          "type": "command",
          "command": "python .claude/hooks/orchestrator-firewall.py"
        }
      },
      "Write": {
        "enabled": true,
        "hook": {
          "type": "command",
          "command": "python .claude/hooks/orchestrator-firewall.py"
        }
      }
    }
  }
}
```

**Purpose**: Shows the most complete OLD format with nested `hook` object.

#### Section B: OLD Exit Code Documentation
**Location**: Line 109 (in `_exit_code_semantics` section)

**OLD Section Added**:
```json
"_OLD_INCORRECT_exit_1": "Exit 1 used to be documented as block (WRONG - exit 1 is non-blocking warn)"
```

**Purpose**: Clarifies the OLD exit code 1 confusion.

---

## Summary of What Was Wrong

### Issue 1: Exit Code Confusion

**OLD (INCORRECT)**:
- Exit 0 = allow
- Exit 1 = block (WRONG!)
- Exit 2 = (not documented)

**NEW (CORRECT)**:
- Exit 0 = allow
- Exit 1 = warn (non-blocking)
- Exit 2 = block (blocking)

**Impact**: Users would have been confused about why exit 1 didn't block tools.

---

### Issue 2: Settings Format Confusion

**OLD (INCORRECT)**:
```json
{
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "enabled": true,
        "type": "command",
        "command": "python script.py"
      }
    }
  }
}
```

**Problems**:
1. Used `before_tool_use` instead of `PreToolUse`
2. Used object format instead of array format
3. Included `enabled` field (not valid in Claude Code)
4. No `matcher` field (required in array format)

**NEW (CORRECT)**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python script.py"
          }
        ]
      }
    ]
  }
}
```

**Impact**: Users trying to use the OLD format would have had non-functional hooks.

---

## Benefits of Adding OLD Sections

1. **Educational**: Users can see exactly what was wrong
2. **Clarity**: Clear labeling ("INCORRECT", "WRONG") prevents confusion
3. **Context**: Shows the evolution of the documentation
4. **Prevention**: Users won't accidentally use old formats found elsewhere
5. **Transparency**: Acknowledges mistakes and shows fixes

---

## Format Used

### Markdown Files
```markdown
<!-- OLD (INCORRECT - reason):
[old content]
[explanation of what was wrong]
-->
```

### JSON Files
```json
{
  "_OLD_FORMAT_INCORRECT": {
    "_comment": "INCORRECT - reason",
    "_problem": "explanation",
    "old_structure": "..."
  }
}
```

Or inline:
```json
{
  "_OLD_field_name": "old value (WRONG - reason)"
}
```

---

## Verification

All OLD sections added:
- ✓ README.md - 1 section (settings format)
- ✓ ORCHESTRATOR_FIREWALL_GUIDE.md - 1 section (settings format)
- ✓ VISUAL_GUIDE.md - 2 sections (exit code in diagram, exit code before chart)
- ✓ hook-config-example.json - 2 sections (format example, exit code)
- ✓ settings-integration-example.json - 2 sections (format example, exit code)

**Total**: 8 OLD sections across 5 files

---

## Next Steps

Users can now:
1. See what was incorrect before the fix
2. Understand why certain patterns don't work
3. Learn the correct patterns from the contrast
4. Avoid using outdated examples from other sources

---

**Created**: 2025-10-05  
**Purpose**: Document OLD sections added for user clarity  
**Files Modified**: 5 documentation files
