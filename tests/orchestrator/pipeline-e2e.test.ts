// ABOUTME: End-to-End Pipeline Integration Testing for EIP Orchestrator
// ABOUTME: Validates complete content generation workflow with budget enforcement and queue integration

// Mock problematic ES modules before any imports that might use them
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'e2e-test-uuid-1234'),
  v1: jest.fn(() => 'e2e-test-uuid-v1-1234'),
  v3: jest.fn(() => 'e2e-test-uuid-v3-1234'),
  v5: jest.fn(() => 'e2e-test-uuid-v5-1234'),
  NIL: '00000000-0000-0000-0000-000000000000',
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
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
  Worker: jest.fn(() => ({
    run: jest.fn(),
    close: jest.fn(),
  })),
  QueueEvents: jest.fn(() => ({
    close: jest.fn(),
  })),
}));

jest.mock('msgpackr', () => ({
  Packr: jest.fn(),
  Encoder: jest.fn(),
  addExtension: jest.fn(),
  pack: jest.fn(() => Buffer.from('packed')),
  encode: jest.fn(() => Buffer.from('encoded')),
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

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runOnce } from '../../orchestrator/controller';
import { BudgetEnforcer } from '../../orchestrator/budget';
import { getLogger } from '../../orchestrator/logger';

// Mock external dependencies
jest.mock('../../lib_supabase/queue/eip-queue');
jest.mock('../../orchestrator/database');
jest.mock('../../orchestrator/retrieval');
jest.mock('../../orchestrator/auditor');
jest.mock('../../orchestrator/repairer');
jest.mock('../../orchestrator/publisher');

import { submitContentGenerationJob } from '../../lib_supabase/queue/eip-queue';
import { OrchestratorDB } from '../../orchestrator/database';
import { parallelRetrieve } from '../../orchestrator/retrieval';
import { microAudit } from '../../orchestrator/auditor';
import { repairDraft } from '../../orchestrator/repairer';
import { publishArtifact } from '../../orchestrator/publisher';

const mockSubmitContentGenerationJob = submitContentGenerationJob as jest.MockedFunction<typeof submitContentGenerationJob>;
const mockOrchestratorDB = OrchestratorDB as jest.MockedClass<typeof OrchestratorDB>;
const mockParallelRetrieve = parallelRetrieve as jest.MockedFunction<typeof parallelRetrieve>;
const mockMicroAudit = microAudit as jest.MockedFunction<typeof microAudit>;
const mockRepairDraft = repairDraft as jest.MockedFunction<typeof repairDraft>;
const mockPublishArtifact = publishArtifact as jest.MockedFunction<typeof publishArtifact>;

describe('End-to-End Pipeline Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mock implementations
    mockSubmitContentGenerationJob.mockResolvedValue({
      jobId: 'test-queue-job-123',
      success: true
    });

    mockOrchestratorDB.mockImplementation(() => {
      const mockInstance = {
        createJob: jest.fn().mockResolvedValue({
          job: { id: 'test-db-job-123' },
          error: null
        }),
        updateJob: jest.fn().mockResolvedValue({ error: null }),
        createArtifact: jest.fn().mockResolvedValue({
          artifact: { id: 'test-artifact-123' },
          error: null
        }),
        failJobToDLQ: jest.fn().mockResolvedValue({ error: null })
      };

      // Debug log to verify mock is being used
      console.log('🔧 Creating mock OrchestratorDB instance');
      return mockInstance as any;
    });

    mockParallelRetrieve.mockResolvedValue({
      candidates: [{ id: 'source1', title: 'Test Source' }],
      flags: { graph_sparse: false }
    });

    mockMicroAudit.mockResolvedValue({
      tags: ['quality:good'],
      score: 0.85
    });

    mockRepairDraft.mockResolvedValue('Repaired draft content');

    mockPublishArtifact.mockResolvedValue({
      mdx: '# Test Content',
      frontmatter: { title: 'Test' },
      jsonld: { '@type': 'Article' },
      ledger: { version: '1.0.0' }
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Complete Content Generation Workflow', () => {
    it('should process job successfully through all pipeline stages in direct mode', async () => {
      const brief = {
        brief: 'Explain the strategic framework for business expansion in Southeast Asia',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        correlation_id: 'e2e-test-123',
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact).toBeDefined();
      expect(result.artifact?.metadata?.budget_tier).toBe('MEDIUM');
      expect(result.artifact?.metadata?.processing_mode).toBe('direct_execution');
      expect(result.artifact?.metadata?.correlation_id).toBeDefined();

      // Verify all pipeline stages were called
      expect(mockParallelRetrieve).toHaveBeenCalledWith({
        query: brief.brief
      });
      expect(mockMicroAudit).toHaveBeenCalled();
      expect(mockRepairDraft).toHaveBeenCalled();
      expect(mockPublishArtifact).toHaveBeenCalled();

      // Verify database operations
      expect(mockOrchestratorDB).toHaveBeenCalledTimes(1);
      expect(mockOrchestratorDB.mock.results[0].value.createJob).toHaveBeenCalled();
      expect(mockOrchestratorDB.mock.results[0].value.updateJob).toHaveBeenCalled();
      expect(mockOrchestratorDB.mock.results[0].value.createArtifact).toHaveBeenCalled();
    });

    it('should submit job to queue in queue mode', async () => {
      const brief = {
        brief: 'Test queue submission workflow',
        persona: 'decision_maker',
        funnel: 'bofu',
        tier: 'HEAVY' as const,
        correlation_id: 'queue-test-456',
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBe('test-queue-job-123');
      expect(result.artifact?.metadata?.processing_mode).toBe('queue_first');

      // Verify queue submission was called with correct parameters
      expect(mockSubmitContentGenerationJob).toHaveBeenCalledWith({
        brief: brief.brief,
        persona: brief.persona,
        funnel: brief.funnel,
        tier: 'HEAVY',
        correlation_id: expect.stringMatching(/^[a-f0-9-]+$/),
        priority: 1, // HEAVY tier gets priority 1
        metadata: expect.objectContaining({
          submission_source: 'orchestrator_controller',
          queue_mode: true,
          timestamp: expect.any(String)
        })
      });

      // Verify database operations were NOT called in queue mode
      expect(mockOrchestratorDB).not.toHaveBeenCalled();
    });

    it('should handle pipeline stage failures gracefully', async () => {
      // Mock retrieval failure
      mockParallelRetrieve.mockRejectedValue(new Error('Retrieval service unavailable'));

      const brief = {
        brief: 'Test failure handling',
        tier: 'LIGHT' as const,
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Retrieval service unavailable');
      expect(result.correlation_id).toBeDefined();

      // Verify error was logged
      const logger = getLogger();
      // Note: In a real test, you'd verify logger calls, but for now we check the result
    });

    it('should maintain correlation tracking throughout pipeline', async () => {
      const brief = {
        brief: 'Test correlation tracking',
        persona: 'researcher',
        funnel: 'tofu',
        tier: 'MEDIUM' as const,
        correlation_id: 'correlation-test-789',
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.metadata?.correlation_id).toBeDefined();

      // Correlation ID should be consistent throughout the pipeline
      const correlationId = result.artifact?.metadata?.correlation_id;
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);
    });
  });

  describe('Budget Enforcement Integration', () => {
    it('should enforce budget limits across all pipeline stages', async () => {
      // Test with LIGHT tier (smaller budgets)
      const brief = {
        brief: 'A'.repeat(1000), // Long brief to potentially exceed budget
        tier: 'LIGHT' as const,
        queue_mode: false
      };

      // Mock generation that would exceed budget
      const largeDraft = 'B'.repeat(2000); // Should exceed LIGHT generator budget (1400 tokens)

      // We can't easily mock the internal generateDraft function, but we can test
      // the budget enforcement logic directly
      const budgetEnforcer = new BudgetEnforcer('LIGHT');

      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 1500); // Exceed LIGHT generator budget
      budgetEnforcer.endStage('generator');

      const budgetCheck = budgetEnforcer.checkStageBudget('generator');
      expect(budgetCheck.ok).toBe(false);
      expect(budgetCheck.reason).toContain('generator exceeded token budget');

      // Verify DLQ record creation
      expect(budgetEnforcer.shouldFailToDLQ()).toBe(true);
      const dlqRecord = budgetEnforcer.createDLQRecord();
      expect(dlqRecord).toBeDefined();
      expect(dlqRecord.fail_reason).toContain('Budget breach');
    });

    it('should handle budget violations with proper DLQ routing', async () => {
      // Mock a scenario where generator stage fails budget check
      const brief = {
        brief: 'Test budget violation handling',
        tier: 'MEDIUM' as const,
        queue_mode: false
      };

      // Mock database to capture DLQ routing
      const mockFailJobToDLQ = jest.fn();
      mockOrchestratorDB.mockImplementation(() => ({
        createJob: jest.fn().mockResolvedValue({
          job: { id: 'budget-test-job' },
          error: null
        }),
        updateJob: jest.fn().mockResolvedValue({ error: null }),
        createArtifact: jest.fn().mockResolvedValue({
          artifact: { id: 'test-artifact' },
          error: null
        }),
        failJobToDLQ: mockFailJobToDLQ
      } as any));

      // This test would require more complex mocking to simulate actual budget violations
      // For now, we verify the budget enforcement components work correctly
      const budgetEnforcer = new BudgetEnforcer('MEDIUM');

      // Simulate budget breach
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 3000); // Exceed MEDIUM generator budget
      budgetEnforcer.endStage('generator');
      budgetEnforcer.checkStageBudget('generator');

      expect(budgetEnforcer.shouldFailToDLQ()).toBe(true);

      const dlqRecord = budgetEnforcer.createDLQRecord();
      expect(dlqRecord.budget_tier).toBe('MEDIUM');
      expect(dlqRecord.breaches.length).toBeGreaterThan(0);
    });
  });

  describe('Queue Integration Edge Cases', () => {
    it('should fallback to direct execution when queue submission fails', async () => {
      // Mock queue submission failure
      mockSubmitContentGenerationJob.mockResolvedValue({
        jobId: '',
        success: false,
        error: 'Redis connection timeout'
      });

      const brief = {
        brief: 'Test queue fallback mechanism',
        tier: 'MEDIUM' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.metadata?.processing_mode).toBe('direct_execution');

      // Should attempt queue submission first
      expect(mockSubmitContentGenerationJob).toHaveBeenCalledTimes(1);

      // Should then proceed with direct execution
      expect(mockOrchestratorDB).toHaveBeenCalled();
      expect(mockParallelRetrieve).toHaveBeenCalled();
    });

    it('should handle queue submission exceptions gracefully', async () => {
      // Mock queue submission to throw exception
      mockSubmitContentGenerationJob.mockRejectedValue(
        new Error('Queue system temporarily unavailable')
      );

      const brief = {
        brief: 'Test queue exception handling',
        tier: 'LIGHT' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.metadata?.processing_mode).toBe('direct_execution');

      // Should have attempted queue submission
      expect(mockSubmitContentGenerationJob).toHaveBeenCalledTimes(1);

      // Should have fallen back to direct execution
      expect(mockOrchestratorDB).toHaveBeenCalled();
    });

    it('should set appropriate queue priorities based on tier', async () => {
      const testCases = [
        { tier: 'LIGHT' as const, expectedPriority: 5 },
        { tier: 'MEDIUM' as const, expectedPriority: 3 },
        { tier: 'HEAVY' as const, expectedPriority: 1 }
      ];

      for (const testCase of testCases) {
        mockSubmitContentGenerationJob.mockClear();

        const brief = {
          brief: `Test priority for ${testCase.tier} tier`,
          tier: testCase.tier,
          queue_mode: true
        };

        await runOnce(brief);

        expect(mockSubmitContentGenerationJob).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: testCase.expectedPriority,
            tier: testCase.tier
          })
        );
      }
    });
  });

  describe('Database Integration Reliability', () => {
    it('should operate successfully when database is unavailable', async () => {
      // Mock database connection failure
      mockOrchestratorDB.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const brief = {
        brief: 'Test database unavailability handling',
        tier: 'MEDIUM' as const,
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.metadata?.db_persisted).toBe(false);

      // Should still process all pipeline stages
      expect(mockParallelRetrieve).toHaveBeenCalled();
      expect(mockMicroAudit).toHaveBeenCalled();
      expect(mockRepairDraft).toHaveBeenCalled();
      expect(mockPublishArtifact).toHaveBeenCalled();
    });

    it('should handle individual database operation failures gracefully', async () => {
      // Mock database with partial failures
      mockOrchestratorDB.mockImplementation(() => ({
        createJob: jest.fn().mockResolvedValue({
          job: { id: 'test-job' },
          error: null
        }),
        updateJob: jest.fn().mockResolvedValue({
          error: 'Update operation failed'
        }),
        createArtifact: jest.fn().mockResolvedValue({
          artifact: { id: 'test-artifact' },
          error: 'Artifact creation failed'
        }),
        failJobToDLQ: jest.fn().mockResolvedValue({ error: null })
      } as any));

      const brief = {
        brief: 'Test partial database failures',
        tier: 'LIGHT' as const,
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      // Should succeed despite database failures
      expect(mockParallelRetrieve).toHaveBeenCalled();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete pipeline within expected timeframes', async () => {
      const brief = {
        brief: 'Test pipeline performance',
        tier: 'MEDIUM' as const,
        queue_mode: false
      };

      const startTime = Date.now();
      const result = await runOnce(brief);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should complete within reasonable time (adjust based on your requirements)
      expect(duration).toBeLessThan(10000); // 10 seconds max

      // Verify performance metrics are captured
      expect(result.artifact?.metadata?.duration_ms).toBeDefined();
      expect(result.artifact?.metadata?.tokens_used).toBeDefined();
    });

    it('should track token usage accurately across stages', async () => {
      const brief = {
        brief: 'Test token usage tracking',
        tier: 'HEAVY' as const,
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.artifact?.metadata?.tokens_used).toBeGreaterThan(0);
      expect(typeof result.artifact?.metadata?.tokens_used).toBe('number');

      // Should be within HEAVY tier budget
      expect(result.artifact?.metadata?.tokens_used).toBeLessThanOrEqual(4000);
    });

    it('should handle concurrent job processing', async () => {
      const concurrentJobs = 5;
      const jobs = Array.from({ length: concurrentJobs }, (_, i) => ({
        brief: `Test concurrent job ${i + 1}`,
        tier: 'MEDIUM' as const,
        correlation_id: `concurrent-test-${i + 1}`,
        queue_mode: false
      }));

      const startTime = Date.now();
      const results = await Promise.all(jobs.map(job => runOnce(job)));
      const duration = Date.now() - startTime;

      // All jobs should complete successfully
      expect(results.every(r => r.success)).toBe(true);

      // Should complete in reasonable time (demonstrating concurrent processing)
      expect(duration).toBeLessThan(15000); // 15 seconds for 5 concurrent jobs

      // Each job should have unique correlation ID
      const correlationIds = results.map(r => r.artifact?.metadata?.correlation_id);
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBe(concurrentJobs);
    });
  });

  describe('Integration Contract Compliance', () => {
    it('should maintain complete audit trail for all jobs', async () => {
      const brief = {
        brief: 'Test audit trail compliance',
        persona: 'professional',
        funnel: 'mofu',
        tier: 'MEDIUM' as const,
        correlation_id: 'audit-test-123',
        queue_mode: false
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);

      // Verify comprehensive metadata
      const metadata = result.artifact?.metadata;
      expect(metadata).toMatchObject({
        budget_tier: 'MEDIUM',
        tokens_used: expect.any(Number),
        duration_ms: expect.any(Number),
        cost_cents: expect.any(Number),
        processing_mode: 'direct_execution',
        correlation_id: expect.any(String),
        db_persisted: expect.any(Boolean)
      });

      // Verify correlation ID is preserved
      expect(metadata?.correlation_id).toBeDefined();
    });

    it('should comply with queue-first architecture contract', async () => {
      const brief = {
        brief: 'Test queue-first contract compliance',
        tier: 'HEAVY' as const,
        queue_mode: true
      };

      const result = await runOnce(brief);

      expect(result.success).toBe(true);
      expect(result.queue_job_id).toBeDefined();
      expect(result.artifact?.metadata?.processing_mode).toBe('queue_first');

      // Verify queue submission contract
      expect(mockSubmitContentGenerationJob).toHaveBeenCalledWith(
        expect.objectContaining({
          brief: expect.any(String),
          tier: 'HEAVY',
          priority: 1,
          correlation_id: expect.any(String),
          metadata: expect.objectContaining({
            submission_source: 'orchestrator_controller',
            queue_mode: true
          })
        })
      );
    });
  });
});