# Response-Awareness Framework: Plan Persistence

**Purpose**: Mandatory plan and blueprint persistence for evaluation and audit

**Location**: `docs/completion_drive_plans/DD-MM-YYYY_task-name/`

**Why this matters**:
- Review planned approach before implementation starts
- Compare planned vs. actual implementation
- Audit decision-making process
- Debug architectural choices ("why did we choose X?")
- Learn from planning patterns over time
- Enable progressive context loading (FULL tier)
- Create permanent record of exploration

---

## Folder Naming Convention

```
docs/completion_drive_plans/DD-MM-YYYY_task-name/
```

**Parts**:
- `DD-MM-YYYY`: Current date (e.g., 18-10-2025)
- `task-name`: Brief task description in kebab-case (e.g., auth-system, data-refactor)

**Examples**:
- `docs/completion_drive_plans/18-10-2025_websocket-integration/`
- `docs/completion_drive_plans/15-10-2025_virtual-scrolling/`
- `docs/completion_drive_plans/12-10-2025_multi-domain-auth/`

---

## MEDIUM Tier: Optional Plan Persistence

**When**: If optional planning phase was executed

**File**: `plan_MEDIUM_HHMMSS.md`

**Format**: `docs/completion_drive_plans/DD-MM-YYYY_task-name/plan_MEDIUM_153045.md`

**Must include**:
- Scope analysis (what files/domains covered)
- Approaches explored (2-3 alternatives)
- Selected path with rationale
- Implementation steps

**Template**:
```markdown
# Planning Output: MEDIUM Tier
## Task: [task description]
## Date: [DD-MM-YYYY HH:MM:SS]

## Scope Analysis
[What files/domains this plan covers]

## Approaches Explored

### Approach A: [name]
- Pros: [...]
- Cons: [...]

### Approach B: [name]
- Pros: [...]
- Cons: [...]

## Selected Approach
[Chosen path with reasoning]

## Implementation Steps
1. [Step 1]
2. [Step 2]
3. [...]

## Tagged Uncertainties
[Any #PLAN_UNCERTAINTY, #COMPLETION_DRIVE flags]
```

---

## HEAVY Tier: Mandatory Plan + Blueprint

### Phase 1: Planning Agent Output

**File**: `plan_HEAVY_HHMMSS.md`

**Format**: `docs/completion_drive_plans/DD-MM-YYYY_task-name/plan_HEAVY_153045.md`

**Must include**:
- Scope analysis (what files/domains covered)
- Approach exploration (2-3 alternatives with trade-offs)
- All tags marked (#PATH_DECISION, #PLAN_UNCERTAINTY, etc.)
- Selected approach with #PATH_RATIONALE
- Implementation sequencing

**Template**:
```markdown
# Planning Agent Output: HEAVY Tier
## Task: [task description]
## Date: [DD-MM-YYYY HH:MM:SS]

## Scope Analysis
[What files/domains this plan covers]

## Approach Exploration

### Approach A: [name]
**Design**: [technical description]

**Pros**:
- [benefit 1]
- [benefit 2]

**Cons**:
- [limitation 1]
- [limitation 2]

**Complexity**: [Low/Medium/High]

**#PATH_DECISION: [Why this is viable]**

---

### Approach B: [name]
[Same structure as Approach A]

**#POISON_PATH: [If applicable - terminology constraining solution space]**

---

### Approach C: [name] (if applicable)
[Same structure]

**#FIXED_FRAMING: [If applicable - problem framing limiting alternatives]**

---

## Selected Approach
**Chosen**: Approach [X]

**#PATH_RATIONALE: [Detailed reasoning for choice]**
- Why this approach over alternatives
- Trade-offs accepted
- How this fits requirements

## Tagged Uncertainties
**#PLAN_UNCERTAINTY**: [Assumptions needing validation]
**#ANTICIPATION_BIAS**: [Features planned beyond requirements - mark as optional]
**#COMPLETION_DRIVE**: [Assumptions made about existing code]

## Implementation Sequence
1. [Step 1]
2. [Step 2]
3. [...]

## LCL Exports
#LCL_EXPORT_CRITICAL: [Critical architectural decisions for implementation phase]
#LCL_EXPORT_FIRM: [Technical decisions needing precision]
#LCL_EXPORT_CASUAL: [Style/preference guidance]
```

### Phase 2: Synthesis Blueprint

**File**: `FINAL_BLUEPRINT_HHMMSS.md`

**Format**: `docs/completion_drive_plans/DD-MM-YYYY_task-name/FINAL_BLUEPRINT_153045.md`

**Must include**:
- Summary of approaches explored
- PATH_RATIONALE for major decisions
- Unified architecture
- Implementation sequencing

**Template**:
```markdown
# Synthesis Blueprint: HEAVY Tier
## Task: [task description]
## Date: [DD-MM-YYYY HH:MM:SS]

## Overview
[High-level summary of what we're building]

## Approaches Explored
[Summary of Approach A, B, C from planning phase]

## Selected Approach
**Chosen**: [approach name]

**#PATH_RATIONALE: [Why this approach chosen]**

Reasoning:
- [Reason 1 with supporting evidence]
- [Reason 2 with supporting evidence]
- [Trade-offs accepted]

Rejected alternatives:
- Approach [Y]: [why not chosen]
- Approach [Z]: [why not chosen]

**Validation tags**:
- **#PHANTOM_PATTERN**: [If false familiarity detected - verify before trusting]
- **#FALSE_FLUENCY**: [If over-confident reasoning - mark for extra verification]
- **#CONFIDENCE_DISSONANCE**: [If confidence doesn't match certainty - validate]

## Unified Architecture
[Single coherent architecture description]

## Implementation Sequence
1. [Phase/step 1]
2. [Phase/step 2]
3. [...]

**Sequencing rationale**: [Why this order]

## LCL Exports
#LCL_EXPORT_CRITICAL: [Context for implementation phase]
#LCL_EXPORT_FIRM: [Technical decisions binding implementation]
```

---

## FULL Tier: Multi-Domain Plan + Unified Blueprint

### Phase 1: Domain Planning Outputs

**Files**: `plan_[domain]_HHMMSS.md` (one per domain)

**Format**: `docs/completion_drive_plans/DD-MM-YYYY_task-name/plan_auth-service_153045.md`

**Must include**:
- Domain scope
- Explored approaches (2-3 per domain)
- Integration contracts with other domains
- Dependencies and sequencing
- Risk mitigation strategies
- All domain-specific tags
- LCL exports for cross-domain coordination

**Template**:
```markdown
# Domain Planning Output: [domain-name]
## Task: [task description]
## Domain: [domain-name]
## Date: [DD-MM-YYYY HH:MM:SS]

## Domain Scope
[What this domain covers - files, modules, responsibilities]

## Explored Approaches

### Approach A: [name]
**Design**: [technical description]

**Pros**:
- [benefit 1]
- [benefit 2]

**Cons**:
- [limitation 1]
- [limitation 2]

**Integration impact**: [How this affects other domains]

**#PATH_DECISION: [Why this is viable]**

---

### Approach B: [name]
[Same structure as Approach A]

**#POISON_PATH: [If applicable]**

---

### Approach C: [name] (if applicable)
[Same structure]

**#FIXED_FRAMING: [If applicable]**

---

## Recommended Approach
**Chosen**: Approach [X]

**#PATH_RATIONALE: [Why chosen for this domain]**
- Domain-specific reasoning
- How it fits with other domains
- Trade-offs specific to this domain

## Integration Contracts

### Contract: [This Domain] → [Other Domain]
**Type**: [API/Event/Data/Function]

**Interface**:
```
[Explicit signature/schema]
```

**Example**:
```
[Concrete example of contract usage]
```

**Validation**:
- [How to verify contract satisfied]

**Owned by**: [this domain]
**Consumed by**: [other domains]

**#LCL_EXPORT_CRITICAL: contract::[this_domain]_[other_domain]::[contract_summary]**

---

### Contract: [Other Domain] → [This Domain] (Required)
[What this domain needs from others]

---

## Dependencies

**Sequential dependencies** (must happen in order):
1. [Dependency 1 must complete first]
2. [Then this domain can proceed]

**Parallel work** (can happen simultaneously):
- [Work that can run in parallel with other domains]

## Risk Mitigation

### Risk: [Description]
**Severity**: [High/Medium/Low]
**Location**: [file/module]

**Mitigation Strategy**:
1. [Specific action to reduce risk]
2. [Fallback if action fails]
3. [Validation method]

**#PATH_DECISION: [Chosen mitigation approach]**

## Tagged Uncertainties
**#PLAN_UNCERTAINTY**: [Assumptions needing validation]
**#ANTICIPATION_BIAS**: [Features beyond requirements]
**#COMPLETION_DRIVE**: [Assumptions about existing code]
**#PARALLEL_DEGRADATION**: [If planning became too complex - consider splitting]

## LCL Exports for Synthesis Phase
#LCL_EXPORT_CRITICAL: contract::[domain]::[summary]
#LCL_EXPORT_CRITICAL: integration::[domain]::[dependencies]
#LCL_EXPORT_FIRM: technical_decision::[domain]::[summary]
#LCL_EXPORT_CASUAL: implementation_preference::[domain]::[summary]
```

### Phase 2: Unified Blueprint

**File**: `FINAL_BLUEPRINT_HHMMSS.md`

**Format**: `docs/completion_drive_plans/DD-MM-YYYY_task-name/FINAL_BLUEPRINT_153045.md`

**Must include**:
- Summary of all domain plans reviewed
- Cross-domain integration strategy
- Unified architecture
- PATH_RATIONALE for major cross-domain decisions
- Implementation sequencing (which domains first)
- Integration contract specifications
- Multi-domain coordination approach

**Template**:
```markdown
# Unified Blueprint: Multi-Domain Implementation
## Task: [task description]
## Date: [DD-MM-YYYY HH:MM:SS]
## Phase: 2 (Synthesis)

## Overview
[High-level summary of complete multi-domain implementation]

## Domain Plans Reviewed
- Domain 1: [plan file path] - [brief summary of recommendation]
- Domain 2: [plan file path] - [brief summary of recommendation]
- Domain 3: [plan file path] - [brief summary of recommendation]

## Cross-Domain Integration Strategy
[How domains will communicate and coordinate]

**Integration validation checkpoints**:
1. Checkpoint 1: [After which domains complete] - [What to validate]
2. Checkpoint 2: [After which integration] - [What to validate]

**Progressive integration approach**:
- Level 1: Stub integration (isolated domain development)
- Level 2: Contract integration (validate contracts work)
- Level 3: End-to-end integration (full system validation)

## Domain Implementations

### Domain: [name]
**Selected Approach**: [approach name from domain planning]

**#PATH_RATIONALE: [Why this approach for this domain]**
- Domain-specific reasoning
- Cross-domain compatibility justification
- Integration simplification
- Risk considerations

**Key Files**: [files to modify/create]

**Integration Points**:
- Exposes: [contracts this domain provides]
- Requires: [contracts this domain needs]

**Dependencies**: [What must complete before this domain can start]

---

[Repeat for each domain]

---

## Integration Contracts (Final)

### Contract: [Domain A] → [Domain B]
**Type**: [API/Event/Data/Function]

**Interface**:
```
[Final validated contract specification after conflict resolution]
```

**Status**: [✅ Compatible / ⚠️ Requires adapter / ❌ Conflict resolved]

**Resolution notes** (if applicable):
- Original conflict: [description]
- Resolution: [how conflict was resolved]
- #PATH_RATIONALE: [why this resolution chosen]

---

[Repeat for all contracts]

---

## Implementation Sequence

### Phase 3A: Foundation (Parallel where possible)
**Parallel Work** (no dependencies):
- Domain [X]: [work description]
- Domain [Y]: [work description]

**Sequential Work** (must go in order):
1. Domain [Z]: [must go first because...]
2. Domain [W]: [depends on Z completion]

**Checkpoint**: [How to validate Phase 3A complete]

---

### Phase 3B: Integration
**After Phase 3A completes**:
- Integrate Domain [X] with Domain [Y]
- Validate contract: [specific contract to test]

**Checkpoint**: [Integration tests to run]

---

### Phase 3C: Completion
**After Phase 3B validates**:
- Domain [W]: [final domain work]
- End-to-end integration test

**Checkpoint**: [Final validation criteria]

---

**Sequencing rationale**: [Why this order chosen]
- [Reason 1 - dependency constraints]
- [Reason 2 - risk mitigation]
- [Reason 3 - resource efficiency]

## PATH_RATIONALE: Major Cross-Domain Decisions

### Decision 1: [Description]
**Domains affected**: [list]

**Options considered**:
1. Option A: [description] - Rejected because [reason]
2. Option B: [description] - Rejected because [reason]
3. Option C: [description] - **CHOSEN**

**#PATH_RATIONALE: [Detailed reasoning]**
- Why this option best balances competing needs across domains
- Trade-offs accepted
- How this impacts implementation across all domains

**Validation tags**:
- **#PHANTOM_PATTERN**: [If applicable - verify before trusting familiarity]
- **#FALSE_FLUENCY**: [If applicable - extra verification needed despite confidence]
- **#CONFIDENCE_DISSONANCE**: [If applicable - confidence doesn't match certainty]

---

[Repeat for each major decision]

---

## Conflict Resolutions

### Conflict: [Description]
**Domains involved**: [Domain A, Domain B]

**Original conflict**: [What was incompatible]

**Resolution**: [How resolved]

**#PATH_RATIONALE: [Why this resolution optimal]**

**Impact**:
- Domain A changes: [what changed]
- Domain B changes: [what changed]
- New/updated contract: [contract specification]

---

[Repeat for each conflict]

---

## Risk Mitigation (Cross-Domain)
[Updated risk mitigation strategies considering all domains]

### Risk: [Description]
**Domains affected**: [list]
**Severity**: [High/Medium/Low]

**Mitigation strategy**:
1. [Action across domains]
2. [Validation approach]
3. [Rollback plan if fails]

## Progressive Integration & Rollback

**Rollback strategy per checkpoint**:

**Checkpoint 1**: [After Phase 3A]
- If validation fails: [what to revert]
- Recovery approach: [how to recover]

**Checkpoint 2**: [After Phase 3B]
- If validation fails: [what to revert]
- Recovery approach: [how to recover]

**Production rollout** (if applicable):
1. Feature flag 10% traffic
2. Monitor metrics: [what to watch]
3. Increase to 50% if stable
4. Increase to 100% if stable
5. Rollback trigger: [what conditions trigger rollback]

## LCL Exports for Phase 3

#LCL_EXPORT_CRITICAL: blueprint::implementation_sequence::[sequence_summary]
#LCL_EXPORT_CRITICAL: contract::final::[all_contracts_summary]
#LCL_EXPORT_CRITICAL: integration::strategy::[integration_approach]
#LCL_EXPORT_FIRM: decision::technical::[major_decisions]
#LCL_EXPORT_FIRM: conflict_resolution::[resolutions]
#LCL_EXPORT_CASUAL: preference::implementation::[preferences]
```

---

## Important Notes

### Mandatory vs Optional Persistence

**Mandatory**:
- HEAVY tier: Phase 1 plan + Phase 2 blueprint
- FULL tier: Phase 1 domain plans (all domains) + Phase 2 unified blueprint

**Optional**:
- MEDIUM tier: Plan only if planning phase executed
- LIGHT tier: No plan persistence

### Writing Plans to Disk

**Use Write() tool**:
```python
# Example plan write
Write(
    file_path="docs/completion_drive_plans/18-10-2025_auth-system/plan_HEAVY_153045.md",
    content="[full plan content following template]"
)
```

**Failed writes**:
- Warn user if Write() fails
- Do NOT block execution
- Continue with implementation
- Plans are for audit/review, not execution dependencies

### Plans vs TodoWrite

**Different purposes**:
- **Plans (Write to disk)**: What/why we're building, architectural decisions, approach exploration
- **TodoWrite**: Task tracking, progress monitoring, implementation checklist

**Both serve different needs**:
- Plans enable human review and future context
- TodoWrite enables real-time progress tracking

### Progressive Context Loading (FULL tier)

**Why disk persistence critical for FULL**:
- Phase 2 synthesis can read domain plans from disk
- Avoids holding all domain plans in context simultaneously
- Enables: Read plan → Synthesize → Unload → Read next plan
- Reduces context pressure for multi-domain work

**Access pattern**:
```python
# Phase 2 synthesis agent
# Instead of: holding all plans in context
# Do this: progressive reading

Read("docs/completion_drive_plans/18-10-2025_task/plan_auth-service_153045.md")
# ... synthesize auth decisions ...

Read("docs/completion_drive_plans/18-10-2025_task/plan_frontend_153046.md")
# ... synthesize frontend decisions ...

# Synthesize cross-domain integration
Write("docs/completion_drive_plans/18-10-2025_task/FINAL_BLUEPRINT_153050.md")
```

### User Review Checkpoints

**Before Phase 3 implementation**:
- User can review FINAL_BLUEPRINT to approve architectural approach
- Prevents implementing wrong architecture across multiple domains
- Especially critical for FULL tier (multi-domain impact)

**Review triggers**:
- Automatic: Blueprint written to disk
- Manual: User checks `docs/completion_drive_plans/[folder]/`
- Explicit: Ask user "Review blueprint before Phase 3?"

---

## File Organization Summary

```
docs/completion_drive_plans/
├── 18-10-2025_auth-system/
│   ├── plan_HEAVY_153045.md          (Phase 1 planning)
│   └── FINAL_BLUEPRINT_153050.md     (Phase 2 synthesis)
│
├── 15-10-2025_multi-domain-refactor/
│   ├── plan_auth-service_153045.md   (Domain 1 plan)
│   ├── plan_frontend_153046.md       (Domain 2 plan)
│   ├── plan_database_153047.md       (Domain 3 plan)
│   └── FINAL_BLUEPRINT_153055.md     (Unified blueprint)
│
└── 12-10-2025_simple-feature/
    └── plan_MEDIUM_153045.md         (Optional MEDIUM plan)
```

---

**Version**: 1.0
**Last Updated**: 2025-10-18
**Consolidated From**: MEDIUM, HEAVY, FULL tier skills (response-awareness framework)
