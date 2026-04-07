import { Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { AuthRequest } from '../../types';
import { getTenantId } from '../../middleware/tenantIsolation';
import { sendSuccess } from '../../utils/helpers';

const reportService = new ReportService();

export class ReportController {
  async siteWiseExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.siteWiseExpenseReport(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async categoryWise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.categoryWiseReport(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async vendorWise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.vendorWiseReport(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async pendingPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.pendingPaymentReport(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async budgetVsActual(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.budgetVsActualReport(tenantId);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async monthlySpending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.monthlySpendingReport(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async dateWise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await reportService.dateWiseReport(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}
