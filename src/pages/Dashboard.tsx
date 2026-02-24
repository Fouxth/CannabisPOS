import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Banknote,
  ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
};

import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [showSalesDetail, setShowSalesDetail] = useState(false);
  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ['dashboard', user?.storeId],
    queryFn: api.getDashboard,
    enabled: !!user?.storeId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!dashboard || isError) {
    return (
      <div className="text-center text-muted-foreground py-10">
        ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
      </div>
    );
  }

  const lowStockProducts = dashboard.lowStockProducts;
  const salesByPayment = dashboard.salesByPayment || {};
  const cashTotal = salesByPayment.cash ?? 0;
  const transferTotal = salesByPayment.transfer ?? 0;
  const totalSales = Object.values(salesByPayment).reduce((sum, value) => sum + value, 0);
  const cashPercent = totalSales ? ((cashTotal / totalSales) * 100).toFixed(1) : '0.0';
  const transferPercent = totalSales ? ((transferTotal / totalSales) * 100).toFixed(1) : '0.0';

  const statCards = [
    {
      title: 'ยอดขายวันนี้',
      value: dashboard.todaySales,
      change: 12.5,
      icon: DollarSign,
      format: 'currency' as const,
      color: 'primary',
      clickable: true,
    },
    {
      title: 'รายการขายวันนี้',
      value: dashboard.todayOrders,
      change: 8.2,
      icon: ShoppingCart,
      format: 'number' as const,
      color: 'success',
      clickable: false,
    },
    {
      title: 'ค่าเฉลี่ยต่อบิล',
      value: dashboard.todayAvgOrder,
      change: 3.8,
      icon: TrendingUp,
      format: 'currency' as const,
      color: 'info',
      clickable: false,
    },
    {
      title: 'สินค้าใกล้หมด',
      value: dashboard.lowStockCount,
      change: -2,
      icon: AlertTriangle,
      format: 'number' as const,
      color: 'warning',
      clickable: false,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">แดชบอร์ด</h1>
        <p className="text-muted-foreground">
          ภาพรวมการขายวันที่ {format(new Date(), 'd MMMM yyyy', { locale: th })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className={`glass overflow-hidden animate-slide-up ${stat.clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => stat.clickable && setShowSalesDetail(true)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-2.5 sm:p-3 bg-${stat.color}/10`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                </div>
                <Badge
                  variant={stat.change >= 0 ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(stat.change)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold font-display">
                  {stat.format === 'currency'
                    ? formatCurrency(stat.value)
                    : stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                {stat.clickable && (
                  <p className="text-xs text-primary mt-1">คลิกเพื่อดูรายละเอียด</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Detail Dialog */}
      <Dialog open={showSalesDetail} onOpenChange={setShowSalesDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">รายละเอียดยอดขายวันนี้</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Total */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
              <p className="text-3xl font-bold font-display text-primary">
                {formatCurrency(totalSales)}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {/* Cash */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <Banknote className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">เงินสด</p>
                    <p className="text-xs text-muted-foreground">{cashPercent}% ของยอดทั้งหมด</p>
                  </div>
                </div>
                <p className="text-xl font-bold font-display text-success">
                  {formatCurrency(cashTotal)}
                </p>
              </div>

              {/* Transfer */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-info/10 border border-info/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/20">
                    <ArrowRightLeft className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="font-medium">โอนเงิน</p>
                    <p className="text-xs text-muted-foreground">{transferPercent}% ของยอดทั้งหมด</p>
                  </div>
                </div>
                <p className="text-xl font-bold font-display text-info">
                  {formatCurrency(transferTotal)}
                </p>
              </div>
            </div>

            {/* Summary bar */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">สัดส่วนการชำระเงิน</p>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div
                  className="bg-success h-full transition-all"
                  style={{ width: `${cashPercent}%` }}
                />
                <div
                  className="bg-info h-full transition-all"
                  style={{ width: `${transferPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  เงินสด {cashPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-info" />
                  โอนเงิน {transferPercent}%
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card className="glass animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="font-display">ยอดขายตามชั่วโมง</CardTitle>
            <CardDescription>แสดงยอดขายและจำนวนรายการในแต่ละชั่วโมง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.salesByHour}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(hour) => `${hour}:00`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'ยอดขาย']}
                    labelFormatter={(hour) => `เวลา ${hour}:00 น.`}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="glass animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="font-display">สินค้าขายดี</CardTitle>
            <CardDescription>5 อันดับสินค้าที่ขายได้มากที่สุดวันนี้</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboard.topProducts}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="product.name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={100}
                    tickFormatter={(name) => name.length > 12 ? `${name.slice(0, 12)}...` : name}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'quantity' ? `${value} กรัม` : formatCurrency(value),
                      name === 'quantity' ? 'จำนวน' : 'รายได้'
                    ]}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Low Stock Alert */}
        <Card className="glass animate-slide-up lg:col-span-1" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              สินค้าใกล้หมด
            </CardTitle>
            <CardDescription>สินค้าที่ต้องเติมสต็อก</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                  </div>
                  <Badge variant="destructive" className="font-mono">
                    {product.stock} {product.stockUnit}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  ไม่มีสินค้าใกล้หมด
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="glass animate-slide-up lg:col-span-2" style={{ animationDelay: '700ms' }}>
          <CardHeader>
            <CardTitle className="font-display">สรุปยอดขาย</CardTitle>
            <CardDescription>เปรียบเทียบยอดขายในช่วงเวลาต่างๆ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">ยอดขายวันนี้</p>
                <p className="text-2xl font-bold font-display text-primary">
                  {formatCurrency(dashboard.todaySales)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard.todayOrders} รายการ
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-success/20 to-success/5 p-6 border border-success/20">
                <p className="text-sm text-muted-foreground mb-2">ยอดขายสัปดาห์นี้</p>
                <p className="text-2xl font-bold font-display text-success">
                  {formatCurrency(dashboard.weekSales)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  เฉลี่ย {formatCurrency(dashboard.weekSales / 7)}/วัน
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 p-6 border border-accent/20">
                <p className="text-sm text-muted-foreground mb-2">ยอดขายเดือนนี้</p>
                <p className="text-2xl font-bold font-display text-accent">
                  {formatCurrency(dashboard.monthSales)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  เฉลี่ย {formatCurrency(dashboard.monthSales / 30)}/วัน
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
