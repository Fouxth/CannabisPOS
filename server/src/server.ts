import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import { tenantResolver } from './middleware/tenant';
import { authenticateToken } from './middleware/auth';
import { managementRouter } from './routes/management';

// Import route modules
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { productsRouter } from './routes/products';
import { categoriesRouter } from './routes/categories';
import { billsRouter } from './routes/bills';
import { stockRouter } from './routes/stock';
import { settingsRouter } from './routes/settings';
import { expensesRouter } from './routes/expenses';
import { notificationsRouter } from './routes/notifications';
import { dashboardRouter } from './routes/dashboard';
import { reportsRouter } from './routes/reports';
import { paymentMethodsRouter } from './routes/paymentMethods';
import { promotionsRouter } from './routes/promotions';
import { auditLogsRouter } from './routes/auditLogs';
import { analyticsRouter } from './routes/analytics';
import { customersRouter } from './routes/customers';
import { printerRouter } from './routes/printer';
import { getUserPermissions, requirePermission } from './middleware/permissions';
import { backupRouter } from './routes/backup';

import { createServer } from 'http';
import { socketService } from './services/SocketService';

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Initialize Socket Service
socketService.init(httpServer);

app.use((req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            console.error(`[ERROR REQUEST] ${req.method} ${req.url} - Status: ${res.statusCode} - Origin: ${req.headers.origin}`);
        }
    });
    next();
});

const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.replace(/"/g, '').trim())
    : [];

const defaultOrigins = [
    'https://cannabis-4th.vercel.app',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4200',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173'
];

const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

console.log('CORS Allowed Origins:', allowedOrigins);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, postman, or same-origin)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);
app.use(express.json());

// Auth routes (Public, no auth/tenant needed)
app.use('/api/auth', authRouter);

// Apply auth middleware to all routes below
app.use('/api', authenticateToken);

// Management API (Protected by authenticateToken and requireSuperAdmin)
app.use('/api/management', managementRouter);

// Apply tenant resolver (Uses req.user from auth middleware)
app.use(tenantResolver);

// Mount route modules
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/bills', billsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/printer', printerRouter);
app.get('/api/permissions', getUserPermissions);
app.use('/api/backup', backupRouter);

// Reset endpoint (Strictly protected for SUPER_ADMIN or OWNER)
app.post('/api/reset', requirePermission('MANAGE_BACKUP'), async (req, res) => {
    try {
        if (!req.tenantPrisma || !req.tenantId) {
            return res.status(400).json({ message: 'Tenant context missing' });
        }

        await req.tenantPrisma.$transaction(async (tx) => {
            // Delete dependent records first
            await tx.saleItem.deleteMany({});
            await tx.billItem.deleteMany({});
            await tx.stockMovement.deleteMany({});

            // Then delete the main records
            await tx.sale.deleteMany({});
            await tx.bill.deleteMany({});

            // Reset product totalSold
            await tx.product.updateMany({
                data: { totalSold: 0 },
            });

            // Write Audit Log entry
            await tx.auditLog.create({
                data: {
                    tenantId: req.tenantId!,
                    userId: req.user?.id || 'system',
                    action: 'DATA_RESET',
                    entity: 'TenantData',
                    entityId: req.tenantId,
                    newValue: { resetAt: new Date().toISOString(), resetBy: req.user?.username }
                }
            });
        });

        res.json({ message: 'Transactional data has been reset successfully.' });
    } catch (error) {
        console.error('Data reset error', error);
        res.status(500).json({ message: 'Unable to reset data' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => {
        console.log(`🚀 API server running on http://localhost:${PORT}`);
    });
}

export default app;
