import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation, getTenantId } from '../../middleware/tenantIsolation';
import { AuthRequest } from '../../types';
import { sendSuccess, sendPaginated, parsePagination } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

const router = Router();
router.use(authenticate, tenantIsolation);

// List customers
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { page, limit, search } = parsePagination(req.query);
    const where: any = { tenantId, deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);
    sendPaginated(res, { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Create customer
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { name, mobile, email, address, gstNumber, notes } = req.body;
    const customer = await prisma.customer.create({
      data: { tenantId, name, mobile, email, address, gstNumber, notes },
    });
    sendSuccess(res, customer, 'Customer added', 201);
  } catch (error) { next(error); }
});

// Get customer detail with collections
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundError('Customer');

    const [collections, totalCollected] = await Promise.all([
      prisma.customerCollection.findMany({
        where: { customerId: customer.id, tenantId },
        orderBy: { collectionDate: 'desc' },
        take: 50,
      }),
      prisma.customerCollection.aggregate({
        where: { customerId: customer.id, tenantId },
        _sum: { amount: true },
      }),
    ]);

    sendSuccess(res, {
      customer,
      collections,
      totalCollected: totalCollected._sum.amount || 0,
    });
  } catch (error) { next(error); }
});

// Update customer
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const existing = await prisma.customer.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new NotFoundError('Customer');
    const { name, mobile, email, address, gstNumber, notes } = req.body;
    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, mobile, email, address, gstNumber, notes },
    });
    sendSuccess(res, updated, 'Customer updated');
  } catch (error) { next(error); }
});

// Add collection (payment received from customer)
router.post('/:id/collections', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const customer = await prisma.customer.findFirst({ where: { id: req.params.id, tenantId } });
    if (!customer) throw new NotFoundError('Customer');

    const { amount, collectionDate, paymentType, reference, receiptNumber, siteId, notes } = req.body;
    const count = await prisma.customerCollection.count({ where: { tenantId } });

    const collection = await prisma.customerCollection.create({
      data: {
        tenantId,
        customerId: customer.id,
        siteId,
        amount: parseFloat(amount),
        collectionDate: new Date(collectionDate || new Date()),
        paymentType: paymentType || 'cash',
        reference,
        receiptNumber: receiptNumber || `RCP-${String(count + 1).padStart(5, '0')}`,
        notes,
        createdBy: req.user!.id,
      },
    });
    sendSuccess(res, collection, 'Collection recorded', 201);
  } catch (error) { next(error); }
});

// Delete customer (soft)
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const existing = await prisma.customer.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new NotFoundError('Customer');
    await prisma.customer.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    sendSuccess(res, null, 'Customer deleted');
  } catch (error) { next(error); }
});

export default router;
