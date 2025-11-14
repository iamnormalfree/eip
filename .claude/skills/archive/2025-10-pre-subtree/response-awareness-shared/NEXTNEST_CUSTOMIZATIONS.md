# NextNest Project Customizations

**Purpose**: NextNest-specific extensions for response-awareness framework
**Used by**: Router and all tier skills
**When loaded**: Always (at Phase 0 for router, at startup for tier skills)

---

## Configuration Loading

**All NextNest customizations are configuration-driven.**

Load settings from:

```javascript
// Load all configs at startup
const config = loadConfig('.claude/config/response-awareness-config.json');
const loggingConfig = loadConfig('.claude/config/logging-config.json');
const agentsConfig = loadConfig('.claude/config/agents-config.json');

// Extract feature flags
const VERBOSE_LOGGING = config.features.verbose_logging;
const PLAN_PERSISTENCE = config.features.plan_persistence;
const WORKTREE_INTEGRATION = config.features.worktree_integration;
const BRAINSTORMING_PRECHECK = config.features.brainstorming_precheck;
const LEARNING_MODE = loggingConfig.learning_mode.enabled;

// Extract paths
const LOG_PATH = config.paths.verbose_logs;  // docs/completion_drive_logs
const PLANS_PATH = config.paths.plans_active;  // docs/plans/active
const WORK_LOG = config.paths.work_log;  // docs/work-log.md
```

---

## Phase 0 Pre-Assessment Extensions

**These run BEFORE standard complexity assessment (Router only)**

### Extension 0.1: Git Worktree Check

**Only runs if:** `config.features.worktree_integration === true`

```bash
# Check for uncommitted changes
git status --porcelain
```

**Decision Logic:**

```javascript
const hasUncommitted = gitStatus.length > 0;

if (hasUncommitted && WORKTREE_INTEGRATION) {
  const currentBranch = runBash('git branch --show-current');

  // Analyze if new task is related to current branch
  const taskRelated = analyzeTaskRelatedness(userTask, currentBranch);

  if (!taskRelated) {
    // Offer worktree creation
    const response = askUser({
      question: `I see uncommitted work on ${currentBranch}. The new task seems unrelated. Should I create a worktree for this new task?`,
      header: "Worktree?",
      multiSelect: false,
      options: [
        {
          label: "Yes, create worktree",
          description: "Isolated workspace for new task, preserves current work"
        },
        {
          label: "No, continue here",
          description: "Work on new task in current branch alongside uncommitted changes"
        },
        {
          label: "Let me commit first",
          description: "I'll commit current work before starting new task"
        }
      ]
    });

    if (response === "Yes, create worktree") {
      // Deploy worktree-helper agent
      const worktreeResult = Task({
        subagent_type: "general-purpose",
        description: "Create git worktree",
        prompt: `
You are deploying the worktree-helper agent.

Current branch: ${currentBranch}
New task: ${userTask}

Follow instructions in .claude/agents/worktree-helper.md to:
1. Create worktree in .worktrees/[branch-name]/
2. Run setup (npm install, build, test)
3. Verify clean baseline
4. Document in docs/work-log.md
5. Return worktree path

Return JSON:
{
  "worktree_path": ".worktrees/[branch-name]",
  "branch_name": "[branch-name]",
  "setup_status": "success",
  "baseline_clean": true
}
        `
      });

      // Continue workflow IN THE WORKTREE
      changeDirectory(worktreeResult.worktree_path);

      // Log worktree creation
      if (VERBOSE_LOGGING) {
        logPhaseTransition({
          phase: "Phase 0.1",
          action: "Worktree created",
          path: worktreeResult.worktree_path,
          branch: worktreeResult.branch_name
        });
      }
    }
  }
}
```

### Extension 0.2: Brainstorming Pre-Check

**Only runs if:** `config.features.brainstorming_precheck === true`

**Detect vague language:**

```javascript
const vagueKeywords = [
  "maybe", "thinking about", "not sure", "could be", "explore",
  "wondering if", "what if", "should we", "might want"
];

const isVague = vagueKeywords.some(keyword =>
  userTask.toLowerCase().includes(keyword)
);

const hasMultipleQuestions = (userTask.match(/\?/g) || []).length > 1;

if (isVague || hasMultipleQuestions) {
  const response = askUser({
    question: "I notice some ambiguity in the requirements. Would you like structured brainstorming or conversational exploration?",
    header: "Approach?",
    multiSelect: false,
    options: [
      {
        label: "Structured brainstorming",
        description: "Use brainstorming skill to refine requirements step-by-step"
      },
      {
        label: "Conversational",
        description: "Explore the idea through natural conversation"
      }
    ]
  });

  if (response === "Structured brainstorming") {
    // Invoke brainstorming skill
    const clarifiedRequirements = Skill({
      command: "brainstorming"
    });

    // Update task with clarified requirements
    userTask = clarifiedRequirements;

    // Log brainstorming session
    if (VERBOSE_LOGGING) {
      logPhaseTransition({
        phase: "Phase 0.2",
        action: "Brainstorming completed",
        original_request: originalTask,
        clarified_request: userTask
      });
    }
  }
}
```

### Extension 0.3: Debug Task Detection

**Detect debugging tasks:**

```javascript
const debugKeywords = [
  "bug", "error", "not working", "broken", "fix", "failing",
  "crash", "issue", "problem", "TypeError", "undefined"
];

const isDebugTask = debugKeywords.some(keyword =>
  userTask.toLowerCase().includes(keyword)
);

if (isDebugTask) {
  const response = askUser({
    question: "This appears to be a debugging task. Should I use the systematic-debugging skill for root cause analysis?",
    header: "Debug mode?",
    multiSelect: false,
    options: [
      {
        label: "Yes, systematic debugging",
        description: "4-phase root cause investigation (recommended)"
      },
      {
        label: "No, I know the fix",
        description: "Skip debugging protocol, proceed with implementation"
      }
    ]
  });

  if (response === "Yes, systematic debugging") {
    // Route to systematic-debugging skill instead of tiers
    Skill({ command: "systematic-debugging" });

    // Exit router - debugging skill handles the task
    return;
  }
}
```

---

## Tier-Specific Customizations

**These run within tier skills (LIGHT, MEDIUM, HEAVY, FULL)**

### TDD Enforcement

**Applies to:** All tiers

```markdown
## TDD Mandatory Check

**Before ANY production code:**

1. **Write failing test first**
   - Create test file if doesn't exist
   - Write test that validates desired functionality
   - Run test to confirm it fails as expected

2. **Implementation**
   - Write ONLY enough code to make test pass
   - Run test to confirm success

3. **Refactor**
   - Clean up code while keeping tests green
   - Run full test suite

**CRITICAL (from CLAUDE.md):**
- TDD is MANDATORY for all features/bugfixes
- No exceptions
- Test-first workflow is non-negotiable
```

### CANONICAL_REFERENCES Check

**Applies to:** MEDIUM, HEAVY, FULL tiers

```markdown
## Pre-Implementation: CANONICAL_REFERENCES Check

**Before modifying ANY files:**

1. **Read CANONICAL_REFERENCES.md**
   ```bash
   cat CANONICAL_REFERENCES.md
   ```

2. **Check if planned files are Tier 1**
   - Tier 1 files have special change rules
   - Must run tests first
   - Must update dependent files
   - Must verify build

3. **If modifying Tier 1 files:**
   - ⚠️  Warning: "This file is in CANONICAL_REFERENCES.md"
   - Follow change process: Tests first → Update code → Update dependents → Verify build
```

### Component Placement Decision Tree

**Applies to:** MEDIUM, HEAVY, FULL tiers (when creating new files)

```markdown
## Pre-Implementation: Component Placement Check

**Before creating NEW files:**

1. **Run through Component Placement Decision Tree** (from CLAUDE.md)

**Question 1: Is this a test/development page?**
- YES → Create in `app/_dev/[feature-name]/page.tsx`
- NO → Continue

**Question 2: Is this experimental/in-progress code?**
- YES → Create in `components/archive/YYYY-MM/[experiment-name]/`
- NO → Continue

**Question 3: Is this a production page route?**
- YES → Create in `app/[route-name]/page.tsx`
  - ✅ Allowed: `app/apply/`, `app/calculator/`, `app/chat/`
  - ❌ Forbidden: `app/test-*`, `app/temp-*`, `app/*.backup.tsx`
- NO → Continue

**Question 4: Is this a reusable component?**
- YES → Determine folder:
  - UI primitives → `components/ui/`
  - Layout → `components/layout/`
  - Landing sections → `components/landing/`
  - Forms → `components/forms/`
  - AI Broker → `components/ai-broker/`
  - Etc.

**Validation:**
- No `test-*` or `temp-*` files in `app/`
- No `.backup.tsx` files (use git history)
- Follow 3+ related files rule for new subfolders
```

### YAGNI Ruthlessness

**Applies to:** All tiers

```markdown
## Design Validation: YAGNI Check

**Before implementing features:**

1. **Review plan for unrequested features**
   - Is this feature explicitly requested? YES/NO
   - If NO → Remove from plan

2. **Challenge "nice to have" features**
   - Will this be used immediately? YES/NO
   - If NO → Remove from plan

3. **Focus on minimum viable implementation**
   - What's the SMALLEST change that achieves the outcome?
   - Implement that, nothing more

**From CLAUDE.md:**
- "YAGNI. Best code is no code. Don't add features we don't need right now"
```

---

## Logging Enhancements

**Applies to:** All tiers (when verbose logging enabled)

### Log Locations Override

```javascript
// Override default log paths with NextNest config
const taskSlug = sanitizeForFilename(userTask, loggingConfig.log_formats.task_slug_max_length);
const timestamp = formatDate(new Date(), loggingConfig.log_formats.date_folder_format);

// All logs go to configured location
const logDir = `${LOG_PATH}/${timestamp}_${taskSlug}`;

// Specific log files
const phaseLog = loggingConfig.log_locations.phase_transitions
  .replace('{date}', timestamp)
  .replace('{task}', taskSlug);

const tagLog = loggingConfig.log_locations.tag_operations
  .replace('{date}', timestamp)
  .replace('{task}', taskSlug);

// etc.
```

### Learning Mode Integration

```javascript
if (LEARNING_MODE) {
  const summaryPath = loggingConfig.learning_mode.learning_summary_path
    .replace('{date}', timestamp)
    .replace('{task}', taskSlug);

  const sections = loggingConfig.learning_mode.include_sections;

  generateLearningSummary({
    path: summaryPath,
    sections: sections,
    tier: currentTier,
    complexity_score: complexityScore,
    what_worked: whatWorked,
    what_didnt_work: whatDidntWork,
    patterns_discovered: patternsDiscovered,
    tag_insights: tagInsights
  });
}
```

---

## Plan Persistence Enhancements

**Applies to:** MEDIUM (optional), HEAVY, FULL (mandatory)

### Plan Location Override

```javascript
if (PLAN_PERSISTENCE) {
  const date = formatDate(new Date(), 'YYYY-MM-DD');
  const featureSlug = sanitizeForFilename(userTask, 50);

  // Save to configured location
  const planPath = `${PLANS_PATH}/${date}-${featureSlug}.md`;

  // Follow CLAUDE.md plan format
  savePlan(planPath, {
    status: "active",
    complexity: tierName.toLowerCase(),
    estimated_hours: estimatedHours,
    problem: problemStatement,
    success_criteria: successCriteria,
    tasks: tasks,
    testing_strategy: testingStrategy,
    rollback_plan: rollbackPlan
  });

  // Update work-log.md
  appendToFile(WORK_LOG, `
## ${date} - ${userTask}

**Plan:** ${planPath}
**Status:** active
**Tier:** ${tierName}
**Estimated Hours:** ${estimatedHours}
  `);
}
```

---

## Agent Customizations

**Applies to:** All tiers

### Model Selection from Config

```javascript
// Use tier-appropriate model from config
const tierConfig = config.tier_preferences[tierName.toLowerCase()];

const modelToUse = tierConfig.model;

// Deploy agents with configured model
Task({
  subagent_type: "plan-synthesis-agent",
  model: modelToUse,  // From config, not hardcoded
  description: "Synthesize planning approaches",
  prompt: "..."
});
```

### Custom Agent Integration

```javascript
// Deploy NextNest-specific custom agents
if (agentsConfig.custom_agents.worktree_helper) {
  // Worktree helper available
}

// Apply agent overrides
const scoutConfig = agentsConfig.agent_overrides['complexity-scout'];

Task({
  subagent_type: "complexity-scout",
  model: scoutConfig.model,
  description: "Assess complexity",
  prompt: `
    Thoroughness: ${scoutConfig.thoroughness}
    Check worktrees: ${scoutConfig.check_worktrees}
    Check canonical references: ${scoutConfig.check_canonical_references}
    Use component placement tree: ${scoutConfig.use_component_placement_tree}
  `
});
```

---

## How to Use This Module

### In Router (response-awareness.md)

Add at the top of the file:

```markdown
## Load NextNest Customizations

Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

Load configurations and run Phase 0 extensions before standard complexity assessment.
```

### In Tier Skills

Add at startup:

```markdown
## Load Shared Modules

**Always:**
Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

Apply NextNest customizations:
- TDD enforcement
- CANONICAL_REFERENCES checks
- Component placement validation
- YAGNI ruthlessness
- Logging location overrides
- Plan persistence overrides
```

---

## Benefits

✅ **No Upstream Conflicts**: Customizations in separate file, upstream files unchanged
✅ **Single Source of Truth**: Update once, affects router and all tiers
✅ **Configuration-Driven**: All settings in `.claude/config/`, not hardcoded
✅ **Evolution-Proof**: Shared folder won't be forgotten during updates
✅ **CLAUDE.md Compliant**: Enforces project rules (TDD, YAGNI, canonical refs)
✅ **Easy to Disable**: Set feature flags to `false` in config

---

## Maintenance

**To enable/disable features:**
Edit `.claude/config/response-awareness-config.json`:
```json
{
  "features": {
    "worktree_integration": false,  // Disable worktrees
    "brainstorming_precheck": true,  // Enable brainstorming
    ...
  }
}
```

**To update customizations:**
Edit this file, all tiers automatically use updated version.

**To add new NextNest-specific feature:**
1. Add to this file
2. Update tier skills to apply the customization
3. Add config settings if needed

---

**Version:** 1.0
**Created:** 2025-10-18
**Purpose:** Keep NextNest customizations separate from upstream framework
