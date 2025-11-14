/**
 * Conversation deduplication logic
 * Prevents creating multiple conversations for the same user within a time window
 */

import { ChatwootClient } from './chatwoot-client'

interface DeduplicationResult {
  shouldCreateNew: boolean
  existingConversationId?: number
  reason: string
}

export class ConversationDeduplicator {
  private client: ChatwootClient
  private readonly REUSE_WINDOW_MINUTES = 30

  constructor(client: ChatwootClient) {
    this.client = client
  }

  /**
   * Check if we should create a new conversation or reuse existing
   */
  async checkForExistingConversation(
    contactId: number,
    loanType: string
  ): Promise<DeduplicationResult> {
    try {
      // Get conversations for this contact
      const response = await fetch(
        `${this.client.apiBaseUrl}/api/v1/accounts/${this.client.apiAccountId}/contacts/${contactId}/conversations`,
        {
          headers: {
            'Api-Access-Token': this.client.apiAccessToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.warn('Could not fetch conversations for deduplication check')
        return {
          shouldCreateNew: true,
          reason: 'Unable to check existing conversations'
        }
      }

      const data = await response.json()

      // Add detailed logging to inspect API response
      console.log('📥 Chatwoot API Response:', {
        hasPayload: !!data.payload,
        conversationCount: data.payload?.length || data?.length || 0,
        firstConversation: data.payload?.[0] || data?.[0]
      })

      const conversations = data.payload || data || []

      // Filter for open/pending conversations (guard against null/undefined entries)
      const activeConversations = conversations.filter(
        (conv: any) => conv && (conv.status === 'open' || conv.status === 'pending')
      )

      if (activeConversations.length === 0) {
        return {
          shouldCreateNew: true,
          reason: 'No active conversations found'
        }
      }

      // Check the most recent conversation
      const mostRecent = activeConversations[0]

      // Log the entire conversation object to see what fields are available
      console.log('📋 Most Recent Conversation Object:', {
        id: mostRecent.id,
        status: mostRecent.status,
        hasCustomAttributes: !!mostRecent.custom_attributes,
        customAttributesKeys: mostRecent.custom_attributes ? Object.keys(mostRecent.custom_attributes) : [],
        fullObject: JSON.stringify(mostRecent, null, 2)
      })

      // If custom_attributes are not in the list response, fetch the individual conversation
      let conversationDetails = mostRecent
      if (!mostRecent.custom_attributes) {
        console.log(`🔄 Fetching full conversation details for ID ${mostRecent.id}...`)

        const detailResponse = await fetch(
          `${this.client.apiBaseUrl}/api/v1/accounts/${this.client.apiAccountId}/conversations/${mostRecent.id}`,
          {
            headers: {
              'Api-Access-Token': this.client.apiAccessToken,
              'Content-Type': 'application/json'
            }
          }
        )

        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          conversationDetails = detailData

          console.log('📋 Detailed Conversation Response:', {
            id: conversationDetails.id,
            hasCustomAttributes: !!conversationDetails.custom_attributes,
            customAttributesKeys: conversationDetails.custom_attributes ? Object.keys(conversationDetails.custom_attributes) : [],
            customAttributes: conversationDetails.custom_attributes
          })
        } else {
          console.warn(`Could not fetch conversation details for ID ${mostRecent.id}`)
        }
      }

      const createdAt = new Date(conversationDetails.created_at * 1000)
      const minutesAgo = (Date.now() - createdAt.getTime()) / (1000 * 60)

      // Debug loan type comparison
      console.log('🔍 Loan type comparison debug:', {
        conversationId: conversationDetails.id,
        storedLoanType: conversationDetails.custom_attributes?.loan_type,
        incomingLoanType: loanType,
        allAttributes: conversationDetails.custom_attributes
      })

      // Check if it's the same loan type
      const sameLoanType = conversationDetails.custom_attributes?.loan_type === loanType

      // Reuse if: same loan type AND within time window
      if (sameLoanType && minutesAgo <= this.REUSE_WINDOW_MINUTES) {
        console.log(`♻️ Reusing conversation ${conversationDetails.id} (${minutesAgo.toFixed(1)} minutes old)`)

        // Add a note to the conversation
        await this.addResubmissionNote(conversationDetails.id)

        return {
          shouldCreateNew: false,
          existingConversationId: conversationDetails.id,
          reason: `Reusing conversation from ${minutesAgo.toFixed(0)} minutes ago`
        }
      }

      // Create new if different loan type or outside window
      return {
        shouldCreateNew: true,
        reason: sameLoanType
          ? `Previous conversation is ${minutesAgo.toFixed(0)} minutes old (> ${this.REUSE_WINDOW_MINUTES} min)`
          : 'Different loan type from previous conversation'
      }

    } catch (error) {
      console.error('Error in deduplication check:', error)
      return {
        shouldCreateNew: true,
        reason: 'Error checking for duplicates - creating new as fallback'
      }
    }
  }

  /**
   * Add a note when reusing conversation
   */
  private async addResubmissionNote(conversationId: number): Promise<void> {
    try {
      const noteContent = `📝 Customer resubmitted form at ${new Date().toLocaleString('en-SG')}. Please review updated information in contact details.`

      await fetch(
        `${this.client.apiBaseUrl}/api/v1/accounts/${this.client.apiAccountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.client.apiAccessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: noteContent,
            message_type: 2,  // Activity message
            private: false
          })
        }
      )
    } catch (error) {
      console.error('Could not add resubmission note:', error)
      // Non-critical, don't throw
    }
  }
}

// Export singleton getter that reuses ChatwootClient instance
let deduplicatorInstance: ConversationDeduplicator | null = null

export function getConversationDeduplicator(client: ChatwootClient): ConversationDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new ConversationDeduplicator(client)
  }
  return deduplicatorInstance
}