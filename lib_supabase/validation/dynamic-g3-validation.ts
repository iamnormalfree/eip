/**
 * Dynamic G3 Validation Strategy
 * Lead: Dr. Elena Rossi & Marcus Chen
 *
 * Intent-based validation that adapts to loan type and available data
 * Enables intelligent AI analysis regardless of field completeness
 */

import { getPlaceholderRate } from '../calculations/instant-profile'

export interface G3ValidationContext {
  loanType: 'new_purchase' | 'refinance' | 'commercial'
  formData: Record<string, any>
  gate: string
}

export interface ValidationResult {
  ok: boolean
  missing?: string[]
  optional?: string[]
  score: number
  analysisCapability: 'basic' | 'intermediate' | 'comprehensive'
  aiReadiness: {
    canGenerateInsights: boolean
    canCalculateSavings: boolean
    canProvideBankMatches: boolean
    canOfferTimingAdvice: boolean
  }
}

/**
 * Core required fields for ANY mortgage analysis
 */
const UNIVERSAL_REQUIRED = ['name', 'email', 'phone', 'loanType']

/**
 * Intent-specific field requirements
 */
const INTENT_FIELDS = {
  new_purchase: {
    required: ['propertyType', 'priceRange', 'monthlyIncome'],
    optional: ['purchaseTimeline', 'ipaStatus', 'firstTimeBuyer', 'existingCommitments'],
    aiEnhancers: ['employmentType', 'citizenship'] // Fields that unlock better AI insights
  },
  refinance: {
    required: ['currentRate', 'outstandingLoan', 'monthlyIncome'],
    optional: ['lockInStatus', 'currentBank', 'propertyValue', 'existingCommitments'],
    aiEnhancers: ['yearsRemaining', 'originalLoanAmount', 'propertyType']
  },
  commercial: {
    required: ['propertyValue', 'businessType', 'monthlyIncome'],
    optional: ['businessRevenue', 'tenancyRate', 'existingCommitments'],
    aiEnhancers: ['propertyType', 'tenureDesired', 'renovation']
  }
}

/**
 * Dynamic validation that adapts to context
 */
export function validateG3Dynamic(context: G3ValidationContext): ValidationResult {
  const { loanType, formData } = context
  const intentConfig = INTENT_FIELDS[loanType]
  
  // Check universal requirements
  const missingUniversal = UNIVERSAL_REQUIRED.filter(
    field => !formData[field] && formData[field] !== 0
  )
  
  // Check intent-specific requirements
  const missingRequired = intentConfig.required.filter(
    field => !formData[field] && formData[field] !== 0
  )
  
  // Calculate completeness scores
  const requiredScore = (intentConfig.required.filter(f => formData[f] || formData[f] === 0).length / intentConfig.required.length) * 40
  const optionalScore = (intentConfig.optional.filter(f => formData[f] || formData[f] === 0).length / intentConfig.optional.length) * 30
  const enhancerScore = (intentConfig.aiEnhancers.filter(f => formData[f] || formData[f] === 0).length / intentConfig.aiEnhancers.length) * 30
  
  const totalScore = Math.round(requiredScore + optionalScore + enhancerScore)
  
  // Determine analysis capability
  let analysisCapability: 'basic' | 'intermediate' | 'comprehensive' = 'basic'
  if (totalScore >= 80) analysisCapability = 'comprehensive'
  else if (totalScore >= 60) analysisCapability = 'intermediate'
  
  // Determine AI readiness for different features
  const aiReadiness = {
    canGenerateInsights: missingRequired.length === 0,
    canCalculateSavings: loanType === 'refinance' ? 
      Boolean(formData.currentRate && formData.outstandingLoan) : 
      Boolean(formData.priceRange && formData.monthlyIncome),
    canProvideBankMatches: Boolean(formData.monthlyIncome && (formData.propertyType || formData.propertyValue)),
    canOfferTimingAdvice: loanType === 'refinance' ? 
      Boolean(formData.lockInStatus) : 
      Boolean(formData.purchaseTimeline)
  }
  
  return {
    ok: missingUniversal.length === 0 && missingRequired.length === 0,
    missing: [...missingUniversal, ...missingRequired],
    optional: intentConfig.optional.filter(f => !formData[f] && formData[f] !== 0),
    score: totalScore,
    analysisCapability,
    aiReadiness
  }
}

/**
 * Calculate financial metrics based on available data
 */
export function calculateFinancialMetrics(formData: Record<string, any>) {
  const income = Number(formData.monthlyIncome) || 0
  const outstanding = Number(formData.outstandingLoan) || 0
  const commitments = Number(formData.existingCommitments) || 0
  const currentRate = Number(formData.currentRate) || 0
  
  // DSR Calculation (Debt Servicing Ratio)
  let dsr = null
  if (income > 0) {
    const monthlyDebt = (outstanding * 0.003) + commitments // Rough estimate
    dsr = monthlyDebt / income
  }
  
  // Potential Savings (for refinance)
  let potentialSavings = null
  if (currentRate > 0 && outstanding > 0) {
    const marketRate = getPlaceholderRate(formData.propertyType || 'Private', 'refinance')
    if (currentRate > marketRate) {
      const currentMonthly = outstanding * (currentRate / 100 / 12)
      const newMonthly = outstanding * (marketRate / 100 / 12)
      potentialSavings = Math.round(currentMonthly - newMonthly)
    }
  }
  
  // Affordability (for new purchase)
  let maxLoan = null
  if (income > 0 && formData.loanType === 'new_purchase') {
    // Using 55% DSR limit
    const maxMonthlyPayment = income * 0.55 - commitments
    // Rough calculation: loan = monthly * 300 (assumes ~3.5% over 25 years)
    maxLoan = Math.round(maxMonthlyPayment * 300)
  }
  
  return {
    dsr: dsr ? Number(dsr.toFixed(2)) : null,
    potentialSavings,
    maxLoan,
    hasHighDSR: dsr && dsr > 0.55,
    hasSignificantSavings: potentialSavings && potentialSavings > 500
  }
}

/**
 * Generate urgency score based on market conditions and user context
 */
export function calculateUrgencyScore(formData: Record<string, any>): number {
  let urgency = 30 // Base urgency
  
  // Lock-in status urgency
  if (formData.lockInStatus === 'ending_soon') urgency += 40
  else if (formData.lockInStatus === 'ended') urgency += 30
  
  // Rate differential urgency (refinance)
  if (formData.currentRate) {
    if (formData.currentRate > 4) urgency += 30
    else if (formData.currentRate > 3.5) urgency += 20
  }
  
  // Timeline urgency (new purchase)
  if (formData.purchaseTimeline === 'immediate') urgency += 40
  else if (formData.purchaseTimeline === '3_months') urgency += 25
  
  // Market conditions (hardcoded for now, could be dynamic)
  urgency += 10 // "Rates expected to rise"
  
  return Math.min(100, urgency)
}