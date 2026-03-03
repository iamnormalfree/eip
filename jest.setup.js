/**
 * ABOUTME: Global test setup for EIP testing
 * Provides proper storage mocking and environment configuration
 */

// Import Jest DOM matchers
require('@testing-library/jest-dom');

// Storage mock factory
const createStorageMock = () => {
  const store = new Map();

  return {
    getItem: jest.fn((key) => {
      const value = store.get(key);
      return value !== undefined ? value : null;
    }),
    setItem: jest.fn((key, value) => {
      store.set(key, String(value));
    }),
    removeItem: jest.fn((key) => {
      store.delete(key);
    }),
    clear: jest.fn(() => {
      store.clear();
    }),
    // Internal method for testing
    _getStore: () => store,
  };
};

// Setup global storage mocks
const setupStorageMocks = () => {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  // Ensure window object exists
  if (typeof window === 'undefined') {
    global.window = {};
  }

  // Define localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  // Define sessionStorage mock
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });

  return { localStorageMock, sessionStorageMock };
};

// Global storage instances
let storageMocks;

// Setup mocks before each test
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // Setup fresh storage mocks
  storageMocks = setupStorageMocks();

  // Mock console methods to reduce noise
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Export storage mocks for tests to use
global.getStorageMocks = () => storageMocks;

// Performance monitoring utilities
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
  configurable: true,
});

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Supabase environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-for-testing';
