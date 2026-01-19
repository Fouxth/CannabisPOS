import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// Permission definitions
export const PERMISSIONS = {
    // User Management
    MANAGE_USERS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN],
    VIEW_USERS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

    // Product Management
    MANAGE_PRODUCTS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
    VIEW_PRODUCTS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER],

    // Category Management
    MANAGE_CATEGORIES: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

    // Sales/POS
    CREATE_SALE: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
    VOID_SALE: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
    VIEW_SALES: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],

    // Stock Management
    MANAGE_STOCK: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
    VIEW_STOCK: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],

    // Reports & Analytics
    VIEW_REPORTS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
    VIEW_ANALYTICS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN],

    // Expenses
    MANAGE_EXPENSES: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN],
    VIEW_EXPENSES: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

    // Settings
    MANAGE_SETTINGS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN],

    // Promotions
    MANAGE_PROMOTIONS: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

    // Audit Logs
    VIEW_AUDIT_LOGS: [UserRole.SUPER_ADMIN, UserRole.OWNER],

    // Backup
    MANAGE_BACKUP: [UserRole.SUPER_ADMIN, UserRole.OWNER],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: PermissionKey) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
        }

        const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];

        if (!(allowedRoles as readonly string[]).includes(user.role)) {
            return res.status(403).json({
                message: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
                requiredPermission: permission,
            });
        }

        next();
    };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (...permissions: PermissionKey[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
        }

        const hasPermission = permissions.some(permission => {
            const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
            return (allowedRoles as readonly string[]).includes(user.role);
        });

        if (!hasPermission) {
            return res.status(403).json({
                message: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
            });
        }

        next();
    };
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: PermissionKey): boolean => {
    const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
    return (allowedRoles as readonly string[]).includes(role);
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): PermissionKey[] => {
    return (Object.keys(PERMISSIONS) as PermissionKey[]).filter(
        permission => (PERMISSIONS[permission] as readonly string[]).includes(role)
    );
};

/**
 * API endpoint to get permissions for current user
 */
export const getUserPermissions = (req: Request, res: Response) => {
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }

    const permissions = getPermissionsForRole(user.role as UserRole);

    res.json({
        role: user.role,
        permissions,
        permissionDetails: permissions.reduce((acc, perm) => {
            acc[perm] = true;
            return acc;
        }, {} as Record<string, boolean>),
    });
};
