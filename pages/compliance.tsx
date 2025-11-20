// ABOUTME: Compliance Dashboard - Pages Router version
// ABOUTME: Real-time compliance monitoring with API integration

import React, { useState, useEffect } from 'react';

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

export default function ComplianceDashboard() {
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await fetch('/api/compliance/stats?hours_back=24');
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      }

      // Fetch recent validations
      const validationsResponse = await fetch('/api/compliance/validations/recent?limit=10');
      if (validationsResponse.ok) {
        const validationsResult = await validationsResponse.json();
        if (validationsResult.success && validationsResult.data) {
          setValidations(validationsResult.data.validations);
        }
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchData();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const complianceRate = stats.total_validations > 0
    ? Math.round((stats.compliant_count / stats.total_validations) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10b981';
      case 'non_compliant': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'error': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Compliance Dashboard
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                Real-time monitoring of EIP content compliance
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a
                href="/"
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Status Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: error ? '#ef4444' : '#10b981'
            }} />
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {error ? 'Connection Error' : 'System Online'}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Last updated: {isClient ? lastUpdate.toLocaleTimeString() : 'Loading...'}
            {isLoading && ' (Updating...)'}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ color: '#ef4444', marginRight: '0.75rem' }}>⚠</div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#991b1b' }}>
                  Connection Error
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_validations}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Validations</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {complianceRate}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Compliance Rate</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {Math.round(stats.average_processing_time_ms)}ms
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg Processing</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.pending_count}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending</div>
          </div>
        </div>

        {/* Recent Validations */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
              Recent Validations
            </h3>
          </div>

          <div style={{ padding: '1rem' }}>
            {validations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                {isLoading ? 'Loading...' : 'No validation records found'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Score</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Authority</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Tier</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validations.map((validation) => (
                      <tr key={validation.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(validation.compliance_status) + '20',
                            color: getStatusColor(validation.compliance_status)
                          }}>
                            {validation.compliance_status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            fontWeight: '500',
                            color: getScoreColor(validation.compliance_score)
                          }}>
                            {validation.compliance_score}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{validation.authority_level}</td>
                        <td style={{ padding: '0.75rem' }}>{validation.processing_tier}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {isClient ? new Date(validation.validation_timestamp).toLocaleString() : validation.validation_timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* API Test Links */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
            Test API Endpoints:
          </h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="/api/compliance/stats"
              target="_blank"
              style={{
                fontSize: '0.875rem',
                color: '#3b82f6',
                textDecoration: 'none'
              }}
            >
              /api/compliance/stats
            </a>
            <a
              href="/api/compliance/validations/recent"
              target="_blank"
              style={{
                fontSize: '0.875rem',
                color: '#3b82f6',
                textDecoration: 'none'
              }}
            >
              /api/compliance/validations/recent
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}