# MAF Repo Analysis and Migration Plan

**Date:** 2026-01-08
**Status:** Analysis Complete - Ready for Execution
**Repos Analyzed:** MAF HQ, Roundtable, Nextnest

---

## Executive Summary

This document provides a comprehensive analysis of three MAF-related repositories to identify what should be **GLOBAL** (in MAF HQ) vs **LOCAL** (in consumer repos), and creates actionable migration plans for each.

### Key Findings

| Repo | Status | Critical Issues | Action Required |
|------|--------|-----------------|-----------------|
| **MAF HQ** | 🔴 Contaminated | Contains Roundtable-specific configs | Clean and template-ize |
| **Roundtable** | 🟡 Moderate Drift | Enhanced scripts not synced to HQ | Upstream improvements |
| **Nextnest** | 🔴 Critical Drift | Modified subtree, dual configs | Restore and consolidate |

---

## Part 1: Global vs Local Classification

### DEFINITELY GLOBAL (belongs in MAF HQ)

These are framework-agnostic, reusable components:

| Category | Files | Reason |
|----------|-------|--------|
| **Core Library** | `lib/maf/` | Agent orchestration, scheduling, coordination |
| **Operational Scripts** | `scripts/maf/*.sh` (130+ scripts) | Generic agent lifecycle operations |
| **Response Awareness** | `.claude/skills/` | Metacognitive framework (21 skills) |
| **Communication** | `mcp_agent_mail/` | Domain-agnostic message layer |
| **Schemas** | `.maf/config/*.schema.json` | Configuration structure definitions |
| **Examples** | `*.example.*` files | Templates for local customization |

### DEFINITELY LOCAL (belongs in consumer repos)

These are project-specific and should NEVER be in MAF HQ:

| Category | Files | Reason |
|----------|-------|--------|
| **Agent Prompts** | `.maf/agents/<name>-prompt.md` | Domain-specific agent personalities |
| **Agent Topology** | `.maf/config/agent-topology.json` | Project's agent team structure |
| **Prompt Packs** | `scripts/maf/prompt-packs/<project>-*.json` | Project-specific workflow configurations |
| **Team Config** | `.maf/TEAM-CONFIG.md` | Project's team documentation |
| **Business Logic** | `apps/`, domain-specific code | Project's actual product |
| **Domain Docs** | `docs/product/`, `docs/architecture/` | Project-specific documentation |

### THE GRAY ZONE (needs evaluation)

These require judgment using the 4-question filter:

| Item | Current State | Recommendation | Reason |
|------|---------------|----------------|--------|
| **Agent Type Mappings** | Nextnest-only feature | **GLOBAL** | Useful innovation, make generic |
| **Risk-Based Governance** | Nextnest-only feature | **GLOBAL (pattern)** | Upstream pattern, keep data local |
| **Enhanced Helper Scripts** | Roundtable has 4 improved | **GLOBAL** | All repos benefit from fixes |
| **Agent Identity Injection** | Nextnest untracked file | **GLOBAL** | Reusable pattern |
| **Context Manager Wrapper** | Nextnest-specific | **TEMPLATE** | Create example in HQ |

---

## Part 2: Repo-by-Repo Analysis

### MAF HQ (`/root/projects/maf-github`)

#### Current State: 🔴 CONTAMINATED

**Problems:**
1. Contains Roundtable's agent topology (GreenMountain, BlackDog, etc.)
2. Has 8 Roundtable-specific prompt packs
3. Has Roundtable agent prompts in `.maf/agents/`
4. Missing enhanced scripts from Roundtable
5. Missing agent type mappings schema

#### Migration Plan for MAF HQ

```bash
# Phase 1: Remove Roundtable-specific content
cd /root/projects/maf-github

# 1. Template-ize agent topology
mv .maf/config/agent-topology.json .maf/config/agent-topology.json.example
# Edit: Replace with generic agent names (supervisor, reviewer, impl-1, impl-2)

# 2. Remove Roundtable prompt packs
cd scripts/maf/prompt-packs
rm roundtable-*.json

# 3. Remove Roundtable agent prompts
cd ../../.maf/agents
rm greenmountain-prompt.md blackdog-prompt.md
rm orangepond-prompt.md fuchsiacreek-prompt.md

# 4. Template-ize team config
mv .maf/TEAM-CONFIG.md .maf/TEAM-CONFIG.md.example 2>/dev/null || true
# Edit: Replace with generic template

# Phase 2: Pull enhancements from Roundtable
cp /root/projects/roundtable/scripts/maf/lib/agent-utils.sh \
   scripts/maf/lib/agent-utils.sh

cp /root/projects/roundtable/scripts/maf/lib/credential-manager.sh \
   scripts/maf/lib/credential-manager.sh

cp /root/projects/roundtable/scripts/maf/lib/profile-loader.sh \
   scripts/maf/lib/profile-loader.sh

cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh \
   scripts/maf/lib/tmux-utils.sh

# Phase 3: Add innovations from Nextnest
# 1. Add agent type mappings schema
cat > .maf/config/agent-type-mappings.schema.json <<'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agent Type Mappings Schema",
  "type": "object",
  "properties": {
    "claude-worker": { "type": "string", "description": "Worker agent ID" },
    "codex-reviewer": { "type": "string", "description": "Reviewer agent ID" }
  }
}
EOF

# 2. Add context manager wrapper example
cp /root/projects/nextnest/maf/scripts/maf/context-manager-nextnest.sh \
   scripts/maf/context-manager-wrapper.sh.example
# Edit: Remove Nextnest-specific paths

# 3. Add agent startup pattern
cp /root/projects/nextnest/maf/scripts/maf/agent-startup.sh \
   scripts/maf/agent-startup.sh.example

# Phase 4: Update documentation
cat > docs/LOCAL_CUSTOMIZATION.md <<'EOF'
# Local Customization Guide

## What Stays in MAF Subtree (Global)
- lib/maf/ - Core library
- scripts/maf/ - Operational scripts
- .claude/skills/ - Response Awareness
- mcp_agent_mail/ - Communication layer
- *.example files - Templates

## What Goes in Your .maf/ (Local)
- .maf/config/agent-topology.json - Your agent team
- .maf/agents/<name>-prompt.md - Your agent prompts
- scripts/maf/prompt-packs/<project>-*.json - Your workflows
- .maf/TEAM-CONFIG.md - Your team docs

## Override Resolution Order
1. .maf/overrides/ - Your customizations (highest priority)
2. .maf/config/ - Your project configuration
3. maf/templates/ - Framework examples (fallback)
4. maf/ - Core framework (default)
EOF
```

---

### Roundtable (`/root/projects/roundtable`)

#### Current State: 🟡 MODERATE DRIFT

**What's Working:**
- ✅ Core library perfectly synchronized
- ✅ Response Awareness skills identical
- ✅ MCP Agent Mail properly shared

**Problems:**
1. Enhanced scripts not in HQ (4 files)
2. Roundtable prompt packs leaked into HQ
3. Missing 2 HQ scripts

#### Migration Plan for Roundtable

```bash
# Phase 1: Convert to subtree model (if not already)
cd /root/projects/roundtable

# Check if maf/ exists as subtree
if [ ! -d "maf" ]; then
  # Preserve existing lib/maf
  git mv lib/maf lib/maf__legacy_preserve
  git commit -m "chore: preserve lib/maf before subtree conversion"

  # Add MAF HQ as subtree
  git subtree add --prefix=maf https://github.com/iamnormalfree/maf.git main --squash

  # Migrate any local customizations to .maf/
  # (manual step based on what's valuable)
fi

# Phase 2: Ensure local overrides are in .maf/
# (already correct, no action needed)

# Phase 3: Add CI guard
mkdir -p .github/workflows
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
      - name: Check maf/ subtree
        run: |
          if git diff --name-only origin/main...HEAD | grep -q "^maf/"; then
            if [[ "$(github.event.pull_request.labels.*.name)" != *"maf-upgrade"* ]]; then
              echo "::error::Cannot modify maf/ subtree without maf-upgrade label"
              exit 1
            fi
          fi
EOF

# Phase 4: Create local override structure
mkdir -p .maf/overrides/{scripts,prompts}
# Move any project-specific scripts here if needed
```

---

### Nextnest (`/root/projects/nextnest`)

#### Current State: 🔴 CRITICAL DRIFT

**Critical Issues:**
1. Modified subtree files (agent-topology.json, prompt-agent.sh, etc.)
2. Untracked files in subtree
3. Dual configuration system
4. Mixed local/global content

#### Migration Plan for Nextnest

```bash
# Phase 1: Restore subtree to pristine state
cd /root/projects/nextnest

# Restore modified files
git checkout maf/.maf/config/agent-topology.json
git checkout maf/scripts/maf/context-manager-v2.sh
git checkout maf/scripts/maf/prompt-agent.sh
git checkout maf/scripts/maf/rebuild-maf-cli-agents.sh

# Phase 2: Move untracked files to local
mkdir -p scripts/maf
mv maf/scripts/maf/agent-startup.sh scripts/maf/
mv maf/scripts/maf/context-manager-nextnest.sh scripts/maf/
mv maf/scripts/maf/init-nextnest-agents.sh scripts/maf/

# Phase 3: Consolidate to single configuration
# Ensure .maf/config/agent-topology.json has all Nextnest config
# (already has correct content: RateRidge, AuditBay, etc.)

# Phase 4: Add CI guard
mkdir -p .github/workflows
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
      - name: Check maf/ subtree
        run: |
          if git diff --name-only origin/main...HEAD | grep -q "^maf/"; then
            if [[ "$(github.event.pull_request.labels.*.name)" != *"maf-upgrade"* ]]; then
              echo "::error::Cannot modify maf/ subtree without maf-upgrade label"
              exit 1
            fi
          fi
EOF

# Phase 5: Clean up duplicate scripts/maf/ if present
# (decide: is this for overrides or duplication?)
# If duplication: remove it
# If overrides: document purpose in README
```

---

## Part 3: Systematic Classification Framework

### Decision Matrix for Any File

```
For any file in question, ask:

1. Does this contain domain-specific business logic?
   YES → LOCAL (.maf/, scripts/maf/overrides/)
   NO → Continue

2. Would this be useful for ANY project using MAF?
   YES → GLOBAL (maf/ subtree)
   NO → LOCAL

3. Does this reference project-specific agents, paths, or domains?
   YES → LOCAL
   NO → GLOBAL (possibly)

4. Is this a configuration or template?
   Config → LOCAL (.maf/config/)
   Template → GLOBAL (maf/templates/ with .example suffix)
```

### File Type Reference

| File Extension/Purpose | Global? | Local? | Notes |
|------------------------|--------|--------|-------|
| `lib/maf/*.js` | ✅ | ❌ | Core framework |
| `scripts/maf/*.sh` | ✅ | ⚠️ | Usually global, local if in overrides/ |
| `.maf/agents/*.md` | ❌ | ✅ | Agent prompts are project-specific |
| `.maf/config/*.json` | ❌ | ✅ | Configuration is local |
| `*.example.*` | ✅ | ❌ | Examples are templates |
| `*.schema.json` | ✅ | ❌ | Schemas define structure |
| `docs/maf/**` | ✅ | ❌ | Framework documentation |
| `docs/product/**` | ❌ | ✅ | Product documentation |
| `apps/**` | ❌ | ✅ | Business logic |

---

## Part 4: Execution Timeline

### Week 1: Clean MAF HQ
- [ ] Remove Roundtable-specific configs
- [ ] Pull enhanced scripts from Roundtable
- [ ] Add innovations from Nextnest (agent type mappings)
- [ ] Create template files
- [ ] Update documentation

### Week 2: Fix Nextnest (Canary)
- [ ] Restore subtree to pristine
- [ ] Move untracked files to local
- [ ] Consolidate configuration
- [ ] Add CI guard
- [ ] Test agent spawn

### Week 3: Update Roundtable
- [ ] Ensure subtree is clean
- [ ] Pull latest from HQ
- [ ] Add CI guard
- [ ] Document local overrides
- [ ] Test agent spawn

### Week 4: Validate and Document
- [ ] Test subtree pull on all repos
- [ ] Verify CI guards work
- [ ] Create runbooks
- [ ] Train team on new process

---

## Part 5: Success Criteria

### Technical
- ✅ MAF HQ has no project-specific content
- ✅ All consumer repos have clean `maf/` subtrees
- ✅ CI guards prevent subtree modifications
- ✅ Override resolution order is documented
- ✅ Subtree pulls work without conflicts

### Operational
- ✅ Clear distinction between global and local
- ✅ Team knows where to put customizations
- ✅ Upgrade process is standardized
- ✅ Drift detection is automated

### Governance
- ✅ 4-question filter is documented
- ✅ Doctrine manifest is lightweight
- ✅ Escape hatch (CORE_OVERRIDE.md) exists
- ✅ Weekly MAF Wednesday process is defined

---

## Appendix: File Inventory

### Files to Move in MAF HQ

| From | To | Reason |
|------|-----|--------|
| `.maf/config/agent-topology.json` | `.maf/config/agent-topology.json.example` | Template |
| `.maf/agents/greenmountain-prompt.md` | DELETE | Roundtable-specific |
| `.maf/agents/blackdog-prompt.md` | DELETE | Roundtable-specific |
| `scripts/maf/prompt-packs/roundtable-*.json` | DELETE | Roundtable-specific |
| `.maf/TEAM-CONFIG.md` | `.maf/TEAM-CONFIG.md.example` | Template |

### Files to Copy to MAF HQ

| From | To | Reason |
|------|-----|--------|
| `roundtable/scripts/maf/lib/agent-utils.sh` | `scripts/maf/lib/` | Enhanced version |
| `roundtable/scripts/maf/lib/credential-manager.sh` | `scripts/maf/lib/` | Enhanced version |
| `roundtable/scripts/maf/lib/profile-loader.sh` | `scripts/maf/lib/` | Enhanced version |
| `roundtable/scripts/maf/lib/tmux-utils.sh` | `scripts/maf/lib/` | Enhanced version |
| `nextnest/maf/scripts/maf/context-manager-nextnest.sh` | `scripts/maf/context-manager-wrapper.sh.example` | Wrapper pattern |
| `nextnest/maf/scripts/maf/agent-startup.sh` | `scripts/maf/agent-startup.sh.example` | Injection pattern |

### Files to Move in Nextnest

| From | To | Reason |
|------|-----|--------|
| `maf/scripts/maf/agent-startup.sh` | `scripts/maf/agent-startup.sh` | Local customization |
| `maf/scripts/maf/context-manager-nextnest.sh` | `scripts/maf/` | Local customization |
| `maf/scripts/maf/init-nextnest-agents.sh` | `scripts/maf/` | Local customization |

---

**Next Steps:**
1. Review and approve this plan
2. Start Week 1: Clean MAF HQ
3. Execute remaining weeks in order
4. Validate and iterate

**Questions before starting:**
- Should we backup all repos before migration?
- Who needs to review/approve the changes?
- What's the rollback plan if something breaks?
