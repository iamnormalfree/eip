// ABOUTME: React hook for A/B testing experiment variant assignment
// ABOUTME: Provides deterministic user bucketing and variant tracking

import { useMemo, useEffect } from 'react'
import { getExperimentVariant, CTA_COPY_VARIANTS } from '../ab-testing/experiments'

/**
 * Hook to get experiment variant for a specific experiment
 */
export function useExperiment(experimentId: string): string {
  const variant = useMemo(() => {
    return getExperimentVariant(experimentId)
  }, [experimentId])

  // Track experiment exposure
  useEffect(() => {
    if (typeof window !== 'undefined' && variant !== 'control') {
      // Track experiment exposure in analytics
      if (window.gtag) {
        window.gtag('event', 'experiment_exposure', {
          experiment_id: experimentId,
          variant: variant,
          custom_parameter: {
            experiment_id: experimentId,
            variant: variant
          }
        })
      }
    }
  }, [experimentId, variant])

  return variant
}

/**
 * Hook to get CTA text based on experiment variant
 */
export function useCTACopy(): string {
  const variant = useExperiment('step2_cta_copy')
  return CTA_COPY_VARIANTS[variant as keyof typeof CTA_COPY_VARIANTS] || CTA_COPY_VARIANTS.control
}

/**
 * Hook to get instant calculation timing preference
 */
export function useInstantCalcTiming(): 'auto' | 'on_demand' {
  return useExperiment('instant_calc_timing') as 'auto' | 'on_demand'
}

/**
 * Hook to get Step 3 field order preference
 */
export function useStep3FieldOrder(): 'income_first' | 'age_first' {
  return useExperiment('step3_field_order') as 'income_first' | 'age_first'
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void
  }
}