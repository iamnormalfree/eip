/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// ABOUTME: Simple Jest DOM verification test
// ABOUTME: Tests if Jest DOM matchers are properly configured

import { describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';

describe('Jest DOM Setup Test', () => {
  it('should have DOM matchers working', () => {
    const div = document.createElement('div');
    div.className = 'test-class';
    document.body.appendChild(div);

    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('test-class');
  });
});