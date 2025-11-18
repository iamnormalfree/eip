// ABOUTME: Prometheus metrics API endpoint for EIP Orchestrator monitoring
// ABOUTME: Exposes application metrics in Prometheus-compatible format

import { NextApiRequest, NextApiResponse } from 'next';
import { getMetricsEndpoint } from '../../orchestrator/monitoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const metricsHandler = getMetricsEndpoint();
  await metricsHandler(req, res);
}