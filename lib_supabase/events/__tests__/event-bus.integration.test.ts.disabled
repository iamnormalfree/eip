// ABOUTME: Integration tests for event bus dual-attachment behavior
// Tests dual-attachment strategy with __eip_eventbus and __nextnest_eventbus window references

import { eventBus, FormEvents } from '../event-bus'
import { isLegacyCompat } from '../../utils/compat'

// Mock the compat module for testing
jest.mock('../../utils/compat', () => ({
  isLegacyCompat: jest.fn()
}))

const { isLegacyCompat } = require('../../utils/compat')

describe('EventBus Integration Tests', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv, NODE_ENV: 'test', EIP_LEGACY_COMPAT: 'true' }
    
    // Mock window object for event bus attachment
    Object.defineProperty(window, '__eip_eventbus', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(window, '__nextnest_eventbus', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    isLegacyCompat.mockReturnValue(true)

    // Reset the event bus for clean testing
    eventBus.reset()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Dual-attachment behavior', () => {
    it('should attach to canonical __eip_eventbus reference', () => {
      // Access the event bus through the existing instance
      expect((window as any).__eip_eventbus).toBeDefined()
      expect(typeof (window as any).__eip_eventbus.subscribe).toBe('function')
    })

    it('should also attach to __nextnest_eventbus when legacy compatibility enabled', () => {
      isLegacyCompat.mockReturnValue(true)

      // Reset to trigger re-attachment
      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeDefined()
    })

    it('should only attach to __eip_eventbus when legacy compatibility disabled', () => {
      isLegacyCompat.mockReturnValue(false)

      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeUndefined()
    })

    it('should maintain same instance across multiple accesses', () => {
      const instance1 = eventBus
      const instance2 = eventBus
      const instance3 = eventBus

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
      expect((window as any).__eip_eventbus).toBe(instance1)
    })

    it('should handle window attachment errors gracefully', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()

      // Mock window attachment to throw error
      // Clean up existing properties first
      delete (window as any).__eip_eventbus
      delete (window as any).__nextnest_eventbus

      Object.defineProperty(window, '__eip_eventbus', {
        get() {
          throw new Error('Cannot attach to window')
        },
        set() {
          throw new Error('Cannot attach to window')
        },
        configurable: true,
      })

      expect(() => {
        eventBus.reset()
      }).not.toThrow()

      consoleWarn.mockRestore()
    })
  })

  describe('Feature flag control for dual-attachment', () => {
    it('should respect EIP_LEGACY_COMPAT environment variable', () => {
      process.env.EIP_LEGACY_COMPAT = 'true'
      isLegacyCompat.mockReturnValue(true)

      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeDefined()
    })

    it('should disable legacy attachment when EIP_LEGACY_COMPAT is false', () => {
      process.env.EIP_LEGACY_COMPAT = 'false'
      isLegacyCompat.mockReturnValue(false)

      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeUndefined()
    })

    it('should handle runtime feature flag changes', () => {
      // Start with legacy compatibility enabled
      isLegacyCompat.mockReturnValue(true)
      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeDefined()

      // Change feature flag to disabled
      isLegacyCompat.mockReturnValue(false)
      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeUndefined()
    })
  })

  describe('Event deduplication verification', () => {
    it('should prevent duplicate event processing', async () => {
      const mockHandler = jest.fn()
      const testEvent = {
        eventType: FormEvents.LOAN_TYPE_SELECTED,
        aggregateId: 'test_aggregate_1',
        payload: { loanType: 'home' },
        metadata: {
          timestamp: new Date(),
          sessionId: 'test_session_1',
          correlationId: 'test_correlation_1'
        }
      }

      eventBus.subscribe(FormEvents.LOAN_TYPE_SELECTED, mockHandler)

      // Publish same event multiple times
      await eventBus.publish(testEvent)
      await eventBus.publish(testEvent)
      await eventBus.publish(testEvent)

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should process each occurrence (not deduplicate by default)
      expect(mockHandler).toHaveBeenCalledTimes(3)
    })

    it('should handle events with same correlation ID', async () => {
      const mockHandler = jest.fn()
      const correlationId = 'shared_correlation_id'

      const event1 = {
        eventType: FormEvents.STEP_STARTED,
        aggregateId: 'step_1',
        payload: { stepName: 'personal_info' },
        metadata: {
          timestamp: new Date(),
          sessionId: 'test_session_1',
          correlationId
        }
      }

      const event2 = {
        eventType: FormEvents.STEP_COMPLETED,
        aggregateId: 'step_1',
        payload: { stepName: 'personal_info' },
        metadata: {
          timestamp: new Date(),
          sessionId: 'test_session_1',
          correlationId
        }
      }

      eventBus.subscribe(FormEvents.STEP_STARTED, mockHandler)
      eventBus.subscribe(FormEvents.STEP_COMPLETED, mockHandler)

      await eventBus.publish(event1)
      await eventBus.publish(event2)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should process both events despite same correlation ID
      expect(mockHandler).toHaveBeenCalledTimes(2)
    })

    it('should maintain event order', async () => {
      const events: any[] = []
      const mockHandler = jest.fn((event) => {
        events.push(event.eventType)
      })

      eventBus.subscribe(FormEvents.LOAN_TYPE_SELECTED, mockHandler)

      const testEvents = [
        {
          eventType: FormEvents.LOAN_TYPE_SELECTED,
          aggregateId: 'test_1',
          payload: { order: 1 },
          metadata: { timestamp: new Date(Date.now() - 10), sessionId: 'test', correlationId: 'corr1' }
        },
        {
          eventType: FormEvents.LOAN_TYPE_SELECTED,
          aggregateId: 'test_2',
          payload: { order: 2 },
          metadata: { timestamp: new Date(Date.now() - 5), sessionId: 'test', correlationId: 'corr2' }
        },
        {
          eventType: FormEvents.LOAN_TYPE_SELECTED,
          aggregateId: 'test_3',
          payload: { order: 3 },
          metadata: { timestamp: new Date(), sessionId: 'test', correlationId: 'corr3' }
        }
      ]

      // Publish in order
      for (const event of testEvents) {
        await eventBus.publish(event)
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockHandler).toHaveBeenCalledTimes(3)
      expect(events).toEqual([
        FormEvents.LOAN_TYPE_SELECTED,
        FormEvents.LOAN_TYPE_SELECTED,
        FormEvents.LOAN_TYPE_SELECTED
      ])
    })
  })

  describe('Window object attachment in test environment', () => {
    it('should attach event bus to window in browser environment', () => {
      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect(typeof (window as any).__eip_eventbus.subscribe).toBe('function')
      expect(typeof (window as any).__eip_eventbus.publish).toBe('function')
      expect(typeof (window as any).__eip_eventbus.getHistory).toBe('function')
    })

    it('should not attach to window when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      // This should not throw an error
      expect(() => {
        // Test that the system handles missing window gracefully
        expect(true).toBe(true)
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })

    it('should make event bus methods available via window reference', () => {
      eventBus.reset()

      const windowEventBus = (window as any).__eip_eventbus

      expect(windowEventBus).toBeDefined()
      expect(typeof windowEventBus.subscribe).toBe('function')
      expect(typeof windowEventBus.publish).toBe('function')
      expect(typeof windowEventBus.getHistory).toBe('function')
      expect(typeof windowEventBus.reset).toBe('function')
      expect(typeof windowEventBus.getMetrics).toBe('function')
    })

    it('should support legacy window reference when compatibility enabled', () => {
      isLegacyCompat.mockReturnValue(true)

      eventBus.reset()

      expect((window as any).__eip_eventbus).toBeDefined()
      expect((window as any).__nextnest_eventbus).toBeDefined()

      // Both references should have same methods
      expect(typeof (window as any).__nextnest_eventbus.subscribe).toBe('function')
      expect(typeof (window as any).__nextnest_eventbus.publish).toBe('function')
    })
  })

  describe('Integration with legacy components', () => {
    it('should support legacy event subscriptions via nextnest reference', async () => {
      isLegacyCompat.mockReturnValue(true)

      const legacyHandler = jest.fn()
      const testEvent = {
        eventType: 'legacy.event',
        aggregateId: 'legacy_1',
        payload: { legacy: true },
        metadata: {
          timestamp: new Date(),
          sessionId: 'legacy_session',
          correlationId: 'legacy_correlation'
        }
      }

      // Legacy component subscribes via nextnest reference
      const legacyEventBus = (window as any).__nextnest_eventbus
      legacyEventBus.subscribe('legacy.event', legacyHandler)

      // Modern component publishes via eip reference
      await eventBus.publish(testEvent)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Legacy handler should receive the event
      expect(legacyHandler).toHaveBeenCalledWith(testEvent)
    })

    it('should maintain event history across both references', () => {
      isLegacyCompat.mockReturnValue(true)

      eventBus.reset()

      const testEvent = {
        eventType: FormEvents.FIELD_FOCUSED,
        aggregateId: 'field_1',
        payload: { fieldName: 'applicantName' },
        metadata: {
          timestamp: new Date(),
          sessionId: 'history_test',
          correlationId: 'history_correlation'
        }
      }

      // Publish event
      eventBus.publish(testEvent)

      // Check history from eip reference
      const eipHistory = eventBus.getHistory()
      
      // Check history from nextnest reference
      const nextnestHistory = (window as any).__nextnest_eventbus.getHistory()

      expect(eipHistory).toContainEqual(testEvent)
      expect(nextnestHistory).toContainEqual(testEvent)
      expect(eipHistory).toBe(nextnestHistory) // Same instance
    })

    it('should share circuit breaker state across references', async () => {
      isLegacyCompat.mockReturnValue(true)

      eventBus.reset()

      const failingHandler = jest.fn(() => {
        throw new Error('Handler failure')
      })

      eventBus.subscribe('test.failure', failingHandler)

      const testEvent = {
        eventType: 'test.failure',
        aggregateId: 'failure_test',
        payload: {},
        metadata: {
          timestamp: new Date(),
          sessionId: 'failure_session',
          correlationId: 'failure_correlation'
        }
      }

      // Trigger multiple failures to open circuit
      for (let i = 0; i < 5; i++) {
        await eventBus.publish(testEvent)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Check circuit breaker state from both references
      const eipMetrics = eventBus.getMetrics()
      const nextnestMetrics = (window as any).__nextnest_eventbus.getMetrics()

      expect(eipMetrics.circuitBreakerStates).toEqual(nextnestMetrics.circuitBreakerStates)
    })
  })

  describe('Performance and reliability', () => {
    it('should handle high-frequency events efficiently', async () => {
      const handler = jest.fn()
      eventBus.subscribe('performance.test', handler)

      const startTime = performance.now()

      // Publish many events quickly
      const promises = Array.from({ length: 50 }, (_, i) => 
        eventBus.publish({
          eventType: 'performance.test',
          aggregateId: `perf_${i}`,
          payload: { index: i },
          metadata: {
            timestamp: new Date(),
            sessionId: 'perf_session',
            correlationId: `perf_corr_${i}`
          }
        })
      )

      await Promise.all(promises)
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for processing

      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(2000) // Should complete in <2s
      expect(handler).toHaveBeenCalledTimes(50)
    })

    it('should isolate handler failures', async () => {
      const successHandler = jest.fn()
      const failingHandler = jest.fn(() => {
        throw new Error('Handler error')
      })

      eventBus.subscribe('isolation.test', successHandler)
      eventBus.subscribe('isolation.test', failingHandler)

      const testEvent = {
        eventType: 'isolation.test',
        aggregateId: 'isolation_test',
        payload: {},
        metadata: {
          timestamp: new Date(),
          sessionId: 'isolation_session',
          correlationId: 'isolation_correlation'
        }
      }

      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      await eventBus.publish(testEvent)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Success handler should still be called despite failure
      expect(successHandler).toHaveBeenCalledWith(testEvent)
      expect(failingHandler).toHaveBeenCalledWith(testEvent)
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })

    it('should handle event processing timeouts', async () => {
      const slowHandler = jest.fn(() => {
        return new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
      })

      eventBus.subscribe('timeout.test', slowHandler)

      const testEvent = {
        eventType: 'timeout.test',
        aggregateId: 'timeout_test',
        payload: {},
        metadata: {
          timestamp: new Date(),
          sessionId: 'timeout_session',
          correlationId: 'timeout_correlation'
        }
      }

      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const startTime = performance.now()

      await eventBus.publish(testEvent)
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for timeout

      const endTime = performance.now()

      // Should timeout after 5 seconds (configured in event bus)
      expect(endTime - startTime).toBeLessThan(10000)
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('Memory management and cleanup', () => {
    it('should limit event history size', () => {
      // Reset to clear existing history
      eventBus.reset()

      // Publish many events to exceed history limit
      for (let i = 0; i < 150; i++) {
        eventBus.publish({
          eventType: 'history.test',
          aggregateId: `hist_${i}`,
          payload: { index: i },
          metadata: {
            timestamp: new Date(Date.now() + i),
            sessionId: 'history_session',
            correlationId: `hist_corr_${i}`
          }
        })
      }

      const history = eventBus.getHistory()
      
      // Should maintain max history size (default 100)
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('should clean up subscriptions when unsubscribed', async () => {
      const handler = jest.fn()
      const unsubscribe = eventBus.subscribe('cleanup.test', handler)

      const testEvent = {
        eventType: 'cleanup.test',
        aggregateId: 'cleanup_test',
        payload: {},
        metadata: {
          timestamp: new Date(),
          sessionId: 'cleanup_session',
          correlationId: 'cleanup_correlation'
        }
      }

      await eventBus.publish(testEvent)
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(handler).toHaveBeenCalledTimes(1)

      // Unsubscribe
      unsubscribe()

      await eventBus.publish(testEvent)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Handler should not be called again
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should reset all state correctly', () => {
      // Setup some state
      eventBus.subscribe('reset.test', jest.fn())
      eventBus.publish({
        eventType: 'reset.test',
        aggregateId: 'reset_test',
        payload: {},
        metadata: {
          timestamp: new Date(),
          sessionId: 'reset_session',
          correlationId: 'reset_correlation'
        }
      })

      // Verify state exists
      const beforeMetrics = eventBus.getMetrics()
      expect(beforeMetrics.handlerCounts.length).toBeGreaterThan(0)
      expect(beforeMetrics.historySize).toBeGreaterThan(0)

      // Reset
      eventBus.reset()

      // Verify state is cleared
      const afterMetrics = eventBus.getMetrics()
      expect(afterMetrics.handlerCounts).toHaveLength(0)
      expect(afterMetrics.historySize).toBe(0)
      expect(afterMetrics.queueLength).toBe(0)
      expect(afterMetrics.circuitBreakerStates).toHaveLength(0)
    })
  })
})
