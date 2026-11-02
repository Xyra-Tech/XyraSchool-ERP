import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  SchoolPermissions,
  PlatformPermissions,
  DefaultRoles,
} from '../../packages/permissions/src';

describe('RBAC & Permission Engine Tests', () => {
  it('should grant access when wildcard permission is present', () => {
    const principalPermissions = ['*'];

    expect(hasPermission(principalPermissions, SchoolPermissions.PROFILE_READ)).toBe(true);
    expect(hasPermission(principalPermissions, SchoolPermissions.USERS_CREATE)).toBe(true);
    expect(hasPermission(principalPermissions, SchoolPermissions.AUDIT_READ)).toBe(true);
  });

  it('should enforce exact resource and action permission check', () => {
    const teacherPermissions = [SchoolPermissions.PROFILE_READ, SchoolPermissions.USERS_READ];

    expect(hasPermission(teacherPermissions, SchoolPermissions.PROFILE_READ)).toBe(true);
    expect(hasPermission(teacherPermissions, SchoolPermissions.USERS_READ)).toBe(true);
    // Should NOT have privilege to delete or manage users
    expect(hasPermission(teacherPermissions, SchoolPermissions.USERS_DEACTIVATE)).toBe(false);
    expect(hasPermission(teacherPermissions, SchoolPermissions.ROLES_MANAGE)).toBe(false);
  });

  it('should check composite permissions correctly', () => {
    const adminPermissions = [
      SchoolPermissions.USERS_READ,
      SchoolPermissions.USERS_CREATE,
      SchoolPermissions.AUDIT_READ,
    ];

    expect(
      hasAllPermissions(adminPermissions, [
        SchoolPermissions.USERS_READ,
        SchoolPermissions.USERS_CREATE,
      ])
    ).toBe(true);

    expect(
      hasAllPermissions(adminPermissions, [
        SchoolPermissions.USERS_READ,
        SchoolPermissions.USERS_DEACTIVATE, // Not present
      ])
    ).toBe(false);

    expect(
      hasAnyPermission(adminPermissions, [
        SchoolPermissions.USERS_DEACTIVATE,
        SchoolPermissions.AUDIT_READ, // Present
      ])
    ).toBe(true);
  });

  it('should check role membership correctly', () => {
    const userRoles = [DefaultRoles.SCHOOL_ADMIN];

    expect(hasRole(userRoles, DefaultRoles.SCHOOL_ADMIN)).toBe(true);
    expect(hasRole(userRoles, DefaultRoles.SCHOOL_PRINCIPAL)).toBe(false);
    expect(hasRole(userRoles, DefaultRoles.PLATFORM_SUPER_ADMIN)).toBe(false);
  });
});
