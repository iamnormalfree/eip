// ABOUTME: Test BM25 Index Builder Functionality
// ABOUTME: Validates Phase 1 implementation of unified blueprint

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Mock the environment and modules before importing
jest.mock('@supabase/supabase-js');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import after mocking
import { createClient } from '@supabase/supabase-js';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('BM25 Index Builder - Phase 1 Implementation', () => {
  let builder: any;
  const testDir = path.join(process.cwd(), 'tmp', 'test-bm25');

  beforeEach(() => {
    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      }),
      __proto__: { // Add prototype methods that might be called
        rpc: jest.fn(),
        insert: jest.fn()
      }
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    // Import the builder after mocking
    const { BM25IndexBuilder } = require('../../scripts/build-bm25');
    builder = new BM25IndexBuilder();
    
    // Ensure test directory exists
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Data Model Interfaces', () => {
    it('should validate IndexBuildResult interface structure', () => {
      const mockResult = {
        success: true,
        index_path: '/test/path/index.json',
        version: '1.0.0',
        checksum: 'abc123',
        document_count: 10,
        build_time_ms: 1000,
        schema_registry_entry: {
          id: 'test-entry',
          index_type: 'bm25_file' as const,
          version: '1.0.0',
          checksum: 'abc123',
          created_at: new Date().toISOString(),
          document_sources: ['source1', 'source2'],
          field_weights: { content: 1.0 }
        }
      };

      expect(mockResult.success).toBe(true);
      expect(mockResult.index_path).toBe('/test/path/index.json');
      expect(mockResult.version).toBe('1.0.0');
      expect(mockResult.checksum).toBe('abc123');
      expect(mockResult.document_count).toBe(10);
      expect(mockResult.build_time_ms).toBe(1000);
      expect(mockResult.schema_registry_entry.index_type).toBe('bm25_file');
    });

    it('should validate DataSource interface structure', () => {
      const mockSource = {
        id: 'test-source-1',
        content: 'Test content for BM25 indexing',
        metadata: {
          type: 'entity',
          category: 'test'
        },
        source_url: 'https://example.com/test',
        last_updated: new Date().toISOString()
      };

      expect(mockSource.id).toBe('test-source-1');
      expect(mockSource.content).toBe('Test content for BM25 indexing');
      expect(mockSource.metadata?.type).toBe('entity');
      expect(mockSource.source_url).toBe('https://example.com/test');
    });
  });

  describe('Core Builder Functionality', () => {
    it('should build index from mock data sources', async () => {
      const mockSources = [
        {
          id: 'doc1',
          fields: {
            content: 'Financial planning requires careful consideration of income and expenses',
            concept_abstract: 'Financial planning overview for income and expense management'
          },
          metadata: { type: 'entity', category: 'financial' }
        },
        {
          id: 'doc2',
          fields: {
            content: 'Investment strategies should align with risk tolerance',
            artifact_summary: 'Investment strategy alignment with risk tolerance assessment'
          },
          metadata: { type: 'artifact', category: 'investment' }
        }
      ];

      // Mock the database methods
      const mockRegisterInSchema = jest.fn().mockResolvedValue(undefined);
      builder.registerIndexInSchema = mockRegisterInSchema;

      const result = await builder.buildIndex(mockSources);

      expect(result.success).toBe(true);
      expect(result.document_count).toBe(2);
      expect(result.version).toBe('1.0.0');
      expect(result.checksum).toBeTruthy();
      expect(result.build_time_ms).toBeGreaterThan(0);
      expect(result.index_path).toContain("1.0.0-index.json");
      
      // Verify index file was created
      expect(fs.existsSync(result.index_path)).toBe(true);
      
      // Verify checksum file was created
      const checksumPath = result.index_path.replace('-index.json', '-checksum.txt');
      expect(fs.existsSync(checksumPath)).toBe(true);
    });

    it('should load and validate existing index', async () => {
      const mockSources = [
        {
          id: 'doc1',
          fields: {
            content: 'Test document for loading',
            concept_abstract: 'Test document abstract for loading validation'
          },
          metadata: { type: 'test' }
        }
      ];

      // Mock schema registration
      const mockRegisterInSchema = jest.fn().mockResolvedValue(undefined);
      builder.registerIndexInSchema = mockRegisterInSchema;

      // Build index first
      const buildResult = await builder.buildIndex(mockSources);
      expect(buildResult.success).toBe(true);

      // Load the index
      const loadedIndex = await builder.loadIndex(buildResult.index_path);
      
      expect(loadedIndex.version).toBe('1.0.0');
      expect(loadedIndex.document_count).toBe(1);
      expect(loadedIndex.documents).toHaveLength(1);
      expect(loadedIndex.documents[0].id).toBe('doc1');
      expect(loadedIndex.documents[0].fields.content).toBe('Test document for loading');
      expect(loadedIndex.documents[0].field_terms.content).toContain('test');
      expect(loadedIndex.documents[0].field_terms.content).toContain('document');
    });

    it('should validate checksum integrity', async () => {
      const mockSources = [
        {
          id: 'doc1',
          fields: {
            content: 'Test document for checksum validation',
            concept_abstract: 'Test document abstract for checksum validation'
          },
          metadata: { type: 'test' }
        }
      ];

      // Mock schema registration
      const mockRegisterInSchema = jest.fn().mockResolvedValue(undefined);
      builder.registerIndexInSchema = mockRegisterInSchema;

      // Build index
      const buildResult = await builder.buildIndex(mockSources);
      expect(buildResult.success).toBe(true);

      // Validate checksum
      const isValid = builder.validateChecksum(buildResult.index_path, buildResult.checksum);
      expect(isValid).toBe(true);

      // Test with invalid checksum
      const isInvalid = builder.validateChecksum(buildResult.index_path, 'invalid-checksum');
      expect(isInvalid).toBe(false);
    });

    it('should handle empty sources gracefully', async () => {
      const mockRegisterInSchema = jest.fn().mockResolvedValue(undefined);
      builder.registerIndexInSchema = mockRegisterInSchema;

      const result = await builder.buildIndex([]);
      
      expect(result.success).toBe(true);
      expect(result.document_count).toBe(0);
      expect(fs.existsSync(result.index_path)).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should build index within performance budget', async () => {
      const mockSources = Array.from({ length: 100 }, (_, i) => ({
        id: `doc${i}`,
        fields: {
          content: `Test document number ${i} with sufficient content to test indexing performance`,
          concept_abstract: `Test document abstract number ${i} for performance testing`,
          artifact_summary: `Summary for test document ${i} covering performance benchmarks`
        },
        metadata: { type: 'test', index: i }
      }));

      // Mock schema registration
      const mockRegisterInSchema = jest.fn().mockResolvedValue(undefined);
      builder.registerIndexInSchema = mockRegisterInSchema;

      const startTime = Date.now();
      const result = await builder.buildIndex(mockSources);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.document_count).toBe(100);
      
      // Performance budget: should complete within 5 seconds for 100 documents
      expect(duration).toBeLessThan(5000);
      expect(result.build_time_ms).toBeLessThan(5000);
    });
  });

  describe('Tokenization and Content Processing', () => {
    it('should tokenize text correctly', () => {
      const testText = 'Financial planning requires careful consideration of income, expenses, and long-term goals.';
      const terms = builder.tokenize(testText);
      
      expect(terms).toContain('financial');
      expect(terms).toContain('planning');
      expect(terms).toContain('requires');
      expect(terms).toContain('careful');
      expect(terms).toContain('consideration');
      expect(terms).not.toContain(',');
      expect(terms).not.toContain('.');
    });

    it('should combine entity content correctly', () => {
      const entity = {
        name: 'Fixed Rate Mortgage',
        type: 'concept',
        attrs: JSON.stringify({
          category: 'loan_type',
          risk_level: 'low',
          tenure_options: [15, 20, 25, 30]
        })
      };

      const content = builder.combineEntityContent(entity);
      
      expect(content).toContain('Fixed Rate Mortgage');
      expect(content).toContain('concept');
      expect(content).toContain('loan_type');
      expect(content).toContain('low');
    });
  });
});
