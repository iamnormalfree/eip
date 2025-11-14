# Response-Awareness Framework: Logging Instructions

**Purpose**: Shared optional logging protocol for all response-awareness tiers

**When to load**: If LOGGING_LEVEL != none (set by --light-logging or --verbose-logging flags from router)

**Location**: `docs/completion_drive_logs/DD-MM-YYYY_task-name/`

---

## Prerequisites

This module should only be loaded when:
- Router detected `--light-logging` or `--verbose-logging` flag
- LOGGING_LEVEL variable is set to "light" or "verbose"
- If LOGGING_LEVEL=none, skip loading this module entirely

---

## Logging Levels

### LOGGING_LEVEL=light

**Purpose**: Understand workflow and review decisions
**Overhead**: ~10 seconds per session, ~500 tokens

**Files created**:
- `phase_transitions.log` - Phase entry/exit tracking
- `final_metrics.md` - Session summary

**Phase transitions:**
When entering new phase, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/phase_transitions.log`:
```
[HH:MM:SS] ENTER Phase X: [Phase name]
```

**PATH_DECISION logging:**
When creating PATH_DECISION tag, append to `phase_transitions.log`:
```
[HH:MM:SS] PATH_DECISION: [brief summary]
```

**LCL export summary:**
When Phase completes, if LCL exports created, append to `phase_transitions.log`:
```
[HH:MM:SS] Phase X LCL Exports: [count] (Critical: X, Firm: X, Casual: X)
```

---

### LOGGING_LEVEL=verbose

**Purpose**: Deep learning, debugging, complete audit trail
**Overhead**: ~60 seconds per session, ~2,500 tokens

**Files created**:
- `phase_transitions.log` - Phase entry/exit tracking
- `tag_operations.log` - Every tag insert/resolve
- `lcl_exports.log` - All LCL operations
- `final_metrics.md` - Comprehensive metrics
- `detailed_report.md` - Complete audit trail

**Everything in light logging PLUS:**

**Tag insertion:**
When creating any tag in code, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/tag_operations.log`:
```
[HH:MM:SS] INSERT #TAG_NAME at file.py:line - "Brief context/reason"
```

**Tag resolution:**
When resolving/removing tag, append to `tag_operations.log`:
```
[HH:MM:SS] RESOLVE #TAG_NAME at file.py:line - Action: [what was done]
```

**LCL operations:**
When exporting LCL, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/lcl_exports.log`:
```
[HH:MM:SS] EXPORT LCL_[LEVEL]: key::value
[HH:MM:SS] PASS key::value -> [destination agent/phase]
```

---

## Final Metrics Template

At end of session, write `docs/completion_drive_logs/DD-MM-YYYY_task-name/final_metrics.md`:

```markdown
# Response-Awareness Session Metrics
## Task: [task description]
## Date: [DD-MM-YYYY]
## Tier: [LIGHT/MEDIUM/HEAVY/FULL]
## Logging Level: [light/verbose]

### Phase Summary
- Phase 1 (Planning): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 2 (Synthesis): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 3 (Implementation): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 4 (Verification): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)

### Tag Operations
- Total tags created: X
- Tags resolved: X
- Tags remaining: X (should be 0 except PATH tags)
- Most common tag: #TAG_NAME (X occurrences)

### LCL Exports
- Critical exports: X
- Firm exports: X
- Casual exports: X
- Total context passed: X items

### Assumptions & Decisions
- COMPLETION_DRIVE assumptions: X (Verified: X, Incorrect: X)
- Assumption accuracy: X%
- PATH_DECISION points: X
- Non-obvious choices: X

### Suggestions Generated
- ERROR_HANDLING: X locations
- EDGE_CASE: X locations
- VALIDATION: X locations

### Quality Metrics
- Code lines removed (pattern cleanup): X
- SUNK_COST patterns caught: X
- Verification iterations: X

### Final Status
All critical tags resolved
Clean code delivered
Framework effectiveness: [brief assessment]
```

---

## Important Notes

- All logging is OPTIONAL - only executes if LOGGING_LEVEL != none
- Logging should not interfere with core orchestration
- Failed logging operations should not block implementation
- Overhead is additional to normal processing time

---

**Version**: 1.0
**Last Updated**: 2025-10-18
**Extracted From**: response-awareness-heavy/SKILL.md lines 14-120
