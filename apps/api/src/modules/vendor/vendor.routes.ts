import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { createVendorSchema, updateVendorSchema } from './vendor.schema';

const router = Router();
const controller = new VendorController();

router.use(authenticate, tenantIsolation);

router.post('/', validate(createVendorSchema), controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.get('/:id/detail', controller.detail);
router.put('/:id', validate(updateVendorSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
