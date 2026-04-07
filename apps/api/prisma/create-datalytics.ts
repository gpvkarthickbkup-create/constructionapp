import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Datalytics@123', 12);

  const plan = await prisma.subscriptionPlan.findFirst({ where: { name: 'standard' } });
  if (!plan) throw new Error('Standard plan not found. Run seed first.');

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);

  // Check if already exists
  const existing = await prisma.tenant.findUnique({ where: { email: 'Gpvk@datalytics.com' } });
  if (existing) {
    console.log('Account already exists! Deleting and recreating...');
    await prisma.tenant.delete({ where: { id: existing.id } }).catch(() => {});
  }

  const existingUser = await prisma.user.findUnique({ where: { email: 'Gpvk@datalytics.com' } });
  if (existingUser) {
    await prisma.userRoleMap.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } }).catch(() => {});
  }

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        companyName: 'Datalytics Constructions',
        ownerName: 'Palanivel',
        email: 'Gpvk@datalytics.com',
        mobile: '9876543210',
        status: 'active',
      },
    });

    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        startDate: new Date(),
        endDate: trialEnd,
        status: 'active',
      },
    });

    const adminRole = await tx.role.create({
      data: { tenantId: tenant.id, name: 'company_admin', displayName: 'Company Admin', displayNameTa: 'நிறுவன நிர்வாகி', isSystem: true },
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

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: 'Gpvk@datalytics.com',
        mobile: '9876543210',
        passwordHash,
        firstName: 'Palanivel',
      },
    });

    await tx.userRoleMap.create({
      data: { userId: user.id, roleId: adminRole.id },
    });

    const categories = [
      { name: 'Cement', nameTa: 'சிமெண்ட்', type: 'material', icon: 'package', color: '#6B7280' },
      { name: 'Steel / TMT', nameTa: 'ஸ்டீல் / TMT', type: 'material', icon: 'grid', color: '#374151' },
      { name: 'Bricks', nameTa: 'செங்கல்', type: 'material', icon: 'square', color: '#DC2626' },
      { name: 'Sand', nameTa: 'மணல்', type: 'material', icon: 'layers', color: '#D97706' },
      { name: 'Blue Metal / Jelly', nameTa: 'ப்ளூ மெட்டல்', type: 'material', icon: 'hexagon', color: '#4B5563' },
      { name: 'Tiles', nameTa: 'டைல்ஸ்', type: 'material', icon: 'grid', color: '#059669' },
      { name: 'Paint', nameTa: 'பெயிண்ட்', type: 'material', icon: 'droplet', color: '#7C3AED' },
      { name: 'Plumbing', nameTa: 'பிளம்பிங்', type: 'material', icon: 'tool', color: '#2563EB' },
      { name: 'Electrical', nameTa: 'எலக்ட்ரிக்கல்', type: 'material', icon: 'zap', color: '#F59E0B' },
      { name: 'Wood', nameTa: 'மரம்', type: 'material', icon: 'tree', color: '#92400E' },
      { name: 'Doors / Windows', nameTa: 'கதவுகள் / ஜன்னல்கள்', type: 'material', icon: 'door', color: '#A16207' },
      { name: 'Waterproofing', nameTa: 'வாட்டர்ப்ரூஃபிங்', type: 'material', icon: 'shield', color: '#0891B2' },
      { name: 'Ready-mix Concrete', nameTa: 'ரெடிமிக்ஸ்', type: 'material', icon: 'truck', color: '#57534E' },
      { name: 'Interior Materials', nameTa: 'உள் அலங்கார பொருட்கள்', type: 'material', icon: 'star', color: '#DB2777' },
      { name: 'Mason', nameTa: 'கொத்தனார்', type: 'labor', icon: 'user', color: '#B91C1C' },
      { name: 'Carpenter', nameTa: 'தச்சர்', type: 'labor', icon: 'user', color: '#92400E' },
      { name: 'Painter', nameTa: 'பெயிண்டர்', type: 'labor', icon: 'user', color: '#7C3AED' },
      { name: 'Electrician', nameTa: 'எலக்ட்ரீஷியன்', type: 'labor', icon: 'user', color: '#F59E0B' },
      { name: 'Plumber', nameTa: 'பிளம்பர்', type: 'labor', icon: 'user', color: '#2563EB' },
      { name: 'Tile Worker', nameTa: 'டைல்ஸ் வேலையாள்', type: 'labor', icon: 'user', color: '#059669' },
      { name: 'Helpers', nameTa: 'ஹெல்பர்கள்', type: 'labor', icon: 'users', color: '#6B7280' },
      { name: 'Daily Wages', nameTa: 'தினக்கூலி', type: 'labor', icon: 'clock', color: '#0369A1' },
      { name: 'Contractor Bill', nameTa: 'ஒப்பந்ததாரர் பில்', type: 'labor', icon: 'file-text', color: '#374151' },
      { name: 'Commission', nameTa: 'கமிஷன்', type: 'commission', icon: 'percent', color: '#7C3AED' },
      { name: 'Government Charges', nameTa: 'அரசு கட்டணம்', type: 'miscellaneous', icon: 'file', color: '#1E40AF' },
      { name: 'Transport', nameTa: 'போக்குவரத்து', type: 'transport', icon: 'truck', color: '#B45309' },
      { name: 'Loading / Unloading', nameTa: 'ஏற்றுதல் / இறக்குதல்', type: 'transport', icon: 'package', color: '#A16207' },
      { name: 'Machine Rental', nameTa: 'இயந்திர வாடகை', type: 'rental', icon: 'settings', color: '#64748B' },
      { name: 'JCB / Crane / Mixer', nameTa: 'JCB / கிரேன் / மிக்சர்', type: 'rental', icon: 'truck', color: '#57534E' },
      { name: 'Fuel', nameTa: 'எரிபொருள்', type: 'miscellaneous', icon: 'fuel', color: '#DC2626' },
      { name: 'Worker Food / Stay', nameTa: 'தொழிலாளர் உணவு / தங்குமிடம்', type: 'miscellaneous', icon: 'home', color: '#059669' },
      { name: 'Miscellaneous', nameTa: 'இதர செலவுகள்', type: 'miscellaneous', icon: 'more-horizontal', color: '#6B7280' },
    ];

    for (let i = 0; i < categories.length; i++) {
      await tx.expenseCategory.create({
        data: { tenantId: tenant.id, ...categories[i], isSystem: true, sortOrder: i },
      });
    }

    return { tenant, user };
  });

  console.log('');
  console.log('========================================');
  console.log('  Account Created Successfully!');
  console.log('========================================');
  console.log('');
  console.log('  Company:  Datalytics Constructions');
  console.log('  Email:    Gpvk@datalytics.com');
  console.log('  Password: Datalytics@123');
  console.log('  Plan:     Standard (30 days)');
  console.log('  Status:   Active');
  console.log('  Data:     Clean (no sites/expenses)');
  console.log('  Categories: 32 pre-loaded');
  console.log('');
  console.log('========================================');
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
