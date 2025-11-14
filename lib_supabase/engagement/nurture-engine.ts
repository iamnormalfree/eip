import { LeadScore } from '../processing/lead-scorer'

export interface NurtureSequence {
  name: string
  description: string
  stages: NurtureStage[]
  duration: number // in days
  expectedConversion: number // percentage
}

export interface NurtureStage {
  day: number
  title: string
  type: 'email' | 'whatsapp' | 'call' | 'report' | 'offer'
  content: NurtureContent
  conditions?: NurtureCondition[]
  nextStage?: number
}

export interface NurtureContent {
  subject?: string
  message: string
  ctaText?: string
  ctaLink?: string
  attachments?: string[]
  personalization: PersonalizationData
}

export interface PersonalizationData {
  savings?: string
  timeline?: string
  property_type?: string
  urgency_level?: 'high' | 'medium' | 'low'
  pain_point?: string
  opportunity?: string
}

export interface NurtureCondition {
  type: 'engagement' | 'time_elapsed' | 'lead_score' | 'external_trigger'
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
  action: 'skip' | 'jump_to' | 'send_immediately' | 'pause'
}

export class NurtureEngine {
  
  static createSequence(
    leadData: any, 
    leadScore: LeadScore, 
    insights: any[]
  ): NurtureSequence {
    
    const category = leadScore.category
    const loanType = leadData.loanType || 'general'
    
    // Select appropriate sequence based on lead scoring
    if (category === 'premium') {
      return this.createPremiumSequence(leadData, leadScore, insights)
    } else if (category === 'qualified') {
      return this.createQualifiedSequence(leadData, leadScore, insights)
    } else if (category === 'nurture') {
      return this.createNurtureSequence(leadData, leadScore, insights)
    } else {
      return this.createColdSequence(leadData, leadScore, insights)
    }
  }

  private static createPremiumSequence(
    leadData: any, 
    leadScore: LeadScore, 
    insights: any[]
  ): NurtureSequence {
    
    const personalization = this.extractPersonalization(leadData, leadScore, insights)
    
    return {
      name: 'Premium VIP Sequence',
      description: 'White-glove service for high-value prospects',
      duration: 14,
      expectedConversion: 75,
      stages: [
        {
          day: 0,
          title: 'Immediate Premium Welcome',
          type: 'whatsapp',
          content: {
            message: `Hi ${leadData.name}, I'm personally handling your mortgage analysis. You qualify for our VIP service with potential savings of ${personalization.savings}. I'll call within 2 hours to discuss your priority options.`,
            ctaText: 'Schedule Call Now',
            ctaLink: '/schedule/premium',
            personalization
          }
        },
        {
          day: 0,
          title: 'Comprehensive Analysis Report',
          type: 'report',
          content: {
            subject: 'Your Exclusive Mortgage Intelligence Report',
            message: `${leadData.name}, here's your comprehensive analysis comparing 15+ premium bank packages, with strategic recommendations tailored to your ${personalization.property_type} ${leadData.loanType} scenario.`,
            attachments: ['premium_analysis_report.pdf'],
            personalization
          }
        },
        {
          day: 1,
          title: 'Senior Advisor Follow-up',
          type: 'call',
          content: {
            message: 'Personal consultation to review analysis and answer questions',
            personalization
          }
        },
        {
          day: 3,
          title: 'Exclusive Rate Lock Offer',
          type: 'email',
          content: {
            subject: 'Exclusive: Lock Your Premium Rate (48hr Window)',
            message: `${leadData.name}, based on your profile, I've secured a special rate that expires in 48 hours. This could save you an additional ${personalization.opportunity} on top of your projected savings.`,
            ctaText: 'Secure Rate Now',
            ctaLink: '/premium-offer',
            personalization
          },
          conditions: [{
            type: 'engagement',
            operator: 'greater_than',
            value: 3,
            action: 'send_immediately'
          }]
        },
        {
          day: 7,
          title: 'Market Intelligence Update',
          type: 'email',
          content: {
            subject: 'Weekly Market Intel: Rate Forecast & Strategy',
            message: `Exclusive market insights for ${personalization.property_type} segment. Rates expected to ${personalization.timeline} - here's your optimal timing strategy.`,
            ctaText: 'View Full Analysis',
            personalization
          }
        },
        {
          day: 14,
          title: 'Priority Review',
          type: 'call',
          content: {
            message: 'Strategic review and final recommendations',
            personalization
          }
        }
      ]
    }
  }

  private static createQualifiedSequence(
    leadData: any, 
    leadScore: LeadScore, 
    insights: any[]
  ): NurtureSequence {
    
    const personalization = this.extractPersonalization(leadData, leadScore, insights)
    
    return {
      name: 'Qualified Professional Sequence',
      description: 'Structured engagement for qualified prospects',
      duration: 21,
      expectedConversion: 45,
      stages: [
        {
          day: 0,
          title: 'Professional Welcome & Analysis',
          type: 'email',
          content: {
            subject: `Your ${leadData.loanType} Analysis is Ready`,
            message: `Hi ${leadData.name}, your mortgage analysis is complete. We've identified ${personalization.savings} in potential monthly savings through strategic refinancing/optimization.`,
            ctaText: 'View Analysis',
            ctaLink: '/analysis-report',
            personalization
          }
        },
        {
          day: 1,
          title: 'Mortgage Specialist Consultation',
          type: 'call',
          content: {
            message: 'Professional consultation to discuss findings and recommendations',
            personalization
          }
        },
        {
          day: 3,
          title: 'Detailed Comparison Report',
          type: 'email',
          content: {
            subject: 'Top 5 Bank Options for Your Scenario',
            message: `${leadData.name}, here are the 5 best mortgage packages for your ${personalization.property_type} ${leadData.loanType}. Each option analyzed for savings, features, and suitability.`,
            attachments: ['comparison_report.pdf'],
            ctaText: 'Discuss Options',
            personalization
          }
        },
        {
          day: 7,
          title: 'Educational Content: Optimization Tips',
          type: 'email',
          content: {
            subject: 'Mortgage Optimization Masterclass',
            message: `Advanced strategies for ${leadData.loanType} - timing, negotiation tactics, and hidden opportunities most borrowers miss.`,
            ctaText: 'Learn Advanced Strategies',
            personalization
          }
        },
        {
          day: 14,
          title: 'Market Update & Opportunity Alert',
          type: 'email',
          content: {
            subject: 'New Opportunity: Bank Promotions This Month',
            message: `${leadData.name}, new promotions just announced that could improve your savings by ${personalization.opportunity}. Limited time offers worth considering.`,
            ctaText: 'View New Promotions',
            personalization
          }
        },
        {
          day: 21,
          title: 'Strategic Check-in',
          type: 'call',
          content: {
            message: 'Follow-up consultation to assess readiness and next steps',
            personalization
          }
        }
      ]
    }
  }

  private static createNurtureSequence(
    leadData: any, 
    leadScore: LeadScore, 
    insights: any[]
  ): NurtureSequence {
    
    const personalization = this.extractPersonalization(leadData, leadScore, insights)
    
    return {
      name: 'Educational Nurture Sequence',
      description: 'Value-first education to build trust and engagement',
      duration: 60,
      expectedConversion: 25,
      stages: [
        {
          day: 0,
          title: 'Welcome & Initial Insights',
          type: 'email',
          content: {
            subject: 'Your Mortgage Analysis + Homeowner\'s Guide',
            message: `Hi ${leadData.name}, here's your initial analysis plus our comprehensive guide to ${leadData.loanType} in Singapore. No pressure - just valuable insights.`,
            ctaText: 'Access Free Guide',
            ctaLink: '/guides/mortgage-optimization',
            attachments: ['mortgage_guide.pdf'],
            personalization
          }
        },
        {
          day: 3,
          title: 'Educational Series: Part 1',
          type: 'email',
          content: {
            subject: 'Mortgage Myth-Busting: What Banks Don\'t Tell You',
            message: `Common myths about ${leadData.loanType} that cost homeowners thousands. Arm yourself with knowledge.`,
            ctaText: 'Read Full Article',
            personalization
          }
        },
        {
          day: 7,
          title: 'Market Insights Weekly',
          type: 'email',
          content: {
            subject: 'Weekly Market Watch: Rate Trends & Predictions',
            message: `This week's market analysis for ${personalization.property_type} owners. Knowledge is power in mortgage decisions.`,
            ctaText: 'Get Market Intel',
            personalization
          }
        },
        {
          day: 14,
          title: 'Case Study: Similar Scenario',
          type: 'email',
          content: {
            subject: 'Case Study: How Sarah Saved SGD 180,000',
            message: `Real case study of ${personalization.property_type} ${leadData.loanType} similar to your scenario. See the strategy that saved SGD 180,000 over 20 years.`,
            ctaText: 'Read Case Study',
            personalization
          }
        },
        {
          day: 30,
          title: 'Soft Check-in',
          type: 'email',
          content: {
            subject: 'Quick Question: How Are Your Mortgage Plans?',
            message: `Hi ${leadData.name}, just checking how your mortgage planning is going. Any questions about your earlier analysis?`,
            ctaText: 'Ask a Question',
            personalization
          }
        },
        {
          day: 60,
          title: 'Updated Analysis Offer',
          type: 'email',
          content: {
            subject: 'Rates Have Changed - Updated Analysis Available',
            message: `${leadData.name}, market rates have shifted since your last analysis. Updated projections available if you're still exploring options.`,
            ctaText: 'Get Updated Analysis',
            personalization
          }
        }
      ]
    }
  }

  private static createColdSequence(
    leadData: any, 
    leadScore: LeadScore, 
    insights: any[]
  ): NurtureSequence {
    
    const personalization = this.extractPersonalization(leadData, leadScore, insights)
    
    return {
      name: 'Minimal Touch Sequence',
      description: 'Light-touch nurturing for low-engagement prospects',
      duration: 90,
      expectedConversion: 8,
      stages: [
        {
          day: 0,
          title: 'Basic Analysis Delivery',
          type: 'email',
          content: {
            subject: 'Your Mortgage Quick Analysis',
            message: `Hi ${leadData.name}, here's a quick analysis of your ${leadData.loanType} scenario. Feel free to reach out if you have questions.`,
            ctaText: 'View Analysis',
            personalization
          }
        },
        {
          day: 30,
          title: 'Quarterly Market Update',
          type: 'email',
          content: {
            subject: 'Quarterly Mortgage Market Update',
            message: 'Latest market trends and opportunities in the Singapore mortgage market.',
            ctaText: 'Read Update',
            personalization
          }
        },
        {
          day: 90,
          title: 'Annual Check-in',
          type: 'email',
          content: {
            subject: 'Annual Mortgage Review Available',
            message: `${leadData.name}, it's been a while. If you're still interested in mortgage optimization, we're here to help.`,
            ctaText: 'Get Fresh Analysis',
            personalization
          }
        }
      ]
    }
  }

  private static extractPersonalization(
    leadData: any, 
    leadScore: LeadScore, 
    insights: any[]
  ): PersonalizationData {
    
    // Extract savings from insights
    const savingsInsight = insights.find(i => i.type === 'rate_opportunity' || i.type === 'savings_calculation')
    const savings = savingsInsight?.value || 'significant monthly'
    
    // Determine urgency level
    const urgency = leadScore.breakdown.urgency >= 8 ? 'high' : 
                    leadScore.breakdown.urgency >= 5 ? 'medium' : 'low'
    
    // Extract pain points and opportunities
    const painPoint = this.identifyPainPoint(leadData, insights)
    const opportunity = this.identifyOpportunity(leadData, insights)
    
    return {
      savings,
      timeline: this.getTimelineText(leadData),
      property_type: leadData.propertyType || 'property',
      urgency_level: urgency,
      pain_point: painPoint,
      opportunity
    }
  }

  private static identifyPainPoint(leadData: any, insights: any[]): string {
    if (leadData.loanType === 'refinance' && leadData.currentRate > 4.0) {
      return 'high interest rate burden'
    }
    if (leadData.loanType === 'new_purchase' && leadData.ipaStatus === 'what_is_ipa') {
      return 'lack of pre-approval putting offers at risk'
    }
    if (leadData.lockInStatus === 'locked') {
      return 'lock-in period preventing optimization'
    }
    return 'suboptimal mortgage terms'
  }

  private static identifyOpportunity(leadData: any, insights: any[]): string {
    const savingsInsight = insights.find(i => i.value)
    if (savingsInsight) return savingsInsight.value
    
    if (leadData.loanType === 'refinance') return 'lower monthly payments'
    if (leadData.loanType === 'new_purchase') return 'better negotiating position'
    return 'optimized mortgage strategy'
  }

  private static getTimelineText(leadData: any): string {
    if (leadData.purchaseTimeline === 'this_month') return 'immediate action required'
    if (leadData.purchaseTimeline === 'next_3_months') return 'action needed soon'
    if (leadData.lockInStatus === 'ending_soon') return 'perfect timing window'
    return 'strategic planning phase'
  }

  // Engagement tracking and optimization
  static trackEngagement(leadId: string, stage: number, action: string) {
    // Track opens, clicks, replies for optimization
    console.log(`Engagement tracked: Lead ${leadId}, Stage ${stage}, Action: ${action}`)
    
    // In production:
    // - Store in engagement database
    // - Update lead score
    // - Trigger conditional logic
    // - Optimize future sequences
  }

  static optimizeSequence(sequenceName: string, performance: any) {
    // A/B test and optimize sequences based on performance
    console.log(`Optimizing sequence: ${sequenceName}`, performance)
    
    // In production:
    // - Analyze conversion rates by stage
    // - Test subject line variations
    // - Optimize timing and frequency
    // - Adjust personalization strategies
  }
}