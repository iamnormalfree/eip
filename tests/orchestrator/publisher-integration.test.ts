// ABOUTME: Comprehensive Publisher Integration Tests for Plan 06
// ABOUTME: Tests complete publisher assembly with MDX + Ledger + JSON-LD integration
// ABOUTME: Validates template selection, controller integration, and end-to-end workflow

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { publishArtifact, type PublishResult } from '../../orchestrator/publisher';

// Mock dependencies
jest.mock('../../orchestrator/template-renderer', () => ({
  templateRenderer: {
    renderArticle: jest.fn(),
    renderFAQ: jest.fn()
  }
}));

jest.mock('../../orchestrator/router', () => ({
  getIPInvariants: jest.fn()
}));

// Import mocked modules for type access
import { templateRenderer } from '../../orchestrator/template-renderer';
import { getIPInvariants } from '../../orchestrator/router';

describe('Publisher Integration Tests - Plan 06', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock template renderer responses
    (templateRenderer.renderArticle as jest.Mock).mockReturnValue({
      success: true,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': ['Article', 'EducationalContent'],
        headline: 'Test Framework Guide',
        dateCreated: '2025-11-18',
        author: { '@type': 'Organization', name: 'EIP Content Runtime' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': '#content' },
        educationalLevel: 'Beginner',
        learningResourceType: 'Concept Overview',
        teaches: ['Understanding core concepts', 'Practical application'],
        keywords: ['framework', 'educational content', 'EIP'],
        inLanguage: 'en'
      }
    });

    (templateRenderer.renderFAQ as jest.Mock).mockReturnValue({
      success: true,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: [
            {
              '@type': 'Question',
              name: 'What is this framework about?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'This framework explains mechanisms and processes for educational content generation.'
              }
            }
          ]
        },
        educationalLevel: 'Intermediate',
        keywords: ['faq', 'framework', 'EIP'],
        inLanguage: 'en'
      }
    });

    // Mock IP invariants
    (getIPInvariants as jest.Mock).mockReturnValue(['has_overview', 'has_mechanism', 'has_examples']);
  });

  describe('Complete Publisher Assembly', () => {
    it('should publish complete artifact with MDX + Ledger + JSON-LD', async () => {
      const input = {
        draft: '# Framework Guide\n\nThis is a comprehensive framework guide.\n\n## Overview\nFramework provides structure for content generation.\n\n## How It Works\nThe framework uses proven patterns.\n\n## Examples\nExample usage demonstrates effectiveness.',
        ip: 'framework@1.0.0',
        audit: {
          tags: [{ tag: 'HIGH_QUALITY', severity: 'info' }],
          overall_score: 95
        },
        retrieval: {
          flags: { has_edu_source: true, graph_sparse: false },
          candidates: [
            { 
              id: 'source1', 
              url: 'https://mas.gov.sg/educational-content',
              confidence: 0.9, 
              type: 'educational',
              score: 0.95
            }
          ]
        },
        metadata: {
          persona: 'student',
          funnel: 'awareness',
          tier: 'LIGHT',
          correlation_id: 'test-456'
        }
      };

      const result = await publishArtifact(input);

      // Validate complete PublishResult structure
      expect(result).toHaveProperty('mdx');
      expect(result).toHaveProperty('jsonld');
      expect(result).toHaveProperty('ledger');
      expect(result).toHaveProperty('quality_gates');
      expect(result).toHaveProperty('frontmatter');
      expect(result).toHaveProperty('metrics');

      // Validate MDX content structure
      expect(result.mdx).toContain('---');
      expect(result.mdx).toContain('title:');
      expect(result.mdx).toContain('framework@1.0.0');
      expect(result.mdx).toContain('# Framework Guide');

      // Validate JSON-LD schema
      expect(result.jsonld['@context']).toBe('https://schema.org');
      expect(result.jsonld['@type']).toContain('Article');
      expect(result.jsonld.headline).toBeDefined();
      expect(templateRenderer.renderArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          frontmatter: expect.objectContaining({
            ip_pattern: 'framework@1.0.0',
            learning_type: 'concept'
          })
        })
      );

      // Validate comprehensive ledger
      expect(result.ledger.ip_used).toBe('framework@1.0.0');
      expect(result.ledger.ip_invariants).toBeDefined();
      expect(result.ledger.ip_invariants.required).toEqual(['has_overview', 'has_mechanism', 'has_examples']);
      expect(result.ledger.ip_invariants.validated).toContain('has_overview');
      expect(result.ledger.compliance_sources).toHaveLength(1);
      expect(result.ledger.compliance_sources[0].url).toBe('https://mas.gov.sg/educational-content');
      expect(result.ledger.provenance.generation_trace).toHaveLength(6); // All stages
      expect(result.ledger.provenance.generation_trace.map(t => t.stage)).toEqual([
        'planner', 'retrieval', 'generator', 'auditor', 'repairer', 'publisher'
      ]);

      // Validate quality gates
      expect(result.quality_gates.ip_invariant_satisfied).toBe(true);
      expect(result.quality_gates.compliance_rules_checked).toBe(true);
      expect(result.quality_gates.performance_budget_respected).toBe(true);
      expect(result.quality_gates.provenance_complete).toBe(true);

      // Validate frontmatter contains metadata
      expect(result.frontmatter.persona).toBe('student');
      expect(result.frontmatter.funnel).toBe('awareness');
      expect(result.frontmatter.tier).toBe('LIGHT');
      expect(result.frontmatter.correlation_id).toBe('test-456');
      expect(result.frontmatter.quality_score).toBe(95);

      // Validate metrics calculation
      expect(result.metrics.word_count).toBeGreaterThan(0);
      expect(result.metrics.reading_time).toBeGreaterThan(0);
      expect(result.metrics.content_score).toBe(95);
      expect(result.metrics.compliance_level).toBe('high');
    });

    it('should select FAQ template for FAQ content type', async () => {
      const input = {
        draft: '# FAQ Framework\n\n## Q1: What is this?\nA1: This is a framework.\n\n## Q2: How does it work?\nA2: It works through patterns.',
        ip: 'faq@1.0.0',
        audit: {
          tags: [{ tag: 'FAQ_CONTENT', severity: 'info' }],
          overall_score: 88
        },
        retrieval: {
          flags: {},
          candidates: []
        },
        metadata: {
          persona: 'user',
          funnel: 'consideration',
          tier: 'MEDIUM'
        }
      };

      const result = await publishArtifact(input);

      // Should use FAQ template
      expect(templateRenderer.renderFAQ).toHaveBeenCalled();
      expect(result.jsonld['@type']).toContain('FAQPage');
      expect(result.jsonld.mainEntity).toBeDefined();
      expect(result.jsonld.mainEntity.itemListElement).toBeDefined();

      // Should not use article template
      expect(templateRenderer.renderArticle).not.toHaveBeenCalled();

      // Content type should be faq
      expect(result.ledger.metadata.content_type).toBe('faq');
    });

    it('should fallback to article template when FAQ template fails', async () => {
      (templateRenderer.renderFAQ as jest.Mock).mockReturnValueOnce({
        success: false,
        error: 'Template rendering failed'
      });

      const input = {
        draft: '# FAQ Content\n\n## Q1: Question\nA1: Answer',
        ip: 'faq@1.0.0',
        audit: { tags: [], overall_score: 80 },
        retrieval: { flags: {}, candidates: [] },
        metadata: {}
      };

      const result = await publishArtifact(input);

      // Should fallback to article template
      expect(templateRenderer.renderFAQ).toHaveBeenCalled();
      expect(templateRenderer.renderArticle).toHaveBeenCalled();
      expect(result.jsonld['@type']).toContain('Article');
    });
  });

  describe('Template Selection Logic', () => {
    it('should select article template for framework content', async () => {
      const input = {
        draft: '# Framework Guide\n\nOverview section here.',
        ip: 'framework@1.0.0',
        audit: { tags: [], overall_score: 85 },
        retrieval: { flags: {}, candidates: [] },
        metadata: {}
      };

      await publishArtifact(input);

      expect(templateRenderer.renderArticle).toHaveBeenCalled();
      expect(templateRenderer.renderFAQ).not.toHaveBeenCalled();
    });

    it('should select FAQ template for FAQ-specific IP types', async () => {
      const faqInputs = [
        { ip: 'faq@1.0.0' },
        { ip: 'questions@1.0.0' },
        { ip: 'question-answer@1.0.0' }
      ];

      for (const input of faqInputs) {
        const testInput = {
          draft: '# FAQ Content\n\n## Q1: Question\nA1: Answer',
          ip: input.ip,
          audit: { tags: [], overall_score: 85 },
          retrieval: { flags: {}, candidates: [] },
          metadata: {}
        };

        await publishArtifact(testInput);

        expect(templateRenderer.renderFAQ).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should extract FAQ data correctly from draft content', async () => {
      const draftWithFAQ = `# Financial FAQ

## Q1: What is the interest rate?
A1: The current interest rate is 2.5% per annum.

## Q2: How to apply?
A2: You can apply online through our portal.

## Third Question: What are the requirements?
**A3:** You need to be 21 years old and above.`;

      const input = {
        draft: draftWithFAQ,
        ip: 'faq@1.0.0',
        audit: { tags: [], overall_score: 90 },
        retrieval: { flags: {}, candidates: [] },
        metadata: {}
      };

      await publishArtifact(input);

      // Verify FAQ data extraction
      const templateData = (templateRenderer.renderFAQ as jest.Mock).mock.calls[0][0] as any;
      expect(templateData.faq_data).toBeDefined();
      expect(templateData.faq_data).toHaveLength(2);
      expect(templateData.faq_data[0].question).toBe('What is the interest rate?');
      expect(templateData.faq_data[0].answer).toBe('The current interest rate is 2.5% per annum.');
    });
  });

  describe('Retrieval Source Integration', () => {
    it('should integrate retrieval sources in published output', async () => {
      const input = {
        draft: '# Educational Guide\n\nContent with sources.',
        ip: 'guide@1.0.0',
        audit: { tags: [], overall_score: 92 },
        retrieval: {
          flags: { has_edu_source: true, graph_sparse: false },
          candidates: [
            {
              id: 'edu-source-1',
              url: 'https://mas.gov.sg/guidelines',
              confidence: 0.95,
              type: 'educational',
              score: 0.9
            },
            {
              id: 'gov-source-2',
              url: 'https://www.gov.sg/policies',
              confidence: 0.88,
              type: 'government',
              score: 0.85
            },
            {
              id: 'bad-source',
              url: 'https://untrusted-site.com/content',
              confidence: 0.7,
              type: 'blog',
              score: 0.6
            }
          ]
        },
        metadata: { tier: 'MEDIUM' }
      };

      const result = await publishArtifact(input);

      // Should include only compliance-approved sources
      expect(result.ledger.compliance_sources).toHaveLength(2);
      expect(result.ledger.compliance_sources.map(s => s.url)).toEqual([
        'https://mas.gov.sg/guidelines',
        'https://www.gov.sg/policies'
      ]);

      // Sources should be sorted by relevance score
      expect(result.ledger.compliance_sources[0].relevance_score).toBe(0.9);
      expect(result.ledger.compliance_sources[1].relevance_score).toBe(0.85);

      // Frontmatter should include source information
      expect(result.frontmatter.sources_count).toBe(3); // Original count
      expect(result.frontmatter.has_evidence).toBe(true);

      // Ledger retrieval summary
      expect(result.ledger.retrieval_summary.sources_count).toBe(3);
      expect(result.ledger.retrieval_summary.flags.has_edu_source).toBe(true);
    });

    it('should handle empty retrieval candidates gracefully', async () => {
      const input = {
        draft: '# Simple Guide\n\nBasic content.',
        ip: 'guide@1.0.0',
        audit: { tags: [], overall_score: 80 },
        retrieval: {
          flags: {},
          candidates: []
        },
        metadata: {}
      };

      const result = await publishArtifact(input);

      expect(result.ledger.compliance_sources).toHaveLength(0);
      expect(result.frontmatter.has_evidence).toBeUndefined();
      expect(result.frontmatter.sources_count).toBeUndefined();
    });
  });

  describe('Quality Metrics and Provenance Trail', () => {
    it('should generate comprehensive provenance trail', async () => {
      const input = {
        draft: '# Quality Content\n\nHigh quality educational material.',
        ip: 'quality@1.0.0',
        audit: { 
          tags: [
            { tag: 'HIGH_QUALITY', severity: 'info' },
            { tag: 'WELL_STRUCTURED', severity: 'info' }
          ], 
          overall_score: 94 
        },
        retrieval: { flags: {}, candidates: [] },
        metadata: { 
          processing_mode: 'thorough',
          correlation_id: 'quality-test-123'
        }
      };

      const result = await publishArtifact(input);

      // Validate complete generation trace
      const trace = result.ledger.provenance.generation_trace;
      expect(trace).toHaveLength(6);

      // Verify stage order and structure
      expect(trace[0].stage).toBe('planner');
      expect(trace[1].stage).toBe('retrieval');
      expect(trace[2].stage).toBe('generator');
      expect(trace[3].stage).toBe('auditor');
      expect(trace[4].stage).toBe('repairer');
      expect(trace[5].stage).toBe('publisher');

      // All stages should be compliance checked
      trace.forEach(stage => {
        expect(stage.compliance_checked).toBe(true);
        expect(stage.tokens).toBeGreaterThan(0);
        expect(stage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      });

      // Verify timestamps are in chronological order
      for (let i = 1; i < trace.length; i++) {
        expect(new Date(trace[i].timestamp).getTime()).toBeGreaterThan(
          new Date(trace[i-1].timestamp).getTime()
        );
      }

      // Validate extended provenance
      expect(result.ledger.provenance_extended.generated_by).toBe('EIP Orchestrator');
      expect(result.ledger.provenance_extended.version).toBe('1.0.0');
      expect(result.ledger.provenance_extended.quality_assured).toBe(true);
      expect(result.ledger.provenance_extended.compliance_checked).toBe(true);
    });

    it('should calculate quality metrics accurately', async () => {
      const longDraft = '# Comprehensive Guide\n\n' + 
        'This is a very detailed educational guide with substantial content. '.repeat(50);

      const input = {
        draft: longDraft,
        ip: 'comprehensive@1.0.0',
        audit: { 
          tags: [
            { tag: 'ERROR', severity: 'error' },
            { tag: 'LOW_QUALITY', severity: 'warning' }
          ], 
          overall_score: 45 
        },
        retrieval: { flags: {}, candidates: [] },
        metadata: { tier: 'HEAVY' }
      };

      const result = await publishArtifact(input);

      // Word count should be calculated correctly
      expect(result.metrics.word_count).toBeGreaterThan(200);
      expect(result.metrics.content_score).toBe(45);
      expect(result.metrics.compliance_level).toBe('low');

      // Reading time should be reasonable (200 words per minute)
      const expectedReadingTime = Math.ceil(result.metrics.word_count / 200);
      expect(result.metrics.reading_time).toBe(expectedReadingTime);

      // Quality gates should reflect low quality
      expect(result.quality_gates.compliance_rules_checked).toBe(false); // No compliance sources without retrieval candidates
      expect(result.frontmatter.quality_score).toBe(45);
      expect(result.frontmatter.compliance_level).toBe('low');
    });
  });

  describe('Integration with Template Renderer', () => {
    it('should provide complete template data to renderer', async () => {
      const input = {
        draft: '# Template Test\n\nContent for template testing.',
        ip: 'template-test@1.0.0',
        audit: { 
          tags: [{ tag: 'TEMPLATE_TEST', severity: 'info' }], 
          overall_score: 91 
        },
        retrieval: {
          flags: { has_edu_source: true },
          candidates: [
            { id: 'source1', url: 'https://mas.gov.sg/test', confidence: 0.9, type: 'educational' }
          ],
          query_analysis: { domain: 'finance', complexity: 'medium' }
        },
        metadata: { 
          persona: 'professional',
          funnel: 'decision',
          tier: 'MEDIUM'
        }
      };

      await publishArtifact(input);

      const templateData = (templateRenderer.renderArticle as jest.Mock).mock.calls[0][0] as any;

      // Validate template data structure
      expect(templateData.frontmatter).toBeDefined();
      expect(templateData.frontmatter.ip_pattern).toBe('template-test@1.0.0');
      expect(templateData.frontmatter.language).toBe('en');
      expect(templateData.frontmatter.learning_type).toBe('concept');
      expect(templateData.frontmatter.keywords).toContain('template-test');
      expect(templateData.frontmatter.has_evidence).toBe(true);
      expect(templateData.frontmatter.sources_count).toBe(1);
      expect(templateData.frontmatter.content_domain).toBe('finance');
      expect(templateData.frontmatter.query_complexity).toBe('medium');

      // Validate learning objectives
      expect(templateData.frontmatter.learning_objectives).toEqual([
        'Understand core concepts',
        'Apply knowledge practically', 
        'Evaluate different approaches'
      ]);
    });

    it('should handle template rendering errors gracefully', async () => {
      (templateRenderer.renderArticle as jest.Mock).mockReturnValueOnce({
        success: false,
        error: 'Template not found'
      });

      const input = {
        draft: '# Error Test\n\nContent to test error handling.',
        ip: 'error-test@1.0.0',
        audit: { tags: [], overall_score: 75 },
        retrieval: { flags: {}, candidates: [] },
        metadata: {}
      };

      const result = await publishArtifact(input);

      // Should fallback to empty JSON-LD
      expect(result.jsonld).toEqual({});
      expect(result.ledger.provenance_extended.template_used).toBe('article.jsonld.j2');
      expect(result.ledger.provenance_extended.sources_validated).toBe(false);
    });
  });

  describe('Performance and Budget Validation', () => {
    it('should validate performance within budget limits', async () => {
      const input = {
        draft: '# Performance Test\n\nContent optimized for performance testing.',
        ip: 'performance@1.0.0',
        audit: { tags: [], overall_score: 89 },
        retrieval: { flags: {}, candidates: [] },
        metadata: { tier: 'LIGHT' }
      };

      const startTime = Date.now();
      const result = await publishArtifact(input);
      const endTime = Date.now();

      // Performance should be reasonable (under 1 second for this simple case)
      expect(endTime - startTime).toBeLessThan(1000);

      // Performance gate should be respected
      expect(result.quality_gates.performance_budget_respected).toBe(true);

      // Publisher stage should use minimal tokens
      const publisherTrace = result.ledger.provenance.generation_trace
        .find(t => t.stage === 'publisher');
      expect(publisherTrace?.tokens).toBe(15);
    });

    it('should handle different content tiers appropriately', async () => {
      const tiers = ['LIGHT', 'MEDIUM', 'HEAVY'];
      
      for (const tier of tiers) {
        const input = {
          draft: `# ${tier} Content\n\nContent appropriate for ${tier.toLowerCase()} processing.`,
          ip: `${tier.toLowerCase()}-content@1.0.0`,
          audit: { tags: [], overall_score: 85 },
          retrieval: { flags: {}, candidates: [] },
          metadata: { tier }
        };

        const result = await publishArtifact(input);

        // Frontmatter should include tier
        expect(result.frontmatter.tier).toBe(tier);
        
        // Basic functionality should work for all tiers
        expect(result.mdx).toBeDefined();
        expect(result.jsonld).toBeDefined();
        expect(result.ledger).toBeDefined();
        expect(result.quality_gates).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed draft content gracefully', async () => {
      const input = {
        draft: '', // Empty draft
        ip: 'empty-test@1.0.0',
        audit: { tags: [], overall_score: 60 },
        retrieval: { flags: {}, candidates: [] },
        metadata: {}
      };

      const result = await publishArtifact(input);

      // Should still produce valid output structure
      expect(result).toHaveProperty('mdx');
      expect(result).toHaveProperty('jsonld');
      expect(result).toHaveProperty('ledger');
      
      // Title extraction should handle empty content
      expect(result.frontmatter.title).toBeDefined();
    });

    it('should handle missing optional metadata fields', async () => {
      const input = {
        draft: '# Minimal Test\n\nContent with minimal metadata.',
        ip: 'minimal@1.0.0',
        audit: { tags: [], overall_score: 80 },
        retrieval: { flags: {}, candidates: [] }
        // No metadata field at all
      };

      const result = await publishArtifact(input);

      // Should work without metadata
      expect(result.mdx).toBeDefined();
      expect(result.frontmatter.ip_pattern).toBe('minimal@1.0.0');
      expect(result.frontmatter.persona).toBeUndefined();
      expect(result.frontmatter.funnel).toBeUndefined();
      expect(result.frontmatter.tier).toBeUndefined();
    });

    it('should handle audit with missing optional fields', async () => {
      const input = {
        draft: '# Audit Test\n\nContent for audit testing.',
        ip: 'audit-test@1.0.0',
        audit: { tags: [] }, // No overall_score
        retrieval: { flags: {}, candidates: [] },
        metadata: {}
      };

      const result = await publishArtifact(input);

      // Should use default score
      expect(result.metrics.content_score).toBe(75); // Default from calculateMetrics
      expect(result.frontmatter.quality_score).toBeUndefined(); // Only set if provided
      expect(result.metrics.compliance_level).toBe('high'); // Default when no errors or warnings
    });
  });
});
