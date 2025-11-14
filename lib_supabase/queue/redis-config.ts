import { ConnectionOptions } from 'bullmq';

/**
 * Redis connection configuration for BullMQ
 * Supports Railway, Upstash, and local Redis
 *
 * INTEGRATION NOTES:
 * - Used by: broker-queue.ts, broker-worker.ts
 * - Environment variable: REDIS_URL (required)
 * - See: docs/ENVIRONMENT_SETUP.md for setup instructions
 */
export function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required. See docs/ENVIRONMENT_SETUP.md');
  }

  try {
    const url = new URL(redisUrl);

    const config: ConnectionOptions = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username === 'default' ? undefined : url.username,

      // Railway/Production: Enable TLS
      tls: process.env.NODE_ENV === 'production' && url.protocol === 'rediss:'
        ? {}
        : undefined,

      // BullMQ requirement
      maxRetriesPerRequest: null,

      // Connection resilience
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('❌ Redis connection failed after 10 retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 3000); // Max 3 seconds
        console.log(`⚠️ Redis retry ${times}, waiting ${delay}ms`);
        return delay;
      },

      // Keep-alive
      enableOfflineQueue: true,
      connectTimeout: 10000,
      keepAlive: 30000,
    };

    console.log('✅ Redis configuration loaded:', {
      host: config.host,
      port: config.port,
      tls: !!config.tls,
      env: process.env.NODE_ENV
    });

    return config;
  } catch (error) {
    console.error('❌ Invalid REDIS_URL format:', error);
    throw new Error('Invalid REDIS_URL. Format: redis://[username:password@]host:port');
  }
}

/**
 * Test Redis connection
 * Use this in health checks
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());

    await redis.ping();
    await redis.quit();

    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
}

// ============================================================================
// REDIS CONNECTION POOLING (Phase 1 Day 2 Queue Optimization)
// ============================================================================

/**
 * Redis connection pool for high-throughput queue operations
 * Supports increased worker concurrency (3→10) and rate limits (10→30/sec)
 */

interface RedisPoolConfig {
  max: number;
  min: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
}

const DEFAULT_POOL_CONFIG: RedisPoolConfig = {
  // Scaled for 2x worker concurrency (15-20 workers) to support higher throughput
  max: 50, // Maximum 50 connections in pool
  min: 10,  // Minimum 10 connections always available
  acquireTimeoutMillis: 30000, // 30 seconds to acquire connection
  createTimeoutMillis: 5000,   // 5 seconds to create new connection
  destroyTimeoutMillis: 2000,  // 2 seconds to destroy connection
  idleTimeoutMillis: 30000,    // 30 seconds idle before destruction
  reapIntervalMillis: 1000,    // 1 second between cleanup runs
};

let connectionPool: any[] = [];
let poolIndex = 0;

/**
 * Get a Redis connection from the pool (round-robin)
 * Creates new connections if needed up to max pool size
 */
export function getPooledRedisConnection(): any {
  // Simple round-robin connection selection
  if (connectionPool.length === 0) {
    createInitialPool();
  }
  
  const connection = connectionPool[poolIndex % connectionPool.length];
  poolIndex++;
  
  // Basic health check
  if (connection.status !== 'ready') {
    console.warn('⚠️ Redis connection not ready, using fallback');
    return createNewConnection();
  }
  
  return connection;
}

/**
 * Create initial pool of connections
 */
function createInitialPool(): void {
  const poolSize = Math.min(
    DEFAULT_POOL_CONFIG.min,
    DEFAULT_POOL_CONFIG.max
  );
  
  console.log(`🔗 Creating Redis connection pool (${poolSize} connections)`);
  
  for (let i = 0; i < poolSize; i++) {
    try {
      const connection = createNewConnection();
      connectionPool.push(connection);
    } catch (error) {
      console.error(`❌ Failed to create Redis connection ${i}:`, error);
    }
  }
  
  if (connectionPool.length === 0) {
    throw new Error('Failed to create any Redis connections');
  }
  
  console.log(`✅ Redis connection pool created with ${connectionPool.length} connections`);
}

/**
 * Create a new Redis connection with current config
 */
function createNewConnection(): any {
  const Redis = require('ioredis');
  const baseConfig = getRedisConnection();
  
  return new Redis({
    ...baseConfig,
    // Pool-specific optimizations
    lazyConnect: true,
    maxRetriesPerRequest: 3, // Reduced for pool connections
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxLoadingTimeout: 5000,
  });
}

/**
 * Close all connections in the pool
 * Called during graceful shutdown
 */
export async function closeRedisPool(): Promise<void> {
  console.log('🔌 Closing Redis connection pool...');
  
  const closePromises = connectionPool.map(async (connection, index) => {
    try {
      await connection.quit();
      console.log(`✅ Redis connection ${index} closed`);
    } catch (error) {
      console.error(`❌ Failed to close Redis connection ${index}:`, error);
    }
  });
  
  await Promise.allSettled(closePromises);
  connectionPool = [];
  console.log('✅ Redis connection pool closed');
}

/**
 * Get pool metrics for monitoring
 */
export function getRedisPoolMetrics(): {
  totalConnections: number;
  activeConnections: number;
  poolUtilization: number;
} {
  const activeConnections = connectionPool.filter(conn => 
    conn.status === 'ready'
  ).length;
  
  return {
    totalConnections: connectionPool.length,
    activeConnections,
    poolUtilization: connectionPool.length > 0 
      ? (activeConnections / connectionPool.length) * 100 
      : 0,
  };
}
