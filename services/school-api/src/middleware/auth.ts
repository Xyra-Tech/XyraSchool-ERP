import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, config } from '@xyratech/config';
import { hasPermission } from '@xyratech/permissions';
import { AuthTokenPayload, AuthenticatedUserContext } from '@xyratech/shared-types';
import { sendError } from '../utils/response';

export async function requireSchoolAuth(
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
    const decoded = verifyJwtToken<AuthTokenPayload>(token, config.schoolJwtSecret);

    // Verify session in isolated school DB
    const session = decoded.sessionId
      ? await req.schoolDb.userSession.findUnique({
          where: { id: decoded.sessionId },
        })
      : null;

    if (decoded.sessionId && (!session || session.revokedAt || session.expiresAt < new Date())) {
      sendError(res, 'Session has expired or was revoked', 401, 'SESSION_REVOKED');
      return;
    }

    // Verify user in isolated school DB
    const user = await req.schoolDb.user.findUnique({
      where: { id: decoded.sub },
      include: {
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

    if (!user || user.status !== 'ACTIVE') {
      sendError(res, 'User account is inactive, pending activation, or deactivated', 401, 'UNAUTHORIZED');
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      sendError(res, 'User account is temporarily locked due to failed login attempts', 403, 'ACCOUNT_LOCKED');
      return;
    }

    // Aggregate roles and permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.userRoles) {
      roles.push(ur.role.code);
      for (const rp of ur.role.permissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    // Principals automatically obtain full permissions within their school boundary
    if (user.userType === 'PRINCIPAL') {
      permissionsSet.add('*');
    }

    req.user = {
      id: user.id,
      email: user.email,
      userType: user.userType as any,
      roles,
      permissions: Array.from(permissionsSet),
      schoolId: decoded.schoolId,
      schoolCode: decoded.schoolCode,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (err: any) {
    sendError(res, 'Invalid or expired school authentication token', 401, 'TOKEN_EXPIRED');
  }
}

export function requireSchoolPermission(requiredPermission: string) {
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
