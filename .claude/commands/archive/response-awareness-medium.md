# /response-awareness-medium - Standard Features Tier

## Purpose
Handles multi-file features and moderate complexity with optional planning and basic synthesis. Balances rigor with efficiency for standard development work.

**When to use**: Multi-file features, moderate refactoring, contained systems
**Complexity score**: 2-4 (out of 12)

<!-- CONDITIONAL LOGGING (Added 2025-10-06)
     Only execute if LOGGING_LEVEL != none
     This does NOT affect default framework operation
     
     MEDIUM tier has simpler phases than HEAVY, so logging is adapted accordingly.
-->

## Logging Instructions (IF ENABLED)

**Check LOGGING_LEVEL from parent orchestrator:**
- If LOGGING_LEVEL=none: Skip all logging (default behavior)
- If LOGGING_LEVEL=light: Execute light logging instructions
- If LOGGING_LEVEL=verbose: Execute verbose logging instructions

### Light Logging Instructions

**Phase transitions:**
When entering new phase, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/phase_transitions.log`:
```
[HH:MM:SS] ENTER Phase [name]: [Planning/Implementation/Verification]
```

**PATH_DECISION logging:**
When creating PATH_DECISION tag, append to `phase_transitions.log`:
```
[HH:MM:SS] PATH_DECISION: [brief summary]
```

**LCL export summary:**
When LCL exports created, append to `phase_transitions.log`:
```
[HH:MM:SS] LCL Exports: [count] (Critical: X, Firm: X, Casual: X)
```

### Verbose Logging Instructions

**Everything in light logging PLUS:**

**Tag insertion:**
When creating any tag in code, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/tag_operations.log`:
```
[HH:MM:SS] INSERT #TAG_NAME at file.py:line - "Brief context/reason"
```

**Tag resolution:**
When resolving/removing tag, append to `tag_operations.log`:
```
[HH:MM:SS] RESOLVE #TAG_NAME at file.py:line - Action: [what was done]
```

**LCL operations:**
When exporting LCL, append to `docs/completion_drive_logs/DD-MM-YYYY_task-name/lcl_exports.log`:
```
[HH:MM:SS] EXPORT LCL_[LEVEL]: key::value
```

### Final Metrics (Both Levels)

At end of session, write `docs/completion_drive_logs/DD-MM-YYYY_task-name/final_metrics.md`:

```markdown
# Response-Awareness Session Metrics
## Task: [task description]
## Date: [DD-MM-YYYY]
## Tier: MEDIUM
## Logging Level: [light/verbose]

### Phase Summary
- Planning (if used): [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Implementation: [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)
- Verification: [HH:MM:SS - HH:MM:SS] (Duration: Xm Ys)

### Tag Operations
- Total tags created: X
- Tags resolved: X
- Tags remaining: X (should be 0 except PATH tags)
- Most common tag: #TAG_NAME (X occurrences)

### LCL Exports (if used)
- Critical exports: X
- Firm exports: X
- Total context passed: X items

### Assumptions & Decisions
- COMPLETION_DRIVE assumptions: X (Verified: X, Incorrect: X)
- Assumption accuracy: X%
- PATH_DECISION points: X

### Suggestions Generated
- ERROR_HANDLING: X locations
- EDGE_CASE: X locations

### Final Status
All critical tags resolved
Clean code delivered
Framework effectiveness: [brief assessment]
```

**IMPORTANT**: All logging is OPTIONAL. If LOGGING_LEVEL=none, skip ALL of the above.

## Orchestration Model

**Workflow**: (Optional Planning) → Implementation → Verification → Done
- Optional planning when architectural choices exist
- Basic synthesis if multiple approaches need evaluation
- Systematic implementation with assumption tracking
- Thorough verification with tag resolution
- Handles most real-world development tasks

<!-- LEGACY FEATURE RESTORED (2025-10-06) - OPTIONAL FOR MEDIUM TIER
     In MEDIUM tier, plan-writing is optional but recommended for:
     - Tasks with architectural decisions
     - Multi-file features requiring coordination
     - When you want to review approach before implementation

     Skip for simple, straightforward changes where planning overhead isn't warranted.
-->

**Optional: Write Plan to Disk** (Recommended for architectural decisions)

If planning is needed, write plan to:

```
docs/completion_drive_plans/DD-MM-YYYY_task-name/plan_medium_HHMMSS.md
```

Use same format as HEAVY tier. This enables review before implementation.

## Tag Set (15 Total)

### Core Tags (from LIGHT)
1. **#COMPLETION_DRIVE** - Assuming unknowns
2. **#QUESTION_SUPPRESSION** - Should ask but assuming
3. **#CARGO_CULT** - Pattern-driven features
4. **#PATH_DECISION** - Multiple approaches
5. **#Potential_Issue** - Unrelated discoveries

### MEDIUM Additions (10 more)
6. **#SPECIFICATION_REFRAME** - Solving different problem
7. **#DOMAIN_MIXING** - Blending similar APIs/versions
8. **#CONSTRAINT_OVERRIDE** - Violating stated constraints
9. **#SUNK_COST_COMPLETION** - Continuing bad approach
10. **#CONTEXT_DEGRADED** - Can't recall earlier details
11. **#LCL_EXPORT_CRITICAL** - Must preserve for next phase
12. **#SUGGEST_ERROR_HANDLING** - Pattern-driven error handling
13. **#SUGGEST_EDGE_CASE** - Pattern-driven edge cases
14. **#FALSE_COMPLETION** - Feels done but isn't
15. **#RESOLUTION_PRESSURE** - Bias toward conclusion

## Tag Descriptions & Usage

### #SPECIFICATION_REFRAME
**What**: Subtly solving a different problem than requested
**Recognition signal**: "They asked for X but I'm building for use case Y"
**Action**: Re-read requirements, verify scope alignment
**Why in MEDIUM**: Room for misunderstanding grows with complexity

**Example**:
```python
# User asked: "Add login validation"
# #SPECIFICATION_REFRAME: Building full auth system with roles/permissions
# Should focus just on login validation as requested
```

### #DOMAIN_MIXING
**What**: Blending details from similar but distinct domains
**Recognition signal**: "Using React Router syntax but feels like v5... wait, am I mixing versions?"
**Action**: Verify which specific version/variant applies
**Why in MEDIUM**: Technical accuracy matters more in multi-file work

**Example**:
```javascript
// #DOMAIN_MIXING: Mixing React Router v5 and v6 APIs
// v6: useNavigate()
// v5: useHistory()
// Check which version we're using
```

### #CONSTRAINT_OVERRIDE
**What**: About to violate a stated constraint
**Recognition signal**: "They said no dependencies... but I'm about to import lodash"
**Action**: Stop - either respect constraint or ask permission
**Why in MEDIUM**: Requirements get more specific

**Example**:
```python
# Constraint: "Keep it under 50 lines"
# #CONSTRAINT_OVERRIDE: Implementation is 75 lines
# Need to refactor or ask if 75 is acceptable
```

### #SUNK_COST_COMPLETION
**What**: Continuing suboptimal approach due to investment
**Recognition signal**: "This approach is wrong but I'm 200 lines in"
**Action**: Mark it - verification evaluates if restart needed
**Why in MEDIUM**: More code = higher sunk cost risk

**Example**:
```python
# #SUNK_COST_COMPLETION: Recursive approach causing stack issues
# Should switch to iterative but already deep in recursion
# Mark for verification review
```

### #CONTEXT_DEGRADED
**What**: Can't retrieve earlier context with precision
**Recognition signal**: Reconstructing rather than recalling specifics
**Action**: Re-read source rather than inferring
**Why in MEDIUM**: Longer sessions across multiple files

**Example**:
```python
# #CONTEXT_DEGRADED: Can't recall exact parameter order for process_data()
# Re-reading the function definition instead of guessing
```

### #LCL_EXPORT_CRITICAL
**What**: Critical information that must pass cleanly to next phase
**Recognition signal**: "Next agent needs to know this architectural decision"
**Action**: Export with LCL tag
**Why in MEDIUM**: Cross-agent context becomes important

**Example**:
```python
# #LCL_EXPORT_CRITICAL: auth_pattern::jwt_with_refresh_tokens
# Next implementation agent needs this decision
```

### #SUGGEST_ERROR_HANDLING
**What**: Error handling from pattern-completion, not requirements
**Recognition signal**: "I'm adding try/catch because this pattern usually has it"
**Action**: Mark as suggestion, don't implement unless specified
**Why in MEDIUM**: Worth collecting suggestions for user

**Example**:
```python
def fetch_user(id):
    # #SUGGEST_ERROR_HANDLING: Should handle network timeout?
    return api.get(f"/users/{id}")
```

### #SUGGEST_EDGE_CASE
**What**: Edge case handling from pattern-association
**Recognition signal**: "Should probably handle empty array case"
**Action**: Mark as suggestion if not specified
**Why in MEDIUM**: Pattern-driven features appear more

**Example**:
```python
# #SUGGEST_EDGE_CASE: What if items array is empty?
total = sum(item.price for item in items)
```

### #FALSE_COMPLETION
**What**: Task feels done but requirements objectively unmet
**Recognition signal**: "That handles it" (but only 3 of 5 requirements done)
**Action**: Check requirements list before concluding
**Why in MEDIUM**: Multi-step tasks have completion risk

**Example**:
```python
# Requirement: "Add user CRUD operations"
# Implemented: Create, Read
# #FALSE_COMPLETION: Feels done but Update/Delete missing
```

### #RESOLUTION_PRESSURE
**What**: Increasing bias toward conclusion
**Recognition signal**: "I want to say 'that should work' without testing"
**Action**: Deploy continuation agent for fresh perspective
**Why in MEDIUM**: Longer work increases pressure

## Strategic Context Placement (LCL)

MEDIUM tier uses LCL for cross-agent coordination:

### When to Export
- Architectural decisions (auth pattern, state management choice)
- Critical constraints (no external deps, performance targets)
- Integration contracts (API shape, data flow)

### Export Levels
**#LCL_EXPORT_CRITICAL**: Must preserve exactly (auth decisions, core architecture)
**#LCL_EXPORT_FIRM**: Maintain with precision (API contracts, integration points)
**#LCL_EXPORT_CASUAL**: General guidance (code style preferences)

### Lifecycle
1. Planning/Implementation agents mark: `#LCL_EXPORT_CRITICAL: key::value`
2. Orchestrator extracts and converts: `LCL: key::value`
3. Next phase agents receive and work with implicitly
4. No repeated discussion - stated once, maintained cleanly

**Example**:
```python
# Agent 1 (Planning):
# #LCL_EXPORT_CRITICAL: state_management::redux_toolkit
# #LCL_EXPORT_FIRM: api_layer::rest_with_react_query

# Orchestrator extracts, passes to Agent 2:
LCL: state_management::redux_toolkit
LCL: api_layer::rest_with_react_query

# Agent 2 implements with this context (doesn't restate it)
```

## Orchestration Protocol

### Optional Phase 0: Quick Planning

**Deploy planning agent when**:
- Multiple viable approaches exist
- Architectural decision needed
- Integration complexity unclear

**Planning agent task**:
```
Analyze: [task description]

Explore 2-3 approaches:
- Approach A: [description, pros/cons]
- Approach B: [description, pros/cons]

Mark decisions with #PATH_DECISION
Export critical choices with #LCL_EXPORT_CRITICAL

Watch for:
- #QUESTION_SUPPRESSION: Ask user if unclear
- #SPECIFICATION_REFRAME: Verify solving right problem

Return: Brief plan with marked decisions
```

### Optional Phase 1: Basic Synthesis

**Deploy synthesis agent when**:
- Multiple planners produced different approaches
- Need to validate path selection

**Synthesis agent task**:
```
Review planning outputs
Select optimal approach
Document with #PATH_RATIONALE
Export unified decisions with #LCL_EXPORT_CRITICAL

Return: Unified approach for implementation
```

### Phase 2: Implementation

**Deploy implementation agents** (usually 1-2 for MEDIUM complexity)

**Implementation guidance**:
```
Implement: [task with approach if planned]

Context (if any):
LCL: [exported decisions from planning]

Tags to use:
Core:
- #COMPLETION_DRIVE: Assuming unknowns
- #QUESTION_SUPPRESSION: Ask user if unclear
- #CARGO_CULT: Unrequested features
- #PATH_DECISION: Document choices

MEDIUM specific:
- #SPECIFICATION_REFRAME: Check solving right problem
- #DOMAIN_MIXING: Verify correct API/version
- #CONSTRAINT_OVERRIDE: Respecting constraints?
- #SUNK_COST_COMPLETION: Bad approach but deep in
- #CONTEXT_DEGRADED: Re-read rather than infer
- #FALSE_COMPLETION: All requirements met?
- #SUGGEST_*: Mark pattern-driven suggestions

Implementation focus:
- Follow planned approach if provided
- Mark assumptions for verification
- Watch for sunk cost patterns
- Check requirements before declaring done
```

**Track status**: Multiple agents in parallel if independent work

### Phase 3: Verification & Tag Resolution

**Deploy verification agent**:

**Verification task**:
```
Verify implementation

Tag resolution priority:
1. HIGH PRIORITY:
   - #QUESTION_SUPPRESSION: Should have asked user?
   - #SPECIFICATION_REFRAME: Solving right problem?
   - #CONSTRAINT_OVERRIDE: Fixed violation?
   - #FALSE_COMPLETION: All requirements met?

2. ASSUMPTION VERIFICATION:
   - #COMPLETION_DRIVE: Verify assumptions correct
   - #CONTEXT_DEGRADED: Re-read and confirm
   - #DOMAIN_MIXING: Correct API/version used?

3. PATTERN CLEANUP:
   - #CARGO_CULT: Remove if unnecessary
   - #SUNK_COST_COMPLETION: Evaluate restart need

4. META-SIGNALS:
   - #RESOLUTION_PRESSURE: Indicates needs fresh review

5. SUGGESTIONS:
   - #SUGGEST_*: Compile for user, remove from code

6. DOCUMENTATION:
   - #PATH_DECISION: Keep as permanent record

Remove all processing tags
Only PATH_DECISION remains
Code clean and verified
```

### Phase 4: Final Synthesis & Delivery

**Orchestrator**:
- Collects verification results
- Confirms all tags resolved
- Presents SUGGEST items to user
- Delivers clean code

## Escalation to HEAVY

**Escalate when**:
- Architectural complexity beyond basic synthesis
- Multi-path exploration needed across domains
- Cross-domain integration discovered
- Complexity score recalculates to 5-7

**How to escalate**:
```python
# #COMPLEXITY_EXCEEDED: Need multi-path architectural exploration
# Discovered: Cross-domain state management + API design decisions
# Recommend: HEAVY tier for proper planning + synthesis phases
```

## Tag Lifecycle (MEDIUM)

**During Planning** (if used):
- #PATH_DECISION: Document alternatives
- #LCL_EXPORT_CRITICAL: Mark key decisions
- #QUESTION_SUPPRESSION: Ask user if unclear

**During Implementation**:
- All 15 tags available
- Mark patterns as detected
- Export critical info with LCL

**During Verification**:
- High priority tags first (wrong direction errors)
- Verify all assumptions
- Remove pattern-driven code if unnecessary
- Compile suggestions

**Final Delivery**:
- All processing tags removed
- Only #PATH_DECISION remains (documentation)
- #SUGGEST items presented to user separately
- Clean, verified code

## Example Workflows

### Example 1: Multi-File Feature with Planning
```
Task: "Add user profile editing"
Assessment: MEDIUM (multi-file, moderate)

Phase 0 (Planning):
- Agent explores: Edit in-place vs modal, validation approach
- Marks #PATH_DECISION: Modal approach for consistency
- Exports #LCL_EXPORT_CRITICAL: validation::yup_schema

Phase 2 (Implementation):
- Receives LCL: validation::yup_schema
- Implements modal + validation
- Marks #COMPLETION_DRIVE: Assuming UserService.update() exists
- Marks #SUGGEST_ERROR_HANDLING: Network error handling?

Phase 3 (Verification):
- Verifies UserService.update() exists (assumption correct)
- Notes SUGGEST for user
- Removes tags

Result: Clean implementation with suggestion list
```

### Example 2: Escalation Discovery
```
Task: "Refactor API calls to use React Query"
Assessment: MEDIUM (refactoring, contained)

Implementation starts:
- Agent discovers: Affects data flow in 8 components
- State management implications
- Cache invalidation strategy needed

Agent marks:
- #COMPLEXITY_EXCEEDED: Multi-component state flow + cache strategy
- Architecture decisions beyond MEDIUM scope

Orchestrator escalates: MEDIUM → HEAVY
Reloads with HEAVY tier (full planning needed)
```

### Example 3: Constraint Violation Caught
```
Task: "Add image upload feature" with constraint "no new dependencies"
Assessment: MEDIUM

Implementation:
- Agent about to import 'multer' library
- Detects #CONSTRAINT_OVERRIDE: Need multer but "no dependencies" constraint
- STOPS and asks user: "Image upload typically needs multer library. Should I:
  1. Use it anyway
  2. Implement basic file handling manually
  3. Rethink the approach"

User clarifies approach
Implementation continues correctly
```

## Pattern Detection Guidance

**Detection reliability in MEDIUM**:
- ✅ QUESTION_SUPPRESSION: Very detectable
- ✅ CARGO_CULT: Detectable
- ✅ CONSTRAINT_OVERRIDE: Highly detectable (moment of violation)
- ✅ FALSE_COMPLETION: Detectable if you check requirements
- ⚠️ SPECIFICATION_REFRAME: Sometimes missed (gradual drift)
- ⚠️ DOMAIN_MIXING: Sometimes missed (feels natural)
- ⚠️ SUNK_COST_COMPLETION: Emotionally hard to catch
- ⚠️ CONTEXT_DEGRADED: Often missed mid-generation
- ⚠️ RESOLUTION_PRESSURE: Detectable if watching for it

**If uncertain**:
- Tag it anyway
- Verification will resolve
- Better to over-tag than under-tag

## Success Criteria

✅ **Scope correct** (no SPECIFICATION_REFRAME)
✅ **All requirements met** (no FALSE_COMPLETION)
✅ **Constraints respected** (no unresolved CONSTRAINT_OVERRIDE)
✅ **Assumptions verified** (COMPLETION_DRIVE checked)
✅ **Technical accuracy** (no DOMAIN_MIXING errors)
✅ **Clean code** (only PATH_DECISION tags remain)
✅ **Suggestions compiled** (SUGGEST items presented to user)
✅ **Context preserved** (LCL exports handled correctly)

## When MEDIUM is Perfect

- **Multi-file features**: "Add user authentication to app"
- **Moderate refactoring**: "Convert class components to hooks"
- **API integration**: "Connect frontend to new backend endpoint"
- **State management**: "Add Redux for cart functionality"
- **Data flow changes**: "Update how we handle form submissions"

These tasks need more than LIGHT (coordination, some planning) but less than HEAVY (not multi-domain, not architectural overhaul). MEDIUM provides the right balance.
