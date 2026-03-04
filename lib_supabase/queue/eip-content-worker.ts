// ABOUTME: EIP Content Worker - Multi-stage content generation with budget checkpoints
// ABOUTME: Implements queue-first architecture with real-time budget monitoring and DLQ routing

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { 
  EIPContentGenerationJob, 
  EIPBudgetValidationJob, 
  EIPAuditRepairJob, 
  EIPDLQProcessingJob,
  getEIPContentQueue,
  getEIPBudgetQueue,
  getEIPAuditQueue,
  getEIPDLQQueue,
  routeToDLQ
} from './eip-queue';
import { BudgetEnforcer, Tier } from '../../orchestrator/budget';
import { routeIP } from '../../orchestrator/router';
import { parallelRetrieve } from '../../orchestrator/retrieval';
import { microAudit } from '../../orchestrator/auditor';
import { repairDraft } from '../../orchestrator/repairer';
import { publishArtifact } from '../../orchestrator/publisher';
import { OrchestratorDB } from '../../orchestrator/database';

// ============================================================================
// EIP CONTENT WORKER - QUEUE-FIRST ARCHITECTURE
// ============================================================================
// Following: blueprint::implementation_sequence::phase_1_foundation_first

/**
 * Process EIP content generation job with budget checkpoints
 * 
 * Key Features:
 * - Multi-stage content generation with real-time budget monitoring
 * - Budget checkpoints between each stage with circuit breaker integration
 * - DLQ routing for budget violations with detailed context
 * - Integration with database job tracking
 * 
 * Integration contracts:
 * - Expose: EIP job processing interface with budget checkpoints
 * - Consume: Database job tracking, orchestrator submission patterns
 */
async function processEIPContentGenerationJob(job: Job<EIPContentGenerationJob>) {
  const { data } = job;
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Processing EIP Content Generation Job: ${data.job_id}`);
  console.log(`   Brief: ${data.brief.substring(0, 100)}${data.brief.length > 100 ? '...' : ''}`);
  console.log(`   Tier: ${data.tier}`);
  console.log(`   Persona: ${data.persona || 'default'}`);
  console.log(`   Funnel: ${data.funnel || 'MOFU'}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Initialize budget enforcement and database tracking
    const budget = new BudgetEnforcer(data.tier);
    let db: OrchestratorDB | null = null;
    
    // Initialize database connection (optional, follows existing pattern)
    try {
      db = new OrchestratorDB();
      console.log('📊 Database connection initialized for job tracking');
    } catch (dbError) {
      console.warn('⚠️ Database not available, running without persistence:', dbError instanceof Error ? dbError.message : 'Unknown error');
      db = null;
    }

    // Create job record in database (if available)
    let jobId = data.job_id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (db) {
      const { job: dbJob, error: createError } = await db.createJob({
        brief: data.brief,
        persona: data.persona,
        funnel: data.funnel,
        tier: data.tier || 'MEDIUM',
        status: 'processing',
        stage: 'queue_processing',
        inputs: {
          brief: data.brief,
          persona: data.persona,
          funnel: data.funnel,
          tier: data.tier
        },
        correlation_id: data.correlation_id,
        queue_job_id: jobId
      });

      if (!createError && dbJob) {
        jobId = dbJob.id;
        console.log(`📋 Database job record created: ${jobId}`);
      } else {
        console.warn('⚠️ Failed to create job record:', createError);
      }
    }

    // ============================================================================
    // STAGE 1: IP ROUTING WITH BUDGET CHECKPOINT
    // ============================================================================
    console.log(`\n🎯 Stage 1: IP Routing with Budget Checkpoint`);
    budget.startStage('planner');
    
    // Check circuit breaker before starting
    const circuitCheck = budget.canProceed();
    if (!circuitCheck.ok) {
      throw new Error(`Circuit breaker blocked: ${circuitCheck.reason}`);
    }

    const ip = routeIP({ persona: data.persona, funnel: data.funnel });
    budget.addTokens('planner', 10); // Small token cost for routing
    budget.endStage('planner');

    // Budget checkpoint after IP routing
    const routingBudgetCheck = budget.checkStageBudget('planner');
    if (!routingBudgetCheck.ok) {
      // Route to DLQ for budget breach
      await handleBudgetViolation(jobId, data, budget, 'planner', routingBudgetCheck.reason!);
      throw new Error(routingBudgetCheck.reason);
    }

    console.log(`✅ IP Routing completed: ${ip}`);
    
    // Update job with IP selection
    if (db) {
      await db.updateJob(jobId, { 
        stage: 'ip_selected', 
        outputs: { ip_selected: ip },
        queue_job_id: data.job_id
      });
    }

    // ============================================================================
    // STAGE 2: RETRIEVAL WITH BUDGET CHECKPOINT
    // ============================================================================
    console.log(`\n🔍 Stage 2: Retrieval with Budget Checkpoint`);
    budget.startStage('retrieval');
    
    const retrieval = await parallelRetrieve({ query: data.brief });
    budget.addTokens('retrieval', 50); // Estimated token cost for retrieval
    budget.endStage('retrieval');

    // Budget checkpoint after retrieval
    const retrievalBudgetCheck = budget.checkStageBudget('retrieval');
    if (!retrievalBudgetCheck.ok) {
      await handleBudgetViolation(jobId, data, budget, 'retrieval', retrievalBudgetCheck.reason!);
      throw new Error(retrievalBudgetCheck.reason);
    }

    console.log(`✅ Retrieval completed: ${retrieval.candidates?.length || 0} sources found`);

    // ============================================================================
    // STAGE 3: GENERATION WITH BUDGET CHECKPOINT
    // ============================================================================
    console.log(`\n✨ Stage 3: Content Generation with Budget Checkpoint`);
    budget.startStage('generator');
    
    const draft = await generateDraft(data.brief, ip, retrieval);
    const estimatedTokens = draft.length / 4; // Rough token estimation
    budget.addTokens('generator', estimatedTokens);
    budget.endStage('generator');

    // Budget checkpoint after generation (critical checkpoint)
    const genBudgetCheck = budget.checkStageBudget('generator');
    if (!genBudgetCheck.ok) {
      await handleBudgetViolation(jobId, data, budget, 'generator', genBudgetCheck.reason!);
      throw new Error(genBudgetCheck.reason);
    }

    console.log(`✅ Content generation completed: ${draft.length} characters`);

    // Update job with draft
    if (db) {
      await db.updateJob(jobId, { 
        stage: 'generated', 
        outputs: { draft, ip, retrieval_flags: retrieval.flags },
        tokens: budget.getTracker().tokens_used 
      });
    }

    // ============================================================================
    // STAGE 4: AUDIT WITH BUDGET CHECKPOINT
    // ============================================================================
    console.log(`\n🔍 Stage 4: Quality Audit with Budget Checkpoint`);
    budget.startStage('auditor');
    
    const audit = await microAudit({ draft, ip });
    budget.addTokens('auditor', 30); // Estimated token cost for audit
    budget.endStage('auditor');

    // Budget checkpoint after audit
    const auditBudgetCheck = budget.checkStageBudget('auditor');
    if (!auditBudgetCheck.ok) {
      await handleBudgetViolation(jobId, data, budget, 'auditor', auditBudgetCheck.reason!);
      throw new Error(auditBudgetCheck.reason);
    }

    console.log(`✅ Audit completed: ${audit.tags.length} tags found`);

    // Update job with audit results
    if (db) {
      await db.updateJob(jobId, { 
        stage: 'audited',
        outputs: { draft, ip, retrieval_flags: retrieval.flags, audit_tags: audit.tags }
      });
    }

    // ============================================================================
    // STAGE 5: REPAIR WITH BUDGET CHECKPOINT
    // ============================================================================
    console.log(`\n🔧 Stage 5: Repair with Budget Checkpoint`);
    budget.startStage('repairer');
    
    const repaired = await repairDraft({ draft, audit });
    budget.addTokens('repairer', 20); // Estimated token cost for repairs
    budget.endStage('repairer');

    // Budget checkpoint after repair
    const repairBudgetCheck = budget.checkStageBudget('repairer');
    if (!repairBudgetCheck.ok) {
      await handleBudgetViolation(jobId, data, budget, 'repairer', repairBudgetCheck.reason!);
      throw new Error(repairBudgetCheck.reason);
    }

    console.log(`✅ Repair completed`);

    // ============================================================================
    // STAGE 6: FINAL AUDIT AND PUBLISHING
    // ============================================================================
    console.log(`\n🎯 Stage 6: Final Audit and Publishing`);
    const finalAudit = await microAudit({ draft: repaired, ip });
    
    // Stage 7: Publishing (within budget limits)
    const artifact = await publishArtifact({
      draft: repaired,
      ip,
      audit: finalAudit,
      retrieval,
      metadata: {
        brief: data.brief,
        persona: data.persona,
        funnel: data.funnel,
        tier: data.tier,
        correlation_id: data.correlation_id,
        queue_job_id: data.job_id,
        output_template: data.metadata?.output_template,
        source_capture: data.metadata?.source_capture
      }
    });

    // Create artifact record
    let savedArtifact = null;
    if (db) {
      const { artifact: dbArtifact, error: artifactError } = await db.createArtifact({
        job_id: jobId,
        brief: data.brief,
        ip_used: ip,
        persona: data.persona,
        funnel: data.funnel,
        tier: data.tier,
        content: artifact.mdx,
        frontmatter: artifact.frontmatter,
        jsonld: artifact.jsonld,
        ledger: artifact.ledger
      });

      if (!artifactError && dbArtifact) {
        savedArtifact = dbArtifact;
        console.log(`💾 Artifact saved: ${dbArtifact.id}`);
      } else {
        console.warn('⚠️ Failed to save artifact:', artifactError);
      }
    }

    // ============================================================================
    // JOB COMPLETION AND BUDGET VALIDATION
    // ============================================================================
    const completionTime = Date.now();
    const duration = completionTime - startTime;
    
    // Final budget validation
    const finalBudgetCheck = budget.checkTimeBudget();
    if (!finalBudgetCheck.ok) {
      await handleBudgetViolation(jobId, data, budget, 'final_time', finalBudgetCheck.reason!);
      throw new Error(finalBudgetCheck.reason);
    }

    // Submit budget validation job for monitoring
    const budgetValidationResult = await submitBudgetValidationJob({
      original_job_id: jobId,
      tier: data.tier,
      budget_enforcer: budget,
      correlation_id: data.correlation_id
    });

    if (!budgetValidationResult.success) {
      console.warn('⚠️ Failed to submit budget validation job:', budgetValidationResult.error);
    }

    // Update job completion
    if (db) {
      await db.updateJob(jobId, {
        stage: 'completed',
        outputs: { 
          artifact_id: savedArtifact?.id,
          ip, 
          tags: finalAudit.tags,
          jsonld_type: artifact.jsonld['@type'] || 'Article'
        },
        tokens: budget.getTracker().tokens_used,
        duration_ms: duration,
        cost_cents: calculateCostCents(budget.getTracker().tokens_used, data.tier)
      });
    }

    const tracker = budget.getTracker();
    console.log(`\n✅ EIP Content Generation Job Completed Successfully!`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tokens Used: ${tracker.tokens_used}`);
    console.log(`   Budget Tier: ${data.tier}`);
    console.log(`   IP Pattern: ${ip}`);
    console.log(`   Audit Tags: ${finalAudit.tags.length}`);
    console.log(`   Breaches: ${budget.hasBreaches() ? budget.getBreaches().length : 0}`);
    console.log(`   DB Persisted: ${!!db}`);

    return {
      success: true,
      job_id: jobId,
      duration,
      artifact: savedArtifact,
      metadata: {
        budget_tier: data.tier,
        tokens_used: tracker.tokens_used,
        duration_ms: duration,
        breaches: budget.getBreaches(),
        ip_pattern: ip,
        audit_tags: finalAudit.tags,
        db_persisted: !!db
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ EIP Content Generation Job Failed after ${duration}ms`);
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`   Job ID: ${data.job_id}`);
    
    // Enhanced error handling for different failure types
    const failureType = classifyFailureType(error);
    
    // Route to DLQ if appropriate
    if (failureType !== 'system_error' || job.attemptsMade >= 2) {
      const dlqResult = await routeToDLQ({
        failed_job: data,
        failure_reason: error instanceof Error ? error.message : 'Unknown error',
        failure_type: failureType,
        retry_count: job.attemptsMade,
        correlation_id: data.correlation_id
      });

      if (dlqResult.success) {
        console.log(`📭 Job routed to DLQ: ${dlqResult.dlqJobId}`);
      }
    }

    // Attach metadata for error tracking
    (error as any).jobId = data.job_id;
    (error as any).tier = data.tier;
    (error as any).failureType = failureType;
    (error as any).duration = duration;

    throw error;
  }
}

/**
 * Handle budget violation with DLQ routing
 */
async function handleBudgetViolation(
  jobId: string, 
  jobData: EIPContentGenerationJob, 
  budget: BudgetEnforcer,
  stage: string,
  reason: string
): Promise<void> {
  console.error(`🚨 Budget violation detected in stage ${stage}: ${reason}`);
  
  // Create DLQ record
  const dlqRecord = budget.createDLQRecord();
  dlqRecord.stage = stage;
  dlqRecord.job_id = jobId;
  
  // Route to DLQ
  const dlqResult = await routeToDLQ({
    failed_job: jobData,
    failure_reason: reason,
    failure_type: 'budget_breach',
    retry_count: 0,
    correlation_id: jobData.correlation_id
  });
  
  if (dlqResult.success) {
    console.log(`📭 Budget violation routed to DLQ: ${dlqResult.dlqJobId}`);
  }
}

/**
 * Classify failure type for appropriate handling
 */
function classifyFailureType(error: any): 'budget_breach' | 'system_error' | 'timeout' | 'circuit_breaker' {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  
  if (message.includes('budget') || message.includes('circuit breaker')) {
    return message.includes('circuit breaker') ? 'circuit_breaker' : 'budget_breach';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  
  return 'system_error';
}

/**
 * Submit budget validation job (imported from eip-queue.ts)
 */
async function submitBudgetValidationJob(data: {
  original_job_id: string;
  tier: Tier;
  budget_enforcer: BudgetEnforcer;
  correlation_id?: string;
}): Promise<{ jobId: string; success: boolean; error?: string }> {
  // This would be imported from eip-queue.ts
  // For now, we'll implement it inline
  try {
    const { submitBudgetValidationJob: submitJob } = await import('./eip-queue');
    return await submitJob(data);
  } catch (error) {
    console.error('Failed to submit budget validation job:', error);
    return {
      jobId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate draft content (from orchestrator)
 */
async function generateDraft(brief: string, ip: string, retrieval: any): Promise<string> {
  // This is a placeholder - would use actual generation service
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

/**
 * Calculate cost in cents
 */
function calculateCostCents(tokens: number, tier: Tier): number {
  const costPerMillionTokens = tier === 'HEAVY' ? 30 : tier === 'MEDIUM' ? 15 : 10;
  return Math.ceil((tokens / 1000000) * costPerMillionTokens * 100);
}

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

/**
 * Lazy initialization for EIP content worker
 * 
 * Following broker-worker.ts patterns for consistency
 * Configuration:
 * - Concurrency: Set via EIP_WORKER_CONCURRENCY env var (default: 5)
 * - Rate limit: Set via EIP_QUEUE_RATE_LIMIT env var (default: 10/second)
 * - Job timeout: 60 seconds for content generation
 */
let _eipContentWorker: Worker<EIPContentGenerationJob> | null = null;

export function getEIPContentWorker(): Worker<EIPContentGenerationJob> {
  if (!_eipContentWorker) {
    _eipContentWorker = new Worker<EIPContentGenerationJob>(
      'eip:prod:content-generation:primary:v1',
      processEIPContentGenerationJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.EIP_WORKER_CONCURRENCY || '5'),
        limiter: {
          max: parseInt(process.env.EIP_QUEUE_RATE_LIMIT || '10'),
          duration: 1000,
        },
        // 60-second timeout for content generation jobs
        lockDuration: 60000,
      }
    );

    // Set up event handlers
    _eipContentWorker.on('completed', (job) => {
      console.log(`✅ EIP Content Worker completed job ${job.id}`);
    });

    _eipContentWorker.on('failed', (job, err) => {
      const failureType = (err as any).failureType || 'unknown';
      const duration = (err as any).duration || 0;
      
      console.error(`❌ EIP Content Worker failed job ${job?.id}`);
      console.error(`   Failure Type: ${failureType}`);
      console.error(`   Duration: ${duration}ms`);
      console.error(`   Attempts: ${job?.attemptsMade + 1}/3`);
      console.error(`   Message: ${err.message}`);
    });

    _eipContentWorker.on('error', (err) => {
      console.error('❌ EIP Content Worker error:', err);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received, gracefully shutting down EIP Content Worker...`);
      await _eipContentWorker!.close();
      console.log('✅ EIP Content Worker closed successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('🚀 EIP Content Worker initialized and ready to process jobs');
    console.log(`   Concurrency: ${process.env.EIP_WORKER_CONCURRENCY || 5}`);
    console.log(`   Rate limit: ${process.env.EIP_QUEUE_RATE_LIMIT || 10}/second`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  }
  return _eipContentWorker;
}

// Export for use in worker manager
export { processEIPContentGenerationJob };
