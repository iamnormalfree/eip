import { headers } from 'next/headers'

/**
 * Server-side mobile detection using User-Agent
 * This prevents hydration mismatches by determining mobile state on server
 */
export function getIsMobileServer(): boolean {
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  
  // Mobile device patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  
  return mobileRegex.test(userAgent)
}

/**
 * Get viewport width estimate from User-Agent
 * Used for initial server-side rendering decisions
 */
export function getEstimatedViewportWidth(): number {
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  
  if (/iPhone|iPod/.test(userAgent)) {
    return 375 // iPhone standard width
  }
  
  if (/Android.*Mobile/.test(userAgent)) {
    return 360 // Android phone standard
  }
  
  if (/iPad/.test(userAgent)) {
    return 768 // iPad width
  }
  
  return 1024 // Default to desktop
}