import { assignBestBroker } from '../ai/broker-assignment'
import { releaseBrokerCapacity } from '../ai/broker-availability'
import { ChatwootClient, ProcessedLeadData } from '../integrations/chatwoot-client'
import { Database } from '../../lib_supabase/db/types/database.types'

// Use the proper Database type from Supabase
type BrokerRecord = Database['public']['Tables']['ai_brokers']['Row']

type ScheduleResult = {
  status: 'assigned'
  broker: BrokerRecord
  joinEtaSeconds: number
} | {
  status: 'queued'
  queuePosition: number
}

interface EngagementContext {
  conversationId: number
  leadScore: number
  loanType: string
  propertyCategory: string
  monthlyIncome: number
  timeline: string
  processedLeadData: ProcessedLeadData
  sessionId: string
}

class BrokerEngagementManager {
  private queue: EngagementContext[] = []
  private processingQueue = false

  async handleNewConversation(context: EngagementContext): Promise<ScheduleResult> {
    const broker = await assignBestBroker(
      context.leadScore,
      context.loanType,
      context.propertyCategory,
      context.monthlyIncome,
      context.timeline,
      context.conversationId
    ) as BrokerRecord | null

    const chatwootClient = new ChatwootClient()

    if (!broker) {
      await chatwootClient.createActivityMessage(
        context.conversationId,
        'All AI specialists are helping other homeowners right now. We\'ll connect you as soon as one is free.'
      )
      this.queue.push(context)
      await this.processQueue()
      return { status: 'queued', queuePosition: this.queue.length }
    }

    // Synchronously announce broker join and send greeting (now uses 2000ms fixed delay)
    await this.announceBrokerJoin(chatwootClient, context, broker)

    return {
      status: 'assigned',
      broker,
      joinEtaSeconds: 2  // Fixed 2-second delay per user requirement
    }
  }

  async releaseBrokerForConversation(conversationId: number, brokerId: string) {
    await releaseBrokerCapacity(brokerId)
    await this.processQueue()
  }

  private async processQueue() {
    if (this.processingQueue || this.queue.length === 0) {
      return
    }

    this.processingQueue = true

    try {
      const chatwootClient = new ChatwootClient()
      const remaining: EngagementContext[] = []

      for (const context of this.queue) {
        const broker = await assignBestBroker(
          context.leadScore,
          context.loanType,
          context.propertyCategory,
          context.monthlyIncome,
          context.timeline,
          context.conversationId
        ) as BrokerRecord | null

        if (!broker) {
          remaining.push(context)
          continue
        }

        await this.announceBrokerJoin(chatwootClient, context, broker)
      }

      this.queue = remaining
    } finally {
      this.processingQueue = false
    }
  }

  private async announceBrokerJoin(
    chatwootClient: ChatwootClient,
    context: EngagementContext,
    broker: BrokerRecord
  ): Promise<void> {
    // Update persona with real Supabase broker details
    console.log('🔄 BEFORE persona update:', {
      oldName: context.processedLeadData.brokerPersona.name,
      oldType: context.processedLeadData.brokerPersona.type,
      newName: broker.name,
      newType: broker.personality_type
    })

    context.processedLeadData.brokerPersona.name = broker.name
    context.processedLeadData.brokerPersona.type = (broker.personality_type as "aggressive" | "balanced" | "conservative") || context.processedLeadData.brokerPersona.type

    console.log('✅ AFTER persona update:', {
      updatedName: context.processedLeadData.brokerPersona.name,
      updatedType: context.processedLeadData.brokerPersona.type
    })

    console.log('⏰ Starting broker join sequence:', {
      conversationId: context.conversationId,
      brokerName: broker.name,
      timestamp: new Date().toISOString()
    })

    // Update conversation attributes with broker assignment
    await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
      ai_broker_id: broker.id,
      ai_broker_name: broker.name,
      broker_persona: broker.personality_type,
      broker_slug: broker.slug,
      broker_status: 'joining'
    })

    // Post "reviewing" activity message
    try {
      await chatwootClient.createActivityMessage(
        context.conversationId,
        `${broker.name} is reviewing your details and joining shortly...`
      )
      console.log('✅ Posted "reviewing" activity')
    } catch (error) {
      console.error('Failed to post reviewing activity:', error)
      // Continue anyway - not critical
    }

    // SYNCHRONOUS WAIT: 2000ms (Railway-safe, fixed delay per user requirement)
    console.log('⏳ Waiting 2000ms before join message...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Post "joined" activity message
    try {
      await chatwootClient.createActivityMessage(
        context.conversationId,
        `${broker.name} joined the conversation.`
      )
      console.log('✅ Posted "joined" activity')

      // Update conversation status to "engaged"
      await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
        broker_status: 'engaged'
      })
    } catch (error) {
      console.error('Failed to post broker join activity:', error)
      throw error  // Critical failure
    }

    // Send the broker's personalized greeting message
    try {
      console.log('📨 Sending broker greeting message...')
      await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)
      console.log('✅ Broker greeting message sent')
    } catch (error) {
      console.error('Failed to send broker greeting:', error)
      throw error  // Critical failure
    }
  }
}

export const brokerEngagementManager = new BrokerEngagementManager()
