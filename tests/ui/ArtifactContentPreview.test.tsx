/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// ABOUTME: ArtifactContentPreview Component Tests
// ABOUTME: Tests MDX rendering, frontmatter parsing, syntax highlighting, and error handling

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { ArtifactContentPreview } from '../../src/components/review/ArtifactContentPreview';

// Mock react-syntax-highlighter to avoid prism dependencies in tests
jest.mock('react-syntax-highlighter', () => ({
  Prism: () => null,
  oneDark: {},
}));

jest.mock('@mdx-js/react', () => ({
  MDXProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ArtifactContentPreview', () => {
  const mockMdxWithFrontmatter = `---
title: "Test Document"
persona: "financial-advisor"
funnel: "awareness"
---

# Test Document Title

This is a test paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
function example() {
  return "Hello, world!";
}
\`\`\`

### List Example

- Item 1
- Item 2
- Item 3

1. Numbered item 1
2. Numbered item 2

> This is a blockquote example

[Link example](https://example.com)
`;

  const mockMdxWithoutFrontmatter = `
# Simple Document

No frontmatter here, just content.

\`\`\`python
def hello():
    print("Hello from Python")
\`\`\`
`;

  const mockMdxMalformed = `---
title: "Incomplete frontmatter
# Content after malformed frontmatter

This should still render gracefully.
`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render MDX content properly', () => {
      render(<ArtifactContentPreview mdxContent={mockMdxWithFrontmatter} />);

      expect(screen.getByText('Test Document Title')).toBeInTheDocument();
      expect(screen.getByText('This is a test paragraph with')).toBeInTheDocument();
    });

    it('should show no content message when mdxContent is empty', () => {
      render(<ArtifactContentPreview mdxContent="" />);

       expect(screen.getByText('No content available for preview')).toBeInTheDocument();
    });

    it('should handle null mdxContent gracefully', () => {
      render(<ArtifactContentPreview mdxContent={null as any} />);

       expect(screen.getByText('No content available for preview')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ArtifactContentPreview
          mdxContent="# Simple Content"
          className="custom-test-class"
        />
      );

       expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Frontmatter Parsing', () => {
    it('should parse and display frontmatter correctly', () => {
      render(<ArtifactContentPreview mdxContent={mockMdxWithFrontmatter} />);

       expect(screen.getByText('Document Properties')).toBeInTheDocument();
       expect(screen.getByText('Title:')).toBeInTheDocument();
       expect(screen.getByText('Test Document')).toBeInTheDocument();
       expect(screen.getByText('Persona:')).toBeInTheDocument();
       expect(screen.getByText('financial-advisor')).toBeInTheDocument();
       expect(screen.getByText('Funnel:')).toBeInTheDocument();
       expect(screen.getByText('awareness')).toBeInTheDocument();
    });

    it('should handle content without frontmatter', () => {
      render(<ArtifactContentPreview mdxContent={mockMdxWithoutFrontmatter} />);

      expect(screen.queryByText('Document Properties')).not.toBeInTheDocument();
       expect(screen.getByText('Simple Document')).toBeInTheDocument();
    });

    it('should handle malformed frontmatter gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<ArtifactContentPreview mdxContent={mockMdxMalformed} />);

      // Should still render content even with malformed frontmatter
       expect(screen.getByText('Content after malformed frontmatter')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should parse frontmatter values with quotes correctly', () => {
      const mdxWithQuotedValues = `---
title: "Document with 'quotes'"
description: 'A "test" document'
number_value: 42
---

# Content
`;

      render(<ArtifactContentPreview mdxContent={mdxWithQuotedValues} />);

       expect(screen.getByText('Document with \'quotes\'')).toBeInTheDocument();
       expect(screen.getByText('A "test" document')).toBeInTheDocument();
       expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Content Expansion', () => {
    const longContent = `
# Long Content Test

${'This is a long paragraph. '.repeat(100)}

## More Content

${'Additional content to make it long. '.repeat(50)}
`;

    it('should show expand button for long content', () => {
      render(<ArtifactContentPreview mdxContent={longContent} />);

       expect(screen.getByText(/Show more/)).toBeInTheDocument();
    });

    it('should expand content when button is clicked', () => {
      render(<ArtifactContentPreview mdxContent={longContent} />);

      const expandButton = screen.getByText(/Show more/);
      fireEvent.click(expandButton);

       expect(screen.getByText(/Show less/)).toBeInTheDocument();
    });

    it('should not show expand button for short content', () => {
      render(<ArtifactContentPreview mdxContent="# Short Content" />);

      expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
    });

    it('should show correct character count in expand button', () => {
      const contentWithExactLength = 'x'.repeat(1001);

      render(<ArtifactContentPreview mdxContent={contentWithExactLength} />);

       expect(screen.getByText(/Show more \(1 additional characters\)/)).toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('should render headings correctly', () => {
      render(<ArtifactContentPreview mdxContent="# H1\n## H2\n### H3\n#### H4" />);

       expect(screen.getByText('H1')).toBeInTheDocument();
       expect(screen.getByText('H2')).toBeInTheDocument();
       expect(screen.getByText('H3')).toBeInTheDocument();
       expect(screen.getByText('H4')).toBeInTheDocument();
    });

    it('should handle lists correctly', () => {
      render(<ArtifactContentPreview mdxContent="- Item 1\n- Item 2\n1. Numbered 1\n2. Numbered 2" />);

       expect(screen.getByText('Item 1')).toBeInTheDocument();
       expect(screen.getByText('Item 2')).toBeInTheDocument();
       expect(screen.getByText('Numbered 1')).toBeInTheDocument();
       expect(screen.getByText('Numbered 2')).toBeInTheDocument();
    });

    it('should handle empty lines correctly', () => {
      render(<ArtifactContentPreview mdxContent="First paragraph\n\nSecond paragraph" />);

       expect(screen.getByText('First paragraph')).toBeInTheDocument();
       expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected content gracefully', () => {
      const unexpectedContent = null;

      render(<ArtifactContentPreview mdxContent={unexpectedContent as any} />);

       expect(screen.getByText('No content available for preview')).toBeInTheDocument();
    });

    it('should handle undefined frontmatter values', () => {
      const mdxWithUndefined = `---
title: undefined
description: null
---

# Content
`;

      render(<ArtifactContentPreview mdxContent={mdxWithUndefined} />);

       expect(screen.getByText('undefined')).toBeInTheDocument();
       expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('should handle console warnings for malformed YAML', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<ArtifactContentPreview mdxContent="---\ninvalid: yaml: content\n\n# Content" />);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse frontmatter:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes and structure', () => {
      const { container } = render(<ArtifactContentPreview mdxContent="# Test" />);

      const mainDiv = container.firstChild as HTMLElement;
       expect(mainDiv).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-lg', 'shadow-sm', 'overflow-hidden');
    });

    it('should render frontmatter section when present', () => {
      render(<ArtifactContentPreview mdxContent={mockMdxWithFrontmatter} />);

      const frontmatterSection = screen.getByText('Document Properties').closest('div');
      expect(frontmatterSection).toHaveClass('bg-gray-50', 'border-b', 'border-gray-200', 'p-4');
    });

    it('should render content section with proper styling', () => {
      render(<ArtifactContentPreview mdxContent="# Test Content" />);

      const contentSection = screen.getByText('Test Content').closest('div');
      expect(contentSection).toHaveClass('p-6');
    });
  });

  describe('Interactive Elements', () => {
    it('should toggle expand state correctly', () => {
      const longContent = 'x'.repeat(2000);
      render(<ArtifactContentPreview mdxContent={longContent} />);

      const expandButton = screen.getByText(/Show more/);

      // Initially collapsed
      expect(expandButton).toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);
       expect(screen.getByText(/Show less/)).toBeInTheDocument();

      // Click to collapse again
      fireEvent.click(screen.getByText(/Show less/));
       expect(screen.getByText(/Show more/)).toBeInTheDocument();
    });

    it('should rotate expand button icon when toggled', () => {
      const longContent = 'x'.repeat(2000);
      render(<ArtifactContentPreview mdxContent={longContent} />);

      const expandButton = screen.getByText(/Show more/);
      const svgIcon = expandButton.querySelector('svg');

      // Initially not rotated
       expect(svgIcon).not.toHaveClass('rotate-90');

      // Click to expand - icon should rotate
      fireEvent.click(expandButton);
       expect(svgIcon).toHaveClass('rotate-90');
    });
  });
});