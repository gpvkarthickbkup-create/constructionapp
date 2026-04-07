import prisma from '../../config/database';
import { CreateSiteInput } from './site.schema';
import { NotFoundError } from '../../utils/errors';
import { generateCode, parsePagination } from '../../utils/helpers';

export class SiteService {
  async create(tenantId: string, input: CreateSiteInput) {
    const count = await prisma.site.count({ where: { tenantId } });
    const siteCode = input.siteCode || generateCode('SITE', count);

    return prisma.site.create({
      data: {
        tenantId,
        siteCode,
        siteName: input.siteName,
        clientName: input.clientName,
        clientMobile: input.clientMobile,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        projectType: input.projectType,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        expectedEndDate: input.expectedEndDate ? new Date(input.expectedEndDate) : undefined,
        estimatedBudget: input.estimatedBudget,
        estimatedMaterialCost: input.estimatedMaterialCost,
        estimatedLaborCost: input.estimatedLaborCost,
        estimatedOtherCost: input.estimatedOtherCost,
        status: input.status,
        assignedManagerId: input.assignedManagerId,
        notes: input.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
    const { status, projectType } = query;

    const where: any = { tenantId, deletedAt: null };

    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (search) {
      where.OR = [
        { siteName: { contains: search } },
        { siteCode: { contains: search } },
        { clientName: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.site.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.site.count({ where }),
    ]);

    // Add spent amount for each site
    const dataWithSpent = await Promise.all(
      data.map(async (site) => {
        const spent = await prisma.expense.aggregate({
          where: { siteId: site.id, tenantId, deletedAt: null },
          _sum: { totalAmount: true },
        });
        return { ...site, totalSpent: spent._sum.totalAmount || 0 };
      })
    );

    return {
      data: dataWithSpent,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string) {
    const site = await prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        siteImages: { orderBy: { sortOrder: 'asc' } },
        siteAssignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!site) throw new NotFoundError('Site');
    return site;
  }

  async update(tenantId: string, id: string, input: Partial<CreateSiteInput>) {
    const site = await this.findById(tenantId, id);
    return prisma.site.update({
      where: { id: site.id },
      data: {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        expectedEndDate: input.expectedEndDate ? new Date(input.expectedEndDate) : undefined,
      },
    });
  }

  async softDelete(tenantId: string, id: string) {
    const site = await this.findById(tenantId, id);
    return prisma.site.update({
      where: { id: site.id },
      data: { deletedAt: new Date() },
    });
  }

  async getSiteDashboard(tenantId: string, siteId: string) {
    const site = await this.findById(tenantId, siteId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalExpenses,
      materialTotal,
      laborTotal,
      otherTotal,
      thisMonthTotal,
      todayTotal,
      pendingPayments,
      topItems,
      topVendors,
      recentExpenses,
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: { siteId, tenantId, deletedAt: null },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { siteId, tenantId, expenseType: 'material', deletedAt: null },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { siteId, tenantId, expenseType: 'labor', deletedAt: null },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: {
          siteId, tenantId, deletedAt: null,
          expenseType: { notIn: ['material', 'labor'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { siteId, tenantId, deletedAt: null, expenseDate: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { siteId, tenantId, deletedAt: null, expenseDate: { gte: startOfDay } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { siteId, tenantId, deletedAt: null, paymentStatus: { not: 'paid' } },
        _sum: { dueAmount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ['itemName'],
        where: { siteId, tenantId, deletedAt: null },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      prisma.expense.groupBy({
        by: ['vendorId'],
        where: { siteId, tenantId, deletedAt: null, vendorId: { not: null } },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      prisma.expense.findMany({
        where: { siteId, tenantId, deletedAt: null },
        orderBy: { expenseDate: 'desc' },
        take: 10,
        include: { vendor: { select: { name: true } }, category: { select: { name: true, nameTa: true } } },
      }),
    ]);

    const totalCost = totalExpenses._sum.totalAmount || 0;
    const budgetUsedPercent = site.estimatedBudget > 0
      ? Math.round((totalCost / site.estimatedBudget) * 100)
      : 0;

    // Financial calculations
    const customerEst = site.customerEstimate || ((site.totalSqft || 0) * (site.customerRatePerSqft || 0));
    const builderEst = site.builderEstimate || ((site.totalSqft || 0) * (site.builderRatePerSqft || 0));
    // Use saleAmount if entered (after sale confirmation), otherwise use customerEstimate
    const effectiveRevenue = site.saleAmount > 0 ? site.saleAmount : customerEst;
    const profit = effectiveRevenue - totalCost;
    const estimatedProfit = effectiveRevenue - builderEst;
    const profitMargin = effectiveRevenue > 0 ? Math.round((profit / effectiveRevenue) * 100) : 0;
    const costPerSqft = site.totalSqft > 0 ? Math.round(totalCost / site.totalSqft) : 0;

    return {
      site,
      summary: {
        totalCost,
        materialCost: materialTotal._sum.totalAmount || 0,
        laborCost: laborTotal._sum.totalAmount || 0,
        otherCost: otherTotal._sum.totalAmount || 0,
        thisMonthSpend: thisMonthTotal._sum.totalAmount || 0,
        todaySpend: todayTotal._sum.totalAmount || 0,
        pendingPayments: pendingPayments._sum.dueAmount || 0,
        pendingCount: pendingPayments._count || 0,
        budgetUsedPercent,
        budgetCrossed: budgetUsedPercent > 100,
        // Financial
        customerEstimate: customerEst,
        builderEstimate: builderEst,
        saleAmount: site.saleAmount || 0,
        effectiveRevenue,
        profit,
        estimatedProfit,
        profitMargin,
        costPerSqft,
        saleConfirmed: site.saleAmount > 0,
      },
      topItems,
      topVendors,
      recentExpenses,
    };
  }
}
