// ABOUTME: Queue health monitor for broker assignment system.
// ABOUTME: Checks failed jobs and Redis pool metrics every 5 minutes, alerts via Slack when thresholds exceeded.

import { getQueueMetrics } from '@/lib/queue/broker-queue';
import { getRedisPoolMetrics } from '../queue/redis-config';
import { notifyQueueHealth } from './alert-service';

/**
 * Health check thresholds
 */
const THRESHOLD_WARNING = 10; // Failed jobs
const THRESHOLD_CRITICAL = 20; // Failed jobs
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Health status result
 */
export interface QueueHealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'error';
  metrics: {
    waiting: number;
    active: number;
    failed: number;
    completed: number;
    delayed: number;
  };
  redisPool: {
    totalConnections: number;
    activeConnections: number;
    poolUtilization: number;
  };
  error?: string;
  timestamp: string;
}

let healthMonitorInterval: NodeJS.Timeout | null = null;

/**
 * Check queue health and send alerts if thresholds exceeded
 *
 * Integration contracts (from synthesis):
 * - Uses error classification from lib/queue/broker-worker-errors.ts
 * - Alerts via lib/monitoring/alert-service.ts
 * - Gets Redis metrics from lib/queue/redis-config.ts
 */
export async function checkQueueHealth(): Promise<QueueHealthStatus> {
  try {
    // Get queue metrics
    const queueMetrics = await getQueueMetrics();
    
    if (!queueMetrics) {
      return {
        status: 'error',
        metrics: {
          waiting: 0,
          active: 0,
          failed: 0,
          completed: 0,
          delayed: 0,
        },
        redisPool: {
          totalConnections: 0,
          activeConnections: 0,
          poolUtilization: 0,
        },
        error: 'Queue metrics unavailable',
        timestamp: new Date().toISOString(),
      };
    }

    // Get Redis pool metrics
    const redisMetrics = getRedisPoolMetrics();

    // Determine health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (queueMetrics.failed >= THRESHOLD_CRITICAL) {
      status = 'critical';
    } else if (queueMetrics.failed >= THRESHOLD_WARNING) {
      status = 'warning';
    }

    console.log('📊 Queue health check:', {
      status,
      failed: queueMetrics.failed,
      active: queueMetrics.active,
      waiting: queueMetrics.waiting,
      redisPool: redisMetrics.poolUtilization.toFixed(1) + '%',
    });

    // Send alert if needed
    if (status === 'critical') {
      await notifyQueueHealth({
        level: 'CRITICAL',
        failedJobs: queueMetrics.failed,
        activeJobs: queueMetrics.active,
        waitingJobs: queueMetrics.waiting,
        timestamp: new Date().toISOString(),
      });
    } else if (status === 'warning') {
      await notifyQueueHealth({
        level: 'WARNING',
        failedJobs: queueMetrics.failed,
        activeJobs: queueMetrics.active,
        waitingJobs: queueMetrics.waiting,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status,
      metrics: {
        waiting: queueMetrics.waiting,
        active: queueMetrics.active,
        failed: queueMetrics.failed,
        completed: queueMetrics.completed,
        delayed: queueMetrics.delayed,
      },
      redisPool: {
        totalConnections: redisMetrics.totalConnections,
        activeConnections: redisMetrics.activeConnections,
        poolUtilization: redisMetrics.poolUtilization,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Queue health check failed:', error);
    
    return {
      status: 'error',
      metrics: {
        waiting: 0,
        active: 0,
        failed: 0,
        completed: 0,
        delayed: 0,
      },
      redisPool: {
        totalConnections: 0,
        activeConnections: 0,
        poolUtilization: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Start queue health monitoring
 * Runs health checks every 5 minutes
 */
export function startHealthMonitor(): void {
  if (healthMonitorInterval) {
    console.warn('⚠️ Health monitor already running');
    return;
  }
  
  console.log('🏥 Starting queue health monitor (5 min interval)');
  
  // Run initial check (don't await - fire and forget)
  checkQueueHealth();
  
  // Schedule recurring checks
  healthMonitorInterval = setInterval(() => {
    checkQueueHealth();
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop queue health monitoring
 */
export async function stopHealthMonitor(): Promise<void> {
  if (healthMonitorInterval) {
    clearInterval(healthMonitorInterval);
    healthMonitorInterval = null;
    console.log('🏥 Queue health monitor stopped');
  }
}
