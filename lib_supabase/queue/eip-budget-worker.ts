// ABOUTME: EIP Budget Validation Worker - Real-time budget monitoring and circuit breaker integration
// ABOUTME: Processes budget validation jobs with anomaly detection and alerting

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { EIPBudgetValidationJob } from './eip-queue';
import { Tier } from '../../orchestrator/budget';

// ============================================================================
// EIP BUDGET VALIDATION WORKER
// ============================================================================
// Integration: Real-time budget monitoring with circuit breaker integration

/**
 * Budget anomaly detection result
 */
interface BudgetAnomaly {
  type: 'token_spike' | 'time_exceeded' | 'stage_breach' | 'circuit_breaker_risk';
  severity: 'warning' | 'critical';
  message: string;
  suggested_action: string;
  metrics: {
    actual: number;
    expected: number;
    variance_percentage: number;
  };
}

/**
 * Process budget validation job with anomaly detection
 * 
 * Key Features:
 * - Real-time budget analysis and anomaly detection
 * - Circuit breaker health monitoring
 * - Performance trend analysis
 * - Alert generation for budget violations
 */
async function processBudgetValidationJob(job: Job<EIPBudgetValidationJob>) {
  const { data } = job;
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`💰 Processing Budget Validation Job: ${data.original_job_id}`);
  console.log(`   Tier: ${data.tier}`);
  console.log(`   Tokens Used: ${data.tokens_used}`);
  console.log(`   Time Elapsed: ${data.time_elapsed.toFixed(2)}s`);
  console.log(`   Breaches: ${data.breaches.length}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Load budget thresholds for tier comparison
    const budgetThresholds = getBudgetThresholds(data.tier);
    
    // Analyze budget performance
    const analysis = analyzeBudgetPerformance(data, budgetThresholds);
    
    // Detect anomalies
    const anomalies = detectBudgetAnomalies(data, budgetThresholds, analysis);
    
    // Generate alerts if needed
    if (anomalies.length > 0) {
      await generateBudgetAlerts(data, anomalies);
    }
    
    // Store validation results for trending
    await storeBudgetValidationResults(data, analysis, anomalies);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Budget validation completed in ${duration}ms`);
    console.log(`   Anomalies detected: ${anomalies.length}`);
    console.log(`   Performance score: ${analysis.performance_score}/100`);
    
    return {
      success: true,
      original_job_id: data.original_job_id,
      tier: data.tier,
      analysis,
      anomalies,
      validation_timestamp: new Date().toISOString(),
      processing_duration_ms: duration
    };

  } catch (error) {
    console.error('❌ Budget validation job failed:', error);
    throw error;
  }
}

/**
 * Get budget thresholds for comparison
 */
function getBudgetThresholds(tier: Tier) {
  // These would normally come from YAML configuration or budget.ts
  const thresholds = {
    LIGHT: {
      tokens: 1400,
      wallclock_s: 20,
      stage_limits: {
        planner: { tokens: 200, time_s: 5 },
        retrieval: { tokens: 400, time_s: 8 },
        generator: { tokens: 800, time_s: 15 },
        auditor: { tokens: 300, time_s: 5 },
        repairer: { tokens: 200, time_s: 3 }
      }
    },
    MEDIUM: {
      tokens: 2400,
      wallclock_s: 45,
      stage_limits: {
        planner: { tokens: 300, time_s: 8 },
        retrieval: { tokens: 600, time_s: 12 },
        generator: { tokens: 1600, time_s: 25 },
        auditor: { tokens: 500, time_s: 8 },
        repairer: { tokens: 400, time_s: 5 }
      }
    },
    HEAVY: {
      tokens: 4000,
      wallclock_s: 90,
      stage_limits: {
        planner: { tokens: 500, time_s: 10 },
        retrieval: { tokens: 800, time_s: 15 },
        generator: { tokens: 2400, time_s: 45 },
        auditor: { tokens: 700, time_s: 10 },
        repairer: { tokens: 600, time_s: 8 }
      }
    }
  };
  
  return thresholds[tier] || thresholds.MEDIUM;
}

/**
 * Analyze budget performance
 */
function analyzeBudgetPerformance(data: EIPBudgetValidationJob, thresholds: any) {
  const tokenEfficiency = ((thresholds.tokens - data.tokens_used) / thresholds.tokens) * 100;
  const timeEfficiency = ((thresholds.wallclock_s - data.time_elapsed) / thresholds.wallclock_s) * 100;
  
  // Stage-specific analysis
  const stageAnalysis: Record<string, any> = {};
  for (const [stage, usage] of Object.entries(data.stage_breakdown.tokens)) {
    const limit = thresholds.stage_limits[stage];
    if (limit) {
      stageAnalysis[stage] = {
        tokens_used: usage,
        token_limit: limit.tokens,
        token_efficiency: ((limit.tokens - usage) / limit.tokens) * 100,
        time_used: data.stage_breakdown.times_ms[stage] / 1000,
        time_limit: limit.time_s,
        time_efficiency: ((limit.time_s - (data.stage_breakdown.times_ms[stage] / 1000)) / limit.time_s) * 100
      };
    }
  }
  
  // Overall performance score (0-100)
  const performance_score = Math.max(0, Math.min(100, 
    (tokenEfficiency * 0.6) + (timeEfficiency * 0.4)
  ));
  
  return {
    token_efficiency: Math.max(0, tokenEfficiency),
    time_efficiency: Math.max(0, timeEfficiency),
    performance_score: Math.round(performance_score * 10) / 10,
    stage_analysis: stageAnalysis,
    overall_efficiency: performance_score >= 80 ? 'excellent' : 
                        performance_score >= 60 ? 'good' : 
                        performance_score >= 40 ? 'acceptable' : 'poor'
  };
}

/**
 * Detect budget anomalies
 */
function detectBudgetAnomalies(data: EIPBudgetValidationJob, thresholds: any, analysis: any): BudgetAnomaly[] {
  const anomalies: BudgetAnomaly[] = [];
  
  // Token usage anomalies
  if (data.tokens_used > thresholds.tokens) {
    const tokenVariance = ((data.tokens_used - thresholds.tokens) / thresholds.tokens) * 100;
    anomalies.push({
      type: 'token_spike',
      severity: tokenVariance > 20 ? 'critical' : 'warning',
      message: `Token usage exceeded budget by ${tokenVariance.toFixed(1)}%`,
      suggested_action: tokenVariance > 20 ? 
        'Investigate generation prompts for inefficiency' : 
        'Monitor token usage trends',
      metrics: {
        actual: data.tokens_used,
        expected: thresholds.tokens,
        variance_percentage: tokenVariance
      }
    });
  }
  
  // Time usage anomalies
  if (data.time_elapsed > thresholds.wallclock_s) {
    const timeVariance = ((data.time_elapsed - thresholds.wallclock_s) / thresholds.wallclock_s) * 100;
    anomalies.push({
      type: 'time_exceeded',
      severity: timeVariance > 30 ? 'critical' : 'warning',
      message: `Processing time exceeded budget by ${timeVariance.toFixed(1)}%`,
      suggested_action: timeVariance > 30 ? 
        'Optimize performance bottlenecks' : 
        'Review processing pipeline efficiency',
      metrics: {
        actual: data.time_elapsed,
        expected: thresholds.wallclock_s,
        variance_percentage: timeVariance
      }
    });
  }
  
  // Stage-specific breaches
  for (const breach of data.breaches) {
    const stageLimit = thresholds.stage_limits[breach.stage];
    if (stageLimit) {
      const actualValue = breach.type === 'tokens' ? 
        data.stage_breakdown.tokens[breach.stage] : 
        data.stage_breakdown.times_ms[breach.stage] / 1000;
      const limitValue = breach.type === 'tokens' ? 
        stageLimit.tokens : 
        stageLimit.time_s;
      const variance = ((actualValue - limitValue) / limitValue) * 100;
      
      anomalies.push({
        type: 'stage_breach',
        severity: breach.severity || 'warning',
        message: `Stage ${breach.stage} ${breach.type} budget exceeded by ${variance.toFixed(1)}%`,
        suggested_action: breach.severity === 'critical' ? 
          `Review ${breach.stage} implementation immediately` : 
          `Monitor ${breach.stage} performance`,
        metrics: {
          actual: actualValue,
          expected: limitValue,
          variance_percentage: variance
        }
      });
    }
  }
  
  // Circuit breaker risk assessment
  const criticalBreaches = data.breaches.filter(b => b.severity === 'critical');
  if (criticalBreaches.length >= 2) {
    anomalies.push({
      type: 'circuit_breaker_risk',
      severity: 'critical',
      message: `Multiple critical budget violations detected - circuit breaker at risk`,
      suggested_action: 'Immediate investigation required to prevent circuit breaker activation',
      metrics: {
        actual: criticalBreaches.length,
        expected: 0,
        variance_percentage: Infinity
      }
    });
  }
  
  return anomalies;
}

/**
 * Generate budget alerts for detected anomalies
 */
async function generateBudgetAlerts(data: EIPBudgetValidationJob, anomalies: BudgetAnomaly[]): Promise<void> {
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  
  if (criticalAnomalies.length > 0) {
    console.error(`🚨 CRITICAL BUDGET ALERTS for job ${data.original_job_id}:`);
    criticalAnomalies.forEach(anomaly => {
      console.error(`   ${anomaly.type.toUpperCase()}: ${anomaly.message}`);
      console.error(`   Action: ${anomaly.suggested_action}`);
    });
    
    // In a real implementation, this would send notifications to monitoring systems
    // For now, we'll just log the alerts
    try {
      // Could integrate with:
      // - Slack/Teams notifications
      // - PagerDuty alerts  
      // - Monitoring dashboards
      // - Email notifications
      
      console.log(`📧 Critical budget alerts generated for job ${data.original_job_id}`);
    } catch (alertError) {
      console.error('Failed to send budget alerts:', alertError);
    }
  }
  
  const warningAnomalies = anomalies.filter(a => a.severity === 'warning');
  if (warningAnomalies.length > 0) {
    console.warn(`⚠️ Budget warnings for job ${data.original_job_id}:`);
    warningAnomalies.forEach(anomaly => {
      console.warn(`   ${anomaly.type}: ${anomaly.message}`);
    });
  }
}

/**
 * Store budget validation results for trending
 */
async function storeBudgetValidationResults(
  data: EIPBudgetValidationJob, 
  analysis: any, 
  anomalies: BudgetAnomaly[]
): Promise<void> {
  try {
    // In a real implementation, this would store results in a database
    // for trend analysis and performance monitoring
    
    const validationRecord = {
      original_job_id: data.original_job_id,
      tier: data.tier,
      tokens_used: data.tokens_used,
      time_elapsed: data.time_elapsed,
      breaches_count: data.breaches.length,
      anomalies_count: anomalies.length,
      performance_score: analysis.performance_score,
      validation_timestamp: new Date().toISOString(),
      anomalies: anomalies.map(a => ({
        type: a.type,
        severity: a.severity,
        message: a.message
      }))
    };
    
    // Store in Redis for trending (with TTL)
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    
    const key = `budget-validation:${data.original_job_id}`;
    await redis.hset(key, validationRecord);
    await redis.expire(key, 86400 * 7); // 7 days TTL
    
    // Also store in tier-based metrics for aggregation
    const metricsKey = `budget-metrics:${data.tier}:${new Date().toISOString().split('T')[0]}`;
    await redis.lpush(metricsKey, JSON.stringify(validationRecord));
    await redis.expire(metricsKey, 86400 * 30); // 30 days TTL
    
    await redis.quit();
    
    console.log(`💾 Budget validation results stored for job ${data.original_job_id}`);
    
  } catch (error) {
    console.error('Failed to store budget validation results:', error);
    // Non-critical - don't fail the job
  }
}

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

/**
 * Lazy initialization for EIP budget validation worker
 */
let _eipBudgetWorker: Worker<EIPBudgetValidationJob> | null = null;

export function getEIPBudgetWorker(): Worker<EIPBudgetValidationJob> {
  if (!_eipBudgetWorker) {
    _eipBudgetWorker = new Worker<EIPBudgetValidationJob>(
      'eip:prod:budget-enforcement:validation:v1',
      processBudgetValidationJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.EIP_BUDGET_WORKER_CONCURRENCY || '3'),
        limiter: {
          max: parseInt(process.env.EIP_BUDGET_QUEUE_RATE_LIMIT || '5'),
          duration: 1000,
        },
        // Shorter timeout for budget validation
        lockDuration: 15000, // 15 seconds
      }
    );

    // Set up event handlers
    _eipBudgetWorker.on('completed', (job) => {
      console.log(`✅ EIP Budget Worker completed job ${job.id}`);
    });

    _eipBudgetWorker.on('failed', (job, err) => {
      console.error(`❌ EIP Budget Worker failed job ${job?.id}`);
      console.error(`   Error: ${err.message}`);
      console.error(`   Attempts: ${job?.attemptsMade + 1}/2`);
    });

    _eipBudgetWorker.on('error', (err) => {
      console.error('❌ EIP Budget Worker error:', err);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received, gracefully shutting down EIP Budget Worker...`);
      await _eipBudgetWorker!.close();
      console.log('✅ EIP Budget Worker closed successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('🚀 EIP Budget Validation Worker initialized and ready to process jobs');
    console.log(`   Concurrency: ${process.env.EIP_BUDGET_WORKER_CONCURRENCY || 3}`);
    console.log(`   Rate limit: ${process.env.EIP_BUDGET_QUEUE_RATE_LIMIT || 5}/second`);
  }
  return _eipBudgetWorker;
}

// Export for use in worker manager
export { processBudgetValidationJob };
