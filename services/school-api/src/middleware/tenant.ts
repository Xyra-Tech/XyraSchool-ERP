import { Request, Response, NextFunction } from 'express';
import {
  SchoolPrismaClient,
  getDefaultSchoolPrisma,
  tenantConnectionManager,
  getPlatformPrisma,
} from '@xyratech/database';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      schoolDb: SchoolPrismaClient;
      schoolTenant?: {
        id: string;
        code: string;
      };
    }
  }
}

export async function resolveSchoolTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. If user is already authenticated via JWT, their school context is cryptographically signed
    let schoolId = req.user?.schoolId;
    let schoolCode = req.user?.schoolCode;

    // 2. For unauthenticated routes (e.g. login, activate-invitation), resolve via header or domain
    if (!schoolId) {
      const headerCode = req.headers['x-school-code'] as string;
      if (headerCode) {
        schoolCode = headerCode.toUpperCase();
      }
    }

    // 3. Fallback to default school DB for local dev or single-school container instance
    if (!schoolId && !schoolCode) {
      req.schoolDb = getDefaultSchoolPrisma();
      req.schoolTenant = {
        id: 'default-tenant',
        code: 'XYRA-DEMO-001',
      };
      return next();
    }

    // 4. If schoolCode is provided without schoolId, lookup in Platform DB
    if (!schoolId && schoolCode) {
      try {
        const platformDb = getPlatformPrisma();
        const school = await platformDb.school.findUnique({
          where: { code: schoolCode },
        });

        if (school) {
          schoolId = school.id;
        }
      } catch (err) {
        // In local standalone dev without platform DB active, proceed with default client
      }
    }

    if (schoolId) {
      try {
        req.schoolDb = await tenantConnectionManager.getClientForSchool(schoolId);
        req.schoolTenant = {
          id: schoolId,
          code: schoolCode || 'UNKNOWN',
        };
        return next();
      } catch {
        // Fallback to default school DB
        req.schoolDb = getDefaultSchoolPrisma();
        req.schoolTenant = {
          id: schoolId,
          code: schoolCode || 'DEFAULT',
        };
        return next();
      }
    }

    req.schoolDb = getDefaultSchoolPrisma();
    next();
  } catch (err: any) {
    sendError(res, 'Tenant resolution failed: ' + err.message, 500, 'TENANT_RESOLUTION_ERROR');
  }
}
