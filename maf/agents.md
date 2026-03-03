# MAF Agent Operations Guide

**Version:** 1.0.1
**Last Updated:** 2026-01-28
**Audience:** Claude, Codex, and other AI agents operating in MAF repositories

---

## Executive Summary

MAF (Multi-Agent Framework) is a franchise-based agent orchestration system. As an AI agent in this repository, you are part of either:

1. **4-Agent Team** (Standard) - High-volume parallel implementation
2. **3-Agent BDD Team** (Quality-focused) - TDD enforcement, autonomous workflow

**Your Role Context:**
- You are a specialized agent with specific responsibilities
- Agent coordination happens via MCP Agent Mail
- Work is tracked through Beads (task management system)
- The franchise model separates framework (MAF HQ) from implementation (consumer projects)

---

## Choosing Your Workflow

### 4-Agent Model (Standard)
- **Use when:** High-volume production, parallel implementation needed
- **Layout:** Supervisor + Reviewer + 2 Implementors
- **Documentation:** See [The 4-Agent Team](#the-4-agent-team) below

### 3-Agent BDD Model (Quality-Focused)
- **Use when:** Quality assurance, TDD enforcement, autonomous operation
- **Layout:** Supervisor + Reviewer + 1 Implementor
- **Features:** TDD enforcement, two-stage review, escalation, active mail polling
- **Quick Start:** `bash maf/scripts/maf/start-3agent-bdd.sh --setup`
- **Documentation:** [docs/3-agent-bdd-user-guide.md](docs/3-agent-bdd-user-guide.md)

**Comparison:**

| Factor | 4-Agent | 3-Agent BDD |
|--------|---------|-------------|
| Memory Usage | Higher | Lower |
| Parallel Implementation | Yes | No |
| TDD Enforced | No | Yes |
| Two-Stage Review | No | Yes |
| Escalation System | No | Yes |
| Autonomy | Medium | High |
| Use Case | High-volume production | Quality-focused autonomous |

---

## The 4-Agent Team (Standard)

### Standard Agent Roles

| Index | Role | Agent Name | Responsibilities |
|-------|------|------------|------------------|
| 0 | **Supervisor** | `GreenMountain` (default) | Task routing, coordination, blocker resolution |
| 1 | **Reviewer** | `BlackDog` (default) | QA, validation, approval/rejection, testing |
| 2 | **Implementor-1** | `OrangePond` (default) | Implementation (typically backend/API) |
| 3 | **Implementor-2** | `FuchsiaCreek` (default) | Implementation (typically frontend/UI) |

**Note:** Agent names can be customized per project. Always check `.maf/config/agent-topology.json` for actual names.

### Role-Based Resolution

Use `get_agent_by_role()` to find agent IDs dynamically:

```bash
# Look up supervisor agent name
get_agent_by_role "supervisor"  # Returns: GreenMountain (or project-specific)
```

---

## Agent Guardrails

### Critical: Filesystem Guardrails

**Reviewer agents have filesystem blocks on git operations:**

```bash
# These commands are BLOCKED for Reviewer role:
git commit    # BLOCKED - Use: bd close
git push      # BLOCKED - Reviewer is QA-only
git merge     # BLOCKED - Use: bd close
git rebase    # BLOCKED - Use supervisor for conflicts
```

**Why:** Reviewer role is QA-only, not implementation. Reviewers approve work via Beads, not git.

**Alternative Actions:**
- To approve: `bd close` (closes bead with approval)
- To request changes: `bd reopen` (re-opens with feedback)
- To check status: `git status`, `git diff` (read-only is allowed)

### All Agent Guardrails

| Agent Type | Can Commit | Can Push | Can Merge | Primary Action |
|------------|------------|----------|-----------|----------------|
| **Supervisor** | Yes | Yes | Yes | Coordination, routing |
| **Reviewer** | NO | NO | NO | QA via Beads (`bd close`) |
| **Implementor** | Yes | Yes | No | Implementation only |

---

## Agent Workflows

### 1. Task Receipt (Supervisor)

When a task arrives:

```bash
# 1. Check MCP Agent Mail for new tasks
mcp-list-mails

# 2. Classify task complexity
- Simple (1 file, clear requirements) → Route to implementor
- Medium (2-5 files, some ambiguity) → Use Response Awareness: Medium
- Complex (5+ files, architectural decisions) → Use Response Awareness: Full

# 3. Assign to appropriate agent
# Via bead: bd assign <agent-name> <bead-id>
```

### 2. Implementation (Implementor Agents)

**Mandatory Workflow: Response Awareness**

For any non-trivial implementation:

```bash
# Use Response Awareness framework
/response-awareness-medium  # For medium complexity
# or
/response-awareness-full    # For complex multi-file changes
```

**Implementation Steps:**

1. **Read current state** - Never assume, always verify
2. **Use TodoWrite** - Track all steps explicitly
3. **Write tests first** - When applicable (TDD)
4. **Implement changes** - One logical unit at a time
5. **Verify locally** - Before marking complete
6. **Provide receipt** - Summary of changes, files modified, tests run

**Receipt Format:**

```markdown
## Implementation Receipt

**Changes Made:**
- Modified: src/auth/login.ts (added JWT validation)
- Created: tests/auth/login.test.ts

**Tests Run:**
- npm test: 12 passing, 0 failing
- Coverage: 94%

**Verification:**
- [x] Local tests pass
- [x] No new warnings
- [x] Documentation updated
```

### 3. Review (Reviewer Agent)

**Review Workflow:**

```bash
# 1. Read the bead
bd show <bead-id>

# 2. Check for receipt
# No receipt = REJECT with feedback

# 3. Verify receipt matches actual changes
git status    # Check files modified
git diff      # Review actual changes

# 4. Run tests
npm test      # Verify tests pass

# 5. Decision
# If approved: bd close <bead-id>
# If needs work: bd reopen <bead-id> "Feedback here..."
```

**Review Criteria:**

- [ ] Receipt provided and matches actual changes
- [ ] Tests pass (or explanation why not)
- [ ] No breaking changes without discussion
- [ ] Code follows project patterns
- [ ] Documentation updated (if applicable)
- [ ] No security vulnerabilities

### 4. Bead Lifecycle

```bash
# Create bead
bd create "Implement user authentication"

# Assign bead
bd assign OrangePond <bead-id>

# Work on bead
# ... do work ...

# Submit for review
bd submit <bead-id>

# Reviewer action
bd close <bead-id>         # Approve
# or
bd reopen <bead-id> "Fix X" # Request changes

# Mark complete
bd complete <bead-id>
```

---

## Agent Spawning and Sessions

### Session Names

Each repository uses a unique tmux session name:

| Repository | Session Name | Purpose |
|------------|--------------|---------|
| **MAF HQ** | `maf-hq` | Framework development |
| **Roundtable** | `maf-cli` | Production consumer |
| **NextNest** | `maf-nn` | Canary consumer |
| **Your Project** | `maf-{your-project}` | Customizable |

**Why unique names:** Prevents tmux conflicts when running multiple MAF repos concurrently.

### Spawning Agents

```bash
# Standard way (recommended)
bash maf/scripts/maf/rebuild-maf-cli-agents.sh

# Force rebuild (kill existing session)
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force

# Test mode (dry run)
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --test-only
```

### 4-Pane Layout

After spawning, tmux session has 4 panes:

```
┌─────────────────────────────────────────────┐
│  Pane 0: Supervisor (GreenMountain)         │
│  Task routing, coordination                 │
├─────────────────────────────────────────────┤
│  Pane 1: Reviewer (BlackDog)                │
│  QA, validation, approval                   │
├─────────────────────────────────────────────┤
│  Pane 2: Implementor-1 (OrangePond)         │
│  Implementation (typically backend)          │
├─────────────────────────────────────────────┤
│  Pane 3: Implementor-2 (FuchsiaCreek)       │
│  Implementation (typically frontend)         │
└─────────────────────────────────────────────┘
```

---

## Agent Specialization Framework

### Role-Specific Prompts

Each agent can have a specialized prompt in `.maf/agents/`:

```bash
.maf/agents/
├── greenmountain-prompt.md    # Supervisor specialization
├── blackdog-prompt.md         # Reviewer specialization
├── orangepond-prompt.md       # Implementor-1 specialization
└── fusionscreek-prompt.md     # Implementor-2 specialization
```

**Prompt Loading:**
- Agent names are case-insensitive for file matching
- `GreenMountain` → `greenmountain-prompt.md`
- Environment variables set: `$AGENT_NAME`, `$AGENT_PROMPT_FILE`

### Creating Specialized Prompts

Use this template:

```markdown
# <AgentName> - <Role> Agent

You are **<AgentName>**, the <role> agent for <project>.

## Your Responsibilities
- Primary responsibility 1
- Primary responsibility 2

## Your Domain Expertise
You specialize in:
- Domain area 1
- Domain area 2

## Critical Workflows
### Workflow 1: <Name>
<Step-by-step instructions>

## Key Integration Points
- **Integration A**: How to use it
- **Integration B**: How to use it

## Decision Trees
When <situation>:
- If <condition A>: Do <action A>
- If <condition B>: Do <action B>

## Communication Patterns
- When to escalate to supervisor
- When to coordinate with other agents
- What to handle independently
```

---

## MCP Agent Mail Integration

### Checking Mail

```bash
# List all messages
mcp-list-mails

# Read specific message
mcp-read-mail <message-id>

# Send mail to another agent
mcp-send-mail <agent-name> "Message content"
```

### Mail Etiquette

1. **Be specific** - Include bead IDs, file paths, error messages
2. **Provide context** - Summarize what you've tried
3. **Escalate appropriately** - Supervisor for blockers, not implementation questions
4. **Respond promptly** - Check mail regularly during active work

---

## The Franchise Model

### Architecture

```
┌─────────────────────────────────────────────┐
│            MAF HQ (Franchisor)              │
│    iamnormalfree/maf (framework)            │
│  Provides: lib/maf/, scripts/maf/, .claude/ │
└─────────────────────────────────────────────┘
                    ↓ git subtree
┌─────────────────────────────────────────────┐
│         Consumer Projects (Franchisees)     │
│  ┌────────────┐  ┌────────────┐            │
│  │ Roundtable │  │ NextNest   │            │
│  │ (maf-cli)  │  │ (maf-nn)   │            │
│  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────┘
```

### Key Principles

1. **Framework from HQ, Configuration Local**
   - `maf/` directory = framework code (never modify locally)
   - `.maf/` directory = your configuration (customize freely)

2. **Override Resolution Order**
   1. `.maf/overrides/*` - Your customizations (always wins)
   2. `.maf/config/*` - Your project configuration
   3. `maf/templates/*` - Framework examples (fallback)
   4. `maf/*` - Core framework (default)

3. **Subtree Protection**
   - CI guards block edits to `maf/` without `maf-upgrade` label
   - Use `bd create` to request framework changes

### Upgrading MAF

```bash
# Create upgrade branch
git checkout -b maf/upgrade-v1.0.0

# Pull latest from HQ
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Test changes
bash maf/scripts/maf/status/check-subtree-health.sh

# Create PR with 'maf-upgrade' label
gh pr create --label maf-upgrade
```

---

## Common Agent Scenarios

### Scenario 1: Implementing a Feature

**Supervisor:**
```bash
# 1. Receive task via MCP Mail
mcp-read-mail <message-id>

# 2. Assess complexity
# This affects 3 files + requires architectural decision → Medium/Full complexity

# 3. Route to appropriate implementor
bd assign OrangePond <bead-id>

# 4. Specify Response Awareness tier
# In bead notes: "Use /response-awareness-medium"
```

**Implementor:**
```bash
# 1. Use Response Awareness
/response-awareness-medium

# 2. Follow the workflow
- Create TodoWrite with all steps
- Read current state of files
- Implement changes
- Run tests
- Provide receipt
```

**Reviewer:**
```bash
# 1. Receive bead for review
bd show <bead-id>

# 2. Verify receipt
# Receipt must show: files changed, tests run, verification steps

# 3. Validate
git diff  # Review actual changes
npm test  # Verify tests pass

# 4. Decision
bd close <bead-id>         # If approved
# or
bd reopen <bead-id> "Fix: X needs Y"  # If needs work
```

### Scenario 2: Handling Blocker

**Implementor (blocked):**
```bash
# Escalate to supervisor
mcp-send-mail GreenMountain "BLOCKED on bead <id>: Need decision on X"
```

**Supervisor:**
```bash
# 1. Read blocker
mcp-read-mail <message-id>

# 2. Make decision or gather more info
# If architectural decision: Consult with team via bead

# 3. Unblock
mcp-send-mail OrangePond "DECISION: Use approach X because..."
bd update <bead-id> "Supervisor decision: Use X"
```

### Scenario 3: Merge Conflict

**Reviewer (cannot resolve conflicts):**
```bash
# Escalate to supervisor
mcp-send-mail GreenMountain "CONFLICT on bead <id>: Needs resolution"
bd reopen <bead-id> "Merge conflict - supervisor to resolve"
```

**Supervisor:**
```bash
# 1. Pull latest
git pull origin main

# 2. Resolve conflicts
# Edit conflicted files, resolve markers

# 3. Test resolution
npm test

# 4. Commit resolution
git add .
git commit -m "Resolve merge conflict for bead <id>"

# 5. Notify team
mcp-send-mail all "Conflict resolved for bead <id>, ready for re-review"
```

---

## Agent Decision Trees

### Should I Use Response Awareness?

```
Is task a simple bug fix (1-2 lines, obvious)?
├─ Yes → Direct implementation
└─ No → Use Response Awareness
    ├─ 2-5 files, mostly clear? → /response-awareness-medium
    ├─ 5+ files, architectural decisions? → /response-awareness-full
    └─ Ambiguous requirements? → /sp-brainstorm first
```

### Should I Escalate to Supervisor?

```
Am I blocked?
├─ Yes → ESCALATE immediately
└─ No → Can I handle independently?
    ├─ Yes → Handle it
    └─ No → Check MCP mail for guidance
        ├─ Guidance exists → Follow it
        └─ No guidance → ESCALATE
```

### Should I Approve This Bead? (Reviewer)

```
Has receipt been provided?
├─ No → REJECT (no receipt = no approval)
└─ Yes → Does receipt match actual changes?
    ├─ No → REJECT (receipt dishonest)
    └─ Yes → Do tests pass?
        ├─ No → REJECT (tests failing)
        └─ Yes → APPROVE (bd close)
```

---

## Environment Variables Available

When spawned, agents have access to:

```bash
AGENT_NAME           # Your agent name (e.g., "GreenMountain")
AGENT_PROMPT_FILE    # Path to your specialized prompt (if exists)
PROJECT_ROOT         # Auto-detected project root
MAF_TMUX_SESSION     # Session name (e.g., "maf-hq")
```

**Usage:**
```bash
# Reference your prompt
cat $AGENT_PROMPT_FILE

# Find project files
find $PROJECT_ROOT -name "*.ts"

# Check tmux session
tmux list-sessions | grep $MAF_TMUX_SESSION
```

---

## Quick Reference Commands

### Bead Operations
```bash
bd create "Title"              # Create new bead
bd show <id>                   # Show bead details
bd assign <agent> <id>         # Assign to agent
bd submit <id>                 # Submit for review
bd close <id>                  # Approve and close
bd reopen <id> "Feedback"      # Request changes
bd complete <id>               # Mark complete
```

### MCP Mail
```bash
mcp-list-mails                 # List all messages
mcp-read-mail <id>             # Read message
mcp-send-mail <agent> "msg"    # Send message
```

### Git (Reviewer: Read-Only)
```bash
git status                     # Check state (OK)
git diff                       # View changes (OK)
git log                        # View history (OK)
git commit                     # BLOCKED for Reviewer
git push                       # BLOCKED for Reviewer
```

### MAF Operations
```bash
bash maf/scripts/maf/status/check-subtree-health.sh  # Check subtree
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force  # Respawn agents
```

---

## Troubleshooting

### "Agent name not found"

**Cause:** Agent name in topology doesn't match prompt filename

**Fix:**
```bash
# Check actual agent name (case-insensitive)
jq '.panes[].agent_name' .maf/config/agent-topology.json

# Ensure prompt file matches (lowercase)
# "GreenMountain" → greenmountain-prompt.md
```

### "Subtree is dirty"

**Cause:** Files in `maf/` directory have been modified locally

**Fix:**
```bash
# Check what changed
git diff --name-only | grep "^maf/"

# If accidental: revert changes
git checkout maf/

# If intentional: this should go to HQ first
# Create bead requesting framework change
```

### "Can't commit (Reviewer role)"

**Cause:** You're a Reviewer agent, filesystem blocks git commit

**Fix:**
```bash
# Don't commit - use bead approval
bd close <bead-id>  # This is your approval mechanism
```

### "Agent not responding in MCP Mail"

**Cause:** Agent pane may be inactive or agent not checking mail

**Fix:**
```bash
# Check agent pane is active
tmux list-panes -t $MAF_TMUX_SESSION

# Send ping message
mcp-send-mail <agent-name> "PING: Please respond"

# If still no response: escalate to supervisor
```

---

## Best Practices

### For All Agents

1. **Always use TodoWrite** for non-trivial tasks
2. **Read files before editing** - Never assume state
3. **Provide receipts** for implementation work
4. **Check MCP mail regularly** during active work
5. **Escalate blockers promptly** - Don't spin wheels
6. **Follow Response Awareness** for complex tasks

### For Supervisors

1. **Classify task complexity** before routing
2. **Specify Response Awareness tier** in assignments
3. **Resolve merge conflicts** - implementors can't
4. **Monitor agent health** via MCP mail
5. **Keep beads moving** - unblock promptly

### For Reviewers

1. **Require receipts** - no receipt = no approval
2. **Verify receipts** match actual changes
3. **Run tests** before approving
4. **Be specific** in reopen feedback
5. **Remember guardrails** - you can't git commit

### For Implementors

1. **Use Response Awareness** for non-trivial work
2. **Write tests first** when applicable
3. **Document changes** in receipts
4. **Ask questions** via MCP mail, don't guess
5. **Test locally** before marking complete

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.1 | 2026-01-28 | Added 3-agent BDD workflow documentation |
| 1.0.0 | 2026-01-09 | Initial version, franchise architecture documented |

---

**Related Documentation:**
- `claude.md` - Claude-specific operations (Response Awareness, skills)
- `docs/3-agent-bdd-user-guide.md` - 3-Agent BDD workflow user guide
- `docs/3-agent-bdd-architecture.md` - 3-Agent BDD architecture documentation
- `docs/plans/maf-franchise-migration-unified-blueprint.md` - Architecture design
- `docs/plans/2026-01-27-3-agent-bdd-tmux-workflow.md` - 3-Agent BDD implementation plan
- `docs/runbooks/CONSUMER_UPGRADE.md` - Upgrading MAF subtree
- `maf/docs/AGENT_SPAWNING.md` - Spawning technical details
