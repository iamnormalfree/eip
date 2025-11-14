// ABOUTME: Tests for market rate data structures and placeholder factory
// ABOUTME: Validates MarketRateSnapshot interface and getPlaceholderRates() function

import { describe, it, expect } from '@jest/globals';
import { getPlaceholderRates, type MarketRateSnapshot } from '@/lib/types/market-rates';

describe('MarketRateSnapshot', () => {
  it('should return valid structure from placeholder', () => {
    const rates = getPlaceholderRates();

    expect(rates).toHaveProperty('updated_at');
    expect(rates).toHaveProperty('fixed_packages');
    expect(rates).toHaveProperty('floating_packages');
    expect(rates).toHaveProperty('sora_benchmarks');
  });

  it('should have valid rate ranges', () => {
    const rates = getPlaceholderRates();

    expect(rates.fixed_packages.two_year.min).toBeGreaterThan(0);
    expect(rates.fixed_packages.two_year.min).toBeLessThan(rates.fixed_packages.two_year.max);
    expect(rates.fixed_packages.two_year.bank_count).toBeGreaterThan(0);
  });

  it('should have valid ISO timestamp', () => {
    const rates = getPlaceholderRates();

    expect(() => new Date(rates.updated_at)).not.toThrow();
    expect(new Date(rates.updated_at).toISOString()).toBe(rates.updated_at);
  });

  it('should have SORA benchmarks between 0-10%', () => {
    const rates = getPlaceholderRates();

    expect(rates.sora_benchmarks.one_month).toBeGreaterThanOrEqual(0);
    expect(rates.sora_benchmarks.one_month).toBeLessThanOrEqual(10);
    expect(rates.sora_benchmarks.three_month).toBeGreaterThanOrEqual(0);
    expect(rates.sora_benchmarks.three_month).toBeLessThanOrEqual(10);
  });
});
