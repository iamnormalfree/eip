# Beads-Driven Development

**Purpose:** Execute ready beads autonomously with subagent-driven workflow and two-stage review. Loops until no ready beads remain.

**Usage:** `/bdd` or `/bdd [label]` or `/bdd [bead-id]`

**Examples:**
- `/bdd` - Execute all ready beads
- `/bdd constraint-a` - Execute ready beads with constraint-a label
- `/bdd nextnest-4f9` - Execute specific bead

---

## Instructions for Claude

When user runs this command, invoke the `beads-driven-development` skill:

```
Use the beads-driven-development skill to execute ready beads.
```

**If user provides a label:**
```bash
# Get beads with specific label
bd ready --label [label] --json
```

**If user provides a bead-id:**
```bash
# Execute only that specific bead
bd show [bead-id]
```

**If no arguments:**
```bash
# Execute all ready beads
bd ready --json
```

---

## Quick Reference

**What happens:**
1. Get ready beads (from label/specific/all)
2. For each bead: implementer → spec review → code review → close/reopen
3. Loop until no ready beads remain
4. Report completion summary

**Beads executed:** Subagents work autonomously, no human-in-loop during execution

**Quality gates:** Two-stage review (spec compliance → code quality) after each bead

---

*Command created: 2025-01-26*
