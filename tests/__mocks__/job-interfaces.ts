// Mock interfaces for pipeline error handling tests
export interface MockJob {
  id: string;
  data: {
    type: string;
    persona?: string;
    funnel?: string;
    topic: string;
    tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
    metadata?: Record<string, any>;
  };
  correlationId?: string;
  userId?: string;
}

export interface MockJobResult {
  success: boolean;
  id?: string;
  reason?: string;
  completedStages?: string[];
  failedStages?: string[];
  partialFailure?: boolean;
  preservedContext?: {
    correlationId?: string;
    userId?: string;
    jobId?: string;
    completedStages?: string[];
    failedStage?: string;
  };
  rollbackTriggered?: boolean;
  rollbackStages?: string[];
  attempt?: number;
  retryDelay?: number;
  maxRetries?: number;
  retryCount?: number;
  nextRetryTime?: number;
  totalAttempts?: number;
  finalStatus?: string;
  errorContext?: {
    correlationId?: string;
    userId?: string;
    jobId?: string;
    stage?: string;
    errorType?: string;
    timestamp?: number;
    metadata?: Record<string, any>;
  };
  errors?: Array<{
    stage: string;
    type: string;
    message: string;
  }>;
  aggregatedError?: string;
  errorCount?: number;
  auditTrail?: Array<{
    timestamp?: number;
    jobId?: string;
    stage?: string;
    status?: string;
    duration?: number;
    error?: string;
    errorContext?: Record<string, any>;
  }>;
}

export interface MockDLQResult {
  success: boolean;
  dlqId?: string;
  reason?: string;
  context?: {
    correlationId?: string;
    userId?: string;
    jobId?: string;
  };
  error?: string;
  capacity?: number;
  currentCount?: number;
}

export interface MockDLQJob {
  id: string;
  data: {
    error: string;
  };
  failedReason?: string;
}

export interface MockRetryDelayResult {
  delay: number;
}

export interface MockRecoverResult {
  success: boolean;
  retryCount?: number;
  nextRetryTime?: number;
  recoveredJobId?: string;
}

export interface MockGetFailedJobsResult {
  id: string;
  data: {
    error: string;
  };
  failedReason?: string;
}
