/**
 * BullMQ Configuration
 *
 * WORKAROUND: Railway environment variables not being injected properly.
 * This file provides fallback configuration values.
 */

export const bullmqConfig = {
  /**
   * Enable BullMQ broker system
   * Set via ENABLE_BULLMQ_BROKER env var
   */
  enabled: process.env.ENABLE_BULLMQ_BROKER === 'true' ||
           process.env.NEXT_PUBLIC_ENABLE_BULLMQ === 'true' ||
           // TEMPORARY HARDCODE for debugging
           true,

  /**
   * Traffic percentage to route through BullMQ (0-100)
   * Set via BULLMQ_ROLLOUT_PERCENTAGE env var
   */
  rolloutPercentage: parseInt(
    process.env.BULLMQ_ROLLOUT_PERCENTAGE ||
    process.env.NEXT_PUBLIC_BULLMQ_PERCENTAGE ||
    // TEMPORARY HARDCODE for debugging
    '100',
    10
  ),

  /**
   * Is n8n still enabled (legacy system)
   */
  n8nEnabled: process.env.ENABLE_AI_BROKER === 'true' || false
};

// Log configuration on import (server-side only)
if (typeof window === 'undefined') {
  console.log('🔧 BullMQ Config loaded:', {
    enabled: bullmqConfig.enabled,
    rolloutPercentage: bullmqConfig.rolloutPercentage,
    n8nEnabled: bullmqConfig.n8nEnabled,
    source: process.env.ENABLE_BULLMQ_BROKER ? 'env var' : 'hardcoded fallback'
  });
}
