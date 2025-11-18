// ABOUTME: Basic monitoring and metrics collection for EIP Orchestrator
// ABOUTME: Provides Prometheus-compatible metrics endpoint and pipeline performance tracking

import * as client from 'prom-client';
import { getLogger } from './logger';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label to all metrics
register.setDefaultLabels({
  app: 'eip-orchestrator'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for EIP orchestrator
const pipelineDuration = new client.Histogram({
  name: 'eip_pipeline_duration_seconds',
  help: 'Duration of pipeline execution in seconds',
  labelNames: ['tier', 'stage', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
});

const tokenUsage = new client.Histogram({
  name: 'eip_token_usage_total',
  help: 'Total tokens used per pipeline execution',
  labelNames: ['tier', 'stage'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 4000, 8000]
});

const pipelineRequests = new client.Counter({
  name: 'eip_pipeline_requests_total',
  help: 'Total number of pipeline requests',
  labelNames: ['tier', 'mode', 'status']
});

const queueOperations = new client.Counter({
  name: 'eip_queue_operations_total',
  help: 'Total number of queue operations',
  labelNames: ['operation', 'status']
});

const budgetViolations = new client.Counter({
  name: 'eip_budget_violations_total',
  help: 'Total number of budget violations',
  labelNames: ['tier', 'stage', 'violation_type']
});

const complianceChecks = new client.Counter({
  name: 'eip_compliance_checks_total',
  help: 'Total number of compliance checks',
  labelNames: ['status', 'domain']
});

const activeJobs = new client.Gauge({
  name: 'eip_active_jobs',
  help: 'Current number of active jobs',
  labelNames: ['tier']
});

const queueSize = new client.Gauge({
  name: 'eip_queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name']
});

const memoryUsage = new client.Gauge({
  name: 'eip_memory_usage_bytes',
  help: 'Memory usage in bytes'
});

const errorRate = new client.Gauge({
  name: 'eip_error_rate',
  help: 'Error rate percentage',
  labelNames: ['stage']
});

// Register custom metrics
register.registerMetric(pipelineDuration);
register.registerMetric(tokenUsage);
register.registerMetric(pipelineRequests);
register.registerMetric(queueOperations);
register.registerMetric(budgetViolations);
register.registerMetric(complianceChecks);
register.registerMetric(activeJobs);
register.registerMetric(queueSize);
register.registerMetric(memoryUsage);
register.registerMetric(errorRate);

const logger = getLogger();

// Metrics collection functions
export function recordPipelineStart(tier: string, mode: string): void {
  activeJobs.inc({ tier });
}

export function recordPipelineCompletion(tier: string, mode: string, status: string, duration: number, tokensUsed: number): void {
  pipelineRequests.inc({ tier, mode, status });
  pipelineDuration.observe({ tier, status }, duration);
  tokenUsage.observe({ tier }, tokensUsed);
  activeJobs.dec({ tier });
}

export function recordQueueOperation(operation: string, status: string): void {
  queueOperations.inc({ operation, status });
}

export function recordBudgetViolation(tier: string, stage: string, violationType: string): void {
  budgetViolations.inc({ tier, stage, violation_type: violationType });
}

export function recordComplianceCheck(status: string, domain: string): void {
  complianceChecks.inc({ status, domain });
}

export function updateQueueSize(queueName: string, size: number): void {
  queueSize.set({ queue_name: queueName }, size);
}

export function updateMemoryUsage(): void {
  const memUsage = process.memoryUsage();
  memoryUsage.set(memUsage.heapUsed);
}

export function updateErrorRate(stage: string, rate: number): void {
  errorRate.set({ stage }, rate);
}

// Metrics endpoint handler
export function getMetricsEndpoint(): (req: any, res: any) => Promise<void> {
  return async (req: any, res: any) => {
    try {
      // Update dynamic metrics before responding
      updateMemoryUsage();

      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);

      logger.info('Metrics endpoint accessed', {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).end('Failed to get metrics');
    }
  };
}

// Health check endpoint
export function getHealthEndpoint(): (req: any, res: any) => void {
  return (req: any, res: any) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        memory: process.memoryUsage(),
        activeJobs: activeJobs.get() || 0
      };

      res.json(health);

      logger.info('Health check endpoint accessed', {
        status: health.status,
        uptime: health.uptime,
        timestamp: health.timestamp
      });
    } catch (error) {
      logger.error('Failed to perform health check', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Setup monitoring for Express app
export function setupMonitoring(app: any): void {
  // Health check endpoint
  app.get('/health', getHealthEndpoint());

  // Metrics endpoint for Prometheus
  app.get('/metrics', getMetricsEndpoint());

  logger.info('Monitoring endpoints configured', {
    health: '/health',
    metrics: '/metrics',
    timestamp: new Date().toISOString()
  });
}

// Get Prometheus register for custom metrics
export function getPrometheusRegister(): client.Registry {
  return register;
}

// Export individual metrics for custom instrumentation
export {
  pipelineDuration,
  tokenUsage,
  pipelineRequests,
  queueOperations,
  budgetViolations,
  complianceChecks,
  activeJobs,
  queueSize,
  memoryUsage,
  errorRate
};