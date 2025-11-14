// ABOUTME: Test suite for useBrokerSync hook - TDD approach for broker name synchronization

import { renderHook, waitFor } from '@testing-library/react'
import { useBrokerSync } from '../useBrokerSync'

// Mock fetch for API fallback tests
global.fetch = jest.fn()

interface Message {
  id: number
  content: string
  role?: 'user' | 'agent' | 'system'
  message_type: 'incoming' | 'outgoing' | 'activity' | 0 | 1 | 2
  created_at: string
  sender?: {
    name: string
    type: 'contact' | 'agent' | 'bot'
  }
  private: boolean
}

describe('useBrokerSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('uses initialBrokerName when no messages present', () => {
    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages: [],
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    expect(result.current.brokerName).toBe('AI Mortgage Advisor')
  })

  it('extracts broker name from activity message with emoji (broker-worker format)', async () => {
    const messages: Message[] = [
      {
        id: 1,
        content: '🤝 Rachel Tan has joined the conversation',
        message_type: 'activity',
        role: 'system',
        created_at: '2025-11-04T10:00:00Z',
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Rachel Tan')
    })
  })

  it('extracts broker name from activity message without emoji (broker-engagement-manager format)', async () => {
    const messages: Message[] = [
      {
        id: 1,
        content: 'Sarah Wong joined the conversation.',
        message_type: 'activity',
        role: 'system',
        created_at: '2025-11-04T10:00:00Z',
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Sarah Wong')
    })
  })

  it('extracts broker name from greeting message', async () => {
    const messages: Message[] = [
      {
        id: 1,
        content: "Hi! I'm Rachel Tan, your mortgage specialist",
        message_type: 1, // agent message (numeric type)
        role: 'agent',
        created_at: '2025-11-04T10:00:00Z',
        sender: {
          name: 'Rachel Tan',
          type: 'agent'
        },
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Rachel Tan')
    })
  })

  it('ignores unreliable sender metadata and uses greeting regex', async () => {
    const messages: Message[] = [
      {
        id: 1,
        content: "Hi! I'm Rachel Tan, your mortgage specialist",
        message_type: 1,
        role: 'agent',
        created_at: '2025-11-04T10:00:00Z',
        sender: {
          name: 'bren', // Chatwoot bug: returns contact name instead of agent name
          type: 'contact'
        },
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Rachel Tan')
    })
  })

  it('updates broker name when new activity message arrives', async () => {
    const initialMessages: Message[] = [
      {
        id: 1,
        content: '🤝 Michelle Chen has joined the conversation',
        message_type: 'activity',
        role: 'system',
        created_at: '2025-11-04T10:00:00Z',
        private: false
      }
    ]

    const { result, rerender } = renderHook(
      ({ messages }) =>
        useBrokerSync({
          conversationId: 123,
          messages,
          initialBrokerName: 'AI Mortgage Advisor'
        }),
      { initialProps: { messages: initialMessages } }
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Michelle Chen')
    })

    // Broker handoff - new broker joins
    const updatedMessages: Message[] = [
      ...initialMessages,
      {
        id: 2,
        content: '🤝 Grace Wong has joined the conversation',
        message_type: 'activity',
        role: 'system',
        created_at: '2025-11-04T10:05:00Z',
        private: false
      }
    ]

    rerender({ messages: updatedMessages })

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Grace Wong')
    })
  })

  it('falls back to API call after 5 seconds if no broker found in messages', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        broker: { name: 'Rachel Tan' }
      })
    })

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages: [],
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    // Initially shows default name
    expect(result.current.brokerName).toBe('AI Mortgage Advisor')

    // Advance time by 5 seconds to trigger API fallback
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/brokers/conversation/123')
      expect(result.current.brokerName).toBe('Rachel Tan')
    })
  })

  it('does not call API fallback if broker already found in messages', async () => {
    const messages: Message[] = [
      {
        id: 1,
        content: '🤝 Rachel Tan has joined the conversation',
        message_type: 'activity',
        role: 'system',
        created_at: '2025-11-04T10:00:00Z',
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Rachel Tan')
    })

    // Advance time - should NOT trigger API call since broker already found
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('handles API fallback error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages: [],
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    // Advance time to trigger API fallback
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Should keep default name on error
    expect(result.current.brokerName).toBe('AI Mortgage Advisor')
    expect(consoleSpy).toHaveBeenCalledWith('Broker sync fallback error:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('only processes new messages after last sync', async () => {
    const initialMessages: Message[] = [
      {
        id: 1,
        content: '🤝 Michelle Chen has joined the conversation',
        message_type: 'activity',
        role: 'system',
        created_at: '2025-11-04T10:00:00Z',
        private: false
      }
    ]

    const { result, rerender } = renderHook(
      ({ messages }) =>
        useBrokerSync({
          conversationId: 123,
          messages,
          initialBrokerName: 'AI Mortgage Advisor'
        }),
      { initialProps: { messages: initialMessages } }
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Michelle Chen')
    })

    // Add a user message (should not change broker name)
    const updatedMessages: Message[] = [
      ...initialMessages,
      {
        id: 2,
        content: 'Hello',
        message_type: 'incoming',
        role: 'user',
        created_at: '2025-11-04T10:01:00Z',
        private: false
      }
    ]

    rerender({ messages: updatedMessages })

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Michelle Chen')
    })
  })

  it('handles numeric message_type values correctly', async () => {
    const messages: Message[] = [
      {
        id: 1,
        content: '🤝 Rachel Tan has joined the conversation',
        message_type: 2, // numeric equivalent of 'activity'
        created_at: '2025-11-04T10:00:00Z',
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      expect(result.current.brokerName).toBe('Rachel Tan')
    })
  })

  it('does not overwrite correct broker name with wrong sender metadata', async () => {
    // Simulates production bug: activity message correct, then agent message with wrong sender
    const messages: Message[] = [
      {
        id: 1,
        content: '🤝 Rachel Tan has joined the conversation',
        message_type: 2,
        created_at: '2025-11-04T10:00:00Z',
        private: false
      },
      {
        id: 2,
        content: 'Hi bren,\n\nThank you for taking the time...',
        message_type: 1,
        role: 'agent',
        created_at: '2025-11-04T10:00:05Z',
        sender: {
          name: 'bren', // Chatwoot bug: wrong sender name
          type: 'contact'
        },
        private: false
      }
    ]

    const { result } = renderHook(() =>
      useBrokerSync({
        conversationId: 123,
        messages,
        initialBrokerName: 'AI Mortgage Advisor'
      })
    )

    await waitFor(() => {
      // Should keep "Rachel Tan" from activity, NOT overwrite with "bren"
      expect(result.current.brokerName).toBe('Rachel Tan')
    })
  })
})
