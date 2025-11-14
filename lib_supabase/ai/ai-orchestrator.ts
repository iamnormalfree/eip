// ABOUTME: AI Orchestrator - Central coordinator for AI chat intelligence system
// ABOUTME: Routes messages through intent classification, state management, and response generation
/**
 * AI Orchestrator - Week 5 Full AI Intelligence Integration
 *
 * Central coordinator that integrates:
 * - Intent Router: Fast classification (gpt-4o-mini)
 * - State Manager: Conversation context and token budgets
 * - Dr. Elena: Mortgage calculations with explanations
 * - Broker AI Service: Multi-model response generation
 *
 * Flow:
 * 1. Initialize or load conversation state
 * 2. Classify user intent
 * 3. Route to appropriate handler (calculation vs general)
 * 4. Generate AI response with broker persona
 * 5. Check for handoff conditions
 * 6. Update state and return response
 *
 * @module ai-orchestrator
 * @version 1.0.0
 */

import { intentRouter, IntentClassification, IntentCategory } from './intent-router';
import { ConversationStateManager } from './conversation-state-manager';
import { drElenaService } from './dr-elena-integration-service';
import { generateBrokerResponse } from './broker-ai-service';
import { BrokerPersona } from '../calculations/broker-persona';
import { ProcessedLeadData } from '../integrations/chatwoot-client';
import { ConversationState, ConversationContext, UserIntent } from '../contracts/ai-conversation-contracts';
import { updateTimingData, MessageTimingData } from "../queue/broker-queue";
import { extractTurnMemory } from './memory-extractor';

/**
 * Input parameters for message processing
 */
export interface MessageProcessingInput {
  conversationId: number;
  contactId: number;
  userMessage: string;
  leadData: ProcessedLeadData;
  brokerPersona: BrokerPersona;
  
  // Phase 1 Day 1: SLA timing data for hop-by-hop measurement
  timingData?: MessageTimingData;
}

/**
 * Response from AI orchestrator
 */
export interface OrchestratorResponse {
  content: string;
  model: string;
  tokensUsed: number;
  intent: string;
  shouldHandoff: boolean;
  handoffReason?: string;
  nextPhase?: string;
}

/**
 * AI Orchestrator Class
 * Central intelligence coordinator for all AI operations
 */
export class AIOrchestrator {
  private stateManager: ConversationStateManager;

  constructor() {
    this.stateManager = new ConversationStateManager();
  }

  /**
   * Main entry point: Process user message and generate response
   *
   * Flow:
   * 1. Get or initialize conversation state
   * 2. Classify intent
   * 3. Route to handler (calculation vs general)
   * 4. Generate response
   * 5. Check handoff conditions
   * 6. Update state
   * 7. Return response
   */
  async processMessage(input: MessageProcessingInput): Promise<OrchestratorResponse> {
    const { conversationId, contactId, userMessage, leadData, brokerPersona } = input;

    console.log(`\n🎯 AI Orchestrator: Processing message for conversation ${conversationId}`);
    console.log(`   User: ${leadData.name}`);
    console.log(`   Message: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`);

    try {
      // Step 1: Get or initialize conversation state
      let state = await this.stateManager.getState(conversationId);

      if (!state) {
        console.log('📝 Initializing new conversation state...');
        state = await this.stateManager.initializeConversation(
          conversationId,
          contactId,
          leadData,
          brokerPersona
        );
      }

      // Step 2: Classify intent
      console.log('🔍 Classifying intent...');
      const context = await this.buildConversationContext(state, userMessage);
      const intent = await intentRouter.classifyIntent(userMessage, context);

      console.log(`✅ Intent: ${intent.category} (${(intent.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   Model: ${intent.suggestedModel}`);
      console.log(`   Requires calculation: ${intent.requiresCalculation}`);

      // Step 3: Route to appropriate handler
      let responseContent: string;
      let modelUsed: string;
      let tokensEstimate: number;

      if (intent.requiresCalculation) {
        // Route to Dr. Elena for calculations
        console.log('🧮 Routing to Dr. Elena calculation engine...');
        const calcResponse = await drElenaService.processCalculationRequest({
          conversationId,
          leadData,
          brokerPersona,
          userMessage
        });

        responseContent = calcResponse.chatResponse;
        modelUsed = 'dr-elena+gpt-4o';
        tokensEstimate = 1500; // Calculation explanations are longer

      } else {
        // Route to standard AI response generation
        console.log('💬 Routing to broker AI service...');
        responseContent = await generateBrokerResponse({
          message: userMessage,
          persona: brokerPersona,
          leadData,
          conversationId,
          conversationHistory: await this.buildConversationHistory(conversationId, 10),
          timingData: input.timingData
        });

        modelUsed = intent.suggestedModel;
        tokensEstimate = this.estimateTokens(responseContent);
      }

      console.log(`✅ Response generated (${responseContent.length} chars, ~${tokensEstimate} tokens)`);

      // Step 4: Check for handoff conditions
      const shouldHandoff = intentRouter.shouldHandOffToHuman(intent, context);
      let handoffReason: string | undefined;

      if (shouldHandoff) {
        console.log('🚨 Handoff condition detected');
        handoffReason = this.determineHandoffReason(userMessage, intent, state);
      }

      // Step 5: Update conversation state
      const userIntent = this.mapIntentCategoryToUserIntent(intent.category);
      const updatedState = await this.stateManager.trackMessage(
        conversationId,
        userIntent,
        tokensEstimate
      );

      // Step 5.5: Persist memory snapshot after turn (non-blocking)
      try {
        const memoryFacts = extractTurnMemory(
          userMessage,
          responseContent,
          { category: intent.category },
          updatedState.collectedInfo
        );
        
        await this.stateManager.updateMemorySnapshot(
          conversationId.toString(),
          memoryFacts
        );
        console.log(`📸 Memory snapshot updated for conversation ${conversationId}`);
      } catch (memoryError) {
        // Non-blocking: Log error but don't fail turn
        console.error('❌ Failed to persist memory (non-blocking):', memoryError);
      }


      // Step 6: Determine next phase if needed
      const nextPhase = this.suggestNextPhase(intent, updatedState);

      console.log('✅ AI Orchestrator: Processing complete\n');

      // Step 7: Return response
      return {
        content: responseContent,
        model: modelUsed,
        tokensUsed: tokensEstimate,
        intent: intent.category,
        shouldHandoff,
        handoffReason,
        nextPhase
      };

    } catch (error) {
      console.error('❌ AI Orchestrator error:', error);

      // Fallback to safe response
      return this.generateFallbackResponse(input, error as Error);
    }
  }

  /**
   * Map IntentCategory (from intent router) to UserIntent (for state management)
   */
  private mapIntentCategoryToUserIntent(category: IntentCategory): UserIntent {
    const mapping: Record<IntentCategory, UserIntent> = {
      'greeting': 'greeting',
      'simple_question': 'question_rates',
      'calculation_request': 'question_calculation',
      'document_request': 'provide_info',
      'complex_analysis': 'question_eligibility',
      'objection_handling': 'express_concern',
      'next_steps': 'ready_to_proceed',
      'off_topic': 'unclear'
    };

    return mapping[category] || 'unclear';
  }

  /**
   * Build conversation context for intent classification
   */
  private async buildConversationContext(
    state: ConversationState,
    currentMessage: string
  ): Promise<ConversationContext> {
    return {
      user: {
        name: state.leadData.name,
        leadScore: state.leadData.leadScore,
        loanType: state.leadData.loanType
      },
      metadata: {
        turnCount: state.messageCount,
        lastUserMessage: currentMessage,
        intentHistory: state.intentHistory as any[] // Map UserIntent to string[]
      },
      memory: await this.stateManager.getMemorySnapshot(
        state.conversationId.toString()
      ) || {
        critical: [],
        firm: [],
        casual: []
      }
    };
  }

  /**
   * Build conversation history for AI context
   * Fetches recent events from Redis/Supabase and converts to OpenAI format
   * Implements TODO at line 241
   */
  async buildConversationHistory(
    conversationId: string | number,
    maxMessages: number = 10
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      // Convert to number if string
      const chatwootId = typeof conversationId === 'string' ? parseInt(conversationId) : conversationId;
      
      // Get UUID from Chatwoot ID
      const { getUUIDFromChatwootId } = await import('../db/conversation-repository');
      const conversationUuid = await getUUIDFromChatwootId(chatwootId);
      
      if (!conversationUuid) {
        console.log('No UUID found for conversation:', chatwootId);
        return [];
      }
      
      // Fetch recent events from Redis/Supabase
      const { getRecentEvents } = await import('../realtime/event-cache');
      const events = await getRecentEvents(conversationUuid, maxMessages);
      
      // Filter and convert message events to OpenAI format
      const messages = events
        .filter(e => e.eventType === 'message:user' || e.eventType === 'message:ai')
        .map(event => {
          if (event.eventType === 'message:user') {
            return {
              role: 'user' as const,
              content: (event.payload as any).text || ''
            };
          } else {
            return {
              role: 'assistant' as const,
              content: (event.payload as any).text || ''
            };
          }
        });
      
      console.log(`Built conversation history: ${messages.length} messages for conversation ${chatwootId}`);
      return messages;
    } catch (error) {
      console.error('Error building conversation history:', error);
      return []; // Graceful degradation
    }
  }


  /**
   * Estimate token count from text length
   * Rough estimate: 1 token ≈ 4 characters
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Determine handoff reason based on context
   */
  private determineHandoffReason(
    userMessage: string,
    intent: IntentClassification,
    state: ConversationState
  ): string {
    const lower = userMessage.toLowerCase();

    if (lower.includes('human') || lower.includes('real person') || lower.includes('agent')) {
      return 'Customer requested human agent';
    }

    if (state.leadData.leadScore > 80 && intent.category === 'next_steps') {
      return 'High-value lead ready for next steps';
    }

    // Check for repeated concerns (map to UserIntent 'express_concern')
    if (state.intentHistory.filter(i => i === 'express_concern').length >= 3) {
      return 'Multiple objections detected';
    }

    return 'Complex query requires human expertise';
  }

  /**
   * Suggest next conversation phase based on intent
   */
  private suggestNextPhase(
    intent: IntentClassification,
    state: ConversationState
  ): string | undefined {
    switch (intent.category) {
      case 'greeting':
        return 'qualification';
      case 'calculation_request':
        return 'recommendation';
      case 'next_steps':
        return 'closing';
      case 'objection_handling':
        return 'objection_handling';
      default:
        return undefined; // Keep current phase
    }
  }

  /**
   * Generate fallback response when orchestrator fails
   */
  private generateFallbackResponse(
    input: MessageProcessingInput,
    error: Error
  ): OrchestratorResponse {
    console.error('🛡️ Generating fallback response due to error:', error.message);

    const fallbackMessage = `${input.leadData.name}, thank you for your message. I'm experiencing a brief technical issue, but I'm here to help. Could you please rephrase your question? Or would you like me to connect you with a specialist who can assist you immediately?`;

    return {
      content: fallbackMessage,
      model: 'fallback',
      tokensUsed: 50,
      intent: 'unknown',
      shouldHandoff: true,
      handoffReason: 'Technical error in AI orchestrator'
    };
  }

  /**
   * Close connections (call on shutdown)
   */
  async disconnect(): Promise<void> {
    await this.stateManager.disconnect();
  }
}

/**
 * Singleton instance with lazy initialization
 */
let _orchestratorInstance: AIOrchestrator | null = null;

export function getAIOrchestrator(): AIOrchestrator {
  if (!_orchestratorInstance) {
    _orchestratorInstance = new AIOrchestrator();
    console.log('🚀 AI Orchestrator initialized');
  }
  return _orchestratorInstance;
}
