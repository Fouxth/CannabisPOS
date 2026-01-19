import { Router } from 'express';
import { PromotionType } from '@prisma/client';
import { decimalToNumber } from '../utils/helpers';

const router = Router();

// DTO for promotion
const toPromotionDto = (promotion: any) => ({
    id: promotion.id,
    name: promotion.name,
    description: promotion.description ?? undefined,
    type: promotion.type.toLowerCase(),
    value: decimalToNumber(promotion.value),
    minPurchase: promotion.minPurchase ? decimalToNumber(promotion.minPurchase) : undefined,
    maxDiscount: promotion.maxDiscount ? decimalToNumber(promotion.maxDiscount) : undefined,
    code: promotion.code ?? undefined,
    usageLimit: promotion.usageLimit ?? undefined,
    usageCount: promotion.usageCount,
    startDate: promotion.startDate.toISOString(),
    endDate: promotion.endDate.toISOString(),
    isActive: promotion.isActive,
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
});

// Get all promotions
router.get('/', async (req, res) => {
    try {
        const { activeOnly } = req.query;

        const where: any = {};
        if (activeOnly === 'true') {
            const now = new Date();
            where.isActive = true;
            where.startDate = { lte: now };
            where.endDate = { gte: now };
        }

        const promotions = await req.tenantPrisma!.promotion.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        res.json(promotions.map(toPromotionDto));
    } catch (error) {
        console.error('Fetch promotions error', error);
        res.status(500).json({ message: 'Unable to fetch promotions' });
    }
});

// Get promotion by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await req.tenantPrisma!.promotion.findUnique({
            where: { id },
        });
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        res.json(toPromotionDto(promotion));
    } catch (error) {
        console.error('Fetch promotion error', error);
        res.status(500).json({ message: 'Unable to fetch promotion' });
    }
});

// Validate promotion code
router.post('/validate', async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Promotion code is required' });
        }

        const now = new Date();
        const promotion = await req.tenantPrisma!.promotion.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
            },
        });

        if (!promotion) {
            return res.status(404).json({ message: 'รหัสโปรโมชั่นไม่ถูกต้องหรือหมดอายุ' });
        }

        // Check usage limit
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
            return res.status(400).json({ message: 'โปรโมชั่นนี้ถูกใช้งานครบแล้ว' });
        }

        // Check minimum purchase
        if (promotion.minPurchase && subtotal < decimalToNumber(promotion.minPurchase)) {
            return res.status(400).json({
                message: `ยอดซื้อขั้นต่ำ ฿${decimalToNumber(promotion.minPurchase).toLocaleString()}`
            });
        }

        // Calculate discount
        let discount = 0;
        const value = decimalToNumber(promotion.value);

        if (promotion.type === PromotionType.PERCENTAGE) {
            discount = (subtotal * value) / 100;
            if (promotion.maxDiscount) {
                discount = Math.min(discount, decimalToNumber(promotion.maxDiscount));
            }
        } else if (promotion.type === PromotionType.FIXED_AMOUNT) {
            discount = value;
        }

        res.json({
            valid: true,
            promotion: toPromotionDto(promotion),
            discount: Math.round(discount * 100) / 100,
        });
    } catch (error) {
        console.error('Validate promotion error', error);
        res.status(500).json({ message: 'Unable to validate promotion' });
    }
});

// Apply promotion (increment usage)
router.post('/:id/apply', async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await req.tenantPrisma!.promotion.update({
            where: { id },
            data: { usageCount: { increment: 1 } },
        });

        res.json(toPromotionDto(promotion));
    } catch (error) {
        console.error('Apply promotion error', error);
        res.status(500).json({ message: 'Unable to apply promotion' });
    }
});

// Create promotion
router.post('/', async (req, res) => {
    try {
        const {
            name, description, type, value, minPurchase, maxDiscount,
            code, usageLimit, startDate, endDate, isActive
        } = req.body;

        if (!name || !type || value === undefined || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate type
        const validTypes = Object.values(PromotionType);
        const upperType = type.toUpperCase();
        if (!validTypes.includes(upperType as PromotionType)) {
            return res.status(400).json({ message: 'Invalid promotion type' });
        }

        const promotion = await req.tenantPrisma!.promotion.create({
            data: {
                name,
                description,
                type: upperType as PromotionType,
                value,
                minPurchase,
                maxDiscount,
                code: code ? code.toUpperCase() : null,
                usageLimit,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive ?? true,
            },
        });
        res.status(201).json(toPromotionDto(promotion));
    } catch (error: any) {
        console.error('Create promotion error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'รหัสโปรโมชั่นนี้มีอยู่แล้ว' });
        }
        res.status(500).json({ message: 'Unable to create promotion' });
    }
});

// Update promotion
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, type, value, minPurchase, maxDiscount,
            code, usageLimit, startDate, endDate, isActive
        } = req.body;

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (type !== undefined) {
            const validTypes = Object.values(PromotionType);
            const upperType = type.toUpperCase();
            if (!validTypes.includes(upperType as PromotionType)) {
                return res.status(400).json({ message: 'Invalid promotion type' });
            }
            data.type = upperType;
        }
        if (value !== undefined) data.value = value;
        if (minPurchase !== undefined) data.minPurchase = minPurchase;
        if (maxDiscount !== undefined) data.maxDiscount = maxDiscount;
        if (code !== undefined) data.code = code ? code.toUpperCase() : null;
        if (usageLimit !== undefined) data.usageLimit = usageLimit;
        if (startDate !== undefined) data.startDate = new Date(startDate);
        if (endDate !== undefined) data.endDate = new Date(endDate);
        if (typeof isActive === 'boolean') data.isActive = isActive;

        const promotion = await req.tenantPrisma!.promotion.update({
            where: { id },
            data,
        });
        res.json(toPromotionDto(promotion));
    } catch (error: any) {
        console.error('Update promotion error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'รหัสโปรโมชั่นนี้มีอยู่แล้ว' });
        }
        res.status(500).json({ message: 'Unable to update promotion' });
    }
});

// Delete promotion
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await req.tenantPrisma!.promotion.delete({
            where: { id },
        });
        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Delete promotion error', error);
        res.status(500).json({ message: 'Unable to delete promotion' });
    }
});

export const promotionsRouter = router;
