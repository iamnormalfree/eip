// ABOUTME: Type-safe parameter interfaces for EIP centralized mock factory
// ABOUTME: Defines mock configuration contracts with TypeScript validation

/**
 * Core mock factory parameter interfaces
 * Provides type safety and validation for all mock configurations
 */

// ============================================================================
// Mock Creation Parameters
// ============================================================================

export interface MockJobParameters {
  id?: string;
  type: string;
  persona?: string;
  funnel?: string;
  topic: string;
  tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface MockBriefParameters {
  brief: string;
  persona?: string;
  funnel?: string;
  tier?: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  correlation_id?: string;
  queue_mode?: boolean;
}

export interface MockContentParameters {
  id?: string;
  title?: string;
  body?: string;
  ip_type?: string;
  ip_version?: string;
  metadata?: Record<string, any>;
  compliance_tags?: {
    domains?: string[];
    financial_claims_sourced?: boolean;
    legal_disclaimers?: boolean;
  };
}

export interface MockBudgetParameters {
  tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  tokenLimit?: number;
  timeLimit?: number;
  costLimit?: number;
  initialTokens?: number;
  startTime?: number;
}

export interface MockCircuitBreakerParameters {
  initialState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureThreshold?: number;
  recoveryTimeout?: number;
  expectedErrors?: string[];
}

export interface MockSupabaseParameters {
  url?: string;
  anonKey?: string;
  tableName?: string;
  mockData?: any[];
  shouldReturnError?: boolean;
  errorType?: string;
  errorMessage?: string;
}

export interface MockQueueParameters {
  queueName?: string;
  addJobResult?: { id: string; };
  processResult?: { success: boolean; };
  getWaitingResult?: any[];
  getActiveResult?: any[];
  getCompletedResult?: any[];
  getFailedResult?: any[];
  shouldFailOnAdd?: boolean;
  shouldFailOnProcess?: boolean;
}

// ============================================================================
// Mock Response Parameters
// ============================================================================

export interface MockJobResultParameters {
  success?: boolean;
  id?: string;
  reason?: string;
  completedStages?: string[];
  failedStages?: string[];
  partialFailure?: boolean;
  preservedContext?: {
    correlationId?: string;
    userId?: string;
    jobId?: string;
    completedStages?: string[];
    failedStage?: string;
  };
  rollbackTriggered?: boolean;
  rollbackStages?: string[];
  attempt?: number;
  retryDelay?: number;
  maxRetries?: number;
  retryCount?: number;
  nextRetryTime?: number;
  totalAttempts?: number;
  finalStatus?: string;
  errorContext?: {
    correlationId?: string;
    userId?: string;
    jobId?: string;
    stage?: string;
    errorType?: string;
    timestamp?: number;
    metadata?: Record<string, any>;
  };
  errors?: Array<{
    stage: string;
    type: string;
    message: string;
  }>;
  aggregatedError?: string;
  errorCount?: number;
  auditTrail?: Array<{
    timestamp?: number;
    jobId?: string;
    stage?: string;
    status?: string;
    duration?: number;
    error?: string;
    errorContext?: Record<string, any>;
  }>;
}

export interface MockDLQResultParameters {
  success?: boolean;
  dlqId?: string;
  reason?: string;
  context?: {
    correlationId?: string;
    userId?: string;
    jobId?: string;
  };
  error?: string;
  capacity?: number;
  currentCount?: number;
}

// ============================================================================
// Configuration Validation Types
// ============================================================================

export interface MockFactoryConfig {
  defaultTimeout?: number;
  defaultRetries?: number;
  enableStrictTypeChecking?: boolean;
  logMockCreations?: boolean;
  validateParameters?: boolean;
}

export interface MockValidationError {
  field: string;
  expectedType: string;
  receivedType: string;
  message: string;
}

// ============================================================================
// Factory Creation Result Types
// ============================================================================

export interface MockCreationResult<T> {
  success: boolean;
  mock?: T;
  errors?: MockValidationError[];
  warnings?: string[];
}

export interface MockFactory {
  // Job mocks
  createJob(params: MockJobParameters): MockCreationResult<any>;
  createJobResult(params: MockJobResultParameters): MockCreationResult<any>;
  createDLQResult(params: MockDLQResultParameters): MockCreationResult<any>;
  
  // Content mocks
  createContent(params: MockContentParameters): MockCreationResult<any>;
  // Input mocks
  createBrief(params: MockBriefParameters): MockCreationResult<any>;
  
  // System mocks
  createBudgetEnforcer(params: MockBudgetParameters): MockCreationResult<any>;
  createCircuitBreaker(params: MockCircuitBreakerParameters): MockCreationResult<any>;
  createSupabaseClient(params: MockSupabaseParameters): MockCreationResult<any>;
  createQueue(params: MockQueueParameters): MockCreationResult<any>;
  
  // Utility methods
  validateParams<T extends object>(params: T, schema: any): MockValidationError[];
  reset(): void;
}

// ============================================================================
// Testing-Specific Interface Extensions
// ============================================================================

export interface MockFactoryTesting {
  // Testing-specific methods that need controlled access to private properties
  createBudgetEnforcerForTesting(params: MockBudgetParameters): MockCreationResult<any>;
}


// ============================================================================
// Pre-built Mock Schemas for Common Test Scenarios
// ============================================================================

export const MockSchemas = {
  // Standard EIP job mock
  standardJob: {
    type: 'string',
    topic: 'string', 
    tier: ['LIGHT', 'MEDIUM', 'HEAVY'],
    required: ['type', 'topic', 'tier']
  },
  
  // Content piece mock
  standardContent: {
    id: 'string',
    title: 'string',
    body: 'string',
    ip_type: 'string',
    ip_version: 'string',
    required: ['title', 'body']
  },
  
  // Budget enforcer mock
  budgetEnforcer: {
    tier: ['LIGHT', 'MEDIUM', 'HEAVY'],
    required: ['tier']
  },
  
  // Circuit breaker mock
  circuitBreaker: {
    initialState: ['CLOSED', 'OPEN', 'HALF_OPEN'],
    failureThreshold: 'number',
    recoveryTimeout: 'number'
  }
} as const;
