# Supervisor Coordination Workflow Design

**Date:** 2026-01-16
**Author:** MAF HQ
**Status:** Design Complete - Ready for Implementation

---

## Overview

Create a supervisor coordination system that detects stuck implementors and routes their questions to the supervisor for guidance, enabling autonomous agents to continue working without human intervention.

---

## Architecture

**Purpose:** Detect when implementor agents are stuck waiting for input, route their questions to the supervisor, and deliver supervisor guidance back to the implementor.

**Architecture:**

The system consists of a new script `maf/scripts/maf/supervisor-coordination.sh` that integrates with the existing orchestrator as a component. It monitors implementor panes (2 and 3) for stuck prompts (detected by `>` character), captures their context, and routes an alert to the supervisor pane (0). The supervisor responds naturally, and the system extracts their advice and delivers it back to the stuck implementor via `tmux send-keys`.

**Integration Point:**

The orchestrator calls `supervisor-coordination.sh` in its main loop, similar to how it calls `coordinate-agents.sh` and `audit-closed-beads.sh`. This runs every 30 seconds as part of the orchestration cycle.

**Key Design Decisions:**

- **Direct tmux injection** for advice delivery (immediate, no Agent Mail latency)
- **Monitoring-based** on tmux pane content (catches actual stuck state)
- **Log-and-continue** for timeouts (no reassignment, preserves context)
- **Modular** script that orchestrator calls (testable, maintainable)

---

## Components

**New Script: `maf/scripts/maf/supervisor-coordination.sh`**

This script contains the core coordination logic:

**Functions:**
- `check_stuck_agents()` - Iterates through implementor panes (2, 3) and captures their content using `tmux capture-pane`. Detects stuck prompts by checking for `>` character at the start of a line with actual text content (not just an empty prompt).

- `extract_agent_context()` - Given a stuck pane, extracts the last 5-10 lines to provide context to the supervisor about what the implementor was working on and what question they asked.

- `send_supervisor_alert()` - Formats an alert notification with bead ID, implementor ID, and their question. Sends this to supervisor pane (0) using `tmux send-keys -l` to display the alert in their terminal.

- `monitor_supervisor_response()` - Watches the supervisor pane for new output after sending an alert. Captures the supervisor's response using `tmux capture-pane` once they've typed advice.

- `deliver_advice_to_agent()` - Extracts the supervisor's advice and injects it into the stuck implementor's pane using `tmux send-keys -l` followed by `Enter`, effectively answering their question.

- `coordination_cycle()` - Main entry point that orchestrates the above functions. Called by the orchestrator every 30 seconds.

**State Management:**

Uses a tracking file `/tmp/maf-supervisor-tracking.txt` to record which agents are currently awaiting supervisor response, preventing duplicate alerts for the same stuck agent.

---

## Data Flow

**Normal Flow (Implementor gets stuck):**

1. **Orchestrator runs** every 30 seconds → calls `supervisor-coordination.sh`
2. **Check implementor panes** → capture-pane on panes 2, 3
3. **Detect stuck prompt** → line starts with `>` and contains text
4. **Extract context** → last 5-10 lines from implementor's pane
5. **Check tracking file** → is this agent already awaiting supervisor?
   - Yes → skip, already waiting
   - No → proceed
6. **Send alert to supervisor** (pane 0):
   ```
   [ALERT] Implementor-2 stuck on BEAD-001
   ─────────────────────────────────────────
   Their last prompt:
   > Should I use Postgres or SQLite?

   Respond with advice (will be delivered automatically):
   ```
7. **Update tracking file** → mark implementor as awaiting
8. **Wait for supervisor** → return, next cycle will check response

**Response Flow (Supervisor answers):**

9. **Next orchestration cycle** → 30 seconds later
10. **Check tracking file** → find agents awaiting supervisor
11. **Monitor supervisor pane** → capture new output since alert
12. **Extract advice** → get supervisor's response text
13. **Deliver to implementor** → `tmux send-keys` + Enter
14. **Clear from tracking** → remove awaiting status

---

## Error Handling

**Edge Cases and Failures:**

**Multiple stuck agents:**
- System processes one at a time in order of pane number (2, then 3)
- Each stuck agent gets queued in tracking file
- Supervisor responds to one per cycle
- Tracking file prevents duplicate alerts

**Supervisor doesn't respond:**
- Implementor stays in "awaiting" state
- Each cycle logs "still awaiting supervisor for [agent] on [bead]"
- After 5 minutes (10 cycles), log as "BLOCKED" for visibility
- Implementor prompt remains - no auto-clear (preserves question)

**Supervisor pane unavailable:**
- Detect with `tmux has-session` before operations
- Log warning and skip cycle if session missing
- Don't crash orchestrator

**Tmux capture-pane fails:**
- Wrap in error handling, return empty string
- Log warning but continue processing other agents
- Don't fail entire cycle for one agent failure

**Implementor becomes un-stuck:**
- Happens if they resolve their own question or timeout elsewhere
- Next cycle will see no `>` prompt
- Remove from tracking file automatically
- No-op

**Tracking file corruption:**
- Validate format on read (expect `agent_id:timestamp:bead_id`)
- Recreate if invalid
- Use atomic writes (write to temp, then mv)

---

## Testing Strategy

**TDD Approach (Unit Tests First, Integration Last):**

**Test 1: Stuck Agent Detection**
- Mock `tmux capture-pane` to return pane content with `> Should I use Postgres?`
- Assert `check_stuck_agents()` returns stuck agent data
- Test normal case and edge cases (no prompt, empty prompt, multiple prompts)

**Test 2: Supervisor Alert Formatting**
- Mock stuck agent data
- Assert alert format contains `[ALERT]`, implementor ID, bead ID, and question
- Verify `tmux send-keys -l` is called with correct format

**Test 3: Supervisor Response Capture**
- Mock supervisor pane with pre-alert and post-alert content
- Assert `monitor_supervisor_response()` extracts only new advice
- Test that pre-alert context is excluded from response

**Test 4: Advice Delivery**
- Mock `tmux send-keys` calls
- Assert advice is delivered with `Enter` key pressed
- Verify implementor receives complete response

**Test 5: Tracking File Management**
- Test write/read/delete operations
- Assert duplicate detection works (same agent can't be alerted twice)
- Test cleanup of stale entries (agents no longer stuck)

**Test 6: Integration Test**
- Use actual tmux session with test panes
- Create real stuck implementor scenario
- Send alert, supervisor responds, advice delivered
- Verify end-to-end flow works

**Test Framework:**
- Use `bats` (Bash Automated Testing System) for unit tests
- Integration test uses actual tmux with session name `maf-test`
- All tests mock tmux commands except final integration test

---

## Implementation Order

1. Create `maf/scripts/maf/supervisor-coordination.sh` with function stubs
2. Write Test 1 (stuck detection) → implement `check_stuck_agents()`
3. Write Test 2 (alert format) → implement `send_supervisor_alert()`
4. Write Test 3 (response capture) → implement `monitor_supervisor_response()`
5. Write Test 4 (advice delivery) → implement `deliver_advice_to_agent()`
6. Write Test 5 (tracking) → implement tracking file management
7. Write Test 6 (integration) → end-to-end validation
8. Integrate into orchestrator as component
9. Test with real agents in NextNest

---

## Configuration

**Environment Variables:**

- `MAF_TMUX_SESSION` - Tmux session name (default: maf-cli)
- `MAF_AGENT_WINDOW` - Window name (default: agents)
- `MAF_SUPERVISOR_ALERT_TIMEOUT` - Seconds before logging "BLOCKED" (default: 300)
- `MAF_TRACKING_FILE` - Path to tracking file (default: /tmp/maf-supervisor-tracking.txt)

**Pane Mapping:**
- Pane 0: Supervisor
- Pane 1: Reviewer (not monitored)
- Pane 2: Implementor-1
- Pane 3: Implementor-2

---

## Success Criteria

- [ ] Stuck implementors are detected within 30 seconds
- [ ] Supervisor receives alerts with complete context
- [ ] Supervisor advice is delivered to implementors
- [ ] No duplicate alerts for same stuck agent
- [ ] Tracking file prevents state corruption
- [ ] All unit tests pass
- [ ] Integration test validates end-to-end flow
- [ ] Works with real agents in NextNest

---

**Status:** Design complete, ready for implementation with TDD approach.
