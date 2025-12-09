import { managementPrisma } from '../src/lib/management-db';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const createTenant = async (name: string, slug: string, domain: string) => {
    const dbName = `cannabispos_tenant_${slug.replace(/-/g, '_')}`;
    // Construct DB URL for the new tenant based on the main DATABASE_URL
    // Assuming DATABASE_URL is like postgres://user:pass@host:port/dbname
    const baseUrl = process.env.DATABASE_URL!;
    const dbUrl = baseUrl.replace(/\/[^/]+$/, `/${dbName}`);

    console.log(`Creating tenant: ${name} (${slug})`);
    console.log(`Target Database: ${dbName}`);
    console.log(`Domain: ${domain}`);

    // 1. Create Database
    try {
        // We use managementPrisma to execute the CREATE DATABASE command.
        // This requires the user connected to management DB to have CREATEDB privilege.
        await managementPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Database ${dbName} created.`);
    } catch (e: any) {
        // Postgres error 42P04 means database already exists
        if (e.meta?.code === '42P04' || e.message?.includes('already exists')) {
            console.log(`⚠️ Database ${dbName} already exists, skipping creation.`);
        } else {
            console.error('❌ Error creating DB:', e);
            process.exit(1);
        }
    }

    // 2. Run Migrations
    console.log('🔄 Running migrations...');
    try {
        // Run prisma migrate deploy for the new database
        // We point to the default schema (prisma/schema.prisma) which is the Tenant Schema
        execSync(`DATABASE_URL="${dbUrl}" npx prisma migrate deploy`, { stdio: 'inherit' });
        console.log('✅ Migrations applied.');

        // 2.1 Run Seed
        console.log('🌱 Seeding database...');
        execSync(`DATABASE_URL="${dbUrl}" npx tsx prisma/seed.ts`, { stdio: 'inherit' });
        console.log('✅ Database seeded.');
    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
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
        console.log('✅ Tenant record created:', tenant);
    } catch (e) {
        console.error('❌ Failed to create tenant record:', e);
        process.exit(1);
    }
};

// Read args
const [name, slug, domain] = process.argv.slice(2);
if (!name || !slug || !domain) {
    console.error('Usage: tsx scripts/create-tenant.ts <name> <slug> <domain>');
    console.error('Example: tsx scripts/create-tenant.ts "My Shop" "myshop" "myshop.local"');
    process.exit(1);
}

createTenant(name, slug, domain);
