// ABOUTME: EIP orchestrator controller with queue-first architecture integration
// ABOUTME: Pipeline orchestrator pattern with circuit breakers, DLQ handling, and queue submission

import { BudgetEnforcer, Tier } from './budget';
import { OrchestratorDB } from './database';
import { routeToIP } from './router';
import { parallelRetrieve } from './retrieval';
import { microAudit } from './auditor';
import { repairDraft } from './repairer';
import { publishArtifact } from './publisher';
import { evaluateHitlGates } from './hitl-gates';
import { isLegacyCompat } from '../lib_supabase/utils/compat';
import { submitContentGenerationJob } from '../lib_supabase/queue/eip-queue';
import {
  startCorrelation,
  updateCorrelation,
  endCorrelation,
  logStageStart,
  logStageComplete,
  logBudgetEnforcement,
  logCircuitBreaker,
  logDLQRouting,
  logQueueSubmission,
  logPerformance,
  logError,
  getLogger
} from './logger';
import {
  recordPipelineStart,
  recordPipelineCompletion,
  recordQueueOperation,
  recordBudgetViolation,
  recordComplianceCheck,
  updateErrorRate
} from './monitoring';

/**
 * Queue Strict Mode Configuration
 * When EIP_QUEUE_STRICT=true, queue failures will fail-fast instead of falling back to direct execution
 */
const isQueueStrict = (): boolean => process.env.EIP_QUEUE_STRICT === 'true';

type Brief = {
  brief: string;
  persona?: string;
  funnel?: string;
  tier?: Tier;
  correlation_id?: string;
  queue_mode?: boolean; // New: force queue processing
};

interface PipelineContext {
  brief: Brief;
  ip: string;
  retrieval: any;
  draft: string;
  audit: any;
  repaired: string;
  artifact: any;
  budget: BudgetEnforcer;
  db: OrchestratorDB | null;
  jobId: string;
}

/**
 * Queue-First Architecture Integration
 * 
 * Following unified blueprint decisions:
 * - queue_first_pattern: Route all work through queues
 * - sequential_integration: Maintain existing direct execution for compatibility
 * - contract::final::queue_system_to_all_domains
 */
async function runOnce(input: Brief): Promise<{ success: boolean; artifact?: any; error?: string; queue_job_id?: string; dlq?: any; correlation_id?: string }> {
  // Check if queue mode is enabled or forced
  // Explicit false takes precedence over environment variable
  const queueMode = input.queue_mode === false
    ? false
    : input.queue_mode || process.env.EIP_QUEUE_MODE === 'enabled';
  
  if (queueMode) {
    console.log('🚀 Queue-first mode: Submitting job to EIP queue system');
    return await runViaQueue(input);
  } else {
    console.log('🔄 Direct execution mode: Processing job directly (legacy compatibility)');
    return await runDirectly(input);
  }
}

/**
 * Queue-First Processing: Submit job to EIP queue system
 *
 * Integration contract: Expose EIP job processing interface with budget checkpoints
 */
async function runViaQueue(input: Brief): Promise<{ success: boolean; artifact?: any; error?: string; queue_job_id?: string }> {
  // Start correlation tracking
  const correlationId = startCorrelation({
    jobId: `queue-${Date.now()}`,
    persona: input.persona,
    funnel: input.funnel,
    tier: input.tier || 'MEDIUM',
    userId: undefined, // Could be added later
    startTime: Date.now()
  });

  try {
    // Validate required inputs
    if (!input.brief) {
      logError(correlationId, new Error('Brief is required for content generation'), {
        stage: 'validation',
        input: { ...input, brief: '[REDACTED]' }
      });
      endCorrelation(correlationId);
      return { success: false, error: 'Brief is required for content generation' };
    }

    const tier = input.tier || 'MEDIUM';

    getLogger().info(`Submitting to EIP Queue System`, {
      correlationId,
      brief_length: input.brief.length,
      tier,
      persona: input.persona,
      funnel: input.funnel,
      event: 'queue_submission_start'
    });

    // Submit job to queue
    const queueResult = await submitContentGenerationJob({
      brief: input.brief,
      persona: input.persona,
      funnel: input.funnel,
      tier,
      correlation_id: correlationId,
      priority: tier === 'HEAVY' ? 1 : tier === 'MEDIUM' ? 3 : 5,
      metadata: {
        submission_source: 'orchestrator_controller',
        queue_mode: true,
        timestamp: new Date().toISOString(),
        correlation_id: correlationId
      }
    });

    if (queueResult.success) {
      // Record successful queue operation for monitoring
      recordQueueOperation('submit', 'success');
      recordPipelineCompletion(tier, 'queue_first', 'success', 0, 0);

      logQueueSubmission(correlationId, queueResult.jobId, {
        tier,
        priority: tier === 'HEAVY' ? 1 : tier === 'MEDIUM' ? 3 : 5,
        submission_source: 'orchestrator_controller'
      });

      endCorrelation(correlationId);

      return {
        success: true,
        queue_job_id: queueResult.jobId,
        artifact: {
          queue_submission: {
            job_id: queueResult.jobId,
            tier,
            status: 'queued',
            submitted_at: new Date().toISOString(),
            correlation_id: correlationId
          },
          metadata: {
            budget_tier: tier,
            processing_mode: 'queue_first',
            correlation_id: correlationId,
            queue_job_id: queueResult.jobId,
            submitted_at: new Date().toISOString()
          }
        }
      };
    } else {
      // Record failed queue operation for monitoring
      recordQueueOperation('submit', 'failure');

      logError(correlationId, new Error(`Queue submission failed: ${queueResult.error}`), {
        stage: 'queue_submission',
        queue_error: queueResult.error
      });

      // STRICT MODE: Fail fast, no fallback to direct execution
      if (isQueueStrict()) {
        endCorrelation(correlationId);
        recordQueueOperation('submit', 'strict_failure');
        return {
          success: false,
          error: `Queue submission failed (strict mode): ${queueResult.error}`,
          queue_job_id: undefined
        };
      }

      // Fallback to direct execution if queue submission fails (unless in test mode)
      const isTestMode = process.env.EIP_TEST_MODE === "steel_thread";
      if (isTestMode) {
        // In test mode, return failure instead of falling back to direct execution
        endCorrelation(correlationId);
        return {
          success: false,
          error: `Queue submission failed: ${queueResult.error}`,
          queue_job_id: undefined
        };
      }

      getLogger().info("Queue submission failed, falling back to direct execution", {
        correlationId,
        event: "fallback_to_direct"
      });

      endCorrelation(correlationId);
      return await runDirectly(input);
    }

  } catch (error) {
    logError(correlationId, error instanceof Error ? error : new Error('Unknown queue processing error'), {
      stage: 'queue_processing',
      error_type: error instanceof Error ? error.constructor.name : 'Unknown'
    });

    // STRICT MODE: Fail fast, no fallback to direct execution
    if (isQueueStrict()) {
      endCorrelation(correlationId);
      recordQueueOperation('process', 'strict_failure');
      return {
        success: false,
        error: `Queue processing failed (strict mode): ${error instanceof Error ? error.message : "Unknown error"}`,
        queue_job_id: undefined
      };
    }

    // Fallback to direct execution on queue processing exceptions (unless in test mode)
    const isTestMode = process.env.EIP_TEST_MODE === "steel_thread";
    if (isTestMode) {
      // In test mode, return failure instead of falling back to direct execution
      endCorrelation(correlationId);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown queue processing error",
        queue_job_id: undefined
      };
    }

    getLogger().info("Queue processing failed, falling back to direct execution", {
      correlationId,
      event: "fallback_to_direct",
      error: error instanceof Error ? error.message : "Unknown error"
    });

    endCorrelation(correlationId);
    return await runDirectly(input);
  }
}

/**
 * Direct Execution: Original orchestrator logic for compatibility
 *
 * Preserves existing functionality for:
 * - Legacy compatibility mode
 * - Fallback when queue system is unavailable
 * - Local development and testing
 */
async function runDirectly(input: Brief): Promise<{ success: boolean; artifact?: any; error?: string; dlq?: any; correlation_id?: string }> {
  // Initialize budget enforcement and database (optional)
  const tier = input.tier || 'MEDIUM';
  const budget = new BudgetEnforcer(tier);
  let db: OrchestratorDB | null = null;

  // Start correlation tracking for direct execution
  const correlationId = startCorrelation({
    jobId: `direct-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    persona: input.persona,
    funnel: input.funnel,
    tier: tier,
    userId: undefined,
    startTime: Date.now()
  });

  // Record pipeline start for monitoring
  recordPipelineStart(tier, 'direct_execution');

  try {
    db = new OrchestratorDB();
    getLogger().info('Database connection initialized', {
      correlationId,
      event: 'database_connected'
    });
  } catch (dbError) {
    getLogger().warn('Database not available, running without persistence', {
      correlationId,
      error: dbError instanceof Error ? dbError.message : 'Unknown error',
      event: 'database_unavailable'
    });
    db = null;
  }

  // Create initial job record (if database available)
  let jobId = correlationId;
  if (db) {
    try {
      const { job, error: createError } = await db.createJob({
        brief: input.brief,
        persona: input.persona,
        funnel: input.funnel,
        tier: input.tier || 'MEDIUM',
        status: 'queued',
        stage: 'started',
        inputs: input,
        correlation_id: correlationId
      });

      if (!createError) {
        jobId = job.id;
        getLogger().info('Job record created in database', {
          correlationId,
          jobId,
          event: 'job_created'
        });
      } else {
        getLogger().warn('Failed to create job record', {
          correlationId,
          error: createError,
          event: 'job_creation_failed'
        });
      }
    } catch (createError) {
      getLogger().warn('Database job creation failed', {
        correlationId,
        error: createError instanceof Error ? createError.message : 'Unknown error',
        event: 'job_creation_exception'
      });
    }
  }

  getLogger().info('Started direct execution job', {
    correlationId,
    jobId,
    tier,
    brief_length: input.brief.length,
    event: 'direct_execution_started'
  });

  updateCorrelation(correlationId, { jobId });

  try {
    // Stage 1: IP Routing (minimal budget impact)
    logStageStart(correlationId, 'planner', { persona: input.persona, funnel: input.funnel });
    const stageStartTime = Date.now();

    budget.startStage('planner');
    const routingResult = await routeToIP({ persona: input.persona, funnel: input.funnel, brief: input.brief });
    const ip = routingResult.selected_ip;
    budget.addTokens('planner', 10); // Small token cost for routing
    budget.endStage('planner');

    const stageDuration = Date.now() - stageStartTime;
    const budgetCheck = budget.checkStageBudget('planner');

    logStageComplete(correlationId, 'planner', {
      stageDuration,
      tokensUsed: 10,
      budgetRemaining: budget.getBudget().planner ? budget.getBudget().planner! - 10 : 0,
      selectedIP: ip,
      routingConfidence: routingResult.confidence
    });

    if (!budgetCheck.ok) {
      logBudgetEnforcement(correlationId, 'planner_budget_exceeded', {
        stage: 'planner',
        reason: budgetCheck.reason,
        tokensUsed: 10
      });
      throw new Error(budgetCheck.reason);
    }

    // Update job with IP selection (if database available)
    if (db) {
      try {
        await db.updateJob(jobId, { stage: 'ip_selected', outputs: { ip_selected: ip } });
        getLogger().info('Job updated with IP selection', {
          correlationId,
          jobId,
          selectedIP: ip,
          event: 'job_updated_ip'
        });
      } catch (updateError) {
        getLogger().warn('Failed to update job with IP selection', {
          correlationId,
          jobId,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
          event: 'job_update_failed'
        });
      }
    }

    // Stage 2: Retrieval (BM25/graph/vector)
    logStageStart(correlationId, 'retrieval', { query_length: input.brief.length });
    const retrievalStartTime = Date.now();

    budget.startStage('retrieval');
    const retrieval = await parallelRetrieve({ query: input.brief });
    budget.addTokens('retrieval', 50); // Estimated token cost for retrieval
    budget.endStage('retrieval');

    const retrievalDuration = Date.now() - retrievalStartTime;
    logStageComplete(correlationId, 'retrieval', {
      stageDuration: retrievalDuration,
      tokensUsed: 50,
      budgetRemaining: budget.getBudget().retrieval ? budget.getBudget().retrieval! - 50 : 0,
      candidatesFound: retrieval.candidates?.length || 0,
      retrievalFlags: retrieval.flags
    });

    // Stage 3: Generation (main content creation)
    logStageStart(correlationId, 'generator', { ip, brief_length: input.brief.length });
    const generationStartTime = Date.now();

    budget.startStage('generator');
    const draft = await generateDraft(input.brief, ip, retrieval);
    const estimatedTokens = draft.length / 4; // Rough token estimation
    budget.addTokens('generator', estimatedTokens);
    budget.endStage('generator');

    const generationDuration = Date.now() - generationStartTime;
    logStageComplete(correlationId, 'generator', {
      stageDuration: generationDuration,
      tokensUsed: estimatedTokens,
      budgetRemaining: budget.getBudget().generator ? budget.getBudget().generator! - estimatedTokens : 0,
      draftLength: draft.length
    });

    const genBudgetCheck = budget.checkStageBudget('generator');
    if (!genBudgetCheck.ok) {
      logBudgetEnforcement(correlationId, 'generator_budget_exceeded', {
        stage: 'generator',
        reason: genBudgetCheck.reason,
        tokensUsed: estimatedTokens,
        draftLength: draft.length
      });
      throw new Error(genBudgetCheck.reason);
    }

    // Update job with draft (if database available)
    if (db) {
      try {
        await db.updateJob(jobId, {
          stage: 'generated',
          outputs: { draft, ip, retrieval_flags: retrieval.flags },
          tokens: budget.getTracker().tokens_used
        });
        getLogger().info('Job updated with generated draft', {
          correlationId,
          jobId,
          draftLength: draft.length,
          tokensUsed: budget.getTracker().tokens_used,
          event: 'job_updated_draft'
        });
      } catch (updateError) {
        getLogger().warn('Failed to update job with draft', {
          correlationId,
          jobId,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
          event: 'job_update_failed'
        });
      }
    }

    // Stage 4: Audit (quality checks)
    logStageStart(correlationId, 'auditor', { draft_length: draft.length, ip });
    const auditStartTime = Date.now();

    budget.startStage('auditor');
    const audit = await microAudit({ draft, ip });
    budget.addTokens('auditor', 30); // Estimated token cost for audit
    budget.endStage('auditor');

    const auditDuration = Date.now() - auditStartTime;
    logStageComplete(correlationId, 'auditor', {
      stageDuration: auditDuration,
      tokensUsed: 30,
      budgetRemaining: budget.getBudget().auditor ? budget.getBudget().auditor! - 30 : 0,
      auditTags: audit.tags?.length || 0,
      auditScore: audit.overall_score
    });

    const auditBudgetCheck = budget.checkStageBudget('auditor');
    if (!auditBudgetCheck.ok) {
      logBudgetEnforcement(correlationId, 'auditor_budget_exceeded', {
        stage: 'auditor',
        reason: auditBudgetCheck.reason,
        tokensUsed: 30,
        auditTags: audit.tags?.length || 0
      });
      throw new Error(auditBudgetCheck.reason);
    }

    // Update job with audit results (if database available)
    if (db) {
      try {
        await db.updateJob(jobId, {
          stage: 'audited',
          outputs: { draft, ip, retrieval_flags: retrieval.flags, audit_tags: audit.tags }
        });
        getLogger().info('Job updated with audit results', {
          correlationId,
          jobId,
          auditTags: audit.tags?.length || 0,
          event: 'job_updated_audit'
        });
      } catch (updateError) {
        getLogger().warn('Failed to update job with audit results', {
          correlationId,
          jobId,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
          event: 'job_update_failed'
        });
      }
    }

    // Stage 5: Repair (if needed)
    logStageStart(correlationId, 'repairer', { needsRepair: audit.tags?.length > 0 });
    const repairStartTime = Date.now();

    budget.startStage('repairer');
    const repaired = await repairDraft({ draft, audit });
    budget.addTokens('repairer', 20); // Estimated token cost for repairs
    budget.endStage('repairer');

    const repairDuration = Date.now() - repairStartTime;
    logStageComplete(correlationId, 'repairer', {
      stageDuration: repairDuration,
      tokensUsed: 20,
      budgetRemaining: budget.getBudget().repairer ? budget.getBudget().repairer! - 20 : 0,
      originalLength: draft.length,
      repairedLength: repaired.length
    });

    const repairBudgetCheck = budget.checkStageBudget('repairer');
    if (!repairBudgetCheck.ok) {
      logBudgetEnforcement(correlationId, 'repairer_budget_exceeded', {
        stage: 'repairer',
        reason: repairBudgetCheck.reason,
        tokensUsed: 20
      });
      throw new Error(repairBudgetCheck.reason);
    }

    // Stage 6: Re-audit after repair
    logStageStart(correlationId, 'review', { repaired_length: repaired.length });
    const reviewStartTime = Date.now();

    const finalAudit = await microAudit({ draft: repaired, ip });
    const reviewDuration = Date.now() - reviewStartTime;

    logStageComplete(correlationId, 'review', {
      stageDuration: reviewDuration,
      tokensUsed: 0, // Final audit doesn't consume additional budget
      budgetRemaining: budget.getBudget().review || 0,
      finalAuditTags: finalAudit.tags?.length || 0,
      finalAuditScore: finalAudit.overall_score
    });
    
    // Stage 7: Publishing
    logStageStart(correlationId, 'review', {
      artifact_length: repaired.length,
      final_audit_tags: finalAudit.tags?.length || 0
    });
    const publishStartTime = Date.now();

    const artifact = await publishArtifact({
      draft: repaired,
      ip,
      audit: finalAudit,
      retrieval,
      metadata: {
        brief: input.brief,
        persona: input.persona,
        funnel: input.funnel,
        tier: tier,
        correlation_id: correlationId,
        processing_mode: 'direct_execution'
      }
    });

    const hitlDecision = evaluateHitlGates({
      tags: finalAudit.tags,
      overall_score: finalAudit.overall_score,
      compliance_analysis: finalAudit.compliance_analysis,
      invariants_failed: artifact.ledger?.ip_invariants?.failed?.length || 0
    });

    const reviewStatus = hitlDecision.needs_human_review ? 'pending_review' : 'auto_approved';
    artifact.ledger = {
      ...artifact.ledger,
      provenance: {
        ...artifact.ledger?.provenance,
        humanReviewRequired: hitlDecision.needs_human_review,
        review_status: hitlDecision.needs_human_review ? 'pending' : 'auto_approved'
      },
      hitl: hitlDecision
    };

    const publishDuration = Date.now() - publishStartTime;
    logStageComplete(correlationId, 'review', {
      stageDuration: publishDuration,
      tokensUsed: 0, // Publishing doesn't consume additional budget
      budgetRemaining: 0,
      artifactCreated: true,
      artifactType: artifact.jsonld['@type'] || 'Article',
      needsHumanReview: hitlDecision.needs_human_review
    });

    // Create artifact record (if database available)
    let savedArtifact = null;
    if (db) {
      try {
        const { artifact: dbArtifact, error: artifactError } = await db.createArtifact({
          job_id: jobId,
          brief: input.brief,
          ip_used: ip,
          persona: input.persona,
          funnel: input.funnel,
          tier: tier,
          status: 'draft',
          content: artifact.mdx,
          frontmatter: artifact.frontmatter,
          jsonld: artifact.jsonld,
          ledger: artifact.ledger
        });

        if (!artifactError) {
          savedArtifact = dbArtifact;
          getLogger().info('Artifact saved to database', {
            correlationId,
            jobId,
            artifactId: dbArtifact.id,
            event: 'artifact_saved'
          });
        } else {
          getLogger().warn('Failed to save artifact', {
            correlationId,
            jobId,
            error: artifactError,
            event: 'artifact_save_failed'
          });
        }
      } catch (saveError) {
        getLogger().warn('Artifact database save exception', {
          correlationId,
          jobId,
          error: saveError instanceof Error ? saveError.message : 'Unknown error',
          event: 'artifact_save_exception'
        });
      }
    }

    // Final budget check and job completion
    const tracker = budget.getTracker();
    const totalDuration = Date.now() - tracker.start_time;
    const totalCost = calculateCostCents(tracker.tokens_used, tier);

    // Log final performance metrics
    logPerformance(correlationId, {
      stageDuration: totalDuration,
      tokensUsed: tracker.tokens_used,
      budgetRemaining: 0, // All budgets used
      memoryUsage: process.memoryUsage().heapUsed,
      queueProcessingTime: 0 // Not applicable for direct execution
    });

    // Update job completion status
    if (db) {
      try {
        await db.updateJob(jobId, {
          stage: hitlDecision.needs_human_review ? 'pending_review' : 'completed',
          outputs: {
            artifact_id: savedArtifact?.id,
            ip,
            tags: finalAudit.tags,
            jsonld_type: artifact.jsonld['@type'] || 'Article',
            review_status: reviewStatus,
            needs_human_review: hitlDecision.needs_human_review,
            review_reasons: hitlDecision.review_reasons
          },
          tokens: tracker.tokens_used,
          duration_ms: totalDuration,
          cost_cents: totalCost
        });
        getLogger().info('Job marked as completed', {
          correlationId,
          jobId,
          totalDuration,
          totalCost,
          event: 'job_completed'
        });
      } catch (updateError) {
        getLogger().warn('Failed to update job completion status', {
          correlationId,
          jobId,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
          event: 'job_completion_update_failed'
        });
      }
    }

    getLogger().info('Direct execution job completed successfully', {
      correlationId,
      jobId,
      ip,
      tokens: tracker.tokens_used,
      duration_ms: totalDuration,
      cost_cents: totalCost,
      tags: finalAudit.tags.length,
      breaches: budget.hasBreaches() ? budget.getBreaches().length : 0,
      db_persisted: !!db,
      processing_mode: 'direct_execution',
      event: 'job_success'
    });

    endCorrelation(correlationId);

    // Record successful pipeline completion for monitoring.
    recordPipelineCompletion(tier, 'direct_execution', 'success', totalDuration, tracker.tokens_used);

    return {
      success: true,
      artifact: {
        ...savedArtifact,
        metadata: {
          budget_tier: tier,
          tokens_used: tracker.tokens_used,
          duration_ms: totalDuration,
          cost_cents: totalCost,
          breaches: budget.getBreaches(),
          db_persisted: !!db,
          processing_mode: 'direct_execution',
          correlation_id: correlationId
        }
      }
    };

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    logError(correlationId, errorObj, {
      jobId,
      stage: 'pipeline_execution',
      tokens_used: budget.getTracker().tokens_used,
      duration_ms: Date.now() - budget.getTracker().start_time
    });

    // Check if this is a budget breach
    if (budget.shouldFailToDLQ()) {
      const dlqRecord = budget.createDLQRecord();

      // Record budget violation for monitoring
      const breaches = budget.getBreaches();
      breaches.forEach((breach: any) => {
        recordBudgetViolation(tier, breach.stage || 'unknown', breach.type || 'unknown');
      });

      logDLQRouting(correlationId, dlqRecord);
      logCircuitBreaker(correlationId, 'triggered', 'Budget breach detected');

      if (db) {
        try {
          await db.failJobToDLQ(jobId, dlqRecord);
          getLogger().info('Job sent to DLQ in database', {
            correlationId,
            jobId,
            dlq_reason: dlqRecord.fail_reason,
            event: 'dlq_database_recorded'
          });
        } catch (dlqError) {
          getLogger().warn('Failed to record DLQ in database', {
            correlationId,
            jobId,
            error: dlqError instanceof Error ? dlqError.message : 'Unknown error',
            event: 'dlq_database_failed'
          });
        }
      }

      endCorrelation(correlationId);

      return {
        success: false,
        error: 'Budget breach: ' + dlqRecord.fail_reason,
        dlq: dlqRecord,
        correlation_id: correlationId
      };
    }

    // Regular failure
    if (db) {
      try {
        await db.updateJob(jobId, {
          stage: 'failed',
          fail_reason: errorObj.message
        });
        getLogger().info('Job failure recorded in database', {
          correlationId,
          jobId,
          fail_reason: errorObj.message,
          event: 'job_failure_recorded'
        });
      } catch (updateError) {
        getLogger().warn('Failed to record job failure in database', {
          correlationId,
          jobId,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
          event: 'job_failure_record_failed'
        });
      }
    }

    getLogger().error('Direct execution job failed', {
      correlationId,
      jobId,
      error: errorObj.message,
      error_type: errorObj.constructor.name,
      tokens_used: budget.getTracker().tokens_used,
      duration_ms: Date.now() - budget.getTracker().start_time,
      processing_mode: 'direct_execution',
      event: 'job_failure'
    });

    // Record failed pipeline completion for monitoring
    const errorDuration = Date.now() - budget.getTracker().start_time;
    const errorTokens = budget.getTracker().tokens_used;
    recordPipelineCompletion(tier, 'direct_execution', 'failure', errorDuration, errorTokens);
    updateErrorRate('pipeline_execution', 1); // Record error rate spike

    endCorrelation(correlationId);

    return {
      success: false,
      error: errorObj.message,
      correlation_id: correlationId
    };
  }
}

// Helper function for draft generation (stub implementation)
async function generateDraft(brief: string, ip: string, retrieval: any): Promise<string> {
  // This would normally call the AI generation service
  // For now, return a structured stub
  return `# ${brief}

**IP Pattern:** ${ip}

## Overview
This is a generated draft using the ${ip} pattern.

## Key Points
- Brief: ${brief}
- Retrieved ${retrieval.candidates?.length || 0} candidate sources
- Graph connectivity: ${retrieval.flags?.graph_sparse ? 'Sparse' : 'Dense'}

## Analysis
Based on the educational IP structure, this content should provide:
1. Clear learning objectives
2. Structured progression
3. Practical examples

## How It Works
This process operates through the following key mechanisms:

1. **Initial Assessment** - Evaluation of current conditions
2. **Processing** - Application of specific procedures
3. **Outcome** - Expected results and next steps

## Examples

*Example 1:* [Specific example would be inserted here based on content context]

*Example 2:* [Another practical application]

## Summary
This draft will undergo quality audit and repair processes.

---

*This content is for informational purposes only. Please consult with relevant regulatory authorities such as MAS (Monetary Authority of Singapore) for specific guidance.*
`;
}

// Helper function to calculate cost in cents
function calculateCostCents(tokens: number, tier: Tier): number {
  const costPerMillionTokens = tier === 'HEAVY' ? 30 : tier === 'MEDIUM' ? 15 : 10;
  return Math.ceil((tokens / 1000000) * costPerMillionTokens * 100);
}

async function main() {
  const legacyCompat = isLegacyCompat();
  console.log('🚀 EIP Orchestrator starting...');
  console.log('🔧 Legacy compatibility mode:', legacyCompat ? 'ENABLED' : 'DISABLED');
  console.log('📋 Queue mode:', process.env.EIP_QUEUE_MODE || 'disabled');

  if (legacyCompat) {
    console.log('ℹ️  Note: Legacy compatibility is enabled for development and backward compatibility');
    console.log('⚠️  Production: After 2 weeks of stable operation, consider disabling via EIP_LEGACY_COMPAT=false');
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const queueModeFlag = args.includes('--queue') || args.includes('-q');
  
  const brief = process.env.EIP_BRIEF || 'Explain refinancing mechanism in SG';
  const persona = process.env.EIP_PERSONA || 'default_persona';
  const funnel = process.env.EIP_FUNNEL || 'MOFU';
  const tier = (process.env.EIP_TIER as Tier) || 'MEDIUM';
  const correlationId = process.env.EIP_CORRELATION_ID || `cli-${Date.now()}`;
  
  const input: Brief = {
    brief,
    persona,
    funnel,
    tier,
    correlation_id: correlationId,
    queue_mode: queueModeFlag || process.env.EIP_QUEUE_MODE === 'enabled'
  };

  console.log('📋 Processing parameters:', {
    brief: brief.substring(0, 100) + (brief.length > 100 ? '...' : ''),
    persona,
    funnel,
    tier,
    correlation_id: correlationId,
    queue_mode: input.queue_mode
  });
  
  const result = await runOnce(input);
  
  if (result.success) {
    console.log('✅ Processing completed successfully');
    
    if (result.queue_job_id) {
      console.log(`📋 Job submitted to queue: ${result.queue_job_id}`);
      console.log('💡 Use queue monitoring tools to track progress');
    }
    
    console.log('📊 Artifact metadata:', result.artifact?.metadata);
  } else {
    console.error('❌ Processing failed:', result.error);
    if ('dlq' in result) {
      console.error('📭 Sent to DLQ:', result.dlq);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Orchestrator error:', err);
    process.exit(1);
  });
}

export { runOnce };
