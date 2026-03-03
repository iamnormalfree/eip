# Verification Feedback Integration: Critical Corrections

**Date:** 2026-01-08
**Status:** CRITICAL - Migration plan updates required
**Source:** Roundtable and NextNest verification reports

---

## Executive Summary

Both repos provided comprehensive verification that validates our research AND reveals critical gaps in our migration plan:

**✅ VALIDATED:**
- All line counts were EXACTLY CORRECT (2,163 total)
- All file existence claims confirmed
- Migration approach directionally sound

**🚨 CRITICAL CORRECTIONS NEEDED:**
1. NextNest root/subtree relationship was REVERSED in our documents
2. autonomous-workflow.sh is NOT upstream-ready (needs refactoring)
3. Session name change strategy must be revised
4. Memlayer dependencies are BROKEN (new finding)
5. Enhanced script preservation strategy needed for Roundtable

---

## Critical Correction #1: NextNest Root/Subtree Relationship

### What We Claimed (WRONG):
```
Root config (.maf/config/):    v1.0.0, session "maf-cli"
Subtree config (maf/.maf/config): v2.0.0, session "maf-nn"
```

### What Actually Exists (CORRECT):
```
Root config (.maf/config/):    v2.0.0, session "maf-nn" (ENHANCED, OUTSIDE subtree)
Subtree config (maf/.maf/config): v1.0.0, session "maf-cli" (PRISTINE from HQ)
```

### Impact: **MIGRATION IS SAFER THAN WE THOUGHT**

**Why This Matters:**
- ✅ v2.0.0 enhancements are in ROOT config (outside subtree)
- ✅ Restoring subtree to pristine is SAFE - won't delete v2.0.0 features
- ✅ Subtree is already v1.0.0 from HQ (just has NextNest agent names)

### Correction Required:

**UPDATE all references to NextNest's dual config:**

```markdown
# CORRECTED:

NextNest Configuration State:
- Root config (.maf/config/agent-topology.json): v2.0.0, session "maf-nn"
  - This is OUTSIDE the subtree
  - Contains enhanced features (metadata, agent_type_mappings, worktrees)
  - Will NOT be affected by subtree restore

- Subtree config (maf/.maf/config/agent-topology.json): v1.0.0, session "maf-cli"
  - This is INSIDE the subtree
  - Pristine from HQ (just has NextNest agent names swapped in)
  - Will be restored to HQ generic names during Wave 2
```

---

## Critical Correction #2: Session Name Strategy

### What We Planned (WRONG):
Standardize all repos to "maf-cli"

### What NextNest Recommends (CORRECT):
Keep "maf-nn" - current state works

**Why:**
- Root config and context manager already use "maf-nn" (consistent)
- Agents currently running in "maf-nn" session
- Changing to "maf-cli" would break active workflows
- Subtree config uses "maf-cli" but gets overridden by env vars

### Revised Strategy:

**For NextNest:**
- Keep "maf-nn" in root config and context manager
- Update subtree config to "maf-nn" to match
- OR accept subtree config at HQ default "maf-cli" with env var override

**For Roundtable & HQ:**
- Continue using "maf-cli" (already consistent)

### Correction Required:

**UPDATE session name standardization section:**

```markdown
# Session Name Standardization - REVISED

## Standard by Repo:
- MAF HQ: "maf-cli"
- Roundtable: "maf-cli"
- NextNest: "maf-nn" (keep existing working session)

## Rationale:
NextNest's v2.0.0 config (root) and context manager already use "maf-nn".
Changing would break active agent workflows. Current state works.
```

---

## Critical Correction #3: autonomous-workflow.sh NOT Upstream-Ready

### What We Claimed:
✅ Upstream as-is (575 lines, bead lifecycle orchestration)

### Reality (Roundtable Verification):
❌ Contains HARDCODED Roundtable agent names:
```bash
# Found in autonomous-workflow.sh:
- "Route to BlackDog for review"
- "Requesting review from BlackDog"
- --sender_name "GreenMountain"
- --to "blackdog"
- Agent aliases: orangepond, fuchsiacreek
```

**Verdict:** NOT generic enough to upstream without refactoring

### Impact on Upstream Candidates Matrix:

**REMOVE from Wave 1 upstream:**
- ❌ autonomous-workflow.sh (575 lines) - needs refactoring first

**KEEP in Wave 1 upstream:**
- ✅ clear-stuck-prompts.sh (82 lines) - production-critical
- ✅ error-handling.sh (613 lines) - NEW file
- ✅ tmux-utils.sh (893 lines) - NEW file

**Total for Wave 1 upstream: 1,588 lines** (not 2,163)

### Required Action:

**Create follow-up issue:**
```markdown
# Issue: Refactor autonomous-workflow.sh for Generic Agent Support

Before upstreaming to MAF HQ:
1. Replace hardcoded agent names with role-based lookups
2. Use get_agent_by_role() for agent resolution
3. Remove Roundtable-specific references

Estimated effort: 2-4 hours

Files to update:
- scripts/maf/autonomous-workflow.sh
```

---

## Critical Correction #4: Enhanced Script Preservation

### Problem Identified (Roundtable):
Wave 2 subtree pull could OVERWRITE enhanced scripts in Roundtable

**At Risk:**
- error-handling.sh (613 lines, NEW in Roundtable)
- tmux-utils.sh (893 lines, NEW in Roundtable)
- clear-stuck-prompts.sh (82 lines, production-critical)
- Other enhanced library scripts

### Required Mitigation:

**ADD to Wave 2 (Roundtable) BEFORE subtree pull:**

```bash
# Step 1: Create backups
mkdir -p scripts/maf/lib/.backup
mkdir -p scripts/maf/.backup

cp scripts/maf/lib/error-handling.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/tmux-utils.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/agent-utils.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/credential-manager.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/profile-loader.sh scripts/maf/lib/.backup/
cp scripts/maf/clear-stuck-prompts.sh scripts/maf/.backup/

# Step 2: Pull subtree
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Step 3: Restore enhanced versions
cp scripts/maf/lib/.backup/* scripts/maf/lib/
cp scripts/maf/.backup/clear-stuck-prompts.sh scripts/maf/

# Step 4: Verify
bash scripts/maf/spawn-agents.sh --dry-run
bash scripts/maf/status/check-subtree-health.sh
```

---

## Critical Correction #5: Memlayer Dependencies (NEW)

### Finding (NextNest):
Memlayer scripts are referenced but DON'T EXIST

**Evidence:**
```bash
# From context-manager-v2.sh lines 22, 25:
AGENT_MAIL_FETCH_SCRIPT="${MAF_AGENT_MAIL_FETCH_SCRIPT:-/root/projects/nextnest/maf/scripts/memlayer/fetch-agent-mail.sh}"
MEMORY_SCRIPT="${MAF_MEMORY_SCRIPT:-/root/projects/nextnest/maf/scripts/memlayer/push-memlayer.sh}"

# Reality:
$ ls -la maf/scripts/memlayer/
ls: cannot access 'maf/scripts/memlayer/': No such file or directory
```

**Impact:** Memory and agent-mail features FAIL SILENTLY

### Required Action:

**ADD to Wave 2 (NextNest) cleanup:**

```bash
# Option 1: Remove broken references
# Update context-manager-v2.sh to not call memlayer scripts

# Option 2: Implement memlayer properly
# Create or copy memlayer scripts from source

# Option 3: Document as known limitation
# Add to known issues list
```

---

## Critical Correction #6: Response Awareness Structure

### What We Claimed:
"Different locations (skills/ vs commands/)"

### Reality (Roundtable Verification):
**MAJOR STRUCTURAL DIFFERENCE:**

| Aspect | HQ | Roundtable |
|--------|-----|------------|
| Location | .claude/skills/ | .claude/commands/ |
| Format | Folders with skill.md | Flat .md files |
| Count | 4 RA skills | 5 RA commands |
| Structure | response-awareness-full/ | response-awareness.md |

**Files in Roundtable .claude/commands/:**
- response-awareness.md (17,374 bytes - main command)
- response-awareness-implement.md
- response-awareness-light.md
- response-awareness-plan.md
- response-awareness-roundtable.md

### Impact:

This is NOT a minor difference - it's a significant structural mismatch that affects:
1. Migration compatibility
2. Skill discovery mechanisms
3. How skills are loaded and invoked

---

## Critical Correction #7: agent-startup.sh Dependency Lines

### What We Claimed:
"Referenced by rebuild-maf-cli-agents.sh"

### Reality (NextNest Verification):
Referenced at **3 specific lines**: 47, 273, 284

**Evidence:**
```bash
$ grep -n "agent-startup.sh" maf/scripts/maf/rebuild-maf-cli-agents.sh
47:AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"
273:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd
284:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd
```

### Required Correction:

**UPDATE Wave 2 (NextNest) to include all 3 line updates:**

```bash
# When moving agent-startup.sh to scripts/maf/:
# Must update rebuild-maf-cli-agents.sh lines 47, 273, 284:

# BEFORE:
AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"

# AFTER:
AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/scripts/maf/agent-startup.sh"

# Verify all 3 locations updated
grep -n "AGENT_STARTUP_WRAPPER" maf/scripts/maf/rebuild-maf-cli-agents.sh
```

---

## Critical Correction #8: Hardcoded Paths More Extensive

### What We Documented:
Limited hardcoded paths in a few files

### Reality (Both Repos):
**MUCH MORE WIDESPREAD**

**Roundtable additional files:**
- start-bead-agents.sh
- setup-worktrees.sh
- memlayer-config.json
- receipt.sh
- test-memlayer-in-tmux.sh
- init-claude-agents-v2.sh
- analyze-coordination-quality.sh
- maintenance/check-disk.sh
- **PLUS 10 hook scripts** in .claude/settings.json

**NextNest confirmed:**
- context-manager-v2.sh has 10+ references
- rebuild-maf-cli-agents.sh has SESSION_NAME="maf-nn"
- All use ${VAR:-default} fallback syntax (can be overridden by env vars)

### Required Addition:

**ADD to Phase 0 (Pre-Migration Validation):**

```bash
# Comprehensive hardcoded path audit
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
  -exec grep -l "/root/projects/" {} \; > /tmp/all-hardcoded-paths.txt

# Categorize by severity
echo "Scripts with hardcoded paths:"
cat /tmp/all-hardcoded-paths.txt

# Determine which can be:
# 1. Made generic with PROJECT_ROOT
# 2. Replaced with env var defaults
# 3. Left as-is (acceptable for local scripts)
```

---

## Updated Upstream Candidates Matrix

### Wave 1: Upstream Immediately (REVISED)

| File | Source | Lines | Status | Action |
|------|--------|-------|--------|--------|
| `clear-stuck-prompts.sh` | Roundtable | 82 | ✅ Production-critical | **DO upstream** |
| `error-handling.sh` | Roundtable | 613 | ✅ NEW file | **DO upstream** |
| `tmux-utils.sh` | Roundtable | 893 | ✅ NEW file | **DO upstream** |
| Subtree auto-detection | NextNest | ~20 | ✅ Valuable pattern | **DO upstream** |
| Role-based mapping | Design | ~50 | ✅ Flexibility | **DO upstream** |
| Agent startup wrapper | NextNest | ~30 | ✅ Template | **DO upstream** as template |
| `autonomous-workflow.sh` | Roundtable | 575 | ❌ Hardcoded names | **DO NOT upstream** - needs refactoring |

**REVISED Total: 1,588 lines** (not 2,163)

---

## Revised Migration Plan Impact

### Wave 1 Impact: MINIMAL

Still safe to proceed with:
- Adding CI guards
- Adding health checks
- Upstreaming 1,588 lines (excluding autonomous-workflow.sh)

### Wave 2 Impact: SIGNIFICANT CHANGES

**For Roundtable (Days 15-18):**

**ADD BEFORE subtree pull:**
1. Backup all enhanced library scripts
2. Backup clear-stuck-prompts.sh
3. Pull subtree
4. Restore enhanced versions
5. Test agent spawn

**For NextNest (Days 11-14):**

**REVISED session name strategy:**
1. KEEP "maf-nn" in root config and context manager
2. Update subtree config to "maf-nn" to match
3. DO NOT change to "maf-cli"

**ADD to cleanup:**
1. Fix or remove memlayer references
2. Delete backup files (*.old, *backup*)
3. Update agent-startup.sh references (3 lines: 47, 273, 284)

---

## Summary of Document Updates Required

### Update These Documents:

1. **maf-franchise-migration-unified-blueprint.md**
   - Fix NextNest root/subtree relationship (it's reversed)
   - Remove autonomous-workflow.sh from Wave 1 upstream
   - Update session name strategy for NextNest
   - Add memlayer broken dependencies
   - Add enhanced script backup strategy

2. **repo-specific-actions.md**
   - Fix NextNest session name changes (keep maf-nn)
   - Fix agent-startup.sh line number references (3 lines)
   - Add memlayer fix step
   - Add backup step for Roundtable enhanced scripts

3. **upstream-candidates-matrix.md**
   - Remove autonomous-workflow.sh from Priority 1
   - Add note: "Requires refactoring for role-based lookups"
   - Update total line count to 1,588

4. **migration-execution-summary.md**
   - Fix root/subtree reversal note
   - Update "What Changed" section with new findings
   - Correct total upstream line count

---

## Verification Report Summary

### ✅ VALIDATED (Our Research Was Accurate)

1. **All line counts** - EXACTLY CORRECT
2. **All file existence claims** - VERIFIED
3. **Script direction** - Roundtable → HQ (confirmed)
4. **Role-based compatibility** - Works with Roundtable topology
5. **Response Awareness difference** - Confirmed as major structural mismatch
6. **MAF HQ contamination** - Confirmed (but nuanced on config vs prompts)

### ⚠️ CORRECTIONS NEEDED (Our Plans Need Updates)

1. **NextNest root/subtree** - Had it reversed, now corrected
2. **autonomous-workflow.sh** - Not upstream-ready, remove from Wave 1
3. **Session names** - Keep "maf-nn" for NextNest, don't force "maf-cli"
4. **Enhanced scripts** - Need backup/restore strategy for Roundtable
5. **Memlayer dependencies** - Broken, need fix or removal
6. **agent-startup.sh lines** - Need to update 3 specific lines (47, 273, 284)
7. **Hardcoded paths** - More extensive than documented

### 🚨 NEW FINDINGS (Not Previously Known)

1. **Memlayer dependencies broken** - Scripts don't exist but referenced
2. **Response Awareness major structural difference** - Not just location, but format/structure
3. **autonomous-workflow.sh hardcoded names** - Makes it Roundtable-specific
4. **Hook scripts hardcoded paths** - 10 additional files with hardcoded paths

---

## Next Steps

1. **✅ PROCEED with Wave 1** (low-risk, additive only)
   - Upstream 1,588 lines (excluding autonomous-workflow.sh)
   - Add CI guards and health checks
   - DO NOT include autonomous-workflow.sh

2. **⚠️ UPDATE Wave 2 plans** with corrections above
   - Fix NextNest session name strategy
   - Add backup/restore for Roundtable enhanced scripts
   - Add memlayer fix step
   - Update agent-startup.sh path references

3. **📋 CREATE issue for autonomous-workflow.sh refactoring**
   - Title: "Refactor autonomous-workflow.sh for Generic Agent Support"
   - Estimated effort: 2-4 hours
   - Block upstreaming until complete

4. **🧪 ADD testing step** before Wave 2 execution
   - Test agent spawn in Roundtable after subtree pull
   - Test agent spawn in NextNest after agent-startup.sh move
   - Verify memlayer references handled

---

**Recommendation:** The verification feedback validates our research approach while revealing critical gaps. Update the migration plan with corrections above before executing Wave 2. Wave 1 remains safe to proceed.

**Risk Level Update:**
- Wave 1: LOW (unchanged)
- Wave 2: MEDIUM → HIGH (without corrections) → MEDIUM (with corrections applied)
