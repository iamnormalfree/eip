/// <reference types="@testing-library/jest-dom" />
// This file should automatically extend the jest.Matchers interface

import '@testing-library/jest-dom';

// Test if the types are available
declare global {
  namespace jest {
    interface Matchers<R = any> {
      // This should extend the existing matchers
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
    }
  }
}
