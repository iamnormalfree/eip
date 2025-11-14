// ABOUTME: Distributed rate limiting using Railway Redis (ioredis)
// ABOUTME: Replaces Vercel KV for Railway deployment compatibility

import Redis from 'ioredis';

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  reset?: number;
  retryAfter?: number;
}

let redisClient: Redis | null = null;

/**
 * Get or create Redis client for rate limiting
 * Parses REDIS_URL directly for ioredis compatibility
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required for rate limiting');
    }

    // Parse Redis URL
    const url = new URL(redisUrl);

    redisClient = new Redis({
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username === 'default' ? undefined : url.username,
      tls: process.env.NODE_ENV === 'production' && url.protocol === 'rediss:' ? {} : undefined,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('❌ Rate limiter Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 1000);
      },
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
    });

    redisClient.on('error', (error) => {
      console.error('❌ Rate limiter Redis error:', error);
    });

    redisClient.on('connect', () => {
      console.log('✅ Rate limiter Redis connected');
    });
  }

  return redisClient;
}

/**
 * Check distributed rate limit using Railway Redis
 *
 * @param key - Rate limit key (e.g., "ably-token:192.168.1.1")
 * @param limit - Max requests allowed in window
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result with allowed status
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const fullKey = `rate-limit:${key}`;

  try {
    const redis = getRedisClient();

    // Increment counter (atomic operation)
    const count = await redis.incr(fullKey);

    // Set TTL on first request (window duration)
    if (count === 1) {
      await redis.expire(fullKey, windowSeconds);
    }

    // Check if limit exceeded
    if (count > limit) {
      const ttl = await redis.ttl(fullKey);
      const retryAfter = Math.max(ttl, 1);

      return {
        allowed: false,
        remaining: 0,
        reset: Date.now() + (retryAfter * 1000),
        retryAfter
      };
    }

    // Get TTL for reset time
    const ttl = await redis.ttl(fullKey);

    return {
      allowed: true,
      remaining: limit - count,
      reset: Date.now() + (ttl * 1000)
    };

  } catch (error) {
    // Fail open: If Redis is down, allow the request
    // (Primary security is email hash authentication)
    console.error('⚠️ Rate limit check failed (allowing request):', error);
    return { allowed: true };
  }
}

/**
 * Ably token endpoint rate limiter
 * 10 requests per minute per IP address
 *
 * @param clientIp - Client IP address
 * @returns Rate limit result
 */
export async function checkAblyTokenRateLimit(clientIp: string): Promise<RateLimitResult> {
  return checkRateLimit(`ably-token:${clientIp}`, 10, 60);
}

/**
 * Close Redis connection (call during shutdown)
 */
export async function closeRateLimiter(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Rate limiter Redis connection closed');
  }
}
