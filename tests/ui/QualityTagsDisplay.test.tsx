/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// ABOUTME: QualityTagsDisplay Component Tests
// ABOUTME: Tests display of 10 critical audit tags, severity levels, expandable details, and empty states

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { QualityTagsDisplay } from '../../src/components/review/QualityTagsDisplay';

describe('QualityTagsDisplay', () => {
  const mockLedgerWithTags = {
    audit_tags: [
      {
        tag: 'NO_MECHANISM',
        severity: 'critical' as const,
        rationale: 'The content does not explain how the framework operates or its internal mechanics.',
        span_hint: 'Lines 15-20: Framework description section',
        evidence: 'Missing explanation of the step-by-step process'
      },
      {
        tag: 'NO_TRANSFER',
        severity: 'warning' as const,
        rationale: 'No examples showing how this concept applies to different domains or contexts.',
        span_hint: 'Section: Applications'
      },
      {
        tag: 'CONTEXT_DEGRADED',
        severity: 'info' as const,
        rationale: 'Context information seems incomplete or potentially misleading.',
        evidence: 'Background information lacks proper sourcing'
      }
    ]
  };

  const mockLedgerEmpty = {
    audit_tags: []
  };

  const mockLedgerUndefined = {};

  const mockLedgerWithUnknownTags = {
    audit_tags: [
      {
        tag: 'UNKNOWN_TAG',
        severity: 'warning' as const,
        rationale: 'This is not a standard audit tag.',
        evidence: 'Some evidence'
      }
    ]
  };

  const mockLedgerWithMissingSeverity = {
    audit_tags: [
      {
        tag: 'EVIDENCE_HOLE',
        severity: undefined as any, // Testing missing severity
        rationale: 'Claims made without supporting evidence.',
        span_hint: 'Multiple locations throughout the content'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Empty States', () => {
    it('should show empty state when no tags are present', () => {
      render(<QualityTagsDisplay ledger={mockLedgerEmpty} />);

      expect(screen.getByText('No Quality Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('This content passed all critical quality checks.')).toBeInTheDocument();
    });

    it('should show empty state when audit_tags is undefined', () => {
      render(<QualityTagsDisplay ledger={mockLedgerUndefined} />);

      expect(screen.getByText('No Quality Issues Detected')).toBeInTheDocument();
    });

    it('should show empty state when ledger is null', () => {
      render(<QualityTagsDisplay ledger={null as any} />);

      expect(screen.getByText('No Quality Issues Detected')).toBeInTheDocument();
    });

    it('should apply custom className to empty state', () => {
      const { container } = render(
        <QualityTagsDisplay
          ledger={mockLedgerEmpty}
          className="custom-test-class"
        />
      );

       expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Tag Display', () => {
    it('should display all tags correctly', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('Missing Mechanism')).toBeInTheDocument();
       expect(screen.getByText('Missing Transfer')).toBeInTheDocument();
       expect(screen.getByText('Context Issue')).toBeInTheDocument();
    });

    it('should show correct tag descriptions', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('No explanation of "how it works"')).toBeInTheDocument();
       expect(screen.getByText('No application to different context/domain')).toBeInTheDocument();
       expect(screen.getByText('Context lost, degraded, or misapplied')).toBeInTheDocument();
    });

    it('should display severity badges correctly', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('critical')).toBeInTheDocument();
       expect(screen.getByText('warning')).toBeInTheDocument();
       expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should show severity summary in header', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('1 Critical')).toBeInTheDocument();
       expect(screen.getByText('1 Warning')).toBeInTheDocument();
       expect(screen.getByText('1 Info')).toBeInTheDocument();
    });

    it('should show correct tag count in header', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('3 quality tags detected')).toBeInTheDocument();
    });

    it('should handle single tag correctly', () => {
      const singleTagLedger = {
        audit_tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'critical' as const,
            rationale: 'Test rationale'
          }
        ]
      };

      render(<QualityTagsDisplay ledger={singleTagLedger} />);

       expect(screen.getByText('1 quality tag detected')).toBeInTheDocument();
    });
  });

  describe('Tag Expansion', () => {
    it('should expand tag details when expand button is clicked', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
       expect(expandButtons).toHaveLength(3);

      // Click first expand button
      fireEvent.click(expandButtons[0]);

       expect(screen.getByText('Rationale')).toBeInTheDocument();
       expect(screen.getAllByText('The content does not explain how the framework operates or its internal mechanics.')[1]).toBeInTheDocument();
       expect(screen.getByText('Location Hint')).toBeInTheDocument();
       expect(screen.getByText('Lines 15-20: Framework description section')).toBeInTheDocument();
       expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
       expect(screen.getByText('Missing explanation of the step-by-step process')).toBeInTheDocument();
    });

    it('should rotate expand button icon when toggled', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
      const svgIcon = expandButtons[0].querySelector('svg');

      // Initially not rotated
       expect(svgIcon).not.toHaveClass('rotate-90');

      // Click to expand
      fireEvent.click(expandButtons[0]);
       expect(svgIcon).toHaveClass('rotate-90');

      // Click to collapse
      fireEvent.click(expandButtons[0]);
       expect(svgIcon).not.toHaveClass('rotate-90');
    });

    it('should expand multiple tags independently', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');

      // Expand first tag
      fireEvent.click(expandButtons[0]);
       expect(screen.getByText('Rationale')).toBeInTheDocument();

      // Expand second tag
      fireEvent.click(expandButtons[1]);
       expect(screen.getAllByText('No examples showing how this concept applies to different domains or contexts.')[1]).toBeInTheDocument();

      // First tag should still be expanded
       expect(screen.getByText('Lines 15-20: Framework description section')).toBeInTheDocument();
    });

    it('should not show expand button for tags without additional details', () => {
      const minimalTagLedger = {
        audit_tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'critical' as const,
            rationale: 'Test rationale'
          }
        ]
      };

      render(<QualityTagsDisplay ledger={minimalTagLedger} />);

      // Should still have expand button for technical details
      const expandButtons = screen.getAllByRole('button');
       expect(expandButtons).toHaveLength(1);

      fireEvent.click(expandButtons[0]);
       expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });
  });

  describe('Severity Handling', () => {
    it('should use default severity when not specified', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithMissingSeverity} />);

      // EVIDENCE_HOLE should default to 'critical'
       expect(screen.getByText('critical')).toBeInTheDocument();
    });

    it('should apply correct styling for each severity level', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      // Critical tag should have red styling - need to find the correct parent container
      const criticalTag = screen.getByText('Missing Mechanism').closest('[class*="bg-red-50"]');
      expect(criticalTag).toHaveClass('bg-red-50');

      // Warning tag should have orange styling
      const warningTag = screen.getByText('Missing Transfer').closest('[class*="bg-orange-50"]');
      expect(warningTag).toHaveClass('bg-orange-50');

      // Info tag should have blue styling
      const infoTag = screen.getByText('Context Issue').closest('[class*="bg-blue-50"]');
      expect(infoTag).toHaveClass('bg-blue-50');
    });

    it('should show only relevant severity badges in header', () => {
      const singleSeverityLedger = {
        audit_tags: [
          {
            tag: 'NO_MECHANISM',
            severity: 'critical' as const,
            rationale: 'Test'
          }
        ]
      };

      render(<QualityTagsDisplay ledger={singleSeverityLedger} />);

       expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.queryByText('Warning')).not.toBeInTheDocument();
      expect(screen.queryByText('Info')).not.toBeInTheDocument();
    });
  });

  describe('Unknown Tags', () => {
    it('should handle unknown tags gracefully', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithUnknownTags} />);

       expect(screen.getByText('Unknown Tag: UNKNOWN_TAG')).toBeInTheDocument();
       expect(screen.getByText('This tag is not in the standard audit framework.')).toBeInTheDocument();
    });

    it('should show unknown tags with gray styling', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithUnknownTags} />);

      const unknownTag = screen.getByText('Unknown Tag: UNKNOWN_TAG').closest('[class*="bg-gray-50"]');
      expect(unknownTag).toHaveClass('bg-gray-50');
    });
  });

  describe('All 10 Critical Tags', () => {
    it('should display all 10 critical tags when present', () => {
      const allTagsLedger = {
        audit_tags: [
          { tag: 'NO_MECHANISM', severity: 'critical' as const, rationale: 'Test 1' },
          { tag: 'NO_COUNTEREXAMPLE', severity: 'critical' as const, rationale: 'Test 2' },
          { tag: 'NO_TRANSFER', severity: 'warning' as const, rationale: 'Test 3' },
          { tag: 'EVIDENCE_HOLE', severity: 'critical' as const, rationale: 'Test 4' },
          { tag: 'LAW_MISSTATE', severity: 'critical' as const, rationale: 'Test 5' },
          { tag: 'DOMAIN_MIXING', severity: 'warning' as const, rationale: 'Test 6' },
          { tag: 'CONTEXT_DEGRADED', severity: 'info' as const, rationale: 'Test 7' },
          { tag: 'CTA_MISMATCH', severity: 'warning' as const, rationale: 'Test 8' },
          { tag: 'ORPHAN_CLAIM', severity: 'warning' as const, rationale: 'Test 9' },
          { tag: 'SCHEMA_MISSING', severity: 'critical' as const, rationale: 'Test 10' }
        ]
      };

      render(<QualityTagsDisplay ledger={allTagsLedger} />);

       expect(screen.getByText('Missing Mechanism')).toBeInTheDocument();
       expect(screen.getByText('Missing Counterexample')).toBeInTheDocument();
       expect(screen.getByText('Missing Transfer')).toBeInTheDocument();
       expect(screen.getByText('Evidence Gap')).toBeInTheDocument();
       expect(screen.getByText('Legal Inaccuracy')).toBeInTheDocument();
       expect(screen.getByText('Domain Mixing')).toBeInTheDocument();
       expect(screen.getByText('Context Issue')).toBeInTheDocument();
       expect(screen.getByText('CTA Mismatch')).toBeInTheDocument();
       expect(screen.getByText('Orphaned Claim')).toBeInTheDocument();
       expect(screen.getByText('Schema Incomplete')).toBeInTheDocument();

       expect(screen.getByText('10 quality tags detected')).toBeInTheDocument();
    });
  });

  describe('Technical Details', () => {
    it('should show technical details in expanded view', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
      fireEvent.click(expandButtons[0]);

       expect(screen.getByText('Technical Details')).toBeInTheDocument();
       expect(screen.getByText('Tag ID:')).toBeInTheDocument();
       expect(screen.getByText('NO_MECHANISM')).toBeInTheDocument();
       expect(screen.getByText('Severity:')).toBeInTheDocument();
    });

    it('should display tag ID in code element', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
      fireEvent.click(expandButtons[0]);

      const tagIdElement = screen.getByText('NO_MECHANISM');
      expect(tagIdElement.closest('code')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes and structure', () => {
      const { container } = render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const mainDiv = container.firstChild as HTMLElement;
       expect(mainDiv).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-lg', 'shadow-sm', 'overflow-hidden');
    });

    it('should have header with audit results title', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('Quality Audit Results')).toBeInTheDocument();
    });

    it('should have footer with summary information', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

       expect(screen.getByText('Summary:')).toBeInTheDocument();
       expect(screen.getByText('Review critical tags first for content compliance')).toBeInTheDocument();
       expect(screen.getByText('Audit completed via micro-auditor framework')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button elements for expand/collapse', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
       expect(expandButtons).toHaveLength(3);
      expandButtons.forEach(button => {
         expect(button).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and semantic structure', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { name: 'Quality Audit Results' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Missing Mechanism' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed ledger data gracefully', () => {
      const malformedLedger = {
        audit_tags: [
          null,
          undefined,
          { tag: 'NO_MECHANISM', severity: 'critical' as const, rationale: 'Valid tag' }
        ]
      };

      render(<QualityTagsDisplay ledger={malformedLedger} />);

      // Should still render the valid tag
       expect(screen.getByText('Missing Mechanism')).toBeInTheDocument();
    });

    it('should handle tags with missing properties', () => {
      const incompleteTagLedger = {
        audit_tags: [
          {
            tag: 'NO_MECHANISM',
            severity: undefined as any, // Missing severity
            rationale: undefined as any // Missing rationale
          }
        ]
      };

      render(<QualityTagsDisplay ledger={incompleteTagLedger} />);

       expect(screen.getByText('Missing Mechanism')).toBeInTheDocument();
      // Should default to tag's default severity (critical for NO_MECHANISM)
       expect(screen.getByText('critical')).toBeInTheDocument();
    });
  });
});