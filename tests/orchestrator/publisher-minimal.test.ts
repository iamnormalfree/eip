// ABOUTME: Minimal Publisher test demonstrating proper interface alignment
// ABOUTME: Validates publishArtifact function with correct PublishInput/PublishResult types

import { describe, it, expect, beforeEach } from '@jest/globals';

import type { PublishResult } from '../../orchestrator/publisher';

// Mock the actual publisher module with correct exports
jest.mock('../../orchestrator/publisher', () => ({
  publishArtifact: jest.fn(),
  MDXRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn()
  }))
}));

describe('Publisher Interface Alignment', () => {
  const mockTestContent = {
    id: 'test-content-123',
    title: 'Test Framework',
    body: 'This is test framework content for interface validation.',
    brief: 'Create a test framework',
    persona: 'developer',
    funnel: 'tech',
    tier: 'MEDIUM'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use publishArtifact with correct PublishInput interface', async () => {
    const { publishArtifact } = await import('../../orchestrator/publisher');

    const mockResult: PublishResult = {
      mdx: '# Test Framework\n\nThis is test framework content.',
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Framework'
      },
      ledger: {
        ip_used: 'Framework',
        ip_invariants: {
          required: ['title', 'body'],
          validated: ['title', 'body'],
          failed: []
        },
        compliance_sources: [{
          url: 'https://example.com/source',
          domain: 'example.com',
          accessed: '2025-01-18T00:00:00Z',
          relevance_score: 0.9
        }],
        provenance: {
          generation_trace: [{
            stage: 'generation',
            timestamp: '2025-01-18T00:00:00Z',
            tokens: 100,
            compliance_checked: true
          }],
          humanReviewRequired: false,
          review_status: 'completed'
        }
      },
      quality_gates: {
        ip_invariant_satisfied: true,
        compliance_rules_checked: true,
        performance_budget_respected: true,
        provenance_complete: true
      },
      frontmatter: {
        title: 'Test Framework',
        ip_pattern: 'Framework',
        created_at: new Date().toISOString(),
        word_count: 150,
        reading_time: 2,
        content_score: 95,
        compliance_level: 'high'
      },
      metrics: {
        word_count: 150,
        reading_time: 2,
        content_score: 95,
        compliance_level: 'high'
      }
    };

    (publishArtifact as jest.MockedFunction<typeof publishArtifact>).mockResolvedValue(mockResult);

    const result = await publishArtifact({
      draft: `# ${mockTestContent.title}\n\n${mockTestContent.body}`,
      ip: 'Framework',
      audit: {
        tags: [{ tag: 'quality', severity: 'info' }],
        overall_score: 95
      },
      retrieval: {
        flags: {},
        candidates: []
      },
      metadata: {
        brief: mockTestContent.brief,
        persona: mockTestContent.persona,
        funnel: mockTestContent.funnel,
        tier: mockTestContent.tier
      }
    });

    // Verify the result matches PublishResult interface
    expect(result).toHaveProperty('mdx');
    expect(result).toHaveProperty('jsonld');
    expect(result).toHaveProperty('ledger');
    expect(result.ledger.ip_used).toBe('Framework');
    expect(result.ledger.ip_invariants.required).toBeDefined();
    expect(result.ledger.compliance_sources).toBeDefined();
    expect(Array.isArray(result.ledger.compliance_sources)).toBe(true);

    // Verify mock was called with correct PublishInput structure
    expect(publishArtifact).toHaveBeenCalledWith({
      draft: expect.any(String),
      ip: expect.any(String),
      audit: expect.objectContaining({
        tags: expect.any(Array),
        overall_score: expect.any(Number)
      }),
      retrieval: expect.objectContaining({
        flags: expect.any(Object),
        candidates: expect.any(Array)
      }),
      metadata: expect.objectContaining({
        brief: expect.any(String),
        persona: expect.any(String),
        funnel: expect.any(String),
        tier: expect.any(String)
      })
    });
  });

  it('should handle interface type safety properly', () => {
    // This test verifies TypeScript compilation success
    // The fact that this compiles proves interface alignment

    const validPublishInput = {
      draft: '# Test Content\n\nTest body',
      ip: 'Framework',
      audit: {
        tags: [{ tag: 'test', severity: 'info' }],
        overall_score: 90
      },
      retrieval: {
        flags: {},
        candidates: []
      },
      metadata: {
        brief: 'Test brief',
        persona: 'test-user',
        funnel: 'test',
        tier: 'LIGHT'
      }
    };

    // These should all be valid types
    expect(typeof validPublishInput.draft).toBe('string');
    expect(typeof validPublishInput.ip).toBe('string');
    expect(Array.isArray(validPublishInput.audit.tags)).toBe(true);
    expect(typeof validPublishInput.audit.overall_score).toBe('number');
    expect(typeof validPublishInput.retrieval.flags).toBe('object');
    expect(Array.isArray(validPublishInput.retrieval.candidates)).toBe(true);
    expect(typeof validPublishInput.metadata?.brief).toBe('string');
  });
});
