# Implementation Workflow for Founder-Aware Planning

**For:** Claude (when founder-aware-planning skill is invoked)

**Your Role:** You are a **Technical Translator** specializing in transforming founder business intent into founder-informed implementation plans.

---

## When This Skill Is Invoked

User runs: `/founder-aware-planning "<project description>"`
or: `/founder-aware-planning --auto "<project description>"` (auto mode with early-exit)

Your job: Create an implementation plan that is:
1. **Founder-informed** - respects budget, timeline, team, risk tolerance
2. **Future-aware** - documents second/third-order consequences
3. **Technically sound** - avoids common LLM architecture mistakes

**Key Innovation:** Complexity-gated workflow - skip unnecessary questions for simple projects.

---

## Phase 0: Complexity Assessment (NEW - Early-Exit Mechanism)

**Purpose:** Quickly assess project complexity to determine Founder DSL scope. Skip non-essential layers for simple projects.

### Step 0.1: Quick Complexity Scan

```bash
echo "🔍 Scanning project complexity..."
echo ""

# Initialize complexity score
complexity_score=0
project_description="$1"

# Scan project description for complexity indicators
```

**Complexity Scoring Matrix (0-12):**

| Dimension | Score | Detection Pattern | Current |
|-----------|-------|-------------------|---------|
| **Scope** | 0-3 | Single feature → Multi-domain | TBD |
| **Data Sensitivity** | 0-3 | Public → Financial/health | TBD |
| **Integrations** | 0-3 | None → 6+ systems | TBD |
| **Team** | 0-3 | Solo → 7+ people | TBD |

**Detection Logic:**

```bash
# Check Scope
if [[ "$project_description" =~ "multi-system|architecture|platform|ecosystem" ]]; then
  complexity_scope=3
  echo "  🔸 Scope: Multi-domain/Architecture (3/3)"
elif [[ "$project_description" =~ "feature|component|module" ]]; then
  complexity_scope=1
  echo "  🔸 Scope: Multi-feature, single domain (1/3)"
else
  complexity_scope=0
  echo "  🔸 Scope: Single feature (0/3)"
fi

# Check Data Sensitivity
if [[ "$project_description" =~ "financial|health|medical|ssn|credit.card" ]]; then
  complexity_data=3
  echo "  🔸 Data: Financial/health (3/3)"
elif [[ "$project_description" =~ "user.*account|personal.*info|authentication" ]]; then
  complexity_data=1
  echo "  🔸 Data: User accounts (1/3)"
else
  complexity_data=0
  echo "  🔸 Data: Public data (0/3)"
fi

# Check Integrations
if [[ "$project_description" =~ "6.*integrations|multiple.*apis|webhook.*heavy" ]]; then
  complexity_integrations=3
  echo "  🔸 Integrations: 6+ systems (3/3)"
elif [[ "$project_description" =~ "integration|api|webhook|external.*system" ]]; then
  complexity_integrations=1
  echo "  🔸 Integrations: 1-2 systems (1/3)"
else
  complexity_integrations=0
  echo "  🔸 Integrations: None (0/3)"
fi

# Check Team
if [[ "$project_description" =~ "7.*people|large.*team|enterprise" ]]; then
  complexity_team=3
  echo "  🔸 Team: 7+ people (3/3)"
elif [[ "$project_description" =~ "team|multiple.*people|2.*people|3.*people" ]]; then
  complexity_team=1
  echo "  🔸 Team: 2-3 people (1/3)"
else
  complexity_team=0
  echo "  🔸 Team: Solo founder (0/3)"
fi

# Calculate total
complexity_score=$((complexity_scope + complexity_data + complexity_integrations + complexity_team))

echo ""
echo "📊 Complexity Score: $complexity_score / 12"
```

### Step 0.2: Route Based on Complexity

```bash
# Routing decision
case $complexity_score in
  0|1|2)
    founder_dsl_mode="core-only"
    echo ""
    echo "✅ Simple project detected"
    echo ""
    echo "Founder DSL Scope: Core categories A-D only"
    echo "Conditional categories E-J: Skipped (not relevant)"
    echo ""
    echo "We'll ask about:"
    echo "  • Scale & Growth"
    echo "  • Data & Sensitivity"
    echo "  • Budget & Resources"
    echo "  • Time & Risk"
    echo ""
    echo "Estimated time: 15-20 minutes"
    ;;

  3|4|5)
    founder_dsl_mode="targeted"
    echo ""
    echo "📊 Moderate project detected"
    echo ""
    echo "Founder DSL Scope: Core categories A-D + targeted conditionals"
    echo ""
    echo "We'll ask additional questions based on your answers:"
    echo "  • Integrations? (if you mention external systems)"
    echo "  • Multi-tenancy? (if you mention multiple orgs)"
    echo "  • Agents? (if you mention AI/automation)"
    echo ""
    echo "Estimated time: 25-35 minutes"
    ;;

  6|7|8|9|10|11|12)
    founder_dsl_mode="full"
    echo ""
    echo "🏗️  Complex project detected"
    echo ""
    echo "Founder DSL Scope: All categories A-J"
    echo ""
    echo "We'll do a deep dive to ensure nothing is missed:"
    echo "  • Core categories A-D"
    echo "  • Regulatory & Privacy"
    echo "  • Integrations"
    echo "  • Multi-tenancy"
    echo "  • Observability"
    echo "  • Agent Autonomy (if applicable)"
    echo "  • Migration planning"
    echo ""
    echo "Estimated time: 40-60 minutes"
    ;;

  *)
    echo "⚠️  Unexpected complexity score: $complexity_score"
    echo "Defaulting to full Founder DSL"
    founder_dsl_mode="full"
    ;;
esac

echo ""
read -p "Press ENTER to continue..."
echo ""
```

### Step 0.3: Check for Existing Founder Context (Early-Exit)

**If an existing plan file is being improved:**

```bash
# Check if a plan file already exists and has founder context
PLAN_FILE="docs/plans/$(echo "$project_description" | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"

if [ -f "$PLAN_FILE" ]; then
  echo "📋 Found existing plan: $PLAN_FILE"
  echo ""

  # Check for founder context markers
  founder_context_markers=0

  if grep -q "Constraints.*Budget\|Budget.*Constraints\|Monthly.*infrastructure" "$PLAN_FILE" 2>/dev/null; then
    ((founder_context_markers++))
  fi

  if grep -q "Timeline.*target\|MVP.*focused\|Timeline.*constraint" "$PLAN_FILE" 2>/dev/null; then
    ((founder_context_markers++))
  fi

  if grep -q "Scale.*expected\|Growth.*rate\|Users.*6.*months" "$PLAN_FILE" 2>/dev/null; then
    ((founder_context_markers++))
  fi

  if grep -q "Regulatory\|Compliance\|PDPA\|Audit.*trail" "$PLAN_FILE" 2>/dev/null; then
    ((founder_context_markers++))
  fi

  if grep -q "Integration.*external\|Webhook.*management\|Sync.*strategy" "$PLAN_FILE" 2>/dev/null; then
    ((founder_context_markers++))
  fi

  echo "Founder context markers found: $founder_context_markers / 5"
  echo ""

  if [ $founder_context_markers -ge 4 ]; then
    echo "✅ Plan is already founder-informed!"
    echo ""
    echo "Founder context detected:"
    grep -o "Constraints.*Budget\|Timeline.*target\|Scale.*expected\|Regulatory.*domain\|Integration.*external" "$PLAN_FILE" | head -5
    echo ""
    echo "Suggestion: Your plan already has founder constraints documented."
    echo "           Consider running /beads-friendly-planning to improve"
    echo "           the plan for swarm-executability."
    echo ""
    read -p "Skip Founder DSL and go directly to beads-friendly-planning? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]]; then
      echo "⏭️  Skipping Founder DSL"
      echo ""
      echo "Next step: /beads-friendly-planning $PLAN_FILE"
      echo ""
      echo "Exiting founder-aware-planning."
      exit 0
    fi
  elif [ $founder_context_markers -ge 2 ]; then
    echo "📊 Plan has partial founder context"
    echo ""
    echo "We'll fill in the gaps and refine trade-offs."
    echo ""
  else
    echo "🔧 Plan lacks founder context"
    echo ""
    echo "We'll build founder-informed plan from scratch."
    echo ""
  fi
fi
```

---

## Phase 0.5: Repo Context Scan (NEW - Repo-Aware Planning)

**Purpose:** Before asking founder questions, scan the repo for existing goals, architecture, and context. This ensures plans build on existing patterns rather than ignoring them.

### Why This Matters

**Problem:** Current founder-aware-planning only asks about founder constraints (budget, timeline, team) but ignores:
- Existing repo vision/goals
- Current architecture patterns
- Technical constraints from codebase
- Existing components to build on

**Result:** Plans that don't align with repo's core concepts (like your "Autonomous MAF Foundations" building on "MAF Franchise Architecture")

### Step 0.5.1: Scan for Repo Context

```bash
echo "📂 Scanning repo for existing context..."
echo ""

# Initialize repo context
repo_context_file=".repo-context.json"
cat > "$repo_context_file" << 'EOF'
{
  "scan_date": null,
  "repo_name": "",
  "vision": "",
  "goals": [],
  "architecture": {
    "pattern": "",
    "components": [],
    "governance": []
  },
  "technical_constraints": {
    "language": null,
    "deployment": null,
    "coordination": null,
    "task_distribution": null
  },
  "existing_docs": {
    "readme": false,
    "architecture": false,
    "governance": false,
    "plans": []
  },
  "subtrees": []
}
EOF

# Detect repo name
if [ -d .git ]; then
  repo_name=$(git remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git$//' || basename "$(pwd)")
  jq --arg name "$repo_name" '.repo_name = $name' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"
fi

# Detect subtrees to exclude from scan
SUBTREE_EXCLUDES=("maf" "vendor" "vendor/agent-mail" "vendor/response-awareness")

echo "🔍 Detecting subtrees to exclude..."
for subtree in "${SUBTREE_EXCLUDES[@]}"; do
  if [ -d "$subtree" ]; then
    # Check if it's a git subtree (has .git in parent)
    if git log --oneline -1 --grep="Squashed.*subtree.*$subtree" --all 2>/dev/null | grep -q .; then
      echo "  • $subtree/ (git subtree, excluded)"
      jq --arg st "$subtree" '.subtrees += [$st]' "$repo_context_file" > "$repo_context_file.tmp"
      mv "$repo_context_file.tmp" "$repo_context_file"
    fi
  fi
done

# Scan README.md for vision/goals
if [ -f README.md ]; then
  jq '.existing_docs.readme = true' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"

  # Extract vision (first 3 lines, or content under "Vision" heading)
  vision=$(grep -A 10 -i "^## vision" README.md 2>/dev/null | head -15 || head -3 README.md 2>/dev/null)
  jq --arg vision "$vision" '.vision = $vision' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"
fi

# Scan docs/ for architecture and governance
if [ -d docs ]; then
  # Build find exclude patterns for subtrees
  EXCLUDE_FIND=""
  for subtree in "${SUBTREE_EXCLUDES[@]}"; do
    if [ -d "$subtree" ]; then
      EXCLUDE_FIND="$EXCLUDE_FIND -path ./$subtree -prune -o"
    fi
  done

  # Find architecture docs (excluding subtrees)
  arch_docs=$(eval find docs $EXCLUDE_FIND -name "*architecture*" -o -name "*arch*" -o -name "*design*" 2>/dev/null | grep -v "^$")
  if [ -n "$arch_docs" ]; then
    jq '.existing_docs.architecture = true' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"
  fi

  # Find governance docs (excluding subtrees)
  gov_docs=$(eval find docs $EXCLUDE_FIND -name "*governance*" -o -name "*constitution*" -o -name "*policy*" 2>/dev/null | grep -v "^$")
  if [ -n "$gov_docs" ]; then
    jq '.existing_docs.governance = true' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"
  fi

  # Find existing plans (excluding subtrees)
  existing_plans=$(eval find docs $EXCLUDE_FIND -name "*plan*.md" -o -name "*Plan*.md" 2>/dev/null | grep -v "^$")
  if [ -n "$existing_plans" ]; then
    plans_array=$(echo "$existing_plans" | jq -R . | jq -s .)
    jq --argjson plans "$plans_array" '.existing_docs.plans = $plans' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"
  fi
fi

# Detect programming language
if [ -f package.json ]; then
  jq '.technical_constraints.language = "JavaScript/TypeScript"' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"
elif [ -f Cargo.toml ]; then
  jq '.technical_constraints.language = "Rust"' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"
elif [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  jq '.technical_constraints.language = "Python"' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"
fi

# Detect deployment patterns
if [ -f docker-compose.yml ] || [ -f Dockerfile ]; then
  jq '.technical_constraints.deployment = "Docker/Containers"' "$repo_context_file" > "$repo_context_file.tmp"
  mv "$repo_context_file.tmp" "$repo_context_file"
fi

# Detect MAF-specific patterns (only if not a subtree)
if [ -f maf/docs/maf-constitution.md ] || grep -q "MAF Franchise" README.md 2>/dev/null; then
  # Check if maf is in subtrees list (meaning it's a git subtree, not the main repo)
  is_maf_subtree=$(jq -r '.subtrees | index("maf")' "$repo_context_file")

  if [ "$is_maf_subtree" = "null" ]; then
    # maf/ exists but is NOT a subtree - this is MAF HQ repo
    jq '.architecture.pattern = "MAF Franchise (HQ + consumer franchises)"' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"

    # Extract MAF components
    maf_components=("MCP Agent Mail" "Beads" "Role-based spawning" "CI governance" "Health checks")
    components_array=$(printf '%s\n' "${maf_components[@]}" | jq -R . | jq -s .)
    jq --argjson components "$components_array" '.architecture.components = $components' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"
  else
    # maf/ is a subtree - skip adding its patterns to repo context
    echo "  (Skipping MAF-specific patterns - maf/ is a git subtree)"
  fi
fi

# Add scan date
jq --arg date "$(date -Iseconds)" '.scan_date = $date' "$repo_context_file" > "$repo_context_file.tmp"
mv "$repo_context_file.tmp" "$repo_context_file"

echo "✅ Repo context scan complete"
echo ""
```

### Step 0.5.2: Present Repo Context to User

```bash
echo "📋 Repo Context Summary:"
echo ""
echo "Repo: $(jq -r '.repo_name' "$repo_context_file")"
echo ""

if [ "$(jq -r '.vision' "$repo_context_file")" != "null" ]; then
  echo "Vision:"
  jq -r '.vision' "$repo_context_file" | head -5
  echo ""
fi

if [ "$(jq -r '.architecture.pattern' "$repo_context_file")" != "null" ]; then
  echo "Architecture Pattern:"
  echo "  • $(jq -r '.architecture.pattern' "$repo_context_file")"
  echo ""
fi

if [ "$(jq -r '.architecture.components | length' "$repo_context_file")" -gt 0 ]; then
  echo "Existing Components:"
  jq -r '.architecture.components[]' "$repo_context_file" | while read comp; do
    echo "  • $comp"
  done
  echo ""
fi

if [ "$(jq -r '.existing_docs.plans | length' "$repo_context_file")" -gt 0 ]; then
  echo "Existing Plans:"
  jq -r '.existing_docs.plans[]' "$repo_context_file" | while read plan; do
    echo "  • $plan"
  done
  echo ""
fi

echo "Full context saved to: $repo_context_file"
echo ""
```

### Step 0.5.3: Ask Context Integration Question

```bash
# Check if repo has strong existing patterns
has_architecture=$(jq -r '.architecture.pattern' "$repo_context_file")
has_components=$(jq -r '.architecture.components | length' "$repo_context_file")

if [ "$has_architecture" != "null" ] && [ "$has_components" -gt 0 ]; then
  echo "🔗 This repo has established architecture patterns."
  echo ""
  echo "Your new feature should:"
  echo "  • Build on existing components (not reinvent)"
  echo "  • Follow established patterns"
  echo "  • Extend architecture (not replace it)"
  echo ""
  read -p "Should the plan explicitly reference existing architecture? (Y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
    jq '.explicit_architecture_reference = true' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"
    echo ""
    echo "✅ Plan will explicitly reference existing architecture"
  else
    jq '.explicit_architecture_reference = false' "$repo_context_file" > "$repo_context_file.tmp"
    mv "$repo_context_file.tmp" "$repo_context_file"
    echo ""
    echo "⚠️  Plan will be created as standalone (may miss integration points)"
  fi
  echo ""
fi
```

### Step 0.5.4: Pass Context to Plan Creation

```bash
# Export repo context for plan creation
export REPO_CONTEXT_FILE="$repo_context_file"
export HAS_REPO_CONTEXT=true

# This will be used in Phase 3 (Plan Creation) to:
# 1. Reference existing architecture explicitly
# 2. Build on existing components
# 3. Document what's being extended vs created new
# 4. Align with repo vision/goals
```

---

## Phase 1: Invoke brainstorming for Founder DSL

### Step 1: Load Founder DSL Files

```bash
# Read the Founder DSL definition
FOUNDER_DSL="/root/projects/maf-github/.claude/skills/founder-aware-planning/FOUNDER_DSL"

# Read Layer 1 questions
cat "$FOUNDER_DSL/layer-1-questions.md"

# Read Layer 2 trade-offs
cat "$FOUNDER_DSL/layer-2-tradeoffs.md"

# Read Layer 3 patterns
cat "$FOUNDER_DSL/layer-3-patterns.md"
```

### Step 2: Run Layer 1 - Business Questions (Interactive)

**Purpose:** Collect founder intent through structured questionnaire.

**Process:**

1. **Start with universal categories (A-D):**
   ```
   Let me ask you some questions about your project to ensure the
   implementation plan aligns with your constraints and goals.

   **Category A: Scale & Growth**

   Q1: How many users do you expect in the first 6 months?
     a) < 100 users          → Solo/prototype scale
     b) 100-1,000 users      → Small business scale
     c) 1,000-10,000 users   → Startup scale
     d) 10,000+ users        → Growth-stage scale
   ```

2. **Ask ONE question at a time** (brainstorming principle)
3. **Wait for user answer** before asking next question
4. **Record answer in founder-context.json**

5. **Determine conditional categories (E-J):**
   - Based on answers, determine which additional categories are relevant
   - Example: If Q3 = "Financial/health data" → Ask Category E (Regulatory)
   - Example: If Q13 = "0 external systems" → Skip Category F details

**Output:** `founder-context.json` with layer_1_answers

```json
{
  "layer_1_answers": {
    "scale": {
      "users_6mo": "100-1,000",
      "growth_rate": "moderate"
    },
    "data": {
      "sensitivity": "user_accounts",
      "export_deletion": "no"
    },
    "budget": {
      "monthly_infra": "$50-200",
      "team_size": "2-3 people"
    },
    "time": {
      "timeline_mvp": "1-2 months",
      "downtime_tolerance": "<1 hour"
    },
    "regulatory_active": true,
    "regulatory": {
      "regulated_domain": "no",
      "pdpa_required": "no"
    }
  }
}
```

---

### Step 3: Run Layer 2 - Trade-off Menus

**Purpose:** Show consequences of technical decisions before making them.

**Process:**

1. **Read layer_1_answers from founder-context.json**
2. **Determine relevant trade-offs** based on answers
3. **Present trade-off menu** with recommendation

**Example Trade-off Presentation:**

```
Based on your answers:
- Budget: $50-200/month
- Scale: 100-1,000 users
- Data: User accounts (passwords)

**STORAGE DECISION: Where does your data live?**

┌─────────────────────────────────────────────────────────────────┐
│ Option A: SQLite (Local/Single File)                           │
│ ✓ Zero cost, works offline, simple backup                      │
│ ✗ Concurrency limits (~100 writes/sec), single server only     │
│ BEST FOR: Budget-conscious, <5k users                          │
│                                                                  │
│ Option B: PostgreSQL (Cloud-Managed)                           │
│ ✓ Scales to millions, concurrent writes, replication            │
│ ✗ $15-200/month, migration needed if starting small            │
│ BEST FOR: Growth-stage, >5k users expected                     │
│                                                                  │
│ Option C: Firebase/Supabase (Managed BaaS)                     │
│ ✓ Real-time sync, auth included, scales automatically          │
│ ✗ Vendor lock-in, costs grow with usage                        │
│ BEST FOR: Rapid MVP, real-time features, small team            │
└─────────────────────────────────────────────────────────────────┘

RECOMMENDATION:
Your budget ($50-200/mo) and scale (100-1k users) suggests PostgreSQL.
You can start with managed Neon ($25/mo) and scale as needed.

Which option do you prefer? (a/b/c or describe your own)
```

4. **Wait for user choice**
5. **Record choice + rationale in founder-context.json**

**Output:** Updated `founder-context.json` with layer_2_decisions

```json
{
  "layer_2_decisions": {
    "storage": "postgresql",
    "storage_rationale": "Budget allows, need concurrency for 1k users",
    "auth": "clerk",
    "auth_rationale": "Don't want to handle password security ourselves"
  }
}
```

---

### Step 4: Run Layer 3 - Pattern Catalog

**Purpose:** Match selected trade-offs to patterns with future impact warnings.

**Process:**

1. **Read layer_2_decisions from founder-context.json**
2. **Match to relevant patterns** from layer-3-patterns.md
3. **Present pattern** with future impact warnings

**Example Pattern Presentation:**

```
Based on your choice of PostgreSQL:

**PATTERN NOT SHOWN: Local-First (SQLite)**
You chose PostgreSQL, so local-first pattern is not relevant.

**PATTERN: Multi-Tenant with Row-Level Security**

USE THIS IF: You chose multi-tenant in Layer 1
Your answer: Single-tenant
→ This pattern is NOT relevant to your project.

**NO PATTERNS RECOMMENDED**
Your choices (PostgreSQL, single-tenant, no agents) don't require
special patterns from the catalog.

⚠️ FUTURE IMPACT WARNINGS (from your trade-offs):

From PostgreSQL choice:
  - Scaling trigger: >5k concurrent writers → consider sharding
  - Migration: PostgreSQL → distributed DB (complex)

From Clerk auth choice:
  - Vendor lock-in: Migration requires building own auth system
  - Cost scaling: Clerk grows with users ($25-500/month)

From single-tenant choice:
  - Future multi-tenancy: Requires adding tenant_id everywhere
    (painful migration, plan ahead if considering)
```

4. **Document future impacts in founder-context.json**

**Output:** Updated `founder-context.json` with layer_3_patterns + future_impacts

```json
{
  "layer_3_patterns": [],
  "future_impacts": [
    "PostgreSQL scaling: >5k concurrent writers may need sharding",
    "Clerk vendor lock-in: migration requires building own auth",
    "Single-tenant: future multi-tenancy requires painful migration"
  ]
}
```

---

### Step 5: Complete Founder DSL Phase

**Summary to User:**

```
✅ Founder DSL Complete

**Founder Context Saved:** founder-context.json

**Your Decisions:**
- Storage: PostgreSQL (Neon, $25/mo)
- Auth: Clerk (don't handle passwords ourselves)
- Multi-tenant: Single-tenant (just us)
- Agents: None (not using AI agents)

**Future Impact Warnings:**
1. Clerk vendor lock-in → migration path is build own auth
2. PostgreSQL scaling → may need sharding at >5k concurrent writers
3. Single-tenant → future multi-tenancy requires tenant_id migration

**Budget Alignment:**
- Your budget: $50-200/month
- Selected stack: ~$50/month (Neon $25 + Clerk $25)
- ✅ Within budget

Now I'll create your implementation plan with these constraints baked in...
```

---

## Phase 2: Invoke writing-plans

### Step 6: Load Plan Template

```bash
# Read the plan template
TEMPLATE="/root/projects/maf-github/.claude/skills/founder-aware-planning/templates/plan-template.md"
cat "$TEMPLATE"

# Read founder context
cat "founder-context.json"
```

### Step 7: Create Implementation Plan

**Key:** Create plan WITH founder context AND repo context integrated throughout.

**Plan Structure (with founder + repo integration):**

```markdown
# <Project Name> Implementation Plan

## Repo Context (NEW - if repo scan found architecture)

**Existing Architecture:** <from .repo-context.json>
- Pattern: <e.g., "MAF Franchise (HQ + consumer franchises)">
- Existing Components: <list from repo scan>
- Vision Alignment: <how this feature extends repo vision>

**Relationship to Existing Architecture:**
<If explicit_architecture_reference = true>
- ✅ BUILDS ON: <existing components we're extending>
- ✅ FOLLOWS: <established patterns from repo>
- ✅ EXTENDS: <what we're adding to existing architecture>
- ✅ AVOIDS: <reinventing what already exists>

<If explicit_architecture_reference = false>
- ⚠️  Standalone feature (may need integration work)
</If>

## Goals

<Founder's intent, translated to technical goal>
<ALIGNED WITH: Repo vision from README>
Success criteria aligned with founder's timeline and constraints

## Non-Goals

<Explicitly document what we're NOT doing>
Based on founder's "YAGNI" answers
<ALSO: What existing components we're NOT replacing>

## Constraints (from Founder DSL)

### Budget Constraints
- Monthly infra budget: $<amount>
- Selected stack stays within: $<total>/month
- <ALIGNED WITH: Existing tech stack from repo scan>

### Timeline Constraints
- Target: <timeline>
- MVP-focused: <yes/no>
- Skip nice-to-haves: <examples>

### Scale Constraints
- Expected users: <range>
- Growth rate: <rate>
- Plan for: <scaling triggers>
- <ALIGNED WITH: Existing scale patterns from repo>

### Team Constraints
- Team size: <N people>
- Complexity level: <simple/moderate/complex>

## Architecture (from Trade-offs + Repo Context)

### Existing Architecture (from .repo-context.json)
<If repo has architecture>
- Pattern: <e.g., "MAF Franchise (HQ + consumer franchises)">
- Components: <MCP Agent Mail, Beads, Role-based spawning, etc.>
- Governance: <CI governance, Health checks, etc.>

### New Architecture Decisions (from Founder DSL Layer 2)
<How we EXTEND existing architecture, not replace it>

#### Storage
<Choice from Layer 2>
- Rationale: <founder's reason>
- Migration path: <when to change>
- <INTEGRATION: How this works with existing storage patterns>

#### Authentication
<Choice from Layer 2>
- Rationale: <founder's reason>
- Migration path: <if vendor lock-in>
- <INTEGRATION: How this works with existing auth (if any)>

## Security (from Regulatory Answers)

<If regulated>
- Compliance requirements: <from Category E>
- Audit logging: <required/not>
- Data retention: <policy>
- <INTEGRATION: With existing governance from repo>

<If not regulated>
- Standard security sufficient
- <INTEGRATION: With existing security patterns from repo>
- <Specific security measures based on data sensitivity>

## Future Impact Warnings

<From Layer 3 patterns>

### Known Limitations
1. <Limitation from selected pattern>
   - When it becomes a problem: <trigger>
   - Migration path: <what to do>

2. <Vendor lock-in warning>
   - Migration complexity: <high/medium/low>
   - Alternative: <what to build instead>

## User Workflows

<Step-by-step workflows, scope appropriate for timeline>

## Implementation

<Breakdown by founder's timeline>
- Week 1: <MVP features>
- Week 2: <remaining features>
- Post-MVP: <future considerations>

## Testing

<Test strategy aligned with timeline and team>
- Unit tests: <coverage>
- E2E tests: <critical workflows>
- Skip for MVP: <what's deferred>

## Performance

<Budgets based on founder's scale expectations>
- Load time: <target>
- Response time: <target>
- No premature optimization: <what we're NOT doing>
```

### Step 8: Write Plan File

```bash
# Create plan file
PLAN_FILE="docs/plans/$(echo "$PROJECT_NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"
```

**Key Principles:**
1. **Every section references founder context** where relevant
2. **No "default LLM assumptions"** - always tie back to founder answers
3. **Document trade-offs explicitly** - show what was chosen and why
4. **Include future impacts** - second/third-order consequences
5. **Keep scope appropriate** - don't over-engineer for "future scale"

---

## Phase 3: Output and Next Steps

### Step 9: Present Results

```
✅ Founder-Informed Implementation Plan Created

**Plan File:** docs/plans/<project>.md
**Founder Context:** founder-context.json

**Plan Summary:**
- Word count: <N>
- Sections: <N>
- Founder-informed: ✅

**Key Decisions Documented:**
- <decision 1>: <choice> (rationale: <founder's reason>)
- <decision 2>: <choice> (rationale: <founder's reason>)

**Future Impacts Documented:**
- <impact 1>: <warning>
- <impact 2>: <warning>

**Next Steps:**

1. Review the plan:
   cat docs/plans/<project>.md

2. Improve the plan (optional):
   /beads-friendly-planning docs/plans/<project>.md

3. Convert to beads (when ready):
   /plan-to-beads docs/plans/<project>.md
```

---

## Example: Complete Workflow

### User Input

```bash
/founder-aware-planning "Build user authentication system"
```

### Phase 1: Founder DSL Questions (Condensed)

```
**Scale & Growth**
Q1: Users in 6 months? → "100-1,000"
Q2: Growth rate? → "Moderate"

**Data & Sensitivity**
Q3: Data type? → "User accounts (passwords)"
Q4: Export/deletion? → "No"

**Budget & Resources**
Q5: Monthly budget? → "$50-200"
Q6: Team size? → "2-3 people"

**Time & Risk**
Q7: Timeline? → "1-2 months"
Q8: Downtime tolerance? → "<1 hour"

[Conditional categories skipped - not relevant]
```

### Phase 2: Trade-off Menus

```
**Storage Decision**
Options: SQLite / PostgreSQL / Firebase
Recommendation: PostgreSQL (budget allows, scale needs)
User choice: "PostgreSQL via Neon"

**Auth Decision**
Options: DIY / Auth provider / SSO
Recommendation: Auth provider (don't handle passwords)
User choice: "Clerk"
```

### Phase 3: Pattern Catalog

```
**No special patterns needed** (single-tenant, no agents)

**Future Impacts:**
- Clerk vendor lock-in
- PostgreSQL scaling at high concurrency
```

### Output Plan

```markdown
# User Authentication Implementation Plan

## Goals
Add user authentication so users can securely access their data.
Success: Users can sign up via Clerk, log in, see dashboard.

## Constraints
- Budget: $50-200/month (selected stack: ~$50/month)
- Timeline: 1-2 months (MVP-focused)
- Scale: 100-1,000 users (PostgreSQL sufficient)
- Team: 2-3 people (moderate complexity OK)

## Architecture
- Auth: Clerk ($25/month) - don't handle password security
- Storage: PostgreSQL via Neon ($25/month) - handles concurrent writes

## Security
- Not regulated (standard security sufficient)
- Clerk handles passwords (Argon2id, breach detection)

## Future Impact Warnings
1. Clerk vendor lock-in → migration requires building own auth
2. PostgreSQL scaling → may need read replicas at >10k users
...
```

---

## Checklist: Complete Workflow

**Phase 1: Founder DSL**
- [ ] Load Founder DSL files
- [ ] Ask Layer 1 questions (A-D universal, E-J conditional)
- [ ] Record answers in founder-context.json
- [ ] Present Layer 2 trade-offs (relevant ones only)
- [ ] Record choices in founder-context.json
- [ ] Present Layer 3 patterns (relevant ones only)
- [ ] Record future impacts in founder-context.json

**Phase 2: Plan Creation**
- [ ] Load plan template
- [ ] Read founder-context.json
- [ ] Create plan with founder context integrated
- [ ] Write docs/plans/<project>.md
- [ ] Save founder-context.json

**Phase 3: Output**
- [ ] Present plan summary
- [ ] Show next steps (beads-friendly-planning, plan-to-beads)

---

## Key Principles

### 1. One Question at a Time

**Bad:** Ask all 31 questions at once
**Good:** Ask Q1, wait for answer, then ask Q2

### 2. Trade-offs Before Patterns

**Bad:** Jump straight to "use microservices"
**Good:** Show trade-offs (cost, complexity), then recommend pattern

### 3. Future Impacts Always

**Bad:** "Use SQLite" (no warnings)
**Good:** "Use SQLite, but know that >50 concurrent writers requires migration"

### 4. Respect Founder Constraints

**Bad:** "Use Kubernetes" (ignores $50 budget)
**Good:** "Neon PostgreSQL fits your $50-200 budget"

### 5. Document Rationale

**Bad:** "Auth: Clerk"
**Good:** "Auth: Clerk (rationale: don't want to handle password security ourselves)"

---

## Error Handling

**If user refuses to answer:**
```
I understand. Let me use reasonable defaults:
- Scale: Assume 100-1,000 users (startup scale)
- Budget: Assume $50-200/month (typical for small SaaS)
- Timeline: Assume 1-2 months (MVP-focused)

You can adjust these later in the plan if needed.
Continue with defaults? (y/n)
```

**If user wants unexpected option:**
```
Your choice isn't in the menu. That's OK!
Tell me more about what you're thinking, and I'll document it
with appropriate consequences.
```

---

**See Also:**
- `SKILL.md` - User-facing documentation
- `FOUNDER_DSL/` - Founder DSL definition files
- `templates/plan-template.md` - Plan structure template
