import { Request, Response, NextFunction } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

export function requestSizeLimiter(maxSizeMB: number = 10): (req: Request, _res: Response, next: NextFunction) => void {
  const maxSize = maxSizeMB * 1024 * 1024;
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('content-length');
    if (contentLength && Number(contentLength) > maxSize) {
      res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body exceeds maximum size of ${maxSizeMB}MB.`,
        },
      });
      return;
    }
    next();
  };
}
