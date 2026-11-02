// ==============================================================================
// XyraTech School ERP — Reusable RBAC & Authorization Engine (Phase 2 Extended)
// ==============================================================================

export const PlatformPermissions = {
  // Dashboard & Analytics
  DASHBOARD_VIEW: 'platform.dashboard.view',
  ANALYTICS_VIEW: 'platform.analytics.view',
  ANALYTICS_EXPORT: 'platform.analytics.export',

  // School Management
  SCHOOLS_READ: 'platform.schools.read',
  SCHOOLS_CREATE: 'platform.schools.create',
  SCHOOLS_UPDATE: 'platform.schools.update',
  SCHOOLS_SUSPEND: 'platform.schools.suspend',
  SCHOOLS_REACTIVATE: 'platform.schools.reactivate',
  SCHOOLS_CANCEL: 'platform.schools.cancel',
  SCHOOLS_EXPORT: 'platform.schools.export',

  // Onboarding
  ONBOARDING_READ: 'platform.onboarding.read',
  ONBOARDING_CREATE: 'platform.onboarding.create',
  ONBOARDING_REVIEW: 'platform.onboarding.review',
  ONBOARDING_APPROVE: 'platform.onboarding.approve',
  ONBOARDING_REJECT: 'platform.onboarding.reject',

  // Deployments
  DEPLOYMENTS_READ: 'platform.deployments.read',
  DEPLOYMENTS_TRIGGER: 'platform.deployments.trigger',
  DEPLOYMENTS_RETRY: 'platform.deployments.retry',
  DEPLOYMENTS_MAINTENANCE: 'platform.deployments.maintenance',
  DEPLOYMENTS_CONFIG: 'platform.deployments.config',

  // Subscriptions & Plans
  SUBSCRIPTIONS_READ: 'platform.subscriptions.read',
  SUBSCRIPTIONS_MANAGE: 'platform.subscriptions.manage',
  PLANS_READ: 'platform.plans.read',
  PLANS_MANAGE: 'platform.plans.manage',
  ENTITLEMENTS_MANAGE: 'platform.entitlements.manage',

  // Billing & Payments
  BILLING_READ: 'platform.billing.read',
  BILLING_INVOICE_CREATE: 'platform.billing.invoice.create',
  BILLING_PAYMENT_VERIFY: 'platform.billing.payment.verify',
  BILLING_REFUND: 'platform.billing.refund',

  // Releases
  RELEASES_READ: 'platform.releases.read',
  RELEASES_CREATE: 'platform.releases.create',
  RELEASES_APPROVE: 'platform.releases.approve',
  RELEASES_ROLLOUT: 'platform.releases.rollout',
  RELEASES_ROLLBACK: 'platform.releases.rollback',

  // Support
  SUPPORT_READ: 'platform.support.read',
  SUPPORT_ASSIGN: 'platform.support.assign',
  SUPPORT_REPLY: 'platform.support.reply',
  SUPPORT_INTERNAL_NOTE: 'platform.support.internal_note',
  SUPPORT_ESCALATE: 'platform.support.escalate',
  SUPPORT_RESOLVE: 'platform.support.resolve',
  SUPPORT_ACCESS_REQUEST: 'platform.support.access.request',
  SUPPORT_ACCESS_APPROVE: 'platform.support.access.approve',

  // CMS & Branding
  CMS_READ: 'platform.cms.read',
  CMS_WRITE: 'platform.cms.write',
  CMS_REVIEW: 'platform.cms.review',
  CMS_PUBLISH: 'platform.cms.publish',
  BRANDING_MANAGE: 'platform.branding.manage',

  // Announcements & Notifications
  ANNOUNCEMENTS_READ: 'platform.announcements.read',
  ANNOUNCEMENTS_CREATE: 'platform.announcements.create',
  ANNOUNCEMENTS_APPROVE: 'platform.announcements.approve',
  ANNOUNCEMENTS_PUBLISH: 'platform.announcements.publish',

  // Alerts
  ALERTS_READ: 'platform.alerts.read',
  ALERTS_ACKNOWLEDGE: 'platform.alerts.acknowledge',
  ALERTS_RESOLVE: 'platform.alerts.resolve',
  ALERTS_ESCALATE: 'platform.alerts.escalate',

  // Internal Users & Access
  USERS_READ: 'platform.users.read',
  USERS_MANAGE: 'platform.users.manage',
  ROLES_MANAGE: 'platform.roles.manage',

  // Audit & Security
  AUDIT_READ: 'platform.audit.read',
  AUDIT_EXPORT: 'platform.audit.export',
  SECURITY_READ: 'platform.security.read',
  SECURITY_MANAGE: 'platform.security.manage',

  // System Settings
  SYSTEM_CONFIG: 'platform.system.config',
} as const;

export type PlatformPermissionCode = (typeof PlatformPermissions)[keyof typeof PlatformPermissions];

export const SchoolPermissions = {
  PROFILE_READ: 'school.profile.read',
  PROFILE_UPDATE: 'school.profile.update',
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DEACTIVATE: 'users.deactivate',
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',
  AUDIT_READ: 'audit.read',
  SYSTEM_SETTINGS_READ: 'system.settings.read',
  SYSTEM_SETTINGS_UPDATE: 'system.settings.update',
} as const;

export type SchoolPermissionCode = (typeof SchoolPermissions)[keyof typeof SchoolPermissions];

export const DefaultRoles = {
  // Platform Roles (11 Standard Roles)
  PLATFORM_SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_ADMINISTRATOR: 'PLATFORM_ADMINISTRATOR',
  PLATFORM_FINANCE_MANAGER: 'FINANCE_MANAGER',
  PLATFORM_SUBSCRIPTION_MANAGER: 'SUBSCRIPTION_MANAGER',
  PLATFORM_DEPLOYMENT_ENGINEER: 'DEPLOYMENT_ENGINEER',
  PLATFORM_RELEASE_MANAGER: 'RELEASE_MANAGER',
  PLATFORM_SUPPORT_MANAGER: 'SUPPORT_MANAGER',
  PLATFORM_SUPPORT_AGENT: 'SUPPORT_AGENT',
  PLATFORM_CONTENT_MANAGER: 'CONTENT_MANAGER',
  PLATFORM_SECURITY_ADMINISTRATOR: 'SECURITY_ADMINISTRATOR',
  PLATFORM_BUSINESS_ANALYST: 'BUSINESS_ANALYST',

  // School Roles
  SCHOOL_PRINCIPAL: 'PRINCIPAL',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  SCHOOL_TEACHER: 'TEACHER',
  SCHOOL_STAFF: 'STAFF',
} as const;

/**
 * Standard Role-to-Permissions Mapping for Platform Roles
 */
export const DefaultPlatformRolePermissions: Record<string, string[]> = {
  [DefaultRoles.PLATFORM_SUPER_ADMIN]: Object.values(PlatformPermissions),

  [DefaultRoles.PLATFORM_ADMINISTRATOR]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.ANALYTICS_VIEW,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.SCHOOLS_CREATE,
    PlatformPermissions.SCHOOLS_UPDATE,
    PlatformPermissions.ONBOARDING_READ,
    PlatformPermissions.ONBOARDING_CREATE,
    PlatformPermissions.ONBOARDING_REVIEW,
    PlatformPermissions.ONBOARDING_APPROVE,
    PlatformPermissions.DEPLOYMENTS_READ,
    PlatformPermissions.SUBSCRIPTIONS_READ,
    PlatformPermissions.PLANS_READ,
    PlatformPermissions.RELEASES_READ,
    PlatformPermissions.SUPPORT_READ,
    PlatformPermissions.CMS_READ,
    PlatformPermissions.ANNOUNCEMENTS_READ,
    PlatformPermissions.ANNOUNCEMENTS_CREATE,
    PlatformPermissions.ALERTS_READ,
    PlatformPermissions.ALERTS_ACKNOWLEDGE,
    PlatformPermissions.USERS_READ,
    PlatformPermissions.AUDIT_READ,
    PlatformPermissions.SECURITY_READ,
  ],

  [DefaultRoles.PLATFORM_FINANCE_MANAGER]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.ANALYTICS_VIEW,
    PlatformPermissions.ANALYTICS_EXPORT,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.SUBSCRIPTIONS_READ,
    PlatformPermissions.SUBSCRIPTIONS_MANAGE,
    PlatformPermissions.PLANS_READ,
    PlatformPermissions.PLANS_MANAGE,
    PlatformPermissions.BILLING_READ,
    PlatformPermissions.BILLING_INVOICE_CREATE,
    PlatformPermissions.BILLING_PAYMENT_VERIFY,
    PlatformPermissions.BILLING_REFUND,
    PlatformPermissions.ALERTS_READ,
    PlatformPermissions.AUDIT_READ,
  ],

  [DefaultRoles.PLATFORM_SUBSCRIPTION_MANAGER]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.SUBSCRIPTIONS_READ,
    PlatformPermissions.SUBSCRIPTIONS_MANAGE,
    PlatformPermissions.PLANS_READ,
    PlatformPermissions.PLANS_MANAGE,
    PlatformPermissions.ENTITLEMENTS_MANAGE,
    PlatformPermissions.BILLING_READ,
  ],

  [DefaultRoles.PLATFORM_DEPLOYMENT_ENGINEER]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.DEPLOYMENTS_READ,
    PlatformPermissions.DEPLOYMENTS_TRIGGER,
    PlatformPermissions.DEPLOYMENTS_RETRY,
    PlatformPermissions.DEPLOYMENTS_MAINTENANCE,
    PlatformPermissions.DEPLOYMENTS_CONFIG,
    PlatformPermissions.RELEASES_READ,
    PlatformPermissions.ALERTS_READ,
    PlatformPermissions.ALERTS_ACKNOWLEDGE,
    PlatformPermissions.ALERTS_RESOLVE,
    PlatformPermissions.AUDIT_READ,
  ],

  [DefaultRoles.PLATFORM_RELEASE_MANAGER]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.DEPLOYMENTS_READ,
    PlatformPermissions.RELEASES_READ,
    PlatformPermissions.RELEASES_CREATE,
    PlatformPermissions.RELEASES_APPROVE,
    PlatformPermissions.RELEASES_ROLLOUT,
    PlatformPermissions.RELEASES_ROLLBACK,
    PlatformPermissions.ANNOUNCEMENTS_READ,
    PlatformPermissions.ANNOUNCEMENTS_CREATE,
    PlatformPermissions.ALERTS_READ,
    PlatformPermissions.AUDIT_READ,
  ],

  [DefaultRoles.PLATFORM_SUPPORT_MANAGER]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.SUPPORT_READ,
    PlatformPermissions.SUPPORT_ASSIGN,
    PlatformPermissions.SUPPORT_REPLY,
    PlatformPermissions.SUPPORT_INTERNAL_NOTE,
    PlatformPermissions.SUPPORT_ESCALATE,
    PlatformPermissions.SUPPORT_RESOLVE,
    PlatformPermissions.SUPPORT_ACCESS_REQUEST,
    PlatformPermissions.SUPPORT_ACCESS_APPROVE,
    PlatformPermissions.ALERTS_READ,
    PlatformPermissions.AUDIT_READ,
  ],

  [DefaultRoles.PLATFORM_SUPPORT_AGENT]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.SUPPORT_READ,
    PlatformPermissions.SUPPORT_REPLY,
    PlatformPermissions.SUPPORT_INTERNAL_NOTE,
    PlatformPermissions.SUPPORT_ESCALATE,
    PlatformPermissions.SUPPORT_RESOLVE,
    PlatformPermissions.SUPPORT_ACCESS_REQUEST,
  ],

  [DefaultRoles.PLATFORM_CONTENT_MANAGER]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.CMS_READ,
    PlatformPermissions.CMS_WRITE,
    PlatformPermissions.CMS_REVIEW,
    PlatformPermissions.CMS_PUBLISH,
    PlatformPermissions.BRANDING_MANAGE,
    PlatformPermissions.ANNOUNCEMENTS_READ,
    PlatformPermissions.ANNOUNCEMENTS_CREATE,
    PlatformPermissions.ANNOUNCEMENTS_PUBLISH,
  ],

  [DefaultRoles.PLATFORM_SECURITY_ADMINISTRATOR]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.USERS_READ,
    PlatformPermissions.USERS_MANAGE,
    PlatformPermissions.ROLES_MANAGE,
    PlatformPermissions.AUDIT_READ,
    PlatformPermissions.AUDIT_EXPORT,
    PlatformPermissions.SECURITY_READ,
    PlatformPermissions.SECURITY_MANAGE,
    PlatformPermissions.ALERTS_READ,
    PlatformPermissions.ALERTS_ACKNOWLEDGE,
    PlatformPermissions.ALERTS_RESOLVE,
    PlatformPermissions.ALERTS_ESCALATE,
    PlatformPermissions.SUPPORT_ACCESS_APPROVE,
  ],

  [DefaultRoles.PLATFORM_BUSINESS_ANALYST]: [
    PlatformPermissions.DASHBOARD_VIEW,
    PlatformPermissions.ANALYTICS_VIEW,
    PlatformPermissions.ANALYTICS_EXPORT,
    PlatformPermissions.SCHOOLS_READ,
    PlatformPermissions.SUBSCRIPTIONS_READ,
    PlatformPermissions.PLANS_READ,
    PlatformPermissions.BILLING_READ,
    PlatformPermissions.SUPPORT_READ,
  ],
};

/**
 * Standard Role-to-Permissions Mapping for Default School Roles
 */
export const DefaultSchoolRolePermissions: Record<string, string[]> = {
  [DefaultRoles.SCHOOL_PRINCIPAL]: Object.values(SchoolPermissions),
  [DefaultRoles.SCHOOL_ADMIN]: [
    SchoolPermissions.PROFILE_READ,
    SchoolPermissions.USERS_CREATE,
    SchoolPermissions.USERS_READ,
    SchoolPermissions.USERS_UPDATE,
    SchoolPermissions.ROLES_MANAGE,
    SchoolPermissions.AUDIT_READ,
    SchoolPermissions.SYSTEM_SETTINGS_READ,
  ],
  [DefaultRoles.SCHOOL_TEACHER]: [
    SchoolPermissions.PROFILE_READ,
    SchoolPermissions.USERS_READ,
  ],
  [DefaultRoles.SCHOOL_STAFF]: [
    SchoolPermissions.PROFILE_READ,
  ],
};

/**
 * Core Permission Evaluation Engine
 */
export function hasPermission(
  userPermissions: readonly string[] | string[],
  requiredPermission: string
): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}

export function hasAllPermissions(
  userPermissions: readonly string[] | string[],
  requiredPermissions: string[]
): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.every((perm) => hasPermission(userPermissions, perm));
}

export function hasAnyPermission(
  userPermissions: readonly string[] | string[],
  requiredPermissions: string[]
): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.some((perm) => hasPermission(userPermissions, perm));
}

export function hasRole(
  userRoles: readonly string[] | string[],
  requiredRole: string
): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes(requiredRole);
}
