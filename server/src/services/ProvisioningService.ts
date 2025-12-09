import { managementPrisma } from '../lib/management-db';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

export class ProvisioningService {
    static async createTenant(name: string, slug: string, domain: string) {
        const dbName = `cannabispos_tenant_${slug.replace(/-/g, '_')}`;
        const baseUrl = process.env.DATABASE_URL!;
        const dbUrl = baseUrl.replace(/\/[^/]+$/, `/${dbName}`);

        console.log(`[Provisioning] Creating tenant: ${name} (${slug})`);

        // 1. Create Database
        try {
            await managementPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
            console.log(`[Provisioning] ✅ Database ${dbName} created.`);
        } catch (e: any) {
            if (e.meta?.code === '42P04' || e.message?.includes('already exists')) {
                console.log(`[Provisioning] ⚠️ Database ${dbName} already exists, skipping creation.`);
            } else {
                console.error('[Provisioning] ❌ Error creating DB:', e);
                throw e;
            }
        }

        // 2. Run Migrations & Seed
        console.log('[Provisioning] 🔄 Running migrations...');
        try {
            execSync(`DATABASE_URL="${dbUrl}" npx prisma migrate deploy`, { stdio: 'inherit' });
            console.log('[Provisioning] ✅ Migrations applied.');

            console.log('[Provisioning] 🌱 Seeding database...');
            execSync(`DATABASE_URL="${dbUrl}" npx tsx prisma/seed.ts`, { stdio: 'inherit' });
            console.log('[Provisioning] ✅ Database seeded.');
        } catch (e) {
            console.error('[Provisioning] ❌ Migration/Seed failed:', e);
            throw e;
        }

        // 3. Create Tenant Record
        try {
            const tenant = await managementPrisma.tenant.create({
                data: {
                    name,
                    slug,
                    dbName,
                    dbUrl,
                    domains: {
                        create: {
                            domain,
                        },
                    },
                },
                include: {
                    domains: true,
                },
            });
            console.log('[Provisioning] ✅ Tenant record created:', tenant);
            return tenant;
        } catch (e) {
            console.error('[Provisioning] ❌ Failed to create tenant record:', e);
            throw e;
        }
    }
}
