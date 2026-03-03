# MAF Franchise Architecture Design (Revised)

**Date:** 2026-01-08
**Status:** Design Complete - Ready for Implementation
**Version:** v2.1 (Two-Wave Approach)
**Author:** Generated from comprehensive analysis + peer review

---

## What Changed in v2.1

This revision incorporates strategic feedback to execute in **two waves** rather than all-at-once:

| Change | v2.0 | v2.1 | Reason |
|--------|------|------|--------|
| **Execution Strategy** | 4 weeks straight | Wave 1 (10 days) + Gate + Wave 2 (18 days) | Protects production |
| **Wave 1 Risk** | Mixed | Low only | Stops drift without breaking |
| **Wave 2 Trigger** | Fixed schedule | After validation gate | Ensures stability first |
| **Production Safety** | Questionable | Protected | Roundtable won't break |

**Key Insight:** Separating "stop the bleeding" from "optimize the system" protects Roundtable (production) from aggressive changes.

---

## What Changed in v2.0

This revised design incorporates peer feedback from `maf-franchise-notes.md`:

| Change | Original | Revised | Reason |
|--------|----------|---------|--------|
| **Repo Structure** | 3 separate repos | 1 HQ repo with folders | Avoid premature optimization |
| **CI Guard** | Basic implementation | Fixed with `fetch-depth: 0` + `maf-upgrade` label | Technical correctness |
| **Agent Names** | Rip out all names | Role-based mapping | Smoother migration |
| **Override Order** | Not specified | Explicit resolution order | Critical missing piece |
| **Version Tagging** | Semantic only | Explicit ritual | Clearer process |
| **Manifest Scope** | All files | ~10 critical paths | More practical |
| **Timeline** | 16 days | 4 weeks | More realistic |

---

## Executive Summary

This document outlines a **pragmatic, phased approach** to transforming MAF (Multi-Agent Framework) into a franchisable system with:

- **ONE HQ repo** (iamnormalfree/maf) with clear folder separation
- **Franchise consumers** (Roundtable, Nextnest, etc.) using git subtree
- **Clear governance** through CI guards and documented processes
- **Role-based agent architecture** for flexibility

**Key Principle:** Start simple, prove the model, then optimize.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Part 1: Governance & CI Enforcement](#part-1-governance--ci-enforcement)
3. [Part 2: Doctrine Classification Framework](#part-2-doctrine-classification-framework)
4. [Part 3: HQ Repo Structure](#part-3-hq-repo-structure)
5. [Part 4: Agent Name Strategy](#part-4-agent-name-strategy)
6. [Part 5: Implementation Roadmap](#part-5-implementation-roadmap)
7. [Summary](#summary)

---

## Architecture Overview

### The Single-HQ Model

```
iamnormalfree/maf (One HQ Repo)
├── maf/                        # Core framework (what gets subtreed)
│   ├── lib/maf/               # Orchestration code
│   ├── scripts/maf/           # Operational scripts
│   ├── .claude/skills/        # Response Awareness
│   ├── mcp_agent_mail/        # Communication layer
│   └── docs/                  # Framework docs
│
├── templates/                  # Examples and starting points
│   ├── agent-topology.json.example
│   ├── prompts/
│   └── configs/
│
├── runtime-template/           # Host-specific templates (kept in HQ)
│   ├── tmux/
│   ├── state/schemas/
│   └── scripts/
│
├── labs/                       # Experiments (optional folder)
│   ├── experiments/
│   ├── test-results/
│   └── spikes/
│
└── docs/                       # Governance and operations
    ├── MAF_ASSUMPTIONS.md
    ├── CORE_OVERRIDE_POLICY.md
    ├── VERSIONING_GUIDE.md
    └── FRANCHISE_OPERATIONS.md
```

**Why One Repo:**
- Simpler coordination (no multi-repo overhead)
- Easier to maintain during stabilization
- Can split later once the model is proven
- Folders provide the same separation with less friction

---

## Part 1: Governance & CI Enforcement

### Solution Architecture: Three-Layer Enforcement

#### Layer 1: Subtree Read-Only Enforcement (CI Guard) - FIXED

**Original Issue:** The CI guard used `git diff origin/main...HEAD` which fails if `origin/main` isn't fetched.

**Fixed Version:**

```yaml
# .github/workflows/maf-subtree-guard.yml
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
          fetch-depth: 0  # CRITICAL: Fetch full history for diff

      - name: Check maf/ subtree integrity
        id: check_subtree
        run: |
          # Get list of changed files in PR
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }}...HEAD)

          # Check if any files under maf/ were changed
          if echo "$CHANGED_FILES" | grep -q "^maf/"; then
            echo "maf_subtree_changed=true" >> $GITHUB_OUTPUT

            # Check if PR has maf-upgrade label (allows subtree pulls)
            if [[ "${{ github.event.pull_request.labels.*.name }}" =~ "maf-upgrade" ]]; then
              echo "✅ maf/ changed but has maf-upgrade label (allowed)"
              exit 0
            else
              echo "::error::Cannot modify maf/ subtree without 'maf-upgrade' label"
              echo "::error::Changes to MAF core must go through HQ PR"
              exit 1
            fi
          fi

          echo "✅ maf/ subtree is clean"
          echo "maf_subtree_changed=false" >> $GITHUB_OUTPUT

      - name: Subtree health check (if clean)
        if: steps.check_subtree.outputs.maf_subtree_changed == 'false'
        run: |
          # Verify subtree is at expected version
          if [ -f "maf/VERSION" ]; then
            echo "📍 MAF Version: $(cat maf/VERSION)"
          fi
```

**Key Improvements:**
- ✅ Uses `fetch-depth: 0` to ensure full history
- ✅ Diffs against PR base SHA (not `origin/main`)
- ✅ Allows subtree updates with `maf-upgrade` label
- ✅ Shows current MAF version for visibility

**Usage in Consumer Repos:**

```bash
# For MAF upgrade PRs (the only time maf/ should change)
git checkout -b maf/upgrade-v0.3.0
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
git push origin maf/upgrade-v0.3.0
# Then add "maf-upgrade" label in GitHub PR
```

---

#### Layer 2: Core Override Declaration System

When a repo MUST modify core (emergency), they create:

```markdown
# .maf/CORE_OVERRIDE.md
## Core Modifications in This Repo

### File: maf/scripts/maf/spawn-agents.sh
**Author:** @username
**Date:** 2026-01-08
**Reason:** Nextnest requires custom agent startup sequence for SME workflows
**Impact:** Delays agent spawn by 2s for context loading
**Proposed to HQ:** [#PR-number](https://github.com/iamnormalfree/maf/pull/123)
**Status:** Pending | Rejected | Accepted for v0.3.1

### Technical Details
[What was changed, why it's necessary, and what breaks without it]

### Migration Plan
- [ ] PR submitted to HQ
- [ ] PR merged
- [ ] Local override removed
- [ ] Subtree updated to new version
```

**CI Validation:**

```bash
# Add to CI workflow to ensure overrides are documented
if git diff --name-only HEAD~...HEAD | grep "^maf/"; then
  if [ ! -f ".maf/CORE_OVERRIDE.md" ]; then
    echo "::error::maf/ modified but .maf/CORE_OVERRIDE.md not found"
    exit 1
  fi
fi
```

---

#### Layer 3: Subtree Health Dashboard - IMPLEMENTED

```bash
#!/bin/bash
# maf/scripts/status/check-subtree-health.sh

set -e

MAF_DIR="${1:-.maf/../maf}"  # Default to maf/ in project root

echo "🔍 MAF Subtree Health Check"
echo "=========================="
echo ""

# Check if subtree exists
if [ ! -d "$MAF_DIR" ]; then
  echo "❌ MAF subtree not found at: $MAF_DIR"
  exit 1
fi

# Check for local modifications
cd "$(git rev-parse --show-toplevel)"
if git diff --name-only | grep -q "^maf/"; then
  echo "❌ Subtree: DIRTY (has uncommitted changes)"
  git diff --name-only | grep "^maf/" | sed 's/^/  - /'
else
  echo "✅ Subtree: Clean (no uncommitted changes)"
fi

# Check for staged changes
if git diff --cached --name-only | grep -q "^maf/"; then
  echo "⚠️  Subtree: Has staged changes"
  git diff --cached --name-only | grep "^maf/" | sed 's/^/  - /'
fi

# Get current version
if [ -f "$MAF_DIR/VERSION" ]; then
  CURRENT_VERSION=$(cat "$MAF_DIR/VERSION")
  echo "📍 Current Version: $CURRENT_VERSION"
else
  echo "⚠️  No VERSION file found in subtree"
fi

# Check for pending upstream proposals
if [ -f ".maf/CORE_OVERRIDE.md" ]; then
  echo "⚠️  Pending upstreams: See .maf/CORE_OVERRIDE.md"
fi

echo ""
echo "=========================="
echo "✅ Health check complete"
```

---

### Part 1 Additions (Missing from Original)

#### Override Loading Order (CRITICAL)

**Original Problem:** I specified `.maf/overrides/` but never defined the resolution order.

**Solution: Explicit Priority Order**

```bash
# Override Resolution Order (highest to lowest priority)

1. .maf/overrides/*              # Your customizations (always wins)
2. .maf/config/*                 # Your project configuration
3. maf/templates/*               # Framework examples (fallback)
4. maf/*                         # Core framework (default)
```

**Implementation Example:**

```bash
#!/bin/bash
# scripts/maf/load-config.sh

# Function to load configuration with proper override resolution
load_agent_config() {
  local config_file="$1"

  # Check local override first
  if [ -f ".maf/overrides/$config_file" ]; then
    source ".maf/overrides/$config_file"
    log_debug "Loaded from .maf/overrides/$config_file"
    return 0
  fi

  # Check project config second
  if [ -f ".maf/config/$config_file" ]; then
    source ".maf/config/$config_file"
    log_debug "Loaded from .maf/config/$config_file"
    return 0
  fi

  # Check framework templates third
  if [ -f "maf/templates/$config_file" ]; then
    source "maf/templates/$config_file"
    log_debug "Loaded from maf/templates/$config_file"
    return 0
  fi

  # Use core framework default
  if [ -f "maf/$config_file" ]; then
    source "maf/$config_file"
    log_debug "Loaded from maf/$config_file (default)"
    return 0
  fi

  log_error "Configuration file not found: $config_file"
  return 1
}
```

**Document in SETUP.md:**

```markdown
## Configuration Resolution

MAF loads configurations in this order (first found wins):

1. `.maf/overrides/` - Your project-specific overrides
2. `.maf/config/` - Your project configuration
3. `maf/templates/` - Framework examples
4. `maf/` - Core framework defaults

**Example:** If you have both `.maf/overrides/agent-config.sh` and `maf/agent-config.sh`,
the override version will be used.
```

---

#### MAF Upgrade PR Policy (NEW)

**Standard Process for Consumers:**

```bash
# 1. Create upgrade branch
git checkout -b maf/upgrade-v0.X.Y

# 2. Pull latest from HQ
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# 3. Run smoke tests
bash maf/scripts/maf/health-check.sh

# 4. Commit if tests pass
git add maf/
git commit -m "chore: upgrade MAF to v0.X.Y"

# 5. Push and create PR
git push origin maf/upgrade-v0.X.Y
# Create PR in GitHub, add "maf-upgrade" label

# 6. After merge, delete branch
git branch -d maf/upgrade-v0.X.Y
```

**Smoke Test Script:**

```bash
#!/bin/bash
# scripts/test-maf-upgrade.sh

set -e

echo "🧪 MAF Upgrade Smoke Test"

# Test 1: Check subtree structure
echo -n "Checking subtree structure... "
if [ -d "maf/lib/maf" ] && [ -d "maf/scripts/maf" ]; then
  echo "✅"
else
  echo "❌ FAILED"
  exit 1
fi

# Test 2: Validate configuration
echo -n "Validating configuration... "
if [ -f ".maf/config/agent-topology.json" ]; then
  echo "✅"
else
  echo "❌ FAILED (missing agent topology)"
  exit 1
fi

# Test 3: Check scripts are executable
echo -n "Checking script permissions... "
if [ -x "maf/scripts/maf/spawn-agents.sh" ]; then
  echo "✅"
else
  echo "❌ FAILED (scripts not executable)"
  exit 1
fi

echo ""
echo "✅ All smoke tests passed"
```

---

## Part 2: Doctrine Classification Framework

### System 1: The 4-Question Filter (for humans)

```markdown
# docs/DOCTRINE_FILTER.md

## The 4 Questions (Ask in Order)

### Q1: "If this breaks, does every project suffer?"
- **YES → GLOBAL** (system mechanics, lifecycle, validation)
- **NO → Continue to Q2**

### Q2: "Would we want to re-teach this to every future project?"
- **YES → GLOBAL** (hard-earned lessons, best practices)
- **NO → Continue to Q3**

### Q3: "Is this about identity or mechanics?"
- **Mechanics (how it runs) → GLOBAL**
- **Identity (what it does) → LOCAL**

### Q4: "If two projects disagree on this, is that acceptable?"
- **No, chaos ensues → GLOBAL**
- **Yes, diversity is fine → LOCAL**
```

### System 2: Lightweight Doctrine Manifest (~10 paths)

**Feedback Point:** Keep it lightweight to avoid constant exceptions.

```yaml
# .doctrine-manifest.yml
# Lightweight: Only classify ~10 high-impact paths
# Everything else follows the 4-question filter

global_forbidden:
  # Core mechanics - NEVER override locally
  - path: maf/lib/maf/core/
    override: forbidden
    rationale: "Agent lifecycle is system physics"

  - path: maf/scripts/maf/lib/
    override: forbidden
    rationale: "Helper scripts are shared operational doctrine"

  - path: maf/.claude/skills/response-awareness-*/
    override: forbidden
    rationale: "Metacognitive orchestration is shared OS"

global_required:
  # Must exist in every consumer
  - path: .maf/config/agent-topology.json
    template: maf/templates/agent-topology.json.example
    rationale: "Defines agent team structure"

local_identity:
  # Always local, never in HQ
  - path: .maf/agents/
    rationale: "Agent prompts are project-specific"

  - path: .maf/TEAM-CONFIG.md
    template: maf/templates/TEAM-CONFIG.md.example
    rationale: "Team documentation is project-specific"

local_optional:
  # May be local if needed
  - path: .maf/overrides/prompts/
    rationale: "Project-specific prompt customizations"

  - path: .maf/overrides/scripts/
    rationale: "Project-specific workflow scripts"
```

**Usage:**

```bash
#!/bin/bash
# scripts/validate/doctrine-check.sh

# Validate file is in correct location
check_doctrine_compliance() {
  local file="$1"

  # Check against forbidden paths
  for forbidden in "maf/lib/maf/core/" "maf/scripts/maf/lib/" "maf/.claude/skills/"; do
    if [[ "$file" =~ ^$forbidden ]] && [[ ! "$file" =~ ^maf/templates/ ]]; then
      error "File in forbidden path: $file"
      error "Use .maf/overrides/ instead"
      return 1
    fi
  done

  return 0
}
```

---

### The Three Zones

| Zone | Location | Purpose | Rule | Examples |
|------|----------|---------|------|----------|
| **Zone 1 (Core)** | `maf/lib/maf/`, `maf/scripts/maf/` | Mechanics, orchestration | Read-only in consumers | Agent lifecycle, health checks |
| **Zone 2 (Templates)** | `maf/templates/` | Examples, starting points | Copy to `.maf/`, don't edit | Example configs, sample prompts |
| **Zone 3 (Local)** | `.maf/config/`, `.maf/overrides/` | Identity, customization | Never commit to HQ | Agent names, prompts, domain logic |

---

## Part 3: HQ Repo Structure (Single Repo)

### Folder Separation (Not Repo Split)

```
iamnormalfree/maf
│
├── maf/                        # 🎯 CORE: What gets subtreed to consumers
│   ├── lib/maf/
│   │   ├── core/              # Agent lifecycle, coordination
│   │   ├── cli/               # MAF CLI tools
│   │   ├── scheduling/        # Task scheduling
│   │   ├── decision-making/    # Agent decisions
│   │   ├── governance/         # Policy enforcement
│   │   └── integration/        # Beads, agent-mail, memlayer
│   ├── scripts/maf/            # 170+ operational scripts
│   │   ├── spawn-agents.sh
│   │   ├── health-monitor.sh
│   │   ├── lib/                # Helper libraries
│   │   └── prompt-packs/       # Template prompt packs only
│   ├── .claude/skills/         # Response Awareness (21 skills)
│   ├── mcp_agent_mail/         # Communication layer
│   ├── docs/                   # Framework documentation
│   ├── SETUP.md                # Installation guide
│   └── VERSION                 # Current version
│
├── templates/                  # 📋 EXAMPLES: Starting points for consumers
│   ├── agent-topology.json.example
│   ├── project.env.example
│   ├── prompts/
│   │   ├── supervisor-prompt.md.example
│   │   ├── reviewer-prompt.md.example
│   │   └── impl-frontend-prompt.md.example
│   └── configs/
│       └── tmux.conf.example
│
├── runtime-template/           # 🔧 HOST: Runtime setup (copied, not subtreed)
│   ├── tmux/
│   │   ├── tmux.conf.example
│   │   └── tmux-quota-status.conf.example
│   ├── state/
│   │   ├── .gitkeep
│   │   └── schemas/
│   │       ├── reservations.schema.sql
│   │       └── runtime.schema.sql
│   └── scripts/
│       ├── bootstrap-runtime.sh
│       └── validate-host.sh
│
├── labs/                       # 🧪 EXPERIMENTS: Optional, for exploration
│   ├── experiments/
│   │   ├── beads-flow-test/
│   │   └── tmux-optimization/
│   ├── test-results/
│   └── spikes/
│
└── docs/                       # 📚 GOVERNANCE: Policy and operations
    ├── MAF_ASSUMPTIONS.md       # What agents assume
    ├── CORE_OVERRIDE_POLICY.md  # Override process
    ├── VERSIONING_GUIDE.md      # Tagging ritual (NEW)
    ├── DOCTRINE_FILTER.md       # 4-question framework
    ├── LOCAL_CUSTOMIZATION.md   # Override order (NEW)
    └── FRANCHISE_OPERATIONS.md  # Weekly process
```

### What's in Each Zone

| Zone | Subtree? | Contents | Updated By |
|------|----------|----------|------------|
| `maf/` | ✅ Yes | Core framework | HQ PRs only |
| `templates/` | ✅ Yes | Examples | HQ PRs only |
| `runtime-template/` | ❌ No | Host setup | HQ (manual copy by consumers) |
| `labs/` | ❌ No | Experiments | HQ (never synced to consumers) |
| `docs/` | ✅ Yes | Governance docs | HQ PRs only |

**Key Point:** Only `maf/` and `templates/` get included in the subtree. Consumers copy `runtime-template/` if needed, and never see `labs/`.

---

## Part 4: Agent Name Strategy

### Role-Based Mapping (Not Genericization)

**Feedback Point:** Don't rip out existing agent names. Use role-based mapping for smoother migration.

**The Problem:**
- Current code has hardcoded names: "auditbay", "primeportal", "rateridge"
- These are baked into scripts, configs, and prompts
- Replacing everywhere breaks existing systems

**The Solution: Role-Based Mapping**

```javascript
// NEW: Agent roles are generic, mapping is in config
const AGENT_ROLES = {
  SUPERVISOR: "supervisor",
  REVIEWER: "reviewer",
  IMPL_FRONTEND: "implementor-1",
  IMPL_BACKEND: "implementor-2",
  ANALYSIS: "analysis",
  ADVISORY: "advisory"
};

// Config maps roles → actual agent IDs
// In .maf/config/agent-topology.json:
{
  "role_mappings": {
    "supervisor": "GreenMountain",      // Roundtable
    "reviewer": "BlackDog",              // Roundtable
    "implementor-1": "OrangePond",       // Roundtable
    "implementor-2": "FuchsiaCreek"      // Roundtable
  },
  "role_mappings": {
    "supervisor": "RateRidge",           // Nextnest
    "reviewer": "AuditBay",              // Nextnest
    "implementor-1": "PrimePortal",      // Nextnest
    "implementor-2": "LedgerLeap"        // Nextnest
  }
}
```

**Example Script Conversion:**

```bash
# BEFORE: Hardcoded agent names
AGENT_SUPERVISOR="GreenMountain"
AGENT_REVIEWER="BlackDog"
spawn_agent "$AGENT_SUPERVISOR"

# AFTER: Role-based with config lookup
ROLE_SUPERVISOR="supervisor"
AGENT_SUPERVISOR=$(get_agent_by_role "$ROLE_SUPERVISOR")
spawn_agent "$AGENT_SUPERVISOR"

# Helper function:
get_agent_by_role() {
  local role="$1"
  jq -r ".role_mappings[\"$role\"]" .maf/config/agent-topology.json
}
```

**Migration Path:**

1. **Phase 1 (Week 1):** Add role mapping schema to HQ
   - Define standard roles: supervisor, reviewer, impl-1, impl-2
   - Add `role_mappings` field to agent-topology.json schema
   - Update `spawn-agents.sh` to use role lookup

2. **Phase 2 (Week 2-3):** Migrate consumers gradually
   - Update Roundtable config with role mappings
   - Update Nextnest config with role mappings
   - Test that agents spawn correctly

3. **Phase 3 (Week 4):** Remove old hardcoded references
   - Search code for "GreenMountain", "RateRidge", etc.
   - Replace with role-based lookups
   - Clean up legacy references

**Benefits:**
- ✅ No breaking changes to existing systems
- ✅ Projects keep their agent names
- ✅ Core scripts become generic and reusable
- ✅ New projects can use any names they want
- ✅ Clear separation of roles (mechanics) vs names (identity)

---

## Part 5: Implementation Roadmap

### Two-Wave Phased Approach (4-5 Weeks)

**Strategic Insight:** Do NOT execute everything at once. Treat this as a north-star constitution, implementing in two waves to protect production stability.

**Why Two Waves:**
- **Wave 1** stops drift without breaking anything (low risk, high value)
- **Wave 2** completes the vision after stability is proven (medium risk, high value)

**Founder Risk:** If Roundtable (production) breaks during aggressive migration, everything else becomes irrelevant.

---

## Wave 1: Stabilization (Days 1-10)

**Goal:** Make drift impossible without breaking production

**Risk Level:** Low
**Value:** High (prevents future damage)

**Strategy:** Additive changes only - nothing deleted, nothing broken

---

### Day 1-2: Clean HQ Structure (Non-Breaking)

**Goal:** Create single-HQ folder structure, keep everything for now

**Tasks:**

1. **Create proper folder structure**
   ```bash
   cd /root/projects/maf-github

   # Create new folders (non-breaking)
   mkdir -p templates/{prompts,configs}
   mkdir -p runtime-template/{tmux,state/schemas,scripts}
   mkdir -p labs/{experiments,test-results,spikes}

   # Move example files to templates/ (non-breaking)
   cp .maf/config/agent-topology.json templates/agent-topology.json.example
   # DON'T delete original yet (Wave 2)
   ```

2. **Pull enhanced scripts from Roundtable**
   ```bash
   # These are improvements, keep both versions for now
   cp /root/projects/roundtable/scripts/maf/lib/agent-utils.sh \
      scripts/maf/lib/agent-utils.roundtable.bak

   cp /root/projects/roundtable/scripts/maf/lib/credential-manager.sh \
      scripts/maf/lib/credential-manager.roundtable.bak

   cp /root/projects/roundtable/scripts/maf/lib/profile-loader.sh \
      scripts/maf/lib/profile-loader.roundtable.bak

   cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh \
      scripts/maf/lib/tmux-utils.roundtable.bak
   ```

3. **Add innovations from Nextnest**
   ```bash
   # Add agent type mappings schema (NEW, non-breaking)
   cat > .maf/config/agent-type-mappings.schema.json <<'EOF'
   {
     "agent_type_mappings": {
       "claude-worker": "string",
       "codex-reviewer": "string"
     }
   }
   EOF

   # Add context manager wrapper example (NEW, non-breaking)
   cp /root/projects/nextnest/maf/scripts/maf/context-manager-nextnest.sh \
      scripts/maf/context-manager-wrapper.sh.example
   # Edit: Remove Nextnest-specific paths

   # Add agent startup pattern (NEW, non-breaking)
   cp /root/projects/nextnest/maf/scripts/maf/agent-startup.sh \
      scripts/maf/agent-startup.sh.example
   ```

**Day 1-2 Success Criteria:**
- ✅ Folder structure created (maf/, templates/, runtime-template/, labs/)
- ✅ Enhanced scripts preserved (not replacing yet)
- ✅ New schemas and examples added

---

### Day 3-4: Add CI Guard + Override Order (Non-Breaking)

**Goal:** Enforce governance going forward (doesn't fix past)

**Tasks:**

1. **Add fixed CI guard to HQ**
   ```bash
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
               if [[ "${{ github.event.pull_request.labels.*.name }}" =~ "maf-upgrade" ]]; then
                 echo "✅ maf/ changed with maf-upgrade label (allowed)"
               else
                 echo "::error::Cannot modify maf/ without 'maf-upgrade' label"
                 exit 1
               fi
             fi
   EOF
   ```

2. **Document override resolution order**
   ```bash
   cat > docs/OVERRIDE_RESOLUTION_ORDER.md <<'EOF'
   # MAF Override Resolution Order

   ## Priority (Highest to Lowest)
   1. `.maf/overrides/*` - Your customizations (always wins)
   2. `.maf/config/*` - Your project configuration
   3. `maf/templates/*` - Framework examples (fallback)
   4. `maf/*` - Core framework (default)

   ## Implementation
   See: scripts/maf/load-config.sh for reference implementation
   EOF
   ```

3. **Add version tagging ritual documentation**
   ```bash
   cat > docs/VERSIONING_GUIDE.md <<'EOF'
   # MAF Version Tagging Ritual

   ## Semantic Versioning
   - **Major (X.0.0):** Breaking changes (topology schema, folder structure)
   - **Minor (0.X.0):** New features (new scripts, new capabilities)
   - **Patch (0.0.X):** Bug fixes (non-breaking improvements)

   ## What Triggers a Tag

   ### Patch Release (Anytime)
   - Script bug fixes
   - Documentation updates
   - Non-breaking improvements

   ### Minor Release (Weekly or as needed)
   - New scripts added
   - New capabilities
   - Enhanced functionality (backward compatible)

   ### Major Release (Monthly or as needed)
   - Topology schema changes
   - Breaking interface changes
   - Requires migration steps

   ## Tagging Process
   1. Ensure all changes are merged to main
   2. Update VERSION file
   3. Create git tag: `git tag v0.X.Y-intent`
   4. Push tag: `git push origin v0.X.Y`
   5. Notify consumers
   EOF
   ```

**Day 3-4 Success Criteria:**
- ✅ CI guard created (not active yet, just exists)
- ✅ Override order documented
- ✅ Version ritual defined

---

### Day 5-6: Add Role-Based Support (Additive, Not Enforced)

**Goal:** Enable role-based mapping without breaking existing code

**Tasks:**

1. **Add role mapping schema to HQ**
   ```bash
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
   ```

2. **Add helper function for role lookup**
   ```bash
   cat > scripts/maf/lib/role-utils.sh <<'EOF'
   # Role-based agent lookup (ADDITIVE, not enforced)

   # Get agent ID by role
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

   # Check if role mapping exists
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

3. **Document role-based approach**
   ```bash
   cat > docs/ROLE_BASED_AGENTS.md <<'EOF'
   # Role-Based Agent Architecture

   ## Concept
   - **Roles** = Mechanics (global): supervisor, reviewer, implementor-1, implementor-2
   - **Names** = Identity (local): GreenMountain, RateRidge, etc.

   ## Migration Path
   - **Wave 1:** Add role support (additive, optional)
   - **Wave 2:** Migrate to role-based lookups (gradual)

   ## Example Usage
   ```bash
   # Old way (still works):
   AGENT_SUPERVISOR="GreenMountain"

   # New way (role-based):
   if has_role_mapping "supervisor"; then
     AGENT_SUPERVISOR=$(get_agent_by_role "supervisor")
   else
     AGENT_SUPERVISOR="GreenMountain"  # Fallback
   fi
   ```
   EOF
   ```

**Day 5-6 Success Criteria:**
- ✅ Role schema added
- ✅ Helper functions available
- ✅ Documentation exists
- ✅ Backward compatible (doesn't break existing code)

---

### Day 7-8: Add Health Checks (Non-Breaking)

**Goal:** Visibility into subtree health

**Tasks:**

1. **Create subtree health check script**
   ```bash
   cat > scripts/maf/status/check-subtree-health.sh <<'EOF'
   #!/bin/bash
   # MAF Subtree Health Check

   echo "🔍 MAF Subtree Health Check"
   echo "=========================="

   # Check for local modifications
   if git diff --name-only | grep -q "^maf/"; then
     echo "❌ Subtree: DIRTY"
     git diff --name-only | grep "^maf/"
   else
     echo "✅ Subtree: Clean"
   fi

   # Get current version
   if [ -f "maf/VERSION" ]; then
     echo "📍 Version: $(cat maf/VERSION)"
   fi

   # Check for pending overrides
   if [ -f ".maf/CORE_OVERRIDE.md" ]; then
     echo "⚠️  Pending overrides: See .maf/CORE_OVERRIDE.md"
   fi
   EOF

   chmod +x scripts/maf/status/check-subtree-health.sh
   ```

2. **Add to all repos**
   ```bash
   # Copy to HQ
   cp scripts/maf/status/check-subtree-health.sh /root/projects/maf-github/scripts/maf/status/

   # Copy to Nextnest
   cp scripts/maf/status/check-subtree-health.sh /root/projects/nextnest/scripts/maf/status/

   # Copy to Roundtable
   cp scripts/maf/status/check-subtree-health.sh /root/projects/roundtable/scripts/maf/status/
   ```

**Day 7-8 Success Criteria:**
- ✅ Health check script works in all repos
- ✅ Team can run `check-subtree-health.sh` to see status

---

### Day 9-10: Deploy CI Guard to Consumers (Non-Breaking)

**Goal:** Activate governance, but only for NEW changes

**Tasks:**

1. **Add CI guard to Nextnest**
   ```bash
   cd /root/projects/nextnest
   mkdir -p .github/workflows
   # Copy from HQ
   ```

2. **Add CI guard to Roundtable**
   ```bash
   cd /root/projects/roundtable
   mkdir -p .github/workflows
   # Copy from HQ
   ```

3. **Test CI guard works**
   ```bash
   # Test that it blocks subtree edits:
   # Create test PR that touches maf/
   # Verify it fails without maf-upgrade label
   # Verify it passes with maf-upgrade label
   ```

**Day 9-10 Success Criteria:**
- ✅ CI guards active in all repos
- ✅ Blocks subtree edits without label
- ✅ Allows subtree pulls with label

---

## Wave 1 Validation Gate

**Before starting Wave 2, verify:**

- [ ] CI guards are active and working
- [ ] Override resolution order is documented
- [ ] Health checks run successfully
- [ ] Role-based support is available (not enforced)
- [ ] No surprise agent failures for 3+ days
- [ ] Team understands the new process

**If any check fails:** Pause and fix before proceeding to Wave 2.

---

## Wave 2: Refinement (Days 11-28)

**Goal:** Complete the vision, clean up legacy

**Risk Level:** Medium (only after Wave 1 is stable)
**Value:** High (finishes the job)

**Strategy:** Now we can delete, replace, and enforce

---

### Day 11-14: Fix Nextnest (Canary)

**Goal:** Restore subtree to pristine state

**Tasks:**

1. **Restore modified subtree files**
   ```bash
   cd /root/projects/nextnest

   # Restore files that were modified
   git checkout maf/.maf/config/agent-topology.json
   git checkout maf/scripts/maf/context-manager-v2.sh
   git checkout maf/scripts/maf/prompt-agent.sh
   git checkout maf/scripts/maf/rebuild-maf-cli-agents.sh
   ```

2. **Move untracked files to local**
   ```bash
   mkdir -p scripts/maf
   mv maf/scripts/maf/agent-startup.sh scripts/maf/
   mv maf/scripts/maf/context-manager-nextnest.sh scripts/maf/
   mv maf/scripts/maf/init-nextnest-agents.sh scripts/maf/
   ```

3. **Add role-based mapping to local config**
   ```json
   // In .maf/config/agent-topology.json
   {
     "role_mappings": {
       "supervisor": "RateRidge",
       "reviewer": "AuditBay",
       "implementor-1": "PrimePortal",
       "implementor-2": "LedgerLeap"
     }
   }
   ```

4. **Test agent spawn**
   ```bash
   bash maf/scripts/maf/spawn-agents.sh
   bash maf/scripts/maf/health-check.sh
   ```

**Day 11-14 Success Criteria:**
- ✅ Subtree is pristine (no modified files)
- ✅ All customizations in `.maf/` or local `scripts/maf/`
- ✅ Agents spawn and work correctly

---

### Day 15-18: Update Roundtable (Production)

**Goal:** Ensure subtree is clean, pull latest from HQ

**Tasks:**

1. **Convert to subtree if needed**
   ```bash
   cd /root/projects/roundtable

   # If lib/maf exists (not a subtree):
   if [ -d "lib/maf" ] && [ ! -d "maf" ]; then
     # Preserve existing
     git mv lib/maf lib/maf__legacy_preserve
     git commit -m "chore: preserve lib/maf before subtree conversion"

     # Add HQ as subtree
     git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
   fi
   ```

2. **Pull latest from HQ**
   ```bash
   git checkout -b maf/upgrade-wave2
   git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
   # Test thoroughly
   ```

3. **Add role-based mapping**
   ```json
   // In .maf/config/agent-topology.json
   {
     "role_mappings": {
       "supervisor": "GreenMountain",
       "reviewer": "BlackDog",
       "implementor-1": "OrangePond",
       "implementor-2": "FuchsiaCreek"
     }
   }
   ```

4. **Test in staging before production**
   ```bash
   bash maf/scripts/maf/spawn-agents.sh
   bash maf/scripts/maf/health-check.sh
   # Verify all workflows work
   ```

**Day 15-18 Success Criteria:**
- ✅ Subtree is clean and at latest version
- ✅ Role-based mappings configured
- ✅ Production agents work correctly
- ✅ No breaking changes detected

---

### Day 19-21: Clean Up HQ (Remove Project-Specific Content)

**Goal:** Now we can safely remove Roundtable-specific content

**Tasks:**

1. **Remove Roundtable prompt packs from HQ**
   ```bash
   cd /root/projects/maf-github
   rm scripts/maf/prompt-packs/roundtable-*.json
   ```

2. **Remove Roundtable agent prompts from HQ**
   ```bash
   # Keep as EXAMPLES instead of deleting
   mv .maf/agents/greenmountain-prompt.md templates/prompts/supervisor-prompt.md.example
   mv .maf/agents/blackdog-prompt.md templates/prompts/reviewer-prompt.md.example
   mv .maf/agents/orangepond-prompt.md templates/prompts/impl-frontend-prompt.md.example
   mv .maf/agents/fuchsiacreek-prompt.md templates/prompts/impl-backend-prompt.md.example
   ```

3. **Template-ize team config**
   ```bash
   mv .maf/TEAM-CONFIG.md templates/TEAM-CONFIG.md.example
   # Edit: Remove Roundtable-specific content, make generic
   ```

4. **Apply enhanced scripts from Roundtable**
   ```bash
   # Now we can replace with enhanced versions
   mv scripts/maf/lib/agent-utils.roundtable.bak scripts/maf/lib/agent-utils.sh
   mv scripts/maf/lib/credential-manager.roundtable.bak scripts/maf/lib/credential-manager.sh
   mv scripts/maf/lib/profile-loader.roundtable.bak scripts/maf/lib/profile-loader.sh
   mv scripts/maf/lib/tmux-utils.roundtable.bak scripts/maf/lib/tmux-utils.sh
   ```

**Day 19-21 Success Criteria:**
- ✅ No Roundtable-specific content in HQ
- ✅ All examples have `.example` suffix
- ✅ Enhanced scripts applied

---

### Day 22-24: Migrate to Role-Based Agents

**Goal:** Remove hardcoded agent references

**Tasks:**

1. **Update spawn-agents.sh to use roles**
   ```bash
   # Add fallback logic:
   if has_role_mapping "supervisor"; then
     AGENT_SUPERVISOR=$(get_agent_by_role "supervisor")
   else
     # Fallback to old way for compatibility
     AGENT_SUPERVISOR="${AGENT_SUPERVISOR:-GreenMountain}"
   fi
   ```

2. **Update other scripts gradually**
   ```bash
   # Search for hardcoded agent names
   grep -r "GreenMountain\|BlackDog\|OrangePond\|FuchsiaCreek" scripts/maf/
   grep -r "RateRidge\|AuditBay\|PrimePortal\|LedgerLeap" scripts/maf/

   # Replace with role-based lookups where appropriate
   ```

3. **Test both repos still work**
   ```bash
   # Roundtable
   cd /root/projects/roundtable
   bash maf/scripts/maf/spawn-agents.sh

   # Nextnest
   cd /root/projects/nextnest
   bash maf/scripts/maf/spawn-agents.sh
   ```

**Day 22-24 Success Criteria:**
- ✅ Role-based lookups working
- ✅ Backward compatibility maintained
- ✅ Both repos spawn agents correctly

---

### Day 25-28: Final Documentation & Handoff

**Goal:** Ensure everything is documented

**Tasks:**

1. **Create runbooks**
   ```bash
   cat > docs/runbooks/CONSUMER_UPGRADE.md <<'EOF'
   # MAF Upgrade Runbook

   ## Prerequisites
   - [ ] Backup current state
   - [ ] No uncommitted changes

   ## Steps
   1. Create upgrade branch: `maf/upgrade-vX.Y.Z`
   2. Pull subtree
   3. Run smoke tests
   4. Create PR with `maf-upgrade` label
   5. Test in staging
   6. Merge to main

   ## Rollback
   If tests fail:
   git reset --hard HEAD
   git checkout main
   EOF
   ```

2. **Create troubleshooting guide**
   ```bash
   cat > docs/runbooks/TROUBLESHOOTING.md <<'EOF'
   # MAF Troubleshooting

   ## Subtree Issues
   - **Problem:** Subtree pull fails
   - **Solution:** Check for local modifications, commit or stash

   - **Problem:** Agents won't spawn
   - **Solution:** Check .maf/config/agent-topology.json

   - **Problem:** CI guard blocks legitimate change
   - **Solution:** Add `maf-upgrade` label to PR
   EOF
   ```

3. **Train team on new process**
   - Document "MAF Wednesday" ritual
   - Create upgrade checklist
   - Document override resolution

4. **Validate final success criteria**
   - [ ] All repos have clean subtrees
   - [ ] CI guards active and working
   - [ ] Override order documented and understood
   - [ ] Version tagging ritual defined
   - [ ] Role-based agents working
   - [ ] Team trained on process

**Day 25-28 Success Criteria:**
- ✅ All documentation complete
- ✅ Runbooks created
- ✅ Team trained
- ✅ All success criteria met

---

## Summary: Two-Wave Approach

| Wave | Focus | Duration | Risk | Value |
|------|-------|----------|------|-------|
| **Wave 1** | Stabilization | Days 1-10 | Low | High (stops drift) |
| **Gate** | Validate stability | - | - | Critical |
| **Wave 2** | Refinement | Days 11-28 | Medium | High (completes vision) |

### Wave 1: What We Do
- ✅ Create single-HQ folder structure
- ✅ Add CI guard with `maf-upgrade` label
- ✅ Document override resolution order
- ✅ Add role-based support (additive, optional)
- ✅ Add health checks
- ❌ DON'T delete anything yet
- ❌ DON'T enforce roles everywhere
- ❌ DON'T touch production runtime

### Wave 2: What We Do (After Validation)
- ✅ Fix Nextnest subtree drift
- ✅ Update Roundtable subtree
- ✅ Remove project-specific content from HQ
- ✅ Migrate to role-based agents
- ✅ Clean up legacy references
- ✅ Complete documentation

### Why This Works

1. **Separates "stop the bleeding" from "optimize the system"**
2. **Protects production (Roundtable) from aggressive changes**
3. **Allows validation before proceeding**
4. **Makes rollback easy if something goes wrong**
5. **Builds team confidence with gradual change**

---

## Timeline Comparison

| Approach | Duration | Risk | Production Safety |
|----------|----------|------|-------------------|
| **Original v2** | 4 weeks straight | High | Questionable |
| **Two-Wave** | 4-5 weeks with gate | Low | Protected |

---

**Next Steps:**

1. **Approve Two-Wave Approach** - Confirm this strategy
2. **Start Wave 1, Day 1** - Create HQ folder structure
3. **Follow Wave 1 checklist** - Days 1-10
4. **Pass Validation Gate** - Before starting Wave 2
5. **Execute Wave 2** - Days 11-28

---

**Document Version:** v2.1 (Two-Wave Approach)
**Last Updated:** 2026-01-08
**Status:** Ready for Implementation

---

## Summary

### v2.1 vs v2.0 vs v1.0

| Aspect | v1.0 | v2.0 | v2.1 |
|--------|------|------|------|
| **Repo Structure** | 3 repos | 1 repo with folders | 1 repo with folders |
| **CI Guard** | Basic | Fixed + label support | Fixed + label support |
| **Agent Names** | Genericize all | Role-based mapping | Role-based mapping |
| **Override Order** | Not specified | Explicit priority | Explicit priority |
| **Version Tagging** | Semantic only | Explicit ritual | Explicit ritual |
| **Manifest Scope** | All files | ~10 paths | ~10 paths |
| **Timeline** | 16 days | 4 weeks straight | 4-5 weeks with gate |
| **Execution** | All at once | All at once | Two waves |
| **Production Risk** | High | High | Low |

### Why v2.1 is the Right Approach

**1. Protects Production (Roundtable)**
- Wave 1 is additive only - nothing deleted, nothing broken
- Validation gate ensures stability before Wave 2
- Roundtable won't break from aggressive changes

**2. Separates Concerns**
- Wave 1: "Stop the bleeding" (prevent future drift)
- Wave 2: "Optimize the system" (complete the vision)

**3. Allows Rollback**
- If Wave 1 reveals issues, we can pause
- No commitment to Wave 2 until validation passes
- Team confidence builds gradually

**4. Reduces Surface Area**
- Wave 1: 5 changes over 10 days
- Wave 2: 5 changes over 18 days
- Vs. 10 changes all at once

### Success Criteria

**Wave 1 (Days 1-10):**
- ✅ CI guards active and working
- ✅ Override resolution order documented
- ✅ Health checks run successfully
- ✅ Role-based support available (not enforced)
- ✅ No surprise agent failures for 3+ days

**Validation Gate:**
- ✅ All Wave 1 criteria passed
- ✅ Team comfortable with new process
- ✅ No regressions detected

**Wave 2 (Days 11-28):**
- ✅ Nextnest subtree pristine
- ✅ Roundtable subtree clean
- ✅ No project-specific content in HQ
- ✅ Role-based agents working
- ✅ All documentation complete

### What Makes This Different

**Traditional Approach:**
```
Plan → Build → Test → Deploy (all at once)
```

**Two-Wave Approach:**
```
Wave 1: Stabilize → Validate → Wave 2: Complete
          ↓                              ↑
      (gate) ←─── if stable, proceed ────┘
                    if not, pause
```

### Final Recommendation

**Approve v2.1** as the MAF Constitution and execute in two waves:

1. **Start Wave 1, Day 1** - Create HQ folder structure
2. **Complete Wave 1** - Days 1-10 (stabilization)
3. **Pass Validation Gate** - Ensure stability
4. **Execute Wave 2** - Days 11-28 (refinement)

This approach gives you:
- ✅ The same complete vision
- ✅ Much lower production risk
- ✅ Ability to pause if issues arise
- ✅ Team confidence through gradual change

---

**Document Version:** v2.1 (Two-Wave Approach)
**Last Updated:** 2026-01-08
**Status:** Ready for Implementation

**Next Steps:**
1. Approve this plan
2. Start Wave 1, Day 1
3. Follow the wave checklists
4. Pass validation gate
5. Execute Wave 2

---

**Acknowledgments**

This design incorporates feedback from multiple reviewers who identified:
- The risk of premature repo splitting
- The importance of protecting production
- The value of staged, validated rollout
- The need for explicit override resolution

Their insights transformed this from "technically correct" to "production ready."
