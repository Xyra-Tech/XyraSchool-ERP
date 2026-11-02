import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';

export async function checkHealth(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  let dbStatus = 'CONNECTED';

  try {
    await req.schoolDb.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'DISCONNECTED';
    sendError(res, 'School database connection failed', 503, 'SERVICE_UNHEALTHY', {
      database: dbStatus,
      latencyMs: Date.now() - startTime,
    });
    return;
  }

  sendSuccess(res, {
    status: 'HEALTHY',
    service: 'xyratech-school-api',
    version: '1.0.0',
    tenant: req.schoolTenant?.code || 'DEFAULT',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  }, 'School service healthy');
}
