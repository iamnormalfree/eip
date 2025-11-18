// ABOUTME: EIP Queue System - Queue-First Architecture for Educational Content Generation
// ABOUTME: Implements BullMQ-based job processing with budget checkpoints and DLQ routing

import { Queue, QueueEvents, Worker } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { BudgetEnforcer, Tier } from '../../orchestrator/budget';

// ============================================================================
// EIP QUEUE SYSTEM - UNIFIED BLUEPRINT IMPLEMENTATION
// ============================================================================
// Following: blueprint::implementation_sequence::phase_1_foundation_first
// Following: contract::final::queue_system_to_all_domains
// Following: decision::technical::queue_first_pattern

/**
 * Primary EIP Queue Names - following unified blueprint specifications
 * 
 * Integration contracts from synthesis:
 * - Expose: EIP job processing interface with budget checkpoints
 * - Consume: Database job tracking, orchestrator submission patterns
 */
export const EIP_QUEUES = {
  CONTENT_GENERATION: 'eip:prod:content-generation:primary:v1',
  BUDGET_VALIDATION: 'eip:prod:budget-enforcement:validation:v1', 
  AUDIT_REPAIR: 'eip:prod:quality:audit-repair:v1',
  DLQ_PROCESSING: 'eip:prod:dlq:content-generation:v1'
} as const;

/**
 * EIP Job Types - following unified blueprint specifications
 *
 * Implementation follows synthesis decisions exactly
 */
export interface EIPContentGenerationJob {
  type: 'content-generation';
  brief: string;
  persona?: string;
  funnel?: string;
  tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  correlation_id?: string;
  priority?: number;
  metadata?: Record<string, any>;
  // Queue-specific fields for timing and tracking
  job_id?: string;
  submission_timestamp?: number;
}

export interface EIPBudgetValidationJob {
  type: 'budget-validation';
  original_job_id: string;
  tier: Tier;
  tokens_used: number;
  time_elapsed: number;
  stage_breakdown: {
    tokens: Record<string, number>;
    times_ms: Record<string, number>;
  };
  breaches: Array<{
    stage: string;
    type: 'tokens' | 'time';
    limit: number;
    actual: number;
    timestamp: number;
    severity?: 'warning' | 'critical';
  }>;
  correlation_id?: string;
}

export interface EIPAuditRepairJob {
  type: 'audit-repair';
  content_id: string;
  content_type: 'draft' | 'artifact';
  ip_type: string;
  audit_issues: Array<{
    type: 'ip_invariant' | 'compliance' | 'quality';
    severity: 'error' | 'warning';
    message: string;
    context?: any;
  }>;
  correlation_id?: string;
  priority?: number;
}

export interface EIPDLQProcessingJob {
  type: 'dlq-processing';
  failed_job: any; // Original job that failed
  failure_reason: string;
  failure_type: 'budget_breach' | 'system_error' | 'timeout' | 'circuit_breaker';
  retry_count: number;
  dlq_timestamp: number;
  recovery_attempts?: number;
  correlation_id?: string;
}

/**
 * Union type for all EIP job types
 */
export type EIPJob = EIPContentGenerationJob | EIPBudgetValidationJob | EIPAuditRepairJob | EIPDLQProcessingJob;

// ============================================================================
// QUEUE MANAGEMENT SYSTEM
// ============================================================================

/**
 * Lazy initialization for EIP queues - following broker-queue.ts patterns
 *
 * Uses correct BullMQ/Redis patterns from existing broker system
 * Queue-first architecture resolves queue vs direct execution patterns
 */
class EIPQueueManager {
  private contentQueue: Queue<EIPContentGenerationJob> | null = null;
  private budgetQueue: Queue<EIPBudgetValidationJob> | null = null;
  private auditQueue: Queue<EIPAuditRepairJob> | null = null;
  private dlqQueue: Queue<EIPDLQProcessingJob> | null = null;
  
  private contentEvents: QueueEvents | null = null;
  private budgetEvents: QueueEvents | null = null;
  private auditEvents: QueueEvents | null = null;
  private dlqEvents: QueueEvents | null = null;

  // Getters for each queue
  getContentQueue(): Queue<EIPContentGenerationJob> {
    if (!this.contentQueue) {
      this.contentQueue = new Queue(
        EIP_QUEUES.CONTENT_GENERATION,
        {
          connection: getRedisConnection(),
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: {
              age: 86400, // 24 hours
              count: 1000,
            },
            removeOnFail: {
              age: 604800, // 7 days
            },
            // EIP-specific: 30-second timeout for content generation
            
          },
        }
      );
      
      // Set up event handlers
      this.setupContentEvents();
    }
    return this.contentQueue;
  }

  getBudgetQueue(): Queue<EIPBudgetValidationJob> {
    if (!this.budgetQueue) {
      this.budgetQueue = new Queue(
        EIP_QUEUES.BUDGET_VALIDATION,
        {
          connection: getRedisConnection(),
          defaultJobOptions: {
            attempts: 2, // Fewer retries for budget validation
            backoff: {
              type: 'fixed',
              delay: 5000,
            },
            removeOnComplete: {
              age: 3600, // 1 hour - budget data is time-sensitive
              count: 500,
            },
            removeOnFail: {
              age: 86400, // 24 hours
            },
          },
        }
      );
      
      this.setupBudgetEvents();
    }
    return this.budgetQueue;
  }

  getAuditQueue(): Queue<EIPAuditRepairJob> {
    if (!this.auditQueue) {
      this.auditQueue = new Queue(
        EIP_QUEUES.AUDIT_REPAIR,
        {
          connection: getRedisConnection(),
          defaultJobOptions: {
            attempts: 2, // Audit/repair should be reliable
            backoff: {
              type: 'fixed',
              delay: 3000,
            },
            removeOnComplete: {
              age: 86400, // 24 hours
              count: 1000,
            },
            removeOnFail: {
              age: 259200, // 3 days - audit failures need investigation
            },
          },
        }
      );
      
      this.setupAuditEvents();
    }
    return this.auditQueue;
  }

  getDLQQueue(): Queue<EIPDLQProcessingJob> {
    if (!this.dlqQueue) {
      this.dlqQueue = new Queue(
        EIP_QUEUES.DLQ_PROCESSING,
        {
          connection: getRedisConnection(),
          defaultJobOptions: {
            attempts: 1, // Only process DLQ items once
            backoff: {
              type: 'fixed',
              delay: 10000, // 10 second delay for DLQ processing
            },
            removeOnComplete: {
              age: 259200, // 3 days - keep DLQ processing records
              count: 2000,
            },
            removeOnFail: {
              age: 604800, // 7 days - failed DLQ items need manual review
            },
          },
        }
      );
      
      this.setupDLQEvents();
    }
    return this.dlqQueue;
  }

  // Event handlers setup
  private setupContentEvents(): void {
    if (!this.contentEvents) {
      this.contentEvents = new QueueEvents(EIP_QUEUES.CONTENT_GENERATION, {
        connection: getRedisConnection(),
      });

      this.contentEvents.on('completed', ({ jobId }) => {
        console.log(`✅ EIP Content job completed: ${jobId}`);
      });

      this.contentEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ EIP Content job failed: ${jobId}`, failedReason);
      });

      this.contentEvents.on('active', ({ jobId }) => {
        console.log(`🔄 EIP Content job started: ${jobId}`);
      });
    }
  }

  private setupBudgetEvents(): void {
    if (!this.budgetEvents) {
      this.budgetEvents = new QueueEvents(EIP_QUEUES.BUDGET_VALIDATION, {
        connection: getRedisConnection(),
      });

      this.budgetEvents.on('completed', ({ jobId }) => {
        console.log(`✅ Budget validation job completed: ${jobId}`);
      });

      this.budgetEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ Budget validation job failed: ${jobId}`, failedReason);
      });
    }
  }

  private setupAuditEvents(): void {
    if (!this.auditEvents) {
      this.auditEvents = new QueueEvents(EIP_QUEUES.AUDIT_REPAIR, {
        connection: getRedisConnection(),
      });

      this.auditEvents.on('completed', ({ jobId }) => {
        console.log(`✅ Audit/repair job completed: ${jobId}`);
      });

      this.auditEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ Audit/repair job failed: ${jobId}`, failedReason);
      });
    }
  }

  private setupDLQEvents(): void {
    if (!this.dlqEvents) {
      this.dlqEvents = new QueueEvents(EIP_QUEUES.DLQ_PROCESSING, {
        connection: getRedisConnection(),
      });

      this.dlqEvents.on('completed', ({ jobId }) => {
        console.log(`✅ DLQ processing job completed: ${jobId}`);
      });

      this.dlqEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ DLQ processing job failed: ${jobId}`, failedReason);
        // DLQ failures are critical and may need human intervention
      });
    }
  }

  // Get all events for monitoring
  getAllEvents() {
    return {
      content: this.contentEvents,
      budget: this.budgetEvents,
      audit: this.auditEvents,
      dlq: this.dlqEvents,
    };
  }
}

// Global queue manager instance
const queueManager = new EIPQueueManager();

// ============================================================================
// QUEUE OPERATIONS - EXPOSED INTERFACE
// ============================================================================

/**
 * Submit content generation job to queue
 * 
 * Integration contract: Expose EIP job processing interface with budget checkpoints
 * Called by: orchestrator/controller.ts (to be integrated)
 */
export async function submitContentGenerationJob(data: {
  brief: string;
  persona?: string;
  funnel?: string;
  tier: Tier;
  correlation_id?: string;
  priority?: number;
  metadata?: Record<string, any>;
}): Promise<{ jobId: string; success: boolean; error?: string }> {
  try {
    const timestamp = Date.now();
    const jobId = `content-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine priority based on tier and urgency
    const priority = data.priority || (data.tier === 'HEAVY' ? 1 : data.tier === 'MEDIUM' ? 3 : 5);
    
    const jobData: EIPContentGenerationJob = {
      type: 'content-generation',
      brief: data.brief,
      persona: data.persona,
      funnel: data.funnel,
      tier: data.tier,
      correlation_id: data.correlation_id,
      priority,
      metadata: data.metadata,
      job_id: jobId,
      submission_timestamp: timestamp,
    };

    console.log(`📋 Submitting EIP content generation job:`, {
      jobId,
      tier: data.tier,
      brief: data.brief.substring(0, 100) + '...',
      priority,
    });

    const job = await queueManager.getContentQueue().add(
      'content-generation',
      jobData,
      {
        jobId,
        priority,
        // No delay for content generation - process immediately
      }
    );

    console.log(`✅ EIP content generation job submitted: ${job.id}`);
    return { jobId: job.id!, success: true };

  } catch (error) {
    console.error(`❌ Failed to submit EIP content generation job:`, error);
    return {
      jobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit budget validation job for real-time monitoring
 * 
 * Integration contract: Expose EIP job processing interface with budget checkpoints
 */
export async function submitBudgetValidationJob(data: {
  original_job_id: string;
  tier: Tier;
  budget_enforcer: BudgetEnforcer;
  correlation_id?: string;
}): Promise<{ jobId: string; success: boolean; error?: string }> {
  try {
    const tracker = data.budget_enforcer.getTracker();
    const budget = data.budget_enforcer.getBudget();
    
    const jobData: EIPBudgetValidationJob = {
      type: 'budget-validation',
      original_job_id: data.original_job_id,
      tier: data.tier,
      tokens_used: tracker.tokens_used,
      time_elapsed: (Date.now() - tracker.start_time) / 1000,
      stage_breakdown: {
        tokens: tracker.stage_tokens,
        times_ms: tracker.stage_times,
      },
      breaches: tracker.breaches,
      correlation_id: data.correlation_id,
    };

    const jobId = `budget-${data.original_job_id}-${Date.now()}`;
    
    const job = await queueManager.getBudgetQueue().add(
      'budget-validation',
      jobData,
      {
        jobId,
        // High priority for budget validation
        priority: 1,
      }
    );

    console.log(`✅ Budget validation job submitted: ${job.id} for ${data.original_job_id}`);
    return { jobId: job.id!, success: true };

  } catch (error) {
    console.error(`❌ Failed to submit budget validation job:`, error);
    return {
      jobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit audit/repair job for content quality issues
 */
export async function submitAuditRepairJob(data: {
  content_id: string;
  content_type: 'draft' | 'artifact';
  ip_type: string;
  audit_issues: Array<{
    type: 'ip_invariant' | 'compliance' | 'quality';
    severity: 'error' | 'warning';
    message: string;
    context?: any;
  }>;
  correlation_id?: string;
  priority?: number;
}): Promise<{ jobId: string; success: boolean; error?: string }> {
  try {
    const jobId = `audit-${data.content_id}-${Date.now()}`;
    
    const jobData: EIPAuditRepairJob = {
      type: 'audit-repair',
      content_id: data.content_id,
      content_type: data.content_type,
      ip_type: data.ip_type,
      audit_issues: data.audit_issues,
      correlation_id: data.correlation_id,
      priority: data.priority || 3,
    };

    const job = await queueManager.getAuditQueue().add(
      'audit-repair',
      jobData,
      {
        jobId,
        priority: data.priority || 3,
      }
    );

    console.log(`✅ Audit/repair job submitted: ${job.id} for ${data.content_id}`);
    return { jobId: job.id!, success: true };

  } catch (error) {
    console.error(`❌ Failed to submit audit/repair job:`, error);
    return {
      jobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Route failed job to DLQ with detailed context
 * 
 * Integration contract: DLQ routing works with budget violations
 */
export async function routeToDLQ(data: {
  failed_job: any;
  failure_reason: string;
  failure_type: 'budget_breach' | 'system_error' | 'timeout' | 'circuit_breaker';
  retry_count: number;
  correlation_id?: string;
}): Promise<{ dlqJobId: string; success: boolean; error?: string }> {
  try {
    const dlqTimestamp = Date.now();
    const dlqJobId = `dlq-${data.failed_job.job_id || 'unknown'}-${dlqTimestamp}`;
    
    const jobData: EIPDLQProcessingJob = {
      type: 'dlq-processing',
      failed_job: data.failed_job,
      failure_reason: data.failure_reason,
      failure_type: data.failure_type,
      retry_count: data.retry_count,
      dlq_timestamp: dlqTimestamp,
      recovery_attempts: 0,
      correlation_id: data.correlation_id,
    };

    const job = await queueManager.getDLQQueue().add(
      'dlq-processing',
      jobData,
      {
        jobId: dlqJobId,
        // Low priority for DLQ processing
        priority: 10,
      }
    );

    console.log(`📭 Job routed to DLQ: ${job.id} (${data.failure_type})`);
    return { dlqJobId: job.id!, success: true };

  } catch (error) {
    console.error(`❌ Failed to route job to DLQ:`, error);
    return {
      dlqJobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// QUEUE METRICS AND MONITORING
// ============================================================================

/**
 * Get comprehensive EIP queue metrics
 * 
 * Integration contract: Consume database job tracking patterns
 */
export async function getEIPQueueMetrics() {
  try {
    const [content, budget, audit, dlq] = await Promise.all([
      queueManager.getContentQueue().getWaitingCount(),
      queueManager.getBudgetQueue().getWaitingCount(),
      queueManager.getAuditQueue().getWaitingCount(),
      queueManager.getDLQQueue().getWaitingCount(),
    ]);

    const [contentActive, budgetActive, auditActive, dlqActive] = await Promise.all([
      queueManager.getContentQueue().getActiveCount(),
      queueManager.getBudgetQueue().getActiveCount(),
      queueManager.getAuditQueue().getActiveCount(),
      queueManager.getDLQQueue().getActiveCount(),
    ]);

    const [contentCompleted, budgetCompleted, auditCompleted, dlqCompleted] = await Promise.all([
      queueManager.getContentQueue().getCompletedCount(),
      queueManager.getBudgetQueue().getCompletedCount(),
      queueManager.getAuditQueue().getCompletedCount(),
      queueManager.getDLQQueue().getCompletedCount(),
    ]);

    const [contentFailed, budgetFailed, auditFailed, dlqFailed] = await Promise.all([
      queueManager.getContentQueue().getFailedCount(),
      queueManager.getBudgetQueue().getFailedCount(),
      queueManager.getAuditQueue().getFailedCount(),
      queueManager.getDLQQueue().getFailedCount(),
    ]);

    return {
      content_generation: {
        waiting: content,
        active: contentActive,
        completed: contentCompleted,
        failed: contentFailed,
      },
      budget_validation: {
        waiting: budget,
        active: budgetActive,
        completed: budgetCompleted,
        failed: budgetFailed,
      },
      audit_repair: {
        waiting: audit,
        active: auditActive,
        completed: auditCompleted,
        failed: auditFailed,
      },
      dlq_processing: {
        waiting: dlq,
        active: dlqActive,
        completed: dlqCompleted,
        failed: dlqFailed,
      },
      totals: {
        waiting: content + budget + audit + dlq,
        active: contentActive + budgetActive + auditActive + dlqActive,
        completed: contentCompleted + budgetCompleted + auditCompleted + dlqCompleted,
        failed: contentFailed + budgetFailed + auditFailed + dlqFailed,
      }
    };
  } catch (error) {
    console.error('❌ Failed to get EIP queue metrics:', error);
    return null;
  }
}

/**
 * Pause/resume EIP queues for maintenance
 */
export async function pauseEIPQueues() {
  await Promise.all([
    queueManager.getContentQueue().pause(),
    queueManager.getBudgetQueue().pause(),
    queueManager.getAuditQueue().pause(),
    queueManager.getDLQQueue().pause(),
  ]);
  console.log('⏸️ EIP queues paused');
}

export async function resumeEIPQueues() {
  await Promise.all([
    queueManager.getContentQueue().resume(),
    queueManager.getBudgetQueue().resume(),
    queueManager.getAuditQueue().resume(),
    queueManager.getDLQQueue().resume(),
  ]);
  console.log('▶️ EIP queues resumed');
}

/**
 * Drain all EIP queues (emergency rollback)
 */
export async function drainEIPQueues() {
  await Promise.all([
    queueManager.getContentQueue().drain(),
    queueManager.getBudgetQueue().drain(),
    queueManager.getAuditQueue().drain(),
    queueManager.getDLQQueue().drain(),
  ]);
  console.log('🚰 EIP queues drained');
}

// Export queue getters for worker initialization
export const getEIPContentQueue = () => queueManager.getContentQueue();
export const getEIPBudgetQueue = () => queueManager.getBudgetQueue();
export const getEIPAuditQueue = () => queueManager.getAuditQueue();
export const getEIPDLQQueue = () => queueManager.getDLQQueue();
export const getEIPQueueEvents = () => queueManager.getAllEvents();
