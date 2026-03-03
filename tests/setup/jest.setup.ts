// ABOUTME: Global Jest setup for EIP test infrastructure
// ABOUTME: Configures test environment, mocks, and utilities

// Import Jest globals for setup files
import '@jest/globals';

// Extend Jest matchers with testing-library matchers - CRITICAL LINE
import '@testing-library/jest-dom';

// Import MockFactory setup for centralized mock management
import './mock-factory.setup';

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
(process.env as any).NODE_ENV = 'test';
process.env.EIP_TEST_MODE = 'steel_thread';
process.env.EIP_MOCK_EXTERNAL_SERVICES = 'true';

// Mock environment variables that might be missing in test environment
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Configure Winston test environment
beforeAll(() => {
  // Set Winston to only show errors in tests to reduce noise
  process.env.WINSTON_LEVEL = 'error';

  // Suppress Winston transport output during tests unless it's an error
  process.env.LOG_LEVEL = 'error';
});

// Mock problematic ES modules - replaced with MockFactory approach
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-1234'),
  v1: jest.fn(() => 'mock-uuid-v1-1234'),
  v3: jest.fn(() => 'mock-uuid-v3-1234'),
  v5: jest.fn(() => 'mock-uuid-v5-1234'),
  NIL: '00000000-0000-0000-0000-000000000000',
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    process: jest.fn(),
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(() => ({
    run: jest.fn(),
    close: jest.fn(),
  })),
  QueueEvents: jest.fn(() => ({
    close: jest.fn(),
  })),
}));

jest.mock('ioredis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
  })),
}));

// Global test timeout handling
jest.setTimeout(30000);

// Cleanup after each test - MockFactory handles mock clearing
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  // Note: jest.clearAllMocks() is handled by mockFactory.reset()
});
