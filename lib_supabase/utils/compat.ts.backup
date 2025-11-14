/**
 * ABOUTME: Compatibility utility for dual-read single-write pattern
 * Supports legacy key migration and feature flag control
 */

// Storage type definitions
type StorageType = 'localStorage' | 'sessionStorage';

// Feature flag configuration
const LEGACY_COMPAT_DEFAULT = true;
const LEGACY_COMPAT_ENABLED = ['true', '1', 'yes', 'on'];
const LEGACY_COMPAT_DISABLED = ['false', '0', 'no', 'off'];

/**
 * Check if legacy compatibility is enabled
 * Default: true in development environment, controlled via EIP_LEGACY_COMPAT in production
 */
export function isLegacyCompat(): boolean {
  const envValue = process.env.EIP_LEGACY_COMPAT;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // In development, default to true if not explicitly set
  if (isDevelopment && !envValue) {
    return true;
  }

  // In production, require explicit setting
  if (!envValue) {
    return false; // Default to false for safety in production
  }

  const normalizedValue = envValue.toLowerCase().trim();

  if (LEGACY_COMPAT_ENABLED.includes(normalizedValue)) {
    return true;
  }

  if (LEGACY_COMPAT_DISABLED.includes(normalizedValue)) {
    return false;
  }

  // Treat any other value as enabled (conservative approach)
  return true;
}

/**
 * Get value from storage using dual-read pattern
 * Tries keys in order, returns first existing value
 * When feature disabled, only tries canonical key
 */
export function getWithAliases(keys: string[], storageType: StorageType): any | null {
  if (!keys || keys.length === 0) {
    return null;
  }

  const storage = getStorage(storageType);
  if (!storage) {
    // Gracefully handle missing storage instead of throwing
    return null;
  }

  // When legacy compatibility is disabled, only try the canonical key (first in list)
  const keysToTry = isLegacyCompat() ? keys : [keys[0]];

  for (const key of keysToTry) {
    try {
      const value = storage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
    } catch (error) {
      // Continue to next key if parsing fails
      console.warn(`Failed to parse value for key "${key}":`, error);
      if (key === keys[0]) {
        // If canonical key fails, continue to next key
        continue;
      }
    }
  }

  return null;
}

/**
 * Set canonical key in storage using single-write pattern
 * Always writes to the canonical key regardless of legacy compatibility
 */
export function setCanonical(key: string, value: any, storageType: StorageType): void {
  const storage = getStorage(storageType);
  if (!storage) {
    // Gracefully handle missing storage instead of throwing
    return;
  }

  try {
    // Handle undefined values (JSON.stringify will serialize them)
    const serializedValue = value === undefined ? 'undefined' : JSON.stringify(value);
    storage.setItem(key, serializedValue);
  } catch (error) {
    console.warn(`Failed to set value for key "${key}":`, error);
    // Silently fail to prevent application crashes
  }
}

/**
 * Get storage instance based on type
 * Gracefully handles missing storage APIs
 */
function getStorage(storageType: StorageType): Storage | null {
  switch (storageType) {
    case 'localStorage':
      return typeof localStorage !== 'undefined' ? localStorage : null;
    case 'sessionStorage':
      return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    default:
      console.warn(`Unknown storage type: "${storageType}"`);
      return null;
  }
}


// Export default object for backward compatibility
export const compat = {
  getWithAliases,
  setCanonical,
  isLegacyCompat
} as const;
