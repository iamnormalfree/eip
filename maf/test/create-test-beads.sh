#!/bin/bash
# Create test beads for MAF-BDD integration test

set -e

TEST_DIR="test-integration"
cd "$TEST_DIR"

echo "Creating test beads with proper metadata..."

# Bead 1
bd create --title "Create hello world utility" \
  --labels "test,simple,independent" \
  --description "Create helloWorld(name: string): string in test-utils/hello.ts

Returns 'Hello, {name}!' format.
Export function, add JSDoc, write 2-3 tests.

No dependencies. Simple warm-up bead.

Acceptance: File exists, function works, tests pass." > /dev/null 2>&1

# Bead 2
bd create --title "Create string utilities" \
  --labels "test,depends-on-001" \
  --description "Create string functions in test-utils/strings.ts

Dependencies: test-bdd-001 must complete first

Functions:
- capitalize(str: string): string
- reverse(str: string): string  
- greet(name: string): string (uses helloWorld from #001)

Import and use helloWorld function. Write tests.

Acceptance: Imports hello.ts, greet uses it, tests pass." > /dev/null 2>&1

# Bead 3
bd create --title "Create calculator utility" \
  --labels "test,math,independent" \
  --description "Create math functions in test-utils/calculator.ts

Functions:
- add(a, b): number
- subtract(a, b): number
- multiply(a, b): number
- divide(a, b): number (handle /0)
- power(base, exp): number

Write tests. No dependencies.

Acceptance: All work, /0 handled, tests pass." > /dev/null 2>&1

# Bead 4
bd create --title "Create logger with singleton" \
  --labels "test,escalation,requires-retry" \
  --description "Create Logger class in test-utils/logger.ts

Requirements:
- Singleton pattern
- Methods: log(), warn(), error(), debug()
- Timestamp: [YYYY-MM-DD HH:mm:ss]
- Levels: INFO, WARN, ERROR, DEBUG
- Filter by LOG_LEVEL env var

Write tests. May need retry to get pattern right.

Acceptance: Singleton correct, format exact, tests pass." > /dev/null 2>&1

# Bead 5
bd create --title "Create array utilities" \
  --labels "test,arrays,independent" \
  --description "Create array functions in test-utils/arrays.ts

Functions:
- unique<T>(arr): T[]
- chunk<T>(arr, size): T[][]
- shuffle<T>(arr): T[]
- flatten<T>(arr): T[]

Use generics. Write tests. No dependencies.

Acceptance: All work, types correct, tests pass." > /dev/null 2>&1

# Bead 6
bd create --title "Create integration module" \
  --labels "test,integration" \
  --description "Create test-utils/integration.ts

Dependencies: All previous beads (#001-#005)

Requirements:
- Import from all test-utils files
- Create Demo class
- Method: runFullDemo(): void
- Use logger throughout
- Use calc, strings, arrays
- Write integration tests

Acceptance: Imports work, demo runs, tests pass." > /dev/null 2>&1

echo "Test beads created!"
echo ""

bd ready
