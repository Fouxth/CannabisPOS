import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Grid3X3, List, Plus, Minus, Trash2, Percent, Receipt, CreditCard, Banknote, QrCode, ArrowRightLeft, Box, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePOSStore } from '@/stores/posStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BillReceipt } from '@/components/BillReceipt';
import { Bill, BillItem, CheckoutPayload } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

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
    globalDiscountType,
    setGlobalDiscount,
    globalSurcharge,
    globalSurchargeType,
    getSurcharge,
    setGlobalSurcharge,
    taxRate,
    setTaxRate,
    vatEnabled,
    setVatEnabled,
    calculateItemTotal,
  } = usePOSStore();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const { data: paymentMethods = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: api.getPaymentMethods,
  });
  const { data: systemSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  });

  useEffect(() => {
    if (systemSettings?.pos) {
      setTaxRate(systemSettings.pos.taxRate);
      setVatEnabled(systemSettings.pos.vatEnabled ?? true);
    }
  }, [systemSettings, setTaxRate, setVatEnabled]);

  const checkoutMutation = useMutation({
    mutationFn: api.createBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });

  const activePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => method.isActive),
    [paymentMethods]
  );
  const availablePaymentMethods = activePaymentMethods.length > 0 ? activePaymentMethods : paymentMethods;

  useEffect(() => {
    if (!availablePaymentMethods.length) return;
    if (!availablePaymentMethods.some((method) => method.type === selectedPaymentMethod)) {
      setSelectedPaymentMethod(availablePaymentMethods[0].type);
    }
  }, [availablePaymentMethods, selectedPaymentMethod, setSelectedPaymentMethod]);

  // Calculate totals before useEffect that depends on them
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const surcharge = getSurcharge();
  const tax = getTax();
  const total = getTotal();
  const change = selectedPaymentMethod === 'cash' ? amountReceived - total : 0;

  useEffect(() => {
    if (selectedPaymentMethod !== 'cash') {
      setAmountReceived(total);
    }
  }, [selectedPaymentMethod, total, setAmountReceived]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
      const matchesSearch = !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && product.isActive && product.showInPos;
    });
  }, [selectedCategory, searchQuery, products]);

  // Calculate sales by category
  const salesByCategory = useMemo(() => {
    const categoryTotals: Record<string, { name: string; color: string; amount: number; quantity: number }> = {};

    cart.forEach((item) => {
      const category = categories.find((c) => c.id === item.product.categoryId);
      const categoryId = category?.id || 'uncategorized';
      const categoryName = category?.name || 'ไม่มีหมวดหมู่';
      const categoryColor = category?.color || '#6B7280';

      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = { name: categoryName, color: categoryColor, amount: 0, quantity: 0 };
      }

      const itemTotal = item.product.price * item.quantity;
      const itemDiscount = item.discountType === 'percent'
        ? itemTotal * (item.discount / 100)
        : item.discount;

      categoryTotals[categoryId].amount += itemTotal - itemDiscount;
      categoryTotals[categoryId].quantity += item.quantity;
    });

    return Object.entries(categoryTotals).sort((a, b) => b[1].amount - a[1].amount);
  }, [cart, categories]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('กรุณาเพิ่มสินค้าในตะกร้า');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!user?.id) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการชำระเงิน');
      return;
    }

    if (amountReceived < total && selectedPaymentMethod === 'cash') {
      toast.error('จำนวนเงินไม่เพียงพอ');
      return;
    }

    // Create bill items
    const billItems: BillItem[] = cart.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      const itemDiscount = item.discountType === 'percent'
        ? itemTotal * (item.discount / 100)
        : item.discount;

      return {
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discount: itemDiscount,
        total: itemTotal - itemDiscount,
      };
    });

    console.log('Payment Debug - User:', user);
    console.log('Payment Debug - User ID:', user?.id);

    const payload: CheckoutPayload = {
      userId: user?.id || '', // Use authenticated user's ID
      paymentMethod: selectedPaymentMethod,
      subtotal,
      discountAmount: discount,
      discountPercent: globalDiscountType === 'percent' ? globalDiscount : 0,
      surchargeAmount: surcharge,
      surchargePercent: globalSurchargeType === 'percent' ? globalSurcharge : 0,
      taxAmount: tax,
      totalAmount: total,
      amountReceived: selectedPaymentMethod === 'cash' ? amountReceived : total,
      changeAmount: selectedPaymentMethod === 'cash' ? Math.max(change, 0) : 0,
      items: billItems,
    };

    console.log('Payment Debug - Payload:', payload);

    try {
      const response = await checkoutMutation.mutateAsync(payload);

      toast.success('ชำระเงินสำเร็จ!', {
        description: `ยอดรวม ${formatCurrency(total)} บาท`,
      });

      setCurrentBill(response.bill);
      clearCart();
      setShowPaymentDialog(false);
      setAmountReceived(0);
      setSelectedPaymentMethod('cash');
      setGlobalDiscount(0, 'percent');
      setGlobalSurcharge(0, 'percent');
      setShowBillDialog(true);
    } catch (error: any) {
      const message = error?.message || 'ชำระเงินไม่สำเร็จ กรุณาลองใหม่';
      toast.error(message);
    }
  };

  const quickAmounts = [20, 50, 100, 500, 1000];
  const isProcessingPayment = checkoutMutation.isPending;
  const isLoadingData = isLoadingProducts || isLoadingCategories || isLoadingPayments;

  if (isLoadingData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 animate-fade-in">

      {/* Products Section */}
      <div className={cn(
        "flex-1 flex flex-col gap-4 min-w-0 h-full transition-all duration-300",
        mobileTab === 'cart' ? "hidden lg:flex" : "flex"
      )}>
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
            {categories.map((category) => (
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
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Mobile cart icon button */}
          <button
            onClick={() => setMobileTab('cart')}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-md flex-shrink-0 active:scale-95 transition-transform"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Products Grid/List */}
        <ScrollArea className="flex-1">
          <div
            className={cn(
              'gap-3 pb-4',
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]'
                : 'flex flex-col'
            )}
          >
            {filteredProducts.map((product, index) => {
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock === 0;
              const category = categories.find((c) => c.id === product.categoryId) || product.category;

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
                      <CardContent className="p-4 h-full flex flex-col items-center text-center justify-between">
                        <div className="w-full">
                          {/* Name */}
                          <p className="font-semibold text-lg line-clamp-1 mb-2">{product.name}</p>

                          {/* Category and Badges */}
                          <div className="flex flex-wrap justify-center gap-2 mb-3">
                            {category && (
                              <div
                                className="px-3 py-0.5 rounded-full text-[12px] border font-medium transition-colors"
                                style={{
                                  backgroundColor: `${category.color}15`,
                                  color: category.color,
                                  borderColor: `${category.color}40`
                                }}
                              >
                                {category.name}
                              </div>
                            )}
                            {isLowStock && !isOutOfStock && (
                              <Badge variant="destructive" className="text-[10px] h-6 px-2 font-normal rounded-full">
                                ใกล้หมด
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="w-full py-1">
                          <div className="bg-primary/10 border border-primary/20 rounded-xl py-2 px-4 mb-2 inline-block w-full max-w-[180px]">
                            <p className="text-xl font-bold text-primary">
                              ฿{formatCurrency(product.price)}
                              <span className="text-sm font-normal text-primary/70 ml-1">/{product.stockUnit}</span>
                            </p>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="w-full text-center">
                          <p className={cn(
                            "text-sm font-medium",
                            isLowStock ? "text-red-500" : "text-muted-foreground"
                          )}>
                            คงเหลือ: {product.stock} {product.stockUnit}
                          </p>
                          {product.promoQuantity && (
                            <p className="text-[10px] text-orange-500 mt-1">
                              โปร: {product.promoQuantity} {product.stockUnit} = ฿{product.promoPrice}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex items-center gap-4 p-4 w-full">
                      <div className="flex-1 min-w-0">
                        {category && (
                          <Badge
                            className="text-[10px] mb-1"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </Badge>
                        )}
                        <p className="font-medium truncate">{product.name}</p>
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

      {/* Cart Section — full-screen overlay on mobile, sidebar on desktop */}
      <Card className={cn(
        "flex flex-col glass transition-all duration-300",
        "lg:w-80 xl:w-96",
        // Mobile: fixed full-screen overlay
        mobileTab === 'products'
          ? "hidden lg:flex"
          : "flex fixed inset-0 z-40 rounded-none lg:relative lg:inset-auto lg:rounded-lg lg:z-auto"
      )}>
        <CardHeader className="pb-3 border-b mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden -ml-1 h-8 w-8"
                onClick={() => setMobileTab('products')}
              >
                <ArrowRightLeft className="h-4 w-4 rotate-180" />
              </Button>
              <CardTitle className="font-display text-lg">ตะกร้าสินค้า</CardTitle>
              {/* Mobile item count */}
              {cartItemCount > 0 && (
                <span className="lg:hidden text-xs font-medium text-muted-foreground">
                  ({cartItemCount} รายการ)
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive h-8 px-2">
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        ฿{formatCurrency(item.product.price)} x {item.quantity}
                      </p>
                      {item.product.promoQuantity && item.product.promoPrice && item.quantity >= item.product.promoQuantity && (
                        <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 h-5 px-1.5">
                          โปรโมชัน
                        </Badge>
                      )}
                    </div>
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
                      ฿{formatCurrency(calculateItemTotal(item))}
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
            {globalSurcharge > 0 && (
              <div className="flex justify-between text-orange-500">
                <span>ส่วนต่าง</span>
                <span>+฿{formatCurrency(surcharge)}</span>
              </div>
            )}
            {vatEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT {taxRate}%</span>
                <span>฿{formatCurrency(tax)}</span>
              </div>
            )}
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
              ส่วนลด/ต่าง
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

            {/* Sales by Category */}
            {salesByCategory.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">ยอดขายแยกตามหมวดหมู่</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {salesByCategory.map(([categoryId, data]) => (
                    <div
                      key={categoryId}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-sm">{data.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {data.quantity} กรัม
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold">
                        ฿{formatCurrency(data.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-2">
              {availablePaymentMethods.map((method) => {
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
              disabled={
                isProcessingPayment ||
                (selectedPaymentMethod === 'cash' && amountReceived < total)
              }
            >
              {isProcessingPayment ? 'กำลังประมวลผล...' : 'ยืนยันการชำระ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount & Surcharge Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">ส่วนลด / ส่วนต่าง</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* ส่วนลด */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-destructive flex items-center gap-1"><Percent className="h-4 w-4" /> ส่วนลด</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((v) => (
                  <Button key={v} variant="outline" size="sm"
                    className={globalDiscount === v ? 'border-destructive text-destructive' : ''}
                    onClick={() => setGlobalDiscount(v, 'percent')}>
                    {v}%
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Input type="number" placeholder="กรอกส่วนลด %"
                  value={globalDiscount || ''}
                  onChange={(e) => setGlobalDiscount(Number(e.target.value), 'percent')}
                  className="pr-8" />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {globalDiscount > 0 && (
                <p className="text-xs text-destructive">ลด ฿{formatCurrency(discount)}</p>
              )}
            </div>

            <div className="border-t" />

            {/* ส่วนต่าง */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-orange-500 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> ส่วนต่าง (บวกเพิ่ม)
                </p>
                {/* Toggle % / ฿ */}
                <div className="flex rounded-lg border border-orange-300 overflow-hidden text-xs">
                  <button
                    className={`px-2.5 py-1 transition-colors ${globalSurchargeType === 'percent' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                    onClick={() => setGlobalSurcharge(globalSurcharge, 'percent')}
                  >%</button>
                  <button
                    className={`px-2.5 py-1 transition-colors ${globalSurchargeType === 'amount' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                    onClick={() => setGlobalSurcharge(globalSurcharge, 'amount')}
                  >฿</button>
                </div>
              </div>

              {globalSurchargeType === 'percent' ? (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((v) => (
                      <Button key={v} variant="outline" size="sm"
                        className={globalSurcharge === v ? 'border-orange-500 text-orange-500' : ''}
                        onClick={() => setGlobalSurcharge(v, 'percent')}>
                        {v}%
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <Input type="number" placeholder="กรอกส่วนต่าง %"
                      value={globalSurcharge || ''}
                      onChange={(e) => setGlobalSurcharge(Number(e.target.value), 'percent')}
                      className="pr-8" />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {[20, 50, 100, 200].map((v) => (
                      <Button key={v} variant="outline" size="sm"
                        className={globalSurcharge === v ? 'border-orange-500 text-orange-500' : ''}
                        onClick={() => setGlobalSurcharge(v, 'amount')}>
                        ฿{v}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">฿</span>
                    <Input type="number" placeholder="กรอกจำนวนเงิน"
                      value={globalSurcharge || ''}
                      onChange={(e) => setGlobalSurcharge(Number(e.target.value), 'amount')}
                      className="pl-7" />
                  </div>
                </>
              )}

              {globalSurcharge > 0 && (
                <p className="text-xs text-orange-500">
                  บวกเพิ่ม ฿{formatCurrency(surcharge)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setGlobalDiscount(0, 'percent');
              setGlobalSurcharge(0, 'percent');
              setShowDiscountDialog(false);
            }}>ล้างทั้งหมด</Button>
            <Button onClick={() => setShowDiscountDialog(false)}>ตกลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>ใบเสร็จรับเงิน</DialogTitle>
          </DialogHeader>
          <DialogHeader>
            <DialogTitle className="font-display">บิลการขาย</DialogTitle>
          </DialogHeader>
          {currentBill && (
            <BillReceipt
              bill={currentBill}
              storeName={systemSettings?.store?.storeName}
              onClose={() => setShowBillDialog(false)}
              showCloseButton={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
