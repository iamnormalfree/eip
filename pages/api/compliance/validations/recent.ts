// ABOUTME: Recent compliance validations API endpoint for dashboard polling
// ABOUTME: Provides recent validation data optimized for 30-60 second polling cycles
// ABOUTME: Supports filtering and pagination for efficient dashboard updates

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../../lib_supabase/db/supabase-client';

interface RecentValidationsResponse {
  success: boolean;
  data?: {
    validations: Array<{
      id: string;
      job_id: string;
      artifact_id?: string;
      compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'error';
      compliance_score: number;
      violations_count: number;
      authority_level: 'high' | 'medium' | 'low';
      processing_tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
      validation_timestamp: string;
      processing_time_ms: number;
      validation_level: 'standard' | 'enhanced' | 'comprehensive';
      job_brief?: string;
      artifact_brief?: string;
      artifact_status?: string;
      quality_tier?: string;
      freshness_category?: string;
    }>;
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
      status?: string[];
      processing_tier?: string;
      authority_level?: string;
      hours_back: number;
      validation_level?: string;
    };
  };
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 200; // Higher limit for polling

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
    } as RecentValidationsResponse);
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded'
    } as RecentValidationsResponse);
  }

  try {
    // Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const hoursBack = Math.max(1, Math.min(168, parseInt(req.query.hours_back as string) || 24));
    
    const statusFilter = req.query.status as string;
    const processingTier = req.query.processing_tier as string;
    const authorityLevel = req.query.authority_level as string;
    const validationLevel = req.query.validation_level as string;
    const sortBy = req.query.sort_by as string || 'validation_timestamp';
    const sortOrder = req.query.sort_order as string || 'desc';

    // Validate filters
    const validStatuses = ['compliant', 'non_compliant', 'pending', 'error'];
    const validTiers = ['LIGHT', 'MEDIUM', 'HEAVY'];
    const validAuthorities = ['high', 'medium', 'low'];
    const validLevels = ['standard', 'enhanced', 'comprehensive'];
    const validSortFields = ['validation_timestamp', 'compliance_score', 'processing_time_ms', 'violations_count'];
    const validSortOrders = ['asc', 'desc'];

    const statusArray = statusFilter ? statusFilter.split(',').filter(s => validStatuses.includes(s.trim())) : [];
    if (processingTier && !validTiers.includes(processingTier.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid processing_tier. Must be one of: LIGHT, MEDIUM, HEAVY'
      } as RecentValidationsResponse);
    }
    if (authorityLevel && !validAuthorities.includes(authorityLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid authority_level. Must be one of: high, medium, low'
      } as RecentValidationsResponse);
    }
    if (validationLevel && !validLevels.includes(validationLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid validation_level. Must be one of: standard, enhanced, comprehensive'
      } as RecentValidationsResponse);
    }
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort_by field'
      } as RecentValidationsResponse);
    }
    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort_order. Must be asc or desc'
      } as RecentValidationsResponse);
    }

    const supabase = getSupabaseAdmin();
    const offset = (page - 1) * limit;

    // Build query using the compliance_validation_summary view
    let query = supabase
      .from('compliance_validation_summary')
      .select('*', { count: 'exact' })
      .gte('validation_timestamp', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (statusArray.length > 0) {
      query = query.in('compliance_status', statusArray);
    }
    if (processingTier) {
      query = query.eq('processing_tier', processingTier.toUpperCase());
    }
    if (authorityLevel) {
      query = query.eq('authority_level', authorityLevel);
    }
    if (validationLevel) {
      query = query.eq('validation_level', validationLevel);
    }

    const { data: validations, error, count } = await query;

    if (error) {
      console.error('Database error in recent validations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve recent validations',
        metadata: {
          query_time_ms: Date.now() - startTime,
          filters_applied: {
            status: statusArray,
            processing_tier: processingTier,
            authority_level: authorityLevel,
            hours_back: hoursBack,
            validation_level: validationLevel
          }
        }
      } as RecentValidationsResponse);
    }

    const response: RecentValidationsResponse = {
      success: true,
      data: {
        validations: validations || [],
        pagination: {
          page: page,
          limit: limit,
          total_count: count || 0,
          has_more: (offset + (validations?.length || 0)) < (count || 0)
        }
      },
      metadata: {
        query_time_ms: Date.now() - startTime,
        filters_applied: {
          status: statusArray,
          processing_tier: processingTier,
          authority_level: authorityLevel,
          hours_back: hoursBack,
          validation_level: validationLevel
        }
      }
    };

    // Add caching headers suitable for polling
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.setHeader('ETag', JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));

    // Check for conditional requests
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.includes(JSON.stringify(response.data))) {
      return res.status(304).end();
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in recent validations endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        query_time_ms: Date.now() - startTime,
        filters_applied: {
          hours_back: parseInt(req.query.hours_back as string) || 24
        }
      }
    } as RecentValidationsResponse);
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
