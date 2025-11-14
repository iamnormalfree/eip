// Simple compatibility utility test

// Mock storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Simplified compatibility utility
const compat = {
  isLegacyCompat: function() {
    const envValue = process.env.EIP_LEGACY_COMPAT;
    if (!envValue) return true;
    const normalizedValue = envValue.toLowerCase().trim();
    return ['true', '1', 'yes', 'on'].includes(normalizedValue);
  },
  
  getWithAliases: function(keys, storage) {
    if (!keys || keys.length === 0) return null;
    
    const keysToTry = this.isLegacyCompat() ? keys : [keys[0]];
    
    for (const key of keysToTry) {
      const value = storage.getItem(key);
      if (value !== null) {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn(`Failed to parse key "${key}"`);
        }
      }
    }
    return null;
  },
  
  setCanonical: function(key, value, storage) {
    try {
      const serializedValue = value === undefined ? 'undefined' : JSON.stringify(value);
      storage.setItem(key, serializedValue);
    } catch (error) {
      console.warn(`Failed to set key "${key}":`, error);
    }
  }
};

// Test the functionality
console.log('=== Testing Compatibility Utility ===');

// Test 1: Feature flag
console.log('\n1. Feature flag tests:');
process.env.EIP_LEGACY_COMPAT = 'true';
console.log('  EIP_LEGACY_COMPAT=true:', compat.isLegacyCompat());

process.env.EIP_LEGACY_COMPAT = 'false';
console.log('  EIP_LEGACY_COMPAT=false:', compat.isLegacyCompat());

delete process.env.EIP_LEGACY_COMPAT;
console.log('  EIP_LEGACY_COMPAT (unset):', compat.isLegacyCompat());

// Test 2: Dual-read behavior
console.log('\n2. Dual-read behavior tests:');
// Mock storage with both keys
mockStorage.getItem.mockImplementation((key) => {
  if (key === 'new_key') return 'new_value';
  if (key === 'old_key') return 'old_value';
  return null;
});

process.env.EIP_LEGACY_COMPAT = 'true';
let result = compat.getWithAliases(['new_key', 'old_key'], mockStorage);
console.log('  Both keys exist, prefers new:', result);

// Mock storage with only old key
mockStorage.getItem.mockImplementation((key) => {
  if (key === 'new_key') return null;
  if (key === 'old_key') return 'old_value';
  return null;
});

result = compat.getWithAliases(['new_key', 'old_key'], mockStorage);
console.log('  Only old key exists, fallback:', result);

// Test 3: Feature flag disabled
console.log('\n3. Feature flag disabled tests:');
process.env.EIP_LEGACY_COMPAT = 'false';
mockStorage.getItem.mockImplementation((key) => {
  if (key === 'canonical_key') return 'value';
  if (key === 'legacy_key') return 'legacy_value';
  return null;
});

result = compat.getWithAliases(['canonical_key', 'legacy_key'], mockStorage);
console.log('  Legacy disabled, only tries canonical:', result);
console.log('  getItem calls:', mockStorage.getItem.mock.calls.length);

// Test 4: Single-write behavior
console.log('\n4. Single-write behavior tests:');
compat.setCanonical('canonical_key', { test: 'data' }, mockStorage);
console.log('  Write called with:', mockStorage.setItem.mock.calls[0]);

// Test 5: Error handling
console.log('\n5. Error handling tests:');
mockStorage.setItem.mockImplementation(() => {
  throw new Error('Storage quota exceeded');
});

try {
  compat.setCanonical('key', { test: 'data' }, mockStorage);
  console.log('  Error handled gracefully');
} catch (error) {
  console.log('  Error not handled:', error.message);
}

// Clean up mocks
jest.clearAllMocks();

console.log('\n=== All Tests Complete ===');
