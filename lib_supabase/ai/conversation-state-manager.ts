/**
 * AI Chat Intelligence System - Conversation State Manager
 * 
 * Manages conversation state with Redis caching and token budget tracking.
 * Ensures conversations stay within budget while maintaining context.
 * 
 * @module conversation-state-manager
 * @version 1.0.0
 */

import Redis from 'ioredis';
import { getRedisConnection } from '../queue/redis-config';
import {
  ConversationState,
  ConversationPhase,
  UserIntent,
  TokenBudget,
  CacheKeyBuilder
} from '../contracts/ai-conversation-contracts';
import { ProcessedLeadData } from '../integrations/chatwoot-client';
import { BrokerPersona } from '../calculations/broker-persona';
import { calculationRepository } from '../db/repositories/calculation-repository';
// Legacy types for backwards compatibility - these will be removed when all consumers migrate
interface LoanCalculationInputs {
  propertyPrice: number;
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial';
  monthlyIncome: number;
  existingCommitments: number;
  age: number;
  citizenship: 'Citizen' | 'PR' | 'Foreigner';
  propertyCount: 1 | 2 | 3;
  incomeType?: 'fixed' | 'variable' | 'self_employed' | 'rental' | 'mixed';
  coApplicant?: {
    monthlyIncome: number;
    age: number;
    existingCommitments: number;
  };
}

interface LoanCalculationResult {
  maxLoan: number;
  ltvApplied: number;
  ltvPenalty: boolean;
  monthlyPayment: number;
  stressTestPayment: number;
  tdsrUsed: number;
  msrUsed: number | null;
  limitingFactor: 'TDSR' | 'MSR' | 'LTV';
  downPayment: number;
  minCashRequired: number;
  cpfAllowed: number;
  stampDuty: number;
  totalFundsRequired: number;
  maxTenure: number;
  recommendedTenure: number;
  reasoning: string[];
  masCompliant: boolean;
  warnings: string[];
}

/**
 * Redis cache key builder for conversation data
 */
const CACHE_KEYS: CacheKeyBuilder = {
  conversation: (conversationId: number) => `ai:conversation:${conversationId}`,
  intent: (conversationId: number, messageId: string) => `ai:intent:${conversationId}:${messageId}`,
  tokenBudget: (conversationId: number) => `ai:tokens:${conversationId}`
};

/**
 * Default token budget configuration
 * Target: 24,000 tokens for 20-turn conversation = 1,200 tokens/turn average
 */
const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  total: 24000,
  perMessage: 1200,
  reserved: 2000,    // Reserve for final messages
  warning: 18000     // Switch to mini model at 75% usage
};

/**
 * Conversation State Manager
 * 
 * Responsibilities:
 * - Track conversation phase and progress
 * - Manage token budget allocation
 * - Cache state in Redis for fast access
 * - Persist state to Supabase for durability
 */
export class ConversationStateManager {
  private redis: Redis | null = null;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor() {
    // Lazy initialization - Redis will be connected on first use
  }

  /**
   * Get or create Redis connection (lazy initialization)
   */
  private getRedis(): Redis {
    if (!this.redis) {
      // Cast to any to work around BullMQ ConnectionOptions vs ioredis RedisOptions type incompatibility
      // The options are compatible at runtime, just different TypeScript definitions
      this.redis = new Redis(getRedisConnection() as any);

      this.redis.on('error', (error) => {
        console.error('Redis error in ConversationStateManager:', error);
      });
    }
    return this.redis;
  }
  
  /**
   * Initialize new conversation state
   */
  async initializeConversation(
    conversationId: number,
    contactId: number,
    leadData: ProcessedLeadData,
    brokerPersona: BrokerPersona
  ): Promise<ConversationState> {
    const state: ConversationState = {
      conversationId,
      contactId,
      phase: 'greeting',
      leadData,
      brokerPersona,
      messageCount: 0,
      totalTokensUsed: 0,
      tokenBudget: DEFAULT_TOKEN_BUDGET.total,
      intentHistory: [],
      collectedInfo: {},
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    
    // Cache in Redis
    await this.saveState(state);
    
    console.log(`Initialized conversation state for ${conversationId}:`, {
      phase: state.phase,
      broker: brokerPersona.name,
      tokenBudget: state.tokenBudget
    });
    
    return state;
  }
  
  /**
   * Get conversation state (from cache or database)
   */
  async getState(conversationId: number): Promise<ConversationState | null> {
    try {
      // Try Redis cache first
      const cached = await this.getRedis().get(CACHE_KEYS.conversation(conversationId));
      
      if (cached) {
        const state = JSON.parse(cached);
        // Convert date strings back to Date objects
        state.createdAt = new Date(state.createdAt);
        state.lastMessageAt = new Date(state.lastMessageAt);
        if (state.expiresAt) state.expiresAt = new Date(state.expiresAt);
        
        return state;
      }
      
      // Fall back to Supabase if not in cache
      console.warn(`Conversation ${conversationId} not found in cache, checking Supabase...`);

      const { getSupabaseAdmin } = await import('../db/supabase-client');
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('chatwoot_conversation_id', conversationId)
        .single();

      if (error || !data) {
        console.warn(`Conversation ${conversationId} not found in Supabase either`);
        return null;
      }

      // Reconstruct ConversationState from Supabase row
      const row = data as any; // Type assertion needed due to Supabase type inference
      const state: ConversationState = {
        conversationId: row.chatwoot_conversation_id,
        contactId: row.contact_id || conversationId,
        phase: row.phase || 'greeting',
        leadData: row.lead_data,
        brokerPersona: row.broker_persona || { name: 'Default', expertise: '', approach: '', communicationStyle: '' },
        messageCount: row.message_count || 0,
        totalTokensUsed: row.tokens_used || 0,
        tokenBudget: DEFAULT_TOKEN_BUDGET.total,
        intentHistory: (row.intent_history || []) as UserIntent[],
        collectedInfo: row.collected_info || {},
        createdAt: new Date(row.created_at),
        lastMessageAt: new Date(row.last_message_at || row.created_at),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
      };

      // Cache it for future lookups
      await this.getRedis().setex(
        CACHE_KEYS.conversation(conversationId),
        this.CACHE_TTL,
        JSON.stringify(state)
      );

      console.log(`✅ Conversation ${conversationId} loaded from Supabase and cached`);
      return state;
      
    } catch (error) {
      console.error(`Error getting conversation state:`, error);
      return null;
    }
  }
  
  /**
   * Save conversation state to cache and database
   */
  async saveState(state: ConversationState): Promise<void> {
    try {
      // Update last message timestamp
      state.lastMessageAt = new Date();
      
      // Save to Redis cache (fast reads)
      await this.getRedis().setex(
        CACHE_KEYS.conversation(state.conversationId),
        this.CACHE_TTL,
        JSON.stringify(state)
      );
      
      // Persist to Supabase for durability (cold storage)
      try {
        const { getSupabaseAdmin } = await import('../db/supabase-client');
        const supabase = getSupabaseAdmin();

        const { error } = await supabase
          .from('conversations')
          .upsert(
            {
              chatwoot_conversation_id: state.conversationId,
              contact_id: state.contactId,
              phase: state.phase,
              message_count: state.messageCount,
              tokens_used: state.totalTokensUsed,
              collected_info: state.collectedInfo,
              lead_data: state.leadData,
              broker_persona: state.brokerPersona,
              created_at: state.createdAt.toISOString(),
              last_message_at: state.lastMessageAt.toISOString(),
              expires_at: state.expiresAt?.toISOString() || null
            } as any, // Type assertion needed due to Supabase type inference
            {
              onConflict: 'chatwoot_conversation_id'
            }
          )
          .select();

        if (error) {
          console.warn(`Failed to persist conversation state to Supabase: ${error.message}`);
          // Don't throw - Redis cache is primary. Log warning but allow graceful degradation
        } else {
          console.log(`✅ Conversation state persisted: ${state.conversationId}`);
        }
      } catch (supabaseError) {
        console.warn(`Error persisting conversation state to Supabase:`, supabaseError);
        // Don't throw - Redis cache is primary, Supabase is secondary
      }
      
    } catch (error) {
      console.error(`Error saving conversation state:`, error);
      throw error;
    }
  }
  
  /**
   * Update conversation phase
   */
  async updatePhase(conversationId: number, newPhase: ConversationPhase): Promise<void> {
    const state = await this.getState(conversationId);
    if (!state) throw new Error(`Conversation ${conversationId} not found`);
    
    console.log(`Phase transition: ${state.phase} -> ${newPhase}`);
    
    state.phase = newPhase;
    await this.saveState(state);
  }
  
  /**
   * Track message and update token usage
   */
  async trackMessage(
    conversationId: number,
    intent: UserIntent,
    tokensUsed: number
  ): Promise<ConversationState> {
    const state = await this.getState(conversationId);
    if (!state) throw new Error(`Conversation ${conversationId} not found`);
    
    // Update message count
    state.messageCount += 1;
    
    // Update token usage
    state.totalTokensUsed += tokensUsed;
    
    // Add intent to history (keep last 5)
    state.intentHistory.push(intent);
    if (state.intentHistory.length > 5) {
      state.intentHistory = state.intentHistory.slice(-5);
    }
    
    await this.saveState(state);
    
    // Log token budget status
    this.logTokenBudget(state);
    
    return state;
  }
  
  /**
   * Check if conversation is approaching token budget limit
   */
  isApproachingBudgetLimit(state: ConversationState): boolean {
    return state.totalTokensUsed >= DEFAULT_TOKEN_BUDGET.warning;
  }
  
  /**
   * Get remaining token budget
   */
  getRemainingBudget(state: ConversationState): number {
    return state.tokenBudget - state.totalTokensUsed;
  }
  
  /**
   * Calculate recommended tokens for next message
   */
  getRecommendedTokenLimit(state: ConversationState): number {
    const remaining = this.getRemainingBudget(state);
    const estimatedRemainingMessages = Math.max(20 - state.messageCount, 1);
    
    // Average remaining budget across expected messages
    const recommended = Math.floor(remaining / estimatedRemainingMessages);
    
    // Ensure minimum 200 tokens, maximum 2000 tokens
    return Math.max(200, Math.min(recommended, 2000));
  }
  
  /**
   * Update collected information
   */
  async updateCollectedInfo(
    conversationId: number,
    info: Partial<ConversationState['collectedInfo']>
  ): Promise<void> {
    const state = await this.getState(conversationId);
    if (!state) throw new Error(`Conversation ${conversationId} not found`);
    
    state.collectedInfo = {
      ...state.collectedInfo,
      ...info
    };
    
    await this.saveState(state);
  }
  
  /**
   * Log token budget status for monitoring
   */
  private logTokenBudget(state: ConversationState): void {
    const usage = (state.totalTokensUsed / state.tokenBudget) * 100;
    const remaining = this.getRemainingBudget(state);
    
    const emoji = usage < 50 ? '🟢' : usage < 75 ? '🟡' : '🔴';
    
    console.log(`${emoji} Token Budget [${state.conversationId}]:`, {
      used: state.totalTokensUsed,
      budget: state.tokenBudget,
      remaining,
      usage: `${usage.toFixed(1)}%`,
      messages: state.messageCount
    });
  }
  
  /**
   * Clean up expired conversations from cache
   */
  async cleanupExpired(): Promise<number> {
    // This would typically be called by a cron job
    // For now, Redis TTL handles automatic cleanup
    return 0;
  }
  
  /**
   * Record calculation in audit trail and update conversation state
   * Week 3 Phase 5: Dr. Elena Integration
   */
  async recordCalculation(
    conversationId: number,
    calculationType: 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison',
    inputs: LoanCalculationInputs,
    results: LoanCalculationResult
  ): Promise<void> {
    try {
      // Store in Supabase audit trail
      const auditId = await calculationRepository.storeCalculationAudit(
        conversationId.toString(),
        calculationType,
        inputs,
        results
      );

      console.log(`✅ Calculation recorded: ${auditId} (Type: ${calculationType}, Max Loan: $${results.maxLoan.toLocaleString()})`);

      // Update conversation state
      const state = await this.getState(conversationId);
      if (state) {
        state.collectedInfo = {
          ...state.collectedInfo,
          hasCalculatedLoan: true,
          lastCalculationType: calculationType,
          lastCalculationResult: results
        };
        await this.saveState(state);
      }
    } catch (error) {
      console.error('❌ Failed to record calculation:', error);
      // Don't throw - calculation was successful, audit failure shouldn't break flow
    }
  }

  /**
   * Update memory snapshot in Supabase for durability
   * Implements TODO at line 193
   */
  async updateMemorySnapshot(
    conversationId: string,
    snapshot: { critical: any[]; firm: any[]; casual: any[] }
  ): Promise<void> {
    try {
      const { getSupabaseAdmin } = await import('../db/supabase-client');
      const supabase = getSupabaseAdmin();
      
      const { error } = await supabase
        .from('conversations')
        .upsert(
          {
            id: conversationId,
            memory_snapshot: snapshot,
            last_activity: new Date().toISOString()
          } as any, // Type assertion needed due to Supabase type inference
          {
            onConflict: 'id'
          }
        )
        .select();
      
      if (error) {
        console.error('Failed to update memory snapshot:', error);
        throw new Error(`Memory snapshot update failed: ${error.message}`);
      }
      
      console.log('Memory snapshot updated for conversation:', conversationId);
    } catch (error) {
      console.error('Error updating memory snapshot:', error);
      throw error;
    }
  }

  /**
   * Get memory snapshot from Redis cache with Supabase fallback
   * Implements TODO at line 168
   */
  async getMemorySnapshot(
    conversationId: string
  ): Promise<{ critical: any[]; firm: any[]; casual: any[] } | null> {
    try {
      const redis = this.getRedis();
      const cacheKey = `memory:${conversationId}`;
      
      // Try Redis cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('Memory snapshot retrieved from Redis cache:', conversationId);
        return JSON.parse(cached);
      }
      
      // Fall back to Supabase if not in cache
      const { getSupabaseAdmin } = await import('../db/supabase-client');
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('memory_snapshot')
        .eq('id', conversationId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          console.log('Memory snapshot not found for conversation:', conversationId);
          return null;
        }
        console.error('Failed to retrieve memory snapshot:', error);
        throw new Error(`Memory snapshot retrieval failed: ${error.message}`);
      }
      
      const row = data as any; // Type assertion needed due to Supabase type inference
      if (!row || !row.memory_snapshot) {
        return null;
      }

      // Cache the result for future requests
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(row.memory_snapshot));

      console.log('Memory snapshot retrieved from Supabase and cached:', conversationId);
      return row.memory_snapshot;
    } catch (error) {
      console.error('Error retrieving memory snapshot:', error);
      return null; // Graceful degradation
    }
  }
  /**
   * Close Redis connection (call on shutdown)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
