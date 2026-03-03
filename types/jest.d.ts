// ABOUTME: Global Jest DOM matcher type extensions for EIP testing
// ABOUTME: Ensures TypeScript recognizes @testing-library/jest-dom matchers

/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// Extend the existing jest.Matchers interface with all @testing-library/jest-dom matchers
declare global {
  namespace jest {
    interface Matchers<R = any, T = any> {
      // @testing-library/jest-dom matchers
      toBeDisabled(): R;
      toBeEmpty(): R;
      toBeEmptyDOMElement(): R;
      toBeEnabled(): R;
      toBeInTheDocument(): R;
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
