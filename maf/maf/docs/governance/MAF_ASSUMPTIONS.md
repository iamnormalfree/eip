# MAF Assumptions - Cognitive Model Documentation

**Version:** 1.0
**Last Updated:** 2026-01-10
**MAF Version:** v0.2.x

---

## Purpose

This document documents what MAF agents can assume is "normal" in their environment. These assumptions form the cognitive model that enables autonomous operation.

## Core Assumptions

### A1. Environment Detection (CRITICAL)

Agents MUST detect their runtime environment before making path assumptions:

**What Agents Can Assume:**
- `.maf/context.sh` exists and can be sourced
- `$PROJECT_ROOT` points to git repository root
- `$MAF_LAYOUT` is one of: `hq`, `franchisee`, or `legacy`
- `$MAF_SUBTREE_PREFIX` is set (empty for HQ, `maf` for franchisee)
- Setup wizard has validated the environment

**What Agents MUST NOT Assume:**
- Scripts are at `scripts/maf/` relative to project root (FALSE in franchisee)
- Vendor directory is at a specific path (depends on layout)
- Repository has a specific directory layout (MUST detect)
- Relative paths from scripts to root will work (use git)

### A2. File System Layout

**HQ Layout:**
```
$PROJECT_ROOT/
├── scripts/maf/          # MAF operational scripts
├── lib/maf/              # MAF core libraries
├── .maf/config/          # MAF configuration
├── .claude/skills/       # Response Awareness skills
└── vendor/superpowers/   # Upstream superpowers subtree
```

**Franchisee Layout:**
```
$PROJECT_ROOT/
├── maf/scripts/maf/      # MAF operational scripts (subtree)
├── maf/lib/maf/          # MAF core libraries (subtree)
├── maf/.maf/config/      # MAF configuration (subtree)
├── .maf/overrides/       # Franchisee customizations
└── maf/.claude/skills/   # Response Awareness skills (subtree)
```

**Path Resolution:**
```bash
# Always use $MAF_SUBTREE_PREFIX for MAF paths
MAF_SCRIPTS="$PROJECT_ROOT/$MAF_SUBTREE_PREFIX/scripts/maf"
MAF_LIB="$PROJECT_ROOT/$MAF_SUBTREE_PREFIX/lib/maf"
MAF_CONFIG="$PROJECT_ROOT/$MAF_SUBTREE_PREFIX/.maf/config"

# For franchisee overrides, use .maf/ directly
FRANCHISEE_CONFIG="$PROJECT_ROOT/.maf/config"
FRANCHISEE_OVERRIDES="$PROJECT_ROOT/.maf/overrides"
```

### A3. Agent Mail System

**What Agents Can Assume:**
- Agent mail is running and accessible
- Maildir format is used for message storage
- Messages have standard headers: `From`, `To`, `Subject`, `Date`
- Agent IDs are unique within a project
- Mail is checked every 5 minutes during active work

**Message Format:**
```bash
# Send message
echo "Subject: Bead #42 claimed
From: supervisor-agent
To: agent-mail-all
Status: in-progress
Started: $(date -Iseconds)" | maf send-mail

# Check messages
maf check-mail --role supervisor --since "5 minutes ago"
```

### A4. Beads Database

**What Agents Can Assume:**
- Beads database is SQLite3 format
- Database path is configurable via `$BEADS_DB`
- Standard schema: `beads` table with columns: id, status, dependencies, assignee
- Beads Viewer (`bv`) CLI tool is available
- Bead IDs are integers

**Standard Queries:**
```bash
# Find next bead
bv --robot-find-next --role="$AGENT_ROLE"

# Check dependencies
bv --robot-dependencies --bead="$BEAD_ID"

# Mark complete
bv --mark-complete --bead="$BEAD_ID" --agent="$AGENT_ID"
```

### A5. Git Workflow

**What Agents Can Assume:**
- Git is initialized and working
- Branch name is available via `git rev-parse --abbrev-ref HEAD`
- Commit access is available (no permission issues)
- Main branch is named `main` or `master`
- Pull requests can be created via `gh` CLI tool

**Commit Standards:**
```bash
# Commit format (conventional commits)
git commit -m "type(scope): description

Co-Authored-By: Claude <noreply@anthropic.com>"

# Types: feat, fix, docs, chore, refactor, test
# Scopes: governance, autonomy, tools, integration, docs
```

### A6. Testing Infrastructure

**What Agents Can Assume:**
- Test command is configured (npm test, pytest, etc.)
- Tests can be run from project root
- Test results are parseable (exit code 0 = pass)
- Coverage reports are available if needed

**Before Commit Checklist:**
```bash
# Run tests
npm test || pytest || make test

# Check for linting errors
npm run lint || flake8 || shellcheck

# Verify git state
git diff --check  # whitespace issues
git status        # ensure correct files staged
```

### A7. Configuration Files

**What Agents Can Assume:**
- `AGENTS.md` exists and is current
- `agent-topology.json` is valid JSON
- `.maf/context.sh` is executable and sourced
- Configuration files are in known locations

**Configuration Priority:**
1. `.maf/overrides/` - Franchisee customizations (highest priority)
2. `.maf/config/` - MAF standard configuration
3. `$MAF_SUBTREE_PREFIX/.maf/config/` - HQ defaults (lowest priority)

### A8. Health Check Infrastructure

**What Agents Can Assume:**
- Subtree health check exists: `maf/scripts/maf/status/check-subtree-health.sh`
- Health check returns exit code 0 for healthy, non-zero for issues
- Health check output is parseable (grep-able)
- Health checks can be run before commits

**Health Check Types:**
```bash
# Subtree integrity
maf/scripts/maf/status/check-subtree-health.sh

# Agent mail status
maf/scripts/maf/status/check-agent-mail.sh

# Beads database status
maf/scripts/maf/status/check-beads-db.sh
```

### A9. Escalation Mechanism

**What Agents Can Assume:**
- Escalations are sent via agent mail to human operators
- Escalation format is standardized (see MAF_CONSTITUTION.md)
- Response times are: Critical (15min), Warning (1hr), Info (1 day)
- Escalations are tracked and acknowledged

**Escalation Endpoint:**
```bash
# Send escalation
cat > /tmp/escalation.yaml << EOF
subject: "[CRITICAL]: Build failure in bead #42"
severity: critical
agent_id: "implementor-1"
bead_id: "42"
context:
  what_i_was_doing: "Implementing user authentication"
  what_i_tried: ["npm install", "npm run build"]
  error_output: "Cannot find module '@auth/core'"
environment: {"project": "myapp", "branch": "feature/auth"}
suggested_actions: ["Install missing dependency", "Check package.json"]
requesting: "guidance"
urgency: "immediate"
EOF

maf escalate /tmp/escalation.yaml
```

### A10. Setup Wizard Validation

**What Agents Can Assume:**
- Setup wizard has been run at least once
- Setup wizard created `.maf/context.sh`
- Setup wizard validated all prerequisites
- Setup wizard created `.maf/config/` directory structure
- Setup wizard initialized agent mail system
- Setup wizard initialized beads database

**If Setup Wizard Has Not Run:**
```bash
# Agent should prompt human to run setup
echo "ERROR: MAF setup wizard has not been run."
echo "Please run: maf/scripts/maf/setup-maf.sh"
exit 1
```

## Assumption Violations

### When Assumptions Fail

If an agent detects that an assumption is violated:

1. **Stop current work** - Don't proceed with broken assumptions
2. **Document the violation** - What was assumed, what reality is
3. **Escalate if critical** - If blocking progress, escalate immediately
4. **Suggest remediation** - Propose how to fix the environment

### Common Violations

| Assumption | Violation Symptom | Remediation |
|------------|-------------------|-------------|
| `.maf/context.sh` exists | File not found error | Run setup wizard |
| `$MAF_LAYOUT` is set | Variable is empty | Source context.sh |
| Agent mail running | Maildir not found | Start agent-mail service |
| Beads DB exists | Database file missing | Run `maf init-beads` |
| Git working | Permission denied | Check git repository permissions |

## Updating This Document

**When to Update:**
- Adding new environment assumptions
- Changing file system layout
- Modifying agent mail protocol
- Updating health check requirements
- Changing configuration priority

**Process:**
1. Document the new assumption clearly
2. Specify what agents can/cannot assume
3. Provide examples or code snippets
4. Update related documentation (MAF_CONSTITUTION.md)
5. Submit PR to MAF HQ

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-10 | Initial version from autonomous MAF foundations |

---

**This document is part of the MAF governance layer.**
**It enables autonomous agent operation by documenting environmental assumptions.**
