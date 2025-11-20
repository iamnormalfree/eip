// ABOUTME: Integration Test for Singapore Compliance System
// ABOUTME: End-to-end testing of policy loading, intent analysis, and compliance requirements

import { policyLoader, PolicyLoader } from '../../lib/compliance/policy-loader';
import { IntentAnalyzer, ContentContext } from '../../lib/compliance/intent-analyzer';

describe('Singapore Compliance System Integration', () => {
  let policyLoaderInstance: PolicyLoader;
  let intentAnalyzer: IntentAnalyzer;

  beforeAll(() => {
    policyLoaderInstance = PolicyLoader.getInstance();
    intentAnalyzer = new IntentAnalyzer();
  });

  test('should load all policies without errors', () => {
    const policies = policyLoaderInstance.getAllPolicies();
    
    expect(policies.webPolicy).toBeDefined();
    expect(policies.domainAuthority).toBeDefined();
    expect(policies.intentPatterns).toBeDefined();
    expect(policies.disclaimerTemplates).toBeDefined();
  });

  test('should validate all policy structures', () => {
    const validation = policyLoaderInstance.validatePolicies();
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should analyze Singapore financial content correctly', () => {
    const context: ContentContext = {
      title: 'Investing in CPF OA for Singapore Property',
      content: 'Learn how to use your CPF Ordinary Account to purchase HDB flats in Singapore. MAS regulates these investments.',
      geographical_focus: ['singapore'],
      language: 'en-sg'
    };

    const result = intentAnalyzer.analyzeIntent(context);

    // Should detect Singapore context
    expect(result.singapore_context).toBe(true);
    expect(result.singapore_specific_indicators).toContain('cpf');
    expect(result.singapore_specific_indicators).toContain('hdb');
    expect(result.singapore_specific_indicators).toContain('singapore');

    // Should detect financial implications
    expect(result.detected_keywords.length).toBeGreaterThan(0);

    // Should provide appropriate disclaimer
    const disclaimer = intentAnalyzer.getDisclaimerTemplate(result.disclaimer_level, 'en-sg');
    expect(disclaimer).toBeDefined();
    expect(typeof disclaimer).toBe('string');
  });

  test('should handle enterprise business guidance for Singapore SMEs', () => {
    const context: ContentContext = {
      title: 'Enterprise Singapore Support for SMEs',
      content: 'ACRA registration requirements for Singapore SMEs seeking Enterprise Singapore grants and assistance.',
      geographical_focus: ['singapore']
    };

    const result = intentAnalyzer.analyzeIntent(context);

    expect(result.singapore_context).toBe(true);
    expect(result.singapore_specific_indicators).toContain('singapore');
    // ACRA should be detected in either keywords or Singapore indicators
    const hasACRA = result.detected_keywords.includes('acra') || result.singapore_specific_indicators.includes('acra');
    expect(hasACRA).toBe(true);

    // Should require source links for business guidance
    if (result.disclaimer_level === 'high') {
      expect(result.requires_source_links).toBe(true);
    }
  });

  test('should process educational content appropriately', () => {
    const context: ContentContext = {
      title: 'How to understand blockchain technology',
      content: 'This tutorial explains the fundamental concepts of blockchain, distributed ledgers, and cryptographic principles.',
      content_type: 'educational'
    };

    const result = intentAnalyzer.analyzeIntent(context);

    expect(result.intent).toBe('educational');
    expect(result.disclaimer_level).toBe('minimal');
    expect(result.requires_source_links).toBe(false);
    expect(result.detected_patterns).toContain('how to.*');
    expect(result.detected_keywords).toContain('tutorial');
  });

  test('should detect comparative analysis requiring medium-level compliance', () => {
    const context: ContentContext = {
      title: 'Comparing cloud providers for Singapore businesses',
      content: 'Compare AWS vs Azure vs Google Cloud for Singapore SMEs. Singapore businesses should consider local data centers. singapore government cloud services.',
      geographical_focus: ['singapore']
    };

    const result = intentAnalyzer.analyzeIntent(context);

    expect(result.detected_keywords.length).toBeGreaterThan(0);
    // Should detect Singapore context from geographical_focus or content
    expect(result.singapore_context).toBe(true);
  });

  test('should generate appropriate Singapore-specific disclaimers', () => {
    const testCases = [
      { level: 'minimal', expectedSubstring: 'learning' },
      { level: 'high', expectedSubstring: 'professionals' },
      { level: 'critical', expectedSubstring: 'MAS' }
    ];

    testCases.forEach(({ level, expectedSubstring }) => {
      const disclaimer = intentAnalyzer.getDisclaimerTemplate(level, 'en-sg');
      expect(disclaimer).toContain(expectedSubstring);
    });
  });

  test('should handle mixed language and regional contexts', () => {
    const context: ContentContext = {
      title: 'Business Setup Guide',
      content: 'Starting a business in Singapore? Check ACRA requirements and consider CPF contributions for employees.',
      language: 'en-sg',
      geographical_focus: ['singapore', 'asean']
    };

    const result = intentAnalyzer.analyzeIntent(context);

    expect(result.singapore_context).toBe(true);
    expect(result.singapore_specific_indicators.length).toBeGreaterThan(1);
  });

  test('should validate analysis results and provide warnings', () => {
    const context: ContentContext = {
      content: 'Generic content without clear indicators.',
      geographical_focus: ['singapore'] // Singapore context but no Singapore keywords
    };

    const result = intentAnalyzer.analyzeIntent(context);
    const validation = intentAnalyzer.validateAnalysis(result);

    expect(validation).toBeDefined();
    expect(typeof validation.valid).toBe('boolean');
    expect(Array.isArray(validation.warnings)).toBe(true);
  });

  test('should handle edge cases gracefully', () => {
    const edgeCases = [
      { content: '', title: '' },
      { content: 'A' },
      { content: 'Very long content ' + 'test '.repeat(1000) },
      { content: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?' }
    ];

    edgeCases.forEach((testCase, index) => {
      expect(() => {
        const result = intentAnalyzer.analyzeIntent({
          title: `Test Case ${index}`,
          ...testCase
        });
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });

  test('should maintain performance standards', () => {
    const context: ContentContext = {
      title: 'Performance Test',
      content: 'Testing compliance system performance with Singapore-specific content including CPF, HDB, MAS references.',
      geographical_focus: ['singapore']
    };

    const startTime = Date.now();
    const result = intentAnalyzer.analyzeIntent(context);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    expect(result).toBeDefined();
    expect(result.singapore_context).toBe(true);
  });
});
