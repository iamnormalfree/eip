// ABOUTME: Compliance statistics API endpoint for EIP dashboard and CLI operations
// ABOUTME: Provides overview statistics for compliance validation operations
// ABOUTME: Integrates with new compliance database schema for efficient querying

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib_supabase/db/supabase-client';

interface ComplianceStatsResponse {
  success: boolean;
  data?: {
    total_validations: number;
    compliant_count: number;
    non_compliant_count: number;
    pending_count: number;
    error_count: number;
    average_score: number;
    average_processing_time_ms: number;
    high_authority_count: number;
    medium_authority_count: number;
    low_authority_count: number;
    trend_data?: Array<{
      time_bucket: string;
      total_validations: number;
      compliant_count: number;
      non_compliant_count: number;
      average_score: number;
      average_processing_time_ms: number;
    }>;
  };
  error?: string;
  metadata?: {
    query_time_ms: number;
    cache_hit: boolean;
    parameters: {
      hours_back: number;
      processing_tier?: string;
    };
  };
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getClientId(req: NextApiRequest): string {
  return (req as any).ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
}

function checkRateLimit(req: NextApiRequest): boolean {
  const clientId = getClientId(req);
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

const statsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCachedData(key: string, ttl: number = 30000): any | null {
  const cached = statsCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any, ttl: number = 30000): void {
  statsCache.set(key, { data, timestamp: Date.now(), ttl });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    } as ComplianceStatsResponse);
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded'
    } as ComplianceStatsResponse);
  }

  try {
    const hoursBack = Math.max(1, Math.min(168, parseInt(req.query.hours_back as string) || 24));
    const processingTier = req.query.processing_tier as string;
    const includeTrend = req.query.include_trend === 'true';
    const trendDays = Math.max(1, Math.min(30, parseInt(req.query.trend_days as string) || 7));

    const validTiers = ['LIGHT', 'MEDIUM', 'HEAVY'];
    if (processingTier && !validTiers.includes(processingTier.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid processing_tier. Must be one of: LIGHT, MEDIUM, HEAVY'
      } as ComplianceStatsResponse);
    }

    const cacheKey = 'compliance_stats_' + hoursBack + '_' + (processingTier || 'all');
    const cachedStats = getCachedData(cacheKey, 30000);
    let isCacheHit = !!cachedStats;

    let statsData;
    if (cachedStats) {
      statsData = cachedStats;
    } else {
      const supabase = getSupabaseAdmin();

      // @ts-ignore - Supabase RPC call with dynamic parameters
      const { data, error } = await supabase
        .rpc('get_compliance_validation_statistics', {
          p_hours_back: hoursBack,
          p_processing_tier: processingTier ? processingTier.toUpperCase() : null
        });

      if (error) {
        console.error('Database error in compliance stats:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve compliance statistics',
          metadata: {
            query_time_ms: Date.now() - startTime,
            cache_hit: false,
            parameters: { hours_back: hoursBack, processing_tier: processingTier }
          }
        } as ComplianceStatsResponse);
      }

      statsData = data && Array.isArray(data) && data.length > 0 ? data[0] : {};
      setCachedData(cacheKey, statsData, 30000);
    }

    let trendData;
    if (includeTrend) {
      const trendCacheKey = 'compliance_trend_' + trendDays;
      const cachedTrend = getCachedData(trendCacheKey, 60000);
      
      if (cachedTrend) {
        trendData = cachedTrend;
      } else {
        const supabase = getSupabaseAdmin();
        // @ts-ignore - Supabase RPC call with dynamic parameters
        const { data: trendResult, error: trendError } = await supabase
          .rpc('get_compliance_trend_data', {
            p_days_back: trendDays,
            p_group_by_hour: trendDays <= 3
          });

        if (!trendError && trendResult) {
          trendData = trendResult;
          setCachedData(trendCacheKey, trendData, 60000);
        }
      }
    }

    const response: ComplianceStatsResponse = {
      success: true,
      data: {
        total_validations: parseInt(statsData.total_validations) || 0,
        compliant_count: parseInt(statsData.compliant_count) || 0,
        non_compliant_count: parseInt(statsData.non_compliant_count) || 0,
        pending_count: parseInt(statsData.pending_count) || 0,
        error_count: parseInt(statsData.error_count) || 0,
        average_score: parseFloat(statsData.average_score) || 0,
        average_processing_time_ms: parseFloat(statsData.average_processing_time_ms) || 0,
        high_authority_count: parseInt(statsData.high_authority_count) || 0,
        medium_authority_count: parseInt(statsData.medium_authority_count) || 0,
        low_authority_count: parseInt(statsData.low_authority_count) || 0
      }
    };

    if (trendData) {
      response.data.trend_data = trendData;
    }

    response.metadata = {
      query_time_ms: Date.now() - startTime,
      cache_hit: isCacheHit,
      parameters: {
        hours_back: hoursBack,
        processing_tier: processingTier
      }
    };

    res.setHeader('Cache-Control', 'public, max-age=30');
    res.setHeader('ETag', JSON.stringify(response.data));

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === JSON.stringify(response.data)) {
      return res.status(304).end();
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in compliance stats endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        query_time_ms: Date.now() - startTime,
        cache_hit: false,
        parameters: {
          hours_back: parseInt(req.query.hours_back as string) || 24,
          processing_tier: req.query.processing_tier as string
        }
      }
    } as ComplianceStatsResponse);
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(requestCounts.entries());
  for (let i = 0; i < entries.length; i++) {
    const [clientId, data] = entries[i];
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
    }
  }
}, 10 * 60 * 1000);
