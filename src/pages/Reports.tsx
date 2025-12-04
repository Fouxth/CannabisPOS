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

export default function Reports() {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

    const { data: reportsData, isLoading } = useQuery({
        queryKey: ['reports', dateRange],
        queryFn: () => api.getReportsOverview(),
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">รายงานการขายและประสิทธิภาพธุรกิจ</h1>
                    <p className="text-muted-foreground">ภาพรวมและข้อมูลเชิงลึกทางธุรกิจ</p>
                </div>
            </div>

            <Tabs defaultValue="business" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="business">Business Insights</TabsTrigger>
                    <TabsTrigger value="financial">Financial Statement</TabsTrigger>
                </TabsList>

                {/* Business Insights Tab */}
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

                    {/* Alerts Section */}
                    {reportsData.alerts && reportsData.alerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">⚠️ การแจ้งเตือนและความเสี่ยง</h3>
                            <div className="grid gap-3">
                                {reportsData.alerts.slice(0, 5).map((alert, index) => (
                                    <Alert
                                        key={index}
                                        variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                                        className="glass"
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>{alert.title}</AlertTitle>
                                        <AlertDescription>{alert.message}</AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Charts Section */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Sales Trend */}
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle>แนวโน้มยอดขาย</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
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
                                <ResponsiveContainer width="100%" height={300}>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>วันที่</TableHead>
                                        <TableHead>รายละเอียด</TableHead>
                                        <TableHead>หมวดหมู่</TableHead>
                                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                                        <TableHead>ผู้บันทึก</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {financialMetrics?.transactions && financialMetrics.transactions.length > 0 ? (
                                        financialMetrics.transactions.slice(0, 20).map((transaction, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(transaction.date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{transaction.details}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{transaction.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {transaction.type === 'income' ? '+' : '-'}฿{formatCurrency(transaction.amount)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
