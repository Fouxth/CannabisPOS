
import { PrismaClient } from '@prisma/client';
import { managementPrisma } from './src/lib/management-db';

async function main() {
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
            where: { OR: [{ email: 'dxv4th' }, { employeeCode: 'SA001' }] }
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
                where: { OR: [{ email: 'dxv4th' }, { employeeCode: 'SA001' }] }
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
}

main()
    .catch(console.error)
    .finally(async () => {
        await managementPrisma.$disconnect();
    });
