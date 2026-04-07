import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest, AuthUser } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        tenant: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Check tenant status for non-super-admin users
    if (!user.isSuperAdmin && user.tenant) {
      if (user.tenant.status === 'suspended') {
        throw new ForbiddenError('Your company account has been suspended');
      }
      if (user.tenant.status === 'expired') {
        // Check grace period
        const subscription = await prisma.subscription.findUnique({
          where: { tenantId: user.tenantId! },
        });
        if (subscription?.endDate) {
          const graceEnd = new Date(subscription.endDate);
          graceEnd.setDate(graceEnd.getDate() + (subscription.gracePeriodDays || 7));
          if (new Date() > graceEnd) {
            throw new ForbiddenError('Your subscription has expired. Please renew.');
          }
        }
      }
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => `${rp.permission.module}:${rp.permission.action}`)
    );

    req.user = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
      roles,
      permissions,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
}

export function requireSuperAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user?.isSuperAdmin) {
    return next(new ForbiddenError('Super admin access required'));
  }
  next();
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user?.isSuperAdmin) return next();

    const hasPermission = requiredPermissions.some(p => req.user?.permissions.includes(p));
    if (!hasPermission) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user?.isSuperAdmin) return next();

    const hasRole = roles.some(r => req.user?.roles.includes(r));
    if (!hasRole) {
      return next(new ForbiddenError('Insufficient role'));
    }
    next();
  };
}
