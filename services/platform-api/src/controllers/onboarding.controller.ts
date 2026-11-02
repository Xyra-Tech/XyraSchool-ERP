// ==============================================================================
// XyraTech Control Center — School Onboarding & Applications Controller
// ==============================================================================

import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { SchoolApplicationSubmitSchema, SchoolApplicationReviewSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit, getDefaultSchoolPrisma } from '@xyratech/database';
import { encryptField, hashSha256, config } from '@xyratech/config';
import { sendSuccess, sendError } from '../utils/response';
import { deploymentAgent } from '../services/deploymentAgent.service';

export async function submitApplication(req: Request, res: Response): Promise<void> {
  const parseResult = SchoolApplicationSubmitSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  // Duplicate Check: Check whether email or school name exists
  const existingApp = await platformDb.schoolApplication.findFirst({
    where: {
      OR: [{ officialEmail: data.officialEmail }, { schoolName: { equals: data.schoolName, mode: 'insensitive' } }],
      status: { notIn: ['REJECTED'] },
    },
  });

  if (existingApp) {
    sendError(res, 'An active onboarding application already exists for this school name or email', 409, 'DUPLICATE_APPLICATION');
    return;
  }

  const existingSchool = await platformDb.school.findFirst({
    where: { officialEmail: data.officialEmail },
  });

  if (existingSchool) {
    sendError(res, 'A school with this official email is already registered on the platform', 409, 'SCHOOL_EXISTS');
    return;
  }

  // Create Application Record
  const application = await platformDb.schoolApplication.create({
    data: {
      source: req.user ? 'MANUAL_ENTRY' : 'ONLINE_APPLICATION',
      status: 'APPLICATION_SUBMITTED',
      schoolName: data.schoolName,
      schoolType: data.schoolType,
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      contactPhone: data.contactPhone,
      officialEmail: data.officialEmail,
      principalName: data.principalName,
      principalEmail: data.principalEmail,
      principalPhone: data.principalPhone,
      expectedStudentCount: data.expectedStudentCount,
      requestedPlanCode: data.requestedPlanCode || 'STARTER',
      requestedModules: data.requestedModules || [],
      notes: data.notes,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email || data.officialEmail,
    action: 'ONBOARDING_APPLICATION_SUBMITTED',
    resourceType: 'SCHOOL_APPLICATION',
    resourceId: application.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: { schoolName: data.schoolName, officialEmail: data.officialEmail },
  });

  sendSuccess(res, application, 'School onboarding application submitted successfully', 201);
}

export async function listApplications(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const status = req.query.status as string;
  const search = req.query.search as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { schoolName: { contains: search, mode: 'insensitive' } },
      { officialEmail: { contains: search, mode: 'insensitive' } },
      { principalName: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [totalRecords, applications] = await Promise.all([
    platformDb.schoolApplication.count({ where }),
    platformDb.schoolApplication.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    }),
  ]);

  sendSuccess(res, applications, 'Applications retrieved', 200, {
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

export async function getApplicationById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const application = await platformDb.schoolApplication.findUnique({
    where: { id },
    include: {
      documents: true,
      reviews: { orderBy: { createdAt: 'desc' } },
      school: {
        include: {
          deployments: true,
          subscriptions: { include: { plan: true } },
        },
      },
    },
  });

  if (!application) {
    sendError(res, 'Application not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, application, 'Application details retrieved');
}

export async function reviewApplication(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = SchoolApplicationReviewSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { action, reason, notes } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const app = await platformDb.schoolApplication.findUnique({ where: { id } });
  if (!app) {
    sendError(res, 'Application not found', 404, 'NOT_FOUND');
    return;
  }

  if (action === 'REJECT') {
    const updated = await platformDb.schoolApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: req.user?.id,
        rejectedAt: new Date(),
        rejectionReason: reason || 'Requirements criteria not met',
      },
    });

    await platformDb.onboardingReview.create({
      data: {
        applicationId: id,
        reviewerId: req.user!.id,
        reviewerEmail: req.user!.email,
        action: 'REJECTED',
        comment: reason || notes,
      },
    });

    await recordPlatformAudit({
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: 'ONBOARDING_APPLICATION_REJECTED',
      resourceType: 'SCHOOL_APPLICATION',
      resourceId: id,
      outcome: 'SUCCESS',
      details: { reason },
    });

    sendSuccess(res, updated, 'Application rejected successfully');
    return;
  }

  if (action === 'REQUEST_INFO') {
    const updated = await platformDb.schoolApplication.update({
      where: { id },
      data: {
        status: 'VERIFICATION_PENDING',
        notes: notes ? `${app.notes || ''}\nInfo requested: ${notes}` : app.notes,
      },
    });

    await platformDb.onboardingReview.create({
      data: {
        applicationId: id,
        reviewerId: req.user!.id,
        reviewerEmail: req.user!.email,
        action: 'INFO_REQUESTED',
        comment: notes,
      },
    });

    sendSuccess(res, updated, 'Information request logged');
    return;
  }

  // Action: APPROVE & PROVISION
  // 1. Generate unique School Code: XYRA-SCH-XXX
  const schoolCount = await platformDb.school.count();
  const schoolCode = `XYRA-SCH-${String(schoolCount + 1).padStart(3, '0')}`;

  // 2. Resolve Plan
  const planCode = app.requestedPlanCode || 'STANDARD';
  const plan = await platformDb.subscriptionPlan.findFirst({
    where: { code: planCode },
  });

  if (!plan) {
    sendError(res, `Requested subscription plan '${planCode}' not found`, 404, 'PLAN_NOT_FOUND');
    return;
  }

  // 3. Create School Record & Provisioning Setup
  const tenantDbName = `xyratech_school_${schoolCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const isolatedDbUrl = `${config.schoolDbBaseUrl}/${tenantDbName}?schema=public`;
  const encryptedDbUrl = encryptField(isolatedDbUrl);

  const school = await platformDb.school.create({
    data: {
      code: schoolCode,
      name: app.schoolName,
      schoolType: app.schoolType,
      officialEmail: app.officialEmail,
      contactPhone: app.contactPhone,
      address: app.address,
      city: app.city,
      state: app.state,
      postalCode: app.postalCode,
      expectedStudentCount: app.expectedStudentCount,
      status: 'APPROVED',
      domain: `${schoolCode.toLowerCase()}.xyraschool.internal`,
      deployments: {
        create: {
          environment: 'PRODUCTION',
          deploymentUrl: `https://${schoolCode.toLowerCase()}.xyraschool.internal`,
          databaseUrlEncrypted: encryptedDbUrl,
          storageBucket: `xyra-storage-${schoolCode.toLowerCase()}`,
          apiVersion: 'v1',
          releaseVersion: '1.0.0',
          status: 'PROVISIONING',
          lastHealthCheckAt: new Date(),
        },
      },
      subscriptions: {
        create: {
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true,
          billingContactName: app.principalName,
          billingContactEmail: app.officialEmail,
          billingContactPhone: app.contactPhone,
        },
      },
    },
    include: { deployments: true, subscriptions: true },
  });

  // 4. Update Application status
  await platformDb.schoolApplication.update({
    where: { id },
    data: {
      schoolId: school.id,
      status: 'DEPLOYMENT_PROVISIONING',
      approvedById: req.user?.id,
      approvedAt: new Date(),
    },
  });

  // 5. Record Review Log
  await platformDb.onboardingReview.create({
    data: {
      applicationId: id,
      reviewerId: req.user!.id,
      reviewerEmail: req.user!.email,
      action: 'APPROVED',
      comment: notes || 'Application approved and provisioning initiated',
    },
  });

  // 6. Trigger Simulated Deployment Agent Provisioning
  const deployment = school.deployments[0];
  if (deployment) {
    await deploymentAgent.executeCommand({
      schoolId: school.id,
      deploymentId: deployment.id,
      commandType: 'PROVISION',
      targetVersion: '1.0.0',
      initiatedById: req.user?.id,
    });
  }

  // 7. Generate Principal Invitation
  const rawInvitationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSha256(rawInvitationToken);
  const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const schoolDb = getDefaultSchoolPrisma();
    await schoolDb.userInvitation.create({
      data: {
        email: app.principalEmail,
        roleCode: 'PRINCIPAL',
        userType: 'PRINCIPAL',
        invitationTokenHash: tokenHash,
        expiresAt: invitationExpiresAt,
        status: 'PENDING',
      },
    });
  } catch (invErr) {
    console.warn('School DB invitation creation notice:', invErr);
  }

  // Update application status to completed
  await platformDb.schoolApplication.update({
    where: { id },
    data: { status: 'SCHOOL_ACTIVATED' },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'ONBOARDING_APPLICATION_APPROVED',
    resourceType: 'SCHOOL_APPLICATION',
    resourceId: id,
    outcome: 'SUCCESS',
    details: { schoolId: school.id, schoolCode },
  });

  sendSuccess(
    res,
    {
      school,
      principalInvitation: {
        email: app.principalEmail,
        token: rawInvitationToken,
        expiresAt: invitationExpiresAt,
      },
    },
    'Application approved, school provisioned, and Principal invitation generated',
    200
  );
}
