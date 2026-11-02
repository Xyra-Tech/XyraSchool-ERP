import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
  const skip = (page - 1) * pageSize;

  const action = req.query.action as string | undefined;
  const resourceType = req.query.resourceType as string | undefined;

  const where: any = {};
  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;

  const [totalRecords, logs] = await Promise.all([
    req.schoolDb.auditLog.count({ where }),
    req.schoolDb.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  sendSuccess(res, logs, 'School audit logs retrieved successfully', 200, {
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
