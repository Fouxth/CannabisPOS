import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JwtPayload {
    id: string;
    username: string;
    role: string;
    tenantId?: string | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
};

import { managementPrisma } from '../lib/management-db';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    // When mounted on /api, req.path is relative to the mount point
    // So /api/auth/login becomes /auth/login
    const publicPaths = [
        '/auth/login',
        '/auth/tenant-status',
        '/health',
    ];

    // Skip authentication for public routes
    if (publicPaths.some(path => req.path === path || req.path.startsWith(path + '/'))) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // CRITICAL: Check if tenant is still active in DB
    if (payload.tenantId) {
        try {
            const tenant = await managementPrisma.tenant.findUnique({
                where: { id: payload.tenantId },
                select: { isActive: true }
            });

            if (!tenant || !tenant.isActive) {
                return res.status(403).json({ message: 'Shop is inactive. Please contact support.' });
            }
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({ message: 'Internal server error during auth check' });
        }
    }

    req.user = payload;
    next();
};
