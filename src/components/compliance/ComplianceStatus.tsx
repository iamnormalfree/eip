// ABOUTME: Compliance Status Component - Real-time status indicator for dashboard
// ABOUTME: Shows connection status and last update time

interface ComplianceStatusProps {
  isOnline: boolean;
  lastUpdate: Date;
  isLoading: boolean;
}

export function ComplianceStatus({ isOnline, lastUpdate, isLoading }: ComplianceStatusProps) {
  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-500';
    if (isOnline) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Updating...';
    if (isOnline) return 'Connected';
    return 'Offline';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 120) {
      return '1 minute ago';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 7200) {
      return '1 hour ago';
    } else {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor().replace('text', 'bg')}`} />
        <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text', 'bg')} animate-pulse`} />
      </div>
      <div className="text-sm">
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <span className="text-gray-500 ml-1">
          • Updated {formatTimeAgo(lastUpdate)}
        </span>
      </div>
    </div>
  );
}