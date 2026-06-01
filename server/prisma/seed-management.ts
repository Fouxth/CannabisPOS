import { PrismaClient } from '../src/generated/management';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Management DB seed...');

    // Clean existing data
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    // 1. Create Default Tenant
    console.log('Creating default tenant...');
    const tenant = await prisma.tenant.create({
        data: {
            id: 'default', // Force to match POS default tenantId
            name: 'CannabisPOS Default Store',
            slug: 'default',
            dbName: 'cannabispos_d4',
            dbUrl: process.env.DATABASE_URL || 'postgresql://dxv4th:Fouxth085829@157.85.101.30:5432/cannabispos_d4',
            plan: 'enterprise',
            isActive: true,
        }
    });
    console.log('✅ Created default tenant:', tenant.id);

    // 2. Create Admin user in Management DB linked to Tenant
    console.log('Creating admin user in Management DB...');
    const adminUser = await prisma.user.create({
        data: {
            id: 'E001', // Sync with the tenant DB ID or keep it as E001 (or auto)
            username: 'admin',
            password: await bcrypt.hash('admin123', 10),
            role: 'ADMIN',
            tenantId: tenant.id,
            isActive: true,
        }
    });
    console.log('✅ Created admin user in Management DB');

    // 3. Create Super Admin user in Management DB (tenantId is null)
    console.log('Creating super admin user in Management DB...');
    const superAdmin = await prisma.user.create({
        data: {
            id: 'SA001',
            username: 'dxv4th',
            password: await bcrypt.hash('@dev4th', 10),
            role: 'SUPER_ADMIN',
            tenantId: null,
            isActive: true,
        }
    });
    console.log('✅ Created Super Admin user in Management DB');

    console.log('🎉 Management Database seeded successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
