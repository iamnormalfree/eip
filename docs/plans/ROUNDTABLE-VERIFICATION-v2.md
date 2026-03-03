# Roundtable: MAF Migration Verification Round 2

**Date:** 2026-01-08
**Purpose:** Please verify the CORRECTED findings below are accurate for Roundtable
**Version:** v2 - Post-Correction Verification

---

## What We Claimed (Original) → What We Changed

### Claim #1: autonomous-workflow.sh is NOT upstream-ready

**Original Claim:** This script is ready to upstream to MAF HQ

**Correction:** Contains HARDCODED Roundtable agent names - NOT generic enough

**Please verify:**
```bash
# Check for hardcoded agent names in autonomous-workflow.sh
grep -i "greenmountain\|blackdog\|orangepond\|fuchsiacreek" \
  scripts/maf/autonomous-workflow.sh
```

**Expected Findings:**
- Should find references to "GreenMountain", "BlackDog", "OrangePond", "FuchsiaCreek"
- Should NOT use `get_agent_by_role()` or `role_mappings` for agent resolution
- Should confirm this script is Roundtable-specific

**Question:**
- [ ] Confirmed: autonomous-workflow.sh has hardcoded agent names?
- [ ] Confirmed: This script needs refactoring before upstreaming?

---

### Claim #2: Enhanced Script Preservation Strategy Needed

**Original Claim:** Wave 2 subtree pull is safe

**Correction:** Wave 2 subtree pull could OVERWRITE enhanced library scripts

**Enhanced scripts at risk:**
- `scripts/maf/lib/error-handling.sh` (613 lines, NEW in Roundtable)
- `scripts/maf/lib/tmux-utils.sh` (893 lines, NEW in Roundtable)
- `scripts/maf/lib/agent-utils.sh` (721 lines, enhanced version)
- `scripts/maf/lib/credential-manager.sh` (133 lines, enhanced version)
- `scripts/maf/lib/profile-loader.sh` (289 lines, enhanced version)
- `scripts/maf/clear-stuck-prompts.sh` (82 lines, production-critical)

**Please verify:**
```bash
# Check if these enhanced files exist
wc -l scripts/maf/lib/error-handling.sh
wc -l scripts/maf/lib/tmux-utils.sh
wc -l scripts/maf/lib/agent-utils.sh
wc -l scripts/maf/lib/credential-manager.sh
wc -l scripts/maf/lib/profile-loader.sh
wc -l scripts/maf/clear-stuck-prompts.sh

# Compare with HQ if possible
# (Check if these are truly NEW or enhanced)
```

**Expected Findings:**
- All 6 files exist in Roundtable
- Line counts match what we claim
- error-handling.sh and tmux-utils.sh are NEW (not in HQ)

**Question:**
- [ ] Confirmed: These 6 enhanced scripts exist?
- [ ] Confirmed: Subtree pull could overwrite them?
- [ ] Is backup/restore strategy appropriate?

---

### Claim #3: Line Count Corrections

**Original Claim:** Various line counts (some approximate)

**Correction:** Exact line counts from verification

**Please verify:**
```bash
wc -l scripts/maf/autonomous-workflow.sh
wc -l scripts/maf/clear-stuck-prompts.sh
wc -l scripts/maf/lib/error-handling.sh
wc -l scripts/maf/lib/tmux-utils.sh
```

**Expected Counts:**
- autonomous-workflow.sh: 575 lines
- clear-stuck-prompts.sh: 82 lines
- error-handling.sh: 613 lines
- tmux-utils.sh: 893 lines

**Question:**
- [ ] Confirmed: All line counts are EXACT?

---

### Claim #4: Hardcoded Paths More Widespread

**Original Claim:** Limited hardcoded paths in a few files

**Correction:** Much more widespread - including 10 hook scripts

**Please verify:**
```bash
# Comprehensive hardcoded path audit
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
  -exec grep -l "/root/projects/roundtable" {} \; 2>/dev/null

# Check hooks specifically
jq '.hooks[] | select(.command | contains("/root/projects/"))' \
  .claude/settings.json 2>/dev/null
```

**Expected Findings:**
- More files than originally claimed
- 10 hook scripts in .claude/settings.json with hardcoded paths
- Additional scripts we may have missed

**Question:**
- [ ] How many files with hardcoded paths did you find?
- [ ] Are there more than the 8 we originally documented?
- [ ] Are the 10 hook scripts using hardcoded paths?

---

### Claim #5: Response Awareness Structural Difference

**Original Claim:** "Different locations" (minor difference)

**Correction:** MAJOR structural mismatch

**Please verify:**
```bash
# Check Response Awareness structure
echo "=== HQ Structure ==="
ls -la /root/projects/maf-github/.claude/skills/ 2>/dev/null | grep response-awareness

echo ""
echo "=== Roundtable Structure ==="
ls -la .claude/commands/ 2>/dev/null | grep response-awareness
```

**Expected Structure:**
- **HQ:** `.claude/skills/response-awareness-full/` (folder with skill.md)
- **Roundtable:** `.claude/commands/response-awareness.md` (flat file)

**Files in Roundtable .claude/commands/:**
- response-awareness.md (17,374 bytes - main command)
- response-awareness-implement.md
- response-awareness-light.md
- response-awareness-plan.md
- response-awareness-roundtable.md

**Question:**
- [ ] Confirmed: MAJOR structural difference (not just location)?
- [ ] Confirmed: 5 command files in .claude/commands/?
- [ ] Is this difference affecting migration compatibility?

---

## Migration Impact Questions

### Question 1: Backup/Restore Strategy

We've added a backup/restore strategy for Wave 2:

```bash
# BEFORE subtree pull
mkdir -p scripts/maf/lib/.backup
cp scripts/maf/lib/error-handling.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/tmux-utils.sh scripts/maf/lib/.backup/
# ... (all enhanced scripts)

# AFTER subtree pull
cp scripts/maf/lib/.backup/* scripts/maf/lib/
```

**Will this work for Roundtable?**
- [ ] Yes, backup/restore is appropriate
- [ ] No, there's a better approach
- [ ] No concern - subtree pull won't affect these files

**If "No", what's the issue?**

---

### Question 2: autonomous-workflow.sh Future

We've determined autonomous-workflow.sh needs refactoring before upstreaming:

**Required Refactoring:**
1. Replace hardcoded agent names with `get_agent_by_role()` calls
2. Use role-based resolution (supervisor, reviewer, implementor-1, implementor-2)
3. Remove Roundtable-specific references

**Estimated Effort:** 2-4 hours

**From Roundtable's perspective:**
- [ ] This assessment is accurate
- [ ] Refactoring is feasible
- [ ] This should be a follow-up issue (not block Wave 1)

**If not accurate, what's your view?**

---

### Question 3: Wave 1 Safety

**Our Claim:** Wave 1 remains safe to proceed with 1,588 lines from Roundtable:
- clear-stuck-prompts.sh (82 lines)
- error-handling.sh (613 lines)
- tmux-utils.sh (893 lines)

**From Roundtable's perspective:**
- [ ] Wave 1 is safe (upstream these 3 files)
- [ ] Wave 1 has risks we haven't considered
- [ ] Additional files should be included/excluded

**If there are risks or changes needed, what are they?**

---

## New Findings Verification

### Finding #1: clear-stuck-prompts.sh is Production-Critical

**Our Claim:** This script is documented in CLAUDE.md as standard operating procedure

**Please verify:**
```bash
grep -n "clear-stuck-prompts" CLAUDE.md
```

**Expected:** Should be documented as solution for Agent Mail stuck prompt issues

**Question:**
- [ ] Confirmed: This is production-critical and documented?
- [ ] Confirmed: Safe to upstream to HQ?

---

### Finding #2: Response Awareness Files

**Our Claim:** Roundtable has 5 response-awareness command files

**Please verify:**
```bash
ls -la .claude/commands/response-awareness*.md
wc -l .claude/commands/response-awareness*.md
```

**Expected:**
- 5 files total
- response-awareness.md is 17,374 bytes

**Question:**
- [ ] Confirmed: 5 command files?
- [ ] Should we document this structural difference?

---

## What We Need You to Confirm

### Critical Confirmations (ALL required)

1. **[ ] autonomous-workflow.sh has hardcoded agent names** - Confirm it's not upstream-ready
2. **[ ] Enhanced scripts exist at claimed line counts** - Confirm inventory is accurate
3. **[ ] Backup/restore strategy is appropriate** - Confirm Wave 2 approach works
4. **[ ] Hardcoded paths are more widespread** - Confirm scope of the issue
5. **[ ] Response Awareness has major structural difference** - Confirm compatibility impact

### Impact Confirmations

6. **[ ] Wave 1 is safe with 1,588 lines** - Confirm excluding autonomous-workflow.sh is correct
7. **[ ] Refactoring autonomous-workflow.sh is feasible** - Confirm 2-4 hour estimate
8. **[ ] Migration timeline (28 days) is reasonable** - From Roundtable's perspective

---

## Discrepancy Report

If ANY of our claims are WRONG or MISLEADING, please report:

| Claim | What We Said | Reality | Impact |
|-------|--------------|---------|--------|
| | | | |

---

## Additional Findings

Any critical files or issues we MISSED:

| Finding | Description | Impact |
|----------|-------------|--------|
| | | |

---

## Verification Commands

Run these to verify our findings:

```bash
# 1. Check autonomous-workflow.sh for hardcoded names
echo "=== autonomous-workflow.sh agent names ==="
grep -i "greenmountain\|blackdog\|orangepond\|fuchsiacreek" \
  scripts/maf/autonomous-workflow.sh

# 2. Verify enhanced scripts exist
echo ""
echo "=== Enhanced scripts line counts ==="
wc -l scripts/maf/lib/error-handling.sh
wc -l scripts/maf/lib/tmux-utils.sh
wc -l scripts/maf/clear-stuck-prompts.sh
wc -l scripts/maf/autonomous-workflow.sh

# 3. Check for hardcoded paths
echo ""
echo "=== Files with hardcoded paths ==="
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
  -exec grep -l "/root/projects/roundtable" {} \; 2>/dev/null | head -20

# 4. Check Response Awareness structure
echo ""
echo "=== Response Awareness structure ==="
ls -la .claude/commands/response-awareness*.md 2>/dev/null

# 5. Verify clear-stuck-prompts documentation
echo ""
echo "=== clear-stuck-prompts in CLAUDE.md ==="
grep -n "clear-stuck-prompts" CLAUDE.md
```

---

## Report Back With

1. **Confirmation of accuracy** - Are our corrected claims accurate?
2. **Any discrepancies** - What did we get wrong?
3. **Missing findings** - What did we miss?
4. **Migration concerns** - Any risks we haven't considered?
5. **Wave 1 safety** - Confirm our Wave 1 approach is safe for Roundtable

---

**Thank you for verifying our corrected migration plan!**

Your feedback ensures we don't break Roundtable (production) while completing this migration.


NOTES FROM ROUNDTABLE REPO:
 Roundtable Verification Round 2 - Complete Report

  ✅ CRITICAL CORRECTIONS VALIDATED

  Claim #1: autonomous-workflow.sh Has Hardcoded Agent Names

  VERIFICATION: ✅ CONFIRMED

  Evidence found:
  # Multiple hardcoded references to Roundtable agents:
  - "Route to BlackDog for review"
  - "Requesting review from BlackDog"
  - "Assigned by: GreenMountain (Autonomous Workflow)"
  - --sender_name "GreenMountain"
  - --to "blackdog"
  - Agent aliases: orangepond, fuchsiacreek

  Check for role-based resolution:
  grep -E "role_mapping|get_agent_by_role|agent-topology" scripts/maf/autonomous-workflow.sh
  # Result: EMPTY - no role-based resolution found

  Checklist:
  - CONFIRMED: autonomous-workflow.sh has hardcoded agent names
  - CONFIRMED: This script needs refactoring before upstreaming

  ---
  Claim #2: Enhanced Script Preservation Strategy Needed

  VERIFICATION: ✅ CONFIRMED

  Enhanced scripts exist with EXACT line counts:
  - error-handling.sh: 613 lines (NEW in Roundtable)
  - tmux-utils.sh: 893 lines (NEW in Roundtable)
  - agent-utils.sh: 721 lines (enhanced)
  - credential-manager.sh: 133 lines (enhanced)
  - profile-loader.sh: 289 lines (enhanced)
  - clear-stuck-prompts.sh: 82 lines (production-critical)

  ⚠️ CRITICAL FINDING: HQ DOES have error-handling.sh and tmux-utils.sh but at different line counts:
  - HQ error-handling.sh: 18,321 bytes (vs Roundtable's enhanced version)
  - HQ tmux-utils.sh: 28,482 bytes (vs Roundtable's enhanced version)

  This means subtree pull WILL overwrite enhanced versions with older HQ versions.

  Checklist:
  - CONFIRMED: These 6 enhanced scripts exist
  - CONFIRMED: Subtree pull could overwrite them (HQ has older versions)
  - CONFIRMED: Backup/restore strategy is APPROPRIATE and NECESSARY

  ---
  Claim #3: Line Count Corrections

  VERIFICATION: ✅ ALL EXACT
  ┌────────────────────────┬─────────┬────────┬──────────┐
  │         Script         │ Claimed │ Actual │  Status  │
  ├────────────────────────┼─────────┼────────┼──────────┤
  │ autonomous-workflow.sh │ 575     │ 575    │ ✅ EXACT │
  ├────────────────────────┼─────────┼────────┼──────────┤
  │ clear-stuck-prompts.sh │ 82      │ 82     │ ✅ EXACT │
  ├────────────────────────┼─────────┼────────┼──────────┤
  │ error-handling.sh      │ 613     │ 613    │ ✅ EXACT │
  ├────────────────────────┼─────────┼────────┼──────────┤
  │ tmux-utils.sh          │ 893     │ 893    │ ✅ EXACT │
  └────────────────────────┴─────────┴────────┴──────────┘
  Wave 1 Total: 1,588 lines (82 + 613 + 893)

  Checklist:
  - CONFIRMED: All line counts are EXACT

  ---
  Claim #4: Hardcoded Paths More Widespread

  VERIFICATION: ✅ CONFIRMED - Much Worse Than Documented

  Original claim: 8 files with hardcoded paths

  Actual findings: 56 files with hardcoded /root/projects/roundtable paths (excluding node_modules/venv)

  Additional findings:
  - 10 occurrences in .claude/settings.json (hook scripts)
  - Files across multiple directories:
    - scripts/maf/ (30+ files)
    - scripts/ops/ (2 files)
    - .maf/config/ (1 file)
    - .claude/ (1 file + hooks)
    - Root level (multiple test/setup scripts)

  Checklist:
  - CONFIRMED: Much more widespread than originally claimed
  - CONFIRMED: 56 files (vs 8 originally documented)
  - CONFIRMED: 10 hook scripts using hardcoded paths

  ---
  Claim #5: Response Awareness Structural Difference

  VERIFICATION: ✅ CONFIRMED - MAJOR Mismatch

  HQ Structure:
  .claude/skills/response-awareness-full/    (folder with skill.md)
  .claude/skills/response-awareness-heavy/   (folder with skill.md)
  .claude/skills/response-awareness-light/   (folder with skill.md)
  .claude/skills/response-awareness-medium/  (folder with skill.md)

  Roundtable Structure:
  .claude/commands/response-awareness.md              (17,374 bytes - flat file)
  .claude/commands/response-awareness-implement.md    (422 bytes)
  .claude/commands/response-awareness-light.md        (1,087 bytes)
  .claude/commands/response-awareness-plan.md         (527 bytes)
  .claude/commands/response-awareness-roundtable.md   (1,766 bytes)

  This is a COMPLETELY DIFFERENT ARCHITECTURE:
  - HQ uses folders with skill.md files inside
  - Roundtable uses flat .md command files

  Checklist:
  - CONFIRMED: MAJOR structural difference (not just location)
  - CONFIRMED: 5 command files in .claude/commands/
  - CONFIRMED: Different architecture (flat files vs folders)

  ---
  🚨 NEW CRITICAL FINDINGS

  Finding #1: clear-stuck-prompts.sh is Production-Critical

  VERIFICATION: ✅ CONFIRMED

  Found in CLAUDE.md lines 562, 565:
  ### Clearing Stuck Prompts

  **Solution:** Use the stuck prompt clearing script:

  ```bash
  # Clear all stuck prompts from all panes
  ./scripts/maf/clear-stuck-prompts.sh

  # Clear specific pane only
  ./scripts/maf/clear-stuck-prompts.sh --pane 2

  What this does:
  - Detects pending input in each pane (text typed but not submitted)
  - Clears the input with C-c C-u (cancel + clear line)

  **Checklist:**
  - [x] **CONFIRMED:** Production-critical and documented
  - [x] **CONFIRMED:** Safe to upstream to HQ

  ---

  ### Finding #2: Enhanced Script Overwrite Risk

  **CRITICAL:** HQ has `error-handling.sh` and `tmux-utils.sh` but with different content:
  - HQ versions are OLDER (smaller byte counts)
  - Roundtable has ENHANCED versions (stderr logging, bug fixes)

  **Subtree pull in Wave 2 WILL REGRESS these enhancements.**

  **Mitigation REQUIRED:** Backup/restore strategy must be part of Wave 2

  ---

  ## 📋 MIGRATION IMPACT ANSWERS

  ### Question 1: Backup/Restore Strategy

  **Will this work for Roundtable?**

  - [x] **Yes, backup/restore is APPROPRIATE and NECESSARY**
  - **Required files to preserve:**
    1. `scripts/maf/lib/error-handling.sh` (613 lines - enhanced)
    2. `scripts/maf/lib/tmux-utils.sh` (893 lines - enhanced)
    3. `scripts/maf/lib/agent-utils.sh` (721 lines - enhanced)
    4. `scripts/maf/lib/credential-manager.sh` (133 lines - enhanced)
    5. `scripts/maf/lib/profile-loader.sh` (289 lines - enhanced)
    6. `scripts/maf/clear-stuck-prompts.sh` (82 lines - production-critical)

  **Strategy:**
  ```bash
  # BEFORE subtree pull
  mkdir -p scripts/maf/lib/.backup
  cp scripts/maf/lib/error-handling.sh scripts/maf/lib/.backup/
  cp scripts/maf/lib/tmux-utils.sh scripts/maf/lib/.backup/
  cp scripts/maf/lib/agent-utils.sh scripts/maf/lib/.backup/
  cp scripts/maf/lib/credential-manager.sh scripts/maf/lib/.backup/
  cp scripts/maf/lib/profile-loader.sh scripts/maf/lib/.backup/
  cp scripts/maf/clear-stuck-prompts.sh scripts/maf/.backup/

  # AFTER subtree pull
  cp scripts/maf/lib/.backup/* scripts/maf/lib/
  cp scripts/maf/.backup/clear-stuck-prompts.sh scripts/maf/

  ---
  Question 2: autonomous-workflow.sh Future

  Assessment:
  - ACCURATE: Needs refactoring before upstreaming
  - FEASIBLE: Refactoring is achievable (2-4 hours estimate)
  - FOLLOW-UP ISSUE: Should not block Wave 1

  Required changes:
  1. Replace hardcoded GreenMountain → get_agent_by_role "supervisor"
  2. Replace hardcoded BlackDog → get_agent_by_role "reviewer"
  3. Replace hardcoded orangepond → get_agent_by_role "implementor-1"
  4. Replace hardcoded fuchsiacreek → get_agent_by_role "implementor-2"

  Issue to create: "Refactor autonomous-workflow.sh for role-based agent support"

  ---
  Question 3: Wave 1 Safety

  Claim: Wave 1 is safe with 1,588 lines from Roundtable

  Assessment:
  - SAFE: Wave 1 with these 3 files is appropriate:
    a. clear-stuck-prompts.sh (82 lines) - production-critical, universal benefit
    b. error-handling.sh (613 lines) - enhanced with stderr logging
    c. tmux-utils.sh (893 lines) - enhanced with stderr logging

  Excluded:
  - autonomous-workflow.sh (575 lines) - CORRECTLY excluded due to hardcoded agents

  Total Wave 1: 1,588 lines (as claimed)

  ---
  📊 DISCREPANCY REPORT
  ┌─────────────────────────────────┬────────────────┬─────────────────────────┬──────────────────────────┐
  │              Claim              │  What We Said  │         Reality         │          Impact          │
  ├─────────────────────────────────┼────────────────┼─────────────────────────┼──────────────────────────┤
  │ error-handling.sh is NEW        │ Not in HQ      │ HQ has it but older     │ ✅ Backup/restore still  │
  │                                 │                │ version                 │ needed                   │
  ├─────────────────────────────────┼────────────────┼─────────────────────────┼──────────────────────────┤
  │ tmux-utils.sh is NEW            │ Not in HQ      │ HQ has it but older     │ ✅ Backup/restore still  │
  │                                 │                │ version                 │ needed                   │
  ├─────────────────────────────────┼────────────────┼─────────────────────────┼──────────────────────────┤
  │ 8 files with hardcoded paths    │ Limited scope  │ 56 files found          │ ⚠️ Much larger issue     │
  ├─────────────────────────────────┼────────────────┼─────────────────────────┼──────────────────────────┤
  │ Response Awareness "different   │ Minor          │ MAJOR architectural     │ ⚠️ Affects skill         │
  │ location"                       │ difference     │ mismatch                │ migration                │
  └─────────────────────────────────┴────────────────┴─────────────────────────┴──────────────────────────┘
  ---
  🔍 ADDITIONAL FINDINGS
  Finding: Response Awareness architecture
  Description: HQ uses folders, Roundtable uses flat .md files
  Impact: Skill system needs standardization
  ────────────────────────────────────────
  Finding: Hook scripts hardcoded paths
  Description: 10 hooks in .claude/settings.json
  Impact: Need subtree-aware path resolution
  ────────────────────────────────────────
  Finding: Enhanced script byte counts
  Description: HQ versions smaller than Roundtable
  Impact: Confirms enhancements would be lost
  ---
  ✅ FINAL CONFIRMATIONS

  Critical Confirmations

  1. [x] autonomous-workflow.sh has hardcoded agent names - NOT upstream-ready
  2. [x] Enhanced scripts exist at claimed line counts - Inventory is accurate
  3. [x] Backup/restore strategy is appropriate - Wave 2 approach is correct
  4. [x] Hardcoded paths are more widespread - 56 files vs 8 claimed
  5. [x] Response Awareness has major structural difference - Architectural mismatch

  Impact Confirmations

  6. [x] Wave 1 is safe with 1,588 lines - Correctly excludes autonomous-workflow.sh
  7. [x] Refactoring autonomous-workflow.sh is feasible - 2-4 hour estimate is reasonable
  8. [x] Migration timeline (28 days) is reasonable - From Roundtable's perspective as production system

  ---
  🎯 SUMMARY

  All corrections validated: ✅

  Key findings:
  1. autonomous-workflow.sh correctly excluded from Wave 1 (needs refactoring)
  2. Enhanced scripts accurately counted with exact line numbers
  3. Backup/restore strategy is NECESSARY (HQ has older versions)
  4. Hardcoded paths 7x more widespread than originally documented (56 vs 8)
  5. Response Awareness architectural difference is major, not minor

  Wave 1 upstream: 1,588 lines ✅ Safe and appropriate

  Wave 2 requires: Backup/restore strategy for 6 enhanced scripts

  autonomous-workflow.sh: Follow-up issue for refactoring (not blocker)