// ABOUTME: Analytics event tracking for mobile form optimization and A/B testing
// ABOUTME: Provides centralized event tracking with experiment context

import { getActiveExperiments } from '../ab-testing/experiments'

interface EventProperties {
  [key: string]: any
}

/**
 * Track experiment exposure event
 */
export function trackExperimentExposure(experimentId: string, variant: string) {
  trackEvent('experiment_exposure', {
    experiment_id: experimentId,
    variant: variant,
    timestamp: new Date().toISOString()
  })
}

/**
 * Track form step events
 */
export function trackStepStarted(step: number, stepName: string, properties: EventProperties = {}) {
  trackEvent('step_started', {
    step,
    step_name: stepName,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

export function trackStepCompleted(step: number, stepName: string, properties: EventProperties = {}) {
  trackEvent('step_completed', {
    step,
    step_name: stepName,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

/**
 * Track form conversion events
 */
export function trackFormStarted(properties: EventProperties = {}) {
  trackEvent('form_started', {
    ...properties,
    timestamp: new Date().toISOString()
  })
}

export function trackFormCompleted(properties: EventProperties = {}) {
  trackEvent('form_completed', {
    ...properties,
    timestamp: new Date().toISOString()
  })
}

/**
 * Track instant calculation events
 */
export function trackInstantCalcViewed(properties: EventProperties = {}) {
  trackEvent('instant_calc_viewed', {
    ...properties,
    timestamp: new Date().toISOString()
  })
}

export function trackInstantCalcTriggered(trigger: 'auto' | 'manual', properties: EventProperties = {}) {
  trackEvent('instant_calc_triggered', {
    trigger,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

/**
 * Track mobile-specific events
 */
export function trackMobileInteraction(action: string, properties: EventProperties = {}) {
  trackEvent('mobile_interaction', {
    action,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

export function trackTouchGesture(gesture: string, properties: EventProperties = {}) {
  trackEvent('touch_gesture', {
    gesture,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

/**
 * Track session persistence events
 */
export function trackSessionRestored(properties: EventProperties = {}) {
  trackEvent('session_restored', {
    ...properties,
    timestamp: new Date().toISOString()
  })
}

export function trackSessionSaved(properties: EventProperties = {}) {
  trackEvent('session_saved', {
    ...properties,
    timestamp: new Date().toISOString()
  })
}

/**
 * Track smart defaults events
 */
export function trackSmartDefaultsApplied(defaultsApplied: boolean, properties: EventProperties = {}) {
  trackEvent('smart_defaults_applied', {
    defaults_applied: defaultsApplied,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

/**
 * Core event tracking function with experiment context
 */
function trackEvent(eventName: string, properties: EventProperties = {}) {
  try {
    // Add experiment context to all events
    const activeExperiments = getActiveExperiments()
    const enrichedProperties = {
      ...properties,
      experiments: activeExperiments,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'server'
    }

    // Track in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, enrichedProperties)
    }

    // Track in PostHog (if available)
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, enrichedProperties)
    }

    // Log for debugging
    console.log(`=� Analytics Event: ${eventName}`, enrichedProperties)

  } catch (error) {
    console.warn('� Analytics tracking failed:', error)
  }
}

/**
 * Utility to track field visibility changes
 */
export function trackFieldVisibility(fieldsVisible: string[], totalFields: number, properties: EventProperties = {}) {
  trackEvent('field_visibility_changed', {
    fields_visible: fieldsVisible.length,
    total_fields: totalFields,
    visible_fields: fieldsVisible,
    visibility_ratio: fieldsVisible.length / totalFields,
    ...properties,
    timestamp: new Date().toISOString()
  })
}

// Type declarations for analytics tools
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void
    posthog?: {
      capture: (event: string, properties?: any) => void
    }
  }
}