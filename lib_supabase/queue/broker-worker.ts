import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { BrokerConversationJob } from './broker-queue';
import { classifyJobError, JobErrorType } from './broker-worker-errors';

// ============================================================================
// IMPORT EXISTING FUNCTIONS (DO NOT RECREATE THESE)
// ============================================================================
// These functions are already implemented and tested in the existing codebase.
// The worker calls them, preserving all existing business logic.

// Broker assignment and metrics
import { assignBestBroker, updateBrokerMetrics, getBrokerForConversation } from '../ai/broker-assignment';

// Broker capacity management
import { markBrokerBusy, releaseBrokerCapacity } from '../ai/broker-availability';

// Response timing calculation
import { analyzeMessageUrgency } from '../calculations/broker-persona';

// Chatwoot integration
import { ChatwootClient } from '../integrations/chatwoot-client';

// AI response generation (NEW - Phase 2)
import { generateBrokerResponse } from '@/lib/ai/broker-ai-service';

// AI Orchestrator (Week 5 - Full Intelligence Integration)
import { getAIOrchestrator } from '@/lib/ai/ai-orchestrator';
import { updateTimingData } from "./broker-queue";
import { isFullAIIntelligenceEnabled } from '../utils/feature-flags';

// Ably real-time event publishing (Stage 3)
import { publishEvent } from '../realtime/ably-server';
import { getUUIDFromChatwootId } from '@/lib/db/conversation-repository';
import { isRealtimeEnabled } from '../utils/feature-flags';
import { notifyJobFailure } from '@/lib/monitoring/alert-service';
import { checkAndEmitSLAEvents } from '@/lib/monitoring/sla-monitor';

// ============================================================================
// WORKER IMPLEMENTATION
// ============================================================================

/**
 * Process broker conversation job
 *
 * CRITICAL INTEGRATION POINTS:
 * This worker integrates with ALL existing NextNest systems without recreating them:
 *
 * 1. Broker Assignment (lib/ai/broker-assignment.ts)
 *    - assignBestBroker() - Assigns broker based on lead score
 *    - updateBrokerMetrics() - Tracks conversation metrics
 *    - getBrokerForConversation() - Retrieves assigned broker
 *
 * 2. Capacity Management (lib/ai/broker-availability.ts)
 *    - markBrokerBusy() - Increments broker workload
 *    - releaseBrokerCapacity() - Decrements broker workload
 *
 * 3. Response Timing (lib/calculations/broker-persona.ts)
 *    - analyzeMessageUrgency() - Calculates human-like delays (1-6s)
 *    - getBrokerPersona() - Retrieves broker persona definition
 *
 * 4. Chatwoot Client (lib/integrations/chatwoot-client.ts)
 *    - sendInitialMessage() - Sends greeting with deduplication
 *    - updateConversationCustomAttributes() - Stores metadata
 *    - createActivityMessage() - System notifications
 *
 * NO EXISTING FUNCTIONS ARE RECREATED HERE - ALL ARE IMPORTED AND CALLED
 */
async function processConversationJob(job: Job<BrokerConversationJob>) {
  const { data } = job;
  const startTime = Date.now();
// Phase 1 Day 1: Capture worker start timestamp for SLA measurement
  if (data.timingData && data.timingData.messageId) {
    try {
      await updateTimingData(
        data.conversationId,
        data.timingData.messageId,
        { workerStartTimestamp: startTime }
      );
      console.log(`⏱️ Worker start timestamp captured: ${new Date(startTime).toISOString()}`);
    } catch (timingError) {
      console.error("❌ Failed to capture worker start timestamp:", timingError);
      // Non-critical - do not fail the job
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Processing ${data.type} for conversation ${data.conversationId}`);
  console.log(`   Broker: ${data.brokerName || 'To be assigned'}`);
  console.log(`   Lead Score: ${data.processedLeadData.leadScore}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    if (data.type === 'new-conversation') {
      await processNewConversation(job);
    } else if (data.type === 'incoming-message') {
      await processIncomingMessage(job);
    } else {
      throw new Error(`Unknown job type: ${(data as any).type}`);
    }

    const completionTime = Date.now();
    const duration = completionTime - startTime;
    console.log(`\n✅ Job completed successfully in ${duration}ms\n`);

    // Phase 1 Day 1: Capture worker completion timestamp for SLA measurement
    if (data.timingData && data.timingData.messageId) {
      try {
        await updateTimingData(
          data.conversationId,
          data.timingData.messageId,
          { workerCompleteTimestamp: completionTime }
        );
        console.log(`⏱️ Worker completion timestamp captured: ${new Date(completionTime).toISOString()}`);
      } catch (timingError) {
        console.error("❌ Failed to capture worker completion timestamp:", timingError);
        // Non-critical - do not fail the job
      }
    }

    return {
      status: 'completed',
      conversationId: data.conversationId,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Classify error for monitoring and diagnostics
    const classifiedError = classifyJobError(error);

    // Structured error logging with error type
    console.error(`\n❌ Job failed after ${duration}ms`);
    console.error(`   Error Type: ${classifiedError.type}`);
    console.error(`   Retryable: ${classifiedError.retryable}`);
    console.error(`   Message: ${classifiedError.message}`);
    console.error(`   Attempt: ${job.attemptsMade + 1}/3`);

    // Log additional context for specific error types
    if (classifiedError.type === JobErrorType.NO_BROKERS_AVAILABLE) {
      console.error('   Diagnostic: Check broker capacity via GET /api/admin/brokers/status');
    } else if (classifiedError.type === JobErrorType.DATABASE_ERROR) {
      console.error('   Diagnostic: Check Supabase connection and query logs');
    } else if (classifiedError.type === JobErrorType.TIMEOUT_ERROR) {
      console.error('   Diagnostic: Job exceeded 30s timeout - check AI response time');
    }

    // Try to release broker capacity even on error
    if (data.brokerId) {
      try {
        await releaseBrokerCapacity(data.brokerId);
        console.log('✅ Broker capacity released after error');
      } catch (releaseError) {
        console.error('❌ Failed to release broker capacity:', releaseError);
      }
    }

    // On final failure, escalate to human
    if (job.attemptsMade >= 2) {
      console.error('❌ All retries exhausted, escalating to human');
      try {
        const chatwootClient = new ChatwootClient();
        await chatwootClient.createActivityMessage(
          data.conversationId,
          "⚠️ AI system experiencing technical difficulties. A human specialist will be with you shortly."
        );
      } catch (escalationError) {
        console.error('❌ Failed to send escalation message:', escalationError);
      }
    }

    // Attach error metadata for monitoring systems
    (error as any).errorType = classifiedError.type;
    (error as any).retryable = classifiedError.retryable;
    (error as any).attemptsMade = job.attemptsMade;
    (error as any).conversationId = data.conversationId;

    throw error; // Re-throw for BullMQ retry logic
  }
}

/**
 * Process new conversation (initial greeting)
 *
 * FLOW:
 * 1. Assign broker (EXISTING: assignBestBroker from broker-assignment.ts)
 * 2. Mark busy (EXISTING: markBrokerBusy from broker-availability.ts)
 * 3. Update attributes (EXISTING: updateConversationCustomAttributes from chatwoot-client.ts)
 * 4. Post activity (EXISTING: createActivityMessage from chatwoot-client.ts)
 * 5. Send greeting (EXISTING: sendInitialMessage from chatwoot-client.ts)
 * 6. Update metrics (EXISTING: updateBrokerMetrics from broker-assignment.ts)
 * 7. Release capacity (EXISTING: releaseBrokerCapacity from broker-availability.ts)
 */
async function processNewConversation(job: Job<BrokerConversationJob>) {
  const { data } = job;

  // STEP 1: Assign broker (EXISTING FUNCTION)
  // Location: lib/ai/broker-assignment.ts:4-144
  console.log('📊 Step 1: Assigning broker...');
  console.log('   Conversation ID:', data.conversationId);
  console.log('   Lead score:', data.processedLeadData.leadScore);
  console.log('   Loan type:', data.processedLeadData.loanType);

  const broker = await assignBestBroker(
    data.processedLeadData.leadScore,
    data.processedLeadData.loanType,
    data.processedLeadData.propertyType || data.processedLeadData.propertyCategory || '',
    data.processedLeadData.actualIncomes?.[0] || 0,
    'immediate', // timeline
    data.conversationId
  );

  if (!broker) {
    console.error('❌ CRITICAL: No broker could be assigned');
    console.error('   Conversation ID:', data.conversationId);
    console.error('   This may indicate:');
    console.error('   1. All brokers are at capacity (check broker_conversations table)');
    console.error('   2. All brokers have is_available=false (check ai_brokers table)');
    console.error('   3. Database connection issue (check Supabase logs)');
    console.error('   4. No brokers exist in database (run seed script)');
    console.error('');
    console.error('   Diagnostic steps:');
    console.error('   - Check: GET /api/admin/brokers/status');
    console.error('   - Reset: POST /api/admin/brokers/reset');
    console.error('   - Logs: Check Railway worker service logs');
    throw new Error('Failed to assign broker - no brokers available');
  }

  console.log('✅ Broker assigned:', {
    id: (broker as any).id,
    name: (broker as any).name,
    personality_type: (broker as any).personality_type,
  });

  // STEP 2: Mark broker as busy (EXISTING FUNCTION)
  // Location: lib/ai/broker-availability.ts:12-38
  // NOTE: This is already called by assignBestBroker, but we ensure it's done
  console.log('📊 Step 2: Ensuring broker capacity reserved...');
  // Already done in assignBestBroker, so we skip this

  // STEP 3: Update conversation attributes (EXISTING METHOD)
  // Location: lib/integrations/chatwoot-client.ts
  console.log('📤 Step 3: Updating conversation attributes...');
  const chatwootClient = new ChatwootClient();

  await chatwootClient.updateConversationCustomAttributes(
    data.conversationId,
    {
      broker_id: (broker as any).id,
      broker_name: (broker as any).name,
      broker_personality: (broker as any).personality_type,
      lead_score: data.processedLeadData.leadScore,
      loan_type: data.processedLeadData.loanType,
      property_type: data.processedLeadData.propertyType || data.processedLeadData.propertyCategory,
      monthly_income: data.processedLeadData.actualIncomes?.[0],
      employment_type: data.processedLeadData.employmentType,
      ai_status: 'bot_active',
    }
  );
  console.log('✅ Conversation attributes updated');

  // STEP 4: Post activity message (EXISTING METHOD with delay)
  // Location: lib/integrations/chatwoot-client.ts
  if (!data.skipGreeting) {
    console.log('📢 Step 4: Posting broker join activity...');
    await delay(500); // Human-like delay
    await chatwootClient.createActivityMessage(
      data.conversationId,
      `🤝 ${(broker as any).name} has joined the conversation`
    );
    console.log('✅ Activity message posted');
  }

  // STEP 5: Send initial greeting (EXISTING METHOD with delay)
  // Location: lib/integrations/chatwoot-client.ts:415-494
  // This method has built-in deduplication via hasExistingGreeting()
  if (!data.skipGreeting) {
    console.log('💬 Step 5: Sending initial greeting...');
    await delay(2000); // Human-like delay

    // CRITICAL: Update processedLeadData with ACTUAL assigned broker
    // The form submission had a heuristic broker, but we just assigned the REAL broker
    const updatedLeadData = {
      ...data.processedLeadData,
      brokerPersona: {
        name: (broker as any).name,
        type: (broker as any).personality_type,
        title: (broker as any).title || 'Senior Mortgage Specialist',
        approach: (broker as any).approach || 'client-focused',
        urgencyLevel: (broker as any).urgency_level || 'medium',
        avatar: (broker as any).photo_url || '',
        responseStyle: {
          tone: (broker as any).tone || 'professional',
          pacing: (broker as any).pacing || 'moderate',
          focus: (broker as any).focus || 'balanced'
        }
      }
    };

    await chatwootClient.sendInitialMessage(
      data.conversationId,
      updatedLeadData  // Use updated data with REAL broker
    );
    console.log('✅ Initial greeting sent');
  } else {
    console.log('⏭️ Step 5: Skipping greeting (conversation reopen)');
  }

  // STEP 6: Update metrics (EXISTING FUNCTION)
  // Location: lib/ai/broker-assignment.ts:167-201
  console.log('📈 Step 6: Updating broker metrics...');
  await updateBrokerMetrics(
    data.conversationId,
    (broker as any).id,
    1, // message_count
    false, // handoffTriggered
    undefined // handoffReason
  );
  console.log('✅ Metrics updated');

  // STEP 7: Release broker capacity (EXISTING FUNCTION)
  // Location: lib/ai/broker-availability.ts:40-81
  // NOTE: Capacity is managed by markBrokerBusy/releaseBrokerCapacity
  // We keep broker busy until conversation is complete or handed off
  console.log('💼 Broker remains assigned to conversation');
}

/**
 * Process incoming message (AI response)
 *
 * FLOW:
 * 1. Get broker assignment (EXISTING: getBrokerForConversation from broker-assignment.ts)
 * 2. Analyze urgency (EXISTING: analyzeMessageUrgency from broker-persona.ts)
 * 3. Wait for response timing (EXISTING LOGIC: calculated delays)
 * 4. Generate AI response (NEW: to be added in Phase 2)
 * 5. Send response (NEW METHOD: to be added to chatwoot-client.ts in Phase 2)
 * 6. Check for handoff (EXISTING: based on analyzeMessageUrgency)
 * 7. Update metrics (EXISTING: updateBrokerMetrics from broker-assignment.ts)
 * 8. Release capacity if needed (EXISTING: releaseBrokerCapacity from broker-availability.ts)
 *
 * NOTE: This function is a placeholder for Phase 2 when AI response generation is added.
 * For now, it demonstrates the integration points with existing functions.
 */
async function processIncomingMessage(job: Job<BrokerConversationJob>) {
  const { data } = job;

  // STEP 1: Get broker assignment (EXISTING FUNCTION)
  // Location: lib/ai/broker-assignment.ts:146-165
  console.log('📊 Step 1: Getting broker assignment...');
  let broker: any;

  if (data.brokerId) {
    // Broker already assigned
    broker = { id: data.brokerId, name: data.brokerName };
  } else {
    // Get from database
    broker = await getBrokerForConversation(data.conversationId);
    if (!broker) {
      throw new Error('No broker assigned to this conversation');
    }
  }
  console.log('✅ Broker found:', broker.name);

  // STEP 2: Get broker persona (from job data)
  console.log('🎭 Step 2: Getting broker persona...');
  const persona = data.brokerPersona;
  if (!persona) {
    throw new Error('Broker persona not found in job data');
  }
  console.log('✅ Persona loaded:', persona.name);

  // STEP 3: Analyze message urgency (EXISTING FUNCTION)
  // Location: lib/calculations/broker-persona.ts:154-189
  console.log('⏱️ Step 3: Analyzing message urgency...');
  const urgency = analyzeMessageUrgency(
    data.userMessage || '',
    persona
  );
  console.log('✅ Urgency analyzed:', {
    responseTime: `${urgency.responseTime}ms`,
    isUrgent: urgency.isUrgent,
    escalate: urgency.escalate,
  });

  // STEP 4: Wait for natural timing (EXISTING LOGIC)
  console.log(`⏳ Step 4: Waiting ${urgency.responseTime}ms for natural timing...`);
  await delay(urgency.responseTime);
  console.log('✅ Wait complete');

  // STEP 5: Generate AI response
  // Week 5: Route through AI Orchestrator if feature flag enabled
  console.log('🧠 Step 5: Generating AI response...');

  let aiResponse: string;
  let shouldHandoffFromAI = false;
  let aiIntent: string | undefined;
  let aiConfidence: number | undefined;
  let handoffReasonFromAI: string | undefined;

  if (isFullAIIntelligenceEnabled()) {
    console.log('🎯 Using AI Orchestrator (full intelligence enabled)');

    // Phase 2 Task 2.5: AI Segment Instrumentation
    const aiStartTime = Date.now();
    const promptLength = data.userMessage?.length || 0;
    let orchestratorPath = 'ai-orchestrator';

    // NEW PATH: Full AI Intelligence with Orchestrator
    const orchestrator = getAIOrchestrator();
    const orchestratorResponse = await orchestrator.processMessage({
      conversationId: data.conversationId,
      contactId: data.contactId,
      userMessage: data.userMessage || '',
      leadData: data.processedLeadData,
      brokerPersona: persona
    });

    const aiCompleteTime = Date.now();
    const aiProcessingTime = aiCompleteTime - aiStartTime;

    aiResponse = orchestratorResponse.content;
    aiIntent = orchestratorResponse.intent;
    // Note: aiConfidence remains undefined - will use fallback values (0.9 for Ably, 0 for metrics)
    shouldHandoffFromAI = orchestratorResponse.shouldHandoff;
    handoffReasonFromAI = orchestratorResponse.handoffReason;

    // Detect if Dr. Elena path was taken
    if (orchestratorResponse.intent?.toLowerCase().includes('elena') ||
        orchestratorResponse.model?.toLowerCase().includes('elena')) {
      orchestratorPath = 'dr-elena';
    }

    // Phase 2 Task 2.5: Capture AI segment timing data
    if (data.timingData && data.timingData.messageId) {
      try {
        await updateTimingData(
          data.conversationId,
          data.timingData.messageId,
          {
            aiSegment: {
              model: orchestratorResponse.model || 'unknown',
              promptLength,
              responseLength: aiResponse.length,
              orchestratorPath,
              aiStartTimestamp: aiStartTime,
              aiCompleteTimestamp: aiCompleteTime,
              aiProcessingTime
            }
          }
        );
        console.log(`🤖 AI segment timing captured: ${aiProcessingTime}ms (model: ${orchestratorResponse.model}, path: ${orchestratorPath})`);
      } catch (timingError) {
        console.error("❌ Failed to capture AI segment timing:", timingError);
        // Non-critical - do not fail the job
      }
    }

    console.log(`✅ AI Orchestrator response generated (${aiResponse.length} chars in ${aiProcessingTime}ms)`);
    console.log(`   Model: ${orchestratorResponse.model}`);
    console.log(`   Intent: ${orchestratorResponse.intent}`);
    console.log(`   Tokens: ${orchestratorResponse.tokensUsed}`);
    console.log(`   Path: ${orchestratorPath}`);

  } else {
    console.log('💬 Using legacy AI service (orchestrator disabled)');

    // Phase 2 Task 2.5: AI Segment Instrumentation
    const aiStartTime = Date.now();
    const promptLength = data.userMessage?.length || 0;
    let model = 'gpt-4o-mini'; // Default model
    let orchestratorPath = 'direct-ai';

    // LEGACY PATH: Direct AI generation
    aiResponse = await generateBrokerResponse({
      message: data.userMessage || '',
      persona,
      leadData: data.processedLeadData,
      conversationId: data.conversationId,
      conversationHistory: [], // TODO: Fetch from Chatwoot in future enhancement
    });

    const aiCompleteTime = Date.now();
    const aiProcessingTime = aiCompleteTime - aiStartTime;

    // Phase 2 Task 2.5: Capture AI segment timing data
    if (data.timingData && data.timingData.messageId) {
      try {
        await updateTimingData(
          data.conversationId,
          data.timingData.messageId,
          {
            aiSegment: {
              model,
              promptLength,
              responseLength: aiResponse.length,
              orchestratorPath,
              aiStartTimestamp: aiStartTime,
              aiCompleteTimestamp: aiCompleteTime,
              aiProcessingTime
            }
          }
        );
        console.log(`🤖 AI segment timing captured: ${aiProcessingTime}ms (model: ${model}, path: ${orchestratorPath})`);
      } catch (timingError) {
        console.error("❌ Failed to capture AI segment timing:", timingError);
        // Non-critical - do not fail the job
      }
    }

    console.log(`✅ Legacy AI response generated (${aiResponse.length} chars in ${aiProcessingTime}ms)`);
  }

  // STEP 6: Send response to Chatwoot (NEW METHOD - Phase 2)
  // Uses new sendMessage() method added to ChatwootClient
  console.log('📤 Step 6: Sending AI response to Chatwoot...');
  const chatwootClient = new ChatwootClient();
  const result = await chatwootClient.sendMessage(
    data.conversationId,
    aiResponse,
    // Construct full MessageTimingData for Chatwoot send timestamp capture
    data.timingData ? {
      ...data.timingData,
      conversationId: data.conversationId
    } : undefined
  );
  console.log('✅ Message sent to Chatwoot, message_id:', result.message_id);

  // STAGE 3: Ably Real-Time Event Publishing
  // Publish message:ai event after successful Chatwoot send
  // Non-blocking: Errors don't fail the job
  
  // Declare conversationUuid OUTSIDE conditional blocks so both can use it
  let conversationUuid: string | null = null;
  
  if (isRealtimeEnabled()) {
    try {
      conversationUuid = await getUUIDFromChatwootId(data.conversationId);
      if (conversationUuid) {
        await publishEvent(conversationUuid, 'message:ai', {
          text: aiResponse,
          timestamp: new Date().toISOString(),
          confidence: aiConfidence ?? 0.9,
          intent: aiIntent ?? 'general_inquiry'
        });
        console.log('✅ Published message:ai event to Ably');
      }
    } catch (ablyError) {
      // Non-blocking: Log error but don't fail the job
      console.error('❌ Failed to publish Ably event (non-blocking):', ablyError);
    }
  }



  // STAGE 3.1: SLA Monitoring
  // Check response time and emit events if needed (non-blocking)
  if (isRealtimeEnabled() && conversationUuid && data.timingData) {
    try {
      const slaResult = await checkAndEmitSLAEvents(conversationUuid, {
        ...data.timingData,
        workerCompleteTimestamp: Date.now()
      });
      
      if (slaResult.violated) {
        console.warn(`🚨 SLA VIOLATION: ${slaResult.responseTime}ms (threshold: ${slaResult.threshold}ms)`);
      } else if (slaResult.warning) {
        console.warn(`⚠️ SLA WARNING: ${slaResult.responseTime}ms (threshold: ${slaResult.threshold}ms)`);
      }
    } catch (slaError) {
      console.error('❌ Failed to check SLA (non-blocking):', slaError);
    }
  }


  // STEP 7: Check for handoff
  // Week 5: Check both urgency analysis AND AI Orchestrator recommendation
  const needsHandoff = urgency.escalate || shouldHandoffFromAI;

  if (needsHandoff) {
    const handoffReason = handoffReasonFromAI ||
                          (urgency.escalate ? 'Customer requested escalation' : 'Complex question');

    console.log('🚨 Step 7: Escalation needed, triggering handoff...');
    console.log(`   Reason: ${handoffReason}`);

    // Post activity message
    await chatwootClient.createActivityMessage(
      data.conversationId,
      '⚠️ This conversation requires human attention'
    );

    // Update conversation status (triggers human agent notification)
    await chatwootClient.updateConversationCustomAttributes(
      data.conversationId,
      {
        ai_status: 'handoff_requested',
        handoff_reason: handoffReason,
        handoff_at: new Date().toISOString(),
      }
    );

    // STAGE 6: Publish handoff:requested event and notify monitoring
    // Non-blocking: Errors don't fail the job
    try {
      const conversationUuid = await getUUIDFromChatwootId(data.conversationId);
      if (conversationUuid) {
        await publishEvent(conversationUuid, 'handoff:requested', {
          reason: handoffReason,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Published handoff:requested event to Ably');
      }
      
      const { notifyHandoffRequested } = await import('@/lib/monitoring/alert-service');
      await notifyHandoffRequested({
        conversationUuid: conversationUuid || 'unknown',
        chatwootId: data.conversationId,
        reason: handoffReason,
        aiConfidence: aiConfidence ?? 0
      });
    } catch (notificationError) {
      // Non-blocking: Log error but don't fail the job
      console.error('❌ Failed to send handoff notification (non-blocking):', notificationError);
    }

    // Release broker capacity (EXISTING FUNCTION)
    await releaseBrokerCapacity(broker.id);
    console.log('✅ Broker capacity released after handoff');

    // Update metrics with handoff flag (EXISTING FUNCTION)
    await updateBrokerMetrics(
      data.conversationId,
      broker.id,
      1, // message_count
      true, // handoffTriggered
      handoffReason
    );

    console.log('✅ Handoff completed');
    return; // Don't continue processing
  }

  // STEP 8: Update metrics (EXISTING FUNCTION)
  // No handoff - normal conversation continues
  console.log('📈 Step 8: Updating broker metrics...');
  await updateBrokerMetrics(
    data.conversationId,
    broker.id,
    1, // message_count
    false, // handoffTriggered
    undefined
  );
  console.log('✅ Metrics updated');

  // Note: Broker remains assigned (capacity NOT released until handoff or conversation ends)
}

/**
 * Helper function for delays
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lazy initialization for BullMQ worker
 *
 * IMPORTANT: Uses lazy initialization to prevent build-time execution.
 * Environment variables (REDIS_URL) are only available at runtime in Docker builds.
 *
 * CONFIGURATION:
 * - Concurrency: Set via WORKER_CONCURRENCY env var (default: 10)
 * - Rate limit: Set via QUEUE_RATE_LIMIT env var (default: 30/second)
 * - Job timeout: 30 seconds (Phase 2 requirement)
 * - Connection: Uses Redis config from redis-config.ts
 *
 * WORKER LIFECYCLE:
 * - Initialized by worker-manager.ts
 * - Runs in server environment only (not client-side)
 * - Gracefully shuts down on SIGTERM/SIGINT
 */
let _brokerWorker: Worker<BrokerConversationJob> | null = null;

export function getBrokerWorker(): Worker<BrokerConversationJob> {
  if (!_brokerWorker) {
    _brokerWorker = new Worker<BrokerConversationJob>(
      'broker-conversations',
      processConversationJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10'),
        limiter: {
          max: parseInt(process.env.QUEUE_RATE_LIMIT || '30'),
          duration: 1000,
        },
        // Phase 2: 30-second job timeout to prevent hung jobs
        lockDuration: 30000, // 30 seconds in milliseconds
      }
    );

    // Set up event handlers once
    _brokerWorker.on('completed', (job) => {
      console.log(`✅ Worker completed job ${job.id}`);
    });

    _brokerWorker.on('failed', (job, err) => {
      // Phase 2: Enhanced error logging with classification
      const errorType = (err as any).errorType || 'UNKNOWN';
      const retryable = (err as any).retryable !== false; // Default to true
      const attemptsMade = (err as any).attemptsMade || 0;

      console.error(`❌ Worker failed job ${job?.id}`);
      console.error(`   Error Type: ${errorType}`);
      console.error(`   Retryable: ${retryable}`);
      console.error(`   Attempts: ${attemptsMade + 1}/3`);
      console.error(`   Message: ${err.message}`);
    });

    _brokerWorker.on('error', (err) => {
      console.error('❌ Worker error:', err);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received, gracefully shutting down worker...`);
      await _brokerWorker!.close();
      console.log('✅ Worker closed successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('🚀 BullMQ worker initialized and ready to process jobs');
    console.log(`   Concurrency: ${process.env.WORKER_CONCURRENCY || 10}`);
    console.log(`   Rate limit: ${process.env.QUEUE_RATE_LIMIT || 30}/second`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  }
  return _brokerWorker;
}
