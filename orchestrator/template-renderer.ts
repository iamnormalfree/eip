// ABOUTME: Template renderer for EIP system using simple template processing
// ABOUTME: Supports basic template rendering, validation, compilation, and content formatting

export interface TemplateData {
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface CompiledTemplate {
  (data: TemplateData): string;
}

export class TemplateRenderer {
  /**
   * Render template with data
   */
  renderTemplate(template: string, data: TemplateData): string {
    try {
      if (!template) {
        return "";
      }

      if (!data) {
        return template;
      }

      return this.renderNested(template, data);
    } catch (error) {
      console.error('Template rendering error:', error);
      return template; // Return original template on error
    }
  }

  /**
   * Helper method for recursive nested template rendering
   */
  private renderNested(template: string, data: TemplateData, prefix: string = ''): string {
    let result = template;
    
    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        result = this.renderNested(result, value, fullKey);
      } else {
        // Replace template variables
        const pattern = new RegExp(`{{\\s*${fullKey}\\s*}}`, 'g');
        result = result.replace(pattern, String(value));
      }
    }
    
    return result;
  }

  /**
   * Validate template syntax and variables
   */
  validateTemplate(template: string, data: TemplateData = {}): ValidationResult {
    const errors: string[] = [];
    
    // Check for unclosed template variables
    const openVars = (template.match(/{{/g) || []).length;
    const closeVars = (template.match(/}}/g) || []).length;
    
    if (openVars !== closeVars) {
      errors.push('Unclosed template variable');
      return { valid: false, errors };
    }

    // Extract template variables
    const vars = template.match(/{{\s*[^}]+\s*}}/g);
    
    if (vars && vars.length > 0) {
      // Check if variables are well-formed
      const malformedVars = vars.filter(v => !v.match(/{{\s*[^{}\s]+\s*}}/));
      if (malformedVars.length > 0) {
        errors.push('Malformed template syntax');
        return { valid: false, errors };
      }

      // Check for missing variables in data (only for simple variables, not nested)
      const varNames = vars.map(v => v.replace(/[{}]/g, '').trim().split('.')[0]);
      const missingVars = varNames.filter(varName =>
        !varName.includes('.') && !data.hasOwnProperty(varName)
      );

      if (missingVars.length > 0) {
        errors.push('Missing template variables: ' + missingVars.join(', '));
        return { valid: false, errors };
      }
    }

    return { valid: true, errors: undefined };
  }

  /**
   * Compile template into reusable function
   */
  compileTemplate(template: string): CompiledTemplate {
    return (data: TemplateData) => this.renderTemplate(template, data);
  }

  /**
   * Format content based on specified format
   */
  formatContent(content: any, format: string): string {
    try {
      switch (format) {
        case 'markdown':
          if (typeof content === 'object' && content.title && content.body) {
            return '# ' + content.title + '\n\n' + content.body;
          }
          return String(content);
          
        case 'html':
          if (typeof content === 'object' && content.title && content.body) {
            return '<h1>' + content.title + '</h1><p>' + content.body + '</p>';
          }
          return '<p>' + String(content) + '</p>';
          
        case 'json':
          return JSON.stringify(content, null, 2);
          
        case 'plain':
        default:
          if (typeof content === 'object' && content.body) {
            return String(content.body);
          }
          return String(content);
      }
    } catch (error) {
      console.error('Content formatting error:', error);
      return String(content);
    }
  }

  /**
   * Sanitize content by removing potentially harmful elements
   */
  sanitizeContent(content: string): string {
    if (typeof content !== 'string') {
      content = String(content);
    }
    
    return content
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
      .replace(/<object[^>]*>.*?<\/object>/gis, '')
      .replace(/<embed[^>]*>/gi, '');
  }

  /**
   * Validate template variables against data structure
   */
  validateTemplateVariables(template: string, data: TemplateData): ValidationResult {
    const errors: string[] = [];
    
    // Extract all template variables
    const variableMatches = template.match(/{{\s*([^}]+)\s*}}/g) || [];
    const requiredVars = variableMatches.map(match => 
      match.replace(/[{}]/g, '').trim()
    );

    // Check each required variable
    for (const varPath of requiredVars) {
      const pathParts = varPath.split('.');
      let current = data;
      let exists = true;

      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          exists = false;
          break;
        }
      }

      if (!exists) {
        errors.push('Missing variable: ' + varPath);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Render FAQ structured data (JSON-LD)
   */
  renderFAQ(data: TemplateData): { success: boolean; jsonld: any; error?: string } {
    try {
      if (!data.faq_data) {
        return { success: false, jsonld: {}, error: 'No FAQ data provided' };
      }

      const jsonld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": data.faq_data.map((faq: any) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };

      return { success: true, jsonld };
    } catch (error) {
      console.error('FAQ rendering error:', error);
      return { success: false, jsonld: {}, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Render Article structured data (JSON-LD)
   */
  renderArticle(data: TemplateData): { success: boolean; jsonld: any; error?: string } {
    try {
      if (!data.title || !data.content) {
        return { success: false, jsonld: {}, error: 'Missing required article data (title, content)' };
      }

      const jsonld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.title,
        "articleBody": data.content,
        "author": data.author ? {
          "@type": "Person",
          "name": data.author
        } : undefined,
        "datePublished": data.datePublished || new Date().toISOString(),
        "dateModified": data.dateModified || new Date().toISOString(),
        "publisher": data.publisher ? {
          "@type": "Organization",
          "name": data.publisher
        } : undefined,
        "keywords": data.keywords || undefined
      };

      // Remove undefined properties
      Object.keys(jsonld).forEach(key => jsonld[key] === undefined && delete jsonld[key]);

      return { success: true, jsonld };
    } catch (error) {
      console.error('Article rendering error:', error);
      return { success: false, jsonld: {}, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Extract template variables from template string
   */
  extractVariables(template: string): string[] {
    const matches = template.match(/{{\s*([^}]+)\s*}}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, '').trim());
  }

  /**
   * Check if template contains complex logic
   */
  hasComplexLogic(template: string): boolean {
    const complexPatterns = [
      /{{\s*#/g,    // Conditionals
      /{{\s*\//g,   // End blocks
      /{{\s*>/g,    // Partials
      /{{\s*%/g,    // Comments
      /\|\s*\w+/g,  // Filters
    ];

    return complexPatterns.some(pattern => pattern.test(template));
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();
