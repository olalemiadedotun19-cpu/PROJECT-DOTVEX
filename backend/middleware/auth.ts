import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

const API_KEY_HEADER = 'x-api-key';

export function apiKeyAuth(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!config.apiKey) {
    next();
    return;
  }

  const request = _req as Request;
  const response = _res as Response;

  const providedKey = request.headers[API_KEY_HEADER] as string | undefined;

  if (!providedKey) {
    logger.warn('Authentication failed: missing API key', {
      ip: request.ip,
      path: request.path,
      method: request.method,
    });
    response.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key is required.',
      },
    });
    return;
  }

  if (providedKey !== config.apiKey) {
    logger.warn('Authentication failed: invalid API key', {
      ip: request.ip,
      path: request.path,
      method: request.method,
    });
    response.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key.',
      },
    });
    return;
  }

  next();
}

export function conditionalApiKeyAuth(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!config.apiKey) {
    next();
    return;
  }

  apiKeyAuth(_req, _res, next);
}
