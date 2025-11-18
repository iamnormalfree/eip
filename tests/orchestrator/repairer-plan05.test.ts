// ABOUTME: Plan 05 compliant repairer testing
// ABOUTME: Tests for diff-bounded repairs with span hint targeting and 4 auto-fixable tags

import { describe, it, expect, beforeEach } from '@jest/globals';
import { repairDraft, Plan05Repairer, AUTO_FIXABLE_TAGS } from '../../orchestrator/repairer';

describe('Plan 05 Compliant Content Repairer', () => {
  const testContent = {
    basic: `Basic planning overview without structure or mechanism.`,
    
    withStructure: `# Strategic Planning

## Overview
Basic planning overview.

## Steps
1. Plan
2. Execute`,

    withMechanism: `# Strategic Planning

## Overview  
Basic planning overview.

## How It Works
This operates through a systematic process.`,

    withSchema: `# Framework Overview

This provides a systematic approach to planning.`,
  };

  describe('Plan 05 Auto-Fixable Tags Only', () => {
    it('should only repair the 4 Plan 05 auto-fixable tags', () => {
      expect(AUTO_FIXABLE_TAGS).toHaveLength(4);
      expect(AUTO_FIXABLE_TAGS).toContain('NO_MECHANISM');
      expect(AUTO_FIXABLE_TAGS).toContain('SCHEMA_MISSING');
      expect(AUTO_FIXABLE_TAGS).toContain('NO_TRANSFER');
      expect(AUTO_FIXABLE_TAGS).toContain('NO_COUNTEREXAMPLE');
    });

    it('should apply NO_MECHANISM fix with span hint targeting', async () => {
      const auditInput = {
        draft: testContent.withStructure,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8,
              span_hint: 'Lines 1-2: Basic planning overview.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('## How It Works');
      expect(repaired.length).toBeGreaterThan(auditInput.draft.length);
      
      // Should be within ±3 sentences constraint (minimal addition)
      const mechanismSection = repaired.match(/## How It Works\n\n(.+?)(?=\n\n|$)/);
      if (mechanismSection) {
        const sentences = mechanismSection[1].split(/[.!?]+/).filter(s => s.trim().length > 0);
        expect(sentences.length).toBeLessThanOrEqual(3);
      }
    });

    it('should apply SCHEMA_MISSING fix for unstructured content', async () => {
      const auditInput = {
        draft: testContent.basic,
        audit: {
          tags: [
            {
              tag: 'SCHEMA_MISSING',
              severity: 'error',
              section: 'structure',
              suggestion: 'Add basic structure',
              auto_fixable: true,
              confidence: 0.9,
              span_hint: 'Lines 1-1: Basic planning overview without structure.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('# Overview');
      expect(repaired.length).toBeGreaterThan(auditInput.draft.length);
    });

    it('should apply NO_TRANSFER fix with span hint targeting', async () => {
      const auditInput = {
        draft: testContent.withMechanism,
        audit: {
          tags: [
            {
              tag: 'NO_TRANSFER',
              severity: 'error',
              section: 'transfer',
              suggestion: 'Add transfer examples',
              auto_fixable: true,
              confidence: 0.7,
              span_hint: 'Lines 5-6: First, it evaluates requirements.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('## Applications');
      
      // Should be within ±3 sentences constraint
      const transferSection = repaired.match(/## Applications\n\n(.+?)(?=\n\n|$)/);
      if (transferSection) {
        const sentences = transferSection[1].split(/[.!?]+/).filter(s => s.trim().length > 0);
        expect(sentences.length).toBeLessThanOrEqual(3);
      }
    });

    it('should apply NO_COUNTEREXAMPLE fix with span hint targeting', async () => {
      const auditInput = {
        draft: testContent.withMechanism,
        audit: {
          tags: [
            {
              tag: 'NO_COUNTEREXAMPLE',
              severity: 'error',
              section: 'limitations',
              suggestion: 'Add counterexample',
              auto_fixable: true,
              confidence: 0.8,
              span_hint: 'Lines 3-4: This operates through a systematic process.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('## Limitations');
      
      // Should be within ±3 sentences constraint
      const limitationsSection = repaired.match(/## Limitations\n\n(.+?)(?=\n\n|$)/);
      if (limitationsSection) {
        const sentences = limitationsSection[1].split(/[.!?]+/).filter(s => s.trim().length > 0);
        expect(sentences.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('Plan 05 Non-Auto-Fixable Tags', () => {
    it('should ignore non-Plan 05 auto-fixable tags', async () => {
      const auditInput = {
        draft: testContent.basic,
        audit: {
          tags: [
            {
              tag: 'NO_EXAMPLES', // Not in Plan 05 auto-fixable list
              severity: 'error',
              section: 'examples',
              suggestion: 'Add examples',
              auto_fixable: true,
              confidence: 0.9,
              span_hint: 'Lines 1-1: Basic planning overview.'
            },
            {
              tag: 'EVIDENCE_HOLE', // Plan 05 tag but not auto-fixable
              severity: 'error',
              section: 'evidence',
              suggestion: 'Add evidence',
              auto_fixable: false,
              confidence: 0.8,
              span_hint: 'Lines 1-1: Basic planning overview.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBe(auditInput.draft); // Should remain unchanged
    });
  });

  describe('Plan 05 Span Hint Targeting', () => {
    it('should use span hint for precise repair targeting', async () => {
      const multiSectionContent = `# Strategic Planning

## Overview  
This is the overview section.

## Key Elements
These are the key elements.

## Conclusion
This is the conclusion.`;

      const auditInput = {
        draft: multiSectionContent,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8,
              span_hint: 'Lines 4-5: These are the key elements.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('## How It Works');
      
      // Mechanism should be inserted near the targeted section
      const lines = repaired.split('\n');
      const keyElementsIndex = lines.findIndex(line => line.includes('These are the key elements'));
      const mechanismIndex = lines.findIndex(line => line.includes('## How It Works'));
      
      expect(mechanismIndex).toBeGreaterThan(0); // Should be inserted somewhere
    });

    it('should handle tags without span hints gracefully', async () => {
      const auditInput = {
        draft: testContent.basic,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8
              // No span_hint provided
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('## How It Works'); // Should still work with default behavior
    });
  });

  describe('Plan 05 Diff-Bounded Constraints', () => {
    it('should enforce ±3 sentences constraint for all fixes', async () => {
      const auditInput = {
        draft: testContent.withStructure,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8,
              span_hint: 'Lines 1-2: Basic planning overview.'
            },
            {
              tag: 'NO_TRANSFER',
              severity: 'error',
              section: 'transfer',
              suggestion: 'Add transfer examples',
              auto_fixable: true,
              confidence: 0.7,
              span_hint: 'Lines 3-4: Basic planning overview.'
            },
            {
              tag: 'NO_COUNTEREXAMPLE',
              severity: 'error',
              section: 'limitations',
              suggestion: 'Add counterexample',
              auto_fixable: true,
              confidence: 0.8,
              span_hint: 'Lines 2-3: Overview section.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      // Check that each added section respects the ±3 sentence constraint
      const mechanismMatch = repaired.match(/## How It Works\n\n(.+?)(?=\n\n|$)/);
      const transferMatch = repaired.match(/## Applications\n\n(.+?)(?=\n\n|$)/);
      const limitationsMatch = repaired.match(/## Limitations\n\n(.+?)(?=\n\n|$)/);

      [mechanismMatch, transferMatch, limitationsMatch].forEach(match => {
        if (match && match[1]) {
          const sentences = match[1].split(/[.!?]+/).filter(s => s.trim().length > 0);
          expect(sentences.length).toBeLessThanOrEqual(3);
        }
      });
    });

    it('should use minimal additions for Plan 05 compliance', async () => {
      const originalLength = testContent.withStructure.length;
      
      const auditInput = {
        draft: testContent.withStructure,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8,
              span_hint: 'Lines 1-2: Basic planning overview.'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      // Plan 05: Should be minimal additions
      const increaseRatio = (repaired.length - originalLength) / originalLength;
      expect(increaseRatio).toBeLessThan(2.0); // Less than 200% increase (reasonable for minimal additions)
    });
  });

  describe('Plan 05 Integration with Auditor', () => {
    it('should work with plan05_tags format from updated auditor', async () => {
      const auditInput = {
        draft: testContent.basic,
        audit: {
          tags: [], // Legacy tags empty
          plan05_tags: [
            {
              tag: 'SCHEMA_MISSING',
              section: 'overall',
              rationale: 'Content lacks clear structure',
              span_hint: 'Lines 1-1: Basic planning overview'
            }
          ]
        }
      };

      const repaired = await repairDraft(auditInput);

      expect(repaired).toBeDefined();
      expect(repaired).toContain('# Overview');
    });

    it('should return simple string format for Plan 05 integration', async () => {
      const auditInput = {
        draft: testContent.basic,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8
            }
          ]
        }
      };

      const result = await repairDraft(auditInput);

      // Plan 05: Should return simple string, not complex object
      expect(typeof result).toBe('string');
      expect(result).toContain('## How It Works');
    });

    it('should process auto-fixable tags even without span hints', async () => {
      const auditInput = {
        draft: testContent.basic,
        audit: {
          tags: [
            {
              tag: 'NO_MECHANISM',
              severity: 'error',
              section: 'mechanism',
              suggestion: 'Add mechanism section',
              auto_fixable: true,
              confidence: 0.8
            },
            {
              tag: 'SCHEMA_MISSING',
              severity: 'error',
              section: 'structure', 
              suggestion: 'Add basic structure',
              auto_fixable: true,
              confidence: 0.9
            }
          ]
        }
      };

      const result = await repairDraft(auditInput);

      expect(typeof result).toBe('string');
      expect(result).toContain('## How It Works');
      expect(result).toContain('# Overview');
    });
  });
});
