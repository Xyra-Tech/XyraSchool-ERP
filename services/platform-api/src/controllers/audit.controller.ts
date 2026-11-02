// ==============================================================================
// XyraTech Control Center — Platform Audit Logs Controller
// ==============================================================================

import { Request, Response } from 'express';
import { getPlatformPrisma } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
  const skip = (page - 1) * pageSize;

  const action = req.query.action as string | undefined;
  const resourceType = req.query.resourceType as string | undefined;
  const actorEmail = req.query.actorEmail as string | undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;

  const where: any = {};
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (resourceType) where.resourceType = resourceType;
  if (actorEmail) where.actorEmail = { contains: actorEmail, mode: 'insensitive' };
  if (fromDate || toDate) {
    where.timestamp = {};
    if (fromDate) where.timestamp.gte = new Date(fromDate);
    if (toDate) where.timestamp.lte = new Date(toDate);
  }

  const [totalRecords, logs] = await Promise.all([
    platformDb.platformAuditLog.count({ where }),
    platformDb.platformAuditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { timestamp: 'desc' },
      include: {
        platformUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  sendSuccess(res, logs, 'Audit logs retrieved', 200, {
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

export async function exportAuditLogs(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const logs = await platformDb.platformAuditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });

  sendSuccess(res, logs, 'Audit logs export generated');
}
