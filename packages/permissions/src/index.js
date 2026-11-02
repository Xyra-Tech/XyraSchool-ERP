"use strict";
// ==============================================================================
// XyraTech School ERP — Reusable RBAC & Authorization Engine (Phase 2 Extended)
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSchoolRolePermissions = exports.DefaultPlatformRolePermissions = exports.DefaultRoles = exports.SchoolPermissions = exports.PlatformPermissions = void 0;
exports.hasPermission = hasPermission;
exports.hasAllPermissions = hasAllPermissions;
exports.hasAnyPermission = hasAnyPermission;
exports.hasRole = hasRole;
exports.PlatformPermissions = {
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
};
exports.SchoolPermissions = {
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
};
exports.DefaultRoles = {
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
};
/**
 * Standard Role-to-Permissions Mapping for Platform Roles
 */
exports.DefaultPlatformRolePermissions = {
    [exports.DefaultRoles.PLATFORM_SUPER_ADMIN]: Object.values(exports.PlatformPermissions),
    [exports.DefaultRoles.PLATFORM_ADMINISTRATOR]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.ANALYTICS_VIEW,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.SCHOOLS_CREATE,
        exports.PlatformPermissions.SCHOOLS_UPDATE,
        exports.PlatformPermissions.ONBOARDING_READ,
        exports.PlatformPermissions.ONBOARDING_CREATE,
        exports.PlatformPermissions.ONBOARDING_REVIEW,
        exports.PlatformPermissions.ONBOARDING_APPROVE,
        exports.PlatformPermissions.DEPLOYMENTS_READ,
        exports.PlatformPermissions.SUBSCRIPTIONS_READ,
        exports.PlatformPermissions.PLANS_READ,
        exports.PlatformPermissions.RELEASES_READ,
        exports.PlatformPermissions.SUPPORT_READ,
        exports.PlatformPermissions.CMS_READ,
        exports.PlatformPermissions.ANNOUNCEMENTS_READ,
        exports.PlatformPermissions.ANNOUNCEMENTS_CREATE,
        exports.PlatformPermissions.ALERTS_READ,
        exports.PlatformPermissions.ALERTS_ACKNOWLEDGE,
        exports.PlatformPermissions.USERS_READ,
        exports.PlatformPermissions.AUDIT_READ,
        exports.PlatformPermissions.SECURITY_READ,
    ],
    [exports.DefaultRoles.PLATFORM_FINANCE_MANAGER]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.ANALYTICS_VIEW,
        exports.PlatformPermissions.ANALYTICS_EXPORT,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.SUBSCRIPTIONS_READ,
        exports.PlatformPermissions.SUBSCRIPTIONS_MANAGE,
        exports.PlatformPermissions.PLANS_READ,
        exports.PlatformPermissions.PLANS_MANAGE,
        exports.PlatformPermissions.BILLING_READ,
        exports.PlatformPermissions.BILLING_INVOICE_CREATE,
        exports.PlatformPermissions.BILLING_PAYMENT_VERIFY,
        exports.PlatformPermissions.BILLING_REFUND,
        exports.PlatformPermissions.ALERTS_READ,
        exports.PlatformPermissions.AUDIT_READ,
    ],
    [exports.DefaultRoles.PLATFORM_SUBSCRIPTION_MANAGER]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.SUBSCRIPTIONS_READ,
        exports.PlatformPermissions.SUBSCRIPTIONS_MANAGE,
        exports.PlatformPermissions.PLANS_READ,
        exports.PlatformPermissions.PLANS_MANAGE,
        exports.PlatformPermissions.ENTITLEMENTS_MANAGE,
        exports.PlatformPermissions.BILLING_READ,
    ],
    [exports.DefaultRoles.PLATFORM_DEPLOYMENT_ENGINEER]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.DEPLOYMENTS_READ,
        exports.PlatformPermissions.DEPLOYMENTS_TRIGGER,
        exports.PlatformPermissions.DEPLOYMENTS_RETRY,
        exports.PlatformPermissions.DEPLOYMENTS_MAINTENANCE,
        exports.PlatformPermissions.DEPLOYMENTS_CONFIG,
        exports.PlatformPermissions.RELEASES_READ,
        exports.PlatformPermissions.ALERTS_READ,
        exports.PlatformPermissions.ALERTS_ACKNOWLEDGE,
        exports.PlatformPermissions.ALERTS_RESOLVE,
        exports.PlatformPermissions.AUDIT_READ,
    ],
    [exports.DefaultRoles.PLATFORM_RELEASE_MANAGER]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.DEPLOYMENTS_READ,
        exports.PlatformPermissions.RELEASES_READ,
        exports.PlatformPermissions.RELEASES_CREATE,
        exports.PlatformPermissions.RELEASES_APPROVE,
        exports.PlatformPermissions.RELEASES_ROLLOUT,
        exports.PlatformPermissions.RELEASES_ROLLBACK,
        exports.PlatformPermissions.ANNOUNCEMENTS_READ,
        exports.PlatformPermissions.ANNOUNCEMENTS_CREATE,
        exports.PlatformPermissions.ALERTS_READ,
        exports.PlatformPermissions.AUDIT_READ,
    ],
    [exports.DefaultRoles.PLATFORM_SUPPORT_MANAGER]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.SUPPORT_READ,
        exports.PlatformPermissions.SUPPORT_ASSIGN,
        exports.PlatformPermissions.SUPPORT_REPLY,
        exports.PlatformPermissions.SUPPORT_INTERNAL_NOTE,
        exports.PlatformPermissions.SUPPORT_ESCALATE,
        exports.PlatformPermissions.SUPPORT_RESOLVE,
        exports.PlatformPermissions.SUPPORT_ACCESS_REQUEST,
        exports.PlatformPermissions.SUPPORT_ACCESS_APPROVE,
        exports.PlatformPermissions.ALERTS_READ,
        exports.PlatformPermissions.AUDIT_READ,
    ],
    [exports.DefaultRoles.PLATFORM_SUPPORT_AGENT]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.SUPPORT_READ,
        exports.PlatformPermissions.SUPPORT_REPLY,
        exports.PlatformPermissions.SUPPORT_INTERNAL_NOTE,
        exports.PlatformPermissions.SUPPORT_ESCALATE,
        exports.PlatformPermissions.SUPPORT_RESOLVE,
        exports.PlatformPermissions.SUPPORT_ACCESS_REQUEST,
    ],
    [exports.DefaultRoles.PLATFORM_CONTENT_MANAGER]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.CMS_READ,
        exports.PlatformPermissions.CMS_WRITE,
        exports.PlatformPermissions.CMS_REVIEW,
        exports.PlatformPermissions.CMS_PUBLISH,
        exports.PlatformPermissions.BRANDING_MANAGE,
        exports.PlatformPermissions.ANNOUNCEMENTS_READ,
        exports.PlatformPermissions.ANNOUNCEMENTS_CREATE,
        exports.PlatformPermissions.ANNOUNCEMENTS_PUBLISH,
    ],
    [exports.DefaultRoles.PLATFORM_SECURITY_ADMINISTRATOR]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.USERS_READ,
        exports.PlatformPermissions.USERS_MANAGE,
        exports.PlatformPermissions.ROLES_MANAGE,
        exports.PlatformPermissions.AUDIT_READ,
        exports.PlatformPermissions.AUDIT_EXPORT,
        exports.PlatformPermissions.SECURITY_READ,
        exports.PlatformPermissions.SECURITY_MANAGE,
        exports.PlatformPermissions.ALERTS_READ,
        exports.PlatformPermissions.ALERTS_ACKNOWLEDGE,
        exports.PlatformPermissions.ALERTS_RESOLVE,
        exports.PlatformPermissions.ALERTS_ESCALATE,
        exports.PlatformPermissions.SUPPORT_ACCESS_APPROVE,
    ],
    [exports.DefaultRoles.PLATFORM_BUSINESS_ANALYST]: [
        exports.PlatformPermissions.DASHBOARD_VIEW,
        exports.PlatformPermissions.ANALYTICS_VIEW,
        exports.PlatformPermissions.ANALYTICS_EXPORT,
        exports.PlatformPermissions.SCHOOLS_READ,
        exports.PlatformPermissions.SUBSCRIPTIONS_READ,
        exports.PlatformPermissions.PLANS_READ,
        exports.PlatformPermissions.BILLING_READ,
        exports.PlatformPermissions.SUPPORT_READ,
    ],
};
/**
 * Standard Role-to-Permissions Mapping for Default School Roles
 */
exports.DefaultSchoolRolePermissions = {
    [exports.DefaultRoles.SCHOOL_PRINCIPAL]: Object.values(exports.SchoolPermissions),
    [exports.DefaultRoles.SCHOOL_ADMIN]: [
        exports.SchoolPermissions.PROFILE_READ,
        exports.SchoolPermissions.USERS_CREATE,
        exports.SchoolPermissions.USERS_READ,
        exports.SchoolPermissions.USERS_UPDATE,
        exports.SchoolPermissions.ROLES_MANAGE,
        exports.SchoolPermissions.AUDIT_READ,
        exports.SchoolPermissions.SYSTEM_SETTINGS_READ,
    ],
    [exports.DefaultRoles.SCHOOL_TEACHER]: [
        exports.SchoolPermissions.PROFILE_READ,
        exports.SchoolPermissions.USERS_READ,
    ],
    [exports.DefaultRoles.SCHOOL_STAFF]: [
        exports.SchoolPermissions.PROFILE_READ,
    ],
};
/**
 * Core Permission Evaluation Engine
 */
function hasPermission(userPermissions, requiredPermission) {
    if (!userPermissions || !Array.isArray(userPermissions))
        return false;
    if (userPermissions.includes('*'))
        return true;
    return userPermissions.includes(requiredPermission);
}
function hasAllPermissions(userPermissions, requiredPermissions) {
    if (!userPermissions || !Array.isArray(userPermissions))
        return false;
    if (userPermissions.includes('*'))
        return true;
    return requiredPermissions.every((perm) => hasPermission(userPermissions, perm));
}
function hasAnyPermission(userPermissions, requiredPermissions) {
    if (!userPermissions || !Array.isArray(userPermissions))
        return false;
    if (userPermissions.includes('*'))
        return true;
    return requiredPermissions.some((perm) => hasPermission(userPermissions, perm));
}
function hasRole(userRoles, requiredRole) {
    if (!userRoles || !Array.isArray(userRoles))
        return false;
    return userRoles.includes(requiredRole);
}
//# sourceMappingURL=index.js.map