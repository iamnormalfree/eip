// ABOUTME: Test suite for compatibility utility - TDD approach for dual-read single-write pattern

import { getWithAliases, setCanonical, isLegacyCompat } from '../compat';

describe('compatibility utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isLegacyCompat()', () => {
    it('should return true when EIP_LEGACY_COMPAT is "true"', () => {
      process.env.EIP_LEGACY_COMPAT = 'true';
      expect(isLegacyCompat()).toBe(true);
    });

    it('should return true when EIP_LEGACY_COMPAT is "1"', () => {
      process.env.EIP_LEGACY_COMPAT = '1';
      expect(isLegacyCompat()).toBe(true);
    });

    it('should return false when EIP_LEGACY_COMPAT is "false"', () => {
      process.env.EIP_LEGACY_COMPAT = 'false';
      expect(isLegacyCompat()).toBe(false);
    });

    it('should return false when EIP_LEGACY_COMPAT is "0"', () => {
      process.env.EIP_LEGACY_COMPAT = '0';
      expect(isLegacyCompat()).toBe(false);
    });

    it('should return false in test environment by default (no env var)', () => {
      delete process.env.EIP_LEGACY_COMPAT;
      expect(isLegacyCompat()).toBe(false); // Test environment defaults to false for safety
    });

    it('should return true in development environment by default', () => {
      delete process.env.EIP_LEGACY_COMPAT;
      process.env.NODE_ENV = 'development';
      expect(isLegacyCompat()).toBe(true);
    });

    it('should handle case-insensitive values', () => {
      process.env.EIP_LEGACY_COMPAT = 'TRUE';
      expect(isLegacyCompat()).toBe(true);
      
      process.env.EIP_LEGACY_COMPAT = 'FALSE';
      expect(isLegacyCompat()).toBe(false);
    });
  });

  describe('getWithAliases()', () => {
    beforeEach(() => {
      // Enable legacy compatibility for these tests to show dual-read behavior
      process.env.EIP_LEGACY_COMPAT = 'true';
      
      // Get fresh storage mocks from global setup
      const { localStorageMock, sessionStorageMock } = global.getStorageMocks();
      
      // Clear the mock stores
      localStorageMock._getStore().clear();
      sessionStorageMock._getStore().clear();
    });

    it('should return first existing key from alias list', () => {
      const { localStorageMock } = global.getStorageMocks();
      
      // Set up data in the mock store
      localStorageMock._getStore().set('new_key', JSON.stringify('new_value'));
      localStorageMock._getStore().set('old_key', JSON.stringify('old_value'));

      const result = getWithAliases(['new_key', 'old_key'], 'localStorage');
      expect(result).toBe('new_value');
    });

    it('should fallback to second key when first does not exist', () => {
      const { localStorageMock } = global.getStorageMocks();
      
      // Set up only old key - no new_key
      localStorageMock._getStore().set('old_key', JSON.stringify('old_value'));

      const result = getWithAliases(['new_key', 'old_key'], 'localStorage');
      expect(result).toBe('old_value');
    });

    it('should return null when no keys exist', () => {
      const result = getWithAliases(['new_key', 'old_key'], 'localStorage');
      expect(result).toBe(null);
    });

    it('should work with sessionStorage', () => {
      const { sessionStorageMock } = global.getStorageMocks();
      
      // Set up data in sessionStorage
      sessionStorageMock._getStore().set('new_key', JSON.stringify('new_value'));

      const result = getWithAliases(['new_key', 'old_key'], 'sessionStorage');
      expect(result).toBe('new_value');
    });

    it('should handle empty keys array gracefully', () => {
      const result = getWithAliases([], 'localStorage');
      expect(result).toBe(null);
    });

    it('should handle duplicate keys in array', () => {
      const { localStorageMock } = global.getStorageMocks();
      
      localStorageMock._getStore().set('new_key', JSON.stringify('new_value'));

      const result = getWithAliases(['new_key', 'new_key'], 'localStorage');
      expect(result).toBe('new_value');
    });

    it('should handle JSON parse errors gracefully', () => {
      const { localStorageMock } = global.getStorageMocks();
      
      // Set invalid JSON in store
      localStorageMock._getStore().set('key', 'invalid json');

      const result = getWithAliases(['key'], 'localStorage');
      expect(result).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('setCanonical()', () => {
    beforeEach(() => {
      // Get fresh storage mocks from global setup
      const { localStorageMock, sessionStorageMock } = global.getStorageMocks();
      
      // Clear the mock stores
      localStorageMock._getStore().clear();
      sessionStorageMock._getStore().clear();
    });

    it('should always write to canonical key', () => {
      const value = { test: 'data' };
      setCanonical('canonical_key', value, 'localStorage');

      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('canonical_key', JSON.stringify(value));
    });

    it('should work with sessionStorage', () => {
      const value = { test: 'data' };
      setCanonical('canonical_key', value, 'sessionStorage');

      const { sessionStorageMock } = global.getStorageMocks();
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('canonical_key', JSON.stringify(value));
    });

    it('should handle string values correctly', () => {
      setCanonical('string_key', 'string_value', 'localStorage');
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('string_key', '"string_value"');
    });

    it('should handle number values correctly', () => {
      setCanonical('number_key', 42, 'localStorage');
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('number_key', '42');
    });

    it('should handle boolean values correctly', () => {
      setCanonical('bool_key', true, 'localStorage');
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bool_key', 'true');
    });

    it('should handle null values correctly', () => {
      setCanonical('null_key', null, 'localStorage');
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('null_key', 'null');
    });

    it('should handle undefined values correctly', () => {
      setCanonical('undefined_key', undefined, 'localStorage');
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('undefined_key', 'undefined');
    });

    it('should handle storage errors gracefully', () => {
      const { localStorageMock } = global.getStorageMocks();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        setCanonical('key', { test: 'data' }, 'localStorage');
      }).not.toThrow();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to set value for key "key":', expect.any(Error));
    });

    it('should handle circular references gracefully', () => {
      const circularObj: any = {};
      circularObj.self = circularObj;

      expect(() => {
        setCanonical('key', circularObj, 'localStorage');
      }).not.toThrow();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to set value for key "key":', expect.any(Error));
    });
  });

  describe('Dual-read single-write integration', () => {
    beforeEach(() => {
      // Enable legacy compatibility for dual-read tests
      process.env.EIP_LEGACY_COMPAT = 'true';
      
      // Get fresh storage mocks from global setup
      const { localStorageMock } = global.getStorageMocks();
      
      // Clear the mock stores
      localStorageMock._getStore().clear();
      
      // Mock legacy key exists
      localStorageMock._getStore().set('old_key', JSON.stringify('legacy_value'));
    });

    it('should read from legacy key when new key does not exist', () => {
      const result = getWithAliases(['new_key', 'old_key'], 'localStorage');
      expect(result).toBe('legacy_value');
    });

    it('should migrate old key to new key on first write', () => {
      // First read gets old value
      let result = getWithAliases(['new_key', 'old_key'], 'localStorage');
      expect(result).toBe('legacy_value');

      // Write to canonical key
      setCanonical('new_key', 'updated_value', 'localStorage');

      // Check that new key was set correctly
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('new_key', '"updated_value"');
    });

    it('should prefer new key when both exist', () => {
      const { localStorageMock } = global.getStorageMocks();
      
      // Set both keys
      localStorageMock._getStore().set('new_key', JSON.stringify('new_value'));
      localStorageMock._getStore().set('old_key', JSON.stringify('old_value'));

      const result = getWithAliases(['new_key', 'old_key'], 'localStorage');
      expect(result).toBe('new_value');
    });
  });

  describe('Feature flag behavior', () => {
    beforeEach(() => {
      process.env.EIP_LEGACY_COMPAT = 'false';
      const { localStorageMock } = global.getStorageMocks();
      localStorageMock._getStore().clear();
      localStorageMock.getItem.mockClear();
    });

    it('should only read canonical key when feature disabled', () => {
      const { localStorageMock } = global.getStorageMocks();
      
      // Set up data
      localStorageMock._getStore().set('canonical_key', JSON.stringify('value'));
      localStorageMock._getStore().set('legacy_key', JSON.stringify('legacy_value'));

      const result = getWithAliases(['canonical_key', 'legacy_key'], 'localStorage');
      expect(result).toBe('value');

      // Should only have tried to read canonical key once
      expect(localStorageMock.getItem).toHaveBeenCalledWith('canonical_key');
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });

    it('should write to canonical key regardless of feature flag', () => {
      setCanonical('canonical_key', 'value', 'localStorage');
      const { localStorageMock } = global.getStorageMocks();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('canonical_key', '"value"');
    });
  });

  describe('Error handling', () => {
    it('should handle missing storage gracefully', () => {
      // Temporarily remove storage from global
      const originalLocalStorage = global.window.localStorage;
      const originalSessionStorage = global.window.sessionStorage;
      
      delete (global.window as any).localStorage;
      delete (global.window as any).sessionStorage;

      expect(() => {
        getWithAliases(['key'], 'localStorage');
      }).not.toThrow();

      expect(() => {
        setCanonical('key', 'value', 'localStorage');
      }).not.toThrow();

      // Restore storage
      global.window.localStorage = originalLocalStorage;
      global.window.sessionStorage = originalSessionStorage;
    });

    it('should handle invalid storage type gracefully', () => {
      expect(() => {
        getWithAliases(['key'], 'invalid_storage' as any);
      }).not.toThrow();

      expect(() => {
        setCanonical('key', 'value', 'invalid_storage' as any);
      }).not.toThrow();
    });
  });

  describe('Performance considerations', () => {
    it('should minimize storage access when reading', () => {
      // Enable legacy compatibility for this test
      process.env.EIP_LEGACY_COMPAT = 'true';
      
      const { localStorageMock } = global.getStorageMocks();
      
      // Set up data
      localStorageMock._getStore().set('key1', JSON.stringify('value'));
      localStorageMock.getItem.mockClear();

      const result = getWithAliases(['key1', 'key2', 'key3'], 'localStorage');
      expect(result).toBe('value');

      // Should stop after first successful read
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('key1');
    });

    it('should validate storage type once per call', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        getWithAliases(['key'], 'invalid_storage' as any);
        setCanonical('key', 'value', 'invalid_storage' as any);
      }).not.toThrow();

      // Each function call should warn once about invalid storage type
      expect(console.warn).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });
  });
});
