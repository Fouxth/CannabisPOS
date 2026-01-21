import { managementPrisma } from '../lib/management-db';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

export class ProvisioningService {
    static async createTenant(name: string, slug: string, domain: string, ownerName?: string) {
        const dbName = `cannabispos_tenant_${slug.replace(/-/g, '_')}`;
        const baseUrl = process.env.DATABASE_URL!;
        const dbUrl = baseUrl.replace(/\/[^/]+$/, `/${dbName}`);

        console.log(`[Provisioning] Creating tenant: ${name} (${slug})`);
        console.log(`[Provisioning] Target DB URL: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);

        // 1. Create Database
        try {
            await managementPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
            console.log(`[Provisioning] ✅ Database ${dbName} created.`);
        } catch (e: any) {
            if (e.meta?.code === '42P04' || e.message?.includes('already exists')) {
                console.log(`[Provisioning] ⚠️ Database ${dbName} already exists, skipping creation.`);
            } else {
                console.error('[Provisioning] ❌ Error creating DB:', e);
            }
        }

        // 2. Create Tenant Record
        let tenant;
        try {
            tenant = await managementPrisma.tenant.create({
                data: {
                    name,
                    slug,
                    dbName,
                    dbUrl,
                    ownerName,
                    domains: {
                        create: { domain },
                    },
                    isActive: true
                },
                include: { domains: true },
            });
            console.log('[Provisioning] ✅ Tenant record created');
        } catch (e) {
            console.error('[Provisioning] ❌ Failed to create tenant record:', e);
            throw e;
        }

        // 3. Create tables using prisma db push (execSync for reliability)
        console.log('[Provisioning] 🔄 Creating tables with prisma db push...');
        try {
            const result = execSync(
                'npx prisma db push --skip-generate --accept-data-loss',
                {
                    cwd: process.cwd(),
                    env: { ...process.env, DATABASE_URL: dbUrl },
                    encoding: 'utf-8',
                    timeout: 60000, // 60 second timeout
                    stdio: 'pipe'
                }
            );
            console.log('[Provisioning] Prisma output:', result);
            console.log('[Provisioning] ✅ Tables created successfully!');
        } catch (e: any) {
            console.error('[Provisioning] ❌ Table creation failed:', e.message);
            console.error('[Provisioning] stdout:', e.stdout);
            console.error('[Provisioning] stderr:', e.stderr);
            throw new Error('Failed to create database tables: ' + e.message);
        }

        return tenant;
    }
}
