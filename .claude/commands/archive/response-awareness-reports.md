# Response Awareness Report Templates

## Survey Agent Report Format (Phase 0)
```
DOMAIN SURVEY REPORT
====================
Task Scope: [Brief task restatement]
Complexity Assessment: [Simple/Medium/Complex/High]

Affected Domains:
- [Domain 1]: [Brief description of involvement]
- [Domain 2]: [Why this domain is relevant]

Recommended Planning Agents:
- [specific-agent-type]: [Rationale for inclusion]
- [another-agent-type]: [Why needed]

Cross-Domain Risk Areas:
- [Risk 1]: [Description of potential integration challenge]
- [Risk 2]: [Another coordination concern]

Deployment Strategy:
- Parallel deployment safe: [Yes/No with reasoning]
- Estimated agent count: [Number with justification]
- Critical path dependencies: [Any must-complete-first requirements]
```

## Verification Agent Report Format (Phase 4)
Each verification agent must return a structured report for main agent synthesis:
```
VERIFICATION REPORT - [Agent Name]
=====================================
Tags Found: [total count]
Tags Resolved: [count]
Tags Remaining: [count]

RESOLVED TAGS:
- [Tag Type]: [Count] resolved
  - [Specific tag]: [Resolution action taken]

UNRESOLVED TAGS:
- [Tag Type]: [Count] remaining
  - [Specific tag]: [Reason not resolved]

SUGGEST TAGS COLLECTED:
- [File:Line]: [SUGGEST_TYPE]: [Description]

CRITICAL ISSUES:
- [Any blocking problems found]

METRICS:
- Code lines removed: [count]
- Assumptions verified: [count]
- Patterns corrected: [count]
```

## Final Response Awareness Report (Phase 5)
At the end of each session, provide this condensed report:

```
RESPONSE AWARENESS REPORT
═══════════════════════════════════════
LCL Performance:
  Exports created: X (Critical: X, Firm: X, Casual: X)
  Architectural drift prevented: X instances

Planning & Synthesis:
  PATH_DECISION points: X (chose non-obvious: X)
  Constraints escaped (POISON_PATH/FIXED_FRAMING): X

Implementation:
  COMPLETION_DRIVE assumptions: X (correct: X, incorrect: X)
  Unnecessary code removed: X lines
  SUNK_COST patterns caught: X

Verification:
  Tags resolved: X/X
  Potential_Issues flagged: X

Suggestions for User:
  ERROR_HANDLING: X locations
  EDGE_CASES: X locations
  VALIDATION: X locations
  [List specific suggestions]

Final Status:
  ✅ Tags cleaned
  📊 Accuracy: X%
  ⚠️ Blockers prevented: X
═══════════════════════════════════════
```

## Checkpoint Format (For RESOLUTION_PRESSURE interruptions)
```
docs/completion_drive_checkpoints/[timestamp]_checkpoint.md

RESOLUTION_PRESSURE CHECKPOINT
Phase: [0-5]
Depth: [0-2]
Agent Type: [orchestrator/planner/implementer/verifier]
Work Completed: [list]
Work Remaining: [list]
Critical State: [LCL exports]
Next Action: [specific next step]
Restart: /response-awareness --resume-from-checkpoint
```