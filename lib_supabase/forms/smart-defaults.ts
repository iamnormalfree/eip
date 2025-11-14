// ABOUTME: Smart defaults system with affordability validation for mortgage applications
// ABOUTME: Prevents suggesting unaffordable properties and provides conservative estimates

import { calculateInstantProfile } from '../calculations/instant-profile'

export interface SmartDefaultsInput {
  income: number
  propertyType: 'HDB' | 'Private' | 'EC' | 'Commercial'
  loanType: 'new_purchase' | 'refinance'
  existingProperties: number
  buyerProfile?: 'SC' | 'PR' | 'Foreigner'
}

export interface SmartDefaultsResult {
  suggestedPrice: number
  suggestedLTV: number
  suggestedTenure: number
  maxAffordablePrice: number
  confidenceLevel: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Generates smart defaults for mortgage application based on user profile
 * Uses conservative estimates to ensure affordability
 */
export function generateSmartDefaults(
  input: SmartDefaultsInput
): SmartDefaultsResult {
  const { income, propertyType, existingProperties, buyerProfile = 'SC' } = input

  // Prevent suggesting unaffordable properties
  const maxAffordableMonthly = income * 0.3 // Conservative 30% DTI
  const assumedRate = 0.04 // 4% stress test
  const assumedTenure = 25 // Conservative tenure

  // Monthly payment formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyRate = assumedRate / 12
  const months = assumedTenure * 12
  const factor = Math.pow(1 + monthlyRate, months)
  const maxLoan = (maxAffordableMonthly * (factor - 1)) / (monthlyRate * factor)

  // Apply LTV based on property count and type
  let ltv: number
  if (propertyType === 'HDB' && existingProperties === 0) {
    ltv = 0.75 // First HDB
  } else if (propertyType === 'HDB' && existingProperties > 0) {
    ltv = 0.45 // Second HDB (not allowed, but for calculation)
  } else if (existingProperties === 0) {
    ltv = 0.75 // First private property
  } else if (existingProperties === 1) {
    ltv = 0.45 // Second property
  } else {
    ltv = 0.35 // Third+ property
  }

  const suggestedPrice = Math.floor(maxLoan / ltv / 1000) * 1000 // Round to nearest K

  // Validation: Don't suggest $1.2M to $3K/mo income
  if (income < 5000 && suggestedPrice > 800000) {
    const maxMonthlyPayment = income * 0.3
    const maxLoanAmount = (maxMonthlyPayment * (factor - 1)) / (monthlyRate * factor)
    const maxAffordablePrice = Math.floor(maxLoanAmount / ltv / 1000) * 1000

    return {
      suggestedPrice: 600000,
      suggestedLTV: ltv,
      suggestedTenure: assumedTenure,
      maxAffordablePrice,
      confidenceLevel: 'low',
      reasoning: 'Income may not support higher property prices - conservative estimate applied'
    }
  }

  // Property type specific adjustments
  let finalPrice = suggestedPrice
  let reasoning = `Based on ${ltv * 100}% LTV and 30% debt-to-income ratio`

  if (propertyType === 'HDB') {
    finalPrice = Math.min(suggestedPrice, 800000) // HDB price ceiling
    reasoning += ' with HDB price limits applied'
  }

  if (propertyType === 'Commercial') {
    ltv = 0.60 // Commercial properties have lower LTV
    finalPrice = Math.floor(maxLoan / ltv / 1000) * 1000
    reasoning = `Based on ${ltv * 100}% commercial LTV and 30% debt-to-income ratio`
  }

  // Calculate max affordable price (30% DTI limit) using the same variables as the main calculation
  const maxMonthlyPayment = income * 0.3
  const maxLoanAmount = (maxMonthlyPayment * (factor - 1)) / (monthlyRate * factor)
  const maxAffordablePrice = Math.floor(maxLoanAmount / ltv / 1000) * 1000

  return {
    suggestedPrice: finalPrice,
    suggestedLTV: ltv,
    suggestedTenure: assumedTenure,
    maxAffordablePrice,
    confidenceLevel: income > 10000 ? 'high' : income > 6000 ? 'medium' : 'low',
    reasoning
  }
}

/**
 * Validates that suggested defaults are affordable for the user
 */
export function validateDefaultsAffordability(
  defaults: SmartDefaultsResult,
  input: SmartDefaultsInput
): { isAffordable: boolean; monthlyPayment: number; dti: number } {
  const { income } = input
  const { suggestedPrice, suggestedLTV, suggestedTenure } = defaults

  const loanAmount = suggestedPrice * suggestedLTV
  const monthlyRate = 0.04 / 12 // 4% stress test
  const months = suggestedTenure * 12
  const factor = Math.pow(1 + monthlyRate, months)
  const monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1)

  const dti = (monthlyPayment / income) * 100

  return {
    isAffordable: dti <= 30, // Conservative 30% DTI limit
    monthlyPayment,
    dti
  }
}