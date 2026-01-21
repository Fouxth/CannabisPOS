import express from 'express';
import { managementPrisma } from '../lib/management-db';
import { ProvisioningService } from '../services/ProvisioningService';
import { PrismaClient } from '../../generated/client/index.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Helper function to get tenant's Prisma client
async function getTenantPrisma(tenantId: string) {
    const tenant = await managementPrisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return new PrismaClient({
        datasources: {
            db: {
                url: tenant.dbUrl,
            },
        },
    });
}

// GET /api/management/stats - Overview statistics
router.get('/stats', async (req, res) => {
    try {
        const tenants = await managementPrisma.tenant.findMany({
            include: { domains: true },
        });

        const activeTenants = tenants.filter(t => t.isActive).length;
        let totalUsers = 0;
        let totalRevenue = 0;
        let totalSales = 0;

        // Aggregate stats from all tenants
        for (const tenant of tenants) {
            if (!tenant.isActive) continue;

            try {
                const tenantPrisma = await getTenantPrisma(tenant.id);

                // Count users
                const userCount = await tenantPrisma.user.count();
                totalUsers += userCount;

                // Sum revenue
                const bills = await tenantPrisma.bill.findMany({
                    where: { status: 'COMPLETED' },
                    select: { totalAmount: true },
                });
                const revenue = bills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);
                totalRevenue += revenue;
                totalSales += bills.length;

                await tenantPrisma.$disconnect();
            } catch (error) {
                console.error(`Failed to get stats for tenant ${tenant.id}:`, error);
            }
        }

        res.json({
            totalShops: tenants.length,
            activeShops: activeTenants,
            totalUsers,
            totalRevenue,
            totalSales,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

// GET /api/management/tenants
router.get('/tenants', async (req, res) => {
    try {
        const tenants = await managementPrisma.tenant.findMany({
            include: { domains: true },
            orderBy: { createdAt: 'desc' },
        });

        // Enrich with user count and last activity
        const enrichedTenants = await Promise.all(
            tenants.map(async (tenant) => {
                try {
                    const tenantPrisma = await getTenantPrisma(tenant.id);
                    const userCount = await tenantPrisma.user.count();

                    // Get last bill as activity indicator
                    const lastBill = await tenantPrisma.bill.findFirst({
                        orderBy: { createdAt: 'desc' },
                        select: { createdAt: true },
                    });

                    await tenantPrisma.$disconnect();

                    return {
                        ...tenant,
                        userCount,
                        lastActivity: lastBill?.createdAt || null,
                    };
                } catch (error) {
                    console.error(`Failed to enrich tenant ${tenant.id}:`, error);
                    return {
                        ...tenant,
                        userCount: 0,
                        lastActivity: null,
                    };
                }
            })
        );

        res.json(enrichedTenants);
    } catch (error) {
        console.error('Failed to fetch tenants:', error);
        res.status(500).json({ message: 'Failed to fetch tenants' });
    }
});

// GET /api/management/tenants/:id - Get tenant details with metrics
router.get('/tenants/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const tenant = await managementPrisma.tenant.findUnique({
            where: { id },
            include: { domains: true },
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const tenantPrisma = await getTenantPrisma(id);

        // Get various metrics
        const [userCount, productCount, categoryCount, todaySales, weekSales, monthSales] = await Promise.all([
            tenantPrisma.user.count(),
            tenantPrisma.product.count(),
            tenantPrisma.category.count(),
            tenantPrisma.bill.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
                _sum: { totalAmount: true },
                _count: true,
            }),
            tenantPrisma.bill.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                _sum: { totalAmount: true },
                _count: true,
            }),
            tenantPrisma.bill.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                _sum: { totalAmount: true },
                _count: true,
            }),
        ]);

        await tenantPrisma.$disconnect();

        res.json({
            ...tenant,
            metrics: {
                userCount,
                productCount,
                categoryCount,
                sales: {
                    today: {
                        count: todaySales._count,
                        revenue: Number(todaySales._sum.totalAmount || 0),
                    },
                    week: {
                        count: weekSales._count,
                        revenue: Number(weekSales._sum.totalAmount || 0),
                    },
                    month: {
                        count: monthSales._count,
                        revenue: Number(monthSales._sum.totalAmount || 0),
                    },
                },
            },
        });
    } catch (error: any) {
        console.error('Failed to fetch tenant details:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch tenant details' });
    }
});

// GET /api/management/tenants/:id/users - Get tenant users
router.get('/tenants/:id/users', async (req, res) => {
    const { id } = req.params;

    try {
        const tenant = await managementPrisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const tenantPrisma = await getTenantPrisma(id);

        const users = await tenantPrisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                employeeCode: true,
                // email: true, // Renamed/Removed in schema?
                fullName: true,
                nickname: true,
                phone: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        await tenantPrisma.$disconnect();

        res.json(users);
    } catch (error: any) {
        console.error('Failed to fetch tenant users:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch tenant users' });
    }
});

// POST /api/management/tenants/:id/users - Create a new user for a tenant
router.post('/tenants/:id/users', async (req, res) => {
    const { id: tenantId } = req.params;
    const { username, password, fullName, role = 'ADMIN', employeeCode } = req.body;

    if (!username || !password || !fullName || !employeeCode) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const tenant = await managementPrisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        // 1. Check if user exists in CENTRAL DB
        const existingUser = await managementPrisma.user.findUnique({ where: { username } });
        if (existingUser) return res.status(400).json({ message: 'Username already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Create in CENTRAL Management DB
        const newUserCentral = await managementPrisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
                tenantId,
                isActive: true
            }
        });

        // 3. Create in TENANT DB (Mirroring for FK integrity)
        const tenantPrisma = await getTenantPrisma(tenantId);
        await tenantPrisma.user.create({
            data: {
                id: newUserCentral.id, // KEEP ID SYNCED!
                username,
                password: hashedPassword,
                fullName,
                employeeCode,
                role: role as any,
                isActive: true
            }
        });
        await tenantPrisma.$disconnect();

        res.status(201).json(newUserCentral);
    } catch (error: any) {
        console.error('Failed to create tenant user:', error);
        res.status(500).json({ message: error.message || 'Failed to create user' });
    }
});

// GET /api/management/tenants/:id/stats - Get detailed tenant statistics
router.get('/tenants/:id/stats', async (req, res) => {
    const { id } = req.params;
    const { days = '30' } = req.query;

    try {
        const tenant = await managementPrisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const tenantPrisma = await getTenantPrisma(id);
        const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

        // Get daily sales for the period
        const bills = await tenantPrisma.bill.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: daysAgo },
            },
            select: {
                createdAt: true,
                totalAmount: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group by day
        const dailyStats = bills.reduce((acc: any, bill) => {
            const date = bill.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, revenue: 0, count: 0 };
            }
            acc[date].revenue += Number(bill.totalAmount);
            acc[date].count += 1;
            return acc;
        }, {});

        await tenantPrisma.$disconnect();

        res.json({
            dailyStats: Object.values(dailyStats),
            totalRevenue: bills.reduce((sum, b) => sum + Number(b.totalAmount), 0),
            totalSales: bills.length,
        });
    } catch (error: any) {
        console.error('Failed to fetch tenant stats:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch tenant stats' });
    }
});

// POST /api/management/tenants
router.post('/tenants', async (req, res) => {
    const { name, slug, domain, ownerName } = req.body;

    if (!name || !slug || !domain) {
        return res.status(400).json({ message: 'Missing required fields: name, slug, domain' });
    }

    try {
        const tenant = await ProvisioningService.createTenant(name, slug, domain, ownerName);

        // Auto-create default owner
        const username = `admin@${slug}`.toLowerCase();
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = ownerName || 'Shop Owner';

        // 1. Central DB
        const user = await managementPrisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'OWNER',
                tenantId: tenant.id,
                isActive: true
            }
        });

        // 2. Tenant DB
        const tenantPrisma = await getTenantPrisma(tenant.id);
        await tenantPrisma.user.create({
            data: {
                id: user.id,
                username,
                password: hashedPassword,
                fullName,
                employeeCode: 'OWN001',
                role: 'OWNER',
                isActive: true
            }
        });

        // 3. Create default payment methods
        await tenantPrisma.paymentMethod.createMany({
            data: [
                {
                    name: 'เงินสด',
                    nameEn: 'Cash',
                    type: 'CASH',
                    icon: 'Banknote',
                    isActive: true
                },
                {
                    name: 'โอนเงิน',
                    nameEn: 'Transfer',
                    type: 'TRANSFER',
                    icon: 'ArrowLeftRight',
                    isActive: true
                }
            ]
        });
        console.log('[Provisioning] ✅ Default payment methods created');

        // 4. Set default Store Settings
        await tenantPrisma.systemSetting.create({
            data: {
                key: 'store',
                value: {
                    storeName: name
                }
            }
        });
        console.log('[Provisioning] ✅ Default store settings created');

        await tenantPrisma.$disconnect();

        res.status(201).json({
            ...tenant,
            initialUser: {
                username,
                password
            }
        });
    } catch (error: any) {
        console.error('Failed to create tenant:', error);
        res.status(500).json({ message: error.message || 'Failed to create tenant' });
    }
});

// PATCH /api/management/tenants/:id
router.patch('/tenants/:id', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    try {
        const tenant = await managementPrisma.tenant.update({
            where: { id },
            data: { isActive },
            include: { domains: true },
        });
        res.json(tenant);
    } catch (error: any) {
        console.error('Failed to update tenant:', error);
        res.status(500).json({ message: error.message || 'Failed to update tenant' });
    }
});

// DELETE /api/management/tenants/:id - Delete tenant and its database
router.delete('/tenants/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const tenant = await managementPrisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Delete tenant record (domains will cascade delete)
        await managementPrisma.tenant.delete({
            where: { id },
        });

        // Note: In production, you might want to:
        // 1. Archive the database instead of deleting
        // 2. Drop the database: DROP DATABASE ${tenant.dbName}
        // 3. Add soft delete functionality

        res.json({ message: 'Tenant deleted successfully' });
    } catch (error: any) {
        console.error('Failed to delete tenant:', error);
        res.status(500).json({ message: error.message || 'Failed to delete tenant' });
    }
});

// GET /api/management/activity - Get recent activity across all tenants
router.get('/activity', async (req, res) => {
    const { limit = '50' } = req.query;

    try {
        const tenants = await managementPrisma.tenant.findMany({
            where: { isActive: true },
            include: { domains: true },
        });

        const activities: any[] = [];

        for (const tenant of tenants) {
            try {
                const tenantPrisma = await getTenantPrisma(tenant.id);

                // Get recent bills
                const recentBills = await tenantPrisma.bill.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        billNumber: true,
                        totalAmount: true,
                        createdAt: true,
                        user: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                });

                recentBills.forEach(bill => {
                    activities.push({
                        type: 'sale',
                        tenantId: tenant.id,
                        tenantName: tenant.name,
                        description: `ขายสินค้า ${bill.billNumber}`,
                        amount: Number(bill.totalAmount),
                        user: bill.user.fullName,
                        createdAt: bill.createdAt,
                    });
                });

                await tenantPrisma.$disconnect();
            } catch (error) {
                console.error(`Failed to get activity for tenant ${tenant.id}:`, error);
            }
        }

        // Sort by date and limit
        activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const limitedActivities = activities.slice(0, Number(limit));

        res.json(limitedActivities);
    } catch (error) {
        console.error('Failed to fetch activity:', error);
        res.status(500).json({ message: 'Failed to fetch activity' });
    }
});

export const managementRouter = router;
