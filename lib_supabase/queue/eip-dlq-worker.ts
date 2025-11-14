// ABOUTME: EIP DLQ Processing Worker - Dead Letter Queue processing and recovery
// ABOUTME: Handles failed jobs with intelligent retry logic and recovery strategies

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { EIPDLQProcessingJob } from './eip-queue';
import { submitContentGenerationJob } from './eip-queue';
import { Tier } from '../../orchestrator/budget';

// ============================================================================
// EIP DLQ PROCESSING WORKER
// ============================================================================
// Integration: DLQ routing with detailed context recovery

/**
 * DLQ recovery strategy result
 */
interface DLQRecoveryResult {
  success: boolean;
  recovery_strategy: string;
  action_taken: 'retried' | 'escalated' | 'archived' | 'converted_to_manual';
  original_job_id: string;
  new_job_id?: string;
  recovery_details: string;
  recommendations: string[];
  requires_human_intervention: boolean;
}

/**
 * Process DLQ job with intelligent recovery strategies
 * 
 * Key Features:
 * - Analyze failure patterns and determine optimal recovery strategy
 * - Automatic retry with modified parameters for recoverable failures
 * - Escalation to human intervention for critical failures
 * - Archive and reporting for analysis
 */
async function processDLQJob(job: Job<EIPDLQProcessingJob>) {
  const { data } = job;
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📭 Processing DLQ Job: ${data.failed_job.job_id || 'unknown'}`);
  console.log(`   Failure Type: ${data.failure_type}`);
  console.log(`   Failure Reason: ${data.failure_reason}`);
  console.log(`   Retry Count: ${data.retry_count}`);
  console.log(`   Recovery Attempts: ${data.recovery_attempts || 0}`);
  console.log(`   DLQ Timestamp: ${new Date(data.dlq_timestamp).toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Analyze the failure and determine recovery strategy
    const recoveryStrategy = determineRecoveryStrategy(data);
    
    console.log(`🔍 Recovery Analysis:`);
    console.log(`   Recommended Strategy: ${recoveryStrategy.strategy}`);
    console.log(`   Confidence: ${recoveryStrategy.confidence}%`);
    console.log(`   Estimated Success Rate: ${recoveryStrategy.estimatedSuccessRate}%`);
    console.log(`   Requires Human Intervention: ${recoveryStrategy.requiresHumanIntervention}`);
    
    // Execute recovery strategy
    const recoveryResult = await executeRecoveryStrategy(data, recoveryStrategy);
    
    // Log recovery attempt
    await logDLQRecoveryAttempt(data, recoveryStrategy, recoveryResult);
    
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ DLQ processing completed in ${duration}ms`);
    console.log(`   Recovery Strategy: ${recoveryResult.recovery_strategy}`);
    console.log(`   Action Taken: ${recoveryResult.action_taken}`);
    console.log(`   Success: ${recoveryResult.success}`);
    console.log(`   Requires Human Intervention: ${recoveryResult.requires_human_intervention}`);
    
    if (recoveryResult.new_job_id) {
      console.log(`   New Job ID: ${recoveryResult.new_job_id}`);
    }
    
    return recoveryResult;
    
  } catch (error) {
    console.error('❌ DLQ job processing failed:', error);
    throw error;
  }
}

/**
 * Determine optimal recovery strategy based on failure analysis
 */
function determineRecoveryStrategy(data: EIPDLQProcessingJob): {
  strategy: string;
  confidence: number;
  estimatedSuccessRate: number;
  requiresHumanIntervention: boolean;
  reasoning: string;
  modifications?: any;
} {
  const { failure_type, failure_reason, retry_count, failed_job } = data;
  
  // Analyze failure reason for patterns
  const failureReason = failure_reason.toLowerCase();
  const recoveryAttempts = data.recovery_attempts || 0;
  
  switch (failure_type) {
    case 'budget_breach':
      if (failureReason.includes('circuit breaker')) {
        return {
          strategy: 'wait_and_retry_with_circuit_breaker_reset',
          confidence: 85,
          estimatedSuccessRate: 70,
          requiresHumanIntervention: false,
          reasoning: 'Circuit breaker reset with brief wait should resolve',
          modifications: {
            delay_ms: Math.min(30000 * Math.pow(2, recoveryAttempts), 300000), // Exponential backoff, max 5 minutes
            tier_bump: retry_count < 2 ? 'HEAVY' : null
          }
        };
      } else if (failureReason.includes('token') || failureReason.includes('time')) {
        return {
          strategy: 'retry_with_upgraded_tier',
          confidence: 90,
          estimatedSuccessRate: 85,
          requiresHumanIntervention: false,
          reasoning: 'Budget breach can be resolved with higher tier allocation',
          modifications: {
            new_tier: retry_count < 2 ? 'HEAVY' : failed_job.tier,
            adjust_budget_limits: true
          }
        };
      } else {
        return {
          strategy: 'retry_with_parameter_adjustment',
          confidence: 70,
          estimatedSuccessRate: 60,
          requiresHumanIntervention: false,
          reasoning: 'Unknown budget breach - try with adjusted parameters'
        };
      }
      
    case 'system_error':
      if (failureReason.includes('database') || failureReason.includes('connection')) {
        return {
          strategy: 'retry_with_backoff',
          confidence: 80,
          estimatedSuccessRate: 75,
          requiresHumanIntervention: false,
          reasoning: 'Transient system error - retry with exponential backoff',
          modifications: {
            delay_ms: Math.min(10000 * Math.pow(2, recoveryAttempts), 120000),
            max_retries: 3
          }
        };
      } else if (failureReason.includes('ai') || failureReason.includes('generation')) {
        return {
          strategy: 'retry_with_different_model',
          confidence: 65,
          estimatedSuccessRate: 50,
          requiresHumanIntervention: recoveryAttempts >= 2,
          reasoning: 'AI generation error - try with different approach',
          modifications: {
            fallback_model: true,
            simplified_prompt: recoveryAttempts >= 1
          }
        };
      } else {
        return {
          strategy: 'escalate_to_human',
          confidence: 50,
          estimatedSuccessRate: 20,
          requiresHumanIntervention: true,
          reasoning: 'Unknown system error - requires investigation'
        };
      }
      
    case 'timeout':
      if (retry_count < 2) {
        return {
          strategy: 'retry_with_extended_timeout',
          confidence: 85,
          estimatedSuccessRate: 80,
          requiresHumanIntervention: false,
          reasoning: 'Timeout can be resolved with extended processing time',
          modifications: {
            timeout_multiplier: 1.5 + (recoveryAttempts * 0.5),
            priority_boost: true
          }
        };
      } else {
        return {
          strategy: 'escalate_to_human',
          confidence: 60,
          estimatedSuccessRate: 30,
          requiresHumanIntervention: true,
          reasoning: 'Multiple timeouts - may require content optimization'
        };
      }
      
    case 'circuit_breaker':
      return {
        strategy: 'wait_for_circuit_breaker_recovery',
        confidence: 95,
        estimatedSuccessRate: 90,
        requiresHumanIntervention: false,
        reasoning: 'Circuit breaker will recover automatically after timeout',
        modifications: {
          delay_ms: 35000, // Wait for circuit breaker recovery
          verify_circuit_state: true
        }
      };
      
    default:
      return {
        strategy: 'analyze_and_escalate',
        confidence: 30,
        estimatedSuccessRate: 10,
        requiresHumanIntervention: true,
        reasoning: 'Unknown failure type - requires manual analysis'
      };
  }
}

/**
 * Execute the determined recovery strategy
 */
async function executeRecoveryStrategy(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  const { failed_job, failure_type } = data;
  const recoveryAttempts = (data.recovery_attempts || 0) + 1;
  
  switch (strategy.strategy) {
    case 'wait_and_retry_with_circuit_breaker_reset':
    case 'retry_with_backoff':
    case 'retry_with_extended_timeout':
      if (strategy.modifications?.delay_ms) {
        console.log(`⏳ Waiting ${strategy.modifications.delay_ms}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, strategy.modifications.delay_ms));
      }
      return await retryJob(data, strategy);
      
    case 'retry_with_upgraded_tier':
      return await retryWithUpgradedTier(data, strategy);
      
    case 'retry_with_parameter_adjustment':
      return await retryWithParameterAdjustment(data, strategy);
      
    case 'retry_with_different_model':
      return await retryWithDifferentModel(data, strategy);
      
    case 'wait_for_circuit_breaker_recovery':
      return await waitForCircuitBreakerRecovery(data, strategy);
      
    case 'escalate_to_human':
      return await escalateToHuman(data, strategy);
      
    case 'analyze_and_escalate':
      return await analyzeAndEscalate(data, strategy);
      
    default:
      return await archiveDLQJob(data, 'Unknown recovery strategy');
  }
}

/**
 * Retry job with modifications
 */
async function retryJob(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  try {
    const { failed_job } = data;
    
    // Create new job submission with modifications
    const modifiedJob = {
      ...failed_job,
      recovery_attempt: (data.recovery_attempts || 0) + 1,
      original_failure: {
        type: data.failure_type,
        reason: data.failure_reason,
        timestamp: data.dlq_timestamp
      },
      priority: strategy.modifications?.priority_boost ? 1 : failed_job.priority
    };
    
    // Apply tier modification if specified
    if (strategy.modifications?.new_tier) {
      modifiedJob.tier = strategy.modifications.new_tier;
      console.log(`📈 Upgrading tier to ${strategy.modifications.new_tier}`);
    }
    
    // Submit new job
    const retryResult = await submitContentGenerationJob({
      brief: modifiedJob.brief,
      persona: modifiedJob.persona,
      funnel: modifiedJob.funnel,
      tier: modifiedJob.tier,
      correlation_id: modifiedJob.correlation_id,
      priority: modifiedJob.priority,
      metadata: {
        ...modifiedJob.metadata,
        dlq_recovery: true,
        recovery_attempt: (data.recovery_attempts || 0) + 1,
        original_failure_reason: data.failure_reason,
        recovery_strategy: strategy.strategy
      }
    });
    
    if (retryResult.success) {
      return {
        success: true,
        recovery_strategy: strategy.strategy,
        action_taken: 'retried',
        original_job_id: data.failed_job.job_id || 'unknown',
        new_job_id: retryResult.jobId,
        recovery_details: `Job successfully retried with strategy: ${strategy.strategy}`,
        recommendations: [
          'Monitor new job progress',
          'Review failure patterns if retries continue'
        ],
        requires_human_intervention: false
      };
    } else {
      throw new Error(`Failed to retry job: ${retryResult.error}`);
    }
    
  } catch (error) {
    return {
      success: false,
      recovery_strategy: strategy.strategy,
      action_taken: 'retried',
      original_job_id: data.failed_job.job_id || 'unknown',
      recovery_details: `Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recommendations: [
        'Consider alternative recovery strategies',
        'Escalate to human intervention if retries continue to fail'
      ],
      requires_human_intervention: true
    };
  }
}

/**
 * Retry with upgraded tier
 */
async function retryWithUpgradedTier(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  const { failed_job } = data;
  const currentTier = failed_job.tier as Tier;
  const upgradedTier = strategy.modifications.new_tier as Tier;
  
  console.log(`📈 Upgrading from ${currentTier} to ${upgradedTier} tier`);
  
  return await retryJob(data, {
    ...strategy,
    modifications: {
      ...strategy.modifications,
      new_tier: upgradedTier
    }
  });
}

/**
 * Retry with parameter adjustment
 */
async function retryWithParameterAdjustment(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  const { failed_job } = data;
  
  console.log(`🔧 Adjusting job parameters for retry`);
  
  // Simplify brief if it's too long or complex
  let adjustedBrief = failed_job.brief;
  if (adjustedBrief.length > 500) {
    adjustedBrief = adjustedBrief.substring(0, 450) + '... (simplified for retry)';
    console.log(`   Simplified brief from ${failed_job.brief.length} to ${adjustedBrief.length} characters`);
  }
  
  const modifiedJob = {
    ...failed_job,
    brief: adjustedBrief,
    recovery_attempt: (data.recovery_attempts || 0) + 1
  };
  
  const retryData = { ...data, failed_job: modifiedJob };
  return await retryJob(retryData, strategy);
}

/**
 * Retry with different model/approach
 */
async function retryWithDifferentModel(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  const { failed_job } = data;
  
  console.log(`🤖 Retrying with different AI model/parameters`);
  
  const modifiedJob = {
    ...failed_job,
    recovery_attempt: (data.recovery_attempts || 0) + 1,
    ai_model_fallback: strategy.modifications.fallback_model,
    simplified_prompt: strategy.modifications.simplified_prompt
  };
  
  const retryData = { ...data, failed_job: modifiedJob };
  return await retryJob(retryData, strategy);
}

/**
 * Wait for circuit breaker recovery
 */
async function waitForCircuitBreakerRecovery(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  const delayMs = strategy.modifications?.delay_ms || 35000;
  
  console.log(`⏳ Waiting ${delayMs}ms for circuit breaker recovery...`);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  // After waiting, retry the job
  return await retryJob(data, strategy);
}

/**
 * Escalate to human intervention
 */
async function escalateToHuman(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  console.log(`👨‍💼 Escalating to human intervention`);
  
  // Create human task/issue
  const taskId = await createHumanTask(data);
  
  return {
    success: false,
    recovery_strategy: strategy.strategy,
    action_taken: 'escalated',
    original_job_id: data.failed_job.job_id || 'unknown',
    recovery_details: `Escalated to human intervention - Task ID: ${taskId}`,
    recommendations: [
      'Review failure patterns and system health',
      'Consider budget or timeout adjustments',
      'Monitor for similar failures'
    ],
    requires_human_intervention: true
  };
}

/**
 * Analyze and escalate for unknown failures
 */
async function analyzeAndEscalate(
  data: EIPDLQProcessingJob,
  strategy: any
): Promise<DLQRecoveryResult> {
  console.log(`🔍 Analyzing unknown failure pattern`);
  
  // Perform additional analysis
  const analysisResult = await analyzeUnknownFailure(data);
  
  return await escalateToHuman(data, {
    ...strategy,
    reasoning: `${strategy.reasoning} - Analysis: ${analysisResult.insights}`
  });
}

/**
 * Archive DLQ job when no recovery is possible
 */
async function archiveDLQJob(
  data: EIPDLQProcessingJob,
  reason: string
): Promise<DLQRecoveryResult> {
  console.log(`📦 Archiving DLQ job: ${reason}`);
  
  // Archive job for analysis
  const archiveId = await archiveJob(data);
  
  return {
    success: false,
    recovery_strategy: 'archive',
    action_taken: 'archived',
    original_job_id: data.failed_job.job_id || 'unknown',
    recovery_details: `Job archived due to: ${reason} - Archive ID: ${archiveId}`,
    recommendations: [
      'Review archived job patterns',
      'Consider system improvements'
    ],
    requires_human_intervention: false
  };
}

/**
 * Create human task for intervention
 */
async function createHumanTask(data: EIPDLQProcessingJob): Promise<string> {
  // In a real implementation, this would create a task in:
  // - Jira, Asana, or similar project management system
  // - Internal ticketing system
  // - Notification system
  
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`📋 Human task created: ${taskId}`);
  console.log(`   Title: EIP Job Recovery Required - ${data.failure_type}`);
  console.log(`   Description: ${data.failure_reason}`);
  
  return taskId;
}

/**
 * Analyze unknown failure patterns
 */
async function analyzeUnknownFailure(data: EIPDLQProcessingJob): Promise<{
  insights: string;
  patterns: string[];
  recommendations: string[];
}> {
  // In a real implementation, this would:
  // - Check for similar failures in the system
  // - Analyze system logs and metrics
  // - Look for patterns or correlations
  
  return {
    insights: 'Unknown failure pattern detected - requires system investigation',
    patterns: [
      'Single occurrence of unknown failure type',
      'No similar recent failures detected'
    ],
    recommendations: [
      'Monitor for recurrence',
      'Review system logs around failure time',
      'Consider expanding failure classification'
    ]
  };
}

/**
 * Archive job for future analysis
 */
async function archiveJob(data: EIPDLQProcessingJob): Promise<string> {
  // In a real implementation, this would:
  // - Store in archive database table
  // - Create logs for analysis
  // - Update metrics
  
  const archiveId = `archive-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`📦 Job archived: ${archiveId}`);
  
  return archiveId;
}

/**
 * Log DLQ recovery attempt for analysis
 */
async function logDLQRecoveryAttempt(
  data: EIPDLQProcessingJob,
  strategy: any,
  result: DLQRecoveryResult
): Promise<void> {
  try {
    // Store recovery attempt in Redis for analysis
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    
    const recoveryRecord = {
      original_job_id: data.failed_job.job_id,
      failure_type: data.failure_type,
      failure_reason: data.failure_reason,
      recovery_strategy: strategy.strategy,
      recovery_success: result.success,
      action_taken: result.action_taken,
      recovery_timestamp: new Date().toISOString(),
      recovery_attempts: (data.recovery_attempts || 0) + 1,
      requires_human_intervention: result.requires_human_intervention
    };
    
    const key = `dlq-recovery:${data.failed_job.job_id || 'unknown'}:${Date.now()}`;
    await redis.hset(key, recoveryRecord);
    await redis.expire(key, 86400 * 30); // 30 days TTL
    
    await redis.quit();
    
  } catch (error) {
    console.error('Failed to log DLQ recovery attempt:', error);
    // Non-critical - don't fail the recovery
  }
}

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

/**
 * Lazy initialization for EIP DLQ processing worker
 */
let _eipDLQWorker: Worker<EIPDLQProcessingJob> | null = null;

export function getEIPDLQWorker(): Worker<EIPDLQProcessingJob> {
  if (!_eipDLQWorker) {
    _eipDLQWorker = new Worker<EIPDLQProcessingJob>(
      'eip:prod:dlq:content-generation:v1',
      processDLQJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.EIP_DLQ_WORKER_CONCURRENCY || '1'),
        limiter: {
          max: parseInt(process.env.EIP_DLQ_QUEUE_RATE_LIMIT || '2'),
          duration: 1000,
        },
        // Longer timeout for DLQ processing (may include delays)
        lockDuration: 600000, // 10 minutes
      }
    );

    // Set up event handlers
    _eipDLQWorker.on('completed', (job) => {
      console.log(`✅ EIP DLQ Worker completed job ${job.id}`);
    });

    _eipDLQWorker.on('failed', (job, err) => {
      console.error(`❌ EIP DLQ Worker failed job ${job?.id}`);
      console.error(`   Error: ${err.message}`);
      console.error(`   Attempts: ${job?.attemptsMade + 1}/1`);
      // DLQ worker failures are critical
      console.error(`   🚨 CRITICAL: DLQ processing failed - manual intervention required!`);
    });

    _eipDLQWorker.on('error', (err) => {
      console.error('❌ EIP DLQ Worker error:', err);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received, gracefully shutting down EIP DLQ Worker...`);
      await _eipDLQWorker!.close();
      console.log('✅ EIP DLQ Worker closed successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('🚀 EIP DLQ Processing Worker initialized and ready to process jobs');
    console.log(`   Concurrency: ${process.env.EIP_DLQ_WORKER_CONCURRENCY || 1}`);
    console.log(`   Rate limit: ${process.env.EIP_DLQ_QUEUE_RATE_LIMIT || 2}/second`);
  }
  return _eipDLQWorker;
}

// Export for use in worker manager
export { processDLQJob };
