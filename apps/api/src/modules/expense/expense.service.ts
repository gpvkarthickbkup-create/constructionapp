import prisma from '../../config/database';
import { CreateExpenseInput } from './expense.schema';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { parsePagination, generateExpenseNumber } from '../../utils/helpers';

export class ExpenseService {
  async create(tenantId: string, userId: string, input: CreateExpenseInput) {
    // Auto-calculate total if not provided or mismatch
    const calculatedTotal = input.quantity * input.rate;
    const totalAmount = input.totalAmount || calculatedTotal;

    // Calculate due amount
    const dueAmount = Math.max(0, totalAmount - (input.paidAmount || 0));
    const paymentStatus = input.paidAmount >= totalAmount ? 'paid'
      : input.paidAmount > 0 ? 'partially_paid' : 'unpaid';

    // Generate expense number
    const count = await prisma.expense.count({ where: { tenantId } });
    const expenseNumber = generateExpenseNumber('BW', count);

    // Check for duplicate (same bill number + amount + date)
    if (input.billNumber) {
      const duplicate = await prisma.expense.findFirst({
        where: {
          tenantId,
          billNumber: input.billNumber,
          totalAmount,
          expenseDate: new Date(input.expenseDate),
          deletedAt: null,
        },
      });
      if (duplicate) {
        // Return warning flag but still allow creation
        // The frontend will handle the confirmation
      }
    }

    // Quick-add vendor if vendorName is provided but no vendorId
    let vendorId = input.vendorId;
    if (!vendorId && input.vendorName) {
      const vendorCount = await prisma.vendor.count({ where: { tenantId } });
      const vendor = await prisma.vendor.create({
        data: {
          tenantId,
          vendorCode: `VND-${String(vendorCount + 1).padStart(4, '0')}`,
          name: input.vendorName,
          mobile: input.vendorMobile,
          type: input.expenseType === 'labor' ? 'labor_contractor'
            : input.expenseType === 'transport' ? 'transporter' : 'supplier',
        },
      });
      vendorId = vendor.id;
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        siteId: input.siteId,
        vendorId,
        expenseNumber,
        expenseDate: new Date(input.expenseDate),
        expenseType: input.expenseType,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        itemName: input.itemName,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        rate: input.rate,
        totalAmount,
        gstPercent: input.gstPercent || 0,
        gstAmount: input.gstAmount || 0,
        grandTotal: input.grandTotal || totalAmount,
        paymentStatus,
        paidAmount: input.paidAmount || 0,
        dueAmount,
        paymentType: input.paymentType,
        billNumber: input.billNumber,
        referenceNumber: input.referenceNumber,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        remarks: input.remarks,
        isDraft: input.isDraft,
        approvalStatus: input.approvalStatus,
        createdBy: userId,
      },
      include: {
        site: { select: { siteName: true, siteCode: true } },
        vendor: { select: { name: true } },
        category: { select: { name: true, nameTa: true } },
      },
    });

    return expense;
  }

  async findAll(tenantId: string, query: any) {
    const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
    const { siteId, expenseType, categoryId, vendorId, paymentStatus, dateFrom, dateTo, minAmount, maxAmount } = query;

    const where: any = { tenantId, deletedAt: null };

    if (siteId) where.siteId = siteId;
    if (expenseType) where.expenseType = expenseType;
    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) where.expenseDate.lte = new Date(dateTo);
    }
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount);
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount);
    }
    if (search) {
      where.OR = [
        { itemName: { contains: search } },
        { expenseNumber: { contains: search } },
        { billNumber: { contains: search } },
        { description: { contains: search } },
        { remarks: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          site: { select: { siteName: true, siteCode: true } },
          vendor: { select: { name: true } },
          category: { select: { name: true, nameTa: true, color: true } },
          creator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        site: { select: { siteName: true, siteCode: true } },
        vendor: { select: { id: true, name: true, mobile: true } },
        category: { select: { name: true, nameTa: true, color: true, icon: true } },
        subcategory: { select: { name: true, nameTa: true } },
        creator: { select: { firstName: true, lastName: true } },
        updater: { select: { firstName: true, lastName: true } },
        attachments: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!expense) throw new NotFoundError('Expense');
    return expense;
  }

  async update(tenantId: string, id: string, userId: string, input: Partial<CreateExpenseInput>) {
    const expense = await this.findById(tenantId, id);

    const totalAmount = input.totalAmount ?? expense.totalAmount;
    const paidAmount = input.paidAmount ?? expense.paidAmount;
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = paidAmount >= totalAmount ? 'paid'
      : paidAmount > 0 ? 'partially_paid' : 'unpaid';

    return prisma.expense.update({
      where: { id: expense.id },
      data: {
        ...input,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentStatus,
        updatedBy: userId,
      },
      include: {
        site: { select: { siteName: true, siteCode: true } },
        vendor: { select: { name: true } },
        category: { select: { name: true, nameTa: true } },
      },
    });
  }

  async softDelete(tenantId: string, id: string) {
    const expense = await this.findById(tenantId, id);
    return prisma.expense.update({
      where: { id: expense.id },
      data: { deletedAt: new Date() },
    });
  }

  async getRecentItems(tenantId: string) {
    const recentExpenses = await prisma.expense.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { itemName: true, unit: true, rate: true, categoryId: true, expenseType: true },
      distinct: ['itemName'],
    });
    return recentExpenses;
  }

  async getRecentVendors(tenantId: string) {
    const recentVendors = await prisma.expense.findMany({
      where: { tenantId, deletedAt: null, vendorId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { vendorId: true, vendor: { select: { id: true, name: true, mobile: true } } },
      distinct: ['vendorId'],
    });
    return recentVendors.map(e => e.vendor).filter(Boolean);
  }

  async checkDuplicate(tenantId: string, billNumber: string, totalAmount: number, expenseDate: string) {
    const duplicate = await prisma.expense.findFirst({
      where: {
        tenantId,
        billNumber,
        totalAmount,
        expenseDate: new Date(expenseDate),
        deletedAt: null,
      },
    });
    return !!duplicate;
  }
}
