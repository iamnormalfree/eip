// ABOUTME: Evidence Freshness Checker with Real Link Validation and Database Support
// ABOUTME: Monitors URL accessibility, content freshness, and tracks evidence over time

import linkCheck from 'link-check';
import * as crypto from 'crypto';
import { DomainValidator, AuthorityLevel } from './domain-validator';
import { getLogger } from '../../orchestrator/logger';

const logger = getLogger();

export enum FreshnessCategory {
  REGULATORY = 'regulatory',
  GOVERNMENT = 'government',
  FINANCIAL = 'financial',
  EDUCATIONAL = 'educational',
  NEWS = 'news',
  DEFAULT = 'default'
}

export interface CheckOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface CheckResult {
  url: string;
  canonicalUrl: string;
  statusCode: number | null;
  accessible: boolean;
  responseTime: number;
  contentLength?: number;
  contentHash?: string;
  title?: string;
  errorMessage?: string;
  redirectChain?: string[];
  category: FreshnessCategory;
  daysSinceLastCheck: number | null;
  isStale: boolean;
  needsUpdate: boolean;
  lastChecked: Date;
  maxAgeDays: number;
}

export interface BatchCheckResult {
  results: CheckResult[];
  summary: {
    total: number;
    accessible: number;
    inaccessible: number;
    stale: number;
    needsUpdate: number;
    avgResponseTime: number;
    totalProcessingTime: number;
  };
}

export interface EvidenceSnapshot {
  id?: string;
  canonicalUrl: string;
  version: number;
  contentHash?: string;
  title?: string;
  lastChecked: Date;
  freshnessCategory: FreshnessCategory;
  urlAccessible: boolean;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceRegistry {
  canonicalUrl: string;
  domain: string;
  firstSeen: Date;
  lastVerified: Date | null;
  verificationStatus: 'current' | 'stale' | 'unreachable';
  totalVersions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FreshnessConfig {
  categoryRules: Record<FreshnessCategory, number>;
  defaultMaxAge: number;
  batchConcurrency: number;
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  followRedirects: boolean;
  maxRedirects: number;
}

export class EvidenceFreshnessChecker {
  private domainValidator: DomainValidator;
  private config: FreshnessConfig;
  private database: any; // Supabase client

  constructor(database: any, config?: Partial<FreshnessConfig>) {
    this.database = database;
    this.config = {
      categoryRules: {
        [FreshnessCategory.REGULATORY]: 7, // MAS, IRAS updates weekly
        [FreshnessCategory.GOVERNMENT]: 14, // Government updates biweekly
        [FreshnessCategory.FINANCIAL]: 30, // Financial monthly
        [FreshnessCategory.EDUCATIONAL]: 60, // Educational content less frequent
        [FreshnessCategory.NEWS]: 7, // News expires quickly
        [FreshnessCategory.DEFAULT]: 30 // Default monthly
      },
      defaultMaxAge: 30,
      batchConcurrency: 10,
      requestTimeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      followRedirects: true,
      maxRedirects: 5,
      ...config
    };

    this.domainValidator = new DomainValidator({
      allowListDomains: [],
      customRules: [],
      enableLogging: true
    });
  }

  /**
   * Check freshness of a single URL with real HTTP validation
   */
  async checkUrlFreshness(url: string, category: FreshnessCategory = FreshnessCategory.DEFAULT): Promise<CheckResult> {
    const startTime = Date.now();
    const canonicalUrl = this.normalizeUrl(url);
    const maxAgeDays = this.config.categoryRules[category] || this.config.defaultMaxAge;

    logger.debug('Checking URL freshness', { url, category, maxAgeDays });

    try {
      // Check existing evidence in database
      const existingEvidence = await this.getEvidenceSnapshot(canonicalUrl);

      // Perform actual HTTP link check
      const linkCheckResult = await this.performLinkCheck(canonicalUrl);
      const responseTime = Date.now() - startTime;

      // Determine if evidence is fresh
      const existingLastChecked = existingEvidence?.lastChecked
        ? new Date(existingEvidence.lastChecked)
        : null;
      const hasStaleEvidence = existingLastChecked
        ? this.isEvidenceStale(existingLastChecked, maxAgeDays)
        : false;
      const isStale = !linkCheckResult.accessible || hasStaleEvidence;

      const needsUpdate = isStale || linkCheckResult.statusCode !== 200;

      // Create check result
      const result: CheckResult = {
        url,
        canonicalUrl,
        statusCode: linkCheckResult.statusCode,
        accessible: linkCheckResult.accessible,
        responseTime,
        contentLength: linkCheckResult.contentLength,
        title: linkCheckResult.title,
        errorMessage: linkCheckResult.error,
        redirectChain: linkCheckResult.redirectChain,
        category,
        daysSinceLastCheck: existingEvidence ? this.calculateDaysSince(existingEvidence.lastChecked) : null,
        isStale,
        needsUpdate,
        lastChecked: new Date(),
        maxAgeDays
      };

      // Update database with new evidence
      await this.updateEvidenceSnapshot(result);
      await this.updateEvidenceRegistry(result);

      logger.info('URL freshness check completed', {
        url,
        accessible: result.accessible,
        isStale: result.isStale,
        responseTime: result.responseTime,
        statusCode: result.statusCode
      });

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('URL freshness check failed', { url, error: errorMessage, responseTime });

      // Create error result
      const result: CheckResult = {
        url,
        canonicalUrl,
        statusCode: null,
        accessible: false,
        responseTime,
        errorMessage,
        redirectChain: [],
        category,
        daysSinceLastCheck: null,
        isStale: true,
        needsUpdate: true,
        lastChecked: new Date(),
        maxAgeDays
      };

      // Update database with error state
      await this.updateEvidenceSnapshot(result);
      await this.updateEvidenceRegistry(result);

      return result;
    }
  }

  /**
   * Perform real HTTP link check using link-check library
   */
  private async performLinkCheck(url: string): Promise<{
    accessible: boolean;
    statusCode: number | null;
    contentLength?: number;
    title?: string;
    error?: string;
    redirectChain?: string[];
  }> {
    return new Promise((resolve) => {
      const options = {
        timeout: this.config.requestTimeout,
        retries: this.config.retryAttempts,
        retryDelay: this.config.retryDelay,
        followRedirects: this.config.followRedirects,
        maxRedirects: this.config.maxRedirects
      };

      linkCheck(url, options, (err, result) => {
        if (err) {
          resolve({
            accessible: false,
            statusCode: null,
            error: err.message
          });
        } else {
          resolve({
            accessible: result.status === 'alive',
            statusCode: result.statusCode || null,
            contentLength: result.contentLength,
            title: result.title,
            redirectChain: result.redirectChain || []
          });
        }
      });
    });
  }

  /**
   * Batch check multiple URLs with controlled concurrency
   */
  async checkBatchFreshness(urls: string[], category: FreshnessCategory = FreshnessCategory.DEFAULT): Promise<BatchCheckResult> {
    const startTime = Date.now();
    const results: CheckResult[] = [];

    logger.info('Starting batch freshness check', {
      urlCount: urls.length,
      category,
      concurrency: this.config.batchConcurrency
    });

    // Process URLs in batches to control concurrency
    for (let i = 0; i < urls.length; i += this.config.batchConcurrency) {
      const batch = urls.slice(i, i + this.config.batchConcurrency);

      const batchPromises = batch.map(url =>
        this.checkUrlFreshness(url, category)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Extract successful results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error('Batch check failed for URL', {
            url: batch[index],
            error: result.reason
          });
        }
      });

      // Add delay between batches to be respectful to external services
      if (i + this.config.batchConcurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const accessible = results.filter(r => r.accessible).length;
    const inaccessible = results.filter(r => !r.accessible).length;
    const stale = results.filter(r => r.isStale).length;
    const needsUpdate = results.filter(r => r.needsUpdate).length;
    const avgResponseTime = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
      : 0;

    logger.info('Batch freshness check completed', {
      total: results.length,
      accessible,
      inaccessible,
      stale,
      needsUpdate,
      avgResponseTime,
      totalProcessingTime
    });

    return {
      results,
      summary: {
        total: results.length,
        accessible,
        inaccessible,
        stale,
        needsUpdate,
        avgResponseTime,
        totalProcessingTime
      }
    };
  }

  /**
   * Get evidence snapshot from database
   */
  private async getEvidenceSnapshot(canonicalUrl: string): Promise<EvidenceSnapshot | null> {
    try {
      const { data, error } = await this.database
        .from('evidence_snapshots')
        .select('*')
        .eq('canonical_url', canonicalUrl)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get evidence snapshot', { canonicalUrl, error });
      return null;
    }
  }

  /**
   * Update evidence snapshot in database
   */
  private async updateEvidenceSnapshot(result: CheckResult): Promise<void> {
    try {
      const existing = await this.getEvidenceSnapshot(result.canonicalUrl);

      if (existing) {
        // Update existing snapshot
        const { error } = await this.database
          .from('evidence_snapshots')
          .update({
            version: existing.version + 1,
            last_checked: result.lastChecked,
            url_accessible: result.accessible,
            response_time: result.responseTime,
            status_code: result.statusCode,
            error_message: result.errorMessage,
            title: result.title,
            content_hash: result.contentHash,
            updated_at: new Date()
          })
          .eq('canonical_url', result.canonicalUrl)
          .eq('version', existing.version);

        if (error) throw error;
      } else {
        // Create new snapshot
        const { error } = await this.database
          .from('evidence_snapshots')
          .insert({
            canonical_url: result.canonicalUrl,
            version: 1,
            last_checked: result.lastChecked,
            freshness_category: result.category,
            url_accessible: result.accessible,
            response_time: result.responseTime,
            status_code: result.statusCode,
            error_message: result.errorMessage,
            title: result.title,
            content_hash: result.contentHash
          });

        if (error) throw error;
      }
    } catch (error) {
      logger.error('Failed to update evidence snapshot', {
        canonicalUrl: result.canonicalUrl,
        error
      });
      // Don't throw - we don't want to fail the freshness check due to DB issues
    }
  }

  /**
   * Update evidence registry
   */
  private async updateEvidenceRegistry(result: CheckResult): Promise<void> {
    try {
      const { data, error } = await this.database
        .from('evidence_registry')
        .upsert({
          canonical_url: result.canonicalUrl,
          domain: new URL(result.canonicalUrl).hostname,
          last_verified: result.accessible ? result.lastChecked : null,
          verification_status: result.accessible ? 'current' : 'unreachable',
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to update evidence registry', {
        canonicalUrl: result.canonicalUrl,
        error
      });
      // Don't throw - we don't want to fail the freshness check due to DB issues
    }
  }

  /**
   * Normalize URL to canonical form
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove fragments and normalize
      urlObj.hash = '';
      urlObj.searchParams.sort();
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is
      return url;
    }
  }

  /**
   * Calculate if evidence is stale based on last check date
   */
  private isEvidenceStale(lastChecked: Date, maxAgeDays: number): boolean {
    const now = new Date();
    const daysSinceCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCheck > maxAgeDays;
  }

  /**
   * Calculate days since a given date
   */
  private calculateDaysSince(date: Date): number {
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine freshness category based on domain and context
   */
  determineFreshnessCategory(url: string, domain?: string): FreshnessCategory {
    const urlDomain = domain || new URL(url).hostname;

    // Financial regulatory domains
    if (urlDomain.includes('mas.gov.sg') ||
        urlDomain.includes('iras.gov.sg') ||
        urlDomain.includes('bank') ||
        urlDomain.includes('finance')) {
      return FreshnessCategory.REGULATORY;
    }

    // Singapore government domains
    if (urlDomain.includes('.gov.sg')) return FreshnessCategory.GOVERNMENT;

    // Educational domains
    if (urlDomain.includes('.edu') ||
        urlDomain.includes('.edu.sg') ||
        urlDomain.includes('university') ||
        urlDomain.includes('nus.edu.sg') ||
        urlDomain.includes('ntu.edu.sg')) {
      return FreshnessCategory.EDUCATIONAL;
    }

    // News domains
    if (urlDomain.includes('news') ||
        urlDomain.includes('straitstimes') ||
        urlDomain.includes('channelnewsasia')) {
      return FreshnessCategory.NEWS;
    }

    return FreshnessCategory.DEFAULT;
  }

  /**
   * Get stale evidence URLs for re-checking
   */
  async getStaleEvidence(daysThreshold: number = 7): Promise<string[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      const { data, error } = await this.database
        .from('evidence_snapshots')
        .select('canonical_url')
        .lt('last_checked', cutoffDate.toISOString())
        .or('url_accessible.eq.false');

      if (error) throw error;

      return data?.map(row => row.canonical_url) || [];
    } catch (error) {
      logger.error('Failed to get stale evidence', { error });
      return [];
    }
  }

  /**
   * Get evidence statistics
   */
  async getEvidenceStats(): Promise<{
    total: number;
    accessible: number;
    stale: number;
    byCategory: Record<FreshnessCategory, number>;
  }> {
    try {
      const { data, error } = await this.database
        .from('evidence_snapshots')
        .select('url_accessible, freshness_category');

      if (error) throw error;

      const total = data?.length || 0;
      const accessible = data?.filter(row => row.url_accessible).length || 0;
      const stale = data?.filter(row => {
        const lastChecked = new Date(row.last_checked);
        const category = row.freshness_category as FreshnessCategory;
        const maxAge = this.config.categoryRules[category] || this.config.defaultMaxAge;
        return this.isEvidenceStale(lastChecked, maxAge);
      }).length || 0;

      const byCategory: Record<FreshnessCategory, number> = {
        [FreshnessCategory.REGULATORY]: 0,
        [FreshnessCategory.GOVERNMENT]: 0,
        [FreshnessCategory.FINANCIAL]: 0,
        [FreshnessCategory.EDUCATIONAL]: 0,
        [FreshnessCategory.NEWS]: 0,
        [FreshnessCategory.DEFAULT]: 0
      };

      data?.forEach(row => {
        byCategory[row.freshness_category as FreshnessCategory]++;
      });

      return { total, accessible, stale, byCategory };
    } catch (error) {
      logger.error('Failed to get evidence stats', { error });
      return {
        total: 0,
        accessible: 0,
        stale: 0,
        byCategory: {
          [FreshnessCategory.REGULATORY]: 0,
          [FreshnessCategory.GOVERNMENT]: 0,
          [FreshnessCategory.FINANCIAL]: 0,
          [FreshnessCategory.EDUCATIONAL]: 0,
          [FreshnessCategory.NEWS]: 0,
          [FreshnessCategory.DEFAULT]: 0
        }
      };
    }
  }
}

// Factory function for Singapore-specific freshness checker
export function createSingaporeFreshnessChecker(database: any, config?: Partial<FreshnessConfig>): EvidenceFreshnessChecker {
  const singaporeConfig: Partial<FreshnessConfig> = {
    categoryRules: {
      [FreshnessCategory.REGULATORY]: 7,  // MAS/IRAS updates weekly
      [FreshnessCategory.GOVERNMENT]: 14, // Singapore government biweekly
      [FreshnessCategory.FINANCIAL]: 30,  // Financial monthly
      [FreshnessCategory.EDUCATIONAL]: 60, // Educational institutions bimonthly
      [FreshnessCategory.NEWS]: 3,        // Singapore news more frequent
      [FreshnessCategory.DEFAULT]: 30    // Default monthly
    },
    batchConcurrency: 8, // Conservative for Singapore infrastructure
    requestTimeout: 15000, // Slightly longer timeout for Singapore servers
    retryAttempts: 3,
    retryDelay: 2000,
    followRedirects: true,
    maxRedirects: 3
  };

  return new EvidenceFreshnessChecker(database, { ...singaporeConfig, ...config });
}
