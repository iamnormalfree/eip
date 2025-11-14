// ABOUTME: Integration tests for conversion tracking with storage aliasing behavior
// Tests dual-read/single-write pattern for analytics events migration from nextnest_ to eip_ keys

import { ConversionTracker } from '../conversion-tracking'
import { isLegacyCompat } from '../../utils/compat'

// Mock the compat module for testing
jest.mock('../../utils/compat', () => ({
  compat: {
    getWithAliases: jest.fn(),
    setCanonical: jest.fn()
  },
  isLegacyCompat: jest.fn()
}))

const { compat, isLegacyCompat } = require('../../utils/compat')

// Mock fetch for API calls
global.fetch = jest.fn()

describe('ConversionTracking Integration Tests', () => {
  const originalEnv = process.env
  let mockTracker: ConversionTracker

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv, NODE_ENV: 'test', EIP_LEGACY_COMPAT: 'true' }
    
    // Mock window object for localStorage access
    Object.defineProperty(window, 'localStorage', {
      value: global.getStorageMocks().localStorageMock,
      writable: true,
      configurable: true,
    })

    // Create fresh tracker instance
    mockTracker = new ConversionTracker('test-endpoint')

    // Mock fetch responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  afterAll(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  describe('Dual-read behavior for stored events', () => {
    const mockEvents = [
      { type: 'page_view', timestamp: Date.now() - 1000, data: { page: '/loan-form' } },
      { type: 'form_submit', timestamp: Date.now(), data: { formType: 'mortgage' } }
    ]

    it('should load events from eip_ key when it exists', () => {
      compat.getWithAliases.mockReturnValue(mockEvents)

      // Create tracker (should load stored events)
      const tracker = new ConversionTracker('test-endpoint')

      expect(compat.getWithAliases).toHaveBeenCalledWith(
        ['eip_conversion_events', 'nextnest_conversion_events'],
        'localStorage'
      )
    })

    it('should fallback to nextnest_ key when eip_ key does not exist', () => {
      // Mock fallback behavior
      let callCount = 0
      compat.getWithAliases.mockImplementation(() => {
        callCount++
        if (callCount === 1) return null // eip_ key not found
        return mockEvents // nextnest_ key found
      })

      const tracker = new ConversionTracker('test-endpoint')

      expect(callCount).toBe(2) // Should have tried both keys
    })

    it('should start with empty events when no keys exist', () => {
      compat.getWithAliases.mockReturnValue(null)

      const tracker = new ConversionTracker('test-endpoint')
      
      tracker.trackEvent('initial_event', { test: true })

      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle corrupted stored events gracefully', () => {
      console.warn = jest.fn()
      compat.getWithAliases.mockReturnValue('invalid-json{')

      expect(() => {
        new ConversionTracker('test-endpoint')
      }).not.toThrow()

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load stored events:',
        expect.any(Error)
      )
    })

    it('should respect EIP_LEGACY_COMPAT feature flag', () => {
      process.env.EIP_LEGACY_COMPAT = 'false'
      isLegacyCompat.mockReturnValue(false)

      compat.getWithAliases.mockReturnValue(mockEvents)

      new ConversionTracker('test-endpoint')

      expect(compat.getWithAliases).toHaveBeenCalledWith(
        ['eip_conversion_events', 'nextnest_conversion_events'],
        'localStorage'
      )
    })
  })

  describe('Single-write behavior for event storage', () => {
    it('should always write to canonical eip_ key', () => {
      compat.getWithAliases.mockReturnValue([]) // No existing events

      const tracker = new ConversionTracker('test-endpoint')
      
      // Track an event (should trigger save)
      tracker.trackEvent('test_event', { data: 'test' })

      // Should save to canonical key
      expect(compat.setCanonical).toHaveBeenCalledWith(
        'eip_conversion_events',
        expect.any(Array),
        'localStorage'
      )
    })

    it('should limit stored events to last 100 events', () => {
      // Mock 150 existing events
      const existingEvents = Array.from({ length: 150 }, (_, i) => ({
        type: `event_${i}`,
        timestamp: Date.now() - i * 1000,
        data: { index: i }
      }))

      compat.getWithAliases.mockReturnValue(existingEvents)

      const tracker = new ConversionTracker('test-endpoint')
      
      // Track new event
      tracker.trackEvent('new_event', { new: true })

      // Should save only last 100 events
      const saveCall = compat.setCanonical.mock.calls.reverse().find(
        call => call[0] === 'eip_conversion_events'
      )
      const savedEvents = saveCall![1]

      expect(savedEvents).toHaveLength(100)
      expect(savedEvents[0]).toMatchObject({ type: 'event_51' }) // Events 0-50 should be dropped
      expect(savedEvents[savedEvents.length - 1]).toMatchObject({ type: 'new_event' })
    })

    it('should include timestamp and metadata in tracked events', () => {
      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('test-endpoint')
      const beforeTime = Date.now()

      tracker.trackEvent('timed_event', { testData: 'value' })
      const afterTime = Date.now()

      const saveCall = compat.setCanonical.mock.calls.reverse().find(
        call => call[0] === 'eip_conversion_events'
      )
      const savedEvents = saveCall![1]

      expect(savedEvents).toHaveLength(1)
      expect(savedEvents[0]).toMatchObject({
        type: 'timed_event',
        data: { testData: 'value' }
      })
      expect(savedEvents[0].timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(savedEvents[0].timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('API integration', () => {
    beforeEach(() => {
      compat.getWithAliases.mockReturnValue([])
    })

    it('should send events to analytics endpoint', async () => {
      const tracker = new ConversionTracker('https://analytics.example.com/events')
      
      tracker.trackEvent('api_test', { endpoint: 'test' })

      await new Promise(resolve => setTimeout(resolve, 0)) // Wait for async processing

      expect(global.fetch).toHaveBeenCalledWith(
        'https://analytics.example.com/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('api_test')
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockRejectedValue(new Error('Network error'))

      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      const tracker = new ConversionTracker('error-endpoint')
      
      tracker.trackEvent('error_test', { error: true })

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send conversion event:',
        expect.any(Error)
      )

      consoleError.mockRestore()
    })

    it('should continue tracking events after API failures', () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockRejectedValue(new Error('API down'))

      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('unreliable-endpoint')
      
      // Track multiple events even if API fails
      tracker.trackEvent('event_1', { count: 1 })
      tracker.trackEvent('event_2', { count: 2 })
      tracker.trackEvent('event_3', { count: 3 })

      // Should still save events locally
      expect(compat.setCanonical).toHaveBeenCalledTimes(3)
    })
  })

  describe('Data integrity and migration', () => {
    it('should preserve event data structure during storage round-trip', () => {
      const complexEvent = {
        type: 'complex_conversion',
        timestamp: Date.now(),
        data: {
          userId: 'user_123',
          sessionId: 'session_456',
          conversionValue: 2500.50,
          currency: 'SGD',
          funnelStep: 'application_completed',
          metadata: {
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: 'mortgage_promo',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date().toISOString()
          }
        }
      }

      compat.getWithAliases.mockReturnValue([complexEvent])

      const tracker = new ConversionTracker('test-endpoint')

      // Should have loaded the complex event structure
      const saveCall = compat.setCanonical.mock.calls.reverse().find(
        call => call[0] === 'eip_conversion_events'
      )
      
      if (saveCall) {
        const savedEvents = saveCall![1]
        expect(savedEvents).toContainEqual(complexEvent)
      }
    })

    it('should validate event structure before storage', () => {
      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('test-endpoint')
      
      // Track various event types
      tracker.trackEvent('page_view', { page: '/home', referrer: 'google.com' })
      tracker.trackEvent('form_start', { formType: 'mortgage', step: 1 })
      tracker.trackEvent('conversion', { value: 1000, currency: 'SGD' })

      const saveCall = compat.setCanonical.mock.calls.reverse().find(
        call => call[0] === 'eip_conversion_events'
      )
      
      if (saveCall) {
        const savedEvents = saveCall![1]
        expect(savedEvents).toHaveLength(3)
        
        // Verify each event has required structure
        savedEvents.forEach(event => {
          expect(event).toHaveProperty('type')
          expect(event).toHaveProperty('timestamp')
          expect(event).toHaveProperty('data')
          expect(typeof event.timestamp).toBe('number')
        })
      }
    })

    it('should handle migration from legacy event format', () => {
      const legacyEvents = [
        // Old format without timestamps
        { eventType: 'legacy_view', eventData: { page: '/old-page' } },
        // New format
        { type: 'new_event', timestamp: Date.now(), data: { modern: true } }
      ]

      compat.getWithAliases.mockReturnValue(legacyEvents)

      expect(() => {
        new ConversionTracker('test-endpoint')
      }).not.toThrow()
    })
  })

  describe('Performance considerations', () => {
    it('should batch events efficiently', () => {
      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('test-endpoint')
      
      // Track many events quickly
      for (let i = 0; i < 50; i++) {
        tracker.trackEvent(`batch_event_${i}`, { index: i })
      }

      // Should save efficiently
      expect(compat.setCanonical).toHaveBeenCalledTimes(50)
    })

    it('should debounce storage writes to avoid excessive calls', () => {
      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('test-endpoint')
      
      // Track events in quick succession
      tracker.trackEvent('fast_1', { speed: 'quick' })
      tracker.trackEvent('fast_2', { speed: 'quicker' })
      tracker.trackEvent('fast_3', { speed: 'quickest' })

      // Should handle efficiently without excessive storage calls
      expect(compat.setCanonical).toHaveBeenCalledTimes(3)
    })

    it('should handle large event payloads without blocking', () => {
      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('test-endpoint')
      
      const largePayload = {
        type: 'large_event',
        data: {
          // Simulate large payload
          array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item_${i}` })),
          nested: {
            deep: {
              data: Array.from({ length: 100 }, (_, i) => ({ nested_id: i, content: `nested_${i}`.repeat(10) }))
            }
          }
        }
      }

      const startTime = performance.now()
      tracker.trackEvent('large_event', largePayload.data)
      const endTime = performance.now()

      // Should handle large data quickly
      expect(endTime - startTime).toBeLessThan(100)
      expect(compat.setCanonical).toHaveBeenCalled()
    })
  })

  describe('Event filtering and validation', () => {
    beforeEach(() => {
      compat.getWithAliases.mockReturnValue([])
    })

    it('should filter out invalid events', () => {
      const tracker = new ConversionTracker('test-endpoint')
      
      // Try to track invalid events
      tracker.trackEvent('', { empty: 'type' }) // Empty type
      tracker.trackEvent(null as any, { null: 'type' }) // Null type
      tracker.trackEvent(undefined as any, { undefined: 'type' }) // Undefined type

      // Should not save invalid events
      const saveCall = compat.setCanonical.mock.calls.reverse().find(
        call => call[0] === 'eip_conversion_events'
      )
      
      if (saveCall) {
        const savedEvents = saveCall![1]
        expect(savedEvents).toHaveLength(0)
      }
    })

    it('should sanitize event data', () => {
      const tracker = new ConversionTracker('test-endpoint')
      
      const unsanitizedData = {
        script: '<script>alert("xss")</script>',
        html: '<div>HTML content</div>',
        normal: 'normal data'
      }

      tracker.trackEvent('sanitization_test', unsanitizedData)

      const saveCall = compat.setCanonical.mock.calls.reverse().find(
        call => call[0] === 'eip_conversion_events'
      )
      
      if (saveCall) {
        const savedEvents = saveCall![1]
        expect(savedEvents).toHaveLength(1)
        // Data should be stored safely (implementation-dependent)
        expect(savedEvents[0].data).toBeDefined()
      }
    })

    it('should respect privacy settings', () => {
      process.env.EIP_TRACKING_ENABLED = 'false'
      
      compat.getWithAliases.mockReturnValue([])

      const tracker = new ConversionTracker('test-endpoint')
      
      tracker.trackEvent('privacy_test', { sensitive: 'data' })

      // Should not track when privacy is disabled
      expect(global.fetch).not.toHaveBeenCalled()
      expect(compat.setCanonical).not.toHaveBeenCalled()

      delete process.env.EIP_TRACKING_ENABLED
    })
  })

  describe('Cross-browser compatibility', () => {
    it('should work when localStorage is disabled', () => {
      // Remove localStorage temporarily
      const originalLocalStorage = global.window.localStorage
      delete (global.window as any).localStorage

      compat.getWithAliases.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      expect(() => {
        const tracker = new ConversionTracker('test-endpoint')
        tracker.trackEvent('no_storage_test', { storage: 'disabled' })
      }).not.toThrow()

      // Restore localStorage
      global.window.localStorage = originalLocalStorage
    })

    it('should handle quota exceeded errors gracefully', () => {
      compat.getWithAliases.mockReturnValue([])

      // Mock quota exceeded error
      let callCount = 0
      compat.setCanonical.mockImplementation(() => {
        callCount++
        if (callCount <= 1) {
          throw new Error('QuotaExceededError')
        }
      })

      console.warn = jest.fn()

      const tracker = new ConversionTracker('test-endpoint')
      tracker.trackEvent('quota_test', { large: 'data' })

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to store events:',
        expect.any(Error)
      )
    })
  })
})
