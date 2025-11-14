// ABOUTME: Reusable hook for Chatwoot conversation management - handles messages, polling, and sending

'use client'

import { useState, useEffect, useRef } from 'react'
import { sessionManager } from '../utils/session-manager'

interface Message {
  id: number
  content: string
  role?: 'user' | 'agent' | 'system'
  message_type: 'incoming' | 'outgoing' | 'activity' | 0 | 1 | 2  // Chatwoot returns both strings and numbers
  created_at: string
  sender?: {
    name: string
    avatar_url?: string
    type: 'contact' | 'agent' | 'bot'
  }
  private: boolean
  original?: any
}

interface UseChatwootConversationProps {
  conversationId: number
  contactName?: string
  brokerName?: string
  prefillMessage?: string
  sessionId?: string
}

interface UseChatwootConversationReturn {
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  isAgentTyping: boolean
  typingMessage: string
  error: string | null
  inputMessage: string
  setInputMessage: (value: string) => void
  sendMessage: () => Promise<void>
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function useChatwootConversation({
  conversationId,
  contactName = 'You',
  brokerName = 'Agent',
  prefillMessage,
  sessionId
}: UseChatwootConversationProps): UseChatwootConversationReturn {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState(`${brokerName} is typing...`)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<number>(0)
  const isInitializingRef = useRef<boolean>(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionUpdatedRef = useRef<boolean>(false) // Track if session already updated

  // Fetch messages for the conversation
  const fetchMessages = async () => {
    try {
      // Prevent concurrent initialization
      if (isInitializingRef.current) {
        console.log('[Chatwoot] Fetch already in progress, skipping...')
        return
      }

      isInitializingRef.current = true
      const fetchUrl = `/api/chat/messages?conversation_id=${conversationId}`
      console.log('[Chatwoot] 📞 Fetching messages from:', fetchUrl)

      const response = await fetch(fetchUrl, {
        cache: 'no-store', // CRITICAL: Prevent browser from caching messages
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error('[Chatwoot] ❌ Failed to fetch messages:', response.status, response.statusText)
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      console.log('[Chatwoot] 📥 Fetched', data.messages?.length || 0, 'messages for conversation', conversationId)
      console.log('[Chatwoot] 📋 Message IDs:', data.messages?.map((m: any) => m.id) || [])

      // DEBUG: Log full message data to diagnose role detection
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg: any) => {
          console.log(`[Chatwoot] 📨 Message ${msg.id}:`, {
            content: msg.content?.substring(0, 30),
            role: msg.role,
            message_type: msg.message_type,
            sender_type: msg.sender?.type,
            sender_name: msg.sender?.name
          })
        })
      }

      // Validate response data
      if (!Array.isArray(data.messages)) {
        console.error('[Chatwoot] ⚠️ WARNING: Returned non-array messages:', data)
        setError('Unexpected data format')
        return
      }

      // Update sessionManager with broker name (once on initial fetch only)
      if (sessionId && data.conversation?.custom_attributes && !sessionUpdatedRef.current) {
        const brokerNameFromChatwoot = data.conversation.custom_attributes.broker_name || brokerName
        // Get existing session and merge in broker name
        const existingSession = sessionManager.getChatwootSession(sessionId) || { conversationId }
        sessionManager.setChatwootSession(sessionId, {
          ...existingSession,
          brokerName: brokerNameFromChatwoot
        })
        sessionUpdatedRef.current = true // Mark as updated
        console.log('[Chatwoot] Updated sessionManager with broker name:', brokerNameFromChatwoot)
      }

      setMessages(data.messages)
      console.log('[Chatwoot] ✅ Messages state updated with', data.messages.length, 'messages')

      // Reset lastMessageIdRef if we get messages
      if (data.messages.length > 0) {
        const ids = data.messages.map((m: any) => m.id)
        const maxId = Math.max(...ids)
        lastMessageIdRef.current = maxId
        console.log('[Chatwoot] 📌 Updated lastMessageIdRef to:', maxId)
      } else {
        console.log('[Chatwoot] ⚠️ No messages found for conversation', conversationId)
      }
    } catch (err) {
      console.error('[Chatwoot] 💥 Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }

  // Poll for new messages
  const pollNewMessages = async () => {
    try {
      // If we don't have a baseline and we're not already initializing, fetch all messages
      if (lastMessageIdRef.current === 0 && !isInitializingRef.current) {
        await fetchMessages()
        return
      }

      const response = await fetch(
        `/api/chat/messages?conversation_id=${conversationId}&after_id=${lastMessageIdRef.current}`,
        {
          cache: 'no-store', // CRITICAL: Prevent browser from caching poll results
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      )

      if (!response.ok) return

      const data = await response.json()

      if (data.messages && data.messages.length > 0) {
        // DEBUG: Log new messages for role detection
        console.log('[Chatwoot] 🔔 Polling found', data.messages.length, 'new messages')
        data.messages.forEach((msg: any) => {
          console.log(`[Chatwoot] 📨 New message ${msg.id}:`, {
            content: msg.content?.substring(0, 30),
            role: msg.role,
            message_type: msg.message_type,
            sender_type: msg.sender?.type,
            sender_name: msg.sender?.name
          })
        })

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id))

          if (newMessages.length > 0) {
            console.log('[Chatwoot] ✅ Adding', newMessages.length, 'new messages to state')
            // Update lastMessageIdRef to the highest ID
            const allIds = [...prev.map((m) => m.id), ...newMessages.map((m: any) => m.id)]
            const maxId = Math.max(...allIds)
            lastMessageIdRef.current = maxId
            clearTyping() // Clear typing indicator when new messages arrive
            return [...prev, ...newMessages]
          }
          return prev
        })
      } else {
        console.log('[Chatwoot] No new messages, last ID:', lastMessageIdRef.current)
      }
    } catch (err) {
      console.error('Error polling messages:', err)
    }
  }

  // Simulate realistic typing behavior with human-like variance
  const simulateTyping = (messageLength: number = 150) => {
    setIsAgentTyping(true)

    // Single natural typing message (like iMessage/WhatsApp)
    setTypingMessage(`${brokerName} is typing...`)

    // Max timeout: if no response after 10 seconds, assume broker not responding
    // This prevents typing indicator from showing when broker won't reply
    const maxTimeout = 10000 // 10 seconds

    typingTimeoutRef.current = setTimeout(() => {
      // Only hide if still no response after max timeout
      console.log('[Chatwoot] ⏱️ Typing timeout reached, hiding indicator (no broker response)')
      setIsAgentTyping(false)
    }, maxTimeout)
  }

  // Clear typing simulation
  const clearTyping = () => {
    setIsAgentTyping(false)
    setTypingMessage(`${brokerName} is typing...`)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  // Send a message
  const sendMessage = async () => {
    // Guard: prevent double-sends AND blank messages
    if (!inputMessage.trim() || isSending) return

    const messageText = inputMessage.trim()
    console.log('[Chatwoot] 📤 Sending message for conversation', conversationId, ':', messageText.substring(0, 50))
    setInputMessage('')
    setIsSending(true)
    setError(null)

    // Optimistically add the message to the UI
    const tempMessage: Message = {
      id: Date.now(),
      content: messageText,
      role: 'user',
      message_type: 'incoming', // 'incoming' for user messages
      created_at: new Date().toISOString(),
      sender: {
        name: contactName,
        type: 'contact'
      },
      private: false
    }

    console.log('[Chatwoot] 🔄 Adding optimistic message with temp ID:', tempMessage.id)
    setMessages((prev) => [...prev, tempMessage])

    try {
      // Use the real Chatwoot API endpoint for actual AI responses
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: messageText,
          message_type: 'incoming' // Important: incoming triggers the webhook for AI response
        })
      })

      if (!response.ok) {
        console.error('[Chatwoot] ❌ Failed to send message:', response.status, response.statusText)
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      console.log('[Chatwoot] ✅ Message sent successfully, real ID:', data.message?.id)

      // Update the temporary message with the real ID from Chatwoot
      if (data.message?.id) {
        lastMessageIdRef.current = data.message.id
        console.log('[Chatwoot] 🔄 Replacing temp ID', tempMessage.id, 'with real ID', data.message.id)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMessage.id
              ? { ...m, id: data.message.id, created_at: data.message.created_at || m.created_at }
              : m
          )
        )
      }

      // Don't simulate typing automatically - it shows when broker won't respond
      // Typing indicator will only show if we detect actual broker typing activity
      // (Real Chatwoot typing events would be detected via polling)
    } catch (err) {
      console.error('[Chatwoot] 💥 Error sending message:', err)
      setError('Failed to send message')

      // Remove the optimistic message on error
      console.log('[Chatwoot] 🗑️ Removing optimistic message due to error')
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setInputMessage(messageText) // Restore the message text
    } finally {
      setIsSending(false)
    }
  }

  // Prefill effect: hydrate inputMessage when prefillMessage provided (guards against clobbering manual edits)
  useEffect(() => {
    // Only hydrate if prefillMessage truthy AND user hasn't typed
    if (typeof prefillMessage === 'string' && prefillMessage.trim() && !inputMessage) {
      setInputMessage(prefillMessage)
    }
  }, [prefillMessage, inputMessage])

  // Initialize chat on mount
  useEffect(() => {
    console.log('[Chatwoot] 🔄 Initializing hook with conversationId:', conversationId, 'sessionId:', sessionId)
    let isMounted = true
    let pollInterval: NodeJS.Timeout | null = null

    const initialize = async () => {
      // Reset state for new conversation
      setMessages([])
      setInputMessage('')
      lastMessageIdRef.current = 0
      sessionUpdatedRef.current = false // Reset session update flag
      setError(null)
      setIsLoading(true)

      // Clear typing if active
      setIsAgentTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      console.log('[Chatwoot] 📡 Starting initial fetch for conversation:', conversationId)
      // CRITICAL: wait for initial fetch to finish before polling
      await fetchMessages()

      if (isMounted) {
        console.log('[Chatwoot] ✅ Initial fetch complete, starting polling interval')
        pollInterval = setInterval(pollNewMessages, 3000)
        pollIntervalRef.current = pollInterval
      }
    }

    initialize()

    return () => {
      console.log('[Chatwoot] 🔚 Cleanup - unmounting hook for conversation:', conversationId)
      isMounted = false
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      // Clean up typing timeout on unmount
      clearTyping()
    }
    // Re-run when conversationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  return {
    messages,
    isLoading,
    isSending,
    isAgentTyping,
    typingMessage,
    error,
    inputMessage,
    setInputMessage,
    sendMessage,
    messagesEndRef
  }
}
