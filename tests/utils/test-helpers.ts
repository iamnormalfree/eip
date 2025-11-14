// ABOUTME: EIP test utilities and helpers for Steel Thread testing
// ABOUTME: Provides comprehensive testing patterns and validation utilities

import { BudgetEnforcer, Tier } from '../../orchestrator/budget';

// Performance measurement utilities
export interface PerformanceMetrics {
  duration: number;
  memoryUsage?: number;
  tokenUsage?: number;
  success: boolean;
}

export interface TestResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  metrics: PerformanceMetrics;
}

// Mock data generators
export class MockDataGenerator {
  static generateRetrievalQuery(topic: string, complexity: 'simple' | 'medium' | 'complex' = 'medium'): string {
    const templates = {
      simple: `${topic}`,
      medium: `How does ${topic} work in Singapore?`,
      complex: `Comprehensive guide to ${topic} with regulatory compliance and practical examples`
    };
    return templates[complexity];
  }

  static generateAuditContent(type: 'framework' | 'process' | 'comparative', quality: 'good' | 'poor' = 'good'): string {
    const templates = {
      framework: {
        good: `# Strategic Framework

## Overview
Systematic approach to strategic planning.

## How It Works
1. Assessment phase
2. Planning phase  
3. Implementation phase
4. Monitoring phase

## Example
Technology companies use this for product roadmap planning.

## Compliance
Follows MAS guidelines for corporate governance.`,
        poor: `Some planning stuff without structure.`
      },
      process: {
        good: `# Application Process

## Step-by-Step
1. Complete application form
2. Submit required documents
3. Undergo assessment
4. Receive decision

## Required Documents
- Financial statements
- Identification
- Property documents

## Timeline
5-7 business days processing time.`,
        poor: `Just apply and wait.`
      },
      comparative: {
        good: `# Option Comparison

## Option A: Bank Loan
- Interest rate: 2.5%
- Processing time: 2 weeks
- Requirements: Credit check

## Option B: HDB Loan  
- Interest rate: 2.6%
- Processing time: 4 weeks
- Requirements: Citizenship

## Recommendation
Choose based on urgency and eligibility.`,
        poor: `Bank loans vs HDB loans.`
      }
    };

    return templates[type][quality];
  }

  static generateBudgetTier(): Tier {
    const tiers: Tier[] = ['LIGHT', 'MEDIUM', 'HEAVY'];
    return tiers[Math.floor(Math.random() * tiers.length)];
  }

  static generateTokenCount(contentLength: number): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.floor(contentLength / 4);
  }
}

// Performance testing utilities
export class PerformanceTester {
  static async measureFunction<T>(
    fn: () => Promise<T> | T,
    options: { 
      iterations?: number; 
      warmupIterations?: number;
      timeout?: number;
    } = {}
  ): Promise<{ 
    avgTime: number; 
    minTime: number; 
    maxTime: number; 
    results: T[];
    metrics: PerformanceMetrics[];
  }> {
    const { 
      iterations = 5, 
      warmupIterations = 2,
      timeout = 30000 
    } = options;

    const times: number[] = [];
    const results: T[] = [];
    const metrics: PerformanceMetrics[] = [];

    // Warmup iterations
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Measured iterations
    for (let i = 0; i < iterations; i++) {
      const startMemory = process.memoryUsage();
      const startTime = Date.now();
      
      let result: T;
      let success = true;
      let error: Error | undefined;

      try {
        result = await Promise.race([
          fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]) as T;
      } catch (e) {
        result = undefined as T;
        success = false;
        error = e as Error;
      }

      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      times.push(duration);
      results.push(result);
      metrics.push({
        duration,
        memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
        success,
        error
      });
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return { avgTime, minTime, maxTime, results, metrics };
  }

  static validatePerformanceThresholds(
    metrics: { avgTime: number; maxTime: number },
    thresholds: { avgTime?: number; maxTime?: number }
  ): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    if (thresholds.avgTime && metrics.avgTime > thresholds.avgTime) {
      violations.push(`Average time ${metrics.avgTime}ms exceeds threshold ${thresholds.avgTime}ms`);
    }

    if (thresholds.maxTime && metrics.maxTime > thresholds.maxTime) {
      violations.push(`Max time ${metrics.maxTime}ms exceeds threshold ${thresholds.maxTime}ms`);
    }

    return { valid: violations.length === 0, violations };
  }
}

// Budget testing utilities
export class BudgetTester {
  static async validateBudgetCompliance<T>(
    testFn: () => Promise<T>,
    tier: Tier = 'MEDIUM',
    stage: 'planner' | 'generator' | 'auditor' | 'repairer' = 'generator',
    estimatedTokens?: number
  ): Promise<{
    result: T;
    budgetCompliance: boolean;
    budgetTracker: any;
    violations: string[];
  }> {
    const budgetEnforcer = new BudgetEnforcer(tier);
    budgetEnforcer.startStage(stage);

    let result: T;
    const violations: string[] = [];

    try {
      result = await testFn();

      // Estimate token usage if not provided
      if (estimatedTokens) {
        budgetEnforcer.addTokens(stage, estimatedTokens);
      }

      const budgetCheck = budgetEnforcer.checkStageBudget(stage);
      if (!budgetCheck.ok) {
        violations.push(budgetCheck.reason || 'Budget check failed');
      }

    } catch (error) {
      violations.push(`Test function failed: ${error}`);
      result = undefined as T;
    }

    budgetEnforcer.endStage(stage);
    const tracker = budgetEnforcer.getTracker();

    return {
      result,
      budgetCompliance: violations.length === 0,
      budgetTracker: tracker,
      violations
    };
  }

  static generateBudgetReport(tracker: any, tier: Tier): string {
    const elapsed = (Date.now() - tracker.start_time) / 1000;
    const budget = new BudgetEnforcer(tier).getBudget();

    return `
Budget Report (${tier} tier):
- Time elapsed: ${elapsed.toFixed(2)}s (limit: ${budget.wallclock_s}s)
- Tokens used: ${tracker.tokens_used}
- Stage breakdown: ${JSON.stringify(tracker.stage_tokens, null, 2)}
- Breaches: ${tracker.breaches.length}
    `.trim();
  }
}

// Contract validation utilities
export class ContractValidator {
  static validateRetrievalContract(result: any): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    if (!result.candidates || !Array.isArray(result.candidates)) {
      violations.push('Missing or invalid candidates array');
    }

    if (!result.flags || typeof result.flags !== 'object') {
      violations.push('Missing or invalid flags object');
    }

    if (!result.query_analysis || typeof result.query_analysis !== 'object') {
      violations.push('Missing or invalid query_analysis object');
    }

    if (result.candidates) {
      result.candidates.forEach((candidate: any, index: number) => {
        if (!candidate.id || !candidate.content || !candidate.source) {
          violations.push(`Candidate ${index} missing required fields`);
        }
        if (typeof candidate.score !== 'number' || candidate.score < 0) {
          violations.push(`Candidate ${index} has invalid score`);
        }
      });
    }

    return { valid: violations.length === 0, violations };
  }

  static validateAuditorContract(result: any): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    if (!Array.isArray(result.tags)) {
      violations.push('Missing or invalid tags array');
    }

    if (typeof result.overall_score !== 'number' || 
        result.overall_score < 0 || 
        result.overall_score > 100) {
      violations.push('Invalid overall_score');
    }

    if (!result.content_analysis || typeof result.content_analysis !== 'object') {
      violations.push('Missing or invalid content_analysis object');
    }

    if (!result.pattern_analysis || typeof result.pattern_analysis !== 'object') {
      violations.push('Missing or invalid pattern_analysis object');
    }

    if (result.tags) {
      result.tags.forEach((tag: any, index: number) => {
        if (!tag.tag || !tag.severity || !tag.rationale) {
          violations.push(`Tag ${index} missing required fields`);
        }
        if (!['error', 'warning', 'info'].includes(tag.severity)) {
          violations.push(`Tag ${index} has invalid severity`);
        }
        if (typeof tag.confidence !== 'number' || 
            tag.confidence < 0 || 
            tag.confidence > 1) {
          violations.push(`Tag ${index} has invalid confidence`);
        }
      });
    }

    return { valid: violations.length === 0, violations };
  }
}

// Integration test utilities
export class IntegrationTester {
  static async runEndToEndTest(
    query: string,
    ip: string = 'framework@1.0.0'
  ): Promise<{
    retrievalResult: any;
    auditResult: any;
    performanceMetrics: PerformanceMetrics[];
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const performanceMetrics: PerformanceMetrics[] = [];
    let retrievalResult: any;
    let auditResult: any;

    try {
      // Test retrieval
      const retrievalStart = Date.now();
      const { parallelRetrieve } = await import('../../orchestrator/retrieval');
      retrievalResult = await parallelRetrieve({ query });
      const retrievalDuration = Date.now() - retrievalStart;
      
      performanceMetrics.push({
        duration: retrievalDuration,
        success: true
      });

      // Validate retrieval contract
      const retrievalValidation = ContractValidator.validateRetrievalContract(retrievalResult);
      if (!retrievalValidation.valid) {
        errors.push(...retrievalValidation.violations);
      }

      // Test auditor with generated content
      if (retrievalResult.candidates.length > 0) {
        const sampleContent = retrievalResult.candidates[0].content;
        const auditStart = Date.now();
        const { microAudit } = await import('../../orchestrator/auditor');
        auditResult = await microAudit({ draft: sampleContent, ip });
        const auditDuration = Date.now() - auditStart;
        
        performanceMetrics.push({
          duration: auditDuration,
          success: true
        });

        // Validate audit contract
        const auditValidation = ContractValidator.validateAuditorContract(auditResult);
        if (!auditValidation.valid) {
          errors.push(...auditValidation.violations);
        }
      }

    } catch (error) {
      errors.push(`Integration test failed: ${error}`);
      performanceMetrics.push({
        duration: 0,
        success: false
      });
    }

    return {
      retrievalResult,
      auditResult,
      performanceMetrics,
      success: errors.length === 0,
      errors
    };
  }

  static generateTestReport(testResults: any[]): string {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const avgDuration = testResults.reduce((sum, r) => sum + r.metrics.duration, 0) / totalTests;

    return `
EIP Steel Thread Test Report:
============================
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}
Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%
Average Duration: ${avgDuration.toFixed(0)}ms

Failed Tests:
${testResults.filter(r => !r.success).map(r => `- ${r.error || 'Unknown error'}`).join('\n')}
    `.trim();
  }
}

// All utilities are already exported inline above

// Global test setup and teardown
export const setupEipTestEnvironment = () => {
  // Set test environment variables
  process.env.EIP_TEST_MODE = 'steel_thread';
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  return originalConsole;
};

export const teardownEipTestEnvironment = (originalConsole: any) => {
  global.console = originalConsole;
  delete process.env.EIP_TEST_MODE;
};
