// ABOUTME: Comprehensive test suite for mortgage schemas validation (26 tests total)
// ABOUTME: Covers all schema types, validation rules, and progressive gate validation

import {
  newPurchaseSchema,
  refinanceSchema,
  equityLoanSchema,
  mortgageFormSchema,
  step1Schema,
  step2BaseSchema,
  aiContextSchema,
  createGateSchema,
  VALIDATION_MESSAGES,
  validateSingaporePhone,
  validatePropertyValue,
  validateLoanAmount
} from '../mortgage-schemas'
import { z } from 'zod'

describe('Mortgage Schemas - Core Validation', () => {
  describe('Base Schema Validation', () => {
    test('step1Schema should validate loan type selection', () => {
      const validData = { loanType: 'new_purchase' }
      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('step1Schema should reject invalid loan type', () => {
      const invalidData = { loanType: 'invalid_type' }
      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('step2BaseSchema should validate basic information', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567'
      }
      const result = step2BaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('step2BaseSchema should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '91234567'
      }
      const result = step2BaseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('step2BaseSchema should reject invalid phone', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '12345678'
      }
      const result = step2BaseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('New Purchase Schema', () => {
    test('should validate complete new purchase data', () => {
      const validData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        purchaseTimeline: 'this_month' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        ipaStatus: 'have_ipa' as const,
        firstTimeBuyer: true
      }
      const result = newPurchaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('should accept optional fields in new purchase', () => {
      const dataWithOptional = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        purchaseTimeline: 'next_3_months' as const,
        propertyType: 'Private' as const,
        priceRange: 800000,
        ipaStatus: 'applied' as const,
        firstTimeBuyer: false,
        downPaymentReady: true,
        cpfUsage: 'yes' as const
      }
      const result = newPurchaseSchema.safeParse(dataWithOptional)
      expect(result.success).toBe(true)
    })

    test('should reject invalid property price in new purchase', () => {
      const invalidData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
       purchaseTimeline: 'this_month' as const,
        propertyType: 'HDB' as const,
        priceRange: 200000, // Below minimum
        ipaStatus: 'have_ipa' as const,
        firstTimeBuyer: true
      }
      const result = newPurchaseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should reject property price above maximum in new purchase', () => {
      const invalidData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        purchaseTimeline: 'this_month' as const,
        propertyType: 'Private' as const,
        priceRange: 100000000, // Above maximum
        ipaStatus: 'have_ipa' as const,
        firstTimeBuyer: true
      }
      const result = newPurchaseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Refinance Schema', () => {
    test('should validate complete refinance data', () => {
      const validData = {
        loanType: 'refinance' as const,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '82345678',
        currentRate: 3.5,
        lockInStatus: 'ending_soon' as const,
        currentBank: 'DBS',
        outstandingLoan: 500000,
        propertyValue: 800000,
        propertyType: 'HDB' as const,
        yearsPurchased: 5,
        refinanceReason: 'lower_rate' as const,
        // New Step 3 refinance fields
        refinancingGoals: ['lower_monthly_payment'] as const,
        monthsRemaining: 6,
        ownerOccupied: true
      }
      const result = refinanceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('should accept optional cash out amount', () => {
      const dataWithCashOut = {
        loanType: 'refinance' as const,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '82345678',
        currentRate: 3.5,
        lockInStatus: 'ending_soon' as const,
        currentBank: 'DBS',
        outstandingLoan: 500000,
        propertyValue: 800000,
        propertyType: 'HDB' as const,
        yearsPurchased: 5,
        refinanceReason: 'cash_out' as const,
        cashOutAmount: 100000,
        // New Step 3 refinance fields
        refinancingGoals: ['cash_out'] as const,
        monthsRemaining: 12,
        ownerOccupied: true
      }
      const result = refinanceSchema.safeParse(dataWithCashOut)
      expect(result.success).toBe(true)
    })

    test('should validate extended refinance fields for timing and analytics coverage', () => {
      const enrichedData = {
        loanType: 'refinance' as const,
        name: 'Jamie Tan',
        email: 'jamie@example.com',
        phone: '81234567',
        currentRate: 2.9,
        lockInStatus: 'no_lock' as const,
        currentBank: 'UOB',
        outstandingLoan: 420000,
        propertyValue: 950000,
        propertyType: 'Private' as const,
        yearsPurchased: 3,
        refinanceReason: 'better_terms' as const,
        refinancingGoals: ['lower_monthly_payment', 'rate_certainty'] as const,
        cashOutAmount: 0,
        cashOutReason: '',
        monthsRemaining: 4,
        ownerOccupied: true
      }

      const result = refinanceSchema.safeParse(enrichedData)
      expect(result.success).toBe(true)
    })

    test('should reject invalid current rate', () => {
      const invalidData = {
        loanType: 'refinance' as const,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '82345678',
        currentRate: -1, // Invalid rate
        lockInStatus: 'ending_soon' as const,
        currentBank: 'DBS',
        outstandingLoan: 500000,
        propertyValue: 800000,
        propertyType: 'HDB' as const,
        yearsPurchased: 5,
        refinanceReason: 'lower_rate' as const
      }
      const result = refinanceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should reject outstanding loan below minimum', () => {
      const invalidData = {
        loanType: 'refinance' as const,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '82345678',
        currentRate: 3.5,
        lockInStatus: 'ending_soon' as const,
        currentBank: 'DBS',
        outstandingLoan: 5000, // Below minimum
        propertyValue: 800000,
        propertyType: 'HDB' as const,
        yearsPurchased: 5,
        refinanceReason: 'lower_rate' as const
      }
      const result = refinanceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Equity Loan Schema', () => {
    test('should validate complete equity loan data', () => {
      const validData = {
        loanType: 'equity_loan' as const,
        name: 'Bob Lee',
        email: 'bob@example.com',
        phone: '93456789',
        propertyValue: 1000000,
        propertyType: 'Private' as const,
        existingLoan: 300000,
        equityAmount: 200000,
        purpose: 'renovation' as const,
        repaymentPeriod: '10_years' as const,
        monthlyIncome: 8000
      }
      const result = equityLoanSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('should reject property value below minimum for equity loan', () => {
      const invalidData = {
        loanType: 'equity_loan' as const,
        name: 'Bob Lee',
        email: 'bob@example.com',
        phone: '93456789',
        propertyValue: 150000, // Below minimum for equity loan
        propertyType: 'HDB' as const,
        existingLoan: 300000,
        equityAmount: 200000,
        purpose: 'renovation' as const,
        repaymentPeriod: '10_years' as const,
        monthlyIncome: 8000
      }
      const result = equityLoanSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should reject equity amount above maximum', () => {
      const invalidData = {
        loanType: 'equity_loan' as const,
        name: 'Bob Lee',
        email: 'bob@example.com',
        phone: '93456789',
        propertyValue: 1000000,
        propertyType: 'Private' as const,
        existingLoan: 300000,
        equityAmount: 5000000, // Above maximum
        purpose: 'renovation' as const,
        repaymentPeriod: '10_years' as const,
        monthlyIncome: 8000
      }
      const result = equityLoanSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Union Schema Validation', () => {
    test('mortgageFormSchema should validate new purchase data', () => {
      const validData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        purchaseTimeline: 'this_month' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        ipaStatus: 'have_ipa' as const,
        firstTimeBuyer: true
      }
      const result = mortgageFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('mortgageFormSchema should validate refinance data', () => {
      const validData = {
        loanType: 'refinance' as const,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '82345678',
        currentRate: 3.5,
        lockInStatus: 'ending_soon' as const,
        currentBank: 'DBS',
        outstandingLoan: 500000,
        propertyValue: 800000,
        propertyType: 'HDB' as const,
        yearsPurchased: 5,
        refinanceReason: 'lower_rate' as const,
        // New Step 3 refinance fields
        refinancingGoals: ['lower_monthly_payment'] as const,
        monthsRemaining: 6,
        ownerOccupied: true
      }
      const result = mortgageFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('mortgageFormSchema should reject mismatched loan type', () => {
      const invalidData = {
        loanType: 'new_purchase' as const,
        currentRate: 3.5, // Field that doesn't belong to new_purchase
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567'
      }
      const result = mortgageFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Progressive Gate Validation', () => {
    test('Gate 0 should validate loan type only', () => {
      const gate0Schema = createGateSchema('new_purchase', 0)
      const result = gate0Schema.safeParse({ loanType: 'new_purchase' })
      expect(result.success).toBe(true)
    })

    test('Gate 1 should validate basic info', () => {
      const gate1Schema = createGateSchema('new_purchase', 1)
      const validData = {
        loanType: 'new_purchase',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567'
      }
      const result = gate1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Gate 2 should validate new purchase specific fields', () => {
      const gate2Schema = createGateSchema('new_purchase', 2)
      const validData = {
        loanType: 'new_purchase',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale',
        propertyType: 'HDB',
        priceRange: 500000,
        combinedAge: 35
      }
      const result = gate2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Gate 2 should validate refinance specific fields', () => {
      const gate2Schema = createGateSchema('refinance', 2)
      const validData = {
        loanType: 'refinance',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '82345678',
        propertyType: 'HDB',
        currentRate: 3.5,
        lockInStatus: 'ending_soon',
        outstandingLoan: 500000,
        currentBank: 'DBS'
      }
      const result = gate2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Gate 3 should validate financial information', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const validData = {
        loanType: 'new_purchase',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale',
        propertyType: 'HDB',
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': 8000 },
        actualAges: { '0': 35 },
        employmentType: 'employed',
        creditCardCount: 2,
        existingCommitments: 500,
        hasJointApplicant: false
      }
      const result = gate3Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

  test('Gate 3 refinance should support objectives, cash-out, and timing fields', () => {
    const gate3Schema = createGateSchema('refinance', 3)
    const validData = {
      loanType: 'refinance' as const,
      name: 'Avery Lee',
      email: 'avery@example.com',
      phone: '93456789',
      propertyType: 'Private' as const,
      currentRate: 2.4,
      lockInStatus: 'ending_soon' as const,
      outstandingLoan: 520000,
      currentBank: 'HSBC',
      propertyValue: 1250000,
      actualIncomes: { '0': 9000 },
      actualAges: { '0': 38 },
      employmentType: 'employed' as const,
      refinancingGoals: ['lower_monthly_payment', 'rate_certainty'] as const,
      cashOutAmount: 80000,
      cashOutReason: 'Renovation',
      monthsRemaining: 5,
      ownerOccupied: true
    }

    const result = gate3Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

    test('Gate 3 new purchase should support employment details and liabilities', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const validData = {
        loanType: 'new_purchase' as const,
        name: 'Jamie Lee',
        email: 'jamie@example.com',
        phone: '91234567',
        propertyCategory: 'new_launch' as const,
        propertyType: 'Private' as const,
        priceRange: 980000,
        combinedAge: 32,
        actualIncomes: { '0': 6000 },
        actualVariableIncomes: { '0': 4000 },
        actualAges: { '0': 32 },
        employmentType: 'variable' as const,
        employmentDetails: {
          'self-employed': {
            businessAgeYears: '',
            noaSubmitted: false,
            averageReportedIncome: ''
          },
          variable: {
            averagePastTwelveMonths: 4000,
            lowestObservedIncome: 2000
          }
        },
        liabilities: {
          propertyLoans: { enabled: true, outstandingBalance: 200000, monthlyPayment: 500 },
          carLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
          creditCards: { enabled: true, outstandingBalance: 8000, monthlyPayment: 240 },
          personalLines: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
          otherCommitments: ''
        },
        creditCardCount: 2,
        existingCommitments: 740,
        hasJointApplicant: false
      }

      const result = gate3Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('AI Context Schema', () => {
    test('should validate complete AI context', () => {
      const validAiContext = {
        userBehavior: {
          timeOnPage: 300,
          formInteractions: 15,
          hesitationPoints: ['property_type', 'price_range'],
          deviceType: 'desktop' as const
        },
        marketContext: {
          currentRates: {
            hdb: 2.5,
            private: 3.2,
            commercial: 4.1
          },
          rateDirection: 'rising' as const,
          marketSentiment: 'stable' as const
        },
        leadIntelligence: {
          urgencyScore: 7,
          sophisticationLevel: 'intermediate' as const,
          priceRange: 'mid_market' as const,
          likelyToConvert: true
        }
      }
      const result = aiContextSchema.safeParse(validAiContext)
      expect(result.success).toBe(true)
    })

    test('should reject invalid urgency score', () => {
      const invalidAiContext = {
        userBehavior: {
          timeOnPage: 300,
          formInteractions: 15,
          hesitationPoints: ['property_type'],
          deviceType: 'desktop' as const
        },
        marketContext: {
          currentRates: {
            hdb: 2.5,
            private: 3.2,
            commercial: 4.1
          },
          rateDirection: 'rising' as const,
          marketSentiment: 'stable' as const
        },
        leadIntelligence: {
          urgencyScore: 15, // Above maximum (10)
          sophisticationLevel: 'intermediate' as const,
          priceRange: 'mid_market' as const,
          likelyToConvert: true
        }
      }
      const result = aiContextSchema.safeParse(invalidAiContext)
      expect(result.success).toBe(false)
    })
  })

  describe('Validation Helper Functions', () => {
    test('validateSingaporePhone should accept valid phone numbers', () => {
      expect(validateSingaporePhone('91234567')).toBe(true)
      expect(validateSingaporePhone('82345678')).toBe(true)
      expect(validateSingaporePhone('63456789')).toBe(true)
      expect(validateSingaporePhone('9 1234 567')).toBe(true) // With spaces
    })

    test('validateSingaporePhone should reject invalid phone numbers', () => {
      expect(validateSingaporePhone('12345678')).toBe(false) // Wrong prefix
      expect(validateSingaporePhone('9123456')).toBe(false) // Too short
      expect(validateSingaporePhone('912345678')).toBe(false) // Too long
      expect(validateSingaporePhone('abcde123')).toBe(false) // Invalid characters
    })

    test('validatePropertyValue should validate property type minimums', () => {
      expect(validatePropertyValue(250000, 'HDB')).toBe(true)
      expect(validatePropertyValue(150000, 'HDB')).toBe(false) // Below HDB minimum
      
      expect(validatePropertyValue(650000, 'Private')).toBe(true)
      expect(validatePropertyValue(550000, 'Private')).toBe(false) // Below Private minimum
      
      expect(validatePropertyValue(1000000, 'Landed')).toBe(true)
      expect(validatePropertyValue(800000, 'Landed')).toBe(false) // Below Landed minimum
    })

    test('validateLoanAmount should respect LTV limits', () => {
      expect(validateLoanAmount(450000, 500000, 'HDB')).toBe(true) // 90% LTV
      expect(validateLoanAmount(460000, 500000, 'HDB')).toBe(false) // Above 90% LTV
      
      expect(validateLoanAmount(375000, 500000, 'Private')).toBe(true) // 75% LTV
      expect(validateLoanAmount(400000, 500000, 'Private')).toBe(false) // Above 75% LTV
    })
  })

  describe('Validation Messages Constants', () => {
    test('VALIDATION_MESSAGES should be properly defined', () => {
      expect(VALIDATION_MESSAGES.REQUIRED_FIELD).toBe('This field is required')
      expect(VALIDATION_MESSAGES.INVALID_EMAIL).toBe('Please enter a valid email address')
      expect(VALIDATION_MESSAGES.INVALID_PHONE).toBe('Please enter a valid Singapore phone number (8 digits starting with 6, 8, or 9)')
      expect(VALIDATION_MESSAGES.MIN_AMOUNT).toBe('Amount must be at least SGD')
      expect(VALIDATION_MESSAGES.MAX_AMOUNT).toBe('Amount cannot exceed SGD')
      expect(VALIDATION_MESSAGES.INVALID_RANGE).toBe('Please select a valid range')
    })
  })
})
