// ABOUTME: Extracts tiered memory facts from conversation turns for persistence
// ABOUTME: Implements Path A (event-driven persistence) from memory hydration synthesis plan

export interface MemoryFact {
  key: string;
  value: any;
  tier: 'critical' | 'firm' | 'casual';
  source: 'user' | 'ai' | 'calculation';
  confidence: number;
  timestamp: Date;
}

export interface MemorySnapshot {
  critical: MemoryFact[];
  firm: MemoryFact[];
  casual: MemoryFact[];
}

/**
 * Extract memory facts from a conversation turn
 * 
 * Memory Tiers:
 * - Critical: Confirmed facts from calculations or explicit user statements (confidence: 1.0)
 * - Firm: Strong inferences from intent patterns (confidence: 0.8-0.95)
 * - Casual: Conversation context and topic tracking (confidence: 0.5-0.75)
 * 
 * @param userMessage - The user's message text
 * @param aiResponse - The AI's response text
 * @param intent - Classified intent with category
 * @param collectedInfo - Current conversation state collected info
 * @returns MemorySnapshot with tiered facts
 */
export function extractTurnMemory(
  userMessage: string,
  aiResponse: string,
  intent: { category: string },
  collectedInfo: any
): MemorySnapshot {
  const critical: MemoryFact[] = [];
  const firm: MemoryFact[] = [];
  const casual: MemoryFact[] = [];
  const timestamp = new Date();

  // Extract critical facts from collected info (confirmed by user or calculation)
  if (collectedInfo?.lastCalculationResult) {
    const result = collectedInfo.lastCalculationResult;
    
    if (result.maxLoan) {
      critical.push({
        key: 'max_loan_amount',
        value: result.maxLoan,
        tier: 'critical',
        source: 'calculation',
        confidence: 1.0,
        timestamp
      });
    }

    if (result.monthlyPayment) {
      critical.push({
        key: 'monthly_payment',
        value: result.monthlyPayment,
        tier: 'critical',
        source: 'calculation',
        confidence: 1.0,
        timestamp
      });
    }

    if (result.ltvApplied) {
      critical.push({
        key: 'ltv_ratio',
        value: result.ltvApplied,
        tier: 'critical',
        source: 'calculation',
        confidence: 1.0,
        timestamp
      });
    }
  }

  // Extract firm facts from intent patterns
  if (intent.category === 'calculation_request') {
    firm.push({
      key: 'interested_in_calculations',
      value: true,
      tier: 'firm',
      source: 'ai',
      confidence: 0.9,
      timestamp
    });
  }

  if (intent.category === 'document_request') {
    firm.push({
      key: 'requested_documents',
      value: true,
      tier: 'firm',
      source: 'ai',
      confidence: 0.85,
      timestamp
    });
  }

  if (intent.category === 'next_steps') {
    firm.push({
      key: 'ready_to_proceed',
      value: true,
      tier: 'firm',
      source: 'ai',
      confidence: 0.9,
      timestamp
    });
  }

  // Track casual conversation context
  casual.push({
    key: 'discussed_topic',
    value: intent.category,
    tier: 'casual',
    source: 'ai',
    confidence: 0.7,
    timestamp
  });

  // Track message length as engagement indicator
  casual.push({
    key: 'user_engagement_length',
    value: userMessage.length,
    tier: 'casual',
    source: 'user',
    confidence: 0.6,
    timestamp
  });

  return { critical, firm, casual };
}
