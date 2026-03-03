import '@testing-library/jest-dom';

describe('Jest DOM Setup Test', () => {
  it('should have DOM matchers working', () => {
    const div = document.createElement('div');
    div.className = 'test-class';
    document.body.appendChild(div);

    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('test-class');
  });
});