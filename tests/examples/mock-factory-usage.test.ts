// ABOUTME: Example test file demonstrating MockFactory usage
// ABOUTME: Shows how to fix mock parameter mismatches with centralized factory

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockFactory } from '../mocks/factory/mock-factory';
import type { 
  MockJobParameters, 
  MockBudgetParameters, 
  MockCircuitBreakerParameters 
} from '../mocks/factory/mock-types';

describe('MockFactory Usage Examples', () => {
  beforeEach(() => {
    mockFactory.reset();
  });

  describe('Job Mock Creation', () => {
    it('should create a valid job mock with required parameters', () => {
      const jobParams: MockJobParameters = {
        type: 'content-generation',
        topic: 'financial planning for Singapore residents',
        tier: 'MEDIUM',
        persona: 'financial-advisor',
        funnel: 'educational'
      };

      const result = mockFactory.createJob(jobParams);

      expect(result.success).toBe(true);
      expect(result.mock).toBeDefined();
      expect(result.mock.id).toMatch(/^job-\d+-\w+$/);
      expect(result.mock.data.type).toBe('content-generation');
      expect(result.mock.data.topic).toBe('financial planning for Singapore residents');
      expect(result.mock.data.tier).toBe('MEDIUM');
      expect(result.mock.correlationId).toMatch(/^corr-\d+$/);
    });

    it('should reject job mock with missing required parameters', () => {
      const invalidJobParams = {
        tier: 'MEDIUM'
      } as MockJobParameters;

      const result = mockFactory.createJob(invalidJobParams);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toMatch(/type|topic/);
    });
  });

  describe('Budget Enforcer Mock Creation', () => {
    it('should create budget enforcer with correct tier limits', () => {
      const budgetParams: MockBudgetParameters = {
        tier: 'LIGHT',
        tokenLimit: 1500,
        timeLimit: 25000
      };

      const result = mockFactory.createBudgetEnforcer(budgetParams);

      expect(result.success).toBe(true);
      expect(result.mock).toBeDefined();
      expect(result.mock.tier).toBe('LIGHT');
      expect(result.mock.tokenLimit).toBe(1500);
      expect(result.mock.timeLimit).toBe(25000);
      expect(typeof result.mock.startStage).toBe('function');
      expect(typeof result.mock.addTokens).toBe('function');
    });
  });
});
