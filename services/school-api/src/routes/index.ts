import { Router } from 'express';
import {
  activateInvitation,
  login,
  logout,
  getMe,
  setupMfa,
  verifyMfaSetup,
} from '../controllers/auth.controller';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { listUsers, createUser, listRoles } from '../controllers/user.controller';
import { listAuditLogs } from '../controllers/audit.controller';
import { checkHealth } from '../controllers/health.controller';
import { requireSchoolAuth, requireSchoolPermission } from '../middleware/auth';
import { resolveSchoolTenant } from '../middleware/tenant';
import { rateLimiter } from '../middleware/security';
import { SchoolPermissions } from '@xyratech/permissions';
import { schoolOpenApiSpec } from '../openapi';

export const schoolRouter: Router = Router();

// Tenant resolution applies across all school endpoints
schoolRouter.use(resolveSchoolTenant);

// Health check
schoolRouter.get('/system/health', checkHealth);

// OpenAPI Spec
schoolRouter.get('/docs', (req, res) => {
  res.json(schoolOpenApiSpec);
});

// Invitation activation & Authentication
schoolRouter.post('/auth/activate-invitation', rateLimiter(20, 60 * 1000), activateInvitation);
schoolRouter.post('/auth/login', rateLimiter(20, 60 * 1000), login);
schoolRouter.post('/auth/logout', requireSchoolAuth, logout);
schoolRouter.get('/auth/me', requireSchoolAuth, getMe);
schoolRouter.post('/auth/mfa/setup', requireSchoolAuth, setupMfa);
schoolRouter.post('/auth/mfa/verify', requireSchoolAuth, verifyMfaSetup);

// School Profile
schoolRouter.get('/profile', requireSchoolAuth, requireSchoolPermission(SchoolPermissions.PROFILE_READ), getProfile);
schoolRouter.patch('/profile', requireSchoolAuth, requireSchoolPermission(SchoolPermissions.PROFILE_UPDATE), updateProfile);

// User & Role Management
schoolRouter.get('/users', requireSchoolAuth, requireSchoolPermission(SchoolPermissions.USERS_READ), listUsers);
schoolRouter.post('/users', requireSchoolAuth, requireSchoolPermission(SchoolPermissions.USERS_CREATE), createUser);
schoolRouter.get('/roles', requireSchoolAuth, requireSchoolPermission(SchoolPermissions.ROLES_MANAGE), listRoles);

// Audit Logs
schoolRouter.get('/audit-logs', requireSchoolAuth, requireSchoolPermission(SchoolPermissions.AUDIT_READ), listAuditLogs);
