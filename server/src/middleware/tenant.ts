import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantManager } from '../services/TenantManager';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            tenantPrisma?: PrismaClient;
            tenantId?: string;
        }
    }
}

import { tenantLocalStorage } from '../lib/db';

export const tenantResolver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Resolve tenant strictly by Authenticated User (Token)
        if (req.user && req.user.tenantId) {
            const tenantClient = await TenantManager.getTenantClientById(req.user.tenantId);
            if (!tenantClient) {
                return res.status(404).json({ message: 'Tenant not found or inactive' });
            }
            req.tenantId = req.user.tenantId;
            req.tenantPrisma = tenantClient;
            
            // Run downstream controllers inside the tenant context
            return tenantLocalStorage.run(req.tenantId, () => {
                next();
            });
        }

        // Fallback for public routes
        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        res.status(500).json({ message: 'Failed to resolve tenant' });
    }
};
