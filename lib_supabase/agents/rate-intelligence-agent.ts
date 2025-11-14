import { z } from 'zod';

const RateAnalysisInputSchema = z.object({
  loanType: z.enum(['new_purchase', 'refinance', 'commercial']),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']).optional(),
  loanAmount: z.number().optional(),
  tenure: z.number().optional(),
  packagePreference: z.enum(['lowest_rate', 'flexibility', 'stability', 'features']).optional(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  planningHorizon: z.enum(['short_term', 'medium_term', 'long_term']).optional(),
  currentRate: z.number().optional(),
  monthlyIncome: z.number().optional(),
});

type RateAnalysisInput = z.infer<typeof RateAnalysisInputSchema>;

interface MarketAnalysis {
  soraOutlook: {
    trend: 'rising' | 'stable' | 'falling';
    volatility: 'high' | 'moderate' | 'low';
    keyFactors: string[];
    implications: string[];
  };
  fedOutlook: {
    trend: 'hawkish' | 'neutral' | 'dovish';
    expectedMoves: string;
    impact: string;
  };
  localFactors: {
    masPolicy: string;
    propertyMarket: string;
    economicGrowth: string;
  };
}

interface PackageComparison {
  fixedRate: {
    pros: string[];
    cons: string[];
    suitability: 'excellent' | 'good' | 'moderate' | 'poor';
    reasoning: string;
  };
  floatingRate: {
    pros: string[];
    cons: string[];
    suitability: 'excellent' | 'good' | 'moderate' | 'poor';
    reasoning: string;
  };
  recommendation: {
    primaryChoice: 'fixed' | 'floating' | 'hybrid';
    rationale: string;
    alternativeOptions: string[];
  };
}

interface BankCategoryAnalysis {
  localBanks: {
    advantages: string[];
    considerations: string[];
    typicalFeatures: string[];
  };
  foreignBanks: {
    advantages: string[];
    considerations: string[];
    typicalFeatures: string[];
  };
  digitalBanks: {
    advantages: string[];
    considerations: string[];
    availability: string;
  };
  recommendation: {
    primaryCategory: 'local' | 'foreign' | 'digital' | 'mixed';
    reasoning: string;
  };
}

interface RateIntelligenceResult {
  marketAnalysis: MarketAnalysis;
  packageComparison: PackageComparison;
  bankCategoryAnalysis: BankCategoryAnalysis;
  strategicInsights: string[];
  negotiationPoints: string[];
  timingRecommendation: string;
}

export class RateIntelligenceAgent {
  async generateIntelligence(input: RateAnalysisInput): Promise<RateIntelligenceResult> {
    const validatedInput = RateAnalysisInputSchema.parse(input);
    
    const marketAnalysis = this.analyzeMarketConditions(validatedInput);
    const packageComparison = this.comparePackageTypes(validatedInput, marketAnalysis);
    const bankCategoryAnalysis = this.analyzeBankCategories(validatedInput);
    const strategicInsights = this.generateStrategicInsights(
      validatedInput,
      marketAnalysis,
      packageComparison
    );
    const negotiationPoints = this.generateNegotiationPoints(validatedInput);
    const timingRecommendation = this.generateTimingRecommendation(
      marketAnalysis,
      validatedInput
    );
    
    return {
      marketAnalysis,
      packageComparison,
      bankCategoryAnalysis,
      strategicInsights,
      negotiationPoints,
      timingRecommendation,
    };
  }
  
  private analyzeMarketConditions(input: RateAnalysisInput): MarketAnalysis {
    // SORA Analysis (Singapore Overnight Rate Average)
    const soraAnalysis = this.analyzeSORATrends();
    
    // Federal Reserve Analysis
    const fedAnalysis = this.analyzeFedPolicy();
    
    // Local Singapore Factors
    const localFactors = this.analyzeLocalFactors(input);
    
    return {
      soraOutlook: soraAnalysis,
      fedOutlook: fedAnalysis,
      localFactors,
    };
  }
  
  private analyzeSORATrends(): MarketAnalysis['soraOutlook'] {
    // Simulated SORA analysis based on market conditions
    // In production, this would integrate with real market data
    const currentMarketPhase = this.getCurrentMarketPhase();
    
    switch (currentMarketPhase) {
      case 'tightening':
        return {
          trend: 'rising',
          volatility: 'moderate',
          keyFactors: [
            'MAS tightening monetary policy',
            'Strong SGD policy stance',
            'Inflation management measures',
          ],
          implications: [
            'Floating rates likely to increase',
            'Fixed rates offer stability advantage',
            'Consider locking in rates sooner',
          ],
        };
      
      case 'easing':
        return {
          trend: 'falling',
          volatility: 'low',
          keyFactors: [
            'Global economic slowdown concerns',
            'MAS easing stance',
            'Controlled inflation environment',
          ],
          implications: [
            'Floating rates may decrease',
            'Opportunity for rate reduction',
            'Consider shorter lock-in periods',
          ],
        };
      
      default: // stable
        return {
          trend: 'stable',
          volatility: 'low',
          keyFactors: [
            'Balanced monetary policy',
            'Stable economic growth',
            'Moderate inflation expectations',
          ],
          implications: [
            'Rates expected to remain range-bound',
            'Both fixed and floating viable',
            'Focus on package features over rate type',
          ],
        };
    }
  }
  
  private analyzeFedPolicy(): MarketAnalysis['fedOutlook'] {
    // Simulated Fed policy analysis
    const fedStance = this.getCurrentFedStance();
    
    switch (fedStance) {
      case 'hawkish':
        return {
          trend: 'hawkish',
          expectedMoves: 'Potential rate hikes in next 6-12 months',
          impact: 'Upward pressure on Singapore rates, especially SORA-pegged packages',
        };
      
      case 'dovish':
        return {
          trend: 'dovish',
          expectedMoves: 'Rate cuts likely or prolonged pause',
          impact: 'Downward pressure on rates, favorable for borrowers',
        };
      
      default: // neutral
        return {
          trend: 'neutral',
          expectedMoves: 'Rates on hold, data-dependent approach',
          impact: 'Limited direct impact, focus on local factors',
        };
    }
  }
  
  private analyzeLocalFactors(input: RateAnalysisInput): MarketAnalysis['localFactors'] {
    const factors: MarketAnalysis['localFactors'] = {
      masPolicy: 'MAS maintaining prudent lending standards with TDSR framework',
      propertyMarket: 'Stable property market with controlled price growth',
      economicGrowth: 'Resilient economic growth supporting mortgage market',
    };
    
    if (input.propertyType === 'HDB') {
      factors.propertyMarket = 'HDB market stable with government support measures';
    } else if (input.propertyType === 'Private' || input.propertyType === 'Landed') {
      factors.propertyMarket = 'Private property market showing selective strength';
    }
    
    return factors;
  }
  
  private comparePackageTypes(
    input: RateAnalysisInput,
    marketAnalysis: MarketAnalysis
  ): PackageComparison {
    const fixedRateAnalysis = this.analyzeFixedRate(input, marketAnalysis);
    const floatingRateAnalysis = this.analyzeFloatingRate(input, marketAnalysis);
    const recommendation = this.generatePackageRecommendation(
      input,
      fixedRateAnalysis,
      floatingRateAnalysis
    );
    
    return {
      fixedRate: fixedRateAnalysis,
      floatingRate: floatingRateAnalysis,
      recommendation,
    };
  }
  
  private analyzeFixedRate(
    input: RateAnalysisInput,
    marketAnalysis: MarketAnalysis
  ): PackageComparison['fixedRate'] {
    const pros: string[] = [
      'Payment certainty for budgeting',
      'Protection against rate increases',
      'Peace of mind during lock-in period',
    ];
    
    const cons: string[] = [
      'Cannot benefit from rate decreases',
      'Higher rates than floating initially',
      'Lock-in penalties restrict flexibility',
    ];
    
    if (marketAnalysis.soraOutlook.trend === 'rising') {
      pros.push('Excellent hedge against rising rates');
    }
    
    if (input.riskTolerance === 'conservative') {
      pros.push('Aligns with conservative risk profile');
    }
    
    let suitability: 'excellent' | 'good' | 'moderate' | 'poor' = 'good';
    let reasoning = 'Fixed rates provide stability and predictability';
    
    if (input.packagePreference === 'stability' && input.riskTolerance === 'conservative') {
      suitability = 'excellent';
      reasoning = 'Perfect match for stability preference and conservative profile';
    } else if (input.packagePreference === 'lowest_rate' && marketAnalysis.soraOutlook.trend === 'falling') {
      suitability = 'moderate';
      reasoning = 'May miss opportunities for rate reduction';
    }
    
    return { pros, cons, suitability, reasoning };
  }
  
  private analyzeFloatingRate(
    input: RateAnalysisInput,
    marketAnalysis: MarketAnalysis
  ): PackageComparison['floatingRate'] {
    const pros: string[] = [
      'Typically lower initial rates',
      'Benefit from rate decreases',
      'Greater flexibility to refinance',
      'No lock-in penalties in many cases',
    ];
    
    const cons: string[] = [
      'Payment uncertainty',
      'Exposed to rate increases',
      'Requires active monitoring',
    ];
    
    if (marketAnalysis.soraOutlook.trend === 'falling') {
      pros.push('Positioned to benefit from declining rates');
    }
    
    if (input.riskTolerance === 'aggressive') {
      pros.push('Suitable for risk-tolerant borrowers');
    }
    
    let suitability: 'excellent' | 'good' | 'moderate' | 'poor' = 'good';
    let reasoning = 'Floating rates offer flexibility and potential savings';
    
    if (input.packagePreference === 'lowest_rate' && input.riskTolerance === 'aggressive') {
      suitability = 'excellent';
      reasoning = 'Optimal for rate-focused, risk-tolerant borrowers';
    } else if (input.packagePreference === 'stability' && input.riskTolerance === 'conservative') {
      suitability = 'poor';
      reasoning = 'Misaligned with stability needs and conservative profile';
    }
    
    return { pros, cons, suitability, reasoning };
  }
  
  private generatePackageRecommendation(
    input: RateAnalysisInput,
    fixedAnalysis: PackageComparison['fixedRate'],
    floatingAnalysis: PackageComparison['floatingRate']
  ): PackageComparison['recommendation'] {
    let primaryChoice: 'fixed' | 'floating' | 'hybrid' = 'hybrid';
    let rationale = '';
    const alternativeOptions: string[] = [];
    
    // Decision logic based on suitability scores and preferences
    if (fixedAnalysis.suitability === 'excellent' && floatingAnalysis.suitability !== 'excellent') {
      primaryChoice = 'fixed';
      rationale = 'Fixed rate packages align perfectly with your profile and market conditions';
      alternativeOptions.push('Consider hybrid packages for partial flexibility');
    } else if (floatingAnalysis.suitability === 'excellent' && fixedAnalysis.suitability !== 'excellent') {
      primaryChoice = 'floating';
      rationale = 'Floating rate packages optimize for your rate goals and risk tolerance';
      alternativeOptions.push('Consider board rate packages for transparency');
    } else {
      primaryChoice = 'hybrid';
      rationale = 'Hybrid packages balance stability with flexibility for optimal positioning';
      alternativeOptions.push('Fixed for 1-2 years then floating');
      alternativeOptions.push('Split loan with both fixed and floating portions');
    }
    
    // Add tenure-specific recommendations
    if (input.planningHorizon === 'short_term') {
      alternativeOptions.push('Shorter lock-in periods (1-2 years) for flexibility');
    } else if (input.planningHorizon === 'long_term') {
      alternativeOptions.push('Longer fixed periods (3-5 years) for extended stability');
    }
    
    return {
      primaryChoice,
      rationale,
      alternativeOptions,
    };
  }
  
  private analyzeBankCategories(input: RateAnalysisInput): BankCategoryAnalysis {
    const analysis: BankCategoryAnalysis = {
      localBanks: {
        advantages: [
          'Strong local presence and branch network',
          'Deep understanding of Singapore market',
          'Comprehensive suite of services',
          'Government-linked stability',
        ],
        considerations: [
          'May have stricter approval criteria',
          'Less flexibility in special situations',
        ],
        typicalFeatures: [
          'HDB and private property expertise',
          'CPF integration seamless',
          'Local customer service',
        ],
      },
      foreignBanks: {
        advantages: [
          'Competitive rates to gain market share',
          'Innovative package structures',
          'Global banking relationships',
          'Flexible underwriting for complex cases',
        ],
        considerations: [
          'Limited branch network',
          'May exit market or change strategy',
        ],
        typicalFeatures: [
          'Attractive promotional rates',
          'Relationship pricing benefits',
          'Cross-border capabilities',
        ],
      },
      digitalBanks: {
        advantages: [
          'Lower operational costs may translate to better rates',
          'Streamlined digital processes',
          'Innovative features and transparency',
        ],
        considerations: [
          'Limited track record in mortgages',
          'No physical branches',
          'Newer entrants to market',
        ],
        availability: 'Currently limited mortgage offerings, expected to expand',
      },
      recommendation: {
        primaryCategory: 'mixed',
        reasoning: '',
      },
    };
    
    // Customize recommendation based on input
    if (input.propertyType === 'HDB') {
      analysis.recommendation.primaryCategory = 'local';
      analysis.recommendation.reasoning = 
        'Local banks have strongest HDB loan expertise and processing efficiency';
    } else if (input.loanAmount && input.loanAmount > 2000000) {
      analysis.recommendation.primaryCategory = 'foreign';
      analysis.recommendation.reasoning = 
        'Foreign banks often provide better terms for high-value mortgages';
    } else if (input.packagePreference === 'lowest_rate') {
      analysis.recommendation.primaryCategory = 'mixed';
      analysis.recommendation.reasoning = 
        'Compare across all categories for best rates - foreign banks often competitive';
    } else {
      analysis.recommendation.primaryCategory = 'local';
      analysis.recommendation.reasoning = 
        'Local banks offer best overall stability and service for standard mortgages';
    }
    
    return analysis;
  }
  
  private generateStrategicInsights(
    input: RateAnalysisInput,
    marketAnalysis: MarketAnalysis,
    packageComparison: PackageComparison
  ): string[] {
    const insights: string[] = [];
    
    // Market timing insights
    if (marketAnalysis.soraOutlook.trend === 'rising') {
      insights.push('Rising rate environment favors locking in fixed rates now');
    } else if (marketAnalysis.soraOutlook.trend === 'falling') {
      insights.push('Declining rate outlook suggests floating rates or shorter lock-ins');
    }
    
    // Package strategy insights
    if (packageComparison.recommendation.primaryChoice === 'hybrid') {
      insights.push('Hybrid packages provide optimal risk-return balance in uncertain markets');
    }
    
    // Refinancing insights
    if (input.loanType === 'refinance') {
      if (input.currentRate && input.currentRate > 3.5) {
        insights.push('Current rate above market - significant savings potential from refinancing');
      }
      insights.push('Compare total costs including legal fees, not just interest rates');
    }
    
    // Property-specific insights
    if (input.propertyType === 'HDB') {
      insights.push('HDB loans at 2.6% provide benchmark - bank packages must beat total cost');
    } else if (input.propertyType === 'Private' || input.propertyType === 'Landed') {
      insights.push('Private property loans offer more negotiation room with relationship managers');
    }
    
    // Risk management insights
    if (input.riskTolerance === 'conservative') {
      insights.push('Consider partial prepayment options to reduce interest exposure');
    } else if (input.riskTolerance === 'aggressive') {
      insights.push('Board rates offer transparency but require active monitoring');
    }
    
    return insights;
  }
  
  private generateNegotiationPoints(input: RateAnalysisInput): string[] {
    const points: string[] = [];
    
    // Universal negotiation points
    points.push('Request waiver or subsidy for legal and valuation fees');
    points.push('Negotiate for rate locks during application period');
    points.push('Ask for removal or reduction of cancellation fees');
    
    // Income-based negotiation
    if (input.monthlyIncome && input.monthlyIncome > 15000) {
      points.push('Leverage high income for preferential pricing tiers');
      points.push('Negotiate for premier banking benefits bundled with mortgage');
    }
    
    // Loan amount negotiation
    if (input.loanAmount && input.loanAmount > 1000000) {
      points.push('High loan quantum qualifies for volume discounts');
      points.push('Request dedicated relationship manager for personalized service');
    }
    
    // Refinancing specific
    if (input.loanType === 'refinance') {
      points.push('Highlight loyalty if staying with same bank group');
      points.push('Use competing offers to negotiate better terms');
      points.push('Request for cash rebates or renovation loan top-ups');
    }
    
    // New purchase specific
    if (input.loanType === 'new_purchase') {
      points.push('Bundle with fire insurance for additional discounts');
      points.push('Negotiate for grace period before first payment');
    }
    
    return points;
  }
  
  private generateTimingRecommendation(
    marketAnalysis: MarketAnalysis,
    input: RateAnalysisInput
  ): string {
    let timing = '';
    
    // Market-based timing
    if (marketAnalysis.soraOutlook.trend === 'rising' && marketAnalysis.soraOutlook.volatility === 'high') {
      timing = 'Act quickly - rate environment deteriorating. Lock in rates within 2-4 weeks.';
    } else if (marketAnalysis.soraOutlook.trend === 'falling') {
      timing = 'Patient approach warranted - improving rate environment over next 3-6 months.';
    } else {
      timing = 'Stable environment - focus on finding best package rather than timing.';
    }
    
    // Urgency modifiers
    if (input.loanType === 'refinance') {
      timing += ' For refinancing, start process 3 months before current lock-in ends.';
    } else if (input.loanType === 'new_purchase') {
      timing += ' For new purchase, secure approval before exercising OTP.';
    }
    
    return timing;
  }
  
  private getCurrentMarketPhase(): 'tightening' | 'easing' | 'stable' {
    // In production, this would use real market data
    // For now, returning a simulated state
    const phases = ['tightening', 'easing', 'stable'] as const;
    return phases[Math.floor(Date.now() / 86400000) % 3];
  }
  
  private getCurrentFedStance(): 'hawkish' | 'dovish' | 'neutral' {
    // In production, this would use real Fed policy indicators
    // For now, returning a simulated stance
    const stances = ['hawkish', 'dovish', 'neutral'] as const;
    return stances[Math.floor(Date.now() / 86400000) % 3];
  }
}