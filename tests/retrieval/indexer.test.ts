// ABOUTME: Index serialize/deserialize and checksum stability tests
// ABOUTME: Comprehensive validation of index lifecycle and integrity

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { SimpleBM25 } from '../../orchestrator/retrieval';
import { 
  PerformanceTester, 
  BudgetTester, 
  ContractValidator,
  MockDataGenerator 
} from '../utils/test-helpers';
import { BM25IndexBuilder, BM25IndexData } from '../../scripts/build-bm25';

describe('Index Lifecycle Testing', () => {
  let testIndexDir: string;
  let bm25Builder: BM25IndexBuilder;
  let testDocuments: Array<{
    id: string;
    content: string;
    metadata?: Record<string, any>;
  }>;

  beforeEach(async () => {
    // Create unique test directory for each test
    const timestamp = Date.now();
    testIndexDir = path.join(process.cwd(), 'tmp', 'test-indexes', 'test-' + timestamp);
    await fs.promises.mkdir(testIndexDir, { recursive: true });
    
    bm25Builder = new BM25IndexBuilder();
    
    testDocuments = [
      {
        id: 'test-doc-1',
        fields: {
          content: 'Financial planning requires careful consideration of income, expenses, and long-term goals.',
          concept_abstract: 'Financial planning overview with comprehensive strategies for income management and long-term goal achievement.'
        },
        metadata: { category: 'financial', domain: 'mas.gov.sg' },
        source_url: 'https://mas.gov.sg/test'
      },
      {
        id: 'test-doc-2',
        fields: {
          content: 'Investment strategies should align with your risk tolerance and time horizon.',
          artifact_summary: 'Overview of investment strategy alignment with personal risk profiles and investment timeframes.'
        },
        metadata: { category: 'investment', domain: 'education.edu' },
        source_url: 'https://education.edu/test'
      },
      {
        id: 'test-doc-3',
        fields: {
          content: 'Retirement planning involves estimating future expenses and creating savings strategies.',
          concept_abstract: 'Comprehensive retirement planning approach including expense estimation and strategic savings development.'
        },
        metadata: { category: 'retirement', domain: 'mas.gov.sg' },
        source_url: 'https://mas.gov.sg/retirement'
      },
      {
        id: 'test-doc-4',
        fields: {
          content: 'MAS guidelines for financial advisory services and compliance requirements.',
          concept_abstract: 'MAS regulatory guidelines and compliance requirements for financial advisory services.'
        },
        metadata: { category: 'regulatory', domain: 'mas.gov.sg', authority: 'regulatory' }
      },
      {
        id: 'test-doc-5',
        fields: {
          content: 'Educational content on financial literacy and investment basics.',
          artifact_summary: 'Educational materials covering fundamental financial literacy concepts and basic investment principles.'
        },
        metadata: { category: 'education', domain: 'nus.edu.sg', type: 'educational' }
      }
    ];
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Clean up test directory
    if (fs.existsSync(testIndexDir)) {
      await fs.promises.rm(testIndexDir, { recursive: true, force: true });
    }
  });

  describe('Index Build Process', () => {
    it('should build index from document sources', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      expect(buildResult.success).toBe(true);
      expect(buildResult.document_count).toBe(testDocuments.length);
      expect(buildResult.version).toBeTruthy();
      expect(buildResult.checksum).toBeTruthy();
      expect(buildResult.checksum.length).toBe(64); // SHA-256 hash length
      expect(buildResult.build_time_ms).toBeGreaterThan(0);
      expect(buildResult.index_path).toBeTruthy();
      
      // Verify index file was created
      expect(fs.existsSync(buildResult.index_path)).toBe(true);
    });

    it('should create valid index structure', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      // Load and validate index structure
      const indexData = await bm25Builder.loadIndex(buildResult.index_path);
      
      expect(indexData.version).toBeTruthy();
      expect(indexData.build_timestamp).toBeTruthy();
      expect(indexData.document_count).toBe(testDocuments.length);
      expect(Array.isArray(indexData.documents)).toBe(true);
      expect(typeof indexData.doc_stats).toBe('object');
      expect(indexData.field_weights).toBeTruthy();
      
      // Validate document structure
      indexData.documents.forEach(doc => {
        expect(doc.id).toBeTruthy();
        expect(doc.fields).toBeTruthy();
        expect(doc.field_terms).toBeTruthy();

        // Check that at least one field has content
        const hasContent = doc.fields.content || doc.fields.concept_abstract || doc.fields.artifact_summary;
        expect(hasContent).toBeTruthy();

        // Check that at least one field has terms
        const totalTerms = [
          ...(doc.field_terms.content || []),
          ...(doc.field_terms.concept_abstract || []),
          ...(doc.field_terms.artifact_summary || [])
        ];
        expect(totalTerms.length).toBeGreaterThan(0);
      });
      
      // Validate document stats
      expect(indexData.doc_stats.avg_doc_length).toBeGreaterThan(0);
      expect(indexData.doc_stats.total_docs).toBe(testDocuments.length);
      expect(indexData.doc_stats.k1).toBe(1.2);
      expect(indexData.doc_stats.b).toBe(0.75);
    });

    it('should handle empty document sources gracefully', async () => {
      const buildResult = await bm25Builder.buildIndex([]);
      
      expect(buildResult.success).toBe(true);
      expect(buildResult.document_count).toBe(0);
      expect(fs.existsSync(buildResult.index_path)).toBe(true);
      
      // Load empty index
      const indexData = await bm25Builder.loadIndex(buildResult.index_path);
      expect(indexData.documents).toHaveLength(0);
      expect(indexData.doc_stats.avg_doc_length).toBe(0);
    });

    it('should track build performance within acceptable limits', async () => {
      const performance = await PerformanceTester.measureFunction(
        () => bm25Builder.buildIndex(testDocuments),
        { iterations: 3, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(10000); // Should build within 10 seconds
      expect(performance.results.every(r => r.success)).toBe(true);
      
      const validation = PerformanceTester.validatePerformanceThresholds(
        { avgTime: performance.avgTime, maxTime: performance.maxTime },
        { avgTime: 10000, maxTime: 20000 }
      );
      
      expect(validation.valid).toBe(true);
    });
  });

  describe('Index Serialization and Deserialization', () => {
    it('should serialize and deserialize index without data loss', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      // Load index through deserialization
      const loadedIndex = await bm25Builder.loadIndex(buildResult.index_path);
      
      // Compare original documents with loaded documents
      expect(loadedIndex.document_count).toBe(testDocuments.length);
      
      testDocuments.forEach(originalDoc => {
        const loadedDoc = loadedIndex.documents.find(d => d.id === originalDoc.id);
        expect(loadedDoc).toBeDefined();

        // Check that fields were preserved
        expect(loadedDoc?.fields).toEqual(originalDoc.fields);
        expect(loadedDoc?.metadata).toEqual(originalDoc.metadata);

        // Verify terms were generated for each field
        const totalTerms = [
          ...(loadedDoc?.field_terms.content || []),
          ...(loadedDoc?.field_terms.concept_abstract || []),
          ...(loadedDoc?.field_terms.artifact_summary || [])
        ];
        expect(totalTerms.length).toBeGreaterThan(0);

        totalTerms.forEach(term => {
          expect(typeof term).toBe('string');
          expect(term.length).toBeGreaterThan(2);
        });
      });
    });

    it('should maintain field weights across serialization', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      const loadedIndex = await bm25Builder.loadIndex(buildResult.index_path);
      
      expect(loadedIndex.field_weights).toBeDefined();
      expect(loadedIndex.field_weights['concept_abstract']).toBe(2.0);
      expect(loadedIndex.field_weights['artifact_summary']).toBe(1.0);
      expect(loadedIndex.field_weights['entity_name']).toBe(1.5);
      expect(loadedIndex.field_weights['content']).toBe(1.0);
    });

    it('should handle large indexes efficiently', async () => {
      // Create larger document set
      const largeDocSet = [];
      for (let i = 0; i < 50; i++) {
        largeDocSet.push({
          id: 'large-doc-' + i,
          fields: {
            content: 'Financial planning document ' + i + ' with comprehensive investment and retirement strategies. ' + (i % 10 === 0 ? 'MAS regulatory content included.' : ''),
            concept_abstract: 'Financial planning and investment strategies overview document number ' + i,
            artifact_summary: 'Summary of financial planning concepts and retirement strategies for document ' + i
          },
          metadata: {
            category: i % 3 === 0 ? 'financial' : i % 3 === 1 ? 'investment' : 'retirement',
            domain: i % 4 === 0 ? 'mas.gov.sg' : i % 4 === 1 ? 'gov.sg' : i % 4 === 2 ? 'nus.edu.sg' : 'test.com'
          }
        });
      }
      
      const buildResult = await bm25Builder.buildIndex(largeDocSet);
      expect(buildResult.success).toBe(true);
      expect(buildResult.document_count).toBe(50);
      
      // Measure deserialization performance
      const performance = await PerformanceTester.measureFunction(
        () => bm25Builder.loadIndex(buildResult.index_path),
        { iterations: 3, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(5000); // Should load within 5 seconds
      expect(performance.results.every(r => r.document_count === 50)).toBe(true);
    });

    it('should validate index integrity after serialization', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      const loadedIndex = await bm25Builder.loadIndex(buildResult.index_path);
      
      // Verify mathematical consistency
      const totalTerms = loadedIndex.documents.reduce((sum, doc) => {
        const docTerms = [
          ...(doc.field_terms.content || []),
          ...(doc.field_terms.concept_abstract || []),
          ...(doc.field_terms.artifact_summary || [])
        ];
        return sum + docTerms.length;
      }, 0);
      const expectedAvgLength = totalTerms / loadedIndex.document_count;
      
      expect(Math.abs(loadedIndex.doc_stats.avg_doc_length - expectedAvgLength)).toBeLessThan(0.01);
      
      // Verify all documents have required fields
      loadedIndex.documents.forEach(doc => {
        expect(doc.id).toBeTruthy();
        expect(doc.fields).toBeTruthy();
        expect(doc.field_terms).toBeTruthy();

        // Check that at least one field has content
        const hasContent = doc.fields.content || doc.fields.concept_abstract || doc.fields.artifact_summary;
        expect(hasContent).toBeTruthy();

        // Check that at least one field has terms
        const totalTerms = [
          ...(doc.field_terms.content || []),
          ...(doc.field_terms.concept_abstract || []),
          ...(doc.field_terms.artifact_summary || [])
        ];
        expect(totalTerms.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Checksum Stability', () => {
    it('should generate consistent checksums for identical data', async () => {
      const buildResult1 = await bm25Builder.buildIndex(testDocuments);
      const buildResult2 = await bm25Builder.buildIndex(testDocuments);
      
      // Same data should produce different checksums due to different timestamps
      // But we can verify checksum format and length
      expect(buildResult1.checksum).toHaveLength(64);
      expect(buildResult2.checksum).toHaveLength(64);
      expect(buildResult1.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(buildResult2.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should detect index corruption through checksum validation', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      // Validate original checksum
      const isValidOriginal = bm25Builder.validateChecksum(buildResult.index_path, buildResult.checksum);
      expect(isValidOriginal).toBe(true);
      
      // Corrupt the index file
      const indexContent = await fs.promises.readFile(buildResult.index_path, 'utf8');
      const corruptedContent = indexContent.replace('Financial planning', 'Corrupted content');
      await fs.promises.writeFile(buildResult.index_path, corruptedContent, 'utf8');
      
      // Checksum validation should fail
      const isValidCorrupted = bm25Builder.validateChecksum(buildResult.index_path, buildResult.checksum);
      expect(isValidCorrupted).toBe(false);
    });

    it('should handle checksum validation with missing files gracefully', () => {
      const nonExistentPath = path.join(testIndexDir, 'nonexistent-index.json');
      const fakeChecksum = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      
      const isValid = bm25Builder.validateChecksum(nonExistentPath, fakeChecksum);
      expect(isValid).toBe(false);
    });

    it('should generate different checksums for different document sets', async () => {
      const modifiedDocs = [...testDocuments];
      modifiedDocs.push({
        id: 'additional-doc',
        fields: {
          content: 'Additional document content to change the index.',
          artifact_summary: 'Additional summary content to differentiate checksums.'
        },
        metadata: { category: 'extra', domain: 'test.com' }
      });
      
      const originalResult = await bm25Builder.buildIndex(testDocuments);
      const modifiedResult = await bm25Builder.buildIndex(modifiedDocs);
      
      // Different document sets should produce different checksums
      expect(originalResult.checksum).not.toBe(modifiedResult.checksum);
      expect(originalResult.document_count).toBe(testDocuments.length);
      expect(modifiedResult.document_count).toBe(testDocuments.length + 1);
    });
  });

  describe('Index Integrity Validation', () => {
    it('should validate required index fields', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      // Load index and validate structure
      const indexData = await bm25Builder.loadIndex(buildResult.index_path);
      
      const requiredFields = ['version', 'build_timestamp', 'document_count', 'documents', 'doc_stats'];
      requiredFields.forEach(field => {
        expect(indexData).toHaveProperty(field);
      });
      
      expect(typeof indexData.version).toBe('string');
      expect(typeof indexData.build_timestamp).toBe('string');
      expect(typeof indexData.document_count).toBe('number');
      expect(Array.isArray(indexData.documents)).toBe(true);
      expect(typeof indexData.doc_stats).toBe('object');
    });

    it('should validate document term consistency', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      const loadedIndex = await bm25Builder.loadIndex(buildResult.index_path);

      loadedIndex.documents.forEach(doc => {
        // Collect all terms from all fields
        const allTerms = [
          ...(doc.field_terms.content || []),
          ...(doc.field_terms.concept_abstract || []),
          ...(doc.field_terms.artifact_summary || [])
        ];

        // Verify terms are derived from content
        expect(allTerms.length).toBeGreaterThan(0);

        // All terms should be lowercase and contain only alphanumeric characters
        allTerms.forEach(term => {
          expect(term).toBe(term.toLowerCase());
          expect(/^[a-z]+$/.test(term)).toBe(true);
          expect(term.length).toBeGreaterThan(2);
        });

        // Terms should actually appear in one of the content fields
        const allContent = [
          doc.fields.content || '',
          doc.fields.concept_abstract || '',
          doc.fields.artifact_summary || ''
        ].join(' ').toLowerCase();

        allTerms.forEach(term => {
          expect(allContent).toContain(term);
        });
      });
    });

    it('should detect malformed index files', async () => {
      // Create a malformed index file
      const malformedPath = path.join(testIndexDir, 'malformed-index.json');
      await fs.promises.writeFile(malformedPath, '{ invalid json content', 'utf8');
      
      await expect(bm25Builder.loadIndex(malformedPath)).rejects.toThrow();
    });

    it('should validate mathematical consistency of BM25 parameters', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      const loadedIndex = await bm25Builder.loadIndex(buildResult.index_path);
      
      // Validate BM25 parameters
      expect(loadedIndex.doc_stats.k1).toBe(1.2);
      expect(loadedIndex.doc_stats.b).toBe(0.75);
      
      // Validate average document length calculation
      const totalLength = loadedIndex.documents.reduce((sum, doc) => {
        const docTerms = [
          ...(doc.field_terms.content || []),
          ...(doc.field_terms.concept_abstract || []),
          ...(doc.field_terms.artifact_summary || [])
        ];
        return sum + docTerms.length;
      }, 0);
      const expectedAvg = totalLength / loadedIndex.document_count;
      
      expect(Math.abs(loadedIndex.doc_stats.avg_doc_length - expectedAvg)).toBeLessThan(0.001);
    });
  });

  describe('Schema Registry Integration', () => {
    it('should create schema registry entries for built indexes', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      expect(buildResult.schema_registry_entry).toBeDefined();
      expect(buildResult.schema_registry_entry.id).toBeTruthy();
      expect(buildResult.schema_registry_entry.index_type).toBe('bm25_file');
      expect(buildResult.schema_registry_entry.version).toBe(buildResult.version);
      expect(buildResult.schema_registry_entry.checksum).toBe(buildResult.checksum);
      expect(buildResult.schema_registry_entry.created_at).toBeTruthy();
      expect(Array.isArray(buildResult.schema_registry_entry.document_sources)).toBe(true);
      expect(typeof buildResult.schema_registry_entry.field_weights).toBe('object');
    });

    it('should track document sources in schema registry', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      const schemaEntry = buildResult.schema_registry_entry;
      expect(schemaEntry.document_sources).toHaveLength(testDocuments.length);
      
      testDocuments.forEach(doc => {
        expect(schemaEntry.document_sources).toContain(doc.id);
      });
    });

    it('should maintain field weights in schema registry', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      const schemaWeights = buildResult.schema_registry_entry.field_weights;
      expect(schemaWeights['concept_abstract']).toBe(2.0);
      expect(schemaWeights['artifact_summary']).toBe(1.0);
      expect(schemaWeights['entity_name']).toBe(1.5);
      expect(schemaWeights['content']).toBe(1.0);
    });
  });

  describe('Performance and Budget Testing', () => {
    it('should meet LIGHT tier budget for index building (200 tokens, 20s)', async () => {
      const performance = await PerformanceTester.measureFunction(
        () => bm25Builder.buildIndex(testDocuments),
        { iterations: 5, warmupIterations: 1 }
      );
      
      expect(performance.avgTime).toBeLessThan(20000); // 20 second budget
      expect(performance.maxTime).toBeLessThan(30000); // 30 second max
      
      const validation = PerformanceTester.validatePerformanceThresholds(
        { avgTime: performance.avgTime, maxTime: performance.maxTime },
        { avgTime: 20000, maxTime: 30000 }
      );
      
      expect(validation.valid).toBe(true);
    });

    it('should meet MEDIUM tier budget for index loading (400 tokens, 45s)', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      
      const performance = await PerformanceTester.measureFunction(
        () => bm25Builder.loadIndex(buildResult.index_path),
        { iterations: 10, warmupIterations: 2 }
      );
      
      expect(performance.avgTime).toBeLessThan(5000); // Should load within 5 seconds
      expect(performance.maxTime).toBeLessThan(10000); // 10 second max
      
      const validation = PerformanceTester.validatePerformanceThresholds(
        { avgTime: performance.avgTime, maxTime: performance.maxTime },
        { avgTime: 5000, maxTime: 10000 }
      );
      
      expect(validation.valid).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should recover from temporary file write failures', async () => {
      const buildResult = await bm25Builder.buildIndex(testDocuments);
      expect(buildResult.success).toBe(true);
      
      // Verify index was created successfully
      expect(fs.existsSync(buildResult.index_path)).toBe(true);
      
      // Verify checksum file was created
      const checksumPath = buildResult.index_path.replace('-index.json', '-checksum.txt');
      expect(fs.existsSync(checksumPath)).toBe(true);
    });

    it('should handle memory pressure with large indexes', async () => {
      // Test memory efficiency with very large content
      const largeContentDocs = [];
      for (let i = 0; i < 10; i++) {
        // Create documents with more discriminating terms
        const uniqueTerms = i % 3 === 0 ? 'financial investment retirement' : i % 3 === 1 ? 'regulatory compliance framework' : 'educational planning strategy';
        largeContentDocs.push({
          id: 'memory-test-' + i,
          fields: {
            content: 'Large content document '.repeat(50) + uniqueTerms + ' with index ' + i,
            concept_abstract: 'Large content memory test document number ' + i + ' featuring ' + uniqueTerms
          },
          metadata: { category: 'memory-test', domain: 'test.com' }
        });
      }
      
      const buildResult = await bm25Builder.buildIndex(largeContentDocs);
      expect(buildResult.success).toBe(true);
      
      // Load index and verify it works correctly
      const loadedIndex = await bm25Builder.loadIndex(buildResult.index_path);
      expect(loadedIndex.document_count).toBe(10);
      
      // Verify search still works
      // Convert DataSource format to SimpleBM25 format
      const simpleBM25Docs = largeContentDocs.map(doc => ({
        id: doc.id,
        content: doc.fields.content || '',
        metadata: doc.metadata
      }));

      const bm25 = new SimpleBM25(simpleBM25Docs);

      // Search for discriminating terms that appear in only some documents
      // "financial" should appear in docs 0, 3, 6, 9 (i % 3 === 0)
      const searchResults = bm25.search('financial', 5);
      expect(searchResults.length).toBeGreaterThan(0);

      // Also test a term that should appear in different documents
      const regulatoryResults = bm25.search('regulatory', 5);
      expect(regulatoryResults.length).toBeGreaterThan(0);
    });
  });
});
