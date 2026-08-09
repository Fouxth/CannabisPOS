import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const INVALID_JWT_SECRETS = [
    'your-secret-key-change-in-production',
    'change-this-to-a-secure-random-secret-key',
    'change-this-secret',
    'secret',
    '123456',
    'password',
    'default_secret'
];

export const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (process.env.NODE_ENV === 'test') {
        return secret || 'test-jwt-secret-key-1234567890';
    }

    if (!secret || INVALID_JWT_SECRETS.includes(secret.trim().toLowerCase())) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or set to an insecure placeholder!');
    }

    if (process.env.NODE_ENV === 'production' && secret.length < 32) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters in production!');
    }

    return secret;
};

export interface JwtPayload {
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
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
};

export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, getJwtSecret()) as JwtPayload;
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
