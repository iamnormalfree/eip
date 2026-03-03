// ABOUTME: Database migration foundation for EIP compliance operations
// ABOUTME: Creates comprehensive compliance validation storage with Redis → Supabase migration

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';

/**
 * Compliance validation result interface for database storage
 */
export interface ComplianceValidationRecord {
  id: string;
  job_id: string;
  artifact_id?: string;
  compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'error';
  compliance_score: number; // 0-100
  violations_count: number;
  authority_level: 'high' | 'medium' | 'low';
  processing_tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  processing_time_ms: number;
  evidence_summary: {
    total_sources: number;
    high_authority_sources: number;
    medium_authority_sources: number;
    low_authority_sources: number;
    stale_sources: number;
    accessible_sources: number;
  };
  validation_level: 'standard' | 'enhanced' | 'comprehensive';
  content_length: number;
  sources_count: number;
  correlation_id?: string;
  validation_timestamp: string;
  compliance_report: any; // Full detailed report
}

/**
 * Extended OrchestratorDB with compliance validation methods using Supabase
 */
export class ComplianceDatabaseExtension {
  private supabase: ReturnType<typeof getSupabaseAdmin>;
  private useRedisFallback: boolean;

  /**
   * Support both CommonJS and ESM exports from ioredis in test/runtime environments.
   */
  private createRedisClient(): any {
    const redisModule = require('ioredis');
    const RedisConstructor = redisModule?.default ?? redisModule?.Redis ?? redisModule;
    return new RedisConstructor(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  constructor() {
    try {
      this.supabase = getSupabaseAdmin();
      this.useRedisFallback = false;
    } catch (error) {
      console.warn('⚠️ Supabase not available, falling back to Redis for compliance storage:', error instanceof Error ? error.message : 'Unknown error');
      this.useRedisFallback = true;
      this.supabase = null as any;
    }
  }

  /**
   * Store compliance validation results in Supabase with Redis fallback
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

      if (this.useRedisFallback) {
        return await this.storeComplianceValidationRedis(data, resultId, now);
      }

      // Transform compliance report to database record
      const complianceRecord: Omit<ComplianceValidationRecord, 'id'> = {
        job_id: data.job_id,
        artifact_id: data.artifact_id,
        compliance_status: data.compliance_report.status || 'pending',
        compliance_score: data.compliance_report.overall_score || 0,
        violations_count: data.compliance_report.violations?.length || 0,
        authority_level: data.compliance_report.authority_level || 'low',
        processing_tier: data.compliance_report.metadata?.processing_tier || 'LIGHT',
        processing_time_ms: data.compliance_report.processing_time_ms || 0,
        evidence_summary: {
          total_sources: data.compliance_report.evidence_summary?.total_sources || 0,
          high_authority_sources: data.compliance_report.evidence_summary?.high_authority_sources || 0,
          medium_authority_sources: data.compliance_report.evidence_summary?.medium_authority_sources || 0,
          low_authority_sources: data.compliance_report.evidence_summary?.low_authority_sources || 0,
          stale_sources: data.compliance_report.evidence_summary?.stale_sources || 0,
          accessible_sources: data.compliance_report.evidence_summary?.accessible_sources || 0
        },
        validation_level: data.validation_metadata.validation_level as 'standard' | 'enhanced' | 'comprehensive',
        content_length: data.validation_metadata.content_length,
        sources_count: data.validation_metadata.sources_count,
        correlation_id: data.validation_metadata.correlation_id,
        validation_timestamp: now,
        compliance_report: data.compliance_report
      };

      // Use any typing to bypass Supabase type inference issues
      const insertData: any = {
        id: resultId,
        ...complianceRecord,
        artifact_id: complianceRecord.artifact_id || null,
        correlation_id: complianceRecord.correlation_id || null
      };

      const { data: insertedData, error } = await (this.supabase as any)
        .from('eip_compliance_validations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Failed to store compliance validation in Supabase:', error);
        
        // Fallback to Redis if Supabase fails
        console.log('Falling back to Redis storage...');
        return await this.storeComplianceValidationRedis(data, resultId, now);
      }

      console.log('💾 Compliance validation stored in Supabase: ' + resultId);
      return { success: true, result_id: resultId };

    } catch (error) {
      console.error('Failed to store compliance validation:', error);
      
      // Try Redis fallback
      try {
        const resultId = uuidv4();
        const now = new Date().toISOString();
        return await this.storeComplianceValidationRedis(data, resultId, now);
      } catch (fallbackError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error storing compliance validation'
        };
      }
    }
  }

  /**
   * Redis fallback method for compliance validation storage
   */
  private async storeComplianceValidationRedis(data: any, resultId: string, now: string): Promise<{ success: boolean; result_id?: string; error?: string }> {
    try {
      const redis = this.createRedisClient();

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
        compliance_report: data.compliance_report,
        storage_backend: 'redis_fallback'
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

      console.log('💾 Compliance validation stored in Redis fallback: ' + resultId);
      return { success: true, result_id: resultId };

    } catch (redisError) {
      console.error('Redis fallback also failed:', redisError);
      return {
        success: false,
        error: redisError instanceof Error ? redisError.message : 'Redis storage failed'
      };
    }
  }

  /**
   * Get compliance validation by ID
   */
  async getComplianceValidation(validationId: string): Promise<{ validation: ComplianceValidationRecord | null; error?: string }> {
    try {
      if (this.useRedisFallback) {
        return await this.getComplianceValidationRedis(validationId);
      }

      const { data, error } = await (this.supabase as any)
        .from('eip_compliance_validations')
        .select('*')
        .eq('id', validationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found in Supabase, try Redis fallback for migration period
          return await this.getComplianceValidationRedis(validationId);
        }
        console.error('Failed to get compliance validation:', error);
        return { validation: null, error: error.message };
      }

      const validation: ComplianceValidationRecord = {
        id: data.id,
        job_id: data.job_id,
        artifact_id: data.artifact_id,
        compliance_status: data.compliance_status,
        compliance_score: data.compliance_score,
        violations_count: data.violations_count,
        authority_level: data.authority_level,
        processing_tier: data.processing_tier,
        processing_time_ms: data.processing_time_ms,
        evidence_summary: data.evidence_summary,
        validation_level: data.validation_level,
        content_length: data.content_length,
        sources_count: data.sources_count,
        correlation_id: data.correlation_id,
        validation_timestamp: data.validation_timestamp,
        compliance_report: data.compliance_report
      };

      return { validation };

    } catch (error) {
      console.error('Failed to get compliance validation:', error);
      return {
        validation: null,
        error: error instanceof Error ? error.message : 'Unknown error getting compliance validation'
      };
    }
  }

  /**
   * Redis fallback for getting compliance validation
   */
  private async getComplianceValidationRedis(validationId: string): Promise<{ validation: ComplianceValidationRecord | null; error?: string }> {
    try {
      const redis = this.createRedisClient();

      const key = `compliance-validation:${validationId}`;
      const data = await redis.hgetall(key);

      await redis.quit();

      if (!data || Object.keys(data).length === 0) {
        return { validation: null };
      }

      const validation: ComplianceValidationRecord = {
        id: data.id,
        job_id: data.job_id,
        artifact_id: data.artifact_id,
        compliance_status: data.compliance_status,
        compliance_score: parseInt(data.compliance_score),
        violations_count: parseInt(data.violations_count),
        authority_level: data.authority_level,
        processing_tier: data.processing_tier,
        processing_time_ms: parseInt(data.processing_time_ms),
        evidence_summary: JSON.parse(data.evidence_summary),
        validation_level: data.validation_level,
        content_length: parseInt(data.content_length),
        sources_count: parseInt(data.sources_count),
        correlation_id: data.correlation_id,
        validation_timestamp: data.validation_timestamp,
        compliance_report: JSON.parse(data.compliance_report)
      };

      return { validation };

    } catch (error) {
      console.error('Failed to get compliance validation from Redis:', error);
      return {
        validation: null,
        error: error instanceof Error ? error.message : 'Redis retrieval failed'
      };
    }
  }

  /**
   * Get compliance validations by artifact ID
   */
  async getComplianceValidationsByArtifact(artifactId: string): Promise<{ validations: ComplianceValidationRecord[]; error?: string }> {
    try {
      if (this.useRedisFallback) {
        return await this.getComplianceValidationsByArtifactRedis(artifactId);
      }

      const { data, error } = await (this.supabase as any)
        .from('eip_compliance_validations')
        .select('*')
        .eq('artifact_id', artifactId)
        .order('validation_timestamp', { ascending: false });

      if (error) {
        console.error('Failed to get compliance validations by artifact:', error);
        return { validations: [], error: error.message };
      }

      const validations: ComplianceValidationRecord[] = data.map((record: any) => ({
        id: record.id,
        job_id: record.job_id,
        artifact_id: record.artifact_id,
        compliance_status: record.compliance_status,
        compliance_score: record.compliance_score,
        violations_count: record.violations_count,
        authority_level: record.authority_level,
        processing_tier: record.processing_tier,
        processing_time_ms: record.processing_time_ms,
        evidence_summary: record.evidence_summary,
        validation_level: record.validation_level,
        content_length: record.content_length,
        sources_count: record.sources_count,
        correlation_id: record.correlation_id,
        validation_timestamp: record.validation_timestamp,
        compliance_report: record.compliance_report
      }));

      return { validations };

    } catch (error) {
      console.error('Failed to get compliance validations by artifact:', error);
      return {
        validations: [],
        error: error instanceof Error ? error.message : 'Unknown error getting compliance validations'
      };
    }
  }

  /**
   * Redis fallback for getting compliance validations by artifact
   */
  private async getComplianceValidationsByArtifactRedis(artifactId: string): Promise<{ validations: ComplianceValidationRecord[]; error?: string }> {
    try {
      const redis = this.createRedisClient();

      const validationIds = await redis.smembers(`compliance-by-artifact:${artifactId}`);
      
      if (validationIds.length === 0) {
        await redis.quit();
        return { validations: [] };
      }

      const validations: ComplianceValidationRecord[] = [];
      
      for (const validationId of validationIds) {
        const key = `compliance-validation:${validationId}`;
        const data = await redis.hgetall(key);
        
        if (data && Object.keys(data).length > 0) {
          validations.push({
            id: data.id,
            job_id: data.job_id,
            artifact_id: data.artifact_id,
            compliance_status: data.compliance_status,
            compliance_score: parseInt(data.compliance_score),
            violations_count: parseInt(data.violations_count),
            authority_level: data.authority_level,
            processing_tier: data.processing_tier,
            processing_time_ms: parseInt(data.processing_time_ms),
            evidence_summary: JSON.parse(data.evidence_summary),
            validation_level: data.validation_level,
            content_length: parseInt(data.content_length),
            sources_count: parseInt(data.sources_count),
            correlation_id: data.correlation_id,
            validation_timestamp: data.validation_timestamp,
            compliance_report: JSON.parse(data.compliance_report)
          });
        }
      }

      await redis.quit();

      // Sort by timestamp descending
      validations.sort((a, b) => new Date(b.validation_timestamp).getTime() - new Date(a.validation_timestamp).getTime());

      return { validations };

    } catch (error) {
      console.error('Failed to get compliance validations by artifact from Redis:', error);
      return {
        validations: [],
        error: error instanceof Error ? error.message : 'Redis retrieval failed'
      };
    }
  }

  /**
   * Get compliance validation statistics
   */
  async getComplianceStatistics(hoursBack: number = 24): Promise<{ 
    total_validations: number;
    compliant_count: number;
    non_compliant_count: number;
    average_score: number;
    average_processing_time_ms: number;
    error?: string;
  }> {
    try {
      if (this.useRedisFallback) {
        return await this.getComplianceStatisticsRedis(hoursBack);
      }

      const { data, error } = await (this.supabase as any)
        .from('eip_compliance_validations')
        .select('compliance_status, compliance_score, processing_time_ms')
        .gte('validation_timestamp', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Failed to get compliance statistics:', error);
        return {
          total_validations: 0,
          compliant_count: 0,
          non_compliant_count: 0,
          average_score: 0,
          average_processing_time_ms: 0,
          error: error.message
        };
      }

      const total_validations = data.length;
      const compliant_count = data.filter((r: any) => r.compliance_status === 'compliant').length;
      const non_compliant_count = data.filter((r: any) => r.compliance_status === 'non_compliant').length;
      const average_score = total_validations > 0 ? data.reduce((sum: number, r: any) => sum + r.compliance_score, 0) / total_validations : 0;
      const average_processing_time_ms = total_validations > 0 ? data.reduce((sum: number, r: any) => sum + r.processing_time_ms, 0) / total_validations : 0;

      return {
        total_validations,
        compliant_count,
        non_compliant_count,
        average_score,
        average_processing_time_ms
      };

    } catch (error) {
      console.error('Failed to get compliance statistics:', error);
      return {
        total_validations: 0,
        compliant_count: 0,
        non_compliant_count: 0,
        average_score: 0,
        average_processing_time_ms: 0,
        error: error instanceof Error ? error.message : 'Unknown error getting statistics'
      };
    }
  }

  /**
   * Redis fallback for compliance statistics
   */
  private async getComplianceStatisticsRedis(hoursBack: number): Promise<{ 
    total_validations: number;
    compliant_count: number;
    non_compliant_count: number;
    average_score: number;
    average_processing_time_ms: number;
    error?: string;
  }> {
    try {
      const redis = this.createRedisClient();

      // This is a simplified implementation - in practice, you'd want to scan keys
      // and filter by timestamp, which would be more complex
      const keys = await redis.keys('compliance-validation:*');
      
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      let total_validations = 0;
      let compliant_count = 0;
      let non_compliant_count = 0;
      let total_score = 0;
      let total_processing_time = 0;

      for (const key of keys) {
        const data = await redis.hgetall(key);
        
        if (data && Object.keys(data).length > 0) {
          const validationTimestamp = new Date(data.validation_timestamp);
          
          if (validationTimestamp >= cutoffTime) {
            total_validations++;
            
            if (data.compliance_status === 'compliant') {
              compliant_count++;
            } else if (data.compliance_status === 'non_compliant') {
              non_compliant_count++;
            }
            
            total_score += parseInt(data.compliance_score);
            total_processing_time += parseInt(data.processing_time_ms);
          }
        }
      }

      await redis.quit();

      return {
        total_validations,
        compliant_count,
        non_compliant_count,
        average_score: total_validations > 0 ? total_score / total_validations : 0,
        average_processing_time_ms: total_validations > 0 ? total_processing_time / total_validations : 0
      };

    } catch (error) {
      console.error('Failed to get compliance statistics from Redis:', error);
      return {
        total_validations: 0,
        compliant_count: 0,
        non_compliant_count: 0,
        average_score: 0,
        average_processing_time_ms: 0,
        error: error instanceof Error ? error.message : 'Redis statistics failed'
      };
    }
  }
}
