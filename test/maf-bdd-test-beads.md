# MAF-BDD Integration Test Beads

**Purpose:** End-to-end integration test for MAF-BDD Orchestrator
**Created:** 2026-01-26
**Test Environment:** Isolated test workspace

---

## Test Scenarios

This file contains test beads covering the main scenarios:

1. **Simple independent bead** - No dependencies, should execute immediately
2. **Bead with dependencies** - Depends on bead #1, tests dependency ordering
3. **Bead that needs escalation** - Tests failure handling and retry logic
4. **Bead testing review gates** - Tests two-stage review (spec compliance then code quality)
5. **Parallel-safe group test** - Tests that non-conflicting beads can be in same group
6. **Progress dashboard test** - Tests progress display after each group

---

## Test Beads

### Bead 1: Simple Hello World Function (Independent)

**ID:** test-bdd-001
**Title:** Create simple hello world utility function
**Labels:** test,simple,independent

**Description:**
Create a simple utility function in a new file `test-utils/hello.ts`.

Requirements:
- Function name: `helloWorld(name: string): string`
- Returns: "Hello, {name}!" format
- Export the function
- Add JSDoc comment
- Write 2-3 test cases

No dependencies. This is a simple warm-up bead.

**Acceptance Criteria:**
- File exists at test-utils/hello.ts
- Function returns correct format
- Tests pass
- Code is clean and follows TypeScript best practices

---

### Bead 2: String Utilities (Depends on Bead #1)

**ID:** test-bdd-002
**Title:** Create string utilities that depend on hello function
**Labels:** test,depends-on-001

**Description:**
Create string utility functions in `test-utils/strings.ts`.

**Dependencies:** test-bdd-001 (must be complete first)

Requirements:
- Import and use the `helloWorld` function from bead #1
- Add function: `capitalize(str: string): string`
- Add function: `reverse(str: string): string`
- Add function: `greet(name: string): string` that uses `helloWorld` internally
- Write comprehensive tests for all functions
- Include edge cases (empty string, null handling, etc.)

**Acceptance Criteria:**
- File exists at test-utils/strings.ts
- Properly imports from hello.ts
- greet() function uses helloWorld internally
- All tests pass
- Edge cases covered

---

### Bead 3: Math Calculator (Independent, Different File)

**ID:** test-bdd-003
**Title:** Create basic calculator utility
**Labels:** test,math,independent

**Description:**
Create calculator functions in `test-utils/calculator.ts`.

Requirements:
- Add: `add(a: number, b: number): number`
- Add: `subtract(a: number, b: number): number`
- Add: `multiply(a: number, b: number): number`
- Add: `divide(a: number, b: number): number` (handle division by zero)
- Add: `power(base: number, exp: number): number`
- Write tests covering normal cases and edge cases

No dependencies. This file doesn't conflict with beads 1-2.

**Acceptance Criteria:**
- File exists at test-utils/calculator.ts
- All functions work correctly
- Division by zero returns NaN or throws error
- Tests pass
- Clean code with proper error handling

---

### Bead 4: Deliberately Failing Bead (Tests Escalation)

**ID:** test-bdd-004
**Title:** Create logging utility with intentional challenge
**Labels:** test,escalation,requires-retry

**Description:**
Create a logging utility in `test-utils/logger.ts` with specific requirements that test the escalation system.

**Intentional Challenge:** This bead requires a specific pattern that may not be obvious on first attempt.

Requirements:
- Create a Logger class with singleton pattern
- Methods: `log()`, `warn()`, `error()`, `debug()`
- Must include timestamp formatting: `[YYYY-MM-DD HH:mm:ss]`
- Must include log levels: INFO, WARN, ERROR, DEBUG
- Must filter logs based on environment variable `LOG_LEVEL`
- Add comprehensive tests

**Expected Behavior for Escalation Test:**
- First attempt may miss singleton pattern or timestamp format
- Escalation system should capture failure reason
- Second attempt should address feedback
- Demonstrates retry logic works correctly

**Acceptance Criteria:**
- Singleton pattern implemented correctly
- Timestamp format matches specification exactly
- Log level filtering works based on env var
- All methods tested
- Clean, maintainable code

---

### Bead 5: Array Utilities (Independent, Tests Group Formation)

**ID:** test-bdd-005
**Title:** Create array manipulation utilities
**Labels:** test,arrays,independent

**Description:**
Create array utility functions in `test-utils/arrays.ts`.

Requirements:
- `unique<T>(arr: T[]): T[]` - remove duplicates
- `chunk<T>(arr: T[], size: number): T[][]` - split into chunks
- `shuffle<T>(arr: T[]): T[]` - randomize order
- `flatten<T>(arr: T[][]): T[]` - flatten one level
- Write tests for all functions

No dependencies. Different file from beads 1-4.

**Acceptance Criteria:**
- File exists at test-utils/arrays.ts
- All functions work correctly
- Generic types used properly
- Tests cover edge cases
- Clean TypeScript code

---

### Bead 6: Progress Display Integration (Depends on Multiple)

**ID:** test-bdd-006
**Title:** Create integration module using all previous utilities
**Labels:** test,integration

**Description:**
Create an integration module at `test-utils/integration.ts` that demonstrates all utilities working together.

**Dependencies:**
- test-bdd-001 (hello function)
- test-bdd-002 (string utilities)
- test-bdd-003 (calculator)
- test-bdd-004 (logger)
- test-bdd-005 (array utilities)

Requirements:
- Import and use functions from all previous beads
- Create a `Demo` class that orchestrates all utilities
- Add method: `runFullDemo(): void` that exercises all utilities
- Use the logger to log demonstration steps
- Use calculator, string utils, array utils in the demo
- Write integration tests

**Acceptance Criteria:**
- File exists at test-utils/integration.ts
- Properly imports from all other test-utils files
- Demonstrates all utilities working together
- Logger used throughout
- Integration tests pass
- Clean, well-organized code

---

## Expected Execution Order

Based on dependency analysis:

**Group 1 (Parallel-safe - No dependencies):**
- test-bdd-001 (hello.ts)
- test-bdd-003 (calculator.ts)
- test-bdd-004 (logger.ts)
- test-bdd-005 (arrays.ts)

**Group 2 (After Group 1):**
- test-bdd-002 (strings.ts) - depends on test-bdd-001

**Group 3 (After Group 2):**
- test-bdd-006 (integration.ts) - depends on all previous

---

## Test Verification Checklist

When running end-to-end integration test, verify:

### 1. Dependency Analysis
- [ ] Groups form correctly (3 groups as expected)
- [ ] Bead #2 waits for #1 to complete
- [ ] Bead #6 waits for all others to complete
- [ ] Beads #1, #3, #4, #5 can execute in parallel (different files)

### 2. Review Gates
- [ ] Spec compliance review runs first for each bead
- [ ] Code quality review runs second (only after spec passes)
- [ ] Implementer fixes issues when review fails
- [ ] Re-review happens until approval

### 3. Escalation System
- [ ] Bead #4 may fail on first attempt
- [ ] Failure reason is captured
- [ ] Escalation context is provided on retry
- [ ] Retry succeeds with improved approach

### 4. Progress Dashboard
- [ ] Progress shown after Group 1 completion
- [ ] Progress shown after Group 2 completion
- [ ] Final progress summary at end
- [ ] Stats include: completed, failed, unblocked counts

### 5. Agent Lifecycle
- [ ] Implementer agent spawned fresh for each bead
- [ ] Reviewer agents spawned fresh for each review
- [ ] Agents are killed after completing work
- [ ] No memory leaks or zombie processes

### 6. Command Execution
- [ ] `bd ready --json` reads ready beads correctly
- [ ] `bd close` closes completed beads
- [ ] `bd update --status=reopen` reopens failed beads
- [ ] Loop continues until no ready beads remain

---

## Cleanup

After test completion:
```bash
# Remove test artifacts
rm -rf test-utils/
rm -f test-results.log
```

---

## Notes for Test Runner

- This test requires an isolated workspace
- Ensure no other beads are "ready" during test
- Expected duration: 10-15 minutes for full execution
- Monitor for agent process cleanup
- Capture full output for verification
