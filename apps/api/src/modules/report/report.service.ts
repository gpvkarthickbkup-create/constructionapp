import prisma from '../../config/database';

export class ReportService {
  async siteWiseExpenseReport(tenantId: string, query: any) {
    const { dateFrom, dateTo, siteId } = query;
    const where: any = { tenantId, deletedAt: null };
    if (siteId) where.siteId = siteId;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) where.expenseDate.lte = new Date(dateTo);
    }

    const expenses = await prisma.expense.groupBy({
      by: ['siteId'],
      where,
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
      _count: true,
    });

    const siteIds = expenses.map(e => e.siteId);
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, siteName: true, siteCode: true, estimatedBudget: true, status: true },
    });
    const siteMap = new Map(sites.map(s => [s.id, s]));

    return expenses.map(e => ({
      site: siteMap.get(e.siteId),
      totalAmount: e._sum.totalAmount || 0,
      paidAmount: e._sum.paidAmount || 0,
      dueAmount: e._sum.dueAmount || 0,
      entryCount: e._count,
    }));
  }

  async categoryWiseReport(tenantId: string, query: any) {
    const { dateFrom, dateTo, siteId, expenseType } = query;
    const where: any = { tenantId, deletedAt: null };
    if (siteId) where.siteId = siteId;
    if (expenseType) where.expenseType = expenseType;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) where.expenseDate.lte = new Date(dateTo);
    }

    const result = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { totalAmount: true, quantity: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
    });

    const categoryIds = result.map(r => r.categoryId).filter(Boolean) as string[];
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, nameTa: true, type: true, color: true },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return result.map(r => ({
      category: r.categoryId ? categoryMap.get(r.categoryId) : { name: 'Uncategorized', nameTa: 'வகைப்படுத்தப்படாத' },
      totalAmount: r._sum.totalAmount || 0,
      totalQuantity: r._sum.quantity || 0,
      entryCount: r._count,
    }));
  }

  async vendorWiseReport(tenantId: string, query: any) {
    const { dateFrom, dateTo, siteId } = query;
    const where: any = { tenantId, deletedAt: null, vendorId: { not: null } };
    if (siteId) where.siteId = siteId;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) where.expenseDate.lte = new Date(dateTo);
    }

    const result = await prisma.expense.groupBy({
      by: ['vendorId'],
      where,
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
    });

    const vendorIds = result.map(r => r.vendorId).filter(Boolean) as string[];
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true, vendorCode: true, type: true, mobile: true },
    });
    const vendorMap = new Map(vendors.map(v => [v.id, v]));

    return result.map(r => ({
      vendor: vendorMap.get(r.vendorId!),
      totalAmount: r._sum.totalAmount || 0,
      paidAmount: r._sum.paidAmount || 0,
      dueAmount: r._sum.dueAmount || 0,
      entryCount: r._count,
    }));
  }

  async pendingPaymentReport(tenantId: string, query: any) {
    const { siteId, vendorId } = query;
    const where: any = { tenantId, deletedAt: null, paymentStatus: { not: 'paid' } };
    if (siteId) where.siteId = siteId;
    if (vendorId) where.vendorId = vendorId;

    return prisma.expense.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { dueAmount: 'desc' }],
      include: {
        site: { select: { siteName: true, siteCode: true } },
        vendor: { select: { name: true, mobile: true } },
        category: { select: { name: true, nameTa: true } },
      },
    });
  }

  async budgetVsActualReport(tenantId: string) {
    const sites = await prisma.site.findMany({
      where: { tenantId, deletedAt: null, estimatedBudget: { gt: 0 } },
      select: {
        id: true, siteName: true, siteCode: true, status: true,
        estimatedBudget: true, estimatedMaterialCost: true,
        estimatedLaborCost: true, estimatedOtherCost: true,
      },
    });

    return Promise.all(sites.map(async (site) => {
      const [material, labor, other] = await Promise.all([
        prisma.expense.aggregate({
          where: { siteId: site.id, tenantId, expenseType: 'material', deletedAt: null },
          _sum: { totalAmount: true },
        }),
        prisma.expense.aggregate({
          where: { siteId: site.id, tenantId, expenseType: 'labor', deletedAt: null },
          _sum: { totalAmount: true },
        }),
        prisma.expense.aggregate({
          where: { siteId: site.id, tenantId, expenseType: { notIn: ['material', 'labor'] }, deletedAt: null },
          _sum: { totalAmount: true },
        }),
      ]);

      const actualMaterial = material._sum.totalAmount || 0;
      const actualLabor = labor._sum.totalAmount || 0;
      const actualOther = other._sum.totalAmount || 0;
      const actualTotal = actualMaterial + actualLabor + actualOther;

      return {
        ...site,
        actual: {
          total: actualTotal,
          material: actualMaterial,
          labor: actualLabor,
          other: actualOther,
        },
        variance: {
          total: site.estimatedBudget - actualTotal,
          material: site.estimatedMaterialCost - actualMaterial,
          labor: site.estimatedLaborCost - actualLabor,
          other: site.estimatedOtherCost - actualOther,
        },
        budgetUsedPercent: site.estimatedBudget > 0 ? Math.round((actualTotal / site.estimatedBudget) * 100) : 0,
      };
    }));
  }

  async monthlySpendingReport(tenantId: string, query: any) {
    const { year, siteId } = query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const months = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(targetYear, m, 1);
      const end = new Date(targetYear, m + 1, 0, 23, 59, 59);

      const where: any = {
        tenantId, deletedAt: null,
        expenseDate: { gte: start, lte: end },
      };
      if (siteId) where.siteId = siteId;

      const [total, material, labor] = await Promise.all([
        prisma.expense.aggregate({ where, _sum: { totalAmount: true } }),
        prisma.expense.aggregate({ where: { ...where, expenseType: 'material' }, _sum: { totalAmount: true } }),
        prisma.expense.aggregate({ where: { ...where, expenseType: 'labor' }, _sum: { totalAmount: true } }),
      ]);

      months.push({
        month: start.toLocaleDateString('en-US', { month: 'long' }),
        monthNumber: m + 1,
        total: total._sum.totalAmount || 0,
        material: material._sum.totalAmount || 0,
        labor: labor._sum.totalAmount || 0,
        other: (total._sum.totalAmount || 0) - (material._sum.totalAmount || 0) - (labor._sum.totalAmount || 0),
      });
    }
    return months;
  }

  async dateWiseReport(tenantId: string, query: any) {
    const { dateFrom, dateTo, siteId } = query;
    const where: any = { tenantId, deletedAt: null };
    if (siteId) where.siteId = siteId;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) where.expenseDate.lte = new Date(dateTo);
    }

    return prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: {
        site: { select: { siteName: true, siteCode: true } },
        vendor: { select: { name: true } },
        category: { select: { name: true, nameTa: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
