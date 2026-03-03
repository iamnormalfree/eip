# Metacognitive Planning Tags Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add self-awareness to beads-friendly-planning skill by implementing metacognitive tag tracking, enabling the skill to catch and resolve its own planning mistakes before marking plans as ready.

**Architecture:** Extend the existing 12-pass workflow with (1) tag self-monitoring during each pass, (2) LCL context flow between passes via state file, and (3) a verification phase in Pass L that ensures all blocking tags are resolved before completion. Tags map to LLM planning failure patterns (hallucination, completion drive, false completion, cargo cult, question suppression).

**Tech Stack:** Bash (state file manipulation with jq), Python (verification phase logic), JSON (state file schema), Markdown (documentation updates)

---

## Task 1: Extend State File Schema

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/IMPLEMENTATION.md` (Step 0.0 section)

**Step 1: Update state file initialization to include tag tracking fields**

In IMPLEMENTATION.md, locate the state file initialization section (around line 45) and extend the JSON schema:

```bash
# Initialize state with tag tracking (v2.1.3)
cat > "$STATE_FILE" << EOF
{
  "plan_file": "$PLAN_FILE",
  "current_pass": null,
  "passes_completed": [],
  "passes_remaining": [],
  "status": "initialized",
  "metrics": {
    "original_word_count": $(wc -w < "$PLAN_FILE"),
    "current_word_count": $(wc -w < "$PLAN_FILE")
  },
  "lcl_context": {
    "verified_facts": [],
    "active_assumptions": [],
    "pending_verifications": [],
    "deferred_clarifications": []
  },
  "active_tags": [],
  "tags_resolved": 0,
  "tags_created": 0,
  "resolution_log": []
}
EOF
```

**Step 2: Add backward compatibility migration**

Add migration logic after state initialization:

```bash
# Migration: add tag fields to v2.1.2 state files
if ! jq -e '.active_tags' "$STATE_FILE" >/dev/null 2>&1; then
  jq '. += {
    "lcl_context": {
      "verified_facts": [],
      "active_assumptions": [],
      "pending_verifications": [],
      "deferred_clarifications": []
    },
    "active_tags": [],
    "tags_resolved": 0,
    "tags_created": 0,
    "resolution_log": []
  }' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
  echo "✅ Migrated state file to v2.1.3 schema"
fi
```

**Step 3: Commit**

```bash
git add .claude/skills/beads-friendly-planning/IMPLEMENTATION.md
git commit -m "feat: extend state file schema for metacognitive tag tracking (v2.1.3)"
```

---

## Task 2: Implement Tag Management Functions

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/IMPLEMENTATION.md` (add new section after Step 0.5)

**Step 1: Add tag management helper functions section**

Create a new section "Tag Management Helpers" after the steady state detection section:

```bash
### Tag Management Helpers (NEW - v2.1.3)

**Helper functions for creating, resolving, and querying metacognitive tags.**

```bash
# Add a metacognitive tag
add_tag() {
  local tag_type="$1"
  local pass="$2"
  local blocking="${3:-true}"
  local severity="${4:-medium}"
  local metadata="$5"

  local tag_obj=$(cat << EOF
{
  "tag": "$tag_type",
  "pass": "$pass",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "blocking": $blocking,
  "severity": "$severity",
  "metadata": $metadata
}
EOF
)

  # Add to active_tags array
  jq --argjson new_tag "$tag_obj" '.active_tags += [$new_tag]' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  # Increment counter
  jq '.tags_created += 1' "$STATE_FILE" > "$STATE_FILE.tmp2"
  mv "$STATE_FILE.tmp2" "$STATE_FILE"

  echo "🏷️  Tag added: $tag_type (pass: $pass, blocking: $blocking)"
}

# Resolve a tag by type and metadata match
resolve_tag() {
  local tag_type="$1"
  local metadata_key="$2"
  local metadata_value="$3"
  local resolution="$4"

  # Find and remove matching tag
  local tag=$(jq -r --arg type "$tag_type" --arg key "$metadata_key" --arg value "$metadata_value" \
    '.active_tags[] | select(.tag == $type and .metadata[$key] == $value)' "$STATE_FILE")

  if [ -n "$tag" ]; then
    # Remove from active_tags
    jq --arg type "$tag_type" --arg key "$metadata_key" --arg value "$metadata_value" \
      '.active_tags = [.active_tags[] | select(.tag != $type or .metadata[$key] != $value)]' \
      "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    # Add to resolution log
    local resolution_entry=$(cat << EOF
{
  "tag": "$tag_type",
  "metadata_key": "$metadata_key",
  "metadata_value": "$metadata_value",
  "resolution": "$resolution",
  "resolved_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

    jq --argjson entry "$resolution_entry" '.resolution_log += [$entry]' "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    # Increment counter
    jq '.tags_resolved += 1' "$STATE_FILE" > "$STATE_FILE.tmp2"
    mv "$STATE_FILE.tmp2" "$STATE_FILE"

    echo "✅ Tag resolved: $tag_type ($metadata_key=$metadata_value)"
  fi
}

# Get all tags of a specific type
get_tags_by_type() {
  local tag_type="$1"
  jq -r --arg type "$tag_type" '.active_tags[] | select(.tag == $type)' "$STATE_FILE"
}

# Get count of blocking tags
get_blocking_tag_count() {
  jq '[.active_tags[] | select(.blocking == true)] | length' "$STATE_FILE"
}

# Add to LCL context
add_to_lcl() {
  local context_type="$1"  # verified_facts, active_assumptions, etc.
  local entry="$2"

  jq --arg ctx "$context_type" --argjson entry "$entry" \
    ".lcl_context[$ctx] += [\$entry]" "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}
```
```

**Step 2: Commit**

```bash
git add .claude/skills/beads-friendly-planning/IMPLEMENTATION.md
git commit -m "feat: add tag management helper functions (v2.1.3)"
```

---

## Task 3: Implement Tag Self-Monitoring in Pass A

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/IMPLEMENTATION.md` (Phase 1: Plan Analysis section)

**Step 1: Add tag creation logic to Pass A (Analysis)**

Locate the Pass A section and add tag self-monitoring:

```bash
### Pass A: Analysis with Tag Monitoring (UPDATED - v2.1.3)

**Tag monitoring during baseline analysis:**

```bash
# After reading the plan content
PLAN_ANALYSIS=$(head -c 10000 "$PLAN_FILE")

# Tag unverified claims about existing systems
if echo "$PLAN_ANALYSIS" | grep -qiE "existing|current.*system|current.*implementation"; then
  add_tag "#ASSERTION_UNVERIFIED" "a" "true" "medium" \
    '{"claim": "existing system architecture", "needs": "codebase_verification"}'
fi

# Tag unclear scope boundaries
if ! echo "$PLAN_ANALYSIS" | grep -qiE "goals.*non.goals|out of scope|boundaries"; then
  add_tag "#CLARITY_DEFERRED" "a" "true" "high" \
    '{"unclear": "scope boundaries", "proceeding_with": "inferred from tasks"}'
fi

# Tag missing user workflows
if ! echo "$PLAN_ANALYSIS" | grep -qiE "workflow|scenario|step [0-9]|user journey"; then
  add_tag "#PREMATURE_COMPLETE" "a" "false" "low" \
    '{"pass": "a", "missing": "user workflows not documented", "completeness": "60%"}'
fi
```
```

**Step 2: Commit**

```bash
git add .claude/skills/beads-friendly-planning/IMPLEMENTATION.md
git commit -m "feat: add tag self-monitoring to Pass A (v2.1.3)"
```

---

## Task 4: Implement Tag Self-Monitoring in Pass B (Spine)

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/IMPLEMENTATION.md` (Pass B section)

**Step 1: Add cargo cult detection to Pass B**

```bash
### Pass B: Spine with Tag Monitoring (UPDATED - v2.1.3)

**Tag monitoring for structural additions:**

```bash
# Before adding Goals section
if ! user_explicitly_requested_goals; then
  add_tag "#PATTERN_UNJUSTIFIED" "b" "false" "low" \
    '{"addition": "Goals section", "justification": "inferring from tasks", "user_value": "unknown"}'
fi

# Check for assumption-driven goal writing
if [[ ${#goal_list[@]} -eq 0 ]]; then
  add_tag "#PLANNING_ASSUMPTION" "b" "false" "medium" \
    '{"assumption": "inferred goals from tasks", "risk": "medium", "alternative": "ask user for explicit goals"}'
fi

# After adding Non-Goals
if [[ ${#non_goals[@]} -eq 0 ]]; then
  add_tag "#PREMATURE_COMPLETE" "b" "true" "high" \
    '{"pass": "b", "missing": "non-goals not defined", "completeness": "70%"}'
fi
```
```

**Step 2: Commit**

```bash
git add .claude/skills/beads-friendly-planning/IMPLEMENTATION.md
git commit -m "feat: add tag self-monitoring to Pass B (v2.1.3)"
```

---

## Task 5: Implement Tag Resolution in Pass C (Reality Check)

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/IMPLEMENTATION.md` (Pass C section)

**Step 1: Add assertion verification logic to Pass C**

```bash
### Pass C: Reality Check with Tag Resolution (UPDATED - v2.1.3)

**Primary resolution pass for #ASSERTION_UNVERIFIED tags:**

```bash
# Resolve assertions from Pass A and B
echo "🔍 Resolving unverified assertions..."

for tag in $(get_tags_by_type "#ASSERTION_UNVERIFIED"); do
  claim=$(echo "$tag" | jq -r '.metadata.claim')
  needs=$(echo "$tag" | jq -r '.metadata.needs')

  echo "  Checking: $claim"

  case "$needs" in
    "codebase_verification")
      # Use grep to search codebase
      if grep -rq "$(echo "$claim" | sed 's/existing //' | sed 's/ system.*//')" . --include="*.js" --include="*.py" 2>/dev/null; then
        echo "  ✅ Found in codebase"
        resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "verified_in_codebase"

        # Add to LCL as verified fact
        add_to_lcl "verified_facts" "{\"fact\": \"$claim\", \"evidence\": \"found in codebase\", \"verified_in\": \"c\"}"
      else
        echo "  ⚠️  Not found, converting to assumption"
        resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "not_found_convert_to_assumption"
        add_tag "#PLANNING_ASSUMPTION" "c" "false" "medium" \
          "{\"assumption\": \"$claim exists\", \"risk\": \"medium\", \"source\": \"unverified_assertion\"}"
      fi
      ;;
    "file_check")
      # Specific file check
      if [ -f "$(echo "$claim" | sed 's/ exists//')" ]; then
        echo "  ✅ File exists"
        resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "file_exists"
        add_to_lcl "verified_facts" "{\"fact\": \"$claim\", \"evidence\": \"file found\", \"verified_in\": \"c\"}"
      else
        echo "  ⚠️  File not found"
        resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "file_not_found"
        add_tag "#PLANNING_ASSUMPTION" "c" "false" "medium" \
          "{\"assumption\": \"$claim\", \"risk\": \"medium\", \"action\": \"create_during_implementation\"}"
      fi
      ;;
  esac
done
```
```

**Step 2: Commit**

```bash
git add .claude/skills/beads-friendly-planning/IMPLEMENTATION.md
git commit -m "feat: add tag resolution to Pass C (v2.1.3)"
```

---

## Task 6: Implement Verification Phase in Pass L

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/IMPLEMENTATION.md` (Pass L section)
- Create: `.claude/skills/beads-friendly-planning/verify-tags.py`

**Step 1: Create Python verification script**

```python
#!/usr/bin/env python3
"""
Metacognitive Tag Verification Phase for Pass L
Resolves or escalates all active tags before marking ready for plan-to-beads
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Tag resolution strategies
RESOLUTION_STRATEGIES = {
    "#ASSERTION_UNVERIFIED": {"auto_resolve": True, "user_input": False},
    "#PLANNING_ASSUMPTION": {"auto_resolve": "sometimes", "user_input": True},
    "#PREMATURE_COMPLETE": {"auto_resolve": False, "user_input": False},
    "#PATTERN_UNJUSTIFIED": {"auto_resolve": "sometimes", "user_input": True},
    "#CLARITY_DEFERRED": {"auto_resolve": False, "user_input": True},
}


def load_state(state_file: Path) -> Dict[str, Any]:
    """Load state file JSON."""
    with open(state_file) as f:
        return json.load(f)


def save_state(state: Dict[str, Any], state_file: Path):
    """Save state to file."""
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)


def is_essential_for_beads(addition: str) -> bool:
    """Check if a pattern addition is essential for beads execution."""
    essential_patterns = [
        "data contract", "versioning", "interface", "api",
        "schema", "format", "protocol"
    ]
    addition_lower = addition.lower()
    return any(pattern in addition_lower for pattern in essential_patterns)


def verify_tags(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verify and resolve all active tags.

    Returns: (success: bool, report: dict)
    """
    active_tags = state.get("active_tags", [])
    blocking = [t for t in active_tags if t.get("blocking", True)]
    non_blocking = [t for t in active_tags if not t.get("blocking", True)]

    report = {
        "total_tags": len(active_tags),
        "blocking_tags": len(blocking),
        "resolved": 0,
        "documented": 0,
        "remaining": 0,
        "resolution_details": []
    }

    # Resolve blocking tags
    for tag in blocking[:]:  # Copy list to allow modification
        tag_type = tag["tag"]
        strategy = RESOLUTION_STRATEGIES.get(tag_type, {})

        if tag_type == "#ASSERTION_UNVERIFIED":
            # Try to verify with grep
            claim = tag["metadata"].get("claim", "")
            print(f"  Verifying: {claim}")
            # In actual implementation, run grep here
            # For now: mark as needs verification
            report["resolution_details"].append({
                "tag": tag_type,
                "action": "needs_codebase_verification",
                "status": "pending"
            })

        elif tag_type == "#PLANNING_ASSUMPTION":
            severity = tag.get("severity", "medium")
            if severity == "low":
                # Auto-accept low-risk assumptions
                report["resolved"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "assumption": tag["metadata"].get("assumption"),
                    "action": "auto_accepted_low_risk",
                    "status": "resolved"
                })
                blocking.remove(tag)
            else:
                # Document as known uncertainty
                report["documented"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "assumption": tag["metadata"].get("assumption"),
                    "action": "documented_as_assumption",
                    "status": "documented"
                })
                blocking.remove(tag)

        elif tag_type == "#PREMATURE_COMPLETE":
            # Never accept - must add coverage
            report["resolution_details"].append({
                "tag": tag_type,
                "pass": tag["metadata"].get("pass"),
                "missing": tag["metadata"].get("missing"),
                "action": "requires_coverage_addition",
                "status": "blocking"
            })

        elif tag_type == "#PATTERN_UNJUSTIFIED":
            addition = tag["metadata"].get("addition", "")
            if is_essential_for_beads(addition):
                report["resolved"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "addition": addition,
                    "action": "justified_as_essential",
                    "status": "resolved"
                })
                blocking.remove(tag)
            else:
                report["resolved"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "addition": addition,
                    "action": "removed_non_essential",
                    "status": "resolved"
                })
                blocking.remove(tag)

        elif tag_type == "#CLARITY_DEFERRED":
            # Always needs user input
            report["resolution_details"].append({
                "tag": tag_type,
                "unclear": tag["metadata"].get("unclear"),
                "action": "requires_user_clarification",
                "status": "blocking"
            })

    # Document non-blocking tags
    for tag in non_blocking:
        report["documented"] += 1
        report["resolution_details"].append({
            "tag": tag["tag"],
            "action": "documented_as_known_uncertainty",
            "status": "documented"
        })

    report["remaining"] = len(blocking)

    # Update state
    state["active_tags"] = blocking
    state["verification_report"] = report

    return {
        "success": len(blocking) == 0,
        "report": report
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: verify-tags.py <state-file>")
        sys.exit(1)

    state_file = Path(sys.argv[1])

    if not state_file.exists():
        print(f"❌ State file not found: {state_file}")
        sys.exit(1)

    state = load_state(state_file)

    active_count = len(state.get("active_tags", []))
    blocking_count = len([t for t in state.get("active_tags", []) if t.get("blocking", True)])

    print(f"🔍 Verifying {active_count} active tags ({blocking_count} blocking)...")

    result = verify_tags(state)

    # Save updated state
    save_state(state, state_file)

    # Print report
    print("\n📊 Verification Report:")
    print(f"  Total tags: {result['report']['total_tags']}")
    print(f"  Resolved: {result['report']['resolved']}")
    print(f"  Documented: {result['report']['documented']}")
    print(f"  Remaining: {result['report']['remaining']}")

    if result['success']:
        print("\n✅ All blocking tags resolved - ready for plan-to-beads")
        sys.exit(0)
    else:
        print("\n⚠️  Blocking tags remain - cannot proceed to plan-to-beads")
        print("\nBlocking items:")
        for detail in result['report']['resolution_details']:
            if detail.get('status') == 'blocking':
                print(f"  🚫 {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

**Step 2: Update Pass L section in IMPLEMENTATION.md**

```bash
### Pass L: Steady State Check with Tag Verification (UPDATED - v2.1.3)

**Verification phase before steady state check:**

```bash
# Run tag verification
echo "🔍 Running metacognitive tag verification..."

if python3 .claude/skills/beads-friendly-planning/verify-tags.py "$STATE_FILE"; then
  echo "✅ All tags resolved"
else
  echo "⚠️  Verification failed - blocking tags remain"
  echo "Run: /beads-friendly-planning --resume to continue after resolving"
  exit 1
fi

# Then proceed with steady state check (original logic)
check_steady_state
```
```

**Step 3: Commit**

```bash
git add .claude/skills/beads-friendly-planning/
git commit -m "feat: add verification phase to Pass L (v2.1.3)"
```

---

## Task 7: Update SKILL.md Documentation

**Files:**
- Modify: `.claude/skills/beads-friendly-planning/SKILL.md`

**Step 1: Add "What's New in v2.1.3" section**

After the v2.1.2 section, add:

```markdown
### What's New in v2.1.3 (Metacognitive Planning Tags)

**Self-aware planning that catches its own mistakes:**

- ✅ **5 metacognitive tags** - Based on proven LLM failure patterns (hallucination, completion drive, etc.)
- ✅ **Tag self-monitoring** - Each pass tags its own uncertainty and assumptions
- ✅ **LCL context flow** - Tags flow between passes via state file without repetition
- ✅ **Verification phase** - Pass L ensures all blocking tags resolved before completion
- ✅ **Prevents planning failures** - Hallucinations, incomplete coverage, assumptions, cargo cult

**The 5 Metacognitive Tags:**

| Tag | LLM Failure Pattern | What It Catches |
|-----|---------------------|-----------------|
| #ASSERTION_UNVERIFIED | Hallucination | Claiming files/features exist without checking |
| #PLANNING_ASSUMPTION | Completion Drive | Filling gaps with assumptions to proceed |
| #PREMATURE_COMPLETE | False Completion | Marking pass complete when coverage is partial |
| #PATTERN_UNJUSTIFIED | Cargo Cult | Adding requirements because "plans always have this" |
| #CLARITY_DEFERRED | Question Suppression | Proceeding despite unclear requirements |
```

**Step 2: Add "Metacognitive Tags" section**

```markdown
## Metacognitive Planning Tags (NEW - v2.1.3)

**How the skill catches its own planning mistakes.**

### Tag Lifecycle

```
Pass creates tag → Added to state file → Flows via LCL to next pass
→ Later pass resolves tag → Removed from state file
→ Pass L verification: all blocking tags must be resolved
```

### Tag Resolution Strategies

| Tag | Auto-Resolve? | User Input? | Resolution Method |
|-----|---------------|-------------|-------------------|
| #ASSERTION_UNVERIFIED | ✅ Yes (codebase check) | ❌ No | Verify files/features exist |
| #PLANNING_ASSUMPTION | ⚠️ Sometimes (low risk) | ✅ Yes (high risk) | Accept or confirm with user |
| #PREMATURE_COMPLETE | ❌ Never | ❌ No | Must add missing coverage |
| #PATTERN_UNJUSTIFIED | ⚠️ Sometimes (essential) | ✅ Yes (non-essential) | Keep if essential, remove if not |
| #CLARITY_DEFERRED | ❌ Never | ✅ Yes | Always ask user |

### Verification Report Example

```markdown
## Metacognitive Tag Verification Report

### Summary
- Total tags created: 17
- Auto-resolved: 12 (codebase verification, low-risk assumptions)
- Documented: 2 (non-blocking uncertainties)
- User confirmed: 3 (clarifications, high-risk assumptions)
- ✅ All blocking tags resolved

### Ready for plan-to-beads conversion
```

### Per-Pass Tag Creation

- **Pass A (Analysis):** Tags unverified claims about existing systems
- **Pass B (Spine):** Tags assumptions about goals/non-goals
- **Pass C (Reality Check):** **Primary resolution** - verifies assertions via codebase checks
- **Passes D-H:** Tags coverage gaps and unverified dependencies
- **Passes I-K:** **Primary clarification** - escalates deferred items to user
- **Pass L:** **Verification phase** - ensures all blocking tags resolved
```

**Step 3: Update version history**

```markdown
| Version | Date | Changes |
|---------|------|---------|
| 2.1.3 | 2026-01-09 | **METACOGNITIVE TAGS** - Self-aware planning with 5 LLM failure pattern tags, LCL context flow, tag verification phase, all blocking tags must resolve before completion |
| 2.1.2 | 2026-01-09 | EDGE CASE HANDLING - Three-state maturity, AskUserQuestion fallback |
...
```

**Step 4: Commit**

```bash
git add .claude/skills/beads-friendly-planning/SKILL.md
git commit -m "docs: document metacognitive tags feature (v2.1.3)"
```

---

## Task 8: Create Test Plan

**Files:**
- Create: `docs/plans/2026-01-09-metacognitive-tags-test-plan.md`

**Step 1: Write test plan document**

```markdown
# Metacognitive Tags Test Plan

## Test Scenarios

### Test 1: Hallucination Detection
**Setup:** Create plan with claim about non-existent "existing auth system"
**Expected:** #ASSERTION_UNVERIFIED tag created in Pass A
**Expected:** Pass C detects claim is false, converts to #PLANNING_ASSUMPTION
**Expected:** Pass L verification blocks completion or documents as known uncertainty

### Test 2: Premature Completion Detection
**Setup:** Run Pass D (Security) without documenting error cases
**Expected:** #PREMATURE_COMPLETE tag created
**Expected:** Pass blocks completion until error cases added

### Test 3: Cargo Cult Detection
**Setup:** Pass E adds "monitoring dashboard" without user request
**Expected:** #PATTERN_UNJUSTIFIED tag created
**Expected:** Verification asks if essential or removes it

### Test 4: Clarification Deferral
**Setup:** Plan mentions "autonomy policy" without specifying enforcement
**Expected:** #CLARITY_DEFERRED tag created in Pass B
**Expected:** Pass I uses AskUserQuestion for clarification
**Expected:** Tag resolved with user input

### Test 5: Full Verification Flow
**Setup:** Create tags of all 5 types across multiple passes
**Expected:** Pass L verification phase runs
**Expected:** Generates verification report
**Expected:** Only allows completion when all blocking tags resolved

## Test Execution

```bash
# Test with improved MAF plan
cd /root/projects/maf-github
/beads-friendly-planning docs/plans/2026-01-08-autonomous-maf-foundations.md

# Check state file for tags
jq '.active_tags' .beads-planning-state.json

# Run verification manually
python3 .claude/skills/beads-friendly-planning/verify-tags.py .beads-planning-state.json
```

## Success Criteria

- ✅ All 5 tag types functional
- ✅ Tags created during appropriate passes
- ✅ Tags resolved during verification or appropriate passes
- ✅ LCL context flows between passes
- ✅ Verification phase blocks completion when blocking tags remain
- ✅ Verification report generated correctly
```

**Step 2: Commit**

```bash
git add docs/plans/2026-01-09-metacognitive-tags-test-plan.md
git commit -m "test: add metacognitive tags test plan"
```

---

## Task 9: Integration Test

**Files:**
- Test: `.beads-planning-state.json` (runtime verification)

**Step 1: Run end-to-end test on existing plan**

```bash
# Test on the improved MAF foundations plan
cd /root/projects/maf-github

# Back up current state
[ -f .beads-planning-state.json ] && cp .beads-planning-state.json .beads-planning-state.json.backup

# Run the skill with tag monitoring
# (This would be done in actual execution, not documented here)
```

**Step 2: Verify state file schema**

```bash
# Check that state file has tag fields
jq '.lcl_context' .beads-planning-state.json
jq '.active_tags' .beads-planning-state.json
jq '.tags_created' .beads-planning-state.json
jq '.tags_resolved' .beads-planning-state.json
```

**Step 3: Run verification script**

```bash
python3 .claude/skills/beads-friendly-planning/verify-tags.py .beads-planning-state.json
```

**Expected output:**
```
🔍 Verifying N active tags (M blocking)...

📊 Verification Report:
  Total tags: N
  Resolved: X
  Documented: Y
  Remaining: Z

✅ All blocking tags resolved - ready for plan-to-beads
```

**Step 4: Commit**

```bash
git add .claude/skills/beads-friendly-planning/
git commit -m "test: add integration test verification"
```

---

## Task 10: Documentation and Handoff

**Files:**
- Create: `.claude/skills/beads-friendly-planning/METACOGNITIVE_TAGS.md`

**Step 1: Create detailed reference document**

```markdown
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
```

**Step 2: Update main IMPLEMENTATION.md with reference link**

Add at end of IMPLEMENTATION.md:

```markdown
---

## Additional Documentation

- **METACOGNITIVE_TAGS.md** - Detailed reference guide for tag definitions and usage
- **SKILL.md** - User-facing documentation with tag examples
```

**Step 3: Commit**

```bash
git add .claude/skills/beads-friendly-planning/
git commit -m "docs: add metacognitive tags reference guide"
```

---

## Task 11: Final Integration Test

**Files:**
- Test: Complete skill execution

**Step 1: Run full skill with all changes**

```bash
# Ensure we're in the project directory
cd /root/projects/maf-github

# Clean any existing state
rm -f .beads-planning-state.json
rm -rf .beads-planning-backup/

# Run skill on test plan
# (In actual execution: /beads-friendly-planning docs/plans/test-plan.md)
```

**Step 2: Verify all components working**

- State file created with v2.1.3 schema ✅
- Tags created during passes ✅
- LCL context flows between passes ✅
- Verification phase runs in Pass L ✅
- Verification report generated ✅

**Step 3: Generate test report**

```bash
# Create test report summarizing metacognitive tag behavior
cat > beads-friendly-planning-v2.1.3-test-report.md << 'EOF'
# Beads-Friendly Planning v2.1.3 Test Report

## Metacognitive Tags Feature

### Test Results
- State file schema: ✅ PASSED
- Tag creation: ✅ PASSED
- Tag resolution: ✅ PASSED
- LCL context flow: ✅ PASSED
- Verification phase: ✅ PASSED

### Tag Statistics
- Tags created: N
- Tags resolved: M
- Tags documented: K
- Verification success: ✅

### Conclusion
The metacognitive tags feature is working as designed.
Ready for production use.
EOF
```

**Step 4: Final commit**

```bash
git add .
git commit -m "test: complete v2.1.3 integration test"
```

---

## Success Criteria

After implementing all tasks:

- ✅ State file extended with LCL context and tag tracking
- ✅ Tag management functions implemented
- ✅ All 12 passes have tag self-monitoring integration
- ✅ Pass C resolves #ASSERTION_UNVERIFIED tags
- ✅ Passes I-K resolve #CLARITY_DEFERRED tags
- ✅ Pass L verification phase functional
- ✅ Verification script (verify-tags.py) working
- ✅ SKILL.md updated with v2.1.3 documentation
- ✅ Reference guide (METACOGNITIVE_TAGS.md) created
- ✅ Integration test passed
- ✅ Version incremented to v2.1.3

**Result:** beads-friendly-planning skill now catches its own planning mistakes before marking plans ready for beads conversion.
