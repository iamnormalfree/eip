// ABOUTME: Review Artifact Card Component - Individual artifact review interface
// ABOUTME: Shows content, ledger, audit tags and provides approve/reject actions

'use client';

import { useState } from 'react';
import { Database } from '../../../lib_supabase/db/types/database.types';

type EipArtifact = Database['public']['Tables']['eip_artifacts']['Row'];

interface ReviewArtifactCardProps {
  artifact: EipArtifact;
}

export function ReviewArtifactCard({ artifact }: ReviewArtifactCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [reviewResult, setReviewResult] = useState<{ action: string; success: boolean } | null>(null);

  const handleReview = async (action: 'approve' | 'reject') => {
    setIsLoading(true);
    setReviewResult(null);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifactId: artifact.id,
          action,
          feedback: feedback.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setReviewResult({ action, success: true });
      } else {
        setReviewResult({ action, success: false });
        console.error('Review action failed:', result.error);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewResult({ action, success: false });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const extractTitle = () => {
    return artifact.frontmatter?.title || 'Untitled Content';
  };

  const extractPersona = () => {
    return artifact.frontmatter?.persona || 'default';
  };

  const extractFunnel = () => {
    return artifact.frontmatter?.funnel || 'general';
  };

  // Extract audit tags from ledger
  const extractAuditTags = () => {
    const ledger = artifact.ledger as any;
    if (ledger?.audit_tags) {
      return Array.isArray(ledger.audit_tags) ? ledger.audit_tags : [];
    }
    return [];
  };

  const auditTags = extractAuditTags();
  const hasAuditTags = auditTags.length > 0;

  if (reviewResult?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800">
              Successfully {reviewResult.action}ed
            </h3>
            <p className="text-green-600">
              "{extractTitle()}" has been {reviewResult.action}ed and removed from the review queue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {extractTitle()}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>ID: {artifact.id.substring(0, 8)}...</span>
              <span>Created: {formatDate(artifact.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {extractPersona()}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              {extractFunnel()}
            </span>
          </div>
        </div>

        {/* Expand/Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg
            className={`w-4 h-4 mr-1 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {isExpanded ? 'Hide' : 'Show'} content details
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-4 mb-6">
            {/* Content preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h4>
              <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {artifact.content?.substring(0, 500)}
                  {artifact.content && artifact.content.length > 500 && '...'}
                </pre>
              </div>
            </div>

            {/* Frontmatter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Frontmatter</h4>
              <div className="bg-gray-50 rounded-md p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {JSON.stringify(artifact.frontmatter, null, 2)}
                </pre>
              </div>
            </div>

            {/* Audit Tags */}
            {hasAuditTags && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Audit Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {auditTags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ledger (simplified view) */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Provenance Ledger</h4>
              <div className="bg-gray-50 rounded-md p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {JSON.stringify(artifact.ledger, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Feedback input */}
        <div className="mb-4">
          <label htmlFor={`feedback-${artifact.id}`} className="block text-sm font-medium text-gray-700 mb-1">
            Review Feedback (optional)
          </label>
          <textarea
            id={`feedback-${artifact.id}`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Provide feedback for the content generator..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Status: <span className="font-medium">{artifact.status}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleReview('reject')}
              disabled={isLoading || reviewResult !== null}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={() => handleReview('approve')}
              disabled={isLoading || reviewResult !== null}
              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {reviewResult && !reviewResult.success && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Failed to {reviewResult.action} artifact. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}