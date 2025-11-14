// ABOUTME: Test suite for useChatwootConversation hook - TDD approach for Phase 1

import { renderHook, waitFor } from '@testing-library/react'
import { useChatwootConversation } from '../useChatwootConversation'

// Mock sessionManager
jest.mock('../utils/session-manager', () => ({
  sessionManager: {
    getChatwootSession: jest.fn(),
    setChatwootSession: jest.fn()
  }
}))

import { sessionManager } from '../utils/session-manager'
const mockGetChatwootSession = sessionManager.getChatwootSession as jest.MockedFunction<
  typeof sessionManager.getChatwootSession
>
const mockSetChatwootSession = sessionManager.setChatwootSession as jest.MockedFunction<
  typeof sessionManager.setChatwootSession
>

global.fetch = jest.fn()

describe('useChatwootConversation - initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('fetches messages on mount and starts polling', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        messages: [
          {
            id: 1,
            content: 'Hello',
            message_type: 'incoming',
            created_at: '2025-11-03T10:00:00Z',
            sender: { type: 'contact', name: 'Test User' },
            private: false
          }
        ]
      })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({ conversationId: 123 })
    )

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.messages).toHaveLength(1)

    // Advance timers to trigger polling
    jest.advanceTimersByTime(3000)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  })
})

describe('useChatwootConversation - sendMessage & errors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Don't use fake timers for sendMessage tests (interferes with React state)
  })

  afterEach(() => {
    // Cleanup any timers
  })

  it('sends message with optimistic update and API call', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({ conversationId: 123 })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Set message directly in hook state
    result.current.setInputMessage('Test message')

    // Mock send API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: { id: 999, created_at: '2025-11-03T10:05:00Z' }
      })
    })

    // Send message (internally reads from inputMessage state)
    await result.current.sendMessage()

    // Verify optimistic message added
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0)
      expect(result.current.messages[0].content).toBe('Test message')
    })

    // Verify API was called
    const sendCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => call[0] === '/api/chat/send'
    )
    expect(sendCall).toBeDefined()
    expect(sendCall[1].method).toBe('POST')
  })

  it('prevents double-sends when isSending is true', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({ conversationId: 123 })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Set message
    result.current.setInputMessage('Test')

    // Mock slow send response
    let sendResolve: any
    const sendPromise = new Promise((resolve) => {
      sendResolve = resolve
    })

    (global.fetch as jest.Mock).mockImplementationOnce(
      () => sendPromise.then(() => ({
        ok: true,
        json: async () => ({ message: { id: 999 } })
      }))
    )

    // Call sendMessage twice rapidly
    result.current.sendMessage()
    result.current.sendMessage() // Should be blocked by guard

    await waitFor(() => expect(result.current.isSending).toBe(true))

    // Count POST calls to /api/chat/send - should only be ONE
    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[0] === '/api/chat/send' && call[1]?.method === 'POST'
    )
    expect(postCalls).toHaveLength(1) // Only ONE POST!

    // Complete the send
    sendResolve()
    await waitFor(() => expect(result.current.isSending).toBe(false))
  })

  it('sets error state when fetch fails', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    const { result } = renderHook(() =>
      useChatwootConversation({ conversationId: 123 })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Failed to load messages')
  })

  it('handles malformed data when messages is not an array', async () => {
    // Mock malformed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: 'not an array' })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({ conversationId: 123 })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Unexpected data format')
    expect(result.current.messages).toHaveLength(0)
  })
})

describe('useChatwootConversation - conversationId swap & prefill', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resets state when conversationId prop changes', async () => {
    // Mock first conversation
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        messages: [
          {
            id: 1,
            content: 'Message from conv 123',
            message_type: 'incoming',
            created_at: '2025-11-03T10:00:00Z',
            sender: { type: 'contact', name: 'User' },
            private: false
          }
        ]
      })
    })

    const { result, rerender } = renderHook(
      ({ conversationId }) => useChatwootConversation({ conversationId }),
      { initialProps: { conversationId: 123 } }
    )

    await waitFor(() => expect(result.current.messages).toHaveLength(1))
    expect(result.current.messages[0].content).toBe('Message from conv 123')

    // Mock new conversation
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        messages: [
          {
            id: 10,
            content: 'Message from conv 456',
            message_type: 'incoming',
            created_at: '2025-11-03T11:00:00Z',
            sender: { type: 'contact', name: 'User' },
            private: false
          }
        ]
      })
    })

    // Change conversationId
    rerender({ conversationId: 456 })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('Message from conv 456')
  })

  it('hydrates inputMessage when prefillMessage provided', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({
        conversationId: 123,
        prefillMessage: 'Prefilled text'
      })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // inputMessage should be hydrated with prefillMessage
    await waitFor(() =>
      expect(result.current.inputMessage).toBe('Prefilled text')
    )
  })

  it('updates inputMessage when prefillMessage changes', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] })
    })

    const { result, rerender } = renderHook(
      ({ prefillMessage }) =>
        useChatwootConversation({
          conversationId: 123,
          prefillMessage
        }),
      { initialProps: { prefillMessage: 'First message' } }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() =>
      expect(result.current.inputMessage).toBe('First message')
    )

    // Change prefillMessage
    rerender({ prefillMessage: 'Second message' })

    // inputMessage should update
    await waitFor(() =>
      expect(result.current.inputMessage).toBe('Second message')
    )
  })
})

describe('useChatwootConversation - session manager integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetChatwootSession.mockClear()
    mockSetChatwootSession.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('updates sessionManager once after initial fetch, not on polling', async () => {
    // Mock existing session
    mockGetChatwootSession.mockReturnValue({ conversationId: 123 })

    // Mock fetch with broker persona data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: [],
        conversation: {
          custom_attributes: {
            broker_name: 'Jasmine Lee',
            broker_avatar: 'https://example.com/avatar.jpg'
          }
        }
      })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({
        conversationId: 123,
        sessionId: 'test-session-id'
      })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Verify sessionManager.setChatwootSession called once with broker name
    expect(mockSetChatwootSession).toHaveBeenCalledTimes(1)
    expect(mockSetChatwootSession).toHaveBeenCalledWith('test-session-id', {
      conversationId: 123,
      brokerName: 'Jasmine Lee'
    })

    // Advance timers to trigger polling
    jest.advanceTimersByTime(3000)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))

    // Verify sessionManager NOT called again during polling
    expect(mockSetChatwootSession).toHaveBeenCalledTimes(1) // Still 1!
  })

  it('skips sessionManager update when sessionId not provided', async () => {
    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        messages: [],
        conversation: {
          custom_attributes: {
            broker_name: 'Jasmine Lee',
            broker_avatar: 'https://example.com/avatar.jpg'
          }
        }
      })
    })

    const { result } = renderHook(() =>
      useChatwootConversation({ conversationId: 123 })
      // No sessionId provided
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Verify sessionManager NOT called
    expect(mockSetChatwootSession).not.toHaveBeenCalled()
  })
})
