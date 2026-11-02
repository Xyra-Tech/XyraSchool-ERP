// ==============================================================================
// XyraTech Control Center — Internal Users & Roles Controller
// ==============================================================================

import { Request, Response } from 'express';
import { InviteInternalUserSchema, UpdatePlatformUserSchema } from '@xyratech/validation';
import { hashPassword } from '@xyratech/config';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listInternalUsers(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const users = await platformDb.platformUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      isActive: true,
      isSuperAdmin: true,
      mfaEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      department: true,
      userRoles: {
        include: { platformRole: true },
      },
    },
  });

  sendSuccess(res, users, 'Internal users retrieved');
}

export async function inviteInternalUser(req: Request, res: Response): Promise<void> {
  const parseResult = InviteInternalUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const existing = await platformDb.platformUser.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    sendError(res, 'User with this email already exists', 409, 'DUPLICATE_USER');
    return;
  }

  const role = await platformDb.platformRole.findUnique({
    where: { name: data.roleName },
  });
  if (!role) {
    sendError(res, `Role '${data.roleName}' not found`, 404, 'ROLE_NOT_FOUND');
    return;
  }

  // Generate temporary password hash for invitation
  const initialTempPassword = `XyraInternal@${Math.floor(1000 + Math.random() * 9000)}!`;
  const passwordHash = await hashPassword(initialTempPassword);

  const user = await platformDb.platformUser.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      passwordHash,
      departmentId: data.departmentId,
      isSuperAdmin: data.roleName === 'SUPER_ADMIN',
      userRoles: {
        create: { platformRoleId: role.id },
      },
    },
    include: {
      userRoles: { include: { platformRole: true } },
      department: true,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'INTERNAL_USER_INVITED',
    resourceType: 'PLATFORM_USER',
    resourceId: user.id,
    outcome: 'SUCCESS',
    details: { email: user.email, role: data.roleName },
  });

  // Return user with temporary invite credentials for local testing
  sendSuccess(
    res,
    {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [data.roleName],
      },
      temporaryPasswordNotice: initialTempPassword,
    },
    'Internal user invited successfully',
    201
  );
}

export async function updateInternalUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = UpdatePlatformUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const user = await platformDb.platformUser.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      isActive: data.isActive,
      departmentId: data.departmentId,
    },
  });

  sendSuccess(res, user, 'Internal user updated');
}

export async function listRoles(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const roles = await platformDb.platformRole.findMany({
    include: {
      permissions: {
        include: { platformPermission: true },
      },
      _count: { select: { userRoles: true } },
    },
  });

  sendSuccess(res, roles, 'Platform roles retrieved');
}
