// ABOUTME: Jest configuration for integration-env tests requiring external dependencies
// ABOUTME: Runs tests that require real Redis/Supabase connections

const base = require('./jest.eip.config.js');
const { projects, ...baseWithoutProjects } = base;

module.exports = {
  ...baseWithoutProjects,
  roots: ['<rootDir>/tests/integration-env'],
  testMatch: ['**/tests/integration-env/**/*.integration-env.test.ts'],
  testTimeout: 60000,
  maxWorkers: 1,
  displayName: 'Integration-Env Tests',
  testEnvironment: 'node'
};
