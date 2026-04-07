import { Router } from 'express';
import { SiteController } from './site.controller';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { createSiteSchema, updateSiteSchema } from './site.schema';
import { upload } from '../../middleware/upload';
import { sendSuccess } from '../../utils/helpers';
import { SiteService } from './site.service';
import { getTenantId } from '../../middleware/tenantIsolation';

const router = Router();
const controller = new SiteController();
const siteService = new SiteService();

router.use(authenticate, tenantIsolation);

router.post('/', validate(createSiteSchema), controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.get('/:id/dashboard', controller.dashboard);
router.put('/:id', validate(updateSiteSchema), controller.update);
router.delete('/:id', controller.delete);

// Upload site document/image
router.post('/:id/documents', upload.single('file'), async (req: any, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const site = await siteService.findById(tenantId, req.params.id);
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });

    const { default: prisma } = await import('../../config/database');
    const doc = await prisma.siteImage.create({
      data: {
        siteId: site.id,
        imageUrl: `/uploads/${req.file.filename}`,
        caption: req.body.caption || req.file.originalname || req.file.filename,
        imageType: req.body.imageType || 'general',
      },
    });
    sendSuccess(res, doc, 'Document uploaded', 201);
  } catch (error) { next(error); }
});

// Delete site document
router.delete('/:id/documents/:docId', async (req: any, res, next) => {
  try {
    const tenantId = getTenantId(req);
    await siteService.findById(tenantId, req.params.id);
    const { default: prisma } = await import('../../config/database');
    await prisma.siteImage.delete({ where: { id: req.params.docId } });
    sendSuccess(res, null, 'Document deleted');
  } catch (error) { next(error); }
});

export default router;
