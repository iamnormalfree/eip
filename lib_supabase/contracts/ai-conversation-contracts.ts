/**
 * AI Chat Intelligence System - Type Contracts
 * 
 * Core TypeScript interfaces for the AI conversation system.
 * These contracts ensure type safety across state management, intent routing,
 * and database operations.
 * 
 * @module ai-conversation-contracts
 * @version 1.0.0
 */

import { BrokerPersona } from '../calculations/broker-persona';
import { ProcessedLeadData } from '../integrations/chatwoot-client';

/**
 * Conversation Phase - Tracks progression through the conversation lifecycle
 */
export type ConversationPhase = 
  | 'greeting'           // Initial broker introduction
  | 'qualification'      // Gathering lead information
  | 'calculation'        // Running mortgage calculations
  | 'recommendation'     // Providing personalized advice
  | 'objection_handling' // Addressing concerns
  | 'closing'            // Moving to next steps
  | 'escalation';        // Handoff to human broker

/**
 * User Intent - Classification of user message purpose
 */
export type UserIntent =
  | 'greeting'
  | 'question_rates'
  | 'question_eligibility'
  | 'question_process'
  | 'question_calculation'
  | 'provide_info'
  | 'express_concern'
  | 'request_callback'
  | 'ready_to_proceed'
  | 'unclear';

/**
 * AI Model Selection - Multi-model orchestration
 */
export type AIModel = 
  | 'gpt-4o-mini'          // 70% - Standard responses
  | 'gpt-4o'               // 20% - Complex calculations
  | 'claude-3.5-sonnet';   // 10% - Creative explanations

/**
 * Conversation Context - Lightweight context for AI operations
 * Used by intent router and other AI components
 */
export interface ConversationContext {
  user: {
    name: string;
    leadScore: number;
    loanType?: string;
  };
  metadata: {
    turnCount: number;
    lastUserMessage?: string;
    intentHistory?: string[];
  };
  memory: {
    critical: any[];
    firm: any[];
    casual: any[];
  };
}

/**
 * Conversation State - Complete state of an ongoing conversation
 */
export interface ConversationState {
  conversationId: number;
  contactId: number;
  phase: ConversationPhase;
  leadData: ProcessedLeadData;
  brokerPersona: BrokerPersona;
  
  // Conversation tracking
  messageCount: number;
  totalTokensUsed: number;
  tokenBudget: number;
  
  // Intent history (last 5 intents for context)
  intentHistory: UserIntent[];
  
  // User information gathering
  collectedInfo: {
    hasConfirmedIncome?: boolean;
    hasConfirmedPropertyPrice?: boolean;
    hasDiscussedLoanPackage?: boolean;
    preferredContactMethod?: 'call' | 'email' | 'whatsapp';
    // Dr. Elena calculation tracking (Week 3 Phase 5)
    hasCalculatedLoan?: boolean;
    lastCalculationType?: 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison';
    lastCalculationResult?: any; // LoanCalculationResult from dr-elena-mortgage.ts
  };
  
  // Timestamps
  createdAt: Date;
  lastMessageAt: Date;
  expiresAt?: Date;
}

/**
 * Intent Classification Result
 */
export interface IntentClassification {
  intent: UserIntent;
  confidence: number;
  entities: {
    propertyPrice?: number;
    loanAmount?: number;
    monthlyIncome?: number;
    preferredRate?: string;
  };
  shouldEscalate: boolean;
  suggestedPhase?: ConversationPhase;
}

/**
 * AI Response Context - Input for AI generation
 */
export interface AIResponseContext {
  conversationState: ConversationState;
  userMessage: string;
  intentClassification: IntentClassification;
  modelToUse: AIModel;
  maxTokens: number;
}

/**
 * AI Response Result
 */
export interface AIResponseResult {
  content: string;
  tokensUsed: number;
  model: AIModel;
  nextPhase?: ConversationPhase;
  shouldUpdateState?: Partial<ConversationState>;
}

/**
 * Token Budget Allocation
 */
export interface TokenBudget {
  total: 24000;           // Total budget for 20-turn conversation
  perMessage: number;     // Average per message
  reserved: number;       // Reserved for final messages
  warning: number;        // Threshold to switch to mini model
}

/**
 * Database Conversation Record
 */
export interface ConversationRecord {
  id: string;
  conversation_id: number;
  contact_id: number;
  phase: ConversationPhase;
  message_count: number;
  total_tokens_used: number;
  intent_history: UserIntent[];
  collected_info: ConversationState['collectedInfo'];
  lead_data: ProcessedLeadData;
  broker_persona: BrokerPersona;
  created_at: string;
  last_message_at: string;
  expires_at?: string;
}

/**
 * Redis Cache Key Builder
 */
export interface CacheKeyBuilder {
  conversation: (conversationId: number) => string;
  intent: (conversationId: number, messageId: string) => string;
  tokenBudget: (conversationId: number) => string;
}

/**
 * Feature Flags for AI System
 */
export interface AIFeatureFlags {
  enableMultiModelOrchestration: boolean;
  enableIntentClassification: boolean;
  enableResponseAwareness: boolean;
  enableConversationSummarization: boolean;
  enableCalculationExplanations: boolean;
  modelWeights: {
    'gpt-4o-mini': number;
    'gpt-4o': number;
    'claude-3.5-sonnet': number;
  };
}

/**
 * Calculation Explanation Contract
 * Used by Dr. Elena integration in Week 3
 */
export interface CalculationExplanation {
  calculationType: 'affordability' | 'tdsr' | 'msr' | 'loan_comparison';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  explanation: string;
  formula: string;
  masCompliant: boolean;
}
