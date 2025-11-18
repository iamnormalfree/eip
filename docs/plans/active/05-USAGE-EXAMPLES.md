# Plan 05 Usage Examples & Integration Patterns

**Guide Version:** 1.0.0  
**Target Audience:** Developers, System Integrators  
**Last Updated:** November 18, 2025

---

## Quick Start

### Basic Usage

```typescript
import { microAudit, repairDraft } from '../orchestrator/auditor';
import { Plan05Repairer } from '../orchestrator/repairer';

// 1. Audit your content
const auditResult = await microAudit({
  draft: "Your educational content here",
  ip: "framework@1.0.0"
});

// 2. Check for auto-fixable issues
if (auditResult.plan05_tags?.some(tag => tag.auto_fixable)) {
  // 3. Apply repairs
  const repairedContent = await repairDraft({
    draft: "Your educational content here",
    audit: auditResult
  });
  
  console.log('Improved content:', repairedContent);
}
```

---

## 1. Integration Patterns

### 1.1 Controller Integration Pattern

**Use Case:** Integrating Plan 05 into the main orchestrator workflow

```typescript
// In orchestrator/controller.ts
export class EnhancedContentController {
  async processContentWithQuality(input: ContentInput): Promise<ContentOutput> {
    // Step 1: Generate initial content
    const generatedContent = await this.generateContent(input);
    
    // Step 2: Quality audit
    const auditResult = await microAudit({
      draft: generatedContent,
      ip: input.selectedIp
    });
    
    let finalContent = generatedContent;
    
    // Step 3: Apply repairs if needed
    if (this.shouldRepair(auditResult)) {
      finalContent = await this.applyRepairs(generatedContent, auditResult);
      
      // Step 4: Re-audit after repairs
      const reauditResult = await microAudit({
        draft: finalContent,
        ip: input.selectedIp
      });
      
      // Step 5: Quality gate check
      if (!this.passesQualityGate(reauditResult)) {
        throw new Error('Content does not meet quality standards');
      }
    }
    
    return {
      content: finalContent,
      audit: auditResult,
      reaudit: reauditResult || null,
      qualityScore: this.calculateQualityScore(auditResult)
    };
  }

  private shouldRepair(auditResult: AuditOutput): boolean {
    return auditResult.plan05_tags?.some(tag => tag.auto_fixable) || false;
  }

  private async applyRepairs(content: string, audit: AuditOutput): Promise<string> {
    return await repairDraft({
      draft: content,
      audit: audit
    });
  }

  private passesQualityGate(auditResult: AuditOutput): boolean {
    const criticalIssues = auditResult.plan05_tags?.filter(tag => 
      !tag.auto_fixable && tag.confidence > 0.8
    ).length || 0;
    
    return criticalIssues === 0 && auditResult.overall_score >= 70;
  }
}
```

### 1.2 Batch Processing Pattern

**Use Case:** Processing multiple content items with quality enhancement

```typescript
export class BatchQualityProcessor {
  private readonly repairer = new Plan05Repairer();
  private readonly maxConcurrency = 5;

  async processBatch(contentItems: ContentItem[]): Promise<BatchResult> {
    const results: ProcessedItem[] = [];
    
    // Process items in parallel batches
    for (let i = 0; i < contentItems.length; i += this.maxConcurrency) {
      const batch = contentItems.slice(i, i + this.maxConcurrency);
      const batchResults = await Promise.all(
        batch.map(item => this.processItem(item))
      );
      
      results.push(...batchResults);
    }
    
    return this.aggregateBatchResults(results);
  }

  private async processItem(item: ContentItem): Promise<ProcessedItem> {
    try {
      // Audit
      const audit = await microAudit({
        draft: item.content,
        ip: item.ipType
      });
      
      // Repair if needed
      let finalContent = item.content;
      if (this.hasAutoFixableIssues(audit)) {
        finalContent = await this.repairer.repairDraft({
          draft: item.content,
          audit: audit
        });
      }
      
      return {
        id: item.id,
        originalContent: item.content,
        finalContent,
        audit,
        success: true
      };
      
    } catch (error) {
      return {
        id: item.id,
        originalContent: item.content,
        finalContent: item.content,
        error: error.message,
        success: false
      };
    }
  }

  private hasAutoFixableIssues(audit: AuditOutput): boolean {
    return audit.plan05_tags?.some(tag => tag.auto_fixable) || false;
  }
}
```

### 1.3 API Gateway Pattern

**Use Case:** Exposing Plan 05 functionality as REST API endpoints

```typescript
// In api/quality-endpoints.ts
import express from 'express';

export class QualityAPIController {
  @Post('/audit')
  async auditContent(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { content, ipType } = req.body;
      
      const validationResult = this.validateAuditInput(content, ipType);
      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Invalid input',
          details: validationResult.errors
        });
        return;
      }
      
      const auditResult = await microAudit({
        draft: content,
        ip: ipType
      });
      
      res.json({
        success: true,
        data: {
          audit: auditResult,
          plan05Tags: auditResult.plan05_tags,
          qualityScore: auditResult.overall_score,
          recommendations: this.generateRecommendations(auditResult)
        }
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Audit failed',
        message: error.message
      });
    }
  }

  @Post('/repair')
  async repairContent(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { content, audit } = req.body;
      
      const validationResult = this.validateRepairInput(content, audit);
      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Invalid input',
          details: validationResult.errors
        });
        return;
      }
      
      const repairedContent = await repairDraft({
        draft: content,
        audit: audit
      });
      
      // Re-audit to show improvement
      const reauditResult = await microAudit({
        draft: repairedContent,
        ip: audit.ip || 'framework@1.0.0'
      });
      
      res.json({
        success: true,
        data: {
          originalContent: content,
          repairedContent,
          originalAudit: audit,
          reauditResult,
          improvements: this.calculateImprovements(audit, reauditResult)
        }
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Repair failed',
        message: error.message
      });
    }
  }
}
```

---

## 2. Advanced Usage Examples

### 2.1 Custom Tag Processing

```typescript
export class CustomTagProcessor {
  async processContentWithCustomRules(content: string, ip: string): Promise<CustomResult> {
    // Get standard Plan 05 audit
    const standardAudit = await microAudit({ draft: content, ip });
    
    // Apply custom business rules
    const customAnalysis = await this.applyCustomRules(content, ip);
    
    // Combine results
    const combinedTags = this.combineTagResults(
      standardAudit.plan05_tags || [],
      customAnalysis.customTags
    );
    
    // Custom repair logic
    const enhancedRepairs = await this.applyCustomRepairs(content, combinedTags);
    
    return {
      originalAudit: standardAudit,
      customAnalysis,
      combinedTags,
      enhancedRepairs,
      finalQuality: this.assessFinalQuality(enhancedRepairs)
    };
  }

  private async applyCustomRules(content: string, ip: string): Promise<CustomAnalysis> {
    // Example: Add domain-specific quality checks
    const domainRules = await this.loadDomainRules(ip);
    const customTags: CustomQualityTag[] = [];
    
    for (const rule of domainRules) {
      if (this.evaluateRule(content, rule)) {
        customTags.push({
          tag: rule.tag,
          severity: rule.severity,
          rationale: rule.generateRationale(content),
          auto_fixable: rule.isAutoFixable(),
          custom_score: rule.calculateScore(content)
        });
      }
    }
    
    return { customTags, appliedRules: domainRules.length };
  }
}
```

### 2.2 Quality Metrics Dashboard

```typescript
export class QualityMetricsDashboard {
  private metricsCollector: MetricsCollector;
  
  async generateQualityReport(timeRange: TimeRange): Promise<QualityReport> {
    const metrics = await this.metricsCollector.getMetrics(timeRange);
    
    return {
      summary: this.calculateQualitySummary(metrics),
      trends: this.calculateTrends(metrics),
      tagAnalysis: this.analyzeTagPatterns(metrics),
      performance: this.analyzePerformance(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }

  private calculateQualitySummary(metrics: RawMetrics): QualitySummary {
    return {
      totalAudits: metrics.auditOperations,
      averageQualityScore: this.calculateAverageScore(metrics),
      repairSuccessRate: this.calculateRepairSuccessRate(metrics),
      topIssues: this.identifyTopIssues(metrics),
      performanceMetrics: {
        averageAuditTime: metrics.averageAuditTime,
        averageRepairTime: metrics.averageRepairTime,
        errorRate: metrics.errorRate
      }
    };
  }

  private generateRecommendations(metrics: RawMetrics): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];
    
    // High error rate recommendation
    if (metrics.errorRate > 0.05) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        title: 'High Error Rate Detected',
        description: `Error rate of ${(metrics.errorRate * 100).toFixed(1)}% exceeds acceptable threshold`,
        action: 'Review system logs and implement additional error handling'
      });
    }
    
    // Common issues recommendation
    const topIssue = this.getTopIssue(metrics);
    if (topIssue.frequency > metrics.totalAudits * 0.3) {
      recommendations.push({
        type: 'CONTENT',
        priority: 'MEDIUM',
        title: `Frequent ${topIssue.tag} Issues`,
        description: `${topIssue.tag} occurs in ${(topIssue.frequency / metrics.totalAudits * 100).toFixed(1)}% of content`,
        action: 'Consider updating content templates or adding guidelines'
      });
    }
    
    return recommendations;
  }
}
```

### 2.3 A/B Testing Framework

```typescript
export class QualityABTestManager {
  async runQualityABTest(
    content: string,
    ip: string,
    testConfig: ABTestConfig
  ): Promise<ABTestResult> {
    // Control group: Standard processing
    const controlResult = await this.processWithStandardMethod(content, ip);
    
    // Test group: Enhanced processing with Plan 05
    const testResult = await this.processWithPlan05Method(content, ip);
    
    // Compare results
    const comparison = this.compareResults(controlResult, testResult);
    
    return {
      control: controlResult,
      test: testResult,
      comparison,
      recommendation: this.generateABTestRecommendation(comparison),
      statisticalSignificance: this.calculateSignificance(comparison)
    };
  }

  private async processWithStandardMethod(content: string, ip: string): Promise<ProcessingResult> {
    // Legacy processing method
    return {
      content,
      qualityScore: this.legacyQualityScoring(content),
      processingTime: 0,
      tagCount: 0
    };
  }

  private async processWithPlan05Method(content: string, ip: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    const audit = await microAudit({ draft: content, ip });
    let finalContent = content;
    
    if (audit.plan05_tags?.some(tag => tag.auto_fixable)) {
      finalContent = await repairDraft({ draft: content, audit });
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      content: finalContent,
      qualityScore: audit.overall_score,
      processingTime,
      tagCount: audit.plan05_tags?.length || 0
    };
  }

  private compareResults(control: ProcessingResult, test: ProcessingResult): ResultComparison {
    return {
      qualityImprovement: test.qualityScore - control.qualityScore,
      processingOverhead: test.processingTime - control.processingTime,
      tagsDetected: test.tagCount,
      contentChanges: this.measureContentChanges(control.content, test.content),
      costBenefit: this.calculateCostBenefit(control, test)
    };
  }
}
```

---

## 3. Configuration Examples

### 3.1 Environment-Specific Configuration

```typescript
// config/development.ts
export const developmentConfig: Plan05Config = {
  auditor: {
    confidenceThreshold: 0.6,  // Lower threshold for testing
    enableSpanHints: true,
    strictCompliance: false,   // More lenient for development
    maxContentLength: 5000
  },
  repairer: {
    maxSentencesAddition: 5,   // More permissive for testing
    enableSpanTargeting: true,
    fallbackBehavior: 'aggressive',
    preserveOriginality: false
  },
  performance: {
    timeoutMs: 60000,          // Longer timeout for debugging
    memoryLimitMb: 200,        // More memory for development
    enableCaching: false,      // Disable cache for fresh results
    cacheTtlMs: 0
  }
};

// config/production.ts
export const productionConfig: Plan05Config = {
  auditor: {
    confidenceThreshold: 0.8,  // Higher threshold for production
    enableSpanHints: true,
    strictCompliance: true,    // Strict compliance required
    maxContentLength: 10000
  },
  repairer: {
    maxSentencesAddition: 3,   // Strict Plan 05 compliance
    enableSpanTargeting: true,
    fallbackBehavior: 'minimal',
    preserveOriginality: true
  },
  performance: {
    timeoutMs: 30000,          // Standard timeout
    memoryLimitMb: 100,        // Conservative memory usage
    enableCaching: true,       // Enable caching for performance
    cacheTtlMs: 300000         // 5 minutes cache TTL
  }
};
```

### 3.2 Domain-Specific Configuration

```typescript
// config/domains/financial.ts
export const financialDomainConfig: DomainConfig = {
  name: 'financial',
  auditRules: {
    additionalPatterns: {
      'FINANCIAL_DISCLAIMER_MISSING': {
        patterns: [/disclaimer/i, /risk/i, /investment.*advice/i],
        isAbsenceTag: true,
        severity: 'error'
      },
      'REGULATORY_CITATION_MISSING': {
        patterns: [/MAS|IRA|regulation/i],
        isAbsenceTag: true,
        severity: 'error'
      }
    },
    confidenceAdjustments: {
      'LAW_MISSTATE': 0.9,  // Higher confidence for financial content
      'EVIDENCE_HOLE': 0.8
    }
  },
  repairRules: {
    customFixes: {
      'FINANCIAL_DISCLAIMER_MISSING': (content: string) => 
        content + '\n\n*This content is for educational purposes only and does not constitute financial advice.*'
    }
  }
};

// config/domains/educational.ts
export const educationalDomainConfig: DomainConfig = {
  name: 'educational',
  auditRules: {
    additionalPatterns: {
      'LEARNING_OBJECTIVES_MISSING': {
        patterns: [/objective|goal|outcome/i],
        isAbsenceTag: true,
        severity: 'warning'
      }
    },
    confidenceAdjustments: {
      'NO_MECHANISM': 0.7,    // Standard confidence for educational content
      'NO_EXAMPLES': 0.8
    }
  }
};
```

---

## 4. Error Handling Patterns

### 4.1 Graceful Degradation

```typescript
export class RobustQualityProcessor {
  async processWithErrorHandling(content: string, ip: string): Promise<RobustResult> {
    try {
      // Primary processing path
      return await this.primaryProcessing(content, ip);
      
    } catch (primaryError) {
      console.warn('Primary processing failed, attempting fallback:', primaryError.message);
      
      try {
        // Fallback processing path
        return await this.fallbackProcessing(content, ip);
        
      } catch (fallbackError) {
        console.error('Both primary and fallback processing failed:', fallbackError.message);
        
        // Emergency fallback - return original content with error information
        return {
          content,
          success: false,
          error: {
            type: 'PROCESSING_FAILURE',
            primaryError: primaryError.message,
            fallbackError: fallbackError.message,
            timestamp: new Date().toISOString()
          },
          qualityScore: 0,
          appliedFixes: []
        };
      }
    }
  }

  private async primaryProcessing(content: string, ip: string): Promise<RobustResult> {
    const audit = await microAudit({ draft: content, ip });
    const repairedContent = await repairDraft({ draft: content, audit });
    
    return {
      content: repairedContent,
      success: true,
      qualityScore: audit.overall_score,
      appliedFixes: audit.plan05_tags?.filter(tag => tag.auto_fixable) || []
    };
  }

  private async fallbackProcessing(content: string, ip: string): Promise<RobustResult> {
    // Simplified processing without repairs
    const audit = await microAudit({ draft: content, ip });
    
    return {
      content, // Return original content
      success: true,
      qualityScore: audit.overall_score,
      appliedFixes: [], // No fixes applied in fallback
      warning: 'Processing performed in fallback mode - no repairs applied'
    };
  }
}
```

### 4.2 Retry Logic

```typescript
export class RetryableQualityProcessor {
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  async processWithRetry(content: string, ip: string): Promise<RetryableResult> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.attemptProcessing(content, ip);
        
        if (attempt > 1) {
          console.log(`Processing succeeded on attempt ${attempt}`);
        }
        
        return {
          ...result,
          attempts: attempt,
          successful: true
        };
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`Processing failed on attempt ${attempt}, retrying in ${delay}ms:`, error.message);
          await this.sleep(delay);
        }
      }
    }
    
    // All retries failed
    return {
      content,
      success: false,
      attempts: this.maxRetries,
      successful: false,
      error: lastError.message,
      retryHistory: this.generateRetryHistory(lastError)
    };
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return baseDelay + jitter;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 5. Performance Optimization Examples

### 5.1 Content Caching

```typescript
export class CachedQualityProcessor {
  private readonly auditCache = new LRUCache<string, AuditOutput>({ max: 1000 });
  private readonly repairCache = new LRUCache<string, string>({ max: 500 });

  async processWithCaching(content: string, ip: string): Promise<CachedResult> {
    const contentHash = this.hashContent(content, ip);
    
    // Check audit cache
    let auditResult = this.auditCache.get(contentHash);
    let cacheHit = false;
    
    if (auditResult) {
      cacheHit = true;
      console.log('Cache hit for audit:', contentHash);
    } else {
      auditResult = await microAudit({ draft: content, ip });
      this.auditCache.set(contentHash, auditResult);
    }
    
    // Check repair cache
    let repairedContent = content;
    if (auditResult.plan05_tags?.some(tag => tag.auto_fixable)) {
      const repairHash = this.hashRepairRequest(content, auditResult);
      
      const cachedRepair = this.repairCache.get(repairHash);
      if (cachedRepair) {
        repairedContent = cachedRepair;
        console.log('Cache hit for repair:', repairHash);
      } else {
        repairedContent = await repairDraft({ draft: content, audit: auditResult });
        this.repairCache.set(repairHash, repairedContent);
      }
    }
    
    return {
      content: repairedContent,
      audit: auditResult,
      cacheHits: {
        audit: cacheHit,
        repair: this.repairCache.has(this.hashRepairRequest(content, auditResult))
      },
      processingTime: cacheHit ? 0 : Date.now() // Simplified timing
    };
  }

  private hashContent(content: string, ip: string): string {
    // Create deterministic hash for caching
    return require('crypto')
      .createHash('md5')
      .update(content + ip)
      .digest('hex');
  }

  private hashRepairRequest(content: string, audit: AuditOutput): string {
    const autoFixableTags = audit.plan05_tags?.filter(tag => tag.auto_fixable) || [];
    const tagSignature = autoFixableTags.map(tag => tag.tag).sort().join(',');
    
    return this.hashContent(content + tagSignature, 'repair');
  }
}
```

### 5.2 Batch Processing Optimization

```typescript
export class OptimizedBatchProcessor {
  async processBatchOptimized(items: ContentItem[]): Promise<BatchProcessingResult> {
    // Group items by IP type for efficiency
    const groupedItems = this.groupByIpType(items);
    
    // Process each group
    const groupResults = await Promise.all(
      Object.entries(groupedItems).map(([ipType, groupItems]) =>
        this.processIpTypeGroup(ipType, groupItems)
      )
    );
    
    return this.combineGroupResults(groupResults);
  }

  private async processIpTypeGroup(ipType: string, items: ContentItem[]): Promise<GroupResult> {
    // Batch audit for all items of same IP type
    const auditPromises = items.map(item => 
      microAudit({ draft: item.content, ip: ipType })
    );
    
    const auditResults = await Promise.all(auditPromises);
    
    // Identify items needing repairs
    const repairableItems = items.filter((_, index) => 
      auditResults[index].plan05_tags?.some(tag => tag.auto_fixable)
    );
    
    // Batch repairs
    const repairPromises = repairableItems.map((item, index) => {
      const originalIndex = items.indexOf(item);
      return repairDraft({
        draft: item.content,
        audit: auditResults[originalIndex]
      });
    });
    
    const repairResults = await Promise.all(repairPromises);
    
    return {
      ipType,
      totalItems: items.length,
      auditedItems: auditResults.length,
      repairedItems: repairResults.length,
      results: this.combineResults(items, auditResults, repairResults)
    };
  }

  private groupByIpType(items: ContentItem[]): Record<string, ContentItem[]> {
    return items.reduce((groups, item) => {
      const ipType = item.ipType || 'default';
      if (!groups[ipType]) groups[ipType] = [];
      groups[ipType].push(item);
      return groups;
    }, {} as Record<string, ContentItem[]>);
  }
}
```

---

## 6. Testing Integration Examples

### 6.1 Test Utilities

```typescript
// tests/utils/quality-test-helpers.ts
export class QualityTestHelpers {
  static createTestContent(issues: string[]): TestContent {
    const baseContent = "This is educational content about learning.";
    
    const issueAdditions = {
      'NO_MECHANISM': "It's very important.",
      'NO_COUNTEREXAMPLE': "This always works perfectly.",
      'NO_TRANSFER': "Only applicable in this context.",
      'EVIDENCE_HOLE': "Studies show that this is effective.",
      'SCHEMA_MISSING': baseContent // No structure
    };
    
    const finalContent = issues.reduce((content, issue) => {
      return content + " " + (issueAdditions[issue] || "");
    }, baseContent);
    
    return {
      content: finalContent,
      expectedIssues: issues,
      ipType: 'framework@1.0.0'
    };
  }

  static async runQualityTest(testContent: TestContent): Promise<QualityTestResult> {
    const auditResult = await microAudit({
      draft: testContent.content,
      ip: testContent.ipType
    });
    
    const detectedTags = auditResult.plan05_tags?.map(tag => tag.tag) || [];
    const expectedTags = testContent.expectedIssues;
    
    const missingTags = expectedTags.filter(tag => !detectedTags.includes(tag));
    const unexpectedTags = detectedTags.filter(tag => !expectedTags.includes(tag));
    
    return {
      passed: missingTags.length === 0 && unexpectedTags.length === 0,
      detectedTags,
      expectedTags,
      missingTags,
      unexpectedTags,
      auditResult
    };
  }

  static assertPlan05Compliance(auditResult: AuditOutput): void {
    expect(auditResult.plan05_tags).toBeDefined();
    
    auditResult.plan05_tags?.forEach(tag => {
      // Verify Plan 05 structure
      expect(tag).toHaveProperty('tag');
      expect(tag).toHaveProperty('section');
      expect(tag).toHaveProperty('rationale');
      expect(tag).toHaveProperty('span_hint');
      expect(tag).toHaveProperty('auto_fixable');
      expect(tag).toHaveProperty('confidence');
      
      // Verify tag is from approved list
      expect(['NO_MECHANISM', 'NO_COUNTEREXAMPLE', 'NO_TRANSFER', 'EVIDENCE_HOLE',
             'LAW_MISSTATE', 'DOMAIN_MIXING', 'CONTEXT_DEGRADED', 'CTA_MISMATCH',
             'ORPHAN_CLAIM', 'SCHEMA_MISSING']).toContain(tag.tag);
      
      // Verify constraints
      expect(tag.rationale.split(' ').length).toBeLessThanOrEqual(18);
      expect(tag.confidence).toBeGreaterThanOrEqual(0);
      expect(tag.confidence).toBeLessThanOrEqual(1);
    });
  }
}
```

### 6.2 Integration Test Examples

```typescript
// tests/integration/plan05-workflow.test.ts
describe('Plan 05 Workflow Integration', () => {
  it('should handle complete audit-repair workflow', async () => {
    // Create content with known issues
    const testContent = QualityTestHelpers.createTestContent([
      'NO_MECHANISM',
      'SCHEMA_MISSING'
    ]);
    
    // Step 1: Audit
    const auditResult = await microAudit({
      draft: testContent.content,
      ip: testContent.ipType
    });
    
    QualityTestHelpers.assertPlan05Compliance(auditResult);
    expect(auditResult.plan05_tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tag: 'NO_MECHANISM', auto_fixable: true }),
        expect.objectContaining({ tag: 'SCHEMA_MISSING', auto_fixable: true })
      ])
    );
    
    // Step 2: Repair
    const repairedContent = await repairDraft({
      draft: testContent.content,
      audit: auditResult
    });
    
    expect(repairedContent).toContain('## How It Works'); // From NO_MECHANISM fix
    expect(repairedContent).toContain('# Overview'); // From SCHEMA_MISSING fix
    expect(repairedContent.length).toBeGreaterThan(testContent.content.length);
    
    // Step 3: Re-audit
    const reauditResult = await microAudit({
      draft: repairedContent,
      ip: testContent.ipType
    });
    
    // Should have fewer auto-fixable issues
    const originalAutoFixable = auditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0;
    const remainingAutoFixable = reauditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0;
    
    expect(remainingAutoFixable).toBeLessThan(originalAutoFixable);
  });

  it('should handle content with no auto-fixable issues', async () => {
    const testContent = QualityTestHelpers.createTestContent([
      'EVIDENCE_HOLE', // Not auto-fixable
      'LAW_MISSTATE'   // Not auto-fixable
    ]);
    
    const auditResult = await microAudit({
      draft: testContent.content,
      ip: testContent.ipType
    });
    
    const repairedContent = await repairDraft({
      draft: testContent.content,
      audit: auditResult
    });
    
    // Content should remain unchanged
    expect(repairedContent).toBe(testContent.content);
    
    // Should still have the same tags detected
    const reauditResult = await microAudit({
      draft: repairedContent,
      ip: testContent.ipType
    });
    
    expect(reauditResult.plan05_tags?.length).toBe(auditResult.plan05_tags?.length);
  });
});
```

---

## 7. Monitoring & Debugging

### 7.1 Debug Mode

```typescript
export class DebuggableQualityProcessor {
  async processWithDebugInfo(content: string, ip: string): Promise<DebugResult> {
    const debugInfo: DebugInfo = {
      steps: [],
      timing: {},
      dataFlow: []
    };
    
    const startTime = Date.now();
    
    try {
      // Step 1: Audit with debug
      debugInfo.steps.push('Starting audit process');
      const auditStartTime = Date.now();
      
      const auditResult = await microAudit({
        draft: content,
        ip,
        debug: true // Enable debug mode
      });
      
      debugInfo.timing.audit = Date.now() - auditStartTime;
      debugInfo.dataFlow.push({
        step: 'audit',
        input: { contentLength: content.length, ip },
        output: { 
          tagCount: auditResult.plan05_tags?.length || 0,
          qualityScore: auditResult.overall_score 
        }
      });
      
      debugInfo.steps.push('Audit completed');
      
      // Step 2: Repair decision
      const hasAutoFixable = auditResult.plan05_tags?.some(tag => tag.auto_fixable);
      debugInfo.dataFlow.push({
        step: 'repair_decision',
        result: hasAutoFixable ? 'repair_needed' : 'no_repair_needed'
      });
      
      if (hasAutoFixable) {
        debugInfo.steps.push('Starting repair process');
        const repairStartTime = Date.now();
        
        const repairedContent = await repairDraft({
          draft: content,
          audit: auditResult
        });
        
        debugInfo.timing.repair = Date.now() - repairStartTime;
        debugInfo.dataFlow.push({
          step: 'repair',
          input: { 
            autoFixableTagCount: auditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0 
          },
          output: { 
            originalLength: content.length,
            repairedLength: repairedContent.length,
            changeDelta: repairedContent.length - content.length
          }
        });
        
        debugInfo.steps.push('Repair completed');
        
        return {
          content: repairedContent,
          audit: auditResult,
          debugInfo,
          totalTime: Date.now() - startTime
        };
      }
      
      return {
        content,
        audit: auditResult,
        debugInfo,
        totalTime: Date.now() - startTime
      };
      
    } catch (error) {
      debugInfo.steps.push('Error occurred');
      debugInfo.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      throw error;
    }
  }
}
```

### 7.2 Performance Monitoring

```typescript
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  
  async monitorProcessing<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; metrics: PerformanceMetric }> {
    const startTime = process.hrtime.bigint();
    const memoryBefore = process.memoryUsage();
    
    try {
      const result = await fn();
      
      const endTime = process.hrtime.bigint();
      const memoryAfter = process.memoryUsage();
      
      const metric: PerformanceMetric = {
        operation,
        duration: Number(endTime - startTime) / 1000000, // Convert to milliseconds
        memoryDelta: {
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          external: memoryAfter.external - memoryBefore.external
        },
        timestamp: Date.now(),
        success: true
      };
      
      this.recordMetric(metric);
      
      return { result, metrics: metric };
      
    } catch (error) {
      const endTime = process.hrtime.bigint();
      
      const metric: PerformanceMetric = {
        operation,
        duration: Number(endTime - startTime) / 1000000,
        error: error.message,
        timestamp: Date.now(),
        success: false
      };
      
      this.recordMetric(metric);
      
      throw error;
    }
  }

  getPerformanceReport(): PerformanceReport {
    const allMetrics = Array.from(this.metrics.values()).flat();
    
    return {
      totalOperations: allMetrics.length,
      averageDuration: this.calculateAverage(allMetrics, 'duration'),
      successRate: this.calculateSuccessRate(allMetrics),
      memoryUsage: this.calculateMemoryStats(allMetrics),
      slowestOperations: this.getSlowestOperations(allMetrics, 10),
      operationBreakdown: this.getOperationBreakdown(allMetrics)
    };
  }

  private calculateAverage(metrics: PerformanceMetric[], field: keyof PerformanceMetric): number {
    const values = metrics
      .map(m => m[field] as number)
      .filter(v => typeof v === 'number');
    
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }
}
```

---

**Document Status:** FINAL  
**Guide Version:** 1.0.0  
**Last Updated:** November 18, 2025

*This usage guide provides comprehensive examples and patterns for integrating the Plan 05 Micro-Auditor and Diff-Bounded Repairer systems into various workflows and applications.*
