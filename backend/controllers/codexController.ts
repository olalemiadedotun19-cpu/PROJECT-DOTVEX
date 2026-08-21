import { Request, Response } from 'express';
import { ErrorResponse } from '../types/api';

export function codexHandler(_req: Request, res: Response) {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Code execution analysis is not yet available. The AI provider is not configured.',
    },
  };
  res.status(501).json(errorResponse);
}
