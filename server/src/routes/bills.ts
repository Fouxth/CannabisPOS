import { Router } from 'express';
import { MovementType, PaymentStatus, SaleStatus, BillStatus, NotificationType } from '@prisma/client';
import { toBillDto, toSaleDto, createNotification } from '../utils/dtos';
import { generateDocumentNumber, normalizePaymentMethod, decimalToNumber, getSettingValue } from '../utils/helpers';
import { smsService } from '../services/SmsService';
import { socketService } from '../services/SocketService';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get all bills
router.get('/', requirePermission('VIEW_BILLS'), async (req, res) => {
    try {
        const bills = await req.tenantPrisma!.bill.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                user: true,
            },
        });
        res.json(bills.map(toBillDto));
    } catch (error) {
        console.error('Fetch bills error', error);
        res.status(500).json({ message: 'Unable to fetch bills' });
    }
});

// Get bill by ID
router.get('/:id', requirePermission('VIEW_BILLS'), async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await req.tenantPrisma!.bill.findUnique({
            where: { id: id as string },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        res.json(toBillDto(bill));
    } catch (error) {
        console.error('Fetch bill error', error);
        res.status(500).json({ message: 'Unable to fetch bill' });
    }
});

// Create bill (POS Sale)
router.post('/', requirePermission('CREATE_SALE'), async (req, res) => {
    try {
        const {
            userId,
            items,
            paymentMethod,
            amountReceived,
            changeAmount,
            discountAmount,
            discountPercent,
            taxAmount,
            subtotal,
            totalAmount,
            customerId,
            customerName,
            notes,
        } = req.body;

        if (!userId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'User and items are required' });
        }

        const normalizedMethod = normalizePaymentMethod(paymentMethod);

        // Fetch Settings
        const [posSettings, storeSettings, notificationSettings] = await Promise.all([
            getSettingValue('pos', req.tenantPrisma!),
            getSettingValue('store', req.tenantPrisma!),
            getSettingValue('notifications', req.tenantPrisma!),
        ]);

        const prefix = posSettings.invoicePrefix || 'POS';
        const saleNumber = generateDocumentNumber(prefix);
        const billNumber = generateDocumentNumber(prefix);

        // Calculate todayStart based on dayClosingTime
        const now = new Date();
        const closingTime = storeSettings.dayClosingTime || '00:00';
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);

        const todayStart = new Date(now);
        todayStart.setHours(closeHour, closeMinute, 0, 0);

        if (now < todayStart) {
            todayStart.setDate(todayStart.getDate() - 1);
        }

        const result = await req.tenantPrisma!.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new Error('ไม่พบผู้ใช้ที่ระบุ');
            }

            const productIds = items.map((item: any) => item.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
            });
            const productMap = new Map(products.map((product) => [product.id, product]));

            const saleItemsData = items.map((item: any) => {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error('ไม่พบบางสินค้า โปรดลองโหลดหน้าใหม่');
                }
                if (product.stock < item.quantity) {
                    throw new Error(`สินค้า ${product.name} มีสต็อกไม่พอ`);
                }
                const unitPrice = item.unitPrice ?? decimalToNumber(product.price);
                const discountValue = item.discount ?? 0;
                const totalValue = item.total ?? unitPrice * item.quantity - discountValue;

                return {
                    productId: item.productId,
                    productName: item.productName ?? product.name,
                    quantity: item.quantity,
                    unitPrice,
                    discount: discountValue,
                    total: totalValue,
                };
            });

            for (const saleItem of saleItemsData) {
                const product = productMap.get(saleItem.productId)!;
                const previousQuantity = product.stock;
                const updatedProduct = await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: { decrement: saleItem.quantity },
                        totalSold: { increment: saleItem.quantity },
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        userId,
                        movementType: MovementType.SALE,
                        quantityChange: -saleItem.quantity,
                        previousQuantity,
                        newQuantity: updatedProduct.stock,
                        reason: `ขายสินค้า ${saleNumber}`,
                    },
                });

                product.stock = updatedProduct.stock;
                product.totalSold = updatedProduct.totalSold;

                // Check for low stock
                if (updatedProduct.stock <= updatedProduct.minStock) {
                    const notification = await createNotification(
                        userId,
                        NotificationType.LOW_STOCK,
                        'สินค้าใกล้หมด',
                        `สินค้า ${product.name} เหลือ ${updatedProduct.stock} ${product.stockUnit} (ต่ำกว่าขั้นต่ำ ${updatedProduct.minStock})`,
                        tx as any
                    );

                    if (notification) {
                        socketService.sendNotification(req.tenantId!, userId, notification);
                    }
                    // Send Flex Message for low stock
                    smsService.sendLowStockAlert(
                        product.name,
                        updatedProduct.stock,
                        updatedProduct.minStock,
                        product.stockUnit,
                        req.tenantPrisma!
                    ).catch(err => console.error('Failed to send low stock alert', err));
                }
            }

            const sale = await tx.sale.create({
                data: {
                    saleNumber,
                    userId,
                    customerId,
                    subtotal,
                    discountAmount: discountAmount ?? 0,
                    discountPercent: discountPercent ?? 0,
                    taxAmount: taxAmount ?? 0,
                    totalAmount,
                    paymentStatus: PaymentStatus.PAID,
                    paymentMethod: normalizedMethod,
                    amountReceived: amountReceived ?? totalAmount,
                    changeAmount: changeAmount ?? 0,
                    status: SaleStatus.COMPLETED,
                    items: {
                        create: saleItemsData as any,
                    },
                },
            });

            const bill = await tx.bill.create({
                data: {
                    billNumber,
                    userId,
                    customerId,
                    customerName,
                    subtotal,
                    discountAmount: discountAmount ?? 0,
                    discountPercent: discountPercent ?? 0,
                    taxAmount: taxAmount ?? 0,
                    totalAmount,
                    paymentMethod: normalizedMethod,
                    amountReceived: amountReceived ?? totalAmount,
                    changeAmount: changeAmount ?? 0,
                    status: BillStatus.COMPLETED,
                    notes,
                    items: {
                        create: saleItemsData as any,
                    },
                },
            });

            const fullBill = await tx.bill.findUnique({
                where: { id: bill.id },
                include: { items: true, user: true },
            });
            const fullSale = await tx.sale.findUnique({
                where: { id: sale.id },
                include: { items: true, user: true },
            });

            // Check for sales milestone/target
            // We use the calculated todayStart to respect the store's closing time
            const dailySales = await tx.sale.aggregate({
                where: {
                    createdAt: { gte: todayStart },
                    status: SaleStatus.COMPLETED
                },
                _sum: { totalAmount: true }
            });

            const currentTotal = Number(dailySales._sum.totalAmount || 0);
            const previousTotal = currentTotal - Number(totalAmount);

            // Check if we crossed the target threshold
            if (notificationSettings.salesTarget) {
                const milestoneStep = notificationSettings.salesTargetAmount || 10000;
                const currentMilestone = Math.floor(currentTotal / milestoneStep);
                const previousMilestone = Math.floor(previousTotal / milestoneStep);

                if (currentMilestone > previousMilestone && currentMilestone > 0) {
                    const notification = await tx.notification.create({
                        data: {
                            userId,
                            type: NotificationType.SALES_MILESTONE,
                            title: 'ยอดขายทะลุเป้า!',
                            message: `ยอดขายวันนี้ทะลุ ${(currentMilestone * milestoneStep).toLocaleString()} บาทแล้ว! (ยอดรวม: ${currentTotal.toLocaleString()} บาท)`,
                        }
                    });

                    // Emit to socket
                    socketService.sendNotification(req.tenantId!, userId, notification);
                }
            }

            return { bill: fullBill!, sale: fullSale! };
        }, {
            maxWait: 30000,
            timeout: 30000,
        });

        // Send Flex Message Alert for new sale with item details
        const saleItems = result.sale.items.map((item: any) => ({
            name: item.productName || 'สินค้า',
            quantity: item.quantity,
            price: Number(item.total) || (Number(item.unitPrice) * item.quantity)
        }));
        smsService.sendSalesAlert(
            result.sale.saleNumber,
            Number(result.sale.totalAmount),
            saleItems,
            result.bill.paymentMethod,
            req.tenantPrisma!
        ).catch(err => console.error('Failed to send sales Flex Message', err));

        res.status(201).json({
            bill: toBillDto(result.bill),
            sale: toSaleDto(result.sale),
        });
    } catch (error) {
        console.error('Create bill error', error);
        const message = error instanceof Error ? error.message : 'Unable to create bill';
        res.status(400).json({ message });
    }
});

// Void bill
router.put('/:id/void', requirePermission('VOID_SALE'), async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await req.tenantPrisma!.bill.update({
            where: { id: id as string },
            data: { status: BillStatus.VOIDED },
            include: { items: true, user: true },
        });
        res.json(toBillDto(bill));
    } catch (error) {
        console.error('Void bill error', error);
        res.status(500).json({ message: 'Unable to void bill' });
    }
});

export const billsRouter = router;
