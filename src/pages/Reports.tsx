import { useState } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, Package, Users, DollarSign, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { mockDashboardStats, mockProducts, mockCategories } from '@/data/mockData';
import { toast } from 'sonner';

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
  { name: 'เงินสด', value: 45, color: '#10B981' },
  { name: 'โอนเงิน', value: 30, color: '#3B82F6' },
  { name: 'บัตรเครดิต', value: 18, color: '#8B5CF6' },
  { name: 'PromptPay', value: 7, color: '#F59E0B' },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState('week');

  const handleExport = (type: string) => {
    toast.success(`กำลังส่งออกรายงาน ${type}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">รายงาน</h1>
          <p className="text-muted-foreground">วิเคราะห์ข้อมูลการขายและสต็อก</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
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
          <Button variant="outline" onClick={() => handleExport('Excel')}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-success">+15.2%</Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-display">฿224,450</p>
              <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <Badge variant="outline" className="text-success">+8.5%</Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-display">฿89,780</p>
              <p className="text-sm text-muted-foreground">กำไรรวม</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-info/10">
                <ShoppingCart className="h-5 w-5 text-info" />
              </div>
              <Badge variant="outline" className="text-success">+12.3%</Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-display">372</p>
              <p className="text-sm text-muted-foreground">รายการขาย</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <Badge variant="outline" className="text-success">+5.8%</Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-display">฿603</p>
              <p className="text-sm text-muted-foreground">ค่าเฉลี่ยต่อบิล</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">รายงานการขาย</TabsTrigger>
          <TabsTrigger value="products">รายงานสินค้า</TabsTrigger>
          <TabsTrigger value="inventory">รายงานสต็อก</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales Trend */}
            <Card className="glass animate-slide-up">
              <CardHeader>
                <CardTitle className="font-display">ยอดขายรายวัน</CardTitle>
                <CardDescription>แนวโน้มยอดขายในสัปดาห์นี้</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="salesGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `฿${v/1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
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
              <CardHeader>
                <CardTitle className="font-display">ช่องทางการชำระเงิน</CardTitle>
                <CardDescription>สัดส่วนการชำระเงินแต่ละช่องทาง</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'สัดส่วน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders by Hour */}
          <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="font-display">จำนวนรายการขายตามชั่วโมง</CardTitle>
              <CardDescription>ช่วงเวลาที่มีการขายมากที่สุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDashboardStats.salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(h) => `${h}:00`} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
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
        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Distribution */}
            <Card className="glass animate-slide-up">
              <CardHeader>
                <CardTitle className="font-display">ยอดขายตามหมวดหมู่</CardTitle>
                <CardDescription>สัดส่วนการขายแต่ละหมวดหมู่</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'สัดส่วน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="font-display">สินค้าขายดี Top 10</CardTitle>
                <CardDescription>สินค้าที่มียอดขายสูงสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.totalSold}</p>
                        <p className="text-xs text-muted-foreground">ชิ้น</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="glass animate-slide-up">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-3 bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display">{mockProducts.length}</p>
                    <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-3 bg-warning/10">
                    <Package className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display text-warning">3</p>
                    <p className="text-sm text-muted-foreground">สินค้าใกล้หมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-3 bg-success/10">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display">฿285,400</p>
                    <p className="text-sm text-muted-foreground">มูลค่าสต็อก</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle className="font-display">สินค้าที่ต้องเติมสต็อก</CardTitle>
              <CardDescription>สินค้าที่มีจำนวนต่ำกว่าขั้นต่ำ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockProducts.filter(p => p.stock <= p.minStock).map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">เหลือ {product.stock} {product.stockUnit}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">ขั้นต่ำ: {product.minStock}</p>
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
