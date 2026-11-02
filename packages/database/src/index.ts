// ==============================================================================
// XyraTech School ERP — Database Clients & Multi-Tenant Connection Manager
// ==============================================================================

// @ts-ignore Generated clients will exist after prisma generate
import { PrismaClient as PlatformPrismaClient } from '../platform/client';
// @ts-ignore
import { PrismaClient as SchoolPrismaClient } from '../school/client';
import { decryptField } from '@xyratech/config';
import { AuditLogEntry } from '@xyratech/shared-types';

export { PlatformPrismaClient, SchoolPrismaClient };

// Platform Prisma Singleton
let platformPrisma: PlatformPrismaClient | null = null;

export function getPlatformPrisma(): PlatformPrismaClient {
  if (!platformPrisma) {
    platformPrisma = new PlatformPrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return platformPrisma;
}

// Default School Prisma Singleton (for dev or default tenant)
let defaultSchoolPrisma: SchoolPrismaClient | null = null;

export function getDefaultSchoolPrisma(): SchoolPrismaClient {
  if (!defaultSchoolPrisma) {
    defaultSchoolPrisma = new SchoolPrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return defaultSchoolPrisma;
}

/**
 * Multi-Tenant Isolated Database Connection Manager
 * Each school possesses a dedicated, isolated PostgreSQL database.
 */
class TenantConnectionManager {
  private static instance: TenantConnectionManager;
  private clientPool: Map<string, SchoolPrismaClient> = new Map();

  private constructor() {}

  public static getInstance(): TenantConnectionManager {
    if (!TenantConnectionManager.instance) {
      TenantConnectionManager.instance = new TenantConnectionManager();
    }
    return TenantConnectionManager.instance;
  }

  /**
   * Resolves or dynamically instantiates an isolated Prisma client for a specific school.
   */
  public async getClientForSchool(schoolId: string): Promise<SchoolPrismaClient> {
    if (this.clientPool.has(schoolId)) {
      return this.clientPool.get(schoolId)!;
    }

    const platformDb = getPlatformPrisma();
    const deployment = await platformDb.schoolDeployment.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });

    if (!deployment) {
      throw new Error(`No deployment metadata found for school tenant: ${schoolId}`);
    }

    const encUrl = deployment.databaseUrlEncrypted || '';
    let databaseUrl: string;
    try {
      databaseUrl = decryptField(encUrl);
    } catch {
      // In dev fallback, if not encrypted hex, use directly
      databaseUrl = encUrl;
    }

    const client = new SchoolPrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    this.clientPool.set(schoolId, client);
    return client;
  }

  /**
   * Directly registers or overrides a client for testing / dev mocking
   */
  public registerClient(schoolId: string, client: SchoolPrismaClient): void {
    this.clientPool.set(schoolId, client);
  }

  /**
   * Graceful cleanup of pooled connections
   */
  public async disconnectAll(): Promise<void> {
    for (const [id, client] of this.clientPool.entries()) {
      await client.$disconnect();
    }
    this.clientPool.clear();

    if (platformPrisma) {
      await platformPrisma.$disconnect();
      platformPrisma = null;
    }

    if (defaultSchoolPrisma) {
      await defaultSchoolPrisma.$disconnect();
      defaultSchoolPrisma = null;
    }
  }
}

export const tenantConnectionManager = TenantConnectionManager.getInstance();

/**
 * Standard Audit Log Helper for Platform
 */
export async function recordPlatformAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const db = getPlatformPrisma();
    await db.platformAuditLog.create({
      data: {
        actorId: entry.actorId || null,
        actorEmail: entry.actorEmail || null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId || null,
        outcome: entry.outcome === 'FAILURE' ? 'FAILURE' : 'SUCCESS',
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        details: (entry.details as any) || undefined,
        requestId: entry.requestId || null,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      },
    });
  } catch (err) {
    // Fail-safe: Audit failure should not crash transaction, but be logged
    console.error('Failed to write platform audit log:', err);
  }
}

/**
 * Standard Audit Log Helper for School Tenants
 */
export async function recordSchoolAudit(schoolDb: SchoolPrismaClient, entry: AuditLogEntry): Promise<void> {
  try {
    await schoolDb.auditLog.create({
      data: {
        actorId: entry.actorId || null,
        actorEmail: entry.actorEmail || null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId || null,
        outcome: entry.outcome === 'FAILURE' ? 'FAILURE' : 'SUCCESS',
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        details: (entry.details as any) || undefined,
        requestId: entry.requestId || null,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      },
    });
  } catch (err) {
    console.error('Failed to write school audit log:', err);
  }
}
