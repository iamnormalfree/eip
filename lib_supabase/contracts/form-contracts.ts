/**
 * Form Contract Interfaces
 * Lead: Marcus Chen - Lead Full-Stack Architect
 * 
 * Contract-first development ensuring clear boundaries between components
 * Following Domain-Driven Design principles from Tech-Team Roundtable
 */

import { z } from 'zod'

// ============================================================================
// CORE VALUE OBJECTS
// ============================================================================

export interface Money {
  amount: number
  currency: 'SGD' | 'USD'
  formatted: string
}

export interface Percentage {
  value: number
  decimal: number
  formatted: string
}

// ============================================================================
// LOAN TYPE CONTRACTS
// ============================================================================

export type LoanType = 'new_purchase' | 'refinance' | 'commercial'
export type PropertyType = 'HDB' | 'EC' | 'Private' | 'Landed' | 'Commercial'
export type PropertyCategory = 'resale' | 'new_launch' | 'bto' | 'commercial'
export type PurchaseTimeline = 'this_month' | 'next_3_months' | '3_6_months' | 'exploring'
export type IPAStatus = 'have_ipa' | 'applied' | 'starting' | 'what_is_ipa'
export type LockInStatus = 'ending_soon' | 'no_lock' | 'locked' | 'not_sure'

export type RefinancingGoal = 'lower_monthly_payment' | 'shorten_tenure' | 'rate_certainty' | 'cash_out'
export type CashOutReason = 'renovation' | 'investment' | 'debt_consolidation' | 'education' | 'emergency' | 'other'

export interface RefinanceObjectives {
  goals: RefinancingGoal[]
  cashOutAmount?: number
  cashOutReason?: CashOutReason
  ownerOccupied: boolean
  monthsRemaining: number | undefined
}

export interface MASReadinessMetrics {
  tdsrRatio?: number
  tdsrLimit: number
  msrRatio?: number  
  msrLimit: number
}

export interface LoanTypeOption {
  type: LoanType
  label: string
  subtext: string
  icon: string
  benefits: string[]
  urgencyHook: string
  marketContext?: string
}

// ============================================================================
// FORM STATE CONTRACTS
// ============================================================================

export interface FormStep {
  stepNumber: 0 | 1 | 2 | 3
  label: string
  description: string
  fieldsRequired: string[]
  minimumFields: number
  trustLevel: number
  ctaText: string
}

// Backward compatibility alias
export interface FormGate {
  gateNumber: 0 | 1 | 2 | 3
  label: string
  description: string
  fieldsRequired: string[]
  minimumFields: number
  trustLevel: number
  ctaText: string
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'radio' | 'checkbox'
  required: boolean
  step: number
  validation?: z.ZodSchema
  placeholder?: string
  helpText?: string
  options?: Array<{ value: string; label: string }>
}

export interface FormState {
  loanType: LoanType | null
  currentStep: number
  completedSteps: number[]
  data: Record<string, any>
  validationErrors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
  lastSaved?: Date
}

// ============================================================================
// AI INSIGHT CONTRACTS
// ============================================================================

export interface AIInsightRequest {
  fieldName: string
  value: any
  loanType: LoanType
  formContext: Partial<FormState>
  sessionId: string
  timestamp: number
}

export interface AIInsightResponse {
  insight: string
  calculation?: {
    monthlyPayment?: Money
    downPayment?: Money
    stampDuty?: Money
    tdsr?: Percentage
    msr?: Percentage
  }
  marketContext?: string
  confidence: number
  source: 'ai' | 'algorithmic' | 'cached'
  teaser?: string
  responseTime: number
}

export interface AIFallbackChain {
  primary: 'openai' | 'anthropic'
  secondary: 'algorithmic'
  tertiary: 'cached'
  quaternary: 'default'
}

// ============================================================================
// LEAD SCORING CONTRACTS
// ============================================================================

export interface LeadScore {
  total: number // 0-100
  urgency: number // 0-40
  value: number // 0-40
  qualification: number // 0-20
  breakdown: {
    urgencyFactors: Record<string, number>
    valueFactors: Record<string, number>
    qualificationFactors: Record<string, number>
  }
  routing: 'immediate' | 'priority' | 'standard' | 'nurture'
  confidence: number
  timestamp: Date
}

export interface LeadProfile {
  id: string
  loanType: LoanType
  formData: Record<string, any>
  score: LeadScore
  aiInsights: AIInsightResponse[]
  behaviorEvents: BehaviorEvent[]
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// BEHAVIOR TRACKING CONTRACTS
// ============================================================================

export interface BehaviorEvent {
  type: 'form_started' | 'field_completed' | 'step_completed' | 'form_abandoned' | 
        'pdf_opened' | 'email_clicked' | 'page_revisit' | 'hesitation_detected'
  timestamp: number
  sessionId: string
  metadata: Record<string, any>
  stepNumber?: number
  fieldName?: string
}

export interface UserSession {
  id: string
  leadId?: string
  events: BehaviorEvent[]
  formState: FormState
  device: 'desktop' | 'mobile' | 'tablet'
  referrer?: string
  startTime: Date
  lastActivity: Date
}

// ============================================================================
// PROCESSING TIER CONTRACTS
// ============================================================================

export interface ProcessingTier {
  tier: 1 | 2 | 3
  name: 'instant' | 'ai_analysis' | 'full_report'
  responseTime: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  retryCount?: number
}

export interface ProcessingPipeline {
  sessionId: string
  tiers: ProcessingTier[]
  currentTier: number
  startTime: Date
  completionTime?: Date
  finalResult?: any
}

// ============================================================================
// TRUST SIGNAL CONTRACTS
// ============================================================================

export interface TrustSignal {
  type: 'authority' | 'social_proof' | 'urgency' | 'security' | 'personalization'
  message: string
  icon?: string
  priority: number
  displayAfter: number // milliseconds
  duration?: number // milliseconds to display
}

export interface TrustCascade {
  signals: TrustSignal[]
  currentStage: number
  startTime: Date
  completedSignals: string[]
}

// ============================================================================
// EVENT BUS CONTRACTS
// ============================================================================

export interface DomainEvent {
  eventType: string
  aggregateId: string
  payload: any
  metadata: {
    timestamp: Date
    userId?: string
    sessionId: string
    correlationId: string
  }
}

export interface EventHandler<T = any> {
  eventType: string
  handle: (event: DomainEvent) => Promise<T>
}

export interface EventBus {
  publish: (event: DomainEvent) => Promise<void>
  subscribe: (eventType: string, handler: EventHandler) => void
  unsubscribe: (eventType: string, handler: EventHandler) => void
}

// ============================================================================
// HEALTH CHECK CONTRACTS
// ============================================================================

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'critical'
  message?: string
  responseTime: number
  checkedAt: Date
  details?: Record<string, any>
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  services: HealthCheckResult[]
  lastCheck: Date
  uptime: number
  alerts: Alert[]
}

export interface Alert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  service: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

// ============================================================================
// API RESPONSE CONTRACTS
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata: {
    timestamp: Date
    requestId: string
    responseTime: number
    version: string
  }
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// VALIDATION CONTRACTS
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code?: string
  }>
  warnings?: Array<{
    field: string
    message: string
  }>
}

export interface FormValidationRules {
  [fieldName: string]: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any, formData: any) => boolean | string
  }
}

// ============================================================================
// SECURITY CONTRACTS
// ============================================================================

export interface SecurityContext {
  userId?: string
  sessionId: string
  ipAddress: string
  userAgent: string
  permissions: string[]
  rateLimit: {
    limit: number
    remaining: number
    resetAt: Date
  }
}

export interface EncryptedData {
  algorithm: string
  data: string
  iv: string
  tag?: string
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isLoanType = (value: any): value is LoanType => {
  return ['new_purchase', 'refinance', 'commercial'].includes(value)
}

export const isPropertyType = (value: any): value is PropertyType => {
  return ['HDB', 'EC', 'Private', 'Landed'].includes(value)
}

export const isValidFormStep = (value: any): value is FormStep => {
  return typeof value === 'object' && 
         typeof value.stepNumber === 'number' &&
         value.stepNumber >= 0 && 
         value.stepNumber <= 3
}

// Backward compatibility alias
export const isValidFormGate = (value: any): value is FormGate => {
  return typeof value === 'object' && 
         typeof value.gateNumber === 'number' &&
         value.gateNumber >= 0 && 
         value.gateNumber <= 3
}

export const isAIResponse = (value: any): value is AIInsightResponse => {
  return typeof value === 'object' &&
         typeof value.insight === 'string' &&
         typeof value.confidence === 'number' &&
         ['ai', 'algorithmic', 'cached'].includes(value.source)
}

// ============================================================================
// INSTANT CALCULATION RESULT TYPES
// ============================================================================

/**
 * Instant Calculation Result Types
 * Discriminated union to distinguish between Step 2 (pure LTV) and Step 3+ (full analysis)
 */

/**
 * Base fields shared across all instant calculation result types
 */
export interface BaseInstantCalcResult {
  propertyPrice: number
  propertyType: 'HDB' | 'Private' | 'EC' | 'Commercial'
  maxLoanAmount: number
  ltvRatio: number
  downPayment: number
  reasonCodes: string[]
  policyRefs: string[]
  rateAssumption: number
}

/**
 * Step 2: Pure LTV calculation (no income)
 * Based ONLY on property regulations and LTV limits
 */
export interface PureLtvCalcResult extends BaseInstantCalcResult {
  calculationType: 'pure_ltv'
  ltvPercentage: number
  minCashPercent: number
  minCashRequired: number
  cpfAllowed: boolean
  cpfAllowedAmount: number
  cashDownPayment: number
  cpfDownPayment: number
  effectiveTenure: number
  tenureCapSource?: 'age' | 'regulation' | 'both'
  limitingFactor: 'LTV' // Always LTV for pure calculations
}

/**
 * Step 3+: Full analysis with income and commitments
 * Includes MSR/TDSR compliance calculations
 */
export interface FullAnalysisCalcResult extends BaseInstantCalcResult {
  calculationType: 'full_analysis'
  ltvPercentage: number
  minCashPercent: number
  minCashRequired: number
  cpfAllowed: boolean
  cpfAllowedAmount: number
  cashDownPayment: number
  cpfDownPayment: number
  effectiveTenure: number
  tenureCapSource?: 'age' | 'regulation' | 'both'
  estimatedMonthlyPayment: number
  limitingFactor: 'MSR' | 'TDSR' | 'LTV'
  tdsrAvailable?: number
  msrLimit?: number
  msrPass?: boolean
  tdsrPass?: boolean
  msrUsagePercent?: number
  tdsrUsagePercent?: number
  absdRate?: number
  ltvMode?: number
  personaProfile?: any
}

/**
 * Refinance calculation result (Step 2+)
 */
export interface RefinanceCalcResult {
  calculationType: 'refinance_analysis'
  propertyPrice: number
  propertyType: 'HDB' | 'Private' | 'EC' | 'Commercial'
  maxLoanAmount: number
  monthlySavings: number
  currentMonthlyPayment: number
  currentRate: number
  outstandingLoan: number
  maxCashOut: number
  timingGuidance: string
  reasonCodes: string[]
  policyRefs: string[]
  ltvCapApplied: number
  cpfRedemptionAmount: number
  rateAssumption: number
}

/**
 * Discriminated union type for all instant calculation results
 */
export type InstantCalcResult = PureLtvCalcResult | FullAnalysisCalcResult | RefinanceCalcResult

/**
 * Type guard for pure LTV results
 */
export const isPureLtvResult = (result: InstantCalcResult): result is PureLtvCalcResult => {
  return result.calculationType === 'pure_ltv'
}

/**
 * Type guard for full analysis results
 */
export const isFullAnalysisResult = (result: InstantCalcResult): result is FullAnalysisCalcResult => {
  return result.calculationType === 'full_analysis'
}

/**
 * Type guard for refinance results
 */
export const isRefinanceResult = (result: InstantCalcResult): result is RefinanceCalcResult => {
  return result.calculationType === 'refinance_analysis'
}
