/**
 * AI First Message Templates
 * Lead: Alex Tan - AI/ML Engineer
 * 
 * Persona-based greeting templates for initial chat messages
 * Dynamically adjusts tone and urgency based on lead score
 */

export interface FirstMessageContext {
  formData: {
    name: string
    loanType: string
    propertyCategory?: string
    monthlyIncome: number
    propertyType?: string
    actualAges?: number[]
    actualIncomes?: number[]
    employmentType?: string
    hasExistingLoan?: boolean
    purchaseTimeline?: string
  }
  leadScore: number
  brokerPersona: {
    type: 'aggressive' | 'balanced' | 'conservative'
    name: string
    approach: string
    urgencyLevel: string
  }
  calculatedInsights: {
    estimatedSavings: number
    preQualificationStatus: string
    recommendedProducts: string[]
    maxLoanAmount?: number
    estimatedMonthlyPayment?: number
  }
}

export class FirstMessageGenerator {
  /**
   * Generate personalized greeting based on lead score and context
   */
  generatePersonalizedGreeting(context: FirstMessageContext): string {
    const { leadScore, brokerPersona } = context
    
    if (leadScore >= 75) {
      return this.generateAggressiveGreeting(context)
    } else if (leadScore >= 45) {
      return this.generateBalancedGreeting(context)
    } else {
      return this.generateConservativeGreeting(context)
    }
  }

  /**
   * Aggressive greeting for high-value leads (score >= 75)
   * Focus: Urgency, exclusive rates, immediate action
   */
  private generateAggressiveGreeting(context: FirstMessageContext): string {
    const { formData, calculatedInsights, brokerPersona } = context
    
    const loanTypeDisplay = formData.loanType.replace(/_/g, ' ')
    const propertyDisplay = formData.propertyCategory ? 
      formData.propertyCategory.charAt(0).toUpperCase() + formData.propertyCategory.slice(1) : 
      'property'
    
    return `Hi ${formData.name}! 🎯

I'm ${brokerPersona.name}, your dedicated mortgage specialist. I've analyzed your ${loanTypeDisplay} application and have excellent news!

✅ **Pre-qualification Status**: ${calculatedInsights.preQualificationStatus}
💰 **Potential Savings**: $${calculatedInsights.estimatedSavings.toLocaleString()}/year
🏆 **Your Profile Score**: ${context.leadScore}/100 (Premium tier)

Based on your $${formData.monthlyIncome.toLocaleString()} monthly income and ${propertyDisplay} property choice, I've identified 3 strategies that could maximize your savings:

${this.formatRecommendedProducts(calculatedInsights.recommendedProducts)}

The market is moving fast right now, and with your strong profile, we should secure your rate ASAP.

**Ready to lock in these rates today?** I can have your pre-approval letter ready within 2 hours.`
  }

  /**
   * Balanced greeting for qualified leads (45 <= score < 75)
   * Focus: Educational, consultative, building trust
   */
  private generateBalancedGreeting(context: FirstMessageContext): string {
    const { formData, calculatedInsights, brokerPersona } = context
    
    const loanTypeDisplay = formData.loanType.replace(/_/g, ' ')
    const propertyDisplay = formData.propertyCategory ? 
      formData.propertyCategory.charAt(0).toUpperCase() + formData.propertyCategory.slice(1) : 
      'property'
    
    return `Hello ${formData.name}! 👋

I'm ${brokerPersona.name}, and I'm excited to help you with your ${loanTypeDisplay} journey.

I've reviewed your application and here's what I found:

📊 **Your Profile Assessment**: ${context.leadScore}/100
✅ **Qualification Status**: ${calculatedInsights.preQualificationStatus}
💡 **Potential annual savings**: $${calculatedInsights.estimatedSavings.toLocaleString()}

**What this means for you:**
• Your $${formData.monthlyIncome.toLocaleString()} income puts you in a good position
• ${propertyDisplay} properties offer several financing options
• Current market conditions are favorable for your timeline

${this.formatRecommendedProducts(calculatedInsights.recommendedProducts)}

I'm here to answer any questions and guide you through each step. What would you like to explore first?`
  }

  /**
   * Conservative greeting for nurture leads (score < 45)
   * Focus: No pressure, value-focused, educational
   */
  private generateConservativeGreeting(context: FirstMessageContext): string {
    const { formData, brokerPersona } = context
    
    const loanTypeDisplay = formData.loanType.replace(/_/g, ' ')
    const propertyDisplay = formData.propertyCategory ? 
      formData.propertyCategory.charAt(0).toUpperCase() + formData.propertyCategory.slice(1) : 
      'property'
    
    return `Hi ${formData.name},

Thank you for taking the time to complete your ${loanTypeDisplay} application. I'm ${brokerPersona.name}, and I'm here to help you understand your options without any pressure.

I know mortgage decisions can feel overwhelming, so let's take this step by step:

🏠 **What I understand about your situation:**
• You're exploring ${loanTypeDisplay} options
• Looking at ${propertyDisplay} properties
• Want to make sure you're getting the best value

**My approach:**
• No pressure - we'll move at your pace
• Clear explanations of all options
• Honest advice about what makes sense for your situation

Feel free to ask me anything - even questions you think might be "basic." That's what I'm here for! 😊

Would you like to start with understanding loan types, or do you have a specific question in mind?`
  }

  /**
   * Format recommended products into a numbered list
   */
  private formatRecommendedProducts(products: string[]): string {
    if (!products || products.length === 0) {
      return '• Personalized recommendations available after we chat'
    }
    
    return products
      .slice(0, 3)
      .map((product, index) => `${index + 1}. ${product}`)
      .join('\n')
  }

  /**
   * Generate follow-up questions based on context
   */
  generateFollowUpQuestions(context: FirstMessageContext): string[] {
    const { leadScore, formData } = context
    
    if (leadScore >= 75) {
      return [
        'Which rate package interests you most?',
        'When do you need the pre-approval by?',
        'Should I prepare a comparison of our top 3 packages?'
      ]
    } else if (leadScore >= 45) {
      return [
        'What\'s most important to you - lowest rate or flexibility?',
        'Do you have any questions about the loan process?',
        'Would you like to see a breakdown of monthly payments?'
      ]
    } else {
      return [
        'What would you like to understand better?',
        'Do you have a target monthly payment in mind?',
        'Would it help to go through the basics first?'
      ]
    }
  }

  /**
   * Calculate insights from form data
   */
  calculateInsights(formData: any, leadScore: number): any {
    const monthlyIncome = formData.actualIncomes?.[0] || 0
    const age = formData.actualAges?.[0] || 30
    
    // Estimate max loan based on income (simplified calculation)
    const maxLoanAmount = monthlyIncome * 60 // Rough estimate
    
    // Estimate monthly payment (simplified)
    const estimatedMonthlyPayment = Math.round(maxLoanAmount * 0.004) // ~0.4% per month
    
    // Estimate savings based on refinancing or better rates
    const estimatedSavings = formData.loanType === 'refinancing' ? 
      Math.round(monthlyIncome * 0.15 * 12) : // 15% of income saved annually
      Math.round(monthlyIncome * 0.1 * 12)    // 10% for new purchases
    
    // Pre-qualification status based on lead score
    const preQualificationStatus = leadScore >= 75 ? 
      'Highly Likely Approved' : 
      leadScore >= 45 ? 
      'Good Approval Chances' : 
      'Requires Further Review'
    
    // Recommended products based on profile
    const recommendedProducts = this.getRecommendedProducts(formData, leadScore)
    
    return {
      maxLoanAmount,
      estimatedMonthlyPayment,
      estimatedSavings,
      preQualificationStatus,
      recommendedProducts
    }
  }

  /**
   * Get recommended products based on profile
   */
  private getRecommendedProducts(formData: any, leadScore: number): string[] {
    const products = []
    
    if (leadScore >= 75) {
      products.push('3-year fixed rate package (1.98% p.a.)')
      products.push('5-year variable rate option (SORA + 0.65%)')
      products.push('Hybrid financing structure with cashback')
    } else if (leadScore >= 45) {
      products.push('Standard 2-year fixed package (2.48% p.a.)')
      products.push('Floating rate with flexibility (SORA + 0.98%)')
      products.push('Step-up financing for growing income')
    } else {
      products.push('Basic home loan package (2.88% p.a.)')
      products.push('HDB loan alternative (if eligible)')
      products.push('Joint borrower options for better rates')
    }
    
    return products
  }
}