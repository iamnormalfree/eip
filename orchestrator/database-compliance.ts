// ABOUTME: Updated Compliance Database Extension with Supabase support and Redis fallback
// ABOUTME: Maintains backward compatibility during Redis → Supabase migration transition
// ABOUTME: This file now uses the new Supabase-based implementation

// Re-export from the new implementation for backward compatibility
export { 
  ComplianceDatabaseExtension,
  ComplianceValidationRecord
} from './database-compliance-v2';

// Re-export types for backward compatibility
export type {
  ComplianceValidationRecord as IComplianceValidationRecord
} from './database-compliance-v2';
