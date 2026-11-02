import { Request, Response } from 'express';
import { getPlatformPrisma } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function checkHealth(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  let dbStatus = 'CONNECTED';

  try {
    const db = getPlatformPrisma();
    await db.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'DISCONNECTED';
    sendError(res, 'Database connectivity failure', 503, 'SERVICE_UNHEALTHY', {
      database: dbStatus,
      uptime: process.uptime(),
      latencyMs: Date.now() - startTime,
    });
    return;
  }

  sendSuccess(res, {
    status: 'HEALTHY',
    service: 'xyratech-platform-api',
    version: '1.0.0',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  }, 'Service healthy');
}
