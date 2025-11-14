// ABOUTME: Calculator functions aligned with Dr Elena v2 mortgage expert persona
// ABOUTME: Source: dr-elena-mortgage-expert-v2.json computational_modules

import {
  DR_ELENA_ABSD_RATES,
  DR_ELENA_CPF_USAGE_RULES,
  DR_ELENA_INCOME_RECOGNITION,
  DR_ELENA_LTV_LIMITS,
  DR_ELENA_POLICY_REFERENCES,
  DR_ELENA_STRESS_TEST_FLOORS
} from './dr-elena-constants';
import type { SavingsScenario } from './refinance-savings';
import type { MarketRateSnapshot } from '../types/market-rates';
import { generateSavingsScenarios } from './refinance-savings';

export interface InstantProfileInput {
  property_price: number;
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial';
  buyer_profile: 'SC' | 'PR' | 'Foreigner';
  existing_properties: number;

  // Income (backwards compatible)
  income: number;  // Total recognized income
  incomes?: number[];  // Individual applicant incomes for IWAA calculation (optional)

  commitments: number;
  rate: number;
  tenure: number;

  // Age (backwards compatible)
  age: number;  // Primary applicant age (or single applicant)
  ages?: number[];  // Individual applicant ages for IWAA calculation (optional)

  loan_type?: 'new_purchase' | 'refinance';
  is_owner_occupied?: boolean;
}

export type TenureCapSource = 'regulation' | 'age';

export interface InstantProfileResult {
  maxLoan: number;
  maxLTV: number;
  minCashPercent: number;
  absdRate: number;
  tdsrAvailable: number;
  limitingFactor: 'TDSR' | 'MSR' | 'LTV';
  msrLimit?: number;
  downpaymentRequired: number;
  cpfAllowed: boolean;
  cpfAllowedAmount: number;
  tenureCapYears: number;
  tenureCapSource: TenureCapSource;
  reasonCodes: string[];
  policyRefs: string[];
  stressRateApplied: number;
  ltvCapApplied: number;
  cpfWithdrawalLimit: number;
}

export interface ComplianceSnapshotInput {
  income?: number;
  employment_type?: 'employed' | 'self_employed' | 'variable_income' | 'not_working';
  gross_income?: number;
  commitments: number;
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial';
  loan_amount: number;
  rate: number;
  tenure: number;
  recognizedIncome?: number;
}

export interface ComplianceSnapshotResult {
  recognizedIncome: number;
  tdsrLimit: number;
  tdsrRatio: number;
  isTDSRCompliant: boolean;
  msrLimit?: number;
  msrRatio?: number;
  isMSRCompliant?: boolean;
  limitingFactor?: 'TDSR' | 'MSR' | 'LTV';
  reasonCodes: string[];
  policyRefs: string[];
  stressRateApplied: number;
}

export interface RefinanceOutlookInput {
  property_value?: number;
  current_balance?: number;
  current_rate?: number;
  months_remaining?: number;
  property_type?: 'HDB' | 'Private' | 'EC' | 'Commercial';
  is_owner_occupied?: boolean;
  objective?: 'lower_payment' | 'shorten_tenure' | 'rate_certainty' | 'cash_out';
  cpf_used?: number;
  outstanding_loan?: number;
  property_age?: number;
  rental_income?: number;
  target_rate_override?: number;
}

export interface RefinanceOutlookResult {
  projectedMonthlySavings?: number;
  currentMonthlyPayment?: number;
  maxCashOut: number;
  timingGuidance: string;
  recommendations: string[];
  reasonCodes: string[];
  policyRefs: string[];
  ltvCapApplied: number;
  cpfRedemptionAmount: number;
  savingsScenarios?: SavingsScenario[];
}

/**
 * Calculate instant profile including LTV, TDSR, MSR, and down payment analysis
 * Aligned with Dr Elena v2 persona computational modules
 */
const COMMERCIAL_LTV_CAP = 0.6;
const COMMERCIAL_MIN_CASH_PERCENT = 25;

export function calculateInstantProfile(
  inputs: InstantProfileInput,
  ltvMode: number = 75
): InstantProfileResult {
  const {
    property_price,
    property_type,
    buyer_profile,
    existing_properties,
    income,
    incomes,  // For IWAA calculation
    commitments,
    rate,
    tenure,
    age,
    ages,  // For IWAA calculation
    loan_type = 'new_purchase'
  } = inputs;

  const isCommercial = property_type === 'Commercial';
  const stressFloor = isCommercial
    ? DR_ELENA_STRESS_TEST_FLOORS.nonResidential
    : DR_ELENA_STRESS_TEST_FLOORS.residential;
  const quotedRate = rate / 100;
  const stressRateApplied = Math.max(stressFloor, quotedRate);
  const monthlyStressRate = stressRateApplied / 12;
  const numberOfPayments = tenure * 12;

  const tdsrAvailableBase = Math.max(calculateTDSRAvailable(income, commitments), 0);

  const loanTier = existing_properties === 0
    ? DR_ELENA_LTV_LIMITS.firstLoan
    : existing_properties === 1
      ? DR_ELENA_LTV_LIMITS.secondLoan
      : DR_ELENA_LTV_LIMITS.thirdPlusLoan;

  const tenureTriggerThreshold = property_type === 'HDB' ? 25 : 30;
  const reducedLtvTriggered = !isCommercial && (tenure > tenureTriggerThreshold || age + tenure > 65);

  const personaLtvPercent = (() => {
    if (isCommercial) {
      return COMMERCIAL_LTV_CAP * 100;
    }
    if (existing_properties === 0) {
      return reducedLtvTriggered ? loanTier.max_ltv_reduced : loanTier.max_ltv_base;
    }
    if (loanTier.max_ltv_reduced !== undefined && reducedLtvTriggered) {
      return loanTier.max_ltv_reduced;
    }
    return loanTier.max_ltv_base;
  })();

  const ltvCapPercent = Math.min(personaLtvPercent, ltvMode);
  const ltvCapApplied = ltvCapPercent / 100;
  const maxLoanByLTV = roundLoanEligibility(property_price * ltvCapApplied);

  const computeLoanFromPayment = (monthlyAmount: number): number => {
    if (monthlyAmount <= 0) {
      return 0;
    }
    if (monthlyStressRate === 0) {
      return roundLoanEligibility(monthlyAmount * numberOfPayments);
    }
    const numerator = Math.pow(1 + monthlyStressRate, numberOfPayments) - 1;
    const denominator = monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments);
    return roundLoanEligibility(monthlyAmount * (numerator / denominator));
  };

  const maxLoanByIncome = computeLoanFromPayment(tdsrAvailableBase);

  const requiresMSR = property_type === 'HDB' || property_type === 'EC';
  const msrLimit = requiresMSR ? calculateMSRLimit(income) : undefined;
  const maxLoanByMSR = msrLimit !== undefined ? computeLoanFromPayment(msrLimit) : undefined;

  let maxLoan = maxLoanByLTV;
  let limitingFactor: 'LTV' | 'TDSR' | 'MSR' = 'LTV';

  // Option B: Prioritize breach detection over mathematical limiting
  // If TDSR is breached (available headroom <= 0 or very low), flag as TDSR limiting
  if (tdsrAvailableBase <= 100) {
    // TDSR breach detected - this is a rejection scenario
    limitingFactor = 'TDSR';
  }

  if (maxLoanByIncome > 0 && maxLoanByIncome < maxLoan) {
    maxLoan = maxLoanByIncome;
    limitingFactor = 'TDSR';
  }

  if (maxLoanByMSR !== undefined && maxLoanByMSR > 0) {
    const msrOverridesLtv = requiresMSR &&
      limitingFactor === 'LTV' &&
      maxLoanByMSR >= maxLoan &&
      maxLoanByMSR <= maxLoanByLTV * 1.01;

    if (maxLoanByMSR < maxLoan || msrOverridesLtv) {
      maxLoan = maxLoanByMSR;
      limitingFactor = 'MSR';
    }
  }

  maxLoan = Math.max(maxLoan, 0);

  const minCashPercent = (() => {
    if (isCommercial) {
      return COMMERCIAL_MIN_CASH_PERCENT;
    }
    if (property_type === 'HDB' && existing_properties === 0) {
      return 0;
    }
    if (existing_properties === 0) {
      // First loan has both min_cash_base and min_cash_reduced
      const firstLoan = loanTier as typeof DR_ELENA_LTV_LIMITS.firstLoan;
      return reducedLtvTriggered ? firstLoan.min_cash_reduced : firstLoan.min_cash_base;
    }
    // Second and third+ loans only have min_cash
    const otherLoan = loanTier as typeof DR_ELENA_LTV_LIMITS.secondLoan | typeof DR_ELENA_LTV_LIMITS.thirdPlusLoan;
    return otherLoan.min_cash ?? 25;
  })();

  const downpaymentRequired = roundFundsRequired(Math.max(property_price - maxLoan, 0));
  const minCashAmount = roundFundsRequired(property_price * (minCashPercent / 100));

  const cpfWithdrawalLimit = Math.round(
    property_price * (DR_ELENA_CPF_USAGE_RULES.withdrawalLimitPercent / 100)
  );

  const cpfAllowed = !isCommercial && buyer_profile !== 'Foreigner';
  const cpfAllowancePool = Math.max(downpaymentRequired - minCashAmount, 0);
  const cpfAllowedAmount = cpfAllowed
    ? Math.min(cpfAllowancePool, cpfWithdrawalLimit)
    : 0;

  const absdRate = (() => {
    if (loan_type !== 'new_purchase') {
      return 0;
    }
    if (buyer_profile === 'SC') {
      if (existing_properties === 0) {
        return DR_ELENA_ABSD_RATES.singleBuyers.singaporeCitizen.firstProperty;
      }
      if (existing_properties === 1) {
        return DR_ELENA_ABSD_RATES.singleBuyers.singaporeCitizen.secondProperty;
      }
      return DR_ELENA_ABSD_RATES.singleBuyers.singaporeCitizen.thirdPlus;
    }
    if (buyer_profile === 'PR') {
      if (existing_properties === 0) {
        return DR_ELENA_ABSD_RATES.singleBuyers.permanentResident.firstProperty;
      }
      if (existing_properties === 1) {
        return DR_ELENA_ABSD_RATES.singleBuyers.permanentResident.secondProperty;
      }
      return DR_ELENA_ABSD_RATES.singleBuyers.permanentResident.thirdPlus;
    }
    return DR_ELENA_ABSD_RATES.singleBuyers.foreigner.allProperties;
  })();

  // ========================================================================
  // TENURE CALCULATION - Dr Elena v2 Compliance
  // ========================================================================
  //
  // Singapore MAS regulations cap loan tenure based on:
  // 1. Borrower age: Older borrowers get shorter tenure
  // 2. Property type: HDB/EC/Private/Commercial have different caps
  // 3. LTV tier: 55% LTV gets extended tenure vs 75% LTV
  //
  // For joint applicants, use IWAA (Income-Weighted Average Age):
  //   IWAA = (Age1 × Income1 + Age2 × Income2) / (Income1 + Income2)
  //   Round UP to nearest integer (Math.ceil)
  //
  // Dr Elena v2 References:
  // - IWAA formula: dr-elena-mortgage-expert-v2.json lines 164-168
  // - HDB tenure rules: lines 633-642
  // - EC tenure rules: lines 664-674
  // - Private tenure rules: lines 681-690
  // - Commercial tenure rules: lines 703-712
  //
  // Key Rules:
  // - HDB 75% LTV: MIN(65 - IWAA, 25 years)
  // - HDB 55% LTV: MIN(75 - IWAA, 30 years) ← Extended!
  // - EC/Private/Landed 75% LTV: MIN(65 - IWAA, 30 years)
  // - EC/Private/Landed 55% LTV: MIN(65 - IWAA, 35 years) ← Extended!
  // - Commercial 75% LTV: MIN(65 - IWAA, 30 years)
  // - Commercial 55% LTV: MIN(65 - IWAA, 35 years) ← Extended!
  //
  // Updated: 2025-10-26 to fix IWAA and extended tenure bugs
  // ========================================================================

  // IWAA Calculation (Dr Elena v2 line 164-168)
  // If ages/incomes arrays provided, calculate Income-Weighted Average Age
  // Otherwise, fall back to single age (backwards compatibility)
  const effectiveAge = (ages && incomes && ages.length > 0 && incomes.length > 0)
    ? calculateIWAA(ages, incomes)
    : age;

  // Dr Elena v2: Property-specific tenure rules (lines 630-735)
  // Different formulas for 75% LTV (base) vs 55% LTV (extended)
  let regulatoryTenureCap: number;
  let ageLimitBase: number;

  if (property_type === 'HDB') {
    if (ltvMode === 55) {
      // HDB 55% LTV Extended: MIN(75 - IWAA, 30) [line 638-640]
      regulatoryTenureCap = 30;
      ageLimitBase = 75;
    } else {
      // HDB 75% LTV: MIN(65 - IWAA, 25) [line 634-636]
      regulatoryTenureCap = 25;
      ageLimitBase = 65;
    }
  } else if (property_type === 'EC') {
    if (ltvMode === 55) {
      // EC 55% LTV Extended: MIN(65 - IWAA, 35) [line 670-672]
      regulatoryTenureCap = 35;
      ageLimitBase = 65;
    } else {
      // EC 75% LTV: MIN(65 - IWAA, 30) [line 665-667]
      regulatoryTenureCap = 30;
      ageLimitBase = 65;
    }
  } else if (property_type === 'Private') {
    if (ltvMode === 55) {
      // Private 55% LTV Extended: MIN(65 - IWAA, 35) [line 687-689]
      regulatoryTenureCap = 35;
      ageLimitBase = 65;
    } else {
      // Private 75% LTV: MIN(65 - IWAA, 30) [line 682-684]
      regulatoryTenureCap = 30;
      ageLimitBase = 65;
    }
  } else if (property_type === 'Commercial') {
    if (ltvMode === 55) {
      // Commercial 55% LTV Extended: MIN(65 - IWAA, 35) [line 709-711]
      regulatoryTenureCap = 35;
      ageLimitBase = 65;
    } else {
      // Commercial 75% LTV: MIN(65 - IWAA, 30) [line 704-706]
      regulatoryTenureCap = 30;
      ageLimitBase = 65;
    }
  } else {
    // Fallback (shouldn't happen)
    regulatoryTenureCap = 30;
    ageLimitBase = 65;
  }

  // Apply age-based cap
  // Standard formula: 65 - effectiveAge
  // Extended formula (HDB 55% only): 75 - effectiveAge
  const ageBasedCap = Math.max(ageLimitBase - effectiveAge, 1);

  // Take minimum of regulatory cap and age-based cap
  const tenureCapYears = Math.max(1, Math.min(regulatoryTenureCap, ageBasedCap));
  const tenureCapSource: TenureCapSource = ageBasedCap < regulatoryTenureCap ? 'age' : 'regulation';

  const reasonCodeSet = new Set<string>();
  const policyRefSet = new Set<string>();

  policyRefSet.add(DR_ELENA_POLICY_REFERENCES.tdsr);
  if (requiresMSR) {
    policyRefSet.add(DR_ELENA_POLICY_REFERENCES.msr);
  }

  const tenurePolicyRef = property_type === 'HDB' || property_type === 'EC'
    ? 'mas_tenure_cap_hdb'
    : isCommercial
      ? 'mas_tenure_cap_commercial'
      : 'mas_tenure_cap_private';
  policyRefSet.add(tenurePolicyRef);

  switch (limitingFactor) {
    case 'LTV':
      reasonCodeSet.add('ltv_binding');
      if (existing_properties === 0) {
        reasonCodeSet.add('ltv_first_loan');
      } else if (existing_properties === 1) {
        reasonCodeSet.add('ltv_second_loan');
      } else {
        reasonCodeSet.add('ltv_third_loan');
      }
      break;
    case 'TDSR':
      reasonCodeSet.add('tdsr_binding');
      break;
    case 'MSR':
      reasonCodeSet.add('msr_binding');
      break;
  }

  if (reducedLtvTriggered && !isCommercial) {
    reasonCodeSet.add('ltv_reduced_age_trigger');
  }

  if (!cpfAllowed) {
    reasonCodeSet.add('cpf_not_allowed');
  }

  if (stressRateApplied > stressFloor) {
    reasonCodeSet.add('stress_rate_quoted_applied');
  }

  if (tenureCapSource === 'age') {
    reasonCodeSet.add('tenure_cap_age_limit');
  } else if (requiresMSR) {
    reasonCodeSet.add('tenure_cap_property_limit');
  } else {
    reasonCodeSet.add('tenure_cap_standard_limit');
  }

  if (absdRate > 0) {
    reasonCodeSet.add('absd_applies');
    policyRefSet.add('IRAS ABSD Rates');
  }

  if (cpfAllowedAmount > 0) {
    policyRefSet.add(DR_ELENA_POLICY_REFERENCES.cpfAccruedInterest);
  }

  if (!cpfAllowed) {
    policyRefSet.add(DR_ELENA_POLICY_REFERENCES.saleProceedsOrder);
  }

  return {
    maxLoan,
    maxLTV: ltvCapPercent,
    minCashPercent,
    absdRate,
    tdsrAvailable: tdsrAvailableBase,
    limitingFactor,
    msrLimit,
    downpaymentRequired,
    cpfAllowed,
    cpfAllowedAmount,
    tenureCapYears,
    tenureCapSource,
    reasonCodes: Array.from(reasonCodeSet),
    policyRefs: Array.from(policyRefSet),
    stressRateApplied,
    ltvCapApplied,
    cpfWithdrawalLimit
  };
}

/**
 * Calculate compliance snapshot including TDSR and MSR analysis
 * Aligned with Dr Elena v2 persona core formulas and income recognition
 */
export function calculateComplianceSnapshot(
  inputs: ComplianceSnapshotInput
): ComplianceSnapshotResult {
  const {
    income,
    employment_type = 'employed',
    gross_income,
    commitments,
    property_type,
    loan_amount,
    rate,
    tenure
  } = inputs;

  // Calculate recognized income based on employment type
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.income_recognition
  let recognizedIncome: number;
  if (income) {
    recognizedIncome = income; // Already recognized income provided
  } else if (gross_income) {
    recognizedIncome = calculateRecognizedIncome(employment_type, gross_income);
  } else {
    recognizedIncome = 0;
  }

  // Calculate TDSR compliance
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.tdsr_available
  const tdsrLimit = Math.round(recognizedIncome * 0.55 - commitments); // Round to handle floating point precision
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = tenure * 12;
  const monthlyPayment = roundMonthlyPayment(
    loan_amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
  const tdsrRatio = recognizedIncome > 0 ? Math.round((monthlyPayment / recognizedIncome) * 100) : 0;
  const isTDSRCompliant = monthlyPayment <= tdsrLimit;

  // Calculate MSR compliance for HDB/EC properties
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.msr_limit
  let msrLimit: number | undefined;
  let msrRatio: number | undefined;
  let isMSRCompliant: boolean | undefined;
  
  if (property_type === 'HDB' || property_type === 'EC') {
    msrLimit = Math.round(recognizedIncome * 0.30); // Don't round MSR limit for calculation
    // msrRatio calculated after stress test payment (see below)
    // isMSRCompliant calculated after stress test payment (see below)
  }

  // Use stress test rate (4% for residential, 5% for commercial) as per MAS requirements
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.tdsr_available
  const stressFloor = property_type === 'Commercial' 
    ? DR_ELENA_STRESS_TEST_FLOORS.nonResidential
    : DR_ELENA_STRESS_TEST_FLOORS.residential;
  
  // Apply Math.max(quoted_rate / 100, stress_floor) logic per persona
  const quotedRate = rate / 100;
  const stressRateApplied = Math.max(quotedRate, stressFloor);
  const monthlyStressRate = stressRateApplied / 12;
  
  // Recalculate monthly payment with stress test rate for compliance checking
  const stressTestMonthlyPayment = roundMonthlyPayment(
    loan_amount * monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments) / 
    (Math.pow(1 + monthlyStressRate, numberOfPayments) - 1)
  );
  
  const isTDSRCompliantWithStressTest = stressTestMonthlyPayment <= tdsrLimit;
  
  // Calculate MSR ratio and compliance using stress test payment for HDB/EC
  if ((property_type === 'HDB' || property_type === 'EC') && msrLimit !== undefined) {
    msrRatio = recognizedIncome > 0 ? Math.round((stressTestMonthlyPayment / recognizedIncome) * 100) : 0;
    isMSRCompliant = stressTestMonthlyPayment <= msrLimit;
  }
  
  // Determine limiting factor using stress test rate
  // MSR is more restrictive if the stress test payment exceeds MSR limit
  let limitingFactor: 'TDSR' | 'MSR' | 'LTV' | undefined;
  if (!isTDSRCompliantWithStressTest) {
    limitingFactor = 'TDSR';
  } else if (isMSRCompliant === false && msrLimit && stressTestMonthlyPayment > msrLimit) {
    limitingFactor = 'MSR';
  } else if (property_type === 'HDB' || property_type === 'EC') {
    // For HDB/EC, if both TDSR and MSR合规, check which is more restrictive
    const tdsrHeadroom = tdsrLimit - stressTestMonthlyPayment;
    const msrHeadroom = (msrLimit || 0) - stressTestMonthlyPayment;
    limitingFactor = msrHeadroom < tdsrHeadroom ? 'MSR' : 'TDSR';
  } else {
    limitingFactor = 'TDSR';
  }
  
  // Generate reason codes and policy references
  const reasonCodes: string[] = [];
  const policyRefs: string[] = [];

  // Policy references conditional on property type:
  // - HDB/EC: Include BOTH MAS 645 (TDSR) AND MAS 632 (MSR)
  // - Private/Commercial: Include ONLY MAS 645 (TDSR)
  policyRefs.push('MAS Notice 645'); // TDSR applies to all
  
  // Only add MSR policy reference for HDB/EC properties
  if (property_type === 'HDB' || property_type === 'EC') {
    policyRefs.push('MAS Notice 632'); // MSR applies to HDB/EC
  }
  
  // Add specific MSR flag for HDB/EC where MSR actively applies
  if (property_type === 'HDB' || property_type === 'EC') {
    reasonCodes.push('MSR_applied');
  }
  if (property_type === 'HDB') {
    reasonCodes.push('HDB_property');
  }
  
  if (!isTDSRCompliantWithStressTest) {
    reasonCodes.push('TDSR_EXCEEDED');
  }
  if (isMSRCompliant === false) {
    reasonCodes.push('MSR_EXCEEDED');
  }
  if (property_type === 'Commercial' && !isTDSRCompliantWithStressTest) {
    reasonCodes.push('stress_test_commercial');
  }
  if (employment_type === 'self_employed' || employment_type === 'variable_income') {
    reasonCodes.push('VARIABLE_INCOME_RECOGNITION');
    policyRefs.push('MAS Income Recognition Guidelines');
  }
  if (limitingFactor) {
    reasonCodes.push('COMPLIANCE_LIMITED');
  }

  return {
    recognizedIncome,
    tdsrLimit,
    tdsrRatio: recognizedIncome > 0 ? Math.round((stressTestMonthlyPayment / recognizedIncome) * 100) : 0,
    isTDSRCompliant,
    msrLimit,
    msrRatio,
    isMSRCompliant,
    limitingFactor,
    reasonCodes,
    policyRefs,
    stressRateApplied
  };
}

/**
 * Calculate refinance outlook including cash-out potential and timing guidance
 * Aligned with Dr Elena v2persona specialized calculators
 */
export function calculateRefinanceOutlook(
  inputs: RefinanceOutlookInput,
  options?: {
    includeSavingsScenarios?: boolean;
    marketRates?: MarketRateSnapshot;
  }
): RefinanceOutlookResult {
  const {
    property_value,
    current_balance = 0,
    current_rate = 0,
    months_remaining = 0,
    property_type = 'Private',
    is_owner_occupied = true,
    objective = 'lower_payment',
    cpf_used = 0,
    outstanding_loan,
    property_age,
    rental_income = 0,
    target_rate_override
  } = inputs;

  const activeLoanBalance = outstanding_loan ?? current_balance;
  const valuation = property_value ?? (activeLoanBalance > 0 ? activeLoanBalance / 0.75 : 0);
  const targetRate = target_rate_override ?? (property_type === 'Commercial' ? 3.3 : 2.8);

  const reasonCodeSet = new Set<string>();
  const policyRefSet = new Set<string>(['MAS Notice 645', 'MAS Notice 632']);
  const recommendationSet = new Set<string>();

  const monthsRemaining = months_remaining ?? 0;
  const totalPayments = monthsRemaining > 0 ? monthsRemaining : 25 * 12;
  const effectiveBalance = activeLoanBalance > 0 ? activeLoanBalance : 0;

  // If current_rate not provided, estimate using a conservative rate (3.5% for residential, 4.0% for commercial)
  // This allows savings calculations to work even when user hasn't provided exact current rate
  const effectiveCurrentRate = current_rate > 0
    ? current_rate
    : (property_type === 'Commercial' ? 4.0 : 3.5);

  if (current_rate === 0 && effectiveBalance > 0) {
    reasonCodeSet.add('current_rate_estimated');
  }

  const currentMonthlyPayment = effectiveBalance > 0
    ? roundMonthlyPayment(
        effectiveBalance * ((effectiveCurrentRate / 100 / 12) * Math.pow(1 + effectiveCurrentRate / 100 / 12, totalPayments)) /
        (Math.pow(1 + effectiveCurrentRate / 100 / 12, totalPayments) - 1)
      )
    : undefined;

  const targetMonthlyPayment = effectiveBalance > 0
    ? roundMonthlyPayment(
        effectiveBalance * ((targetRate / 100 / 12) * Math.pow(1 + targetRate / 100 / 12, totalPayments)) /
        (Math.pow(1 + targetRate / 100 / 12, totalPayments) - 1)
      )
    : undefined;

  let projectedMonthlySavings: number | undefined;
  if (currentMonthlyPayment !== undefined && targetMonthlyPayment !== undefined) {
    projectedMonthlySavings = currentMonthlyPayment - targetMonthlyPayment;
    if (projectedMonthlySavings > 0) {
      reasonCodeSet.add('rate_differential_savings');
    }
  }

  // Objective-specific adjustments
  if (objective === 'lower_payment') {
    recommendationSet.add('lower_payment_strategy');
  }

  if (objective === 'shorten_tenure' && effectiveBalance > 0) {
    const reducedPayments = Math.max(12, totalPayments - 60);
    const acceleratedPayment = roundMonthlyPayment(
      effectiveBalance * ((targetRate / 100 / 12) * Math.pow(1 + targetRate / 100 / 12, reducedPayments)) /
      (Math.pow(1 + targetRate / 100 / 12, reducedPayments) - 1)
    );
    if (currentMonthlyPayment !== undefined) {
      projectedMonthlySavings = currentMonthlyPayment - acceleratedPayment;
    }
    recommendationSet.add('tenure_reduction_strategy');
    if (projectedMonthlySavings !== undefined && projectedMonthlySavings < 0) {
      recommendationSet.add('higher_payment_shorter_tenure');
    }
  }

  if (objective === 'rate_certainty') {
    recommendationSet.add('rate_certainty_benefits');
    reasonCodeSet.add('rate_certainty_analysis');
  }

  // LTV caps for refinance
  let ltvCap = 0;
  if (property_type === 'Private') {
    ltvCap = is_owner_occupied ? 0.75 : 0.7;
  } else if (property_type === 'EC') {
    ltvCap = 0.75;
  } else if (property_type === 'Commercial') {
    ltvCap = 0.6;
  } else {
    ltvCap = 0; // HDB cash-out not permitted
  }

  const yearsHeld = property_age !== undefined ? Math.max(property_age, 1) : 5;
  const monthsHeld = yearsHeld * 12;
  const cpfAccruedInterest = cpf_used > 0
    ? Math.round(cpf_used * (Math.pow(1 + 0.025/12, monthsHeld) - 1))
    : 0;
  const cpfRedemptionAmount = cpf_used > 0 ? cpf_used + cpfAccruedInterest : 0;
  if (cpf_used > 0) {
    reasonCodeSet.add('cpf_accrued_interest_considered');
    policyRefSet.add('cpf_accrued_interest');
  }
  if (property_age !== undefined) {
    reasonCodeSet.add('post_2002_cpf_order');
    policyRefSet.add('sale_proceeds_order');
  }

  let maxCashOut = 0;
  if (valuation > 0 && effectiveBalance >= 0) {
    const allowableLoan = roundLoanEligibility(valuation * ltvCap);
    const rawCash = allowableLoan - effectiveBalance;
    if (property_type === 'Private' && rawCash > 0) {
      maxCashOut = roundFundsRequired(rawCash);
      reasonCodeSet.add('private_property_cash_out_allowed');
      policyRefSet.add('charges_priority');
    }

    if (property_type === 'HDB' || property_type === 'EC') {
      maxCashOut = 0;
      reasonCodeSet.add('hdb_cash_out_not_allowed');
    }

    if (property_type === 'Commercial') {
      reasonCodeSet.add('cpf_not_allowed_commercial');
    }

    if (rawCash <= 0) {
      reasonCodeSet.add('high_ltv_no_cash_out');
    }

    if (valuation > 0 && effectiveBalance > valuation) {
      reasonCodeSet.add('negative_equity_no_refinance');
      maxCashOut = 0;
    }

    if (effectiveBalance === 0 && property_type === 'Private') {
      reasonCodeSet.add('fully_paid_property');
      if (allowableLoan > cpfRedemptionAmount) {
        maxCashOut = roundFundsRequired(allowableLoan - cpfRedemptionAmount);
        policyRefSet.add('charges_priority');
      }
    }
  }

  if (!is_owner_occupied && property_type === 'Private') {
    reasonCodeSet.add('investment_property_rules');
    reasonCodeSet.add('rental_income_consideration');
    if (rental_income > 0) {
      reasonCodeSet.add('rental_income_recognised');
    }
  }

  // Timing guidance and associated recommendations
  let timingGuidance: string;
  if (monthsRemaining <= 0) {
    timingGuidance = 'Refinance window is open now – immediate action recommended';
    recommendationSet.add('urgent_referral');
    reasonCodeSet.add('timing_immediate_window');
  } else if (monthsRemaining <= 3) {
    timingGuidance = 'Lock-in expiry is imminent; immediate refinance review advised';
    timingGuidance += ' (immediate)';
    recommendationSet.add('urgent_referral');
    reasonCodeSet.add('timing_immediate_window');
  } else if (monthsRemaining <= 6) {
    timingGuidance = `Start paperwork now (${monthsRemaining} months left) to secure offers`;
    reasonCodeSet.add('timing_critical_window');
  } else if (monthsRemaining <= 18) {
    timingGuidance = `Monitor packages and prepare documentation with about ${monthsRemaining} months remaining`;
    recommendationSet.add('monitor_rates');
    reasonCodeSet.add('timing_planning_window');
  } else {
    timingGuidance = 'Wait until penalty period ends (penalty consideration) for optimal savings';
    recommendationSet.add('monitor_rates');
    reasonCodeSet.add('timing_long_window');
  }

  if (objective === 'rate_certainty') {
    timingGuidance += ' – lock_in_advantage available when switching early';
  }

  if (objective === 'cash_out' && maxCashOut > 0) {
    recommendationSet.add('cash_out_equity_utilization');
  }

  if (recommendationSet.size === 0) {
    recommendationSet.add('review_recommended');
  }

  reasonCodeSet.add('mas_compliant_calculation');


  // Generate savings scenarios if requested
  let savingsScenarios: SavingsScenario[] | undefined;
  if (options?.includeSavingsScenarios && options?.marketRates && effectiveBalance > 0) {
    savingsScenarios = generateSavingsScenarios(
      effectiveBalance,
      effectiveCurrentRate / 100, // Convert percentage to decimal
      options.marketRates
    );
  }

  return {
    projectedMonthlySavings,
    currentMonthlyPayment,
    maxCashOut,
    timingGuidance,
    recommendations: Array.from(recommendationSet),
    reasonCodes: Array.from(reasonCodeSet),
    policyRefs: Array.from(policyRefSet),
    ltvCapApplied: Math.round(ltvCap * 100),
    cpfRedemptionAmount,
    savingsScenarios
  };
}

/**
 * Helper function for loan eligibility rounding (ROUND DOWN to nearest thousand)
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.rounding_rules.loan_eligibility
 */
export function roundLoanEligibility(amount: number): number {
  return Math.floor(amount / 1000) * 1000;
}

/**
 * Helper function for funds required rounding (ROUND UP to nearest thousand)
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.rounding_rules.funds_required
 */
export function roundFundsRequired(amount: number): number {
  return Math.ceil(amount / 1000) * 1000;
}

/**
 * Helper function for monthly payment rounding (ROUND UP to nearest dollar)
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.rounding_rules.monthly_payments
 */
export function roundMonthlyPayment(amount: number): number {
  return Math.ceil(amount);
}

/**
 * Calculate recognized income based on employment type
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.income_recognition
 */
export function calculateRecognizedIncome(
  employmentType: string,
  grossIncome: number
): number {
  const recognitionRates = {
    'employed': 1.0,
    'self_employed': 0.7,
    'variable_income': 0.7,
    'rental_income': 0.7,
    'not_working': 0,
    'other': 1.0
  };

  const rate = recognitionRates[employmentType as keyof typeof recognitionRates] || 1.0;
  return Math.floor(grossIncome * rate);
}

/**
 * Calculate TDSR available amount
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.tdsr_available
 */
export function calculateTDSRAvailable(income: number, commitments: number): number {
  return Math.floor((income * 0.55) - commitments);
}

/**
 * Calculate MSR limit for HDB/EC properties
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.msr_limit
 */
export function calculateMSRLimit(income: number): number {
  return Math.floor(income * 0.30);
}

/**
 * Calculate monthly credit card commitment
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.commitment_calculations.credit_cards
 */
export function calculateCreditCardCommitment(outstandingBalance: number): number {
  return Math.max(outstandingBalance * 0.03, 50);
}

/**
 * Calculate overdraft facility commitment
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.commitment_calculations.overdraft_facilities
 */
export function calculateOverdraftCommitment(facilityLimit: number): number {
  return facilityLimit * 0.05;
}

// Helper function to get employment recognition rate (Dr Elena v2 persona aligned)
// Source: dr-elena-mortgage-expert-v2.json -> computational_modules.income_recognition
export function getEmploymentRecognitionRate(employmentType: string): number {
  switch (employmentType) {
    case 'employed':
      return 1.0 // 100% recognition for fixed income
    case 'self-employed':
      return 0.7 // 70% recognition for self-employed (2-year NOA requirement)
    case 'contract':
    case 'variable':
      return 0.7 // 70% recognition for variable/commission income (aligned with persona)
    case 'other':
      return 1.0 // Default to fixed income rate (100%) for undefined types
    case 'not-working':
    case 'unemployed':
    default:
      return 0.0 // 0% recognition for unemployed
  }
}

// Helper function to calculate liabilities total (credit_card, overdraft, guarantor formulas)
export function calculateTotalLiabilities(creditCardCount: number, existingCommitments: number, employmentType: string, monthlyIncome?: number) {
  // Credit card minimum payments: 3% of credit limit or S$50 minimum, whichever is higher
  const creditCardPayments = Math.max(creditCardCount * 50, creditCardCount * 3000 * 0.03)

  // Total monthly commitments
  const totalCommitments = creditCardPayments + existingCommitments

  // Apply income recognition based on employment type with safeguard for negative income
  const recognitionRate = getEmploymentRecognitionRate(employmentType)
  const recognizedIncome = monthlyIncome && monthlyIncome > 0 ? monthlyIncome * recognitionRate : 0

  return {
    creditCardPayments,
    existingCommitments,
    totalCommitments,
    recognizedIncome,
    recognitionRate
  }
}

/**
 * Calculate IWAA (Income-Weighted Average Age)
 * Used for determining maximum loan tenure based on borrower ages
 * Source: Migrated from legacy mortgage.ts
 */
export function calculateIWAA(ages: number[], incomes: number[]): number {
  if (ages.length === 0 || incomes.length === 0) return 0
  if (ages.length !== incomes.length) return ages[0] || 0

  const totalIncome = incomes.reduce((sum, income) => sum + income, 0)
  if (totalIncome === 0) return ages[0] || 0

  const weightedSum = ages.reduce((sum, age, i) => sum + age * (incomes[i] / totalIncome), 0)
  return Math.ceil(weightedSum) // Dr Elena v2: Round UP to nearest integer
}

/**
 * Get placeholder interest rate based on property type and loan type
 * Used for initial calculations when user hasn't specified a rate
 * Source: Migrated from legacy mortgage.ts
 */
export function getPlaceholderRate(propertyType: string, loanType: string = 'new_purchase'): number {
  const rates: Record<string, Record<string, number>> = {
    HDB: { new_purchase: 2.3, refinance: 2.1 },
    Private: { new_purchase: 2.8, refinance: 2.6 },
    Commercial: { new_purchase: 3.2, refinance: 3.0 },
  }

  return rates[propertyType]?.[loanType] || 2.8
}

/**
 * Calculate refinancing savings (simplified version)
 * Compares current loan payments vs refinanced payments
 * Source: Migrated from legacy mortgage.ts
 * Note: For full refinance analysis, use calculateRefinanceOutlook() instead
 */
export function calculateRefinancingSavings(
  currentRate: number,
  outstandingLoan: number,
  remainingTenure: number = 20,
  propertyValue?: number
) {
  const newRate = 2.5 // Competitive market rate
  const tenure = remainingTenure

  // Calculate current monthly payment
  const currentMonthly =
    (outstandingLoan * (currentRate / 100 / 12) * Math.pow(1 + currentRate / 100 / 12, tenure * 12)) /
    (Math.pow(1 + currentRate / 100 / 12, tenure * 12) - 1)

  // Calculate new monthly payment
  const newMonthly =
    (outstandingLoan * (newRate / 100 / 12) * Math.pow(1 + newRate / 100 / 12, tenure * 12)) /
    (Math.pow(1 + newRate / 100 / 12, tenure * 12) - 1)

  const monthlySavings = currentMonthly - newMonthly
  const annualSavings = monthlySavings * 12
  const lifetimeSavings = monthlySavings * tenure * 12

  // Calculate break-even period (assuming $3000 refinancing costs)
  const refinancingCost = 3000
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(refinancingCost / monthlySavings) : 0

  return {
    currentRate,
    newRate,
    currentMonthlyPayment: Math.round(currentMonthly),
    newMonthlyPayment: Math.round(newMonthly),
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),
    lifetimeSavings: Math.round(lifetimeSavings),
    breakEvenMonths,
    worthRefinancing: monthlySavings > 150 && breakEvenMonths < 24, // At least $150/month and break-even within 2 years
  }
}


// Export pure LTV calculation function
export { calculatePureLtvMaxLoan } from './instant-profile-pure-ltv';
