// ABOUTME: Compliance violations detail API endpoint for filtering and analysis
// ABOUTME: Provides detailed violation data with advanced filtering capabilities
// ABOUTME: Supports CLI batch operations and dashboard drill-down analysis

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib_supabase/db/supabase-client';

interface ViolationsDetailResponse {
  success: boolean;
  data?: {
    violations: Array<{
      validation_id: string;
      job_id: string;
      artifact_id?: string;
      violation_type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation?: string;
      evidence_reference?: string;
      rule_id?: string;
      domain?: string;
      compliance_score_impact: number;
      validation_timestamp: string;
      processing_tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
      authority_level: 'high' | 'medium' | 'low';
      job_brief?: string;
      artifact_brief?: string;
    }>;
    summary: {
      total_violations: number;
      by_severity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
      by_type: Record<string, number>;
      by_domain: Record<string, number>;
      average_score_impact: number;
      most_common_violation: string;
      compliance_rate: number;
    };
    pagination: {
      page: number;
      limit: number;
      total_count: number;
      has_more: boolean;
    };
  };
  error?: string;
  metadata?: {
    query_time_ms: number;
    filters_applied: {
      severity?: string[];
      violation_type?: string[];
      domain?: string[];
      processing_tier?: string;
      authority_level?: string;
      min_score_impact?: number;
      date_from?: string;
      date_to?: string;
      artifact_id?: string;
    };
  };
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(req: NextApiRequest): boolean {
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const clientData = requestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  clientData.count++;
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    } as ViolationsDetailResponse);
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded'
    } as ViolationsDetailResponse);
  }

  try {
    // Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit as string) || 50));
    
    const severityFilter = req.query.severity as string;
    const violationTypeFilter = req.query.violation_type as string;
    const domainFilter = req.query.domain as string;
    const processingTier = req.query.processing_tier as string;
    const authorityLevel = req.query.authority_level as string;
    const minScoreImpact = req.query.min_score_impact as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const artifactId = req.query.artifact_id as string;

    // Validate filters
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const validTiers = ['LIGHT', 'MEDIUM', 'HEAVY'];
    const validAuthorities = ['high', 'medium', 'low'];

    const severityArray = severityFilter ? severityFilter.split(',').map(s => s.trim()).filter(s => validSeverities.includes(s)) : [];
    const violationTypeArray = violationTypeFilter ? violationTypeFilter.split(',').map(s => s.trim()) : [];
    const domainArray = domainFilter ? domainFilter.split(',').map(s => s.trim()) : [];

    if (processingTier && !validTiers.includes(processingTier.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid processing_tier. Must be one of: LIGHT, MEDIUM, HEAVY'
      } as ViolationsDetailResponse);
    }
    if (authorityLevel && !validAuthorities.includes(authorityLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid authority_level. Must be one of: high, medium, low'
      } as ViolationsDetailResponse);
    }

    const minScoreImpactValue = minScoreImpact ? Math.max(0, Math.min(100, parseInt(minScoreImpact))) : 0;
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    // Build base query for violations using JSONB operators
    let query = supabase
      .from('compliance_validation_summary')
      .select('id, job_id, artifact_id, compliance_report, validation_timestamp, processing_tier, authority_level, job_brief, artifact_brief', { count: 'exact' })
      .not('compliance_report', 'is', null)
      .not('violations_count', 'eq', 0);

    // Apply filters
    if (severityArray.length > 0) {
      // Use JSONB path queries for severity filtering
      const severityConditions = severityArray.map(severity => `compliance_report->'violations' @> '[{\"severity\": \"${severity}\"}]'`);
      query = query.or(severityConditions.join(', '));
    }

    if (processingTier) {
      query = query.eq('processing_tier', processingTier.toUpperCase());
    }
    if (authorityLevel) {
      query = query.eq('authority_level', authorityLevel);
    }
    if (artifactId) {
      query = query.eq('artifact_id', artifactId);
    }

    // Date range filtering
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
        query = query.gte('validation_timestamp', fromDate.toISOString());
      }
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
        query = query.lte('validation_timestamp', toDate.toISOString());
      }
    }

    // Apply pagination
    query = query.order('validation_timestamp', { ascending: false }).range(offset, offset + limit - 1);

    const { data: validations, error: validationError, count } = await query;

    if (validationError) {
      console.error('Database error fetching validations:', validationError);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve violation data',
        metadata: {
          query_time_ms: Date.now() - startTime,
          filters_applied: {
            severity: severityArray,
            violation_type: violationTypeArray,
            domain: domainArray,
            processing_tier: processingTier,
            authority_level: authorityLevel,
            min_score_impact: minScoreImpactValue,
            date_from: dateFrom,
            date_to: dateTo,
            artifact_id: artifactId
          }
        }
      } as ViolationsDetailResponse);
    }

    // Extract and process violations from compliance reports
    let allViolations: any[] = [];
    const summary = {
      total_violations: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_type: {} as Record<string, number>,
      by_domain: {} as Record<string, number>,
      average_score_impact: 0,
      most_common_violation: '',
      compliance_rate: 0
    };

    if (validations) {
      for (const validation of validations) {
        const report = validation.compliance_report;
        if (report && report.violations && Array.isArray(report.violations)) {
          const violations = report.violations
            .filter((violation: any) => {
              // Apply additional filters
              if (violationTypeArray.length > 0 && !violationTypeArray.includes(violation.type)) {
                return false;
              }
              if (domainArray.length > 0 && !domainArray.includes(violation.domain)) {
                return false;
              }
              if (violation.severity && !severityArray.includes(violation.severity)) {
                return false;
              }
              if (violation.score_impact && violation.score_impact < minScoreImpactValue) {
                return false;
              }
              return true;
            })
            .map((violation: any) => ({
              validation_id: validation.id,
              job_id: validation.job_id,
              artifact_id: validation.artifact_id,
              violation_type: violation.type || 'unknown',
              severity: violation.severity || 'medium',
              description: violation.description || 'No description available',
              recommendation: violation.recommendation,
              evidence_reference: violation.evidence_reference,
              rule_id: violation.rule_id,
              domain: violation.domain,
              compliance_score_impact: violation.score_impact || 0,
              validation_timestamp: validation.validation_timestamp,
              processing_tier: validation.processing_tier,
              authority_level: validation.authority_level,
              job_brief: validation.job_brief,
              artifact_brief: validation.artifact_brief
            }));

          allViolations.push(...violations);

          // Update summary statistics
          for (const violation of violations) {
            summary.total_violations++;
            
            const severity = violation.severity as keyof typeof summary.by_severity;
            if (summary.by_severity[severity] !== undefined) {
              summary.by_severity[severity]++;
            }

            const type = violation.violation_type;
            summary.by_type[type] = (summary.by_type[type] || 0) + 1;

            const domain = violation.domain || 'unknown';
            summary.by_domain[domain] = (summary.by_domain[domain] || 0) + 1;

            summary.average_score_impact += violation.compliance_score_impact;
          }
        }
      }
    }

    // Calculate summary metrics
    if (summary.total_violations > 0) {
      summary.average_score_impact = summary.average_score_impact / summary.total_violations;
      
      // Find most common violation
      let maxCount = 0;
      for (const [type, count] of Object.entries(summary.by_type)) {
        if (count > maxCount) {
          maxCount = count;
          summary.most_common_violation = type;
        }
      }
    }

    // Calculate compliance rate (for the filtered dataset)
    const totalValidations = count || 0;
    const validValidations = allViolations.length > 0 ? 
      validations?.filter(v => {
        const report = v.compliance_report;
        return report && report.status === 'compliant';
      }).length || 0 : 0;
    
    summary.compliance_rate = totalValidations > 0 ? (validValidations / totalValidations) * 100 : 0;

    // Apply pagination to violations (since we need to extract them from reports)
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedViolations = allViolations.slice(startIndex, endIndex);

    const response: ViolationsDetailResponse = {
      success: true,
      data: {
        violations: paginatedViolations,
        summary: summary,
        pagination: {
          page: page,
          limit: limit,
          total_count: allViolations.length,
          has_more: endIndex < allViolations.length
        }
      },
      metadata: {
        query_time_ms: Date.now() - startTime,
        filters_applied: {
          severity: severityArray,
          violation_type: violationTypeArray,
          domain: domainArray,
          processing_tier: processingTier,
          authority_level: authorityLevel,
          min_score_impact: minScoreImpactValue,
          date_from: dateFrom,
          date_to: dateTo,
          artifact_id: artifactId
        }
      }
    };

    // Cache violation data for shorter period due to detail level
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=180');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in violations detail endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        query_time_ms: Date.now() - startTime,
        filters_applied: {
          min_score_impact: parseInt(req.query.min_score_impact as string) || 0
        }
      }
    } as ViolationsDetailResponse);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
    }
  }
}, 10 * 60 * 1000);
