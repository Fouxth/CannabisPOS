import { Router } from 'express';
import { MovementType } from '@prisma/client';
import { toStockMovementDto, toProductDto } from '../utils/dtos';

const router = Router();

// Get stock movements
router.get('/movements', async (req, res) => {
    try {
        const movements = await req.tenantPrisma!.stockMovement.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: true,
                user: true,
            },
            take: 100,
        });
        res.json(movements.map(toStockMovementDto));
    } catch (error) {
        console.error('Fetch stock movements error', error);
        res.status(500).json({ message: 'Unable to fetch stock movements' });
    }
});

// Adjust stock
router.post('/adjust', async (req, res) => {
    try {
        const { productId, userId, quantityChange, reason, notes, movementType } = req.body;

        if (!productId || !userId || quantityChange === undefined) {
            return res.status(400).json({ message: 'Product ID, user ID, and quantity change are required' });
        }

        const product = await req.tenantPrisma!.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousQuantity = product.stock;
        const newQuantity = previousQuantity + quantityChange;

        if (newQuantity < 0) {
            return res.status(400).json({ message: 'Stock cannot be negative' });
        }

        const [updatedProduct, movement] = await req.tenantPrisma!.$transaction([
            req.tenantPrisma!.product.update({
                where: { id: productId },
                data: { stock: newQuantity },
                include: { category: true },
            }),
            req.tenantPrisma!.stockMovement.create({
                data: {
                    productId,
                    userId,
                    movementType: movementType || MovementType.ADJUSTMENT,
                    quantityChange,
                    previousQuantity,
                    newQuantity,
                    reason,
                    notes,
                },
                include: {
                    product: true,
                    user: true,
                },
            }),
        ]);

        // Send Flex Message for stock adjustment
        const { smsService } = await import('../services/SmsService.js');
        smsService.sendStockAdjustmentAlert(
            product.name,
            previousQuantity,
            newQuantity,
            reason || 'ไม่ระบุ',
            req.tenantPrisma!
        ).catch(err => console.error('Failed to send stock adjustment alert', err));

        res.status(201).json({
            product: toProductDto(updatedProduct),
            movement: toStockMovementDto(movement),
        });
    } catch (error) {
        console.error('Adjust stock error', error);
        res.status(500).json({ message: 'Unable to adjust stock' });
    }
});

// Restock product
router.post('/restock', async (req, res) => {
    try {
        const { productId, userId, quantity, notes } = req.body;

        if (!productId || !userId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Product ID, user ID, and positive quantity are required' });
        }

        const product = await req.tenantPrisma!.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousQuantity = product.stock;
        const newQuantity = previousQuantity + quantity;

        const [updatedProduct, movement] = await req.tenantPrisma!.$transaction([
            req.tenantPrisma!.product.update({
                where: { id: productId },
                data: { stock: newQuantity },
                include: { category: true },
            }),
            req.tenantPrisma!.stockMovement.create({
                data: {
                    productId,
                    userId,
                    movementType: MovementType.RESTOCK,
                    quantityChange: quantity,
                    previousQuantity,
                    newQuantity,
                    reason: 'เติมสต็อก',
                    notes,
                },
                include: {
                    product: true,
                    user: true,
                },
            }),
        ]);

        res.status(201).json({
            product: toProductDto(updatedProduct),
            movement: toStockMovementDto(movement),
        });
    } catch (error) {
        console.error('Restock error', error);
        res.status(500).json({ message: 'Unable to restock' });
    }
});

export const stockRouter = router;
