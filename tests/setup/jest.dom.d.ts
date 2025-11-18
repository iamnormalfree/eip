// ABOUTME: Global Jest DOM matchers type declarations for EIP test infrastructure
// ABOUTME: Properly extends Jest Matchers with @testing-library/jest-dom types

// Import testing-library matchers types to extend Jest Matchers
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Extend Jest Matchers interface with TestingLibraryMatchers
declare global {
  namespace jest {
    interface Matchers<R = void, T = any> extends TestingLibraryMatchers<T, R> {}
  }
}

// Export to ensure module is treated as a module
export {};
