import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, requireSuperAdmin } from '../../middleware/auth';
import { AuthRequest } from '../../types';
import { sendSuccess, sendPaginated, parsePagination } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

const router = Router();

router.use(authenticate, requireSuperAdmin);

// List all tenants
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(req.query);
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { email: { contains: search } },
        { ownerName: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          subscription: { include: { plan: true } },
          _count: { select: { users: true, sites: true, expenses: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    sendPaginated(res, { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Get available modules list
router.get('/modules/list', async (_req: AuthRequest, res: Response) => {
  sendSuccess(res, {
    modules: [
      { key: 'sites', name: 'Sites / Projects', description: 'Construction site management' },
      { key: 'land', name: 'Land & Plots', description: 'Land promotion and plot sales' },
      { key: 'expenses', name: 'Expenses', description: 'Expense tracking' },
      { key: 'vendors', name: 'Vendors', description: 'Vendor management' },
      { key: 'customers', name: 'Clients', description: 'Client management' },
      { key: 'reports', name: 'Reports', description: 'Financial reports' },
      { key: 'users', name: 'User Management', description: 'Team management' },
      { key: 'notifications', name: 'Notifications', description: 'Alert system' },
    ]
  });
});

// Get tenant details
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { users: true, sites: true, expenses: true } },
      },
    });
    if (!tenant) throw new NotFoundError('Tenant');
    sendSuccess(res, tenant);
  } catch (error) { next(error); }
});

// Update tenant status
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status },
    });
    sendSuccess(res, tenant, `Company ${status}`);
  } catch (error) { next(error); }
});

// Update subscription
router.patch('/:id/subscription', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { planId, endDate, status } = req.body;
    const subscription = await prisma.subscription.update({
      where: { tenantId: req.params.id },
      data: {
        ...(planId && { planId }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
    });
    sendSuccess(res, subscription, 'Subscription updated');
  } catch (error) { next(error); }
});

// Admin dashboard stats
router.get('/stats/overview', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalTenants, activeTenants, trialTenants, expiredTenants, totalUsers, totalSites, totalExpenses] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.tenant.count({ where: { status: 'trial' } }),
      prisma.tenant.count({ where: { status: 'expired' } }),
      prisma.user.count({ where: { isSuperAdmin: false } }),
      prisma.site.count(),
      prisma.expense.count(),
    ]);

    sendSuccess(res, {
      totalTenants, activeTenants, trialTenants, expiredTenants,
      totalUsers, totalSites, totalExpenses,
    });
  } catch (error) { next(error); }
});

// Subscription plans management
router.get('/plans/all', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } });
    sendSuccess(res, plans);
  } catch (error) { next(error); }
});

router.post('/plans', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.subscriptionPlan.create({ data: req.body });
    sendSuccess(res, plan, 'Plan created', 201);
  } catch (error) { next(error); }
});

router.put('/plans/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, plan, 'Plan updated');
  } catch (error) { next(error); }
});

// Lock/unlock modules for a tenant
router.patch('/:id/modules', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lockedModules } = req.body; // comma-separated: "land,reports"
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { lockedModules: lockedModules || '' },
    });
    sendSuccess(res, tenant, 'Modules updated');
  } catch (error) { next(error); }
});

export default router;
