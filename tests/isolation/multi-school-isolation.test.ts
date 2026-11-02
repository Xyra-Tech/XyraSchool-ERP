import { describe, it, expect } from 'vitest';
import { tenantConnectionManager } from '../../packages/database/src';
import { encryptField, decryptField } from '../../packages/config/src';

describe('Multi-School Database & Tenant Isolation Tests', () => {
  it('should encrypt and isolate school connection strings independently', () => {
    const schoolA_Db = 'postgresql://postgres:pass@localhost:5432/xyratech_school_a';
    const schoolB_Db = 'postgresql://postgres:pass@localhost:5432/xyratech_school_b';

    const encA = encryptField(schoolA_Db);
    const encB = encryptField(schoolB_Db);

    expect(encA).not.toEqual(encB);
    expect(decryptField(encA)).toBe(schoolA_Db);
    expect(decryptField(encB)).toBe(schoolB_Db);
  });

  it('should manage discrete isolated clients per tenant ID in connection manager', () => {
    // Mock clients for tenant A and tenant B
    const mockClientA: any = { tenant: 'school-a', $disconnect: async () => {} };
    const mockClientB: any = { tenant: 'school-b', $disconnect: async () => {} };

    tenantConnectionManager.registerClient('tenant-a', mockClientA);
    tenantConnectionManager.registerClient('tenant-b', mockClientB);

    // Verify isolation
    expect(tenantConnectionManager['clientPool'].get('tenant-a')).toBe(mockClientA);
    expect(tenantConnectionManager['clientPool'].get('tenant-b')).toBe(mockClientB);
    expect(tenantConnectionManager['clientPool'].get('tenant-a')).not.toBe(
      tenantConnectionManager['clientPool'].get('tenant-b')
    );
  });
});
