// ABOUTME: Direct type declarations for Jest DOM matchers
// ABOUTME: Ensures TypeScript recognizes @testing-library/jest-dom matchers in all test files

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace jest {
    interface Matchers<R = void, T = any> extends TestingLibraryMatchers<T, R> {}
  }
}
