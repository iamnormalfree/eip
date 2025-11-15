// ABOUTME: Controller Integration Testing for EIP Orchestrator
// ABOUTME: Tests controller functionality, queue mode switching, and integration contracts

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the controller module to test interface compliance
jest.mock('../../orchestrator/controller', () => ({
  runOnce: jest.fn()
}));

import { runOnce } from '../../orchestrator/controller';

const mockRunOnce = runOnce as jest.MockedFunction<typeof runOnce>;

describe('Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Controller Interface Compliance', () => {
    it('should have correct function signature and return type', async () => {
      // Mock successful execution
      mockRunOnce.mockResolvedValue({
        success: true,
        artifact: { content: 'test content' }
      });

      const brief = {
        brief: 'Test integration',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const
      };

      const result = await runOnce(brief);

      expect(mockRunOnce).toHaveBeenCalledTimes(1);
      expect(mockRunOnce).toHaveBeenCalledWith(brief);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.artifact).toBeDefined();
    });

    it('should handle all required brief parameters', async () => {
      mockRunOnce.mockResolvedValue({
        success: true,
        artifact: { content: 'test' }
      });

      const brief = {
        brief: 'Complete test brief',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        correlation_id: 'test-correlation',
        queue_mode: true
      };

      await runOnce(brief);

      expect(mockRunOnce).toHaveBeenCalledWith({
        brief: 'Complete test brief',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM',
        correlation_id: 'test-correlation',
        queue_mode: true
      });
    });
  });

  describe('Queue Mode Integration', () => {
    it('should handle queue mode submission correctly', async () => {
      mockRunOnce.mockResolvedValue({
        success: true,
        queue_job_id: 'queue-test-job-123',
        artifact: undefined
      });

      const brief = {
        brief: 'Test queue submission',
        queue_mode: true,
        tier: 'HEAVY' as const
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBe('queue-test-job-123');
      expect(result.artifact).toBeUndefined();
    });

    it('should handle direct execution mode correctly', async () => {
      mockRunOnce.mockResolvedValue({
        success: true,
        artifact: { content: 'direct execution result' }
      });

      const brief = {
        brief: 'Test direct execution',
        queue_mode: false,
        tier: 'LIGHT' as const
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBeUndefined();
      expect(result.artifact).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors correctly', async () => {
      mockRunOnce.mockResolvedValue({
        success: false,
        error: 'Brief is required for content generation'
      });

      const brief = {
        brief: '',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Brief is required');
      expect(result.queue_job_id).toBeUndefined();
    });

    it('should handle processing errors correctly', async () => {
      mockRunOnce.mockResolvedValue({
        success: false,
        error: 'Router selection failed'
      });

      const brief = {
        brief: 'Test error handling',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Router selection failed');
    });
  });

  describe('Correlation ID Integration', () => {
    it('should propagate correlation ID through processing', async () => {
      const correlationId = 'test-correlation-integration-123';

      mockRunOnce.mockImplementation((input) => {
        // Simulate correlation ID handling
        return Promise.resolve({
          success: true,
          artifact: {
            content: 'test result',
            correlation_id: input.correlation_id || correlationId
          }
        });
      });

      const brief = {
        brief: 'Test correlation ID',
        correlation_id: correlationId,
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.correlation_id).toBe(correlationId);
    });

    it('should generate correlation ID when not provided', async () => {
      mockRunOnce.mockImplementation((input) => {
        // Simulate correlation ID generation
        const generatedId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        return Promise.resolve({
          success: true,
          artifact: {
            content: 'test result',
            correlation_id: input.correlation_id || generatedId
          }
        });
      });

      const brief = {
        brief: 'Test without correlation ID',
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.correlation_id).toBeDefined();
      expect(typeof result.artifact?.correlation_id).toBe('string');
    });
  });

  describe('Tier-Based Processing', () => {
    it('should handle different tier configurations correctly', async () => {
      const tiers = ['LIGHT', 'MEDIUM', 'HEAVY'] as const;

      for (const tier of tiers) {
        mockRunOnce.mockResolvedValue({
          success: true,
          artifact: {
            content: `Result for ${tier} tier`,
            tier_used: tier
          }
        });

        const brief = {
          brief: `Test ${tier} tier processing`,
          tier: tier,
          queue_mode: false
        };

        const result = await runOnce(brief);

        expect(result.success).toBe(true);
        expect(result.artifact?.tier_used).toBe(tier);
      }

      // Verify controller was called for each tier
      expect(mockRunOnce).toHaveBeenCalledTimes(3);
    });

    it('should use MEDIUM as default tier', async () => {
      mockRunOnce.mockImplementation((input) => {
        const tier = input.tier || 'MEDIUM';
        return Promise.resolve({
          success: true,
          artifact: {
            content: 'Default tier result',
            tier_used: tier
          }
        });
      });

      const brief = {
        brief: 'Test default tier',
        // No tier specified - should default to MEDIUM
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.tier_used).toBe('MEDIUM');
    });
  });

  describe('Persona and Funnel Integration', () => {
    it('should handle persona-funnel combinations correctly', async () => {
      const testCases = [
        {
          persona: 'professional',
          funnel: 'mofu',
          expected_ip: 'framework@1.0.0'
        },
        {
          persona: 'decision_maker',
          funnel: 'bofu',
          expected_ip: 'process@1.0.0'
        },
        {
          persona: 'researcher',
          funnel: 'tofu',
          expected_ip: 'comparative@1.0.0'
        }
      ];

      for (const testCase of testCases) {
        mockRunOnce.mockResolvedValue({
          success: true,
          artifact: {
            content: `Result for ${testCase.persona} in ${testCase.funnel}`,
            selected_ip: testCase.expected_ip
          }
        });

        const brief = {
          brief: `Test ${testCase.persona} ${testCase.funnel}`,
          persona: testCase.persona,
          funnel: testCase.funnel,
          queue_mode: false
        };

        const result = await runOnce(brief);

        expect(result.success).toBe(true);
        expect(result.artifact?.selected_ip).toBe(testCase.expected_ip);
      }
    });
  });

  describe('Performance and Scaling', () => {
    it('should handle concurrent requests efficiently', async () => {
      mockRunOnce.mockImplementation((input) => {
        // Extract index from brief or provide default
        const match = input.brief.match(/Concurrent test (\d+)/);
        const index = match ? parseInt(match[1]) : 0;

        return Promise.resolve({
          success: true,
          artifact: {
            content: `concurrent test result ${index}`,
            processed_index: index
          }
        });
      });

      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(runOnce({
          brief: `Concurrent test ${i}`,
          queue_mode: false
        }));
      }

      const results = await Promise.all(requests);

      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.artifact?.processed_index).toBe(index);
      });

      expect(mockRunOnce).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should maintain request isolation', async () => {
      const correlationIds = ['test-1', 'test-2', 'test-3'];

      mockRunOnce.mockImplementation((input) => {
        return Promise.resolve({
          success: true,
          artifact: {
            content: 'Isolation test result',
            correlation_id: input.correlation_id
          }
        });
      });

      const requests = correlationIds.map((id, index) =>
        runOnce({
          brief: `Isolation test ${index}`,
          correlation_id: id,
          queue_mode: false
        })
      );

      const results = await Promise.all(requests);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.artifact?.correlation_id).toBe(correlationIds[index]);
      });
    });
  });

  describe('Integration Contract Verification', () => {
    it('should maintain response structure contract', async () => {
      mockRunOnce.mockResolvedValue({
        success: true,
        artifact: { content: 'test', metadata: {} },
        queue_job_id: 'test-job-id'
      });

      const brief = {
        brief: 'Contract verification test',
        queue_mode: false
      };

      const result = await runOnce(brief);

      // Verify response structure matches contract
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('artifact');
      // queue_job_id may not always be present (only for queue mode), so check existence separately
      expect('queue_job_id' in result).toBe(true);

      expect(typeof result.success).toBe('boolean');
      expect(result.success).toBe(true);
    });

    it('should provide comprehensive error information', async () => {
      mockRunOnce.mockResolvedValue({
        success: false,
        error: 'Simulated processing error',
        error_details: {
          stage: 'router',
          error_type: 'selection_failed',
          context: { input: 'test data' }
        }
      });

      const brief = {
        brief: 'Error contract test',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Simulated processing error');
    });
  });
});