// ==============================================================================
// XyraTech School ERP — Shared Core Types & Interfaces (Phase 2 Extended)
// ==============================================================================

/**
 * Standard API Response Envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
    requestId?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * User Identity & Account Types
 */
export type UserType =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMINISTRATOR'
  | 'FINANCE_MANAGER'
  | 'SUBSCRIPTION_MANAGER'
  | 'DEPLOYMENT_ENGINEER'
  | 'RELEASE_MANAGER'
  | 'SUPPORT_MANAGER'
  | 'SUPPORT_AGENT'
  | 'CONTENT_MANAGER'
  | 'SECURITY_ADMINISTRATOR'
  | 'BUSINESS_ANALYST'
  | 'PRINCIPAL'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STAFF'
  | 'PARENT'
  | 'STUDENT';

export type AccountStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'DEACTIVATED' | 'LOCKED' | 'SUSPENDED';

export type DeploymentEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export type DeploymentHealth = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export type SchoolStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PROVISIONING'
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type OnboardingStatus =
  | 'APPLICATION_SUBMITTED'
  | 'VERIFICATION_PENDING'
  | 'DOCUMENT_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPLOYMENT_PROVISIONING'
  | 'DEPLOYMENT_HEALTH_CHECK'
  | 'PRINCIPAL_INVITATION_SENT'
  | 'SCHOOL_ACTIVATED';

export type DeploymentStatus =
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'PROVISIONING'
  | 'DEPLOYING'
  | 'MIGRATING'
  | 'HEALTH_CHECK'
  | 'HEALTHY'
  | 'FAILED'
  | 'MAINTENANCE'
  | 'SUSPENDED'
  | 'DECOMMISSIONING'
  | 'DECOMMISSIONED';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAYMENT_PENDING'
  | 'OVERDUE'
  | 'GRACE_PERIOD'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'VOID';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod =
  | 'RAZORPAY'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'CASH'
  | 'MANUAL';

export type ReleaseStatus =
  | 'DRAFT'
  | 'TESTING'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ROLLING_OUT'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'DEPRECATED';

export type TicketCategory =
  | 'TECHNICAL_ISSUE'
  | 'LOGIN_ACCESS'
  | 'BILLING'
  | 'DEPLOYMENT'
  | 'FEATURE_REQUEST'
  | 'DATA_ISSUE'
  | 'SECURITY_INCIDENT'
  | 'GENERAL_INQUIRY';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_SCHOOL'
  | 'WAITING_FOR_INTERNAL'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export type AlertSeverity = 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus =
  | 'TRIGGERED'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'DISMISSED';

/**
 * JWT Token Payload
 */
export interface AuthTokenPayload {
  sub: string;             // User ID
  email: string;
  userType: UserType;
  roles: string[];
  permissions: string[];
  schoolId?: string;       // Tenant scope (omitted for platform users)
  schoolCode?: string;
  sessionId?: string;
  isMfaVerified?: boolean;
}

/**
 * Authenticated Context for Requests
 */
export interface AuthenticatedUserContext {
  id: string;
  email: string;
  userType: UserType;
  roles: string[];
  permissions: string[];
  schoolId?: string;
  schoolCode?: string;
  sessionId?: string;
}

/**
 * Audit Logging Contract
 */
export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditLogEntry {
  id?: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: AuditOutcome;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  duration?: number;
  timestamp?: Date | string;
}

/**
 * School Onboarding DTOs
 */
export interface SchoolApplicationSubmitDto {
  schoolName: string;
  schoolType?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contactPhone: string;
  officialEmail: string;
  principalName: string;
  principalEmail: string;
  principalPhone?: string;
  expectedStudentCount?: number;
  requestedPlanCode?: string;
  requestedModules?: string[];
  notes?: string;
}

export interface SchoolApplicationReviewDto {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
  reason?: string;
  notes?: string;
}

/**
 * Deployment Orchestration DTOs
 */
export interface TriggerDeploymentDto {
  targetVersion?: string;
  environment?: DeploymentEnvironment;
  parameters?: Record<string, unknown>;
}

export interface DeploymentExecutionResult {
  jobId: string;
  deploymentId: string;
  status: 'COMPLETED' | 'FAILED';
  targetVersion: string;
  logs: string[];
  executedAt: string;
  healthStatus: DeploymentHealth;
}

/**
 * Subscription & Plan DTOs
 */
export interface CreatePlanDto {
  code: string;
  name: string;
  description?: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'CUSTOM';
  maxStudents: number;
  maxStaff: number;
  maxAdmins: number;
  storageLimitMb: number;
  aiUsageQuota?: number;
  parentPortal: boolean;
  mobileAccess: boolean;
  supportLevel: string;
  priceInCents: number;
  currency: string;
  entitlements?: { featureCode: string; limitValue?: number }[];
}

export interface AssignSubscriptionDto {
  schoolId: string;
  planId: string;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  agreedPriceInCents?: number;
  discountPercent?: number;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  notes?: string;
}

/**
 * Release Management DTOs
 */
export interface CreateReleaseDto {
  version: string;
  title: string;
  description?: string;
  releaseNotes?: string;
  isHotfix?: boolean;
  requiresDbMigration?: boolean;
  migrationNotes?: string;
  scheduledAt?: string;
}

/**
 * Support Ticket DTOs
 */
export interface CreateSupportTicketDto {
  schoolId?: string;
  requesterName: string;
  requesterEmail: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
}

export interface SupportReplyDto {
  content: string;
  isInternal?: boolean;
}

export interface SupportAccessRequestDto {
  schoolId: string;
  ticketId?: string;
  purpose: string;
  scopeDescription: string;
  accessLevel: 'READ_ONLY' | 'READ_WRITE';
  durationMinutes: number;
}

/**
 * Dashboard & Analytics DTOs
 */
export interface PlatformDashboardMetrics {
  schools: {
    total: number;
    active: number;
    trial: number;
    pendingOnboarding: number;
    suspended: number;
    cancelled: number;
    failedDeployments: number;
  };
  subscriptions: {
    active: number;
    expiringSoon: number;
    overdue: number;
    mrrInCents: number;
    arrInCents: number;
  };
  deployments: {
    healthy: number;
    unhealthy: number;
    inMaintenance: number;
    currentDefaultVersion: string;
  };
  support: {
    openTickets: number;
    criticalTickets: number;
    overdueSla: number;
    avgResolutionHours: number;
  };
  alerts: {
    criticalUnresolved: number;
    highUnresolved: number;
  };
}

/**
 * MFA Verification & Setup DTOs
 */
export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}
