// ABOUTME: Test Preflight Check Script Exports and Basic Functionality
// ABOUTME: Validates environment preflight check module structure

import { describe, it, expect } from 'vitest';

// Import the module to test exports
import {
  checkSupabaseConnection,
  checkRedisConnection,
  runPreflightCheck,
  PreflightResult
} from '../../scripts/preflight-check';

describe('preflight-check module', () => {
  describe('Module exports', () => {
    it('should export checkSupabaseConnection as a function', () => {
      expect(typeof checkSupabaseConnection).toBe('function');
    });

    it('should export checkRedisConnection as a function', () => {
      expect(typeof checkRedisConnection).toBe('function');
    });

    it('should export runPreflightCheck as a function', () => {
      expect(typeof runPreflightCheck).toBe('function');
    });

    it('should export PreflightResult interface', () => {
      // Type checking is done at compile time; we verify the module structure here
      const result: PreflightResult = { available: true };
      expect(result.available).toBe(true);
    });
  });

  describe('checkSupabaseConnection', () => {
    it('should return unavailable when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
      // Save original env
      const originalEnv = { ...process.env };
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_KEY;

      const result = await checkSupabaseConnection();

      expect(result.available).toBe(false);
      expect(result.error).toContain('NEXT_PUBLIC_SUPABASE_URL');

      // Restore env
      process.env = originalEnv;
    });

    it('should return unavailable when service key is not set', async () => {
      const originalEnv = { ...process.env };
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_KEY;

      const result = await checkSupabaseConnection();

      expect(result.available).toBe(false);
      expect(result.error).toContain('SUPABASE_SERVICE_ROLE_KEY');

      // Restore env
      process.env = originalEnv;
    });
  });

  describe('checkRedisConnection', () => {
    it('should return unavailable when REDIS_URL is not set', async () => {
      const originalEnv = { ...process.env };
      delete process.env.REDIS_URL;
      delete process.env.EIP_REDIS_URL;

      const result = await checkRedisConnection();

      expect(result.available).toBe(false);
      expect(result.error).toContain('REDIS_URL');

      // Restore env
      process.env = originalEnv;
    });
  });
});
