// ABOUTME: Explicit @testing-library/jest-dom type imports for EIP
// ABOUTME: Ensures TypeScript picks up Jest DOM matcher types

/// <reference types="@testing-library/jest-dom" />

// Re-export the types to ensure they're loaded
import '@testing-library/jest-dom';

// Make sure the global jest.Matchers interface is extended
declare global {
  namespace jest {
    interface Matchers<R = any, T = any> {
      // These should already be available from @testing-library/jest-dom
      // but declaring them here ensures TypeScript recognizes them
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toBeEmpty(): R;
      toBeEmptyDOMElement(): R;
      toBeEnabled(): R;
      toBeHidden(): R;
      toBePartiallyChecked(checked?: boolean): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toBeInvalid(): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveDisplayValue(value: string | string[]): R;
      toHaveErrorMessage(message?: string | RegExp): R;
      toFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveHTML(html: string | RegExp): R;
      toHaveStyle(style: Record<string, string | number>): R;
      toHaveTextContent(text?: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveRole(role: string): R;
    }
  }
}

export {};
