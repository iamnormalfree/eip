/**
 * Worker Manager for Next.js
 *
 * PURPOSE:
 * Ensures BullMQ worker runs in server environment only and handles
 * lifecycle management for Railway/Vercel deployments.
 *
 * INTEGRATION NOTES:
 * - Called by: app/api/health/route.ts (auto-initializes worker)
 * - Uses singleton pattern to prevent multiple worker instances
 * - Handles graceful shutdown for production deployments
 *
 * IMPORTANT:
 * Workers MUST NOT run in client-side code or they will fail.
 * This manager ensures server-side only execution.
 */

let workerInitialized = false;
let worker: any = null;

/**
 * Initialize BullMQ worker
 *
 * WHEN TO CALL:
 * - From app/api/health/route.ts (auto-initializes on API startup)
 * - From scripts/test-queue.ts (for testing)
 *
 * WHEN NOT TO CALL:
 * - Client-side code (browser)
 * - During Next.js build process
 * - SSR rendering
 *
 * @returns Worker instance or null if already initialized/client-side
 */
export async function initializeWorker() {
  // Skip on client-side
  if (typeof window !== 'undefined') {
    console.log('⚠️ Worker initialization skipped (client-side)');
    return null;
  }

  // Skip if already initialized
  if (workerInitialized && worker) {
    console.log('✅ Worker already initialized');
    return worker;
  }

  try {
    console.log('🚀 Initializing BullMQ worker...');

    // Dynamically import worker (lazy load)
    // This prevents the worker from being bundled in client-side code
    const { getBrokerWorker } = await import('./broker-worker');

    worker = getBrokerWorker();
    workerInitialized = true;

    console.log('✅ BullMQ worker initialized successfully');
    console.log(`   Concurrency: ${process.env.WORKER_CONCURRENCY || 10}`);
    console.log(`   Rate limit: ${process.env.QUEUE_RATE_LIMIT || 30}/second`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);

    return worker;
  } catch (error) {
    console.error('❌ Failed to initialize worker:', error);
    workerInitialized = false;
    worker = null;
    throw error;
  }
}

/**
 * Get worker status for health checks
 *
 * USED BY:
 * - app/api/health/route.ts
 * - app/api/admin/migration-status/route.ts
 * - scripts/monitor-migration.ts
 *
 * @returns Status object with worker state
 */
export function getWorkerStatus() {
  return {
    initialized: workerInitialized,
    running: worker !== null,
    isPaused: worker?.isPaused() || false,
    isRunning: worker?.isRunning() || false,
  };
}

/**
 * Close worker (for testing or shutdown)
 *
 * WHEN TO CALL:
 * - During test cleanup
 * - Manual shutdown via admin API
 * - Before restarting worker
 *
 * NOTE: Worker will auto-restart on next API call if in production
 */
export async function closeWorker() {
  if (worker) {
    console.log('⏹️ Closing worker...');
    await worker.close();
    workerInitialized = false;
    worker = null;
    console.log('✅ Worker closed');
  }
}

/**
 * Restart worker
 *
 * WHEN TO CALL:
 * - After configuration changes
 * - Manual restart via admin API
 * - Recovery from errors
 */
export async function restartWorker() {
  console.log('🔄 Restarting worker...');
  await closeWorker();
  return await initializeWorker();
}

// Auto-initialize in production
// This ensures the worker starts automatically when the API routes are first accessed
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  initializeWorker().catch(err => {
    console.error('❌ Failed to auto-initialize worker in production:', err);
    // Don't throw - allow the app to continue without worker
    // Worker will be retried on next API call
  });
}
export async function getWorkerPerformanceMetrics() {
  try {
    const basicStatus = getWorkerStatus();
    const { getQueueMetrics } = await import("./broker-queue");
    const queueMetrics = await getQueueMetrics();
    
    const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "10");
    const rateLimit = parseInt(process.env.QUEUE_RATE_LIMIT || "30");
    
    const utilizationRate = queueMetrics ? queueMetrics.active / concurrency : 0;
    const estimatedThroughput = Math.min(queueMetrics ? queueMetrics.active : 0, rateLimit);
    
    let slaCompliance = "healthy";
    const alerts = [];
    
    if (queueMetrics) {
      if (queueMetrics.waiting > 20) {
        slaCompliance = "critical";
        alerts.push("Queue backup: " + queueMetrics.waiting + " jobs waiting");
      } else if (queueMetrics.waiting > 10) {
        slaCompliance = "warning";
        alerts.push("Queue growing: " + queueMetrics.waiting + " jobs waiting");
      }
      
      if (utilizationRate > 0.9) {
        alerts.push("High worker utilization: " + Math.round(utilizationRate * 100) + "%");
      }
    }
    
    return {
      basicStatus,
      optimization: {
        concurrency,
        rateLimit,
        utilizationRate,
        estimatedThroughput,
        queueDepth: queueMetrics ? queueMetrics.waiting : 0,
        slaCompliance,
      },
      alerts,
    };
  } catch (error) {
    return {
      basicStatus: getWorkerStatus(),
      optimization: {
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || "10"),
        rateLimit: parseInt(process.env.QUEUE_RATE_LIMIT || "30"),
        utilizationRate: 0,
        estimatedThroughput: 0,
        queueDepth: 0,
        slaCompliance: "critical",
      },
      alerts: ["Metrics retrieval failed"],
    };
  }
}
