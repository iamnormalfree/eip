// ABOUTME: IP routing logic testing for EIP Steel Thread
// ABOUTME: Validates intelligent IP selection, routing decisions, and integration contracts
// ABOUTME: Integration-First Testing - Tests real implementations, not mocks

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { routeToIP, routeIP, getIPMetadata, validateIP, getIPInvariants } from '../../orchestrator/router';

describe('IP Routing System - Real Implementation Tests', () => {
  describe('Real routeToIP Implementation', () => {
    it('should select framework IP for strategic planning queries using real implementation', async () => {
      const query = {
        query: 'strategic framework for business expansion',
        persona: 'professional',
        funnel: 'mofu',
        intent: 'planning_guidance',
        entities: ['strategic', 'framework', 'business']
      };

      // Test REAL implementation, not mocked version
      const result = await routeToIP(query);

      expect(result).toBeDefined();
      expect(result.selected_ip).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.invariants).toBeDefined();
      
      // Should select framework for strategic planning
      expect(result.selected_ip).toContain('framework');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasoning.primary_indicators.length).toBeGreaterThan(0);
      
      // Framework invariants should be present
      expect(result.invariants).toContain('has_overview');
      expect(result.invariants).toContain('has_mechanism');
      expect(result.invariants).toContain('has_examples');
    });

    it('should select process IP for step-by-step procedures using real implementation', async () => {
      const query = {
        query: 'step by step process for loan application',
        persona: 'decision_maker',
        funnel: 'bofu',
        intent: 'procedural_guidance',
        entities: ['step', 'process', 'loan', 'application']
      };

      // Test REAL implementation
      const result = await routeToIP(query);

      expect(result.selected_ip).toBeDefined();
      // Router correctly uses funnel+persona combination for better precision
      expect(result.reasoning.primary_indicators).toContain('funnel+persona: bofu+decision_maker');

      // Should select process for step-by-step procedures
      expect(result.selected_ip).toContain('process');
      expect(result.confidence).toBeGreaterThan(0.8); // Higher confidence due to persona+funnel match
      
      // Process invariants should be present
      expect(result.invariants).toContain('has_steps');
      expect(result.invariants).toContain('has_timeline');
      expect(result.invariants).toContain('has_requirements');
    });

    it('should select comparative IP for option comparison using real implementation', async () => {
      const query = {
        query: 'compare bank loans vs HDB loans',
        persona: 'researcher',
        funnel: 'tofu',
        intent: 'comparison_analysis',
        entities: ['compare', 'bank', 'hdb', 'loans']
      };

      // Test REAL implementation
      const result = await routeToIP(query);

      expect(result.selected_ip).toBeDefined();
      // Router correctly uses funnel+persona combination for better precision
      expect(result.reasoning.primary_indicators).toContain('funnel+persona: tofu+researcher');

      // Should select comparative for comparison queries
      expect(result.selected_ip).toContain('comparative');
      expect(result.confidence).toBeGreaterThan(0.8); // Higher confidence due to persona+funnel match
      
      // Comparative invariants should be present
      expect(result.invariants).toContain('has_options');
      expect(result.invariants).toContain('has_criteria');
      expect(result.invariants).toContain('has_recommendation');
    });

    it('should handle entity-based routing with real implementation', async () => {
      const query = {
        query: 'framework comparison',
        entities: ['compare', 'framework'],
        intent: 'comparison_analysis'
      };

      const result = await routeToIP(query);

      expect(result.selected_ip).toBeDefined();
      expect(result.reasoning.entities).toEqual(['compare', 'framework']);
      
      // Should detect comparison intent from entities
      if (result.reasoning.primary_indicators.includes('entity_comparison_match')) {
        expect(result.selected_ip).toContain('comparative');
      }
    });

    it('should provide alternatives with lower confidence', async () => {
      const query = {
        query: 'planning framework',
        persona: 'professional',
        funnel: 'mofu'
      };

      const result = await routeToIP(query);

      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
      
      if (result.alternatives.length > 0) {
        // Alternatives should be different from primary selection
        result.alternatives.forEach(alt => {
          expect(alt).not.toBe(result.selected_ip);
        });
      }
    });

    it('should prioritize IM v2 framework for explicit internal-methodology intent', async () => {
      const result = await routeToIP({
        query: 'internal methodology for sprint planning and team operating system',
        persona: 'professional',
        funnel: 'mofu'
      });

      expect(result.selected_ip).toBe('imv2_framework@1.0.0');
      expect(result.reasoning.primary_indicators).toContain('imv2_intent_match');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should prioritize IM v2 loop debug for explicit debugging intent', async () => {
      const result = await routeToIP({
        query: 'loop debug root cause and troubleshooting steps',
        persona: 'practitioner',
        funnel: 'bottom'
      });

      expect(result.selected_ip).toBe('imv2_loop_debug@1.0.0');
      expect(result.reasoning.primary_indicators).toContain('imv2_intent_match');
    });
  });

  describe('Legacy routeIP Function Tests', () => {
    it('should maintain backward compatibility with routeIP function', () => {
      const query = {
        query: 'strategic framework',
        persona: 'professional',
        funnel: 'mofu'
      };

      // Legacy function should still work
      const result = routeIP(query);

      expect(typeof result).toBe('string');
      expect(result).toContain('@');
      expect(result).toContain('framework');
    });

    it('should handle persona + funnel combination with routeIP', () => {
      const query = {
        query: 'step by step process',
        persona: 'decision_maker',
        funnel: 'bofu'
      };

      const result = routeIP(query);

      expect(typeof result).toBe('string');
      expect(result).toContain('process');
    });
  });

  describe('IP Metadata and Validation', () => {
    it('should return complete IP metadata for valid IPs', () => {
      const metadata = getIPMetadata('framework@1.0.0');

      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('framework@1.0.0');
      expect(metadata?.name).toBe('Framework IP');
      expect(metadata?.funnels).toContain('mofu');
      expect(metadata?.personas).toContain('learner');
      expect(metadata?.keywords).toContain('framework');
      expect(metadata?.invariants).toContain('has_overview');
      expect(metadata?.invariants).toContain('has_mechanism');
      expect(metadata?.invariants).toContain('has_examples');
      expect(metadata?.complexity_score).toBeGreaterThan(0);
      expect(Array.isArray(metadata?.use_cases)).toBe(true);
    });

    it('should return null for invalid IP metadata', () => {
      const metadata = getIPMetadata('nonexistent@1.0.0');
      expect(metadata).toBeNull();
    });

    it('should validate IP existence correctly', () => {
      expect(validateIP('framework@1.0.0')).toBe(true);
      expect(validateIP('process@1.0.0')).toBe(true);
      expect(validateIP('comparative@1.0.0')).toBe(true);
      expect(validateIP('nonexistent@1.0.0')).toBe(false);
    });

    it('should return IP invariants for compliance checking', () => {
      const frameworkInvariants = getIPInvariants('framework@1.0.0');
      expect(frameworkInvariants).toContain('has_overview');
      expect(frameworkInvariants).toContain('has_mechanism');
      expect(frameworkInvariants).toContain('has_examples');

      const processInvariants = getIPInvariants('process@1.0.0');
      expect(processInvariants).toContain('has_steps');
      expect(processInvariants).toContain('has_timeline');
      expect(processInvariants).toContain('has_requirements');
    });

    it('should handle invariants for unknown IP gracefully', () => {
      const invariants = getIPInvariants('unknown@1.0.0');
      expect(invariants).toEqual([]);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or null queries gracefully', async () => {
      const emptyQuery = {
        query: '',
        persona: '',
        funnel: ''
      };

      const result = await routeToIP(emptyQuery);

      expect(result).toBeDefined();
      expect(result.selected_ip).toBeDefined(); // Should fallback to default
      expect(result.selected_ip).toBe('framework@1.0.0'); // Default fallback
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing query object gracefully', async () => {
      const result = await routeToIP({});

      expect(result).toBeDefined();
      expect(result.selected_ip).toBeDefined();
      expect(result.selected_ip).toBe('framework@1.0.0'); // Default fallback
    });

    it('should handle null/undefined inputs', async () => {
      // @ts-ignore - Testing runtime behavior
      const result = await routeToIP(null);

      expect(result).toBeDefined();
      expect(result.selected_ip).toBeDefined();
      expect(result.selected_ip).toBe('framework@1.0.0');
    });
  });

  describe('Integration Contract Compliance', () => {
    it('should satisfy router smoke test contract', async () => {
      const testCases = [
        {
          name: 'Framework selection',
          input: { query: 'strategic framework', persona: 'professional', funnel: 'mofu' },
          expectedIP: 'framework@1.0.0',
          minConfidence: 0.7
        },
        {
          name: 'Process selection',
          input: { query: 'step by step process', persona: 'decision_maker', funnel: 'bofu' },
          expectedIP: 'process@1.0.0',
          minConfidence: 0.7
        },
        {
          name: 'Comparative selection',
          input: { query: 'compare options', persona: 'researcher', funnel: 'tofu' },
          expectedIP: 'comparative@1.0.0',
          minConfidence: 0.6
        }
      ];

      for (const testCase of testCases) {
        const result = await routeToIP(testCase.input);
        
        expect(result.selected_ip).toContain(testCase.expectedIP.split('@')[0]);
        expect(result.confidence).toBeGreaterThanOrEqual(testCase.minConfidence);
        expect(result.reasoning).toBeDefined();
        expect(result.invariants).toBeDefined();
        expect(Array.isArray(result.alternatives)).toBe(true);
      }
    });

    it('should provide comprehensive routing information', async () => {
      const query = {
        query: 'comprehensive strategic planning framework',
        persona: 'professional',
        funnel: 'mofu',
        intent: 'planning_guidance'
      };

      const result = await routeToIP(query);

      // Verify all required fields are present
      expect(result).toHaveProperty('selected_ip');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('alternatives');
      expect(result).toHaveProperty('invariants');

      // Verify reasoning structure
      expect(result.reasoning).toHaveProperty('primary_indicators');
      expect(result.reasoning).toHaveProperty('complexity_match');
      expect(result.reasoning).toHaveProperty('scenario_fit');

      // Verify invariants structure
      expect(Array.isArray(result.invariants)).toBe(true);
      expect(result.invariants.length).toBeGreaterThan(0);
    });

    it('should maintain performance standards', async () => {
      const query = {
        query: 'strategic planning framework',
        persona: 'professional',
        funnel: 'mofu'
      };

      const startTime = Date.now();
      const result = await routeToIP(query);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(result).toBeDefined();
      expect(result.selected_ip).toBeDefined();
    });
  });
});
