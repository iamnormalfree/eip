// ABOUTME: EIP Audit/Repair Worker - Quality assurance and automated content repair
// ABOUTME: Processes audit failures and automatically repairs content quality issues

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { EIPAuditRepairJob } from './eip-queue';
import { repairDraft } from '../../orchestrator/repairer';
import { microAudit } from '../../orchestrator/auditor';

// ============================================================================
// EIP AUDIT/REPAIR WORKER
// ============================================================================
// Integration: Quality assurance workflow with automated repair capabilities

/**
 * Audit repair result
 */
interface AuditRepairResult {
  success: boolean;
  content_id: string;
  original_issues: number;
  repaired_issues: number;
  remaining_issues: number;
  repair_attempts: number;
  quality_score_improvement: number;
  final_content?: string;
  repair_summary: string;
}

/**
 * Process audit/repair job for content quality issues
 * 
 * Key Features:
 * - Automated repair of IP invariant violations
 * - Compliance issue resolution
 * - Quality score improvement
 * - Multi-pass repair with validation
 */
async function processAuditRepairJob(job: Job<EIPAuditRepairJob>) {
  const { data } = job;
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 Processing Audit/Repair Job: ${data.content_id}`);
  console.log(`   Content Type: ${data.content_type}`);
  console.log(`   IP Type: ${data.ip_type}`);
  console.log(`   Issues: ${data.audit_issues.length}`);
  console.log(`   Priority: ${data.priority}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Categorize issues by type and severity
    const categorizedIssues = categorizeIssues(data.audit_issues);
    
    console.log(`📋 Issue breakdown:`);
    console.log(`   IP Invariant issues: ${categorizedIssues.ip_invariant.length}`);
    console.log(`   Compliance issues: ${categorizedIssues.compliance.length}`);
    console.log(`   Quality issues: ${categorizedIssues.quality.length}`);
    console.log(`   Critical errors: ${categorizedIssues.critical.length}`);
    
    // Retrieve original content
    const originalContent = await retrieveContent(data.content_id, data.content_type);
    if (!originalContent) {
      throw new Error(`Failed to retrieve content: ${data.content_id}`);
    }
    
    // Track repair progress
    let repairAttempts = 0;
    let currentContent = originalContent;
    let remainingIssues = [...data.audit_issues];
    let repairedIssues: any[] = [];
    
    // Multi-pass repair process
    while (repairAttempts < 3 && remainingIssues.length > 0) {
      repairAttempts++;
      console.log(`\n🔧 Repair attempt ${repairAttempts}/3`);
      console.log(`   Remaining issues: ${remainingIssues.length}`);
      
      // Attempt repair for current issues
      const repairResult = await attemptRepair(
        currentContent,
        data.ip_type,
        remainingIssues,
        repairAttempts
      );
      
      if (repairResult.success) {
        currentContent = repairResult.repaired_content;
        repairedIssues.push(...repairResult.fixed_issues);
        
        // Re-audit repaired content
        const reAuditResult = await microAudit({ 
          draft: currentContent, 
          ip: data.ip_type 
        });
        
        remainingIssues = reAuditResult.issues || [];
        console.log(`   ✅ Repair attempt completed`);
        console.log(`   Issues fixed: ${repairResult.fixed_issues.length}`);
        console.log(`   Issues remaining: ${remainingIssues.length}`);
      } else {
        console.log(`   ❌ Repair attempt failed: ${repairResult.error}`);
        break;
      }
    }
    
    // Calculate quality improvement
    const qualityImprovement = await calculateQualityImprovement(
      originalContent,
      currentContent,
      data.ip_type
    );
    
    // Save repaired content if improvements made
    let finalContent = null;
    if (repairAttempts > 0 && repairedIssues.length > 0) {
      finalContent = await saveRepairedContent(
        data.content_id,
        currentContent,
        repairedIssues,
        remainingIssues
      );
    }
    
    const duration = Date.now() - startTime;
    
    const result: AuditRepairResult = {
      success: repairedIssues.length > 0 || remainingIssues.length === 0,
      content_id: data.content_id,
      original_issues: data.audit_issues.length,
      repaired_issues: repairedIssues.length,
      remaining_issues: remainingIssues.length,
      repair_attempts: repairAttempts,
      quality_score_improvement: qualityImprovement,
      final_content: currentContent,
      repair_summary: generateRepairSummary(data.audit_issues, repairedIssues, remainingIssues)
    };
    
    console.log(`\n✅ Audit/Repair job completed in ${duration}ms`);
    console.log(`   Original issues: ${result.original_issues}`);
    console.log(`   Repaired issues: ${result.repaired_issues}`);
    console.log(`   Remaining issues: ${result.remaining_issues}`);
    console.log(`   Quality improvement: ${qualityImprovement.toFixed(1)}%`);
    console.log(`   Repair attempts: ${result.repair_attempts}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Audit/Repair job failed:', error);
    throw error;
  }
}

/**
 * Categorize audit issues by type and severity
 */
function categorizeIssues(issues: EIPAuditRepairJob['audit_issues']) {
  const categorized = {
    ip_invariant: issues.filter(i => i.type === 'ip_invariant'),
    compliance: issues.filter(i => i.type === 'compliance'),
    quality: issues.filter(i => i.type === 'quality'),
    critical: issues.filter(i => i.severity === 'error'),
    warning: issues.filter(i => i.severity === 'warning')
  };
  
  return categorized;
}

/**
 * Retrieve content from storage
 */
async function retrieveContent(contentId: string, contentType: 'draft' | 'artifact'): Promise<string | null> {
  try {
    // In a real implementation, this would retrieve from database or storage
    // For now, we'll simulate content retrieval
    
    if (contentType === 'draft') {
      // Would fetch from drafts table/collection
      return `# Sample Draft Content for ${contentId}

This is a sample draft that would be retrieved from the database.
The content would contain the actual generated material that needs
to be audited and potentially repaired.

## Issues Found:
- Missing IP structure elements
- Compliance violations
- Quality issues
`;
    } else {
      // Would fetch from artifacts table/collection  
      return `# Sample Artifact Content for ${contentId}

This is a sample artifact that would be retrieved from storage.
This represents the final published content that has undergone
the full generation and review process.

## Published Content:
- Structured educational content
- Compliance disclaimers
- Quality-assured material
`;
    }
  } catch (error) {
    console.error('Failed to retrieve content:', error);
    return null;
  }
}

/**
 * Attempt to repair content issues
 */
async function attemptRepair(
  content: string,
  ipType: string,
  issues: any[],
  attemptNumber: number
): Promise<{
  success: boolean;
  repaired_content: string;
  fixed_issues: any[];
  error?: string;
}> {
  try {
    console.log(`   🔧 Attempting to fix ${issues.length} issues...`);
    
    // Use the existing repairer from orchestrator
    const repairContext = {
      draft: content,
      ip: ipType,
      issues: issues,
      repair_context: {
        attempt_number: attemptNumber,
        strategy: determineRepairStrategy(issues, attemptNumber)
      }
    };
    
    const repairedContent = await repairDraft(repairContext);
    
    // Determine which issues were actually fixed (simplified)
    const fixedIssues = await validateRepairs(content, repairedContent, issues);
    
    return {
      success: true,
      repaired_content: repairedContent,
      fixed_issues: fixedIssues
    };
    
  } catch (error) {
    return {
      success: false,
      repaired_content: content,
      fixed_issues: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Determine repair strategy based on issues and attempt number
 */
function determineRepairStrategy(issues: any[], attemptNumber: number): string {
  const criticalIssues = issues.filter(i => i.severity === 'error');
  const complianceIssues = issues.filter(i => i.type === 'compliance');
  
  if (attemptNumber === 1) {
    // First attempt: Conservative repairs
    if (complianceIssues.length > 0) {
      return 'compliance_first';
    }
    return 'standard_repair';
  } else if (attemptNumber === 2) {
    // Second attempt: More aggressive repairs
    if (criticalIssues.length > 0) {
      return 'aggressive_repair';
    }
    return 'enhanced_repair';
  } else {
    // Third attempt: Full reconstruction if needed
    return 'reconstruct_if_needed';
  }
}

/**
 * Validate which issues were actually fixed by repair
 */
async function validateRepairs(
  originalContent: string,
  repairedContent: string,
  originalIssues: any[]
): Promise<any[]> {
  // In a real implementation, this would re-run specific audit checks
  // to determine which issues were actually resolved
  
  const fixedIssues: any[] = [];
  
  for (const issue of originalIssues) {
    // Simplified validation - would use actual audit logic
    const isFixed = await checkIfIssueFixed(issue, originalContent, repairedContent);
    if (isFixed) {
      fixedIssues.push({
        ...issue,
        fixed_at: new Date().toISOString(),
        fix_method: 'automated_repair'
      });
    }
  }
  
  return fixedIssues;
}

/**
 * Check if a specific issue was fixed
 */
async function checkIfIssueFixed(issue: any, original: string, repaired: string): Promise<boolean> {
  // Simplified logic - would use actual validation
  switch (issue.type) {
    case 'ip_invariant':
      // Check if IP structure is now present
      return repaired.length > original.length * 0.9; // Basic check
    case 'compliance':
      // Check if compliance elements are added
      return repaired.toLowerCase().includes('disclaimer') || 
             repaired.toLowerCase().includes('important');
    case 'quality':
      // Check if quality improvements are made
      return repaired !== original && repaired.length > original.length * 0.8;
    default:
      return false;
  }
}

/**
 * Calculate quality improvement score
 */
async function calculateQualityImprovement(
  originalContent: string,
  repairedContent: string,
  ipType: string
): Promise<number> {
  try {
    // Run audit on both versions
    const [originalAudit, repairedAudit] = await Promise.all([
      microAudit({ draft: originalContent, ip: ipType }),
      microAudit({ draft: repairedContent, ip: ipType })
    ]);
    
    // Calculate improvement based on issues resolved
    const originalIssueCount = (originalAudit.issues || []).length;
    const repairedIssueCount = (repairedAudit.issues || []).length;
    
    if (originalIssueCount === 0) return 0;
    
    const improvement = ((originalIssueCount - repairedIssueCount) / originalIssueCount) * 100;
    return Math.max(0, Math.min(100, improvement));
    
  } catch (error) {
    console.error('Failed to calculate quality improvement:', error);
    return 0;
  }
}

/**
 * Save repaired content
 */
async function saveRepairedContent(
  contentId: string,
  repairedContent: string,
  fixedIssues: any[],
  remainingIssues: any[]
): Promise<any> {
  try {
    // In a real implementation, this would save to database
    // For now, we'll simulate the save operation
    
    const savedContent = {
      id: contentId,
      content: repairedContent,
      version: Date.now(),
      repair_metadata: {
        fixed_issues_count: fixedIssues.length,
        remaining_issues_count: remainingIssues.length,
        repair_timestamp: new Date().toISOString(),
        fixed_issues: fixedIssues,
        remaining_issues: remainingIssues
      }
    };
    
    console.log(`💾 Repaired content saved: ${contentId}`);
    return savedContent;
    
  } catch (error) {
    console.error('Failed to save repaired content:', error);
    throw error;
  }
}

/**
 * Generate repair summary
 */
function generateRepairSummary(
  originalIssues: any[],
  fixedIssues: any[],
  remainingIssues: any[]
): string {
  const fixRate = originalIssues.length > 0 ? 
    ((fixedIssues.length / originalIssues.length) * 100).toFixed(1) : '0';
  
  let summary = `Repaired ${fixedIssues.length}/${originalIssues.length} issues (${fixRate}% success rate).`;
  
  if (remainingIssues.length > 0) {
    summary += ` ${remainingIssues.length} issues remain requiring manual review.`;
  } else {
    summary += ' All issues successfully resolved.';
  }
  
  return summary;
}

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

/**
 * Lazy initialization for EIP audit/repair worker
 */
let _eipAuditWorker: Worker<EIPAuditRepairJob> | null = null;

export function getEIPAuditWorker(): Worker<EIPAuditRepairJob> {
  if (!_eipAuditWorker) {
    _eipAuditWorker = new Worker<EIPAuditRepairJob>(
      'eip:prod:quality:audit-repair:v1',
      processAuditRepairJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.EIP_AUDIT_WORKER_CONCURRENCY || '2'),
        limiter: {
          max: parseInt(process.env.EIP_AUDIT_QUEUE_RATE_LIMIT || '3'),
          duration: 1000,
        },
        // Longer timeout for audit/repair operations
        lockDuration: 120000, // 2 minutes
      }
    );

    // Set up event handlers
    _eipAuditWorker.on('completed', (job) => {
      console.log(`✅ EIP Audit/Repair Worker completed job ${job.id}`);
    });

    _eipAuditWorker.on('failed', (job, err) => {
      console.error(`❌ EIP Audit/Repair Worker failed job ${job?.id}`);
      console.error(`   Error: ${err.message}`);
      console.error(`   Attempts: ${job?.attemptsMade + 1}/2`);
    });

    _eipAuditWorker.on('error', (err) => {
      console.error('❌ EIP Audit/Repair Worker error:', err);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received, gracefully shutting down EIP Audit/Repair Worker...`);
      await _eipAuditWorker!.close();
      console.log('✅ EIP Audit/Repair Worker closed successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('🚀 EIP Audit/Repair Worker initialized and ready to process jobs');
    console.log(`   Concurrency: ${process.env.EIP_AUDIT_WORKER_CONCURRENCY || 2}`);
    console.log(`   Rate limit: ${process.env.EIP_AUDIT_QUEUE_RATE_LIMIT || 3}/second`);
  }
  return _eipAuditWorker;
}

// Export for use in worker manager
export { processAuditRepairJob };
