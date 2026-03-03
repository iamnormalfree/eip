// ABOUTME: Global Jest DOM matcher type overrides for EIP testing
// ABOUTME: Completely overrides Jest Matchers to resolve interface conflicts

declare global {
  namespace jest {
    // Completely replace the Matchers interface to avoid conflicts
    interface Matchers<R = any, T = any> {
      // Jest built-in matchers (simplified)
      toBe(expected: any): R;
      toBeCalled(): R;
      toBeCalledTimes(expected: number): R;
      toBeCalledWith(...args: any[]): R;
      toBeDefined(): R;
      toBeFalsy(): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeInstanceOf(expected: any): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toBeNaN(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeUndefined(): R;
      toContain(expected: any): R;
      toContainEqual(expected: any): R;
      toEqual(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(expected: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveLength(expected: number): R;
      toHaveProperty(expected: string | string[], value?: any): R;
      toMatch(expected: string | RegExp): R;
      toMatchObject(expected: any): R;
      toStrictEqual(expected: any): R;
      toThrow(expected?: string | RegExp | Error): R;
      toThrowError(expected?: string | RegExp | Error): R;

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
      toBeInTheDocument(): R;
    }
  }
}

// Export for module registration
export {};
