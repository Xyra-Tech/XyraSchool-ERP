import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { UserCreateSchema } from '@xyratech/validation';
import { hashSha256 } from '@xyratech/config';
import { recordSchoolAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const skip = (page - 1) * pageSize;

  const [totalRecords, users] = await Promise.all([
    req.schoolDb.user.count(),
    req.schoolDb.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  sendSuccess(res, users, 'Users retrieved successfully', 200, {
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

export async function createUser(req: Request, res: Response): Promise<void> {
  const parseResult = UserCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { email, firstName, lastName, userType, roleCode, phoneNumber } = parseResult.data;

  // Check existing user
  const existingUser = await req.schoolDb.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    sendError(res, 'A user with this email already exists', 409, 'DUPLICATE_USER');
    return;
  }

  // Verify role exists
  const role = await req.schoolDb.role.findUnique({
    where: { code: roleCode },
  });

  if (!role) {
    sendError(res, `Role '${roleCode}' not found`, 404, 'ROLE_NOT_FOUND');
    return;
  }

  // Create invitation token for staff self-activation
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSha256(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await req.schoolDb.userInvitation.create({
    data: {
      email,
      roleCode,
      userType: userType as any,
      invitationTokenHash: tokenHash,
      expiresAt,
      invitedById: req.user?.id,
      status: 'PENDING',
    },
  });

  // Pre-create user profile in PENDING_ACTIVATION
  const user = await req.schoolDb.user.create({
    data: {
      email,
      firstName,
      lastName,
      phoneNumber,
      userType: userType as any,
      status: 'PENDING_ACTIVATION',
      userRoles: {
        create: {
          roleId: role.id,
        },
      },
    },
  });

  await recordSchoolAudit(req.schoolDb, {
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'USER_CREATED',
    resourceType: 'USER',
    resourceId: user.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: { email, userType, roleCode },
  });

  sendSuccess(
    res,
    {
      userId: user.id,
      email: user.email,
      invitationToken: rawToken,
      invitationExpiresAt: expiresAt.toISOString(),
    },
    'User invitation created successfully',
    201
  );
}

export async function listRoles(req: Request, res: Response): Promise<void> {
  const roles = await req.schoolDb.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  const formattedRoles = roles.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: r.permissions.map((p) => p.permission.code),
  }));

  sendSuccess(res, formattedRoles, 'Roles retrieved successfully');
}
