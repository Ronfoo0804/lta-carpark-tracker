import type { Request, Response } from 'express';

/**
 * Serverless Health Check Handler
 * Endpoint: /api/health
 */
export default async function handler(req: Request, res: Response) {
  const isKeyConfigured = Boolean(
    process.env.LTA_DATAMALL_KEY ||
    process.env.DATAMALL_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'ok',
    service: 'Singapore Carpark Availability API',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ltaDataMallKeyConfigured: isKeyConfigured,
    endpoints: {
      health: '/api/health',
      carparkAvailability: '/api/carparkavailability',
    },
    message: isKeyConfigured
      ? 'LTA DataMall AccountKey is configured and ready to query.'
      : 'LTA DataMall AccountKey is not configured yet. Set LTA_DATAMALL_KEY in your environment variables or .env file.',
  });
}
