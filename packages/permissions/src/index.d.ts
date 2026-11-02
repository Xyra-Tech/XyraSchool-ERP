export declare const PlatformPermissions: {
    readonly DASHBOARD_VIEW: "platform.dashboard.view";
    readonly ANALYTICS_VIEW: "platform.analytics.view";
    readonly ANALYTICS_EXPORT: "platform.analytics.export";
    readonly SCHOOLS_READ: "platform.schools.read";
    readonly SCHOOLS_CREATE: "platform.schools.create";
    readonly SCHOOLS_UPDATE: "platform.schools.update";
    readonly SCHOOLS_SUSPEND: "platform.schools.suspend";
    readonly SCHOOLS_REACTIVATE: "platform.schools.reactivate";
    readonly SCHOOLS_CANCEL: "platform.schools.cancel";
    readonly SCHOOLS_EXPORT: "platform.schools.export";
    readonly ONBOARDING_READ: "platform.onboarding.read";
    readonly ONBOARDING_CREATE: "platform.onboarding.create";
    readonly ONBOARDING_REVIEW: "platform.onboarding.review";
    readonly ONBOARDING_APPROVE: "platform.onboarding.approve";
    readonly ONBOARDING_REJECT: "platform.onboarding.reject";
    readonly DEPLOYMENTS_READ: "platform.deployments.read";
    readonly DEPLOYMENTS_TRIGGER: "platform.deployments.trigger";
    readonly DEPLOYMENTS_RETRY: "platform.deployments.retry";
    readonly DEPLOYMENTS_MAINTENANCE: "platform.deployments.maintenance";
    readonly DEPLOYMENTS_CONFIG: "platform.deployments.config";
    readonly SUBSCRIPTIONS_READ: "platform.subscriptions.read";
    readonly SUBSCRIPTIONS_MANAGE: "platform.subscriptions.manage";
    readonly PLANS_READ: "platform.plans.read";
    readonly PLANS_MANAGE: "platform.plans.manage";
    readonly ENTITLEMENTS_MANAGE: "platform.entitlements.manage";
    readonly BILLING_READ: "platform.billing.read";
    readonly BILLING_INVOICE_CREATE: "platform.billing.invoice.create";
    readonly BILLING_PAYMENT_VERIFY: "platform.billing.payment.verify";
    readonly BILLING_REFUND: "platform.billing.refund";
    readonly RELEASES_READ: "platform.releases.read";
    readonly RELEASES_CREATE: "platform.releases.create";
    readonly RELEASES_APPROVE: "platform.releases.approve";
    readonly RELEASES_ROLLOUT: "platform.releases.rollout";
    readonly RELEASES_ROLLBACK: "platform.releases.rollback";
    readonly SUPPORT_READ: "platform.support.read";
    readonly SUPPORT_ASSIGN: "platform.support.assign";
    readonly SUPPORT_REPLY: "platform.support.reply";
    readonly SUPPORT_INTERNAL_NOTE: "platform.support.internal_note";
    readonly SUPPORT_ESCALATE: "platform.support.escalate";
    readonly SUPPORT_RESOLVE: "platform.support.resolve";
    readonly SUPPORT_ACCESS_REQUEST: "platform.support.access.request";
    readonly SUPPORT_ACCESS_APPROVE: "platform.support.access.approve";
    readonly CMS_READ: "platform.cms.read";
    readonly CMS_WRITE: "platform.cms.write";
    readonly CMS_REVIEW: "platform.cms.review";
    readonly CMS_PUBLISH: "platform.cms.publish";
    readonly BRANDING_MANAGE: "platform.branding.manage";
    readonly ANNOUNCEMENTS_READ: "platform.announcements.read";
    readonly ANNOUNCEMENTS_CREATE: "platform.announcements.create";
    readonly ANNOUNCEMENTS_APPROVE: "platform.announcements.approve";
    readonly ANNOUNCEMENTS_PUBLISH: "platform.announcements.publish";
    readonly ALERTS_READ: "platform.alerts.read";
    readonly ALERTS_ACKNOWLEDGE: "platform.alerts.acknowledge";
    readonly ALERTS_RESOLVE: "platform.alerts.resolve";
    readonly ALERTS_ESCALATE: "platform.alerts.escalate";
    readonly USERS_READ: "platform.users.read";
    readonly USERS_MANAGE: "platform.users.manage";
    readonly ROLES_MANAGE: "platform.roles.manage";
    readonly AUDIT_READ: "platform.audit.read";
    readonly AUDIT_EXPORT: "platform.audit.export";
    readonly SECURITY_READ: "platform.security.read";
    readonly SECURITY_MANAGE: "platform.security.manage";
    readonly SYSTEM_CONFIG: "platform.system.config";
};
export type PlatformPermissionCode = (typeof PlatformPermissions)[keyof typeof PlatformPermissions];
export declare const SchoolPermissions: {
    readonly PROFILE_READ: "school.profile.read";
    readonly PROFILE_UPDATE: "school.profile.update";
    readonly USERS_CREATE: "users.create";
    readonly USERS_READ: "users.read";
    readonly USERS_UPDATE: "users.update";
    readonly USERS_DEACTIVATE: "users.deactivate";
    readonly ROLES_MANAGE: "roles.manage";
    readonly PERMISSIONS_MANAGE: "permissions.manage";
    readonly AUDIT_READ: "audit.read";
    readonly SYSTEM_SETTINGS_READ: "system.settings.read";
    readonly SYSTEM_SETTINGS_UPDATE: "system.settings.update";
};
export type SchoolPermissionCode = (typeof SchoolPermissions)[keyof typeof SchoolPermissions];
export declare const DefaultRoles: {
    readonly PLATFORM_SUPER_ADMIN: "SUPER_ADMIN";
    readonly PLATFORM_ADMINISTRATOR: "PLATFORM_ADMINISTRATOR";
    readonly PLATFORM_FINANCE_MANAGER: "FINANCE_MANAGER";
    readonly PLATFORM_SUBSCRIPTION_MANAGER: "SUBSCRIPTION_MANAGER";
    readonly PLATFORM_DEPLOYMENT_ENGINEER: "DEPLOYMENT_ENGINEER";
    readonly PLATFORM_RELEASE_MANAGER: "RELEASE_MANAGER";
    readonly PLATFORM_SUPPORT_MANAGER: "SUPPORT_MANAGER";
    readonly PLATFORM_SUPPORT_AGENT: "SUPPORT_AGENT";
    readonly PLATFORM_CONTENT_MANAGER: "CONTENT_MANAGER";
    readonly PLATFORM_SECURITY_ADMINISTRATOR: "SECURITY_ADMINISTRATOR";
    readonly PLATFORM_BUSINESS_ANALYST: "BUSINESS_ANALYST";
    readonly SCHOOL_PRINCIPAL: "PRINCIPAL";
    readonly SCHOOL_ADMIN: "SCHOOL_ADMIN";
    readonly SCHOOL_TEACHER: "TEACHER";
    readonly SCHOOL_STAFF: "STAFF";
};
/**
 * Standard Role-to-Permissions Mapping for Platform Roles
 */
export declare const DefaultPlatformRolePermissions: Record<string, string[]>;
/**
 * Standard Role-to-Permissions Mapping for Default School Roles
 */
export declare const DefaultSchoolRolePermissions: Record<string, string[]>;
/**
 * Core Permission Evaluation Engine
 */
export declare function hasPermission(userPermissions: readonly string[] | string[], requiredPermission: string): boolean;
export declare function hasAllPermissions(userPermissions: readonly string[] | string[], requiredPermissions: string[]): boolean;
export declare function hasAnyPermission(userPermissions: readonly string[] | string[], requiredPermissions: string[]): boolean;
export declare function hasRole(userRoles: readonly string[] | string[], requiredRole: string): boolean;
//# sourceMappingURL=index.d.ts.map