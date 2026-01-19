import { useMemo } from 'react';
import { useAuth } from './useAuth';

// Permission keys matching backend
const PERMISSIONS = {
    MANAGE_USERS: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
    VIEW_USERS: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    MANAGE_PRODUCTS: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    VIEW_PRODUCTS: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
    MANAGE_CATEGORIES: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    CREATE_SALE: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
    VOID_SALE: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    VIEW_SALES: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
    MANAGE_STOCK: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    VIEW_STOCK: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
    VIEW_REPORTS: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    VIEW_ANALYTICS: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
    MANAGE_EXPENSES: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
    VIEW_EXPENSES: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    MANAGE_SETTINGS: ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
    MANAGE_PROMOTIONS: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'],
    VIEW_AUDIT_LOGS: ['SUPER_ADMIN', 'OWNER'],
    MANAGE_BACKUP: ['SUPER_ADMIN', 'OWNER'],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Hook for checking user permissions on the frontend
 */
export function usePermissions() {
    const { user } = useAuth();
    const role = user?.role || '';

    const permissions = useMemo(() => {
        const can = (permission: PermissionKey): boolean => {
            const allowedRoles = PERMISSIONS[permission] || [];
            return (allowedRoles as readonly string[]).includes(role);
        };

        const canAny = (...perms: PermissionKey[]): boolean => {
            return perms.some(p => can(p));
        };

        const canAll = (...perms: PermissionKey[]): boolean => {
            return perms.every(p => can(p));
        };

        // Pre-computed common permission checks
        return {
            can,
            canAny,
            canAll,
            role,

            // Quick access to common permissions
            canManageUsers: can('MANAGE_USERS'),
            canViewUsers: can('VIEW_USERS'),
            canManageProducts: can('MANAGE_PRODUCTS'),
            canManageStock: can('MANAGE_STOCK'),
            canCreateSale: can('CREATE_SALE'),
            canVoidSale: can('VOID_SALE'),
            canViewReports: can('VIEW_REPORTS'),
            canViewAnalytics: can('VIEW_ANALYTICS'),
            canManageSettings: can('MANAGE_SETTINGS'),
            canManageExpenses: can('MANAGE_EXPENSES'),
            canManagePromotions: can('MANAGE_PROMOTIONS'),
            canViewAuditLogs: can('VIEW_AUDIT_LOGS'),
            canManageBackup: can('MANAGE_BACKUP'),

            // Role checks
            isAdmin: ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role),
            isManager: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER'].includes(role),
            isCashier: role === 'CASHIER',
            isViewer: role === 'VIEWER',
        };
    }, [role]);

    return permissions;
}

/**
 * Component wrapper for permission-based rendering
 */
interface PermissionGateProps {
    permission: PermissionKey | PermissionKey[];
    require?: 'any' | 'all';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function PermissionGate({
    permission,
    require = 'any',
    children,
    fallback = null
}: PermissionGateProps) {
    const { can, canAny, canAll } = usePermissions();

    const hasPermission = Array.isArray(permission)
        ? require === 'all' ? canAll(...permission) : canAny(...permission)
        : can(permission);

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}
