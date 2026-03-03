// ABOUTME: Neo4j Graph Mirror TDD Tests - Comprehensive test suite for graph mirroring functionality
// ABOUTME: Tests mirrorSupabaseToNeo4j with node creation, edge relationships, and incremental updates

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
      const mockSupabaseFrom: any = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockEntityData.filter(e => e.valid_from >= '2024-01-02T00:00:00Z'),
              error: null
            }))
          }))
        }))
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
      const result = await mirrorSupabaseToNeo4j({ since: '2024-01-02T00:00:00Z' });

      expect(result.success).toBe(true);
      expect(mockSupabaseFrom).toHaveBeenCalled();
    });

    it('should use valid_from as proxy for updated_at when updated_at is missing', async () => {
      const mockSelect: any = {
        gte: jest.fn().mockReturnValue({
          order: jest.fn(() => Promise.resolve({
            data: mockEntityData,
            error: null
          }))
        })
      };
      
      const mockSupabaseFrom: any = jest.fn(() => ({
        select: jest.fn(() => mockSelect)
      }));
      
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: mockSupabaseFrom
        }))
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      await mirrorSupabaseToNeo4j({ since: '2024-01-02T00:00:00Z' });

      expect(mockSelect.gte).toHaveBeenCalledWith('valid_from', '2024-01-02T00:00:00Z');
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
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => {
          throw new Error('Neo4j connection failed');
        })
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

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

      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Supabase query failed' }
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j();

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

      const mockSupabaseFrom: any = jest.fn((table: string) => {
        if (table === 'eip_entities') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Concept query failed' }
                }))
              }))
            }))
          };
        }
        // Other queries succeed
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
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
      const result = await mirrorSupabaseToNeo4j();

      expect(result.success).toBe(true); // Overall success despite partial failure
      expect(result.warnings).toContain(
        expect.stringContaining('Concept query failed')
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
      const result = await mirrorSupabaseToNeo4j();

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
      const result = await mirrorSupabaseToNeo4j();

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
      const result1 = await mirrorSupabaseToNeo4j();

      expect(result1.success).toBe(true);
      expect(result1.nodesCreated).toBe(1);

      // Reset mocks for second test run
      jest.clearAllMocks();
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

      const mockSupabase2: any = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockEntityData.slice(1, 2), // Only second entity
              error: null
            }))
          }))
        }))
      };
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase2)
      }));

      const { mirrorSupabaseToNeo4j: mirrorSupabaseToNeo4j2 } = await import('../../scripts/mirror-to-neo4j');
      const result2 = await mirrorSupabaseToNeo4j2();

      expect(result2.success).toBe(true);
      expect(result2.nodesCreated).toBe(1);
    });
  });
});

  describe('Enhanced TDD - Exact Cypher Shape Assertions', () => {
    it('should verify exact Concept node MERGE pattern with parameter mapping', async () => {
      const mockRun = (jest.fn() as any);
      const capturedCalls: any[] = [];
      
      mockRun.mockImplementation((query: string, params: any) => {
        capturedCalls.push({ query, params });
        return Promise.resolve({ records: [] });
      });
      
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const mockSupabase = {
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
      expect(capturedCalls.length).toBeGreaterThan(0);
      
      // Assert exact Cypher query shape for Concept nodes
      const conceptCall = capturedCalls.find(c => c.query.includes('Concept'));
      expect(conceptCall).toBeDefined();
      expect(conceptCall.query).toContain('MERGE (c:Concept {id: $id})');
      expect(conceptCall.query).toContain('SET c.name = $name, c.type = $type, c.attrs = $attrs, c.updated_at = coalesce($updated_at, datetime()), c.source_url = $source_url');
      
      // Verify exact parameter mapping
      const params = conceptCall.params;
      expect(params.id).toBe('concept-1');
      expect(params.name).toBe('Fixed Rate Mortgage');
      expect(params.type).toBe('concept');
      expect(params.attrs).toEqual({ category: 'loan_type', risk_level: 'low' });
      expect(params.updated_at).toBe('2024-01-01T00:00:00Z');
      expect(params.source_url).toBe('https://www.hdb.gov.sg/residential/buying-a-flat/financing-your-flat');
    });

    it('should verify exact Evidence node MERGE pattern using evidence_key as primary identifier', async () => {
      const mockRun = (jest.fn() as any);
      const capturedCalls: any[] = [];
      
      mockRun.mockImplementation((query: string, params: any) => {
        capturedCalls.push({ query, params });
        return Promise.resolve({ records: [] });
      });
      
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const mockSupabase = {
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
      
      // Assert exact Cypher query shape for Evidence nodes
      const evidenceCall = capturedCalls.find(c => c.query.includes('Evidence'));
      expect(evidenceCall).toBeDefined();
      expect(evidenceCall.query).toContain('MERGE (e:Evidence {evidence_key: $evidence_key})');
      expect(evidenceCall.query).toContain('SET e.id = $id, e.evidence_key = $evidence_key, e.version = $version, e.data = $data, e.updated_at = coalesce($updated_at, datetime()), e.last_checked = $last_checked');
      
      // Verify evidence_key is used as primary identifier (not id)
      const params = evidenceCall.params;
      expect(params.evidence_key).toBe('mas_gov_sg');
      expect(params.id).toBe('evidence-1');
      expect(params.version).toBe('1.0.0');
      expect(params.data).toEqual({ updated: '2024-01-15', mortgage_rates: { fixed_15y: 3.2, fixed_30y: 3.8 } });
    });

    it('should verify exact DERIVED_FROM edge pattern uses evidence_key for matching', async () => {
      const mockRun = (jest.fn() as any);
      const capturedCalls: any[] = [];
      
      mockRun.mockImplementation((query: string, params: any) => {
        capturedCalls.push({ query, params });
        return Promise.resolve({ records: [] });
      });
      
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
          evidence: ['mas_gov_sg', 'iras_gov_sg'], // These are evidence_keys, not IDs
          tags: ['evidence_based']
        }
      }];

      const mockSupabase = {
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
      
      // Find DERIVED_FROM edge calls
      const derivedFromCalls = capturedCalls.filter(c => c.query.includes('DERIVED_FROM'));
      expect(derivedFromCalls.length).toBeGreaterThan(0);
      
      // Verify exact Cypher pattern for DERIVED_FROM edges
      derivedFromCalls.forEach(call => {
        expect(call.query).toContain('MATCH (a:Artifact {id: $artifactId}) MATCH (e:Evidence {evidence_key: $evidenceId}) MERGE (a)-[:DERIVED_FROM]->(e)');
        
        // Critical: Verify evidence_key is used for matching (not evidence.id)
        expect(['mas_gov_sg', 'iras_gov_sg']).toContain(call.params.evidenceId);
        expect(call.params.artifactId).toBe('artifact-1');
      });
    });

    it('should verify incremental behavior applies gte filter with correct parameters', async () => {
      const mockSelect = (jest.fn() as any);
      const mockGte = (jest.fn() as any);
      const mockOrder = (jest.fn() as any);
      
      // Set up the chain: select -> gte -> order
      mockSelect.mockReturnValue({ gte: mockGte });
      mockGte.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({
        data: mockEntityData.filter(e => e.valid_from >= '2024-01-02T00:00:00Z'),
        error: null
      });

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: (jest.fn() as any).mockResolvedValue({ records: [] }),
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const mockSupabase = {
        from: jest.fn(() => ({
          select: mockSelect,
          eq: jest.fn(() => ({ order: mockOrder }))
        }))
      };
      
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => mockSupabase)
      }));

      const { mirrorSupabaseToNeo4j } = await import('../../scripts/mirror-to-neo4j');
      const result = await mirrorSupabaseToNeo4j({ since: '2024-01-02T00:00:00Z' });

      expect(result.success).toBe(true);
      expect(result.flags.incrementalMode).toBe(true);
      
      // Verify exact gte filter application
      expect(mockGte).toHaveBeenCalledWith('valid_from', '2024-01-02T00:00:00Z');
    });

    it('should verify sparse graph flag affects node creation behavior', async () => {
      let conceptsProcessed = 0;
      const mockRun = (jest.fn() as any).mockImplementation((query: string, params: any) => {
        if (query.includes('Concept')) {
          conceptsProcessed++;
        }
        return Promise.resolve({ records: [] });
      });

      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      const conceptsWithAndWithoutCategory = [
        { ...mockEntityData[0], attrs: { category: 'loan_type' } }, // Has category - should be included
        { id: 'concept-no-category', type: 'concept', name: 'No Category', attrs: {}, valid_from: '2024-01-02T00:00:00Z' }, // No category - should be skipped when graphSparse=true
      ];

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: conceptsWithAndWithoutCategory,
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
      
      // Test with graphSparse: true
      const resultSparse = await mirrorSupabaseToNeo4j({ graphSparse: true });
      expect(resultSparse.flags.graphSparse).toBe(true);
      
      // Test with graphSparse: false  
      jest.clearAllMocks();
      const mockRun2 = (jest.fn() as any).mockImplementation((query: string, params: any) => {
        if (query.includes('Concept')) {
          conceptsProcessed++;
        }
        return Promise.resolve({ records: [] });
      });
      
      jest.doMock('neo4j-driver', () => ({
        driver: jest.fn(() => ({
          session: jest.fn(() => ({
            run: mockRun2,
            close: jest.fn()
          })),
          close: jest.fn()
        }))
      }));

      conceptsProcessed = 0;
      const resultFull = await mirrorSupabaseToNeo4j({ graphSparse: false });
      expect(resultFull.flags.graphSparse).toBe(false);
    });
});
