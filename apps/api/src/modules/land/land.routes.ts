import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { tenantIsolation, getTenantId } from '../../middleware/tenantIsolation';
import { sendSuccess, sendPaginated, parsePagination, generateCode } from '../../utils/helpers';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';

const router = Router();

router.use(authenticate, tenantIsolation);

// =============================================
// LANDS CRUD
// =============================================

// GET /lands — list all lands (paginated)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { page, limit, search, sortBy, sortOrder } = parsePagination(req.query);

    const where: any = { tenantId, deletedAt: null };
    if (search) {
      where.OR = [
        { landName: { contains: search, mode: 'insensitive' } },
        { landCode: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { surveyNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (req.query.status && req.query.status !== 'all') {
      where.status = req.query.status;
    }

    const [data, total] = await Promise.all([
      prisma.land.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          plots: { select: { id: true, status: true, totalPrice: true } },
        },
      }),
      prisma.land.count({ where }),
    ]);

    sendPaginated(res, {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// POST /lands — create land
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);

    // Generate land code
    const count = await prisma.land.count({ where: { tenantId } });
    const landCode = req.body.landCode || generateCode('LAND', count);

    const land = await prisma.land.create({
      data: {
        tenantId,
        landCode,
        landName: req.body.landName,
        totalArea: parseFloat(req.body.totalArea) || 0,
        areaUnit: req.body.areaUnit || 'sqft',
        city: req.body.city,
        district: req.body.district,
        state: req.body.state || 'Tamil Nadu',
        surveyNumber: req.body.surveyNumber,
        address: req.body.address,
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
        purchaseCost: parseFloat(req.body.purchaseCost) || 0,
        currentValue: parseFloat(req.body.currentValue) || 0,
        ownershipType: req.body.ownershipType || 'self_owned',
        dtcpApproval: req.body.dtcpApproval,
        dtcpStatus: req.body.dtcpStatus || 'pending',
        status: req.body.status || 'acquired',
        totalPlots: parseInt(req.body.totalPlots) || 0,
        notes: req.body.notes,
      },
    });

    sendSuccess(res, land, 'Land created successfully', 201);
  } catch (error) { next(error); }
});

// GET /lands/:id — land detail with plots, approvals, development costs, summary
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const land = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!land) return res.status(404).json({ success: false, message: 'Land not found' });

    const [plots, approvals, developmentCosts] = await Promise.all([
      prisma.plot.findMany({
        where: { landId: land.id, tenantId },
        include: { payments: { orderBy: { paymentDate: 'desc' } } },
        orderBy: { plotNumber: 'asc' },
      }),
      prisma.landApproval.findMany({
        where: { landId: land.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.landDevelopmentCost.findMany({
        where: { landId: land.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Build summary
    // Plot counts
    const totalPlots = plots.length;
    const availablePlots = plots.filter(p => p.status === 'available').length;
    const bookedPlots = plots.filter(p => p.status === 'booked').length;
    const soldPlots = plots.filter(p => p.status === 'sold').length;

    // Purchase Cost (what we paid for the land)
    const purchaseCost = land.purchaseCost || 0;

    // Development Cost (road, drainage, electricity, etc.)
    const developmentCost = developmentCosts.reduce((sum, c) => sum + c.amount, 0);

    // Total Investment = Purchase + Development
    const totalInvestment = purchaseCost + developmentCost;

    // Total Sale Value = sum of plot prices, or land's expected value if no plots
    const plotSaleValue = plots.reduce((sum, p) => sum + (p.salePrice || p.totalPrice || 0), 0);
    const totalSaleValue = plotSaleValue > 0 ? plotSaleValue : (land.currentValue || 0);
    const expectedSaleValue = land.currentValue || 0; // what was set when land was created

    // Total Collected = sum of all PlotPayment amounts (actual money received)
    const totalCollected = plots.reduce((sum, p) => sum + p.payments.reduce((s: number, pay: any) => s + pay.amount, 0), 0);

    // Total Pending = totalSaleValue - totalCollected
    const totalPending = totalSaleValue - totalCollected;

    // Profit calculations
    const actualProfit = totalCollected - totalInvestment;
    const potentialProfit = totalSaleValue - totalInvestment;
    const expectedProfit = expectedSaleValue > 0 ? expectedSaleValue - totalInvestment : potentialProfit;
    const profitMargin = totalSaleValue > 0 ? (potentialProfit / totalSaleValue) * 100 : 0;

    const totalBrokerCommission = plots.reduce((sum, p) => sum + (p.brokerCommission || 0), 0);

    const summary = {
      totalPlots,
      availablePlots,
      bookedPlots,
      soldPlots,
      purchaseCost,
      developmentCost,
      totalInvestment,
      totalSaleValue,
      expectedSaleValue,
      totalCollected,
      totalPending,
      actualProfit,
      potentialProfit,
      expectedProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalBrokerCommission,
      // Keep legacy fields for backward compatibility
      totalPlotValue: totalSaleValue,
      totalDevelopmentCost: developmentCost,
      landPurchaseCost: purchaseCost,
      totalRevenue: totalCollected,
      profit: actualProfit,
    };

    sendSuccess(res, { land, plots, approvals, developmentCosts, summary });
  } catch (error) { next(error); }
});

// PUT /lands/:id — update land
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const existing = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Land not found' });

    const updateData: any = {};
    const fields = [
      'landName', 'totalArea', 'areaUnit', 'city', 'district', 'state',
      'surveyNumber', 'address', 'latitude', 'longitude', 'purchaseCost',
      'currentValue', 'ownershipType', 'dtcpApproval', 'dtcpStatus', 'status',
      'totalPlots', 'notes',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    }
    if (req.body.purchaseDate !== undefined) {
      updateData.purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : null;
    }
    // Parse numeric fields
    if (updateData.totalArea) updateData.totalArea = parseFloat(updateData.totalArea);
    if (updateData.purchaseCost) updateData.purchaseCost = parseFloat(updateData.purchaseCost);
    if (updateData.currentValue) updateData.currentValue = parseFloat(updateData.currentValue);
    if (updateData.totalPlots) updateData.totalPlots = parseInt(updateData.totalPlots);

    const land = await prisma.land.update({
      where: { id: req.params.id },
      data: updateData,
    });

    sendSuccess(res, land, 'Land updated successfully');
  } catch (error) { next(error); }
});

// DELETE /lands/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const existing = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Land not found' });

    await prisma.land.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    sendSuccess(res, null, 'Land deleted successfully');
  } catch (error) { next(error); }
});

// =============================================
// PLOTS
// =============================================

// POST /lands/:id/plots — add plot
router.post('/:id/plots', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const land = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!land) return res.status(404).json({ success: false, message: 'Land not found' });

    const area = parseFloat(req.body.area) || 0;
    const ratePerSqft = parseFloat(req.body.ratePerSqft) || 0;
    const totalPrice = area * ratePerSqft;

    const plot = await prisma.plot.create({
      data: {
        tenantId,
        landId: land.id,
        plotNumber: req.body.plotNumber,
        area,
        length: req.body.length ? parseFloat(req.body.length) : null,
        width: req.body.width ? parseFloat(req.body.width) : null,
        facing: req.body.facing || null,
        ratePerSqft,
        totalPrice,
        salePrice: parseFloat(req.body.salePrice) || totalPrice,
        status: 'available',
        notes: req.body.notes,
      },
    });

    sendSuccess(res, plot, 'Plot added successfully', 201);
  } catch (error) { next(error); }
});

// PUT /lands/:id/plots/:plotId — update plot (book, sell, cancel)
router.put('/:id/plots/:plotId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const plot = await prisma.plot.findFirst({
      where: { id: req.params.plotId, landId: req.params.id, tenantId },
    });
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found' });

    const updateData: any = {};
    const fields = [
      'plotNumber', 'area', 'length', 'width', 'facing', 'ratePerSqft',
      'totalPrice', 'salePrice', 'status', 'customerId', 'customerName',
      'customerMobile', 'bookingAmount', 'registrationCost', 'brokerName',
      'brokerCommission', 'notes',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    }
    // Parse numerics
    const numericFields = ['area', 'length', 'width', 'ratePerSqft', 'totalPrice', 'salePrice', 'bookingAmount', 'registrationCost', 'brokerCommission'];
    for (const f of numericFields) {
      if (updateData[f] !== undefined) updateData[f] = parseFloat(updateData[f]) || 0;
    }
    if (req.body.bookingDate) updateData.bookingDate = new Date(req.body.bookingDate);
    if (req.body.registrationDate) updateData.registrationDate = new Date(req.body.registrationDate);

    // Recalculate totalPrice if area/rate changed
    if (updateData.area !== undefined || updateData.ratePerSqft !== undefined) {
      const a = updateData.area ?? plot.area;
      const r = updateData.ratePerSqft ?? plot.ratePerSqft;
      updateData.totalPrice = a * r;
    }

    const updated = await prisma.plot.update({
      where: { id: req.params.plotId },
      data: updateData,
    });

    sendSuccess(res, updated, 'Plot updated successfully');
  } catch (error) { next(error); }
});

// DELETE /lands/:id/plots/:plotId — delete plot
router.delete('/:id/plots/:plotId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const plot = await prisma.plot.findFirst({
      where: { id: req.params.plotId, landId: req.params.id, tenantId },
    });
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found' });

    // Delete payments first, then plot
    await prisma.plotPayment.deleteMany({ where: { plotId: plot.id } });
    await prisma.plot.delete({ where: { id: plot.id } });

    sendSuccess(res, null, 'Plot deleted successfully');
  } catch (error) { next(error); }
});

// =============================================
// PLOT PAYMENTS
// =============================================

// POST /lands/:id/plots/:plotId/payments — record payment
router.post('/:id/plots/:plotId/payments', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const plot = await prisma.plot.findFirst({
      where: { id: req.params.plotId, landId: req.params.id, tenantId },
    });
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found' });

    // Calculate installment number
    const paymentCount = await prisma.plotPayment.count({ where: { plotId: plot.id } });

    const payment = await prisma.plotPayment.create({
      data: {
        plotId: plot.id,
        amount: parseFloat(req.body.amount) || 0,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
        paymentType: req.body.paymentType || 'cash',
        installmentNo: paymentCount + 1,
        description: req.body.description,
        reference: req.body.reference,
        receiptNumber: req.body.receiptNumber || `REC-${Date.now()}`,
      },
    });

    sendSuccess(res, payment, 'Payment recorded successfully', 201);
  } catch (error) { next(error); }
});

// GET /lands/:id/plots/:plotId/payments — list payments
router.get('/:id/plots/:plotId/payments', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const plot = await prisma.plot.findFirst({
      where: { id: req.params.plotId, landId: req.params.id, tenantId },
    });
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found' });

    const payments = await prisma.plotPayment.findMany({
      where: { plotId: plot.id },
      orderBy: { paymentDate: 'desc' },
    });

    sendSuccess(res, payments);
  } catch (error) { next(error); }
});

// =============================================
// APPROVALS
// =============================================

// POST /lands/:id/approvals — add approval
router.post('/:id/approvals', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const land = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!land) return res.status(404).json({ success: false, message: 'Land not found' });

    const approval = await prisma.landApproval.create({
      data: {
        landId: land.id,
        approvalType: req.body.approvalType,
        approvalNumber: req.body.approvalNumber,
        appliedDate: req.body.appliedDate ? new Date(req.body.appliedDate) : null,
        approvedDate: req.body.approvedDate ? new Date(req.body.approvedDate) : null,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        status: req.body.status || 'pending',
        documentUrl: req.body.documentUrl,
        notes: req.body.notes,
      },
    });

    sendSuccess(res, approval, 'Approval added successfully', 201);
  } catch (error) { next(error); }
});

// PUT /lands/:id/approvals/:appId — update approval status
router.put('/:id/approvals/:appId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const land = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!land) return res.status(404).json({ success: false, message: 'Land not found' });

    const existing = await prisma.landApproval.findFirst({
      where: { id: req.params.appId, landId: land.id },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Approval not found' });

    const updateData: any = {};
    const fields = ['approvalType', 'approvalNumber', 'status', 'documentUrl', 'notes'];
    for (const f of fields) {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    }
    if (req.body.appliedDate !== undefined) updateData.appliedDate = req.body.appliedDate ? new Date(req.body.appliedDate) : null;
    if (req.body.approvedDate !== undefined) updateData.approvedDate = req.body.approvedDate ? new Date(req.body.approvedDate) : null;
    if (req.body.expiryDate !== undefined) updateData.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

    const approval = await prisma.landApproval.update({
      where: { id: req.params.appId },
      data: updateData,
    });

    sendSuccess(res, approval, 'Approval updated successfully');
  } catch (error) { next(error); }
});

// =============================================
// DEVELOPMENT COSTS
// =============================================

// POST /lands/:id/costs — add development cost
router.post('/:id/costs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const land = await prisma.land.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });
    if (!land) return res.status(404).json({ success: false, message: 'Land not found' });

    const cost = await prisma.landDevelopmentCost.create({
      data: {
        landId: land.id,
        category: req.body.category,
        description: req.body.description,
        amount: parseFloat(req.body.amount) || 0,
        date: req.body.date ? new Date(req.body.date) : null,
        vendorName: req.body.vendorName,
        paymentStatus: req.body.paymentStatus || 'paid',
      },
    });

    sendSuccess(res, cost, 'Development cost added successfully', 201);
  } catch (error) { next(error); }
});

export default router;
