# MAF-BDD Orchestrator

**Purpose:** Execute ready beads using 3-agent model with MAF coordination + BDD discipline + BV intelligence.

**Usage:** `/maf-bdd`

**Examples:**
- `/maf-bdd` - Execute all ready beads with 3-agent orchestration

---

## Instructions for Claude

When user runs this command, invoke the `maf-bdd-orchestrator` skill:

```
Use the maf-bdd-orchestrator skill to execute ready beads using the 3-agent autonomous model.
```

---

## Quick Reference

**What happens:**
1. Coordinator runs BV robot triage for priorities
2. Gets ready beads: `bd ready --json`
3. Analyzes dependencies and forms parallel-safe groups
4. For each group:
   - Spawns implementer agent per bead (TDD workflow)
   - Spawns reviewer agent for two-stage review
   - Closes or reopens beads based on review
5. Re-triages after each group completion
6. Loops until no ready beads remain

**Agents:**
- Coordinator: Orchestrates workflow, manages state
- Implementer: Fresh agent per bead, follows TDD
- Reviewer: Fresh agent per bead, two-stage review

**Quality gates:** Two-stage review (spec compliance + code quality) after each bead

---

*Command created: 2026-01-26*
