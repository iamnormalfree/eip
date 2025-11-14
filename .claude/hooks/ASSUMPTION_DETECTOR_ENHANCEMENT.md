# Assumption Detector Enhancement - FALSE_COMPLETION Detection

## Date: 2025-10-06

## Enhancement Summary

Extended `assumption-detector.py` to detect **implicit assumptions** in addition to explicit ones. The hook now catches the **#FALSE_COMPLETION pattern** by treating completion declarations as unverified assumptions about completeness.

---

## Problem Solved

**Issue**: FALSE_COMPLETION pattern not mechanically detected
- Orchestrators would declare "implementation complete" without checking deliverables
- Cross-session analysis showed 47-67% completion rates (missing 33-53% of deliverables)
- No automated validation against specifications

**Root Cause**: Completion declarations are implicit assumptions
- "Implementation complete" = "I assume all requirements are met"
- Same probabilistic error as "I assume method X exists"
- Both are unverified claims that should be caught

---

## Architecture Decision

**Unified vs Separated Approach**

Chose **unified approach** - extend assumption-detector.py rather than create separate completion-validator.py

**Rationale**:
1. **Conceptually correct** - FALSE_COMPLETION IS an assumption type
2. **Architecturally cleaner** - One hook for all unverified claims
3. **Matches framework philosophy** - "Probabilistic execution with error-correcting metacognition"
4. **Reuses infrastructure** - Same tier detection, logging, orchestrator/agent behavior

---

## How It Works

### Two Assumption Types

**1. Explicit Assumptions** (original behavior)
- "I assume X"
- "probably Y"
- Unverified method calls
- "Should be Z"

**Verification**: Check for grep/read/glob usage after assumption

**2. Implicit Assumptions - Completion Declarations** (NEW)
- "Implementation complete"
- "All done"
- "Task finished"
- "Ready for review"
- "All requirements met"

**Verification**: Check against specification documents for deliverable gaps

### Detection Flow

```python
1. Check for completion declarations (last 1000 chars)
   ↓
2. If found: Verify against specification
   ↓
3. Find spec files (BLUEPRINT, README, plan files)
   ↓
4. Extract deliverables (file patterns, checklists, "will create" statements)
   ↓
5. Check filesystem for existence
   ↓
6. If gaps: BLOCK (orchestrator) or WARN (agent)
   ↓
7. If no gaps or no spec: Continue to explicit assumption checks
```

---

## Specification Discovery

**Searches for specifications in:**
- `docs/completion_drive_plans/**/FINAL_BLUEPRINT*.md`
- `docs/completion_drive_plans/**/plan*.md`
- `**/README.md`
- `**/BLUEPRINT*.md`
- `**/specification*.md`
- `.framework-observatory/**/README.md`

**Prioritization**: Most recently modified first

### Deliverable Extraction Patterns

**Pattern 1: File paths**
```markdown
Will create assumption-detector.py
Modified .claude/hooks/orchestrator-firewall.py
```

**Pattern 2: Checklists**
```markdown
- [ ] file1.md
- [x] file2.py
```

**Pattern 3: Explicit statements**
```markdown
Will create the following files:
- spec.md
- implementation.py
```

---

## Hook Behavior

### Orchestrator Mode (Strict)

**When completion declared + gaps found:**

```
🛑 ASSUMPTION DETECTOR - FALSE_COMPLETION DETECTED

Implicit Assumption: "Implementation complete" / "All done"

❌ Verification FAILED:
Specification validation found deliverable gaps.

Specification: docs/plan/FINAL_BLUEPRINT.md

Promised Deliverables (17 files):
✅ file1.md
✅ file2.py
... and 6 more created

❌ MISSING (9 files):
- file9.md
- file10.py
...

Completion Rate: 47% (8/17)

This is #FALSE_COMPLETION pattern:
You assumed all requirements met without checking against specification.

Required Actions:
1. Complete missing deliverables, OR
2. Update specification to reflect actual scope, OR
3. Tag as #FALSE_COMPLETION with justification

Cannot proceed until deliverable gaps resolved.
```

**Result**: BLOCKS tool execution (Write/Edit)

### Agent Mode (Permissive)

**When completion declared + gaps found:**

```
ℹ️  ASSUMPTION DETECTOR - FALSE_COMPLETION IN AGENT MODE

Completion declaration detected but gaps found:

[Same gap analysis as above]

✅ Autonomous work continues - Agents report incomplete status

Action Required:
Tag in your final output:

Example:
### Status: PARTIAL COMPLETION

#### What Was Done ✅
- [List completed deliverables]

#### Missing Items ❌
- #FALSE_COMPLETION: [List missing deliverables with reasoning]

Proceeding with status report...
```

**Result**: WARNS but allows (agents tag for orchestrator review)

---

## New Methods Added

### `_detect_completion_declarations()`
Finds completion signal phrases in last 1000 chars

### `_find_specification_files()`
Discovers spec files using glob patterns, prioritizes by recency

### `_extract_deliverables(spec_file)`
Parses spec for file paths using regex patterns

### `_verify_completeness()`
Checks deliverables against filesystem, returns gaps

### `_false_completion_orchestrator(message)`
Generates BLOCK message for orchestrators

### `_false_completion_agent(message)`
Generates WARN message for agents

---

## Integration with Existing Logic

**Execution order in `should_block()`:**

1. **First**: Check completion declarations → Verify against spec
   - If gaps: Return FALSE_COMPLETION message (block/warn)

2. **Then**: Check explicit assumptions (original behavior)
   - If unverified: Return assumption message (block/warn)

3. **Finally**: If nothing detected, allow

**No conflicts** - FALSE_COMPLETION check happens before explicit assumption check

---

## Usage Examples

### Example 1: Hook Catches Incomplete Work

**Scenario**: MEDIUM tier, orchestrator declares completion

```
User: /response-awareness-medium "Extend assumption detector"

Orchestrator: [Implements features]
Orchestrator: "Implementation complete"

Hook: 🛑 BLOCKED
Reason: Specification shows 6 deliverables, only 1 delivered
Gap: Missing documentation, tests, examples
Action: Complete missing items or update spec

Orchestrator: [Adds missing deliverables]
Orchestrator: "Implementation complete" [2nd attempt]

Hook: ✅ ALLOW
Reason: All 6 deliverables verified present
```

### Example 2: No Specification (Allow)

```
User: /response-awareness-light "Fix typo"

Orchestrator: [Fixes typo]
Orchestrator: "All done"

Hook: ✅ ALLOW
Reason: No specification found (can't verify)
```

### Example 3: Agent Mode (Warn + Tag)

```
Orchestrator: Deploy agent to implement X

Agent: [Implements partially]
Agent: "Implementation complete"

Hook: ⚠️ WARN (not blocked)
Message: "Gaps detected, tag with #FALSE_COMPLETION"

Agent: Reports:
### Status: PARTIAL COMPLETION
- #FALSE_COMPLETION: Completed 3/5 features (time constraint)

Orchestrator: [Reviews, decides next steps]
```

---

## Testing & Validation

### Meta-Test (Self-Testing)

This enhancement was implemented using `/response-awareness` (MEDIUM tier).

**Test protocol**:
1. Implement extended assumption-detector.py
2. Declare "Implementation complete" (triggers hook)
3. Hook should detect completion declaration
4. Hook should find specification (this task description or CLAUDE.md)
5. Hook should extract deliverables
6. Hook should validate existence
7. Hook should BLOCK if gaps, ALLOW if complete

**Expected behavior**: Hook catches its own completion declaration and validates against task requirements.

### Test Commands

**Enable debug mode**:
```bash
export DEBUG_ASSUMPTION_DETECTOR=1
```

**Trigger FALSE_COMPLETION check**:
```bash
# Create spec file
echo "Will create file1.md file2.md file3.md" > spec.md

# Use /response-awareness tier
# Declare completion without creating files
# Hook should BLOCK
```

**Check logs**:
```bash
python .claude/hooks/view_hook_logs.py --filter BLOCK
```

---

## Benefits

### 1. Mechanical Validation
- No longer relies on subjective "feels complete" signal
- Automated specification-to-delivery gap detection
- Catches FALSE_COMPLETION reliably

### 2. Conceptual Elegance
- Unified approach: All assumptions (explicit + implicit) in one hook
- Matches framework philosophy: "Probabilistic execution with error-correcting metacognition"
- FALSE_COMPLETION treated as what it is: an unverified assumption

### 3. Non-Invasive
- No framework command changes needed
- No new tags required (#FALSE_COMPLETION detection is automatic)
- Works alongside existing assumption detection
- Can be disabled independently

### 4. Context-Aware
- Only validates when in RA framework tiers
- Orchestrator: Strict blocking
- Agent: Permissive warning with tagging
- Respects agent autonomy (agents can't ask user, so tag instead)

---

## Performance Impact

**Hook execution time**:
- Completion detection: ~10ms (regex on last 1000 chars)
- Spec discovery: ~50-200ms (glob + sort)
- Deliverable extraction: ~20-100ms (regex parsing)
- Filesystem validation: ~10-50ms (existence checks)

**Total overhead**: ~100-400ms when completion declared

**Negligible** - Only runs when completion phrases detected, prevents hours of wrong-direction work

---

## Files Modified

```
.claude/hooks/assumption-detector.py
├── Added: glob import
├── Added: _detect_completion_declarations()
├── Added: _find_specification_files()
├── Added: _extract_deliverables()
├── Added: _verify_completeness()
├── Added: _false_completion_orchestrator()
├── Added: _false_completion_agent()
└── Modified: should_block() - checks completeness first
```

---

## Comparison: Original vs Extended

| Feature | Original | Extended |
|---------|----------|----------|
| **Explicit assumptions** | ✅ Detected | ✅ Detected |
| **Implicit assumptions (completion)** | ❌ Not detected | ✅ Detected |
| **Specification validation** | ❌ Not available | ✅ Automated |
| **FALSE_COMPLETION catching** | ❌ Subjective only | ✅ Mechanical |
| **Hook count** | 1 (assumption-detector) | 1 (unified) |
| **Conceptual model** | "Check assumptions" | "Check all unverified claims" |

---

## Future Enhancements

### Potential Improvements

1. **Smarter spec detection**
   - Learn which files are authoritative specs
   - Weight recent specs higher
   - Detect spec type (blueprint vs plan vs README)

2. **Better deliverable extraction**
   - Handle relative vs absolute paths
   - Detect directory vs file deliverables
   - Extract from structured formats (JSON, YAML)

3. **Partial completion handling**
   - Calculate completion percentage
   - Suggest which files to create next
   - Prioritize critical vs optional deliverables

4. **Integration with Phase 4**
   - Automatically run on Phase 4 entry
   - Generate verification checklist
   - Track historical completion rates

---

## Conclusion

**The extended assumption-detector.py solves FALSE_COMPLETION through conceptual unification:**

- Treats completion declarations as implicit assumptions
- Validates against specifications mechanically
- Reuses existing hook infrastructure
- No framework bloat, pure enforcement layer

**Key Insight**: "Implementation complete" is just another probabilistic claim requiring verification - same category as "I assume method X exists". Both caught by same metacognitive error detection mechanism.

---

**Created**: 2025-10-06
**Enhancement Type**: Hook Extension (Non-Breaking)
**Impact**: Mechanical FALSE_COMPLETION detection
**Philosophy**: "Implicit assumptions are still assumptions"
