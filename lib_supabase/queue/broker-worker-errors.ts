// ABOUTME: Error classification system for broker worker job failures.
// ABOUTME: Categorizes errors into 7 types for improved monitoring and diagnostics.

/**
 * Error types for broker assignment jobs
 *
 * Based on synthesis blueprint Phase 2 requirements:
 * - NO_BROKERS_AVAILABLE: All brokers at capacity or unavailable
 * - DATABASE_ERROR: Supabase/PostgreSQL connection or query failures
 * - VALIDATION_ERROR: Invalid job data or missing required fields
 * - TIMEOUT_ERROR: Job exceeded 30s timeout threshold
 * - CIRCUIT_BREAKER_OPEN: Rate limiting or circuit breaker triggered
 * - CHATWOOT_ERROR: Chatwoot API failures
 * - UNKNOWN_ERROR: Unclassified errors (fallback)
 */
export enum JobErrorType {
  NO_BROKERS_AVAILABLE = 'NO_BROKERS_AVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  CHATWOOT_ERROR = 'CHATWOOT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Classified error result with metadata
 */
export interface ClassifiedError {
  type: JobErrorType;
  message: string;
  retryable: boolean;
  stack?: string;
  originalError?: any;
}

/**
 * Classify job errors into categorized types
 *
 * Integration contract (from synthesis):
 * - Error classification must be available to monitoring system
 * - Job failures must include error type in metadata
 * - Timeout errors must be distinct from other failures
 *
 * @param error - The error to classify (Error object or any value)
 * @returns ClassifiedError with type, message, and retry recommendation
 */
export function classifyJobError(error: any): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Check for database errors first (most specific patterns)
  if (isDatabaseError(error, message)) {
    return {
      type: JobErrorType.DATABASE_ERROR,
      message,
      retryable: true,
      stack,
      originalError: error
    };
  }

  // Check for broker availability errors
  if (isNoBrokersAvailableError(message)) {
    return {
      type: JobErrorType.NO_BROKERS_AVAILABLE,
      message,
      retryable: true,
      stack,
      originalError: error
    };
  }

  // Check for validation errors (non-retryable)
  if (isValidationError(message)) {
    return {
      type: JobErrorType.VALIDATION_ERROR,
      message,
      retryable: false, // Validation errors won't fix themselves
      stack,
      originalError: error
    };
  }

  // Check for timeout errors
  if (isTimeoutError(message)) {
    return {
      type: JobErrorType.TIMEOUT_ERROR,
      message,
      retryable: true,
      stack,
      originalError: error
    };
  }

  // Check for circuit breaker errors
  if (isCircuitBreakerError(message)) {
    return {
      type: JobErrorType.CIRCUIT_BREAKER_OPEN,
      message,
      retryable: true,
      stack,
      originalError: error
    };
  }

  // Check for Chatwoot API errors
  if (isChatwootError(message)) {
    return {
      type: JobErrorType.CHATWOOT_ERROR,
      message,
      retryable: true,
      stack,
      originalError: error
    };
  }

  // Default: unknown error (retryable by default)
  return {
    type: JobErrorType.UNKNOWN_ERROR,
    message,
    retryable: true,
    stack,
    originalError: error
  };
}

/**
 * Check if error is a database error
 */
function isDatabaseError(error: any, message: string): boolean {
  // Check for PostgreSQL error codes
  if (error.code && typeof error.code === 'string') {
    // PostgreSQL error codes (https://www.postgresql.org/docs/current/errcodes-appendix.html)
    const pgErrorPatterns = /^(08|23|40|53|54|55|57|58|P0|XX)/; // Connection, constraint, transaction, resource errors
    if (pgErrorPatterns.test(error.code)) {
      return true;
    }
  }

  // Check message patterns
  const dbPatterns = [
    /supabase/i,
    /postgres/i,
    /database/i,
    /connection/i,
    /query/i,
    /pg_/i,
    /relation does not exist/i,
    /column.*does not exist/i,
    /duplicate key/i
  ];

  return dbPatterns.some(pattern => pattern.test(message));
}

/**
 * Check if error is a "no brokers available" error
 */
function isNoBrokersAvailableError(message: string): boolean {
  const patterns = [
    /no brokers available/i,
    /no broker.*assigned/i,
    /failed to assign broker/i,
    /all brokers.*capacity/i,
    /no suitable broker/i
  ];

  return patterns.some(pattern => pattern.test(message));
}

/**
 * Check if error is a validation error
 */
function isValidationError(message: string): boolean {
  const patterns = [
    /invalid/i,
    /validation/i,
    /missing.*required/i,
    /expected.*but received/i,
    /malformed/i,
    /schema/i
  ];

  return patterns.some(pattern => pattern.test(message));
}

/**
 * Check if error is a timeout error
 */
function isTimeoutError(message: string): boolean {
  const patterns = [
    /timeout/i,
    /timed out/i,
    /time.*exceeded/i,
    /deadline exceeded/i,
    /request took too long/i,
    /stalled/i,
    /lockDuration/i
  ];

  return patterns.some(pattern => pattern.test(message));
}

/**
 * Check if error is a circuit breaker error
 */
function isCircuitBreakerError(message: string): boolean {
  const patterns = [
    /circuit breaker/i,
    /rate limit/i,
    /too many requests/i,
    /throttle/i,
    /breaker.*open/i
  ];

  return patterns.some(pattern => pattern.test(message));
}

/**
 * Check if error is a Chatwoot API error
 */
function isChatwootError(message: string): boolean {
  const patterns = [
    /chatwoot/i,
    /chatwoot api/i,
    /conversation.*not found/i,
    /contact.*not found/i
  ];

  return patterns.some(pattern => pattern.test(message));
}
