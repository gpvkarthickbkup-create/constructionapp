import prisma from '../../config/database';
import { CreateVendorInput } from './vendor.schema';
import { NotFoundError } from '../../utils/errors';
import { parsePagination, generateCode } from '../../utils/helpers';

export class VendorService {
  async create(tenantId: string, input: CreateVendorInput) {
    const count = await prisma.vendor.count({ where: { tenantId } });
    const vendorCode = input.vendorCode || generateCode('VND', count);

    return prisma.vendor.create({
      data: { tenantId, vendorCode, ...input },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
    const { type } = query;

    const where: any = { tenantId, deletedAt: null };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { vendorCode: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundError('Vendor');
    return vendor;
  }

  async getVendorDetail(tenantId: string, id: string) {
    const vendor = await this.findById(tenantId, id);

    const [totalPaid, totalPending, expensesBySite, recentExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: { vendorId: id, tenantId, deletedAt: null },
        _sum: { paidAmount: true, totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { vendorId: id, tenantId, deletedAt: null, paymentStatus: { not: 'paid' } },
        _sum: { dueAmount: true },
      }),
      prisma.expense.groupBy({
        by: ['siteId'],
        where: { vendorId: id, tenantId, deletedAt: null },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),
      prisma.expense.findMany({
        where: { vendorId: id, tenantId, deletedAt: null },
        orderBy: { expenseDate: 'desc' },
        take: 20,
        include: {
          site: { select: { siteName: true, siteCode: true } },
          category: { select: { name: true, nameTa: true } },
        },
      }),
    ]);

    // Get site names for site allocation
    const siteIds = expensesBySite.map(e => e.siteId);
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, siteName: true, siteCode: true },
    });

    const siteAllocation = expensesBySite.map(e => ({
      ...e,
      site: sites.find(s => s.id === e.siteId),
    }));

    return {
      vendor,
      totalPaid: totalPaid._sum.paidAmount || 0,
      totalAmount: totalPaid._sum.totalAmount || 0,
      totalPending: totalPending._sum.dueAmount || 0,
      siteAllocation,
      recentExpenses,
    };
  }

  async update(tenantId: string, id: string, input: Partial<CreateVendorInput>) {
    const vendor = await this.findById(tenantId, id);
    return prisma.vendor.update({ where: { id: vendor.id }, data: input });
  }

  async softDelete(tenantId: string, id: string) {
    const vendor = await this.findById(tenantId, id);
    return prisma.vendor.update({
      where: { id: vendor.id },
      data: { deletedAt: new Date() },
    });
  }
}
