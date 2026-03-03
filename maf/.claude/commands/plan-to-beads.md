# Plan to Beads

**Purpose:** Convert an implementation plan with tasks into Beads issue tracker items for execution by agents.

**Usage:** `/plan-to-beads [path-to-plan-file] [optional-supporting-files...]`

**Examples:**
- `/plan-to-beads docs/plans/2026-01-05-my-feature-plan.md`
- `/plan-to-beads docs/plans/2026-01-05-my-feature-plan.md docs/operations/some-runbook.md`

---

## Superpower Workflow Integration

This command is part of the complete MAF franchisee agent workflow:

```
1. sp-brainstorming
   → Explores user intent, requirements, and design
   → Creates: docs/plans/YYYY-MM-DD-<topic>-design.md

2. sp-writing-plans
   → Creates detailed implementation plan with bite-sized tasks
   → Creates: docs/plans/YYYY-MM-DD-<feature-name>.md

3. /plan-to-beads (this command)
   → Converts plan to beads automatically
   → Creates epic, tasks, dependencies, feature branch

4. Supervisor assigns beads via Agent Mail
   → Routes tasks to implementors based on labels

5. Implementors use /response-awareness
   → Each bead implemented with metacognitive orchestration
   → File reservations, proper skill selection, verification

6. Reviewer validates and approves

7. Supervisor closes and commits epic work
```

**Key Skills Referenced:**
- `sp-brainstorming` - Initial design exploration (REQUIRED for new features)
- `sp-writing-plans` - Implementation plan creation (REQUIRED for this command)
- `sp-test-driven-development` - For test-first implementation
- `sp-verification-before-completion` - Final validation
- `response-awareness` - Bead implementation framework

---

## Instructions for Claude

When user runs this command, convert their plan into beads by following these steps:

### Step 1: Validate Input

```bash
# Parse command line arguments
PLAN_FILE="$1"
shift 1  # Remove plan file from args, leaving supporting files
SUPPORTING_FILES=("$@")  # Array of optional supporting files

# Check that beads is initialized
if [ ! -d ".beads" ]; then
  echo "❌ Beads not initialized. Run 'bd init' first."
  exit 1
fi

# Check that plan file exists and is readable
if [ ! -f "$PLAN_FILE" ]; then
  echo "❌ Plan file not found: $PLAN_FILE"
  exit 1
fi

# Validate supporting files exist
for file in "${SUPPORTING_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Supporting file not found: $file"
    exit 1
  fi
done

echo "📋 Processing plan: $PLAN_FILE"
if [ ${#SUPPORTING_FILES[@]} -gt 0 ]; then
  echo "📚 Including ${#SUPPORTING_FILES[@]} supporting files:"
  printf '  - %s\n' "${SUPPORTING_FILES[@]}"
fi
```

### Step 2: Validate Plan Quality (NEW - from beads-friendly-planning)

**Before extracting tasks, verify the plan is swarm-executable:**

```bash
echo "🔍 Validating plan quality..."

# Check for required sections
required_sections=("Goals" "Non-Goals" "User Workflows" "Security" "Testing")
missing_sections=()

for section in "${required_sections[@]}"; do
  if ! grep -q "^## $section" "$PLAN_FILE"; then
    missing_sections+=("$section")
  fi
done

if [ ${#missing_sections[@]} -gt 0 ]; then
  echo "⚠️  Warning: Plan missing recommended sections:"
  printf '  - %s\n' "${missing_sections[@]}"
  echo "   Consider running: /beads-friendly-planning $PLAN_FILE"
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Conversion cancelled. Improve plan first."
    exit 1
  fi
fi
```

**Swarm-Executability Quality Checks:**

```bash
# Initialize quality metrics
quality_score=0
max_score=8
issues=()

# Check 1: Invariants explicit (MUST NEVER / MUST ALWAYS)
if grep -q "MUST NEVER\|MUST ALWAYS\|Invariant:" "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("❌ No security invariants found (MUST NEVER/ALWAYS)")
fi

# Check 2: Interfaces locked (API contracts, data formats)
if grep -q "API Contract\|Data Format\|Schema:\|Interface:" "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("⚠️  No explicit API/data contracts defined")
fi

# Check 3: Commands executable (not pseudo-commands)
if grep -qE '^\s*\$|```bash|```sh' "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("⚠️  No executable commands found (plan may be vague)")
fi

# Check 4: Test criteria unambiguous
if grep -qE '(Given|When|Then)|acceptance criteria|E2E' "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("⚠️  No explicit E2E acceptance criteria")
fi

# Check 5: Error modes handled
if grep -qi "error handling\|failure mode\|empty state" "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("⚠️  No error handling or failure modes documented")
fi

# Check 6: Performance constraints measurable
if grep -qE '<.*sec|p50|p95|p99|budget' "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("⚠️  No measurable performance budgets defined")
fi

# Check 7: Security requirements testable
if grep -qi "threat model\|security contract|audit" "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("⚠️  No security threat model defined")
fi

# Check 8: Dependencies specified
if grep -qE 'npm install|pnpm add|pip install|cargo add' "$PLAN_FILE"; then
  ((quality_score++))
else
  issues+=("ℹ️  No explicit dependency commands (may be implied)")
fi

# Report quality assessment
echo "📊 Plan Quality Assessment: $quality_score / $max_score checks passed"

if [ ${#issues[@]} -gt 0 ]; then
  echo ""
  echo "Quality Issues Found:"
  printf '  %s\n' "${issues[@]}"
  echo ""

  # Critical issues block conversion
  critical_issues=($(printf '%s\n' "${issues[@]}" | grep "❌" || true))
  if [ ${#critical_issues[@]} -gt 0 ]; then
    echo "❌ Critical issues found. Plan may not be swarm-executable."
    echo ""
    echo "Recommendation: Run /beads-friendly-planning $PLAN_FILE first"
    echo ""
    read -p "Continue anyway? Beads may fail execution. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Conversion cancelled. Improve plan first."
      exit 1
    fi
  fi
else
  echo "✅ Plan passes swarm-executability quality gates"
  echo ""
fi
```

**Quality Score Interpretation:**

| Score | Meaning | Action |
|-------|---------|--------|
| 8/8 | Excellent | Plan is swarm-ready |
| 6-7/8 | Good | Plan should work, minor gaps |
| 4-5/8 | Fair | Plan has significant gaps |
| 0-3/8 | Poor | Plan needs /beads-friendly-planning |

---

### Step 3: Parse Plan Frontmatter

Extract from the YAML frontmatter:

```yaml
---
epic: "governance-implementation"
branch: feature/agent-coordination-governance
complexity: medium
assignee: "agent-name"  # Customize for your franchisee
priority: 1
---
```

**Output variables:**
- `epic_name`: Extract epic name for labeling
- `branch_name`: Feature branch to use for every bead (fallback: generate from plan name)
- `priority`: P1 (high), P2 (medium), P3 (low)
- `assignee`: Default agent assignee (customize for your franchisee)
- `complexity`: Used for time estimates

### Step 4: Extract Tasks from Plan

Parse the plan body to identify concrete tasks:

**Task Pattern Recognition:**

```markdown
## Phase 1 – Core Classification System (2 hours)

**Step 1.1.1:** Create work classifier TypeScript module
- File: `lib/maf/governance/work-classifier.ts`
- Implement classification algorithm
- Add comprehensive tests

**Step 1.1.2:** Create classify-work.sh wrapper script
- File: `scripts/maf/governance/classify-work.sh`
- Accept bead metadata as CLI args
```

**Extraction Rules:**

1. **Phase headers** (`## Phase`, `### Phase`) → Use for task grouping/dependencies
2. **Step headers** (`**Step X.Y.Z:**`, `### Task N:`) → Each becomes a bead
3. **File paths** → Capture them for bead description
4. **Test files** → Mention in description or create separate test bead
5. **Time estimates** → Track for validation

**File Pattern Matching:**
```bash
# Common file patterns to extract:
- lib/**/*.ts (TypeScript modules)
- apps/**/*.ts (Backend apps)
- apps/site/**/*.{ts,11ty.js} (Site files)
- scripts/**/*.sh (Shell scripts)
- scripts/maf/**/*.ts (MAF scripts)
- tests/**/*.test.ts (Test files)
- docs/**/*.md (Documentation)
```

### Step 5: Normalize Task Data

For each extracted task, create a normalized structure:

```json
{
  "title": "Create work classifier module",
  "description": "Implement work-classifier.ts with classification algorithm",
  "labels": ["governance", "backend", "typescript"],
  "files": ["lib/maf/governance/work-classifier.ts"],
  "tests": ["lib/maf/__tests__/work-classifier.test.ts"],
  "estimated_hours": 1.5,
  "phase": 1,
  "step": "1.1.1",
  "dependencies": []
}
```

**Label Mapping:**
- **Epic**: From frontmatter `epic` field
- **Domain**: `backend`, `frontend`, `site`, `tests`, `docs`, `infra`, `governance`, `maf`
- **Type**: `api`, `component`, `util`, `integration`, `e2e`, `script`, `migration`
- **Agent**: From frontmatter `assignee` or auto-detect based on domain

### Step 6: Handle Supplementary Documentation

**Process Supporting Files:**
```bash
# Add supporting files to all beads for context
for support_file in "${SUPPORTING_FILES[@]}"; do
  echo "📚 Processing supporting file: $support_file"

  # Add to bead description as reference
  bead_description+="\n\nRefer to: $support_file"

  # Extract additional context from supporting files
  if [[ "$support_file" == *.md ]]; then
    echo "ℹ️  Supporting doc detected - will be referenced in bead description"
  fi
done
```

**Extract Plan-Referenced Docs:**
```bash
# Find all referenced documents in the plan
plan_references=$(grep -oE '\`([^`]+\.(md|yaml|json))`' "$PLAN_FILE" | sed 's/`//g' | sort -u)

for ref in $plan_references; do
  if [ -f "$ref" ]; then
    echo "📖 Plan references: $ref"
    bead_description+="\nReference: $ref"
  fi
done
```

### Step 7: Create Beads Programmatically

For each normalized task, execute:

```bash
# Build labels array
LABELS=("${epic_label}")

# Add domain label based on file paths
if [[ "$task_files" =~ apps/backend ]]; then
  LABELS+=("backend")
elif [[ "$task_files" =~ apps/site ]]; then
  LABELS+=("site" "frontend")
elif [[ "$task_files" =~ scripts/maf ]]; then
  LABELS+=("maf" "scripts")
fi

# Add type label
if [[ "$task_title" =~ [Tt]est ]]; then
  LABELS+=("test")
elif [[ "$task_title" =~ [Aa]pi ]]; then
  LABELS+=("api")
fi

# Create description with all context
DESCRIPTION="$task_description

Files:
$(printf '%s\n' "${task_files[@]}")

Tests:
$(printf '%s\n' "${task_tests[@]}")

Source: $PLAN_FILE#${phase}.${step}
Branch: ${branch_name}
"

# Add supporting file references
if [ -n "${SUPPORTING_FILES[*]}" ]; then
  DESCRIPTION+="

Supporting Docs:
$(printf '%s\n' "${SUPPORTING_FILES[@]}")
"
fi

# Create bead using bd CLI
bd create "$task_title" \
  --label "$(IFS=,; echo "${LABELS[*]}")" \
  --description "$DESCRIPTION" \
  --priority "$PRIORITY" \
  --assignee "$ASSIGNEE"

# Capture bead ID
BEAD_ID=$(bd create ... | grep "Created issue" | cut -d' ' -f3)
# Use generic project prefix (franchisee can customize)
PROJECT_PREFIX="${PROJECT_PREFIX:-franchisee}"
echo "${PROJECT_PREFIX}-${phase}_${step}:${BEAD_ID}" >> bead_mapping.txt
```

### Step 8: Add Dependencies

**Phase Dependencies:**
```bash
# Phase 2 tasks depend on Phase 1 completion
for phase2_bead in "${phase2_beads[@]}"; do
  for phase1_bead in "${phase1_beads[@]}"; do
    # Syntax: bd dep add <dependent-issue-id> <depends-on-issue-id>
    bd dep add "$phase2_bead" "$phase1_bead"
  done
done
```

**Sequential Dependencies:**
```bash
# If Step 1.1.2 depends on 1.1.1
if [[ "$step" =~ 1\.1\.2 ]] && [[ -n "${step_1_1_1_bead}" ]]; then
  bd dep add "$BEAD_ID" "$step_1_1_1_bead"
fi
```

### Step 9: Create Plan Branch (Automatic)

**Create and push the plan's branch automatically:**

```bash
# Extract plan information for branch creation
PLAN_BASENAME=$(basename "$PLAN_FILE" .md)
PLAN_DATE=$(echo "$PLAN_BASENAME" | cut -d'-' -f1-3)
PLAN_SLUG=$(echo "$PLAN_BASENAME" | sed "s/${PLAN_DATE}-//")

# Call helper script to create and push the branch
HELPER_SCRIPT="scripts/maf/helpers/create-plan-branch.sh"
if [ -f "$HELPER_SCRIPT" ]; then
  echo "🌱 Creating plan branch..."
  bash "$HELPER_SCRIPT" "$PLAN_FILE"

  if [ $? -eq 0 ]; then
    echo "✅ Plan branch created and pushed successfully"
  else
    echo "⚠️  Warning: Branch creation failed, agents will need to create manually"
  fi
else
  echo "⚠️  Helper script not found: $HELPER_SCRIPT"
  echo "   Agents will need to create plan branch manually"
fi
```

### Step 10: Validate Bead Quality (NEW - from beads-friendly-planning)

**After beads are created, validate they are swarm-ready:**

```bash
echo "🔍 Validating bead quality..."

# Initialize bead quality metrics
bead_quality_score=0
max_bead_score=6
bead_issues=()

# Check 1: No circular dependencies
if bd dep cycles &>/dev/null; then
  circular_deps=$(bd dep cycles 2>&1 || true)
  if [ -n "$circular_deps" ]; then
    bead_issues+=("❌ Circular dependencies found: $circular_deps")
  else
    ((bead_quality_score++))
  fi
else
  bead_issues+=("⚠️  Could not check circular dependencies (bd dep cycles failed)")
fi

# Check 2: Parallel tracks exist (can work in parallel)
if command -v bv &>/dev/null; then
  parallel_tracks=$(bv --robot-plan 2>&1 | grep -c "parallel" || echo "0")
  if [ "$parallel_tracks" -gt 1 ]; then
    ((bead_quality_score++))
    echo "   ✅ Found $parallel_tracks parallel tracks (good for swarm execution)"
  else
    bead_issues+=("⚠️  No parallel tracks found - all beads sequential")
  fi
else
  bead_issues+=("ℹ️  bv (beads_viewer) not available - skipping parallel track check")
fi

# Check 3: Actionable beads exist
if command -v bv &>/dev/null; then
  actionable=$(bv --robot-triage 2>&1 | grep -c "actionable" || echo "0")
  if [ "$actionable" -gt 0 ]; then
    ((bead_quality_score++))
    echo "   ✅ Found $actionable actionable beads"
  else
    bead_issues+=("❌ No actionable beads found - agents have nothing to do")
  fi
fi

# Check 4: Beads are right-sized
bead_count=${#created_beads[@]}
if [ "$bead_count" -gt 0 ]; then
  avg_size=0
  for bead_id in "${created_beads[@]}"; do
    description=$(bd show "$bead_id" 2>/dev/null | grep -A 100 "Description:" | wc -l)
    avg_size=$((avg_size + description))
  done
  avg_size=$((avg_size / bead_count))

  # Right-sized: 50-500 words in description
  if [ "$avg_size" -ge 50 ] && [ "$avg_size" -le 500 ]; then
    ((bead_quality_score++))
    echo "   ✅ Beads are right-sized (avg ${avg_size} lines)"
  else
    bead_issues+=("⚠️  Beads may not be right-sized (avg ${avg_size} lines)")
  fi
fi

# Check 5: File conflicts resolved
if command -v bv &>/dev/null; then
  conflicts=$(bv --robot-impact 2>&1 | grep -c "conflict" || echo "0")
  if [ "$conflicts" -eq 0 ]; then
    ((bead_quality_score++))
    echo "   ✅ No file conflicts detected"
  else
    bead_issues+=("⚠️  Potential file conflicts found: $conflicts conflicts")
  fi
fi

# Check 6: Integration beads defined
integration_beads=$(bd list --label "integration" 2>/dev/null | wc -l)
if [ "$integration_beads" -gt 0 ]; then
  ((bead_quality_score++))
  echo "   ✅ Integration beads defined ($integration_beads beads)"
else
  bead_issues+=("ℹ️  No integration beads (may not be needed for this epic)")
fi

# Report bead quality assessment
echo ""
echo "📊 Bead Quality Assessment: $bead_quality_score / $max_bead_score checks passed"

if [ ${#bead_issues[@]} -gt 0 ]; then
  echo ""
  echo "Bead Quality Issues Found:"
  printf '  %s\n' "${bead_issues[@]}"
  echo ""

  # Critical bead issues block execution
  critical_bead_issues=($(printf '%s\n' "${bead_issues[@]}" | grep "❌" || true))
  if [ ${#critical_bead_issues[@]} -gt 0 ]; then
    echo "❌ Critical bead issues found. Swarm execution may fail."
    echo ""
    echo "Recommendation: Review and fix bead issues before assigning to agents"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Beads created but not committed. Fix issues and re-run."
      echo "   Beads state: .beads/beads.jsonl"
      exit 1
    fi
  fi
else
  echo "✅ Beads pass swarm-executability quality gates"
  echo ""
fi
```

---

### Step 11: Validate and Report

**Validation Checks:**
```bash
# Verify all tasks have beads
task_count=$(grep -cE "^(## Phase|### Phase|\*\*Step|\*\*Task)" "$PLAN_FILE" || echo "0")
bead_count=${#created_beads[@]}
echo "Tasks in plan: $task_count, Beads created: $bead_count"

# Verify file paths are valid
for file in "${all_files[@]}"; do
  if [ ! -f "$file" ] && [ ! -d "$file" ]; then
    echo "⚠️  File not found: $file"
  fi
done
```

**Output Report:**
```markdown
## Plan → Beads Conversion Summary

**Source Plan:** docs/plans/2026-01-05-my-feature-plan.md
**Epic:** governance-implementation
**Branch:** feature/agent-coordination-governance

### Quality Assessment
**Plan Quality Score:** $quality_score / $max_score checks passed
**Bead Quality Score:** $bead_quality_score / $max_bead_score checks passed

### Supporting Documentation
**Provided Files:** ${#SUPPORTING_FILES[@]} supporting docs included
$(printf '- %s\n' "${SUPPORTING_FILES[@]}")

**Plan References:** X docs referenced from plan
$(printf '- %s\n' "${plan_references[@]}")

### Tasks Converted
| Phase | Step | Plan Task | Bead ID | Labels | Files |
|-------|------|-----------|---------|--------|-------|
$(for bead in "${created_beads[@]}"; do
  echo "| $phase | $step | $title | $bead_id | ${labels[*]} | ${#files[@]} files |"
done)

### Dependencies Created
- Phase 1 → Phase 2 blocking relationships
- Sequential step dependencies where applicable

### Agent Instructions
Each bead includes:
- Source plan reference (phase and step number)
- All file paths mentioned in task
- Test file references
- Supporting documentation links

### Next Steps
1. ✅ **Plan branch created**: All agents work on same branch
2. ✅ **Quality gates passed**: Plan and beads validated
3. Run: `bd ready --label $epic_label` to see available work
4. Assign agents: `bd assign $bead_id --agent $agent_name`
5. Verify on correct branch: `git checkout $branch_name`
6. Commit beads state: `git add .beads/beads.jsonl && git commit -m "feat: encode plan tasks into beads"`

**Conversion:** ✅ Complete ($bead_count/$task_count tasks converted)
```

---

### Step 12: Commit Artifacts

```bash
# Stage the plan file (if conversion added bead references)
git add "$PLAN_FILE"

# Stage beads state
git add .beads/beads.jsonl

# Commit with structured message
git commit -m "$(cat <<'EOF'
feat: encode $(basename "$PLAN_FILE" .md) tasks into beads

- Extracted $bead_count concrete tasks from plan phases
- Created beads with proper epic/domain labels
- Added phase dependencies
- Created and pushed plan branch: $branch_name
- Source plan: $PLAN_FILE

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Key Adaptations for MAF Franchisees

### Removed (Not Used in Franchisee Projects)

| Nextnest Feature | Franchisee Adaptation |
|-----------------|----------------------|
| `constraint` labels | Use `epic` frontmatter field instead |
| `can_tasks` tracking | Use franchisee's epic system |
| Codex profile labels | Removed (not applicable) |
| Agent pair labels | Use agent names directly |

### Added (Franchisee-Specific)

| Feature | Description |
|---------|-------------|
| `epic` frontmatter | Epic name for grouping related work |
| `assignee` frontmatter | Default agent assignee from plan |
| Domain labels | `maf`, `governance`, `site`, `backend` |
| `PROJECT_PREFIX` env var | Customize bead ID prefix (default: franchisee) |
| Helper script | Uses existing `create-plan-branch.sh` |

### Frontmatter Template for Franchisee Plans

```yaml
---
epic: "governance-implementation"
branch: feature/agent-coordination-governance
complexity: medium
assignee: "agent-name"  # Customize for your franchisee
priority: 1
estimated_hours: 8
---

# Feature Implementation Plan

**Goal:** [One sentence description]

**Architecture:** [2-3 sentence approach]

**Tech Stack:** [Key technologies]

---
```

---

*Command adapted from nextnest for MAF franchisee projects: 2026-01-05*
