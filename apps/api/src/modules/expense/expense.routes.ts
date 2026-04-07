import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from './expense.schema';

const router = Router();
const controller = new ExpenseController();

router.use(authenticate, tenantIsolation);

router.post('/', validate(createExpenseSchema), controller.create);
router.get('/', controller.findAll);
router.get('/recent-items', controller.recentItems);
router.get('/recent-vendors', controller.recentVendors);
router.get('/check-duplicate', controller.checkDuplicate);
router.get('/:id', controller.findById);
router.put('/:id', validate(updateExpenseSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
