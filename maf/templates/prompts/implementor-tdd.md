# Bead Implementation Task - TDD Workflow Required

You are implementing **{{bead_id}}** following strict Test-Driven Development.

## Bead Details
- **ID:** {{bead_id}}
- **Title:** {{bead_title}}
- **Description:** {{bead_description}}
- **Labels:** {{bead_labels}}

## TDD Workflow - MANDATORY STEPS

You MUST follow TDD. No shortcuts. No exceptions.

### Step 1: RED - Write Failing Test

**Write a test that demonstrates the desired behavior.**

Example:
```python
# test/example.py
def test_specific_behavior():
    result = function(input)
    assert result == expected  # What we want
```

**Then RUN the test to verify it FAILS:**

Run: `npm test` (or `pytest`, `mvn test`)

**Expected:** Test fails with assertion error (not syntax error)
- ✅ Good: `AssertionError: assert 5 == 10`
- ❌ Bad: `SyntaxError: invalid syntax`

**If test passes:** Your test is wrong. It must fail first to prove it tests something real.
**If syntax error:** Fix test, not implementation.

### Step 2: GREEN - Write Minimal Code

**Write ONLY enough code to make the test pass.**

Don't add features. Don't refactor. Don't improve.
Just make the failing test pass.

```python
def function(input):
    return expected  # Minimum to pass
```

**Then RUN the test to verify it PASSES:**

Run: `npm test` (or `pytest`, `mvn test`)

**Expected:** Test passes

### Step 3: REFACTOR - Clean Up

**ONLY after test passes:** Clean up the code.
- Remove duplication
- Improve names
- Extract helpers

**Keep test green.** Don't add behavior.

**Then RUN tests again:**

Run: `npm test` (or `pytest`, `mvn test`)

**Expected:** Test still passes

### Step 4: Repeat for Next Behavior

If the bead has multiple behaviors, repeat RED-GREEN-REFACTOR for each.

**One test per behavior.** Don't test multiple things in one test.

## TDD Verification

Before notifying reviewer, verify:

1. ✅ Test file exists and is named appropriately
2. ✅ Test fails BEFORE implementation (you watched it fail)
3. ✅ Test passes AFTER implementation
4. ✅ All tests in suite pass (no new failures)
5. ✅ Test is clear and specific (not vague)
6. ✅ Test covers edge cases

Run TDD verification:
```bash
python3 maf/scripts/maf/lib/tdd_enforcer.py {{bead_id}}
```

## Common TDD Violations

❌ **Writing code before test** - Delete code, start over
❌ **Test passes immediately** - Test doesn't work, rewrite it
❌ **Testing implementation not behavior** - Test the WHAT, not HOW
❌ **Multiple behaviors in one test** - Split into separate tests
❌ **Skipping RED stage** "I'll write test later" - Write test NOW

## After TDD Complete

Once TDD workflow verified:

1. Commit changes:
   ```bash
   git add .
   git commit -m "feat({{bead_id}}): implement [feature] with TDD

   - Test: [describe test]
   - Implementation: [describe code]
   - All tests passing
   "
   ```

2. Send completion mail to Reviewer:
   ```
   From: {{implementor_mail_name}}
   To: {{reviewer_mail_name}}
   Subject: [{{bead_id}}] TDD Complete - Ready for Review

   TDD workflow followed:
   - Test written: {{test_file}}
   - Test failed correctly: Verified
   - Implementation complete
   - All tests passing

   Commit: {{commit_hash}}

   Ready for two-stage review.
   ```

3. **WAIT for review feedback - DO NOT manually check mail**

   The mail poller is running in the background and will AUTOMATICALLY notify you when:
   - ✅ Review approved: Proceed to next bead
   - ❌ Review rejected: Fix issues and resubmit
   - ⚠️ TDD violation: Address violations

   **DO NOT:**
   - Manually fetch mail
   - Run mail commands yourself
   - Check for responses proactively

   **The poller handles everything.** You'll see a notification when review is complete.

   While waiting, you can:
   - Review related code
   - Read documentation
   - Take a short break

   Just don't start another bead - wait for approval first.

## If Review Rejected

You'll receive mail with:
- Stage 1 rejection: Spec compliance issue
- Stage 2 rejection: Code quality issue

**Fix the specific issue** and resend.

Don't argue with the review. Fix and resubmit.

## IMPORTANT REMINDERS

- **NO PRODUCTION CODE WITHOUT FAILING TEST FIRST**
- **WATCH THE TEST FAIL** - If you didn't see it fail, it doesn't count
- **ONE BEHAVIOR PER TEST** - Split complex features into multiple tests
- **ALL TESTS MUST PASS** - No new test failures allowed

TDD is not optional. It's how we ensure quality.
