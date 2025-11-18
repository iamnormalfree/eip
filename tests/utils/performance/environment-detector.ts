// ABOUTME: Environment detection for adaptive performance testing in EIP
// ABOUTME: Provides environment-aware precision adjustment and CI/CD detection

/**
 * Environment types for performance testing
 */
export type EnvironmentType = 'node' | 'browser' | 'jsdom' | 'unknown';

/**
 * CI/CD platform types for conservative threshold adjustments
 */
export type CIPlatform = 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci' | 'travis' | 'azure-pipelines' | 'none';

/**
 * Environment detection result with performance characteristics
 */
export interface EnvironmentInfo {
  type: EnvironmentType;
  platform: CIPlatform;
  precision: number;
  isCI: boolean;
  isDebugging: boolean;
  resourceConstraints: {
    lowMemory: boolean;
    slowCPU: boolean;
    limitedIOW: boolean;
  };
}

/**
 * EnvironmentDetector provides environment-aware performance testing capabilities
 */
export class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private environmentInfo: EnvironmentInfo | null = null;

  /**
   * Singleton access to environment detector
   */
  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  /**
   * Get current environment information
   */
  getEnvironmentInfo(): EnvironmentInfo {
    if (!this.environmentInfo) {
      this.environmentInfo = this.detectEnvironment();
    }
    return this.environmentInfo;
  }

  /**
   * Detect the current test environment
   */
  private detectEnvironment(): EnvironmentInfo {
    const type = this.detectEnvironmentType();
    const platform = this.detectCIPlatform();
    const isCI = platform !== 'none';
    const precision = this.calculatePrecision(type, isCI);
    const isDebugging = this.detectDebuggingMode();
    const resourceConstraints = this.detectResourceConstraints();

    return {
      type,
      platform,
      precision,
      isCI,
      isDebugging,
      resourceConstraints
    };
  }

  /**
   * Detect the JavaScript environment type
   */
  private detectEnvironmentType(): EnvironmentType {
    // Check for Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'node';
    }

    // Check for jsdom environment (Jest default)
    if (typeof window !== 'undefined' && 
        typeof navigator !== 'undefined' && 
        navigator.userAgent && 
        navigator.userAgent.includes('jsdom')) {
      return 'jsdom';
    }

    // Check for browser environment
    if (typeof window !== 'undefined' && 
        typeof document !== 'undefined' && 
        typeof navigator !== 'undefined') {
      return 'browser';
    }

    return 'unknown';
  }

  /**
   * Detect CI/CD platform for conservative threshold adjustments
   */
  private detectCIPlatform(): CIPlatform {
    // GitHub Actions
    if (process.env.GITHUB_ACTIONS === 'true') {
      return 'github-actions';
    }

    // GitLab CI
    if (process.env.GITLAB_CI === 'true') {
      return 'gitlab-ci';
    }

    // Jenkins
    if (process.env.JENKINS_URL || process.env.JENKINS_HOME) {
      return 'jenkins';
    }

    // CircleCI
    if (process.env.CIRCLECI) {
      return 'circleci';
    }

    // Travis CI
    if (process.env.TRAVIS) {
      return 'travis';
    }

    // Azure Pipelines
    if (process.env.AZURE_PIPELINES === 'true') {
      return 'azure-pipelines';
    }

    // Generic CI detection
    if (process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true') {
      return 'github-actions'; // Default to GitHub Actions for generic CI
    }

    return 'none';
  }

  /**
   * Calculate precision based on environment type and CI status
   */
  private calculatePrecision(type: EnvironmentType, isCI: boolean): number {
    // Base precision by environment type
    const basePrecision = {
      'node': 0.1,      // High precision in Node.js
      'browser': 1,     // Medium precision in real browsers
      'jsdom': 5,       // Lower precision in jsdom (Jest)
      'unknown': 10     // Very conservative precision for unknown environments
    }[type] || 10;

    // Apply CI adjustments (more conservative in CI)
    if (isCI) {
      return basePrecision * 2; // Double the precision threshold in CI
    }

    return basePrecision;
  }

  /**
   * Detect if running in debugging mode
   */
  private detectDebuggingMode(): boolean {
    // Check Node.js debugging flags
    if (typeof process !== 'undefined' && process.execArgv) {
      const debugFlags = ['--inspect', '--inspect-brk', '--debug', '--debug-brk'];
      return process.execArgv.some(arg => debugFlags.some(flag => arg.includes(flag)));
    }

    // Check environment variables indicating debugging
    if (typeof process !== 'undefined') {
      return !!(process.env.NODE_ENV === 'development' ||
                process.env.DEBUG ||
                process.env.DEBUG_MODE);
    }

    return false;
  }

  /**
   * Detect resource constraints that might affect performance
   */
  private detectResourceConstraints() {
    const constraints = {
      lowMemory: false,
      slowCPU: false,
      limitedIOW: false
    };

    if (typeof process !== 'undefined') {
      // Memory constraints detection
      if (process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) {
        // AWS Lambda with limited memory
        const lambdaMemory = parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE);
        constraints.lowMemory = lambdaMemory < 512; // Less than 512MB is considered low memory
      }

      // CI environments often have resource constraints
      if (process.env.CI === 'true') {
        constraints.slowCPU = true;
        constraints.limitedIOW = true;
      }

      // Container environment indicators
      if (process.env.CONTAINER === 'true' || 
          process.env.DOCKER_CONTAINER === 'true' ||
          process.env.KUBERNETES_SERVICE_HOST) {
        constraints.limitedIOW = true;
      }
    }

    return constraints;
  }

  /**
   * Check if the current environment supports high-resolution timing
   */
  supportsHighResolutionTiming(): boolean {
    const env = this.getEnvironmentInfo();
    
    // Node.js and real browsers support high-resolution timing
    if (env.type === 'node' || env.type === 'browser') {
      return true;
    }

    // jsdom has limited timing support
    if (env.type === 'jsdom') {
      return false;
    }

    // Conservative approach for unknown environments
    return false;
  }

  /**
   * Get the appropriate performance measurement function for the environment
   */
  getPerformanceFunction(): () => number {
    const env = this.getEnvironmentInfo();

    // Try to use performance.now() if available and working
    if (typeof performance !== 'undefined' && performance.now) {
      const testValue = performance.now();
      if (typeof testValue === 'number' && !isNaN(testValue)) {
        return () => performance.now();
      }
    }

    // Fallback to Date.now() for all environments
    return () => Date.now();
  }

  /**
   * Get environment-specific timeout multiplier
   */
  getTimeoutMultiplier(): number {
    const env = this.getEnvironmentInfo();
    let multiplier = 1.0;

    // CI environments need more time
    if (env.isCI) {
      multiplier *= 2.0;
    }

    // Debugging mode needs more time
    if (env.isDebugging) {
      multiplier *= 1.5;
    }

    // Resource constraints
    if (env.resourceConstraints.lowMemory) {
      multiplier *= 1.2;
    }
    if (env.resourceConstraints.slowCPU) {
      multiplier *= 1.3;
    }
    if (env.resourceConstraints.limitedIOW) {
      multiplier *= 1.2;
    }

    // jsdom environments need more time
    if (env.type === 'jsdom') {
      multiplier *= 1.5;
    }

    return Math.max(multiplier, 1.0); // Never reduce timeout below 1.0x
  }
}
