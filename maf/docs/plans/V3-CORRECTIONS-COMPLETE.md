# MAF Migration Documents - V3 Corrections Complete

**Date:** 2026-01-08  
**Task:** Correct ALL 4 migration documents based on v2 verification feedback  
**Status:** ✅ COMPLETE - All corrections applied and validated

---

## Documents Updated

1. ✅ `/root/projects/maf-github/docs/plans/maf-franchise-migration-unified-blueprint.md`
2. ✅ `/root/projects/maf-github/docs/plans/repo-specific-actions.md`
3. ✅ `/root/projects/maf-github/docs/plans/upstream-candidates-matrix.md`
4. ✅ `/root/projects/maf-github/docs/plans/migration-execution-summary.md`
5. ✅ `/root/projects/maf-github/docs/plans/V3-CORRECTIONS-SUMMARY.md` (NEW)

---

## Summary of All Corrections Applied

### Correction 1: NextNest Root/Subtree Relationship - REVERTED ✅

**Original (WRONG):**
```
.maf/config/agent-topology.json     → v2.0.0 schema, session "maf-nn" (ENHANCED, OUTSIDE subtree)
maf/.maf/config/agent-topology.json → v1.0.0 schema, session "maf-cli" (PRISTINE from HQ)
```

**Corrected (RIGHT):**
```
.maf/config/agent-topology.json     → v1.0.0 schema, session "maf-cli" (PRISTINE from HQ)
maf/.maf/config/agent-topology.json → v2.0.0 schema, session "maf-nn" (ENHANCED, within subtree)
```

**Impact:** Subtree restore will LOSE v2.0.0 enhancements (metadata, agent_type_mappings, worktrees schema) if not preserved.

**Files Updated:**
- maf-franchise-migration-unified-blueprint.md
- repo-specific-actions.md
- migration-execution-summary.md

---

### Correction 2: Memlayer Script Paths - Corrected ✅

**Original (WRONG):**
```
maf/scripts/memlayer/fetch-agent-mail.sh
maf/scripts/memlayer/push-memlayer.sh
```

**Corrected (RIGHT):**
```
maf/scripts/maf/agent-mail-fetch.sh
maf/scripts/maf/agent-memory.sh
```

**Files Updated:**
- maf-franchise-migration-unified-blueprint.md
- repo-specific-actions.md

---

### Correction 3: Enhanced Scripts - Clarified as NEW ✅

**Original Claim:** "4 enhanced scripts from Roundtable"

**Corrected Reality:**
- error-handling.sh: **NEW file** (613 lines) - HQ doesn't have it
- tmux-utils.sh: **NEW file** (893 lines) - HQ doesn't have it
- clear-stuck-prompts.sh: **NEW file** (82 lines) - Roundtable-only
- Total: **1,588 lines** (not 2,163)

**Files Updated:**
- maf-franchise-migration-unified-blueprint.md
- repo-specific-actions.md
- upstream-candidates-matrix.md
- migration-execution-summary.md

---

### Correction 4: Session Name Strategy - Keep Current ✅

**Original (WRONG):** "Standardize to maf-cli everywhere"

**Corrected (RIGHT):** 
- MAF HQ: "maf-cli"
- Roundtable: "maf-cli"
- NextNest: "maf-nn" (KEEP existing working session)

**Rationale:** Current state works - changing NextNest would break active workflows.

**Files Updated:**
- maf-franchise-migration-unified-blueprint.md
- repo-specific-actions.md
- migration-execution-summary.md

---

### Correction 5: Hardcoded Paths - Expanded Scope ✅

**Original Claim:** "8 files with hardcoded paths"

**Corrected Reality:**
- Roundtable: **56 files**
- NextNest: **15 files**
- Total: **71+ files**

**Files Updated:**
- maf-franchise-migration-unified-blueprint.md
- repo-specific-actions.md
- migration-execution-summary.md

---

## Validation Results

### Wave 1 Status ✅ SAFE
- 1,588 lines confirmed by both repos
- autonomous-workflow.sh exclusion confirmed
- Additive changes only (no deletions)

### Wave 2 Status ⚠️ REQUIRES CARE
- NextNest: Preserve v2.0.0 config before subtree restore
- Roundtable: Backup enhanced scripts before subtree pull
- Both: Expanded hardcoded path audit (71+ files)

### Session Names ✅ KEEP CURRENT
- No changes needed
- Current working state preserved

---

## Backup Files Created

Before applying corrections, backups were created:
- `docs/plans/maf-franchise-migration-unified-blueprint.md.v2-backup`
- `docs/plans/repo-specific-actions.md.v2-backup`
- `docs/plans/upstream-candidates-matrix.md.v2-backup`
- `docs/plans/migration-execution-summary.md.v2-backup`

---

## Verification Sources

### Roundtable v2 Verification
- Confirmed: 56 files with hardcoded paths
- Confirmed: error-handling.sh is NEW (613 lines)
- Confirmed: tmux-utils.sh is NEW (893 lines)
- Confirmed: Roundtable's versions are enhanced

### NextNest v2 Verification
- Confirmed: Root config is v1.0.0, session "maf-cli"
- Confirmed: Subtree config is v2.0.0, session "maf-nn"
- Confirmed: 15 files with hardcoded paths
- Confirmed: Current session state works (maf-nn)
- Confirmed: Memlayer script paths corrected

---

## Next Steps

1. ✅ **Review corrected documents** - All 4 documents updated
2. ✅ **Validate corrections** - Cross-reference with verification feedback
3. ⏭️ **Execute Wave 1** - Safe to proceed (1,588 lines)
4. ⏭️ **Plan Wave 2** - With corrected understanding

---

## Key Takeaways

### What Changed
1. **NextNest root/subtree relationship REVERTED** - Must preserve v2.0.0 before restore
2. **Memlayer paths corrected** - Fix commands now accurate
3. **Enhanced scripts clarified as NEW** - Wave 1 confirmed safe
4. **Session name strategy revised** - Keep current working state
5. **Hardcoded paths expanded** - More comprehensive audit needed

### What Stayed the Same
1. **Wave 1 is SAFE** - 1,588 lines of battle-tested code
2. **autonomous-workflow.sh excluded** - Needs refactoring
3. **Two-wave approach** - Production-safe strategy
4. **Backup/restore critical** - For Wave 2 enhanced scripts

---

**Generated:** 2026-01-08  
**Status:** All corrections applied and validated  
**Confidence:** HIGH - Based on v2 verification from both repos  
**Ready for:** Execution with corrected understanding

