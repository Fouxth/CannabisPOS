import { create } from 'zustand';
import { CartItem, Product, User } from '@/types';

interface POSState {
  // User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // Cart calculations
  calculateItemTotal: (item: CartItem) => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: () => number;
  getTotal: () => number;

  // Discount
  globalDiscount: number;
  globalDiscountType: 'percent' | 'amount';
  setGlobalDiscount: (amount: number, type: 'percent' | 'amount') => void;

  // Surcharge (ส่วนต่าง)
  globalSurcharge: number;
  globalSurchargeType: 'percent' | 'amount';
  getSurcharge: () => number;
  setGlobalSurcharge: (amount: number, type: 'percent' | 'amount') => void;

  // Payment
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  amountReceived: number;
  setAmountReceived: (amount: number) => void;

  // UI State
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  taxRate: number;
  vatEnabled: boolean;
  setTaxRate: (rate: number) => void;
  setVatEnabled: (enabled: boolean) => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  currentUser: null, // Will be set by authentication system
  setCurrentUser: (user) => set({ currentUser: user }),


  cart: [],
  addToCart: (product) => {
    const cart = get().cart;
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          {
            id: crypto.randomUUID(),
            product,
            quantity: 1,
            discount: 0,
            discountType: 'percent',
          },
        ],
      });
    }
  },
  updateCartItem: (id, updates) => {
    set({
      cart: get().cart.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  },
  removeFromCart: (id) => {
    set({ cart: get().cart.filter((item) => item.id !== id) });
  },
  clearCart: () => set({ cart: [], globalDiscount: 0, globalSurcharge: 0, amountReceived: 0 }),

  calculateItemTotal: (item: CartItem) => {
    let itemTotal = 0;
    // Calculate promotion if available
    if (item.product.promoQuantity && item.product.promoPrice && item.quantity >= item.product.promoQuantity) {
      const promoSets = Math.floor(item.quantity / item.product.promoQuantity);
      const remainingItems = item.quantity % item.product.promoQuantity;
      itemTotal = (promoSets * item.product.promoPrice) + (remainingItems * item.product.price);
    } else {
      itemTotal = item.product.price * item.quantity;
    }
    return itemTotal;
  },

  getSubtotal: () => {
    const { calculateItemTotal, cart } = get();
    return cart.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);

      // Apply item discount
      const itemDiscount = item.discountType === 'percent'
        ? itemTotal * (item.discount / 100)
        : item.discount;

      return sum + itemTotal - itemDiscount;
    }, 0);
  },
  getDiscount: () => {
    const { globalDiscount, globalDiscountType, getSubtotal } = get();
    const subtotal = getSubtotal();
    return globalDiscountType === 'percent'
      ? subtotal * (globalDiscount / 100)
      : globalDiscount;
  },
  getSurcharge: () => {
    const { globalSurcharge, globalSurchargeType, getSubtotal, getDiscount } = get();
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const base = subtotal - discount;
    return globalSurchargeType === 'percent'
      ? base * (globalSurcharge / 100)
      : globalSurcharge;
  },
  getTax: () => {
    const { vatEnabled, taxRate, getSubtotal, getDiscount, getSurcharge } = get();
    if (!vatEnabled) return 0;

    const subtotal = getSubtotal();
    const discount = getDiscount();
    const surcharge = getSurcharge();
    return (subtotal - discount + surcharge) * (taxRate / 100);
  },
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    const surcharge = get().getSurcharge();
    const tax = get().getTax();
    return subtotal - discount + surcharge + tax;
  },

  globalDiscount: 0,
  globalDiscountType: 'percent',
  setGlobalDiscount: (amount, type) => set({ globalDiscount: amount, globalDiscountType: type }),

  globalSurcharge: 0,
  globalSurchargeType: 'percent',
  setGlobalSurcharge: (amount, type) => set({ globalSurcharge: amount, globalSurchargeType: type }),

  selectedPaymentMethod: 'cash',
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  amountReceived: 0,
  setAmountReceived: (amount) => set({ amountReceived: amount }),

  selectedCategory: null,
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),
  taxRate: 7,
  vatEnabled: true,
  setTaxRate: (rate) => set({ taxRate: rate }),
  setVatEnabled: (enabled: boolean) => set({ vatEnabled: enabled }),
}));
