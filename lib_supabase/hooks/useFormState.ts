import { useState, useEffect, useCallback, useRef } from 'react'
import { z } from 'zod'
import { compat } from '../utils/compat'

// Form state schema for validation
const formStateSchema = z.object({
  // Basic Information
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  
  // Loan Details
  loanType: z.enum(['new_purchase', 'refinance', 'commercial']).optional(),
  propertyType: z.string().optional(),
  priceRange: z.number().optional(),
  outstandingLoan: z.number().optional(),
  currentRate: z.number().optional(),
  lockInStatus: z.string().optional(),
  urgency: z.string().optional(),
  
  // Financial Information
  firstTimeBuyer: z.boolean().optional(),
  employmentType: z.string().optional(),
  monthlyIncome: z.number().optional(),
  existingCommitments: z.number().optional(),
  
  // Preferences
  preferredBanks: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
  marketingConsent: z.boolean().optional(),
})

export type FormState = z.infer<typeof formStateSchema>

interface UseFormStateOptions {
  storageKey?: string
  autoSaveInterval?: number // milliseconds
  enableRecovery?: boolean
  onAbandonment?: (data: FormState, completionPercentage: number) => void
}

interface FormStateReturn {
  formData: FormState
  updateField: (field: keyof FormState, value: any) => void
  updateMultipleFields: (updates: Partial<FormState>) => void
  resetForm: () => void
  saveToStorage: () => void
  loadFromStorage: () => FormState | null
  clearStorage: () => void
  hasUnsavedChanges: boolean
  completionPercentage: number
  recoveryAvailable: boolean
  recoverForm: () => void
  abandonmentData: AbandonmentData | null
}

interface AbandonmentData {
  timestamp: string
  completionPercentage: number
  lastActiveField: string | null
  timeSpent: number // seconds
  formData: FormState
}

const STORAGE_VERSION = '1.0.0'
const ABANDONMENT_THRESHOLD = 30000 // 30 seconds of inactivity

export function useFormState(
  loanType: string,
  options: UseFormStateOptions = {}
): FormStateReturn {
  const {
    storageKey = `eip_form_${loanType}`,
    autoSaveInterval = 5000, // Auto-save every 5 seconds
    enableRecovery = true,
    onAbandonment
  } = options

  const [formData, setFormData] = useState<FormState>({ loanType: loanType as any })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [recoveryAvailable, setRecoveryAvailable] = useState(false)
  const [abandonmentData, setAbandonmentData] = useState<AbandonmentData | null>(null)
  
  const lastActivityRef = useRef<number>(Date.now())
  const lastActiveFieldRef = useRef<string | null>(null)
  const formStartTimeRef = useRef<number>(Date.now())
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abandonmentTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate form completion percentage
  const calculateCompletionPercentage = useCallback((data: FormState): number => {
    const requiredFields = ['name', 'email', 'phone', 'loanType']
    const optionalFieldGroups = {
      new_purchase: ['propertyType', 'priceRange', 'firstTimeBuyer'],
      refinance: ['outstandingLoan', 'currentRate', 'lockInStatus'],
      commercial: ['propertyType', 'monthlyIncome']
    }
    
    const loanSpecificFields = optionalFieldGroups[data.loanType as keyof typeof optionalFieldGroups] || []
    const allRelevantFields = [...requiredFields, ...loanSpecificFields]
    
    const filledFields = allRelevantFields.filter(field => {
      const value = data[field as keyof FormState]
      return value !== undefined && value !== '' && value !== null
    })
    
    return Math.round((filledFields.length / allRelevantFields.length) * 100)
  }, [])

  const completionPercentage = calculateCompletionPercentage(formData)

  // Save form data to localStorage using single-write pattern
  const saveToStorage = useCallback(() => {
    try {
      const dataToSave = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        loanType,
        data: formData,
        completionPercentage: calculateCompletionPercentage(formData),
        lastActiveField: lastActiveFieldRef.current
      }
      
      compat.setCanonical(storageKey, JSON.stringify(dataToSave), 'localStorage')
      setHasUnsavedChanges(false)
      
      // Also save to a recovery key if enabled
      if (enableRecovery) {
        compat.setCanonical(`${storageKey}_recovery`, JSON.stringify(dataToSave), 'localStorage')
      }
      
      return true
    } catch (error) {
      console.error('Failed to save form state:', error)
      
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Clear old form data from localStorage
        clearOldFormData()
        // Try again
        try {
          compat.setCanonical(storageKey, JSON.stringify(formData), 'localStorage')
          return true
        } catch {
          return false
        }
      }
      
      return false
    }
  }, [formData, storageKey, loanType, enableRecovery, calculateCompletionPercentage])

  // Load form data from localStorage using dual-read pattern
  const loadFromStorage = useCallback((): FormState | null => {
    try {
      const saved = compat.getWithAliases([storageKey, `nextnest_form_${loanType}`], 'localStorage')
      if (!saved) return null
      
      const parsed = JSON.parse(saved)
      
      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Form data version mismatch, clearing old data')
        compat.setCanonical(storageKey, null, 'localStorage')
        return null
      }
      
      // Validate the loaded data
      const validatedData = formStateSchema.parse(parsed.data)
      return validatedData
      
    } catch (error) {
      console.error('Failed to load form state:', error)
      return null
    }
  }, [storageKey, loanType])

  // Clear storage
  const clearStorage = useCallback(() => {
    compat.setCanonical(storageKey, null, 'localStorage')
    compat.setCanonical(`${storageKey}_recovery`, null, 'localStorage')
    compat.setCanonical(`${storageKey}_abandonment`, null, 'localStorage')
    setRecoveryAvailable(false)
    setHasUnsavedChanges(false)
  }, [storageKey])

  // Clear old form data (cleanup utility) using single-write pattern
  const clearOldFormData = () => {
    const keysToCheck = Object.keys(localStorage).filter(key => 
      key.startsWith('eip_form_') || key.startsWith('nextnest_form_')
    )
    
    const now = Date.now()
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000)
    
    keysToCheck.forEach(key => {
      try {
        const storedValue = compat.getWithAliases([key, key], 'localStorage')
        if (storedValue) {
          const data = JSON.parse(storedValue)
          const timestamp = new Date(data.timestamp).getTime()
          
          if (timestamp < oneWeekAgo) {
            compat.setCanonical(key, null, 'localStorage')
          }
        }
      } catch {
        // Remove invalid data
        compat.setCanonical(key, null, 'localStorage')
      }
    })
  }

  // Handle form abandonment
  const handleAbandonment = useCallback(() => {
    const timeSpent = Math.round((Date.now() - formStartTimeRef.current) / 1000)
    const abandonData: AbandonmentData = {
      timestamp: new Date().toISOString(),
      completionPercentage: calculateCompletionPercentage(formData),
      lastActiveField: lastActiveFieldRef.current,
      timeSpent,
      formData
    }

    // Save abandonment data using single-write pattern
    compat.setCanonical(`${storageKey}_abandonment`, JSON.stringify(abandonData), 'localStorage')
    setAbandonmentData(abandonData)

    // Call abandonment callback if provided
    if (onAbandonment) {
      onAbandonment(formData, abandonData.completionPercentage)
    }

    // Save current state for recovery
    saveToStorage()

  }, [formData, storageKey, calculateCompletionPercentage, onAbandonment, saveToStorage])

  // Update single field
  const updateField = useCallback((field: keyof FormState, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasUnsavedChanges(true)
    lastActivityRef.current = Date.now()
    lastActiveFieldRef.current = field

    // Reset abandonment timer
    if (abandonmentTimerRef.current) {
      clearTimeout(abandonmentTimerRef.current)
    }

    abandonmentTimerRef.current = setTimeout(() => {
      handleAbandonment()
    }, ABANDONMENT_THRESHOLD)

  }, [handleAbandonment])

  // Update multiple fields
  const updateMultipleFields = useCallback((updates: Partial<FormState>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
    setHasUnsavedChanges(true)
    lastActivityRef.current = Date.now()
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({ loanType: loanType as any })
    setHasUnsavedChanges(false)
    clearStorage()
  }, [loanType, clearStorage])

  // Recover form from storage
  const recoverForm = useCallback(() => {
    const recoveryData = compat.getWithAliases([`${storageKey}_recovery`, `${storageKey}_recovery`], 'localStorage')
    if (recoveryData) {
      try {
        const parsed = JSON.parse(recoveryData)
        setFormData(parsed.data)
        setRecoveryAvailable(false)
        
        // Clear recovery data after successful recovery using single-write pattern
        compat.setCanonical(`${storageKey}_recovery`, null, 'localStorage')
      } catch (error) {
        console.error('Failed to recover form:', error)
      }
    }
  }, [storageKey])

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      saveToStorage()
    }, autoSaveInterval)
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [formData, hasUnsavedChanges, autoSaveInterval, saveToStorage])

  // Check for recovery data on mount
  useEffect(() => {
    const checkRecovery = () => {
      const recoveryData = compat.getWithAliases([`${storageKey}_recovery`, `${storageKey}_recovery`], 'localStorage')
      if (recoveryData) {
        try {
          const parsed = JSON.parse(recoveryData)
          // Only show recovery if data is less than 7 days old
          const dataAge = Date.now() - new Date(parsed.timestamp).getTime()
          const sevenDays = 7 * 24 * 60 * 60 * 1000
          
          if (dataAge < sevenDays && parsed.data && Object.keys(parsed.data).length > 1) {
            setRecoveryAvailable(true)
          }
        } catch {
          // Invalid recovery data
          compat.setCanonical(`${storageKey}_recovery`, null, 'localStorage')
        }
      }
      
      // Check for abandonment data
      const abandonData = compat.getWithAliases([`${storageKey}_abandonment`, `${storageKey}_abandonment`], 'localStorage')
      if (abandonData) {
        try {
          const parsed = JSON.parse(abandonData)
          setAbandonmentData(parsed)
        } catch {
          compat.setCanonical(`${storageKey}_abandonment`, null, 'localStorage')
        }
      }
    }
    
    checkRecovery()
  }, [storageKey])

  // Handle page unload (save state)
  useEffect(() => {
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        saveToStorage()
        
        // Show browser warning if significant progress made
        if (completionPercentage > 30) {
          e.preventDefault()
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        }
      }
    }
    
    window.addEventListener('beforeunload', handleUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [hasUnsavedChanges, saveToStorage, completionPercentage])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current)
      }
    }
  }, [])

  return {
    formData,
    updateField,
    updateMultipleFields,
    resetForm,
    saveToStorage,
    loadFromStorage,
    clearStorage,
    hasUnsavedChanges,
    completionPercentage,
    recoveryAvailable,
    recoverForm,
    abandonmentData
  }
}
