// ABOUTME: Integration tests for IWAA-based tenure calculation in calculateInstantProfile
// ABOUTME: Validates Dr Elena v2 compliance for joint applicants and 55% LTV extended tenure

import { calculateInstantProfile } from '../instant-profile'

describe('IWAA Tenure Integration - Dr Elena v2 Compliance', () => {

  // Test Group 1: HDB 75% LTV (baseline)
  describe('HDB - 75% LTV Tier', () => {
    it('should use IWAA for joint applicants, capped at 25 years', () => {
      // Given: Joint applicants
      // IWAA = (35×5000 + 30×3000) / 8000 = (175000 + 90000) / 8000 = 265000 / 8000 = 33.125 → Math.ceil = 34
      // Tenure = MIN(65 - 34, 25) = MIN(31, 25) = 25
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],  // ← NEW parameter (will cause TypeScript error initially)
        incomes: [5000, 3000],  // ← NEW parameter
        income: 8000,  // Total income (backwards compat)
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 35,  // ← OLD parameter (backwards compat)
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(25)
      expect(result.tenureCapSource).toBe('regulation') // Capped by 25-year max, not age
    })

    it('should use single age when only one applicant', () => {
      // Given: Single applicant (backwards compatibility)
      // Tenure = MIN(65 - 40, 25) = MIN(25, 25) = 25
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 40,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(25)
    })

    it('should cap by age when IWAA is older', () => {
      // Given: Older joint applicants
      // IWAA = (55×6000 + 45×4000) / 10000 = (330000 + 180000) / 10000 = 51
      // Tenure = MIN(65 - 51, 25) = MIN(14, 25) = 14
      const result = calculateInstantProfile({
        property_price: 400000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [55, 45],
        incomes: [6000, 4000],
        income: 10000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 55,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(14)
      expect(result.tenureCapSource).toBe('age') // Capped by age, not regulation
    })
  })

  // Test Group 2: HDB 55% LTV (EXTENDED TENURE)
  describe('HDB - 55% LTV Extended Tenure Tier', () => {
    it('should use 75 - IWAA formula, capped at 30 years', () => {
      // Given: Joint applicants with 55% LTV
      // IWAA = (35×5000 + 30×3000) / 8000 = 33.125 → ceil = 34
      // 55% LTV Extended: Tenure = MIN(75 - 34, 30) = MIN(41, 30) = 30
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 35,
        loan_type: 'new_purchase'
      }, 55)  // ← ltvMode = 55% (extended tier)

      expect(result.tenureCapYears).toBe(30)
      expect(result.tenureCapSource).toBe('regulation') // Capped by 30-year max
    })

    it('should give longer tenure than 75% LTV for same IWAA', () => {
      // Comparison: 75% LTV vs 55% LTV for same applicants
      // IWAA = (45×6000 + 40×4000) / 10000 = (270000 + 160000) / 10000 = 43

      const base75 = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [45, 40],
        incomes: [6000, 4000],
        income: 10000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 45,
        loan_type: 'new_purchase'
      }, 75)  // 75% LTV

      const extended55 = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [45, 40],
        incomes: [6000, 4000],
        income: 10000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 45,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      // 75% LTV: MIN(65 - 43, 25) = MIN(22, 25) = 22
      // 55% LTV: MIN(75 - 43, 30) = MIN(32, 30) = 30

      expect(extended55.tenureCapYears).toBeGreaterThan(base75.tenureCapYears)
      expect(extended55.tenureCapYears).toBe(30)
      expect(base75.tenureCapYears).toBe(22)
    })
  })

  // Test Group 3: EC - 75% LTV
  describe('EC - 75% LTV Tier', () => {
    it('should use 65 - IWAA, capped at 30 years', () => {
      // IWAA = (35×5000 + 30×3000) / 8000 = 34
      // Tenure = MIN(65 - 34, 30) = MIN(31, 30) = 30
      const result = calculateInstantProfile({
        property_price: 800000,
        property_type: 'EC',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 35,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(30)
      expect(result.tenureCapSource).toBe('regulation')
    })
  })

  // Test Group 4: EC - 55% LTV EXTENDED
  describe('EC - 55% LTV Extended Tenure Tier', () => {
    it('should use 65 - IWAA, capped at 35 years (extended)', () => {
      // IWAA = (35×5000 + 30×3000) / 8000 = 34
      // 55% Extended: Tenure = MIN(65 - 34, 35) = MIN(31, 35) = 31
      const result = calculateInstantProfile({
        property_price: 800000,
        property_type: 'EC',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 35,
        age: 35,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      expect(result.tenureCapYears).toBe(31)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 5: Private/Condo - 75% LTV
  describe('Private/Condo - 75% LTV Tier', () => {
    it('should use 65 - IWAA, capped at 30 years', () => {
      // IWAA = (40×8000 + 35×6000) / 14000 = (320000 + 210000) / 14000 = 37.857 → ceil = 38
      // Tenure = MIN(65 - 38, 30) = MIN(27, 30) = 27
      const result = calculateInstantProfile({
        property_price: 1200000,
        property_type: 'Private',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [40, 35],
        incomes: [8000, 6000],
        income: 14000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 40,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(27)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 6: Private/Condo - 55% LTV EXTENDED
  describe('Private/Condo - 55% LTV Extended Tenure Tier', () => {
    it('should use 65 - IWAA, capped at 35 years (extended)', () => {
      // IWAA = (40×8000 + 35×6000) / 14000 = 38
      // 55% Extended: Tenure = MIN(65 - 38, 35) = MIN(27, 35) = 27
      const result = calculateInstantProfile({
        property_price: 1200000,
        property_type: 'Private',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [40, 35],
        incomes: [8000, 6000],
        income: 14000,
        commitments: 0,
        rate: 4.0,
        tenure: 35,
        age: 40,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      expect(result.tenureCapYears).toBe(27)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 7: Commercial
  describe('Commercial - Both LTV Tiers', () => {
    it('75% LTV: should use 65 - IWAA, capped at 30 years', () => {
      // IWAA = (50×10000 + 30×2000) / 12000 = (500000 + 60000) / 12000 = 46.667 → ceil = 47
      // Tenure = MIN(65 - 47, 30) = MIN(18, 30) = 18
      const result = calculateInstantProfile({
        property_price: 2000000,
        property_type: 'Commercial',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [50, 30],
        incomes: [10000, 2000],
        income: 12000,
        commitments: 0,
        rate: 5.0,  // Commercial uses 5% stress test
        tenure: 30,
        age: 50,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(18)
      expect(result.tenureCapSource).toBe('age')
    })

    it('55% LTV: should use 65 - IWAA, capped at 35 years (extended)', () => {
      // IWAA = (35×5000 + 30×3000) / 8000 = 34
      // 55% Extended: Tenure = MIN(65 - 34, 35) = MIN(31, 35) = 31
      const result = calculateInstantProfile({
        property_price: 2000000,
        property_type: 'Commercial',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 5.0,
        tenure: 35,
        age: 35,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      expect(result.tenureCapYears).toBe(31)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 8: Edge Cases
  describe('Edge Cases', () => {
    it('should handle very old applicants (minimum tenure 1 year)', () => {
      // IWAA = 70
      // Tenure = MIN(65 - 70, 30) = MIN(-5, 30) = -5 → should cap at 1
      const result = calculateInstantProfile({
        property_price: 400000,
        property_type: 'Private',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [70, 70],
        incomes: [4000, 4000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 1,
        age: 70,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBeGreaterThanOrEqual(1)
    })

    it('should handle zero income co-applicant', () => {
      // IWAA should just use age 40 (ignore zero-income applicant)
      // Tenure = MIN(65 - 40, 25) = 25
      const result = calculateInstantProfile({
        property_price: 600000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [40, 30],
        incomes: [8000, 0],  // Co-applicant has no income
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 40,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(25)
    })

    it('should handle missing ages/incomes (backwards compatibility)', () => {
      // Old code path: no ages/incomes arrays provided
      // Should fall back to single 'age' parameter
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 35,
        loan_type: 'new_purchase'
      })

      // Tenure = MIN(65 - 35, 25) = 25
      expect(result.tenureCapYears).toBe(25)
    })

    it('should handle mismatched ages/incomes array lengths', () => {
      // Given: Mismatched arrays (ages has 2, incomes has 1)
      // Should fall back to ages[0] = 35
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [8000],  // Only one income (mismatch!)
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 35,
        loan_type: 'new_purchase'
      })

      expect(result.tenureCapYears).toBe(25)
    })
  })
})
