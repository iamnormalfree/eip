module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: [
    '<rootDir>/tests/ui/jest-dom-setup.test.tsx',
    '<rootDir>/tests/ui/jest-dom-js.test.js'
  ],
  verbose: true,
  cache: false,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json',
      jsx: 'react-jsx'
    }]
  }
};
