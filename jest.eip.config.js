// ABOUTME: Enhanced EIP Jest configuration for comprehensive test infrastructure
// ABOUTME: Implements unified audit fix blueprint with 80% coverage threshold

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/lib_supabase', 
    '<rootDir>/orchestrator', 
    '<rootDir>/tests',
    '<rootDir>/src'
  ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx',
    'tests/**/*.test.ts',
    'tests/**/*.test.tsx'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js', 
    '<rootDir>/jest.eip.setup.js',
    '<rootDir>/tests/setup/jest.setup.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/(.*)lib_supabase(.*)$': '<rootDir>/lib_supabase/$1',
    '^@/(.*)orchestrator(.*)$': '<rootDir>/orchestrator/$1',
    '^@/(.*)src(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'lib_supabase/**/*.{ts,tsx}',
    'orchestrator/**/*.{ts}',
    'src/**/*.{ts,tsx}',
    'tests/utils/**/*.{ts,tsx}',
    '!lib_supabase/**/*.d.ts',
    '!orchestrator/**/*.d.ts',
    '!src/**/*.d.ts',
    '!lib_supabase/**/__tests__/**',
    '!orchestrator/**/__tests__/**',
    '!src/**/__tests__/**',
    '!tests/**/__tests__/**',
    '!**/*.config.*',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80, // Enhanced to meet audit requirements
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './orchestrator/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './lib_supabase/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    }
  },
  testTimeout: 30000,
  verbose: true,
  
  // Enhanced EIP test projects for better organization
  projects: [
    {
      displayName: 'Database Tests',
      testMatch: ['<rootDir>/tests/db/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 15000,
      setupFilesAfterEnv: ['<rootDir>/tests/setup/database.setup.ts']
    },
    {
      displayName: 'Orchestrator Tests',
      testMatch: ['<rootDir>/tests/orchestrator/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 20000,
      setupFilesAfterEnv: ['<rootDir>/tests/setup/orchestrator.setup.ts']
    },
    {
      displayName: 'UI Component Tests',
      testMatch: ['<rootDir>/tests/src/**/*.test.tsx'],
      testEnvironment: 'jsdom',
      testTimeout: 10000,
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/ui.setup.tsx',
        '@testing-library/jest-dom'
      ]
    }
  ],

  // Global test variables for EIP testing
  globals: {
    'EIP_TEST_MODE': 'steel_thread',
    'EIP_MOCK_EXTERNAL_SERVICES': true,
    'EIP_PERFORMANCE_TESTING': true,
    'EIP_COVERAGE_THRESHOLD': 80,
    'EIP_INTEGRATION_TESTING': true,
    'ts-jest': {
      useESM: true
    }
  },

  // Error handling for better debugging
  errorOnDeprecated: true,
  notify: false,
  notifyMode: 'failure-change',
  bail: false, // Continue on failure to see all test results

  // Module mocking for production code testing
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};
