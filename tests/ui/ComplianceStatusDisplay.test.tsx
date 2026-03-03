/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// ABOUTME: ComplianceStatusDisplay Component Tests - Session 2
// ABOUTME: Tests Singapore regulatory compliance display with working Jest DOM patterns

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { ComplianceStatusDisplay, ComplianceReport, ComplianceViolation } from '../../src/components/review/ComplianceStatusDisplay';

describe('ComplianceStatusDisplay', () => {
  const mockComplianceReport: ComplianceReport = {
    status: 'compliant',
    overall_score: 95,
    violations: [],
    authority_level: 'high',
    evidence_summary: {
      total_sources: 5,
      accessible_sources: 5,
      high_authority_sources: 4,
      stale_sources: 0
    },
    timestamp: new Date('2025-01-20T10:30:00Z'),
    processing_time_ms: 2500
  };

  const mockComplianceReportWithViolations: ComplianceReport = {
    status: 'violations_detected',
    overall_score: 75,
    violations: [
      {
        type: 'unapproved_source',
        severity: 'high',
        description: 'Source from non-allow-list domain detected',
        affected_element: 'example.com',
        penalty_points: 15,
        suggested_fix: 'Replace with source from approved domain list'
      }
    ],
    authority_level: 'medium',
    evidence_summary: {
      total_sources: 3,
      accessible_sources: 2,
      high_authority_sources: 1,
      stale_sources: 1
    },
    timestamp: new Date('2025-01-20T10:30:00Z'),
    processing_time_ms: 3200
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render compliance report correctly', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      expect(screen.getByText('Singapore Regulatory Compliance')).toBeInTheDocument();
      expect(screen.getAllByText('COMPLIANT')[0]).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('should show empty state when compliance data is null', () => {
      render(<ComplianceStatusDisplay complianceData={null} />);

      expect(screen.getByText('Compliance Data Unavailable')).toBeInTheDocument();
      expect(screen.getByText('No compliance information available for this artifact.')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ComplianceStatusDisplay
          complianceData={mockComplianceReport}
          className="custom-test-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Compliance Status Display', () => {
    it('should show compliant status with green styling', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      const statusBadge = screen.getAllByText('COMPLIANT')[0];
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should show violations detected status', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReportWithViolations} />);

      // Use getAllByText since there are multiple "VIOLATIONS DETECTED" elements (header badge + footer)
      expect(screen.getAllByText('VIOLATIONS DETECTED')).toHaveLength(2);
      expect(screen.getByText('Compliance Violations (1)')).toBeInTheDocument();
    });

    it('should display authority level correctly', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      expect(screen.getByText('HIGH AUTHORITY')).toBeInTheDocument();
      expect(screen.getByText('Based on Singapore regulatory domain compliance (MAS, IRAS, .gov, .edu)')).toBeInTheDocument();
    });
  });

  describe('Evidence Summary', () => {
    it('should display evidence summary statistics', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      expect(screen.getAllByText('5')[0]).toBeInTheDocument(); // Total sources
      expect(screen.getAllByText('5')[1]).toBeInTheDocument(); // Accessible sources
      expect(screen.getByText('4')).toBeInTheDocument(); // High authority sources
      expect(screen.getByText('0')).toBeInTheDocument(); // Stale sources

      expect(screen.getByText('Total Sources')).toBeInTheDocument();
      expect(screen.getByText('High Authority')).toBeInTheDocument();
    });
  });

  describe('Violations Display', () => {
    it('should display violation details', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReportWithViolations} />);

      expect(screen.getByText('Source from non-allow-list domain detected')).toBeInTheDocument();

      // These elements might be inside the violation card, need to be more specific
      const violationCard = screen.getByText('Source from non-allow-list domain detected').closest('[class*="border"]');
      expect(violationCard).toContainHTML('unapproved source');
      expect(violationCard).toContainHTML('high');
      expect(violationCard).toContainHTML('-15 pts');
    });

    it('should expand violation details when clicked', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReportWithViolations} />);

      const expandButtons = screen.getAllByRole('button');
      expect(expandButtons).toHaveLength(1);

      fireEvent.click(expandButtons[0]);

      expect(screen.getByText('Suggested Fix:')).toBeInTheDocument();
      expect(screen.getByText('Replace with source from approved domain list')).toBeInTheDocument();
    });

    it('should not show violations section when there are no violations', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      expect(screen.queryByText('Compliance Violations')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes and structure', () => {
      const { container } = render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-lg', 'shadow-sm', 'overflow-hidden');
    });

    it('should have gradient header', () => {
      const { container } = render(<ComplianceStatusDisplay complianceData={mockComplianceReport} />);

      const header = container.querySelector('.bg-gradient-to-r');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('from-blue-50', 'to-indigo-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on expand buttons', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReportWithViolations} />);

      const expandButtons = screen.getAllByRole('button');
      expect(expandButtons[0]).toHaveAttribute('aria-label', 'Expand details');

      fireEvent.click(expandButtons[0]);
      expect(expandButtons[0]).toHaveAttribute('aria-label', 'Collapse details');
    });

    it('should have proper heading hierarchy', () => {
      render(<ComplianceStatusDisplay complianceData={mockComplianceReportWithViolations} />);

      expect(screen.getByRole('heading', { name: 'Singapore Regulatory Compliance' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Domain Authority Level' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Compliance Violations (1)' })).toBeInTheDocument();
    });
  });
});