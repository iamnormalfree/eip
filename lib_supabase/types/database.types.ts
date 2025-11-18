export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Broker tables removed - broker era baggage cleaned up

      // New EIP Tables (with eip_ prefix for Schema Coexistence)
      eip_schema_registry: {
        Row: {
          key: string
          version: string
          checksum: string
          updated_at: string
        }
        Insert: {
          key: string
          version: string
          checksum: string
          updated_at?: string
        }
        Update: {
          key?: string
          version?: string
          checksum?: string
          updated_at?: string
        }
      }
      eip_evidence_registry: {
        Row: {
          evidence_key: string
          allow_web: boolean
          allow_domains: string[] | null
        }
        Insert: {
          evidence_key: string
          allow_web?: boolean
          allow_domains?: string[] | null
        }
        Update: {
          evidence_key?: string
          allow_web?: boolean
          allow_domains?: string[] | null
        }
      }
      eip_entities: {
        Row: {
          id: string
          type: string
          name: string
          attrs: Json
          valid_from: string
          valid_to: string | null
          source_url: string | null
        }
        Insert: {
          id?: string
          type: string
          name: string
          attrs?: Json
          valid_from?: string
          valid_to?: string | null
          source_url?: string | null
        }
        Update: {
          id?: string
          type?: string
          name?: string
          attrs?: Json
          valid_from?: string
          valid_to?: string | null
          source_url?: string | null
        }
      }
      eip_evidence_snapshots: {
        Row: {
          id: string
          evidence_key: string
          version: string
          data: Json
          last_checked: string
        }
        Insert: {
          id?: string
          evidence_key: string
          version: string
          data: Json
          last_checked: string
        }
        Update: {
          id?: string
          evidence_key?: string
          version?: string
          data?: Json
          last_checked?: string
        }
      }
      eip_artifacts: {
        Row: {
          id: string
          job_id: string | null
          brief: string
          ip_used: string
          tier: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          jsonld: Json | null
          persona: string | null
          funnel: string | null
          status: 'seed' | 'draft' | 'published' | 'rejected'
          content: string | null
          ledger: Json
          invariants: Json | null
          sources: Json | null
          reviewer_score: number | null
          slug: string | null
          frontmatter: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          brief: string
          ip_used: string
          tier: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          jsonld?: Json | null
          persona?: string | null
          funnel?: string | null
          status?: 'seed' | 'draft' | 'published' | 'rejected'
          content?: string | null
          ledger?: Json
          invariants?: Json | null
          sources?: Json | null
          reviewer_score?: number | null
          slug?: string | null
          frontmatter?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          brief?: string
          ip_used?: string
          tier?: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          jsonld?: Json | null
          persona?: string | null
          funnel?: string | null
          status?: 'seed' | 'draft' | 'published' | 'rejected'
          content?: string | null
          ledger?: Json
          invariants?: Json | null
          sources?: Json | null
          reviewer_score?: number | null
          slug?: string | null
          frontmatter?: Json
          created_at?: string
          updated_at?: string
        }
      }
      eip_brand_profiles: {
        Row: {
          id: string
          brand: string
          version: string
          profile_json: Json
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          version: string
          profile_json: Json
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          version?: string
          profile_json?: Json
          updated_at?: string
        }
      }
      eip_jobs: {
        Row: {
          id: string
          brief: string
          persona: string | null
          funnel: string | null
          tier: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          correlation_id: string | null
          queue_job_id: string | null
          status: 'queued' | 'processing' | 'completed' | 'failed' | 'dlq'
          stage: string | null
          started_at: string
          completed_at: string | null
          inputs: Json | null
          outputs: Json | null
          budget_tracker: Json | null
          error_details: Json | null
          retry_count: number
          tokens: number | null
          cost_cents: number | null
          duration_ms: number | null
          fail_reason: string | null
        }
        Insert: {
          id?: string
          brief: string
          persona?: string | null
          funnel?: string | null
          tier: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          correlation_id?: string | null
          queue_job_id?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed' | 'dlq'
          stage?: string | null
          started_at?: string
          completed_at?: string | null
          inputs?: Json | null
          outputs?: Json | null
          budget_tracker?: Json | null
          error_details?: Json | null
          retry_count?: number
          tokens?: number | null
          cost_cents?: number | null
          duration_ms?: number | null
          fail_reason?: string | null
        }
        Update: {
          id?: string
          brief?: string
          persona?: string | null
          funnel?: string | null
          tier?: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          correlation_id?: string | null
          queue_job_id?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed' | 'dlq'
          stage?: string | null
          started_at?: string
          completed_at?: string | null
          inputs?: Json | null
          outputs?: Json | null
          budget_tracker?: Json | null
          error_details?: Json | null
          retry_count?: number
          tokens?: number | null
          cost_cents?: number | null
          duration_ms?: number | null
          fail_reason?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Broker functions removed - broker era baggage cleaned up

      // EIP Queue Management Functions
      // Broker bridge functions removed - broker era baggage cleaned up

      // EIP Queue Management Functions
      get_next_eip_job: {
        Args: {
          p_worker_id?: string
        }
        Returns: {
          job_id: string
          brief: string
          persona: string | null
          funnel: string | null
          tier: 'LIGHT' | 'MEDIUM' | 'HEAVY'
          queue_job_id: string | null
          correlation_id: string | null
        }[]
      }
      complete_eip_job: {
        Args: {
          p_job_id: string
          p_outputs?: Json
          p_tokens?: number
          p_cost_cents?: number
          p_duration_ms?: number
        }
        Returns: boolean
      }
      fail_eip_job_to_dlq: {
        Args: {
          p_job_id: string
          p_error_details: Json
          p_fail_reason?: string
        }
        Returns: boolean
      }
      get_eip_job_stats: {
        Args: {
          p_hours_back?: number
        }
        Returns: {
          status: string
          job_count: number
          avg_duration_ms: number
          avg_cost_cents: number
          total_tokens: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// EIP-specific type helpers for easier usage
export type EipArtifact = Database['public']['Tables']['eip_artifacts']['Row']
export type EipEntity = Database['public']['Tables']['eip_entities']['Row']
export type EipJob = Database['public']['Tables']['eip_jobs']['Row']
export type EipBrandProfile = Database['public']['Tables']['eip_brand_profiles']['Row']
export type EipEvidenceRegistry = Database['public']['Tables']['eip_evidence_registry']['Row']
export type EipEvidenceSnapshot = Database['public']['Tables']['eip_evidence_snapshots']['Row']
export type EipSchemaRegistry = Database['public']['Tables']['eip_schema_registry']['Row']

// Broker type helpers removed - broker era baggage cleaned up

// Union types for cross-domain operations
export type AnyTable = EipArtifact | EipEntity | EipJob | EipBrandProfile |
                      EipEvidenceRegistry | EipEvidenceSnapshot | EipSchemaRegistry
