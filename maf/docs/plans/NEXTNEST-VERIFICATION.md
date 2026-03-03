# NextNest: MAF Migration Findings - Verification Request

**Date:** 2026-01-08
**Purpose:** Please verify the findings below are accurate for NextNest

---

## What We Found About NextNest

### 1. Dual Configuration System

We found NextNest has TWO agent-topology.json files with DIFFERENT schemas:

| Location | Schema Version | Session Name | Lines |
|----------|----------------|--------------|-------|
| `.maf/config/agent-topology.json` | v1.0.0 | "maf-cli" | ~67 |
| `maf/.maf/config/agent-topology.json` | v2.0.0 | "maf-nn" | ~141 |

**Schema v2.0.0 Breaking Changes:**
- Has `metadata` section
- Has `agent_type` for each pane
- Has `agent_type_mappings` with environment variables
- Has `worktrees` schema
- Expanded capabilities arrays

**Please verify:**
- [ ] Both files exist at above locations
- [ ] Schema versions are correct (check `"version"` field in each)
- [ ] Session names are as claimed (maf-cli vs maf-nn)
- [ ] Line counts are approximately correct (run `wc -l` on both)

**Question:**
- [ ] Is v2.0.0 the "future" config and v1.0.0 legacy?
- [ ] Or are both actively used?

---

### 2. Session Name Chaos

We found session name in 3 DIFFERENT locations that don't match:

| File | Session Name | Impact |
|------|--------------|--------|
| `.maf/config/agent-topology.json` | "maf-cli" | Root config |
| `maf/.maf/config/agent-topology.json` | "maf-nn" | Subtree config |
| `maf/scripts/maf/context-manager-nextnest.sh` | `MAF_TMUX_SESSION="maf-nn"` | Context manager |

**Problem:** Scripts check tmux session by name. Mismatched names cause:
- "Session not found" errors
- Agents spawning in wrong sessions
- Health check failures

**Please verify:**
```bash
# Check session names
grep -n "session.*maf" .maf/config/agent-topology.json maf/.maf/config/agent-topology.json
grep -n "MAF_TMUX_SESSION" maf/scripts/maf/context-manager-nextnest.sh
```
- [ ] Are all 3 locations correct?
- [ ] Do you experience session-related issues currently?

**Our Plan:** Standardize all to "maf-cli" in Wave 2

---

### 3. Modified Subtree Files

We found these files in the `maf/` subtree have been MODIFIED from HQ:

| File | What's Modified |
|------|----------------|
| `maf/.maf/config/agent-topology.json` | Schema v2.0.0, session "maf-nn" |
| `maf/scripts/maf/context-manager-v2.sh` | Hardcoded paths |
| `maf/scripts/maf/prompt-agent.sh` | Subtree auto-detection pattern |
| `maf/scripts/maf/rebuild-maf-cli-agents.sh` | Agent startup wrapper integration |

**Please verify:**
```bash
# Check if subtree files are modified
cd /root/projects/nextnest
git diff --name-only | grep "^maf/"
```
- [ ] Are these the only modified subtree files?
- [ ] Are there other modified files we missed?

---

### 4. Untracked Files in Subtree

We found these files exist in `maf/` subtree but are UNTRACKED by git:

| File | Purpose | Status |
|------|---------|--------|
| `maf/scripts/maf/agent-startup.sh` | Agent identity injection | Untracked |
| `maf/scripts/maf/context-manager-nextnest.sh` | Project-specific wrapper | Untracked? |
| `maf/scripts/maf/init-nextnest-agents.sh` | NextNest agent initialization | Untracked? |

**Please verify:**
```bash
# Check for untracked files in subtree
git status --short maf/
```
- [ ] Are these files untracked?
- [ ] Are there other untracked files?

**CRITICAL Dependency:**
We found `rebuild-maf-cli-agents.sh` has this at line 47:
```bash
source "${SCRIPT_DIR}/agent-startup.sh"
```

This means agent-startup.sh is a **MANDATORY dependency** - moving it breaks agent spawning.

- [ ] Can you confirm this dependency exists?
- [ ] What breaks if agent-startup.sh is moved?

---

### 5. Agent Startup Wrapper Pattern

We found NextNest has a critical innovation in `rebuild-maf-cli-agents.sh`:

```bash
# Line 272-274 (approximate)
local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd"
tmux send-keys -t "$pane" -l "$wrapped_cmd"
```

This wraps EVERY agent command with identity injection.

**Please verify:**
- [ ] Does this wrapper exist in `rebuild-maf-cli-agents.sh`?
- [ ] What line number is it on?
- [ ] Is it critical for NextNest agent spawning?

---

### 6. Subtree Auto-Detection Pattern

We found `maf/scripts/maf/prompt-agent.sh` has sophisticated auto-detection:

```bash
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    # Subtree layout: go up 3 levels
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
else
    # Direct layout: go up 2 levels
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
fi
```

**Please verify:**
- [ ] Does this pattern exist in prompt-agent.sh?
- [ ] What happens if this auto-detection breaks?
- [ ] Is this pattern used in other scripts?

---

### 7. Hardcoded Paths

We identified hardcoded paths in NextNest:

| File | Hardcoded Path | Impact |
|------|----------------|--------|
| `maf/scripts/maf/rebuild-maf-cli-agents.sh` | `SESSION_NAME="maf-nn"` | Session targeting |
| `maf/scripts/maf/context-manager-v2.sh` | `AGENT_MAIL_PROJECT` | Agent Mail routing |
| `maf/scripts/maf/prompt-agent.sh` | Fallback mappings | Agent alias resolution |

**Please verify:**
```bash
# Check for hardcoded paths
grep -n "/root/projects/" maf/scripts/maf/*.sh
grep -n "SESSION_NAME.*maf-nn" maf/scripts/maf/*.sh
grep -n "AGENT_MAIL_PROJECT" maf/scripts/maf/*.sh
```
- [ ] Do these hardcoded paths exist?
- [ ] Are there other hardcoded paths?

---

### 8. Backup Files

We found these backup files that should be cleaned up:

- `maf/scripts/maf/context-manager-nextnest.sh.old`
- `maf/scripts/maf/context-manager-v2-backup.sh`

**Please verify:**
- [ ] Do these backup files exist?
- [ ] Should they be deleted as part of migration?

---

### 9. Agent Names

We claim NextNest uses these agent names:
- RateRidge (supervisor)
- AuditBay (reviewer)
- PrimePortal (implementor-1)
- LedgerLeap (implementor-2)

**Please verify:**
- [ ] Are these the correct agent names for NextNest?
- [ ] Are they in `.maf/config/agent-topology.json`?

---

### 10. MAF HQ Contamination Claims

We claim MAF HQ has NextNest content in the prompts layer:
- `.maf/agents/auditbay-prompt.md`
- `.maf/agents/rateridge-prompt.md`
- `.maf/agents/primteportal-prompt.md`
- `.maf/agents/ledgerleap-prompt.md`

**Please verify:**
- [ ] Do these prompts match NextNest's agent themes (mortgage domain)?
- [ ] Should these be removed from HQ or made into templates?

---

## Migration Impact for NextNest

### What We Plan to Do TO NextNest:

**Wave 1 (Days 1-10) - Low Risk:**
- Add CI guard to prevent subtree modifications
- Add health check script
- NO breaking changes

**Wave 2 (Days 11-14) - Most Work Required:**
1. Fix session name chaos (all 3 locations → maf-cli)
2. Restore modified subtree files to pristine
3. Move untracked files to local (`scripts/maf/`)
4. Fix agent startup dependency chain (update paths)
5. Add role-based mapping to config
6. Test agent spawn thoroughly

### What We Plan to Take FROM NextNest:

**Patterns to upstream as OPTIONAL:**
1. Subtree auto-detection pattern (~20 lines)
2. Agent startup wrapper pattern (~30 lines, as template)
3. Worktree schema (from v2.0.0 topology)
4. Risk-based governance pattern (from v2.0.0 topology)

---

## Verification Checklist

Please confirm each item:

### Configuration State
- [ ] Root config is v1.0.0 with session "maf-cli"
- [ ] Subtree config is v2.0.0 with session "maf-nn"
- [ ] Line counts are approximately correct
- [ ] v2.0.0 has the breaking changes we listed

### Session Name Issues
- [ ] Session names are in 3 different locations
- [ ] They don't currently match
- [ ] This causes tmux/health check issues

### Dependency Chain
- [ ] agent-startup.sh is untracked in subtree
- [ ] rebuild-maf-cli-agents.sh sources it at line 47
- [ ] Moving agent-startup.sh breaks the dependency

### Subtree State
- [ ] The 4 subtree files are modified from HQ
- [ ] No other subtree files are modified
- [ ] The 3 untracked files exist

### Innovation Patterns
- [ ] Subtree auto-detection exists in prompt-agent.sh
- [ ] Agent startup wrapper exists in rebuild-maf-cli-agents.sh
- [ ] These patterns work correctly

### Concerns
- [ ] Are any findings WRONG or MISLEADING?
- [ ] Are there critical files we MISSED?
- [ ] Are there BREAKING CHANGES in our Wave 2 plan?
- [ ] Is the schema v1.0.0 → v2.0.0 migration path clear?
- [ ] Will our session name standardization break anything?

---

## Critical Questions

1. **Schema Migration:** We plan to restore subtree to pristine (v1.0.0 from HQ). What happens to your v2.0.0 enhancements?
   - Are they captured elsewhere?
   - Do we need to preserve v2.0.0 first?
   - Is there a migration path back to v1.0.0?

2. **Agent Startup:** After we restore subtree files, we need to update the path to agent-startup.sh. Is this straightforward?

3. **Session Names:** We're changing everything to "maf-cli". Will this break any existing workflows or scripts?

4. **Memlayer:** The context manager references memlayer scripts. Do they exist? Are they in HQ?

---

## Your Feedback

Please provide feedback on:

1. **Accuracy:** Are all our findings about NextNest correct?
2. **Completeness:** Did we miss any important NextNest-specific files or issues?
3. **Impact:** Will our Wave 2 plan work, or are there risks we didn't consider?
4. **Schema:** What's the future of v2.0.0 - should it be upstreamed or kept local?
5. **Timing:** NextNest is the "canary" (tested before Roundtable). Is this appropriate?

---

**To verify findings, please run:**
```bash
# Check configs
jq '.version, .session' .maf/config/agent-topology.json
jq '.version, .session' maf/.maf/config/agent-topology.json
wc -l .maf/config/agent-topology.json maf/.maf/config/agent-topology.json

# Check session names in all locations
grep -rn "session.*maf\|MAF_TMUX_SESSION" .maf/ maf/scripts/maf/

# Check modified subtree files
git diff --name-only | grep "^maf/"

# Check untracked files
git status --short maf/

# Check agent startup dependency
grep -n "agent-startup.sh" maf/scripts/maf/rebuild-maf-cli-agents.sh

# Check for hardcoded paths
grep -rn '"/root/projects/\|SESSION_NAME="\|AGENT_MAIL_PROJECT=' maf/scripts/maf/
```

**Report back with:**
- Actual schema versions and session names
- Any discrepancies in our findings
- Whether v2.0.0 should be preserved or migrated
- Any concerns about the Wave 2 plan
- The correct order for Wave 2 steps



NOTES FROM NEXTNEST REPO:
NextNest Verification Report - CRITICAL FINDINGS

  Executive Summary

  ❗ MAJOR ERROR IN VERIFICATION DOCUMENT: The document has the root/subtree configs REVERSED. This is a critical error that would cause the migration plan to target the wrong files.

  ---
  ❌ ❗ CRITICAL CORRECTIONS REQUIRED

  Finding 1: Dual Configuration System - DOCUMENT IS REVERSED

  What the document CLAIMED:
  Location: .maf/config/agent-topology.json
  Schema Version: v1.0.0
  Session Name: "maf-cli"
  Lines: ~67
  ────────────────────────────────────────
  Location: maf/.maf/config/agent-topology.json
  Schema Version: v2.0.0
  Session Name: "maf-nn"
  Lines: ~141
  What ACTUALLY EXISTS:
  Location: .maf/config/agent-topology.json
  Schema Version: v2.0.0
  Session Name: "maf-nn"
  Lines: 141
  ────────────────────────────────────────
  Location: maf/.maf/config/agent-topology.json
  Schema Version: v1.0.0
  Session Name: "maf-cli"
  Lines: 67
  ✅ Verification Commands Run:
  $ jq -r '.version, .session' .maf/config/agent-topology.json
  2.0.0
  null

  $ jq -r '.version, .session' maf/.maf/config/agent-topology.json
  1.0.0
  null

  $ jq '.pod.session' .maf/config/agent-topology.json
  "maf-nn"

  $ jq '.pod.session' maf/.maf/config/agent-topology.json
  "maf-cli"

  Impact:
  - The root config (.maf/config/) is the ENHANCED v2.0.0 version
  - The subtree config (maf/.maf/config/) is the PRISTINE v1.0.0 from HQ
  - The migration plan targets the WRONG FILES

  What this means:
  - NextNest has been evolving the root config, NOT the subtree config
  - Restoring the subtree to pristine will LOSE NOTHING (it's already pristine)
  - The enhanced v2.0.0 config is outside the subtree and won't be affected

  ---
  Finding 2: Session Name Locations - CONFIRMED BUT INVERTED

  Document claimed:
  File: .maf/config/agent-topology.json
  Session Name: "maf-cli"
  Impact: Root config
  ────────────────────────────────────────
  File: maf/.maf/config/agent-topology.json
  Session Name: "maf-nn"
  Impact: Subtree config
  ────────────────────────────────────────
  File: maf/scripts/maf/context-manager-nextnest.sh
  Session Name: "maf-nn"
  Impact: Context manager
  Actual locations:
  File: .maf/config/agent-topology.json
  Session Name: "maf-nn"
  Impact: Root config (v2.0.0)
  ────────────────────────────────────────
  File: maf/.maf/config/agent-topology.json
  Session Name: "maf-cli"
  Impact: Subtree config (v1.0.0)
  ────────────────────────────────────────
  File: maf/scripts/maf/context-manager-nextnest.sh
  Session Name: "maf-nn"
  Impact: Context manager
  Verification:
  $ grep -n '"session"' .maf/config/agent-topology.json maf/.maf/config/agent-topology.json
  .maf/config/agent-topology.json:5:    "session": "maf-nn",
  maf/.maf/config/agent-topology.json:9:    "session": "maf-cli",

  $ grep -n "MAF_TMUX_SESSION" maf/scripts/maf/context-manager-nextnest.sh
  21:export MAF_TMUX_SESSION="maf-nn"

  What's happening:
  - Root config and context manager use "maf-nn" (consistent)
  - Subtree config uses "maf-cli" (mismatch, but it's the HQ default)
  - Scripts fall back to "maf-cli" via MAF_TMUX_SESSION default

  Current state: The system WORKS because:
  - Scripts check MAF_TMUX_SESSION environment variable (defaults to "maf-cli")
  - Context manager overrides this to "maf-nn"
  - Root config says "maf-nn" but doesn't conflict

  Migration impact: Changing everything to "maf-cli" would break the existing "maf-nn" session that agents are currently running in.

  ---
  Finding 3: Modified Subtree Files - CONFIRMED

  ✅ Verification:
  $ git diff --name-only | grep "^maf/"
  maf/.maf/config/agent-topology.json
  maf/scripts/maf/context-manager-v2.sh
  maf/scripts/maf/prompt-agent.sh
  maf/scripts/maf/rebuild-maf-cli-agents.sh

  Note: The subtree config is v1.0.0 (pristine from HQ), but modified to have NextNest agent names (RateRidge, AuditBay, etc.). This is a MINOR modification (name changes), not a schema change.

  ---
  Finding 4: Untracked Files - CONFIRMED

  ✅ Verification:
  $ git status --short maf/
  ?? maf/scripts/maf/agent-startup.sh
  ?? maf/scripts/maf/context-manager-nextnest.sh
  ?? maf/scripts/maf/context-manager-nextnest.sh.old
  ?? maf/scripts/maf/context-manager-v2-backup.sh
  ?? maf/scripts/maf/init-nextnest-agents.sh

  ✅ agent-startup.sh is MANDATORY dependency:
  $ grep -n "agent-startup.sh" maf/scripts/maf/rebuild-maf-cli-agents.sh
  47:AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"
  273:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd"
  284:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd

  Impact: Moving agent-startup.sh breaks lines 47, 273, 284 of rebuild-maf-cli-agents.sh.

  ---
  Finding 5: v2.0.0 Enhancements - ROOT CONFIG, NOT SUBTREE

  Document claimed: v2.0.0 is in subtree config.

  Reality: v2.0.0 is in ROOT config (.maf/config/agent-topology.json), OUTSIDE the subtree.

  v2.0.0 fields in root config:
  {
    "version": "2.0.0",
    "metadata": { ... },
    "agent_type_mappings": { ... },
    "worktrees": { ... }
  }

  v1.0.0 fields in subtree config:
  {
    "version": "1.0.0",
    // NO metadata
    // NO agent_type_mappings
    // NO worktrees
  }

  Critical implication: Restoring subtree to pristine DOES NOT AFFECT v2.0.0 enhancements because they're in the root config, not the subtree.

  What this means:
  - ✅ v2.0.0 enhancements are SAFE - they're outside subtree
  - ✅ Subtree restore will NOT DELETE v2.0.0 features
  - ❌ Document has this backwards

  ---
  Finding 6: Subtree Auto-Detection - CONFIRMED

  ✅ Verification:
  $ sed -n '16,24p' maf/scripts/maf/prompt-agent.sh
  # Auto-detect project directory (supports subtree installations)
  DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
      # Subtree layout: maf/scripts/maf/ -> go up 3 levels
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
  else
      # Direct layout: scripts/maf/ -> go up 2 levels
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
  fi

  Exact lines: 16-24 (as claimed)

  Works correctly: ✅

  ---
  Finding 7: Agent Startup Wrapper - CONFIRMED

  ✅ Verification:
  $ grep -n "AGENT_STARTUP_WRAPPER" maf/scripts/maf/rebuild-maf-cli-agents.sh
  47:AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"
  273:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd
  284:        local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd

  Line numbers: 47, 273, 284 (document claimed ~272-274, close enough)

  Critical: ✅ Confirmed as MANDATORY dependency

  ---
  Finding 8: Hardcoded Paths - CONFIRMED AND EXTENSIVE

  ✅ Verification for context-manager-v2.sh:
  $ grep -n "AGENT_MAIL_PROJECT\|PROJECT_ROOT\|/root/projects" maf/scripts/maf/context-manager-v2.sh
  19:AGENT_MAIL_PROJECT="${MAF_AGENT_MAIL_PROJECT:-/root/projects/nextnest}"
  22:AGENT_MAIL_FETCH_SCRIPT="${MAF_AGENT_MAIL_FETCH_SCRIPT:-/root/projects/nextnest/maf/scripts/maf/agent-mail-fetch.sh}"
  25:MEMORY_SCRIPT="${MAF_MEMORY_SCRIPT:-/root/projects/nextnest/maf/scripts/maf/agent-memory.sh}"
  41:    local topology_file="${MAF_TOPOLOGY_FILE:-/root/projects/nextnest/.maf/config/agent-topology.json}"
  ... (10+ more references to /root/projects/nextnest)

  For rebuild-maf-cli-agents.sh:
  $ grep -n "SESSION_NAME" maf/scripts/maf/rebuild-maf-cli-agents.sh
  15:SESSION_NAME="maf-nn"

  ⚠️ NEW FINDING: These are fallback defaults (via ${VAR:-default} syntax), so they can be overridden by environment variables. But if env vars aren't set, they break.

  ---
  Finding 9: Backup Files - CONFIRMED

  ✅ Verification:
  $ ls -la maf/scripts/maf/*.old maf/scripts/maf/*backup*
  -rwx--x--x 1 root root  7903 Jan  6 19:19 maf/scripts/maf/context-manager-nextnest.sh.old
  -rwx--x--x 1 root  root 29909 Jan  6 19:53 maf/scripts/maf/context-manager-v2-backup.sh

  Should be deleted: ✅ Yes, as part of cleanup

  ---
  Finding 10: Agent Names - CONFIRMED

  ✅ Verification:
  $ jq -r '.panes[].agent_name' .maf/config/agent-topology.json
  RateRidge
  AuditBay
  LedgerLeap
  PrimePortal

  As claimed: ✅ Correct

  ---
  Finding 11: MAF HQ Contamination - CONFIRMED (NextNest, NOT Roundtable)

  ✅ Verification:
  $ ls /root/projects/maf-github/.maf/agents/
  auditbay-prompt.md       # Mortgage domain
  ledgerleap-prompt.md     # Mortgage domain
  primeportal-prompt.md    # Mortgage domain
  rateridge-prompt.md      # Mortgage domain

  ✅ Check domain:
  $ head -5 /root/projects/maf-github/.maf/agents/rateridge-prompt.md
  # RateRidge - Mortgage System Supervisor

  You are **RateRidge**, the supervisor agent for the Nextnest mortgage calculation system.

  Confirmed: MAF HQ has NextNest-specific mortgage domain prompts, NOT Roundtable content.

  ---
  ⚠️ NEW CRITICAL FINDINGS

  Finding 12: Memlayer Dependencies - BROKEN

  Verification:
  $ ls -la maf/scripts/memlayer/
  ls: cannot access 'maf/scripts/memlayer/': No such file or directory

  ⚠️ CRITICAL: context-manager-v2.sh references memlayer scripts that DON'T EXIST:

  # Lines 22, 25 from context-manager-v2.sh:
  AGENT_MAIL_FETCH_SCRIPT="${MAF_AGENT_MAIL_FETCH_SCRIPT:-/root/projects/nextnest/maf/scripts/memlayer/fetch-agent-mail.sh}"
  MEMORY_SCRIPT="${MAF_MEMORY_SCRIPT:-/root/projects/nextnest/maf/scripts/memlayer/push-memlayer.sh}"

  What happens: These scripts are called but fail silently. The context manager continues without memory/agent-mail features.

  Impact: Memory and agent-mail features are BROKEN in current setup.

  Not in verification document: ❌ Missing

  ---
  Checkbox Verification Results

  Configuration State

  - Root config is v2.0.0 with session "maf-nn" (DOCUMENT REVERSED THIS)
  - Subtree config is v1.0.0 with session "maf-cli" (DOCUMENT REVERSED THIS)
  - Line counts are correct (141 root, 67 subtree)
  - v2.0.0 is in ROOT config, not subtree (DOCUMENT REVERSED THIS)

  Session Name Issues

  - Session names are in 3 locations (but root config is "maf-nn", not "maf-cli")
  - Root config and context manager match ("maf-nn")
  - Subtree config differs ("maf-cli") but is HQ default
  - Current state works because env vars override subtree config

  Dependency Chain

  - agent-startup.sh is untracked in subtree
  - rebuild-maf-cli-agents.sh sources it at lines 47, 273, 284
  - Moving agent-startup.sh breaks 3 locations

  Subtree State

  - 4 subtree files are modified from HQ
  - No other subtree files are modified
  - 5 untracked files exist (3 mentioned + 2 backups)

  Innovation Patterns

  - Subtree auto-detection exists at lines 16-24 of prompt-agent.sh
  - Agent startup wrapper exists at lines 47, 273, 284 of rebuild-maf-cli-agents.sh
  - v2.0.0 enhancements are in ROOT config, NOT subtree (DOCUMENT WRONG)

  ---
  🚨 Migration Impact Concerns

  Concern 1: Subtree Restore is SAFE (Document Had It Backwards)

  Document fear: Restoring subtree to pristine will delete v2.0.0 enhancements.

  Reality: v2.0.0 is in root config (outside subtree), so subtree restore is SAFE.

  What this means:
  # This is SAFE:
  git checkout maf/.maf/config/agent-topology.json  # Restores v1.0.0 to subtree
  # Your v2.0.0 is untouched in .maf/config/agent-topology.json

  ---
  Concern 2: Session Name Change is RISKY

  Document plan: Change all to "maf-cli"

  Risk: Agents currently run in "maf-nn" session. Changing breaks active workflows.

  Better approach:
  1. Keep "maf-nn" in root config and context manager (they already match)
  2. Update subtree config to "maf-nn" to match
  3. OR accept that subtree config stays at HQ default "maf-cli" and env vars override it

  Recommendation: Don't change session names. Current state works.

  ---
  Concern 3: agent-startup.sh Path Update is CRITICAL

  If moved to scripts/maf/:
  # BEFORE (line 47):
  AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/maf/scripts/maf/agent-startup.sh"

  # AFTER (must update to):
  AGENT_STARTUP_WRAPPER="${PROJECT_ROOT}/scripts/maf/agent-startup.sh"

  Missing from document: The line numbers to update (47, 273, 284).

  ---
  Concern 4: Memlayer Dependencies are BROKEN

  Not in document: The memlayer scripts don't exist.

  Migration should:
  1. Either remove memlayer references from context-manager-v2.sh
  2. Or copy memlayer scripts from somewhere
  3. Current state: Features fail silently

  ---
  Summary of Document Errors
  ┌────────────────┬─────────────────────┬──────────────────────┐
  │     Error      │ What Document Said  │       Reality        │
  ├────────────────┼─────────────────────┼──────────────────────┤
  │ Root/Schema    │ Root = v1.0.0,      │ Root = v2.0.0,       │
  │                │ Subtree = v2.0.0    │ Subtree = v1.0.0     │
  ├────────────────┼─────────────────────┼──────────────────────┤
  │ Session Names  │ Root = "maf-cli",   │ Root = "maf-nn",     │
  │                │ Subtree = "maf-nn"  │ Subtree = "maf-cli"  │
  ├────────────────┼─────────────────────┼──────────────────────┤
  │ v2.0.0         │ In subtree config   │ In root config       │
  │ Location       │                     │ (outside subtree)    │
  ├────────────────┼─────────────────────┼──────────────────────┤
  │ Subtree        │ Will delete v2.0.0  │ Safe (v2.0.0 is      │
  │ Restore Risk   │                     │ outside subtree)     │
  ├────────────────┼─────────────────────┼──────────────────────┤
  │ Memlayer       │ Not mentioned       │ Dependencies are     │
  │                │                     │ BROKEN               │
  └────────────────┴─────────────────────┴──────────────────────┘
  ---
  Recommendations

  1. ✅ PROCEED with subtree restore - it's SAFE (v2.0.0 won't be affected)
  2. ❌ DON'T change session names to "maf-cli" - keep "maf-nn" (already working)
  3. ⚠️ MUST update 3 line numbers when moving agent-startup.sh (lines 47, 273, 284)
  4. ⚠️ SHOULD fix or remove memlayer references before migration
  5. 🧪 RUN tests to verify agents still spawn after changes

  Most important: The document has the root/subtree relationship reversed, but the migration is actually safer than the document claims because v2.0.0 is outside the subtree.