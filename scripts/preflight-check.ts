// ABOUTME: Preflight check script for validating Supabase + Redis runtime availability
// ABOUTME: Used by integration tests to verify environment prerequisites before running

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PreflightResult {
  available: boolean;
  error?: string;
}

// ============================================================================
// SUPABASE PREFLIGHT CHECK
// ============================================================================

/**
 * Check Supabase connectivity by running a lightweight query
 * Returns available: true if connection succeeds (including table missing)
 */
export async function checkSupabaseConnection(): Promise<PreflightResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return {
      available: false,
      error: 'NEXT_PUBLIC_SUPABASE_URL is not set'
    };
  }

  // Prefer SUPABASE_SERVICE_ROLE_KEY, fallback to SUPABASE_SERVICE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!serviceKey) {
    return {
      available: false,
      error: 'Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SERVICE_KEY is set'
    };
  }

  try {
    const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Run lightweight query against eip_compliance_validations table
    // Treat 42P01 (table missing) as connectivity success
    const { error } = await supabase
      .from('eip_compliance_validations')
      .select('id')
      .limit(1);

    if (error) {
      // PostgreSQL error code 42P01 = undefined_table
      if (error.code === '42P01') {
        return { available: true };
      }
      return {
        available: false,
        error: `Query failed: ${error.message} (code: ${error.code})`
      };
    }

    return { available: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      error: `Connection failed: ${errorMessage}`
    };
  }
}

// ============================================================================
// REDIS PREFLIGHT CHECK
// ============================================================================

/**
 * Check Redis connectivity with dynamic import and constructor interop
 */
export async function checkRedisConnection(): Promise<PreflightResult> {
  const redisUrl = process.env.REDIS_URL || process.env.EIP_REDIS_URL;

  if (!redisUrl) {
    return {
      available: false,
      error: 'Neither REDIS_URL nor EIP_REDIS_URL is set'
    };
  }

  try {
    // Dynamic import with constructor interop: default ?? Redis ?? module
    const ioredisModule = await import('ioredis');
    const Redis = ioredisModule.default ?? ioredisModule.Redis ?? ioredisModule;

    if (!Redis) {
      return {
        available: false,
        error: 'ioredis module not found or has no default export'
      };
    }

    const redis = new Redis(redisUrl, {
      // Short timeouts for preflight check
      connectTimeout: 5000,
      commandTimeout: 3000
    });

    try {
      await redis.ping();
      return { available: true };
    } finally {
      await redis.quit();
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      error: `Redis connection failed: ${errorMessage}`
    };
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

/**
 * Run preflight check for both Supabase and Redis
 * Exits with code 1 if either backend is unavailable
 */
export async function runPreflightCheck(): Promise<void> {
  console.log('Running preflight checks...\n');

  const [supabaseResult, redisResult] = await Promise.all([
    checkSupabaseConnection(),
    checkRedisConnection()
  ]);

  console.log('Supabase:');
  if (supabaseResult.available) {
    console.log('  Status: Available');
  } else {
    console.log(`  Status: Unavailable - ${supabaseResult.error}`);
  }

  console.log('\nRedis:');
  if (redisResult.available) {
    console.log('  Status: Available');
  } else {
    console.log(`  Status: Unavailable - ${redisResult.error}`);
  }

  console.log('');

  // Exit with code 1 if either backend is unavailable
  if (!supabaseResult.available || !redisResult.available) {
    console.error('Preflight check failed: One or more backends unavailable');
    process.exit(1);
  }

  console.log('All preflight checks passed!');
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

// Run if executed directly (not imported as module)
if (require.main === module) {
  runPreflightCheck().catch((err) => {
    console.error('Unexpected error during preflight check:', err);
    process.exit(1);
  });
}
