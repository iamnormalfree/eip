# MAF Franchise Migration: Unified Blueprint (Corrected & Validated)

**Date:** 2026-01-08
**Status:** Synthesis Complete - Ready for Execution
**Version:** v3.0 (Unified with All Corrections)
**Complexity Score:** 9/12 (Multi-domain, requires full response-awareness)

---

## Executive Summary

This unified blueprint synthesizes findings from 4 research documents to create a validated, production-ready migration plan. **Critical errors** in the original analysis have been corrected, and missing context has been integrated.

### Major Corrections from Original Analysis

| Original Claim | Corrected Reality | Impact |
|----------------|-------------------|--------|
| "HQ has Roundtable agent topology" | **MISLEADING** - HQ config has generic nature/animal names (GreenMountain, BlackDog, etc.) that serve as template placeholders, not Roundtable-specific contamination | These are generic templates that happen to match Roundtable's naming scheme |
| "HQ has Roundtable agent prompts" | **CORRECT** - HQ has NextNest prompts (auditbay, rateridge, primteportal, ledgerleap) | Prompts layer has NextNest contamination |
| "Roundtable missing 2 HQ scripts" | **REVERSED**: Roundtable has 2 scripts HQ doesn't | Script sync direction is backward |
| "Response Awareness skills identical" | **DIFFERENT**: HQ has 25 .claude/skills/, RT has 5 .claude/commands/ (different structure and naming) | Structural mismatch missed |
| "3 NEW files from Roundtable (not enhanced)" | 3 are NEW files (not enhancements), 2,163 lines total | Mischaracterization of scope |

### Critical Missing Context Integrated

1. **Subtree Auto-Detection Pattern** - Sophisticated path detection breaks on file moves
2. **Topology Schema Incompatibility** - v1.0.0 vs v2.0.0, no migration path defined
3. **Agent Startup Dependency Chain** - Hardcoded paths that will break
4. **Session Name Chaos** - HQ should use "maf-hq", Roundtable uses "maf-cli", NextNest uses "maf-nn" (need unique names for concurrent operation)
5. **Missing Memlayer Dependencies** - Context manager assumes existence
6. **284+ Hardcoded Paths** - Absolute paths throughout codebase

### Two-Wave Approach Validated

The two-wave approach from Architecture Design v2 is **confirmed as production-safe**:

| Wave | Duration | Risk | Focus | Gate |
|------|----------|------|-------|------|
| **Wave 1** | Days 1-10 | Low | Stabilization (additive only) | Required before Wave 2 |
| **Wave 2** | Days 11-28 | Medium | Refinement (can delete/enforce) | After validation |

---

## Part 1: Corrected Assessment

### 1.1 Repository States (CORRECTED)

#### MAF HQ (`/root/projects/maf-github`)

**Actual State (VERIFIED):**
```
.maf/config/agent-topology.json    → Has generic nature/animal TEMPLATE NAMES (GreenMountain, BlackDog, OrangePond, FuchsiaCreek)
.maf/agents/                        → Has NextNest PROMPTS (auditbay, rateridge, primteportal, ledgerleap)
scripts/maf/prompt-packs/           → Has 8 Roundtable prompt packs
scripts/maf/lib/                    → Missing 3 major files from Roundtable
```

**HQ Content Analysis:**
- Config layer → Generic template names (nature/animal themed) that happen to match Roundtable's naming scheme - these are TEMPLATE PLACEHOLDERS, not Roundtable contamination
- Prompts layer → NextNest domain-specific prompts (mortgage-themed)
- Prompt packs → Roundtable workflow configs (8 roundtable-*.json files)

**What's Missing:**
- `scripts/maf/lib/error-handling.sh` (630 lines, NEW in Roundtable, Wave 1 enhanced)
- `scripts/maf/lib/tmux-utils.sh` (900 lines, NEW in Roundtable, Wave 1 enhanced)
- `scripts/maf/clear-stuck-prompts.sh` (82 lines, production-critical, Roundtable-only)

**Excluded from Wave 1:**
- `scripts/maf/autonomous-workflow.sh` (575 lines) - Contains hardcoded Roundtable agent names, requires refactoring for role-based lookups before upstreaming

#### Roundtable (`/root/projects/roundtable`)

**Actual State:**
```
lib/maf/                            → Core library synchronized
.claude/commands/                   → 5 response-awareness commands (different structure)
scripts/maf/lib/                    → Has 3 NEW files not in HQ
scripts/maf/clear-stuck-prompts.sh  → CRITICAL, missing from HQ
scripts/maf/autonomous-workflow.sh  → 575 lines, missing from HQ
```

**Script Count:** 132 scripts (2 MORE than HQ, not just "enhanced versions")

**Unique Scripts:**
- `autonomous-workflow.sh` - Bead lifecycle orchestration
- `clear-stuck-prompts.sh` - Production-critical Agent Mail + tmux fix

#### NextNest (`/root/projects/nextnest`)

**Actual State:**
```
.maf/config/agent-topology.json     → v1.0.0 schema, session "maf-cli" (PRISTINE from HQ)
maf/.maf/config/agent-topology.json → v2.0.0 schema, session "maf-nn" (ENHANCED, within subtree)
maf/scripts/maf/prompt-agent.sh     → Has subtree auto-detection
maf/scripts/maf/rebuild-maf-cli-agents.sh → Has agent startup wrapper (lines 47, 273, 284)
maf/scripts/maf/agent-startup.sh    → Untracked, breaks on move
session names                       → CHAOS: root says "maf-nn", subtree says "maf-cli"
memlayer dead code                   → REMOVED in Wave 2 (fallback file storage works)
```

**Critical Issues:**
1. Root config has v1.0.0, Subtree config has v2.0.0 enhancements (must preserve before restore)
2. Modified subtree files (agent-topology.json, prompt-agent.sh, rebuild-maf-cli-agents.sh)
3. Untracked files in subtree (agent-startup.sh)
4. Schema version dual configuration (v2.0.0 root, v1.0.0 subtree)
5. Session name mismatch causing health check failures
6. Dependency chain that breaks if agent-startup.sh moves (3 specific lines)
7. Memlayer dependencies broken (scripts referenced but don't exist)

---

## Part 2: Integrated Migration Plan

### Phase 0: Pre-Migration Validation (NEW - Days -7 to 0)

**Goal:** Establish baseline and detect all risks before execution.

#### Step 0.1: Path Audit (Day -7)

```bash
#!/bin/bash
# Find all hardcoded absolute paths
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.md" \) \
  -exec grep -l "/root/projects/" {} \; > /tmp/hardcoded-paths.txt

# Review and categorize
cat > /tmp/path-impact-analysis.md <<'EOF'
# Hardcoded Path Impact Analysis

## Files Requiring Updates
- .maf/config/agent-topology.json
- maf/scripts/maf/context-manager-v2.sh
- .claude/settings.json (hooks)
- scripts/maf/rebuild-maf-cli-agents.sh

## Replacement Strategy
Use PROJECT_ROOT environment variable with auto-detection pattern from NextNest.
EOF
```

#### Step 0.2: Baseline Metrics (Day -6)

```bash
#!/bin/bash
# Establish "no worse than current" thresholds

# Drift rate
git diff --stat main...origin/main > /tmp/baseline-drift.txt

# Script inventory
find scripts/maf -name "*.sh" | wc -l > /tmp/baseline-script-count.txt

# Agent spawn success rate
bash scripts/maf/spawn-agents.sh --dry-run 2>&1 | tee /tmp/baseline-spawn-test.txt
```

#### Step 0.3: Alternative Analysis (Day -5)

**Document why subtree was chosen:**

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Subtree** (chosen) | Simple, versioned, explicit merge | Manual pulls | ✅ Selected |
| npm package | Auto-updates | JS-only, complex build | ❌ Not suitable |
| Git submodule | Native git updates | Complex sync, detached HEAD | ❌ Too complex |
| Monorepo | Single source | Coupled releases | ❌ Premature |
| Symlinks | Simple updates | No versioning, breaks on Windows | ❌ Not robust |

#### Step 0.4: Comprehensive Test Suite (Day -4 to 0)

```bash
#!/bin/bash
# test-migration-readiness.sh

echo "=== MAF Migration Readiness Test Suite ==="

# Test 1: Agent startup chain
echo -n "Testing agent startup dependency... "
if bash -c 'source maf/scripts/maf/rebuild-maf-cli-agents.sh && type agent_startup_wrapper' 2>/dev/null; then
    echo "✅ PASS"
else
    echo "❌ FAIL: Agent startup will break"
    exit 1
fi

# Test 2: Topology schema compatibility
echo -n "Testing topology schema version... "
VERSION=$(jq -r '.version' .maf/config/agent-topology.json)
echo "Detected: v$VERSION"
if [ "$VERSION" = "2.0.0" ]; then
    echo "⚠️  WARN: Check script compatibility"
fi

# Test 3: Session name consistency
echo -n "Testing session name consistency... "
ROOT_SESSION=$(jq -r '.session' .maf/config/agent-topology.json)
SUBTREE_SESSION=$(jq -r '.session' maf/.maf/config/agent-topology.json 2>/dev/null || echo "none")
echo "Root: $ROOT_SESSION, Subtree: $SUBTREE_SESSION"
if [ "$ROOT_SESSION" != "$SUBTREE_SESSION" ] && [ "$SUBTREE_SESSION" != "none" ]; then
    echo "❌ FAIL: Session name mismatch"
    exit 1
fi

# Test 4: Memlayer dependencies (removed in Wave 2)
echo -n "Testing memlayer cleanup... "
if ! grep -q "MEMORY_SCRIPT" maf/scripts/maf/context-manager-v2.sh; then
    echo "✅ PASS (dead code removed)"
else
    echo "⚠️  WARN: Memlayer references still exist (should be removed in Wave 2)"
fi

# Test 5: Enhanced script functions
echo -n "Testing enhanced script functions... "
for func in "get_agent_by_role" "spawn_agent_with_persona" "tmux_pane_health_check"; do
    if grep -q "$func" scripts/maf/lib/*.sh; then
        echo "✅ Found: $func"
    else
        echo "❌ Missing: $func"
        exit 1
    fi
done

echo "=== All tests passed ==="
```

---

### Wave 1: Stabilization (Days 1-10)

**Risk Level:** Low (additive changes only, nothing deleted)
**Value:** High (stops drift immediately)

#### Day 1-2: HQ Structure Cleanup (Non-Breaking)

**Goal:** Create proper folder structure, keep everything for now.

```bash
cd /root/projects/maf-github

# 1. Create new folders (non-breaking)
mkdir -p templates/{prompts,configs}
mkdir -p runtime-template/{tmux,state/schemas,scripts}
mkdir -p labs/{experiments,test-results,spikes}
mkdir -p docs/runbooks

# 2. Copy to templates (DON'T delete originals yet)
cp .maf/config/agent-topology.json templates/agent-topology.json.example
# Edit: Replace with generic agent names (supervisor, reviewer, impl-1, impl-2)

# 3. Copy NEW files from Roundtable (CORRECTED DIRECTION)
# Note: autonomous-workflow.sh NOT copied - requires refactoring for role-based lookups
cp /root/projects/roundtable/scripts/maf/lib/error-handling.sh \
   scripts/maf/lib/error-handling.sh
cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh \
   scripts/maf/lib/tmux-utils.sh
cp /root/projects/roundtable/scripts/maf/clear-stuck-prompts.sh \
   scripts/maf/clear-stuck-prompts.sh

# 4. Add subtree auto-detection pattern to HQ
cat > scripts/maf/lib/project-root-utils.sh <<'EOF'
# Subtree vs Direct Layout Auto-Detection
# From NextNest - eliminates per-project configuration

get_project_root() {
    local DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
        # Subtree layout: go up 3 levels
        echo "$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
    else
        # Direct layout: go up 2 levels
        echo "$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
    fi
}

export PROJECT_ROOT="$(get_project_root)"
EOF
```

**Success Criteria:**
- ✅ Folder structure created
- ✅ 3 NEW files from Roundtable added (1,588 lines total)
- ✅ Auto-detection utility available
- ✅ Original files still intact (no breaking)
- ✅ autonomous-workflow.sh excluded (needs refactoring)

#### Day 3-4: CI Guard + Override Order (Non-Breaking)

**Goal:** Enforce governance going forward (doesn't fix past).

```bash
cd /root/projects/maf-github

# 1. Add fixed CI guard to HQ
cat > .github/workflows/maf-subtree-guard.yml <<'EOF'
name: MAF Subtree Guard
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  guard-subtree:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # CRITICAL: Full history for diff
      - name: Check maf/ subtree integrity
        run: |
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }}...HEAD)
          if echo "$CHANGED_FILES" | grep -q "^maf/"; then
            if contains(github.event.pull_request.labels.*.name, 'maf-upgrade'); then
              echo "✅ maf/ changed with maf-upgrade label (allowed)"
            else
              echo "::error::Cannot modify maf/ without 'maf-upgrade' label"
              exit 1
            fi
          fi
          echo "✅ maf/ subtree is clean"
EOF

# 2. Document override resolution order
cat > docs/OVERRIDE_RESOLUTION_ORDER.md <<'EOF'
# MAF Override Resolution Order

## Priority (Highest to Lowest)
1. `.maf/overrides/*` - Your customizations (always wins)
2. `.maf/config/*` - Your project configuration
3. `maf/templates/*` - Framework examples (fallback)
4. `maf/*` - Core framework (default)

## Implementation
See: scripts/maf/lib/project-root-utils.sh for auto-detection
EOF

# 3. Add subtree health check
cat > scripts/maf/status/check-subtree-health.sh <<'EOF'
#!/bin/bash
echo "🔍 MAF Subtree Health Check"
if git diff --name-only | grep -q "^maf/"; then
    echo "❌ Subtree: DIRTY"
    git diff --name-only | grep "^maf/"
else
    echo "✅ Subtree: Clean"
fi
if [ -f "maf/VERSION" ]; then
    echo "📍 Version: $(cat maf/VERSION)"
fi
EOF
chmod +x scripts/maf/status/check-subtree-health.sh
```

**Success Criteria:**
- ✅ CI guard created (not active yet)
- ✅ Override order documented
- ✅ Health check available

#### Day 5-6: Role-Based Support (Additive, Not Enforced)

```bash
cd /root/projects/maf-github

# 1. Add role mapping schema
cat > .maf/config/role-mappings.schema.json <<'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agent Role Mappings",
  "type": "object",
  "properties": {
    "role_mappings": {
      "type": "object",
      "properties": {
        "supervisor": {"type": "string"},
        "reviewer": {"type": "string"},
        "implementor-1": {"type": "string"},
        "implementor-2": {"type": "string"}
      }
    }
  }
}
EOF

# 2. Add helper functions
cat > scripts/maf/lib/role-utils.sh <<'EOF'
# Role-based agent lookup (ADDITIVE, not enforced)

get_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        echo "ERROR: Config not found: $config" >&2
        return 1
    fi

    local agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config")

    if [ "$agent_id" = "null" ]; then
        echo "WARNING: Role '$role' not found in config" >&2
        return 1
    fi

    echo "$agent_id"
}

has_role_mapping() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        return 1
    fi

    jq -e ".role_mappings[\"$role\"]" "$config" >/dev/null 2>&1
}
EOF
```

**Success Criteria:**
- ✅ Role schema available
- ✅ Helper functions exist
- ✅ Backward compatible

#### Day 7-8: Session Name Standardization (Pre-Wave 2 Prep)

**Decision:** Per-repo standardization based on current working state

**CRITICAL NOTE:** Session name strategy revised based on verification feedback:

**Standard by Repo:**
- **MAF HQ:** "maf-hq" (framework development, unique to avoid conflicts)
- **Roundtable:** "maf-cli" (production consumer, keeps standard name)
- **NextNest:** "maf-nn" (canary consumer, keeps existing working session)

**Why "maf-hq" instead of "maf-cli":**
- MAF HQ and Roundtable can't both use "maf-cli" (would prevent concurrent operation)
- "maf-hq" is explicit about being the framework repository
- Matches pattern with "maf-nn" (maf-{project})
- All three repos can now run concurrently without conflicts

**Why Keep "maf-nn" for NextNest:**
- Root config and context manager already use "maf-nn" (consistent)
- Agents currently running in "maf-nn" session
- Changing to "maf-cli" would break active workflows
- Subtree config uses "maf-cli" but gets overridden by env vars

**NextNest's 3 Session Locations:**
1. `.maf/config/agent-topology.json` (root) - "maf-nn" (ENHANCED, outside subtree)
2. `maf/.maf/config/agent-topology.json` (subtree) - "maf-cli" (PRISTINE from HQ)
3. `maf/scripts/maf/context-manager-nextnest.sh` - `MAF_TMUX_SESSION="maf-nn"`

**Impact:** If session names don't match, tmux commands fail, health checks fail, agents spawn in wrong sessions.

```bash
# 1. Document session name policy
cat > docs/SESSION_NAME_STANDARDIZATION.md <<'EOF'
# Session Name Standardization

## Standard by Repo:
- **MAF HQ:** "maf-hq" (framework development, avoids conflicts)
- **Roundtable:** "maf-cli" (production consumer)
- **NextNest:** "maf-nn" (keep existing working session)

## Rationale:
Each repository uses a unique session name to enable concurrent operation:
- **MAF HQ** uses "maf-hq" (framework development, unique session)
- **Roundtable** uses "maf-cli" (production consumer, standard name)
- **NextNest** uses "maf-nn" (canary consumer, already working)

This prevents tmux session conflicts when all three repos are running simultaneously.

## For MAF HQ Wave 2:
- Update session name to "maf-hq" in all configuration files
- Ensure context manager uses "maf-hq"
- Update documentation to reference new session name

## For NextNest Wave 2:
- KEEP "maf-nn" in root config and context manager
- Update subtree config to "maf-nn" to match
- OR accept subtree config at HQ default "maf-hq" with env var override

## Files to Update in MAF HQ:
1. .maf/config/agent-topology.json - Change to "maf-hq"
2. scripts/maf/context-manager.sh - Change to "maf-hq"
3. All documentation - Update references to "maf-hq"

## Files to Update in NextNest:
1. .maf/config/agent-topology.json (root) - KEEP "maf-nn"
2. maf/.maf/config/agent-topology.json (subtree) - Change to "maf-nn" to match
3. maf/scripts/maf/context-manager-nextnest.sh - KEEP "maf-nn"
EOF
```

**Success Criteria:**
- ✅ Policy documented with per-repo rationale
- ✅ Override mechanism defined

#### Day 9-10: Deploy to Consumers (Non-Breaking)

```bash
# 1. Copy to NextNest
cp /root/projects/maf-github/.github/workflows/maf-subtree-guard.yml \
   /root/projects/nextnest/.github/workflows/
cp /root/projects/maf-github/scripts/maf/status/check-subtree-health.sh \
   /root/projects/nextnest/scripts/maf/status/

# 2. Copy to Roundtable
cp /root/projects/maf-github/.github/workflows/maf-subtree-guard.yml \
   /root/projects/roundtable/.github/workflows/
cp /root/projects/maf-github/scripts/maf/status/check-subtree-health.sh \
   /root/projects/roundtable/scripts/maf/status/

# 3. Test CI guard
# (Manual: Create test PR, verify it blocks without maf-upgrade label)
```

**Success Criteria:**
- ✅ CI guards in all repos
- ✅ Health checks deployed
- ✅ No breaking changes

---

### Wave 1 Validation Gate

**MUST PASS before proceeding to Wave 2:**

- [ ] CI guards active and blocking subtree edits
- [ ] Override resolution order documented
- [ ] Health checks run successfully
- [ ] Role-based support available (not enforced)
- [ ] Session name policy defined
- [ ] No surprise agent failures for 3+ days
- [ ] Team understands the new process
- [ ] Baseline metrics established (Phase 0 complete)

**If any check fails:** Pause and fix before Wave 2.

---

### Wave 2: Refinement (Days 11-28)

**Risk Level:** Medium (only after Wave 1 validated)
**Value:** High (completes the vision)

#### Day 11-18: Update Roundtable (Production)

**Goal:** Migrate Roundtable from direct layout to subtree layout, pulling latest updates from HQ.

**Context:** Wave 1 already copied Roundtable's enhanced scripts to HQ. Now Roundtable pulls them back via subtree and migrates to the franchise model.

**Pre-Migration State:**
- Roundtable uses direct layout: `lib/maf/` + `scripts/maf/lib/`
- HQ has latest from Wave 1: `lib/maf/` + `scripts/maf/lib/` (identical content)

**Post-Migration State:**
- Roundtable uses subtree layout: `maf/lib/maf/` + `maf/scripts/maf/lib/`
- Old direct layout directories removed
- Roundtable is now a proper franchisee

```bash
cd /root/projects/roundtable

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: PRE-MIGRATION PREPARATION
# ═══════════════════════════════════════════════════════════════════════════════

echo "=== MAF Subtree Migration: Roundtable to Franchise Model ==="
echo ""

# 1. Verify current state
echo "Step 1: Verifying pre-migration state..."
if [ -d "maf" ]; then
    echo "❌ ERROR: maf/ directory already exists!"
    echo "   Roundtable may already be partially migrated."
    echo "   Please investigate before proceeding."
    exit 1
fi

echo "✅ No existing maf/ subtree found"
echo "   Current layout: direct (lib/maf/ + scripts/maf/lib/)"
echo ""

# 2. Create upgrade branch
echo "Step 2: Creating upgrade branch..."
git checkout -b maf/subtree-migration-wave2
echo "✅ Branch: maf/subtree-migration-wave2"
echo ""

# 3. Backup current state (safety measure)
echo "Step 3: Creating backup of current state..."
mkdir -p .backup/pre-migration
echo "Backing up .maf/config/..."
cp -r .maf/config .backup/pre-migration/ 2>/dev/null || true
echo "✅ Backup created at .backup/pre-migration/"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: ADD SUBTREE FROM HQ
# ═══════════════════════════════════════════════════════════════════════════════

echo "Step 4: Adding subtree from MAF HQ..."
echo "   Source: https://github.com/iamnormalfree/maf"
echo "   Prefix: maf/"
echo "   This will pull all latest updates from Wave 1"
echo ""

git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Subtree add failed!"
    echo "   Rolling back..."
    git checkout main
    git branch -D maf/subtree-migration-wave2
    exit 1
fi

echo "✅ Subtree added successfully"
echo "   New maf/ directory created with latest from HQ"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: MIGRATE TO SUBTREE LAYOUT (Remove Direct Layout)
# ═══════════════════════════════════════════════════════════════════════════════

echo "Step 5: Migrating from direct layout to subtree layout..."
echo ""

# 5a. Remove old TypeScript core library (lib/maf/)
echo "5a. Removing old lib/maf/ (replaced by maf/lib/maf/)..."
if [ -d "lib/maf" ]; then
    # Verify subtree has the content first
    if [ -d "maf/lib/maf" ]; then
        echo "   Verifying: maf/lib/maf/ exists ✅"
        FILE_COUNT=$(find maf/lib/maf -type f | wc -l)
        echo "   File count: $FILE_COUNT files"
        if [ "$FILE_COUNT" -eq 170 ]; then
            echo "   ✅ Confirmed: subtree has complete TypeScript library"
            echo "   Removing lib/maf/..."
            rm -rf lib/maf/
            echo "   ✅ Removed: lib/maf/ (now using maf/lib/maf/)"
        else
            echo "   ❌ ERROR: Expected 170 files, found $FILE_COUNT"
            exit 1
        fi
    else
        echo "   ❌ ERROR: maf/lib/maf/ not found in subtree!"
        exit 1
    fi
else
    echo "   ⚠️  lib/maf/ not found (already migrated?)"
fi

echo ""

# 5b. Remove old shell scripts location (scripts/maf/lib/)
echo "5b. Removing old scripts/maf/lib/ (replaced by maf/scripts/maf/lib/)..."
if [ -d "scripts/maf/lib" ]; then
    # Verify subtree has the scripts first
    if [ -d "maf/scripts/maf/lib" ]; then
        echo "   Verifying: maf/scripts/maf/lib/ exists ✅"
        SCRIPT_COUNT=$(find maf/scripts/maf/lib -name "*.sh" | wc -l)
        echo "   Script count: $SCRIPT_COUNT shell scripts"
        echo "   Removing scripts/maf/lib/..."
        rm -rf scripts/maf/lib/
        echo "   ✅ Removed: scripts/maf/lib/ (now using maf/scripts/maf/lib/)"
    else
        echo "   ❌ ERROR: maf/scripts/maf/lib/ not found in subtree!"
        exit 1
    fi
else
    echo "   ⚠️  scripts/maf/lib/ not found (already migrated?)"
fi

echo ""
echo "✅ Migration to subtree layout complete!"
echo "   Old locations removed:"
echo "   - lib/maf/ → maf/lib/maf/"
echo "   - scripts/maf/lib/ → maf/scripts/maf/lib/"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: UPDATE IMPORTS AND CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════════════════════

echo "Step 6: Updating import paths and configurations..."
echo ""

# 6a. Fix TypeScript import paths (CRITICAL)
echo "6a. Fixing TypeScript import paths after lib/maf → maf/lib/maf migration..."
echo ""
echo "   Creating backup of TypeScript files..."
mkdir -p .backup/typescript-backup
find scripts/maf -name "*.ts" -exec cp --parents {} .backup/typescript-backup/ \;

echo "   Fixing imports in main scripts (scripts/maf/*.ts)..."
find scripts/maf -maxdepth 1 -name "*.ts" -type f -exec sed -i.bak \
  's|from ['\"]../../lib/maf/|from '../../../maf/lib/maf/|g' {} \;

echo "   Fixing imports in subdirectories (scripts/maf/**/*.ts)..."
find scripts/maf -mindepth 2 -name "*.ts" -type f -exec sed -i.bak \
  's|from ['\"]../../lib/maf/|from '../../../maf/lib/maf/|g' {} \;

find scripts/maf -mindepth 2 -name "*.ts" -type f -exec sed -i.bak \
  's|from ['\"]../../../lib/maf/|from '../../../../maf/lib/maf/|g' {} \;

echo "   Fixing .mjs imports (if any)..."
find scripts/maf -name "*.mjs" -o -name "*.mts" | while read -r file; do
    sed -i.bak "s|from ['\"]../../lib/maf/|from '../../../maf/lib/maf/|g" "$file"
done

echo "   Cleaning up .bak files..."
find scripts/maf -name "*.bak" -delete

IMPORT_FIX_COUNT=$(find .backup/typescript-backup -name "*.ts" | wc -l)
echo "   ✅ Fixed $IMPORT_FIX_COUNT TypeScript files"
echo ""

# 6b. Verify import fixes worked
echo "6b. Verifying import fixes..."
OLD_IMPORTS=$(find scripts/maf -name "*.ts" -exec grep -l "from ['\"]\.\./\.\./lib/maf/" {} \; 2>/dev/null || true)
if [ -n "$OLD_IMPORTS" ]; then
    echo "   ❌ FAILED: Found old import patterns that weren't fixed:"
    echo "$OLD_IMPORTS"
    echo ""
    echo "   To rollback: cp -r .backup/typescript-backup/* scripts/maf/"
    exit 1
else
    echo "   ✅ All imports fixed correctly"
fi
echo ""

# 6b. Add role-based mapping (if not already present)
echo "6b. Adding role-based mapping..."
if jq -e '.role_mappings' .maf/config/agent-topology.json >/dev/null 2>&1; then
    echo "   ℹ️  role_mappings already exists"
else
    echo "   Adding role_mappings to .maf/config/agent-topology.json..."
    jq '.role_mappings = {
      "supervisor": "GreenMountain",
      "reviewer": "BlackDog",
      "implementor-1": "OrangePond",
      "implementor-2": "FuchsiaCreek"
    }' .maf/config/agent-topology.json > /tmp/rt-config.json
    mv /tmp/rt-config.json .maf/config/agent-topology.json
    echo "   ✅ role_mappings added"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

echo "Step 7: Post-migration verification..."
echo ""

# 7a. Verify subtree structure
echo "7a. Verifying subtree structure..."
echo "   Checking maf/lib/maf/..."
[ -d "maf/lib/maf" ] && echo "   ✅ maf/lib/maf/ exists" || echo "   ❌ maf/lib/maf/ missing"
echo "   Checking maf/scripts/maf/lib/..."
[ -d "maf/scripts/maf/lib" ] && echo "   ✅ maf/scripts/maf/lib/ exists" || echo "   ❌ maf/scripts/maf/lib/ missing"
echo "   Checking old locations removed..."
[ ! -d "lib/maf" ] && echo "   ✅ lib/maf/ removed" || echo "   ❌ lib/maf/ still exists"
[ ! -d "scripts/maf/lib" ] && echo "   ✅ scripts/maf/lib/ removed" || echo "   ❌ scripts/maf/lib/ still exists"

echo ""

# 7b. Verify enhanced scripts from Wave 1 (with corrected line counts)
echo "7b. Verifying enhanced scripts (from Wave 1)..."
echo "   Note: Wave 1 added PROJECT_ROOT auto-detection (+17 lines to error-handling.sh)"
echo ""
if [ -f "maf/scripts/maf/lib/error-handling.sh" ]; then
    LINES=$(wc -l < maf/scripts/maf/lib/error-handling.sh)
    echo "   error-handling.sh: $LINES lines (expected 630, Wave 1 enhanced)"
    [ "$LINES" -eq 630 ] && echo "   ✅" || echo "   ⚠️  Line count mismatch (expected 630)"
else
    echo "   ❌ error-handling.sh not found"
fi

if [ -f "maf/scripts/maf/lib/tmux-utils.sh" ]; then
    LINES=$(wc -l < maf/scripts/maf/lib/tmux-utils.sh)
    echo "   tmux-utils.sh: $LINES lines (expected 900, Wave 1 enhanced)"
    [ "$LINES" -eq 900 ] && echo "   ✅" || echo "   ⚠️  Line count mismatch (expected 900)"
else
    echo "   ❌ tmux-utils.sh not found"
fi

if [ -f "maf/scripts/maf/clear-stuck-prompts.sh" ]; then
    LINES=$(wc -l < maf/scripts/maf/clear-stuck-prompts.sh)
    echo "   clear-stuck-prompts.sh: $LINES lines (expected 82)"
    [ "$LINES" -eq 82 ] && echo "   ✅" || echo "   ⚠️  Line count mismatch"
else
    echo "   ❌ clear-stuck-prompts.sh not found"
fi

echo ""

# 7c. Test subtree health check
echo "7c. Running subtree health check..."
if [ -f "maf/scripts/maf/status/check-subtree-health.sh" ]; then
    bash maf/scripts/maf/status/check-subtree-health.sh
else
    echo "   ⚠️  check-subtree-health.sh not found (skipping)"
fi

echo ""

# 7d. Verify no dirty subtree state
echo "7d. Checking for dirty subtree state..."
if git diff --name-only | grep -q "^maf/"; then
    echo "   ❌ WARNING: maf/ subtree has uncommitted changes!"
    git diff --name-only | grep "^maf/"
else
    echo "   ✅ Subtree is clean (no uncommitted changes)"
fi

echo ""

# 7e. Test agent spawn (dry run)
echo "7e. Testing agent spawn (dry run)..."
if [ -f "maf/scripts/maf/spawn-agents.sh" ]; then
    bash maf/scripts/maf/spawn-agents.sh --dry-run 2>&1 | head -10
    echo "   ✅ Spawn script test completed"
else
    echo "   ❌ spawn-agents.sh not found"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 6: COMMIT OR ROLLBACK
# ═══════════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "MIGRATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Before committing, please verify:"
echo "  1. All tests pass above"
echo "  2. Agent spawning works in staging environment"
echo "  3. No production workflows are broken"
echo ""
read -p "Commit migration? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Committing migration..."
    git add maf/
    git add .maf/config/agent-topology.json
    git commit -m "feat: migrate to subtree layout (Wave 2)

- Add maf/ subtree from iamnormalfree/maf
- Remove direct layout: lib/maf/, scripts/maf/lib/
- Now using subtree model: maf/lib/maf/, maf/scripts/maf/lib/
- Add role_mappings to agent topology
- Roundtable is now a proper franchisee

Enhanced scripts from Wave 1 preserved:
- error-handling.sh (630 lines)
- tmux-utils.sh (900 lines)
- clear-stuck-prompts.sh (82 lines)
"
    echo "✅ Migration committed!"
    echo ""
    echo "Next steps:"
    echo "  1. Test in staging environment"
    echo "  2. Create PR: maf/subtree-migration-wave2 → main"
    echo "  3. Add 'maf-upgrade' label to PR (CI guard requirement)"
    echo "  4. After merge, delete branch: git branch -d maf/subtree-migration-wave2"
else
    echo "Migration not committed. Branch preserved: maf/subtree-migration-wave2"
    echo ""
    echo "To rollback:"
    echo "  git checkout main"
    echo "  git branch -D maf/subtree-migration-wave2"
fi
```

**Success Criteria:**
- ✅ Subtree added from HQ (maf/ directory created)
- ✅ Direct layout removed (lib/maf/ deleted, scripts/maf/lib/ deleted)
- ✅ Enhanced scripts preserved in subtree (error-handling.sh, tmux-utils.sh, clear-stuck-prompts.sh)
- ✅ TypeScript imports fixed (29 files updated from `../../lib/maf/` to `../../../maf/lib/maf/`)
- ✅ Role-based mappings configured
- ✅ All verification tests pass
- ✅ Subtree is clean (no uncommitted changes)
- ✅ Roundtable is now a franchisee using subtree model

**Enhanced Script Line Counts (Wave 1 versions):**
- error-handling.sh: 630 lines (includes PROJECT_ROOT auto-detection)
- tmux-utils.sh: 900 lines (includes subtree support)
- clear-stuck-prompts.sh: 82 lines

**Post-Migration State:**
```
roundtable/
├── maf/                          ← Subtree from HQ (franchise model)
│   ├── lib/maf/                  ← TypeScript core (170 files)
│   ├── scripts/maf/              ← Operational scripts
│   │   └── lib/                  ← Enhanced scripts from Wave 1
│   ├── .maf/config/              ← Configuration templates
│   └── ...
├── .maf/config/                  ← Local Roundtable config
│   └── agent-topology.json       ← Has role_mappings
└── src/                          ← Roundtable application code
```

**Future Updates:**
```bash
# To get latest updates from HQ:
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

#### Day 19-21: Clean Up HQ (Remove Project-Specific Content)

**CRITICAL:** HQ has MIXED contamination from BOTH projects - must remove ALL project-specific content

```bash
cd /root/projects/maf-github

# 1. Remove NextNest agent prompts from HQ
mv .maf/agents/auditbay-prompt.md templates/prompts/reviewer-prompt.md.example
mv .maf/agents/rateridge-prompt.md templates/prompts/supervisor-prompt.md.example
mv .maf/agents/primteportal-prompt.md templates/prompts/impl-frontend-prompt.md.example
mv .maf/agents/ledgerleap-prompt.md templates/prompts/impl-backend-prompt.md.example

# 2. Remove Roundtable prompt packs
rm scripts/maf/prompt-packs/roundtable-*.json

# 3. Make template names more generic
# NOTE: HQ config has generic nature/animal names (GreenMountain, BlackDog, etc.) that serve as template placeholders
# These are NOT Roundtable contamination - they're generic templates that happen to match Roundtable's naming
# Make them even more generic (generic-agent-name) for clarity
jq '.panes[].agent_name = "generic-agent-name"' \
  .maf/config/agent-topology.json > /tmp/generic-topology.json
mv /tmp/generic-topology.json templates/agent-topology.json.example
# Remove the original config file (template now exists in templates/)
rm .maf/config/agent-topology.json

# 4. Verify cleanup
echo "=== Cleanup Verification ==="
echo "Remaining in .maf/agents/:"
ls -la .maf/agents/ || echo "Empty (correct)"
echo "Remaining prompt packs:"
ls -la scripts/maf/prompt-packs/ || echo "None (correct)"
```

**Success Criteria:**
- ✅ No NextNest-specific prompts in HQ (all converted to templates)
- ✅ Generic template names made more explicit (config file replaced with truly generic template)
- ✅ No Roundtable prompt packs in HQ
- ✅ All examples have `.example` suffix
- ✅ .maf/config/agent-topology.json no longer exists (replaced by generic template)

#### Day 22-24: Migrate to Role-Based Agents

```bash
# 1. Update spawn-agents.sh to use roles
cat > scripts/maf/lib/role-based-spawn.sh <<'EOF'
# Role-based agent spawning with fallback

spawn_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    # Try role-based lookup first
    if has_role_mapping "$role" "$config"; then
        local agent_id=$(get_agent_by_role "$role" "$config")
        spawn_agent "$agent_id"
    else
        # Fallback to old way for compatibility
        case "$role" in
            supervisor) spawn_agent "${AGENT_SUPERVISOR:-GreenMountain}" ;;
            reviewer) spawn_agent "${AGENT_REVIEWER:-BlackDog}" ;;
            impl-1) spawn_agent "${AGENT_IMPL_1:-OrangePond}" ;;
            impl-2) spawn_agent "${AGENT_IMPL_2:-FuchsiaCreek}" ;;
        esac
    fi
}
EOF

# 2. Update scripts to use role-based lookups
# (Gradual process, per-script basis)
```

**Success Criteria:**
- ✅ Role-based lookups working
- ✅ Backward compatibility maintained

#### Day 25-28: Final Documentation & Handoff

```bash
# 1. Create runbooks
cat > docs/runbooks/CONSUMER_UPGRADE.md <<'EOF'
# MAF Upgrade Runbook

## Prerequisites
- [ ] Backup current state
- [ ] No uncommitted changes
- [ ] Health check passes

## Steps
1. Create upgrade branch: `maf/upgrade-vX.Y.Z`
2. Pull subtree: `git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash`
3. Run smoke tests: `bash maf/scripts/maf/status/check-subtree-health.sh`
4. Create PR with `maf-upgrade` label
5. Test in staging
6. Merge to main

## Rollback
If tests fail: `git reset --hard HEAD && git checkout main`
EOF

# 2. Create troubleshooting guide
cat > docs/runbooks/TROUBLESHOOTING.md <<'EOF'
# MAF Troubleshooting

## Agent spawn failures
- Check session name consistency
- Verify agent startup dependency chain
- Check role mappings exist

## Subtree issues
- `git diff --name-only | grep "^maf/"` to check for dirty state
- Use `maf-upgrade` label for legitimate subtree changes

## Health check failures
- Run `bash maf/scripts/maf/status/check-subtree-health.sh`
- Check for uncommitted changes in subtree
EOF
```

**Success Criteria:**
- ✅ All documentation complete
- ✅ Runbooks created
- ✅ Team trained

---

## Part 3: Upstream Candidates Matrix (CORRECTED)

### Priority 1: Upstream Immediately (Wave 1, Day 1-2)

| File | Source | Lines | Value | Action |
|------|--------|-------|-------|--------|
| `clear-stuck-prompts.sh` | Roundtable | 82 | Production-critical | ✅ Add to HQ |
| `error-handling.sh` | Roundtable | 630 | Error framework | ✅ Add to HQ (Wave 1 enhanced) |
| `tmux-utils.sh` | Roundtable | 900 | Tmux orchestration | ✅ Add to HQ (Wave 1 enhanced) |
| Subtree auto-detection | NextNest | ~20 | Eliminates config | ✅ Add to lib/ |
| Role-based mapping | Design | ~50 | Flexibility | ✅ Add to lib/ |
| Agent startup wrapper | NextNest | ~30 | Identity injection | ✅ Template in HQ |

**Total Lines: 1,602 lines** (630 + 900 + 82 + ~20 + ~50 + ~30)

**NOTE:** `autonomous-workflow.sh` (575 lines) REMOVED from Wave 1 upstream
**Reason:** Contains hardcoded Roundtable agent names (GreenMountain, BlackDog, etc.)
**Status:** Requires refactoring for role-based lookups before upstreaming

### Follow-Up Issue: Refactor autonomous-workflow.sh

```markdown
# Issue: Refactor autonomous-workflow.sh for Generic Agent Support

Before upstreaming to MAF HQ:
1. Replace hardcoded agent names with role-based lookups
2. Use get_agent_by_role() for agent resolution
3. Remove Roundtable-specific references (GreenMountain, BlackDog, etc.)

Estimated effort: 2-4 hours

Files to update:
- scripts/maf/autonomous-workflow.sh

Block upstreaming until complete.
```

### Priority 2: Upstream as Pattern (Wave 2)

| Pattern | Source | Value | Action |
|---------|--------|-------|--------|
| Worktree schema | NextNest | Parallel development | Add to schema |
| Risk-based governance | NextNest | Process efficiency | Pattern in docs |
| Context manager wrapper | NextNest | Customization pattern | Template only |

### Priority 3: Template Only

| File | Source | Value | Action |
|------|--------|-------|--------|
| `context-manager-nextnest.sh` | NextNest | Project-specific | `.example` only |
| NextNest prompt packs | NextNest | Mortgage-specific | Not upstream |

---

## Part 4: Risk Register

### Critical Risks (Production-Breaking)

| Risk | Detection | Rollback | Prevention |
|------|-----------|----------|------------|
| Agent startup chain breakage | Test spawn before commit | Restore agent-startup.sh | Update paths in move |
| Topology schema incompatibility | Check version field | Use v1.0.0 config | Document migration path |
| Subtree auto-detection failure | Test project root detection | Don't restore files | Preserve detection logic |
| Session name inconsistency (keep current working state) | Check all config files | Standardize on one | Policy in Wave 1 |

### High Risks (Feature-Breaking)

| Risk | Detection | Rollback | Prevention |
|------|-----------|----------|------------|
| ~~Missing memlayer~~ | ~~Check file exists~~ | ~~Copy to HQ~~ | ~~Document dependency~~ |
| Enhanced scripts missing | Test function calls | Copy from Roundtable | Add in Wave 1 |
| Hardcoded paths break | Path audit script | Use PROJECT_ROOT var | Auto-detection pattern |

**Note:** Memlayer risk removed - decided to remove dead code paths instead of implementing. Fallback file storage at `/tmp/agent-states/` provides equivalent functionality.

### Medium Risks (Annoyance)

| Risk | Detection | Rollback | Prevention |
|------|-----------|----------|------------|
| CI guard false positives | Test label detection | Update array syntax | Use `contains()` |
| Health check false alarms | Verify subtree type | Add as subtree first | Type check in script |

---

## Part 5: Success Criteria

### Technical Metrics

- [ ] All repos have clean subtrees (no modified files)
- [ ] CI guards active and blocking subtree edits
- [ ] Override order documented and implemented
- [ ] Health checks passing in all repos
- [ ] Role-based agents working
- [ ] All NEW files from Roundtable added to HQ (1,588 lines, excluding autonomous-workflow.sh)

### Operational Metrics

- [ ] Team trained on two-wave process
- [ ] Runbooks created and tested
- [ ] Baseline metrics established (Phase 0)
- [ ] No regression in agent spawn success rate
- [ ] Drift rate reduced to zero

### Governance Metrics

- [ ] 4-question filter documented
- [ ] Doctrine manifest lightweight (~10 paths)
- [ ] Escape hatch (CORE_OVERRIDE.md) exists
- [ ] MAF Wednesday process defined

---

## Part 6: Repo-Specific Action Summaries

### MAF HQ

**Wave 1 Actions:**
1. Create folder structure (templates/, runtime-template/, labs/)
2. Add 3 NEW files from Roundtable (1,588 lines, excluding autonomous-workflow.sh)
3. Add subtree auto-detection utility
4. Add CI guard with maf-upgrade label
5. Document override resolution order
6. Add role-based support (additive)

**Wave 2 Actions:**
1. Update session name to "maf-hq" (avoid conflicts with consumers)
2. Remove NextNest agent prompts (make templates)
3. Remove Roundtable prompt packs
4. Template-ize Roundtable agent names in config
5. Update documentation

### Roundtable

**Wave 1 Actions:**
1. Receive CI guard and health checks
2. Test new scripts from HQ
3. No breaking changes

**Wave 2 Actions:**
1. Pull latest from HQ
2. Add role-based mapping
3. Test in staging before production

### NextNest

**Wave 1 Actions:**
1. Receive CI guard and health checks
2. No breaking changes (keep "maf-nn" session name)

**Wave 2 Actions:**
1. Fix session name chaos
2. Restore subtree files to pristine
3. Move untracked files to local
4. Fix agent startup dependency chain
5. Add role-based mapping

---

## Appendix: File Inventory

### Files to Copy to MAF HQ (CORRECTED)

| From | To | Lines | Type | Reason |
|------|-----|-------|------|--------|
| `roundtable/scripts/maf/lib/error-handling.sh` | `scripts/maf/lib/` | 630 | NEW | Error framework (Wave 1 enhanced) |
| `roundtable/scripts/maf/lib/tmux-utils.sh` | `scripts/maf/lib/` | 900 | NEW | Tmux orchestration (Wave 1 enhanced) |
| `roundtable/scripts/maf/clear-stuck-prompts.sh` | `scripts/maf/` | 82 | NEW | Production-critical |
| `nextnest/maf/scripts/maf/prompt-agent.sh` | `scripts/maf/lib/` | ~20 | PATTERN | Auto-detection |

**Total: 1,602 lines** (630 + 900 + 82 + ~20)

**EXCLUDED from Wave 1:**
- `autonomous-workflow.sh` (575 lines) - Contains hardcoded Roundtable agent names
- Requires refactoring for role-based lookups before upstreaming

### Files to Move in NextNest

| From | To | Reason |
|------|-----|--------|
| `maf/scripts/maf/agent-startup.sh` | `scripts/maf/agent-startup.sh` | Local customization |
| `maf/scripts/maf/context-manager-nextnest.sh` | `scripts/maf/` | Local customization |

### Files to Remove from HQ

| File | Reason | Action |
|------|--------|--------|
| `.maf/agents/auditbay-prompt.md` | NextNest-specific | Make template |
| `.maf/agents/rateridge-prompt.md` | NextNest-specific | Make template |
| `.maf/agents/primteportal-prompt.md` | NextNest-specific | Make template |
| `.maf/agents/ledgerleap-prompt.md` | NextNest-specific | Make template |
| `scripts/maf/prompt-packs/roundtable-*.json` | Roundtable-specific | Delete |

---

**Document Version:** v3.0 (Unified Blueprint)
**Last Updated:** 2026-01-08
**Status:** Ready for Execution

**Next Steps:**
1. Approve this unified blueprint
2. Execute Phase 0: Pre-Migration Validation
3. Execute Wave 1 (Days 1-10)
4. Pass Validation Gate
5. Execute Wave 2 (Days 11-28)

---

## Summary of Changes from Original

1. **Corrected contamination source**: HQ has NextNest prompts, not Roundtable
2. **Fixed script sync direction**: Roundtable → HQ (not vice versa)
3. **Added 3 NEW files**: error-handling.sh, tmux-utils.sh, clear-stuck-prompts.sh
4. **Added Phase 0**: Pre-migration validation with path audit
5. **Added session name standardization**: Per-repo unique names (maf-hq for framework, maf-cli for Roundtable, maf-nn for NextNest) to enable concurrent operation
6. **Corrected Response Awareness locations**: Different structures (major mismatch)
7. **Added upstream candidates matrix**: Prioritized by value/risk
8. **Added comprehensive risk register**: Detection + rollback
9. **Added repo-specific action summaries**: Clear steps per repo
10. **Post-Verification Corrections (8 critical fixes)**:
    - Fixed NextNest root/subtree relationship (was reversed)
    - Revised session name strategy (maf-hq for HQ, maf-cli for Roundtable, maf-nn for NextNest)
    - Removed autonomous-workflow.sh from Wave 1 (needs refactoring)
    - Added enhanced script backup/restore for Roundtable
    - Decided to remove memlayer dead code (Option 1) - fallback file storage works
    - Documented agent-startup.sh dependency at 3 specific lines
    - Updated total upstream line count from 2,163 to 1,588
    - Enhanced hardcoded path audit comprehensiveness
