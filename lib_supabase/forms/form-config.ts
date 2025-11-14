/**
 * Form Configuration
 * Phase B-0.2: Extracted domain configuration from UI
 *
 * Central configuration for progressive form steps and default values
 */

import { FormStep, LoanType, PropertyCategory, PropertyType } from '../contracts/form-contracts'

/**
 * Progressive form step definitions
 * Defines the micro-commitment ladder for trust building
 */
export const formSteps: FormStep[] = [
  {
    stepNumber: 0,
    label: 'Loan Type',
    description: 'Choose your mortgage path',
    fieldsRequired: ['loanType'],
    minimumFields: 1,
    trustLevel: 0,
    ctaText: 'Get Instant Estimate (No Email Required)'
  },
  {
    stepNumber: 1,
    label: 'Who You Are',
    description: 'Your contact information',
    fieldsRequired: ['name', 'email', 'phone'],
    minimumFields: 3,
    trustLevel: 25,
    ctaText: 'Continue to property details'
  },
  {
    stepNumber: 2,
    label: 'What You Need',
    description: 'Tell us about your property goals',
    fieldsRequired: ['propertyCategory', 'propertyType', 'priceRange', 'combinedAge'],
    minimumFields: 4,
    trustLevel: 50,
    ctaText: 'Get instant loan estimate'
  },
  {
    stepNumber: 3,
    label: 'Financial Details',
    description: 'Help us understand your financial situation',
    fieldsRequired: ['actualAges.0', 'actualIncomes.0', 'employmentType'],
    minimumFields: 3,
    trustLevel: 75,
    ctaText: 'Connect with AI Mortgage Specialist'
  }
]

/**
 * Get default form values based on loan type
 * Provides sensible defaults for Singapore market
 */
export function getDefaultValues(loanType: LoanType): Record<string, any> {
  const defaults: any = {
    loanType,
    name: '',
    email: '',
    phone: '',
    // Singapore reality: Joint applications are the norm
    applicantType: 'joint',
    // Initialize actualAges and actualIncomes to prevent controlled/uncontrolled input warnings
    actualAges: {
      0: undefined, // Set reasonable defaults
      1: undefined
    },
    actualIncomes: {
      0: undefined, // Set reasonable defaults
      1: undefined
    },
    actualVariableIncomes: {
      0: undefined,
      1: undefined
    },
    // Step 3 fields (Your Finances)
    existingCommitments: undefined,
    employmentType: undefined, // No default - shows placeholder on load
    creditCardCount: 0,
    hasJointApplicant: false,
    // Property ownership (affects LTV tier: 1st property = 75%, 2nd = 45%, 3rd+ = 35%)
    existingProperties: 0, // Default to first property (most common case)
    employmentDetails: {
      'self-employed': {
        businessAgeYears: '',
        noaSubmitted: false,
        averageReportedIncome: ''
      },
      variable: {
        averagePastTwelveMonths: '',
        lowestObservedIncome: ''
      }
    },
    liabilities: {
      propertyLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      carLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      creditCards: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      personalLines: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      otherCommitments: ''
    },
    // Initialize co-applicant fields to avoid validation errors for single applicants
    applicant2Commitments: undefined,
    // Refinance objectives and cash-out
    refinancingGoals: [],
    cashOutAmount: undefined,
    cashOutReason: undefined,
    // Property and timing details for Step 3 refinance
    ownerOccupied: true, // Default to owner-occupied
    monthsRemaining: undefined,
    // MAS readiness compliance metrics
    tdsrRatio: undefined,
    tdsrLimit: 55,
    msrRatio: undefined,
    msrLimit: 30,
  }

  // Add loan-type specific defaults
  if (loanType === 'new_purchase') {
    defaults.propertyCategory = undefined // No default - progressive disclosure starts with category selection
    defaults.propertyType = undefined // No default - shows after category selected
    defaults.priceRange = undefined // No default to avoid test/UX issues with default values
    defaults.combinedAge = undefined // User must enter their age (no default to prevent concatenation bug)
    defaults.developmentName = undefined // Optional field
    defaults.paymentScheme = undefined // Optional field
  } else if (loanType === 'refinance') {
    defaults.propertyType = 'HDB' // Required by step 2 schema
    defaults.currentRate = 3.0 // Default reasonable rate
    defaults.lockInStatus = 'no_lock' // Default to no lock-in
    defaults.currentBank = 'dbs' // Default to first bank option
    defaults.propertyValue = undefined
    defaults.outstandingLoan = 400000 // Default reasonable outstanding loan
    defaults.remainingTenure = undefined
    defaults.ownerOccupied = true // Default to owner-occupied
    defaults.monthsRemaining = undefined
    defaults.refinancingGoals = ['lower_monthly_payment'] // Default to most common objective
    // MAS readiness compliance metrics
    defaults.tdsrRatio = undefined
    defaults.tdsrLimit = 55
    defaults.msrRatio = undefined
    defaults.msrLimit = 30
    // Per-applicant income/job changes flow defaults
    defaults.mainApplicantChanges = undefined
    defaults.coApplicantChanges = undefined
    defaults.yearsInProperty = undefined
  } else if (loanType === 'commercial') {
    defaults.commercialPropertyType = ''
    defaults.purchaseStructure = ''
  }

  return defaults
}

/**
 * Map UI loan type to schema loan type
 * Handles legacy naming conventions
 */
export function mapLoanType(uiLoanType: string): LoanType {
  if (uiLoanType === 'new') {
    return 'new_purchase'
  }
  return uiLoanType as LoanType
}

/**
 * Property category options for new purchases
 */
export const propertyCategoryOptions = [
  {
    value: 'resale',
    label: 'Resale',
    description: 'Existing HDB or private property'
  },
  {
    value: 'new_launch',
    label: 'New Launch',
    description: 'Brand new development'
  },
  {
    value: 'bto',
    label: 'BTO',
    description: 'Build-To-Order HDB flat'
  },
  {
    value: 'commercial',
    label: 'Commercial',
    description: 'Office, retail, or industrial'
  }
]

export type PropertyTypeOption = {
  value: PropertyType
  label: string
}

export const propertyTypeOptionsByCategory: Record<
  'default' | 'resale' | 'new_launch' | 'bto' | 'commercial' | 'refinance',
  PropertyTypeOption[]
> = {
  default: [
    { value: 'HDB', label: 'HDB Flat' },
    { value: 'EC', label: 'Executive Condo' },
    { value: 'Private', label: 'Private Condo' },
    { value: 'Landed', label: 'Landed Property' }
  ],
  resale: [
    { value: 'HDB', label: 'HDB Flat' },
    { value: 'Private', label: 'Private Condo' },
    { value: 'Landed', label: 'Landed Property' }
  ],
  new_launch: [
    { value: 'EC', label: 'Executive Condo' },
    { value: 'Private', label: 'Private Condo' },
    { value: 'Landed', label: 'Landed Property' }
  ],
  bto: [
    { value: 'HDB', label: 'HDB Flat' }
  ],
  commercial: [
    { value: 'Commercial', label: 'Commercial Property' }
  ],
  refinance: [
    { value: 'HDB', label: 'HDB Flat' },
    { value: 'EC', label: 'Executive Condo' },
    { value: 'Private', label: 'Private Condo' },
    { value: 'Landed', label: 'Landed Property' }
  ]
}

export function getPropertyTypeOptions(
  loanType: LoanType,
  category?: PropertyCategory | null
): PropertyTypeOption[] {
  if (loanType === 'refinance') {
    return propertyTypeOptionsByCategory.refinance
  }

  if (loanType === 'new_purchase') {
    if (category === 'resale') return propertyTypeOptionsByCategory.resale
    if (category === 'new_launch') return propertyTypeOptionsByCategory.new_launch
    if (category === 'bto') return propertyTypeOptionsByCategory.bto
    if (category === 'commercial') return propertyTypeOptionsByCategory.commercial
    return propertyTypeOptionsByCategory.default
  }

  if (loanType === 'commercial') {
    return propertyTypeOptionsByCategory.commercial
  }

  return propertyTypeOptionsByCategory.default
}

/**
 * Field visibility rules
 * Determines which fields to show based on form state
 */
export function getVisibleFields(
  loanType: LoanType,
  step: number,
  propertyCategory?: string
): string[] {
  const visibleFields: string[] = []

  if (step === 1) {
    // Step 1: Basic info
    visibleFields.push('name', 'email', 'phone')
  } else if (step === 2) {
    // Step 2: Property details
    if (loanType === 'new_purchase') {
      // Always show the 4 required inputs per restoration plan
      visibleFields.push('propertyCategory', 'propertyType', 'priceRange', 'combinedAge')

      if (propertyCategory === 'resale') {
        visibleFields.push('purchaseTimeline', 'firstTimeBuyer')
      } else if (propertyCategory === 'new_launch') {
        visibleFields.push('developmentName', 'unitType', 'topDate', 'paymentScheme')
      } else if (propertyCategory === 'bto') {
        visibleFields.push('btoProject', 'flatType', 'grantAmount', 'firstTimer')
      }
    } else if (loanType === 'refinance') {
      // Always show the 4 required inputs for restoration plan
      visibleFields.push('propertyType', 'priceRange', 'combinedAge')
      visibleFields.push('currentRate', 'lockInStatus', 'currentBank', 'outstandingLoan')
    } else if (loanType === 'commercial') {
      visibleFields.push('commercialPropertyType', 'purchaseStructure')
    }
  } else if (step === 3) {
    // Step 3: Financial details
    visibleFields.push('actualAges.0', 'actualIncomes.0', 'employmentType')

    // Add co-applicant fields if joint application
    if (propertyCategory !== 'commercial') {
      visibleFields.push('actualAges.1', 'actualIncomes.1')
    }

    // Add refinance-specific Step 3 fields
    if (loanType === 'refinance') {
      visibleFields.push('ownerOccupied', 'monthsRemaining')
      visibleFields.push('refinancingGoals')
    }
  }

  return visibleFields
}
