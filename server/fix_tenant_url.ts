
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { managementPrisma } from './src/lib/management-db';

async function main() {
    console.log('--- Inspecting Tenant URLs ---');
    const tenants = await managementPrisma.tenant.findMany();

    const correctUrl = process.env.DATABASE_URL;
    if (!correctUrl) {
        throw new Error('DATABASE_URL not set in .env');
    }

    // Extract base credentials from .env URL
    // Format: postgresql://USER:PASS@HOST:PORT/DB
    const baseUrlParts = correctUrl.match(/(postgresql:\/\/[^@]+@[^/]+)\//);
    const correctBase = baseUrlParts ? baseUrlParts[1] : null;

    if (!correctBase) {
        throw new Error('Could not parse DATABASE_URL');
    }

    console.log(`Target Base URL (from .env): ${correctBase}`);

    for (const t of tenants) {
        console.log(`\nTenant: ${t.name} (${t.slug})`);
        console.log(`Current dbUrl: ${t.dbUrl.replace(/:([^:@]+)@/, ':****@')}`);

        // Construct new URL with correct credentials but keep the tenant DB name
        const tenantDbName = t.dbName;
        const newUrl = `${correctBase}/${tenantDbName}`;

        if (t.dbUrl !== newUrl) {
            console.log(`Mismatch detected! Updating to: ${newUrl.replace(/:([^:@]+)@/, ':****@')}`);

            await managementPrisma.tenant.update({
                where: { id: t.id },
                data: { dbUrl: newUrl }
            });
            console.log('✅ Updated.');
        } else {
            console.log('✅ URL matches.');
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await managementPrisma.$disconnect();
    });
