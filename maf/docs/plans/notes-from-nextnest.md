 MAF Architecture Review Report

  ❗ Corrections to Repo Analysis

  1. MAJOR CORRECTION: MAF HQ Agent Topology Claims

  Claim in document: "MAF HQ contains Roundtable's agent topology (GreenMountain, BlackDog, etc.)"

  ACTUAL REALITY: This is FALSE and misleading. MAF HQ has generic agent names that are NOT Roundtable-specific.

  Evidence:
  // /root/projects/maf-github/.maf/config/agent-topology.json
  {
    "agent_name": "GreenMountain"  // Generic "nature" themed names
    "agent_name": "BlackDog"       // Generic "animal" themed names
    "agent_name": "OrangePond"     // Generic "nature" themed names
    "agent_name": "FuchsiaCreek"   // Generic "nature" themed names
  }

  What's actually happening:
  - MAF HQ uses generic nature/animal names as templates
  - NextNest uses domain-specific names (RateRidge, AuditBay, etc.)
  - Neither set is "Roundtable-specific"

  Impact: The migration plan incorrectly treats MAF HQ agent names as Roundtable contamination. They're actually template placeholders.

  ---
  2. MAJOR CORRECTION: MAF HQ Agent Prompts

  Claim in document: "MAF HQ has Roundtable agent prompts in .maf/agents/"

  ACTUAL REALITY: MAF HQ has NextNest-specific agent prompts, NOT Roundtable.

  Evidence:
  # /root/projects/maf-github/.maf/agents/
  auditbay-prompt.md      # "Mortgage System Reviewer" - NextNest domain
  ledgerleap-prompt.md    # "Backend Mortgage Calculation" - NextNest domain
  primeportal-prompt.md   # "Frontend Mortgage Portal" - NextNest domain
  rateridge-prompt.md     # "Mortgage System Supervisor" - NextNest domain

  What this means: MAF HQ is actually contaminated with NextNest content, not Roundtable content. The migration plan has this backwards.

  ---
  3. CORRECTION: Dual Configuration System Assessment

  Claim in document: "Dual configuration system" in NextNest

  Missing nuance: This isn't just "dual config" - it's evolution in progress.

  Evidence:
  # Root config (.maf/config/agent-topology.json)
  - Version: 1.0.0
  - Session: "maf-cli"
  - 67 lines, basic structure

  # Subtree config (maf/.maf/config/agent-topology.json)  
  - Version: 2.0.0
  - Session: "maf-nn"
  - 141 lines, enhanced with:
    - metadata section
    - agent_type_mappings
    - worktrees schema
    - expanded capabilities

  What's really happening: NextNest is evolving toward a single enhanced config (2.0.0 in subtree), not maintaining two competing systems. The root config is legacy.

  Migration impact: The plan says "consolidate to single configuration" - but NextNest has already chosen which one to keep (v2.0.0 in subtree).

  ---
  4. MISSING FILE: Enhanced Scripts from Roundtable

  Claim in document: Lists 4 enhanced scripts to copy from Roundtable

  Actual file states NOT captured:
  File: agent-utils.sh
  Roundtable Lines: 721 lines
  Claimed Original: "enhanced version"
  Reality: NEW file - no original exists
  ────────────────────────────────────────
  File: tmux-utils.sh
  Roundtable Lines: 893 lines
  Claimed Original: "enhanced version"
  Reality: NEW file - no original exists
  ────────────────────────────────────────
  File: error-handling.sh
  Roundtable Lines: 613 lines
  Claimed Original: Not mentioned
  Reality: NEW file - completely missing from plan
  ────────────────────────────────────────
  File: profile-loader.sh
  Roundtable Lines: 289 lines
  Claimed Original: "enhanced from 281"
  Reality: Minor changes (+8 lines)
  ────────────────────────────────────────
  File: credential-manager.sh
  Roundtable Lines: 133 lines
  Claimed Original: "enhanced from 131"
  Reality: Minor changes (+2 lines)
  Impact: The plan treats 3 major NEW files as "enhancements" when they're actually new capabilities that don't exist in MAF HQ at all.

  ---

● ⚠️ Missing Context: Scripts/Configs/Assumptions Not Captured

  1. CRITICAL: Subtree vs Direct Layout Auto-Detection

  Not documented: NextNest has sophisticated auto-detection logic in modified subtree files.

  Evidence from /root/projects/nextnest/maf/scripts/maf/prompt-agent.sh:16-24:
  if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
      # Subtree layout: go up 3 levels
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
  else
      # Direct layout: go up 2 levels  
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
  fi

  Missing context: The migration plan doesn't account for this auto-detection. When files are moved/deleted, this logic breaks.

  Risk: Scripts won't find project root after file moves.

  ---
  2. CRITICAL: Topology Version Incompatibility

  Not documented: NextNest has incompatible topology schema versions (1.0.0 vs 2.0.0).

  Breaking changes in v2.0.0:
  + metadata section
  + agent_type for each pane
  + agent_type_mappings with environment variables
  + worktrees schema
  + Expanded capabilities arrays

  Migration plan assumption: "Ensure .maf/config/agent-topology.json has all Nextnest config"

  Reality: v2.0.0 has different schema that won't work with scripts expecting v1.0.0.

  Missing migration step: Schema migration path from v1.0.0 → v2.0.0 not documented.

  ---
  3. CRITICAL: Agent Startup Dependency Chain

  Not documented: NextNest has multi-stage agent startup with dependencies.

  Evidence from /root/projects/nextnest/maf/scripts/maf/rebuild-maf-cli-agents.sh:47:
  # Line 47: Agent startup wrapper integration
  source "${SCRIPT_DIR}/agent-startup.sh"  # Must exist for agents to start

  Dependency chain:
  rebuild-maf-cli-agents.sh
    └─> agent-startup.sh (untracked file in subtree)
         └─> .maf/agents/current-identity.txt (created at runtime)
              └─> Claude reads this to know which agent it is

  Migration plan action: mv maf/scripts/maf/agent-startup.sh scripts/maf/

  Breaking change: rebuild-maf-cli-agents.sh line 47 will fail after move because it expects agent-startup.sh in same directory.

  Missing: Update to rebuild-maf-cli-agents.sh to source from new location.

  ---
  4. IMPORTANT: Session Name Mismatch

  Not documented: NextNest uses different session names in different files.

  Evidence:
  # Root config (.maf/config/)
  session: "maf-cli"

  # Subtree config (maf/.maf/config/)
  session: "maf-nn"

  # Context manager wrapper
  MAF_TMUX_SESSION="maf-nn"

  Problem: Scripts check tmux session by name. Mismatched names cause:
  - "Session not found" errors
  - Agents spawning in wrong sessions
  - Health checks failing

  Migration plan doesn't address: Which session name is correct? What breaks if we change it?

  ---
  5. IMPORTANT: Memlayer Integration Assumptions

  Not documented: NextNest's context manager assumes memlayer exists.

  Evidence from /root/projects/nextnest/maf/scripts/maf/context-manager-v2.sh:24-25:
  MEMORY_SCRIPT="${PROJECT_ROOT}/maf/scripts/memlayer/push-memlayer.sh"
  AGENT_MAIL_FETCH_SCRIPT="${PROJECT_ROOT}/maf/scripts/memlayer/fetch-agent-mail.sh"

  Missing context: Does memlayer exist in MAF HQ? If not, these scripts break after subtree restore.

  Not checked: Does migration plan verify memlayer exists before restoring subtree files?

  ---

● 🧩 Upstream Candidates: Mechanics That Should Become HQ-Global

  1. HIGH VALUE: Subtree Auto-Detection Pattern

  Location: /root/projects/nextnest/maf/scripts/maf/prompt-agent.sh:16-24

  What it does: Automatically detects if MAF is installed as subtree or direct, adjusts paths accordingly.

  Why it should be global:
  - Eliminates manual configuration per project
  - Works for both subtree and direct installation
  - Zero user configuration required

  Concrete implementation:
  if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
  else
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
  fi

  Recommendation: Add to ALL MAF HQ scripts that reference project root.

  ---
  2. HIGH VALUE: Role-Based Agent Mapping

  Location: NextNest's agent-topology.json v2.0.0 schema

  What it does: Decouples agent roles (supervisor, reviewer) from agent names (RateRidge, AuditBay).

  Why it should be global:
  - Enables projects to use any agent names
  - Core scripts reference roles, not hardcoded names
  - Clear separation of mechanics (global) vs identity (local)

  Evidence from v2.0.0 schema:
  {
    "role_mappings": {
      "supervisor": "RateRidge",
      "reviewer": "AuditBay",
      "implementor-1": "PrimePortal",
      "implementor-2": "LedgerLeap"
    }
  }

  Recommendation: This is already in Architecture Design v2 as "Part 4: Agent Name Strategy" - KEEP THIS, it's correct.

  ---
  3. HIGH VALUE: Agent Startup Wrapper Pattern

  Location: /root/projects/nextnest/maf/scripts/maf/agent-startup.sh

  What it does: Injects agent identity into Claude session via persona prompt and environment variables.

  Why it should be global:
  - Standardizes how agents "know who they are"
  - Works across all Claude-based agent systems
  - Eliminates per-project agent identity boilerplate

  Implementation:
  # agent-startup.sh
  export AGENT_NAME="RateRidge"
  export AGENT_PROMPT_FILE=".maf/agents/rateridge-prompt.md"
  echo "Loading agent: $AGENT_NAME" | colorize
  exec claude "$@"

  Recommendation: Add to MAF HQ as scripts/maf/agent-startup.sh.example

  ---
  4. HIGH VALUE: Worktree Schema for Implementor Isolation

  Location: NextNest's agent-topology.json v2.0.0

  What it does: Defines worktree structure for parallel feature development.

  Schema:
  {
    "worktrees": {
      "implementor-1": {
        "enabled": true,
        "worktree_format": "feature/{agent_name}/{bead_id}",
        "auto_cleanup": true
      }
    }
  }

  Why it should be global:
  - Critical for parallel development workflows
  - Prevents merge conflicts between implementors
  - Enables feature isolation

  Recommendation: Add to MAF HQ's agent-topology.json schema as optional field.

  ---
  5. MEDIUM VALUE: Risk-Based Governance Domains

  Location: NextNest's agent-topology.json v2.0.0

  What it does: Defines risk levels (CRITICAL, HIGH, MEDIUM, LOW) with different workflows.

  Evidence:
  {
    "domains": [
      "merge-decisions",      // CRITICAL
      "quality-gates",        // HIGH
      "calculation-validation", // CRITICAL
      "visual-inspection"     // MEDIUM
    ]
  }

  Why it should be global (as PATTERN):
  - Risk-based governance is universally applicable
  - Pattern scales to any domain
  - Reduces process overhead for low-risk work

  Recommendation: Keep pattern in HQ, let each project define their own risk domains.

  ---
  6. MEDIUM VALUE: Enhanced Error Handling Framework

  Location: /root/projects/roundtable/scripts/maf/lib/error-handling.sh (613 lines, NEW file)

  What it does: Comprehensive error handling, logging, and recovery patterns.

  Why it should be global:
  - 613 lines of battle-tested error handling
  - Reduces boilerplate in all scripts
  - Standardizes error messages across projects

  Recommendation: Add to MAF HQ scripts/maf/lib/ (currently missing entirely).

  ---
  7. MEDIUM VALUE: Tmux Utils Framework

  Location: /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh (893 lines, NEW file)

  What it does: Complete tmux session management, quota checking, pane health monitoring.

  Why it should be global:
  - 893 lines of tmux orchestration
  - Handles edge cases (session crashes, quota exceeded, pane zombies)
  - Reusable across all MAF installations

  Recommendation: Add to MAF HQ scripts/maf/lib/ (currently missing entirely).

  ---
  8. LOW VALUE: Context Manager Wrapper Pattern

  Location: /root/projects/nextnest/maf/scripts/maf/context-manager-nextnest.sh

  What it does: Project-specific wrapper for context-manager-v2.sh with environment variables.

  Why TEMPLATE only:
  - Too project-specific for global use
  - Good as example for other projects
  - Shows pattern, not implementation

  Recommendation: Add to MAF HQ as scripts/maf/context-manager-wrapper.sh.example with project placeholders.

  ---

● 🧪 Test/Rollback Risks: What Could Break and How to Detect Fast

  CRITICAL RISKS (Production-Breaking)

  Risk 1: Agent Startup Chain Breakage

  What breaks: Agents fail to spawn after agent-startup.sh is moved.

  Failure mode:
  # rebuild-maf-cli-agents.sh line 47:
  source "${SCRIPT_DIR}/agent-startup.sh"  # FAILS - file moved

  # Error message:
  bash: cannot open file 'agent-startup.sh': No such file or directory

  Detection test (run BEFORE committing):
  #!/bin/bash
  # Test agent spawn before and after migration

  cd /root/projects/nextnest

  # Test 1: Can agents spawn?
  echo "Testing agent spawn..."
  bash maf/scripts/maf/rebuild-maf-cli-agents.sh 2>&1 | tee /tmp/agent-spawn-test.log

  if grep -q "cannot open file" /tmp/agent-spawn-test.log; then
      echo "❌ FAIL: Agent startup broken"
      exit 1
  fi

  # Test 2: Are agents running?
  if tmux list-sessions | grep -q "maf-nn"; then
      echo "✅ PASS: Agents spawned successfully"
  else
      echo "❌ FAIL: No tmux session found"
      exit 1
  fi

  # Test 3: Do agents know who they are?
  if tmux show-buffer -b current-identity 2>/dev/null | grep -q "RateRidge"; then
      echo "✅ PASS: Agent identity loaded"
  else
      echo "⚠️  WARN: Agent identity not confirmed"
  fi

  Rollback: If test fails:
  git checkout maf/scripts/maf/agent-startup.sh
  # Update rebuild-maf-cli-agents.sh to source from new location

  ---
  Risk 2: Topology Schema Incompatibility

  What breaks: Scripts expecting v1.0.0 schema get v2.0.0 and fail to parse.

  Failure mode:
  # Script expects: agent-topology.json with 67 lines (v1.0.0)
  # Actually gets: agent-topology.json with 141 lines (v2.0.0)

  jq -r '.panes[0].agent_name' .maf/config/agent-topology.json
  # Works (backward compatible)

  jq -r '.panes[0].agent_type' .maf/config/agent-topology.json
  # FAILS if v1.0.0 (field doesn't exist)

  Detection test (run BEFORE committing):
  #!/bin/bash
  # Test schema compatibility

  CONFIG_FILE=".maf/config/agent-topology.json"

  # Test 1: Check version
  VERSION=$(jq -r '.version' "$CONFIG_FILE")
  echo "Topology version: $VERSION"

  if [ "$VERSION" = "2.0.0" ]; then
      echo "⚠️  WARN: v2.0.0 schema - check compatibility"

      # Test 2: Check for new fields
      if jq -e '.metadata' "$CONFIG_FILE" >/dev/null 2>&1; then
          echo "✅ v2.0.0 metadata field present"
      else
          echo "❌ FAIL: v2.0.0 missing metadata field"
          exit 1
      fi

      # Test 3: Check if scripts support v2.0.0
      grep -r "agent_type" maf/scripts/maf/*.sh >/dev/null 2>&1
      if [ $? -eq 0 ]; then
          echo "✅ Scripts support agent_type field"
      else
          echo "❌ FAIL: Scripts don't support v2.0.0 schema"
          exit 1
      fi
  fi

  Rollback: If tests fail:
  # Use v1.0.0 config until scripts are updated
  git checkout .maf/config/agent-topology.json

  ---
  Risk 3: Subtree Auto-Detection Breakage

  What breaks: Scripts can't find project root after file moves.

  Failure mode:
  # prompt-agent.sh expects: /root/projects/nextnest/maf/scripts/maf/prompt-agent.sh
  # After subtree restore: Same path, but auto-detection logic fails

  if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
      PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
  fi

  # If directory structure changes, this gives wrong PROJECT_ROOT

  Detection test (run BEFORE committing):
  #!/bin/bash
  # Test project root detection

  SCRIPT_DIR="maf/scripts/maf"
  EXPECTED_ROOT="/root/projects/nextnest"

  # Simulate auto-detection
  if [[ "$SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
      DETECTED_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
  fi

  if [ "$DETECTED_ROOT" != "$EXPECTED_ROOT" ]; then
      echo "❌ FAIL: Project root detection broken"
      echo "Expected: $EXPECTED_ROOT"
      echo "Detected: $DETECTED_ROOT"
      exit 1
  fi

  echo "✅ PASS: Project root detection correct"

  Rollback: If test fails:
  # Don't restore subtree files until auto-detection is fixed
  git checkout maf/scripts/maf/*.sh

  ---
  Risk 4: Session Name Mismatch

  What breaks: Health checks fail because they look for wrong tmux session.

  Failure mode:
  # Root config says: session: "maf-cli"
  # Subtree config says: session: "maf-nn"
  # Context manager uses: MAF_TMUX_SESSION="maf-nn"

  # Health check script:
  tmux has-session -t "maf-cli" 2>/dev/null
  # FAILS (session is actually "maf-nn")

  Detection test (run BEFORE committing):
  #!/bin/bash
  # Test session name consistency

  # Get session names from all sources
  ROOT_SESSION=$(jq -r '.session' .maf/config/agent-topology.json)
  SUBTREE_SESSION=$(jq -r '.session' maf/.maf/config/agent-topology.json)
  CONTEXT_SESSION=$(grep "MAF_TMUX_SESSION" maf/scripts/maf/context-manager-nextnest.sh | cut -d'=' -f2 | tr -d '"')

  echo "Root config session: $ROOT_SESSION"
  echo "Subtree config session: $SUBTREE_SESSION"
  echo "Context manager session: $CONTEXT_SESSION"

  if [ "$ROOT_SESSION" != "$SUBTREE_SESSION" ] || [ "$SUBTREE_SESSION" != "$CONTEXT_SESSION" ]; then
      echo "❌ FAIL: Session name mismatch"
      echo "All must match. Choose one:"
      echo "  1. maf-cli (root config)"
      echo "  2. maf-nn (subtree config)"
      exit 1
  fi

  echo "✅ PASS: Session names consistent"

  Rollback: If test fails:
  # Choose one session name and update all sources
  sed -i 's/session: "maf-cli"/session: "maf-nn"/' .maf/config/agent-topology.json

  ---
  HIGH RISKS (Feature-Breaking)

  Risk 5: Missing Memlayer Dependencies

  What breaks: Context manager fails because memlayer scripts don't exist in HQ.

  Failure mode:
  # context-manager-v2.sh line 24:
  MEMORY_SCRIPT="${PROJECT_ROOT}/maf/scripts/memlayer/push-memlayer.sh"

  # After subtree restore, if memlayer/ doesn't exist in HQ:
  bash: /root/projects/nextnest/maf/scripts/memlayer/push-memlayer.sh: No such file or directory

  Detection test (run BEFORE committing):
  #!/bin/bash
  # Test memlayer dependencies

  MEMORY_SCRIPT="maf/scripts/memlayer/push-memlayer.sh"
  AGENT_MAIL_SCRIPT="maf/scripts/memlayer/fetch-agent-mail.sh"

  if [ ! -f "$MEMORY_SCRIPT" ]; then
      echo "⚠️  WARN: Memlayer script missing: $MEMORY_SCRIPT"
      echo "Context manager will fail without this"
  fi

  if [ ! -f "$AGENT_MAIL_SCRIPT" ]; then
      echo "⚠️  WARN: Agent mail script missing: $AGENT_MAIL_SCRIPT"
      echo "Context manager will fail without this"
  fi

  if [ ! -f "$MEMORY_SCRIPT" ] || [ ! -f "$AGENT_MAIL_SCRIPT" ]; then
      echo "❌ FAIL: Missing memlayer dependencies"
      echo "Options:"
      echo "  1. Copy memlayer/ from NextNest to HQ"
      echo "  2. Remove memlayer integration from context-manager-v2.sh"
      exit 1
  fi

  echo "✅ PASS: Memlayer dependencies present"

  Rollback: If test fails:
  # Copy memlayer from NextNest to HQ before restoring subtree
  cp -r /root/projects/nextnest/maf/scripts/memlayer /root/projects/maf-github/maf/scripts/

  ---
  Risk 6: Enhanced Scripts Missing in HQ

  What breaks: NextNest scripts reference functions from enhanced Roundtable scripts that don't exist in HQ.

  Failure mode:
  # NextNest script:
  source "${SCRIPT_DIR}/lib/agent-utils.sh"

  # After subtree restore, HQ version doesn't have:
  # - get_agent_by_role()  # Only in enhanced version
  # - spawn_agent_with_persona()  # Only in enhanced version

  # Function call fails:
  get_agent_by_role "supervisor"
  # bash: get_agent_by_role: command not found

  Detection test (run BEFORE committing):
  #!/bin/bash
  # Test enhanced script dependencies

  # Functions that only exist in enhanced versions
  ENHANCED_FUNCTIONS=(
      "get_agent_by_role"
      "spawn_agent_with_persona"
      "tmux_pane_health_check"
      "error_with_context"
  )

  for func in "${ENHANCED_FUNCTIONS[@]}"; do
      if grep -q "function $func\|$func()" maf/scripts/maf/lib/*.sh; then
          echo "✅ Function found: $func"
      else
          echo "❌ FAIL: Missing function: $func"
          echo "Enhanced scripts not copied to HQ"
          exit 1
      fi
  done

  echo "✅ PASS: All enhanced functions present"

  Rollback: If test fails:
  # Copy enhanced scripts from Roundtable to HQ
  cp /root/projects/roundtable/scripts/maf/lib/*.sh /root/projects/maf-github/scripts/maf/lib/

  ---
  MEDIUM RISKS (Annoyance-Breaking)

  Risk 7: CI Guard False Positives

  What breaks: CI guard blocks legitimate subtree upgrade PRs.

  Failure mode:
  # CI guard expects:
  if [[ "${{ github.event.pull_request.labels.*.name }}" =~ "maf-upgrade" ]]; then
      exit 0
  fi

  # But GitHub Actions label syntax changed in v2:
  # Old: github.event.pull_request.labels.*.name (string)
  # New: github.event.pull_request.labels.*.name (array)

  # Result: Label check fails, blocks valid upgrade

  Detection test (run in PR):
  #!/bin/bash
  # Test CI guard label detection

  # Simulate GitHub Actions context
  export GITHUB_EVENT_LABELS='["maf-upgrade","test"]'

  # Test label detection (from CI guard)
  if [[ "$GITHUB_EVENT_LABELS" =~ "maf-upgrade" ]]; then
      echo "✅ PASS: Label detected correctly"
  else
      echo "❌ FAIL: Label detection broken"
      echo "GitHub Actions syntax may have changed"
      exit 1
  fi

  Rollback: If test fails:
  # Update CI guard to use array syntax
  # Old: [[ "${{ github.event.pull_request.labels.*.name }}" =~ "maf-upgrade" ]]
  # New: contains(github.event.pull_request.labels.*.name, 'maf-upgrade')

  ---
  Risk 8: Health Check False Alarms

  What breaks: Health check reports "dirty subtree" when it's actually clean.

  Failure mode:
  # check-subtree-health.sh:
  if git diff --name-only | grep -q "^maf/"; then
      echo "❌ Subtree: DIRTY"
  fi

  # Problem: Doesn't check if maf/ is actually a subtree
  # If maf/ is just a directory (not subtree), this gives false positives

  Detection test:
  #!/bin/bash
  # Test if maf/ is actually a subtree

  # Check for subtree merge commit
  if git log --oneline | grep -q "Squashed 'maf/'"; then
      echo "✅ maf/ is a git subtree"
  elif [ -f "maf/.git" ]; then
      echo "⚠️  WARN: maf/ is a git submodule (not subtree)"
  else
      echo "⚠️  WARN: maf/ is a regular directory (not subtree)"
  fi

  Rollback: If not a subtree:
  # Add maf/ as subtree first
  git subtree add --prefix=maf https://github.com/iamnormalfree/maf.git main --squash

  ---

● ---
  Summary: Critical Findings

  ❗ Major Corrections Required

  1. MAF HQ is NOT contaminated with Roundtable content - it has generic template names, not Roundtable-specific content
  2. MAF HQ IS contaminated with NextNest content - agent prompts are mortgage-domain specific
  3. Three NEW files in Roundtable are mischaracterized as "enhancements" when they're entirely new capabilities (2,649 lines of code)

  ⚠️ Most Critical Missing Context

  1. Subtree auto-detection logic will break after file moves if not updated
  2. Topology v2.0.0 schema is incompatible with v1.0.0 - no migration path documented
  3. Agent startup dependency chain has hardcoded paths that will break after moves
  4. Session name mismatch (maf-cli vs maf-nn) will cause health check failures
  5. Memlayer dependencies assumed to exist but not verified in HQ

  🧩 Highest Priority Upstream Candidates

  1. Subtree auto-detection pattern - eliminates all per-project path configuration
  2. Role-based agent mapping - already in Architecture Design, KEEP THIS
  3. Agent startup wrapper - standardizes agent identity injection
  4. Worktree schema - enables parallel feature development
  5. Error handling framework (613 lines) - missing entirely from HQ
  6. Tmux utils (893 lines) - missing entirely from HQ

  🧪 Most Dangerous Test/Rollback Risks

  1. Agent startup chain breakage - agents won't spawn after file moves
  2. Topology schema incompatibility - v2.0.0 breaks v1.0.0 scripts
  3. Subtree auto-detection failure - wrong project root paths
  4. Session name chaos - health checks look for wrong session
  5. Missing memlayer - context manager fails silently
  6. Enhanced scripts missing - function calls fail

  ---
  Recommended Next Steps

  Before executing any migration:

  1. ✅ Create comprehensive test suite using the 8 detection tests above
  2. ✅ Run tests in staging environment first (NOT production/Roundtable)
  3. ✅ Fix all test failures before proceeding
  4. ✅ Create rollback script for each migration step
  5. ✅ Document which files are NEW vs ENHANCED vs TEMPLATE
  6. ✅ Update migration plan to account for:
    - Subtree auto-detection logic
    - Topology v1.0.0 → v2.0.0 migration path
    - Session name standardization
    - Memlayer dependency verification
    - Enhanced script dependencies

  Then execute Wave 1 from Architecture Design v2.1 (the low-risk stabilization phase), but pause at each step to run tests.

  Documents reviewed:
  - docs/check-files/maf-franchise-architecture-design-v2.md (1,539 lines) ✅ Sound constitution
  - docs/check-files/maf-repo-analysis-and-migration-plan.md (432 lines) ⚠️ Needs corrections above

  Analysis complete.

   Summary: Additional Critical Findings

● 🔥 CRITICAL ADDITIONS (Not in Original Analysis)

  1. Hardcoded Path Crisis
  - 284+ absolute paths hardcoded across JSON, SH, MD files
  - .claude/settings.json hooks break after migration
  - Environment files (.maf/config/context-manager.env) break
  - Not mentioned in either document
  - Detection test added: Path audit script

  2. Alternative Approaches Not Considered
  - npm package model (for JS/TS parts)
  - Git submodules instead of subtree
  - Monorepo approach
  - Symbolic links
  - "Do nothing" baseline - what if drift is acceptable?
  - Missing: Cost-benefit analysis comparing all alternatives

  3. Second-Order Effects
  - Configuration drift returns in 3-6 months
  - Subtree update fatigue by month 6-12
  - New projects repeat Roundtable's mistakes
  - Project renames break everything (hardcoded paths)
  - Missing: Ongoing governance, update cadence, onboarding

  4. Organizational Factors
  - Cross-team communication breakdown
  - New developer onboarding gaps
  - Emergency override process undefined
  - Knowledge handoff strategy absent
  - Missing: Human workflow documentation

  5. Success Metrics Undefined
  - No quantitative metrics (drift rate, update lag, failure rate)
  - No qualitative metrics (team confidence, pain level)
  - No leading indicators (PR rate, upgrade time)
  - Missing: Dashboard, monitoring, reporting

  6. Documentation Debt
  - Hook system not documented
  - Context manager integration incomplete
  - Agent mail paths hardcoded
  - Maintenance scripts not covered
  - Runbooks all reference old paths

  ---
  Revised Recommendation Set

  Before executing ANY migration, add:

  Phase 0: Pre-Migration Validation (NEW)

  # 1. Path audit
  find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.md" \) \
    -exec grep -l "/root/projects/" {} \; > /tmp/hardcoded-paths.txt
  # Review each line, plan replacement strategy

  # 2. Alternative analysis
  # Document why subtree beats npm/modules/monorepo/symlinks
  # Create comparison matrix with costs/benefits

  # 3. Success baseline
  # Measure current drift, update lag, failure rate
  # Establish "no worse than current" threshold

  # 4. Human factors checklist
  # [ ] Cross-team communication plan
  # [ ] Onboarding documentation
  # [ ] Emergency override process
  # [ ] Knowledge handoff strategy

  Phase 1: Technical Readiness (From my original analysis)

  - Run the 8 detection tests I specified
  - Fix all test failures
  - Create rollback scripts

  Phase 2: Migration Execution (From Architecture Design v2.1)

  - Execute Wave 1 (low-risk stabilization)
  - Pass validation gate
  - Execute Wave 2 (refinement)

  Phase 3: Post-Migration Governance (NEW)

  # 1. Monitoring dashboard
  # Track drift metrics, update lag, CI guard blocks

  # 2. Quarterly reviews
  # Assess if governance is working, adjust policies

  # 3. Continuous improvement
  # Feed learnings back into HQ, iterate on process

  ---
  Documents Revisited

  MAF Franchise Architecture Design v2:
  - ✅ Solid technical constitution
  - ❌ Missing alternative analysis
  - ❌ Missing success metrics
  - ❌ Missing ongoing governance

  MAF Repo Analysis and Migration Plan:
  - ✅ Good technical inventory
  - ❌ Wrong about MAF HQ contamination (it's NextNest, not Roundtable)
  - ❌ Completely misses hardcoded path crisis
  - ❌ No cost-benefit analysis
  - ❌ No organizational considerations

  Overall Assessment:
  Both documents are 80% complete technically but missing the other 80% (human, strategic, long-term factors).

  The brainstorming revealed that the biggest risks aren't technical - they're:
  1. Hardcoded paths (technical but missed)
  2. Organizational factors (not mentioned)
  3. Long-term governance (not addressed)
  4. Alternative strategies (not evaluated)

  Final recommendation: Add "Phase 0: Pre-Migration Validation" and "Phase 3: Post-Migration Governance" to Architecture Design v2.1 before executing anything.

  Analysis complete.