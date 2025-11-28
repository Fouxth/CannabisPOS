import { Category, Product, PaymentMethod, Sale, DashboardStats } from '@/types';

export const mockCategories: Category[] = [
  { id: '1', name: 'ดอก', nameEn: 'Flower', slug: 'flower', color: '#10B981', icon: 'Flower2', isActive: true, productCount: 15, sortOrder: 1 },
  { id: '2', name: 'พรีโรล', nameEn: 'Pre-Roll', slug: 'pre-roll', color: '#F59E0B', icon: 'Cigarette', isActive: true, productCount: 8, sortOrder: 2 },
  { id: '3', name: 'สกัด', nameEn: 'Extract', slug: 'extract', color: '#8B5CF6', icon: 'Droplet', isActive: true, productCount: 12, sortOrder: 3 },
  { id: '4', name: 'กัมมี่', nameEn: 'Edibles', slug: 'edibles', color: '#EC4899', icon: 'Cookie', isActive: true, productCount: 10, sortOrder: 4 },
  { id: '5', name: 'อุปกรณ์', nameEn: 'Accessories', slug: 'accessories', color: '#6366F1', icon: 'Package', isActive: true, productCount: 20, sortOrder: 5 },
  { id: '6', name: 'เครื่องดื่ม', nameEn: 'Beverages', slug: 'beverages', color: '#14B8A6', icon: 'Coffee', isActive: true, productCount: 6, sortOrder: 6 },
];

export const mockProducts: Product[] = [
  { id: '1', sku: 'FL001', barcode: '8850123456001', name: 'OG Kush Premium', nameEn: 'OG Kush Premium', price: 450, cost: 280, stock: 50, minStock: 10, stockUnit: 'กรัม', categoryId: '1', imageUrl: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=200', isActive: true, showInPos: true, totalSold: 120 },
  { id: '2', sku: 'FL002', barcode: '8850123456002', name: 'Purple Haze', nameEn: 'Purple Haze', price: 520, cost: 320, stock: 35, minStock: 10, stockUnit: 'กรัม', categoryId: '1', imageUrl: 'https://images.unsplash.com/photo-1616690002178-4f15e7be98e2?w=200', isActive: true, showInPos: true, totalSold: 85 },
  { id: '3', sku: 'FL003', barcode: '8850123456003', name: 'Blue Dream', nameEn: 'Blue Dream', price: 480, cost: 300, stock: 8, minStock: 10, stockUnit: 'กรัม', categoryId: '1', imageUrl: 'https://images.unsplash.com/photo-1585063560666-34e11f3adda0?w=200', isActive: true, showInPos: true, totalSold: 95 },
  { id: '4', sku: 'PR001', barcode: '8850123456004', name: 'Classic Joint 1g', nameEn: 'Classic Joint 1g', price: 180, cost: 100, stock: 100, minStock: 20, stockUnit: 'มวน', categoryId: '2', imageUrl: 'https://images.unsplash.com/photo-1587320220755-81ff8eeda7cd?w=200', isActive: true, showInPos: true, totalSold: 250 },
  { id: '5', sku: 'PR002', barcode: '8850123456005', name: 'King Size Joint 2g', nameEn: 'King Size Joint 2g', price: 320, cost: 180, stock: 45, minStock: 15, stockUnit: 'มวน', categoryId: '2', imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=200', isActive: true, showInPos: true, totalSold: 180 },
  { id: '6', sku: 'EX001', barcode: '8850123456006', name: 'CBD Oil 500mg', nameEn: 'CBD Oil 500mg', price: 890, cost: 550, stock: 25, minStock: 5, stockUnit: 'ขวด', categoryId: '3', imageUrl: 'https://images.unsplash.com/photo-1611070022917-4e5c1e2e8b5e?w=200', isActive: true, showInPos: true, totalSold: 65 },
  { id: '7', sku: 'EX002', barcode: '8850123456007', name: 'THC Tincture', nameEn: 'THC Tincture', price: 1200, cost: 750, stock: 15, minStock: 5, stockUnit: 'ขวด', categoryId: '3', imageUrl: 'https://images.unsplash.com/photo-1611070022917-4e5c1e2e8b5e?w=200', isActive: true, showInPos: true, totalSold: 42 },
  { id: '8', sku: 'ED001', barcode: '8850123456008', name: 'Gummy Bears 10mg', nameEn: 'Gummy Bears 10mg', price: 250, cost: 150, stock: 60, minStock: 15, stockUnit: 'ซอง', categoryId: '4', imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=200', isActive: true, showInPos: true, totalSold: 320 },
  { id: '9', sku: 'ED002', barcode: '8850123456009', name: 'Chocolate Bar 50mg', nameEn: 'Chocolate Bar 50mg', price: 380, cost: 220, stock: 30, minStock: 10, stockUnit: 'แท่ง', categoryId: '4', imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200', isActive: true, showInPos: true, totalSold: 145 },
  { id: '10', sku: 'AC001', barcode: '8850123456010', name: 'Glass Bong Classic', nameEn: 'Glass Bong Classic', price: 1500, cost: 800, stock: 12, minStock: 3, stockUnit: 'ชิ้น', categoryId: '5', imageUrl: 'https://images.unsplash.com/photo-1576080981828-5e77fcdb5c50?w=200', isActive: true, showInPos: true, totalSold: 28 },
  { id: '11', sku: 'AC002', barcode: '8850123456011', name: 'Rolling Papers', nameEn: 'Rolling Papers', price: 45, cost: 20, stock: 200, minStock: 50, stockUnit: 'ห่อ', categoryId: '5', imageUrl: 'https://images.unsplash.com/photo-1587320022680-8de0cb5044e1?w=200', isActive: true, showInPos: true, totalSold: 580 },
  { id: '12', sku: 'BV001', barcode: '8850123456012', name: 'CBD Sparkling Water', nameEn: 'CBD Sparkling Water', price: 120, cost: 65, stock: 48, minStock: 12, stockUnit: 'ขวด', categoryId: '6', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200', isActive: true, showInPos: true, totalSold: 210 },
];

export const mockPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'เงินสด', nameEn: 'Cash', type: 'cash', icon: 'Banknote', isActive: true, isDefault: true },
  { id: '2', name: 'บัตรเครดิต/เดบิต', nameEn: 'Card', type: 'card', icon: 'CreditCard', isActive: true, isDefault: false },
  { id: '3', name: 'โอนเงิน', nameEn: 'Transfer', type: 'transfer', icon: 'ArrowRightLeft', isActive: true, isDefault: false },
  { id: '4', name: 'PromptPay', nameEn: 'PromptPay', type: 'qr', icon: 'QrCode', isActive: true, isDefault: false },
];

export const mockDashboardStats: DashboardStats = {
  todaySales: 28450,
  todayOrders: 45,
  todayAvgOrder: 632,
  weekSales: 185600,
  monthSales: 756800,
  lowStockCount: 3,
  topProducts: [
    { product: mockProducts[3], quantity: 45, revenue: 8100 },
    { product: mockProducts[7], quantity: 38, revenue: 9500 },
    { product: mockProducts[0], quantity: 25, revenue: 11250 },
    { product: mockProducts[10], quantity: 52, revenue: 2340 },
    { product: mockProducts[11], quantity: 30, revenue: 3600 },
  ],
  salesByHour: [
    { hour: 9, sales: 1200, orders: 3 },
    { hour: 10, sales: 2800, orders: 5 },
    { hour: 11, sales: 3500, orders: 7 },
    { hour: 12, sales: 4200, orders: 8 },
    { hour: 13, sales: 3800, orders: 6 },
    { hour: 14, sales: 2900, orders: 5 },
    { hour: 15, sales: 3200, orders: 6 },
    { hour: 16, sales: 2850, orders: 5 },
    { hour: 17, sales: 4000, orders: 0 },
  ],
  recentSales: [],
};
