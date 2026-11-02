import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, config } from '@xyratech/config';
import { getPlatformPrisma } from '@xyratech/database';
import { hasPermission } from '@xyratech/permissions';
import { AuthTokenPayload, AuthenticatedUserContext } from '@xyratech/shared-types';
import { sendError } from '../utils/response';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}

export async function requirePlatformAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Missing or malformed authorization header', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyJwtToken<AuthTokenPayload>(token, config.platformJwtSecret);

    // Verify user in platform DB
    const platformDb = getPlatformPrisma();
    const user = await platformDb.platformUser.findUnique({
      where: { id: decoded.sub },
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

    if (!user || !user.isActive) {
      sendError(res, 'User account is deactivated or not found', 401, 'UNAUTHORIZED');
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      sendError(res, 'User account is temporarily locked due to failed login attempts', 403, 'ACCOUNT_LOCKED');
      return;
    }

    // Extract roles and permissions
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

    req.user = {
      id: user.id,
      email: user.email,
      userType: 'SUPER_ADMIN',
      roles,
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (err: any) {
    sendError(res, 'Invalid or expired authentication token', 401, 'TOKEN_EXPIRED');
  }
}

export function requirePlatformPermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!hasPermission(req.user.permissions, requiredPermission)) {
      sendError(
        res,
        `Access denied. Missing required permission: ${requiredPermission}`,
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
}
