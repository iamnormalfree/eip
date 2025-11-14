/**
 * Dr. Elena AI Explanation Layer
 * Uses LLM to generate natural language explanations of mortgage calculations
 *
 * Architecture:
 * - Pure calculations: dr-elena-mortgage.ts (deterministic, no AI)
 * - AI explanations: This file (uses gpt-4o-mini for natural language)
 *
 * Cost optimization: gpt-4o-mini (~300 tokens per explanation = $0.0003)
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { BrokerPersona } from '../calculations/broker-persona';

// Legacy type for backwards compatibility
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

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface ExplanationContext {
  calculation: LoanCalculationResult;
  brokerPersona: BrokerPersona;
  userQuestion?: string;
  conversationPhase?: 'greeting' | 'discovery' | 'calculation' | 'recommendation' | 'closing';
  userProfile?: {
    name: string;
    leadScore: number;
    propertyType: string;
  };
}

export interface CalculationExplanation {
  summary: string;              // 1-2 sentence overview
  detailedBreakdown: string[];  // Step-by-step explanation
  keyInsights: string[];        // Important points to highlight
  nextSteps: string[];          // Recommended actions
  tone: 'encouraging' | 'cautionary' | 'urgent' | 'neutral';
}

// ============================================================================
// MAIN EXPLANATION FUNCTION
// ============================================================================

/**
 * Generate AI explanation of calculation results
 * Uses gpt-4o-mini for cost efficiency (~$0.0003 per call)
 */
export async function explainCalculation(
  context: ExplanationContext
): Promise<CalculationExplanation> {
  const { calculation, brokerPersona, userQuestion, userProfile } = context;

  try {
    // Build system prompt with Dr. Elena's expertise
    const systemPrompt = buildDrElenaSystemPrompt(brokerPersona, calculation);

    // Build user prompt with calculation details
    const userPrompt = buildUserPrompt(calculation, userQuestion, userProfile);

    // Call gpt-4o-mini for explanation
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7  // Some creativity for natural language
    });

    // Parse the AI response into structured format
    return parseExplanationResponse(text, calculation);

  } catch (error) {
    console.error('L AI explanation failed:', error);

    // Fallback to template-based explanation
    return generateFallbackExplanation(calculation, brokerPersona);
  }
}

/**
 * Explain specific limiting factor (TDSR/MSR/LTV)
 * Focused explanation for when user asks "why this limit?"
 */
export async function explainLimitingFactor(
  factor: 'TDSR' | 'MSR' | 'LTV',
  calculation: LoanCalculationResult,
  brokerPersona: BrokerPersona
): Promise<string> {
  const explanations = {
    TDSR: `Your Total Debt Servicing Ratio (TDSR) is the limiting factor here. MAS requires that your total monthly debt payments - including this new loan AND your existing commitments - don't exceed 55% of your gross income. Right now, you're using ${calculation.tdsrUsed}% of your income for debt servicing. This limit protects you from over-leveraging.`,

    MSR: `Your Mortgage Servicing Ratio (MSR) is the limiting factor. For HDB and EC properties, MAS requires that your housing loan payment alone doesn't exceed 30% of your gross income. Currently, your mortgage payment would be ${calculation.msrUsed}% of your income. MSR is stricter than TDSR and specifically protects first-time HDB buyers.`,

    LTV: `Your Loan-to-Value (LTV) limit of ${calculation.ltvApplied}% is the constraining factor. This is based on your property count and profile. MAS sets these limits to ensure buyers have adequate equity in their properties, reducing financial risk. ${calculation.ltvPenalty ? 'The extended tenure has reduced your LTV by 5%.' : ''}`
  };

  // Add broker persona tone
  const baseExplanation = explanations[factor];

  if (brokerPersona.responseStyle.tone.includes('warm') || brokerPersona.urgencyLevel === 'low') {
    return baseExplanation + ' This is actually a good thing - it prevents over-borrowing and protects your financial health long-term.';
  }

  if (brokerPersona.urgencyLevel === 'high') {
    return baseExplanation + ' Let us explore ways to work within this limit to secure your property.';
  }

  return baseExplanation;
}

/**
 * Generate encouraging message for good affordability
 */
export async function generateEncouragingMessage(
  calculation: LoanCalculationResult,
  brokerPersona: BrokerPersona
): Promise<string> {
  if (calculation.tdsrUsed < 45) {
    return `Great news! You're comfortably within MAS limits with ${calculation.tdsrUsed}% TDSR. You have plenty of breathing room, which means you can handle this loan comfortably even if interest rates rise slightly.`;
  }

  if (calculation.tdsrUsed >= 45 && calculation.tdsrUsed < 52) {
    return `You're in a good position with ${calculation.tdsrUsed}% TDSR. This is a healthy borrowing level that gives you some flexibility while maximizing your purchasing power.`;
  }

  if (calculation.tdsrUsed >= 52 && calculation.tdsrUsed <= 55) {
    return `Your TDSR is at ${calculation.tdsrUsed}% - close to the 55% limit. This is technically compliant, but leaves little room for error. Consider if you're comfortable with this level of financial commitment.`;
  }

  return `Your TDSR exceeds the 55% MAS limit. We need to adjust the loan amount, increase income, or reduce existing commitments to get approval.`;
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build system prompt that embeds Dr. Elena's expertise
 */
function buildDrElenaSystemPrompt(
  brokerPersona: BrokerPersona,
  calculation: LoanCalculationResult
): string {
  return `You are ${brokerPersona.name}, a ${brokerPersona.title} in Singapore.

Your personality: ${brokerPersona.responseStyle.tone}
Your approach: ${brokerPersona.approach}
Your urgency level: ${brokerPersona.urgencyLevel}

You're explaining mortgage calculation results to a client. Use Dr. Elena's MAS compliance expertise:

**Key Facts:**
- Max loan: $${calculation.maxLoan.toLocaleString()}
- Limiting factor: ${calculation.limitingFactor}
- TDSR used: ${calculation.tdsrUsed}%
- MAS compliant: ${calculation.masCompliant ? 'Yes' : 'No'}
- Warnings: ${calculation.warnings.length > 0 ? calculation.warnings.join('; ') : 'None'}

**Your task:**
1. Explain the calculation in simple terms (avoid jargon)
2. Cite MAS regulations when relevant (Notice 632 for LTV, Notice 645 for TDSR)
3. Be honest about constraints and opportunities
4. Maintain your persona's tone (${brokerPersona.responseStyle.tone})
5. Keep explanation under 100 words

**Important:**
- Always mention the limiting factor (${calculation.limitingFactor})
- If TDSR > 50%, urge caution
- If warnings exist, address them
- Be encouraging if client is well within limits
- Be educational - help them understand WHY limits exist`;
}

/**
 * Build user prompt with calculation details
 */
function buildUserPrompt(
  calculation: LoanCalculationResult,
  userQuestion?: string,
  userProfile?: { name: string; leadScore: number; propertyType: string }
): string {
  let prompt = 'Explain this mortgage calculation:\n\n';

  // Add calculation summary
  prompt += `Maximum Loan: $${calculation.maxLoan.toLocaleString()}\n`;
  prompt += `Monthly Payment: $${calculation.monthlyPayment.toLocaleString()}\n`;
  prompt += `Down Payment Required: $${calculation.downPayment.toLocaleString()}\n`;
  prompt += `Cash Required: $${calculation.minCashRequired.toLocaleString()}\n`;
  prompt += `TDSR: ${calculation.tdsrUsed}%\n`;

  if (calculation.msrUsed) {
    prompt += `MSR: ${calculation.msrUsed}%\n`;
  }

  prompt += `Limiting Factor: ${calculation.limitingFactor}\n`;
  prompt += `Tenure: ${calculation.maxTenure} years\n`;

  // Add warnings if any
  if (calculation.warnings.length > 0) {
    prompt += `\nWarnings:\n${calculation.warnings.map(w => `- ${w}`).join('\n')}\n`;
  }

  // Add user-specific context
  if (userProfile) {
    prompt += `\nClient: ${userProfile.name}\n`;
    prompt += `Property Type: ${userProfile.propertyType}\n`;
    prompt += `Lead Score: ${userProfile.leadScore}/100\n`;
  }

  // Add specific question if provided
  if (userQuestion) {
    prompt += `\nClient asked: "${userQuestion}"\n`;
  }

  prompt += '\nProvide a clear, concise explanation that addresses the key points.';

  return prompt;
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parse AI-generated explanation into structured format
 */
function parseExplanationResponse(
  aiResponse: string,
  calculation: LoanCalculationResult
): CalculationExplanation {
  // Extract summary (first paragraph)
  const paragraphs = aiResponse.split('\n\n').filter(p => p.trim());
  const summary = paragraphs[0] || aiResponse.substring(0, 200);

  // Extract key points (look for bullet points or numbered lists)
  const bulletPoints = aiResponse.match(/[-"*]\s+(.+)/g) || [];
  const keyInsights = bulletPoints.map(bp => bp.replace(/^[-"*]\s+/, '').trim());

  // Determine tone based on TDSR and warnings
  let tone: 'encouraging' | 'cautionary' | 'urgent' | 'neutral' = 'neutral';
  if (calculation.tdsrUsed < 45 && calculation.masCompliant) {
    tone = 'encouraging';
  } else if (calculation.tdsrUsed > 52 || calculation.warnings.length > 0) {
    tone = 'cautionary';
  } else if (!calculation.masCompliant) {
    tone = 'urgent';
  }

  // Generate next steps based on situation
  const nextSteps = generateNextSteps(calculation);

  return {
    summary,
    detailedBreakdown: paragraphs.slice(1),
    keyInsights: keyInsights.length > 0 ? keyInsights : [
      `Maximum loan: $${calculation.maxLoan.toLocaleString()}`,
      `${calculation.limitingFactor} is your limiting factor`,
      `TDSR: ${calculation.tdsrUsed}%`
    ],
    nextSteps,
    tone
  };
}

/**
 * Generate context-appropriate next steps
 */
function generateNextSteps(calculation: LoanCalculationResult): string[] {
  const steps: string[] = [];

  if (!calculation.masCompliant) {
    steps.push('Reduce loan amount or increase income to meet MAS requirements');
    steps.push('Consider paying down existing debts to improve TDSR');
    return steps;
  }

  if (calculation.tdsrUsed > 52) {
    steps.push('Review budget carefully - you are near the TDSR limit');
    steps.push('Consider impact of potential interest rate increases');
  }

  if (calculation.ltvPenalty) {
    steps.push('Consider shorter tenure (30 years) to avoid LTV penalty and borrow more');
  }

  if (calculation.warnings.length > 0) {
    steps.push('Address the warnings highlighted above');
  }

  // Default next steps
  if (steps.length === 0) {
    steps.push('Prepare downpayment funds (cash + CPF)');
    steps.push('Get pre-approval from banks for rate shopping');
    steps.push('Schedule property viewing if not done yet');
  }

  return steps;
}

// ============================================================================
// FALLBACK EXPLANATION (Template-based, no AI)
// ============================================================================

/**
 * Generate template-based explanation when AI fails
 * Ensures users always get some explanation
 */
function generateFallbackExplanation(
  calculation: LoanCalculationResult,
  brokerPersona: BrokerPersona
): CalculationExplanation {
  const summary = `Based on your profile, you can borrow up to $${calculation.maxLoan.toLocaleString()} with monthly payments of $${calculation.monthlyPayment.toLocaleString()}. Your ${calculation.limitingFactor} at ${calculation.tdsrUsed}% is the main constraint.`;

  const detailedBreakdown = [
    `Your maximum loan amount is $${calculation.maxLoan.toLocaleString()}, determined by your ${calculation.limitingFactor}.`,
    `Monthly payment will be $${calculation.monthlyPayment.toLocaleString()} at the MAS stress test rate of ${calculation.tdsrUsed >= 50 ? '4%' : '4% (residential)'}.`,
    `You'll need $${calculation.minCashRequired.toLocaleString()} in cash for downpayment, plus $${calculation.stampDuty.toLocaleString()} for stamp duty.`
  ];

  if (calculation.msrUsed) {
    detailedBreakdown.push(`For HDB/EC properties, your MSR is ${calculation.msrUsed}%, within the 30% limit.`);
  }

  const keyInsights = calculation.reasoning.slice(0, 3);

  const nextSteps = generateNextSteps(calculation);

  let tone: 'encouraging' | 'cautionary' | 'urgent' | 'neutral' = 'neutral';
  if (calculation.tdsrUsed < 45) tone = 'encouraging';
  else if (calculation.tdsrUsed > 52) tone = 'cautionary';
  else if (!calculation.masCompliant) tone = 'urgent';

  return {
    summary,
    detailedBreakdown,
    keyInsights,
    nextSteps,
    tone
  };
}

// ============================================================================
// SPECIALIZED EXPLANATIONS
// ============================================================================

/**
 * Explain stamp duty breakdown
 */
export function explainStampDuty(
  propertyPrice: number,
  stampDuty: number,
  citizenship: 'Citizen' | 'PR' | 'Foreigner',
  propertyCount: number
): string {
  let explanation = `Stamp duty totals $${stampDuty.toLocaleString()} for a $${propertyPrice.toLocaleString()} property. `;

  if (citizenship === 'Citizen' && propertyCount === 1) {
    explanation += 'As a Singaporean buying your first property, you only pay Buyer\'s Stamp Duty (BSD) with no ABSD.';
  } else if (citizenship === 'PR') {
    const absdRate = propertyCount === 1 ? 5 : propertyCount === 2 ? 30 : 35;
    explanation += `As a PR buying property ${propertyCount}, you pay ${absdRate}% Additional Buyer's Stamp Duty (ABSD) on top of BSD.`;
  } else if (citizenship === 'Foreigner') {
    explanation += 'As a foreigner, you pay 60% Additional Buyer\'s Stamp Duty (ABSD) on top of BSD, regardless of property count.';
  }

  return explanation;
}

/**
 * Compare two calculation scenarios
 * Useful for "what if" questions
 */
export async function compareScenarios(
  scenario1: { name: string; calculation: LoanCalculationResult },
  scenario2: { name: string; calculation: LoanCalculationResult },
  brokerPersona: BrokerPersona
): Promise<string> {
  const diff = {
    maxLoan: scenario2.calculation.maxLoan - scenario1.calculation.maxLoan,
    monthlyPayment: scenario2.calculation.monthlyPayment - scenario1.calculation.monthlyPayment,
    cashRequired: scenario2.calculation.minCashRequired - scenario1.calculation.minCashRequired
  };

  let comparison = `Comparing ${scenario1.name} vs ${scenario2.name}:\n\n`;

  comparison += `Max Loan: ${diff.maxLoan >= 0 ? '+' : ''}$${Math.abs(diff.maxLoan).toLocaleString()} `;
  comparison += `(${scenario2.calculation.maxLoan >= scenario1.calculation.maxLoan ? 'higher' : 'lower'})\n`;

  comparison += `Monthly Payment: ${diff.monthlyPayment >= 0 ? '+' : ''}$${Math.abs(diff.monthlyPayment).toLocaleString()}\n`;

  comparison += `Cash Required: ${diff.cashRequired >= 0 ? '+' : ''}$${Math.abs(diff.cashRequired).toLocaleString()}\n`;

  // Add recommendation based on broker persona
  if (brokerPersona.urgencyLevel === 'high') {
    comparison += `\nRecommendation: I'd suggest ${scenario2.calculation.maxLoan > scenario1.calculation.maxLoan ? scenario2.name : scenario1.name} to maximize your purchasing power.`;
  } else {
    comparison += `\nRecommendation: ${scenario1.calculation.tdsrUsed < scenario2.calculation.tdsrUsed ? scenario1.name : scenario2.name} gives you better financial flexibility.`;
  }

  return comparison;
}
