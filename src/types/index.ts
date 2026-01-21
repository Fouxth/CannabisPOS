export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';

export interface User {
  id: string;
  employeeCode: string;
  username: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  productCount: number;
  parentId?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  promoQuantity?: number; // จำนวนที่ต้องซื้อเพื่อได้โปรโมชัน
  promoPrice?: number; // ราคาโปรโมชันเมื่อซื้อครบจำนวน
  stock: number;
  minStock: number;
  stockUnit: string;
  categoryId?: string;
  category?: Category;
  imageUrl?: string;
  isActive: boolean;
  showInPos: boolean;
  totalSold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'percent' | 'amount';
  note?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  userId: string;
  user?: User;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod: string;
  amountReceived: number;
  changeAmount: number;
  status: 'completed' | 'voided' | 'pending';
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  userId: string;
  user?: User;
  movementType: 'sale' | 'restock' | 'adjustment' | 'return' | 'damaged';
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameEn?: string;
  type: 'cash' | 'card' | 'transfer' | 'qr';
  icon: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayAvgOrder: number;
  weekSales: number;
  monthSales: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  salesByPayment: Record<string, number>;
  topProducts: { product: Product; quantity: number; revenue: number }[];
  salesByHour: { hour: number; sales: number; orders: number }[];
  recentSales: Sale[];
}

export interface ReportsOverview {
  weeklySales: { day: string; sales: number; orders: number }[];
  salesByPayment: Record<string, number>;
  categoryBreakdown: { name: string; value: number; color: string }[];
  topProducts: { product: Product; quantity: number; revenue: number }[];
  ordersByHour: { hour: number; orders: number; sales: number }[];
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    stockValue: number;
  };
  lowStockProducts: Product[];
  // Profit data
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  // Monthly breakdown
  monthlyBreakdown: {
    month: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }[];
  // BI Features
  alerts: {
    type: 'stock' | 'deadstock' | 'margin' | 'sales' | 'staff';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action?: string;
    productId?: string;
  }[];
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    factors: string[];
  }[];
  forecast: {
    next7Days: {
      total: number;
      confidence: number;
      daily: { date: string; projected: number }[];
    };
  };
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'inventory' | 'promotion' | 'pricing' | 'staffing';
    title: string;
    description: string;
    action: string;
    expectedImpact: string;
  }[];
  deadStock: {
    productId: string;
    productName: string;
    imageUrl: string;
    stock: number;
    daysSinceLastSale: number;
    valueAtCost: number;
    suggestedDiscount: number;
  }[];
  // Financials
  financials: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    transactions: FinancialTransaction[];
  };
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'rent' | 'utilities' | 'salary' | 'supplies' | 'marketing' | 'other';
  date: string;
  userId: string;
  user?: User;
  notes?: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  details: string;
  category: string;
  amount: number;
  recorder: string;
  referenceId?: string; // saleId or expenseId
}

export interface BillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  userId: string;
  user?: User;
  customerId?: string;
  customerName?: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountReceived: number;
  changeAmount: number;
  status: 'completed' | 'voided';
  createdAt: string;
  notes?: string;
}

export interface CheckoutItemInput {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CheckoutPayload {
  userId: string;
  customerId?: string;
  customerName?: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  amountReceived: number;
  changeAmount: number;
  items: CheckoutItemInput[];
  notes?: string;
}

export interface CheckoutResponse {
  bill: Bill;
  sale: Sale;
}

export interface StoreSettings {
  storeName: string;
  storeNameEn?: string;
  phone?: string;
  email?: string;
  address: string;
  taxId: string;
  dayClosingTime?: string; // e.g. "06:00"
}

export interface PosSettings {
  invoicePrefix: string;
  taxRate: number;
  vatEnabled: boolean;
  maxDiscountCashier: number;
  maxDiscountManager: number;
  showCostPrice: boolean;
  scanSound: boolean;
  autoPrintReceipt: boolean;
}

export interface SmsSettings {
  enabled: boolean;
  provider: string;
  apiKey?: string;
  sender?: string;
  recipients: string[];
  alerts: {
    realtimeSales: boolean;
    dailySummary: boolean;
    monthlySummary: boolean;
    lowStock: boolean;
    stockAdjustments: boolean;
  };
}

export interface AppNotificationSettings {
  lowStock: boolean;
  salesTarget: boolean;
  salesTargetAmount: number;
  sound: boolean;
}

export interface SettingsResponse {
  store: StoreSettings;
  pos: PosSettings;
  sms: SmsSettings;
  notifications: AppNotificationSettings;
}
