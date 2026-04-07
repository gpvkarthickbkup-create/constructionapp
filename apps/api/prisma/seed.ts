import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BuildWise database...\n');

  // 1. Create subscription plans
  const plans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-free-trial' },
      update: {},
      create: {
        id: 'plan-free-trial',
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
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-basic' },
      update: {},
      create: {
        id: 'plan-basic',
        name: 'basic',
        displayName: 'Basic',
        displayNameTa: 'அடிப்படை',
        price: 999,
        maxUsers: 5,
        maxSites: 15,
        maxStorageMB: 1000,
        features: JSON.stringify({ reports: true, export: true, approval: false }),
        sortOrder: 1,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-standard' },
      update: {},
      create: {
        id: 'plan-standard',
        name: 'standard',
        displayName: 'Standard',
        displayNameTa: 'நிலையான',
        price: 2499,
        maxUsers: 15,
        maxSites: 50,
        maxStorageMB: 5000,
        features: JSON.stringify({ reports: true, export: true, approval: true }),
        sortOrder: 2,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'plan-premium' },
      update: {},
      create: {
        id: 'plan-premium',
        name: 'premium',
        displayName: 'Premium',
        displayNameTa: 'பிரீமியம்',
        price: 4999,
        maxUsers: 50,
        maxSites: 200,
        maxStorageMB: 20000,
        features: JSON.stringify({ reports: true, export: true, approval: true, api: true }),
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`✅ Created ${plans.length} subscription plans`);

  // 2. Create permissions
  const modules = ['sites', 'expenses', 'vendors', 'reports', 'users', 'settings'];
  const actions = ['create', 'read', 'update', 'delete', 'export', 'approve'];

  let permCount = 0;
  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action, description: `${action} ${module}` },
      });
      permCount++;
    }
  }
  console.log(`✅ Created ${permCount} permissions`);

  // 3. Create super admin
  const adminPasswordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Admin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: process.env.SUPER_ADMIN_EMAIL || 'admin@buildwise.in' },
    update: {},
    create: {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@buildwise.in',
      passwordHash: adminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isSuperAdmin: true,
      isActive: true,
    },
  });
  console.log(`✅ Super admin created: ${superAdmin.email}`);

  // 4. Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { email: 'demo@buildwise.in' },
    update: {},
    create: {
      id: 'tenant-demo',
      companyName: 'Demo Constructions',
      ownerName: 'Rajesh Kumar',
      email: 'demo@buildwise.in',
      mobile: '9876543210',
      address: '123, Anna Nagar, Chennai - 600040',
      status: 'active',
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: 'plan-standard',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
  });

  // Create roles for demo tenant
  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: demoTenant.id, name: 'company_admin' } },
    update: {},
    create: { tenantId: demoTenant.id, name: 'company_admin', displayName: 'Company Admin', displayNameTa: 'நிறுவன நிர்வாகி', isSystem: true },
  });

  for (const role of [
    { name: 'accountant', displayName: 'Accountant', displayNameTa: 'கணக்காளர்' },
    { name: 'site_manager', displayName: 'Site Manager', displayNameTa: 'தள மேலாளர்' },
    { name: 'site_engineer', displayName: 'Site Engineer', displayNameTa: 'தள பொறியாளர்' },
    { name: 'data_entry', displayName: 'Data Entry', displayNameTa: 'தரவு பதிவு' },
    { name: 'viewer', displayName: 'Viewer', displayNameTa: 'பார்வையாளர்' },
  ]) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: role.name } },
      update: {},
      create: { tenantId: demoTenant.id, ...role, isSystem: true },
    });
  }

  // Create demo user
  const demoPasswordHash = await bcrypt.hash('Demo@123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@buildwise.in' },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'demo@buildwise.in',
      mobile: '9876543210',
      passwordHash: demoPasswordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
    },
  });

  await prisma.userRoleMap.upsert({
    where: { userId_roleId: { userId: demoUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: demoUser.id, roleId: adminRole.id },
  });
  console.log(`✅ Demo tenant: ${demoTenant.companyName} (${demoUser.email} / Demo@123)`);

  // 5. Create demo expense categories
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
    { name: 'Mason', nameTa: 'கொத்தனார்', type: 'labor', icon: 'user', color: '#B91C1C' },
    { name: 'Carpenter', nameTa: 'தச்சர்', type: 'labor', icon: 'user', color: '#92400E' },
    { name: 'Electrician', nameTa: 'எலக்ட்ரீஷியன்', type: 'labor', icon: 'user', color: '#F59E0B' },
    { name: 'Plumber', nameTa: 'பிளம்பர்', type: 'labor', icon: 'user', color: '#2563EB' },
    { name: 'Daily Wages', nameTa: 'தினக்கூலி', type: 'labor', icon: 'clock', color: '#0369A1' },
    { name: 'Transport', nameTa: 'போக்குவரத்து', type: 'transport', icon: 'truck', color: '#B45309' },
    { name: 'Machine Rental', nameTa: 'இயந்திர வாடகை', type: 'rental', icon: 'settings', color: '#64748B' },
    { name: 'Miscellaneous', nameTa: 'இதர செலவுகள்', type: 'miscellaneous', icon: 'more-horizontal', color: '#6B7280' },
  ];

  const categoryMap: Record<string, string> = {};
  for (let i = 0; i < categories.length; i++) {
    const cat = await prisma.expenseCategory.create({
      data: { tenantId: demoTenant.id, ...categories[i], isSystem: true, sortOrder: i },
    });
    categoryMap[categories[i].name] = cat.id;
  }
  console.log(`✅ Created ${categories.length} expense categories`);

  // 6. Create demo sites
  const sites = await Promise.all([
    prisma.site.create({
      data: {
        tenantId: demoTenant.id,
        siteCode: 'SITE-0001',
        siteName: 'Rajesh Villa - Velachery',
        clientName: 'Murugan S',
        clientMobile: '9876543211',
        address: '45, 3rd Cross Street, Velachery, Chennai',
        projectType: 'villa',
        status: 'active',
        startDate: new Date('2026-01-15'),
        expectedEndDate: new Date('2026-08-15'),
        estimatedBudget: 4500000,
        estimatedMaterialCost: 2500000,
        estimatedLaborCost: 1500000,
        estimatedOtherCost: 500000,
      },
    }),
    prisma.site.create({
      data: {
        tenantId: demoTenant.id,
        siteCode: 'SITE-0002',
        siteName: 'Lakshmi House - Tambaram',
        clientName: 'Lakshmi R',
        clientMobile: '9876543212',
        address: '12, West Tambaram, Chennai',
        projectType: 'house',
        status: 'active',
        startDate: new Date('2026-02-01'),
        expectedEndDate: new Date('2026-10-01'),
        estimatedBudget: 2800000,
        estimatedMaterialCost: 1600000,
        estimatedLaborCost: 900000,
        estimatedOtherCost: 300000,
      },
    }),
    prisma.site.create({
      data: {
        tenantId: demoTenant.id,
        siteCode: 'SITE-0003',
        siteName: 'Kumar Commercial - T.Nagar',
        clientName: 'Kumar P',
        clientMobile: '9876543213',
        address: '78, Usman Road, T.Nagar, Chennai',
        projectType: 'commercial',
        status: 'planning',
        estimatedBudget: 12000000,
        estimatedMaterialCost: 7000000,
        estimatedLaborCost: 3500000,
        estimatedOtherCost: 1500000,
      },
    }),
  ]);
  console.log(`✅ Created ${sites.length} demo sites`);

  // 7. Create demo vendors
  const vendors = await Promise.all([
    prisma.vendor.create({ data: { tenantId: demoTenant.id, vendorCode: 'VND-0001', name: 'Sri Cement Traders', type: 'supplier', mobile: '9000100001' } }),
    prisma.vendor.create({ data: { tenantId: demoTenant.id, vendorCode: 'VND-0002', name: 'KM Steel Works', type: 'supplier', mobile: '9000100002' } }),
    prisma.vendor.create({ data: { tenantId: demoTenant.id, vendorCode: 'VND-0003', name: 'Balu Sand Suppliers', type: 'supplier', mobile: '9000100003' } }),
    prisma.vendor.create({ data: { tenantId: demoTenant.id, vendorCode: 'VND-0004', name: 'Raja Tiles Centre', type: 'supplier', mobile: '9000100004' } }),
    prisma.vendor.create({ data: { tenantId: demoTenant.id, vendorCode: 'VND-0005', name: 'Murugan Constructions', type: 'labor_contractor', mobile: '9000100005' } }),
    prisma.vendor.create({ data: { tenantId: demoTenant.id, vendorCode: 'VND-0006', name: 'SK Transport', type: 'transporter', mobile: '9000100006' } }),
  ]);
  console.log(`✅ Created ${vendors.length} demo vendors`);

  // 8. Create demo expenses
  const expenseData = [
    { siteId: sites[0].id, vendorId: vendors[0].id, expenseType: 'material', categoryId: categoryMap['Cement'], itemName: 'UltraTech Cement 53 Grade', quantity: 200, unit: 'bag', rate: 420, paymentStatus: 'paid', paidAmount: 84000, paymentType: 'upi', daysAgo: 30 },
    { siteId: sites[0].id, vendorId: vendors[1].id, expenseType: 'material', categoryId: categoryMap['Steel / TMT'], itemName: 'TMT Steel 12mm', quantity: 5, unit: 'ton', rate: 62000, paymentStatus: 'partially_paid', paidAmount: 200000, paymentType: 'bank', daysAgo: 28 },
    { siteId: sites[0].id, vendorId: vendors[2].id, expenseType: 'material', categoryId: categoryMap['Sand'], itemName: 'River Sand', quantity: 10, unit: 'trip', rate: 12000, paymentStatus: 'paid', paidAmount: 120000, paymentType: 'cash', daysAgo: 25 },
    { siteId: sites[0].id, vendorId: vendors[4].id, expenseType: 'labor', categoryId: categoryMap['Mason'], itemName: 'Foundation masonry work', quantity: 1, unit: 'lot', rate: 150000, paymentStatus: 'partially_paid', paidAmount: 100000, paymentType: 'cash', daysAgo: 20 },
    { siteId: sites[0].id, vendorId: vendors[5].id, expenseType: 'transport', categoryId: categoryMap['Transport'], itemName: 'Material transport', quantity: 5, unit: 'trip', rate: 3500, paymentStatus: 'paid', paidAmount: 17500, paymentType: 'cash', daysAgo: 22 },
    { siteId: sites[0].id, vendorId: vendors[0].id, expenseType: 'material', categoryId: categoryMap['Cement'], itemName: 'UltraTech Cement 53 Grade', quantity: 150, unit: 'bag', rate: 425, paymentStatus: 'unpaid', paidAmount: 0, daysAgo: 10 },
    { siteId: sites[0].id, expenseType: 'labor', categoryId: categoryMap['Daily Wages'], itemName: 'Helper wages - Week 3', quantity: 7, unit: 'day', rate: 800, paymentStatus: 'paid', paidAmount: 5600, paymentType: 'cash', daysAgo: 7 },
    { siteId: sites[0].id, expenseType: 'miscellaneous', categoryId: categoryMap['Miscellaneous'], itemName: 'Plan approval fees', quantity: 1, unit: 'nos', rate: 25000, paymentStatus: 'paid', paidAmount: 25000, paymentType: 'bank', daysAgo: 45 },
    { siteId: sites[1].id, vendorId: vendors[0].id, expenseType: 'material', categoryId: categoryMap['Cement'], itemName: 'Dalmia Cement', quantity: 100, unit: 'bag', rate: 400, paymentStatus: 'paid', paidAmount: 40000, paymentType: 'upi', daysAgo: 15 },
    { siteId: sites[1].id, vendorId: vendors[2].id, expenseType: 'material', categoryId: categoryMap['Sand'], itemName: 'M-Sand', quantity: 6, unit: 'trip', rate: 15000, paymentStatus: 'paid', paidAmount: 90000, paymentType: 'bank', daysAgo: 12 },
    { siteId: sites[1].id, vendorId: vendors[4].id, expenseType: 'labor', categoryId: categoryMap['Mason'], itemName: 'Foundation work', quantity: 1, unit: 'lot', rate: 85000, paymentStatus: 'partially_paid', paidAmount: 50000, paymentType: 'cash', daysAgo: 8 },
    { siteId: sites[1].id, vendorId: vendors[3].id, expenseType: 'material', categoryId: categoryMap['Bricks'], itemName: 'Wire-cut Bricks', quantity: 10000, unit: 'nos', rate: 9, paymentStatus: 'unpaid', paidAmount: 0, daysAgo: 5 },
    { siteId: sites[1].id, expenseType: 'rental', categoryId: categoryMap['Machine Rental'], itemName: 'JCB rental - excavation', quantity: 2, unit: 'day', rate: 8000, paymentStatus: 'paid', paidAmount: 16000, paymentType: 'cash', daysAgo: 18 },
  ];

  for (let i = 0; i < expenseData.length; i++) {
    const d = expenseData[i];
    const total = d.quantity * d.rate;
    const due = total - d.paidAmount;
    const date = new Date();
    date.setDate(date.getDate() - d.daysAgo);

    await prisma.expense.create({
      data: {
        tenantId: demoTenant.id,
        siteId: d.siteId,
        vendorId: d.vendorId || null,
        expenseNumber: `BW-EXP-${String(i + 1).padStart(5, '0')}`,
        expenseDate: date,
        expenseType: d.expenseType,
        categoryId: d.categoryId,
        itemName: d.itemName,
        quantity: d.quantity,
        unit: d.unit,
        rate: d.rate,
        totalAmount: total,
        paymentStatus: d.paymentStatus as any,
        paidAmount: d.paidAmount,
        dueAmount: due,
        paymentType: d.paymentType || null,
        createdBy: demoUser.id,
      },
    });
  }
  console.log(`✅ Created ${expenseData.length} demo expenses`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Demo Credentials:');
  console.log('   Super Admin: admin@buildwise.in / Admin@123');
  console.log('   Demo User:   demo@buildwise.in / Demo@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
