import { Response, NextFunction } from 'express';
import { ExpenseService } from './expense.service';
import { AuthRequest } from '../../types';
import { getTenantId } from '../../middleware/tenantIsolation';
import { sendSuccess, sendPaginated } from '../../utils/helpers';

const expenseService = new ExpenseService();

export class ExpenseController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const expense = await expenseService.create(tenantId, req.user!.id, req.body);
      sendSuccess(res, expense, 'Expense recorded successfully', 201);
    } catch (error) { next(error); }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await expenseService.findAll(tenantId, req.query);
      sendPaginated(res, result);
    } catch (error) { next(error); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const expense = await expenseService.findById(tenantId, req.params.id);
      sendSuccess(res, expense);
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const expense = await expenseService.update(tenantId, req.params.id, req.user!.id, req.body);
      sendSuccess(res, expense, 'Expense updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      await expenseService.softDelete(tenantId, req.params.id);
      sendSuccess(res, null, 'Expense deleted successfully');
    } catch (error) { next(error); }
  }

  async recentItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const items = await expenseService.getRecentItems(tenantId);
      sendSuccess(res, items);
    } catch (error) { next(error); }
  }

  async recentVendors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const vendors = await expenseService.getRecentVendors(tenantId);
      sendSuccess(res, vendors);
    } catch (error) { next(error); }
  }

  async checkDuplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { billNumber, totalAmount, expenseDate } = req.query as any;
      const isDuplicate = await expenseService.checkDuplicate(tenantId, billNumber, parseFloat(totalAmount), expenseDate);
      sendSuccess(res, { isDuplicate });
    } catch (error) { next(error); }
  }
}
