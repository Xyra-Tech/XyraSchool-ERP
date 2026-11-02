import { Request, Response } from 'express';
import {
  LoginSchema,
  InvitationActivationSchema,
  MfaVerifySchema,
} from '@xyratech/validation';
import {
  hashPassword,
  verifyPassword,
  signJwtToken,
  hashSha256,
  generateBase32Secret,
  verifyTotpCode,
  generateRecoveryCodes,
  encryptField,
  decryptField,
  config,
} from '@xyratech/config';
import { recordSchoolAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function activateInvitation(req: Request, res: Response): Promise<void> {
  const parseResult = InvitationActivationSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { token, password, firstName, lastName } = parseResult.data;
  const tokenHash = hashSha256(token);

  // Look up invitation in this school database
  const invitation = await req.schoolDb.userInvitation.findUnique({
    where: { invitationTokenHash: tokenHash },
  });

  if (!invitation) {
    sendError(res, 'Invalid invitation token', 400, 'INVALID_TOKEN');
    return;
  }

  if (invitation.status !== 'PENDING') {
    sendError(res, `Invitation is no longer valid (Status: ${invitation.status})`, 400, 'INVITATION_INACTIVE');
    return;
  }

  if (invitation.expiresAt < new Date()) {
    await req.schoolDb.userInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    sendError(res, 'Invitation has expired. Please request a new invitation.', 400, 'INVITATION_EXPIRED');
    return;
  }

  // Hash password using Argon2id (Principal sets their own password!)
  const passwordHash = await hashPassword(password);

  // Find role
  const role = await req.schoolDb.role.findUnique({
    where: { code: invitation.roleCode },
  });

  // Upsert or create user
  const user = await req.schoolDb.user.upsert({
    where: { email: invitation.email },
    update: {
      passwordHash,
      firstName,
      lastName,
      userType: invitation.userType,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: invitation.email,
      passwordHash,
      firstName,
      lastName,
      userType: invitation.userType,
      status: 'ACTIVE',
    },
  });

  // Link role
  if (role) {
    await req.schoolDb.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  // Generate initial recovery codes for account recovery
  const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
  for (const codeHash of hashedCodes) {
    await req.schoolDb.recoveryCode.create({
      data: {
        userId: user.id,
        codeHash,
      },
    });
  }

  // Mark invitation as accepted
  await req.schoolDb.userInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  });

  // Record audit log
  await recordSchoolAudit(req.schoolDb, {
    actorId: user.id,
    actorEmail: user.email,
    action: 'INVITATION_ACTIVATED',
    resourceType: 'USER',
    resourceId: user.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: {
      userType: user.userType,
      roleCode: invitation.roleCode,
    },
  });

  sendSuccess(
    res,
    {
      userId: user.id,
      email: user.email,
      status: user.status,
      recoveryCodes: plainCodes,
    },
    'Account activated successfully. Store your recovery codes securely.',
    201
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { email, password, mfaCode } = parseResult.data;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const user = await req.schoolDb.user.findUnique({
    where: { email },
    include: {
      mfaConfig: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
    await recordSchoolAudit(req.schoolDb, {
      actorEmail: email,
      action: 'LOGIN_ATTEMPT',
      resourceType: 'USER',
      outcome: 'FAILURE',
      ipAddress: ip,
      userAgent,
      details: { reason: 'Account not found, inactive, or not activated' },
    });
    sendError(res, 'Invalid credentials or account pending activation', 401, 'INVALID_CREDENTIALS');
    return;
  }

  // Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    sendError(
      res,
      'Account is temporarily locked due to multiple failed login attempts. Try again later.',
      403,
      'ACCOUNT_LOCKED'
    );
    return;
  }

  // Verify Argon2id password
  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    const failedAttempts = user.failedLoginAttempts + 1;
    const lockAccount = failedAttempts >= 5;
    const lockedUntil = lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await req.schoolDb.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil,
      },
    });

    await recordSchoolAudit(req.schoolDb, {
      actorId: user.id,
      actorEmail: user.email,
      action: 'LOGIN_ATTEMPT',
      resourceType: 'USER',
      resourceId: user.id,
      outcome: 'FAILURE',
      ipAddress: ip,
      userAgent,
      details: { failedAttempts, locked: lockAccount },
    });

    sendError(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
    return;
  }

  // Check MFA if enabled
  if (user.mfaConfig?.isEnabled) {
    if (!mfaCode) {
      sendSuccess(
        res,
        { requiresMfa: true },
        'MFA verification code required'
      );
      return;
    }

    const secret = decryptField(user.mfaConfig.secretEncrypted);
    const isMfaValid = verifyTotpCode(secret, mfaCode);
    if (!isMfaValid) {
      await recordSchoolAudit(req.schoolDb, {
        actorId: user.id,
        actorEmail: user.email,
        action: 'MFA_VERIFY',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'FAILURE',
        ipAddress: ip,
        userAgent,
        details: { reason: 'Invalid MFA verification code' },
      });
      sendError(res, 'Invalid MFA code', 401, 'INVALID_MFA_CODE');
      return;
    }
  }

  // Reset failed login attempts
  await req.schoolDb.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Extract roles and permissions
  const roles: string[] = [];
  const permissionsSet = new Set<string>();

  for (const ur of user.userRoles) {
    roles.push(ur.role.code);
    for (const rp of ur.role.permissions) {
      permissionsSet.add(rp.permission.code);
    }
  }

  if (user.userType === 'PRINCIPAL') {
    permissionsSet.add('*');
  }

  const permissions = Array.from(permissionsSet);

  // Create persistent session
  const sessionToken = hashSha256(`${user.id}-${Date.now()}-${Math.random()}`);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await req.schoolDb.userSession.create({
    data: {
      userId: user.id,
      tokenHash: sessionToken,
      ipAddress: ip,
      userAgent,
      expiresAt,
    },
  });

  const schoolId = req.schoolTenant?.id;
  const schoolCode = req.schoolTenant?.code;

  const token = signJwtToken(
    {
      sub: user.id,
      email: user.email,
      userType: user.userType as any,
      roles,
      permissions,
      schoolId,
      schoolCode,
      sessionId: session.id,
      isMfaVerified: !!user.mfaConfig?.isEnabled,
    },
    config.schoolJwtSecret,
    config.schoolJwtExpiresIn
  );

  await recordSchoolAudit(req.schoolDb, {
    actorId: user.id,
    actorEmail: user.email,
    action: 'LOGIN_SUCCESS',
    resourceType: 'USER',
    resourceId: user.id,
    outcome: 'SUCCESS',
    ipAddress: ip,
    userAgent,
    details: { sessionId: session.id },
  });

  sendSuccess(
    res,
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        mfaEnabled: !!user.mfaConfig?.isEnabled,
        roles,
        permissions,
        schoolId,
        schoolCode,
      },
    },
    'Login successful'
  );
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user?.sessionId) {
    await req.schoolDb.userSession.update({
      where: { id: req.user.sessionId },
      data: { revokedAt: new Date() },
    });
  }

  if (req.user) {
    await recordSchoolAudit(req.schoolDb, {
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'LOGOUT',
      resourceType: 'USER',
      resourceId: req.user.id,
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  sendSuccess(res, { loggedOut: true }, 'Successfully logged out and session revoked');
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  const user = await req.schoolDb.user.findUnique({
    where: { id: req.user.id },
    include: {
      mfaConfig: true,
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    mfaEnabled: !!user.mfaConfig?.isEnabled,
    roles: req.user.roles,
    permissions: req.user.permissions,
    schoolId: req.user.schoolId,
    schoolCode: req.user.schoolCode,
  });
}

export async function setupMfa(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  const secret = generateBase32Secret(20);
  const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
  const encryptedSecret = encryptField(secret);

  await req.schoolDb.mFAConfiguration.upsert({
    where: { userId: req.user.id },
    update: {
      secretEncrypted: encryptedSecret,
      isEnabled: false,
    },
    create: {
      userId: req.user.id,
      secretEncrypted: encryptedSecret,
      isEnabled: false,
    },
  });

  // Store recovery codes
  for (const codeHash of hashedCodes) {
    await req.schoolDb.recoveryCode.create({
      data: {
        userId: req.user.id,
        codeHash,
      },
    });
  }

  const otpAuthUrl = `otpauth://totp/XyraSchoolERP:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=XyraSchoolERP`;

  sendSuccess(res, {
    secret,
    otpAuthUrl,
    recoveryCodes: plainCodes,
  }, 'MFA setup initiated. Please verify code to complete activation.');
}

export async function verifyMfaSetup(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  const parseResult = MfaVerifySchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Invalid code format', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const mfaConfig = await req.schoolDb.mFAConfiguration.findUnique({
    where: { userId: req.user.id },
  });

  if (!mfaConfig) {
    sendError(res, 'MFA setup has not been initiated', 400, 'MFA_NOT_INITIATED');
    return;
  }

  const secret = decryptField(mfaConfig.secretEncrypted);
  const isValid = verifyTotpCode(secret, parseResult.data.code);

  if (!isValid) {
    sendError(res, 'Invalid verification code', 400, 'INVALID_MFA_CODE');
    return;
  }

  await req.schoolDb.mFAConfiguration.update({
    where: { id: mfaConfig.id },
    data: {
      isEnabled: true,
      verifiedAt: new Date(),
    },
  });

  await recordSchoolAudit(req.schoolDb, {
    actorId: req.user.id,
    actorEmail: req.user.email,
    action: 'MFA_ENABLED',
    resourceType: 'USER',
    resourceId: req.user.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
  });

  sendSuccess(res, { mfaEnabled: true }, 'MFA enabled successfully');
}
