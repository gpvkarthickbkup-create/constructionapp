import { z } from 'zod';

export const createExpenseSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  vendorId: z.string().optional(),
  expenseDate: z.string().min(1, 'Date is required'),
  expenseType: z.enum(['material', 'labor', 'commission', 'transport', 'rental', 'miscellaneous']),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(0).default(1),
  unit: z.string().optional(),
  rate: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  gstPercent: z.number().min(0).max(100).default(0).optional(),
  gstAmount: z.number().min(0).default(0).optional(),
  grandTotal: z.number().min(0).default(0).optional(),
  paymentStatus: z.enum(['paid', 'partially_paid', 'unpaid']).default('unpaid'),
  paidAmount: z.number().min(0).default(0),
  paymentType: z.enum(['cash', 'upi', 'bank', 'credit', 'cheque']).optional(),
  billNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  dueDate: z.string().optional(),
  remarks: z.string().optional(),
  isDraft: z.boolean().default(false),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).default('approved'),
  // For new vendor quick-add
  vendorName: z.string().optional(),
  vendorMobile: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseFilterSchema = z.object({
  siteId: z.string().optional(),
  expenseType: z.string().optional(),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  paymentStatus: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
