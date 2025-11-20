// ABOUTME: Compliance Dashboard Component - Main dashboard with real-time updates
// ABOUTME: Client-side polling for live compliance monitoring

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComplianceMetricsGrid } from './ComplianceMetricsGrid';
import { ComplianceStatus } from './ComplianceStatus';
import { RecentValidationsList } from './RecentValidationsList';
import { ViolationsAlertPanel } from './ViolationsAlertPanel';

interface ComplianceStats {
  total_validations: number;
  compliant_count: number;
  non_compliant_count: number;
  pending_count: number;
  error_count: number;
  average_score: number;
  average_processing_time_ms: number;
  high_authority_count: number;
  medium_authority_count: number;
  low_authority_count: number;
}

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

interface ComplianceDashboardProps {
  initialStats: ComplianceStats;
  initialValidations: ValidationRecord[];
}

export function ComplianceDashboard({ initialStats, initialValidations }: ComplianceDashboardProps) {
  const [stats, setStats] = useState<ComplianceStats>(initialStats);
  const [validations, setValidations] = useState<ValidationRecord[]>(initialValidations);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchComplianceData = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch updated stats
      const statsResponse = await fetch('/api/compliance/stats?hours_back=24');
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.statusText}`);
      }
      const statsResult = await statsResponse.json();
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      // Fetch recent validations
      const validationsResponse = await fetch('/api/compliance/validations/recent?limit=20');
      if (!validationsResponse.ok) {
        throw new Error(`Failed to fetch validations: ${validationsResponse.statusText}`);
      }
      const validationsResult = await validationsResponse.json();
      
      if (validationsResult.success && validationsResult.data) {
        setValidations(validationsResult.data.validations);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Set up polling
  useEffect(() => {
    if (!isPolling) return;

    // Initial fetch
    fetchComplianceData();

    // Set up polling interval (30-60 seconds as specified)
    const intervalId = setInterval(() => {
      fetchComplianceData();
    }, 45000); // 45 seconds - middle of 30-60 second range

    return () => {
      clearInterval(intervalId);
    };
  }, [isPolling, fetchComplianceData]);

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  const retryFetch = () => {
    setError(null);
    fetchComplianceData();
  };

  // Calculate compliance rate
  const complianceRate = stats.total_validations > 0 
    ? Math.round((stats.compliant_count / stats.total_validations) * 100)
    : 0;

  // Check for critical violations (non-compliant with high authority)
  const criticalViolations = validations.filter(
    v => v.compliance_status === 'non_compliant' && v.authority_level === 'high'
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Real-time Monitoring</h2>
          <ComplianceStatus 
            isOnline={!error}
            lastUpdate={lastUpdate}
            isLoading={isLoading}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          {error && (
            <button
              onClick={retryFetch}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          )}
          
          <button
            onClick={togglePolling}
            className={`text-sm px-3 py-1 rounded-md font-medium transition-colors ${
              isPolling 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {isPolling ? 'Polling Active' : 'Polling Paused'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Violations Alert */}
      {criticalViolations.length > 0 && (
        <ViolationsAlertPanel violations={criticalViolations} />
      )}

      {/* Metrics Grid */}
      <ComplianceMetricsGrid 
        stats={stats}
        complianceRate={complianceRate}
        isLoading={isLoading}
      />

      {/* Recent Validations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Validations</h3>
            <div className="text-sm text-gray-500">
              {isLoading ? 'Updating...' : `Last updated: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <RecentValidationsList 
            validations={validations}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_validations}</div>
            <div className="text-sm text-gray-500">Total Validations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{complianceRate}%</div>
            <div className="text-sm text-gray-500">Compliance Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(stats.average_processing_time_ms)}ms
            </div>
            <div className="text-sm text-gray-500">Avg Processing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{stats.pending_count}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}