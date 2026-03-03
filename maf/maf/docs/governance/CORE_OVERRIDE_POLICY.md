# Core Override Policy - Governance and Override Process

**Version:** 1.0
**Last Updated:** 2026-01-10
**MAF Version:** v0.2.x

---

## Purpose

This document defines when and how MAF core files may be overridden in franchisee repositories, and the governance process for managing such overrides.

## Core Principle

**MAF core files (within the `maf/` subtree) should be treated as READ-ONLY in franchisee repositories.**

Modifications to core MAF functionality should be contributed upstream to MAF HQ, not maintained as local forks.

---

## The Three Zones

### Zone 1: Core (Read-Only in Franchises)

**Location:** `maf/lib/maf/`, `maf/scripts/maf/`, `maf/.claude/skills/`

**Purpose:** Core orchestration, mechanics, shared cognitive layer

**Rule:** **NEVER modify in franchisee repos**

**Rationale:**
- Core mechanics are "physics" - changing them breaks the universe
- Shared cognitive layer requires consistency across all franchises
- Bug fixes in core benefit everyone when upstreamed
- Prevents silent forking and divergence

**Examples of Core Files:**
- `maf/lib/maf/core/agent-lifecycle.sh` - Agent spawning logic
- `maf/scripts/maf/spawn-agents.sh` - Agent startup orchestration
- `maf/.claude/skills/response-awareness-full/` - Metacognitive orchestration
- `maf/lib/maf/integration/agent-mail.sh` - Agent mail protocol

### Zone 2: Templates (Copy, Don't Edit)

**Location:** `maf/templates/`

**Purpose:** Examples, starting points, reference implementations

**Rule:** Copy to `.maf/` or project root, then customize

**Rationale:**
- Templates are meant to be adapted to each project
- Keeping copies in project makes customizations explicit
- Easier to update template when upstream changes

**Examples:**
- `maf/templates/agent-topology.json.example` → `.maf/config/agent-topology.json`
- `maf/templates/prompts/` → `.maf/overrides/prompts/`
- `maf/templates/scripts/` → `.maf/overrides/scripts/`

### Zone 3: Local (Never in HQ)

**Location:** `.maf/config/`, `.maf/overrides/`, project-specific directories

**Purpose:** Project identity, customizations, local workflows

**Rule:** Never commit to MAF HQ

**Rationale:**
- These files define what makes each franchise unique
- Project-specific configuration has no place in shared framework
- Keeps HQ repo clean and generic

**Examples:**
- `.maf/config/agent-topology.json` - Project's agent topology
- `.maf/overrides/prompts/` - Custom agent prompts
- `.maf/overrides/scripts/` - Project-specific workflows
- `.maf/CORE_OVERRIDE.md` - Emergency override documentation (if needed)

---

## Override Declaration System

### When Core MUST Be Modified

In rare emergency situations, a franchisee may need to modify core MAF files temporarily. **This is an exceptional circumstance, not a regular practice.**

**Valid Reasons for Emergency Override:**
1. **Critical Bug** - Core MAF has a bug blocking production deployment
2. **Security Issue** - Immediate security vulnerability needs patching
3. **Performance Blocker** - Core MAF is causing severe performance degradation
4. **API Compatibility** - Upstream change breaks critical integration
5. **Temporary Migration** - Transition period during MAF version upgrade

**Invalid Reasons for Override:**
1. **"It's quicker"** - Convenience is not a valid reason
2. **"The PR will take too long"** - Plan ahead, submit PR early
3. **"Our use case is special"** - If truly special, it should be in core
4. **"We'll upstream it later"** - "Later" often never comes

### Override Declaration Format

When a core override is necessary, create `.maf/CORE_OVERRIDE.md`:

```markdown
# Core Modifications in This Repository

## Overview

This repository contains temporary overrides to MAF core files. **This is an exceptional situation.**

## File: maf/scripts/maf/spawn-agents.sh

**Reason:** Nextnest requires custom agent startup sequence for SME workflows

**Date:** 2026-01-10

**Proposed to HQ:** https://github.com/iamnormalfree/maf/pull/42

**Status:** Pending | Rejected | Accepted for v0.3.0 | Emergency Fix

### Technical Details

**What Was Changed:**
- Added `--sme-mode` flag to spawn script
- Modified agent startup order for SME workflow requirements
- Added environment variable `SME_WORKFLOW_ENABLED=true`

**Why This Change Was Necessary:**
Our SME workflows require agents to start in a specific order that differs from the standard MAF startup sequence. This is a temporary measure until the feature is accepted upstream.

**Impact Analysis:**
- Affects agent spawning only
- No impact on agent mail or beads
- No impact on other franchises

### Migration Plan

**How This Will Be Removed or Upstreamed:**

1. **Proposed upstream feature:** Make agent startup order configurable
2. **Target version:** v0.3.0
3. **Timeline:** Remove this override when v0.3.0 is released
4. **Verification:** Test with standard startup sequence after upgrade

**Rollback Plan:**
If upstream PR is rejected, we will:
1. Revert to standard MAF startup sequence
2. Adapt our SME workflows to work within standard constraints
3. Remove this override within 30 days

---

## File: maf/lib/maf/core/agent-mail.sh

**Reason:** Critical bug in message parsing causing data loss

**Date:** 2026-01-10

**Proposed to HQ:** https://github.com/iamnormalfree/maf/pull/43

**Status:** Emergency Fix

### Technical Details

**What Was Changed:**
- Fixed regex in message parsing function
- Added validation for malformed messages
- Added logging for parsing failures

**Why This Change Was Necessary:**
Messages with certain character sequences were being silently dropped, causing agent coordination failures.

**Impact Analysis:**
- Affects all agent mail operations
- Critical for production stability
- No security impact

### Migration Plan

**How This Will Be Removed or Upstreamed:**

1. **Proposed upstream fix:** Merge emergency PR immediately
2. **Target version:** v0.2.10 (hotfix)
3. **Timeline:** Remove override within 7 days of hotfix release
4. **Verification:** Monitor agent mail logs for parsing errors

**Rollback Plan:**
Not applicable - this is a critical bug fix that must be upstreamed.
```

---

## Governance Process

### Step 1: Attempt Standard Workflow First

Before creating a core override:

1. **Check if there's an existing solution**
   ```bash
   # Search MAF docs and examples
   grep -r "your problem" maf/docs/
   ```

2. **Check if configuration can solve it**
   ```bash
   # Review available config options
   cat .maf/config/agent-topology.json
   ```

3. **Check if Zone 3 override is possible**
   ```bash
   # Can you override in .maf/overrides/ instead?
   ```

### Step 2: Submit Upstream PR

If core modification is truly necessary:

1. **Create upstream PR** to `iamnormalfree/maf`
   - Title: `[FEATURE/BUGFIX]: Brief description`
   - Body: Explain the problem, solution, impact
   - Tag with appropriate labels

2. **Document local override** in `.maf/CORE_OVERRIDE.md`
   - Link to upstream PR
   - Explain why temporary override is needed
   - Set timeline for removal

3. **Implement local override** as last resort
   - Copy modified file to `.maf/overrides/` if possible
   - Only modify in `maf/` subtree if absolutely necessary

### Step 3: CI Enforcement

**MAF HQ provides CI guard for franchisee repos:**

```yaml
# .github/workflows/maf-subtree-guard.yml
name: MAF Subtree Guard
on: pull_request
jobs:
  check-subtree-integrity:
    runs-on: ubuntu-latest
    steps:
      - name: Check if maf/ was modified
        run: |
          if git diff --name-only origin/main...HEAD | grep -q "^maf/"; then
            echo "::error::maf/ subtree should not be modified directly."
            echo "Changes to MAF core must go through HQ PR."
            echo "If this is an emergency override, update .maf/CORE_OVERRIDE.md"
            exit 1
          fi
```

**CI Guard Behavior:**
- Blocks PRs that modify `maf/` subtree
- Checks if `.maf/CORE_OVERRIDE.md` exists and is updated
- Requires explicit override documentation for exceptions
- Fails if override lacks upstream PR link

### Step 4: Regular Audit

**Weekly "MAF Wednesday" Process:**

1. **Review all active core overrides**
   ```bash
   # Find all repos with CORE_OVERRIDE.md
   find . -name "CORE_OVERRIDE.md" -exec echo "Found override in: {}" \;
   ```

2. **Check upstream PR status**
   - Are PRs making progress?
   - Any PRs rejected? (Need rollback plan)
   - Any PRs accepted? (Remove override)

3. **Update override timeline**
   - Set target version for each override
   - Track removal dates
   - Escalate stale overrides

4. **Report to MAF HQ**
   - Summary of active overrides across all franchises
   - PRs needing review
   - Patterns suggesting core needs enhancement

---

## Emergency Override Procedure

### When to Use Emergency Override

**Criteria for Emergency Override:**
- Production is down or severely degraded
- Standard workaround is not possible
- Impact is time-critical (customers affected)
- Upstream fix cannot wait (even expedited PR)

### Emergency Override Process

1. **Implement emergency fix**
   ```bash
   # Modify core file directly
   vi maf/scripts/maf/critical-script.sh
   ```

2. **Document immediately**
   ```bash
   # Create/update override documentation
   vi .maf/CORE_OVERRIDE.md
   ```

3. **Submit expedited upstream PR**
   ```bash
   # PR with "EMERGENCY" label and high priority
   gh pr create --label emergency --priority high
   ```

4. **Notify MAF HQ**
   ```bash
   # Send escalation notification
   maf escalate --subject "[EMERGENCY]: Core override in $(git config get remote.origin.url)"
   ```

5. **Schedule cleanup**
   - Set 7-day deadline for upstream merge
   - Plan rollback if PR rejected
   - Document rollback procedure

---

## Override Anti-Patterns

### Anti-Pattern 1: "Permanent Temporary" Override

**Symptom:** Override has been in place for months with no upstream PR

**Solution:**
- Submit upstream PR immediately
- If rejected, plan rollback within 30 days
- If accepted, remove override when merged

### Anti-Pattern 2: Undocumented Override

**Symptom:** Core files modified, no `.maf/CORE_OVERRIDE.md` exists

**Solution:**
- Create override documentation immediately
- Explain what was changed and why
- Link to upstream PR (submit one if missing)

### Anti-Pattern 3: Override by Convenience

**Symptom:** Override created because "it was easier than upstreaming"

**Solution:**
- Delete override
- Submit proper upstream PR with thorough documentation
- Wait for merge (plan timeline accordingly)

### Anti-Pattern 4: Zombie Override

**Symptom:** Upstream PR was merged, but override remains

**Solution:**
- Pull latest MAF version with fix
- Remove override
- Delete `.maf/CORE_OVERRIDE.md` if no other overrides

---

## Compliance and Enforcement

### Automated Checks

**Subtree Health Check:**
```bash
# maf/scripts/maf/status/check-subtree-health.sh
Output:
✅ Subtree: Clean (no local modifications)
⚠️  Subtree: 2 files modified (check .maf/CORE_OVERRIDE.md)
❌ Subtree: 5 files modified (NO OVERRIDE DOCUMENTATION)
```

**CI Integration:**
- PRs modifying `maf/` are blocked by default
- Exception requires `.maf/CORE_OVERRIDE.md` with valid upstream PR
- Weekly audit reports are auto-generated

### Manual Review

**Code Review Checklist:**
- [ ] Does this change modify `maf/` subtree?
- [ ] If yes, is there an active upstream PR?
- [ ] Is `.maf/CORE_OVERRIDE.md` updated?
- [ ] Is the reason well-documented?
- [ ] Is there a timeline for removal?
- [ ] Is there a rollback plan?

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-10 | Initial version from franchise architecture design |

---

**This document is part of the MAF governance layer.**
**It defines the contract between MAF HQ and franchisee repositories.**
**Core overrides are exceptional, not normal.**
