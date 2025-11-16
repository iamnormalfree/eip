// ABOUTME: Comprehensive Logging and Correlation Testing for EIP Orchestrator
// ABOUTME: Validates structured logging, correlation tracking, and performance metrics

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  startCorrelation,
  updateCorrelation,
  endCorrelation,
  logStageStart,
  logStageComplete,
  logBudgetEnforcement,
  logCircuitBreaker,
  logDLQRouting,
  logQueueSubmission,
  logPerformance,
  logError,
  getLogger
} from '../../orchestrator/logger';

describe('Structured Logging System', () => {
  let logger: any;

  beforeEach(() => {
    logger = getLogger();
    // Clean up any existing correlation contexts from previous tests
    logger.cleanup(0);
    // Mock the logger's methods to track calls
    jest.spyOn(logger, 'info').mockClear();
    jest.spyOn(logger, 'warn').mockClear();
    jest.spyOn(logger, 'error').mockClear();
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Correlation ID Management', () => {
    it('should start correlation with generated ID', () => {
      const context = {
        jobId: 'test-job-123',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const
      };

      const correlationId = startCorrelation(context);

      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);

      const storedContext = logger.getCorrelationContext(correlationId);
      expect(storedContext).toBeDefined();
      expect(storedContext?.jobId).toBe('test-job-123');
      expect(storedContext?.persona).toBe('professional');
      expect(storedContext?.funnel).toBe('mofu');
      expect(storedContext?.tier).toBe('MEDIUM');
      expect(storedContext?.correlationId).toBe(correlationId);
    });

    it('should use provided correlation ID when available', () => {
      const providedId = 'provided-correlation-123';
      const context = {
        correlationId: providedId,
        jobId: 'test-job-456'
      };

      const correlationId = startCorrelation(context);

      expect(correlationId).toBe(providedId);

      const storedContext = logger.getCorrelationContext(correlationId);
      expect(storedContext?.correlationId).toBe(providedId);
      expect(storedContext?.jobId).toBe('test-job-456');
    });

    it('should update correlation context', () => {
      const correlationId = startCorrelation({ jobId: 'initial-job' });

      updateCorrelation(correlationId, {
        stage: 'generator',
        tokensUsed: 1500
      });

      const context = logger.getCorrelationContext(correlationId);
      expect(context?.stage).toBe('generator');
      expect(context?.tokensUsed).toBe(1500);
      expect(context?.jobId).toBe('initial-job'); // Original values preserved
    });

    it('should end correlation and cleanup', () => {
      const correlationId = startCorrelation({ jobId: 'cleanup-test' });

      expect(logger.getCorrelationContext(correlationId)).toBeDefined();

      endCorrelation(correlationId);

      expect(logger.getCorrelationContext(correlationId)).toBeUndefined();
    });

    it('should handle correlation updates for non-existent IDs gracefully', () => {
      const nonExistentId = 'non-existent-123';

      expect(() => {
        updateCorrelation(nonExistentId, { stage: 'test' });
      }).not.toThrow();

      expect(() => {
        endCorrelation(nonExistentId);
      }).not.toThrow();
    });
  });

  describe('Stage Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'stage-test-job',
        tier: 'MEDIUM' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log stage start with comprehensive context', () => {
      logStageStart(correlationId, 'generator', {
        ip: 'framework@1.0.0',
        brief_length: 500
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stage started: generator'),
        expect.objectContaining({
          correlationId,
          jobId: 'stage-test-job',
          stage: 'generator',
          event: 'stage_started',
          timestamp: expect.any(Number),
          ip: 'framework@1.0.0',
          brief_length: 500
        })
      );
    });

    it('should log stage completion with performance metrics', () => {
      const metrics = {
        stageDuration: 2500,
        tokensUsed: 1200,
        budgetRemaining: 800,
        draftLength: 5000
      };

      logStageComplete(correlationId, 'generator', metrics);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stage completed: generator'),
        expect.objectContaining({
          correlationId,
          jobId: 'stage-test-job',
          stage: 'generator',
          event: 'stage_completed',
          timestamp: expect.any(Number),
          duration: 2500,
          tokensUsed: 1200,
          budgetRemaining: 800,
          draftLength: 5000
        })
      );
    });

    it('should update correlation context on stage events', () => {
      logStageStart(correlationId, 'retrieval', { query: 'test query' });

      let context = logger.getCorrelationContext(correlationId);
      expect(context?.stage).toBe('retrieval');
      expect(context?.lastStageStart).toBeDefined();

      logStageComplete(correlationId, 'retrieval', {
        stageDuration: 1000,
        tokensUsed: 100
      });

      context = logger.getCorrelationContext(correlationId);
      expect(context?.stage).toBeUndefined(); // Should be cleared
      expect(context?.lastStageComplete).toBeDefined();
    });
  });

  describe('Budget Enforcement Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'budget-test-job',
        tier: 'HEAVY' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log budget enforcement actions', () => {
      const details = {
        stage: 'generator',
        reason: 'Token budget exceeded: 2500 > 2400',
        tokensUsed: 2500,
        budgetLimit: 2400
      };

      logBudgetEnforcement(correlationId, 'generator_budget_exceeded', details);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Budget enforcement: generator_budget_exceeded'),
        expect.objectContaining({
          correlationId,
          jobId: 'budget-test-job',
          event: 'budget_enforcement',
          action: 'generator_budget_exceeded',
          budgetTier: 'HEAVY',
          stage: 'generator',
          reason: 'Token budget exceeded: 2500 > 2400',
          tokensUsed: 2500,
          budgetLimit: 2400
        })
      );
    });
  });

  describe('Circuit Breaker Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'circuit-test-job',
        tier: 'MEDIUM' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log circuit breaker state changes', () => {
      logCircuitBreaker(correlationId, 'OPEN', 'Too many budget violations');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker: OPEN'),
        expect.objectContaining({
          correlationId,
          jobId: 'circuit-test-job',
          event: 'circuit_breaker',
          state: 'OPEN',
          reason: 'Too many budget violations',
          budgetTier: 'MEDIUM'
        })
      );
    });

    it('should log circuit breaker without reason', () => {
      logCircuitBreaker(correlationId, 'CLOSED');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker: CLOSED'),
        expect.objectContaining({
          correlationId,
          state: 'CLOSED',
          reason: undefined
        })
      );
    });
  });

  describe('DLQ Routing Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'dlq-test-job',
        tier: 'LIGHT' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log DLQ routing with comprehensive context', () => {
      const dlqRecord = {
        fail_reason: 'Budget breach: tokens exceeded in generator',
        budget_tier: 'LIGHT',
        tokens_used: 1500,
        time_elapsed_s: 25.5,
        breaches: [
          {
            stage: 'generator',
            type: 'tokens',
            limit: 1400,
            actual: 1500,
            timestamp: Date.now(),
            severity: 'critical'
          }
        ],
        circuit_breaker_triggered: true,
        recovery_suggestions: [
          'Consider reducing input complexity',
          'Review and optimize token usage'
        ]
      };

      logDLQRouting(correlationId, dlqRecord);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Job routed to DLQ'),
        expect.objectContaining({
          correlationId,
          jobId: 'dlq-test-job',
          event: 'dlq_routed',
          failReason: 'Budget breach: tokens exceeded in generator',
          budgetTier: 'LIGHT',
          breaches: 1,
          circuitBreakerTriggered: true,
          recoverySuggestions: 2
        })
      );
    });
  });

  describe('Queue Submission Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'queue-test-job',
        persona: 'professional',
        funnel: 'bofu',
        tier: 'MEDIUM' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log queue submission with tracking', () => {
      const queueJobId = 'content-12345678-abcdef';
      const metadata = {
        priority: 3,
        tier: 'MEDIUM',
        submission_source: 'orchestrator_controller'
      };

      logQueueSubmission(correlationId, queueJobId, metadata);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Job submitted to queue'),
        expect.objectContaining({
          correlationId,
          jobId: 'queue-test-job',
          queueJobId,
          event: 'queue_submission',
          queuePriority: 3,
          tier: 'MEDIUM',
          persona: 'professional',
          funnel: 'bofu'
        })
      );
    });
  });

  describe('Performance Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'performance-test-job',
        tier: 'HEAVY' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log performance metrics', () => {
      const metrics = {
        stageDuration: 15000,
        tokensUsed: 3500,
        budgetRemaining: 500,
        memoryUsage: 125 * 1024 * 1024, // 125MB
        cpuUsage: 45.2,
        queueSize: 10
      };

      logPerformance(correlationId, metrics);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance metrics'),
        expect.objectContaining({
          correlationId,
          jobId: 'performance-test-job',
          event: 'performance_metrics',
          stageDuration: 15000,
          tokensUsed: 3500,
          budgetRemaining: 500,
          memoryUsage: 125 * 1024 * 1024,
          cpuUsage: 45.2,
          queueSize: 10
        })
      );
    });
  });

  describe('Error Logging', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'error-test-job',
        tier: 'MEDIUM' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should log errors with full context preservation', () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at test.js:10:5';

      const context = {
        stage: 'generator',
        tokensUsed: 1200,
        additional_info: 'Some extra context'
      };

      logError(correlationId, error, context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred: Test error message'),
        expect.objectContaining({
          correlationId,
          jobId: 'error-test-job',
          stage: 'generator',
          event: 'error',
          errorName: 'Error',
          errorMessage: 'Test error message',
          stackTrace: error.stack,
          tokensUsed: 1200,
          additional_info: 'Some extra context'
        })
      );
    });

    it('should handle non-Error objects', () => {
      const nonError = 'String error';

      logError(correlationId, nonError, { stage: 'test' });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error occurred: ${nonError}`),
        expect.objectContaining({
          correlationId,
          stage: 'test',
          errorName: 'Error',
          errorMessage: nonError
        })
      );
    });
  });

  describe('Logger Statistics and Cleanup', () => {
    it('should provide accurate statistics', () => {
      // Focus on the core functionality without getting bogged down in internal details
      const initialStats = logger.getStats();

      // Test that creating correlations increases the count
      const correlationId1 = startCorrelation({ jobId: 'job1' });
      const statsAfterFirst = logger.getStats();
      expect(statsAfterFirst.activeCorrelations).toBeGreaterThan(initialStats.activeCorrelations);

      const correlationId2 = startCorrelation({ jobId: 'job2' });
      const statsAfterSecond = logger.getStats();
      expect(statsAfterSecond.activeCorrelations).toBeGreaterThan(statsAfterFirst.activeCorrelations);

      // Test that ending correlations decreases the count
      endCorrelation(correlationId1);
      const statsAfterEnd = logger.getStats();
      expect(statsAfterEnd.activeCorrelations).toBeLessThan(statsAfterSecond.activeCorrelations);

      endCorrelation(correlationId2);
      const finalStats = logger.getStats();
      expect(finalStats.activeCorrelations).toBeLessThanOrEqual(initialStats.activeCorrelations);
    });

    it('should cleanup old correlation contexts', () => {
      // Start a correlation and manually age it
      const correlationId = startCorrelation({ jobId: 'cleanup-test' });

      // Manually set start time to simulate aging
      const context = logger.getCorrelationContext(correlationId);
      if (context) {
        context.startTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      }

      // Run cleanup with 1 hour max age
      logger.cleanup(60 * 60 * 1000);

      // Correlation should be cleaned up
      expect(logger.getCorrelationContext(correlationId)).toBeUndefined();
    });

    it('should handle cleanup of non-existent contexts gracefully', () => {
      expect(() => {
        logger.cleanup(1000);
      }).not.toThrow();
    });
  });

  describe('Log Format Validation', () => {
    let correlationId: string;

    beforeEach(() => {
      correlationId = startCorrelation({
        jobId: 'format-test-job',
        tier: 'MEDIUM' as const
      });
    });

    afterEach(() => {
      endCorrelation(correlationId);
    });

    it('should maintain consistent log structure across all log types', () => {
      // Reset mock calls to isolate the test
      logger.info.mockClear();
      logger.warn.mockClear();
      logger.error.mockClear();

      // Test all log types for consistent structure
      logStageStart(correlationId, 'test-stage');
      logStageComplete(correlationId, 'test-stage', { stageDuration: 100 });
      logBudgetEnforcement(correlationId, 'test-action', { test: true });
      logPerformance(correlationId, { testMetric: 123 });

      // All calls should have correlationId and jobId
      expect(logger.info).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();

      // Check info calls (stage start, stage complete, performance)
      logger.info.mock.calls.forEach(([message, metadata]) => {
        expect(metadata).toHaveProperty('correlationId', correlationId);
        expect(metadata).toHaveProperty('jobId', 'format-test-job');
        expect(metadata).toHaveProperty('timestamp');
        expect(typeof metadata.timestamp).toBe('number');
      });

      // Check warn call (budget enforcement)
      logger.warn.mock.calls.forEach(([message, metadata]) => {
        expect(metadata).toHaveProperty('correlationId', correlationId);
        expect(metadata).toHaveProperty('jobId', 'format-test-job');
        expect(metadata).toHaveProperty('timestamp');
        expect(typeof metadata.timestamp).toBe('number');
      });
    });

    it('should handle undefined/null metadata gracefully', () => {
      expect(() => {
        logStageStart(correlationId, 'test-stage', undefined as any);
        logStageComplete(correlationId, 'test-stage', null as any);
      }).not.toThrow();
    });
  });
});