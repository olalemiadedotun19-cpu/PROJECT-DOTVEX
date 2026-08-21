import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  chat: { windowMs: 60_000, max: 30 },
  memory: { windowMs: 60_000, max: 60 },
  default: { windowMs: 60_000, max: 120 },
};

export function rateLimit(category: 'chat' | 'memory' | 'default' = 'default') {
  const config = RATE_LIMITS[category];

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = { count: 1, resetTime: now + config.windowMs };
    } else {
      store[key].count++;
    }

    if (store[key].count > config.max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded.',
        },
      });
      res.setHeader('Retry-After', String(retryAfter));
      return;
    }

    next();
  };
}

export function cleanupOldRateLimits(): void {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (now - store[key].resetTime > 300_000) {
      delete store[key];
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldRateLimits, 60_000);
}
