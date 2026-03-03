MAF Franchise Architecture Review

  ❗ CRITICAL CORRECTIONS

  1. MAJOR ERROR: MAF HQ Has Mixed Content (Both Projects)

  The migration plan document states:
  MAF HQ "Contains Roundtable's agent topology (GreenMountain, BlackDog, etc.)"

  Actual Reality:
  /root/projects/maf-github/.maf/config/agent-topology.json
  → Has Roundtable agents (GreenMountain, BlackDog, OrangePond, FuchsiaCreek)

  /root/projects/maf-github/.maf/agents/
  → Has Nextnest agents (RateRidge, AuditBay, PrimePortal, LedgerLeap)

  This is a complete contradiction. HQ is contaminated with BOTH projects' agents:
  - Config layer → Roundtable
  - Prompts layer → Nextnest
  - Prompt packs → Roundtable

  Impact: The cleanup plan only addresses Roundtable content. It will leave Nextnest content behind.

  ---
  2. Missing HQ Scripts in Document

  Document claims:
  "Missing 2 HQ scripts" in Roundtable

  Files not accounted for:
  - context-manager-v3.sh - Exists in HQ but not mentioned
  - autonomous-decision-delegate.sh - In Roundtable but not in migration plan
  - context-manager-nextnest.sh.old - Untracked backup file (should be deleted)

  ---
  3. Agent Identity Injection Pattern Not Fully Documented

  Nextnest's critical innovation: The AGENT_STARTUP_WRAPPER in rebuild-maf-cli-agents.sh:

  # Line 272-274 in Nextnest's subtree
  local wrapped_cmd="bash $AGENT_STARTUP_WRAPPER '$agent_name' '$agent_prompt_file' $agent_cmd"
  tmux send-keys -t "$pane" -l "$wrapped_cmd"

  This wraps EVERY agent command with identity injection. The document mentions agent-startup.sh but doesn't explain:
  - It's called via wrapper, not directly
  - It requires agent-name and agent-prompt-file arguments
  - It's a mandatory dependency for agent spawning in Nextnest

  Migration risk: Restoring rebuild-maf-cli-agents.sh will break Nextnest agent spawning.

  ---
  ⚠️ MISSING CONTEXT

  1. Hardcoded Paths Are Widespread

  Beyond the documented context-manager-v2.sh, hardcoded paths exist in:
  File: rebuild-maf-cli-agents.sh
  Path: SESSION_NAME="maf-nn"
  Impact: Session targeting
  ────────────────────────────────────────
  File: context-manager-v2.sh
  Path: AGENT_MAIL_PROJECT
  Impact: Agent Mail routing
  ────────────────────────────────────────
  File: prompt-agent.sh
  Path: Fallback mappings
  Impact: Agent alias resolution
  The document only fixes context-manager-v2.sh. The others remain broken after migration.

  ---
  2. Session Name Drift

  HQ default: maf-cli
  Nextnest default: maf-nn
  Roundtable: Uses maf-cli (no drift)

  Not in migration plan: How should consumers customize session names?

  ---
  3. Backup Files Accumulating

  Untracked files in Nextnest subtree:
  maf/scripts/maf/context-manager-nextnest.sh.old
  maf/scripts/maf/context-manager-v2-backup.sh

  These are manual backups that should be cleaned up, not migrated.

  ---
  🧩 UPSTREAM CANDIDATES

  1. Roundtable's Stderr Logging Fix

  File: scripts/maf/lib/agent-utils.sh (and tmux-utils.sh)

  Change:
  # Before: stdout
  log_agent_info() { echo -e "${BLUE}[AGENT]${NC} $1"; }

  # After: stderr  
  log_agent_info() { echo -e "${BLUE}[AGENT]${NC} $1" >&2; }

  Why: Prevents log output from interfering with command substitution.

  Verdict: ✅ Definitely upstream

  ---
  2. Nextnest's Agent Startup Wrapper Pattern

  Files:
  - maf/scripts/maf/agent-startup.sh
  - Modified rebuild-maf-cli-agents.sh

  What it does: Injects agent identity into every spawned agent via wrapper script.

  Why valuable: Ensures agents always know their name/prompt, enables better logging/tracking.

  Verdict: ✅ Upstream as OPTIONAL pattern (document in HQ, don't force)

  ---
  3. Agent Type Mappings

  Document mentions this as "Nextnest-only innovation" to make generic.

  Current state: Already partially in HQ schema but not implemented.

  Verdict: ✅ Valid upstream candidate (as documented)

  ---
  4. Role-Based Agent Name Resolution

  Already in design doc but missing from implementation:

  Proposed function:
  get_agent_by_role() {
    local role="$1"
    jq -r ".role_mappings[\"$role\"]" .maf/config/agent-topology.json
  }

  Current reality: Scripts still use hardcoded fallbacks in prompt-agent.sh.

  Verdict: ✅ Already designed, just needs implementation in Wave 2

  ---
  🧪 TEST/ROLLBACK RISKS

  Critical Breakage Paths
  Migration Step: Restore prompt-agent.sh
  What Breaks: Nextnest agent aliases (rr, ab, ll, pp) stop
    working
  Detection: Agent prompts fail
  Rollback: Keep Nextnest's modified version as local override
  ────────────────────────────────────────
  Migration Step: Restore rebuild-maf-cli-agents.sh
  What Breaks: Agent identity injection stops, agents spawn
    without names
  Detection: Agent logging shows missing identity
  Rollback: Keep Nextnest's wrapper logic
  ────────────────────────────────────────
  Migration Step: Restore context-manager-v2.sh
  What Breaks: Points to wrong Agent Mail project
  Detection: Context manager fails to fetch messages
  Rollback: Keep Nextnest's modified version
  ────────────────────────────────────────
  Migration Step: Remove Nextnest agents from HQ
  What Breaks: Nextnest loses agent prompts
  Detection: Agent spawn fails
  Rollback: Document as templates, don't delete yet
  ────────────────────────────────────────
  Migration Step: Restore agent-topology.json
  What Breaks: Nextnest loses role mappings, agent types
  Detection: Agent spawn script fails
  Rollback: Must migrate to new schema first
  ---
  Undocumented Dependencies

  Nextnest's agent spawning chain:
  rebuild-maf-cli-agents.sh
    → reads agent-topology.json (needs role_mappings, agent_type)
    → calls agent-startup.sh (needs to exist)
    → calls prompt-agent.sh (needs Nextnest agent aliases)

  Breaking ANY link breaks agent spawn.

  Rollback strategy: Before any changes, test:
  cd /root/projects/nextnest
  bash maf/scripts/maf/rebuild-maf-cli-agents.sh --test-only
  # Should show what would be spawned without actually spawning

  ---
  📋 MISSING PRIMITIVES

  1. Subtree Health Check Script

  Document mentions creating this, but it doesn't exist yet.

  Should be added to Wave 1:
  maf/scripts/maf/status/check-subtree-health.sh

  ---
  2. Configuration Loading Utility

  Document shows example:
  scripts/maf/load-config.sh

  This doesn't exist in HQ. Override resolution order is documented but not implemented.

  ---
  3. Schema Validation Scripts

  Schemas exist in HQ:
  - agent-config-schema.json
  - agent-type-mappings.schema.json (proposed)

  No validation scripts exist. Should add:
  maf/scripts/maf/validate-config.sh

  ---
  4. Rollback Detection Script

  No documented way to detect if migration broke something.

  Should add:
  maf/scripts/maf/verify-migration.sh
  # Runs smoke tests: topology parsing, agent spawn dry-run, script loading

  ---
  ✅ VALIDATED ASSUMPTIONS

  The following claims in the documents are CORRECT:

  1. ✅ Roundtable has enhanced scripts/maf/lib/ scripts
  2. ✅ Nextnest has modified subtree files
  3. ✅ MAF HQ has project-specific content (but worse than documented)
  4. ✅ CI guard approach is sound (with fetch-depth: 0 fix)
  5. ✅ GLOBAL vs LOCAL classification framework is valid
  6. ✅ Role-based agent architecture is the right direction
  7. ✅ Two-wave approach is smart (protects production)

  ---
  🎯 RECOMMENDED CHANGES TO MIGRATION PLAN

  Before Wave 1:

  1. Add inventory step:
  # Document exactly what's in HQ
  ls -la /root/projects/maf-github/.maf/agents/
  ls -la /root/projects/maf-github/.maf/config/
  2. Create backup script:
  # Automatic backup before any subtree changes
  scripts/maf/backup-before-migration.sh
  3. Add detection script:
  # Detect all Roundtable AND Nextnest references in HQ
  grep -r "GreenMountain\|RateRidge" /root/projects/maf-github/

  During Wave 1:

  4. Don't delete Nextnest agents - template-ize both sets
  5. Add agent-startup.sh as global - not just Nextnest local
  6. Document session name customization - add to config schema

  During Wave 2:

  7. Test each restoration step with dry-run before committing
  8. Keep local overrides for files that can't be standardized

  ---
  Summary

  Architecture Design v2: ✅ Valid - treat as constitution

  Migration Plan: ⚠️ Needs corrections:
  - HQ has BOTH Roundtable AND Nextnest content (not just Roundtable)
  - Identity wrapper dependency not fully documented
  - Session name drift not addressed
  - Missing detection/validation primitives

  Risk Level: MEDIUM (not LOW as Wave 1 claims)

  Recommendation: Complete the inventory step above before starting Wave 1. The situation is more complex than the document indicates.

Additional Findings from Systematic Debugging

  Phase 4: What I Missed (Root Cause Analysis of My Review)

  🔴 CRITICAL ERRORS IN MY ORIGINAL REVIEW

  1. Document Claim is BACKWARD - "Missing 2 HQ Scripts"

  Document states:
  Roundtable "Missing 2 HQ scripts"

  ACTUAL REALITY:
  Roundtable unique scripts:
  → autonomous-workflow.sh (575 lines - critical bead lifecycle orchestration)
  → clear-stuck-prompts.sh (documented in CLAUDE.md, production-critical)

  HQ unique scripts:
  → NONE (all HQ scripts exist in Roundtable)

  The document has it REVERSED. Roundtable has 2 scripts HQ doesn't, not the other way around.

  ---
  2. Response Awareness Skills Location Mismatch

  Document claims:
  "Response Awareness skills identical"

  ACTUAL REALITY:
  HQ:      .claude/skills/ (25 skills including response-awareness-full)
  Roundtable: .claude/commands/ (5 response-awareness commands, different structure)

  Skills exist in BOTH repos but in DIFFERENT LOCATIONS with DIFFERENT STRUCTURES:
  HQ Skills: response-awareness-full
  Roundtable Commands: response-awareness.md
  ────────────────────────────────────────
  HQ Skills: response-awareness-heavy
  Roundtable Commands: response-awareness-light.md
  ────────────────────────────────────────
  HQ Skills: response-awareness-medium
  Roundtable Commands: response-awareness-plan.md
  ────────────────────────────────────────
  HQ Skills: response-awareness-light
  Roundtable Commands: response-awareness-implement.md
  ────────────────────────────────────────
  HQ Skills: + 16 superpowers skills
  Roundtable Commands: response-awareness-roundtable.md
  The document missed this COMPLETELY. This is a major structural difference, not "identical."

  ---
  3. Script Count Discrepancy

  Document claims:
  "scripts/maf/*.sh (130+ scripts)"

  ACTUAL COUNTS:
  HQ:        130 scripts
  Roundtable: 132 scripts (2 more than HQ)

  **The "130+" is accurate for HQ, but Roundtable has MORE, not just "enhanced versions."

  ---
  4. Missing GLOBAL Candidates - Critical Scripts

  clear-stuck-prompts.sh

  What it does:
  - Detects pending input in tmux panes (text typed but Enter not pressed)
  - Clears stuck prompts with C-c C-u
  - Documented in Roundtable's CLAUDE.md as standard operating procedure
  - Used when Agent Mail responses get typed but not submitted

  Why this should be GLOBAL:
  - ✅ Solves universal Agent Mail + tmux integration problem
  - ✅ Already documented as best practice
  - ✅ Framework-agnostic (works for any MAF project)
  - ✅ Not in the migration plan at all

  Verdict: This is a CRITICAL missing upstream candidate.

  ---
  autonomous-workflow.sh

  What it does:
  - 575-line bead lifecycle orchestration
  - Assigns ready beads → waits for completion → routes to review → runs merge gate → commits and closes

  Why this should be GLOBAL:
  - ✅ Core MAF workflow (beads are part of MAF framework)
  - ✅ Framework-agnostic orchestration pattern
  - ✅ Other repos would want this

  But: ⚠️ May be Roundtable-specific if it hardcodes Roundtable agent names

  Verdict: Check for hardcoded Roundtable references → if generic, upstream

  ---
  5. MCP Agent Mail Location Ambiguity

  Document states:
  mcp_agent_mail/ - Domain-agnostic message layer

  ACTUAL REALITY:
  HQ:      /root/projects/maf-github/mcp_agent_mail/
  Roundtable: (no mcp_agent_mail/ in project root)

  Question: Is MCP Agent Mail supposed to be:
  - A subtree inside maf/?
  - A separate npm/yarn package?
  - A git submodule?

  The document doesn't specify. This is a missing architectural detail.

  ---
  6. Schema Files - Document Assumes Wrong Paths

  Document proposes:
  cat > .maf/config/agent-type-mappings.schema.json <<'EOF'

  ACTUAL REALITY:
  HQ doesn't have .maf/config/*.schema.json files

  Either:
  1. Schema files don't exist yet (need to be created)
  2. They're in a different location
  3. The document's path is wrong

  I didn't verify WHERE schemas actually live.

  ---
  🐛 Methodological Gaps in My Review

  What I Did Wrong:

  1. Skipped full inventory - I spot-checked files instead of systematic comparison
  2. Didn't use comm command - Would have immediately shown the 2 unique Roundtable scripts
  3. Assumed document's direction was correct - Didn't verify "missing from HQ" vs "HQ missing"
  4. Didn't trace skill locations - Assumed .claude/skills/ was universal
  5. Missed critical production script - clear-stuck-prompts.sh is in CLAUDE.md!

  What I Should Have Done:

  # 1. Complete script inventory
  comm -13 <(find HQ_SCRIPTS) <(find RT_SCRIPTS)  # HQ-only
  comm -23 <(find HQ_SCRIPTS) <(find RT_SCRIPTS)  # RT-only

  # 2. Complete skill inventory
  diff -rq HQ/.claude/skills/ RT/.claude/skills/
  diff -rq HQ/.claude/commands/ RT/.claude/commands/

  # 3. Trace each "missing" claim
  for claim in "missing 2 HQ scripts" "enhanced 4 scripts"; do
      verify_claim "$claim"
  done

  # 4. Check CLAUDE.md for documented scripts
  grep -E "scripts/maf/.*\.sh" CLAUDE.md | while read script; do
      check_if_in_hq "$script"
  done

  ---
  📋 Updated Findings Summary

  New Critical Corrections:
  ┌─────────────────────────┬──────────────────┬────────────────┐
  │     Document Claim      │     Reality      │     Impact     │
  ├─────────────────────────┼──────────────────┼────────────────┤
  │ "Missing 2 HQ scripts   │ REVERSED:        │ Migration plan │
  │ in Roundtable"          │ Roundtable has 2 │  is backward   │
  │                         │  HQ doesn't      │                │
  ├─────────────────────────┼──────────────────┼────────────────┤
  │                         │ DIFFERENT:       │ Structural     │
  │ "Response Awareness     │ Different        │ mismatch       │
  │ skills identical"       │ locations,       │ missed         │
  │                         │ different counts │                │
  ├─────────────────────────┼──────────────────┼────────────────┤
  │                         │ NOT MENTIONED:   │ Missing        │
  │ clear-stuck-prompts.sh  │ Critical         │ upstream       │
  │                         │ production       │ candidate      │
  │                         │ script           │                │
  ├─────────────────────────┼──────────────────┼────────────────┤
  │                         │ NOT MENTIONED:   │ Missing        │
  │ autonomous-workflow.sh  │ 575-line         │ upstream       │
  │                         │ orchestration    │ candidate      │
  ├─────────────────────────┼──────────────────┼────────────────┤
  │                         │ AMBIGUOUS:       │ Architectural  │
  │ MCP Agent Mail location │ Document doesn't │ gap            │
  │                         │  specify         │                │
  └─────────────────────────┴──────────────────┴────────────────┘
  ---
  🎯 Updated Recommendations

  Add to Migration Plan:

  1. Reverse the script sync direction:
  # Wrong direction in document:
  cp /root/projects/maf-github/scripts/maf/* /root/projects/roundtable/

  # Correct direction:
  cp /root/projects/roundtable/scripts/maf/clear-stuck-prompts.sh \
     /root/projects/maf-github/scripts/maf/
  cp /root/projects/roundtable/scripts/maf/autonomous-workflow.sh \
     /root/projects/maf-github/scripts/maf/
  2. Document skill location strategy:
    - Are skills in .claude/skills/ (HQ pattern) or .claude/commands/ (Roundtable pattern)?
    - Need to standardize before migration
  3. Add clear-stuck-prompts.sh as GLOBAL:
    - Production-critical (documented in CLAUDE.md)
    - Solves universal Agent Mail + tmux problem
    - Should be in Wave 1

  ---
  Summary

  Systematic debugging of my review revealed:
  - ✅ My major findings stand (HQ has mixed content, Nextnest drift confirmed)
  - ❌ I missed critical direction errors (scripts flow is REVERSED)
  - ❌ I didn't verify skill location differences
  - ❌ I missed 2 important upstream candidates

  Methodology lesson: Complete inventory FIRST, then analyze. I jumped to analysis before completing the systematic comparison.