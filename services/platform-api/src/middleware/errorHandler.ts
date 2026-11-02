import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Request validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
    return;
  }

  // General server errors
  console.error('[Platform API Error]:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred. Please contact support.' 
    : err.message || 'Internal server error';

  sendError(res, message, err.statusCode || 500, err.code || 'INTERNAL_SERVER_ERROR');
}
