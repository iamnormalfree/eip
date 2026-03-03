/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />
/// <reference path="../../types/jest.d.ts" />

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';

describe('Jest DOM Setup Test', () => {
  it('should have toBeInTheDocument matcher', () => {
    const { container } = render(<div>Test</div>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have toHaveClass matcher', () => {
    const { container } = render(<div className="test-class">Test</div>);
    expect(container.firstChild).toHaveClass('test-class');
  });
});
