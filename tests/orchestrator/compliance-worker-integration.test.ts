// ABOUTME: Integration test for EIP compliance worker with updated database extension
// ABOUTME: Validates queue worker compatibility with new Supabase-based compliance storage

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the compliance engine for testing
jest.mock('../../lib/compliance/compliance-engine', () => ({
  ComplianceEngine: jest.fn().mockImplementation(() => ({
    validateContent: jest.fn().mockResolvedValue({
      status: 'compliant',
      overall_score: 85,
      violations: [],
      authority_level: 'high',
      processing_time_ms: 1200,
      evidence_summary: {
        total_sources: 3,
        high_authority_sources: 2,
        medium_authority_sources: 1,
        low_authority_sources: 0,
        stale_sources: 0,
        accessible_sources: 3
      },
      metadata: {
        processing_tier: 'MEDIUM'
      }
    })
  }))
}));

// Mock BullMQ for testing
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined)
  })),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' })
  }))
}));

describe('Compliance Worker Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should maintain compatibility with existing worker interface', async () => {
    // Import the worker after mocking dependencies
    const { ComplianceDatabaseExtension } = require('../../orchestrator/database-compliance');
    
    // Create instance of the updated database extension
    const complianceDb = new ComplianceDatabaseExtension();
    
    // Verify the interface is maintained
    expect(typeof complianceDb.storeComplianceValidation).toBe('function');
    
    // Test that the method accepts the same parameters as before
    const mockData = {
      job_id: 'test-job-123',
      artifact_id: 'test-artifact-123',
      compliance_report: {
        status: 'compliant',
        overall_score: 85,
        violations: [],
        authority_level: 'high',
        processing_time_ms: 1200,
        evidence_summary: {
          total_sources: 3,
          high_authority_sources: 2,
          medium_authority_sources: 1,
          low_authority_sources: 0,
          stale_sources: 0,
          accessible_sources: 3
        },
        metadata: {
          processing_tier: 'MEDIUM'
        }
      },
      validation_metadata: {
        content_length: 1500,
        sources_count: 3,
        validation_level: 'standard',
        correlation_id: 'test-correlation-123'
      }
    };
    
    // Should not throw and should return expected format
    const result = await complianceDb.storeComplianceValidation(mockData);
    
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    
    if (result.success) {
      expect(result.result_id).toBeDefined();
      expect(typeof result.result_id).toBe('string');
    }
  });

  it('should handle worker job processing with new database backend', async () => {
    // This test validates that the worker can process a job using the new database
    const { ComplianceDatabaseExtension } = require('../../orchestrator/database-compliance');
    const complianceDb = new ComplianceDatabaseExtension();
    
    // Simulate worker processing a compliance validation job
    const jobData = {
      job_id: 'worker-test-job-123',
      artifact_id: 'worker-test-artifact-123',
      content: 'Test educational content about financial compliance.',
      sources: [
        'https://mas.gov.sg',
        'https://iras.gov.sg',
        'https://example.com'
      ],
      validation_level: 'standard',
      correlation_id: 'worker-test-123'
    };
    
    // Mock compliance engine result
    const mockComplianceReport = {
      status: 'compliant',
      overall_score: 88,
      violations: [],
      authority_level: 'high',
      processing_time_ms: 1800,
      evidence_summary: {
        total_sources: 3,
        high_authority_sources: 2,
        medium_authority_sources: 1,
        low_authority_sources: 0,
        stale_sources: 0,
        accessible_sources: 3
      },
      metadata: {
        processing_tier: 'MEDIUM'
      }
    };
    
    // Store the compliance validation result
    const storeResult = await complianceDb.storeComplianceValidation({
      job_id: jobData.job_id,
      artifact_id: jobData.artifact_id,
      compliance_report: mockComplianceReport,
      validation_metadata: {
        content_length: jobData.content.length,
        sources_count: jobData.sources.length,
        validation_level: jobData.validation_level,
        correlation_id: jobData.correlation_id
      }
    });
    
    // Verify storage was successful
    expect(storeResult.success).toBe(true);
    expect(storeResult.result_id).toBeDefined();
    
    // Verify we can retrieve the stored data
    const getResult = await complianceDb.getComplianceValidation(storeResult.result_id);
    expect(getResult.error).toBeUndefined();
    expect(getResult.validation).toBeDefined();
    expect(getResult.validation!.job_id).toBe(jobData.job_id);
    expect(getResult.validation!.artifact_id).toBe(jobData.artifact_id);
    expect(getResult.validation!.compliance_score).toBe(88);
  });

  it('should maintain data consistency for artifact compliance history', async () => {
    const { ComplianceDatabaseExtension } = require('../../orchestrator/database-compliance');
    const complianceDb = new ComplianceDatabaseExtension();
    
    const artifactId = 'consistency-test-artifact-123';
    
    // Store multiple compliance validations for the same artifact
    const validation1 = await complianceDb.storeComplianceValidation({
      job_id: 'consistency-job-1',
      artifact_id: artifactId,
      compliance_report: { status: 'compliant', overall_score: 85, violations: [], authority_level: 'high', processing_time_ms: 1500, evidence_summary: { total_sources: 5, high_authority_sources: 3, medium_authority_sources: 2, low_authority_sources: 0, stale_sources: 0, accessible_sources: 5 }, metadata: { processing_tier: 'MEDIUM' } },
      validation_metadata: { content_length: 1000, sources_count: 5, validation_level: 'standard' }
    });
    
    const validation2 = await complianceDb.storeComplianceValidation({
      job_id: 'consistency-job-2',
      artifact_id: artifactId,
      compliance_report: { status: 'compliant', overall_score: 90, violations: [], authority_level: 'high', processing_time_ms: 1200, evidence_summary: { total_sources: 6, high_authority_sources: 4, medium_authority_sources: 2, low_authority_sources: 0, stale_sources: 0, accessible_sources: 6 }, metadata: { processing_tier: 'MEDIUM' } },
      validation_metadata: { content_length: 1200, sources_count: 6, validation_level: 'enhanced' }
    });
    
    expect(validation1.success).toBe(true);
    expect(validation2.success).toBe(true);
    
    // Retrieve compliance history for the artifact
    const history = await complianceDb.getComplianceValidationsByArtifact(artifactId);
    
    expect(history.error).toBeUndefined();
    expect(history.validations).toHaveLength(2);
    
    // Verify sorting by timestamp (most recent first)
    expect(history.validations[0].compliance_score).toBe(90);
    expect(history.validations[1].compliance_score).toBe(85);
    
    // Verify artifact ID consistency
    expect(history.validations[0].artifact_id).toBe(artifactId);
    expect(history.validations[1].artifact_id).toBe(artifactId);
  });

  it('should handle worker failure scenarios gracefully', async () => {
    const { ComplianceDatabaseExtension } = require('../../orchestrator/database-compliance');
    const complianceDb = new ComplianceDatabaseExtension();
    
    // Test handling of invalid data that might come from worker failures
    const invalidData = {
      job_id: '', // Invalid empty job_id
      artifact_id: 'failure-test-artifact',
      compliance_report: {
        status: 'error',
        overall_score: 0,
        violations: [{ type: 'system_error', severity: 'critical', description: 'Worker processing failed' }],
        authority_level: 'low',
        processing_time_ms: 0,
        evidence_summary: { total_sources: 0, high_authority_sources: 0, medium_authority_sources: 0, low_authority_sources: 0, stale_sources: 0, accessible_sources: 0 },
        metadata: { processing_tier: 'LIGHT' }
      },
      validation_metadata: {
        content_length: 0,
        sources_count: 0,
        validation_level: 'standard'
      }
    };
    
    // Should handle gracefully without crashing
    const result = await complianceDb.storeComplianceValidation(invalidData);
    
    // Result should be defined, but may indicate failure
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('should support compliance statistics for worker monitoring', async () => {
    const { ComplianceDatabaseExtension } = require('../../orchestrator/database-compliance');
    const complianceDb = new ComplianceDatabaseExtension();
    
    // Add test data for statistics
    await complianceDb.storeComplianceValidation({
      job_id: 'stats-job-1',
      artifact_id: 'stats-artifact-1',
      compliance_report: { status: 'compliant', overall_score: 85, violations: [], authority_level: 'high', processing_time_ms: 1500, evidence_summary: { total_sources: 5, high_authority_sources: 3, medium_authority_sources: 2, low_authority_sources: 0, stale_sources: 0, accessible_sources: 5 }, metadata: { processing_tier: 'MEDIUM' } },
      validation_metadata: { content_length: 1000, sources_count: 5, validation_level: 'standard' }
    });
    
    await complianceDb.storeComplianceValidation({
      job_id: 'stats-job-2',
      artifact_id: 'stats-artifact-2',
      compliance_report: { status: 'non_compliant', overall_score: 45, violations: [{ type: 'source_authority', severity: 'medium', description: 'Low authority sources' }], authority_level: 'medium', processing_time_ms: 2000, evidence_summary: { total_sources: 3, high_authority_sources: 0, medium_authority_sources: 1, low_authority_sources: 2, stale_sources: 1, accessible_sources: 2 }, metadata: { processing_tier: 'MEDIUM' } },
      validation_metadata: { content_length: 800, sources_count: 3, validation_level: 'standard' }
    });
    
    // Get statistics for monitoring
    const stats = await complianceDb.getComplianceStatistics(24);
    
    expect(stats.error).toBeUndefined();
    expect(stats.total_validations).toBeGreaterThanOrEqual(2);
    expect(stats.compliant_count).toBeGreaterThanOrEqual(1);
    expect(stats.non_compliant_count).toBeGreaterThanOrEqual(1);
    expect(stats.average_score).toBeGreaterThanOrEqual(0);
    expect(stats.average_processing_time_ms).toBeGreaterThanOrEqual(0);
  });

  it('should handle concurrent worker operations', async () => {
    const { ComplianceDatabaseExtension } = require('../../orchestrator/database-compliance');
    const complianceDb = new ComplianceDatabaseExtension();
    
    // Simulate multiple workers processing jobs concurrently
    const concurrentOperations = [];
    
    for (let i = 0; i < 5; i++) {
      concurrentOperations.push(
        complianceDb.storeComplianceValidation({
          job_id: `concurrent-worker-job-${i}`,
          artifact_id: `concurrent-worker-artifact-${i}`,
          compliance_report: { status: 'compliant', overall_score: 80 + i, violations: [], authority_level: 'high', processing_time_ms: 1000 + i * 100, evidence_summary: { total_sources: 3, high_authority_sources: 2, medium_authority_sources: 1, low_authority_sources: 0, stale_sources: 0, accessible_sources: 3 }, metadata: { processing_tier: 'MEDIUM' } },
          validation_metadata: { content_length: 1000 + i * 100, sources_count: 3, validation_level: 'standard', correlation_id: `concurrent-worker-${i}` }
        })
      );
    }
    
    // Wait for all concurrent operations to complete
    const results = await Promise.all(concurrentOperations);
    
    // All operations should succeed
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.result_id).toBeDefined();
      expect(result.result_id).not.toBe(results[(index + 1) % results.length].result_id);
    });
    
    // Verify data integrity
    for (const result of results) {
      const retrieved = await complianceDb.getComplianceValidation(result.result_id!);
      expect(retrieved.error).toBeUndefined();
      expect(retrieved.validation).toBeDefined();
      expect(retrieved.validation!.job_id).toMatch(/^concurrent-worker-job-\d$/);
    }
  });
});
