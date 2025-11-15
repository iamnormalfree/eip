// ABOUTME: Comprehensive Router Stability Testing for EIP Orchestrator
// ABOUTME: Validates router stability, edge cases, performance, and robustness under stress

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  routeToIP,
  routeIP,
  getIPMetadata,
  validateIP,
  getIPInvariants,
  getRouterMetadata,
  ROUTER_VERSION,
  ROUTER_LAST_UPDATED
} from '../../orchestrator/router';

describe('Router Comprehensive Stability Tests', () => {
  describe('Input Validation and Edge Cases', () => {
    it('should handle completely empty inputs', async () => {
      const result = await routeToIP({});

      expect(result.selected_ip).toBe('framework@1.0.0'); // Default fallback
      expect(result.confidence).toBe(0.5);
      expect(result.reasoning.primary_indicators).toEqual([]);
      expect(result.alternatives).toEqual([]);
    });

    it('should handle null and undefined properties', async () => {
      const result1 = await routeToIP({ funnel: null, persona: undefined, brief: null });
      const result2 = await routeToIP({ funnel: undefined, persona: null, brief: undefined });

      expect(result1.selected_ip).toBe('framework@1.0.0');
      expect(result2.selected_ip).toBe('framework@1.0.0');
      expect(result1.confidence).toBe(0.5);
      expect(result2.confidence).toBe(0.5);
    });

    it('should handle malformed string inputs', async () => {
      const inputs = [
        { funnel: '   ', persona: '\t\n', brief: '  \r\n  ' },
        { funnel: 'INVALID', persona: 'PERSONA', brief: 'BRIEF' },
        { funnel: '123', persona: '456', brief: '789' },
        { funnel: 'mixedCASE', persona: 'CamelCase', brief: 'snake_case' }
      ];

      for (const input of inputs) {
        const result = await routeToIP(input);
        expect(result.selected_ip).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.selected_ip).toMatch(/@1\.0\.0$/); // Should be a valid IP version
      }
    });

    it('should handle extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const result = await routeToIP({ brief: longString });

      expect(result.selected_ip).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle special characters in inputs', async () => {
      const specialInputs = [
        { brief: 'test@example.com and https://example.com' },
        { brief: '🚀 emoji content 🎯 target 📊 metrics' },
        { brief: 'html <tag>content</tag> and &amp; entities' },
        { brief: 'unicode: ñáéíóú 中文 العربية русский' }
      ];

      for (const input of specialInputs) {
        const result = await routeToIP(input);
        expect(result.selected_ip).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });
  });

  describe('Deterministic Routing Behavior', () => {
    it('should produce consistent results for identical inputs', async () => {
      const input = {
        funnel: 'mofu',
        persona: 'professional',
        brief: 'strategic planning framework'
      };

      const results = await Promise.all([
        routeToIP(input),
        routeToIP(input),
        routeToIP(input),
        routeToIP(input),
        routeToIP(input)
      ]);

      // All results should be identical
      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i].selected_ip).toBe(first.selected_ip);
        expect(results[i].confidence).toBe(first.confidence);
        expect(results[i].reasoning).toEqual(first.reasoning);
        expect(results[i].alternatives).toEqual(first.alternatives);
        expect(results[i].invariants).toEqual(first.invariants);
      }
    });

    it('should handle case-insensitive routing', async () => {
      const inputs = [
        { funnel: 'MOFU', persona: 'PROFESSIONAL' },
        { funnel: 'mofu', persona: 'professional' },
        { funnel: 'MoFu', persona: 'Professional' },
        { funnel: 'mOfU', persona: 'pRoFeSsIoNaL' }
      ];

      const results = await Promise.all(inputs.map(input => routeToIP(input)));

      // All should produce the same result
      const selectedIPs = results.map(r => r.selected_ip);
      expect(selectedIPs.every(ip => ip === selectedIPs[0])).toBe(true);
    });

    it('should maintain routing order consistency', async () => {
      // Test that router maintains consistent priority order
      const input = { funnel: 'mofu', persona: 'learner', brief: 'explain framework' };

      const result = await routeToIP(input);

      // Should prefer framework IP due to funnel+persona match over keyword match
      expect(result.selected_ip).toContain('framework');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle rapid sequential routing', async () => {
      const input = { funnel: 'bofu', persona: 'decision_maker', brief: 'process workflow' };
      const iterations = 100;

      const startTime = performance.now();
      const results = [];

      for (let i = 0; i < iterations; i++) {
        results.push(await routeToIP(input));
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(10); // Should be under 10ms per request
      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second

      // All results should be identical
      const firstResult = results[0];
      expect(results.every(r => r.selected_ip === firstResult.selected_ip)).toBe(true);
    });

    it('should handle concurrent routing requests', async () => {
      const inputs = [
        { funnel: 'mofu', persona: 'professional', brief: 'strategic planning' },
        { funnel: 'bofu', persona: 'decision_maker', brief: 'process workflow' },
        { funnel: 'tofu', persona: 'researcher', brief: 'comparison analysis' },
        { funnel: 'mofu', persona: 'learner', brief: 'explain concept' }
      ];

      const startTime = performance.now();

      // Run multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const input = inputs[i % inputs.length];
        promises.push(routeToIP(input));
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
      expect(results.length).toBe(50);

      // Each result should be valid
      results.forEach(result => {
        expect(result.selected_ip).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.invariants).toBeDefined();
      });
    });

    it('should maintain memory efficiency', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Run many routing operations
      for (let i = 0; i < 1000; i++) {
        await routeToIP({
          funnel: ['mofu', 'bofu', 'tofu'][i % 3],
          persona: ['professional', 'decision_maker', 'researcher', 'learner'][i % 4],
          brief: `test routing iteration ${i} with content and keywords`
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Router Metadata and Versioning', () => {
    it('should provide comprehensive router metadata', () => {
      const metadata = getRouterMetadata();

      expect(metadata.version).toBe(ROUTER_VERSION);
      expect(metadata.last_updated).toBe(ROUTER_LAST_UPDATED);
      expect(metadata.available_ips).toContain('framework@1.0.0');
      expect(metadata.available_ips).toContain('process@1.0.0');
      expect(metadata.available_ips).toContain('comparative@1.0.0');
      expect(metadata.ip_count).toBeGreaterThan(0);
      expect(Array.isArray(metadata.supported_funnels)).toBe(true);
      expect(Array.isArray(metadata.supported_personas)).toBe(true);
    });

    it('should include all expected funnel types', () => {
      const metadata = getRouterMetadata();

      // Should include standard funnel types
      expect(metadata.supported_funnels).toContain('mofu');
      expect(metadata.supported_funnels).toContain('bofu');
      expect(metadata.supported_funnels).toContain('tofu');
      expect(metadata.supported_funnels).toContain('mid');
      expect(metadata.supported_funnels).toContain('top');
      expect(metadata.supported_funnels).toContain('bottom');
    });

    it('should include all expected persona types', () => {
      const metadata = getRouterMetadata();

      // Should include standard persona types
      expect(metadata.supported_personas).toContain('professional');
      expect(metadata.supported_personas).toContain('decision_maker');
      expect(metadata.supported_personas).toContain('researcher');
      expect(metadata.supported_personas).toContain('learner');
    });
  });

  describe('Fallback and Error Recovery', () => {
    it('should always return a valid IP even for invalid inputs', async () => {
      const invalidInputs = [
        { funnel: 'nonexistent', persona: 'invalid', brief: 'test' },
        { funnel: '', persona: '', brief: '' },
        { funnel: null, persona: null, brief: null },
        { funnel: undefined, persona: undefined, brief: undefined }
      ];

      for (const input of invalidInputs) {
        const result = await routeToIP(input);
        expect(result.selected_ip).toMatch(/@1\.0\.0$/); // Should always be a valid IP
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.invariants).toBeDefined();
        expect(Array.isArray(result.invariants)).toBe(true);
      }
    });

    it('should handle partial inputs gracefully', async () => {
      const partialInputs = [
        { funnel: 'mofu' }, // Only funnel
        { persona: 'professional' }, // Only persona
        { brief: 'framework explanation' }, // Only brief
        { funnel: 'mofu', persona: 'professional' }, // No brief
        { funnel: 'mofu', brief: 'framework' }, // No persona
        { persona: 'professional', brief: 'framework' } // No funnel
      ];

      for (const input of partialInputs) {
        const result = await routeToIP(input);
        expect(result.selected_ip).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.selected_ip).toMatch(/@1\.0\.0$/);
      }
    });

    it('should maintain fallback behavior under stress', async () => {
      // Test many edge cases rapidly
      const edgeCases = [
        { funnel: '', persona: '', brief: '' },
        { funnel: 'invalid', persona: 'invalid', brief: 'invalid' },
        { funnel: 'mofu', persona: 'invalid', brief: '' },
        { funnel: '', persona: 'professional', brief: 'test' },
        { funnel: 'mixedCASE', persona: 'MixedCase', brief: '' }
      ];

      const results = await Promise.all(edgeCases.map(input => routeToIP(input)));

      // All should have valid results
      results.forEach(result => {
        expect(result.selected_ip).toMatch(/@1\.0\.0$/);
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.invariants).toBeDefined();
      });
    });
  });

  describe('IP Metadata Validation', () => {
    it('should validate all registered IPs have complete metadata', () => {
      const metadata = getRouterMetadata();

      for (const ipId of metadata.available_ips) {
        expect(validateIP(ipId)).toBe(true);

        const ipMetadata = getIPMetadata(ipId);
        expect(ipMetadata).not.toBeNull();
        expect(ipMetadata.id).toBe(ipId);
        expect(ipMetadata.name).toBeDefined();
        expect(Array.isArray(ipMetadata.funnels)).toBe(true);
        expect(Array.isArray(ipMetadata.personas)).toBe(true);
        expect(Array.isArray(ipMetadata.keywords)).toBe(true);
        expect(Array.isArray(ipMetadata.invariants)).toBe(true);
        expect(ipMetadata.complexity_score).toBeGreaterThanOrEqual(0);
        expect(ipMetadata.complexity_score).toBeLessThanOrEqual(1);
      }
    });

    it('should return null for invalid IPs', () => {
      const invalidIPs = [
        'invalid@1.0.0',
        'nonexistent@1.0.0',
        'framework@2.0.0',
        'framework',
        '',
        null,
        undefined
      ];

      for (const ipId of invalidIPs) {
        expect(validateIP(ipId)).toBe(false);
        expect(getIPMetadata(ipId)).toBeNull();
        expect(getIPInvariants(ipId)).toEqual([]);
      }
    });

    it('should provide consistent invariants across all IPs', () => {
      const metadata = getRouterMetadata();

      for (const ipId of metadata.available_ips) {
        const invariants = getIPInvariants(ipId);
        expect(Array.isArray(invariants)).toBe(true);
        expect(invariants.length).toBeGreaterThan(0);

        // All invariants should be strings
        invariants.forEach(invariant => {
          expect(typeof invariant).toBe('string');
          expect(invariant.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Integration with Legacy Functions', () => {
    it('should maintain backward compatibility with routeIP', async () => {
      const input = { funnel: 'mofu', persona: 'professional', brief: 'framework' };

      // Test both functions with same input
      const detailedResult = await routeToIP(input);
      const simpleResult = routeIP(input);

      // Simple result should match detailed result's selected IP
      expect(simpleResult).toBe(detailedResult.selected_ip);
      expect(simpleResult).toMatch(/@1\.0\.0$/);
    });

    it('should handle edge cases consistently across both APIs', async () => {
      const edgeCases = [
        {},
        { funnel: null, persona: null, brief: null },
        { funnel: '', persona: '', brief: '' }
      ];

      for (const input of edgeCases) {
        const detailedResult = await routeToIP(input);
        const simpleResult = routeIP(input);

        expect(simpleResult).toBe(detailedResult.selected_ip);
        expect(simpleResult).toMatch(/@1\.0\.0$/);
        expect(detailedResult.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });
  });

  describe('Router Behavior Under Load', () => {
    it('should handle mixed valid and invalid inputs efficiently', async () => {
      const inputs = [];
      const validCount = 500;
      const invalidCount = 500;

      // Generate mixed inputs
      for (let i = 0; i < validCount; i++) {
        inputs.push({
          funnel: ['mofu', 'bofu', 'tofu'][i % 3],
          persona: ['professional', 'decision_maker', 'researcher'][i % 3],
          brief: `valid test content ${i} with keywords`
        });
      }

      for (let i = 0; i < invalidCount; i++) {
        inputs.push({
          funnel: ['invalid', '', null, undefined][i % 4],
          persona: ['invalid', '', null, undefined][i % 4],
          brief: ['invalid', '', null, undefined][i % 4]
        });
      }

      // Shuffle inputs
      inputs.sort(() => Math.random() - 0.5);

      const startTime = performance.now();
      const results = await Promise.all(inputs.map(input => routeToIP(input)));
      const endTime = performance.now();

      // Performance check
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds

      // All results should be valid
      results.forEach(result => {
        expect(result.selected_ip).toMatch(/@1\.0\.0$/);
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.invariants).toBeDefined();
      });

      // Should have processed all inputs
      expect(results.length).toBe(validCount + invalidCount);
    });
  });
});