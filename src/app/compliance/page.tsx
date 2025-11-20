// ABOUTME: Compliance Dashboard Page - Full interactive dashboard with real-time updates
// ABOUTME: App Router version with client-side components and API integration

'use client';

import { useState, useEffect } from 'react';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';

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

export default function CompliancePage() {
  const [stats, setStats] = useState<ComplianceStats>({
    total_validations: 0,
    compliant_count: 0,
    non_compliant_count: 0,
    pending_count: 0,
    error_count: 0,
    average_score: 0,
    average_processing_time_ms: 0,
    high_authority_count: 0,
    medium_authority_count: 0,
    low_authority_count: 0,
  });

  const [validations, setValidations] = useState<ValidationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch initial stats
        const statsResponse = await fetch('/api/compliance/stats?hours_back=24');
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
        }

        // Fetch recent validations
        const validationsResponse = await fetch('/api/compliance/validations/recent?limit=20');
        if (validationsResponse.ok) {
          const validationsResult = await validationsResponse.json();
          if (validationsResult.success && validationsResult.data) {
            setValidations(validationsResult.data.validations);
          }
        }
      } catch (err) {
        console.error('Error loading initial compliance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
              <p className="text-sm text-gray-600">Real-time monitoring of EIP content compliance</p>
            </div>
            <a
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
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
        ) : null}

        <ComplianceDashboard
          initialStats={stats}
          initialValidations={validations}
        />
      </div>
    </div>
  );
}