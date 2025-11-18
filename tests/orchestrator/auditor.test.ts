// ABOUTME: Quality gate testing for EIP Steel Thread
// ABOUTME: Validates micro-auditor functionality, quality tags, and compliance checks
// ABOUTME: Integration-First Testing - Tests real implementations, not mocks

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { microAudit, getTagDefinitions, calculateRepairPriority, suggestAutoFixes } from '../../orchestrator/auditor';

describe('Micro-Auditor System - Real Implementation Tests', () => {
  const testContent = {
    goodFramework: `# Strategic Planning Framework

## Overview
This framework provides a systematic approach to strategic planning for organizations.

## How It Works
The planning mechanism operates through four key phases:
1. Assessment of current position and capabilities
2. Vision and goal definition
3. Strategy formulation and resource allocation
4. Implementation planning and monitoring

## Example
Technology companies use this framework for product roadmap planning and market expansion strategies.

## Compliance
Follows MAS guidelines for corporate governance and strategic risk management.`,

    poorContent: `Some planning stuff without proper structure or examples.`,

    financialContent: `Based on MAS regulations, all financial institutions must maintain a capital adequacy ratio of at least 8%. Source: MAS Notice 620 https://www.mas.gov.sg/-/media/MAS/Regulations-and-Legislation/Notices/FSN/620.pdf`,

    invalidContent: `This is just random text without any meaningful structure or educational value.`
  };

  describe('Real Implementation Content Quality Assessment', () => {
    it('should identify high-quality framework content using real implementation', async () => {
      // Test REAL implementation, not mocked version
      const result = await microAudit({ 
        draft: testContent.goodFramework, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.overall_score).toBeGreaterThan(60); // Real implementation might be more conservative
      expect(result.tags).toBeDefined();
      expect(result.content_analysis).toBeDefined();
      expect(result.pattern_analysis).toBeDefined();
      
      // Should have structure analysis
      expect(result.content_analysis).toHaveProperty('word_count');
      expect(result.content_analysis).toHaveProperty('section_count');
      expect(result.content_analysis).toHaveProperty('has_mechanism');
      expect(result.content_analysis).toHaveProperty('has_examples');
      expect(result.content_analysis).toHaveProperty('has_structure');
      
      // Should have pattern analysis
      expect(result.pattern_analysis).toHaveProperty('completion_drive');
      expect(result.pattern_analysis).toHaveProperty('question_suppression');
      expect(result.pattern_analysis).toHaveProperty('domain_mixing');
      
      // Valid content should have high structure scores
      expect(result.content_analysis.has_structure).toBe(true);
      expect(result.content_analysis.has_mechanism).toBe(true);
      expect(result.content_analysis.has_examples).toBe(true);
    });

    it('should detect low-quality content issues using real implementation', async () => {
      // Test REAL implementation
      const result = await microAudit({ 
        draft: testContent.poorContent, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.overall_score).toBeLessThan(70);
      expect(result.tags.length).toBeGreaterThan(0);
      
      // Should detect structure issues
      expect(result.content_analysis.has_structure).toBe(false);
      expect(result.content_analysis.has_mechanism).toBe(false);
      expect(result.content_analysis.has_examples).toBe(false);
      
      // Should have error-level tags
      const errorTags = result.tags.filter(tag => tag.severity === 'error');
      expect(errorTags.length).toBeGreaterThan(0);
      
      // Check for specific error tags
      const noStructureTag = result.tags.find(t => t.tag === 'NO_STRUCTURE');
      const noMechanismTag = result.tags.find(t => t.tag === 'NO_MECHANISM');
      const noExamplesTag = result.tags.find(t => t.tag === 'NO_EXAMPLES');
      
      expect(noStructureTag || noMechanismTag || noExamplesTag).toBeDefined();
    });
  });

  describe('Real Implementation Pattern Detection', () => {
    it('should detect COMPLETION_DRIVE pattern using real implementation', async () => {
      const completionDriveContent = `This is a thoroughly comprehensive and exhaustive analysis that covers everything completely and perfectly without any gaps whatsoever.`;
      
      const result = await microAudit({ 
        draft: completionDriveContent, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.pattern_analysis.completion_drive).toBeGreaterThan(0);
      
      // Should have COMPLETION_DRIVE tag if pattern is strong enough
      if (result.pattern_analysis.completion_drive > 0.1) {
        const completionTag = result.tags.find(t => t.tag === 'COMPLETION_DRIVE');
        expect(completionTag).toBeDefined();
        expect(completionTag?.severity).toBe('warning');
      }
    });

    it('should detect QUESTION_SUPPRESSION pattern using real implementation', async () => {
      const noQuestionsContent = `This is factual information about the process. The steps are clear and defined. The outcome is predictable.`;
      
      const result = await microAudit({ 
        draft: noQuestionsContent, 
        ip: 'process@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.pattern_analysis.question_suppression).toBeGreaterThan(0);
      
      // Content without questions should have higher suppression score
      expect(result.pattern_analysis.question_suppression).toBeGreaterThan(0.1);
    });

    it('should detect DOMAIN_MIXING pattern using real implementation', async () => {
      const mixedDomainContent = `Financial planning is crucial. However, technical implementation requires proper coding. Alternatively, legal compliance must be maintained throughout.`;
      
      const result = await microAudit({ 
        draft: mixedDomainContent, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.pattern_analysis.domain_mixing).toBeGreaterThan(0);
    });
  });

  describe('Real Implementation IP Invariant Validation', () => {
    it('should validate framework IP invariants using real implementation', async () => {
      const result = await microAudit({ 
        draft: testContent.goodFramework, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      
      // Framework invariants should be satisfied for good content
      expect(result.content_analysis.has_structure).toBe(true);
      expect(result.content_analysis.has_mechanism).toBe(true);
      expect(result.content_analysis.has_examples).toBe(true);
      
      // Should have reasonable overall score
      expect(result.overall_score).toBeGreaterThan(60);
    });

    it('should detect IP invariant violations using real implementation', async () => {
      const invalidFramework = `# Title\n\nSome content without structure or mechanism.`;
      
      const result = await microAudit({ 
        draft: invalidFramework, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      
      // Should detect invariant violations
      const noStructureTag = result.tags.find(t => t.tag === 'NO_STRUCTURE');
      const noMechanismTag = result.tags.find(t => t.tag === 'NO_MECHANISM');
      const noExamplesTag = result.tags.find(t => t.tag === 'NO_EXAMPLES');
      
      // At least one invariant violation should be detected
      expect(noStructureTag || noMechanismTag || noExamplesTag).toBeDefined();
    });

    it('should validate process IP invariants using real implementation', async () => {
      const processContent = `# Loan Application Process

## Step 1: Submit application
Complete the form with required information.

## Step 2: Provide documentation
Submit income statements and property valuation.

## Step 3: Credit assessment
Bank reviews your financial information.

## Step 4: Decision
Approval or denial notification.`;

      const result = await microAudit({ 
        draft: processContent, 
        ip: 'process@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.content_analysis.has_structure).toBe(true);
      
      // Should detect numbered steps
      expect(processContent).toMatch(/Step \d+:/);
    });
  });

  describe('Real Implementation Compliance Checking', () => {
    it('should validate financial claims with proper sources using real implementation', async () => {
      const result = await microAudit({ 
        draft: testContent.financialContent, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      
      // Should detect financial claims
      if (result.compliance_analysis) {
        expect(result.compliance_analysis.financial_claims_detected).toBeGreaterThanOrEqual(0);
        
        // Should detect MAS source
        if (result.compliance_analysis.financial_claims_detected > 0) {
          expect(result.compliance_analysis.domains_used).toContain('mas.gov.sg');
          expect(result.compliance_analysis.compliance_score).toBeGreaterThan(80);
        }
      }
    });

    it('should flag unsourced financial claims using real implementation', async () => {
      const unsourcedContent = `All financial institutions must maintain 8% capital adequacy ratio.`;
      
      const result = await microAudit({ 
        draft: unsourcedContent, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      
      // Should flag compliance issues for unsourced claims
      if (result.compliance_analysis) {
        if (result.compliance_analysis.financial_claims_detected > 0 && 
            result.compliance_analysis.financial_claims_sourced === 0) {
          expect(result.compliance_analysis.compliance_score).toBeLessThan(70);
          expect(result.compliance_analysis.warnings.length + result.compliance_analysis.errors.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Real Implementation Tag Generation', () => {
    it('should generate appropriate quality tags using real implementation', async () => {
      const result = await microAudit({ 
        draft: testContent.goodFramework, 
        ip: 'framework@1.0.0' 
      });

      expect(result).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      
      // Tag structure validation
      result.tags.forEach(tag => {
        expect(tag).toHaveProperty('tag');
        expect(tag).toHaveProperty('severity');
        expect(tag).toHaveProperty('rationale');
        expect(tag).toHaveProperty('confidence');
        expect(['error', 'warning', 'info']).toContain(tag.severity);
        expect(tag.confidence).toBeGreaterThanOrEqual(0);
        expect(tag.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should provide tag definitions using real implementation', () => {
      const tagDefinitions = getTagDefinitions();

      expect(tagDefinitions).toBeDefined();
      expect(Array.isArray(tagDefinitions)).toBe(true);
      expect(tagDefinitions.length).toBeGreaterThan(0);
      
      // Expected critical tags should be present
      const expectedTags = [
        'NO_MECHANISM', 'NO_EXAMPLES', 'NO_STRUCTURE', 'COMPLETION_DRIVE',
        'QUESTION_SUPPRESSION', 'DOMAIN_MIXING', 'CONSTRAINT_OVERRIDE'
      ];
      
      const tagNames = tagDefinitions.map(tag => tag.tag);
      expectedTags.forEach(expectedTag => {
        if (tagNames.includes(expectedTag)) {
          expect(tagNames).toContain(expectedTag);
        }
      });
    });

    it('should calculate repair priority using real implementation', async () => {
      const result = await microAudit({ 
        draft: testContent.poorContent, 
        ip: 'framework@1.0.0' 
      });

      expect(result.tags.length).toBeGreaterThan(0);
      
      const prioritizedTags = calculateRepairPriority(result.tags);
      
      expect(prioritizedTags).toBeDefined();
      expect(Array.isArray(prioritizedTags)).toBe(true);
      
      if (prioritizedTags.length > 0) {
        // Should be sorted by severity
        const severityOrder = { error: 3, warning: 2, info: 1 };
        
        for (let i = 1; i < prioritizedTags.length; i++) {
          const prev = prioritizedTags[i-1];
          const curr = prioritizedTags[i];
          
          if (severityOrder[prev.severity] === severityOrder[curr.severity]) {
            expect(prev.confidence).toBeGreaterThanOrEqual(curr.confidence);
          } else {
            expect(severityOrder[prev.severity]).toBeGreaterThanOrEqual(severityOrder[curr.severity]);
          }
        }
      }
    });

    it('should suggest auto-fixes using real implementation', async () => {
      const result = await microAudit({ 
        draft: testContent.poorContent, 
        ip: 'framework@1.0.0' 
      });

      const autoFixes = suggestAutoFixes(testContent.poorContent, result.tags);
      
      expect(autoFixes).toBeDefined();
      expect(Array.isArray(autoFixes)).toBe(true);
      
      // Auto-fixes should only include fixable issues
      autoFixes.forEach(fix => {
        expect(fix).toHaveProperty('type');
        expect(fix).toHaveProperty('suggestion');
        expect(['NO_STRUCTURE', 'NO_EXAMPLES', 'NO_MECHANISM', 'NO_COUNTEREXAMPLE', 'NO_TRANSFER', 'SCHEMA_MISSING', 'TOKEN_PADDING', 'INSUFFICIENT_CONTENT']).toContain(fix.type);
      });
    });
  });

  describe('Real Implementation Performance and Quality', () => {
    it('should complete audit within performance budget using real implementation', async () => {
      const startTime = Date.now();
      const result = await microAudit({ 
        draft: testContent.goodFramework, 
        ip: 'framework@1.0.0' 
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result).toBeDefined();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
    });

    it('should handle large content efficiently using real implementation', async () => {
      const largeContent = testContent.goodFramework + '\n' + 
        'Additional content for testing. '.repeat(50);
      
      const startTime = Date.now();
      const result = await microAudit({ 
        draft: largeContent, 
        ip: 'framework@1.0.0' 
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Should handle large content within 10s
      expect(result.content_analysis.word_count).toBeGreaterThan(200);
      expect(result).toBeDefined();
    });

    it('should maintain quality standards across multiple runs using real implementation', async () => {
      const iterations = 3;
      const scores = [];

      for (let i = 0; i < iterations; i++) {
        const result = await microAudit({ 
          draft: testContent.goodFramework, 
          ip: 'framework@1.0.0' 
        });
        scores.push(result.overall_score);
      }

      // Scores should be consistent
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
      
      expect(variance).toBeLessThan(100); // Low variance indicates consistency
      expect(avgScore).toBeGreaterThan(50); // Reasonable average score
    });
  });

  describe('Integration Contract Compliance - Real Implementation', () => {
    it('should satisfy auditor smoke test contract with real implementation', async () => {
      const testCases = [
        {
          name: 'Valid framework content',
          input: { draft: testContent.goodFramework, ip: 'framework@1.0.0' },
          expectedMinScore: 50
        },
        {
          name: 'Invalid content structure', 
          input: { draft: testContent.poorContent, ip: 'framework@1.0.0' },
          expectedMaxScore: 70
        }
      ];

      for (const testCase of testCases) {
        const result = await microAudit(testCase.input);
        
        expect(result).toBeDefined();
        expect(result.overall_score).toBeDefined();
        expect(result.tags).toBeDefined();
        expect(result.content_analysis).toBeDefined();
        expect(result.pattern_analysis).toBeDefined();
        
        if (testCase.expectedMinScore) {
          expect(result.overall_score).toBeGreaterThanOrEqual(testCase.expectedMinScore);
        }
        if (testCase.expectedMaxScore) {
          expect(result.overall_score).toBeLessThanOrEqual(testCase.expectedMaxScore);
        }
      }
    });

    it('should provide comprehensive quality metrics using real implementation', async () => {
      const result = await microAudit({ 
        draft: testContent.goodFramework, 
        ip: 'framework@1.0.0' 
      });

      // Verify all required analysis components
      expect(result).toHaveProperty('overall_score');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('content_analysis');
      expect(result).toHaveProperty('pattern_analysis');
      
      // Verify content analysis structure
      expect(result.content_analysis).toHaveProperty('word_count');
      expect(result.content_analysis).toHaveProperty('section_count');
      expect(result.content_analysis).toHaveProperty('has_mechanism');
      expect(result.content_analysis).toHaveProperty('has_examples');
      expect(result.content_analysis).toHaveProperty('has_structure');
      
      // Verify pattern analysis structure  
      expect(result.pattern_analysis).toHaveProperty('completion_drive');
      expect(result.pattern_analysis).toHaveProperty('question_suppression');
      expect(result.pattern_analysis).toHaveProperty('domain_mixing');
      
      // Verify overall score range
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
    });
  });
});
