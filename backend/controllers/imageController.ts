import { Request, Response } from 'express';
import { ErrorResponse } from '../types/api';

export function generateImageHandler(_req: Request, res: Response) {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Image generation is not yet available. The AI provider is not configured.',
    },
  };
  res.status(501).json(errorResponse);
}
