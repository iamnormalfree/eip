# MockFactory Migration Guide

## Overview
This guide shows how to migrate existing Jest mock usage to the centralized MockFactory to resolve parameter mismatches and ensure type safety.

## Common Mock Parameter Issues Fixed

### 1. Job Mock Parameter Validation

**Before (Problematic):**
```typescript
// Inconsistent job creation across tests
const mockJob = {
  id: 'job-123',
  data: {
    // Missing required fields or wrong types
    type: undefined, // Should be string
    topic: null, // Should be string
    tier: 'INVALID', // Should be LIGHT|MEDIUM|HEAVY
  }
};
```

**After (Fixed):**
```typescript
import { mockFactory } from '../mocks/factory/mock-factory';
import type { MockJobParameters } from '../mocks/factory/mock-types';

const jobParams: MockJobParameters = {
  type: 'content-generation',
  topic: 'financial planning guide',
  tier: 'MEDIUM',
  persona: 'financial-advisor' // Optional parameter
};

const result = mockFactory.createJob(jobParams);
expect(result.success).toBe(true);
const mockJob = result.mock;
```

### 2. Budget Enforcer Mock Creation

**Before (Inconsistent):**
```typescript
// Different budgets used across tests
const mockBudgetEnforcer = {
  tier: 'MEDIUM',
  tokenLimit: 2400, // Inconsistent with actual MEDIUM tier
  timeLimit: 45000,
  // Missing methods
};
```

**After (Standardized):**
```typescript
const budgetParams: MockBudgetParameters = {
  tier: 'MEDIUM'
  // Optional: tokenLimit, timeLimit will use defaults
};

const result = mockFactory.createBudgetEnforcer(budgetParams);
const mockBudgetEnforcer = result.mock;
// All required methods automatically mocked with Jest
```

### 3. Circuit Breaker Mock Parameter Fixes

**Before (Manual Mock):**
```typescript
jest.mock('../../orchestrator/budget', () => ({
  BudgetCircuitBreaker: jest.fn(() => ({
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
    // Missing getState method
    getState: undefined // Parameter mismatch
  }))
}));
```

**After (Factory Created):**
```typescript
const circuitBreakerParams: MockCircuitBreakerParameters = {
  initialState: 'CLOSED',
  failureThreshold: 3
};

const result = mockFactory.createCircuitBreaker(circuitBreakerParams);
// All required methods properly mocked with correct signatures
```

### 4. Supabase Client Mock Standardization

**Before (Inconsistent Interface):**
```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnValue({
      data: [], // Missing error handling
      // Inconsistent with real Supabase client
    }))
  });
};
```

**After (Type-Safe Mock):**
```typescript
const supabaseParams: MockSupabaseParameters = {
  tableName: 'content_pieces',
  mockData: [{ id: '1', title: 'Test Content' }],
  shouldReturnError: false
};

const result = mockFactory.createSupabaseClient(supabaseParams);
// Full Supabase client interface mocked correctly
```

## Migration Steps for Existing Tests

### Step 1: Import MockFactory
```typescript
import { mockFactory } from '../mocks/factory/mock-factory';
import type { MockJobParameters, MockBudgetParameters } from '../mocks/factory/mock-types';
```

### Step 2: Replace Manual Mocks
Find and replace manual mock creation with factory calls:

**Find patterns like:**
```typescript
const mockJob = {
  id: 'job-123',
  data: { /* manual mock data */ }
};
```

**Replace with:**
```typescript
const jobParams: MockJobParameters = {
  type: 'content-generation',
  topic: 'your topic',
  tier: 'MEDIUM'
};
const { mock: mockJob } = mockFactory.createJob(jobParams);
```

### Step 3: Update Test Assertions
Ensure tests work with new mock structure:

```typescript
// Old assertion
expect(mockJob.id).toBeDefined();

// New assertion (still works)
expect(mockJob.id).toMatch(/^job-\d+-\w+$/);
```

### Step 4: Remove Manual jest.mock() Calls
Replace global jest.mock() calls with factory creation:

**Before:**
```typescript
jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({ /* manual mock */ }))
}));
```

**After:**
```typescript
// Remove global mock, create per-test with factory
const { mock: mockQueue } = mockFactory.createQueue(queueParams);
```

## Benefits of Migration

1. **Type Safety**: All mock parameters validated at compile time
2. **Consistency**: Standardized mock interfaces across all tests
3. **Maintainability**: Centralized mock configuration
4. **Error Prevention**: Automatic validation prevents parameter mismatches
5. **Documentation**: Clear interfaces show what parameters are required

## Common Issues Resolved

### Issue: Missing Required Parameters
**Fixed**: Automatic validation with clear error messages

### Issue: Inconsistent Mock Interfaces
**Fixed**: All mocks follow the same schema and interface contracts

### Issue: Parameter Type Mismatches
**Fixed**: TypeScript interfaces enforce correct types

### Issue: Missing Mock Methods
**Fixed**: Factory ensures all required methods are mocked

### Issue: Test Isolation Problems
**Fixed**: Automatic reset between tests prevents test pollution

## Quick Reference

| Mock Type | Parameter Interface | Factory Method |
|-----------|-------------------|----------------|
| Job | `MockJobParameters` | `mockFactory.createJob()` |
| Content | `MockContentParameters` | `mockFactory.createContent()` |
| Budget Enforcer | `MockBudgetParameters` | `mockFactory.createBudgetEnforcer()` |
| Circuit Breaker | `MockCircuitBreakerParameters` | `mockFactory.createCircuitBreaker()` |
| Supabase Client | `MockSupabaseParameters` | `mockFactory.createSupabaseClient()` |
| Queue | `MockQueueParameters` | `mockFactory.createQueue()` |

## Testing Your Migration

After migrating tests, run:
```bash
npm run test -- --testPathPattern=your-migrated-test
```

Verify that:
1. All mock creations succeed
2. Tests pass with new mocks
3. No parameter validation errors
4. Mock isolation works correctly
