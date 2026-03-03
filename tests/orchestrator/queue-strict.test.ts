// ABOUTME: Queue Strict Mode Tests for EIP Orchestrator
// ABOUTME: Tests EIP_QUEUE_STRICT mode for fail-fast behavior without fallback

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock problematic ES modules at the top level
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-1234'),
  v1: jest.fn(() => 'mock-uuid-v1-1234'),
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    process: jest.fn(),
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('ioredis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
  })),
}));

// Mock the queue module
jest.mock('../../lib_supabase/queue/eip-queue');

// Import the actual controller to test
import { runOnce } from '../../orchestrator/controller';
import { submitContentGenerationJob } from '../../lib_supabase/queue/eip-queue';

const mockSubmitContentGenerationJob = submitContentGenerationJob as jest.MockedFunction<typeof submitContentGenerationJob>;

describe('Queue Strict Mode Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  describe('EIP_QUEUE_STRICT mode', () => {
    it('should fail fast without fallback when queue submission fails in strict mode', async () => {
      // Enable strict mode
      process.env.EIP_QUEUE_STRICT = 'true';

      // Mock failed queue submission
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: undefined,
        success: false,
        error: 'Queue service unavailable'
      });

      const brief = {
        brief: 'Explain the strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      // Should fail without fallback
      expect(result.success).toBe(false);
      expect(result.error).toContain('strict mode');
      expect(result.error).toContain('Queue submission failed');
      expect(result.queue_job_id).toBeUndefined();
      // Should NOT have artifact from fallback
      expect(result.artifact).toBeUndefined();
    });

    it('should fail fast without fallback when queue throws exception in strict mode', async () => {
      // Enable strict mode
      process.env.EIP_QUEUE_STRICT = 'true';

      // Mock queue throwing exception
      mockSubmitContentGenerationJob.mockRejectedValue(new Error('Queue connection timeout'));

      const brief = {
        brief: 'Explain the strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      // Should fail without fallback
      expect(result.success).toBe(false);
      expect(result.error).toContain('strict mode');
      expect(result.error).toContain('Queue processing failed');
      expect(result.queue_job_id).toBeUndefined();
      // Should NOT have artifact from fallback
      expect(result.artifact).toBeUndefined();
    });

    it('should fall back to direct execution when not in strict mode', async () => {
      // Ensure strict mode is disabled and test mode is off (to allow fallback)
      process.env.EIP_QUEUE_STRICT = 'false';
      delete process.env.EIP_TEST_MODE;

      // Mock failed queue submission
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: undefined,
        success: false,
        error: 'Queue service unavailable'
      });

      const brief = {
        brief: 'Explain the strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      // Should succeed via fallback to direct execution
      expect(result.success).toBe(true);
      // Artifact should exist from direct execution fallback
      expect(result.artifact).toBeDefined();
    });

    it('should fall back to direct execution when EIP_QUEUE_STRICT is not set', async () => {
      // Ensure EIP_QUEUE_STRICT is not set (undefined) and test mode is off
      delete process.env.EIP_QUEUE_STRICT;
      delete process.env.EIP_TEST_MODE;

      // Mock failed queue submission
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: undefined,
        success: false,
        error: 'Queue service unavailable'
      });

      const brief = {
        brief: 'Explain the strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      // Should succeed via fallback to direct execution (default behavior)
      expect(result.success).toBe(true);
      expect(result.artifact).toBeDefined();
    });

    it('should succeed with queue submission in strict mode when queue works', async () => {
      // Enable strict mode
      process.env.EIP_QUEUE_STRICT = 'true';

      // Mock successful queue submission
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: 'test-job-456',
        success: true
      });

      const brief = {
        brief: 'Explain the strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      // Should succeed when queue works
      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBe('test-job-456');
      expect(result.artifact).toBeDefined();
    });
  });
});
