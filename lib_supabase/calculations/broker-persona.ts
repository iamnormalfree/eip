/**
 * Broker Persona Calculation Module
 * Maps lead scores to appropriate AI broker personas
 */

export interface BrokerPersona {
  type: 'aggressive' | 'balanced' | 'conservative'
  name: string
  title: string
  approach: string
  urgencyLevel: 'high' | 'medium' | 'low'
  avatar: string
  responseStyle: {
    tone: string
    pacing: string
    focus: string
  }
}

/**
 * Calculate broker persona based on lead score and form data
 * Higher scores get more aggressive, sales-focused brokers
 * Lower scores get more educational, supportive brokers
 */
export function calculateBrokerPersona(leadScore: number, formData: any): BrokerPersona {
  // Premium leads (90-100): Investment specialist
  if (leadScore >= 90) {
    return {
      type: 'aggressive',
      name: 'Michelle Chen',
      title: 'Investment Property Specialist',
      approach: 'premium_rates_focus',
      urgencyLevel: 'high',
      avatar: '/images/brokers/michelle-chen.svg',
      responseStyle: {
        tone: 'confident, strategic, results-oriented',
        pacing: 'fast - exclusive opportunities',
        focus: 'investment strategies, portfolio growth'
      }
    }
  }

  // Luxury leads (75-89): High-end specialist
  if (leadScore >= 75) {
    return {
      type: 'aggressive',
      name: 'Jasmine Lee',
      title: 'Luxury Property Specialist',
      approach: 'premium_rates_focus',
      urgencyLevel: 'high',
      avatar: '/images/brokers/jasmine-lee.svg',
      responseStyle: {
        tone: 'sophisticated, exclusive, premium',
        pacing: 'fast - limited opportunities',
        focus: 'exclusive rates, premium service'
      }
    }
  }

  // Young professionals (60-74): Modern approach
  if (leadScore >= 60) {
    return {
      type: 'balanced',
      name: 'Rachel Tan',
      title: 'Millennial Mortgage Specialist',
      approach: 'educational_consultative',
      urgencyLevel: 'medium',
      avatar: '/images/brokers/rachel-tan.svg',
      responseStyle: {
        tone: 'modern, tech-savvy, approachable',
        pacing: 'moderate - digital-first guidance',
        focus: 'smart financing, future planning'
      }
    }
  }

  // Standard leads (45-59): Balanced approach
  if (leadScore >= 45) {
    return {
      type: 'balanced',
      name: 'Sarah Wong',
      title: 'Family Mortgage Consultant',
      approach: 'educational_consultative',
      urgencyLevel: 'medium',
      avatar: '/images/brokers/sarah-wong.svg',
      responseStyle: {
        tone: 'warm, family-focused, trustworthy',
        pacing: 'moderate - educate then guide',
        focus: 'family needs, stable solutions'
      }
    }
  }

  // First-time buyers (0-44): Supportive approach
  return {
    type: 'conservative',
    name: 'Grace Lim',
    title: 'First-Time Buyer Specialist',
    approach: 'value_focused_supportive',
    urgencyLevel: 'low',
    avatar: '/images/brokers/grace-lim.svg',
    responseStyle: {
      tone: 'motherly, patient, educational',
      pacing: 'slow - build trust and understanding',
      focus: 'education, step-by-step guidance'
    }
  }
}

/**
 * Get broker availability message based on urgency level
 */
export function getBrokerAvailability(persona: BrokerPersona): string {
  switch (persona.urgencyLevel) {
    case 'high':
      return 'Available now - Priority response within 2 minutes'
    case 'medium':
      return 'Available - Will respond within 5 minutes'
    case 'low':
      return 'Available - Here to help at your pace'
    default:
      return 'Available to assist you'
  }
}

/**
 * Generate initial greeting based on broker persona
 */
export function generatePersonaGreeting(persona: BrokerPersona, customerName: string): string {
  switch (persona.name) {
    case 'Michelle Chen':
      return `Hi ${customerName}! I'm Michelle, your Investment Property Specialist. I've been monitoring exclusive investment opportunities and have access to rates that aren't publicly available. Let's maximize your portfolio returns today! ðŸš€`

    case 'Jasmine Lee':
      return `Hello ${customerName}! I'm Jasmine, your Luxury Property Specialist. I work exclusively with premium properties and have access to sophisticated financing solutions. Let's secure your exclusive rates today! âœ¨`

    case 'Rachel Tan':
      return `Hey ${customerName}! I'm Rachel, your Millennial Mortgage Specialist. I specialize in smart, tech-forward financing solutions for young professionals. What are your goals? ðŸ“±`

    case 'Sarah Wong':
      return `Hello ${customerName}! I'm Sarah, your Family Mortgage Consultant. I'm here to help you find the perfect home financing solution for your family's needs. What's most important to you? ðŸ `

    case 'Grace Lim':
      return `Welcome ${customerName}! I'm Grace, your First-Time Buyer Specialist. I understand this can feel overwhelming, so I'm here to guide you through every step with care. What questions can I answer? ðŸ˜Š`

    default:
      return `Hello ${customerName}! I'm here to help with your mortgage needs.`
  }
}

/**
 * Determine response urgency based on message content
 */
export function analyzeMessageUrgency(message: string, persona: BrokerPersona): {
  isUrgent: boolean
  responseTime: number
  escalate: boolean
} {
  const urgentKeywords = [
    'urgent', 'asap', 'immediately', 'now', 'today',
    'emergency', 'quick', 'fast', 'hurry'
  ]
  
  const escalationKeywords = [
    'speak to human', 'real person', 'manager', 'supervisor',
    'complaint', 'not happy', 'frustrated'
  ]
  
  const messageLower = message.toLowerCase()
  const hasUrgentKeyword = urgentKeywords.some(keyword => messageLower.includes(keyword))
  const needsEscalation = escalationKeywords.some(keyword => messageLower.includes(keyword))
  
  // Adjust response time based on persona and urgency
  let responseTime = 5000 // Default 5 seconds
  
  if (persona.type === 'aggressive') {
    responseTime = hasUrgentKeyword ? 1000 : 2000
  } else if (persona.type === 'balanced') {
    responseTime = hasUrgentKeyword ? 2000 : 4000
  } else {
    responseTime = hasUrgentKeyword ? 3000 : 6000
  }
  
  return {
    isUrgent: hasUrgentKeyword,
    responseTime,
    escalate: needsEscalation
  }
}

/**
 * Get persona-specific conversation starters
 */
export function getConversationStarters(persona: BrokerPersona): string[] {
  switch (persona.type) {
    case 'aggressive':
      return [
        "What's your timeline for securing this loan?",
        "Are you ready to lock in today's rates?",
        "How much are you looking to save monthly?"
      ]
    
    case 'balanced':
      return [
        "What type of property are you looking at?",
        "Have you compared different loan packages?",
        "What's most important - low rates or flexibility?"
      ]
    
    case 'conservative':
      return [
        "Is this your first home purchase?",
        "What questions do you have about the process?",
        "How can I help make this clearer for you?"
      ]
    
    default:
      return ["How can I help you today?"]
  }
}
