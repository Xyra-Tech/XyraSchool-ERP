// ==============================================================================
// XyraTech Control Center — Subscriptions & Plans Management Controller
// ==============================================================================

import { Request, Response } from 'express';
import { CreatePlanSchema, AssignSubscriptionSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listSubscriptions(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const status = req.query.status as string;

  const where: any = {};
  if (status) where.status = status;

  const [totalRecords, subscriptions] = await Promise.all([
    platformDb.schoolSubscription.count({ where }),
    platformDb.schoolSubscription.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { id: true, code: true, name: true, officialEmail: true, status: true } },
        plan: true,
      },
    }),
  ]);

  sendSuccess(res, subscriptions, 'Subscriptions retrieved', 200, {
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

export async function getSubscriptionById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const subscription = await platformDb.schoolSubscription.findUnique({
    where: { id },
    include: {
      school: true,
      plan: { include: { entitlements: true } },
      invoices: { orderBy: { createdAt: 'desc' } },
      history: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!subscription) {
    sendError(res, 'Subscription not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, subscription, 'Subscription details retrieved');
}

export async function changeSubscriptionPlan(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { newPlanId, reason } = req.body;

  if (!newPlanId) {
    sendError(res, 'newPlanId is required', 400, 'BAD_REQUEST');
    return;
  }

  const platformDb = getPlatformPrisma();
  const currentSub = await platformDb.schoolSubscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!currentSub) {
    sendError(res, 'Subscription not found', 404, 'NOT_FOUND');
    return;
  }

  const newPlan = await platformDb.subscriptionPlan.findUnique({
    where: { id: newPlanId },
  });

  if (!newPlan) {
    sendError(res, 'Target plan not found', 404, 'PLAN_NOT_FOUND');
    return;
  }

  const isUpgrade = (newPlan.priceInCents || 0) > (currentSub.plan.priceInCents || 0);
  const actionType = isUpgrade ? 'UPGRADED' : 'DOWNGRADED';

  // Update subscription
  const updated = await platformDb.schoolSubscription.update({
    where: { id },
    data: {
      planId: newPlan.id,
      agreedPriceInCents: newPlan.priceInCents,
    },
    include: { plan: true },
  });

  // Record history
  await platformDb.subscriptionHistory.create({
    data: {
      subscriptionId: id,
      action: actionType,
      fromPlanId: currentSub.planId,
      toPlanId: newPlan.id,
      changedById: req.user?.id,
      reason: reason || `Manual plan change to ${newPlan.name}`,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: `SUBSCRIPTION_${actionType}`,
    resourceType: 'SUBSCRIPTION',
    resourceId: id,
    outcome: 'SUCCESS',
    details: { fromPlan: currentSub.plan.code, toPlan: newPlan.code, reason },
  });

  sendSuccess(res, updated, `Subscription ${actionType.toLowerCase()} to ${newPlan.name}`);
}

export async function listPlans(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const plans = await platformDb.subscriptionPlan.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { entitlements: true },
  });

  sendSuccess(res, plans, 'Plans retrieved');
}

export async function createPlan(req: Request, res: Response): Promise<void> {
  const parseResult = CreatePlanSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const existing = await platformDb.subscriptionPlan.findUnique({
    where: { code: data.code },
  });
  if (existing) {
    sendError(res, `Plan with code '${data.code}' already exists`, 409, 'DUPLICATE_PLAN');
    return;
  }

  const plan = await platformDb.subscriptionPlan.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      billingCycle: data.billingCycle,
      maxStudents: data.maxStudents,
      maxStaff: data.maxStaff,
      maxAdmins: data.maxAdmins,
      storageLimitMb: data.storageLimitMb,
      aiUsageQuota: data.aiUsageQuota,
      parentPortal: data.parentPortal,
      mobileAccess: data.mobileAccess,
      supportLevel: data.supportLevel,
      priceInCents: data.priceInCents,
      currency: data.currency,
      isCustom: data.isCustom,
      entitlements: data.entitlements
        ? {
            create: data.entitlements.map((e) => ({
              featureCode: e.featureCode,
              featureName: e.featureCode.replace(/_/g, ' '),
              isEnabled: e.isEnabled,
              limitValue: e.limitValue,
            })),
          }
        : undefined,
    },
    include: { entitlements: true },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SUBSCRIPTION_PLAN_CREATED',
    resourceType: 'SUBSCRIPTION_PLAN',
    resourceId: plan.id,
    outcome: 'SUCCESS',
    details: { code: plan.code, priceInCents: plan.priceInCents },
  });

  sendSuccess(res, plan, 'Subscription plan created', 201);
}
