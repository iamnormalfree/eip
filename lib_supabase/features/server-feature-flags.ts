'use server'

/**
 * Server-side feature flags
 * Uses runtime environment variables (not build-time NEXT_PUBLIC_ vars)
 * This allows changing flags without rebuilding the application
 */
export async function getFeatureFlags() {
  return {
    USE_SOPHISTICATED_FLOW: process.env.NODE_ENV === 'development' ||
                           process.env.NEXT_PUBLIC_USE_SOPHISTICATED_FLOW === 'true',
    MOBILE_AI_BROKER_UI: process.env.NODE_ENV === 'development' ||
                        process.env.NEXT_PUBLIC_MOBILE_AI_BROKER === 'true',
    PERSIST_SESSION_DATA: true,
    CHAT_PERSISTENCE: true
  }
}

/**
 * Check if a specific feature flag is enabled
 */
export async function isFeatureEnabled(flag: string): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[flag as keyof typeof flags] === true
}
