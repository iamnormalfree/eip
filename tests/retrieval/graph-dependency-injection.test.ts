// ABOUTME: Dependency Injection Tests for Neo4j Graph Mirror
// ABOUTME: Tests the enhanced mirror function with client injection for test isolation

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock data for testing
const mockEntityData = [
  {
    id: 'concept-1',
    type: 'concept',
    name: 'Fixed Rate Mortgage',
    attrs: { category: 'loan_type', risk_level: 'low' },
    valid_from: '2024-01-01T00:00:00Z',
    source_url: 'https://www.hdb.gov.sg/residential/buying-a-flat/financing-your-flat'
  },
  {
    id: 'persona-1',
    type: 'persona',
    name: 'First-Time Home Buyer',
    attrs: { age_range: [25, 35], income_level: 'middle' },
    valid_from: '2024-01-02T00:00:00Z',
    source_url: null
  }
];

const mockArtifactData = [
  {
    id: 'artifact-1',
    brief: 'Financial planning guide',
    ip_used: 'framework@1.0.0',
    tier: 'MEDIUM',
    persona: 'first_time_buyer',
    funnel: 'awareness',
    ledger: {
      sources: ['source-1', 'source-2'],
      evidence: ['evidence-1'],
      tags: ['financial_planning', 'mas_guidelines']
    },
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
];

describe('Neo4j Graph Mirror - Dependency Injection', () => {
  const mockConsole = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.console = mockConsole as any;
  });

  afterEach(() => {
    global.console = require('console');
    jest.resetModules();
  });

  describe('Dependency Injection Interface', () => {
    it('should support client injection without environment variables', async () => {
      // Create mock clients
      const mockSupabaseClient: any = {
        from: jest.fn((table: string) => {
          if (table === 'eip_entities') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() => Promise.resolve({
                    data: mockEntityData,
                    error: null
                  }))
                }))
              }))
            };
          }
          if (table === 'eip_artifacts') {
            return {
              select: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: mockArtifactData,
                  error: null
                }))
              }))
            };
          }
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          };
        })
      };

      // Fix TypeScript errors by typing the mock explicitly
      const mockRun: jest.MockedFunction<any> = jest.fn();
      mockRun.mockResolvedValue({ records: [] });
      const mockNeo4jDriver: any = {
        session: jest.fn(() => ({
          run: mockRun,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      // Import and test with injected clients
      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      const result = await mirrorSupabaseToNeo4j(
        { graphSparse: false },
        {
          supabase: mockSupabaseClient,
          neo4j: mockNeo4jDriver
        }
      );

      expect(result.success).toBe(true);
      expect(result.nodesCreated).toBeGreaterThan(0);
      expect(result.flags.graphSparse).toBe(false);
      
      // Verify injected clients were used
      expect(mockSupabaseClient.from).toHaveBeenCalled();
      expect(mockNeo4jDriver.session).toHaveBeenCalled();
    });

    it('should maintain backward compatibility without injected clients', async () => {
      // This should work with existing mock pattern
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: mockEntityData,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }));

      const mockRun: jest.MockedFunction<any> = jest.fn();
      mockRun.mockResolvedValue({ records: [] });
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      // Should work without clients parameter
      const result = await mirrorSupabaseToNeo4j({ graphSparse: true });

      expect(result.success).toBe(true);
      expect(result.flags.graphSparse).toBe(true);
    });

    it('should handle mixed injection (only Supabase client)', async () => {
      const mockSupabaseClient: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockEntityData.slice(0, 1), // Only one entity
                error: null
              }))
            }))
          }))
        }))
      };

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      const result = await mirrorSupabaseToNeo4j(
        { graphSparse: false },
        { supabase: mockSupabaseClient }
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('should handle mixed injection (only Neo4j driver)', async () => {
      const mockRun: jest.MockedFunction<any> = jest.fn();
      mockRun.mockResolvedValue({ records: [] });
      const mockNeo4jDriver: any = {
        session: jest.fn(() => ({
          run: mockRun,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      // Mock Supabase to work without environment variables
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: mockEntityData,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      const result = await mirrorSupabaseToNeo4j(
        { graphSparse: false },
        { neo4j: mockNeo4jDriver }
      );

      expect(result.success).toBe(true);
      expect(mockNeo4jDriver.session).toHaveBeenCalled();
    });
  });

  describe('Test Environment Fallbacks', () => {
    it('should use mock Supabase client in test environment without injection', async () => {
      // Set test environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      try {
        // Mock Neo4j but not Supabase
        const mockRun: jest.MockedFunction<any> = jest.fn();
        mockRun.mockResolvedValue({ records: [] });
        jest.doMock('neo4j-driver', () => ({
          driver: jest.fn(() => ({
            session: jest.fn(() => ({
              run: mockRun,
              close: jest.fn()
            })),
            close: jest.fn()
          }))
        }));

        const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
        
        // Should work even without Supabase environment variables
        const result = await mirrorSupabaseToNeo4j();

        expect(result.success).toBe(true);
        expect(mockConsole.warn).toHaveBeenCalledWith(
          'Using mock Supabase client in test environment'
        );
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should use mock Neo4j driver in test environment without injection', async () => {
      // Set test environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'jest';
      
      try {
        // Mock Supabase but not Neo4j
        jest.doMock('@supabase/supabase-js', () => ({
          createClient: jest.fn(() => ({
            from: jest.fn(() => ({
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() => Promise.resolve({
                    data: mockEntityData,
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }));

        const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
        
        // Should work even without Neo4j environment variables
        const result = await mirrorSupabaseToNeo4j();

        expect(result.success).toBe(true);
        expect(mockConsole.warn).toHaveBeenCalledWith(
          'Using mock Neo4j driver in test environment'
        );
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('Resource Management', () => {
    it('should not close injected Neo4j drivers', async () => {
      const mockRun: jest.MockedFunction<any> = jest.fn();
      mockRun.mockResolvedValue({ records: [] });
      const mockNeo4jDriver: any = {
        session: jest.fn(() => ({
          run: mockRun,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      const mockSupabaseClient: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      };

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      await mirrorSupabaseToNeo4j({}, { supabase: mockSupabaseClient, neo4j: mockNeo4jDriver });

      // Should not close injected drivers
      expect(mockNeo4jDriver.close).not.toHaveBeenCalled();
    });

    it('should close created Neo4j drivers when not injected', async () => {
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      }));

      const mockRun: jest.MockedFunction<any> = jest.fn();
      mockRun.mockResolvedValue({ records: [] });
      const mockNeo4jDriver: any = {
        session: jest.fn(() => ({
          run: mockRun,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => mockNeo4jDriver)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      await mirrorSupabaseToNeo4j();

      // Should close created drivers
      expect(mockNeo4jDriver.close).toHaveBeenCalled();
    });
  });

  describe('Enhanced API Features', () => {
    it('should track injected client usage in logs', async () => {
      const mockSupabaseClient: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      };

      const mockRun: jest.MockedFunction<any> = jest.fn();
      mockRun.mockResolvedValue({ records: [] });
      const mockNeo4jDriver: any = {
        session: jest.fn(() => ({
          run: mockRun,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      await mirrorSupabaseToNeo4j(
        { graphSparse: true },
        { supabase: mockSupabaseClient, neo4j: mockNeo4jDriver }
      );

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Starting mirror operation...',
        expect.objectContaining({
          hasInjectedClients: true
        })
      );
    });

    it('should handle test isolation with different mock data', async () => {
      // Test 1: First dataset
      const mockSupabaseClient1: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockEntityData.slice(0, 1), // First entity only
                error: null
              }))
            }))
          }))
        }))
      };

      const mockRun1: jest.MockedFunction<any> = jest.fn();
      mockRun1.mockResolvedValue({ records: [] });
      const mockNeo4jDriver1: any = {
        session: jest.fn(() => ({
          run: mockRun1,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      const result1 = await mirrorSupabaseToNeo4j(
        {},
        { supabase: mockSupabaseClient1, neo4j: mockNeo4jDriver1 }
      );

      expect(result1.success).toBe(true);

      // Test 2: Different dataset with same function
      jest.clearAllMocks();

      const mockSupabaseClient2: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockEntityData.slice(1, 2), // Second entity only
                error: null
              }))
            }))
          }))
        }))
      };

      const mockRun2: jest.MockedFunction<any> = jest.fn();
      mockRun2.mockResolvedValue({ records: [] });
      const mockNeo4jDriver2: any = {
        session: jest.fn(() => ({
          run: mockRun2,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      const result2 = await mirrorSupabaseToNeo4j(
        {},
        { supabase: mockSupabaseClient2, neo4j: mockNeo4jDriver2 }
      );

      expect(result2.success).toBe(true);
      expect(mockSupabaseClient1.from).not.toHaveBeenCalled();
      expect(mockSupabaseClient2.from).toHaveBeenCalled();
    });
  });
});
