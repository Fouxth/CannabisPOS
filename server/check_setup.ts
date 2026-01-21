
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { managementPrisma } from './src/lib/management-db';

async function main() {
    console.log('--- Debugging Info ---');
    const url = process.env.MANAGEMENT_DATABASE_URL || '';
    console.log('MANAGEMENT_DATABASE_URL:', url.replace(/:([^:@]+)@/, ':****@'));
    const password = url.match(/:([^:@]+)@/)?.[1];
    console.log('Password Length:', password?.length);
    console.log('Password First Char:', password?.[0]);
    console.log('Password Last Char:', password?.[password.length - 1]);

    console.log('--- Checking Management DB ---');
    const domains = await managementPrisma.domain.findMany({ include: { tenant: true } });
    console.log(`Found ${domains.length} domains:`);
    for (const d of domains) {
        console.log(`- Domain: ${d.domain} -> Tenant: ${d.tenant.name} (DB: ${d.tenant.dbName})`);
    }

    if (domains.length === 0) {
        console.log('WARNING: No domains found. Backend might not allow localhost login if not mapped.');
    }

    console.log('\n--- Checking User "dxv4th" in Default DB ---');
    const defaultPrisma = new PrismaClient();
    try {
        const user = await defaultPrisma.user.findFirst({
            where: { OR: [{ username: 'dxv4th' }, { employeeCode: 'SA001' }] }
        });
        if (user) {
            console.log('✅ Found dxv4th in DEFAULT DB (DATABASE_URL)');
            console.log(user);
        } else {
            console.log('❌ dxv4th NOT found in DEFAULT DB');
        }
    } catch (e) {
        console.error('Error checking default DB:', e);
    }

    console.log('\n--- Checking User "dxv4th" in Tenant DBs ---');
    for (const d of domains) {
        const tenantUrl = d.tenant.dbUrl;
        console.log(`Checking Tenant DB: ${d.tenant.dbName}...`);

        const tenantPrisma = new PrismaClient({
            datasources: { db: { url: tenantUrl } }
        });

        try {
            const user = await tenantPrisma.user.findFirst({
                where: { OR: [{ username: 'dxv4th' }, { employeeCode: 'SA001' }] }
            });
            if (user) {
                console.log(`✅ Found dxv4th in ${d.tenant.dbName}`);
            } else {
                console.log(`❌ dxv4th NOT found in ${d.tenant.dbName}`);
            }
        } catch (e) {
            console.error(`Error checking ${d.tenant.dbName}:`, e);
        } finally {
            await tenantPrisma.$disconnect();
        }
    }

    console.log('\n--- Checking Tenant 24HR420 Manually ---');
    const manualUrl = 'postgresql://Dxv4th:%21Fourthzxx@103.142.150.196:5432/cannabispos_tenant_24HR420';
    const manualPrisma = new PrismaClient({ datasources: { db: { url: manualUrl } } });
    try {
        const user = await manualPrisma.user.findFirst({
            where: { OR: [{ username: 'dxv4th' }, { employeeCode: 'SA001' }] }
        });
        if (user) {
            console.log('✅ Found dxv4th in cannabispos_tenant_24HR420');
        } else {
            console.log('❌ dxv4th NOT found in cannabispos_tenant_24HR420 (might be empty DB)');
            // Try to query something generic or just successfull connection
            await manualPrisma.$executeRawUnsafe('SELECT 1');
            console.log('✅ Connection Sucessful (SELECT 1)');
        }
    } catch (e) {
        console.error('❌ Manual Connection Failed:', e);
    } finally {
        await manualPrisma.$disconnect();
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await managementPrisma.$disconnect();
    });
