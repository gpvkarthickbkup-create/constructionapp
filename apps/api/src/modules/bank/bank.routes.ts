import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation, getTenantId } from '../../middleware/tenantIsolation';
import { AuthRequest } from '../../types';
import { sendSuccess, sendPaginated, parsePagination } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

const router = Router();
router.use(authenticate, tenantIsolation);

// List accounts
router.get('/accounts', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const accounts = await prisma.bankAccount.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    sendSuccess(res, accounts);
  } catch (error) { next(error); }
});

// Create account
router.post('/accounts', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { accountName, accountType, bankName, accountNumber, ifscCode, balance } = req.body;
    const account = await prisma.bankAccount.create({
      data: { tenantId, accountName, accountType: accountType || 'bank', bankName, accountNumber, ifscCode, balance: parseFloat(balance) || 0 },
    });
    sendSuccess(res, account, 'Account created', 201);
  } catch (error) { next(error); }
});

// Get account with transactions
router.get('/accounts/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const account = await prisma.bankAccount.findFirst({ where: { id: req.params.id, tenantId } });
    if (!account) throw new NotFoundError('Account');
    const transactions = await prisma.bankTransaction.findMany({
      where: { accountId: account.id, tenantId },
      orderBy: { date: 'desc' },
      take: 100,
    });
    sendSuccess(res, { account, transactions });
  } catch (error) { next(error); }
});

// Add transaction
router.post('/transactions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { accountId, type, amount, date, description, reference, category, relatedId } = req.body;
    const account = await prisma.bankAccount.findFirst({ where: { id: accountId, tenantId } });
    if (!account) throw new NotFoundError('Account');

    const amt = parseFloat(amount);
    const newBalance = type === 'credit' ? account.balance + amt : account.balance - amt;

    const [txn] = await prisma.$transaction([
      prisma.bankTransaction.create({
        data: { tenantId, accountId, type, amount: amt, date: new Date(date || new Date()), description, reference, category, relatedId, balance: newBalance, createdBy: req.user!.id },
      }),
      prisma.bankAccount.update({ where: { id: accountId }, data: { balance: newBalance } }),
    ]);

    sendSuccess(res, txn, 'Transaction recorded', 201);
  } catch (error) { next(error); }
});

// Summary
router.get('/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const accounts = await prisma.bankAccount.findMany({ where: { tenantId, isActive: true } });
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const bankBalance = accounts.filter(a => a.accountType === 'bank').reduce((sum, a) => sum + a.balance, 0);
    const cashBalance = accounts.filter(a => a.accountType === 'cash').reduce((sum, a) => sum + a.balance, 0);
    sendSuccess(res, { accounts, totalBalance, bankBalance, cashBalance });
  } catch (error) { next(error); }
});

export default router;
