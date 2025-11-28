import { useState, useMemo } from 'react';
import { Search, Grid3X3, List, Plus, Minus, Trash2, Percent, Receipt, CreditCard, Banknote, QrCode, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePOSStore } from '@/stores/posStore';
import { mockProducts, mockCategories, mockPaymentMethods } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const paymentIcons: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
  qr: QrCode,
};

export default function POS() {
  const {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getSubtotal,
    getDiscount,
    getTax,
    getTotal,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    amountReceived,
    setAmountReceived,
    globalDiscount,
    setGlobalDiscount,
  } = usePOSStore();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery);
      return matchesCategory && matchesSearch && product.isActive && product.showInPos;
    });
  }, [selectedCategory, searchQuery]);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax();
  const total = getTotal();
  const change = amountReceived - total;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('กรุณาเพิ่มสินค้าในตะกร้า');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayment = () => {
    if (amountReceived < total && selectedPaymentMethod === 'cash') {
      toast.error('จำนวนเงินไม่เพียงพอ');
      return;
    }
    toast.success('ชำระเงินสำเร็จ!', {
      description: `ยอดรวม ${formatCurrency(total)} บาท`,
    });
    clearCart();
    setShowPaymentDialog(false);
    setAmountReceived(0);
  };

  const quickAmounts = [20, 50, 100, 500, 1000];

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 animate-fade-in">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Categories */}
        <ScrollArea className="mb-4 -mx-1 px-1">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full whitespace-nowrap"
            >
              ทั้งหมด
            </Button>
            {mockCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  borderColor: category.color,
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Search & View */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้า, SKU, Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid/List */}
        <ScrollArea className="flex-1">
          <div
            className={cn(
              'gap-3 pb-4',
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'flex flex-col'
            )}
          >
            {filteredProducts.map((product, index) => {
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock === 0;
              const category = mockCategories.find((c) => c.id === product.categoryId);

              return (
                <Card
                  key={product.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200 overflow-hidden animate-scale-in',
                    'hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50',
                    isOutOfStock && 'opacity-50 pointer-events-none',
                    viewMode === 'list' && 'flex-row'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => !isOutOfStock && addToCart(product)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative aspect-square bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        {isLowStock && !isOutOfStock && (
                          <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
                            ใกล้หมด
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Badge variant="secondary">หมดสต็อก</Badge>
                          </div>
                        )}
                        {category && (
                          <Badge
                            className="absolute bottom-2 left-2 text-[10px]"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                        <p className="text-lg font-bold text-primary mt-1">
                          ฿{formatCurrency(product.price)}
                        </p>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex items-center gap-4 p-4 w-full">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                        <p className="text-xs text-muted-foreground">
                          สต็อก: {product.stock} {product.stockUnit}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        ฿{formatCurrency(product.price)}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <Card className="w-96 flex flex-col glass">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">ตะกร้าสินค้า</CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                ล้าง
              </Button>
            )}
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 px-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4 opacity-50" />
              <p>ยังไม่มีสินค้าในตะกร้า</p>
              <p className="text-sm">คลิกที่สินค้าเพื่อเพิ่ม</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-slide-in-right"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ฿{formatCurrency(item.product.price)} x {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          item.quantity > 1
                            ? updateCartItem(item.id, { quantity: item.quantity - 1 })
                            : removeFromCart(item.id)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      ฿{formatCurrency(item.product.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart Summary */}
        <div className="p-4 border-t mt-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ยอดรวม</span>
              <span>฿{formatCurrency(subtotal)}</span>
            </div>
            {globalDiscount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>ส่วนลด</span>
                <span>-฿{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT 7%</span>
              <span>฿{formatCurrency(tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>รวมทั้งสิ้น</span>
              <span className="text-primary">฿{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDiscountDialog(true)}
              disabled={cart.length === 0}
            >
              <Percent className="h-4 w-4 mr-2" />
              ส่วนลด
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground shadow-glow"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              <Receipt className="h-4 w-4 mr-2" />
              ชำระเงิน
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">ชำระเงิน</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Amount */}
            <div className="text-center py-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">ยอดที่ต้องชำระ</p>
              <p className="text-4xl font-bold text-primary font-display">
                ฿{formatCurrency(total)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-2">
              {mockPaymentMethods.map((method) => {
                const Icon = paymentIcons[method.type];
                return (
                  <Button
                    key={method.id}
                    variant={selectedPaymentMethod === method.type ? 'default' : 'outline'}
                    className={cn(
                      'h-16 flex-col gap-1',
                      selectedPaymentMethod === method.type && 'shadow-glow'
                    )}
                    onClick={() => setSelectedPaymentMethod(method.type)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{method.name}</span>
                  </Button>
                );
              })}
            </div>

            {/* Cash Input */}
            {selectedPaymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="pl-8 text-2xl h-14 font-bold text-center"
                  />
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountReceived(amountReceived + amount)}
                    >
                      +{amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmountReceived(Math.ceil(total / 100) * 100)}
                  >
                    พอดี
                  </Button>
                </div>

                {/* Change */}
                {amountReceived >= total && (
                  <div className="text-center py-3 bg-success/10 rounded-xl border border-success/20">
                    <p className="text-sm text-muted-foreground">เงินทอน</p>
                    <p className="text-2xl font-bold text-success">
                      ฿{formatCurrency(change)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              className="gradient-primary text-primary-foreground shadow-glow"
              onClick={handlePayment}
              disabled={selectedPaymentMethod === 'cash' && amountReceived < total}
            >
              ยืนยันการชำระ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">ส่วนลด</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setGlobalDiscount(5, 'percent')}
                className={globalDiscount === 5 ? 'border-primary' : ''}
              >
                5%
              </Button>
              <Button
                variant="outline"
                onClick={() => setGlobalDiscount(10, 'percent')}
                className={globalDiscount === 10 ? 'border-primary' : ''}
              >
                10%
              </Button>
              <Button
                variant="outline"
                onClick={() => setGlobalDiscount(15, 'percent')}
                className={globalDiscount === 15 ? 'border-primary' : ''}
              >
                15%
              </Button>
              <Button
                variant="outline"
                onClick={() => setGlobalDiscount(20, 'percent')}
                className={globalDiscount === 20 ? 'border-primary' : ''}
              >
                20%
              </Button>
            </div>
            
            <div className="relative">
              <Input
                type="number"
                placeholder="กรอกส่วนลด %"
                value={globalDiscount || ''}
                onChange={(e) => setGlobalDiscount(Number(e.target.value), 'percent')}
                className="pr-8"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setGlobalDiscount(0, 'percent'); setShowDiscountDialog(false); }}>
              ยกเลิกส่วนลด
            </Button>
            <Button onClick={() => setShowDiscountDialog(false)}>
              ตกลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
