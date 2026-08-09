import { Router, Request, Response } from 'express';
import { smsService } from '../services/SmsService';

export const customersRouter = Router();

/**
 * GET /api/customers
 * List or search customers
 */
customersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { lineUserId: { contains: q } },
      ];
    }

    const customers = await req.tenantPrisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { bills: true } },
      },
    });

    res.json(customers);
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: error.message || 'Error fetching customers' });
  }
});

/**
 * GET /api/customers/lookup?phone=xxx
 * Lookup single customer by phone or lineUserId
 */
customersRouter.get('/lookup', async (req: Request, res: Response) => {
  try {
    const { phone, lineUserId } = req.query;
    if (!phone && !lineUserId) {
      return res.status(400).json({ message: 'Must provide phone or lineUserId' });
    }

    const customer = await req.tenantPrisma.customer.findFirst({
      where: {
        OR: [
          phone ? { phone: String(phone).trim() } : undefined,
          lineUserId ? { lineUserId: String(lineUserId).trim() } : undefined,
        ].filter(Boolean) as any[],
      },
      include: {
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json(customer || null);
  } catch (error: any) {
    console.error('Customer lookup error:', error);
    res.status(500).json({ message: error.message || 'Error looking up customer' });
  }
});

/**
 * POST /api/customers
 * Create new customer
 */
customersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, lineUserId, lineDisplayName, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อและเบอร์โทรศัพท์' });
    }

    const existing = await req.tenantPrisma.customer.findUnique({
      where: { phone: String(phone).trim() },
    });

    if (existing) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้ลงทะเบียนเป็นสมาชิกอยู่แล้ว' });
    }

    const customer = await req.tenantPrisma.customer.create({
      data: {
        tenantId: req.tenantId || 'default',
        name,
        phone: String(phone).trim(),
        email,
        lineUserId,
        lineDisplayName,
        notes,
      },
    });

    res.status(201).json(customer);
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: error.message || 'Error creating customer' });
  }
});

/**
 * PUT /api/customers/:id
 * Update customer profile
 */
customersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, lineUserId, lineDisplayName, notes } = req.body;

    const customer = await req.tenantPrisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        lineUserId,
        lineDisplayName,
        notes,
      },
    });

    res.json(customer);
  } catch (error: any) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: error.message || 'Error updating customer' });
  }
});

/**
 * POST /api/customers/:id/points
 * Manually adjust points
 */
customersRouter.post('/:id/points', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pointsChange, reason } = req.body;

    if (!pointsChange || isNaN(Number(pointsChange))) {
      return res.status(400).json({ message: 'กรุณาระบุจำนวนแต้มที่ต้องการปรับปรุง' });
    }

    const customer = await req.tenantPrisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ message: 'ไม่พบข้อมูลสมาชิก' });

    const newPoints = Math.max(0, customer.points + Number(pointsChange));

    const [updatedCustomer, tx] = await req.tenantPrisma.$transaction([
      req.tenantPrisma.customer.update({
        where: { id },
        data: { points: newPoints },
      }),
      req.tenantPrisma.pointTransaction.create({
        data: {
          tenantId: req.tenantId || 'default',
          customerId: id,
          type: 'ADJUST',
          pointsChange: Number(pointsChange),
          balanceAfter: newPoints,
          description: reason || 'ปรับปรุงแต้มโดยผู้ดูแลระบบ',
        },
      }),
    ]);

    // Send LINE Push notification if lineUserId is set
    if (updatedCustomer.lineUserId) {
      const msg = `🎉 สมาชิก ${updatedCustomer.name}\nมีการปรับแต้มสะสม: ${pointsChange > 0 ? '+' : ''}${pointsChange} แต้ม\nแต้มสะสมคงเหลือ: ${newPoints} แต้ม`;
      smsService.sendAlert('realtimeSales' as any, msg, req.tenantPrisma);
    }

    res.json(updatedCustomer);
  } catch (error: any) {
    console.error('Adjust points error:', error);
    res.status(500).json({ message: error.message || 'Error adjusting points' });
  }
});
