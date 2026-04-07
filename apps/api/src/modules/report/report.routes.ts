import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';

const router = Router();
const controller = new ReportController();

router.use(authenticate, tenantIsolation);

router.get('/site-wise', controller.siteWiseExpense);
router.get('/category-wise', controller.categoryWise);
router.get('/vendor-wise', controller.vendorWise);
router.get('/pending-payments', controller.pendingPayments);
router.get('/budget-vs-actual', controller.budgetVsActual);
router.get('/monthly-spending', controller.monthlySpending);
router.get('/date-wise', controller.dateWise);

export default router;
