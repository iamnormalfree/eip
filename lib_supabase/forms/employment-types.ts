// ABOUTME: Unified employment type system with Dr Elena v2 income recognition rates
// ABOUTME: Supports 4 employment types with MAS-compliant documentation requirements

export type EmploymentType =
  | 'employed'           // ≥3 months with employer (100% base + 70% variable)
  | 'self-employed'      // Business owner (70% on 2-year NOA)
  | 'in-between-jobs'    // <3 months with employer (100% base + 70% variable, needs contract)
  | 'not-working'        // Unemployed/retired (0% recognition)

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  'employed': 'Employed (3+ months with current employer)',
  'self-employed': 'Self-employed / Business owner',
  'in-between-jobs': 'Just started new job (<3 months)',
  'not-working': 'Not working'
}

// Dr Elena v2 income recognition rates (dr-elena-mortgage-expert-v2.json lines 190-211)
export const INCOME_RECOGNITION_RATES: Record<EmploymentType, number> = {
  'employed': 1.0,           // 100% on base salary
  'in-between-jobs': 1.0,    // 100% on base salary (but different docs)
  'self-employed': 0.7,      // 70% on declared NOA income
  'not-working': 0.0         // 0% (no income)
}

export const VARIABLE_INCOME_RECOGNITION_RATE = 0.7  // 70% for bonuses/commissions

export const DOCUMENTATION_REQUIREMENTS: Record<EmploymentType, string[]> = {
  'employed': [
    'Latest 3 months payslips',
    'Employment letter'
  ],
  'in-between-jobs': [
    'Employment contract (signed)',
    'Email from work email address (proof of employment)',
    'Available payslips (1-2 months if applicable)'
  ],
  'self-employed': [
    'Latest 2 years Notice of Assessment (NOA)',
    'Business registration documents'
  ],
  'not-working': []
}

export function getEmploymentRecognitionRate(type: EmploymentType): number {
  return INCOME_RECOGNITION_RATES[type]
}

export function calculateRecognizedIncome(params: {
  employmentType: EmploymentType
  baseIncome: number
  variableIncome?: number
  noaMonthlyAverage?: number  // For self-employed
}): number {
  const { employmentType, baseIncome, variableIncome = 0, noaMonthlyAverage = 0 } = params

  if (employmentType === 'self-employed') {
    return (noaMonthlyAverage || baseIncome) * 0.7
  }

  if (employmentType === 'not-working') {
    return 0
  }

  // employed or in-between-jobs
  const recognizedBase = baseIncome * 1.0
  const recognizedVariable = variableIncome * VARIABLE_INCOME_RECOGNITION_RATE

  return recognizedBase + recognizedVariable
}
