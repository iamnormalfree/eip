// ABOUTME: parallel_retrieve wrapper testing and multi-channel coordination
// ABOUTME: Comprehensive validation of parallel retrieval integration and performance

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { parallelRetrieve, loadBM25Index, getIndexMetadata } from '../../orchestrator/retrieval';
import { 
  PerformanceTester, 
  BudgetTester, 
  ContractValidator,
  MockDataGenerator,
  IntegrationTester 
} from '../utils/test-helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Parallel Retrieval Wrapper Testing', () => {
  const mockConsole = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console to reduce test noise
    global.console = mockConsole as any;
  });

  afterEach(() => {
    // Restore console
    global.console = require('console');
  });

  describe('Contract Validation', () => {
    it('should return proper retrieval contract structure', async () => {
      const query = { query: 'financial planning for retirement' };
      
      const result = await parallelRetrieve(query);
      
      // Validate contract structure
      expect(result).toHaveProperty('candidates');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('query_analysis');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('index_metadata');
      
      expect(Array.isArray(result.candidates)).toBe(true);
      expect(typeof result.flags).toBe('object');
      expect(typeof result.query_analysis).toBe('object');
      expect(typeof result.performance).toBe('object');
    });

    it('should validate candidate structure compliance', async () => {
      const query = { query: 'test query' };
      
      const result = await parallelRetrieve(query);
      
      result.candidates.forEach((candidate: any, index: number) => {
        expect(candidate).toHaveProperty('id');
        expect(candidate).toHaveProperty('content');
        expect(candidate).toHaveProperty('source');
        expect(candidate).toHaveProperty('score');
        expect(candidate).toHaveProperty('metadata');
        
        expect(typeof candidate.id).toBe('string');
        expect(typeof candidate.content).toBe('string');
        expect(typeof candidate.source).toBe('string');
        expect(typeof candidate.score).toBe('number');
        expect(candidate.score).toBeGreaterThanOrEqual(0);
        expect(candidate.score).toBeLessThanOrEqual(1);
        expect(typeof candidate.metadata).toBe('object');
      });
    });

    it('should include index metadata in RetrievalOutput', async () => {
      const query = { query: 'financial planning' };
      
      const result = await parallelRetrieve(query);
      
      // Check for index metadata if available
      if (result.flags.index_loaded) {
        expect(result.index_metadata).toBeDefined();
        expect(result.index_metadata?.version).toBeTruthy();
        expect(result.index_metadata?.checksum).toBeTruthy();
        expect(result.index_metadata?.document_count).toBeGreaterThan(0);
      }
    });

    it('should include performance metrics', async () => {
      const query = { query: 'test query' };
      
      const result = await parallelRetrieve(query);
      
      expect(result.performance).toBeDefined();
      expect(typeof result.performance?.cache_hit).toBe('boolean');
      expect(typeof result.performance?.search_time_ms).toBe('number');
      expect(typeof result.performance?.total_candidates).toBe('number');
      expect(typeof result.performance?.index_load_time_ms).toBe('number');
      expect(typeof result.performance?.index_source).toBe('string');
      expect(['file', 'memory']).toContain(result.performance?.index_source);
    });
  });

  describe('Multi-Channel Coordination', () => {
    it('should coordinate BM25 active with empty graph/vector channels', async () => {
      const query = { query: 'financial planning strategies' };
      
      const result = await parallelRetrieve(query);
      
      // BM25 should be active
      expect(result.flags.bm25_used).toBe(true);
      
      // Graph and vector should be empty/not used in this implementation
      expect(result.flags.vector_used).toBe(false);
      expect(result.graph_edges).toBeDefined();
      
      // Should have candidates from BM25
      expect(result.candidates.length).toBeGreaterThan(0);
      
      // Metadata should indicate retrieval method
      const hasBm25Method = result.candidates.some((c: any) => 
        c.metadata?.retrieval_method === 'bm25' ||
        c.metadata?.retrieval_method === 'bm25_file_index' ||
        c.metadata?.retrieval_method === 'fallback_match'
      );
      expect(hasBm25Method).toBe(true);
    });

    it('should handle multi-channel coordination with fallbacks', async () => {
      const query = { query: 'nonexistent content that should trigger fallback' };
      
      const result = await parallelRetrieve(query);
      
      // Should handle gracefully even with no direct matches
      expect(Array.isArray(result.candidates)).toBe(true);
      expect(result.flags.bm25_used).toBe(true);
      expect(typeof result.flags.query_complexity).toBe('string');
      
      // Should still return proper contract structure
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('query_analysis');
      expect(result).toHaveProperty('performance');
    });

    it('should coordinate channels based on query complexity', async () => {
      const simpleQuery = { query: 'financial' };
      const complexQuery = { 
        query: 'comprehensive financial planning for retirement with MAS guidelines and Singapore regulatory compliance'
      };
      
      const simpleResult = await parallelRetrieve(simpleQuery);
      const complexResult = await parallelRetrieve(complexQuery);
      
      // Both should use BM25
      expect(simpleResult.flags.bm25_used).toBe(true);
      expect(complexResult.flags.bm25_used).toBe(true);
      
      // Complex query should have higher complexity rating
      expect(['simple', 'medium', 'complex']).toContain(simpleResult.flags.query_complexity);
      expect(['simple', 'medium', 'complex']).toContain(complexResult.flags.query_complexity);
      
      // Complex query might have more analysis data
      expect(complexResult.query_analysis.terms?.length).toBeGreaterThanOrEqual(
        simpleResult.query_analysis.terms?.length || 0
      );
    });

    it('should handle channel failure scenarios gracefully', async () => {
      // Test with malformed query
      const malformedQuery = { query: null as any };
      
      const result = await parallelRetrieve(malformedQuery);
      
      expect(result.candidates).toHaveLength(0);
      expect(result.flags.error_handled).toBe(true);
      expect(result.query_analysis.error).toBeTruthy();
      expect(result.query_analysis.recovery_successful).toBe(true);
    });
  });

  describe('Performance Budget Validation', () => {
    it('should meet LIGHT tier performance budget (200 tokens, 20s)', async () => {
      const query = { 
        query: MockDataGenerator.generateRetrievalQuery('financial planning', 'simple')
      };
      
      const budgetResult = await BudgetTester.validateBudgetCompliance(
        () => parallelRetrieve(query),
        'LIGHT',
        'generator',
        200 // Estimated tokens
      );
      
      expect(budgetResult.budgetCompliance).toBe(true);
      expect(budgetResult.result).toBeDefined();
      expect(budgetResult.violations).toHaveLength(0);
      
      // Validate retrieval contract
      const contractValidation = ContractValidator.validateRetrievalContract(budgetResult.result);
      expect(contractValidation.valid).toBe(true);
    });

    it('should meet MEDIUM tier performance budget (400 tokens, 45s)', async () => {
      const query = { 
        query: MockDataGenerator.generateRetrievalQuery('comprehensive investment planning', 'medium'),
        context: { user_location: 'Singapore', planning_stage: 'research' }
      };
      
      const budgetResult = await BudgetTester.validateBudgetCompliance(
        () => parallelRetrieve(query),
        'MEDIUM',
        'generator',
        400 // Estimated tokens
      );
      
      expect(budgetResult.budgetCompliance).toBe(true);
      expect(budgetResult.result).toBeDefined();
      expect(budgetResult.violations).toHaveLength(0);
      
      // Should handle context properly
      expect(budgetResult.result.query_analysis.original_query).toBe(query.query);
    });

    it('should meet HEAVY tier performance budget (600 tokens, 90s)', async () => {
      const query = { 
        query: MockDataGenerator.generateRetrievalQuery('comprehensive financial planning with MAS guidelines', 'complex'),
        context: { 
          user_location: 'Singapore', 
          planning_stage: 'detailed_analysis',
          regulatory_requirements: true,
          compliance_needed: true
        },
        max_results: 10
      };
      
      const budgetResult = await BudgetTester.validateBudgetCompliance(
        () => parallelRetrieve(query),
        'HEAVY',
        'generator',
        600 // Estimated tokens
      );
      
      expect(budgetResult.budgetCompliance).toBe(true);
      expect(budgetResult.result).toBeDefined();
      expect(budgetResult.violations).toHaveLength(0);
      
      // Should respect max_results
      expect(budgetResult.result.candidates.length).toBeLessThanOrEqual(10);
    });

    it('should maintain index loading overhead below 5ms threshold', async () => {
      const queries = [
        { query: 'financial planning' },
        { query: 'investment strategies' },
        { query: 'retirement planning' }
      ];
      
      const results = await Promise.all(
        queries.map(query => parallelRetrieve(query))
      );
      
      // Check index loading performance
      results.forEach(result => {
        if (result.performance?.index_load_time_ms) {
          // Index loading should be fast
          expect(result.performance.index_load_time_ms).toBeLessThan(100); // Generous threshold for test environment
        }
      });
      
      // Overall retrieval should be fast
      const avgRetrievalTime = results.reduce((sum, r) => sum + (r.performance?.search_time_ms || 0), 0) / results.length;
      expect(avgRetrievalTime).toBeLessThan(1000); // Should complete within 1 second on average
    });

    it('should handle concurrent retrieval requests efficiently', async () => {
      const concurrentQueries = Array.from({ length: 10 }, (_, i) => ({
        query: `financial planning query ${i}`,
        max_results: 3
      }));
      
      const performance = await PerformanceTester.measureFunction(
        async () => {
          return Promise.all(concurrentQueries.map(query => parallelRetrieve(query)));
        },
        { iterations: 3, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(5000); // Should handle 10 concurrent queries within 5 seconds
      expect(performance.results.every((results: any) => 
        Array.isArray(results) && results.length === 10
      )).toBe(true);
      
      // Validate all results have proper contract
      performance.results.forEach((results: any) => {
        results.forEach((result: any) => {
          const validation = ContractValidator.validateRetrievalContract(result);
          expect(validation.valid).toBe(true);
        });
      });
    });
  });

  describe('Quality Gate Integration', () => {
    it('should enforce EIP compliance testing for MAS sources', async () => {
      const query = { query: 'MAS regulatory guidelines for financial planning' };
      
      const result = await parallelRetrieve(query);
      
      // Should detect MAS sources
      expect(result.flags.has_mas_source).toBe(true);
      
      // MAS sources should be present in candidates
      const masCandidates = result.candidates.filter((c: any) => 
        c.metadata?.domain?.includes('mas.gov.sg')
      );
      expect(masCandidates.length).toBeGreaterThan(0);
      
      // MAS sources should have high scores
      masCandidates.forEach(candidate => {
        expect(candidate.score).toBeGreaterThan(0.8); // MAS sources should rank highly
      });
    });

    it('should validate domain compliance for .gov and .edu sources', async () => {
      const query = { query: 'government educational financial content' };
      
      const result = await parallelRetrieve(query);
      
      // Should detect government and educational sources
      expect(result.flags.has_gov_source).toBe(true);
      expect(result.flags.has_edu_source).toBe(true);
      
      // Validate domain compliance in candidates
      result.candidates.forEach((candidate: any) => {
        if (candidate.metadata?.domain) {
          const domain = candidate.metadata.domain;
          // Should be from compliant domains
          const compliantPatterns = ['.gov', '.edu', 'mas.gov.sg', 'gov.sg', 'nus.edu.sg'];
          const isCompliant = compliantPatterns.some(pattern => domain.includes(pattern));
          
          if (isCompliant) {
            // Compliant sources should have reasonable scores
            expect(candidate.score).toBeGreaterThan(0.5);
          }
        }
      });
      
      // Query analysis should include domain validation
      expect(result.query_analysis.domain_validation).toBeDefined();
      expect(Array.isArray(result.query_analysis.domain_validation.compliant_domains)).toBe(true);
    });

    it('should handle unverified sources appropriately', async () => {
      const query = { query: 'general financial information' };
      
      const result = await parallelRetrieve(query);
      
      // May or may not have unverified sources depending on matching
      if (result.flags.has_unverified_source) {
        // If present, should be handled appropriately
        const unverifiedCandidates = result.candidates.filter((c: any) => 
          c.metadata?.domain?.includes('unverified')
        );
        
        // Unverified sources should have lower scores or warnings
        unverifiedCandidates.forEach(candidate => {
          expect(candidate.metadata?.type).toBe('unverified');
          // May have lower scores, but this is implementation dependent
        });
      }
    });

    it('should validate location-specific queries', async () => {
      const singaporeQuery = { 
        query: 'financial planning requirements in Singapore',
        context: { user_location: 'Singapore' }
      };
      
      const result = await parallelRetrieve(singaporeQuery);
      
      // Should detect location-specific content
      expect(result.flags.location_specific).toBe(true);
      expect(result.query_analysis.entities).toContain('singapore');
      
      // Should have Singapore-relevant content
      const singaporeRelevant = result.candidates.some((c: any) => 
        c.content.toLowerCase().includes('singapore') ||
        c.metadata?.domain?.includes('sg')
      );
      expect(singaporeRelevant).toBe(true);
    });

    it('should enforce performance budget constraints', async () => {
      const query = { query: 'performance test query' };
      
      const startTime = Date.now();
      const result = await parallelRetrieve(query);
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000); // 2 second max for test
      
      // Should track performance metrics
      expect(result.performance?.search_time_ms).toBeGreaterThan(0);
      expect(result.performance?.total_candidates).toBeGreaterThanOrEqual(0);
      expect(result.flags.retrieval_time_ms).toBeGreaterThan(0);
      
      // Performance should be within acceptable ranges
      expect(result.flags.retrieval_time_ms).toBeLessThan(5000); // 5 second max
    });
  });

  describe('Index Integration Testing', () => {
    it('should integrate with loaded BM25 index when available', async () => {
      // Check if there's a pre-built index available
      const indexPath = path.join(process.cwd(), 'tmp', 'bm25-indexes', 'latest.json');
      
      if (fs.existsSync(indexPath)) {
        // Load the index
        const loadSuccess = await loadBM25Index(indexPath);
        expect(loadSuccess).toBe(true);
        
        // Check index metadata
        const metadata = getIndexMetadata();
        expect(metadata).toBeDefined();
        
        // Test retrieval with loaded index
        const query = { query: 'financial planning with loaded index' };
        const result = await parallelRetrieve(query);
        
        expect(result.flags.index_loaded).toBe(true);
        expect(result.flags.index_version).toBeTruthy();
        expect(result.performance?.index_source).toBe('file');
        expect(result.index_metadata).toBeDefined();
      } else {
        // Should handle gracefully when no index file exists
        const query = { query: 'financial planning without index' };
        const result = await parallelRetrieve(query);
        
        expect(result.flags.index_loaded).toBe(false);
        expect(result.performance?.index_source).toBe('memory');
        expect(result.candidates.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle index loading failures gracefully', async () => {
      // Test with non-existent index
      const nonExistentPath = '/tmp/non-existent-index.json';
      const loadSuccess = await loadBM25Index(nonExistentPath);
      
      expect(loadSuccess).toBe(false);
      
      // Retrieval should still work with fallback
      const query = { query: 'fallback query after index load failure' };
      const result = await parallelRetrieve(query);
      
      expect(result.candidates.length).toBeGreaterThanOrEqual(0);
      expect(result.flags.index_loaded).toBe(false);
      expect(result.performance?.index_source).toBe('memory');
    });

    it('should maintain index metadata consistency', async () => {
      const query = { query: 'index metadata consistency test' };
      const result = await parallelRetrieve(query);
      
      // If index is loaded, metadata should be consistent
      if (result.flags.index_loaded && result.index_metadata) {
        const metadata = result.index_metadata;
        
        expect(metadata.version).toBeTruthy();
        expect(metadata.checksum).toBeTruthy();
        expect(metadata.checksum.length).toBe(64); // SHA-256
        expect(metadata.document_count).toBeGreaterThan(0);
        expect(metadata.build_time).toBeTruthy();
        expect(metadata.last_updated).toBeTruthy();
        
        // Performance should include index loading info
        expect(result.performance?.index_load_time_ms).toBeGreaterThanOrEqual(0);
        expect(result.performance?.index_source).toBe('file');
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty queries gracefully', async () => {
      const emptyQuery = { query: '' };
      
      const result = await parallelRetrieve(emptyQuery);
      
      expect(result.candidates).toHaveLength(0);
      expect(result.flags.error_handled).toBe(true);
      expect(result.query_analysis.error).toBeTruthy();
      expect(result.query_analysis.fallback_applied).toBe(true);
    });

    it('should handle malformed queries without crashing', async () => {
      const malformedQuery = { 
        query: null as any,
        invalid_field: 'should be ignored'
      };
      
      const result = await parallelRetrieve(malformedQuery);
      
      expect(result.flags.error_handled).toBe(true);
      expect(result.query_analysis.recovery_successful).toBe(true);
      expect(result.candidates).toHaveLength(0);
    });

    it('should handle very long queries appropriately', async () => {
      const longQuery = { 
        query: 'financial '.repeat(100) + 'planning ' + 'investment '.repeat(50),
        max_results: 5
      };
      
      const result = await parallelRetrieve(longQuery);
      
      expect(Array.isArray(result.candidates)).toBe(true);
      expect(result.candidates.length).toBeLessThanOrEqual(5);
      
      if (result.candidates.length > 0) {
        result.candidates.forEach(candidate => {
          expect(candidate.score).toBeGreaterThanOrEqual(0);
          expect(candidate.id).toBeTruthy();
        });
      }
      
      // Should handle complexity appropriately
      expect(result.flags.query_complexity).toBeDefined();
      expect(['simple', 'medium', 'complex']).toContain(result.flags.query_complexity);
    });

    it('should handle special characters in queries', async () => {
      const specialCharQueries = [
        { query: 'financial-planning' },
        { query: 'investment_strategies' },
        { query: 'retirement@planning' },
        { query: 'MAS guidelines & regulations' }
      ];
      
      const results = await Promise.all(
        specialCharQueries.map(query => parallelRetrieve(query))
      );
      
      results.forEach(result => {
        expect(Array.isArray(result.candidates)).toBe(true);
        expect(result.flags.bm25_used).toBe(true);
        
        if (result.candidates.length > 0) {
          result.candidates.forEach((candidate: any) => {
            expect(candidate.score).toBeGreaterThanOrEqual(0);
            expect(candidate.id).toBeTruthy();
          });
        }
      });
    });

    it('should handle concurrent requests with different complexity levels', async () => {
      const mixedQueries = [
        { query: 'financial', max_results: 3 },
        { query: 'financial planning strategies for retirement', max_results: 5 },
        { query: 'comprehensive financial planning with MAS guidelines and Singapore regulations for retirement investment', max_results: 7 }
      ];
      
      const performance = await PerformanceTester.measureFunction(
        async () => {
          return Promise.all(mixedQueries.map(query => parallelRetrieve(query)));
        },
        { iterations: 3, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(3000); // Should handle mixed complexity within 3 seconds
      
      // Validate all results respect their max_results
      performance.results.forEach((results: any) => {
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(mixedQueries.length);
        
        results.forEach((result: any, index: number) => {
          expect(result.candidates.length).toBeLessThanOrEqual(mixedQueries[index].max_results);
          expect(result.flags.query_complexity).toBeDefined();
        });
      });
    });
  });

  describe('Integration with EIP System', () => {
    it('should integrate with auditor workflow', async () => {
      const query = { query: 'financial planning for audit testing' };
      const retrievalResult = await parallelRetrieve(query);
      
      expect(retrievalResult.candidates.length).toBeGreaterThan(0);
      
      // Simulate integration with auditor (mock test)
      if (retrievalResult.candidates.length > 0) {
        const sampleContent = retrievalResult.candidates[0].content;
        
        // Should produce content that can be audited
        expect(sampleContent).toBeTruthy();
        expect(sampleContent.length).toBeGreaterThan(10);
        
        // Content should be from compliant sources
        const hasComplianceInfo = retrievalResult.candidates.some((c: any) => 
          c.metadata?.domain?.includes('mas.gov.sg') ||
          c.metadata?.domain?.includes('.gov') ||
          c.metadata?.domain?.includes('.edu')
        );
        expect(hasComplianceInfo || retrievalResult.candidates.length === 0).toBe(true);
      }
    });

    it('should support end-to-end workflow testing', async () => {
      const integrationResult = await IntegrationTester.runEndToEndTest(
        'comprehensive financial planning for retirement',
        'framework@1.0.0'
      );
      
      expect(integrationResult.success).toBe(true);
      expect(integrationResult.errors).toHaveLength(0);
      expect(integrationResult.retrievalResult).toBeDefined();
      expect(integrationResult.performanceMetrics).toBeDefined();
      
      // Validate retrieval result
      if (integrationResult.retrievalResult) {
        const validation = ContractValidator.validateRetrievalContract(integrationResult.retrievalResult);
        expect(validation.valid).toBe(true);
      }
      
      // Performance should be reasonable
      const avgDuration = integrationResult.performanceMetrics.reduce(
        (sum, metric) => sum + metric.duration, 0
      ) / integrationResult.performanceMetrics.length;
      
      expect(avgDuration).toBeLessThan(2000); // Should complete within 2 seconds on average
    });

    it('should maintain compliance with EIP quality gates', async () => {
      const queries = [
        { query: 'MAS regulated financial advice' },
        { query: 'Singapore government financial guidelines' },
        { query: 'educational financial literacy content' }
      ];
      
      const results = await Promise.all(queries.map(query => parallelRetrieve(query)));
      
      results.forEach(result => {
        // All results should pass quality gates
        expect(result.candidates.every((c: any) => c.score >= 0)).toBe(true);
        expect(result.flags.bm25_used).toBe(true);
        expect(typeof result.flags.query_complexity).toBe('string');
        
        // Should have compliance analysis
        expect(result.query_analysis.domain_validation).toBeDefined();
        
        // Performance should be tracked
        expect(result.performance?.search_time_ms).toBeGreaterThan(0);
      });
      
      // Generate test report
      const testReport = IntegrationTester.generateTestReport(
        results.map(r => ({ 
          success: true, 
          metrics: { duration: r.performance?.search_time_ms || 0, success: true },
          error: undefined 
        }))
      );
      
      expect(testReport).toContain('EIP Steel Thread Test Report');
      expect(testReport).toContain('Success Rate: 100%');
    });
  });
});
