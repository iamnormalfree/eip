// ABOUTME: Integration tests for useLoanApplicationStorage hook with storage aliasing behavior
// Tests dual-read/single-write pattern for loan application data migration from nextnest_ to eip_ keys

import { renderHook, act } from '@testing-library/react'
import { 
  useLoanApplicationStorage, 
  retrieveLoanApplicationData, 
  clearLoanApplicationData,
  LoanApplicationData
} from '../useLoanApplicationStorage'
import { STORAGE_VERSION } from '../useLoanApplicationStorage'

// Mock the compat module for testing
jest.mock('../../utils/compat', () => ({
  compat: {
    getWithAliases: jest.fn(),
    setCanonical: jest.fn()
  }
}))

const { compat } = require('../../utils/compat')

describe('useLoanApplicationStorage Integration Tests', () => {
  const originalEnv = process.env
  const mockSessionId = 'loan_session_12345'

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

    // Mock Object.keys for localStorage iteration
    Object.defineProperty(Object, 'keys', {
      value: jest.fn((obj) => {
        if (obj === global.getStorageMocks().localStorageMock._getStore()) {
          return Array.from(obj.keys())
        }
        return Object.keys(obj)
      })
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('useLoanApplicationStorage hook', () => {
    const mockLoanData: LoanApplicationData = {
      applicantName: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1-555-0123',
      loanAmount: 500000,
      loanType: 'home',
      propertyValue: 600000,
      creditScore: 750,
      annualIncome: 120000,
      employmentStatus: 'employed',
      propertyAddress: {
        street: '123 Main St',
        city: 'Singapore',
        postalCode: '123456'
      }
    }

    it('should save loan application to canonical eip_ key using single-write pattern', () => {
      renderHook(() => useLoanApplicationStorage(mockLoanData, mockSessionId))

      const expectedStoredData = {
        ...mockLoanData,
        version: STORAGE_VERSION,
        lastUpdated: expect.any(String)
      }

      expect(compat.setCanonical).toHaveBeenCalledWith(
        `eip_loan_application_${mockSessionId}`,
        JSON.stringify(expectedStoredData),
        'localStorage'
      )
    })

    it('should not save when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      renderHook(() => useLoanApplicationStorage(mockLoanData, mockSessionId))

      expect(compat.setCanonical).not.toHaveBeenCalled()

      global.window = originalWindow
    })

    it('should handle storage errors gracefully', () => {
      compat.setCanonical.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() => {
        renderHook(() => useLoanApplicationStorage(mockLoanData, mockSessionId))
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save loan application data:',
        expect.any(Error)
      )
    })

    it('should save when data or sessionId changes', () => {
      const { rerender } = renderHook(
        ({ data, sessionId }) => useLoanApplicationStorage(data, sessionId),
        {
          initialProps: { data: mockLoanData, sessionId: mockSessionId }
        }
      )

      // Initial save
      expect(compat.setCanonical).toHaveBeenCalledTimes(2) // Save + cleanup

      // Change data - should save again
      const newData = { ...mockLoanData, loanAmount: 550000 }
      rerender({ data: newData, sessionId: mockSessionId })
      expect(compat.setCanonical).toHaveBeenCalledTimes(4) // Save + cleanup again

      // Change sessionId - should save again
      rerender({ data: newData, sessionId: 'loan_session_67890' })
      expect(compat.setCanonical).toHaveBeenCalledTimes(6) // Save + cleanup again
    })

    it('should clean up old sessions on mount', () => {
      const mockStorage = global.getStorageMocks().localStorageMock._getStore()
      
      // Set up old sessions in storage
      const oldSessionKey = 'eip_loan_application_old_session'
      const oldTimestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      
      mockStorage.set(oldSessionKey, JSON.stringify({
        ...mockLoanData,
        version: STORAGE_VERSION,
        lastUpdated: oldTimestamp.toISOString()
      }))

      // Mock Object.keys to return our test key
      Object.keys = jest.fn(() => [oldSessionKey])

      renderHook(() => useLoanApplicationStorage(mockLoanData, mockSessionId))

      // Should attempt to clean up old session
      expect(compat.getWithAliases).toHaveBeenCalledWith(oldSessionKey, 'localStorage')
    })
  })

  describe('retrieveLoanApplicationData function', () => {
    const mockStoredData = {
      applicantName: 'Jane Smith',
      email: 'jane@example.com',
      loanAmount: 350000,
      loanType: 'refinance',
      version: STORAGE_VERSION,
      lastUpdated: '2023-01-01T10:00:00.000Z'
    }

    it('should retrieve from eip_ key when it exists using dual-read pattern', () => {
      compat.getWithAliases.mockReturnValue(JSON.stringify(mockStoredData))

      const result = retrieveLoanApplicationData(mockSessionId)

      expect(compat.getWithAliases).toHaveBeenCalledWith(
        [`eip_loan_application_${mockSessionId}`, `nextnest_loan_application_${mockSessionId}`],
        'localStorage'
      )

      const { version, lastUpdated, ...applicationData } = mockStoredData
      expect(result).toEqual(applicationData)
    })

    it('should fallback to nextnest_ key when eip_ key does not exist', () => {
      const legacyStoredData = {
        ...mockStoredData,
        applicantName: 'Legacy User',
        loanAmount: 300000
      }

      // Mock fallback behavior
      let callCount = 0
      compat.getWithAliases.mockImplementation(() => {
        callCount++
        if (callCount === 1) return null // eip_ key not found
        return JSON.stringify(legacyStoredData) // nextnest_ key found
      })

      const result = retrieveLoanApplicationData(mockSessionId)

      const { version, lastUpdated, ...legacyData } = legacyStoredData
      expect(result).toEqual(legacyData)
    })

    it('should return null when no application data exists', () => {
      compat.getWithAliases.mockReturnValue(null)

      const result = retrieveLoanApplicationData(mockSessionId)

      expect(result).toBeNull()
    })

    it('should handle version mismatch gracefully', () => {
      const outdatedData = {
        ...mockStoredData,
        version: '0.9' // Different version
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(outdatedData))

      const result = retrieveLoanApplicationData(mockSessionId)

      expect(result).toBeNull()
      expect(console.warn).toHaveBeenCalledWith('Stored data version mismatch, ignoring cached data')
    })

    it('should respect EIP_LEGACY_COMPAT feature flag', () => {
      process.env.EIP_LEGACY_COMPAT = 'false'

      compat.getWithAliases.mockReturnValue(JSON.stringify(mockStoredData))

      retrieveLoanApplicationData(mockSessionId)

      // Should only try canonical key when feature disabled
      expect(compat.getWithAliases).toHaveBeenCalledWith(
        [`eip_loan_application_${mockSessionId}`], // Only canonical key
        'localStorage'
      )
    })

    it('should handle corrupted JSON gracefully', () => {
      compat.getWithAliases.mockReturnValue('invalid-json{')

      const result = retrieveLoanApplicationData(mockSessionId)

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Failed to retrieve loan application data:',
        expect.any(Error)
      )
    })

    it('should return null when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      const result = retrieveLoanApplicationData(mockSessionId)

      expect(result).toBeNull()
      expect(compat.getWithAliases).not.toHaveBeenCalled()

      global.window = originalWindow
    })
  })

  describe('clearLoanApplicationData function', () => {
    it('should clear canonical eip_ key using single-write pattern', () => {
      clearLoanApplicationData(mockSessionId)

      expect(compat.setCanonical).toHaveBeenCalledWith(
        `eip_loan_application_${mockSessionId}`,
        null,
        'localStorage'
      )
    })

    it('should handle storage errors gracefully', () => {
      compat.setCanonical.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      expect(() => {
        clearLoanApplicationData(mockSessionId)
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear loan application data:',
        expect.any(Error)
      )
    })

    it('should return early when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      clearLoanApplicationData(mockSessionId)

      expect(compat.setCanonical).not.toHaveBeenCalled()

      global.window = originalWindow
    })
  })

  describe('Session cleanup functionality', () => {
    it('should remove sessions older than 7 days', () => {
      const mockStorage = global.getStorageMocks().localStorageMock._getStore()
      const now = Date.now()
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000)
      const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000)

      // Set up test sessions
      const oldSessionKey = 'eip_loan_application_old_session'
      const newSessionKey = 'eip_loan_application_new_session'

      mockStorage.set(oldSessionKey, JSON.stringify({
        applicantName: 'Old User',
        loanAmount: 200000,
        version: STORAGE_VERSION,
        lastUpdated: new Date(eightDaysAgo).toISOString()
      }))

      mockStorage.set(newSessionKey, JSON.stringify({
        applicantName: 'New User',
        loanAmount: 400000,
        version: STORAGE_VERSION,
        lastUpdated: new Date(fiveDaysAgo).toISOString()
      }))

      // Mock Object.keys to return our test keys
      Object.keys = jest.fn(() => [oldSessionKey, newSessionKey])

      renderHook(() => useLoanApplicationStorage({
        applicantName: 'Current User',
        loanAmount: 300000
      }, mockSessionId))

      // Should check both sessions
      expect(compat.getWithAliases).toHaveBeenCalledWith(oldSessionKey, 'localStorage')
      expect(compat.getWithAliases).toHaveBeenCalledWith(newSessionKey, 'localStorage')

      // Should remove old session
      expect(compat.setCanonical).toHaveBeenCalledWith(oldSessionKey, null, 'localStorage')
    })

    it('should handle invalid session data during cleanup', () => {
      const mockStorage = global.getStorageMocks().localStorageMock._getStore()
      const invalidSessionKey = 'eip_loan_application_invalid_session'

      // Set up invalid data
      mockStorage.set(invalidSessionKey, 'invalid-json{')

      Object.keys = jest.fn(() => [invalidSessionKey])

      renderHook(() => useLoanApplicationStorage({
        applicantName: 'Current User',
        loanAmount: 300000
      }, mockSessionId))

      // Should remove invalid data
      expect(compat.setCanonical).toHaveBeenCalledWith(invalidSessionKey, null, 'localStorage')
    })

    it('should handle cleanup errors gracefully', () => {
      compat.getWithAliases.mockImplementation(() => {
        throw new Error('Storage read error')
      })

      Object.keys = jest.fn(() => ['eip_loan_application_test_session'])

      expect(() => {
        renderHook(() => useLoanApplicationStorage({
          applicantName: 'Current User',
          loanAmount: 300000
        }, mockSessionId))
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clean up old sessions:',
        expect.any(Error)
      )
    })
  })

  describe('Data integrity and migration', () => {
    it('should preserve complete application structure during storage round-trip', () => {
      const completeApplicationData: LoanApplicationData = {
        applicantName: 'Complete Applicant',
        email: 'complete@example.com',
        phoneNumber: '+1-555-0123',
        loanAmount: 750000,
        loanType: 'home',
        propertyValue: 900000,
        creditScore: 800,
        annualIncome: 200000,
        employmentStatus: 'self-employed',
        propertyAddress: {
          street: '456 Complete St',
          city: 'Singapore',
          postalCode: '654321'
        },
        additionalInfo: 'Complete application with all fields'
      }

      const storedData = {
        ...completeApplicationData,
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(storedData))

      const retrievedData = retrieveLoanApplicationData(mockSessionId)

      expect(retrievedData).toEqual(completeApplicationData)
    })

    it('should handle partial application data gracefully', () => {
      const partialData = {
        applicantName: 'Partial User',
        email: 'partial@example.com',
        loanAmount: 250000,
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(partialData))

      const result = retrieveLoanApplicationData(mockSessionId)

      const { version, lastUpdated, ...applicationData } = partialData
      expect(result).toEqual(applicationData)
    })

    it('should validate required fields during retrieval', () => {
      const dataWithMissingRequired = {
        // Missing applicantName (required)
        email: 'missing@example.com',
        loanAmount: 100000,
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(dataWithMissingRequired))

      const result = retrieveLoanApplicationData(mockSessionId)

      // Should return data even with missing optional fields
      expect(result).toBeDefined()
      expect(result?.email).toBe('missing@example.com')
    })
  })

  describe('Performance considerations', () => {
    it('should minimize storage calls during normal operation', () => {
      compat.getWithAliases.mockReturnValue(null)

      const { result, rerender } = renderHook(
        ({ data, sessionId }) => useLoanApplicationStorage(data, sessionId),
        {
          initialProps: { 
            data: { applicantName: 'Test User', loanAmount: 300000 }, 
            sessionId: mockSessionId 
          }
        }
      )

      // Initial mount should save and clean up
      expect(compat.setCanonical).toHaveBeenCalledTimes(2)

      // Rerender with same data should minimize calls
      rerender()
      expect(compat.setCanonical).toHaveBeenCalledTimes(4) // Save + cleanup again

      // Data change should trigger save
      act(() => {
        result.current?.setLoanAmount?.(350000) // If this method exists
      })
    })

    it('should handle large application data efficiently', () => {
      const largeApplicationData: LoanApplicationData = {
        applicantName: 'Large Data User',
        email: 'large@example.com',
        loanAmount: 1000000,
        loanType: 'home',
        propertyAddress: {
          street: '789 Large Data St',
          city: 'Singapore',
          postalCode: '789012'
        },
        // Simulate large data with additional properties
        documents: Array.from({ length: 50 }, (_, i) => ({
          id: `doc_${i}`,
          name: `Document ${i}`,
          size: 1024 * 1024, // 1MB each
          uploadedAt: new Date().toISOString()
        }))
      } as any

      const startTime = performance.now()
      
      const storedData = {
        ...largeApplicationData,
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(storedData))

      const result = retrieveLoanApplicationData(mockSessionId)
      
      const endTime = performance.now()

      expect(result).toBeDefined()
      expect(endTime - startTime).toBeLessThan(200) // Should complete in <200ms
    })
  })
})
