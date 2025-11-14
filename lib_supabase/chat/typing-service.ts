// ABOUTME: Typing indicator service for real-time chat updates.
// ABOUTME: Publishes typing:start and typing:stop events via Ably.

import { publishEvent } from '../realtime/ably-server';
import { isRealtimeEnabled } from '../utils/feature-flags';

/**
 * Emit typing indicator (typing:start event)
 * @param conversationUuid - UUID of the conversation
 * @param actor - Who is typing ('user' or 'ai')
 */
export async function emitTyping(
  conversationUuid: string,
  actor: 'user' | 'ai'
): Promise<void> {
  if (!isRealtimeEnabled()) {
    return; // Skip if real-time is disabled
  }

  try {
    await publishEvent(conversationUuid, 'typing:start', {
      actor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Non-blocking: Log error but don't throw
    console.error('Failed to publish typing:start event (non-blocking):', error);
  }
}

/**
 * Stop typing indicator (typing:stop event)
 * @param conversationUuid - UUID of the conversation
 * @param actor - Who stopped typing ('user' or 'ai')
 */
export async function stopTyping(
  conversationUuid: string,
  actor: 'user' | 'ai'
): Promise<void> {
  if (!isRealtimeEnabled()) {
    return; // Skip if real-time is disabled
  }

  try {
    await publishEvent(conversationUuid, 'typing:stop', {
      actor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Non-blocking: Log error but don't throw
    console.error('Failed to publish typing:stop event (non-blocking):', error);
  }
}
