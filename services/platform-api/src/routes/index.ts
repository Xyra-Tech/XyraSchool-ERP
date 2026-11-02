// ==============================================================================
// XyraTech Control Center — Complete Platform API Routes
// ==============================================================================

import { Router } from 'express';
import { PlatformPermissions } from '@xyratech/permissions';
import { requirePlatformAuth, requirePlatformPermission } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';
import { platformOpenApiSpec } from '../openapi';

// Controllers
import { checkHealth } from '../controllers/health.controller';
import { login, logout, getMe, setupMfa, verifyMfaSetup } from '../controllers/auth.controller';
import { getDashboardMetrics } from '../controllers/dashboard.controller';
import {
  createSchool,
  listSchools,
  getSchoolById,
  updateSchool,
  updateSchoolStatus,
  exportSchoolMetadata,
} from '../controllers/school.controller';
import {
  submitApplication,
  listApplications,
  getApplicationById,
  reviewApplication,
} from '../controllers/onboarding.controller';
import {
  listDeployments,
  getDeploymentById,
  triggerDeploymentAction,
  toggleMaintenanceMode,
} from '../controllers/deployment.controller';
import {
  listSubscriptions,
  getSubscriptionById,
  changeSubscriptionPlan,
  listPlans,
  createPlan,
} from '../controllers/subscription.controller';
import {
  listInvoices,
  createInvoice,
  recordManualPayment,
  handleRazorpayWebhook,
} from '../controllers/billing.controller';
import {
  listReleases,
  createRelease,
  approveRelease,
  rolloutRelease,
} from '../controllers/release.controller';
import {
  listTickets,
  getTicketById,
  createTicket,
  replyToTicket,
  assignTicket,
  updateTicketStatus,
  requestSupportAccess,
  approveSupportAccess,
} from '../controllers/support.controller';
import {
  listPages,
  getPageById,
  createPage,
  updatePage,
  publishPage,
} from '../controllers/cms.controller';
import { getSchoolBranding, updateSchoolBranding } from '../controllers/branding.controller';
import { listAnnouncements, createAnnouncement } from '../controllers/announcement.controller';
import {
  listInternalUsers,
  inviteInternalUser,
  updateInternalUser,
  listRoles,
} from '../controllers/user.controller';
import { getPlatformAnalytics } from '../controllers/analytics.controller';
import { listAlerts, updateAlertStatus, createAlert } from '../controllers/alert.controller';
import { listAuditLogs, exportAuditLogs } from '../controllers/audit.controller';
import { listSettings, updateSetting } from '../controllers/settings.controller';

export const platformRouter: Router = Router();

// ------------------------------------------------------------------------------
// System & Docs
// ------------------------------------------------------------------------------
platformRouter.get('/system/health', checkHealth);
platformRouter.get('/docs', (req, res) => res.json(platformOpenApiSpec));

// ------------------------------------------------------------------------------
// Authentication
// ------------------------------------------------------------------------------
platformRouter.post('/auth/login', rateLimiter(15, 60 * 1000), login);
platformRouter.post('/auth/logout', requirePlatformAuth, logout);
platformRouter.get('/auth/me', requirePlatformAuth, getMe);
platformRouter.post('/auth/mfa/setup', requirePlatformAuth, setupMfa);
platformRouter.post('/auth/mfa/verify', requirePlatformAuth, verifyMfaSetup);

// ------------------------------------------------------------------------------
// Dashboard Overview
// ------------------------------------------------------------------------------
platformRouter.get(
  '/dashboard',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.DASHBOARD_VIEW),
  getDashboardMetrics
);

// ------------------------------------------------------------------------------
// School Management
// ------------------------------------------------------------------------------
platformRouter.get(
  '/schools',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SCHOOLS_READ),
  listSchools
);
platformRouter.post(
  '/schools',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SCHOOLS_CREATE),
  createSchool
);
platformRouter.get(
  '/schools/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SCHOOLS_READ),
  getSchoolById
);
platformRouter.patch(
  '/schools/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SCHOOLS_UPDATE),
  updateSchool
);
platformRouter.patch(
  '/schools/:id/status',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SCHOOLS_SUSPEND),
  updateSchoolStatus
);
platformRouter.get(
  '/schools/:id/export',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SCHOOLS_EXPORT),
  exportSchoolMetadata
);

// ------------------------------------------------------------------------------
// School Onboarding & Verification
// ------------------------------------------------------------------------------
platformRouter.post('/onboarding/apply', submitApplication);
platformRouter.get(
  '/onboarding',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ONBOARDING_READ),
  listApplications
);
platformRouter.get(
  '/onboarding/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ONBOARDING_READ),
  getApplicationById
);
platformRouter.post(
  '/onboarding/:id/review',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ONBOARDING_APPROVE),
  reviewApplication
);

// ------------------------------------------------------------------------------
// Deployments & Infrastructure
// ------------------------------------------------------------------------------
platformRouter.get(
  '/deployments',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.DEPLOYMENTS_READ),
  listDeployments
);
platformRouter.get(
  '/deployments/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.DEPLOYMENTS_READ),
  getDeploymentById
);
platformRouter.post(
  '/deployments/:id/action',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.DEPLOYMENTS_TRIGGER),
  triggerDeploymentAction
);
platformRouter.post(
  '/deployments/:id/maintenance',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.DEPLOYMENTS_MAINTENANCE),
  toggleMaintenanceMode
);

// ------------------------------------------------------------------------------
// Subscriptions & Plans
// ------------------------------------------------------------------------------
platformRouter.get(
  '/subscriptions',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUBSCRIPTIONS_READ),
  listSubscriptions
);
platformRouter.get(
  '/subscriptions/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUBSCRIPTIONS_READ),
  getSubscriptionById
);
platformRouter.post(
  '/subscriptions/:id/change-plan',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUBSCRIPTIONS_MANAGE),
  changeSubscriptionPlan
);

platformRouter.get('/plans', requirePlatformAuth, listPlans);
platformRouter.post(
  '/plans',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.PLANS_MANAGE),
  createPlan
);

// ------------------------------------------------------------------------------
// Billing & Invoices
// ------------------------------------------------------------------------------
platformRouter.get(
  '/billing/invoices',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.BILLING_READ),
  listInvoices
);
platformRouter.post(
  '/billing/invoices',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.BILLING_INVOICE_CREATE),
  createInvoice
);
platformRouter.post(
  '/billing/payments/manual',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.BILLING_PAYMENT_VERIFY),
  recordManualPayment
);
platformRouter.post('/billing/webhook', handleRazorpayWebhook);

// ------------------------------------------------------------------------------
// Releases & Updates
// ------------------------------------------------------------------------------
platformRouter.get(
  '/releases',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.RELEASES_READ),
  listReleases
);
platformRouter.post(
  '/releases',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.RELEASES_CREATE),
  createRelease
);
platformRouter.post(
  '/releases/:id/approve',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.RELEASES_APPROVE),
  approveRelease
);
platformRouter.post(
  '/releases/:id/rollout',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.RELEASES_ROLLOUT),
  rolloutRelease
);

// ------------------------------------------------------------------------------
// Support Center & Controlled Access
// ------------------------------------------------------------------------------
platformRouter.get(
  '/support/tickets',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_READ),
  listTickets
);
platformRouter.get(
  '/support/tickets/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_READ),
  getTicketById
);
platformRouter.post(
  '/support/tickets',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_READ),
  createTicket
);
platformRouter.post(
  '/support/tickets/:id/reply',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_REPLY),
  replyToTicket
);
platformRouter.post(
  '/support/tickets/:id/assign',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_ASSIGN),
  assignTicket
);
platformRouter.patch(
  '/support/tickets/:id/status',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_RESOLVE),
  updateTicketStatus
);

platformRouter.post(
  '/support/access/request',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_ACCESS_REQUEST),
  requestSupportAccess
);
platformRouter.post(
  '/support/access/:id/approve',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SUPPORT_ACCESS_APPROVE),
  approveSupportAccess
);

// ------------------------------------------------------------------------------
// CMS & Website Management
// ------------------------------------------------------------------------------
platformRouter.get(
  '/cms/pages',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.CMS_READ),
  listPages
);
platformRouter.get(
  '/cms/pages/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.CMS_READ),
  getPageById
);
platformRouter.post(
  '/cms/pages',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.CMS_WRITE),
  createPage
);
platformRouter.patch(
  '/cms/pages/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.CMS_WRITE),
  updatePage
);
platformRouter.post(
  '/cms/pages/:id/publish',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.CMS_PUBLISH),
  publishPage
);

// ------------------------------------------------------------------------------
// School Branding
// ------------------------------------------------------------------------------
platformRouter.get(
  '/schools/:schoolId/branding',
  requirePlatformAuth,
  getSchoolBranding
);
platformRouter.post(
  '/schools/:schoolId/branding',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.BRANDING_MANAGE),
  updateSchoolBranding
);

// ------------------------------------------------------------------------------
// Announcements
// ------------------------------------------------------------------------------
platformRouter.get(
  '/announcements',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ANNOUNCEMENTS_READ),
  listAnnouncements
);
platformRouter.post(
  '/announcements',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ANNOUNCEMENTS_CREATE),
  createAnnouncement
);

// ------------------------------------------------------------------------------
// Internal Users & Roles
// ------------------------------------------------------------------------------
platformRouter.get(
  '/internal-users',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.USERS_READ),
  listInternalUsers
);
platformRouter.post(
  '/internal-users',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.USERS_MANAGE),
  inviteInternalUser
);
platformRouter.patch(
  '/internal-users/:id',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.USERS_MANAGE),
  updateInternalUser
);
platformRouter.get(
  '/roles',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ROLES_MANAGE),
  listRoles
);

// ------------------------------------------------------------------------------
// Platform Analytics
// ------------------------------------------------------------------------------
platformRouter.get(
  '/analytics',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ANALYTICS_VIEW),
  getPlatformAnalytics
);

// ------------------------------------------------------------------------------
// Alerts & Operations
// ------------------------------------------------------------------------------
platformRouter.get(
  '/alerts',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ALERTS_READ),
  listAlerts
);
platformRouter.post(
  '/alerts',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ALERTS_READ),
  createAlert
);
platformRouter.patch(
  '/alerts/:id/status',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.ALERTS_ACKNOWLEDGE),
  updateAlertStatus
);

// ------------------------------------------------------------------------------
// Audit Logs
// ------------------------------------------------------------------------------
platformRouter.get(
  '/audit',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.AUDIT_READ),
  listAuditLogs
);
platformRouter.get(
  '/audit/export',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.AUDIT_EXPORT),
  exportAuditLogs
);

// ------------------------------------------------------------------------------
// Platform Settings
// ------------------------------------------------------------------------------
platformRouter.get(
  '/settings',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SYSTEM_CONFIG),
  listSettings
);
platformRouter.post(
  '/settings',
  requirePlatformAuth,
  requirePlatformPermission(PlatformPermissions.SYSTEM_CONFIG),
  updateSetting
);
