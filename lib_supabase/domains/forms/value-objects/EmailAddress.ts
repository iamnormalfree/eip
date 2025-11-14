/**
 * Email Address Value Object
 * Lead: Ahmad Ibrahim - Senior Backend Engineer
 * 
 * Immutable value object for email validation
 */

import { z } from 'zod'

const emailSchema = z.string().email()

export class EmailAddress {
  constructor(private readonly _value: string) {
    const normalized = this.normalize(_value)
    
    if (!EmailAddress.isValid(normalized)) {
      throw new Error(`Invalid email address: ${_value}`)
    }
    
    this._value = normalized
  }

  get value(): string {
    return this._value
  }

  get domain(): string {
    return this._value.split('@')[1]
  }

  get localPart(): string {
    return this._value.split('@')[0]
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase()
  }

  static isValid(email: string): boolean {
    try {
      emailSchema.parse(email)
      return true
    } catch {
      return false
    }
  }

  isBusinessEmail(): boolean {
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'yahoo.com.sg', 'singnet.com.sg', 'pacific.net.sg',
      'starhub.com', 'singtel.com'
    ]
    
    return !freeEmailDomains.includes(this.domain)
  }

  equals(other: EmailAddress): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  /**
   * Mask email for privacy (e.g., j***n@example.com)
   */
  masked(): string {
    const [localPart, domain] = this._value.split('@')
    if (localPart.length <= 2) {
      return `**@${domain}`
    }
    
    const firstChar = localPart[0]
    const lastChar = localPart[localPart.length - 1]
    return `${firstChar}${'*'.repeat(Math.min(localPart.length - 2, 3))}${lastChar}@${domain}`
  }
}