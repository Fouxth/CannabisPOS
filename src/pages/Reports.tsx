import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    AlertTriangle,
    Calendar,
    Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MonthPicker } from '@/components/MonthPicker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

import { useAuth } from '@/hooks/useAuth';

export default function Reports() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

    const dateParams = useMemo(() => {
        const now = new Date();
        if (dateRange === 'today') {
            return { startDate: startOfDay(now).toISOString(), endDate: endOfDay(now).toISOString() };
        } else if (dateRange === 'week') {
            return { startDate: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), endDate: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
        } else if (dateRange === 'month') {
            return { startDate: startOfMonth(selectedMonth).toISOString(), endDate: endOfMonth(selectedMonth).toISOString() };
        } else {
            return { startDate: startOfYear(now).toISOString(), endDate: endOfYear(now).toISOString() };
        }
    }, [dateRange, selectedMonth]);

    const { data: reportsData, isLoading } = useQuery({
        queryKey: ['reports', user?.storeId, dateRange, selectedMonth],
        queryFn: () => api.getReportsOverview(dateParams),
        enabled: !!user?.storeId,
    });

    // Calculate financial metrics
    const financialMetrics = useMemo(() => {
        if (!reportsData) return null;

        const totalIncome = reportsData.financials?.totalIncome || reportsData.totalRevenue || 0;
        const totalExpenses = reportsData.financials?.totalExpenses || 0;
        const totalCost = reportsData.totalCost || 0;
        const netProfit = totalIncome - totalCost - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            totalCost,
            netProfit,
            transactions: reportsData.financials?.transactions || [],
        };
    }, [reportsData]);

    // AI insights engine — enhanced rule-based analysis
    const aiInsights = useMemo(() => {
        if (!reportsData) return null;

        const profitMargin = reportsData.profitMargin || 0;
        const totalRevenue = reportsData.totalRevenue || 0;
        const totalCost = reportsData.totalCost || 0;
        const totalExpenses = reportsData.financials?.totalExpenses || 0;
        const totalIncome = reportsData.financials?.totalIncome || totalRevenue;
        const totalTransactions = reportsData.totalTransactions || reportsData.totalBills || 0;
        const lowStockCount = reportsData.inventory?.lowStockCount || 0;
        const totalProducts = reportsData.inventory?.totalProducts || 0;
        const topProducts = reportsData.topProducts || [];

        const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
        const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        const topProductRevShare = topProducts.length > 0 && totalRevenue > 0
            ? (topProducts[0].revenue / totalRevenue) * 100 : 0;
        const costRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

        // Multi-factor score (0-100)
        let score = 0;
        // Profit margin (0-40 pts)
        if (profitMargin >= 40) score += 40;
        else if (profitMargin >= 30) score += 32;
        else if (profitMargin >= 20) score += 22;
        else if (profitMargin >= 10) score += 10;
        // Stock health (0-20 pts)
        if (lowStockCount === 0) score += 20;
        else if (lowStockCount <= 2) score += 12;
        else if (lowStockCount <= 5) score += 6;
        // Sales activity (0-20 pts)
        if (totalTransactions > 100) score += 20;
        else if (totalTransactions > 50) score += 15;
        else if (totalTransactions > 20) score += 10;
        else if (totalTransactions > 0) score += 5;
        // Expense control (0-20 pts)
        if (expenseRatio < 10) score += 20;
        else if (expenseRatio < 20) score += 14;
        else if (expenseRatio < 35) score += 8;

        const scoreLabel = score >= 80 ? { text: 'ยอดเยี่ยม', color: 'text-green-500', border: 'border-green-500' }
            : score >= 60 ? { text: 'ดี', color: 'text-blue-500', border: 'border-blue-500' }
            : score >= 40 ? { text: 'พอใช้', color: 'text-yellow-500', border: 'border-yellow-500' }
            : { text: 'ต้องปรับปรุง', color: 'text-red-500', border: 'border-red-500' };

        // Build recommendations — sorted by priority
        type Rec = { priority: 'critical' | 'warning' | 'info' | 'success'; icon: string; title: string; detail: string; action: string; color: string };
        const recs: Rec[] = [];

        if (totalRevenue === 0) {
            recs.push({ priority: 'critical', icon: '🚨', color: 'red',
                title: 'ยังไม่มียอดขายในช่วงนี้',
                detail: 'ยังไม่มีการขายในช่วงเวลาที่เลือก',
                action: 'ลองเปลี่ยนช่วงเวลา หรือตรวจสอบว่า POS ทำงานปกติ' });
        }

        if (profitMargin < 10 && totalRevenue > 0) {
            recs.push({ priority: 'critical', icon: '📉', color: 'red',
                title: `อัตรากำไรวิกฤต (${profitMargin.toFixed(1)}%)`,
                detail: 'อัตรากำไรต่ำมาก อาจกำลังประสบภาวะขาดทุน',
                action: 'ปรับราคาขึ้น 15-20% หรือหาซัพพลายเออร์ที่ถูกกว่าทันที' });
        } else if (profitMargin >= 10 && profitMargin < 20 && totalRevenue > 0) {
            recs.push({ priority: 'warning', icon: '⚠️', color: 'orange',
                title: `กำไรต่ำกว่าเกณฑ์ (${profitMargin.toFixed(1)}%)`,
                detail: 'เป้าหมายควรอยู่ที่ 25-35% สำหรับร้านค้าปลีก',
                action: 'พิจารณาปรับราคาขึ้น 8-12% หรือลดต้นทุนสินค้า' });
        }

        if (lowStockCount > 5) {
            recs.push({ priority: 'critical', icon: '📦', color: 'red',
                title: `สินค้าใกล้หมด ${lowStockCount} รายการ`,
                detail: 'มีสินค้าจำนวนมากที่ใกล้หมด เสี่ยงเสียยอดขาย',
                action: 'สั่งซื้อสินค้าด่วน ก่อนที่จะหมดและเสียลูกค้า' });
        } else if (lowStockCount > 0) {
            recs.push({ priority: 'warning', icon: '⚠️', color: 'orange',
                title: `สินค้าใกล้หมด ${lowStockCount} รายการ`,
                detail: 'ควรเติมสต็อกก่อนจะขาด',
                action: 'ไปที่หน้าสต็อกและสั่งซื้อสินค้าที่ใกล้หมด' });
        }

        if (expenseRatio > 35 && totalIncome > 0) {
            recs.push({ priority: 'warning', icon: '💸', color: 'orange',
                title: `ค่าใช้จ่ายสูงมาก (${expenseRatio.toFixed(1)}% ของรายได้)`,
                detail: 'ค่าใช้จ่ายกินกำไรมากเกินไป ควรทบทวน',
                action: 'ตรวจสอบรายการค่าใช้จ่ายในหน้าค่าใช้จ่ายและลดที่ไม่จำเป็น' });
        } else if (expenseRatio > 20 && totalIncome > 0) {
            recs.push({ priority: 'info', icon: '🔍', color: 'blue',
                title: `ค่าใช้จ่ายควรระวัง (${expenseRatio.toFixed(1)}%)`,
                detail: 'ค่าใช้จ่ายเริ่มสูง ควรติดตามอย่างใกล้ชิด',
                action: 'ทบทวนค่าใช้จ่ายรายเดือนและหาโอกาสลดต้นทุน' });
        }

        if (topProductRevShare > 70 && topProducts.length > 1) {
            recs.push({ priority: 'info', icon: '🎯', color: 'blue',
                title: `ยอดขายพึ่งพาสินค้าชิ้นเดียวสูง (${topProductRevShare.toFixed(0)}%)`,
                detail: `"${topProducts[0]?.product?.name}" สร้างรายได้เกิน 70% ของยอดรวม มีความเสี่ยง`,
                action: 'โปรโมทสินค้าอื่นๆ เพื่อกระจายความเสี่ยง' });
        }

        if (avgBasket > 0 && avgBasket < 300) {
            recs.push({ priority: 'info', icon: '🛒', color: 'blue',
                title: `ค่าเฉลี่ยต่อบิลต่ำ (฿${formatCurrency(avgBasket)})`,
                detail: 'ลูกค้าซื้อน้อยต่อครั้ง มีโอกาสเพิ่มยอดขายต่อบิล',
                action: 'ใช้โปรโมชัน "ซื้อ X ลด Y" หรือแนะนำสินค้าเสริม ณ จุดชำระเงิน' });
        } else if (avgBasket >= 300 && avgBasket < 800) {
            recs.push({ priority: 'success', icon: '🛒', color: 'green',
                title: `ค่าเฉลี่ยต่อบิลอยู่ในเกณฑ์ดี (฿${formatCurrency(avgBasket)})`,
                detail: 'ลูกค้าซื้อในระดับที่ดี ลองผลักดันให้สูงขึ้นอีก',
                action: 'ทดลองใช้ Bundle Deals เพื่อเพิ่มมูลค่าต่อบิล' });
        }

        if (profitMargin >= 35 && totalRevenue > 0) {
            recs.push({ priority: 'success', icon: '🚀', color: 'purple',
                title: `กำไรดีมาก — ถึงเวลาขยาย! (${profitMargin.toFixed(1)}%)`,
                detail: 'Margin สูงมาก มีกำไรเพียงพอสำหรับการลงทุนเพิ่ม',
                action: 'ลงทุนในสินค้าใหม่ ขยาย catalog หรือเพิ่มงบการตลาด' });
        } else if (profitMargin >= 20 && lowStockCount === 0 && totalRevenue > 0) {
            recs.push({ priority: 'success', icon: '🎉', color: 'green',
                title: 'ร้านอยู่ในสถานะดี!',
                detail: `กำไรดี (${profitMargin.toFixed(1)}%) สต็อกเพียงพอ ไม่มีปัญหาเร่งด่วน`,
                action: 'พิจารณาเพิ่มสินค้าใหม่หรือทำโปรโมชันเพื่อเพิ่มยอดขาย' });
        }

        if (topProducts.length > 0 && totalRevenue > 0) {
            recs.push({ priority: 'info', icon: '🏆', color: 'purple',
                title: `ดาวเด่น: ${topProducts[0]?.product?.name || 'ไม่มีข้อมูล'}`,
                detail: `ขายได้ ${topProducts[0]?.quantity || 0} หน่วย รายได้ ฿${formatCurrency(topProducts[0]?.revenue || 0)} (${topProductRevShare.toFixed(0)}% ของยอดรวม)`,
                action: 'ดูแลสต็อกสินค้านี้อย่างใกล้ชิดเพื่อไม่ให้พลาดยอดขาย' });
        }

        // Sort: critical → warning → success → info
        const order = { critical: 0, warning: 1, success: 2, info: 3 };
        recs.sort((a, b) => order[a.priority] - order[b.priority]);

        // Dynamic Do's & Don'ts
        const dos = [
            { icon: '📦', text: 'ตรวจสอบสต็อกทุกวัน' },
            { icon: '📈', text: `รักษา Profit Margin ให้สูงกว่า 25% (ปัจจุบัน ${profitMargin.toFixed(1)}%)` },
            { icon: '📊', text: 'ดูรายงานสรุปทุกสิ้นเดือน' },
            ...(topProducts.length > 0 ? [{ icon: '🏆', text: `โปรโมทสินค้าขายดี: ${topProducts[0]?.product?.name || ''}` }] : []),
            ...(totalTransactions > 0 ? [{ icon: '🛒', text: `เป้าหมายค่าเฉลี่ยต่อบิลให้สูงกว่า ฿${formatCurrency(Math.max(avgBasket * 1.2, 500))}` }] : []),
        ];

        const donts = [
            { icon: '⚠️', text: 'ปล่อยให้สินค้าหมดสต็อก' },
            { icon: '💸', text: `ปล่อยให้ค่าใช้จ่ายเกิน 20% ของรายได้ (ปัจจุบัน ${expenseRatio.toFixed(1)}%)` },
            { icon: '📉', text: 'ตั้งราคาต่ำจนกำไรหาย' },
            { icon: '🚫', text: 'ละเลยสินค้าที่ขายไม่ดีโดยไม่วิเคราะห์ต้นทุน' },
        ];

        // --- 1. ABC Inventory Classification ---
        const sortedProductsForABC = [...topProducts].sort((a, b) => b.revenue - a.revenue);
        let cumulativeRevenue = 0;
        const abcCategorized = sortedProductsForABC.map((p) => {
            cumulativeRevenue += p.revenue;
            const percentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
            let abcClass: 'A' | 'B' | 'C' = 'C';
            if (percentage <= 80) abcClass = 'A';
            else if (percentage <= 95) abcClass = 'B';
            return {
                productId: p.product.id,
                abcClass,
            };
        });
        const abcMap = new Map(abcCategorized.map((item) => [item.productId, item.abcClass]));

        // --- 2. Sales Velocity & Runway ---
        let daysInPeriod = 30;
        if (dateRange === 'today') daysInPeriod = 1;
        else if (dateRange === 'week') daysInPeriod = 7;
        else if (dateRange === 'year') daysInPeriod = 365;

        const topProductsWithMetrics = topProducts.map((p) => {
            const dailyVelocity = p.quantity / daysInPeriod;
            const stockRunway = dailyVelocity > 0 ? p.product.stock / dailyVelocity : 999;
            const abcClass = abcMap.get(p.product.id) || 'C';
            return {
                ...p,
                dailyVelocity,
                stockRunway,
                abcClass,
            };
        });

        // --- 3. Linear Regression Sales Forecasting ---
        const monthlyBreakdown = reportsData.monthlyBreakdown || [];
        let forecastNextMonth = { revenue: totalRevenue * 1.05, profit: reportsData.totalProfit * 1.05, growthRate: 5 };
        if (monthlyBreakdown.length >= 2) {
            const n = monthlyBreakdown.length;
            let sumX = 0, sumY_rev = 0, sumY_prof = 0;
            let sumXX = 0, sumXY_rev = 0, sumXY_prof = 0;
            for (let i = 0; i < n; i++) {
                sumX += i;
                sumXX += i * i;
                sumY_rev += monthlyBreakdown[i].revenue;
                sumXY_rev += i * monthlyBreakdown[i].revenue;
                sumY_prof += monthlyBreakdown[i].profit;
                sumXY_prof += i * monthlyBreakdown[i].profit;
            }
            const m_rev = (n * sumXY_rev - sumX * sumY_rev) / (n * sumXX - sumX * sumX);
            const c_rev = (sumY_rev - m_rev * sumX) / n;

            const m_prof = (n * sumXY_prof - sumX * sumY_prof) / (n * sumXX - sumX * sumX);
            const c_prof = (sumY_prof - m_prof * sumX) / n;

            const projectedRev = Math.max(0, m_rev * n + c_rev);
            const projectedProf = Math.max(0, m_prof * n + c_prof);
            const lastMonthRev = monthlyBreakdown[n - 1].revenue;
            const growthRate = lastMonthRev > 0 ? ((projectedRev - lastMonthRev) / lastMonthRev) * 100 : 0;

            forecastNextMonth = {
                revenue: projectedRev,
                profit: projectedProf,
                growthRate,
            };
        }

        // --- 4. Break-Even Point (BEP) Calculator ---
        const cogsRatio = totalRevenue > 0 ? totalCost / totalRevenue : 0;
        const contributionMarginRatio = 1 - cogsRatio;
        const bepMonthly = contributionMarginRatio > 0 ? totalExpenses / contributionMarginRatio : 0;
        const bepStatus = totalRevenue >= bepMonthly
            ? { isCovered: true, diff: totalRevenue - bepMonthly }
            : { isCovered: false, diff: bepMonthly - totalRevenue };

        // --- 5. Peak Hours & Traffic Analytics ---
        const ordersByHour = reportsData.ordersByHour || [];
        let peakHour = { hour: 17, sales: 0 };
        ordersByHour.forEach((h) => {
            if (h.sales > peakHour.sales) {
                peakHour = { hour: h.hour, sales: h.sales };
            }
        });

        const weeklySales = reportsData.weeklySales || [];
        let peakDay = { day: 'วันศุกร์', sales: 0 };
        weeklySales.forEach((d) => {
            if (d.sales > peakDay.sales) {
                peakDay = { day: d.day, sales: d.sales };
            }
        });

        // --- 6. Dead Stock & Low Stock Advice ---
        const deadStockList = reportsData.deadStock || [];
        const deadStockCapitalTied = deadStockList.reduce((sum, item) => sum + (item.valueAtCost || 0), 0);
        const deadStockRecoverable = deadStockList.reduce((sum, item) => sum + ((item.valueAtCost || 0) * (1 - (item.suggestedDiscount || 20) / 100)), 0);

        const lowStockProductsList = reportsData.lowStockProducts || [];
        const reorderAdvice = lowStockProductsList.map((prod) => {
            const foundTop = topProducts.find((tp) => tp.product.id === prod.id);
            const dailyVel = foundTop ? foundTop.quantity / daysInPeriod : 0.5;
            const rop = Math.ceil(dailyVel * 3) + 5;
            const recommendedQty = Math.ceil(dailyVel * 30);
            return {
                id: prod.id,
                name: prod.name,
                currentStock: prod.stock,
                rop,
                recommendedQty,
            };
        });

        return {
            score,
            scoreLabel,
            recs,
            expenseRatio,
            avgBasket,
            topProductRevShare,
            totalTransactions,
            dos,
            donts,
            topProductsWithMetrics,
            forecastNextMonth,
            bepMonthly,
            bepStatus,
            peakHour,
            peakDay,
            deadStockCapitalTied,
            deadStockRecoverable,
            deadStockList,
            reorderAdvice
        };
    }, [reportsData, dateRange]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    if (!reportsData) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">ไม่สามารถโหลดข้อมูลได้</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">รายงานการขายและประสิทธิภาพธุรกิจ</h1>
                    <p className="text-muted-foreground">ภาพรวมและข้อมูลเชิงลึกทางธุรกิจ</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {dateRange === 'month' && (
                        <MonthPicker currentDate={selectedMonth} onDateChange={setSelectedMonth} />
                    )}
                    <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as any)} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            {/* <TabsTrigger value="today">วันนี้</TabsTrigger>
                            <TabsTrigger value="week">สัปดาห์</TabsTrigger> */}
                            <TabsTrigger value="month">เดือน</TabsTrigger>
                            <TabsTrigger value="year">ปี</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <Tabs defaultValue="ai" className="space-y-6">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        AI Advisor
                    </TabsTrigger>
                    <TabsTrigger value="business">Business Insights</TabsTrigger>
                    <TabsTrigger value="financial">Financial Statement</TabsTrigger>
                </TabsList>

                {/* AI Advisor Tab */}
                <TabsContent value="ai" className="space-y-6">
                    {/* AI Header */}
                    <Card className="glass border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl animate-pulse">🤖</div>
                                <div>
                                    <h2 className="text-xl font-bold font-display">AI Shop Advisor</h2>
                                    <p className="text-muted-foreground">วิเคราะห์ข้อมูลร้านจริงและให้คำแนะนำเฉพาะเจาะจงสำหรับธุรกิจของคุณ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Alerts */}
                    {reportsData.alerts && reportsData.alerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                การแจ้งเตือนระบบ
                            </h3>
                            <div className="grid gap-3">
                                {reportsData.alerts.slice(0, 3).map((alert, index) => (
                                    <Alert
                                        key={index}
                                        variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                                        className="glass animate-slide-up"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>{alert.title}</AlertTitle>
                                        <AlertDescription>{alert.message}</AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Score + Quick Stats */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Multi-factor Performance Score */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">📊</span>
                                    คะแนนสุขภาพธุรกิจ
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">คำนวณจาก: กำไร + สต็อก + ยอดขาย + ค่าใช้จ่าย</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center py-4">
                                    <div className="relative w-36 h-36">
                                        <div className={`absolute inset-0 rounded-full border-[10px] ${aiInsights?.scoreLabel.border || 'border-gray-400'}`}></div>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className={`text-4xl font-bold ${aiInsights?.scoreLabel.color || ''}`}>{aiInsights?.score ?? 0}</span>
                                            <span className="text-xs text-muted-foreground">/100</span>
                                        </div>
                                    </div>
                                </div>
                                <p className={`text-center text-base font-semibold ${aiInsights?.scoreLabel.color || ''}`}>
                                    {aiInsights?.scoreLabel.text}
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <span>📈</span> กำไร: {reportsData.profitMargin.toFixed(1)}%
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>📦</span> สต็อกต่ำ: {reportsData.inventory.lowStockCount} รายการ
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>🧾</span> บิล: {aiInsights?.totalTransactions ?? 0} ใบ
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>💸</span> ค่าใช้จ่าย: {(aiInsights?.expenseRatio ?? 0).toFixed(1)}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Key Metrics */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">📈</span>
                                    ตัวชี้วัดสำคัญ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="text-sm">อัตรากำไรขั้นต้น</span>
                                    <Badge className={reportsData.profitMargin >= 25 ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500' : reportsData.profitMargin >= 15 ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500' : 'bg-red-500/20 text-red-700 border-red-500'} variant="outline">
                                        {reportsData.profitMargin.toFixed(1)}%
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <span className="text-sm">ค่าเฉลี่ยต่อบิล</span>
                                    <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500">
                                        ฿{formatCurrency(aiInsights?.avgBasket ?? 0)}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <span className="text-sm">สต็อกสินค้าทั้งหมด</span>
                                    <Badge variant="outline" className="bg-purple-500/20 text-purple-700 border-purple-500">
                                        {reportsData.inventory.totalProducts} รายการ
                                    </Badge>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg border ${(aiInsights?.expenseRatio ?? 0) > 25 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                                    <span className="text-sm">สัดส่วนค่าใช้จ่าย</span>
                                    <Badge variant="outline" className={(aiInsights?.expenseRatio ?? 0) > 25 ? 'bg-orange-500/20 text-orange-700 border-orange-500' : 'bg-green-500/20 text-green-700 border-green-500'}>
                                        {(aiInsights?.expenseRatio ?? 0).toFixed(1)}%
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Advanced Retail Science Tools */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Linear Regression Forecast Card */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">🔮</span>
                                    AI คาดการณ์แนวโน้มเดือนหน้า
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">คำนวณแบบสถิติถดถอยเชิงเส้น (Linear Regression)</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-background border">
                                        <p className="text-xs text-muted-foreground">คาดการณ์ยอดขาย</p>
                                        <p className="text-lg font-bold text-primary mt-1">฿{formatCurrency(aiInsights?.forecastNextMonth.revenue ?? 0)}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border">
                                        <p className="text-xs text-muted-foreground">คาดการณ์กำไรสุทธิ</p>
                                        <p className="text-lg font-bold text-emerald-600 mt-1">฿{formatCurrency(aiInsights?.forecastNextMonth.profit ?? 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                                    <span>📊</span>
                                    <span>
                                        แนวโน้มการเติบโตคาดการณ์:{" "}
                                        <span className={`font-bold ${aiInsights && aiInsights.forecastNextMonth.growthRate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {aiInsights && aiInsights.forecastNextMonth.growthRate >= 0 ? '+' : ''}
                                            {aiInsights?.forecastNextMonth.growthRate.toFixed(1)}%
                                        </span>{" "}
                                        เมื่อเทียบกับเดือนปัจจุบัน
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Break-Even Calculator Card */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">⚖️</span>
                                    วิเคราะห์จุดคุ้มทุน (Break-Even)
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">เปรียบเทียบระหว่างรายได้คงที่กับค่าใช้จ่ายและต้นทุนแปรผัน</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center p-2 rounded bg-background border text-sm">
                                    <span className="text-muted-foreground">จุดคุ้มทุนรายเดือน:</span>
                                    <span className="font-semibold">฿{formatCurrency(aiInsights?.bepMonthly ?? 0)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded bg-background border text-sm">
                                    <span className="text-muted-foreground">ยอดขายจริงปัจจุบัน:</span>
                                    <span className="font-semibold text-primary">฿{formatCurrency(reportsData.totalRevenue)}</span>
                                </div>
                                {aiInsights?.bepStatus.isCovered ? (
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
                                        🎉 ร้านดำเนินกิจการพ้นจุดคุ้มทุนแล้ว! ยอดขายเกินเป้าขั้นต่ำมา ฿{formatCurrency(aiInsights.bepStatus.diff)}
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-medium">
                                        ⚠️ ยังไม่ถึงจุดคุ้มทุน! ต้องการยอดขายเพิ่มอีก ฿{formatCurrency(aiInsights?.bepStatus.diff ?? 0)} เพื่อให้พ้นจุดขาดทุน
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Smart Inventory & Capital Recovery Cards */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Reorder Advisor */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">🔔</span>
                                    จุดสั่งซื้อสต็อกที่เหมาะสม (Reorder Points)
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">คำนวณจากความเร็วการขายรายวัน (Sales Velocity) เพื่อเลี่ยงสินค้าขาดสต็อก</p>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[220px] overflow-y-auto">
                                {aiInsights?.reorderAdvice && aiInsights.reorderAdvice.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">ไม่มีสินค้าแจ้งเตือนสต็อกต่ำ</p>
                                ) : (
                                    aiInsights?.reorderAdvice.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-background border text-xs">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground">สต็อกปัจจุบัน: {item.currentStock} | จุดวิกฤต (ROP): {item.rop} ชิ้น</p>
                                            </div>
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                สั่งเพิ่ม: +{item.recommendedQty} ชิ้น
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Dead Stock Recovery */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">💰</span>
                                    การกู้คืนทุนสินค้าค้างสต็อก (Dead Stock)
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">สินค้าไม่มีการเคลื่อนไหวเกิน 30 วัน ดึงทุนจมกลับมาเป็นกระแสเงินสด</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-2 rounded bg-background border text-center">
                                        <p className="text-muted-foreground">เงินทุนจมทั้งหมด</p>
                                        <p className="text-base font-bold text-red-600 mt-1">฿{formatCurrency(aiInsights?.deadStockCapitalTied ?? 0)}</p>
                                    </div>
                                    <div className="p-2 rounded bg-background border text-center">
                                        <p className="text-muted-foreground">คาดการณ์เงินสดดึงกลับได้</p>
                                        <p className="text-base font-bold text-emerald-600 mt-1">฿{formatCurrency(aiInsights?.deadStockRecoverable ?? 0)}</p>
                                    </div>
                                </div>
                                {aiInsights && aiInsights.deadStockList.length > 0 ? (
                                    <div className="p-3 rounded bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs">
                                        💡 แนะนำทำโปรโมชันลดราคาเฉลี่ย {Math.ceil(aiInsights.deadStockList[0]?.suggestedDiscount ?? 20)}% เพื่อกู้คืนกระแสเงินสดจากสินค้า <b>{aiInsights.deadStockList[0]?.productName}</b>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-2">ยินดีด้วย! ไม่มีเงินจมจากสินค้าค้างสต็อก</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Staffing & Traffic Optimizer */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-xl">👥</span>
                                การจัดการพนักงานและช่วงเวลาขายดี (Traffic Advisor)
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">วิเคราะห์ช่วงเวลาที่ลูกค้าใช้บริการมากที่สุด เพื่อประหยัดต้นทุนแรงงาน</p>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 text-xs">
                            <div className="p-3 rounded-lg bg-background border space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">⏰</span>
                                    <span className="font-semibold">ชั่วโมงขายดีที่สุด: ช่วง {aiInsights?.peakHour.hour}:00 น.</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    ควรเพิ่มพนักงานจัดเตรียมหรือพนักงานขายหน้าร้านในช่วงชั่วโมงนี้เพื่อเร่งความเร็วการชำระเงินและบริการลูกค้า ป้องกันการรอคิวบิลค้าง
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-background border space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📅</span>
                                    <span className="font-semibold">วันขายดีที่สุดในสัปดาห์: {aiInsights?.peakDay.day}</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    แนะนำให้จัดโปรแกรมพนักงานเสริมเพิ่มขึ้นเฉพาะในวันดังกล่าว และตรวจเช็คสต็อกสินค้าให้พร้อมขายก่อนเริ่มวันเพื่อรองรับ Traffic สูงสุด
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Smart Recommendations */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-xl">💡</span>
                                คำแนะนำอัจฉริยะ
                                {aiInsights && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        {aiInsights.recs.length} รายการ
                                    </Badge>
                                )}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">เรียงลำดับตามความสำคัญ — วิเคราะห์จากข้อมูลร้านจริง</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {aiInsights?.recs.map((rec, i) => {
                                const colorMap: Record<string, { bg: string; border: string; badgeCls: string; textCls: string; badgeLabel: string }> = {
                                    red:    { bg: 'from-red-500/20 to-red-500/5',     border: 'border-red-500/30',    badgeCls: 'bg-red-500/20 text-red-700 border-red-500',       textCls: 'text-red-600',    badgeLabel: 'วิกฤต' },
                                    orange: { bg: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30', badgeCls: 'bg-orange-500/20 text-orange-700 border-orange-500', textCls: 'text-orange-600', badgeLabel: 'สำคัญ' },
                                    green:  { bg: 'from-green-500/20 to-green-500/5',  border: 'border-green-500/30',  badgeCls: 'bg-green-500/20 text-green-700 border-green-500',   textCls: 'text-green-600',  badgeLabel: 'ดี' },
                                    blue:   { bg: 'from-blue-500/20 to-blue-500/5',    border: 'border-blue-500/30',   badgeCls: 'bg-blue-500/20 text-blue-700 border-blue-500',      textCls: 'text-blue-600',   badgeLabel: 'แนะนำ' },
                                    purple: { bg: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30', badgeCls: 'bg-purple-500/20 text-purple-700 border-purple-500', textCls: 'text-purple-600', badgeLabel: 'ข้อมูล' },
                                };
                                const c = colorMap[rec.color] ?? colorMap.blue;
                                return (
                                    <div key={i} className={`p-4 rounded-xl bg-gradient-to-r ${c.bg} border ${c.border} animate-slide-up`} style={{ animationDelay: `${i * 80}ms` }}>
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{rec.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge variant="outline" className={c.badgeCls}>{c.badgeLabel}</Badge>
                                                </div>
                                                <h4 className="font-semibold text-sm">{rec.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                                                <p className={`text-xs font-medium ${c.textCls} mt-2`}>✅ แนะนำ: {rec.action}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Dynamic Do's & Don'ts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="glass border-green-500/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                    <span className="text-xl">✅</span>
                                    สิ่งที่ควรทำ (เฉพาะร้านคุณ)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {aiInsights?.dos.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-green-500/10">
                                        <span>{item.icon}</span>
                                        <span className="text-sm">{item.text}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="glass border-red-500/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <span className="text-xl">❌</span>
                                    สิ่งที่ไม่ควรทำ (ข้อมูลจริง)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {aiInsights?.donts.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-red-500/10">
                                        <span>{item.icon}</span>
                                        <span className="text-sm">{item.text}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="business" className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">
                                    ฿{formatCurrency(reportsData.totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    จากบิลทั้งหมด {reportsData.monthlyBreakdown?.reduce((sum, m) => sum + m.orders, 0) || 0} ใบ
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ต้นทุนรวม</CardTitle>
                                <Package className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    ฿{formatCurrency(reportsData.totalCost)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    ต้นทุนสินค้าที่ขาย (COGS)
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">กำไรขั้นต้น</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    ฿{formatCurrency(reportsData.totalProfit)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Margin {reportsData.profitMargin.toFixed(1)}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">สินค้าในสต็อก</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportsData.inventory.totalProducts}</div>
                                <p className="text-xs text-destructive mt-1">
                                    ใกล้หมด {reportsData.inventory.lowStockCount} รายการ
                                </p>
                            </CardContent>
                        </Card>
                    </div>



                    {/* Charts Section */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Sales Trend */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle>แนวโน้มยอดขายและกำไร</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={reportsData.monthlyBreakdown || []}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.35)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                        <YAxis axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(var(--card), 0.8)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid hsl(var(--border) / 0.5)',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                            }}
                                            formatter={(value) => `฿${formatCurrency(Number(value))}`}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" name="ยอดขาย" strokeWidth={2.5} fill="url(#revenueGradient)" activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }} />
                                        <Area type="monotone" dataKey="profit" stroke="#3b82f6" name="กำไร" strokeWidth={2.5} fill="url(#profitGradient)" activeDot={{ r: 5, strokeWidth: 0, fill: "#3b82f6" }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Category Breakdown */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle>สัดส่วนยอดขายตามหมวดหมู่</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={reportsData.categoryBreakdown || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {(reportsData.categoryBreakdown || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(var(--card), 0.8)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid hsl(var(--border) / 0.5)',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                            }}
                                            formatter={(value) => `฿${formatCurrency(Number(value))}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Products */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>สินค้าขายดี</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>สินค้า</TableHead>
                                        <TableHead className="text-center">กลุ่มสินค้า (ABC)</TableHead>
                                        <TableHead className="text-right">ความเร็วขาย (ต่อวัน)</TableHead>
                                        <TableHead className="text-right">ระยะเวลาขายหมด (Runway)</TableHead>
                                        <TableHead className="text-right">จำนวนขายรวม</TableHead>
                                        <TableHead className="text-right">รายได้รวม</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(aiInsights?.topProductsWithMetrics || []).slice(0, 5).map((item, index) => {
                                        const runwayLabel = item.stockRunway >= 999 
                                            ? 'ไม่จำกัด' 
                                            : item.stockRunway <= 3 
                                            ? `วิกฤต (${Math.ceil(item.stockRunway)} วัน)` 
                                            : `${Math.ceil(item.stockRunway)} วัน`;
                                        const abcColorMap: Record<'A' | 'B' | 'C', string> = {
                                            A: 'bg-yellow-500/20 text-yellow-700 border-yellow-500 font-bold',
                                            B: 'bg-blue-500/20 text-blue-700 border-blue-500',
                                            C: 'bg-gray-500/20 text-gray-700 border-gray-500'
                                        };
                                        return (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.product.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={abcColorMap[item.abcClass]}>
                                                        Class {item.abcClass}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{item.dailyVelocity.toFixed(1)} ชิ้น/วัน</TableCell>
                                                <TableCell className={`text-right ${item.stockRunway <= 3 ? 'text-red-500 font-semibold' : ''}`}>
                                                    {runwayLabel}
                                                </TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right text-emerald-600">
                                                    ฿{formatCurrency(item.revenue)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {reportsData.recommendations && reportsData.recommendations.length > 0 && (
                        <Card className="glass border-blue-200 bg-blue-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    คำแนะนำเชิงรุก
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {reportsData.recommendations.slice(0, 3).map((rec, index) => (
                                    <div key={index} className="p-4 bg-white rounded-lg border">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant={rec.priority === 'critical' ? 'destructive' : 'default'}>
                                                        {rec.priority}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">{rec.category}</span>
                                                </div>
                                                <h4 className="font-semibold">{rec.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                                                <p className="text-sm font-medium text-blue-600 mt-2">
                                                    💡 {rec.action}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Financial Statement Tab */}
                <TabsContent value="financial" className="space-y-6">
                    {/* Financial Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">รายรับเดือนนี้</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">
                                    ฿{formatCurrency(financialMetrics?.totalIncome || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">จากยอดขายทั้งหมด</p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">รายจ่ายเดือนนี้</CardTitle>
                                <TrendingDown className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-600">
                                    ฿{formatCurrency(financialMetrics?.totalExpenses || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">ค่าใช้จ่ายดำเนินงาน</p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ต้นทุนสินค้า</CardTitle>
                                <Package className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    ฿{formatCurrency(financialMetrics?.totalCost || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">COGS</p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${(financialMetrics?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                    ฿{formatCurrency(financialMetrics?.netProfit || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    รายรับ - ต้นทุน - รายจ่าย
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial Movements Table */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>รายละเอียดการเคลื่อนไหวทางการเงิน</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[350px] sm:max-h-[500px] overflow-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead>วันที่</TableHead>
                                            <TableHead>รายละเอียด</TableHead>
                                            <TableHead className="hidden sm:table-cell">หมวดหมู่</TableHead>
                                            <TableHead className="text-right">จำนวนเงิน</TableHead>
                                            <TableHead className="hidden md:table-cell">ผู้บันทึก</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financialMetrics?.transactions && financialMetrics.transactions.length > 0 ? (
                                            financialMetrics.transactions.map((transaction, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {formatDate(transaction.date)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{transaction.details}</TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge variant="secondary">{transaction.category}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {transaction.type === 'income' ? '+' : '-'}฿{formatCurrency(transaction.amount)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground hidden md:table-cell">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            {transaction.recorder}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    ไม่มีข้อมูลการเคลื่อนไหวทางการเงิน
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
