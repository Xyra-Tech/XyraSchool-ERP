// ==============================================================================
// XyraTech Control Center — Platform Dashboard Metrics Controller
// ==============================================================================

import { Request, Response } from 'express';
import { getPlatformPrisma } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';
import { PlatformDashboardMetrics } from '@xyratech/shared-types';

export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
  try {
    const platformDb = getPlatformPrisma();

    // 1. School status counts
    const schools = await platformDb.school.findMany({
      select: { id: true, status: true },
    });

    const schoolCounts = {
      total: schools.length,
      active: schools.filter((s: { status: string }) => s.status === 'ACTIVE').length,
      trial: 0,
      pendingOnboarding: schools.filter((s: { status: string }) => s.status === 'PENDING_APPROVAL' || s.status === 'PROVISIONING').length,
      suspended: schools.filter((s: { status: string }) => s.status === 'SUSPENDED').length,
      cancelled: schools.filter((s: { status: string }) => s.status === 'CANCELLED').length,
      failedDeployments: 0,
    };

    // 2. Deployment status counts
    const deployments = await platformDb.schoolDeployment.findMany({
      select: { id: true, status: true, releaseVersion: true },
    });

    const healthyDeployments = deployments.filter((d: { status: string }) => d.status === 'HEALTHY').length;
    const unhealthyDeployments = deployments.filter((d: { status: string }) => d.status === 'FAILED' || d.status === 'DEGRADED').length;
    const maintenanceDeployments = deployments.filter((d: { status: string }) => d.status === 'MAINTENANCE').length;

    schoolCounts.failedDeployments = unhealthyDeployments;

    // 3. Subscription counts and revenue
    const subscriptions = await platformDb.schoolSubscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL', 'PAYMENT_PENDING', 'OVERDUE'] } },
      include: { plan: true },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let activeSubs = 0;
    let expiringSoon = 0;
    let overdueCount = 0;
    let totalAnnualRevenueInCents = 0;

    for (const sub of subscriptions) {
      if (sub.status === 'ACTIVE') activeSubs++;
      if (sub.status === 'TRIAL') schoolCounts.trial++;
      if (sub.status === 'OVERDUE') overdueCount++;
      if (sub.endDate >= now && sub.endDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }

      const annualPrice = sub.agreedPriceInCents ?? sub.plan.priceInCents ?? 0;
      totalAnnualRevenueInCents += annualPrice;
    }

    const arrInCents = totalAnnualRevenueInCents;
    const mrrInCents = Math.round(arrInCents / 12);

    // 4. Support Ticket Metrics
    const tickets = await platformDb.supportTicket.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        slaResolutionDue: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    const openTickets = tickets.filter((t: { status: string }) => t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS');
    const criticalTickets = openTickets.filter((t: { priority: string }) => t.priority === 'CRITICAL').length;
    const overdueSla = openTickets.filter((t: { slaResolutionDue: Date | null }) => t.slaResolutionDue && t.slaResolutionDue < now).length;

    // Average resolution time in hours for resolved tickets
    const resolvedTickets = tickets.filter((t: { resolvedAt: Date | null }) => t.resolvedAt !== null);
    let avgResolutionHours = 4.2; // Baseline default
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc: number, t: { createdAt: Date; resolvedAt: Date | null }) => {
        return acc + (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
    }

    // 5. Active Alerts
    const alerts = await platformDb.platformAlert.findMany({
      where: { status: { in: ['TRIGGERED', 'ACKNOWLEDGED', 'INVESTIGATING'] } },
      select: { id: true, severity: true },
    });

    const criticalUnresolved = alerts.filter((a: { severity: string }) => a.severity === 'CRITICAL').length;
    const highUnresolved = alerts.filter((a: { severity: string }) => a.severity === 'HIGH').length;

    // Default release version
    const latestRelease = await platformDb.release.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    const metrics: PlatformDashboardMetrics = {
      schools: schoolCounts,
      subscriptions: {
        active: activeSubs,
        expiringSoon,
        overdue: overdueCount,
        mrrInCents,
        arrInCents,
      },
      deployments: {
        healthy: healthyDeployments,
        unhealthy: unhealthyDeployments,
        inMaintenance: maintenanceDeployments,
        currentDefaultVersion: latestRelease?.version || '1.0.0',
      },
      support: {
        openTickets: openTickets.length,
        criticalTickets,
        overdueSla,
        avgResolutionHours,
      },
      alerts: {
        criticalUnresolved,
        highUnresolved,
      },
    };

    sendSuccess(res, metrics, 'Platform dashboard metrics retrieved successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve dashboard metrics', 500, 'DASHBOARD_METRICS_ERROR');
  }
}

