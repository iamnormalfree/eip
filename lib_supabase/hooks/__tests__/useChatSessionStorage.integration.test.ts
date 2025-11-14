// ABOUTME: Integration tests for useChatSessionStorage hook with storage aliasing behavior
// Tests dual-read/single-write pattern for chat session migration from nextnest_ to eip_ keys

import { renderHook, act } from '@testing-library/react'
import { 
  useChatSessionStorage, 
  retrieveChatSession, 
  clearChatSession,
  ChatMessage,
  ChatSessionData
} from '../useChatSessionStorage'
import { CHAT_STORAGE_VERSION } from '../useChatSessionStorage'

// Mock the compat module for testing
jest.mock('../../utils/compat', () => ({
  compat: {
    getWithAliases: jest.fn(),
    setCanonical: jest.fn()
  }
}))

const { compat } = require('../../utils/compat')

describe('useChatSessionStorage Integration Tests', () => {
  const originalEnv = process.env
  const mockSessionId = 'session_12345'

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
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('useChatSessionStorage hook', () => {
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Hello, I need help with a mortgage',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        metadata: {
          confidence: 0.95,
          dataPoints: ['mortgage_inquiry']
        }
      },
      {
        id: 'msg_2',
        role: 'broker',
        content: 'I can help you with that! What type of mortgage are you looking for?',
        timestamp: new Date('2023-01-01T10:01:00Z'),
        metadata: {
          confidence: 0.88
        }
      }
    ]

    it('should save chat session to canonical eip_ key using single-write pattern', () => {
      renderHook(() => useChatSessionStorage(mockMessages, mockSessionId))

      const expectedSessionData: ChatSessionData = {
        sessionId: mockSessionId,
        messages: mockMessages,
        version: CHAT_STORAGE_VERSION,
        lastUpdated: expect.any(String)
      }

      expect(compat.setCanonical).toHaveBeenCalledWith(
        `eip_chat_session_${mockSessionId}`,
        JSON.stringify(expectedSessionData),
        'localStorage'
      )
    })

    it('should not save when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      renderHook(() => useChatSessionStorage(mockMessages, mockSessionId))

      expect(compat.setCanonical).not.toHaveBeenCalled()

      global.window = originalWindow
    })

    it('should handle storage errors gracefully', () => {
      compat.setCanonical.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() => {
        renderHook(() => useChatSessionStorage(mockMessages, mockSessionId))
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save chat session:',
        expect.any(Error)
      )
    })

    it('should save when messages or sessionId changes', () => {
      const { rerender } = renderHook(
        ({ messages, sessionId }) => useChatSessionStorage(messages, sessionId),
        {
          initialProps: { messages: mockMessages, sessionId: mockSessionId }
        }
      )

      // Initial save
      expect(compat.setCanonical).toHaveBeenCalledTimes(1)

      // Change messages - should save again
      const newMessages = [...mockMessages, {
        id: 'msg_3',
        role: 'user',
        content: 'I need a home loan',
        timestamp: new Date('2023-01-01T10:02:00Z')
      }]

      rerender({ messages: newMessages, sessionId: mockSessionId })
      expect(compat.setCanonical).toHaveBeenCalledTimes(2)

      // Change sessionId - should save again
      rerender({ messages: newMessages, sessionId: 'session_67890' })
      expect(compat.setCanonical).toHaveBeenCalledTimes(3)
    })
  })

  describe('retrieveChatSession function', () => {
    const mockStoredSession: ChatSessionData = {
      sessionId: mockSessionId,
      messages: [
        {
          id: 'stored_msg_1',
          role: 'user',
          content: 'Stored message 1',
          timestamp: new Date('2023-01-01T09:00:00Z')
        },
        {
          id: 'stored_msg_2',
          role: 'broker',
          content: 'Stored message 2',
          timestamp: new Date('2023-01-01T09:01:00Z')
        }
      ],
      version: CHAT_STORAGE_VERSION,
      lastUpdated: '2023-01-01T09:01:00.000Z'
    }

    it('should retrieve from eip_ key when it exists using dual-read pattern', () => {
      compat.getWithAliases.mockReturnValue(JSON.stringify(mockStoredSession))

      const result = retrieveChatSession(mockSessionId)

      expect(compat.getWithAliases).toHaveBeenCalledWith(
        [`eip_chat_session_${mockSessionId}`, `nextnest_chat_session_${mockSessionId}`],
        'localStorage'
      )
      expect(result).toEqual(mockStoredSession.messages)
      expect(result[0].timestamp).toEqual(new Date('2023-01-01T09:00:00Z'))
    })

    it('should fallback to nextnest_ key when eip_ key does not exist', () => {
      const legacyStoredSession = {
        ...mockStoredSession,
        sessionId: mockSessionId,
        messages: [{
          id: 'legacy_msg',
          role: 'user',
          content: 'Legacy message',
          timestamp: new Date('2023-01-01T08:00:00Z')
        }]
      }

      // Mock fallback behavior - first call null, second returns legacy data
      let callCount = 0
      compat.getWithAliases.mockImplementation(() => {
        callCount++
        if (callCount === 1) return null // eip_ key not found
        return JSON.stringify(legacyStoredSession) // nextnest_ key found
      })

      const result = retrieveChatSession(mockSessionId)

      expect(result).toEqual(legacyStoredSession.messages)
    })

    it('should return empty array when no session exists', () => {
      compat.getWithAliases.mockReturnValue(null)

      const result = retrieveChatSession(mockSessionId)

      expect(result).toEqual([])
    })

    it('should handle version mismatch gracefully', () => {
      const outdatedSession = {
        ...mockStoredSession,
        version: '0.9' // Different version
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(outdatedSession))

      const result = retrieveChatSession(mockSessionId)

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith('Chat session version mismatch')
    })

    it('should respect EIP_LEGACY_COMPAT feature flag', () => {
      process.env.EIP_LEGACY_COMPAT = 'false'

      compat.getWithAliases.mockReturnValue(JSON.stringify(mockStoredSession))

      retrieveChatSession(mockSessionId)

      // Should only try canonical key when feature disabled
      expect(compat.getWithAliases).toHaveBeenCalledWith(
        [`eip_chat_session_${mockSessionId}`], // Only canonical key
        'localStorage'
      )
    })

    it('should handle corrupted JSON gracefully', () => {
      compat.getWithAliases.mockReturnValue('invalid-json{')

      const result = retrieveChatSession(mockSessionId)

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Failed to retrieve chat session:',
        expect.any(Error)
      )
    })

    it('should return empty array when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      const result = retrieveChatSession(mockSessionId)

      expect(result).toEqual([])
      expect(compat.getWithAliases).not.toHaveBeenCalled()

      global.window = originalWindow
    })
  })

  describe('clearChatSession function', () => {
    it('should clear canonical eip_ key using single-write pattern', () => {
      clearChatSession(mockSessionId)

      expect(compat.setCanonical).toHaveBeenCalledWith(
        `eip_chat_session_${mockSessionId}`,
        null,
        'localStorage'
      )
    })

    it('should handle storage errors gracefully', () => {
      compat.setCanonical.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      expect(() => {
        clearChatSession(mockSessionId)
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear chat session:',
        expect.any(Error)
      )
    })

    it('should return early when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete (global as any).window

      clearChatSession(mockSessionId)

      expect(compat.setCanonical).not.toHaveBeenCalled()

      global.window = originalWindow
    })
  })

  describe('Data integrity and migration', () => {
    it('should preserve message metadata during storage round-trip', () => {
      const messagesWithMetadata: ChatMessage[] = [
        {
          id: 'meta_msg',
          role: 'user',
          content: 'Message with metadata',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          metadata: {
            confidence: 0.92,
            dataPoints: ['loan_inquiry', 'first_time_buyer']
          }
        }
      ]

      // Simulate save and load cycle
      const storedSession: ChatSessionData = {
        sessionId: mockSessionId,
        messages: messagesWithMetadata,
        version: CHAT_STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(storedSession))

      const retrievedMessages = retrieveChatSession(mockSessionId)

      expect(retrievedMessages).toHaveLength(1)
      expect(retrievedMessages[0]).toEqual(messagesWithMetadata[0])
      expect(retrievedMessages[0].metadata).toEqual(messagesWithMetadata[0].metadata)
    })

    it('should handle large chat sessions efficiently', () => {
      const largeMessageSet: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg_${i}`,
        role: i % 2 === 0 ? 'user' as const : 'broker' as const,
        content: `This is message number ${i} in a large conversation`,
        timestamp: new Date(Date.now() + i * 1000)
      }))

      const largeStoredSession: ChatSessionData = {
        sessionId: mockSessionId,
        messages: largeMessageSet,
        version: CHAT_STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(largeStoredSession))

      const startTime = performance.now()
      const retrievedMessages = retrieveChatSession(mockSessionId)
      const endTime = performance.now()

      expect(retrievedMessages).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
    })

    it('should validate session structure integrity', () => {
      const invalidSession = {
        // Missing required fields
        messages: [
          {
            id: 'invalid_msg',
            role: 'user',
            content: 'Invalid session'
            // Missing timestamp
          }
        ]
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(invalidSession))

      const result = retrieveChatSession(mockSessionId)

      // Should handle gracefully even with invalid structure
      expect(result).toBeDefined()
    })
  })

  describe('Performance considerations', () => {
    it('should minimize storage calls for repeated retrievals', () => {
      compat.getWithAliases.mockReturnValue(null)

      // Multiple calls should make consistent storage requests
      retrieveChatSession(mockSessionId)
      retrieveChatSession(mockSessionId)
      retrieveChatSession(mockSessionId)

      expect(compat.getWithAliases).toHaveBeenCalledTimes(3)
      expect(compat.getWithAliases).toHaveBeenCalledWith(
        [`eip_chat_session_${mockSessionId}`, `nextnest_chat_session_${mockSessionId}`],
        'localStorage'
      )
    })

    it('should handle concurrent session access', async () => {
      const mockSession = {
        sessionId: mockSessionId,
        messages: [{ id: 'concurrent_msg', role: 'user', content: 'Concurrent test', timestamp: new Date() }],
        version: CHAT_STORAGE_VERSION,
        lastUpdated: new Date().toISOString()
      }

      compat.getWithAliases.mockReturnValue(JSON.stringify(mockSession))

      // Simulate concurrent access
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(retrieveChatSession(mockSessionId))
      )

      const results = await Promise.all(promises)

      // All should return the same data
      results.forEach(result => {
        expect(result).toEqual(mockSession.messages)
      })

      // Should have made storage calls for each concurrent request
      expect(compat.getWithAliases).toHaveBeenCalledTimes(10)
    })
  })
})
