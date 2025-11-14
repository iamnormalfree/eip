# Testing Skills Suite - Complete Guide

**Date:** 2025-11-04
**Status:** ✅ All 3 testing skills installed and operational
**Purpose:** Comprehensive testing coverage from anti-patterns to E2E

---

## Overview

Your NextNest project now has **3 specialized testing skills** that work together to enforce TDD and testing best practices:

| Skill | Focus | When It Activates |
|-------|-------|-------------------|
| **testing-anti-patterns** | Prevent mock-heavy tests | "test", "mock", "adding mocks" |
| **javascript-testing-patterns** | Jest/Vitest/Testing Library | "jest", "unit test", "vitest" |
| **e2e-testing-patterns** | Playwright/Cypress E2E | "e2e", "playwright", "cypress" |

---

## Skill 1: testing-anti-patterns

**Source:** obra/superpowers (5.4k stars)
**Size:** 8.7KB
**Status:** ✅ Validated working

### What It Prevents

1. **Testing Mock Behavior**
   ```typescript
   // ❌ BAD - Testing mock existence
   expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();

   // ✅ GOOD - Testing real behavior
   expect(screen.getByRole('navigation')).toBeInTheDocument();
   ```

2. **Test-Only Methods in Production**
   ```typescript
   // ❌ BAD - destroy() only used in tests
   class Session {
     async destroy() { /* cleanup */ }
   }

   // ✅ GOOD - Test utilities handle cleanup
   export async function cleanupSession(session: Session) {
     // cleanup logic in test utilities
   }
   ```

3. **Mocking Without Understanding**
   - Prevents blind mocking that breaks test logic
   - Ensures you understand dependencies before mocking
   - Enforces minimal mocking at correct level

4. **Incomplete Mocks**
   - Forces complete mock structures matching real APIs
   - Prevents partial mocks that hide dependencies

5. **Tests as Afterthought**
   - Enforces TDD cycle (test first, watch fail, implement)

### Integration with CLAUDE.md

Automatically enforces these existing rules:
- "Never write tests that only test mocked behavior"
- "Never delete failing tests"
- "Never use mocks in end-to-end tests"

### Activation Examples

```
"I'm adding mocks to this test"
→ Skill reviews for anti-patterns

"Should I add a destroy() method for tests?"
→ Skill suggests test utilities instead

"Review this test file"
→ Skill checks all 5 anti-patterns
```

---

## Skill 2: javascript-testing-patterns

**Source:** wshobson/agents (19.5k stars)
**Size:** 27KB
**Status:** ✅ Installed and registered

### What It Covers

#### Testing Frameworks

1. **Jest - Full-Featured Framework**
   - Complete setup configuration
   - Coverage thresholds (80% default)
   - Setup files and environments
   - TypeScript integration

2. **Vitest - Fast, Vite-Native**
   - Vite configuration
   - V8 coverage provider
   - Global test environment
   - Fast execution

3. **Testing Library**
   - React Testing Library patterns
   - User-centric queries
   - Accessibility testing
   - Component testing best practices

#### Testing Patterns

1. **Unit Testing**
   - Pure functions
   - Classes and methods
   - Async operations
   - Error handling

2. **Integration Testing**
   - API endpoints
   - Database operations
   - Service interactions
   - Multi-component workflows

3. **Component Testing**
   - React component rendering
   - User interactions
   - State management
   - Props and events

4. **Mocking Strategies**
   - Module mocking
   - Function mocking
   - Spy functions
   - Partial mocks
   - API mocking

5. **Fixtures and Test Data**
   - Factory patterns
   - Test data builders
   - Shared fixtures
   - Database seeding

6. **TDD/BDD Workflows**
   - Red-Green-Refactor cycle
   - Describe/It/Expect patterns
   - Before/After hooks
   - Test organization

#### CI/CD Integration

- Pipeline configuration
- Parallel test execution
- Coverage reporting
- Failure analysis

### Activation Examples

```
"Set up Jest for this TypeScript project"
→ Provides complete Jest config

"How do I test this async function?"
→ Shows async testing patterns

"Write unit tests for this calculator class"
→ Guides through TDD cycle

"Mock this external API"
→ Shows proper mocking strategies
```

---

## Skill 3: e2e-testing-patterns

**Source:** wshobson/agents (19.5k stars)
**Size:** 15.7KB
**Status:** ✅ Installed and registered

### What It Covers

#### Testing Philosophy

**The Testing Pyramid:**
```
        /\
       /E2E\         ← Few, critical paths
      /─────\
     /Integr\        ← More, interactions
    /────────\
   /Unit Tests\      ← Many, fast
  /────────────\
```

**Best Practices:**
- Test user behavior, not implementation
- Keep tests independent
- Make tests deterministic
- Optimize for speed
- Use semantic selectors

#### Playwright Patterns

1. **Configuration**
   - Multi-browser testing
   - Parallel execution
   - Retry strategies
   - Reporter configuration
   - CI/CD optimization

2. **Page Object Model**
   - Encapsulate page logic
   - Reusable components
   - Maintainable selectors
   - Type-safe interactions

3. **Test Patterns**
   - Authentication flows
   - Form submissions
   - Navigation testing
   - File uploads
   - API mocking/interception

4. **Debugging**
   - Visual debugging
   - Trace viewer
   - Screenshots on failure
   - Video recording
   - Network inspection

#### Cypress Patterns

1. **Setup and Configuration**
   - Plugin configuration
   - Custom commands
   - Environment variables
   - Base URL configuration

2. **Common Patterns**
   - Login automation
   - Data seeding
   - Intercepting requests
   - Custom assertions

3. **Anti-Patterns to Avoid**
   - Testing external sites
   - Conditional testing
   - Element existence checks
   - Waiting for arbitrary times

#### Advanced Topics

1. **Flaky Test Prevention**
   - Proper waits
   - Deterministic data
   - Independent tests
   - Cleanup strategies

2. **Performance Optimization**
   - Parallel execution
   - Selective testing
   - Fixture reuse
   - Smart retries

3. **Accessibility Testing**
   - ARIA roles
   - Keyboard navigation
   - Screen reader compatibility
   - WCAG compliance

4. **Visual Regression**
   - Screenshot comparison
   - Visual diffs
   - Responsive testing
   - Cross-browser consistency

### Activation Examples

```
"Set up Playwright for E2E testing"
→ Provides complete config

"This test is flaky, help me debug it"
→ Analyzes flaky test patterns

"Test the login flow"
→ Shows authentication testing patterns

"How do I test file uploads?"
→ Provides file upload patterns
```

---

## How the Three Skills Work Together

### Testing Workflow Integration

1. **Planning Phase** (Before Writing Tests)
   - `testing-anti-patterns`: Prevents common mistakes
   - `javascript-testing-patterns`: Chooses right framework
   - `e2e-testing-patterns`: Identifies critical paths

2. **Implementation Phase** (Writing Tests)
   - `testing-anti-patterns`: Reviews test quality
   - `javascript-testing-patterns`: Provides patterns
   - `e2e-testing-patterns`: Guides E2E setup

3. **Debugging Phase** (When Tests Fail)
   - `testing-anti-patterns`: Checks for anti-patterns
   - `javascript-testing-patterns`: Debug unit/integration
   - `e2e-testing-patterns`: Fix flaky E2E tests

### Example: Complete Testing Strategy

**User Story:** "Add authentication to the app"

**Step 1: Plan Tests (testing-anti-patterns)**
- Don't mock authentication logic
- Test real auth flow
- Avoid test-only methods

**Step 2: Unit Tests (javascript-testing-patterns)**
```typescript
// Test auth service
describe('AuthService', () => {
  it('validates credentials', async () => {
    const service = new AuthService();
    const result = await service.login('user', 'pass');
    expect(result).toBeDefined();
  });
});
```

**Step 3: E2E Tests (e2e-testing-patterns)**
```typescript
// Test complete login flow
test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## NextNest-Specific Integration

### CLAUDE.md Compliance

All three skills enforce your existing rules:
- ✅ TDD mandatory
- ✅ Never test mock behavior
- ✅ Tests first, implementation second
- ✅ No test-only production methods

### Tech Stack Alignment

**Next.js 14 + TypeScript:**
- `javascript-testing-patterns`: Jest/Vitest configs for TS
- `e2e-testing-patterns`: Playwright for Next.js apps

**Supabase Integration:**
- `javascript-testing-patterns`: Mock Supabase client
- `e2e-testing-patterns`: Test auth flows

**Shadcn/UI Components:**
- `javascript-testing-patterns`: Testing Library for components
- `e2e-testing-patterns`: Accessibility testing

### Existing Playwright MCP

You already have Playwright MCP server installed!

**Synergy:**
- MCP provides browser automation tools
- `e2e-testing-patterns` provides testing strategies
- Combined: Automated test creation AND execution

---

## Configuration Status

### Registered Skills

```json
"custom_skills": [
  "brainstorming",
  "systematic-debugging",
  "worktree-workflow",
  "testing-anti-patterns",      ← NEW
  "javascript-testing-patterns", ← NEW
  "e2e-testing-patterns"        ← NEW
]
```

### Installation Validation

```
✓ testing-anti-patterns: OK
✓ javascript-testing-patterns: OK
✓ e2e-testing-patterns: OK
```

---

## Usage Patterns

### Quick Activation

**Anti-Patterns Check:**
```
Review this test for anti-patterns
```

**Setup Framework:**
```
Set up Jest for TypeScript testing
```

**E2E Configuration:**
```
Configure Playwright for Next.js
```

### Explicit Invocation

```
Use the testing-anti-patterns skill to review @tests/auth.test.ts

Use the javascript-testing-patterns skill to set up Vitest

Use the e2e-testing-patterns skill to debug this flaky test
```

---

## Testing Coverage Map

| Test Type | Framework | Skill | Purpose |
|-----------|-----------|-------|---------|
| **Unit** | Jest/Vitest | javascript-testing-patterns | Pure functions, utils |
| **Integration** | Jest/Vitest | javascript-testing-patterns | API, services |
| **Component** | Testing Library | javascript-testing-patterns | React components |
| **E2E** | Playwright | e2e-testing-patterns | User flows |
| **Quality** | All | testing-anti-patterns | Prevent bad patterns |

---

## Next Steps

### 1. Test Existing Codebase

```
Review all tests in tests/ directory for anti-patterns
```

### 2. Set Up Missing Test Infrastructure

```
Set up Jest configuration for NextNest TypeScript project
```

### 3. Create E2E Test Suite

```
Configure Playwright for testing the AI broker chat flow
```

### 4. Enable Auto-Discovery (Optional)

```bash
./scripts/enable-skill-auto-discovery.sh
```

This removes the need to manually register future skills.

---

## Troubleshooting

### Skills Not Activating

**Check registration:**
```bash
grep -A 8 "custom_skills" .claude/config/response-awareness-config.json
```

**Expected output:**
```json
"custom_skills": [
  "testing-anti-patterns",
  "javascript-testing-patterns",
  "e2e-testing-patterns"
]
```

### Explicit Invocation

If auto-activation doesn't work, use explicit:
```
Use the [skill-name] skill to [task]
```

### Restart Required

After installing skills mid-session:
- Restart Claude Code, OR
- Use explicit invocation

---

## Summary

✅ **3 Testing Skills Installed**
✅ **Registered in Config**
✅ **Validated Working**
✅ **Aligned with CLAUDE.md**
✅ **Integrated with Tech Stack**

**Coverage:**
- 🛡️ Anti-patterns prevention
- 🧪 Unit & integration testing
- 🎭 E2E testing
- 📊 Complete testing pyramid

**Your testing workflow is now fully supported by specialized skills!**

---

**Last Updated:** 2025-11-04
**Total Testing Skills:** 3
**Total Active Skills:** 10
**Status:** Production Ready
