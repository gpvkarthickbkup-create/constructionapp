import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { config } from '../../config';
import { LoginInput, RegisterInput } from './auth.schema';
import { UnauthorizedError, ConflictError, ValidationError } from '../../utils/errors';

export class AuthService {
  async register(input: RegisterInput) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const existingTenant = await prisma.tenant.findUnique({ where: { email: input.email } });
    if (existingTenant) {
      throw new ConflictError('Company with this email already exists');
    }

    // Get free trial plan
    let trialPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'free_trial', isActive: true },
    });

    if (!trialPlan) {
      // Create default trial plan if not exists
      trialPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'free_trial',
          displayName: 'Free Trial',
          displayNameTa: 'இலவச சோதனை',
          price: 0,
          maxUsers: 3,
          maxSites: 5,
          maxStorageMB: 200,
          features: JSON.stringify({ reports: true, export: false, approval: false }),
          sortOrder: 0,
        },
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Create tenant, subscription, user, and default roles in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          companyName: input.companyName,
          ownerName: input.ownerName,
          email: input.email,
          mobile: input.mobile,
          address: input.address,
          status: 'active',
        },
      });

      // Create subscription — active by default, no trial
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: trialPlan!.id,
          startDate: new Date(),
          endDate: oneYearLater,
          status: 'active',
        },
      });

      // Create default roles for the tenant
      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'company_admin',
          displayName: 'Company Admin',
          displayNameTa: 'நிறுவன நிர்வாகி',
          isSystem: true,
        },
      });

      await tx.role.createMany({
        data: [
          { tenantId: tenant.id, name: 'accountant', displayName: 'Accountant', displayNameTa: 'கணக்காளர்', isSystem: true },
          { tenantId: tenant.id, name: 'site_manager', displayName: 'Site Manager', displayNameTa: 'தள மேலாளர்', isSystem: true },
          { tenantId: tenant.id, name: 'site_engineer', displayName: 'Site Engineer', displayNameTa: 'தள பொறியாளர்', isSystem: true },
          { tenantId: tenant.id, name: 'data_entry', displayName: 'Data Entry', displayNameTa: 'தரவு பதிவு', isSystem: true },
          { tenantId: tenant.id, name: 'viewer', displayName: 'Viewer', displayNameTa: 'பார்வையாளர்', isSystem: true },
        ],
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.email,
          mobile: input.mobile,
          passwordHash,
          firstName: input.ownerName.split(' ')[0],
          lastName: input.ownerName.split(' ').slice(1).join(' ') || undefined,
        },
      });

      // Assign admin role to owner
      await tx.userRoleMap.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      // Create default expense categories
      await this.createDefaultCategories(tx, tenant.id);

      return { tenant, user };
    });

    const tokens = await this.generateTokens(result.user.id);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tenant: {
        id: result.tenant.id,
        companyName: result.tenant.companyName,
        status: result.tenant.status,
      },
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email, deletedAt: null },
      include: {
        tenant: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        language: user.language,
        roles: user.userRoles.map(ur => ur.role.name),
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        companyName: user.tenant.companyName,
        status: user.tenant.status,
        logo: user.tenant.logo,
        language: user.tenant.language,
      } : null,
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      return this.generateTokens(decoded.userId);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    // Calculate expiry
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: refreshExpiry,
      },
    });

    return { accessToken, refreshToken };
  }

  private async createDefaultCategories(tx: any, tenantId: string) {
    const categories = [
      // Material categories
      { name: 'Cement', nameTa: 'சிமெண்ட்', type: 'material', icon: 'package', color: '#6B7280' },
      { name: 'Steel / TMT', nameTa: 'ஸ்டீல் / TMT', type: 'material', icon: 'grid', color: '#374151' },
      { name: 'Bricks', nameTa: 'செங்கல்', type: 'material', icon: 'square', color: '#DC2626' },
      { name: 'Sand', nameTa: 'மணல்', type: 'material', icon: 'layers', color: '#D97706' },
      { name: 'Blue Metal / Jelly', nameTa: 'ப்ளூ மெட்டல் / ஜெல்லி', type: 'material', icon: 'hexagon', color: '#4B5563' },
      { name: 'M-Sand / P-Sand', nameTa: 'M-சாண்ட் / P-சாண்ட்', type: 'material', icon: 'layers', color: '#B45309' },
      { name: 'Tiles', nameTa: 'டைல்ஸ்', type: 'material', icon: 'grid', color: '#059669' },
      { name: 'Paint', nameTa: 'பெயிண்ட்', type: 'material', icon: 'droplet', color: '#7C3AED' },
      { name: 'Plumbing Materials', nameTa: 'பிளம்பிங் பொருட்கள்', type: 'material', icon: 'tool', color: '#2563EB' },
      { name: 'Electrical Materials', nameTa: 'எலக்ட்ரிக்கல் பொருட்கள்', type: 'material', icon: 'zap', color: '#F59E0B' },
      { name: 'Wood', nameTa: 'மரம்', type: 'material', icon: 'tree', color: '#92400E' },
      { name: 'Glass', nameTa: 'கண்ணாடி', type: 'material', icon: 'square', color: '#06B6D4' },
      { name: 'Roofing Sheets', nameTa: 'கூரை தகடுகள்', type: 'material', icon: 'home', color: '#64748B' },
      { name: 'Hardware', nameTa: 'ஹார்ட்வேர்', type: 'material', icon: 'wrench', color: '#78716C' },
      { name: 'Doors / Windows', nameTa: 'கதவுகள் / ஜன்னல்கள்', type: 'material', icon: 'door', color: '#A16207' },
      { name: 'Ready-mix Concrete', nameTa: 'ரெடிமிக்ஸ் கான்கிரீட்', type: 'material', icon: 'truck', color: '#57534E' },
      { name: 'Interior Materials', nameTa: 'உள் அலங்கார பொருட்கள்', type: 'material', icon: 'star', color: '#DB2777' },
      { name: 'Waterproofing', nameTa: 'வாட்டர்ப்ரூஃபிங்', type: 'material', icon: 'shield', color: '#0891B2' },
      // Labor categories
      { name: 'Mason', nameTa: 'கொத்தனார்', type: 'labor', icon: 'user', color: '#B91C1C' },
      { name: 'Carpenter', nameTa: 'தச்சர்', type: 'labor', icon: 'user', color: '#92400E' },
      { name: 'Painter', nameTa: 'பெயிண்டர்', type: 'labor', icon: 'user', color: '#7C3AED' },
      { name: 'Electrician', nameTa: 'எலக்ட்ரீஷியன்', type: 'labor', icon: 'user', color: '#F59E0B' },
      { name: 'Plumber', nameTa: 'பிளம்பர்', type: 'labor', icon: 'user', color: '#2563EB' },
      { name: 'Tile Worker', nameTa: 'டைல்ஸ் வேலையாள்', type: 'labor', icon: 'user', color: '#059669' },
      { name: 'Welder', nameTa: 'வெல்டர்', type: 'labor', icon: 'user', color: '#DC2626' },
      { name: 'Helpers', nameTa: 'ஹெல்பர்கள்', type: 'labor', icon: 'users', color: '#6B7280' },
      { name: 'Site Supervisor', nameTa: 'தள மேற்பார்வையாளர்', type: 'labor', icon: 'user-check', color: '#1D4ED8' },
      { name: 'Contractor Bill', nameTa: 'ஒப்பந்ததாரர் பில்', type: 'labor', icon: 'file-text', color: '#374151' },
      { name: 'Daily Wages', nameTa: 'தினக்கூலி', type: 'labor', icon: 'clock', color: '#0369A1' },
      // Other categories
      { name: 'Commission', nameTa: 'கமிஷன்', type: 'commission', icon: 'percent', color: '#7C3AED' },
      { name: 'Broker Charges', nameTa: 'தரகர் கட்டணம்', type: 'commission', icon: 'user', color: '#6D28D9' },
      { name: 'Government / Permit Charges', nameTa: 'அரசு / அனுமதி கட்டணம்', type: 'miscellaneous', icon: 'file', color: '#1E40AF' },
      { name: 'Transport / Lorry Charges', nameTa: 'போக்குவரத்து / லாரி கட்டணம்', type: 'transport', icon: 'truck', color: '#B45309' },
      { name: 'Loading / Unloading', nameTa: 'ஏற்றுதல் / இறக்குதல்', type: 'transport', icon: 'package', color: '#A16207' },
      { name: 'Machine Rental', nameTa: 'இயந்திர வாடகை', type: 'rental', icon: 'settings', color: '#64748B' },
      { name: 'JCB / Crane / Mixer Rent', nameTa: 'JCB / கிரேன் / மிக்சர் வாடகை', type: 'rental', icon: 'truck', color: '#57534E' },
      { name: 'Fuel', nameTa: 'தள எரிபொருள்', type: 'miscellaneous', icon: 'fuel', color: '#DC2626' },
      { name: 'Worker Accommodation / Food', nameTa: 'தொழிலாளர் தங்குமிடம் / உணவு', type: 'miscellaneous', icon: 'home', color: '#059669' },
      { name: 'Miscellaneous', nameTa: 'இதர தள செலவுகள்', type: 'miscellaneous', icon: 'more-horizontal', color: '#6B7280' },
    ];

    for (let i = 0; i < categories.length; i++) {
      await tx.expenseCategory.create({
        data: {
          tenantId,
          ...categories[i],
          isSystem: true,
          sortOrder: i,
        },
      });
    }
  }
}
