/**
 * Lightweight Animation Hooks
 * Lead: Sarah Lim - Senior Frontend Engineer
 * 
 * Zero-dependency animation solution
 * Replaces framer-motion with CSS + React
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook for staggered reveal animations
 */
export function useStaggeredReveal<T>(
  items: T[],
  delay: number = 100,
  startDelay: number = 0
) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    // Initial delay before starting reveals
    const startTimer = setTimeout(() => {
      items.forEach((_, index) => {
        const timer = setTimeout(() => {
          setVisibleItems(prev => [...prev, index])
        }, index * delay)
        timers.push(timer)
      })
    }, startDelay)
    
    return () => {
      clearTimeout(startTimer)
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [items, delay, startDelay])
  
  return visibleItems
}

/**
 * Hook for progressive trust signal cascade
 */
export function useTrustCascade(
  signals: Array<{ displayAfter: number }>,
  onSignalShown?: (index: number) => void
) {
  const [visibleSignals, setVisibleSignals] = useState<number[]>([0])
  
  useEffect(() => {
    const timers = signals.map((signal, index) => {
      if (index === 0) return null // First signal shows immediately
      
      return setTimeout(() => {
        setVisibleSignals(prev => [...prev, index])
        onSignalShown?.(index)
      }, signal.displayAfter)
    })
    
    return () => {
      timers.forEach(timer => timer && clearTimeout(timer))
    }
  }, [signals, onSignalShown])
  
  return visibleSignals
}

/**
 * Hook for hover animations
 */
export function useHoverAnimation(duration: number = 300) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const onMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsHovered(true)
    setIsAnimating(true)
  }, [])
  
  const onMouseLeave = useCallback(() => {
    setIsHovered(false)
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false)
    }, duration)
  }, [duration])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return {
    isHovered,
    isAnimating,
    onMouseEnter,
    onMouseLeave
  }
}

/**
 * Hook for loading state animations
 */
export function useLoadingAnimation(isLoading: boolean, minDuration: number = 800) {
  const [showLoading, setShowLoading] = useState(false)
  const startTimeRef = useRef<number>()
  
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now()
      setShowLoading(true)
    } else if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, minDuration - elapsed)
      
      setTimeout(() => {
        setShowLoading(false)
      }, remaining)
    }
  }, [isLoading, minDuration])
  
  return showLoading
}

/**
 * Hook for intersection-based animations (scroll reveal)
 */
export function useScrollReveal(
  threshold: number = 0.1,
  rootMargin: string = '0px'
) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin }
    )
    
    observer.observe(element)
    
    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])
  
  return { ref: elementRef, isVisible }
}

/**
 * CSS class helpers for animations
 */
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer'
}

/**
 * Timing functions for consistent animations
 */
export const animationTimings = {
  instant: 150,
  fast: 300,
  normal: 500,
  slow: 800,
  verySlow: 1200
}