/**
 * Lead Form Entity
 * Lead: Marcus Chen - Lead Full-Stack Architect
 * Co-Lead: Ahmad Ibrahim - Senior Backend Engineer
 * 
 * Core domain entity for progressive lead capture forms
 * Following Domain-Driven Design principles
 */

import { z } from 'zod'
import { 
  FormState, 
  LoanType, 
  FormStep, 
  LeadScore,
  AIInsightResponse,
  BehaviorEvent
} from '../../../contracts/form-contracts'
import { eventBus, FormEvents } from '../../../events/event-bus'
import { FormId } from '../value-objects/FormId'
import { EmailAddress } from '../value-objects/EmailAddress'
import { PhoneNumber } from '../value-objects/PhoneNumber'

export class LeadForm {
  private _id: FormId
  private _loanType: LoanType | null = null
  private _currentStep: number = 0
  private _completedSteps: Set<number> = new Set()
  private _formData: Map<string, any> = new Map()
  private _aiInsights: AIInsightResponse[] = []
  private _behaviorEvents: BehaviorEvent[] = []
  private _score: LeadScore | null = null
  private _sessionId: string
  private _createdAt: Date
  private _updatedAt: Date
  private _isDirty: boolean = false

  constructor(sessionId: string, id?: string) {
    this._id = id ? new FormId(id) : FormId.generate()
    this._sessionId = sessionId
    this._createdAt = new Date()
    this._updatedAt = new Date()
    
    // Emit creation event
    this.emitEvent(FormEvents.STEP_STARTED, {
      stepNumber: 0,
      timestamp: this._createdAt
    })
  }

  // ============================================================================
  // DOMAIN LOGIC
  // ============================================================================

  /**
   * Select loan type - the first critical decision
   */
  selectLoanType(loanType: LoanType): void {
    const previousType = this._loanType
    this._loanType = loanType
    this._isDirty = true
    this._updatedAt = new Date()

    // Emit appropriate event
    const eventType = previousType 
      ? FormEvents.LOAN_TYPE_CHANGED 
      : FormEvents.LOAN_TYPE_SELECTED

    this.emitEvent(eventType, {
      previousType,
      newType: loanType,
      timestamp: this._updatedAt
    })
  }

  /**
   * Set form field value with validation
   */
  setFieldValue(fieldName: string, value: any, step: number): void {
    // Ensure we're at the right step
    if (step > this._currentStep + 1) {
      throw new Error(`Cannot set field for step ${step}. Current step is ${this._currentStep}`)
    }

    const previousValue = this._formData.get(fieldName)
    this._formData.set(fieldName, value)
    this._isDirty = true
    this._updatedAt = new Date()

    this.emitEvent(FormEvents.FIELD_CHANGED, {
      fieldName,
      previousValue,
      newValue: value,
      step,
      timestamp: this._updatedAt
    })
  }

  /**
   * Progress to next step if requirements are met
   */
  progressToStep(targetStep: number): boolean {
    console.log('🎯 LeadForm.progressToStep called!', {
      targetStep,
      currentStep: this._currentStep,
      formDataSize: this._formData.size,
      formDataEntries: Object.fromEntries(this._formData),
      loanType: this._loanType
    })
    
    if (targetStep <= this._currentStep) {
      console.log('✅ Already at or past this step')
      return true // Already at or past this step
    }

    if (targetStep > this._currentStep + 1) {
      console.log('❌ Cannot skip steps')
      return false // Can't skip steps
    }

    console.log('🔎 About to validate step requirements...')
    // Validate current step completion requirements before progressing
    // We validate the current step to ensure it's ready for completion
    const validationResult = this.validateStepRequirements(this._currentStep)
    console.log(`📊 Validation result: ${validationResult}`)
    
    if (!validationResult) {
      console.log(`❌ Step ${this._currentStep} validation failed - cannot progress to step ${targetStep}`)
      return false
    }

    // Mark current step as completed
    this._completedSteps.add(this._currentStep)
    
    // Progress to target step
    const previousStep = this._currentStep
    this._currentStep = targetStep
    this._isDirty = true
    this._updatedAt = new Date()

    // Emit step completed event for previous step
    this.emitEvent(FormEvents.STEP_COMPLETED, {
      stepNumber: previousStep,
      timestamp: this._updatedAt
    })

    // Emit step started event for new step
    this.emitEvent(FormEvents.STEP_STARTED, {
      stepNumber: targetStep,
      timestamp: this._updatedAt
    })

    return true
  }

  /**
   * Validate step requirements
   */
  private validateStepRequirements(step: number): boolean {
    const requirements = this.getStepRequirements(step)
    
    console.log('🔍 LeadForm validation debug:', {
      step,
      requirements,
      formData: Object.fromEntries(this._formData),
      formDataSize: this._formData.size,
      hasRequiredFields: requirements.requiredFields.map(field => ({
        field,
        hasField: this._formData.has(field),
        value: this._formData.get(field),
        valueType: typeof this._formData.get(field)
      }))
    })
    
    // Check if we have any data at all
    if (this._formData.size === 0) {
      console.log('❌ No form data found in LeadForm!')
      return false
    }
    
    for (const field of requirements.requiredFields) {
      if (!this._formData.has(field)) {
        console.log(`❌ Missing field: ${field}`)
        return false
      }
      
      const value = this._formData.get(field)
      if (value === null || value === undefined || value === '') {
        console.log(`❌ Empty field: ${field} = ${value}`)
        return false
      }
    }

    // Special validation for email and phone
    if (requirements.requiresEmail) {
      const email = this._formData.get('email')
      if (!email || !EmailAddress.isValid(email)) {
        console.log(`❌ Invalid email: ${email}`)
        return false
      }
    }

    if (requirements.requiresPhone) {
      const phone = this._formData.get('phone')
      if (!phone || !PhoneNumber.isValid(phone)) {
        console.log(`❌ Invalid phone: ${phone}`)
        return false
      }
    }

    console.log('✅ LeadForm validation passed!')
    return true
  }

  /**
   * Get requirements for a specific step
   */
  private getStepRequirements(step: number): StepRequirements {
    const baseRequirements: Record<number, StepRequirements> = {
      0: {
        requiredFields: ['loanType'],
        requiresEmail: false,
        requiresPhone: false
      },
      1: {
        requiredFields: this.getStep1Fields(),
        requiresEmail: true,
        requiresPhone: false
      },
      2: {
        requiredFields: this.getStep2Fields(),
        requiresEmail: true,
        requiresPhone: true
      },
      3: {
        requiredFields: this.getStep3Fields(),
        requiresEmail: true,
        requiresPhone: true
      }
    }

    return baseRequirements[step] || { requiredFields: [], requiresEmail: false, requiresPhone: false }
  }

  /**
   * Get required fields based on loan type for each step
   */
  private getStep1Fields(): string[] {
    // Step 1 only requires basic contact info for all loan types
    // Loan-specific fields are collected in Step 2
    return ['name', 'email', 'phone']
  }

  private getStep2Fields(): string[] {
    const step1Fields = this.getStep1Fields() // ['name', 'email', 'phone']
    const baseStep2Fields = [...step1Fields]

    // Only include REQUIRED fields for validation
    // Optional fields are not enforced at gate level
    switch (this._loanType) {
      case 'new_purchase':
        // Required fields for new purchase at Step 2:
        // Core fields: propertyCategory, propertyType, priceRange, combinedAge
        // But propertyType is optional for commercial (gets set automatically)
        console.log('🔧 getStep2Fields for new_purchase - checking form data:', Object.fromEntries(this._formData))
        
        const coreFields = [...baseStep2Fields, 'propertyCategory']
        const propertyCategory = this._formData.get('propertyCategory')
        
        // If it's commercial, only propertyCategory is required (propertyType is auto-set)
        if (propertyCategory === 'commercial') {
          return coreFields
        }
        
        // For non-commercial: all 4 fields required
        return [...coreFields, 'propertyType', 'priceRange', 'combinedAge']
      case 'refinance':
        // Required fields for refinance at Step 2:
        // propertyType, currentRate, outstandingLoan, currentBank (matches schema)
        // lockInStatus is in Step 3, not Step 2
        return [...baseStep2Fields, 'propertyType', 'currentRate', 'outstandingLoan', 'currentBank']
      case 'commercial':
        // Required: businessType, propertyValue
        // Optional (not enforced): monthlyIncome, businessRevenue
        return [...baseStep2Fields, 'businessType', 'propertyValue']
      default:
        return baseStep2Fields
    }
  }

  private getStep3Fields(): string[] {
    const step2Fields = this.getStep2Fields()
    
    // Step 3 adds financial details (all optional for better UX)
    // We only validate that user reached this step, not specific fields
    return step2Fields // Financial fields are optional
  }

  /**
   * Get optional fields for a step (informational only, not enforced)
   */
  private getOptionalFieldsForStep(step: number): string[] {
    if (step !== 2) return []
    
    switch (this._loanType) {
      case 'new_purchase':
        return ['priceRange', 'ipaStatus']
      case 'refinance':
        return ['currentRate', 'propertyValue', 'outstandingLoan']
      case 'commercial':
        return ['monthlyIncome', 'businessRevenue']
      default:
        return []
    }
  }

  /**
   * Add AI insight to form
   */
  addAIInsight(insight: AIInsightResponse): void {
    this._aiInsights.push(insight)
    this._isDirty = true
    this._updatedAt = new Date()

    this.emitEvent(FormEvents.AI_INSIGHT_RECEIVED, {
      insight,
      timestamp: this._updatedAt
    })
  }

  /**
   * Add behavior event
   */
  addBehaviorEvent(event: BehaviorEvent): void {
    this._behaviorEvents.push(event)
    this._isDirty = true
    this._updatedAt = new Date()
  }

  /**
   * Set lead score
   */
  setLeadScore(score: LeadScore): void {
    this._score = score
    this._isDirty = true
    this._updatedAt = new Date()

    this.emitEvent(FormEvents.LEAD_SCORED, {
      score,
      timestamp: this._updatedAt
    })

    // Emit routing event if score indicates immediate action
    if (score.routing === 'immediate' || score.routing === 'priority') {
      this.emitEvent(FormEvents.LEAD_ROUTED, {
        routing: score.routing,
        score: score.total,
        timestamp: this._updatedAt
      })
    }
  }

  /**
   * Abandon form
   */
  abandon(): void {
    this.emitEvent(FormEvents.STEP_ABANDONED, {
      stepNumber: this._currentStep,
      formData: this.getPublicData(),
      timestamp: new Date()
    })
  }

  // ============================================================================
  // EVENT EMISSION
  // ============================================================================

  private emitEvent(eventType: string, payload: any): void {
    eventBus.publish({
      eventType,
      aggregateId: this._id.value,
      payload,
      metadata: {
        timestamp: new Date(),
        sessionId: this._sessionId,
        correlationId: `${this._id.value}-${Date.now()}`
      }
    })
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get id(): string {
    return this._id.value
  }

  get loanType(): LoanType | null {
    return this._loanType
  }

  get currentStep(): number {
    return this._currentStep
  }

  get completedSteps(): number[] {
    return Array.from(this._completedSteps)
  }

  // Backward compatibility aliases
  get currentGate(): number {
    return this._currentStep
  }

  get completedGates(): number[] {
    return Array.from(this._completedSteps)
  }

  // Backward compatibility method alias
  progressToGate(targetGate: number): boolean {
    return this.progressToStep(targetGate)
  }

  get formData(): Record<string, any> {
    const data: Record<string, any> = {}
    this._formData.forEach((value, key) => {
      data[key] = value
    })
    return data
  }

  get score(): LeadScore | null {
    return this._score
  }

  get aiInsights(): AIInsightResponse[] {
    return [...this._aiInsights]
  }

  get behaviorEvents(): BehaviorEvent[] {
    return [...this._behaviorEvents]
  }

  get isDirty(): boolean {
    return this._isDirty
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Get public data (safe to send to client)
   */
  getPublicData(): Partial<FormState> {
    return {
      loanType: this._loanType,
      currentStep: this._currentStep,
      completedSteps: this.completedSteps,
      data: this.getSanitizedFormData(),
      isDirty: this._isDirty,
      isSubmitting: false
    }
  }

  /**
   * Get sanitized form data (remove sensitive info)
   */
  private getSanitizedFormData(): Record<string, any> {
    const sanitized: Record<string, any> = {}
    const sensitiveFields = ['monthlyIncome', 'existingCommitments']
    
    this._formData.forEach((value, key) => {
      if (!sensitiveFields.includes(key)) {
        sanitized[key] = value
      }
    })
    
    return sanitized
  }

  /**
   * Mark as saved
   */
  markAsSaved(): void {
    this._isDirty = false
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toJSON(): object {
    return {
      id: this._id.value,
      loanType: this._loanType,
      currentStep: this._currentStep,
      completedSteps: Array.from(this._completedSteps),
      formData: Object.fromEntries(this._formData),
      aiInsights: this._aiInsights,
      behaviorEvents: this._behaviorEvents,
      score: this._score,
      sessionId: this._sessionId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    }
  }

  static fromJSON(data: any): LeadForm {
    const form = new LeadForm(data.sessionId, data.id)
    
    if (data.loanType) {
      form._loanType = data.loanType
    }
    
    form._currentStep = data.currentStep || 0
    form._completedSteps = new Set(data.completedSteps || [])
    
    if (data.formData) {
      Object.entries(data.formData).forEach(([key, value]) => {
        form._formData.set(key, value)
      })
    }
    
    form._aiInsights = data.aiInsights || []
    form._behaviorEvents = data.behaviorEvents || []
    form._score = data.score || null
    form._createdAt = new Date(data.createdAt)
    form._updatedAt = new Date(data.updatedAt)
    
    return form
  }
}

interface StepRequirements {
  requiredFields: string[]
  requiresEmail: boolean
  requiresPhone: boolean
}