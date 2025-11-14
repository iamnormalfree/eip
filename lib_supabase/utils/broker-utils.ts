/**
 * Utility functions for broker system
 */

export interface BrokerInfo {
  name: string;
  slug: string;
  photo: string;
  role: string;
  personality: string;
  color: string;
}

// Map of broker names to their information
export const BROKER_INFO: Record<string, BrokerInfo> = {
  'Michelle Chen': {
    name: 'Michelle Chen',
    slug: 'michelle-chen',
    photo: '/images/brokers/michelle-chen.svg',
    role: 'Investment Property Specialist',
    personality: 'aggressive',
    color: '#DC2626'
  },
  'Sarah Wong': {
    name: 'Sarah Wong',
    slug: 'sarah-wong',
    photo: '/images/brokers/sarah-wong.svg',
    role: 'CPF & First-Time Buyer Expert',
    personality: 'balanced',
    color: '#059669'
  },
  'Grace Lim': {
    name: 'Grace Lim',
    slug: 'grace-lim',
    photo: '/images/brokers/grace-lim.svg',
    role: 'HDB Specialist',
    personality: 'conservative',
    color: '#7C3AED'
  },
  'Rachel Tan': {
    name: 'Rachel Tan',
    slug: 'rachel-tan',
    photo: '/images/brokers/rachel-tan.svg',
    role: 'Digital Mortgage Advisor',
    personality: 'modern',
    color: '#2563EB'
  },
  'Jasmine Lee': {
    name: 'Jasmine Lee',
    slug: 'jasmine-lee',
    photo: '/images/brokers/jasmine-lee.svg',
    role: 'Luxury Property Consultant',
    personality: 'exclusive',
    color: '#EA580C'
  }
};

/**
 * Get broker info by name
 */
export function getBrokerInfo(brokerName: string): BrokerInfo {
  return BROKER_INFO[brokerName] || {
    name: 'AI Assistant',
    slug: 'ai-assistant',
    photo: '/images/brokers/michelle-chen.svg', // Default to Michelle
    role: 'Mortgage Specialist',
    personality: 'balanced',
    color: '#4A90E2'
  };
}

/**
 * Get broker by lead score
 */
export function getBrokerByScore(leadScore: number): BrokerInfo {
  if (leadScore >= 85) {
    // High-value leads get Michelle or Jasmine
    return Math.random() > 0.5 ? BROKER_INFO['Michelle Chen'] : BROKER_INFO['Jasmine Lee'];
  } else if (leadScore >= 70) {
    // Professional millennials get Rachel
    return BROKER_INFO['Rachel Tan'];
  } else if (leadScore >= 50) {
    // Balanced first-time buyers get Sarah
    return BROKER_INFO['Sarah Wong'];
  } else {
    // Conservative/HDB buyers get Grace
    return BROKER_INFO['Grace Lim'];
  }
}

/**
 * Get broker greeting style
 */
export function getBrokerGreeting(brokerName: string, customerName: string): string {
  const broker = getBrokerInfo(brokerName);
  
  switch (broker.personality) {
    case 'aggressive':
      return `Hi ${customerName}! 🎯 Ready to secure the best mortgage deal? I'm ${brokerName} and I'll make sure you get maximum value!`;
    case 'balanced':
      return `Hello ${customerName}! 😊 I'm ${brokerName}, your mortgage specialist. Let me help you find the perfect financing solution.`;
    case 'conservative':
      return `Good day ${customerName}. I'm ${brokerName}, and I've been helping families with mortgages for over 20 years. How can I assist you today?`;
    case 'modern':
      return `Hey ${customerName}! 👋 I'm ${brokerName}. Let's get your mortgage sorted quickly and digitally. What are you looking for?`;
    case 'exclusive':
      return `Welcome ${customerName}. I'm ${brokerName}, specializing in premium property financing. Let's discuss your investment goals.`;
    default:
      return `Hello ${customerName}! I'm ${brokerName}, your dedicated mortgage specialist. How can I help you today?`;
  }
}