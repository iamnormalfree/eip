// ABOUTME: Quality Tags Display Component - Shows 10 critical audit tags with severity levels
// ABOUTME: Interactive display of micro-auditor results with expandable details and rationale

'use client';

import { useState } from 'react';

interface QualityTag {
  tag: string;
  severity: 'critical' | 'warning' | 'info';
  rationale: string;
  span_hint?: string;
  evidence?: string;
}

interface LedgerData {
  audit_tags?: QualityTag[];
  [key: string]: any;
}

interface QualityTagsDisplayProps {
  ledger: LedgerData;
  className?: string;
}

// Define the 10 critical tags with their descriptions and default severity
const CRITICAL_TAG_DEFINITIONS = {
  NO_MECHANISM: {
    name: 'Missing Mechanism',
    description: 'No explanation of "how it works"',
    defaultSeverity: 'critical' as const,
    color: 'red'
  },
  NO_COUNTEREXAMPLE: {
    name: 'Missing Counterexample',
    description: 'No failure case or boundary condition shown',
    defaultSeverity: 'critical' as const,
    color: 'red'
  },
  NO_TRANSFER: {
    name: 'Missing Transfer',
    description: 'No application to different context/domain',
    defaultSeverity: 'warning' as const,
    color: 'orange'
  },
  EVIDENCE_HOLE: {
    name: 'Evidence Gap',
    description: 'Claims made without supporting evidence',
    defaultSeverity: 'critical' as const,
    color: 'red'
  },
  LAW_MISSTATE: {
    name: 'Legal Inaccuracy',
    description: 'Potential legal or statutory inaccuracies',
    defaultSeverity: 'critical' as const,
    color: 'red'
  },
  DOMAIN_MIXING: {
    name: 'Domain Mixing',
    description: 'Mixing incompatible domains or concepts',
    defaultSeverity: 'warning' as const,
    color: 'orange'
  },
  CONTEXT_DEGRADED: {
    name: 'Context Issue',
    description: 'Context lost, degraded, or misapplied',
    defaultSeverity: 'info' as const,
    color: 'blue'
  },
  CTA_MISMATCH: {
    name: 'CTA Mismatch',
    description: 'Call-to-action doesn\'t match content intent',
    defaultSeverity: 'warning' as const,
    color: 'orange'
  },
  ORPHAN_CLAIM: {
    name: 'Orphaned Claim',
    description: 'Claims made without proper support or context',
    defaultSeverity: 'warning' as const,
    color: 'orange'
  },
  SCHEMA_MISSING: {
    name: 'Schema Incomplete',
    description: 'Missing required IP structure elements',
    defaultSeverity: 'critical' as const,
    color: 'red'
  }
};

// Severity styling
const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
    icon: 'text-red-500'
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800',
    icon: 'text-orange-500'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
    icon: 'text-blue-500'
  }
};

export function QualityTagsDisplay({ ledger, className = '' }: QualityTagsDisplayProps) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  // Extract audit tags from ledger
  const auditTags = ledger?.audit_tags || [];

  // If no tags, show empty state
  if (!auditTags || auditTags.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Quality Issues Detected</h3>
          <p className="text-sm text-gray-600">This content passed all critical quality checks.</p>
        </div>
      </div>
    );
  }

  // Toggle tag expansion
  const toggleTagExpansion = (tagKey: string) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagKey)) {
        newSet.delete(tagKey);
      } else {
        newSet.add(tagKey);
      }
      return newSet;
    });
  };

  // Get severity counts with null safety
  const severityCounts = auditTags.reduce((acc, tag) => {
    if (!tag) return acc; // Skip null/undefined tags

    const severity = tag.severity || 'info'; // Default to 'info' if severity is missing
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Header with severity summary */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quality Audit Results</h3>
          <div className="flex items-center space-x-2">
            {severityCounts.critical > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {severityCounts.critical} Critical
              </span>
            )}
            {severityCounts.warning > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {severityCounts.warning} Warning
              </span>
            )}
            {severityCounts.info > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {severityCounts.info} Info
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {auditTags.length} quality tag{auditTags.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* Tags list */}
      <div className="divide-y divide-gray-200">
        {auditTags.map((tag, index) => {
          // Skip null/undefined tags entirely
          if (!tag) {
            return (
              <div key={`invalid-tag-${index}`} className="p-4 bg-gray-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium text-gray-900">Invalid Tag Data</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Tag at position {index} is missing or malformed.</p>
              </div>
            );
          }

          const tagKey = `${tag.tag || 'unknown'}-${index}`;
          const tagDefinition = CRITICAL_TAG_DEFINITIONS[tag.tag as keyof typeof CRITICAL_TAG_DEFINITIONS];
          const isExpanded = expandedTags.has(tagKey);
          const severity = tag.severity || (tagDefinition?.defaultSeverity || 'info');
          const styles = SEVERITY_STYLES[severity];

          if (!tagDefinition) {
            // Handle unknown tags with null safety
            return (
              <div key={tagKey} className="p-4 bg-gray-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium text-gray-900">
                    Unknown Tag: {tag.tag || 'UNDEFINED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">This tag is not in the standard audit framework.</p>
                {tag.rationale && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Rationale:</strong> {tag.rationale}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={tagKey} className={`p-4 ${styles.bg} border-l-4 border-${tagDefinition.color}-500`}>
              {/* Tag header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  {/* Severity icon */}
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {severity === 'critical' && (
                      <svg className={`w-5 h-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {severity === 'warning' && (
                      <svg className={`w-5 h-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {severity === 'info' && (
                      <svg className={`w-5 h-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Tag info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {tagDefinition.name || 'Unknown Tag'}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                        {severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {tagDefinition.description || 'No description available'}
                    </p>
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => toggleTagExpansion(tagKey)}
                  className={`ml-3 flex-shrink-0 p-1 rounded-md ${styles.text} hover:bg-opacity-10 hover:bg-gray-900 transition-colors`}
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                  {/* Rationale */}
                  {tag.rationale && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Rationale</h5>
                      <p className="text-sm text-gray-700">{tag.rationale}</p>
                    </div>
                  )}

                  {/* Span hint */}
                  {tag.span_hint && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Location Hint</h5>
                      <p className="text-sm text-gray-700 italic">{tag.span_hint}</p>
                    </div>
                  )}

                  {/* Evidence */}
                  {tag.evidence && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Supporting Evidence</h5>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700">{tag.evidence}</p>
                      </div>
                    </div>
                  )}

                  {/* Technical details */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Technical Details</h5>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Tag ID: <code className="bg-gray-100 px-1 rounded">{tag.tag || 'UNKNOWN'}</code></p>
                      <p>Severity: <span className={`font-medium ${styles.text}`}>{severity}</span></p>
                      {tag.rationale && (
                        <p>Rationale: <span className="italic">{tag.rationale}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer with summary */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Summary:</span> Review critical tags first for content compliance
          </div>
          <div className="text-xs text-gray-500">
            Audit completed via micro-auditor framework
          </div>
        </div>
      </div>
    </div>
  );
}