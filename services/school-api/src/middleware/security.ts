import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { sendError } from '../utils/response';

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.locals.requestId = reqId;
  res.setHeader('x-request-id', reqId);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  next();
}

interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

export function rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = rateLimitMap.get(ip);

    if (!bucket || now > bucket.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      return sendError(
        res,
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    return next();
  };
}
