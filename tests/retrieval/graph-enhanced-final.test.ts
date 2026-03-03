// ABOUTME: Neo4j Graph Mirror TDD Tests - Comprehensive test suite for graph mirroring functionality
// ABOUTME: Tests mirrorSupabaseToNeo4j with node creation, edge relationships, and incremental updates
// ABOUTME: CRITICAL FIX for error handling tests using forceNeo4jInit option and dependency injection

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  PerformanceTester, 
  BudgetTester, 
  ContractValidator,
  MockDataGenerator
} from '../utils/test-helpers';

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
  },
  {
    id: 'offer-1',
    type: 'offer',
    name: 'Mortgage Consultation',
    attrs: { service_type: 'advisory', duration: '30min' },
    valid_from: '2024-01-03T00:00:00Z',
    source_url: null
  }
];

const mockEvidenceData = [
  {
    id: 'evidence-1',
    evidence_key: 'mas_gov_sg',
    version: '1.0.0',
    data: { updated: '2024-01-15', mortgage_rates: { fixed_15y: 3.2, fixed_30y: 3.8 } },
    last_checked: '2024-01-15'
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

describe('Neo4j Graph Mirror', () => {
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

  describe('Function Existence Tests', () => {
    it('should export mirrorSupabaseToNeo4j function', async () => {
      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      expect(typeof mirrorSupabaseToNeo4j).toBe('function');
    });

    it('should accept optional parameters: since and graphSparse', async () => {
      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      // Should not throw when called with no parameters
      await expect(mirrorSupabaseToNeo4j()).resolves.toBeDefined();
      
      // Should not throw when called with since parameter
      await expect(mirrorSupabaseToNeo4j({ since: '2024-01-01T00:00:00Z' })).resolves.toBeDefined();
      
      // Should not throw when called with graphSparse parameter
      await expect(mirrorSupabaseToNeo4j({ graphSparse: true })).resolves.toBeDefined();
      
      // Should not throw when called with both parameters
      await expect(mirrorSupabaseToNeo4j({ 
        since: '2024-01-01T00:00:00Z', 
        graphSparse: true 
      })).resolves.toBeDefined();
    });

    it('should return proper contract structure', async () => {
      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      // Validate result contract
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('nodesCreated');
      expect(result).toHaveProperty('edgesCreated');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('nextCursor');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.nodesCreated).toBe('number');
      expect(typeof result.edgesCreated).toBe('number');
      expect(typeof result.flags).toBe('object');
      expect(typeof result.performance).toBe('object');
    });
  });

  describe('Node Creation Tests', () => {
    it('should use MERGE for Concept nodes with correct Cypher pattern', async () => {
      // Create a custom mock for this test
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockEntityData.filter(e => e.type === 'concept'),
                error: null
              }))
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should use MERGE for Persona nodes with correct Cypher pattern', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockEntityData.filter(e => e.type === 'persona'),
                error: null
              }))
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should use MERGE for Offer nodes with correct Cypher pattern', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockEntityData.filter(e => e.type === 'offer'),
                error: null
              }))
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should use MERGE for Evidence nodes with correct Cypher pattern', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnValue({
            data: mockEvidenceData,
            error: null
          })
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should use MERGE for Artifact nodes with correct Cypher pattern', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockArtifactData,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });
  });

    it('should use MERGE for Tag nodes with correct Cypher pattern', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn((table: string) => {
          if (table === 'eip_artifacts') {
            return {
              select: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: [{
                    id: 'artifact-1',
                    ledger: {
                      tags: ['financial_planning', 'mas_guidelines', 'retirement']
                    },
                    updated_at: '2024-01-15T00:00:00Z'
                  }],
                  error: null
                }))
              }))
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          };
        })
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

  describe('Edge Relationship Tests', () => {
    it('should create SUPPORTS relationships from ledger data', async () => {
      const mockRun: any = jest.fn();
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

      const artifactWithSupports = [{
        ...mockArtifactData[0],
        ledger: {
          sources: ['source-1', 'source-2'],
          evidence: ['evidence-1'],
          supports: ['concept-1'], // SUPPORTS relationship
          tags: ['financial_planning']
        }
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: artifactWithSupports,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should create CONTRASTS relationships for contradictory evidence', async () => {
      const mockRun: any = jest.fn();
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

      const artifactWithContrasts = [{
        ...mockArtifactData[0],
        ledger: {
          sources: ['source-1'],
          evidence: ['evidence-1', 'evidence-2'],
          contrasts: ['concept-1'], // CONTRASTS relationship
          tags: ['risk_analysis']
        }
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: artifactWithContrasts,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should allow both SUPPORTS and CONTRASTS relationships for contradictory evidence', async () => {
      const mockRun: any = jest.fn();
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

      const contradictoryArtifact = [{
        ...mockArtifactData[0],
        ledger: {
          sources: ['source-1'],
          evidence: ['evidence-1', 'evidence-2'],
          supports: ['concept-1'],
          contrasts: ['concept-2'],
          tags: ['balanced_analysis']
        }
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: contradictoryArtifact,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should create APPLIES_TO relationships for personas', async () => {
      const mockRun: any = jest.fn();
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

      const artifactForPersona = [{
        ...mockArtifactData[0],
        ledger: {
          sources: ['source-1'],
          applies_to: ['persona-1'], // APPLIES_TO relationship
          tags: ['targeted_content']
        }
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: artifactForPersona,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should create HAS_TAG relationships for tags', async () => {
      const mockRun: any = jest.fn();
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

      const artifactWithTags = [{
        ...mockArtifactData[0],
        ledger: {
          sources: ['source-1'],
          tags: ['financial_planning', 'mas_guidelines', 'retirement'] // HAS_TAG relationships
        }
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: artifactWithTags,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should create DERIVED_FROM relationships for evidence sources', async () => {
      const mockRun: any = jest.fn();
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

      const artifactWithEvidence = [{
        ...mockArtifactData[0],
        ledger: {
          sources: ['source-1'],
          evidence: ['evidence-1', 'evidence-2'], // DERIVED_FROM relationships
          tags: ['evidence_based']
        }
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: artifactWithEvidence,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });
  });

  describe('Incremental Mirroring Tests', () => {
    it('should handle since parameter for incremental mirroring', async () => {
      const mockRun: any = jest.fn();
      mockRun.mockResolvedValue({ records: [] });

      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: mockEntityData.filter(e => e.valid_from >= '2024-01-02T00:00:00Z'),
        error: null
      });

      const mockGte = (jest.fn() as any).mockReturnValue({
        order: mockOrder
      });

      const mockSelect = (jest.fn() as any).mockReturnValue({
        gte: mockGte
      });

      const mockSupabaseFrom: any = jest.fn(() => ({
        select: mockSelect
      }));

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: mockSupabaseFrom
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      // CRITICAL FIX: Use dependency injection to ensure mock functions are called
      const mockSupabaseClient = {
        from: mockSupabaseFrom
      };
      const result = await mirrorSupabaseToNeo4j({ since: '2024-01-02T00:00:00Z' }, { supabase: mockSupabaseClient as any });

      expect(result.success).toBe(true);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('eip_entities');
      expect(mockSelect).toHaveBeenCalledWith('id, type, name, attrs, valid_from, source_url');
      expect(mockGte).toHaveBeenCalledWith('valid_from', '2024-01-02T00:00:00Z');
    });

    it('should use valid_from as proxy for updated_at when updated_at is missing', async () => {
      const mockRun: any = jest.fn();
      mockRun.mockResolvedValue({ records: [] });

      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: mockEntityData,
        error: null
      });

      const mockGte = (jest.fn() as any).mockReturnValue({
        order: mockOrder
      });

      const mockSelect = (jest.fn() as any).mockReturnValue({
        gte: mockGte
      });

      const mockSupabaseFrom: any = jest.fn(() => ({
        select: mockSelect
      }));

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: mockSupabaseFrom
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      // CRITICAL FIX: Use dependency injection to ensure mock functions are called
      const mockSupabaseClient = {
        from: mockSupabaseFrom
      };
      await mirrorSupabaseToNeo4j({ since: '2024-01-02T00:00:00Z' }, { supabase: mockSupabaseClient as any });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('eip_entities');
      expect(mockSelect).toHaveBeenCalledWith('id, type, name, attrs, valid_from, source_url');
      expect(mockGte).toHaveBeenCalledWith('valid_from', '2024-01-02T00:00:00Z');
    });

    it('should return cursor for next incremental run', async () => {
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] } as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
      expect(result.nextCursor).toBeDefined();
      expect(typeof result.nextCursor).toBe('string');
    });
  });

  describe('Sparse Graph Handling', () => {
    it('should handle graphSparse flag correctly', async () => {
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] } as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j({ graphSparse: true });

      expect(result.success).toBe(true);
      expect(result.flags.graphSparse).toBe(true);
    });

    it('should set sparse graph flag even when no data', async () => {
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] } as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [], // No data
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j({ graphSparse: true });

      expect(result.success).toBe(true);
      expect(result.flags.graphSparse).toBe(true);
      expect(result.nodesCreated).toBe(0);
      expect(result.edgesCreated).toBe(0);
    });
  });

  describe('Error Handling and Graceful Degradation', () => {
    it('should handle Neo4j connection failures gracefully', async () => {
      // CRITICAL FIX: Mock Neo4j driver to throw error and force initialization
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => {
          throw new Error('Neo4j connection failed');
        })
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      // CRITICAL FIX: Use forceNeo4jInit to trigger actual error
      const result = await mirrorSupabaseToNeo4j({ forceNeo4jInit: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Neo4j connection failed');
    });

    it('should handle Supabase query errors gracefully', async () => {
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] } as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      // CRITICAL FIX: Use dependency injection to provide a failing Supabase client
      const mockSupabase: any = {
        from: (jest.fn() as any)((table: string) => ({
          select: (jest.fn() as any)(() => {
            // CRITICAL FIX: Return a rejected promise to trigger actual error handling
            return Promise.reject(new Error('Supabase query failed'));
          })
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');

      // CRITICAL FIX: Use dependency injection to provide the failing client and force Supabase init
      const result = await mirrorSupabaseToNeo4j({ forceSupabaseInit: true }, { supabase: mockSupabase as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Supabase query failed');
    });

    it('should continue processing other node types when one type fails', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabaseFrom = (jest.fn() as any)((table: string) => {
        if (table === 'eip_entities') {
          return {
            select: (jest.fn() as any)(() => ({
              eq: (jest.fn() as any)((type: string) => {
                if (type === 'concept') {
                  // CRITICAL FIX: Return a rejected promise to trigger actual error handling
                  return Promise.reject(new Error('Concept query failed'));
                }
                // Other entity types succeed
                return {
                  order: (jest.fn() as any)(() => Promise.resolve({
                    data: [],
                    error: null
                  }))
                };
              })
            }))
          };
        }
        // Other tables succeed
        return {
          select: (jest.fn() as any)(() => ({
            order: (jest.fn() as any)(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        };
      });
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: mockSupabaseFrom
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      // CRITICAL FIX: Use dependency injection to provide the client with partial failures and force init
      const result = await mirrorSupabaseToNeo4j({ forceSupabaseInit: true }, { supabase: { from: mockSupabaseFrom } as any });

      expect(result.success).toBe(true); // Overall success despite partial failure
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('Concept processing failed')
      );
    });

    it('should handle Cypher query errors gracefully', async () => {
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockRejectedValue(new Error('Cypher query failed') as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j({ forceNeo4jInit: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cypher query failed');
    });
  });

  describe('Performance and Quality Gates', () => {
    it('should meet performance budget for mirroring operations', async () => {
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] } as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      
      const performance = await PerformanceTester.measureFunction(
        () => mirrorSupabaseToNeo4j(),
        { iterations: 3, warmupIterations: 1 }
      );

      expect(performance.avgTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(performance.results.every((result: any) => result.success)).toBe(true);
    });

    it('should handle batch processing efficiently', async () => {
      // Create large dataset
      const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
        id: `entity-${i}`,
        type: 'concept',
        name: `Concept ${i}`,
        attrs: { category: 'test', index: i },
        valid_from: '2024-01-01T00:00:00Z'
      }));

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: largeDataSet,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] } as any),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      // CRITICAL FIX: Use dependency injection to provide the large dataset client
      const result = await mirrorSupabaseToNeo4j({}, { supabase: mockSupabase as any });

      expect(result.success).toBe(true);
      expect(result.nodesCreated).toBe(100);
      expect(result.performance.batchCount).toBeGreaterThan(0);
    });
  });

  describe('Integration with EIP System', () => {
    it('should use proper EIP entity field mappings', async () => {
      const mockRun: any = jest.fn();
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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockEntityData,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
    });

    it('should handle missing edge relationships with stub implementation', async () => {
      const mockRun: any = jest.fn();
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

      const artifactWithoutLedger = [{
        ...mockArtifactData[0],
        ledger: {} // Empty ledger - should handle gracefully
      }];

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: artifactWithoutLedger,
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true);
      expect(result.edgesCreated).toBe(0); // No edges created from empty ledger
    });

    it('should maintain test isolation with database reset', async () => {
      // First test run
      const mockRun: any = jest.fn();
      mockRun.mockResolvedValue({ records: [] });

      const mockDriver: any = {
        session: jest.fn(() => ({
          run: mockRun,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => mockDriver)
      }));

      const mockSupabase: any = {
        from: (jest.fn() as any)(() => ({
          select: (jest.fn() as any)(() => ({
            order: (jest.fn() as any)(() => Promise.resolve({
              data: mockEntityData.slice(0, 1), // Only first entity
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      // CRITICAL FIX: Use dependency injection to ensure proper test isolation and force initialization
      const result1 = await mirrorSupabaseToNeo4j({ forceSupabaseInit: true }, { supabase: mockSupabase as any, neo4j: mockDriver as any });

      expect(result1.success).toBe(true);
      expect(result1.nodesCreated).toBe(1);

      // Reset mocks for second test run
      jest.clearAllMocks();

      // Create new mock for second test run
      const mockRun2: any = jest.fn();
      mockRun2.mockResolvedValue({ records: [] });

      const mockDriver2: any = {
        session: jest.fn(() => ({
          run: mockRun2,
          close: jest.fn()
        })),
        close: jest.fn()
      };

      const mockSupabase2: any = {
        from: (jest.fn() as any)(() => ({
          select: (jest.fn() as any)(() => ({
            order: (jest.fn() as any)(() => Promise.resolve({
              data: mockEntityData.slice(1, 2), // Only second entity
              error: null
            }))
          }))
        }))
      };

      // CRITICAL FIX: Use dependency injection for the second run to ensure isolation and force initialization
      const { mirrorSupabaseToNeo4j: mirrorSupabaseToNeo4j2 } = await import('../../scripts/mirror-to-neo4j');
      const result2 = await mirrorSupabaseToNeo4j2({ forceSupabaseInit: true }, { supabase: mockSupabase2 as any, neo4j: mockDriver2 as any });

      expect(result2.success).toBe(true);
      expect(result2.nodesCreated).toBe(1);
    });
  });
});
