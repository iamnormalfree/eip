// ABOUTME: Calculates interest savings for refinance scenarios using simple interest (conservative)
// ABOUTME: Used by Step 2 refinance form to show potential savings over 2-3 year windows

import type { MarketRateSnapshot } from '../types/market-rates';

/**
 * Calculates interest savings using simple interest formula (conservative estimate).
 *
 * Formula:
 * - Current interest = outstanding × currentRate × years
 * - New interest = outstanding × targetRate × years
 * - Savings = current - new (clamped to 0 minimum)
 *
 * Why simple interest:
 * - Conservative (actual savings higher with amortization)
 * - Easy to explain to users
 * - No need to know exact tenure
 *
 * @param outstandingLoan - Current loan balance
 * @param currentRate - Current interest rate as decimal (e.g., 0.03 for 3%)
 * @param targetRate - Target refinance rate as decimal
 * @param years - Time window for savings calculation (typically 2-3)
 * @returns Interest savings breakdown
 */
export function calculateInterestSavings(
  outstandingLoan: number,
  currentRate: number,
  targetRate: number,
  years: number
): InterestSavingsResult {
  // Validate inputs
  if (outstandingLoan <= 0 || years <= 0) {
    return { savings: 0, currentInterest: 0, newInterest: 0 };
  }

  // Simple interest calculation
  const currentInterest = outstandingLoan * currentRate * years;
  const newInterest = outstandingLoan * targetRate * years;

  // Calculate savings (clamp to 0 if negative)
  const rawSavings = currentInterest - newInterest;
  const savings = Math.max(0, rawSavings);

  // Round savings DOWN to nearest $100 (conservative, per Dr Elena v2)
  const roundedSavings = Math.floor(savings / 100) * 100;

  return {
    savings: roundedSavings,
    currentInterest: Math.round(currentInterest),
    newInterest: Math.round(newInterest),
  };
}

export interface InterestSavingsResult {
  /** Total interest savings over period (rounded down to $100) */
  savings: number;
  /** Interest paid at current rate */
  currentInterest: number;
  /** Interest paid at new rate */
  newInterest: number;
}

/**
 * Converts percentage rate to decimal for calculations.
 * @param rate - Rate as percentage (e.g., 2.15 for 2.15%)
 * @returns Rate as decimal (e.g., 0.0215)
 */
function percentageToDecimal(rate: number): number {
  return rate / 100;
}

/**
 * Savings scenario for a specific package type
 */
export interface SavingsScenario {
  /** Package type label (e.g., "2-Year Fixed", "Floating SORA") */
  packageType: string;
  /** Target rate for this scenario (decimal) */
  rate: number;
  /** Savings over 2 years */
  savingsTwoYear: number;
  /** Savings over 3 years */
  savingsThreeYear: number;
}

/**
 * Generates savings scenarios for multiple package types.
 * Uses MIN rate from each package range (most attractive to user).
 *
 * @param outstandingLoan - Current loan balance
 * @param currentRate - Current rate as decimal
 * @param marketRates - Market rate snapshot
 * @returns Array of scenarios sorted by 2-year savings (best first)
 */
export function generateSavingsScenarios(
  outstandingLoan: number,
  currentRate: number,
  marketRates: MarketRateSnapshot
): SavingsScenario[] {
  const scenarios: SavingsScenario[] = [];

  // 2-Year Fixed scenario
  const twoYearRate = percentageToDecimal(marketRates.fixed_packages.two_year.min);
  const twoYearFixed = calculateInterestSavings(outstandingLoan, currentRate, twoYearRate, 2);
  scenarios.push({
    packageType: '2-Year Fixed',
    rate: marketRates.fixed_packages.two_year.min,
    savingsTwoYear: twoYearFixed.savings,
    savingsThreeYear: calculateInterestSavings(outstandingLoan, currentRate, twoYearRate, 3).savings,
  });

  // 3-Year Fixed scenario
  const threeYearRate = percentageToDecimal(marketRates.fixed_packages.three_year.min);
  const threeYearFixed = calculateInterestSavings(outstandingLoan, currentRate, threeYearRate, 2);
  scenarios.push({
    packageType: '3-Year Fixed',
    rate: marketRates.fixed_packages.three_year.min,
    savingsTwoYear: threeYearFixed.savings,
    savingsThreeYear: calculateInterestSavings(outstandingLoan, currentRate, threeYearRate, 3).savings,
  });

  // Floating SORA scenario
  const floatingRate = percentageToDecimal(marketRates.floating_packages.three_month_sora.min);
  const floatingRateCalc = calculateInterestSavings(outstandingLoan, currentRate, floatingRate, 2);
  scenarios.push({
    packageType: 'Floating SORA',
    rate: marketRates.floating_packages.three_month_sora.min,
    savingsTwoYear: floatingRateCalc.savings,
    savingsThreeYear: calculateInterestSavings(outstandingLoan, currentRate, floatingRate, 3).savings,
  });

  // Sort by 2-year savings descending (best first)
  return scenarios.sort((a, b) => b.savingsTwoYear - a.savingsTwoYear);
}
