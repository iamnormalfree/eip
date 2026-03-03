# V3 Corrections Summary - Migration Documents

**Date:** 2026-01-08  
**Purpose:** Document all corrections applied to migration documents based on v2 verification feedback from Roundtable and NextNest repos  
**Status:** COMPLETE - All 4 documents corrected

---

## Critical Corrections Applied

### 1. NextNest Root/Subtree Relationship - REVERTED to Original ✅

**WHAT WAS WRONG (v2 "correction"):**
- Claimed: Root config is v2.0.0, session "maf-nn"
- Claimed: Subtree config is v1.0.0, session "maf-cli"
- Assessment: "Safer than thought" ❌

**WHAT IS CORRECT (original notes-from-nextnest.md was RIGHT):**
- Root config (.maf/config/): **v1.0.0**, session "maf-cli"
- Subtree config (maf/.maf/config/): **v2.0.0**, session "maf-nn"

**IMPACT:** 
- Subtree restore will **LOSE v2.0.0 enhancements** if not preserved
- Must preserve v2.0.0 to root config BEFORE any subtree restore
- v2.0.0 includes: metadata, agent_type_mappings, worktrees schema

**VERIFICATION SOURCE:** NextNest v2 verification  
**DOCUMENTS UPDATED:**
- maf-franchise-migration-unified-blueprint.md (lines 92-93, 102, 187-188)
- repo-specific-actions.md (lines 512-513)
- migration-execution-summary.md (line 30)

**CORRECTION DETAILS:**
```
Changed FROM:
  .maf/config/agent-topology.json     → v2.0.0 schema, session "maf-nn" (ENHANCED, OUTSIDE subtree)
  maf/.maf/config/agent-topology.json → v1.0.0 schema, session "maf-cli" (PRISTINE from HQ)

Changed TO:
  .maf/config/agent-topology.json     → v1.0.0 schema, session "maf-cli" (PRISTINE from HQ)
  maf/.maf/config/agent-topology.json → v2.0.0 schema, session "maf-nn" (ENHANCED, within subtree)
```

**UPDATED INSTRUCTIONS:**
- Before any subtree restore: Backup maf/.maf/config/agent-topology.json
- After subtree restore: Copy v2.0.0 config back to subtree location
- OR: Preserve v2.0.0 enhancements to root config before restore

---

### 2. Memlayer Script Paths - Corrected ✅

**WHAT WAS WRONG:**
- Referenced paths: `maf/scripts/memlayer/fetch-agent-mail.sh`
- Referenced paths: `maf/scripts/memlayer/push-memlayer.sh`

**WHAT IS CORRECT:**
- Actual path: `maf/scripts/maf/agent-mail-fetch.sh`
- Actual path: `maf/scripts/maf/agent-memory.sh`

**VERIFICATION SOURCE:** NextNest v2 verification  
**DOCUMENTS UPDATED:**
- maf-franchise-migration-unified-blueprint.md (lines 567-569)
- repo-specific-actions.md (lines 598-601)

**CORRECTION DETAILS:**
```bash
Changed FROM:
  echo "Scripts referenced but don't exist:"
  echo "  - maf/scripts/memlayer/fetch-agent-mail.sh"
  echo "  - maf/scripts/memlayer/push-memlayer.sh"

Changed TO:
  echo "Scripts referenced but don't exist:"
  echo "  - maf/scripts/maf/agent-mail-fetch.sh"
  echo "  - maf/scripts/maf/agent-memory.sh"
```

---

### 3. Enhanced Scripts - Clarified "NEW" vs "Enhanced" ✅

**WHAT WAS WRONG:**
- Claimed: "4 enhanced scripts from Roundtable"
- Implication: HQ has older versions, Roundtable enhanced them

**WHAT IS CORRECT (from Roundtable v2 verification):**
- error-handling.sh: **NEW file** (613 lines) - HQ doesn't have it at all
- tmux-utils.sh: **NEW file** (893 lines) - HQ doesn't have it at all
- Roundtable's versions are enhanced compared to HQ's older versions
- Still means: **Backup/restore is CRITICAL for Wave 2**

**VERIFICATION SOURCE:** Roundtable v2 verification  
**DOCUMENTS UPDATED:**
- maf-franchise-migration-unified-blueprint.md (lines 64-66, 253-256, 810-812)
- repo-specific-actions.md (lines 87-91, 424-428)
- upstream-candidates-matrix.md (lines 100-101, 129-130, 286-290)

**CORRECTION DETAILS:**
```
Clarified that these are NEW files (not just enhancements):
- error-handling.sh: 613 lines, NEW in Roundtable (not in HQ)
- tmux-utils.sh: 893 lines, NEW in Roundtable (not in HQ)
- clear-stuck-prompts.sh: 82 lines, production-critical, Roundtable-only
```

**IMPACT:**
- Wave 1: Add these 3 NEW files to HQ (1,588 lines total)
- Wave 2 (Roundtable): Backup before subtree pull, restore after (CRITICAL)

---

### 4. Session Name Strategy - Keep Current Working State ✅

**WHAT WAS WRONG:**
- Suggested: "Standardize to maf-cli everywhere"
- Implication: Change NextNest to use "maf-cli"

**WHAT IS CORRECT (from NextNest v2 verification):**
- Current state works: subtree is "maf-nn", context manager is "maf-nn", active session is "maf-nn"
- Root config is "maf-cli" but gets overridden
- Recommendation: **Don't change anything**

**VERIFICATION SOURCE:** NextNest v2 verification  
**DOCUMENTS UPDATED:**
- maf-franchise-migration-unified-blueprint.md (lines 423-476)
- repo-specific-actions.md (lines 254-277, 561-567)
- migration-execution-summary.md (line 32)

**CORRECTION DETAILS:**
```bash
Standard by Repo:
- MAF HQ: "maf-cli" (already standard)
- Roundtable: "maf-cli" (already standard)
- NextNest: "maf-nn" (KEEP existing working session)

Rationale:
- Root config and context manager already use "maf-nn" (consistent)
- Agents currently running in "maf-nn" session
- Changing to "maf-cli" would break active workflows
- Current state works
```

**NEXTNEST'S 3 SESSION LOCATIONS:**
1. `.maf/config/agent-topology.json` (root) - "maf-cli" (PRISTINE from HQ)
2. `maf/.maf/config/agent-topology.json` (subtree) - "maf-nn" (ENHANCED, within subtree)
3. `maf/scripts/maf/context-manager-nextnest.sh` - `MAF_TMUX_SESSION="maf-nn"`

**UPDATED STRATEGY:**
- Keep "maf-nn" in subtree config and context manager
- Root config "maf-cli" gets overridden by env vars
- No changes needed - current state works

---

### 5. Hardcoded Paths - More Widespread ✅

**WHAT WAS WRONG:**
- Claimed: "8 files with hardcoded paths"
- Limited audit scope

**WHAT IS CORRECT:**
- Roundtable: **56 files** with hardcoded paths
- NextNest: **15 files** with hardcoded paths
- Audit must be comprehensive

**VERIFICATION SOURCE:** Roundtable v2 verification + NextNest v2 verification  
**DOCUMENTS UPDATED:**
- maf-franchise-migration-unified-blueprint.md (lines 31, 874)
- repo-specific-actions.md (lines 20-32)
- migration-execution-summary.md (line 37)

**CORRECTION DETAILS:**
```
Updated audit scope:
- Roundtable: 56 files (not 8)
- NextNest: 15 files
- Total: 71+ files with hardcoded paths across both repos
```

**UPDATED AUDIT COMMAND:**
```bash
# Find all hardcoded paths (comprehensive)
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.md" \) \
  -exec grep -l "/root/projects/" {} \; > /tmp/hardcoded-paths.txt
```

---

## Changes Summary by Document

### 1. maf-franchise-migration-unified-blueprint.md

**Lines Changed:**
- 92-93: NextNest root/subtree relationship REVERTED
- 102: Critical issues updated
- 187-188: Session name chaos description corrected
- 253-256: Enhanced scripts clarified as NEW
- 423-476: Session name strategy revised (keep maf-nn)
- 567-569: Memlayer paths corrected
- 810-812: Upstream candidates clarified as NEW files
- 874: Hardcoded path risk updated

**Total Changes:** 8 sections updated

---

### 2. repo-specific-actions.md

**Lines Changed:**
- 20-32: Path audit expanded
- 87-91: Enhanced scripts clarified as NEW
- 254-277: Session name policy revised
- 424-428: Enhanced scripts backup clarified
- 512-513: NextNest root/subtree corrected
- 561-567: Session name strategy revised
- 598-601: Memlayer paths corrected

**Total Changes:** 7 sections updated

---

### 3. upstream-candidates-matrix.md

**Lines Changed:**
- 100-101: error-handling.sh clarified as NEW
- 129-130: tmux-utils.sh clarified as NEW
- 286-290: Enhanced helpers section clarified

**Total Changes:** 3 sections updated

---

### 4. migration-execution-summary.md

**Lines Changed:**
- Line 30: NextNest root/subtree relationship corrected
- Line 32: Session name policy revised
- Line 37: Hardcoded path audit expanded

**Total Changes:** 3 lines updated

---

## Verification Sources

### Roundtable v2 Verification
- Confirmed: 56 files with hardcoded paths (not 8)
- Confirmed: error-handling.sh is NEW (613 lines), not just enhanced
- Confirmed: tmux-utils.sh is NEW (893 lines), not just enhanced
- Confirmed: Roundtable's versions are enhanced compared to HQ's older versions

### NextNest v2 Verification
- Confirmed: Root config is v1.0.0, session "maf-cli" (REVERSED from v2 claim)
- Confirmed: Subtree config is v2.0.0, session "maf-nn" (REVERSED from v2 claim)
- Confirmed: 15 files with hardcoded paths
- Confirmed: Current session state works (maf-nn)
- Confirmed: Memlayer script paths are different than documented

---

## Impact Assessment

### HIGH IMPACT Changes
1. **NextNest root/subtree relationship REVERTED**
   - Impact: Subtree restore will LOSE v2.0.0 enhancements
   - Action required: Preserve v2.0.0 config before restore
   - Risk: HIGH if not addressed

2. **Enhanced scripts clarified as NEW**
   - Impact: Wave 1 upstreaming confirmed (1,588 lines)
   - Impact: Wave 2 backup/restore confirmed CRITICAL
   - Risk: MEDIUM-HIGH (Roundtable production)

### MEDIUM IMPACT Changes
3. **Memlayer paths corrected**
   - Impact: Fix commands now accurate
   - Risk: LOW (documentation fix)

4. **Session name strategy revised**
   - Impact: No changes needed for NextNest
   - Risk: LOW (keep current state)

5. **Hardcoded paths expanded**
   - Impact: More comprehensive audit needed
   - Risk: MEDIUM (more files to fix)

---

## Validation Status

### Wave 1 Remains Safe ✅
- 1,588 lines confirmed by both repos
- autonomous-workflow.sh exclusion confirmed
- Additive changes only (no deletions)

### Wave 2 Changes Required ⚠️
- NextNest: Preserve v2.0.0 config before subtree restore
- Roundtable: Backup enhanced scripts before subtree pull
- Both: Expanded hardcoded path audit

### Session Names ✅
- Keep current working state
- No changes needed

---

## Next Steps

1. **Review corrected documents** - All 4 documents updated
2. **Validate corrections** - Cross-reference with verification feedback
3. **Update execution plans** - Ensure Wave 2 reflects corrections
4. **Execute with confidence** - Wave 1 remains safe (1,588 lines)

---

**Generated:** 2026-01-08  
**Status:** All corrections applied  
**Confidence:** HIGH - Based on v2 verification from both repos
