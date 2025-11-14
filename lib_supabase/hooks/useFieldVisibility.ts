// ABOUTME: React hook to connect field visibility rules with form state
// ABOUTME: Provides memoized visibility checker for progressive disclosure

import { useMemo } from 'react'
import { getStep2VisibleFields, shouldShowField, type Step2State } from '@/lib/forms/field-visibility-rules'

export function useFieldVisibility(formState: Step2State) {
  return useMemo(() => {
    const visibleFields = getStep2VisibleFields(formState)
    return (fieldName: string) => shouldShowField(fieldName, visibleFields)
  }, [formState])
}

