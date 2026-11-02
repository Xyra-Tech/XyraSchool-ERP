import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
    return;
  }

  console.error('[School API Error]:', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred while processing the request'
    : err.message || 'Internal server error';

  sendError(res, message, err.statusCode || 500, err.code || 'INTERNAL_SERVER_ERROR');
}
