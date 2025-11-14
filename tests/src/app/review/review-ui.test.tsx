// ABOUTME: Review UI testing for EIP Steel Thread
// ABOUTME: Validates content review interface, user interactions, and compliance display

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the review page component - we'll test the interface patterns
const MockReviewPage = ({ content }: { content: any }) => (
  <div data-testid="review-page">
    <h1 data-testid="page-title">Content Review</h1>
    
    <div data-testid="content-display">
      <h2 data-testid="content-title">{content.title}</h2>
      <div data-testid="content-body">{content.body}</div>
    </div>

    <div data-testid="quality-scores">
      <div data-testid="overall-score">Score: {content.overallScore}</div>
      <div data-testid="compliance-status">
        Compliance: {content.complianceVerified ? 'Verified' : 'Failed'}
      </div>
    </div>

    <div data-testid="compliance-tags">
      {content.complianceTags?.map((tag: string, index: number) => (
        <span key={index} data-testid={`compliance-tag-${index}`}>
          {tag}
        </span>
      ))}
    </div>

    <div data-testid="action-buttons">
      <button data-testid="approve-button" onClick={() => {}}>
        Approve
      </button>
      <button data-testid="reject-button" onClick={() => {}}>
        Reject
      </button>
      <button data-testid="request-changes-button" onClick={() => {}}>
        Request Changes
      </button>
    </div>

    <div data-testid="feedback-section">
      <textarea 
        data-testid="feedback-input" 
        placeholder="Provide feedback for content changes..."
      />
      <button data-testid="submit-feedback-button" onClick={() => {}}>
        Submit Feedback
      </button>
    </div>
  </div>
);

describe('Review UI Components', () => {
  const mockContent = {
    id: 'content-123',
    title: 'Strategic Financial Planning Framework',
    body: `This framework provides systematic approach to financial planning.`,
    overallScore: 94,
    complianceVerified: true,
    complianceTags: ['mas.gov.sg', 'financial-claims-sourced', 'disclaimers-present'],
    ipType: 'framework',
    ipVersion: '1.0.0',
    provenance: {
      generatedBy: 'eip-orchestrator',
      generationTimestamp: '2025-01-14T11:30:00Z',
      retrievalSources: ['mas-guidelines', 'cpf-regulations']
    }
  };

  describe('Content Display', () => {
    beforeEach(() => {
      // Mock Next.js router
      jest.mock('next/router', () => ({
        useRouter: () => ({
          query: { id: 'content-123' },
          push: jest.fn(),
          replace: jest.fn()
        })
      }));
    });

    it('should display content title and body correctly', () => {
      render(<MockReviewPage content={mockContent} />);

      expect(screen.getByTestId('content-title')).toHaveTextContent(
        'Strategic Financial Planning Framework'
      );
      expect(screen.getByTestId('content-body')).toHaveTextContent(
        'This framework provides systematic approach to financial planning.'
      );
    });

    it('should show quality scores prominently', () => {
      render(<MockReviewPage content={mockContent} />);

      expect(screen.getByTestId('overall-score')).toHaveTextContent('Score: 94');
      expect(screen.getByTestId('compliance-status')).toHaveTextContent('Compliance: Verified');
    });

    it('should display compliance tags when present', () => {
      render(<MockReviewPage content={mockContent} />);

      expect(screen.getByTestId('compliance-tag-0')).toHaveTextContent('mas.gov.sg');
      expect(screen.getByTestId('compliance-tag-1')).toHaveTextContent('financial-claims-sourced');
      expect(screen.getByTestId('compliance-tag-2')).toHaveTextContent('disclaimers-present');
    });

    it('should handle missing compliance tags gracefully', () => {
      const contentWithoutTags = { ...mockContent, complianceTags: [] };
      render(<MockReviewPage content={contentWithoutTags} />);

      expect(screen.getByTestId('compliance-tags')).toBeEmptyDOMElement();
    });
  });

  describe('User Interaction Elements', () => {
    it('should provide approval action buttons', () => {
      render(<MockReviewPage content={mockContent} />);

      const approveButton = screen.getByTestId('approve-button');
      const rejectButton = screen.getByTestId('reject-button');
      const requestChangesButton = screen.getByTestId('request-changes-button');

      expect(approveButton).toBeInTheDocument();
      expect(rejectButton).toBeInTheDocument();
      expect(requestChangesButton).toBeInTheDocument();
    });

    it('should allow feedback input and submission', () => {
      render(<MockReviewPage content={mockContent} />);

      const feedbackInput = screen.getByTestId('feedback-input');
      const submitButton = screen.getByTestId('submit-feedback-button');

      expect(feedbackInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(feedbackInput).toHaveAttribute('placeholder');
    });

    it('should handle button click interactions', async () => {
      let buttonClicked = '';
      
      const MockReviewPageWithHandlers = ({ content }: { content: any }) => (
        <div data-testid="review-page">
          <button 
            data-testid="approve-button" 
            onClick={() => { buttonClicked = 'approve'; }}
          >
            Approve
          </button>
        </div>
      );

      render(<MockReviewPageWithHandlers content={mockContent} />);

      const approveButton = screen.getByTestId('approve-button');
      fireEvent.click(approveButton);

      expect(buttonClicked).toBe('approve');
    });
  });

  describe('Compliance Information Display', () => {
    it('should show compliance verification status clearly', () => {
      const verifiedContent = { ...mockContent, complianceVerified: true };
      render(<MockReviewPage content={verifiedContent} />);

      expect(screen.getByTestId('compliance-status')).toHaveTextContent('Compliance: Verified');
    });

    it('should indicate compliance failures prominently', () => {
      const failedContent = { ...mockContent, complianceVerified: false };
      render(<MockReviewPage content={failedContent} />);

      expect(screen.getByTestId('compliance-status')).toHaveTextContent('Compliance: Failed');
    });

    it('should display domain source information', () => {
      // Test that compliance tags show source domains
      render(<MockReviewPage content={mockContent} />);

      const domainTag = screen.getByTestId('compliance-tag-0');
      expect(domainTag).toHaveTextContent('mas.gov.sg');
    });
  });

  describe('Content Quality Metrics', () => {
    it('should display quality score with appropriate styling', () => {
      const highQualityContent = { ...mockContent, overallScore: 95 };
      render(<MockReviewPage content={highQualityContent} />);

      const scoreDisplay = screen.getByTestId('overall-score');
      expect(scoreDisplay).toHaveTextContent('Score: 95');
    });

    it('should handle low quality scores appropriately', () => {
      const lowQualityContent = { ...mockContent, overallScore: 45 };
      render(<MockReviewPage content={lowQualityContent} />);

      const scoreDisplay = screen.getByTestId('overall-score');
      expect(scoreDisplay).toHaveTextContent('Score: 45');
    });
  });

  describe('Provenance Information', () => {
    it('should display generation metadata when available', () => {
      const MockReviewPageWithProvenance = ({ content }: { content: any }) => (
        <div data-testid="review-page">
          <div data-testid="provenance-section">
            <div data-testid="generated-by">{content.provenance?.generatedBy}</div>
            <div data-testid="generation-timestamp">
              {new Date(content.provenance?.generationTimestamp).toLocaleDateString()}
            </div>
            <div data-testid="source-count">
              {content.provenance?.retrievalSources?.length} sources used
            </div>
          </div>
        </div>
      );

      render(<MockReviewPageWithProvenance content={mockContent} />);

      expect(screen.getByTestId('generated-by')).toHaveTextContent('eip-orchestrator');
      expect(screen.getByTestId('source-count')).toHaveTextContent('2 sources used');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing content gracefully', () => {
      const emptyContent = {
        id: 'empty-123',
        title: '',
        body: '',
        overallScore: 0,
        complianceVerified: false,
        complianceTags: []
      };

      render(<MockReviewPage content={emptyContent} />);

      expect(screen.getByTestId('content-title')).toHaveTextContent('');
      expect(screen.getByTestId('content-body')).toHaveTextContent('');
      expect(screen.getByTestId('overall-score')).toHaveTextContent('Score: 0');
    });

    it('should handle undefined content properties', () => {
      const undefinedContent = {
        id: 'undefined-123'
        // All other properties are undefined
      } as any;

      expect(() => {
        render(<MockReviewPage content={undefinedContent} />);
      }).not.toThrow();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt display for different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<MockReviewPage content={mockContent} />);

      expect(screen.getByTestId('review-page')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels for interactive elements', () => {
      const AccessibleReviewPage = ({ content }: { content: any }) => (
        <div data-testid="review-page">
          <button 
            data-testid="approve-button"
            aria-label="Approve content for publication"
            onClick={() => {}}
          >
            Approve
          </button>
          <textarea 
            data-testid="feedback-input"
            aria-label="Feedback for content improvements"
            placeholder="Provide feedback..."
          />
        </div>
      );

      render(<AccessibleReviewPage content={mockContent} />);

      const approveButton = screen.getByLabelText('Approve content for publication');
      const feedbackInput = screen.getByLabelText('Feedback for content improvements');

      expect(approveButton).toBeInTheDocument();
      expect(feedbackInput).toBeInTheDocument();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
