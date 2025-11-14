// ABOUTME: TypeScript interfaces for market rate snapshots (fixed/floating/hybrid packages)
// ABOUTME: Used by refinance calculation and display components

/**
 * Snapshot of market mortgage rates at a point in time.
 * Updated daily via cron job (future) or manual updates (current).
 */
export interface MarketRateSnapshot {
  /** ISO 8601 timestamp when rates were last updated */
  updated_at: string;

  /** Fixed-rate mortgage packages */
  fixed_packages: {
    two_year: RateRange;
    three_year: RateRange;
    five_year: RateRange;
  };

  /** Floating-rate packages (SORA-based) */
  floating_packages: {
    three_month_sora: RateRange;
    one_month_sora: RateRange;
  };

  /** Hybrid packages (fixed period then floating) */
  hybrid_packages: {
    two_year_fixed_then_floating: RateRange;
  };

  /** Current SORA benchmark rates */
  sora_benchmarks: {
    three_month: number; // Current 3M SORA %
    one_month: number;   // Current 1M SORA %
  };
}

/**
 * Rate range with min/max and bank count for competition signal
 */
export interface RateRange {
  min: number;        // Minimum rate % (e.g., 2.15)
  max: number;        // Maximum rate % (e.g., 2.45)
  bank_count: number; // Number of banks offering in this range
}

/**
 * Returns placeholder market rates for development.
 * TODO: Replace with API call in Phase 3 (cron job automation).
 */
export function getPlaceholderRates(): MarketRateSnapshot {
  return {
    updated_at: new Date().toISOString(),
    fixed_packages: {
      two_year: { min: 2.15, max: 2.45, bank_count: 8 },
      three_year: { min: 2.35, max: 2.65, bank_count: 12 },
      five_year: { min: 2.65, max: 2.95, bank_count: 7 },
    },
    floating_packages: {
      three_month_sora: { min: 2.60, max: 2.85, bank_count: 15 },
      one_month_sora: { min: 2.55, max: 2.80, bank_count: 9 },
    },
    hybrid_packages: {
      two_year_fixed_then_floating: { min: 2.20, max: 2.50, bank_count: 10 },
    },
    sora_benchmarks: {
      three_month: 1.39,
      one_month: 1.29,
    },
  };
}
