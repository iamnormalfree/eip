// ABOUTME: Violations Alert Panel Component - Critical violation notifications
// ABOUTME: Displays high-priority compliance violations requiring immediate attention

'use client';

import { useState } from 'react';

interface ValidationRecord {
  id: string;
  job_id: string;
  artifact_id?: string;
  compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'error';
  compliance_score: number;
  violations_count: number;
  authority_level: 'high' | 'medium' | 'low';
  processing_tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  validation_timestamp: string;
  processing_time_ms: number;
  validation_level: 'standard' | 'enhanced' | 'comprehensive';
  job_brief?: string;
  artifact_brief?: string;
  artifact_status?: string;
  quality_tier?: string;
  freshness_category?: string;
}

interface ViolationsAlertPanelProps {
  violations: ValidationRecord[];
}

export function ViolationsAlertPanel({ violations }: ViolationsAlertPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getUrgencyLevel = (violationsCount: number, score: number) => {
    if (violationsCount >= 5 || score < 5.0) return 'critical';
    if (violationsCount >= 3 || score < 6.5) return 'high';
    return 'medium';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (violations.length === 0) {
    return null;
  }

  const sortedViolations = violations.sort((a, b) => {
    const aUrgency = getUrgencyLevel(a.violations_count, a.compliance_score);
    const bUrgency = getUrgencyLevel(b.violations_count, b.compliance_score);
    
    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    return urgencyOrder[aUrgency as keyof typeof urgencyOrder] - urgencyOrder[bUrgency as keyof typeof urgencyOrder];
  });

  const displayedViolations = isExpanded ? sortedViolations : sortedViolations.slice(0, 3);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">
              Critical Compliance Violations
            </h3>
            <p className="text-sm text-red-600">
              {violations.length} high-authority non-compliant validation{violations.length !== 1 ? 's' : ''} require immediate attention
            </p>
          </div>
        </div>
        
        {violations.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            {isExpanded ? 'Show Less' : `Show All (${violations.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedViolations.map((violation) => {
          const urgency = getUrgencyLevel(violation.violations_count, violation.compliance_score);
          const urgencyColor = getUrgencyColor(urgency);
          
          return (
            <div 
              key={violation.id} 
              className={`border rounded-lg p-4 ${urgencyColor}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-white bg-opacity-60">
                    {urgency} PRIORITY
                  </span>
                  
                  <span className="text-xs font-medium">
                    Score: {violation.compliance_score.toFixed(1)}
                  </span>
                  
                  <span className="text-xs font-medium">
                    {violation.violations_count} violation{violation.violations_count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="text-xs opacity-75">
                  {formatTimestamp(violation.validation_timestamp)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="font-medium">Job ID:</span> {violation.job_id.substring(0, 12)}...
                </div>
                {violation.artifact_id && (
                  <div>
                    <span className="font-medium">Artifact:</span> {violation.artifact_id.substring(0, 12)}...
                  </div>
                )}
                <div>
                  <span className="font-medium">Processing Tier:</span> {violation.processing_tier}
                </div>
                <div>
                  <span className="font-medium">Validation Level:</span> {violation.validation_level}
                </div>
              </div>

              {(violation.artifact_brief || violation.job_brief) && (
                <div className="text-xs space-y-1">
                  {violation.artifact_brief && (
                    <div>
                      <span className="font-medium">Content:</span> {truncateText(violation.artifact_brief)}
                    </div>
                  )}
                  {violation.job_brief && (
                    <div>
                      <span className="font-medium">Context:</span> {truncateText(violation.job_brief)}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-current border-opacity-20 flex items-center justify-between">
                <div className="text-xs opacity-75">
                  Processing time: {violation.processing_time_ms}ms
                </div>
                
                <a 
                  href="/review"
                  className="text-xs font-medium hover:underline"
                >
                  Review in Queue →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-red-200 flex items-center justify-between">
        <div className="text-sm text-red-600">
          ⚠️ High-authority violations may impact system compliance and require immediate review
        </div>
        
        <div className="flex space-x-3">
          <a
            href="/review"
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Review Queue
          </a>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm bg-white hover:bg-gray-50 text-red-600 border border-red-300 px-4 py-2 rounded-md font-medium transition-colors"
          >
            {isExpanded ? 'Collapse' : 'View All'}
          </button>
        </div>
      </div>
    </div>
  );
}