import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '@xyratech/shared-types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode = 200,
  meta?: { pagination?: PaginationMeta; [key: string]: unknown }
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (res.locals.requestId as string) || undefined,
      ...meta,
    },
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = 'BAD_REQUEST',
  details?: unknown
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details,
      requestId: (res.locals.requestId as string) || undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (res.locals.requestId as string) || undefined,
    },
  };
  return res.status(statusCode).json(response);
}
