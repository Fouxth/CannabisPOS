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
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
                                    <p className="text-muted-foreground">คำแนะนำอัจฉริยะสำหรับการจัดการร้านของคุณ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alerts Section - Moved here */}
                    {reportsData.alerts && reportsData.alerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                การแจ้งเตือนและความเสี่ยง
                            </h3>
                            <div className="grid gap-3">
                                {reportsData.alerts.slice(0, 5).map((alert, index) => (
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

                    {/* AI Insights Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Performance Score */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">📊</span>
                                    คะแนนประสิทธิภาพร้าน
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center py-4">
                                    <div className="relative w-32 h-32">
                                        <div className={`absolute inset-0 rounded-full border-8 ${reportsData.profitMargin >= 30 ? 'border-green-500' :
                                            reportsData.profitMargin >= 15 ? 'border-yellow-500' : 'border-red-500'
                                            }`}></div>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-3xl font-bold">{Math.min(Math.round(reportsData.profitMargin * 2), 100)}</span>
                                            <span className="text-xs text-muted-foreground">/100</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    {reportsData.profitMargin >= 30 ? '🎉 ยอดเยี่ยม! ร้านของคุณทำกำไรได้ดีมาก' :
                                        reportsData.profitMargin >= 15 ? '👍 ดี! แต่ยังมีโอกาสเพิ่มกำไร' :
                                            '⚠️ ควรปรับปรุง! ลองทบทวนราคาและต้นทุน'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">📈</span>
                                    สรุปสถานะธุรกิจ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <span>อัตรากำไรขั้นต้น</span>
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-700">{reportsData.profitMargin.toFixed(1)}%</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <span>สินค้าในสต็อก</span>
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">{reportsData.inventory.totalProducts} รายการ</Badge>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg ${reportsData.inventory.lowStockCount > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-green-500/10 border-green-500/20'
                                    } border`}>
                                    <span>สินค้าใกล้หมด</span>
                                    <Badge variant={reportsData.inventory.lowStockCount > 0 ? "destructive" : "secondary"}>
                                        {reportsData.inventory.lowStockCount} รายการ
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Recommendations */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-xl">💡</span>
                                คำแนะนำจาก AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Dynamic Recommendations based on data */}
                            {reportsData.inventory.lowStockCount > 0 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">⚠️</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="border-orange-500 text-orange-600">สำคัญ</Badge>
                                                <span className="text-xs text-muted-foreground">สต็อกสินค้า</span>
                                            </div>
                                            <h4 className="font-semibold">ควรเติมสต็อกสินค้า {reportsData.inventory.lowStockCount} รายการ</h4>
                                            <p className="text-sm text-muted-foreground mt-1">มีสินค้าใกล้หมดสต็อก ควรสั่งซื้อเพิ่มเพื่อป้องกันการสูญเสียยอดขาย</p>
                                            <p className="text-sm font-medium text-orange-600 mt-2">
                                                ✅ แนะนำ: ไปที่หน้าสต็อกและเติมสินค้าที่ใกล้หมด
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportsData.profitMargin < 20 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-red-500/5 border border-red-500/30">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">📉</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="destructive">วิกฤต</Badge>
                                                <span className="text-xs text-muted-foreground">กำไร</span>
                                            </div>
                                            <h4 className="font-semibold">อัตรากำไรต่ำกว่าเกณฑ์</h4>
                                            <p className="text-sm text-muted-foreground mt-1">อัตรากำไร {reportsData.profitMargin.toFixed(1)}% ถือว่าต่ำ ควรทบทวนราคาขายหรือลดต้นทุน</p>
                                            <p className="text-sm font-medium text-red-600 mt-2">
                                                ✅ แนะนำ: พิจารณาปรับราคาขายขึ้น 10-15% หรือหาซัพพลายเออร์ที่ราคาถูกกว่า
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportsData.profitMargin >= 20 && reportsData.inventory.lowStockCount === 0 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-500/5 border border-green-500/30">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">🎉</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="bg-green-500/20 text-green-600">ยอดเยี่ยม</Badge>
                                                <span className="text-xs text-muted-foreground">สถานะร้าน</span>
                                            </div>
                                            <h4 className="font-semibold">ร้านของคุณอยู่ในสถานะที่ดี!</h4>
                                            <p className="text-sm text-muted-foreground mt-1">กำไรดี สต็อกเพียงพอ ไม่มีปัญหาเร่งด่วน</p>
                                            <p className="text-sm font-medium text-green-600 mt-2">
                                                ✅ แนะนำ: พิจารณาเพิ่มสินค้าใหม่หรือทำโปรโมชันเพื่อเพิ่มยอดขาย
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Product Insight */}
                            {reportsData.topProducts && reportsData.topProducts.length > 0 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-500/5 border border-purple-500/30">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">🏆</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-600">ข้อมูลเชิงลึก</Badge>
                                                <span className="text-xs text-muted-foreground">สินค้าขายดี</span>
                                            </div>
                                            <h4 className="font-semibold">สินค้าขายดีที่สุด: {reportsData.topProducts[0]?.product?.name || 'ไม่มีข้อมูล'}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                ขายได้ {reportsData.topProducts[0]?.quantity || 0} กรัม สร้างรายได้ ฿{formatCurrency(reportsData.topProducts[0]?.revenue || 0)}
                                            </p>
                                            <p className="text-sm font-medium text-purple-600 mt-2">
                                                ✅ แนะนำ: ให้ความสำคัญกับสินค้านี้และตรวจสอบให้มีสต็อกเพียงพอ
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sales Trend Insight */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-500/5 border border-blue-500/30">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">📊</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">แนวโน้ม</Badge>
                                            <span className="text-xs text-muted-foreground">ยอดขาย</span>
                                        </div>
                                        <h4 className="font-semibold">ยอดขายรวม ฿{formatCurrency(reportsData.totalRevenue)}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            กำไรขั้นต้น ฿{formatCurrency(reportsData.totalProfit)} (Margin {reportsData.profitMargin.toFixed(1)}%)
                                        </p>
                                        <p className="text-sm font-medium text-blue-600 mt-2">
                                            ✅ แนะนำ: ตั้งเป้าหมายยอดขายรายเดือนและติดตามความก้าวหน้า
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Do's and Don'ts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="glass border-green-500/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                    <span className="text-xl">✅</span>
                                    สิ่งที่ควรทำ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 p-2 rounded bg-green-500/10">
                                    <span>📦</span>
                                    <span className="text-sm">ตรวจสอบสต็อกทุกวัน</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-green-500/10">
                                    <span>📈</span>
                                    <span className="text-sm">วิเคราะห์สินค้าขายดีและเน้นโปรโมท</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-green-500/10">
                                    <span>💰</span>
                                    <span className="text-sm">รักษา Profit Margin ให้มากกว่า 25%</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-green-500/10">
                                    <span>📊</span>
                                    <span className="text-sm">ดูรายงานสรุปทุกสิ้นเดือน</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-red-500/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <span className="text-xl">❌</span>
                                    สิ่งที่ไม่ควรทำ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10">
                                    <span>⚠️</span>
                                    <span className="text-sm">ปล่อยให้สินค้าหมดสต็อก</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10">
                                    <span>💸</span>
                                    <span className="text-sm">ตั้งราคาต่ำเกินไปจนขาดทุน</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10">
                                    <span>📉</span>
                                    <span className="text-sm">ละเลยสินค้าที่ขายไม่ดี</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10">
                                    <span>🚫</span>
                                    <span className="text-sm">ไม่ติดตามต้นทุนสินค้า</span>
                                </div>
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
                                <CardTitle>แนวโน้มยอดขาย</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={reportsData.monthlyBreakdown || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `฿${formatCurrency(Number(value))}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#10b981" name="ยอดขาย" strokeWidth={2} />
                                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="กำไร" strokeWidth={2} />
                                    </LineChart>
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
                                            label={(entry) => entry.name}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {(reportsData.categoryBreakdown || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `฿${formatCurrency(Number(value))}`} />
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
                                        <TableHead className="text-right">จำนวนขาย</TableHead>
                                        <TableHead className="text-right">รายได้</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(reportsData.topProducts || []).slice(0, 5).map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.product.name}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right text-emerald-600">
                                                ฿{formatCurrency(item.revenue)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
