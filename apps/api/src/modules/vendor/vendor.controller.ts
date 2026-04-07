import { Response, NextFunction } from 'express';
import { VendorService } from './vendor.service';
import { AuthRequest } from '../../types';
import { getTenantId } from '../../middleware/tenantIsolation';
import { sendSuccess, sendPaginated } from '../../utils/helpers';

const vendorService = new VendorService();

export class VendorController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const vendor = await vendorService.create(tenantId, req.body);
      sendSuccess(res, vendor, 'Vendor added successfully', 201);
    } catch (error) { next(error); }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await vendorService.findAll(tenantId, req.query);
      sendPaginated(res, result);
    } catch (error) { next(error); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const vendor = await vendorService.findById(tenantId, req.params.id);
      sendSuccess(res, vendor);
    } catch (error) { next(error); }
  }

  async detail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const detail = await vendorService.getVendorDetail(tenantId, req.params.id);
      sendSuccess(res, detail);
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const vendor = await vendorService.update(tenantId, req.params.id, req.body);
      sendSuccess(res, vendor, 'Vendor updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      await vendorService.softDelete(tenantId, req.params.id);
      sendSuccess(res, null, 'Vendor deleted successfully');
    } catch (error) { next(error); }
  }
}
