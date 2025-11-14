/**
 * Calculation Repository - Supabase Audit Trail Storage
 *
 * Stores all mortgage calculations for:
 * - MAS compliance tracking
 * - Audit trail for regulatory review
 * - Historical analysis
 * - Client history tracking
 *
 * Database table: calculation_audit (created in 001_ai_conversations.sql)
 */

import { createClient } from '@supabase/supabase-js';

// Legacy types for backwards compatibility
interface LoanCalculationInputs {
  propertyPrice: number;
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial';
  monthlyIncome: number;
  existingCommitments: number;
  age: number;
  citizenship: 'Citizen' | 'PR' | 'Foreigner';
  propertyCount: 1 | 2 | 3;
  incomeType?: 'fixed' | 'variable' | 'self_employed' | 'rental' | 'mixed';
  coApplicant?: {
    monthlyIncome: number;
    age: number;
    existingCommitments: number;
  };
}

interface LoanCalculationResult {
  maxLoan: number;
  ltvApplied: number;
  ltvPenalty: boolean;
  monthlyPayment: number;
  stressTestPayment: number;
  tdsrUsed: number;
  msrUsed: number | null;
  limitingFactor: 'TDSR' | 'MSR' | 'LTV';
  downPayment: number;
  minCashRequired: number;
  cpfAllowed: number;
  stampDuty: number;
  totalFundsRequired: number;
  maxTenure: number;
  recommendedTenure: number;
  reasoning: string[];
  masCompliant: boolean;
  warnings: string[];
}

// ============================================================================
// SUPABASE CLIENT - Lazy Initialization
// ============================================================================

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface CalculationAuditRecord {
  id?: string;
  conversationId: string;
  calculationType: 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison';
  inputs: LoanCalculationInputs;
  results: LoanCalculationResult;
  masCompliant: boolean;
  regulatoryNotes: string;
  formulaVersion: string;
  timestamp: Date;
}

export interface CalculationHistory {
  calculations: CalculationAuditRecord[];
  totalCalculations: number;
  complianceRate: number;
  averageTDSR: number;
}

// ============================================================================
// CALCULATION REPOSITORY CLASS
// ============================================================================

export class CalculationRepository {
  /**
   * Store calculation audit record in Supabase
   * Returns the audit record ID for reference
   */
  async storeCalculationAudit(
    conversationId: string,
    calculationType: 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison',
    inputs: LoanCalculationInputs,
    results: LoanCalculationResult
  ): Promise<string> {
    try {
      const record = {
        conversation_id: conversationId,
        calculation_type: calculationType,
        inputs: JSON.stringify(inputs),
        results: JSON.stringify(results),
        mas_compliant: results.masCompliant,
        regulatory_notes: this.generateRegulatoryNotes(results, inputs),
        formula_version: '2.0.0',  // Dr. Elena version
        timestamp: new Date().toISOString()
      };

      const { data, error } = await getSupabaseClient()
        .from('calculation_audit')
        // @ts-expect-error - Supabase type inference issue with insert
        .insert(record)
        .select('id')
        .single() as { data: any; error: any };

      if (error) {
        console.error('L Failed to store calculation audit:', error);
        throw new Error(`Calculation audit storage failed: ${error.message}`);
      }

      console.log(` Calculation audit stored: ${data.id}`);
      return data.id;

    } catch (error: any) {
      console.error('L Calculation audit error:', error);
      // Don't throw - we don't want calculation failures to break the user flow
      // Log for monitoring but continue
      return 'error-' + Date.now();
    }
  }

  /**
   * Generate regulatory compliance notes for audit trail
   * Documents which MAS regulations apply and compliance status
   */
  private generateRegulatoryNotes(
    result: LoanCalculationResult,
    inputs: LoanCalculationInputs
  ): string {
    const notes: string[] = [];

    // Document MAS Notice 645 (TDSR)
    notes.push(`MAS Notice 645 (TDSR): ${result.tdsrUsed}% of income (limit: 55%)`);

    // Document MAS Notice 632 (MSR) if applicable
    if (result.msrUsed !== null) {
      notes.push(`MAS Notice 632 (MSR): ${result.msrUsed}% of income (limit: 30% for HDB/EC)`);
    }

    // Document LTV compliance
    notes.push(`MAS Notice 632 (LTV): ${result.ltvApplied}% for property ${inputs.propertyCount}`);

    // Document extended tenure penalty if applied
    if (result.ltvPenalty) {
      notes.push(`Extended tenure penalty applied: -5% LTV reduction`);
    }

    // Document limiting factor
    notes.push(`Limiting factor: ${result.limitingFactor}`);

    // Document any warnings
    if (result.warnings.length > 0) {
      notes.push(`Warnings: ${result.warnings.join('; ')}`);
    }

    // Overall compliance status
    notes.push(`Overall MAS compliance: ${result.masCompliant ? 'PASS' : 'FAIL'}`);

    return notes.join(' | ');
  }

  /**
   * Retrieve calculation history for a conversation
   * Useful for showing client their previous calculations
   */
  async getCalculationHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<CalculationAuditRecord[]> {
    try {
      const { data, error} = await getSupabaseClient()
        .from('calculation_audit')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(limit) as { data: any[] | null; error: any };

      if (error) {
        console.error('L Failed to retrieve calculation history:', error);
        return [];
      }

      if (!data) return [];

      return data.map(row => ({
        id: row.id,
        conversationId: row.conversation_id,
        calculationType: row.calculation_type,
        inputs: typeof row.inputs === 'string' ? JSON.parse(row.inputs) : row.inputs,
        results: typeof row.results === 'string' ? JSON.parse(row.results) : row.results,
        masCompliant: row.mas_compliant,
        regulatoryNotes: row.regulatory_notes,
        formulaVersion: row.formula_version,
        timestamp: new Date(row.timestamp)
      }));

    } catch (error: any) {
      console.error('L Error retrieving calculation history:', error);
      return [];
    }
  }

  /**
   * Get calculation statistics for analytics
   * Useful for monitoring system performance and compliance rates
   */
  async getCalculationStats(
    conversationId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<CalculationHistory | null> {
    try {
      let query = getSupabaseClient()
        .from('calculation_audit')
        .select('*');

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('timestamp', dateTo.toISOString());
      }

      const { data, error } = await query as { data: any[] | null; error: any };

      if (error) {
        console.error('L Failed to get calculation stats:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          calculations: [],
          totalCalculations: 0,
          complianceRate: 100,
          averageTDSR: 0
        };
      }

      // Parse results to calculate statistics
      const calculations = data.map(row => {
        const results = typeof row.results === 'string' ? JSON.parse(row.results) : row.results;
        return {
          id: row.id,
          conversationId: row.conversation_id,
          calculationType: row.calculation_type,
          inputs: typeof row.inputs === 'string' ? JSON.parse(row.inputs) : row.inputs,
          results,
          masCompliant: row.mas_compliant,
          regulatoryNotes: row.regulatory_notes,
          formulaVersion: row.formula_version,
          timestamp: new Date(row.timestamp)
        };
      });

      const compliantCount = calculations.filter(c => c.masCompliant).length;
      const complianceRate = (compliantCount / calculations.length) * 100;

      const averageTDSR = calculations.reduce((sum, c) => sum + c.results.tdsrUsed, 0) / calculations.length;

      return {
        calculations,
        totalCalculations: calculations.length,
        complianceRate: Math.round(complianceRate * 100) / 100,
        averageTDSR: Math.round(averageTDSR * 100) / 100
      };

    } catch (error: any) {
      console.error('L Error calculating stats:', error);
      return null;
    }
  }

  /**
   * Get compliance report for regulatory review
   * Groups calculations by compliance status and identifies issues
   */
  async getComplianceReport(
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalCalculations: number;
    compliantCalculations: number;
    nonCompliantCalculations: number;
    complianceRate: number;
    commonIssues: Array<{ issue: string; count: number }>;
  } | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('calculation_audit')
        .select('*')
        .gte('timestamp', dateFrom.toISOString())
        .lte('timestamp', dateTo.toISOString()) as { data: any[] | null; error: any };

      if (error) {
        console.error('L Failed to generate compliance report:', error);
        return null;
      }

      if (!data) return null;

      const totalCalculations = data.length;
      const compliantCalculations = data.filter(row => row.mas_compliant).length;
      const nonCompliantCalculations = totalCalculations - compliantCalculations;
      const complianceRate = (compliantCalculations / totalCalculations) * 100;

      // Analyze common issues in non-compliant calculations
      const issues = new Map<string, number>();
      data.filter(row => !row.mas_compliant).forEach(row => {
        const results = typeof row.results === 'string' ? JSON.parse(row.results) : row.results;
        if (results.warnings) {
          results.warnings.forEach((warning: string) => {
            issues.set(warning, (issues.get(warning) || 0) + 1);
          });
        }
      });

      const commonIssues = Array.from(issues.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);  // Top 5 issues

      return {
        totalCalculations,
        compliantCalculations,
        nonCompliantCalculations,
        complianceRate: Math.round(complianceRate * 100) / 100,
        commonIssues
      };

    } catch (error: any) {
      console.error('L Error generating compliance report:', error);
      return null;
    }
  }

  /**
   * Get most recent calculation for a conversation
   * Useful for resuming conversations
   */
  async getLatestCalculation(
    conversationId: string
  ): Promise<CalculationAuditRecord | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('calculation_audit')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single() as { data: any | null; error: any };

      if (error) {
        if (error.code === 'PGRST116') {
          // No records found - this is OK
          return null;
        }
        console.error('L Failed to get latest calculation:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        conversationId: data.conversation_id,
        calculationType: data.calculation_type,
        inputs: typeof data.inputs === 'string' ? JSON.parse(data.inputs) : data.inputs,
        results: typeof data.results === 'string' ? JSON.parse(data.results) : data.results,
        masCompliant: data.mas_compliant,
        regulatoryNotes: data.regulatory_notes,
        formulaVersion: data.formula_version,
        timestamp: new Date(data.timestamp)
      };

    } catch (error: any) {
      console.error('L Error getting latest calculation:', error);
      return null;
    }
  }

  /**
   * Delete old calculations (GDPR compliance / data retention)
   * Note: Consider regulatory requirements before deleting audit records
   */
  async deleteOldCalculations(olderThanDays: number = 730): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await getSupabaseClient()
        .from('calculation_audit')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id') as { data: any[] | null; error: any };

      if (error) {
        console.error('L Failed to delete old calculations:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`=� Deleted ${deletedCount} calculations older than ${olderThanDays} days`);
      return deletedCount;

    } catch (error: any) {
      console.error('L Error deleting old calculations:', error);
      return 0;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Export singleton instance for use throughout the application
 */
export const calculationRepository = new CalculationRepository();
