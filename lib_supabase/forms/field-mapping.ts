/**
 * Field Mapping Documentation
 * Phase B-0.4: UI to Schema Field Mapping
 *
 * Maps UI field names to schema field names for the sophisticated UI
 */

import { LoanType } from '../contracts/form-contracts'

/**
 * Field mapping configuration
 * Maps UI fields to schema fields
 */
export const fieldMapping = {
  // Loan Type Mapping
  loanType: {
    ui: ['new', 'refinance', 'commercial'],
    schema: ['new_purchase', 'refinance', 'commercial'],
    map: (uiValue: string): LoanType => {
      return uiValue === 'new' ? 'new_purchase' : uiValue as LoanType
    }
  },

  // Property Category Mapping
  propertyCategory: {
    ui: ['resale', 'new_launch', 'bto', 'commercial'],
    schema: ['resale', 'new_launch', 'bto', 'commercial'],
    map: (uiValue: string) => uiValue
  },

  // Property Type Mapping
  propertyType: {
    ui: ['hdb', 'ec', 'condo', 'landed', 'commercial'],
    schema: ['HDB', 'EC', 'Private', 'Landed', 'Commercial'],
    map: (uiValue: string): string => {
      const mapping: Record<string, string> = {
        'hdb': 'HDB',
        'ec': 'EC',
        'condo': 'Private',
        'private': 'Private',
        'landed': 'Landed',
        'commercial': 'Commercial'
      }
      return mapping[uiValue.toLowerCase()] || uiValue
    }
  },

  // Price/Loan Amount Mapping
  priceMapping: {
    'new_purchase': 'priceRange',
    'refinance': 'outstandingLoan',
    'commercial': 'propertyValue'
  },

  // Income Mapping
  incomeMapping: {
    ui: 'monthlyIncome',
    schema: {
      single: 'monthlyIncome',
      joint: 'actualIncomes.0'
    }
  },

  // Age Mapping
  ageMapping: {
    ui: 'combinedAge',
    schema: {
      single: 'combinedAge',
      joint: 'actualAges.0'
    }
  },

  // Refinance Specific Fields
  refinanceFields: {
    currentInterestRate: 'currentRate',
    lockInPeriod: 'lockInStatus',
    existingBank: 'currentBank',
    loanBalance: 'outstandingLoan',
    marketValue: 'propertyValue'
  },

  // Commercial Specific Fields
  commercialFields: {
    businessType: 'businessType',
    occupancyRate: 'tenancyRate',
    businessIncome: 'businessRevenue',
    personalIncome: 'monthlyIncome'
  }
}

/**
 * Transform UI form data to schema-compliant data
 */
export function transformUIToSchema(uiData: Record<string, any>, loanType: string): Record<string, any> {
  const schemaData: Record<string, any> = {}

  // Map loan type
  schemaData.loanType = fieldMapping.loanType.map(loanType)

  // Map basic fields
  schemaData.name = uiData.name
  schemaData.email = uiData.email
  schemaData.phone = uiData.phone

  // Map property type
  if (uiData.propertyType) {
    schemaData.propertyType = fieldMapping.propertyType.map(uiData.propertyType)
  }

  // Map property category
  if (uiData.propertyCategory) {
    schemaData.propertyCategory = uiData.propertyCategory
  }

  // Map price/loan based on loan type
  if (schemaData.loanType === 'new_purchase') {
    schemaData.priceRange = uiData.priceRange || uiData.loanAmount
    schemaData.purchaseTimeline = uiData.purchaseTimeline || 'next_3_months'
    schemaData.firstTimeBuyer = uiData.firstTimeBuyer || false
    schemaData.combinedAge = uiData.combinedAge || 35
  } else if (schemaData.loanType === 'refinance') {
    schemaData.currentRate = uiData.currentRate || uiData.currentInterestRate || 3.0
    schemaData.lockInStatus = uiData.lockInStatus || uiData.lockInPeriod || 'no_lock'
    schemaData.currentBank = uiData.currentBank || uiData.existingBank || 'dbs'
    schemaData.outstandingLoan = uiData.outstandingLoan || uiData.loanBalance || 400000
    schemaData.propertyValue = uiData.propertyValue || uiData.marketValue
  } else if (schemaData.loanType === 'commercial') {
    schemaData.propertyValue = uiData.propertyValue || uiData.loanAmount
    schemaData.businessType = uiData.businessType || 'retail'
    schemaData.tenancyRate = uiData.tenancyRate || uiData.occupancyRate
    schemaData.businessRevenue = uiData.businessRevenue || uiData.businessIncome
  }

  // Map income
  if (uiData.monthlyIncome) {
    schemaData.monthlyIncome = uiData.monthlyIncome
    // Also set actualIncomes for compatibility
    schemaData.actualIncomes = {
      0: uiData.monthlyIncome,
      1: uiData.coApplicantIncome
    }
  }

  // Map employment
  schemaData.employmentType = uiData.employmentType || 'employed'

  // Map age
  if (uiData.combinedAge) {
    schemaData.combinedAge = uiData.combinedAge
    // Also set actualAges for compatibility
    schemaData.actualAges = {
      0: Math.floor(uiData.combinedAge / 2),
      1: Math.ceil(uiData.combinedAge / 2)
    }
  }

  return schemaData
}

/**
 * Transform schema data back to UI format
 */
export function transformSchemaToUI(schemaData: Record<string, any>): Record<string, any> {
  const uiData: Record<string, any> = {}

  // Map loan type
  uiData.loanType = schemaData.loanType === 'new_purchase' ? 'new' : schemaData.loanType

  // Map basic fields
  uiData.name = schemaData.name
  uiData.email = schemaData.email
  uiData.phone = schemaData.phone

  // Map property type
  if (schemaData.propertyType) {
    const reverseMap: Record<string, string> = {
      'HDB': 'hdb',
      'EC': 'ec',
      'Private': 'condo',
      'Landed': 'landed',
      'Commercial': 'commercial'
    }
    uiData.propertyType = reverseMap[schemaData.propertyType] || schemaData.propertyType
  }

  // Map property category
  uiData.propertyCategory = schemaData.propertyCategory

  // Map price/loan based on loan type
  if (schemaData.loanType === 'new_purchase') {
    uiData.priceRange = schemaData.priceRange
    uiData.loanAmount = schemaData.priceRange
    uiData.purchaseTimeline = schemaData.purchaseTimeline
    uiData.firstTimeBuyer = schemaData.firstTimeBuyer
    uiData.combinedAge = schemaData.combinedAge
  } else if (schemaData.loanType === 'refinance') {
    uiData.currentRate = schemaData.currentRate
    uiData.lockInStatus = schemaData.lockInStatus
    uiData.currentBank = schemaData.currentBank
    uiData.outstandingLoan = schemaData.outstandingLoan
    uiData.loanBalance = schemaData.outstandingLoan
    uiData.propertyValue = schemaData.propertyValue
  }

  // Map income
  if (schemaData.monthlyIncome) {
    uiData.monthlyIncome = schemaData.monthlyIncome
  } else if (schemaData.actualIncomes?.[0]) {
    uiData.monthlyIncome = schemaData.actualIncomes[0]
  }

  // Map employment
  uiData.employmentType = schemaData.employmentType

  // Map age
  if (schemaData.combinedAge) {
    uiData.combinedAge = schemaData.combinedAge
  } else if (schemaData.actualAges?.[0]) {
    uiData.combinedAge = schemaData.actualAges[0] + (schemaData.actualAges[1] || 0)
  }

  return uiData
}