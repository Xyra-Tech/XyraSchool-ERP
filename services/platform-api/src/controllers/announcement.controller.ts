// ==============================================================================
// XyraTech Control Center — Announcements & Notifications Controller
// ==============================================================================

import { Request, Response } from 'express';
import { CreateAnnouncementSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listAnnouncements(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const announcements = await platformDb.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      targets: {
        include: {
          school: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  sendSuccess(res, announcements, 'Announcements retrieved');
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  const parseResult = CreateAnnouncementSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const announcement = await platformDb.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      priority: data.priority,
      channels: data.channels,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: req.user?.id,
      targets: {
        create: data.targets.map((t) => ({
          targetType: t.targetType,
          targetValue: t.targetValue,
          schoolId: t.schoolId,
        })),
      },
    },
    include: { targets: true },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'ANNOUNCEMENT_PUBLISHED',
    resourceType: 'ANNOUNCEMENT',
    resourceId: announcement.id,
    outcome: 'SUCCESS',
    details: { title: announcement.title, type: announcement.type },
  });

  sendSuccess(res, announcement, 'Announcement published successfully', 201);
}

