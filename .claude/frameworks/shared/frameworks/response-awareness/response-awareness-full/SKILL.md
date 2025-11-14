---
name: Response Awareness Full
description: Multi-domain architecture changes with phase-chunked progressive loading. Complexity score 8+ of 12. Use when task crosses system boundaries, affects multiple domains, involves paradigm shifts, or has system-wide impact. Six phases (Survey, Planning, Synthesis, Implementation, Verification, Reporting) with 50+ tags loaded progressively. Maximum systematic coordination. Required agents include plan-synthesis-agent and metacognitive-tag-verifier.
---


## Purpose
Maximum rigor orchestration for multi-domain architecture changes and system-wide features. Progressive phase loading ensures context efficiency even at maximum complexity.

**When to use**: Multi-domain systems, architecture overhauls, cross-system integration
**Complexity score**: 8+ (out of 12)
**Model strategy**: 🧠 **All Sonnet** (maximum metacognitive demands across all phases)

## Load Shared Observability Modules

**Logging** (if LOGGING_LEVEL != none):
Read file `.claude/skills/response-awareness-shared/LOGGING_INSTRUCTIONS.md`

**Plan Persistence** (always):
Read file `.claude/skills/response-awareness-shared/PLAN_PERSISTENCE.md` (FULL Tier section)

## Architecture: Phase-Chunked Loading

FULL tier uses **progressive context management**:
- **core.md** (this file) - Always loaded, contains orchestration principles
- **Phase files** - Loaded just-in-time, cleared after execution
- **Never holds all tags simultaneously** - Maximum ~400 lines in context per phase

## 🎯 Model & Agent Guidance (FULL Tier)

### Model Selection: All Sonnet
**FULL tier requires Sonnet for ALL phases and ALL agents:**
- **Why Sonnet everywhere**: Multi-domain complexity requires maximum metacognition
  - Survey: Identifying stakeholders across systems needs pattern recognition
  - Planning: Multi-domain exploration needs spotting integration points
  - Synthesis: Cross-domain unification needs catching contradictions
  - Implementation: Multi-system coordination needs assumption tracking
  - Verification: System-wide verification needs finding subtle issues
- **Why not Haiku**: Multi-domain work has too many metacognitive demands
- **Cost/benefit**: System-wide architecture changes are high-stakes, quality paramount

### Phase-Agent Mapping (FULL Tier)

| Phase | Purpose | Recommended Agents | Model |
|-------|---------|-------------------|-------|
| **Phase 0: Survey** | Understand existing system | `implementation-planner` | **Sonnet** |
| **Phase 1a: UI/UX Planning** | Design UI approach | `general-purpose` (no UI specialist yet) | **Sonnet** |
| **Phase 1b: Systems Planning** | Design integration | `integration-specialist` | **Sonnet** |
| **Phase 1c: Data Planning** | Design data model | `data-architect` | **Sonnet** |
| **Phase 2: Synthesis** | Unify planning | `plan-synthesis-agent` (REQUIRED) | **Sonnet** |
| **Phase 3a: Data Implementation** | Implement data model | `data-architect` (same from 1c) | **Sonnet** |
| **Phase 3b: Systems Implementation** | Implement integration | `integration-specialist` (same from 1b) | **Sonnet** |
| **Phase 3c: UI Implementation** | Implement UI changes | `ui-state-synchronization-expert` | **Sonnet** |
| **Phase 4a: Testing** | Execute test plan | `test-automation-expert` | **Sonnet** |
| **Phase 4b: Tag Verification** | Verify all tags | `metacognitive-tag-verifier` (REQUIRED) | **Sonnet** |
| **Phase 5: Documentation** | Generate final report | `documentation-specialist` | **Sonnet** |

**Critical Rules**:
1. Phase 2 (Synthesis) MUST use `plan-synthesis-agent` - not negotiable
2. Phase 4b (Tag Verification) MUST use `metacognitive-tag-verifier` - not negotiable
3. Domain specialists should carry through from planning to implementation
4. ALL agents use **Sonnet** model - multi-domain complexity demands it

---
## ⚠️ COMMON MISTAKE: Overusing `general-purpose` in FULL Tier

**Real Example from Failed Session**:
- Phase 0: Used `general-purpose` (missed `implementation-planner`)
- Phase 1a/1b/1c: Used `general-purpose` for all 3 (missed all specialists)
- Phase 2: Used `general-purpose` (missed `plan-synthesis-agent`)
- Phase 3: Used `general-purpose` for all (missed carrying specialists through)
- Phase 4a: Used `general-purpose` (missed `test-automation-expert`)
- Phase 4b: Skipped entirely (no `metacognitive-tag-verifier`)
- Phase 5: Used `general-purpose` (missed `documentation-specialist`)

**Result**: 7/9 deployments were generic, missed ALL specialized domain expertise

**Correct Pattern**:
```python
# Phase 0 (Sonnet)
Task(
    subagent_type="implementation-planner",
    model="claude-sonnet-4-5-20250929",  # Sonnet for codebase analysis
    description="Survey codebase for skill tree integration",
    prompt="Survey codebase for skill tree integration points..."
)

# Phase 1c (Data Planning - Sonnet)
Task(
    subagent_type="data-architect",
    model="claude-sonnet-4-5-20250929",  # Sonnet for multi-domain planning
    description="Design skill tree data model",
    prompt="Design skill tree data model..."
)

# Phase 2 (Synthesis - REQUIRED, Sonnet)
Task(
    subagent_type="plan-synthesis-agent",
    model="claude-sonnet-4-5-20250929",  # Synthesis MUST be Sonnet
    description="Synthesize skill tree planning approaches",
    prompt="Synthesize skill tree planning approaches..."
)

# Phase 3a (Data Implementation - Sonnet, same specialist)
Task(
    subagent_type="data-architect",
    model="claude-sonnet-4-5-20250929",  # Same specialist, still Sonnet
    description="Implement skill tree data model",
    prompt="Implement skill tree data model from synthesis..."
)

# Phase 4b (Tag Verification - REQUIRED, Sonnet)
Task(
    subagent_type="metacognitive-tag-verifier",
    model="claude-sonnet-4-5-20250929",  # Verification MUST be Sonnet
    description="Verify all tags resolved",
    prompt="Verify all tags resolved across all phases..."
)

# Phase 5 (Documentation - Sonnet)
Task(
    subagent_type="documentation-specialist",
    model="claude-sonnet-4-5-20250929",  # Comprehensive docs need Sonnet
    description="Generate skill tree implementation report",
    prompt="Generate comprehensive skill tree implementation report..."
)
```

**When `general-purpose` is acceptable**:
- Phase 1a (no specialized UI planner exists yet)
- Simple glue code between specialized components
- NEVER for Phase 2 synthesis
- NEVER for Phase 4b tag verification
---

### Phase Sequence

**Phase 0: Survey** → Load `phase0-survey.md`
- Codebase assessment across all affected domains
- Stakeholder identification (systems, modules, APIs)
- Initial complexity validation
- **Agent**: `implementation-planner` (codebase analysis specialist)

**Phase 1: Planning** → Load `phase1-planning.md`
- Multi-domain planning agents (1-5 agents)
- Interface analysis and integration contracts
- Multi-path exploration with dependencies
- **Agents**: Domain specialists (`data-architect`, `integration-specialist`, etc.)

**Phase 2: Synthesis** → Load `phase2-synthesis.md`
- Cross-domain path selection
- Integration strategy synthesis
- Unified blueprint creation
- **Agent**: `plan-synthesis-agent` (REQUIRED)

**Phase 3: Implementation** → Load `phase3-implementation.md`
- Coordinated implementation across domains
- Progressive integration with validation
- Comprehensive pattern detection
- **Agents**: Same specialists from Phase 1 (consistency crucial)

**Phase 4: Verification** → Load `phase4-verification.md`
- Multi-domain verification protocols
- Integration testing strategies
- Complete tag resolution
- **Agents**: `test-automation-expert`, `metacognitive-tag-verifier` (REQUIRED)

**Phase 5: Report** → Load `phase5-report.md`
- Architectural decision documentation
- Integration summary
- Handoff documentation
- **Agent**: `documentation-specialist` (technical writing expert)

## Failsafe Tag Set (Always Available)

These 5 tags are available in ALL phases as safety net:

### #COMPLETION_DRIVE
**Recognition signal**: "I'm assuming this method exists based on naming patterns"
**Action**: Tag it - verification will check
**Why always available**: Most common error source at any phase

### #QUESTION_SUPPRESSION
**Recognition signal**: "Not sure if they mean X or Y, but I'll assume X to keep moving"
**Action**: STOP - Ask the user (prevents wrong entire directions)
**Why always available**: Wrong direction is costly in any phase

### #CARGO_CULT
**Recognition signal**: "I'm adding error handling because this pattern usually has it"
**Action**: Mark as #SUGGEST if not specified
**Why always available**: Pattern momentum operates in all phases

### #PATH_DECISION
**Recognition signal**: "Both approach A and B are viable here"
**Action**: Document alternatives and chosen path
**Why always available**: Decisions happen in every phase

### #Potential_Issue
**Recognition signal**: "Noticed deprecated API usage in adjacent code"
**Action**: Report to user, don't fix unless asked
**Why always available**: Useful discoveries happen anytime

## Core Orchestration Principles

### Orchestrator Role (FULL Tier)
**Cognitive load**: Holding multi-domain coordination map, phase transitions, agent status
**Mandatory delegation**: Cognitive necessity at this scale

**Orchestrator responsibilities**:
- Load appropriate phase file for current phase
- Deploy specialized agents per phase guidance
- Track cross-phase context via LCL
- Monitor for de-escalation opportunities
- Synthesize final results

**Orchestrator NEVER**:
- Implements code directly
- Holds all phase files simultaneously
- Skips phases (except Phase 0 if complexity clear)

### Multi-Domain Coordination

**Domain**: Self-contained system with clear boundaries (e.g., Auth, API Gateway, Database, Frontend)

**Integration Contract**: Explicit interface between domains marked with LCL

**Cross-domain work requires**:
1. Identify all affected domains (Phase 0)
2. Plan each domain separately with integration contracts (Phase 1)
3. Synthesize into unified approach (Phase 2)
4. Implement with progressive integration (Phase 3)
5. Verify integration points explicitly (Phase 4)

### Context Management via LCL

**LCL Intensity Levels**:
- **#LCL_EXPORT_CRITICAL** - Must preserve exactly (integration contracts, core decisions)
- **#LCL_EXPORT_FIRM** - Maintain with precision (API contracts, data schemas)
- **#LCL_EXPORT_CASUAL** - General guidance (style preferences, conventions)

**Lifecycle**:
1. Agents mark exports: `#LCL_EXPORT_CRITICAL: domain::integration_contract::value`
2. Orchestrator extracts and carries forward: `LCL: domain::integration_contract::value`
3. Next phase agents receive implicitly
4. No repeated discussion - stated once, maintained cleanly

**Example cross-domain LCL**:
```
# Phase 1 (Planning agent for Auth domain):
#LCL_EXPORT_CRITICAL: auth::token_format::jwt_with_refresh
#LCL_EXPORT_CRITICAL: auth::api_contract::POST_/auth/login_returns_{token,refresh,expires}

# Phase 1 (Planning agent for Frontend domain):
#LCL_EXPORT_CRITICAL: frontend::auth_storage::httpOnly_cookie_not_localStorage

# Orchestrator extracts for Phase 2:
LCL: auth::token_format::jwt_with_refresh
LCL: auth::api_contract::POST_/auth/login_returns_{token,refresh,expires}
LCL: frontend::auth_storage::httpOnly_cookie_not_localStorage

# Phase 2 synthesis agent validates contracts match
# Phase 3 implementation agents receive all LCL context
```

## Phase Loading Protocol

### Step-by-Step Execution

**1. Orchestrator loads core.md** (this file)
- Understands phase sequence
- Has failsafe tag set
- Ready to manage progressive loading

**2. For each phase**:
```
Load phase file (e.g., phase1-planning.md)
  ↓
Deploy agents per phase guidance
  ↓
Collect results with LCL exports
  ↓
Extract LCL for next phase
  ↓
Clear phase file from context
  ↓
Proceed to next phase
```

**3. Final synthesis**:
- Load phase5-report.md
- Generate comprehensive documentation
- Deliver clean code + architectural record

### Context Efficiency

Maximum context usage per phase:
- core.md: ~200 lines (always loaded)
- Largest phase file: ~300 lines (phase3-implementation.md)
- **Total**: ~500 lines maximum at any moment

Compare to:
- HEAVY: ~600 lines (all at once)
- Monolithic approach: ~1200+ lines (everything loaded)

**FULL tier paradox**: Handles more complexity with less context pressure via progressive loading.

## De-escalation Protocol

FULL tier can de-escalate if complexity was overestimated:

**Triggers**:
- Phase 0 survey reveals single-domain scope
- Integration simpler than expected
- Requirements more isolated than initial assessment

**Process**:
1. Agent reports: `#COMPLEXITY_OVERESTIMATED: [reason]`
2. Orchestrator re-scores complexity
3. If new score suggests lower tier: ask user if they want to de-escalate
4. If approved: transition to appropriate tier, preserve all work via LCL

**Example**:
```
Task: "Add authentication to entire application"
Initial assessment: Score 9 → FULL tier
Phase 0 discovers: Auth library already integrated, just need UI + simple API calls
Re-assessment: Score 4 → MEDIUM tier
Orchestrator: "Complexity lower than expected. De-escalate to MEDIUM tier?"
```

## Success Criteria (FULL)

✅ **All domains surveyed** (Phase 0 complete)
✅ **Integration contracts defined** (cross-domain interfaces clear)
✅ **Multi-path exploration across domains** (Phase 1 thorough)
✅ **Synthesis rationale documented** (Phase 2 complete)
✅ **Cross-domain integration validated** (Phase 4 verified)
✅ **Architectural decisions preserved** (Phase 5 documentation)
✅ **All assumptions verified**
✅ **Constraints respected**
✅ **Clean code delivered** (only PATH documentation remains)
✅ **Comprehensive handoff** (future maintainers have context)

## Phase File Reference

- **phase0-survey.md** - Codebase assessment, domain identification
- **phase1-planning.md** - Multi-domain planning, integration contracts
- **phase2-synthesis.md** - Cross-domain synthesis, unified blueprint
- **phase3-implementation.md** - Coordinated implementation, all tags
- **phase4-verification.md** - Multi-domain verification, tag resolution
- **phase5-report.md** - Architectural documentation, final delivery

## When FULL is Essential

- **Multi-domain architecture**: "Migrate from REST to GraphQL across frontend, API gateway, and services"
- **System-wide refactoring**: "Convert entire codebase from JavaScript to TypeScript"
- **Complex integrations**: "Add real-time sync between mobile, web, and backend with conflict resolution"
- **Security overhauls**: "Implement end-to-end encryption across all layers"
- **Performance rewrites**: "Refactor to event-driven architecture across all services"

These tasks require:
- Multiple domain planning
- Integration contract management
- Cross-system verification
- Maximum systematic rigor

FULL tier provides this while maintaining context efficiency through progressive phase loading.
