/**
 * AI Broker Service - Vercel AI SDK Integration
 *
 * Generates AI broker responses using existing persona system from broker-persona.ts
 *
 * CRITICAL: This service REUSES existing types and persona definitions
 * - BrokerPersona from lib/calculations/broker-persona.ts
 * - ProcessedLeadData from lib/integrations/chatwoot-client.ts
 *
 * DOES NOT RECREATE any existing persona logic or types
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { BrokerPersona } from '../calculations/broker-persona';
import { ProcessedLeadData } from '../integrations/chatwoot-client';
import { intentRouter, IntentClassification } from './intent-router';
import { drElenaService } from './dr-elena-integration-service';
import { MessageTimingData } from '../queue/broker-queue';

/**
 * Input parameters for AI response generation
 */
interface GenerateBrokerResponseInput {
  message: string;
  persona: BrokerPersona;
  leadData: ProcessedLeadData;
  conversationId: number;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;

  // Phase 1 Day 1: SLA timing data for hop-by-hop measurement
  timingData?: MessageTimingData;
}


/**
 * Select appropriate model provider based on model name
 * Week 4 Phase 2: Multi-model orchestration support
 */
function selectModelProvider(modelName: string) {
  if (modelName.startsWith('claude')) {
    console.log(`🤖 Using Anthropic provider for: ${modelName}`);
    return anthropic(modelName);
  }
  console.log(`🤖 Using OpenAI provider for: ${modelName}`);
  return openai(modelName);
}

/**
 * Generate AI broker response using Vercel AI SDK
 *
 * Week 3 Enhancement: Integrates Dr. Elena mortgage calculations
 * Week 4 Phase 2: Multi-model orchestration (OpenAI + Anthropic)
 *
 * Flow:
 * 1. Classify intent (calculation vs general question)
 * 2. If calculation required → Use Dr. Elena pure calculations + AI explanation
 * 3. Otherwise → Use standard AI response generation
 * 4. Model provider selection: OpenAI (gpt-*) or Anthropic (claude-*)
 *
 * Uses existing persona definitions from lib/calculations/broker-persona.ts:
 * - Michelle Chen (aggressive, investment) - lines 27-41
 * - Jasmine Lee (aggressive, luxury) - lines 44-58
 * - Rachel Tan (balanced, millennial) - lines 61-75
 * - Sarah Wong (balanced, family) - lines 78-92
 * - Grace Lim (conservative, first-time) - lines 95-108
 *
 * @param input - Message context and persona information
 * @returns AI-generated response string
 */
export async function generateBrokerResponse(
  input: GenerateBrokerResponseInput
): Promise<string> {
  const { message, persona, leadData, conversationId, conversationHistory = [] } = input;

  console.log(`🧠 Generating ${persona.type} response for ${persona.name}`);
  console.log(`   Conversation: ${conversationId}`);
  console.log(`   Lead Score: ${leadData.leadScore}`);

  try {
    // Step 1: Classify intent
    const intent = await classifyUserIntent(message, leadData, conversationHistory);

    console.log(`🎯 Intent: ${intent.category} (${intent.confidence * 100}% confidence)`);

    // Step 2: Route to Dr. Elena if calculation is required
    if (intent.requiresCalculation) {
      console.log(`🧮 Routing to Dr. Elena calculation engine...`);

      const calculationResponse = await drElenaService.processCalculationRequest({
        conversationId,
        leadData,
        brokerPersona: persona,
        userMessage: message
      });

      console.log(`✅ Dr. Elena response generated (${calculationResponse.chatResponse.length} chars)`);

      return calculationResponse.chatResponse;
    }

    // Step 3: Standard AI response for non-calculation queries
    console.log(`💬 Using standard AI response generation...`);

    // Create system prompt from existing persona properties
    const systemPrompt = createSystemPromptFromPersona(persona, leadData);

    // Phase 2 Task 2.5: Optimization - default to gpt-4o-mini for short messages
    let optimizedModel = intent.suggestedModel;

    // Override with faster model for short messages (< 100 chars) to improve latency
    if (message.length < 100 && intent.suggestedModel !== 'gpt-4o-mini') {
      console.log(`⚡ Optimization: Using gpt-4o-mini for short message (${message.length} chars) instead of ${intent.suggestedModel}`);
      optimizedModel = 'gpt-4o-mini';
    }

    // Select provider based on optimized model name
    const model = selectModelProvider(optimizedModel);

    // Generate response with Vercel AI SDK
    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
    });

    console.log(`✅ Generated response (${text.length} chars)`);

    return text;

  } catch (error) {
    console.error(`❌ AI generation failed for conversation ${conversationId}:`, error);

    // Fallback to template-based response
    console.log('⚠️ Using fallback template response');
    return getFallbackResponse(persona, message);
  }
}

/**
 * Classify user intent using Intent Router
 * Week 3: Added to enable smart routing to Dr. Elena calculations
 */
async function classifyUserIntent(
  message: string,
  leadData: ProcessedLeadData,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<IntentClassification> {
  try {
    // Build conversation context for intent classification
    const context = {
      user: {
        name: leadData.name,
        leadScore: leadData.leadScore,
        loanType: leadData.loanType
      },
      metadata: {
        turnCount: conversationHistory.length,
        lastUserMessage: message,
        intentHistory: []
      },
      memory: {
        critical: [],
        firm: [],
        casual: []
      }
    };

    return await intentRouter.classifyIntent(message, context);

  } catch (error) {
    console.error('Intent classification failed, using fallback:', error);

    // Fallback: Detect calculation keywords manually
    const lower = message.toLowerCase();
    const isCalculation = /(how much|can i (borrow|afford)|monthly payment|loan amount|calculate|tdsr|msr)/i.test(lower);

    return {
      category: isCalculation ? 'calculation_request' : 'simple_question',
      confidence: 0.6,
      requiresCalculation: isCalculation,
      suggestedModel: isCalculation ? 'gpt-4o' : 'gpt-4o-mini',
      reasoning: 'Fallback heuristic classification'
    };
  }
}

/**
 * Create system prompt from existing broker persona
 *
 * Uses properties from BrokerPersona (lib/calculations/broker-persona.ts):
 * - persona.name
 * - persona.title
 * - persona.type (aggressive/balanced/conservative)
 * - persona.approach
 * - persona.urgencyLevel
 * - persona.responseStyle.tone
 * - persona.responseStyle.pacing
 * - persona.responseStyle.focus
 *
 * DOES NOT RECREATE persona logic - just formats existing properties into prompt
 */
function createSystemPromptFromPersona(
  persona: BrokerPersona,
  leadData: ProcessedLeadData
): string {
  // Base prompt for all brokers
  const basePrompt = `You are ${persona.name}, a ${persona.title} at EIP Mortgage Advisory in Singapore.

## Your Personality & Style:
- Broker Type: ${persona.type}
- Tone: ${persona.responseStyle.tone}
- Pacing: ${persona.responseStyle.pacing}
- Focus: ${persona.responseStyle.focus}
- Approach: ${persona.approach}
- Urgency Level: ${persona.urgencyLevel}

## Customer Context:
- Name: ${leadData.name}
- Lead Score: ${leadData.leadScore}/100
- Loan Type: ${leadData.loanType?.replace(/_/g, ' ') || 'not specified'}
- Property: ${leadData.propertyCategory || leadData.propertyType || 'not specified'}
- Monthly Income: S$${leadData.actualIncomes?.[0]?.toLocaleString() || 'not specified'}
- Employment: ${leadData.employmentType || 'not specified'}
${leadData.existingCommitments ? `- Existing Commitments: S$${leadData.existingCommitments.toLocaleString()}` : ''}
${leadData.propertyPrice ? `- Property Price: S$${leadData.propertyPrice.toLocaleString()}` : ''}

## Guidelines:
1. Stay in character - respond exactly as ${persona.name} would based on your personality type
2. Focus on Singapore mortgage market (HDB, private property, BTO, investment properties)
3. Be specific with numbers when possible, use realistic ranges (e.g., "1.5%-2.5% interest rates")
4. Keep responses concise (2-3 short paragraphs maximum)
5. End with a specific question to continue conversation naturally
6. Never make up bank names or specific rates - use ranges instead
7. If asked complex legal/compliance questions, acknowledge limits and offer human specialist

## Important Rules:
- Never provide regulated financial advice (e.g., "you should invest in X")
- If customer seems frustrated → acknowledge and offer human connection
- Stay warm and helpful, matching your ${persona.type} persona tone
- Use Singapore context (CPF, HDB, TDSR, MSR, private property, condo)
- Reference customer's lead score to gauge sophistication of response`;

  // Add persona-specific additions based on type
  switch (persona.type) {
    case 'aggressive':
      return basePrompt + `\n\n## ${persona.type.toUpperCase()} Style Additions:
- Emphasize urgency: "limited time", "exclusive rates", "secure now"
- Focus on ROI and investment gains
- Use data and numbers confidently
- Create sense of opportunity and FOMO
- Be action-oriented and decisive
- Push for commitment but stay professional
- Example phrases: "${persona.responseStyle.tone}"`;

    case 'conservative':
      return basePrompt + `\n\n## ${persona.type.toUpperCase()} Style Additions:
- Be patient and educational: "let's take this step by step"
- Break down complex concepts into simple language
- Use reassuring language: "no pressure", "at your pace", "we'll work through this together"
- Prioritize understanding over speed
- Be warm, caring, almost parental in tone
- Encourage questions and validate concerns
- Example phrases: "${persona.responseStyle.tone}"`;

    case 'balanced':
    default:
      return basePrompt + `\n\n## ${persona.type.toUpperCase()} Style Additions:
- Be professional yet approachable
- Balance speed with thoroughness
- Provide clear explanations with actionable steps
- Modern and tech-savvy communication style
- Efficient but not pushy
- Mix data with personal touch
- Example phrases: "${persona.responseStyle.tone}"`;
  }
}

/**
 * Fallback response when AI fails
 *
 * Uses existing persona greeting templates as reference
 * Location: lib/calculations/broker-persona.ts lines 129-149
 *
 * DOES NOT RECREATE greeting logic - provides simple fallback only
 */
function getFallbackResponse(persona: BrokerPersona, message: string): string {
  const fallbacks = {
    aggressive: `Thank you for reaching out! I'm experiencing a brief technical issue, but I'm here to help you maximize your mortgage opportunity. Can you tell me more about your property goals? I'll make sure we secure the best rates for you.`,

    balanced: `Thanks for your message! I'm having a small technical hiccup, but I'm still here to assist you. Could you share more details about what you're looking for? I want to make sure I provide you with the most relevant information.`,

    conservative: `Hello! I appreciate your patience. I'm experiencing a minor technical issue, but I'm absolutely here to help you. Please don't worry - we'll take this step by step. What questions can I answer for you?`,
  };

  return fallbacks[persona.type] || fallbacks.balanced;
}

/**
 * Streaming version for future real-time chat UI
 * (Optional - not used in current Chatwoot integration)
 *
 * Week 4 Phase 2: Multi-model orchestration support
 *
 * Can be used for future enhancements where streaming responses are needed
 */
export async function streamBrokerResponse(
  input: GenerateBrokerResponseInput
) {
  const { message, persona, leadData, conversationHistory = [] } = input;

  const systemPrompt = createSystemPromptFromPersona(persona, leadData);

  const { streamText } = await import('ai');

  // Default to GPT-4 Turbo for streaming, with provider selection
  const model = selectModelProvider('gpt-4-turbo');

  return streamText({
    model,
    system: systemPrompt,
    messages: [
      ...conversationHistory,
      { role: 'user', content: message }
    ],
    temperature: 0.7,
  });
}

// Export for Task 2.3 (Persona Validation)
export { createSystemPromptFromPersona };
