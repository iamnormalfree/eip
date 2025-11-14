# Systematic Debugging (NextNest Adapted)

**Source:** Superpowers v2.0.0
**Adapted for:** NextNest project
**Last Updated:** 2025-10-18

---

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**When to use:**
- ANY technical issue, bug, test failure, or unexpected behavior
- When tempted to "quick fix" symptoms
- When debugging feels chaotic
- Before proposing any fix
- **Especially under time pressure** (emergencies make guessing tempting)

---

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

**Violating the letter of this process is violating the spirit of debugging.**

---

## Integration with Response-Awareness Router

**When router detects debugging task:**

```javascript
const debugKeywords = ["bug", "error", "not working", "broken", "fix", "failing"];

const isDebugTask = debugKeywords.some(keyword => userTask.toLowerCase().includes(keyword));

if (isDebugTask) {
  askUser({
    message: "This appears to be a debugging task. Should I use systematic-debugging skill?",
    options: [
      { label: "Yes, systematic debugging", value: "debug" },
      { label: "No, I know the fix", value: "continue" }
    ]
  });

  if (userChoice === "debug") {
    invokeSkill("systematic-debugging", userTask);
    return;  // Exit router, debugging handles it
  }
}
```

---

## The Four Phases

**YOU MUST complete each phase before proceeding to the next.**

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

#### 1.1 Read Error Messages Carefully

```bash
# Run the failing operation with verbose output
npm test -- --verbose
npm run build -- --verbose

# Capture full error output
npm test 2>&1 | tee error-log.txt
```

**What to look for:**
- Exact error text (don't paraphrase)
- Stack traces completely (don't skip lines)
- Line numbers, file paths, error codes
- Warnings before the error (often reveal root cause)

#### 1.2 Reproduce Consistently

```bash
# Can you trigger it reliably?
npm test -- --grep "specific failing test"

# Try multiple times
for i in {1..5}; do npm test; done

# Document steps
echo "1. Run npm test
2. Observe failure in X component
3. Error message: [exact text]" > reproduction-steps.txt
```

**If not reproducible:**
- Gather more data (add logging)
- Check for timing/race conditions
- Environmental differences (dev vs CI)
- **Don't guess - investigate more**

#### 1.3 Check Recent Changes

```bash
# What changed that could cause this?
git log --oneline -10
git diff HEAD~5  # Last 5 commits

# When did it start failing?
git bisect start
git bisect bad HEAD
git bisect good <last-known-good-commit>
```

**NextNest-specific checks:**
- Review CANONICAL_REFERENCES.md for modified Tier 1 files
- Check if pre-commit hooks changed
- Review docs/work-log.md for recent work
- Check if dependencies updated (package-lock.json changes)

#### 1.4 Gather Evidence in Multi-Component Systems

**WHEN system has multiple components (forms → API → Supabase, chat → AI Broker → backend):**

**BEFORE proposing fixes, add diagnostic instrumentation:**

```typescript
// Example: Form submission failing

// Layer 1: Client-side form
console.log('=== Form Submission ===');
console.log('Form data:', formData);
console.log('Validation result:', validationResult);

// Layer 2: API route
export async function POST(request: Request) {
  console.log('=== API Route Received ===');
  const body = await request.json();
  console.log('Request body:', body);

  // Layer 3: Business logic
  const result = await processApplication(body);
  console.log('Processing result:', result);

  // Layer 4: Database
  const saved = await supabase.from('applications').insert(data);
  console.log('Database response:', saved);
}
```

**This reveals:** Which layer fails (client ✓, API ✓, database ✗)

#### 1.5 Trace Data Flow

**WHEN error is deep in call stack:**

Use backward tracing:

```typescript
// Error happens here (symptom)
function calculateTDSR(income: number, debt: number) {
  return (debt / income) * 100;  // Error: income is NaN
}

// Trace back: Where did income come from?
function processForm(data: FormData) {
  const income = parseIncome(data.grossIncome);  // Check this
  return calculateTDSR(income, data.totalDebt);
}

// Keep tracing
function parseIncome(value: string) {
  return parseFloat(value);  // Returns NaN if value is undefined
}

// ROOT CAUSE: Form field 'grossIncome' is undefined
// FIX: Validate form data before parsing, not at calculation layer
```

**Key principle:** Fix at source, not at symptom.

---

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

#### 2.1 Find Working Examples

```bash
# Locate similar working code
grep -r "similar pattern" components/
grep -r "working example" lib/

# Compare
code --diff components/working-form.tsx components/broken-form.tsx
```

**NextNest-specific:**
- Check `components/forms/` for working form patterns
- Review `lib/calculations/` for working calculation examples
- Look at tests in `__tests__/` for expected behavior

#### 2.2 Compare Against References

**If implementing pattern from docs:**

```bash
# Read reference implementation COMPLETELY
cat docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md

# Don't skim - read every line
# Understand the pattern fully before applying
```

**NextNest runbooks:**
- `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` - Form patterns
- `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` - AI Broker usage
- `docs/runbooks/TECH_STACK_GUIDE.md` - Tech stack patterns

#### 2.3 Identify Differences

**List every difference between working and broken:**

| Aspect | Working | Broken | Hypothesis |
|--------|---------|--------|------------|
| Imports | `import { z } from 'zod'` | `import zod from 'zod'` | Wrong import style? |
| Props | `income: number` | `income: string` | Type mismatch? |
| Validation | Zod schema applied | No validation | Missing validation? |

**Don't assume "that can't matter"** - list it anyway.

#### 2.4 Understand Dependencies

```bash
# What does this need?
npm list <package-name>

# Check versions
cat package.json | grep <package-name>

# Check environment
cat .env.local | grep <CONFIG_VAR>
```

---

### Phase 3: Hypothesis and Testing

**Scientific method:**

#### 3.1 Form Single Hypothesis

**Write it down explicitly:**

```markdown
## Hypothesis

I think the TDSR calculation is returning NaN because:
- The `grossIncome` field is not being passed from the form
- This happens because the form field name is 'income' but the API expects 'grossIncome'
- Evidence: Console log shows `income: undefined` at API layer

Expected fix: Rename form field to 'grossIncome' OR update API to accept 'income'
```

Be specific, not vague.

#### 3.2 Test Minimally

**Make the SMALLEST possible change to test hypothesis:**

```typescript
// ONE variable at a time
// Before:
<input name="income" />

// After (testing hypothesis):
<input name="grossIncome" />

// Run test
npm test -- --grep "TDSR calculation"
```

**Don't:**
- Fix multiple things at once
- Add refactoring "while I'm here"
- Bundle multiple hypotheses

#### 3.3 Verify Before Continuing

```bash
# Did it work?
npm test

# If YES: Proceed to Phase 4 (clean implementation)
# If NO: Form NEW hypothesis, don't stack more fixes
```

**NextNest TDD Check:**
- Did we write a failing test first? (per CLAUDE.md rules)
- Does the fix make the test pass?
- Did we break any other tests?

#### 3.4 When You Don't Know

**Be honest:**
- "I don't understand why X happens"
- "I need to research Y"
- "Can you help me understand Z?"

**Don't:**
- Pretend to know
- Propose fixes you don't understand
- Use #COMPLETION_DRIVE to fill gaps

---

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

#### 4.1 Create Failing Test Case (TDD)

```typescript
// FIRST: Write test that reproduces bug
describe('TDSR Calculation', () => {
  it('should handle missing income field gracefully', () => {
    const formData = { debt: 1000 };  // income missing
    const result = calculateTDSR(formData);

    expect(result.error).toBe('Income is required');
    // Currently this test FAILS because we return NaN
  });
});

// Run test - confirm it fails
npm test -- --grep "should handle missing income"
```

**NextNest TDD rules (from CLAUDE.md):**
1. Write failing test
2. Run test to confirm it fails
3. Write ONLY enough code to make it pass
4. Run test to confirm success
5. Refactor if needed

#### 4.2 Implement Single Fix

**Address the root cause identified:**

```typescript
// Root cause: No validation before calculation
function calculateTDSR(formData: FormData): Result {
  // FIX: Validate at entry point, not deep in calculation
  if (!formData.grossIncome) {
    return { error: 'Income is required' };
  }

  const income = parseFloat(formData.grossIncome);
  const debt = parseFloat(formData.totalDebt);

  if (isNaN(income) || isNaN(debt)) {
    return { error: 'Invalid number format' };
  }

  return { value: (debt / income) * 100 };
}
```

**ONE change at a time:**
- No bundled refactoring
- No "while I'm here" improvements
- Focus on root cause only

#### 4.3 Verify Fix

```bash
# Test passes now?
npm test

# No other tests broken?
npm test  # Run full suite

# Issue actually resolved in app?
npm run dev  # Manual verification
```

**NextNest checks:**
- All tests passing (not just the new one)
- No pre-commit hook failures
- Build succeeds: `npm run build`
- Linting passes: `npm run lint`

#### 4.4 If Fix Doesn't Work

**STOP. Count your attempts:**

```markdown
## Fix Attempts

1. Renamed form field to 'grossIncome' - Didn't work, still NaN
2. Added parseFloat - Didn't work, still NaN
3. Added validation - Didn't work, validation not triggered
```

**Decision:**
- **If < 3 attempts:** Return to Phase 1, re-analyze with new information
- **If ≥ 3 attempts:** STOP and question the architecture (see 4.5)

**DON'T attempt Fix #4 without architectural discussion.**

#### 4.5 If 3+ Fixes Failed: Question Architecture

**Pattern indicating architectural problem:**
- Each fix reveals new problem in different place
- Fixes require "massive refactoring"
- Each fix creates new symptoms elsewhere
- Shared state/coupling everywhere

**STOP and question fundamentals:**
```markdown
## Architectural Review Needed

**Problem:** 3+ fixes failed, each revealing new coupling issues

**Questions:**
- Is this pattern fundamentally sound?
- Are we "sticking with it through sheer inertia"?
- Should we refactor architecture vs. continue fixing symptoms?

**Examples of coupling found:**
- Form state managed in 5 different places
- Validation logic duplicated across components
- Data transformations scattered throughout flow

**Recommendation:** Refactor to centralized form state management before continuing fixes
```

**Discuss with user before attempting more fixes.**

This is NOT a failed hypothesis - this is a wrong architecture.

---

## Red Flags - STOP and Follow Process

**If you catch yourself thinking:**
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- "One more fix attempt" (when already tried 2+)
- Each fix reveals new problem in different place

**ALL of these mean: STOP. Return to Phase 1.**

---

## Logging for Learning

**If verbose logging enabled:**

```javascript
// Load config
const loggingConfig = loadConfig('.claude/config/logging-config.json');

if (loggingConfig.default_level === 'verbose') {
  const logPath = `${loggingConfig.paths.verbose_logs}/${timestamp}_${taskSlug}`;

  logDebugSession({
    phase: 1,
    hypothesis: "Form field name mismatch",
    evidence: ["Console shows 'income: undefined'", "API expects 'grossIncome'"],
    test_result: "Failed - still NaN",
    next_action: "Re-analyze Phase 1 with new evidence"
  });
}
```

---

## Quick Reference

| Phase | Key Activities | Success Criteria | NextNest Specific |
|-------|---------------|------------------|-------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY | Check CANONICAL_REFERENCES, work-log, git history |
| **2. Pattern** | Find working examples, compare | Identify differences | Use runbooks, check similar components |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis | Write failing test first (TDD) |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass | All tests pass, build succeeds, lint passes |

---

## Integration with Other Skills

**This skill works with:**
- `root-cause-tracing` - How to trace back through call stack
- `test-driven-development` - How to write proper failing tests
- `/response-awareness` - After fix, route implementation through tiers

**When debugging complete:**
```bash
# Fix verified, tests pass
# Return to response-awareness for any follow-up work
/response-awareness "Implement defensive validation for all form inputs"
```

---

## Real-World Impact

**From debugging sessions:**
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

---

## Remember

✅ **DO:**
- Complete Phase 1 before proposing fixes
- Write one clear hypothesis at a time
- Test minimally (one variable)
- Create failing test first (TDD)
- Return to Phase 1 if fix doesn't work (< 3 attempts)
- Question architecture after 3+ failed fixes

❌ **DON'T:**
- Jump to solutions
- Stack multiple fixes
- Skip testing
- Assume without verifying
- Fix symptoms instead of root cause
- Keep trying fixes after 3 failures (question architecture instead)

---

**Version:** 2.0.0-nextnest
**Source:** Superpowers Systematic Debugging v2.0.0
**NextNest Customizations:**
- TDD workflow integration (CLAUDE.md rules)
- CANONICAL_REFERENCES checks
- Runbook references
- Verbose logging integration
- Response-awareness handoff
