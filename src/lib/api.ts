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

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token to localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-domain': window.location.hostname,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();

    // Check if tenant is inactive or not found (404 or 403)
    if (
      (response.status === 404 && text.includes('Tenant not found or inactive')) ||
      (response.status === 403 && text.includes('Shop is inactive'))
    ) {
      removeAuthToken();
      window.location.href = '/suspended';
      throw new Error('ร้านค้านี้ถูกปิดใช้งานชั่วคราว');
    }

    throw new Error(text || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'x-tenant-domain': window.location.hostname,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
  importProducts: (products: Partial<Product>[]) =>
    request<{ message: string; count: number }>('/products/bulk', {
      method: 'POST',
      body: JSON.stringify(products),
    }),
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
  sendTestSms: () =>
    request<{ message: string }>('/settings/test-sms', {
      method: 'POST',
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
  changePassword: (id: string, data: any) =>
    request<{ message: string }>(`/users/${id}/password`, {
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
    quantityChange: number;
    reason?: string;
    notes?: string;
    movementType?: 'ADJUSTMENT' | 'RESTOCK' | 'SOLD' | 'RETURNED' | 'WASTE' | 'AUDIT';
  }) =>
    request<{ product: Product; movement: StockMovement }>('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: async (payload: { username: string; password: string }) => {
    const response = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Save token to localStorage
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },
  backupData: () => requestBlob('/backup'),
  resetData: () =>
    request<{ message: string }>('/reset', {
      method: 'POST',
    }),
  // Management API
  getAdminStats: () => request<{
    totalShops: number;
    activeShops: number;
    totalUsers: number;
    totalRevenue: number;
    totalSales: number;
  }>('/management/stats'),
  getTenants: () => request<any[]>('/management/tenants'),
  getTenantDetails: (id: string) => request<any>(`/management/tenants/${id}`),
  getTenantUsers: (id: string) => request<any[]>(`/management/tenants/${id}/users`),
  getTenantStats: (id: string, days?: number) => {
    const params = days ? `?days=${days}` : '';
    return request<{
      dailyStats: Array<{ date: string; revenue: number; count: number }>;
      totalRevenue: number;
      totalSales: number;
    }>(`/management/tenants/${id}/stats${params}`);
  },
  getAdminActivity: (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return request<any[]>(`/management/activity${params}`);
  },
  createTenant: (data: { name: string; slug: string; domain: string; ownerName?: string }) =>
    request<any>('/management/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTenant: (id: string, data: { isActive: boolean }) =>
    request<any>(`/management/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTenant: (id: string) =>
    request<{ message: string }>(`/management/tenants/${id}`, {
      method: 'DELETE',
    }),
};

export { API_BASE_URL };
