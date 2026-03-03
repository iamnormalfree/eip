# NextNest: MAF Migration Verification Round 2

**Date:** 2026-01-08
**Purpose:** Please verify the CORRECTED findings below are accurate for NextNest
**Version:** v2 - Post-Correction Verification

---

## What We Claimed (Original) → What We Changed

### Claim #1: NextNest Root/Subtree Relationship Was REVERSED

**Original Claim (WRONG):**
- Root config (.maf/config/): v1.0.0, session "maf-cli"
- Subtree config (maf/.maf/config): v2.0.0, session "maf-nn"

**Correction (CORRECT):**
- Root config (.maf/config/): **v2.0.0**, session "**maf-nn**" (ENHANCED, OUTSIDE subtree)
- Subtree config (maf/.maf/config): **v1.0.0**, session "**maf-cli**" (PRISTINE from HQ)

**Impact:** Migration is SAFER than we thought - v2.0.0 enhancements are outside subtree

**Please verify:**
```bash
# Check root config
echo "=== Root Config (.maf/config/) ==="
jq '{version: .version, session: .session}' .maf/config/agent-topology.json

# Check subtree config
echo ""
echo "=== Subtree Config (maf/.maf/config/) ==="
jq '{version: .version, session: .session}' maf/.maf/config/agent-topology.json

# Check context manager
echo ""
echo "=== Context Manager Session ==="
grep "MAF_TMUX_SESSION" maf/scripts/maf/context-manager-nextnest.sh
```

**Expected Results:**
- Root config: version="2.0.0", session="maf-nn"
- Subtree config: version="1.0.0", session="maf-cli"
- Context manager: MAF_TMUX_SESSION="maf-nn"

**Question:**
- [ ] Confirmed: Root is v2.0.0 with "maf-nn"?
- [ ] Confirmed: Subtree is v1.0.0 with "maf-cli"?
- [ ] Confirmed: This makes subtree restore safer?

---

### Claim #2: Session Name Strategy Revised

**Original Claim:** Standardize all repos to "maf-cli"

**Correction:** **Keep "maf-nn"** for NextNest - current state works

**Rationale:**
- Root config and context manager already use "maf-nn" (consistent)
- Agents currently running in "maf-nn" session
- Changing to "maf-cli" would break active workflows
- Subtree config uses "maf-cli" but gets overridden by env vars

**Please verify:**
```bash
# Check current session usage
echo "=== Current Session Names ==="
echo "Root config: $(jq -r '.session' .maf/config/agent-topology.json)"
echo "Subtree config: $(jq -r '.session' maf/.maf/config/agent-topology.json)"
echo "Context manager: $(grep MAF_TMUX_SESSION maf/scripts/maf/context-manager-nextnest.sh | cut -d= -f2 | tr -d '"')"

# Check if agents are currently running
echo ""
echo "=== Active Tmux Sessions ==="
tmux list-sessions 2>/dev/null | grep maf
```

**Question:**
- [ ] Confirmed: Current state uses "maf-nn" in root and context manager?
- [ ] Confirmed: Changing to "maf-cli" would break active workflows?
- [ ] Is keeping "maf-nn" the right approach?

---

### Claim #3: agent-startup.sh Dependency at 3 Specific Lines

**Original Claim:** Referenced by rebuild-maf-cli-agents.sh

**Correction:** Referenced at **3 specific lines**: 47, 273, 284

**Please verify:**
```bash
# Find all references to agent-startup.sh
echo "=== agent-startup.sh references ==="
grep -n "agent-startup.sh" maf/scripts/maf/rebuild-maf-cli-agents.sh

# Check the AGENT_STARTUP_WRAPPER variable
echo ""
echo "=== AGENT_STARTUP_WRAPPER variable ==="
grep -n "AGENT_STARTUP_WRAPPER" maf/scripts/maf/rebuild-maf-cli-agents.sh
```

**Expected Findings:**
- Line 47: `AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"`
- Line 273: Reference to `$AGENT_STARTUP_WRAPPER` in wrapped_cmd
- Line 284: Another reference to `$AGENT_STARTUP_WRAPPER` in wrapped_cmd

**Question:**
- [ ] Confirmed: All 3 lines exist?
- [ ] Confirmed: All 3 must be updated when moving agent-startup.sh?
- [ ] Are there any other references we missed?

---

### Claim #4: Memlayer Dependencies Are BROKEN

**Original Claim:** No mention of memlayer issues

**Correction:** Scripts are referenced but DON'T EXIST

**Please verify:**
```bash
# Check if memlayer scripts exist
echo "=== Memlayer Scripts ==="
ls -la maf/scripts/memlayer/ 2>&1

# Check what references them
echo ""
echo "=== References to memlayer ==="
grep -r "memlayer" maf/scripts/maf/context-manager-v2.sh
```

**Expected Findings:**
- Directory `maf/scripts/memlayer/` does NOT exist
- But context-manager-v2.sh references:
  - `AGENT_MAIL_FETCH_SCRIPT="${MAF_AGENT_MAIL_FETCH_SCRIPT:-/root/projects/nextnest/maf/scripts/memlayer/fetch-agent-mail.sh}"`
  - `MEMORY_SCRIPT="${MAF_MEMORY_SCRIPT:-/root/projects/nextnest/maf/scripts/memlayer/push-memlayer.sh}"`

**Question:**
- [ ] Confirmed: Memlayer scripts don't exist?
- [ ] Confirmed: Context manager references them anyway?
- [ ] Is this causing silent failures?

---

### Claim #5: Enhanced Hardcoded Path Audit

**Original Claim:** Limited hardcoded paths

**Correction:** Much more widespread than originally documented

**Please verify:**
```bash
# Comprehensive hardcoded path audit
echo "=== Files with hardcoded /root/projects/nextnest paths ==="
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
  -exec grep -l "/root/projects/nextnest" {} \; 2>/dev/null

# Count them
echo ""
echo "=== Total count ==="
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
  -exec grep -l "/root/projects/nextnest" {} \; 2>/dev/null | wc -l
```

**Expected Findings:**
- More files than originally documented
- context-manager-v2.sh has 10+ references
- rebuild-maf-cli-agents.sh has SESSION_NAME="maf-nn"
- All use ${VAR:-default} fallback syntax (can be overridden by env vars)

**Question:**
- [ ] How many files with hardcoded paths did you find?
- [ ] Are there more than we originally documented?
- [ ] Are the ${VAR:-default} patterns appropriate?

---

## Migration Impact Questions

### Question 1: Wave 2 Session Name Strategy

**Our Revised Strategy for NextNest Wave 2:**

```bash
# KEEP "maf-nn" in root config (already correct)
# UPDATE subtree config to "maf-nn" to match
jq '.session = "maf-nn"' maf/.maf/config/agent-topology.json > /tmp/st-config.json
mv /tmp/st-config.json maf/.maf/config/agent-topology.json

# KEEP context manager as "maf-nn" (already correct)
# Verify all 3 locations match
grep -n "session.*maf" .maf/config/agent-topology.json maf/.maf/config/agent-topology.json maf/scripts/maf/context-manager-nextnest.sh
```

**From NextNest's perspective:**
- [ ] This approach is correct
- [ ] This approach is wrong (please explain)
- [ ] No concern - any consistent session name works

**If wrong, what's the issue?**

---

### Question 2: Memlayer Fix Strategy

**Our Strategy for Wave 2:**

```bash
# Option 1: Remove broken references
# Update context-manager-v2.sh to not call memlayer scripts

# Option 2: Implement memlayer properly
# Create or copy memlayer scripts from source

# Option 3: Document as known limitation
# Add to known issues list
```

**From NextNest's perspective:**
- [ ] Option 1 is correct (remove references)
- [ ] Option 2 is correct (implement properly)
- [ ] Option 3 is correct (document limitation)
- [ ] Different approach needed (please explain)

**Which option should we use?**

---

### Question 3: agent-startup.sh Move Safety

**Our Strategy for Wave 2:**

```bash
# Move from maf/scripts/maf/agent-startup.sh to scripts/maf/agent-startup.sh
mv maf/scripts/maf/agent-startup.sh scripts/maf/

# Update all 3 references in rebuild-maf-cli-agents.sh (lines 47, 273, 284)
sed -i 's|${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh|${PROJECT_ROOT}/scripts/maf/agent-startup.sh|' \
  maf/scripts/maf/rebuild-maf-cli-agents.sh

# Verify all 3 locations updated
grep -n "AGENT_STARTUP_WRAPPER" maf/scripts/maf/rebuild-maf-cli-agents.sh
```

**From NextNest's perspective:**
- [ ] This is the correct approach
- [ ] This will break something (please explain)
- [ ] Different approach needed (please explain)

**What's your assessment?**

---

### Question 4: Subtree Restore Safety

**Our Claim:** Subtree restore is SAFE because v2.0.0 is outside subtree

**Rationale:**
- Root config (.maf/config/) has v2.0.0 enhancements (outside subtree)
- Subtree config (maf/.maf/config/) is v1.0.0 from HQ (pristine)
- Restoring subtree to v1.0.0 won't delete v2.0.0 features

**From NextNest's perspective:**
- [ ] This assessment is accurate
- [ ] This assessment is wrong (please explain)
- [ ] Additional risks we haven't considered (please explain)

**What's your view?**

---

## What We Need You to Confirm

### Critical Confirmations (ALL required)

1. **[ ] Root config is v2.0.0 with "maf-nn"** - Confirm correction
2. **[ ] Subtree config is v1.0.0 with "maf-cli"** - Confirm correction
3. **[ ] agent-startup.sh at 3 specific lines** - Confirm lines 47, 273, 284
4. **[ ] Memlayer scripts don't exist** - Confirm broken dependencies
5. **[ ] Session name "maf-nn" should be kept** - Confirm revised strategy
6. **[ ] Subtree restore is safe** - Confirm v2.0.0 outside subtree

### Impact Confirmations

7. **[ ] Wave 2 approach is appropriate** - Confirm our NextNest-specific plan
8. **[ ] Memlayer fix strategy is correct** - Which option should we use?
9. **[ ] agent-startup.sh move is safe** - Confirm 3-line update approach
10. **[ ] No additional risks** - Any issues we haven't considered?

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
# 1. Verify root/subtree relationship
echo "=== Root Config ==="
jq '{version: .version, session: .session}' .maf/config/agent-topology.json

echo ""
echo "=== Subtree Config ==="
jq '{version: .version, session: .session}' maf/.maf/config/agent-topology.json

# 2. Verify session names
echo ""
echo "=== Session Names ==="
echo "Root: $(jq -r '.session' .maf/config/agent-topology.json)"
echo "Subtree: $(jq -r '.session' maf/.maf/config/agent-topology.json)"
echo "Context Manager: $(grep MAF_TMUX_SESSION maf/scripts/maf/context-manager-nextnest.sh | cut -d= -f2 | tr -d '"')"

# 3. Verify agent-startup.sh references
echo ""
echo "=== agent-startup.sh References ==="
grep -n "agent-startup.sh" maf/scripts/maf/rebuild-maf-cli-agents.sh

# 4. Check memlayer dependencies
echo ""
echo "=== Memlayer Scripts ==="
ls -la maf/scripts/memlayer/ 2>&1

echo ""
echo "=== Memlayer References ==="
grep -n "memlayer" maf/scripts/maf/context-manager-v2.sh

# 5. Check hardcoded paths
echo ""
echo "=== Hardcoded Paths Count ==="
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
  -exec grep -l "/root/projects/nextnest" {} \; 2>/dev/null | wc -l
```

---

## Report Back With

1. **Confirmation of root/subtree correction** - Is root v2.0.0 and subtree v1.0.0?
2. **Confirmation of session name strategy** - Should we keep "maf-nn"?
3. **Memlayer fix approach** - Which option should we use?
4. **agent-startup.sh safety** - Is the 3-line update correct?
5. **Any additional risks** - What did we miss?
6. **Wave 2 approval** - Is our NextNest Wave 2 plan appropriate?

---

## Context: Why These Corrections Matter

### Original Understanding Was Wrong

We originally thought:
- Root config was v1.0.0 (needs upgrade)
- Subtree config was v2.0.0 (customized)
- This meant subtree restore would LOSE enhancements

### Corrected Understanding

Actually:
- Root config is v2.0.0 (ENHANCED, outside subtree)
- Subtree config is v1.0.0 (PRISTINE from HQ)
- This means subtree restore is SAFE (won't lose v2.0.0 features)

### Impact

**GOOD NEWS:**
- Migration is safer than we thought
- v2.0.0 enhancements are protected (outside subtree)
- Subtree restore won't delete custom features

**CHANGES NEEDED:**
- Session name strategy revised (keep "maf-nn")
- Subtree config should be updated to "maf-nn" to match root
- Enhanced scripts backup not needed for NextNest (unlike Roundtable)

---

**Thank you for verifying our corrected migration plan!**

Your feedback ensures the NextNest (canary) migration proceeds safely and provides the right template for Roundtable.


NOTES FROM NEXTNEST REPO:
  NextNest Verification Response - CRITICAL DISCREPANCIES FOUND

  ❗ CRITICAL ERROR: v2 Document Has Root/Subtree REVERSED Again

  The v2 document claims the "correction" is:
  - Root config (.maf/config/): v2.0.0, session "maf-nn"
  - Subtree config (maf/.maf/config/): v1.0.0, session "maf-cli"

  BUT ACTUAL REALITY IS THE OPPOSITE:

  ✅ Verified Results:
  === Root Config (.maf/config/) ===
  {
    "version": "1.0.0",    # NOT 2.0.0
    "session": "maf-cli"   # NOT "maf-nn"
  }

  === Subtree Config (maf/.maf/config/) ===
  {
    "version": "2.0.0",    # NOT 1.0.0
    "session": "maf-nn"    # NOT "maf-cli"
  }

  === Line Counts ===
    67 .maf/config/agent-topology.json      # Root config
    141 maf/.maf/config/agent-topology.json # Subtree config

  This means:
  - ❌ The v2 document's "correction" is actually WRONG
  - ✅ The original v1 analysis was CORRECT
  - The subtree config IS v2.0.0 (customized by NextNest)
  - The root config IS v1.0.0 (simpler version)

  Migration Impact: This completely changes the risk assessment. Restoring the subtree to pristine WILL LOSE the v2.0.0 enhancements.

  ---
  Detailed Verification Results

  Claim #1: Root/Subtree Relationship - v2 DOCUMENT IS WRONG
  ┌────────────────────────────┬───────────────────────────┬──────────┐
  │       What v2 Claims       │      Actual Reality       │  Status  │
  ├────────────────────────────┼───────────────────────────┼──────────┤
  │ Root: v2.0.0, "maf-nn"     │ Root: v1.0.0, "maf-cli"   │ ❌ WRONG │
  ├────────────────────────────┼───────────────────────────┼──────────┤
  │ Subtree: v1.0.0, "maf-cli" │ Subtree: v2.0.0, "maf-nn" │ ❌ WRONG │
  └────────────────────────────┴───────────────────────────┴──────────┘
  Verification Commands Run:
  $ jq '{version: .version, session: .pod.session}' .maf/config/agent-topology.json
  {
    "version": "1.0.0",
    "session": "maf-cli"
  }

  $ jq '{version: .version, session: .pod.session}' maf/.maf/config/agent-topology.json
  {
    "version": "2.0.0",
    "session": "maf-nn"
  }

  ✅ Confirm: Root is v1.0.0 with "maf-cli"
  ✅ Confirm: Subtree is v2.0.0 with "maf-nn"
  ❌ Dispute: v2 document's "correction" is backwards

  ---
  Claim #2: Session Name Strategy - Context Matches Active Session

  === Session Names ===
  Root: maf-cli
  Subtree: maf-nn
  Context Manager: maf-nn

  === Active Tmux Sessions ===
  maf-nn: 1 windows (created Wed Jan  7 03:50:20 2026) (attached)

  What's happening:
  - Subtree config and context manager both use "maf-nn" (consistent)
  - Root config uses "maf-cli" (but is likely overridden)
  - Active session is "maf-nn" (what agents are actually using)

  ✅ Confirm: Current state uses "maf-nn" for running agents
  ✅ Confirm: Changing to "maf-cli" would break active workflows
  ⚠️ Partial Dispute: Root config is "maf-cli" but gets overridden

  Recommendation: Keep "maf-nn" since that's what's working.

  ---
  Claim #3: agent-startup.sh Dependencies - CONFIRMED at 3 Lines

  $ grep -n "agent-startup.sh" maf/scripts/maf/rebuild-maf-cli-agents.sh
  47:AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"

  $ grep -n "AGENT_STARTUP_WRAPPER" maf/scripts/maf/rebuild-maf-cli-agents.sh
  47:AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"
  273:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd
  284:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd

  ✅ Confirm: All 3 lines exist (47, 273, 284)
  ✅ Confirm: All 3 must be updated when moving agent-startup.sh
  ✅ No additional references found

  ---
  Claim #4: Memlayer Dependencies - CORRECTED INFORMATION

  $ ls -la maf/scripts/memlayer/
  ls: cannot access 'maf/scripts/memlayer/': No such file or directory

  ⚠️ CORRECTION: The scripts are NOT in a memlayer/ subdirectory. The actual paths are:

  $ sed -n '19p;22p;25p' maf/scripts/maf/context-manager-v2.sh
  19:AGENT_MAIL_PROJECT="${MAF_AGENT_MAIL_PROJECT:-/root/projects/nextnest}"
  22:AGENT_MAIL_FETCH_SCRIPT="${MAF_AGENT_MAIL_FETCH_SCRIPT:-/root/projects/nextnest/maf/scripts/maf/agent-mail-fetch.sh}"
  25:MEMORY_SCRIPT="${MAF_MEMORY_SCRIPT:-/root/projects/nextnest/maf/scripts/maf/agent-memory.sh}"

  Verification:
  $ ls -la maf/scripts/maf/agent-mail-fetch.sh maf/scripts/maf/agent-memory.sh
  ls: cannot access 'maf/scripts/maf/agent-mail-fetch.sh': No such file or directory
  ls: cannot access 'maf/scripts/maf/agent-memory.sh': No such file or directory

  ✅ Confirm: Scripts don't exist (but they're NOT in a memlayer/ subdir)
  ✅ Confirm: Context manager references them anyway
  ✅ Confirm: This causes silent failures (features are skipped)

  ---
  Claim #5: Hardcoded Path Audit - CONFIRMED Widespread

  $ find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.py" \) \
      -exec grep -l "/root/projects/nextnest" {} \; 2>/dev/null | wc -l
  15

  ✅ Confirmed: 15 files with hardcoded /root/projects/nextnest paths

  Files affected:
  1. ./maf/archive/2025-01-06/context-manager-nextnest-simple.archived.sh
  2. ./maf/scripts/maf/delegate-decision.sh
  3. ./maf/scripts/maf/autonomous-workflow-nextnest.sh
  4. ./maf/scripts/maf/autonomous-decision-delegate.sh
  5. ./maf/scripts/maf/audit-closed-beads.sh
  6. ./maf/scripts/maf/autonomous-workflow.sh
  7. ./maf/scripts/maf/broadcast-role-prompts.sh
  8. ./maf/scripts/maf/agent-startup.sh
  9. ./maf/scripts/maf/context-manager-v2.sh (10+ references)
  10. ./maf/scripts/maf/context-manager-nextnest.sh
  11. ./maf/scripts/maf/context-manager-v2-backup.sh
  12. ./maf/scripts/maf/delegate-response.sh
  13. ./maf/scripts/maf/workflow-health-check.sh
  14. ./maf/.maf/config/agent-topology.json
  15. ./maf/.maf/config/custom-agent-config.json

  ✅ Confirm: More widespread than originally documented
  ✅ Confirm: All use ${VAR:-default} fallback syntax

  ---
  Migration Impact Questions - My Responses

  Question 1: Wave 2 Session Name Strategy

  v2 document strategy:
  # KEEP "maf-nn" in root config (already correct)
  # UPDATE subtree config to "maf-nn" to match

  ❌ THIS IS WRONG because root config is actually "maf-cli" and subtree is "maf-nn".

  My assessment:
  - Current state: subtree is "maf-nn", context manager is "maf-nn", active session is "maf-nn"
  - Root config is "maf-cli" but gets overridden
  - CORRECT strategy: Leave subtree as "maf-nn" (it's already working)
  - CORRECT strategy: Update root config to "maf-nn" to match
  - OR: Accept mismatch and rely on env var overrides

  Recommendation: Don't change anything - current state works.

  ---
  Question 2: Memlayer Fix Strategy

  ❗ CORRECTION: Scripts are NOT in memlayer/ subdir, they're:
  - maf/scripts/maf/agent-mail-fetch.sh
  - maf/scripts/maf/agent-memory.sh

  Options:

  Option 1: Remove broken references
  - Update context-manager-v2.sh to not call these scripts
  - Lose memory and agent-mail features

  Option 2: Implement scripts properly
  - Create maf/scripts/maf/agent-mail-fetch.sh
  - Create maf/scripts/maf/agent-memory.sh
  - Or copy from wherever they should come from

  Option 3: Document as known limitation
  - Add to known issues list
  - Features fail silently

  My choice: Option 2 (implement properly) - features are clearly designed to work, scripts just need to be created.

  ---
  Question 3: agent-startup.sh Move Safety

  v2 strategy:
  # Move from maf/scripts/maf/agent-startup.sh to scripts/maf/agent-startup.sh
  # Update all 3 references (lines 47, 273, 284)

  ✅ This is the correct approach.

  My assessment:
  - ✅ Path update is straightforward
  - ✅ All 3 locations identified correctly
  - ⚠️ Must test agent spawning after change

  Recommendation: Proceed with this approach, add test to verify agents spawn.

  ---
  Question 4: Subtree Restore Safety

  v2 claim: "Subtree restore is SAFE because v2.0.0 is outside subtree"

  ❌ THIS IS WRONG because:
  - Subtree config IS v2.0.0 (with all enhancements)
  - Root config IS v1.0.0 (simpler)
  - Restoring subtree WILL LOSE v2.0.0 features

  What gets lost if subtree is restored:
  - metadata section
  - agent_type for each pane
  - agent_type_mappings with environment variables
  - worktrees schema
  - Expanded capabilities arrays
  - Session name "maf-nn" (reverts to "maf-cli")

  My assessment:
  - ❌ Subtree restore is NOT SAFE
  - ❌ v2.0.0 enhancements are INSIDE subtree
  - ❌ Will lose custom features

  Recommendation: Either:
  1. Don't restore subtree to pristine (keep v2.0.0)
  2. Preserve v2.0.0 to root config before restoring subtree
  3. Make v2.0.0 part of HQ (upstream it)

  ---
  Discrepancy Report
  ┌───────────────────────┬───────────────────────┬─────────────────────────┬─────────────────────────────┐
  │         Claim         │     What v2 Said      │         Reality         │           Impact            │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Root config version   │ v2.0.0                │ v1.0.0                  │ HIGH - v2 has it backwards  │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Root config session   │ "maf-nn"              │ "maf-cli"               │ HIGH - v2 has it backwards  │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Subtree config        │ v1.0.0                │ v2.0.0                  │ HIGH - v2 has it backwards  │
  │ version               │                       │                         │                             │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Subtree config        │ "maf-cli"             │ "maf-nn"                │ HIGH - v2 has it backwards  │
  │ session               │                       │                         │                             │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Subtree restore       │ Safe (v2.0.0 outside) │ NOT safe (v2.0.0        │ CRITICAL - will lose        │
  │ safety                │                       │ inside)                 │ features                    │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Memlayer subdir       │ maf/scripts/memlayer/ │ maf/scripts/maf/        │ Medium - wrong path         │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ agent-startup.sh      │ 47, 273, 284          │ 47, 273, 284            │ ✅ Correct                  │
  │ lines                 │                       │                         │                             │
  ├───────────────────────┼───────────────────────┼─────────────────────────┼─────────────────────────────┤
  │ Hardcoded paths count │ Widespread            │ 15 files                │ ✅ Confirmed                │
  └───────────────────────┴───────────────────────┴─────────────────────────┴─────────────────────────────┘
  ---
  Critical Confirmations

  1. ❌ Root config is v1.0.0 with "maf-cli" - v2 document is WRONG
  2. ❌ Subtree config is v2.0.0 with "maf-nn" - v2 document is WRONG
  3. ✅ agent-startup.sh at 3 specific lines - Confirmed lines 47, 273, 284
  4. ✅ Memory/mail scripts don't exist - But paths are wrong in v2 doc
  5. ✅ Session name "maf-nn" should be kept - Confirmed working
  6. ❌ Subtree restore is NOT safe - v2 document is WRONG

  ---
  Additional Risks Not Considered

  Risk #1: v2.0.0 Schema Backward Compatibility

  Issue: If subtree is restored to v1.0.0 (from HQ), will scripts that expect v2.0.0 fields break?

  Scripts that check for v2.0.0 fields:
  - agent_type_mappings
  - metadata
  - worktrees
  - agent_type in panes

  Unknown: Which scripts use these fields? Will they fail gracefully?

  ---
  Risk #2: Environment Variable Override Chain

  Issue: Multiple layers of overrides make debugging difficult.

  Override chain:
  1. Hardcoded default in script
  2. Environment variable (${VAR:-default})
  3. Config file (.maf/config/agent-topology.json)
  4. Command-line flags

  Unknown: Which takes precedence? Is this documented?

  ---
  Risk #3: Active Session Will Break

  Issue: Agents currently running in "maf-nn" session. If configs change to "maf-cli", what happens?

  Current state:
  tmux list-sessions
  maf-nn: 1 windows (created Wed Jan  7 03:50:20 2026) (attached)

  Risk: Changing configs might:
  - Detach from current session
  - Fail to find "maf-cli" session
  - Require manual tmux session management

  ---
  Final Recommendations

  For Wave 2 (NextNest):

  1. ❌ DON'T restore subtree to pristine - will lose v2.0.0 features
  2. ✅ DO keep "maf-nn" session - it's working
  3. ✅ DO move agent-startup.sh - with 3-line update
  4. ⚠️ MUST preserve v2.0.0 schema - copy to root config before any subtree restore
  5. ⚠️ SHOULD implement memory/mail scripts - features are broken

  Revised Wave 2 Strategy:

  # Step 1: Preserve v2.0.0 config
  cp maf/.maf/config/agent-topology.json /tmp/nextnest-v2-config-backup.json

  # Step 2: Extract v2.0.0 enhancements to root config
  # (manual step: merge v2.0.0 fields into .maf/config/agent-topology.json)

  # Step 3: Move untracked files
  mv maf/scripts/maf/agent-startup.sh scripts/maf/
  mv maf/scripts/maf/context-manager-nextnest.sh scripts/maf/

  # Step 4: Update references
  sed -i 's|${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh|${PROJECT_ROOT}/scripts/maf/agent-startup.sh|' \
    maf/scripts/maf/rebuild-maf-cli-agents.sh

  # Step 5: NOW restore subtree (v2.0.0 is safe in root config)
  git checkout maf/.maf/config/agent-topology.json

  # Step 6: Implement missing scripts
  # Create agent-mail-fetch.sh and agent-memory.sh

  # Step 7: Test
  bash maf/scripts/maf/rebuild-maf-cli-agents.sh

  ---
  Wave 2 Approval: ❌ Current plan will break NextNest. Revised approach above is required.

  Summary: The v2 document has the root/subtree relationship backwards, which leads to incorrect risk assessment. Subtree restore is NOT safe as currently planned.
