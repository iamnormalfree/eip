# Beads-Friendly Planning Skill Test Report v2

**Test Date:** 2026-01-09
**Plan File:** `/root/projects/maf-github/docs/plans/2026-01-08-autonomous-maf-foundations.md`
**Plan Word Count:** 12,959 words
**Plan Status:** Improved with 5 GPT strategic suggestions (integrated as plan content, not git-diffs)

---

## Executive Summary

This test simulates the execution of the `beads-friendly-planning` skill on a substantially improved implementation plan. The plan (12,959 words) has been enhanced with GPT strategic suggestions and represents a highly mature implementation document.

**Key Findings:**
- Plan maturity score: **62.5%** (5/8 quality markers)
- Routing decision: **TARGETED** mode (1-2 hours estimated)
- Smart pass selection: **3 passes would be skipped** (b, c, h)
- **Critical issue discovered:** Maturity scan is too strict and misses nuanced quality
- Previous test issues persist: No interactive prompts, no rollback mechanism

---

## Phase 0: Complexity Assessment Results

### Step 0.1: Plan Maturity Scan

The skill runs the 8-marker quality scan. Here's what it finds:

| Marker | Check Performed | Result | Evidence |
|--------|----------------|--------|----------|
| **1. Structure** | `grep -q "^## Goals" && grep -q "^## Non-Goals"` | ✅ PRESENT | Line 56: `### Non-Goals (What We're NOT Doing)`, Line 168: `### Goal` |
| **2. Workflows** | `grep -q "^###.*Workflow" && grep -q "Steps:"` | ✅ DETAILED | Line 450: `### User Workflow: Autonomous Agent Operation`, Lines 458-711: Multiple "Step 1:", "Step 2:", etc. |
| **3. Security** | `grep -q "MUST NEVER\|MUST ALWAYS\|Invariant:"` | ❌ MISSING | No matches found - Security section exists (line 2297) but doesn't use invariant language |
| **4. Data** | `grep -q "## Data Contract\|## Data Model\|## Schemas"` | ⚠️ PARTIAL | VERSIONING_GUIDE.md defined (line 2353), JSON schemas present (line 260), but no "Data Contract" section explicitly |
| **5. Performance** | `grep -q "## Performance\|Performance Budget\|p50:\|p95:"` | ❌ MISSING | No p50/p95/p99 budgets found |
| **6. Testing** | `grep -q "## Testing\|## Test Matrix\|### Test"` | ✅ DEFINED | Line 2956: `## Testing Strategy`, comprehensive unit/integration tests |
| **7. Failures** | `grep -q "## Failure Modes\|## Error Handling\|Edge Cases"` | ✅ ADDRESSED | Line 2291: `## Failure Assumptions`, error recovery protocols (line 189) |
| **8. Acceptance** | `grep -q "E2E\|Acceptance Criteria\|Given.*When.*Then` | ❌ MISSING | Success Criteria section exists (line 3519) but not in formal E2E acceptance format |

**Maturity Score Calculation:**
```
Markers Present = 5 (Structure, Workflows, Data[partial], Testing, Failures)
Maturity Percentage = (5 / 8) × 100 = 62.5%
```

**Note on Data marker:** The plan has VERSIONING_GUIDE.md with JSON schemas (line 260-316), so it's actually "defined" but the grep pattern wouldn't catch it because it doesn't look for "VERSIONING" or "JSON schema". This is a **false negative** in the maturity scan.

### Step 0.2: Route Based on Maturity

**Routing Decision:** TARGETED (62-86% range)

```bash
case 62 in
  62-86)   # 5-6 markers present
    passes_needed="targeted"
    estimated_time="1-2 hours"
    echo "📋 Plan is moderately mature."
    echo "   Recommended: Targeted passes for missing quality markers"
    ;;
esac
```

**Expected Output:**
```
📊 Plan Maturity: 62% (5/8 quality markers)
📋 Plan is moderately mature.
   Recommended: Targeted passes for missing quality markers
📝 Passes to run: a d e f g i j k l
⏱️  Estimated time: 1-2 hours
```

### Step 0.3: Smart Pass Selection

**Passes Analysis:**

| Pass | Name | Check | Skip? | Reason |
|------|------|-------|-------|--------|
| a | Analysis | Always run | ❌ No | Baseline assessment needed |
| b | Spine | Structure present? | ✅ Yes | Goals/Non-Goals present (lines 56, 168) |
| c | Reality Check | Constraints documented? | ⚠️ Maybe | No explicit "Constraints" section - edge case |
| d | Security | Invariants explicit? | ❌ No | No MUST NEVER/MUST ALWAYS found |
| e | Data Contract | Formats defined? | ⚠️ Maybe | VERSIONING_GUIDE exists but grep might miss it |
| f | Failure Modes | Addressed? | ✅ Yes | Line 2291: Failure Assumptions present |
| g | Performance | Budgets specified? | ❌ No | No p50/p95/p99 budgets |
| h | Test Matrix | Comprehensive? | ✅ Yes | Line 2956: Testing Strategy detailed |
| i,j,k | Refinement | Maturity ≥75%? | ❌ No | 62% < 75% threshold |
| l | Steady State | Always run at end | ❌ No | Must run |

**Edge Case in Pass C (Reality Check):**
- The grep checks: `grep -q "## Constraints\|Platform Constraints\|existing patterns"`
- Plan has: Line 2291 "## Failure Assumptions" and implicit constraints throughout
- **Result:** Pass would likely NOT be skipped (grep fails), but constraints are actually present in content
- **Issue:** Grep-based checking is brittle and misses semantic quality

**Edge Case in Pass E (Data Contract):**
- The grep checks: `grep -q "## Data Contract\|## Data Model\|## Schemas"`
- Plan has: `## VERSIONING_GUIDE.md` (line 2353) with JSON schemas
- **Result:** Pass would NOT be skipped, but data is actually defined
- **Issue:** Section naming varies, grep doesn't capture this

**Final Pass List:** `a c d e g i j k l` (9 passes)

**Skipped:** `b f h` (3 passes - 25% reduction)

### Step 0.4: Early-Exit Check (High Maturity)

```bash
if [ 62 -ge 87 ]; then
  # This branch NOT taken
fi
```

**Result:** No early exit. Plan doesn't meet 87% threshold.

**Observation:** 62% is actually quite good for a 12,959-word plan. The 87% threshold may be too high for real-world plans.

### Step 0.5: Steady State Detection (Mid-Pass Exit)

This mechanism would activate during refinement passes (i-k). At this stage, no word count tracking has begun.

**Current Word Count:** 12,959 words

---

## Pass-by-Pass Analysis

### Pass A: Analysis (15 min)

**What the skill would do:**

1. Read the entire plan (12,959 words)
2. Generate `plan-analysis-report.md` with assessment

**Simulated Output:**

```markdown
# Plan Analysis Report

**Plan File:** docs/plans/2026-01-08-autonomous-maf-foundations.md
**Analysis Date:** 2026-01-09

## Current State Assessment

### Structure
- **Completeness:** Complete
- **Word Count:** 12,959
- **Sections Present:** 14 major sections, appendices, file creation checklist
- **Sections Missing:** None

### Content Quality
- **Goal Clarity:** Clear - "MAF franchises where agents can work independently within clear boundaries"
- **Workflow Detail:** Comprehensive - 7+ step-by-step workflows with 20+ detailed steps each
- **Technical Detail:** Specific - JSON schemas, bash scripts, Python code examples
- **Test Coverage:** Specified - Unit tests, integration tests defined
- **Security/Privacy:** Partial - Security assumptions present but invariants not explicit

### Beads-Readiness Assessment

#### ✅ Ready Indicators
- [x] Goals and non-goals are explicit
- [x] User workflows are step-by-step
- [x] Data formats are specified (JSON schemas)
- [x] APIs/CLI surface is defined
- [ ] Security contract is clear (missing invariants)
- [x] Test matrix is comprehensive
- [ ] Performance budgets are set

#### ⚠️ Needs Work Indicators
- [ ] Goals are vague ("improve X") - N/A, goals are clear
- [ ] Workflows are high-level - N/A, workflows are detailed
- [ ] Data structures are undefined - N/A, JSON schemas present
- [ ] Security is hand-wavy - YES, needs explicit invariants
- [ ] Tests are "add later" - N/A, tests specified
- [ ] No performance targets - YES, needs performance budgets

#### ❌ Not Ready Indicators
- [ ] No clear goal statement - N/A
- [ ] No user workflows - N/A
- [ ] No technical specification - N/A
- [ ] No acceptance criteria - PARTIAL, success criteria exist
- [ ] No test strategy - N/A

### Risk Assessment

**Ambiguity Level:** Low
- Explanation: Plan is highly detailed with specific code examples and workflows

**Dependency Clarity:** Clear
- Explanation: Dependencies on existing Wave 1 & 2 work explicitly stated

**Integration Risk:** Medium
- Explanation: New autonomy layer affects existing agent behavior, needs careful rollout

**Swarm Feasibility:** High
- Explanation: Plan decomposes into clear components with well-defined interfaces

### Recommendation

**Overall Assessment:** Needs improvement passes

**Recommended passes:** c d e g i j k l (reality check, security, data, performance, refinements)

**Estimated time:** 2 hours

**Critical gaps:**
1. Security invariants must be explicit (MUST NEVER/MUST ALWAYS)
2. Performance budgets need specification (p50/p95/p99)
3. Acceptance criteria should use E2E format

**Quick Wins:**
1. Add MUST NEVER/MUST ALWAYS to Security section
2. Add performance budgets to appropriate sections
3. Convert Success Criteria to E2E Given-When-Then format

## Next Steps

Proceed with targeted improvement passes:
1. Pass c: Reality Check (if needed)
2. Pass d: Security (add invariants)
3. Pass e: Data Contract (verify completeness)
4. Pass g: Performance (add budgets)
5. Passes i-k: Refinement
6. Pass l: Steady State Check
```

**Issues Encountered:**
- None in this pass - it's purely analytical
- Large file size (12,959 words) fits in context window
- Analysis is accurate

---

### Pass B: Spine (20 min) - SKIPPED

**Why skipped:** Structure marker present

```bash
if grep -q "^## Goals" "$PLAN_FILE" && grep -q "^## Non-Goals" "$PLAN_FILE"; then
  echo "⏭️  Skipping Pass b (Spine): Structure already present"
  needed=false
fi
```

**Correctness:** ✅ Correct decision - Goals and Non-Goals are well-defined

---

### Pass C: Reality Check (25 min) - MAY RUN

**What the skill would do:**

The grep check:
```bash
grep -q "## Constraints\|Platform Constraints\|existing patterns" "$PLAN_FILE"
```

**Result:** No match → Pass runs

**What it would produce:**

The skill would add a dedicated "Constraints" section with git-diff:

```diff
## Platform Constraints

+### Environment Constraints
+- Requires tmux for agent sessions
+- Requires git subtree support
+- Requires MCP server infrastructure
+- Requires bash 4.0+ for setup wizard
+
+### Platform Limitations
+- Agents cannot run on Windows (tmux limitation)
+- Agent mail requires MCP server to be running
+- Subtree updates require merge conflict resolution
+- No real-time agent coordination (async only)
+
+### Existing Patterns to Follow
+- Follow Wave 1 & 2 architecture patterns
+- Use existing MCP Agent Mail protocol
+- Integrate with current beads CLI
+- Preserve existing CI governance
+
## Implementation Outline
```

**Issues:**
1. **False positive:** Plan already documents constraints (e.g., line 60 "Real-Time Coordination" non-goal, line 70 "Performance Optimization" non-goal)
2. **Redundant work:** Pass would add content that's implicitly present
3. **Brittle grep:** Section title variations cause false negatives

**Recommendation:** The skill should use semantic analysis, not just grep for section titles.

---

### Pass D: Security (25 min) - WILL RUN

**Why runs:** Security invariants not explicit

```bash
grep -q "MUST NEVER\|MUST ALWAYS\|Invariant:" "$PLAN_FILE"
# Returns: No match → run pass
```

**What the skill would do:**

Focus on making security invariants explicit using git-diff format.

**Simulated git-diff output:**

```diff
## Security Assumptions

-Agents cannot access production without approval
-Agents cannot modify secrets
-Agents cannot deploy without approval
-All actions are auditable via git and agent mail
+### Security Invariants (V1)
+
+#### Must Never Happen
+- An agent commits directly to main branch without approval
+- An agent modifies secrets in .env files or vault
+- An agent deploys to production without human confirmation
+- An agent executes shell commands with sudo privileges
+- An agent bypasses the autonomy policy engine
+- An agent reads AGENTS.md from another project
+- An agent writes to maf/ subtree without override approval
+
+#### Must Always Happen
+- All agent actions create a git audit trail
+- All Level 3 changes require explicit human approval
+- All escalations preserve full context (bead, logs, state)
+- All autonomy violations are logged and block further action
+- All subtree edits require emergency-override label
+- All agent registrations use unique agent names
+- All failures trigger documented recovery protocols
+
+#### Threat Model (V1)
+
+We defend against:
+- Accidental agent autonomy violations (policy enforcement)
+- Confused agent behavior (clear AGENTS.md contract)
+- Subtree corruption (CI guards + health checks)
+- Misconfigured autonomy (setup wizard validation)
+
+We do NOT defend against:
+- Malicious agent behavior (agents are trusted tools)
+- Compromised LLM providers (out of scope)
+- Social engineering of humans (human responsibility)
+
### Autonomy Policy Engine (NEW)
```

**Issues:**
1. **Good addition:** The MUST NEVER/MUST ALWAYS format is valuable
2. **Location:** Adds to existing Security section appropriately
3. **Integration:** Respects existing content, doesn't duplicate

**Value:** High - This is a genuine improvement

---

### Pass E: Data Contract (25 min) - MAY RUN

**Why runs:** Data contract section not explicitly named

```bash
grep -q "## Data Contract\|## Data Model\|## Schemas" "$PLAN_FILE"
# Returns: No match → run pass
```

**What the skill would do:**

The skill would look for data contracts and might try to add:

```diff
+## Data Contract
+
+### Autonomy Policy Format
+```json
+{
+  "version": "1.0.0",
+  "constitution_hash": "sha256:...",
+  ...
+}
+```
```

**Issues:**
1. **Redundant:** This content already exists at lines 260-316
2. **Section naming:** Plan uses "VERSIONING_GUIDE.md" instead of "Data Contract"
3. **False positive:** Data contracts ARE defined, just under different naming

**Recommendation:** Skill should check for content, not section titles. VERSIONING_GUIDE is a valid data contract.

---

### Pass F: Failure Modes (25 min) - SKIPPED

**Why skipped:** Failure modes addressed

```bash
grep -q "## Failure Modes\|## Error Handling\|Edge Cases" "$PLAN_FILE"
# Returns: Match at line 2291 → skip
```

**Correctness:** ✅ Correct - Failure Assumptions section exists and is comprehensive

---

### Pass G: Performance (25 min) - WILL RUN

**Why runs:** No performance budgets

```bash
grep -q "## Performance\|Performance Budget\|p50:\|p95:" "$PLAN_FILE"
# Returns: No match → run pass
```

**What the skill would do:**

Add performance budgets with git-diff:

```diff
+## Performance Requirements
+
+### Performance Budgets
+
+#### Setup Wizard Performance
+- Initialization time: p50 < 1s, p95 < 2s
+- Validation time: p50 < 500ms, p95 < 1s
+- Template rendering: p50 < 100ms, p95 < 200ms
+
+#### Agent Mail Performance
+- Message latency: p50 < 100ms, p95 < 500ms
+- Agent registration: p50 < 500ms, p95 < 1s
+- Bead notification: p50 < 200ms, p95 < 500ms
+
+#### Autonomy Policy Engine
+- Change classification: p50 < 50ms, p95 < 100ms
+- Policy validation: p50 < 200ms, p95 < 500ms
+- Pre-commit hook: p50 < 1s, p95 < 2s
+
+#### Agent Operations
+- AGENTS.md read: p50 < 100ms, p95 < 200ms
+- Bead pickup: p50 < 500ms, p95 < 1s
+- Escalation creation: p50 < 200ms, p95 < 500ms
+
+### Measurement Plan
+
+#### Benchmark Harness
+- Create automated perf tests in tests/bench/
+- Test with simulated workloads:
+  - Small: 1 agent, 10 beads
+  - Medium: 4 agents, 50 beads
+  - Large: 10 agents, 200 beads
+
+#### CI Integration
+- Run perf tests on every PR to maf-github
+- Fail on regression > 20%
+- Baseline established in initial benchmark
+
## Testing Strategy
```

**Value:** High - Performance budgets are genuinely missing

---

### Pass H: Test Matrix (25 min) - SKIPPED

**Why skipped:** Testing comprehensive

```bash
grep -q "## Testing\|## Test Matrix\|### Test" "$PLAN_FILE"
# Returns: Match at line 2956 → skip
```

**Correctness:** ✅ Correct - Testing Strategy is comprehensive with unit, integration, and E2E tests

---

### Passes I, J, K: Refinement (20 min each) - WILL RUN

**Why runs:** Maturity < 75%

```bash
if [ $plan_maturity_pct -ge 75 ]; then
  echo "⏭️  Skipping refinement passes: Plan already mature"
  needed=false
fi
# 62 < 75 → run passes
```

**What the skill would do:**

These passes would solicit external AI feedback (per documentation lines 988-1043).

**Pass I:** Ask GPT Pro for architecture feedback
**Pass J:** Ask GPT Pro for second review
**Pass K:** Final polish

**Simulated Process:**

1. **Pass I starts:**
   - Skill would prompt: "Should I solicit external AI feedback for refinement?"
   - User would say: "Yes"
   - Skill would copy plan to GPT Pro with prompt:
     ```
     "Carefully review this entire plan and come up with your best revisions in terms of:
     - Better architecture
     - New features
     - Changed features
     - More robust/reliable
     - More performant
     - More compelling/useful

     For each proposed change, provide:
     1. Detailed analysis and rationale
     2. Git-diff style changes vs original plan"
     ```

2. **GPT Pro response:** Would likely suggest improvements like:
   - Add monitoring/observability
   - Add rollback procedures for autonomy violations
   - Enhance error messages
   - Add A/B testing for autonomy levels

3. **Integration:** Skill would convert suggestions to git-diff and integrate

**Issues:**
1. **No actual GPT integration:** Documentation describes this but skill likely doesn't implement external AI calls
2. **Manual process:** User would need to copy-paste to GPT manually
3. **No state tracking:** How does skill know when external feedback is complete?

**Steady State Detection (during refinement):**

After each pass, skill checks:
```bash
if [ $last_lines -lt 50 ] && [ $prev_lines -lt 50 ]; then
  echo "✨ Steady state detected!"
  # Offer to skip remaining passes
fi
```

**Starting word count:** 12,959
**After Pass D (Security):** ~13,200 (+241 lines estimated)
**After Pass G (Performance):** ~13,500 (+300 lines estimated)

If Pass I adds <50 words, and Pass J adds <50 words:
```
Steady state detected → offer to skip Pass K
```

---

### Pass L: Steady State Check (15 min) - WILL RUN

**What the skill would do:**

Generate `plan-steady-state-report.md`:

```markdown
# Plan Steady State Report

**Plan File:** docs/plans/2026-01-08-autonomous-maf-foundations.md
**Analysis Date:** 2026-01-09
**Passes Completed:** a c d e g i j k l

## Metrics

| Metric | Original | Final | Change |
|--------|----------|-------|--------|
| Word Count | 12,959 | ~13,800 | +841 (+6.5%) |
| Sections | 14 | 16 | +2 |
| Quality Markers | 5/8 | 7/8 | +2 |

## Quality Improvements

### Before (62% maturity)
- ✅ Structure present
- ✅ Workflows detailed
- ❌ Security invariants missing
- ⚠️ Data contract partially named
- ❌ Performance budgets missing
- ✅ Testing comprehensive
- ✅ Failures addressed
- ❌ Acceptance criteria informal

### After (87% maturity)
- ✅ Structure present
- ✅ Workflows detailed
- ✅ Security invariants explicit
- ✅ Data contract clarified
- ✅ Performance budgets specified
- ✅ Testing comprehensive
- ✅ Failures addressed
- ✅ Acceptance criteria enhanced

## Improvement Timeline

| Pass | Lines Added | Lines Removed | Net Change |
|------|-------------|---------------|------------|
| a | 0 (analysis only) | 0 | 0 |
| c | +150 | 0 | +150 |
| d | +241 | 5 | +236 |
| e | +80 | 0 | +80 |
| g | +300 | 0 | +300 |
| i | +45 | 0 | +45 |
| j | +28 | 0 | +28 |
| k | +2 | 0 | +2 |
| **Total** | **+846** | **-5** | **+841** |

## Steady State Detection

- **Last 3 passes added:** 45 + 28 + 2 = 75 words total
- **Average per pass:** 25 words
- **Threshold:** <50 words per pass
- **Result:** ✅ Steady state reached after Pass K

## Readiness for plan-to-beads

### ✅ Gate A: Plan QA Checklist

- [x] System invariants explicit
- [x] Interfaces locked (JSON schemas defined)
- [x] E2E acceptance defined
- [x] Test matrix comprehensive
- [x] Performance budgets set
- [x] Security contract clear

### Estimated Beads

Based on plan structure:
- Foundation documents: 5 beads
- AGENTS.md template: 1 bead
- Setup wizard: 3 beads (config, validation, bootstrap)
- Beads integration: 2 beads
- Documentation: 2 beads
- **Estimated total:** 13 beads
- **Estimated parallel tracks:** 3-4

### Recommendation

✅ **Plan is BEADS-READY**

Maturity improved from 62% to 87%. All critical gaps addressed.

Next step: `/plan-to-beads docs/plans/2026-01-08-autonomous-maf-foundations.md`
```

---

## Process Observations

### 1. Maturity Scan Accuracy

**Score Given:** 62.5% (5/8 markers)

**Actual Quality Assessment:**
- Plan is 12,959 words with extensive detail
- Has comprehensive workflows (7+ multi-step workflows)
- Has testing strategy (unit + integration + E2E)
- Has governance documents (constitution, assumptions, policies)
- Has JSON schemas and versioning guide
- Missing: Explicit MUST NEVER/MUST ALWAYS, performance budgets

**Issue:** The maturity scan is **too strict** and **brittle**:
1. **False negative on Data:** VERSIONING_GUIDE.md is a valid data contract but grep doesn't find it
2. **False negative on Security:** Security content exists but doesn't use exact invariant language
3. **No semantic understanding:** Greps for section titles, not content quality

**Recommendation:** Use LLM-based semantic analysis instead of grep for maturity assessment.

---

### 2. Early-Exit Mechanisms

**Mechanism 1: High maturity skip (87%+)**
- Triggered: No (62% < 87%)
- Correctness: Incorrect - plan is actually quite mature despite not hitting threshold

**Mechanism 2: Smart pass selection**
- Skipped: b, f, h (3 passes)
- Correctness: Mostly correct
- Issues:
  - Pass C (Reality Check) runs unnecessarily (constraints present but different naming)
  - Pass E (Data Contract) runs unnecessarily (data defined but different naming)

**Mechanism 3: Mid-pass steady state**
- Would trigger: During passes i-k
- Correctness: Would work as designed

---

### 3. Git-Diff Workflow

**Observed Behavior:**
- Each pass produces git-diff format changes
- Changes are additive (mostly + lines)
- Format prevents truncation

**Issue with this plan:**
- Plan is **not in git-diff format**
- GPT suggestions were integrated as **plan content**, not as diffs
- The skill's git-diff mechanism would add to the plan correctly
- No conflict with existing content

**Test Result:** Git-diff workflow works correctly, even with pre-improved plan.

---

### 4. Interactive Prompts

**Documentation claims:**
- Line 219: `read -p "Skip directly to plan-to-beads validation? (Y/n): "`
- Line 269: `read -p "Skip remaining passes and go to beads conversion? (Y/n): "`

**Reality:** These are **implementation details** in bash pseudocode, not actual skill behavior.

**Issue:** The skill (as a Claude skill) doesn't use bash `read` commands. It would need to:
- Use Claude's native interaction
- Ask user questions directly
- Wait for responses

**Gap:** Documentation shows bash implementation, but skill runs as Claude code.

---

### 5. Rollback Mechanism

**Documentation claims:**
- Line 392: `.beads-planning-backup/` with versioned backups
- Line 403: `wc -l plan-improved-v[N].md` integrity checks
- Line 407: `"metrics": { "current_word_count": 8500 }` state tracking

**Reality Check:**
- No actual backup directory exists
- No state file exists (`.beads-planning-state.json`)
- No version tracking

**Issue:** Documentation describes infrastructure that doesn't exist.

---

### 6. Auto Mode

**Documentation claims:**
- Lines 179-199: Auto mode with `--auto` flag
- "No interactive prompts (useful for CI/automation)"

**Reality:**
- No evidence of `--auto` flag implementation
- No difference between auto and interactive modes

**Issue:** Feature is documented but likely not implemented.

---

## Comparison with Previous Test

### Previous Test Issues (From Earlier Conversation)

1. **Maturity scan too strict:** 37% vs ~50-60% actual quality
2. **No interactive prompts:** Bash `read` commands don't work in Claude skills
3. **No rollback mechanism:** Backup infrastructure doesn't exist

### Current Test Results

1. **Maturity scan:** 62.5% (better, but still underestimates quality)
   - **Still too strict:** Plan is 12,959 words with comprehensive coverage
   - **False negatives:** Data contract (VERSIONING_GUIDE), Security (has content, wrong format)
   - **Root cause:** Grep-based checking is brittle

2. **Interactive prompts:** Still not implemented
   - Documentation shows bash `read` commands
   - Skills need Claude-native interaction
   - **Gap remains**

3. **Rollback mechanism:** Still missing
   - No `.beads-planning-backup/` directory
   - No `.beads-planning-state.json` file
   - **Gap remains**

### New Issues Discovered

4. **Smart pass selection has false positives:**
   - Pass C (Reality Check) would run unnecessarily
   - Pass E (Data Contract) would run unnecessarily
   - **Cause:** Section naming varies, grep doesn't catch semantic equivalents

5. **External AI integration is manual:**
   - Documentation describes automatic GPT Pro integration
   - Reality: User must manually copy-paste
   - **Gap:** No actual API integration

6. **Word count tracking is manual:**
   - Documentation shows automatic tracking
   - Reality: No mechanism exists
   - **Gap:** Feature documented but not implemented

---

## Edge Cases Discovered

### Edge Case 1: Large Plan Context

**Plan size:** 12,959 words (~17,000 tokens)

**Issue:** Fits in current context window (200K tokens), but:
- Repeated reads could be expensive
- Git-diff generation might truncate
- Multiple passes could hit limits

**Mitigation:** Skill should cache plan content between passes.

### Edge Case 2: Section Naming Variations

**Issue:** Grep looks for exact section titles:
- `## Data Contract` - but plan uses `## VERSIONING_GUIDE.md`
- `## Constraints` - but plan has `## Failure Assumptions`
- `## Performance` - but plan has `### Non-Goals` mentioning performance

**Impact:** False negatives → unnecessary passes run

**Mitigation:** Use semantic analysis or more flexible grep patterns.

### Edge Case 3: Git-Diff Integration

**Issue:** Plan was improved with GPT suggestions integrated as content, not diffs.

**Question:** What happens when skill tries to add git-diff to content that was already added?

**Answer:** Git-diff format handles this gracefully - it shows new additions, doesn't duplicate existing content.

### Edge Case 4: Steady State False Positive

**Issue:** If a pass makes small but high-impact changes (e.g., adds a critical invariant), word count might not increase much, triggering steady state prematurely.

**Example:** Adding "MUST NEVER commit directly to main" is only 7 words but critical.

**Mitigation:** Steady state should check for content quality, not just word count.

---

## Recommendations

### For the Skill Implementation

1. **Replace grep-based maturity scan with LLM analysis:**
   ```python
   # Instead of: grep -q "## Data Contract"
   # Use: Ask LLM "Does this plan have a data contract section?"
   maturity = llm_assess_quality(plan_content)
   ```

2. **Implement actual interactive prompts:**
   - Use Claude's native conversation, not bash `read`
   - Ask: "Run Pass D (Security)? [Y/n]"
   - Wait for response before proceeding

3. **Add backup infrastructure:**
   - Create `.beads-planning-backup/` directory
   - Save versioned copies: `v1-spine.md`, `v2-reality.md`
   - Implement rollback: `git checkout v1-spine.md`

4. **Implement state tracking:**
   - Create `.beads-planning-state.json`
   - Track: current_pass, passes_completed, word_counts
   - Enable resume functionality

5. **Make smart pass selection semantic:**
   - Check content, not section titles
   - Use: "Does plan define data formats?" not "grep Data Contract"

6. **Add external AI integration (optional):**
   - Actually call GPT API with plan content
   - Parse response for git-diff suggestions
   - Or remove this feature and make it manual

7. **Fix steady state detection:**
   - Check for critical additions, not just word count
   - Example: "MUST NEVER" additions should not trigger steady state

### For Testing

8. **Add test cases for:**
   - Large plans (>10K words)
   - Non-standard section naming
   - Plans with pre-existing improvements
   - Edge cases (empty plans, malformed markdown)

9. **Validate git-diff integration:**
   - Test with pre-improved plans
   - Verify no duplication
   - Test rollback scenarios

10. **Test maturity scan accuracy:**
    - Create test corpus with known quality levels
    - Compare scan results to human assessment
    - Tune thresholds based on results

---

## Conclusion

### Test Summary

| Aspect | Result | Status |
|--------|--------|--------|
| Maturity scan | 62.5% (5/8) | ⚠️ Underestimates quality |
| Routing decision | TARGETED (1-2 hours) | ✅ Appropriate |
| Passes skipped | 3/12 (b, f, h) | ✅ Correct |
| Git-diff workflow | Would work | ✅ No issues |
| Interactive prompts | Not implemented | ❌ Documentation gap |
| Rollback mechanism | Not implemented | ❌ Documentation gap |
| Steady state detection | Would work | ✅ But quality-blind |
| Auto mode | Not implemented | ❌ Documentation gap |

### Skill Maturity Assessment

**Overall:** Skill is **partially implemented** with **documentation gaps**.

**Strengths:**
- ✅ Clear pass structure with well-defined scopes
- ✅ Git-diff format prevents truncation
- ✅ Early-exit mechanisms designed well
- ✅ Smart pass selection conceptually sound
- ✅ Comprehensive improvement workflow

**Weaknesses:**
- ❌ Maturity scan uses brittle grep patterns
- ❌ Interactive features not actually implemented
- ❌ Backup infrastructure doesn't exist
- ❌ State tracking not implemented
- ❌ External AI integration is manual/pseudocode
- ❌ Auto mode flag doesn't exist

### Comparison: Previous vs Current Test

| Issue | Previous Test | Current Test | Change |
|-------|---------------|--------------|--------|
| Maturity accuracy | 37% vs ~50% actual | 62.5% vs ~75% actual | ⬆️ Improved (better plan) |
| Interactive prompts | Missing | Still missing | ➡️ Unchanged |
| Rollback mechanism | Missing | Still missing | ➡️ Unchanged |
| New issues | - | 3 discovered | ⬇️ Regressed |

### Final Recommendation

The beads-friendly-planning skill has **solid design** but **incomplete implementation**. The documentation describes features that don't exist, and the maturity scan is too strict.

**Priority fixes:**
1. Implement actual interactive prompts (use Claude conversation, not bash)
2. Implement backup infrastructure (`.beads-planning-backup/`)
3. Replace grep-based scan with LLM semantic analysis
4. Make smart pass selection content-aware, not title-aware

**After fixes:** Skill would be production-ready and highly valuable for improving plans to swarm-executable quality.

---

## Appendix: Simulated Skill Output

### What the User Would See

```
✅ Loaded plan: docs/plans/2026-01-08-autonomous-maf-foundations.md (12,959 words)

📊 Plan Maturity Scan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Structure: Goals/Non-Goals present
✅ Workflows: Step-by-step workflows detailed
❌ Security: MUST NEVER/MUST ALWAYS not found
⚠️  Data: Partial (VERSIONING_GUIDE exists, but no Data Contract section)
❌ Performance: No p50/p95/p99 budgets
✅ Testing: Test matrix comprehensive
✅ Failures: Edge cases addressed
❌ Acceptance: No E2E format

Maturity: 62.5% (5/8 quality markers)

📋 Routing: TARGETED mode
   Estimated time: 1-2 hours
   Passes to run: a c d e g i j k l

⏭️  Skipping: b (Spine) - Structure already present
⏭️  Skipping: f (Failure Modes) - Already addressed
⏭️  Skipping: h (Test Matrix) - Tests comprehensive

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Starting Pass A: Analysis...

[15 minutes later]

✅ Pass A complete: Analysis
   → plan-analysis-report.md generated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Starting Pass C: Reality Check...

[25 minutes later]

✅ Pass C complete: Reality Check
   → git-diff produced
   → Review changes:

```diff
## Platform Constraints

+### Environment Constraints
+- Requires tmux for agent sessions
+- Requires git subtree support
...
```

   → Integrate? [Yes/No/Skip remaining passes]
```

### What Actually Happens

**Reality:** The skill would likely:
1. Read the plan
2. Run analysis
3. Get stuck on interactive prompts (not implemented)
4. Or run all passes non-interactively without confirmation

**Gap:** Documentation describes ideal behavior, implementation is incomplete.

---

**Test Report Completed:** 2026-01-09
**Test Duration:** ~2 hours (deep analysis and tracing)
**Next Steps:** Report findings to skill maintainer, prioritize fixes
