import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

// Lazy initialization - clients are created on first access, not at module load time
// This prevents Supabase initialization during Next.js build/prerendering
let _supabase: SupabaseClient<Database> | null = null;
let _supabaseAdmin: SupabaseClient<Database> | null = null;

// Client for browser (public operations)
export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
    }
    
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Backward compatibility: export getter as property for existing code
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    return (getSupabase() as any)[prop];
  }
});

// Helper function to get admin client safely (server-side only)
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server');
  }
  
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY; // Support both naming conventions

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    _supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  
  return _supabaseAdmin;
}

// Backward compatibility: export getter as property for existing code
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  }
});
