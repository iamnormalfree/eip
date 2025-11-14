// Feature flag system for progressive rollout
export const FEATURE_FLAGS = {
  // Mobile UI flag - enabled in production (mobile optimization complete)
  MOBILE_AI_BROKER_UI: true,  // Always enable mobile-optimized UI
  // Sophisticated flow UI flag - enables gradual rollout of new homepage
  USE_SOPHISTICATED_FLOW: process.env.NODE_ENV === 'development' ||
                          process.env.NEXT_PUBLIC_USE_SOPHISTICATED_FLOW === 'true',
  PERSIST_SESSION_DATA: true,  // Always persist session data
  CHAT_PERSISTENCE: true       // Always persist chat messages
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

// Feature flag validation utility
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag] === true
}

// Rollout configuration for production
export const ROLLOUT_CONFIG = {
  development: true,           // Always on for development
  staging: true,              // Full testing in staging
  production: {
    percentage: 0,             // Start with 0% traffic
    allowlist: ['test@example.com']  // Specific test users
  }
} as const
