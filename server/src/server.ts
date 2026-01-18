import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Prisma, PrismaClient, MovementType, PaymentStatus, SaleStatus, BillStatus, ExpenseCategory, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

import { tenantResolver } from './middleware/tenant';
import { managementRouter } from './routes/management';

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SETTINGS = {
    store: {
        storeName: 'ร้านกัญชาสุขใจ',
        storeNameEn: 'Happy Cannabis Shop',
        phone: '02-123-4567',
        email: 'contact@happycannabis.com',
        address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
        taxId: '0123456789012',
    },
    pos: {
        invoicePrefix: 'POS',
        taxRate: 7,
        maxDiscountCashier: 10,
        maxDiscountManager: 30,
        showCostPrice: true,
        scanSound: true,
        autoPrintReceipt: true,
    },
    sms: {
        enabled: true,
        provider: 'twilio',
        apiKey: '',
        sender: '',
        recipients: ['081-234-5678', '082-345-6789'],
        alerts: {
            realtimeSales: true,
            dailySummary: true,
            monthlySummary: true,
            lowStock: true,
            stockAdjustments: false,
        },
    },
    notifications: {
        lowStock: true,
        salesTarget: true,
        sound: true,
    },
} as const;
type SettingKey = keyof typeof DEFAULT_SETTINGS;

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
app.use(express.json());

// Management API (No tenant resolution needed)
app.use('/api/management', managementRouter);

app.use(tenantResolver);

const requireTenant = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.tenantPrisma) {
        return res.status(404).json({ message: 'Tenant not found' });
    }
    next();
};

type DecimalValue = Prisma.Decimal | number | null;

const generateDocumentNumber = (prefix: string) => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${datePart}-${random}`;
};

const normalizePaymentMethod = (method?: string) => {
    if (!method) return 'CASH';
    return method.toUpperCase();
};

const decimalToNumber = (value: DecimalValue) => {
    if (value === null || value === undefined) return 0;
    return Number(value);
};

const getSettingValue = async <K extends SettingKey>(key: K, prisma: PrismaClient) => {
    const setting = await prisma.systemSetting.findUnique({
        where: { key },
    });
    return (setting?.value as (typeof DEFAULT_SETTINGS)[K]) ?? DEFAULT_SETTINGS[key];
};

const toUserDto = (user: any) => ({
    id: user.id,
    employeeCode: user.employeeCode,
    username: user.username,
    fullName: user.fullName,
    nickname: user.nickname ?? undefined,
    phone: user.phone ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
});

const toCategoryDto = (category: any) => ({
    id: category.id,
    name: category.name,
    nameEn: category.nameEn ?? undefined,
    slug: category.slug,
    description: category.description ?? undefined,
    color: category.color,
    icon: category.icon,
    isActive: category.isActive,
    productCount: category.productCount ?? category._count?.products ?? 0,
    parentId: category.parentId ?? undefined,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
});

const toProductDto = (product: any) => ({
    id: product.id,
    name: product.name,
    nameEn: product.nameEn ?? undefined,
    description: product.description ?? undefined,
    price: decimalToNumber(product.price),
    cost: decimalToNumber(product.cost),
    comparePrice: product.comparePrice ? decimalToNumber(product.comparePrice) : undefined,
    stock: product.stock,
    minStock: product.minStock,
    stockUnit: product.stockUnit,
    categoryId: product.categoryId ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    isActive: product.isActive,
    showInPos: product.showInPos,
    totalSold: product.totalSold ?? 0,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: product.category ? toCategoryDto(product.category) : undefined,
});

const toPaymentMethodDto = (method: any) => ({
    id: method.id,
    name: method.name,
    nameEn: method.nameEn ?? undefined,
    type: method.type.toLowerCase(),
    icon: method.icon,
    isActive: method.isActive,
    isDefault: method.isDefault,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
});

const toSaleItemDto = (item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    discount: decimalToNumber(item.discount),
    total: decimalToNumber(item.total),
    createdAt: item.createdAt.toISOString(),
    product: item.product ? toProductDto(item.product) : undefined,
});

const toSaleDto = (sale: any) => ({
    id: sale.id,
    saleNumber: sale.saleNumber,
    userId: sale.userId,
    customerId: sale.customerId ?? undefined,
    subtotal: decimalToNumber(sale.subtotal),
    discountAmount: decimalToNumber(sale.discountAmount),
    discountPercent: decimalToNumber(sale.discountPercent),
    taxAmount: decimalToNumber(sale.taxAmount),
    totalAmount: decimalToNumber(sale.totalAmount),
    paymentStatus: sale.paymentStatus.toLowerCase(),
    paymentMethod: sale.paymentMethod.toLowerCase(),
    amountReceived: decimalToNumber(sale.amountReceived),
    changeAmount: decimalToNumber(sale.changeAmount),
    status: sale.status.toLowerCase(),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    user: sale.user ? toUserDto(sale.user) : undefined,
    items: sale.items ? sale.items.map(toSaleItemDto) : [],
});

const toBillItemDto = (item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    discount: decimalToNumber(item.discount),
    total: decimalToNumber(item.total),
    createdAt: item.createdAt.toISOString(),
    product: item.product ? toProductDto(item.product) : undefined,
});

const toBillDto = (bill: any) => ({
    id: bill.id,
    billNumber: bill.billNumber,
    userId: bill.userId,
    customerId: bill.customerId ?? undefined,
    customerName: bill.customerName ?? undefined,
    subtotal: decimalToNumber(bill.subtotal),
    discountAmount: decimalToNumber(bill.discountAmount),
    discountPercent: decimalToNumber(bill.discountPercent),
    taxAmount: decimalToNumber(bill.taxAmount),
    totalAmount: decimalToNumber(bill.totalAmount),
    paymentMethod: bill.paymentMethod.toLowerCase(),
    amountReceived: decimalToNumber(bill.amountReceived),
    changeAmount: decimalToNumber(bill.changeAmount),
    status: bill.status.toLowerCase(),
    createdAt: bill.createdAt.toISOString(),
    notes: bill.notes ?? undefined,
    user: bill.user ? toUserDto(bill.user) : undefined,
    items: bill.items ? bill.items.map(toBillItemDto) : [],
});

const toStockMovementDto = (movement: any) => ({
    id: movement.id,
    productId: movement.productId,
    userId: movement.userId,
    movementType: movement.movementType.toLowerCase(),
    quantityChange: movement.quantityChange,
    previousQuantity: movement.previousQuantity,
    newQuantity: movement.newQuantity,
    reason: movement.reason ?? undefined,
    notes: movement.notes ?? undefined,
    createdAt: movement.createdAt.toISOString(),
    product: movement.product ? toProductDto(movement.product) : undefined,
    user: movement.user ? toUserDto(movement.user) : undefined,
});

const toExpenseDto = (expense: any) => ({
    id: expense.id,
    title: expense.title,
    amount: decimalToNumber(expense.amount),
    category: expense.category.toLowerCase(),
    date: expense.date.toISOString(),
    userId: expense.userId,
    notes: expense.notes ?? undefined,
    createdAt: expense.createdAt.toISOString(),
    user: expense.user ? toUserDto(expense.user) : undefined,
});

const toNotificationDto = (notification: any) => ({
    id: notification.id,
    userId: notification.userId,
    type: notification.type.toLowerCase(),
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
});

const createNotification = async (userId: string, type: string, title: string, message: string, prisma: PrismaClient) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type: type.toUpperCase() as any,
                title,
                message,
            },
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};


const startOfDay = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
};

const startOfNDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
};

const formatPercent = (value: number) => Number(value.toFixed(1));

app.get('/api/health', async (req, res) => {
    try {
        await req.tenantPrisma!.$queryRaw`SELECT 1`;
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed', error });
    }
});

import { authenticateToken, generateToken } from './middleware/auth';

// ... (imports remain the same)

// Apply auth middleware to all routes starting with /api
// except specific public routes handled inside the middleware or before this line if needed
// However, since we want to protect everything EXCEPT login, we can mount it here
// but we need to make sure login route is accessible.
// The middleware explicitly checks for /api/auth/login and bypasses.

app.use('/api', authenticateToken);

// ... (previous code)

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const normalizedUsername = username.toLowerCase();

        const user = await req.tenantPrisma!.user.findUnique({
            where: { username: normalizedUsername },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        await req.tenantPrisma!.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate Token
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });

        res.json({
            user: toUserDto(user),
            token
        });
    } catch (error) {
        console.error('Login error', error);
        res.status(500).json({ message: 'Unable to login' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await req.tenantPrisma!.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(users.map(toUserDto));
    } catch (error) {
        console.error('Fetch users error', error);
        res.status(500).json({ message: 'Unable to fetch users' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await req.tenantPrisma!.category.findMany({
            orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { products: true } } },
        });
        res.json(categories.map((category) => toCategoryDto({ ...category, productCount: category._count.products })));
    } catch (error) {
        console.error('Fetch categories error', error);
        res.status(500).json({ message: 'Unable to fetch categories' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await req.tenantPrisma!.product.findMany({
            include: { category: true },
            orderBy: { name: 'asc' },
        });
        res.json(products.map(toProductDto));
    } catch (error) {
        console.error('Fetch products error', error);
        res.status(500).json({ message: 'Unable to fetch products' });
    }
});

app.get('/api/payment-methods', async (req, res) => {
    try {
        const paymentMethods = await req.tenantPrisma!.paymentMethod.findMany({
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
        res.json(paymentMethods.map(toPaymentMethodDto));
    } catch (error) {
        console.error('Fetch payment methods error', error);
        res.status(500).json({ message: 'Unable to fetch payment methods' });
    }
});

app.put('/api/payment-methods/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, icon, isActive, isDefault } = req.body;
        const data: Record<string, any> = {};
        if (typeof name === 'string') data.name = name;
        if (typeof nameEn === 'string') data.nameEn = nameEn;
        if (typeof icon === 'string') data.icon = icon;
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (typeof isDefault === 'boolean') data.isDefault = isDefault;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided' });
        }

        const method = await req.tenantPrisma!.paymentMethod.update({
            where: { id },
            data,
        });

        if (data.isDefault) {
            await req.tenantPrisma!.paymentMethod.updateMany({
                where: { id: { not: id } },
                data: { isDefault: false },
            });
        }

        res.json(toPaymentMethodDto(method));
    } catch (error) {
        console.error('Update payment method error', error);
        res.status(500).json({ message: 'Unable to update payment method' });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const keys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
        const values = await Promise.all(keys.map((key) => getSettingValue(key, req.tenantPrisma!)));
        const response = keys.reduce<Record<string, any>>((acc, key, index) => {
            acc[key] = values[index];
            return acc;
        }, {});
        res.json(response);
    } catch (error) {
        console.error('Fetch settings error', error);
        res.status(500).json({ message: 'Unable to fetch settings' });
    }
});

app.put('/api/settings/:section', async (req, res) => {
    try {
        const section = req.params.section as SettingKey;
        if (!DEFAULT_SETTINGS[section]) {
            return res.status(400).json({ message: 'Invalid settings section' });
        }
        const value = req.body ?? {};
        const setting = await req.tenantPrisma!.systemSetting.upsert({
            where: { key: section },
            update: { value },
            create: { key: section, value },
        });
        res.json(setting.value);
    } catch (error) {
        console.error('Update settings error', error);
        res.status(500).json({ message: 'Unable to update settings' });
    }
});

app.get('/api/stock/movements', async (req, res) => {
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

app.get('/api/bills', async (req, res) => {
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

app.post('/api/bills', async (req, res) => {
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
        const saleNumber = generateDocumentNumber('POS');
        const billNumber = generateDocumentNumber('BILL');

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
                const totalValue =
                    item.total ?? unitPrice * item.quantity - discountValue;

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
                    await createNotification(
                        userId,
                        NotificationType.LOW_STOCK,
                        'สินค้าใกล้หมด',
                        `สินค้า ${product.name} เหลือ ${updatedProduct.stock} ${product.stockUnit} (ต่ำกว่าขั้นต่ำ ${updatedProduct.minStock})`,
                        tx as any
                    );
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

            // Check for sales milestone (e.g. every 10,000 THB)
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const dailySales = await tx.sale.aggregate({
                where: {
                    createdAt: { gte: startOfToday },
                    status: SaleStatus.COMPLETED
                },
                _sum: { totalAmount: true }
            });

            const currentTotal = Number(dailySales._sum.totalAmount || 0);
            const previousTotal = currentTotal - Number(totalAmount);

            // Check if we crossed a 10,000 threshold
            const milestoneStep = 10000;
            const currentMilestone = Math.floor(currentTotal / milestoneStep);
            const previousMilestone = Math.floor(previousTotal / milestoneStep);

            if (currentMilestone > previousMilestone && currentMilestone > 0) {
                await tx.notification.create({
                    data: {
                        userId,
                        type: NotificationType.SALES_MILESTONE,
                        title: 'ยอดขายทะลุเป้า!',
                        message: `ยอดขายวันนี้ทะลุ ${(currentMilestone * milestoneStep).toLocaleString()} บาทแล้ว! (ยอดรวม: ${currentTotal.toLocaleString()} บาท)`,
                    }
                });
            }

            return { bill: fullBill!, sale: fullSale! };
        });

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

app.get('/api/dashboard', async (req, res) => {
    try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const weekStart = startOfNDaysAgo(6);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [products, todaySalesRecords, salesItemsToday, recentSales, salesMonth, saleItemsMonth] = await Promise.all([
            req.tenantPrisma!.product.findMany({ include: { category: true } }),
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: todayStart } },
                select: { id: true, createdAt: true, totalAmount: true, items: { select: { quantity: true } } },
            }),
            req.tenantPrisma!.saleItem.findMany({
                where: { sale: { createdAt: { gte: todayStart } } },
                include: { product: true },
            }),
            req.tenantPrisma!.sale.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { user: true, items: true },
            }),
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: monthStart } },
                select: { totalAmount: true, paymentMethod: true, createdAt: true, items: { select: { quantity: true } } },
            }),
            req.tenantPrisma!.saleItem.findMany({
                where: { sale: { createdAt: { gte: weekStart } } },
                include: { product: true },
            }),
        ]);

        const todaySalesTotal = todaySalesRecords.reduce((sum, sale) => sum + decimalToNumber(sale.totalAmount), 0);
        const todayOrders = todaySalesRecords.length;
        const lowStockProducts = products.filter((product) => product.stock <= product.minStock).map(toProductDto);

        const salesByHourMap = new Map<number, { sales: number; orders: number }>();
        todaySalesRecords.forEach((sale) => {
            const hour = sale.createdAt.getHours();
            const current = salesByHourMap.get(hour) ?? { sales: 0, orders: 0 };
            current.sales += decimalToNumber(sale.totalAmount);
            current.orders += sale.items.reduce((count, item) => count + item.quantity, 0);
            salesByHourMap.set(hour, current);
        });
        const salesByHour = Array.from({ length: 12 }).map((_, index) => {
            const hour = 9 + index;
            const entry = salesByHourMap.get(hour) ?? { sales: 0, orders: 0 };
            return { hour, sales: entry.sales, orders: entry.orders };
        });

        const topProductMap = new Map<string, { product: any; quantity: number; revenue: number }>();
        salesItemsToday.forEach((item) => {
            const existing = topProductMap.get(item.productId) ?? {
                product: item.product,
                quantity: 0,
                revenue: 0,
            };
            existing.quantity += item.quantity;
            existing.revenue += decimalToNumber(item.total);
            topProductMap.set(item.productId, existing);
        });
        const topProducts = Array.from(topProductMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
            .map((entry) => ({
                product: toProductDto(entry.product),
                quantity: entry.quantity,
                revenue: entry.revenue,
            }));

        const weekSalesTotals = salesMonth
            .filter((sale) => sale.createdAt >= weekStart)
            .reduce(
                (acc, sale) => {
                    acc.sales += decimalToNumber(sale.totalAmount);
                    acc.orders += sale.items.reduce((count, item) => count + item.quantity, 0);
                    return acc;
                },
                { sales: 0, orders: 0 }
            );

        const salesByPayment = salesMonth.reduce<Record<string, number>>((acc, sale) => {
            const key = sale.paymentMethod.toLowerCase();
            acc[key] = (acc[key] || 0) + decimalToNumber(sale.totalAmount);
            return acc;
        }, {});

        res.json({
            todaySales: todaySalesTotal,
            todayOrders,
            todayAvgOrder: todayOrders > 0 ? todaySalesTotal / todayOrders : 0,
            weekSales: weekSalesTotals.sales,
            monthSales: salesMonth.reduce((sum, sale) => sum + decimalToNumber(sale.totalAmount), 0),
            lowStockCount: lowStockProducts.length,
            lowStockProducts,
            topProducts,
            salesByHour,
            salesByPayment,
            recentSales: recentSales.map(toSaleDto),
        });
    } catch (error) {
        console.error('Dashboard error', error);
        res.status(500).json({ message: 'Unable to load dashboard data' });
    }
});

app.get('/api/reports/overview', async (req, res) => {
    try {
        const now = new Date();

        // Support custom date range from query parameters
        const { startDate, endDate } = req.query;
        let dateRangeStart: Date;
        let dateRangeEnd: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of current month

        if (startDate && typeof startDate === 'string') {
            dateRangeStart = new Date(startDate);
        } else {
            // Default: start of current month
            dateRangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        if (endDate && typeof endDate === 'string') {
            dateRangeEnd = new Date(endDate);
            dateRangeEnd.setHours(23, 59, 59, 999);
        }

        const weekStart = startOfNDaysAgo(6);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStart = startOfDay(now);

        const [salesWeek, salesInRange, saleItemsInRange, products, ordersToday, expensesInRange] = await Promise.all([
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: weekStart } },
                include: { items: true },
            }),
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: dateRangeStart, lte: dateRangeEnd } },
                include: { items: true, user: true },
            }),
            req.tenantPrisma!.saleItem.findMany({
                where: { sale: { createdAt: { gte: dateRangeStart, lte: dateRangeEnd } } },
                include: { product: { include: { category: true } } },
            }),
            req.tenantPrisma!.product.findMany(),
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: todayStart } },
                select: { createdAt: true, totalAmount: true, items: { select: { quantity: true } } },
            }),
            req.tenantPrisma!.expense.findMany({
                where: { date: { gte: dateRangeStart, lte: dateRangeEnd } },
                include: { user: true },
            }),
        ]);

        const weeklyMap = new Map<string, { sales: number; orders: number }>();
        salesWeek.forEach((sale) => {
            const dateKey = sale.createdAt.toISOString().slice(0, 10);
            const current = weeklyMap.get(dateKey) ?? { sales: 0, orders: 0 };
            current.sales += decimalToNumber(sale.totalAmount);
            current.orders += sale.items.reduce((sum, item) => sum + item.quantity, 0);
            weeklyMap.set(dateKey, current);
        });

        const weeklyData = Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            const key = date.toISOString().slice(0, 10);
            const entry = weeklyMap.get(key) ?? { sales: 0, orders: 0 };
            const dayLabel = new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(date);
            return { day: dayLabel, sales: entry.sales, orders: entry.orders };
        });

        const salesByPayment = salesInRange.reduce<Record<string, number>>((acc, sale) => {
            const key = sale.paymentMethod.toLowerCase();
            acc[key] = (acc[key] || 0) + decimalToNumber(sale.totalAmount);
            return acc;
        }, {});

        const categoryMap = new Map<string, { name: string; color: string; total: number }>();
        saleItemsInRange.forEach((item) => {
            const category = item.product?.category;
            const key = category?.id ?? 'uncategorized';
            const existing = categoryMap.get(key) ?? {
                name: category?.name ?? 'ไม่มีหมวดหมู่',
                color: category?.color ?? '#6B7280',
                total: 0,
            };
            existing.total += decimalToNumber(item.total);
            categoryMap.set(key, existing);
        });

        const totalCategorySales = Array.from(categoryMap.values()).reduce((sum, category) => sum + category.total, 0);
        const categoryBreakdown = Array.from(categoryMap.values()).map((category) => ({
            name: category.name,
            value: totalCategorySales > 0 ? formatPercent((category.total / totalCategorySales) * 100) : 0,
            color: category.color,
        }));

        const topProductMap = new Map<string, { product: any; quantity: number; revenue: number }>();
        saleItemsInRange.forEach((item) => {
            if (!item.product) return;
            const existing = topProductMap.get(item.productId) ?? {
                product: item.product,
                quantity: 0,
                revenue: 0,
            };
            existing.quantity += item.quantity;
            existing.revenue += decimalToNumber(item.total);
            topProductMap.set(item.productId, existing);
        });

        const topProducts = Array.from(topProductMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)
            .map((entry) => ({
                product: toProductDto(entry.product),
                quantity: entry.quantity,
                revenue: entry.revenue,
            }));

        // Calculate profit (revenue - cost)
        let totalRevenue = 0;
        let totalCost = 0;
        saleItemsInRange.forEach((item) => {
            const revenue = decimalToNumber(item.total);
            const cost = item.product ? decimalToNumber(item.product.cost) * item.quantity : 0;
            totalRevenue += revenue;
            totalCost += cost;
        });
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? formatPercent((totalProfit / totalRevenue) * 100) : 0;

        // Monthly breakdown
        const monthlyMap = new Map<string, { revenue: number; cost: number; profit: number; orders: number }>();
        salesInRange.forEach((sale) => {
            const monthKey = sale.createdAt.toISOString().slice(0, 7); // YYYY-MM
            const current = monthlyMap.get(monthKey) ?? { revenue: 0, cost: 0, profit: 0, orders: 0 };

            let saleCost = 0;
            sale.items.forEach((item: any) => {
                const product = products.find((p) => p.id === item.productId);
                if (product) {
                    saleCost += decimalToNumber(product.cost) * item.quantity;
                }
            });

            const saleRevenue = decimalToNumber(sale.totalAmount);
            current.revenue += saleRevenue;
            current.cost += saleCost;
            current.profit += (saleRevenue - saleCost);
            current.orders += 1;
            monthlyMap.set(monthKey, current);
        });

        const monthlyBreakdown = Array.from(monthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, data]) => ({
                month,
                revenue: data.revenue,
                cost: data.cost,
                profit: data.profit,
                orders: data.orders,
            }));

        const inventoryValue = products.reduce((sum, product) => sum + product.stock * decimalToNumber(product.cost), 0);
        const lowStockCount = products.filter((product) => product.stock <= product.minStock).length;
        const outOfStockCount = products.filter((product) => product.stock === 0).length;

        const ordersByHourMap = new Map<number, { orders: number; sales: number }>();
        ordersToday.forEach((sale) => {
            const hour = sale.createdAt.getHours();
            const current = ordersByHourMap.get(hour) ?? { orders: 0, sales: 0 };
            current.orders += sale.items.reduce((sum, item) => sum + item.quantity, 0);
            current.sales += decimalToNumber(sale.totalAmount);
            ordersByHourMap.set(hour, current);
        });
        const ordersByHour = Array.from({ length: 12 }).map((_, index) => {
            const hour = 9 + index;
            const entry = ordersByHourMap.get(hour) ?? { orders: 0, sales: 0 };
            return { hour, orders: entry.orders, sales: entry.sales };
        });

        const lowStockList = products
            .filter((product) => product.stock <= product.minStock)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 10)
            .map(toProductDto);

        // ==================== BI FEATURES ====================

        // 1. SMART ALERTS
        const alerts: any[] = [];

        // Calculate daily sales average for stock alerts
        const daysInRange = Math.max(1, Math.ceil((dateRangeEnd.getTime() - dateRangeStart.getTime()) / (1000 * 60 * 60 * 24)));

        products.forEach((product) => {
            const productSales = topProductMap.get(product.id);
            const quantitySold = productSales?.quantity || 0;
            const dailyAvg = quantitySold / daysInRange;

            if (dailyAvg > 0) {
                const daysLeft = product.stock / dailyAvg;

                // Critical: Stock out in < 3 days
                if (daysLeft < 3 && product.stock > 0) {
                    const reorderQty = Math.ceil(dailyAvg * 30); // 30 days supply
                    alerts.push({
                        type: 'stock',
                        severity: 'critical',
                        title: `${product.name} ใกล้หมด`,
                        message: `เหลือ ${product.stock} หน่วย หมดใน ${daysLeft.toFixed(1)} วัน`,
                        action: `สั่งเพิ่ม ${reorderQty} หน่วยวันนี้`,
                        productId: product.id,
                    });
                }
                // Warning: Stock out in 3-7 days
                else if (daysLeft >= 3 && daysLeft < 7) {
                    alerts.push({
                        type: 'stock',
                        severity: 'warning',
                        title: `${product.name} สต็อกต่ำ`,
                        message: `เหลือ ${product.stock} หน่วย (${daysLeft.toFixed(1)} วัน)`,
                        action: `สั่งภายใน ${Math.ceil(daysLeft - 2)} วัน`,
                        productId: product.id,
                    });
                }
            }
        });

        // 2. DEAD STOCK DETECTION
        const deadStockThresholdDays = 20;
        const deadStock: any[] = [];

        // Get last sale date for each product
        const productLastSaleMap = new Map<string, Date>();
        const allSaleItems = await req.tenantPrisma!.saleItem.findMany({
            where: { sale: { createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } } }, // Last 60 days
            select: { productId: true, sale: { select: { createdAt: true } } },
            orderBy: { sale: { createdAt: 'desc' } },
        });

        allSaleItems.forEach((item) => {
            if (!productLastSaleMap.has(item.productId)) {
                productLastSaleMap.set(item.productId, item.sale.createdAt);
            }
        });

        products.forEach((product) => {
            const lastSaleDate = productLastSaleMap.get(product.id);
            if (product.stock > 5) {
                const daysSinceLastSale = lastSaleDate
                    ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 999;

                if (daysSinceLastSale > deadStockThresholdDays) {
                    const valueAtCost = product.stock * decimalToNumber(product.cost);
                    const suggestedDiscount = daysSinceLastSale > 40 ? 30 : 20;

                    deadStock.push({
                        productId: product.id,
                        productName: product.name,
                        imageUrl: product.imageUrl,
                        stock: product.stock,
                        daysSinceLastSale,
                        valueAtCost,
                        suggestedDiscount,
                    });

                    alerts.push({
                        type: 'deadstock',
                        severity: 'warning',
                        title: `สินค้าไม่เคลื่อนไหว: ${product.name}`,
                        message: `ไม่ขาย ${daysSinceLastSale} วัน (มูลค่า ฿${valueAtCost.toFixed(0)})`,
                        action: `ลดราคา ${suggestedDiscount}%`,
                        productId: product.id,
                    });
                }
            }
        });

        // 3. INSIGHTS ENGINE
        const insights: any[] = [];

        // Profit growth insight
        if (totalProfit > 0 && totalRevenue > 0) {
            const marginPercent = (totalProfit / totalRevenue) * 100;
            if (marginPercent > 55) {
                insights.push({
                    type: 'positive',
                    title: 'อัตรากำไรดี',
                    description: `อัตรากำไร ${marginPercent.toFixed(1)}% อยู่ในเกณฑ์ดี`,
                    factors: ['การจัดการต้นทุนมีประสิทธิภาพ', 'ราคาขายเหมาะสม'],
                });
            } else if (marginPercent < 40) {
                insights.push({
                    type: 'negative',
                    title: 'อัตรากำไรต่ำ',
                    description: `อัตรากำไร ${marginPercent.toFixed(1)}% ต่ำกว่าเกณฑ์`,
                    factors: ['ต้นทุนสูง', 'ราคาขายต่ำ', 'ส่วนลดมาก'],
                });

                alerts.push({
                    type: 'margin',
                    severity: 'warning',
                    title: 'อัตรากำไรต่ำ',
                    message: `Margin ${marginPercent.toFixed(1)}% (เป้าหมาย >50%)`,
                    action: 'ตรวจสอบต้นทุนและราคาขาย',
                });
            }
        }

        // Top category insight
        if (categoryBreakdown.length > 0) {
            const topCategory = categoryBreakdown.reduce((max, cat) =>
                cat.value > max.value ? cat : max
            );
            insights.push({
                type: 'neutral',
                title: 'หมวดหมู่ขายดี',
                description: `${topCategory.name} คิดเป็น ${topCategory.value}% ของยอดขาย`,
                factors: ['ควรรักษาสต็อกให้เพียงพอ'],
            });
        }

        // 4. FORECAST (7-day sales projection)
        const forecast: any = {
            next7Days: { total: 0, confidence: 0, daily: [] },
        };

        if (salesInRange.length > 7) {
            // Simple moving average with day-of-week seasonality
            const dailyAvgSales = totalRevenue / daysInRange;

            // Day weights (Thai weekday pattern)
            const dayWeights: Record<number, number> = {
                0: 1.20, // Sunday
                1: 0.85, // Monday
                2: 0.82, // Tuesday
                3: 0.90, // Wednesday
                4: 0.95, // Thursday
                5: 1.15, // Friday
                6: 1.25, // Saturday
            };

            let forecastTotal = 0;
            const forecastDaily: any[] = [];

            for (let i = 0; i < 7; i++) {
                const futureDate = new Date(now);
                futureDate.setDate(now.getDate() + i + 1);
                const dayOfWeek = futureDate.getDay();
                const dayWeight = dayWeights[dayOfWeek] || 1.0;
                const projected = dailyAvgSales * dayWeight;

                forecastTotal += projected;
                forecastDaily.push({
                    date: futureDate.toISOString().slice(0, 10),
                    projected: Math.round(projected),
                });
            }

            forecast.next7Days = {
                total: Math.round(forecastTotal),
                confidence: daysInRange >= 30 ? 85 : daysInRange >= 14 ? 70 : 50,
                daily: forecastDaily,
            };
        }

        // 5. RECOMMENDATIONS ENGINE
        const recommendations: any[] = [];

        // Critical stock recommendations
        const criticalStockProducts = products.filter((product) => {
            const productSales = topProductMap.get(product.id);
            const quantitySold = productSales?.quantity || 0;
            const dailyAvg = quantitySold / daysInRange;
            const daysLeft = dailyAvg > 0 ? product.stock / dailyAvg : 999;
            return daysLeft < 3 && product.stock > 0;
        }).slice(0, 3);

        criticalStockProducts.forEach((product) => {
            const productSales = topProductMap.get(product.id);
            const quantitySold = productSales?.quantity || 0;
            const dailyAvg = quantitySold / daysInRange;
            const reorderQty = Math.ceil(dailyAvg * 30);

            recommendations.push({
                priority: 'critical',
                category: 'inventory',
                title: `สั่ง ${product.name} ด่วน`,
                description: `สต็อกเหลือ ${product.stock} หน่วย ขายเฉลี่ย ${dailyAvg.toFixed(1)}/วัน`,
                action: `สั่งเพิ่ม ${reorderQty} หน่วยวันนี้`,
                expectedImpact: `ป้องกันขาดสต็อก รักษายอดขาย ฿${Math.round(dailyAvg * decimalToNumber(product.price) * 7)}/สัปดาห์`,
            });
        });

        // Dead stock clearance recommendations
        if (deadStock.length > 0) {
            const totalDeadValue = deadStock.reduce((sum, item) => sum + item.valueAtCost, 0);
            recommendations.push({
                priority: 'high',
                category: 'promotion',
                title: 'จัดการสินค้าไม่เคลื่อนไหว',
                description: `มีสินค้า ${deadStock.length} รายการไม่ขาย >20 วัน`,
                action: 'ลดราคา 20-30% เพื่อเคลียร์สต็อก',
                expectedImpact: `กู้คืนเงินทุน ฿${Math.round(totalDeadValue * 0.7)} (vs ฿0 ถ้าไม่ขาย)`,
            });
        }

        // Profit margin improvement
        if (totalRevenue > 0) {
            const currentMargin = (totalProfit / totalRevenue) * 100;
            if (currentMargin < 50) {
                recommendations.push({
                    priority: 'medium',
                    category: 'pricing',
                    title: 'ปรับปรุงอัตรากำไร',
                    description: `Margin ปัจจุบัน ${currentMargin.toFixed(1)}% ต่ำกว่าเป้า 50%`,
                    action: 'ตรวจสอบต้นทุนและราคาขาย ลดส่วนลด',
                    expectedImpact: `เพิ่ม margin 5% = กำไรเพิ่ม ฿${Math.round(totalRevenue * 0.05)}/เดือน`,
                });
            }
        }

        res.json({
            weeklySales: weeklyData,
            salesByPayment,
            categoryBreakdown,
            topProducts,
            ordersByHour,
            inventory: {
                totalProducts: products.length,
                lowStockCount,
                outOfStockCount,
                stockValue: inventoryValue,
            },
            lowStockProducts: lowStockList,
            // Profit fields
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
            monthlyBreakdown,
            // BI Features
            alerts: alerts.sort((a, b) => {
                const severityOrder = { critical: 0, warning: 1, info: 2 };
                return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
            }),
            insights,
            forecast,
            recommendations,
            deadStock: deadStock.slice(0, 10),
            // Financial data
            financials: (() => {
                const totalExpenses = expensesInRange.reduce((sum, expense) => sum + decimalToNumber(expense.amount), 0);
                const netProfit = totalRevenue - totalCost - totalExpenses;

                // Create financial transactions combining sales and expenses
                const transactions: any[] = [];

                // Add sales as income transactions
                salesInRange.forEach((sale) => {
                    transactions.push({
                        id: sale.id,
                        type: 'income',
                        date: sale.createdAt.toISOString(),
                        details: `ขายสินค้า ${sale.saleNumber}`,
                        category: 'ยอดขาย',
                        amount: decimalToNumber(sale.totalAmount),
                        recorder: sale.user?.fullName || 'ไม่ระบุ',
                        referenceId: sale.id,
                    });
                });

                // Add expenses as expense transactions
                expensesInRange.forEach((expense) => {
                    const categoryLabels: Record<string, string> = {
                        'RENT': 'ค่าเช่า',
                        'UTILITIES': 'ค่าสาธารณูปโภค',
                        'SALARY': 'เงินเดือน',
                        'SUPPLIES': 'วัสดุสิ้นเปลือง',
                        'MARKETING': 'การตลาด',
                        'OTHER': 'อื่นๆ',
                    };

                    transactions.push({
                        id: expense.id,
                        type: 'expense',
                        date: expense.date.toISOString(),
                        details: expense.title,
                        category: categoryLabels[expense.category] || expense.category,
                        amount: decimalToNumber(expense.amount),
                        recorder: expense.user?.fullName || 'ไม่ระบุ',
                        referenceId: expense.id,
                    });
                });

                // Sort by date descending
                transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return {
                    totalIncome: totalRevenue,
                    totalExpenses,
                    netProfit,
                    transactions,
                };
            })(),
        });
    } catch (error) {
        console.error('Reports error', error);
        res.status(500).json({ message: 'Unable to load reports data' });
    }
});

// ==================== Products CRUD ====================
app.post('/api/products', async (req, res) => {
    try {
        const {
            name,
            nameEn,
            description,
            price,
            cost,
            comparePrice,
            stock,
            minStock,
            stockUnit,
            categoryId,
            imageUrl,
            showInPos,
        } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        const product = await req.tenantPrisma!.product.create({
            data: {
                name,
                nameEn: nameEn || null,
                description: description || null,
                price,
                cost: cost ?? 0,
                comparePrice: comparePrice || null,
                stock: stock ?? 0,
                minStock: minStock ?? 10,
                stockUnit: stockUnit || 'unit',
                categoryId: categoryId || null,
                imageUrl: imageUrl || null,
                showInPos: showInPos ?? true,
                isActive: true,
            } as any,
            include: { category: true },
        });

        res.status(201).json(toProductDto(product));
    } catch (error) {
        console.error('Create product error', error);
        const message = error instanceof Error ? error.message : 'Unable to create product';
        res.status(400).json({ message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            nameEn,
            description,
            price,
            cost,
            comparePrice,
            stock,
            minStock,
            stockUnit,
            categoryId,
            imageUrl,
            isActive,
            showInPos,
        } = req.body;

        const product = await req.tenantPrisma!.product.update({
            where: { id },
            data: {
                name,
                nameEn: nameEn || null,
                description: description || null,
                price,
                cost,
                comparePrice: comparePrice || null,
                stock,
                minStock,
                stockUnit,
                categoryId: categoryId || null,
                imageUrl: imageUrl || null,
                isActive,
                showInPos,
            },
            include: { category: true },
        });

        res.json(toProductDto(product));
    } catch (error) {
        console.error('Update product error', error);
        const message = error instanceof Error ? error.message : 'Unable to update product';
        res.status(400).json({ message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by setting isActive to false
        const product = await req.tenantPrisma!.product.update({
            where: { id },
            data: { isActive: false },
        });

        res.json({ message: 'Product deleted successfully', product: toProductDto(product) });
    } catch (error) {
        console.error('Delete product error', error);
        const message = error instanceof Error ? error.message : 'Unable to delete product';
        res.status(400).json({ message });
    }
});

// ==================== Categories CRUD ====================
app.post('/api/categories', async (req, res) => {
    try {
        const { name, nameEn, slug, description, color, icon, parentId, sortOrder } = req.body;

        if (!name || !slug || !color || !icon) {
            return res.status(400).json({ message: 'Name, slug, color, and icon are required' });
        }

        const category = await req.tenantPrisma!.category.create({
            data: {
                name,
                nameEn: nameEn || null,
                slug,
                description: description || null,
                color,
                icon,
                parentId: parentId || null,
                sortOrder: sortOrder ?? 0,
                isActive: true,
            },
            include: { _count: { select: { products: true } } },
        });

        res.status(201).json(toCategoryDto({ ...category, productCount: category._count.products }));
    } catch (error) {
        console.error('Create category error', error);
        const message = error instanceof Error ? error.message : 'Unable to create category';
        res.status(400).json({ message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, slug, description, color, icon, isActive, parentId, sortOrder } = req.body;

        const category = await req.tenantPrisma!.category.update({
            where: { id },
            data: {
                name,
                nameEn: nameEn || null,
                slug,
                description: description || null,
                color,
                icon,
                isActive,
                parentId: parentId || null,
                sortOrder,
            },
            include: { _count: { select: { products: true } } },
        });

        res.json(toCategoryDto({ ...category, productCount: category._count.products }));
    } catch (error) {
        console.error('Update category error', error);
        const message = error instanceof Error ? error.message : 'Unable to update category';
        res.status(400).json({ message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by setting isActive to false
        const category = await req.tenantPrisma!.category.update({
            where: { id },
            data: { isActive: false },
        });

        res.json({ message: 'Category deleted successfully', category: toCategoryDto(category) });
    } catch (error) {
        console.error('Delete category error', error);
        const message = error instanceof Error ? error.message : 'Unable to delete category';
        res.status(400).json({ message });
    }
});

// ==================== Users CRUD ====================
app.post('/api/users', async (req, res) => {
    try {
        const { employeeCode, username, fullName, nickname, phone, role, avatarUrl, password } = req.body;

        if (!employeeCode || !username || !fullName || !role) {
            return res.status(400).json({ message: 'Employee code, username, full name, and role are required' });
        }

        if (!password) {
            return res.status(400).json({ message: 'Password is required for new users' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await req.tenantPrisma!.user.create({
            data: {
                employeeCode,
                username: username.toLowerCase(),
                fullName,
                nickname: nickname || null,
                phone: phone || null,
                role,
                avatarUrl: avatarUrl || null,
                password: hashedPassword,
                isActive: true,
            },
        });

        res.status(201).json(toUserDto(user));
    } catch (error) {
        console.error('Create user error', error);
        const message = error instanceof Error ? error.message : 'Unable to create user';
        res.status(400).json({ message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeCode, username, fullName, nickname, phone, role, isActive, avatarUrl } = req.body;

        const user = await req.tenantPrisma!.user.update({
            where: { id },
            data: {
                employeeCode,
                username: username ? username.toLowerCase() : undefined,
                fullName,
                nickname: nickname || null,
                phone: phone || null,
                role,
                isActive,
                avatarUrl: avatarUrl || null,
            },
        });

        res.json(toUserDto(user));
    } catch (error) {
        console.error('Update user error', error);
        const message = error instanceof Error ? error.message : 'Unable to update user';
        res.status(400).json({ message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Deactivate user instead of hard delete
        const user = await req.tenantPrisma!.user.update({
            where: { id },
            data: { isActive: false },
        });

        res.json({ message: 'User deactivated successfully', user: toUserDto(user) });
    } catch (error) {
        console.error('Delete user error', error);
        const message = error instanceof Error ? error.message : 'Unable to deactivate user';
        res.status(400).json({ message });
    }
});

// ==================== Expenses CRUD ====================
app.get('/api/expenses', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where: any = {};

        if (startDate && typeof startDate === 'string') {
            where.date = { gte: new Date(startDate) };
        }
        if (endDate && typeof endDate === 'string') {
            where.date = { ...where.date, lte: new Date(endDate) };
        }

        const expenses = await req.tenantPrisma!.expense.findMany({
            where,
            include: { user: true },
            orderBy: { date: 'desc' },
        });

        res.json(expenses.map(toExpenseDto));
    } catch (error) {
        console.error('Fetch expenses error', error);
        res.status(500).json({ message: 'Unable to fetch expenses' });
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const { title, amount, category, date, userId, notes } = req.body;

        if (!title || amount === undefined || !category || !date || !userId) {
            return res.status(400).json({ message: 'Title, amount, category, date, and userId are required' });
        }

        // Map Thai labels to English enum values
        const categoryMap: Record<string, ExpenseCategory> = {
            'ค่าเช่า': ExpenseCategory.RENT,
            'rent': ExpenseCategory.RENT,
            'RENT': ExpenseCategory.RENT,
            'ค่าสาธารณูปโภค': ExpenseCategory.UTILITIES,
            'utilities': ExpenseCategory.UTILITIES,
            'UTILITIES': ExpenseCategory.UTILITIES,
            'เงินเดือน': ExpenseCategory.SALARY,
            'salary': ExpenseCategory.SALARY,
            'SALARY': ExpenseCategory.SALARY,
            'วัสดุสิ้นเปลือง': ExpenseCategory.SUPPLIES,
            'supplies': ExpenseCategory.SUPPLIES,
            'SUPPLIES': ExpenseCategory.SUPPLIES,
            'การตลาด': ExpenseCategory.MARKETING,
            'marketing': ExpenseCategory.MARKETING,
            'MARKETING': ExpenseCategory.MARKETING,
            'อื่นๆ': ExpenseCategory.OTHER,
            'other': ExpenseCategory.OTHER,
            'OTHER': ExpenseCategory.OTHER,
        };

        const expenseCategory = categoryMap[category];
        if (!expenseCategory) {
            return res.status(400).json({ message: 'Invalid expense category' });
        }

        const expense = await req.tenantPrisma!.expense.create({
            data: {
                title,
                amount,
                category: expenseCategory,
                date: new Date(date),
                userId,
                notes: notes || null,
            },
            include: { user: true },
        });

        res.status(201).json(toExpenseDto(expense));
    } catch (error) {
        console.error('Create expense error', error);
        const message = error instanceof Error ? error.message : 'Unable to create expense';
        res.status(400).json({ message });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await req.tenantPrisma!.expense.delete({
            where: { id },
        });

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error', error);
        const message = error instanceof Error ? error.message : 'Unable to delete expense';
        res.status(400).json({ message });
    }
});

// ==================== Stock Adjustment ====================
app.post('/api/stock/adjust', async (req, res) => {
    try {
        const { productId, userId, adjustmentType, quantity, reason, notes } = req.body;

        if (!productId || !userId || !adjustmentType || quantity === undefined) {
            return res.status(400).json({ message: 'Product ID, user ID, adjustment type, and quantity are required' });
        }

        const result = await req.tenantPrisma!.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) {
                throw new Error('ไม่พบสินค้าที่ระบุ');
            }

            const previousQuantity = product.stock;
            let newQuantity: number;

            switch (adjustmentType) {
                case 'add':
                    newQuantity = previousQuantity + quantity;
                    break;
                case 'subtract':
                    newQuantity = previousQuantity - quantity;
                    break;
                case 'set':
                    newQuantity = quantity;
                    break;
                default:
                    throw new Error('Invalid adjustment type');
            }

            if (newQuantity < 0) {
                throw new Error('สต็อกไม่สามารถติดลบได้');
            }

            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: { stock: newQuantity },
            });

            const movement = await tx.stockMovement.create({
                data: {
                    productId,
                    userId,
                    movementType: adjustmentType === 'add' ? MovementType.RESTOCK : MovementType.ADJUSTMENT,
                    quantityChange: newQuantity - previousQuantity,
                    previousQuantity,
                    newQuantity,
                    reason: reason || `ปรับสต็อก (${adjustmentType})`,
                    notes: notes || null,
                },
                include: { product: true, user: true },
            });

            return { product: updatedProduct, movement };
        });

        res.json({
            product: toProductDto(result.product),
            movement: toStockMovementDto(result.movement),
        });
    } catch (error) {
        console.error('Stock adjustment error', error);
        const message = error instanceof Error ? error.message : 'Unable to adjust stock';
        res.status(400).json({ message });
    }
});

// ==================== NOTIFICATIONS API ====================

app.get('/api/notifications', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const notifications = await req.tenantPrisma!.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(notifications.map(toNotificationDto));
    } catch (error) {
        console.error('Fetch notifications error', error);
        res.status(500).json({ message: 'Unable to fetch notifications' });
    }
});

app.get('/api/notifications/unread-count', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const count = await req.tenantPrisma!.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        res.json({ count });
    } catch (error) {
        console.error('Fetch unread count error', error);
        res.status(500).json({ message: 'Unable to fetch unread count' });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const { userId, type, title, message } = req.body;

        if (!userId || !type || !title || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const notification = await createNotification(userId, type, title, message, req.tenantPrisma!);

        if (!notification) {
            return res.status(500).json({ message: 'Failed to create notification' });
        }

        res.status(201).json(toNotificationDto(notification));
    } catch (error) {
        console.error('Create notification error', error);
        res.status(500).json({ message: 'Unable to create notification' });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await req.tenantPrisma!.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.json(toNotificationDto(notification));
    } catch (error) {
        console.error('Mark notification as read error', error);
        res.status(500).json({ message: 'Unable to mark notification as read' });
    }
});

app.put('/api/notifications/read-all', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await req.tenantPrisma!.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error', error);
        res.status(500).json({ message: 'Unable to mark all as read' });
    }
});

app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await req.tenantPrisma!.notification.delete({
            where: { id },
        });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error', error);
        res.status(500).json({ message: 'Unable to delete notification' });
    }
});

// ==================== USER PROFILE API ====================

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, nickname, phone, username, avatarUrl } = req.body;

        const data: Record<string, any> = {};
        if (typeof fullName === 'string') data.fullName = fullName;
        if (typeof nickname === 'string') data.nickname = nickname;
        if (typeof phone === 'string') data.phone = phone;
        if (typeof username === 'string') data.username = username.toLowerCase();
        if (typeof avatarUrl === 'string') data.avatarUrl = avatarUrl;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided' });
        }

        const user = await req.tenantPrisma!.user.update({
            where: { id },
            data,
        });

        res.json(toUserDto(user));
    } catch (error) {
        console.error('Update user error', error);
        res.status(500).json({ message: 'Unable to update user' });
    }
});

app.put('/api/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required' });
        }

        const user = await req.tenantPrisma!.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await req.tenantPrisma!.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Failed to change password' });
    }
});

app.get('/api/backup', async (req, res) => {
    try {
        const backupData = {
            users: await req.tenantPrisma!.user.findMany(),
            categories: await req.tenantPrisma!.category.findMany(),
            products: await req.tenantPrisma!.product.findMany(),
            sales: await req.tenantPrisma!.sale.findMany({ include: { items: true } }),
            bills: await req.tenantPrisma!.bill.findMany({ include: { items: true } }),
            stockMovements: await req.tenantPrisma!.stockMovement.findMany(),
            paymentMethods: await req.tenantPrisma!.paymentMethod.findMany(),
            systemSettings: await req.tenantPrisma!.systemSetting.findMany(),
        };

        const json = JSON.stringify(backupData, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=cannabispos-backup.json');
        res.send(json);
    } catch (error) {
        console.error('Backup error', error);
        res.status(500).json({ message: 'Unable to create backup' });
    }
});

app.post('/api/reset', async (req, res) => {
    try {
        await req.tenantPrisma!.$transaction(async (tx) => {
            // Delete dependent records first
            await tx.saleItem.deleteMany({});
            await tx.billItem.deleteMany({});
            await tx.stockMovement.deleteMany({});

            // Then delete the main records
            await tx.sale.deleteMany({});
            await tx.bill.deleteMany({});

            // Optionally reset product `totalSold`
            await tx.product.updateMany({
                data: { totalSold: 0 },
            });
        });

        res.json({ message: 'Transactional data has been reset successfully.' });
    } catch (error) {
        console.error('Data reset error', error);
        res.status(500).json({ message: 'Unable to reset data' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
});
