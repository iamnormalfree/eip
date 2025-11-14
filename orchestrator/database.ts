// ABOUTME: Database integration for EIP orchestrator
// ABOUTME: Persists jobs and artifacts with full provenance trail

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';
import { EipJob, EipArtifact } from '../lib_supabase/db/types/database.types';

export interface JobRecord {
  id: string;
  brief: string;
  persona?: string;
  funnel?: string;
  tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  correlation_id?: string;
  queue_job_id?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'dlq';
  stage?: string;
  started_at: string;
  completed_at?: string;
  inputs?: any;
  outputs?: any;
  budget_tracker?: any;
  error_details?: any;
  retry_count: number;
  tokens?: number;
  cost_cents?: number;
  duration_ms?: number;
  fail_reason?: string;
}

export interface ArtifactRecord {
  id: string;
  job_id: string;
  brief: string;
  ip_used: string;
  tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  jsonld?: any;
  persona?: string;
  funnel?: string;
  status: 'seed' | 'draft' | 'published' | 'rejected';
  content?: string;
  ledger: any;
  invariants?: any;
  sources?: any;
  reviewer_score?: number;
  slug?: string;
  frontmatter: any;
  created_at: string;
  updated_at: string;
}

export class OrchestratorDB {
  private supabase: ReturnType<typeof getSupabaseAdmin>;

  constructor() {
    this.supabase = getSupabaseAdmin();
  }

  async createJob(job: Omit<JobRecord, 'id' | 'started_at' | 'retry_count'>): Promise<{ job: JobRecord; error?: string }> {
    const jobId = uuidv4();
    const now = new Date().toISOString();

    const jobRecord: Omit<EipJob, 'updated_at'> = {
      id: jobId,
      brief: job.brief,
      persona: job.persona || null,
      funnel: job.funnel || null,
      tier: job.tier,
      correlation_id: job.correlation_id || null,
      queue_job_id: job.queue_job_id || null,
      status: job.status || 'queued',
      stage: job.stage || null,
      started_at: now,
      completed_at: job.completed_at || null,
      inputs: job.inputs || null,
      outputs: job.outputs || null,
      budget_tracker: job.budget_tracker || null,
      error_details: job.error_details || null,
      retry_count: 0, // Default for new jobs
      tokens: job.tokens || null,
      cost_cents: job.cost_cents || null,
      duration_ms: job.duration_ms || null,
      fail_reason: job.fail_reason || null
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
    // Handle special case for marking job as completed
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

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

  async createArtifact(artifact: Omit<ArtifactRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ artifact: ArtifactRecord; error?: string }> {
    const artifactId = uuidv4();
    const now = new Date().toISOString();

    const artifactRecord = {
      id: artifactId,
      job_id: artifact.job_id,
      brief: artifact.brief,
      ip_used: artifact.ip_used,
      tier: artifact.tier,
      jsonld: artifact.jsonld || null,
      persona: artifact.persona || null,
      funnel: artifact.funnel || null,
      status: artifact.status || 'draft',
      content: artifact.content || null,
      ledger: artifact.ledger || {},
      invariants: artifact.invariants || null,  // Will be populated by micro-auditor
      sources: artifact.sources || null,      // Will be populated by evidence collector
      reviewer_score: artifact.reviewer_score || null,
      slug: artifact.slug || null,
      frontmatter: artifact.frontmatter || {},
      created_at: now,
      updated_at: now
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
      status: 'dlq',
      fail_reason: dlqRecord.fail_reason,
      error_details: dlqRecord,
      completed_at: new Date().toISOString()
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
