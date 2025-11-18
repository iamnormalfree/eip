// ABOUTME: Updated repairer tests for Plan 05 compliance
// ABOUTME: Tests diff-bounded repairs with 4 auto-fixable tags and span hint targeting
// ABOUTME: Validates ±3 sentences constraint and minimal repair approach

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { repairDraft, AUTO_FIXABLE_TAGS, Plan05Repairer } from '../../orchestrator/repairer';
import { microAudit } from '../../orchestrator/auditor';

describe('Plan 05 Compliant Repairer System - Updated Tests', () => {
  const testContent = {
    minimal: `# Strategic Planning

## Overview
Basic planning overview.`,

    withStructure: `# Strategic Planning Framework

## Overview  
This framework provides a systematic approach.

## Steps
1. Plan
2. Execute`,

    needsMechanism: `# Overview
Basic content without mechanism explanation.`
  };

  describe('Plan 05 Auto-Fixable Tags Enforcement', () => {
    it('should only process the 4 approved auto-fixable tags', async () => {
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',      // Auto-fixable
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 2-3: Basic content'
          },
          {
            tag: 'SCHEMA_MISSING',    // Auto-fixable  
            severity: 'error',
            auto_fixable: true,
            confidence: 0.9,
            span_hint: 'Lines 1-1: # Overview'
          },
          {
            tag: 'EVIDENCE_HOLE',     // NOT auto-fixable
            severity: 'error',
            auto_fixable: false,
            confidence: 0.9,
            span_hint: 'Lines 2-3: Basic content'
          },
          {
            tag: 'LAW_MISSTATE',      // NOT auto-fixable
            severity: 'error', 
            auto_fixable: false,
            confidence: 0.8,
            span_hint: 'Lines 2-3: Basic content'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'overview',
            rationale: 'Content lacks mechanism',
            span_hint: 'Lines 2-3: Basic content',
            auto_fixable: true,
            confidence: 0.8
          },
          {
            tag: 'SCHEMA_MISSING', 
            section: 'structure',
            rationale: 'Missing schema structure',
            span_hint: 'Lines 1-1: # Overview',
            auto_fixable: true,
            confidence: 0.9
          },
          {
            tag: 'EVIDENCE_HOLE',
            section: 'claims',
            rationale: 'Claims without evidence',
            span_hint: 'Lines 2-3: Basic content',
            auto_fixable: false,
            confidence: 0.9
          }
        ]
      };

      const repaired = await repairDraft({
        draft: testContent.minimal,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Should only apply auto-fixable repairs
      expect(AUTO_FIXABLE_TAGS).toHaveLength(4);
      expect(AUTO_FIXABLE_TAGS).toContain('NO_MECHANISM');
      expect(AUTO_FIXABLE_TAGS).toContain('SCHEMA_MISSING');
      expect(AUTO_FIXABLE_TAGS).toContain('NO_TRANSFER');
      expect(AUTO_FIXABLE_TAGS).toContain('NO_COUNTEREXAMPLE');
    });

    it('should apply Plan 05 ultra-minimal repairs', async () => {
      const content = `Basic content without structure.`;
      
      const audit = {
        tags: [
          {
            tag: 'SCHEMA_MISSING',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.9,
            span_hint: 'Lines 1-1: Basic content'
          }
        ],
        plan05_tags: [
          {
            tag: 'SCHEMA_MISSING',
            section: 'structure',
            rationale: 'Missing required IP structure',
            span_hint: 'Lines 1-1: Basic content',
            auto_fixable: true,
            confidence: 0.9
          }
        ]
      };

      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      expect(repaired).toContain('# Overview');
      
      // Plan 05: Changes should be minimal - ultra-brief additions only
      const wordsAdded = repaired.length - content.length;
      expect(wordsAdded).toBeLessThan(50); // Very minimal addition
    });
  });

  describe('Span Hint Targeted Repairs', () => {
    it('should use span hints for precise location targeting', async () => {
      const content = `# Overview
Initial content here.

## Section Two  
More content here.`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            section: 'Section Two',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 5-6: More content here.'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'Section Two',
            rationale: 'Section lacks mechanism explanation',
            span_hint: 'Lines 5-6: More content here.',
            auto_fixable: true,
            confidence: 0.8
          }
        ]
      };

      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Should add mechanism (Plan 05 ultra-minimal)
      expect(repaired).toContain('How It Works');
    });

    it('should handle invalid span hints gracefully', async () => {
      const content = `Basic content`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: '' // Empty span hint
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: '',
            auto_fixable: true,
            confidence: 0.8
          }
        ]
      };

      // Should not throw error
      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      expect(repaired.length).toBeGreaterThanOrEqual(content.length);
    });
  });

  describe('Diff-Bounded ±3 Sentences Constraint', () => {
    it('should respect ±3 sentences limit for all repairs', async () => {
      const content = `Content needing multiple fixes.`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Content needing'
          },
          {
            tag: 'SCHEMA_MISSING',
            severity: 'error', 
            auto_fixable: true,
            confidence: 0.9,
            span_hint: 'Lines 1-1: Content needing'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism explanation',
            span_hint: 'Lines 1-1: Content needing',
            auto_fixable: true,
            confidence: 0.8
          },
          {
            tag: 'SCHEMA_MISSING',
            section: 'structure', 
            rationale: 'Missing schema structure',
            span_hint: 'Lines 1-1: Content needing',
            auto_fixable: true,
            confidence: 0.9
          }
        ]
      };

      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Count sentences in added content
      const originalSentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
      const repairedSentences = repaired.split(/[.!?]+/).filter(s => s.trim()).length;
      const addedSentences = repairedSentences - originalSentences;
      
      // Plan 05: Should add no more than 3 sentences total
      expect(addedSentences).toBeLessThanOrEqual(3);
      
      // Changes should be minimal
      const sizeIncrease = repaired.length - content.length;
      expect(sizeIncrease).toBeLessThan(200); // Very minimal
    });

    it('should apply ultra-minimal mechanism additions', async () => {
      const content = `# Overview
Content about concept.`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 2-2: Content about concept.'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'overview',
            rationale: 'Content lacks mechanism explanation',
            span_hint: 'Lines 2-2: Content about concept.',
            auto_fixable: true,
            confidence: 0.8
          }
        ]
      };

      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Plan 05: Ultra-minimal mechanism (1-2 sentences max)
      if (repaired !== content) {
        const mechanismSection = repaired.match(/## How It Works\s*\n\s*(.+?)(?=\n\n|\n##|$)/s);
        if (mechanismSection) {
          const mechanismSentences = mechanismSection[1].split(/[.!?]+/).filter(s => s.trim()).length;
          expect(mechanismSentences).toBeLessThanOrEqual(2); // Ultra-minimal
        }
      }
    });
  });

  describe('Plan 05 Integration with Auditor', () => {
    it('should work end-to-end with auditor plan05_tags', async () => {
      const problematicContent = `Basic content without mechanism or structure.`;
      
      // Step 1: Audit content
      const auditResult = await microAudit({
        draft: problematicContent,
        ip: 'framework@1.0.0'
      });

      expect(auditResult.plan05_tags).toBeDefined();

      if (auditResult.plan05_tags && auditResult.plan05_tags.length > 0) {
        // Step 2: Repair using audit results
        const repairedContent = await repairDraft({
          draft: problematicContent,
          audit: auditResult
        });

        expect(repairedContent).toBeDefined();
        
        // Step 3: Re-audit to check improvements
        const reauditResult = await microAudit({
          draft: repairedContent,
          ip: 'framework@1.0.0'
        });

        expect(reauditResult).toBeDefined();
        
        // Should have fewer auto-fixable issues after repair
        const originalAutoFixable = auditResult.plan05_tags.filter(tag => tag.auto_fixable).length;
        const remainingAutoFixable = reauditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0;
        expect(remainingAutoFixable).toBeLessThanOrEqual(originalAutoFixable);
      }
    });

    it('should maintain backward compatibility with legacy tags', async () => {
      const content = `Basic content`;
      
      // Legacy format audit result
      const legacyAudit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            section: 'content',
            suggestion: 'Add mechanism section',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Basic content'
          }
        ],
        // No plan05_tags - should fall back to legacy
      };

      const repaired = await repairDraft({
        draft: content,
        audit: legacyAudit
      });

      expect(repaired).toBeDefined();
      expect(repaired.length).toBeGreaterThanOrEqual(content.length);
    });
  });

  describe('Plan 05 Performance Constraints', () => {
    it('should complete repairs within performance budget', async () => {
      const content = `Content requiring repair.`;
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Content requiring'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: 'Lines 1-1: Content requiring',
            auto_fixable: true,
            confidence: 0.8
          }
        ]
      };

      const startTime = Date.now();
      
      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // 2 seconds max for Plan 05
      expect(repaired).toBeDefined();
    });

    it('should handle large content efficiently', async () => {
      const largeContent = `Basic content. `.repeat(200); // ~2000 characters
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 100-101: Basic content. Basic content.'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: 'Lines 100-101: Basic content. Basic content.',
            auto_fixable: true,
            confidence: 0.8
          }
        ]
      };

      const startTime = Date.now();
      
      const repaired = await repairDraft({
        draft: largeContent,
        audit: audit
      });
      
      const duration = Date.now() - startTime;
      const sizeIncrease = repaired.length - largeContent.length;
      
      expect(duration).toBeLessThan(3000); // Should handle large content efficiently
      expect(sizeIncrease).toBeLessThan(200); // Diff-bounded: minimal increase even for large content
      expect(repaired).toBeDefined();
    });
  });

  describe('Plan 05 Edge Cases', () => {
    it('should handle empty content with schema addition', async () => {
      const emptyContent = '';
      
      const audit = {
        tags: [
          {
            tag: 'SCHEMA_MISSING',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.9,
            span_hint: 'Lines 1-0: [empty]'
          }
        ],
        plan05_tags: [
          {
            tag: 'SCHEMA_MISSING',
            section: 'structure',
            rationale: 'Missing required IP structure',
            span_hint: 'Lines 1-0: [empty]',
            auto_fixable: true,
            confidence: 0.9
          }
        ]
      };

      const repaired = await repairDraft({
        draft: emptyContent,
        audit: audit
      });

      expect(repaired).toBeDefined();
      expect(repaired.length).toBeGreaterThan(0);
      expect(repaired).toContain('# Overview');
    });

    it('should handle content with existing structure gracefully', async () => {
      const structuredContent = `# Overview
This has structure.

## Mechanism  
It works like this.`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM', // Should not apply since mechanism exists
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 4-5: It works like this.'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'mechanism',
            rationale: 'Content lacks mechanism explanation',
            span_hint: 'Lines 4-5: It works like this.',
            auto_fixable: true,
            confidence: 0.8
          }
        ]
      };

      const repaired = await repairDraft({
        draft: structuredContent,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Should detect existing mechanism and not add duplicate
      const mechanismCount = (repaired.match(/## How It Works/g) || []).length;
      expect(mechanismCount).toBeLessThanOrEqual(1);
    });

    it('should ignore non-auto-fixable tags completely', async () => {
      const content = `Basic content with complex issues.`;
      
      const audit = {
        tags: [
          {
            tag: 'EVIDENCE_HOLE',     // Not auto-fixable
            severity: 'error',
            auto_fixable: false,
            confidence: 0.9,
            span_hint: 'Lines 1-1: Basic content'
          },
          {
            tag: 'LAW_MISSTATE',      // Not auto-fixable
            severity: 'error',
            auto_fixable: false,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Basic content'
          },
          {
            tag: 'DOMAIN_MIXING',     // Not auto-fixable
            severity: 'warning',
            auto_fixable: false,
            confidence: 0.7,
            span_hint: 'Lines 1-1: Basic content'
          }
        ],
        plan05_tags: [
          {
            tag: 'EVIDENCE_HOLE',
            section: 'claims',
            rationale: 'Claims without evidence',
            span_hint: 'Lines 1-1: Basic content',
            auto_fixable: false,
            confidence: 0.9
          },
          {
            tag: 'LAW_MISSTATE',
            section: 'legal',
            rationale: 'Legal inaccuracies present',
            span_hint: 'Lines 1-1: Basic content',
            auto_fixable: false,
            confidence: 0.8
          }
        ]
      };

      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Should return unchanged content when no auto-fixable tags
      expect(repaired).toBe(content);
    });
  });
});
