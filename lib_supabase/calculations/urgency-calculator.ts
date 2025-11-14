/**
 * Urgency Calculator
 * Converts loan-specific urgency indicators into a unified urgency profile
 * for consistent scoring and routing across all systems
 */

export interface UrgencyProfile {
  level: 'immediate' | 'soon' | 'planning' | 'exploring'
  score: number // 0-20 for n8n scoring compatibility
  source: string // Which field determined urgency
  reason: string // Human-readable explanation
}

/**
 * Calculate unified urgency profile from loan-specific fields
 */
export function calculateUrgencyProfile(formData: any): UrgencyProfile {
  const { loanType } = formData
  
  // Map loan-specific fields to unified urgency
  switch(loanType) {
    case 'new_purchase':
      return mapPurchaseTimelineToUrgency(formData.purchaseTimeline)
    
    case 'refinance':
      return mapLockInStatusToUrgency(formData.lockInStatus)
    
    case 'commercial':
      return mapCommercialToUrgency(formData)
    
    default:
      return { 
        level: 'exploring', 
        score: 5, 
        source: 'default',
        reason: 'General mortgage inquiry'
      }
  }
}

/**
 * Map new purchase timeline to urgency profile
 */
function mapPurchaseTimelineToUrgency(timeline: string | undefined): UrgencyProfile {
  const mappings: Record<string, Omit<UrgencyProfile, 'source'>> = {
    'this_month': { 
      level: 'immediate', 
      score: 20, 
      reason: 'Property purchase planned this month - urgent pre-approval needed' 
    },
    'next_3_months': { 
      level: 'soon', 
      score: 15, 
      reason: 'Purchasing within 3 months - active property search' 
    },
    '3_6_months': { 
      level: 'planning', 
      score: 10, 
      reason: 'Planning purchase in 3-6 months - preparation phase' 
    },
    'exploring': { 
      level: 'exploring', 
      score: 5, 
      reason: 'Exploring home ownership options - research phase' 
    }
  }
  
  const mapping = mappings[timeline || ''] || mappings.exploring
  return { ...mapping, source: 'purchaseTimeline' }
}

/**
 * Map refinancing lock-in status to urgency profile
 */
function mapLockInStatusToUrgency(lockStatus: string | undefined): UrgencyProfile {
  const mappings: Record<string, Omit<UrgencyProfile, 'source'>> = {
    'ending_soon': { 
      level: 'immediate', 
      score: 20, 
      reason: 'Lock-in period ending soon - immediate action window' 
    },
    'no_lock': { 
      level: 'soon', 
      score: 15, 
      reason: 'No lock-in penalty - can refinance anytime for savings' 
    },
    'not_sure': { 
      level: 'soon', 
      score: 12, 
      reason: 'Lock-in status needs verification - potential opportunity' 
    },
    'locked': { 
      level: 'planning', 
      score: 8, 
      reason: 'Currently in lock-in period - planning for future refinance' 
    }
  }
  
  const mapping = mappings[lockStatus || ''] || mappings.not_sure
  return { ...mapping, source: 'lockInStatus' }
}

/**
 * Map commercial loan to urgency profile - Commercial goes direct to broker
 */
function mapCommercialToUrgency(formData: any): UrgencyProfile {
  // Commercial properties have high value and complexity
  // Always route to broker after basic info collection
  return {
    level: 'immediate',
    score: 19,
    source: 'commercial_loan_type',
    reason: 'Commercial property financing - specialist broker required'
  }
}

/**
 * Enhanced urgency calculation with additional signals
 */
export function calculateEnhancedUrgency(
  formData: any,
  additionalSignals?: {
    formCompletionSpeed?: number // seconds to complete
    returnVisit?: boolean
    previousAbandonment?: boolean
  }
): UrgencyProfile {
  const baseProfile = calculateUrgencyProfile(formData)
  
  // Boost score based on behavioral signals
  let adjustedScore = baseProfile.score
  
  if (additionalSignals) {
    // Fast completion indicates high intent
    if (additionalSignals.formCompletionSpeed && additionalSignals.formCompletionSpeed < 120) {
      adjustedScore = Math.min(20, adjustedScore + 2)
    }
    
    // Return visit shows continued interest
    if (additionalSignals.returnVisit) {
      adjustedScore = Math.min(20, adjustedScore + 1)
    }
    
    // Previous abandonment but returned indicates overcoming hesitation
    if (additionalSignals.previousAbandonment) {
      adjustedScore = Math.min(20, adjustedScore + 3)
    }
  }
  
  return {
    ...baseProfile,
    score: adjustedScore
  }
}

/**
 * Get urgency-based routing recommendation
 */
export function getUrgencyRouting(urgencyProfile: UrgencyProfile): {
  channel: 'phone' | 'whatsapp' | 'email'
  timing: 'immediate' | 'within_2h' | 'within_24h' | 'next_business_day'
  priority: 'urgent' | 'high' | 'medium' | 'low'
} {
  switch (urgencyProfile.level) {
    case 'immediate':
      return {
        channel: 'phone',
        timing: 'immediate',
        priority: 'urgent'
      }
    
    case 'soon':
      return {
        channel: 'whatsapp',
        timing: 'within_2h',
        priority: 'high'
      }
    
    case 'planning':
      return {
        channel: 'email',
        timing: 'within_24h',
        priority: 'medium'
      }
    
    case 'exploring':
    default:
      return {
        channel: 'email',
        timing: 'next_business_day',
        priority: 'low'
      }
  }
}

/**
 * Format urgency for display
 */
export function formatUrgencyDisplay(urgencyProfile: UrgencyProfile): {
  badge: string
  color: string
  icon: string
  message: string
} {
  const displays = {
    immediate: {
      badge: 'URGENT',
      color: 'red',
      icon: '🔥',
      message: 'Immediate attention required'
    },
    soon: {
      badge: 'PRIORITY',
      color: 'orange',
      icon: '⚡',
      message: 'Quick response needed'
    },
    planning: {
      badge: 'PLANNING',
      color: 'blue',
      icon: '📅',
      message: 'Future opportunity'
    },
    exploring: {
      badge: 'EXPLORING',
      color: 'gray',
      icon: '🔍',
      message: 'Research phase'
    }
  }
  
  return {
    ...displays[urgencyProfile.level],
    message: urgencyProfile.reason
  }
}