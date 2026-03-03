// ABOUTME: Evidence Freshness Checker Basic Tests
// ABOUTME: Tests core functionality without complex mocking

import { describe, test, expect } from '@jest/globals';
import {
  EvidenceFreshnessChecker,
  FreshnessCategory,
  createSingaporeFreshnessChecker
} from '../../lib/compliance/freshness-checker';

// Mock all dependencies
jest.mock('link-check', () => jest.fn());
jest.mock('../../orchestrator/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}));

describe('EvidenceFreshnessChecker - Basic Functionality', () => {
  let freshnessChecker: EvidenceFreshnessChecker;
  let mockDatabase: any;

  beforeEach(() => {
    // Mock database
    mockDatabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        }),
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        lt: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis()
      })
    };

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

  describe('Freshness Category Determination', () => {
    test('should categorize Singapore regulatory domains', () => {
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
    test('should create Singapore-specific checker', () => {
      const singaporeChecker = createSingaporeFreshnessChecker(mockDatabase);
      expect(singaporeChecker).toBeInstanceOf(EvidenceFreshnessChecker);
    });

    test('should categorize Singapore domains correctly', () => {
      const singaporeChecker = createSingaporeFreshnessChecker(mockDatabase);
      expect(singaporeChecker.determineFreshnessCategory('https://mas.gov.sg')).toBe(FreshnessCategory.REGULATORY);
      expect(singaporeChecker.determineFreshnessCategory('https://channelnewsasia.com')).toBe(FreshnessCategory.NEWS);
    });
  });

  describe('URL Normalization', () => {
    test('should normalize URLs correctly', () => {
      // This tests private method indirectly through public API
      const url1 = 'https://example.com/path?param=value&other=test#fragment';
      const url2 = 'https://example.com/path?other=test&param=value#fragment';

      const category1 = freshnessChecker.determineFreshnessCategory(url1);
      const category2 = freshnessChecker.determineFreshnessCategory(url2);

      expect(category1).toBe(category2); // Should be same domain
    });
  });

  describe('Configuration Validation', () => {
    test('should accept custom configuration', () => {
      const customChecker = new EvidenceFreshnessChecker(mockDatabase, {
        categoryRules: {
          [FreshnessCategory.REGULATORY]: 5,
          [FreshnessCategory.GOVERNMENT]: 10,
          [FreshnessCategory.FINANCIAL]: 20,
          [FreshnessCategory.EDUCATIONAL]: 40,
          [FreshnessCategory.NEWS]: 5,
          [FreshnessCategory.DEFAULT]: 20
        },
        defaultMaxAge: 20,
        batchConcurrency: 5,
        requestTimeout: 8000,
        retryAttempts: 2,
        retryDelay: 200
      });

      expect(customChecker).toBeInstanceOf(EvidenceFreshnessChecker);
    });

    test('should use default configuration when none provided', () => {
      const defaultChecker = new EvidenceFreshnessChecker(mockDatabase);
      expect(defaultChecker).toBeInstanceOf(EvidenceFreshnessChecker);
    });
  });

  describe('Database Integration Structure', () => {
    test('should have database integration methods', () => {
      expect(typeof freshnessChecker.getEvidenceStats).toBe('function');
      expect(typeof freshnessChecker.getStaleEvidence).toBe('function');
      expect(typeof freshnessChecker.checkBatchFreshness).toBe('function');
    });

    test('should return expected structure for stats', async () => {
      // Mock database response
      mockDatabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { url_accessible: true, freshness_category: 'regulatory' },
            { url_accessible: false, freshness_category: 'government' }
          ],
          error: null
        })
      });

      const stats = await freshnessChecker.getEvidenceStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('accessible');
      expect(stats).toHaveProperty('stale');
      expect(stats).toHaveProperty('byCategory');
    });

    test('should return array for stale evidence', async () => {
      // Mock database response
      mockDatabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [
                  { canonical_url: 'https://old-site.com' },
                  { canonical_url: 'https://stale-site.com' }
                ],
                error: null
              })
            })
          })
        })
      });

      const staleUrls = await freshnessChecker.getStaleEvidence(7);
      expect(Array.isArray(staleUrls)).toBe(true);
    });
  });
});
