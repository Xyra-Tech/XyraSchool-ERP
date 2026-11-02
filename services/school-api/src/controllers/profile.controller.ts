import { Request, Response } from 'express';
import { recordSchoolAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await req.schoolDb.schoolProfile.findFirst();

  if (!profile) {
    sendError(res, 'School profile has not been initialized', 404, 'PROFILE_NOT_FOUND');
    return;
  }

  sendSuccess(res, profile, 'School profile retrieved');
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const profile = await req.schoolDb.schoolProfile.findFirst();

  if (!profile) {
    sendError(res, 'School profile not found', 404, 'NOT_FOUND');
    return;
  }

  const {
    name,
    boardAffiliation,
    motto,
    phone,
    address,
    primaryColor,
    secondaryColor,
  } = req.body;

  const updated = await req.schoolDb.schoolProfile.update({
    where: { id: profile.id },
    data: {
      name: name ?? profile.name,
      boardAffiliation: boardAffiliation ?? profile.boardAffiliation,
      motto: motto ?? profile.motto,
      phone: phone ?? profile.phone,
      address: address ?? profile.address,
      primaryColor: primaryColor ?? profile.primaryColor,
      secondaryColor: secondaryColor ?? profile.secondaryColor,
    },
  });

  await recordSchoolAudit(req.schoolDb, {
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SCHOOL_PROFILE_UPDATED',
    resourceType: 'SCHOOL_PROFILE',
    resourceId: profile.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: { changes: req.body },
  });

  sendSuccess(res, updated, 'School profile updated successfully');
}
