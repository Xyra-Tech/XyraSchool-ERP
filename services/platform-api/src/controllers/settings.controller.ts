// ==============================================================================
// XyraTech Control Center — Platform Settings Controller
// ==============================================================================

import { Request, Response } from 'express';
import { PlatformSettingSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listSettings(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const category = req.query.category as string;

  const where: any = {};
  if (category) where.category = category;

  const settings = await platformDb.platformSetting.findMany({
    where,
    orderBy: { key: 'asc' },
  });

  // Mask secrets
  const sanitized = settings.map((s) => ({
    ...s,
    value: s.isSecret ? '••••••••••••••••' : s.value,
  }));

  sendSuccess(res, sanitized, 'Platform settings retrieved');
}

export async function updateSetting(req: Request, res: Response): Promise<void> {
  const parseResult = PlatformSettingSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const setting = await platformDb.platformSetting.upsert({
    where: { key: data.key },
    update: {
      value: data.value as any,
      category: data.category,
      isSecret: data.isSecret,
      description: data.description,
      updatedById: req.user?.id,
    },
    create: {
      key: data.key,
      value: data.value as any,
      category: data.category,
      isSecret: data.isSecret,
      description: data.description,
      updatedById: req.user?.id,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'PLATFORM_SETTING_UPDATED',
    resourceType: 'PLATFORM_SETTING',
    resourceId: setting.id,
    outcome: 'SUCCESS',
    details: { key: setting.key, category: setting.category, isSecret: setting.isSecret },
  });

  sendSuccess(
    res,
    {
      ...setting,
      value: setting.isSecret ? '••••••••••••••••' : setting.value,
    },
    'Setting updated successfully'
  );
}

