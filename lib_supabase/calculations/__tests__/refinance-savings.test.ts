import { describe, it, expect } from '@jest/globals';
import { calculateInterestSavings } from '@/lib/calculations/refinance-savings';

describe('calculateInterestSavings', () => {
  it('should calculate 2-year savings correctly', () => {
    const result = calculateInterestSavings(400000, 0.03, 0.0215, 2);

    // Current: 400k × 3% × 2 = $24,000
    // New: 400k × 2.15% × 2 = $17,200
    // Savings: $6,800
    expect(result.savings).toBe(6800);
    expect(result.currentInterest).toBe(24000);
    expect(result.newInterest).toBe(17200);
  });

  it('should calculate 3-year savings correctly', () => {
    const result = calculateInterestSavings(400000, 0.03, 0.0215, 3);

    // Current: 400k × 3% × 3 = $36,000
    // New: 400k × 2.15% × 3 = $25,800
    // Savings: $10,200
    expect(result.savings).toBe(10200);
  });

  it('should return zero for zero outstanding loan', () => {
    const result = calculateInterestSavings(0, 0.03, 0.0215, 2);

    expect(result.savings).toBe(0);
    expect(result.currentInterest).toBe(0);
    expect(result.newInterest).toBe(0);
  });

  it('should clamp negative savings to zero', () => {
    // Target rate HIGHER than current (no benefit to refinance)
    const result = calculateInterestSavings(400000, 0.02, 0.03, 2);

    expect(result.savings).toBe(0);
  });

  it('should round savings down to nearest $100', () => {
    // Create scenario that results in raw savings needing rounding
    // 400k × (0.0301875 - 0.0215) × 2 = 6,950 → should round down to 6,900
    const result = calculateInterestSavings(400000, 0.0301875, 0.0215, 2);

    // Should round $6,950 → $6,900
    expect(result.savings).toBe(6900);
  });
});

import { generateSavingsScenarios } from '@/lib/calculations/refinance-savings';
import { getPlaceholderRates } from '@/lib/types/market-rates';

describe('generateSavingsScenarios', () => {
  it('should generate 3 scenarios', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    expect(scenarios).toHaveLength(3);
    expect(scenarios[0]).toHaveProperty('packageType');
    expect(scenarios[0]).toHaveProperty('rate');
    expect(scenarios[0]).toHaveProperty('savingsTwoYear');
    expect(scenarios[0]).toHaveProperty('savingsThreeYear');
  });

  it('should use MIN rates for all scenarios', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    const twoYearScenario = scenarios.find(s => s.packageType === '2-Year Fixed');
    expect(twoYearScenario?.rate).toBe(marketRates.fixed_packages.two_year.min);
  });

  it('should sort scenarios by 2-year savings descending', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i - 1].savingsTwoYear).toBeGreaterThanOrEqual(
        scenarios[i].savingsTwoYear
      );
    }
  });

  it('should have non-negative savings', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    scenarios.forEach(s => {
      expect(s.savingsTwoYear).toBeGreaterThanOrEqual(0);
      expect(s.savingsThreeYear).toBeGreaterThanOrEqual(0);
    });
  });
});
