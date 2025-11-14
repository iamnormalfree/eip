/**
 * Message Tracking Utility for Bot Message Echo Detection
 * Shared cache and utilities for preventing duplicate bot messages in Chatwoot
 *
 * Architecture: Dual-layer deduplication
 * - Layer 1: Send-side tracking (tracks when we send messages)
 * - Layer 2: Webhook-side echo detection (detects when Chatwoot echoes back)
 */

import { createHash } from 'crypto'

// Configuration constants
export const MESSAGE_FINGERPRINT_TTL = 10 * 60 * 1000 // 10 minutes
export const BOT_MESSAGE_CACHE_TTL = 15 * 60 * 1000 // 15 minutes
export const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
export const MAX_BOT_MESSAGES_PER_CONVERSATION = 10 // LRU limit for content hashes
export const MAX_MESSAGE_IDS_PER_CONVERSATION = 20 // Max message IDs to track

// Bot message cache structure
export interface BotMessageCache {
  content: string[] // LRU list of content hashes (max 10)
  messageIds: Set<string> // Set of message IDs (max 20)
  timestamp: number // Last activity timestamp for TTL
}

// Conversation timestamps for TTL tracking
interface ConversationTimestamps {
  lastActivity: number
}

// Cache storage
export const botMessageTracker = new Map<number, BotMessageCache>()
const conversationTimestamps = new Map<number, ConversationTimestamps>()

/**
 * Normalize message content for consistent hashing
 * - Trim whitespace
 * - Lowercase
 * - Collapse multiple spaces
 * - Normalize line breaks
 */
function normalizeContent(content: string): string {
  return content
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\r\n/g, '\n') // Normalize line breaks
}

/**
 * Generate a unique fingerprint for a message
 * Format: {conversationId}-{16-char hex hash}
 * Hash includes: conversationId, messageType, normalized content
 */
export function generateMessageFingerprint(
  conversationId: number,
  content: string,
  messageType: string | number
): string {
  const normalized = normalizeContent(content)
  const composite = `${conversationId}:${messageType}:${normalized}`

  const hash = createHash('sha256')
    .update(composite)
    .digest('hex')
    .substring(0, 16) // 16-char hex for compact storage

  return `${conversationId}-${hash}`
}

/**
 * Track a bot message for echo detection
 * Called after successfully sending a message to Chatwoot
 *
 * @param conversationId - Chatwoot conversation ID
 * @param content - Message content (raw, will be normalized internally)
 * @param messageId - Message ID from Chatwoot response (optional)
 */
export function trackBotMessage(
  conversationId: number,
  content: string,
  messageId?: string
): void {
  try {
    // Get or create cache for this conversation
    let cache = botMessageTracker.get(conversationId)
    if (!cache) {
      cache = {
        content: [],
        messageIds: new Set<string>(),
        timestamp: Date.now()
      }
      botMessageTracker.set(conversationId, cache)
    }

    // Update timestamp
    cache.timestamp = Date.now()

    // Track content hash (LRU eviction)
    const normalized = normalizeContent(content)
    const contentHash = createHash('sha256')
      .update(normalized)
      .digest('hex')
      .substring(0, 16)

    // Add to content array (LRU)
    cache.content.push(contentHash)

    // Evict oldest if exceeds limit
    if (cache.content.length > MAX_BOT_MESSAGES_PER_CONVERSATION) {
      cache.content.shift() // Remove oldest
    }

    // Track message ID if provided
    if (messageId) {
      cache.messageIds.add(messageId)

      // Limit message ID set size
      if (cache.messageIds.size > MAX_MESSAGE_IDS_PER_CONVERSATION) {
        // Convert to array, remove oldest, convert back to set
        const idsArray = Array.from(cache.messageIds)
        idsArray.shift() // Remove oldest
        cache.messageIds = new Set(idsArray)
      }
    }

    // Update conversation timestamp
    conversationTimestamps.set(conversationId, {
      lastActivity: Date.now()
    })

    console.log('📝 Tracked bot message for echo detection:', {
      conversationId,
      contentHash,
      messageId: messageId || 'none',
      cacheSize: cache.content.length,
      messageIdCount: cache.messageIds.size
    })
  } catch (error) {
    console.error('❌ Error tracking bot message:', error)
    // Non-blocking - don't throw, just log
  }
}

/**
 * Check if a message is an echo of a previously sent bot message
 * Returns true if this message matches a tracked bot message
 *
 * Detection methods:
 * 1. Message ID match (fastest, most precise)
 * 2. Content hash match (fallback if ID missing)
 *
 * @param conversationId - Chatwoot conversation ID
 * @param content - Message content from webhook
 * @param messageId - Message ID from webhook (optional)
 * @returns true if message is an echo, false otherwise
 */
export function checkIfEcho(
  conversationId: number,
  content: string,
  messageId?: string
): boolean {
  try {
    const cache = botMessageTracker.get(conversationId)

    // No cache = not an echo
    if (!cache) {
      return false
    }

    // Method 1: Check message ID (if provided)
    if (messageId && cache.messageIds.has(messageId)) {
      console.log('🔍 Echo detected via message ID:', {
        conversationId,
        messageId
      })
      return true
    }

    // Method 2: Check content hash
    const normalized = normalizeContent(content)
    const contentHash = createHash('sha256')
      .update(normalized)
      .digest('hex')
      .substring(0, 16)

    if (cache.content.includes(contentHash)) {
      console.log('🔍 Echo detected via content hash:', {
        conversationId,
        contentHash,
        // Note: If echo detected by content instead of ID, indicates possible race condition
        detectionMethod: messageId ? 'content_fallback' : 'content_only'
      })
      return true
    }

    // Not an echo
    return false
  } catch (error) {
    console.error('❌ Error checking for echo:', error)
    // On error, assume not an echo (fail open)
    return false
  }
}

/**
 * Cache cleanup - removes expired conversations
 * Runs on interval to prevent unbounded memory growth
 */
function cleanupExpiredCaches(): void {
  try {
    const now = Date.now()
    let cleanedBotCaches = 0
    let cleanedTimestamps = 0

    // Clean bot message caches (15-min TTL)
    // Convert to array to avoid iterator issues
    const botCacheEntries = Array.from(botMessageTracker.entries())
    for (const [conversationId, cache] of botCacheEntries) {
      if (now - cache.timestamp > BOT_MESSAGE_CACHE_TTL) {
        botMessageTracker.delete(conversationId)
        cleanedBotCaches++
      }
    }

    // Clean conversation timestamps (match bot cache TTL)
    // Convert to array to avoid iterator issues
    const timestampEntries = Array.from(conversationTimestamps.entries())
    for (const [conversationId, timestamps] of timestampEntries) {
      if (now - timestamps.lastActivity > BOT_MESSAGE_CACHE_TTL) {
        conversationTimestamps.delete(conversationId)
        cleanedTimestamps++
      }
    }

    if (cleanedBotCaches > 0 || cleanedTimestamps > 0) {
      console.log('🧹 Cache cleanup completed:', {
        cleanedBotCaches,
        cleanedTimestamps,
        remainingConversations: botMessageTracker.size,
        memoryEstimateMB: (botMessageTracker.size * 2) / 1024 // Rough estimate: ~2KB per conversation
      })
    }
  } catch (error) {
    console.error('❌ Error during cache cleanup:', error)
  }
}

// Start cleanup interval
setInterval(cleanupExpiredCaches, CACHE_CLEANUP_INTERVAL)

console.log('✅ Message tracking utility initialized:', {
  fingerprintTTL: `${MESSAGE_FINGERPRINT_TTL / 1000}s`,
  botCacheTTL: `${BOT_MESSAGE_CACHE_TTL / 1000}s`,
  cleanupInterval: `${CACHE_CLEANUP_INTERVAL / 1000}s`,
  maxMessagesPerConv: MAX_BOT_MESSAGES_PER_CONVERSATION,
  maxMessageIds: MAX_MESSAGE_IDS_PER_CONVERSATION
})
