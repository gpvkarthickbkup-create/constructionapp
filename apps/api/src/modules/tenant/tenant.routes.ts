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

// Get full data for a tenant (super admin view)
router.get('/:id/data', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.params.id;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { subscription: { include: { plan: true } } } });
    if (!tenant) throw new NotFoundError('Tenant');

    const [users, sites, expenses, vendors, customers, lands] = await Promise.all([
      prisma.user.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, email: true, firstName: true, lastName: true, mobile: true, isActive: true, lastLoginAt: true } }),
      prisma.site.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, siteName: true, siteCode: true, clientName: true, status: true, estimatedBudget: true, totalSqft: true, customerEstimate: true, builderEstimate: true, saleAmount: true, createdAt: true } }),
      prisma.expense.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, expenseNumber: true, itemName: true, expenseType: true, totalAmount: true, paymentStatus: true, expenseDate: true, site: { select: { siteName: true } }, vendor: { select: { name: true } } }, orderBy: { expenseDate: 'desc' }, take: 50 }),
      prisma.vendor.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, name: true, vendorCode: true, type: true, mobile: true } }),
      prisma.customer.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, name: true, mobile: true, email: true } }),
      prisma.land.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, landName: true, landCode: true, totalArea: true, city: true, purchaseCost: true, currentValue: true, status: true } }),
    ]);

    // Calculate totals
    const totalExpenseAmount = expenses.reduce((s, e) => s + (e.totalAmount || 0), 0);
    const totalBudget = sites.reduce((s, si) => s + (si.estimatedBudget || 0), 0);
    const pendingExpenses = expenses.filter(e => e.paymentStatus !== 'paid').length;

    sendSuccess(res, {
      tenant,
      summary: { totalUsers: users.length, totalSites: sites.length, totalExpenses: expenses.length, totalVendors: vendors.length, totalCustomers: customers.length, totalLands: lands.length, totalExpenseAmount, totalBudget, pendingExpenses },
      users, sites, expenses, vendors, customers, lands,
    });
  } catch (error) { next(error); }
});

// Export all data for a tenant as JSON (backup)
router.get('/:id/backup', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.params.id;
    const [tenant, users, sites, expenses, vendors, customers, lands, categories] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, include: { subscription: { include: { plan: true } } } }),
      prisma.user.findMany({ where: { tenantId } }),
      prisma.site.findMany({ where: { tenantId }, include: { siteImages: true } }),
      prisma.expense.findMany({ where: { tenantId }, include: { attachments: true, payments: true } }),
      prisma.vendor.findMany({ where: { tenantId } }),
      prisma.customer.findMany({ where: { tenantId }, include: { collections: true } }),
      prisma.land.findMany({ where: { tenantId }, include: { plots: { include: { payments: true } }, approvals: true, developmentCosts: true } }),
      prisma.expenseCategory.findMany({ where: { tenantId } }),
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      companyName: tenant?.companyName,
      tenantId,
      data: { tenant, users, sites, expenses, vendors, customers, lands, categories },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${tenant?.companyName?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (error) { next(error); }
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

// Reset password for a user in a tenant
router.patch('/:id/reset-password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) { next(error); }
});

// Get users for a tenant
router.get('/:id/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.params.id, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true, mobile: true, isActive: true, lastLoginAt: true },
    });
    sendSuccess(res, users);
  } catch (error) { next(error); }
});

// Update tenant custom pricing / notes
router.patch('/:id/pricing', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customPrice, notes } = req.body;
    // Store custom price in the tenant notes field for now
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { notes: JSON.stringify({ customPrice: customPrice || 0, notes: notes || '' }) },
    });
    sendSuccess(res, tenant, 'Pricing updated');
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
