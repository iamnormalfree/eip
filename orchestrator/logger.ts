// ABOUTME: Structured logging system for EIP orchestrator with correlation tracking
// ABOUTME: Provides comprehensive logging with Winston and correlation ID propagation

// Polyfill setImmediate for test environments (Jest doesn't provide this)
if (typeof setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: (...args: any[]) => void) => setTimeout(fn, 0);
}

import winston from 'winston';
import { randomUUID } from 'crypto';

export interface LogContext {
  correlationId: string;
  jobId?: string;
  stage?: OrchestratorStage;
  userId?: string;
  persona?: string;
  funnel?: string;
  tier?: Tier;
  [key: string]: any;
}

export interface PerformanceMetrics {
  stageDuration?: number;
  tokensUsed?: number;
  budgetRemaining?: number;
  queueProcessingTime?: number;
  memoryUsage?: number;
  [key: string]: any;
}

export type OrchestratorStage = 'retrieval' | 'planner' | 'generator' | 'auditor' | 'repairer' | 'review';
export type Tier = 'LIGHT' | 'MEDIUM' | 'HEAVY';

/**
 * Structured logger for EIP orchestrator with correlation tracking
 */
class EIPLogger {
  private logger: winston.Logger;
  private correlationContext: Map<string, LogContext> = new Map();

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.EIP_LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, correlationId, jobId, stage, ...meta }) => {
          const logEntry = {
            timestamp,
            level,
            message,
            correlationId,
            jobId,
            stage,
            ...meta
          };
          return JSON.stringify(logEntry);
        })
      ),
      defaultMeta: {
        service: 'eip-orchestrator',
        version: '1.0.0'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/eip-orchestrator.log',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/eip-errors.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        })
      ]
    });

    // Create logs directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Start a new correlation context for tracking
   */
  startCorrelation(context: Omit<LogContext, 'correlationId'>): string {
    const correlationId = context.correlationId || randomUUID();
    const fullContext: LogContext = {
      ...context,
      correlationId
    };

    this.correlationContext.set(correlationId, fullContext);

    this.info('Started correlation context', {
      correlationId,
      event: 'correlation_started',
      ...fullContext
    });

    return correlationId;
  }

  /**
   * Update existing correlation context
   */
  updateCorrelation(correlationId: string, updates: Partial<LogContext>): void {
    const existing = this.correlationContext.get(correlationId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.correlationContext.set(correlationId, updated);

      this.debug('Updated correlation context', {
        correlationId,
        event: 'correlation_updated',
        updates: Object.keys(updates)
      });
    }
  }

  /**
   * End correlation context and cleanup
   */
  endCorrelation(correlationId: string): void {
    const context = this.correlationContext.get(correlationId);
    if (context) {
      this.info('Ended correlation context', {
        correlationId,
        event: 'correlation_ended',
        duration: Date.now() - (context.startTime || Date.now())
      });

      this.correlationContext.delete(correlationId);
    }
  }

  /**
   * Get current correlation context
   */
  getCorrelationContext(correlationId: string): LogContext | undefined {
    return this.correlationContext.get(correlationId);
  }

  /**
   * Log stage start with comprehensive context
   */
  logStageStart(correlationId: string, stage: OrchestratorStage, metadata?: any): void {
    const context = this.correlationContext.get(correlationId);

    this.info(`Stage started: ${stage}`, {
      correlationId,
      jobId: context?.jobId,
      stage,
      event: 'stage_started',
      timestamp: Date.now(),
      ...metadata
    });

    // Update context with current stage
    if (context) {
      this.updateCorrelation(correlationId, {
        stage,
        lastStageStart: Date.now()
      });
    }
  }

  /**
   * Log stage completion with performance metrics
   */
  logStageComplete(correlationId: string, stage: OrchestratorStage, metrics: PerformanceMetrics): void {
    const context = this.correlationContext.get(correlationId);

    // Safely extract metrics with defaults
    const safeMetrics = {
      duration: metrics?.stageDuration,
      tokensUsed: metrics?.tokensUsed,
      budgetRemaining: metrics?.budgetRemaining,
      ...metrics
    };

    this.info(`Stage completed: ${stage}`, {
      correlationId,
      jobId: context?.jobId,
      stage,
      event: 'stage_completed',
      timestamp: Date.now(),
      ...safeMetrics
    });

    // Update context
    if (context) {
      this.updateCorrelation(correlationId, {
        stage: undefined, // Clear current stage
        lastStageComplete: Date.now()
      });
    }
  }

  /**
   * Log budget enforcement actions
   */
  logBudgetEnforcement(correlationId: string, action: string, details: any): void {
    const context = this.correlationContext.get(correlationId);

    this.warn(`Budget enforcement: ${action}`, {
      correlationId,
      jobId: context?.jobId,
      event: 'budget_enforcement',
      action,
      budgetTier: context?.tier,
      timestamp: Date.now(),
      ...details
    });
  }

  /**
   * Log circuit breaker actions
   */
  logCircuitBreaker(correlationId: string, state: string, reason?: string): void {
    const context = this.correlationContext.get(correlationId);

    this.warn(`Circuit breaker: ${state}`, {
      correlationId,
      jobId: context?.jobId,
      event: 'circuit_breaker',
      state,
      reason,
      budgetTier: context?.tier,
      timestamp: Date.now()
    });
  }

  /**
   * Log DLQ routing with comprehensive context
   */
  logDLQRouting(correlationId: string, dlqRecord: any): void {
    const context = this.correlationContext.get(correlationId);

    this.error(`Job routed to DLQ`, {
      correlationId,
      jobId: context?.jobId,
      event: 'dlq_routed',
      timestamp: Date.now(),
      failReason: dlqRecord.fail_reason,
      budgetTier: dlqRecord.budget_tier,
      breaches: dlqRecord.breaches?.length || 0,
      circuitBreakerTriggered: dlqRecord.circuit_breaker_triggered,
      recoverySuggestions: dlqRecord.recovery_suggestions?.length || 0
    });
  }

  /**
   * Log queue submission with tracking
   */
  logQueueSubmission(correlationId: string, queueJobId: string, metadata: any): void {
    const context = this.correlationContext.get(correlationId);

    this.info(`Job submitted to queue`, {
      correlationId,
      jobId: context?.jobId,
      queueJobId,
      event: 'queue_submission',
      timestamp: Date.now(),
      queuePriority: metadata.priority,
      tier: context?.tier,
      persona: context?.persona,
      funnel: context?.funnel
    });
  }

  /**
   * Log performance metrics for system monitoring
   */
  logPerformance(correlationId: string, metrics: PerformanceMetrics & {
    memoryUsage?: number;
    cpuUsage?: number;
    queueSize?: number;
  }): void {
    const context = this.correlationContext.get(correlationId);

    this.info(`Performance metrics`, {
      correlationId,
      jobId: context?.jobId,
      event: 'performance_metrics',
      timestamp: Date.now(),
      ...metrics
    });
  }

  /**
   * Log errors with full context preservation
   */
  logError(correlationId: string, error: Error | any, context?: any): void {
    const logContext = this.correlationContext.get(correlationId);

    // Handle both Error objects and error-like objects
    const errorName = error.name || 'Error';
    const errorMessage = error.message || error.toString();
    const stackTrace = error.stack || undefined;

    this.error(`Error occurred: ${errorMessage}`, {
      correlationId,
      jobId: logContext?.jobId,
      stage: logContext?.stage,
      event: 'error',
      timestamp: Date.now(),
      errorName,
      errorMessage,
      stackTrace,
      ...context
    });
  }

  // Standard logging methods with correlation support
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Get logger statistics for monitoring
   */
  getStats(): { activeCorrelations: number; totalCorrelations: number } {
    return {
      activeCorrelations: this.correlationContext.size,
      totalCorrelations: this.correlationContext.size // In-memory, so same as active
    };
  }

  /**
   * Cleanup old correlation contexts (prevent memory leaks)
   */
  cleanup(maxAge: number = 60 * 60 * 1000): void { // Default 1 hour
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [correlationId, context] of this.correlationContext.entries()) {
      if (context.startTime && (now - context.startTime) > maxAge) {
        toDelete.push(correlationId);
      }
    }

    toDelete.forEach(correlationId => {
      this.endCorrelation(correlationId);
    });

    if (toDelete.length > 0) {
      this.info(`Cleaned up ${toDelete.length} old correlation contexts`, {
        event: 'correlation_cleanup',
        cleanedCount: toDelete.length
      });
    }
  }
}

// Singleton instance
const eipLogger = new EIPLogger();

// Export convenience functions
export const startCorrelation = (context: Omit<LogContext, 'correlationId'>) =>
  eipLogger.startCorrelation(context);

export const updateCorrelation = (correlationId: string, updates: Partial<LogContext>) =>
  eipLogger.updateCorrelation(correlationId, updates);

export const endCorrelation = (correlationId: string) =>
  eipLogger.endCorrelation(correlationId);

export const logStageStart = (correlationId: string, stage: OrchestratorStage, metadata?: any) =>
  eipLogger.logStageStart(correlationId, stage, metadata);

export const logStageComplete = (correlationId: string, stage: OrchestratorStage, metrics: PerformanceMetrics) =>
  eipLogger.logStageComplete(correlationId, stage, metrics);

export const logBudgetEnforcement = (correlationId: string, action: string, details: any) =>
  eipLogger.logBudgetEnforcement(correlationId, action, details);

export const logCircuitBreaker = (correlationId: string, state: string, reason?: string) =>
  eipLogger.logCircuitBreaker(correlationId, state, reason);

export const logDLQRouting = (correlationId: string, dlqRecord: any) =>
  eipLogger.logDLQRouting(correlationId, dlqRecord);

export const logQueueSubmission = (correlationId: string, queueJobId: string, metadata: any) =>
  eipLogger.logQueueSubmission(correlationId, queueJobId, metadata);

export const logPerformance = (correlationId: string, metrics: PerformanceMetrics) =>
  eipLogger.logPerformance(correlationId, metrics);

export const logError = (correlationId: string, error: Error, context?: any) =>
  eipLogger.logError(correlationId, error, context);

export const getLogger = () => eipLogger;

export default eipLogger;