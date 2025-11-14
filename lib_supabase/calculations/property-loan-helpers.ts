// ABOUTME: Pure calculation functions for property loan max amount and personalized caveats
// ABOUTME: Uses Dr Elena v2 rules from dr-elena-mortgage-expert-v2.json

/**
 * Calculate maximum loan amount based on property price and LTV limits
 * @param propertyPrice - Property value
 * @param isSecondHome - Whether keeping current property (second home)
 * @returns Max loan amount (75% first home, 45% second home)
 */
export function calculateMaxLoan(propertyPrice: number, isSecondHome: boolean): number {
  const ltv = isSecondHome ? 0.45 : 0.75;
  return Math.floor(propertyPrice * ltv);
}

/**
 * Get maximum loan tenure for property type from Dr Elena v2 rules
 * Based on 75% LTV (base tier) - NOT 55% LTV reduced tier
 *
 * Dr Elena v2 Rule: "Apply reduced LTV tier if (HDB tenure > 25y) OR (non-HDB tenure > 30y)"
 *
 * For 75% LTV (what we show):
 * - HDB: Max 25 years
 * - Private/EC/Landed/Commercial: Max 30 years
 *
 * @param propertyType - Property type code
 * @returns Max tenure in years for 75% LTV
 */
export function getPropertyTenureLimit(propertyType: string): number {
  const tenureLimits: Record<string, number> = {
    'hdb-resale': 25,        // 75% LTV cap
    'hdb-new': 25,           // 75% LTV cap
    'ec-resale': 30,         // 75% LTV cap (CORRECTED from 35)
    'ec-new': 30,            // 75% LTV cap (CORRECTED from 35)
    'private-resale': 30,    // 75% LTV cap (CORRECTED from 35)
    'private-new': 30,       // 75% LTV cap (CORRECTED from 35)
    'private-uc': 30,        // 75% LTV cap (CORRECTED from 35)
    'landed-resale': 30,     // 75% LTV cap (CORRECTED from 35)
    'landed-new': 30,        // 75% LTV cap (CORRECTED from 35)
    'commercial': 30         // 75% LTV cap (CORRECTED from 35)
  };
  return tenureLimits[propertyType] || 30;
}

/**
 * Calculate maximum tenure based on age and property limits
 * @param combinedAge - Borrower age (or combined age for joint)
 * @param propertyType - Property type code
 * @returns Min(age limit, property limit) in years
 */
export function calculateMaxTenure(combinedAge: number, propertyType: string): number {
  const ageLimit = 65 - combinedAge;
  const propertyLimit = getPropertyTenureLimit(propertyType);
  return Math.min(ageLimit, propertyLimit);
}

/**
 * Generate user-friendly tenure message explaining the limit
 * Shows both property cap and age limit for transparency
 * @param maxTenure - Calculated max tenure
 * @param ageLimit - Age-based limit (65 - age)
 * @param propertyLimit - Property type limit
 * @param propertyType - Property type code
 * @param combinedAge - Borrower age
 * @returns User-friendly message showing both limits
 */
export function getTenureMessage(
  maxTenure: number,
  ageLimit: number,
  propertyLimit: number,
  propertyType: string,
  combinedAge: number
): string {
  const endAge = combinedAge + maxTenure;
  const isHDB = propertyType.startsWith('hdb');
  const propertyName = isHDB ? 'HDB' : 'private property';

  // Both limits equal (age perfectly aligns with property cap)
  if (ageLimit === propertyLimit) {
    return `Max tenure: ${maxTenure} years (${propertyName} cap ${propertyLimit}y, age limit ${ageLimit}y)`;
  }

  // Age is more restrictive (hits retirement age before property cap)
  if (ageLimit < propertyLimit) {
    return `Max tenure: ${maxTenure} years (age limit, ends at ${endAge}; ${propertyName} cap ${propertyLimit}y)`;
  }

  // Property is more restrictive (property type caps tenure before age limit)
  return `Max tenure: ${maxTenure} years (${propertyName} cap ${propertyLimit}y; age allows ${ageLimit}y)`;
}

/**
 * Generate complete calculation result with personalized caveats
 * @param propertyPrice - Property value
 * @param propertyCategory - Category (new-launch, resale, under-construction, commercial)
 * @param propertyType - Specific type code
 * @param combinedAge - Borrower age
 * @param isSecondHome - Whether keeping current property
 * @returns Object with maxLoan and caveats array
 */
export function generatePropertyCaveats(
  propertyPrice: number,
  propertyCategory: string,
  propertyType: string,
  combinedAge: number,
  isSecondHome: boolean
): { maxLoan: number; caveats: string[] } {
  // 1. Calculate LTV-based max loan
  const maxLoan = calculateMaxLoan(propertyPrice, isSecondHome);

  // 2. Calculate max tenure
  const ageLimit = 65 - combinedAge;
  const propertyLimit = getPropertyTenureLimit(propertyType);
  const maxTenure = Math.min(ageLimit, propertyLimit);

  // 3. Generate caveats
  const caveats: string[] = [];

  // CPF usage
  if (propertyType === 'commercial') {
    caveats.push('⚠️ Cannot use CPF (cash only for down payment)');
  } else {
    caveats.push('Can use CPF for down payment');
  }

  // Tenure message
  const tenureMessage = getTenureMessage(
    maxTenure,
    ageLimit,
    propertyLimit,
    propertyType,
    combinedAge
  );
  caveats.push(tenureMessage);

  // Property-specific warnings
  if (propertyType === 'hdb-resale' || propertyType === 'hdb-new') {
    caveats.push('Income cap applies (MSR 30% + TDSR 55%)');
  }

  if (propertyType === 'commercial') {
    caveats.push('Higher interest floor (5% vs 4%)');
  }

  if (propertyType === 'ec-new') {
    caveats.push('Income cap applies if buying from developer');
  }

  return { maxLoan, caveats };
}
