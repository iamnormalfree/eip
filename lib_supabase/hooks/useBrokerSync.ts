// ABOUTME: React hook for synchronizing broker name from Chatwoot messages and API fallback

import { useEffect, useState } from 'react';

interface Message {
  id: number;
  content: string;
  role?: 'user' | 'agent' | 'system';
  message_type: 'incoming' | 'outgoing' | 'activity' | 0 | 1 | 2;
  created_at: string;
  sender?: {
    name: string;
    type: 'contact' | 'agent' | 'bot';
  };
  private: boolean;
}

interface UseBrokerSyncOptions {
  conversationId: number;
  messages: Message[];
  initialBrokerName?: string;
}

export function useBrokerSync({
  conversationId,
  messages,
  initialBrokerName = 'AI Mortgage Advisor'
}: UseBrokerSyncOptions) {
  const [brokerName, setBrokerName] = useState(initialBrokerName);
  const [lastSyncedMessage, setLastSyncedMessage] = useState<number>(0);

  // Method 1: Extract broker from activity/greeting messages
  useEffect(() => {
    if (messages.length === 0 || messages.length === lastSyncedMessage) return;

    // Check recent messages (only new ones since last sync)
    const newMessages = messages.slice(lastSyncedMessage);

    for (const msg of newMessages) {
      // Pattern 1: Activity messages
      // Matches both formats:
      // - "🤝 Sarah Wong has joined the conversation" (broker-worker)
      // - "Sarah Wong joined the conversation." (broker-engagement-manager)
      if (msg.message_type === 'activity' || msg.message_type === 2) {
        const joinMatch = msg.content?.match(/(?:🤝\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:has\s+)?joined/);
        if (joinMatch) {
          console.log('🔄 Broker detected from activity:', joinMatch[1]);
          setBrokerName(joinMatch[1]);
          setLastSyncedMessage(messages.length);
          return;
        }
      }

      // Pattern 2: Greeting messages - extract from content only
      // Note: Don't trust sender.name metadata - Chatwoot returns contact name for agent messages
      if (msg.role === 'agent' || msg.message_type === 1 || msg.message_type === 'outgoing') {
        const greetingMatch = msg.content?.match(/I'm\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (greetingMatch) {
          console.log('🔄 Broker detected from greeting:', greetingMatch[1]);
          setBrokerName(greetingMatch[1]);
          setLastSyncedMessage(messages.length);
          return;
        }
      }
    }

    setLastSyncedMessage(messages.length);
  }, [messages, lastSyncedMessage]);

  // Method 2: Fallback API call (only if broker still matches initial value after 5 seconds)
  useEffect(() => {
    if (brokerName !== initialBrokerName) return; // Already synced

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/brokers/conversation/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.broker?.name) {
            console.log('🔄 Broker detected from API fallback:', data.broker.name);
            setBrokerName(data.broker.name);
          }
        }
      } catch (error) {
        console.error('Broker sync fallback error:', error);
      }
    }, 5000); // Wait 5 seconds for messages before polling

    return () => clearTimeout(timer);
  }, [conversationId, brokerName, initialBrokerName]);

  return { brokerName, setBrokerName };
}
