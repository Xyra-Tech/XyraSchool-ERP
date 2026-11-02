// ==============================================================================
// XyraTech School ERP — Shared Zod Validation Schemas (Phase 2 Extended)
// ==============================================================================

import { z } from 'zod';

export const PasswordValidation = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ------------------------------------------------------------------------------
// Authentication & MFA
// ------------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().length(6, 'MFA code must be 6 digits').optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const MfaVerifySchema = z.object({
  code: z.string().length(6, 'MFA code must be 6 digits').regex(/^\d+$/, 'Must be numeric'),
});
export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

export const MfaSetupVerifySchema = z.object({
  secret: z.string().min(16, 'Invalid secret length'),
  code: z.string().length(6, 'MFA code must be 6 digits').regex(/^\d+$/, 'Must be numeric'),
});
export type MfaSetupVerifyInput = z.infer<typeof MfaSetupVerifySchema>;

export const InvitationActivationSchema = z
  .object({
    token: z.string().min(1, 'Invitation token is required'),
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    password: PasswordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type InvitationActivationInput = z.infer<typeof InvitationActivationSchema>;

export const SchoolProvisioningSchema = z.object({
  code: z
    .string()
    .min(3, 'School code must be at least 3 characters')
    .max(20, 'School code cannot exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'School code must only contain uppercase letters, numbers, and hyphens')
    .toUpperCase()
    .trim(),
  name: z.string().min(3, 'School name must be at least 3 characters').trim(),
  officialEmail: z.string().email('Invalid official school email').toLowerCase().trim(),
  contactPhone: z.string().min(7, 'Invalid phone number').max(20).trim(),
  address: z.string().optional(),
  principalEmail: z.string().email('Invalid principal email').toLowerCase().trim(),
  principalFirstName: z.string().min(1, 'Principal first name is required').trim(),
  principalLastName: z.string().min(1, 'Principal last name is required').trim(),
  planCode: z.string().default('STARTER'),
  academicYearStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  academicYearEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
});
export type SchoolProvisioningInput = z.infer<typeof SchoolProvisioningSchema>;

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  userType: z.enum(['SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'PRINCIPAL']),
  roleCode: z.string().min(1, 'Role code is required'),
  phoneNumber: z.string().optional(),
});
export type UserCreateInput = z.infer<typeof UserCreateSchema>;

export const RecoveryCodeVerifySchema = z.object({
  recoveryCode: z.string().min(8, 'Invalid recovery code format').trim(),
});
export type RecoveryCodeVerifyInput = z.infer<typeof RecoveryCodeVerifySchema>;

// ------------------------------------------------------------------------------
// School Onboarding & Applications
// ------------------------------------------------------------------------------

export const SchoolApplicationSubmitSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters').trim(),
  schoolType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  contactPhone: z.string().min(7, 'Invalid phone number').max(20).trim(),
  officialEmail: z.string().email('Invalid official school email').toLowerCase().trim(),
  principalName: z.string().min(1, 'Principal name is required').trim(),
  principalEmail: z.string().email('Invalid principal email').toLowerCase().trim(),
  principalPhone: z.string().optional(),
  expectedStudentCount: z.number().int().positive().optional(),
  requestedPlanCode: z.string().default('STARTER'),
  requestedModules: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type SchoolApplicationSubmitInput = z.infer<typeof SchoolApplicationSubmitSchema>;

export const SchoolApplicationReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_INFO']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});
export type SchoolApplicationReviewInput = z.infer<typeof SchoolApplicationReviewSchema>;

// ------------------------------------------------------------------------------
// School Profile & Management
// ------------------------------------------------------------------------------

export const SchoolUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  schoolType: z.string().optional(),
  officialEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  domain: z.string().optional(),
  expectedStudentCount: z.number().int().optional(),
});
export type SchoolUpdateInput = z.infer<typeof SchoolUpdateSchema>;

export const SchoolStatusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'ARCHIVED']),
  reason: z.string().optional(),
});

// ------------------------------------------------------------------------------
// Deployments
// ------------------------------------------------------------------------------

export const TriggerDeploymentSchema = z.object({
  targetVersion: z.string().optional(),
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']).default('PRODUCTION'),
  parameters: z.record(z.unknown()).optional(),
});
export type TriggerDeploymentInput = z.infer<typeof TriggerDeploymentSchema>;

export const DeploymentMaintenanceSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().optional(),
});

// ------------------------------------------------------------------------------
// Subscriptions & Plans
// ------------------------------------------------------------------------------

export const CreatePlanSchema = z.object({
  code: z.string().min(2).max(30).toUpperCase().regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'CUSTOM']).default('ANNUAL'),
  maxStudents: z.number().int().positive().default(500),
  maxStaff: z.number().int().positive().default(50),
  maxAdmins: z.number().int().positive().default(5),
  storageLimitMb: z.number().int().positive().default(10240),
  aiUsageQuota: z.number().int().nonnegative().optional(),
  parentPortal: z.boolean().default(true),
  mobileAccess: z.boolean().default(true),
  supportLevel: z.string().default('STANDARD'),
  priceInCents: z.number().int().nonnegative().default(0),
  currency: z.string().default('INR'),
  isCustom: z.boolean().default(false),
  entitlements: z
    .array(
      z.object({
        featureCode: z.string(),
        isEnabled: z.boolean().default(true),
        limitValue: z.number().int().optional(),
      })
    )
    .optional(),
});
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;

export const AssignSubscriptionSchema = z.object({
  schoolId: z.string().uuid(),
  planId: z.string().uuid(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'CUSTOM']).default('ANNUAL'),
  startDate: z.string().optional(),
  endDate: z.string(),
  agreedPriceInCents: z.number().int().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  billingContactName: z.string().optional(),
  billingContactEmail: z.string().email().optional(),
  billingContactPhone: z.string().optional(),
  notes: z.string().optional(),
});
export type AssignSubscriptionInput = z.infer<typeof AssignSubscriptionSchema>;

// ------------------------------------------------------------------------------
// Billing & Invoices
// ------------------------------------------------------------------------------

export const CreateInvoiceSchema = z.object({
  subscriptionId: z.string().uuid(),
  subtotalInCents: z.number().int().positive(),
  discountInCents: z.number().int().nonnegative().default(0),
  taxInCents: z.number().int().nonnegative().default(0),
  totalInCents: z.number().int().positive(),
  periodStart: z.string(),
  periodEnd: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
  lineItems: z.array(z.record(z.unknown())).optional(),
});

export const RecordManualPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amountInCents: z.number().int().positive(),
  method: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'MANUAL']).default('BANK_TRANSFER'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const RefundRequestSchema = z.object({
  invoiceId: z.string().uuid(),
  amountInCents: z.number().int().positive(),
  reason: z.string().min(5),
});

// ------------------------------------------------------------------------------
// Releases
// ------------------------------------------------------------------------------

export const CreateReleaseSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'Must follow semantic versioning (e.g. 1.2.0)'),
  title: z.string().min(3),
  description: z.string().optional(),
  releaseNotes: z.string().optional(),
  isHotfix: z.boolean().default(false),
  requiresDbMigration: z.boolean().default(false),
  migrationNotes: z.string().optional(),
  scheduledAt: z.string().optional(),
});
export type CreateReleaseInput = z.infer<typeof CreateReleaseSchema>;

export const RolloutReleaseSchema = z.object({
  schoolIds: z.array(z.string().uuid()).optional(), // If omitted, staged to all eligible
  isPilot: z.boolean().default(false),
});

// ------------------------------------------------------------------------------
// Support
// ------------------------------------------------------------------------------

export const CreateSupportTicketSchema = z.object({
  schoolId: z.string().uuid().optional(),
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  category: z.enum([
    'TECHNICAL_ISSUE',
    'LOGIN_ACCESS',
    'BILLING',
    'DEPLOYMENT',
    'FEATURE_REQUEST',
    'DATA_ISSUE',
    'SECURITY_INCIDENT',
    'GENERAL_INQUIRY',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  subject: z.string().min(3),
  description: z.string().min(5),
});
export type CreateSupportTicketInput = z.infer<typeof CreateSupportTicketSchema>;

export const SupportReplySchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().default(false),
});

export const SupportAssignSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
  assignedTeam: z.string().optional(),
});

export const SupportStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_FOR_SCHOOL',
    'WAITING_FOR_INTERNAL',
    'ESCALATED',
    'RESOLVED',
    'CLOSED',
  ]),
  resolutionNotes: z.string().optional(),
});

export const SupportAccessRequestSchema = z.object({
  schoolId: z.string().uuid(),
  ticketId: z.string().uuid().optional(),
  purpose: z.string().min(5),
  scopeDescription: z.string().min(5),
  accessLevel: z.enum(['READ_ONLY', 'READ_WRITE']).default('READ_ONLY'),
  durationMinutes: z.number().int().min(15).max(480).default(60),
});

// ------------------------------------------------------------------------------
// CMS & Branding
// ------------------------------------------------------------------------------

export const CreateCMSPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric and hyphens'),
  title: z.string().min(2),
  pageType: z.enum(['PAGE', 'BLOG', 'FAQ', 'HELP']).default('PAGE'),
  content: z.record(z.unknown()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).default('DRAFT'),
});

export const SchoolBrandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  loginBannerUrl: z.string().url().optional().or(z.literal('')),
  dashboardLogoUrl: z.string().url().optional().or(z.literal('')),
  contactInfo: z.record(z.unknown()).optional(),
  isPublished: z.boolean().default(false),
});

// ------------------------------------------------------------------------------
// Announcements & Alerts
// ------------------------------------------------------------------------------

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  type: z.enum([
    'GENERAL',
    'MAINTENANCE',
    'RELEASE_UPDATE',
    'SECURITY_ADVISORY',
    'BILLING_REMINDER',
    'PRODUCT_UPDATE',
    'EMERGENCY_NOTICE',
  ]).default('GENERAL'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  channels: z.array(z.string()).default(['IN_APP']),
  targets: z.array(
    z.object({
      targetType: z.enum(['ALL_SCHOOLS', 'SPECIFIC_SCHOOL', 'PLAN', 'VERSION', 'INTERNAL']),
      targetValue: z.string().optional(),
      schoolId: z.string().uuid().optional(),
    })
  ).default([{ targetType: 'ALL_SCHOOLS' }]),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const CreateAlertSchema = z.object({
  category: z.enum([
    'SCHOOL_ONBOARDING',
    'PAYMENT_FAILURE',
    'SUBSCRIPTION_EXPIRY',
    'DEPLOYMENT_FAILURE',
    'RELEASE_FAILURE',
    'INFRASTRUCTURE_OUTAGE',
    'SECURITY_INCIDENT',
    'SUPPORT_SLA_BREACH',
    'BACKUP_FAILURE',
    'AI_QUOTA_THRESHOLD',
  ]),
  severity: z.enum(['INFORMATIONAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  title: z.string().min(3),
  message: z.string().min(5),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateAlertStatusSchema = z.object({
  status: z.enum(['TRIGGERED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'ESCALATED', 'DISMISSED']),
  notes: z.string().optional(),
});

// ------------------------------------------------------------------------------
// Internal Users & Roles
// ------------------------------------------------------------------------------

export const InviteInternalUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roleName: z.enum([
    'SUPER_ADMIN',
    'PLATFORM_ADMINISTRATOR',
    'FINANCE_MANAGER',
    'SUBSCRIPTION_MANAGER',
    'DEPLOYMENT_ENGINEER',
    'RELEASE_MANAGER',
    'SUPPORT_MANAGER',
    'SUPPORT_AGENT',
    'CONTENT_MANAGER',
    'SECURITY_ADMINISTRATOR',
    'BUSINESS_ANALYST',
  ]),
  departmentId: z.string().uuid().optional(),
  phoneNumber: z.string().optional(),
});

export const UpdatePlatformUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().uuid().nullable().optional(),
});

export const PlatformSettingSchema = z.object({
  key: z.string().min(2),
  value: z.unknown(),
  category: z.string().default('GENERAL'),
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
});
