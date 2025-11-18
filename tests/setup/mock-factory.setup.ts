// ABOUTME: Centralized Mock Factory setup for EIP Jest tests
// ABOUTME: Initializes and configures the MockFactory for consistent mock creation

import { mockFactory } from '../mocks/factory/mock-factory';

// Configure MockFactory for EIP test environment
beforeAll(() => {
  mockFactory.configure({
    enableStrictTypeChecking: true,
    validateParameters: true,
    logMockCreations: false, // Set to true for debugging mock creation issues
    defaultTimeout: 30000,
    defaultRetries: 3
  });
});

// Reset MockFactory after each test to ensure isolation
afterEach(() => {
  mockFactory.reset();
});

// Export MockFactory instance for use in tests
global.mockFactory = mockFactory;

// Export convenience functions for global access
global.createMockJob = (params) => mockFactory.createJob(params);
global.createMockBrief = (params) => mockFactory.createBrief(params);
global.createMockContent = (params) => mockFactory.createContent(params);
global.createMockBudgetEnforcer = (params) => mockFactory.createBudgetEnforcer(params);
global.createMockBudgetEnforcerForTesting = (params) => mockFactory.createBudgetEnforcerForTesting(params);
global.createMockCircuitBreaker = (params) => mockFactory.createCircuitBreaker(params);
global.createMockSupabaseClient = (params) => mockFactory.createSupabaseClient(params);
global.createMockQueue = (params) => mockFactory.createQueue(params);
