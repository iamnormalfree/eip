/**
 * Mortgage Form Validation Schemas
 * Lead: Ahmad Ibrahim - Senior Backend Engineer
 * 
 * Zod schemas for progressive form validation with Singapore-specific rules
 * Implements gate-based validation strategy from Tech-Team architecture
 */

import { z } from 'zod'

// ============================================================================
// SINGAPORE-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Singapore phone number validation
 */
const singaporePhoneSchema = z.string()
  .regex(/^[689]\d{7}$/, 'Phone format should be: 9123 4567')
  .transform((val) => val.replace(/\D/g, ''))

/**
 * Property price validation with Singapore market ranges
 */
const propertyPriceSchema = z.number()
  .min(100000, 'Minimum property price is $100,000')
  .max(99999999, 'Maximum property price is $99,999,999')

/**
 * Income validation
 */
const incomeSchema = z.number()
  .min(0, 'Income cannot be negative')
  .max(9999999, 'Please enter a valid income amount')

/**
 * Age validation for mortgage eligibility
 */
const ageSchema = z.number()
  .min(21, 'Minimum age for mortgage is 21')
  .max(100, 'Please enter a valid age')
const variableIncomesSchema = z.object({
  0: z.number().min(0, 'Variable income cannot be negative').max(9999999, 'Please enter a valid amount').optional(),
  1: z.number().min(0, 'Variable income cannot be negative').max(9999999, 'Please enter a valid amount').optional()
})
const employmentDetailsSchema = z.object({
  'self-employed': z.object({
    businessAgeYears: z.union([
      z.string(),
      z.number().int('Business age must be a whole number').min(0, 'Business age cannot be negative').max(100, 'Please verify business age')
    ]).optional(),
    noaSubmitted: z.boolean().optional(),
    averageReportedIncome: z.union([z.string(), z.number()]).optional()
  }),
  variable: z.object({
    averagePastTwelveMonths: z.union([z.string(), z.number()]).optional(),
    lowestObservedIncome: z.union([z.string(), z.number()]).optional()
  })
})
const liabilityDetailsSchema = z.object({
  enabled: z.boolean().optional(),
  outstandingBalance: z.union([
    z.number().min(0, 'Balance cannot be negative'),
    z.string()
  ]).optional(),
  monthlyPayment: z.union([
    z.number().min(0, 'Payment cannot be negative'),
    z.string()
  ]).optional()
})
const liabilitiesSchema = z.object({
  propertyLoans: liabilityDetailsSchema.optional(),
  carLoans: liabilityDetailsSchema.optional(),
  creditCards: liabilityDetailsSchema.optional(),
  personalLines: liabilityDetailsSchema.optional(),
  otherCommitments: z.string().optional()
})

// ============================================================================
// BASE SCHEMA FOR ALL LOAN TYPES - GATE-BASED STRUCTURE
// ============================================================================

const baseLeadSchema = z.object({
  // Gate 0 - Loan Type Selection (no personal info required)
  loanType: z.enum(['new_purchase', 'refinance', 'equity_loan'], {
    message: 'Please select a valid loan type'
  }),
  
  // Gate 1 - Basic Information
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .email('Email format: name@domain.com')
    .toLowerCase()
    .transform((email) => email.trim()),
  
  // Gate 2 - Contact Information
  phone: singaporePhoneSchema,
  
  // Optional tracking fields
  marketingConsent: z.boolean().optional(),
  referralSource: z.string().optional(),
  sessionId: z.string().optional()
})

// New purchase specific schema
export const newPurchaseSchema = baseLeadSchema.extend({
  loanType: z.literal('new_purchase'),
  purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
  priceRange: z.number().min(300000).max(5000000),
  ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']),
  firstTimeBuyer: z.boolean(),
  downPaymentReady: z.boolean().optional(),
  cpfUsage: z.enum(['yes', 'no', 'unsure']).optional(),
  actualVariableIncomes: variableIncomesSchema.optional(),
  employmentDetails: employmentDetailsSchema.optional(),
  liabilities: liabilitiesSchema.optional()
})

// Refinancing specific schema
export const refinanceSchema = baseLeadSchema.extend({
  loanType: z.literal('refinance'),
  currentRate: z.number().min(0).max(10),
  lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
  currentBank: z.string().min(1),
  outstandingLoan: z.number().min(10000).max(10000000),
  propertyValue: z.number().min(100000).max(20000000).optional(),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
  yearsPurchased: z.number().min(0).max(50),
  refinanceReason: z.enum(['lower_rate', 'cash_out', 'better_terms', 'debt_consolidation']),
  cashOutAmount: z.number().min(0).max(2000000).optional(),
  // Step 3 refinance fields
  hasChangedJobPrimary: z.boolean().optional(),
  hasChangedJobCoApplicant: z.boolean().optional(),
  employmentStatusPrimary: z.enum(['self-employed', 'in-between-jobs', 'not-working']).optional(),
  employmentStatusCoApplicant: z.enum(['self-employed', 'in-between-jobs', 'not-working']).optional(),
  lockInTimeframe: z.enum(['within-3-months', '3-6-months', 'more-than-6-months', 'out-of-lock-in']).optional(),
  lockInSpecificMonth: z.number().min(1).max(3).optional(),
  refinancingGoals: z.array(z.enum(['lower_monthly_payment', 'shorten_tenure', 'rate_certainty', 'cash_out'])),
  cashOutReason: z.string().optional(),
  ownerOccupied: z.boolean().default(true).describe('Is this your primary residence?')
})

// Equity loan specific schema
export const equityLoanSchema = baseLeadSchema.extend({
  loanType: z.literal('equity_loan'),
  propertyValue: z.number().min(200000).max(20000000),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
  existingLoan: z.number().min(0).max(10000000),
  equityAmount: z.number().min(50000).max(3000000),
  purpose: z.enum(['business', 'investment', 'renovation', 'education', 'other']),
  repaymentPeriod: z.enum(['5_years', '10_years', '15_years', '20_years']),
  monthlyIncome: z.number().min(3000).max(100000)
})

// Union type for all form schemas
export const mortgageFormSchema = z.discriminatedUnion('loanType', [
  newPurchaseSchema,
  refinanceSchema,
  equityLoanSchema
])

export type MortgageFormData = z.infer<typeof mortgageFormSchema>
export type NewPurchaseData = z.infer<typeof newPurchaseSchema>
export type RefinanceData = z.infer<typeof refinanceSchema>
export type EquityLoanData = z.infer<typeof equityLoanSchema>

// Progressive disclosure validation schemas
export const step1Schema = z.object({
  loanType: z.enum(['new_purchase', 'refinance', 'equity_loan'])
})

export const step2BaseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().regex(/^[689]\d{7}$/, 'Please enter a valid Singapore number')
})

// AI Context Schema for intelligent analysis
export const aiContextSchema = z.object({
  userBehavior: z.object({
    timeOnPage: z.number(),
    formInteractions: z.number(),
    hesitationPoints: z.array(z.string()),
    deviceType: z.enum(['mobile', 'desktop', 'tablet'])
  }),
  marketContext: z.object({
    currentRates: z.object({
      hdb: z.number(),
      private: z.number(),
      commercial: z.number()
    }),
    rateDirection: z.enum(['rising', 'falling', 'stable']),
    marketSentiment: z.enum(['hot', 'cooling', 'stable'])
  }),
  leadIntelligence: z.object({
    urgencyScore: z.number().min(0).max(10),
    sophisticationLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    priceRange: z.enum(['budget', 'mid_market', 'premium', 'luxury']),
    likelyToConvert: z.boolean()
  })
})

export type AIContext = z.infer<typeof aiContextSchema>

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid Singapore phone number (8 digits starting with 6, 8, or 9)',
  MIN_AMOUNT: 'Amount must be at least SGD',
  MAX_AMOUNT: 'Amount cannot exceed SGD',
  INVALID_RANGE: 'Please select a valid range'
} as const

// Singapore-specific validation helpers
export const validateSingaporePhone = (phone: string): boolean => {
  const phoneRegex = /^[689]\d{7}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

export const validatePropertyValue = (value: number, propertyType: string): boolean => {
  const minimums = {
    HDB: 200000,
    EC: 500000,
    Private: 600000,
    Landed: 1000000,
    Commercial: 500000
  }
  return value >= minimums[propertyType as keyof typeof minimums]
}

export const validateLoanAmount = (loanAmount: number, propertyValue: number, propertyType: string): boolean => {
  const ltvLimits = {
    HDB: 0.9,    // 90% for citizens
    EC: 0.9,     // 90% for citizens
    Private: 0.75, // 75% for first property
    Landed: 0.75,  // 75% for first property
    Commercial: 0.7 // 70% typical bank policy
  }
  
  const maxLoan = propertyValue * ltvLimits[propertyType as keyof typeof ltvLimits]
  return loanAmount <= maxLoan
}

// ============================================================================
// PROGRESSIVE FORM GATE SCHEMAS
// ============================================================================

/**
 * Creates the appropriate validation schema for a specific gate and loan type
 * This enables progressive disclosure validation
 */
export const createGateSchema = (loanType: string, gateNumber: number) => {
  // Gate 0: Loan Type Selection (handled by LoanTypeSelector)
  if (gateNumber === 0) {
    return z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan'])
    })
  }
  
  // Gate 1: Basic Information (Name + Email + Phone)
  if (gateNumber === 1) {
    return z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      phone: singaporePhoneSchema
    })
  }
  
  // Gate 2: What You Need (Property Details)
  if (gateNumber === 2) {
    const baseGate2Schema = z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      phone: singaporePhoneSchema
    })

    // Add loan-type specific fields for Step 2
    switch (loanType) {
      case 'new_purchase':
        return baseGate2Schema.extend({
          propertyCategory: z.enum(['resale', 'new_launch', 'bto', 'commercial'], {
            message: 'Please select a property category'
          }),
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial'], {
            message: 'Please select property type'
          }),
          priceRange: z.number().min(300000, 'Minimum property price is $300,000').max(5000000, 'Property price seems too high'),
          combinedAge: z.preprocess(
            (val) => {
              console.log('🔍 z.preprocess combinedAge (Gate 2):', {
                input: val,
                inputType: typeof val,
                isEmptyString: val === '',
                isNull: val === null,
                isUndefined: val === undefined
              })

              // Allow empty during typing, but will be required on submit
              if (val === '' || val === null || val === undefined) {
                console.log('🔍 PREPROCESS RETURNING: undefined')
                return undefined
              }

              if (typeof val === 'string') {
                const parsed = parseInt(val, 10)
                console.log('🔍 PREPROCESS STRING:', { val, parsed, isNaN: isNaN(parsed) })
                return isNaN(parsed) ? undefined : parsed
              }

              console.log('🔍 PREPROCESS PASSTHROUGH:', val)
              return val
            },
            z.number().min(18, 'Combined age must be at least 18').max(120, 'Please verify combined age').optional()
          ),
          // Optional fields for context block
          developmentName: z.string().optional(),
          paymentScheme: z.enum(['cash', 'cpf_plus_cash', 'full_cpf', 'bank_loan', 'not_sure']).optional()
        })
      
      case 'refinance':
        return baseGate2Schema.extend({
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial'], {
            message: 'Please select property type'
          }),
          currentRate: z.preprocess(
            (val) => {
              console.log('🔍 z.preprocess currentRate (Gate 2):', {
                input: val,
                inputType: typeof val,
                isEmptyString: val === '',
                isNull: val === null,
                isUndefined: val === undefined
              })

              // Allow empty during typing, but will be required on submit
              if (val === '' || val === null || val === undefined) {
                console.log('🔍 PREPROCESS RETURNING: undefined')
                return undefined
              }

              if (typeof val === 'string') {
                const parsed = parseFloat(val)
                console.log('🔍 PREPROCESS STRING:', { val, parsed, isNaN: isNaN(parsed) })
                return isNaN(parsed) ? undefined : parsed
              }

              console.log('🔍 PREPROCESS PASSTHROUGH:', val)
              return val
            },
            z.number().min(1, 'Current rate must be at least 1%').max(10, 'Please verify current rate').optional()
          ),
          lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
          outstandingLoan: z.preprocess(
            (val) => {
              console.log('🔍 z.preprocess outstandingLoan (Gate 2):', {
                input: val,
                inputType: typeof val,
                isEmptyString: val === '',
                isNull: val === null,
                isUndefined: val === undefined
              })

              // Allow empty during typing, but will be required on submit
              if (val === '' || val === null || val === undefined) {
                console.log('🔍 PREPROCESS RETURNING: undefined')
                return undefined
              }

              if (typeof val === 'string') {
                const parsed = parseInt(val, 10)
                console.log('🔍 PREPROCESS STRING:', { val, parsed, isNaN: isNaN(parsed) })
                return isNaN(parsed) ? undefined : parsed
              }

              console.log('🔍 PREPROCESS PASSTHROUGH:', val)
              return val
            },
            z.number().min(0, 'Outstanding loan cannot be negative').max(10000000, 'Loan amount seems too high').optional()
          ),
          currentBank: z.string().min(1, 'Please select your current bank'),
          propertyValue: z.number().min(300000, 'Minimum property value is $300,000').max(10000000, 'Property value seems too high').optional(),
          remainingTenure: z.number().min(1, 'Remaining tenure is required').max(35, 'Remaining tenure cannot exceed 35 years').optional()
        })
      
      case 'equity_loan':
        return baseGate2Schema.extend({
          propertyValue: z.number().min(500000, 'Minimum property value for equity loan is $500,000').max(10000000, 'Property value seems too high'),
          equityNeeded: z.number().min(100000, 'Minimum equity loan amount is $100,000').max(5000000, 'Equity loan seems too high'),
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial'], {
            message: 'Please select property type'
          }),
          purpose: z.enum(['investment', 'renovation', 'business', 'education', 'other'], {
            message: 'Please select loan purpose'
          })
        })
      
      default:
        return baseGate2Schema
    }
  }
  
  // Gate 3: Your Finances
  if (gateNumber === 3) {
    const baseGate3Schema = z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      phone: singaporePhoneSchema,
      // Step 3 specific fields (actual field names from form)
      actualIncomes: z.object({
        0: z.number().min(0, 'Income cannot be negative').max(9999999, 'Please enter a valid income amount').optional(),
        1: z.number().min(0, 'Income cannot be negative').max(9999999, 'Please enter a valid income amount').optional()
      }),
      actualAges: z.object({
        0: z.number().int('Age must be a whole number').min(18, 'Must be at least 18 years old').max(99, 'Age must be 99 or less').optional(),
        1: z.number().int('Age must be a whole number').min(18, 'Must be at least 18 years old').max(99, 'Age must be 99 or less').optional()
      }),
      employmentType: z.enum(['employed', 'self-employed', 'variable', 'not-working', 'other', 'contract'], {
        message: 'Please select your employment type'
      }).optional(),
      actualVariableIncomes: variableIncomesSchema.optional(),
      employmentDetails: employmentDetailsSchema.optional(),
      liabilities: liabilitiesSchema.optional(),
      creditCardCount: z.number().min(0, 'Credit card count cannot be negative').max(20, 'Please verify the number').optional(),
      existingCommitments: z.number()
        .min(0, 'Commitments cannot be negative')
        .max(9999999, 'Please enter a valid amount')
        .optional(),
      hasJointApplicant: z.boolean().optional()
    })
    
    // Extend with loan-type specific fields that were validated in Step 2
    switch (loanType) {
      case 'new_purchase':
        return baseGate3Schema.extend({
          // Override to make employmentType required for new purchase
          employmentType: z.enum(['employed', 'self-employed', 'variable', 'not-working', 'other', 'contract'], {
            message: 'Please select your employment type'
          }),
          // Step 2 fields (carry forward)
          propertyCategory: z.enum(['resale', 'new_launch', 'bto', 'commercial']),
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
          priceRange: z.number().min(300000, 'Minimum property price is $300,000').max(5000000, 'Property price seems too high'),
          combinedAge: z.preprocess(
            (val) => {
              console.log('🔍 z.preprocess combinedAge (Gate 3):', {
                input: val,
                inputType: typeof val,
                isEmptyString: val === '',
                isNull: val === null,
                isUndefined: val === undefined
              })

              // Allow empty during typing, but will be required on submit
              if (val === '' || val === null || val === undefined) {
                console.log('🔍 PREPROCESS RETURNING: undefined')
                return undefined
              }

              if (typeof val === 'string') {
                const parsed = parseInt(val, 10)
                console.log('🔍 PREPROCESS STRING:', { val, parsed, isNaN: isNaN(parsed) })
                return isNaN(parsed) ? undefined : parsed
              }

              console.log('🔍 PREPROCESS PASSTHROUGH:', val)
              return val
            },
            z.number().min(18, 'Combined age must be at least 18').max(120, 'Please verify combined age').optional()
          ),
          // Optional Step 2 fields
          developmentName: z.string().optional(),
          paymentScheme: z.enum(['cash', 'cpf_plus_cash', 'full_cpf', 'bank_loan', 'not_sure']).optional()
        })
      
      case 'refinance':
        return baseGate3Schema.extend({
          // Step 2 fields (carry forward)
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
          currentRate: z.preprocess(
            (val) => {
              console.log('🔍 z.preprocess currentRate (Gate 3):', {
                input: val,
                inputType: typeof val,
                isEmptyString: val === '',
                isNull: val === null,
                isUndefined: val === undefined
              })

              // Allow empty during typing, but will be required on submit
              if (val === '' || val === null || val === undefined) {
                console.log('🔍 PREPROCESS RETURNING: undefined')
                return undefined
              }

              if (typeof val === 'string') {
                const parsed = parseFloat(val)
                console.log('🔍 PREPROCESS STRING:', { val, parsed, isNaN: isNaN(parsed) })
                return isNaN(parsed) ? undefined : parsed
              }

              console.log('🔍 PREPROCESS PASSTHROUGH:', val)
              return val
            },
            z.number().min(1, 'Current rate must be at least 1%').max(10, 'Please verify current rate').optional()
          ),
          lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
          outstandingLoan: z.preprocess(
            (val) => {
              console.log('🔍 z.preprocess outstandingLoan (Gate 3):', {
                input: val,
                inputType: typeof val,
                isEmptyString: val === '',
                isNull: val === null,
                isUndefined: val === undefined
              })

              // Allow empty during typing, but will be required on submit
              if (val === '' || val === null || val === undefined) {
                console.log('🔍 PREPROCESS RETURNING: undefined')
                return undefined
              }

              if (typeof val === 'string') {
                const parsed = parseInt(val, 10)
                console.log('🔍 PREPROCESS STRING:', { val, parsed, isNaN: isNaN(parsed) })
                return isNaN(parsed) ? undefined : parsed
              }

              console.log('🔍 PREPROCESS PASSTHROUGH:', val)
              return val
            },
            z.number().min(0, 'Outstanding loan cannot be negative').max(10000000, 'Loan amount seems too high').optional()
          ),
          currentBank: z.string().min(1, 'Please select your current bank'),
          propertyValue: z.number().min(300000, 'Minimum property value is $300,000').max(10000000, 'Property value seems too high').optional(),
          remainingTenure: z.number().min(1, 'Remaining tenure is required').max(35, 'Remaining tenure cannot exceed 35 years').optional(),
          refinancingGoals: z.array(z.enum(['lower_monthly_payment', 'shorten_tenure', 'rate_certainty', 'cash_out'])).optional(),
          cashOutAmount: z.number().min(0, 'Cash-out amount cannot be negative').max(2000000, 'Cash-out amount seems too high').optional(),
          cashOutReason: z.string().optional(),
          monthsRemaining: z.number().min(0, 'Months remaining cannot be negative').max(360, 'Please verify the months remaining').optional(),
          ownerOccupied: z.boolean().optional()
        })
      
      case 'equity_loan':
        return baseGate3Schema.extend({
          // Step 2 fields (carry forward)
          propertyValue: z.number().min(500000, 'Minimum property value for equity loan is $500,000').max(10000000, 'Property value seems too high'),
          equityNeeded: z.number().min(100000, 'Minimum equity loan amount is $100,000').max(5000000, 'Equity loan seems too high'),
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
          purpose: z.enum(['investment', 'renovation', 'business', 'education', 'other'])
        })
      
      default:
        return baseGate3Schema
    }
  }
  
  // For any future gates, return the full schema
  const fullSchema = z.object({
    loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: singaporePhoneSchema
  })
  
  // Extend with loan-type specific fields
  switch (loanType) {
    case 'new_purchase':
      return fullSchema.extend({
        propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
        priceRange: z.number().min(300000, 'Minimum property price is $300,000'),
        purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']),
        ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']),
        firstTimeBuyer: z.boolean()
      })
    
    case 'refinance':
      return fullSchema.extend({
        currentRate: z.number().min(1, 'Current rate must be at least 1%').max(10, 'Please verify current rate'),
        lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
        currentBank: z.string().min(1, 'Please select your current bank'),
        propertyValue: z.number().min(300000, 'Minimum property value is $300,000').optional(),
        outstandingLoan: z.number().min(0, 'Outstanding loan cannot be negative')
      })
    
    case 'equity_loan':
      return fullSchema.extend({
        propertyValue: z.number().min(500000, 'Minimum property value for equity loan is $500,000'),
        equityNeeded: z.number().min(100000, 'Minimum equity loan amount is $100,000'),
        purpose: z.enum(['investment', 'renovation', 'business', 'education', 'other'])
      })
    
    default:
      return fullSchema
  }
}

/**
 * Alias for createGateSchema to support progressive form hooks
 * @deprecated Use createGateSchema instead
 */
export const createStepSchema = createGateSchema
