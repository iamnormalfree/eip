/**
 * Form ID Value Object
 * Lead: Marcus Chen - Lead Full-Stack Architect
 * 
 * Immutable value object for form identification
 */

export class FormId {
  constructor(private readonly _value: string) {
    if (!this.isValidId(_value)) {
      throw new Error(`Invalid FormId: ${_value}`)
    }
  }

  get value(): string {
    return this._value
  }

  private isValidId(id: string): boolean {
    // UUID v4 format or custom format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const customRegex = /^FORM-[0-9]{13}-[A-Z0-9]{6}$/
    
    return uuidRegex.test(id) || customRegex.test(id)
  }

  static generate(): FormId {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 6).toUpperCase()
    return new FormId(`FORM-${timestamp}-${random}`)
  }

  equals(other: FormId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}