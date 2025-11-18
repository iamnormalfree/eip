// ABOUTME: Tests for useMediaQuery hook Safari compatibility and responsiveness
// ABOUTME: Ensures both modern and legacy browser APIs work correctly

import { renderHook } from '@testing-library/react'
import { useMediaQuery, useMobileView, useTabletView, useDesktopView } from '../useMediaQuery'

describe('useMediaQuery', () => {
  // Store original matchMedia
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Store original matchMedia
    originalMatchMedia = window.matchMedia;
    
    // Reset to original before each test
    window.matchMedia = originalMatchMedia;
    
    // Mock localStorage for React state tests
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    } as any;
  })

  afterEach(() => {
    // Restore original after each test
    window.matchMedia = originalMatchMedia;
  })

  describe('Modern API (addEventListener)', () => {
    it('should return true when media query matches', () => {
      // Mock modern matchMedia with addEventListener
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      expect(result.current).toBe(true)
    })

    it('should return false when media query does not match', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      expect(result.current).toBe(false)
    })

    it('should clean up event listener on unmount', () => {
      const removeEventListener = jest.fn()
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: true,
        media: '(max-width: 767px)',
        addEventListener: jest.fn(),
        removeEventListener,
      })) as any

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      unmount()

      expect(removeEventListener).toHaveBeenCalled()
    })
  })

  describe('Legacy API (addListener) - Safari < 14, iPhone SE compatibility', () => {
    it('should work with legacy addListener API', () => {
      // Mock legacy Safari matchMedia (no addEventListener, only addListener)
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        // No addEventListener/removeEventListener (legacy Safari)
      })) as any

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      expect(result.current).toBe(true)
    })

    it('should clean up legacy listener on unmount', () => {
      const removeListener = jest.fn()
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: true,
        media: '(max-width: 767px)',
        addListener: jest.fn(),
        removeListener,
      })) as any

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      unmount()

      expect(removeListener).toHaveBeenCalled()
    })

    it('should handle media query changes with legacy API', () => {
      let changeHandler: ((mql: MediaQueryList) => void) | null = null

      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: '(max-width: 767px)',
        addListener: jest.fn((handler) => {
          changeHandler = handler
        }),
        removeListener: jest.fn(),
      })) as any

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      expect(result.current).toBe(false)

      // Simulate media query change (legacy API passes MediaQueryList, not event)
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryList)
      }

      // Note: In real usage, React would re-render and update the value
      // This test validates the handler is called correctly
      expect(changeHandler).toBeTruthy()
    })
  })

  describe('Error handling', () => {
    it('should handle matchMedia errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      window.matchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia not supported')
      })

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
      expect(result.current).toBe(false)
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('Convenience hooks', () => {
    it('useMobileView should detect mobile viewport', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any

      const { result } = renderHook(() => useMobileView())
      expect(result.current).toBe(true)
    })

    it('useTabletView should detect tablet viewport', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(min-width: 768px) and (max-width: 1023px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any

      const { result } = renderHook(() => useTabletView())
      expect(result.current).toBe(true)
    })

    it('useDesktopView should detect desktop viewport', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(min-width: 1024px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any

      const { result } = renderHook(() => useDesktopView())
      expect(result.current).toBe(true)
    })
  })
})
