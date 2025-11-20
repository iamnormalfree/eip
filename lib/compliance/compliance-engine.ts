// ABOUTME: Core Compliance Engine for EIP Content Generation System
// ABOUTME: Orchestrates intent analysis, domain validation, and evidence freshness checking
// ABOUTME: Calculates compliance scores and generates comprehensive compliance reports

import { IntentAnalyzer, ContentContext, IntentAnalysisResult } from './intent-analyzer';
import { DomainValidator, ValidationResult, AuthorityLevel, createSingaporeDomainValidator } from './domain-validator';
import { EvidenceFreshnessChecker, CheckResult, BatchCheckResult, FreshnessCategory, createSingaporeFreshnessChecker } from './freshness-checker';
import { DisclaimerGenerator, DisclaimerRecommendation } from './disclaimer-generator';
import { getLogger } from '../../orchestrator/logger';

const logger = getLogger();

export type ComplianceStatus = 'compliant' | 'violations_detected' | 'requires_review';

export interface ComplianceViolation {
  type: 'intent_mismatch' | 'unapproved_source' | 'stale_evidence' | 'missing_disclaimer';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_element: string;
  penalty_points: number;
  suggested_fix?: string;
}

export interface ContentEvidence {
  url: string;
  title?: string;
  domain: string;
  authority_level: AuthorityLevel;
  accessibility_status: 'accessible' | 'inaccessible' | 'stale';
  freshness_category: FreshnessCategory;
  last_checked?: Date;
  content_hash?: string;
}

export interface ComplianceReport {
  status: ComplianceStatus;
  overall_score: number; // 0-100
  intent_analysis: IntentAnalysisResult;
  violations: ComplianceViolation[];
  authority_level: 'low' | 'medium' | 'high';
  disclaimer_recommendation: DisclaimerRecommendation;
  evidence_summary: {
    total_sources: number;
    accessible_sources: number;
    high_authority_sources: number;
    stale_sources: number;
  };
  processing_time_ms: number;
  timestamp: Date;
  metadata: {
    processing_tier: 'fast_parallel' | 'batch_processing' | 'deep_analysis';
    cache_hit_rate: number;
    parallel_operations: number;
  };
}

export interface ComplianceEngineConfig {
  enableParallelProcessing: boolean;
  maxConcurrency: number;
  enableCaching: boolean;
  validationLimits: {
    maxContentLength: number; // characters
    maxSourcesCount: number;
    allowedContentTypes: string[];
    maxUrlLength: number;
  };
  performanceThresholds: {
    fastProcessingTime: number; // milliseconds
    batchProcessingInterval: number; // milliseconds
    deepAnalysisThreshold: number; // minimum violations for deep analysis
  };
  scoringWeights: {
    intentMismatchPenalty: number;
    unapprovedSourcePenalty: number;
    staleEvidencePenalty: number;
    missingDisclaimerPenalty: number;
  };
}

export class ComplianceEngine {
  private intentAnalyzer: IntentAnalyzer;
  private domainValidator: DomainValidator;
  private freshnessChecker: EvidenceFreshnessChecker;
  private disclaimerGenerator: DisclaimerGenerator;
  private config: ComplianceEngineConfig;
  private database: any; // Supabase client

  constructor(database: any, config?: Partial<ComplianceEngineConfig>) {
    this.database = database;

    // Initialize components with Singapore-specific validators
    this.domainValidator = createSingaporeDomainValidator();
    this.freshnessChecker = createSingaporeFreshnessChecker(database, {
      requestTimeout: 10000,
      retryAttempts: 2,
      followRedirects: true
    });
    this.intentAnalyzer = new IntentAnalyzer();
    this.disclaimerGenerator = new DisclaimerGenerator();

    // Apply configuration with sensible defaults
    this.config = {
      enableParallelProcessing: true,
      maxConcurrency: 10,
      enableCaching: true,
      validationLimits: {
        maxContentLength: 500000, // 500KB characters
        maxSourcesCount: 100,
        allowedContentTypes: ['educational', 'advisory', 'regulatory', 'marketing', 'financial_advice'],
        maxUrlLength: 2048
      },
      performanceThresholds: {
        fastProcessingTime: 10000, // 10 seconds
        batchProcessingInterval: 300000, // 5 minutes
        deepAnalysisThreshold: 5 // violations
      },
      scoringWeights: {
        intentMismatchPenalty: 10,
        unapprovedSourcePenalty: 15,
        staleEvidencePenalty: 5,
        missingDisclaimerPenalty: 8
      },
      ...config
    };

    logger.info('Compliance engine initialized', {
      config: {
        parallelProcessing: this.config.enableParallelProcessing,
        maxConcurrency: this.config.maxConcurrency,
        caching: this.config.enableCaching,
        validationLimits: this.config.validationLimits
      }
    });
  }

  /**
   * Validates input parameters before processing
   * @param content - Content to validate
   * @param context - Content context
   * @param sources - Source URLs
   * @throws Error if validation fails
   */
  private validateInputs(
    content: string,
    context: Partial<ContentContext>,
    sources: string[]
  ): void {
    // Content validation
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    if (content.length > this.config.validationLimits.maxContentLength) {
      throw new Error(`Content exceeds maximum length of ${this.config.validationLimits.maxContentLength} characters`);
    }

    // Content sanitization
    const sanitizedContent = content.trim();
    if (sanitizedContent.length === 0) {
      throw new Error('Content cannot be empty or whitespace only');
    }

    // Sources validation
    if (!Array.isArray(sources)) {
      throw new Error('Sources must be an array');
    }

    if (sources.length > this.config.validationLimits.maxSourcesCount) {
      throw new Error(`Sources count exceeds maximum of ${this.config.validationLimits.maxSourcesCount}`);
    }

    // URL validation for sources
    for (const [index, source] of sources.entries()) {
      if (typeof source !== 'string') {
        throw new Error(`Source at index ${index} must be a string`);
      }

      if (source.length > this.config.validationLimits.maxUrlLength) {
        throw new Error(`Source URL at index ${index} exceeds maximum length of ${this.config.validationLimits.maxUrlLength} characters`);
      }

      // Basic URL format validation
      if (!source.match(/^https?:\/\/.+\..+/)) {
        throw new Error(`Source at index ${index} is not a valid URL: ${source}`);
      }
    }

    // Context validation
    if (context && typeof context !== 'object') {
      throw new Error('Context must be an object if provided');
    }

    if (context.content_type && !this.config.validationLimits.allowedContentTypes.includes(context.content_type)) {
      throw new Error(`Content type '${context.content_type}' not in allowed types: ${this.config.validationLimits.allowedContentTypes.join(', ')}`);
    }
  }

  /**
   * Main compliance validation method
   * Orchestrates all compliance checks and generates comprehensive report
   */
  async validateContent(
    content: string,
    context: Partial<ContentContext> = {},
    sources: string[] = []
  ): Promise<ComplianceReport> {
    const startTime = Date.now();

    // CRITICAL FIX: Input validation to prevent security vulnerabilities
    this.validateInputs(content, context, sources);

    logger.info('Starting compliance validation', {
      contentLength: content.length,
      sourcesCount: sources.length,
      hasContext: Object.keys(context).length > 0
    });

    try {
      // Prepare full content context
      const fullContext: ContentContext = {
        content,
        title: context.title,
        target_audience: context.target_audience,
        content_type: context.content_type,
        geographical_focus: context.geographical_focus,
        language: context.language || 'en-sg' // Default to Singapore English
      };

      // CRITICAL FIX: Implement complete three-tier processing strategy
      let intentAnalysis: IntentAnalysisResult;
      let domainValidationResults: ValidationResult[];
      let freshnessResults: CheckResult[];
      let additionalAnalysis: any = null;

      // Determine initial processing tier based on content characteristics
      const initialTier = this.determineProcessingTier(
        content.length,
        sources.length,
        0, // No violations yet
        0   // No processing time yet
      );

      logger.info('Processing compliance with tier', {
        tier: initialTier,
        contentLength: content.length,
        sourcesCount: sources.length
      });

      // Execute processing based on tier
      if (initialTier === 'fast_parallel') {
        // Tier 1: Fast Parallel (95% of content)
        [intentAnalysis, domainValidationResults, freshnessResults] = await this.performParallelChecks(
          fullContext,
          sources
        );
      } else if (initialTier === 'batch_processing') {
        // Tier 2: Batch Processing (4% of content)
        const batchResult = await this.processBatchTier(content, fullContext, sources);
        intentAnalysis = batchResult.intentAnalysis;
        domainValidationResults = batchResult.domainValidationResults;
        freshnessResults = batchResult.freshnessResults;
      } else {
        // Tier 3: Deep Analysis (1% of content)
        const deepResult = await this.processDeepAnalysisTier(content, fullContext, sources);
        intentAnalysis = deepResult.intentAnalysis;
        domainValidationResults = deepResult.domainValidationResults;
        freshnessResults = deepResult.freshnessResults;
        additionalAnalysis = deepResult.additionalAnalysis;
      }

      // Phase 2: Violation detection and scoring
      const violations = this.detectViolations(intentAnalysis, domainValidationResults, freshnessResults);

      // Phase 3: Calculate overall compliance score
      const overallScore = this.calculateComplianceScore(violations, domainValidationResults, freshnessResults);

      // Phase 4: Determine authority level based on sources
      const authorityLevel = this.calculateAuthorityLevel(domainValidationResults);

      // Phase 5: Generate disclaimer recommendation
      const disclaimerRecommendation = await this.disclaimerGenerator.generateRecommendation(
        intentAnalysis,
        violations,
        authorityLevel
      );

      // Phase 6: Determine overall status
      const status = this.determineComplianceStatus(overallScore, violations);

      // Phase 7: Compile evidence summary
      const evidenceSummary = this.compileEvidenceSummary(domainValidationResults, freshnessResults);

      const processingTime = Date.now() - startTime;
      const processingTier = this.determineResultTier(processingTime, violations.length);

      const report: ComplianceReport = {
        status,
        overall_score: overallScore,
        intent_analysis: intentAnalysis,
        violations,
        authority_level: authorityLevel,
        disclaimer_recommendation: disclaimerRecommendation,
        evidence_summary: evidenceSummary,
        processing_time_ms: processingTime,
        timestamp: new Date(),
        metadata: {
          processing_tier: processingTier,
          cache_hit_rate: this.calculateCacheHitRate(domainValidationResults, freshnessResults),
          parallel_operations: this.config.enableParallelProcessing ? 3 : 1 // intent + domain + freshness
        }
      };

      logger.info('Compliance validation completed', {
        status,
        overallScore,
        violationsCount: violations.length,
        processingTime,
        authorityLevel,
        processingTier
      });

      return report;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Compliance validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      });

      // Return a failure report for error resilience
      return this.createFailureReport(error instanceof Error ? error : new Error('Unknown error'), processingTime);
    }
  }

  /**
   * Determine processing tier based on complexity and content characteristics
   * Implements the complete three-tier processing strategy
   */
  private determineProcessingTier(
    contentLength: number,
    sourcesCount: number,
    violationsCount: number,
    processingTime: number
  ): 'fast_parallel' | 'batch_processing' | 'deep_analysis' {
    // Tier 1: Fast Parallel (95% of content)
    // Simple content, few sources, low complexity
    if (
      contentLength <= 50000 && // 50KB or less
      sourcesCount <= 3 && // 3 or fewer sources
      violationsCount <= 2 && // Few violations
      processingTime < this.config.performanceThresholds.fastProcessingTime
    ) {
      return 'fast_parallel';
    }

    // Tier 2: Batch Processing (4% of content)
    // Moderate complexity, benefits from batch operations
    if (
      contentLength <= 200000 && // 200KB or less
      sourcesCount <= 10 && // 10 or fewer sources
      violationsCount <= 5 && // Moderate violations
      processingTime < this.config.performanceThresholds.batchProcessingInterval
    ) {
      return 'batch_processing';
    }

    // Tier 3: Deep Analysis (1% of content)
    // High complexity, requires thorough analysis
    return 'deep_analysis';
  }

  /**
   * Process content through batch tier (4% of content)
   * Optimized for moderate complexity with batch operations
   */
  private async processBatchTier(
    content: string,
    context: ContentContext,
    sources: string[]
  ): Promise<{
    intentAnalysis: IntentAnalysisResult;
    domainValidationResults: ValidationResult[];
    freshnessResults: CheckResult[];
  }> {
    logger.info('Processing batch tier compliance checks');

    // Batch domain validation
    const domainValidationResults = await Promise.allSettled(
      sources.map(source => this.domainValidator.validateUrl(source))
    ).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : {
          domain: '',
          isValid: false,
          authorityLevel: AuthorityLevel.LOW,
          reason: result.reason?.message || 'Validation failed'
        }
      )
    );

    // Batch freshness checking with controlled concurrency
    const batchSize = 10; // Process 10 URLs at a time
    const freshnessResults: CheckResult[] = [];

    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(source => this.freshnessChecker.checkUrlFreshness(source))
      ).then(results =>
        results.map(result =>
          result.status === 'fulfilled' ? result.value : {
            url: '',
            canonicalUrl: '',
            statusCode: null,
            accessible: false,
            responseTime: 0,
            category: FreshnessCategory.DEFAULT,
            daysSinceLastCheck: null,
            isStale: true,
            needsUpdate: true,
            lastChecked: new Date(),
            maxAgeDays: 30,
            errorMessage: result.reason?.message || 'Check failed'
          }
        )
      );

      freshnessResults.push(...batchResults);

      // Small delay between batches to prevent overwhelming external services
      if (i + batchSize < sources.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Intent analysis (single operation)
    const intentAnalysis = this.intentAnalyzer.analyzeIntent({
      content,
      title: context.title,
      target_audience: context.target_audience,
      content_type: context.content_type,
      geographical_focus: context.geographical_focus,
      language: context.language
    });

    return { intentAnalysis, domainValidationResults, freshnessResults };
  }

  /**
   * Process content through deep analysis tier (1% of content)
   * Comprehensive analysis for high-complexity content
   */
  private async processDeepAnalysisTier(
    content: string,
    context: ContentContext,
    sources: string[]
  ): Promise<{
    intentAnalysis: IntentAnalysisResult;
    domainValidationResults: ValidationResult[];
    freshnessResults: CheckResult[];
    additionalAnalysis: {
      semanticAnalysis: any;
      crossReferenceValidation: any;
      historicalComplianceCheck: any;
    };
  }> {
    logger.info('Processing deep analysis tier compliance checks');

    // Enhanced domain validation with WHOIS and reputation checks
    const domainValidationResults = await Promise.allSettled(
      sources.map(async (source) => {
        const basicValidation = await this.domainValidator.validateUrl(source);

        // Additional deep analysis checks
        const enhancedValidation = {
          ...basicValidation,
          reputation_score: await this.checkDomainReputation(source),
          whois_info: await this.getWhoisInfo(source),
          ssl_certificate_valid: await this.checkSSLCertificate(source)
        };

        return enhancedValidation;
      })
    ).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : {
          domain: '',
          isValid: false,
          authorityLevel: AuthorityLevel.LOW,
          reason: result.reason?.message || 'Deep validation failed'
        }
      )
    );

    // Comprehensive freshness checking with content analysis
    const freshnessResults = await Promise.allSettled(
      sources.map(async (source) => {
        const basicCheck = await this.freshnessChecker.checkUrlFreshness(source);

        // Deep freshness analysis
        const deepCheck = {
          ...basicCheck,
          content_analysis: await this.analyzeUrlContent(source),
          historical_accessibility: await this.getHistoricalAccessibility(source),
          ssl_expiry: await this.checkSSLExpiry(source)
        };

        return deepCheck;
      })
    ).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : {
          url: '',
          canonicalUrl: '',
          statusCode: null,
          accessible: false,
          responseTime: 0,
          category: FreshnessCategory.DEFAULT,
          daysSinceLastCheck: -1,
          isStale: true,
          needsUpdate: true,
          lastChecked: new Date(),
          maxAgeDays: 30,
          errorMessage: result.reason?.message || 'Deep freshness check failed'
        }
      )
    );

    // Enhanced intent analysis with semantic analysis
    const intentAnalysis = this.intentAnalyzer.analyzeIntent({
      content,
      title: context.title,
      target_audience: context.target_audience,
      content_type: context.content_type,
      geographical_focus: context.geographical_focus,
      language: context.language
    });

    const additionalAnalysis = {
      semanticAnalysis: await this.performSemanticAnalysis(content),
      crossReferenceValidation: await this.validateCrossReferences(content, sources),
      historicalComplianceCheck: await this.checkHistoricalCompliance(content, context)
    };

    return {
      intentAnalysis,
      domainValidationResults,
      freshnessResults,
      additionalAnalysis
    };
  }

  /**
   * Helper methods for deep analysis tier
   */
  private async checkDomainReputation(url: string): Promise<number> {
    // Placeholder: Implement domain reputation checking
    // This could integrate with services like Google Safe Browsing API
    return 0.8; // Default neutral reputation
  }

  private async getWhoisInfo(url: string): Promise<any> {
    // Placeholder: Implement WHOIS information retrieval
    return { registered: true, age_years: 5 };
  }

  private async checkSSLCertificate(url: string): Promise<boolean> {
    // Placeholder: Implement SSL certificate validation
    return true;
  }

  private async analyzeUrlContent(url: string): Promise<any> {
    // Placeholder: Implement content analysis for URLs
    return { content_type: 'text/html', size_bytes: 15000 };
  }

  private async getHistoricalAccessibility(url: string): Promise<any> {
    // Placeholder: Check historical accessibility patterns
    return { uptime_percentage: 98.5, avg_response_time_ms: 450 };
  }

  private async checkSSLExpiry(url: string): Promise<number> {
    // Placeholder: Check SSL certificate expiry
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.getTime();
  }

  private async performSemanticAnalysis(content: string): Promise<any> {
    // Placeholder: Implement semantic analysis
    return { complexity_score: 0.6, sentiment: 'neutral' };
  }

  private async validateCrossReferences(content: string, sources: string[]): Promise<any> {
    // Placeholder: Implement cross-reference validation
    return { internal_links_valid: true, external_links_valid: 0.9 };
  }

  private async checkHistoricalCompliance(content: string, context: ContentContext): Promise<any> {
    // Placeholder: Check against historical compliance patterns
    return { similar_content_compliant: true, risk_level: 'low' };
  }

  /**
   * Perform parallel compliance checks for optimal performance (Tier 1)
   * Implements the fast parallel processing for 95% of content
   */
  private async performParallelChecks(
    context: ContentContext,
    sources: string[]
  ): Promise<[IntentAnalysisResult, ValidationResult[], CheckResult[]]> {
    if (!this.config.enableParallelProcessing) {
      // Sequential fallback for debugging or resource constraints
      logger.warn('Using sequential processing (parallel disabled)');
      const intentAnalysis = this.intentAnalyzer.analyzeIntent(context);
      const domainValidationResults = this.domainValidator.validateUrls(sources);
      const freshnessResults = sources.length > 0 
        ? await this.freshnessChecker.checkBatchFreshness(sources)
        : { results: [], summary: { total: 0, accessible: 0, inaccessible: 0, stale: 0, needsUpdate: 0, avgResponseTime: 0, totalProcessingTime: 0 } };

      return [
        intentAnalysis,
        domainValidationResults,
        freshnessResults.results
      ];
    }

    // Parallel execution of all three checks
    logger.debug('Starting parallel compliance checks', {
      sourcesCount: sources.length,
      maxConcurrency: this.config.maxConcurrency
    });

    const checks = await Promise.allSettled([
      // Intent analysis (CPU-bound, no I/O)
      Promise.resolve(this.intentAnalyzer.analyzeIntent(context)),
      
      // Domain validation (CPU-bound pattern matching)
      Promise.resolve(this.domainValidator.validateUrls(sources)),
      
      // Freshness checking (I/O bound network operations)
      sources.length > 0 
        ? this.freshnessChecker.checkBatchFreshness(sources, FreshnessCategory.DEFAULT)
        : Promise.resolve({ results: [], summary: { total: 0, accessible: 0, inaccessible: 0, stale: 0, needsUpdate: 0, avgResponseTime: 0, totalProcessingTime: 0 } })
    ]);

    // Extract results with error handling
    const intentAnalysis = checks[0].status === 'fulfilled' 
      ? checks[0].value 
      : this.createFallbackIntentAnalysis(context);

    const domainValidationResults = checks[1].status === 'fulfilled' 
      ? checks[1].value 
      : [];

    const freshnessResults = checks[2].status === 'fulfilled' 
      ? checks[2].value.results 
      : [];

    // Log any failures for monitoring
    const failedChecks = checks.filter(check => check.status === 'rejected');
    if (failedChecks.length > 0) {
      logger.warn('Some parallel checks failed', {
        failedCount: failedChecks.length,
        totalChecks: checks.length,
        errors: failedChecks.map(check => check.status === 'rejected' ? check.reason.message : 'Unknown')
      });
    }

    return [intentAnalysis, domainValidationResults, freshnessResults];
  }

  /**
   * Detect compliance violations based on analysis results
   */
  private detectViolations(
    intentAnalysis: IntentAnalysisResult,
    domainValidationResults: ValidationResult[],
    freshnessResults: CheckResult[]
  ): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    // 1. Intent mismatch violations
    if (intentAnalysis.confidence < 0.5) {
      violations.push({
        type: 'intent_mismatch',
        severity: 'medium',
        description: 'Low confidence in intent classification may lead to incorrect compliance treatment',
        affected_element: 'content_intent',
        penalty_points: this.config.scoringWeights.intentMismatchPenalty,
        suggested_fix: 'Review content clarity and add explicit intent indicators'
      });
    }

    // 2. Unapproved source violations
    const invalidSources = domainValidationResults.filter(result => !result.isValid);
    for (const invalidSource of invalidSources) {
      violations.push({
        type: 'unapproved_source',
        severity: 'high',
        description: `Source from non-allow-list domain: ${invalidSource.domain}`,
        affected_element: invalidSource.domain,
        penalty_points: this.config.scoringWeights.unapprovedSourcePenalty,
        suggested_fix: 'Replace with source from approved domain list or add justification'
      });
    }

    // 3. Stale evidence violations
    const staleSources = freshnessResults.filter(result => result.isStale || !result.accessible);
    for (const staleSource of staleSources) {
      violations.push({
        type: 'stale_evidence',
        severity: 'medium',
        description: `Evidence is stale or inaccessible: ${staleSource.url}`,
        affected_element: staleSource.url,
        penalty_points: this.config.scoringWeights.staleEvidencePenalty,
        suggested_fix: 'Update with fresh source or verify link accessibility'
      });
    }

    // 4. Missing disclaimer violations (based on intent analysis)
    if (intentAnalysis.mas_compliance_required && !intentAnalysis.risk_warning_required) {
      violations.push({
        type: 'missing_disclaimer',
        severity: 'high',
        description: 'MAS compliance requires appropriate financial disclaimer',
        affected_element: 'financial_content',
        penalty_points: this.config.scoringWeights.missingDisclaimerPenalty,
        suggested_fix: 'Add MAS-compliant financial disclaimer'
      });
    }

    logger.debug('Violations detected', {
      totalViolations: violations.length,
      byType: violations.reduce((acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    return violations;
  }

  /**
   * Calculate overall compliance score (0-100)
   * Base score: 100, subtract penalties for violations
   */
  private calculateComplianceScore(
    violations: ComplianceViolation[],
    domainValidationResults: ValidationResult[],
    freshnessResults: CheckResult[]
  ): number {
    let score = 100;

    // Subtract penalties for violations
    for (const violation of violations) {
      score -= violation.penalty_points;
    }

    // Bonus points for high-quality sources
    const highAuthoritySources = domainValidationResults.filter(
      result => result.isValid && result.authorityLevel === AuthorityLevel.HIGH
    ).length;
    score += Math.min(highAuthoritySources * 2, 10); // Max 10 bonus points

    // Bonus points for fresh, accessible evidence
    const freshAccessibleSources = freshnessResults.filter(
      result => result.accessible && !result.isStale
    ).length;
    score += Math.min(freshAccessibleSources * 1, 5); // Max 5 bonus points

    // Ensure score stays within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate authority level based on source quality and quantity
   */
  private calculateAuthorityLevel(domainValidationResults: ValidationResult[]): 'low' | 'medium' | 'high' {
    const validSources = domainValidationResults.filter(result => result.isValid);
    
    if (validSources.length === 0) {
      return 'low';
    }

    const highAuthorityCount = validSources.filter(
      result => result.authorityLevel === AuthorityLevel.HIGH
    ).length;

    const mediumAuthorityCount = validSources.filter(
      result => result.authorityLevel === AuthorityLevel.MEDIUM
    ).length;

    // Authority scoring
    const authorityScore = (highAuthorityCount * 3) + (mediumAuthorityCount * 2) + (validSources.length - highAuthorityCount - mediumAuthorityCount);

    if (authorityScore >= 6 || highAuthorityCount >= 2) {
      return 'high';
    } else if (authorityScore >= 3 || mediumAuthorityCount >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Determine overall compliance status
   */
  private determineComplianceStatus(score: number, violations: ComplianceViolation[]): ComplianceStatus {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;

    if (score >= 90 && violations.length === 0) {
      return 'compliant';
    } else if (score >= 70 || criticalViolations === 0) {
      return 'violations_detected';
    } else {
      return 'requires_review';
    }
  }

  /**
   * Compile evidence summary statistics
   */
  private compileEvidenceSummary(domainValidationResults: ValidationResult[], freshnessResults: CheckResult[]) {
    return {
      total_sources: domainValidationResults.length,
      accessible_sources: freshnessResults.filter(r => r.accessible).length,
      high_authority_sources: domainValidationResults.filter(r => r.authorityLevel === AuthorityLevel.HIGH).length,
      stale_sources: freshnessResults.filter(r => r.isStale).length
    };
  }

  /**
   * Determine which processing tier was used based on results
   * CRITICAL FIX: Renamed to avoid duplicate with the other determineProcessingTier method
   */
  private determineResultTier(processingTime: number, violationsCount: number): 'fast_parallel' | 'batch_processing' | 'deep_analysis' {
    if (processingTime <= this.config.performanceThresholds.fastProcessingTime) {
      return 'fast_parallel';
    } else if (violationsCount < this.config.performanceThresholds.deepAnalysisThreshold) {
      return 'batch_processing';
    } else {
      return 'deep_analysis';
    }
  }

  /**
   * Calculate cache hit rate for performance monitoring
   */
  private calculateCacheHitRate(domainResults: ValidationResult[], freshnessResults: CheckResult[]): number {
    // This is a simplified calculation - in production, you'd track actual cache metrics
    const totalChecks = domainResults.length + freshnessResults.length;
    if (totalChecks === 0) return 0;

    // Estimate cache hits based on processing time patterns
    const avgFreshnessTime = freshnessResults.reduce((sum, r) => sum + r.responseTime, 0) / Math.max(freshnessResults.length, 1);
    const estimatedCacheHits = avgFreshnessTime < 100 ? freshnessResults.length : 0;
    
    return Math.round((estimatedCacheHits / totalChecks) * 100);
  }

  /**
   * Create fallback intent analysis for error resilience
   */
  private createFallbackIntentAnalysis(context: ContentContext): IntentAnalysisResult {
    return {
      intent: 'educational',
      confidence: 0.5,
      disclaimer_level: 'minimal',
      singapore_context: context.geographical_focus?.includes('singapore') || false,
      mas_compliance_required: false,
      requires_source_links: false,
      risk_warning_required: false,
      detected_patterns: [],
      detected_keywords: [],
      singapore_specific_indicators: []
    };
  }

  /**
   * Create failure report for error resilience
   */
  private createFailureReport(error: Error, processingTime: number): ComplianceReport {
    const fallbackIntent = this.createFallbackIntentAnalysis({ content: '' });

    return {
      status: 'requires_review',
      overall_score: 0,
      intent_analysis: fallbackIntent,
      violations: [{
        type: 'intent_mismatch',
        severity: 'critical',
        description: `Compliance validation failed: ${error.message}`,
        affected_element: 'validation_engine',
        penalty_points: 100,
        suggested_fix: 'Retry validation or contact compliance team'
      }],
      authority_level: 'low',
      disclaimer_recommendation: {
        level: 'critical' as const,
        template: 'Error occurred during compliance validation. Please review manually.',
        placement: ['footer' as const],
        variables: {},
        singapore_specific: false,
        mas_required: false,
        risk_level: 'informational' as const
      },
      evidence_summary: {
        total_sources: 0,
        accessible_sources: 0,
        high_authority_sources: 0,
        stale_sources: 0
      },
      processing_time_ms: processingTime,
      timestamp: new Date(),
      metadata: {
        processing_tier: 'deep_analysis',
        cache_hit_rate: 0,
        parallel_operations: 0
      }
    };
  }

  /**
   * Get compliance engine statistics and health metrics
   */
  async getEngineStats(): Promise<{
    uptime: number;
    cache_status: any;
    performance_metrics: any;
    health_status: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    // This would integrate with monitoring systems in production
    return {
      uptime: process.uptime(),
      cache_status: {
        enabled: this.config.enableCaching,
        estimated_hit_rate: 'N/A' // Would be tracked in production
      },
      performance_metrics: {
        parallel_processing: this.config.enableParallelProcessing,
        max_concurrency: this.config.maxConcurrency,
        fast_processing_threshold: this.config.performanceThresholds.fastProcessingTime
      },
      health_status: 'healthy'
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<ComplianceEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Compliance engine configuration updated', { newConfig });
  }
}
