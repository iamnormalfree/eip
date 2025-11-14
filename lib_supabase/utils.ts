import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Utility function for formatting currency
export function formatCurrency(amount: number, currency = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Utility function for formatting percentages
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

// Utility function for formatting numbers with commas
export function formatNumberWithCommas(value: string | number): string {
  if (!value) return ''
  const numValue = typeof value === 'string' ? value.replace(/,/g, '') : value.toString()
  const parts = numValue.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// Utility function for parsing formatted numbers
export function parseFormattedNumber(value: string): number {
  if (!value) return 0
  const cleanedValue = value.replace(/,/g, '')
  return parseFloat(cleanedValue) || 0
}
