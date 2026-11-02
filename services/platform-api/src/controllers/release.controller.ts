// ==============================================================================
// XyraTech Control Center — Releases & Updates Controller
// ==============================================================================

import { Request, Response } from 'express';
import { CreateReleaseSchema, RolloutReleaseSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';
import { deploymentAgent } from '../services/deploymentAgent.service';

export async function listReleases(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const releases = await platformDb.release.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      artifacts: true,
      deployments: {
        include: {
          school: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  sendSuccess(res, releases, 'Releases retrieved');
}

export async function createRelease(req: Request, res: Response): Promise<void> {
  const parseResult = CreateReleaseSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const existing = await platformDb.release.findUnique({
    where: { version: data.version },
  });
  if (existing) {
    sendError(res, `Release version '${data.version}' already exists`, 409, 'DUPLICATE_VERSION');
    return;
  }

  const release = await platformDb.release.create({
    data: {
      version: data.version,
      title: data.title,
      description: data.description,
      releaseNotes: data.releaseNotes,
      isHotfix: data.isHotfix,
      requiresDbMigration: data.requiresDbMigration,
      migrationNotes: data.migrationNotes,
      status: 'DRAFT',
      createdById: req.user!.id,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'RELEASE_CREATED',
    resourceType: 'RELEASE',
    resourceId: release.id,
    outcome: 'SUCCESS',
    details: { version: data.version, title: data.title },
  });

  sendSuccess(res, release, 'Release created', 201);
}

export async function approveRelease(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const release = await platformDb.release.findUnique({ where: { id } });
  if (!release) {
    sendError(res, 'Release not found', 404, 'NOT_FOUND');
    return;
  }

  const updated = await platformDb.release.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: req.user?.id,
      approvedAt: new Date(),
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'RELEASE_APPROVED',
    resourceType: 'RELEASE',
    resourceId: id,
    outcome: 'SUCCESS',
    details: { version: release.version },
  });

  sendSuccess(res, updated, `Release ${release.version} approved for rollout`);
}

export async function rolloutRelease(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = RolloutReleaseSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { schoolIds, isPilot } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const release = await platformDb.release.findUnique({ where: { id } });
  if (!release) {
    sendError(res, 'Release not found', 404, 'NOT_FOUND');
    return;
  }

  // Find eligible schools
  const targetSchools = await platformDb.school.findMany({
    where: schoolIds && schoolIds.length > 0 ? { id: { in: schoolIds } } : { status: 'ACTIVE' },
    include: { deployments: true },
  });

  // Update release status to ROLLING_OUT
  await platformDb.release.update({
    where: { id },
    data: { status: 'ROLLING_OUT', startedAt: new Date() },
  });

  const deploymentResults: any[] = [];
  for (const school of targetSchools) {
    const deployment = school.deployments[0];
    if (!deployment) continue;

    // Create ReleaseDeployment record
    await platformDb.releaseDeployment.upsert({
      where: {
        releaseId_schoolId: {
          releaseId: release.id,
          schoolId: school.id,
        },
      },
      update: { status: 'IN_PROGRESS' },
      create: {
        releaseId: release.id,
        schoolId: school.id,
        previousVersion: deployment.releaseVersion,
        targetVersion: release.version,
        isPilot,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    // Run deployment agent update
    const result = await deploymentAgent.executeCommand({
      schoolId: school.id,
      deploymentId: deployment.id,
      commandType: 'UPDATE',
      targetVersion: release.version,
      initiatedById: req.user?.id,
    });

    // Update release deployment entry
    await platformDb.releaseDeployment.update({
      where: {
        releaseId_schoolId: {
          releaseId: release.id,
          schoolId: school.id,
        },
      },
      data: {
        status: result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        errorMessage: result.error,
      },
    });

    deploymentResults.push({
      schoolCode: school.code,
      schoolName: school.name,
      status: result.status,
    });
  }

  const allCompleted = deploymentResults.every((r) => r.status === 'COMPLETED');
  await platformDb.release.update({
    where: { id },
    data: {
      status: allCompleted ? 'COMPLETED' : 'FAILED',
      completedAt: allCompleted ? new Date() : null,
    },
  });

  sendSuccess(res, { results: deploymentResults }, `Release rollout executed to ${deploymentResults.length} schools`);
}
