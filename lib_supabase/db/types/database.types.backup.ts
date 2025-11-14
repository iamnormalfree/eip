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
      ai_brokers: {
        Row: {
          id: string
          name: string
          slug: string
          photo_url: string | null
          role: string
          personality_type: string
          voice_description: string
          communication_style: string
          approach_style: string
          favorite_phrases: string[]
          speaking_speed: string
          voice_model: string
          current_workload: number
          is_active: boolean
          performance_metrics: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          photo_url?: string | null
          role: string
          personality_type: string
          voice_description: string
          communication_style: string
          approach_style: string
          favorite_phrases?: string[]
          speaking_speed?: string
          voice_model?: string
          current_workload?: number
          is_active?: boolean
          performance_metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          photo_url?: string | null
          role?: string
          personality_type?: string
          voice_description?: string
          communication_style?: string
          approach_style?: string
          favorite_phrases?: string[]
          speaking_speed?: string
          voice_model?: string
          current_workload?: number
          is_active?: boolean
          performance_metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      broker_conversations: {
        Row: {
          id: string
          conversation_id: number
          broker_id: string
          contact_id: number | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          lead_score: number
          loan_type: string | null
          property_type: string | null
          monthly_income: number | null
          loan_amount: number | null
          timeline: string | null
          assignment_method: string
          assignment_reason: string | null
          status: string
          assigned_at: string
          first_response_at: string | null
          handoff_at: string | null
          handoff_reason: string | null
          messages_exchanged: number
          broker_messages: number
          customer_messages: number
          last_message_at: string | null
          conversion_status: string | null
          conversion_value: number | null
          customer_satisfaction: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: number
          broker_id: string
          contact_id?: number | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          lead_score: number
          loan_type?: string | null
          property_type?: string | null
          monthly_income?: number | null
          loan_amount?: number | null
          timeline?: string | null
          assignment_method: string
          assignment_reason?: string | null
          status?: string
          assigned_at?: string
          first_response_at?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          messages_exchanged?: number
          broker_messages?: number
          customer_messages?: number
          last_message_at?: string | null
          conversion_status?: string | null
          conversion_value?: number | null
          customer_satisfaction?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: number
          broker_id?: string
          contact_id?: number | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          lead_score?: number
          loan_type?: string | null
          property_type?: string | null
          monthly_income?: number | null
          loan_amount?: number | null
          timeline?: string | null
          assignment_method?: string
          assignment_reason?: string | null
          status?: string
          assigned_at?: string
          first_response_at?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          messages_exchanged?: number
          broker_messages?: number
          customer_messages?: number
          last_message_at?: string | null
          conversion_status?: string | null
          conversion_value?: number | null
          customer_satisfaction?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      broker_performance: {
        Row: {
          id: string
          broker_id: string
          period_start: string
          period_end: string
          total_conversations: number
          total_handoffs: number
          successful_handoffs: number
          average_response_time: number | null
          average_messages_per_conversation: number | null
          conversion_rate: number | null
          customer_satisfaction_avg: number | null
          total_conversion_value: number | null
          performance_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          broker_id: string
          period_start: string
          period_end: string
          total_conversations?: number
          total_handoffs?: number
          successful_handoffs?: number
          average_response_time?: number | null
          average_messages_per_conversation?: number | null
          conversion_rate?: number | null
          customer_satisfaction_avg?: number | null
          total_conversion_value?: number | null
          performance_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          broker_id?: string
          period_start?: string
          period_end?: string
          total_conversations?: number
          total_handoffs?: number
          successful_handoffs?: number
          average_response_time?: number | null
          average_messages_per_conversation?: number | null
          conversion_rate?: number | null
          customer_satisfaction_avg?: number | null
          total_conversion_value?: number | null
          performance_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_broker_assignment: {
        Args: {
          conversation_id_param: number
        }
        Returns: {
          hasbroker: boolean
          broker_id: string | null
        }[]
      }
      get_assigned_broker: {
        Args: {
          p_lead_score: number
          p_loan_type: string
          p_property_type: string
          p_monthly_income: number
          p_timeline: string
        }
        Returns: Database['public']['Tables']['ai_brokers']['Row']
      }
      update_metrics_after_response: {
        Args: {
          p_conversation_id: number
          p_broker_id: string
          p_message_count: number
          p_handoff_triggered: boolean
          p_handoff_reason: string
        }
        Returns: void
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