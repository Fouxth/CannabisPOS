
import { PrismaClient } from '@prisma/client';
import { managementPrisma } from './src/lib/management-db';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('--- Syncing Super Admin to Tenants ---');
    const tenants = await managementPrisma.tenant.findMany({ where: { isActive: true } });

    const superAdminData = {
        employeeCode: 'SA001',
        email: 'dxv4th',
        fullName: 'System Owner',
        nickname: 'Dev4th',
        role: 'SUPER_ADMIN',
        password: await bcrypt.hash('@dev4th', 10),
        isActive: true,
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    };

    for (const t of tenants) {
        console.log(`Syncing to ${t.name} (${t.dbName})...`);
        const tenantPrisma = new PrismaClient({
            datasources: { db: { url: t.dbUrl } }
        });

        try {
            const existing = await tenantPrisma.user.findFirst({
                where: { OR: [{ email: 'dxv4th' }, { employeeCode: 'SA001' }] }
            });

            if (!existing) {
                await tenantPrisma.user.create({
                    data: {
                        ...superAdminData,
                        role: 'SUPER_ADMIN' as any // Cast because enum might differ in types but string is same
                    }
                });
                console.log(`✅ Created dxv4th in ${t.dbName}`);
            } else {
                // Update password just in case
                await tenantPrisma.user.update({
                    where: { id: existing.id },
                    data: {
                        password: superAdminData.password,
                        role: 'SUPER_ADMIN' as any
                    }
                });
                console.log(`✅ Updated dxv4th in ${t.dbName}`);
            }
        } catch (e) {
            console.error(`❌ Failed to sync ${t.dbName}:`, e);
        } finally {
            await tenantPrisma.$disconnect();
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await managementPrisma.$disconnect();
    });
