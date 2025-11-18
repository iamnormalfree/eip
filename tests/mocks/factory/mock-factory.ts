// ABOUTME: Centralized Mock Factory for EIP Jest Tests
// ABOUTME: Type-safe mock creation with parameter validation and configuration

import { jest } from '@jest/globals';
import type {
  MockJobParameters,
  MockBriefParameters,
  MockContentParameters,
  MockBudgetParameters,
  MockCircuitBreakerParameters,
  MockSupabaseParameters,
  MockQueueParameters,
  MockJobResultParameters,
  MockDLQResultParameters,
  MockFactoryConfig,
  MockCreationResult,
  MockValidationError,
  MockFactory as IMockFactory,
  MockFactoryTesting,
} from './mock-types';

export class MockFactory implements IMockFactory {
  private config: MockFactoryConfig = {
    defaultTimeout: 30000,
    defaultRetries: 3,
    enableStrictTypeChecking: true,
    logMockCreations: false,
    validateParameters: true
  };

  private mockRegistry: Map<string, any> = new Map();

  constructor(config?: Partial<MockFactoryConfig>) {
    if (config) {
      this.configure(config);
    }
  }

  createJob(params: MockJobParameters): MockCreationResult<any> {
    const errors = this.validateParams(params, MockSchemas.standardJob);
    
    if (errors.length > 0 && this.config.enableStrictTypeChecking) {
      return { success: false, errors };
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);

    const mockJob = {
      id: params.id || 'job-' + timestamp + '-' + randomSuffix,
      data: {
        type: params.type,
        persona: params.persona || 'test-persona',
        funnel: params.funnel || 'test-funnel',
        topic: params.topic,
        tier: params.tier,
        metadata: params.metadata || {}
      },
      correlationId: params.correlationId || 'corr-' + timestamp,
      userId: params.userId || 'test-user-123'
    };

    this.registerMock('job', mockJob);
    this.logMockCreation('Job', mockJob);

    return { success: true, mock: mockJob };
  }

  createJobResult(params: MockJobResultParameters): MockCreationResult<any> {
    const timestamp = Date.now();
    
    const mockResult = {
      success: params.success !== undefined ? params.success : true,
      id: params.id || 'result-' + timestamp,
      reason: params.reason,
      completedStages: params.completedStages || [],
      failedStages: params.failedStages || [],
      partialFailure: params.partialFailure || false,
      preservedContext: params.preservedContext,
      rollbackTriggered: params.rollbackTriggered || false,
      rollbackStages: params.rollbackStages || [],
      attempt: params.attempt || 1,
      retryDelay: params.retryDelay || 1000,
      maxRetries: params.maxRetries || 3,
      retryCount: params.retryCount || 0,
      nextRetryTime: params.nextRetryTime,
      totalAttempts: params.totalAttempts || 1,
      finalStatus: params.finalStatus,
      errorContext: params.errorContext,
      errors: params.errors || [],
      aggregatedError: params.aggregatedError,
      errorCount: params.errorCount || 0,
      auditTrail: params.auditTrail || []
    };

    this.registerMock('jobResult', mockResult);
    this.logMockCreation('JobResult', mockResult);

    return { success: true, mock: mockResult };
  }

  createDLQResult(params: MockDLQResultParameters): MockCreationResult<any> {
    const timestamp = Date.now();
    
    const mockDLQResult = {
      success: params.success !== undefined ? params.success : true,
      dlqId: params.dlqId || 'dlq-' + timestamp,
      reason: params.reason,
      context: params.context,
      error: params.error,
      capacity: params.capacity || 100,
      currentCount: params.currentCount || 0
    };

    this.registerMock('dlqResult', mockDLQResult);
    this.logMockCreation('DLQResult', mockDLQResult);

    return { success: true, mock: mockDLQResult };
  }

  createContent(params: MockContentParameters): MockCreationResult<any> {
    const errors = this.validateParams(params, MockSchemas.standardContent);
    
    if (errors.length > 0 && this.config.enableStrictTypeChecking) {
      return { success: false, errors };
    }

    const timestamp = Date.now();

    const mockContent = {
      id: params.id || 'content-' + timestamp,
      title: params.title || 'Test Content Title',
      body: params.body || 'Test content body for validation purposes.',
      ip_type: params.ip_type || 'framework',
      ip_version: params.ip_version || '1.0.0',
      metadata: params.metadata || {},
      compliance_tags: params.compliance_tags || {
        domains: ['mas.gov.sg'],
        financial_claims_sourced: true,
        legal_disclaimers: true
      }
    };

    this.registerMock('content', mockContent);
    this.logMockCreation('Content', mockContent);

    return { success: true, mock: mockContent };
  }

  createBrief(params: MockBriefParameters): MockCreationResult<any> {
    const errors = this.validateParams(params, MockSchemas.brief);
    
    if (errors.length > 0 && this.config.enableStrictTypeChecking) {
      return { success: false, errors };
    }

    const mockBrief = {
      brief: params.brief,
      persona: params.persona || 'test-persona',
      funnel: params.funnel || 'test-funnel',
      tier: params.tier || 'MEDIUM',
      correlation_id: params.correlation_id || 'corr-' + Date.now(),
      queue_mode: params.queue_mode !== undefined ? params.queue_mode : false
    };

    this.registerMock('brief', mockBrief);
    this.logMockCreation('Brief', mockBrief);

    return { success: true, mock: mockBrief };
  }


  createBudgetEnforcer(params: MockBudgetParameters): MockCreationResult<any> {
    const errors = this.validateParams(params, MockSchemas.budgetEnforcer);
    
    if (errors.length > 0 && this.config.enableStrictTypeChecking) {
      return { success: false, errors };
    }

    const budgetLimits = this.getBudgetLimits(params.tier);
    const timestamp = params.startTime || Date.now();
    
    const mockBudgetEnforcer = {
      tier: params.tier,
      tokenLimit: params.tokenLimit || budgetLimits.tokens,
      timeLimit: params.timeLimit || budgetLimits.time,
      costLimit: params.costLimit || budgetLimits.cost,
      startStage: jest.fn(),
      addTokens: jest.fn(),
      checkStageBudget: jest.fn(() => ({ ok: true, remaining: 100 })),
      checkOverallBudget: jest.fn(() => ({ ok: true, remaining: 100 })),
      getTracker: jest.fn(() => ({
        start_time: timestamp,
        tokens_used: params.initialTokens || 0
      })),
      canProceed: jest.fn(() => ({ ok: true })),
      shouldFailToDLQ: jest.fn(() => false),
      hasBreaches: jest.fn(() => false)
    };

    this.registerMock('budgetEnforcer', mockBudgetEnforcer);
    this.logMockCreation('BudgetEnforcer', mockBudgetEnforcer);

    return { success: true, mock: mockBudgetEnforcer };
  }

  createBudgetEnforcerForTesting(params: MockBudgetParameters): MockCreationResult<any> {
    const errors = this.validateParams(params, MockSchemas.budgetEnforcer);
    
    if (errors.length > 0 && this.config.enableStrictTypeChecking) {
      return { success: false, errors };
    }

    const budgetLimits = this.getBudgetLimits(params.tier);
    const timestamp = params.startTime || Date.now();
    
    // Create testing-specific budget enforcer with controlled private property access
    const privateTracker = {
      start_time: timestamp,
      tokens_used: params.initialTokens || 0,
      stage_tokens: {},
      stage_times: {},
      active_stages: new Set<string>(),
      breaches: []
    };

    const mockBudgetEnforcerForTesting = {
      tier: params.tier,
      tokenLimit: params.tokenLimit || budgetLimits.tokens,
      timeLimit: params.timeLimit || budgetLimits.time,
      costLimit: params.costLimit || budgetLimits.cost,
      
      // Standard methods
      startStage: jest.fn(),
      addTokens: jest.fn(),
      checkStageBudget: jest.fn(() => ({ ok: true, remaining: 100 })),
      checkOverallBudget: jest.fn(() => ({ ok: true, remaining: 100 })),
      getTracker: jest.fn(() => privateTracker),
      canProceed: jest.fn(() => ({ ok: true })),
      shouldFailToDLQ: jest.fn(() => false),
      hasBreaches: jest.fn(() => false),
      
      // Testing-specific controlled access to private properties
      _getPrivateTracker: () => privateTracker,
      _setPrivateTracker: (newTracker: any) => { Object.assign(privateTracker, newTracker); },
      _getBreaches: () => privateTracker.breaches,
      _addBreach: (breach: any) => { privateTracker.breaches.push(breach); },
      _setActiveStages: (stages: Set<string>) => { privateTracker.active_stages = stages; },
      _getActiveStages: () => privateTracker.active_stages
    };

    this.registerMock('budgetEnforcerForTesting', mockBudgetEnforcerForTesting);
    this.logMockCreation('BudgetEnforcerForTesting', mockBudgetEnforcerForTesting);

    return { success: true, mock: mockBudgetEnforcerForTesting };
  }


  createCircuitBreaker(params: MockCircuitBreakerParameters): MockCreationResult<any> {
    const mockCircuitBreaker = {
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
      getState: jest.fn(() => params.initialState || 'CLOSED'),
      canExecute: jest.fn(() => params.initialState !== 'OPEN'),
      getFailureCount: jest.fn(() => 0),
      reset: jest.fn()
    };

    this.registerMock('circuitBreaker', mockCircuitBreaker);
    this.logMockCreation('CircuitBreaker', mockCircuitBreaker);

    return { success: true, mock: mockCircuitBreaker };
  }

  createSupabaseClient(params: MockSupabaseParameters): MockCreationResult<any> {
    const mockClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: params.mockData || [],
            error: params.shouldReturnError ? {
              message: params.errorMessage || 'Mock error',
              code: params.errorType || 'MOCK_ERROR'
            } : null
          })),
          limit: jest.fn(() => ({
            data: params.mockData || [],
            error: params.shouldReturnError ? {
              message: params.errorMessage || 'Mock error',
              code: params.errorType || 'MOCK_ERROR'
            } : null
          }))
        })),
        insert: jest.fn(() => ({
          data: params.mockData ? params.mockData[0] : null,
          error: params.shouldReturnError ? {
            message: params.errorMessage || 'Mock error'
          } : null
        })),
        update: jest.fn(() => ({
          data: params.mockData ? params.mockData[0] : null,
          error: params.shouldReturnError ? {
            message: params.errorMessage || 'Mock error'
          } : null
        })),
        delete: jest.fn(() => ({
          data: null,
          error: params.shouldReturnError ? {
            message: params.errorMessage || 'Mock error'
          } : null
        }))
      }))
    };

    this.registerMock('supabaseClient', mockClient);
    this.logMockCreation('SupabaseClient', mockClient);

    return { success: true, mock: mockClient };
  }

  createQueue(params: MockQueueParameters): MockCreationResult<any> {
    const timestamp = Date.now();
    
    const mockQueue = {
      add: jest.fn(() => params.shouldFailOnAdd 
        ? Promise.reject(new Error('Mock queue add error'))
        : Promise.resolve(params.addJobResult || { id: 'job-' + timestamp })
      ),
      process: jest.fn(() => params.shouldFailOnProcess
        ? Promise.reject(new Error('Mock queue process error'))
        : Promise.resolve(params.processResult || { success: true })
      ),
      getWaiting: jest.fn(() => Promise.resolve(params.getWaitingResult || [])),
      getActive: jest.fn(() => Promise.resolve(params.getActiveResult || [])),
      getCompleted: jest.fn(() => Promise.resolve(params.getCompletedResult || [])),
      getFailed: jest.fn(() => Promise.resolve(params.getFailedResult || [])),
      pause: jest.fn(() => Promise.resolve()),
      resume: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve())
    };

    this.registerMock('queue', mockQueue);
    this.logMockCreation('Queue', mockQueue);

    return { success: true, mock: mockQueue };
  }

  validateParams<T extends object>(params: T, schema: any): MockValidationError[] {
    const errors: MockValidationError[] = [];
    
    if (!this.config.validateParameters) {
      return errors;
    }

    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in params)) {
          errors.push({
            field: requiredField,
            expectedType: 'required',
            receivedType: 'missing',
            message: 'Required field \'' + requiredField + '\' is missing'
          });
        }
      }
    }

    for (const [field, value] of Object.entries(params)) {
      if (schema[field]) {
        const expectedType = schema[field];
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (Array.isArray(expectedType)) {
          const expectedValues = expectedType.join(', ');
          if (!expectedType.includes(value)) {
            errors.push({
              field,
              expectedType: expectedValues,
              receivedType: actualType,
              message: 'Field \'' + field + '\' must be one of: ' + expectedValues
            });
          }
        } else if (expectedType !== actualType && value !== undefined) {
          errors.push({
            field,
            expectedType,
            receivedType: actualType,
            message: 'Field \'' + field + '\' type mismatch: expected ' + expectedType + ', got ' + actualType
          });
        }
      }
    }

    return errors;
  }

  reset(): void {
    this.mockRegistry.clear();
    jest.clearAllMocks();
  }

  configure(config: Partial<MockFactoryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private registerMock(type: string, mock: any): void {
    this.mockRegistry.set(type, mock);
  }

  private logMockCreation(type: string, mock: any): void {
    if (this.config.logMockCreations) {
      console.log('MockFactory: Created ' + type + ' mock', mock);
    }
  }

  private getBudgetLimits(tier: 'LIGHT' | 'MEDIUM' | 'HEAVY') {
    switch (tier) {
      case 'LIGHT':
        return { tokens: 1400, time: 20000, cost: 0.01 };
      case 'MEDIUM':
        return { tokens: 2400, time: 45000, cost: 0.02 };
      case 'HEAVY':
        return { tokens: 4000, time: 90000, cost: 0.05 };
      default:
        return { tokens: 1400, time: 20000, cost: 0.01 };
    }
  }
}

const MockSchemas = {
  standardJob: {
    type: 'string',
    topic: 'string', 
    tier: ['LIGHT', 'MEDIUM', 'HEAVY'],
    required: ['type', 'topic', 'tier']
  },
  
  standardContent: {
    id: 'string',
    title: 'string',
    body: 'string',
    ip_type: 'string',
    ip_version: 'string',
    required: ['title', 'body']
  },
  
  brief: {
    brief: 'string',
    persona: 'string',
    funnel: 'string', 
    tier: ['LIGHT', 'MEDIUM', 'HEAVY'],
    correlation_id: 'string',
    queue_mode: 'boolean',
    required: ['brief']
  },
  
  budgetEnforcer: {
    tier: ['LIGHT', 'MEDIUM', 'HEAVY'],
    required: ['tier']
  },
  
  circuitBreaker: {
    initialState: ['CLOSED', 'OPEN', 'HALF_OPEN'],
    failureThreshold: 'number',
    recoveryTimeout: 'number'
  }
} as const;

export const mockFactory = new MockFactory();

export const createMockJob = (params: MockJobParameters) => mockFactory.createJob(params);
export const createMockBrief = (params: MockBriefParameters) => mockFactory.createBrief(params);
export const createMockContent = (params: MockContentParameters) => mockFactory.createContent(params);
export const createMockBudgetEnforcer = (params: MockBudgetParameters) => mockFactory.createBudgetEnforcer(params);
export const createMockBudgetEnforcerForTesting = (params: MockBudgetParameters) => mockFactory.createBudgetEnforcerForTesting(params);
export const createMockCircuitBreaker = (params: MockCircuitBreakerParameters) => mockFactory.createCircuitBreaker(params);
export const createMockSupabaseClient = (params: MockSupabaseParameters) => mockFactory.createSupabaseClient(params);
export const createMockQueue = (params: MockQueueParameters) => mockFactory.createQueue(params);
