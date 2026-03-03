// ABOUTME: ComplianceStatusDisplay Component - Regulatory compliance status and evidence display
// ABOUTME: Shows Singapore regulatory compliance, domain authority, evidence checks, and violations

'use client';

import { useState } from 'react';

// Re-use the compliance report interface from the compliance engine
export interface ComplianceViolation {
  type: 'intent_mismatch' | 'unapproved_source' | 'stale_evidence' | 'missing_disclaimer';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_element: string;
  penalty_points: number;
  suggested_fix?: string;
}

export interface ComplianceReport {
  status: 'compliant' | 'violations_detected' | 'requires_review';
  overall_score: number;
  violations: ComplianceViolation[];
  authority_level: 'low' | 'medium' | 'high';
  evidence_summary: {
    total_sources: number;
    accessible_sources: number;
    high_authority_sources: number;
    stale_sources: number;
  };
  timestamp: Date;
  processing_time_ms?: number;
}

export interface ComplianceStatusDisplayProps {
  complianceData?: ComplianceReport | null;
  artifactMetadata?: {
    id: string;
    title: string;
    createdAt: string;
  };
  showDetails?: boolean;
  className?: string;
}

export function ComplianceStatusDisplay({
  complianceData,
  artifactMetadata,
  showDetails = true,
  className = ''
}: ComplianceStatusDisplayProps) {
  const [expandedViolations, setExpandedViolations] = useState<Set<number>>(new Set());

  // Handle missing or invalid compliance data
  if (!complianceData || typeof complianceData !== 'object') {
    return (
      <div className={'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ' + className}>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Data Unavailable</h3>
              <p className="text-gray-500">No compliance information available for this artifact.</p>
              {artifactMetadata?.id && (
                <div className="mt-4 text-sm text-gray-400">
                  Artifact ID: {artifactMetadata.id.substring(0, 8)}...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toggleViolationExpansion = (index: number) => {
    const newExpanded = new Set(expandedViolations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedViolations(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'violations_detected':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'requires_review':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAuthorityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-purple-100 text-purple-800';
      case 'low':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-SG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScore = (score: number) => {
    return Math.round(score);
  };

  const isScoreGood = (score: number) => {
    return score >= 90;
  };

  const isScoreMedium = (score: number) => {
    return score >= 70 && score < 90;
  };

  const getScoreColor = (score: number) => {
    if (isScoreGood(score)) return 'text-green-600';
    if (isScoreMedium(score)) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ' + className}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Singapore Regulatory Compliance
            </h3>
            {artifactMetadata && (
              <p className="text-sm text-gray-600 mt-1">
                {artifactMetadata.title} • {formatDate(artifactMetadata.createdAt)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <div className={'px-3 py-1 rounded-full text-sm font-medium border ' + getStatusColor(complianceData.status || 'unknown')}>
              {(complianceData.status || 'unknown').replace('_', ' ').toUpperCase()}
            </div>
            
            {/* Compliance Score */}
            <div className="text-center">
              <div className={'text-2xl font-bold ' + getScoreColor(complianceData.overall_score || 0)}>
                {formatScore(complianceData.overall_score || 0)}
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Authority Level */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Domain Authority Level
          </h4>
          <div className="flex items-center space-x-3">
            <div className={'px-3 py-1 rounded-full text-sm font-medium ' + getAuthorityColor(complianceData.authority_level || 'low')}>
              {(complianceData.authority_level || 'low').toUpperCase()} AUTHORITY
            </div>
            <div className="text-sm text-gray-600">
              Based on Singapore regulatory domain compliance (MAS, IRAS, .gov, .edu)
            </div>
          </div>
        </div>

        {/* Evidence Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Evidence Validation Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{complianceData.evidence_summary?.total_sources || 0}</div>
              <div className="text-xs text-gray-500">Total Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{complianceData.evidence_summary?.accessible_sources || 0}</div>
              <div className="text-xs text-gray-500">Accessible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{complianceData.evidence_summary?.high_authority_sources || 0}</div>
              <div className="text-xs text-gray-500">High Authority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{complianceData.evidence_summary?.stale_sources || 0}</div>
              <div className="text-xs text-gray-500">Stale</div>
            </div>
          </div>
        </div>

        {/* Violations */}
        {complianceData.violations && complianceData.violations.length > 0 && showDetails && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Compliance Violations ({complianceData.violations.length})
            </h4>
            <div className="space-y-3">
              {complianceData.violations.map((violation, index) => {
                if (!violation) {
                  return (
                    <div key={index} className="border rounded-lg overflow-hidden bg-gray-50 border-gray-200">
                      <div className="p-4">
                        <p className="text-sm text-gray-600">Invalid violation data at position {index}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={'border rounded-lg overflow-hidden ' + getSeverityColor(violation.severity || 'low')}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-medium uppercase bg-white bg-opacity-60 px-2 py-1 rounded">
                              {violation.type?.replace('_', ' ') || 'unknown'}
                            </span>
                            <span className="text-xs font-medium uppercase bg-white bg-opacity-60 px-2 py-1 rounded">
                              {violation.severity || 'unknown'}
                            </span>
                            <span className="text-xs text-white bg-opacity-80 bg-gray-800 px-2 py-1 rounded">
                              -{violation.penalty_points || 0} pts
                            </span>
                          </div>
                          <p className="text-sm font-medium">{violation.description || 'No description available'}</p>
                          <p className="text-xs opacity-75 mt-1">Affected: {violation.affected_element || 'Unknown element'}</p>
                        </div>

                        {showDetails && (
                          <button
                            onClick={() => toggleViolationExpansion(index)}
                            className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            aria-label={expandedViolations.has(index) ? 'Collapse details' : 'Expand details'}
                          >
                            <svg
                              className={'w-4 h-4 transform transition-transform ' + (expandedViolations.has(index) ? 'rotate-90' : '')}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {expandedViolations.has(index) && (
                        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                          {violation.suggested_fix && (
                            <div className="mb-3">
                              <h5 className="text-xs font-medium mb-1">Suggested Fix:</h5>
                              <p className="text-sm">{violation.suggested_fix}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Type:</span> {violation.type?.replace('_', ' ') || 'unknown'}
                            </div>
                            <div>
                              <span className="font-medium">Severity:</span> {violation.severity || 'unknown'}
                            </div>
                            <div>
                              <span className="font-medium">Penalty:</span> {violation.penalty_points || 0} points
                            </div>
                            <div>
                              <span className="font-medium">Element:</span> {violation.affected_element || 'unknown'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Processing Information */}
        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Last Validated: {formatDate(complianceData.timestamp || new Date())}</div>
              {complianceData.processing_time_ms && (
                <div>Processing Time: {(complianceData.processing_time_ms / 1000).toFixed(2)}s</div>
              )}
              <div>Regulatory Framework: Singapore (MAS, IRAS, PDPA)</div>
            </div>
          </div>
        )}

        {/* Compliance Footer */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              Status: <span className="font-medium">{(complianceData.status || 'unknown').replace('_', ' ').toUpperCase()}</span>
              {isScoreGood(complianceData.overall_score || 0) && (
                <span className="ml-2 text-green-600">• Compliant with Singapore regulations</span>
              )}
              {(complianceData.overall_score || 0) < 70 && (
                <span className="ml-2 text-red-600">• Requires immediate attention</span>
              )}
            </div>
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Singapore Compliance Engine v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
