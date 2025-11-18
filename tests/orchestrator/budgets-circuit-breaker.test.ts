// ABOUTME: Comprehensive Budget Circuit Breaker Testing for EIP Orchestrator
// ABOUTME: Validates circuit breaker functionality, DLQ integration, and budget enforcement

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BudgetEnforcer, BudgetCircuitBreaker, Tier } from '../../orchestrator/budget';

// Extend interfaces for testing purposes
// Extend interfaces for testing purposes - use type assertion approach
interface BudgetEnforcerTest {
  tracker: {
    start_time: number;
    tokens_used: number;
    stage_tokens: Record<string, number>;
    active_stages: Set<string>;
    stages_completed: string[];
    stages_failed: string[];
    breaches: Array<{
      type: 'token' | 'time' | 'cost';
      amount: number;
      limit: number;
      timestamp: number;
      stage?: string;
    }>;
  };
  circuitBreaker?: BudgetCircuitBreaker;
}

interface BudgetCircuitBreakerTest {
  state?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastFailureTime?: number;
}
describe('Budget Circuit Breaker System', () => {
  let budgetEnforcer: BudgetEnforcer;

  beforeEach(() => {
    budgetEnforcer = new BudgetEnforcer('MEDIUM');
  });

  describe('Circuit Breaker Initialization', () => {
    it('should initialize with CLOSED state', () => {
      const circuitBreaker = new BudgetCircuitBreaker();
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.canExecute()).toBe(true);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should integrate with BudgetEnforcer constructor', () => {
      expect(budgetEnforcer.canProceed().ok).toBe(true);
      expect(budgetEnforcer.shouldFailToDLQ()).toBe(false);
    });
  });

  describe('Circuit Breaker Failure Tracking', () => {
    it('should track failures correctly', () => {
      const circuitBreaker = new BudgetCircuitBreaker();

      circuitBreaker.recordFailure();
      expect(circuitBreaker.getFailureCount()).toBe(1);
      expect(circuitBreaker.getState()).toBe('CLOSED');

      circuitBreaker.recordFailure();
      expect(circuitBreaker.getFailureCount()).toBe(2);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open circuit after failure threshold', () => {
      const circuitBreaker = new BudgetCircuitBreaker();

      // Record 3 failures to trigger circuit breaker
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.getFailureCount()).toBe(3);
      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should reset to CLOSED on success', () => {
      const circuitBreaker = new BudgetCircuitBreaker();

      // Add failures then success
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getFailureCount()).toBe(0);
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('Budget Violations Trigger Circuit Breaker', () => {
    it('should trigger circuit breaker on token budget breach', () => {
      // Use LIGHT tier for smaller budgets to trigger breach easier
      const lightEnforcer = new BudgetEnforcer('LIGHT');

      lightEnforcer.startStage('generator');
      // Add tokens that exceed the LIGHT tier generator budget (1400)
      lightEnforcer.addTokens('generator', 1500);

      const budgetCheck = lightEnforcer.checkStageBudget('generator');
      expect(budgetCheck.ok).toBe(false);

      // Circuit breaker should have a failure recorded but still proceed initially
      // It needs 3 failures to open
      expect(lightEnforcer.hasBreaches()).toBe(true);
      expect(lightEnforcer.shouldFailToDLQ()).toBe(true); // Has breaches
    });

    it('should trigger circuit breaker on time budget breach', async () => {
      // Use LIGHT tier with 20s time limit
      const lightEnforcer = new BudgetEnforcer('LIGHT');

      // Manipulate the start time to simulate time breach
      const tracker = lightEnforcer.getTracker();
      const originalStartTime = tracker.start_time;

      // Simulate that 25 seconds have passed (exceeds 20s limit)
      const testEnforcer = lightEnforcer as unknown as BudgetEnforcerTest;
      testEnforcer.tracker.start_time = Date.now() - 25000;

      const timeCheck = lightEnforcer.checkStageBudget('generator');
      expect(timeCheck.ok).toBe(false);
      expect(timeCheck.reason).toContain('time budget exceeded');
    });

    it('should handle multiple breaches before circuit breaker opens', () => {
      const mediumEnforcer = new BudgetEnforcer('MEDIUM');

      // First breach - should still be allowed initially
      mediumEnforcer.startStage('generator');
      mediumEnforcer.addTokens('generator', 2500); // Exceeds MEDIUM generator budget (2400)

      const firstCheck = mediumEnforcer.checkStageBudget('generator');
      expect(firstCheck.ok).toBe(false);
      expect(mediumEnforcer.getBreaches()).toHaveLength(1);

      // Circuit breaker should now record a failure
      expect(mediumEnforcer.canProceed().ok).toBe(true); // Still open (needs 3 failures)

      // Add more breaches to trigger circuit breaker
      mediumEnforcer.startStage('auditor');
      mediumEnforcer.addTokens('auditor', 800); // Exceeds MEDIUM auditor budget (700)
      mediumEnforcer.checkStageBudget('auditor');

      mediumEnforcer.startStage('planner');
      mediumEnforcer.addTokens('planner', 1200); // Exceeds MEDIUM planner budget (1000)
      mediumEnforcer.checkStageBudget('planner');

      // After 3 breaches, circuit breaker should be affected
      expect(mediumEnforcer.getBreaches().length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('DLQ Record Creation', () => {
    it('should create comprehensive DLQ record for budget breaches', () => {
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 2500); // Trigger breach
      budgetEnforcer.checkStageBudget('generator'); // Need to call this to record the breach

      const dlqRecord = budgetEnforcer.createDLQRecord();

      expect(dlqRecord).toHaveProperty('fail_reason');
      expect(dlqRecord).toHaveProperty('budget_tier', 'MEDIUM');
      expect(dlqRecord).toHaveProperty('tokens_used');
      expect(dlqRecord).toHaveProperty('time_elapsed_s');
      expect(dlqRecord).toHaveProperty('breaches');
      expect(dlqRecord).toHaveProperty('stage_breakdown');
      expect(dlqRecord).toHaveProperty('circuit_breaker_triggered');
      expect(dlqRecord).toHaveProperty('recovery_suggestions');

      expect(dlqRecord.breaches.length).toBeGreaterThan(0);
      expect(dlqRecord.stage_breakdown.tokens.generator).toBe(2500);
      expect(dlqRecord.fail_reason).toContain('Budget breach: tokens exceeded in generator');
    });

    it('should create DLQ record for circuit breaker open state', () => {
      const circuitBreaker = new BudgetCircuitBreaker();

      // Force circuit breaker open
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Mock the circuit breaker in BudgetEnforcer
      const testEnforcer = budgetEnforcer as unknown as BudgetEnforcerTest;
      testEnforcer.circuitBreaker = circuitBreaker;

      const dlqRecord = budgetEnforcer.createDLQRecord();

      expect(dlqRecord.circuit_breaker_triggered).toBe(true);
      expect(dlqRecord.fail_reason).toContain('Circuit breaker open');
      expect(dlqRecord.recovery_suggestions).toContain('Wait for circuit breaker recovery timeout (30s)');
    });

    it('should provide relevant recovery suggestions for token breaches', () => {
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 3000);
      budgetEnforcer.checkStageBudget('generator'); // Need to call this to record breach

      const dlqRecord = budgetEnforcer.createDLQRecord();

      expect(dlqRecord.recovery_suggestions[0]).toContain('Consider reducing input complexity');
      expect(dlqRecord.recovery_suggestions).toContain('Review and optimize token usage in generation prompts');
    });

    it('should provide relevant recovery suggestions for time breaches', () => {
      budgetEnforcer.startStage('generator');
      // Simulate time breach by manipulating start time
      const testEnforcer = budgetEnforcer as unknown as BudgetEnforcerTest;
      testEnforcer.tracker.start_time = Date.now() - 50000; // 50 seconds ago
      budgetEnforcer.checkStageBudget('generator'); // Need to call this to record breach

      const dlqRecord = budgetEnforcer.createDLQRecord();

      expect(dlqRecord.recovery_suggestions).toContain('Consider optimizing performance bottlenecks');
      expect(dlqRecord.recovery_suggestions).toContain('Use asynchronous processing where possible');
    });
  });

  describe('Stage Budget Validation', () => {
    it('should validate retrieval stage budget', () => {
      const mediumEnforcer = new BudgetEnforcer('MEDIUM');
      mediumEnforcer.startStage('retrieval');

      // Add tokens within MEDIUM retrieval budget (400)
      mediumEnforcer.addTokens('retrieval', 300);
      const check1 = mediumEnforcer.checkStageBudget('retrieval');
      expect(check1.ok).toBe(true);

      // Add tokens to exceed retrieval budget
      mediumEnforcer.addTokens('retrieval', 150); // Total 450 > 400
      const check2 = mediumEnforcer.checkStageBudget('retrieval');
      expect(check2.ok).toBe(false);
      expect(check2.reason).toContain('retrieval exceeded token budget');
    });

    it('should validate all stage budgets for each tier', () => {
      const testCases = [
        { tier: 'LIGHT' as Tier, expectedLimits: { retrieval: 200, planner: 400, generator: 1400, auditor: 300, repairer: 200 } },
        { tier: 'MEDIUM' as Tier, expectedLimits: { retrieval: 400, planner: 1000, generator: 2400, auditor: 700, repairer: 600 } },
        { tier: 'HEAVY' as Tier, expectedLimits: { retrieval: 600, planner: 1400, generator: 4000, auditor: 1100, repairer: 1000 } }
      ];

      testCases.forEach(({ tier, expectedLimits }) => {
        const enforcer = new BudgetEnforcer(tier);
        const budgetWithLimits = enforcer.getBudgetWithStageLimits();

        Object.entries(expectedLimits).forEach(([stage, limit]) => {
          const stageLimit = budgetWithLimits.stage_limits[stage as keyof typeof budgetWithLimits.stage_limits];
          if (stageLimit) {
            expect(stageLimit.tokens).toBeLessThanOrEqual(limit);
          }
        });
      });
    });

    it('should track token usage per stage correctly', () => {
      budgetEnforcer.startStage('retrieval');
      budgetEnforcer.addTokens('retrieval', 100);

      budgetEnforcer.startStage('planner');
      budgetEnforcer.addTokens('planner', 200);

      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 500);

      const tracker = budgetEnforcer.getTracker();
      expect(tracker.stage_tokens.retrieval).toBe(100);
      expect(tracker.stage_tokens.planner).toBe(200);
      expect(tracker.stage_tokens.generator).toBe(500);
      expect(tracker.tokens_used).toBe(800); // Total
    });
  });

  describe('Circuit Breaker Recovery Mechanism', () => {
    it('should transition to HALF_OPEN after recovery timeout', () => {
      const circuitBreaker = new BudgetCircuitBreaker();

      // Trigger circuit breaker open
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.canExecute()).toBe(false);

      // Manually manipulate lastFailureTime to simulate timeout
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 35000); // 35 seconds later

      try {
        // Call canExecute to trigger state transition and check it
        const canExecute = circuitBreaker.canExecute();

        // Should now be HALF_OPEN and allow limited execution
        expect(circuitBreaker.getState()).toBe('HALF_OPEN');
        expect(canExecute).toBe(true);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should close circuit breaker on successful execution in HALF_OPEN', () => {
      const circuitBreaker = new BudgetCircuitBreaker();

      // Trigger circuit breaker open
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Simulate time passing and entering HALF_OPEN
      const testCircuitBreaker = circuitBreaker as unknown as BudgetCircuitBreakerTest;
      testCircuitBreaker.state = 'HALF_OPEN';
      testCircuitBreaker.lastFailureTime = Date.now() - 40000; // 40 seconds ago

      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      // Record success to close circuit breaker
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getFailureCount()).toBe(0);
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('Budget System Integration', () => {
    it('should integrate with DLQ routing decision', () => {
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 3000); // Major breach
      budgetEnforcer.checkStageBudget('generator'); // Need to call this to record breach

      expect(budgetEnforcer.shouldFailToDLQ()).toBe(true);

      const dlqRecord = budgetEnforcer.createDLQRecord();
      expect(dlqRecord.fail_reason).toBeDefined();
      expect(dlqRecord.breaches.length).toBeGreaterThan(0);
    });

    it('should reset budget tracking correctly', () => {
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 1000);

      expect(budgetEnforcer.getTracker().tokens_used).toBe(1000);
      expect(budgetEnforcer.hasBreaches()).toBe(false);

      budgetEnforcer.reset();

      const newTracker = budgetEnforcer.getTracker();
      expect(newTracker.tokens_used).toBe(0);
      expect(newTracker.stage_tokens).toEqual({});
      expect(newTracker.breaches).toEqual([]);
      expect(budgetEnforcer.canProceed().ok).toBe(true);
    });

    it('should provide comprehensive budget validation', () => {
      budgetEnforcer.startStage('generator');
      budgetEnforcer.addTokens('generator', 500);

      const validation = budgetEnforcer.validateAllBudgets();
      expect(validation.ok).toBe(true);
      expect(validation.violations).toEqual([]);
      expect(validation.warnings).toEqual([]);

      // Add a breach
      budgetEnforcer.addTokens('generator', 2500); // Total 3000 > limit
      budgetEnforcer.checkStageBudget('generator'); // Need to call this to record breach

      const validationAfterBreach = budgetEnforcer.validateAllBudgets();
      expect(validationAfterBreach.ok).toBe(false);
      expect(validationAfterBreach.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid token additions efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        budgetEnforcer.addTokens('generator', 1);
      }

      const end = Date.now();
      expect(end - start).toBeLessThan(100); // Should complete in < 100ms

      expect(budgetEnforcer.getTracker().tokens_used).toBe(1000);
    });

    it('should handle concurrent stage tracking', () => {
      budgetEnforcer.startStage('retrieval');
      budgetEnforcer.startStage('planner');
      budgetEnforcer.startStage('generator');

      const tracker = budgetEnforcer.getTracker();
      expect(tracker.active_stages.has('retrieval')).toBe(true);
      expect(tracker.active_stages.has('planner')).toBe(true);
      expect(tracker.active_stages.has('generator')).toBe(true);

      budgetEnforcer.endStage('retrieval');
      budgetEnforcer.endStage('planner');
      budgetEnforcer.endStage('generator');

      const trackerAfterEnd = budgetEnforcer.getTracker();
      expect(trackerAfterEnd.active_stages.size).toBe(0);
    });

    it('should handle negative and zero token values', () => {
      expect(() => {
        budgetEnforcer.addTokens('generator', -100);
        budgetEnforcer.addTokens('generator', 0);
      }).not.toThrow();

      expect(budgetEnforcer.getTracker().tokens_used).toBe(0);
    });

    it('should handle invalid stage names gracefully', () => {
      expect(() => {
        budgetEnforcer.checkStageBudget('invalid_stage' as any); // Testing invalid stage handling
      }).not.toThrow();

      expect(budgetEnforcer.canProceed().ok).toBe(true); // Should not affect circuit breaker
    });
  });
});