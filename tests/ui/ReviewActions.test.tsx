/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

// ABOUTME: ReviewActions Component Tests - Session 2
// ABOUTME: Tests two-step review workflow with working Jest DOM patterns

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/jest-globals';
import { ReviewActions } from '../../src/components/review/ReviewActions';

// Mock fetch for API calls
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ReviewActions', () => {
  const mockArtifactId = 'artifact-123';
  const mockArtifactTitle = 'Test Financial Advisory Content';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render approve and reject buttons', () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
          className="custom-test-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
          disabled={true}
        />
      );

      // Find the actual button elements, not the span text inside
      const approveButton = screen.getByRole('button', { name: 'Approve artifact' });
      const rejectButton = screen.getByRole('button', { name: 'Reject artifact' });

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });

  describe('Approve Workflow', () => {
    it('should show confirmation dialog when approve is clicked', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByRole('button', { name: 'Approve artifact' });
      await userEvent.click(approveButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Approve')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to approve this artifact?')).toBeInTheDocument();
    });

    it('should show rubric scoring form after confirmation', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByRole('button', { name: 'Approve artifact' });
      await userEvent.click(approveButton);

      // Find the confirmation dialog's approve button (it's inside the dialog)
      const dialog = screen.getByRole('dialog');
      const confirmButton = dialog.querySelector('button.bg-green-600') as HTMLElement;
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Add Detailed Evaluation')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Tone & Voice')).toBeInTheDocument();
      expect(screen.getByLabelText('Novelty & Insight')).toBeInTheDocument();
      expect(screen.getByLabelText('Strategic Alignment')).toBeInTheDocument();
      expect(screen.getByLabelText('Compliance Risk Assessment')).toBeInTheDocument();
    });

    it('should handle API call for approve action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: '/api/review',
        clone: () => ({} as Response),
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => '',
      } as Response);

      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByRole('button', { name: 'Approve artifact' });
      await userEvent.click(approveButton);

      const dialog = screen.getByRole('dialog');
      const confirmButton = dialog.querySelector('button.bg-green-600') as HTMLElement;
      await userEvent.click(confirmButton);

      // Skip rubric scoring
      const skipButton = screen.getByText('Skip Scoring');
      await userEvent.click(skipButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"action":"approve"')
        });
      });
    });
  });

  describe('Reject Workflow', () => {
    it('should show confirmation dialog when reject is clicked', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const rejectButton = screen.getByRole('button', { name: 'Reject artifact' });
      await userEvent.click(rejectButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to reject "Test Financial Advisory Content"?')).toBeInTheDocument();
    });

    it('should handle API call for reject action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: '/api/review',
        clone: () => ({} as Response),
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => '',
      } as Response);

      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const rejectButton = screen.getByRole('button', { name: 'Reject artifact' });
      await userEvent.click(rejectButton);

      const dialog = screen.getByRole('dialog');
      const confirmButton = dialog.querySelector('button.bg-red-600') as HTMLElement;
      await userEvent.click(confirmButton);

      // Skip rubric scoring
      const skipButton = screen.getByText('Skip Scoring');
      await userEvent.click(skipButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"action":"reject"')
        });
      });
    });
  });

  describe('Rubric Scoring', () => {
    it('should render all rubric components', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Add Detailed Evaluation')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Tone & Voice')).toBeInTheDocument();
      expect(screen.getByLabelText('Compliance Risk Assessment')).toBeInTheDocument();
    });

    it('should allow star rating selection', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Add Detailed Evaluation')).toBeInTheDocument();
      });

      const toneRating = screen.getByLabelText('Tone & Voice');
      const stars = toneRating.querySelectorAll('button');

      // Click 4th star (rating 4)
      await userEvent.click(stars[3]);

      // Check that 4 stars are filled
      const filledStars = toneRating.querySelectorAll('[data-filled="true"]');
      expect(filledStars).toHaveLength(4);
    });

    it('should allow risk assessment selection', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Add Detailed Evaluation')).toBeInTheDocument();
      });

      const riskAssessment = screen.getByLabelText('Compliance Risk Assessment');
      await userEvent.selectOptions(riskAssessment, 'medium');

      expect(riskAssessment).toHaveValue('medium');
    });

    it('should validate form before submission', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Add Detailed Evaluation')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit Evaluation');
      await userEvent.click(submitButton);

      // Should show validation error
      expect(screen.getByText('Please complete all required fields')).toBeInTheDocument();
    });
  });

  describe('Dialog Interactions', () => {
    it('should close confirmation dialog when cancel is clicked', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close rubric scoring dialog when skip is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: '/api/review',
        clone: () => ({} as Response),
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => '',
      } as Response);

      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Add Detailed Evaluation')).toBeInTheDocument();
      });

      const skipButton = screen.getByText('Skip Scoring');
      await userEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.queryByText('Add Detailed Evaluation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      const skipButton = screen.getByText('Skip Scoring');
      await userEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show retry option on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const confirmButton = screen.getByText('Approve');
      await userEvent.click(confirmButton);

      const skipButton = screen.getByText('Skip Scoring');
      await userEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Fix fetch and retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: '/api/review',
        clone: () => ({} as Response),
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => '',
      } as Response);

      const retryButton = screen.getByText('Try Again');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByRole('button', { name: 'Approve artifact' });
      const rejectButton = screen.getByRole('button', { name: 'Reject artifact' });

      expect(approveButton).toHaveAttribute('aria-label', 'Approve artifact');
      expect(rejectButton).toHaveAttribute('aria-label', 'Reject artifact');
    });

    it('should have proper ARIA attributes for dialogs', async () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      const heading = screen.getByRole('heading', { name: 'Confirm Approve' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes', () => {
      const { container } = render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex', 'gap-2');
    });

    it('should render buttons with correct styling', () => {
      render(
        <ReviewActions
          artifactId={mockArtifactId}
          artifactTitle={mockArtifactTitle}
        />
      );

      const approveButton = screen.getByRole('button', { name: 'Approve artifact' });
      const rejectButton = screen.getByRole('button', { name: 'Reject artifact' });

      expect(approveButton).toHaveClass('bg-green-600', 'hover:bg-green-700');
      expect(rejectButton).toHaveClass('bg-red-600', 'hover:bg-red-700');
    });
  });
});