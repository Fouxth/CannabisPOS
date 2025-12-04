import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Plus, Minus, AlertTriangle, Package, ArrowUpDown, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Product, StockMovement } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

export default function Stock() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: api.getStockMovements,
  });

  const adjustStockMutation = useMutation({
    mutationFn: api.adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('ปรับสต็อกสำเร็จ');
      setShowAdjustDialog(false);
      setSelectedProduct(null);
      setAdjustmentQuantity('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการปรับสต็อก');
    },
  });

  const lowStockProducts = useMemo(() => products.filter((p) => p.stock <= p.minStock), [products]);
  const outOfStockProducts = useMemo(() => products.filter((p) => p.stock === 0), [products]);
  const totalStockValue = useMemo(() => products.reduce((sum, p) => sum + p.stock * p.cost, 0), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [products, searchQuery]);

  const isLoading = productsLoading || movementsLoading;

  const handleAdjustStock = (form: HTMLFormElement) => {
    if (!selectedProduct) return;

    const quantity = parseInt((form.elements.namedItem('quantity') as HTMLInputElement).value);
    const reason = (form.elements.namedItem('reason') as HTMLTextAreaElement).value;

    // Get current user ID - you may need to get this from auth context
    // For now, using a placeholder
    const userId = '1'; // TODO: Get from auth context

    adjustStockMutation.mutate({
      productId: selectedProduct.id,
      userId,
      adjustmentType,
      quantity,
      reason: reason || `ปรับสต็อก (${adjustmentType})`,
    });
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">จัดการสต็อก</h1>
        <p className="text-muted-foreground">ติดตามและจัดการสต็อกสินค้า</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3 bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{products.length}</p>
                <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3 bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-warning">{lowStockProducts.length}</p>
                <p className="text-sm text-muted-foreground">สินค้าใกล้หมด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3 bg-destructive/10">
                <Package className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-destructive">{outOfStockProducts.length}</p>
                <p className="text-sm text-muted-foreground">สินค้าหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3 bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">฿{formatCurrency(totalStockValue)}</p>
                <p className="text-sm text-muted-foreground">มูลค่าสต็อก</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="history">ประวัติการเคลื่อนไหว</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Table */}
          <Card className="glass">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">รูป</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead className="text-center">สต็อก</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => {
                    const isLowStock = product.stock <= product.minStock;
                    const isOutOfStock = product.stock === 0;
                    const stockPercentage = Math.min((product.stock / (product.minStock * 2)) * 100, 100);
                    const stockValue = product.stock * product.cost;

                    return (
                      <TableRow
                        key={product.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2">
                              <span className={cn(
                                'text-lg font-bold',
                                isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : ''
                              )}>
                                {product.stock}
                              </span>
                              <span className="text-sm text-muted-foreground">/ {product.minStock * 2}</span>
                            </div>
                            <Progress
                              value={stockPercentage}
                              className={cn(
                                'h-2',
                                isOutOfStock ? '[&>div]:bg-destructive' : isLowStock ? '[&>div]:bg-warning' : ''
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isOutOfStock ? (
                            <Badge variant="destructive">หมด</Badge>
                          ) : isLowStock ? (
                            <Badge variant="outline" className="border-warning text-warning">ใกล้หมด</Badge>
                          ) : (
                            <Badge variant="outline" className="border-success text-success">ปกติ</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">฿{formatCurrency(stockValue)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedProduct(product); setAdjustmentType('add'); setShowAdjustDialog(true); }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedProduct(product); setAdjustmentType('subtract'); setShowAdjustDialog(true); }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <History className="h-5 w-5" />
                ประวัติการเคลื่อนไหวสต็อก
              </CardTitle>
              <CardDescription>รายการเคลื่อนไหวสต็อกล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements.map((movement, index) => {
                  const product = products.find(p => p.id === movement.productId) || movement.product;
                  const isPositive = movement.quantityChange > 0;

                  return (
                    <div
                      key={movement.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        'rounded-full p-2',
                        isPositive ? 'bg-success/10' : 'bg-destructive/10'
                      )}>
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <img
                        src={product?.imageUrl}
                        alt={product?.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product?.name}</p>
                        <p className="text-sm text-muted-foreground">{movement.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'font-bold',
                          isPositive ? 'text-success' : 'text-destructive'
                        )}>
                          {isPositive ? '+' : ''}{movement.quantityChange}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {movement.previousQuantity} → {movement.newQuantity}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{movement.user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(movement.createdAt), 'dd/MM HH:mm', { locale: th })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">ปรับปรุงสต็อก</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    สต็อกปัจจุบัน: <span className="font-bold">{selectedProduct.stock}</span> {selectedProduct.stockUnit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ประเภทการปรับ</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={adjustmentType === 'add' ? 'default' : 'outline'}
                    onClick={() => setAdjustmentType('add')}
                    className="flex-col h-auto py-3"
                  >
                    <Plus className="h-4 w-4 mb-1" />
                    <span className="text-xs">เพิ่ม</span>
                  </Button>
                  <Button
                    variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                    onClick={() => setAdjustmentType('subtract')}
                    className="flex-col h-auto py-3"
                  >
                    <Minus className="h-4 w-4 mb-1" />
                    <span className="text-xs">ลด</span>
                  </Button>
                  <Button
                    variant={adjustmentType === 'set' ? 'default' : 'outline'}
                    onClick={() => setAdjustmentType('set')}
                    className="flex-col h-auto py-3"
                  >
                    <ArrowUpDown className="h-4 w-4 mb-1" />
                    <span className="text-xs">กำหนด</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">จำนวน</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="0"
                  defaultValue={adjustmentQuantity}
                  className="text-2xl h-14 text-center font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">เหตุผล</Label>
                <Textarea id="reason" name="reason" placeholder="เช่น เติมสต็อก, สินค้าเสียหาย..." rows={2} />
              </div>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            handleAdjustStock(e.currentTarget);
          }}>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAdjustDialog(false); setSelectedProduct(null); setAdjustmentQuantity(''); }}>
                ยกเลิก
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                ยืนยันปรับสต็อก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
