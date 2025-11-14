/**
 * Intent Router - Fast classification using gpt-4o-mini
 *
 * Routes user messages to appropriate response generation strategy:
 * - Simple Q&A → gpt-4o-mini
 * - Calculation requests → Dr. Elena pure functions + gpt-4o explanation
 * - Complex analysis → claude-3.5-sonnet
 *
 * Token budget: ~200 tokens per classification
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ConversationContext } from '../contracts/ai-conversation-contracts';

export type IntentCategory =
  | 'greeting'
  | 'simple_question'
  | 'calculation_request'
  | 'document_request'
  | 'complex_analysis'
  | 'objection_handling'
  | 'next_steps'
  | 'off_topic';

export interface IntentClassification {
  category: IntentCategory;
  confidence: number;
  requiresCalculation: boolean;
  suggestedModel: 'gpt-4o-mini' | 'gpt-4o' | 'claude-3.5-sonnet';
  reasoning: string;
}

export class IntentRouter {
  /**
   * Classify user intent using fast LLM (gpt-4o-mini)
   * Falls back to heuristic classification if AI fails
   */
  async classifyIntent(
    userMessage: string,
    conversationContext?: ConversationContext
  ): Promise<IntentClassification> {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        system: this.getClassificationSystemPrompt(),
        prompt: this.buildClassificationPrompt(userMessage, conversationContext),
        temperature: 0.3
      });

      return this.parseClassificationResult(text);
    } catch (error) {
      console.warn('⚠️ Intent classification AI failed, using heuristics:', error);
      return this.heuristicClassification(userMessage);
    }
  }

  private getClassificationSystemPrompt(): string {
    return `You are an intent classifier for mortgage advisory conversations in Singapore.

Classify user messages into ONE of these categories:

1. **greeting** - Hi, hello, how are you, etc.
2. **simple_question** - Basic info questions answerable from context (e.g., "What's the interest rate?")
3. **calculation_request** - Requires mortgage calculations (e.g., "How much can I borrow?", "What's my monthly payment?")
4. **document_request** - Asking for documents, forms, reports
5. **complex_analysis** - Multi-factor analysis (e.g., "Should I buy now or wait?", "Compare HDB vs condo investment")
6. **objection_handling** - Concerns, doubts, pushback (e.g., "This seems expensive", "I'm not sure")
7. **next_steps** - Ready to proceed, schedule meeting, apply
8. **off_topic** - Unrelated to mortgages

Respond in JSON format:
{
  "category": "simple_question",
  "confidence": 0.85,
  "requiresCalculation": false,
  "suggestedModel": "gpt-4o-mini",
  "reasoning": "User asking about interest rates, straightforward info query"
}

Model selection guidelines:
- gpt-4o-mini: greetings, simple questions, next steps
- gpt-4o: calculation explanations (after Dr. Elena computes)
- claude-3.5-sonnet: complex analysis, multi-factor decisions`;
  }

  private buildClassificationPrompt(
    userMessage: string,
    context?: ConversationContext
  ): string {
    let prompt = `Classify this message: "${userMessage}"`;

    if (context) {
      prompt += `\n\nConversation context:`;
      prompt += `\n- User: ${context.user.name}`;
      prompt += `\n- Loan type: ${context.user.loanType || 'not specified'}`;
      prompt += `\n- Lead score: ${context.user.leadScore}/100`;
      prompt += `\n- Conversation turns: ${context.metadata.turnCount}`;

      if (context.memory.critical.length > 0) {
        prompt += `\n- Known facts: ${context.memory.critical.slice(0, 3).map((f: any) => f.fact).join(', ')}`;
      }
    }

    return prompt;
  }

  private parseClassificationResult(text: string): IntentClassification {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          category: parsed.category as IntentCategory,
          confidence: parsed.confidence || 0.7,
          requiresCalculation: parsed.requiresCalculation || false,
          suggestedModel: parsed.suggestedModel || 'gpt-4o-mini',
          reasoning: parsed.reasoning || 'No reasoning provided',
        };
      }

      throw new Error('No JSON found in response');
    } catch (error) {
      console.warn('⚠️ Failed to parse AI classification, using fallback');
      return this.heuristicClassification(text);
    }
  }

  /**
   * Fallback classification using keyword matching
   * Used when AI classification fails
   */
  private heuristicClassification(message: string): IntentClassification {
    const lower = message.toLowerCase();

    // Greeting patterns
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lower)) {
      return {
        category: 'greeting',
        confidence: 0.9,
        requiresCalculation: false,
        suggestedModel: 'gpt-4o-mini',
        reasoning: 'Heuristic: Greeting detected',
      };
    }

    // Calculation patterns
    if (/(how much|can i (borrow|afford)|monthly payment|loan amount|interest rate|tdsr|msr|cpf)/i.test(lower)) {
      return {
        category: 'calculation_request',
        confidence: 0.8,
        requiresCalculation: true,
        suggestedModel: 'gpt-4o',
        reasoning: 'Heuristic: Calculation keywords detected',
      };
    }

    // Document patterns
    if (/(document|form|report|paperwork|download|send me)/i.test(lower)) {
      return {
        category: 'document_request',
        confidence: 0.85,
        requiresCalculation: false,
        suggestedModel: 'gpt-4o-mini',
        reasoning: 'Heuristic: Document request keywords',
      };
    }

    // Complex analysis patterns
    if (/(should i|compare|better|worse|invest|worth it|analyze)/i.test(lower)) {
      return {
        category: 'complex_analysis',
        confidence: 0.7,
        requiresCalculation: false,
        suggestedModel: 'claude-3.5-sonnet',
        reasoning: 'Heuristic: Complex decision keywords',
      };
    }

    // Next steps patterns
    if (/(apply|proceed|schedule|meet|appointment|ready|let's go|sign up)/i.test(lower)) {
      return {
        category: 'next_steps',
        confidence: 0.85,
        requiresCalculation: false,
        suggestedModel: 'gpt-4o-mini',
        reasoning: 'Heuristic: Action/commitment keywords',
      };
    }

    // Objection patterns
    if (/(expensive|too much|not sure|worried|concern|hesitant|doubt)/i.test(lower)) {
      return {
        category: 'objection_handling',
        confidence: 0.75,
        requiresCalculation: false,
        suggestedModel: 'gpt-4o',
        reasoning: 'Heuristic: Objection keywords detected',
      };
    }

    // Default to simple question
    return {
      category: 'simple_question',
      confidence: 0.6,
      requiresCalculation: false,
      suggestedModel: 'gpt-4o-mini',
      reasoning: 'Heuristic: Default classification',
    };
  }

  /**
   * Determine if conversation should hand off to human broker
   * Based on intent patterns and conversation state
   */
  shouldHandOffToHuman(
    classification: IntentClassification,
    context: ConversationContext
  ): boolean {
    // Hand off if user explicitly asks for human
    if (context.metadata.lastUserMessage?.toLowerCase().includes('human') ||
        context.metadata.lastUserMessage?.toLowerCase().includes('real person')) {
      return true;
    }

    // Hand off if repeated objections (3+ objection intents in last 5 turns)
    const recentObjections = context.metadata.intentHistory
      ?.slice(-5)
      .filter((i: any) => i === 'objection_handling')
      .length || 0;

    if (recentObjections >= 3) {
      console.log('🚨 Multiple objections detected, recommending human handoff');
      return true;
    }

    // Hand off if high-value lead (score > 80) wants next steps
    if (context.user.leadScore > 80 && classification.category === 'next_steps') {
      console.log('💎 High-value lead ready for next steps, recommending human handoff');
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const intentRouter = new IntentRouter();
