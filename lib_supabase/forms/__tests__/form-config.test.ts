// ABOUTME: Verifies form default values include Step 3 new purchase structures
// ABOUTME: Ensures employment and liability defaults are provisioned for controllers

import { getDefaultValues } from '../form-config'

describe('form-config defaults', () => {
  it('provides employment and liability structures for new purchase flow', () => {
    const defaults = getDefaultValues('new_purchase')

    expect(defaults).toHaveProperty('actualVariableIncomes')
    expect(defaults.actualVariableIncomes).toEqual({ 0: undefined, 1: undefined })

    expect(defaults).toHaveProperty('employmentDetails')
    expect(defaults.employmentDetails).toEqual({
      'self-employed': {
        businessAgeYears: '',
        noaSubmitted: false,
        averageReportedIncome: ''
      },
      variable: {
        averagePastTwelveMonths: '',
        lowestObservedIncome: ''
      }
    })

    expect(defaults).toHaveProperty('liabilities')
    expect(defaults.liabilities).toMatchObject({
      propertyLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      carLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      creditCards: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      personalLines: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      otherCommitments: ''
    })
  })

  it('provides refinance defaults for objectives and timing fields', () => {
    const defaults = getDefaultValues('refinance')

    expect(defaults).toHaveProperty('refinancingGoals')
    expect(Array.isArray(defaults.refinancingGoals)).toBe(true)
    expect(defaults.refinancingGoals).toContain('lower_monthly_payment')

    expect(defaults).toMatchObject({
      cashOutAmount: undefined,
      cashOutReason: undefined,
      monthsRemaining: undefined,
      ownerOccupied: true
    })
  })
})
