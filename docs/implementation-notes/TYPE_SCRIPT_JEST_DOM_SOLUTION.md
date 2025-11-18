# TypeScript Interface Conflict Resolution for Jest DOM Matchers

## Root Cause Analysis

The 54 Jest DOM matcher errors are caused by fundamental interface conflicts between:
1. **@types/jest** (v30.0.0) - Defines `Matchers<R = void, T = any>` interface
2. **@testing-library/jest-dom** (v6.9.1) - Tries to extend Jest Matchers with `TestingLibraryMatchers<T, R>`
3. **ts-jest** (v29.4.5) - Type checking compilation that cannot reconcile the interface differences
4. **Next.js tsconfig** - Configuration conflicts with Jest's type resolution

## Key Issues Identified

1. **Module Resolution Conflicts**: Jest and Next.js use different module resolution strategies
2. **Interface Parameter Order**: 
   - Jest: `Matchers<R = void, T = any>` (Return type first)
   - Testing Library: `TestingLibraryMatchers<T, R>` (Target type first)
3. **Type Loading Order**: Setup files not loading type declarations in correct sequence
4. **Global Scope Conflicts**: Multiple type declarations creating conflicting global augmentations

## Comprehensive Solution Implemented

### 1. Type Declaration Files Created

**`/types/jest.d.ts`** - Global Jest matcher declarations with proper interface extension:

```typescript
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R = void, T = any> {
      // All @testing-library/jest-dom matchers explicitly declared
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toBeInTheDocument(): R;
      // ... (complete matcher list)
    }
  }
}
```

**`/tests/setup/jest.extensions.d.ts`** - Explicit type extensions for testing infrastructure

### 2. TypeScript Configuration Updates

**`tsconfig.json`** - Updated to include global type declarations:
- Added `types/jest.d.ts` to include array
- Set `moduleDetection: "force"` for better module resolution
- Updated target to `es2018` for better compatibility

**`tsconfig.spec.json`** - Test-specific configuration:
- Explicit `types: ["jest", "@testing-library/jest-dom", "node"]`
- CommonJS module resolution for Jest compatibility
- Includes all setup and type declaration files

### 3. Jest Configuration Optimization

**`jest.config.js`** - Simplified and streamlined:
- Uses dedicated `tsconfig.spec.json` for test compilation
- Removed inline TypeScript configuration (was causing TS5023 errors)
- Proper setup file ordering: polyfills → jest.setup → jest.setup.ts
- Cache disabled temporarily to force type reload

### 4. Setup File Improvements

**`tests/setup/jest.setup.ts`** - Clean setup sequence:
```typescript
import '@jest/globals';
import './jest.extensions.d.ts';  // Type extensions first
import '@testing-library/jest-dom';  // Library imports
import './mock-factory.setup';  // Mock factory
```

### 5. Test File Updates

**Test files** - Added triple-slash directives for explicit type loading:
```typescript
/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />
```

## Current Status and Next Steps

### Issues Resolved
- ✅ TypeScript version conflicts (standardized on 5.9.3)
- ✅ ts-jest configuration errors (removed problematic inline config)
- ✅ Setup file loading order conflicts
- ✅ Global type declaration structure

### Remaining Challenge
Despite comprehensive fixes, the core interface conflict persists. This appears to be a fundamental compatibility issue between the current versions of:
- @types/jest@30.0.0
- @testing-library/jest-dom@6.9.1  
- ts-jest@29.4.5

### Recommended Next Steps

1. **Version Alignment**: Consider downgrading to known compatible versions:
   ```bash
   npm install --save-dev @testing-library/jest-dom@5.16.5
   ```

2. **Alternative Type Resolution**: Use explicit type assertions in tests:
   ```typescript
   import { expect } from '@jest/globals';
   import * as matchers from '@testing-library/jest-dom/matchers';
   expect.extend(matchers);
   
   // Use type assertions for problematic matchers
   (expect(screen.getByTestId('element')) as any).toHaveTextContent('text');
   ```

3. **Migration to Vitest**: Consider migrating from Jest to Vitest for better TypeScript integration

4. **Wait for Package Updates**: Monitor for newer versions that resolve these compatibility issues

## Working Temporary Solution

For immediate development needs, the following approach can be used:

```typescript
// In test files
import { expect } from '@jest/globals';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Use type assertions where TypeScript cannot infer
const element = screen.getByTestId('content-title');
expect(element).toBeDefined();
expect(element.innerHTML).toContain('Strategic Financial Planning Framework');
// OR
expect((element as any)).toHaveTextContent('Strategic Financial Planning Framework');
```

This provides a working development environment while maintaining test functionality.
