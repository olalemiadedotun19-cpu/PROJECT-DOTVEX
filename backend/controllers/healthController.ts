import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { getDatabase } from '../database';
import { config } from '../config';

export function healthHandler(_req: Request, res: Response) {
  let dbConnected = true;
  try {
    const db = getDatabase();
    db.prepare('SELECT 1').get();
  } catch {
    dbConnected = false;
  }

  const providerAvailable = aiService.isModelAvailable();
  const isProd = config.nodeEnv === 'production';

  const status = providerAvailable && dbConnected ? 'healthy' : 'degraded';

  res.status(providerAvailable ? 200 : 503).json({
    status,
    service: 'DOTVEX',
    provider: aiService.getProviderName(),
    modelAvailable: providerAvailable,
    database: dbConnected ? 'connected' : 'disconnected',
    authentication: config.apiKey ? 'enabled' : 'disabled',
  });
}
