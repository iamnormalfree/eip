# Metacognitive Planning Tags - Reference Guide

## Overview

Metacognitive tags enable beads-friendly-planning to catch its own planning mistakes by making uncertainty explicit. This prevents common LLM planning failures: hallucinations, assumptions, incomplete coverage, cargo cult additions, and ambiguous requirements.

## Tag Definitions

### #ASSERTION_UNVERIFIED

**Trigger:** Making a factual claim about the codebase without verification

**Example:**
```
The existing auth service provides JWT validation
→ #ASSERTION_UNVERIFIED: claim="existing auth service" :: needs="file_check"
```

**Resolution:** Pass C (Reality Check) verifies with grep/file checks

### #PLANNING_ASSUMPTION

**Trigger:** Filling a gap with an assumption to proceed

**Example:**
```
Agents will use existing MAF control console
→ #PLANNING_ASSUMPTION: assumption="control console exists" :: risk="medium"
```

**Resolution:** Low-risk auto-accepted, high-risk escalated to user

### #PREMATURE_COMPLETE

**Trigger:** Marking a pass complete when coverage is partial

**Example:**
```
Pass D marked complete but error cases not covered
→ #PREMATURE_COMPLETE: pass="d" :: missing="error case invariants" :: completeness="60%"
```

**Resolution:** Must add missing coverage (never accept incomplete)

### #PATTERN_UNJUSTIFIED

**Trigger:** Adding content because "plans always have this"

**Example:**
```
Added performance budgets without user request
→ #PATTERN_UNJUSTIFIED: addition="performance budgets" :: justification="not in requirements"
```

**Resolution:** Keep if essential for beads, remove if not

### #CLARITY_DEFERRED

**Trigger:** Proceeding despite unclear requirements

**Example:**
```
"Autonomy policy" mentioned but enforcement unclear
→ #CLARITY_DEFERRED: unclear="policy enforcement" :: proceeding_with="hybrid"
```

**Resolution:** Always ask user via AskUserQuestion

## State File Schema

```json
{
  "lcl_context": {
    "verified_facts": [
      {"fact": "...", "evidence": "...", "verified_in": "c"}
    ],
    "active_assumptions": [
      {"assumption": "...", "risk": "medium"}
    ]
  },
  "active_tags": [
    {"tag": "#ASSERTION_UNVERIFIED", "pass": "b", "blocking": true, "metadata": {...}}
  ],
  "tags_resolved": 12,
  "tags_created": 17
}
```

## Per-Pass Tag Flow

```
Pass A: Create tags for unverified claims
  ↓ LCL
Pass B: Create tags for structural assumptions
  ↓ LCL
Pass C: Resolve #ASSERTION_UNVERIFIED tags (primary resolution)
  ↓ LCL
Passes D-H: Create/resolves tags for domain-specific concerns
  ↓ LCL
Passes I-K: Resolve #CLARITY_DEFERRED (primary clarification)
  ↓ LCL
Pass L: Verification phase - ensure all blocking tags resolved
```

## Verification Phase

Pass L runs `verify-tags.py` which:

1. Loads state file and active_tags array
2. Categorizes tags by blocking status
3. Resolves auto-resolvable tags
4. Escalates user-required tags via AskUserQuestion
5. Documents non-blocking tags as "known uncertainties"
6. Only allows steady state if all blocking tags resolved

## Troubleshooting

**Tags not being created:** Check that tag management functions are loaded in IMPLEMENTATION.md

**Tags not resolving:** Check Pass C for #ASSERTION_UNVERIFIED resolution logic

**Verification failing:** Check active_tags in state file for blocking items

**Tags in plan output:** Tags should NEVER appear in plan markdown - only in state file
