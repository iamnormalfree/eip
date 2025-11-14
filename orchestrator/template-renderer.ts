// ABOUTME: Template renderer for EIP system using Nunjucks with JSON-LD schemas
// ABOUTME: Supports article and FAQ content types with metadata injection

import * as nunjucks from 'nunjucks';
import * as path from 'path';

export interface TemplateData {
  frontmatter: Record<string, any>;
  faq_data?: Array<{
    question: string;
    answer: string;
    difficulty?: string;
    topic?: string;
    related_concepts?: string[];
    learning_objectives?: string[];
    sources?: Array<{
      title?: string;
      description?: string;
      url?: string;
      author?: string;
    }>;
  }>;
}

export interface RenderResult {
  jsonld: Record<string, any>;
  rendered: string;
  success: boolean;
  errors?: string[];
}

export class TemplateRenderer {
  private env: nunjucks.Environment;

  constructor() {
    const templatesPath = path.join(process.cwd(), 'templates');
    this.env = nunjucks.configure(templatesPath, {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
      noCache: process.env.NODE_ENV === 'development'
    });

    // Add custom filters for EIP data processing
    this.addCustomFilters();
  }

  private addCustomFilters(): void {
    // ISO date format filter
    this.env.addFilter('isoformat', (date: string) => {
      if (!date) return new Date().toISOString();
      return new Date(date).toISOString();
    });

    // Now filter for current timestamp
    this.env.addFilter('now', () => {
      return new Date().toISOString();
    });

    // Default value filter with better handling
    this.env.addFilter('default', (value: any, defaultValue: any) => {
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    // Slugify filter for creating clean identifiers
    this.env.addFilter('slugify', (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    });

    // Escape JSON properly for JSON-LD
    this.env.addFilter('escape', (text: string) => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    });
  }

  /**
   * Render article template with structured content and frontmatter
   */
  renderArticle(data: TemplateData): RenderResult {
    try {
      console.log('TemplateRenderer: Rendering article template');

      // Validate required data
      const validationResult = this.validateTemplateData(data, 'article');
      if (!validationResult.success) {
        return validationResult;
      }

      // Render template
      const rendered = this.env.render('article.jsonld.j2', data);

      // Parse and validate JSON-LD
      const jsonld = JSON.parse(rendered);

      console.log('TemplateRenderer: Article template rendered successfully', {
        title: data.frontmatter.title || 'Untitled',
        educationalLevel: data.frontmatter.tier || 'MEDIUM'
      });

      return {
        jsonld,
        rendered,
        success: true
      };
    } catch (error) {
      console.error('TemplateRenderer: Error rendering article template:', error);
      return {
        jsonld: {},
        rendered: '',
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Render FAQ template with question-answer pairs and frontmatter
   */
  renderFAQ(data: TemplateData): RenderResult {
    try {
      console.log('TemplateRenderer: Rendering FAQ template');

      // Validate required data for FAQ
      if (!data.faq_data || data.faq_data.length === 0) {
        return {
          jsonld: {},
          rendered: '',
          success: false,
          errors: ['FAQ data is required for FAQ template']
        };
      }

      // Validate FAQ items
      for (let i = 0; i < data.faq_data.length; i++) {
        const item = data.faq_data[i];
        if (!item.question || !item.answer) {
          return {
            jsonld: {},
            rendered: '',
            success: false,
            errors: [`FAQ item ${i + 1} missing question or answer`]
          };
        }
      }

      // Validate general template data
      const validationResult = this.validateTemplateData(data, 'faq');
      if (!validationResult.success) {
        return validationResult;
      }

      // Render template
      const rendered = this.env.render('faq.jsonld.j2', data);

      // Parse and validate JSON-LD
      const jsonld = JSON.parse(rendered);

      console.log('TemplateRenderer: FAQ template rendered successfully', {
        questionCount: data.faq_data.length,
        title: data.frontmatter.title || 'Untitled FAQ'
      });

      return {
        jsonld,
        rendered,
        success: true
      };
    } catch (error) {
      console.error('TemplateRenderer: Error rendering FAQ template:', error);
      return {
        jsonld: {},
        rendered: '',
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Generic template renderer for different content types
   */
  renderTemplate(templateName: string, data: TemplateData): RenderResult {
    try {
      console.log(`TemplateRenderer: Rendering ${templateName} template`);

      // Validate template name
      const validTemplates = ['article.jsonld.j2', 'faq.jsonld.j2'];
      if (!validTemplates.includes(templateName)) {
        return {
          jsonld: {},
          rendered: '',
          success: false,
          errors: [`Invalid template name: ${templateName}`]
        };
      }

      // Special validation for FAQ template
      if (templateName === 'faq.jsonld.j2') {
        if (!data.faq_data || data.faq_data.length === 0) {
          return {
            jsonld: {},
            rendered: '',
            success: false,
            errors: ['FAQ data is required for FAQ template']
          };
        }
      }

      // Render template
      const rendered = this.env.render(templateName, data);

      // Parse JSON-LD
      const jsonld = JSON.parse(rendered);

      console.log(`TemplateRenderer: ${templateName} rendered successfully`);

      return {
        jsonld,
        rendered,
        success: true
      };
    } catch (error) {
      console.error(`TemplateRenderer: Error rendering ${templateName}:`, error);
      return {
        jsonld: {},
        rendered: '',
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate template data against schema.org requirements
   */
  validateTemplateData(data: TemplateData, templateType: string): RenderResult {
    const errors: string[] = [];

    // Check frontmatter exists
    if (!data.frontmatter || typeof data.frontmatter !== 'object') {
      errors.push('Frontmatter is required and must be an object');
      return {
        jsonld: {},
        rendered: '',
        success: false,
        errors
      };
    } else {
      // Required fields for all templates
      const requiredFields = ['title', 'description'];
      for (const field of requiredFields) {
        if (!data.frontmatter[field]) {
          console.warn(`TemplateRenderer: Missing recommended field: ${field}`);
        }
      }

      // Validate data types
      if (data.frontmatter.content_score && typeof data.frontmatter.content_score !== 'number') {
        errors.push('Content score must be a number');
      }

      if (data.frontmatter.word_count && typeof data.frontmatter.word_count !== 'number') {
        errors.push('Word count must be a number');
      }

      if (data.frontmatter.reading_time && typeof data.frontmatter.reading_time !== 'number') {
        errors.push('Reading time must be a number');
      }
    }

    if (errors.length > 0) {
      return {
        jsonld: {},
        rendered: '',
        success: false,
        errors
      };
    }

    return {
      jsonld: {},
      rendered: '',
      success: true
    };
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return ['article.jsonld.j2', 'faq.jsonld.j2'];
  }

  /**
   * Validate rendered JSON-LD against schema.org structure
   */
  validateJSONLD(jsonld: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!jsonld['@context']) {
      errors.push('Missing @context in JSON-LD');
    } else if (jsonld['@context'] !== 'https://schema.org') {
      errors.push('Invalid @context, should be https://schema.org');
    }

    if (!jsonld['@type']) {
      errors.push('Missing @type in JSON-LD');
    } else if (!Array.isArray(jsonld['@type'])) {
      errors.push('@type should be an array for educational content');
    }

    if (!jsonld.headline) {
      errors.push('Missing headline in JSON-LD');
    }

    if (!jsonld.description) {
      errors.push('Missing description in JSON-LD');
    }

    if (!jsonld.author) {
      errors.push('Missing author in JSON-LD');
    } else if (jsonld.author['@type'] !== 'Organization' && jsonld.author['@type'] !== 'Person') {
      errors.push('Author @type should be Organization or Person');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance for convenience
export const templateRenderer = new TemplateRenderer();

// Export types for external usage
export type { TemplateData, RenderResult };