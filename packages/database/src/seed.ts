// ==============================================================================
// XyraTech School ERP — Development Database Seeder (Phase 2 Extended)
// ==============================================================================
// NOTE: For local development and staging testing ONLY. Production accounts must be
// provisioned via secure invitations and verified channels.

import { hashPassword, encryptField } from '@xyratech/config';
import {
  PlatformPermissions,
  SchoolPermissions,
  DefaultRoles,
  DefaultSchoolRolePermissions,
  DefaultPlatformRolePermissions,
} from '@xyratech/permissions';
import { getPlatformPrisma, getDefaultSchoolPrisma, tenantConnectionManager } from './index';

async function seed() {
  console.log('🌱 Starting Development Database Seeding (Phase 2)...');

  const platformDb = getPlatformPrisma();
  const schoolDb = getDefaultSchoolPrisma();

  // ----------------------------------------------------------------------------
  // 1. Seed Platform Permissions & All 11 Roles
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Platform Permissions...');
  for (const [, code] of Object.entries(PlatformPermissions) as [string, string][]) {
    await platformDb.platformPermission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        description: `Permission to ${code.replace(/\./g, ' ')}`,
        module: code.split('.')[1] || 'general',
      },
    });
  }

  console.log('--> Seeding Platform Departments...');
  const departments = ['Engineering', 'Support & Success', 'Finance & Billing', 'Product & Content', 'Security & Compliance'];
  const departmentMap = new Map<string, string>();
  for (const deptName of departments) {
    const dept = await platformDb.internalDepartment.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName, description: `${deptName} department at XyraTech` },
    });
    departmentMap.set(deptName, dept.id);
  }

  console.log('--> Seeding Platform Roles...');
  for (const [roleKey, roleName] of Object.entries(DefaultRoles) as [string, string][]) {
    if (!roleKey.startsWith('PLATFORM_')) continue;

    const role = await platformDb.platformRole.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        displayName: roleName.replace(/_/g, ' '),
        description: `Built-in platform role for ${roleName.replace(/_/g, ' ')}`,
        isSystem: true,
      },
    });

    // Link permissions
    const permissionsForRole = DefaultPlatformRolePermissions[roleName] || [];
    for (const permCode of permissionsForRole) {
      const perm = await platformDb.platformPermission.findUnique({ where: { code: permCode } });
      if (perm) {
        await platformDb.platformRolePermission.upsert({
          where: {
            platformRoleId_platformPermissionId: {
              platformRoleId: role.id,
              platformPermissionId: perm.id,
            },
          },
          update: {},
          create: {
            platformRoleId: role.id,
            platformPermissionId: perm.id,
          },
        });
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 2. Seed Default Development Platform Users
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Dev Super Admin (superadmin@xyratech.internal)...');
  const superAdminRole = await platformDb.platformRole.findUnique({
    where: { name: DefaultRoles.PLATFORM_SUPER_ADMIN },
  });

  const devAdminPasswordHash = await hashPassword('SuperAdmin@Xyra2026!');
  const superAdmin = await platformDb.platformUser.upsert({
    where: { email: 'superadmin@xyratech.internal' },
    update: {
      passwordHash: devAdminPasswordHash,
      isActive: true,
      isSuperAdmin: true,
      departmentId: departmentMap.get('Engineering'),
    },
    create: {
      email: 'superadmin@xyratech.internal',
      firstName: 'Platform',
      lastName: 'SuperAdmin',
      passwordHash: devAdminPasswordHash,
      isActive: true,
      isSuperAdmin: true,
      mfaEnabled: false,
      departmentId: departmentMap.get('Engineering'),
    },
  });

  if (superAdminRole) {
    await platformDb.platformUserRole.upsert({
      where: {
        platformUserId_platformRoleId: {
          platformUserId: superAdmin.id,
          platformRoleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        platformUserId: superAdmin.id,
        platformRoleId: superAdminRole.id,
      },
    });
  }

  // Support Agent Dev User
  const supportRole = await platformDb.platformRole.findUnique({
    where: { name: DefaultRoles.PLATFORM_SUPPORT_AGENT },
  });
  const devSupport = await platformDb.platformUser.upsert({
    where: { email: 'support@xyratech.internal' },
    update: {
      passwordHash: devAdminPasswordHash,
      departmentId: departmentMap.get('Support & Success'),
    },
    create: {
      email: 'support@xyratech.internal',
      firstName: 'Sarah',
      lastName: 'Support',
      passwordHash: devAdminPasswordHash,
      isActive: true,
      isSuperAdmin: false,
      departmentId: departmentMap.get('Support & Success'),
    },
  });
  if (supportRole) {
    await platformDb.platformUserRole.upsert({
      where: {
        platformUserId_platformRoleId: {
          platformUserId: devSupport.id,
          platformRoleId: supportRole.id,
        },
      },
      update: {},
      create: {
        platformUserId: devSupport.id,
        platformRoleId: supportRole.id,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // 3. Seed Subscription Plans & Entitlements
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Subscription Plans & Entitlements...');
  const plans = [
    {
      code: 'BASIC',
      name: 'Basic School Plan',
      description: 'Ideal for small community schools and primary academies',
      billingCycle: 'ANNUAL' as const,
      maxStudents: 300,
      maxStaff: 30,
      maxAdmins: 3,
      storageLimitMb: 5120,
      aiUsageQuota: 1000,
      parentPortal: true,
      mobileAccess: false,
      supportLevel: 'BASIC',
      priceInCents: 4500000,
      features: ['CORE_ERP', 'ACADEMICS', 'ATTENDANCE', 'FEES', 'PARENT_PORTAL'],
    },
    {
      code: 'STANDARD',
      name: 'Standard Institution',
      description: 'Complete ERP suite for growing K-12 institutions',
      billingCycle: 'ANNUAL' as const,
      maxStudents: 1500,
      maxStaff: 120,
      maxAdmins: 8,
      storageLimitMb: 20480,
      aiUsageQuota: 5000,
      parentPortal: true,
      mobileAccess: true,
      supportLevel: 'STANDARD',
      priceInCents: 12000000,
      features: [
        'CORE_ERP',
        'ACADEMICS',
        'ATTENDANCE',
        'EXAMINATIONS',
        'FEES',
        'HR_PAYROLL',
        'PARENT_PORTAL',
        'MOBILE_APP',
        'LIBRARY',
      ],
    },
    {
      code: 'PROFESSIONAL',
      name: 'Professional Campus',
      description: 'Advanced operations, fleet tracking, and automated workflows',
      billingCycle: 'ANNUAL' as const,
      maxStudents: 4000,
      maxStaff: 350,
      maxAdmins: 15,
      storageLimitMb: 51200,
      aiUsageQuota: 20000,
      parentPortal: true,
      mobileAccess: true,
      supportLevel: 'PRIORITY',
      priceInCents: 24000000,
      features: [
        'CORE_ERP',
        'ACADEMICS',
        'ATTENDANCE',
        'EXAMINATIONS',
        'FEES',
        'HR_PAYROLL',
        'PARENT_PORTAL',
        'MOBILE_APP',
        'LIBRARY',
        'TRANSPORT',
        'INVENTORY',
        'AI_ANALYTICS',
      ],
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise Multi-Campus',
      description: 'Dedicated cloud resources, custom integrations and 24/7 SLA',
      billingCycle: 'ANNUAL' as const,
      maxStudents: 15000,
      maxStaff: 1000,
      maxAdmins: 50,
      storageLimitMb: 204800,
      aiUsageQuota: 100000,
      parentPortal: true,
      mobileAccess: true,
      supportLevel: 'DEDICATED',
      priceInCents: 48000000,
      features: [
        'CORE_ERP',
        'ACADEMICS',
        'ATTENDANCE',
        'EXAMINATIONS',
        'FEES',
        'HR_PAYROLL',
        'PARENT_PORTAL',
        'MOBILE_APP',
        'LIBRARY',
        'TRANSPORT',
        'INVENTORY',
        'AI_ANALYTICS',
        'ADVANCED_SECURITY',
        'CUSTOM_INTEGRATIONS',
      ],
    },
  ];

  const planEntityMap = new Map<string, any>();
  for (const p of plans) {
    const plan = await platformDb.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        maxStudents: p.maxStudents,
        maxStaff: p.maxStaff,
        maxAdmins: p.maxAdmins,
        storageLimitMb: p.storageLimitMb,
        aiUsageQuota: p.aiUsageQuota,
        parentPortal: p.parentPortal,
        mobileAccess: p.mobileAccess,
        supportLevel: p.supportLevel,
        priceInCents: p.priceInCents,
      },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        billingCycle: p.billingCycle,
        maxStudents: p.maxStudents,
        maxStaff: p.maxStaff,
        maxAdmins: p.maxAdmins,
        storageLimitMb: p.storageLimitMb,
        aiUsageQuota: p.aiUsageQuota,
        parentPortal: p.parentPortal,
        mobileAccess: p.mobileAccess,
        supportLevel: p.supportLevel,
        priceInCents: p.priceInCents,
        currency: 'INR',
        isActive: true,
      },
    });
    planEntityMap.set(p.code, plan);

    for (const f of p.features) {
      await platformDb.featureEntitlement.upsert({
        where: {
          planId_featureCode: {
            planId: plan.id,
            featureCode: f,
          },
        },
        update: {},
        create: {
          planId: plan.id,
          featureCode: f,
          featureName: f.replace(/_/g, ' '),
          isEnabled: true,
        },
      });
    }
  }

  // ----------------------------------------------------------------------------
  // 4. Seed Sample Schools, Deployments & Subscriptions
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Sample Schools & Deployments...');
  const sampleSchools = [
    {
      code: 'XYRA-SCH-001',
      name: 'Delhi Public Academy',
      officialEmail: 'admin@delhipublicacademy.edu',
      contactPhone: '+91 98111 22233',
      city: 'New Delhi',
      state: 'Delhi',
      status: 'ACTIVE' as const,
      domain: 'dpa.xyraschool.com',
      planCode: 'STANDARD',
    },
    {
      code: 'XYRA-SCH-002',
      name: 'St. Xavier International School',
      officialEmail: 'info@stxavier-school.org',
      contactPhone: '+91 98222 33344',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'ACTIVE' as const,
      domain: 'stxavier.xyraschool.com',
      planCode: 'PROFESSIONAL',
    },
    {
      code: 'XYRA-SCH-003',
      name: 'Greenfield Global School',
      officialEmail: 'principal@greenfieldglobal.in',
      contactPhone: '+91 98333 44455',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: 'ACTIVE' as const,
      domain: 'greenfield.xyraschool.com',
      planCode: 'ENTERPRISE',
    },
    {
      code: 'XYRA-SCH-004',
      name: 'Sunrise Public High School',
      officialEmail: 'contact@sunrisepublic.edu',
      contactPhone: '+91 98444 55566',
      city: 'Hyderabad',
      state: 'Telangana',
      status: 'SUSPENDED' as const,
      domain: 'sunrise.xyraschool.com',
      planCode: 'BASIC',
    },
    {
      code: 'XYRA-SCH-005',
      name: 'Modern Heritage Academy',
      officialEmail: 'office@modernheritage.org',
      contactPhone: '+91 98555 66677',
      city: 'Pune',
      state: 'Maharashtra',
      status: 'PENDING_APPROVAL' as const,
      planCode: 'STANDARD',
    },
  ];

  for (const s of sampleSchools) {
    const school = await platformDb.school.upsert({
      where: { code: s.code },
      update: {
        status: s.status,
        domain: s.domain,
      },
      create: {
        code: s.code,
        name: s.name,
        officialEmail: s.officialEmail,
        contactPhone: s.contactPhone,
        city: s.city,
        state: s.state,
        country: 'India',
        status: s.status,
        domain: s.domain,
        activatedAt: s.status === 'ACTIVE' ? new Date() : null,
      },
    });

    const chosenPlan = planEntityMap.get(s.planCode);

    // Create deployment record if active or suspended
    if (s.status === 'ACTIVE' || s.status === 'SUSPENDED') {
      const dbUrlEncrypted = encryptField(
        `postgresql://postgres:postgres@localhost:5432/xyratech_${s.code.toLowerCase().replace(/-/g, '_')}?schema=public`
      );

      await platformDb.schoolDeployment.upsert({
        where: {
          schoolId_environment: {
            schoolId: school.id,
            environment: 'PRODUCTION',
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          environment: 'PRODUCTION',
          status: s.status === 'ACTIVE' ? 'HEALTHY' : 'SUSPENDED',
          deploymentUrl: `https://${s.domain}`,
          databaseUrlEncrypted: dbUrlEncrypted,
          storageBucket: `xyra-storage-${s.code.toLowerCase()}`,
          apiVersion: 'v1',
          releaseVersion: '1.0.0',
          lastHealthCheckAt: new Date(),
        },
      });

      // Create subscription record
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const sub = await platformDb.schoolSubscription.findFirst({
        where: { schoolId: school.id },
      });
      if (!sub && chosenPlan) {
        await platformDb.schoolSubscription.create({
          data: {
            schoolId: school.id,
            planId: chosenPlan.id,
            status: s.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
            startDate: new Date(),
            endDate: oneYearFromNow,
            renewalDate: oneYearFromNow,
            agreedPriceInCents: chosenPlan.priceInCents,
            billingContactName: `${s.name} Accounts`,
            billingContactEmail: s.officialEmail,
            billingContactPhone: s.contactPhone,
          },
        });
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 5. Seed Releases
  // ----------------------------------------------------------------------------
  console.log('--> Seeding System Releases...');
  const sampleReleases = [
    {
      version: '1.0.0',
      title: 'XyraTech Initial Production Release',
      description: 'Initial general availability baseline for school ERP and control plane.',
      status: 'COMPLETED' as const,
      requiresDbMigration: false,
    },
    {
      version: '1.1.0',
      title: 'Transport GPS Telemetry & Biometric Sync',
      description: 'Enables live bus route status and automated staff punch sync.',
      status: 'COMPLETED' as const,
      requiresDbMigration: true,
    },
    {
      version: '1.2.0',
      title: 'AI Exam Question Drafter & Lesson Planner',
      description: 'Introduces Xyra AI role-scoped assistants for teachers and academic coordinators.',
      status: 'ROLLING_OUT' as const,
      requiresDbMigration: false,
    },
  ];

  for (const r of sampleReleases) {
    await platformDb.release.upsert({
      where: { version: r.version },
      update: {},
      create: {
        version: r.version,
        title: r.title,
        description: r.description,
        status: r.status,
        requiresDbMigration: r.requiresDbMigration,
        createdById: superAdmin.id,
        completedAt: r.status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // 6. Seed Sample Support Tickets
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Sample Support Tickets...');
  const firstSchool = await platformDb.school.findFirst({ where: { code: 'XYRA-SCH-001' } });
  if (firstSchool) {
    await platformDb.supportTicket.upsert({
      where: { ticketNumber: 'TICK-2026-0001' },
      update: {},
      create: {
        ticketNumber: 'TICK-2026-0001',
        schoolId: firstSchool.id,
        requesterName: 'Dr. Rajiv Menon',
        requesterEmail: 'principal@delhipublicacademy.edu',
        category: 'BILLING',
        priority: 'MEDIUM',
        status: 'OPEN',
        subject: 'Query regarding Annual Subscription GST Invoice',
        description: 'Need formal tax invoice with updated GSTIN number for our trust audit.',
        assignedToId: devSupport.id,
      },
    });

    await platformDb.supportTicket.upsert({
      where: { ticketNumber: 'TICK-2026-0002' },
      update: {},
      create: {
        ticketNumber: 'TICK-2026-0002',
        schoolId: firstSchool.id,
        requesterName: 'Anita Sharma',
        requesterEmail: 'it@delhipublicacademy.edu',
        category: 'TECHNICAL_ISSUE',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        subject: 'Biometric device synchronization timeout',
        description: 'The staff attendance fingerprint reader in Block B had intermittent connection drops.',
        assignedToId: devSupport.id,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // 7. Seed Sample Platform Alerts
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Operational Alerts...');
  const alerts = [
    {
      category: 'DEPLOYMENT_FAILURE' as const,
      severity: 'HIGH' as const,
      status: 'RESOLVED' as const,
      title: 'Database migration retry succeeded on staging cluster',
      message: 'Automatic schema sync resolved after secondary index rebuild.',
    },
    {
      category: 'SUPPORT_SLA_BREACH' as const,
      severity: 'MEDIUM' as const,
      status: 'TRIGGERED' as const,
      title: 'Support SLA Warning: Ticket TICK-2026-0002 pending resolution',
      message: 'Resolution time approaching 4-hour SLA threshold for High priority issue.',
    },
    {
      category: 'AI_QUOTA_THRESHOLD' as const,
      severity: 'LOW' as const,
      status: 'TRIGGERED' as const,
      title: 'Greenfield Global School at 85% monthly AI quota',
      message: 'Token usage has reached 17,000 / 20,000 monthly quota.',
    },
  ];

  for (const a of alerts) {
    await platformDb.platformAlert.create({
      data: {
        category: a.category,
        severity: a.severity,
        status: a.status,
        title: a.title,
        message: a.message,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // 8. Seed Platform Settings
  // ----------------------------------------------------------------------------
  console.log('--> Seeding Platform Settings...');
  const settings = [
    { key: 'PLATFORM_NAME', value: 'XyraTech School ERP', category: 'GENERAL' },
    { key: 'SUPPORT_EMAIL', value: 'support@xyratech.com', category: 'SUPPORT' },
    { key: 'SLA_CRITICAL_HOURS', value: 1, category: 'SUPPORT' },
    { key: 'SLA_HIGH_HOURS', value: 4, category: 'SUPPORT' },
    { key: 'SLA_MEDIUM_HOURS', value: 24, category: 'SUPPORT' },
    { key: 'SLA_LOW_HOURS', value: 72, category: 'SUPPORT' },
    { key: 'SUBSCRIPTION_GRACE_DAYS', value: 14, category: 'BILLING' },
    { key: 'RAZORPAY_TEST_MODE', value: true, category: 'BILLING' },
    { key: 'BACKUP_RETENTION_DAYS', value: 30, category: 'INFRASTRUCTURE' },
  ];

  for (const s of settings) {
    await platformDb.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
        category: s.category,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // 9. Seed School Database Baseline
  // ----------------------------------------------------------------------------
  console.log('--> Seeding School Permissions & Roles...');
  for (const [, code] of Object.entries(SchoolPermissions) as [string, string][]) {
    await schoolDb.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        description: `Permission for ${code.replace(/\./g, ' ')}`,
        module: code.split('.')[0] || 'core',
      },
    });
  }

  for (const roleCode of [
    DefaultRoles.SCHOOL_PRINCIPAL,
    DefaultRoles.SCHOOL_ADMIN,
    DefaultRoles.SCHOOL_TEACHER,
    DefaultRoles.SCHOOL_STAFF,
  ]) {
    const role = await schoolDb.role.upsert({
      where: { code: roleCode },
      update: {},
      create: {
        code: roleCode,
        name: roleCode.replace('_', ' '),
        description: `Default role for ${roleCode}`,
        isSystem: true,
      },
    });

    const perms = DefaultSchoolRolePermissions[roleCode] || [];
    for (const pCode of perms) {
      const p = await schoolDb.permission.findUnique({ where: { code: pCode } });
      if (p) {
        await schoolDb.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }
  }

  console.log('✅ Phase 2 Development Database Seeding Completed Successfully.');
  await tenantConnectionManager.disconnectAll();
}

seed().catch((err) => {
  console.error('❌ Seeding Error:', err);
  process.exit(1);
});
