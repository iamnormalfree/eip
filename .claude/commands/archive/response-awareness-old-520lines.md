a# /response-awareness - Universal Smart Router

## Purpose
Universal entry point that assesses task complexity and routes to the appropriate orchestration tier. Prevents over-engineering simple tasks while ensuring complex work gets full systematic treatment.

**Core Innovation**: Dynamic routing based on actual complexity, not guesswork.

## Architecture Overview

### Five Tiers (Progressively Capable)

**LIGHT** (~5 tags, single-pass)
- Single file changes, bug fixes, cosmetic updates
- Minimal orchestration, fast execution
- Catches 80% of errors in simple tasks

**MEDIUM** (~15 tags, optional planning)
- Multi-file features, moderate complexity
- Basic planning and synthesis when needed
- Handles 90% of real-world tasks

**HEAVY** (~35 tags, full planning+synthesis)
- Complex single-domain features
- Full multi-path exploration
- Advanced verification protocols

**FULL** (~50+ tags, phase-chunked)
- Multi-domain architecture changes
- Progressive context loading (never holds all tags at once)
- Maximum systematic coordination

**SCOUT** (Assessment only)
- Deploys when complexity unclear
- Analyzes codebase and requirements
- Returns complexity assessment

### Why This Matters
- Simple tasks get simple treatment (fast, focused)
- Complex tasks get full rigor (systematic, verified)
- Can escalate if complexity emerges mid-execution
- Context efficient even for complex work

## Complexity Assessment Protocol

### Phase 0: Intelligent Routing

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

**File Scope** (0-3):
- 0 = Single file modification
- 1 = 2-3 related files
- 2 = Multi-file module
- 3 = Multi-domain (crosses system boundaries)

**Requirement Clarity** (0-3):
- 0 = Crystal clear, unambiguous
- 1 = Mostly clear, minor questions
- 2 = Ambiguous, needs interpretation
- 3 = Vague or contradictory

**Integration Risk** (0-3):
- 0 = Isolated change, no dependencies
- 1 = Touches existing APIs/interfaces
- 2 = Cross-module integration
- 3 = System-wide impact

**Change Type** (0-3):
- 0 = Cosmetic, documentation, config
- 1 = Logic changes within existing patterns
- 2 = New features, new patterns
- 3 = Architectural changes, paradigm shifts

**Total Score → Tier Routing:**
- **0-1** → LIGHT
- **2-4** → MEDIUM
- **5-7** → HEAVY
- **8+** → FULL

### Example Assessments

**"Fix login button styling"**
- File scope: 0 (single CSS/component file)
- Clarity: 0 (clear)
- Integration: 0 (isolated)
- Change type: 0 (cosmetic)
- **Score: 0 → LIGHT**

**"Add user authentication"**
- File scope: 3 (auth service, UI, backend, DB)
- Clarity: 1 (mostly clear)
- Integration: 2 (cross-module)
- Change type: 2 (new feature)
- **Score: 8 → FULL**

**"Refactor data fetching to use React Query"**
- File scope: 2 (multiple components)
- Clarity: 1 (clear pattern)
- Integration: 1 (API layer)
- Change type: 2 (new pattern)
- **Score: 6 → HEAVY**

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

**Step 2: Deploy Tier-Specific Orchestrator**
```
# CRITICAL: Use Read tool with EXPLICIT FILE PATHS (not directories!)

IF route == "LIGHT":
    Read file: .claude/commands/response-awareness-light.md
ELSE IF route == "MEDIUM":
    Read file: .claude/commands/response-awareness-medium.md
ELSE IF route == "HEAVY":
    Read file: .claude/commands/response-awareness-heavy.md
ELSE IF route == "FULL":
    Read file: .claude/commands/response-awareness-full/core.md
    # WARNING: This is a FILE inside a folder, not the folder itself!
    # Do NOT Read "response-awareness-full/" - causes EISDIR error on Windows

Deploy orchestrator with tier framework
Orchestrator executes tier-appropriate workflow
```

**Step 3: Monitor for Escalation**
```
IF agent reports "complexity exceeds tier":
    Calculate new tier
    Re-deploy with higher tier framework
    Continue from current phase
```

**Step 4: Synthesize Results**
```
Collect final outputs
Generate appropriate tier report
Return to user
```

## Escalation Protocol

Routing decisions aren't permanent. Agents can signal complexity exceeded:

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

1. Agent marks in output: `#COMPLEXITY_EXCEEDED: [reason]`
2. Orchestrator detects escalation marker
3. Re-assess with new information
4. Calculate appropriate tier
5. Load new tier framework
6. Continue execution with enhanced protocols
7. Preserve all work done so far (via LCL if needed)

### Example Escalation
```
Task: "Update login form validation"
Initial assessment: LIGHT (single component)

During implementation:
Agent discovers: Form validation affects 5 components + backend API
Agent reports: #COMPLEXITY_EXCEEDED: Multi-component + API integration

Orchestrator:
Re-assess: File scope now 2, Integration 1 → Score 3
Escalate: LIGHT → MEDIUM
Reload: response-awareness-medium.md
Continue: Implementation with medium-tier protocols
```

## Complexity-Scout Subagent (When Needed)

### Deploy Complexity-Scout When:
- Task description vague or incomplete
- Can't determine scope from description
- Conflicting signals about complexity
- User explicitly requests analysis

### How It Works:

The **complexity-scout** is a specialized subagent (see `.claude/subagents/complexity-scout.md`) that:
- Uses Glob to count affected files
- Uses Grep to identify integration points
- Uses Read to analyze complexity indicators
- Applies objective scoring criteria (0-3 per dimension)
- Identifies requirement ambiguities
- Generates clarifying questions if needed
- Returns structured assessment

### Deployment:
```
Deploy complexity-scout subagent with task: [user request]

Subagent will:
1. Analyze codebase structure
2. Score 4 dimensions (0-3 each):
   - File scope
   - Requirement clarity
   - Integration risk
   - Change type
3. If Requirement Clarity ≥ 1:
   - Generate clarifying questions
   - Request clarification before tier recommendation
4. If Requirement Clarity = 0:
   - Calculate total (0-12)
   - Recommend tier
5. Return structured assessment
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
- If scout recommends tier: Parse output, proceed with recommended tier

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
Load: response-awareness-medium.md
       ↓
Execute: Medium tier orchestration
       ↓
Monitor: Watch for escalation signals
       ↓
Complete: Synthesize results
       ↓
Return: Clean code + report
```

## Next Steps for Orchestrator

After routing decision made:

**IF LIGHT**: Use Read on `.claude/commands/response-awareness-light.md` and execute minimal orchestration
**IF MEDIUM**: Use Read on `.claude/commands/response-awareness-medium.md` and execute with optional planning
**IF HEAVY**: Use Read on `.claude/commands/response-awareness-heavy.md` and execute full planning+synthesis
**IF FULL**: Use Read on `.claude/commands/response-awareness-full/core.md` (the FILE, not folder!) and execute phase-chunked orchestration

**Manual Override Available**:
- User can specify tier: `/response-awareness-light`, `/response-awareness-medium`, etc.
- Useful when user knows complexity in advance

## Key Benefits of Smart Routing

✅ **Appropriate Complexity**: Simple tasks get simple treatment
✅ **Context Efficient**: Even complex tasks use minimal context per phase
✅ **Progressive Enhancement**: Can escalate if complexity emerges
✅ **Better Performance**: Less context = faster processing
✅ **Clear Mental Model**: Tiers are intuitive (light/medium/heavy/full)
✅ **Prevents Over-Engineering**: 50-tag system not invoked for button fix
✅ **Ensures Rigor When Needed**: Complex work gets full systematic treatment

<!-- OPTIONAL OBSERVABILITY FEATURE (Added 2025-10-06)
     Purpose: Provide visibility into framework operations for learning and debugging

     This is OPTIONAL and ADDITIVE - framework works normally without any flags.
     Only use when you want to study how the framework is operating internally.

     Overhead:
     - --light-logging: ~10 seconds, ~500 tokens (phase tracking + metrics)
     - --verbose-logging: ~60 seconds, ~2,500 tokens (complete audit trail)
-->

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
/response-awareness-heavy

# Light logging (workflow understanding)
/response-awareness-heavy --light-logging

# Verbose logging (deep learning/debugging)
/response-awareness-heavy --verbose-logging
```

## Flag Parsing

Extract logging flag from command arguments:
- If `--light-logging` present: Set LOGGING_LEVEL=light
- If `--verbose-logging` present: Set LOGGING_LEVEL=verbose
- If neither: Set LOGGING_LEVEL=none

Pass LOGGING_LEVEL to all deployed agents in their prompt context.
