import { Request, Response } from 'express';
import { LoginSchema, MfaVerifySchema, MfaSetupVerifySchema } from '@xyratech/validation';
import {
  verifyPassword,
  signJwtToken,
  generateBase32Secret,
  verifyTotpCode,
  generateRecoveryCodes,
  encryptField,
  decryptField,
  config,
} from '@xyratech/config';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { email, password, mfaCode } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const user = await platformDb.platformUser.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          platformRole: {
            include: {
              permissions: {
                include: {
                  platformPermission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!user || !user.isActive) {
    await recordPlatformAudit({
      actorEmail: email,
      action: 'PLATFORM_LOGIN_ATTEMPT',
      resourceType: 'PLATFORM_USER',
      outcome: 'FAILURE',
      ipAddress: ip,
      userAgent,
      details: { reason: 'User not found or inactive' },
    });
    sendError(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
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

    await platformDb.platformUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil,
      },
    });

    await recordPlatformAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'PLATFORM_LOGIN_ATTEMPT',
      resourceType: 'PLATFORM_USER',
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
  if (user.mfaEnabled) {
    if (!mfaCode) {
      sendSuccess(
        res,
        { requiresMfa: true },
        'MFA verification code required to complete authentication'
      );
      return;
    }

    if (!user.mfaSecret) {
      sendError(res, 'MFA configuration corrupt. Contact security administrator.', 500, 'MFA_ERROR');
      return;
    }

    const decryptedSecret = decryptField(user.mfaSecret);
    const isMfaValid = verifyTotpCode(decryptedSecret, mfaCode);
    if (!isMfaValid) {
      await recordPlatformAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: 'PLATFORM_MFA_VERIFY',
        resourceType: 'PLATFORM_USER',
        resourceId: user.id,
        outcome: 'FAILURE',
        ipAddress: ip,
        userAgent,
        details: { reason: 'Invalid MFA code' },
      });
      sendError(res, 'Invalid MFA code', 401, 'INVALID_MFA_CODE');
      return;
    }
  }

  // Reset failed login attempts on success
  await platformDb.platformUser.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Collect roles & permissions
  const roles: string[] = [];
  const permissionsSet = new Set<string>();

  for (const ur of user.userRoles) {
    roles.push(ur.platformRole.name);
    for (const rp of ur.platformRole.permissions) {
      permissionsSet.add(rp.platformPermission.code);
    }
  }

  if (user.isSuperAdmin) {
    permissionsSet.add('*');
  }

  const permissions = Array.from(permissionsSet);

  const token = signJwtToken(
    {
      sub: user.id,
      email: user.email,
      userType: 'SUPER_ADMIN',
      roles,
      permissions,
      isMfaVerified: user.mfaEnabled,
    },
    config.platformJwtSecret,
    config.platformJwtExpiresIn
  );

  await recordPlatformAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'PLATFORM_LOGIN_SUCCESS',
    resourceType: 'PLATFORM_USER',
    resourceId: user.id,
    outcome: 'SUCCESS',
    ipAddress: ip,
    userAgent,
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
        isSuperAdmin: user.isSuperAdmin,
        mfaEnabled: user.mfaEnabled,
        roles,
        permissions,
      },
    },
    'Login successful'
  );
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await recordPlatformAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'PLATFORM_LOGOUT',
      resourceType: 'PLATFORM_USER',
      resourceId: req.user.id,
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
  sendSuccess(res, { loggedOut: true }, 'Successfully logged out');
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  const platformDb = getPlatformPrisma();
  const user = await platformDb.platformUser.findUnique({
    where: { id: req.user.id },
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
    isSuperAdmin: user.isSuperAdmin,
    mfaEnabled: user.mfaEnabled,
    roles: req.user.roles,
    permissions: req.user.permissions,
  });
}

export async function setupMfa(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  const secret = generateBase32Secret(20);
  const { plainCodes } = generateRecoveryCodes(8);
  const encryptedSecret = encryptField(secret);

  const platformDb = getPlatformPrisma();
  await platformDb.platformUser.update({
    where: { id: req.user.id },
    data: {
      mfaSecret: encryptedSecret,
    },
  });

  // Construct standard OTPAuth URL for QR code generation
  const otpAuthUrl = `otpauth://totp/XyraTechControlCenter:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=XyraTech`;

  sendSuccess(res, {
    secret,
    otpAuthUrl,
    recoveryCodes: plainCodes,
  }, 'MFA setup initiated. Verify code to activate.');
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

  const platformDb = getPlatformPrisma();
  const user = await platformDb.platformUser.findUnique({ where: { id: req.user.id } });
  if (!user || !user.mfaSecret) {
    sendError(res, 'MFA setup has not been initiated', 400, 'MFA_NOT_INITIATED');
    return;
  }

  const secret = decryptField(user.mfaSecret);
  const isValid = verifyTotpCode(secret, parseResult.data.code);

  if (!isValid) {
    sendError(res, 'Invalid verification code', 400, 'INVALID_MFA_CODE');
    return;
  }

  await platformDb.platformUser.update({
    where: { id: req.user.id },
    data: {
      mfaEnabled: true,
    },
  });

  await recordPlatformAudit({
    actorId: req.user.id,
    actorEmail: req.user.email,
    action: 'PLATFORM_MFA_ENABLED',
    resourceType: 'PLATFORM_USER',
    resourceId: req.user.id,
    outcome: 'SUCCESS',
    ipAddress: req.ip,
  });

  sendSuccess(res, { mfaEnabled: true }, 'MFA successfully verified and enabled');
}
