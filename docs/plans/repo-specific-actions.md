# Repo-Specific Action Plans

**Generated:** 2026-01-08
**Source:** Unified Blueprint v3.0
**Complexity:** Each repo has unique requirements

---

## MAF HQ (`/root/projects/maf-github`)

**Role:** Franchisor - maintain core framework
**Risk Level:** Medium (affects all consumers)
**Execution Order:** FIRST (before consumers)

---

### Phase 0: Pre-Migration Validation (Days -7 to 0)

#### Step 0.1: Path Audit
```bash
cd /root/projects/maf-github

# Find all hardcoded paths
find . -type f \( -name "*.json" -o -name "*.sh" -o -name "*.md" \) \
  -exec grep -l "/root/projects/" {} \; > /tmp/hq-hardcoded-paths.txt

# Review results
cat /tmp/hq-hardcoded-paths.txt | while read file; do
    echo "=== $file ==="
    grep "/root/projects/" "$file"
done
```

**Expected Results:**
- `.maf/config/agent-topology.json` - Session name, paths
- `maf/scripts/maf/context-manager-v2.sh` - AGENT_MAIL_PROJECT path
- `.claude/settings.json` - Hooks with hardcoded paths
- `scripts/maf/rebuild-maf-cli-agents.sh` - Session name

#### Step 0.2: Baseline Metrics
```bash
# Script inventory
echo "=== HQ Script Count ==="
find scripts/maf -name "*.sh" | wc -l

# Expected: ~130 scripts
# Actual: ____

# Agent spawn test
echo "=== Agent Spawn Test ==="
bash scripts/maf/spawn-agents.sh --dry-run 2>&1 | tee /tmp/hq-baseline-spawn.txt
```

#### Step 0.3: File Inventory
```bash
# What's in .maf/agents/
echo "=== Agent Prompts in HQ ==="
ls -la .maf/agents/
# Expected: auditbay, rateridge, primteportal, ledgerleap (NextNest!)

# What's in .maf/config/
echo "=== Config Files ==="
ls -la .maf/config/
# Check for prompt packs
echo "=== Prompt Packs ==="
ls -la scripts/maf/prompt-packs/ | grep roundtable
```

**Expected Finding:** HQ has NextNest prompts, not Roundtable (major correction)

---

### Wave 1: Stabilization (Days 1-10)

#### Day 1-2: Structure + NEW Files from Roundtable

```bash
cd /root/projects/maf-github

# 1. Create folder structure
mkdir -p templates/{prompts,configs}
mkdir -p runtime-template/{tmux,state/schemas,scripts}
mkdir -p labs/{experiments,test-results,spikes}
mkdir -p docs/runbooks
mkdir -p scripts/maf/status

# 2. Copy NEW files from Roundtable (CORRECTED DIRECTION)
# Note: autonomous-workflow.sh NOT copied - requires refactoring for role-based lookups
echo "Copying error-handling.sh (613 lines)..."
cp /root/projects/roundtable/scripts/maf/lib/error-handling.sh \
   scripts/maf/lib/error-handling.sh

echo "Copying tmux-utils.sh (893 lines)..."
cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh \
   scripts/maf/lib/tmux-utils.sh

echo "Copying clear-stuck-prompts.sh (82 lines)..."
cp /root/projects/roundtable/scripts/maf/clear-stuck-prompts.sh \
   scripts/maf/clear-stuck-prompts.sh

# 3. Add subtree auto-detection (from NextNest)
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

# 4. Verify
echo "=== Verification ==="
echo "New files added:"
wc -l scripts/maf/lib/error-handling.sh
wc -l scripts/maf/lib/tmux-utils.sh
wc -l scripts/maf/clear-stuck-prompts.sh
echo "Total: 1,588 new lines (excluding autonomous-workflow.sh)"
```

**Success Criteria:**
- ✅ Folder structure created
- ✅ 1,588 lines of battle-tested code added (excluding autonomous-workflow.sh)
- ✅ Auto-detection utility available

#### Day 3-4: CI Guard + Health Check

```bash
cd /root/projects/maf-github

# 1. CI Guard
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
          fetch-depth: 0
      - name: Check maf/ subtree integrity
        run: |
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }}...HEAD)
          if echo "$CHANGED_FILES" | grep -q "^maf/"; then
            if contains(github.event.pull_request.labels.*.name, 'maf-upgrade'); then
              echo "✅ maf/ changed with maf-upgrade label"
            else
              echo "::error::Cannot modify maf/ without 'maf-upgrade' label"
              exit 1
            fi
          fi
          echo "✅ maf/ subtree is clean"
EOF

# 2. Health Check
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

# 3. Test
bash scripts/maf/status/check-subtree-health.sh
```

**Success Criteria:**
- ✅ CI guard created
- ✅ Health check executable

#### Day 5-6: Role-Based Support

```bash
cd /root/projects/maf-github

# 1. Role schema
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

# 2. Role utilities
cat > scripts/maf/lib/role-utils.sh <<'EOF'
get_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        echo "ERROR: Config not found: $config" >&2
        return 1
    fi

    local agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config")

    if [ "$agent_id" = "null" ]; then
        echo "WARNING: Role '$role' not found" >&2
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
- ✅ Role schema defined
- ✅ Helper functions available

#### Day 7-8: Session Name Standardization

```bash
cd /root/projects/maf-github

# Document policy
cat > docs/SESSION_NAME_STANDARDIZATION.md <<'EOF'
# Session Name Standardization

## Standard by Repo:
- **MAF HQ:** "maf-cli"
- **Roundtable:** "maf-cli"
- **NextNest:** "maf-nn" (keep existing working session)

## Rationale:
NextNest's v2.0.0 config (subtree) and context manager already use "maf-nn". Root config is v1.0.0 from HQ.
Changing would break active agent workflows. Current state works.

## For NextNest Wave 2:
- KEEP "maf-nn" in root config and context manager
- Update subtree config to "maf-nn" to match
- OR accept subtree config at HQ default "maf-cli" with env var override
EOF
```

#### Day 9-10: Deploy to Consumers

```bash
# Copy to NextNest
cp /root/projects/maf-github/.github/workflows/maf-subtree-guard.yml \
   /root/projects/nextnest/.github/workflows/
cp /root/projects/maf-github/scripts/maf/status/check-subtree-health.sh \
   /root/projects/nextnest/scripts/maf/status/

# Copy to Roundtable
cp /root/projects/maf-github/.github/workflows/maf-subtree-guard.yml \
   /root/projects/roundtable/.github/workflows/
cp /root/projects/maf-github/scripts/maf/status/check-subtree-health.sh \
   /root/projects/roundtable/scripts/maf/status/
```

---

### Wave 2: Refinement (Days 11-28)

#### Day 19-21: Clean Up HQ (Remove Project-Specific Content)

**CRITICAL CORRECTION:** Remove NextNest prompts (not Roundtable as originally claimed)

```bash
cd /root/projects/maf-github

# 1. Remove NextNest agent prompts (make templates)
echo "Moving NextNest prompts to templates..."
mv .maf/agents/auditbay-prompt.md \
   templates/prompts/reviewer-prompt.md.example
mv .maf/agents/rateridge-prompt.md \
   templates/prompts/supervisor-prompt.md.example
mv .maf/agents/primteportal-prompt.md \
   templates/prompts/impl-frontend-prompt.md.example
mv .maf/agents/ledgerleap-prompt.md \
   templates/prompts/impl-backend-prompt.md.example

# 2. Remove Roundtable prompt packs
echo "Removing Roundtable prompt packs..."
rm scripts/maf/prompt-packs/roundtable-*.json

# 3. Template-ize Roundtable agent names in config
echo "Templatizing agent-topology.json..."
jq '.panes[].agent_name = "generic-agent-name"' \
  .maf/config/agent-topology.json > /tmp/generic-topology.json
mv /tmp/generic-topology.json templates/agent-topology.json.example

# 4. Verify
echo "=== Cleanup Verification ==="
echo "Remaining in .maf/agents/:"
ls -la .maf/agents/ || echo "Empty (correct)"
echo "Remaining prompt packs:"
ls -la scripts/maf/prompt-packs/ || echo "None (correct)"
```

**Success Criteria:**
- ✅ No NextNest-specific prompts in HQ
- ✅ No Roundtable prompt packs in HQ
- ✅ All examples have `.example` suffix

#### Day 25-28: Final Documentation

```bash
# Create runbooks (see unified blueprint)
# Update VERSION file
echo "v0.3.0" > maf/VERSION
git add maf/VERSION
git commit -m "chore: bump version to v0.3.0"
```

---

## Roundtable (`/root/projects/roundtable`)

**Role:** Production - highest care required
**Risk Level:** CRITICAL (cannot break)
**Execution Order:** SECOND (after HQ)

---

### Phase 0: Pre-Migration Validation

```bash
cd /root/projects/roundtable

# Baseline metrics
echo "=== Roundtable Baseline ==="
echo "Script count:"
find scripts/maf -name "*.sh" | wc -l
# Expected: 132 (2 more than HQ)

echo "Unique scripts:"
comm -13 <(find /root/projects/maf-github/scripts/maf -name "*.sh" | sort) \
          <(find scripts/maf -name "*.sh" | sort)
# Expected: autonomous-workflow.sh, clear-stuck-prompts.sh

echo "Agent spawn test:"
bash scripts/maf/spawn-agents.sh --dry-run 2>&1 | tee /tmp/rt-baseline-spawn.txt
```

---

### Wave 1: Stabilization

```bash
cd /root/projects/roundtable

# Day 9-10: Receive from HQ
mkdir -p .github/workflows
mkdir -p scripts/maf/status

# CI Guard
cp /root/projects/maf-github/.github/workflows/maf-subtree-guard.yml \
   .github/workflows/

# Health Check
cp /root/projects/maf-github/scripts/maf/status/check-subtree-health.sh \
   scripts/maf/status/

# Test
bash scripts/maf/status/check-subtree-health.sh
```

**Success Criteria:**
- ✅ CI guard received
- ✅ Health check working
- ✅ NO breaking changes

---

### Wave 2: Refinement

```bash
cd /root/projects/roundtable

# Day 15-18: Pull latest from HQ
git checkout -b maf/upgrade-wave2

# CRITICAL: Backup enhanced scripts BEFORE subtree pull
# Wave 2 subtree pull could overwrite enhanced library scripts
mkdir -p scripts/maf/lib/.backup
mkdir -p scripts/maf/.backup

echo "Backing up enhanced library scripts..."
cp scripts/maf/lib/error-handling.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/tmux-utils.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/agent-utils.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/credential-manager.sh scripts/maf/lib/.backup/
cp scripts/maf/lib/profile-loader.sh scripts/maf/lib/.backup/

echo "Backing up production-critical scripts..."
cp scripts/maf/clear-stuck-prompts.sh scripts/maf/.backup/

# Pull subtree
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# CRITICAL: Restore enhanced versions immediately after pull
echo "Restoring enhanced library scripts..."
cp scripts/maf/lib/.backup/* scripts/maf/lib/
cp scripts/maf/.backup/clear-stuck-prompts.sh scripts/maf/

# Verify restoration worked
echo "Verifying enhanced scripts restored:"
wc -l scripts/maf/lib/error-handling.sh    # Should be 613
wc -l scripts/maf/lib/tmux-utils.sh        # Should be 893
wc -l scripts/maf/clear-stuck-prompts.sh   # Should be 82

# Add role-based mapping
jq '.role_mappings = {
  "supervisor": "GreenMountain",
  "reviewer": "BlackDog",
  "implementor-1": "OrangePond",
  "implementor-2": "FuchsiaCreek"
}' .maf/config/agent-topology.json > /tmp/rt-config.json
mv /tmp/rt-config.json .maf/config/agent-topology.json

# Test in staging (CRITICAL for production)
bash maf/scripts/maf/spawn-agents.sh --dry-run 2>&1 | tee /tmp/rt-spawn-test.txt
bash maf/scripts/maf/status/check-subtree-health.sh

# Verify all enhanced functions still work
echo "Testing enhanced script functions..."
for func in "get_agent_by_role" "tmux_pane_health_check" "error_handler"; do
    if grep -q "$func" scripts/maf/lib/*.sh; then
        echo "✅ Found: $func"
    else
        echo "❌ Missing: $func"
        exit 1
    fi
done

# Cleanup backups (only after successful tests)
rm -rf scripts/maf/lib/.backup
rm -rf scripts/maf/.backup

# Commit if tests pass
git add maf/
git commit -m "chore: upgrade MAF to v0.3.0 (Wave 2)"
```

**Success Criteria:**
- ✅ Subtree clean
- ✅ Enhanced scripts preserved (error-handling.sh, tmux-utils.sh, clear-stuck-prompts.sh)
- ✅ Role-based mappings configured
- ✅ Production agents work correctly
- ✅ All enhanced functions verified

---

## NextNest (`/root/projects/nextnest`)

**Role:** Canary - test migration first
**Risk Level:** Medium (non-production)
**Execution Order:** THIRD (test before Roundtable)

---

### Phase 0: Pre-Migration Validation

```bash
cd /root/projects/nextnest

# Critical issues to detect
echo "=== NextNest Pre-Migration Check ==="

# 1. Session name inconsistency (keep current working state)
echo "Session names:"
echo "  Root config (.maf/config/): $(jq -r '.session' .maf/config/agent-topology.json)"
echo "  Subtree config (maf/.maf/config/): $(jq -r '.session' maf/.maf/config/agent-topology.json)"
echo "  Context manager: $(grep MAF_TMUX_SESSION maf/scripts/maf/context-manager-nextnest.sh | cut -d= -f2 | tr -d '"')"
echo ""
echo "Expected state:"
echo "  Root config: maf-cli (v1.0.0, PRISTINE from HQ)"
echo "  Subtree config: maf-nn (v2.0.0, ENHANCED within subtree)"

# 2. Topology schema version
echo "Topology versions:"
echo "  Root: v$(jq -r '.version' .maf/config/agent-topology.json)"
echo "  Subtree: v$(jq -r '.version' maf/.maf/config/agent-topology.json)"

# 3. Modified subtree files
echo "Modified subtree files:"
git diff --name-only | grep "^maf/" || echo "None"

# 4. Untracked files in subtree
echo "Untracked files in subtree:"
find maf/ -type f -exec git status --short {} \; 2>/dev/null | grep "^??" || echo "None"
```

---

### Wave 1: Stabilization

```bash
cd /root/projects/nextnest

# Day 9-10: Receive from HQ
mkdir -p .github/workflows
mkdir -p scripts/maf/status

# CI Guard
cp /root/projects/maf-github/.github/workflows/maf-subtree-guard.yml \
   .github/workflows/

# Health Check
cp /root/projects/maf-github/scripts/maf/status/check-subtree-health.sh \
   scripts/maf/status/

# Test
bash scripts/maf/status/check-subtree-health.sh
```

---

### Wave 2: Refinement (Most Work Required)

```bash
cd /root/projects/nextnest

# Day 11-14: Fix all drift

# 1. Fix session name chaos (REVISED STRATEGY: Keep "maf-nn")
# CRITICAL: Session name exists in 3 locations - ALL must match or tmux/health checks fail
echo "Standardizing session name to maf-nn (keeping existing working session)..."
echo "Updating subtree config to match root config..."
jq '.session = "maf-nn"' maf/.maf/config/agent-topology.json > /tmp/nn-subtree.json
mv /tmp/nn-subtree.json maf/.maf/config/agent-topology.json

# Root config already "maf-nn" (no change needed)
# Context manager already "maf-nn" (no change needed)

echo "Verifying session names match..."
grep -n "session.*maf" .maf/config/agent-topology.json maf/.maf/config/agent-topology.json maf/scripts/maf/context-manager-nextnest.sh

# 2. Restore modified subtree files
echo "Restoring subtree files to pristine..."
git checkout maf/.maf/config/agent-topology.json
git checkout maf/scripts/maf/context-manager-v2.sh
git checkout maf/scripts/maf/prompt-agent.sh
git checkout maf/scripts/maf/rebuild-maf-cli-agents.sh

# 3. Move untracked files to local
echo "Moving untracked files to local..."
mkdir -p scripts/maf
mv maf/scripts/maf/agent-startup.sh scripts/maf/
mv maf/scripts/maf/context-manager-nextnest.sh scripts/maf/

# 4. Fix agent startup dependency chain (3 specific lines: 47, 273, 284)
echo "Fixing agent startup paths..."
# Update rebuild-maf-cli-agents.sh to source from new location
sed -i 's|source "${SCRIPT_DIR}/agent-startup.sh"|source "${PROJECT_ROOT}/scripts/maf/agent-startup.sh"|' \
  maf/scripts/maf/rebuild-maf-cli-agents.sh

# Verify all 3 locations updated
grep -n "AGENT_STARTUP_WRAPPER" maf/scripts/maf/rebuild-maf-cli-agents.sh

# 5. Fix or remove memlayer dependencies (NEW FINDING)
echo "⚠️  WARNING: Memlayer dependencies are broken"
echo "Scripts referenced but don't exist:"
echo "  - maf/scripts/maf/agent-mail-fetch.sh"
echo "  - maf/scripts/maf/agent-memory.sh"
echo "Action: Update context-manager-v2.sh to remove or fix these references"

# 6. Add role-based mapping
echo "Adding role-based mapping..."
jq '.role_mappings = {
  "supervisor": "RateRidge",
  "reviewer": "AuditBay",
  "implementor-1": "PrimePortal",
  "implementor-2": "LedgerLeap"
}' .maf/config/agent-topology.json > /tmp/nn-config.json
mv /tmp/nn-config.json .maf/config/agent-topology.json

# 7. Test agent spawn (CRITICAL)
echo "Testing agent spawn..."
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --test-only 2>&1 | tee /tmp/nn-spawn-test.txt

# 8. Verify health
echo "Verifying subtree health..."
bash maf/scripts/maf/status/check-subtree-health.sh

# 9. Check for session issues
tmux list-sessions | grep maf-nn || echo "Warning: No maf-nn session found"

# 10. Cleanup
rm -f *.old *.backup
```

**Success Criteria:**
- ✅ Subtree pristine (no modified files)
- ✅ Session name consistent (maf-nn everywhere)
- ✅ Agent startup chain working (all 3 references updated)
- ✅ Agents spawn correctly
- ✅ Memlayer dependencies addressed (removed or documented)

---

## Execution Order Summary

```
1. MAF HQ (Wave 1)
   └─> Deploy to consumers (Day 9-10)

2. NextNest (Wave 2)
   └─> Fix all drift (Day 11-14)
   └─> Test thoroughly

3. Roundtable (Wave 2)
   └─> Pull from HQ (Day 15-18)
   └─> Test in staging first
```

**Why This Order:**
1. HQ must be clean before consumers pull
2. NextNest goes first (canary, non-production)
3. Roundtable goes last (production, highest care)

---

## Verification Checklist for Each Repo

### Before Wave 1
- [ ] Phase 0 complete (baseline metrics, path audit)
- [ ] Health check script working
- [ ] CI guard received
- [ ] No agent failures for 3+ days

### Before Wave 2
- [ ] Wave 1 validation gate passed
- [ ] Session name consistent
- [ ] Role-based support available
- [ ] Team trained on process

### After Wave 2
- [ ] Subtree pristine (no modified files)
- [ ] Role-based mappings configured
- [ ] Agents spawn correctly
- [ ] Documentation updated

---

**Generated:** 2026-01-08
**Source:** Unified Blueprint v3.0
