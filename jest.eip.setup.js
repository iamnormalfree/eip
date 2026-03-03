// ABOUTME: EIP-specific Jest setup for node environment tests
// ABOUTME: Configures environment for non-DOM tests

// Import Jest DOM matchers for consistency (won't hurt in node env)
require('@testing-library/jest-dom');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables that might be missing in test environment
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Mock console methods to reduce test noise in non-browser tests
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Global test timeout handling
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
