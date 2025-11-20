// ABOUTME: EIP Queue System - Queue-First Architecture for Educational Content Generation
// ABOUTME: Implements BullMQ-based job processing with budget checkpoints and DLQ routing
// ABOUTME: Includes compliance validation queue integration

import { Queue } from 'bullmq';
import { getRedisConnection } from './redis-config';

// ============================================================================
// EIP QUEUE SYSTEM - UNIFIED BLUEPRINT IMPLEMENTATION
// ============================================================================

export const EIP_QUEUES = {
  CONTENT_GENERATION: 'eip:prod:content-generation:primary:v1',
  BUDGET_VALIDATION: 'eip:prod:budget-enforcement:validation:v1', 
  AUDIT_REPAIR: 'eip:prod:quality:audit-repair:v1',
  DLQ_PROCESSING: 'eip:prod:dlq:content-generation:v1',
  COMPLIANCE_CHECK: 'eip:prod:compliance-validation:primary:v1'
} as const;

export type Tier = 'LIGHT' | 'MEDIUM' | 'HEAVY';

/**
 * EIP Compliance Validation Job interface
 */
export interface EIPComplianceValidationJob {
  type: 'compliance-validation';
  job_id: string;
  content: string;
  context?: {
    title?: string;
    target_audience?: string;
    content_type?: string;
    geographical_focus?: string;
    language?: string;
  };
  sources: string[];
  correlation_id?: string;
  artifact_id?: string;
  priority?: number;
  validation_level?: 'standard' | 'enhanced' | 'comprehensive';
}

// ============================================================================
// COMPLIANCE QUEUE OPERATIONS - EXPOSED INTERFACE
// ============================================================================

export async function submitComplianceValidationJob(data: {
  job_id: string;
  content: string;
  context?: {
    title?: string;
    target_audience?: string;
    content_type?: string;
    geographical_focus?: string;
    language?: string;
  };
  sources: string[];
  artifact_id?: string;
  correlation_id?: string;
  priority?: number;
  validation_level?: 'standard' | 'enhanced' | 'comprehensive';
}): Promise<{ jobId: string; success: boolean; error?: string }> {
  try {
    const timestamp = Date.now();
    const jobId = 'compliance-' + timestamp;
    
    const priority = data.priority || 5; // Default medium priority
    
    const jobData: EIPComplianceValidationJob = {
      type: 'compliance-validation',
      job_id: data.job_id,
      content: data.content,
      context: data.context,
      sources: data.sources,
      artifact_id: data.artifact_id,
      correlation_id: data.correlation_id,
      priority: priority,
      validation_level: data.validation_level || 'standard'
    };

    console.log('📋 Submitting EIP compliance validation job:', {
      jobId: jobId,
      artifact_id: data.artifact_id,
      sources_count: data.sources.length,
      validation_level: data.validation_level || 'standard'
    });

    // Create queue instance
    const queue = new Queue(EIP_QUEUES.COMPLIANCE_CHECK, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2, // Fewer attempts for compliance validation
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    });

    const job = await queue.add(
      'compliance-validation',
      jobData,
      {
        jobId: jobId,
        priority: priority,
      }
    );

    console.log('✅ EIP compliance validation job submitted: ' + job.id);
    return { jobId: job.id!, success: true };

  } catch (error) {
    console.error('❌ Failed to submit EIP compliance validation job:', error);
    return {
      jobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
