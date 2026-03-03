# MAF Franchise Architecture Design

**Date:** 2026-01-08
**Status:** Design Complete - Awaiting Implementation
**Author:** Generated from comprehensive analysis of ChatGPT discussion (48 messages, 37k tokens)

---

## Executive Summary

This document outlines the complete architecture for transforming MAF (Multi-Agent Framework) from a single-repo project into a **franchisable system** with clear separation between:
- **HQ** (iamnormalfree/maf) - The source of truth
- **Franchises** (Roundtable, Nextnest, etc.) - Consumer repos

**Key Decision:** Willing to break existing patterns to achieve clean architecture ("Do it right" approach).

---

## Table of Contents

1. [Problems Identified](#problems-identified)
2. [Part 1: Governance & CI Enforcement](#part-1-governance--ci-enforcement)
3. [Part 2: Doctrine Classification Framework](#part-2-doctrine-classification-framework)
4. [Part 3: HQ Repo Cleanup](#part-3-hq-repo-cleanup)
5. [Part 4: Implementation Roadmap](#part-4-implementation-roadmap)
6. [Summary](#summary)

---

## Problems Identified

### Critical Issues

1. **Two Sources of Truth for Topology**
   - Roundtable has `lib/maf/` (NOT a subtree, diverged from HQ)
   - Nextnest has `maf/` (subtree, but with local edits)
   - Both have conflicting `agent-topology.json` files

2. **Silent Core Forking Risk**
   - Repos make "temporary" fixes in `maf/` and never upstream
   - No enforcement mechanism to prevent drift
   - Missing: `CORE_OVERRIDE_POLICY.md`, CI guards

3. **State Contamination in Current Repo**
   The current MAF repo mixes:
   - Runtime state (`reservations.db`, `runtime.db`, `agents/current-identity.txt`)
   - Identity assumptions (agent names like "auditbay", "primeportal")
   - Framework code

4. **Missing Governance Layer**
   - No clear "Global vs Local" doctrine classification
   - No CI enforcement of subtree read-only rule
   - No standardized override mechanism

---

## Part 1: Governance & CI Enforcement

### Solution Architecture: Three-Layer Enforcement

#### Layer 1: Subtree Read-Only Enforcement (CI Guard)

Add a GitHub Actions workflow to every consumer repo:

```yaml
# .github/workflows/maf-subtree-guard.yml
name: MAF Subtree Guard
on: pull_request
jobs:
  check-subtree-integrity:
    runs-on: ubuntu-latest
    steps:
      - name: Check if maf/ was modified
        run: |
          if git diff --name-only origin/main...HEAD | grep -q "^maf/"; then
            echo "::error::maf/ subtree should not be modified directly."
            echo "Changes to MAF core must go through HQ PR."
            exit 1
          fi
```

**Benefits:**
- Blocks accidental subtree modifications
- Forces upstream contribution workflow
- Makes the "maf/ is read-only" rule enforceable

#### Layer 2: Core Override Declaration System

When a repo MUST modify core (emergency), they create:

```markdown
# .maf/CORE_OVERRIDE.md
## Core Modifications in This Repo

### File: maf/scripts/maf/spawn-agents.sh
**Reason:** Nextnest requires custom agent startup sequence for SME workflows
**Date:** 2026-01-08
**Proposed to HQ:** #PR-number
**Status:** Pending | Rejected | Accepted for v0.x.y

### Technical Details
[What was changed and why]

### Migration Plan
[How this will be removed or upstreamed]
```

#### Layer 3: Subtree Health Dashboard

```bash
# maf/scripts/status/check-subtree-health.sh
Output:
✅ Subtree: Clean (no local modifications)
✅ HQ Version: v0.2.9
✅ Local Version: v0.2.9
⚠️  Pending upstreams: 2 changes proposed in PRs #42, #47
```

---

## Part 2: Doctrine Classification Framework

### System 1: The 4-Question Filter (for humans)

```markdown
# MAF_DOCTRINE_FILTER.md

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

### System 2: Automated File Classification

```yaml
# maf/.doctrine-manifest.yml
global:
  # Core orchestration - NEVER override locally
  - path: lib/maf/core/
    type: mechanics
    override: forbidden
    rationale: "Agent lifecycle and coordination are physics"

  - path: scripts/maf/lib/
    type: mechanics
    override: forbidden
    rationale: "Helper scripts are operational doctrine"

  - path: .claude/skills/response-awareness-*/
    type: mechanics
    override: forbidden
    rationale: "Metacognitive orchestration is shared OS"

local:
  # Identity and domain - MUST customize locally
  - path: .maf/config/agent-topology.json
    type: identity
    required: true
    template: maf/templates/agent-topology.json.example

  - path: .maf/overrides/prompts/
    type: identity
    required: false
    rationale: "Agent personality is project-specific"

  - path: .maf/overrides/scripts/
    type: identity
    required: false
    rationale: "Project-specific workflows"
```

### The Three Zones

| Zone | Location | Purpose | Rule |
|------|----------|---------|------|
| **Zone 1 (Core)** | `maf/lib/maf/`, `maf/scripts/maf/` | Mechanics, orchestration | Read-only in consumers |
| **Zone 2 (Templates)** | `maf/templates/` | Examples, starting points | Copy to `.maf/`, don't edit |
| **Zone 3 (Local)** | `.maf/config/`, `.maf/overrides/` | Identity, customization | Never commit to HQ |

---

## Part 3: HQ Repo Cleanup

### The Three-Repo Split

#### Repo 1: `maf-core` (The Franchise Manual)

```
maf-core/
├── lib/maf/                    # Pure orchestration code
│   ├── core/                   # Agent lifecycle, coordination
│   ├── cli/                    # MAF CLI
│   └── integration/            # Beads, agent-mail, memlayer
├── scripts/maf/                # Operational doctrine
│   ├── setup-maf.sh
│   ├── spawn-agents.sh
│   └── lib/helpers.sh
├── .claude/skills/             # Response Awareness
├── templates/                  # ZONE 2: Examples
│   ├── agent-topology.json.example
│   └── prompts/
├── docs/
│   ├── MAF_ASSUMPTIONS.md
│   ├── CORE_OVERRIDE_POLICY.md
│   ├── VERSIONING_GUIDE.md
│   └── DOCTRINE_FILTER.md
├── .doctrine-manifest.yml
├── SETUP.md
└── VERSION
```

**What's NOT in maf-core:**
- ❌ Any agent names (no "auditbay", "primeportal")
- ❌ Any runtime state files
- ❌ Any database files
- ❌ Any tmux config (host-specific)
- ❌ Any credentials or API keys

#### Repo 2: `maf-runtime-template` (The Kitchen Setup)

```
maf-runtime-template/
├── tmux/
│   ├── tmux.conf.example
│   └── tmux-quota-status.conf.example
├── state/
│   ├── .gitkeep
│   └── schemas/
├── scripts/
│   ├── bootstrap-runtime.sh
│   └── validate-host.sh
└── README.md
```

#### Repo 3: `maf-labs` (The Experiment Logbook)

```
maf-labs/
├── experiments/
├── test-results/
├── spikes/
└── README.md
```

### Genericizing Agent Names

```javascript
// BEFORE (Identity-specific)
const AGENT_TYPES = {
  AUDITBAY: "auditbay",
  PRIMEPORTAL: "primeportal"
};

// AFTER (Generic)
const AGENT_TYPES = {
  ANALYSIS: "analysis",
  REVIEW: "review",
  AUDIT: "audit",
  ADVISORY: "advisory"
};
```

---

## Part 4: Implementation Roadmap

### PHASE 0: Pre-Migration (Day 0)

**Decision:** Start fresh HQ repo, migrate valuable code (cleaner break)

### PHASE 1: HQ Core Migration (Days 1-3)

1. Audit current repo
2. Extract framework code
3. Genericize agent names
4. Remove runtime state
5. Add governance files

### PHASE 2: Separate Runtime & Labs (Days 4-5)

1. Create `maf-runtime-template` repo
2. Create `maf-labs` repo
3. Move host-specific configs
4. Move experiments

### PHASE 3: Migrate Consumer Repos (Days 6-10)

**Nextnest (Canary):**
1. Clean subtree
2. Add new HQ subtree
3. Re-apply local changes properly
4. Add CI guard
5. Test

**Roundtable (Production):**
1. Preserve `lib/maf` as legacy
2. Add HQ subtree to `maf/`
3. Migrate valuable changes
4. Update all references
5. Remove legacy

### PHASE 4: Validation & Testing (Days 11-14)

1. Create validation suite
2. Test each consumer repo
3. Verify subtree pull works
4. Check agent spawn/health

### PHASE 5: Documentation & Handoff (Days 15-16)

1. Create franchise operations guide
2. Update SETUP.md
3. Document all processes

---

## Timeline Summary

| Days | Phase | Output |
|------|-------|--------|
| 0 | Pre-Migration | HQ repo structure established |
| 1-3 | HQ Core Migration | Clean maf-core, governance files |
| 4-5 | Runtime/Labs Split | Separate repos for runtime and experiments |
| 6-10 | Consumer Migration | Nextnest (canary), then Roundtable |
| 11-14 | Validation | Test suites, smoke tests |
| 15-16 | Documentation | Operations guide, updated SETUP |

---

## Key Documents to Create

### In HQ Repo:
- `docs/MAF_ASSUMPTIONS.md` - What agents assume is "normal"
- `docs/CORE_OVERRIDE_POLICY.md` - Governance and override process
- `docs/VERSIONING_GUIDE.md` - Semantic versioning with intent tags
- `docs/DOCTRINE_FILTER.md` - 4-question classification framework
- `.doctrine-manifest.yml` - File classification manifest
- `SETUP.md` - Installation and configuration guide
- `docs/FRANCHISE_OPERATIONS.md` - Weekly operations manual

### In Consumer Repos:
- `.github/workflows/maf-subtree-guard.yml` - CI guard for subtree
- `.maf/CORE_OVERRIDE.md` - Emergency override documentation (if needed)

---

## Success Criteria

### Technical:
- ✅ All consumer repos have clean `maf/` subtree
- ✅ No runtime state in HQ repo
- ✅ No agent names hardcoded in core
- ✅ CI guards blocking subtree edits
- ✅ Clear override mechanism exists

### Operational:
- ✅ Weekly "MAF Wednesday" process defined
- ✅ Clear PR workflow for contributions
- ✅ Version tags with semantic meaning
- ✅ Documentation is comprehensive

### Governance:
- ✅ Doctrine classification is clear
- ✅ Global vs Local boundary is enforced
- ✅ Three-zone model is operational
- ✅ Escape hatch for emergencies exists

---

## Next Steps

1. **Review and Approve** - Review this design document
2. **Create HQ Repo** - Set up `iamnormalfree/maf` structure
3. **Start Migration** - Begin Phase 1
4. **Establish Rituals** - Set up MAF Wednesday process

---

**Appendix: ChatGPT Discussion Summary**

The complete discussion that informed this design is archived at:
https://chatgpt.com/share/695f253a-f798-8001-8a01-d899700c3257

Key contributors:
- MAF system architect (designing the franchise model)
- Roundtable (production deployment, original development)
- Nextnest (first franchise test, discovered integration issues)
