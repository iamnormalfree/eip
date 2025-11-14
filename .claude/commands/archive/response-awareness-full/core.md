# /response-awareness-full - Core Orchestration

## Purpose
Maximum rigor orchestration for multi-domain architecture changes and system-wide features. Progressive phase loading ensures context efficiency even at maximum complexity.

**When to use**: Multi-domain systems, architecture overhauls, cross-system integration
**Complexity score**: 8+ (out of 12)

<!-- CONDITIONAL LOGGING (Added 2025-10-06)
     Only execute if LOGGING_LEVEL != none
     This does NOT affect default framework operation
     
     FULL tier has progressive phase loading, so logging adapts to track phase transitions.
-->

## Logging Instructions (IF ENABLED)

**Check LOGGING_LEVEL from parent orchestrator:**
- If LOGGING_LEVEL=none: Skip all logging (default behavior)
- If LOGGING_LEVEL=light: Execute light logging instructions
- If LOGGING_LEVEL=verbose: Execute verbose logging instructions

**Note for FULL tier**: With progressive phase loading, each phase file should check LOGGING_LEVEL and execute appropriate logging when loaded.

### Light Logging Instructions

**Phase transitions:**
When loading/entering new phase, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/phase_transitions.log`:
```
[HH:MM:SS] LOAD Phase [N]: [phase name]
[HH:MM:SS] ENTER Phase [N]: [phase name]
[HH:MM:SS] COMPLETE Phase [N]: [phase name]
```

**PATH_DECISION logging:**
When creating PATH_DECISION tag, append to `phase_transitions.log`:
```
[HH:MM:SS] PATH_DECISION: [brief summary]
```

**LCL export summary:**
When Phase completes, if LCL exports created, append to `phase_transitions.log`:
```
[HH:MM:SS] Phase [N] LCL Exports: [count] (Critical: X, Firm: X, Casual: X)
```

**Phase file lifecycle:**
When clearing phase file from context, append to `phase_transitions.log`:
```
[HH:MM:SS] UNLOAD Phase [N]: [phase name] (context cleared)
```

### Verbose Logging Instructions

**Everything in light logging PLUS:**

**Tag insertion:**
When creating any tag in code, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/tag_operations.log`:
```
[HH:MM:SS] INSERT #TAG_NAME at file.py:line - "Brief context/reason" (Phase [N])
```

**Tag resolution:**
When resolving/removing tag, append to `tag_operations.log`:
```
[HH:MM:SS] RESOLVE #TAG_NAME at file.py:line - Action: [what was done] (Phase [N])
```

**LCL operations:**
When exporting LCL, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/lcl_exports.log`:
```
[HH:MM:SS] EXPORT LCL_[LEVEL]: domain::contract::value (Phase [N])
[HH:MM:SS] PASS domain::contract::value -> [next phase/agent]
```

**Integration contract logging:**
When defining cross-domain integration contracts, append to `lcl_exports.log`:
```
[HH:MM:SS] INTEGRATION_CONTRACT: [domain1] <-> [domain2]: [contract details]
```

### Final Metrics (Both Levels)

At end of session, write `docs/completion_drive_logs/DD-MM-YYYY_task-name/final_metrics.md`:

```markdown
# Response-Awareness Session Metrics
## Task: [task description]
## Date: [DD-MM-YYYY]
## Tier: FULL
## Logging Level: [light/verbose]

### Phase Summary
- Phase 0 (Survey): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 1 (Planning): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 2 (Synthesis): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 3 (Implementation): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 4 (Verification): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Phase 5 (Report): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)

### Multi-Domain Coordination
- Domains affected: [list]
- Integration contracts defined: X
- Cross-domain LCL exports: X

### Tag Operations
- Total tags created: X
- Tags resolved: X
- Tags remaining: X (should be 0 except PATH tags)
- Most common tag: #TAG_NAME (X occurrences)

### LCL Exports
- Critical exports: X
- Firm exports: X
- Casual exports: X
- Total context passed: X items

### Assumptions & Decisions
- COMPLETION_DRIVE assumptions: X (Verified: X, Incorrect: X)
- Assumption accuracy: X%
- PATH_DECISION points: X
- PATH_RATIONALE documented: X

### Context Efficiency
- Maximum context per phase: [X] lines
- Phase files loaded: [list]
- Progressive loading effective: [yes/no]

### Final Status
All domains integrated
All critical tags resolved
Architectural decisions documented
Clean code delivered
Framework effectiveness: [brief assessment]
```

**IMPORTANT**: All logging is OPTIONAL. If LOGGING_LEVEL=none, skip ALL of the above.

## Architecture: Phase-Chunked Loading

FULL tier uses **progressive context management**:
- **core.md** (this file) - Always loaded, contains orchestration principles
- **Phase files** - Loaded just-in-time, cleared after execution
- **Never holds all tags simultaneously** - Maximum ~400 lines in context per phase

### Phase Sequence

**Phase 0: Survey** → Load `phase0-survey.md`
- Codebase assessment across all affected domains
- Stakeholder identification (systems, modules, APIs)
- Initial complexity validation

**Phase 1: Planning** → Load `phase1-planning.md`
- Multi-domain planning agents (1-5 agents)
- Interface analysis and integration contracts
- Multi-path exploration with dependencies

**Phase 2: Synthesis** → Load `phase2-synthesis.md`
- Cross-domain path selection
- Integration strategy synthesis
- Unified blueprint creation

**Phase 3: Implementation** → Load `phase3-implementation.md`
- Coordinated implementation across domains
- Progressive integration with validation
- Comprehensive pattern detection

**Phase 4: Verification** → Load `phase4-verification.md`
- Multi-domain verification protocols
- Integration testing strategies
- Complete tag resolution

**Phase 5: Report** → Load `phase5-report.md`
- Architectural decision documentation
- Integration summary
- Handoff documentation

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
