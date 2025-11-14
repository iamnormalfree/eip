// ABOUTME: EIP Queue System - Queue-First Architecture for Educational Content Generation
// ABOUTME: Implements BullMQ-based job processing with budget checkpoints and DLQ routing

import { Queue, QueueEvents, Worker } from 'bullmq';
import { getRedisConnection } from './redis-config';

// ============================================================================
// EIP QUEUE SYSTEM - UNIFIED BLUEPRINT IMPLEMENTATION
// ============================================================================

export const EIP_QUEUES = {
  CONTENT_GENERATION: 'eip:prod:content-generation:primary:v1',
  BUDGET_VALIDATION: 'eip:prod:budget-enforcement:validation:v1', 
  AUDIT_REPAIR: 'eip:prod:quality:audit-repair:v1',
  DLQ_PROCESSING: 'eip:prod:dlq:content-generation:v1'
} as const;

export type Tier = 'LIGHT' | 'MEDIUM' | 'HEAVY';

/**
 * EIP Job Types - following unified blueprint specifications
 */
export interface EIPContentGenerationJob {
  type: 'content-generation';
  brief: string;
  persona?: string;
  funnel?: string;
  tier: Tier;
  correlation_id?: string;
  priority?: number;
  metadata?: Record<string, any>;
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
  failed_job: any;
  failure_reason: string;
  failure_type: 'budget_breach' | 'system_error' | 'timeout' | 'circuit_breaker';
  retry_count: number;
  dlq_timestamp: number;
  recovery_attempts?: number;
  correlation_id?: string;
}

export type EIPJob = EIPContentGenerationJob | EIPBudgetValidationJob | EIPAuditRepairJob | EIPDLQProcessingJob;

// ============================================================================
// QUEUE OPERATIONS - EXPOSED INTERFACE
// ============================================================================

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
    const randomId = Math.random().toString(36).substr(2, 9);
    const jobId = 'content-' + timestamp + '-' + randomId;
    
    const priority = data.priority || (data.tier === 'HEAVY' ? 1 : data.tier === 'MEDIUM' ? 3 : 5);
    
    const jobData = {
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

    console.log('📋 Submitting EIP content generation job:', {
      jobId: jobId,
      tier: data.tier,
      brief: data.brief.substring(0, 100) + '...',
      priority: priority,
    });

    // Create queue instance
    const queue = new Queue(EIP_QUEUES.CONTENT_GENERATION, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    const job = await queue.add(
      'content-generation',
      jobData,
      {
        jobId: jobId,
        priority: priority,
      }
    );

    console.log('✅ EIP content generation job submitted: ' + job.id);
    return { jobId: job.id!, success: true };

  } catch (error) {
    console.error('❌ Failed to submit EIP content generation job:', error);
    return {
      jobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getEIPQueueMetrics() {
  try {
    // Create queue instances for metrics
    const contentQueue = new Queue(EIP_QUEUES.CONTENT_GENERATION, {
      connection: getRedisConnection(),
    });
    
    const budgetQueue = new Queue(EIP_QUEUES.BUDGET_VALIDATION, {
      connection: getRedisConnection(),
    });
    
    const auditQueue = new Queue(EIP_QUEUES.AUDIT_REPAIR, {
      connection: getRedisConnection(),
    });
    
    const dlqQueue = new Queue(EIP_QUEUES.DLQ_PROCESSING, {
      connection: getRedisConnection(),
    });

    const [content, budget, audit, dlq] = await Promise.all([
      contentQueue.getWaitingCount(),
      budgetQueue.getWaitingCount(),
      auditQueue.getWaitingCount(),
      dlqQueue.getWaitingCount(),
    ]);

    const [contentActive, budgetActive, auditActive, dlqActive] = await Promise.all([
      contentQueue.getActiveCount(),
      budgetQueue.getActiveCount(),
      auditQueue.getActiveCount(),
      dlqQueue.getActiveCount(),
    ]);

    const [contentCompleted, budgetCompleted, auditCompleted, dlqCompleted] = await Promise.all([
      contentQueue.getCompletedCount(),
      budgetQueue.getCompletedCount(),
      auditQueue.getCompletedCount(),
      dlqQueue.getCompletedCount(),
    ]);

    const [contentFailed, budgetFailed, auditFailed, dlqFailed] = await Promise.all([
      contentQueue.getFailedCount(),
      budgetQueue.getFailedCount(),
      auditQueue.getFailedCount(),
      dlqQueue.getFailedCount(),
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
