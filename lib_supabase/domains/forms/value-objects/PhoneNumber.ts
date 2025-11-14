/**
 * Phone Number Value Object  
 * Lead: Ahmad Ibrahim - Senior Backend Engineer
 * 
 * Singapore phone number validation and formatting
 */

export class PhoneNumber {
  private readonly _value: string
  private readonly _formatted: string

  constructor(value: string) {
    const cleaned = this.clean(value)
    
    if (!PhoneNumber.isValid(cleaned)) {
      throw new Error(`Invalid Singapore phone number: ${value}`)
    }
    
    this._value = cleaned
    this._formatted = this.format(cleaned)
  }

  get value(): string {
    return this._value
  }

  get formatted(): string {
    return this._formatted
  }

  get international(): string {
    return `+65 ${this._formatted}`
  }

  private clean(phone: string): string {
    // Remove all non-digits
    return phone.replace(/\D/g, '')
  }

  private format(phone: string): string {
    // Format as XXXX XXXX
    return `${phone.slice(0, 4)} ${phone.slice(4)}`
  }

  static isValid(phone: string): boolean {
    // Singapore mobile numbers: 8 or 9 prefix
    // Singapore landline: 6 prefix
    // Must be 8 digits
    const cleaned = phone.replace(/\D/g, '')
    const sgPhoneRegex = /^[689]\d{7}$/
    
    return sgPhoneRegex.test(cleaned)
  }

  isMobile(): boolean {
    return this._value.startsWith('8') || this._value.startsWith('9')
  }

  isLandline(): boolean {
    return this._value.startsWith('6')
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._formatted
  }

  /**
   * Mask phone for privacy (e.g., 9XXX XX34)
   */
  masked(): string {
    return `${this._value[0]}XXX XX${this._value.slice(-2)}`
  }

  /**
   * Get WhatsApp link
   */
  getWhatsAppLink(message?: string): string {
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ''
    return `https://wa.me/65${this._value}${encodedMessage}`
  }
}