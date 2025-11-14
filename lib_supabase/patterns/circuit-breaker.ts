/**
 * Circuit Breaker Pattern Implementation
 * Provides resilience for Chatwoot API integration
 */

export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing recovery
}

export interface CircuitBreakerOptions {
  failureThreshold: number  // Number of failures before opening
  resetTimeout: number      // Time in ms before trying again
  monitoringPeriod: number  // Time window for counting failures
}

export class ChatwootCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private lastFailureTime: number = 0
  private nextAttempt: number = 0
  
  private readonly options: CircuitBreakerOptions = {
    // Production-validated threshold: Load testing + production data (7 failed jobs)
    // shows that 7 failures is appropriate before circuit opens
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '7'),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000'), // 60 seconds
    monitoringPeriod: 300000 // 5 minutes
  }

  constructor(options?: Partial<CircuitBreakerOptions>) {
    if (options) {
      this.options = { ...this.options, ...options }
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable')
      }
      // Try to recover
      this.state = CircuitState.HALF_OPEN
      console.log('🔄 Circuit breaker entering HALF_OPEN state')
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      console.log('✅ Circuit breaker recovering - closing circuit')
      this.reset()
    }
    
    // Reset failure count if outside monitoring period
    if (Date.now() - this.lastFailureTime > this.options.monitoringPeriod) {
      this.failureCount = 0
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery, reopen immediately
      this.open()
      return
    }

    if (this.failureCount >= this.options.failureThreshold) {
      this.open()
    }
    
    console.log(`⚠️ Circuit breaker failure ${this.failureCount}/${this.options.failureThreshold}`)
  }

  /**
   * Open the circuit breaker
   */
  private open(): void {
    this.state = CircuitState.OPEN
    this.nextAttempt = Date.now() + this.options.resetTimeout
    console.log(`🚫 Circuit breaker OPEN - will retry at ${new Date(this.nextAttempt).toISOString()}`)
  }

  /**
   * Reset the circuit breaker
   * Public to allow admin endpoint to manually reset for E2E testing
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.lastFailureTime = 0
    this.nextAttempt = 0
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get circuit statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttempt: this.nextAttempt ? new Date(this.nextAttempt).toISOString() : null
    }
  }

  /**
   * Generate fallback response for when circuit is open
   */
  static fallbackResponse() {
    return {
      success: false,
      fallback: {
        type: 'phone' as const,
        contact: process.env.CHAT_FALLBACK_PHONE || '+6583341445',
        message: 'Our chat system is temporarily unavailable. Please call us directly for immediate assistance.'
      }
    }
  }
}

// Singleton instance for the application
let circuitBreakerInstance: ChatwootCircuitBreaker | null = null

export function getChatwootCircuitBreaker(): ChatwootCircuitBreaker {
  if (!circuitBreakerInstance) {
    circuitBreakerInstance = new ChatwootCircuitBreaker()
  }
  return circuitBreakerInstance
}