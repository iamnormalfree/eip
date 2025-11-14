// ABOUTME: Redis-based event cache for conversation turn events.
// ABOUTME: Manages ephemeral event storage with 1-hour TTL for real-time processing.

import Redis from 'ioredis';

// Type definition for turn events
export interface TurnEvent {
  eventType: string;
  payload: unknown;
  timestamp: Date;
  source: 'webhook' | 'direct';
  ablyEventId: string | null;
}

// Singleton Redis client (reuse across invocations)
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }
  return redisClient;
}

/**
 * Generate Redis key for conversation events
 */
function getEventKey(conversationUuid: string): string {
  return `conversation:${conversationUuid}:events`;
}

/**
 * Append event to conversation's event cache
 * @param conversationUuid - UUID of conversation
 * @param event - Turn event to append
 */
export async function appendEvent(
  conversationUuid: string,
  event: TurnEvent
): Promise<void> {
  const redis = getRedisClient();
  const key = getEventKey(conversationUuid);
  
  // Serialize event (convert Date to ISO string)
  const serializedEvent = JSON.stringify({
    ...event,
    timestamp: event.timestamp.toISOString()
  });
  
  // Append to list (right push)
  await redis.rpush(key, serializedEvent);
  
  // Set TTL to 1 hour (3600 seconds)
  await redis.expire(key, 3600);
}

/**
 * Get recent events from conversation cache
 * @param conversationUuid - UUID of conversation
 * @param limit - Maximum number of events to retrieve
 * @returns Array of turn events in chronological order
 */
export async function getRecentEvents(
  conversationUuid: string,
  limit: number
): Promise<TurnEvent[]> {
  const redis = getRedisClient();
  const key = getEventKey(conversationUuid);
  
  // Get last N items from list (negative indices: -limit to -1)
  const serializedEvents = await redis.lrange(key, -limit, -1);
  
  // Parse and deserialize events
  return serializedEvents.map((serialized) => {
    const parsed = JSON.parse(serialized);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
  });
}

/**
 * Trim old events from conversation cache
 * @param conversationUuid - UUID of conversation
 * @param maxAge - Maximum age in seconds
 * @returns Number of events trimmed
 */
export async function trimOldEvents(
  conversationUuid: string,
  maxAge: number
): Promise<number> {
  const redis = getRedisClient();
  const key = getEventKey(conversationUuid);
  
  // Get total count
  const totalCount = await redis.llen(key);
  if (totalCount === 0) return 0;
  
  // Get all events to check timestamps
  const serializedEvents = await redis.lrange(key, 0, -1);
  
  const now = Date.now();
  const maxAgeMs = maxAge * 1000;
  
  // Find index of first event within max age
  let firstValidIndex = 0;
  for (let i = 0; i < serializedEvents.length; i++) {
    const event = JSON.parse(serializedEvents[i]);
    const eventAge = now - new Date(event.timestamp).getTime();
    
    if (eventAge <= maxAgeMs) {
      firstValidIndex = i;
      break;
    }
  }
  
  // If all events are old, delete the key
  if (firstValidIndex === 0 && serializedEvents.length > 0) {
    const firstEvent = JSON.parse(serializedEvents[0]);
    const firstEventAge = now - new Date(firstEvent.timestamp).getTime();
    
    if (firstEventAge > maxAgeMs) {
      // All events are too old
      await redis.del(key);
      return totalCount;
    }
  }
  
  // Trim old events if any exist
  if (firstValidIndex > 0) {
    await redis.ltrim(key, firstValidIndex, -1);
    return firstValidIndex;
  }
  
  return 0;
}
