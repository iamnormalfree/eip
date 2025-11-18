// ABOUTME: Health check API endpoint for EIP Orchestrator monitoring
// ABOUTME: Provides basic health status and system information

import { NextApiRequest, NextApiResponse } from 'next';
import { getHealthEndpoint } from '../../orchestrator/monitoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthHandler = getHealthEndpoint();
  await healthHandler(req, res);
}