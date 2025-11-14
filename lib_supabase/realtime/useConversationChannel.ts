// ABOUTME: React hook for subscribing to real-time conversation events via Ably
// ABOUTME: Handles token fetching with email hash auth, connection lifecycle, and event callbacks

import { useEffect, useState, useCallback, useRef } from 'react';
import { Realtime } from 'ably';
import { isRealtimeEnabled } from '../utils/feature-flags';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface MessageEvent {
  type: 'message:user' | 'message:ai';
  data: any;
}

interface UseConversationChannelOptions {
  conversationId: string;
  onMessage?: (event: MessageEvent) => void;
  onTyping?: (isTyping: boolean, actor: string) => void;
  onSLA?: (event: any) => void;
  onHandoff?: (event: any) => void;
  enabled?: boolean;
}

interface UseConversationChannelResult {
  connectionState: ConnectionState;
  publishTyping: () => void;
  publishTypingStop: () => void;
  conversationUuid: string | null;
  error: Error | null;
}

export function useConversationChannel(
  options: UseConversationChannelOptions
): UseConversationChannelResult {
  const { conversationId, enabled, onMessage, onTyping, onSLA, onHandoff } = options;
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [ablyClient, setAblyClient] = useState<Realtime | null>(null);
  const [conversationUuid, setConversationUuid] = useState<string | null>(null);

  // Use ref to hold Ably client for cleanup (avoids stale closure in cleanup function)
  const ablyClientRef = useRef<Realtime | null>(null);

  useEffect(() => {
    // Check if realtime is enabled (global flag + options override)
    const shouldConnect = enabled !== undefined ? enabled : isRealtimeEnabled();

    if (!shouldConnect) {
      return;
    }

    // Fetch Ably token and initialize client
    const fetchTokenAndConnect = async () => {
      setConnectionState('connecting');

      try {
        // Try to get email from localStorage first (normal form submission flow)
        let email = localStorage.getItem('lead_email');
        let emailHash: string | null = null;

        // Fallback: If no email in localStorage, try to fetch hash from session API
        // This handles resume link scenario on new device/browser
        if (!email) {
          console.warn('⚠️ Email not in localStorage, attempting to fetch hash from session');

          try {
            const sessionResponse = await fetch(
              `/api/auth/session-email?conversation=${conversationId}`
            );

            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              // Session API now returns hash directly (security fix - no PII exposure)
              emailHash = sessionData.emailHash;

              console.log('✅ Email hash retrieved from session API');
            } else {
              console.error('❌ Session email hash fetch failed:', sessionResponse.status);
            }
          } catch (sessionError) {
            console.error('❌ Error fetching session email hash:', sessionError);
          }
        }

        // If we have email from localStorage, hash it client-side
        // If we have hash from session API, use it directly
        if (email) {
          // Hash email client-side for authentication (matches server-side SHA-256)
          const encoder = new TextEncoder();
          const data = encoder.encode(email.toLowerCase().trim());
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          emailHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Final check: If still no hash after all fallbacks, we can't authenticate
        if (!emailHash) {
          throw new Error(
            'Unable to authenticate Ably connection. Please refresh and re-submit form.'
          );
        }
        
        // Fetch Ably token with email hash for auth
        const response = await fetch('/api/chat/ably-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            conversationId: parseInt(conversationId, 10),
            emailHash 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get Ably token');
        }

        const tokenData = await response.json();
        const { token, conversationUuid: uuid } = tokenData;

        // Initialize Ably Realtime client with token
        const client = new Realtime({ token });
        ablyClientRef.current = client;  // Store in ref for cleanup
        setAblyClient(client);  // Store in state for callbacks
        setConversationUuid(uuid);

        // Subscribe to conversation channel
        const channel = client.channels.get(`conversation:${uuid}`);
        channel.subscribe((message: any) => {
          // Handle different event types
          const eventName = message.name;
          const eventData = message.data;

          if (eventName === 'message:user' || eventName === 'message:ai') {
            if (onMessage) {
              onMessage({
                type: eventName,
                data: eventData,
              });
            }
          } else if (eventName.startsWith('typing:')) {
            const isTyping = eventName === 'typing:start';
            const actor = eventData?.actor || 'unknown';
            if (onTyping) {
              onTyping(isTyping, actor);
            }
          } else if (eventName.startsWith('sla:')) {
            if (onSLA) {
              onSLA(eventData);
            }
          } else if (eventName.startsWith('handoff:')) {
            if (onHandoff) {
              onHandoff(eventData);
            }
          }
        });

        setConnectionState('connected');

      } catch (err) {
        setConnectionState('failed');
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    fetchTokenAndConnect();

    // Cleanup function - uses ref to avoid stale closure
    return () => {
      if (ablyClientRef.current) {
        ablyClientRef.current.close();
        ablyClientRef.current = null;
      }
    };
  }, [conversationId, enabled, onMessage, onTyping, onSLA, onHandoff]);

  const publishTyping = useCallback(() => {
    if (ablyClient && conversationUuid) {
      const channel = ablyClient.channels.get(`conversation:${conversationUuid}`);
      channel.publish('typing:start', {
        timestamp: Date.now(),
        actor: 'user',
      });
    }
  }, [ablyClient, conversationUuid]);

  const publishTypingStop = useCallback(() => {
    if (ablyClient && conversationUuid) {
      const channel = ablyClient.channels.get(`conversation:${conversationUuid}`);
      channel.publish('typing:stop', {
        timestamp: Date.now(),
        actor: 'user',
      });
    }
  }, [ablyClient, conversationUuid]);

  return {
    connectionState,
    publishTyping,
    publishTypingStop,
    conversationUuid,
    error,
  };
}
