import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation, getTenantId } from '../../middleware/tenantIsolation';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/helpers';

const router = Router();
router.use(authenticate, tenantIsolation);

// List notes (most recent first, pinned on top)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { siteId, category, converted } = req.query;
    const where: any = { tenantId, userId: req.user!.id };
    if (siteId) where.siteId = siteId;
    if (category) where.category = category;
    if (converted === 'true') where.isConverted = true;
    if (converted === 'false') where.isConverted = false;

    const notes = await prisma.quickNote.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    sendSuccess(res, notes);
  } catch (error) { next(error); }
});

// Create note
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { title, content, siteId, category } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content is required' });

    const note = await prisma.quickNote.create({
      data: {
        tenantId,
        userId: req.user!.id,
        title: title?.trim() || undefined,
        content: content.trim(),
        siteId: siteId || undefined,
        category: category || 'general',
      },
    });
    sendSuccess(res, note, 'Note saved', 201);
  } catch (error) { next(error); }
});

// Update note
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { title, content, siteId, category, isPinned, isConverted, convertedId } = req.body;
    const note = await prisma.quickNote.updateMany({
      where: { id: req.params.id, tenantId, userId: req.user!.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(siteId !== undefined && { siteId }),
        ...(category !== undefined && { category }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isConverted !== undefined && { isConverted }),
        ...(convertedId !== undefined && { convertedId }),
      },
    });
    sendSuccess(res, note, 'Note updated');
  } catch (error) { next(error); }
});

// Delete note
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    await prisma.quickNote.deleteMany({
      where: { id: req.params.id, tenantId, userId: req.user!.id },
    });
    sendSuccess(res, null, 'Note deleted');
  } catch (error) { next(error); }
});

// Convert note to expense (mark as converted)
router.post('/:id/convert', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const note = await prisma.quickNote.findFirst({
      where: { id: req.params.id, tenantId, userId: req.user!.id },
    });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    await prisma.quickNote.update({
      where: { id: req.params.id },
      data: { isConverted: true, convertedId: req.body.expenseId || undefined },
    });
    sendSuccess(res, null, 'Note marked as converted');
  } catch (error) { next(error); }
});

export default router;
