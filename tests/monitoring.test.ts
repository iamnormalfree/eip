// ABOUTME: Basic monitoring tests for EIP Orchestrator - simplified approach
// ABOUTME: Validates that monitoring functions work without breaking test isolation

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  recordPipelineStart,
  recordPipelineCompletion,
  recordQueueOperation,
  recordBudgetViolation,
  recordComplianceCheck
} from '../orchestrator/monitoring';

describe('EIP Orchestrator Monitoring - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pipeline Metrics Functions', () => {
    it('should record pipeline start without throwing errors', () => {
      expect(() => {
        recordPipelineStart('MEDIUM', 'direct_execution');
      }).not.toThrow();
    });

    it('should record pipeline completion without throwing errors', () => {
      expect(() => {
        recordPipelineCompletion('MEDIUM', 'direct_execution', 'success', 5000, 1500);
      }).not.toThrow();
    });

    it('should handle different pipeline configurations', () => {
      expect(() => {
        recordPipelineStart('LIGHT', 'queue_first');
        recordPipelineCompletion('LIGHT', 'queue_first', 'success', 2000, 800);

        recordPipelineStart('HEAVY', 'direct_execution');
        recordPipelineCompletion('HEAVY', 'direct_execution', 'failure', 10000, 3500);
      }).not.toThrow();
    });
  });

  describe('Queue Operation Metrics Functions', () => {
    it('should record queue operation success', () => {
      expect(() => {
        recordQueueOperation('submit', 'success');
      }).not.toThrow();
    });

    it('should record queue operation failure', () => {
      expect(() => {
        recordQueueOperation('submit', 'failure');
        recordQueueOperation('process', 'failure');
      }).not.toThrow();
    });
  });

  describe('Budget Violation Metrics Functions', () => {
    it('should record budget violations', () => {
      expect(() => {
        recordBudgetViolation('MEDIUM', 'generator', 'tokens');
        recordBudgetViolation('HEAVY', 'retrieval', 'time');
      }).not.toThrow();
    });
  });

  describe('Compliance Check Metrics Functions', () => {
    it('should record compliance checks', () => {
      expect(() => {
        recordComplianceCheck('passed', 'mas.gov.sg');
        recordComplianceCheck('failed', 'untrusted.com');
        recordComplianceCheck('passed', 'gov.sg');
      }).not.toThrow();
    });
  });

  describe('Integration Scenario', () => {
    it('should handle complete pipeline scenario without errors', () => {
      expect(() => {
        // Simulate a complete pipeline execution
        recordPipelineStart('MEDIUM', 'direct_execution');
        recordQueueOperation('submit', 'success');
        recordPipelineCompletion('MEDIUM', 'direct_execution', 'success', 5000, 1500);
        recordComplianceCheck('passed', 'mas.gov.sg');
      }).not.toThrow();
    });

    it('should handle failure scenario without errors', () => {
      expect(() => {
        // Simulate a pipeline failure scenario
        recordPipelineStart('HEAVY', 'queue_first');
        recordQueueOperation('submit', 'failure');
        recordBudgetViolation('HEAVY', 'generator', 'tokens');
        recordComplianceCheck('failed', 'untrusted.com');
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid input gracefully', () => {
      expect(() => {
        recordPipelineStart('', '');
        recordPipelineCompletion('', '', '', 0, 0);
        recordQueueOperation('', '');
        recordBudgetViolation('', '', '');
        recordComplianceCheck('', '');
      }).not.toThrow();
    });

    it('should handle multiple concurrent recordings', () => {
      expect(() => {
        // Multiple recordings at once
        for (let i = 0; i < 10; i++) {
          recordPipelineStart('MEDIUM', 'direct_execution');
          recordPipelineCompletion('MEDIUM', 'direct_execution', 'success', 1000, 300);
          recordQueueOperation('submit', 'success');
          recordComplianceCheck('passed', 'mas.gov.sg');
        }
      }).not.toThrow();
    });
  });
});