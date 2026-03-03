# MAF LLM-UX Improvements Implementation Plan

**Date:** 2026-01-16
**Status:** Planning
**Priority:** P0 (Critical for franchisee success)

---

## Problem Statement

MAF is difficult for LLMs to use correctly. The NextNest experiments revealed:
- Built 625-line custom workflow when `coordinate-agents.sh` existed
- 65+ beads improperly closed (no validation)
- Hardcoded `/root/projects/roundtable` paths throughout codebase

**Root cause:** MAF lacks "pit of success" design - LLMs need explicit guidance.

---

## Implementation Plan

### Phase 1: Discovery Layer (P0)

**Goal:** Make it impossible to miss what MAF provides.

#### Task 1.1: Create `maf/README.md`
- **File:** `maf/README.md`
- **Lines:** ~80
- **Content:**
  ```markdown
  # MAF Core Framework

  ## Start Here (Before Writing Custom Code!)

  ### What MAF Provides

  | You Need | Use This | File Path |
  |----------|----------|-----------|
  | Autonomous coordination | `coordinate-agents.sh` | `maf/scripts/maf/coordinate-agents.sh` |
  | Agent communication | `agent-communication-real.sh` | `maf/scripts/maf/agent-communication-real.sh` |
  | Session rebuild | `rebuild-maf-cli-agents.sh` | `maf/scripts/maf/rebuild-maf-cli-agents.sh` |
  | Bead verification | `verify-ac.sh` | `maf/scripts/maf/verify-ac.sh` |

  ### Directory Guide

  - `maf/scripts/maf/` → MAF HQ scripts (READ-ONLY in franchisee)
  - `scripts/maf/` → Your customizations (only if MAF doesn't provide)
  - `.maf/` → Your local state (gitignored)
  - `vendor/` → External subtrees

  ### Before Building Custom

  1. Check: `ls maf/scripts/maf/*.sh`
  2. Read: `cat maf/scripts/maf/coordinate-agents.sh`
  3. Decide: Use as-is, customize, or build fresh
  4. Document: Why custom approach was necessary
  ```

#### Task 1.2: Create `maf/START_HERE.md`
- **File:** `maf/START_HERE.md`
- **Lines:** ~50
- **Content:** Explicit LLM-targeted instructions (even more obvious than README)
- **Purpose:** Can't miss it - filename is literally telling them what to do

#### Task 1.3: Create `maf/scripts/maf/README.md`
- **File:** `maf/scripts/maf/README.md`
- **Lines:** ~100
- **Content:** Catalog of all scripts with descriptions
- **Format:**
  ```markdown
  # MAF Scripts Catalog

  ## Coordination & Workflow
  - `coordinate-agents.sh` - Agent coordination, Agent Mail, review loops
  - `rebuild-maf-cli-agents.sh` - Rebuild tmux session with correct layout

  ## Communication
  - `agent-communication-real.sh` - Cross-agent communication

  ## ... (full catalog)
  ```

---

### Phase 2: Guard Rails (P0)

**Goal:** Prevent LLMs from creating bad states.

#### Task 2.1: Add plan-to-beads validation
- **File:** `scripts/maf/verify-plan-to-beads.sh` (NEW)
- **Lines:** ~40
- **Content:**
  ```bash
  verify_bead_state() {
      local closed_count=$(bd list --status closed --json | jq 'length')
      if [ "$closed_count" -gt 0 ]; then
          echo "❌ ERROR: $closed_count beads in 'closed' state after conversion!"
          echo "Beads should be created in 'open' state."
          exit 1
      fi
  }
  ```

#### Task 2.2: Add guard to custom workflow template
- **File:** `scripts/maf/templates/custom-workflow-header.sh` (NEW)
- **Lines:** ~25
- **Content:**
  ```bash
  # Guard: Check if MAF already provides this functionality
  if [[ -f "maf/scripts/maf/coordinate-agents.sh" ]]; then
      echo "⚠️  WARNING: MAF provides coordinate-agents.sh"
      echo "Have you verified it doesn't meet your needs?"
      echo ""
      read -p "Continue anyway? (y/N): " confirm
      [[ "$confirm" != "y" ]] && exit 1
  fi
  ```

#### Task 2.3: Add audit function to autonomous workflow
- **File:** `scripts/maf/audit/audit-closed-beads.sh` (EXISTS, verify)
- **Lines:** ~250 (already exists)
- **Action:** Ensure it's called from autonomous workflows at startup
- **Integration:** Add to workflow startup scripts

---

### Phase 3: "Why Custom?" Documentation (P1)

**Goal:** Force documentation when customizing.

#### Task 3.1: Create template header for custom scripts
- **File:** `scripts/maf/templates/why-custom.md` (NEW)
- **Lines:** ~30
- **Content:**
  ```markdown
  <!--
  Creating custom MAF script?

  Before proceeding, document why existing MAF scripts are insufficient:

  □ MAF script: maf/scripts/maf/XXX.sh
  □ Insufficient because: _______________________________
  □ Required feature: ____________________________________
  □ Reviewed with: _____ on _____
  □ Alternative considered: _______________________________

  Decision rationale:
  -->
  ```

#### Task 3.2: Add header to existing custom workflows
- **Files:**
  - `scripts/maf/coordinate-agents.sh` (local custom)
  - `scripts/maf/agent-coordinator.sh` (local custom)
  - Any other custom workflow scripts
- **Action:** Add "Why Custom?" header to each

---

### Phase 4: Remove Hardcoded Roundtable Paths (P0)

**Goal:** Make MAF project-agnostic.

#### Task 4.1: Fix scripts with hardcoded `/root/projects/roundtable`
- **Files identified:**
  - `scripts/maf/start-bead-agents.sh` (line 9, 46-49, 54)
  - `scripts/maf/analyze-coordination-quality.sh` (line 5)
  - `scripts/maf/init-claude-agents-v2.sh` (lines 24, 44, 55)
  - `scripts/maf/setup-worktrees.sh` (line 46)
  - `scripts/maf/test-memlayer-in-tmux.sh` (lines 14-16)
  - `scripts/maf/receipt.sh` (line 29)
  - `scripts/maf/monitor-agents.sh` (line 14)
  - `scripts/maf/tmux-agent-monitor.sh` (lines 9-10)
  - `scripts/maf/context-manager.sh` (line 14)
  - `scripts/maf/start-clean-agents.sh` (lines 14, 17-19, 24)
  - `scripts/maf/config/default-agent-config.json` (line 417)
  - `scripts/maf/memory-service-unified.py` (line 14)
  - `scripts/maf/agent-mail-fetch.sh` (line 6)
  - `scripts/maf/agent-monitor.sh` (line 28)
  - `scripts/maf/start-bead-tasks.sh` (lines 10, 54)
  - `scripts/maf/maintenance/rotate-logs.sh` (line 12)
  - `scripts/maf/maintenance/check-disk.sh` (lines 101, 111)
  - `scripts/maf/start-shell-agents.sh` (lines 15-17, 22)
  - `scripts/maf/context-manager-v2.sh` (lines 16, 19, 22, 38, 55, 72, 115-116, 124, 418)
  - `scripts/maf/agent-memory.sh` (lines 8-9, 131, 210)
  - `scripts/maf/memlayer-patch.sh` (line 8)
  - `scripts/maf/create-tmux-with-env.sh` (line 7)
  - `scripts/maf/detect-agent-beads.sh` (lines 7, 9)
  - `scripts/maf/broadcast-role-prompts.sh` (line 20)
  - `scripts/maf/start-claude-code-agents.sh` (lines 15-17, 22)
  - `scripts/maf/context-manager-v3.sh` (lines 13, 16)
  - `scripts/maf/autonomous-agents.sh` (lines 44, 234)
  - `scripts/maf/manage-context-manager.sh` (line 6)
  - `scripts/maf/quick-start-beads.sh` (lines 12-15, 20, 23)
  - `scripts/maf/integrate-agent-mail.sh` (line 8)
  - `scripts/maf/log-coordination-event.sh` (lines 7-10)
  - `scripts/maf/test-memlayer-integration.sh` (lines 9, 14, 27, 42, 57, 68, 81, 105, 114, 119)
  - `scripts/maf/governance/reject-proposal.sh` (line 70)
  - `scripts/maf/setup-context-manager-service.sh` (line 6)
  - `lib/maf/governance/proposal-manager.mjs` (line 10)
  - `scripts/maf/memlayer-config.json` (line 4)

- **Fix pattern:** Apply subtree auto-detection from `rebuild-maf-cli-agents.sh`
  ```bash
  # Auto-detect project directory (supports subtree installations)
  DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
  else
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
  fi
  ```

#### Task 4.2: Create cleanup script
- **File:** `scripts/maf/cleanup-hardcoded-paths.sh` (NEW)
- **Lines:** ~100
- **Purpose:** Automated fix for all hardcoded paths
- **Action:** Detect and replace with PROJECT_ROOT pattern

---

### Phase 5: LLM-Specific Documentation (P1)

**Goal:** Guide AI agents explicitly.

#### Task 5.1: Create `maf/LLM_README.md`
- **File:** `maf/LLM_README.md`
- **Lines:** ~60
- **Content:**
  ```markdown
  # MAF Usage Guide for AI Agents

  If you are an AI agent, follow these steps before writing any code:

  ## Step 1: Check What MAF Provides
  \`\`\`bash
  ls maf/scripts/maf/*.sh
  grep -r "YOUR_KEYWORD" maf/scripts/maf/
  \`\`\`

  ## Step 2: Read the Relevant MAF Script
  \`\`\`bash
  cat maf/scripts/maf/coordinate-agents.sh
  \`\`\`

  ## Step 3: Use or Customize
  - If MAF's script works: Use it directly
  - If you need changes: Copy to `scripts/maf/` and modify
  - Document why MAF's script was insufficient

  ## Step 4: Only Build From Scratch If...
  - MAF has no equivalent functionality
  - You've documented why existing approaches don't work
  ```

#### Task 5.2: Add LLM-friendly comments to key scripts
- **Files:** `maf/scripts/maf/coordinate-agents.sh`, `maf/scripts/maf/rebuild-maf-cli-agents.sh`
- **Action:** Add header comments explaining purpose and when to use

---

### Phase 6: agents.md Evaluation (P2)

**Question:** Should we add `agents.md` to `maf/` subtree?

**Analysis:**
- `maf/docs/AGENT_SPAWNING.md` exists
- Documents agent spawning process
- References NextNest (Roundtable) as example

**Decision:**
- ✅ Create `maf/agents.md` as franchisee guide
- Content: How to configure agents for your project
- Include: agent-topology.json schema, role mappings, examples

#### Task 6.1: Create `maf/agents.md`
- **File:** `maf/agents.md`
- **Lines:** ~120
- **Content:**
  ```markdown
  # Agent Configuration Guide

  ## Agent Topology Schema

  ## Role-Based Mappings

  ## Example Configurations

  ## Common Pitfalls
  - Don't hardcode project paths
  - Use PROJECT_ROOT auto-detection
  - Document role name → agent name mappings
  ```

---

## Execution Order

| Phase | Tasks | Estimated Time | Dependencies |
|-------|-------|----------------|--------------|
| **1. Discovery** | 1.1, 1.2, 1.3 | 30 min | None |
| **2. Guard Rails** | 2.1, 2.2, 2.3 | 45 min | Phase 1 |
| **3. Why Custom** | 3.1, 3.2 | 30 min | Phase 1 |
| **4. Cleanup Paths** | 4.1, 4.2 | 2 hours | None (parallel) |
| **5. LLM Docs** | 5.1, 5.2 | 30 min | Phase 1 |
| **6. agents.md** | 6.1 | 30 min | None |

**Total estimated time:** ~4 hours

---

## Success Criteria

- [ ] Franchisee can run `cat maf/README.md` and understand where to start
- [ ] Custom workflow scripts include "Why Custom?" documentation
- [ ] No hardcoded `/root/projects/roundtable` paths remain
- [ ] Plan-to-beads validation prevents false closures
- [ ] LLMs have explicit guidance in `maf/LLM_README.md`

---

## Testing Plan

1. **Discovery test:** New LLM session → reads `maf/README.md` → finds coordinate-agents.sh
2. **Guard test:** Runs plan-to-beads with closed beads → validation catches it
3. **Cleanup test:** Run scripts in different project paths → all work
4. **LLM test:** AI agent reads `maf/LLM_README.md` → follows correct path

---

## Notes

- This is a **UX design issue**, not a user error issue
- MAF should make the right path obvious, not require exploration
- LLMs need **explicit guidance** or they'll confidently do wrong things
- The NextNest experiments are valuable because they show where MAF fails to guide users
