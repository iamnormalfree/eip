// ABOUTME: Main exports for adaptive performance testing framework
// ABOUTME: Provides centralized access to all performance testing utilities

export { EnvironmentDetector } from './environment-detector';
export type { EnvironmentType, CIPlatform, EnvironmentInfo } from './environment-detector';

export { AdaptiveThresholdCalculator } from './threshold-calculator';
export type { 
  BudgetLevel, 
  ComponentType, 
  ThresholdResult 
} from './threshold-calculator';

export { 
  TestTimer, 
  TimerContext,
  startTimer,
  measureAsync,
  measure,
  globalTimer,
  adaptiveNow
} from './test-timer';

export type { TimerResult, PerformanceValidation } from './test-timer';

// Convenience exports for backward compatibility with performance.now()
export const performance = {
  now: adaptiveNow
};

// Default exports for easy migration
export default {
  TestTimer,
  EnvironmentDetector,
  AdaptiveThresholdCalculator,
  startTimer,
  measureAsync,
  measure,
  adaptiveNow
};
