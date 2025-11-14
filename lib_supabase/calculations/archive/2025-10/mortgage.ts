import { z } from 'zod'
// import type { MortgageInput, MortgageResult } from '@/types/mortgage'

// Temporary type definitions
export interface MortgageInput {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment?: number;
  propertyValue?: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  affordable: boolean;
}

// Zod schema for mortgage input validation
export const MortgageInputSchema = z.object({
  loanAmount: z.number().min(1000, 'Loan amount must be at least SGD 1,000'),
  interestRate: z.number().min(0.01, 'Interest rate must be at least 0.01%').max(15, 'Interest rate cannot exceed 15%'),
  loanTerm: z.number().min(1, 'Loan term must be at least 1 year').max(35, 'Loan term cannot exceed 35 years'),
  downPayment: z.number().min(0).optional(),
  propertyValue: z.number().min(0).optional(),
})

export type ValidatedMortgageInput = z.infer<typeof MortgageInputSchema>

/**
 * Calculate monthly mortgage payment using the standard mortgage formula
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where: M = Monthly payment, P = Principal, r = Monthly interest rate, n = Number of payments
 */
export function calculateMortgage(input: MortgageInput): MortgageResult {
  // Validate input using Zod
  const validatedInput = MortgageInputSchema.parse(input)
  
  const { loanAmount, interestRate, loanTerm } = validatedInput
  
  // Convert annual interest rate to monthly rate
  const monthlyRate = interestRate / 100 / 12
  
  // Calculate total number of payments
  const numPayments = loanTerm * 12
  
  // Calculate monthly payment using mortgage formula
  const monthlyPayment = monthlyRate === 0 
    ? loanAmount / numPayments // Handle 0% interest rate edge case
    : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  // Calculate totals
  const totalPayment = monthlyPayment * numPayments
  const totalInterest = totalPayment - loanAmount
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100, // Round to 2 decimal places
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    loanAmount,
    interestRate,
    loanTerm,
  }
}

// Predefined mortgage scenarios for quick calculations
export const MORTGAGE_SCENARIOS = {
  HDB_FLAT: {
    name: 'HDB Flat',
    loanAmount: 400000,
    interestRate: 2.3,
    loanTerm: 25,
    propertyValue: 500000,
    propertyType: 'HDB' as const
  },
  PRIVATE_CONDO: {
    name: 'Private Condo',
    loanAmount: 800000,
    interestRate: 2.8,
    loanTerm: 30,
    propertyValue: 1000000,
    propertyType: 'Private' as const
  },
  COMMERCIAL: {
    name: 'Commercial Property',
    loanAmount: 1400000,
    interestRate: 3.2,
    loanTerm: 25,
    propertyValue: 2000000,
    propertyType: 'Commercial' as const
  },
} as const

/**
 * Calculate Singapore-specific mortgage metrics including TDSR, MSR, and LTV
 */
export function calculateSingaporeMetrics(
  input: MortgageInput,
  monthlyPayment: number
): {
  tdsr: number
  tdsrLimit: number
  tdsrCompliant: boolean
  msr: number | null
  msrLimit: number | null
  msrCompliant: boolean | null
  ltvRatio: number
  ltvLimit: number
  ltvCompliant: boolean
} {
  const { propertyValue = 0, monthlyIncome = 0, existingDebt = 0, propertyType = 'HDB' } = input

  // Calculate TDSR (Total Debt Servicing Ratio) - applies to all properties
  const tdsrLimit = 55 // MAS guideline: 55% max
  const totalMonthlyDebt = monthlyPayment + existingDebt
  const tdsr = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0
  const tdsrCompliant = tdsr <= tdsrLimit

  // Calculate MSR (Mortgage Servicing Ratio) - only for HDB and Private properties
  let msr: number | null = null
  let msrLimit: number | null = null
  let msrCompliant: boolean | null = null

  if (propertyType === 'HDB' || propertyType === 'Private') {
    msrLimit = 30 // MAS guideline: 30% max for residential
    msr = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0
    msrCompliant = msr <= msrLimit
  }

  // Calculate LTV (Loan-to-Value) ratio
  const loanAmount = input.loanAmount || 0
  const ltvRatio = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0

  // LTV limits vary by property type and loan count (simplified for first property)
  const ltvLimits: Record<string, number> = {
    HDB: 90, // Up to 90% for HDB (citizens)
    Private: 75, // Up to 75% for private (first property)
    Commercial: 70, // Up to 70% for commercial
  }
  const ltvLimit = ltvLimits[propertyType] || 75
  const ltvCompliant = ltvRatio <= ltvLimit

  return {
    tdsr,
    tdsrLimit,
    tdsrCompliant,
    msr,
    msrLimit,
    msrCompliant,
    ltvRatio,
    ltvLimit,
    ltvCompliant,
  }
}

/**
 * Calculate mortgage with Singapore metrics
 */
export function calculateMortgageWithMetrics(input: MortgageInput) {
  const baseResult = calculateMortgage(input)
  const sgMetrics = calculateSingaporeMetrics(input, baseResult.monthlyPayment)

  // Calculate potential savings (if refinancing)
  let potentialSavings = 0
  if ((input as any).currentRate && input.interestRate < (input as any).currentRate) {
    const currentRateMonthly = calculateMortgage({
      ...input,
      interestRate: (input as any).currentRate,
    }).monthlyPayment
    potentialSavings = currentRateMonthly - baseResult.monthlyPayment
  }

  return {
    ...baseResult,
    ...sgMetrics,
    potentialSavings,
    refinancingCostBenefit: potentialSavings * 12, // Annual savings
    breakEvenMonths: potentialSavings > 0 ? Math.ceil(5000 / potentialSavings) : 0, // Assume $5000 refinancing cost
    overallCompliant:
      sgMetrics.tdsrCompliant &&
      (sgMetrics.msrCompliant === null || sgMetrics.msrCompliant) &&
      sgMetrics.ltvCompliant,
  }
}

/**
 * Calculate lead score based on mortgage input and results
 */
export function calculateLeadScore(
  input: MortgageInput,
  result: any,
  isComplete: boolean
): number {
  let score = 0

  // Financial viability (0-40 points)
  if (result.tdsrCompliant) score += 20
  if (result.msrCompliant || result.msrCompliant === null) score += 10
  if (result.ltvCompliant) score += 10

  // Loan size (0-20 points)
  const loanAmount = input.loanAmount || 0
  if (loanAmount > 1000000) score += 20
  else if (loanAmount > 500000) score += 15
  else if (loanAmount > 300000) score += 10
  else score += 5

  // Income level (0-20 points)
  const monthlyIncome = input.monthlyIncome || 0
  if (monthlyIncome > 15000) score += 20
  else if (monthlyIncome > 10000) score += 15
  else if (monthlyIncome > 7000) score += 10
  else score += 5

  // Completeness (0-20 points)
  if (isComplete) score += 20
  else if (input.monthlyIncome) score += 15
  else if (input.loanAmount) score += 10
  else score += 5

  return Math.min(score, 100)
}

/**
 * Calculate instant eligibility for new purchase
 */
export function calculateInstantEligibility(
  propertyPrice: number,
  propertyType: string,
  combinedAge: number,
  ltvRatio: number = 0.75
) {
  // Calculate maximum loan amount based on LTV limits
  const ltvLimits: Record<string, number> = {
    HDB: 0.9,
    EC: 0.9,
    Private: 0.75,
    Landed: 0.75,
    Commercial: 0.7,
  }

  const maxLtv = ltvLimits[propertyType] || ltvRatio
  const maxLoanAmount = propertyPrice * maxLtv
  const downPayment = propertyPrice - maxLoanAmount

  // Estimate required monthly income (using 30% MSR for residential)
  const estimatedRate = 3.5 // Conservative estimate
  const tenure = 25 // Standard tenure
  const monthlyPayment =
    (maxLoanAmount * (estimatedRate / 100 / 12) * Math.pow(1 + estimatedRate / 100 / 12, tenure * 12)) /
    (Math.pow(1 + estimatedRate / 100 / 12, tenure * 12) - 1)

  const requiredMonthlyIncome = (monthlyPayment / 0.3) * 1.15 // 15% buffer for TDSR

  return {
    maxLoanAmount: Math.round(maxLoanAmount),
    downPayment: Math.round(downPayment),
    estimatedMonthlyPayment: Math.round(monthlyPayment),
    requiredMonthlyIncome: Math.round(requiredMonthlyIncome),
    ltvRatio: maxLtv * 100,
  }
}

/**
 * Calculate refinancing savings
 */
export function calculateRefinancingSavings(
  currentRate: number,
  outstandingLoan: number,
  remainingTenure: number = 20,
  propertyValue?: number
) {
  const newRate = 2.5 // Competitive market rate
  const tenure = remainingTenure

  // Calculate current monthly payment
  const currentMonthly =
    (outstandingLoan * (currentRate / 100 / 12) * Math.pow(1 + currentRate / 100 / 12, tenure * 12)) /
    (Math.pow(1 + currentRate / 100 / 12, tenure * 12) - 1)

  // Calculate new monthly payment
  const newMonthly =
    (outstandingLoan * (newRate / 100 / 12) * Math.pow(1 + newRate / 100 / 12, tenure * 12)) /
    (Math.pow(1 + newRate / 100 / 12, tenure * 12) - 1)

  const monthlySavings = currentMonthly - newMonthly
  const annualSavings = monthlySavings * 12
  const lifetimeSavings = monthlySavings * tenure * 12

  // Calculate break-even period (assuming $3000 refinancing costs)
  const refinancingCost = 3000
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(refinancingCost / monthlySavings) : 0

  return {
    currentRate,
    newRate,
    currentMonthlyPayment: Math.round(currentMonthly),
    newMonthlyPayment: Math.round(newMonthly),
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),
    lifetimeSavings: Math.round(lifetimeSavings),
    breakEvenMonths,
    worthRefinancing: monthlySavings > 150 && breakEvenMonths < 24, // At least $150/month and break-even within 2 years
  }
}

/**
 * Calculate IWAA (Interest-Weighted Average Age) - stub implementation
 * This is typically used for determining maximum loan tenure based on borrower ages
 */
export function calculateIWAA(ages: number[], incomes: number[]): number {
  if (ages.length === 0 || incomes.length === 0) return 0
  if (ages.length !== incomes.length) return ages[0] || 0

  const totalIncome = incomes.reduce((sum, income) => sum + income, 0)
  if (totalIncome === 0) return ages[0] || 0

  const weightedSum = ages.reduce((sum, age, i) => sum + age * (incomes[i] / totalIncome), 0)
  return Math.round(weightedSum)
}

/**
 * Get placeholder rate based on property type and loan type
 */
export function getPlaceholderRate(propertyType: string, loanType: string = 'new_purchase'): number {
  const rates: Record<string, Record<string, number>> = {
    HDB: { new_purchase: 2.3, refinance: 2.1 },
    Private: { new_purchase: 2.8, refinance: 2.6 },
    Commercial: { new_purchase: 3.2, refinance: 3.0 },
  }

  return rates[propertyType]?.[loanType] || 2.8
}
