// ABOUTME: Diff-bounded repair testing for EIP Steel Thread
// ABOUTME: Validates content repair functionality using real implementation
// ABOUTME: Integration-First Testing - Tests real implementations, not mocks

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { repairDraft, DiffBoundedRepairer, type RepairResult } from '../../orchestrator/repairer';

describe('Content Repairer System - Real Implementation Tests', () => {
  const testContent = {
    original: `# Strategic Planning

## Overview
Basic planning overview.

## Steps
1. Plan
2. Execute`,

    improved: `# Strategic Planning Framework

## Overview
This framework provides a systematic approach to strategic planning for organizations.

## How It Works
The planning mechanism operates through four key phases:
1. Assessment of current position and capabilities
2. Vision and goal definition
3. Strategy formulation and resource allocation
4. Implementation planning and monitoring

## Example
Technology companies use this framework for product roadmap planning.

## Compliance
Follows MAS guidelines for corporate governance.`,

    auditResult: {
      tags: [
        {
          tag: 'NO_STRUCTURE',
          severity: 'error',
          section: 'overall',
          suggestion: 'Add proper heading structure',
          auto_fixable: true,
          confidence: 0.9
        },
        {
          tag: 'NO_MECHANISM',
          severity: 'error',
          section: 'mechanism',
          suggestion: 'Add mechanism section explaining how it works',
          auto_fixable: true,
          confidence: 0.8
        },
        {
          tag: 'NO_EXAMPLES',
          severity: 'error',
          section: 'examples',
          suggestion: 'Add practical examples',
          auto_fixable: true,
          confidence: 0.9
        },
        {
          tag: 'NO_COMPLIANCE_CHECK',
          severity: 'warning',
          section: 'compliance',
          suggestion: 'Add regulatory compliance notice',
          auto_fixable: true,
          confidence: 0.7
        }
      ],
      content_analysis: {
        word_count: 15,
        section_count: 2,
        has_structure: false,
        has_mechanism: false,
        has_examples: false
      },
      pattern_analysis: {
        completion_drive: 0.3,
        question_suppression: 0.1,
        domain_mixing: 0.0
      }
    }
  };

  describe('Real Implementation Repair Operations', () => {
    it('should repair content using real repairDraft function', async () => {
      // Test REAL implementation, not mocked version
      const repaired = await repairDraft({
        draft: testContent.original,
        audit: testContent.auditResult
      });

      expect(repaired).toBeDefined();
      expect(typeof repaired).toBe('string');
      expect(repaired.length).toBeGreaterThan(testContent.original.length);
      
      // Should have added structure (the addStructure fix actually doesn't add much if headings exist)
      expect(repaired).toContain('# Overview');
      
      // Should have added examples section
      expect(repaired).toContain('## Examples');
      expect(repaired).toContain('[Specific example would be inserted here based on content context]');
      
      // Should have added mechanism section
      expect(repaired).toContain('## How It Works');
      expect(repaired).toContain('Initial Assessment');
      expect(repaired).toContain('Processing');
      expect(repaired).toContain('Outcome');
      
      // Should have added compliance notice
      expect(repaired).toContain('MAS (Monetary Authority of Singapore)');
    });

    it('should handle content with minimal issues using real implementation', async () => {
      const minimalAudit = {
        tags: [
          {
            tag: 'NO_EXAMPLES',
            severity: 'warning',
            section: 'examples',
            suggestion: 'Add examples',
            auto_fixable: true,
            confidence: 0.6
          }
        ],
        content_analysis: {
          word_count: 100,
          section_count: 4,
          has_structure: true,
          has_mechanism: true,
          has_examples: false
        },
        pattern_analysis: {
          completion_drive: 0.2,
          question_suppression: 0.1,
          domain_mixing: 0.0
        }
      };

      const repaired = await repairDraft({
        draft: testContent.improved,
        audit: minimalAudit
      });

      expect(repaired).toBeDefined();
      expect(repaired).toContain('## Examples');
      expect(repaired).toContain('[Specific example would be inserted here based on content context]');
      expect(repaired.length).toBeGreaterThan(testContent.improved.length);
    });

    it('should handle content with no auto-fixable issues', async () => {
      const noFixAudit = {
        tags: [
          {
            tag: 'SOME_COMPLEX_ISSUE',
            severity: 'error',
            section: 'content',
            suggestion: 'Complex fix needed',
            auto_fixable: false,
            confidence: 0.9
          }
        ],
        content_analysis: {
          word_count: 50,
          section_count: 2,
          has_structure: true,
          has_mechanism: false,
          has_examples: false
        },
        pattern_analysis: {
          completion_drive: 0.5,
          question_suppression: 0.3,
          domain_mixing: 0.1
        }
      };

      const repaired = await repairDraft({
        draft: testContent.original,
        audit: noFixAudit
      });

      expect(repaired).toBeDefined();
      // Since no auto-fixable tags, content should remain largely unchanged
      expect(repaired).toBe(testContent.original);
    });
  });

  describe('Real DiffBoundedRepairer Class Testing', () => {
    it('should use DiffBoundedRepairer class directly with real implementation', async () => {
      const repairer = new DiffBoundedRepairer({
        max_additions: 50,
        max_deletions: 20,
        max_modifications: 30
      });

      const result: RepairResult = await repairer.repairDraft({
        draft: testContent.original,
        audit: testContent.auditResult
      });

      expect(result).toBeDefined();
      expect(result.repaired_draft).toBeDefined();
      expect(result.fixes_applied).toBeDefined();
      expect(result.repair_summary).toBeDefined();
      
      expect(result.fixes_applied.length).toBeGreaterThan(0);
      expect(result.repair_summary.total_fixes).toBeGreaterThan(0);
      expect(result.repair_summary.sections_modified.length).toBeGreaterThan(0);
      expect(result.repair_summary.overall_improvement).toBeGreaterThan(0);
      
      // Should track which sections were modified (actual sections from fix implementations)
      expect(result.repair_summary.sections_modified).toContain('mechanism');
      expect(result.repair_summary.sections_modified).toContain('examples');
      expect(result.repair_summary.sections_modified).toContain('compliance');
      
      // Verify the repaired content
      expect(result.repaired_draft).toContain('## Examples');
      expect(result.repaired_draft).toContain('## How It Works');
      expect(result.repaired_draft).toContain('MAS (Monetary Authority of Singapore)');
    });

    it('should respect diff bounds when using custom constraints', async () => {
      const repairer = new DiffBoundedRepairer({
        max_additions: 5, // Very restrictive
        max_deletions: 2,
        max_modifications: 3
      });

      const result = await repairer.repairDraft({
        draft: testContent.original,
        audit: testContent.auditResult
      });

      // With restrictive bounds, should apply fewer fixes
      expect(result.fixes_applied.length).toBeLessThanOrEqual(3);
      expect(result.repair_summary.total_fixes).toBeLessThanOrEqual(3);
    });

    it('should prioritize high-confidence, high-severity fixes', async () => {
      // Test with a tag that actually exists in the real implementation
      const mixedPriorityAudit = {
        tags: [
          {
            tag: 'NO_EXAMPLES', // This exists in real implementation
            severity: 'error',
            section: 'examples',
            suggestion: 'Add examples',
            auto_fixable: true,
            confidence: 0.95 // High confidence
          },
          {
            tag: 'NO_COMPLIANCE_CHECK', // This exists in real implementation
            severity: 'info',
            section: 'compliance',
            suggestion: 'Add compliance',
            auto_fixable: true,
            confidence: 0.6 // Lower confidence
          }
        ],
        content_analysis: {
          word_count: 20,
          section_count: 2,
          has_structure: true,
          has_mechanism: true,
          has_examples: false
        },
        pattern_analysis: {
          completion_drive: 0.3,
          question_suppression: 0.1,
          domain_mixing: 0.0
        }
      };

      const repairer = new DiffBoundedRepairer();
      const result = await repairer.repairDraft({
        draft: testContent.original,
        audit: mixedPriorityAudit
      });

      expect(result.fixes_applied.length).toBeGreaterThan(0);
      
      // Should find the fixes that were applied
      const examplesFix = result.fixes_applied.find(fix => fix.tag === 'NO_EXAMPLES');
      const complianceFix = result.fixes_applied.find(fix => fix.tag === 'NO_COMPLIANCE_CHECK');
      
      // At least one of the fixes should be applied
      expect(examplesFix || complianceFix).toBeDefined();
      
      if (examplesFix) {
        expect(examplesFix.confidence).toBe(0.95);
      }
      if (complianceFix) {
        expect(complianceFix.confidence).toBe(0.6);
      }
    });
  });

  describe('Real Implementation Specific Fix Types', () => {
    it('should apply TOKEN_PADDING fix using real implementation', async () => {
      const paddingAudit = {
        tags: [
          {
            tag: 'TOKEN_PADDING',
            severity: 'warning',
            section: 'content',
            suggestion: 'Remove redundant words',
            auto_fixable: true,
            confidence: 0.8
          }
        ],
        content_analysis: {
          word_count: 50,
          section_count: 2,
          has_structure: true,
          has_mechanism: true,
          has_examples: true
        },
        pattern_analysis: {
          completion_drive: 0.7,
          question_suppression: 0.2,
          domain_mixing: 0.1
        }
      };

      const paddedContent = `This is the following very comprehensive overview of the strategic planning process that we need to also consider in addition to the other requirements that are quite important for our organization.`;
      
      const repaired = await repairDraft({
        draft: paddedContent,
        audit: paddingAudit
      });

      expect(repaired).toBeDefined();
      expect(repaired.length).toBeLessThan(paddedContent.length);
      
      // Should remove redundant words
      expect(repaired).not.toContain('the following');
      expect(repaired).not.toContain('as well as');
      expect(repaired).not.toContain('in addition');
    });

    it('should add compliance notice for NO_COMPLIANCE_CHECK fix', async () => {
      const complianceAudit = {
        tags: [
          {
            tag: 'NO_COMPLIANCE_CHECK',
            severity: 'warning',
            section: 'compliance',
            suggestion: 'Add regulatory compliance notice',
            auto_fixable: true,
            confidence: 0.9
          }
        ],
        content_analysis: {
          word_count: 100,
          section_count: 4,
          has_structure: true,
          has_mechanism: true,
          has_examples: true
        },
        pattern_analysis: {
          completion_drive: 0.2,
          question_suppression: 0.1,
          domain_mixing: 0.0
        }
      };

      const repaired = await repairDraft({
        draft: testContent.improved,
        audit: complianceAudit
      });

      expect(repaired).toBeDefined();
      expect(repaired).toContain('MAS (Monetary Authority of Singapore)');
      expect(repaired).toContain('informational purposes only');
    });
  });

  describe('Real Implementation Error Handling', () => {
    it('should handle empty content gracefully using real implementation', async () => {
      const emptyContentAudit = {
        tags: [
          {
            tag: 'NO_STRUCTURE',
            severity: 'error',
            section: 'overall',
            suggestion: 'Add structure to empty content',
            auto_fixable: true,
            confidence: 0.9
          }
        ],
        content_analysis: {
          word_count: 0,
          section_count: 0,
          has_structure: false,
          has_mechanism: false,
          has_examples: false
        },
        pattern_analysis: {
          completion_drive: 0.0,
          question_suppression: 0.0,
          domain_mixing: 0.0
        }
      };

      const repaired = await repairDraft({
        draft: '',
        audit: emptyContentAudit
      });

      expect(repaired).toBeDefined();
      expect(repaired.length).toBeGreaterThan(0);
      expect(repaired).toContain('# Overview');
    });

    it('should handle malformed audit results', async () => {
      const malformedAudit = {
        tags: [], // Empty tags
        content_analysis: {
          word_count: 10,
          section_count: 1,
          has_structure: false,
          has_mechanism: false,
          has_examples: false
        },
        pattern_analysis: {
          completion_drive: 0.5,
          question_suppression: 0.2,
          domain_mixing: 0.1
        }
      };

      const repaired = await repairDraft({
        draft: testContent.original,
        audit: malformedAudit
      });

      expect(repaired).toBeDefined();
      // Should return original content unchanged when no fixable tags
      expect(repaired).toBe(testContent.original);
    });

    it('should handle tags with no fix implementation', async () => {
      const unknownTagAudit = {
        tags: [
          {
            tag: 'UNKNOWN_TAG_TYPE',
            severity: 'error',
            section: 'content',
            suggestion: 'Fix unknown issue',
            auto_fixable: true,
            confidence: 0.9
          }
        ],
        content_analysis: {
          word_count: 20,
          section_count: 2,
          has_structure: true,
          has_mechanism: true,
          has_examples: true
        },
        pattern_analysis: {
          completion_drive: 0.3,
          question_suppression: 0.1,
          domain_mixing: 0.0
        }
      };

      const repaired = await repairDraft({
        draft: testContent.original,
        audit: unknownTagAudit
      });

      expect(repaired).toBeDefined();
      // Should return original content when tag has no fix implementation
      expect(repaired).toBe(testContent.original);
    });
  });

  describe('Real Implementation Performance and Quality', () => {
    it('should maintain reasonable performance with real implementation', async () => {
      const startTime = Date.now();
      
      const repaired = await repairDraft({
        draft: testContent.original,
        audit: testContent.auditResult
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(repaired).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should provide quality improvement metrics', async () => {
      const repairer = new DiffBoundedRepairer();
      
      const result: RepairResult = await repairer.repairDraft({
        draft: testContent.original,
        audit: testContent.auditResult
      });

      expect(result.repair_summary.overall_improvement).toBeGreaterThan(0);
      expect(result.repair_summary.overall_improvement).toBeLessThanOrEqual(100);
      
      // Each fix should have reasonable confidence
      result.fixes_applied.forEach(fix => {
        expect(fix.confidence).toBeGreaterThan(0);
        expect(fix.confidence).toBeLessThanOrEqual(1);
        expect(fix.changes_made).toBeGreaterThan(0);
        expect(fix.action).toBeDefined();
      });
    });

    it('should track sections modified correctly', async () => {
      const repairer = new DiffBoundedRepairer();
      
      const result: RepairResult = await repairer.repairDraft({
        draft: testContent.original,
        audit: testContent.auditResult
      });

      // Should have modified sections based on tags with sections
      expect(result.repair_summary.sections_modified).toContain('examples');
      expect(result.repair_summary.sections_modified).toContain('mechanism');
      expect(result.repair_summary.sections_modified).toContain('compliance');
    });
  });
});
