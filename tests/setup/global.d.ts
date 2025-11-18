// ABOUTME: Global type declarations for Jest DOM matchers in EIP tests
// ABOUTME: Provides type support for @testing-library/jest-dom matchers

// Import the testing library matchers
import '@testing-library/jest-dom';

// Re-export the matchers to make them available globally
declare global {
  namespace jest {
    interface Matchers<R = void, T = any> {
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeVisible(): R;
      toBeHidden(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveStyle(style: Record<string, string | number>): R;
      toHaveValue(value: string | string[] | number): R;
      toBeChecked(): R;
      toBeEmptyDOMElement(): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveDisplayValue(value: string | string[]): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveDescription(text: string | RegExp): R;
      toHaveRole(role: string): R;
      toHaveAccessibleDescription(text: string | RegExp): R;
      toHaveAccessibleName(text: string | RegExp): R;
      toBePartiallyChecked(checked?: boolean): R;
      toHaveErrorMessage(text: string | RegExp): R;
      toBeEmpty(): R;
    }
  }
}

// Export to make this a module
export {};
