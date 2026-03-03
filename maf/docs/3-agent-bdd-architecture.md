# 3-Agent BDD Architecture

## System Overview

The 3-Agent BDD (Behavior-Driven Development) workflow is an autonomous multi-agent system that enforces software engineering best practices through coordinated agents communicating via Agent Mail MCP.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       TMUX Session (maf-bdd)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Supervisor  │  │  Reviewer   │  │       Implementor           │  │
│  │   Pane 0    │  │   Pane 1    │  │         Pane 2              │  │
│  │  OrangeDog  │  │ PurpleBear  │  │        RedPond              │  │
│  │             │  │             │  │                             │  │
│  │ • Loop      │  │ • Polls     │  │ • Polls for feedback        │  │
│  │ • Assign    │  │   mail      │  │ • Implements with TDD       │  │
│  │ • BV triage │  │ • Reviews   │  │ • Sends completion mail     │  │
│  │ • Audit     │  │ • Stage 1   │  │                             │  │
│  │ • Escalate  │  │ • Stage 2   │  │                             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
│         │                 │                       │                  │
│         └─────────────────┴───────────────────────┘                  │
│                           │                                          │
│                    ┌──────┴──────┐                                   │
│                    │ Agent Mail  │                                   │
│                    │    MCP      │                                   │
│                    │  (bus)      │                                   │
│                    └─────────────┘                                   │
│                           │                                          │
│                    ┌──────┴──────┐                                   │
│                    │   Storage   │                                   │
│                    │ (messages)  │                                   │
│                    └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Workflow Stages

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   READY      │────▶│ ASSIGNED     │────▶│ TDD COMPLETE │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                       │
                            │                       ▼
                            │                ┌──────────────┐
                            │                │ STAGE 1      │
                            │                │ (Spec)       │
                            │                └──────────────┘
                            │                       │
                            │              ┌────────┴────────┐
                            │              ▼                 ▼
                            │         ┌──────────┐     ┌──────────┐
                            │         │ PASS     │     │ FAIL     │
                            │         └──────────┘     └──────────┘
                            │              │                 │
                            │              ▼                 ▼
                            │         ┌──────────┐     ┌──────────┐
                            │         │ STAGE 2  │     │ ESCALATE │
                            │         │ (Quality)│     │ (retry)  │
                            │         └──────────┘     └──────────┘
                            │              │
                            │              ▼
                            │         ┌────────┐
                            │         │  PASS  │
                            │         └────┬───┘
                            │              │
                            └──────────────┘
                                   │
                                   ▼
                            ┌──────────┐
                            │  CLOSED  │
                            └──────────┘
```

## Component Breakdown

### 1. Supervisor Agent (Pane 0 - OrangeDog)

**Responsibilities:**
- Workflow orchestration and loop management
- Bead assignment with BV prioritization
- Escalation handling and bead reopening
- Audit and compliance checking
- Progress monitoring

**Key Files:**
- `autonomous-workflow-3agent-bdd.sh`: Main workflow loop
- `bv_integration.py`: Intelligent prioritization
- `escalation.py`: Failure tracking and guidance

**Communication:**
- Sends: Bead assignments, escalation notices, audit alerts
- Receives: Escalation notifications, completion confirmations

### 2. Reviewer Agent (Pane 1 - PurpleBear)

**Responsibilities:**
- Two-stage automated review (spec + quality)
- Mail polling for completion notifications
- Detailed feedback generation
- Approval/rejection decisions

**Key Files:**
- `reviewer.py`: Two-stage review logic
- `reviewer_poller_callback.py`: Mail polling callback
- `review-bead.sh`: Manual review command

**Communication:**
- Sends: Approval/rejection with feedback
- Receives: TDD completion notifications

### 3. Implementor Agent (Pane 2 - RedPond)

**Responsibilities:**
- TDD implementation (RED-GREEN-REFACTOR)
- TDD verification before review request
- Mail polling for review feedback
- Fixing review issues

**Key Files:**
- `tdd_enforcer.py`: TDD verification
- `implementor_poller_callback.py`: Mail polling callback
- `tdd-check.sh`: Self-check command

**Communication:**
- Sends: TDD completion notifications
- Receives: Review feedback, escalation guidance

## Communication Protocol

### Agent Mail Subjects

| Subject | Meaning | Action |
|---------|---------|--------|
| `[BEAD-123] assigned` | Bead assigned to implementor | Start TDD |
| `[BEAD-123] ready for review` | TDD complete, awaiting review | Run two-stage review |
| `[BEAD-123] Stage 1 FAILED` | Spec compliance issue | Fix and resubmit |
| `[BEAD-123] Stage 2 FAILED` | Code quality issue | Fix and resubmit |
| `[BEAD-123] APPROVED` | Both stages passed | Close bead |
| `[BEAD-123] Escalation` | Failure guidance | Follow guidance |

### Mail Body Format

Structured for programmatic parsing:

```
From: {agent_mail_name}
To: {recipient_mail_name}
Subject: [{bead_id}] {action} - {stage}

{structured_content}

Details:
- Bead: {bead_id}
- Stage: {stage_name}
- Status: {passed/failed}
- Notes: {specific_feedback}
```

### Stage Transitions

Parsed via regex patterns in poller callbacks:

```python
STAGE_PATTERNS = {
    'approved': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+APPROVED'),
    'rejected': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+Stage\s+Rejected'),
    'tdd_violation': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+TDD\s+Violation'),
    'escalation': re.compile(r'\[(?P<bead_id>[A-Z0-9-]+)\]\s+Escalation'),
}
```

## Data Flow

### 1. Bead Assignment Flow

```
Supervisor                  Agent Mail              Implementor
    │                            │                        │
    │── BV triage ──────────────→│                        │
    │←─ prioritized beads ───────│                        │
    │                            │                        │
    │── send(assigned) ─────────→│                        │
    │                            │── poll ───────────────→│
    │                            │←─ (receipt) ───────────│
    │                            │                        │
    │                            │── deliver(assigned) ──→│
```

### 2. TDD Completion Flow

```
Implementor                  Reviewer                Supervisor
    │                            │                        │
    │── TDD verification         │                        │
    │── send(complete) ────────→│                        │
    │                            │                        │
    │                            │── poll ──────────────→│
    │                            │←─ (receipt) ──────────│
    │                            │                        │
    │                            │── start review ───────→│
```

### 3. Review Flow

```
Reviewer                   Agent Mail              Implementor
    │                            │                        │
    │── Stage 1 review           │                        │
    │── send(result) ───────────→│                        │
    │                            │── poll ───────────────→│
    │                            │←─ (receipt) ───────────│
    │                            │                        │
    │                            │── deliver(result) ────→│
    │                            │                        │
    │                            │                 (if fail)
    │                            │←─ fix ─────────────────│
    │←─ resubmit ────────────────│                        │
    │                            │                        │
    │── Stage 2 review           │                        │
    │── send(approved) ─────────→│                        │
```

### 4. Escalation Flow

```
Reviewer                  Escalation              Supervisor
    │                           │                      │
    │── detect failure          │                      │
    │── record(attempt) ──────→│                      │
    │←─ guidance ───────────────│                      │
    │                           │                      │
    │── send(guidance) ─────────│──────────────────────→│
    │                           │                      │
    │                           │   (after 3 fails)    │
    │                           │                      │
    │                           │←── reopen bead ──────│
```

## Security Considerations

### 1. Input Validation

All Python modules validate inputs:
- Agent names: Regex validation `^[A-Z][a-zA-Z]+$`
- File paths: Absolute paths required, `Path.resolve()`
- Commands: `subprocess.run(..., check=True, timeout=30)`

### 2. Memory Management

Mail pollers prune processed messages:
```python
max_processed_messages = 1000
if len(processed_ids) > max_processed_messages:
    processed_ids = set(list(processed_ids)[500:])
```

### 3. Timeout Protection

All subprocess calls have timeouts:
- Subprocess execution: 30 seconds
- Stage transitions: 30 minutes (configurable)
- Mail polling: 10 second intervals

### 4. Error Handling

- Graceful degradation if Agent Mail unavailable
- Fallback to original order if BV fails
- Continue workflow on non-critical errors

## Technology Stack

### Core Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Terminal | tmux | Persistent agent sessions |
| Scripting | Bash | Workflow orchestration |
| Data | jq | JSON processing |
| Bead Management | bd | Bead lifecycle |
| Communication | Agent Mail MCP | Inter-agent messaging |
| Logic | Python 3.8+ | Verification & polling |

### Python Libraries

```python
# Standard library
import subprocess  # Command execution
import json        # Data parsing
import re          # Pattern matching
import pathlib     # Path handling
import time        # Intervals

# Custom modules
from mail_poller import AgentMailPoller
from tdd_enforcer import TDDEnforcer
from reviewer import TwoStageReviewer
from escalation import EscalationManager
from bv_integration import BVIntegration
```

### File Structure

```
maf/
├── scripts/
│   ├── maf/
│   │   ├── autonomous-workflow-3agent-bdd.sh  # Main workflow
│   │   ├── poll-agent-mail.sh                 # Polling wrapper
│   │   ├── tdd-check.sh                       # TDD verification
│   │   ├── review-bead.sh                     # Manual review
│   │   ├── start-3agent-bdd.sh                # Quick start
│   │   ├── bdd-status.sh                      # Status command
│   │   ├── lib/                               # Python modules
│   │   │   ├── mail_poller.py
│   │   │   ├── tdd_enforcer.py
│   │   │   ├── reviewer.py
│   │   │   ├── escalation.py
│   │   │   ├── bv_integration.py
│   │   │   ├── implementor_poller_callback.py
│   │   │   └── reviewer_poller_callback.py
│   │   └── setup/
│   │       └── setup-3agent-bdd.sh            # Session setup
│   └── templates/
│       ├── agent-topology-3agent-bdd.json     # Topology template
│       └── prompts/
│           ├── implementor-tdd.md
│           ├── reviewer-two-stage.md
│           └── escalation-guidance.md
└── .maf/config/
    ├── agent-topology.json                    # Active topology
    └── custom-workflow-hooks.sh               # Custom extensions
```

## Extension Points

### 1. Custom Workflow Hooks

Create `.maf/config/custom-workflow-hooks.sh`:

```bash
# Before bead assignment
CUSTOM_HOOK_BEFORE_ASSIGN() {
  local bead_id="$1"
  local all_ready="$2"
  # Return 1 to skip this bead
  # Return 2 to abort all assignments
}

# After successful assignment
CUSTOM_HOOK_AFTER_ASSIGN() {
  local bead_id="$1"
  local agent="$2"
  local pane="$3"
  local skill="$4"
  # Return non-zero to rollback assignment
}

# Custom skill selection
CUSTOM_HOOK_SELECT_SKILL() {
  local bead_id="$1"
  # Echo custom skill command
}

# Before agent check
CUSTOM_HOOK_BEFORE_CHECK() {
  local iteration="$1"
  local assign_status="$2"
  # Return 1 to skip agent check
}

# After agent check
CUSTOM_HOOK_AFTER_CHECK() {
  local iteration="$1"
  local blocked_json="$2"
  # Return 2 to abort workflow
}

# Error handler
CUSTOM_HOOK_ERROR_HANDLER() {
  local line_number="$1"
  local error_message="$2"
  local context="$3"
}

# Custom prompt modification
CUSTOM_HOOK_AGENT_PROMPT() {
  local pane="$1"
  local message="$2"
  # Echo modified message
}

# Custom bead type handling
CUSTOM_HOOK_CUSTOM_BEAD() {
  local bead_id="$1"
  local title="$2"
  local labels="$3"
  # Return 0 if handled, 1 if not
}
```

### 2. Custom Review Stages

Extend `TwoStageReviewer` in `reviewer.py`:

```python
class CustomReviewer(TwoStageReviewer):
    def review_stage3_security(self, bead_id: str, commit_hash: str) -> Dict:
        """Custom security review stage."""
        # Implementation
        pass
```

### 3. Custom TDD Rules

Extend `TDDEnforcer` in `tdd_enforcer.py`:

```python
class CustomTDDEnforcer(TDDEnforcer):
    def check_custom_rule(self, bead_id: str) -> List[str]:
        """Custom TDD rule."""
        violations = []
        # Implementation
        return violations
```

### 4. Custom Escalation Logic

Extend `EscalationManager` in `escalation.py`:

```python
class CustomEscalation(EscalationManager):
    def get_custom_guidance(self, attempt: int) -> str:
        """Custom escalation guidance."""
        # Implementation
        pass
```

## Performance Considerations

### Memory Usage

- 3 agents vs 4 agents: ~25% reduction
- Mail pollers: Prune messages at 1000 processed
- TDD verification: In-memory Git operations

### Scalability

- Beads: Limited by `bd` performance
- Polling: 10-second intervals per agent
- Review: Automated O(1) per bead

### Bottlenecks

- TDD verification: Git operations
- BV triage: Dependent on BV performance
- Mail parsing: Regex matching (fast)

## Future Enhancements

### Potential Improvements

1. **Parallel Review**: Multiple reviewers for large codebases
2. **Advanced TDD**: Mutation testing integration
3. **ML-Based Prioritization**: Train on historical data
4. **Auto-Fix**: AI-powered issue resolution
5. **Metrics Dashboard**: Real-time workflow metrics
6. **Distributed Agents**: Multi-machine support

### Extension Ideas

- Code coverage enforcement
- Performance regression testing
- Security scanning integration
- Documentation generation
- API contract testing

## References

- **User Guide**: `docs/3-agent-bdd-user-guide.md`
- **Plan**: `docs/plans/2026-01-27-3-agent-bdd-tmux-workflow.md`
- **Tests**: `tests/workflow/`
- **README**: Project root
