import { Router } from 'express';
import { toProductDto } from '../utils/dtos';
import { decimalToNumber, startOfDay, startOfNDaysAgo, formatPercent } from '../utils/helpers';

const router = Router();

// Reports overview with BI features
router.get('/overview', async (req, res) => {
    try {
        const [salesWeekQuery, salesInRangeQuery, saleItemsInRangeQuery, productsQuery, ordersTodayQuery, expensesInRangeQuery, systemSettingsQuery] = await Promise.all([
            req.tenantPrisma!.sale.findMany({ where: { createdAt: { gte: startOfNDaysAgo(6) } }, include: { items: true } }), // Temp trigger
            null, null, null, null, null,
            req.tenantPrisma!.systemSetting.findUnique({ where: { key: 'store' } }),
        ]);

        const config = (systemSettingsQuery?.value as any) || {};
        const closingTime = config.dayClosingTime || "00:00";
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);

        // Adjust dates based on closing time
        const adjustDate = (date: Date) => {
            const d = new Date(date);
            d.setHours(closeHour, closeMinute, 0, 0);
            return d;
        };

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calculate "Today" based on config
        let todayStart = new Date(now);
        todayStart.setHours(closeHour, closeMinute, 0, 0);
        if (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
            todayStart.setDate(todayStart.getDate() - 1);
        }

        // Support custom date range from query parameters
        const { startDate, endDate } = req.query;
        let dateRangeStart: Date;
        let dateRangeEnd: Date;

        // If specific start date provided
        if (startDate && typeof startDate === 'string') {
            dateRangeStart = new Date(startDate);
            dateRangeStart.setHours(closeHour, closeMinute, 0, 0); // Start at closing time of that day
        } else {
            // Default to start of this month (adjusted)
            dateRangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRangeStart.setHours(closeHour, closeMinute, 0, 0);
        }

        // If specific end date provided
        if (endDate && typeof endDate === 'string') {
            dateRangeEnd = new Date(endDate);
            // End date should be the closing time of the NEXT day to cover the full 24h of the "End Date"
            // e.g. Range: Jan 1
            // Start: Jan 1 06:00
            // End: Jan 2 06:00 (which is the closing time of the Jan 1 business day)
            dateRangeEnd.setDate(dateRangeEnd.getDate() + 1);
            dateRangeEnd.setHours(closeHour, closeMinute, 0, 0);
        } else {
            // Default end: "End of month" -> Start of next month
            dateRangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            dateRangeEnd.setHours(closeHour, closeMinute, 0, 0);
        }

        const weekStart = startOfNDaysAgo(6);
        weekStart.setHours(closeHour, closeMinute, 0, 0);

        // Re-fetch with correct dates
        const [salesWeek, salesInRange, saleItemsInRange, products, ordersToday, expensesInRange] = await Promise.all([
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: weekStart } },
                include: { items: true },
            }),
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: dateRangeStart, lt: dateRangeEnd } }, // Use lt (less than) for exclusive end
                include: { items: true, user: true },
            }),
            req.tenantPrisma!.saleItem.findMany({
                where: { sale: { createdAt: { gte: dateRangeStart, lt: dateRangeEnd } } },
                include: { product: { include: { category: true } } },
            }),
            req.tenantPrisma!.product.findMany(),
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: todayStart } },
                select: { createdAt: true, totalAmount: true, items: { select: { quantity: true } } },
            }),
            req.tenantPrisma!.expense.findMany({
                where: { date: { gte: dateRangeStart, lt: dateRangeEnd } },
                include: { user: true },
            }),
        ]);

        // Weekly sales data
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

        // Sales by payment
        const salesByPayment = salesInRange.reduce<Record<string, number>>((acc, sale) => {
            const key = sale.paymentMethod.toLowerCase();
            acc[key] = (acc[key] || 0) + decimalToNumber(sale.totalAmount);
            return acc;
        }, {});

        // Category breakdown
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

        // Top products
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

        // Calculate profit
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
            const monthKey = sale.createdAt.toISOString().slice(0, 7);
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

        // Inventory metrics
        const inventoryValue = products.reduce((sum, p) => sum + p.stock * decimalToNumber(p.cost), 0);
        const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
        const outOfStockCount = products.filter((p) => p.stock === 0).length;

        // Orders by hour
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

        // Low stock list
        const lowStockList = products
            .filter((p) => p.stock <= p.minStock)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 10)
            .map(toProductDto);

        // BI Features
        const daysInRange = Math.max(1, Math.ceil((dateRangeEnd.getTime() - dateRangeStart.getTime()) / (1000 * 60 * 60 * 24)));
        const alerts: any[] = [];
        const insights: any[] = [];
        const recommendations: any[] = [];
        const deadStock: any[] = [];

        // Stock alerts
        products.forEach((product) => {
            const productSales = topProductMap.get(product.id);
            const quantitySold = productSales?.quantity || 0;
            const dailyAvg = quantitySold / daysInRange;

            if (dailyAvg > 0) {
                const daysLeft = product.stock / dailyAvg;
                if (daysLeft < 3 && product.stock > 0) {
                    alerts.push({
                        type: 'stock',
                        severity: 'critical',
                        title: `${product.name} ใกล้หมด`,
                        message: `เหลือ ${product.stock} หน่วย หมดใน ${daysLeft.toFixed(1)} วัน`,
                        action: `สั่งเพิ่ม ${Math.ceil(dailyAvg * 30)} หน่วยวันนี้`,
                        productId: product.id,
                    });
                } else if (daysLeft >= 3 && daysLeft < 7) {
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

        // Profit insights
        if (totalProfit > 0 && totalRevenue > 0) {
            const marginPercent = (totalProfit / totalRevenue) * 100;
            if (marginPercent > 55) {
                insights.push({
                    type: 'positive',
                    title: 'อัตรากำไรดี',
                    description: `อัตรากำไร ${marginPercent.toFixed(1)}% อยู่ในเกณฑ์ดี`,
                });
            } else if (marginPercent < 40) {
                insights.push({
                    type: 'negative',
                    title: 'อัตรากำไรต่ำ',
                    description: `อัตรากำไร ${marginPercent.toFixed(1)}% ต่ำกว่าเกณฑ์`,
                });
            }
        }

        // Forecast
        const forecast: any = { next7Days: { total: 0, confidence: 0, daily: [] } };
        if (salesInRange.length > 7) {
            const dailyAvgSales = totalRevenue / daysInRange;
            const dayWeights: Record<number, number> = {
                0: 1.20, 1: 0.85, 2: 0.82, 3: 0.90, 4: 0.95, 5: 1.15, 6: 1.25,
            };
            let forecastTotal = 0;
            const forecastDaily: any[] = [];
            for (let i = 0; i < 7; i++) {
                const futureDate = new Date(now);
                futureDate.setDate(now.getDate() + i + 1);
                const dayOfWeek = futureDate.getDay();
                const projected = dailyAvgSales * (dayWeights[dayOfWeek] || 1.0);
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

        // Financials
        const totalExpenses = expensesInRange.reduce((sum, e) => sum + decimalToNumber(e.amount), 0);
        const netProfit = totalRevenue - totalCost - totalExpenses;

        const transactions: any[] = [];
        salesInRange.forEach((sale) => {
            transactions.push({
                id: sale.id,
                type: 'income',
                date: sale.createdAt.toISOString(),
                details: `ขายสินค้า ${sale.saleNumber}`,
                category: 'ยอดขาย',
                amount: decimalToNumber(sale.totalAmount),
                recorder: sale.user?.fullName || 'ไม่ระบุ',
            });
        });

        const categoryLabels: Record<string, string> = {
            'RENT': 'ค่าเช่า', 'UTILITIES': 'ค่าสาธารณูปโภค', 'SALARY': 'เงินเดือน',
            'SUPPLIES': 'วัสดุสิ้นเปลือง', 'MARKETING': 'การตลาด', 'OTHER': 'อื่นๆ',
        };
        expensesInRange.forEach((expense) => {
            transactions.push({
                id: expense.id,
                type: 'expense',
                date: expense.date.toISOString(),
                details: expense.title,
                category: categoryLabels[expense.category] || expense.category,
                amount: decimalToNumber(expense.amount),
                recorder: expense.user?.fullName || 'ไม่ระบุ',
            });
        });
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
            monthlyBreakdown,
            alerts: alerts.sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2 };
                return (order[a.severity as keyof typeof order] || 2) - (order[b.severity as keyof typeof order] || 2);
            }),
            insights,
            forecast,
            recommendations,
            deadStock: deadStock.slice(0, 10),
            financials: {
                totalIncome: totalRevenue,
                totalExpenses,
                netProfit,
                transactions,
            },
        });
    } catch (error) {
        console.error('Reports error', error);
        res.status(500).json({ message: 'Unable to load reports data' });
    }
});

export const reportsRouter = router;
