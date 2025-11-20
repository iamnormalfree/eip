// ABOUTME: Individual artifact compliance details API endpoint
// ABOUTME: Provides detailed compliance information for specific artifacts
// ABOUTME: Supports compliance history and detailed violation reporting

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../../lib_supabase/db/supabase-client';

interface ArtifactComplianceResponse {
  success: boolean;
  data?: {
    artifact_id: string;
    current_validation?: {
      id: string;
      job_id: string;
      compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'error';
      compliance_score: number;
      violations_count: number;
      authority_level: 'high' | 'medium' | 'low';
      processing_tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
      validation_level: 'standard' | 'enhanced' | 'comprehensive';
      validation_timestamp: string;
      processing_time_ms: number;
      evidence_summary: any;
      compliance_report: any;
      job_brief?: string;
      artifact_brief?: string;
      artifact_status?: string;
      quality_tier?: string;
      freshness_category?: string;
    };
    validation_history: Array<{
      validation_id: string;
      job_id: string;
      compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'error';
      compliance_score: number;
      violations_count: number;
      authority_level: 'high' | 'medium' | 'low';
      validation_level: 'standard' | 'enhanced' | 'comprehensive';
      validation_timestamp: string;
      processing_time_ms: number;
    }>;
    compliance_trends: {
      total_validations: number;
      average_score: number;
      compliant_percentage: number;
      score_trend: 'improving' | 'declining' | 'stable';
      last_updated: string;
    };
  };
  error?: string;
  metadata?: {
    query_time_ms: number;
    parameters: {
      artifact_id: string;
      include_history: boolean;
      max_history_records: number;
    };
  };
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 150;

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

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    } as ArtifactComplianceResponse);
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded'
    } as ArtifactComplianceResponse);
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Artifact ID is required'
      } as ArtifactComplianceResponse);
    }

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid artifact ID format'
      } as ArtifactComplianceResponse);
    }

    const includeHistory = req.query.include_history !== 'false';
    const maxHistoryRecords = Math.max(1, Math.min(50, parseInt(req.query.max_history_records as string) || 10));

    const supabase = getSupabaseAdmin();

    // Get current validation from the summary view
    const { data: currentValidation, error: currentError } = await supabase
      .from('compliance_validation_summary')
      .select('*')
      .eq('artifact_id', id)
      .order('validation_timestamp', { ascending: false })
      .limit(1)
      .single();

    let validationHistory = [];
    if (includeHistory) {
      // Get validation history using the database function
      const { data: historyData, error: historyError } = await supabase
        .rpc('get_artifact_compliance_history', {
          p_artifact_id: id,
          p_max_records: maxHistoryRecords
        });

      if (!historyError && historyData) {
        validationHistory = historyData.map((record: any) => ({
          validation_id: record.validation_id,
          job_id: record.job_id,
          compliance_status: record.compliance_status,
          compliance_score: record.compliance_score,
          violations_count: record.violations_count,
          authority_level: record.authority_level,
          validation_level: record.validation_level,
          validation_timestamp: record.validation_timestamp,
          processing_time_ms: record.processing_time_ms
        }));
      } else if (historyError) {
        console.error('Error fetching validation history:', historyError);
      }
    }

    // Calculate compliance trends
    let complianceTrends = {
      total_validations: validationHistory.length + (currentValidation ? 1 : 0),
      average_score: 0,
      compliant_percentage: 0,
      score_trend: 'stable' as 'improving' | 'declining' | 'stable',
      last_updated: new Date().toISOString()
    };

    if (validationHistory.length > 0) {
      const scores = validationHistory.map(h => h.compliance_score);
      if (currentValidation) {
        scores.push(currentValidation.compliance_score);
      }
      
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      complianceTrends.average_score = totalScore / scores.length;
      
      const compliantCount = validationHistory.filter(h => h.compliance_status === 'compliant').length +
                           (currentValidation?.compliance_status === 'compliant' ? 1 : 0);
      complianceTrends.compliant_percentage = (compliantCount / scores.length) * 100;

      // Calculate trend (simple linear regression on last 5 scores)
      if (scores.length >= 3) {
        const recentScores = scores.slice(-5);
        const n = recentScores.length;
        const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
        const sumY = recentScores.reduce((sum, score) => sum + score, 0);
        const sumXY = recentScores.reduce((sum, score, index) => sum + index * score, 0);
        const sumX2 = recentScores.reduce((sum, _, index) => sum + index * index, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        if (slope > 1) {
          complianceTrends.score_trend = 'improving';
        } else if (slope < -1) {
          complianceTrends.score_trend = 'declining';
        }
      }
    }

    const response: ArtifactComplianceResponse = {
      success: true,
      data: {
        artifact_id: id,
        current_validation: currentValidation || undefined,
        validation_history: validationHistory,
        compliance_trends: complianceTrends
      },
      metadata: {
        query_time_ms: Date.now() - startTime,
        parameters: {
          artifact_id: id,
          include_history: includeHistory,
          max_history_records: maxHistoryRecords
        }
      }
    };

    // Cache individual artifact data for longer than aggregate stats
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    res.setHeader('ETag', JSON.stringify({
      current_validation: response.data.current_validation,
      history_count: response.data.validation_history.length,
      timestamp: Date.now()
    }));

    // Check for conditional requests
    const ifNoneMatch = req.headers['if-none-match'];
    const etagValue = JSON.stringify({
      current_validation: response.data.current_validation,
      history_count: response.data.validation_history.length,
      timestamp: Date.now()
    });
    
    if (ifNoneMatch === etagValue) {
      return res.status(304).end();
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in artifact compliance endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        query_time_ms: Date.now() - startTime,
        parameters: {
          artifact_id: req.query.id as string || 'unknown',
          include_history: req.query.include_history !== 'false',
          max_history_records: parseInt(req.query.max_history_records as string) || 10
        }
      }
    } as ArtifactComplianceResponse);
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
