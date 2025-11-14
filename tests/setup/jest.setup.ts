// ABOUTME: Global Jest setup for EIP test infrastructure
// ABOUTME: Configures test environment, mocks, and utilities

// Extend Jest matchers with testing-library matchers
import '@testing-library/jest-dom';

// Mock console methods to reduce test noise
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

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.EIP_TEST_MODE = 'steel_thread';
process.env.EIP_MOCK_EXTERNAL_SERVICES = 'true';

// Mock environment variables that might be missing in test environment
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Global test timeout handling
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
