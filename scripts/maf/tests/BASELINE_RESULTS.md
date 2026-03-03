# Agent Spawn Baseline Test Results

**Test Date:** 2026-01-08  
**Baseline File:** `/tmp/agent-spawn-baseline-20260108-112005.txt`  
**Test Script:** `scripts/maf/tests/baseline-agent-spawn.sh`

## Executive Summary

The baseline test has been successfully established with **4 passing tests** and **1 warning**. A critical bug in `spawn-agents.sh` has been identified that prevents agent spawning.

## Test Results

| Test | Status | Details |
|------|--------|---------|
| Test 1: Script Exists | ✅ PASS | spawn-agents.sh exists and is executable |
| Test 2: Help Command | ✅ PASS | Help command functional |
| Test 3: Config File | ✅ PASS | Config file exists and is valid JSON |
| Test 4: Config Content | ✅ PASS | 4 session layouts defined |
| Test 5: Spawn Test | ⚠️ WARN | Spawn failed due to PROJECT_ROOT bug |

**Overall:** 4 passed, 0 failed, 1 skipped/warning

## Critical Issue Identified

### Bug: PROJECT_ROOT Detection Inconsistency

**Location:** `scripts/maf/spawn-agents.sh` lines 8-23  
**Impact:** Agent spawn fails with "Configuration file not found" error

**Problem:** 
- `spawn-agents.sh` calculates PROJECT_ROOT as 2 levels up from `scripts/maf/`
- `lib/error-handling.sh` calculates PROJECT_ROOT as 3 levels up from `scripts/maf/lib/`
- When `spawn-agents.sh` sources `lib/error-handling.sh`, PROJECT_ROOT gets recalculated incorrectly
- Result: `PROJECT_ROOT=/root/projects/maf-github/scripts` instead of `/root/projects/maf-github`

**Error Output:**
```
[ORCHESTRATOR 11:20:06] Project root: /root/projects/maf-github/scripts
[ERROR] Configuration file not found: /root/projects/maf-github/scripts/.maf/config/default-agent-config.json
```

**Expected:**
```
[ORCHESTRATOR] Project root: /root/projects/maf-github
```

### Root Cause Analysis

1. **spawn-agents.sh** (lines 15-22):
   ```bash
   if [[ "$MAF_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
       PROJECT_ROOT="$(cd "$(dirname "$MAF_SCRIPT_DIR")/../.." && pwd)"
   else
       PROJECT_ROOT="$(cd "$(dirname "$MAF_SCRIPT_DIR")/.." && pwd)"
   fi
   ```
   - For `scripts/maf/`, goes up 2 levels → `/root/projects/maf-github` ✅

2. **lib/error-handling.sh** (line 10):
   ```bash
   PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
   ```
   - For `scripts/maf/lib/`, goes up 3 levels → `/root/projects/maf-github` ✅
   - BUT: Since PROJECT_ROOT is already set, it should use the existing value
   - ACTUAL BEHAVIOR: The `${PROJECT_ROOT:-...}` syntax should preserve existing value, but something is overriding it

### Recommended Fix

**Option 1: Pass PROJECT_ROOT to sourced libraries**
In `spawn-agents.sh`, export PROJECT_ROOT before sourcing:
```bash
export PROJECT_ROOT  # Add this line
source "$LIB_DIR/error-handling.sh"
```

**Option 2: Fix lib/error-handling.sh**
Change line 10 to respect existing PROJECT_ROOT:
```bash
# Don't recalculate if already set
if [[ -z "${PROJECT_ROOT:-}" ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi
```

**Option 3: Use relative path from PROJECT_ROOT**
Instead of relying on dirname calculations, use:
```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
```

## Configuration Validation

### Default Agent Config
- **Location:** `.maf/config/default-agent-config.json`
- **Status:** ✅ Valid JSON
- **Session Layouts:** 4 defined
  - `cli_codex_claude_4_pane`
  - `default_4_pane`
  - `glm_review_3_pane`
  - `minimal_2_pane`

### Agent Topology Config
- **Location:** `.maf/config/agent-topology.json`
- **Status:** ✅ Valid JSON
- **Schema Version:** 1.0.0
- **Session Name:** maf-cli
- **Agents Defined:** 4
  - GreenMountain (supervisor)
  - BlackDog (reviewer)
  - OrangePond (implementor-1)
  - FuchsiaCreek (implementor-2)

## Pre-Wave 1 Validation Status

### Ready for Wave 1
- ✅ Test infrastructure in place
- ✅ Baseline established
- ✅ Configuration files validated
- ✅ Known issues documented

### Blockers for Wave 1
- ⚠️ **CRITICAL:** spawn-agents.sh PROJECT_ROOT bug must be fixed before Wave 1
- This bug will prevent any agent spawning operations
- Affects all spawn-agents.sh functionality

## Next Steps

### Before Wave 1
1. **Fix PROJECT_ROOT bug** in spawn-agents.sh or lib/error-handling.sh
2. Re-run baseline test to verify fix
3. Test actual agent spawn in background mode
4. Update baseline with passing spawn test

### During Wave 1
1. Run baseline test: `bash scripts/maf/tests/baseline-agent-spawn.sh`
2. Compare with baseline: `diff /tmp/agent-spawn-baseline-*.txt`
3. Verify all 5 tests pass (no warnings)

### After Wave 1
1. Document any regressions
2. Update baseline if needed
3. Verify agent spawn functionality in production

## Test Usage

### Run Baseline Test
```bash
cd /root/projects/maf-github
bash scripts/maf/tests/baseline-agent-spawn.sh
```

### Compare Results
```bash
# List all baseline files
ls -la /tmp/agent-spawn-baseline-*.txt

# Compare two baselines
diff /tmp/agent-spawn-baseline-<BEFORE>.txt /tmp/agent-spawn-baseline-<AFTER>.txt
```

### Expected Output
```
=== MAF Agent Spawn Baseline Test ===
Date: [timestamp]
Project Root: /root/projects/maf-github

Test 1: Script Existence Check
PASS: spawn-agents.sh exists and is executable

Test 2: Help Command
PASS: Help command functional

Test 3: Configuration File Check
PASS: Config file exists at .maf/config/default-agent-config.json
PASS: Config file is valid JSON
   Session layouts defined: 4

Test 4: Configuration Content Check
Default config layouts:
     - cli_codex_claude_4_pane
     - default_4_pane
     - glm_review_3_pane
     - minimal_2_pane

Test 5: Background Spawn Test
PASS: Background spawn command completed
PASS: maf-session session created

=== TEST SUMMARY ===
Test 1 (Script Exists): PASS
Test 2 (Help Command): PASS
Test 3 (Config File): PASS
Test 4 (Config Content): PASS
Test 5 (Spawn Test): PASS

Results: 5 passed, 0 failed, 0 skipped
```

## Appendix: Test Script Details

### Test Coverage
1. **Script Existence:** Verifies spawn-agents.sh exists and is executable
2. **Help Command:** Validates basic script functionality
3. **Config File:** Checks configuration file exists and is valid JSON
4. **Config Content:** Displays configuration structure
5. **Spawn Test:** Attempts actual agent spawn in background mode

### Test Limitations
- Read-only test (doesn't modify configuration)
- Doesn't kill existing sessions
- 15-second timeout on spawn attempt
- Doesn't validate agent functionality after spawn

### Safety Features
- Detects existing sessions and skips spawn test
- Uses timeout to prevent hanging
- Creates timestamped baseline files
- Non-destructive to existing infrastructure

---

**Generated:** 2026-01-08  
**MAF Franchise Migration:** Phase 0.2 - Agent Spawn Baseline  
**Status:** ⚠️ Baseline established, critical bug identified
