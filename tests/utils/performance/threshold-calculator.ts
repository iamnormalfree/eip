// ABOUTME: Adaptive threshold calculator based on budgets.yaml performance targets
// ABOUTME: Provides environment-aware performance threshold calculations

import { EnvironmentDetector, EnvironmentInfo } from './environment-detector';

/**
 * Performance budget levels from budgets.yaml
 */
export type BudgetLevel = 'LIGHT' | 'MEDIUM' | 'HEAVY';

/**
 * Performance component types for targeted threshold calculation
 */
export type ComponentType = 'retrieval' | 'planner' | 'generator' | 'auditor' | 'repairer' | 'review' | 'wallclock_s';

/**
 * Threshold calculation result with environment context
 */
export interface ThresholdResult {
  budgetLevel: BudgetLevel;
  component: ComponentType;
  baseThreshold: number;
  adaptiveThreshold: number;
  environmentMultiplier: number;
  environment: EnvironmentInfo;
  reasoning: string[];
}

/**
 * Performance budgets loaded from budgets.yaml
 */
interface PerformanceBudgets {
  budgets: {
    [K in BudgetLevel]: {
      [C in ComponentType]?: number;
    };
  };
}

/**
 * AdaptiveThresholdCalculator provides environment-aware performance thresholds
 */
export class AdaptiveThresholdCalculator {
  private static instance: AdaptiveThresholdCalculator;
  private environmentDetector: EnvironmentDetector;
  private budgets: PerformanceBudgets;

  /**
   * Singleton access to threshold calculator
   */
  static getInstance(budgetsPath?: string): AdaptiveThresholdCalculator {
    if (!AdaptiveThresholdCalculator.instance) {
      AdaptiveThresholdCalculator.instance = new AdaptiveThresholdCalculator(budgetsPath);
    }
    return AdaptiveThresholdCalculator.instance;
  }

  /**
   * Initialize with optional custom budgets path
   */
  constructor(budgetsPath?: string) {
    this.environmentDetector = EnvironmentDetector.getInstance();
    this.budgets = this.loadBudgets(budgetsPath);
  }

  /**
   * Calculate adaptive threshold for a specific component and budget level
   */
  calculateThreshold(
    budgetLevel: BudgetLevel,
    component: ComponentType,
    customMultiplier?: number
  ): ThresholdResult {
    const environment = this.environmentDetector.getEnvironmentInfo();
    const baseThreshold = this.getBaseThreshold(budgetLevel, component);
    const environmentMultiplier = customMultiplier || this.calculateEnvironmentMultiplier(environment, component);
    const adaptiveThreshold = Math.ceil(baseThreshold * environmentMultiplier);
    const reasoning = this.generateReasoning(environment, baseThreshold, adaptiveThreshold, component);

    return {
      budgetLevel,
      component,
      baseThreshold,
      adaptiveThreshold,
      environmentMultiplier,
      environment,
      reasoning
    };
  }

  /**
   * Calculate thresholds for all components at a given budget level
   */
  calculateAllThresholds(budgetLevel: BudgetLevel): { [K in ComponentType]?: ThresholdResult } {
    const results: { [K in ComponentType]?: ThresholdResult } = {};
    
    const components: ComponentType[] = ['retrieval', 'planner', 'generator', 'auditor', 'repairer', 'review', 'wallclock_s'];
    
    for (const component of components) {
      if (this.budgets.budgets[budgetLevel][component]) {
        results[component] = this.calculateThreshold(budgetLevel, component);
      }
    }

    return results;
  }

  /**
   * Get base threshold from budgets without environmental adjustments
   */
  private getBaseThreshold(budgetLevel: BudgetLevel, component: ComponentType): number {
    const threshold = this.budgets.budgets[budgetLevel][component];
    
    if (threshold === undefined) {
      throw new Error(`No budget defined for ${budgetLevel}/${component}`);
    }

    return threshold;
  }

  /**
   * Calculate environment-specific multiplier based on detected conditions
   */
  private calculateEnvironmentMultiplier(environment: EnvironmentInfo, component: ComponentType): number {
    let multiplier = 1.0;

    // Base environment type adjustments
    const environmentMultipliers = {
      'node': 1.0,      // Baseline for Node.js
      'browser': 1.2,   // Slightly slower in browsers
      'jsdom': 2.0,     // Significantly slower in jsdom/Jest
      'unknown': 3.0    // Very conservative for unknown environments
    };

    multiplier *= environmentMultipliers[environment.type] || 3.0;

    // CI/CD platform adjustments
    if (environment.isCI) {
      const ciMultipliers = {
        'github-actions': 1.5,
        'gitlab-ci': 1.6,
        'jenkins': 1.8,
        'circleci': 1.7,
        'travis': 1.6,
        'azure-pipelines': 1.7,
        'none': 1.0
      };

      multiplier *= ciMultipliers[environment.platform] || 2.0;
    }

    // Debugging mode adjustments
    if (environment.isDebugging) {
      multiplier *= 1.5;
    }

    // Resource constraint adjustments
    if (environment.resourceConstraints.lowMemory) {
      multiplier *= 1.3; // Memory pressure affects all operations
    }

    if (environment.resourceConstraints.slowCPU) {
      // CPU-intensive components are more affected
      const cpuMultipliers = {
        'generator': 1.8,  // AI generation is CPU intensive
        'planner': 1.4,    // Planning requires computation
        'auditor': 1.3,    // Auditing involves analysis
        'repairer': 1.3,   // Repair needs computation
        'retrieval': 1.1,  // Retrieval is mostly I/O bound
        'review': 1.2,     // Review is lighter weight
        'wallclock_s': 1.5 // Overall wallclock time
      };
      multiplier *= cpuMultipliers[component] || 1.2;
    }

    if (environment.resourceConstraints.limitedIOW) {
      // I/O-intensive components are more affected
      const ioMultipliers = {
        'retrieval': 1.8,   // Database/network retrieval
        'generator': 1.2,   // Some I/O for generation
        'auditor': 1.1,     // Minimal I/O
        'planner': 1.1,     // Minimal I/O
        'repairer': 1.1,    // Minimal I/O
        'review': 1.0,      // No I/O
        'wallclock_s': 1.4  // Overall time affected by I/O
      };
      multiplier *= ioMultipliers[component] || 1.1;
    }

    // Component-specific adjustments based on typical performance characteristics
    const componentAdjustments = {
      'generator': 1.3,    // AI generation has high variability
      'retrieval': 1.1,    // More predictable performance
      'planner': 1.2,      // Moderate variability
      'auditor': 1.1,      // Consistent performance
      'repairer': 1.2,     // Moderate variability
      'review': 1.0,       // Most predictable
      'wallclock_s': 1.4   // End-to-end has highest variability
    };

    multiplier *= componentAdjustments[component] || 1.1;

    // Ensure minimum multiplier for safety
    return Math.max(multiplier, 1.0);
  }

  /**
   * Generate reasoning explaining threshold calculation
   */
  private generateReasoning(
    environment: EnvironmentInfo,
    baseThreshold: number,
    adaptiveThreshold: number,
    component: ComponentType
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Base threshold for ${component}: ${baseThreshold}ms`);

    // Environment type reasoning
    if (environment.type !== 'node') {
      const envMultiplier = environment.type === 'jsdom' ? '2.0x' : 
                           environment.type === 'browser' ? '1.2x' : '3.0x';
      reasoning.push(`${environment.type} environment detected - applied ${envMultiplier} multiplier`);
    }

    // CI/CD reasoning
    if (environment.isCI) {
      reasoning.push(`${environment.platform} CI detected - applied conservative multiplier`);
    }

    // Debugging reasoning
    if (environment.isDebugging) {
      reasoning.push('Debugging mode detected - applied 1.5x multiplier');
    }

    // Resource constraint reasoning
    if (environment.resourceConstraints.lowMemory) {
      reasoning.push('Low memory constraints detected - applied 1.3x multiplier');
    }

    if (environment.resourceConstraints.slowCPU) {
      reasoning.push('Slow CPU constraints detected - applied component-specific multiplier');
    }

    if (environment.resourceConstraints.limitedIOW) {
      reasoning.push('Limited I/O detected - applied I/O-specific multiplier');
    }

    // Final adjustment explanation
    if (adaptiveThreshold > baseThreshold) {
      const increase = ((adaptiveThreshold - baseThreshold) / baseThreshold * 100).toFixed(1);
      reasoning.push(`Final threshold increased by ${increase}% to ${adaptiveThreshold}ms for environmental factors`);
    } else {
      reasoning.push(`Threshold maintained at ${adaptiveThreshold}ms (optimal environment detected)`);
    }

    return reasoning;
  }

  /**
   * Load budgets from YAML file
   */
  private loadBudgets(budgetsPath?: string): PerformanceBudgets {
    // Default budgets path relative to project root
    const defaultPath = '/mnt/HC_Volume_103339633/projects/eip/orchestrator/budgets.yaml';
    const path = budgetsPath || defaultPath;

    try {
      // In a real implementation, you'd use a YAML parser here
      // For now, we'll use the hardcoded budgets from the blueprint
      return {
        budgets: {
          LIGHT: {
            retrieval: 200,
            planner: 400,
            generator: 1400,
            auditor: 300,
            repairer: 200,
            review: 100,
            wallclock_s: 20000 // Convert seconds to milliseconds
          },
          MEDIUM: {
            retrieval: 400,
            planner: 1000,
            generator: 2400,
            auditor: 700,
            repairer: 600,
            wallclock_s: 45000
          },
          HEAVY: {
            retrieval: 600,
            planner: 1400,
            generator: 4000,
            auditor: 1100,
            repairer: 1000,
            review: 300,
            wallclock_s: 90000
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to load budgets from ${path}: ${error}`);
    }
  }

  /**
   * Get budget information for a specific level
   */
  getBudgetLevel(budgetLevel: BudgetLevel): PerformanceBudgets['budgets'][BudgetLevel] {
    return this.budgets.budgets[budgetLevel];
  }

  /**
   * Check if a measurement exceeds its adaptive threshold
   */
  exceedsThreshold(
    measurement: number,
    budgetLevel: BudgetLevel,
    component: ComponentType
  ): { exceeds: boolean; ratio: number; threshold: ThresholdResult } {
    const threshold = this.calculateThreshold(budgetLevel, component);
    const ratio = measurement / threshold.adaptiveThreshold;
    const exceeds = ratio > 1.0;

    return {
      exceeds,
      ratio,
      threshold
    };
  }

  /**
   * Get performance grade based on measurement vs threshold
   */
  getPerformanceGrade(
    measurement: number,
    budgetLevel: BudgetLevel,
    component: ComponentType
  ): 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' {
    const { ratio } = this.exceedsThreshold(measurement, budgetLevel, component);

    if (ratio <= 0.5) return 'EXCELLENT';
    if (ratio <= 0.75) return 'GOOD';
    if (ratio <= 1.0) return 'ACCEPTABLE';
    if (ratio <= 1.5) return 'WARNING';
    return 'CRITICAL';
  }
}
