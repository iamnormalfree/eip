import { getSupabaseAdmin } from '../db/supabase-client'
import { Database } from '../../lib_supabase/db/types/database.types'

// Use the proper Database type from Supabase
type BrokerRecord = Database['public']['Tables']['ai_brokers']['Row']
type BrokerUpdate = Database['public']['Tables']['ai_brokers']['Update']

// Type for partial broker data from select queries
type BrokerCapacityData = Pick<BrokerRecord, 'current_workload' | 'active_conversations' | 'max_concurrent_chats'>

const DEFAULT_MAX_CONCURRENT_CHATS = 1

export async function markBrokerBusy(broker: BrokerRecord, conversationId?: number) {
  const supabaseAdmin = getSupabaseAdmin()

  const currentWorkload = Math.max(broker.current_workload ?? 0, 0)
  const maxConcurrent = Math.max(broker.max_concurrent_chats ?? DEFAULT_MAX_CONCURRENT_CHATS, 1)
  const newWorkload = Math.min(currentWorkload + 1, maxConcurrent)
  const newActiveCount = Math.max((broker.active_conversations ?? 0) + 1, 1)

  // Type-safe update data - validated as BrokerUpdate
  const updateData: BrokerUpdate = {
    current_workload: newWorkload,
    active_conversations: newActiveCount,
    is_available: newWorkload < maxConcurrent,
    last_active_at: new Date().toISOString()
  }

  // Use explicit type casting to work around Supabase v2.75.0 type bug
  // The .update() method is incorrectly typed, so we cast the entire chain
  const { data, error } = await (supabaseAdmin
    .from('ai_brokers') as any)
    .update(updateData)
    .eq('id', broker.id)
    .select()

  if (error) {
    console.error('❌ Failed to mark broker busy:', error)
    console.error('   Broker ID:', broker.id)
    console.error('   Update data:', updateData)
    throw new Error('Failed to reserve broker capacity')
  }

  // Verify the update actually happened
  if (!data || data.length === 0) {
    console.error('⚠️ Broker update returned no rows - broker may not exist')
    console.error('   Broker ID:', broker.id)
    throw new Error('Failed to reserve broker capacity - broker not found')
  }

  console.log('✅ Broker capacity reserved:', {
    brokerId: broker.id,
    brokerName: broker.name,
    conversationId,
    oldWorkload: currentWorkload,
    newWorkload,
    maxConcurrent,
    nowAvailable: newWorkload < maxConcurrent
  })
}

export async function releaseBrokerCapacity(brokerId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: broker, error: fetchError } = await supabaseAdmin
    .from('ai_brokers')
    .select('current_workload, active_conversations, max_concurrent_chats')
    .eq('id', brokerId)
    .maybeSingle()

  if (fetchError) {
    console.error('Failed to fetch broker for release:', fetchError)
    return
  }

  if (!broker) {
    console.warn('Attempted to release broker capacity for unknown broker', brokerId)
    return
  }

  // Type-safe access to broker properties using Pick<> utility type
  const brokerData = broker as BrokerCapacityData
  
  const maxConcurrent = Math.max(brokerData.max_concurrent_chats ?? DEFAULT_MAX_CONCURRENT_CHATS, 1)
  const currentWorkload = Math.max(brokerData.current_workload ?? 0, 0)
  const newWorkload = Math.max(currentWorkload - 1, 0)
  const activeConversations = Math.max(brokerData.active_conversations ?? 0, 0)
  const newActiveCount = Math.max(activeConversations - 1, 0)

  // Type-safe update data - validated as BrokerUpdate
  const updateData: BrokerUpdate = {
    current_workload: newWorkload,
    active_conversations: newActiveCount,
    is_available: newWorkload < maxConcurrent,
    updated_at: new Date().toISOString()
  }

  // Use explicit type casting to work around Supabase v2.75.0 type bug
  const { error: updateError } = await (supabaseAdmin
    .from('ai_brokers') as any)
    .update(updateData)
    .eq('id', brokerId)

  if (updateError) {
    console.error('Failed to release broker capacity:', updateError)
    return
  }

  console.log('🔓 Broker capacity released', { brokerId, newWorkload, maxConcurrent })
}
