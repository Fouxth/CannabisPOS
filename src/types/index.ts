export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';

export interface User {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
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
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  cost: number;
  comparePrice?: number;
  stock: number;
  minStock: number;
  stockUnit: string;
  categoryId?: string;
  category?: Category;
  imageUrl?: string;
  isActive: boolean;
  showInPos: boolean;
  totalSold: number;
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
  productSku: string;
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
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayAvgOrder: number;
  weekSales: number;
  monthSales: number;
  lowStockCount: number;
  topProducts: { product: Product; quantity: number; revenue: number }[];
  salesByHour: { hour: number; sales: number; orders: number }[];
  recentSales: Sale[];
}
