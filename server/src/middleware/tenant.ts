import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/client/index.js';
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

export const tenantResolver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Resolve by Authenticated User (Token) - Priority 1
        if (req.user && req.user.tenantId) {
            const tenantClient = await TenantManager.getTenantClientById(req.user.tenantId);
            if (!tenantClient) {
                return res.status(404).json({ message: 'Tenant not found or inactive' });
            }
            req.tenantPrisma = tenantClient;
            return next();
        }

        // 2. Resolve by Header (Legacy/Testing/Bypass) - Priority 2
        // Useful for tools like Postman or pre-login checks if configured
        const domain = req.headers['x-tenant-domain'] as string;
        if (domain) {
            const tenantClient = await TenantManager.getTenantClient(domain);
            if (tenantClient) {
                req.tenantPrisma = tenantClient;
                return next();
            }
        }

        // 3. Fallback: If no tenant resolved, continue. 
        // Routes requiring tenantPrisma should check for it.
        // Public routes (like login) don't need it.
        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        res.status(500).json({ message: 'Failed to resolve tenant' });
    }
};
