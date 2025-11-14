// ABOUTME: Enhanced publisher with integrated template rendering system
// ABOUTME: Uses Nunjucks templates for JSON-LD generation with metadata injection

import { templateRenderer, TemplateData } from './template-renderer';
import { publishArtifact, PublishInput } from './publisher';

export type { PublishInput, PublishResult };

export interface EnhancedPublishOptions {
  templateType?: 'article' | 'faq';
  faqData?: Array<{
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
  useTemplates?: boolean;
}

/**
 * Enhanced publisher that uses the template rendering system for JSON-LD generation
 */
export async function publishArtifactEnhanced(
  input: PublishInput,
  options: EnhancedPublishOptions = {}
): Promise<PublishResult> {
  console.log('EnhancedPublisher: Publishing artifact with template integration');

  const { useTemplates = true, templateType = 'article', faqData = [] } = options;

  if (useTemplates) {
    console.log(`EnhancedPublisher: Using ${templateType} template for JSON-LD generation`);

    // Generate result using the original publisher for MDX and base data
    const originalResult = await publishArtifact(input);

    // Prepare template data
    const templateData: TemplateData = {
      frontmatter: {
        ...originalResult.frontmatter,
        // Add additional template-specific fields
        language: 'en',
        learning_objectives: originalResult.frontmatter.learning_objectives || [
          'Understand core concepts',
          'Apply knowledge practically'
        ]
      },
      // Add FAQ data if template type is FAQ
      faq_data: templateType === 'faq' ? faqData : undefined
    };

    // Render JSON-LD using templates
    let templateResult;
    if (templateType === 'faq') {
      templateResult = templateRenderer.renderFAQ(templateData);
    } else {
      templateResult = templateRenderer.renderArticle(templateData);
    }

    if (!templateResult.success) {
      console.error('EnhancedPublisher: Template rendering failed, falling back to original JSON-LD');
      console.error('Template errors:', templateResult.errors);
      return originalResult;
    }

    // Validate the rendered JSON-LD
    const validation = templateRenderer.validateJSONLD(templateResult.jsonld);
    if (!validation.valid) {
      console.error('EnhancedPublisher: JSON-LD validation failed, falling back to original');
      console.error('Validation errors:', validation.errors);
      return originalResult;
    }

    console.log('EnhancedPublisher: Template rendering and validation successful');

    // Return enhanced result with template-rendered JSON-LD
    return {
      ...originalResult,
      jsonld: templateResult.jsonld,
      // Add metadata about template usage
      frontmatter: {
        ...originalResult.frontmatter,
        template_used: templateType,
        template_rendered_at: new Date().toISOString(),
        template_validation_passed: true
      }
    };
  } else {
    console.log('EnhancedPublisher: Using original publisher without templates');
    return publishArtifact(input);
  }
}

/**
 * Publish FAQ content with dedicated template
 */
export async function publishFAQ(
  input: PublishInput,
  faqData: TemplateData['faq_data']
): Promise<PublishResult> {
  console.log(`EnhancedPublisher: Publishing FAQ with ${faqData?.length || 0} questions`);

  return publishArtifactEnhanced(input, {
    templateType: 'faq',
    useTemplates: true,
    faqData
  });
}

/**
 * Publish article content with dedicated template
 */
export async function publishArticle(input: PublishInput): Promise<PublishResult> {
  console.log('EnhancedPublisher: Publishing article with template');

  return publishArtifactEnhanced(input, {
    templateType: 'article',
    useTemplates: true
  });
}

/**
 * Validate template rendering before publishing
 */
export async function validateTemplateRendering(
  input: PublishInput,
  templateType: 'article' | 'faq',
  faqData?: TemplateData['faq_data']
): Promise<{ valid: boolean; errors: string[]; preview?: any }> {
  console.log(`EnhancedPublisher: Validating ${templateType} template rendering`);

  // Prepare template data
  const templateData: TemplateData = {
    frontmatter: {
      title: 'Validation Test',
      description: 'Template validation test',
      ip_pattern: input.ip,
      created_at: new Date().toISOString(),
      tier: input.metadata?.tier || 'MEDIUM',
      content_score: 75,
      word_count: 500,
      reading_time: 3,
      compliance_level: 'high'
    },
    faq_data: faqData
  };

  // Render template
  let result;
  if (templateType === 'faq') {
    result = templateRenderer.renderFAQ(templateData);
  } else {
    result = templateRenderer.renderArticle(templateData);
  }

  if (!result.success) {
    return {
      valid: false,
      errors: result.errors || ['Template rendering failed']
    };
  }

  // Validate JSON-LD
  const validation = templateRenderer.validateJSONLD(result.jsonld);

  return {
    valid: validation.valid,
    errors: validation.errors,
    preview: result.jsonld
  };
}

/**
 * Test integration between templates and publisher
 */
export async function testPublisherIntegration(): Promise<{
  success: boolean;
  articleTest: boolean;
  faqTest: boolean;
  errors: string[];
}> {
  console.log('EnhancedPublisher: Testing template integration');

  const errors: string[] = [];
  let articleTest = false;
  let faqTest = false;

  // Test article integration
  try {
    const testInput: PublishInput = {
      draft: '# Test Article\n\nThis is a test article for integration testing.',
      ip: 'framework@test',
      audit: {
        tags: [{ tag: 'test', severity: 'info' }],
        overall_score: 85
      },
      retrieval: {
        flags: {},
        candidates: [{ id: 'test-source' }]
      },
      metadata: {
        tier: 'MEDIUM',
        persona: 'student'
      }
    };

    const articleResult = await publishArticle(testInput);
    articleTest = articleResult.jsonld && articleResult.jsonld['@type']?.includes('EducationalContent');

    if (!articleTest) {
      errors.push('Article template integration failed');
    }
  } catch (error) {
    errors.push(`Article integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test FAQ integration
  try {
    const testFAQData = [
      {
        question: 'What is this test?',
        answer: 'This is a test of the FAQ template integration.'
      }
    ];

    const faqResult = await publishFAQ(input, testFAQData);
    faqTest = faqResult.jsonld && faqResult.jsonld['@type']?.includes('FAQPage');

    if (!faqTest) {
      errors.push('FAQ template integration failed');
    }
  } catch (error) {
    errors.push(`FAQ integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const success = errors.length === 0 && articleTest && faqTest;

  console.log(`EnhancedPublisher: Integration test result - ${success ? 'PASSED' : 'FAILED'}`);
  if (errors.length > 0) {
    console.log('Integration errors:', errors);
  }

  return { success, articleTest, faqTest, errors };
}

// Export for backward compatibility
export { publishArtifact as publishArtifactOriginal };

// Export template functions for direct usage
export { templateRenderer };