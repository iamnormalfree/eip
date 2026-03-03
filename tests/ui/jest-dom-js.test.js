/**
 * Test Jest DOM matchers with JavaScript to rule out TypeScript issues
 */

require('@testing-library/jest-dom/jest-globals');
const { render } = require('@testing-library/react');

describe('Jest DOM JavaScript Test', () => {
  test('should have toBeInTheDocument matcher', () => {
    const React = require('react');
    const { container } = render(React.createElement('div', null, 'Test'));
    expect(container.firstChild).toBeInTheDocument();
  });

  test('should have toHaveClass matcher', () => {
    const React = require('react');
    const { container } = render(React.createElement('div', {className: 'test-class'}, 'Test'));
    expect(container.firstChild).toHaveClass('test-class');
  });
});
