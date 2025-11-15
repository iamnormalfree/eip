// ABOUTME: Budget enforcement utilities for EIP orchestrator
// ABOUTME: Provides real-time token/time tracking with circuit breaker pattern - now YAML-driven

import { loadBudgetsFromYAML } from './yaml-budget-loader';

export type Tier = 'LIGHT' | 'MEDIUM' | 'HEAVY';
export type Stage = 'retrieval' | 'planner' | 'generator' | 'auditor' | 'repairer' | 'review';

export interface Budget {
  tokens: number;
  wallclock_s: number;
  planner?: number;
  generator?: number;
  auditor?: number;
  repairer?: number;
  retrieval?: number;
  review?: number;
}

export interface BudgetTracker {
  start_time: number;
  tokens_used: number;
  stage_tokens: Record<string, number>;
  stage_times: Record<string, number>;
  active_stages: Set<string>;
  breaches: Array<{
    stage: string;
    type: 'tokens' | 'time';
    limit: number;
    actual: number;
    timestamp: number;
    severity?: 'warning' | 'critical';
  }>;
}

// Load budgets from YAML configuration
const BUDGETS = loadBudgetsFromYAML();

// Circuit breaker implementation
export class BudgetCircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold: number = 3;
  private readonly recoveryTimeoutMs: number = 30000; // 30 seconds

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  canExecute(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }
    
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    
    // HALF_OPEN state - allow limited execution
    return true;
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

export class BudgetEnforcer {
  private tracker: BudgetTracker;
  private budget: Budget;
  private tier: Tier;
  private circuitBreaker: BudgetCircuitBreaker;

  constructor(tier: Tier = 'MEDIUM', jobId?: string) {
    this.tier = tier;
    this.budget = this.loadBudget(tier);
    this.circuitBreaker = new BudgetCircuitBreaker();
    this.tracker = {
      start_time: Date.now(),
      tokens_used: 0,
      stage_tokens: {},
      stage_times: {},
      active_stages: new Set<string>(),
      breaches: []
    };
  }

  private loadBudget(tier: Tier): Budget {
    const budgetData = BUDGETS[tier];
    if (!budgetData) {
      throw new Error('Unknown budget tier: ' + tier);
    }
    
    // Type-safe access with defaults
    const stageBudgets = budgetData as any;
    return {
      tokens: Math.max(
        stageBudgets.generator || 0, 
        stageBudgets.planner || 0, 
        stageBudgets.retrieval || 0,
        stageBudgets.auditor || 0,
        stageBudgets.repairer || 0
      ),
      wallclock_s: stageBudgets.wallclock_s || 45,
      planner: stageBudgets.planner,
      generator: stageBudgets.generator,
      auditor: stageBudgets.auditor,
      repairer: stageBudgets.repairer,
      retrieval: stageBudgets.retrieval,
      review: stageBudgets.review
    };
  }

  // Circuit breaker check before stage execution
  canProceed(): { ok: boolean; reason?: string } {
    if (!this.circuitBreaker.canExecute()) {
      return {
        ok: false,
        reason: 'Circuit breaker is ' + this.circuitBreaker.getState() + '. Too many budget violations.'
      };
    }
    
    return { ok: true };
  }

  startStage(stage: Stage): void {
    const canProceed = this.canProceed();
    if (!canProceed.ok) {
      throw new Error('Cannot start stage ' + stage + ': ' + canProceed.reason);
    }

    this.tracker.active_stages.add(stage);
    this.tracker.stage_times[stage] = Date.now();
    this.tracker.stage_tokens[stage] = 0;
  }

  addTokens(stage: string, tokens: number): void {
    // Prevent negative tokens
    const actualTokens = Math.max(0, tokens);
    this.tracker.tokens_used += actualTokens;
    this.tracker.stage_tokens[stage] = (this.tracker.stage_tokens[stage] || 0) + actualTokens;
  }

  checkStageBudget(stage: Stage): { ok: boolean; reason?: string } {
    const stageTokens = this.tracker.stage_tokens[stage] || 0;
    const stageLimit = (this.budget as any)[stage];
    
    if (stageLimit && stageTokens > stageLimit) {
      const breach = {
        stage,
        type: 'tokens' as const,
        limit: stageLimit,
        actual: stageTokens,
        timestamp: Date.now(),
        severity: 'critical' as const
      };
      this.tracker.breaches.push(breach);
      this.circuitBreaker.recordFailure();
      
      return {
        ok: false,
        reason: 'Stage ' + stage + ' exceeded token budget: ' + stageTokens + ' > ' + stageLimit
      };
    }

    // Check overall time budget
    const elapsed = (Date.now() - this.tracker.start_time) / 1000;
    if (elapsed > this.budget.wallclock_s) {
      const breach = {
        stage,
        type: 'time' as const,
        limit: this.budget.wallclock_s,
        actual: elapsed,
        timestamp: Date.now(),
        severity: 'critical' as const
      };
      this.tracker.breaches.push(breach);
      this.circuitBreaker.recordFailure();
      
      return {
        ok: false,
        reason: 'Overall time budget exceeded: ' + elapsed.toFixed(1) + 's > ' + this.budget.wallclock_s + 's'
      };
    }

    return { ok: true };
  }

  endStage(stage: string): number {
    const startTime = this.tracker.stage_times[stage];
    if (startTime) {
      const duration = Date.now() - startTime;
      this.tracker.stage_times[stage] = duration;
      this.tracker.active_stages.delete(stage);
      
      // Record success if no breaches occurred
      const stageBreaches = this.tracker.breaches.filter(b => b.stage === stage && b.severity === 'critical');
      if (stageBreaches.length === 0) {
        this.circuitBreaker.recordSuccess();
      }
      
      return duration;
    }
    return 0;
  }

  checkTimeBudget(): { ok: boolean; reason?: string } {
    const elapsed = (Date.now() - this.tracker.start_time) / 1000;
    if (elapsed > this.budget.wallclock_s) {
      return {
        ok: false,
        reason: 'Time budget exceeded: ' + elapsed.toFixed(1) + 's > ' + this.budget.wallclock_s + 's'
      };
    }
    return { ok: true };
  }

  getTracker(): BudgetTracker {
    return { ...this.tracker, active_stages: new Set(this.tracker.active_stages) };
  }

  getBudget(): Budget {
    return { ...this.budget };
  }

  // For test compatibility - return budget in expected format
  getBudgetWithStageLimits() {
    return {
      tokens: this.budget.tokens,
      wallclock_s: this.budget.wallclock_s,
      stage_limits: {
        retrieval: { tokens: this.budget.retrieval || 400 },
        planner: { tokens: this.budget.planner || 1000 },
        generator: { tokens: this.budget.generator || 2400 },
        auditor: { tokens: this.budget.auditor || 700 },
        repairer: { tokens: this.budget.repairer || 600 },
        review: { tokens: this.budget.review || 200 }
      }
    };
  }

  getTier(): Tier {
    return this.tier;
  }

  hasBreaches(): boolean {
    return this.tracker.breaches.length > 0;
  }

  getBreaches(): BudgetTracker['breaches'] {
    return [...this.tracker.breaches];
  }

  validateAllBudgets(): { ok: boolean; violations: any[]; warnings: any[] } {
    const violations: any[] = [];
    const warnings: any[] = [];

    for (const breach of this.tracker.breaches) {
      if (breach.severity === 'critical') {
        violations.push(breach);
      } else {
        warnings.push(breach);
      }
    }

    return {
      ok: violations.length === 0,
      violations,
      warnings
    };
  }

  reset(): void {
    this.tracker = {
      start_time: Date.now(),
      tokens_used: 0,
      stage_tokens: {},
      stage_times: {},
      active_stages: new Set<string>(),
      breaches: []
    };
    this.circuitBreaker = new BudgetCircuitBreaker();
  }

  // Circuit breaker: fail to DLQ if ANY breach occurs
  shouldFailToDLQ(): boolean {
    return this.hasBreaches() || !this.canProceed().ok;
  }

  createDLQRecord(): any {
    const breaches = this.getBreaches();
    const primaryBreach = breaches[0];

    const recoverySuggestions: string[] = [];

    // Generate recovery suggestions based on breach types
    if (breaches.some(b => b.type === 'tokens')) {
      recoverySuggestions.push('Consider reducing input complexity or using higher tier budget');
      recoverySuggestions.push('Review and optimize token usage in generation prompts');
    }

    if (breaches.some(b => b.type === 'time')) {
      recoverySuggestions.push('Consider optimizing performance bottlenecks');
      recoverySuggestions.push('Use asynchronous processing where possible');
    }

    if (this.circuitBreaker.getState() === 'OPEN') {
      recoverySuggestions.push('Wait for circuit breaker recovery timeout (30s)');
      recoverySuggestions.push('Check for systemic issues causing repeated failures');
    }

    return {
      fail_reason: primaryBreach ?
        'Budget breach: ' + primaryBreach.type + ' exceeded in ' + primaryBreach.stage :
        'Circuit breaker open - too many budget violations',
      budget_tier: this.tier,
      tokens_used: this.tracker.tokens_used,
      time_elapsed_s: (Date.now() - this.tracker.start_time) / 1000,
      breaches: breaches,
      stage_breakdown: {
        tokens: { ...this.tracker.stage_tokens },
        times_ms: { ...this.tracker.stage_times }
      },
      circuit_breaker_triggered: this.circuitBreaker.getState() !== 'CLOSED',
      recovery_suggestions: recoverySuggestions
    };
  }
}
