'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design that tracks window size changes
 * Compatible with both modern and legacy Safari/WebKit browsers
 * @param query - CSS media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return
    }

    let mediaQuery: MediaQueryList

    try {
      mediaQuery = window.matchMedia(query)
    } catch (error) {
      console.error('Error creating media query:', error)
      return
    }

    // Set initial value (guarded in case mediaQuery creation failed)
    setMatches(mediaQuery.matches)

    // Create event listener handler
    // Type can be MediaQueryListEvent (modern) or MediaQueryList (legacy)
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches)
    }

    // Check if modern addEventListener is available (Chrome 45+, Safari 14+)
    // Otherwise fall back to legacy addListener (Safari < 14, including iPhone SE)
    if (typeof mediaQuery.addEventListener === 'function') {
      // Modern API
      mediaQuery.addEventListener('change', handleChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      // Legacy Safari API (deprecated but still needed for older devices)
      mediaQuery.addListener(handleChange)
    }

    // Cleanup function with same fallback logic
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

// Mobile-specific media query hook
export function useMobileView(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

// Tablet view hook
export function useTabletView(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

// Desktop view hook
export function useDesktopView(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}