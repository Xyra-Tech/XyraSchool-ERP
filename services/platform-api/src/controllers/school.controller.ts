import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { SchoolProvisioningSchema, SchoolUpdateSchema, SchoolStatusUpdateSchema } from '@xyratech/validation';
import { encryptField, config, hashSha256 } from '@xyratech/config';
import { getPlatformPrisma, recordPlatformAudit, getDefaultSchoolPrisma } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function createSchool(req: Request, res: Response): Promise<void> {
  const parseResult = SchoolProvisioningSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  // 1. Check duplicate code or email
  const existing = await platformDb.school.findFirst({
    where: {
      OR: [{ code: data.code }, { officialEmail: data.officialEmail }],
    },
  });

  if (existing) {
    sendError(res, 'A school with this code or official email already exists', 409, 'DUPLICATE_SCHOOL');
    return;
  }

  // 2. Fetch subscription plan
  const plan = await platformDb.subscriptionPlan.findUnique({
    where: { code: data.planCode },
  });

  if (!plan) {
    sendError(res, `Subscription plan '${data.planCode}' not found`, 404, 'PLAN_NOT_FOUND');
    return;
  }

  // 3. Generate isolated database connection URL for this school tenant
  const tenantDbName = `xyratech_school_${data.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const isolatedDbUrl = `${config.schoolDbBaseUrl}/${tenantDbName}?schema=public`;
  const encryptedDbUrl = encryptField(isolatedDbUrl);

  // 4. Create School Record
  const school = await platformDb.school.create({
    data: {
      code: data.code,
      name: data.name,
      officialEmail: data.officialEmail,
      contactPhone: data.contactPhone,
      address: data.address,
      status: 'PENDING_ACTIVATION',
      deployments: {
        create: {
          environment: 'DEVELOPMENT',
          deploymentUrl: `https://${data.code.toLowerCase()}.xyraschool.internal`,
          databaseUrlEncrypted: encryptedDbUrl,
          storageBucket: `xyra-storage-${data.code.toLowerCase()}`,
          apiVersion: 'v1',
          releaseVersion: '1.0.0',
          status: 'HEALTHY',
          lastHealthCheckAt: new Date(),
        },
      },
      subscriptions: {
        create: {
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          autoRenew: true,
        },
      },
    },
    include: {
      deployments: true,
      subscriptions: true,
    },
  });

  const createdSchool = school as any;

  // 5. Generate secure Principal invitation token
  const rawInvitationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSha256(rawInvitationToken);
  const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    const schoolDb = getDefaultSchoolPrisma();
    await schoolDb.userInvitation.create({
      data: {
        email: data.principalEmail,
        roleCode: 'PRINCIPAL',
        userType: 'PRINCIPAL',
        invitationTokenHash: tokenHash,
        expiresAt: invitationExpiresAt,
        status: 'PENDING',
      },
    });

    await schoolDb.schoolProfile.upsert({
      where: { schoolCode: data.code },
      update: {
        name: data.name,
        officialEmail: data.officialEmail,
        phone: data.contactPhone,
        address: data.address,
      },
      create: {
        schoolCode: data.code,
        name: data.name,
        officialEmail: data.officialEmail,
        phone: data.contactPhone,
        address: data.address,
        academicYearStart: new Date(data.academicYearStart),
        academicYearEnd: new Date(data.academicYearEnd),
      },
    });
  } catch (err) {
    console.warn('[School DB Sync Warning]:', err);
  }

  // 6. Record Platform Audit Log
  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SCHOOL_PROVISIONED',
    resourceType: 'SCHOOL',
    resourceId: school.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: {
      schoolCode: school.code,
      schoolName: school.name,
      planCode: data.planCode,
      tenantDbName,
    },
  });

  sendSuccess(
    res,
    {
      schoolId: school.id,
      code: school.code,
      name: school.name,
      status: school.status,
      deploymentUrl: createdSchool.deployments?.[0]?.deploymentUrl,
      invitationToken: rawInvitationToken,
      invitationExpiresAt: invitationExpiresAt.toISOString(),
      principalEmail: data.principalEmail,
    },
    'School provisioned successfully and Principal invitation generated',
    201
  );
}

export async function listSchools(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const skip = (page - 1) * pageSize;

  const [totalRecords, schools] = await Promise.all([
    platformDb.school.count(),
    platformDb.school.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        deployments: {
          select: {
            environment: true,
            deploymentUrl: true,
            status: true,
            releaseVersion: true,
            lastHealthCheckAt: true,
          },
        },
        subscriptions: {
          include: {
            plan: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  sendSuccess(
    res,
    schools,
    'Schools retrieved successfully',
    200,
    {
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  );
}

export async function getSchoolById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const school = await platformDb.school.findUnique({
    where: { id: id as string },
    include: {
      deployments: true,
      subscriptions: {
        include: {
          plan: {
            include: {
              entitlements: true,
            },
          },
        },
      },
    },
  });

  if (!school) {
    sendError(res, 'School not found', 404, 'NOT_FOUND');
    return;
  }

  const sanitizedDeployments = school.deployments.map((d: any) => ({
    ...d,
    databaseUrlEncrypted: undefined,
    databaseConfigured: true,
  }));

  sendSuccess(res, { ...school, deployments: sanitizedDeployments }, 'School details retrieved');
}

export async function listPlans(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const plans = await platformDb.subscriptionPlan.findMany({
    where: { isActive: true },
    include: {
      entitlements: true,
    },
  });

  sendSuccess(res, plans, 'Subscription plans retrieved');
}

export async function updateSchool(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = SchoolUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const platformDb = getPlatformPrisma();
  const updated = await platformDb.school.update({
    where: { id },
    data: parseResult.data,
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SCHOOL_DETAILS_UPDATED',
    resourceType: 'SCHOOL',
    resourceId: id,
    outcome: 'SUCCESS',
    details: parseResult.data,
  });

  sendSuccess(res, updated, 'School details updated');
}

export async function updateSchoolStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = SchoolStatusUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { status, reason } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const updateData: any = { status };
  if (status === 'SUSPENDED') {
    updateData.suspendedAt = new Date();
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
    updateData.cancellationReason = reason;
  } else if (status === 'ACTIVE') {
    updateData.suspendedAt = null;
    updateData.activatedAt = new Date();
  }

  const updated = await platformDb.school.update({
    where: { id },
    data: updateData,
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: `SCHOOL_STATUS_${status}`,
    resourceType: 'SCHOOL',
    resourceId: id,
    outcome: 'SUCCESS',
    details: { status, reason },
  });

  sendSuccess(res, updated, `School status changed to ${status}`);
}

export async function exportSchoolMetadata(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const school = await platformDb.school.findUnique({
    where: { id },
    include: {
      contacts: true,
      subscriptions: { include: { plan: { include: { entitlements: true } } } },
      deployments: {
        select: {
          environment: true,
          deploymentUrl: true,
          apiVersion: true,
          releaseVersion: true,
          status: true,
        },
      },
      branding: true,
    },
  });

  if (!school) {
    sendError(res, 'School not found', 404, 'NOT_FOUND');
    return;
  }

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SCHOOL_METADATA_EXPORTED',
    resourceType: 'SCHOOL',
    resourceId: id,
    outcome: 'SUCCESS',
  });

  sendSuccess(res, school, 'Authorized platform metadata exported');
}
