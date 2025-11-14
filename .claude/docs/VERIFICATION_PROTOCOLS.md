# Verification Protocols - Preventing False Completion Patterns

## Purpose
Ensure work is actually complete and tested before marking it as done. This guide addresses the critical issues discovered during response-awareness framework testing.

## Core Principle: Trust but Verify

### ❌ WRONG: Assume completion based on agent reports
```javascript
// Agent reports success without verification
console.log("Task 3: Complete - all tests passing");

// Reality: 13 out of 14 tests failing due to timeouts
```

### ✅ RIGHT: Always verify critical work
```javascript
// Actually verify the work
const testResult = await npm.test('-- tests/maf/beads-flow.test.ts');
console.log(`Test result: ${testResult}`);
```

## Verification Checklist

### Before Marking Any Task Complete:

1. **Tests Actually Run** ✅
   ```bash
   # Verify with actual commands
   npm test -- tests/affected.test.ts
   pytest tests/
   npm run build
   ```

2. **Build Succeeds** ✅
   ```bash
   # Don't assume - actually run it
   npm run build && echo "✅ Build successful" || echo "❌ Build failed"
   ```

3. **Functionality Works** ✅
   ```bash
   # Test the actual feature
   node dist/index.js --test
   ```

4. **No Timeouts** ✅
   ```bash
   # Check for timeout issues (especially with slow operations)
   timeout 120s npm test  # Increase timeouts for slow ops
   ```

## Response-Awareness Framework Verification

### LIGHT Tier (0-1 complexity)
**Verification**: Quick check
- Test basic functionality
- Ensure no syntax errors
- Verify request is fulfilled exactly

### MEDIUM Tier (2-4 complexity)
**Verification**: Standard testing
- Run affected test suite
- Cross-module integration checks
- Verify all deliverables work

### HEAVY Tier (5-7 complexity)
**Verification**: Comprehensive testing
- Full test suite execution
- Performance and load testing
- Cross-domain integration verification
- Manual verification of critical paths

### FULL Tier (8+ complexity)
**Verification**: Maximum rigor
- Complete test matrix
- Integration testing across all domains
- Performance benchmarks
- Documentation completeness
- Rollback plan verification

## False Completion Detection

The hooks now detect these patterns:

### #FALSE_TEST_RESULTS Patterns
- "all tests are passing" (without running `npm test`)
- "tests passed" (without actual test execution)
- "build successful" (without running `npm run build`)
- "verification complete" (without verification steps)

### #FALSE_COMPLETION Patterns
- "Task 3: Complete" (without verification)
- "Marking as complete" (without checking deliverables)
- "All requirements met" (without validation)
- "Ready for review" (without quality checks)

## Consistency Verification

### CLI Flag Consistency
```javascript
// ❌ PROBLEM: Mixed CLI flags found
temp-repo.ts: args.push('--constraint', options.constraint);
cli.ts:        args.push('--label', options.constraint);

// ✅ FIXED: Consistent usage
// Both files use: args.push('--label', options.constraint);
```

### Cross-File Consistency Checklist:
1. **API calls use same parameters**
2. **CLI flags are consistent across files**
3. **Variable names match in calling code**
4. **Error handling follows same patterns**
5. **Configuration schemas align**

## Test Timeout Management

### Common Timeout Issues:
1. **Database operations** taking longer than expected
2. **File I/O** on large files
3. **Network calls** to external services
4. **Build processes** with complex dependencies

### Timeout Solutions:
```javascript
// For slow beads operations
const timeout = 120000; // 2 minutes instead of 30s
const result = await Promise.race([
  beadsCommand(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeout)
  )
]);
```

### Recommended Timeouts:
- **Unit tests**: 30s
- **Integration tests**: 60s
- **Database operations**: 45s
- **Build processes**: 120s
- **Network calls**: 30s

## Implementation Verification Protocol

### Phase 1: Development Verification
```javascript
// During implementation - continuous checking
1. Code compiles: npm run build
2. Linter passes: npm run lint
3. Unit tests pass: npm test -- unit
```

### Phase 2: Integration Verification
```javascript
// After implementation - comprehensive testing
1. Integration tests: npm test -- integration
2. Cross-module tests: npm test -- affected
3. Performance tests: npm run test:performance
```

### Phase 3: Acceptance Verification
```javascript
// Before marking complete - final validation
1. Full test suite: npm test
2. Build verification: npm run build
3. Manual testing: [Manual steps]
4. Documentation review: npm run docs:check
```

## Metacognitive Tag Verification

### When Hooks Detect False Completion:

#### Orchestrator Mode (BLOCK)
- Stop immediately
- Run actual verification
- Fix discovered issues
- Re-verify before proceeding

#### Agent Mode (WARN)
- Tag with #FALSE_COMPLETION
- Continue with status report
- Include verification requirements
- Let orchestrator handle verification

## Real-World Examples

### Example 1: Test Claim Without Execution
```javascript
// ❌ WRONG: Agent reports without testing
"All tests are passing for the beads integration"

// ✅ RIGHT: Actually test and report reality
await exec('npm test -- tests/maf/beads-flow.test.ts');
// Result: 13/14 tests failing - timeout issues detected
```

### Example 2: CLI Flag Inconsistency
```javascript
// ❌ PROBLEM: Inconsistent CLI usage detected
// temp-repo.ts uses --constraint
// cli.ts uses --label

// ✅ FIXED: Consistent CLI usage
// Both files now use --label consistently
```

### Example 3: Completion Without Verification
```javascript
// ❌ WRONG: Mark complete without verification
"Task 3: Complete - Beads integration working"

// ✅ RIGHT: Verify before completion
const result = await testBeadsIntegration();
if (result.success) {
  console.log("Task 3: Complete - All tests verified");
} else {
  console.log(`Task 3: Issues found - ${result.issues.join(', ')}`);
}
```

## Verification Automation

### Add to Your Workflow:
```bash
#!/bin/bash
# verify-work.sh - Comprehensive verification script

echo "🔍 Verifying work..."

# Step 1: Build verification
echo "Building..."
npm run build || exit 1

# Step 2: Test verification
echo "Running tests..."
npm test || exit 1

# Step 3: Lint verification
echo "Linting..."
npm run lint || exit 1

# Step 4: Consistency verification
echo "Checking consistency..."
node scripts/check-consistency.js || exit 1

echo "✅ All verifications passed"
```

### Pre-commit Integration:
```json
// package.json
{
  "scripts": {
    "verify": "./scripts/verify-work.sh",
    "commit-verify": "npm run verify && git add ."
  }
}
```

## Monitoring and Metrics

### Track Verification Success:
- **Test pass rate**: Monitor test results over time
- **Build success rate**: Track build failures
- **False completion rate**: Measure how often false claims are caught
- **Timeout frequency**: Monitor timeout issues

### Quality Gates:
- **90%+ test pass rate** before marking complete
- **Build must succeed** before merging
- **No false completion tags** in final deliverables
- **All consistency checks pass**

---

## Quick Reference

### Before Marking Complete:
1. ✅ Run `npm test` (actually run it)
2. ✅ Run `npm run build` (verify it builds)
3. ✅ Test functionality (don't assume)
4. ✅ Check for timeouts (increase if needed)
5. ✅ Verify consistency (cross-file checks)

### If Hooks Block You:
- **Orchestrator**: Stop and verify immediately
- **Agent**: Tag and report verification status
- **Always**: Trust the hook - it's protecting you from false completion

### Remember:
- **Assumptions are the enemy** - Verify everything
- **False completion destroys trust** - Report reality
- **Consistency prevents bugs** - Check cross-file alignment
- **Timeouts happen** - Plan and test accordingly

---

**Version**: 1.0
**Created**: 2025-11-11
**Purpose**: Prevent false completion patterns in response-awareness framework