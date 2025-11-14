// Manual test for compatibility utility
// This demonstrates the core functionality without Jest complications

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock global localStorage
global.localStorage = mockLocalStorage;

// Load the module
const { getWithAliases, setCanonical, isLegacyCompat } = require('./lib_supabase/utils/compat.ts');

console.log('=== Testing Compatibility Utility ===');

// Test 1: Feature flag behavior
console.log('\n1. Testing feature flag behavior:');
process.env.EIP_LEGACY_COMPAT = 'true';
console.log('EIP_LEGACY_COMPAT=true:', isLegacyCompat());

process.env.EIP_LEGACY_COMPAT = 'false';
console.log('EIP_LEGACY_COMPAT=false:', isLegacyCompat());

delete process.env.EIP_LEGACY_COMPAT;
console.log('EIP_LEGACY_COMPAT (unset):', isLegacyCompat());

// Test 2: Dual-read behavior
console.log('\n2. Testing dual-read behavior:');
mockLocalStorage.getItem.mockImplementation((key) => {
  if (key === 'new_key') return 'new_value';
  if (key === 'old_key') return 'old_value';
  return null;
});

const result1 = getWithAliases(['new_key', 'old_key'], 'localStorage');
console.log('Both keys exist, prefers new:', result1);

mockLocalStorage.getItem.mockImplementation((key) => {
  if (key === 'new_key') return null;
  if (key === 'old_key') return 'old_value';
  return null;
});

const result2 = getWithAliases(['new_key', 'old_key'], 'localStorage');
console.log('Only old key exists, fallback:', result2);

// Test 3: Single-write behavior
console.log('\n3. Testing single-write behavior:');
setCanonical('canonical_key', { test: 'data' }, 'localStorage');
console.log('Write called with:', mockLocalStorage.setItem.mock.calls[0]);

// Test 4: Error handling
console.log('\n4. Testing error handling:');
mockLocalStorage.setItem.mockImplementation(() => {
  throw new Error('Storage quota exceeded');
});

try {
  setCanonical('key', { test: 'data' }, 'localStorage');
  console.log('Error handled gracefully');
} catch (error) {
  console.log('Error not handled:', error.message);
}

console.log('\n=== Manual Test Complete ===');
