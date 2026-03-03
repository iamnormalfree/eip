# MAF Migration Plans - V3 Corrected Documents

**Last Updated:** 2026-01-08  
**Status:** ✅ All corrections applied based on v2 verification feedback

---

## Document Index

### Primary Migration Documents

1. **[Unified Blueprint](./maf-franchise-migration-unified-blueprint.md)** (~1,000 lines)
   - Complete migration plan with all corrections
   - Two-wave approach (Phase 0 + Wave 1 + Wave 2)
   - Risk register and success criteria
   - Repo-specific summaries

2. **[Repo-Specific Actions](./repo-specific-actions.md)** (~680 lines)
   - Detailed, copy-pasteable commands for each repo
   - MAF HQ, Roundtable, and NextNest actions
   - Verification checklists
   - Execution order dependencies

3. **[Upstream Candidates Matrix](./upstream-candidates-matrix.md)** (~400 lines)
   - Prioritized list of what to make GLOBAL
   - Priority 1: 6 items to upstream immediately (1,588 lines)
   - Priority 2: Patterns for Wave 2
   - Priority 3: Template-only items

4. **[Migration Execution Summary](./migration-execution-summary.md)** (~370 lines)
   - High-level validation and handoff
   - Corrections applied (5 original + 8 post-verification)
   - Complexity assessment (9/12 FULL tier)
   - Handoff checklist

### V3 Corrections Documentation

5. **[V3 Corrections Summary](./V3-CORRECTIONS-SUMMARY.md)** (NEW)
   - Detailed breakdown of all 5 critical corrections
   - What was changed and why
   - Verification sources (Roundtable v2, NextNest v2)
   - Impact assessment

6. **[V3 Corrections Complete](./V3-CORRECTIONS-COMPLETE.md)** (NEW)
   - Executive summary of corrections
   - Validation results
   - Next steps

---

## Critical Corrections Applied (V3)

### 1. NextNest Root/Subtree Relationship - REVERTED ✅
- **Root config:** v1.0.0, session "maf-cli" (PRISTINE from HQ)
- **Subtree config:** v2.0.0, session "maf-nn" (ENHANCED within subtree)
- **Impact:** Subtree restore will LOSE v2.0.0 enhancements if not preserved

### 2. Memlayer Script Paths - Corrected ✅
- **Correct paths:** `maf/scripts/maf/agent-mail-fetch.sh`, `maf/scripts/maf/agent-memory.sh`

### 3. Enhanced Scripts - Clarified as NEW ✅
- error-handling.sh: 613 lines (NEW, not in HQ)
- tmux-utils.sh: 893 lines (NEW, not in HQ)
- clear-stuck-prompts.sh: 82 lines (NEW)
- **Total:** 1,588 lines (not 2,163)

### 4. Session Name Strategy - Keep Current ✅
- MAF HQ: "maf-cli"
- Roundtable: "maf-cli"
- NextNest: "maf-nn" (KEEP existing working session)

### 5. Hardcoded Paths - Expanded Scope ✅
- Roundtable: 56 files (not 8)
- NextNest: 15 files
- **Total:** 71+ files across both repos

---

## Quick Start Guide

### For Review
```bash
# Read the executive summary first
cat docs/plans/migration-execution-summary.md

# Then review corrections
cat docs/plans/V3-CORRECTIONS-SUMMARY.md

# Finally, read the unified blueprint
cat docs/plans/maf-franchise-migration-unified-blueprint.md
```

### For Execution
```bash
# Start with Phase 0 (Days -7 to 0)
cd /root/projects/maf-github

# Run path audit
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.md" \) \
  -exec grep -l "/root/projects/" {} \; > /tmp/hardcoded-paths.txt

# Establish baseline metrics
find scripts/maf -name "*.sh" | wc -l
bash scripts/maf/spawn-agents.sh --dry-run
```

---

## Validation Status

- ✅ Wave 1 SAFE - 1,588 lines confirmed by both repos
- ✅ autonomous-workflow.sh exclusion confirmed
- ⚠️ Wave 2 REQUIRES CARE - Preserve v2.0.0, backup enhanced scripts
- ✅ Session names - Keep current working state

---

## Backup Files

Before corrections were applied, backups were created:
- `maf-franchise-migration-unified-blueprint.md.v2-backup`
- `repo-specific-actions.md.v2-backup`
- `upstream-candidates-matrix.md.v2-backup`
- `migration-execution-summary.md.v2-backup`

---

## Next Steps

1. Review corrected documents
2. Validate corrections against v2 verification feedback
3. Execute Phase 0 (Pre-migration validation)
4. Execute Wave 1 (Days 1-10) - SAFE with 1,588 lines
5. Pass validation gate
6. Execute Wave 2 (Days 11-28) with corrected understanding

---

**Generated:** 2026-01-08  
**Version:** V3 (All corrections applied)  
**Confidence:** HIGH - Based on v2 verification from both repos  
**Status:** Ready for execution
