import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation, getTenantId } from '../../middleware/tenantIsolation';
import { AuthRequest } from '../../types';
import { sendSuccess, sendPaginated, parsePagination } from '../../utils/helpers';
import { NotFoundError, ConflictError } from '../../utils/errors';

const router = Router();

router.use(authenticate, tenantIsolation);

// List users for tenant
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { page, limit, search } = parsePagination(req.query);

    const where: any = { tenantId, deletedAt: null };
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, email: true, mobile: true, firstName: true, lastName: true,
          avatar: true, isActive: true, lastLoginAt: true, createdAt: true,
          userRoles: { include: { role: { select: { name: true, displayName: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendPaginated(res, {
      data: data.map(u => ({ ...u, roles: u.userRoles.map(ur => ur.role) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// Get company/tenant settings — MUST be before /:id routes
router.get('/company', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!tenant) throw new NotFoundError('Company');
    sendSuccess(res, tenant);
  } catch (error) { next(error); }
});

// Update company/tenant settings — MUST be before /:id routes
router.put('/company', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { companyName, ownerName, mobile, address, gstNumber, logo, currency, language, dateFormat } = req.body;
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(companyName && { companyName }),
        ...(ownerName && { ownerName }),
        ...(mobile && { mobile }),
        ...(address !== undefined && { address }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(logo !== undefined && { logo }),
        ...(currency && { currency }),
        ...(language && { language }),
        ...(dateFormat && { dateFormat }),
      },
    });
    sendSuccess(res, updated, 'Company details updated');
  } catch (error) { next(error); }
});

// Get roles — MUST be before /:id routes
router.get('/roles', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const roles = await prisma.role.findMany({ where: { tenantId } });
    sendSuccess(res, roles);
  } catch (error) { next(error); }
});

// Get expense categories — MUST be before /:id routes
router.get('/categories', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const categories = await prisma.expenseCategory.findMany({
      where: { OR: [{ tenantId }, { tenantId: null, isSystem: true }], isActive: true },
      include: { subcategories: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    sendSuccess(res, categories);
  } catch (error) { next(error); }
});

// Create expense category
router.post('/categories', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { name, nameTa, type, color, icon } = req.body;
    const count = await prisma.expenseCategory.count({ where: { tenantId } });
    const category = await prisma.expenseCategory.create({
      data: { tenantId, name, nameTa, type: type || 'material', color: color || '#6B7280', icon: icon || 'package', sortOrder: count },
    });
    sendSuccess(res, category, 'Category added', 201);
  } catch (error) { next(error); }
});

// Create user
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { email, mobile, firstName, lastName, password, roleIds } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        mobile,
        firstName,
        lastName,
        passwordHash,
        userRoles: {
          create: (roleIds || []).map((roleId: string) => ({ roleId })),
        },
      },
    });

    sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) { next(error); }
});

// Update user
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { firstName, lastName, mobile, isActive, roleIds } = req.body;

    const user = await prisma.user.findFirst({ where: { id: req.params.id, tenantId } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, mobile, isActive },
    });

    if (roleIds) {
      await prisma.userRoleMap.deleteMany({ where: { userId: req.params.id } });
      await prisma.userRoleMap.createMany({
        data: roleIds.map((roleId: string) => ({ userId: req.params.id, roleId })),
      });
    }

    sendSuccess(res, updated, 'User updated successfully');
  } catch (error) { next(error); }
});

export default router;
