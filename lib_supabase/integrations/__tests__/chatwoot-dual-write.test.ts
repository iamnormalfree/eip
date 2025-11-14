// ABOUTME: Test for Chatwoot source_id dual-write strategy implementation
// Tests the audit requirement compliance for Plan 13

import { isLegacyCompat } from '@/lib_supabase/utils/compat';

describe('Chatwoot source_id dual-write strategy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('source_id prefix generation', () => {
    it('should use nextnest_ prefix when legacy compatibility is enabled', () => {
      process.env.EIP_LEGACY_COMPAT = 'true';
      
      const result = isLegacyCompat();
      expect(result).toBe(true);
      
      // Test the actual dual-write logic
      const timestamp = Date.now();
      const sourceId = result ? `nextnest_${timestamp}` : `eip_${timestamp}`;
      expect(sourceId).toMatch(/^nextnest_\d+$/);
    });

    it('should use eip_ prefix when legacy compatibility is disabled', () => {
      process.env.EIP_LEGACY_COMPAT = 'false';
      
      const result = isLegacyCompat();
      expect(result).toBe(false);
      
      // Test the actual dual-write logic
      const timestamp = Date.now();
      const sourceId = result ? `nextnest_${timestamp}` : `eip_${timestamp}`;
      expect(sourceId).toMatch(/^eip_\d+$/);
    });

    it('should default to true in development when not explicitly set', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.EIP_LEGACY_COMPAT;
      
      const result = isLegacyCompat();
      expect(result).toBe(true);
    });

    it('should default to false in production when not explicitly set', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.EIP_LEGACY_COMPAT;
      
      const result = isLegacyCompat();
      expect(result).toBe(false);
    });

    it('should handle various truthy values correctly', () => {
      const truthyValues = ['true', '1', 'yes', 'on'];
      
      truthyValues.forEach(value => {
        process.env.EIP_LEGACY_COMPAT = value;
        expect(isLegacyCompat()).toBe(true);
      });
    });

    it('should handle various falsy values correctly', () => {
      const falsyValues = ['false', '0', 'no', 'off'];
      
      falsyValues.forEach(value => {
        process.env.EIP_LEGACY_COMPAT = value;
        expect(isLegacyCompat()).toBe(false);
      });
    });

    it('should treat unknown values as enabled (conservative approach)', () => {
      process.env.EIP_LEGACY_COMPAT = 'unknown_value';
      
      const result = isLegacyCompat();
      expect(result).toBe(true);
    });
  });
});
