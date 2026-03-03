# Autonomous MAF Foundations - Implementation Plan

**Project:** Multi-Agent Framework (MAF) - Autonomous Agent Architecture
**Date:** 2026-01-08
**Status:** Design Complete - Ready for Implementation
**Complexity:** HIGH (Multi-file, architecture changes, new governance layer)

---

## Executive Summary

This plan extends the MAF Franchise Architecture (completed in Wave 1 & Wave 2) to add **autonomous agent capabilities**. The vision is MAF franchises where agents can work independently within clear boundaries, requiring human intervention only when truly necessary.

**Key Insight:** Clear governance gives agents freedom to act. By defining when agents can act autonomously vs when they must ask humans, we enable both speed and safety.

---

## Table of Contents

1. [Vision and Architecture](#vision-and-architecture)
2. [Component Overview](#component-overview)
3. [Section 1: The Autonomous Vision](#section-1-the-autonomous-vision)
4. [Section 2: MAF Constitution](#section-2-maf-constitution-the-autonomy-contract)
5. [Section 3: AGENTS.md Template](#section-3-agentsmd-the-agent-behavior-contract)
6. [Section 4: Interactive Setup Wizard](#section-4-interactive-setup-wizard)
7. [Section 5: Implementation Plan](#section-5-implementation-plan)
8. [Two-Agent Model Clarification](#two-agent-model-clarification)
9. [beads_viewer Integration](#beads_viewer-integration)
10. [File Structure](#file-structure)
11. [Implementation Phases](#implementation-phases)
12. [Testing Strategy](#testing-strategy)
13. [Rollout Plan](#rollout-plan)
14. [Success Criteria](#success-criteria)

---

## Vision and Architecture

### The Problem Being Solved

From the original MAF discussion and migration experience:
1. **No decision framework** - Agents don't know when to act vs ask
2. **No error recovery** - No protocols for handling failures
3. **No autonomy contract** - Agent boundaries are unclear
4. **Setup is fragile** - Manual configuration, easy to make mistakes
5. **No coordination layer** - Agents can't work together at scale

### The Solution

A layered autonomy system:
- **Constitution** - Rules encoded, not explained
- **Setup Wizard** - Foolproof configuration
- **Agent Contract** - Single source of truth (AGENTS.md)
- **Coordination** - Agent mail + beads for distributed work

### Non-Goals (What We're NOT Doing)

This plan explicitly DOES NOT address:

- **Full Autonomous Operation** - We're not building "agents that do everything"
  - Agents will still escalate for architectural decisions
  - Humans remain in control of Level 3 decisions
  - Target is 80% autonomous, 20% human-guided

- **New Agent Architectures** - We're not inventing new agent types
  - Building on existing MAF role-based agents (Supervisor, Reviewer, Implementors)
  - Not creating new cognitive architectures or LLM frameworks
  - Focus is on governance, not agent capabilities

- **Real-Time Coordination** - We're not building real-time agent orchestration
  - Agent mail is asynchronous (eventual consistency)
  - No real-time locking or synchronous coordination
  - Beads handle dependencies, not live coordination

- **Performance Optimization** - We're not optimizing agent speed
  - Focus is on safety and governance, not velocity
  - Performance budgets will be added (see Pass g)
  - Not optimizing for latency or throughput

- **Multi-Franchise Orchestration** - We're not coordinating across franchises
  - Each franchise operates independently
  - No cross-franchise beads or coordination
  - HQ pushes updates via subtree, not real-time sync

- **Production Infrastructure** - We're not building deployment infrastructure
  - No CI/CD pipeline changes
  - No monitoring/alerting systems
  - No production scaling or failover

#### Rationale for Non-Goals

These exclusions are intentional to keep the scope manageable:
1. **Autonomy is a governance layer** - Not a new agent system
2. **Safety over speed** - Correctness matters more than performance
3. **Single-franchise focus** - Multi-franchise is future work
4. **Build on existing MAF** - Leverage Wave 1 & 2 investments

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAF HQ (Franchisor)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MAF_CONSTITUTION.md (Autonomy Contract)                  │ │
│  │  - Decision boundaries (autopilot vs ask-human)           │ │
│  │  - Error recovery protocols                               │ │
│  │  - Agent rights/responsibilities                          │ │
│  │  - Coordination rules (agent mail, beads)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AGENTS.md.template (Agent Behavior Contract)             │ │
│  │  - How to use beads                                       │ │
│  │  - How to coordinate via agent mail                       │ │
│  │  - Review loops and quality gates                         │ │
│  │  - When to escalate                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Setup Wizard (scripts/setup/setup-maf.sh)                │ │
│  │  - Interactive configuration                              │ │
│  │  - Validation gates                                       │ │
│  │  - Reset & reconfigure                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          │ git subtree pull
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Consumer Franchise (e.g., Roundtable)              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AGENTS.md (generated from template)                      │ │
│  │  - Project-specific rules added                           │ │
│  │  - Local escalation contacts                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MAF Static Agents (tmux sessions)                        │ │
│  │  - Supervisor, Reviewer, Imp-1, Imp-2                    │ │
│  │  - Read AGENTS.md on startup                              │ │
│  │  - Pick up beads via agent mail                           │ │
│  │  - Work independently within boundaries                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Dynamic Agents (fungible workforce)                      │ │
│  │  - Spin up for complex tasks                              │ │
│  │  - Coordinate via agent mail                              │ │
│  │  - Leave when work done                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Overview

| Component | Type | Purpose | Priority |
|-----------|------|---------|----------|
| **MAF_CONSTITUTION.md** | Governance | Autonomy contract defining when agents can act | HIGH |
| **MAF_ASSUMPTIONS.md** | Governance | What agents assume is "normal" | HIGH |
| **CORE_OVERRIDE_POLICY.md** | Governance | When/how to override core MAF files | HIGH |
| **VERSIONING_GUIDE.md** | Governance | Semantic versioning for cognitive systems | HIGH |
| **AGENTS.md.template** | Template | Agent behavior contract template | HIGH |
| **setup-maf.sh** | Script | Interactive setup wizard | HIGH |
| **beads_viewer integration** | Tooling | Task distribution UI | MEDIUM |
| **AUTONOMY_GUIDE.md** | Documentation | How autonomous operation works | MEDIUM |

---

## Section 1: The Autonomous Vision

### Goal

MAF franchises where agents can work independently within clear boundaries, requiring human intervention only when truly necessary.

### Current State (What We Have)

✅ **Already Built (Wave 1 & 2):**
- MCP Agent Mail for coordination
- Beads for task distribution
- Role-based agent spawning (supervisor, reviewer, implementor-1, implementor-2)
- CI governance for subtree protection
- Health check infrastructure
- Comprehensive runbooks

### Missing for Autonomy (What We're Adding)

❌ **No Decision Framework**
- Agents don't know when they can act independently vs must ask humans
- No clear boundaries for autonomous action

❌ **No Error Recovery Protocols**
- Agents don't know what to do when things fail
- No retry strategies, no escalation patterns

❌ **No Autonomy Contract**
- Agent rights/responsibilities are implicit
- No clear statement of what agents can assume

❌ **Setup Still Manual**
- Configuration requires manual editing
- Easy to make mistakes (as seen in Nextnest integration)
- No validation gates

### The Autonomous Franchise Model

```
┌─────────────────────────────────────────────────────────────┐
│                    MAF HQ (Franchisor)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  MAF_CONSTITUTION.md (The Autonomy Contract)           │ │
│  │  - Decision boundaries (autopilot vs ask-human)        │ │
│  │  - Error recovery protocols                            │ │
│  │  - Agent rights/responsibilities                       │ │
│  │  - Coordination rules (agent mail, beads)              │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  AGENTS.md.template (Agent Behavior Contract)          │ │
│  │  - How to use beads                                    │ │
│  │  - How to coordinate via agent mail                    │ │
│  │  - Review loops and quality gates                      │ │
│  │  - When to escalate                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │ git subtree pull
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Consumer Franchise (e.g., Roundtable)          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  AGENTS.md (customized from template)                  │ │
│  │  - Project-specific rules added                        │ │
│  │  - Local escalation contacts                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Autonomous Agents (tmux sessions)                     │ │
│  │  - Read AGENTS.md on startup                           │ │
│  │  - Pick up beads via agent mail                        │ │
│  │  - Work independently within boundaries                │ │
│  │  - Escalate when needed                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 2: MAF Constitution - The Autonomy Contract

### Purpose

Define when agents can act independently vs when they must ask humans. This is the core document that enables safe autonomy.

### Autonomy Policy Engine (NEW)

**Purpose:** Compile human-readable constitution to machine-readable policy for deterministic enforcement.

#### Policy Compilation

**Input:** `maf/docs/maf-constitution.md` (human-readable constitution)

**Compiled Output:** `.maf/policy/autonomy.json` (machine-readable rules)

Generated by setup wizard or `maf doctor` command:

```json
{
  "version": "1.0.0",
  "constitution_hash": "sha256:...",
  "last_updated": "2026-01-09T12:00:00Z",
  "autonomy_levels": {
    "L1_AUTOPILOT": {
      "description": "Full autonomy for safe, single-file changes",
      "criteria": [
        "single_file_change == true",
        "lines_changed < 50",
        "risk_level == 'low'",
        "file_type in ['docs', 'tests', 'config']"
      ],
      "allowed_actions": ["edit", "create", "delete"],
      "required_validations": [],
      "auto_commit": true
    },
    "L2_VALIDATION_REQUIRED": {
      "description": "Autopilot with validation for multi-file changes",
      "criteria": [
        "files_changed >= 2 && files_changed <= 3",
        "lines_changed < 200",
        "risk_level in ['low', 'medium']",
        "touches_api == false"
      ],
      "allowed_actions": ["edit", "create"],
      "required_validations": [
        "tests_pass",
        "callers_checked",
        "subtree_healthy"
      ],
      "auto_commit": true,
      "escalation_on_failure": true
    },
    "L3_ASK_HUMAN": {
      "description": "Human approval required for risky changes",
      "criteria": [
        "architecture_change == true",
        "risk_level == 'high'",
        "files_changed > 3",
        "lines_changed >= 200",
        "touches_core == true",
        "touches_api == true"
      ],
      "allowed_actions": [],
      "required_validations": [],
      "auto_commit": false,
      "human_approval_required": true
    }
  },
  "enforcement": {
    "pre_commit_hook": true,
    "ci_validation": true,
    "agent_runtime_check": true
  }
}
```

#### Enforcement Mechanisms

**1. Pre-commit Hook** (created by setup wizard)

Location: `.maf/hooks/pre-commit-autonomy`

```bash
#!/usr/bin/env bash
# Pre-commit hook: Cannot commit without passing autonomy level requirements

STAGED_FILES=$(git diff --cached --name-only)
DIFF_OUTPUT=$(git diff --cached)

# Classify change using policy engine
CLASSIFICATION=$(maf/scripts/policy/classify-change.py \
  --files "$STAGED_FILES" \
  --diff "$DIFF_OUTPUT" \
  --policy .maf/policy/autonomy.json)

LEVEL=$(echo "$CLASSIFICATION" | jq -r '.level')
VALIDATIONS=$(echo "$CLASSIFICATION" | jq -r '.required_validations')

if [[ "$LEVEL" == "L3_ASK_HUMAN" ]]; then
  echo "❌ Commit blocked: This change requires human approval (Level 3)"
  echo "   Reason: $(echo "$CLASSIFICATION" | jq -r '.reason')"
  exit 1
fi

# Run required validations
for validation in $(echo "$VALIDATIONS" | jq -r '.[]'); do
  case $validation in
    tests_pass)
      if ! maf/scripts/validation/run-tests.sh; then
        echo "❌ Commit blocked: Tests failed"
        exit 1
      fi
      ;;
    subtree_healthy)
      if ! maf/scripts/health/check-subtree.sh; then
        echo "❌ Commit blocked: Subtree health check failed"
        exit 1
      fi
      ;;
  esac
done

echo "✓ Autonomy validation passed (Level: $LEVEL)"
exit 0
```

**2. CI Validation** (extends existing subtree guard)

Added to CI pipeline:
```yaml
- name: Autonomy Policy Check
  run: |
    maf/scripts/policy/validate-ci-policy.py \
      --policy .maf/policy/autonomy.json \
      --commit ${{ github.sha }}
```

**3. Agent Runtime Wrapper**

Location: `maf/scripts/policy/agent-runtime-wrapper.py`

```python
#!/usr/bin/env python3
# Agent runtime wrapper: Check autonomy before executing any action

import sys
import json
import subprocess

def classify_action(files_changed, lines_changed, risk_signals):
    """Classify proposed action into autonomy level"""
    policy = json.load(open('.maf/policy/autonomy.json'))

    # Check against each level's criteria
    for level_name, level_config in policy['autonomy_levels'].items():
        if all(eval(criteria) for criteria in level_config['criteria']):
            return {
                'level': level_name,
                'allowed_actions': level_config['allowed_actions'],
                'required_validations': level_config['required_validations'],
                'auto_commit': level_config['auto_commit']
            }

    # Default to safest level
    return policy['autonomy_levels']['L3_ASK_HUMAN']

def before_agent_action(action, files, diff):
    """Called before agent executes any action"""
    classification = classify_action(
        files_changed=len(files),
        lines_changed=diff.count('\n'),
        risk_signals=analyze_risk(files, diff)
    )

    if classification['level'] == 'L3_ASK_HUMAN':
        print(f"⚠️ Action requires human approval (Level 3)")
        print(f"   Files: {files}")
        sys.exit(1)  # Block execution

    if classification['level'] == 'L2_VALIDATION_REQUIRED':
        # Run validations before proceeding
        for validation in classification['required_validations']:
            if not run_validation(validation):
                print(f"❌ Validation failed: {validation}")
                create_escalation_packet(action, validation)
                sys.exit(1)

    return classification

if __name__ == '__main__':
    action = sys.argv[1]
    files = sys.argv[2:]
    before_agent_action(action, files, get_diff())
```

#### Policy Compilation Command

```bash
# Recompile policy (run by setup wizard or manually)
maf/scripts/policy/compile-constitution.py \
  --input maf/docs/maf-constitution.md \
  --output .maf/policy/autonomy.json \
  --validate
```

**Result:** Autonomy stops being a vibe and becomes a contract the system can actually police. Deterministic autonomy enforcement.

### User Workflow: Autonomous Agent Operation

#### Prerequisites
1. MAF setup complete (setup wizard run)
2. Agents spawned (tmux session running)
3. AGENTS.md reviewed and customized
4. Agent mail flowing

#### Step 1: Agent Startup & Registration
1. **Agent reads AGENTS.md**
   ```bash
   # Agent automatically reads on startup
   cat AGENTS.md
   ```

2. **Agent registers with agent mail**
   ```bash
   mcp-agent-mail register <agent-name>
   ```

3. **Agent checks for assigned beads**
   ```bash
   bead list --status=assigned --agent=<agent-name>
   ```

#### Step 2: Agent Picks Up Bead
1. **Agent finds next optimal bead**
   ```bash
   maf/scripts/beads/find-next-bead.sh <role> <agent-name>
   ```

2. **Agent checks dependencies**
   ```bash
   maf/scripts/beads/check-dependencies.sh <bead-id>
   ```

3. **Agent marks bead as in-progress**
   ```bash
   maf/scripts/beads/mark-progress.sh <bead-id> in-progress
   ```

4. **Agent announces via agent mail**
   ```bash
   mcp-agent-mail send "Starting bead #<bead-id>: <title>"
   ```

#### Step 3: Agent Executes Work
1. **Agent classifies change** (Level 1/2/3)
   - Single file, <50 lines → Level 1 (Full Autopilot)
   - Multi-file, 2-3 files → Level 2 (Autopilot with Validation)
   - Architecture changes → Level 3 (Ask Human)

2. **Agent executes according to level**
   - **Level 1**: Make changes → run tests → commit
   - **Level 2**: Make changes → run tests → check callers → commit or escalate
   - **Level 3**: Create proposal → ask human → wait for approval

3. **Agent handles errors**
   - Retriable error → Retry up to 3 times
   - Partial failure → Document and continue
   - Total failure → Escalate immediately

#### Step 4: Agent Completes Bead
1. **Agent marks bead complete**
   ```bash
   maf/scripts/beads/mark-progress.sh <bead-id> complete <evidence>
   # Evidence: commit hash, PR URL, log snippet
   ```

2. **Agent notifies dependents**
   ```bash
   maf/scripts/beads/notify-dependents.sh <bead-id>
   ```

3. **Agent sends completion summary**
   ```bash
   mcp-agent-mail send "Completed bead #<bead-id>: <title>" \
     --content="{files_changed, tests_passed, notes}"
   ```

#### Step 5: Agent Picks Up Next Bead
Return to Step 2 and repeat.

#### Step 6: Agent Escalates (When Needed)
1. **Agent creates escalation packet**

   **Escalation Packet Format (Mandatory - Structured):**

   Location: `.maf/pending-escalations/<bead-id>-<timestamp>.json`

   ```json
   {
     "packet_version": "1.0",
     "bead_id": 123,
     "agent": "imp-1",
     "timestamp": "2026-01-09T14:30:00Z",
     "subject": "[L2_VALIDATION_REQUIRED]: Test failure in auth module refactor",
     "severity": "warning",
     "risk_classification": {
       "level": "L2_VALIDATION_REQUIRED",
       "reason": "Multi-file change (2 files, 150 lines) with test failure",
       "impact": "Blocks bead completion, dependent beads waiting"
     },
     "what_i_tried": [
       {
         "action": "Ran unit tests after refactor",
         "command": "pytest tests/test_auth.py",
         "expected": "All tests pass",
         "actual": "2 tests failed: test_login_redirect, test_session_expiry"
       },
       {
         "action": "Checked callers of modified function",
         "command": "grep -r 'authenticate_user' src/ --include='*.rs'",
         "expected": "Find and update all callers",
         "actual": "Found 3 callers, updated 2 (missed src/api/middleware.rs)"
       }
     ],
     "what_failed": {
       "primary_error": "Test failure: test_login_redirect assertion failed",
       "error_output": "AssertionError: Expected redirect to /login, got /auth/login",
       "root_cause_hypothesis": "Hardcoded path changed during refactor, middleware not updated"
     },
     "options_ranked": [
       {
         "rank": 1,
         "approach": "fastest_safe",
         "description": "Fix hardcoded path in test",
         "command": "sed -i 's|/login|/auth/login|g' tests/test_auth.py",
         "pros": ["Quick fix", "Tests pass"],
         "cons": ["Doesn't address middleware issue"],
         "estimated_time": "30 seconds"
       },
       {
         "rank": 2,
         "approach": "cleanest",
         "description": "Update middleware to use new path",
         "command": "edit src/api/middleware.rs to call new auth endpoint",
         "pros": ["Fixes root cause", "Consistent paths"],
         "cons": ["Requires restart", "More testing needed"],
         "estimated_time": "5 minutes"
       },
       {
         "rank": 3,
         "approach": "rollback",
         "description": "Revert refactor to previous working state",
         "command": "git revert HEAD",
         "pros": ["Guaranteed to work", "Safe"],
         "cons": ["Loses refactor work", "Need to redo"],
         "estimated_time": "1 minute"
       }
     ],
     "recommended_next_action": {
       "option": 2,
       "reason": "Cleanest fix addresses root cause, acceptable time cost"
     },
     "requesting": "guidance",
     "urgency": "normal",
     "context": {
       "dependent_beads_blocked": [124, 125],
       "time_spent_on_bead": "45 minutes",
       "retries_attempted": 3
     }
   }
   ```

2. **Agent sends escalation**
   ```bash
   mcp-agent-mail send --escalation .maf/pending-escalations/123-2026-01-09-14-30-00.json
   ```

   **Human receives:**
   ```
   ┌─────────────────────────────────────────────────────────────────┐
   │ [ESCALATION] Bead #123 from imp-1                               │
   ├─────────────────────────────────────────────────────────────────┤
   │ Subject: [L2] Test failure in auth module refactor              │
   │ Severity: warning                                               │
   │                                                                  │
   │ WHAT I TRIED:                                                    │
   │ 1. Ran unit tests → 2 failed (test_login_redirect,              │
   │    test_session_expiry)                                         │
   │ 2. Checked callers → Found 3, updated 2 (missed middleware)     │
   │                                                                  │
   │ WHAT FAILED:                                                    │
   │ AssertionError: Expected /login, got /auth/login                │
   │ Root cause: Hardcoded path changed, middleware not updated      │
   │                                                                  │
   │ OPTIONS (ranked):                                                │
   │ 1. [fastest_safe] Fix test path (30s) - incomplete              │
   │ 2. [cleanest] Update middleware (5min) - RECOMMENDED            │
   │ 3. [rollback] Revert refactor (1min) - lose work                │
   │                                                                  │
   │ RECOMMENDED: Option 2 - addresses root cause                    │
   │                                                                  │
   │ BLOCKING: Beads #124, #125                                       │
   │ TIME SPENT: 45 minutes, 3 retries                                │
   │                                                                  │
   │ Respond with: maf-agent-mail reply "approve 2" or "approve 3"   │
   └─────────────────────────────────────────────────────────────────┘
   ```

3. **Human responds with option selection**
   ```bash
   # Approve recommended option
   mcp-agent-mail reply "approve 2"

   # Or approve different option
   mcp-agent-mail reply "approve 3: also add comment about why we're rolling back"

   # Or provide alternative guidance
   mcp-agent-mail reply "try: check if there's a config file for the path"
   ```

4. **Agent applies human decision**
   ```bash
   # Agent parses reply, executes approved option
   # Updates escalation packet with result
   # Marks bead as in-progress again
   ```

5. **Agent marks bead as "waiting-for-guidance"**
   ```bash
   maf/scripts/beads/mark-progress.sh <bead-id> waiting-for-guidance
   ```

6. **Agent waits for human response**
   - Check agent mail every 5 minutes
   - Do not pick up new beads
   - Monitor for human reply

#### Escalation Packet Generation Command

Location: `maf/scripts/escalation/create-packet.py`

```python
#!/usr/bin/env python3
# Generate structured escalation packet

import json
import sys
from datetime import datetime

def create_escalation_packet(bead_id, agent, what_tried, what_failed, options):
    packet = {
        "packet_version": "1.0",
        "bead_id": bead_id,
        "agent": agent,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "what_i_tried": what_tried,
        "what_failed": what_failed,
        "options_ranked": options,
        "recommended_next_action": max(options, key=lambda x: x["rank"])
    }
    return packet

if __name__ == "__main__":
    # Called by agent when escalation needed
    # Outputs JSON packet to .maf/pending-escalations/
    pass
```

#### Step 7: Human Responds to Escalation
1. **Human receives escalation via agent mail**
2. **Human reviews escalation packet**
3. **Human responds with option selection**
   ```bash
   mcp-agent-mail reply "approve 2"
   ```

4. **Agent resumes work**
   - Mark bead as "in-progress" again
   - Apply human decision
   - Continue execution

**Result:** Human intervention is rare AND fast (60 second response possible because packet is structured).

### File Location

`maf/docs/maf-constitution.md`

### Structure

```markdown
# MAF Constitution - Autonomy Contract

**Version:** 1.0
**Last Updated:** 2026-01-08
**MAF Version:** v0.2.x

---

## 1. Agent Autonomy Levels

### Level 1: Full Autopilot (No Human Required)

Agents MAY execute these actions without asking:

**Code Changes:**
- Single-file edits under 50 lines
- Matching existing patterns (no new paradigms)
- Bug fixes with obvious solutions
- Adding docstrings, clarifying comments

**Testing:**
- Running tests
- Reading results
- Fixing straightforward failures
- Adding tests for uncovered edge cases

**Documentation:**
- Improving inline documentation
- Adding examples
- Clarifying ambiguous sections

**Refactoring:**
- Extracting functions (within same file)
- Renaming variables (with scope awareness)
- Simplifying complex logic (preserving behavior)

**Git Operations:**
- Committing with auto-generated messages
- Pushing to feature branches
- Creating pull requests with auto-generated descriptions

**Example:**
```
Agent detects unused import → removes it → runs tests → commits
```

**Validation Required:**
- Must run `maf/scripts/maf/status/check-subtree-health.sh` before commit
- Must run project test suite
- Must verify no linter errors

---

### Level 2: Autopilot with Validation (Ask Only If Validation Fails)

Agents SHOULD execute these but validate first:

**Multi-file Changes:**
- Changes touching 2-3 related files
- Cross-file refactoring
- API modifications

**Process:**
1. Make changes
2. Run all tests
3. Check for breaking changes
4. If validation passes: commit
5. If validation fails: escalate with analysis

**API Changes:**
- Modifying function signatures
- Adding new parameters with defaults
- Deprecating old functions

**Validation:**
- Must check all callers
- Must verify backward compatibility
- Must update documentation

**Config Changes:**
- Updating `.maf/config/` configurations
- Adding new agent mappings
- Modifying session settings

**Validation:**
- Must run health check
- Must verify config schema
- Must test with spawn script

**Dependency Updates:**
- Adding/removing packages
- Updating package versions

**Validation:**
- Must check compatibility matrix
- Must test with all dependent code
- Must verify no breaking changes in dependencies

**Example:**
```
Agent wants to update API signature → checks all callers →
if all clear → proceed; else → escalate with analysis
```

---

### Level 3: Human Approval Required

Agents MUST ask before:

**Architecture Changes:**
- New patterns, frameworks, paradigms
- Changes to system architecture
- Introducing new dependencies that change how system works

**Breaking Changes:**
- Anything that requires franchisee updates
- API changes without backward compatibility
- Database schema changes
- Protocol changes

**Security Changes:**
- Authentication, authorization mechanisms
- Permission models
- Encryption, secrets management
- Security vulnerability handling

**Data Migrations:**
- Database schema changes
- Data format conversions
- Bulk data operations

**Performance Changes:**
- Algorithm changes with complexity implications
- Caching strategies
- Memory optimization (risk of regressions)

**Core MAF Edits:**
- Any changes inside `maf/` subtree
- Override requests (see CORE_OVERRIDE_POLICY.md)

**Example:**
```
Agent identifies need for caching → creates proposal with trade-offs →
asks human → waits for approval → implements if approved
```

**Escalation Format for Level 3:**
```yaml
subject: "[LEVEL 3]: Proposed architecture change"
proposal: |
  Current state: [description]
  Proposed change: [description]
  Benefits: [list]
  Risks: [list]
  Alternatives considered: [list]
  Recommendation: [what agent recommends]
requesting: "approval | guidance | discussion"
```

---

## 2. Error Recovery Protocols

### Recoverable Errors (Agent Handles)

Agent tries command → fails → retries with fallback strategies.

**Retry Strategy:**
```python
max_retries = 3
strategies = [
    "original_command",
    "with_fallback_flags",
    "alternative_approach",
    "escalate"
]

for attempt in range(max_retries):
    try:
        execute_command()
        break
    except Error as e:
        if attempt < max_retries - 1:
            apply_retry_strategy(attempt)
        else:
            escalate_with_full_context(e)
```

**Examples:**
- `npm install` fails → retry with `--legacy-peer-deps`
- Git push fails → retry after `git pull --rebase`
- Test fails → retry once (flaky test check)

**Agents MAY retry up to 3 times with different strategies before escalating.**

---

### Partial Failures (Agent Documents + Continues)

Some tests fail → agent documents → continues with passing tests.

**Thresholds:**
- Test failure rate < 20%: Document and continue
- Test failure rate ≥ 20%: Escalate immediately

**Process:**
```bash
run_tests()

if test_failure_rate < 20%:
    document_failures_in_ISSUES.md()
    mark_current_bead("partial-blocker")
    continue_with_other_beads()
else:
    escalate_immediately("High test failure rate")
```

**Documentation Format:**
```markdown
## Test Failures - [Date]

### Failing Tests
- `test_user_auth()` - Assertion error on line 45
- `test_api_timeout()` - Timeout after 30s

### Analysis
- These failures appear to be related to [analysis]
- Suggested fix: [description]

### Status
Documented by: [agent_id]
Date: [timestamp]
Requires: human review
```

---

### Complete Failures (Agent Escalates Immediately)

Build won't run at all → agent stops → escalates.

**Complete Failure Indicators:**
- Build exits with error before running tests
- Syntax errors in all files
- Missing dependencies that can't be auto-installed
- Configuration errors preventing startup

**Escalation Process:**
```bash
if build_status == "total-failure":
    send_agent_mail(
        subject="BLOCKER: Build failure",
        severity="critical",
        context={
            "error_output": full_error_log,
            "what_i_was_doing": current_bead_description,
            "what_i_tried": attempted_fixes,
            "suggested_actions": [
                "Option 1: [fix description]",
                "Option 2: [fix description]"
            ]
        }
    )
    mark_current_bead("blocked")
    wait_for_human_response()
```

---

## 3. Coordination Rules (Agent Mail + Beads)

### Agent Mail Etiquette

**On Starting Work:**
```yaml
check_agent_mail()
if assigned_bead:
    claim_it()
if conflicts:
    negotiate_with_other_agents()
```

**On Completing Work:**
```yaml
mark_bead_complete()
notify_dependent_beads()
send_completion_summary(
    subject: "Completed bead #ID",
    content: {
        "what_was_done": summary,
        "files_changed": list,
        "tests_passed": boolean,
        "notes": any_issues
    }
)
```

**On Blocking Issue:**
```yaml
escalate_immediately(
    subject: "BLOCKED: bead #ID",
    severity: "critical",
    context: full_error_details
)
don't_block_other_agents()
suggest_alternative_paths()
```

**Communication Frequency:**
- Check agent mail: Every 5 minutes
- Send progress updates: Every 30 minutes for long-running tasks
- Respond to escalations: Within 5 minutes

---

### Bead Workflow

**Picking Up Bead:**
```yaml
use bv to find next optimal bead
check_dependencies_are_satisfied()
mark_as "in-progress"
announce_via_agent_mail(
    subject: "Starting bead #ID",
    content: {bead_summary}
)
```

**Working On Bead:**
```yaml
if takes_longer_than_expected:
    send_progress_update(
        subject: "Progress: bead #ID",
        content: {
            "started": timestamp,
            "completed_steps": list,
            "remaining_steps": list,
            "estimated_completion": time
        }
    )

if discovering_complexity:
    break_into_sub_beads()
    update_bead_structure()

if stuck:
    escalate(don't_spin)
    mark_bead("waiting-for-guidance")
```

**Completing Bead:**
```yaml
run_validation_tests()
if all_pass:
    mark_as "complete"
    notify_dependent_beads()
else:
    fix_or_escalate()
```

---

## 4. Quality Gates (Cannot Skip)

### Before Any Commit

**Agent MUST run:**
```bash
# 1. Subtree health check
maf/scripts/maf/status/check-subtree-health.sh

# 2. Project tests
npm test  # or project equivalent

# 3. Linter (if configured)
npm run lint  # or project equivalent

# 4. Git checks
git diff --check  # whitespace issues
```

**If any fail:**
```bash
fix_or_escalate()
never_commit_broken()
```

**No Exceptions.**
- Even "obvious" fixes must pass tests
- Even "documentation only" changes must pass whitespace checks
- If tests are broken, fix tests first or escalate explaining why

---

### Before Marking Bead Complete

**Agent MUST:**
```bash
1. re_read_code_with_fresh_eyes()
   - Read code as if someone else wrote it
   - Look for obvious bugs, typos, logic errors

2. check_for_obvious_bugs()
   - Off-by-one errors
   - Missing null checks
   - Unhandled edge cases
   - Wrong conditionals

3. verify_requirements_met()
   - Read bead description again
   - Verify every requirement addressed
   - No "close enough" - all or nothing

4. if_complex:
    request_peer_review_via_agent_mail()
```

---

## 5. Escalation Triggers (When to Ask Humans)

**Agents MUST escalate when:**

**Unclear Requirements:**
- Bead description is ambiguous
- Conflicting information in docs vs code
- Multiple valid interpretations exist

**Conflicting Information:**
- Documentation doesn't match code behavior
- Two docs say different things
- Implementation doesn't match spec

**Security Implications:**
- Potential vulnerability discovered
- Permission issue unclear
- Data handling seems wrong

**Performance Issues:**
- Code will be slow at scale
- Memory usage seems excessive
- Algorithm choice questionable

**Breaking Changes:**
- API change affects other code
- Database migration needed
- Configuration format change

**Access Issues:**
- Need access to protected resources
- Need secrets/credentials
- Need production system access

**Repeated Failures:**
- 3rd escalation attempt on same issue
- Same error keeps occurring
- Workaround not working

---

### Escalation Format

```yaml
subject: "[LEVEL]: Brief one-line description"
severity: info | warning | critical
agent_id: "agent-identifier"
bead_id: "bead-number-if-applicable"

context:
  what_i_was_doing: "Description of current work"
  what_i_tried: ["Attempt 1", "Attempt 2", "Attempt 3"]
  error_output: "Full error messages, logs"
  environment: {
    "project": "project-name",
    "branch": "git-branch",
    "maf_version": "v0.2.x"
  }

suggested_actions: [
  "Option 1: Description of first approach",
  "Option 2: Description of alternative approach"
]

requesting: "approval | guidance | unblocking | information"

urgency: "immediate | soon | when-convenient"
```

---

## 6. Agent Rights (What Agents Can Assume)

**Agents MAY assume:**

✅ **Access to Project Files**
- Read/write access to project code
- Ability to run scripts and tests
- Access to documentation

✅ **Working Tooling**
- Agent mail is running and monitored
- Beads database is accurate
- AGENTS.md is current source of truth
- Git is working

✅ **Environment Context** (NEW)
- `.maf/context.sh` exists and can be sourced
- `$PROJECT_ROOT` is set correctly (git repository root)
- `$MAF_LAYOUT` is one of: `hq`, `franchisee`, or `legacy`
- `$MAF_SUBTREE_PREFIX` is set (empty string for HQ, `maf` for franchisee)
- Script paths resolve correctly for detected layout
- Setup wizard has validated the environment

✅ **Human Response**
- Humans will respond to escalations within SLA
- Critical: 15 minutes
- Warning: 1 hour
- Info: Next business day

✅ **Clear Requirements**
- Bead descriptions are complete
- If unclear, escalation is appropriate

---

**Agents MUST NOT assume:**

❌ **Production Access**
- No access to production servers
- No ability to deploy to production
- No access to production data

❌ **Secrets Access**
- No access to credentials without justification
- No ability to modify secrets
- No ability to generate new secrets

❌ **Other Agents**
- Other agents are working correctly
- Other agents will respond instantly
- Other agents won't have conflicts

❌ **Infrastructure**
- Network is stable
- Services are up
- Git operations will succeed

❌ **Environment Structure** (NEW)
- Scripts are at `scripts/maf/` relative to project root
- Vendor directory is at a specific path
- Repository has a specific directory layout
- Relative paths from scripts to root will work
- They are running in MAF HQ vs franchisee context (must detect first)

❌ **Code Quality**
- Existing code is correct
- Tests are comprehensive
- Documentation is accurate

---

## 7. Success Criteria for Autonomous Operation

**A franchise is "autonomous-ready" when:**

✅ **Governance In Place**
- MAF_CONSTITUTION.md exists and is followed
- MAF_ASSUMPTIONS.md documents cognitive model
- CORE_OVERRIDE_POLICY.md defines override process

✅ **Configuration Complete**
- AGENTS.md customized and committed
- agent-topology.json validated
- Setup wizard completed successfully

✅ **Tooling Working**
- Agent mail flowing between all agents
- Beads workflow tested and working
- Health checks passing

✅ **Agents Autonomous**
- At least one full autonomous cycle completed
- Agents successfully escalated when needed
- Humans responded to escalations

✅ **Quality Verified**
- All tests passing
- No known blockers
- Documentation current

---

## Appendix: Quick Reference for Agents

```bash
# Can I do this autonomously?
is_single_file_change && < 50 lines && matches_pattern → YES (Level 1)
is_multi_file && < 3 files && related → YES (Level 2, with validation)
touches_architecture → NO (Level 3, ask human)

# What do I do on error?
retriable_error → retry_up_to_3_times
partial_failure → document_and_continue
total_failure → escalate_immediately

# How do I coordinate?
always_check_agent_mail()
announce_work_via_agent_mail()
respect_bead_dependencies()

# Quality gates
before_commit → run_tests + health_check
before_complete → fresh_eyes_review
```

---

**This constitution is the foundation of autonomous MAF operation.**
**All agents MUST read and follow it.**
**Humans MAY update it via pull request to MAF HQ.**
```

---

## Section 3: AGENTS.md - The Agent Behavior Contract

### Purpose

The single source of truth for how agents behave in MAF-powered repos. Every agent reads this on startup and follows it as law.

### File Location (Template)

`maf/templates/AGENTS.md.template`

### File Location (Generated)

`AGENTS.md` (in project root, generated from template)

### Key Insight from Swarm-Agents

The AGENTS.md file is what makes agents **fungible and replaceable**. Any agent can boot up, read AGENTS.md, and immediately know how to be useful.

### Complete Template

See Appendix A: AGENTS.md Template (below)

### Template Sections

1. **Quick Start** - Read this first, tells agent what to do
2. **The MAF Stack** - Tools available (agent mail, beads, role spawning)
3. **Environment Context** - Where am I running? (NEW)
4. **Your Workflow** - Step-by-step daily workflow
5. **Code Quality Standards** - Before committing, fresh eyes review
6. **Project-Specific Rules** - Customized per franchise
7. **Escalation Contacts** - Who to contact when
8. **Forbidden Actions** - Never do these
9. **Success Indicators** - How to know you're doing well
10. **Quick Reference** - Common commands

### Environment Context Section (NEW)

Agents MUST understand their runtime environment before taking any action. The AGENTS.md template includes a dedicated section that specifies:

#### What Agents MAY Assume About Environment

- `.maf/context.sh` exists and can be sourced for environment variables
- `$PROJECT_ROOT` points to git repository root (detected via `git rev-parse --show-toplevel`)
- `$MAF_LAYOUT` is one of: `hq`, `franchisee`, or `legacy`
- `$MAF_SUBTREE_PREFIX` is set (empty string for HQ, `maf` for franchisee)
- MAF scripts are at: `$MAF_SUBTREE_PREFIX/scripts/maf/` (if subtree exists)
- Vendor directories are at: `$MAF_SUBTREE_PREFIX/vendor/` (if configured)

#### What Agents MUST NOT Assume About Environment

- Hardcoded paths like `../` or `./` will work
- MAF is always at a specific location relative to current directory
- Current working directory is predictable when agents start
- Single-environment deployment (HQ scripts work in franchisee repos)

#### Environment Detection in AGENTS.md Template

```markdown
## Environment Context

You are running in: __MAF_LAYOUT__

Key paths (use these in all operations):
- Project root: $PROJECT_ROOT
- MAF prefix: __MAF_SUBTREE_PREFIX__
- MAF scripts: __MAF_SUBTREE_PREFIX__/scripts/maf/
- Vendor directory: __MAF_SUBTREE_PREFIX__/vendor/

Always source context before operations:
\`\`\`bash
source .maf/context.sh || true
\`\`\`
```

#### Setup Wizard Substitutions

The setup wizard replaces these placeholders:
- `__MAF_LAYOUT__` → Detected layout (`hq` or `franchisee`)
- `__MAF_SUBTREE_PREFIX__` → Detected prefix (empty or `maf`)
- `__PROJECT_ROOT__` → Git repository root

### Customization Process

**Setup wizard replaces placeholders:**
- `__PROJECT_NAME__` → Actual project name
- `__SESSION_NAME__` → Actual session name
- `__SUPERVISOR__` → Supervisor agent name
- `__REVIEWER__` → Reviewer agent name
- `__IMP1__` → Implementor 1 agent name
- `__IMP2__` → Implementor 2 agent name

---

## Section 4: Interactive Setup Wizard

### Overview: MAF Control Console (NEW)

**Purpose:** Single blessed entry point for all MAF operations. Prevents "one-off manual fixes" in franchise model.

**Four Modes:** Same script (`maf/scripts/setup/setup-maf.sh`), different UX based on mode selection.

```
┌─────────────────────────────────────────────────────────────────┐
│           MAF Control Console v1.0.0                             │
│           Multi-Agent Framework Setup                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select mode:                                                    │
│                                                                  │
│  1) 🔧 Install      Set up MAF in a new repo                     │
│  2) 🔄 Update       Update MAF config after subtree pull         │
│  3) 🩺 Doctor       Diagnose and fix common drift issues         │
│  4) 💣 Reset        Nuke and rebuild config safely               │
│                                                                  │
│  Choose [1-4]: _                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Mode 1: Install (New Repo)

**When to use:** First-time MAF setup in a new project.

**What it does:**
- Creates `.maf/config/` directory structure
- Generates agent topology from template
- Creates AGENTS.md with project-specific values
- Initializes agent mail
- Initializes beads database
- Spawns agents (optional)

**Workflow:** (See "First-Time Setup" below)

### Purpose

A "5 minutes, works first time" setup experience that:
- Enforces governance rules
- Creates proper configuration from templates
- Prevents mistakes (no Roundtable defaults!)
- Validates everything before completion

### Problems Being Solved

From the Nextnest integration failure:
1. ❌ Two topology files existed (confusion)
2. ❌ Setup script wasn't run (no validation gate)
3. ❌ Roundtable defaults leaked in (identity confusion)
4. ❌ No "reset & reconfigure" workflow

### User Workflow: First-Time Setup (Mode 1)

#### Prerequisites
1. MAF subtree added to project:
   ```bash
   git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
   ```
2. Project has package.json, Cargo.toml, or pyproject.toml
3. Bash shell available (for setup script)

#### Step 1: Launch Setup Wizard
```bash
cd /path/to/project
bash maf/scripts/setup/setup-maf.sh
```

#### Step 2: Environment Detection (Context-Awareness)

Wizard performs automatic detection:

```bash
# Detect repository layout
if [[ -d "maf/scripts/maf" ]]; then
    MAF_LAYOUT="franchisee"
    MAF_SUBTREE_PREFIX="maf"
    echo "✓ Detected: Franchisee with MAF subtree"
elif [[ -d "scripts/maf" ]] && [[ ! -d "maf" ]]; then
    MAF_LAYOUT="hq"
    MAF_SUBTREE_PREFIX=""
    echo "✓ Detected: MAF HQ repository"
elif [[ -d "mcp_agent_mail" ]]; then
    MAF_LAYOUT="legacy"
    MAF_SUBTREE_PREFIX=""
    echo "⚠ Warning: Legacy layout detected (migration recommended)"
else
    echo "✗ Error: Unable to detect MAF installation"
    exit 1
fi

# Generate context file
cat > .maf/context.sh << EOF
export MAF_LAYOUT="$MAF_LAYOUT"
export MAF_SUBTREE_PREFIX="$MAF_SUBTREE_PREFIX"
export PROJECT_ROOT="$(git rev-parse --show-toplevel)"
EOF
```

**Validates:**
- Git repository detected
- Directory structure is valid
- Can write to `.maf/` directory

#### Step 3: Answer Interactive Prompts
Wizard will prompt for:
1. **Project name** (auto-detected from package.json)
2. **Session name** (default: maf-<project-name>)
3. **Agent names** (default: Supervisor, Reviewer, Imp-1, Imp-2)
4. **Escalation contact** (email or Slack handle)

#### Step 4: Review Generated Configuration
Wizard displays:
- Agent topology JSON
- AGENTS.md preview
- Configuration file paths

#### Step 5: Validate Configuration
Wizard runs:
- Environment validation (context file created, paths resolve)
- JSON schema validation
- Required fields check
- Session name uniqueness check
- Subtree health check
- Script path resolution tests

#### Step 6: Bootstrap Agent Mail & Beads
Wizard prompts:
- "Initialize agent mail? [Y/n]"
- "Initialize beads database? [Y/n]"

#### Step 7: Spawn Agents (Optional)
Wizard offers:
- "Spawn MAF agents now? [Y/n]"
If yes: Runs `maf/scripts/maf/spawn-agents.sh`

#### Step 8: Confirmation
Wizard displays:
- ✅ Setup complete!
- 📋 Next steps: 1) Review AGENTS.md, 2) Start agents, 3) Create beads
- 📖 Documentation: maf/docs/AUTONOMY_GUIDE.md

### User Workflow: Update Existing Configuration

### Mode 2: Update (Schema/Version Changes)

**When to use:** After subtree pull (MAF version updated), after manual config changes, when troubleshooting.

**What it does:**
- Detects config version mismatch
- Merges new schema fields with existing config
- Preserves agent names and customizations
- Validates merged configuration
- Offers to restart agents with new config

**Workflow:** (See "Update Existing Configuration" below)

#### When to Run Update Mode
- After subtree pull (MAF version updated)
- After manual config changes
- When troubleshooting issues

#### Step 1: Launch Update Mode
```bash
bash maf/scripts/setup/setup-maf.sh
# Choose: Mode 2 (Update)
```

#### Step 2: Review Current Configuration
Wizard displays:
- Current session name
- Current agent names
- Current configuration version

#### Step 3: Apply Updates
Wizard:
- Preserves agent names
- Updates configuration schema
- Merges new fields with existing
- Validates merged configuration

#### Step 4: Confirm Update
Wizard prompts:
- "Update complete. Review changes? [Y/n]"
- "Restart agents with new config? [Y/n]"
- "Spawn agents now? [Y/n]"

### Mode 3: Doctor (Diagnose + Fix Drift) (NEW)

**When to use:** Agents not working, configuration issues, unknown problems.

**What it does:**
- Runs diagnostic suite on MAF installation
- Detects common drift issues
- Offers auto-fix for detected problems
- Validates fix was successful

**Diagnostic Checks:**

```bash
# 1. Session name health
check_session_name() {
    local configured=$(jq -r '.session_name' .maf/config/agent-topology.json)
    local running=$(tmux list-sessions 2>/dev/null | grep "maf-" | awk '{print $1}' | sed 's/:$//')

    if [[ "$configured" != "$running" ]]; then
        echo "❌ Session name drift detected"
        echo "   Configured: $configured"
        echo "   Running: $running"
        return 1
    fi

    echo "✓ Session name matches"
    return 0
}

# 2. Agent mail health
check_agent_mail() {
    if ! mcp-agent-mail health-check; then
        echo "❌ Agent mail not responding"
        echo "   Fix: Restart agent mail service"
        return 1
    fi

    echo "✓ Agent mail healthy"
    return 0
}

# 3. Beads integration
check_beads() {
    if ! command -v bead &>/dev/null; then
        echo "❌ Beads CLI not installed"
        echo "   Fix: Install beads_viewer"
        return 1
    fi

    if ! bead list &>/dev/null; then
        echo "❌ Beads database not initialized"
        echo "   Fix: Run 'bead init'"
        return 1
    fi

    echo "✓ Beads integration healthy"
    return 0
}

# 4. Tmux session health
check_tmux_sessions() {
    local expected_agents=$(jq -r '.agents | length' .maf/config/agent-topology.json)
    local running_agents=$(tmux list-sessions 2>/dev/null | grep "maf-" | wc -l)

    if [[ "$running_agents" -lt "$expected_agents" ]]; then
        echo "❌ Agent count mismatch"
        echo "   Expected: $expected_agents"
        echo "   Running: $running_agents"
        echo "   Fix: Spawn missing agents"
        return 1
    fi

    echo "✓ All agents running"
    return 0
}

# 5. Subtree health
check_subtree_health() {
    if ! maf/scripts/health/check-subtree.sh &>/dev/null; then
        echo "❌ Subtree health check failed"
        echo "   Fix: Run subtree sync or resolve conflicts"
        return 1
    fi

    echo "✓ Subtree healthy"
    return 0
}

# 6. Configuration validity
check_config_validity() {
    if ! jq empty .maf/config/agent-topology.json 2>/dev/null; then
        echo "❌ Invalid JSON in config"
        echo "   Fix: Re-run setup wizard"
        return 1
    fi

    echo "✓ Configuration valid"
    return 0
}
```

**Doctor Mode Workflow:**

```bash
$ bash maf/scripts/setup/setup-maf.sh
# Choose: Mode 3 (Doctor)

🩺 MAF Doctor - Diagnosing installation...

Running 6 diagnostic checks:

  [1/6] Session name health...
  ✗ Session name drift detected
     Configured: maf-myproject
     Running: maf-roundtable
     → [Auto-fix available]

  [2/6] Agent mail health...
  ✓ Agent mail healthy

  [3/6] Beads integration...
  ✗ Beads database not initialized
     → [Auto-fix available]

  [4/6] Tmux session health...
  ✗ Agent count mismatch
     Expected: 4
     Running: 2
     → [Auto-fix available]

  [5/6] Subtree health...
  ✓ Subtree healthy

  [6/6] Configuration validity...
  ✓ Configuration valid

Diagnostic Summary:
  ✅ Passed: 3/6 checks
  ❌ Failed: 3/6 checks

Issues found:
  1. Session name drift (configured ≠ running)
  2. Beads database not initialized
  3. Missing agents (2 not running)

Fix all issues automatically? [Y/n]: y

Applying fixes...
  ✓ Killing old tmux session: maf-roundtable
  ✓ Starting new session: maf-myproject
  ✓ Initializing beads database
  ✓ Spawning missing agents (imp-1, imp-2)

Re-running diagnostics...
  [1/6] ✓ Session name matches
  [2/6] ✓ Agent mail healthy
  [3/6] ✓ Beads integration healthy
  [4/6] ✓ All agents running
  [5/6] ✓ Subtree healthy
  [6/6] ✓ Configuration valid

✅ All checks passed! MAF installation is healthy.
```

### User Workflow: Reset & Reconfigure (Mode 4)

#### When to Run Reset Mode
- Configuration is corrupted
- Want to start fresh
- Changing fundamental setup

#### Step 1: Launch Reset Mode
```bash
bash maf/scripts/setup/setup-maf.sh --reset
```

#### Step 2: Confirm Reset
Wizard warns:
- "⚠️  This will back up and remove .maf/"
- "⚠️  Running agents will be stopped!"
- "Continue? [y/N]"

#### Step 3: Backup & Remove
Wizard:
- Stops running tmux session
- Creates backup: .maf.backup.YYYYMMDD_HHMMSS
- Removes .maf/ directory

#### Step 4: Re-run Setup
Wizard restarts from Step 1 of first-time setup

### File Location

`maf/scripts/setup/setup-maf.sh`

### Complete Script

See Appendix B: Setup Wizard Script (below)

### Wizard Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Interactive prompts** | Guides through all config options | Prevents mistakes |
| **Auto-detection** | Detects project name, existing setup | Faster setup |
| **Validation gates** | Checks JSON, required fields, subtree health | Fails fast |
| **Backup before reset** | Preserves existing config when re-running | Safe reconfiguration |
| **Generic defaults** | Uses project-specific names, not Roundtable's | Prevents identity bleed |
| **Session uniqueness check** | Warns if using default session | Avoids conflicts |
| **Commit integration** | Offers to commit config after setup | Git hygiene |
| **Health checks** | Runs subtree health check before completing | Catches issues early |

### Usage Examples

**New Project Setup:**
```bash
$ cd my-new-project
$ git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
$ bash maf/scripts/setup/setup-maf.sh

╔════════════════════════════════════════════════════════════╗
║        MAF Setup Wizard - Franchise Configuration       ║
╚════════════════════════════════════════════════════════════╝

PHASE 1: Configuration

Project name [my-new-project]:
Session name [maf-my-new-project]:

[... continues through all phases ...]

✓ Setup Complete!
```

**Reset & Reconfigure:**
```bash
$ bash maf/scripts/setup/setup-maf.sh --reset

⚠️  This will back up and remove .maf/
Continue? [y/N]: y

[... runs reset, then restarts wizard ...]
```

---

## Section 5: Implementation Plan

### File Structure After Implementation

```
maf-github/                          # MAF HQ (Franchisor)
├── docs/
│   ├── maf-constitution.md          # NEW: Autonomy contract
│   ├── governance/
│   │   ├── MAF_ASSUMPTIONS.md       # NEW: Cognitive assumptions
│   │   ├── CORE_OVERRIDE_POLICY.md  # NEW: Override rules
│   │   └── VERSIONING_GUIDE.md      # NEW: Semantic versioning
│   ├── runbooks/
│   │   ├── CONSUMER_UPGRADE.md      # ✅ Already exists
│   │   ├── TROUBLESHOOTING.md       # ✅ Already exists
│   │   ├── README.md                # ✅ Already exists
│   │   └── AUTONOMY_GUIDE.md        # NEW: How autonomy works
│   └── plans/
│       └── 2026-01-08-autonomous-maf-foundations.md  # THIS FILE
│
├── templates/
│   ├── AGENTS.md.template           # NEW: Agent behavior contract
│   ├── agent-topology.json.example  # ✅ Already exists
│   └── prompts/                     # ✅ Already exists
│
└── scripts/
    ├── setup/
    │   ├── setup-maf.sh             # NEW: Interactive wizard
    │   ├── validate-config.sh       # NEW: Config validation
    │   └── reset-maf.sh             # NEW: Reset & reconfigure
    ├── beads/                       # NEW: Beads integration
    │   ├── find-next-bead.sh
    │   ├── check-dependencies.sh
    │   ├── mark-progress.sh
    │   └── notify-dependents.sh
    └── maf/
        └── lib/
            └── role-based-spawn.sh  # ✅ Already exists

consumer-repo/                       # Franchisee (e.g., Roundtable)
├── AGENTS.md                        # NEW: Generated from template
├── .maf/
│   ├── config/
│   │   └── agent-topology.json     # Generated by wizard
│   ├── SETUP_COMPLETE              # Created by wizard
│   └── overrides/                  # Local customizations
│       ├── agents/
│       ├── scripts/
│       └── prompts/
└── maf/                            # Subtree (read-only)
    └── [all MAF core files]
```

---

### Context-Awareness Requirements (NEW)

**Critical Lesson from Subtree Integration PR Fixes:**

All scripts and tools MUST work in multiple environments:
- **MAF HQ**: No `maf/` prefix, scripts at `scripts/maf/`
- **Franchisee**: Has `maf/` prefix, scripts at `maf/scripts/maf/`
- **Legacy**: Old directory structures, backward compatibility needed

#### Implementation Requirements for All Phases

**1. Path Detection Strategy**

```bash
# NEVER use relative paths like these:
PROJECT_ROOT="$(cd "../.." && pwd)"  # ❌ WRONG

# ALWAYS use git-based detection:
PROJECT_ROOT="$(git rev-parse --show-toplevel)"  # ✅ RIGHT

# Detect MAF layout
if [[ -d "$PROJECT_ROOT/maf/scripts/maf" ]]; then
    MAF_LAYOUT="franchisee"
    MAF_SUBTREE_PREFIX="maf"
elif [[ -d "$PROJECT_ROOT/scripts/maf" ]] && [[ ! -d "$PROJECT_ROOT/maf" ]]; then
    MAF_LAYOUT="hq"
    MAF_SUBTREE_PREFIX=""
else
    MAF_LAYOUT="legacy"
    MAF_SUBTREE_PREFIX=""  # Fallback detection
fi
```

**2. Context File Standard**

Every script MUST source `.maf/context.sh` (created by setup wizard):

```bash
# At the top of every MAF script:
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f ".maf/context.sh" ]]; then
    source .maf/context.sh
else
    # Fallback detection if context doesn't exist
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
    MAF_SUBTREE_PREFIX=""
    [[ -d "$PROJECT_ROOT/maf/scripts/maf" ]] && MAF_SUBTREE_PREFIX="maf"
fi
```

**3. Template Placeholder Requirements**

Add these placeholders to all templates:
- `__MAF_LAYOUT__` - Detected layout (hq/franchisee/legacy)
- `__MAF_SUBTREE_PREFIX__` - Path prefix (empty or "maf")
- `__PROJECT_ROOT__` - Git repository root

**4. Cross-Plan Dependency Validation**

Before implementing any task:
1. Check if task depends on other plans
2. Verify those plans are complete
3. Validate referenced files still exist
4. Example: `generate-manifest.sh` referenced `sp-brainstorming` skills that were removed in another plan

#### Per-Phase Context Requirements

- **Phase 1**: Constitution and governance docs must specify environment assumptions
- **Phase 2**: AGENTS.md template must include Environment Context section
- **Phase 3**: Setup wizard must detect and generate `.maf/context.sh`
- **Phase 4**: Tests must run in both HQ and franchisee contexts
- **Phase 5**: Documentation must include context-awareness examples
- **Phase 6**: Beads scripts must use `$MAF_SUBTREE_PREFIX` for all paths

---

## Two-Agent Model Clarification

### The Confusion

The original discussion mentioned agents being "fungible and replaceable," but MAF has fixed roles (1 supervisor, 2 implementors, 1 reviewer). How do these reconcile?

### The Solution: Two Coexisting Models

**Model 1: MAF Static Roles (The "Core Team")**
```
tmux session "maf-cli" (or "maf-nn", "maf-hq")
├── Pane 0: Supervisor (always oversees, makes architecture decisions)
├── Pane 1: Reviewer (always reviews, quality checks)
├── Pane 2: Implementor-1 (implementation work)
└── Pane 3: Implementor-2 (implementation work)
```

**Characteristics:**
- Fixed: 4 agents, always running
- Role-based: Each has a specific role
- tmux-based: Visual, can see them working
- **These are your "franchise staff"**

**Model 2: Beads "Fungible" Agents (The "Dynamic Workforce")**
```
Any number of agents can boot up:
- Claude Code session → registers with agent mail → picks up beads
- Codex session → registers with agent mail → picks up beads
- Gemini session → registers with agent mail → picks up beads
```

**Characteristics:**
- Dynamic: Spin up/down as needed
- Fungible: Any agent can pick up any bead
- agent-mail-based: Coordination without visual interface
- **These are your "contractors" for scaling work**

### How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    MAF Static Team (Always Running)         │
│                                                              │
│  Supervisor ──────┐                                         │
│  Reviewer   ──────┼─── Use beads to distribute work ────────┼──┐
│  Imp-1      ──────┤                                         │  │
│  Imp-2      ──────┘                                         │  │
└─────────────────────────────────────────────────────────────┘  │
        │                                                       │
        │ Agent Mail (coordination layer)                     │
        │                                                       │
        └───────────────────┬─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │     Beads Database       │
              │  (Tasks + Dependencies)  │
              └─────────────────────────┘
                            ▲
                            │
        ┌───────────────────┴─────────────────────────────────┐
        │                  Dynamic Agents                     │
        │  (Spin up for complex tasks, parallel work)          │
        │                                                       │
        │  Claude-1 ──→ picks up bead #42                     │
        │  Codex-1   ──→ picks up bead #43                     │
        │  Gemini-1 ──→ picks up bead #44                     │
        └───────────────────────────────────────────────────────┘
```

### Practical Examples

**Scenario 1: Normal Operation (Static Team Only)**
```bash
# The 4 MAF agents are running in tmux
# They coordinate via agent mail internally

Supervisor: "I found bead #50 (refactor user service)"
Supervisor → agent mail: "Claiming bead #50"
Reviewer: "I'll review it when you're done"
Imp-1: "I'll help with the database migration part"
Imp-2: "I'll update the API client"

# All 4 work together via beads, no extra agents needed
```

**Scenario 2: Complex Task (Static + Dynamic)**
```bash
# Large feature: 20 beads, needs parallel work

Supervisor: "This is too much for 4 agents"
Supervisor → agent mail: "Need more workers for epic #100"

# Human spins up 3 more agents:
# New terminal 1: claude-code → registers as "claude-worker-1"
# New terminal 2: codex → registers as "codex-worker-1"
# New terminal 3: claude-code → registers as "claude-worker-2"

# Now 7 agents working together via beads
# All fungible, all coordinating via agent mail
```

### Risk Mitigation

**⚠️ Risk 1: Identity Confusion**
- **Problem:** If agents are fungible, how do we know who did what?
- **Solution:**
  - Every agent must register with agent mail (gets unique ID)
  - Bead tracks which agent claimed it
  - Git commits reference agent ID

**⚠️ Risk 2: Too Many Agents**
- **Problem:** 10 agents picking same bead, causing conflicts
- **Solution:**
  - bv locks beads when claimed
  - Agent mail announcements prevent double-booking
  - If bead already "in-progress", bv won't reassign

**⚠️ Risk 3: MAF Roles Become Meaningless**
- **Problem:** If everyone is fungible, why have roles?
- **Solution:**
  - **MAF roles are "architectural"** (supervisor oversees everything)
  - **Fungible agents are "tactical"** (execute specific beads)
  - Supervisor can assign beads to specific agents if needed

---

## beads_viewer Integration

### What beads_viewer Does

```bash
bv --robot-find-next        # PageRank-based triage
bv --robot-blockers         # Dependency analysis
bv --robot-dependencies     # What's blocking what
bv --graph                  # Visual bead graph
```

### How It Helps Autonomous Agents

1. **Smart Triage:** Instead of random task selection, agents pick the most impactful bead
2. **Dependency Awareness:** Agents know what's blocked, what's ready
3. **Parallelization:** Multiple agents can work on non-dependent beads
4. **Progress Tracking:** Real-time view of what's done, what's pending

### Integration Approach

```bash
# MAF scripts should wrap bv commands

maf/scripts/beads/find-next-bead.sh
  → Calls bv with MAF-specific filters
  → Returns bead ID that this agent should work on

maf/scripts/beads/check-dependencies.sh
  → Calls bv --robot-dependencies
  → Returns JSON of what's blocking

maf/scripts/beads/mark-progress.sh
  → Marks bead status
  → Notifies dependent beads
```

### Files to Create

**maf/scripts/beads/find-next-bead.sh**
```bash
#!/usr/bin/env bash
# Find the next optimal bead for this agent to work on

# Get agent's role from tmux pane or agent mail
AGENT_ROLE="${1:-}"
AGENT_ID="${2:-}"

# Use beads_viewer to find next bead
bead_id=$(bv --robot-find-next --role="$AGENT_ROLE" --agent="$AGENT_ID")

if [[ -n "$bead_id" ]]; then
    echo "$bead_id"
else
    echo "No available beads" >&2
    exit 1
fi
```

**maf/scripts/beads/check-dependencies.sh**
```bash
#!/usr/bin/env bash
# Check what's blocking a bead

bead_id="$1"

if [[ -z "$bead_id" ]]; then
    echo "Usage: $0 <bead-id>" >&2
    exit 1
fi

# Use beads_viewer to check dependencies
bv --robot-dependencies --id="$bead_id"
```

**maf/scripts/beads/mark-progress.sh**
```bash
#!/usr/bin/env bash
# Mark bead progress and notify dependents
#
# NEW: Requires Definition of Done (DoD) + Evidence for completion

bead_id="$1"
status="$2"  # in-progress | complete | blocked
evidence_or_action="${3:-}"

if [[ -z "$bead_id" ]] || [[ -z "$status" ]]; then
    echo "Usage: $0 <bead-id> <status> [evidence|action]" >&2
    exit 1
fi

# Check if bead has Definition of Done
check_dod() {
    local bead_id="$1"
    local dod=$(bead show --id="$bead_id" --json | jq -r '.dod // empty')

    if [[ -z "$dod" ]]; then
        echo "❌ Error: Bead #$bead_id has no Definition of Done (DoD)" >&2
        echo "   Before marking complete, add DoD using:" >&2
        echo "   bead edit --id=$bead_id --dod='tests pass, docs updated, PR created'" >&2
        return 1
    fi

    echo "✓ DoD defined: $dod"
    return 0
}

# Validate evidence format
validate_evidence() {
    local evidence="$1"
    local bead_id="$2"

    # Evidence must be linkable artifact
    # Valid formats:
    #   - commit:abc123def         (git commit hash)
    #   - pr:https://github.com/... (pull request URL)
    #   - file:/path/to/file       (generated file)
    #   - test:passed              (test results)
    #   - log:snippet              (log output)

    if [[ -z "$evidence" ]]; then
        echo "❌ Error: Evidence required to mark bead as complete" >&2
        echo "   Valid evidence formats:" >&2
        echo "     commit:abc123def          (git commit hash)" >&2
        echo "     pr:https://github.com/... (pull request URL)" >&2
        echo "     file:/path/to/file        (generated file)" >&2
        echo "     test:passed              (test results)" >&2
        echo "     log:snippet              (log output)" >&2
        return 1
    fi

    local evidence_type=$(echo "$evidence" | cut -d: -f1)
    local evidence_value=$(echo "$evidence" | cut -d: -f2-)

    case "$evidence_type" in
        commit)
            if ! git rev-parse --verify "$evidence_value" &>/dev/null; then
                echo "❌ Error: Invalid commit hash: $evidence_value" >&2
                return 1
            fi
            ;;
        pr)
            if [[ ! "$evidence_value" =~ ^https://github\.com/ ]]; then
                echo "❌ Error: Invalid PR URL: $evidence_value" >&2
                return 1
            fi
            ;;
        file)
            if [[ ! -e "$evidence_value" ]]; then
                echo "❌ Error: File does not exist: $evidence_value" >&2
                return 1
            fi
            ;;
        test)
            if [[ "$evidence_value" != "passed" ]]; then
                echo "❌ Error: Tests must pass to mark complete" >&2
                return 1
            fi
            ;;
        log)
            # Log snippets are accepted as-is
            ;;
        *)
            echo "❌ Error: Unknown evidence type: $evidence_type" >&2
            return 1
            ;;
    esac

    echo "✓ Evidence validated: $evidence"
    return 0
}

# Handle special actions
if [[ "$evidence_or_action" == "--set-dod" ]]; then
    # Set DoD for this bead
    dod="$4"
    bead edit --id="$bead_id" --dod="$dod"
    echo "✓ DoD set for bead #$bead_id: $dod"
    exit 0
fi

# Mark bead
if [[ "$status" == "complete" ]]; then
    # Check DoD exists
    if ! check_dod "$bead_id"; then
        exit 1
    fi

    # Validate evidence
    if ! validate_evidence "$evidence_or_action" "$bead_id"; then
        exit 1
    fi

    # Extract DoD for display
    dod=$(bead show --id="$bead_id" --json | jq -r '.dod')
    echo "✓ Checking DoD: $dod"

    bead mark --id="$bead_id" --status="$status" --evidence="$evidence_or_action"

    # Store evidence in bead metadata
    bead annotate --id="$bead_id" --key="completion_evidence" --value="$evidence_or_action"
    bead annotate --id="$bead_id" --key="completed_at" --value="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    echo "✓ Bead #$bead_id marked complete with evidence"
else
    bead mark --id="$bead_id" --status="$status" --notes="$evidence_or_action"
fi

# Notify dependents if complete
if [[ "$status" == "complete" ]]; then
    bv --robot-notify-dependents --id="$bead_id"
fi
```

### Definition of Done (DoD) Framework (NEW)

**Purpose:** Every bead must define "what finished means" before agents can mark it complete.

#### DoD Categories

**Code Changes:**
```bash
# Example DoD for code bead
bead edit --id=123 --dod="tests pass, callers checked, docs updated"

# Valid criteria:
#   - tests pass       (all unit and integration tests pass)
#   - callers checked  (all calling code reviewed and updated)
#   - docs updated     (documentation reflects changes)
#   - reviewed         (code review completed)
#   - benchmark_pass   (performance benchmarks within acceptable range)
```

**Documentation:**
```bash
bead edit --id=124 --dod="content reviewed, links verified, examples tested"

# Valid criteria:
#   - content reviewed (documentation content reviewed for accuracy)
#   - links verified   (all links are valid)
#   - examples tested  (code examples run successfully)
```

**Infrastructure:**
```bash
bead edit --id=125 --dod="deployed, monitored, documented"

# Valid criteria:
#   - deployed   (infrastructure is deployed and functional)
#   - monitored  (monitoring and alerts are in place)
#   - documented (runbook and troubleshooting docs exist)
```

#### Evidence Types

| Evidence Type | Format | Example |
|---------------|--------|---------|
| **Commit** | `commit:<hash>` | `commit:a1b2c3d4` |
| **Pull Request** | `pr:<url>` | `pr:https://github.com/user/repo/pull/42` |
| **File** | `file:<path>` | `file:coverage-report.html` |
| **Test** | `test:<result>` | `test:passed` |
| **Log** | `log:<snippet>` | `log:Build completed in 45s` |

#### Example Workflow

```bash
# Agent starts bead
maf/scripts/beads/mark-progress.sh 123 in-progress

# Agent sets DoD (if not already set)
maf/scripts/beads/mark-progress.sh 123 --set-dod "tests pass, callers checked, docs updated"

# Agent completes work, marks with evidence
maf/scripts/beads/mark-progress.sh 123 complete commit:a1b2c3d4

# If DoD not met, command fails:
# ❌ Error: Bead #123 has no Definition of Done (DoD)

# If evidence invalid, command fails:
# ❌ Error: Evidence required to mark bead as complete
```

**Result:** System stops producing "agent activity" and starts producing auditable shipped artifacts.

---

## Implementation Phases

### Phase 1: Foundation Documents (2-3 hours)
**Priority:** HIGH - These are the "constitution" that everything else builds on.

**Tasks:**

1. Create `maf/docs/maf-constitution.md`
   - Use complete structure from Section 2
   - Autonomy levels (1-3)
   - Error recovery protocols
   - Coordination rules
   - Escalation triggers
   - Agent rights/responsibilities

2. Create `maf/docs/governance/MAF_ASSUMPTIONS.md`
   ```markdown
   # MAF Assumptions - What Agents Assume is "Normal"

   ## Timing Assumptions
   - Agent mail delivery: < 5 seconds
   - Bead updates: < 10 seconds
   - Human escalation response: 15 minutes (critical), 1 hour (warning)
   - No hard real-time guarantees

   ## Consistency Assumptions
   - Agent mail: Eventually consistent
   - Beads database: Strongly consistent
   - Git operations: Eventually consistent
   - File system: Strongly consistent

   ## Cognitive System Assumptions
   - Agents may have different capabilities (Claude vs Codex vs Gemini)
   - Agents may have different context windows
   - Agents may make different decisions with same input
   - Agents may have different knowledge cutoffs

   ## Failure Assumptions
   - Networks may fail transiently
   - Services may be temporarily unavailable
   - Agents may crash or lose memory
   - Humans may not respond immediately

   ## Security Assumptions
   - Agents cannot access production without approval
   - Agents cannot modify secrets
   - Agents cannot deploy without approval
   - All actions are auditable via git and agent mail
   ```

3. Create `maf/docs/governance/CORE_OVERRIDE_POLICY.md`
   ```markdown
   # Core Override Policy

   ## When Subtree Edits Are Allowed

   ### NEVER Edit (Default)
   - All files in `maf/` subtree are read-only by default
   - CI guard blocks commits to `maf/` without `maf-upgrade` label

   ### Emergency Override (Rare)
   - If critical bug blocks all work
   - Create issue in MAF HQ repo
   - Label with `emergency-override`
   - MAF maintainers will:
     1. Review and approve/deny
     2. If approved: add `maf-upgrade` label
     3. You can commit temporarily
     4. MUST upstream fix to HQ immediately

   ### Permanent Override (Very Rare)
   - If feature is fundamentally project-specific
   - Discuss with MAF maintainers first
   - May be moved to `.maf/overrides/` instead
   - CI guard ignores `.maf/overrides/`

   ## Override Request Process

   1. Document the problem
   2. Propose the override
   3. Create issue in MAF HQ
   4. Wait for approval
   5. Add `maf-upgrade` label if approved
   6. Commit with clear justification
   7. Upstream to HQ if appropriate

   ## Rollback Procedures

   If override causes problems:
   ```bash
   # Immediate rollback
   git revert <commit-hash>
   git push

   # Or if not yet pushed
   git reset --hard HEAD~1
   ```
   ```

4. Create `maf/docs/governance/VERSIONING_GUIDE.md`
   ```markdown
   # MAF Versioning Guide

   ## Semantic Versioning for Cognitive Systems

   Format: `v<major>.<minor>.<patch>-<intent>`

   Examples:
   - `v0.2.1-agent-safe` - Bug fix, no cognitive changes
   - `v0.3.0-topology-breaking` - Agent topology format change
   - `v0.3.1-memory-fix` - Memory handling improvement

   ## Version Number Rules

   ### Major Version (X.0.0)
   - Breaking changes to agent cognition
   - Architecture changes
   - Format changes that require migration

   ### Minor Version (0.X.0)
   - New features, backward compatible
   - New autonomy levels
   - New coordination patterns

   ### Patch Version (0.0.X)
   - Bug fixes only
   - No cognitive changes
   - Safe to upgrade without testing

   ## Intent Tags

   - `-agent-safe`: No changes to how agents think
   - `-agent-enhanced`: Improved agent capabilities, backward compatible
   - `-topology-breaking`: Agent topology format change
   - `-coordination-change`: Changes to agent mail/beads protocol
   - `-security`: Security-related changes

   ## Upgrade Testing

   For Major and Minor versions:
   1. Test in canary (NextNest) first
   2. Run full agent autonomy test suite
   3. Verify all escalations work
   4. Check agent mail and beads integration
   5. Only then roll out to production (Roundtable)

   For Patch versions:
   - Can upgrade directly (agent-safe)
   ```

**Validation:**
```bash
# Verify all governance docs exist
ls docs/governance/*.md

# Verify no contradictions
grep -r "conflict" docs/governance/

# Commit
git add docs/governance/ docs/maf-constitution.md
git commit -m "feat: add MAF governance documents

- MAF_CONSTITUTION.md: Autonomy contract
- MAF_ASSUMPTIONS.md: Cognitive assumptions
- CORE_OVERRIDE_POLICY.md: Override rules
- VERSIONING_GUIDE.md: Semantic versioning
"
```

---

### Phase 2: AGENTS.md Template (1-2 hours)
**Priority:** HIGH - This is the contract all agents read.

**Tasks:**

1. Create `maf/templates/AGENTS.md.template`
   - Use complete template from Appendix A
   - Include all sections
   - Use placeholders: `__PROJECT_NAME__`, `__SESSION_NAME__`, etc.

2. Update setup wizard to template AGENTS.md
   - Copy template to project root
   - Replace placeholders with actual values
   - Add project-specific section

**Validation:**
```bash
# Test template rendering
TEMPLATE="maf/templates/AGENTS.md.template"
OUTPUT="AGENTS.md.test"

sed 's/__PROJECT_NAME__/test-project/g' "$TEMPLATE" > "$OUTPUT"
sed -i 's/__SESSION_NAME__/maf-test/g' "$OUTPUT"
sed -i 's/__SUPERVISOR__/test-supervisor/g' "$OUTPUT"
sed -i 's/__REVIEWER__/test-reviewer/g' "$OUTPUT"
sed -i 's/__IMP1__/test-imp1/g' "$OUTPUT"
sed -i 's/__IMP2__/test-imp2/g' "$OUTPUT"

# Verify no remaining placeholders
if grep "__" "$OUTPUT"; then
    echo "FAIL: Unfilled placeholders"
    exit 1
else
    echo "PASS: Template rendered successfully"
fi

rm "$OUTPUT"
```

---

### Phase 3: Setup Wizard (3-4 hours)
**Priority:** HIGH - This is the user-facing entry point.

**Tasks:**

1. Create `maf/scripts/setup/setup-maf.sh`
   - Use complete script from Appendix B
   - Make it executable: `chmod +x`
   - Add to MAF PATH

2. Create `maf/scripts/setup/validate-config.sh`
   ```bash
   #!/usr/bin/env bash
   # Validate MAF configuration

   config_file="${1:-.maf/config/agent-topology.json}"

   # Check file exists
   if [[ ! -f "$config_file" ]]; then
       echo "ERROR: Config file not found: $config_file" >&2
       exit 1
   fi

   # Validate JSON
   if ! jq empty "$config_file" 2>/dev/null; then
       echo "ERROR: Invalid JSON in $config_file" >&2
       exit 1
   fi

   # Check required fields
   required_fields=("version" "session_name" "panes" "role_mappings")
   for field in "${required_fields[@]}"; do
       if ! jq -e ".$field" "$config_file" >/dev/null 2>&1; then
           echo "ERROR: Missing required field: $field" >&2
           exit 1
       fi
   done

   # Check session name isn't default
   session_name=$(jq -r '.session_name' "$config_file")
   if [[ "$session_name" == "maf-cli" ]]; then
       echo "WARNING: 'maf-cli' is Roundtable's default session name" >&2
       echo "Please choose a unique session name for your project" >&2
   fi

   # Check agent names aren't default
   supervisor=$(jq -r '.role_mappings.supervisor' "$config_file")
   if [[ "$supervisor" == "GreenMountain" ]]; then
       echo "WARNING: 'GreenMountain' is Roundtable's default supervisor name" >&2
   fi

   echo "✓ Configuration is valid"
   exit 0
   ```

3. Create `maf/scripts/setup/reset-maf.sh`
   ```bash
   #!/usr/bin/env bash
   # Reset MAF configuration and re-run setup wizard

   echo "╔════════════════════════════════════════════════════════════╗"
   echo "║              Reset & Reconfigure MAF                    ║"
   echo "╚════════════════════════════════════════════════════════════╝"
   echo
   echo "This will:"
   echo "  1. Back up your current .maf/ directory"
   echo "  2. Remove all MAF configuration and state"
   echo "  3. Re-run the setup wizard"
   echo
   echo "⚠️  Running agents will be stopped!"
   echo

   read -rp "Continue with reset? [y/N]: " -n 1 confirm
   echo

   if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
       echo "Reset cancelled"
       exit 0
   fi

   # Get current session name
   if [[ -f ".maf/config/agent-topology.json" ]]; then
       session_name=$(jq -r '.session_name' .maf/config/agent-topology.json)
   else
       session_name="maf-session"
   fi

   # Stop agents
   echo "Stopping MAF agents..."
   if tmux has-session "$session_name" 2>/dev/null; then
       tmux kill-session -t "$session_name" 2>/dev/null || true
   fi

   # Backup
   backup_dir=".maf.backup.$(date +%Y%m%d_%H%M%S)"
   echo "Backing up to $backup_dir..."
   if [[ -d ".maf" ]]; then
       cp -r .maf "$backup_dir"
   fi

   # Remove
   echo "Removing .maf/..."
   rm -rf .maf

   echo "✓ Reset complete"
   echo
   echo "Starting setup wizard..."
   echo

   # Run setup
   bash maf/scripts/setup/setup-maf.sh
   ```

4. Test wizard end-to-end:
   ```bash
   # In a test repo
   cd /tmp/test-maf-setup
   git init
   echo '{"name": "test"}' > package.json
   git add package.json
   git commit -m "init"

   git subtree add --prefix=maf /root/projects/maf-github main --squash
   bash maf/scripts/setup/setup-maf.sh

   # Verify output
   cat .maf/config/agent-topology.json
   cat AGENTS.md
   cat .maf/SETUP_COMPLETE

   # Test reset
   bash maf/scripts/setup/setup-maf.sh --reset
   ```

**Validation:**
```bash
# Run wizard in test repo
cd /tmp/test-maf-setup
git init
echo '{"name": "test"}' > package.json
git add package.json
git commit -m "init"
git subtree add --prefix=maf /root/projects/maf-github main --squash

# Run wizard (non-interactive for testing)
echo -e "\n\n\n\n\n\ny" | bash maf/scripts/setup/setup-maf.sh

# Verify all files created
ls .maf/config/agent-topology.json || echo "FAIL: Missing topology"
ls AGENTS.md || echo "FAIL: Missing AGENTS.md"
ls .maf/SETUP_COMPLETE || echo "FAIL: Missing SETUP_COMPLETE"

# Run health check
bash maf/scripts/maf/status/check-subtree-health.sh
```

---

### Phase 4: Integration Testing (2-3 hours)
**Priority:** MEDIUM - Ensure everything works together.

**Tasks:**

1. Test in Roundtable:
   ```bash
   cd /root/projects/roundtable

   # Backup existing config
   cp -r .maf .maf.backup.$(date +%Y%m%d_%H%M%S)

   # Run wizard in "update" mode
   bash maf/scripts/setup/setup-maf.sh
   # Choose option 2: Update existing config

   # Verify agents still work
   bash maf/scripts/maf/spawn-agents.sh
   tmux list-sessions | grep maf-cli
   ```

2. Test in NextNest:
   ```bash
   cd /root/projects/nextnest

   # Run wizard in "reset" mode
   bash maf/scripts/setup/setup-maf.sh --reset

   # Verify new config
   cat .maf/config/agent-topology.json | jq '.session_name'
   # Should be "maf-nextnest"
   ```

3. Test agent coordination:
   ```bash
   # Start agents
   bash maf/scripts/maf/spawn-agents.sh

   # Check agent mail
   mcp-agent-mail fetch
   mcp-agent-mail list-agents

   # Create test bead (if beads available)
   if command -v bead &>/dev/null; then
       bead create "Setup verification task"

       # Verify agents pick it up
       sleep 30
       bead list
   fi
   ```

---

### Phase 5: Documentation Updates (1-2 hours)
**Priority:** MEDIUM - Keep docs in sync.

**Tasks:**

1. Update `maf/README.md`:
   ```markdown
   ## Quick Start

   ### For New Projects

   1. Add MAF as a subtree:
      ```bash
      git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
      ```

   2. Run the setup wizard:
      ```bash
      bash maf/scripts/setup/setup-maf.sh
      ```

   3. Start your agents:
      ```bash
      bash maf/scripts/maf/spawn-agents.sh
      ```

   ### Governance

   MAF is governed by a constitution that defines autonomous agent behavior:
   - [MAF Constitution](docs/maf-constitution.md) - Autonomy contract
   - [MAF Assumptions](docs/governance/MAF_ASSUMPTIONS.md) - Cognitive assumptions
   - [Core Override Policy](docs/governance/CORE_OVERRIDE_POLICY.md) - Override rules
   - [Versioning Guide](docs/governance/VERSIONING_GUIDE.md) - Semantic versioning

   ### Agent Behavior

   All agents follow the contract defined in AGENTS.md (generated during setup).
   See [AGENTS.md.template](templates/AGENTS.md.template) for the full contract.
   ```

2. Update `maf/docs/runbooks/CONSUMER_UPGRADE.md`:
   ```markdown
   ## After Subtree Pull

   ### If Configuration Format Changed

   If MAJ_VERSION or MIN_VERSION changed, run setup wizard:

   ```bash
   bash maf/scripts/setup/setup-maf.sh
   # Choose: Update existing config
   ```

   ### If Reset Needed

   If major changes require reconfiguration:

   ```bash
   bash maf/scripts/setup/setup-maf.sh --reset
   ```

   See [Setup Wizard](../../scripts/setup/README.md) for details.
   ```

3. Update `maf/docs/runbooks/TROUBLESHOOTING.md`:
   ```markdown
   ## Setup Wizard Issues

   ### Symptom: "Setup wizard fails"

   **Diagnosis:**
   ```bash
   # Check wizard exists
   ls maf/scripts/setup/setup-maf.sh

   # Check MAF subtree exists
   ls maf/

   # Check for package.json or equivalent
   ls package.json  # or Cargo.toml or pyproject.toml
   ```

   **Solutions:**

   **1. MAF subtree missing**
   ```bash
   git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
   ```

   **2. Not in a project directory**
   ```bash
   # Wizard requires package.json, Cargo.toml, or pyproject.toml
   # Run from your project root
   ```

   **3. Permission denied**
   ```bash
   chmod +x maf/scripts/setup/setup-maf.sh
   ```

   ### Symptom: "Configuration validation fails"

   **Diagnosis:**
   ```bash
   bash maf/scripts/setup/validate-config.sh
   ```

   **Solutions:**

   **1. Invalid JSON**
   ```bash
   # Fix JSON syntax errors
   jq . .maf/config/agent-topology.json
   ```

   **2. Missing required fields**
   ```bash
   # Re-run setup wizard
   bash maf/scripts/setup/setup-maf.sh
   # Choose: Reset and reconfigure
   ```

   **3. Session name conflict**
   ```bash
   # Choose a unique session name
   # Don't use "maf-cli" unless you are Roundtable
   ```
   ```

4. Create `maf/docs/AUTONOMY_GUIDE.md`:
   ```markdown
   # MAF Autonomy Guide

   ## Overview

   MAF supports autonomous agent operation within clear governance boundaries.
   This guide explains how autonomous operation works and how to monitor it.

   ## Autonomy Levels

   See [MAF Constitution](maf-constitution.md) for complete autonomy level definitions.

   ## Monitoring Autonomous Agents

   ### Check Agent Status

   ```bash
   # List all agents
   mcp-agent-mail list-agents

   # Check recent activity
   mcp-agent-mail fetch --last 10
   ```

   ### Check Bead Progress

   ```bash
   # See all beads
   bead list

   # See what agents are working on
   bead list --status=in-progress

   # See completed beads
   bead list --status=complete --last 10
   ```

   ### Check Escalations

   ```bash
   # Look for escalations in agent mail
   mcp-agent-mail fetch | grep "ESCALATION"

   # Check for critical escalations
   mcp-agent-mail fetch | grep "CRITICAL"
   ```

   ## When to Intervene

   ### Immediate Intervention Required

   - Critical escalations older than 15 minutes
   - Agents stuck on same bead for > 1 hour
   - Test failure rate > 20%
   - Build completely broken

   ### Intervention Recommended

   - Warning escalations older than 1 hour
   - No progress for > 2 hours
   - Agent asking for guidance
   - Complex architectural decision needed

   ### Normal Operation

   - Info-level escalations (document and continue)
   - Agents making progress
   - Tests passing
   - Beads completing

   ## Emergency Procedures

   ### Stop All Autonomous Agents

   ```bash
   # Kill tmux session
   tmux kill-session -t <session-name>

   # Or stop agent mail
   mcp-agent-mail stop
   ```

   ### Emergency Reset

   ```bash
   # Reset MAF configuration
   bash maf/scripts/setup/setup-maf.sh --reset

   # This stops agents, backs up config, and restarts wizard
   ```

   ## Best Practices

   1. **Start Small**: Let agents work on Level 1 tasks first
   2. **Monitor Escalations**: Check agent mail regularly
   3. **Trust the Process**: Agents will escalate when uncertain
   4. **Provide Feedback**: Update AGENTS.md based on lessons learned
   5. **Review Regularly**: Check bead progress and agent activity weekly

   ## Troubleshooting

   See [TROUBLESHOOTING.md](runbooks/TROUBLESHOOTING.md) for common issues.
   ```

---

### Phase 6: Beads Integration (2-3 hours)
**Priority:** LOW - Nice to have, but can add later.

**Tasks:**

1. Create `maf/scripts/beads/` directory with wrapper scripts (see beads_viewer Integration section above)

2. Integrate with spawn script:
   ```bash
   # In maf/scripts/maf/spawn-agents.sh, after agent starts:

   # Send registration to agent mail
   echo "Registering with Agent Mail..."
   mcp-agent-mail register "$AGENT_NAME" || true

   # Check for assigned beads
   echo "Checking for assigned beads..."
   if command -v bead &>/dev/null; then
       next_bead=$(bash maf/scripts/beads/find-next-bead.sh "$ROLE" "$AGENT_NAME")
       if [[ -n "$next_bead" ]]; then
           echo "Found assigned bead: $next_bead"
           # Agent will pick it up on their own
       fi
   fi
   ```

3. Test bead workflow:
   ```bash
   # Create test beads
   bead create "Test task 1: Fix typo in README"
   bead create "Test task 2: Add unit test for user_service"
   bead create "Test task 3: Update documentation"

   # Start agents
   bash maf/scripts/maf/spawn-agents.sh

   # Watch them pick up beads
   watch -n 5 'bead list'
   ```

---

## Testing Strategy

### Context-Awareness Testing (NEW)

**Critical Requirement:** All tests MUST pass in both environments:

1. **MAF HQ Environment** (`/root/projects/maf-github`)
   - No `maf/` prefix
   - Scripts at `scripts/maf/`
   - Direct MAF repository

2. **Franchisee Environment** (e.g., `/root/projects/nextnest`)
   - Has `maf/` prefix
   - Scripts at `maf/scripts/maf/`
   - MAF as git subtree

#### Dual-Context Test Matrix

| Test Category | HQ Context | Franchisee Context | Notes |
|--------------|------------|-------------------|-------|
| Path Detection | `$MAF_SUBTREE_PREFIX=""` | `$MAF_SUBTREE_PREFIX="maf"` | Critical |
| Script Execution | `scripts/maf/` | `maf/scripts/maf/` | All scripts |
| Template Rendering | No `maf/` in paths | Has `maf/` in paths | AGENTS.md |
| Config Validation | Direct paths | Prefixed paths | `.maf/config/` |
| Subtree Operations | N/A | Subtree sync works | Franchisee-only |

#### Context Validation Test Script

```bash
#!/usr/bin/env bash
# Test context-awareness across HQ and franchisee environments

test_context_detection() {
    # Test 1: Detect current environment
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
    if [[ -d "$PROJECT_ROOT/maf/scripts/maf" ]]; then
        MAF_LAYOUT="franchisee"
        MAF_SUBTREE_PREFIX="maf"
    elif [[ -d "$PROJECT_ROOT/scripts/maf" ]] && [[ ! -d "$PROJECT_ROOT/maf" ]]; then
        MAF_LAYOUT="hq"
        MAF_SUBTREE_PREFIX=""
    else
        echo "FAIL: Unknown MAF layout"
        return 1
    fi

    echo "✓ Detected: $MAF_LAYOUT (prefix: '$MAF_SUBTREE_PREFIX')"

    # Test 2: Verify MAF scripts exist at detected path
    scripts_path="$PROJECT_ROOT/$MAF_SUBTREE_PREFIX/scripts/maf"
    if [[ ! -d "$scripts_path" ]]; then
        echo "FAIL: Scripts not found at: $scripts_path"
        return 1
    fi

    echo "✓ MAF scripts found at: $scripts_path"

    # Test 3: Verify key scripts work
    for script in health-check.sh; do
        if [[ ! -f "$scripts_path/$script" ]]; then
            echo "FAIL: Script not found: $script"
            return 1
        fi
        echo "✓ Script exists: $script"
    done

    echo "✓ All context tests passed for: $MAF_LAYOUT"
}

# Run tests
test_context_detection
```

#### Cross-Environment Testing

Before marking any task complete:

1. **Test in HQ context:**
   ```bash
   cd /root/projects/maf-github
   bash tests/test_context_awareness.sh
   ```

2. **Test in franchisee context:**
   ```bash
   cd /root/projects/nextnest
   bash maf/scripts/maf/tests/test_context_awareness.sh
   ```

3. **Verify path detection works:**
   ```bash
   source .maf/context.sh && echo "Layout: $MAF_LAYOUT"
   ```

### Unit Tests

```bash
# Test each component in isolation

# Test config validation
bash maf/scripts/setup/validate-config.sh --test

# Test template rendering
bash maf/scripts/setup/test-template-render.sh

# Test constitution rules (parse and validate)
python3 tests/test_constitution.py
```

**Test: `tests/test_constitution.py`**
```python
#!/usr/bin/env python3
"""Test MAF Constitution parsing and validation."""

import json
import re
from pathlib import Path

def test_constitution_exists():
    """Test that constitution file exists."""
    constitution_path = Path("docs/maf-constitution.md")
    assert constitution_path.exists(), "MAF constitution not found"

def test_constitution_has_autonomy_levels():
    """Test that constitution defines autonomy levels."""
    constitution_path = Path("docs/maf-constitution.md")
    content = constitution_path.read_text()

    # Should have Level 1, 2, 3
    assert "Level 1" in content
    assert "Level 2" in content
    assert "Level 3" in content

    # Should define autonomy levels
    assert "Full Autopilot" in content or "Level 1: Full Autopilot" in content
    assert "Autopilot with Validation" in content or "Level 2" in content
    assert "Human Approval Required" in content or "Level 3" in content

def test_constitution_has_escalation_triggers():
    """Test that constitution defines when to escalate."""
    constitution_path = Path("docs/maf-constitution.md")
    content = constitution_path.read_text()

    # Should have escalation triggers
    assert "escalate" in content.lower()
    assert "trigger" in content.lower()

def test_governance_docs_exist():
    """Test that all governance docs exist."""
    docs = [
        "docs/governance/MAF_ASSUMPTIONS.md",
        "docs/governance/CORE_OVERRIDE_POLICY.md",
        "docs/governance/VERSIONING_GUIDE.md",
    ]

    for doc in docs:
        assert Path(doc).exists(), f"Governance doc not found: {doc}"

def test_agents_template_exists():
    """Test that AGENTS.md template exists."""
    template_path = Path("templates/AGENTS.md.template")
    assert template_path.exists(), "AGENTS.md template not found"

def test_agents_template_has_placeholders():
    """Test that template has required placeholders."""
    template_path = Path("templates/AGENTS.md.template")
    content = template_path.read_text()

    placeholders = [
        "__PROJECT_NAME__",
        "__SESSION_NAME__",
        "__SUPERVISOR__",
        "__REVIEWER__",
        "__IMP1__",
        "__IMP2__",
    ]

    for placeholder in placeholders:
        assert placeholder in content, f"Missing placeholder: {placeholder}"

def test_setup_wizard_exists():
    """Test that setup wizard exists."""
    wizard_path = Path("scripts/setup/setup-maf.sh")
    assert wizard_path.exists(), "Setup wizard not found"
    assert wizard_path.stat().st_mode & 0o111, "Setup wizard not executable"

if __name__ == "__main__":
    test_constitution_exists()
    test_constitution_has_autonomy_levels()
    test_constitution_has_escalation_triggers()
    test_governance_docs_exist()
    test_agents_template_exists()
    test_agents_template_has_placeholders()
    test_setup_wizard_exists()
    print("All tests passed!")
```

---

### Integration Tests

```bash
# Test full workflow in test repos

# Test 1: Fresh setup
cd /tmp/test-fresh
git init
echo '{"name": "test"}' > package.json
git add package.json
git commit -m "init"
git subtree add --prefix=maf /root/projects/maf-github main --squash

# Run wizard (non-interactive)
echo -e "\n\n\n\n\n\ny" | bash maf/scripts/setup/setup-maf.sh

# Verify: .maf/ created, agents spawn, health check passes
ls .maf/config/agent-topology.json || exit 1
ls AGENTS.md || exit 1
ls .maf/SETUP_COMPLETE || exit 1
bash maf/scripts/maf/status/check-subtree-health.sh

# Test 2: Reset & reconfigure
bash maf/scripts/setup/setup-maf.sh --reset

# Verify: Backup created, clean slate, wizard runs again
ls .maf.backup.* || exit 1
ls .maf/config/agent-topology.json || exit 1

# Test 3: Update existing config
# Modify .maf/config/agent-topology.json manually
echo "y" | bash maf/scripts/setup/setup-maf.sh

# Verify: Preserves agent names, updates structure
```

---

### Autonomous Agent Tests

```bash
# Test 1: Single agent autonomy
# Spin up 1 agent, give it 3 beads
# Verify: Completes all 3, escalates if blocked

# Test 2: Multi-agent coordination
# Spin up 4 agents, give them 10 beads with dependencies
# Verify: Beads complete in dependency order, no conflicts

# Test 3: Escalation workflow
# Give agent impossible task
# Verify: Escalates with proper context, waits for human
```

**Test Script: `tests/test_autonomous_agents.sh`**
```bash
#!/usr/bin/env bash
# Test autonomous agent coordination

set -euo pipefail

echo "Testing autonomous agent coordination..."

# Setup
test_dir="/tmp/test-autonomous-agents"
rm -rf "$test_dir"
mkdir -p "$test_dir"
cd "$test_dir"

# Initialize test project
git init
echo '{"name": "test-autonomous"}' > package.json
git add package.json
git commit -m "init"

# Add MAF subtree
git subtree add --prefix=maf /root/projects/maf-github main --squash

# Run setup wizard
echo -e "\n\n\n\n\n\ny" | bash maf/scripts/setup/setup-maf.sh

# Create test beads (if beads available)
if command -v bead &>/dev/null; then
    echo "Creating test beads..."
    bead create "Test task 1: Simple fix" --description="Fix typo in README"
    bead create "Test task 2: Medium task" --description="Add unit test"
    bead create "Test task 3: Complex task" --description="Refactor user service"

    # Start agents
    echo "Starting agents..."
    bash maf/scripts/maf/spawn-agents.sh

    # Wait for agents to pick up beads
    echo "Waiting for agents to work..."
    sleep 60

    # Check bead status
    echo "Checking bead status..."
    bead list

    # Verify at least some beads are complete or in-progress
    completed=$(bead list --status=complete | wc -l)
    in_progress=$(bead list --status=in-progress | wc -l)

    if [[ $completed -gt 0 ]] || [[ $in_progress -gt 0 ]]; then
        echo "✓ Agents are working on beads"
    else
        echo "✗ Agents not picking up beads"
        exit 1
    fi
else
    echo "Beads not available, skipping bead coordination test"
fi

echo "✓ All autonomous agent tests passed"
```

---

## Rollout Plan

### Phase 0: Shadow Mode (7-Day Observe-Only Baseline) (NEW)

**Purpose:** Establish measurable baseline before enabling autonomous execution.

**Goal:** Understand "what autonomy would have done" without actually executing.

**Duration:** 7 days (can be extended if baseline insufficient)

#### Context Validation Gates (NEW)

**Before starting ANY rollout phase, verify:**

1. **Path Detection Works in Current Environment**
   ```bash
   # Test 1: Source context file
   source .maf/context.sh || { echo "FAIL: No context file"; exit 1; }

   # Test 2: Verify variables are set
   [[ -n "$PROJECT_ROOT" ]] || { echo "FAIL: PROJECT_ROOT not set"; exit 1; }
   [[ -n "$MAF_LAYOUT" ]] || { echo "FAIL: MAF_LAYOUT not set"; exit 1; }
   [[ -n "$MAF_SUBTREE_PREFIX" ]] || { echo "FAIL: MAF_SUBTREE_PREFIX not set"; exit 1; }

   # Test 3: Verify MAF scripts exist at detected path
   scripts_path="$PROJECT_ROOT/$MAF_SUBTREE_PREFIX/scripts/maf"
   [[ -d "$scripts_path" ]] || { echo "FAIL: Scripts path invalid: $scripts_path"; exit 1; }

   echo "✓ Context validation passed for: $MAF_LAYOUT"
   ```

2. **Cross-Environment Validation** (Before rollout to franchisees)
   ```bash
   # Test in HQ context
   cd /root/projects/maf-github
   bash tests/test_context_awareness.sh || exit 1

   # Test in franchisee context (nextnest as canary)
   cd /root/projects/nextnest
   bash maf/scripts/maf/tests/test_context_awareness.sh || exit 1

   echo "✓ Dual-context validation passed"
   ```

3. **Template Rendering Test**
   ```bash
   # Verify AGENTS.md renders correctly in both contexts
   cd /root/projects/maf-github
   bash maf/scripts/setup/test-template-render.sh || exit 1

   cd /root/projects/nextnest
   bash maf/scripts/setup/test-template-render.sh || exit 1

   echo "✓ Template rendering validated"
   ```

4. **Gate Result**
   - ✅ All 3 validations pass → Proceed with rollout phase
   - ❌ Any validation fails → Fix before proceeding

#### How Shadow Mode Works

During Phase 0:

- ✅ Agents continue to work as they do today (manual/human-driven)
- ✅ Every proposed agent action is **classified** into Level 1/2/Ask-Human
- ✅ **Nothing executes automatically** - classification is logged only
- ✅ You get baseline metrics: "what autonomy would have done"

#### Shadow Mode Setup

```bash
cd /root/projects/maf-github

# Enable shadow mode
export MAF_SHADOW_MODE=true
export MAF_SHADOW_LOG=.maf/logs/shadow-mode-classifications.jsonl

# Start agents (they will classify but not execute)
bash maf/scripts/maf/spawn-agents.sh
```

#### Classification Log Format

Each classified action is logged to `.maf/logs/shadow-mode-classifications.jsonl`:

```json
{"timestamp": "2026-01-09T14:23:01Z", "agent": "imp-1", "proposed_action": "Fix typo in README.md", "files": ["README.md"], "lines_changed": 3, "risk_level": "low", "classified_level": "L1_AUTOPILOT", "would_commit": true, "reason": "Single file, <50 lines, low risk"}
{"timestamp": "2026-01-09T14:25:33Z", "agent": "supervisor", "proposed_action": "Refactor authentication module", "files": ["src/auth/*.rs"], "lines_changed": 150, "risk_level": "medium", "classified_level": "L2_VALIDATION_REQUIRED", "would_commit": true, "required_validations": ["tests_pass", "callers_checked"], "reason": "Multi-file, medium risk, touches core logic"}
{"timestamp": "2026-01-09T14:28:15Z", "agent": "imp-2", "proposed_action": "Replace MCP Agent Mail with new system", "files": ["maf/**/*"], "lines_changed": 2000, "risk_level": "high", "classified_level": "L3_ASK_HUMAN", "would_commit": false, "reason": "Architecture change, high risk, touches core"}
```

#### Phase 0 Success Criteria

Before proceeding to Week 1, verify:

1. **Classification Consistency**: Same action types get classified consistently
   ```bash
   # Check consistency of L1 classifications
   cat .maf/logs/shadow-mode-classifications.jsonl | \
     jq -r 'select(.classified_level == "L1_AUTOPILOT") | .reason' | \
     sort | uniq -c
   ```

2. **Baseline Distribution**: Understand what percentage of work falls into each level
   ```bash
   cat .maf/logs/shadow-mode-classifications.jsonl | \
     jq -r '.classified_level' | sort | uniq -c

   # Expected baseline:
   #   70% L1_AUTOPILOT (safe, quick wins)
   #   25% L2_VALIDATION_REQUIRED (multi-file but testable)
   #    5% L3_ASK_HUMAN (risky, architectural)
   ```

3. **No L3 Surprises**: No unexpected L3 classifications (they should be predictable)

4. **Sufficient Sample Size**: At least 100 classified actions over 7 days

#### Phase 0 Exit Decision

After 7 days, review baseline:

```bash
# Generate baseline report
maf/scripts/analysis/shadow-mode-report.py \
  --log .maf/logs/shadow-mode-classifications.jsonl \
  --output .maf/logs/shadow-mode-baseline.md
```

**If baseline looks good:**
```bash
# Proceed to Week 1 with confidence
echo "✅ Shadow mode baseline established"
echo "   L1: 70%, L2: 25%, L3: 5%"
echo "   Proceeding to Week 1 with Level 1 enabled"
```

**If baseline needs extension:**
```bash
# Extend shadow mode by 3-7 days
echo "⚠️ Insufficient baseline data"
echo "   Extending shadow mode by 3 days"
```

**Result:** Measurable permission to turn on autonomy, based on actual data not faith.

### Week 1: HQ Only (Canary)

**Goal:** Implement in maf-github first, validate everything works.

```bash
cd /root/projects/maf-github

# Create all governance docs
mkdir -p docs/governance

# Phase 1: Foundation documents
# (Create docs from Phase 1 tasks)

# Commit governance docs
git add docs/governance/ docs/maf-constitution.md
git commit -m "feat: add MAF governance documents

Phase 1: Foundation documents for autonomous operation

- MAF_CONSTITUTION.md: Autonomy contract defining when agents can act
- MAF_ASSUMPTIONS.md: What agents assume is 'normal'
- CORE_OVERRIDE_POLICY.md: When/how to override core MAF files
- VERSIONING_GUIDE.md: Semantic versioning for cognitive systems

All documents define clear boundaries for autonomous agent operation.
"
git push origin main

# Phase 2: AGENTS.md template
# (Create template from Phase 2 tasks)

git add templates/AGENTS.md.template
git commit -m "feat: add AGENTS.md template

Agent behavior contract template that:
- Defines how agents use tools (agent mail, beads, role spawning)
- Specifies workflow and quality standards
- Establishes escalation triggers and contacts

Generated into AGENTS.md by setup wizard with project-specific values.
"
git push origin main

# Phase 3: Setup wizard
# (Create wizard from Phase 3 tasks)

git add scripts/setup/
git commit -m "feat: add interactive setup wizard

Phase 3: Setup wizard for foolproof MAF configuration

Features:
- Interactive prompts for all configuration
- Validation gates (JSON, required fields, subtree health)
- Backup before reset
- Generic defaults (no Roundtable identity bleed)
- Session uniqueness checks
- Git integration

Wizard creates:
- .maf/config/agent-topology.json (from template)
- AGENTS.md (from template, customized)
- .maf/SETUP_COMPLETE marker

Usage:
  bash maf/scripts/setup/setup-maf.sh       # First time setup
  bash maf/scripts/setup/setup-maf.sh --reset  # Reset & reconfigure
"
git push origin main
```

**Validation:**
```bash
# Run unit tests
python3 tests/test_constitution.py

# Test template rendering
bash maf/scripts/setup/test-template-render.sh

# Test wizard in test repo
cd /tmp/test-maf-hq-setup
git init
echo '{"name": "test"}' > package.json
git add package.json
git commit -m "init"
git subtree add --prefix=maf . main --squash
echo -e "\n\n\n\n\n\ny" | bash maf/scripts/setup/setup-maf.sh
```

---

### Week 2: NextNest (Test Franchise)

**Goal:** Test in NextNest first (canary), work out any issues.

```bash
cd /root/projects/nextnest

# Pull latest from HQ
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Verify new files exist
ls maf/docs/maf-constitution.md
ls maf/docs/governance/MAF_ASSUMPTIONS.md
ls maf/templates/AGENTS.md.template
ls maf/scripts/setup/setup-maf.sh

# Run setup wizard in reset mode
bash maf/scripts/setup/setup-maf.sh --reset

# Verify everything works
bash maf/scripts/maf/spawn-agents.sh
tmux list-sessions | grep maf-nn

# Verify AGENTS.md generated
cat AGENTS.md | grep "nextnest"

# Verify config
cat .maf/config/agent-topology.json | jq '.session_name'
# Should output: maf-nextnest
```

**Monitoring:**
- Check agent mail is working
- Verify agents can read AGENTS.md
- Test escalation workflow
- Run for 1 week, watch for issues

---

### Week 3: Roundtable (Production)

**Goal:** Roll out to Roundtable after NextNest validates.

```bash
cd /root/projects/roundtable

# Pull latest from HQ
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Verify new files exist
ls maf/docs/maf-constitution.md
ls maf/docs/governance/
ls maf/templates/AGENTS.md.template
ls maf/scripts/setup/setup-maf.sh

# Run setup wizard in update mode (preserves existing config)
bash maf/scripts/setup/setup-maf.sh
# Choose option 2: Update existing config

# Verify production stability
bash maf/scripts/maf/spawn-agents.sh
tmux list-sessions | grep maf-cli

# Verify AGENTS.md generated
cat AGENTS.md | grep "roundtable"
```

**Monitoring:**
- Watch for any disruption to existing workflows
- Verify agents still functioning correctly
- Test escalation workflow
- Run for 1 week, compare to baseline

---

### Week 4: Documentation & Handoff

**Goal:** Complete documentation, train team, handoff to operations.

```bash
cd /root/projects/maf-github

# Update README
# (See Phase 5: Documentation Updates)

# Create comprehensive guide
# (See AUTONOMY_GUIDE.md above)

# Commit documentation updates
git add README.md docs/
git commit -m "docs: complete autonomous MAF documentation

Updated documentation:
- README.md: Quick start with setup wizard
- docs/AUTONOMY_GUIDE.md: How autonomous operation works
- docs/runbooks/CONSUMER_UPGRADE.md: Setup wizard integration
- docs/runbooks/TROUBLESHOOTING.md: Setup wizard issues

All documentation now reflects autonomous agent capabilities.
"
git push origin main
```

---

## Success Criteria

### Governance Complete

✅ All governance documents exist and are consistent:
- `maf/docs/maf-constitution.md`
- `maf/docs/governance/MAF_ASSUMPTIONS.md`
- `maf/docs/governance/CORE_OVERRIDE_POLICY.md`
- `maf/docs/governance/VERSIONING_GUIDE.md`

✅ No contradictions between documents
✅ CI enforces policies (CORE_OVERRIDE_POLICY.md)

**Verification:**
```bash
# Check all docs exist
ls docs/maf-constitution.md
ls docs/governance/*.md

# Check for contradictions (manual review)
grep -r "conflict" docs/governance/
```

---

### Setup Working

✅ Wizard runs without errors
✅ Creates valid configuration
✅ Health check passes after setup
✅ Reset workflow works correctly

**Verification:**
```bash
# Test in fresh repo
cd /tmp/test-setup
git init
echo '{"name": "test"}' > package.json
git add package.json
git commit -m "init"
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Run wizard
echo -e "\n\n\n\n\n\ny" | bash maf/scripts/setup/setup-maf.sh

# Verify
ls .maf/config/agent-topology.json && echo "✓ Config created"
ls AGENTS.md && echo "✓ AGENTS.md created"
bash maf/scripts/maf/status/check-subtree-health.sh && echo "✓ Health check passes"

# Test reset
bash maf/scripts/setup/setup-maf.sh --reset
ls .maf.backup.* && echo "✓ Backup created"
ls .maf/config/agent-topology.json && echo "✓ Config recreated"
```

---

### Agents Autonomous

✅ AGENTS.md generated from template
✅ Agents read and follow AGENTS.md
✅ Escalations work correctly
✅ Quality gates enforced

**Verification:**
```bash
# Check AGENTS.md was generated
cat AGENTS.md | grep "__" && echo "✗ FAIL: Unfilled placeholders" || echo "✓ AGENTS.md complete"

# Check agents can read it
# (Manual verification: start agent, ask it to summarize AGENTS.md)

# Test escalation workflow
# (Manual verification: create blocking situation, verify escalation sent)
```

---

### Two Models Coexisting

✅ MAF roles (static) working
✅ Beads agents (dynamic) working
✅ Both coordinate via agent mail
✅ No conflicts between models

**Verification:**
```bash
# Start MAF static agents
bash maf/scripts/maf/spawn-agents.sh
tmux list-sessions | grep maf-cli

# Check agent mail
mcp-agent-mail list-agents
# Should see supervisor, reviewer, implementor-1, implementor-2

# Test bead coordination (if beads available)
if command -v bead &>/dev/null; then
    bead create "Test coordination task"
    sleep 30
    bead list
    # Should see bead claimed or complete
fi

# Start dynamic agent (in new terminal)
# Register with agent mail, pick up bead
# Verify no conflicts with static agents
```

---

### Production Ready

✅ NextNest stable for 1 week
✅ Roundtable stable for 1 week
✅ No escalation of existing issues
✅ Performance baseline established

**Verification:**
```bash
# Check NextNest
cd /root/projects/nextnest
# Review agent mail logs
# Check bead completion rate
# Verify escalation rate is acceptable

# Check Roundtable
cd /root/projects/roundtable
# Review agent mail logs
# Check bead completion rate
# Verify escalation rate is acceptable

# Compare to baseline (before autonomous operation)
# Should see: faster completion, appropriate escalations
```

---

## Summary: What We're Building

| Component | Purpose | File |
|-----------|---------|------|
| **MAF Constitution** | Autonomy contract | `maf/docs/maf-constitution.md` |
| **MAF Assumptions** | Cognitive assumptions | `maf/docs/governance/MAF_ASSUMPTIONS.md` |
| **Core Override Policy** | When/how to override | `maf/docs/governance/CORE_OVERRIDE_POLICY.md` |
| **Versioning Guide** | Semantic versioning | `maf/docs/governance/VERSIONING_GUIDE.md` |
| **AGENTS.md Template** | Agent behavior contract | `maf/templates/AGENTS.md.template` |
| **Setup Wizard** | Interactive configuration | `maf/scripts/setup/setup-maf.sh` |
| **Beads Integration** | Task distribution | `maf/scripts/beads/*.sh` |
| **Autonomy Guide** | How autonomy works | `maf/docs/AUTONOMY_GUIDE.md` |

### The Vision

**A MAF franchise where:**
- Governance is explicit (not implied)
- Setup is foolproof (wizard can't be skipped)
- Agents are autonomous (within clear boundaries)
- Two models coexist (static roles + dynamic beads)
- Human intervention is rare (only when truly needed)

### The Implementation

**4 weeks to production:**
- Week 1: HQ implementation + unit tests
- Week 2: NextNest canary deployment
- Week 3: Roundtable production deployment
- Week 4: Documentation + handoff

**6 core components:**
- 5 governance documents (constitution + 4 policies)
- 1 agent contract template
- 1 setup wizard script
- 4 beads wrapper scripts
- Documentation updates

**Testing at each phase:**
- Unit tests for each component
- Integration tests for workflows
- Autonomous agent tests
- Production monitoring

---

## Appendix A: AGENTS.md Template

See separate file: `maf/templates/AGENTS.md.template`

This file contains the complete agent behavior contract template with placeholders for:
- `__PROJECT_NAME__` - Project identifier
- `__SESSION_NAME__` - Unique session name
- `__SUPERVISOR__` - Supervisor agent name
- `__REVIEWER__` - Reviewer agent name
- `__IMP1__` - Implementor 1 agent name
- `__IMP2__` - Implementor 2 agent name

---

## Appendix B: Setup Wizard Script

See separate file: `maf/scripts/setup/setup-maf.sh`

This is the complete interactive setup wizard with:
- Phase 1: Interactive configuration
- Phase 2: Configuration generation
- Phase 3: Validation gates
- Phase 4: Bootstrap (agent mail, beads)
- Phase 5: Success confirmation

---

## Appendix C: File Creation Checklist

Use this checklist to track implementation progress:

### Phase 1: Foundation Documents
- [ ] `maf/docs/maf-constitution.md`
- [ ] `maf/docs/governance/MAF_ASSUMPTIONS.md`
- [ ] `maf/docs/governance/CORE_OVERRIDE_POLICY.md`
- [ ] `maf/docs/governance/VERSIONING_GUIDE.md`

### Phase 2: AGENTS.md Template
- [ ] `maf/templates/AGENTS.md.template`

### Phase 3: Setup Wizard
- [ ] `maf/scripts/setup/setup-maf.sh`
- [ ] `maf/scripts/setup/validate-config.sh`
- [ ] `maf/scripts/setup/reset-maf.sh`

### Phase 4: Testing
- [ ] `tests/test_constitution.py`
- [ ] `tests/test_autonomous_agents.sh`

### Phase 5: Documentation
- [ ] Update `maf/README.md`
- [ ] Update `maf/docs/runbooks/CONSUMER_UPGRADE.md`
- [ ] Update `maf/docs/runbooks/TROUBLESHOOTING.md`
- [ ] Create `maf/docs/AUTONOMY_GUIDE.md`

### Phase 6: Beads Integration (Optional)
- [ ] `maf/scripts/beads/find-next-bead.sh`
- [ ] `maf/scripts/beads/check-dependencies.sh`
- [ ] `maf/scripts/beads/mark-progress.sh`
- [ ] `maf/scripts/beads/notify-dependents.sh`

---

**End of Implementation Plan**

**Document Version:** 1.0
**Last Updated:** 2026-01-08
**Status:** Ready for Implementation
**Estimated Timeline:** 4 weeks to production
**Complexity:** HIGH (governance layer + autonomous agents)
