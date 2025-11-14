/**
 * Data Sanitization Module
 * Lead: Elena Rodriguez - Security Engineer
 * 
 * Ensures PII protection and data sanitization for PDPA compliance
 * Implements defense-in-depth approach for sensitive data handling
 */

import { z } from 'zod'

// Singapore-specific validation patterns
const SG_PATTERNS = {
  // NRIC/FIN pattern: Letter + 7 digits + Letter
  nric: /[STFG]\d{7}[A-Z]/gi,
  // Credit card patterns
  creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
  // Bank account patterns (various formats)
  bankAccount: /\b\d{3}-\d{6}-\d{3}\b/g,
  // Singapore phone numbers (8 or 9 starting)
  singaporePhone: /\b[689]\d{7}\b/g,
  // Passport numbers (various formats)
  passport: /\b[A-Z]\d{7,9}\b/g,
  // CPF account numbers
  cpfAccount: /\b\d{2}-\d{6}-\d{2}\b/g,
  // Singpass ID (if different from NRIC)
  singpass: /\bS\d{7}[A-Z]\b/gi
}

// Data classification levels
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

// Sanitized form data interface
export interface SanitizedFormData {
  name: string
  email: string
  phone: string
  loanType: string
  monthlyIncome: number
  propertyCategory?: string
  employmentType?: string
  sanitizationReport?: SanitizationReport
}

// Sanitization report for audit trail
export interface SanitizationReport {
  fieldsModified: string[]
  securityFlags: string[]
  piiDetected: string[]
  timestamp: string
  dataClassification: DataClassification
}

export class FormDataSanitizer {
  private readonly maxFieldLength = 100
  private readonly maxIncomeValue = 9999999
  
  /**
   * Sanitize form data for Chatwoot integration
   * Ensures all data is clean and safe for external systems
   */
  sanitizeForChatwoot(rawData: any): SanitizedFormData {
    const report: SanitizationReport = {
      fieldsModified: [],
      securityFlags: [],
      piiDetected: [],
      timestamp: new Date().toISOString(),
      dataClassification: DataClassification.CONFIDENTIAL
    }

    // Sanitize name - only letters, spaces, hyphens, apostrophes
    const originalName = String(rawData.name || '').trim()
    let sanitizedName = this.sanitizeText(originalName)
      .replace(/[^a-zA-Z\s'-]/g, '')
      .substring(0, this.maxFieldLength)
    
    // Remove any potential PII from name field
    const nameCheck = this.detectAndRedactPII(sanitizedName)
    if (nameCheck.piiDetected.length > 0) {
      sanitizedName = nameCheck.cleanText
      report.piiDetected.push(...nameCheck.piiDetected.map(type => `name:${type}`))
      report.securityFlags.push('pii_in_name')
    }
    
    if (originalName !== sanitizedName) {
      report.fieldsModified.push('name')
    }

    // Validate and sanitize email
    const email = String(rawData.email || '').toLowerCase().trim()
    const sanitizedEmail = this.isValidEmail(email) ? email : ''
    
    if (!sanitizedEmail) {
      report.securityFlags.push('invalid_email')
    }
    
    if (email !== sanitizedEmail) {
      report.fieldsModified.push('email')
    }

    // Validate Singapore phone number
    const phone = String(rawData.phone || '').replace(/\D/g, '')
    const sanitizedPhone = this.isValidSingaporePhone(phone) ? phone : ''
    
    if (!sanitizedPhone) {
      report.securityFlags.push('invalid_phone')
    }
    
    if (rawData.phone !== sanitizedPhone) {
      report.fieldsModified.push('phone')
    }

    // Sanitize loan type (enum validation)
    const validLoanTypes = ['new_purchase', 'refinancing', 'commercial', 'equity_loan']
    const loanType = validLoanTypes.includes(rawData.loanType) ? 
      rawData.loanType : 'new_purchase'
    
    if (rawData.loanType !== loanType) {
      report.fieldsModified.push('loanType')
      report.securityFlags.push('invalid_loan_type')
    }

    // Sanitize monthly income (number validation with bounds)
    let monthlyIncome = Number(rawData.actualIncomes?.[0] || rawData.monthlyIncome || 0)
    if (monthlyIncome < 0 || monthlyIncome > this.maxIncomeValue || !Number.isFinite(monthlyIncome)) {
      monthlyIncome = Math.min(Math.max(0, monthlyIncome), this.maxIncomeValue)
      report.fieldsModified.push('monthlyIncome')
      report.securityFlags.push('income_out_of_bounds')
    }

    // Sanitize property category
    const validPropertyCategories = ['resale', 'new_launch', 'bto', 'commercial']
    const propertyCategory = validPropertyCategories.includes(rawData.propertyCategory) ?
      rawData.propertyCategory : undefined
    
    if (rawData.propertyCategory && rawData.propertyCategory !== propertyCategory) {
      report.fieldsModified.push('propertyCategory')
    }

    // Sanitize employment type
    const validEmploymentTypes = ['employed', 'self-employed', 'commission', 'contract', 'retired']
    const employmentType = validEmploymentTypes.includes(rawData.employmentType) ?
      rawData.employmentType : 'employed'
    
    if (rawData.employmentType && rawData.employmentType !== employmentType) {
      report.fieldsModified.push('employmentType')
    }

    // Check for suspicious patterns
    if (this.detectSuspiciousPatterns(rawData)) {
      report.securityFlags.push('suspicious_pattern_detected')
    }

    // Set data classification based on content
    if (report.piiDetected.length > 0) {
      report.dataClassification = DataClassification.RESTRICTED
    } else if (monthlyIncome > 0) {
      report.dataClassification = DataClassification.CONFIDENTIAL
    }

    return {
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      loanType,
      monthlyIncome,
      propertyCategory,
      employmentType,
      sanitizationReport: report
    }
  }

  /**
   * Detect and redact PII from text
   */
  detectAndRedactPII(text: string): { cleanText: string; piiDetected: string[] } {
    let cleanText = text
    const detected: string[] = []

    // Check for each PII pattern
    for (const [type, pattern] of Object.entries(SG_PATTERNS)) {
      if (pattern.test(text)) {
        detected.push(type)
        cleanText = cleanText.replace(pattern, `[${type.toUpperCase()}_REDACTED]`)
      }
      // Reset regex lastIndex for global patterns
      if (pattern.global) {
        pattern.lastIndex = 0
      }
    }

    return { cleanText, piiDetected: detected }
  }

  /**
   * Sanitize text input (remove XSS attempts, SQL injection, etc.)
   */
  private sanitizeText(text: string): string {
    // Remove HTML tags
    let clean = text.replace(/<[^>]*>/g, '')
    
    // Remove SQL injection attempts
    clean = clean.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM|JOIN|OR|AND|EXEC|EXECUTE|SCRIPT|JAVASCRIPT)\b)/gi, '')
    
    // Remove script injection attempts
    clean = clean.replace(/(javascript:|onerror=|onclick=|onload=|<script|<\/script)/gi, '')
    
    // Normalize whitespace
    clean = clean.replace(/\s+/g, ' ').trim()
    
    return clean
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email) && email.length <= 254
  }

  /**
   * Validate Singapore phone number
   */
  private isValidSingaporePhone(phone: string): boolean {
    // Singapore mobile numbers start with 8 or 9, landlines with 6
    // Must be exactly 8 digits
    return /^[689]\d{7}$/.test(phone)
  }

  /**
   * Detect suspicious patterns that might indicate malicious input
   */
  private detectSuspiciousPatterns(data: any): boolean {
    const suspicious = [
      // Multiple PII types in single field
      (field: string) => {
        const piiCount = Object.values(SG_PATTERNS).filter(pattern => {
          const result = pattern.test(field)
          if (pattern.global) pattern.lastIndex = 0
          return result
        }).length
        return piiCount > 1
      },
      // Unusually long strings
      (field: string) => field.length > 500,
      // Repeated characters (possible buffer overflow attempt)
      (field: string) => /(.)\1{20,}/.test(field),
      // Binary or hex data in text fields
      (field: string) => /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(field),
      // Multiple email addresses in single field
      (field: string) => (field.match(/@/g) || []).length > 1
    ]

    // Check all string fields
    for (const key in data) {
      if (typeof data[key] === 'string') {
        for (const check of suspicious) {
          if (check(data[key])) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Hash sensitive data for storage
   */
  hashSensitiveData(data: string): string {
    // In production, use proper cryptographic hashing (e.g., bcrypt, argon2)
    // This is a placeholder implementation
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Mask sensitive data for display
   */
  maskSensitiveData(data: string, type: 'email' | 'phone' | 'nric'): string {
    switch (type) {
      case 'email':
        const [localPart, domain] = data.split('@')
        const maskedLocal = localPart.substring(0, 2) + '***'
        return `${maskedLocal}@${domain}`
      
      case 'phone':
        return data.substring(0, 4) + '****'
      
      case 'nric':
        return data.substring(0, 1) + '***' + data.substring(data.length - 1)
      
      default:
        return '***'
    }
  }

  /**
   * Validate data minimization compliance
   * Ensures we're only collecting necessary data
   */
  verifyDataMinimization(data: SanitizedFormData): boolean {
    const requiredFields = ['name', 'email', 'phone', 'loanType']
    const allowedFields = [...requiredFields, 'monthlyIncome', 'propertyCategory', 'employmentType', 'sanitizationReport']
    
    // Check that we have all required fields
    for (const field of requiredFields) {
      if (!data[field as keyof SanitizedFormData]) {
        return false
      }
    }
    
    // Check that we don't have extra fields
    for (const field in data) {
      if (!allowedFields.includes(field)) {
        console.warn(`Unexpected field in sanitized data: ${field}`)
        return false
      }
    }
    
    return true
  }
}

// Export singleton instance
export const dataSanitizer = new FormDataSanitizer()