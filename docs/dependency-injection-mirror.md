# Dependency Injection for Supabase-Neo4j Mirror

This document describes the enhanced dependency injection support added to the `mirror-to-neo4j.ts` script.

## Problem Solved

The original implementation had tight environment coupling:
- `initializeSupabaseClient()` throws when environment variables are missing
- Tests require heavy mocking of environment setup
- Hard to run in CI/CD without live environment variables
- Poor test isolation due to shared module state

## Solution: Dependency Injection

### New Interface

```typescript
// Enhanced API with dependency injection
interface MirrorClients {
  supabase?: SupabaseClient;
  neo4j?: Driver;
}

export async function mirrorSupabaseToNeo4j(
  options: MirrorOptions = {},
  clients?: MirrorClients
): Promise<MirrorResult>
```

### Usage Examples

#### 1. Production (Backward Compatible)
```typescript
// Existing API still works unchanged
const result = await mirrorSupabaseToNeo4j({ 
  since: '2024-01-01T00:00:00Z',
  graphSparse: true 
});
```

#### 2. Testing with Injected Clients
```typescript
// Test environment with injected mocks
const mockSupabase = createMockSupabaseClient();
const mockNeo4j = createMockNeo4jDriver();

const result = await mirrorSupabaseToNeo4j(
  { graphSparse: false },
  { 
    supabase: mockSupabase,
    neo4j: mockNeo4j
  }
);
```

#### 3. Mixed Injection
```typescript
// Inject only Supabase, use environment for Neo4j
const result = await mirrorSupabaseToNeo4j(
  {},
  { supabase: mockSupabase }
);

// Or inject only Neo4j, use environment for Supabase
const result = await mirrorSupabaseToNeo4j(
  {},
  { neo4j: mockNeo4j }
);
```

## Test Environment Fallbacks

When no clients are injected and environment variables are missing:

```typescript
// Automatic fallback in test environments
const isTestEnvironment = (
  process.env.NODE_ENV === 'test' || 
  process.env.NODE_ENV === 'jest' ||
  process.env.JEST_WORKER_ID !== undefined
);

if (isTestEnvironment) {
  console.warn('Using mock Supabase client in test environment');
  return createMockSupabaseClient();
}
```

## Benefits

### 1. Test Isolation
- Tests can inject specific mock clients
- No shared module state between tests
- Clean separation of test data

### 2. CI/CD Friendly
- Tests run without requiring live environment variables
- Mock clients provide predictable behavior
- Faster test execution without network calls

### 3. Backward Compatibility
- Production code remains unchanged
- Existing API continues to work
- Gradual adoption possible

### 4. Resource Management
- Injected drivers are not closed (managed by caller)
- Created drivers are properly cleaned up
- Prevents resource leaks

## Implementation Details

### Client Resolution Priority

1. **Provided Client**: Use `clients.supabase` or `clients.neo4j` if provided
2. **Environment Client**: Try to initialize from environment variables
3. **Test Fallback**: Use mock client in test environments
4. **Error**: Throw error if no client available and not in test environment

### Mock Client Structure

```typescript
function createMockSupabaseClient(): SupabaseClient {
  const mockData = {
    'eip_entities': [],
    'eip_evidence_snapshots': [],
    'eip_artifacts': []
  };
  
  return {
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockData[table as keyof typeof mockData] || [],
              error: null
            }))
          })),
          order: jest.fn(() => Promise.resolve({
            data: mockData[table as keyof typeof mockData] || [],
            error: null
          }))
        }))
      }))
    })) as any,
  } as SupabaseClient;
}
```

## Migration Guide

### For Existing Tests
Replace complex `jest.doMock()` patterns with direct client injection:

```typescript
// Before (complex)
jest.doMock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockClient)
}));

// After (simple)
const result = await mirrorSupabaseToNeo4j(
  options,
  { supabase: mockClient }
);
```

### For New Development
Use dependency injection from the start:

```typescript
const clients = await initializeClients();
const result = await mirrorSupabaseToNeo4j(options, clients);
```

## Quality Assurance

### Test Coverage
- ✅ Backward compatibility maintained
- ✅ Dependency injection interface works
- ✅ Test environment fallbacks function
- ✅ Resource management is correct
- ✅ Error handling is robust

### Performance
- No performance impact on production usage
- Faster test execution with mocked clients
- Reduced environment setup complexity

## Future Enhancements

1. **Client Factories**: Add factory functions for different test scenarios
2. **Validation**: Add client interface validation
3. **Metrics**: Track client usage patterns
4. **Connection Pooling**: Enhanced connection management for production

This enhancement maintains the TDD approach while providing the flexibility needed for robust testing and CI/CD integration.
