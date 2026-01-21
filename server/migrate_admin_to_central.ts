
import { managementPrisma } from './src/lib/management-db';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('--- Migrating Super Admin to Central Management DB ---');

    // 1. Find the default tenant to get its DB URL (where old admin lives)
    // Actually, Super Admin 'dxv4th' is in 'cannabispos_default' usually.
    // Let's connect to it using DATABASE_URL from env
    const defaultPrisma = new PrismaClient(); // connects to DATABASE_URL

    const oldAdmin = await defaultPrisma.user.findFirst({
        where: { username: 'dxv4th' }
    });

    if (!oldAdmin) {
        console.error('❌ Could not find user "dxv4th" in default DB.');
        return;
    }

    console.log('Found Old Admin:', oldAdmin.username);

    // 2. Find the "Default" Tenant ID in Management DB
    // We need to link this user to the default tenant if applicable, 
    // OR keep tenantId null if they are System Super Admin.
    // The user 'dxv4th' is the owner of 'ร้านค้าหลัก' (slug: cannabispos_default)

    // Find tenant for 'ร้านค้าหลัก'
    const defaultTenant = await managementPrisma.tenant.findUnique({
        where: { slug: 'cannabispos_default' } // Use the slug we know
    });

    // Or find by dbName if slug is unsure
    const tenantByDb = await managementPrisma.tenant.findUnique({
        where: { dbName: 'cannabispos_default' }
    });

    const targetTenant = defaultTenant || tenantByDb;

    if (!targetTenant) {
        console.warn('⚠️ Could not find "cannabispos_default" tenant in Management DB. Creating user as System Admin (tenantId=null).');
    } else {
        console.log(`Linking to Tenant: ${targetTenant.name} (${targetTenant.id})`);
    }

    // 3. Create or Update in Management DB
    const existing = await managementPrisma.user.findUnique({
        where: { username: 'dxv4th' }
    });

    if (existing) {
        console.log('✅ User "dxv4th" already exists in Management DB. Updating...');
        await managementPrisma.user.update({
            where: { id: existing.id },
            data: {
                password: oldAdmin.password, // Keep same hash
                role: 'SUPER_ADMIN',
                tenantId: targetTenant?.id || null
            }
        });
    } else {
        console.log('✨ Creating "dxv4th" in Management DB...');
        await managementPrisma.user.create({
            data: {
                username: 'dxv4th',
                password: oldAdmin.password,
                role: 'SUPER_ADMIN',
                tenantId: targetTenant?.id || null,
                isActive: true
            }
        });
    }

    console.log('✅ Migration Complete.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await managementPrisma.$disconnect();
    });
