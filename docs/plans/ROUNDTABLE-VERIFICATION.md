# Roundtable: MAF Migration Findings - Verification Request

**Date:** 2026-01-08
**Purpose:** Please verify the findings below are accurate for Roundtable

---

## What We Found About Roundtable

### 1. Unique Scripts (Not in MAF HQ)

We found these scripts exist in Roundtable but NOT in MAF HQ:

| Script | Claimed Lines | Purpose |
|--------|---------------|---------|
| `autonomous-workflow.sh` | 575 lines | Bead lifecycle orchestration |
| `clear-stuck-prompts.sh` | 82 lines | Clears stuck prompts in tmux panes |

**Please verify:**
- [ ] These files exist at: `scripts/maf/autonomous-workflow.sh`
- [ ] These files exist at: `scripts/maf/clear-stuck-prompts.sh`
- [ ] Line counts are correct (run `wc -l scripts/maf/autonomous-workflow.sh scripts/maf/clear-stuck-prompts.sh`)
- [ ] Purpose descriptions are accurate

---

### 2. Enhanced/New Library Scripts

We found these library scripts in Roundtable that should be upstreamed to HQ:

| Script | Claimed Lines | Status |
|--------|---------------|--------|
| `scripts/maf/lib/error-handling.sh` | 613 lines | NEW file (not in HQ) |
| `scripts/maf/lib/tmux-utils.sh` | 893 lines | NEW file (not in HQ) |
| `scripts/maf/lib/agent-utils.sh` | 721 lines | Enhanced version |
| `scripts/maf/lib/credential-manager.sh` | 133 lines | Enhanced version |
| `scripts/maf/lib/profile-loader.sh` | 289 lines | Enhanced version |

**Please verify:**
- [ ] All files exist at above locations
- [ ] Line counts are correct (run `wc -l scripts/maf/lib/*.sh`)
- [ ] These are NEW or enhanced (compare with `/root/projects/maf-github/scripts/maf/lib/` if accessible)

---

### 3. Script Count

We claim:
- **MAF HQ:** 130 scripts
- **Roundtable:** 132 scripts (2 more than HQ)

**Please verify:**
```bash
find scripts/maf -name "*.sh" | wc -l
```
Expected: 132 (or your actual count)

---

### 4. Response Awareness Location

We found Roundtable has Response Awareness in a DIFFERENT location than HQ:
- **HQ:** `.claude/skills/` (25 skills)
- **Roundtable:** `.claude/commands/` (5 response-awareness commands)

**Please verify:**
- [ ] `.claude/commands/` directory exists
- [ ] Contains response-awareness related files (not `.md` files like HQ has)
- [ ] How many commands? (we claim 5)

---

### 5. Hardcoded Paths

We identified potential hardcoded paths that may need fixing:

**Claim:** These files contain hardcoded `/root/projects/` paths:
- `scripts/maf/lib/agent-utils.sh`
- `scripts/maf/lib/tmux-utils.sh`
- `scripts/maf/lib/credential-manager.sh`
- `.claude/settings.json` (hooks)

**Please verify:**
```bash
grep -r "/root/projects/" scripts/maf/ .claude/settings.json 2>/dev/null
```
- [ ] Do these files contain hardcoded paths?
- [ ] Are there other files with hardcoded paths we missed?

---

### 6. Clear-Stuck-Prompts Documentation

We claim `clear-stuck-prompts.sh` is documented in `CLAUDE.md` as standard operating procedure.

**Please verify:**
- [ ] Does `CLAUDE.md` mention `clear-stuck-prompts.sh`?
- [ ] Is it documented as "standard operating procedure" for Agent Mail issues?

---

### 7. Autonomous-Workflow Details

We claim `autonomous-workflow.sh` is a 575-line bead lifecycle orchestration script.

**Please verify:**
- [ ] What does this script actually do?
- [ ] Does it hardcode Roundtable agent names (GreenMountain, BlackDog, etc.)?
- [ ] Is it generic enough to upstream, or Roundtable-specific?

---

### 8. MAF HQ Contamination Claims

We claim MAF HQ has Roundtable content:
- **Config:** `.maf/config/agent-topology.json` has GreenMountain, BlackDog, OrangePond, FuchsiaCreek
- **Prompt Packs:** `scripts/maf/prompt-packs/roundtable-*.json` (8 files)

**Please verify:**
- [ ] Does HQ's agent-topology.json match Roundtable's agent names exactly?
- [ ] Are these Roundtable-specific names or generic templates?
- [ ] Do the Roundtable prompt packs exist in HQ?

---

## Migration Impact for Roundtable

### What We Plan to Do TO Roundtable:

**Wave 1 (Days 1-10) - Low Risk:**
- Add CI guard to prevent subtree modifications
- Add health check script
- NO breaking changes

**Wave 2 (Days 15-18) - After Validation:**
- Pull latest from MAF HQ
- Add role-based mapping to config
- Test in staging before production

### What We Plan to Take FROM Roundtable:

**Files to upstream to HQ:**
1. `scripts/maf/lib/error-handling.sh` (613 lines)
2. `scripts/maf/lib/tmux-utils.sh` (893 lines)
3. `scripts/maf/clear-stuck-prompts.sh` (82 lines)
4. `scripts/maf/autonomous-workflow.sh` (575 lines)

**Total: 2,163 lines**

---

## Verification Checklist

Please confirm each item:

### File Existence
- [ ] `autonomous-workflow.sh` exists at claimed location
- [ ] `clear-stuck-prompts.sh` exists at claimed location
- [ ] `error-handling.sh` exists in lib/
- [ ] `tmux-utils.sh` exists in lib/
- [ ] All 5 library scripts exist

### Line Counts
- [ ] `autonomous-workflow.sh`: _____ lines (we claim 575)
- [ ] `clear-stuck-prompts.sh`: _____ lines (we claim 82)
- [ ] `error-handling.sh`: _____ lines (we claim 613)
- [ ] `tmux-utils.sh`: _____ lines (we claim 893)

### Accuracy
- [ ] Script count is approximately 132
- [ ] Response Awareness in `.claude/commands/`, not `.claude/skills/`
- [ ] `clear-stuck-prompts.sh` is production-critical and documented in CLAUDE.md
- [ ] `autonomous-workflow.sh` is bead lifecycle orchestration
- [ ] Hardcoded paths exist in claimed locations

### Concerns
- [ ] Are any findings WRONG or MISLEADING?
- [ ] Are there critical files we MISSED?
- [ ] Are there any BREAKING CHANGES in our plan that would affect Roundtable?
- [ ] Is the role-based mapping approach compatible with Roundtable's agent names?

---

## Your Feedback

Please provide feedback on:

1. **Accuracy:** Are all our findings about Roundtable correct?
2. **Completeness:** Did we miss any important Roundtable-specific files or issues?
3. **Impact:** Will our migration plan work for Roundtable, or are there risks we didn't consider?
4. **Timing:** Is the two-wave approach (stabilize → refine) appropriate for Roundtable as a production system?

---

**To verify findings, please run:**
```bash
# Check file existence
ls -la scripts/maf/autonomous-workflow.sh scripts/maf/clear-stuck-prompts.sh
ls -la scripts/maf/lib/*.sh

# Check line counts
wc -l scripts/maf/autonomous-workflow.sh scripts/maf/clear-stuck-prompts.sh
wc -l scripts/maf/lib/*.sh

# Check script count
find scripts/maf -name "*.sh" | wc -l

# Check Response Awareness location
ls -la .claude/commands/ || ls -la .claude/skills/

# Check for hardcoded paths
grep -r "/root/projects/" scripts/maf/ .claude/ 2>/dev/null | head -20
```

**Report back with:**
- Actual line counts (to verify our numbers)
- Any discrepancies in our findings
- Any concerns about the migration plan
- Any additional findings we should know about


INPUT FROM ROUNDTABLE REPO:
Roundtable Verification Report - Complete

  ✅ VERIFICATION RESULTS

  1. Unique Scripts (Not in MAF HQ)
  Script: autonomous-workflow.sh
  Claimed Lines: 575
  Actual Lines: 575 ✅
  Status: EXISTS
  ────────────────────────────────────────
  Script: clear-stuck-prompts.sh
  Claimed Lines: 82
  Actual Lines: 82 ✅
  Status: EXISTS
  Checklist:
  - These files exist at: scripts/maf/autonomous-workflow.sh
  - These files exist at: scripts/maf/clear-stuck-prompts.sh
  - Line counts are EXACTLY CORRECT
  - Purpose descriptions are accurate

  ---
  2. Enhanced/New Library Scripts
  Script: scripts/maf/lib/error-handling.sh
  Claimed Lines: 613
  Actual Lines: 613 ✅
  Status: NEW (not in HQ)
  ────────────────────────────────────────
  Script: scripts/maf/lib/tmux-utils.sh
  Claimed Lines: 893
  Actual Lines: 893 ✅
  Status: NEW (not in HQ)
  ────────────────────────────────────────
  Script: scripts/maf/lib/agent-utils.sh
  Claimed Lines: 721
  Actual Lines: 721 ✅
  Status: Enhanced version
  ────────────────────────────────────────
  Script: scripts/maf/lib/credential-manager.sh
  Claimed Lines: 133
  Actual Lines: 133 ✅
  Status: Enhanced version
  ────────────────────────────────────────
  Script: scripts/maf/lib/profile-loader.sh
  Claimed Lines: 289
  Actual Lines: 289 ✅
  Status: Enhanced version
  Checklist:
  - All files exist at above locations
  - ALL line counts are EXACTLY CORRECT
  - These are NEW or enhanced

  ---
  3. Script Count

  Claim: Roundtable has 132 scripts (2 more than HQ's 130)

  Actual: 132 ✅ EXACTLY CORRECT

  ---
  4. Response Awareness Location

  HQ: .claude/skills/ (has 4 response-awareness skills: full, heavy, light, medium)
  Roundtable: .claude/commands/ (has 5 response-awareness commands)

  Checklist:
  - .claude/commands/ directory exists
  - Contains 5 response-awareness files (NOT skills folders like HQ)
  - MAJOR STRUCTURAL DIFFERENCE CONFIRMED

  Files in Roundtable .claude/commands/:
  - response-awareness.md (17,374 bytes - main command)
  - response-awareness-implement.md
  - response-awareness-light.md
  - response-awareness-plan.md
  - response-awareness-roundtable.md

  ---
  5. Hardcoded Paths

  Extensive hardcoded /root/projects/ paths found:

  Scripts with hardcoded paths:
  - start-bead-agents.sh - Multiple /root/projects/roundtable
  - setup-worktrees.sh - Default worktrees path
  - memlayer-config.json - Storage path
  - receipt.sh - PROJECT_KEY default
  - test-memlayer-in-tmux.sh - Multiple paths
  - init-claude-agents-v2.sh - Settings path
  - analyze-coordination-quality.sh - Log directory
  - maintenance/check-disk.sh - Script paths

  .claude/settings.json hooks - 10 hardcoded paths to hooks:
  - response_awareness_prompt.py
  - prompt_skill_search.py
  - maf_status_heartbeat.py
  - orchestrator-firewall.py
  - block-commit-in-tmux.py
  - assumption-detector.py
  - question-suppression-detector.py
  - skill_catalog_posttool.py
  - reset_skill_tracking.py

  Checklist:
  - These files contain hardcoded paths
  - MANY more files than initially claimed

  ---
  6. Clear-Stuck-Prompts Documentation

  Claim: Documented in CLAUDE.md as standard operating procedure

  VERIFIED: ✅ CONFIRMED

  From CLAUDE.md:
  ### Telegram /snapshot and /activity Commands Behavior

  ...

  **Solution:** Use the stuck prompt clearing script:

  ```bash
  # Clear all stuck prompts from all panes
  ./scripts/maf/clear-stuck-prompts.sh

  What this does:
  - Detects pending input in each pane (text typed but not submitted)
  - Clears the input with C-c C-u (cancel + clear line)
  - Safe to run - won't affect agents that are actively processing

  **Checklist:**
  - [x] CLAUDE.md mentions `clear-stuck-prompts.sh`
  - [x] Documented as standard operating procedure for Agent Mail issues

  ---

  ### 7. Autonomous-Workflow Details

  **Claim:** 575-line bead lifecycle orchestration script

  **VERIFIED:** ✅ **CONFIRMED**

  **⚠️ CRITICAL FINDING - Has HARDCODED Roundtable Agent Names:**

  ```bash
  # Found in autonomous-workflow.sh:
  - "Route to BlackDog for review"
  - "Requesting review from BlackDog"
  - "Assigned by: GreenMountain (Autonomous Workflow)"
  - --sender_name "GreenMountain"
  - --to "blackdog"
  - Agent aliases: orangepond, fuchsiacreek

  Does NOT use role_mappings or config for agent resolution.

  Verdict:
  - ✅ Purpose is accurate (bead lifecycle orchestration)
  - ❌ NOT generic enough to upstream as-is
  - ❌ Would require refactoring to use role-based lookups

  ---
  8. MAF HQ Contamination

  Claim: MAF HQ has Roundtable content

  VERIFIED: ✅ CONFIRMED

  Agent Topology in HQ:
  "agent_name": "GreenMountain"  // supervisor
  "agent_name": "BlackDog"       // reviewer
  "agent_name": "OrangePond"     // implementor-1
  "agent_name": "FuchsiaCreek"   // implementor-2

  Prompt Packs in HQ:
  - 8 Roundtable-specific prompt packs confirmed

  Checklist:
  - HQ's agent-topology.json has Roundtable agent names
  - These are Roundtable-specific names (not generic templates)
  - Roundtable prompt packs exist in HQ

  ---
  🚨 NEW CRITICAL FINDINGS

  1. Response Awareness Skills Structure Mismatch
  Aspect: Location
  HQ: .claude/skills/
  Roundtable: .claude/commands/
  ────────────────────────────────────────
  Aspect: Format
  HQ: Directories with skill.md
  Roundtable: .md command files
  ────────────────────────────────────────
  Aspect: Count
  HQ: 4 RA skills
  Roundtable: 5 RA commands
  ────────────────────────────────────────
  Aspect: Structure
  HQ: Folders (response-awareness-full/)
  Roundtable: Flat files (.md)
  Impact: The document's claim "Response Awareness skills identical" is WRONG. This is a significant structural difference that affects migration.

  ---
  2. Autonomous-Workflow NOT Ready for Upstream

  Before upstreaing, requires:
  1. Replace hardcoded agent names with role-based lookups
  2. Add configuration-based agent name resolution
  3. Remove Roundtable-specific references

  Estimated effort: 2-4 hours of refactoring

  ---
  3. Hardcoded Paths More Widespread Than Claimed

  Additional files with hardcoded paths not mentioned in document:
  - start-bead-agents.sh
  - setup-worktrees.sh
  - memlayer-config.json
  - receipt.sh
  - test-memlayer-in-tmux.sh
  - init-claude-agents-v2.sh
  - analyze-coordination-quality.sh
  - maintenance/check-disk.sh

  Plus 10 hook scripts in .claude/settings.json

  ---
  ⚠️ MIGRATION IMPACT CONCERNS

  1. Wave 2 Changes Could Break Roundtable

  Risk: Pulling from MAF HQ during Wave 2 could overwrite:
  - Enhanced library scripts (stderr logging fixes)
  - Production-critical clear-stuck-prompts.sh
  - Custom .claude/commands/ structure

  Mitigation needed:
  - Create local backups before subtree pull
  - Test subtree pull in staging first
  - Document what NOT to overwrite

  ---
  2. Role-Based Mapping Compatibility

  Question: Is Roundtable's current agent topology compatible with role-based mapping?

  Current state: Roundtable already has roles defined:
  "role": "supervisor" → "agent_name": "GreenMountain"
  "role": "reviewer" → "agent_name": "BlackDog"

  Verdict: ✅ Compatible - just need to add role_mappings section

  ---
  3. Hook Script Migration

  The 10 hook scripts in .claude/settings.json all reference /root/projects/roundtable/

  If Roundtable moves to subtree model, these paths need updating to:
  - Use relative paths
  - Or environment variable
  - Or subtree-aware path detection

  Not addressed in migration plan.

  ---
  📋 UPDATED VERIFICATION CHECKLIST

  File Existence

  - autonomous-workflow.sh exists at claimed location
  - clear-stuck-prompts.sh exists at claimed location
  - error-handling.sh exists in lib/
  - tmux-utils.sh exists in lib/
  - All 5 library scripts exist

  Line Counts (ALL EXACT)

  - autonomous-workflow.sh: 575 lines ✅
  - clear-stuck-prompts.sh: 82 lines ✅
  - error-handling.sh: 613 lines ✅
  - tmux-utils.sh: 893 lines ✅

  Accuracy

  - Script count is exactly 132 ✅
  - Response Awareness in .claude/commands/, not .claude/skills/
  - clear-stuck-prompts.sh is production-critical and documented in CLAUDE.md
  - autonomous-workflow.sh is bead lifecycle orchestration
  - Hardcoded paths exist (more widespread than claimed)

  Concerns

  - Finding: Autonomous-workflow has hardcoded agent names - NOT upstream-ready
  - Finding: Response Awareness structure is DIFFERENT (not identical)
  - Finding: Hardcoded paths more extensive than documented
  - Risk: Wave 2 subtree pull could overwrite critical files
  - Compatible: Role-based mapping works with Roundtable's current topology

  ---
  🎯 RECOMMENDATIONS

  1. Add to Migration Plan

  Before Wave 2:
  # Create backup of enhanced scripts
  cp scripts/maf/lib/*.sh scripts/maf/lib/.backup/
  cp scripts/maf/clear-stuck-prompts.sh scripts/maf/.backup/

  # After subtree pull, restore enhanced versions
  cp scripts/maf/lib/.backup/* scripts/maf/lib/

  Don't upstream autonomous-workflow.sh yet:
  - Needs refactoring for role-based agent lookups
  - Create issue: "Refactor autonomous-workflow for generic agent support"

  ---
  2. Update Migration Plan Document

  Add these findings:
  - Response Awareness structure mismatch (.claude/commands/ vs .claude/skills/)
  - Autonomous-workflow not upstream-ready without refactoring
  - Hook script hardcoded paths need addressing
  - Enhanced script preservation strategy

  ---
  3. New Upstream Candidates

  Add to Wave 1:
  - scripts/maf/clear-stuck-prompts.sh (82 lines, production-critical)

  Don't upstream yet:
  - scripts/maf/autonomous-workflow.sh (needs refactoring)

  ---
  Summary

  All line counts: EXACTLY CORRECT ✅

  All file existence claims: VERIFIED ✅

  New concerns identified:
  1. Response Awareness structural mismatch (not identical)
  2. Autonomous-workflow needs refactoring before upstream
  3. Hardcoded paths more widespread than documented
  4. Hook scripts need subtree-aware path updates

  Migration impact: LOW risk for Wave 1, MEDIUM risk for Wave 2 without mitigation