/**
 * Migration Control Utilities
 *
 * PURPOSE:
 * Manages gradual rollout from n8n AI Broker to BullMQ-based broker system.
 * Provides feature flags, percentage-based routing, and migration status tracking.
 *
 * USAGE:
 * - shouldUseBullMQ() - Determines if a request should use BullMQ based on percentage
 * - isFeatureEnabled() - Generic feature flag system
 * - getMigrationStatus() - Get current migration configuration
 * - logMigrationDecision() - Log routing decisions for debugging
 *
 * ENVIRONMENT VARIABLES:
 * - ENABLE_BULLMQ_BROKER: 'true' to enable BullMQ system
 * - BULLMQ_ROLLOUT_PERCENTAGE: 0-100, percentage of traffic to route to BullMQ
 * - ENABLE_AI_BROKER: 'true' to keep n8n active (parallel mode)
 *
 * MIGRATION STAGES:
 * 1. Both disabled - Legacy system only
 * 2. BullMQ=true, 0% - BullMQ processes jobs but doesn't send responses (validation)
 * 3. BullMQ=true, 10-50% - Gradual rollout (parallel with n8n)
 * 4. BullMQ=true, 100% - Full cutover (n8n as backup)
 * 5. BullMQ=true, 100%, n8n=false - BullMQ only (decommission n8n)
 */

export interface MigrationStatus {
  /** Is BullMQ system enabled */
  bullmqEnabled: boolean;
  /** Percentage of traffic routed to BullMQ (0-100) */
  trafficPercentage: number;
  /** Is n8n still active */
  n8nEnabled: boolean;
  /** Are both systems running in parallel */
  parallelMode: boolean;
  /** Current migration phase description */
  phase: string;
}

/**
 * Feature flags for gradual rollout
 * Extend this for other features beyond BullMQ migration
 */
export type FeatureName =
  | 'bullmq_broker'
  | 'bullmq_webhooks'
  | 'bullmq_conversations'
  | 'advanced_analytics'
  | 'experimental_ui';

/**
 * Get current migration status
 *
 * @returns MigrationStatus object with current configuration
 */
export function getMigrationStatus(): MigrationStatus {
  // WORKAROUND: Railway not injecting env vars - use config file with hardcoded fallback
  const { bullmqConfig } = require('@/lib/config/bullmq-config');

  const bullmqEnabled = bullmqConfig.enabled;
  const trafficPercentage = bullmqConfig.rolloutPercentage;
  const n8nEnabled = bullmqConfig.n8nEnabled;

  // Determine migration phase
  let phase = 'legacy';
  if (!bullmqEnabled && !n8nEnabled) {
    phase = 'legacy (no AI broker active)';
  } else if (bullmqEnabled && trafficPercentage === 0) {
    phase = 'validation (BullMQ active, 0% traffic)';
  } else if (bullmqEnabled && trafficPercentage < 50 && n8nEnabled) {
    phase = `gradual rollout (${trafficPercentage}% BullMQ, n8n parallel)`;
  } else if (bullmqEnabled && trafficPercentage < 100 && n8nEnabled) {
    phase = `majority cutover (${trafficPercentage}% BullMQ, n8n backup)`;
  } else if (bullmqEnabled && trafficPercentage >= 100 && n8nEnabled) {
    phase = 'full cutover (100% BullMQ, n8n backup)';
  } else if (bullmqEnabled && trafficPercentage >= 100 && !n8nEnabled) {
    phase = 'complete (100% BullMQ, n8n decommissioned)';
  }

  return {
    bullmqEnabled,
    trafficPercentage: Math.max(0, Math.min(100, trafficPercentage)), // Clamp 0-100
    n8nEnabled,
    parallelMode: bullmqEnabled && n8nEnabled,
    phase,
  };
}

/**
 * Determine if this request should use BullMQ
 * Based on traffic percentage with optional lead score prioritization
 *
 * @param leadScore - Optional lead score (0-100) for prioritization
 * @returns true if request should use BullMQ, false for n8n/legacy
 *
 * PRIORITY LOGIC:
 * - High-value leads (score > 75) have 1.5x chance of using BullMQ
 * - This allows premium leads to benefit from improved system first
 * - Normal leads use standard percentage-based routing
 */
export function shouldUseBullMQ(leadScore?: number): boolean {
  const status = getMigrationStatus();

  // BullMQ not enabled - use legacy/n8n
  if (!status.bullmqEnabled) {
    return false;
  }

  // 100% cutover - always use BullMQ
  if (status.trafficPercentage >= 100) {
    return true;
  }

  // 0% - validation mode, no traffic
  if (status.trafficPercentage <= 0) {
    return false;
  }

  // Gradual rollout with optional lead score prioritization
  // Generate random number 0-100
  const randomValue = Math.random() * 100;

  // Optional: Prioritize high-value leads for BullMQ
  if (leadScore && leadScore > 75) {
    // High-value leads get 1.5x multiplier (capped at 100%)
    const priorityPercentage = Math.min(status.trafficPercentage * 1.5, 100);
    return randomValue < priorityPercentage;
  }

  // Standard percentage-based routing
  return randomValue < status.trafficPercentage;
}

/**
 * Generic feature flag system
 *
 * @param featureName - Name of the feature to check
 * @returns true if feature is enabled
 *
 * ENVIRONMENT VARIABLE FORMAT:
 * - FEATURE_<NAME>: 'true' or 'false'
 * - Example: FEATURE_BULLMQ_BROKER=true
 */
export function isFeatureEnabled(featureName: FeatureName): boolean {
  // Special handling for BullMQ features
  if (featureName.startsWith('bullmq_')) {
    const status = getMigrationStatus();

    if (featureName === 'bullmq_broker') {
      return status.bullmqEnabled;
    }

    if (featureName === 'bullmq_webhooks' || featureName === 'bullmq_conversations') {
      // These sub-features require BullMQ to be enabled
      return status.bullmqEnabled && status.trafficPercentage > 0;
    }
  }

  // Generic feature flag check
  const envVarName = `FEATURE_${featureName.toUpperCase()}`;
  return process.env[envVarName] === 'true';
}

/**
 * Log migration decision for debugging and monitoring
 *
 * @param conversationId - Conversation ID
 * @param usedBullMQ - Whether BullMQ was used
 * @param reason - Reason for the decision
 * @param leadScore - Optional lead score for context
 */
export function logMigrationDecision(
  conversationId: number,
  usedBullMQ: boolean,
  reason: string,
  leadScore?: number
) {
  const status = getMigrationStatus();

  console.log(`🔀 Migration decision for conversation ${conversationId}:`);
  console.log(`   System: ${usedBullMQ ? '✅ BullMQ' : '❌ n8n/Legacy'}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Lead Score: ${leadScore || 'N/A'}`);
  console.log(`   Migration Status: ${status.phase}`);
  console.log(`   Config: BullMQ ${status.trafficPercentage}%, n8n ${status.n8nEnabled ? 'ON' : 'OFF'}`);
}

/**
 * Get migration phase recommendations
 * Provides guidance on next steps based on current status
 *
 * @returns Array of recommendation strings
 */
export function getMigrationRecommendations(queueMetrics?: {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}): string[] {
  const status = getMigrationStatus();
  const recommendations: string[] = [];

  // Not enabled yet
  if (!status.bullmqEnabled) {
    recommendations.push('Set ENABLE_BULLMQ_BROKER=true to begin migration');
    recommendations.push('Start with BULLMQ_ROLLOUT_PERCENTAGE=0 for validation');
    return recommendations;
  }

  // Validation mode
  if (status.bullmqEnabled && status.trafficPercentage === 0) {
    recommendations.push('Currently in validation mode (0% traffic)');
    recommendations.push('Monitor queue metrics for 24 hours');
    recommendations.push('Set BULLMQ_ROLLOUT_PERCENTAGE=10 to start with 10% traffic');
  }

  // Check queue health
  if (queueMetrics) {
    // High failure rate - warning
    if (queueMetrics.failed > 10) {
      recommendations.push('⚠️ High failure rate - investigate failed jobs before increasing traffic');
      recommendations.push('Review worker logs and error patterns');
    }

    // Queue backing up - warning
    if (queueMetrics.waiting > 20) {
      recommendations.push('⚠️ Queue backing up - consider increasing WORKER_CONCURRENCY');
      recommendations.push(`Currently ${queueMetrics.waiting} jobs waiting`);
    }

    // System stable - can increase
    if (status.trafficPercentage < 100 && queueMetrics.failed === 0 && queueMetrics.waiting < 10) {
      if (status.trafficPercentage < 50) {
        recommendations.push('✅ System stable - safe to increase to 50%');
      } else {
        recommendations.push('✅ System stable - safe to increase to 100%');
      }
    }
  }

  // Full cutover completed
  if (status.trafficPercentage === 100 && status.n8nEnabled) {
    recommendations.push('✅ Full cutover active (100% BullMQ)');
    recommendations.push('Monitor for 1 week of stability');
    recommendations.push('Consider disabling n8n (ENABLE_AI_BROKER=false) after stability confirmed');
  }

  // Migration complete
  if (status.trafficPercentage === 100 && !status.n8nEnabled) {
    recommendations.push('✅ Migration complete - BullMQ is sole system');
    recommendations.push('n8n workflow can be archived/decommissioned');
  }

  return recommendations;
}

/**
 * Calculate expected traffic distribution
 *
 * @param totalRequests - Total number of requests
 * @returns Expected distribution between BullMQ and n8n
 */
export function calculateTrafficDistribution(totalRequests: number): {
  bullmq: number;
  n8n: number;
  percentage: {
    bullmq: number;
    n8n: number;
  };
} {
  const status = getMigrationStatus();
  const bullmqCount = Math.round((totalRequests * status.trafficPercentage) / 100);
  const n8nCount = status.n8nEnabled ? totalRequests - bullmqCount : 0;

  return {
    bullmq: bullmqCount,
    n8n: n8nCount,
    percentage: {
      bullmq: status.trafficPercentage,
      n8n: status.n8nEnabled ? 100 - status.trafficPercentage : 0,
    },
  };
}
