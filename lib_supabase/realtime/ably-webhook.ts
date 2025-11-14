// ABOUTME: Ably webhook signature verification and event processing.
// ABOUTME: Implements constant-time HMAC comparison to prevent timing attacks.

import { createHmac, timingSafeEqual } from 'crypto';
import { appendEvent, type TurnEvent } from './event-cache';
import { getSupabaseAdmin } from '../db/supabase-client';

/**
 * Ably webhook event structure
 */
export interface AblyWebhookEvent {
  id: string;
  name: string;
  timestamp: number;
  channelId: string;
  data: {
    name: string;
    data: unknown;
  };
}

/**
 * Verify Ably webhook signature using constant-time comparison
 * @param body - Raw request body string
 * @param signature - Signature from X-Ably-Signature header
 * @param signingKey - Ably webhook signing key from env
 * @returns True if signature is valid, false otherwise
 */
export async function verifyAblySignature(
  body: string,
  signature: string,
  signingKey: string
): Promise<boolean> {
  // Compute HMAC-SHA256 of body with signing key
  const hmac = createHmac('sha256', signingKey);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  
  // Convert to buffers for constant-time comparison
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);
  
  // Check length first (fast fail for different lengths)
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  
  // Use timingSafeEqual for constant-time comparison (prevents timing attacks)
  try {
    return timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    // timingSafeEqual throws if buffers have different lengths (shouldn't happen due to check above)
    return false;
  }
}

/**
 * Process Ably webhook event with dual persistence (Redis + Supabase)
 * @param event - Ably webhook event
 */
export async function processAblyEvent(event: AblyWebhookEvent): Promise<void> {
  // Extract conversation UUID from channelId (format: "conversation:{uuid}")
  const conversationUuid = event.channelId.replace('conversation:', '');
  
  // Extract event type from nested data
  const eventType = event.data.name;
  const payload = event.data.data;
  const timestamp = new Date(event.timestamp);
  const ablyEventId = event.id;
  
  // Build turn event
  const turnEvent: TurnEvent = {
    eventType,
    payload,
    timestamp,
    source: 'webhook',
    ablyEventId
  };
  
  // Dual persistence (synchronous writes for atomicity)
  // 1. Append to Redis (ephemeral cache, 1 hour TTL)
  await appendEvent(conversationUuid, turnEvent);
  
  // 2. Insert into Supabase (durable storage with idempotency)
  const supabase = getSupabaseAdmin();
  // Type assertion needed because database types may not be fully synced yet
  const { error } = await (supabase as any)
    .from('conversation_turn_events')
    .upsert({
      conversation_uuid: conversationUuid,
      event_type: eventType,
      payload: payload as Record<string, unknown>,
      timestamp: timestamp.toISOString(),
      source: 'webhook',
      ably_event_id: ablyEventId
    }, {
      onConflict: 'ably_event_id',  // Idempotency: skip if event ID already exists
      ignoreDuplicates: true
    });
  
  if (error) {
    console.error('[Ably Webhook] Failed to persist event to Supabase:', error);
    throw error;
  }
  
  console.log(`[Ably Webhook] Processed event ${ablyEventId} for conversation ${conversationUuid}`);
}
