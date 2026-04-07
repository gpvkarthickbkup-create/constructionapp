import { z } from 'zod';

export const createSiteSchema = z.object({
  siteName: z.string().min(2, 'Site name is required'),
  siteCode: z.string().optional(),
  clientName: z.string().optional(),
  clientMobile: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  projectType: z.enum(['house', 'villa', 'apartment', 'commercial', 'renovation', 'interior', 'other']).default('house'),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  totalSqft: z.number().min(0).default(0),
  customerRatePerSqft: z.number().min(0).default(0),
  builderRatePerSqft: z.number().min(0).default(0),
  customerEstimate: z.number().min(0).default(0),
  builderEstimate: z.number().min(0).default(0),
  saleAmount: z.number().min(0).default(0),
  estimatedProfit: z.number().default(0),
  estimatedBudget: z.number().min(0).default(0),
  estimatedMaterialCost: z.number().min(0).default(0),
  estimatedLaborCost: z.number().min(0).default(0),
  estimatedOtherCost: z.number().min(0).default(0),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  assignedManagerId: z.string().optional(),
  coverImage: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSiteSchema = createSiteSchema.partial();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
