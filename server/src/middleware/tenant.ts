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

export const tenantResolver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const domain = req.headers['x-tenant-domain'] as string || req.hostname;

        if (!domain) {
            return res.status(400).json({ message: 'Unable to determine tenant domain' });
        }

        const tenantClient = await TenantManager.getTenantClient(domain);

        if (!tenantClient) {
            return res.status(404).json({ message: 'Tenant not found or inactive' });
        }

        // Attach to request
        req.tenantPrisma = tenantClient;

        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        res.status(500).json({ message: 'Failed to resolve tenant' });
    }
};
