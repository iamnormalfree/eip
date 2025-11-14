// ABOUTME: Conditional Jest imports for dual-execution compatibility  
// ABOUTME: Enables scripts to run under both Jest and tsx CLI environments

// Detect if we're running in Jest environment
const isJestEnvironment = typeof jest !== 'undefined' || 
  process.env.NODE_ENV === 'test' || 
  process.env.JEST_WORKER_ID !== undefined;

// Conditional Jest imports that work in both environments
export const JestImports = {
  // Only import Jest globals if we're in Jest environment
  getDescribe: () => {
    if (isJestEnvironment) {
      try {
        const { describe } = require('@jest/globals');
        return describe;
      } catch {
        // Fallback for Jest environments without globals
        return global.describe;
      }
    }
    return null;
  },
  
  getIt: () => {
    if (isJestEnvironment) {
      try {
        const { it } = require('@jest/globals');
        return it;
      } catch {
        return global.it;
      }
    }
    return null;
  },
  
  getExpect: () => {
    if (isJestEnvironment) {
      try {
        const { expect } = require('@jest/globals');
        return expect;
      } catch {
        return global.expect;
      }
    }
    return null;
  },
  
  getBeforeEach: () => {
    if (isJestEnvironment) {
      try {
        const { beforeEach } = require('@jest/globals');
        return beforeEach;
      } catch {
        return global.beforeEach;
      }
    }
    return null;
  },
  
  getAfterEach: () => {
    if (isJestEnvironment) {
      try {
        const { afterEach } = require('@jest/globals');
        return afterEach;
      } catch {
        return global.afterEach;
      }
    }
    return null;
  }
};

// Export environment detection
export { isJestEnvironment };

// Helper to conditionally define Jest test suites
export const conditionalDescribe = (name: string, fn: () => void) => {
  const describe = JestImports.getDescribe();
  if (describe) {
    describe(name, fn);
  }
};

// Helper to conditionally define test cases
export const conditionalIt = (name: string, fn: () => Promise<void>) => {
  const it = JestImports.getIt();
  if (it) {
    it(name, fn);
  }
};

// Helper for conditional expectations (only used in test code paths)
export const conditionalExpect = (actual: any) => {
  const expect = JestImports.getExpect();
  if (expect) {
    return expect(actual);
  }
  // Return a no-op expectation function for non-Jest environments
  return {
    toBeDefined: () => {},
    toBe: () => {},
    toHaveBeenCalled: () => {},
    toHaveBeenCalledWith: () => {},
    toThrow: () => {},
    toContain: () => {},
    toBeGreaterThan: () => {},
    toBeLessThan: () => {},
    toHaveLength: () => {},
    toHaveProperty: () => {}
  };
};
