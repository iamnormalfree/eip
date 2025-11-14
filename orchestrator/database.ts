// ABOUTME: Database integration for EIP orchestrator
// ABOUTME: Persists jobs and artifacts with full provenance trail

import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';
import { EipJob, EipArtifact } from '../lib_supabase/db/types/database.types';

export interface JobRecord {
  id: string;
  stage: string;
  started_at: string;
  inputs: any;
  outputs?: any;
  tokens?: number;
  cost_cents?: number;
  duration_ms?: number;
  fail_reason?: string;
  correlation_id?: string;
}

export interface ArtifactRecord {
  id: string;
  job_id: string;
  brief: string;
  ip_used: string;
  persona?: string;
  funnel?: string;
  tier: string;
  content: string;
  frontmatter: any;
  jsonld: any;
  ledger: any;
  created_at: string;
}

export class OrchestratorDB {
  private supabase: ReturnType<typeof getSupabaseAdmin>;

  constructor() {
    this.supabase = getSupabaseAdmin();
  }

  async createJob(job: Omit<JobRecord, 'id' | 'started_at'>): Promise<{ job: JobRecord; error?: string }> {
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const jobRecord: Omit<EipJob, 'updated_at'> = {
      id: jobId,
      stage: job.stage,
      started_at: now,
      inputs: job.inputs,
      outputs: job.outputs || null,
      tokens: job.tokens || null,
      cost_cents: job.cost_cents || null,
      duration_ms: job.duration_ms || null,
      fail_reason: job.fail_reason || null,
      correlation_id: job.correlation_id || null
    };

    const { data, error } = await this.supabase
      .from('eip_jobs')
      .insert(jobRecord)
      .select()
      .single();

    if (error) {
      console.error('Failed to create job:', error);
      return { job: jobRecord as JobRecord, error: error.message };
    }

    return { job: data as JobRecord };
  }

  async updateJob(jobId: string, updates: Partial<JobRecord>): Promise<{ job: JobRecord; error?: string }> {
    const { data, error } = await this.supabase
      .from('eip_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update job:', error);
      return { job: {} as JobRecord, error: error.message };
    }

    return { job: data as JobRecord };
  }

  async createArtifact(artifact: Omit<ArtifactRecord, 'id' | 'created_at'>): Promise<{ artifact: ArtifactRecord; error?: string }> {
    const artifactId = 'artifact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const artifactRecord = {
      id: artifactId,
      job_id: artifact.job_id,
      brief: artifact.brief,
      ip_used: artifact.ip_used,
      persona: artifact.persona || null,
      funnel: artifact.funnel || null,
      tier: artifact.tier,
      content: artifact.content,
      frontmatter: artifact.frontmatter,
      jsonld: artifact.jsonld || null,
      invariants: null,  // Will be populated by micro-auditor
      sources: null,      // Will be populated by evidence collector
      jsonld: artifact.jsonld,
      ledger: artifact.ledger,
      created_at: now
    };

    const { data, error } = await this.supabase
      .from('eip_artifacts')
      .insert(artifactRecord)
      .select()
      .single();

    if (error) {
      console.error('Failed to create artifact:', error);
      return { artifact: artifactRecord as ArtifactRecord, error: error.message };
    }

    return { artifact: data as ArtifactRecord };
  }

  async failJobToDLQ(jobId: string, dlqRecord: any): Promise<{ success: boolean; error?: string }> {
    const updates: Partial<JobRecord> = {
      stage: 'DLQ',
      fail_reason: dlqRecord.fail_reason,
      outputs: dlqRecord
    };

    const { error } = await this.supabase
      .from('eip_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error('Failed to fail job to DLQ:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getJob(jobId: string): Promise<{ job: JobRecord | null; error?: string }> {
    const { data, error } = await this.supabase
      .from('eip_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { job: null }; // Not found
      }
      console.error('Failed to get job:', error);
      return { job: null, error: error.message };
    }

    return { job: data as JobRecord };
  }

  async getJobArtifacts(jobId: string): Promise<{ artifacts: ArtifactRecord[]; error?: string }> {
    const { data, error } = await this.supabase
      .from('eip_artifacts')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get job artifacts:', error);
      return { artifacts: [], error: error.message };
    }

    return { artifacts: data as ArtifactRecord[] };
  }
}

// Export standalone function for DLQ operations
export async function failJobToDLQ(jobId: string, dlqRecord: any): Promise<{ success: boolean; error?: string }> {
  try {
    const db = new OrchestratorDB();
    return await db.failJobToDLQ(jobId, dlqRecord);
  } catch (error) {
    console.error('Failed to create database connection for DLQ:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown DLQ error'
    };
  }
}
