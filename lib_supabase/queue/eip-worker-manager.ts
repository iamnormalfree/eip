// ABOUTME: EIP Worker Manager - Unified coordination of all EIP queue workers
// ABOUTME: Manages content generation, budget validation, audit/repair, and DLQ workers

import { getEIPContentWorker } from './eip-content-worker';
import { getEIPBudgetWorker } from './eip-budget-worker';
import { getEIPAuditWorker } from './eip-audit-worker';
import { getEIPDLQWorker } from './eip-dlq-worker';
import { getEIPQueueMetrics } from './eip-queue';

// ============================================================================
// EIP WORKER MANAGER
// ============================================================================
// Integration: Unified worker coordination and management

/**
 * EIP Worker Manager coordinates all EIP queue workers
 * 
 * Key Features:
 * - Initialize and manage all EIP workers
 * - Monitor worker health and performance
 * - Graceful shutdown handling
 * - Metrics aggregation and reporting
 */
class EIPWorkerManager {
  private workers: Map<string, any> = new Map();
  private isInitialized = false;
  private isShuttingDown = false;

  /**
   * Initialize all EIP workers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ EIP Worker Manager already initialized');
      return;
    }

    console.log('🚀 Initializing EIP Worker Manager...');
    
    try {
      // Initialize all workers
      const contentWorker = getEIPContentWorker();
      const budgetWorker = getEIPBudgetWorker();
      const auditWorker = getEIPAuditWorker();
      const dlqWorker = getEIPDLQWorker();

      // Store worker references
      this.workers.set('content', contentWorker);
      this.workers.set('budget', budgetWorker);
      this.workers.set('audit', auditWorker);
      this.workers.set('dlq', dlqWorker);

      console.log('✅ All EIP workers initialized successfully');
      console.log(`   Content Worker: ${contentWorker.opts.concurrency} concurrency`);
      console.log(`   Budget Worker: ${budgetWorker.opts.concurrency} concurrency`);
      console.log(`   Audit Worker: ${auditWorker.opts.concurrency} concurrency`);
      console.log(`   DLQ Worker: ${dlqWorker.opts.concurrency} concurrency`);

      this.isInitialized = true;

      // Start periodic metrics collection
      this.startMetricsCollection();

    } catch (error) {
      console.error('❌ Failed to initialize EIP workers:', error);
      throw error;
    }
  }

  /**
   * Get worker by name
   */
  getWorker(name: string): any {
    return this.workers.get(name);
  }

  /**
   * Get all workers
   */
  getAllWorkers(): Map<string, any> {
    return new Map(this.workers);
  }

  /**
   * Get worker health status
   */
  async getWorkerHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    workers: Record<string, {
      status: 'running' | 'stopped' | 'error';
      uptime?: number;
      last_activity?: number;
    }>;
  }> {
    const workerStatuses: Record<string, any> = {};
    let healthyCount = 0;
    let totalCount = this.workers.size;

    for (const [name, worker] of this.workers) {
      try {
        // Check worker status
        const isRunning = worker && worker.isRunning();
        const status = isRunning ? 'running' : 'stopped';
        
        if (isRunning) {
          healthyCount++;
        }

        workerStatuses[name] = {
          status,
          uptime: worker ? Date.now() - (worker.startTime || Date.now()) : 0,
          last_activity: worker ? worker.lastActivity || Date.now() : Date.now()
        };

      } catch (error) {
        workerStatuses[name] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    const overallStatus = healthyCount === totalCount ? 'healthy' :
                         healthyCount > 0 ? 'degraded' : 'unhealthy';

    return {
      overall: overallStatus,
      workers: workerStatuses
    };
  }

  /**
   * Get comprehensive metrics
   */
  async getMetrics(): Promise<{
    queue_metrics: any;
    worker_health: any;
    system_metrics: any;
  }> {
    const [queueMetrics, workerHealth] = await Promise.all([
      getEIPQueueMetrics(),
      this.getWorkerHealth()
    ]);

    return {
      queue_metrics: queueMetrics,
      worker_health: workerHealth,
      system_metrics: {
        workers_initialized: this.workers.size,
        uptime: Date.now() - (this.startTime || Date.now()),
        memory_usage: process.memoryUsage(),
        node_version: process.version
      }
    };
  }

  /**
   * Gracefully shutdown all workers
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      console.log('⚠️ EIP Worker Manager already shutting down');
      return;
    }

    this.isShuttingDown = true;
    console.log('\n⚠️ Shutting down EIP Worker Manager...');

    const shutdownPromises: Promise<void>[] = [];

    for (const [name, worker] of this.workers) {
      shutdownPromises.push(
        (async () => {
          try {
            console.log(`   Shutting down ${name} worker...`);
            await worker.close();
            console.log(`   ✅ ${name} worker shut down`);
          } catch (error) {
            console.error(`   ❌ Failed to shut down ${name} worker:`, error);
          }
        })()
      );
    }

    try {
      await Promise.all(shutdownPromises);
      console.log('✅ All EIP workers shut down successfully');
    } catch (error) {
      console.error('❌ Errors during worker shutdown:', error);
    }

    this.workers.clear();
    this.isInitialized = false;
  }

  /**
   * Restart specific worker
   */
  async restartWorker(name: string): Promise<{ success: boolean; error?: string }> {
    if (!this.workers.has(name)) {
      return { success: false, error: `Worker '${name}' not found` };
    }

    try {
      console.log(`🔄 Restarting ${name} worker...`);
      
      // Close existing worker
      const worker = this.workers.get(name);
      await worker.close();
      
      // Reinitialize worker based on type
      let newWorker;
      switch (name) {
        case 'content':
          newWorker = getEIPContentWorker();
          break;
        case 'budget':
          newWorker = getEIPBudgetWorker();
          break;
        case 'audit':
          newWorker = getEIPAuditWorker();
          break;
        case 'dlq':
          newWorker = getEIPDLQWorker();
          break;
        default:
          throw new Error(`Unknown worker type: ${name}`);
      }
      
      this.workers.set(name, newWorker);
      console.log(`✅ ${name} worker restarted successfully`);
      
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Failed to restart ${name} worker:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private startTime = Date.now();
  private metricsInterval: NodeJS.Timeout | null = null;

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      if (this.isShuttingDown) {
        return;
      }

      try {
        const metrics = await this.getMetrics();
        
        // Log key metrics
        const queueMetrics = metrics.queue_metrics;
        if (queueMetrics) {
          const totals = queueMetrics.totals;
          console.log(`📊 EIP Queue Metrics:`, {
            waiting: totals.waiting,
            active: totals.active,
            completed: totals.completed,
            failed: totals.failed
          });
        }

        // Alert on high failure rates
        if (queueMetrics && queueMetrics.totals && queueMetrics.totals.failed > 10) {
          console.warn(`⚠️ High failure rate detected: ${queueMetrics.totals.failed} failed jobs`);
        }

        // Alert on queue backup
        if (queueMetrics && queueMetrics.totals && queueMetrics.totals.waiting > 50) {
          console.warn(`⚠️ Queue backup detected: ${queueMetrics.totals.waiting} jobs waiting`);
        }

      } catch (error) {
        console.error('❌ Failed to collect metrics:', error);
      }
    }, 30000); // Collect metrics every 30 seconds

    console.log('📊 Periodic metrics collection started (30s interval)');
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Global worker manager instance
const eipWorkerManager = new EIPWorkerManager();

// ============================================================================
// WORKER MANAGER INITIALIZATION AND EXPORTS
// ============================================================================

/**
 * Initialize EIP worker manager
 */
export async function initializeEIPWorkers(): Promise<void> {
  await eipWorkerManager.initialize();
}

/**
 * Get worker manager instance
 */
export function getEIPWorkerManager(): EIPWorkerManager {
  return eipWorkerManager;
}

/**
 * Get EIP worker by name
 */
export function getEIPWorker(name: string): any {
  return eipWorkerManager.getWorker(name);
}

/**
 * Get all EIP workers
 */
export function getAllEIPWorkers(): Map<string, any> {
  return eipWorkerManager.getAllWorkers();
}

/**
 * Get EIP worker health status
 */
export async function getEIPWorkerHealth(): Promise<any> {
  return await eipWorkerManager.getWorkerHealth();
}

/**
 * Get comprehensive EIP metrics
 */
export async function getEIPMetrics(): Promise<any> {
  return await eipWorkerManager.getMetrics();
}

/**
 * Restart specific EIP worker
 */
export async function restartEIPWorker(name: string): Promise<{ success: boolean; error?: string }> {
  return await eipWorkerManager.restartWorker(name);
}

/**
 * Shutdown all EIP workers
 */
export async function shutdownEIPWorkers(): Promise<void> {
  await eipWorkerManager.shutdown();
}

// ============================================================================
// CLI INTERFACE FOR WORKER MANAGEMENT
// ============================================================================

/**
 * CLI function to start EIP workers
 */
async function startEIPWorkersCLI(): Promise<void> {
  console.log('🚀 Starting EIP Workers from CLI...');
  
  try {
    await initializeEIPWorkers();
    
    console.log('✅ EIP Workers started successfully');
    console.log('Press Ctrl+C to shutdown gracefully');
    
    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received, shutting down EIP Workers...`);
      await shutdownEIPWorkers();
      console.log('✅ EIP Workers shut down successfully');
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Keep process alive
    await new Promise(() => {}); // Never resolve
    
  } catch (error) {
    console.error('❌ Failed to start EIP Workers:', error);
    process.exit(1);
  }
}

// CLI entry point
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      startEIPWorkersCLI().catch((err) => {
        console.error('CLI error:', err);
        process.exit(1);
      });
      break;
      
    case 'status':
      getEIPWorkerHealth().then((health) => {
        console.log('🏥 EIP Worker Health Status:');
        console.log(`   Overall: ${health.overall}`);
        console.log('   Workers:');
        for (const [name, status] of Object.entries(health.workers)) {
          console.log(`     ${name}: ${status.status}`);
        }
      }).catch((err) => {
        console.error('Failed to get worker health:', err);
        process.exit(1);
      });
      break;
      
    case 'metrics':
      getEIPMetrics().then((metrics) => {
        console.log('📊 EIP System Metrics:');
        console.log(JSON.stringify(metrics, null, 2));
      }).catch((err) => {
        console.error('Failed to get metrics:', err);
        process.exit(1);
      });
      break;
      
    default:
      console.log('Usage: node eip-worker-manager.js [start|status|metrics]');
      console.log('  start   - Start all EIP workers and keep running');
      console.log('  status  - Show worker health status');
      console.log('  metrics - Show comprehensive system metrics');
      process.exit(1);
  }
}

// Export worker manager class for advanced usage
export { EIPWorkerManager };
