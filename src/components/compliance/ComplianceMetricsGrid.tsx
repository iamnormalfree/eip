// ABOUTME: Compliance Metrics Grid Component - KPI displays for compliance dashboard
// ABOUTME: Shows key performance indicators in responsive grid layout

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

interface ComplianceMetricsGridProps {
  stats: ComplianceStats;
  complianceRate: number;
  isLoading: boolean;
}

export function ComplianceMetricsGrid({ stats, complianceRate, isLoading }: ComplianceMetricsGridProps) {
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    color = 'gray', 
    icon 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray';
    icon?: React.ReactNode;
  }) => {
    const colorClasses = {
      green: 'bg-green-50 border-green-200 text-green-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      gray: 'bg-gray-50 border-gray-200 text-gray-800'
    };

    return (
      <div className={`border rounded-lg p-6 ${colorClasses[color]} ${isLoading ? 'opacity-50' : ''}`}>
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 mr-3">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm font-medium">{title}</div>
            {subtitle && <div className="text-xs opacity-75">{subtitle}</div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Validations */}
      <MetricCard
        title="Total Validations"
        value={stats.total_validations.toLocaleString()}
        subtitle="Last 24 hours"
        color="blue"
        icon={
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012 2v11a2 2 0 11-4 0V5z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />

      {/* Compliance Rate */}
      <MetricCard
        title="Compliance Rate"
        value={`${complianceRate}%`}
        subtitle={`${stats.compliant_count} compliant of ${stats.total_validations}`}
        color={complianceRate >= 95 ? 'green' : complianceRate >= 85 ? 'yellow' : 'red'}
        icon={
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            complianceRate >= 95 ? 'bg-green-500' : 
            complianceRate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />

      {/* Average Score */}
      <MetricCard
        title="Average Score"
        value={stats.average_score.toFixed(1)}
        subtitle="Quality assessment"
        color={stats.average_score >= 8.5 ? 'green' : stats.average_score >= 7.0 ? 'yellow' : 'gray'}
        icon={
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            stats.average_score >= 8.5 ? 'bg-green-500' : 
            stats.average_score >= 7.0 ? 'bg-yellow-500' : 'bg-gray-500'
          }`}>
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        }
      />

      {/* Processing Time */}
      <MetricCard
        title="Avg Processing"
        value={`${Math.round(stats.average_processing_time_ms)}ms`}
        subtitle="Response time"
        color={stats.average_processing_time_ms <= 1000 ? 'green' : 
                stats.average_processing_time_ms <= 2000 ? 'yellow' : 'red'}
        icon={
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            stats.average_processing_time_ms <= 1000 ? 'bg-green-500' : 
            stats.average_processing_time_ms <= 2000 ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />

      {/* Status Breakdown - First Row */}
      <MetricCard
        title="Compliant"
        value={stats.compliant_count.toLocaleString()}
        color="green"
        icon={
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />

      <MetricCard
        title="Non-Compliant"
        value={stats.non_compliant_count.toLocaleString()}
        color="red"
        icon={
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />

      <MetricCard
        title="Pending"
        value={stats.pending_count.toLocaleString()}
        color="yellow"
        icon={
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />

      <MetricCard
        title="Errors"
        value={stats.error_count.toLocaleString()}
        color="red"
        icon={
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        }
      />
    </div>
  );
}