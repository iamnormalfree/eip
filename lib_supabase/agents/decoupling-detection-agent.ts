import { z } from 'zod';

const DecouplingInputSchema = z.object({
  loanType: z.enum(['new_purchase', 'refinance', 'commercial']),
  name: z.string().min(1),
  email: z.string().email(),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']).optional(),
  propertyCategory: z.enum(['resale', 'new_launch', 'bto']).optional(),
  priceRange: z.number().optional(),
  purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']).optional(),
  monthlyIncome: z.number().optional(),
  existingCommitments: z.number().optional(),
  firstTimeBuyer: z.boolean().optional(),
  // Pattern recognition context
  sessionBehavior: z.object({
    completionSpeed: z.number().optional(),
    hesitationPoints: z.array(z.string()).optional(),
    revisitedFields: z.array(z.string()).optional(),
  }).optional(),
});

type DecouplingInput = z.infer<typeof DecouplingInputSchema>;

interface MaritalStatusInference {
  inferredStatus: 'single' | 'married' | 'divorced' | 'unknown';
  confidenceLevel: 'high' | 'medium' | 'low';
  indicators: string[];
  requiresVerification: boolean;
}

interface ABSDOptimizationDetection {
  potentialDecoupling: boolean;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  indicators: string[];
  optimizationStrategies: string[];
  legalConsiderations: string[];
}

interface PatternRecognition {
  singleNamePurchasePattern: boolean;
  spousePropertyIndicators: string[];
  ABSDAvoidanceSignals: string[];
  previousDecouplingHistory: boolean;
}

interface DecouplingDetectionResult {
  maritalStatusInference: MaritalStatusInference;
  absdOptimization: ABSDOptimizationDetection;
  patternRecognition: PatternRecognition;
  strategicRecommendations: string[];
  followUpQuestions: string[];
  brokerConsultationPriority: 'immediate' | 'high' | 'medium' | 'standard';
}

export class DecouplingDetectionAgent {
  async analyzeDecouplingPatterns(input: DecouplingInput): Promise<DecouplingDetectionResult> {
    const validatedInput = DecouplingInputSchema.parse(input);
    
    // Core analysis components
    const maritalStatusInference = this.inferMaritalStatus(validatedInput);
    const patternRecognition = this.recognizeDecouplingPatterns(validatedInput);
    const absdOptimization = this.detectABSDOptimization(validatedInput, maritalStatusInference, patternRecognition);
    
    // Generate strategic outputs
    const strategicRecommendations = this.generateStrategicRecommendations(
      maritalStatusInference,
      absdOptimization,
      validatedInput
    );
    
    const followUpQuestions = this.generateFollowUpQuestions(
      maritalStatusInference,
      absdOptimization
    );
    
    const brokerConsultationPriority = this.assessConsultationPriority(
      absdOptimization,
      maritalStatusInference,
      validatedInput
    );
    
    return {
      maritalStatusInference,
      absdOptimization,
      patternRecognition,
      strategicRecommendations,
      followUpQuestions,
      brokerConsultationPriority,
    };
  }

  private inferMaritalStatus(input: DecouplingInput): MaritalStatusInference {
    const indicators: string[] = [];
    let inferredStatus: 'single' | 'married' | 'divorced' | 'unknown' = 'unknown';
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    let requiresVerification = false;

    // Name pattern analysis
    const namePatterns = this.analyzeNamePatterns(input.name);
    if (namePatterns.likelyMarried) {
      indicators.push('Name pattern suggests married status');
      inferredStatus = 'married';
      confidenceLevel = 'medium';
    }

    // Property type vs income analysis
    if (input.priceRange && input.monthlyIncome) {
      const affordabilityRatio = input.priceRange / (input.monthlyIncome * 12);
      if (affordabilityRatio > 15 && input.propertyType !== 'HDB') {
        indicators.push('High property-to-income ratio suggests dual-income household');
        if (inferredStatus === 'unknown') {
          inferredStatus = 'married';
          confidenceLevel = 'medium';
        }
      }
    }

    // Purchase behavior patterns
    if (input.loanType === 'new_purchase') {
      if (input.propertyType === 'Private' && input.firstTimeBuyer === false) {
        indicators.push('Non-first-time private property purchase pattern');
        requiresVerification = true;
      }
      
      if (input.purchaseTimeline === 'this_month' && input.propertyType === 'Private') {
        indicators.push('Urgent private property purchase may indicate ABSD deadline');
        requiresVerification = true;
        confidenceLevel = 'high';
      }
    }

    // Session behavior analysis
    if (input.sessionBehavior) {
      if (input.sessionBehavior.hesitationPoints?.includes('ownershipStructure')) {
        indicators.push('Hesitation around ownership structure questions');
        requiresVerification = true;
      }
      
      if (input.sessionBehavior.revisitedFields?.includes('name')) {
        indicators.push('Name field revisited - possible joint vs single consideration');
        requiresVerification = true;
      }
    }

    // Final confidence adjustment
    if (requiresVerification && confidenceLevel === 'low') {
      confidenceLevel = 'medium';
    }

    return {
      inferredStatus,
      confidenceLevel,
      indicators,
      requiresVerification,
    };
  }

  private recognizeDecouplingPatterns(input: DecouplingInput): PatternRecognition {
    const singleNamePurchasePattern = this.detectSingleNamePurchasePattern(input);
    const spousePropertyIndicators = this.identifySpousePropertyIndicators(input);
    const ABSDAvoidanceSignals = this.detectABSDAvoidanceSignals(input);
    const previousDecouplingHistory = this.checkPreviousDecouplingHistory(input);

    return {
      singleNamePurchasePattern,
      spousePropertyIndicators,
      ABSDAvoidanceSignals,
      previousDecouplingHistory,
    };
  }

  private detectSingleNamePurchasePattern(input: DecouplingInput): boolean {
    // High-value property with single applicant patterns
    if (input.priceRange && input.priceRange > 1500000 && input.propertyType === 'Private') {
      return true;
    }
    
    // Multiple property ownership patterns
    if (input.loanType === 'new_purchase' && input.firstTimeBuyer === false) {
      return true;
    }
    
    return false;
  }

  private identifySpousePropertyIndicators(input: DecouplingInput): string[] {
    const indicators: string[] = [];
    
    if (input.propertyType === 'Private' && input.loanType === 'new_purchase') {
      indicators.push('Private property purchase - spouse property status relevant for ABSD');
    }
    
    if (input.priceRange && input.priceRange > 2000000) {
      indicators.push('High-value purchase - decoupling benefits significant');
    }
    
    if (input.purchaseTimeline === 'this_month' || input.purchaseTimeline === 'next_3_months') {
      indicators.push('Urgent timeline may indicate ABSD optimization strategy');
    }
    
    return indicators;
  }

  private detectABSDAvoidanceSignals(input: DecouplingInput): string[] {
    const signals: string[] = [];
    
    // Timing urgency for high-value properties
    if (input.priceRange && input.priceRange > 1000000 && 
        (input.purchaseTimeline === 'this_month' || input.purchaseTimeline === 'next_3_months')) {
      signals.push('Urgent high-value purchase timeline');
    }
    
    // Property type switching patterns
    if (input.propertyType === 'Private' && input.firstTimeBuyer === false) {
      signals.push('Multiple property ownership pattern');
    }
    
    // Income vs property value misalignment
    if (input.monthlyIncome && input.priceRange) {
      const monthlyPaymentEstimate = (input.priceRange * 0.8 * 0.035) / 12; // Rough estimate
      const incomeRatio = monthlyPaymentEstimate / input.monthlyIncome;
      
      if (incomeRatio > 0.6) {
        signals.push('High debt-to-income ratio suggests potential joint financing needs');
      }
    }
    
    return signals;
  }

  private checkPreviousDecouplingHistory(input: DecouplingInput): boolean {
    // This would typically check against a database or external records
    // For now, we use behavioral patterns as proxies
    
    const experiencedBuyerPatterns = [
      input.firstTimeBuyer === false,
      input.sessionBehavior?.completionSpeed && input.sessionBehavior.completionSpeed < 300, // Fast completion
      input.loanType === 'refinance' && input.propertyType === 'Private'
    ];
    
    return experiencedBuyerPatterns.filter(Boolean).length >= 2;
  }

  private detectABSDOptimization(
    input: DecouplingInput,
    maritalInference: MaritalStatusInference,
    patterns: PatternRecognition
  ): ABSDOptimizationDetection {
    let potentialDecoupling = false;
    let riskLevel: 'high' | 'medium' | 'low' | 'none' = 'none';
    const indicators: string[] = [];
    const optimizationStrategies: string[] = [];
    const legalConsiderations: string[] = [];

    // High-risk indicators
    if (maritalInference.inferredStatus === 'married' && patterns.singleNamePurchasePattern) {
      potentialDecoupling = true;
      riskLevel = 'high';
      indicators.push('Married individual making single-name high-value purchase');
    }

    if (patterns.ABSDAvoidanceSignals.length > 1) {
      potentialDecoupling = true;
      if (riskLevel === 'none') riskLevel = 'medium';
      indicators.push('Multiple ABSD optimization signals detected');
    }

    if (input.propertyType === 'Private' && input.priceRange && input.priceRange > 1000000) {
      if (riskLevel === 'none') riskLevel = 'low';
      indicators.push('Private property purchase above $1M - ABSD applicable');
    }

    // Generate optimization strategies if decoupling detected
    if (potentialDecoupling) {
      optimizationStrategies.push(
        'Consider timing of property transfer relative to purchase',
        'Evaluate CPF usage implications for both spouses',
        'Assess loan eligibility under single vs joint application',
        'Compare ABSD savings vs additional costs and restrictions'
      );

      legalConsiderations.push(
        'Decoupling must be genuine transfer, not paper transaction',
        'CPF usage may be restricted for 30 months after transfer',
        'Legal and conveyancing costs for transfer process',
        'HDB eligibility rules if applicable for future purchases'
      );
    }

    return {
      potentialDecoupling,
      riskLevel,
      indicators,
      optimizationStrategies,
      legalConsiderations,
    };
  }

  private generateStrategicRecommendations(
    maritalInference: MaritalStatusInference,
    absdOptimization: ABSDOptimizationDetection,
    input: DecouplingInput
  ): string[] {
    const recommendations: string[] = [];

    if (absdOptimization.potentialDecoupling && absdOptimization.riskLevel === 'high') {
      recommendations.push(
        'Immediate consultation with property law specialist recommended',
        'Comprehensive ABSD optimization analysis required before proceeding',
        'Consider all legal implications and timelines for effective decoupling'
      );
    } else if (absdOptimization.riskLevel === 'medium') {
      recommendations.push(
        'Property purchase structure optimization may provide significant savings',
        'Professional advice on ownership structure recommended'
      );
    }

    if (maritalInference.requiresVerification) {
      recommendations.push(
        'Ownership structure clarification will optimize package recommendations',
        'Spousal property ownership status affects loan terms and ABSD liability'
      );
    }

    if (input.priceRange && input.priceRange > 1500000) {
      recommendations.push(
        'High-value purchase warrants comprehensive financial structuring advice',
        'Multiple financing scenarios should be evaluated for optimal outcome'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Your purchase appears straightforward with standard ABSD treatment',
        'Focus on securing the best loan package for your circumstances'
      );
    }

    return recommendations;
  }

  private generateFollowUpQuestions(
    maritalInference: MaritalStatusInference,
    absdOptimization: ABSDOptimizationDetection
  ): string[] {
    const questions: string[] = [];

    if (maritalInference.requiresVerification || absdOptimization.potentialDecoupling) {
      questions.push(
        'Are you currently married, and if so, does your spouse own any property?',
        'Will this property be purchased under single or joint names?'
      );
    }

    if (absdOptimization.riskLevel === 'high' || absdOptimization.riskLevel === 'medium') {
      questions.push(
        'Have you considered the timing of this purchase in relation to any property transfers?',
        'Are you aware of the ABSD rates applicable to your situation?'
      );
    }

    if (absdOptimization.optimizationStrategies.length > 0) {
      questions.push(
        'Would you like to explore property purchase structuring options?',
        'Are you open to discussing ABSD optimization strategies?'
      );
    }

    return questions;
  }

  private assessConsultationPriority(
    absdOptimization: ABSDOptimizationDetection,
    maritalInference: MaritalStatusInference,
    input: DecouplingInput
  ): 'immediate' | 'high' | 'medium' | 'standard' {
    if (absdOptimization.riskLevel === 'high' && 
        (input.purchaseTimeline === 'this_month' || input.purchaseTimeline === 'next_3_months')) {
      return 'immediate';
    }

    if (absdOptimization.potentialDecoupling && absdOptimization.riskLevel === 'high') {
      return 'high';
    }

    if (absdOptimization.riskLevel === 'medium' || maritalInference.requiresVerification) {
      return 'medium';
    }

    return 'standard';
  }

  private analyzeNamePatterns(name: string): { likelyMarried: boolean } {
    // Basic pattern recognition - this could be enhanced with more sophisticated analysis
    const nameWords = name.trim().split(/\s+/);
    
    // Simple heuristics - in practice, this would be more nuanced
    const commonMarriedIndicators = [
      nameWords.length >= 3, // Multiple names might indicate maiden + married names
      /mrs?\.?/i.test(name), // Title indicators
    ];
    
    const likelyMarried = commonMarriedIndicators.some(indicator => indicator);
    
    return { likelyMarried };
  }
}