// ABOUTME: BM25 retrieval smoke tests for EIP Steel Thread
// ABOUTME: Validates retrieval functionality, performance, and integration contracts

const { performance } = require('perf_hooks');

// Import actual orchestrator components
let parallelRetrieve;
try {
  const retrievalModule = require('../orchestrator/retrieval');
  parallelRetrieve = retrievalModule.parallelRetrieve;
} catch (error) {
  console.log('⚠️  Could not load actual retrieval module, using mock implementation');
}

// Mock implementation if actual not available
class MockBM25Retrieval {
  constructor() {
    this.documents = [
      {
        id: 'sg_refinance_001',
        content: 'Singapore property refinancing allows homeowners to access equity by replacing existing mortgage with new loan terms.',
        source: 'financial_guide',
        score: 0.85,
        metadata: { domain: 'finance' }
      },
      {
        id: 'sg_hdb_loan_003',
        content: 'HDB loan refinancing has specific eligibility criteria including minimum occupation period and income requirements.',
        source: 'hdb_guidelines',
        score: 0.78,
        metadata: { domain: 'housing' }
      },
      {
        id: 'sg_bank_loan_004',
        content: 'Bank loan refinancing offers competitive interest rates but requires credit assessment and debt-to-ratio evaluation.',
        source: 'bank_guide',
        score: 0.82,
        metadata: { domain: 'banking' }
      }
    ];
  }

  async retrieve(input) {
    const query = input.query || input;
    const startTime = performance.now();
    
    // Simple keyword matching for mock
    const matches = this.documents.filter(doc => 
      query.toLowerCase().split(' ').some(word => 
        doc.content.toLowerCase().includes(word) && word.length > 2
      )
    ).map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        retrieval_method: 'bm25',
        retrieval_score: doc.score
      }
    }));
    
    const retrievalTime = performance.now() - startTime;
    
    return {
      candidates: matches,
      graph_edges: [],
      flags: {
        graph_sparse: true,
        bm25_used: true,
        vector_used: false,
        cache_hit: false,
        retrieval_time_ms: Math.floor(retrievalTime)
      },
      query_analysis: {
        terms: query.toLowerCase().split(' ').filter(w => w.length > 2),
        complexity: query.length > 50 ? 'high' : query.length > 20 ? 'medium' : 'low',
        domain: this.detectDomain(query)
      }
    };
  }

  detectDomain(query) {
    if (query.includes('property') || query.includes('refinancing') || query.includes('loan')) {
      return 'finance';
    }
    if (query.includes('hdb') || query.includes('housing')) {
      return 'housing';
    }
    if (query.includes('bank') || query.includes('banking')) {
      return 'banking';
    }
    return 'general';
  }
}

// Test data for BM25 validation
const TEST_QUERIES = [
  {
    query: 'Singapore property refinancing process',
    expected_domain: 'finance',
    min_candidates: 1,
    max_time_ms: 1000
  },
  {
    query: 'HDB loan eligibility criteria',
    expected_domain: 'housing',
    min_candidates: 1,
    max_time_ms: 1000
  },
  {
    query: 'Bank loan interest rates comparison',
    expected_domain: 'banking',
    min_candidates: 1,
    max_time_ms: 1000
  }
];

// Test framework
class RetrievalTestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.retrieval = parallelRetrieve ? null : new MockBM25Retrieval();
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🔍 BM25 Retrieval Smoke Tests');
    console.log('=====================================');
    console.log('Using:', parallelRetrieve ? 'Actual orchestrator/retrieval' : 'Mock implementation');
    console.log('');
    
    for (const test of this.tests) {
      try {
        const startTime = performance.now();
        const result = await test.testFn();
        const duration = performance.now() - startTime;
        
        this.results.push({
          name: test.name,
          success: true,
          duration: duration,
          result: result
        });
        
        console.log('✅ ' + test.name + ' (' + duration.toFixed(2) + 'ms)');
        if (result && Object.keys(result).length > 0) {
          console.log('   ' + JSON.stringify(result).substring(0, 150) + '...');
        }
      } catch (error) {
        console.log('❌ ' + test.name + ': ' + error.message);
        this.results.push({
          name: test.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    console.log('');
    console.log('📊 Retrieval Test Summary:');
    console.log('Total: ' + total + ', Passed: ' + passed + ', Failed: ' + failed);
    console.log('Success Rate: ' + ((passed / total) * 100).toFixed(1) + '%');
    console.log('Average Duration: ' + avgDuration.toFixed(2) + 'ms');
    
    if (failed > 0) {
      console.log('');
      console.log('❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log('  - ' + r.name + ': ' + r.error);
      });
    }
  }

  async performRetrieval(query) {
    if (parallelRetrieve) {
      return await parallelRetrieve({ query });
    } else {
      return await this.retrieval.retrieve(query);
    }
  }
}

// Main test execution
async function runRetrievalTests() {
  const runner = new RetrievalTestRunner();

  // Core BM25 Functionality Tests
  runner.test('Basic Retrieval Functionality', async () => {
    const result = await runner.performRetrieval('Singapore property refinancing');
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No candidates returned');
    }
    
    if (!result.flags.bm25_used) {
      throw new Error('BM25 not used flag missing');
    }
    
    if (!result.query_analysis || !result.query_analysis.terms) {
      throw new Error('Query analysis missing or incomplete');
    }
    
    // Verify candidate structure
    result.candidates.forEach(candidate => {
      if (!candidate.id || !candidate.content || !candidate.source) {
        throw new Error('Candidate missing required fields');
      }
      if (typeof candidate.score !== 'number' || candidate.score < 0) {
        throw new Error('Invalid candidate score');
      }
    });
    
    return {
      candidates_found: result.candidates.length,
      bm25_used: result.flags.bm25_used,
      retrieval_time_ms: result.flags.retrieval_time_ms,
      domain_detected: result.query_analysis.domain
    };
  });

  runner.test('Query Analysis Accuracy', async () => {
    const queries = [
      { query: 'simple refinancing', expected_complexity: 'low' },
      { query: 'comprehensive guide to Singapore property refinancing with bank requirements', expected_complexity: 'high' }
    ];
    
    const results = [];
    for (const testCase of queries) {
      const result = await runner.performRetrieval(testCase.query);
      results.push({
        query: testCase.query,
        complexity: result.query_analysis.complexity,
        expected: testCase.expected_complexity,
        terms_extracted: result.query_analysis.terms.length
      });
    }
    
    return {
      query_analysis_results: results,
      all_complexities_correct: results.every(r => r.complexity === r.expected)
    };
  });

  runner.test('Domain-Specific Retrieval', async () => {
    const domainResults = [];
    
    for (const testCase of TEST_QUERIES) {
      const result = await runner.performRetrieval(testCase.query);
      
      domainResults.push({
        query: testCase.query,
        expected_domain: testCase.expected_domain,
        actual_domain: result.query_analysis.domain,
        candidates_found: result.candidates.length,
        within_time_limit: result.flags.retrieval_time_ms <= testCase.max_time_ms
      });
    }
    
    const allDomainsCorrect = domainResults.every(r => r.actual_domain === r.expected_domain);
    const allHaveCandidates = domainResults.every(r => r.candidates_found >= 1);
    const allWithinTimeLimit = domainResults.every(r => r.within_time_limit);
    
    if (!allDomainsCorrect) {
      throw new Error('Domain detection failed for some queries');
    }
    
    return {
      domain_results: domainResults,
      domains_correct: allDomainsCorrect,
      candidates_found: allHaveCandidates,
      performance_acceptable: allWithinTimeLimit
    };
  });

  runner.test('Performance Validation', async () => {
    const testQuery = 'property refinancing';
    
    const startTime = performance.now();
    const result = await runner.performRetrieval(testQuery);
    const duration = performance.now() - startTime;
    
    if (result.flags.retrieval_time_ms > 1000) {
      throw new Error('Retrieval time exceeds threshold: ' + result.flags.retrieval_time_ms + 'ms > 1000ms');
    }
    
    if (duration > 1000) {
      throw new Error('Total execution time exceeds threshold: ' + duration.toFixed(2) + 'ms > 1000ms');
    }
    
    return {
      retrieval_time_ms: result.flags.retrieval_time_ms,
      total_time_ms: duration.toFixed(2),
      within_threshold: true
    };
  });

  runner.test('Multiple Concurrent Queries', async () => {
    const queries = TEST_QUERIES.map(tq => tq.query);
    
    const startTime = performance.now();
    const promises = queries.map(query => runner.performRetrieval(query));
    const results = await Promise.all(promises);
    const totalTime = performance.now() - startTime;
    
    if (results.length !== queries.length) {
      throw new Error('Not all queries completed successfully');
    }
    
    if (totalTime > 2000) {
      throw new Error('Concurrent queries exceeded time limit: ' + totalTime.toFixed(2) + 'ms > 2000ms');
    }
    
    // Verify all results are valid
    results.forEach(result => {
      if (!result.candidates || !result.flags.bm25_used) {
        throw new Error('Invalid result in concurrent queries');
      }
    });
    
    return {
      queries_processed: results.length,
      total_time_ms: totalTime.toFixed(2),
      avg_time_per_query: (totalTime / results.length).toFixed(2),
      all_results_valid: true
    };
  });

  await runner.runTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRetrievalTests().catch(console.error);
}

module.exports = { RetrievalTestRunner, MockBM25Retrieval };
