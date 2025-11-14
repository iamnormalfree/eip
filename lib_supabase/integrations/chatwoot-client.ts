/**
 * Chatwoot API Client
 * Handles all interactions with Chatwoot API for conversation management
 */

import { BrokerPersona } from '../calculations/broker-persona'
import { normalizeSingaporePhone } from '@/lib/utils/phone-utils'
import { trackBotMessage } from '@/lib/utils/message-tracking'
import { upsertSecureConversationId } from '@/lib/db/conversation-repository'
import { MessageTimingData } from '@/lib/queue/broker-queue'
import { isLegacyCompat } from '@/lib_supabase/utils/compat'

export interface ChatwootContact {
  id: number
  name: string
  email: string
  phone_number?: string
  custom_attributes?: Record<string, any>
}

export interface ChatwootConversation {
  id: number
  account_id: number
  inbox_id: number
  contact_id: number
  status: 'open' | 'resolved' | 'pending'
  custom_attributes?: Record<string, any>
  messages?: ChatwootMessage[]
}

export interface ChatwootMessage {
  id: number
  content: string
  message_type: 'incoming' | 'outgoing' | 'activity'
  private: boolean
  created_at: string
}

export interface ProcessedLeadData {
  name: string
  email: string
  phone: string
  loanType: string
  propertyCategory?: string
  propertyType?: string
  actualIncomes: number[]
  actualAges: number[]
  employmentType: string
  leadScore: number
  sessionId: string
  brokerPersona: BrokerPersona
  existingCommitments?: number
  propertyPrice?: number
  // Additional Dr. Elena integration fields
  age?: number
  citizenship?: 'Citizen' | 'PR' | 'Foreigner'
  propertyCount?: number
  purchaseTimeline?: string
  coApplicantAge?: number
  messageCount?: number
  urgencyScore?: number
}

export class ChatwootClient {
  private baseUrl: string
  private apiToken: string
  private accountId: string
  private inboxId: number
  private websiteToken: string

  constructor() {
    // ⚠️ SECURITY: Always use environment variables for credentials
    // Never commit actual API tokens to version control
    const requiredEnvVars = {
      CHATWOOT_BASE_URL: process.env.CHATWOOT_BASE_URL,
      CHATWOOT_API_TOKEN: process.env.CHATWOOT_API_TOKEN,
      CHATWOOT_ACCOUNT_ID: process.env.CHATWOOT_ACCOUNT_ID,
      CHATWOOT_INBOX_ID: process.env.CHATWOOT_INBOX_ID,
      CHATWOOT_WEBSITE_TOKEN: process.env.CHATWOOT_WEBSITE_TOKEN
    }

    // Validate that all required environment variables are set
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)

    if (missingVars.length > 0) {
      const errorMsg = `Missing required Chatwoot environment variables: ${missingVars.join(', ')}`
      console.error('❌', errorMsg)
      throw new Error(errorMsg)
    }

    this.baseUrl = requiredEnvVars.CHATWOOT_BASE_URL!
    this.apiToken = requiredEnvVars.CHATWOOT_API_TOKEN!
    this.accountId = requiredEnvVars.CHATWOOT_ACCOUNT_ID!
    this.inboxId = parseInt(requiredEnvVars.CHATWOOT_INBOX_ID!)
    this.websiteToken = requiredEnvVars.CHATWOOT_WEBSITE_TOKEN!
  }

  // Add these getter methods to make private properties accessible
  get apiBaseUrl() { return this.baseUrl }
  get apiAccountId() { return this.accountId }
  get apiAccessToken() { return this.apiToken }
  get apiInboxId() { return this.inboxId }

  /**
   * Create or update a contact in Chatwoot
   */
  async createOrUpdateContact(contactData: {
    name: string
    email: string
    phone?: string
    customAttributes?: Record<string, any>
  }): Promise<ChatwootContact> {
    try {
      // Normalize phone number once at the start
      const normalizedPhone = contactData.phone
        ? normalizeSingaporePhone(contactData.phone)
        : ''

      console.log('📞 Phone normalization:', {
        input: contactData.phone,
        normalized: normalizedPhone
      })

      // First, try to find existing contact by email OR phone
      const searchQueries = [
        contactData.email,
        normalizedPhone,
        // Also search without country code in case it's stored that way
        normalizedPhone.replace('+65', '')
      ].filter(Boolean)

      for (const query of searchQueries) {
        console.log(`🔎 Searching for contact with query: "${query}"`)
        const searchResponse = await fetch(
          `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?q=${encodeURIComponent(query as string)}`,
          {
            method: 'GET',
            headers: {
              'Api-Access-Token': this.apiToken,
              'Content-Type': 'application/json'
            }
          }
        )

        if (searchResponse.ok) {
          const data = await searchResponse.json()
          const payload = data.payload || data

          if (Array.isArray(payload) && payload.length > 0) {
            // Found existing contact - update it
            const existingContact = payload[0]
            console.log(`✅ Found existing contact ID: ${existingContact.id}`)
            console.log('🔍 Attempting to update contact ID:', existingContact.id)

            const updateResponse = await fetch(
              `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${existingContact.id}`,
              {
                method: 'PUT',
                headers: {
                  'Api-Access-Token': this.apiToken,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: contactData.name,
                  email: contactData.email,
                  phone_number: normalizedPhone,  // Use normalized phone
                  custom_attributes: contactData.customAttributes
                })
              }
            )

            if (updateResponse.ok) {
              const response = await updateResponse.json()
              const contact = response.payload?.contact || response.payload || response
              console.log(`✅ Updated contact: ${contact.id}`)
              console.log('🔍 Returning updated contact, should exit function now')
              return contact  // THIS ALREADY EXISTS - DO NOT ADD ANOTHER RETURN!
            } else {
              // Log why update failed and return existing contact anyway
              const errorText = await updateResponse.text()
              console.warn(`⚠️ Contact update failed (${updateResponse.status}): ${errorText}`)
              console.log('🔍 Returning existing contact despite update failure')
              return existingContact  // Return the existing contact even if update failed
            }
          }
        }
      }

      // Create new contact if not found
      const contactPayload = {
        inbox_id: this.inboxId,
        name: contactData.name,
        email: contactData.email,
        phone_number: normalizedPhone,  // Use normalized phone
        custom_attributes: contactData.customAttributes
      }

      console.log('📤 Creating contact with payload:', JSON.stringify(contactPayload, null, 2))

      const createResponse = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactPayload)
        }
      )

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('Contact creation failed:', errorText)

        // FALLBACK: If contact already exists, search for it again
        if (errorText.includes('already been taken') || errorText.includes('already exists')) {
          console.log('⚠️ Contact already exists, searching by email...')

          // Try one more search by email only
          const fallbackResponse = await fetch(
            `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?q=${encodeURIComponent(contactData.email)}`,
            {
              method: 'GET',
              headers: {
                'Api-Access-Token': this.apiToken,
                'Content-Type': 'application/json'
              }
            }
          )

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            const contacts = fallbackData.payload || fallbackData
            if (Array.isArray(contacts) && contacts.length > 0) {
              console.log('✅ Found existing contact via fallback search')
              return contacts[0]
            }
          }
        }

        throw new Error(`Failed to create contact: ${createResponse.statusText} - ${errorText}`)
      }

      const response = await createResponse.json()
      // Chatwoot returns { payload: { contact: {...} } } for contact creation
      return response.payload?.contact || response.payload || response
    } catch (error) {
      console.error('Error creating/updating contact:', error)
      throw error
    }
  }

  /**
   * Create a conversation with context (including broker assignment attributes)
   */
  async createConversationWithContext(params: {
    contact_id: number
    inbox_id: number
    custom_attributes: Record<string, any>
  }): Promise<ChatwootConversation> {
    try {
      // Ensure we have broker assignment attributes
      const enhancedAttributes = {
        ...params.custom_attributes,
        // Set status to 'bot' to trigger n8n workflow
        conversation_status: 'bot',
        // Message count starts at 0
        message_count: 0,
        // Timestamp for tracking
        created_at: new Date().toISOString(),
        // ENSURE loan_type is explicitly set
        loan_type: params.custom_attributes.loan_type
      }

      console.log('📝 Creating conversation with attributes:', {
        conversationId: 'new',
        loan_type: enhancedAttributes.loan_type,
        all_attributes: enhancedAttributes
      })
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Dual-write strategy for source_id based on legacy compatibility flag
            source_id: isLegacyCompat() ? `nextnest_${Date.now()}` : `eip_${Date.now()}`,
            inbox_id: params.inbox_id,
            contact_id: params.contact_id,
            custom_attributes: enhancedAttributes,
            status: 'pending'
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create conversation: ${response.statusText} - ${errorText}`)
      }

      const conversation = await response.json()
      // API inbox returns conversation directly
      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  /**
   * Main method to create a conversation from lead data
   */
  async createConversation(
    leadData: ProcessedLeadData,
    skipInitialMessage: boolean = false
  ): Promise<{ conversation: ChatwootConversation; secureUuid: string }> {
    console.log('📞 Creating Chatwoot conversation for:', leadData.name)

    // Normalize phone before passing to createOrUpdateContact
    const normalizedPhone = normalizeSingaporePhone(leadData.phone)

    // 1. Create or update contact with lead information
    const contact = await this.createOrUpdateContact({
      name: leadData.name,
      email: leadData.email,
      phone: normalizedPhone,  // Pass normalized phone
      customAttributes: {
        lead_score: leadData.leadScore,
        loan_type: leadData.loanType,
        employment_type: leadData.employmentType,
        property_category: leadData.propertyCategory,
        session_id: leadData.sessionId
      }
    })
    
    console.log('✅ Contact created/updated:', contact.id)

    // 2. Create conversation with full context
    const conversation = await this.createConversationWithContext({
      contact_id: contact.id,
      inbox_id: this.inboxId,
      custom_attributes: {
        lead_score: leadData.leadScore,
        broker_persona: leadData.brokerPersona.type,
        loan_type: leadData.loanType,
        monthly_income: leadData.actualIncomes[0],
        form_completed_at: new Date().toISOString(),
        session_id: leadData.sessionId,
        // ai_broker_name will be set by BullMQ worker after actual assignment

        // Additional context
        property_category: leadData.propertyCategory,
        property_type: leadData.propertyType,
        property_price: leadData.propertyPrice,
        ages: JSON.stringify(leadData.actualAges),
        incomes: JSON.stringify(leadData.actualIncomes),
        employment_type: leadData.employmentType,
        existing_commitments: leadData.existingCommitments,
        
        // Broker persona details
        broker_approach: leadData.brokerPersona.approach,
        broker_urgency: leadData.brokerPersona.urgencyLevel,
        
        // System metadata
        source: 'progressive_form',
        integration_version: '2.0'
      }
    })

    // 3. Send initial AI broker message (unless skipped)
    if (!skipInitialMessage) {
      await this.sendInitialMessage(conversation.id, leadData)
    }


    // Create secure UUID mapping for conversation
    let secureUuid = ''
    try {
      secureUuid = await upsertSecureConversationId(
        conversation.id,
        leadData.email
      )
      console.log(`✅ Secure UUID created: ${secureUuid}`)
    } catch (error) {
      console.error('⚠️ Failed to create secure UUID mapping:', error)
      // Don't throw - allow conversation to proceed, UUID can be backfilled later
    }

    return {
      conversation,
      secureUuid
    }
  }

  /**
   * Check if a greeting message was already sent to this conversation
   */
  private async hasExistingGreeting(conversationId: number, brokerName: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.warn('Could not fetch messages for greeting check')
        return false // Don't block if we can't check
      }

      const messages = await response.json()
      const allMessages = messages.payload || messages || []

      // Check if any outgoing message contains broker introduction
      for (const msg of allMessages) {
        if (msg.message_type === 'outgoing' || msg.message_type === 1) {
          const content = msg.content?.toLowerCase() || ''
          // Check if message looks like a greeting (contains "I'm [BrokerName]")
          if (content.includes("i'm") && content.includes(brokerName.toLowerCase())) {
            console.log('🔍 Found existing greeting from', brokerName)
            return true
          }
        }
      }

      return false
    } catch (error) {
      console.error('Error checking for existing greeting:', error)
      return false // Don't block if check fails
    }
  }

  /**
   * Send the initial AI broker message
   */
  async sendInitialMessage(conversationId: number, leadData: ProcessedLeadData): Promise<void> {
    // DIAGNOSTIC: Add stack trace to identify ALL callers
    console.trace('🔍 sendInitialMessage called from:')

    // DEDUPLICATION CHECK: Skip if greeting already sent
    const hasGreeting = await this.hasExistingGreeting(conversationId, leadData.brokerPersona.name)
    if (hasGreeting) {
      console.log(`⏭️ Skipping duplicate greeting from ${leadData.brokerPersona.name}`)
      return
    }

    const initialMessage = this.generateInitialMessage(leadData)

    try {
      console.log('📤 Sending initial message to Chatwoot:', {
        conversationId,
        brokerName: leadData.brokerPersona.name,
        messagePreview: initialMessage.substring(0, 50) + '...'
      })

      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: initialMessage,
            message_type: 1,  // Use numeric type - 1 = outgoing/agent message
            private: false,
            sender: {
              type: 'agent'  // Explicitly mark as agent message
            }
          })
        }
      )

      if (response.ok) {
        const sentMessage = await response.json()

        // Extract message ID from Chatwoot response
        const messageId = sentMessage.id?.toString() || `fallback-${conversationId}-${Date.now()}`

        // Note: Chatwoot returns sentMessage.id as numeric, converted to string for consistency
        if (!sentMessage.id) {
          console.warn('⚠️ Chatwoot did not return message ID, using fallback:', messageId)
        }

        console.log('✅ Initial broker message sent successfully:', {
          messageId,
          brokerName: leadData.brokerPersona.name,
          preview: sentMessage.content?.substring(0, 50) + '...'
        })

        // Track bot message for echo detection (non-blocking)
        try {
          trackBotMessage(conversationId, initialMessage, messageId)
          console.log('✅ Initial broker message tracked for echo detection:', {
            conversationId,
            messageId
          })
        } catch (trackingError) {
          // Non-blocking: Log error but don't fail the send
          console.error('⚠️ Failed to track bot message (non-critical):', trackingError)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to send initial broker message:', {
          status: response.status,
          error: errorText,
          brokerName: leadData.brokerPersona.name
        })
      }
    } catch (error) {
      console.error('Error sending initial message:', error)
      // Don't throw - conversation is created, just initial message failed
    }
  }

  /**
   * Generate personalized initial message based on lead data
   */
  private generateInitialMessage(leadData: ProcessedLeadData): string {
    const { brokerPersona, name, loanType, propertyCategory, actualIncomes, leadScore } = leadData
    const monthlyIncome = actualIncomes[0]
    const formattedIncome = monthlyIncome ? `S$${monthlyIncome.toLocaleString()}` : ''

    console.log('🔤 DEBUG: Generating initial message with data:', {
      brokerPersonaType: brokerPersona.type,
      brokerPersonaName: brokerPersona.name,
      userName: name,
      loanType,
      propertyCategory,
      leadScore,
      monthlyIncome: formattedIncome
    })

    switch (brokerPersona.type) {
      case 'aggressive':
        return `Hi ${name}! 🎯

I'm ${brokerPersona.name}, your dedicated mortgage specialist. I've analyzed your ${loanType.replace('_', ' ')} application and have excellent news!

✅ **Pre-qualification Status**: Highly Likely Approved
💰 **Your Profile Score**: ${leadScore}/100 (Premium tier)
${formattedIncome ? `🏆 **Monthly Income**: ${formattedIncome} puts you in a strong position` : ''}

Based on your ${propertyCategory || 'property'} choice, I've identified 3 strategies that could maximize your savings.

The market is moving fast right now, and with your strong profile, we should secure your rate ASAP.

**Ready to lock in these rates today?** I can have your pre-approval letter ready within 2 hours. 🚀`

      case 'balanced':
        return `Hello ${name}! 👋

I'm ${brokerPersona.name}, and I'm excited to help you with your ${loanType.replace('_', ' ')} journey.

I've reviewed your application and here's what I found:

📊 **Your Profile Assessment**: ${leadScore}/100
✅ Strong approval likelihood
${formattedIncome ? `💡 Your ${formattedIncome} income puts you in a good position` : ''}

**What this means for you:**
• ${propertyCategory ? propertyCategory.charAt(0).toUpperCase() + propertyCategory.slice(1) : 'Your chosen'} properties offer several financing options
• Current market conditions are favorable for your timeline

I'm here to answer any questions and guide you through each step. What would you like to explore first?`

      case 'conservative':
      default:
        return `Hi ${name},

Thank you for taking the time to complete your ${loanType.replace('_', ' ')} application. I'm ${brokerPersona.name}, and I'm here to help you understand your options without any pressure.

I know mortgage decisions can feel overwhelming, so let's take this step by step:

🏠 **What I understand about your situation:**
• You're exploring ${loanType.replace('_', ' ')} options
• Looking at ${propertyCategory || 'property'} properties
• Want to make sure you're getting the best value

**My approach:**
• No pressure - we'll move at your pace
• Clear explanations of all options
• Honest advice about what makes sense for your situation

Feel free to ask me anything - even questions you think might be "basic." That's what I'm here for! 😊`
    }
  }

  /**
   * Check if a similar activity message was recently posted (within last 30 seconds)
   * Used to prevent duplicate system messages
   */
  private async checkRecentActivityMessage(conversationId: number, content: string): Promise<boolean> {
    try {
      // Fetch recent messages from the conversation
      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.warn('Could not fetch messages for deduplication check')
        return false // Don't block if we can't check
      }

      const messages = await response.json()
      const recentMessages = messages.payload || messages || []

      // Check last 5 messages for duplicates (within 30 seconds)
      const thirtySecondsAgo = Date.now() - 30000
      const normalizedContent = content.toLowerCase().trim()

      for (const msg of recentMessages.slice(-5)) {
        // Only check activity messages
        if (msg.message_type !== 'activity' && msg.message_type !== 2) continue

        const msgTime = new Date(msg.created_at).getTime()
        if (msgTime < thirtySecondsAgo) continue

        const msgContent = msg.content?.toLowerCase().trim() || ''

        // Check for exact match or very similar content (>80% match)
        if (msgContent === normalizedContent) {
          console.log('🔍 Found exact duplicate activity message')
          return true
        }

        // Check for partial match (e.g., "joined" appears in both)
        const contentWords = normalizedContent.split(/\s+/)
        const msgWords = msgContent.split(/\s+/)
        const commonWords = contentWords.filter(word => msgWords.includes(word) && word.length > 3)

        if (commonWords.length > 2 && commonWords.length / contentWords.length > 0.6) {
          console.log('🔍 Found similar activity message:', {
            new: normalizedContent.substring(0, 50),
            existing: msgContent.substring(0, 50),
            similarity: `${Math.round(commonWords.length / contentWords.length * 100)}%`
          })
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking for duplicate messages:', error)
      return false // Don't block if check fails
    }
  }

  /**
   * Create a Chatwoot activity / system message
   * PRIMARY: Uses /activities endpoint with proper payload structure
   * FALLBACK: Uses /messages endpoint with message_type: 2 only if activities fails
   * Per Task 1 requirements: Activities endpoint returns 204 No Content on success
   *
   * DEDUPLICATION: Checks if similar message was recently posted to prevent duplicates
   */
  async createActivityMessage(conversationId: number, content: string, checkDuplicate: boolean = true): Promise<void> {
    // DEDUPLICATION CHECK: Skip if similar message was recently posted
    if (checkDuplicate) {
      const isDuplicate = await this.checkRecentActivityMessage(conversationId, content)
      if (isDuplicate) {
        console.log(`⏭️ Skipping duplicate activity message: "${content.substring(0, 50)}..."`)
        return
      }
    }
    try {
      // PRIMARY: Use activities endpoint for proper system messages
      const activitiesResponse = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/activities`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'conversation_activity',
            content
          })
        }
      )

      // 204 No Content is success for activities endpoint
      if (activitiesResponse.status === 204) {
        console.log(`✅ Activity created successfully via /activities endpoint (204) for conversation ${conversationId}`)
        return
      }

      // Also accept other 2xx responses as success
      if (activitiesResponse.ok) {
        console.log(`✅ Activity created via /activities endpoint (${activitiesResponse.status}) for conversation ${conversationId}`)
        return
      }

      // Log non-2xx responses and fall back
      const errorText = await activitiesResponse.text().catch(() => '')
      console.warn(`⚠️ Activities endpoint failed with ${activitiesResponse.status}:`, errorText)

      // FALLBACK: Only use messages endpoint if activities endpoint fails
      console.log('📝 Activities endpoint unavailable, falling back to /messages with message_type: 2')
      const messagesResponse = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            message_type: 2,  // Activity/system message
            private: false,
            sender: {
              type: 'system'  // Explicitly mark as system
            }
          })
        }
      )

      if (messagesResponse.ok) {
        console.log(`✅ System message created via /messages fallback for conversation ${conversationId}`)
      } else {
        const fallbackError = await messagesResponse.text().catch(() => '')
        console.error(`❌ Both endpoints failed. Messages endpoint: ${messagesResponse.status}`, fallbackError)
      }
    } catch (error) {
      console.error('❌ Error creating activity message:', error)
    }
  }

  /**
   * Update conversation custom attributes (preserving existing values)
   */
  async updateConversationCustomAttributes(conversationId: number, attributes: Record<string, unknown>): Promise<void> {
    try {
      // First, get the current conversation to preserve existing custom attributes
      const getResponse = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          }
        }
      )

      let existingAttributes = {}
      if (getResponse.ok) {
        const conversation = await getResponse.json()
        existingAttributes = conversation.custom_attributes || {}
      }

      // Merge existing attributes with new ones
      const mergedAttributes = {
        ...existingAttributes,
        ...attributes
      }

      // Update with merged attributes
      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
        {
          method: 'PATCH',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            custom_attributes: mergedAttributes
          })
        }
      )

      if (!response.ok) {
        console.error('Failed to update conversation attributes:', await response.text())
      }
    } catch (error) {
      console.error('Error updating conversation attributes:', error)
    }
  }

  /**
   * Send a simple text message to conversation
   * Used by BullMQ worker for AI responses
   *
   * This is a simpler version of sendInitialMessage for regular AI responses.
   * Returns message_id for echo detection tracking.
   */
  async sendMessage(conversationId: number, content: string, timingData?: MessageTimingData): Promise<{ message_id?: string }> {
    try {
      console.log(`📤 Sending message to conversation ${conversationId}`);

      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            message_type: 1, // Outgoing message
            private: false,
            sender: {
              type: 'agent'  // Explicitly mark as agent message
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.statusText} - ${errorText}`);
      }

      const sentMessage = await response.json();
      console.log(`✅ Message sent successfully`);

      // Extract message ID from Chatwoot response
      const messageId = sentMessage.id?.toString() || `fallback-${conversationId}-${Date.now()}`;
      const chatwootSendTime = Date.now();

      // Phase 1 Day 1: Capture Chatwoot send timestamp for SLA measurement
      if (timingData && timingData.messageId) {
        try {
          const { updateTimingData } = await import('@/lib/queue/broker-queue');
          await updateTimingData(
            conversationId,
            timingData.messageId,
            { chatwootSendTimestamp: chatwootSendTime }
          );
          console.log(`⏱️ Chatwoot send timestamp captured: ${new Date(chatwootSendTime).toISOString()}`);
        } catch (timingError) {
          console.error("❌ Failed to capture Chatwoot send timestamp:", timingError);
          // Non-critical - do not fail the send
        }
      }

      // Track for echo detection (non-blocking)
      try {
        trackBotMessage(conversationId, content, messageId);
        console.log('✅ Message tracked for echo detection:', {
          conversationId,
          messageId
        });
      } catch (trackingError) {
        // Non-blocking: Log error but don't fail the send
        console.error('⚠️ Failed to track bot message (non-critical):', trackingError);
      }

      return { message_id: messageId };

    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get widget configuration for frontend
   */
  getWidgetConfig(conversationId: number): {
    baseUrl: string
    websiteToken: string
    conversationId: number
    locale: 'en'
    position: 'right'
    hideMessageBubble: boolean
  } {
    return {
      baseUrl: this.baseUrl,
      websiteToken: this.websiteToken,
      conversationId,
      locale: 'en',
      position: 'right',
      hideMessageBubble: false
    }
  }
}


