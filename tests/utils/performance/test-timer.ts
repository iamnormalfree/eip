// ABOUTME: Adaptive TestTimer with environment detection for consistent timing measurements
// ABOUTME: Provides performance.now() replacement with adaptive thresholds and context

import { EnvironmentDetector, EnvironmentInfo } from './environment-detector';
import { AdaptiveThresholdCalculator, BudgetLevel, ComponentType, ThresholdResult } from './threshold-calculator';

/**
 * Timer measurement result with environment context
 */
export interface TimerResult {
  startTime: number;
  endTime: number;
  duration: number;
  precision: number;
  environment: EnvironmentInfo;
  timedFunction?: string;
}

/**
 * Performance validation result
 */
export interface PerformanceValidation {
  measurement: TimerResult;
  threshold: ThresholdResult;
  exceedsThreshold: boolean;
  ratio: number;
  grade: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  recommendations: string[];
}

/**
 * TestTimer provides environment-aware performance measurement and validation
 */
export class TestTimer {
  private environmentDetector: EnvironmentDetector;
  private thresholdCalculator: AdaptiveThresholdCalculator;
  private getNow: () => number;

  /**
   * Initialize TestTimer with environment detection
   */
  constructor(budgetsPath?: string) {
    this.environmentDetector = EnvironmentDetector.getInstance();
    this.thresholdCalculator = AdaptiveThresholdCalculator.getInstance(budgetsPath);
    this.getNow = this.environmentDetector.getPerformanceFunction();
  }

  /**
   * Start timing a function or operation
   */
  start(functionName?: string): TimerContext {
    const startTime = this.getNow();
    const environment = this.environmentDetector.getEnvironmentInfo();
    
    return new TimerContext(
      startTime,
      environment,
      this.getNow,
      functionName,
      this.thresholdCalculator
    );
  }

  /**
   * Measure execution time of an async function
   */
  async measureAsync<T>(
    fn: () => Promise<T>,
    functionName?: string,
    budgetLevel?: BudgetLevel,
    component?: ComponentType
  ): Promise<{ result: T; measurement: TimerResult; validation?: PerformanceValidation }> {
    const timer = this.start(functionName);
    
    try {
      const result = await fn();
      const measurement = timer.stop();
      
      let validation: PerformanceValidation | undefined;
      if (budgetLevel && component) {
        validation = this.validatePerformance(measurement, budgetLevel, component);
      }

      return { result, measurement, validation };
    } catch (error) {
      const measurement = timer.stop();
      throw error;
    }
  }

  /**
   * Measure execution time of a sync function
   */
  measure<T>(
    fn: () => T,
    functionName?: string,
    budgetLevel?: BudgetLevel,
    component?: ComponentType
  ): { result: T; measurement: TimerResult; validation?: PerformanceValidation } {
    const timer = this.start(functionName);
    
    try {
      const result = fn();
      const measurement = timer.stop();
      
      let validation: PerformanceValidation | undefined;
      if (budgetLevel && component) {
        validation = this.validatePerformance(measurement, budgetLevel, component);
      }

      return { result, measurement, validation };
    } catch (error) {
      const measurement = timer.stop();
      throw error;
    }
  }

  /**
   * Validate a measurement against adaptive thresholds
   */
  validatePerformance(
    measurement: TimerResult,
    budgetLevel: BudgetLevel,
    component: ComponentType
  ): PerformanceValidation {
    const thresholdCheck = this.thresholdCalculator.exceedsThreshold(
      measurement.duration,
      budgetLevel,
      component
    );
    
    const grade = this.thresholdCalculator.getPerformanceGrade(
      measurement.duration,
      budgetLevel,
      component
    );

    const recommendations = this.generateRecommendations(
      measurement,
      thresholdCheck.threshold,
      grade
    );

    return {
      measurement,
      threshold: thresholdCheck.threshold,
      exceedsThreshold: thresholdCheck.exceeds,
      ratio: thresholdCheck.ratio,
      grade,
      recommendations
    };
  }

  /**
   * Generate performance recommendations based on measurement
   */
  private generateRecommendations(
    measurement: TimerResult,
    threshold: ThresholdResult,
    grade: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL'
  ): string[] {
    const recommendations: string[] = [];

    switch (grade) {
      case 'EXCELLENT':
        recommendations.push('Performance is excellent - well within thresholds');
        break;
      
      case 'GOOD':
        recommendations.push('Performance is good - comfortably within limits');
        break;
      
      case 'ACCEPTABLE':
        recommendations.push('Performance is acceptable but near threshold limits');
        break;
      
      case 'WARNING':
        recommendations.push('WARNING: Performance exceeds recommended threshold');
        recommendations.push('Consider optimization for production reliability');
        if (threshold.environment.type === 'jsdom') {
          recommendations.push('Note: jsdom environment may inflate timing - verify in production environment');
        }
        break;
      
      case 'CRITICAL':
        recommendations.push('CRITICAL: Performance severely exceeds threshold limits');
        recommendations.push('Immediate optimization required before deployment');
        recommendations.push('Review algorithms, database queries, and resource usage');
        break;
    }

    // Environment-specific recommendations
    if (threshold.environment.isCI) {
      recommendations.push('CI environment detected - thresholds adjusted for reliability');
    }

    if (threshold.environment.resourceConstraints.slowCPU) {
      recommendations.push('Slow CPU detected - consider algorithmic optimizations');
    }

    if (threshold.environment.resourceConstraints.limitedIOW) {
      recommendations.push('I/O constraints detected - consider caching and batching');
    }

    return recommendations;
  }

  /**
   * Get environment information
   */
  getEnvironment(): EnvironmentInfo {
    return this.environmentDetector.getEnvironmentInfo();
  }

  /**
   * Get timeout multiplier for current environment
   */
  getTimeoutMultiplier(): number {
    return this.environmentDetector.getTimeoutMultiplier();
  }

  /**
   * Create a Jest-compatible timeout based on environment
   */
  getJestTimeout(baseTimeout: number): number {
    return Math.ceil(baseTimeout * this.getTimeoutMultiplier());
  }
}

/**
 * TimerContext represents an active timing measurement
 */
export class TimerContext {
  private startTime: number;
  private environment: EnvironmentInfo;
  private getNow: () => number;
  private functionName?: string;
  private thresholdCalculator: AdaptiveThresholdCalculator;

  constructor(
    startTime: number,
    environment: EnvironmentInfo,
    getNow: () => number,
    functionName?: string,
    thresholdCalculator?: AdaptiveThresholdCalculator
  ) {
    this.startTime = startTime;
    this.environment = environment;
    this.getNow = getNow;
    this.functionName = functionName;
    this.thresholdCalculator = thresholdCalculator || AdaptiveThresholdCalculator.getInstance();
  }

  /**
   * Stop the timer and return measurement result
   */
  stop(): TimerResult {
    const endTime = this.getNow();
    const duration = endTime - this.startTime;

    return {
      startTime: this.startTime,
      endTime,
      duration,
      precision: this.environment.precision,
      environment: this.environment,
      timedFunction: this.functionName
    };
  }

  /**
   * Check current elapsed time without stopping the timer
   */
  elapsed(): number {
    return this.getNow() - this.startTime;
  }

  /**
   * Validate current elapsed time against thresholds without stopping
   */
  validateElapsed(
    budgetLevel: BudgetLevel,
    component: ComponentType
  ): { elapsed: number; threshold: ThresholdResult; exceeds: boolean } {
    const elapsed = this.elapsed();
    const threshold = this.thresholdCalculator.calculateThreshold(budgetLevel, component);
    const exceeds = elapsed > threshold.adaptiveThreshold;

    return { elapsed, threshold, exceeds };
  }
}

/**
 * Convenience function to create and start a timer
 */
export function startTimer(functionName?: string, budgetsPath?: string): TimerContext {
  const timer = new TestTimer(budgetsPath);
  return timer.start(functionName);
}

/**
 * Convenience function to measure async function performance
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  functionName?: string,
  budgetLevel?: BudgetLevel,
  component?: ComponentType,
  budgetsPath?: string
): Promise<{ result: T; measurement: TimerResult; validation?: PerformanceValidation }> {
  const timer = new TestTimer(budgetsPath);
  return timer.measureAsync(fn, functionName, budgetLevel, component);
}

/**
 * Convenience function to measure sync function performance
 */
export function measure<T>(
  fn: () => T,
  functionName?: string,
  budgetLevel?: BudgetLevel,
  component?: ComponentType,
  budgetsPath?: string
): { result: T; measurement: TimerResult; validation?: PerformanceValidation } {
  const timer = new TestTimer(budgetsPath);
  return timer.measure(fn, functionName, budgetLevel, component);
}

/**
 * Global timer instance for convenience
 */
export const globalTimer = new TestTimer();

/**
 * Backward compatibility: Drop-in replacement for performance.now()
 */
export function adaptiveNow(): number {
  return globalTimer.getEnvironment().type === 'jsdom' ? Date.now() : performance.now();
}
