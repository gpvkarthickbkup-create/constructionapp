import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  vendorCode: z.string().optional(),
  type: z.enum(['supplier', 'labor_contractor', 'engineer', 'broker', 'transporter', 'other']).default('supplier'),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
