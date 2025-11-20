// ABOUTME: Recent Validations List Component - Live validation status updates
// ABOUTME: Displays recent compliance validations with filtering and sorting

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

interface RecentValidationsListProps {
  validations: ValidationRecord[];
  isLoading: boolean;
}

export function RecentValidationsList({ validations, isLoading }: RecentValidationsListProps) {
  const [filter, setFilter] = useState<string>('all');
  
  const filteredValidations = validations.filter(validation => {
    if (filter === 'all') return true;
    return validation.compliance_status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'non_compliant':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAuthorityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-purple-100 text-purple-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingTierColor = (tier: string) => {
    switch (tier) {
      case 'LIGHT':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HEAVY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}m`;
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (validations.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Validations Found</h3>
        <p className="text-gray-500">No compliance validations have been recorded in the selected time period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500">
          Showing {filteredValidations.length} of {validations.length} validations
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Validation List */}
      {!isLoading && (
        <div className="space-y-3">
          {filteredValidations.map((validation) => (
            <div 
              key={validation.id} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(validation.compliance_status)}`}>
                    {validation.compliance_status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAuthorityColor(validation.authority_level)}`}>
                    {validation.authority_level.toUpperCase()} AUTHORITY
                  </span>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProcessingTierColor(validation.processing_tier)}`}>
                    {validation.processing_tier}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {formatTimestamp(validation.validation_timestamp)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900">Score</div>
                  <div className="text-gray-600">{validation.compliance_score.toFixed(1)}</div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">Violations</div>
                  <div className="text-gray-600">{validation.violations_count}</div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">Processing</div>
                  <div className="text-gray-600">{formatProcessingTime(validation.processing_time_ms)}</div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">Level</div>
                  <div className="text-gray-600">{validation.validation_level}</div>
                </div>
              </div>

              {(validation.job_brief || validation.artifact_brief) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {validation.artifact_brief && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">Artifact:</div>
                      <div className="text-xs text-gray-600">{truncateText(validation.artifact_brief, 80)}</div>
                    </div>
                  )}
                  
                  {validation.job_brief && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Job:</div>
                      <div className="text-xs text-gray-600">{truncateText(validation.job_brief, 80)}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Job ID: {validation.job_id.substring(0, 8)}...
                  {validation.artifact_id && ` • Artifact: ${validation.artifact_id.substring(0, 8)}...`}
                </div>
                
                {validation.quality_tier && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    {validation.quality_tier}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}