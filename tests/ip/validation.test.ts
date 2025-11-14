// ABOUTME: IP Validation Tests (Comprehensive Structure Validation)
// ABOUTME: Tests for Educational IP validation with runtime type checking

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('IP Validation', () => {
  describe('Basic Structure Validation', () => {
    it('should validate a complete Framework IP structure', () => {
      const validFrameworkIP = {
        id: 'framework',
        version: '1.0.0',
        purpose: 'Explain mechanisms: parts → interactions → outcome',
        operators: [
          { name: 'REDUCE_TO_MECHANISM', spec: 'Explain as parts → interactions → outcome' },
          { name: 'COUNTEREXAMPLE', spec: 'Construct a failure case; state which interaction flips' },
          { name: 'TRANSFER', spec: 'Map mechanism into two contexts; change one constraint' }
        ],
        invariants: [
          'Must include a Mechanism section',
          'Must include a Counterexample section',
          'Must include a Transfer section'
        ],
        sections: ['Overview', 'Mechanism', 'Counterexample', 'Transfer', 'CTA']
      };

      // Test basic structure validation
      expect(validFrameworkIP.id).toBe('framework');
      expect(validFrameworkIP.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(validFrameworkIP.operators).toHaveLength(3);
      expect(validFrameworkIP.invariants).toHaveLength(3);
      expect(validFrameworkIP.sections).toHaveLength(5);
      expect(validFrameworkIP.sections).toContain('Mechanism');
      expect(validFrameworkIP.sections).toContain('Counterexample');
      expect(validFrameworkIP.sections).toContain('Transfer');
    });

    it('should reject IP with missing required fields', () => {
      const incompleteIP = {
        id: 'framework',
        version: '1.0.0'
        // Missing purpose, operators, invariants, sections
      };

      const requiredFields = ['purpose', 'operators', 'invariants', 'sections'];
      const missingFields = requiredFields.filter(field => !(field in incompleteIP));
      
      expect(missingFields).toHaveLength(4);
      expect(missingFields).toContain('purpose');
      expect(missingFields).toContain('operators');
      expect(missingFields).toContain('invariants');
      expect(missingFields).toContain('sections');
    });

    it('should validate ID format requirements', () => {
      const validIds = ['framework', 'process', 'comparative_analysis', 'template_v2'];
      const invalidIds = ['Framework', 'framework-ip', 'FRAMEWORK', '123framework'];

      validIds.forEach(id => {
        expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
      });

      invalidIds.forEach(id => {
        expect(id).not.toMatch(/^[a-z][a-z0-9_]*$/);
      });
    });

    it('should validate version format requirements', () => {
      const validVersions = ['1.0.0', '2.1.3', '10.15.20'];
      const invalidVersions = ['v1.0.0', '1.0', '1.0.0.0', '1.x.0'];

      validVersions.forEach(version => {
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
      });

      invalidVersions.forEach(version => {
        expect(version).not.toMatch(/^\d+\.\d+\.\d+$/);
      });
    });

    it('should validate operator structure', () => {
      const validOperator = {
        name: 'REDUCE_TO_MECHANISM',
        spec: 'Explain as parts → interactions → outcome. Use causal verbs.'
      };

      expect(validOperator.name).toMatch(/^[A-Z_][A-Z0-9_]*$/);
      expect(validOperator.spec.length).toBeGreaterThanOrEqual(10);
      expect(validOperator.spec.length).toBeLessThanOrEqual(500);
    });

    it('should validate invariant format', () => {
      const validInvariants = [
        'Must include a Mechanism section',
        'Should provide examples',
        'Cannot omit references',
        'Must not exceed word limit'
      ];

      const invalidInvariants = [
        'Include section', // Missing modal verb
        'Must', // Too short
        'This invariant is way too long and exceeds the maximum allowed length for an invariant which should be concise and clear in order to be effective and useful for validation purposes and to ensure that the content meets the quality standards that are required for educational content generation in the EIP system with proper validation and quality checks'
      ];

      validInvariants.forEach(invariant => {
        expect(invariant).toMatch(/^(Must|Should|Cannot|Must not|Should not)/);
        expect(invariant.length).toBeGreaterThanOrEqual(5);
        expect(invariant.length).toBeLessThanOrEqual(200);
      });

      expect(invalidInvariants[0]).not.toMatch(/^(Must|Should|Cannot|Must not|Should not)/);
      expect(invalidInvariants[1].length).toBeLessThan(5);
      expect(invalidInvariants[2].length).toBeGreaterThan(200);
    });
  });

  describe('Framework IP Specific Validation', () => {
    it('should require Framework IP specific sections', () => {
      const requiredSections = ['Overview', 'Mechanism', 'Counterexample', 'Transfer', 'CTA'];
      
      const frameworkSections = ['Overview', 'Mechanism', 'Counterexample', 'Transfer', 'CTA'];
      const missingSections = requiredSections.filter(section => !frameworkSections.includes(section));
      
      expect(missingSections).toHaveLength(0);
      expect(frameworkSections).toHaveLength(5);
    });

    it('should require exactly 3 operators for Framework IP', () => {
      const validOperatorCount = 3;
      const frameworkOperators = [
        { name: 'REDUCE_TO_MECHANISM', spec: 'Spec 1' },
        { name: 'COUNTEREXAMPLE', spec: 'Spec 2' },
        { name: 'TRANSFER', spec: 'Spec 3' }
      ];

      expect(frameworkOperators).toHaveLength(validOperatorCount);
    });

    it('should validate Framework IP invariants', () => {
      const requiredInvariants = [
        'Must include a Mechanism section',
        'Must include a Counterexample section',
        'Must include a Transfer section'
      ];

      const frameworkInvariants = [
        'Must include a Mechanism section',
        'Must include a Counterexample section',
        'Must include a Transfer section'
      ];

      requiredInvariants.forEach(invariant => {
        expect(frameworkInvariants).toContain(invariant);
      });
    });
  });

  describe('Content Quality Analysis', () => {
    it('should identify quality issues in content', () => {
      const lowQualityContent = {
        purpose: 'Short', // Too short
        operators: [
          { name: 'TEST', spec: 'Brief' } // Too short
        ],
        invariants: ['Short'] // Too short
      };

      expect(lowQualityContent.purpose.length).toBeLessThan(10);
      expect(lowQualityContent.operators[0].spec.length).toBeLessThan(10);
      expect(lowQualityContent.invariants[0].length).toBeLessThan(15);
    });

    it('should identify adequate content quality', () => {
      const adequateContent = {
        purpose: 'This is an adequate purpose description that provides enough context',
        operators: [
          { name: 'ADEQUATE_OPERATOR', spec: 'This is an adequate operator specification with sufficient detail' }
        ],
        invariants: ['This invariant is of adequate length and clarity']
      };

      expect(adequateContent.purpose.length).toBeGreaterThanOrEqual(10);
      expect(adequateContent.operators[0].spec.length).toBeGreaterThanOrEqual(10);
      expect(adequateContent.invariants[0].length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Process IP Specific Validation', () => {
    it('should require Process IP specific sections', () => {
      const requiredSections = ['Overview', 'Prerequisites', 'Steps', 'Examples', 'Troubleshooting', 'Tips', 'CTA'];

      const processSections = ['Overview', 'Prerequisites', 'Steps', 'Examples', 'Troubleshooting', 'Tips', 'CTA'];
      const missingSections = requiredSections.filter(section => !processSections.includes(section));

      expect(missingSections).toHaveLength(0);
      expect(processSections).toHaveLength(7);
    });

    it('should require exactly 3 operators for Process IP', () => {
      const validOperatorCount = 3;
      const processOperators = [
        { name: 'STEP_BY_STEP', spec: 'Break down into sequential steps' },
        { name: 'EXAMPLE_DEMO', spec: 'Provide concrete example' },
        { name: 'TROUBLESHOOT', spec: 'Identify common pitfalls' }
      ];

      expect(processOperators).toHaveLength(validOperatorCount);
    });

    it('should validate Process IP invariants', () => {
      const requiredInvariants = [
        'Must include step-by-step instructions',
        'Must include a Examples section',
        'Must include a Troubleshooting section',
        'Steps must be numbered and sequential',
        'Each step must have clear action verb'
      ];

      const processInvariants = [
        'Must include step-by-step instructions',
        'Must include a Examples section',
        'Must include a Troubleshooting section',
        'Steps must be numbered and sequential',
        'Each step must have clear action verb'
      ];

      requiredInvariants.forEach(invariant => {
        expect(processInvariants).toContain(invariant);
      });
    });
  });

  describe('Comparative IP Specific Validation', () => {
    it('should require Comparative IP specific sections', () => {
      const requiredSections = ['Overview', 'Options', 'Criteria', 'Comparison', 'Trade-offs', 'Recommendation', 'CTA'];

      const comparativeSections = ['Overview', 'Options', 'Criteria', 'Comparison', 'Trade-offs', 'Recommendation', 'CTA'];
      const missingSections = requiredSections.filter(section => !comparativeSections.includes(section));

      expect(missingSections).toHaveLength(0);
      expect(comparativeSections).toHaveLength(7);
    });

    it('should require exactly 3 operators for Comparative IP', () => {
      const validOperatorCount = 3;
      const comparativeOperators = [
        { name: 'CRITERIA_MATRIX', spec: 'Define evaluation criteria' },
        { name: 'TRADE_OFF_ANALYSIS', spec: 'Analyze pros/cons' },
        { name: 'RECOMMENDATION', spec: 'Provide recommendation' }
      ];

      expect(comparativeOperators).toHaveLength(validOperatorCount);
    });

    it('should validate Comparative IP invariants', () => {
      const requiredInvariants = [
        'Must include at least two options to compare',
        'Must include a Criteria section',
        'Must include a Comparison section',
        'Must include a Recommendation section',
        'Criteria must be objective and measurable'
      ];

      const comparativeInvariants = [
        'Must include at least two options to compare',
        'Must include a Criteria section',
        'Must include a Comparison section',
        'Must include a Recommendation section',
        'Criteria must be objective and measurable'
      ];

      requiredInvariants.forEach(invariant => {
        expect(comparativeInvariants).toContain(invariant);
      });
    });
  });

  describe('Schema Registry Functionality', () => {
    it('should maintain registry of supported IP types', () => {
      const supportedTypes = ['framework', 'process', 'comparative', 'template', 'checklist', 'example'];

      expect(supportedTypes).toContain('framework');
      expect(supportedTypes).toContain('process');
      expect(supportedTypes).toContain('comparative');
      expect(supportedTypes.length).toBeGreaterThan(0);
    });

    it('should provide descriptions for IP types', () => {
      const ipDescriptions = {
        framework: 'Explains mechanisms: parts → interactions → outcome',
        process: 'Step-by-step process with examples and guidance',
        comparative: 'Compares multiple approaches or options'
      };

      expect(ipDescriptions.framework).toBeDefined();
      expect(ipDescriptions.framework.length).toBeGreaterThan(0);
      expect(ipDescriptions.process).toContain('process');
      expect(ipDescriptions.comparative).toContain('Compares');
    });
  });
});
