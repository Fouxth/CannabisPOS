import {
  AppNotificationSettings,
  Bill,
  Category,
  CheckoutPayload,
  CheckoutResponse,
  DashboardStats,
  PaymentMethod,
  PosSettings,
  Product,
  ReportsOverview,
  SettingsResponse,
  SmsSettings,
  StockMovement,
  StoreSettings,
  User,
  Expense,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
  }

  return response.blob();
}

export const api = {
  getProducts: () => request<Product[]>('/products'),
  getCategories: () => request<Category[]>('/categories'),
  getPaymentMethods: () => request<PaymentMethod[]>('/payment-methods'),
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) =>
    request<PaymentMethod>(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getDashboard: () => request<DashboardStats>('/dashboard'),
  getReportsOverview: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return request<ReportsOverview>(`/reports/overview${searchParams}`);
  },
  getStockMovements: () => request<StockMovement[]>('/stock/movements'),
  getUsers: () => request<User[]>('/users'),
  getBills: () => request<Bill[]>('/bills'),
  createBill: (payload: CheckoutPayload) =>
    request<CheckoutResponse>('/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSettings: () => request<SettingsResponse>('/settings'),
  updateSettings: (
    section: 'store' | 'pos' | 'sms' | 'notifications',
    data: StoreSettings | PosSettings | SmsSettings | AppNotificationSettings
  ) =>
    request(`/settings/${section}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  createCategory: (data: Partial<Category>) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
  createUser: (data: Partial<User>) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<User>) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
  getExpenses: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return request<Expense[]>(`/expenses${searchParams}`);
  },
  createExpense: (data: Partial<Expense>) =>
    request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id: string) =>
    request<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
  adjustStock: (data: {
    productId: string;
    userId: string;
    adjustmentType: 'add' | 'subtract' | 'set';
    quantity: number;
    reason?: string;
    notes?: string;
  }) =>
    request<{ product: Product; movement: StockMovement }>('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  backupData: () => requestBlob('/backup'),
  resetData: () =>
    request<{ message: string }>('/reset', {
      method: 'POST',
    }),
};

export { API_BASE_URL };
