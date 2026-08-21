import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/api';

const isProd = process.env.NODE_ENV === 'production';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const errAny = err as any;

  if (isProd) {
    console.error(`[DOTVEX] ${errAny.name || 'Error'}:`, errAny.message || err.message);
  } else {
    console.error('[DOTVEX] Unhandled error:', err);
  }

  const errorResponse: ErrorResponse = {
    error: {
      code: errAny.code || 'INTERNAL_ERROR',
      message: isProd
        ? 'An internal server error occurred.'
        : err.message || 'An internal server error occurred.',
    },
  };

  res.status(500).json(errorResponse);
}
