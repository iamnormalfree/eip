// ABOUTME: Simple integration test for Template Renderer implementation
// ABOUTME: Tests the actual implementation rather than mocks

import { describe, it, expect } from '@jest/globals';
import { TemplateRenderer } from '../../orchestrator/template-renderer';

describe('Template Renderer Implementation', () => {
  let templateRenderer: TemplateRenderer;

  beforeEach(() => {
    templateRenderer = new TemplateRenderer();
  });

  describe('Basic Template Rendering', () => {
    it('should render simple template with variables', () => {
      const template = 'Hello {{ name }}, your score is {{ score }}!';
      const data = { name: 'Alice', score: 95 };

      const result = templateRenderer.renderTemplate(template, data);

      expect(result).toBe('Hello Alice, your score is 95!');
    });

    it('should handle nested object variables', () => {
      const template = 'Author: {{ author.name }}, Email: {{ author.email }}';
      const data = {
        author: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      const result = templateRenderer.renderTemplate(template, data);

      expect(result).toBe('Author: John Doe, Email: john@example.com');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{ name }}, your age is {{ age }}';
      const data = { name: 'Bob' };

      const result = templateRenderer.renderTemplate(template, data);

      expect(result).toBe('Hello Bob, your age is {{ age }}');
    });
  });

  describe('Template Validation', () => {
    it('should validate valid templates', () => {
      const template = 'Hello {{ name }}!';
      const validation = templateRenderer.validateTemplate(template, { name: 'Test' });

      expect(validation.valid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    it('should detect missing variables', () => {
      const template = 'Hello {{ name }}, welcome to {{ place }}!';
      const validation = templateRenderer.validateTemplate(template, { name: 'Alice' });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors!.length).toBeGreaterThan(0);
    });

    it('should detect malformed template syntax', () => {
      const template = 'Hello {{ name, your {{ unclosed template';
      const validation = templateRenderer.validateTemplate(template);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
    });
  });

  describe('Template Compilation', () => {
    it('should compile template into executable function', () => {
      const template = 'Hello {{ name }}!';
      const compiledTemplate = templateRenderer.compileTemplate(template);

      expect(typeof compiledTemplate).toBe('function');

      const result1 = compiledTemplate({ name: 'Alice' });
      const result2 = compiledTemplate({ name: 'Bob' });

      expect(result1).toBe('Hello Alice!');
      expect(result2).toBe('Hello Bob!');
    });
  });

  describe('Content Formatting', () => {
    it('should format content as markdown', () => {
      const content = {
        title: 'Test Title',
        body: 'This is the body content.'
      };

      const result = templateRenderer.formatContent(content, 'markdown');

      expect(result).toBe('# Test Title\n\nThis is the body content.');
    });

    it('should format content as HTML', () => {
      const content = {
        title: 'Test Title',
        body: 'This is the body content.'
      };

      const result = templateRenderer.formatContent(content, 'html');

      expect(result).toBe('<h1>Test Title</h1><p>This is the body content.</p>');
    });

    it('should format content as JSON', () => {
      const content = {
        title: 'Test Title',
        body: 'This is the body content.'
      };

      const result = templateRenderer.formatContent(content, 'json');
      const parsed = JSON.parse(result);

      expect(parsed.title).toBe('Test Title');
      expect(parsed.body).toBe('This is the body content.');
    });
  });

  describe('Content Sanitization', () => {
    it('should remove script tags', () => {
      const maliciousContent = '<script>alert("xss")</script><p>Safe content</p>';

      const result = templateRenderer.sanitizeContent(maliciousContent);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert("xss")');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should remove javascript: protocols', () => {
      const maliciousContent = '<a href="javascript:alert(\'xss\')">Click me</a>';

      const result = templateRenderer.sanitizeContent(maliciousContent);

      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const maliciousContent = '<button onclick="alert(\'xss\')">Click me</button>';

      const result = templateRenderer.sanitizeContent(maliciousContent);

      expect(result).not.toContain('onclick=');
    });
  });

  describe('Error Handling', () => {
    it('should handle null template gracefully', () => {
      const data = { name: 'Test' };

      const result = templateRenderer.renderTemplate(null as any, data);

      expect(result).toBe('');
    });

    it('should handle invalid data gracefully', () => {
      const template = 'Hello {{ name }}!';

      const result = templateRenderer.renderTemplate(template, null as any);

      expect(result).toBe('Hello {{ name }}!');
    });
  });
});
