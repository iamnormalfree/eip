// ABOUTME: Test suite for progressive form input validation fixes (Plan 2025-10-19)
// ABOUTME: Tests critical validation issues - negative values, age range, decimal ages, liability validation

import {
  createGateSchema
} from '../mortgage-schemas'

describe('Input Validation - Critical Issues (Plan 2025-10-19)', () => {
  describe('Income Field Validation', () => {
    test('should reject negative income in actualIncomes', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const invalidData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': -5000 },
        actualAges: { '0': 35 },
        employmentType: 'employed' as const
      }
      const result = gate3Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative')
      }
    })

    test('should accept valid positive income values', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const validData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': 8000 },
        actualAges: { '0': 35 },
        employmentType: 'employed' as const
      }
      const result = gate3Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Age Field Validation', () => {
    test('should reject age below 18', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const invalidData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': 5000 },
        actualAges: { '0': 15 },
        employmentType: 'employed' as const
      }
      const result = gate3Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 18')
      }
    })

    test('should reject age above 99', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const invalidData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': 5000 },
        actualAges: { '0': 150 },
        employmentType: 'employed' as const
      }
      const result = gate3Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should reject decimal ages', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const invalidData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': 5000 },
        actualAges: { '0': 35.5 },
        employmentType: 'employed' as const
      }
      const result = gate3Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should accept valid age in range 18-99', () => {
      const gate3Schema = createGateSchema('new_purchase', 3)
      const validData = {
        loanType: 'new_purchase' as const,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '91234567',
        propertyCategory: 'resale' as const,
        propertyType: 'HDB' as const,
        priceRange: 500000,
        combinedAge: 35,
        actualIncomes: { '0': 5000 },
        actualAges: { '0': 35 },
        employmentType: 'employed' as const
      }
      const result = gate3Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})
