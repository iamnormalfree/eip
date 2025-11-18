// ABOUTME: Queue-specific test setup for BullMQ integration testing
// ABOUTME: Provides enhanced mocks and utilities for queue infrastructure testing

import { jest } from '@jest/globals';

// Enhanced queue mock infrastructure for integration testing
const createQueueMock = () => {
  const jobs = new Map();
  const workers = new Map();
  const events = new Map();

  const queue = {
    // Basic queue operations
    add: jest.fn().mockImplementation(async (name: string, data: any, options?: any) => {
      const jobId = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      jobs.set(jobId, {
        id: jobId,
        name,
        data,
        options,
        status: 'waiting',
        createdAt: Date.now(),
        processedOn: null,
        finishedOn: null
      });
      return { id: jobId };
    }),
    
    getJob: jest.fn().mockImplementation(async (jobId: string) => {
      return jobs.get(jobId) || null;
    }),
    
    // Queue state management
    getWaiting: jest.fn().mockImplementation(async () => {
      return Array.from(jobs.values()).filter(job => job.status === 'waiting');
    }),
    
    getActive: jest.fn().mockImplementation(async () => {
      return Array.from(jobs.values()).filter(job => job.status === 'active');
    }),
    
    getCompleted: jest.fn().mockImplementation(async () => {
      return Array.from(jobs.values()).filter(job => job.status === 'completed');
    }),
    
    getFailed: jest.fn().mockImplementation(async () => {
      return Array.from(jobs.values()).filter(job => job.status === 'failed');
    }),
    
    // Queue control
    pause: jest.fn().mockImplementation(async () => {
      return Promise.resolve();
    }),
    
    resume: jest.fn().mockImplementation(async () => {
      return Promise.resolve();
    }),
    
    close: jest.fn().mockImplementation(async () => {
      jobs.clear();
      workers.clear();
      events.clear();
      return Promise.resolve();
    }),
    
    // Exception testing utilities
    _simulateConnectionFailure: () => {
      const mockFn = queue.add as jest.MockedFunction<typeof queue.add>;
      mockFn.mockRejectedValueOnce(new Error('Redis connection timeout'));
    },

    _simulateQueueFull: () => {
      const mockFn = queue.add as jest.MockedFunction<typeof queue.add>;
      mockFn.mockRejectedValueOnce(new Error('Queue is full'));
    },
    
    _simulateJobFailure: (jobId: string) => {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.failedAt = Date.now();
      }
    },
    
    _simulateJobCompletion: (jobId: string, result?: any) => {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.processedOn = Date.now();
        job.finishedOn = Date.now();
        job.result = result;
      }
    },
    
    // Test utilities
    _getJobs: () => Array.from(jobs.values()),
    _clearJobs: () => jobs.clear(),
    _jobCount: () => jobs.size
  };

  return queue;
};

// Global test utilities for queue integration testing
(global as any).queueTestUtils = {
  // Queue testing utilities
  createMockJob: (overrides: any = {}) => ({
    id: 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    name: 'content-generation',
    data: {
      brief: 'Test brief for queue integration',
      tier: 'MEDIUM',
      correlation_id: 'test-correlation-123',
      ...overrides
    },
    opts: {
      priority: 3,
      delay: 0,
      attempts: 3,
      ...overrides.opts
    },
    ...overrides
  }),
  
  // Async operation helpers
  waitForAsync: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  flushPromises: () => new Promise(resolve => setImmediate(resolve))
};

export {};
