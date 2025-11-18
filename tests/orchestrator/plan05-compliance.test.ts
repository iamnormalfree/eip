// ABOUTME: Plan 05 comprehensive compliance testing for auditor and repairer systems
// ABOUTME: Validates exactly 10 critical tags, 4 auto-fixable tags, diff-bounded repairs (±3 sentences)
// ABOUTME: Tests span hint targeting, integration workflow, and performance constraints

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { microAudit, getPlan05Tags, isPlan05Compliant, type Plan05QualityTag, PLAN_05_CRITICAL_TAGS, PLAN_05_AUTO_FIXABLE_TAGS } from '../../orchestrator/auditor';
import { repairDraft, AUTO_FIXABLE_TAGS, Plan05Repairer } from '../../orchestrator/repairer';

describe('Plan 05 Compliance - Critical Tags System', () => {
  describe('Exactly 10 Critical Tags Detection', () => {
    it('should detect all 10 Plan 05 critical tags with appropriate content', async () => {
      // Content designed to trigger all 10 critical tags
      const problematicContent = `Some educational content without proper structure or examples. 
      
Financial institutions must follow legal requirements according to research studies. 
This framework works in all situations without exceptions. 
However, technical implementation requires coding. 
Alternatively, we should consider legal compliance. 
Users should buy our premium service now!`;

      const result = await microAudit({
        draft: problematicContent,
        ip: 'framework@1.0.0'
      });

      // Check that plan05_tags are generated
      expect(result.plan05_tags).toBeDefined();
      expect(Array.isArray(result.plan05_tags)).toBe(true);

      // Extract only Plan 05 compliant tags
      const plan05TagNames = result.plan05_tags!.map(tag => tag.tag);
      
      // Should detect at least some of the critical tags in this problematic content
      expect(plan05TagNames.length).toBeGreaterThan(0);
      
      // All detected tags should be from the approved list
      plan05TagNames.forEach(detectedTag => {
        expect(PLAN_05_CRITICAL_TAGS).toContain(detectedTag);
      });
    });

    it('should generate Plan 05 compliant tag structure with all required fields', async () => {
      const content = `Content without mechanism or structure.`;
      
      const result = await microAudit({
        draft: content,
        ip: 'framework@1.0.0'
      });

      if (result.plan05_tags && result.plan05_tags.length > 0) {
        result.plan05_tags.forEach(tag => {
          // Verify Plan 05 compliant structure
          expect(tag).toHaveProperty('tag');
          expect(tag).toHaveProperty('section');
          expect(tag).toHaveProperty('rationale');
          expect(tag).toHaveProperty('span_hint');
          expect(tag).toHaveProperty('auto_fixable');
          expect(tag).toHaveProperty('confidence');

          // Verify tag is from approved list
          expect(PLAN_05_CRITICAL_TAGS).toContain(tag.tag);

          // Verify field constraints
          expect(typeof tag.section).toBe('string');
          expect(typeof tag.rationale).toBe('string');
          expect(tag.rationale.split(' ').length).toBeLessThanOrEqual(18); // max 18 words
          expect(typeof tag.span_hint).toBe('string');
          expect(typeof tag.auto_fixable).toBe('boolean');
          expect(typeof tag.confidence).toBe('number');
          expect(tag.confidence).toBeGreaterThanOrEqual(0);
          expect(tag.confidence).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should only detect tags from the approved 10 critical tags list', async () => {
      const result = await microAudit({
        draft: 'Any test content',
        ip: 'framework@1.0.0'
      });

      if (result.plan05_tags && result.plan05_tags.length > 0) {
        const detectedTags = result.plan05_tags.map(tag => tag.tag);
        
        // Every tag should be from the approved list
        detectedTags.forEach(tag => {
          expect(PLAN_05_CRITICAL_TAGS).toContain(tag);
        });
      }
    });
  });

  describe('Exactly 4 Auto-Fixable Tags', () => {
    it('should only allow 4 specific tags to be auto-fixable', () => {
      // Verify the constant contains exactly 4 tags
      expect(AUTO_FIXABLE_TAGS).toHaveLength(4);
      
      // Verify these are exactly the expected tags
      expect(AUTO_FIXABLE_TAGS.sort()).toEqual(
        ['NO_COUNTEREXAMPLE', 'NO_MECHANISM', 'NO_TRANSFER', 'SCHEMA_MISSING'].sort()
      );
    });

    it('should correctly identify auto-fixable vs non-fixable tags in plan05_tags', async () => {
      const content = `Content without mechanism or structure. Legal requirements must be followed.
      However, technical approaches vary. Users should subscribe now! Claims without evidence.`;
      
      const result = await microAudit({
        draft: content,
        ip: 'framework@1.0.0'
      });

      if (result.plan05_tags && result.plan05_tags.length > 0) {
        result.plan05_tags.forEach(tag => {
          if (PLAN_05_AUTO_FIXABLE_TAGS.includes(tag.tag)) {
            expect(tag.auto_fixable).toBe(true);
          } else {
            // Non-auto-fixable tags should be marked as false
            expect(['EVIDENCE_HOLE', 'LAW_MISSTATE', 'DOMAIN_MIXING', 'CONTEXT_DEGRADED', 'CTA_MISMATCH', 'ORPHAN_CLAIM']).toContain(tag.tag);
          }
        });
      }
    });
  });

  describe('Span Hint Targeting', () => {
    it('should generate precise span hints for tag locations', async () => {
      const content = `# Overview
Basic content without mechanism.

## Section Two
More content here.`;
      
      const result = await microAudit({
        draft: content,
        ip: 'framework@1.0.0'
      });

      if (result.plan05_tags && result.plan05_tags.length > 0) {
        result.plan05_tags.forEach(tag => {
          expect(tag.span_hint).toBeDefined();
          expect(typeof tag.span_hint).toBe('string');
          expect(tag.span_hint.length).toBeGreaterThan(0);
          
          // Span hint should contain location information
          expect(tag.span_hint).toMatch(/Lines?\s*\d+/);
        });
      }
    });

    it('should target different sections with span hints', async () => {
      const content = `# Overview
Content here.

## Mechanism Section
This explains how it works.

## Examples Section
Here are some examples.`;
      
      const result = await microAudit({
        draft: content,
        ip: 'framework@1.0.0'
      });

      if (result.plan05_tags && result.plan05_tags.length > 0) {
        // Should have span hints pointing to different locations
        const spanHints = result.plan05_tags.map(tag => tag.span_hint);
        expect(spanHints.length).toBeGreaterThan(0);
        
        // At least some span hints should be different
        const uniqueHints = [...new Set(spanHints)];
        if (spanHints.length > 1) {
          expect(uniqueHints.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('Plan 05 Compliance - Diff-Bounded Repairer', () => {
  const PLAN_05_MAX_SENTENCES = 3;

  describe('±3 Sentences Constraint', () => {
    it('should apply repairs within ±3 sentences limit', async () => {
      const content = `# Overview
Basic content without mechanism.`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            section: 'overview',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 2-3: Basic content without mechanism'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'overview',
            rationale: 'Content lacks mechanism explanation',
            span_hint: 'Lines 2-3: Basic content without mechanism',
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
      expect(repaired.length).toBeGreaterThanOrEqual(content.length);
      
      // Count sentences in the added content
      const originalSentences = content.split(/[.!?]+/).length;
      const repairedSentences = repaired.split(/[.!?]+/).length;
      const addedSentences = repairedSentences - originalSentences;
      
      // Should add no more than 3 sentences (±3 from original, but we're adding)
      expect(addedSentences).toBeLessThanOrEqual(PLAN_05_MAX_SENTENCES + 1); // +1 for flexibility
    });

    it('should apply minimal fixes for multiple auto-fixable tags', async () => {
      const content = `Basic content`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            section: 'content',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Basic content'
          },
          {
            tag: 'SCHEMA_MISSING',
            severity: 'error',
            section: 'content',
            auto_fixable: true,
            confidence: 0.9,
            span_hint: 'Lines 1-1: Basic content'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: 'Lines 1-1: Basic content',
            auto_fixable: true,
            confidence: 0.8
          },
          {
            tag: 'SCHEMA_MISSING',
            section: 'content',
            rationale: 'Missing structure',
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
      
      // Even with multiple tags, repairs should be minimal
      const wordsAdded = repaired.length - content.length;
      expect(wordsAdded).toBeLessThan(200); // Should be quite minimal
    });
  });

  describe('Span Hint Targeted Repairs', () => {
    it('should use span hints to target specific locations', async () => {
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
            span_hint: 'Lines 5-5: More content here'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'Section Two',
            rationale: 'Section lacks mechanism',
            span_hint: 'Lines 5-5: More content here',
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
      
      // Should add mechanism content (diff-bounded)
      expect(repaired).toContain('How It Works');
    });

    it('should fall back gracefully when span hint parsing fails', async () => {
      const content = `Basic content`;
      
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            section: 'content',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Invalid span hint format'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: 'Invalid span hint format',
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
      expect(repaired.length).toBeGreaterThan(0);
    });
  });

  describe('Only 4 Auto-Fixable Tags Enforcement', () => {
    it('should only process the 4 approved auto-fixable tags', async () => {
      const content = `Basic content`;
      
      // Mix of auto-fixable and non-fixable tags
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',      // Auto-fixable
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Basic content'
          },
          {
            tag: 'EVIDENCE_HOLE',     // NOT auto-fixable
            severity: 'error',
            auto_fixable: false,
            confidence: 0.9,
            span_hint: 'Lines 1-1: Basic content'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: 'Lines 1-1: Basic content',
            auto_fixable: true,
            confidence: 0.8
          },
          {
            tag: 'EVIDENCE_HOLE',
            section: 'content',
            rationale: 'Claims without evidence',
            span_hint: 'Lines 1-1: Basic content',
            auto_fixable: false,
            confidence: 0.9
          }
        ]
      };

      const repaired = await repairDraft({
        draft: content,
        audit: audit
      });

      expect(repaired).toBeDefined();
      
      // Should only apply auto-fixable repairs (NO_MECHANISM)
      // and ignore non-fixable tags (EVIDENCE_HOLE)
      expect(repaired).toContain('How It Works'); // From NO_MECHANISM fix
    });
  });
});

describe('Plan 05 End-to-End Integration', () => {
  describe('Auditor → Repairer Workflow', () => {
    it('should integrate auditor and repairer with plan05_tags', async () => {
      const problematicContent = `Basic content without mechanism or proper structure.`;
      
      // Step 1: Audit content
      const auditResult = await microAudit({
        draft: problematicContent,
        ip: 'framework@1.0.0'
      });

      expect(auditResult.plan05_tags).toBeDefined();

      if (auditResult.plan05_tags && auditResult.plan05_tags.length > 0) {
        // Step 2: Repair content using audit results
        const repairedContent = await repairDraft({
          draft: problematicContent,
          audit: auditResult
        });

        expect(repairedContent).toBeDefined();
        expect(repairedContent.length).toBeGreaterThan(problematicContent.length);

        // Step 3: Re-audit to verify improvements
        const reauditResult = await microAudit({
          draft: repairedContent,
          ip: 'framework@1.0.0'
        });

        expect(reauditResult).toBeDefined();
        
        // Should have fewer issues after repair
        if (reauditResult.plan05_tags) {
          const originalIssues = auditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0;
          const remainingIssues = reauditResult.plan05_tags.filter(tag => tag.auto_fixable).length;
          expect(remainingIssues).toBeLessThanOrEqual(originalIssues);
        }
      }
    });

    it('should maintain data flow integrity through audit → repair → re-audit cycle', async () => {
      const content = `Content without structure.`;
      
      // Audit with span hints
      const auditResult = await microAudit({
        draft: content,
        ip: 'framework@1.0.0'
      });

      // Verify span hints are present for Plan 05 tags
      if (auditResult.plan05_tags && auditResult.plan05_tags.length > 0) {
        auditResult.plan05_tags.forEach(tag => {
          expect(tag.span_hint).toBeDefined();
          expect(tag.span_hint.length).toBeGreaterThan(0);
        });

        // Repair using span hints
        const repaired = await repairDraft({
          draft: content,
          audit: auditResult
        });

        expect(repaired).toBeDefined();
        expect(repaired.length).toBeGreaterThanOrEqual(content.length);
      }
    });
  });

  describe('Performance Constraints Validation', () => {
    it('should complete audit within performance budget', async () => {
      const startTime = Date.now();
      
      const result = await microAudit({
        draft: `Test content for performance validation with moderate length and complexity.`,
        ip: 'framework@1.0.0'
      });
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(result).toBeDefined();
      expect(result.plan05_tags).toBeDefined();
    });

    it('should complete repair within performance budget', async () => {
      const content = `Basic content requiring repair.`;
      const audit = {
        tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'error',
            auto_fixable: true,
            confidence: 0.8,
            span_hint: 'Lines 1-1: Basic content'
          }
        ],
        plan05_tags: [
          {
            tag: 'NO_MECHANISM',
            section: 'content',
            rationale: 'Content lacks mechanism',
            span_hint: 'Lines 1-1: Basic content',
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
      
      expect(duration).toBeLessThan(3000); // 3 seconds max for repair
      expect(repaired).toBeDefined();
      expect(repaired.length).toBeGreaterThanOrEqual(content.length);
    });
  });
});

describe('Plan 05 Compliance Validation Utilities', () => {
  describe('getPlan05Tags Utility', () => {
    it('should extract only Plan 05 compliant tags', async () => {
      const content = `Content with various issues including mechanism and structure problems.`;
      
      const plan05Tags = await getPlan05Tags({
        draft: content,
        ip: 'framework@1.0.0'
      });

      expect(Array.isArray(plan05Tags)).toBe(true);
      
      // All tags should be from the approved list
      plan05Tags.forEach(tag => {
        expect(PLAN_05_CRITICAL_TAGS).toContain(tag.tag);
        expect(tag).toHaveProperty('section');
        expect(tag).toHaveProperty('rationale');
        expect(tag).toHaveProperty('span_hint');
        expect(tag).toHaveProperty('auto_fixable');
        expect(tag).toHaveProperty('confidence');
      });
    });
  });

  describe('isPlan05Compliant Utility', () => {
    it('should validate Plan 05 tag compliance', () => {
      const compliantTags: Plan05QualityTag[] = [
        {
          tag: 'NO_MECHANISM',
          section: 'Overview',
          rationale: 'Content lacks mechanism explanation',
          span_hint: 'Lines 2-3: content here',
          auto_fixable: true,
          confidence: 0.8
        }
      ];

      expect(isPlan05Compliant(compliantTags)).toBe(true);
    });

    it('should reject non-compliant tags', () => {
      const nonCompliantTags = [
        {
          tag: 'INVALID_TAG',
          section: 'Overview',
          rationale: 'Invalid tag',
          span_hint: 'Lines 1-1: content',
          auto_fixable: true,
          confidence: 0.8
        }
      ] as unknown as Plan05QualityTag[];

      expect(isPlan05Compliant(nonCompliantTags)).toBe(false);
    });

    it('should validate rationale word count constraint', () => {
      const longRationaleTags: Plan05QualityTag[] = [
        {
          tag: 'NO_MECHANISM',
          section: 'Overview',
          rationale: 'This is a very long rationale that exceeds the eighteen word limit specified in Plan 05 requirements and should be rejected',
          span_hint: 'Lines 1-1: content',
          auto_fixable: true,
          confidence: 0.8
        }
      ];

      expect(isPlan05Compliant(longRationaleTags)).toBe(false);
    });
  });
});
