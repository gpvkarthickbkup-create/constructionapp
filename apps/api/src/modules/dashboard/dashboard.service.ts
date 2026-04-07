import prisma from '../../config/database';

export class DashboardService {
  async getCompanyDashboard(tenantId: string, query: any = {}) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const dateFilter = dateFrom || dateTo ? {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    } : undefined;

    const baseWhere = { tenantId, deletedAt: null };
    const expenseWhere = { ...baseWhere, ...(dateFilter && { expenseDate: dateFilter }) };

    const [
      totalSites,
      activeSites,
      completedSites,
      totalSpend,
      materialSpend,
      laborSpend,
      pendingPayments,
      thisMonthSpend,
      todaySpend,
      budgetOverrunSites,
      siteWiseExpense,
      categoryBreakdown,
      monthlyTrend,
      topCostSites,
      topVendors,
      recentActivity,
    ] = await Promise.all([
      prisma.site.count({ where: { ...baseWhere } }),
      prisma.site.count({ where: { ...baseWhere, status: 'active' } }),
      prisma.site.count({ where: { ...baseWhere, status: 'completed' } }),
      prisma.expense.aggregate({ where: expenseWhere, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where: { ...expenseWhere, expenseType: 'material' }, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where: { ...expenseWhere, expenseType: 'labor' }, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({
        where: { ...baseWhere, paymentStatus: { not: 'paid' } },
        _sum: { dueAmount: true },
      }),
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseDate: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseDate: { gte: startOfDay } },
        _sum: { totalAmount: true },
      }),
      this.getBudgetOverrunSites(tenantId),
      // Site-wise expenses (top 10)
      prisma.expense.groupBy({
        by: ['siteId'],
        where: expenseWhere,
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      // Category breakdown
      prisma.expense.groupBy({
        by: ['expenseType'],
        where: expenseWhere,
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),
      // Monthly trend (last 12 months)
      this.getMonthlyTrend(tenantId),
      // Top 10 cost sites
      prisma.expense.groupBy({
        by: ['siteId'],
        where: expenseWhere,
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      // Top 10 vendors
      prisma.expense.groupBy({
        by: ['vendorId'],
        where: { ...expenseWhere, vendorId: { not: null } },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      // Recent activity
      prisma.activityLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    // Enrich site-wise data with site names
    const siteIds = [...new Set([
      ...siteWiseExpense.map(s => s.siteId),
      ...topCostSites.map(s => s.siteId),
    ])];
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, siteName: true, siteCode: true, estimatedBudget: true },
    });
    const siteMap = new Map(sites.map(s => [s.id, s]));

    // Enrich vendor data
    const vendorIds = topVendors.map(v => v.vendorId).filter(Boolean) as string[];
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true },
    });
    const vendorMap = new Map(vendors.map(v => [v.id, v]));

    return {
      stats: {
        totalSites,
        activeSites,
        completedSites,
        totalSpend: totalSpend._sum.totalAmount || 0,
        materialSpend: materialSpend._sum.totalAmount || 0,
        laborSpend: laborSpend._sum.totalAmount || 0,
        otherSpend: (totalSpend._sum.totalAmount || 0) - (materialSpend._sum.totalAmount || 0) - (laborSpend._sum.totalAmount || 0),
        pendingPayments: pendingPayments._sum.dueAmount || 0,
        thisMonthSpend: thisMonthSpend._sum.totalAmount || 0,
        todaySpend: todaySpend._sum.totalAmount || 0,
        budgetOverrunCount: budgetOverrunSites.length,
      },
      charts: {
        siteWiseExpense: siteWiseExpense.map(s => ({
          ...s,
          site: siteMap.get(s.siteId),
        })),
        categoryBreakdown,
        monthlyTrend,
        topCostSites: topCostSites.map(s => ({
          ...s,
          site: siteMap.get(s.siteId),
        })),
        topVendors: topVendors.map(v => ({
          ...v,
          vendor: vendorMap.get(v.vendorId!),
        })),
        budgetVsActual: await this.getBudgetVsActual(tenantId),
      },
      recentActivity,
      budgetOverrunSites,
    };
  }

  private async getBudgetOverrunSites(tenantId: string) {
    const sites = await prisma.site.findMany({
      where: { tenantId, deletedAt: null, estimatedBudget: { gt: 0 } },
      select: { id: true, siteName: true, siteCode: true, estimatedBudget: true },
    });

    const overrunSites = [];
    for (const site of sites) {
      const actual = await prisma.expense.aggregate({
        where: { siteId: site.id, tenantId, deletedAt: null },
        _sum: { totalAmount: true },
      });
      const spent = actual._sum.totalAmount || 0;
      if (spent > site.estimatedBudget) {
        overrunSites.push({
          ...site,
          actualSpend: spent,
          overrunAmount: spent - site.estimatedBudget,
          overrunPercent: Math.round(((spent - site.estimatedBudget) / site.estimatedBudget) * 100),
        });
      }
    }
    return overrunSites;
  }

  private async getMonthlyTrend(tenantId: string) {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      months.push({ start, end, label: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
    }

    const trend = await Promise.all(months.map(async (m) => {
      const result = await prisma.expense.aggregate({
        where: {
          tenantId, deletedAt: null,
          expenseDate: { gte: m.start, lte: m.end },
        },
        _sum: { totalAmount: true },
      });
      return { month: m.label, amount: result._sum.totalAmount || 0 };
    }));

    return trend;
  }

  private async getBudgetVsActual(tenantId: string) {
    const sites = await prisma.site.findMany({
      where: { tenantId, deletedAt: null, estimatedBudget: { gt: 0 }, status: { in: ['active', 'completed'] } },
      select: { id: true, siteName: true, estimatedBudget: true },
      take: 10,
    });

    return Promise.all(sites.map(async (site) => {
      const actual = await prisma.expense.aggregate({
        where: { siteId: site.id, tenantId, deletedAt: null },
        _sum: { totalAmount: true },
      });
      return {
        siteName: site.siteName,
        budget: site.estimatedBudget,
        actual: actual._sum.totalAmount || 0,
      };
    }));
  }
}
