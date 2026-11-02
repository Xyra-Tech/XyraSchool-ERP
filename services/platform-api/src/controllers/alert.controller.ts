// ==============================================================================
// XyraTech Control Center — Alerts & Monitoring Controller
// ==============================================================================

import { Request, Response } from 'express';
import { CreateAlertSchema, UpdateAlertStatusSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listAlerts(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const status = req.query.status as string;
  const severity = req.query.severity as string;

  const where: any = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;

  const alerts = await platformDb.platformAlert.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    include: {
      events: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  sendSuccess(res, alerts, 'Platform alerts retrieved');
}

export async function updateAlertStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = UpdateAlertStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { status, notes } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const alert = await platformDb.platformAlert.findUnique({ where: { id } });
  if (!alert) {
    sendError(res, 'Alert not found', 404, 'NOT_FOUND');
    return;
  }

  const updateData: any = { status };
  if (status === 'ACKNOWLEDGED') {
    updateData.acknowledgedAt = new Date();
    updateData.acknowledgedById = req.user?.id;
  } else if (status === 'RESOLVED') {
    updateData.resolvedAt = new Date();
    updateData.resolvedById = req.user?.id;
    updateData.resolvedNotes = notes;
  } else if (status === 'ESCALATED') {
    updateData.escalatedAt = new Date();
    updateData.escalationLevel = alert.escalationLevel + 1;
  }

  const updated = await platformDb.platformAlert.update({
    where: { id },
    data: updateData,
  });

  // Record Alert Event
  await platformDb.platformAlertEvent.create({
    data: {
      alertId: id,
      eventType: status,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      message: notes || `Alert transitioned to ${status}`,
    },
  });

  sendSuccess(res, updated, `Alert status updated to ${status}`);
}

export async function createAlert(req: Request, res: Response): Promise<void> {
  const parseResult = CreateAlertSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const alert = await platformDb.platformAlert.create({
    data: {
      category: data.category,
      severity: data.severity,
      title: data.title,
      message: data.message,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata as any,
      createdById: req.user?.id,
      status: 'TRIGGERED',
    },
  });

  await platformDb.platformAlertEvent.create({
    data: {
      alertId: alert.id,
      eventType: 'TRIGGERED',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      message: 'Alert triggered',
    },
  });

  sendSuccess(res, alert, 'Platform alert created', 201);
}
