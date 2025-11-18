// ABOUTME: Database integration for EIP orchestrator with pragmatic type approach
// ABOUTME: Persists jobs and artifacts with full provenance trail using working Supabase patterns

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';

// Pragmatic interfaces that work with actual database operations
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

/**
 * Database wrapper that bypasses problematic type inference
 */
export class OrchestratorDB {
  private supabase: ReturnType<typeof getSupabaseAdmin>;

  constructor() {
    this.supabase = getSupabaseAdmin();
  }

  /**
   * Create a new job using pragmatic typing
   */
  async createJob(jobData: Omit<JobRecord, 'id' | 'started_at' | 'retry_count'>): Promise<{ job: JobRecord; error?: string }> {
    try {
      const jobId = uuidv4();
      const now = new Date().toISOString();

      // Use any typing to bypass Supabase type inference issues
      const insertData: any = {
        id: jobId,
        brief: jobData.brief,
        persona: jobData.persona || null,
        funnel: jobData.funnel || null,
        tier: jobData.tier,
        correlation_id: jobData.correlation_id || null,
        queue_job_id: jobData.queue_job_id || null,
        status: jobData.status || 'queued',
        stage: jobData.stage || null,
        started_at: now,
        completed_at: jobData.completed_at || null,
        inputs: jobData.inputs || null,
        outputs: jobData.outputs || null,
        budget_tracker: jobData.budget_tracker || null,
        error_details: jobData.error_details || null,
        retry_count: 0,
        tokens: jobData.tokens || null,
        cost_cents: jobData.cost_cents || null,
        duration_ms: jobData.duration_ms || null,
        fail_reason: jobData.fail_reason || null
      };

      // Bypass type issues with generic any approach
      const { data, error } = await (this.supabase as any)
        .from('eip_jobs')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Failed to create job:', error);
        return { 
          job: {
            id: jobId,
            started_at: now,
            retry_count: 0,
            ...jobData
          },
          error: error.message 
        };
      }

      // Transform result with explicit casting
      const jobRecord: JobRecord = {
        id: data.id,
        brief: data.brief,
        persona: data.persona || undefined,
        funnel: data.funnel || undefined,
        tier: data.tier,
        correlation_id: data.correlation_id || undefined,
        queue_job_id: data.queue_job_id || undefined,
        status: data.status,
        stage: data.stage || undefined,
        started_at: data.started_at,
        completed_at: data.completed_at || undefined,
        inputs: data.inputs || undefined,
        outputs: data.outputs || undefined,
        budget_tracker: data.budget_tracker || undefined,
        error_details: data.error_details || undefined,
        retry_count: data.retry_count,
        tokens: data.tokens || undefined,
        cost_cents: data.cost_cents || undefined,
        duration_ms: data.duration_ms || undefined,
        fail_reason: data.fail_reason || undefined
      };

      return { job: jobRecord };
    } catch (error) {
      console.error('Failed to create job:', error);
      return {
        job: {} as JobRecord,
        error: error instanceof Error ? error.message : 'Unknown error creating job'
      };
    }
  }

  /**
   * Update an existing job using pragmatic typing
   */
  async updateJob(jobId: string, updates: Partial<JobRecord>): Promise<{ job: JobRecord; error?: string }> {
    try {
      // Auto-set completed_at when status changes to completed
      const updateData = { ...updates };
      if (updateData.status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      // Use any typing to bypass Supabase type inference issues
      const dbUpdate: any = {
        brief: updateData.brief,
        persona: updateData.persona || null,
        funnel: updateData.funnel || null,
        tier: updateData.tier,
        correlation_id: updateData.correlation_id || null,
        queue_job_id: updateData.queue_job_id || null,
        status: updateData.status,
        stage: updateData.stage || null,
        started_at: updateData.started_at,
        completed_at: updateData.completed_at || null,
        inputs: updateData.inputs || null,
        outputs: updateData.outputs || null,
        budget_tracker: updateData.budget_tracker || null,
        error_details: updateData.error_details || null,
        retry_count: updateData.retry_count,
        tokens: updateData.tokens || null,
        cost_cents: updateData.cost_cents || null,
        duration_ms: updateData.duration_ms || null,
        fail_reason: updateData.fail_reason || null
      };

      // Remove undefined values to avoid SQL issues
      Object.keys(dbUpdate).forEach(key => dbUpdate[key] === undefined && delete dbUpdate[key]);

      const { data, error } = await (this.supabase as any)
        .from('eip_jobs')
        .update(dbUpdate)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update job:', error);
        return { job: {} as JobRecord, error: error.message };
      }

      // Transform result with explicit casting
      const jobRecord: JobRecord = {
        id: data.id,
        brief: data.brief,
        persona: data.persona || undefined,
        funnel: data.funnel || undefined,
        tier: data.tier,
        correlation_id: data.correlation_id || undefined,
        queue_job_id: data.queue_job_id || undefined,
        status: data.status,
        stage: data.stage || undefined,
        started_at: data.started_at,
        completed_at: data.completed_at || undefined,
        inputs: data.inputs || undefined,
        outputs: data.outputs || undefined,
        budget_tracker: data.budget_tracker || undefined,
        error_details: data.error_details || undefined,
        retry_count: data.retry_count,
        tokens: data.tokens || undefined,
        cost_cents: data.cost_cents || undefined,
        duration_ms: data.duration_ms || undefined,
        fail_reason: data.fail_reason || undefined
      };

      return { job: jobRecord };
    } catch (error) {
      console.error('Failed to update job:', error);
      return {
        job: {} as JobRecord,
        error: error instanceof Error ? error.message : 'Unknown error updating job'
      };
    }
  }

  /**
   * Create a new artifact using pragmatic typing
   */
  async createArtifact(artifactData: Omit<ArtifactRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ artifact: ArtifactRecord; error?: string }> {
    try {
      const artifactId = uuidv4();
      const now = new Date().toISOString();

      // Use any typing to bypass Supabase type inference issues
      const insertData: any = {
        id: artifactId,
        job_id: artifactData.job_id || null,
        brief: artifactData.brief,
        ip_used: artifactData.ip_used,
        tier: artifactData.tier,
        jsonld: artifactData.jsonld || null,
        persona: artifactData.persona || null,
        funnel: artifactData.funnel || null,
        status: artifactData.status || 'draft',
        content: artifactData.content || null,
        ledger: artifactData.ledger || {},
        invariants: artifactData.invariants || null,
        sources: artifactData.sources || null,
        reviewer_score: artifactData.reviewer_score || null,
        slug: artifactData.slug || null,
        frontmatter: artifactData.frontmatter || {},
        created_at: now,
        updated_at: now
      };

      const { data, error } = await (this.supabase as any)
        .from('eip_artifacts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Failed to create artifact:', error);
        return { 
          artifact: {
            id: artifactId,
            job_id: artifactData.job_id || '',
            created_at: now,
            updated_at: now,
            ...artifactData
          },
          error: error.message 
        };
      }

      // Transform result with explicit casting
      const artifactRecord: ArtifactRecord = {
        id: data.id,
        job_id: data.job_id || '',
        brief: data.brief,
        ip_used: data.ip_used,
        tier: data.tier,
        jsonld: data.jsonld || undefined,
        persona: data.persona || undefined,
        funnel: data.funnel || undefined,
        status: data.status,
        content: data.content || undefined,
        ledger: data.ledger,
        invariants: data.invariants || undefined,
        sources: data.sources || undefined,
        reviewer_score: data.reviewer_score || undefined,
        slug: data.slug || undefined,
        frontmatter: data.frontmatter,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return { artifact: artifactRecord };
    } catch (error) {
      console.error('Failed to create artifact:', error);
      return {
        artifact: {} as ArtifactRecord,
        error: error instanceof Error ? error.message : 'Unknown error creating artifact'
      };
    }
  }

  /**
   * Fail a job to Dead Letter Queue
   */
  async failJobToDLQ(jobId: string, dlqRecord: any): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = {
        status: 'dlq',
        fail_reason: dlqRecord.fail_reason || 'Unknown error',
        error_details: {
          error_type: dlqRecord.error_type || 'Unknown',
          message: dlqRecord.message || 'Job failed',
          stack: dlqRecord.stack,
          stage: dlqRecord.stage || 'unknown',
          retry_count: dlqRecord.retry_count || 0
        },
        completed_at: new Date().toISOString()
      };

      const { error } = await (this.supabase as any)
        .from('eip_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        console.error('Failed to fail job to DLQ:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to fail job to DLQ:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in DLQ operation'
      };
    }
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<{ job: JobRecord | null; error?: string }> {
    try {
      const { data, error } = await (this.supabase as any)
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

      // Transform result with explicit casting
      const jobRecord: JobRecord = {
        id: data.id,
        brief: data.brief,
        persona: data.persona || undefined,
        funnel: data.funnel || undefined,
        tier: data.tier,
        correlation_id: data.correlation_id || undefined,
        queue_job_id: data.queue_job_id || undefined,
        status: data.status,
        stage: data.stage || undefined,
        started_at: data.started_at,
        completed_at: data.completed_at || undefined,
        inputs: data.inputs || undefined,
        outputs: data.outputs || undefined,
        budget_tracker: data.budget_tracker || undefined,
        error_details: data.error_details || undefined,
        retry_count: data.retry_count,
        tokens: data.tokens || undefined,
        cost_cents: data.cost_cents || undefined,
        duration_ms: data.duration_ms || undefined,
        fail_reason: data.fail_reason || undefined
      };

      return { job: jobRecord };
    } catch (error) {
      console.error('Failed to get job:', error);
      return {
        job: null,
        error: error instanceof Error ? error.message : 'Unknown error getting job'
      };
    }
  }

  /**
   * Get all artifacts for a job
   */
  async getJobArtifacts(jobId: string): Promise<{ artifacts: ArtifactRecord[]; error?: string }> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('eip_artifacts')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get job artifacts:', error);
        return { artifacts: [], error: error.message };
      }

      // Transform results to ArtifactRecord array
      const artifacts: ArtifactRecord[] = data.map((artifact: any) => ({
        id: artifact.id,
        job_id: artifact.job_id || '',
        brief: artifact.brief,
        ip_used: artifact.ip_used,
        tier: artifact.tier,
        jsonld: artifact.jsonld || undefined,
        persona: artifact.persona || undefined,
        funnel: artifact.funnel || undefined,
        status: artifact.status,
        content: artifact.content || undefined,
        ledger: artifact.ledger,
        invariants: artifact.invariants || undefined,
        sources: artifact.sources || undefined,
        reviewer_score: artifact.reviewer_score || undefined,
        slug: artifact.slug || undefined,
        frontmatter: artifact.frontmatter,
        created_at: artifact.created_at,
        updated_at: artifact.updated_at
      }));

      return { artifacts };
    } catch (error) {
      console.error('Failed to get job artifacts:', error);
      return {
        artifacts: [],
        error: error instanceof Error ? error.message : 'Unknown error getting job artifacts'
      };
    }
  }
}

/**
 * Export standalone function for DLQ operations for backward compatibility
 */
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
