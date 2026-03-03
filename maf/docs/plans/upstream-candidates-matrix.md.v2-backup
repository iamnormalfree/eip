# Upstream Candidates Matrix

**Generated:** 2026-01-08
**Purpose:** Prioritize what should become GLOBAL in MAF HQ
**Source:** Synthesis of all research documents

---

## Priority Framework

**Priority 1 (Upstream Immediately):** Production-critical or universally valuable
**Priority 2 (Upstream as Pattern):** Valuable but needs customization
**Priority 3 (Template Only):** Project-specific, good example only

---

## Priority 1: Upstream Immediately (Wave 1)

### 1.1 clear-stuck-prompts.sh

| Attribute | Value |
|-----------|-------|
| **Source** | Roundtable |
| **Lines** | 82 |
| **Type** | Production-critical utility |
| **What it does** | Detects and clears stuck prompts in tmux panes (Agent Mail + tmux integration) |
| **Why critical** | Documented in Roundtable's CLAUDE.md as standard operating procedure |
| **Universality** | ✅ Works for any MAF project using Agent Mail + tmux |
| **Action** | ✅ Add to `scripts/maf/clear-stuck-prompts.sh` in Wave 1, Day 1-2 |

**Implementation:**
```bash
cp /root/projects/roundtable/scripts/maf/clear-stuck-prompts.sh \
   /root/projects/maf-github/scripts/maf/clear-stuck-prompts.sh
```

**Risk:** Low (additive only, doesn't replace anything)

---

### 1.2 ⚠️ autonomous-workflow.sh - REMOVED from Wave 1

| Attribute | Value |
|-----------|-------|
| **Source** | Roundtable |
| **Lines** | 575 |
| **Type** | Bead lifecycle orchestration |
| **What it does** | Assigns ready beads → waits for completion → routes to review → runs merge gate → commits and closes |
| **Why NOT upstreaming** | **Contains HARDCODED Roundtable agent names** (GreenMountain, BlackDog, OrangePond, FuchsiaCreek) |
| **Status** | ❌ NOT generic enough to upstream as-is |
| **Action Required** | Refactor for role-based lookups before upstreaming |

**Evidence from verification:**
```bash
# Found in autonomous-workflow.sh:
- "Route to BlackDog for review"
- "Requesting review from BlackDog"
- "Assigned by: GreenMountain (Autonomous Workflow)"
- --sender_name "GreenMountain"
- --to "blackdog"
- Agent aliases: orangepond, fuchsiacreek

# Does NOT use role_mappings or config for agent resolution
```

**Required Refactoring:**
1. Replace hardcoded agent names with `get_agent_by_role()` calls
2. Use role-based resolution (supervisor, reviewer, implementor-1, implementor-2)
3. Remove Roundtable-specific references

**Estimated Effort:** 2-4 hours

**Follow-Up Issue:**
```markdown
# Issue: Refactor autonomous-workflow.sh for Generic Agent Support

Before upstreaming to MAF HQ:
1. Replace hardcoded agent names with role-based lookups
2. Use get_agent_by_role() for agent resolution
3. Remove Roundtable-specific references (GreenMountain, BlackDog, etc.)

Files to update:
- scripts/maf/autonomous-workflow.sh

Block upstreaming until complete.
```

---

### 1.3 error-handling.sh

| Attribute | Value |
|-----------|-------|
| **Source** | Roundtable |
| **Lines** | 613 |
| **Type** | Error handling framework |
| **What it does** | Comprehensive error handling, logging, and recovery patterns |
| **Why valuable** | Reduces boilerplate in all scripts, standardizes error messages |
| **Universality** | ✅ Completely framework-agnostic |
| **Status** | Missing entirely from HQ (NEW file, not enhancement) |
| **Action** | ✅ Add to `scripts/maf/lib/error-handling.sh` in Wave 1, Day 1-2 |

**Implementation:**
```bash
cp /root/projects/roundtable/scripts/maf/lib/error-handling.sh \
   /root/projects/maf-github/scripts/maf/lib/error-handling.sh
```

**Functions to verify:**
- `error_with_context()`
- `log_error()`, `log_warn()`, `log_info()`
- `cleanup_on_error()`
- `retry_command()`

**Risk:** Low (additive, new library)

---

### 1.4 tmux-utils.sh

| Attribute | Value |
|-----------|-------|
| **Source** | Roundtable |
| **Lines** | 893 |
| **Type** | Tmux orchestration framework |
| **What it does** | Complete tmux session management, quota checking, pane health monitoring |
| **Why valuable** | Handles edge cases (session crashes, quota exceeded, pane zombies) |
| **Universality** | ✅ All MAF projects use tmux for agent orchestration |
| **Status** | Missing entirely from HQ (NEW file, not enhancement) |
| **Action** | ✅ Add to `scripts/maf/lib/tmux-utils.sh` in Wave 1, Day 1-2 |

**Implementation:**
```bash
cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh \
   /root/projects/maf-github/scripts/maf/lib/tmux-utils.sh
```

**Functions to verify:**
- `tmux_pane_health_check()`
- `tmux_session_exists()`
- `tmux_create_or_attach()`
- `tmux_quota_check()`

**Risk:** Low (additive, new library)

---

### 1.5 Subtree Auto-Detection Pattern

| Attribute | Value |
|-----------|-------|
| **Source** | NextNest |
| **Lines** | ~20 |
| **Type** | Path resolution utility |
| **What it does** | Automatically detects if MAF is installed as subtree or direct, adjusts paths accordingly |
| **Why valuable** | Eliminates per-project path configuration completely |
| **Universality** | ✅ Works for both subtree and direct installation |
| **Action** | ✅ Add to `scripts/maf/lib/project-root-utils.sh` in Wave 1, Day 1-2 |

**Implementation:**
```bash
cat > /root/projects/maf-github/scripts/maf/lib/project-root-utils.sh <<'EOF'
# Subtree vs Direct Layout Auto-Detection
# From NextNest - eliminates per-project configuration

get_project_root() {
    local DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
        # Subtree layout: go up 3 levels
        echo "$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
    else
        # Direct layout: go up 2 levels
        echo "$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
    fi
}

export PROJECT_ROOT="$(get_project_root)"
EOF
```

**Risk:** Low (additive utility)

---

### 1.6 Role-Based Agent Mapping

| Attribute | Value |
|-----------|-------|
| **Source** | NextNest (already in Architecture Design v2) |
| **Lines** | ~50 (schema + helpers) |
| **Type** | Agent resolution pattern |
| **What it does** | Decouples agent roles (supervisor, reviewer) from agent names (RateRidge, AuditBay) |
| **Why valuable** | Enables projects to use any agent names, core scripts reference roles not hardcoded names |
| **Universality** | ✅ Separation of mechanics (global) vs identity (local) |
| **Status** | Already designed, just needs implementation |
| **Action** | ✅ Add role-utils.sh in Wave 1, Day 5-6 (already in blueprint) |

**Risk:** Low (additive, optional)

---

### 1.7 Agent Startup Wrapper Pattern

| Attribute | Value |
|-----------|-------|
| **Source** | NextNest |
| **Lines** | ~30 |
| **Type** | Agent identity injection |
| **What it does** | Injects agent identity into Claude session via persona prompt and environment variables |
| **Why valuable** | Standardizes how agents "know who they are", works across all Claude-based agent systems |
| **Universality** | ✅ Eliminates per-project agent identity boilerplate |
| **Status** | Untracked file in NextNest subtree |
| **CRITICAL**: MANDATORY dependency for NextNest agent spawning (via rebuild-maf-cli-agents.sh wrapper) |
| **Action** | ✅ Add to `scripts/maf/agent-startup.sh.example` in Wave 1, Day 1-2 |

**Implementation:**
```bash
# Copy as template
cp /root/projects/nextnest/maf/scripts/maf/agent-startup.sh \
   /root/projects/maf-github/scripts/maf/agent-startup.sh.example

# Document in template that NextNest requires this as MANDATORY dependency
# Note: rebuild-maf-cli-agents.sh wraps agent commands using this script
```

**Risk:** Low for HQ (template only), but **HIGH for NextNest migration** (must preserve locally)

---

## Priority 2: Upstream as Pattern (Wave 2)

### 2.1 Worktree Schema

| Attribute | Value |
|-----------|-------|
| **Source** | NextNest's agent-topology.json v2.0.0 |
| **Type** | Schema enhancement |
| **What it does** | Defines worktree structure for parallel feature development |
| **Schema** | `worktrees.implementor-1.worktree_format = "feature/{agent_name}/{bead_id}"` |
| **Why valuable** | Critical for parallel development workflows, prevents merge conflicts |
| **Universality** | ✅ Pattern scales to any domain |
| **Action** | Add to MAF HQ's agent-topology.json schema as **optional** field in Wave 2 |

**Implementation:**
```json
{
  "worktrees": {
    "implementor-1": {
      "enabled": true,
      "worktree_format": "feature/{agent_name}/{bead_id}",
      "auto_cleanup": true
    }
  }
}
```

**Risk:** Low (optional field, backward compatible)

---

### 2.2 Risk-Based Governance Domains

| Attribute | Value |
|-----------|-------|
| **Source** | NextNest's agent-topology.json v2.0.0 |
| **Type** | Governance pattern |
| **What it does** | Defines risk levels (CRITICAL, HIGH, MEDIUM, LOW) with different workflows |
| **Example** | `domains: ["merge-decisions": CRITICAL, "visual-inspection": MEDIUM]` |
| **Why valuable** | Risk-based governance is universally applicable, reduces process overhead |
| **Universality** | ✅ Pattern scales to any domain |
| **Action** | Keep **pattern** in HQ docs, let each project define their own risk domains |

**Risk:** Low (documentation only)

---

### 2.3 Enhanced Helper Scripts (Roundtable)

| Attribute | Value |
|-----------|-------|
| **Source** | Roundtable |
| **Files** | agent-utils.sh, credential-manager.sh, profile-loader.sh |
| **Type** | Enhanced versions |
| **What they do** | Various helper functions for agent operations |
| **Status** | Original analysis mischaracterized these as "enhanced" when some are NEW |
| **Action** | Add to HQ in Wave 2 (after verifying which are actually new vs enhanced) |

**Risk:** Medium (need to verify which are new vs enhanced)

---

## Priority 3: Template Only

### 3.1 Context Manager Wrapper

| Attribute | Value |
|-----------|-------|
| **Source** | NextNest |
| **File** | `context-manager-nextnest.sh` |
| **Type** | Project-specific wrapper |
| **What it does** | Project-specific wrapper for context-manager-v2.sh with environment variables |
| **Why template only** | Too project-specific for global use, good as example for other projects |
| **Action** | Add to `scripts/maf/context-manager-wrapper.sh.example` with project placeholders |

**Implementation:**
```bash
# Copy as template
cp /root/projects/nextnest/maf/scripts/maf/context-manager-nextnest.sh \
   /root/projects/maf-github/scripts/maf/context-manager-wrapper.sh.example

# Edit: Replace NextNest-specific paths with placeholders
# Edit: Replace session name with {PROJECT_SESSION} placeholder
```

**Risk:** Low (template only)

---

## Summary Matrix (CORRECTED)

| Priority | File/Pattern | Source | Lines | Value | Wave | Risk | Status |
|----------|--------------|--------|-------|-------|------|------|--------|
| 1 | clear-stuck-prompts.sh | Roundtable | 82 | Critical | 1 | Low | ✅ Upstream |
| 1 | error-handling.sh | Roundtable | 613 | High | 1 | Low | ✅ Upstream |
| 1 | tmux-utils.sh | Roundtable | 893 | High | 1 | Low | ✅ Upstream |
| 1 | Subtree auto-detection | NextNest | ~20 | Critical | 1 | Low | ✅ Upstream |
| 1 | Role-based mapping | NextNest | ~50 | High | 1 | Low | ✅ Upstream |
| 1 | Agent startup wrapper | NextNest | ~30 | Medium | 1 | Low | ✅ Template |
| 2 | Worktree schema | NextNest | - | Medium | 2 | Low | ✅ Pattern |
| 2 | Risk-based governance | NextNest | - | Medium | 2 | Low | ✅ Pattern |
| 3 | Context manager wrapper | NextNest | ~100 | Low | 2 | Low | ✅ Template |
| ⚠️ | autonomous-workflow.sh | Roundtable | 575 | High | - | Medium | ❌ Needs Refactoring |

**Total Lines to Upstream (Priority 1):** 1,588 lines (not 2,263)

**Excluded:** autonomous-workflow.sh (575 lines) - requires refactoring for role-based lookups

---

## Implementation Order (Wave 1) - CORRECTED

```bash
# Day 1-2: Add all Priority 1 items to HQ (excluding autonomous-workflow.sh)
cd /root/projects/maf-github

# 1. Create lib directory if needed
mkdir -p scripts/maf/lib

# 2. Copy all files (total 1,588 lines)
# NOTE: autonomous-workflow.sh NOT copied - needs refactoring
cp /root/projects/roundtable/scripts/maf/lib/error-handling.sh \
   scripts/maf/lib/error-handling.sh
cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh \
   scripts/maf/lib/tmux-utils.sh
cp /root/projects/roundtable/scripts/maf/clear-stuck-prompts.sh \
   scripts/maf/clear-stuck-prompts.sh

# 3. Create auto-detection utility
cat > scripts/maf/lib/project-root-utils.sh <<'EOF'
# (content from above)
EOF

# 4. Copy startup wrapper as template
cp /root/projects/nextnest/maf/scripts/maf/agent-startup.sh \
   scripts/maf/agent-startup.sh.example

# 5. Verify
echo "=== Upstream Candidates Added ==="
echo "Total lines:"
wc -l scripts/maf/lib/error-handling.sh
wc -l scripts/maf/lib/tmux-utils.sh
wc -l scripts/maf/clear-stuck-prompts.sh
echo "✅ 1,588 lines of battle-tested code added"
echo "⚠️  autonomous-workflow.sh (575 lines) excluded - needs refactoring"
```

---

## NOT Upstream Candidates

These should stay LOCAL:

| Item | Source | Reason |
|------|--------|--------|
| NextNest agent prompts (auditbay, rateridge, etc.) | NextNest | Mortgage-domain specific |
| Roundtable prompt packs | Roundtable | Roundtable-specific workflows |
| Roundtable agent names in config | Roundtable | Project-specific identity |
| Session name "maf-nn" | NextNest | Project-specific override |
| autonomous-workflow.sh | Roundtable | Contains hardcoded agent names, needs refactoring |

---

**Generated:** 2026-01-08
**Source:** Unified Blueprint v3.0 + Verification Feedback
**Status:** CORRECTED - autonomous-workflow.sh removed from Wave 1
**Next:** Execute Wave 1, Day 1-2 to upstream Priority 1 candidates (1,588 lines)
