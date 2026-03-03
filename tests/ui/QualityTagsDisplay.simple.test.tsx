/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// ABOUTME: QualityTagsDisplay Component Tests - Simple version
// ABOUTME: Tests display of 10 critical audit tags, severity levels, and expandable details

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
        rationale: 'The content does not explain how the framework operates.',
        span_hint: 'Lines 15-20: Framework description section',
        evidence: 'Missing explanation of the step-by-step process'
      },
      {
        tag: 'NO_TRANSFER',
        severity: 'warning' as const,
        rationale: 'No examples showing how this concept applies to different domains.',
        span_hint: 'Section: Applications'
      },
      {
        tag: 'CONTEXT_DEGRADED',
        severity: 'info' as const,
        rationale: 'Context information seems incomplete.',
        evidence: 'Background information lacks proper sourcing'
      }
    ]
  };

  const mockLedgerEmpty = {
    audit_tags: []
  };

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
      render(<QualityTagsDisplay ledger={{}} />);

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
  });

  describe('Tag Expansion', () => {
    it('should expand tag details when expand button is clicked', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
      expect(expandButtons).toHaveLength(3);

      // Click first expand button
      fireEvent.click(expandButtons[0]);

      expect(screen.getByText('Rationale')).toBeInTheDocument();
      expect(screen.getAllByText('The content does not explain how the framework operates.').length).toBeGreaterThan(0);
      expect(screen.getByText('Location Hint')).toBeInTheDocument();
      expect(screen.getByText('Lines 15-20: Framework description section')).toBeInTheDocument();
      expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
      expect(screen.getByText('Missing explanation of the step-by-step process')).toBeInTheDocument();
    });

    it('should expand multiple tags independently', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');

      // Expand first tag
      fireEvent.click(expandButtons[0]);
      expect(screen.getByText('Rationale')).toBeInTheDocument();

      // Expand second tag
      fireEvent.click(expandButtons[1]);
      expect(screen.getAllByText('No examples showing how this concept applies to different domains.').length).toBeGreaterThan(0);

      // First tag should still be expanded
      expect(screen.getByText('Lines 15-20: Framework description section')).toBeInTheDocument();
    });

    it('should show technical details in expanded view', () => {
      render(<QualityTagsDisplay ledger={mockLedgerWithTags} />);

      const expandButtons = screen.getAllByRole('button');
      fireEvent.click(expandButtons[0]);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Tag ID:')).toBeInTheDocument();
      expect(screen.getByText('NO_MECHANISM')).toBeInTheDocument();
      expect(screen.getByText('Severity:')).toBeInTheDocument();
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

      const unknownTag = screen.getByText('Unknown Tag: UNKNOWN_TAG').closest('div')?.parentElement;
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
});
