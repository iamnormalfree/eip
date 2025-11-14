import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { ProcessedLeadData } from '../integrations/chatwoot-client';
import { BrokerPersona } from '../calculations/broker-persona';
import { TimeoutError, withTimeout } from '@/lib/utils/async-timeout';

/**
 * BullMQ Job Data Structure
 *
 * INTEGRATION NOTES:
 * - ProcessedLeadData: from existing lib/integrations/chatwoot-client.ts
 * - BrokerPersona: from existing lib/calculations/broker-persona.ts
 * - Used by: broker-worker.ts to process conversations
 *
 * JOB TYPES:
 * - 'new-conversation': Initial broker greeting after form submission
 * - 'incoming-message': AI response to customer message
 */
export interface BrokerConversationJob {
  // Job type
  type: 'new-conversation' | 'incoming-message';

  // Identity
  conversationId: number;
  contactId: number;

  // Broker assignment (from existing broker-assignment.ts)
  brokerId?: string;
  brokerName?: string;

  // Context (from existing system)
  brokerPersona: BrokerPersona;  // From existing broker-persona.ts
  processedLeadData: ProcessedLeadData;  // From existing chatwoot-client.ts

  // Message details
  userMessage?: string;

  // Flags (from existing deduplication logic)
  isConversationReopen?: boolean;
  skipGreeting?: boolean;

  // SLA Timing Data (Phase 1 Day 1)
  timingData?: {
    messageId: string;
    queueAddTimestamp: number;
  };

  // Metadata
  timestamp?: number;
}

const TIMING_INSTRUMENTATION_TIMEOUT_MS =
  parseInt(process.env.BROKER_QUEUE_TIMING_TIMEOUT_MS || '100', 10);

/**
 * Lazy initialization for BullMQ queue instance
 *
 * IMPORTANT: Uses lazy initialization to prevent build-time execution.
 * Environment variables (REDIS_URL) are only available at runtime in Docker builds.
 *
 * INTEGRATION WITH EXISTING SYSTEMS:
 * - Jobs call existing functions from:
 *   - broker-assignment.ts (assignBestBroker, updateBrokerMetrics)
 *   - broker-availability.ts (markBrokerBusy, releaseBrokerCapacity)
 *   - broker-persona.ts (analyzeMessageUrgency)
 *   - chatwoot-client.ts (sendInitialMessage, updateConversationCustomAttributes)
 */
let _brokerQueue: Queue<BrokerConversationJob> | null = null;

export function getBrokerQueue(): Queue<BrokerConversationJob> {
  if (!_brokerQueue) {
    _brokerQueue = new Queue<BrokerConversationJob>(
      'broker-conversations',
      {
        connection: getRedisConnection(),
        // Note: High-throughput timing operations use pooled connections for better performance
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 86400, // 24 hours
            count: 1000,
          },
          removeOnFail: {
            age: 604800, // 7 days
          },
        },
      }
    );
  }
  return _brokerQueue;
}

/**
 * Lazy initialization for queue events (monitoring)
 */
let _brokerQueueEvents: QueueEvents | null = null;

export function getBrokerQueueEvents(): QueueEvents {
  if (!_brokerQueueEvents) {
    _brokerQueueEvents = new QueueEvents('broker-conversations', {
      // Note: Queue events use standard connection; timing ops use pooled connections
      connection: getRedisConnection(),
    });

    // Set up event handlers once
    _brokerQueueEvents.on('completed', ({ jobId }) => {
      console.log(`✅ Job completed: ${jobId}`);
    });

    _brokerQueueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job failed: ${jobId}`, failedReason);
    });

    _brokerQueueEvents.on('active', ({ jobId }) => {
      console.log(`🔄 Job started: ${jobId}`);
    });
  }
  return _brokerQueueEvents;
}

/**
 * Add new conversation to queue
 *
 * CALLED FROM:
 * - app/api/chatwoot-conversation/route.ts (after conversation creation)
 *
 * IMPORTANT: This function will be integrated into the existing conversation
 * creation flow alongside the current BrokerEngagementManager during the
 * gradual migration (Phase 4).
 */
export async function queueNewConversation(data: {
  conversationId: number;
  contactId: number;
  processedLeadData: ProcessedLeadData;
  isConversationReopen?: boolean;
  skipGreeting?: boolean;
}) {
  try {
    // Create unique job ID for deduplication and timing
    const timestamp = Date.now();
    const messageId = `conv-${data.conversationId}-${timestamp}`;
    const jobId = `new-conversation-${data.conversationId}-${timestamp}`;
    
    // Add timing data for SLA monitoring
    await addTimingDataToJob(data.conversationId, messageId, timestamp);

    // Determine priority based on lead score
    const priority = data.processedLeadData.leadScore > 75 ? 1 : 5;

    console.log(`📋 Queueing new conversation:`, {
      jobId,
      conversationId: data.conversationId,
      leadScore: data.processedLeadData.leadScore,
      brokerPersona: data.processedLeadData.brokerPersona.name,
      isReopen: data.isConversationReopen,
      skipGreeting: data.skipGreeting,
      priority,
    });

    const job = await getBrokerQueue().add(
      'new-conversation',
      {
        type: 'new-conversation',
        conversationId: data.conversationId,
        contactId: data.contactId,
        brokerPersona: data.processedLeadData.brokerPersona,
        processedLeadData: data.processedLeadData,
        userMessage: `Initial greeting for ${data.processedLeadData.name}`,
        isConversationReopen: data.isConversationReopen || false,
        skipGreeting: data.skipGreeting || false,
        timestamp,
        timingData: {
          messageId,
          queueAddTimestamp: timestamp,
        },
      },
      {
        jobId,
        priority,
        // Slight delay for new conversations to allow Chatwoot to settle
        delay: 500,
      }
    );

    console.log(`✅ New conversation queued successfully: ${job.id}`);

    return job;
  } catch (error) {
    console.error(`❌ Failed to queue new conversation ${data.conversationId}:`, error);
    throw error;
  }
}

/**
 * Add incoming message to queue
 *
 * CALLED FROM:
 * - app/api/chatwoot-webhook/route.ts (after echo detection)
 *
 * IMPORTANT: This function will be integrated into the webhook handler
 * alongside the current n8n forwarding during the gradual migration (Phase 4).
 */
export async function queueIncomingMessage(data: {
  conversationId: number;
  contactId: number;
  brokerId: string;
  brokerName: string;
  brokerPersona: BrokerPersona;
  processedLeadData: ProcessedLeadData;
  userMessage: string;
  messageId?: number;
}) {
  try {
    // Create unique job ID for deduplication and timing
    const timestamp = Date.now();
    const messageId = `conv-${data.conversationId}-${timestamp}`;
    const jobId = `incoming-message-${data.conversationId}-${data.messageId || timestamp}`;
    // Add timing data for SLA monitoring
    await addTimingDataToJob(data.conversationId, messageId, timestamp);

    console.log(`📋 Queueing incoming message:`, {
      jobId,
      conversationId: data.conversationId,
      brokerName: data.brokerName,
      messagePreview: data.userMessage.substring(0, 50) + '...',
    });

    const job = await getBrokerQueue().add(
      'incoming-message',
      {
        type: 'incoming-message',
        conversationId: data.conversationId,
        contactId: data.contactId,
        brokerId: data.brokerId,
        brokerName: data.brokerName,
        brokerPersona: data.brokerPersona,
        processedLeadData: data.processedLeadData,
        userMessage: data.userMessage,
        skipGreeting: true, // Never greet on incoming messages
        timestamp,
        timingData: {
          messageId,
          queueAddTimestamp: timestamp,
        },
      },
      {
        jobId,
        priority: 3, // Normal priority for incoming messages
      }
    );

    console.log(`✅ Incoming message queued successfully: ${job.id}`);

    return job;
  } catch (error) {
    console.error(`❌ Failed to queue incoming message ${data.conversationId}:`, error);
    throw error;
  }
}

/**
 * Get queue metrics for monitoring
 *
 * USED BY:
 * - app/api/health/route.ts (health checks)
 * - app/api/admin/migration-status/route.ts (migration dashboard)
 * - scripts/monitor-migration.ts (monitoring script)
 */
export async function getQueueMetrics() {
  try {
    const queue = getBrokerQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const metrics = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };

    // Alert on high failure rate
    if (failed > 10) {
      console.warn(`⚠️ High failure rate: ${failed} failed jobs`);
    }

    // Alert on queue backup
    if (waiting > 20) {
      console.warn(`⚠️ Queue backing up: ${waiting} jobs waiting`);
    }

    return metrics;
  } catch (error) {
    console.error('❌ Failed to get queue metrics:', error);
    return null;
  }
}

/**
 * Pause/resume queue for maintenance
 */
export async function pauseQueue() {
  await getBrokerQueue().pause();
  console.log('⏸️ Queue paused');
}

export async function resumeQueue() {
  await getBrokerQueue().resume();
  console.log('▶️ Queue resumed');
}

/**
 * Emergency: Drain all jobs (for rollback)
 */
export async function drainQueue() {
  await getBrokerQueue().drain();
  console.log('🚰 Queue drained');
}

// ============================================================================
// SLA TIMING TRACKING (Phase 1 Day 1 Integration)
// ============================================================================

/**
 * Timing data structure for SLA monitoring
 * Tracks hop-by-hop timing through the queue system
 */
export interface MessageTimingData {
  messageId: string;
  conversationId: number;
  queueAddTimestamp?: number;
  workerStartTimestamp?: number;
  workerCompleteTimestamp?: number;
  chatwootSendTimestamp?: number;
  totalDuration?: number;
  // AI Segment Instrumentation (Phase 2 Task 2.5)
  aiSegment?: {
    model?: string;
    promptLength?: number;
    responseLength?: number;
    orchestratorPath?: string; // 'dr-elena', 'direct-ai', 'fallback'
    aiStartTimestamp?: number;
    aiCompleteTimestamp?: number;
    aiProcessingTime?: number;
  };
}

/**
 * In-memory timing data store with Redis persistence
 */
const TIMING_DATA_KEY_PREFIX = 'timing:';
const TIMING_TTL = 3600; // 1 hour TTL

/**
 * Update timing data for SLA monitoring
 * Called by worker to track progress through the system
 */
export async function updateTimingData(
  conversationId: number,
  messageId: string,
  updates: Partial<MessageTimingData>
): Promise<void> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    const key = `${TIMING_DATA_KEY_PREFIX}${conversationId}:${messageId}`;

    // Get existing timing data
    const existing = await redis.hgetall(key);
    const timingData: MessageTimingData = {
      messageId,
      conversationId,
      queueAddTimestamp: existing.queueAddTimestamp ? parseInt(existing.queueAddTimestamp) : undefined,
      workerStartTimestamp: existing.workerStartTimestamp ? parseInt(existing.workerStartTimestamp) : undefined,
      workerCompleteTimestamp: existing.workerCompleteTimestamp ? parseInt(existing.workerCompleteTimestamp) : undefined,
      chatwootSendTimestamp: existing.chatwootSendTimestamp ? parseInt(existing.chatwootSendTimestamp) : undefined,
      totalDuration: existing.totalDuration ? parseInt(existing.totalDuration) : undefined,
    };

    // Apply updates
    Object.assign(timingData, updates);

    // Calculate total duration - prioritize end-to-end delivery time when available
    if (timingData.queueAddTimestamp) {
      if (timingData.chatwootSendTimestamp) {
        // Full end-to-end: queue → Chatwoot delivered
        timingData.totalDuration = timingData.chatwootSendTimestamp - timingData.queueAddTimestamp;
      } else if (timingData.workerCompleteTimestamp) {
        // Partial: queue → worker finished (fallback while Chatwoot pending)
        timingData.totalDuration = timingData.workerCompleteTimestamp - timingData.queueAddTimestamp;
      }
    }

    // Store updated data
    const pipeline = redis.pipeline();
    pipeline.hset(key, timingData as any);
    pipeline.expire(key, TIMING_TTL);
    await pipeline.exec();

    await redis.quit();
    
    console.log(`⏱️ Timing data updated for ${conversationId}:${messageId}`, {
      phase: Object.keys(updates)[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to update timing data:', error);
    // Non-critical - don't throw errors
  }
}

/**
 * Get timing data for monitoring and SLA analysis
 */
export async function getTimingData(
  conversationId: number,
  messageId: string
): Promise<MessageTimingData | null> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    const key = `${TIMING_DATA_KEY_PREFIX}${conversationId}:${messageId}`;

    const data = await redis.hgetall(key);
    await redis.quit();

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      messageId,
      conversationId,
      queueAddTimestamp: data.queueAddTimestamp ? parseInt(data.queueAddTimestamp) : undefined,
      workerStartTimestamp: data.workerStartTimestamp ? parseInt(data.workerStartTimestamp) : undefined,
      workerCompleteTimestamp: data.workerCompleteTimestamp ? parseInt(data.workerCompleteTimestamp) : undefined,
      chatwootSendTimestamp: data.chatwootSendTimestamp ? parseInt(data.chatwootSendTimestamp) : undefined,
      totalDuration: data.totalDuration ? parseInt(data.totalDuration) : undefined,
    };
  } catch (error) {
    console.error('❌ Failed to get timing data:', error);
    return null;
  }
}

/**
 * Get SLA timing data for multiple conversations (for analysis endpoint)
 */
export async function getSLATimingData(
  conversationId?: number
): Promise<MessageTimingData[]> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());

    const timingDataList: MessageTimingData[] = [];
    let keys: string[] = [];
    let cursor = '0';

    // Use SCAN instead of KEYS to avoid blocking Redis event loop
    const scanPattern = conversationId
      ? `${TIMING_DATA_KEY_PREFIX}${conversationId}:*`
      : `${TIMING_DATA_KEY_PREFIX}*`;

    do {
      try {
        const result = await redis.scan(cursor, 'MATCH', scanPattern, 'COUNT', 100);
        cursor = result[0];
        keys = result[1];

        for (const key of keys) {
          try {
            const data = await redis.hgetall(key);
            if (data && Object.keys(data).length > 0) {
              const [convId, msgId] = key.replace(TIMING_DATA_KEY_PREFIX, '').split(':');
              timingDataList.push({
                messageId: msgId,
                conversationId: parseInt(convId),
                queueAddTimestamp: data.queueAddTimestamp ? parseInt(data.queueAddTimestamp) : undefined,
                workerStartTimestamp: data.workerStartTimestamp ? parseInt(data.workerStartTimestamp) : undefined,
                workerCompleteTimestamp: data.workerCompleteTimestamp ? parseInt(data.workerCompleteTimestamp) : undefined,
                chatwootSendTimestamp: data.chatwootSendTimestamp ? parseInt(data.chatwootSendTimestamp) : undefined,
                totalDuration: data.totalDuration ? parseInt(data.totalDuration) : undefined,
              });
            }
          } catch (dataError) {
            console.error(`❌ Error processing timing key ${key}:`, dataError);
            // Continue processing other keys
          }
        }

        // Limit results to prevent memory issues
        if (timingDataList.length >= 100) {
          console.log(`⚠️ Limiting timing data to 100 entries for performance`);
          break;
        }

      } catch (scanError) {
        console.error('❌ Redis SCAN error:', scanError);
        break;
      }
    } while (cursor !== '0');

    await redis.quit();
    return timingDataList;
  } catch (error) {
    console.error('❌ Failed to get SLA timing data:', error);
    return [];
  }
}

/**
 * Add timing data to job when queueing
 */
async function addTimingDataToJob(
  conversationId: number,
  messageId: string,
  queueAddTimestamp: number
): Promise<void> {
  const Redis = require('ioredis');
  const redis = new Redis(getRedisConnection());
  const key = `${TIMING_DATA_KEY_PREFIX}${conversationId}:${messageId}`;
  let connectionClosed = false;

  try {
    await withTimeout(async () => {
      await redis.hset(key, {
        messageId,
        conversationId: conversationId.toString(),
        queueAddTimestamp: queueAddTimestamp.toString(),
      });
      await redis.expire(key, TIMING_TTL);
    }, TIMING_INSTRUMENTATION_TIMEOUT_MS, 'redis instrumentation');
  } catch (error) {
    if (typeof redis.disconnect === 'function' && redis.status !== 'end') {
      redis.disconnect();
      connectionClosed = true;
    }

    if (error instanceof TimeoutError) {
      console.error('❌ Redis instrumentation timed out while adding timing data:', error);
    } else {
      console.error('❌ Failed to add timing data to job:', error);
    }
    throw error;
  } finally {
    if (!connectionClosed) {
      try {
        await redis.quit();
      } catch (quitError) {
        if (typeof redis.disconnect === 'function') {
          redis.disconnect();
        }
        console.error('❌ Failed to close Redis connection after timing instrumentation:', quitError);
      }
    }
  }
}

/**
 * Get breakdown of failed jobs by error type
 *
 * Used by admin endpoint and monitoring to identify failure patterns
 *
 * Integration contracts (from synthesis):
 * - Error types from lib/queue/broker-worker-errors.ts
 * - Returns aggregated counts by error type for monitoring dashboard
 */
export async function getFailedJobsBreakdown(): Promise<{
  total: number;
  byErrorType: Record<string, number>;
}> {
  try {
    const queue = getBrokerQueue();
    const failedJobs = await queue.getFailed(0, 100); // Get last 100 failed jobs

    const byErrorType: Record<string, number> = {};
    
    for (const job of failedJobs) {
      // Import error classifier
      const { classifyJobError } = await import('./broker-worker-errors');
      
      // Classify the error
      const classified = classifyJobError(new Error(job.failedReason || 'Unknown error'));
      const errorType = classified.type;
      
      // Increment counter
      byErrorType[errorType] = (byErrorType[errorType] || 0) + 1;
    }

    return {
      total: failedJobs.length,
      byErrorType,
    };
  } catch (error) {
    console.error('❌ Failed to get failed jobs breakdown:', error);
    throw error;
  }
}

// ============================================================================
// QUEUE STATUS HELPERS (for SSE waitlist streaming)
// ============================================================================

/**
 * Queue status response type for SSE streaming
 * Represents the current state of a conversation in the broker queue
 */
export interface QueueStatus {
  status: 'assigned' | 'waiting' | 'processing' | 'not_in_queue';
  conversationId: number | string;
  conversationUuid?: string;
  broker?: { id: string; name: string };
  position?: number;
  estimatedWaitMinutes?: number;
}

// Cache for average processing time (5 minute TTL)
let cachedAvgTime: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 300_000; // 5 minutes

/**
 * Get current queue status for a conversation
 *
 * Returns status of conversation in the broker assignment/queue system:
 * - 'assigned': Broker has been assigned to conversation
 * - 'waiting': Conversation in waiting queue, returns position and ETA
 * - 'processing': Conversation currently being processed (active job)
 * - 'not_in_queue': Conversation not found in queue system
 *
 * Called by: app/api/brokers/queue-stream/[conversationId]/route.ts (SSE polling)
 * Test: tests/unit/queue/broker-queue-status.test.ts
 */
export async function getQueueStatus(conversationId: string | number): Promise<QueueStatus> {
  try {
    // Keep conversationId as-is for matching with job data
    const convIdForMatching = conversationId;
    // But parse to number for the response if it's a string of digits
    const convIdForResponse = typeof conversationId === 'string' 
      ? (isNaN(parseInt(conversationId, 10)) ? conversationId : parseInt(conversationId, 10))
      : conversationId;

    // Fast path: check if broker already assigned
    try {
      const { getBrokerForConversation } = await import('../ai/broker-assignment');
      const assignedBroker = await getBrokerForConversation(convIdForResponse as number);
      
      if (assignedBroker) {
        return {
          status: 'assigned',
          conversationId: convIdForResponse,
          broker: {
            id: assignedBroker.id || '',
            name: assignedBroker.name || assignedBroker.brokerName || '',
          },
        };
      }
    } catch (error) {
      // If getBrokerForConversation fails (e.g., in test environment), continue to queue check
      console.debug(`Debug: getBrokerForConversation unavailable, checking queue...`);
    }

    const queue = getBrokerQueue();

    // Check active jobs (currently being processed)
    const activeJobs = await queue.getActive() || [];
    for (const job of activeJobs) {
      if (job.data?.conversationId === convIdForMatching) {
        return {
          status: 'processing',
          conversationId: convIdForResponse,
        };
      }
    }

    // Scan waiting jobs to find position
    const waitingJobs = await queue.getWaiting() || [];
    for (let i = 0; i < waitingJobs.length; i++) {
      const job = waitingJobs[i];
      
      // Guard against undefined job.data (pitfall #6)
      if (job.data?.conversationId === convIdForMatching) {
        const position = i + 1; // 1-indexed (pitfall #13)
        const avgProcessingTime = await getAverageProcessingTime();
        const estimatedWaitMinutes = Math.ceil((position * avgProcessingTime) / 60);

        return {
          status: 'waiting',
          conversationId: convIdForResponse,
          position,
          estimatedWaitMinutes,
        };
      }
    }

    // Not found in any queue state
    return {
      status: 'not_in_queue',
      conversationId: convIdForResponse,
    };
  } catch (error) {
    console.error(`Error getting queue status for ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Get average processing time for jobs in seconds
 *
 * Caches result for 5 minutes to avoid Redis load (pitfall #14)
 * Calculates from last 50 completed jobs
 * Returns 45 seconds default if no completed jobs found
 *
 * Called by: getQueueStatus (position estimation)
 * Test: tests/unit/queue/broker-queue-status.test.ts
 */
export async function getAverageProcessingTime(): Promise<number> {
  // Check cache (pitfall #14 - MUST cache)
  if (cachedAvgTime !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedAvgTime;
  }

  try {
    const queue = getBrokerQueue();
    const completedJobs = await queue.getCompleted(0, 50) || [];

    // No completed jobs - return default
    if (!completedJobs.length) {
      cachedAvgTime = 45;
      cacheTimestamp = Date.now();
      return cachedAvgTime;
    }

    // Calculate average processing time in seconds
    const totalMs = completedJobs.reduce((sum, job) => {
      return sum + ((job.finishedOn || 0) - (job.processedOn || 0));
    }, 0);
    
    const averageMs = totalMs / completedJobs.length;
    const averageSeconds = Math.max(1, Math.floor(averageMs / 1000)); // Enforce minimum 1 second

    // Cache the result
    cachedAvgTime = averageSeconds;
    cacheTimestamp = Date.now();

    return cachedAvgTime;
  } catch (error) {
    console.error('Error calculating average processing time:', error);
    // Return default on error
    return 45;
  }
}
