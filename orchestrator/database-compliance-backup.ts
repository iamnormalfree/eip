// ABOUTME: Extension for OrchestratorDB - Compliance validation results storage
// ABOUTME: Adds compliance validation storage methods to existing database functionality

import { v4 as uuidv4 } from 'uuid';

/**
 * Extend OrchestratorDB with compliance validation methods
 */
export class ComplianceDatabaseExtension {
  /**
   * Store compliance validation results
   */
  async storeComplianceValidation(data: {
    job_id: string;
    artifact_id?: string;
    compliance_report: any;
    validation_metadata: {
      content_length: number;
      sources_count: number;
      validation_level: string;
      correlation_id?: string;
    };
  }): Promise<{ success: boolean; result_id?: string; error?: string }> {
    try {
      const resultId = uuidv4();
      const now = new Date().toISOString();

      // For now, store results in Redis as a simple key-value store
      // In production, this would be stored in a dedicated eip_compliance_validations table
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

      const complianceResult = {
        id: resultId,
        job_id: data.job_id,
        artifact_id: data.artifact_id,
        compliance_status: data.compliance_report.status,
        compliance_score: data.compliance_report.overall_score,
        violations_count: data.compliance_report.violations.length,
        authority_level: data.compliance_report.authority_level,
        processing_tier: data.compliance_report.metadata.processing_tier,
        processing_time_ms: data.compliance_report.processing_time_ms,
        evidence_summary: data.compliance_report.evidence_summary,
        validation_level: data.validation_metadata.validation_level,
        content_length: data.validation_metadata.content_length,
        sources_count: data.validation_metadata.sources_count,
        correlation_id: data.validation_metadata.correlation_id,
        validation_timestamp: now,
        compliance_report: data.compliance_report
      };

      const key = `compliance-validation:${resultId}`;
      await redis.hset(key, complianceResult);
      await redis.expire(key, 86400 * 30); // 30 days TTL
      
      // Also index by job_id and artifact_id for easy lookup
      if (data.artifact_id) {
        await redis.sadd(`compliance-by-artifact:${data.artifact_id}`, resultId);
      }
      await redis.sadd(`compliance-by-job:${data.job_id}`, resultId);

      await redis.quit();

      console.log('💾 Compliance validation stored: ' + resultId);
      return { success: true, result_id: resultId };

    } catch (error) {
      console.error('Failed to store compliance validation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error storing compliance validation'
      };
    }
  }
}
