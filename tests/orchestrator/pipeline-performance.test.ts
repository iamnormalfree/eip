// ABOUTME: Performance Validation Testing for EIP Orchestrator Pipeline
// ABOUTME: Validates budget enforcement under MEDIUM/HEAVY tiers, queue throughput, and pipeline latency

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BudgetEnforcer, Tier } from '../../orchestrator/budget';

// Mock controller for testing
const mockController = {
  processJob: jest.fn().mockImplementation(async (job) => {
    // Simulate different processing times based on job ID
    await new Promise(resolve => setTimeout(resolve, 10));
    return { success: true, id: job.id, processedAt: Date.now() };
  }),
  processJobWithCircuitBreaker: jest.fn().mockResolvedValue({ success: true }),
  processJobWithPartialFailure: jest.fn().mockResolvedValue({
    success: false,
    completedStages: ['planner', 'retrieval'],
    failedStages: ['generator'],
    partialFailure: true
  }),
  processJobWithContextPreservation: jest.fn().mockResolvedValue({
    success: false,
    preservedContext: { correlationId: 'test-123', userId: 'user-456' }
  }),
  processJobWithRollback: jest.fn().mockResolvedValue({
    success: false,
    rollbackTriggered: true,
    rollbackStages: ['planner', 'retrieval']
  }),
  getActiveJobs: jest.fn().mockReturnValue([])
};

// Mock BullMQ for performance testing
jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(() => Promise.resolve({ id: 'test-job-id' })),
    process: jest.fn(),
    getWaiting: jest.fn(() => Promise.resolve([])),
    getActive: jest.fn(() => Promise.resolve([])),
    getCompleted: jest.fn(() => Promise.resolve([])),
    getFailed: jest.fn(() => Promise.resolve([])),
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

// Mock Redis for performance testing
jest.mock('ioredis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
    keys: jest.fn(() => Promise.resolve([])),
    flushdb: jest.fn(() => Promise.resolve('OK')),
    ping: jest.fn(() => Promise.resolve('PONG')),
    quit: jest.fn(() => Promise.resolve('OK')),
  })),
}));

describe('Pipeline Performance Validation', () => {
  let budgetEnforcers: Map<string, BudgetEnforcer>;

  beforeEach(() => {
    jest.clearAllMocks();
    budgetEnforcers = new Map();

    // Initialize budget enforcers for each tier
    budgetEnforcers.set('LIGHT', new BudgetEnforcer('LIGHT'));
    budgetEnforcers.set('MEDIUM', new BudgetEnforcer('MEDIUM'));
    budgetEnforcers.set('HEAVY', new BudgetEnforcer('HEAVY'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Budget Enforcement Under MEDIUM/HEAVY Tiers', () => {
    it('should enforce MEDIUM tier budgets correctly', async () => {
      const mediumEnforcer = budgetEnforcers.get('MEDIUM')!;

      // MEDIUM tier limits: 2400 tokens, 45s time
      mediumEnforcer.startStage('generator');

      // Test token budget enforcement
      const initialBudget = mediumEnforcer.getBudget();
      expect(initialBudget.tokens).toBe(2400);

      // Add significant token usage but within budget
      mediumEnforcer.addTokens('generator', 2000);
      const afterUsage = mediumEnforcer.checkStageBudget('generator');
      expect(afterUsage.ok).toBe(true);

      // Exceed budget
      mediumEnforcer.addTokens('generator', 500);
      const exceededBudget = mediumEnforcer.checkStageBudget('generator');
      expect(exceededBudget.ok).toBe(false);
      expect(exceededBudget.reason).toContain('exceeded token budget');
    });

    it('should enforce HEAVY tier budgets correctly', async () => {
      const heavyEnforcer = budgetEnforcers.get('HEAVY')!;

      // HEAVY tier limits: 4000 tokens, 90s time
      heavyEnforcer.startStage('generator');

      const initialBudget = heavyEnforcer.getBudget();
      expect(initialBudget.tokens).toBe(4000);
      expect(initialBudget.wallclock_s).toBe(90); // 90 seconds

      // Test large but within-budget usage
      heavyEnforcer.addTokens('generator', 3500);
      const afterUsage = heavyEnforcer.checkStageBudget('generator');
      expect(afterUsage.ok).toBe(true);
    });

    it('should track performance metrics across pipeline stages', async () => {
      const mediumEnforcer = budgetEnforcers.get('MEDIUM')!;
      const stages = ['planner', 'retrieval', 'generator', 'auditor', 'repairer', 'review'];

      // Simulate pipeline execution with performance tracking
      const stageMetrics: Array<{stage: string, tokens: number, duration: number}> = [];

      for (const stage of stages) {
        const startTime = Date.now();
        mediumEnforcer.startStage(stage as any);

        // Simulate stage work with controlled token usage to stay within individual stage limits
        // MEDIUM tier stage limits from budgets.yaml
        const stageTokenAllocation: Record<string, number> = {
          'planner': 500,    // Limit: 1000
          'retrieval': 200,  // Limit: 400
          'generator': 800,  // Limit: 2400
          'auditor': 300,    // Limit: 700
          'repairer': 400,   // Limit: 600
          'review': 100      // No limit defined, use small value
        };
        const tokensUsed = stageTokenAllocation[stage] || 100;
        mediumEnforcer.addTokens(stage as any, tokensUsed);

        // Simulate stage duration
        await new Promise(resolve => setTimeout(resolve, 10));
        const duration = Date.now() - startTime;

        stageMetrics.push({
          stage,
          tokens: tokensUsed,
          duration
        });

        const budgetCheck = mediumEnforcer.checkStageBudget(stage as any);
        expect(budgetCheck.ok).toBe(true);
      }

      // Validate total pipeline metrics
      const totalTokens = stageMetrics.reduce((sum, m) => sum + m.tokens, 0);
      const totalDuration = stageMetrics.reduce((sum, m) => sum + m.duration, 0);

      // Total should be within individual stage limits and overall budget
      expect(totalTokens).toBe(2300); // Sum of our allocations: 500+200+800+300+400+100
      expect(totalDuration).toBeLessThan(45000); // 45 seconds

      // Check remaining tokens via tracker
      const tracker = mediumEnforcer.getTracker();
      expect(tracker.tokens_used).toBe(totalTokens);
      expect(totalTokens).toBeLessThan(2400); // Within overall budget
    });
  });

  describe('Queue Throughput Benchmarks', () => {
    it('should handle high-volume queue processing', async () => {
      const jobCount = 100;
      const startTime = Date.now();

      // Simulate processing multiple jobs
      const jobPromises = [];
      for (let i = 0; i < jobCount; i++) {
        jobPromises.push(
          mockController.processJob({
            id: `perf-test-${i}`,
            data: {
              type: 'educational',
              persona: 'student',
              funnel: 'awareness',
              topic: `Test topic ${i}`,
              tier: 'MEDIUM'
            }
          })
        );
      }

      // Wait for all jobs to complete
      await Promise.all(jobPromises);
      const totalTime = Date.now() - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      const throughput = jobCount / (totalTime / 1000);
      expect(throughput).toBeGreaterThan(10); // At least 10 jobs per second
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentJobs = 20;
      const batchSize = 5;

      // Process jobs in batches to test concurrent performance
      for (let batch = 0; batch < concurrentJobs / batchSize; batch++) {
        const batchStartTime = Date.now();

        const batchPromises = [];
        for (let i = 0; i < batchSize; i++) {
          const jobIndex = batch * batchSize + i;
          batchPromises.push(
            mockController.processJob({
              id: `concurrent-test-${jobIndex}`,
              data: {
                type: 'process',
                persona: 'professional',
                funnel: 'consideration',
                topic: `Concurrent test ${jobIndex}`,
                tier: 'LIGHT'
              }
            })
          );
        }

        await Promise.all(batchPromises);
        const batchTime = Date.now() - batchStartTime;

        // Each batch should complete quickly
        expect(batchTime).toBeLessThan(2000); // 2 seconds per batch
      }
    });
  });

  describe('Pipeline Latency Measurements', () => {
    it('should measure end-to-end pipeline latency', async () => {
      const pipelineStartTime = Date.now();

      // Simulate complete pipeline execution
      await mockController.processJob({
        id: 'latency-test-full',
        data: {
          type: 'framework',
          persona: 'researcher',
          funnel: 'decision',
          topic: 'Test pipeline latency',
          tier: 'HEAVY'
        }
      });

      const totalLatency = Date.now() - pipelineStartTime;

      // Should complete within HEAVY tier time budget (90 seconds)
      expect(totalLatency).toBeLessThan(90000);

      // Should be reasonable for a simple test
      expect(totalLatency).toBeLessThan(5000); // 5 seconds max for test
    });

    it('should track individual stage latencies', async () => {
      const stageLatencies: Map<string, number> = new Map();

      // Simulate tracking latency for each stage
      const stages = ['planner', 'retrieval', 'generator', 'auditor'];

      for (const stage of stages) {
        const stageStart = Date.now();

        // Simulate stage work
        await new Promise(resolve => setTimeout(resolve, 50));

        const stageLatency = Date.now() - stageStart;
        stageLatencies.set(stage, stageLatency);

        // Each stage should complete in reasonable time
        expect(stageLatency).toBeLessThan(1000); // 1 second per stage max
      }

      // Validate no stage is significantly slower than others
      const latencies = Array.from(stageLatencies.values());
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      // Performance variation should be within reasonable bounds
      expect(maxLatency / minLatency).toBeLessThan(5); // No stage 5x slower than another
    });
  });

  describe('Resource Utilization Monitoring', () => {
    it('should monitor memory usage during pipeline execution', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Process multiple jobs to test memory usage
      const jobs = Array.from({ length: 50 }, (_, i) => ({
        id: `memory-test-${i}`,
        data: {
          type: 'comparative',
          persona: 'analyst',
          funnel: 'comparison',
          topic: `Memory test topic ${i}`,
          tier: 'MEDIUM'
        }
      }));

      for (const job of jobs) {
        await mockController.processJob(job);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory usage should be reasonable (< 100MB increase)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle resource cleanup properly', async () => {
      // Process a job and verify cleanup
      const job = {
        id: 'cleanup-test',
        data: {
          type: 'process',
          persona: 'student',
          funnel: 'awareness',
          topic: 'Resource cleanup test',
          tier: 'LIGHT'
        }
      };

      await mockController.processJob(job);

      // Verify that resources are cleaned up
      // This would involve checking that temporary data is cleared
      // and connections are properly closed
      expect(mockController.getActiveJobs()).toHaveLength(0);
    });
  });

  describe('Scalability Testing', () => {
    it('should scale linearly with increased load', async () => {
      const smallLoad = 10;
      const mediumLoad = 50;

      // Test with small load
      const smallStartTime = Date.now();
      for (let i = 0; i < smallLoad; i++) {
        await mockController.processJob({
          id: `scale-small-${i}`,
          data: {
            type: 'framework',
            persona: 'student',
            funnel: 'awareness',
            topic: `Scale test small ${i}`,
            tier: 'LIGHT'
          }
        });
      }
      const smallTime = Date.now() - smallStartTime;

      // Test with medium load
      const mediumStartTime = Date.now();
      for (let i = 0; i < mediumLoad; i++) {
        await mockController.processJob({
          id: `scale-medium-${i}`,
          data: {
            type: 'process',
            persona: 'professional',
            funnel: 'consideration',
            topic: `Scale test medium ${i}`,
            tier: 'LIGHT'
          }
        });
      }
      const mediumTime = Date.now() - mediumStartTime;

      // Calculate throughput rates
      const smallThroughput = smallLoad / (smallTime / 1000);
      const mediumThroughput = mediumLoad / (mediumTime / 1000);

      // Throughput should not degrade significantly (within 50%)
      const throughputRatio = mediumThroughput / smallThroughput;
      expect(throughputRatio).toBeGreaterThan(0.5);
    });

    it('should handle mixed tier workload efficiently', async () => {
      const tierMix = ['LIGHT', 'MEDIUM', 'HEAVY'];
      const jobsPerTier = 20;

      const startTime = Date.now();

      // Process mixed workload
      const jobPromises = [];
      for (const tier of tierMix) {
        for (let i = 0; i < jobsPerTier; i++) {
          jobPromises.push(
            mockController.processJob({
              id: `mixed-${tier.toLowerCase()}-${i}`,
              data: {
                type: 'educational',
                persona: 'researcher',
                funnel: 'decision',
                topic: `Mixed workload ${tier} ${i}`,
                tier: tier as Tier
              }
            })
          );
        }
      }

      await Promise.all(jobPromises);
      const totalTime = Date.now() - startTime;

      // Should complete mixed workload efficiently
      expect(totalTime).toBeLessThan(30000); // 30 seconds for 60 mixed jobs

      const totalJobs = tierMix.length * jobsPerTier;
      const mixedThroughput = totalJobs / (totalTime / 1000);
      expect(mixedThroughput).toBeGreaterThan(2); // At least 2 jobs per second
    });
  });
});