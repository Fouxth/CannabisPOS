import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Create backup
router.post('/create', requirePermission('MANAGE_BACKUP'), async (req, res) => {
    try {
        const { includeSettings = true, includeUsers = true } = req.body;

        const backupData: Record<string, any> = {
            metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                type: 'full',
            },
            categories: await req.tenantPrisma!.category.findMany(),
            products: await req.tenantPrisma!.product.findMany(),
            sales: await req.tenantPrisma!.sale.findMany({ include: { items: true } }),
            bills: await req.tenantPrisma!.bill.findMany({ include: { items: true } }),
            stockMovements: await req.tenantPrisma!.stockMovement.findMany(),
            expenses: await req.tenantPrisma!.expense.findMany(),
            notifications: await req.tenantPrisma!.notification.findMany(),
            promotions: await req.tenantPrisma!.promotion.findMany(),
        };

        if (includeSettings) {
            backupData.paymentMethods = await req.tenantPrisma!.paymentMethod.findMany();
            backupData.systemSettings = await req.tenantPrisma!.systemSetting.findMany();
        }

        if (includeUsers) {
            const users = await req.tenantPrisma!.user.findMany();
            // Remove passwords from backup
            backupData.users = users.map(({ password, ...user }) => user);
        }

        res.json({
            success: true,
            backup: backupData,
            downloadName: `cannabispos-backup-${new Date().toISOString().slice(0, 10)}.json`,
        });
    } catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({ message: 'Unable to create backup' });
    }
});

// Download backup as file
router.get('/download', requirePermission('MANAGE_BACKUP'), async (req, res) => {
    try {
        const backupData = {
            metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                type: 'full',
            },
            categories: await req.tenantPrisma!.category.findMany(),
            products: await req.tenantPrisma!.product.findMany(),
            sales: await req.tenantPrisma!.sale.findMany({ include: { items: true } }),
            bills: await req.tenantPrisma!.bill.findMany({ include: { items: true } }),
            stockMovements: await req.tenantPrisma!.stockMovement.findMany(),
            expenses: await req.tenantPrisma!.expense.findMany(),
            paymentMethods: await req.tenantPrisma!.paymentMethod.findMany(),
            systemSettings: await req.tenantPrisma!.systemSetting.findMany(),
            promotions: await req.tenantPrisma!.promotion.findMany(),
        };

        const json = JSON.stringify(backupData, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=cannabispos-backup-${new Date().toISOString().slice(0, 10)}.json`);
        res.send(json);
    } catch (error) {
        console.error('Download backup error:', error);
        res.status(500).json({ message: 'Unable to download backup' });
    }
});

// Restore from backup
router.post('/restore', requirePermission('MANAGE_BACKUP'), async (req, res) => {
    try {
        const { backup, options = {} } = req.body;
        const {
            restoreProducts = true,
            restoreCategories = true,
            restoreSettings = true,
            clearExisting = false,
        } = options;

        if (!backup || typeof backup !== 'object') {
            return res.status(400).json({ message: 'Invalid backup data' });
        }

        const result = await req.tenantPrisma!.$transaction(async (tx) => {
            const restored: Record<string, number> = {};

            // Clear existing data if requested
            if (clearExisting) {
                if (restoreCategories && backup.categories) {
                    await tx.category.deleteMany({});
                }
                if (restoreProducts && backup.products) {
                    await tx.product.deleteMany({});
                }
            }

            // Restore categories
            if (restoreCategories && backup.categories && Array.isArray(backup.categories)) {
                for (const category of backup.categories) {
                    await tx.category.upsert({
                        where: { id: category.id },
                        update: {
                            name: category.name,

                            slug: category.slug,
                            description: category.description,
                            color: category.color,
                            icon: category.icon,
                            isActive: category.isActive,
                            sortOrder: category.sortOrder,
                        },
                        create: category,
                    });
                }
                restored.categories = backup.categories.length;
            }

            // Restore products
            if (restoreProducts && backup.products && Array.isArray(backup.products)) {
                for (const product of backup.products) {
                    await tx.product.upsert({
                        where: { id: product.id },
                        update: {
                            name: product.name,

                            description: product.description,
                            price: product.price,
                            cost: product.cost,
                            stock: product.stock,
                            minStock: product.minStock,
                            categoryId: product.categoryId,
                            imageUrl: product.imageUrl,
                            isActive: product.isActive,
                        },
                        create: product,
                    });
                }
                restored.products = backup.products.length;
            }

            // Restore settings
            if (restoreSettings && backup.systemSettings && Array.isArray(backup.systemSettings)) {
                for (const setting of backup.systemSettings) {
                    await tx.systemSetting.upsert({
                        where: { key: setting.key },
                        update: { value: setting.value },
                        create: setting,
                    });
                }
                restored.systemSettings = backup.systemSettings.length;
            }

            return restored;
        });

        res.json({
            success: true,
            restored: result,
            message: 'Backup restored successfully',
        });
    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({ message: 'Unable to restore backup' });
    }
});

// Validate backup file
router.post('/validate', requirePermission('MANAGE_BACKUP'), async (req, res) => {
    try {
        const { backup } = req.body;

        if (!backup || typeof backup !== 'object') {
            return res.status(400).json({ valid: false, message: 'Invalid backup format' });
        }

        const validation = {
            valid: true,
            metadata: backup.metadata || null,
            counts: {
                categories: Array.isArray(backup.categories) ? backup.categories.length : 0,
                products: Array.isArray(backup.products) ? backup.products.length : 0,
                sales: Array.isArray(backup.sales) ? backup.sales.length : 0,
                bills: Array.isArray(backup.bills) ? backup.bills.length : 0,
                users: Array.isArray(backup.users) ? backup.users.length : 0,
            },
            warnings: [] as string[],
        };

        if (!backup.metadata) {
            validation.warnings.push('No metadata found in backup');
        }

        if (!backup.categories || backup.categories.length === 0) {
            validation.warnings.push('No categories in backup');
        }

        if (!backup.products || backup.products.length === 0) {
            validation.warnings.push('No products in backup');
        }

        res.json(validation);
    } catch (error) {
        console.error('Validate backup error:', error);
        res.status(500).json({ valid: false, message: 'Validation failed' });
    }
});

export const backupRouter = router;
