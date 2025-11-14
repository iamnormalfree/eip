import { getSupabaseAdmin } from '../db/supabase-client';
import { markBrokerBusy } from './broker-availability';

export async function assignBestBroker(
  leadScore: number,
  loanType: string,
  propertyType: string,
  monthlyIncome: number,
  timeline: string,
  conversationId: number
) {
  try {
    console.log('🤖 Starting broker assignment for conversation:', conversationId);
    console.log('   Lead Score:', leadScore);
    console.log('   Loan Type:', loanType);
    
    const supabaseAdmin = getSupabaseAdmin();

    console.log('🔍 Querying available brokers for conversation:', conversationId);
    console.log('   Lead score:', leadScore, 'Loan type:', loanType);

    // Query available brokers
    const { data: brokers, error: brokersError } = await supabaseAdmin
      .from('ai_brokers')
      .select('*')
      .eq('is_active', true)
      .eq('is_available', true);

    if (brokersError) {
      console.error('❌ Error fetching brokers:', brokersError);
      console.error('   Details:', JSON.stringify(brokersError, null, 2));
      console.error('   Conversation ID:', conversationId);

      // FALLBACK: If database is not available, return a default broker
      if (process.env.DISABLE_BROKER_ASSIGNMENT === 'true') {
        console.log('⚠️ Broker assignment disabled - using default broker');
        return {
          id: 'default_broker',
          name: 'AI Mortgage Specialist',
          personality_type: 'balanced',
          is_available: true,
          slug: 'ai-specialist',
          specialization: 'general'
        };
      }

      return null;
    }

    console.log(`✅ Found ${brokers?.length || 0} available brokers for conversation ${conversationId}`);
    if (brokers && brokers.length > 0) {
      console.log('   Available brokers:', brokers.map((b: any) => ({
        name: b.name,
        personality: b.personality_type,
        workload: b.current_workload,
        max: b.max_concurrent_chats,
        available: b.is_available
      })));
    }

    // FALLBACK: If no brokers found, use default if disabled
    if (!brokers || brokers.length === 0) {
      if (process.env.DISABLE_BROKER_ASSIGNMENT === 'true') {
        console.log('⚠️ No brokers in database - using default broker');
        return {
          id: 'default_broker',
          name: 'AI Mortgage Specialist',
          personality_type: 'balanced',
          is_available: true,
          slug: 'ai-specialist',
          specialization: 'general'
        };
      }
    }

  // Assignment logic based on lead score
  let targetPersonality = 'balanced';
  if (leadScore >= 75) {
    targetPersonality = 'aggressive';
  } else if (leadScore >= 55) {
    targetPersonality = 'balanced';
  } else if (leadScore < 45) {
    targetPersonality = 'conservative';
  }

  // Special cases based on property type
  if (propertyType === 'luxury_condo' || monthlyIncome > 30000) {
    targetPersonality = 'luxury';
  }
  
  // Find best match
  let broker = brokers?.find((b: any) =>
    b.personality_type === targetPersonality
  );
  
  // Fallback to any available broker
  if (!broker && brokers && brokers.length > 0) {
    broker = brokers[0];
  }

  if (broker) {
    try {
      await markBrokerBusy(broker as any, conversationId)
    } catch (reserveError) {
      console.error('Failed to reserve broker capacity:', reserveError)
      return null
    }

    // Record assignment
    const { error: assignmentError } = await supabaseAdmin.from('broker_conversations').insert({
      conversation_id: conversationId,
      broker_id: (broker as any).id,
      lead_score: leadScore,
      loan_type: loanType,
      property_type: propertyType,
      monthly_income: monthlyIncome,
      timeline: timeline,
      assignment_method: 'auto',
      assignment_reason: `Best match based on lead score (${leadScore}) and ${targetPersonality} personality type`,
      status: 'active'
    } as any);

    if (assignmentError) {
      console.error('Error recording assignment:', assignmentError);
      // Continue even if assignment recording fails
    }

    // Update workload - temporarily disabled due to TypeScript issues
    // TODO: Fix Supabase type definitions
    /*
    const { error: updateError } = await supabaseAdmin
      .from('ai_brokers')
      .update({ current_workload: (broker as any).current_workload + 1 })
      .eq('id', (broker as any).id);

    if (updateError) {
      console.error('Error updating broker workload:', updateError);
    }
    */

    console.log('✅ Broker assigned successfully:', {
      id: (broker as any).id,
      name: (broker as any).name,
      personality_type: (broker as any).personality_type,
      conversationId
    });
    
    return broker;
  }
  
  console.log('❌ No suitable broker found for assignment');
  console.log('   Conversation ID:', conversationId);
  console.log('   Brokers queried:', brokers?.length || 0);
  console.log('   Target personality:', targetPersonality);
  return null;
  } catch (error) {
    console.error('❌ Critical error in assignBestBroker:', error);
    return null;
  }
}

export async function getBrokerForConversation(conversationId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Check existing assignment
  const { data: assignment, error } = await supabaseAdmin
    .from('broker_conversations')
    .select(`
      *,
      ai_brokers (*)
    `)
    .eq('conversation_id', conversationId)
    .single();

  if (error) {
    console.error('Error fetching broker assignment:', error);
    return null;
  }

  return (assignment as any)?.ai_brokers || null;
}

export async function updateBrokerMetrics(
  conversationId: number,
  brokerId: string,
  messageCount: number,
  handoffTriggered: boolean,
  handoffReason?: string
) {
  const supabaseAdmin = getSupabaseAdmin();
  
  const updateData: any = {
    messages_exchanged: messageCount,
    broker_messages: messageCount,
    last_message_at: new Date().toISOString()
  };

  if (handoffTriggered) {
    updateData.status = 'handoff_completed';
    updateData.handoff_at = new Date().toISOString();
    updateData.handoff_reason = handoffReason;
  }

  // Temporarily disabled due to TypeScript issues
  // TODO: Fix Supabase type definitions
  /*
  const { error } = await supabaseAdmin
    .from('broker_conversations')
    .update(updateData)
    .eq('conversation_id', conversationId)
    .eq('broker_id', brokerId);

  if (error) {
    console.error('Error updating broker metrics:', error);
  }
  */
}


