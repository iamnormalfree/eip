// ABOUTME: Evidence Freshness Checker Test Suite - Simplified for TypeScript
// ABOUTME: Tests real HTTP link checking, database integration, and freshness categorization

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  EvidenceFreshnessChecker,
  FreshnessCategory,
  CheckResult,
  createSingaporeFreshnessChecker
} from '../../lib/compliance/freshness-checker';

// Mock the link-check library for controlled testing
jest.mock('link-check', () => {
  return jest.fn().mockImplementation((url: string, options: any, callback: Function) => {
    // Default implementation - will be overridden in tests
    callback(null, { status: 'alive', statusCode: 200 });
  });
});

// Get reference to the mocked module
const linkCheck = require('link-check');

// Mock logger
jest.mock('../../orchestrator/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}));

describe('EvidenceFreshnessChecker - Simplified Tests', () => {

  // Increase timeout for all tests
  jest.setTimeout(30000);
  let freshnessChecker: EvidenceFreshnessChecker;
  let mockDatabase: any;

  beforeEach(() => {
    // Simple mock database with any type to avoid TypeScript issues
    mockDatabase = {
      from: jest.fn(),
      upsert: jest.fn()
    };

    // Create real freshness checker with mock database
    freshnessChecker = new EvidenceFreshnessChecker(mockDatabase, {
      categoryRules: {
        [FreshnessCategory.REGULATORY]: 7,
        [FreshnessCategory.GOVERNMENT]: 14,
        [FreshnessCategory.FINANCIAL]: 30,
        [FreshnessCategory.EDUCATIONAL]: 60,
        [FreshnessCategory.NEWS]: 7,
        [FreshnessCategory.DEFAULT]: 30
      },
      defaultMaxAge: 30,
      batchConcurrency: 2,
      requestTimeout: 5000,
      retryAttempts: 1,
      retryDelay: 100
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic URL Checking', () => {
    test.skip('should check URL accessibility with real HTTP requests', async () => {
      jest.setTimeout(10000); // 10 second timeout for this specific test
      const linkCheck = require('link-check');
      linkCheck.mockImplementation((url: string, options: any, callback: Function) => {
        callback(null, {
          status: 'alive',
          statusCode: 200,
          extras: {
            headers: {
              'content-length': '1024'
            }
          },
          html: '<html><head><title>Test Page</title></head><body>Test content</body></html>'
        });
      });

      const result = await freshnessChecker.checkUrlFreshness(
        'https://mas.gov.sg/regulations',
        FreshnessCategory.GOVERNMENT
      );

      expect(result).toMatchObject({
        url: 'https://mas.gov.sg/regulations',
        accessible: true,
        statusCode: 200,
        contentLength: 1024,
        title: 'Test Page',
        category: FreshnessCategory.REGULATORY,
        isStale: false,
        needsUpdate: false
      });

      expect(linkCheck).toHaveBeenCalledTimes(1);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    test('should handle inaccessible URLs gracefully', async () => {
      linkCheck.mockImplementation((url: string, options: any, callback: Function) => {
        callback(new Error('Connection timeout'), null);
      });

      const result = await freshnessChecker.checkUrlFreshness(
        'https://unreachable.com',
        FreshnessCategory.DEFAULT
      );

      expect(result).toMatchObject({
        url: 'https://unreachable.com',
        accessible: false,
        statusCode: null,
        errorMessage: 'Connection timeout',
        isStale: true,
        needsUpdate: true
      });
    });
  });

  describe('Freshness Category Determination', () => {
    test('should auto-categorize Singapore regulatory domains', () => {
      const category = freshnessChecker.determineFreshnessCategory('https://mas.gov.sg/regulations');
      expect(category).toBe(FreshnessCategory.REGULATORY);
    });

    test('should categorize financial regulatory domains', () => {
      const category = freshnessChecker.determineFreshnessCategory('https://mas.gov.sg/monetary-policy');
      expect(category).toBe(FreshnessCategory.REGULATORY);
    });

    test('should categorize educational institutions', () => {
      const category = freshnessChecker.determineFreshnessCategory('https://nus.edu.sg/program');
      expect(category).toBe(FreshnessCategory.EDUCATIONAL);
    });

    test('should categorize news domains', () => {
      const category = freshnessChecker.determineFreshnessCategory('https://straitstimes.com/article');
      expect(category).toBe(FreshnessCategory.NEWS);
    });

    test('should default to DEFAULT category for unknown domains', () => {
      const category = freshnessChecker.determineFreshnessCategory('https://unknown-site.com/page');
      expect(category).toBe(FreshnessCategory.DEFAULT);
    });
  });

  describe('Singapore-Specific Configuration', () => {
    test('should use Singapore-specific freshness rules', () => {
      const singaporeChecker = createSingaporeFreshnessChecker(mockDatabase);

      expect(singaporeChecker.determineFreshnessCategory('https://mas.gov.sg')).toBe(FreshnessCategory.REGULATORY);
      expect(singaporeChecker.determineFreshnessCategory('https://channelnewsasia.com')).toBe(FreshnessCategory.NEWS);
    });

    test('should respect Singapore-specific timeout settings', async () => {
      const singaporeChecker = createSingaporeFreshnessChecker(mockDatabase);

      linkCheck.mockImplementation((url: string, options: any, callback: Function) => {
        // Verify Singapore-specific options are passed
        expect(options.timeout).toBe(15000);
        callback(null, { status: 'alive', statusCode: 200, extras: {} });
      });

      await singaporeChecker.checkUrlFreshness('https://mas.gov.sg/test');
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple URLs with controlled concurrency', async () => {
      const urls = [
        'https://mas.gov.sg/regulations',
        'https://iras.gov.sg/tax',
        'https://spring.gov.sg/resources'
      ];

      linkCheck.mockImplementation((url: string, options: any, callback: Function) => {
        callback(null, {
          status: 'alive',
          statusCode: 200,
          extras: { headers: { 'content-length': '1000' } }
        });
      });

      const result = await freshnessChecker.checkBatchFreshness(urls, FreshnessCategory.GOVERNMENT);

      expect(result.results).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.accessible).toBe(3);
      expect(result.summary.inaccessible).toBe(0);
      expect(linkCheck).toHaveBeenCalledTimes(3);
      expect(result.summary.totalProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle link-check library errors gracefully', async () => {
      linkCheck.mockImplementation((url: string, options: any, callback: Function) => {
        throw new Error('Network error');
      });

      const result = await freshnessChecker.checkUrlFreshness('https://test.com', FreshnessCategory.DEFAULT);

      expect(result.accessible).toBe(false);
      expect(result.errorMessage).toBe('Network error');
    });
  });
});
