// ABOUTME: Compliance API index endpoint with documentation and routing information
// ABOUTME: Provides API discovery and usage documentation for compliance operations
// ABOUTME: Integrates with EIP monitoring and health check patterns

import { NextApiRequest, NextApiResponse } from 'next';

interface ComplianceIndexResponse {
  success: boolean;
  data: {
    api_name: string;
    version: string;
    description: string;
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
        default?: string;
        example?: string;
      }>;
      use_case: string;
      rate_limit: string;
      cache_duration: string;
    }>;
    performance: {
      target_response_time: string;
      rate_limiting: string;
      caching_strategy: string;
    };
    integration_notes: string[];
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const response: ComplianceIndexResponse = {
    success: true,
    data: {
      api_name: 'EIP Compliance Operations API',
      version: '1.0.0',
      description: 'REST API layer for compliance validation operations supporting both CLI batch operations and dashboard polling',
      endpoints: [
        {
          path: '/api/compliance/stats',
          method: 'GET',
          description: 'Retrieves compliance validation statistics and trend data',
          parameters: [
            {
              name: 'hours_back',
              type: 'integer',
              required: false,
              description: 'Number of hours to look back for statistics (1-168)',
              default: '24',
              example: '24'
            },
            {
              name: 'processing_tier',
              type: 'string',
              required: false,
              description: 'Filter by processing tier (LIGHT, MEDIUM, HEAVY)',
              example: 'MEDIUM'
            },
            {
              name: 'include_trend',
              type: 'boolean',
              required: false,
              description: 'Include trend data in response',
              default: 'false',
              example: 'true'
            },
            {
              name: 'trend_days',
              type: 'integer',
              required: false,
              description: 'Number of days for trend analysis (1-30)',
              default: '7',
              example: '7'
            }
          ],
          use_case: 'Dashboard overview statistics, CLI batch monitoring',
          rate_limit: '100 requests/minute',
          cache_duration: '30 seconds'
        },
        {
          path: '/api/compliance/validations/recent',
          method: 'GET',
          description: 'Retrieves recent compliance validations for dashboard polling',
          parameters: [
            {
              name: 'page',
              type: 'integer',
              required: false,
              description: 'Page number for pagination',
              default: '1',
              example: '1'
            },
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: 'Number of results per page (1-100)',
              default: '20',
              example: '20'
            },
            {
              name: 'hours_back',
              type: 'integer',
              required: false,
              description: 'Hours to look back for recent validations (1-168)',
              default: '24',
              example: '24'
            },
            {
              name: 'status',
              type: 'string',
              required: false,
              description: 'Filter by compliance status (comma-separated)',
              example: 'compliant,non_compliant'
            },
            {
              name: 'processing_tier',
              type: 'string',
              required: false,
              description: 'Filter by processing tier',
              example: 'MEDIUM'
            },
            {
              name: 'authority_level',
              type: 'string',
              required: false,
              description: 'Filter by authority level (high, medium, low)',
              example: 'high'
            },
            {
              name: 'validation_level',
              type: 'string',
              required: false,
              description: 'Filter by validation level (standard, enhanced, comprehensive)',
              example: 'enhanced'
            },
            {
              name: 'sort_by',
              type: 'string',
              required: false,
              description: 'Sort field',
              default: 'validation_timestamp',
              example: 'compliance_score'
            },
            {
              name: 'sort_order',
              type: 'string',
              required: false,
              description: 'Sort order (asc, desc)',
              default: 'desc',
              example: 'desc'
            }
          ],
          use_case: 'Dashboard polling (30-60 second intervals), real-time monitoring',
          rate_limit: '200 requests/minute',
          cache_duration: '30 seconds'
        },
        {
          path: '/api/compliance/validations/by-artifact/[id]',
          method: 'GET',
          description: 'Retrieves detailed compliance information for a specific artifact',
          parameters: [
            {
              name: 'id',
              type: 'UUID',
              required: true,
              description: 'Artifact UUID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            {
              name: 'include_history',
              type: 'boolean',
              required: false,
              description: 'Include validation history',
              default: 'true',
              example: 'true'
            },
            {
              name: 'max_history_records',
              type: 'integer',
              required: false,
              description: 'Maximum number of history records (1-50)',
              default: '10',
              example: '10'
            }
          ],
          use_case: 'Artifact compliance drill-down, detailed analysis',
          rate_limit: '150 requests/minute',
          cache_duration: '2 minutes'
        },
        {
          path: '/api/compliance/violations/detail',
          method: 'GET',
          description: 'Retrieves detailed violation data with advanced filtering',
          parameters: [
            {
              name: 'page',
              type: 'integer',
              required: false,
              description: 'Page number for pagination',
              default: '1',
              example: '1'
            },
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: 'Number of results per page (1-200)',
              default: '50',
              example: '50'
            },
            {
              name: 'severity',
              type: 'string',
              required: false,
              description: 'Filter by severity (comma-separated: low,medium,high,critical)',
              example: 'high,critical'
            },
            {
              name: 'violation_type',
              type: 'string',
              required: false,
              description: 'Filter by violation type (comma-separated)',
              example: 'source_authority,content_compliance'
            },
            {
              name: 'domain',
              type: 'string',
              required: false,
              description: 'Filter by domain (comma-separated)',
              example: 'financial,educational'
            },
            {
              name: 'processing_tier',
              type: 'string',
              required: false,
              description: 'Filter by processing tier',
              example: 'HEAVY'
            },
            {
              name: 'authority_level',
              type: 'string',
              required: false,
              description: 'Filter by authority level',
              example: 'high'
            },
            {
              name: 'min_score_impact',
              type: 'integer',
              required: false,
              description: 'Minimum compliance score impact (0-100)',
              default: '0',
              example: '10'
            },
            {
              name: 'date_from',
              type: 'date',
              required: false,
              description: 'Start date for violation filtering (ISO 8601)',
              example: '2024-01-01T00:00:00Z'
            },
            {
              name: 'date_to',
              type: 'date',
              required: false,
              description: 'End date for violation filtering (ISO 8601)',
              example: '2024-01-31T23:59:59Z'
            },
            {
              name: 'artifact_id',
              type: 'UUID',
              required: false,
              description: 'Filter by specific artifact ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            }
          ],
          use_case: 'CLI batch operations, violation analysis, compliance reporting',
          rate_limit: '100 requests/minute',
          cache_duration: '1 minute'
        }
      ],
      performance: {
        target_response_time: '< 500ms for optimized queries',
        rate_limiting: 'Per-client IP-based limiting with burst capacity',
        caching_strategy: 'Multi-tier caching with ETag support and stale-while-revalidate'
      },
      integration_notes: [
        'All endpoints follow consistent response format with success/data/error structure',
        'Database queries leverage optimized indexes from migration 004_add_compliance_validations_table.sql',
        'Integration with existing Supabase client configuration from lib_supabase/db/supabase-client.ts',
        'Rate limiting patterns follow existing API endpoints in pages/api/',
        'Caching headers optimized for both dashboard polling and CLI batch operations',
        'Error handling includes detailed metadata for debugging and monitoring',
        'All timestamps in ISO 8601 format with timezone information',
        'JSON response structure compatible with existing EIP monitoring systems'
      ]
    }
  };

  // Cache API documentation for longer period
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json(response);
}
