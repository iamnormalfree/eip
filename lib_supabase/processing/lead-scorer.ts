import { MortgageFormData } from '@/lib/validation/mortgage-schemas'

export interface LeadScore {
  total: number
  breakdown: {
    financial: number
    urgency: number
    sophistication: number
    engagement: number
    likelihood: number
  }
  category: 'premium' | 'qualified' | 'nurture' | 'cold'
  priority: 'high' | 'medium' | 'low'
  routing: {
    assignTo: 'senior_advisor' | 'specialist' | 'junior_advisor' | 'automated'
    responseTime: '2_hours' | '4_hours' | '24_hours' | '48_hours'
    followUpSequence: 'premium' | 'standard' | 'educational' | 'minimal'
  }
  insights: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
  }
}

export class LeadScorer {
  
  static calculateScore(formData: MortgageFormData, aiContext?: any): LeadScore {
    const breakdown = {
      financial: this.calculateFinancialScore(formData),
      urgency: this.calculateUrgencyScore(formData),
      sophistication: this.calculateSophisticationScore(formData),
      engagement: this.calculateEngagementScore(formData, aiContext),
      likelihood: this.calculateLikelihoodScore(formData)
    }

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0) / 5
    
    const category = this.determineCategory(total)
    const priority = this.determinePriority(breakdown, total)
    const routing = this.determineRouting(category, priority, formData)
    const insights = this.generateInsights(formData, breakdown, total)

    return {
      total: Math.round(total * 10) / 10,
      breakdown,
      category,
      priority,
      routing,
      insights
    }
  }

  private static calculateFinancialScore(formData: MortgageFormData): number {
    let score = 0

    // Loan amount/property value scoring
    if (formData.loanType === 'new_purchase') {
      const price = (formData as any).priceRange || 0
      if (price >= 2000000) score += 10      // Luxury
      else if (price >= 1200000) score += 8  // Premium
      else if (price >= 600000) score += 6   // Mid-market
      else score += 4                        // Budget
    }

    if (formData.loanType === 'refinance') {
      const loan = (formData as any).outstandingLoan || 0
      if (loan >= 1500000) score += 10
      else if (loan >= 800000) score += 8
      else if (loan >= 400000) score += 6
      else score += 4
    }

    // Commercial loans (handled via extended formData type)
    const loanType = formData.loanType as string;
    if (loanType === 'commercial') {
      const propertyValue = (formData as any).propertyValue || 0
      const income = (formData as any).monthlyIncome || 0
      if (propertyValue >= 2000000 && income >= 30000) score += 10
      else if (propertyValue >= 1000000 && income >= 20000) score += 7
      else score += 5
    }

    // Property type premium
    const propertyType = (formData as any).propertyType
    if (propertyType === 'Landed') score += 2
    else if (propertyType === 'Private') score += 1

    return Math.min(score, 10)
  }

  private static calculateUrgencyScore(formData: MortgageFormData): number {
    let score = 5 // Base score

    // Timeline urgency
    const timeline = (formData as any).purchaseTimeline
    if (timeline === 'this_month') score += 5
    else if (timeline === 'next_3_months') score += 3
    else if (timeline === '3_6_months') score += 1
    else if (timeline === 'exploring') score -= 2

    // Refinancing urgency
    const lockStatus = (formData as any).lockInStatus
    if (lockStatus === 'ending_soon') score += 4
    else if (lockStatus === 'no_lock') score += 2
    else if (lockStatus === 'locked') score -= 1

    // Rate environment urgency
    const currentRate = (formData as any).currentRate
    if (currentRate && currentRate > 4.5) score += 3
    else if (currentRate && currentRate > 3.5) score += 2

    return Math.min(Math.max(score, 0), 10)
  }

  private static calculateSophisticationScore(formData: MortgageFormData): number {
    let score = 3 // Base score

    // Financial knowledge indicators
    const ipaStatus = (formData as any).ipaStatus
    if (ipaStatus === 'have_ipa') score += 3
    else if (ipaStatus === 'applied') score += 2
    else if (ipaStatus === 'starting') score += 1
    else if (ipaStatus === 'what_is_ipa') score -= 1

    // Investment sophistication
    const purpose = (formData as any).purpose
    if (purpose === 'investment') score += 3
    else if (purpose === 'business') score += 2

    // Complex transactions
    const cashOut = (formData as any).cashOutAmount
    if (cashOut > 300000) score += 2
    else if (cashOut > 100000) score += 1

    // Refinancing sophistication
    const reason = (formData as any).refinanceReason
    if (reason === 'debt_consolidation') score += 2
    else if (reason === 'cash_out') score += 1

    return Math.min(Math.max(score, 0), 10)
  }

  private static calculateEngagementScore(formData: MortgageFormData, aiContext?: any): number {
    let score = 5 // Base score

    // Form completion quality
    const completedFields = Object.keys(formData).filter(key => 
      formData[key as keyof MortgageFormData] !== undefined && 
      formData[key as keyof MortgageFormData] !== ''
    ).length
    
    if (completedFields >= 8) score += 3
    else if (completedFields >= 6) score += 2
    else if (completedFields >= 4) score += 1

    // Marketing consent
    if ((formData as any).marketingConsent) score += 1

    // AI context engagement
    if (aiContext?.userBehavior) {
      const timeOnPage = aiContext.userBehavior.timeOnPage || 0
      if (timeOnPage > 300000) score += 2 // 5+ minutes
      else if (timeOnPage > 120000) score += 1 // 2+ minutes

      const interactions = aiContext.userBehavior.formInteractions || 0
      if (interactions > 10) score += 2
      else if (interactions > 5) score += 1
    }

    return Math.min(Math.max(score, 0), 10)
  }

  private static calculateLikelihoodScore(formData: MortgageFormData): number {
    let score = 5 // Base score

    // Strong likelihood indicators
    if (formData.loanType === 'refinance') {
      const currentRate = (formData as any).currentRate
      const lockStatus = (formData as any).lockInStatus
      
      if (currentRate > 4.0 && (lockStatus === 'ending_soon' || lockStatus === 'no_lock')) {
        score += 4 // High refinancing likelihood
      } else if (currentRate > 3.5) {
        score += 2
      }
    }

    if (formData.loanType === 'new_purchase') {
      const timeline = (formData as any).purchaseTimeline
      const ipaStatus = (formData as any).ipaStatus
      
      if ((timeline === 'this_month' || timeline === 'next_3_months') && 
          (ipaStatus === 'applied' || ipaStatus === 'starting')) {
        score += 3
      }
    }

    // Email domain quality (corporate emails often indicate higher likelihood)
    if (formData.email.includes('@gmail.com') || formData.email.includes('@yahoo.com')) {
      // Personal email, neutral
    } else {
      score += 1 // Corporate or custom domain
    }

    return Math.min(Math.max(score, 0), 10)
  }

  private static determineCategory(total: number): 'premium' | 'qualified' | 'nurture' | 'cold' {
    if (total >= 8.5) return 'premium'
    if (total >= 6.5) return 'qualified'
    if (total >= 4.0) return 'nurture'
    return 'cold'
  }

  private static determinePriority(
    breakdown: any, 
    total: number
  ): 'high' | 'medium' | 'low' {
    // High priority: high financial + high urgency, OR very high total
    if ((breakdown.financial >= 8 && breakdown.urgency >= 8) || total >= 9) {
      return 'high'
    }
    
    // Medium priority: good overall score or high urgency
    if (total >= 6.5 || breakdown.urgency >= 8) {
      return 'medium'
    }
    
    return 'low'
  }

  private static determineRouting(
    category: string,
    priority: string,
    formData: MortgageFormData
  ) {
    // Premium leads go to senior advisors
    if (category === 'premium') {
      return {
        assignTo: 'senior_advisor' as const,
        responseTime: '2_hours' as const,
        followUpSequence: 'premium' as const
      }
    }

    // Qualified leads with complex needs go to specialists
    if (category === 'qualified') {
      const loanType = formData.loanType as string;
      const isComplex = loanType === 'commercial' ||
                       (formData as any).purpose === 'investment' ||
                       (formData as any).propertyType === 'Commercial'
      
      return {
        assignTo: isComplex ? 'specialist' as const : 'junior_advisor' as const,
        responseTime: priority === 'high' ? '2_hours' as const : '4_hours' as const,
        followUpSequence: 'standard' as const
      }
    }

    // Nurture leads get automated sequences with junior advisor backup
    if (category === 'nurture') {
      return {
        assignTo: 'junior_advisor' as const,
        responseTime: '24_hours' as const,
        followUpSequence: 'educational' as const
      }
    }

    // Cold leads get minimal automated follow-up
    return {
      assignTo: 'automated' as const,
      responseTime: '48_hours' as const,
      followUpSequence: 'minimal' as const
    }
  }

  private static generateInsights(
    formData: MortgageFormData,
    breakdown: any,
    total: number
  ) {
    const strengths: string[] = []
    const concerns: string[] = []
    const recommendations: string[] = []

    // Analyze strengths
    if (breakdown.financial >= 8) {
      strengths.push('High-value transaction with strong revenue potential')
    }
    if (breakdown.urgency >= 8) {
      strengths.push('Time-sensitive opportunity requiring immediate attention')
    }
    if (breakdown.sophistication >= 7) {
      strengths.push('Financially sophisticated client, likely to appreciate detailed analysis')
    }
    if (breakdown.engagement >= 7) {
      strengths.push('Highly engaged prospect with strong conversion indicators')
    }

    // Identify concerns
    if (breakdown.urgency <= 3) {
      concerns.push('Low urgency - may require longer nurture cycle')
    }
    if (breakdown.engagement <= 3) {
      concerns.push('Limited engagement - follow-up strategy crucial')
    }
    if (breakdown.sophistication <= 3) {
      concerns.push('May need educational approach rather than technical details')
    }

    // Generate recommendations
    if (total >= 8.5) {
      recommendations.push('Priority handling - assign to senior advisor immediately')
      recommendations.push('Prepare comprehensive rate comparison and savings analysis')
    } else if (total >= 6.5) {
      recommendations.push('Standard qualified lead process with 4-hour response SLA')
      recommendations.push('Focus on value proposition and competitive advantages')
    } else if (total >= 4.0) {
      recommendations.push('Educational nurture sequence to build engagement')
      recommendations.push('Provide market insights and homebuying/refinancing guides')
    } else {
      recommendations.push('Minimal automated follow-up with periodic check-ins')
    }

    return {
      strengths,
      concerns,
      recommendations
    }
  }
}