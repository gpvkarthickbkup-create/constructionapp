import { Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../../types';
import { getTenantId } from '../../middleware/tenantIsolation';
import { sendSuccess } from '../../utils/helpers';

const dashboardService = new DashboardService();

export class DashboardController {
  async getCompanyDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await dashboardService.getCompanyDashboard(tenantId, req.query);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}
