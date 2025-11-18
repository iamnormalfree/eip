// ABOUTME: Integration tests for monitoring API endpoints
// ABOUTME: Validates that health and metrics endpoints work correctly

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getHealthEndpoint, getMetricsEndpoint } from '../orchestrator/monitoring';

describe('EIP Orchestrator Monitoring Integration', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      headers: {
        'user-agent': 'test-agent'
      },
      ip: '127.0.0.1'
    };

    // Mock response object
    mockRes = {
      set: jest.fn(),
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('Health Endpoint', () => {
    it('should return health status successfully', async () => {
      const healthHandler = getHealthEndpoint();

      await healthHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          version: expect.any(String)
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const healthHandler = getHealthEndpoint();

      // Mock process.memoryUsage to throw an error
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => {
        throw new Error('Memory error');
      }) as any;

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: expect.any(String)
        })
      );

      // Restore original process.memoryUsage
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return metrics successfully', async () => {
      const metricsHandler = getMetricsEndpoint();

      await metricsHandler(mockReq, mockRes);

      expect(mockRes.set).toHaveBeenCalledWith('Content-Type', expect.stringContaining('text/plain'));
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should set correct content type', async () => {
      const metricsHandler = getMetricsEndpoint();

      await metricsHandler(mockReq, mockRes);

      expect(mockRes.set).toHaveBeenCalledWith('Content-Type', expect.stringMatching(/text\/plain/));
    });

    it('should handle errors gracefully', async () => {
      const metricsHandler = getMetricsEndpoint();

      // Mock a scenario that might cause errors
      mockRes.set = jest.fn(() => {
        throw new Error('Response error');
      });

      await metricsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.end).toHaveBeenCalledWith('Failed to get metrics');
    });
  });

  describe('Endpoint Error Handling', () => {
    it('should handle missing request headers', async () => {
      const healthHandler = getHealthEndpoint();
      const emptyReq = {};

      await healthHandler(emptyReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle missing response methods', async () => {
      const healthHandler = getHealthEndpoint();
      const incompleteRes = {
        json: jest.fn()
      };

      await healthHandler(mockReq, incompleteRes);

      expect(incompleteRes.json).toHaveBeenCalled();
    });
  });
});