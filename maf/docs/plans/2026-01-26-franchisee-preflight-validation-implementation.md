# Implementation Plan: Franchisee Preflight Validation System

**Design:** [2026-01-26-franchisee-preflight-validation.md](./2026-01-26-franchisee-preflight-validation.md)
**Estimated Time:** ~4.5 hours
**Priority:** HIGH

## Phase 0: Environment Setup (15 min)

### Task 0.1: Validate jq is installed
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 2 min
**Action:** Add jq dependency check at top of script (inline check, return_error will be defined in Task 1.2)
**Exit Code:** 2 (system error - missing dependency)
**Verification:** Script exits with clear error if jq missing
```bash
if ! command -v jq &> /dev/null; then
  echo "❌ CRITICAL: jq is required but not installed" >&2
  echo "   Fix: Install with: sudo apt-get install jq" >&2
  exit 2
fi
```

### Task 0.2: Update sample agent-topology.json with mail_name field
**Source File:** `templates/agent-topology.json.example`
**Target File:** `.maf/config/agent-topology.json.example`
**Time:** 8 min
**Action:**
1. Copy example topology and add mail_name field to each pane (OrangeDog, PurpleBear, RedPond, PinkStone for NextNest)
2. Add migration note to example: "If upgrading from older topology without mail_name, add mail_name field matching your Agent Mail names"
3. Document mail_name as optional for backward compatibility (warn if missing, don't fail)
**Verification:** Example file includes mail_name field for all panes, validates against schema, includes migration notes

### Task 0.3: Implement layout detection
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 8 min
**Action:** Add subtree vs direct layout detection (following maf/scripts/maf/agent-startup.sh pattern)
**Verification:** Test in both subtree (maf/scripts/maf/) and direct (scripts/maf/) layouts
```bash
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
  PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
  PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

---

## Phase 1: Core Preflight Gatekeeper (50 min)

### Task 1.1: Create gatekeeper library file
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 5 min
**Action:** Create file with shebang, ABOUTME header, set -euo pipefail, and basic structure
**Verification:** File exists and is executable
```bash
touch maf/scripts/maf/preflight-gatekeeper.sh
chmod +x maf/scripts/maf/preflight-gatekeeper.sh
```

### Task 1.2: Implement error handling functions
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 12 min
**Action:** Add error handling functions with exact specifications:

**return_error()** - Critical error that blocks execution
- Parameters: error_message, fix_hint
- Output: Colored RED error to stderr, fix hint in yellow
- Exit code: 1 (critical failure)
- Format: `return_error "Topology missing" "Create .maf/config/agent-topology.json"`

**return_warn()** - Advisory warning that allows continuation
- Parameters: warning_message, fix_hint
- Output: Colored YELLOW warning to stdout, fix hint
- Exit code: 0 (continues execution)
- Format: `return_warn "Optional tools missing" "Install bd command for better UX"`

**return_skip()** - Informational skip message
- Parameters: skip_message
- Output: Colored BLUE info to stdout
- Exit code: 0 (continues execution)
- Format: `return_skip "Preflight checks skipped via MAF_SKIP_PREFLIGHT"`

**Exit Codes:**
- 0 = All checks passed
- 1 = Critical check failed (blocks execution)
- 2 = Preflight system error
- 3 = Invalid arguments
**Verification:** Unit test each function returns correct exit code and output format

### Task 1.3: Implement topology file validation
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 12 min
**Action:** Add `check_topology_file()` - validates existence, JSON format, required fields. Check MAF_TOPOLOGY_FILE env var first, then fall back to .maf/config/agent-topology.json
**Verification:** Test with missing file, malformed JSON, incomplete topology, custom topology path

### Task 1.4: Implement Agent Mail name coverage check
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 8 min
**Action:** Add `check_agent_mail_names()` - ADVISORY check that warns if mail_name field is missing (backward compatible). Use return_warn() not return_error() to allow older topologies to work
**Verification:** Test with topology missing mail_name for pane 2 (should warn, not fail)

### Task 1.5: Implement MAF subtree integrity check
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 7 min
**Action:** Add `check_maf_subtree()` - ADVISORY check that warns about uncommitted changes in maf/ (works in both subtree and direct layouts). Use return_warn() because local patch workflows often require modifying maf/
**Verification:** Test with clean and dirty maf/ directory (should warn, not fail)

### Task 1.6: Implement preflight_init() main function
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 8 min
**Action:** Add main orchestration function that runs all checks, supports MAF_SKIP_PREFLIGHT env var, returns aggregate result with proper exit codes
**Verification:** Test with all pass, critical fail, advisory fail scenarios, and MAF_SKIP_PREFLIGHT=1

---

## Phase 2: Topology Helper Functions (25 min)

### Task 2.1: Implement get_mail_name_by_pane()
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 7 min
**Action:** Add function to query topology by pane index with error handling for invalid pane
**Verification:** Test returns mail name "OrangeDog" for pane 0 in NextNest topology, returns error for invalid pane

### Task 2.2: Implement get_mail_name_by_role()
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 7 min
**Action:** Add function to query topology by role name with error handling for unknown role
**Verification:** Test returns "OrangeDog" for "supervisor" role, returns error for unknown role

### Task 2.3: Implement get_agent_name_by_pane()
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 6 min
**Action:** Add function to get agent name by pane index with error handling for invalid pane
**Verification:** Test returns "LedgerLeap" for pane 2, returns error for invalid pane

### Task 2.4: Implement get_pane_by_role()
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 5 min
**Action:** Add function to get pane index by role with error handling for unknown role
**Verification:** Test returns 0 for "supervisor" role, returns error for unknown role

---

## Phase 3: MAF Manifest System (35 min)

### Task 3.1: Extend existing .maf-manifest.json
**File:** `.claude/.maf-manifest.json`
**Time:** 10 min
**Action:** EXTEND existing manifest format (DO NOT replace). Current manifest has `managed_files` array - add new field `hq_owned_files: []` to track MAF HQ files that franchisees shouldn't modify. This is backward compatible.
**Verification:** Existing manifest structure preserved, new field added, JSON validates

### Task 3.2: Create .maf-manifest-schema.json
**File:** `.claude/.maf-manifest-schema.json` (same directory as manifest)
**Time:** 12 min
**Action:** Create JSON schema for manifest validation with $schema reference: "./.maf-manifest-schema.json"
**Verification:** Schema validates sample manifest

### Task 3.3: Implement check_hq_files_unmodified()
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 13 min
**Action:** Add CRITICAL check function that validates files in `hq_owned_files` against git diff. Use return_error() with exit 1 because these are MAF HQ files that shouldn't be modified
**Verification:** Test detects modified files in maf/, exits with code 1

### Task 3.4: Implement optional tools check
**File:** `maf/scripts/maf/preflight-gatekeeper.sh`
**Time:** 5 min
**Action:** Add `check_optional_tools()` - warns about missing nice-to-have tools (e.g., bd command)
**Verification:** Test warns when `bd` command not found

---

## Phase 4: Refactor autonomous-workflow Script (25 min)

### Task 4.1: Add preflight gatekeeper to autonomous-workflow-nextnest.sh
**File:** `experiments/autonomous-workflow-nextnest.sh`
**Time:** 5 min
**Action:** Add source line and preflight_init call at top of script using portable sourcing pattern that works in both subtree and direct layouts
**Verification:** Script fails fast when topology missing
```bash
# Find preflight gatekeeper (works in both subtree and direct layouts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/../maf/scripts/maf/preflight-gatekeeper.sh" ]]; then
  source "${SCRIPT_DIR}/../maf/scripts/maf/preflight-gatekeeper.sh"
elif [[ -f "${SCRIPT_DIR}/maf/scripts/maf/preflight-gatekeeper.sh" ]]; then
  source "${SCRIPT_DIR}/maf/scripts/maf/preflight-gatekeeper.sh"
else
  echo "ERROR: Cannot find preflight-gatekeeper.sh" >&2
  exit 2
fi
preflight_init || exit $?
```

### Task 4.2: Replace get_agent_mail_name() with topology helper
**File:** `experiments/autonomous-workflow-nextnest.sh`
**Time:** 8 min
**Action:** Remove existing get_agent_mail_name() function (lines ~172-181), replace all calls with get_mail_name_by_pane() from preflight-gatekeeper
**Verification:** Script returns correct Agent Mail names from topology, no hardcoded case statements remain

### Task 4.3: Update all hardcoded Agent Mail name references
**File:** `experiments/autonomous-workflow-nextnest.sh`
**Time:** 10 min
**Action:** Find/replace all hardcoded names (OrangeDog, PurpleBear, etc.) with topology calls. Verify with grep.
**Locations:** Lines 71-74 (comments), 131, 145, 165-168 (duplicate comments), 172-175 (function), 295, 304, 339, 373, 467, 533
**Verification:**
```bash
grep -n -E "(OrangeDog|PurpleBear|RedPond|PinkStone)" experiments/autonomous-workflow-nextnest.sh
# Should return no results (all replaced with topology calls)
```

### Task 4.4: Add MAF_TOPOLOGY_FILE environment variable support ✅ COMPLETE
**File:** `maf/scripts/maf/preflight-gatekeeper.sh` (not the script itself)
**Time:** 2 min
**Action:** Document that MAF_TOPOLOGY_FILE env var is already supported via Task 1.3 implementation
**Verification:** Test with `export MAF_TOPOLOGY_FILE=/custom/path/topology.json`
**Status:** ✅ VERIFIED - Feature already implemented in Task 1.3 (line 47). Documentation created at `/root/projects/maf-github/docs/plans/2026-01-26-maf-topology-file-env-var-verification.md`

---

## Phase 5: Integration & Documentation (30 min)

### Task 5.1: Update franchisee-init.sh to generate .maf-manifest.json
**File:** `scripts/franchisee-init.sh`
**Time:** 12 min
**Action:** Add step to create initial manifest at .claude/.maf-manifest.json during franchisee initialization, copy example topology from templates/agent-topology.json.example to .maf/config/agent-topology.json
**Verification:** Running franchisee-init creates .maf-manifest.json and .maf/config/agent-topology.json

### Task 5.2: Create .maf/config/custom-preflight-checks.sh template
**File:** `.maf/config/custom-preflight-checks.sh.template`
**Time:** 5 min
**Action:** Create template file with example custom_preflight_checks() function
**Verification:** Template has clear instructions and working example

### Task 5.3: Update VENDOR_ARCHITECTURE.md with preflight info
**File:** `docs/VENDOR_ARCHITECTURE.md`
**Time:** 10 min
**Action:** Add section explaining preflight system and how it protects franchisee setup
**Verification:** Documentation references .claude/.maf-manifest.json and preflight checks

### Task 5.4: Create test script for preflight validation
**File:** `maf/scripts/maf/test-preflight.sh`
**Time:** 5 min
**Action:** Create test script that validates all preflight scenarios with ABOUTME header and strict mode
**Verification:** Running test script covers all check types

---

## Phase 6: Testing & Validation (40 min)

### Task 6.0: Prerequisite - Setup test topology
**Time:** 2 min
**Action:** Copy example topology to actual topology location for testing
**Verification:** .maf/config/agent-topology.json exists and is valid

### Task 6.1: Test with missing topology
**Time:** 5 min
**Action:** Run autonomous-workflow with .maf/config/agent-topology.json deleted
**Expected:** Script exits with clear error message (exit code 1)

### Task 6.2: Test with malformed topology
**Time:** 5 min
**Action:** Corrupt topology JSON and run script
**Expected:** Script exits with "malformed JSON" error (exit code 1)

### Task 6.3: Test Agent Mail name retrieval
**Time:** 5 min
**Action:** Verify get_mail_name_by_pane returns correct names from NextNest topology
**Expected:** Returns mail_name for panes 0-3 matching the loaded topology.json (verify with `jq '.panes[].mail_name' .maf/config/agent-topology.json`)

### Task 6.4: Test MAF HQ file modification detection
**Time:** 5 min
**Action:** Modify a file in maf/, run preflight check
**Expected:** Warning about modified HQ file with fix hint

### Task 6.5: Test with jq not installed
**Time:** 5 min
**Action:** Temporarily hide jq (PATH manipulation), run preflight
**Expected:** Clear error with installation instructions (exit code 2)

### Task 6.6: Test with unreadable topology file
**Time:** 5 min
**Action:** chmod 000 .maf/config/agent-topology.json
**Expected:** Permission error with fix hint

### Task 6.7: Test invalid pane/role queries
**Time:** 5 min
**Action:** Call get_mail_name_by_pane with pane 99
**Expected:** Error message indicating invalid pane

### Task 6.8: Test MAF_SKIP_PREFLIGHT env var
**Time:** 5 min
**Action:** export MAF_SKIP_PREFLIGHT=1; run preflight
**Expected:** Preflight checks skipped, script continues

---

## Verification Checklist

- [ ] All critical checks block execution on failure
- [ ] All advisory checks warn but allow continuation
- [ ] Agent Mail names are read from topology (not hardcoded)
- [ ] Error messages include actionable fix hints
- [ ] .maf-manifest.json tracks MAF-owned files
- [ ] Franchisee can extend with custom checks
- [ ] Existing franchisees not broken by changes
- [ ] Documentation is clear and complete

## Rollback Plan

If issues arise during implementation:

1. **Stop Implementation:**
   ```bash
   # Kill any running preflight checks
   pkill -f preflight-gatekeeper
   ```

2. **Revert Changes (using git stash for safety):**
   ```bash
   # Stash all changes safely
   git stash push -u -m "preflight-rollback-$(date +%Y%m%d)"

   # Or revert specific files if needed
   git checkout HEAD -- experiments/autonomous-workflow-nextnest.sh scripts/franchisee-init.sh
   ```

3. **Disable Preflight (temporary):**
   ```bash
   # Option A: Skip via env var
   export MAF_SKIP_PREFLIGHT=1

   # Option B: Comment out source lines
   sed -i 's/^source.*preflight-gatekeeper/# &/' experiments/autonomous-workflow-nextnest.sh
   ```

4. **Validate Rollback:**
   ```bash
   # Test script works without preflight
   bash experiments/autonomous-workflow-nextnest.sh --once
   ```

5. **Address Issues:**
   - Document root cause in /tmp/maf-preflight-rollback-$(date +%Y%m%d).log
   - Create follow-up issue with findings
   - Submit PR for fixes

## Success Metrics

### Quantitative Metrics:
- Preflight check execution time: <5 seconds (measured with `time`)
- Agent Mail name mismatch errors: 0 in production (grep logs)
- Franchisee setup success rate: >95% (track over 30 days)
- False positive rate: <5% (warnings that don't indicate real issues)
- False negative rate: 0% (critical issues not caught)

### Qualitative Metrics:
- Error messages include actionable fix hints (manual review)
- No breaking changes for existing franchisees (test with 3+ franchisees)
- Clear documentation (peer review)

### Baseline Measurements (to be taken before implementation):
- Current setup time: measure with 3 new franchisees
- Current error rate: count topology-related issues in logs
