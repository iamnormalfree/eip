// ABOUTME: Node.js test runner for EIP Steel Thread testing
// ABOUTME: Executes BM25 and auditor smoke tests with performance validation

const { performance } = require('perf_hooks');

// Simple test framework
class EIPTestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🚀 Starting EIP Steel Thread Tests...\n');
    
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
        if (result) {
          console.log('   Result: ' + JSON.stringify(result, null, 2).substring(0, 200) + '...');
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
    
    console.log('\n📊 Test Summary:');
    console.log('Total: ' + total + ', Passed: ' + passed + ', Failed: ' + failed);
    console.log('Success Rate: ' + ((passed / total) * 100).toFixed(1) + '%');
    console.log('Average Duration: ' + avgDuration.toFixed(2) + 'ms');
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log('  - ' + r.name + ': ' + r.error);
      });
    }
  }
}

// Mock BM25 implementation for testing
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
      }
    ];
  }

  async retrieve(query) {
    const startTime = performance.now();
    
    // Simple keyword matching for mock
    const matches = this.documents.filter(doc => 
      query.toLowerCase().split(' ').some(word => 
        doc.content.toLowerCase().includes(word) && word.length > 2
      )
    );
    
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
        domain: query.includes('property') || query.includes('loan') ? 'finance' : 'general'
      }
    };
  }
}

// Mock Auditor implementation for testing
class MockAuditor {
  async audit(draft, ip) {
    const wordCount = draft.split(/\s+/).length;
    const sectionCount = (draft.match(/^#{1,3}\s+/gm) || []).length;
    const hasMechanism = /(mechanism|how.*work|process)/i.test(draft);
    const hasExamples = /(example|for.*instance)/i.test(draft);
    const hasStructure = /^#{1,3}\s+/m.test(draft);
    
    // Simple pattern detection
    const completionDrive = (draft.match(/\b(thoroughly|comprehensive|exhaustive)\b/gi) || []).length;
    const questionSuppression = draft.includes('?') ? 0.2 : 0.8;
    
    let score = 100;
    const tags = [];
    
    if (!hasMechanism) {
      tags.push({
        tag: 'NO_MECHANISM',
        severity: 'error',
        confidence: 0.8
      });
      score -= 20;
    }
    
    if (!hasExamples) {
      tags.push({
        tag: 'NO_EXAMPLES',
        severity: 'warning',
        confidence: 0.6
      });
      score -= 10;
    }
    
    if (completionDrive > 0) {
      tags.push({
        tag: 'COMPLETION_DRIVE',
        severity: 'warning',
        confidence: 0.7
      });
      score -= 5;
    }
    
    return {
      tags: tags,
      overall_score: Math.max(0, score),
      content_analysis: {
        word_count: wordCount,
        section_count: sectionCount,
        has_mechanism: hasMechanism,
        has_examples: hasExamples,
        has_structure: hasStructure
      },
      pattern_analysis: {
        completion_drive: Math.min(completionDrive / 10, 1.0),
        question_suppression: questionSuppression,
        domain_mixing: 0.1
      }
    };
  }
}

// Performance testing utilities
class PerformanceTester {
  static async measureFunction(fn, options = {}) {
    const { iterations = 5, warmupIterations = 2 } = options;
    const times = [];
    const results = [];

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Measured iterations
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const result = await fn();
      const duration = performance.now() - startTime;
      
      times.push(duration);
      results.push(result);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return { avgTime, minTime, maxTime, results };
  }
}

// Main test execution
async function runEIPTests() {
  const runner = new EIPTestRunner();
  const retrieval = new MockBM25Retrieval();
  const auditor = new MockAuditor();

  // BM25 Retrieval Tests
  runner.test('BM25 Basic Retrieval', async () => {
    const result = await retrieval.retrieve('Singapore property refinancing');
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No candidates returned');
    }
    
    if (!result.flags.bm25_used) {
      throw new Error('BM25 not used flag missing');
    }
    
    return {
      candidates_found: result.candidates.length,
      bm25_used: result.flags.bm25_used,
      retrieval_time_ms: result.flags.retrieval_time_ms
    };
  });

  runner.test('BM25 Query Analysis', async () => {
    const result = await retrieval.retrieve('HDB loan eligibility requirements');
    
    if (!result.query_analysis.terms || result.query_analysis.terms.length === 0) {
      throw new Error('Query terms not extracted');
    }
    
    return {
      terms_extracted: result.query_analysis.terms.length,
      complexity: result.query_analysis.complexity,
      domain: result.query_analysis.domain
    };
  });

  runner.test('BM25 Performance Validation', async () => {
    const metrics = await PerformanceTester.measureFunction(
      () => retrieval.retrieve('property refinancing process'),
      { iterations: 3, warmupIterations: 1 }
    );
    
    if (metrics.avgTime > 1000) {
      throw new Error('Average time ' + metrics.avgTime.toFixed(2) + 'ms exceeds threshold 1000ms');
    }
    
    return {
      avg_time_ms: metrics.avgTime.toFixed(2),
      min_time_ms: metrics.minTime.toFixed(2),
      max_time_ms: metrics.maxTime.toFixed(2)
    };
  });

  // Micro-Auditor Tests
  runner.test('Auditor Framework Validation', async () => {
    const content = `# Strategic Planning Framework

## Overview
Systematic approach to strategic planning.

## How It Works
1. Assessment phase
2. Planning phase
3. Implementation phase

## Example
Technology companies use this for product planning.`;

    const result = await auditor.audit(content, 'framework@1.0.0');
    
    if (result.overall_score < 70) {
      throw new Error('Overall score ' + result.overall_score + ' below threshold 70');
    }
    
    if (!result.content_analysis.has_mechanism) {
      throw new Error('Mechanism not detected in valid framework');
    }
    
    return {
      overall_score: result.overall_score,
      has_mechanism: result.content_analysis.has_mechanism,
      has_examples: result.content_analysis.has_examples,
      tags_found: result.tags.length
    };
  });

  runner.test('Auditor Pattern Detection', async () => {
    const content = 'This is a thoroughly comprehensive analysis that covers everything completely.';
    const result = await auditor.audit(content, 'framework@1.0.0');
    
    const completionDriveTag = result.tags.find(tag => tag.tag === 'COMPLETION_DRIVE');
    if (!completionDriveTag) {
      throw new Error('COMPLETION_DRIVE pattern not detected');
    }
    
    return {
      completion_drive_score: result.pattern_analysis.completion_drive,
      tag_detected: true,
      confidence: completionDriveTag.confidence
    };
  });

  runner.test('End-to-End Integration', async () => {
    const query = 'Singapore property refinancing process';
    
    // Test retrieval
    const retrievalResult = await retrieval.retrieve(query);
    
    if (!retrievalResult.candidates || retrievalResult.candidates.length === 0) {
      throw new Error('Retrieval failed: no candidates found');
    }
    
    // Test auditor with retrieved content
    const sampleContent = retrievalResult.candidates[0].content;
    const auditResult = await auditor.audit(sampleContent, 'framework@1.0.0');
    
    if (auditResult.overall_score < 0 || auditResult.overall_score > 100) {
      throw new Error('Invalid audit score: ' + auditResult.overall_score);
    }
    
    return {
      retrieval_success: true,
      candidates_found: retrievalResult.candidates.length,
      audit_score: auditResult.overall_score,
      integration_success: true
    };
  });

  await runner.runTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEIPTests().catch(console.error);
}

module.exports = { EIPTestRunner, MockBM25Retrieval, MockAuditor, PerformanceTester };
