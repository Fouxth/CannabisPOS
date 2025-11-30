import { useState } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, Package, Users, DollarSign, FileText, Filter, Banknote, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { mockDashboardStats, mockProducts, mockCategories, mockSalesByPayment } from '@/data/mockData';
import { toast } from 'sonner';
import { PermissionGate } from '@/components/ProtectedRoute';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
};

// Mock data for reports
const weeklyData = [
  { day: 'จันทร์', sales: 25800, orders: 42 },
  { day: 'อังคาร', sales: 28450, orders: 45 },
  { day: 'พุธ', sales: 22100, orders: 38 },
  { day: 'พฤหัสบดี', sales: 31200, orders: 52 },
  { day: 'ศุกร์', sales: 38500, orders: 65 },
  { day: 'เสาร์', sales: 42800, orders: 72 },
  { day: 'อาทิตย์', sales: 35600, orders: 58 },
];

const categoryData = mockCategories.map((cat, i) => ({
  name: cat.name,
  value: [35, 25, 20, 12, 5, 3][i] || 5,
  color: cat.color,
}));

const paymentData = [
  { name: 'เงินสด', value: 56, color: '#10B981' },
  { name: 'โอนเงิน', value: 44, color: '#3B82F6' },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState('week');
  const [showSalesDetail, setShowSalesDetail] = useState(false);

  const totalSales = mockSalesByPayment.cash + mockSalesByPayment.transfer;
  const cashPercent = ((mockSalesByPayment.cash / totalSales) * 100).toFixed(1);
  const transferPercent = ((mockSalesByPayment.transfer / totalSales) * 100).toFixed(1);

  const handleExport = (type: string) => {
    toast.success(`กำลังส่งออกรายงาน ${type}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display">รายงาน</h1>
          <p className="text-sm text-muted-foreground">วิเคราะห์ข้อมูลการขายและสต็อก</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
            </SelectContent>
          </Select>
          <PermissionGate permissions={['export_reports']}>
            <Button variant="outline" onClick={() => handleExport('Excel')} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              ส่งออก
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card 
          className="glass animate-slide-up cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => setShowSalesDetail(true)}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-2 sm:p-3 bg-primary/10">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-success text-xs">+15.2%</Badge>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="text-lg sm:text-2xl font-bold font-display">฿224,450</p>
              <p className="text-xs sm:text-sm text-muted-foreground">ยอดขายรวม</p>
              <p className="text-[10px] sm:text-xs text-primary mt-1">คลิกดูรายละเอียด</p>
            </div>
          </CardContent>
        </Card>
        
        <PermissionGate 
          permissions={['view_profit_report']}
          fallback={
            <Card className="glass animate-slide-up opacity-50" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl p-2 sm:p-3 bg-success/10">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <Badge variant="outline" className="text-xs">🔒</Badge>
                </div>
                <div className="mt-3 sm:mt-4">
                  <p className="text-lg sm:text-2xl font-bold font-display">---</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">กำไรรวม</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ต้องการสิทธิ์</p>
                </div>
              </CardContent>
            </Card>
          }
        >
          <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-xl p-2 sm:p-3 bg-success/10">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
                <Badge variant="outline" className="text-success text-xs">+8.5%</Badge>
              </div>
              <div className="mt-3 sm:mt-4">
                <p className="text-lg sm:text-2xl font-bold font-display">฿89,780</p>
                <p className="text-xs sm:text-sm text-muted-foreground">กำไรรวม</p>
              </div>
            </CardContent>
          </Card>
        </PermissionGate>
        
        <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-2 sm:p-3 bg-info/10">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
              </div>
              <Badge variant="outline" className="text-success text-xs">+12.3%</Badge>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="text-lg sm:text-2xl font-bold font-display">372</p>
              <p className="text-xs sm:text-sm text-muted-foreground">รายการขาย</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-2 sm:p-3 bg-accent/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
              <Badge variant="outline" className="text-success text-xs">+5.8%</Badge>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="text-lg sm:text-2xl font-bold font-display">฿603</p>
              <p className="text-xs sm:text-sm text-muted-foreground">ค่าเฉลี่ยต่อบิล</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Detail Dialog */}
      <Dialog open={showSalesDetail} onOpenChange={setShowSalesDetail}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="font-display">รายละเอียดยอดขาย</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Total */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
              <p className="text-2xl sm:text-3xl font-bold font-display text-primary">
                ฿224,450
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {/* Cash */}
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-success/20">
                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">เงินสด</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{cashPercent}%</p>
                  </div>
                </div>
                <p className="text-base sm:text-xl font-bold font-display text-success">
                  ฿125,692
                </p>
              </div>

              {/* Transfer */}
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-info/10 border border-info/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
                    <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">โอนเงิน</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{transferPercent}%</p>
                  </div>
                </div>
                <p className="text-base sm:text-xl font-bold font-display text-info">
                  ฿98,758
                </p>
              </div>
            </div>

            {/* Summary bar */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">สัดส่วนการชำระเงิน</p>
              <div className="h-3 sm:h-4 rounded-full overflow-hidden flex">
                <div 
                  className="bg-success h-full transition-all"
                  style={{ width: `${cashPercent}%` }}
                />
                <div 
                  className="bg-info h-full transition-all"
                  style={{ width: `${transferPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs">
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

      <Tabs defaultValue="sales" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">รายงานการขาย</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">รายงานสินค้า</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm">รายงานสต็อก</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Sales Trend */}
            <Card className="glass animate-slide-up">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="font-display text-base sm:text-lg">ยอดขายรายวัน</CardTitle>
                <CardDescription className="text-xs sm:text-sm">แนวโน้มยอดขายในสัปดาห์นี้</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="salesGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `฿${v/1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [formatCurrency(value), 'ยอดขาย']}
                      />
                      <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#salesGradient2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="font-display text-base sm:text-lg">ช่องทางการชำระเงิน</CardTitle>
                <CardDescription className="text-xs sm:text-sm">สัดส่วนการชำระเงินแต่ละช่องทาง</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'สัดส่วน']} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders by Hour */}
          <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="font-display text-base sm:text-lg">จำนวนรายการขายตามชั่วโมง</CardTitle>
              <CardDescription className="text-xs sm:text-sm">ช่วงเวลาที่มีการขายมากที่สุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] sm:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDashboardStats.salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(h) => `${h}:00`} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`${value} รายการ`, 'จำนวน']}
                      labelFormatter={(h) => `เวลา ${h}:00 น.`}
                    />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Report */}
        <TabsContent value="products" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Category Distribution */}
            <Card className="glass animate-slide-up">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="font-display text-base sm:text-lg">ยอดขายตามหมวดหมู่</CardTitle>
                <CardDescription className="text-xs sm:text-sm">สัดส่วนการขายแต่ละหมวดหมู่</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'สัดส่วน']} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="font-display text-base sm:text-lg">สินค้าขายดี Top 10</CardTitle>
                <CardDescription className="text-xs sm:text-sm">สินค้าที่มียอดขายสูงสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                  {mockProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center gap-2 sm:gap-3">
                      <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] sm:text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <img src={product.imageUrl} alt={product.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs sm:text-sm">{product.totalSold}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">ชิ้น</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <Card className="glass animate-slide-up">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2 sm:p-3 bg-primary/10">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold font-display">{mockProducts.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2 sm:p-3 bg-warning/10">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold font-display text-warning">3</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">สินค้าใกล้หมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <PermissionGate 
              permissions={['view_stock_value']}
              fallback={
                <Card className="glass animate-slide-up opacity-50" style={{ animationDelay: '200ms' }}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl p-2 sm:p-3 bg-success/10">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold font-display">🔒</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">มูลค่าสต็อก</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2 sm:p-3 bg-success/10">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold font-display">฿285,400</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">มูลค่าสต็อก</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionGate>
          </div>

          <Card className="glass animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="font-display text-base sm:text-lg">สินค้าที่ต้องเติมสต็อก</CardTitle>
              <CardDescription className="text-xs sm:text-sm">สินค้าที่มีจำนวนต่ำกว่าขั้นต่ำ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {mockProducts.filter(p => p.stock <= p.minStock).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50">
                    <img src={product.imageUrl} alt={product.name} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-[10px] sm:text-xs">เหลือ {product.stock} {product.stockUnit}</Badge>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ขั้นต่ำ: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
