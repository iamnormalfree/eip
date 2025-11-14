// ABOUTME: BM25 retrieval testing for EIP Steel Thread  
// ABOUTME: Validates content retrieval, search functionality, and integration contracts

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { parallelRetrieve } from '../../orchestrator/retrieval';

describe('BM25 Retrieval System', () => {
  // Mock search results for testing
  const mockCandidates = [
    {
      id: 'test-doc-1',
      content: 'Financial planning requires careful consideration of income, expenses, and long-term goals.',
      source: 'MAS Guidelines',
      score: 0.95,
      metadata: { category: 'financial', domain: 'mas.gov.sg' }
    },
    {
      id: 'test-doc-2', 
      content: 'Investment strategies should align with your risk tolerance and time horizon.',
      source: 'Investment Guide',
      score: 0.87,
      metadata: { category: 'investment', domain: 'education.edu' }
    },
    {
      id: 'test-doc-3',
      content: 'Retirement planning involves estimating future expenses and creating savings strategies.',
      source: 'Retirement Planning',
      score: 0.82,
      metadata: { category: 'retirement', domain: 'mas.gov.sg' }
    }
  ];

  describe('Contract Validation', () => {
    it('should return proper retrieval contract structure', async () => {
      const query = { query: 'financial planning for retirement' };
      
      const result = await parallelRetrieve(query);
      
      // Validate contract structure
      expect(result).toHaveProperty('candidates');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('query_analysis');
      
      expect(Array.isArray(result.candidates)).toBe(true);
      expect(typeof result.flags).toBe('object');
      expect(typeof result.query_analysis).toBe('object');
    });

    it('should validate candidate structure compliance', async () => {
      const query = { query: 'test query' };
      
      const result = await parallelRetrieve(query);
      
      result.candidates.forEach((candidate: any, index: number) => {
        expect(candidate).toHaveProperty('id');
        expect(candidate).toHaveProperty('content');
        expect(candidate).toHaveProperty('source');
        expect(candidate).toHaveProperty('score');
        
        expect(typeof candidate.id).toBe('string');
        expect(typeof candidate.content).toBe('string');
        expect(typeof candidate.source).toBe('string');
        expect(typeof candidate.score).toBe('number');
        expect(candidate.score).toBeGreaterThanOrEqual(0);
        expect(candidate.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should handle simple queries', async () => {
      const query = { query: 'investment strategies' };
      
      const result = await parallelRetrieve(query);
      
      expect(result.query_analysis.original_query).toBe('investment strategies');
      expect(result.flags.query_complexity).toBe('simple');
      expect(result.candidates.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex queries with multiple entities', async () => {
      const complexQuery = {
        query: 'comprehensive financial planning for retirement in Singapore with MAS guidelines',
        context: {
          user_location: 'Singapore',
          planning_stage: 'research'
        }
      };
      
      const result = await parallelRetrieve(complexQuery);
      
      expect(result.flags.query_complexity).toBe('complex');
      expect(result.query_analysis.entities).toContain('singapore');
      expect(result.query_analysis.entities).toContain('mas');
    });
  });

  describe('Compliance and Quality', () => {
    it('should prioritize MAS and .gov sources', async () => {
      const query = { query: 'regulatory compliance' };
      
      const result = await parallelRetrieve(query);
      
      expect(result.flags.has_mas_source).toBe(true);
      expect(result.flags.has_gov_source).toBe(true);
      
      // Verify MAS sources are ranked higher
      const masSources = result.candidates.filter((c: any) => 
        c.metadata?.domain === 'mas.gov.sg'
      );
      expect(masSources.length).toBeGreaterThan(0);
      expect(masSources[0].score).toBeGreaterThan(0.9);
    });

    it('should handle domain validation for compliance', async () => {
      const query = { query: 'educational content validation' };
      
      const result = await parallelRetrieve(query);
      
      expect(result.flags.has_edu_source).toBe(true);
      expect(result.query_analysis.domain_validation.compliant_domains).toContain('nus.edu.sg');
    });
  });

  describe('Performance and Scaling', () => {
    it('should handle retrieval performance within acceptable limits', async () => {
      const query = { query: 'performance testing query' };
      
      const startTime = Date.now();
      
      const result = await parallelRetrieve(query);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeDefined();
    });

    it('should handle cache scenarios appropriately', async () => {
      const query = { query: 'cached query test' };
      
      const result = await parallelRetrieve(query);
      
      expect(result.performance.cache_hit).toBe(true);
      expect(result.performance.search_time_ms).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty queries gracefully', async () => {
      const emptyQuery = { query: '' };
      
      const result = await parallelRetrieve(emptyQuery);
      
      expect(result.candidates).toHaveLength(0);
      expect(result.flags.error_handled).toBe(true);
    });

    it('should handle malformed queries without crashing', async () => {
      const malformedQuery = { 
        query: null as any,
        invalid_field: 'should be ignored'
      };
      
      const result = await parallelRetrieve(malformedQuery);
      
      expect(result.flags.error_handled).toBe(true);
      expect(result.query_analysis.recovery_successful).toBe(true);
    });
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });
});
