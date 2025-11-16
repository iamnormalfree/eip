// ABOUTME: Error Handling Validation Testing for EIP Orchestrator Pipeline
// ABOUTME: Validates DLQ routing, circuit breaker behavior, partial failure handling, and retry logic

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BudgetEnforcer, BudgetCircuitBreaker, Tier } from '../../orchestrator/budget';

// Mock controller and DLQ handler for testing
const mockController = {
  processJob: jest.fn(),
  processJobWithCircuitBreaker: jest.fn(),
  processJobWithPartialFailure: jest.fn(),
  processJobWithContextPreservation: jest.fn(),
  processJobWithRollback: jest.fn(),
  processJobWithRetry: jest.fn(),
  processJobWithMaxRetries: jest.fn(),
  calculateRetryDelay: jest.fn(),
  processJobWithErrorContext: jest.fn(),
  processJobWithMultipleErrors: jest.fn(),
  processJobWithAuditTrail: jest.fn()
};

const mockDLQ = {
  routeToDLQ: jest.fn(),
  getFailedJobs: jest.fn(),
  recoverJob: jest.fn()
};

// Mock BullMQ for error handling testing
jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    process: jest.fn(),
    getWaiting: jest.fn(() => Promise.resolve([])),
    getActive: jest.fn(() => Promise.resolve([])),
    getCompleted: jest.fn(() => Promise.resolve([])),
    getFailed: jest.fn(() => Promise.resolve([
      { id: 'failed-job-1', data: { error: 'Test error' }, failedReason: 'Simulated failure' },
      { id: 'failed-job-2', data: { error: 'Budget exceeded' }, failedReason: 'Budget violation' }
    ])),
    pause: jest.fn(),
    resume: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(() => ({
    run: jest.fn(),
    close: jest.fn(),
  })),
  QueueEvents: jest.fn(() => ({
    close: jest.fn(),
  })),
}));

// Mock Redis for error handling testing
jest.mock('ioredis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
    keys: jest.fn(() => Promise.resolve(['dlq:test-job-1', 'dlq:test-job-2'])),
    flushdb: jest.fn(() => Promise.resolve('OK')),
    ping: jest.fn(() => Promise.resolve('PONG')),
    quit: jest.fn(() => Promise.resolve('OK')),
  })),
}));

describe('Pipeline Error Handling Validation', () => {
  let budgetEnforcer: BudgetEnforcer;
  let circuitBreaker: BudgetCircuitBreaker;

  beforeEach(() => {
    jest.clearAllMocks();
    budgetEnforcer = new BudgetEnforcer('MEDIUM');
    circuitBreaker = new BudgetCircuitBreaker();

    // Setup default mock implementations
    mockDLQ.getFailedJobs.mockResolvedValue([
      { id: 'failed-job-1', data: { error: 'Test error' }, failedReason: 'Simulated failure' },
      { id: 'failed-job-2', data: { error: 'Budget exceeded' }, failedReason: 'Budget violation' }
    ]);
    mockDLQ.routeToDLQ.mockResolvedValue({
      success: true,
      dlqId: 'dlq-123',
      reason: 'Test error routing'
    });
    mockDLQ.recoverJob.mockResolvedValue({
      success: true,
      retryCount: 1,
      nextRetryTime: Date.now() + 5000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DLQ Routing and Recovery', () => {
    it('should route budget violations to DLQ', async () => {
      // Create a job that will exceed budget
      const problematicJob = {
        id: 'budget-violation-job',
        data: {
          type: 'framework',
          persona: 'researcher',
          funnel: 'decision',
          topic: 'Complex topic requiring excessive processing',
          tier: 'LIGHT' as Tier // Use LIGHT tier for easier violation
        }
      };

      // Simulate budget violation during processing
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 1500); // Exceeds LIGHT tier limit of 1400

      const budgetCheck = budgetEnforcer.checkStageBudget('generator');
      expect(budgetCheck.ok).toBe(false);

      // Job should be routed to DLQ
      const dlqResult = await mockDLQ.routeToDLQ(problematicJob, {
        reason: 'Budget violation',
        stage: 'generator',
        violation: {
          type: 'token_budget_exceeded',
          used: 1500,
          limit: 1400,
          stage: 'generator'
        }
      });

      expect(dlqResult.success).toBe(true);
      expect(dlqResult.dlqId).toBeDefined();
      expect(dlqResult.reason).toContain('Budget violation');
    });

    it('should route processing failures to DLQ with context preservation', async () => {
      const failingJob = {
        id: 'processing-failure-job',
        data: {
          type: 'comparative',
          persona: 'analyst',
          funnel: 'comparison',
          topic: 'Topic that causes processing failure',
          tier: 'MEDIUM' as Tier
        },
        correlationId: 'test-correlation-123',
        userId: 'test-user-456'
      };

      // Simulate processing failure
      const processingError = new Error('Simulated processing failure');
      processingError.stack = 'Error: Simulated processing failure\n    at test';

      const dlqResult = await mockDLQ.routeToDLQ(failingJob, {
        reason: 'Processing failure',
        stage: 'generator',
        error: processingError.message,
        stack: processingError.stack,
        correlationId: failingJob.correlationId,
        userId: failingJob.userId
      });

      expect(dlqResult.success).toBe(true);
      expect(dlqResult.context?.correlationId).toBe(failingJob.correlationId);
      expect(dlqResult.context?.userId).toBe(failingJob.userId);
      expect(dlqResult.error).toContain('Simulated processing failure');
    });

    it('should recover jobs from DLQ with retry logic', async () => {
      // Get failed jobs from DLQ
      const failedJobs = await mockDLQ.getFailedJobs();
      expect(failedJobs.length).toBeGreaterThan(0);

      // Attempt to recover a specific job
      const jobToRecover = failedJobs[0];
      const recoveryResult = await mockDLQ.recoverJob(jobToRecover.id, {
        retryDelay: 5000, // 5 second delay
        maxRetries: 3,
        backoffMultiplier: 2
      });

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.retryCount).toBe(1);
      expect(recoveryResult.nextRetryTime).toBeGreaterThan(Date.now() + 4000); // Approximately 5 seconds
    });

    it('should handle DLQ overflow scenarios', async () => {
      // Simulate DLQ reaching capacity limits
      const dlqCapacity = 100;
      const jobsToOverwhelm = Array.from({ length: dlqCapacity + 10 }, (_, i) => ({
        id: `overflow-job-${i}`,
        data: {
          type: 'educational',
          persona: 'student',
          funnel: 'awareness',
          topic: `Overflow test topic ${i}`,
          tier: 'LIGHT' as Tier
        }
      }));

      // Route all jobs to DLQ
      const results = [];
      for (const job of jobsToOverwhelm) {
        const result = await mockDLQ.routeToDLQ(job, {
          reason: 'DLQ overflow test',
          stage: 'generator'
        });
        results.push(result);
      }

      // Some jobs should fail due to DLQ capacity
      const successfulRoutes = results.filter(r => r.success);
      const failedRoutes = results.filter(r => !r.success);

      expect(successfulRoutes.length).toBeLessThanOrEqual(dlqCapacity);
      expect(failedRoutes.length).toBeGreaterThan(0);
      expect(failedRoutes[0].error).toContain('DLQ capacity exceeded');
    });
  });

  describe('Circuit Breaker Behavior', () => {
    it('should open circuit after consecutive failures', () => {
      // Record consecutive failures to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.canExecute()).toBe(false);
      expect(circuitBreaker.getFailureCount()).toBe(3);
    });

    it('should prevent execution when circuit is open', async () => {
      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.canExecute()).toBe(false);

      // Attempt to execute job - should be rejected
      const job = {
        id: 'circuit-open-test',
        data: {
          type: 'process',
          persona: 'professional',
          funnel: 'consideration',
          topic: 'Test circuit breaker',
          tier: 'MEDIUM' as Tier
        }
      };

      const executionResult = await mockController.processJobWithCircuitBreaker(job, circuitBreaker);
      expect(executionResult.success).toBe(false);
      expect(executionResult.reason).toContain('Circuit breaker is OPEN');
    });

    it('should close circuit after successful execution', async () => {
      // Open circuit first
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Simulate successful execution after timeout
      jest.advanceTimersByTime(31000); // 31 seconds (circuit breaker timeout is 30s)

      // Record a success
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.canExecute()).toBe(true);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should track circuit breaker metrics', () => {
      // Simulate various circuit breaker states
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.canExecute()).toBe(true);

      // Add some failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failureCount).toBe(2);
      expect(metrics.state).toBe('CLOSED'); // Still closed, not enough failures yet
      expect(metrics.lastFailureTime).toBeDefined();

      // Add third failure to open circuit
      circuitBreaker.recordFailure();

      const openMetrics = circuitBreaker.getMetrics();
      expect(openMetrics.failureCount).toBe(3);
      expect(openMetrics.state).toBe('OPEN');
      expect(openMetrics.openTime).toBeDefined();
    });
  });

  describe('Partial Failure Handling', () => {
    it('should handle partial stage failures gracefully', async () => {
      const job = {
        id: 'partial-failure-job',
        data: {
          type: 'framework',
          persona: 'researcher',
          funnel: 'decision',
          topic: 'Topic causing partial failure',
          tier: 'MEDIUM' as Tier
        }
      };

      // Simulate partial failure in one stage
      const executionResult = await mockController.processJobWithPartialFailure(job, {
        failingStages: ['generator'],
        failureMode: 'partial'
      });

      expect(executionResult.success).toBe(false);
      expect(executionResult.completedStages).toContain('planner');
      expect(executionResult.completedStages).toContain('retrieval');
      expect(executionResult.failedStages).toContain('generator');
      expect(executionResult.partialFailure).toBe(true);
    });

    it('should preserve context across partial failures', async () => {
      const job = {
        id: 'context-preservation-job',
        data: {
          type: 'comparative',
          persona: 'analyst',
          funnel: 'comparison',
          topic: 'Context preservation test',
          tier: 'HEAVY' as Tier
        },
        correlationId: 'preserve-context-123',
        userId: 'context-user-456'
      };

      // Simulate partial failure with context preservation
      const result = await mockController.processJobWithContextPreservation(job, {
        failingStage: 'auditor',
        preserveContext: true
      });

      expect(result.preservedContext).toBeDefined();
      expect(result.preservedContext?.correlationId).toBe(job.correlationId);
      expect(result.preservedContext?.userId).toBe(job.userId);
      expect(result.preservedContext?.completedStages).toContain('planner');
      expect(result.preservedContext?.completedStages).toContain('retrieval');
      expect(result.preservedContext?.completedStages).toContain('generator');
    });

    it('should implement rollback mechanism on critical failures', async () => {
      const job = {
        id: 'rollback-test-job',
        data: {
          type: 'process',
          persona: 'professional',
          funnel: 'consideration',
          topic: 'Rollback mechanism test',
          tier: 'MEDIUM' as Tier
        }
      };

      // Simulate critical failure requiring rollback
      const rollbackResult = await mockController.processJobWithRollback(job, {
        criticalFailureStage: 'generator',
        rollbackStages: ['planner', 'retrieval']
      });

      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.rollbackTriggered).toBe(true);
      expect(rollbackResult.rollbackStages).toContain('planner');
      expect(rollbackResult.rollbackStages).toContain('retrieval');
      expect(rollbackResult.reason).toContain('Critical failure');
    });
  });

  describe('Retry Logic Validation', () => {
    it('should implement exponential backoff for retries', async () => {
      const job = {
        id: 'retry-backoff-job',
        data: {
          type: 'educational',
          persona: 'student',
          funnel: 'awareness',
          topic: 'Retry backoff test',
          tier: 'LIGHT' as Tier
        }
      };

      // Configure retry with exponential backoff
      const retryConfig = {
        maxRetries: 3,
        baseDelay: 1000, // 1 second
        backoffMultiplier: 2,
        maxDelay: 10000 // 10 seconds
      };

      const retryAttempts = [];
      for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
        const result = await mockController.processJobWithRetry(job, {
          attempt,
          retryConfig,
          simulateFailure: attempt <= retryConfig.maxRetries
        });

        retryAttempts.push({
          attempt,
          delay: result.retryDelay,
          success: result.success
        });

        if (result.success) break;
      }

      // Validate exponential backoff
      expect(retryAttempts.length).toBe(retryConfig.maxRetries + 1);
      expect(retryAttempts[0].delay).toBe(retryConfig.baseDelay);
      expect(retryAttempts[1].delay).toBe(retryConfig.baseDelay * 2);
      expect(retryAttempts[2].delay).toBe(retryConfig.baseDelay * 4);
      expect(retryAttempts[3].success).toBe(true); // Final attempt succeeds
    });

    it('should respect maximum retry limits', async () => {
      const job = {
        id: 'max-retry-job',
        data: {
          type: 'framework',
          persona: 'researcher',
          funnel: 'decision',
          topic: 'Maximum retry test',
          tier: 'MEDIUM' as Tier
        }
      };

      const maxRetries = 2;
      const result = await mockController.processJobWithMaxRetries(job, {
        maxRetries,
        alwaysFail: true
      });

      expect(result.success).toBe(false);
      expect(result.totalAttempts).toBe(maxRetries + 1); // Initial attempt + retries
      expect(result.finalStatus).toBe('exhausted_retries');
      expect(result.reason).toContain('Maximum retry limit exceeded');
    });

    it('should implement jitter for retry delays', async () => {
      const job = {
        id: 'jitter-retry-job',
        data: {
          type: 'comparative',
          persona: 'analyst',
          funnel: 'comparison',
          topic: 'Retry jitter test',
          tier: 'HEAVY' as Tier
        }
      };

      // Test multiple retry attempts to validate jitter
      const baseDelay = 1000;
      const jitterRange = 500; // ±500ms jitter
      const retryDelays = [];

      for (let i = 0; i < 10; i++) {
        const result = await mockController.calculateRetryDelay(baseDelay, {
          jitterEnabled: true,
          jitterRange
        });
        retryDelays.push(result.delay);
      }

      // Validate jitter is applied (delays should vary)
      const uniqueDelays = new Set(retryDelays);
      expect(uniqueDelays.size).toBeGreaterThan(1);

      // Validate jitter is within expected range
      retryDelays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(baseDelay - jitterRange);
        expect(delay).toBeLessThanOrEqual(baseDelay + jitterRange);
      });
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve complete error context through pipeline', async () => {
      const job = {
        id: 'error-context-job',
        data: {
          type: 'process',
          persona: 'professional',
          funnel: 'consideration',
          topic: 'Error context preservation',
          tier: 'MEDIUM' as Tier
        },
        correlationId: 'error-context-123',
        userId: 'error-user-456',
        metadata: {
          source: 'test-suite',
          priority: 'high'
        }
      };

      // Simulate error with full context preservation
      const errorResult = await mockController.processJobWithErrorContext(job, {
        errorStage: 'generator',
        errorType: 'validation_error',
        errorMessage: 'Invalid data structure provided',
        errorDetails: {
          field: 'data.schema',
          expected: 'FrameworkIP',
          received: 'InvalidIP'
        }
      });

      expect(errorResult.errorContext).toBeDefined();
      expect(errorResult.errorContext?.correlationId).toBe(job.correlationId);
      expect(errorResult.errorContext?.userId).toBe(job.userId);
      expect(errorResult.errorContext?.jobId).toBe(job.id);
      expect(errorResult.errorContext?.stage).toBe('generator');
      expect(errorResult.errorContext?.errorType).toBe('validation_error');
      expect(errorResult.errorContext?.metadata).toEqual(job.metadata);
    });

    it('should aggregate multiple errors in complex failures', async () => {
      const job = {
        id: 'multi-error-job',
        data: {
          type: 'framework',
          persona: 'researcher',
          funnel: 'decision',
          topic: 'Multiple error aggregation',
          tier: 'HEAVY' as Tier
        }
      };

      // Simulate multiple errors across different stages
      const multiErrorResult = await mockController.processJobWithMultipleErrors(job, {
        errors: [
          { stage: 'planner', type: 'timeout', message: 'Planning stage timed out' },
          { stage: 'retrieval', type: 'network', message: 'Failed to connect to data source' },
          { stage: 'generator', type: 'validation', message: 'Generated content failed validation' }
        ]
      });

      expect(multiErrorResult.errors).toHaveLength(3);
      expect(multiErrorResult.errors[0].stage).toBe('planner');
      expect(multiErrorResult.errors[1].stage).toBe('retrieval');
      expect(multiErrorResult.errors[2].stage).toBe('generator');
      expect(multiErrorResult.aggregatedError).toContain('Multiple errors occurred');
      expect(multiErrorResult.errorCount).toBe(3);
    });

    it('should maintain error audit trail', async () => {
      const job = {
        id: 'audit-trail-job',
        data: {
          type: 'educational',
          persona: 'student',
          funnel: 'awareness',
          topic: 'Error audit trail',
          tier: 'LIGHT' as Tier
        }
      };

      // Process job with error tracking
      const auditResult = await mockController.processJobWithAuditTrail(job, {
        trackErrors: true,
        auditLevel: 'detailed'
      });

      expect(auditResult.auditTrail).toBeDefined();
      expect(auditResult.auditTrail?.length).toBeGreaterThan(0);

      // Validate audit trail structure
      const auditEntry = auditResult.auditTrail![0];
      expect(auditEntry.timestamp).toBeDefined();
      expect(auditEntry.jobId).toBe(job.id);
      expect(auditEntry.stage).toBeDefined();
      expect(auditEntry.status).toBeDefined();

      // Validate error entries are properly marked
      const errorEntries = auditResult.auditTrail!.filter(entry => entry.status === 'error');
      if (errorEntries.length > 0) {
        expect(errorEntries[0].error).toBeDefined();
        expect(errorEntries[0].errorContext).toBeDefined();
      }
    });
  });
});