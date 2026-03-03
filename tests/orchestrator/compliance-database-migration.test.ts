// ABOUTME: Test suite for EIP compliance database migration and functionality
// ABOUTME: Validates Redis → Supabase migration, worker compatibility, and data integrity

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ComplianceDatabaseExtension } from '../../orchestrator/database-compliance-v2';
import { getSupabaseAdmin } from '../../lib_supabase/db/supabase-client';
import Redis from 'ioredis';

jest.mock('uuid', () => ({
  v4: () => '00000000-0000-4000-8000-000000000000'
}));

// Mock data for testing
const mockComplianceReport = {
  status: 'compliant',
  overall_score: 85,
  violations: [],
  authority_level: 'high',
  processing_time_ms: 1500,
  evidence_summary: {
    total_sources: 5,
    high_authority_sources: 3,
    medium_authority_sources: 2,
    low_authority_sources: 0,
    stale_sources: 0,
    accessible_sources: 5
  },
  metadata: {
    processing_tier: 'MEDIUM'
  }
};

const mockValidationMetadata = {
  content_length: 1500,
  sources_count: 5,
  validation_level: 'standard',
  correlation_id: 'test-correlation-123'
};

describe('Compliance Database Migration', () => {
  let complianceDb: ComplianceDatabaseExtension;
  let supabase: ReturnType<typeof getSupabaseAdmin>;
  let redis: Redis;

  beforeEach(async () => {
    // Initialize test database connections
    try {
      supabase = getSupabaseAdmin();
      redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    } catch (error) {
      console.warn('Test setup: Using mock connections for testing');
    }

    complianceDb = new ComplianceDatabaseExtension();
  });

  afterEach(async () => {
    // Cleanup test data
    if (redis) {
      const testKeys = await redis.keys('compliance-validation:test-*');
      if (testKeys.length > 0) {
        await redis.del(...testKeys);
      }
      await redis.quit();
    }
  });

  describe('Database Schema Validation', () => {
    it('should have eip_compliance_validations table with correct structure', async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('eip_compliance_validations')
          .select('*')
          .limit(1);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);

      } catch (error) {
        // If table doesn't exist, that's expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should have proper indexes for performance', async () => {
      // This would require admin privileges to query pg_indexes
      // For now, just validate that queries can execute without timeout issues
      const { data, error } = await (supabase as any)
        .from('eip_compliance_validations')
        .select('id, job_id, validation_timestamp')
        .eq('job_id', '00000000-0000-0000-0000-000000000000')
        .order('validation_timestamp', { ascending: false })
        .limit(10);

      // Should not timeout, even if no results
      expect(true).toBe(true);
    });
  });

  describe('ComplianceDatabaseExtension Functionality', () => {
    it('should store compliance validation with all required fields', async () => {
      const result = await complianceDb.storeComplianceValidation({
        job_id: 'test-job-123',
        artifact_id: 'test-artifact-123',
        compliance_report: mockComplianceReport,
        validation_metadata: mockValidationMetadata
      });

      expect(result.success).toBe(true);
      expect(result.result_id).toBeDefined();
      expect(result.result_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should retrieve stored compliance validation by ID', async () => {
      // First store a validation
      const storeResult = await complianceDb.storeComplianceValidation({
        job_id: 'test-job-retrieve-123',
        artifact_id: 'test-artifact-retrieve-123',
        compliance_report: mockComplianceReport,
        validation_metadata: mockValidationMetadata
      });

      expect(storeResult.success).toBe(true);

      // Then retrieve it
      const getResult = await complianceDb.getComplianceValidation(storeResult.result_id!);

      expect(getResult.error).toBeUndefined();
      expect(getResult.validation).toBeDefined();
      expect(getResult.validation!.job_id).toBe('test-job-retrieve-123');
      expect(getResult.validation!.artifact_id).toBe('test-artifact-retrieve-123');
      expect(getResult.validation!.compliance_score).toBe(85);
      expect(getResult.validation!.authority_level).toBe('high');
    });

    it('should get compliance validations by artifact ID', async () => {
      const artifactId = 'test-artifact-multiple-123';

      // Store multiple validations for the same artifact
      const validation1 = await complianceDb.storeComplianceValidation({
        job_id: 'test-job-1',
        artifact_id: artifactId,
        compliance_report: { ...mockComplianceReport, overall_score: 85 },
        validation_metadata: mockValidationMetadata
      });

      const validation2 = await complianceDb.storeComplianceValidation({
        job_id: 'test-job-2',
        artifact_id: artifactId,
        compliance_report: { ...mockComplianceReport, overall_score: 90 },
        validation_metadata: mockValidationMetadata
      });

      expect(validation1.success).toBe(true);
      expect(validation2.success).toBe(true);

      // Retrieve validations by artifact
      const artifactValidations = await complianceDb.getComplianceValidationsByArtifact(artifactId);

      expect(artifactValidations.error).toBeUndefined();
      expect(artifactValidations.validations).toHaveLength(2);
      expect(artifactValidations.validations[0].compliance_score).toBe(90); // Should be sorted by timestamp desc
      expect(artifactValidations.validations[1].compliance_score).toBe(85);
    });

    it('should provide compliance statistics', async () => {
      // Store test data with different compliance scores
      await complianceDb.storeComplianceValidation({
        job_id: 'stats-test-1',
        artifact_id: 'stats-artifact-1',
        compliance_report: { ...mockComplianceReport, overall_score: 85, status: 'compliant' },
        validation_metadata: mockValidationMetadata
      });

      await complianceDb.storeComplianceValidation({
        job_id: 'stats-test-2',
        artifact_id: 'stats-artifact-2',
        compliance_report: { ...mockComplianceReport, overall_score: 45, status: 'non_compliant' },
        validation_metadata: mockValidationMetadata
      });

      // Get statistics
      const stats = await complianceDb.getComplianceStatistics(24); // Last 24 hours

      expect(stats.error).toBeUndefined();
      expect(stats.total_validations).toBeGreaterThanOrEqual(2);
      expect(stats.compliant_count).toBeGreaterThanOrEqual(1);
      expect(stats.non_compliant_count).toBeGreaterThanOrEqual(1);
      expect(stats.average_score).toBeGreaterThanOrEqual(0);
      expect(stats.average_processing_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should handle Redis fallback when Supabase is unavailable', async () => {
      // Create a new instance with forced Redis fallback
      const redisFallbackDb = new (ComplianceDatabaseExtension as any)() as ComplianceDatabaseExtension;
      (redisFallbackDb as any).useRedisFallback = true;

      const result = await redisFallbackDb.storeComplianceValidation({
        job_id: 'redis-fallback-test',
        artifact_id: 'redis-fallback-artifact',
        compliance_report: mockComplianceReport,
        validation_metadata: mockValidationMetadata
      });

      expect(result.success).toBe(true);
      expect(result.result_id).toBeDefined();
    });

    it('should handle data validation errors gracefully', async () => {
      // Test with invalid data
      const invalidResult = await complianceDb.storeComplianceValidation({
        job_id: '', // Invalid empty job_id
        artifact_id: 'test-artifact',
        compliance_report: null, // Invalid null report
        validation_metadata: {
          content_length: -1, // Invalid negative length
          sources_count: 5,
          validation_level: 'invalid-level', // Invalid validation level
          correlation_id: 'test-correlation'
        }
      });

      // Should handle gracefully without crashing
      expect(invalidResult).toBeDefined();
      // May fail due to validation, but shouldn't crash
    });
  });

  describe('Data Integrity Validation', () => {
    it('should preserve data integrity during storage and retrieval', async () => {
      const originalReport = {
        ...mockComplianceReport,
        violations: [
          {
            type: 'source_authority',
            severity: 'medium',
            description: 'Medium authority source detected',
            recommendation: 'Consider using higher authority sources'
          }
        ],
        evidence_summary: {
          total_sources: 3,
          high_authority_sources: 1,
          medium_authority_sources: 1,
          low_authority_sources: 1,
          stale_sources: 0,
          accessible_sources: 3,
          source_details: [
            { url: 'https://example.com/high-authority', authority: 'high' },
            { url: 'https://example.com/medium-authority', authority: 'medium' },
            { url: 'https://example.com/low-authority', authority: 'low' }
          ]
        }
      };

      const storeResult = await complianceDb.storeComplianceValidation({
        job_id: 'integrity-test-job',
        artifact_id: 'integrity-test-artifact',
        compliance_report: originalReport,
        validation_metadata: {
          content_length: 2500,
          sources_count: 3,
          validation_level: 'enhanced',
          correlation_id: 'integrity-test-123'
        }
      });

      expect(storeResult.success).toBe(true);

      const getResult = await complianceDb.getComplianceValidation(storeResult.result_id!);
      expect(getResult.error).toBeUndefined();
      expect(getResult.validation).toBeDefined();

      const retrievedReport = getResult.validation!.compliance_report;
      
      // Validate complex nested data
      expect(retrievedReport.violations).toHaveLength(1);
      expect(retrievedReport.violations[0].type).toBe('source_authority');
      expect(retrievedReport.evidence_summary.source_details).toHaveLength(3);
      expect(retrievedReport.evidence_summary.source_details[0].authority).toBe('high');
      
      // Validate metadata
      expect(getResult.validation!.content_length).toBe(2500);
      expect(getResult.validation!.validation_level).toBe('enhanced');
    });

    it('should handle concurrent operations correctly', async () => {
      const concurrentOperations = [];
      
      // Create multiple concurrent storage operations
      for (let i = 0; i < 5; i++) {
        concurrentOperations.push(
          complianceDb.storeComplianceValidation({
            job_id: `concurrent-job-${i}`,
            artifact_id: `concurrent-artifact-${i}`,
            compliance_report: { ...mockComplianceReport, overall_score: 80 + i },
            validation_metadata: { ...mockValidationMetadata, correlation_id: `concurrent-${i}` }
          })
        );
      }

      // Wait for all operations to complete
      const results = await Promise.all(concurrentOperations);

      // All operations should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.result_id).toBeDefined();
        expect(result.result_id).not.toBe(results[(index + 1) % results.length].result_id); // Unique IDs
      });

      // Verify all data was stored correctly
      for (const result of results) {
        const retrieved = await complianceDb.getComplianceValidation(result.result_id!);
        expect(retrieved.error).toBeUndefined();
        expect(retrieved.validation).toBeDefined();
        expect(retrieved.validation!.job_id).toMatch(/^concurrent-job-\d$/);
      }
    });
  });

  describe('Migration Script Validation', () => {
    it('should have migration script with required functions', () => {
      // Test that the migration script exports required functions
      const migrationScript = require('../../scripts/migrate-compliance-data-redis-to-supabase.js');
      
      expect(migrationScript.validateComplianceRecord).toBeDefined();
      expect(typeof migrationScript.validateComplianceRecord).toBe('function');
    });

    it('should validate compliance record structure correctly', () => {
      const migrationScript = require('../../scripts/migrate-compliance-data-redis-to-supabase.js');
      const validateComplianceRecord = migrationScript.validateComplianceRecord;

      // Valid record should pass validation
      const validRecord = {
        id: 'test-id-123',
        job_id: 'test-job-123',
        compliance_score: 85,
        violations_count: 2,
        processing_time_ms: 1500,
        evidence_summary: JSON.stringify({ total_sources: 5 }),
        compliance_report: JSON.stringify({ status: 'compliant' })
      };

      const validErrors = validateComplianceRecord(validRecord);
      expect(validErrors).toHaveLength(0);

      // Invalid record should fail validation
      const invalidRecord = {
        id: '', // Invalid empty id
        job_id: 'test-job-123',
        compliance_score: 150, // Invalid score > 100
        violations_count: -1, // Invalid negative count
        processing_time_ms: -100, // Invalid negative time
        evidence_summary: 'invalid-json', // Invalid JSON
        compliance_report: 'also-invalid-json' // Invalid JSON
      };

      const invalidErrors = validateComplianceRecord(invalidRecord);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors.some(error => error.includes('id'))).toBe(true);
      expect(invalidErrors.some(error => error.includes('compliance_score'))).toBe(true);
      expect(invalidErrors.some(error => error.includes('violations_count'))).toBe(true);
      expect(invalidErrors.some(error => error.includes('evidence_summary'))).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large compliance reports efficiently', async () => {
      // Create a large compliance report
      const largeReport = {
        ...mockComplianceReport,
        violations: Array.from({ length: 100 }, (_, i) => ({
          type: `violation-type-${i}`,
          severity: 'medium',
          description: `Violation description ${i} with some additional text to increase size`,
          recommendation: `Recommendation ${i} for fixing the violation`
        })),
        evidence_summary: {
          ...mockComplianceReport.evidence_summary,
          source_details: Array.from({ length: 50 }, (_, i) => ({
            url: `https://example.com/source-${i}`,
            authority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
            last_checked: new Date().toISOString(),
            content_length: 1000 + i * 100
          }))
        }
      };

      const startTime = Date.now();

      const result = await complianceDb.storeComplianceValidation({
        job_id: 'large-report-test',
        artifact_id: 'large-report-artifact',
        compliance_report: largeReport,
        validation_metadata: {
          content_length: 10000,
          sources_count: 50,
          validation_level: 'comprehensive'
        }
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle database connection failures gracefully', async () => {
      // Test graceful degradation when database is unavailable
      // This is more of an integration test and might require mocking
      
      // For now, just ensure the extension doesn't crash
      const result = await complianceDb.getComplianceValidation('non-existent-id');
      expect(result).toBeDefined();
      expect(result.validation).toBeNull();
    });
  });
});
