# MAF Migration Readiness Test Suite

**Phase**: 0, Step 0.4 - Pre-Migration Validation
**Purpose**: Comprehensive validation before MAF Franchise Migration

---

## Overview

This test suite validates that the MAF codebase is ready for migration by checking critical dependencies, configurations, and potential breaking points.

**All tests are non-destructive** - they perform read-only checks only.

---

## Quick Start

### From Project Root
```bash
bash scripts/maf/tests/test-migration-readiness.sh
```

### From Any Directory
```bash
bash /root/projects/maf-github/scripts/maf/tests/test-migration-readiness.sh
```

### Output
Results are saved to: `/tmp/migration-test-results-{timestamp}.txt`

---

## Test Suite Details

### Test 1: Agent Startup Dependency Chain
**Purpose**: Verify that agent startup wrapper exists and is accessible

**What it checks**:
- `agent_startup_wrapper` function or `AGENT_STARTUP_WRAPPER` variable
- Searches in multiple locations (subtree and direct layouts)

**Why it matters**:
- Agent spawn will break if this wrapper is missing
- Critical for agent orchestration after migration

**PASS**: Wrapper found in expected location
**FAIL**: Wrapper not found - agent spawn will break

---

### Test 2: Topology Schema Compatibility
**Purpose**: Check agent-topology.json schema version

**What it checks**:
- Schema version field in config files
- Version 1.0.0 vs 2.0.0 compatibility

**Why it matters**:
- v2.0.0 has enhanced features that may not be supported by all scripts
- Schema mismatch can cause agent failures

**PASS**: v1.0.0 detected (standard compatibility)
**WARN**: v2.0.0 detected (verify script compatibility)
**FAIL**: No config found or unknown version

---

### Test 3: Session Name Consistency
**Purpose**: Verify session names match across all configs

**What it checks**:
- Root config session name
- Subtree config session name
- Context manager session name

**Why it matters**:
- tmux commands fail if session names don't match
- Agents spawn in wrong sessions
- Health checks fail due to session mismatch

**PASS**: All session names consistent
**FAIL**: Session name mismatch detected

**Resolution**:
- Standardize on one session name
- Use environment variable override
- See `docs/SESSION_NAME_STANDARDIZATION.md`

---

### Test 4: Memlayer Dependencies
**Purpose**: Check if memlayer scripts exist

**What it checks**:
- `agent-memory.sh` (memory layer for agents)
- `agent-mail-fetch.sh` (agent mail integration)

**Why it matters**:
- Context manager may fail if it references missing scripts
- Memory features won't work without memlayer

**PASS**: All memlayer scripts exist
**WARN**: Memlayer scripts missing

**Resolution**:
- Implement memlayer properly, or
- Update context manager to remove references

---

### Test 5: Enhanced Script Functions
**Purpose**: Verify critical enhanced functions exist

**What it checks**:
- `get_agent_by_role` - Role-based agent lookup
- `spawn_agent_with_persona` - Persona-based spawning
- `tmux_pane_health_check` - Tmux pane health monitoring

**Why it matters**:
- Advanced features depend on these functions
- Role-based agent workflow requires `get_agent_by_role`

**PASS**: All required functions found
**WARN**: Some functions missing

**Impact**: Missing functions mean some advanced features won't work

---

### Test 6: Hardcoded Paths Detection
**Purpose**: Find hardcoded absolute paths

**What it checks**:
- Shell scripts with `/root/projects/` hardcoded
- JSON configs with absolute paths

**Why it matters**:
- Hardcoded paths break when code moves between repos
- Migration will fail if paths aren't dynamic

**PASS**: No hardcoded paths detected
**WARN**: Hardcoded paths found

**Resolution**:
- Use `PROJECT_ROOT` environment variable
- Implement auto-detection pattern
- See `scripts/maf/lib/project-root-utils.sh`

---

## Output Format

### Console Output
```
[INFO] Running: Agent Startup Dependency Chain
[PASS] Agent startup wrapper found in: scripts/maf/rebuild-maf-cli-agents.sh

[INFO] Running: Topology Schema Version Check
[WARN] Schema v2.0.0 detected - ensure scripts are compatible
```

### Color Legend
- 🔵 **[INFO]** - Informational message
- 🟢 **[PASS]** - Test passed
- 🔴 **[FAIL]** - Test failed (blocks migration)
- 🟡 **[WARN]** - Warning (review recommended)

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All tests passed |
| `1` | One or more tests failed |

**Use in CI**:
```bash
bash scripts/maf/tests/test-migration-readiness.sh
if [ $? -eq 0 ]; then
    echo "Migration ready - proceed"
else
    echo "Migration blocked - fix failures"
    exit 1
fi
```

---

## Pre-Migration Checklist

Before starting migration, ensure:

- [ ] All tests pass (no FAIL results)
- [ ] Review all WARN results
- [ ] Fix hardcoded paths if found
- [ ] Verify session name consistency
- [ ] Confirm memlayer dependencies addressed
- [ ] Document any known limitations

---

## Troubleshooting

### "Agent startup wrapper not found"
**Cause**: Wrapper function missing from agent startup scripts

**Fix**:
1. Check if `agent-startup.sh` exists
2. Verify `rebuild-maf-cli-agents.sh` sources it
3. Add wrapper if missing

### "Session name mismatch"
**Cause**: Root and subtree configs use different session names

**Fix**:
1. Standardize on one session name
2. Or use `MAF_TMUX_SESSION` environment variable
3. Update all config files to match

### "Memlayer scripts missing"
**Cause**: Memory layer scripts not installed

**Fix**:
1. Implement memlayer scripts
2. Or remove references from context manager
3. Document as known limitation

### "Function not found: get_agent_by_role"
**Cause**: Role-based utilities not installed

**Fix**:
1. Copy `role-utils.sh` from MAF HQ
2. Source it in scripts that need it
3. Or use direct agent name lookups

---

## Integration with CI

Add to your CI pipeline:

```yaml
name: Migration Readiness Check
on: [pull_request, push]

jobs:
  test-readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run migration readiness tests
        run: |
          bash scripts/maf/tests/test-migration-readiness.sh
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: /tmp/migration-test-results-*.txt
```

---

## Related Documentation

- **Blueprint**: `/root/projects/maf-github/docs/plans/maf-franchise-migration-unified-blueprint.md`
- **Path Audit**: `/tmp/path-impact-analysis.md` (from Step 0.1)
- **Baseline Metrics**: `/tmp/baseline-metrics.md` (from Step 0.2)
- **Session Names**: `docs/SESSION_NAME_STANDARDIZATION.md`

---

## Support

For issues or questions:
1. Check the test results file for detailed output
2. Review the blueprint for context
3. Consult the troubleshooting guide above

**Test Version**: 1.0.0
**Last Updated**: 2026-01-08
**Blueprint Reference**: Part 2, Step 0.4 (lines 169-224)
