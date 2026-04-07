import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { upload } from '../../middleware/upload';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/helpers';

const router = Router();

router.use(authenticate, tenantIsolation);

// Single file upload
router.post('/single', upload.single('file'), (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    sendSuccess(res, {
      url: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    }, 'File uploaded successfully');
  } catch (error) { next(error); }
});

// Multiple file upload
router.post('/multiple', upload.array('files', 10), (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    sendSuccess(res, files.map(f => ({
      url: `/uploads/${f.filename}`,
      fileName: f.originalname,
      fileType: f.mimetype,
      fileSize: f.size,
    })), 'Files uploaded successfully');
  } catch (error) { next(error); }
});

export default router;
