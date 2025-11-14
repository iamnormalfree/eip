'use client'

import { useEffect } from 'react'
import { compat } from '../utils/compat'

const CHAT_STORAGE_KEY = 'eip_chat_session'
const CHAT_STORAGE_VERSION = '1.0'

export interface ChatMessage {
  id: string
  role: 'user' | 'broker' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    dataPoints?: string[]
  }
}

export interface ChatSessionData {
  sessionId: string
  messages: ChatMessage[]
  version: string
  lastUpdated: string
}

/**
 * Persists chat messages to localStorage using single-write pattern
 * Ensures conversations survive viewport switches
 */
export function useChatSessionStorage(
  messages: ChatMessage[],
  sessionId: string
) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const sessionData: ChatSessionData = {
      sessionId,
      messages,
      version: CHAT_STORAGE_VERSION,
      lastUpdated: new Date().toISOString()
    }

    try {
      compat.setCanonical(
        `${CHAT_STORAGE_KEY}_${sessionId}`,
        JSON.stringify(sessionData),
        'localStorage'
      )
    } catch (error) {
      console.error('Failed to save chat session:', error)
    }
  }, [messages, sessionId])
}

/**
 * Retrieves chat messages from localStorage using dual-read pattern
 */
export function retrieveChatSession(sessionId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = compat.getWithAliases([`eip_chat_session_${sessionId}`, `nextnest_chat_session_${sessionId}`], 'localStorage')
    if (!stored) return []

    const parsed = JSON.parse(stored) as ChatSessionData

    // Check version compatibility
    if (parsed.version !== CHAT_STORAGE_VERSION) {
      console.warn('Chat session version mismatch')
      return []
    }

    // Restore Date objects
    return parsed.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  } catch (error) {
    console.error('Failed to retrieve chat session:', error)
    return []
  }
}

/**
 * Clears chat session from localStorage using single-write pattern
 */
export function clearChatSession(sessionId: string) {
  if (typeof window === 'undefined') return

  try {
    compat.setCanonical(`eip_chat_session_${sessionId}`, null, 'localStorage')
  } catch (error) {
    console.error('Failed to clear chat session:', error)
  }
}
