/**
 * Conversation Repository - Supabase cold storage
 *
 * Handles persistent storage of:
 * - Conversation metadata
 * - Conversation turns (user/assistant messages)
 * - Calculation audit trail
 *
 * Works in tandem with ConversationStateManager (Redis hot storage)
 */

import { getSupabaseAdmin } from './supabase-client';
import {
  ConversationContext
} from '../contracts/ai-conversation-contracts';

// Define types specific to database operations
interface ConversationTurn {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  timestamp?: Date;
  tokensUsed?: number;
}

interface CalculationAudit {
  conversationId: string;
  calculationType: string;
  inputs: any;
  results: any;
  timestamp: Date;
  masCompliant: boolean;
}

export class ConversationRepository {
  /**
   * Store conversation metadata and memory snapshot
   */
  async storeConversation(context: any): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('conversations')
      .upsert({
        id: context.conversationId,
        user_id: context.user?.email || context.user?.name,
        created_at: context.metadata?.startedAt || new Date().toISOString(),
        last_activity: new Date().toISOString(),
        memory_snapshot: context.memory || {},
        broker_persona: context.broker?.persona?.name || 'default',
        lead_score: context.user?.leadScore || 0,
        loan_type: context.user?.loanType || 'unknown',
      } as any, {
        onConflict: 'id',
      });

    if (error) {
      console.error('❌ Failed to store conversation:', error);
      throw new Error(`Conversation storage failed: ${error.message}`);
    }

    console.log(`✅ Stored conversation ${context.conversationId}`);
  }

  /**
   * Store individual conversation turn
   */
  async storeTurn(turn: any): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('conversation_turns')
      .insert({
        id: turn.id,
        conversation_id: turn.conversationId,
        role: turn.role,
        content: turn.content,
        timestamp: turn.timestamp,
        token_count: turn.tokenCount,
        model_used: turn.modelUsed,
        intent_classification: turn.intentClassification,
        metadata: turn.metadata,
      } as any);

    if (error) {
      console.error('❌ Failed to store turn:', error);
      throw new Error(`Turn storage failed: ${error.message}`);
    }
  }

  /**
   * Store calculation audit for Dr. Elena compliance tracking
   */
  async storeCalculationAudit(audit: any): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('calculation_audit')
      .insert({
        conversation_id: audit.conversationId,
        calculation_type: audit.calculationType,
        inputs: audit.inputs,
        results: audit.results,
        timestamp: audit.timestamp,
        mas_compliant: audit.masCompliant,
        regulatory_notes: audit.regulatoryNotes,
      } as any);

    if (error) {
      console.error('❌ Failed to store calculation audit:', error);
      throw new Error(`Calculation audit failed: ${error.message}`);
    }

    console.log(`✅ Stored calculation audit: ${audit.calculationType}`);
  }

  /**
   * Retrieve conversation history from cold storage
   * Used when Redis hot memory expires (after 1 hour)
   */
  async getConversation(conversationId: string): Promise<ConversationContext | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('❌ Failed to retrieve conversation:', error);
      throw new Error(`Conversation retrieval failed: ${error.message}`);
    }

    // Type assertion needed due to Supabase type inference
    const row = data as any;

    // Reconstruct ConversationContext from stored data
    // Note: This is a simplified reconstruction
    // Full context includes more fields populated from ProcessedLeadData
    return {
      conversationId: row.id,
      user: {
        name: row.user_id, // Simplified - should lookup user details
        email: row.user_id,
        leadScore: row.lead_score,
        loanType: row.loan_type,
      },
      memory: row.memory_snapshot,
      metadata: {
        startedAt: row.created_at,
        lastActivity: row.last_activity,
        turnCount: 0, // Will be populated by getTurns
      },
    } as ConversationContext;
  }

  /**
   * Get conversation turns (paginated)
   */
  async getTurns(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Failed to retrieve turns:', error);
      throw new Error(`Turn retrieval failed: ${error.message}`);
    }

    // Type assertion needed due to Supabase type inference
    return (data as any[]).map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      tokenCount: row.token_count,
      modelUsed: row.model_used,
      intentClassification: row.intent_classification,
      metadata: row.metadata,
    }));
  }

  /**
   * Get calculation audit trail for a conversation
   * Used for compliance reporting and debugging
   */
  async getCalculationAudits(conversationId: string): Promise<any[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('calculation_audit')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Failed to retrieve calculation audits:', error);
      throw new Error(`Calculation audit retrieval failed: ${error.message}`);
    }

    // Type assertion needed due to Supabase type inference
    return (data as any[]).map(row => ({
      conversationId: row.conversation_id,
      calculationType: row.calculation_type,
      inputs: row.inputs,
      results: row.results,
      timestamp: row.timestamp,
      masCompliant: row.mas_compliant,
      regulatoryNotes: row.regulatory_notes,
    }));
  }

  /**
   * Get conversation statistics for analytics
   */
  async getConversationStats(conversationId: string) {
    const { data: turnData, error: turnError } = await getSupabaseAdmin()
      .from('conversation_turns')
      .select('token_count, model_used')
      .eq('conversation_id', conversationId);

    if (turnError) {
      console.error('❌ Failed to get stats:', turnError);
      return null;
    }

    // Type assertion needed due to Supabase type inference
    const rows = turnData as any[];
    const totalTokens = rows.reduce((sum, turn) => sum + (turn.token_count || 0), 0);
    const modelDistribution = rows.reduce((dist, turn) => {
      const model = turn.model_used || 'unknown';
      dist[model] = (dist[model] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      totalTurns: turnData.length,
      totalTokens,
      modelDistribution,
    };
  }

  /**
   * Archive old conversations (soft delete)
   * Keeps data for compliance but marks as archived
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await (getSupabaseAdmin() as any)
      .from('conversations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Failed to archive conversation:', error);
      throw new Error(`Conversation archival failed: ${error.message}`);
    }

    console.log(`📦 Archived conversation ${conversationId}`);
  }
}

// Export singleton instance
export const conversationRepository = new ConversationRepository();

/**
 * Upsert a secure conversation UUID mapping
 * @param chatwootConversationId - Numeric Chatwoot conversation ID
 * @param email - Lead email for validation
 * @returns UUID for the conversation
 */
export async function upsertSecureConversationId(
  chatwootConversationId: number | null,
  email: string
): Promise<string> {
  if (!chatwootConversationId) {
    throw new Error('chatwoot_conversation_id is required');
  }
  
  // Hash the email for privacy (not storing raw PII)
  const crypto = require('crypto');
  const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  
  const { getSupabaseAdmin } = await import('../db/supabase-client');
  const supabase = getSupabaseAdmin();
  
  // Upsert: if chatwoot_conversation_id exists, return existing UUID
  // Otherwise create new row with generated UUID
  const { data, error } = await supabase
    .from('conversation_secure_ids')
    .upsert(
      {
        chatwoot_conversation_id: chatwootConversationId,
        lead_email_hash: emailHash,
      } as any, // Type assertion needed due to Supabase type inference
      {
        onConflict: 'chatwoot_conversation_id',
        ignoreDuplicates: false,
      }
    )
    .select('conversation_uuid')
    .single();
  
  if (error) {
    console.error('❌ Failed to upsert secure conversation ID:', error);
    throw new Error(`Secure conversation ID upsert failed: ${error.message}`);
  }

  const row = data as any; // Type assertion needed due to Supabase type inference
  return row.conversation_uuid;
}

/**
 * Get Chatwoot conversation ID from secure UUID
 * @param conversationUuid - Public-facing UUID

/**
 * Get Chatwoot conversation ID from secure UUID
 * @param conversationUuid - Public-facing UUID
 * @returns Chatwoot conversation ID or null if not found
 */
export async function getChatwootIdFromUUID(
  conversationUuid: string
): Promise<number | null> {
  if (!conversationUuid || !conversationUuid.match(/^[0-9a-f-]{36}$/i)) {
    throw new Error('Invalid UUID format');
  }
  
  const { getSupabaseAdmin } = await import('../db/supabase-client');
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('conversation_secure_ids')
    .select('chatwoot_conversation_id')
    .eq('conversation_uuid', conversationUuid)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('❌ Failed to get chatwoot ID from UUID:', error);
    throw new Error(`UUID lookup failed: ${error.message}`);
  }

  const row = data as any; // Type assertion needed due to Supabase type inference
  return row.chatwoot_conversation_id;
}

/**
 * Get UUID from Chatwoot conversation ID (reverse lookup)
 * Uses Redis cache with 1-hour TTL for performance
 * @param chatwootConversationId - Numeric Chatwoot conversation ID
 * @returns UUID string or null if not found
 */
export async function getUUIDFromChatwootId(
  chatwootConversationId: number
): Promise<string | null> {
  if (!chatwootConversationId) {
    throw new Error('chatwoot_conversation_id is required');
  }
  
  // Try Redis cache first
  try {
    const Redis = require('ioredis');
    const { getRedisConnection } = await import('../queue/redis-config');
    const redis = new Redis(getRedisConnection());
    
    const cacheKey = `conversation:chatwoot:${chatwootConversationId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      await redis.quit();
      return cached;
    }
    
    // Cache miss - fetch from database
    const { getSupabaseAdmin } = await import('../db/supabase-client');
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('conversation_secure_ids')
      .select('conversation_uuid')
      .eq('chatwoot_conversation_id', chatwootConversationId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        await redis.quit();
        return null;
      }
      await redis.quit();
      throw new Error(`Chatwoot ID lookup failed: ${error.message}`);
    }
    
    // Store in cache with 1-hour TTL
    const row = data as any; // Type assertion needed due to Supabase type inference
    await redis.setex(cacheKey, 3600, row.conversation_uuid);
    await redis.quit();

    return row.conversation_uuid;
  } catch (error) {
    console.error('❌ Redis error, falling back to database:', error);
    
    // Fallback to database without caching
    const { getSupabaseAdmin } = await import('../db/supabase-client');
    const supabase = getSupabaseAdmin();
    
    const { data, error: dbError } = await supabase
      .from('conversation_secure_ids')
      .select('conversation_uuid')
      .eq('chatwoot_conversation_id', chatwootConversationId)
      .single();
    
    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Chatwoot ID lookup failed: ${dbError.message}`);
    }

    const row2 = data as any; // Type assertion needed due to Supabase type inference
    return row2.conversation_uuid;
  }
}
