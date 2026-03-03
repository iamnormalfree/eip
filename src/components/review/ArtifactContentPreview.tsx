// ABOUTME: Artifact Content Preview Component - Rich MDX content display with syntax highlighting
// ABOUTME: Renders MDX content with proper typography, frontmatter parsing, and code highlighting

'use client';

import React, { useState, useMemo } from 'react';
import { MDXProvider } from '@mdx-js/react';
import YAML from 'yaml';

// Simple mock for SyntaxHighlighter to avoid Jest import issues
const MockSyntaxHighlighter = ({ style, language, children, ...props }: any) => (
  <div className="rounded-lg overflow-hidden my-4 bg-gray-900 text-gray-100 p-4" {...props}>
    <pre className="text-sm"><code>{String(children).replace(/\n$/, '')}</code></pre>
  </div>
);

interface ArtifactContentPreviewProps {
  mdxContent: string;
  className?: string;
}

interface Frontmatter {
  title?: string;
  persona?: string;
  funnel?: string;
  [key: string]: any;
}

const formatFrontmatterLabel = (key: string) => {
  const spaced = key.replace(/_/g, ' ').trim();
  return spaced.length ? `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}:` : '';
};

const renderInlineSegments = (text: string): React.ReactNode[] => {
  const segments: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    { regex: /\*\*(.+?)\*\*/, render: (match: RegExpExecArray) => <strong key={key++}>{match[1]}</strong> },
    { regex: /\*(.+?)\*/, render: (match: RegExpExecArray) => <em key={key++}>{match[1]}</em> },
    { regex: /`([^`]+)`/, render: (match: RegExpExecArray) => (
      <code key={key++} className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">{match[1]}</code>
    ) },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, render: (match: RegExpExecArray) => (
      <a
        key={key++}
        href={match[2]}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[1]}
      </a>
    ) },
  ];

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let matchedPattern: { regex: RegExp; render: (m: RegExpExecArray) => React.ReactNode } | null = null;
    let matchedResult: RegExpExecArray | null = null;

    for (const pattern of patterns) {
      const match = pattern.regex.exec(remaining);
      if (match && (earliestIndex === -1 || match.index < earliestIndex)) {
        earliestIndex = match.index;
        matchedPattern = pattern;
        matchedResult = match;
      }
    }

    if (!matchedPattern || !matchedResult) {
      if (remaining) {
        segments.push(<span key={key++}>{remaining}</span>);
      }
      break;
    }

    if (earliestIndex >= 0) {
      const textPart = remaining.slice(0, earliestIndex);
      if (textPart) {
        segments.push(<span key={key++}>{textPart}</span>);
      }
    }

    segments.push(matchedPattern.render(matchedResult));
    remaining = remaining.slice(earliestIndex + matchedResult[0].length);
  }

  return segments;
};

const renderMarkdownContent = (rawContent: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const normalizedContent = (rawContent || '').replace(/\r\n/g, '\n').replace(/\\n/g, '\n');
  const lines = normalizedContent.split('\n');

  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      const text = paragraphBuffer.join(' ').trim();
      elements.push(
        <p key={`p-${elements.length}`} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
          {renderInlineSegments(text)}
        </p>
      );
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (!listBuffer) return;
    const ListTag = listBuffer.type === 'ul' ? 'ul' : 'ol';
    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={listBuffer.type === 'ul' ? 'list-disc list-inside mb-4 space-y-1 text-gray-700' : 'list-decimal list-inside mb-4 space-y-1 text-gray-700'}
      >
        {listBuffer.items.map((item, idx) => (
          <li key={`${listBuffer.type}-${idx}`} className="leading-relaxed text-gray-700">
            {renderInlineSegments(item)}
          </li>
        ))}
      </ListTag>
    );
    listBuffer = null;
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      const language = line.replace(/```/, '').trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      elements.push(
        <div key={`code-${elements.length}`} className="rounded-lg overflow-hidden my-4">
          <MockSyntaxHighlighter style={{}} language={language || undefined} PreTag="div">
            {codeLines.join('\n')}
          </MockSyntaxHighlighter>
        </div>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
          {renderInlineSegments(line.substring(2))}
        </h1>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
          {renderInlineSegments(line.substring(3))}
        </h2>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-xl font-medium text-gray-800 mt-4 mb-2">
          {renderInlineSegments(line.substring(4))}
        </h3>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('#### ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="text-lg font-medium text-gray-700 mt-3 mb-2">
          {renderInlineSegments(line.substring(5))}
        </h4>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList();
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(line.substring(2));
      index += 1;
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      flushParagraph();
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList();
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(line.replace(/^\d+\.\s+/, ''));
      index += 1;
      continue;
    }

    if (line.startsWith('>')) {
      flushParagraph();
      flushList();
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-blue-800">
          {renderInlineSegments(line.replace(/^>\s?/, ''))}
        </blockquote>
      );
      index += 1;
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      index += 1;
      continue;
    }

    paragraphBuffer.push(line);
    index += 1;
  }

  flushParagraph();
  flushList();
  return elements;
};

export function ArtifactContentPreview({ mdxContent, className = '' }: ArtifactContentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse frontmatter from MDX content with null safety
  const { frontmatter, content } = useMemo(() => {
    if (!mdxContent || typeof mdxContent !== 'string') {
      return { frontmatter: {}, content: '' };
    }

    const trimmed = mdxContent.trimStart();
    if (trimmed.startsWith('---')) {
      const closingIndex = trimmed.indexOf('\n---', 3);
      if (closingIndex === -1) {
        console.warn('Failed to parse frontmatter:', new Error('Missing closing delimiter in frontmatter'));
        return { frontmatter: {}, content: trimmed.replace(/^---\s*/, '') };
      }

      const rawFrontmatter = trimmed.slice(3, closingIndex).trim();
      const afterFrontmatter = trimmed.slice(closingIndex + 4);

      try {
        const parsed = YAML.parse(rawFrontmatter) || {};
        const cleanedContent = afterFrontmatter.startsWith('\n') ? afterFrontmatter.slice(1) : afterFrontmatter;
        return { frontmatter: parsed, content: cleanedContent };
      } catch (error) {
        console.warn('Failed to parse frontmatter:', error);
        const cleanedContent = afterFrontmatter.startsWith('\n') ? afterFrontmatter.slice(1) : afterFrontmatter;
        return { frontmatter: {}, content: cleanedContent };
      }
    }

    return { frontmatter: {}, content: mdxContent };
  }, [mdxContent]);

  // MDX components with syntax highlighting
  const mdxComponents = {
    // Code blocks with syntax highlighting
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language) {
        return (
          <div className="rounded-lg overflow-hidden my-4">
            <MockSyntaxHighlighter
              style={{}} // Mock style object
              language={language}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </MockSyntaxHighlighter>
          </div>
        );
      }

      // Inline code
      return (
        <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },

    // Headings with proper styling
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-medium text-gray-800 mt-4 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-medium text-gray-700 mt-3 mb-2">
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-4 last:mb-0">
        {children}
      </p>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-blue-800">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-gray-300">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-100">
        {children}
      </thead>
    ),
    th: ({ children }: any) => (
      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-gray-300 px-4 py-2 text-gray-700">
        {children}
      </td>
    ),
  };

  // Handle malformed MDX gracefully
  if (!mdxContent) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <p className="text-gray-500 italic">No content available for preview</p>
      </div>
    );
  }

  const contentPreview = isExpanded ? content : (content || '').substring(0, 1000);
  const shouldShowExpandButton = (content || '').length > 1000;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Frontmatter Display */}
      {Object.keys(frontmatter).length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Document Properties</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(frontmatter || {}).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="font-medium text-gray-600 capitalize">{formatFrontmatterLabel(key)}</span>
                <span className="text-gray-800 truncate">{String(value as any)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MDX Content */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none">
          <MDXProvider components={mdxComponents}>
            <div className="mdx-content p-6">
              {renderMarkdownContent(contentPreview)}
            </div>
          </MDXProvider>
        </div>

        {/* Expand/Collapse Button */}
        {shouldShowExpandButton && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg
                className={`w-4 h-4 mr-1 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {isExpanded ? 'Show less' : `Show more (${(content || '').length - 1000} additional characters)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
