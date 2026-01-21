import { Router } from 'express';
import { toSaleDto, toProductDto } from '../utils/dtos';
import { decimalToNumber, startOfDay, startOfNDaysAgo } from '../utils/helpers';

const router = Router();

// Dashboard overview
router.get('/', async (req, res) => {
    try {
        const [products, systemSettings] = await Promise.all([
            req.tenantPrisma!.product.findMany({ include: { category: true } }),
            req.tenantPrisma!.systemSetting.findUnique({ where: { key: 'store' } }), // Use 'store' key
        ]);

        const config = (systemSettings?.value as any) || {};
        const closingTime = config.dayClosingTime || "00:00"; // HH:mm format
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calculate today's start based on closing time
        // If current time < closing time, we are still in the "previous day" business-wise?
        // Usually: Start of Day = Closing Time of previous day.
        // Example: Closing time 06:00.
        // If now is 05:00 (Tuesday), Today Start was 06:00 (Monday).
        // If now is 07:00 (Tuesday), Today Start is 06:00 (Tuesday).

        let todayStart = new Date(now);
        todayStart.setHours(closeHour, closeMinute, 0, 0);

        if (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
            todayStart.setDate(todayStart.getDate() - 1);
        }

        const weekStart = startOfNDaysAgo(6);
        weekStart.setHours(closeHour, closeMinute, 0, 0); // Align week start too

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(closeHour, closeMinute, 0, 0); // Align month start? Or just keep 1st? Maybe keep 1st but time aligned.

        const [todaySalesRecords, salesItemsToday, recentSales, salesMonth, saleItemsMonth] = await Promise.all([
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

export const dashboardRouter = router;
