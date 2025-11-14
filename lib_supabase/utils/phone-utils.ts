/**
 * Phone number utilities for Singapore numbers
 */

/**
 * Normalize Singapore phone number to international format
 * Handles: 91234567, 6591234567, +6591234567, +65 91234567
 */
export function normalizeSingaporePhone(phone: string): string {
  if (!phone) return ''

  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Remove leading + for processing
  cleaned = cleaned.replace(/^\+/, '')

  // Handle various formats
  if (cleaned.startsWith('65') && cleaned.length === 10) {
    // Already has country code: 6591234567
    return `+${cleaned}`
  } else if (cleaned.length === 8 && /^[689]/.test(cleaned)) {
    // Local format: 91234567
    return `+65${cleaned}`
  } else if (cleaned.startsWith('0') && cleaned.length === 9) {
    // Some users add leading 0: 091234567
    return `+65${cleaned.substring(1)}`
  }

  // Return as-is if format unknown (let validation handle it)
  return phone
}

/**
 * Check if phone already has Singapore country code
 */
export function hasCountryCode(phone: string): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned.startsWith('+65') || cleaned.startsWith('65')
}