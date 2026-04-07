import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ForbiddenError } from '../utils/errors';

/**
 * Ensures all database queries are scoped to the authenticated user's tenant.
 * Super admins can optionally specify a tenantId via query parameter.
 */
export function tenantIsolation(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ForbiddenError('Authentication required'));
  }

  // Super admin can access any tenant via query param
  if (req.user.isSuperAdmin) {
    const queryTenantId = req.query.tenantId as string;
    if (queryTenantId) {
      req.user.tenantId = queryTenantId;
    }
    return next();
  }

  // Regular users must have a tenantId
  if (!req.user.tenantId) {
    return next(new ForbiddenError('No company associated with this account'));
  }

  next();
}

/**
 * Gets the tenant ID from the request, ensuring isolation.
 */
export function getTenantId(req: AuthRequest): string {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    // For super admins, try to get tenantId from query or body
    if (req.user?.isSuperAdmin) {
      const fromQuery = req.query.tenantId as string;
      const fromBody = req.body?.tenantId as string;
      if (fromQuery || fromBody) return fromQuery || fromBody;
      throw new ForbiddenError('Super admin must specify a tenantId parameter');
    }
    throw new ForbiddenError('Tenant context required. Please login with your company account.');
  }
  return tenantId;
}
