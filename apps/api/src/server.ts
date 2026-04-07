import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import siteRoutes from './modules/site/site.routes';
import expenseRoutes from './modules/expense/expense.routes';
import vendorRoutes from './modules/vendor/vendor.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportRoutes from './modules/report/report.routes';
import tenantRoutes from './modules/tenant/tenant.routes';
import userRoutes from './modules/user/user.routes';
import uploadRoutes from './modules/upload/upload.routes';
import customerRoutes from './modules/customer/customer.routes';
import landRoutes from './modules/land/land.routes';
// import bankRoutes from './modules/bank/bank.routes'; // Removed

const app = express();

// Security & compression
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
  origin: true, // Allow all origins in dev (mobile app + web)
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/lands', landRoutes);
// app.use('/api/bank', bankRoutes); // Removed

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Datalytics Construction API is running', version: '1.0.0' });
});

// One-time setup: make a user super admin (remove after use)
app.post('/api/setup/make-admin', async (req, res) => {
  try {
    const { email, secret } = req.body;
    if (secret !== 'datalytics-setup-2026') return res.status(403).json({ success: false, message: 'Invalid secret' });
    const { default: prisma } = await import('./config/database');
    const user = await prisma.user.update({ where: { email }, data: { isSuperAdmin: true } });
    res.json({ success: true, message: `${email} is now super admin` });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n🏗️  Datalytics Construction API running on http://localhost:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}\n`);
});

export default app;
