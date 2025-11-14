'use client'

import { useEffect, useState, useCallback } from 'react'
import { calculateBrokerPersona } from '../calculations/broker-persona'
import { conversionTracker } from '../analytics/conversion-tracking'

interface ChatwootConfig {
  conversationId?: number
  contactId?: number
  websiteToken: string
  baseUrl: string
}

interface FormDataForChatwoot {
  name: string
  email: string
  phone: string
  loanType: string
  propertyCategory?: string
  propertyType?: string
  actualIncomes?: number[]
  actualAges?: number[]
  employmentType?: string
  leadScore?: number
  sessionId: string
  existingCommitments?: number
  propertyPrice?: number
}

/**
 * Hook to integrate with Chatwoot backend
 * Creates conversation and manages real-time chat
 */
export function useChatwootIntegration(
  formData: FormDataForChatwoot | null,
  sessionId: string
) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [config, setConfig] = useState<ChatwootConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create or retrieve Chatwoot conversation
  const initializeChatwoot = useCallback(async () => {
    if (!formData || isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      // Calculate broker persona for assignment
      const brokerPersona = calculateBrokerPersona(
        formData.leadScore || 50,
        formData
      )

      // Create conversation via API
      const response = await fetch('/api/chatwoot-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          brokerPersona,
          sessionId
        })
      })

      if (!response.ok) throw new Error('Failed to create conversation')

      const data = await response.json()

      // Store configuration
      setConfig({
        conversationId: data.conversationId,
        contactId: data.contactId,
        websiteToken: data.widgetConfig.websiteToken,
        baseUrl: data.widgetConfig.baseUrl
      })

      setConversationId(data.conversationId)
      setIsConnected(true)

      // Track conversion
      conversionTracker.trackChatCreated(
        sessionId,
        data.conversationId,
        formData.leadScore || 0,
        Date.now() - performance.now()
      )

      // Store in session for persistence
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `chatwoot_session_${sessionId}`,
          JSON.stringify({
            conversationId: data.conversationId,
            config: data.widgetConfig,
            timestamp: Date.now()
          })
        )
      }
    } catch (err) {
      console.error('Chatwoot initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }, [formData, sessionId, isConnected, isConnecting])

  // Send message to Chatwoot
  const sendMessage = useCallback(async (message: string) => {
    if (!conversationId || !config) {
      throw new Error('Chatwoot not initialized')
    }

    try {
      const response = await fetch('/api/chatwoot-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: 'incoming',
          content: message,
          conversation: { id: conversationId },
          contact: { id: config.contactId }
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      return await response.json()
    } catch (err) {
      console.error('Failed to send message:', err)
      throw err
    }
  }, [conversationId, config])

  // Load existing session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = sessionStorage.getItem(`chatwoot_session_${sessionId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)

        // Check if session is still valid (within 24 hours)
        const age = Date.now() - parsed.timestamp
        if (age < 24 * 60 * 60 * 1000) {
          setConversationId(parsed.conversationId)
          setConfig(parsed.config)
          setIsConnected(true)
        }
      } catch (err) {
        console.error('Failed to restore Chatwoot session:', err)
      }
    }
  }, [sessionId])

  // Auto-initialize when form data is available
  useEffect(() => {
    if (formData && !isConnected && !isConnecting) {
      initializeChatwoot()
    }
  }, [formData, initializeChatwoot, isConnected, isConnecting])

  return {
    isConnecting,
    isConnected,
    conversationId,
    config,
    error,
    initializeChatwoot,
    sendMessage
  }
}