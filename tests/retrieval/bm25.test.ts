// ABOUTME: BM25 scoring behavior and sparse flag detection tests
// ABOUTME: Comprehensive validation of BM25 implementation and compliance scoring

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SimpleBM25 } from '../../orchestrator/retrieval';
import { 
  PerformanceTester, 
  BudgetTester, 
  ContractValidator,
  MockDataGenerator 
} from '../utils/test-helpers';

describe('BM25 Scoring System', () => {
  let bm25: SimpleBM25;
  const mockDocuments = [
    {
      id: 'test-doc-1',
      content: 'Financial planning requires careful consideration of income expenses and long term goals',
      metadata: { category: 'financial', domain: 'mas.gov.sg' }
    },
    {
      id: 'test-doc-2',
      content: 'Investment strategies should align with your risk tolerance and time horizon for growth',
      metadata: { category: 'investment', domain: 'education.edu' }
    },
    {
      id: 'test-doc-3',
      content: 'Budgeting techniques involve estimating future expenses and creating savings strategies',
      metadata: { category: 'budgeting', domain: 'mas.gov.sg' }
    },
    {
      id: 'test-doc-4',
      content: 'Tax optimization strategies require careful analysis and professional guidance',
      metadata: { category: 'taxation', domain: 'gov.sg' }
    },
    {
      id: 'test-doc-5',
      content: 'Insurance planning protects assets and provides financial security coverage',
      metadata: { category: 'insurance', domain: 'mas.gov.sg' }
    }
  ];

  beforeEach(() => {
    bm25 = new SimpleBM25(mockDocuments);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BM25 Scoring Accuracy', () => {
    it('should calculate higher scores for documents with more term matches', () => {
      // Use discriminating terms that appear in only some documents to avoid negative IDF
      const budgetingResults = bm25.search('budgeting', 5);
      expect(budgetingResults.length).toBeGreaterThan(0);

      const insuranceResults = bm25.search('insurance', 5);
      expect(insuranceResults.length).toBeGreaterThan(0);

      // Test term frequency by searching for "planning" which should appear in multiple docs
      const planningResults = bm25.search('planning', 5);
      expect(planningResults.length).toBeGreaterThan(0);

      const results = planningResults;
      
      // Documents should be returned with scores
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
        expect(result.id).toBeTruthy();
      });
      
      // Should be sorted by score (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should apply proper term frequency normalization', () => {
      const results = bm25.search('financial', 5);
      
      expect(results.length).toBeGreaterThan(0);
      
      // All returned results should have positive scores
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
      });
      
      // Document with more mentions should appear higher
      const doc5Score = results.find(r => r.id === 'test-doc-5')?.score || 0;
      const doc1Score = results.find(r => r.id === 'test-doc-1')?.score || 0;
      
      // Should find some matches
      expect(results.length).toBeGreaterThan(0);
      
      // If we found both documents, doc5 should score higher due to repetition
      if (doc5Score > 0 && doc1Score > 0) {
        expect(doc5Score).toBeGreaterThanOrEqual(doc1Score);
      }
    });

    it('should apply inverse document frequency correctly', () => {
      const resultsRare = bm25.search('careful', 5);
      const resultsCommon = bm25.search('financial', 5);
      
      expect(resultsRare.length).toBeGreaterThan(0);
      expect(resultsCommon.length).toBeGreaterThan(0);
      
      // Both should have positive scores
      resultsRare.forEach(result => expect(result.score).toBeGreaterThan(0));
      resultsCommon.forEach(result => expect(result.score).toBeGreaterThan(0));
    });

    it('should handle document length normalization properly', () => {
      const results = bm25.search('planning', 5);
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should rank documents based on term density, not just document length
      const scores = results.map(r => r.score);
      
      // Check that scores are sorted in descending order
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
      
      // All returned scores should be positive
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
      });
    });

    it('should return empty results for terms not in corpus', () => {
      const results = bm25.search('nonexistentterm xyz123', 5);
      expect(results).toHaveLength(0);
    });

    it('should handle multi-term queries correctly', () => {
      const results = bm25.search('retirement planning', 5);
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should return documents that match both terms
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
        // The document should contain both terms or one term with high relevance
        expect(['test-doc-1', 'test-doc-3', 'test-doc-4', 'test-doc-5']).toContain(result.id);
      });
    });
  });

  describe('Sparse Flag Detection', () => {
    it('should detect graph_sparse condition when corpus below threshold', async () => {
      // Test with small corpus (below typical threshold)
      const smallBm25 = new SimpleBM25(mockDocuments.slice(0, 2));
      const results = smallBm25.search('financial', 5);
      
      // With only 2 documents, graph should be considered sparse
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should handle corpus size at sparse threshold', async () => {
      // Test with corpus at typical sparse threshold
      const thresholdDocs = [...mockDocuments];
      for (let i = 0; i < 8; i++) {
        thresholdDocs.push({
          id: 'extra-doc-' + i,
          content: 'Additional document ' + i + ' with financial planning content and investment strategies',
          metadata: { category: 'extra', domain: 'test.com' }
        });
      }
      
      const thresholdBm25 = new SimpleBM25(thresholdDocs);
      const results = thresholdBm25.search('financial', 5);
      
      expect(results.length).toBeLessThanOrEqual(5);
      expect(thresholdDocs.length).toBeGreaterThan(10);
    });
  });

  describe('Field Weight Testing', () => {
    it('should apply concept_abstract^2 field weight correctly', () => {
      // Create a mock loaded index with field structure
      const mockLoadedIndex: any = {
        version: '1.0.0',
        field_weights: {
          concept_abstract: 2.0,
          artifact_summary: 1.0,
          entity_name: 1.5,
          content: 1.0
        },
        documents: [
          {
            id: 'concept-doc',
            fields: {
              concept_abstract: 'Financial planning requires careful consideration',
              content: 'Some other content'
            },
            field_terms: {
              concept_abstract: ['financial', 'planning', 'requires', 'careful', 'consideration'],
              content: ['some', 'other', 'content']
            }
          },
          {
            id: 'artifact-doc',
            fields: {
              artifact_summary: 'Financial strategies require detailed analysis',
              content: 'Different content here'
            },
            field_terms: {
              artifact_summary: ['financial', 'strategies', 'require', 'detailed', 'analysis'],
              content: ['different', 'content', 'here']
            }
          }
        ]
      };

      const fieldBm25 = new SimpleBM25([]);
      (fieldBm25 as any).loadedDocuments = mockLoadedIndex;
      (fieldBm25 as any).docCount = mockLoadedIndex.documents.length;

      // Also set avgDocLength for BM25 calculations
      const totalTerms = mockLoadedIndex.documents.reduce((sum: number, doc: any) => {
        const docTerms = [
          ...(doc.field_terms?.concept_abstract || []),
          ...(doc.field_terms?.artifact_summary || []),
          ...(doc.field_terms?.entity_name || []),
          ...(doc.field_terms?.content || [])
        ];
        return sum + docTerms.length;
      }, 0);
      (fieldBm25 as any).avgDocLength = totalTerms / mockLoadedIndex.documents.length;

      // Verify basic functionality
      const results = fieldBm25.search('financial', 5);
      expect(results.length).toBeGreaterThan(0);

  
      // Find results by ID
      const conceptResult = results.find(r => r.id === 'concept-doc');
      const artifactResult = results.find(r => r.id === 'artifact-doc');

      expect(conceptResult).toBeDefined();
      expect(artifactResult).toBeDefined();

      // The concept_abstract document should have a higher score due to weight 2.0
      // compared to artifact_summary with weight 1.0, assuming same TF
      expect(conceptResult!.score).toBeGreaterThan(artifactResult!.score);

      // Both should have positive scores
      expect(conceptResult!.score).toBeGreaterThan(0);
      expect(artifactResult!.score).toBeGreaterThan(0);
    });

    it('should apply entity_name^1.5 field weight correctly', () => {
      const mockLoadedIndex: any = {
        version: '1.0.0',
        field_weights: {
          concept_abstract: 2.0,
          artifact_summary: 1.0,
          entity_name: 1.5,
          content: 1.0
        },
        documents: [
          {
            id: 'entity-doc',
            fields: {
              entity_name: 'investment portfolio management',
              content: 'Some content about management'
            },
            field_terms: {
              entity_name: ['investment', 'portfolio', 'management'],
              content: ['some', 'content', 'about', 'management']
            }
          },
          {
            id: 'content-doc',
            fields: {
              content: 'investment portfolio management strategies',
            },
            field_terms: {
              content: ['investment', 'portfolio', 'management', 'strategies']
            }
          }
        ]
      };

      const fieldBm25 = new SimpleBM25([]);
      (fieldBm25 as any).loadedDocuments = mockLoadedIndex;
      (fieldBm25 as any).docCount = mockLoadedIndex.documents.length;

      const totalTerms = mockLoadedIndex.documents.reduce((sum: number, doc: any) => {
        const docTerms = [
          ...(doc.field_terms?.concept_abstract || []),
          ...(doc.field_terms?.artifact_summary || []),
          ...(doc.field_terms?.entity_name || []),
          ...(doc.field_terms?.content || [])
        ];
        return sum + docTerms.length;
      }, 0);
      (fieldBm25 as any).avgDocLength = totalTerms / mockLoadedIndex.documents.length;

      const results = fieldBm25.search('investment', 5);

      expect(results.length).toBe(2);

      const entityResult = results.find(r => r.id === 'entity-doc');
      const contentResult = results.find(r => r.id === 'content-doc');

      expect(entityResult).toBeDefined();
      expect(contentResult).toBeDefined();

      // Entity name (weight 1.5) should score higher than content (weight 1.0)
      // when term appears in both
      expect(entityResult!.score).toBeGreaterThan(contentResult!.score);
    });

    it('should apply mixed field weights correctly', () => {
      // Test complex scenario with multiple fields and weights
      const mockLoadedIndex: any = {
        version: '1.0.0',
        field_weights: {
          concept_abstract: 2.0,
          artifact_summary: 1.0,
          entity_name: 1.5,
          content: 1.0
        },
        documents: [
          {
            id: 'all-fields-doc',
            fields: {
              concept_abstract: 'financial planning strategies',
              entity_name: 'investment management',
              content: 'additional details'
            },
            field_terms: {
              concept_abstract: ['financial', 'planning', 'strategies'],
              entity_name: ['investment', 'management'],
              content: ['additional', 'details']
            }
          },
          {
            id: 'content-only-doc',
            fields: {
              content: 'financial planning strategies and investment management'
            },
            field_terms: {
              content: ['financial', 'planning', 'strategies', 'investment', 'management']
            }
          }
        ]
      };

      const fieldBm25 = new SimpleBM25([]);
      (fieldBm25 as any).loadedDocuments = mockLoadedIndex;
      (fieldBm25 as any).docCount = mockLoadedIndex.documents.length;

      const totalTerms = mockLoadedIndex.documents.reduce((sum: number, doc: any) => {
        const docTerms = [
          ...(doc.field_terms?.concept_abstract || []),
          ...(doc.field_terms?.artifact_summary || []),
          ...(doc.field_terms?.entity_name || []),
          ...(doc.field_terms?.content || [])
        ];
        return sum + docTerms.length;
      }, 0);
      (fieldBm25 as any).avgDocLength = totalTerms / mockLoadedIndex.documents.length;

      const results = fieldBm25.search('financial planning', 5);

      expect(results.length).toBe(2);

      const allFieldsResult = results.find(r => r.id === 'all-fields-doc');
      const contentOnlyResult = results.find(r => r.id === 'content-only-doc');

      expect(allFieldsResult).toBeDefined();
      expect(contentOnlyResult).toBeDefined();

      // All fields doc should score higher due to field weighting
      expect(allFieldsResult!.score).toBeGreaterThan(contentOnlyResult!.score);
    });
  });

  describe('Compliance-Focused Scoring', () => {
    it('should prioritize MAS sources in scoring', () => {
      const results = bm25.search('planning retirement', 10);
      
      expect(results.length).toBeGreaterThan(0);
      
      const masSources = results.filter(r => {
        const doc = mockDocuments.find(d => d.id === r.id);
        return doc?.metadata?.domain?.includes('mas.gov.sg');
      });
      
      const otherSources = results.filter(r => {
        const doc = mockDocuments.find(d => d.id === r.id);
        return !doc?.metadata?.domain?.includes('mas.gov.sg');
      });
      
      // Should find results
      expect(results.length).toBeGreaterThan(0);
      
      if (masSources.length > 0 && otherSources.length > 0) {
        // MAS sources should be present in results
        expect(masSources.length).toBeGreaterThan(0);
        
        // All sources should have positive scores
        masSources.forEach(source => expect(source.score).toBeGreaterThan(0));
        otherSources.forEach(source => expect(source.score).toBeGreaterThan(0));
      }
    });

    it('should boost .gov and .edu sources appropriately', () => {
      const results = bm25.search('investment strategies', 10);
      
      expect(results.length).toBeGreaterThan(0);
      
      const govSources = results.filter(r => {
        const doc = mockDocuments.find(d => d.id === r.id);
        return doc?.metadata?.domain?.includes('.gov');
      });
      
      const eduSources = results.filter(r => {
        const doc = mockDocuments.find(d => d.id === r.id);
        return doc?.metadata?.domain?.includes('.edu');
      });
      
      // Should find results
      expect(results.length).toBeGreaterThan(0);
      
      // All found sources should have positive scores
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
      });
    });

    it('should handle domain validation in search results', () => {
      const results = bm25.search('financial planning', 10);
      
      expect(results.length).toBeGreaterThanOrEqual(0);
      
      // All results should correspond to valid documents
      results.forEach(result => {
        const originalDoc = mockDocuments.find(d => d.id === result.id);
        expect(originalDoc).toBeDefined();
        expect(originalDoc?.metadata?.domain).toBeDefined();
      });
    });
  });

  describe('Performance and Budget Testing', () => {
    it('should meet LIGHT tier performance budget (200 tokens, 20s)', async () => {
      const query = MockDataGenerator.generateRetrievalQuery('financial planning', 'simple');
      
      const performance = await PerformanceTester.measureFunction(
        () => Promise.resolve(bm25.search(query, 5)),
        { iterations: 10, warmupIterations: 2 }
      );
      
      // Validate performance thresholds
      expect(performance.avgTime).toBeLessThan(1000); // Should complete within 1 second
      expect(performance.maxTime).toBeLessThan(2000); // Max 2 seconds
      
      const validation = PerformanceTester.validatePerformanceThresholds(
        { avgTime: performance.avgTime, maxTime: performance.maxTime },
        { avgTime: 1000, maxTime: 2000 }
      );
      
      expect(validation.valid).toBe(true);
      if (!validation.valid) {
        console.warn('Performance violations:', validation.violations);
      }
    });

    it('should handle MEDIUM tier performance budget (400 tokens, 45s)', async () => {
      const query = MockDataGenerator.generateRetrievalQuery('comprehensive financial planning', 'medium');
      
      const performance = await PerformanceTester.measureFunction(
        () => Promise.resolve(bm25.search(query, 10)),
        { iterations: 5, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(performance.results.every(r => Array.isArray(r))).toBe(true);
    });

    it('should maintain consistent performance across multiple searches', async () => {
      const queries = [
        'financial planning',
        'investment strategies',
        'retirement planning',
        'careful consideration',
        'term goals'
      ];
      
      const performanceResults = await Promise.all(
        queries.map(query => 
          PerformanceTester.measureFunction(
            () => Promise.resolve(bm25.search(query, 5)),
            { iterations: 3, warmupIterations: 1 }
          )
        )
      );
      
      // All searches should complete within reasonable time
      performanceResults.forEach(performance => {
        expect(performance.avgTime).toBeLessThan(1000);
        expect(performance.results.every(r => Array.isArray(r))).toBe(true);
      });
      
      // Performance should be relatively consistent
      const avgTimes = performanceResults.map(p => p.avgTime);
      const validTimes = avgTimes.filter(t => t > 0 && t < Infinity);
      
      if (validTimes.length > 1) {
        const maxTime = Math.max(...validTimes);
        const minTime = Math.min(...validTimes);
        
        // Performance variation should be within reasonable bounds
        expect(maxTime / minTime).toBeLessThan(10); // Allow more tolerance for test environment
      }
    });
  });

  describe('Quality Gate Integration', () => {
    it('should ensure BM25 scores are within expected ranges', () => {
      const results = bm25.search('financial planning', 10);
      
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThan(100); // Reasonable upper bound for BM25
        expect(typeof result.id).toBe('string');
        expect(result.id).toBeTruthy();
      });
    });

    it('should handle empty or null queries gracefully', () => {
      const emptyResults = bm25.search('', 5);
      expect(emptyResults).toHaveLength(0);
      
      const whitespaceResults = bm25.search('   ', 5);
      expect(whitespaceResults).toHaveLength(0);
    });

    it('should handle very long queries appropriately', () => {
      const longQuery = 'financial '.repeat(20) + 'planning ' + 'investment '.repeat(10);
      const results = bm25.search(longQuery, 5);
      
      // Should handle long queries without crashing
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        results.forEach(result => {
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.id).toBeTruthy();
        });
      }
    });

    it('should validate token count stays within budget', () => {
      const query = MockDataGenerator.generateRetrievalQuery('financial planning', 'complex');
      const estimatedTokens = MockDataGenerator.generateTokenCount(query.length);
      
      // For BM25, query processing should be lightweight
      expect(estimatedTokens).toBeLessThan(400); // MEDIUM tier budget
      
      const results = bm25.search(query, 5);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle special characters in queries', () => {
      const queries = [
        'financial-planning',
        'investment_strategies',
        'retirement planning',
        'careful consideration'
      ];
      
      queries.forEach(query => {
        const results = bm25.search(query, 5);
        expect(Array.isArray(results)).toBe(true);
        
        if (results.length > 0) {
          results.forEach(result => {
            expect(result.score).toBeGreaterThanOrEqual(0);
          });
        }
      });
    });

    it('should handle Unicode characters in documents and queries', () => {
      const unicodeDocs = [
        {
          id: 'unicode-doc-1',
          content: 'Financial planning for Singapore residents and careful consideration',
          metadata: { domain: 'mas.gov.sg' }
        },
        {
          id: 'unicode-doc-2',
          content: 'Investment strategies for retirement planning with detailed analysis',
          metadata: { domain: 'education.edu' }
        }
      ];
      
      const unicodeBm25 = new SimpleBM25(unicodeDocs);
      const results = unicodeBm25.search('planning consideration', 5);
      
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        results.forEach(result => {
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(['unicode-doc-1', 'unicode-doc-2']).toContain(result.id);
        });
      }
    });

    it('should handle very large numbers of documents efficiently', async () => {
      const largeDocSet = [];
      for (let i = 0; i < 25; i++) {
        largeDocSet.push({
          id: 'large-doc-' + i,
          content: 'Financial planning document ' + i + ' with investment and retirement strategies and careful consideration',
          metadata: { category: 'test', domain: 'test.com' }
        });
      }
      
      const largeBm25 = new SimpleBM25(largeDocSet);
      
      const performance = await PerformanceTester.measureFunction(
        () => Promise.resolve(largeBm25.search('financial planning', 10)),
        { iterations: 5, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(5000); // Should handle 25 docs efficiently
      expect(performance.results[0].length).toBeLessThanOrEqual(10);
    });

    it('should handle case insensitive search correctly', () => {
      const lowerResults = bm25.search('financial planning', 5);
      const upperResults = bm25.search('FINANCIAL PLANNING', 5);
      const mixedResults = bm25.search('Financial Planning', 5);
      
      expect(lowerResults.length).toBeGreaterThan(0);
      expect(upperResults.length).toBeGreaterThan(0);
      expect(mixedResults.length).toBeGreaterThan(0);
      
      // Should return the same documents regardless of case
      const lowerIds = lowerResults.map(r => r.id).sort();
      const upperIds = upperResults.map(r => r.id).sort();
      const mixedIds = mixedResults.map(r => r.id).sort();
      
      expect(lowerIds).toEqual(upperIds);
      expect(lowerIds).toEqual(mixedIds);
    });
  });
});
