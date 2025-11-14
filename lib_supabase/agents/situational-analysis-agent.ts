import { z } from 'zod';

const AnalysisInputSchema = z.object({
  loanType: z.enum(['new_purchase', 'refinance', 'commercial']),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']).optional(),
  propertyCategory: z.enum(['resale', 'new_launch', 'bto']).optional(),
  purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']).optional(),
  lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']).optional(),
  currentRate: z.number().optional(),
  propertyValue: z.number().optional(),
  outstandingLoan: z.number().optional(),
  monthlyIncome: z.number().optional(),
  existingCommitments: z.number().optional(),
  ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']).optional(),
});

type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

interface OTPAnalysis {
  urgencyLevel: 'critical' | 'high' | 'moderate' | 'low';
  keyFactors: string[];
  recommendations: string[];
  timeline: string;
}

interface PaymentSchemeAnalysis {
  progressivePayment: {
    applicable: boolean;
    benefit: string | null;
  };
  deferredPayment: {
    applicable: boolean;
    benefit: string | null;
  };
  normalPayment: {
    recommendation: string;
  };
}

interface LockInAnalysis {
  currentStatus: 'locked' | 'ending_soon' | 'free' | 'unknown';
  actionRequired: boolean;
  timing: string;
  strategy: string[];
}

interface SituationalAnalysisResult {
  otpAnalysis: OTPAnalysis;
  paymentSchemeAnalysis: PaymentSchemeAnalysis;
  lockInAnalysis: LockInAnalysis;
  overallRecommendation: string;
  nextSteps: string[];
}

export class SituationalAnalysisAgent {
  async analyze(input: AnalysisInput): Promise<SituationalAnalysisResult> {
    const validatedInput = AnalysisInputSchema.parse(input);
    
    const otpAnalysis = this.analyzeOTPUrgency(validatedInput);
    const paymentSchemeAnalysis = this.analyzePaymentSchemes(validatedInput);
    const lockInAnalysis = this.analyzeLockInTiming(validatedInput);
    
    const overallRecommendation = this.generateOverallRecommendation(
      otpAnalysis,
      paymentSchemeAnalysis,
      lockInAnalysis,
      validatedInput
    );
    
    const nextSteps = this.generateNextSteps(
      otpAnalysis,
      lockInAnalysis,
      validatedInput
    );
    
    return {
      otpAnalysis,
      paymentSchemeAnalysis,
      lockInAnalysis,
      overallRecommendation,
      nextSteps,
    };
  }
  
  async enhanceWithFinancials(
    previousAnalysis: SituationalAnalysisResult,
    financialData: {
      monthlyIncome: number;
      existingCommitments?: number;
      packagePreference?: string;
      riskTolerance?: string;
      planningHorizon?: string;
    }
  ): Promise<SituationalAnalysisResult> {
    const tdsr = this.calculateTDSR(
      financialData.monthlyIncome,
      financialData.existingCommitments || 0
    );
    
    const affordabilityInsights = this.generateAffordabilityInsights(
      tdsr,
      financialData.monthlyIncome
    );
    
    const enhancedOTPAnalysis = {
      ...previousAnalysis.otpAnalysis,
      keyFactors: [
        ...previousAnalysis.otpAnalysis.keyFactors,
        ...affordabilityInsights,
      ],
    };
    
    const enhancedRecommendation = this.enhanceRecommendationWithFinancials(
      previousAnalysis.overallRecommendation,
      tdsr,
      financialData
    );
    
    return {
      ...previousAnalysis,
      otpAnalysis: enhancedOTPAnalysis,
      overallRecommendation: enhancedRecommendation,
    };
  }
  
  private analyzeOTPUrgency(input: AnalysisInput): OTPAnalysis {
    const urgencyFactors: string[] = [];
    let urgencyScore = 0;
    
    // New Purchase OTP Analysis
    if (input.loanType === 'new_purchase') {
      if (input.purchaseTimeline === 'this_month') {
        urgencyScore += 10;
        urgencyFactors.push('OTP expiring within 30 days');
      } else if (input.purchaseTimeline === 'next_3_months') {
        urgencyScore += 7;
        urgencyFactors.push('OTP validity period approaching (3 months)');
      } else if (input.purchaseTimeline === '3_6_months') {
        urgencyScore += 4;
        urgencyFactors.push('Planning for OTP within 6 months');
      }
      
      if (input.ipaStatus === 'have_ipa') {
        urgencyScore += 3;
        urgencyFactors.push('IPA secured - ready for immediate action');
      } else if (input.ipaStatus === 'applied') {
        urgencyScore += 2;
        urgencyFactors.push('IPA in progress - timing critical');
      }
      
      if (input.propertyCategory === 'new_launch') {
        urgencyScore += 2;
        urgencyFactors.push('New launch booking requires quick decision');
      } else if (input.propertyCategory === 'bto') {
        urgencyScore -= 1;
        urgencyFactors.push('BTO timeline allows for preparation');
      }
    }
    
    // Refinance Lock-in Analysis
    if (input.loanType === 'refinance') {
      if (input.lockInStatus === 'ending_soon') {
        urgencyScore += 9;
        urgencyFactors.push('Lock-in period ending - optimal refinancing window');
      } else if (input.lockInStatus === 'no_lock') {
        urgencyScore += 6;
        urgencyFactors.push('No lock-in restrictions - flexible timing');
      } else if (input.lockInStatus === 'locked') {
        urgencyScore += 1;
        urgencyFactors.push('Currently locked-in - early planning phase');
      }
      
      if (input.currentRate && input.currentRate > 3.5) {
        urgencyScore += 2;
        urgencyFactors.push('Above-market rate detected');
      }
    }
    
    const urgencyLevel = this.calculateUrgencyLevel(urgencyScore);
    const timeline = this.generateTimeline(urgencyLevel, input);
    const recommendations = this.generateOTPRecommendations(urgencyLevel, input);
    
    return {
      urgencyLevel,
      keyFactors: urgencyFactors,
      recommendations,
      timeline,
    };
  }
  
  private analyzePaymentSchemes(input: AnalysisInput): PaymentSchemeAnalysis {
    const analysis: PaymentSchemeAnalysis = {
      progressivePayment: {
        applicable: false,
        benefit: null,
      },
      deferredPayment: {
        applicable: false,
        benefit: null,
      },
      normalPayment: {
        recommendation: 'Standard payment scheme recommended',
      },
    };
    
    if (input.loanType === 'new_purchase') {
      if (input.propertyCategory === 'new_launch' || input.propertyCategory === 'bto') {
        analysis.progressivePayment.applicable = true;
        analysis.progressivePayment.benefit = 
          'Lower initial payments during construction period, increasing gradually';
        
        if (input.propertyCategory === 'bto') {
          analysis.deferredPayment.applicable = true;
          analysis.deferredPayment.benefit = 
            'Defer payments until TOP, suitable for HDB upgraders';
        }
      }
      
      if (input.propertyType === 'EC') {
        analysis.progressivePayment.applicable = true;
        analysis.progressivePayment.benefit = 
          'EC progressive payment aligned with construction milestones';
      }
    }
    
    if (!analysis.progressivePayment.applicable && !analysis.deferredPayment.applicable) {
      analysis.normalPayment.recommendation = 
        input.loanType === 'refinance' 
          ? 'Standard refinancing package with competitive rates'
          : 'Normal payment scheme for completed property purchase';
    }
    
    return analysis;
  }
  
  private analyzeLockInTiming(input: AnalysisInput): LockInAnalysis {
    const analysis: LockInAnalysis = {
      currentStatus: 'unknown',
      actionRequired: false,
      timing: 'No immediate action required',
      strategy: [],
    };
    
    if (input.loanType === 'refinance' && input.lockInStatus) {
      switch (input.lockInStatus) {
        case 'ending_soon':
          analysis.currentStatus = 'ending_soon';
          analysis.actionRequired = true;
          analysis.timing = 'Critical window - act within 3 months before lock-in ends';
          analysis.strategy = [
            'Start comparison 3 months before lock-in expiry',
            'Secure new package 1 month before to avoid reversion',
            'Consider legal subsidy packages to offset conveyancing fees',
          ];
          break;
          
        case 'no_lock':
          analysis.currentStatus = 'free';
          analysis.actionRequired = true;
          analysis.timing = 'Flexible - can refinance anytime';
          analysis.strategy = [
            'Monitor rate movements for optimal timing',
            'Act when rates drop or better packages available',
            'No penalty concerns - focus on best deal',
          ];
          break;
          
        case 'locked':
          analysis.currentStatus = 'locked';
          analysis.actionRequired = false;
          analysis.timing = 'Wait for lock-in period to end';
          analysis.strategy = [
            'Calculate penalty vs savings if considering early exit',
            'Set reminder for 3 months before lock-in ends',
            'Monitor market trends in preparation',
          ];
          break;
          
        default:
          analysis.currentStatus = 'unknown';
          analysis.timing = 'Lock-in status unclear - verification needed';
          analysis.strategy = [
            'Check loan documents for lock-in clause',
            'Contact current bank for lock-in end date',
            'Prepare for potential refinancing opportunities',
          ];
      }
    }
    
    if (input.loanType === 'new_purchase') {
      analysis.currentStatus = 'free';
      analysis.actionRequired = false;
      analysis.timing = 'New loan - consider future lock-in implications';
      analysis.strategy = [
        'Understand lock-in terms before committing',
        'Balance between lower rates and flexibility',
        'Consider if you might sell/refinance within lock-in period',
      ];
    }
    
    return analysis;
  }
  
  private calculateUrgencyLevel(score: number): 'critical' | 'high' | 'moderate' | 'low' {
    if (score >= 10) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 4) return 'moderate';
    return 'low';
  }
  
  private generateTimeline(urgencyLevel: string, input: AnalysisInput): string {
    const timelines: Record<string, string> = {
      critical: 'Immediate action required - within 7-14 days',
      high: 'Action needed within 30 days',
      moderate: 'Plan action within 60-90 days',
      low: 'Monitor and prepare - no immediate rush',
    };
    
    return timelines[urgencyLevel] || timelines.low;
  }
  
  private generateOTPRecommendations(urgencyLevel: string, input: AnalysisInput): string[] {
    const recommendations: string[] = [];
    
    if (urgencyLevel === 'critical' || urgencyLevel === 'high') {
      recommendations.push('Schedule immediate consultation with mortgage specialist');
      recommendations.push('Prepare all required documents now');
      
      if (input.loanType === 'new_purchase') {
        recommendations.push('Secure IPA if not already done');
        recommendations.push('Finalize financing before OTP expiry');
      } else if (input.loanType === 'refinance') {
        recommendations.push('Compare packages from multiple banks immediately');
        recommendations.push('Submit application at least 4 weeks before lock-in ends');
      }
    } else {
      recommendations.push('Begin preliminary research and planning');
      recommendations.push('Gather financial documents at your pace');
      recommendations.push('Monitor market conditions for optimal timing');
    }
    
    return recommendations;
  }
  
  private calculateTDSR(monthlyIncome: number, existingCommitments: number): number {
    const stressTestRate = 0.04;
    const maxTDSR = 0.55;
    
    const totalDebtServicing = existingCommitments;
    const currentTDSR = totalDebtServicing / monthlyIncome;
    const availableTDSR = Math.max(0, maxTDSR - currentTDSR);
    
    return availableTDSR;
  }
  
  private generateAffordabilityInsights(tdsr: number, monthlyIncome: number): string[] {
    const insights: string[] = [];
    const maxMonthlyPayment = tdsr * monthlyIncome;
    
    if (tdsr > 0.45) {
      insights.push(`Strong borrowing capacity: up to $${Math.round(maxMonthlyPayment).toLocaleString()}/month`);
    } else if (tdsr > 0.25) {
      insights.push(`Moderate borrowing capacity: up to $${Math.round(maxMonthlyPayment).toLocaleString()}/month`);
    } else {
      insights.push('Limited borrowing capacity - consider reducing existing commitments');
    }
    
    return insights;
  }
  
  private generateOverallRecommendation(
    otpAnalysis: OTPAnalysis,
    paymentAnalysis: PaymentSchemeAnalysis,
    lockInAnalysis: LockInAnalysis,
    input: AnalysisInput
  ): string {
    const recommendations: string[] = [];
    
    if (otpAnalysis.urgencyLevel === 'critical' || otpAnalysis.urgencyLevel === 'high') {
      recommendations.push('Time-sensitive opportunity requiring immediate action.');
    }
    
    if (paymentAnalysis.progressivePayment.applicable) {
      recommendations.push('Progressive payment scheme available for your property type.');
    }
    
    if (lockInAnalysis.actionRequired) {
      recommendations.push('Lock-in timing favorable for refinancing.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('You have flexibility in timing. Focus on finding the best package.');
    }
    
    return recommendations.join(' ');
  }
  
  private enhanceRecommendationWithFinancials(
    baseRecommendation: string,
    tdsr: number,
    financialData: any
  ): string {
    const enhancements: string[] = [baseRecommendation];
    
    if (tdsr > 0.45) {
      enhancements.push('Your strong financial position provides negotiating leverage.');
    }
    
    if (financialData.packagePreference === 'stability' && financialData.riskTolerance === 'conservative') {
      enhancements.push('Consider fixed-rate packages for payment certainty.');
    } else if (financialData.packagePreference === 'lowest_rate' && financialData.riskTolerance === 'aggressive') {
      enhancements.push('Floating rate packages may offer better value for your risk profile.');
    }
    
    return enhancements.join(' ');
  }
  
  private generateNextSteps(
    otpAnalysis: OTPAnalysis,
    lockInAnalysis: LockInAnalysis,
    input: AnalysisInput
  ): string[] {
    const steps: string[] = [];
    
    if (otpAnalysis.urgencyLevel === 'critical' || otpAnalysis.urgencyLevel === 'high') {
      steps.push('1. Schedule immediate consultation with mortgage broker');
      steps.push('2. Prepare income documents and property papers');
      steps.push('3. Get loan quotes from 3-5 banks');
    } else {
      steps.push('1. Research current market rates and trends');
      steps.push('2. Calculate your borrowing capacity');
      steps.push('3. Plan your timeline for action');
    }
    
    if (lockInAnalysis.actionRequired) {
      steps.push('4. Review lock-in exit dates and penalties');
      steps.push('5. Time application to avoid reversion rates');
    }
    
    return steps;
  }
}