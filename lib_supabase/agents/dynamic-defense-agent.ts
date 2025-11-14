// Form data type that combines all gate data
export interface MortgageFormData {
  // Gate 0
  loanType?: 'new_purchase' | 'refinance' | 'commercial'
  
  // Gate 1
  name?: string
  email?: string
  
  // Gate 2
  phone?: string
  propertyCategory?: 'resale' | 'new_launch' | 'bto' | 'commercial'
  
  // New Purchase fields
  purchaseTimeline?: 'this_month' | 'next_3_months' | '3_6_months' | 'exploring'
  propertyType?: 'HDB' | 'EC' | 'Private' | 'Landed'
  priceRange?: number
  ipaStatus?: 'have_ipa' | 'applied' | 'starting' | 'what_is_ipa'
  firstTimeBuyer?: boolean
  
  // Refinance fields
  currentRate?: number
  lockInStatus?: 'ending_soon' | 'no_lock' | 'locked' | 'not_sure'
  currentBank?: string
  outstandingLoan?: number
  propertyValue?: number
  
  // Gate 3
  monthlyIncome?: number
  existingCommitments?: number
  packagePreference?: 'lowest_rate' | 'flexibility' | 'stability' | 'features'
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
  planningHorizon?: 'short_term' | 'medium_term' | 'long_term'
}

export interface DefenseStrategy {
  primaryApproach: {
    strategy: string
    description: string
    advantages: string[]
    implementation: string[]
  }
  alternativeOptions: {
    option: string
    whenToConsider: string
    benefits: string[]
  }[]
  riskMitigation: {
    risk: string
    mitigation: string
    priority: 'high' | 'medium' | 'low'
  }[]
  brokerValueProposition: {
    uniqueAdvantage: string
    expectedOutcome: string
    preparationNeeded: string[]
  }
}

export interface ClientProfile {
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  financialStrength: 'strong' | 'moderate' | 'developing'
  sophistication: 'high' | 'medium' | 'basic'
  urgencyLevel: 'immediate' | 'soon' | 'planning' | 'exploring'
  priorities: string[]
}

export class DynamicDefenseAgent {
  private readonly strategyTemplates = {
    conservative: {
      primary: 'stability-first',
      alternatives: ['fixed-rate-security', 'hybrid-balance'],
      riskFocus: ['rate-volatility', 'payment-uncertainty']
    },
    moderate: {
      primary: 'balanced-optimization',
      alternatives: ['strategic-flexibility', 'cost-efficiency'],
      riskFocus: ['opportunity-cost', 'lock-in-timing']
    },
    aggressive: {
      primary: 'maximum-leverage',
      alternatives: ['rate-arbitrage', 'short-term-optimization'],
      riskFocus: ['over-leverage', 'market-timing']
    }
  }

  private readonly bankCategories = {
    local: {
      strengths: ['relationship-banking', 'cpf-integration', 'local-market-knowledge'],
      weaknesses: ['higher-rates', 'stricter-criteria'],
      bestFor: ['hdb-financing', 'government-schemes', 'long-term-relationships']
    },
    foreign: {
      strengths: ['competitive-rates', 'flexible-packages', 'global-expertise'],
      weaknesses: ['limited-hdb-options', 'less-cpf-friendly'],
      bestFor: ['private-property', 'high-net-worth', 'complex-structures']
    },
    digital: {
      strengths: ['efficiency', 'transparency', 'quick-processing'],
      weaknesses: ['limited-customization', 'no-relationship-manager'],
      bestFor: ['straightforward-cases', 'tech-savvy-clients', 'time-sensitive']
    }
  }

  async analyzeClientProfile(formData: MortgageFormData): Promise<ClientProfile> {
    const riskProfile = this.assessRiskProfile(formData)
    const financialStrength = this.assessFinancialStrength(formData)
    const sophistication = this.assessSophistication(formData)
    const urgencyLevel = this.assessUrgency(formData)
    const priorities = this.identifyPriorities(formData)

    return {
      riskProfile,
      financialStrength,
      sophistication,
      urgencyLevel,
      priorities
    }
  }

  async generateDefenseStrategy(
    formData: MortgageFormData,
    clientProfile?: ClientProfile
  ): Promise<DefenseStrategy> {
    const profile = clientProfile || await this.analyzeClientProfile(formData)
    
    const primaryApproach = this.generatePrimaryApproach(formData, profile)
    const alternativeOptions = this.generateAlternatives(formData, profile)
    const riskMitigation = this.identifyRisks(formData, profile)
    const brokerValueProposition = this.generateBrokerValue(formData, profile)

    return {
      primaryApproach,
      alternativeOptions,
      riskMitigation,
      brokerValueProposition
    }
  }

  private assessRiskProfile(formData: MortgageFormData): 'conservative' | 'moderate' | 'aggressive' {
    const indicators = {
      conservative: 0,
      moderate: 0,
      aggressive: 0
    }

    // Risk tolerance from form
    if (formData.riskTolerance && formData.riskTolerance in indicators) {
      indicators[formData.riskTolerance as keyof typeof indicators]++
    }

    // Package preference analysis
    if (formData.packagePreference === 'stability') {
      indicators.conservative += 2
    } else if (formData.packagePreference === 'lowest_rate') {
      indicators.aggressive++
    } else if (formData.packagePreference === 'flexibility') {
      indicators.moderate++
    }

    // Planning horizon
    if (formData.planningHorizon === 'long_term') {
      indicators.conservative++
    } else if (formData.planningHorizon === 'short_term') {
      indicators.aggressive++
    }

    // Financial commitments
    if (formData.existingCommitments && formData.monthlyIncome) {
      const commitmentRatio = formData.existingCommitments / formData.monthlyIncome
      if (commitmentRatio > 0.3) {
        indicators.conservative += 2
      } else if (commitmentRatio < 0.1) {
        indicators.aggressive++
      }
    }

    // Loan type considerations
    if (formData.loanType === 'refinance' && formData.lockInStatus === 'locked') {
      indicators.conservative++
    }

    // Determine dominant profile
    const maxScore = Math.max(
      indicators.conservative,
      indicators.moderate,
      indicators.aggressive
    )

    if (indicators.conservative === maxScore) return 'conservative'
    if (indicators.aggressive === maxScore) return 'aggressive'
    return 'moderate'
  }

  private assessFinancialStrength(formData: MortgageFormData): 'strong' | 'moderate' | 'developing' {
    const monthlyIncome = formData.monthlyIncome || 0
    const commitments = formData.existingCommitments || 0
    
    // Calculate debt service ratio
    const netIncome = monthlyIncome - commitments
    const incomeStrength = monthlyIncome > 15000 ? 3 : monthlyIncome > 8000 ? 2 : 1
    const commitmentBurden = commitments / monthlyIncome
    
    // Property value assessment
    let propertyStrength = 2
    if (formData.loanType === 'new_purchase' && formData.priceRange) {
      propertyStrength = formData.priceRange > 2000000 ? 3 : formData.priceRange > 1000000 ? 2 : 1
    } else if (formData.loanType === 'refinance' && formData.propertyValue) {
      propertyStrength = formData.propertyValue > 2000000 ? 3 : formData.propertyValue > 1000000 ? 2 : 1
    }

    // Calculate overall strength
    const totalScore = incomeStrength + propertyStrength - (commitmentBurden > 0.3 ? 1 : 0)
    
    if (totalScore >= 5) return 'strong'
    if (totalScore >= 3) return 'moderate'
    return 'developing'
  }

  private assessSophistication(formData: MortgageFormData): 'high' | 'medium' | 'basic' {
    // Indicators of financial sophistication
    const indicators = {
      high: 0,
      medium: 0,
      basic: 0
    }

    // Property type sophistication
    if (formData.propertyType === 'Landed' || formData.propertyType === 'EC') {
      indicators.high++
    } else if (formData.propertyType === 'Private') {
      indicators.medium++
    } else {
      indicators.basic++
    }

    // Refinancing indicates experience
    if (formData.loanType === 'refinance') {
      indicators.medium++
      if (formData.currentRate && formData.currentRate < 3) {
        indicators.high++ // Got good rate previously
      }
    }

    // IPA status understanding
    if (formData.ipaStatus === 'have_ipa' || formData.ipaStatus === 'applied') {
      indicators.medium++
    } else if (formData.ipaStatus === 'what_is_ipa') {
      indicators.basic += 2
    }

    // Commercial property indicates sophistication
    if (formData.loanType === 'commercial') {
      indicators.high += 2
    }

    const maxScore = Math.max(indicators.high, indicators.medium, indicators.basic)
    
    if (indicators.high === maxScore) return 'high'
    if (indicators.medium === maxScore) return 'medium'
    return 'basic'
  }

  private assessUrgency(formData: MortgageFormData): 'immediate' | 'soon' | 'planning' | 'exploring' {
    // New purchase urgency
    if (formData.loanType === 'new_purchase') {
      switch (formData.purchaseTimeline) {
        case 'this_month': return 'immediate'
        case 'next_3_months': return 'soon'
        case '3_6_months': return 'planning'
        case 'exploring': return 'exploring'
      }
    }

    // Refinance urgency
    if (formData.loanType === 'refinance') {
      switch (formData.lockInStatus) {
        case 'ending_soon': return 'immediate'
        case 'no_lock': return 'soon'
        case 'not_sure': return 'soon'
        case 'locked': return 'planning'
      }
    }

    // Commercial typically urgent
    if (formData.loanType === 'commercial') {
      return 'immediate'
    }

    return 'exploring'
  }

  private identifyPriorities(formData: MortgageFormData): string[] {
    const priorities: string[] = []

    // Package preference is primary priority
    switch (formData.packagePreference) {
      case 'lowest_rate':
        priorities.push('minimize-interest-cost', 'maximize-savings')
        break
      case 'flexibility':
        priorities.push('maintain-optionality', 'avoid-lock-in')
        break
      case 'stability':
        priorities.push('payment-certainty', 'long-term-planning')
        break
      case 'features':
        priorities.push('value-added-benefits', 'comprehensive-coverage')
        break
    }

    // Add urgency-based priorities
    const urgency = this.assessUrgency(formData)
    if (urgency === 'immediate') {
      priorities.push('quick-approval', 'certainty-of-execution')
    } else if (urgency === 'exploring') {
      priorities.push('market-education', 'options-exploration')
    }

    // Financial strength priorities
    if (formData.monthlyIncome && formData.monthlyIncome > 20000) {
      priorities.push('wealth-optimization', 'tax-efficiency')
    }

    return priorities
  }

  private generatePrimaryApproach(
    formData: MortgageFormData,
    profile: ClientProfile
  ): DefenseStrategy['primaryApproach'] {
    const template = this.strategyTemplates[profile.riskProfile]
    
    // Generate strategy based on profile
    const strategies = {
      'stability-first': {
        strategy: 'Fixed Rate Security Strategy',
        description: 'Lock in certainty with competitive fixed rates for peace of mind',
        advantages: [
          'Complete payment certainty for planning',
          'Protection from rate increases',
          'Simplified budgeting and cash flow'
        ],
        implementation: [
          'Compare 2-3 year fixed packages across banks',
          'Negotiate waiver of lock-in penalties',
          'Structure repayment for maximum stability'
        ]
      },
      'balanced-optimization': {
        strategy: 'Strategic Flexibility Approach',
        description: 'Balance competitive rates with strategic optionality',
        advantages: [
          'Optimize between fixed and floating benefits',
          'Maintain refinancing flexibility',
          'Capture market opportunities'
        ],
        implementation: [
          'Consider hybrid packages with shorter lock-ins',
          'Build in prepayment flexibility',
          'Monitor rate environment for optimization windows'
        ]
      },
      'maximum-leverage': {
        strategy: 'Aggressive Rate Optimization',
        description: 'Maximize leverage and minimize costs through active management',
        advantages: [
          'Lowest possible interest costs',
          'Maximum capital efficiency',
          'Opportunity for rate arbitrage'
        ],
        implementation: [
          'Focus on floating rate packages',
          'Leverage multiple banking relationships',
          'Active refinancing at optimal windows'
        ]
      }
    }

    const strategyKey = template.primary as keyof typeof strategies
    return strategies[strategyKey] || strategies['balanced-optimization']
  }

  private generateAlternatives(
    formData: MortgageFormData,
    profile: ClientProfile
  ): DefenseStrategy['alternativeOptions'] {
    const alternatives: DefenseStrategy['alternativeOptions'] = []

    // Bank category alternatives
    if (formData.currentBank) {
      alternatives.push({
        option: 'Switch Bank Categories',
        whenToConsider: 'If current bank category not serving your needs',
        benefits: [
          'Access different pricing structures',
          'Leverage competitive dynamics',
          'Explore specialized offerings'
        ]
      })
    }

    // Package type alternatives
    alternatives.push({
      option: 'Hybrid Package Strategy',
      whenToConsider: 'When uncertain about rate direction',
      benefits: [
        'Partial protection with flexibility',
        'Moderate cost with some certainty',
        'Ability to adjust strategy mid-term'
      ]
    })

    // Tenure optimization
    if (profile.financialStrength === 'strong') {
      alternatives.push({
        option: 'Tenure Reduction Strategy',
        whenToConsider: 'When cash flow permits higher payments',
        benefits: [
          'Significant interest savings',
          'Faster equity building',
          'Improved negotiation position'
        ]
      })
    }

    // Prepayment strategy
    if (profile.urgencyLevel !== 'immediate') {
      alternatives.push({
        option: 'Strategic Prepayment Planning',
        whenToConsider: 'When expecting bonus or windfall',
        benefits: [
          'Reduce principal aggressively',
          'Shorten loan tenure',
          'Improve refinancing terms'
        ]
      })
    }

    return alternatives
  }

  private identifyRisks(
    formData: MortgageFormData,
    profile: ClientProfile
  ): DefenseStrategy['riskMitigation'] {
    const risks: DefenseStrategy['riskMitigation'] = []

    // Interest rate risk
    if (profile.riskProfile === 'aggressive' || formData.packagePreference === 'lowest_rate') {
      risks.push({
        risk: 'Interest Rate Volatility',
        mitigation: 'Consider rate cap options or partial fixed-rate hedging',
        priority: 'high'
      })
    }

    // Refinancing risk
    if (formData.loanType === 'refinance' && formData.lockInStatus === 'ending_soon') {
      risks.push({
        risk: 'Refinancing Execution Risk',
        mitigation: 'Apply to multiple banks simultaneously for certainty',
        priority: 'high'
      })
    }

    // Approval risk
    if (profile.financialStrength === 'developing') {
      risks.push({
        risk: 'Loan Approval Challenges',
        mitigation: 'Prepare comprehensive documentation and consider co-borrower',
        priority: 'high'
      })
    }

    // Market timing risk
    if (formData.purchaseTimeline === 'exploring' || formData.purchaseTimeline === '3_6_months') {
      risks.push({
        risk: 'Market Timing Uncertainty',
        mitigation: 'Lock in pre-approval rates where possible',
        priority: 'medium'
      })
    }

    // Commitment risk
    if (formData.existingCommitments && formData.monthlyIncome) {
      const ratio = formData.existingCommitments / formData.monthlyIncome
      if (ratio > 0.3) {
        risks.push({
          risk: 'High Debt Service Burden',
          mitigation: 'Consider debt consolidation or longer tenure',
          priority: 'high'
        })
      }
    }

    // Property-specific risks
    if (formData.propertyCategory === 'new_launch') {
      risks.push({
        risk: 'Construction Delay Risk',
        mitigation: 'Build in flexibility for disbursement timing',
        priority: 'medium'
      })
    }

    if (formData.propertyCategory === 'bto') {
      risks.push({
        risk: 'BTO Ballot Uncertainty',
        mitigation: 'Maintain IPA validity with extensions',
        priority: 'low'
      })
    }

    return risks
  }

  private generateBrokerValue(
    formData: MortgageFormData,
    profile: ClientProfile
  ): DefenseStrategy['brokerValueProposition'] {
    // Customize broker value based on profile
    const valueProps = {
      conservative: {
        uniqueAdvantage: 'Access to exclusive fixed-rate packages not advertised publicly',
        expectedOutcome: 'Secure best-in-market stability with competitive rates',
        preparationNeeded: [
          'Income documentation for last 3 months',
          'Property valuation report if refinancing',
          'CPF statements for eligibility optimization'
        ]
      },
      moderate: {
        uniqueAdvantage: 'Multi-bank negotiation leverage for balanced packages',
        expectedOutcome: 'Optimal mix of rate competitiveness and flexibility',
        preparationNeeded: [
          'Comparison of current vs desired package features',
          'Documentation of financial goals and timeline',
          'Existing loan statements for benchmarking'
        ]
      },
      aggressive: {
        uniqueAdvantage: 'Real-time market intelligence and execution speed',
        expectedOutcome: 'Capture lowest rates with perfect timing',
        preparationNeeded: [
          'Pre-approval from multiple banks',
          'Quick decision readiness',
          'Flexible documentation submission'
        ]
      }
    }

    const base = valueProps[profile.riskProfile]

    // Add urgency-specific preparation
    if (profile.urgencyLevel === 'immediate') {
      base.preparationNeeded.unshift('Immediate availability for document submission')
    }

    // Add sophistication-specific advantages
    if (profile.sophistication === 'high') {
      base.uniqueAdvantage += ' with complex structuring capabilities'
    }

    return base
  }

  // Multi-layer strategy generation
  generateMultiLayerStrategy(
    formData: MortgageFormData,
    defenseStrategy: DefenseStrategy
  ): {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  } {
    return {
      immediate: [
        'Secure pre-approval from preferred banks',
        'Lock in rate indications where possible',
        ...defenseStrategy.primaryApproach.implementation.slice(0, 1)
      ],
      shortTerm: [
        'Execute primary strategy within 30 days',
        'Monitor market for optimization opportunities',
        ...defenseStrategy.primaryApproach.implementation.slice(1, 2)
      ],
      longTerm: [
        'Build relationship for future refinancing',
        'Plan prepayment strategy for interest savings',
        ...defenseStrategy.primaryApproach.implementation.slice(2)
      ]
    }
  }

  // Broker consultation priming
  generateBrokerConsultationBrief(
    formData: MortgageFormData,
    profile: ClientProfile,
    defenseStrategy: DefenseStrategy
  ): {
    clientSummary: string
    recommendedApproach: string
    keyTalkingPoints: string[]
    expectedQuestions: string[]
    closingStrategy: string
  } {
    return {
      clientSummary: `${profile.sophistication} sophistication ${profile.riskProfile} client with ${profile.financialStrength} financial position seeking ${formData.loanType} financing`,
      recommendedApproach: defenseStrategy.primaryApproach.strategy,
      keyTalkingPoints: [
        ...defenseStrategy.primaryApproach.advantages,
        `Urgency level: ${profile.urgencyLevel}`,
        `Primary priorities: ${profile.priorities.slice(0, 2).join(', ')}`
      ],
      expectedQuestions: this.generateExpectedQuestions(formData, profile),
      closingStrategy: this.generateClosingStrategy(profile)
    }
  }

  private generateExpectedQuestions(
    formData: MortgageFormData,
    profile: ClientProfile
  ): string[] {
    const questions: string[] = []

    // Profile-based questions
    if (profile.sophistication === 'basic') {
      questions.push(
        'What is the difference between fixed and floating rates?',
        'How does refinancing work?',
        'What documents do I need?'
      )
    } else if (profile.sophistication === 'medium') {
      questions.push(
        'Which banks offer the best packages for my profile?',
        'What are the lock-in implications?',
        'How to optimize between CPF and cash?'
      )
    } else {
      questions.push(
        'What are the latest market movements?',
        'How to structure for tax efficiency?',
        'What are off-market package options?'
      )
    }

    // Loan type specific questions
    if (formData.loanType === 'new_purchase') {
      questions.push('How much can I borrow?', 'What is the approval timeline?')
    } else if (formData.loanType === 'refinance') {
      questions.push('What are the refinancing costs?', 'Can I cash out equity?')
    }

    return questions
  }

  private generateClosingStrategy(profile: ClientProfile): string {
    const strategies = {
      immediate: 'Emphasize immediate action benefits and lock in current advantages',
      soon: 'Create urgency with market timing insights and limited offers',
      planning: 'Build trust through comprehensive planning and future optimization',
      exploring: 'Educate first, then guide toward informed decision'
    }

    return strategies[profile.urgencyLevel]
  }
}