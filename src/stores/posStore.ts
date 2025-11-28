import { create } from 'zustand';
import { CartItem, Product, User, Category, PaymentMethod } from '@/types';

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
  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: () => number;
  getTotal: () => number;

  // Discount
  globalDiscount: number;
  globalDiscountType: 'percent' | 'amount';
  setGlobalDiscount: (amount: number, type: 'percent' | 'amount') => void;

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
}

export const usePOSStore = create<POSState>((set, get) => ({
  currentUser: {
    id: '1',
    employeeCode: 'E001',
    email: 'cashier@store.com',
    fullName: 'สมชาย ใจดี',
    role: 'CASHIER',
    isActive: true,
  },
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
  clearCart: () => set({ cart: [], globalDiscount: 0, amountReceived: 0 }),

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
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
  getTax: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    return (subtotal - discount) * 0.07; // 7% VAT
  },
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    const tax = get().getTax();
    return subtotal - discount + tax;
  },

  globalDiscount: 0,
  globalDiscountType: 'percent',
  setGlobalDiscount: (amount, type) => set({ globalDiscount: amount, globalDiscountType: type }),

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
}));
