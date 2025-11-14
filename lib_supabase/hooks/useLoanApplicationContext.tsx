'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react'
import { useLoanApplicationStorage, retrieveLoanApplicationData } from './useLoanApplicationStorage'

// Form data types
export interface LoanApplicationData {
  // Step 1: Loan type
  loanType: 'new_purchase' | 'refinance' | 'commercial' | null

  // Step 2: Basic info
  propertyType?: string
  propertyValue?: number
  loanAmount?: number
  monthlyIncome?: number

  // Step 3: Contact
  name?: string
  email?: string
  phone?: string

  // Metadata
  sessionId: string
  startedAt: Date
  completedAt?: Date
  currentStep: number

  // Analysis results
  leadScore?: number
  insights?: any
  recommendations?: string[]
}

// Action types
type LoanApplicationAction =
  | { type: 'UPDATE_FIELD'; field: keyof LoanApplicationData; value: any }
  | { type: 'UPDATE_STEP_DATA'; step: number; data: any }
  | { type: 'SET_INSIGHTS'; insights: any; leadScore?: number }
  | { type: 'SET_STEP'; step: number }
  | { type: 'COMPLETE' }
  | { type: 'RESET' }

// Context type
interface LoanApplicationContextType {
  data: LoanApplicationData
  dispatch: React.Dispatch<LoanApplicationAction>
  updateField: (field: keyof LoanApplicationData, value: any) => void
  updateStepData: (step: number, data: any) => void
  setInsights: (insights: any, leadScore?: number) => void
  setStep: (step: number) => void
  complete: () => void
  reset: () => void
}

// Initial state
const initialState: LoanApplicationData = {
  loanType: null,
  sessionId: `session-${Date.now()}`,
  startedAt: new Date(),
  currentStep: 1
}

// Reducer
function loanApplicationReducer(
  state: LoanApplicationData,
  action: LoanApplicationAction
): LoanApplicationData {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value
      }

    case 'UPDATE_STEP_DATA':
      // Merge step data into state
      return {
        ...state,
        ...action.data,
        currentStep: action.step
      }

    case 'SET_INSIGHTS':
      return {
        ...state,
        insights: action.insights,
        leadScore: action.leadScore || state.leadScore
      }

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step
      }

    case 'COMPLETE':
      return {
        ...state,
        completedAt: new Date()
      }

    case 'RESET':
      return {
        ...initialState,
        sessionId: `session-${Date.now()}`,
        startedAt: new Date()
      }

    default:
      return state
  }
}

// Create context
const LoanApplicationContext = createContext<LoanApplicationContextType | undefined>(undefined)

// Provider component
export function LoanApplicationProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [data, dispatch] = useReducer(loanApplicationReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const currentSessionId = data.sessionId
    const storedData = retrieveLoanApplicationData(currentSessionId)

    if (storedData) {
      // Restore the entire state from localStorage
      Object.keys(storedData).forEach(key => {
        if (key !== 'sessionId' && storedData[key as keyof LoanApplicationData] !== undefined) {
          dispatch({
            type: 'UPDATE_FIELD',
            field: key as keyof LoanApplicationData,
            value: storedData[key as keyof LoanApplicationData]
          })
        }
      })
    }
    setIsInitialized(true)
  }, [data.sessionId])

  // Persist data to localStorage whenever it changes
  useLoanApplicationStorage(data, data.sessionId)

  // Helper functions
  const updateField = useCallback((field: keyof LoanApplicationData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value })
  }, [])

  const updateStepData = useCallback((step: number, data: any) => {
    dispatch({ type: 'UPDATE_STEP_DATA', step, data })
  }, [])

  const setInsights = useCallback((insights: any, leadScore?: number) => {
    dispatch({ type: 'SET_INSIGHTS', insights, leadScore })
  }, [])

  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', step })
  }, [])

  const complete = useCallback(() => {
    dispatch({ type: 'COMPLETE' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value = {
    data,
    dispatch,
    updateField,
    updateStepData,
    setInsights,
    setStep,
    complete,
    reset
  }

  return (
    <LoanApplicationContext.Provider value={value}>
      {children}
    </LoanApplicationContext.Provider>
  )
}

// Hook to use the context
export function useLoanApplicationContext() {
  const context = useContext(LoanApplicationContext)
  if (!context) {
    throw new Error('useLoanApplicationContext must be used within LoanApplicationProvider')
  }
  return context
}

// Export everything
export { LoanApplicationContext }