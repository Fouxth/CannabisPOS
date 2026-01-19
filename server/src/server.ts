import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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
import { getUserPermissions } from './middleware/permissions';
import { backupRouter } from './routes/backup';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
app.use(express.json());

// Management API (No tenant resolution needed)
app.use('/api/management', managementRouter);

// Apply tenant resolver
app.use(tenantResolver);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await req.tenantPrisma!.$queryRaw`SELECT 1`;
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed', error });
    }
});

// Auth routes (before auth middleware)
app.use('/api/auth', authRouter);

// Apply auth middleware to all routes below
app.use('/api', authenticateToken);

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
app.get('/api/permissions', getUserPermissions);
app.use('/api/backup', backupRouter);

// Reset endpoint
app.post('/api/reset', async (req, res) => {
    try {
        await req.tenantPrisma!.$transaction(async (tx) => {
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
        });

        res.json({ message: 'Transactional data has been reset successfully.' });
    } catch (error) {
        console.error('Data reset error', error);
        res.status(500).json({ message: 'Unable to reset data' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
});
