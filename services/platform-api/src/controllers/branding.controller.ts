// ==============================================================================
// XyraTech Control Center — School Branding Configuration Controller
// ==============================================================================

import { Request, Response } from 'express';
import { SchoolBrandingSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function getSchoolBranding(req: Request, res: Response): Promise<void> {
  const schoolId = req.params.schoolId as string;
  const platformDb = getPlatformPrisma();

  const branding = await platformDb.schoolBranding.findUnique({
    where: { schoolId },
  });

  const school = await platformDb.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, code: true },
  });

  if (!school) {
    sendError(res, 'School not found', 404, 'NOT_FOUND');
    return;
  }

  const result = branding || {
    schoolId: school.id,
    schoolName: school.name,
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    logoUrl: null,
    isPublished: false,
  };

  sendSuccess(res, result, 'School branding retrieved');
}

export async function updateSchoolBranding(req: Request, res: Response): Promise<void> {
  const schoolId = req.params.schoolId as string;
  const parseResult = SchoolBrandingSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const branding = await platformDb.schoolBranding.upsert({
    where: { schoolId },
    update: {
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      loginBannerUrl: data.loginBannerUrl || null,
      dashboardLogoUrl: data.dashboardLogoUrl || null,
      contactInfo: data.contactInfo as any,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : undefined,
    },
    create: {
      schoolId,
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      loginBannerUrl: data.loginBannerUrl || null,
      dashboardLogoUrl: data.dashboardLogoUrl || null,
      contactInfo: data.contactInfo as any,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : undefined,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SCHOOL_BRANDING_UPDATED',
    resourceType: 'SCHOOL_BRANDING',
    resourceId: branding.id,
    outcome: 'SUCCESS',
    details: { schoolId, isPublished: data.isPublished },
  });

  sendSuccess(res, branding, 'School branding updated successfully');
}
