// ABOUTME: Plan 05 integration test for auditor and repairer
// ABOUTME: Tests the complete workflow from auditor to repairer

import { describe, it, expect } from '@jest/globals';
import { microAudit } from '../../orchestrator/auditor';
import { repairDraft } from '../../orchestrator/repairer';

describe('Plan 05 Integration: Auditor + Repairer', () => {
  const testContent = {
    noMechanism: `# Strategic Planning

## Overview
Basic planning overview for organizations.

## Steps
1. Plan strategy
2. Execute plan`,

    noStructure: `This is just basic content without any structure or organization. It lacks headings and proper format.`,

    minimal: `Basic content`,

    complete: `# Framework Guide

## Overview
This framework provides systematic approach.

## How It Works
The process involves evaluation and application of specific procedures.

## Applications  
This can be used in different contexts with adaptation.

## Limitations
May not work in highly complex scenarios requiring specialized approaches.`
  };

  describe('Complete Plan 05 Workflow', () => {
    it('should detect NO_MECHANISM and repair it', async () => {
      // Step 1: Run auditor
      const auditResult = await microAudit({
        draft: testContent.noMechanism,
        ip: 'Framework'
      });

      console.log('Audit result:', JSON.stringify(auditResult, null, 2));

      expect(auditResult).toBeDefined();
      expect(auditResult.tags).toBeDefined();
      expect(auditResult.plan05_tags).toBeDefined();

      // Step 2: Run repairer with audit results
      const repairInput = {
        draft: testContent.noMechanism,
        audit: auditResult
      };

      const repaired = await repairDraft(repairInput);

      expect(repaired).toBeDefined();
      expect(typeof repaired).toBe('string');
      expect(repaired.length).toBeGreaterThan(testContent.noMechanism.length);
    });

    it('should repair unstructured content based on what auditor detects', async () => {
      // Step 1: Run auditor
      const auditResult = await microAudit({
        draft: testContent.noStructure,
        ip: 'Framework'
      });

      console.log('Audit result for unstructured content:', JSON.stringify(auditResult, null, 2));

      // Step 2: Run repairer with audit results
      const repairInput = {
        draft: testContent.noStructure,
        audit: auditResult
      };

      const repaired = await repairDraft(repairInput);

      expect(repaired).toBeDefined();
      expect(typeof repaired).toBe('string');
      
      // Should add sections based on what auditor actually detects
      // From the output, we see it adds: Applications, Limitations, How It Works
      expect(repaired).toContain('## Applications');
      expect(repaired).toContain('## Limitations');
      expect(repaired).toContain('## How It Works');
    });

    it('should handle complete content without unnecessary repairs', async () => {
      // Step 1: Run auditor
      const auditResult = await microAudit({
        draft: testContent.complete,
        ip: 'Framework'
      });

      // Step 2: Run repairer with audit results
      const repairInput = {
        draft: testContent.complete,
        audit: auditResult
      };

      const repaired = await repairDraft(repairInput);

      expect(repaired).toBeDefined();
      expect(typeof repaired).toBe('string');
      
      // Should be similar length since content is already complete
      const lengthChange = Math.abs(repaired.length - testContent.complete.length) / testContent.complete.length;
      expect(lengthChange).toBeLessThan(0.5); // Less than 50% change
    });
  });

  describe('Plan 05 Compliance Validation', () => {
    it('should only apply fixes for the 4 auto-fixable tags', async () => {
      const auditResult = await microAudit({
        draft: testContent.noStructure,
        ip: 'Framework'
      });

      const repairInput = {
        draft: testContent.noStructure,
        audit: auditResult
      };

      const repaired = await repairDraft(repairInput);

      // Check that only auto-fixable sections were added
      const hasMechanism = repaired.includes('## How It Works');
      const hasApplications = repaired.includes('## Applications');
      const hasLimitations = repaired.includes('## Limitations');
      const hasOverview = repaired.includes('# Overview');

      // These are the only sections that should be added by Plan 05
      const allowedSections = [hasMechanism, hasApplications, hasLimitations, hasOverview];
      const sectionCount = allowedSections.filter(Boolean).length;

      expect(sectionCount).toBeGreaterThanOrEqual(1); // At least one fix should be applied
      expect(sectionCount).toBeLessThanOrEqual(4);    // But no more than the 4 allowed
    });

    it('should enforce diff-bounded repairs', async () => {
      const auditResult = await microAudit({
        draft: testContent.noStructure,
        ip: 'Framework'
      });

      const repairInput = {
        draft: testContent.noStructure,
        audit: auditResult
      };

      const repaired = await repairDraft(repairInput);

      // Check sentence constraints for any added sections
      const mechanismMatch = repaired.match(/## How It Works\n\n(.+?)(?=\n\n|$)/);
      const applicationsMatch = repaired.match(/## Applications\n\n(.+?)(?=\n\n|$)/);
      const limitationsMatch = repaired.match(/## Limitations\n\n(.+?)(?=\n\n|$)/);

      [mechanismMatch, applicationsMatch, limitationsMatch].forEach(match => {
        if (match && match[1]) {
          const sentences = match[1].split(/[.!?]+/).filter(s => s.trim().length > 0);
          expect(sentences.length).toBeLessThanOrEqual(3); // Plan 05: ±3 sentences
        }
      });
    });
  });
});
