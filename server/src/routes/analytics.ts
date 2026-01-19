import { Router } from 'express';
import { decimalToNumber, startOfDay, startOfNDaysAgo, formatPercent } from '../utils/helpers';
import { toProductDto } from '../utils/dtos';

const router = Router();

// Profit/Loss detailed report
router.get('/profit-loss', async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const now = new Date();

        let dateStart = new Date(now.getFullYear(), now.getMonth(), 1); // Default: start of month
        let dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        if (startDate && typeof startDate === 'string') {
            dateStart = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string') {
            dateEnd = new Date(endDate);
            dateEnd.setHours(23, 59, 59, 999);
        }

        const [sales, expenses, products] = await Promise.all([
            req.tenantPrisma!.sale.findMany({
                where: { createdAt: { gte: dateStart, lte: dateEnd } },
                include: { items: true },
                orderBy: { createdAt: 'asc' },
            }),
            req.tenantPrisma!.expense.findMany({
                where: { date: { gte: dateStart, lte: dateEnd } },
                orderBy: { date: 'asc' },
            }),
            req.tenantPrisma!.product.findMany(),
        ]);

        const productMap = new Map(products.map(p => [p.id, p]));

        // Group data by period
        const periodData = new Map<string, {
            revenue: number;
            cost: number;
            expenses: number;
            profit: number;
            orders: number;
            items: number;
        }>();

        sales.forEach(sale => {
            let periodKey: string;
            const d = sale.createdAt;

            if (groupBy === 'month') {
                periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (groupBy === 'week') {
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                periodKey = weekStart.toISOString().slice(0, 10);
            } else {
                periodKey = d.toISOString().slice(0, 10);
            }

            const current = periodData.get(periodKey) || {
                revenue: 0, cost: 0, expenses: 0, profit: 0, orders: 0, items: 0
            };

            let saleCost = 0;
            let itemCount = 0;
            sale.items.forEach((item: any) => {
                const product = productMap.get(item.productId);
                if (product) {
                    saleCost += decimalToNumber(product.cost) * item.quantity;
                }
                itemCount += item.quantity;
            });

            current.revenue += decimalToNumber(sale.totalAmount);
            current.cost += saleCost;
            current.orders += 1;
            current.items += itemCount;
            periodData.set(periodKey, current);
        });

        expenses.forEach(expense => {
            let periodKey: string;
            const d = expense.date;

            if (groupBy === 'month') {
                periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (groupBy === 'week') {
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                periodKey = weekStart.toISOString().slice(0, 10);
            } else {
                periodKey = d.toISOString().slice(0, 10);
            }

            const current = periodData.get(periodKey) || {
                revenue: 0, cost: 0, expenses: 0, profit: 0, orders: 0, items: 0
            };
            current.expenses += decimalToNumber(expense.amount);
            periodData.set(periodKey, current);
        });

        // Calculate profit for each period
        const periods = Array.from(periodData.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([period, data]) => ({
                period,
                revenue: data.revenue,
                cost: data.cost,
                grossProfit: data.revenue - data.cost,
                expenses: data.expenses,
                netProfit: data.revenue - data.cost - data.expenses,
                margin: data.revenue > 0 ? formatPercent((data.revenue - data.cost) / data.revenue * 100) : 0,
                orders: data.orders,
                items: data.items,
            }));

        // Summary
        const totals = periods.reduce((acc, p) => ({
            revenue: acc.revenue + p.revenue,
            cost: acc.cost + p.cost,
            grossProfit: acc.grossProfit + p.grossProfit,
            expenses: acc.expenses + p.expenses,
            netProfit: acc.netProfit + p.netProfit,
            orders: acc.orders + p.orders,
            items: acc.items + p.items,
        }), { revenue: 0, cost: 0, grossProfit: 0, expenses: 0, netProfit: 0, orders: 0, items: 0 });

        res.json({
            periods,
            totals: {
                ...totals,
                margin: totals.revenue > 0 ? formatPercent(totals.grossProfit / totals.revenue * 100) : 0,
            },
            dateRange: { start: dateStart.toISOString(), end: dateEnd.toISOString() },
        });
    } catch (error) {
        console.error('Profit/Loss report error:', error);
        res.status(500).json({ message: 'Unable to generate profit/loss report' });
    }
});

// Cost analysis by category/product
router.get('/cost-analysis', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const now = new Date();

        let dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        if (startDate && typeof startDate === 'string') dateStart = new Date(startDate);
        if (endDate && typeof endDate === 'string') {
            dateEnd = new Date(endDate);
            dateEnd.setHours(23, 59, 59, 999);
        }

        const [saleItems, categories] = await Promise.all([
            req.tenantPrisma!.saleItem.findMany({
                where: { sale: { createdAt: { gte: dateStart, lte: dateEnd } } },
                include: { product: { include: { category: true } } },
            }),
            req.tenantPrisma!.category.findMany(),
        ]);

        // By category
        const categoryAnalysis = new Map<string, {
            name: string;
            revenue: number;
            cost: number;
            profit: number;
            quantity: number;
        }>();

        // By product
        const productAnalysis = new Map<string, {
            product: any;
            revenue: number;
            cost: number;
            profit: number;
            quantity: number;
        }>();

        saleItems.forEach(item => {
            const product = item.product;
            if (!product) return;

            const revenue = decimalToNumber(item.total);
            const cost = decimalToNumber(product.cost) * item.quantity;
            const profit = revenue - cost;

            // Category
            const catId = product.category?.id || 'uncategorized';
            const catData = categoryAnalysis.get(catId) || {
                name: product.category?.name || 'ไม่มีหมวดหมู่',
                revenue: 0, cost: 0, profit: 0, quantity: 0
            };
            catData.revenue += revenue;
            catData.cost += cost;
            catData.profit += profit;
            catData.quantity += item.quantity;
            categoryAnalysis.set(catId, catData);

            // Product
            const prodData = productAnalysis.get(product.id) || {
                product: toProductDto(product),
                revenue: 0, cost: 0, profit: 0, quantity: 0
            };
            prodData.revenue += revenue;
            prodData.cost += cost;
            prodData.profit += profit;
            prodData.quantity += item.quantity;
            productAnalysis.set(product.id, prodData);
        });

        const byCategory = Array.from(categoryAnalysis.values())
            .map(c => ({
                ...c,
                margin: c.revenue > 0 ? formatPercent(c.profit / c.revenue * 100) : 0,
            }))
            .sort((a, b) => b.profit - a.profit);

        const byProduct = Array.from(productAnalysis.values())
            .map(p => ({
                ...p,
                margin: p.revenue > 0 ? formatPercent(p.profit / p.revenue * 100) : 0,
            }))
            .sort((a, b) => b.profit - a.profit);

        res.json({
            byCategory,
            byProduct: byProduct.slice(0, 20), // Top 20
            worstMargin: byProduct.filter(p => p.margin < 30).slice(0, 10),
        });
    } catch (error) {
        console.error('Cost analysis error:', error);
        res.status(500).json({ message: 'Unable to generate cost analysis' });
    }
});

// Trend comparison
router.get('/trends', async (req, res) => {
    try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const thisWeekStart = startOfNDaysAgo(6);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setMilliseconds(-1);

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(thisMonthStart);
        lastMonthEnd.setMilliseconds(-1);

        const [todaySales, yesterdaySales, thisWeekSales, lastWeekSales, thisMonthSales, lastMonthSales] = await Promise.all([
            req.tenantPrisma!.sale.aggregate({
                where: { createdAt: { gte: todayStart } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            req.tenantPrisma!.sale.aggregate({
                where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            req.tenantPrisma!.sale.aggregate({
                where: { createdAt: { gte: thisWeekStart } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            req.tenantPrisma!.sale.aggregate({
                where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            req.tenantPrisma!.sale.aggregate({
                where: { createdAt: { gte: thisMonthStart } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            req.tenantPrisma!.sale.aggregate({
                where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
                _sum: { totalAmount: true },
                _count: true,
            }),
        ]);

        const calcChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return formatPercent((current - previous) / previous * 100);
        };

        const todayTotal = Number(todaySales._sum.totalAmount || 0);
        const yesterdayTotal = Number(yesterdaySales._sum.totalAmount || 0);
        const thisWeekTotal = Number(thisWeekSales._sum.totalAmount || 0);
        const lastWeekTotal = Number(lastWeekSales._sum.totalAmount || 0);
        const thisMonthTotal = Number(thisMonthSales._sum.totalAmount || 0);
        const lastMonthTotal = Number(lastMonthSales._sum.totalAmount || 0);

        res.json({
            today: {
                sales: todayTotal,
                orders: todaySales._count,
                change: calcChange(todayTotal, yesterdayTotal),
                changeLabel: 'vs yesterday',
            },
            thisWeek: {
                sales: thisWeekTotal,
                orders: thisWeekSales._count,
                change: calcChange(thisWeekTotal, lastWeekTotal),
                changeLabel: 'vs last week',
            },
            thisMonth: {
                sales: thisMonthTotal,
                orders: thisMonthSales._count,
                change: calcChange(thisMonthTotal, lastMonthTotal),
                changeLabel: 'vs last month',
            },
        });
    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ message: 'Unable to fetch trends' });
    }
});

// Product performance
router.get('/product-performance', async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const daysNum = parseInt(days as string, 10) || 30;
        const startDate = startOfNDaysAgo(daysNum - 1);

        const [saleItems, products] = await Promise.all([
            req.tenantPrisma!.saleItem.findMany({
                where: { sale: { createdAt: { gte: startDate } } },
                include: { product: { include: { category: true } } },
            }),
            req.tenantPrisma!.product.findMany({ include: { category: true } }),
        ]);

        const productStats = new Map<string, {
            product: any;
            quantitySold: number;
            revenue: number;
            cost: number;
            profit: number;
        }>();

        saleItems.forEach(item => {
            if (!item.product) return;
            const stats = productStats.get(item.productId) || {
                product: item.product,
                quantitySold: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
            };
            stats.quantitySold += item.quantity;
            stats.revenue += decimalToNumber(item.total);
            stats.cost += decimalToNumber(item.product.cost) * item.quantity;
            stats.profit = stats.revenue - stats.cost;
            productStats.set(item.productId, stats);
        });

        const allProducts = products.map(p => {
            const stats = productStats.get(p.id);
            const quantitySold = stats?.quantitySold || 0;
            const dailyAvg = quantitySold / daysNum;
            const daysOfStock = dailyAvg > 0 ? p.stock / dailyAvg : 999;
            const turnoverRate = p.stock > 0 ? quantitySold / p.stock : 0;

            return {
                product: toProductDto(p),
                quantitySold,
                revenue: stats?.revenue || 0,
                profit: stats?.profit || 0,
                dailyAvg: Math.round(dailyAvg * 10) / 10,
                daysOfStock: Math.round(daysOfStock),
                turnoverRate: formatPercent(turnoverRate * 100),
                restockRecommendation: daysOfStock < 7 ? Math.ceil(dailyAvg * 30) : 0,
            };
        });

        const bestSellers = allProducts
            .filter(p => p.quantitySold > 0)
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 10);

        const slowMoving = allProducts
            .filter(p => p.product.stock > 0 && p.dailyAvg < 0.5)
            .sort((a, b) => a.dailyAvg - b.dailyAvg)
            .slice(0, 10);

        const needRestock = allProducts
            .filter(p => p.restockRecommendation > 0)
            .sort((a, b) => a.daysOfStock - b.daysOfStock);

        res.json({
            bestSellers,
            slowMoving,
            needRestock,
            summary: {
                totalProducts: products.length,
                activeProducts: allProducts.filter(p => p.quantitySold > 0).length,
                lowStockCount: needRestock.length,
            },
        });
    } catch (error) {
        console.error('Product performance error:', error);
        res.status(500).json({ message: 'Unable to fetch product performance' });
    }
});

// Sales forecast
router.get('/forecast', async (req, res) => {
    try {
        const { days = '7' } = req.query;
        const forecastDays = parseInt(days as string, 10) || 7;

        // Get last 60 days of sales for prediction
        const historicalStart = startOfNDaysAgo(59);
        const sales = await req.tenantPrisma!.sale.findMany({
            where: { createdAt: { gte: historicalStart } },
            select: { createdAt: true, totalAmount: true },
        });

        // Calculate daily averages by day of week
        const dayOfWeekSales: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

        sales.forEach(sale => {
            const dow = sale.createdAt.getDay();
            dayOfWeekSales[dow].push(decimalToNumber(sale.totalAmount));
        });

        const dayOfWeekAvg: Record<number, number> = {};
        Object.keys(dayOfWeekSales).forEach(key => {
            const dayKey = parseInt(key, 10);
            const values = dayOfWeekSales[dayKey];
            dayOfWeekAvg[dayKey] = values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;
        });

        // Generate forecast
        const now = new Date();
        const forecast: { date: string; dayName: string; predicted: number; confidence: number }[] = [];

        for (let i = 1; i <= forecastDays; i++) {
            const futureDate = new Date(now);
            futureDate.setDate(now.getDate() + i);
            const dow = futureDate.getDay();
            const avgForDay = dayOfWeekAvg[dow] || 0;

            // Add some variance based on historical data
            const variance = avgForDay * 0.1;
            const predicted = Math.round(avgForDay);
            const sampleSize = dayOfWeekSales[dow].length;
            const confidence = Math.min(95, 50 + sampleSize * 5);

            forecast.push({
                date: futureDate.toISOString().slice(0, 10),
                dayName: new Intl.DateTimeFormat('th-TH', { weekday: 'long' }).format(futureDate),
                predicted,
                confidence,
            });
        }

        const totalPredicted = forecast.reduce((sum, f) => sum + f.predicted, 0);
        const avgConfidence = forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length;

        res.json({
            forecast,
            summary: {
                totalPredicted,
                avgDaily: Math.round(totalPredicted / forecastDays),
                avgConfidence: Math.round(avgConfidence),
            },
        });
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ message: 'Unable to generate forecast' });
    }
});

export const analyticsRouter = router;
