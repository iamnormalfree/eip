/**
 * Natural Conversation Flow Manager
 * Handles AI broker joining, personality-driven messages, and natural conversation transitions
 */

import { BrokerPersona } from '../calculations/broker-persona'

interface ConversationContext {
  conversationId: number
  userName: string
  leadScore: number
  loanType: string
  propertyType: string
  monthlyIncome: number
  messageCount: number
  isFirstMessage: boolean
  brokerName: string
  brokerPersona: 'aggressive' | 'balanced' | 'conservative'
}

interface AgentProfile {
  name: string
  personality: string
  joinDelay: number // milliseconds
  typingDelay: number // milliseconds per character
  responseStyle: string
  avatar?: string
}

// Define AI broker profiles with unique personalities (5 female brokers as per documentation)
export const AI_BROKERS: Record<string, AgentProfile> = {
  'michelle-chen': {
    name: 'Michelle Chen',
    personality: 'aggressive',
    joinDelay: 1500, // Very quick to join
    typingDelay: 12,
    responseStyle: 'confident, investment-focused, urgent',
    avatar: '/images/brokers/michelle-chen.jpg'
  },
  'sarah-wong': {
    name: 'Sarah Wong',
    personality: 'balanced',
    joinDelay: 2500,
    typingDelay: 18,
    responseStyle: 'warm, professional, informative',
    avatar: '/images/brokers/sarah-wong.jpg'
  },
  'grace-lim': {
    name: 'Grace Lim',
    personality: 'conservative',
    joinDelay: 3000,
    typingDelay: 20,
    responseStyle: 'motherly, patient, educational',
    avatar: '/images/brokers/grace-lim.jpg'
  },
  'rachel-tan': {
    name: 'Rachel Tan',
    personality: 'balanced',
    joinDelay: 2000,
    typingDelay: 16,
    responseStyle: 'modern, tech-savvy, relatable',
    avatar: '/images/brokers/rachel-tan.jpg'
  },
  'jasmine-lee': {
    name: 'Jasmine Lee',
    personality: 'aggressive',
    joinDelay: 1800,
    typingDelay: 14,
    responseStyle: 'elegant, sophisticated, exclusive',
    avatar: '/images/brokers/jasmine-lee.jpg'
  }
}

/**
 * Generate natural agent joining message
 * Instead of "Brent added AI-Broker", show natural joining
 */
export function generateAgentJoiningMessage(context: ConversationContext): {
  systemMessage: string
  agentGreeting: string
  delay: number
} {
  const broker = Object.values(AI_BROKERS).find(b => b.name === context.brokerName) || AI_BROKERS['sarah-wong']

  // Natural system message
  const systemMessage = `${broker.name} joined the conversation`

  // Generate personalized greeting based on context and personality
  const agentGreeting = generatePersonalizedGreeting(context, broker)

  return {
    systemMessage,
    agentGreeting,
    delay: broker.joinDelay
  }
}

/**
 * Generate personalized greeting based on broker personality
 */
function generatePersonalizedGreeting(context: ConversationContext, broker: AgentProfile): string {
  const { userName, leadScore, loanType, propertyType, monthlyIncome, messageCount } = context
  const timeOfDay = getTimeOfDay()

  // Different greeting styles based on personality and broker identity
  const greetings: Record<string, string[]> = {
    'aggressive': [
      // Michelle Chen - Confident Investment Banker
      `${timeOfDay} ${userName}! I'm Michelle Chen, and I just reviewed your profile - you're in an excellent position! With current rates at historic lows and my investment banking connections, we need to act fast. Let me show you what exclusive deals I can unlock for you right now.`,

      // Jasmine Lee - Elegant and Sophisticated
      `${userName}, I'm Jasmine Lee - your timing is impeccable! I specialize in premium ${propertyType} mortgages and have exclusive access to private banking rates. With your ${leadScore}/100 score and income of S$${monthlyIncome}, you qualify for our platinum tier. Shall we secure these rates before they change?`,

      `Hi ${userName}! I've just analyzed your profile and the market conditions - this is a rare opportunity. Your strong position combined with today's rates creates a perfect window. I'm ready to fast-track your application. Let's capitalize on this before the market shifts!`
    ],

    'balanced': [
      // Sarah Wong - Warm Professional
      `${timeOfDay} ${userName}, I'm Sarah Wong. Thank you for considering us for your ${loanType} mortgage needs. I've been helping families secure their dream homes for over 10 years, and I'm here to guide you through your options clearly and find the best solution for your ${propertyType} purchase.`,

      // Rachel Tan - Modern Millennial Approach
      `Hey ${userName}! I'm Rachel Tan, your mortgage specialist. I see you're exploring options for a ${propertyType} - exciting times! I'll break down everything in simple terms, use the latest tools to find you the best rates, and make this process as smooth as possible. Let's find you the perfect mortgage package!`,

      `Hello ${userName}, I'm here to help you navigate your mortgage journey. Based on your profile, you have several strong options available. I'll explain everything clearly, answer all your questions, and ensure you feel confident about your decision. What matters most to you in choosing a mortgage?`
    ],

    'conservative': [
      // Grace Lim - Motherly and Patient
      `${timeOfDay} ${userName}, I'm Grace Lim. Welcome! I've been helping families like yours for 15 years, and I understand that exploring mortgage options can feel overwhelming. I'm here to guide you through everything step by step, with absolutely no pressure. Think of me as your trusted advisor - we'll go at your pace.`,

      `Hello ${userName}, I'm Grace. I appreciate you taking the time to explore your options with us. There's no rush at all - my role is to help you understand all your choices for your ${propertyType} purchase. Feel free to ask me anything, even questions you think might be "too basic". That's what I'm here for!`,

      `Hi ${userName}, Grace here. Thank you for reaching out! I know mortgage decisions are significant life choices. I'm here to support you through the process at whatever pace feels comfortable for you. Let's start with understanding what's most important to you and your family.`
    ]
  }

  // Get personality-appropriate greeting
  const personalityGreetings = greetings[broker.personality] || greetings['balanced']
  const greeting = personalityGreetings[Math.floor(Math.random() * personalityGreetings.length)]

  // Add contextual follow-up based on lead score and urgency
  let followUp = ''

  if (leadScore >= 80 && broker.personality === 'aggressive') {
    followUp = '\n\n🎯 Quick insight: With your profile score of ' + leadScore + '/100, you\'re pre-qualified for premium rates. Should we lock something in today?'
  } else if (leadScore >= 60 && broker.personality === 'balanced') {
    followUp = '\n\nI can see you have a strong profile. What aspects of the mortgage would you like to explore first?'
  } else if (broker.personality === 'conservative') {
    followUp = '\n\nFeel free to ask me anything - I\'m here to help clarify any questions you might have.'
  }

  return greeting + followUp
}

/**
 * Generate contextual responses that feel natural
 */
export function generateNaturalResponse(
  message: string,
  context: ConversationContext,
  previousMessages: string[]
): string {
  const broker = Object.values(AI_BROKERS).find(b => b.name === context.brokerName) || AI_BROKERS['sarah-wong']

  // Add natural conversation elements
  const response = {
    acknowledgment: acknowledgeUserMessage(message, broker.personality),
    mainContent: '', // This would be filled by your existing response generation
    transition: generateTransition(context.messageCount, broker.personality),
    personalTouch: addPersonalTouch(context, broker.personality)
  }

  return `${response.acknowledgment}\n\n${response.mainContent}${response.transition}${response.personalTouch}`
}

/**
 * Acknowledge user's message naturally
 */
function acknowledgeUserMessage(message: string, personality: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('thank')) {
    return personality === 'aggressive'
      ? "Great! Let's keep the momentum going."
      : personality === 'conservative'
      ? "You're very welcome! I'm glad I could help clarify that."
      : "You're welcome! I'm here to help."
  }

  if (lower.includes('not sure') || lower.includes('confused')) {
    return personality === 'aggressive'
      ? "No worries - let me break this down quickly for you."
      : personality === 'conservative'
      ? "That's perfectly understandable - these can be complex. Let me explain more clearly."
      : "I understand. Let me clarify that for you."
  }

  if (lower.includes('yes') || lower.includes('interested')) {
    return personality === 'aggressive'
      ? "Excellent! Let's move forward immediately."
      : personality === 'conservative'
      ? "That's great to hear. Let's explore this further at your pace."
      : "Perfect! Let me show you the next steps."
  }

  return ''
}

/**
 * Add transition phrases based on conversation flow
 */
function generateTransition(messageCount: number, personality: string): string {
  if (messageCount === 3) {
    return personality === 'aggressive'
      ? '\n\n⚡ Quick question - are you looking to lock in rates this week?'
      : personality === 'conservative'
      ? '\n\nBy the way, is there any particular timeline you have in mind?'
      : '\n\nBased on what we\'ve discussed, what\'s your biggest priority right now?'
  }

  if (messageCount === 5) {
    return personality === 'aggressive'
      ? '\n\nWe\'re making great progress! Ready to see actual bank offers?'
      : personality === 'conservative'
      ? '\n\nI hope this information is helpful. What other questions do you have?'
      : '\n\nYou\'re asking great questions. Should we dive deeper into the specifics?'
  }

  if (messageCount > 7) {
    return personality === 'aggressive'
      ? '\n\n📞 At this point, a quick call would be much more efficient. Can I reach you now?'
      : personality === 'conservative'
      ? '\n\nWe\'ve covered quite a bit. Would you like me to summarize your options?'
      : '\n\nBased on everything we\'ve discussed, I can prepare a personalized proposal for you.'
  }

  return ''
}

/**
 * Add personal touches to make conversation feel human
 */
function addPersonalTouch(context: ConversationContext, personality: string): string {
  const touches: Record<string, string[]> = {
    'aggressive': [
      '\n\n💡 Pro tip: My clients who act within 48 hours typically save 0.1-0.2% on rates.',
      '\n\n🔥 Just so you know, I have 3 other clients eyeing similar properties - timing matters!',
      '\n\n⭐ You\'re exactly the type of client banks compete for. Let\'s use that leverage!'
    ],
    'balanced': [
      '\n\nI\'ve helped many clients in similar situations, so you\'re in good hands.',
      '\n\nFeel free to take notes or ask me to clarify anything.',
      '\n\nMy goal is to ensure you feel confident about your decision.'
    ],
    'conservative': [
      '\n\nThere\'s no silly questions - I\'m here to help you understand everything.',
      '\n\nTake your time reviewing this information. I\'m here when you\'re ready.',
      '\n\nRemember, this is your decision. I\'m just here to provide guidance.'
    ]
  }

  // Randomly add personal touches (not every message)
  if (Math.random() > 0.6) {
    const personalityTouches = touches[personality] || touches['balanced']
    return personalityTouches[Math.floor(Math.random() * personalityTouches.length)]
  }

  return ''
}

/**
 * Simulate typing indicator for more natural feel
 */
export function calculateTypingDuration(message: string, brokerName: string): number {
  const broker = Object.values(AI_BROKERS).find(b => b.name === brokerName) || AI_BROKERS['sarah-wong']

  // Base calculation: characters * delay per character
  const baseTime = message.length * broker.typingDelay

  // Add some randomness (±20%)
  const variation = baseTime * 0.2
  const typingTime = baseTime + (Math.random() * variation * 2 - variation)

  // Cap between 1-5 seconds
  return Math.min(Math.max(typingTime, 1000), 5000)
}

/**
 * Handle conversation state transitions
 */
export function determineConversationState(messageCount: number, leadScore: number): {
  stage: 'greeting' | 'discovery' | 'nurturing' | 'closing' | 'handoff'
  suggestedAction: string
} {
  if (messageCount <= 2) {
    return {
      stage: 'greeting',
      suggestedAction: 'Build rapport and understand needs'
    }
  }

  if (messageCount <= 5) {
    return {
      stage: 'discovery',
      suggestedAction: 'Gather information and educate'
    }
  }

  if (messageCount <= 10 && leadScore < 75) {
    return {
      stage: 'nurturing',
      suggestedAction: 'Build trust and demonstrate value'
    }
  }

  if (leadScore >= 75 && messageCount > 5) {
    return {
      stage: 'closing',
      suggestedAction: 'Move towards commitment or handoff'
    }
  }

  if (messageCount > 15 || (messageCount > 10 && leadScore >= 80)) {
    return {
      stage: 'handoff',
      suggestedAction: 'Transfer to human specialist'
    }
  }

  return {
    stage: 'nurturing',
    suggestedAction: 'Continue building relationship'
  }
}

/**
 * Generate smooth handoff message
 */
export function generateHandoffMessage(context: ConversationContext, reason: string): string {
  const { userName, brokerName } = context

  const handoffMessages = {
    'high_intent': `${userName}, you're clearly ready to move forward! I'm going to connect you with my senior colleague who specializes in fast-track approvals. They'll be with you in just a moment.`,

    'complex_case': `${userName}, your situation deserves specialized attention. Let me bring in our senior specialist who handles unique cases like yours. They'll ensure you get the best possible outcome.`,

    'long_conversation': `${userName}, we've covered a lot of ground! At this point, my colleague can provide more detailed assistance and help you with the actual application. They're available right now.`,

    'customer_request': `Of course, ${userName}! I'll connect you with one of our senior specialists immediately. They'll be able to assist you directly.`,

    'technical_issue': `${userName}, I want to ensure you get the best service. Let me connect you with a specialist who can address this more effectively.`
  }

  const message = handoffMessages[reason as keyof typeof handoffMessages] || handoffMessages['customer_request']

  return `${message}\n\n*${brokerName} is transferring you to a specialist...*`
}

// Helper functions
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format message for Chatwoot with proper delays and natural flow
 */
export async function sendNaturalMessage(
  conversationId: number,
  message: string,
  brokerName: string,
  isJoining: boolean = false
): Promise<void> {
  const broker = Object.values(AI_BROKERS).find(b => b.name === brokerName) || AI_BROKERS['sarah-wong']

  // Wait for join delay if agent is joining
  if (isJoining) {
    await new Promise(resolve => setTimeout(resolve, broker.joinDelay))

    // Send joining message
    await sendToChatwoot(conversationId, `*${brokerName} joined the conversation*`, 'system')

    // Short pause before greeting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Calculate and simulate typing
  const typingDuration = calculateTypingDuration(message, brokerName)

  // Show typing indicator (would need Chatwoot API support)
  // await showTypingIndicator(conversationId, true)

  // Wait for typing duration
  await new Promise(resolve => setTimeout(resolve, typingDuration))

  // Send the actual message
  await sendToChatwoot(conversationId, message, 'agent', brokerName)
}

/**
 * Send message to Chatwoot (simplified - actual implementation would use the API)
 */
async function sendToChatwoot(
  conversationId: number,
  message: string,
  type: 'system' | 'agent',
  agentName?: string
): Promise<void> {
  // This would integrate with your actual Chatwoot API
  console.log(`[${type}] ${agentName || 'System'}: ${message}`)
}