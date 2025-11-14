// ABOUTME: Centralized field visibility logic for progressive disclosure
// ABOUTME: Implements 3-level progressive disclosure for Step 2 (Category → Type → Price/Age)

import type { LoanType, PropertyCategory, PropertyType } from '../contracts/form-contracts'

export interface Step2State {
  loanType: LoanType
  propertyCategory: PropertyCategory | null
  propertyType: PropertyType | null
}

export function getStep2VisibleFields(state: Step2State): string[] {
  const fields: string[] = []

  // Refinance: No progressive disclosure, show all immediately
  if (state.loanType === 'refinance') {
    return [
      'propertyType',
      'priceRange',
      'outstandingLoan',
      'currentRate',
      'currentBank',
      'existingProperties'
    ]
  }

  // New Purchase: 3-level progressive disclosure

  // Level 1: Category always visible
  fields.push('propertyCategory')

  // Level 2: Type appears after category selected
  if (state.propertyCategory) {
    fields.push('propertyType')
  }

  // Level 3: Price + age appear ONLY after type selected
  if (state.propertyType) {
    fields.push('priceRange', 'combinedAge')

    // Existing properties checkbox (for Private/EC/Landed only)
    if (['Private', 'EC', 'Landed'].includes(state.propertyType)) {
      fields.push('existingProperties')
    }
  }

  return fields
}

export function shouldShowField(fieldName: string, visibleFields: string[]): boolean {
  return visibleFields.includes(fieldName)
}
