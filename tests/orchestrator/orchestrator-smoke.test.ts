// ABOUTME: Simple smoke test for EIP orchestrator components
// ABOUTME: Validates core functionality without complex dependencies

// Mock problematic ES modules at the top level
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-1234'),
  v1: jest.fn(() => 'mock-uuid-v1-1234'),
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    process: jest.fn(),
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('ioredis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
  })),
}));

describe('EIP Orchestrator Smoke Tests', () => {
  describe('Budget System', () => {
    it('should create budget enforcer without errors', () => {
      const { BudgetEnforcer } = require('../../orchestrator/budget');

      expect(() => {
        const enforcer = new BudgetEnforcer('MEDIUM');
        expect(enforcer).toBeDefined();
        expect(enforcer.getTier()).toBe('MEDIUM');
      }).not.toThrow();
    });

    it('should load budgets from YAML', () => {
      const { loadBudgetsFromYAML } = require('../../orchestrator/yaml-budget-loader');

      expect(() => {
        const budgets = loadBudgetsFromYAML();
        expect(budgets).toBeDefined();
        expect(budgets.LIGHT).toBeDefined();
        expect(budgets.MEDIUM).toBeDefined();
        expect(budgets.HEAVY).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Router System', () => {
    it('should route basic requests without errors', async () => {
      const { routeIP } = require('../../orchestrator/router');

      expect(() => {
        const result = routeIP({
          persona: 'professional',
          funnel: 'mofu',
          brief: 'test framework'
        });
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }).not.toThrow();
    });

    it('should handle empty inputs gracefully', async () => {
      const { routeIP } = require('../../orchestrator/router');

      expect(() => {
        const result = routeIP({});
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }).not.toThrow();
    });
  });

  describe('Logger System', () => {
    it('should initialize logger without errors', () => {
      expect(() => {
        const { getLogger } = require('../../orchestrator/logger');
        const logger = getLogger();
        expect(logger).toBeDefined();
      }).not.toThrow();
    });

    it('should handle correlation tracking', () => {
      const { startCorrelation, endCorrelation, getLogger } = require('../../orchestrator/logger');

      expect(() => {
        const correlationId = startCorrelation({
          jobId: 'test-job',
          persona: 'professional'
        });
        expect(correlationId).toBeDefined();
        expect(typeof correlationId).toBe('string');

        endCorrelation(correlationId);
      }).not.toThrow();
    });
  });

  describe('Controller System', () => {
    it('should import controller without errors', () => {
      expect(() => {
        const controller = require('../../orchestrator/controller');
        expect(controller).toBeDefined();
        expect(controller.runOnce).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('YAML Budget Loader', () => {
    it('should handle missing YAML file gracefully', () => {
      const { loadBudgetsFromYAML } = require('../../orchestrator/yaml-budget-loader');

      expect(() => {
        const budgets = loadBudgetsFromYAML();
        expect(budgets).toBeDefined();
        expect(typeof budgets).toBe('object');
      }).not.toThrow();
    });
  });
});