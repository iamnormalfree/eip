"use strict";
// ABOUTME: Structured logging system for EIP orchestrator with correlation tracking
// ABOUTME: Provides comprehensive logging with Winston and correlation ID propagation
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.logError = exports.logPerformance = exports.logQueueSubmission = exports.logDLQRouting = exports.logCircuitBreaker = exports.logBudgetEnforcement = exports.logStageComplete = exports.logStageStart = exports.endCorrelation = exports.updateCorrelation = exports.startCorrelation = void 0;
// Polyfill setImmediate for test environments (Jest doesn't provide this)
if (typeof setImmediate === 'undefined') {
    global.setImmediate = (fn) => setTimeout(fn, 0);
}
const winston_1 = require("winston");
const crypto_1 = require("crypto");
/**
 * Structured logger for EIP orchestrator with correlation tracking
 */
class EIPLogger {
    constructor() {
        this.correlationContext = new Map();
        this.logger = winston_1.default.createLogger({
            level: process.env.EIP_LOG_LEVEL || 'info',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, correlationId, jobId, stage, ...meta }) => {
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
            })),
            defaultMeta: {
                service: 'eip-orchestrator',
                version: '1.0.0'
            },
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                }),
                new winston_1.default.transports.File({
                    filename: 'logs/eip-orchestrator.log',
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                }),
                new winston_1.default.transports.File({
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
    startCorrelation(context) {
        const correlationId = context.correlationId || (0, crypto_1.randomUUID)();
        const fullContext = {
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
    updateCorrelation(correlationId, updates) {
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
    endCorrelation(correlationId) {
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
    getCorrelationContext(correlationId) {
        return this.correlationContext.get(correlationId);
    }
    /**
     * Log stage start with comprehensive context
     */
    logStageStart(correlationId, stage, metadata) {
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
    logStageComplete(correlationId, stage, metrics) {
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
    logBudgetEnforcement(correlationId, action, details) {
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
    logCircuitBreaker(correlationId, state, reason) {
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
    logDLQRouting(correlationId, dlqRecord) {
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
    logQueueSubmission(correlationId, queueJobId, metadata) {
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
    logPerformance(correlationId, metrics) {
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
    logError(correlationId, error, context) {
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
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, meta) {
        this.logger.error(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    /**
     * Get logger statistics for monitoring
     */
    getStats() {
        return {
            activeCorrelations: this.correlationContext.size,
            totalCorrelations: this.correlationContext.size // In-memory, so same as active
        };
    }
    /**
     * Cleanup old correlation contexts (prevent memory leaks)
     */
    cleanup(maxAge = 60 * 60 * 1000) {
        const now = Date.now();
        const toDelete = [];
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
const startCorrelation = (context) => eipLogger.startCorrelation(context);
exports.startCorrelation = startCorrelation;
const updateCorrelation = (correlationId, updates) => eipLogger.updateCorrelation(correlationId, updates);
exports.updateCorrelation = updateCorrelation;
const endCorrelation = (correlationId) => eipLogger.endCorrelation(correlationId);
exports.endCorrelation = endCorrelation;
const logStageStart = (correlationId, stage, metadata) => eipLogger.logStageStart(correlationId, stage, metadata);
exports.logStageStart = logStageStart;
const logStageComplete = (correlationId, stage, metrics) => eipLogger.logStageComplete(correlationId, stage, metrics);
exports.logStageComplete = logStageComplete;
const logBudgetEnforcement = (correlationId, action, details) => eipLogger.logBudgetEnforcement(correlationId, action, details);
exports.logBudgetEnforcement = logBudgetEnforcement;
const logCircuitBreaker = (correlationId, state, reason) => eipLogger.logCircuitBreaker(correlationId, state, reason);
exports.logCircuitBreaker = logCircuitBreaker;
const logDLQRouting = (correlationId, dlqRecord) => eipLogger.logDLQRouting(correlationId, dlqRecord);
exports.logDLQRouting = logDLQRouting;
const logQueueSubmission = (correlationId, queueJobId, metadata) => eipLogger.logQueueSubmission(correlationId, queueJobId, metadata);
exports.logQueueSubmission = logQueueSubmission;
const logPerformance = (correlationId, metrics) => eipLogger.logPerformance(correlationId, metrics);
exports.logPerformance = logPerformance;
const logError = (correlationId, error, context) => eipLogger.logError(correlationId, error, context);
exports.logError = logError;
const getLogger = () => eipLogger;
exports.getLogger = getLogger;
exports.default = eipLogger;
