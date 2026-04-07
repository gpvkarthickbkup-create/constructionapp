import { Response, NextFunction } from 'express';
import { SiteService } from './site.service';
import { AuthRequest } from '../../types';
import { getTenantId } from '../../middleware/tenantIsolation';
import { sendSuccess, sendPaginated } from '../../utils/helpers';

const siteService = new SiteService();

export class SiteController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const site = await siteService.create(tenantId, req.body);
      sendSuccess(res, site, 'Site created successfully', 201);
    } catch (error) { next(error); }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await siteService.findAll(tenantId, req.query);
      sendPaginated(res, result);
    } catch (error) { next(error); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const site = await siteService.findById(tenantId, req.params.id);
      sendSuccess(res, site);
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const site = await siteService.update(tenantId, req.params.id, req.body);
      sendSuccess(res, site, 'Site updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      await siteService.softDelete(tenantId, req.params.id);
      sendSuccess(res, null, 'Site deleted successfully');
    } catch (error) { next(error); }
  }

  async dashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const data = await siteService.getSiteDashboard(tenantId, req.params.id);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}
