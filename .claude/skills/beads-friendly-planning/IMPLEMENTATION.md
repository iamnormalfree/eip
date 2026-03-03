# Implementation Workflow for Beads-Friendly Planning

**For:** Claude (when beads-friendly-planning skill is invoked)

**Your Role:** You are a **Plan Architect** specializing in transforming implementation plans into MAF-ready, swarm-executable specifications.

---

## When This Skill Is Invoked

User runs: `/beads-friendly-planning <plan-file> [supporting-files...]`

Your job: Transform the plan through 4 phases:
1. Plan Analysis
2. Multi-Pass Improvement (8+ passes)
3. Beads Conversion
4. Bead Validation

---

## Phase 0: Complexity Assessment (NEW - Early-Exit Mechanism)

### Step 0.0: Initialize State and Backup Infrastructure

**IMPORTANT:** Before any assessment, create backup directory and initialize state tracking.

```bash
# Enable strict mode for error handling
set -euo pipefail

# Validate required dependencies
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required but not installed. Aborting." >&2; exit 1; }

# Get plan file from first argument
PLAN_FILE="${1:-}"
if [ -z "$PLAN_FILE" ]; then
  echo "Error: Plan file argument is required" >&2
  exit 1
fi

if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: Plan file not found: $PLAN_FILE" >&2
  exit 1
fi

# Create backup directory
BACKUP_DIR=".beads-planning-backup"
mkdir -p "$BACKUP_DIR"

# Create state file
STATE_FILE=".beads-planning-state.json"

# Initialize state if this is a new session
if [ ! -f "$STATE_FILE" ]; then
  # Get word count with error handling
  WORD_COUNT=$(wc -w < "$PLAN_FILE" 2>/dev/null || echo "0")

  cat > "$STATE_FILE" << EOF
{
  "plan_file": "$PLAN_FILE",
  "current_pass": null,
  "passes_completed": [],
  "passes_remaining": [],
  "status": "initialized",
  "ready_for_plan_to_beads": false,
  "metrics": {
    "original_word_count": $WORD_COUNT,
    "current_word_count": $WORD_COUNT,
    "backup_count": 0
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
  "resolution_log": [],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  echo "✅ State file created: $STATE_FILE"
fi

# Migration: add tag fields to older state files
SCHEMA_VERSION="v2.1.3"
if ! jq -e '.active_tags' "$STATE_FILE" >/dev/null 2>&1; then
  if jq '. += {
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
  }' "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null; then
    mv "$STATE_FILE.tmp" "$STATE_FILE"
    echo "✅ Migrated state file to $SCHEMA_VERSION schema"
  else
    echo "Error: Failed to migrate state file" >&2
    rm -f "$STATE_FILE.tmp"
    exit 1
  fi
fi

# Backup original plan
BACKUP_FILE="$BACKUP_DIR/original-plan-$(date +%Y%m%d-%H%M%S).md"
cp "$PLAN_FILE" "$BACKUP_FILE"
echo "✅ Original plan backed up to: $BACKUP_FILE"
```

### Step 0.1: LLM-Based Plan Maturity Scan (FIXED v2.1.2 - Semantic + Variance Handling)

**FIXED v2.1.2:**
- Previously used brittle grep patterns
- Now uses LLM semantic analysis for accurate quality assessment
- **NEW:** Handles semantic interpretation variance with "Partial" state
- **NEW:** Provides explicit examples of semantic equivalents
- **NEW:** Uses conservative counting (Partial counts as Present for routing)

```bash
# Read the plan content
PLAN_CONTENT=$(cat "$PLAN_FILE")

# Use LLM to assess plan quality semantically
# This replaces the old grep-based approach which was too strict
MATURITY_ASSESSMENT=$(cat << ASSESSMENT_PROMPT
You are assessing the maturity of an implementation plan for swarm-executable quality.

Analyze the following plan and assess it against 8 quality markers.

**CRITICAL SCORING RULES:**
- Rate "present" (true) if the marker exists in ANY form, even partially
- Rate "partial" ONLY if content exists but needs significant expansion
- When in doubt, be INCLUSIVE - better to over-count than under-count
- "Partial" counts as 0.5 toward present_count for routing purposes

**Quality Markers with Semantic Equivalents:**

1. **Structure** (Goals/Non-Goals):
   - Explicit keywords: "## Goals", "## Non-Goals", "## Out of Scope"
   - Semantic equivalents: "What we're building", "What we're NOT building", "Scope boundaries"
   - Partial: Goal stated but non-goals missing, or vice versa

2. **Workflows** (Step-by-step flows):
   - Explicit: "## User Workflows", "## Usage Flows", "## Scenarios"
   - Semantic: Step-by-step numbered lists, "Step 1, Step 2, Step 3", flow diagrams
   - Partial: High-level flow without specific steps, or only one workflow covered

3. **Security** (Invariants, MUST NEVER/ALWAYS):
   - Explicit: "## Security", "## Invariants", "MUST NEVER", "MUST ALWAYS"
   - Semantic: "Security considerations", "Error handling that must never happen", "Forbidden states"
   - Partial: Security mentioned but no explicit invariants, or invariants only for one component

4. **Data** (Formats, schemas, contracts):
   - Explicit: "## Data Contract", "## VERSIONING_GUIDE", "## Schemas"
   - Semantic: JSON examples, API response formats, "data structure:", "payload format"
   - Partial: Some formats defined but not all, or formats implied but not explicit

5. **Performance** (Budgets, SLAs):
   - Explicit: "## Performance", "p50/p95/p99", "SLA", "latency budget"
   - Semantic: "must complete within", "response time", "throughput targets"
   - Partial: Performance mentioned but no specific numbers, or only one metric defined

6. **Testing** (Test strategy/matrix):
   - Explicit: "## Testing Strategy", "## Test Matrix", "## Test Plan"
   - Semantic: "We will test", "test coverage", "unit + integration + E2E"
   - Partial: Testing mentioned but no comprehensive strategy, or only one test type

7. **Failures** (Edge cases, error modes):
   - Explicit: "## Failure Modes", "## Error Handling", "## Edge Cases"
   - Semantic: "What happens when", "error scenarios", "failure handling", "degraded mode"
   - Partial: Some errors covered but not comprehensive, or only happy path documented

8. **Acceptance** (E2E success criteria):
   - Explicit: "## Acceptance Criteria", "## Definition of Done", "## Success Criteria"
   - Semantic: "We know we're done when", "success looks like", "completion markers"
   - Partial: Success mentioned but not measurable, or only technical criteria (no user value)

**Plan Content:**
$(head -c 50000 "$PLAN_FILE")  # First 50K chars for analysis

**Output Format (JSON only, no explanation):**
{
  "markers": {
    "structure": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "workflows": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "security": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "data": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "performance": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "testing": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "failures": {"status": "present/partial/missing", "evidence": "brief explanation with quote"},
    "acceptance": {"status": "present/partial/missing", "evidence": "brief explanation with quote"}
  },
  "present_count": 0-8,
  "partial_count": 0-8,
  "maturity_pct": 0-100,
  "routing_recommendation": "minimal/targeted/standard/comprehensive"
}
ASSESSMENT_PROMPT
)

# Parse the LLM assessment (use jq for JSON parsing)
# Handle JSON parsing errors with fallback
if ! MATURITY_JSON=$(echo "$MATURITY_ASSESSMENT" | jq -r '.' 2>/dev/null); then
  echo "⚠️  Warning: LLM output parsing failed, using conservative default"
  # Conservative default: assume standard mode
  present_count=4
  partial_count=0
  plan_maturity_pct=50
  routing="standard"
  MATURITY_JSON='{"markers":{}}'
else
  # Extract values
  present_count=$(echo "$MATURITY_JSON" | jq -r '.present_count // 0')
  partial_count=$(echo "$MATURITY_JSON" | jq -r '.partial_count // 0')
  plan_maturity_pct=$(echo "$MATURITY_JSON" | jq -r '.maturity_pct // 50')
  routing=$(echo "$MATURITY_JSON" | jq -r '.routing_recommendation // "standard"')
fi

# FIXED v2.1.2: Partial counts as 0.5 toward present_count for routing
# This prevents under-counting when LLM is uncertain
adjusted_present_count=$((present_count + (partial_count / 2)))
adjusted_maturity_pct=$(( (adjusted_present_count * 100) / 8 ))

# Use adjusted values for routing (but display original for transparency)
echo "📊 Plan Maturity Scan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Display markers with status
for marker in structure workflows security data performance testing failures acceptance; do
  status=$(echo "$MATURITY_JSON" | jq -r ".markers.$marker.status // \"missing\"")
  evidence=$(echo "$MATURITY_JSON" | jq -r ".markers.$marker.evidence // \"No evidence\"")

  case $status in
    present)
      echo "✅ $marker: Present"
      ;;
    partial)
      echo "🟡 $marker: Partial (counts as 0.5)"
      ;;
    *)
      echo "❌ $marker: Missing"
      ;;
  esac
  echo "   → $evidence"
done

echo ""
echo "Original: $plan_maturity_pct% ($present_count present, $partial_count partial)"
echo "Adjusted: $adjusted_maturity_pct% (for routing purposes)"
echo "Routing: $routing mode"
echo ""
echo "ℹ️  Partial markers count as 0.5 to prevent under-counting"
```

**Why This Fix Matters:**
- **Old approach (v2.1.0)**: `grep -q "## Data Contract"` - misses VERSIONING_GUIDE.md, semantic equivalents
- **v2.1.1 approach**: LLM binary true/false - caused "Partial vs Present" variance
- **v2.1.2 approach**: LLM three-state (present/partial/missing) with explicit examples:
  - Prevents semantic interpretation variance
  - Conservative counting (Partial = 0.5) prevents under-counting
  - Better routing decisions
- **Result**: More accurate maturity assessment with clear scoring rules

### Step 0.2: Route Based on Maturity (FIXED v2.1.2 - Uses Adjusted Score)

**FIXED v2.1.2:** Now uses adjusted maturity score (with Partial = 0.5) for routing decisions.

Use the maturity score to determine which passes are needed.

```bash
# Pass routing based on ADJUSTED maturity (accounts for partial markers)
case $adjusted_maturity_pct in
  87-100)  # 7-8 markers present (or equivalent with partials)
    passes_needed="minimal"
    estimated_time="15-30 min"
    echo "✅ Plan is highly mature!"
    echo "   Recommended: Quick validation pass + quality check"
    ;;
  62-86)   # 5-6 markers present (or equivalent with partials)
    passes_needed="targeted"
    estimated_time="1-2 hours"
    echo "📋 Plan is moderately mature."
    echo "   Recommended: Targeted passes for missing quality markers"
    ;;
  37-61)   # 3-4 markers present (or equivalent with partials)
    passes_needed="standard"
    estimated_time="2-3 hours"
    echo "🔨 Plan needs standard improvement passes."
    echo "   Recommended: Core passes a-h"
    ;;
  0-36)    # 0-2 markers present (or equivalent with partials)
    passes_needed="comprehensive"
    estimated_time="3-4 hours"
    echo "🏗️  Plan needs comprehensive improvement."
    echo "   Recommended: All passes a-l"
    ;;
esac

# Store routing decision for later use
echo "$passes_needed" > .beads-planning-mode.txt
```

### Step 0.3: Smart Pass Selection (FIXED - Semantic, Not Grep-Based)

**FIXED:** Pass selection now uses LLM assessment results instead of grep patterns. This prevents false positives where content exists but section titles differ.

```bash
# Function to check if pass is needed based on LLM assessment
check_pass_needed() {
  local pass=$1
  local needed=true

  # Use the LLM assessment results from Step 0.1
  case $pass in
    a)  # Analysis - always run for baseline
      needed=true
      ;;
    b)  # Spine - check if structure present (from LLM assessment)
      structure_present=$(echo "$MATURITY_JSON" | jq -r '.markers.structure.present')
      if [ "$structure_present" = "true" ]; then
        echo "⏭️  Skipping Pass b (Spine): Structure already present"
        evidence=$(echo "$MATURITY_JSON" | jq -r '.markers.structure.evidence')
        echo "   → $evidence"
        needed=false
      fi
      ;;
    c)  # Reality Check - check if constraints documented semantically
      # LLM already checked for this in security/structure markers
      # If structure OR security is present, constraints are likely documented
      structure_present=$(echo "$MATURITY_JSON" | jq -r '.markers.structure.present')
      security_present=$(echo "$MATURITY_JSON" | jq -r '.markers.security.present')
      if [ "$structure_present" = "true" ] || [ "$security_present" = "true" ]; then
        echo "⏭️  Skipping Pass c (Reality Check): Constraints already implicit in plan"
        needed=false
      fi
      ;;
    d)  # Security - check if invariants present (from LLM assessment)
      security_present=$(echo "$MATURITY_JSON" | jq -r '.markers.security.present')
      if [ "$security_present" = "true" ]; then
        echo "⏭️  Skipping Pass d (Security): Invariants already explicit"
        evidence=$(echo "$MATURITY_JSON" | jq -r '.markers.security.evidence')
        echo "   → $evidence"
        needed=false
      fi
      ;;
    e)  # Data Contract - check if formats defined (from LLM assessment)
      data_present=$(echo "$MATURITY_JSON" | jq -r '.markers.data.present')
      if [ "$data_present" = "true" ]; then
        echo "⏭️  Skipping Pass e (Data Contract): Formats already defined"
        evidence=$(echo "$MATURITY_JSON" | jq -r '.markers.data.evidence')
        echo "   → $evidence"
        needed=false
      fi
      ;;
    f)  # Failure Modes - check if addressed (from LLM assessment)
      failures_present=$(echo "$MATURITY_JSON" | jq -r '.markers.failures.present')
      if [ "$failures_present" = "true" ]; then
        echo "⏭️  Skipping Pass f (Failure Modes): Edge cases already covered"
        evidence=$(echo "$MATURITY_JSON" | jq -r '.markers.failures.evidence')
        echo "   → $evidence"
        needed=false
      fi
      ;;
    g)  # Performance - check if budgets specified (from LLM assessment)
      performance_present=$(echo "$MATURITY_JSON" | jq -r '.markers.performance.present')
      if [ "$performance_present" = "true" ]; then
        echo "⏭️  Skipping Pass g (Performance): Budgets already specified"
        evidence=$(echo "$MATURITY_JSON" | jq -r '.markers.performance.evidence')
        echo "   → $evidence"
        needed=false
      fi
      ;;
    h)  # Test Matrix - check if comprehensive (from LLM assessment)
      testing_present=$(echo "$MATURITY_JSON" | jq -r '.markers.testing.present')
      if [ "$testing_present" = "true" ]; then
        echo "⏭️  Skipping Pass h (Test Matrix): Tests already specified"
        evidence=$(echo "$MATURITY_JSON" | jq -r '.markers.testing.evidence')
        echo "   → $evidence"
        needed=false
      fi
      ;;
    i|j|k)  # Refinement passes - based on maturity
      if [ $plan_maturity_pct -ge 75 ]; then
        echo "⏭️  Skipping refinement passes: Plan already mature ($plan_maturity_pct%)"
        needed=false
      fi
      ;;
    l)  # Steady State Check - always run at end
      needed=true
      ;;
  esac

  return $needed
}

# Build list of needed passes
needed_passes=()
for pass in a b c d e f g h i j k l; do
  if check_pass_needed $pass; then
    needed_passes+=($pass)
  fi
done

echo ""
echo "📝 Passes to run: ${needed_passes[@]}"
echo "⏱️  Estimated time: $estimated_time"

# Update state file with planned passes
jq --arg passes "$(echo "${needed_passes[@]}" | jq -Rs 'split(" ")')" \
   '.passes_remaining = $passes | split(" ")' "$STATE_FILE" > "$STATE_FILE.tmp"
mv "$STATE_FILE.tmp" "$STATE_FILE"
```

**Why This Fix Matters:**
- **Old approach**: `grep -q "## Constraints"` - misses semantic equivalents
- **New approach**: Uses LLM semantic assessment from Step 0.1
- **Result**: No more false positives (Pass C, E running unnecessarily)

### Step 0.4: Early-Exit Check (FIXED v2.1.2 - Claude-Native + Fallback)

**FIXED v2.1.2:**
- Uses Claude's native interaction via `AskUserQuestion` instead of bash `read`
- **NEW:** Verifies AskUserQuestion availability with try-catch wrapper
- **NEW:** Provides fallback to auto-continue if tool not available
- **NEW:** Logs interaction mode for debugging

```bash
# FIXED v2.1.2: Use adjusted maturity score for early-exit check
if [ $adjusted_maturity_pct -ge 87 ]; then
  echo ""
  echo "✨ This plan is highly mature and may be ready for beads conversion!"
  echo ""
  echo "Maturity: $adjusted_maturity_pct% (adjusted from $plan_maturity_pct%)"
  echo "Markers: $present_count present, $partial_count partial"
  echo ""

  # Try to use Claude's native AskUserQuestion
  # If not available, fall back to auto-continue with recommendation
  USER_CHOICE=""

  # In Claude Code skill context, use AskUserQuestion
  # Wrapper for handling tool availability
  if try_ask_user_question; then
    # AskUserQuestion is available, use it
    # (This is handled by the skill invocation system)
    echo "Waiting for user input via AskUserQuestion..."
  else
    # AskUserQuestion not available, use fallback
    echo "⚠️  AskUserQuestion not available in this context"
    echo ""
    echo "Auto-continuing with recommended action:"
    echo "  → Plan is highly mature ($adjusted_maturity_pct%)"
    echo "  → Recommendation: Skip to plan-to-beads conversion"
    echo "  → To override, run: /beads-friendly-planning --force-continue"
    echo ""

    # Set default choice (skip to plan-to-beads)
    USER_CHOICE="skip_to_beads"

    # Update state file with auto-continue decision
    jq --arg choice "$USER_CHOICE" \
       '.early_exit_decision = $choice' \
       "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi

  # If user chose to skip, exit early
  if [ "$USER_CHOICE" = "skip_to_beads" ]; then
    echo ""
    echo "✅ Early exit: Plan ready for plan-to-beads conversion"
    echo ""
    echo "Next step: /plan-to-beads $PLAN_FILE"
    exit 0
  fi
fi

# Helper function to check if AskUserQuestion is available
try_ask_user_question() {
  # In skill context, this returns true
  # In pure bash context, this returns false
  # The skill invocation system handles this
  return 0  # Assume available in skill context
}
```

**How to Use in Claude Code Skill:**

```python
# FIXED v2.1.2: Safe AskUserQuestion wrapper with fallback
def prompt_early_exit(plan_maturity_pct, adjusted_maturity_pct, present_count, partial_count):
    """
    Prompt user for early-exit decision with fallback.

    Returns: "skip_to_beads" | "continue_improvements" | "review_details"
    """
    try:
        # Try to use AskUserQuestion (available in Claude Code)
        result = AskUserQuestion(
            questions=[{
                "question": f"This plan is highly mature ({adjusted_maturity_pct}%). Skip to plan-to-beads conversion?",
                "header": "Early-Exit",
                "options": [
                    {
                        "label": "Skip to plan-to-beads",
                        "description": f"Plan is ready ({adjusted_maturity_pct}% maturity), go directly to beads conversion"
                    },
                    {
                        "label": "Continue improvements",
                        "description": "Run minimal improvement passes first"
                    },
                    {
                        "label": "Review details",
                        "description": "Show maturity assessment details with evidence"
                    }
                ],
                "multiSelect": False
            }]
        )

        # Map user selection to action
        if "skip_to_beads" in str(result).lower():
            return "skip_to_beads"
        elif "review" in str(result).lower():
            return "review_details"
        else:
            return "continue_improvements"

    except Exception as e:
        # AskUserQuestion not available or failed
        print(f"⚠️  AskUserQuestion unavailable: {e}")
        print(f"ℹ️  Auto-continuing with recommendation: skip_to_beads")
        return "skip_to_beads"
```

**Fallback Behavior (v2.1.2):**
- **When AskUserQuestion works**: Interactive prompt with 3 options
- **When AskUserQuestion unavailable**: Auto-continue with recommended action
- **Logging**: Always logs decision (manual or auto) to state file
- **Debugging**: Can check state file to see why a decision was made

### Step 0.5: Steady State Detection (FIXED v2.1.2 - Claude-Native + Quality-Aware + Fallback)

**FIXED v2.1.2:**
- Uses Claude interaction and checks for critical additions, not just word count
- **NEW:** AskUserQuestion availability check with fallback
- **NEW:** Enhanced critical additions detection (more patterns)

```bash
# Track improvements per pass
last_word_count=$(jq -r '.metrics.current_word_count' "$STATE_FILE")
improvement_history=()

check_steady_state() {
  local pass=$1
  local current_word_count=$(wc -w < "$PLAN_FILE")
  local lines_added=0

  # Update state file with new word count
  jq --argjson wc "$current_word_count" '.metrics.current_word_count = $wc' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  # If we have a previous count, calculate improvement
  if [ "$last_word_count" -gt 0 ]; then
    lines_added=$((current_word_count - last_word_count))
    improvement_history+=("$pass:$lines_added")

    # Check if improvements are becoming incremental
    if [ ${#improvement_history[@]} -ge 2 ]; then
      last_improvement=${improvement_history[-1]}
      prev_improvement=${improvement_history[-2]}

      # Extract line counts
      last_lines=${last_improvement#*:}
      prev_lines=${prev_improvement#*:}

      # FIXED v2.1.2: Enhanced critical additions detection
      # Small but critical changes should NOT trigger steady state
      has_critical_additions=false

      # Check for multiple critical addition patterns
      if git diff HEAD~1 HEAD 2>/dev/null | grep -qiE \
        "MUST NEVER|MUST ALWAYS|Invariant|security|threat model|authentication|authorization|encryption|validation|sanitization"; then
        has_critical_additions=true
      fi

      # If last 2 passes added <50 words each AND no critical additions, steady state
      if [ $last_lines -lt 50 ] && [ $prev_lines -lt 50 ] && [ "$has_critical_additions" = "false" ]; then
        echo ""
        echo "✨ Steady state detected!"
        echo "   Last 2 passes added <50 words each (no critical additions)"
        echo "   Remaining passes can be skipped"
        echo ""

        # FIXED v2.1.2: Try AskUserQuestion with fallback
        SKIP_REMAINING=""

        if try_ask_user_question; then
          # AskUserQuestion is available (in skill context)
          echo "Waiting for user input via AskUserQuestion..."
          # Skill system handles the prompt
        else
          # Fallback: Auto-skip with recommendation
          echo "⚠️  AskUserQuestion not available in this context"
          echo ""
          echo "Auto-continuing with recommendation: skip remaining passes"
          echo "  → Reason: Steady state detected (no critical additions)"
          echo "  → To override, run: /beads-friendly-planning --force-steady"
          echo ""
          SKIP_REMAINING="yes"
        fi

        if [ "$SKIP_REMAINING" = "yes" ]; then
          # Log steady state decision
          jq --arg pass "$pass" \
             '.steady_state_triggered = $pass | .steady_state_reason = "no_critical_additions"' \
             "$STATE_FILE" > "$STATE_FILE.tmp"
          mv "$STATE_FILE.tmp" "$STATE_FILE"

          return 1  # Signal to skip remaining passes
        fi
      fi
    fi
  fi

  last_word_count=$current_word_count
  return 0
}

# Call this after each pass in Phase 2
```

**Quality-Aware Steady State (v2.1.2):**
- **Old (v2.1.0)**: Only checked word count (<50 words)
- **v2.1.1**: Added critical additions check (MUST NEVER, invariants)
- **v2.1.2**: Enhanced critical patterns (security, threat model, auth, etc.) + AskUserQuestion fallback
- **Result**: Won't skip when small but important changes are made, works even without AskUserQuestion

### Tag Management Helpers (NEW - v2.1.3)

**Helper functions for creating, resolving, and querying metacognitive tags.**

```bash
# Add a metacognitive tag
add_tag() {
  # Validate required variables
  : "${STATE_FILE:?Required variable STATE_FILE not set}"

  local tag_type="$1"
  local pass="$2"
  local blocking="${3:-true}"
  local severity="${4:-medium}"
  local metadata="$5"

  local timestamp
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Use mktemp for unique temp file
  local tmp_file
  tmp_file=$(mktemp "${STATE_FILE}.tmp.XXXXXX")

  # Combine into single jq operation (fixes race condition)
  # Use --arg for safe string escaping instead of direct interpolation
  jq --arg type "$tag_type" \
     --arg pass "$pass" \
     --arg timestamp "$timestamp" \
     --argjson blocking "$blocking" \
     --arg severity "$severity" \
     --argjson metadata "$metadata" \
     '.active_tags += [{
       tag: $type,
       pass: $pass,
       timestamp: $timestamp,
       blocking: $blocking,
       severity: $severity,
       metadata: $metadata
     }] | .tags_created += 1' \
     "$STATE_FILE" > "$tmp_file" && mv "$tmp_file" "$STATE_FILE"

  echo "🏷️  Tag added: $tag_type (pass: $pass, blocking: $blocking)"
}

# Resolve a tag by type and metadata match
resolve_tag() {
  # Validate required variables
  : "${STATE_FILE:?Required variable STATE_FILE not set}"

  local tag_type="$1"
  local metadata_key="$2"
  local metadata_value="$3"
  local resolution="$4"

  # Find matching tag (with optional chaining for safety)
  local tag
  tag=$(jq -r --arg type "$tag_type" \
             --arg key "$metadata_key" \
             --arg value "$metadata_value" \
             '.active_tags[] | select(.tag == $type and (.metadata[$key] // "") == $value)' \
             "$STATE_FILE")

  if [ -n "$tag" ]; then
    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Use mktemp for unique temp file
    local tmp_file
    tmp_file=$(mktemp "${STATE_FILE}.tmp.XXXXXX")

    # Combine all operations into single jq transaction (fixes race condition)
    jq --arg type "$tag_type" \
       --arg key "$metadata_key" \
       --arg value "$metadata_value" \
       --arg resolution "$resolution" \
       --arg timestamp "$timestamp" \
       '.active_tags = [.active_tags[] | select(.tag != $type or (.metadata[$key] // "") != $value)] |
        .resolution_log += [{
          tag: $type,
          metadata_key: $key,
          metadata_value: $value,
          resolution: $resolution,
          resolved_at: $timestamp
        }] |
        .tags_resolved += 1' \
       "$STATE_FILE" > "$tmp_file" && mv "$tmp_file" "$STATE_FILE"

    echo "✅ Tag resolved: $tag_type ($metadata_key=$metadata_value)"
  fi
}

# Get all tags of a specific type
get_tags_by_type() {
  # Validate required variables
  : "${STATE_FILE:?Required variable STATE_FILE not set}"

  local tag_type="$1"
  jq -r --arg type "$tag_type" '.active_tags[] | select(.tag == $type)' "$STATE_FILE"
}

# Get count of blocking tags
get_blocking_tag_count() {
  # Validate required variables
  : "${STATE_FILE:?Required variable STATE_FILE not set}"

  jq '[.active_tags[] | select(.blocking == true)] | length' "$STATE_FILE"
}

# Add to LCL context
add_to_lcl() {
  # Validate required variables
  : "${STATE_FILE:?Required variable STATE_FILE not set}"

  local context_type="$1"  # verified_facts, active_assumptions, etc.
  local entry="$2"

  # Use mktemp for unique temp file
  local tmp_file
  tmp_file=$(mktemp "${STATE_FILE}.tmp.XXXXXX")

  jq --arg ctx "$context_type" \
     --argjson entry "$entry" \
     ".lcl_context[\$ctx] += [\$entry]" \
     "$STATE_FILE" > "$tmp_file" && mv "$tmp_file" "$STATE_FILE"
}
```

**Usage Examples:**

```bash
# Add an assumption tag during analysis pass
add_tag "assumption" "a" "true" "medium" '{"source": "code_review", "statement": "CLI follows existing patterns"}'

# Add a clarification needed tag
add_tag "clarification_needed" "c" "true" "high" '{"question": "Encryption format?", "context": "security section"}'

# Resolve an assumption after verification
resolve_tag "assumption" "statement" "CLI follows existing patterns" "verified_by_code_inspection"

# Add verified fact to LCL
add_to_lcl "verified_facts" '{"fact": "CLI uses argparse pattern", "source": "code_review"}'

# Check if we should continue (blocking tags present)
blocking_count=$(get_blocking_tag_count)
if [ "$blocking_count" -gt 0 ]; then
  echo "⚠️  Cannot proceed: $blocking_count blocking tags remain"
fi
```

---

## Phase 1: Plan Analysis (Pass 0)

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

### Step 1: Read and Assess the Plan

```bash
# Read the plan file
PLAN_FILE="$1"
cat "$PLAN_FILE"

# Check plan structure
grep -E "^#+ " "$PLAN_FILE" | head -20

# Assess completeness
```

### Step 2: Generate Analysis Report

Create `plan-analysis-report.md`:

```markdown
# Plan Analysis Report

**Plan File:** <plan-file>
**Analysis Date:** <current date>

## Current State Assessment

### Structure
- **Completeness:** [Complete/Partial/Missing]
- **Word Count:** [approximate]
- **Sections Present:** [list detected sections]
- **Sections Missing:** [list missing sections from template]

### Content Quality
- **Goal Clarity:** [Clear/Vague/Missing]
- **Workflow Detail:** [Comprehensive/High-level/Missing]
- **Technical Detail:** [Specific/Vague/Missing]
- **Test Coverage:** [Specified/Partial/Missing]
- **Security/Privacy:** [Addressed/Partial/Missing]

### Beads-Readiness Assessment

#### ✅ Ready Indicators
- [ ] Goals and non-goals are explicit
- [ ] User workflows are step-by-step
- [ ] Data formats are specified
- [ ] APIs/CLI surface is defined
- [ ] Security contract is clear
- [ ] Test matrix is comprehensive
- [ ] Performance budgets are set

#### ⚠️ Needs Work Indicators
- [ ] Goals are vague ("improve X")
- [ ] Workflows are high-level
- [ ] Data structures are undefined
- [ ] Security is hand-wavy
- [ ] Tests are "add later"
- [ ] No performance targets

#### ❌ Not Ready Indicators
- [ ] No clear goal statement
- [ ] No user workflows
- [ ] No technical specification
- [ ] No acceptance criteria
- [ ] No test strategy

### Risk Assessment

**Ambiguity Level:** [Low/Medium/High]
- Explanation: [what's ambiguous and why it matters]

**Dependency Clarity:** [Clear/Unclear/Missing]
- Explanation: [what dependencies are unclear]

**Integration Risk:** [Low/Medium/High]
- Explanation: [what integration challenges exist]

**Swarm Feasibility:** [High/Medium/Low/Not Possible]
- Explanation: [can agents execute this?]

### Recommendation

**Overall Assessment:** [Ready for beads / Needs improvement passes / Not viable]

**If Needs Improvement:**
- Recommended passes: [list which passes are needed]
- Estimated time: [hours]
- Critical gaps: [what must be fixed first]

**Quick Wins:** [1-3 improvements that will have biggest impact]

## Next Steps

[What to do next based on assessment]
```

### Step 3: Present Report and Get Confirmation

Show the report to the user. Ask:

```
Based on analysis, this plan needs [N] improvement passes.

Estimated time: [N] hours

Shall I proceed with improvement passes?

Options:
1. Yes - Run all recommended passes
2. Select specific passes - I'll tell you which
3. Skip to beads conversion - Plan is good enough
4. Cancel - I need to fix the plan first
```

---

## Phase 2: Multi-Pass Improvement

### How to Run Each Pass

For each pass:
1. Read the current plan
2. Focus on the pass's specific aspect
3. Generate git-diff style changes
4. Present changes for review
5. Integrate approved changes
6. Save new version of plan

### Git-Diff Format

Always produce changes in git-diff format:

```diff
## Section Title

-Old line to remove
-Another old line
+New line to add
+Another new line

Unchanged line stays
```

### Pass B: Spine with Tag Monitoring (UPDATED - v2.1.3)

**Tag monitoring for structural additions:**

```bash
# Before adding Goals section
# NOTE: user_explicitly_requested_goals is a placeholder function
# In practice, check if plan file contains explicit goal statements
# or if user mentioned goals in their request
user_explicitly_requested_goals() {
  # Check if plan already has explicit Goals section
  grep -qiE "^#+\\s*(Goals|Objectives|What We're Building)" "$PLAN_FILE" 2>/dev/null
}

if ! user_explicitly_requested_goals; then
  add_tag "#PATTERN_UNJUSTIFIED" "b" "false" "low" \
    '{"addition": "Goals section", "justification": "inferring from tasks", "user_value": "unknown"}'
fi

# Check for assumption-driven goal writing
# Initialize empty array to track goals
declare -a goal_list=()

# After extracting goals from plan, check if array is populated
if [[ ${#goal_list[@]} -eq 0 ]]; then
  add_tag "#PLANNING_ASSUMPTION" "b" "false" "medium" \
    '{"assumption": "inferred goals from tasks", "risk": "medium", "alternative": "ask user for explicit goals"}'
fi

# After adding Non-Goals
# Initialize empty array to track non-goals
declare -a non_goals=()

# Check if non-goals were defined
if [[ ${#non_goals[@]} -eq 0 ]]; then
  add_tag "#PREMATURE_COMPLETE" "b" "true" "high" \
    '{"pass": "b", "missing": "non-goals not defined", "completeness": "70%"}'
fi
```

**Focus:** Structural completeness

**Checklist:**
- [ ] Goals are clear and specific
- [ ] Non-goals are explicit (what we're NOT doing)
- [ ] 2-3 primary user workflows are defined step-by-step
- [ ] Architecture blocks make sense
- [ ] Data flow is coherent
- [ ] All 10 template sections exist

**What to produce:**
- Fill missing sections
- Clarify vague goals
- Add non-goals
- Detail workflows step-by-step
- Ensure coherent structure

**CRITICAL: Apply changes to ORIGINAL plan file, not create separate copies**

**Workflow:**
1. Create backup of current plan before any changes
2. Generate git-diff style changes showing what will be added/modified
3. Present git-diff for review
4. If approved: Apply changes directly to the original `$PLAN_FILE`
5. Commit changes to git if user approves
6. Save backup to `.beads-planning-backup/` directory

**Correct Output:** Modified `$PLAN_FILE` (the original plan file)

```bash
# Before making changes, create backup
BACKUP=".beads-planning-backup/v1-spine-$(date +%Y%m%d_%H%M%S).md"
cp "$PLAN_FILE" "$BACKUP"

# Apply changes to original plan file
# (use Edit tool or direct file modification)

# After pass complete, plan file contains improvements
# Original is preserved in backup directory
```

**Why this matters:**
- ✅ Single source of truth (the plan file user provided)
- ✅ Git can track actual changes made
- ✅ No duplicate files or confusion about which version to use
- ✅ Proper git workflow with visible diff history

**After Pass 1:**
```markdown
## Pass 1 Complete: Spine Built

**Changes Made:**
- [List of structural improvements]

**Sections Added:**
- [List of new sections]

**Quality Improvements:**
- [What got better]

**Remaining Gaps:**
- [What still needs work]
```

---

### Pass 2: Reality Check + Code Study (15-25 min)

**Focus:** Align with existing codebase

**Actions:**
1. Read existing relevant code files
2. Identify production constraints
3. Find forgotten limitations
4. Add platform-specific constraints
5. Document real-world gotchas

**What to look for:**
- Platform constraints (browser limits, wasm, GH Pages quirks)
- Existing patterns (how similar features work)
- Performance characteristics (what's fast/slow)
- Integration points (what already exists)
- Configuration systems (how things are configured)

### Pass C: Reality Check with Tag Resolution (UPDATED - v2.1.4)

**Primary resolution pass for #ASSERTION_UNVERIFIED tags:**

```bash
# Resolve assertions from Pass A and B
echo "🔍 Resolving unverified assertions..."

# Get unverified tags and process with proper JSON handling
unverified_tags=$(get_tags_by_type "#ASSERTION_UNVERIFIED")

# Check if there are any tags to process
if [ -z "$unverified_tags" ] || [ "$unverified_tags" = "[]" ]; then
  echo "  ℹ️  No unverified assertions to resolve"
else
  echo "$unverified_tags" | jq -c '.[]' | while IFS= read -r tag; do
    # Extract claim and needs with proper JSON parsing
    claim=$(echo "$tag" | jq -r '.metadata.claim // empty')
    needs=$(echo "$tag" | jq -r '.metadata.needs // empty')

    # Validate required fields
    if [ -z "$claim" ] || [ -z "$needs" ]; then
      echo "  ⚠️  Skipping tag with missing claim or needs"
      continue
    fi

    echo "  Checking: $claim"

    case "$needs" in
      "codebase_verification")
        # Use grep to search codebase
        search_pattern=$(echo "$claim" | sed 's/existing //' | sed 's/ system.*//')
        if grep -rq "$search_pattern" . --include="*.js" --include="*.py" 2>/dev/null; then
          echo "  ✅ Found in codebase"
          resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "verified_in_codebase"

          # Add to LCL as verified fact (safe JSON construction)
          verified_fact_json=$(jq -n \
            --arg f "$claim" \
            --arg e "found in codebase" \
            --arg v "c" \
            '{fact: $f, evidence: $e, verified_in: $v}')
          add_to_lcl "verified_facts" "$verified_fact_json"
        else
          echo "  ⚠️  Not found, converting to assumption"
          resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "not_found_convert_to_assumption"

          # Safe JSON construction for assumption
          assumption_json=$(jq -n \
            --arg a "$claim exists" \
            --arg r "medium" \
            --arg s "unverified_assertion" \
            '{assumption: $a, risk: $r, source: $s}')
          add_tag "#PLANNING_ASSUMPTION" "c" "false" "medium" "$assumption_json"
        fi
        ;;
      "file_check")
        # Specific file check
        file_path=$(echo "$claim" | sed 's/ exists//')
        if [ -f "$file_path" ]; then
          echo "  ✅ File exists"
          resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "file_exists"

          # Safe JSON construction
          file_verified_json=$(jq -n \
            --arg f "$claim" \
            --arg e "file found" \
            --arg v "c" \
            '{fact: $f, evidence: $e, verified_in: $v}')
          add_to_lcl "verified_facts" "$file_verified_json"
        else
          echo "  ⚠️  File not found"
          resolve_tag "#ASSERTION_UNVERIFIED" "claim" "$claim" "file_not_found"

          # Safe JSON construction
          file_assumption_json=$(jq -n \
            --arg a "$claim" \
            --arg r "medium" \
            --arg ac "create_during_implementation" \
            '{assumption: $a, risk: $r, action: $ac}')
          add_tag "#PLANNING_ASSUMPTION" "c" "false" "medium" "$file_assumption_json"
        fi
        ;;
    esac
  done
fi
```

**Git-Diff Example:**
```diff
## Platform Constraints

+### GitHub Pages Constraints
+- Only works for public repos (V1 limitation)
+- No server-side rendering (static only)
+- No build hooks (must pre-build everything)
+- Base href must be set correctly for relative paths
+
+### Browser Constraints
+- localStorage has 5-10MB limit
+- Service worker cache size limits
+- No native file system access
-
## Implementation Outline

- Rust: add export command
+ Rust: add `export web` command using existing CLI patterns
+ Web app: static TS + WASM (follow bv's WASM structure)
+ Deployment: optional gh-pages helper (use gh CLI)
```

**CRITICAL: Apply changes to ORIGINAL plan file, not create separate copies**

**Workflow:**
1. Create backup of current plan before any changes: `cp $PLAN_FILE .beads-planning-backup/before-pass-c-$(date +%Y%m%d_%H%M%S).md`
2. Generate git-diff style changes showing what will be added/modified
3. Present git-diff for review
4. If approved: Apply changes directly to the original `$PLAN_FILE`
5. Verify word count increased

**Output:** Modified `$PLAN_FILE` (the original plan file)

**After Pass 2:**
```markdown
## Pass 2 Complete: Reality Checked

**Code Studied:**
- [List of files examined]

**Constraints Added:**
- [Platform constraints documented]
- [Performance characteristics noted]
- [Integration points identified]

**Real-World Gotchas:**
- [List of gotchas found and documented]
```

---

### Pass 3: Threat Model + Privacy Leak Surfaces (15-25 min)

**Focus:** Security, privacy, leak prevention

**Critical Questions:**
1. What must never leak?
2. What could leak accidentally?
3. What does "wrong password" look like?
4. What do we store plaintext vs encrypted?
5. How do we prevent metadata leaks?

**Git-Diff Example:**
```diff
## Security

-We will encrypt the bundle.
+### Threat Model (V1)
+
+#### We Defend Against
+- Public repo hosting: strangers download bundle and site
+- Offline attacks: attacker brute-forces passwords
+- Tampering: attacker modifies bundle bytes or manifest
+
+#### We Do NOT Defend Against
+- Compromised browser/OS on viewer's machine
+- Weak passwords (we warn, not prevent)
+
+#### Primary Leak Surfaces to Explicitly Avoid
+- Metadata in cleartext manifest (agent names, paths, timestamps)
+- Browser caches storing decrypted payload
+- Error messages revealing "wrong password" vs "corrupted"
+- URL parameters exposing sensitive data
+
+### Security Invariants
+
+#### Must Never Happen
+- Decrypted content written to disk
+- Decrypted content in localStorage
+- Decrypted content in service-worker cache
+- Plaintext metadata in bundle.meta
+- Error distinguishes wrong password from tampering
+
+#### Must Always Happen
+- All encryption is authenticated (AEAD)
+- Password checked via constant-time comparison
+- Bundle integrity verified before decryption
+- Manifest uses minimal, non-sensitive fields
+
+### Cryptography Specification
+
+- KDF: Argon2id (explicit params in bundle.meta)
+- Salt: random per bundle (16 bytes)
+- AEAD: XChaCha20-Poly1305
+- Nonce: random per chunk (24 bytes)
+- Chunk size: 64KB (allows streaming + progress)
+- Integrity: each chunk authenticated + top-level manifest
```

**CRITICAL: Apply changes to ORIGINAL plan file**

**Workflow:** Same as Pass C (backup → git-diff → apply to original)

**After Pass 3:**
```markdown
## Pass 3 Complete: Security Contract Defined

**Threat Model:**
- [Defends against listed]
- [Does not defend against listed]

**Invariants:**
- Must never happen: [list]
- Must always happen: [list]

**Leak Surfaces:**
- Identified: [list]
- Mitigated: [how]

**Crypto Spec:**
- KDF: [specified]
- AEAD: [specified]
- Chunking: [specified]
```

---

### Pass 4: Data Contract + Versioning (15-25 min)

**Focus:** Data formats, schemas, compatibility

**Critical Questions:**
1. What are the exact data structures?
2. How do we version the format?
3. What happens when format changes?
4. How do we maintain compatibility?

**Git-Diff Example:**
```diff
+## Data Contract
+
+### Bundle File Layout
+```
+/export/
+├── index.html          # Entry point
+├── assets/
+│   ├── main.js         # WASM + JS glue
+│   ├── main.wasm       # WASM binary
+│   └── styles.css      # Styles
+└── data/
+    ├── bundle.enc      # Encrypted data
+    └── bundle.meta     # Minimal plaintext metadata
+```
+
+### Bundle Metadata Format
+```json
+{
+  "bundle_format_version": "1.0",
+  "schema_version": "1.0",
+  "total_size": 1024000,
+  "encrypted_size": 1024000,
+  "kdf_params": {
+    "algorithm": "argon2id",
+    "iterations": 3,
+    "memory": 65536,
+    "parallelism": 4,
+    "salt_hash": "<hash-of-salt>"
+  },
+  "aead_params": {
+    "algorithm": "xchacha20-poly1305"
+  },
+  "chunk_count": 16
+}
+```
+
+### Explicit Exclusions (Privacy)
+The following fields MUST NOT appear in bundle.meta:
+- Agent names
+- Project paths
+- Timestamps
+- Message counts
+- Content previews
+
+### Versioning Strategy
+
+#### Format Versioning
+- `bundle_format_version`: Major.Minor (e.g., "1.0")
+- Breaking changes: increment Major
+- Additive changes: increment Minor
+
+#### Schema Versioning
+- `schema_version`: Independent of format
+- Tracks data structure evolution
+
+#### Forward Compatibility Rules
+- Readers MUST ignore unknown fields
+- Writers SHOULD preserve unknown fields when updating
+- New sections require version gates
+
+#### Migration Plan
+- Support reading N-1 minor versions
+- Provide re-export tool for format upgrades
-Document migration in changelog
```

**CRITICAL: Apply changes to ORIGINAL plan file**

**Workflow:** Same as Pass C (backup → git-diff → apply to original)

---

### Pass 5: UX Edge Cases + Failure Modes (15-25 min)

**Focus:** What happens when things go wrong

**Critical Scenarios to Cover:**
1. Corrupt bundle
2. Wrong password
3. Tampered bundle
4. Partial download
5. Empty results
6. Mobile constraints
7. Lock/unlock behavior

**Git-Diff Example:**
```diff
+## Failure Modes & Recovery
+
+### Bundle Corruption
+
+#### Detectable Corruption
+- Symptom: Decryption fails (authentication error)
+- UI: Generic error message ("Unable to read bundle")
+- Action: Suggest re-export or check source
+
+#### Tampering Detection
+- Symptom: Authentication tag mismatch
+- UI: Same as corruption (indistinguishable)
+- Security: Must NOT reveal which
+
+### Password Errors
+
+#### Wrong Password
+- Symptom: Decryption fails
+- UI: "Incorrect password. Try again."
+- Behavior: Same UI as corruption (security)
+
+#### No Password (Public Bundle)
+- Symptom: Bundle not encrypted
+- UI: No password prompt, direct unlock
+
+### Empty States
+
+#### No Results
+- Symptom: Search returns 0 messages
+- UI: "No messages found. Try different filters."
+- Action: Clear filters or expand time range
+
+#### Empty Bundle
+- Symptom: Bundle has 0 messages
+- UI: "This export contains no messages."
+- Action: Re-export with different selection
+
+### Mobile Constraints
+
+#### Limited Screen
-- Assume mobile viewport for initial design
+- Use responsive design patterns
+- Test on 375px width minimum
+
+#### Touch Interaction
+- Ensure tap targets are 44px minimum
+- Avoid hover-only interactions
+
+### Lock/Unlock Behavior
+
+#### Unlock Flow
+- User enters password
+- Decrypt in memory only
+- Build search index
+- Enable search UI
+- NEVER write decrypted data to disk
+
+#### Lock Flow
+- User clicks "Lock" button
+- Wipe decrypted content from memory
+- Reset UI to password prompt
+- Clear all caches
+
+#### Session Timeout
+- Auto-lock after 30 minutes of inactivity
+- Warn user 1 minute before timeout
```

**CRITICAL: Apply changes to ORIGINAL plan file**

**Workflow:** Same as Pass C (backup → git-diff → apply to original)

---

### Pass 6: Performance Posture (15-25 min)

**Focus:** Performance targets and measurement

**Git-Diff Example:**
```diff
+## Performance Requirements
+
+### Performance Budgets
+
+#### Time-to-Interactive (TTI)
+- Small bundles (< 1MB): < 2s
+- Medium bundles (1-10MB): < 5s
+- Large bundles (> 10MB): < 10s
+- Measurement: From page load to search enabled
+
+#### Search Latency
+- p50: < 20ms
+- p95: < 50ms
+- p99: < 100ms
+- Measurement: Search-as-you-type latency
+
+#### Unlock Time
+- Small bundles: < 2s
+- Medium bundles: < 5s
+- Large bundles: < 10s
+- Measurement: Password entry to search enabled
+
+#### Memory Usage
+- After unlock: < 500MB
+- During search: < 1GB peak
+- Measurement: browser memory API
+
+### Measurement Plan
+
+#### Benchmark Harness
+- Create automated perf tests
+- Test with sample datasets:
+  - Small: 100 messages
+  - Medium: 1,000 messages
+  - Large: 10,000 messages
+
+#### CI Integration
+- Run perf tests on every PR
+- Fail on regression > 20%
+- Baseline established in initial benchmark
+
+#### Profiling
+- Use browser DevTools profiling
-Profile critical paths:
+  - Bundle loading
+  - Decryption
+  - Indexing
+  - Search execution
+
+### Design Choices for Performance
+
+#### Chunking
+- Encrypt/decrypt in chunks (64KB)
+- Allows streaming progress UI
+- Reduces memory pressure
+
+#### Incremental Indexing
+- Build search index incrementally
+- Show results as index builds
+- Don't block on full index
+
+#### Virtualization
+- Use virtual list for large result sets
+- Only render visible items
+- Lazy load message content
+
+#### Caching
+- Cache decrypted chunks in memory (not disk)
-Use weak references where possible
+- Clear cache on lock
```

**CRITICAL: Apply changes to ORIGINAL plan file**

**Workflow:** Same as Pass C (backup → git-diff → apply to original)

---

### Pass 7: Test Matrix (15-25 min)

**Focus:** Comprehensive testing strategy

**Git-Diff Example:**
```diff
+## Testing Strategy
+
+### Unit Tests
+
+#### Crypto Module
+- Argon2id KDF with test vectors
+- XChaCha20-Poly1305 encryption/decryption
+- Chunk integrity verification
+- Wrong password detection
+- Tamper detection
+
+#### Bundle Builder
+- Correct JSON structure
+- Required fields present
+- Valid data types
+- Size calculations correct
+
+#### Web App
+- Index building correctness
+- Search accuracy
+- Filter correctness
+- Pagination logic
+
+### Integration Tests
+
+#### Export Flow
+- Selection UI produces correct config
+- Bundle builder creates valid output
+- File layout matches specification
+
+#### Unlock Flow
+- Correct password unlocks
+- Wrong password fails gracefully
+- Tampered bundle detected
+- Lock wipes memory
+
+### E2E Tests (Playwright)
+
+#### Encrypted Export Flow
+1. Select agents/projects/time range
+2. Enter password
+3. Generate export
+4. Serve locally
+5. Verify password prompt
+6. Unlock with correct password
+7. Verify search works
+8. Lock and verify wipe
+
+#### Public Export Flow
+1. Create export without password
+2. Generate export
+3. Serve locally
+4. Verify no password prompt
+5. Verify search works immediately
+
+#### Error Flows
+1. Import tampered bundle
+2. Verify generic error message
+3. Import wrong password
+4. Verify same generic message
+
+#### Mobile Smoke Tests
+1. Load export on mobile viewport
+2. Verify responsive layout
+3. Test touch interactions
+4. Verify performance acceptable
+
+### Privacy Tests
+
+#### Metadata Leak Check
+- Scan bundle.meta for sensitive fields
+  - [ ] No agent names
+  - [ ] No project paths
+  - [ ] No timestamps
+  - [ ] No content previews
+- Automated test in CI
+
+#### Cache Leak Check
+- Verify no decrypted data in localStorage
+- Verify no decrypted data in sessionStorage
+- Verify no decrypted data in service-worker cache
+- Manual browser DevTools inspection
+
+### Performance Tests
+
+#### Unlock Time Benchmark
+- Measure time to unlock for each bundle size
+- Assert within budget (2s/5s/10s)
+- Track in CI over time
+
+#### Search Latency Benchmark
+- Measure p50/p95/p99 search latency
+- Assert within budget (20ms/50ms/100ms)
+- Track in CI over time
+
+#### Memory Usage Benchmark
+- Measure memory after unlock
+- Measure memory peak during search
+- Assert within budget (500MB/1GB)
+
+### Test Datasets
+
+#### Synthetic Data
+- Small: 100 messages across 5 agents
+- Medium: 1,000 messages across 10 agents
+- Large: 10,000 messages across 20 agents
+
+#### Real Data
+- Sanitized production logs
+- With realistic message patterns
+- Include edge cases (very long messages, special chars)
```

**CRITICAL: Apply changes to ORIGINAL plan file**

**Workflow:** Same as Pass C (backup → git-diff → apply to original)

---

### Pass 8+: Architecture Refinement (10-20 min each)

**Focus:** External feedback and integration

**How to solicit feedback:**

Option A: Use another AI model (recommended)
```bash
# Copy plan to GPT Pro with extended reasoning
# Use prompt:
"""
Carefully review this entire plan and come up with your best revisions in terms of:
- Better architecture
- New features
- Changed features
- More robust/reliable
- More performant
- More compelling/useful

For each proposed change, provide:
1. Detailed analysis and rationale
2. Git-diff style changes vs original plan

Paste your plan below:
"""
```

Option B: Self-critique
```bash
# Ask yourself:
1. What did we forget?
2. What's still ambiguous?
3. What could go wrong?
4. How can we make this more robust?
```

**What to look for in feedback:**
- Better architecture boundaries
- Extra safety defaults
- Sharper acceptance criteria
- Clearer task decomposition
- Missing features
- Unnecessary complexity

**Integrating feedback:**

For each suggested change:
1. Evaluate if it improves the plan
2. Generate git-diff for integration
3. Apply to plan
4. Save new version

**Repeat until:** Suggestions become incremental (steady state)

**CRITICAL: Apply changes to ORIGINAL plan file**

**Workflow:** Same as Pass C (backup → git-diff → apply to original)

---

### Pass L: Steady State Check with Tag Verification (UPDATED - v2.1.4)

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

---

### After All Passes: Generate Summary

Create `improvement-summary.md`:

```markdown
# Plan Improvement Summary

**Original Plan:** <plan-file>
**Final Plan:** <plan-file> (modified in place with improvements)
**Total Passes:** N
**Total Time:** ~N hours

## Improvement Timeline

| Pass | Focus | Time | Output | Key Changes |
|------|-------|------|--------|-------------|
| 0 | Analysis | 15 min | plan-analysis-report.md | Baseline assessment |
| 1 | Spine | 20 min | $PLAN_FILE (modified) | Structure complete |
| 2 | Reality Check | 25 min | $PLAN_FILE (modified) | Constraints added |
| 3 | Security | 25 min | $PLAN_FILE (modified) | Threat model defined |
| 4 | Data Contract | 25 min | $PLAN_FILE (modified) | Format specified |
| 5 | Failure Modes | 25 min | $PLAN_FILE (modified) | Edge cases covered |
| 6 | Performance | 25 min | $PLAN_FILE (modified) | Budgets set |
| 7 | Test Matrix | 25 min | $PLAN_FILE (modified) | Tests specified |
| 8+ | Refinement | 20 min each | $PLAN_FILE (modified) | Architecture improved |

**Backups:** `.beads-planning-backup/` contains timestamped snapshots before each pass for rollback

## Quality Improvements

### Structure
- Before: [assessment]
- After: [assessment]
- Impact: [what improved]

### Security
- Before: [assessment]
- After: [assessment]
- Impact: [what improved]

### Testability
- Before: [assessment]
- After: [assessment]
- Impact: [what improved]

### Beads-Readiness
- Before: [score/%]
- After: [score/%]
- Impact: [what improved]

## Key Additions

**Sections Added:**
- [List of new sections]

**Specifications Added:**
- [List of new specifications]

**Invariants Defined:**
- [List of invariants]

**Tests Specified:**
- [List of test categories]

## Ready for Beads Conversion

### Gate A: Plan QA Checklist

- [x] System invariants explicit
- [x] Interfaces locked
- [x] E2E acceptance defined
- [x] Test matrix comprehensive
- [x] Performance budgets set
- [x] Security contract clear

### Estimated Beads

Based on plan structure:
- Estimated tasks: [N]
- Estimated subtasks: [N]
- Estimated dependencies: [N]
- Estimated parallel tracks: [N]

### Next Steps

1. Review final plan
2. Approve for beads conversion
3. Run Phase 3: Beads Conversion

---

**Status:** ✅ Plan is BEADS-READY
**Recommendation:** Proceed to beads conversion
```

---

## Phase 3: Beads Conversion

### Step 1: Parse Plan into Task Hierarchy

Read the improved plan and extract:

```markdown
## Task Hierarchy Extraction

### Epics (Major Features)
[Extract from plan phases/sections]

### Tasks (Major Work Items)
[Extract from implementation sections]

### Subtasks (Specific Implementations)
[Break down tasks]

### Dependencies
[Extract from "depends on" / "after" language]
```

### Step 2: Create Beads Using bd CLI

**For each task/subtask:**

```bash
# Create bead
bd create "<Task Title>" \
  --label "epic,priority,domain" \
  --description "<Detailed description>" \
  --priority <0-3>

# Get bead ID
BEAD_ID=$(bd show ... | grep "ID:" | cut -d: -f2)

# Record ID for dependency creation
echo "$TASK_NAME:$BEAD_ID" >> bead-mapping.txt
```

### Step 3: Add Dependencies

```bash
# For each dependency relationship
bd dep add <dependent-bead-id> <depends-on-bead-id>

# Verify no cycles
bd dep cycles

# Show dependency tree
bd dep tree <bead-id>
```

### Step 4: Enrich Bead Descriptions

**Each bead should be self-contained. Add to description:**

```markdown
### Context
[Why this task exists]

### Dependencies
- Requires: [bead IDs]
- Unblocks: [bead IDs]

### Specification
[Detailed implementation requirements]

### Files
- Create: [file paths]
- Modify: [file paths with specific changes]

### Acceptance Criteria
- [ ] [Specific, measurable outcome]
- [ ] [Test requirements]

### Notes
[Relevant background, reasoning, considerations]
```

### Step 5: Validate Bead Creation

Create `bead-creation-report.md`:

```markdown
# Bead Creation Report

**Source Plan:** $PLAN_FILE (original file, now improved)
**Beads Created:** N
**Dependencies:** N
**Estimated Parallel Tracks:** N

## Bead Statistics

| Metric | Count |
|--------|-------|
| Total Beads | N |
| Epic Beads | N |
| Task Beads | N |
| Subtask Beads | N |
| Test Beads | N |
| Integration Beads | N |
| Dependencies | N |
| Max Depth | N |

## Beads by Status

| Status | Count |
|--------|-------|
| Open | N |
| Blocked | N |
| Actionable | N |

## Dependency Analysis

- Total dependencies: N
- Circular dependencies: 0 (verified)
- Max chain length: N
- Average chain length: N

## Parallelization Analysis

Using `bv --robot-plan`:
- Parallel tracks: N
- Track breakdown:
  - Track A: [description] (N beads)
  - Track B: [description] (N beads)
  - ...

## Next Steps

Proceed to Phase 4: Bead Validation
```

---

## Phase 4: Bead Validation

### Gate B: Bead QA Checklist

**For each bead, verify:**

#### 1. Crisp Deliverable
- [ ] Output artifact specified (file, module, command, endpoint)
- [ ] "Done means..." checklist present
- [ ] Measurable outcome defined

#### 2. Explicit Dependencies
- [ ] All prerequisites listed
- [ ] No hidden dependencies
- [ ] Dependency chain clear

#### 3. Size Check
- [ ] Single agent can complete without new decisions
- [ ] Produces verifiable artifact
- [ ] Touches limited surface area
- [ ] Can be reviewed in isolation

#### 4. File Conflicts
- [ ] File-touch list present
- [ ] Conflict avoidance noted
- [ ] No overlapping edits with independent beads

#### 5. Test Requirements
- [ ] Unit tests specified
- [ ] Integration tests specified (if needed)
- [ ] E2E tests specified (if user-facing)

### Dependency Validation

```bash
# Check for cycles
bd dep cycles

# View dependency graph
bd dep tree

# Check parallelization
bv --robot-plan

# Check triage
bv --robot-triage

# Check file conflicts
for file in $(git ls-files); do
  bv --robot-impact "$file"
done
```

### Swarm Readiness Validation

Create `swarm-readiness-checklist.md`:

```markdown
# Swarm Readiness Checklist

## Dependency Health

- [ ] No circular dependencies (bd dep cycles)
- [ ] All dependencies explicit
- [ ] Dependency graph is acyclic
- [ ] Max depth reasonable (< 10)

## Parallelization

- [ ] Parallel tracks identified (bv --robot-plan)
- [ ] Track breakdown makes sense
- [ ] No single point of serialization
- [ ] Work distributed evenly across tracks

## File Conflicts

- [ ] No overlapping file edits between independent beads
- [ ] Shared files have dependency chains
- [ ] Hot files identified and serialized

## Bead Quality

- [ ] All beads have crisp deliverables
- [ ] All beads have acceptance criteria
- [ ] All beads have test requirements
- [ ] All beads are right-sized

## Integration Points

- [ ] Interface-lock beads defined
- [ ] System integration beads defined
- [ ] E2E acceptance beads defined

## Swarm Feasibility

- [ ] Agents can work independently
- [ ] Communication needs specified
- [ ] Handoff points clear
- [ ] No global state dependencies

## Final Verification

```bash
# Run all checks
bd dep cycles && echo "✅ No cycles"
bv --robot-plan | jq '.plan.tracks | length' && echo "✅ Parallel tracks"
bv --robot-triage | jq '.triage.actionable_count' && echo "✅ Actionable beads"
```

## Conclusion

**Overall Status:** [Ready / Needs Work / Not Ready]

**If Ready:**
- Estimated time with 4 agents: [N hours]
- Estimated time with 12 agents: [N hours]
- Recommended agent count: [N]

**If Needs Work:**
- Issues found: [list]
- Recommended fixes: [list]

---

## Summary: Complete Transformation

### Input
- Original plan: [file]
- Quality: [assessment]
- Beads-ready: [no]

### Output
- Improved plan: $PLAN_FILE (original file modified with improvements)
- Quality: [assessment]
- Beads-ready: [yes]
- Beads created: N
- Swarm-ready: [yes]

### Time Investment
- Plan analysis: 15 min
- Improvement passes: 3 hours (8 passes)
- Beads conversion: 45 min
- Bead validation: 30 min
- **Total: ~4.5 hours**

### Value Delivered
- Ambiguity removed: [examples]
- Risks addressed: [examples]
- Test coverage: [from none to comprehensive]
- Swarm-ready: [from no to yes]
- Implementation speed: [10x faster]

### Next Steps

1. Review final plan and beads
2. Spawn MAF agents
3. Begin swarm execution

---

## Implementation Notes for Claude

### When User Invokes This Skill

1. **Read the plan file** and any supporting files
2. **Run Phase 1 (Analysis)** and present report
3. **Get user confirmation** to proceed
4. **Run Phase 2 (Improvement)** pass by pass
5. **After each pass**, present git-diff and integrate
6. **Run Phase 3 (Beads)** when plan is approved
7. **Run Phase 4 (Validation)** on created beads
8. **Present final report** with swarm-readiness assessment

### Critical Behaviors

- **Always produce git-diff style changes** for review
- **Never rewrite the entire plan** - use diffs
- **Validate each pass** before moving to next
- **Use TodoWrite** to track progress across passes
- **Ask for confirmation** at major phase boundaries
- **Use bv and bd tools** for validation
- **Preserve all context** in beads (self-contained)

### Success Metrics

- Plan has all 10 sections complete
- System invariants are explicit
- Beads are self-contained
- Dependencies are explicit
- No circular dependencies
- Parallel tracks > 1
- Swarm-ready checklist passes

---

## Additional Documentation

- **METACOGNITIVE_TAGS.md** - Detailed reference guide for tag definitions and usage
- **SKILL.md** - User-facing documentation with tag examples

---

**Version:** 1.0.0
**Last Updated:** 2026-01-09
