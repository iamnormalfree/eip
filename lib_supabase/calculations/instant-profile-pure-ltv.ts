// ABOUTME: Pure LTV calculation for Step 2 property feasibility (no income required)
// ABOUTME: Aligned with Dr Elena v2 LTV limits, tenure rules, and CPF usage rules

import type { PureLtvCalcResult } from '../contracts/form-contracts';

/**
 * Calculate maximum loan based on pure LTV limits (Step 2 only)
 * 
 * Used in: Step 2 Property Feasibility Analysis
 * Persona Source: dr-elena-mortgage-expert-v2.json
 *   - computational_modules.ltv_limits.individual_borrowers
 *   - computational_modules.tenure_rules
 *   - computational_modules.cpf_usage_rules
 * 
 * Data Requirements:
 * - Property price (collected Step 2)
 * - Existing property count (collected Step 2)
 * - Borrower age (collected Step 1)
 * - Property type (collected Step 2)
 * 
 * Does NOT use: Income, commitments, employment data
 * 
 * Returns: Max loan, LTV %, down payment breakdown, tenure, reason codes
 * 
 * Test Coverage: tests/calculations/pure-ltv.test.ts
 */
export function calculatePureLtvMaxLoan(params: {
  property_price: number
  existing_properties: number
  age: number
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial'
}): PureLtvCalcResult {
  const { property_price, existing_properties, age, property_type } = params

  // LTV Tier Selection (from Dr. Elena v2 computational_modules.ltv_limits.individual_borrowers)
  let baseLTV: number
  let reducedLTV: number
  let minCashBase: number
  let minCashReduced: number

  if (existing_properties === 0) {
    // First property
    baseLTV = 75
    reducedLTV = 55
    minCashBase = 5
    minCashReduced = 10
  } else if (existing_properties === 1) {
    // Second property
    baseLTV = 45
    reducedLTV = 25
    minCashBase = 25
    minCashReduced = 25
  } else {
    // Third+ property
    baseLTV = 35
    reducedLTV = 15
    minCashBase = 25
    minCashReduced = 25
  }

  // Tenure Caps (from Dr. Elena v2 computational_modules.tenure_rules)
  let maxTenureByType: number
  let tenureTriggerThreshold: number
  switch (property_type) {
    case 'HDB':
      maxTenureByType = 25 // HDB concessionary
      tenureTriggerThreshold = 25
      break
    case 'EC':
    case 'Private':
      maxTenureByType = 30 // Bank loans
      tenureTriggerThreshold = 30
      break
    case 'Commercial':
      maxTenureByType = 35 // Commercial property
      tenureTriggerThreshold = 35
      break
    default:
      maxTenureByType = 25
      tenureTriggerThreshold = 25
  }

  const maxTenureByAge = Math.max(65 - age, 0) // Loan must end by age 65
  const effectiveTenure = Math.min(maxTenureByAge, maxTenureByType)

  // Determine tenure cap source for messaging
  let tenureCapSource: 'age' | 'regulation' | 'both' | undefined
  if (maxTenureByAge < maxTenureByType) {
    tenureCapSource = 'age'
  } else if (maxTenureByAge > maxTenureByType) {
    tenureCapSource = 'regulation'
  } else if (maxTenureByAge === maxTenureByType && maxTenureByAge > 0) {
    // When both limits are equal and non-zero, age is the binding constraint
    tenureCapSource = 'age'
  }

  // Check if reduced LTV applies
  // Per Dr. Elena v2: "Apply reduced LTV tier if (HDB flat tenure > 25y) OR (non-HDB tenure > 30y) OR (loan end age > 65)"
  // Use the property's standard max tenure for the reduction check, mimicking existing calculateInstantProfile behavior
  const loanEndAgeAtStandardTenure = age + tenureTriggerThreshold
  const needsReduction = 
    property_type !== 'Commercial' && (
      tenureTriggerThreshold > (property_type === 'HDB' ? 25 : 30) ||
      loanEndAgeAtStandardTenure > 65
    )

  // Select LTV and min cash
  const ltvPercentage = needsReduction ? reducedLTV : baseLTV
  const minCashPercent = needsReduction ? minCashReduced : minCashBase

  // Calculate max loan (round DOWN to nearest thousand per Dr. Elena v2 rounding rules)
  // Special case: If effectiveTenure is 0, max loan should be 0
  let maxLoanAmount: number
  if (effectiveTenure === 0) {
    maxLoanAmount = 0
  } else {
    maxLoanAmount = Math.floor((property_price * ltvPercentage / 100) / 1000) * 1000
  }

  // Calculate down payment (round UP to nearest thousand)
  const downPayment = Math.ceil((property_price - maxLoanAmount) / 1000) * 1000

  // CPF vs Cash Split (from Dr. Elena v2 computational_modules.cpf_usage_rules)
  let cpfAllowed: boolean
  let cashDownPayment: number
  let cpfDownPayment: number
  let minCashRequired: number

  if (property_type === 'Commercial') {
    // Commercial properties: NO CPF allowed
    cpfAllowed = false
    cashDownPayment = downPayment
    cpfDownPayment = 0
    minCashRequired = downPayment
  } else {
    // Residential properties
    cpfAllowed = true
    minCashRequired = Math.ceil((property_price * minCashPercent / 100) / 1000) * 1000
    cashDownPayment = minCashRequired
    cpfDownPayment = downPayment - minCashRequired
  }

  const cpfAllowedAmount = cpfDownPayment

  // Generate reason codes
  const reasonCodes: string[] = []
  const policyRefs: string[] = ['MAS Notice 645']

  // LTV tier reason
  if (existing_properties === 0) {
    reasonCodes.push('first_property_75_ltv')
  } else if (existing_properties === 1) {
    reasonCodes.push('second_property_45_ltv')
  } else {
    reasonCodes.push('third_property_35_ltv')
  }

  // Reduced LTV reasons
  if (needsReduction) {
    if (tenureTriggerThreshold > (property_type === 'HDB' ? 25 : 30)) {
      reasonCodes.push('reduced_ltv_tenure_exceeds')
    }
    if (loanEndAgeAtStandardTenure > 65) {
      reasonCodes.push('reduced_ltv_age_exceeds_65')
    }
  }

  // Tenure cap reasons
  if (tenureCapSource === 'age') {
    reasonCodes.push('tenure_capped_by_age')
  } else if (tenureCapSource === 'regulation') {
    reasonCodes.push('tenure_capped_by_property_type')
  }

  // Cash requirement reasons
  if (property_type === 'Commercial') {
    reasonCodes.push('commercial_100_percent_cash')
    policyRefs.push('MAS Bank Policy')
  } else {
    reasonCodes.push(`min_cash_${minCashPercent}_percent`)
  }

  // Construct result
  const result: PureLtvCalcResult = {
    calculationType: 'pure_ltv',
    propertyPrice: property_price,
    propertyType: property_type,
    maxLoanAmount,
    ltvRatio: ltvPercentage,
    ltvPercentage,
    downPayment,
    minCashPercent,
    minCashRequired,
    cpfAllowed,
    cpfAllowedAmount,
    cashDownPayment,
    cpfDownPayment,
    effectiveTenure,
    tenureCapSource,
    limitingFactor: 'LTV',
    reasonCodes,
    policyRefs,
    rateAssumption: 3.5 // Placeholder rate (not used for pure LTV, but included for consistency)
  }

  return result
}
