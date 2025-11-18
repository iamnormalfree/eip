// ABOUTME: Fixed EIP Jest configuration with comprehensive TypeScript support
// ABOUTME: Phase 3 Infrastructure - Environment Segregation, Module Resolution
// ABOUTME: Updated with centralized MockFactory integration and performance testing utilities

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
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
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json'
    }],
    '^.+\\.tsx$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: [
    '<rootDir>/tests/setup/jest.polyfills.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/tests/setup/jest.setup.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // MockFactory module mappings for centralized mock creation
    '^@mock-factory/(.*)$': '<rootDir>/tests/mocks/factory/$1',
    // Performance testing utilities module mapping
    '^@performance/(.*)$': '<rootDir>/tests/utils/performance/$1',
    // Simple UUID module resolution fix
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
    // CSS and asset imports
    '^\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|bullmq|ioredis|winston|@supabase|@ai-sdk))'
  ],
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
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    }
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  maxWorkers: 1,
  cache: false, // Disable cache temporarily to force reload
  // Environment-specific timeout adjustments
  testTimeout: (process.env.CI === 'true' ? 60000 : 30000) // Longer timeouts in CI
};
