// ABOUTME: Domain Validator Test Suite for EIP Compliance System
// ABOUTME: Tests domain validation patterns, wildcard matching, and authority levels
// ABOUTME: Validates Singapore domain allow-list functionality

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  DomainValidator,
  AuthorityLevel,
  DomainRule,
  ValidationResult,
  createSingaporeDomainValidator,
  validateDomain
} from '../../lib/compliance/domain-validator';

// Mock the logger to avoid test output pollution
jest.mock('../../orchestrator/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('DomainValidator', () => {
  let validator: DomainValidator;
  const testDomains = [
    'mas.gov.sg',
    'iras.gov.sg',
    'hdb.gov.sg',
    'dbs.com.sg',
    '*.gov.sg',
    '*.mas.gov.sg',
    '*.bank'
  ];

  beforeEach(() => {
    validator = new DomainValidator({
      allowListDomains: testDomains,
      enableLogging: false
    });
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct number of rules', () => {
      const stats = validator.getStats();
      expect(stats.totalRules).toBe(7);
      expect(stats.patterns).toContain('mas.gov.sg');
      expect(stats.patterns).toContain('*.gov.sg');
    });

    test('should handle empty domain list', () => {
      const emptyValidator = new DomainValidator({
        allowListDomains: [],
        enableLogging: false
      });
      
      const stats = emptyValidator.getStats();
      expect(stats.totalRules).toBe(0);
    });

    test('should accept custom rules', () => {
      const customRules: DomainRule[] = [
        { pattern: 'custom.example.com', authority: AuthorityLevel.HIGH }
      ];

      const customValidator = new DomainValidator({
        allowListDomains: testDomains,
        customRules,
        enableLogging: false
      });

      const result = customValidator.validateUrl('https://custom.example.com/page');
      expect(result.isValid).toBe(true);
      expect(result.authorityLevel).toBe(AuthorityLevel.HIGH);
    });
  });

  describe('URL Validation', () => {
    test('should validate exact domain matches with HIGH authority', () => {
      const result = validator.validateUrl('https://mas.gov.sg/regulations');
      
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('mas.gov.sg');
      expect(result.authorityLevel).toBe(AuthorityLevel.HIGH);
      expect(result.matchedPattern).toBe('mas.gov.sg');
    });

    test('should validate wildcard domain matches with MEDIUM authority', () => {
      const result = validator.validateUrl('https://some-agency.gov.sg/page');
      
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('some-agency.gov.sg');
      expect(result.authorityLevel).toBe(AuthorityLevel.MEDIUM);
      expect(result.matchedPattern).toBe('*.gov.sg');
    });

    test('should reject domains not in allow list', () => {
      const result = validator.validateUrl('https://untrusted.com/page');
      
      expect(result.isValid).toBe(false);
      expect(result.domain).toBe('untrusted.com');
      expect(result.reason).toContain('not in the allow list');
    });

    test('should handle malformed URLs gracefully', () => {
      const result = validator.validateUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.domain).toBe('');
      expect(result.reason).toContain('Invalid URL format');
    });

    test('should handle empty and null inputs', () => {
      expect(validator.validateUrl('').isValid).toBe(false);
      expect(validator.validateUrl('   ').isValid).toBe(false);
      expect(validator.validateUrl(null as any).isValid).toBe(false);
      expect(validator.validateUrl(undefined as any).isValid).toBe(false);
    });

    test('should be case insensitive for domain matching', () => {
      const result = validator.validateUrl('https://MAS.GOV.SG/REGULATIONS');
      
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('mas.gov.sg');
    });

    test('should handle URLs with paths and query parameters', () => {
      const result = validator.validateUrl('https://mas.gov.sg/path/to/page?param=value#section');
      
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('mas.gov.sg');
    });
  });

  describe('Batch URL Validation', () => {
    test('should validate multiple URLs efficiently', () => {
      const urls = [
        'https://mas.gov.sg/regulations',
        'https://iras.gov.sg/tax-info',
        'https://untrusted.com/page',
        'https://agency.gov.sg/info'
      ];

      const results = validator.validateUrls(urls);
      
      expect(results).toHaveLength(4);
      expect(results[0].isValid).toBe(true);  // mas.gov.sg
      expect(results[1].isValid).toBe(true);  // iras.gov.sg
      expect(results[2].isValid).toBe(false); // untrusted.com
      expect(results[3].isValid).toBe(true);  // agency.gov.sg (wildcard)
    });
  });

  describe('Wildcard Pattern Matching', () => {
    test('should match single-level wildcards', () => {
      const results = [
        validator.validateUrl('https://test.mas.gov.sg/page'),
        validator.validateUrl('https://subdomain.iras.gov.sg/info'),
        validator.validateUrl('https://any.bank/online')
      ];

      expect(results.every(r => r.isValid)).toBe(true);
      expect(results.every(r => r.authorityLevel === AuthorityLevel.MEDIUM)).toBe(true);
    });

    test('should handle complex wildcard patterns', () => {
      const wildcardValidator = new DomainValidator({
        allowListDomains: ['*.test.*.com', 'api.*.example.com'],
        enableLogging: false
      });

      expect(wildcardValidator.validateUrl('https://api.test.example.com').isValid).toBe(true);
      expect(wildcardValidator.validateUrl('https://api.dev.example.com').isValid).toBe(true);
      expect(wildcardValidator.validateUrl('https://sub.test.example.com').isValid).toBe(true);
    });

    test('should not match partial wildcards incorrectly', () => {
      const result = validator.validateUrl('https://gov.sg.hacker.com');
      expect(result.isValid).toBe(false); // Should not match *.gov.sg
    });
  });

  describe('Rule Management', () => {
    test('should add custom rules dynamically', () => {
      const initialStats = validator.getStats();
      
      validator.addRule({
        pattern: 'new-trusted.com',
        authority: AuthorityLevel.HIGH,
        description: 'New trusted domain'
      });

      const newStats = validator.getStats();
      expect(newStats.totalRules).toBe(initialStats.totalRules + 1);
      
      const result = validator.validateUrl('https://new-trusted.com');
      expect(result.isValid).toBe(true);
      expect(result.authorityLevel).toBe(AuthorityLevel.HIGH);
    });

    test('should remove rules by pattern', () => {
      const initialStats = validator.getStats();
      const removed = validator.removeRule('dbs.com.sg'); // Use domain without wildcard alternative

      expect(removed).toBe(true);

      const newStats = validator.getStats();
      expect(newStats.totalRules).toBe(initialStats.totalRules - 1);

      const result = validator.validateUrl('https://dbs.com.sg');
      expect(result.isValid).toBe(false); // Should no longer match
    });

    test('should return false when trying to remove non-existent rule', () => {
      const removed = validator.removeRule('non-existent-pattern.com');
      expect(removed).toBe(false);
    });

    test('should get rules by authority level', () => {
      const highRules = validator.getRulesByAuthority(AuthorityLevel.HIGH);
      const mediumRules = validator.getRulesByAuthority(AuthorityLevel.MEDIUM);
      
      expect(highRules.length).toBeGreaterThan(0);
      expect(mediumRules.length).toBeGreaterThan(0);
      
      expect(highRules.every(r => r.authority === AuthorityLevel.HIGH)).toBe(true);
      expect(mediumRules.every(r => r.authority === AuthorityLevel.MEDIUM)).toBe(true);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide accurate statistics', () => {
      const stats = validator.getStats();
      
      expect(stats.totalRules).toBe(7);
      expect(stats.rulesByAuthority[AuthorityLevel.HIGH]).toBeGreaterThan(0);
      expect(stats.rulesByAuthority[AuthorityLevel.MEDIUM]).toBeGreaterThan(0);
      expect(stats.patterns).toEqual(expect.arrayContaining(['mas.gov.sg', '*.gov.sg']));
    });

    test('should get all rules as copy', () => {
      const rules1 = validator.getRules();
      const rules2 = validator.getRules();
      
      expect(rules1).toEqual(rules2);
      expect(rules1).not.toBe(rules2); // Should be different array instances
    });
  });
});

describe('createSingaporeDomainValidator', () => {
  test('should create validator with Singapore domains', () => {
    const sgValidator = createSingaporeDomainValidator();
    
    expect(sgValidator.validateUrl('https://mas.gov.sg').isValid).toBe(true);
    expect(sgValidator.validateUrl('https://iras.gov.sg').isValid).toBe(true);
    expect(sgValidator.validateUrl('https://dbs.com.sg').isValid).toBe(true);
    expect(sgValidator.validateUrl('https://nus.edu.sg').isValid).toBe(true);
    expect(sgValidator.validateUrl('https://agency.gov.sg').isValid).toBe(true);
    expect(sgValidator.validateUrl('https://some.bank.com').isValid).toBe(false);
  });

  test('should reject non-Singapore domains', () => {
    const sgValidator = createSingaporeDomainValidator();
    
    expect(sgValidator.validateUrl('https://federal-reserve.gov').isValid).toBe(false);
    expect(sgValidator.validateUrl('https://random-site.com').isValid).toBe(false);
  });
});

describe('validateDomain (Legacy Compatibility)', () => {
  test('should work as legacy compatibility function', () => {
    const domains = ['mas.gov.sg', 'test.com'];
    const result = validateDomain('https://mas.gov.sg/page', domains);
    
    expect(result.isValid).toBe(true);
    expect(result.domain).toBe('mas.gov.sg');
  });

  test('should reject with legacy function when domain not in list', () => {
    const domains = ['trusted.com'];
    const result = validateDomain('https://untrusted.com/page', domains);
    
    expect(result.isValid).toBe(false);
  });
});

describe('Edge Cases and Error Handling', () => {
  let edgeValidator: DomainValidator;

  beforeEach(() => {
    edgeValidator = new DomainValidator({
      allowListDomains: ['test-site.com', 'site_with_underscores.org'],
      enableLogging: false
    });
  });

  test('should handle domains with special characters', () => {
    expect(edgeValidator.validateUrl('https://test-site.com').isValid).toBe(true);
    expect(edgeValidator.validateUrl('https://site_with_underscores.org').isValid).toBe(true);
  });

  test('should handle internationalized domain names', () => {
    const idnValidator = new DomainValidator({
      allowListDomains: ['xn--d1acufc.xn--p1ai'], // рф.ru in punycode
      enableLogging: false
    });

    expect(idnValidator.validateUrl('https://xn--d1acufc.xn--p1ai').isValid).toBe(true);
  });

  test('should handle IPv4 and IPv6 addresses', () => {
    const result = edgeValidator.validateUrl('https://192.168.1.1/admin');
    expect(result.domain).toBe('192.168.1.1');
    // Should be invalid since IP addresses are not in allow list
    expect(result.isValid).toBe(false);
  });

  test('should handle localhost and special schemes', () => {
    expect(edgeValidator.validateUrl('http://localhost:3000').isValid).toBe(false);
    expect(edgeValidator.validateUrl('file:///path/to/file').isValid).toBe(false);
  });
});
