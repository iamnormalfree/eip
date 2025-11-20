// ABOUTME: EIP Compliance Validation Worker - Queue-based compliance checking with DLQ routing
// ABOUTME: Integrates with compliance engine to validate content, context, and sources for regulatory compliance

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { 
  routeToDLQ
} from './eip-queue';
import { OrchestratorDB } from '../../orchestrator/database';
import { ComplianceEngine } from '../../lib/compliance/compliance-engine';
import { ComplianceDatabaseExtension } from '../../orchestrator/database-compliance';

// ============================================================================
// EIP COMPLIANCE VALIDATION WORKER
// ============================================================================

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
    geographical_focus?: string[];
    language?: string;
  };
  sources: string[];
  correlation_id?: string;
  artifact_id?: string;
  priority?: number;
  validation_level?: 'standard' | 'enhanced' | 'comprehensive';
}

/**
 * Process EIP compliance validation job
 */
async function processComplianceValidationJob(job: Job<EIPComplianceValidationJob>) {
  const { data } = job;
  const startTime = Date.now();
  
  console.log('==============================================================');
  console.log('🔍 Processing EIP Compliance Validation Job: ' + data.job_id);
  console.log('   Content Length: ' + data.content.length + ' characters');
  console.log('   Sources: ' + data.sources.length);
  console.log('   Validation Level: ' + (data.validation_level || 'standard'));
  console.log('   Artifact ID: ' + (data.artifact_id || 'N/A'));
  console.log('==============================================================');

  try {
    // Initialize compliance engine and database
    const complianceEngine = new ComplianceEngine(null, {
      enableParallelProcessing: true,
      maxConcurrency: 10,
      enableCaching: true,
      validationLimits: {
        maxContentLength: 500000,
        maxSourcesCount: 100,
        allowedContentTypes: ['educational', 'advisory', 'regulatory', 'marketing', 'financial_advice'],
        maxUrlLength: 2048
      }
    });

    let db: OrchestratorDB | null = null;
    let complianceDb: ComplianceDatabaseExtension | null = null;
    
    // Initialize database connection
    try {
      db = new OrchestratorDB();
      complianceDb = new ComplianceDatabaseExtension();
      console.log('📊 Database connection initialized for compliance validation');
    } catch (dbError) {
      console.warn('⚠️ Database not available, running compliance validation without persistence:', dbError instanceof Error ? dbError.message : 'Unknown error');
      db = null;
      complianceDb = null;
    }

    // ============================================================================
    // COMPLIANCE VALIDATION WITH ENGINE INTEGRATION
    // ============================================================================
    console.log('\n🔍 Stage 1: Compliance Engine Validation');
    
    // Validate content using compliance engine
    const complianceReport = await complianceEngine.validateContent(
      data.content,
      {
        ...data.context,
        geographical_focus: data.context?.geographical_focus ? (Array.isArray(data.context.geographical_focus) ? data.context.geographical_focus : [data.context.geographical_focus]) : undefined
      },
      data.sources
    );

    console.log('✅ Compliance validation completed');
    console.log('   Status: ' + complianceReport.status);
    console.log('   Score: ' + complianceReport.overall_score + '/100');
    console.log('   Violations: ' + complianceReport.violations.length);
    console.log('   Processing Tier: ' + complianceReport.metadata.processing_tier);

    // ============================================================================
    // STORE COMPLIANCE RESULTS
    // ============================================================================
    let storedResultId: string | undefined;
    
    if (complianceDb) {
      try {
        // Store compliance validation results
        const storeResult = await complianceDb.storeComplianceValidation({
          job_id: data.job_id,
          artifact_id: data.artifact_id,
          compliance_report: complianceReport,
          validation_metadata: {
            content_length: data.content.length,
            sources_count: data.sources.length,
            validation_level: data.validation_level || 'standard',
            correlation_id: data.correlation_id
          }
        });

        if (storeResult.success) {
          storedResultId = storeResult.result_id;
          console.log('💾 Compliance results stored: ' + storedResultId);
        } else {
          console.warn('⚠️ Failed to store compliance results:', storeResult.error);
        }
      } catch (storeError) {
        console.error('❌ Error storing compliance results:', storeError);
        // Non-critical - continue with validation
      }
    }

    // ============================================================================
    // DETERMINE FOLLOW-UP ACTIONS BASED ON VIOLATIONS
    // ============================================================================
    const criticalViolations = complianceReport.violations.filter((v: any) => v.severity === 'critical');
    const highViolations = complianceReport.violations.filter((v: any) => v.severity === 'high');
    
    console.log('\n🎯 Compliance Analysis:');
    console.log('   Critical Violations: ' + criticalViolations.length);
    console.log('   High Severity Violations: ' + highViolations.length);
    console.log('   Authority Level: ' + complianceReport.authority_level);
    console.log('   Processing Time: ' + complianceReport.processing_time_ms + 'ms');

    // Route to DLQ for critical compliance failures that prevent publishing
    if (criticalViolations.length > 0 || complianceReport.overall_score < 30) {
      const dlqReason = criticalViolations.length > 0 
        ? 'Critical compliance violations detected: ' + criticalViolations.map((v: any) => v.description).join('; ')
        : 'Compliance score too low: ' + complianceReport.overall_score + '/100';

      console.warn('🚨 Compliance failure detected - routing to DLQ: ' + dlqReason);
      
      const dlqResult = await routeToDLQ({
        failed_job: data,
        failure_reason: dlqReason,
        failure_type: 'system_error',
        retry_count: job.attemptsMade,
        correlation_id: data.correlation_id
      });

      if (dlqResult.success) {
        console.log('📭 Compliance violation routed to DLQ: ' + dlqResult.dlqJobId);
      }

      throw new Error(dlqReason);
    }

    const processingTime = Date.now() - startTime;
    console.log('\n✅ EIP Compliance Validation Job Completed Successfully!');
    console.log('   Job ID: ' + data.job_id);
    console.log('   Duration: ' + processingTime + 'ms');
    console.log('   Compliance Score: ' + complianceReport.overall_score + '/100');
    console.log('   Status: ' + complianceReport.status);
    console.log('   Violations: ' + complianceReport.violations.length);
    console.log('   DB Persisted: ' + !!storedResultId);

    return {
      success: true,
      job_id: data.job_id,
      compliance_report: complianceReport,
      violations_count: complianceReport.violations.length,
      compliance_score: complianceReport.overall_score,
      status: complianceReport.status,
      processing_time_ms: processingTime,
      artifact_id: data.artifact_id,
      stored_result_id: storedResultId,
      metadata: {
        sources_validated: complianceReport.evidence_summary.total_sources,
        high_authority_sources: complianceReport.evidence_summary.high_authority_sources,
        stale_sources: complianceReport.evidence_summary.stale_sources,
        processing_tier: complianceReport.metadata.processing_tier,
        correlation_id: data.correlation_id
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('\n❌ EIP Compliance Validation Job Failed after ' + processingTime + 'ms');
    console.error('   Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    console.error('   Job ID: ' + data.job_id);
    console.error('   Artifact ID: ' + (data.artifact_id || 'N/A'));
    
    // Classify failure type for appropriate handling
    const failureType = classifyComplianceFailureType(error);
    
    // Route to DLQ if appropriate
    if (failureType !== 'system_error' || job.attemptsMade >= 2) {
      const dlqResult = await routeToDLQ({
        failed_job: data,
        failure_reason: error instanceof Error ? error.message : 'Unknown error',
        failure_type: 'system_error',
        retry_count: job.attemptsMade,
        correlation_id: data.correlation_id
      });

      if (dlqResult.success) {
        console.log('📭 Compliance validation job routed to DLQ: ' + dlqResult.dlqJobId);
      }
    }

    // Attach metadata for error tracking
    (error as any).jobId = data.job_id;
    (error as any).artifactId = data.artifact_id;
    (error as any).failureType = failureType;
    (error as any).duration = processingTime;
    (error as any).sourcesCount = data.sources.length;

    throw error;
  }
}

/**
 * Classify compliance validation failure type for appropriate handling
 */
function classifyComplianceFailureType(error: any): 'system_error' | 'timeout' | 'validation_error' {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
    return 'validation_error';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  
  return 'system_error';
}

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

/**
 * Lazy initialization for EIP compliance validation worker
 */
let _eipComplianceWorker: Worker<EIPComplianceValidationJob> | null = null;

export function getEIPComplianceWorker(): Worker<EIPComplianceValidationJob> {
  if (!_eipComplianceWorker) {
    _eipComplianceWorker = new Worker<EIPComplianceValidationJob>(
      'eip:prod:compliance-validation:primary:v1',
      processComplianceValidationJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.EIP_COMPLIANCE_WORKER_CONCURRENCY || '3'),
        limiter: {
          max: parseInt(process.env.EIP_COMPLIANCE_QUEUE_RATE_LIMIT || '5'),
          duration: 1000,
        },
        // 2-minute timeout for compliance validation (network I/O intensive)
        lockDuration: 120000,
      }
    );

    // Set up event handlers following EIP patterns
    _eipComplianceWorker.on('completed', (job) => {
      console.log('✅ EIP Compliance Worker completed job ' + job.id);
    });

    _eipComplianceWorker.on('failed', (job, err) => {
      const failureType = (err as any).failureType || 'unknown';
      const duration = (err as any).duration || 0;
      const sourcesCount = (err as any).sourcesCount || 0;
      
      console.error('❌ EIP Compliance Worker failed job ' + (job?.id || 'unknown'));
      console.error('   Failure Type: ' + failureType);
      console.error('   Duration: ' + duration + 'ms');
      console.error('   Sources: ' + sourcesCount);
      console.error('   Attempts: ' + ((job?.attemptsMade || 0) + 1) + '/2');
      console.error('   Message: ' + err.message);
    });

    _eipComplianceWorker.on('error', (err) => {
      console.error('❌ EIP Compliance Worker error:', err);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log('\n⚠️ ' + signal + ' received, gracefully shutting down EIP Compliance Worker...');
      await _eipComplianceWorker!.close();
      console.log('✅ EIP Compliance Worker closed successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('🚀 EIP Compliance Validation Worker initialized and ready to process jobs');
    console.log('   Concurrency: ' + (process.env.EIP_COMPLIANCE_WORKER_CONCURRENCY || '3'));
    console.log('   Rate limit: ' + (process.env.EIP_COMPLIANCE_QUEUE_RATE_LIMIT || '5') + '/second');
    console.log('   Environment: ' + (process.env.NODE_ENV || 'development'));
  }
  return _eipComplianceWorker;
}

// Export for use in worker manager
export { processComplianceValidationJob };
