import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';

const router = Router();
const controller = new DashboardController();

router.use(authenticate, tenantIsolation);
router.get('/', controller.getCompanyDashboard);

export default router;
