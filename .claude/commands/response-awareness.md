# /response-awareness - Universal Smart Router

## Purpose
Universal entry point that assesses task complexity and routes to the appropriate orchestration tier. Prevents over-engineering simple tasks while ensuring complex work gets full systematic treatment.

**Core Innovation**: Dynamic routing based on actual complexity, not guesswork.

---

## Load NextNest Customizations

Read file `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Git worktree check (if uncommitted changes detected)
- Extension 0.2: Brainstorming pre-check (if vague language detected)
- Extension 0.3: Debug task detection (if bug keywords detected)

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`

---

## Your Role as Router

You analyze the user's request, score its complexity, and invoke the appropriate Response Awareness tier Skill.

**You do NOT execute the workflow yourself** - you route to the Skill that contains the workflow.

---

## ⚠️ CRITICAL: Router Must Stop After Routing

**After announcing your tier decision, you MUST STOP IMMEDIATELY.**

**Allowed during routing:**
- ✅ Read files to assess complexity
- ✅ Grep/Glob to understand scope
- ✅ Calculate complexity score
- ✅ Announce routing decision

**FORBIDDEN after routing decision:**
- ❌ Edit/Write files (implementation)
- ❌ Create TodoWrite lists (that's tier work)
- ❌ Start working on the task
- ❌ Deploy agents (tier Skill does this)

**Required routing announcement format:**
```
Task complexity analysis:
- File Scope: X/3
- Requirement Clarity: X/3
- Integration Risk: X/3
- Change Type: X/3
- Total Score: X/12

→ Routing to: [TIER NAME] tier (Score X matches Y-Z range)

I'm now using the "Response Awareness [Tier Name]" skill for this task.
```

**CRITICAL: Immediately after announcing, you MUST explicitly state the skill loading:**

- If LIGHT tier: "I'm now using the **Response Awareness Light** skill for this task."
- If MEDIUM tier: "I'm now using the **Response Awareness Medium** skill for this task."
- If HEAVY tier: "I'm now using the **Response Awareness Heavy** skill for this task."
- If FULL tier: "I'm now using the **Response Awareness Full** skill for this task."

**This statement triggers the skill loading. Without it, the tier workflow will not activate.**

**After this statement: The tier Skill loads and takes over. Router is done.**

**VIOLATION:** If you continue working after the skill loading statement, you have bypassed the orchestration system and violated the router protocol. The orchestrator firewall will block you.

---

## Architecture Overview

### Five Tiers (Progressively Capable)

**LIGHT** (~5 tags, single-pass) 🚀 *Haiku implementation*
- Single file changes, bug fixes, cosmetic updates
- Minimal orchestration, fast execution
- Catches 80% of errors in simple tasks
- **Model**: Haiku for implementation (fast, cost-efficient)

**MEDIUM** (~15 tags, optional planning) 🚀 *Haiku implementation*
- Multi-file features, moderate complexity
- Basic planning and synthesis when needed
- Handles 90% of real-world tasks
- **Model**: Haiku for implementation (clear instructions)

**HEAVY** (~35 tags, full planning+synthesis) 🧠 *All Sonnet*
- Complex single-domain features
- Full multi-path exploration
- Advanced verification protocols
- **Model**: Sonnet for all phases (metacognition critical)

**FULL** (~50+ tags, phase-chunked) 🧠 *All Sonnet*
- Multi-domain architecture changes
- Progressive context loading (never holds all tags at once)
- Maximum systematic coordination
- **Model**: Sonnet for all phases (maximum metacognitive demands)

**SCOUT** (Assessment only) 🚀 *Always Haiku*
- Deploys when complexity unclear
- Analyzes codebase and requirements
- Returns complexity assessment
- **Model**: Haiku (objective measurement, no metacognition needed)

### Why This Matters
- Simple tasks get simple treatment (fast, focused)
- Complex tasks get full rigor (systematic, verified)
- Can escalate if complexity emerges mid-execution
- Context efficient even for complex work

---

## Complexity Assessment Protocol

### Phase 0: Intelligent Routing

**FIRST: Run NextNest Extensions** (see NEXTNEST_CUSTOMIZATIONS.md loaded above)

- If worktree needed → Deploy worktree-helper agent and continue in isolated workspace
- If brainstorming needed → Invoke brainstorming skill to clarify requirements first
- If debugging task → Route to systematic-debugging skill instead of tiers

**THEN: Continue with standard complexity assessment:**

**Step 1: Immediate Assessment** (no agent needed)

Check if task is obviously simple:
- ✅ Single file, clear requirement → **LIGHT**
- ✅ "fix typo", "update color", "rename variable" → **LIGHT**
- ✅ "write function that..." (standalone) → **LIGHT**

Check if task is obviously complex:
- ✅ "multi-system", "architecture", "refactor entire" → **HEAVY or FULL**
- ✅ Multiple domains mentioned → **FULL**
- ✅ "add authentication", "integrate with" → **HEAVY**

**Step 2: Scout Deployment** (if unclear)

Deploy **complexity-scout subagent** when:
- Task description is vague
- Unclear if single or multi-domain
- Can't determine file scope
- Requirements seem contradictory

Complexity-scout analyzes:
- Codebase structure for affected areas (uses Glob, Grep, Read)
- Requirement clarity and completeness
- Integration points and dependencies
- Provides structured scored assessment (0-12)

**Step 3: Complexity Scoring Matrix**

Score across 4 dimensions (0-3 each, max 12):

### File Scope (0-3)
- **0** = Single file modification
- **1** = 2-3 related files
- **2** = Multi-file module
- **3** = Multi-domain (crosses system boundaries)

### Requirement Clarity (0-3)
- **0** = Crystal clear, unambiguous
- **1** = Mostly clear, minor questions
- **2** = Ambiguous, needs interpretation
- **3** = Vague or contradictory

### Integration Risk (0-3)
- **0** = Isolated change, no dependencies
- **1** = Touches existing APIs/interfaces
- **2** = Cross-module integration
- **3** = System-wide impact

### Change Type (0-3)
- **0** = Cosmetic, documentation, config
- **1** = Logic changes within existing patterns
- **2** = New features, new patterns
- **3** = Architectural changes, paradigm shifts

**Total Score → Tier Routing:**
- **0-1** → LIGHT
- **2-4** → MEDIUM
- **5-7** → HEAVY
- **8+** → FULL

---

## Example Assessments

### "Fix login button styling"
- File scope: 0 (single CSS/component file)
- Clarity: 0 (clear)
- Integration: 0 (isolated)
- Change type: 0 (cosmetic)
- **Score: 0 → LIGHT**

### "Add user authentication"
- File scope: 3 (auth service, UI, backend, DB)
- Clarity: 1 (mostly clear)
- Integration: 2 (cross-module)
- Change type: 2 (new feature)
- **Score: 8 → FULL**

### "Refactor data fetching to use React Query"
- File scope: 2 (multiple components)
- Clarity: 1 (clear pattern)
- Integration: 1 (API layer)
- Change type: 2 (new pattern)
- **Score: 6 → HEAVY**

---

## Tier Capabilities & Tag Sets

### LIGHT Tier (response-awareness-light.md)
**Handles:** Single file, clear requirements, isolated changes
**Tags:** 5 essential (COMPLETION_DRIVE, QUESTION_SUPPRESSION, CARGO_CULT, PATH_DECISION, Potential_Issue)
**Orchestration:** Minimal, usually single agent
**Phases:** Implementation → Quick verification
**When to use:** Bug fixes, cosmetic changes, simple functions
**Escalates to MEDIUM when:** Multiple files discovered, integration complexity emerges

### MEDIUM Tier (response-awareness-medium.md)
**Handles:** Multi-file features, moderate complexity, clear scope
**Tags:** 15 (adds SPECIFICATION_REFRAME, DOMAIN_MIXING, CONSTRAINT_OVERRIDE, SUNK_COST_COMPLETION, CONTEXT_DEGRADED, LCL_EXPORT_CRITICAL, SUGGEST_* family, FALSE_COMPLETION, RESOLUTION_PRESSURE)
**Orchestration:** Optional planning, basic synthesis
**Phases:** (Planning optional) → Implementation → Verification
**When to use:** Standard features, moderate refactoring, contained systems
**Escalates to HEAVY when:** Multi-path decisions needed, architectural choices emerge

### HEAVY Tier (response-awareness-heavy.md)
**Handles:** Complex single-domain, multi-path exploration, architecture decisions
**Tags:** 35 (adds all path exploration, synthesis tags, pattern conflicts, full LCL)
**Orchestration:** Full planning + synthesis required
**Phases:** Phase 1 (Planning) → Phase 2 (Synthesis) → Phase 3 (Implementation) → Phase 4 (Verification)
**When to use:** Complex features, architectural changes in one domain, significant refactoring
**Escalates to FULL when:** Multiple domains discovered, cross-system integration needed

### FULL Tier (response-awareness-full/)
**Handles:** Multi-domain architecture, system-wide changes, maximum complexity
**Tags:** 50+ (everything, but chunked by phase)
**Orchestration:** Progressive context loading (phase files loaded just-in-time)
**Phases:** Phase 0 (Survey) → Phase 1 (Planning) → Phase 2 (Synthesis) → Phase 3 (Implementation) → Phase 4 (Verification) → Phase 5 (Report)
**When to use:** Multi-system features, architecture overhauls, maximum rigor needed
**Context management:** Loads phase files sequentially, never all at once

---

## Core Orchestration Principles (All Tiers)

These principles apply regardless of tier:

### Orchestrator Role
**Cognitive load**: Holding coordination map, agent status, phase transitions
**Mandatory delegation**: Not a rule, but cognitive necessity
- Orchestrator NEVER implements directly
- Orchestrator coordinates via sub-agent deployment
- Each agent has same capabilities, different cognitive loads

### Why Separation Works
If orchestrator implements, they lose coordination map. Orchestrator holds "whole", sub-agents hold "parts".

### Universal Workflow
1. Assess/plan (tier-appropriate depth)
2. Deploy implementation agents
3. Verify and resolve tags
4. Deliver clean code

### Context Management (All Tiers)
- Information stated once maintains signal
- LCL for clean context passing (no repeated discussion)
- Verification removes processing tags
- Only PATH tags persist as documentation

---

## Essential Tags (Failsafe Set - All Tiers)

These 5 tags catch the most critical errors at any complexity level:

### #COMPLETION_DRIVE
**What**: Generating plausible content for knowledge gaps
**Signal**: "I'm assuming this method exists based on naming patterns"
**Action**: Tag it - verification will check
**Why universal**: Most common error source across all tasks

### #QUESTION_SUPPRESSION
**What**: Should ask user for clarification but choosing assumption instead
**Signal**: "Not sure if they mean X or Y, but I'll assume X to keep moving"
**Action**: STOP - Ask the user (prevents wrong entire directions)
**Why universal**: Wrong direction is costly at any scale

### #CARGO_CULT
**What**: Pattern-completion adding unrequested features
**Signal**: "I'm adding error handling because this pattern usually has it"
**Action**: Mark as #SUGGEST if not specified
**Why universal**: Pattern momentum operates at all complexity levels

### #PATH_DECISION
**What**: Multiple implementation approaches considered
**Signal**: "Both approach A and B are viable here"
**Action**: Document alternatives and chosen path
**Why universal**: Even simple tasks have choices worth documenting

### #Potential_Issue
**What**: Discovered unrelated problem during work
**Signal**: "Noticed deprecated API usage in adjacent code"
**Action**: Report to user, don't fix unless asked
**Why universal**: Useful discoveries happen at any complexity

---

## Strategic Context Placement (LCL Basics)

**The Mechanism**: Information prefixed with "LCL:" is processed normally but NOT repeatedly discussed. Prevents context dilution.

**Why It Works**:
- Information stated once maintains clearer signal
- Avoids degradation from restating with variations
- Reduces context noise

**Protocol** (used in MEDIUM and above):
1. Agents export critical decisions: `#LCL_EXPORT_CRITICAL: key::value`
2. Orchestrator extracts and passes to next phase: `LCL: key::value`
3. Receiving agents work with it implicitly
4. No need to explicitly reference it repeatedly

**Reality**: This is strategic context management, not a "parallel layer". The benefit is real; the mechanism is simple.

---

## Routing Execution Protocol

### When /response-awareness [task] runs:

**Step 1: Assess Complexity**
```
IF task obviously simple (clear single-file):
    route = LIGHT
ELSE IF task obviously complex (multi-domain/architecture):
    route = HEAVY or FULL
ELSE:
    Deploy scout agent
    Get complexity score
    route = tier_from_score(score)
```

**Step 2: Invoke Tier-Specific Skill**

Based on routing decision, invoke the appropriate Skill:

```
Task complexity analysis:
- File Scope: X/3
- Requirement Clarity: X/3
- Integration Risk: X/3
- Change Type: X/3
- Total Score: X/12

→ Routing to: [TIER NAME] (Score X matches Y-Z range)

I'm now using the "Response Awareness [Tier]" skill for this task.
```

**Auto-execution protocol:**
- After announcing the routing decision, the router automatically loads and executes the appropriate tier skill
- No "y/n" confirmation prompts are provided or needed
- The router's responsibility ends after announcing the tier decision and skill loading statement
- Error handling logs failures and aborts loudly if tier invocation fails

**RA Summary Capture:**
- The system captures both: "Recommended tier: [TIER]" and "Executed: /response-awareness [TIER] ✅"
- Summary should document the routing decision and actual skill execution

Claude will automatically load that Skill's instructions and follow its workflow.

**Step 3: Monitor for Escalation**
```
IF Skill reports "complexity exceeds tier":
    Calculate new tier
    Invoke higher tier Skill
    Continue from current phase
```

**Step 4: Synthesize Results**
```
Collect final outputs from Skill execution
Generate appropriate tier report
Return to user
```

---

## Complexity-Scout Subagent (When Needed)

### Deploy Complexity-Scout When:
- Task description vague or incomplete
- Can't determine scope from description
- Conflicting signals about complexity
- User explicitly requests analysis

### How It Works:

The **complexity-scout** is a specialized assessment agent that:
- Uses Glob to count affected files
- Uses Grep to identify integration points
- Uses Read to analyze complexity indicators
- Applies objective scoring criteria (0-3 per dimension)
- Identifies requirement ambiguities
- Generates clarifying questions if needed
- Returns structured assessment

### Deployment:
```python
# ALWAYS use Haiku for scout (fast, cost-efficient, objective measurement)
Task(
    subagent_type="general-purpose",
    model="haiku",  # Haiku for speed + cost
    description="Analyze task complexity for response-awareness routing",
    prompt="""
You are analyzing task complexity for the Response-Awareness Framework.

Task: [user's request]

Analyze the codebase and provide scored assessment:

1. File Scope (0-3): How many files affected?
2. Requirement Clarity (0-3): How clear are requirements?
3. Integration Risk (0-3): What's the integration complexity?
4. Change Type (0-3): Cosmetic vs architectural?

Provide:
- Score for each dimension with reasoning
- Total score (0-12)
- Recommended tier (LIGHT/MEDIUM/HEAVY/FULL)
- Any clarifying questions if requirements unclear
"""
)
```

### Expected Output Format:
```
# COMPLEXITY ASSESSMENT

File Scope: X/3 - [reasoning with file counts]
Requirement Clarity: X/3 - [ambiguities identified]

[If Requirement Clarity ≥ 1]
Clarifying Questions:
1. [Question about ambiguity 1]
   - Options: [A, B, C]
2. [Question about ambiguity 2]
   - Options: [A, B, C]

Integration Risk: X/3 - [integration points found]
Change Type: X/3 - [architectural implications]

Total Score: X/12

[If clear]
Recommended Tier: [LIGHT|MEDIUM|HEAVY|FULL]
Rationale: [detailed reasoning]

[If ambiguous]
⚠️ CLARIFICATION NEEDED
Estimated Tier Range: [range based on other dimensions]
```

**Orchestrator Action**:
- If scout requests clarification: Ask user questions, then re-run scout with clarified requirements
- If scout recommends tier: Parse output, invoke recommended tier Skill

---

## 🎯 Specialized Subagent Reference

Once a tier Skill is invoked, it will guide agent deployment. Key specialists:

| Agent Type | Use For |
|------------|---------|
| **plan-synthesis-agent** | Unifying multiple planning approaches (Phase 2) |
| **data-architect** | Data modeling, schema design |
| **integration-specialist** | API design, event systems |
| **ui-state-synchronization-expert** | UI state bugs, screen transitions |
| **test-automation-expert** | Test strategy, MCP testing |
| **metacognitive-tag-verifier** | Tag verification (Phase 4) |

**Rule**: Use specialized agents over `general-purpose` when domain matches.

---

## 🛡️ Universal Implementation Firewall

**CRITICAL RULE: Once you use Task() → you are orchestrator → NEVER implement directly**

Hooks will enforce this:
- LIGHT: Direct implementation usually OK (unless Task() used)
- MEDIUM: Delegate if used Task()
- HEAVY: ALWAYS delegate
- FULL: ALWAYS delegate

**The orchestrator firewall hook will block Edit/Write if you violate this rule.**

---

## Escalation Protocol

Routing decisions aren't permanent. Skills can signal complexity exceeded:

### Escalation Triggers

**LIGHT → MEDIUM**:
- Multiple files discovered
- Integration complexity emerges
- Requirements more ambiguous than expected

**MEDIUM → HEAVY**:
- Architectural decisions required
- Multi-path exploration needed
- Complex cross-module integration

**HEAVY → FULL**:
- Multiple domains involved
- System-wide architecture impact
- Maximum rigor needed

### Escalation Process

1. Skill marks in output: `#COMPLEXITY_EXCEEDED: [reason]`
2. Router detects escalation marker
3. Re-assess with new information
4. Calculate appropriate tier
5. Invoke new tier Skill
6. Continue execution with enhanced protocols
7. Preserve all work done so far (via LCL if needed)

### Example Escalation
```
Task: "Update login form validation"
Initial assessment: LIGHT (single component)

During implementation:
Skill discovers: Form validation affects 5 components + backend API
Skill reports: #COMPLEXITY_EXCEEDED: Multi-component + API integration

Router:
Re-assess: File scope now 2, Integration 1 → Score 3
Escalate: LIGHT → MEDIUM
Invoke: "Response Awareness Medium" Skill
Continue: Implementation with medium-tier protocols
```

---

## Command Execution Flow

```
User: /response-awareness "add feature X"
       ↓
Router: Load response-awareness.md
       ↓
Assess: Complexity score = 4
       ↓
Route: MEDIUM tier
       ↓
Invoke: "Response Awareness Medium" Skill
       ↓
Skill Loads: Medium tier orchestration workflow
       ↓
Execute: Skill guides implementation
       ↓
Monitor: Watch for escalation signals
       ↓
Complete: Synthesize results
       ↓
Return: Clean code + report
```

---

## Next Steps After Routing

**IF LIGHT**: "Response Awareness Light" Skill loads and executes minimal orchestration
**IF MEDIUM**: "Response Awareness Medium" Skill loads and executes with optional planning
**IF HEAVY**: "Response Awareness Heavy" Skill loads and executes full planning+synthesis
**IF FULL**: "Response Awareness Full" Skill loads and executes phase-chunked orchestration

**Manual Override Available**:
- User can specify tier: `/response-awareness-light`, `/response-awareness-medium`, etc. (deprecated)
- Recommended: Always use `/response-awareness` router for objective assessment

---

## Key Benefits of Smart Routing

✅ **Appropriate Complexity**: Simple tasks get simple treatment
✅ **Context Efficient**: Even complex tasks use minimal context per phase
✅ **Progressive Enhancement**: Can escalate if complexity emerges
✅ **Better Performance**: Less context = faster processing
✅ **Clear Mental Model**: Tiers are intuitive (light/medium/heavy/full)
✅ **Prevents Over-Engineering**: 50-tag system not invoked for button fix
✅ **Ensures Rigor When Needed**: Complex work gets full systematic treatment

---

## Optional Logging Flags

**Default behavior**: No logging (fastest, minimal overhead)

**Available flags**:

### --light-logging
**Purpose**: Understand workflow and review decisions
**Logs**: Phase transitions, final metrics, LCL summary, PATH_DECISION points
**Overhead**: ~10 seconds per session, ~500 tokens
**When to use**: Learning how framework works, reviewing architectural decisions

**Output location**:
```
docs/completion_drive_logs/DD-MM-YYYY_task-name/
  phase_transitions.log
  final_metrics.md
```

### --verbose-logging
**Purpose**: Deep learning, debugging, complete audit trail
**Logs**: Everything - every tag insert/resolve, every LCL operation, detailed tracking
**Overhead**: ~60 seconds per session, ~2,500 tokens
**When to use**: Debugging issues, studying tag lifecycle, understanding LCL mechanics

**Output location**:
```
docs/completion_drive_logs/DD-MM-YYYY_task-name/
  phase_transitions.log
  tag_operations.log
  lcl_exports.log
  final_metrics.md
  detailed_report.md
```

## Usage Examples

```bash
# No logging (default - fastest)
/response-awareness "add feature X"

# Light logging (workflow understanding)
/response-awareness "add feature X" --light-logging

# Verbose logging (deep learning/debugging)
/response-awareness "add feature X" --verbose-logging
```

## Flag Parsing

Extract logging flag from command arguments:
- If `--light-logging` present: Set LOGGING_LEVEL=light
- If `--verbose-logging` present: Set LOGGING_LEVEL=verbose
- If neither: Set LOGGING_LEVEL=none

**Pass LOGGING_LEVEL to all Skills** in their invocation context or via prompt.

---

**Router Version: 2.1 (Auto-execution enhancement)
**Last Updated: 2025-11-12
**Architecture**: Universal router + Tier Skills
