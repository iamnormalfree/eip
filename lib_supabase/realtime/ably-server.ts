// ABOUTME: Server-side Ably REST client for publishing real-time events.
// ABOUTME: Singleton pattern ensures single connection, publishes to conversation:{uuid} channels.

import * as Ably from 'ably';
import { validateAblyConfig } from './ably-config';

let ablyServerInstance: Ably.Rest | null = null;

/**
 * Get or create singleton Ably REST client instance
 * @returns {Ably.Rest} Ably REST client
 * @throws {Error} If ABLY_API_KEY is not configured
 */
export function getAblyServer(): Ably.Rest {
  if (!ablyServerInstance) {
    // Validate configuration before creating client
    validateAblyConfig();
    
    ablyServerInstance = new Ably.Rest({
      key: process.env.ABLY_API_KEY!,
    });
  }
  
  return ablyServerInstance;
}

/**
 * Publish an event to a conversation channel
 * @param conversationUuid - UUID of the conversation
 * @param eventType - Type of event (e.g., 'message.new', 'typing.start')
 * @param payload - Event payload data
 * @throws {Error} If publish fails or configuration is invalid
 */
export async function publishEvent(
  conversationUuid: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const client = getAblyServer();
  const channelName = `conversation:${conversationUuid}`;
  const channel = client.channels.get(channelName);
  
  try {
    await channel.publish(eventType, payload);
    console.log(`[Ably] Published ${eventType} to ${channelName}`);
  } catch (error) {
    console.error(`[Ably] Failed to publish ${eventType} to ${channelName}:`, error);
    throw error;
  }
}
