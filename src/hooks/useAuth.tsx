import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

// Role based on the system requirements
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  employeeCode?: string;
  role: UserRole;
  avatarUrl?: string;
  storeId?: string;
}

// Permission definitions
export const PERMISSIONS: Record<string, UserRole[]> = {
  // Dashboard
  view_dashboard: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  view_full_analytics: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  view_financial_summary: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],

  // POS
  use_pos: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
  apply_discount: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
  apply_unlimited_discount: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  void_transaction: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],

  // Products
  view_products: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  create_product: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  edit_product: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  delete_product: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  view_product_cost: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],

  // Categories
  view_categories: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  create_category: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  edit_category: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  delete_category: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],

  // Stock
  view_stock: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  adjust_stock: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  view_stock_history: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  view_stock_value: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],

  // Reports
  view_sales_report: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  view_inventory_report: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  view_profit_report: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  view_employee_report: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  export_reports: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],

  // Users
  view_users: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  create_user: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  edit_user: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  delete_user: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  manage_roles: ['SUPER_ADMIN', 'OWNER'],

  // Settings
  view_settings: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
  edit_store_settings: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  manage_payment_methods: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],

  // Bills
  view_bills: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
};

export type Permission = keyof typeof PERMISSIONS;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await api.login({ username, password });
          set({ user: response.user, isAuthenticated: true });
          return true;
        } catch (error) {
          console.error('Login failed', error);
          return false;
        }
      },

      logout: () => {
        // Remove token from localStorage
        import('@/lib/api').then(({ removeAuthToken }) => removeAuthToken());
        set({ user: null, isAuthenticated: false });
      },

      hasPermission: (permission: Permission) => {
        const { user } = get();
        if (!user) return false;
        const allowedRoles = PERMISSIONS[permission];
        return allowedRoles.includes(user.role);
      },

      hasAnyPermission: (permissions: Permission[]) => {
        const { hasPermission } = get();
        return permissions.some((p) => hasPermission(p));
      },

      hasAllPermissions: (permissions: Permission[]) => {
        const { hasPermission } = get();
        return permissions.every((p) => hasPermission(p));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Role display names
export const ROLE_NAMES: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'เจ้าของร้าน',
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  CASHIER: 'พนักงานขาย',
  VIEWER: 'ผู้ดูอย่างเดียว',
};

// Role colors for badges
export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-red-500',
  OWNER: 'bg-purple-500',
  ADMIN: 'bg-blue-500',
  MANAGER: 'bg-green-500',
  CASHIER: 'bg-yellow-500',
  VIEWER: 'bg-gray-500',
};
