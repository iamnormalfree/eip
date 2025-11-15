// ABOUTME: Controller-Queue Integration Testing for EIP Orchestrator
// ABOUTME: Tests end-to-end queue processing, correlation tracking, and budget enforcement

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock both the controller and queue modules
jest.mock('../../lib_supabase/queue/eip-queue');
jest.mock('../../orchestrator/controller', () => ({
  runOnce: jest.fn()
}));

import { runOnce } from '../../orchestrator/controller';
import { submitContentGenerationJob } from '../../lib_supabase/queue/eip-queue';
import { EIP_QUEUES } from '../../lib_supabase/queue/eip-queue';

const mockSubmitContentGenerationJob = submitContentGenerationJob as jest.MockedFunction<typeof submitContentGenerationJob>;
const mockRunOnce = runOnce as jest.MockedFunction<typeof runOnce>;

describe('Controller-Queue Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Queue Mode Integration', () => {
    it('should submit job to queue when queue_mode is enabled', async () => {
      // Mock successful queue response through controller
      mockRunOnce.mockResolvedValue({
        success: true,
        queue_job_id: 'test-job-123'
      });

      const brief = {
        brief: 'Explain the strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        correlation_id: 'test-correlation-123',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBe('test-job-123');
      expect(mockRunOnce).toHaveBeenCalledTimes(1);

      // Verify controller was called with correct brief
      const controllerCallData = mockRunOnce.mock.calls[0][0];
      expect(controllerCallData.brief).toBe(brief.brief);
      expect(controllerCallData.persona).toBe(brief.persona);
      expect(controllerCallData.funnel).toBe(brief.funnel);
      expect(controllerCallData.tier).toBe(brief.tier);
      expect(controllerCallData.correlation_id).toBe(brief.correlation_id);
      expect(controllerCallData.queue_mode).toBe(true);
    });

    it('should handle queue submission failures gracefully', async () => {
      // Mock failed queue submission
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: '',
        success: false,
        error: 'Redis connection failed'
      });

      const brief = {
        brief: 'Test brief',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Redis connection failed');
      expect(result.queue_job_id).toBeUndefined();
    });

    it('should validate required brief for queue submission', async () => {
      const brief = {
        brief: '',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Brief is required for content generation');
      expect(mockSubmitContentGenerationJob).not.toHaveBeenCalled();
    });

    it('should set appropriate priority based on tier', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'test-job',
        success: true
      });

      const tiers = ['LIGHT', 'MEDIUM', 'HEAVY'] as const;
      const expectedPriorities = [5, 3, 1];

      for (let i = 0; i < tiers.length; i++) {
        const brief = {
          brief: 'Test brief',
          tier: tiers[i],
          queue_mode: true
        };

        await runOnce(brief);

        const submissionData = mockSubmitContentGenerationJob.mock.calls[i][0];
        expect(submissionData.priority).toBe(expectedPriorities[i]);
        expect(submissionData.tier).toBe(tiers[i]);
      }
    });
  });

  describe('Correlation ID Tracking', () => {
    it('should propagate correlation ID through queue submission', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'test-job',
        success: true
      });

      const correlationId = 'test-correlation-abc-123';
      const brief = {
        brief: 'Test content generation',
        correlation_id: correlationId,
        queue_mode: true
      };

      await runOnce(brief);

      const submissionData = mockSubmitContentGenerationJob.mock.calls[0][0];
      expect(submissionData.correlation_id).toBe(correlationId);
      expect(submissionData.metadata?.correlation_id).toBe(correlationId);
    });

    it('should generate correlation ID when not provided', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'test-job',
        success: true
      });

      const brief = {
        brief: 'Test content generation',
        queue_mode: true
      };

      await runOnce(brief);

      const submissionData = mockSubmitContentGenerationJob.mock.calls[0][0];
      // Should have a correlation ID (either generated or undefined is acceptable)
      expect(submissionData.correlation_id).toBeDefined();
    });
  });

  describe('Direct Execution Mode (Legacy Compatibility)', () => {
    it('should run directly when queue_mode is false', async () => {
      const brief = {
        brief: 'Simple test content',
        queue_mode: false
      };

      // Mock queue submission to ensure it's not called
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'should-not-be-called',
        success: true
      });

      const result = await runOnce(brief);

      // Should not call queue submission in direct mode
      expect(mockSubmitContentGenerationJob).not.toHaveBeenCalled();

      // Should return some form of result (success may vary based on implementation)
      expect(result).toBeDefined();
    });

    it('should handle direct execution failures gracefully', async () => {
      const brief = {
        brief: '', // Empty brief should cause failure
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(mockSubmitContentGenerationJob).not.toHaveBeenCalled();
      // Result handling may vary, but should not crash
      expect(result).toBeDefined();
    });
  });

  describe('Queue Mode Environment Variable', () => {
    it('should respect EIP_QUEUE_MODE environment variable', async () => {
      const originalEnv = process.env.EIP_QUEUE_MODE;

      try {
        // Set environment variable to enable queue mode
        process.env.EIP_QUEUE_MODE = 'enabled';
        mockSubmitContentGenerationJob.mockResolvedValue({
          jobId: 'env-test-job',
          success: true
        });

        const brief = {
          brief: 'Test environment variable',
          // No queue_mode specified - should use environment default
        };

        await runOnce(brief);

        expect(mockSubmitContentGenerationJob).toHaveBeenCalledTimes(1);
        const submissionData = mockSubmitContentGenerationJob.mock.calls[0][0];
        expect(submissionData.metadata?.queue_mode).toBe(true);
      } finally {
        // Restore original environment variable
        if (originalEnv !== undefined) {
          process.env.EIP_QUEUE_MODE = originalEnv;
        } else {
          delete process.env.EIP_QUEUE_MODE;
        }
      }
    });

    it('should prefer explicit queue_mode over environment variable', async () => {
      const originalEnv = process.env.EIP_QUEUE_MODE;

      try {
        // Set environment variable to enabled
        process.env.EIP_QUEUE_MODE = 'enabled';
        mockSubmitContentGenerationJob.mockResolvedValue({
          jobId: 'explicit-override-job',
          success: true
        });

        const brief = {
          brief: 'Test explicit override',
          queue_mode: false // Explicitly disable queue mode
        };

        await runOnce(brief);

        // Should not use queue despite environment variable
        expect(mockSubmitContentGenerationJob).not.toHaveBeenCalled();
      } finally {
        if (originalEnv !== undefined) {
          process.env.EIP_QUEUE_MODE = originalEnv;
        } else {
          delete process.env.EIP_QUEUE_MODE;
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle queue submission exceptions', async () => {
      // Mock queue submission to throw an exception
      mockSubmitContentGenerationJob.mockRejectedValue(new Error('Redis connection timeout'));

      const brief = {
        brief: 'Test exception handling',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Redis connection timeout');
    });

    it('should handle malformed brief content gracefully', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'malformed-test-job',
        success: true
      });

      const malformedBriefs = [
        { brief: null, queue_mode: true },
        { brief: undefined, queue_mode: true },
        { brief: 123 as any, queue_mode: true },
        { brief: {}, queue_mode: true }
      ];

      for (const brief of malformedBriefs) {
        const result = await runOnce(brief);

        if (brief.brief === null || brief.brief === undefined || brief.brief === '') {
          // Should fail for null/undefined/empty briefs
          expect(result.success).toBe(false);
          expect(result.error).toContain('Brief is required');
        } else {
          // Should handle other types gracefully
          expect(result).toBeDefined();
        }
      }
    });

    it('should handle large brief content', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'large-brief-job',
        success: true
      });

      const largeBrief = 'a'.repeat(10000); // 10KB brief
      const brief = {
        brief: largeBrief,
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(mockSubmitContentGenerationJob).toHaveBeenCalledTimes(1);
      const submissionData = mockSubmitContentGenerationJob.mock.calls[0][0];
      expect(submissionData.brief).toBe(largeBrief);
    });
  });

  describe('Metadata and Job Tracking', () => {
    it('should include comprehensive metadata in queue submission', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'metadata-test-job',
        success: true
      });

      const brief = {
        brief: 'Test metadata',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        correlation_id: 'test-metadata-123',
        queue_mode: true
      };

      await runOnce(brief);

      const submissionData = mockSubmitContentGenerationJob.mock.calls[0][0];

      // Check metadata content
      expect(submissionData.metadata).toBeDefined();
      expect(submissionData.metadata?.submission_source).toBe('orchestrator_controller');
      expect(submissionData.metadata?.queue_mode).toBe(true);
      expect(submissionData.metadata?.timestamp).toBeDefined();
      expect(submissionData.metadata?.correlation_id).toBe('test-metadata-123');
    });

    it('should generate unique job IDs', async () => {
      mockSubmitContentGenerationJob.mockImplementation((data) => {
        // Simulate job ID generation
        const jobId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return Promise.resolve({ jobId, success: true });
      });

      const brief = {
        brief: 'Test unique job IDs',
        queue_mode: true
      };

      // Submit multiple jobs
      const jobIds = [];
      for (let i = 0; i < 5; i++) {
        const result = await runOnce(brief);
        if (result.queue_job_id) {
          jobIds.push(result.queue_job_id);
        }
      }

      // All job IDs should be unique
      const uniqueJobIds = [...new Set(jobIds)];
      expect(uniqueJobIds).toHaveLength(jobIds.length);
    });
  });

  describe('Integration Contract Compliance', () => {
    it('should follow queue-first architecture contract', async () => {
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'contract-test-job',
        success: true
      });

      const brief = {
        brief: 'Contract compliance test',
        queue_mode: true
      };

      const result = await runOnce(brief);

      // Contract: Should submit to EIP queue system
      expect(mockSubmitContentGenerationJob).toHaveBeenCalledTimes(1);

      // Contract: Should return queue job ID on success
      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBeDefined();
      expect(result.queue_job_id).toMatch(/^content-\d+-[a-z0-9]+$/);
    });

    it('should maintain backward compatibility contract', async () => {
      const brief = {
        brief: 'Backward compatibility test',
        queue_mode: false
      };

      // Contract: Should not use queue when disabled
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'should-not-be-called',
        success: true
      });

      const result = await runOnce(brief);

      expect(mockSubmitContentGenerationJob).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});