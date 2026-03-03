# Bead Implementation Task

You are implementing a single bead. Follow TDD workflow.

## Bead Details

- **ID**: {{bead_id}}
- **Title**: {{bead_title}}
- **Description**: {{bead_description}}
- **Labels**: {{bead_labels}}

## Escalation Context

{{escalation_context}}

## Pre-flight Status

{{preflight_status}}

---

## Instructions

Follow this TDD workflow to implement the bead:

### 1. Read the Bead

- Carefully read the bead description
- Understand the requirements and scope
- Identify dependencies and constraints
- Clarify the acceptance criteria

### 2. Write Failing Tests First

**Before writing any implementation code:**

- Create test file(s) for the functionality
- Write test cases that cover the bead requirements
- Ensure tests fail (red state)
- Test file should be named appropriately (e.g., `bead-{bead_id}.test.ts`)
- Include edge cases and error scenarios
- Tests should be descriptive and self-documenting

### 3. Implement Feature

**Write implementation code to make tests pass:**

- Write minimal code to satisfy the tests
- Follow project patterns and conventions
- Ensure code is readable and maintainable
- Add appropriate error handling
- Run tests frequently (green state)
- Refactor as needed while keeping tests passing

### 4. Self-Review

**Before committing:**

- Verify all tests pass
- Check code against bead requirements
- Ensure no unnecessary changes
- Verify file modifications are correct
- Check for security issues
- Consider performance implications
- Validate integration points

### 5. Commit

**Create a commit with:**

- Clear commit message describing the bead implementation
- Include bead ID in commit message: `Bead {{bead_id}}: {brief description}`
- Follow project commit conventions
- Stage only relevant files
- Ensure no unrelated changes are included

### 6. Report Ready

**Report completion status:**

- Confirm implementation is ready for review
- Provide summary of changes
- Note any deviations or concerns
- Report test results

---

## Output Format

Respond with JSON in the following format:

```json
{
  "status": "ready_for_review|failed",
  "commit_hash": "git commit hash after implementation",
  "files_changed": [
    "list of files modified or created"
  ],
  "tests_run": "number of tests executed",
  "tests_passed": "number of tests that passed",
  "self_review": "Summary of self-review findings, any concerns, and confirmation that implementation meets bead requirements"
}
```

**Status Values:**

- `ready_for_review`: Implementation complete, tests passing, committed successfully
- `failed`: Implementation could not be completed (provide reason in self_review)

**Important Notes:**

- Always follow TDD: Red (write failing tests) → Green (write code) → Refactor
- Never skip tests or write tests after implementation
- All tests must pass before reporting ready
- Commit only relevant changes for this bead
- If you encounter blockers or issues, report them in self_review
- Be honest in self-review - acknowledge any limitations or concerns
