// ==============================================================================
// XyraTech Control Center — Deployments Orchestration Controller
// ==============================================================================

import { Request, Response } from 'express';
import { TriggerDeploymentSchema, DeploymentMaintenanceSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';
import { deploymentAgent } from '../services/deploymentAgent.service';

export async function listDeployments(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const status = req.query.status as string;
  const environment = req.query.environment as string;

  const where: any = {};
  if (status) where.status = status;
  if (environment) where.environment = environment;

  const [totalRecords, deployments] = await Promise.all([
    platformDb.schoolDeployment.count({ where }),
    platformDb.schoolDeployment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        school: {
          select: { id: true, code: true, name: true, status: true, domain: true },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  sendSuccess(res, deployments, 'Deployments retrieved', 200, {
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      hasNextPage: page * pageSize < totalRecords,
      hasPreviousPage: page > 1,
    },
  });
}

export async function getDeploymentById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const deployment = await platformDb.schoolDeployment.findUnique({
    where: { id },
    include: {
      school: true,
      jobs: { orderBy: { createdAt: 'desc' }, take: 20 },
      events: { orderBy: { createdAt: 'desc' }, take: 50 },
      healthChecks: { orderBy: { checkedAt: 'desc' }, take: 10 },
    },
  });

  if (!deployment) {
    sendError(res, 'Deployment not found', 404, 'NOT_FOUND');
    return;
  }

  // Never return raw decrypted database URLs to the client!
  const sanitized = {
    ...deployment,
    databaseUrlEncrypted: '[CONFIGURED_AND_ENCRYPTED]',
  };

  sendSuccess(res, sanitized, 'Deployment details retrieved');
}

export async function triggerDeploymentAction(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = TriggerDeploymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { targetVersion, parameters } = parseResult.data;
  const commandType = (req.body.commandType || 'UPDATE') as any;

  const platformDb = getPlatformPrisma();
  const deployment = await platformDb.schoolDeployment.findUnique({
    where: { id },
  });

  if (!deployment) {
    sendError(res, 'Deployment not found', 404, 'NOT_FOUND');
    return;
  }

  const result = await deploymentAgent.executeCommand({
    schoolId: deployment.schoolId,
    deploymentId: deployment.id,
    commandType,
    targetVersion,
    parameters,
    initiatedById: req.user?.id,
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: `DEPLOYMENT_${commandType}`,
    resourceType: 'SCHOOL_DEPLOYMENT',
    resourceId: id,
    outcome: result.status === 'COMPLETED' ? 'SUCCESS' : 'FAILURE',
    details: { resultStatus: result.status, targetVersion },
  });

  sendSuccess(res, result, `Deployment action '${commandType}' executed`);
}

export async function toggleMaintenanceMode(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = DeploymentMaintenanceSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { enabled, reason } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const deployment = await platformDb.schoolDeployment.findUnique({ where: { id } });
  if (!deployment) {
    sendError(res, 'Deployment not found', 404, 'NOT_FOUND');
    return;
  }

  const commandType = enabled ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF';
  const result = await deploymentAgent.executeCommand({
    schoolId: deployment.schoolId,
    deploymentId: id,
    commandType,
    parameters: { reason },
    initiatedById: req.user?.id,
  });

  await platformDb.schoolDeployment.update({
    where: { id },
    data: {
      maintenanceStartedAt: enabled ? new Date() : null,
      maintenanceReason: enabled ? reason || 'Scheduled system maintenance' : null,
    },
  });

  sendSuccess(res, result, `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
}
